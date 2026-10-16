/* PanelBuilder · prototipo v0.10: corrección del unifilar y limpieza del editor físico */
(() => {
'use strict';
const E=window.PanelEngine, M=window.PanelMultibrand, $=id=>document.getElementById(id), clone=o=>JSON.parse(JSON.stringify(o));
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const library=[
  {kind:'MCB',label:'Magnetotérmico',symbol:'MT',modules:2,poles:'2P',amp:16,curve:'C',name:'Protección magnetotérmica'},
  {kind:'MCB1',label:'Magnetotérmico 1P+N',symbol:'MT',modules:2,poles:'1P+N',amp:16,curve:'C',name:'Protección magnetotérmica'},
  {kind:'RCD',label:'Interruptor diferencial',symbol:'ID',modules:2,poles:'2P',amp:40,sensitivity:30,rcdType:'A',name:'Protección diferencial'},
  {kind:'SPD',label:'Sobretensiones',symbol:'SPD',modules:2,poles:'2P',amp:0,name:'Protector de sobretensiones'},
  {kind:'SWITCH',label:'Interruptor-seccionador',symbol:'IS',modules:2,poles:'2P',amp:40,name:'Seccionamiento'},
  {kind:'CONTACT',label:'Contactor',symbol:'KM',modules:2,poles:'2P',amp:25,name:'Contactor'}
];
const typeOf=t=>t==='MCB1'?'MCB':t;
const demo=()=>({version:11,counter:5,brand:'Generico',active:'A',alternatives:{A:{name:'Alternativa A',reserve:20,rows:0,slots:0,layoutDirty:true,circuits:[],busbars:[],auxiliaryZones:{bars:{},circuits:{}},devices:[
 {id:'d1',kind:'MCB',label:'Q0',name:'IGA (función)',poles:'2P',amp:40,curve:'C',modules:2,parent:null,row:null,pos:null},
 {id:'d2',kind:'RCD',label:'ID1',name:'Diferencial grupo alumbrado',poles:'2P',amp:40,sensitivity:30,rcdType:'A',modules:2,parent:'d1',row:null,pos:null},
 {id:'d3',kind:'MCB',label:'Q1',name:'C1 · Alumbrado',poles:'2P',amp:10,curve:'C',modules:2,parent:'d2',row:null,pos:null},
 {id:'d4',kind:'MCB',label:'Q2',name:'C2 · Tomas generales',poles:'2P',amp:16,curve:'C',modules:2,parent:'d2',row:null,pos:null}
 ]}}});
function demoLarge(){
 const project=demo(),a=project.alternatives.A;project.counter=20;
 a.devices=[{id:'d1',kind:'MCB',label:'Q0',name:'IGA · Cuadro general',poles:'2P',amp:40,curve:'C',modules:2,parent:null,row:null,pos:null}];
 for(let n=0;n<4;n++)a.devices.push({id:'d'+(n+2),kind:'RCD',label:'ID'+(n+1),name:'Grupo diferencial '+(n+1),poles:'2P',amp:40,sensitivity:30,rcdType:'A',modules:2,parent:'d1',row:null,pos:null});
 for(let i=0;i<14;i++)a.devices.push({id:'d'+(i+6),kind:'MCB',label:'Q'+(i+1),name:'Circuito '+(i+1),poles:'2P',amp:i%3===0?10:16,curve:'C',modules:2,parent:'d'+(Math.min(3,Math.floor(i/4))+2),row:null,pos:null});
 return project;
}
const key='PanelBuilder_v11_workbench';
let state=demo(), selected='d2', selectedCircuit=null, selectedBar=null, view='unifilar', undo=[],redo=[],noticeTimer=null, insertion=null;
let camera={x:0,y:0,zoom:.85,initialized:false,alternative:'',width:0,height:0};
let canvasFocus=false, inspectorDrawer=false;
let diagramStyle='technical';
let physicalDetail='basic';
let dinProposalOpen=false,dinPreviewPlan=null;
try{physicalDetail=localStorage.getItem('PanelBuilder_v11_physicalDetail')==='advanced'?'advanced':'basic';}catch(err){}
try{diagramStyle=localStorage.getItem('PanelBuilder_v11_diagramStyle_v3')==='blocks'?'blocks':'technical';}catch(err){}
try {const raw=localStorage.getItem(key)||localStorage.getItem('PanelBuilder_v10_workbench')||localStorage.getItem('PanelBuilder_v09_workbench')||localStorage.getItem('PanelBuilder_v06_workbench')||localStorage.getItem('PanelBuilder_v05_workbench')||localStorage.getItem('PanelBuilder_v04_workbench')||localStorage.getItem('PanelBuilder_v03_workbench');
 if(raw){const parsed=JSON.parse(raw);if(validProject(parsed)){state=parsed;const isLegacy=![6,8,9,10,11].includes(state.version);state.version=11;Object.values(state.alternatives).forEach(a=>{a.circuits=Array.isArray(a.circuits)?a.circuits:[];a.busbars=Array.isArray(a.busbars)?a.busbars:[];a.auxiliaryZones=a.auxiliaryZones||{bars:{},circuits:{}};if(isLegacy)a.assignments={};else a.assignments=a.assignments||{};a.devices=a.devices.map(d=>{const record=state.brand==='Generico'?null:(window.PanelCommercialPlacement.resolve(d,a,state.brand)||M.normalized(d,state.brand,a.assignments?.[d.id]));return {...d,modules:record?record.modules:E.estimateModules(d),moduleSource:record?'catalog':'estimate',matchedRef:record?.ref||null};});if(isLegacy)a.layoutDirty=true;});}}
}catch(e){}
const alt=()=>state.alternatives[state.active],dev=()=>alt().devices.find(d=>d.id===selected);
function circuitsFor(a=alt()){return window.PanelCircuits.all(a);}
function currentCircuit(){return circuitsFor().find(c=>c.id===selectedCircuit)||null;}
function activeBar(){return window.PanelBusbars.get(alt(),selectedBar);}
function addBar(kind){
 const source=''; // Sin inferir automáticamente el grupo de neutro a partir de la selección.
 const bar=window.PanelBusbars.create(alt(),kind,source||'');
 if(!bar)return toast('No se pudo crear una barra.');
 saveAction(()=>{alt().busbars=window.PanelBusbars.all(alt());alt().busbars.push(bar);selectedBar=bar.id;selectedCircuit=null;},{electrical:false});
 if(canvasFocus){inspectorDrawer=true;render();}
 toast('Barra '+bar.label+' creada: asigna los circuitos desde su salida.');
}
function editBar(field,raw){
 const current=activeBar();if(!current)return;
 let val=String(raw).trim();
 if(field==='label'){
  if(!val||val.length>30||window.PanelBusbars.all(alt()).some(b=>b.id!==current.id&&b.label.toUpperCase()===val.toUpperCase())){toast('Etiqueta duplicada o no válida.');render();return;}
 }else if(field==='rcdId'){
  if(current.kind!=='N'||val&&!alt().devices.some(d=>d.kind==='RCD'&&d.id===val)){toast('Diferencial de origen no válido.');return;}
 }else if(field==='notes')val=val.slice(0,250);else return;
 saveAction(()=>{const b=activeBar();if(b)b[field]=val;},{electrical:false});
}
function deleteBar(){
 const b=activeBar();if(!b)return;const id=b.id;
 saveAction(()=>{
  alt().circuits=circuitsFor().map(c=>({...c,
   neutralBusbarId:c.neutralBusbarId===id?'':c.neutralBusbarId,
   peBusbarId:c.peBusbarId===id?'':c.peBusbarId}));
  alt().devices.forEach(d=>{if(d.kind==='SPD'&&d.spdPeBusbarId===id)d.spdPeBusbarId='';});
  alt().busbars=window.PanelBusbars.all(alt()).filter(v=>v.id!==id);if(alt().auxiliaryZones?.bars)delete alt().auxiliaryZones.bars[id];selectedBar=null;
 },{electrical:false});toast('Barra eliminada; conexiones desvinculadas.');
}
function setAuxZone(group,id,zone){
 if(!window.PanelPhysicalAux.zones.some(([v])=>v===zone)){toast('Zona física desconocida.');return;}
 const exists=window.PanelPhysicalAux.list(alt()).some(v=>v.group===group&&v.id===id);
 if(!exists)return toast('El elemento auxiliar ya no existe.');
 saveAction(()=>{window.PanelPhysicalAux.setZone(alt(),group,id,zone);},{electrical:false});
}
function suggestAuxZones(){
 const unassigned=window.PanelPhysicalAux.list(alt()).filter(o=>!o.zone);
 if(!unassigned.length)return toast('No hay auxiliares pendientes de ubicar.');
 saveAction(()=>{window.PanelPhysicalAux.suggest(alt());},{electrical:false});
 toast('Zonas orientativas propuestas. No se ha comprobado espacio físico real.');
}
function setSpdPeBar(id){
 const d=dev();if(!d||d.kind!=='SPD')return;
 if(id&&!window.PanelBusbars.get(alt(),id,'PE'))return toast('Selecciona una barra PE válida.');
 saveAction(()=>{d.spdPeBusbarId=id;},{electrical:false});
}

function createCircuit(){
 const d=dev();if(!d)return toast('Selecciona un magnetotérmico terminal.');
 const c=window.PanelCircuits.create(alt(),d.id);
 if(!c){toast('La salida necesita un magnetotérmico terminal sin otra salida.');return;}
 saveAction(()=>{alt().circuits=circuitsFor();alt().circuits.push(c);selectedCircuit=c.id;},{electrical:false});
 toast('Salida '+c.code+' creada. Define su destino y conductores.');
}
function updateCircuit(field,raw){
 if(!window.PanelCircuits.attrs.includes(field))return;
 let value=String(raw);
 if(['phaseMm2','neutralMm2','peMm2','lengthM'].includes(field)){
   value=raw===''?null:Number(raw);
   if(value!==null&&(!Number.isFinite(value)||value<=0||value>100000)){toast('Introduce un número positivo válido.');return;}
 }else value=value.slice(0,['terminalStrip','neutralBar','peBar'].includes(field)?30:250);
 if(!currentCircuit())return;
 saveAction(()=>{const c=currentCircuit();if(c)c[field]=value;},{electrical:false});
}
function deleteCircuit(){
 const c=currentCircuit();if(!c)return;const id=c.id;
 saveAction(()=>{alt().circuits=circuitsFor().filter(x=>x.id!==id);if(alt().auxiliaryZones?.circuits)delete alt().auxiliaryZones.circuits[id];selectedCircuit=null;},{electrical:false});
 toast('Salida eliminada. La protección permanece en el esquema.');
}

function validProject(p){if(!p||![3,4,5,6,8,9,10,11].includes(p.version)||!p.alternatives||!p.alternatives[p.active]||!Array.isArray(p.alternatives[p.active].devices))return false;
 return Object.values(p.alternatives).every(a=>Array.isArray(a.devices)&&window.PanelCircuits.validAll(a.circuits,a.devices)&&window.PanelBusbars.validAll(a.busbars,a.devices)&&window.PanelPhysicalAux.validAll(a)&&window.PanelEnclosureGeometry.valid(a.enclosureGeometry)&&window.PanelConstruction.valid(a.physicalConstruction)&&window.PanelEnclosureCandidates.valid(a.enclosureSelection)&&window.PanelApparatusCandidates.valid(a)&&window.PanelCommercialPlacement.valid(a)&&window.PanelDINReflow.validLocks(a)&&window.PanelDINReflow.validClearances(a)&&window.PanelMountClearance.valid(a)&&window.PanelPhysicalAccessories.valid(a)&&window.PanelDINAssemblies.valid(a)&&a.devices.length<=350&&a.devices.every(d=>d&&typeof d.id==='string'&&typeof d.label==='string'&&Number.isInteger(Number(d.modules))&&d.modules>=1&&d.modules<=48)&&E.graphCheck(a.devices).length===0);}
function persist(){try{localStorage.setItem(key,JSON.stringify(state))}catch(e){}}
function syncWidths(){alt().devices=alt().devices.map(d=>{
 const m=brandMatch(d); return {...d,modules:m?m.modules:E.estimateModules(d),moduleSource:m?'catalog':'estimate',matchedRef:m?m.ref:null};});}
function syncWidthsAcrossAlternatives(){for(const a of Object.values(state.alternatives)){a.assignments={};a.physicalSelections={};window.PanelMountClearance.clearProfiles(a);a.devices=E.recalcWidths(a.devices,'Generico');a.layoutDirty=true;}}
function saveAction(fn,{electrical=true}={}){dinProposalOpen=false;dinPreviewPlan=null;undo.push(clone(state));if(undo.length>50)undo.shift();redo=[];fn();if(electrical){alt().assignments={};alt().physicalSelections={};window.PanelMountClearance.clearProfiles(alt());}syncWidths();if(electrical){alt().layoutDirty=true;}persist();render();}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.classList.remove('visible'),3100);}
function format(d){let s=d.poles||'';if(d.kind==='MCB')s+=` · ${d.amp||'?'} A · ${d.curve||'?'}${d.amp?'':''}`;
 else if(d.kind==='RCD')s+=` · ${d.amp||'?'} A · ${d.sensitivity||'?'} mA · ${d.rcdType||'?'} `;
 else if(d.amp)s+=` · ${d.amp} A`;
 return s+` · ${d.modules} M ${d.moduleSource==='catalog'?'(ficha)':'(estimado)'}`;}
function suggestLabel(kind){const prefix={MCB:'Q',RCD:'ID',SPD:'SPD',SWITCH:'IS',CONTACT:'KM'}[kind]||'X';let i=1;while(alt().devices.some(d=>d.label===prefix+i))i++;return prefix+i;}
function addDevice(kind){const base=library.find(x=>x.kind===kind);if(!base)return;
 if(typeOf(kind)==='SPD'&&!dev()){toast('Selecciona un equipo aguas arriba para derivar el SPD.');return;}
 if(circuitsFor().some(c=>c.deviceId===selected)){toast('La protección ya tiene una salida terminal. Elimina esa salida antes de continuar aguas abajo.');return;}
 if(dev()?.kind==='SPD'){toast('El SPD debe ser una derivación de protección, no el origen de otros aparatos.');return;}
 saveAction(()=>{const id='d'+(state.counter++);const parent=dev()?.id||alt().devices[0]?.id||null;selectedCircuit=null;selectedBar=null;const d={...clone(base),id,kind:typeOf(base.kind),label:suggestLabel(typeOf(base.kind)),parent,row:null,pos:null};delete d.symbol;selected=id;alt().devices.push(d);});toast('Dispositivo genérico añadido. Define su conexión en Propiedades.');}
function removeDevice(){const d=dev();if(!d)return;const children=alt().devices.filter(x=>x.parent===d.id);if(children.length&&!confirm(`El dispositivo ${d.label} tiene ${children.length} derivación(es). ¿Eliminarlo y dejar esas conexiones sin origen?`))return;
 saveAction(()=>{const removed=selected;if(alt().apparatusCandidates)delete alt().apparatusCandidates[removed];if(alt().physicalSelections)delete alt().physicalSelections[removed];if(alt().dinLocks)delete alt().dinLocks[removed];if(alt().dinClearancesMm)delete alt().dinClearancesMm[removed];if(alt().dinLeftClearancesMm)delete alt().dinLeftClearancesMm[removed];if(alt().dinMountProjectionMm)delete alt().dinMountProjectionMm[removed];if(alt().physicalAccessoryPlans)delete alt().physicalAccessoryPlans[removed];window.PanelDINAssemblies.removeDevice(alt(),removed);alt().busbars=window.PanelBusbars.all(alt()).map(b=>b.rcdId===removed?{...b,rcdId:''}:b);const removedCircuits=circuitsFor().filter(c=>c.deviceId===selected).map(c=>c.id);for(const id of removedCircuits){if(alt().auxiliaryZones?.circuits)delete alt().auxiliaryZones.circuits[id];}alt().circuits=circuitsFor().filter(c=>c.deviceId!==selected);alt().devices=alt().devices.filter(x=>x.id!==selected).map(x=>x.parent===selected?{...x,parent:null}:x);selectedCircuit=null;selectedBar=null;selected=alt().devices[0]?.id||null;});}
function updateProperty(name,val){const d=dev();if(!d)return;
 if(name==='parent'&&val&&circuitsFor().some(c=>c.deviceId===val)){toast('Ese equipo ya tiene una salida terminal.');render();return;}
 if(name==='parent'&&val&&alt().devices.find(x=>x.id===val)?.kind==='SPD'){toast('El SPD no puede alimentar otros aparatos.');render();return;}
 saveAction(()=>{if(name==='parent'){d.parent=val||null;}else if(['modules','amp','sensitivity','breakingKa','spdUcV','spdInKa','spdImaxKa','spdUpKv','contactCoilV'].includes(name)){d[name]=Number(val);}else{d[name]=val;}});}
function validDinMove(id,row,pos){const a=alt();return E.fitsPlacement(a.devices,id,row,pos,a.rows,a.slots)&&window.PanelDINReflow.audit({...a,devices:a.devices.map(d=>d.id===id?{...d,row,pos}:d)}).clear;}
function moveSelected(){const d=dev();if(!d||!alt().rows){toast('Primero calcula una propuesta de envolvente.');return;}if(window.PanelDINReflow.pinned(alt(),d.id)){toast('Desbloquea la posición fija antes de mover el aparato.');return;}
 const row=Number($('moveRow')?.value),pos=Number($('movePos')?.value);
 if(!validDinMove(d.id,row,pos)){toast('La posición no cabe: aparato, otro dispositivo o reserva lateral declarada.');return;}
 saveAction(()=>{d.row=row;d.pos=pos;},{electrical:false});toast('Posición física actualizada.');}
function applyProposal(config){
 if(alt().rows&&(Object.keys(alt().dinLocks||{}).length||Object.keys(alt().dinClearancesMm||{}).length||Object.keys(alt().dinLeftClearancesMm||{}).length||Object.keys(alt().dinRailDoorMm||{}).length)){view='physical';dinProposalOpen=true;render();toast('Hay posiciones fijadas o reservas laterales. Usa la redistribución asistida para conservarlas.');return;}
 view='physical';canvasFocus=false;inspectorDrawer=false;saveAction(()=>{if(alt().rows!==config.rows||alt().slots!==config.slots)alt().dinRailDoorMm={};alt().rows=config.rows;alt().slots=config.slots;alt().layoutDirty=false;
 for(const d of alt().devices){const place=config.positions[d.id];d.row=place.row;d.pos=place.pos;}},{electrical:false});
 toast(`Propuesta modular: ${config.rows} fila(s) × ${config.slots} módulos. Geometría real pendiente de comprobar.`);
}
function doProposal(){const p=E.propose(alt().devices,alt().reserve);if(!p.ok){toast(p.errors.join(' '));return;}applyProposal(p);}

function brandMatch(d){return state.brand==='Generico'?null:(window.PanelCommercialPlacement.resolve(d,alt(),state.brand)||M.normalized(d,state.brand,alt().assignments?.[d.id]));}
function brandSummary(){if(state.brand==='Generico')return 'Diseño totalmente genérico. Puedes elegir fabricante después.';const n=alt().devices.filter(brandMatch).length;return `${n} de ${alt().devices.length} referencias con anchura comercial aplicada en ${state.brand}. Los demás aparatos siguen genéricos.`;}
function brandAccent(brand){return ({Schneider:'#3ca04b',Legrand:'#e13b3f',Hager:'#f2a327'})[brand]||'#7f93aa';}
function shortBrand(brand){return ({Schneider:'SCH',Legrand:'LEG',Hager:'HAG'})[brand]||brand?.slice(0,3)?.toUpperCase()||'GEN';}
function deviceAccent(d){return brandMatch(d)?brandAccent(state.brand):'#b7c8dc';}
function findNearestPlacement(subjectId,row,pos){const a=alt();const d=a.devices.find(x=>x.id===subjectId);if(!d||!a.rows)return null;const rows=[row,...Array.from({length:a.rows},(_,i)=>i).filter(i=>i!==row)];for(const r of rows){const preferred=[];for(let off=0;off<a.slots;off++){if(off===0)preferred.push(pos);else{if(pos-off>=0)preferred.push(pos-off);if(pos+off<a.slots)preferred.push(pos+off);}}for(const p of preferred){if(validDinMove(subjectId,r,p))return {row:r,pos:p};}}return null;}
function cut(s,n){s=String(s??'');return s.length>n?s.slice(0,n-1)+'…':s;}
function deviceFigureSVG(kind,x,y){if(kind==='RCD')return `<rect x="${x+4}" y="${y+8}" width="18" height="28" rx="3" fill="#f7fbff" stroke="#90a7c0"/><rect x="${x+8}" y="${y+12}" width="10" height="6" rx="2" fill="#d3f0dd" stroke="#89c39b"/><rect x="${x+10}" y="${y+21}" width="6" height="12" rx="2" fill="#536377"/><circle cx="${x+19}" cy="${y+24}" r="1.7" fill="#dbb238"/>`; if(kind==='SPD')return `<rect x="${x+4}" y="${y+9}" width="18" height="26" rx="3" fill="#f7fbff" stroke="#90a7c0"/><path d="M ${x+14} ${y+12} L ${x+10} ${y+22} L ${x+14.5} ${y+22} L ${x+12} ${y+32} L ${x+18} ${y+20} L ${x+13.5} ${y+20} Z" fill="#e1a11c"/>`; if(kind==='CONTACT')return `<rect x="${x+4}" y="${y+8}" width="18" height="28" rx="3" fill="#f7fbff" stroke="#90a7c0"/><rect x="${x+8}" y="${y+13}" width="4" height="15" rx="1.5" fill="#536377"/><rect x="${x+15}" y="${y+13}" width="4" height="15" rx="1.5" fill="#536377"/><circle cx="${x+11}" cy="${y+31}" r="1.2" fill="#8fa3ba"/><circle cx="${x+17}" cy="${y+31}" r="1.2" fill="#8fa3ba"/>`; if(kind==='SWITCH')return `<rect x="${x+4}" y="${y+8}" width="18" height="28" rx="3" fill="#f7fbff" stroke="#90a7c0"/><rect x="${x+9}" y="${y+14}" width="8" height="15" rx="2" fill="#536377"/><rect x="${x+10}" y="${y+11}" width="6" height="4" rx="1.5" fill="#9fb1c4"/>`; return `<rect x="${x+4}" y="${y+8}" width="18" height="28" rx="3" fill="#f7fbff" stroke="#90a7c0"/><rect x="${x+10}" y="${y+14}" width="6" height="16" rx="2" fill="#536377"/><rect x="${x+11}" y="${y+11}" width="4" height="4" rx="1.4" fill="#9fb1c4"/>`; }
function cabinetFigure(kind){const k=kind==='MCB1'?'MCB':kind; if(k==='RCD')return `<div class="pict rcd"><span class="pict-body"></span><span class="pict-switch"></span><span class="pict-test"></span></div>`; if(k==='SPD')return `<div class="pict spd"><span class="pict-body"></span><span class="pict-bolt">ϟ</span></div>`; if(k==='CONTACT')return `<div class="pict contact"><span class="pict-body"></span><span class="pict-switch a"></span><span class="pict-switch b"></span></div>`; if(k==='SWITCH')return `<div class="pict switch"><span class="pict-body"></span><span class="pict-wide"></span></div>`; return `<div class="pict mcb"><span class="pict-body"></span><span class="pict-switch"></span></div>`;}
// Dibujamos el mismo árbol en editor y exportación, con las mismas posiciones.
function schematicSVG(interactive=true){
 const ds=alt().devices;let {locations,width,height}=E.verticalTree(ds);const circuits=circuitsFor();if(circuits.length){height+=96;for(const c of circuits){const pt=locations.get(c.deviceId);if(pt)width=Math.max(width,pt.x+240);}}
 const byId=new Map(ds.map(d=>[d.id,d])), groups=new Map(), roots=[];
 ds.forEach(d=>{if(d.parent && byId.has(d.parent)){
   if(!groups.has(d.parent))groups.set(d.parent,[]);
   groups.get(d.parent).push(d);
 }else roots.push(d)});
 let connections='',buttons='',nodes='';
 const stroke='#718ba7';
 const path=(d)=>`<path d="${d}" stroke="${stroke}" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
 const plus=(x,y,child,parent)=>interactive?`<g class="wire-insert" data-insert-child="${escape(child)}" data-insert-parent="${escape(parent||'')}" role="button" tabindex="0" aria-label="Insertar protección antes de ${escape(byId.get(child)?.label||child)}">
  <circle cx="${x}" cy="${y}" r="14" fill="#eaf3ff" stroke="#4085d5" stroke-width="1.7"/><text x="${x}" y="${y+5.5}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="19" fill="#1f65be">+</text>
  <title>Insertar protección en esta conexión</title></g>`:'';
 groups.forEach((kids,id)=>{
   const parent=locations.get(id); if(!parent)return;
   const pcs=kids.map(d=>locations.get(d.id)).filter(Boolean);
   if(!pcs.length)return;
   const junction=parent.y+76, lowX=Math.min(parent.x,...pcs.map(p=>p.x)),highX=Math.max(parent.x,...pcs.map(p=>p.x));
   connections+=path(`M ${parent.x} ${parent.y+32} V ${junction}`);
   if(highX>lowX)connections+=path(`M ${lowX} ${junction} H ${highX}`);
   if(kids.length>1){
     new Set([parent.x,...pcs.map(p=>p.x)]).forEach(x=>{connections+=`<circle class="wire-junction" cx="${x}" cy="${junction}" r="3" fill="#2a425b"/>`;});
     if(interactive)buttons+=`<g class="wire-insert wire-insert-branch" data-insert-branch="${escape(id)}" role="button" tabindex="0" aria-label="Insertar antes de derivaciones de ${escape(byId.get(id)?.label||id)}"><circle cx="${parent.x}" cy="${parent.y+54}" r="13" fill="#fff3df" stroke="#af752a" stroke-width="1.7"/><text x="${parent.x}" y="${parent.y+59}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="18" fill="#a1651d">+</text><title>Intercalar antes de todas las ramas</title></g>`;
   }
   kids.forEach(d=>{const at=locations.get(d.id);if(!at)return;
     connections+=path(`M ${at.x} ${junction} V ${at.y-33}`);
     buttons+=plus(at.x,(junction+at.y-33)/2,d.id,id);
   });
 });
 roots.forEach(d=>{const at=locations.get(d.id);if(!at)return;
   connections+=path(`M ${at.x} 88 V ${at.y-33}`);
   connections+=`<text x="${at.x}" y="68" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#6c8198" text-anchor="middle">ALIMENTACIÓN</text><path d="M ${at.x-11} 86 H ${at.x+11}" stroke="${stroke}" stroke-width="2"/>`;
   buttons+=plus(at.x,109,d.id,null);
 });
 ds.forEach(d=>{const pt=locations.get(d.id);if(!pt)return;
   const match=brandMatch(d),active=selected===d.id&&interactive;
   const type=d.kind==='MCB'?'MT':d.kind==='RCD'?'ID':d.kind==='SPD'?'SPD':d.kind==='SWITCH'?'IS':d.kind==='CONTACT'?'KM':'EQ';
   const label=cut(d.label,12),spec=cut(`${d.poles||'?'} · ${String(d.amp||'?')} A`,19),detail=cut(match?`${match.ref} · ${match.modules} M`:`≈ ${d.modules} M · provisional`,23);
   const attrs=interactive?`class="diagram-node${active?' picked':''}" data-device="${escape(d.id)}" role="button" tabindex="0" aria-label="Seleccionar ${escape(d.label)}"`:'';
   if(diagramStyle==='technical'){
     const shape=window.PanelSymbols.render(d.kind,pt.x,pt.y);
     const props=d.kind==='MCB'?`${d.poles||'?'} · ${d.amp||'?'} A · ${d.curve||'?'}`:d.kind==='RCD'?`${d.poles||'?'} · ${d.amp||'?'} A · ${d.sensitivity||'?'}mA · ${d.rcdType||'?'}`:`${d.poles||'?'} · ${d.amp||'?'} A`;
     nodes+=`<g ${attrs}>
       <rect class="diagram-hitbox" x="${pt.x-22}" y="${pt.y-35}" width="162" height="70" rx="7" fill="${active?'#edf5ff':'transparent'}" stroke="${active?'#2675d9':'transparent'}" stroke-width="2"/>
       ${shape}
       <text x="${pt.x+48}" y="${pt.y-14}" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="#233e5d" pointer-events="none">${escape(label)}</text>
       <text x="${pt.x+48}" y="${pt.y+2}" font-family="Arial,sans-serif" font-size="9" fill="#566e86" pointer-events="none">${escape(cut(props,22))}</text>
       <text x="${pt.x+48}" y="${pt.y+18}" font-family="Arial,sans-serif" font-size="8" fill="#8293a4" pointer-events="none">${escape(detail)}</text>
       <title>${escape(d.label+' · '+d.name)}</title></g>`;
   }else{
   nodes+=`<g ${attrs}>
    <rect class="diagram-hitbox" x="${pt.x-69}" y="${pt.y-34}" width="138" height="68" rx="8" fill="${active?'#eaf3ff':'#ffffff'}" stroke="${active?'#2879da':'#b8c9dd'}" stroke-width="${active?2.5:1.6}"/>
    <rect x="${pt.x-59}" y="${pt.y-24}" width="30" height="48" rx="5" fill="#eef3f9" stroke="#dce5ef" pointer-events="none"/>
    <text x="${pt.x-44}" y="${pt.y+3.5}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${type.length>2?9:12}" font-weight="800" fill="#34577f" pointer-events="none">${type}</text>
    <text x="${pt.x-20}" y="${pt.y-14}" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="#243d59" pointer-events="none">${escape(label)}</text>
    <text x="${pt.x-20}" y="${pt.y+2}" font-family="Arial,sans-serif" font-size="9" fill="#617b97" pointer-events="none">${escape(spec)}</text>
    <text x="${pt.x-20}" y="${pt.y+18}" font-family="Arial,sans-serif" font-size="8" fill="${match?'#3a697e':'#8391a3'}" pointer-events="none">${escape(detail)}</text>
    <title>${escape(d.label+' · '+d.name+' · '+(match?state.brand+' '+match.ref:'genérico'))}</title>
   </g>`;
   }
 });
 const drawing=window.PanelCircuits.draw(alt(),locations,escape,interactive);connections+=drawing.wires;nodes+=drawing.nodes;
 const connectionsNPE=window.PanelBusbars.draw(alt(),locations,escape);connections+=connectionsNPE.links;nodes+=connectionsNPE.endpoints;
 const footerY=height-26;
 return `<svg xmlns="http://www.w3.org/2000/svg" class="diagram-svg vertical-tree" viewBox="0 0 ${width} ${height}" width="${interactive?'100%':width}" height="${interactive?'100%':height}" data-natural-width="${width}" data-natural-height="${height}" role="img" aria-label="Árbol vertical de relaciones eléctricas">
 <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
 <text x="20" y="25" font-size="12" font-weight="800" fill="#314c70" font-family="Arial,sans-serif">PanelBuilder · Esquema vertical · ${escape(state.active)}</text>
 <text x="20" y="43" font-size="9" fill="#70849c" font-family="Arial,sans-serif">Simbología en revisión IEC · enlaces N/PE lógicos punteados; cableado real pendiente</text>
 ${connections}${buttons}${nodes}
 <text x="18" y="${footerY}" font-size="9" fill="#8b99ab" font-family="Arial,sans-serif">Documento preliminar · verificar conexionado, protecciones y normativa antes de su uso técnico</text>
 </svg>`;
}
function exportSchematic(){
 if(!alt().devices.length){toast('Añade dispositivos para exportar el unifilar.');return;}
 const svg=schematicSVG(false);
 const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=`PanelBuilder_Unifilar_${state.active}_v11.svg`;
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 toast('Árbol vertical exportado en SVG vectorial.');
}
function exportMaterialsCSV(){
 if(!alt().devices.length){toast('Añade aparatos antes de exportar el listado.');return;}
 const result=window.PanelMaterialCSV.build(alt(),state.brand,brandMatch);
 const blob=new Blob([result.csv],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=`PanelBuilder_Materiales_${state.active}_v11.csv`;
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 toast(result.count+' líneas exportadas en CSV. Revisa PVP, IVA, candidatas y compatibilidad.');
}
function renderSchematic(){const ds=alt().devices, errors=E.graphCheck(ds);
 const body=ds.length?`<div class="diagram-viewport" id="diagramViewport" aria-label="Lienzo del árbol unifilar. Arrastra fondo para desplazarte; rueda para moverte y Control más rueda para zoom." title="Arrastrar fondo: mover · Rueda: desplazar · Ctrl + rueda: zoom">
 ${schematicSVG(true)}<div class="diagram-hint">Arrastra para mover · Ctrl + rueda para zoom</div></div>`:'<div class="empty-view"><strong>Unifilar sin dispositivos</strong>Empieza añadiendo aparatos desde la biblioteca.</div>';
 return `<div class="work-card"><div class="card-header"><div><strong>① Unifilar · Árbol vertical</strong><small>Alimentación arriba, derivaciones debajo. Usa los botones + para insertar entre protecciones.</small></div><div class="schematic-header-actions"><button type="button" class="button small primary" data-action="proposePhysical">⚡ Proponer cuadro</button><button type="button" class="button small busbar-quick" data-action="addNeutralBar" title="Añadir barra N de neutro">＋ N</button><button type="button" class="button small busbar-quick" data-action="addEarthBar" title="Añadir barra PE de protección">＋ PE</button><button type="button" class="button small" data-action="toggleCanvasFocus" aria-pressed="${canvasFocus}" title="Ampliar o restaurar el lienzo">${canvasFocus?'↙ Salir de lienzo amplio':'⛶ Lienzo amplio'}</button><button type="button" class="button small inspector-drawer-toggle" data-action="toggleInspector" aria-expanded="${inspectorDrawer}">☷ ${inspectorDrawer?'Ocultar propiedades':'Propiedades'}</button><button type="button" class="button small symbol-toggle" data-action="toggleSymbols" aria-pressed="${diagramStyle==='technical'}" title="Alternar contactos técnicos y bloques anteriores">${diagramStyle==='technical'?'▤ Bloques antiguos':'⑂ Contactos técnicos'}</button><select class="diagram-jump" id="jumpDevice" aria-label="Ir a un dispositivo">${ds.map(d=>`<option value="${escape(d.id)}" ${selected===d.id?'selected':''}>${escape(d.label)} · ${escape(d.name)}</option>`).join('')}</select><button class="button small" type="button" data-action="focusSelected" title="Localizar dispositivo seleccionado">⌖ Ir</button><button class="button small" type="button" data-action="zoomOut" title="Alejar el esquema">−</button><span class="zoom-value" id="zoomLabel">85 %</span><button class="button small" type="button" data-action="zoomIn" title="Acercar el esquema">＋</button><button class="button small" type="button" data-action="fitDiagram" title="Ver todo el esquema">Encajar</button><button class="button small" type="button" data-action="centerRoot" title="Volver al origen">Origen</button><button class="button small" type="button" data-action="exportSchematic">↓ SVG</button><button class="button small" type="button" data-action="expandSchematic">Ampliar ↗</button></div></div>
 <div class="canvas-quick-add" role="group" aria-label="Aparatos para añadir rápidamente"><strong>＋ Añadir:</strong>${library.map(item=>`<button type="button" class="button small" data-add="${escape(item.kind)}" title="${escape(item.label)}">${escape(item.symbol)} · ${escape(item.label)}</button>`).join('')}</div>
 <div class="card-body">${body}
 <section class="busbar-manager">
 <div class="busbar-manager-head"><strong>Barras N / PE · enlaces lógicos</strong>
 <button type="button" class="button small" data-action="addNeutralBar">＋ Barra N</button>
 <button type="button" class="button small" data-action="addEarthBar">＋ Barra PE</button></div>
 ${window.PanelBusbars.schedule(alt(),escape)}
 <p class="tiny-hint">Líneas punteadas: relación documental; no rutas de conductores verificadas.</p>
 </section><div class="node-caption"><strong>Cómo editar:</strong> selecciona un aparato para modificarlo o pulsa <strong>＋</strong> sobre cualquier línea para intercalar uno nuevo. El esquema también se exporta en vertical. Vista técnica ilustrativa, sin conductores N/PE ni simbología IEC validada.</div>${errors.length?`<p class="error-text">${errors.map(escape).join(' · ')}</p>`:''}</div></div>`;
}
function openInsert(childId,parentId,mode='edge'){
 const child=alt().devices.find(d=>d.id===childId);
 if(mode==='edge'){
  if(!child || (child.parent||null)!==(parentId||null)){toast('La conexión ha cambiado.');return;}
  insertion={mode:'edge',childId,parentId:parentId||null};
  const parent=alt().devices.find(d=>d.id===parentId);
  $('insertDescription').innerHTML=`Se añadirá un elemento <b>${parent?`entre ${escape(parent.label)} y ${escape(child.label)}`:`entre la alimentación y ${escape(child.label)}`}</b>. El resto de derivaciones conservarán sus conexiones.`;
 } else {
  const parent=alt().devices.find(d=>d.id===parentId);
  if(!parent) return toast('El origen de la derivación ya no existe.');
  const children=alt().devices.filter(x=>x.parent===parentId);
  if(children.length<2) return toast('Este punto no tiene una derivación múltiple.');
  insertion={mode:'branch',parentId};
  $('insertDescription').innerHTML=`Se añadirá un elemento <b>entre ${escape(parent.label)} y el punto de derivación múltiple</b>. Las ${children.length} ramas actuales quedarán aguas abajo del nuevo elemento.`;
 }
 $('insertChoices').innerHTML=library.filter(item=>typeOf(item.kind)!=='SPD').map(item=>`<button type="button" class="insert-choice" data-insert-kind="${escape(item.kind)}"><span class="library-icon">${escape(item.symbol)}</span><span><strong>${escape(item.label)}</strong><small>${escape(item.poles)} · ancho estimado automáticamente</small></span><span class="insert-choice-arrow">→</span></button>`).join('');
 $('insertModal').classList.add('open');$('insertModal').setAttribute('aria-hidden','false');
 $('closeInsert').focus();
}
function closeInsert(){insertion=null;$('insertModal').classList.remove('open');$('insertModal').setAttribute('aria-hidden','true');}
function performInsert(kind){
 if(!insertion)return;
 if(typeOf(kind)==='SPD')return toast('El SPD se añade como derivación desde un equipo aguas arriba, no intercalado en serie.');
 const base=library.find(d=>d.kind===kind);if(!base)return;
 try{saveAction(()=>{
  const id='d'+state.counter++;const normalized=typeOf(base.kind);
  const d={...clone(base),id,kind:normalized,label:suggestLabel(normalized),row:null,pos:null};delete d.symbol;
  if(insertion.mode==='branch'){
    const pid=insertion.parentId;
    const ids=new Set(alt().devices.filter(x=>x.parent===pid).map(x=>x.id));
    alt().devices=alt().devices.map(x=>ids.has(x.id)?{...x,parent:id}:x);
    alt().devices.push({...d,parent:pid,row:null,pos:null});
  } else {
    const {childId,parentId}=insertion;
    alt().devices=E.insertBetween(alt().devices,parentId,childId,d);
  }
  selected=id;
 });closeInsert();toast('Protección insertada. Conexión actualizada; vuelve a proponer la distribución física.');}
 catch(err){toast(err.message);}
}
function renderCabinet(){const a=alt(),has=!!a.rows;const dinHtml=window.PanelDINReflow.render(a,dinProposalOpen,escape,d=>state.brand==='Generico'?null:window.PanelCommercialPlacement.resolve(d,a,state.brand));const auxiliary=window.PanelPhysicalAux.physical(a,escape);const occupied=a.devices.reduce((s,d)=>s+Number(d.modules),0);const dimensionalIssues=window.PanelDINReflow.mmReport(a,d=>state.brand==='Generico'?null:window.PanelCommercialPlacement.resolve(d,a,state.brand)).issues.length+window.PanelMountClearance.report(a).issues.length+window.PanelDINAssemblies.report(a,state.brand).issues.length;const unplaced=a.devices.filter(d=>d.row===null||d.pos===null);
 let blocks=''; if(has){for(let row=0;row<a.rows;row++){let cell='';for(let pos=0;pos<a.slots;pos++)cell+=`<div class="slot" style="grid-column:${pos+1};" data-slot="${row}:${pos}" title="Carril ${row+1}, módulo ${pos+1}"></div>`;
 a.devices.filter(d=>d.row===row&&d.pos!==null).forEach(d=>{const fixed=window.PanelDINReflow.pinned(a,d.id),match=brandMatch(d),color=deviceAccent(d),chip=match?`<span class="device-chip" style="background:${color}">${shortBrand(state.brand)}</span>`:'',kind=d.kind==='MCB1'?'MCB':d.kind;cell+=`<button type="button" draggable="${fixed?'false':'true'}" class="device ${selected===d.id?'selected':''}" style="grid-column:${d.pos+1}/span ${d.modules};--device-accent:${color}" data-device="${escape(d.id)}" data-physical-device="${escape(d.id)}" title="${escape(d.label)} · ${d.modules} módulos"><div class="device-head"><strong>${escape(cut(d.label,9))}</strong>${chip}${fixed?'<span title="Posición fijada">📌</span>':''}</div>${cabinetFigure(kind)}<small>${escape(kind)} · ${d.moduleSource==='catalog'?`${match.widthMm} mm · ${d.modules}M`:`≈ ${d.modules}M`}</small></button>`});
 blocks+=`<div class="rail-block"><div class="rail-heading"><span>Carril DIN ${row+1}</span><span>${a.slots} módulos</span></div><div class="rail-grid" style="--cols:${a.slots}">${cell}</div></div>`;}}
 return `<div class="work-card"><div class="card-header"><div><strong>② Propuesta de distribución física</strong><small>${has?`${a.rows} fila(s) × ${a.slots} M · ${occupied} M de aparatos`: 'Sin envolvente asignada todavía'}</small></div><span class="badge ${a.layoutDirty||dimensionalIssues?'amber':'green'}">${!has?'Pendiente':a.layoutDirty?'Recalcular':dimensionalIssues?'Revisar cotas':'Distribuida'}</span></div><div class="physical-shortcut-row"><button type="button" class="button small" data-view="unifilar">← Volver al unifilar</button><div class="physical-detail-toggle" role="group" aria-label="Nivel de detalle físico"><button type="button" class="button small ${physicalDetail==='basic'?'primary':''}" data-action="physicalBasic" aria-pressed="${physicalDetail==='basic'}">Diseño básico</button><button type="button" class="button small ${physicalDetail==='advanced'?'primary':''}" data-action="physicalAdvanced" aria-pressed="${physicalDetail==='advanced'}">Detalle constructivo</button></div></div><div class="card-body">${!has?'<div class="empty-view"><strong>Sin propuesta física</strong><p>Pulsa «Proponer envolvente y distribución» cuando hayas introducido los componentes genéricos.</p></div>':`<div class="cabinet-shell"><div class="cabinet-core">${physicalDetail==='advanced'?auxiliary.header:''}${blocks}${physicalDetail==='advanced'?auxiliary.side:''}${physicalDetail==='advanced'?auxiliary.bottom:''}</div><div class="cabinet-bottom">${a.enclosureSelection?'DISTRIBUCIÓN GENÉRICA · ENVOLVENTE COMERCIAL SIN VALIDAR':'ENVOLVENTE GENÉRICA · CAPACIDAD NOMINAL'}</div></div>`}
 ${physicalDetail==='advanced'?`<div data-physical-advanced="true">${window.PanelEnclosureGeometry.preview(a,escape,d=>state.brand==='Generico'?null:window.PanelCommercialPlacement.resolve(d,a,state.brand))}${auxiliary.panel}${window.PanelEnclosureGeometry.form(a,escape)}${window.PanelConstruction.form(a,escape)}${window.PanelMountClearance.railForm(a,escape)}${window.PanelPhysicalAccessories.render(a,state.brand,escape)}${window.PanelDINAssemblies.render(a,state.brand,escape)}</div>`:`<div class="physical-basic-hint" data-physical-basic="true"><strong>Montaje modular listo para organizar.</strong><span>El estudio de canaletas, carriles y dimensiones se conserva en «Detalle constructivo». Cambiar de modo no modifica tus datos.</span></div>`}${dinHtml}${window.PanelMountClearance.summary(a,escape)}${window.PanelEnclosureCandidates.render(a,escape)}${has&&unplaced.length?`<div class="unplaced-card"><strong>${unplaced.length} aparato(s) sin colocar:</strong> ${unplaced.map(d=>escape(d.label)).join(", ")}. Pulsa «Proponer envolvente y distribución» para actualizar el montaje.</div>`:""}<div class="placeholder-tape">La distribución DIN es una <b>estimación modular</b> calculada con anchuras provisionales; la representación auxiliar de barras y bornas NO determina huecos ni dimensiones interiores reales. Faltan canaletas, soportes, cableado, térmica y accesorios. La comprobación final exigirá referencias comerciales y una envolvente verificada.</div></div></div>`;
}
function renderMaterials(){
 const auxStats=window.PanelPhysicalAux.stats(alt());
 const auxBill=`<p class="small-text"><strong>Previsión auxiliar:</strong> ${auxStats.barN} barra(s) N · ${auxStats.barPE} barra(s) PE · ${auxStats.distinctStrips} regleta(s) identificada(s) y ${auxStats.terminalPositions} posiciones orientativas. ${auxStats.pending} elemento(s) sin zona física. Accesorios, longitudes reales, fabricante, descuentos y PVP pendientes.</p>`;
 const activeBars=window.PanelBusbars.all(alt());
 const busbarMaterial=activeBars.length?`<section class="terminal-bom"><strong>Barras N/PE documentadas (${activeBars.length})</strong><div class="table-wrap"><table class="materials-table"><thead><tr><th>Barra</th><th>Función</th><th>Grupo ID</th><th>PVP</th></tr></thead><tbody>${activeBars.map(b=>`<tr><td>${escape(b.label)}</td><td>${escape(b.kind)}</td><td>${escape(alt().devices.find(d=>d.id===b.rcdId)?.label||'Por definir')}</td><td>PVP pendiente</td></tr>`).join('')}</tbody></table></div></section>`:'';
 const totalTerminals=circuitsFor().reduce((sum,c)=>sum+window.PanelCircuits.terminalRows(c).length,0);
 const outputRows=circuitsFor().map(c=>{
  const terminals=window.PanelCircuits.terminalRows(c),roles=terminals.map(t=>t.role).join(' + ')||'Pendiente';
  return `<tr><td>${escape(c.code)}</td><td>${escape(c.destination||'Por definir')}</td><td>${escape(c.terminalStrip||'Sin regleta')}</td><td>${escape(roles)}</td><td>${terminals.length} (preliminares)</td><td>N: ${escape(c.neutralBar||'sin asignar')} · PE: ${escape(c.peBar||'sin asignar')}</td><td>PVP pendiente</td></tr>`;
 }).join('');
 const terminalSchedule=outputRows?`<section class="terminal-bom"><strong>Regletas y bornas de circuitos (estimación preliminar)</strong><p class="small-text">${totalTerminals} posiciones de borne estimadas según los conductores declarados. No constituyen un despiece técnico ni se ha seleccionado fabricante/PVP.</p><div class="table-wrap"><table class="materials-table"><thead><tr><th>Salida</th><th>Destino</th><th>Regleta</th><th>Conductores</th><th>Bornas propuestas</th><th>Grupos N/PE</th><th>PVP</th></tr></thead><tbody>${outputRows}</tbody></table></div></section>`:'';
 const circuitsSummary=circuitsFor().length?`<p class="small-text"><strong>Salidas:</strong> ${circuitsFor().map(c=>escape(c.code)+' → '+escape(c.destination||'sin destino')).join(' · ')}. Longitudes y secciones aún no presupuestadas.</p>`:'';
 const rows=alt().devices.map(d=>{
  const match=brandMatch(d),pvp=match?window.PanelPricebook?.find(state.brand,match.ref):null;
  const commercial=match?window.PanelCommercial.get(state.brand,match.ref):null;
  const candidate=window.PanelApparatusCandidates.getSelection(alt(),d);
  const documentary=candidate?`<small class="apparatus-bom-doc" data-apparatus-bom="${escape(d.id)}">Candidata documental: ${escape(candidate.selection.fabricante)} ${escape(candidate.selection.referencia)} · ${candidate.review.eligible?'Sin validar':'Incompatible con valores actuales'}</small>`:'';
  const ref=(match?`<span class="badge green">${escape(state.brand)} ${escape(match.ref)}</span>`:'<span class="badge amber">Sin referencia aplicada al modelo</span>')+documentary;
  const catalogAmount=commercial?.pvp_sin_iva_eur!==null&&commercial?.pvp_sin_iva_eur!==undefined?
   `<strong>${commercial.pvp_sin_iva_eur.toLocaleString('es-ES',{style:'currency',currency:'EUR'})}</strong><small class="price-provenance"><a href="${escape(commercial.url_oficial)}" target="_blank" rel="noopener noreferrer">PVP recomendado sin IVA · ${escape(commercial.fecha_consulta)} ↗</a> · vigencia sin acreditar</small>`:
   commercial&&commercial.precio_publicado_eur!==null?
   `<span class="badge amber">${escape(window.PanelCommercial.priceLabel(commercial))}</span><small class="price-provenance">IVA por confirmar; no utilizar como neto.</small>`:'<span class="badge amber">PVP pendiente</span>';
  const price=pvp?`<strong>${pvp.pvp_sin_iva_eur.toLocaleString('es-ES',{style:'currency',currency:'EUR'})}</strong><small class="price-provenance"><a href="${escape(pvp.fuente_url)}" target="_blank" rel="noopener noreferrer">Tarifa oficial · ${escape(pvp.fecha_vigencia)} ↗</a></small>`:catalogAmount;
  return `<tr><td>${escape(d.label)}</td><td>${escape(d.name)}</td><td>${escape(format(d))}</td><td>${ref}</td><td>${price}</td></tr>`;
 }).join('');
 return `<div class="work-card"><div class="view-heading materials-heading-actions"><span>Materiales y PVP</span><button type="button" class="button small" data-action="exportMaterialsCSV">↓ Exportar CSV (Excel)</button></div><div class="card-body"><p class="small-text">PVP de fabricante en €/ud. sin IVA exclusivamente cuando exista tarifa oficial, fecha y fuente verificadas. El catálogo ofrece precios de fabricante con fuente; la vigencia de tarifa y los IVA no confirmados permanecen pendientes. Coste de compra, descuento y mano de obra serán capítulos distintos del presupuesto.</p>${auxBill}${window.PanelPhysicalAccessories.materials(alt(),escape)}${window.PanelDINAssemblies.materials(alt(),escape)}${window.PanelEnclosureCandidates.summary(alt(),escape)}${circuitsSummary}${terminalSchedule}${busbarMaterial}<div class="table-wrap"><table class="materials-table"><thead><tr><th>Identificación</th><th>Función</th><th>Características</th><th>Referencia comercial</th><th>PVP catálogo (sin IVA)</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Añade dispositivos.</td></tr>'}</tbody></table></div></div></div>`;
}
function renderChecks(){const p=E.propose(alt().devices,alt().reserve);const errs=E.graphCheck(alt().devices),a=alt();const warnings=[...errs,...window.PanelCircuits.check(a),...window.PanelBusbars.check(a),...window.PanelPhysicalAux.check(a),...window.PanelEnclosureGeometry.check(a),...window.PanelConstruction.check(a),...window.PanelEnclosureCandidates.checks(a),...window.PanelApparatusCandidates.checks(a)];a.devices.filter(d=>d.kind==='SPD'&&a.devices.some(ch=>ch.parent===d.id)).forEach(d=>warnings.push('SPD '+d.label+': tiene aparatos aguas abajo. Debe revisarse como derivación, no como elemento serie.'));
 if(!a.rows)warnings.push('No se ha calculado todavía la propuesta de envolvente.');
 if(a.layoutDirty&&a.rows)warnings.push('Se han modificado datos del cuadro desde la última distribución automática. Es necesario recalcular o revisar la ubicación.');
  if(a.rows){warnings.push(...window.PanelDINReflow.audit(a).problems.map(p=>'DIN: '+p.text));warnings.push(...window.PanelDINReflow.mmReport(a,d=>state.brand==='Generico'?null:window.PanelCommercialPlacement.resolve(d,a,state.brand)).issues.map(p=>'DIN mm: '+p));warnings.push(...window.PanelMountClearance.report(a).issues.map(p=>'Montaje: '+p));}warnings.push(...window.PanelPhysicalAccessories.report(a,state.brand).issues.map(p=>'Accesorio: '+p));warnings.push(...window.PanelPhysicalAccessories.report(a,state.brand).pending.map(p=>'Accesorio pendiente: '+p));warnings.push(...window.PanelDINAssemblies.report(a,state.brand).issues.map(p=>'Conjunto DIN: '+p));warnings.push(...window.PanelDINAssemblies.report(a,state.brand).pending.map(p=>'Conjunto pendiente: '+p));
 if(state.brand!=='Generico')warnings.push(brandSummary());
 warnings.push('No se han verificado cálculos de cortocircuito, secciones, selectividad, coordinación ni protección frente a contactos.');
 warnings.push('No se han verificado dimensiones de componentes comerciales, disipación térmica, accesibilidad ni normas aplicables al conjunto.');
 return `<div class="work-card"><div class="view-heading">Comprobaciones y asuntos pendientes</div><div class="card-body">${warnings.map(w=>`<div class="notice-line warn">⚠ ${escape(w)}</div>`).join('')}<p class="node-caption">Estado: <strong>propuesta preliminar NO VALIDADA</strong>. ${p.ok?`Estimación de capacidad: ${p.rows} × ${p.slots} M (reserva solicitada ${a.reserve} %).`:'Añade dispositivos válidos para calcular una propuesta modular.'}</p></div></div>`;}
function getAncestorsOf(id){const a=new Set(),byid=new Map(alt().devices.map(d=>[d.id,d]));let cur=byid.get(id)?.parent;while(cur&&byid.has(cur)&&!a.has(cur)){a.add(cur);cur=byid.get(cur)?.parent;}return a;}
function descendants(id){const out=new Set();let changed=true;while(changed){changed=false;for(const d of alt().devices){if((d.parent===id||out.has(d.parent))&&!out.has(d.id)){out.add(d.id);changed=true;}}}return out;}
function option(value,label,current){return `<option value="${escape(value)}" ${String(current)===String(value)?'selected':''}>${escape(label)}</option>`;}
function field(label,name,type,value,choices){const id=`prop_${name}`;const input=choices?`<select data-edit="${name}" id="${id}">${choices.map(o=>option(o[0],o[1],value)).join('')}</select>`:`<input id="${id}" data-edit="${name}" type="${type||'text'}" value="${escape(value)}" ${type==='number'?'min="0"':''} />`;
 return `<div class="form-field"><label for="${id}">${escape(label)}</label>${input}</div>`;}
function inspector(){const bar=activeBar();if(bar){$('inspector').innerHTML=window.PanelBusbars.detail(bar,alt(),escape);return;}const outputRecord=currentCircuit();if(outputRecord){$('inspector').innerHTML=window.PanelCircuits.form(outputRecord,escape,alt());return;}const d=dev();if(!d){$('inspector').innerHTML='<div class="section-heading">PROPIEDADES</div><div class="empty-view">Selecciona un componente del unifilar o del cuadro físico.</div>';return;}
 const m=brandMatch(d),invalid=new Set([...descendants(d.id),d.id]);const parents=[['','Sin conexión (origen)'],...alt().devices.filter(x=>!invalid.has(x.id)).map(x=>[x.id,`${x.label} · ${x.name}`])];
 let html=`<div class="section-heading">PROPIEDADES DEL COMPONENTE</div><h2>${escape(d.label)} · ${escape(d.name)}</h2><p>Modifica las características del elemento genérico. El esquema y la distribución comparten su identidad.</p>${field('Identificador / etiqueta','label','text',d.label)}${field('Descripción / función','name','text',d.name)}${field('Conectado aguas abajo de','parent',null,d.parent||'',parents)}`;
 if(d.kind==='SPD'){
  const choices=window.PanelBusbars.options(alt(),'PE',d.spdPeBusbarId||'');
  html+=`<div class="inspector-divider"></div><div class="section-heading">DERIVACIÓN SPD · PE</div><p>Terminal PE destino documentado. Protecciones de respaldo, sección, longitud y adecuación de red: pendientes.</p><div class="form-field"><label for="spd_pe_bar">Conectar con barra PE</label><select id="spd_pe_bar" data-spd-pe="true">${choices.map(o=>option(o[0],o[1],d.spdPeBusbarId||'')).join('')}</select></div>`;
 }
 html+=field('Número de polos','poles',null,d.poles||'2P',[['1P','1P'],['1P+N','1P+N'],['2P','2P'],['3P','3P'],['3P+N','3P+N'],['4P','4P']]);
 if(d.kind==='MCB')html+=field('Curva','curve',null,d.curve||'C',[['B','B'],['C','C'],['D','D']]);
 if(d.kind==='RCD')html+=field('Sensibilidad (mA)','sensitivity',null,d.sensitivity||30,[[10,'10 mA'],[30,'30 mA'],[100,'100 mA'],[300,'300 mA'],[500,'500 mA']])+field('Tipo diferencial','rcdType',null,d.rcdType||'A',[['AC','AC'],['A','A'],['F','F'],['B','B']]);
 if(d.kind==='SPD'){
  html+='<div class="inspector-divider"></div><div class="section-heading">PERFIL SPD · DATOS NECESARIOS</div><p class="tiny-hint">No basta con indicar «T2». Especifica topología de red y niveles declarados. La protección de respaldo se revisa por separado.</p>';
  html+=field('Clase SPD','spdClass',null,d.spdClass||'', [['','Sin definir'],['T2','Tipo 2'],['T1+T2+T3','Tipo 1+2+3 · requiere revisión']]);
  html+=field('Red eléctrica','spdNetwork',null,d.spdNetwork||'', [['','Sin definir'],['TT','TT'],['TN-S','TN-S'],['TN-C','TN-C'],['IT','IT']]);
  html+=field('Uc, tensión continua (V)','spdUcV','number',d.spdUcV||'');
  html+=field('In mínimo 8/20 µs (kA)','spdInKa','number',d.spdInKa||'');
  html+=field('Imax mínimo (kA)','spdImaxKa','number',d.spdImaxKa||'');
  html+=field('Up máximo (kV), opcional','spdUpKv','number',d.spdUpKv||'');
 }
 if(d.kind==='CONTACT'){
  html+='<div class="inspector-divider"></div><div class="section-heading">PERFIL DE CONTACTOR</div><p class="tiny-hint">La corriente admisible depende de la categoría de utilización: AC-1 y AC-3 no son equivalentes.</p>';
  html+=field('Bobina de mando (V CA)','contactCoilV','number',d.contactCoilV||'');
  html+=field('Contactos principales','contactContacts',null,d.contactContacts||'', [['','Sin definir'],['2NA','2 NA'],['3NA','3 NA'],['4NA','4 NA'],['1NA+1NC','1 NA + 1 NC']]);
  html+=field('Categoría de empleo','contactUsageCategory',null,d.contactUsageCategory||'', [['','Sin definir'],['AC-1','AC-1'],['AC-3','AC-3'],['AC-7a','AC-7a'],['AC-7b','AC-7b']]);
  html+=field('Funcionamiento','contactMode',null,d.contactMode||'', [['','Sin definir'],['normal','Normal'],['silencioso','Silencioso'],['manual','Manual'],['forzado','Marcha forzada']]);
 }
 if(d.kind==='SWITCH'){
  html+='<div class="inspector-divider"></div><div class="section-heading">PERFIL DE SECCIONADOR</div><p class="tiny-hint">Distingue un módulo sobre carril DIN de un interruptor-seccionador para fijación a panel o puerta.</p>';
  html+=field('Categoría de utilización','switchDuty',null,d.switchDuty||'', [['','Sin definir'],['AC-21A','AC-21A'],['AC-22A','AC-22A'],['AC-21','AC-21']]);
  html+=field('Tipo de instalación','switchMount',null,d.switchMount||'', [['','Sin definir'],['DIN','Carril DIN'],['panel_no_din','Panel / no DIN']]);
  html+=field('Mando','switchControl',null,d.switchControl||'', [['','Sin definir'],['modular','Modular'],['frontal','Frontal'],['lateral','Lateral']]);
 }
 if(d.kind!=='SPD')html+=field('Intensidad asignada (A)','amp','number',d.amp||0);
 if(d.kind==='MCB')html+=field('Poder de corte requerido (kA; preliminar)','breakingKa','number',d.breakingKa||'');
 html+=`<div class="estimated-width"><strong>Ocupación de planificación: ${d.moduleSource==='catalog'?'':'≈ '}${d.modules} M</strong><span>${d.moduleSource==='catalog'?'Anchura tomada de referencia comercial preseleccionada. Compatibilidad pendiente de validar.':'Cálculo provisional según polos. No necesitas introducir módulos; se revisará con la ficha de fabricante.'}</span></div>`;
 html+=`<div class="inspector-divider"></div><div class="section-heading">FABRICANTE Y EQUIVALENCIA</div><div class="brand-match">${state.brand==='Generico'?'Modelo genérico sin referencia comercial.':m?`<strong>Preselección: ${escape(state.brand)} · ${escape(m.ref)}</strong><br>${escape(m.name)}<br>Ancho ${m.widthMm} mm · ${m.modules} M<br><em>Pendiente de validar todos los requisitos eléctricos y accesorios.</em><br><a href="${escape(m.source)}" target="_blank" rel="noopener noreferrer" class="small-link">Consultar ficha del fabricante ↗</a>`:`No existe una preselección en la pequeña biblioteca de prueba para ${escape(state.brand)}. El componente permanece genérico.`}</div>`;
 html+=window.PanelApparatusCandidates.inspector(alt(),d);
 const childCount=alt().devices.filter(x=>x.parent===d.id).length;
 const circuit=circuitsFor().find(c=>c.deviceId===d.id);
 if(circuit)html+=`<div class="inspector-divider"></div><div class="section-heading">SALIDA DE CIRCUITO</div><button class="button full" data-action="openCircuit">☷ Editar salida ${escape(circuit.code)}</button><p class="tiny-hint">${escape(circuit.destination||'Destino pendiente')} · ${escape(circuit.configuration||'conductores sin definir')}</p>`;
 else if(d.kind==='MCB'&&!childCount)html+=`<div class="inspector-divider"></div><div class="section-heading">SALIDA DE CIRCUITO</div><button class="button primary full" data-action="createCircuit">＋ Crear salida desde ${escape(d.label)}</button><p class="tiny-hint">Destino, conductores y secciones del circuito terminal; sin validación eléctrica.</p>`;
 if(alt().rows){const fixed=window.PanelDINReflow.pinned(alt(),d.id);html+=`<div class="inspector-divider"></div><div class="section-heading">COLOCACIÓN FÍSICA</div><p>${d.row===null?'Sin colocar':`Carril ${d.row+1}, módulo ${d.pos+1}`}. ${fixed?'Posición fijada: desbloquea antes de mover o arrastrar.':'Puedes reubicarlo arrastrando o usando los selectores.'}</p><button type="button" class="button full" data-action="toggleDinLock">${fixed?'📌 Desbloquear posición':'📍 Fijar posición'}</button>${window.PanelMountClearance.inspector(alt(),d,escape)}<label class="form-field" style="display:block;padding:8px 0">Reserva lateral derecha (mm, opcional)<input data-din-clearance="${escape(d.id)}" type="number" min="0" max="300" step="0.1" value="${escape(alt().dinClearancesMm?.[d.id]??'')}" placeholder="Sin declarar" style="width:100%;padding:8px;margin-top:4px" /></label><label class="form-field" style="display:block;padding:8px 0">Reserva lateral izquierda (mm, opcional)<input data-din-left-clearance="${escape(d.id)}" type="number" min="0" max="300" step="0.1" value="${escape(alt().dinLeftClearancesMm?.[d.id]??'')}" placeholder="Sin declarar" style="width:100%;padding:8px;margin-top:4px" /></label><p class="tiny-hint">Las reservas laterales izquierda y derecha son datos introducidos o confirmados por usuario, redondeados a módulos enteros para planificación. Vacío NO significa espacio comprobado.</p>${field('Carril','moveRow',null,d.row??0,Array.from({length:alt().rows},(_,i)=>[i,`Carril ${i+1}`]))}${field('Módulo inicial','movePos',null,d.pos??0,Array.from({length:alt().slots},(_,i)=>[i,`Módulo ${i+1}`]))}<button type="button" class="button full" data-action="move">Mover a la posición indicada</button>`;}
 html+=`<div class="inspector-divider"></div><div class="section-heading">EDITAR TOPOLOGÍA</div><button type="button" class="button full upstream-button" data-action="insertUpstream">＋ Insertar protección aguas arriba</button><p class="tiny-hint">Se colocará entre la alimentación actual y este componente; las demás derivaciones seguirán intactas.</p>${childCount>1?`<button type="button" class="button full upstream-button" data-action="insertBranch">＋ Insertar antes de la derivación</button><p class="tiny-hint">Se colocará entre ${escape(d.label)} y el punto donde se abren sus ${childCount} ramas aguas abajo.</p>`:''}<div class="inspector-divider"></div><button type="button" class="button danger full" data-action="delete">Eliminar componente</button><p class="data-note">No se realizan verificaciones eléctricas automáticamente.</p>`;
 $('inspector').innerHTML=html;}
function render(){const a=alt();
 if(view!=='unifilar'){canvasFocus=false;inspectorDrawer=false;}
 document.body.classList.toggle('view-unifilar',view==='unifilar');
 document.body.classList.toggle('canvas-focus',canvasFocus);
 document.body.classList.toggle('inspector-visible',canvasFocus&&inspectorDrawer);$('alternativeSelect').innerHTML=Object.entries(state.alternatives).map(([k,v])=>option(k,v.name,k===state.active?k:null)).join('');$('alternativeSelect').value=state.active;
 $('brandSelect').innerHTML=['Generico','Schneider','Legrand','Hager'].map(b=>option(b,b==='Generico'?'Sin fabricante · genérico':b,state.brand)).join('');
 $('brandHint').textContent=brandSummary();$('reserveInput').value=String(a.reserve);
 $('library').innerHTML=library.map(e=>`<div class="library-item"><span class="library-icon">${escape(e.symbol)}</span><span class="library-info"><strong>${escape(e.label)}</strong><small>${escape(e.poles+' · ancho automático')}</small></span><button class="round-add" data-add="${escape(e.kind)}" title="Añadir ${escape(e.label)}">+</button></div>`).join('');
 document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
 $('workflowAssistant').innerHTML=window.PanelWorkflowGuidance.render(a,state.brand,escape);
 $('summary').innerHTML=[['Dispositivos',a.devices.length],['Ocupación estimada',a.devices.reduce((n,d)=>n+Number(d.modules),0)+' M'],['Propuesta',a.rows?a.rows+' × '+a.slots+' M':'Pendiente'],['Fabricante',state.brand==='Generico'?'Genérico':state.brand+' · revisar']].map(([k,v])=>`<div class="stat"><strong>${escape(v)}</strong><span>${escape(k)}</span></div>`).join('');
 const body=$('editorArea');body.className='editor-grid'+(['unifilar','physical','materials','catalog','checks'].includes(view)?' single':'');
 if(view==='both')body.innerHTML=renderSchematic()+renderCabinet();else if(view==='unifilar')body.innerHTML=renderSchematic();else if(view==='physical')body.innerHTML=renderCabinet();else if(view==='materials')body.innerHTML=renderMaterials();else if(view==='catalog')body.innerHTML=window.PanelCommercialUI.render();else body.innerHTML=renderChecks();
 renderProposalChoices();if($('diagramViewport'))requestAnimationFrame(restoreCamera);
 $('pageTitle').textContent=({both:'Del unifilar al cuadro',unifilar:'Editor de unifilar',physical:'Diseño físico',materials:'Materiales y PVP',catalog:'Biblioteca comercial',checks:'Comprobaciones'})[view];
 const notes=[];if(a.layoutDirty&&a.rows)notes.push('La distribución necesita revisión tras los últimos cambios.');
 if(!a.rows)notes.push('Todavía no has generado una propuesta de envolvente.');
 if(state.brand!=='Generico')notes.push(brandSummary());
 notes.push('Este proyecto es un prototipo funcional; NO garantiza seguridad eléctrica, conformidad normativa ni aptitud para fabricación.');
 $('noticePanel').innerHTML='<strong>Estado y advertencias</strong>'+notes.map(t=>`<div class="notice-line ${t.startsWith('Este')?'':'warn'}">${escape(t)}</div>`).join('');inspector();}

function renderProposalChoices(){
 const target=$('enclosureChoices'),a=alt();
 if(!a.rows){target.innerHTML='';return;}
 const proposal=E.propose(a.devices,a.reserve);
 if(!proposal.ok){target.innerHTML='';return;}
 const options=proposal.options.slice(0,5), current=options.findIndex(o=>o.rows===a.rows&&o.slots===a.slots);
 target.innerHTML=`<div class="proposal-topline"><strong>Alternativas de envolvente modular</strong><span>Capacidad estimada con ${a.reserve}% de reserva · Selecciona la que prefieras</span></div><div class="proposal-options">${options.map((o,i)=>`<button class="proposal-option ${o.rows===a.rows&&o.slots===a.slots?'chosen':''}" type="button" data-proposal-option="${i}"><strong>${o.rows} × ${o.slots} M</strong><small>${o.capacity} módulos nominales · ${o.capacity-proposal.used} M libres</small></button>`).join('')}</div><p class="tiny-hint">${a.layoutDirty?'⚠ Distribución desactualizada; pulsa una alternativa para recalcular. ':' '}Formatos genéricos, pendientes de dimensiones reales, cableado y verificación térmica.</p>`;
}
function diagramSize(){const el=$('diagramViewport');if(!el)return null;return {el,svg:el.querySelector('svg'),w:el.clientWidth,h:el.clientHeight};}
function clampZoom(z){return Math.max(.15,Math.min(2.6,z));}
function updateCamera(){const d=diagramSize();if(!d||!d.w||!d.h)return;
 camera.zoom=clampZoom(camera.zoom);
 const vw=d.w/camera.zoom,vh=d.h/camera.zoom;
 d.svg.setAttribute('viewBox',`${camera.x-vw/2} ${camera.y-vh/2} ${vw} ${vh}`);
 const zoom=$('zoomLabel');if(zoom)zoom.textContent=Math.round(camera.zoom*100)+' %';
}
function centerRoot(){const d=diagramSize();if(!d)return;
 const tree=E.verticalTree(alt().devices), loc=tree.locations;
 const roots=alt().devices.filter(x=>!x.parent||!alt().devices.some(y=>y.id===x.parent));
 const xs=roots.map(x=>loc.get(x.id)?.x).filter(x=>x!==undefined);
 camera.zoom=.85;camera.x=xs.length?xs.reduce((s,x)=>s+x,0)/xs.length:tree.width/2;
 camera.y=d.h/(2*camera.zoom)+10;camera.initialized=true;camera.alternative=state.active;updateCamera();
}
function focusSelected(){const pt=E.verticalTree(alt().devices).locations.get(selected);if(!pt)return;camera.x=pt.x;camera.y=pt.y;camera.initialized=true;updateCamera();}
function fitCanvas(){const d=diagramSize();if(!d)return;const t=E.verticalTree(alt().devices);
 camera.zoom=clampZoom(Math.min(d.w/(t.width+40),d.h/(t.height+40)));
 camera.x=t.width/2;camera.y=t.height/2;camera.initialized=true;camera.alternative=state.active;updateCamera();
}
function zoomCanvas(factor,px=null,py=null){const d=diagramSize();if(!d)return;
 const old=camera.zoom,next=clampZoom(old*factor);
 const x=px===null?d.w/2:px,y=py===null?d.h/2:py;
 camera.x+=(x-d.w/2)*(1/old-1/next);
 camera.y+=(y-d.h/2)*(1/old-1/next);
 camera.zoom=next;updateCamera();
}
function restoreCamera(){const d=diagramSize();if(!d)return;
 if(!camera.initialized||camera.alternative!==state.active){centerRoot();return;}
 updateCamera();
}
let drag=null;
document.addEventListener('pointerdown',e=>{const el=e.target.closest('#diagramViewport');if(!el||e.target.closest('[data-device],[data-circuit-id],[data-insert-child],[data-insert-branch]')||e.button!==0)return;
 drag={id:e.pointerId,x:e.clientX,y:e.clientY};el.setPointerCapture(e.pointerId);el.classList.add('panning');
});
document.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
 camera.x-=dx/camera.zoom;camera.y-=dy/camera.zoom;updateCamera();
});
document.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;
 document.querySelector('#diagramViewport')?.classList.remove('panning');drag=null;
});
document.addEventListener('wheel',e=>{const el=e.target.closest('#diagramViewport');if(!el)return;
 e.preventDefault();const r=el.getBoundingClientRect();
 if(e.ctrlKey||e.metaKey){zoomCanvas(e.deltaY<0?1.12:1/1.12,e.clientX-r.left,e.clientY-r.top);}
 else {camera.x+=(e.deltaX+(e.shiftKey?e.deltaY:0))/camera.zoom;camera.y+=(e.shiftKey?0:e.deltaY)/camera.zoom;updateCamera();}
},{passive:false});
// La selección comercial solo informa y preselecciona; no certifica compatibilidad.
function brandSpec(d){
 const parts=[d.poles||'Polos pendientes',Number(d.amp)>0?d.amp+' A':'Intensidad pendiente'];
 if(d.kind==='MCB')parts.push('Curva '+(d.curve||'?'),Number(d.breakingKa)>0?'Icn requerido ≥ '+d.breakingKa+' kA':'Icn requerido: pendiente');
 if(d.kind==='RCD')parts.push((d.sensitivity||'?')+' mA','Tipo '+(d.rcdType||'?'));
 return parts.join(' · ');
}
function brandCandidateLabel(c){
 const parts=[c.referencia,c.polos,c.intensidad_A===null?'':c.intensidad_A+' A'];
 if(c.familia==='MCB')parts.push('curva '+c.curva,c.Icn_60898_kA==null?'Icn s/d':'Icn '+c.Icn_60898_kA+' kA');
 if(c.familia==='RCCB')parts.push((c['IΔn_mA']??'?')+' mA','tipo '+(c.tipo_diferencial||'?'));
 parts.push(c.ancho_mm!=null?c.ancho_mm+' mm':'ancho s/d');
 return parts.filter(Boolean).join(' · ');
}
function brandCandidateDetail(d,c){
 if(!c)return `<div class="brand-preview-empty">Elige una referencia para comparar sus características con el aparato genérico. Mientras no elijas, conserva la ocupación provisional.</div>`;
 const estimated=E.estimateModules(d),slots=Math.ceil(Number(c.ancho_mm)/18);
 const diff=slots-estimated,diffText=diff>0?'+'+diff+' M':diff<0?diff+' M':'Sin cambio';
 const dims=`${escape(String(c.ancho_mm))} mm · ${slots} M de planificación`;
 const electric=c.familia==='MCB'?`Curva ${escape(c.curva)} · Icn IEC 60898-1: ${escape(String(c.Icn_60898_kA))} kA`:c.familia==='RCCB'?`${escape(c['IΔn_mA'])} mA · tipo ${escape(c.tipo_diferencial)}`:'Consultar ficha';
 return `<div class="candidate-detail">
   <div class="candidate-ref"><strong>${escape(c.referencia)}</strong><span class="badge green">Coincidencia principal condicionada</span></div>
   <div class="candidate-metadata"><span>${escape(c.polos)} · ${escape(c.intensidad_A)} A</span><span>${electric}</span></div>
   <div class="geometry-compare">
     <div><small>Genérico provisional</small><strong>≈ ${estimated} M</strong><span>≈ ${estimated*18} mm de planificación</span></div>
     <div><small>Referencia comercial</small><strong>${dims}</strong><span>Anchura documentada · ranuras de 18 mm</span></div>
     <div><small>Diferencia de ocupación</small><strong class="${diff>0?'compare-grow':diff<0?'compare-shrink':'compare-equal'}">${diffText}</strong><span>No expresa holgura de montaje</span></div>
   </div>
   <div class="validation-lines"><span>✓ Coinciden los parámetros genéricos comparados</span><span>⚠ ${escape(c.reason||'Preselección condicionada')}</span></div>
   <p class="pending-check">Pendiente: ${escape(c.comprobaciones_restantes||'Aptitud de empleo y montaje')}.</p>
   <a class="small-link" href="${escape(c.fuente)}" target="_blank" rel="noopener noreferrer">Abrir ficha de producto ↗</a>
 </div>`;
}
/* Dos fuentes en una única pantalla:
 * a) minicátalogo legacy: dimensiones documentadas, modifica anchura PLANIFICADA;
 * b) biblioteca técnica: referencia documental sin dimensiones aplicables.
 * El aparato genérico y su topología nunca se sustituyen automáticamente. */
const documentaryValue=ref=>'doc:'+ref;
function brandDocumentary(d,ref){
 const record=window.PanelCommercial.get(state.brand,ref);
 if(!record)return null;
 const evaluation=window.PanelApparatusCandidates.evaluate(d,record);
 return {record,...evaluation};
}
function brandDocumentaryLabel(candidate){
 const a=candidate.record.atributos||{},r=candidate.record;
 const parts=[r.referencia,window.PanelApparatusCandidates.normalizePoles(a.polos)||'polos pendientes'];
 if(a.amp)parts.push(a.amp+' A');
 if(a.curva)parts.push('curva '+a.curva);
 if(a.icn_60898_ka??a.icn_ka)parts.push('Icn '+(a.icn_60898_ka??a.icn_ka)+' kA');
 parts.push('solo documental · dimensión pendiente de aplicar');
 return parts.join(' · ');
}
function brandDocumentaryDetail(d,c){
 if(!c||!c.eligible)return '<div class="brand-preview-empty">Ficha no elegible con los requisitos actuales. Revisa polos, corriente, curva, poder de corte y vigencia.</div>';
 const r=c.record,att=r.atributos||{},est=E.estimateModules(d);
 const dims=Number(att.modulos)>0&&Number.isInteger(Number(att.modulos))&&Number(att.ancho_mm)>0?
   'Anchura comercial pendiente de aplicar: ficha '+att.ancho_mm+' mm; reserva '+att.modulos+' M (18 mm/M planificados)':
   'Anchura comercial pendiente de validar · no se recalcula la envolvente';
 const tax=r.pvp_sin_iva_eur!=null?'PVP sin IVA documentado: '+r.pvp_sin_iva_eur+' EUR':
   r.precio_publicado_eur!=null?'Importe web '+r.precio_publicado_eur+' EUR · IVA sin confirmar':'Precio no documentado';
 return '<div class="candidate-detail" data-documentary-preview="'+escape(r.referencia)+'">'
   +'<div class="candidate-ref"><strong>'+escape(r.fabricante+' '+r.referencia)+'</strong><span class="badge amber">Solo candidata documental · NO VALIDADA</span></div>'
   +'<div class="candidate-metadata"><span>'+escape(r.descripcion)+'</span><span>'+escape(dims)+'</span></div>'
   +'<div class="geometry-compare"><div><small>Dispositivo genérico</small><strong>≈ '+est+' M</strong><span>Conservado en diseño y unifilar</span></div>'
   +'<div><small>Referencia comercial</small><strong>Sin anchura aplicada</strong><span>Sin afirmar montaje compatible ni espacio suficiente</span></div></div>'
   +'<p class="pending-check">'+escape(c.pending.join(' · ')||'Comprobar condiciones técnicas y geometría de instalación')+'</p>'
   +(window.PanelCommercialPlacement.canApply(d,r.fabricante,r.referencia)?
      '<label class="form-field" style="display:block;padding:8px 0" data-commercial-geometry-control="'+escape(d.id)+'">'
      +'<input type="checkbox" data-apply-geometry="'+escape(d.id)+'" value="'+escape(r.referencia)+'" '
      +(alt().physicalSelections?.[d.id]?.fabricante===r.fabricante&&alt().physicalSelections?.[d.id]?.referencia===r.referencia?'checked':'')+'> '
      +'<strong>Confirmar ancho de ficha '+escape(att.ancho_mm)+' mm; reservar '+escape(att.modulos)+' M de planificación</strong></label>'
      +'<p class="tiny-hint">Confirmación manual: no valida capacidad de corte en la instalación, bornes, coordinación ni montaje. '
      +'Ficha dimensional <a class="small-link" href="'+escape(r.geometria_documental.fuente)+'" target="_blank" rel="noopener noreferrer">origen y fecha ↗</a>.</p>'
      :'<p class="tiny-hint">Geometría física no aplicable hasta verificar la ficha individual.</p>')
   +'<p class="small-text">'+escape(tax)+'</p>'
   +(r.incidencia_fuente?'<p class="pending-check">'+escape(r.incidencia_fuente.nota)+'</p>':'')
   +'<a class="small-link" href="'+escape(r.url_oficial)+'" target="_blank" rel="noopener noreferrer">Ficha del fabricante ↗</a></div>';
}
function brandReviewDetail(d,value){
 if(!value)return brandCandidateDetail(d,null);
 if(value.startsWith('doc:'))return brandDocumentaryDetail(d,brandDocumentary(d,value.slice(4)));
 return brandCandidateDetail(d,M.find(d,state.brand,value));
}
function refreshBrandDetail(select){
 const d=alt().devices.find(x=>x.id===select.dataset.brandPick);
 const target=select.closest('tr')?.querySelector('[data-brand-detail]');
 if(!d||!target)return;
 target.innerHTML=brandReviewDetail(d,select.value);
}
function openBrandReview(){
 if(state.brand==='Generico')return toast('Selecciona primero Schneider, Legrand o Hager.');
 const P=window.PanelApparatusCandidates;
 const rows=alt().devices.map(d=>{
   const allLegacy=M.candidates(d,state.brand),possible=allLegacy.filter(c=>!c.blocked),blocked=allLegacy.filter(c=>c.blocked);
   const documents=P.list(d,state.brand).filter(c=>c.eligible);
   const documented=new Set(documents.map(c=>c.record.referencia));
   const legacy=possible.filter(c=>!documented.has(c.referencia));
   const prior=alt().apparatusCandidates?.[d.id];
   const currentDoc=prior?.fabricante===state.brand&&documents.some(c=>c.record.referencia===prior.referencia)
       ?documentaryValue(prior.referencia):'';
   const previousLegacy=alt().assignments?.[d.id]||'';
   const current=currentDoc||(!documented.has(previousLegacy)?previousLegacy:'');
   const oldOptions=legacy.map(c=>'<option value="'+escape(c.referencia)+'" '+(current===c.referencia?'selected':'')+'>'+escape(brandCandidateLabel(c))+'</option>').join('');
   const documentaryOptions=documents.map(c=>'<option value="'+escape(documentaryValue(c.record.referencia))+'" '+(current===documentaryValue(c.record.referencia)?'selected':'')+'>'+escape(brandDocumentaryLabel(c))+'</option>').join('');
   const opts=(legacy.length?'<optgroup label="Dimensión documentada · preselección antigua">'+oldOptions+'</optgroup>':'')
      +(documents.length?'<optgroup label="Fichas documentales · montaje por verificar">'+documentaryOptions+'</optgroup>':'');
   const review=blocked.length?'<details class="blocked-candidates"><summary>'+blocked.length+' referencia(s) del minicátalogo bloqueada(s)</summary>'
     +blocked.map(c=>'<p><b>'+escape(c.referencia)+'</b> · '+escape(c.reason)+'</p>').join('')+'</details>':'';
   const otherBrand=prior?.fabricante!==undefined&&prior.fabricante!==state.brand?
     '<p class="tiny-hint">Candidata previa '+escape(prior.fabricante+' '+prior.referencia)+' conservada hasta que la sustituyas expresamente.</p>':'';
   const count=legacy.length+documents.length;
   return '<tr><td><strong>'+escape(d.label)+'</strong><div class="generic-spec">'+escape(d.name)+'</div><div class="small-text">'+escape(brandSpec(d))+'</div></td>'
     +'<td><select class="select" aria-label="Referencia para '+escape(d.label)+'" data-brand-pick="'+escape(d.id)+'"><option value="">Sin asignar · mantener genérico</option>'+opts+'</select>'
     +'<div class="candidate-count" data-brand-count="'+escape(d.id)+'">'+(count?legacy.length+' con dimensiones de minicátalogo · '+documents.length+' candidata(s) documentales':'Sin candidato documentado que cumpla los requisitos actuales')+'</div>'
     +otherBrand+review+'</td>'
     +'<td data-brand-detail="'+escape(d.id)+'">'+brandReviewDetail(d,current)+'</td></tr>';
 }).join('');
 $('brandReviewTable').innerHTML=rows;
 $('brandReviewTitle').textContent='Comparar y preseleccionar · '+state.brand;
 $('brandReview').classList.add('open');$('brandReview').setAttribute('aria-hidden','false');
}
$('brandReviewTable').addEventListener('change',e=>{if(e.target.matches('[data-brand-pick]'))refreshBrandDetail(e.target);});
function autoPickBrandReview(){
 let count=0;
 document.querySelectorAll('[data-brand-pick]').forEach(sel=>{
   if(sel.value)return;
   // Nunca seleccionar automáticamente una ficha documental con montaje pendiente.
   const first=[...sel.options].find(o=>o.value&&!o.value.startsWith('doc:'));
   if(first){sel.value=first.value;refreshBrandDetail(sel);count++;}
 });
 if(!count)return toast('No hay opciones con dimensión documentada para autoseleccionar. Las fichas documentales requieren elección manual.');
 toast(count+' referencia(s) del minicátalogo preseleccionada(s). Revisa antes de aplicar.');
}
function closeBrandReview(){$('brandReview').classList.remove('open');$('brandReview').setAttribute('aria-hidden','true');}
$('openBrandReview').addEventListener('click',openBrandReview);
$('closeBrandReview').addEventListener('click',closeBrandReview);
$('brandReview').addEventListener('click',e=>{if(e.target===$('brandReview'))closeBrandReview();});
$('applyBrandReview').addEventListener('click',()=>{
 const picks={},documents={},geometry={};
 // Validar TODO antes de mutar cualquier estado.
 for(const sel of document.querySelectorAll('[data-brand-pick]')){
   const d=alt().devices.find(x=>x.id===sel.dataset.brandPick);
   if(!d){toast('El aparato ya no existe.');return;}
   if(!sel.value)continue;
   if(sel.value.startsWith('doc:')){
     const ref=sel.value.slice(4),review=brandDocumentary(d,ref);
     if(!review?.eligible){toast('La ficha ya no satisface los requisitos. Vuelve a comparar.');return;}
     documents[d.id]=ref;
     const checkbox=sel.closest('tr')?.querySelector('[data-apply-geometry="'+d.id+'"]');
     if(checkbox?.checked){
       if(checkbox.value!==ref||!window.PanelCommercialPlacement.canApply(d,state.brand,ref)){
         toast('No se puede aplicar geometría de esta referencia.');return;
       }
       geometry[d.id]=ref;
     }
   } else {
     if(!M.find(d,state.brand,sel.value)){toast('Candidato del minicátalogo no válido. Revisa la selección.');return;}
     picks[d.id]=sel.value;
   }
 }
 const prevAssignments=alt().assignments||{};
 const prevGeometry=alt().physicalSelections||{};
 const nextGeometry=Object.fromEntries(Object.entries(geometry).map(([id,ref])=>[id,{
   fabricante:state.brand,referencia:ref,estado:window.PanelCommercialPlacement.STATUS,
   fuente:window.PanelCommercialPlacement.SOURCE}]));
 const changedWidth=JSON.stringify(picks)!==JSON.stringify(prevAssignments)||
   JSON.stringify(nextGeometry)!==JSON.stringify(prevGeometry);
 saveAction(()=>{
   const a=alt();
   a.assignments=picks;
   a.physicalSelections={};
   a.apparatusCandidates={...(a.apparatusCandidates||{})};
   for(const d of a.devices){
     if(documents[d.id]){
       // Misma ruta de validación/persistencia que el comparador del inspector.
       window.PanelApparatusCandidates.choose(a,d.id,state.brand,documents[d.id]);
       if(geometry[d.id])window.PanelCommercialPlacement.set(a,d.id,state.brand,geometry[d.id]);
     }else if(picks[d.id]||a.apparatusCandidates[d.id]?.fabricante===state.brand){
       delete a.apparatusCandidates[d.id];
     }
   }
   if(changedWidth){a.layoutDirty=true;window.PanelMountClearance.clearProfiles(a);}
 },{electrical:false});
 closeBrandReview();
 const n=Object.keys(documents).length,k=Object.keys(picks).length;
 toast(n+' candidata(s) documentales, '+Object.keys(geometry).length+' geometría(s) confirmadas y '+k+' preselección(es) dimensionales. El genérico se conserva.');
});
$('autoPickBrandReview').addEventListener('click',autoPickBrandReview);
$('brandSelect').addEventListener('change',e=>{saveAction(()=>{state.brand=e.target.value;syncWidthsAcrossAlternatives();},{electrical:false});toast('Marca elegida. Los aparatos siguen genéricos hasta confirmar candidatos.');if(state.brand!=='Generico')openBrandReview();});
$('reserveInput').addEventListener('change',e=>saveAction(()=>{alt().reserve=Number(e.target.value);alt().layoutDirty=true;},{electrical:false}));
$('alternativeSelect').addEventListener('change',e=>{dinProposalOpen=false;dinPreviewPlan=null;state.active=e.target.value;selected=alt().devices[0]?.id||null;selectedCircuit=null;selectedBar=null;persist();render();});
$('duplicateBtn').addEventListener('click',()=>{const suffix=Object.keys(state.alternatives).length+1;let keyName='B';while(state.alternatives[keyName])keyName=String.fromCharCode(keyName.charCodeAt(0)+1);saveAction(()=>{state.alternatives[keyName]=clone(alt());state.alternatives[keyName].name='Alternativa '+keyName;state.active=keyName;},{electrical:false});toast('Alternativa independiente creada.');});
$('proposeBtn').addEventListener('click',doProposal);
$('undoBtn').addEventListener('click',()=>{dinProposalOpen=false;dinPreviewPlan=null;if(!undo.length)return toast('No hay cambios que deshacer.');redo.push(clone(state));state=undo.pop();persist();render();});
$('redoBtn').addEventListener('click',()=>{dinProposalOpen=false;dinPreviewPlan=null;if(!redo.length)return toast('No hay cambios que rehacer.');undo.push(clone(state));state=redo.pop();persist();render();});
document.addEventListener('click',e=>{
 const flowDevice=e.target.closest('[data-flow-device]');
 if(flowDevice){
  const id=flowDevice.dataset.flowDevice;
  if(!alt().devices.some(d=>d.id===id))return;
  selected=id;selectedBar=null;selectedCircuit=null;view='unifilar';canvasFocus=false;inspectorDrawer=false;render();
  const input=document.querySelector('[data-edit="'+flowDevice.dataset.flowField+'"]');
  if(input)requestAnimationFrame(()=>input.focus());
  return;
 }
 const flowExport=e.target.closest('[data-flow-export]');
 if(flowExport){
  if(flowExport.dataset.flowExport==='svg')exportSchematic();
  else if(flowExport.dataset.flowExport==='csv')exportMaterialsCSV();
  else if(flowExport.dataset.flowExport==='json')$('exportBtn').click();
  return;
 }
 const flowView=e.target.closest('[data-flow-view]');
 if(flowView){const dest=flowView.dataset.flowView;if(dest==='brand'){canvasFocus=false;inspectorDrawer=false;view='unifilar';render();$('brandSelect').focus();$('brandSelect').scrollIntoView({block:'nearest'});toast('Elige una marca en Fabricante de referencia o conserva el cuadro genérico. Después revisa las preselecciones.');return;}view=dest;selectedCircuit=null;selectedBar=null;canvasFocus=false;inspectorDrawer=false;render();return;}
 const assemblyAdd=e.target.closest('[data-assembly-add]');if(assemblyAdd){
  const id=assemblyAdd.dataset.assemblyAdd,host=assemblyAdd.closest('[data-assembly-host]');
  const [brand,ref]=host.querySelector('[data-assembly-aux]').value.split('|');
  const side=host.querySelector('[data-assembly-side]').value,raw=host.querySelector('[data-assembly-width]').value;
  const trial=clone(alt());
  if(!window.PanelDINAssemblies.addAux(trial,id,brand,ref,side,raw,state.brand))return toast('Auxiliar no anotado: comprueba lado admitido, referencia y anchura.');
  saveAction(()=>window.PanelDINAssemblies.addAux(alt(),id,brand,ref,side,raw,state.brand),{electrical:false});
  document.querySelector('[data-assemblies-panel]')?.setAttribute('open','');
  toast('Añadido al conjunto documental, pendiente de compatibilidad real.');return;
 }
 const assemblyRemove=e.target.closest('[data-assembly-remove]');if(assemblyRemove){
  const id=assemblyRemove.dataset.assemblyRemove,index=Number(assemblyRemove.dataset.assemblyIndex);
  if(!window.PanelDINAssemblies.removeAux(clone(alt()),id,index))return;
  saveAction(()=>window.PanelDINAssemblies.removeAux(alt(),id,index),{electrical:false});
  document.querySelector('[data-assemblies-panel]')?.setAttribute('open','');return;
 }
 const combAdd=e.target.closest('[data-comb-add]');if(combAdd){
  const form=combAdd.closest('[data-comb-editor]');
  const [brand,ref]=form.querySelector('[data-comb-ref]').value.split('|');
  const ids=[...form.querySelectorAll('[data-comb-member]:checked')].map(el=>el.dataset.combMember);
  if(!window.PanelDINAssemblies.addComb(clone(alt()),brand,ref,ids,state.brand))return toast('Marca dos o más equipos diferentes; comprueba referencia de peine.');
  saveAction(()=>window.PanelDINAssemblies.addComb(alt(),brand,ref,ids,state.brand),{electrical:false});
  document.querySelector('[data-assemblies-panel]')?.setAttribute('open','');
  toast('Tramo documental guardado. No implica conexión eléctrica.');return;
 }
 const combRemove=e.target.closest('[data-comb-remove]');if(combRemove){
  if(!window.PanelDINAssemblies.removeComb(clone(alt()),combRemove.dataset.combRemove))return;
  saveAction(()=>window.PanelDINAssemblies.removeComb(alt(),combRemove.dataset.combRemove),{electrical:false});
  document.querySelector('[data-assemblies-panel]')?.setAttribute('open','');return;
 }
 const reserveAssembly=e.target.closest('[data-assembly-reserve]');if(reserveAssembly){
  const id=reserveAssembly.dataset.assemblyReserve,side=reserveAssembly.dataset.assemblyReserveSide||'right';
  const suggested=window.PanelDINAssemblies.report(alt(),state.brand).reserves.find(x=>x.id===id&&x.side===side&&x.neededMm<=300);
  if(!suggested)return toast('Reserva caducada: revisa la configuración.');
  const trial=clone(alt());
  const setter=side==='left'?window.PanelDINReflow.setLeftClearance:window.PanelDINReflow.setClearance;
  if(!setter(trial,id,String(Math.max(suggested.neededMm,suggested.existingMm))))return toast('No se pudo reservar la dimensión indicada.');
  saveAction(()=>setter(alt(),id,String(Math.max(suggested.neededMm,suggested.existingMm))),{electrical:false});
  document.querySelector('[data-assemblies-panel]')?.setAttribute('open','');
  toast('Reserva lateral aceptada; revisa colisiones DIN y redistribución antes de montar.');return;
 }
 const accessorySave=e.target.closest('[data-accessory-save]');if(accessorySave){const id=accessorySave.dataset.accessorySave,row=accessorySave.closest('[data-accessory-row]');if(!row)return;const selectedRef=row.querySelector('[data-accessory-ref]').value,side=row.querySelector('[data-accessory-side]').value,raw=row.querySelector('[data-accessory-width]').value;const parts=selectedRef.split('|'),trial=clone(alt());if(!window.PanelPhysicalAccessories.set(trial,id,parts[0]||'',parts[1]||'',side,raw,state.brand)){toast('Anotación no válida. Para un peine elige «Peine», para un auxiliar una posición lateral pendiente o explícita.');return;}saveAction(()=>window.PanelPhysicalAccessories.set(alt(),id,parts[0]||'',parts[1]||'',side,raw,state.brand),{electrical:false});document.querySelector('[data-accessories-panel]')?.setAttribute('open','');toast('Accesorio anotado sin aplicar ni certificar montaje.');return;}
 const v=e.target.closest('[data-view]');if(v){view=v.dataset.view;selectedCircuit=null;selectedBar=null;canvasFocus=false;inspectorDrawer=false;render();return;}
 const apparPick=e.target.closest('[data-apparatus-pick]');
 if(apparPick){const id=apparPick.dataset.apparatusPick,brand=apparPick.dataset.apparatusPickBrand,ref=apparPick.dataset.apparatusRef;
  const hypothetical=clone(alt());if(!window.PanelApparatusCandidates.choose(hypothetical,id,brand,ref))return toast('No es candidata admisible con los datos críticos actuales.');
  saveAction(()=>{
   const a=alt(),old=a.physicalSelections?.[id],oldCandidate=a.apparatusCandidates?.[id];
   if(oldCandidate&&(oldCandidate.fabricante!==brand||oldCandidate.referencia!==ref)&&a.dinMountProjectionMm)delete a.dinMountProjectionMm[id];
   if(old&&(old.fabricante!==brand||old.referencia!==ref)){
     window.PanelCommercialPlacement.clear(a,id);if(a.dinMountProjectionMm)delete a.dinMountProjectionMm[id];a.layoutDirty=true;
   }
   window.PanelApparatusCandidates.choose(a,id,brand,ref);
  },{electrical:false});
  toast('Referencia guardada SOLO como candidata documental. El aparato y su posición siguen siendo genéricos.');return;}
 const apparClear=e.target.closest('[data-apparatus-clear]');
 if(apparClear){const id=apparClear.dataset.apparatusClear;
  saveAction(()=>{const a=alt();if(a.physicalSelections?.[id])a.layoutDirty=true;
   window.PanelCommercialPlacement.clear(a,id);window.PanelApparatusCandidates.clear(a,id);if(a.dinMountProjectionMm)delete a.dinMountProjectionMm[id];
  },{electrical:false});
  toast('Candidata y eventual confirmación dimensional retiradas.');return;}
 const pick=e.target.closest('[data-enclosure-pick]');
 if(pick){const brand=pick.dataset.enclosurePickBrand,ref=pick.dataset.enclosurePick;const candidate=clone(alt());if(!window.PanelEnclosureCandidates.choose(candidate,brand,ref))return toast('Esa envolvente no figura entre las candidatas por capacidad modular.');saveAction(()=>{window.PanelEnclosureCandidates.choose(alt(),brand,ref);alt().dinRailDoorMm={};},{electrical:false});toast('Referencia guardada como CANDIDATA. No se ha validado el montaje ni alterado la geometría.');return;}
 const clearEnclosure=e.target.closest('[data-enclosure-clear]');
 if(clearEnclosure){saveAction(()=>{window.PanelEnclosureCandidates.clear(alt());alt().dinRailDoorMm={};},{electrical:false});toast('Se ha quitado la preselección comercial.');return;}
 const barBtn=e.target.closest('[data-busbar-id]');if(barBtn){selectedBar=barBtn.dataset.busbarId;selectedCircuit=null;if(canvasFocus)inspectorDrawer=true;render();return;}
 const cnode=e.target.closest('[data-circuit-id]');if(cnode){selectedBar=null;selectedCircuit=cnode.dataset.circuitId;selected=currentCircuit()?.deviceId||selected;render();return;}
 const add=e.target.closest('[data-add]');if(add){addDevice(add.dataset.add);return;}
 const branchButton=e.target.closest('[data-insert-branch]');if(branchButton){openInsert(null,branchButton.dataset.insertBranch,'branch');return;}
  const insertionButton=e.target.closest('[data-insert-child]');if(insertionButton){openInsert(insertionButton.dataset.insertChild,insertionButton.dataset.insertParent||null);return;}
 const optionBtn=e.target.closest('[data-proposal-option]');if(optionBtn){const p=E.propose(alt().devices,alt().reserve);const ix=Number(optionBtn.dataset.proposalOption);if(p.ok&&p.options[ix])applyProposal(p.options[ix]);return;}
 const device=e.target.closest('[data-device]');if(device){selected=device.dataset.device;selectedCircuit=null;selectedBar=null;render();return;}
 const dinAct=e.target.closest('[data-din-action]');
 if(dinAct){
  const mode=dinAct.dataset.dinAction;
  if(mode==='preview'){dinPreviewPlan=window.PanelDINReflow.plan(alt());dinProposalOpen=true;render();}
  else if(mode==='cancel'){dinProposalOpen=false;dinPreviewPlan=null;render();}
  else if(mode==='confirm'){
   const proposal=dinPreviewPlan;
    if(proposal?.ok&&proposal.signature!==window.PanelDINReflow.signature(alt())){dinPreviewPlan=null;dinProposalOpen=false;render();toast('La vista previa ya no coincide con el proyecto. Revísala nuevamente.');return;}
   if(!proposal.ok||!window.PanelDINReflow.apply(clone(alt()),proposal)){
    dinProposalOpen=false;dinPreviewPlan=null;render();toast('La propuesta no es válida. Revísala nuevamente.');return;
   }
   saveAction(()=>window.PanelDINReflow.apply(alt(),proposal),{electrical:false});
   dinProposalOpen=false;
   toast('Redistribución confirmada. Pendiente de validar el montaje y la geometría real.');
  }
  return;
 }
 const act=e.target.closest('[data-action]');if(act){if(act.dataset.action==='commercialMore'){window.PanelCommercialUI.more();}else if(act.dataset.action==='suggestAuxZones'){suggestAuxZones();}else if(act.dataset.action==='addNeutralBar'){addBar('N');}else if(act.dataset.action==='addEarthBar'){addBar('PE');}else if(act.dataset.action==='deleteBusbar'){deleteBar();}else if(act.dataset.action==='createCircuit'){createCircuit();}else if(act.dataset.action==='openCircuit'){selectedCircuit=circuitsFor().find(c=>c.deviceId===selected)?.id||null;render();}else if(act.dataset.action==='inspectCircuitProtection'){selectedCircuit=null;render();}else if(act.dataset.action==='deleteCircuit'){deleteCircuit();}else if(act.dataset.action==='proposePhysical'){doProposal();}else if(act.dataset.action==='toggleCanvasFocus'){canvasFocus=!canvasFocus;if(canvasFocus)view='unifilar';inspectorDrawer=false;render();}
 else if(act.dataset.action==='toggleInspector'){if(!canvasFocus){canvasFocus=true;view='unifilar';}inspectorDrawer=!inspectorDrawer;render();}
 else if(act.dataset.action==='physicalBasic'||act.dataset.action==='physicalAdvanced'){physicalDetail=act.dataset.action==='physicalAdvanced'?'advanced':'basic';try{localStorage.setItem('PanelBuilder_v11_physicalDetail',physicalDetail);}catch(err){}render();}else if(act.dataset.action==='toggleSymbols'){diagramStyle=diagramStyle==='technical'?'blocks':'technical';try{localStorage.setItem('PanelBuilder_v11_diagramStyle_v3',diagramStyle);}catch(err){}render();}else if(act.dataset.action==='zoomIn')zoomCanvas(1.25);else if(act.dataset.action==='zoomOut')zoomCanvas(.8);else if(act.dataset.action==='fitDiagram')fitCanvas();else if(act.dataset.action==='focusSelected')focusSelected();else if(act.dataset.action==='centerRoot')centerRoot();else if(act.dataset.action==='delete')removeDevice();else if(act.dataset.action==='move')moveSelected();else if(act.dataset.action==='toggleDinLock'){const d=dev();if(!d)return;const trial=clone(alt());if(!window.PanelDINReflow.toggleLock(trial,d.id)){toast('No se puede fijar esta posición: falta ubicar el aparato o choca con otro fijado.');return;}saveAction(()=>window.PanelDINReflow.toggleLock(alt(),d.id),{electrical:false});toast(window.PanelDINReflow.pinned(alt(),d.id)?'Posición DIN fijada.':'Posición DIN desbloqueada.');}else if(act.dataset.action==='exportSchematic')exportSchematic();else if(act.dataset.action==='exportMaterialsCSV')exportMaterialsCSV();else if(act.dataset.action==='insertUpstream'){const d=dev();if(d)openInsert(d.id,d.parent||null);}else if(act.dataset.action==='insertBranch'){const d=dev();if(d)openInsert(null,d.id,'branch');}else if(act.dataset.action==='expandSchematic'){view='unifilar';render();}return;}
});
document.addEventListener('input',e=>{if(e.target.matches('[data-commercial-search]'))window.PanelCommercialUI.update(e);});
document.addEventListener('change',e=>{if(window.PanelCommercialUI.update(e))return;
 if(e.target.dataset.mountDevice&&e.target.dataset.mountField){
  const id=e.target.dataset.mountDevice,field=e.target.dataset.mountField,value=e.target.value;
  const trial=clone(alt());
  if(!window.PanelMountClearance.setDevice(trial,id,field,value)){toast('Medida de montaje incorrecta (0 a 10000 mm).');render();return;}
  if((alt().dinMountProjectionMm?.[id]?.[field]??null)===(trial.dinMountProjectionMm?.[id]?.[field]??null))return;
  saveAction(()=>window.PanelMountClearance.setDevice(alt(),id,field,value),{electrical:false});
  document.querySelector('[data-mount-device-form="'+id+'"]')?.setAttribute('open','');
  toast('Medida anotada por usuario. Sin certificación de montaje.');return;
 }
 if(e.target.dataset.mountRail!==undefined){
  const row=Number(e.target.dataset.mountRail),value=e.target.value,trial=clone(alt());
  if(!window.PanelMountClearance.setDoor(trial,row,value)){toast('Distancia carril-puerta incorrecta (0 a 10000 mm).');render();return;}
  if((alt().dinRailDoorMm?.[row]??null)===(trial.dinRailDoorMm?.[row]??null))return;
  saveAction(()=>window.PanelMountClearance.setDoor(alt(),row,value),{electrical:false});
  toast('Distancia carril-puerta declarada. Comprueba medidas de cada aparato.');return;
 }
 if(e.target.dataset.dinLeftClearance){const id=e.target.dataset.dinLeftClearance,value=e.target.value;const trial=clone(alt());if(!window.PanelDINReflow.setLeftClearance(trial,id,value)){toast('Reserva DIN izquierda inválida: máximo 300 mm.');render();return;}if((alt().dinLeftClearancesMm?.[id]??0)===(trial.dinLeftClearancesMm?.[id]??0))return;saveAction(()=>window.PanelDINReflow.setLeftClearance(alt(),id,value),{electrical:false});toast('Reserva izquierda declarada. Revisa colisiones y distribución DIN.');return;}
 if(e.target.dataset.dinClearance){const id=e.target.dataset.dinClearance,value=e.target.value;const trial=clone(alt());if(!window.PanelDINReflow.setClearance(trial,id,value)){toast('Reserva DIN inválida: máximo 300 mm.');render();return;}saveAction(()=>window.PanelDINReflow.setClearance(alt(),id,value),{electrical:false});toast('Reserva lateral registrada. Revisa la distribución física.');return;}if(e.target.dataset.constructionField){const key=e.target.dataset.constructionField,value=e.target.value;const copied=clone(alt());if(!window.PanelConstruction.set(copied,key,value)){toast("Dimensión de componente no válida.");return;}setTimeout(()=>saveAction(()=>window.PanelConstruction.set(alt(),key,value),{electrical:false}),0);return;}if(e.target.dataset.geomField){const field=e.target.dataset.geomField,value=e.target.value;if(!window.PanelEnclosureGeometry.set({...alt()},field,value)){toast('Medida no válida (0 a 10000 mm).');render();return;}setTimeout(()=>saveAction(()=>window.PanelEnclosureGeometry.set(alt(),field,value),{electrical:false}),0);return;}if(e.target.dataset.auxGroup){setAuxZone(e.target.dataset.auxGroup,e.target.dataset.auxId,e.target.value);return;}if(e.target.dataset.busbarEdit){editBar(e.target.dataset.busbarEdit,e.target.value);return;}if(e.target.dataset.spdPe){setSpdPeBar(e.target.value);return;}if(e.target.dataset.circuitEdit){updateCircuit(e.target.dataset.circuitEdit,e.target.value);return;}if(e.target.id!=='jumpDevice')return;selected=e.target.value;selectedCircuit=null;render();requestAnimationFrame(focusSelected);});
$('inspector').addEventListener('change',e=>{const name=e.target.dataset.edit;if(!name)return;if(name==='moveRow'||name==='movePos')return;
 if(name==='parent'&&e.target.value&&descendants(selected).has(e.target.value)){toast('No se puede crear una conexión circular.');render();return;}updateProperty(name,e.target.value);});
$('closeInsert').addEventListener('click',closeInsert);
$('insertModal').addEventListener('click',e=>{if(e.target===$('insertModal'))closeInsert();const ch=e.target.closest('[data-insert-kind]');if(ch)performInsert(ch.dataset.insertKind);});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-insert-branch]')){e.preventDefault();openInsert(null,e.target.dataset.insertBranch,'branch');}else if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-insert-child]')){e.preventDefault();openInsert(e.target.dataset.insertChild,e.target.dataset.insertParent||null);}else if((e.key==='Enter'||e.key===' ')&&e.target.matches('.circuit-terminal')){e.preventDefault();selectedCircuit=e.target.dataset.circuitId;selected=currentCircuit()?.deviceId||selected;render();}else if((e.key==='Enter'||e.key===' ')&&e.target.matches('.diagram-node')){e.preventDefault();selected=e.target.dataset.device;selectedCircuit=null;selectedBar=null;render();}});
$('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='PanelBuilder_'+state.active+'_v11.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);});
$('importBtn').addEventListener('click',()=>$('fileInput').click());
$('fileInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const txt=await file.text();if(txt.length>2_000_000)throw Error('Archivo demasiado grande.');const p=JSON.parse(txt);if(!validProject(p))throw Error('Proyecto no reconocido o incompatible con v0.11.');saveAction(()=>{state=p;state.version=11;Object.values(state.alternatives).forEach(a=>{a.circuits=Array.isArray(a.circuits)?a.circuits:[];a.busbars=Array.isArray(a.busbars)?a.busbars:[];a.auxiliaryZones=a.auxiliaryZones||{bars:{},circuits:{}};a.assignments=([6,8,9,10,11].includes(p.version)?a.assignments||{}:{});a.devices=a.devices.map(d=>{const rec=state.brand==='Generico'?null:(window.PanelCommercialPlacement.resolve(d,a,state.brand)||M.normalized(d,state.brand,a.assignments?.[d.id]));return {...d,modules:rec?rec.modules:E.estimateModules(d),moduleSource:rec?'catalog':'estimate',matchedRef:rec?.ref||null};});a.layoutDirty=true;});selected=alt().devices[0]?.id||null;selectedCircuit=null;selectedBar=null;camera.initialized=false;},{electrical:false});toast('Proyecto importado y anchuras revisadas. Recalcula la distribución.');}catch(err){toast(err.message);}e.target.value='';});
let physicalDragId=null;
document.addEventListener('dragstart',e=>{const btn=e.target.closest('[data-physical-device]');if(!btn)return;physicalDragId=btn.dataset.physicalDevice;if(window.PanelDINReflow.pinned(alt(),physicalDragId)){physicalDragId=null;e.preventDefault();toast('Desbloquea esta posición antes de arrastrar el aparato.');return;}try{e.dataTransfer.setData('text/plain',physicalDragId);e.dataTransfer.effectAllowed='move';}catch(err){};selected=physicalDragId;});
document.addEventListener('dragover',e=>{if(!physicalDragId)return;const t=e.target.closest('[data-slot],[data-physical-device]');if(!t)return;e.preventDefault();});
document.addEventListener('drop',e=>{if(!physicalDragId)return;const t=e.target.closest('[data-slot],[data-physical-device]');if(!t)return;e.preventDefault();let row,pos;if(t.dataset.slot){[row,pos]=t.dataset.slot.split(':').map(Number);}else if(t.dataset.physicalDevice){const td=alt().devices.find(x=>x.id===t.dataset.physicalDevice);if(!td)return;row=td.row;pos=td.pos;}
 if(window.PanelDINReflow.pinned(alt(),physicalDragId)){physicalDragId=null;toast('Posición DIN fijada.');return;}const fit=findNearestPlacement(physicalDragId,row,pos);if(!fit){toast('No se ha encontrado hueco cercano en la envolvente actual.');physicalDragId=null;return;}saveAction(()=>{const d=alt().devices.find(x=>x.id===physicalDragId);d.row=fit.row;d.pos=fit.pos;selected=physicalDragId;},{electrical:false});toast(`Protección recolocada en carril ${fit.row+1}, módulo ${fit.pos+1}.`);physicalDragId=null;});
document.addEventListener('dragend',()=>{physicalDragId=null;});
function openWizard(){const w=$('wizard');w.classList.add('open');w.setAttribute('aria-hidden','false');}
function closeWizard(){const w=$('wizard');w.classList.remove('open');w.setAttribute('aria-hidden','true');try{localStorage.setItem('PanelBuilder_wizardSeen_v05','1')}catch(e){}}
$('startGuide').addEventListener('click',openWizard);$('closeWizard').addEventListener('click',closeWizard);$('skipWizard').addEventListener('click',closeWizard);
document.querySelectorAll('[data-wizard]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.wizard==='demo'){saveAction(()=>{state=demo();selected='d2';camera.initialized=false;});view='unifilar';}
 if(b.dataset.wizard==='large'){saveAction(()=>{state=demoLarge();selected='d1';camera.initialized=false;});view='unifilar';}
 if(b.dataset.wizard==='blank'){saveAction(()=>{state=demo();alt().devices=[];selected=null;camera.initialized=false;},{electrical:false});view='unifilar';}closeWizard();render();}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeWizard();closeInsert();if(inspectorDrawer){inspectorDrawer=false;render();}}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();$('undoBtn').click();}});
syncWidths();render();try{if(!localStorage.getItem('PanelBuilder_wizardSeen_v05')&&!localStorage.getItem('PanelBuilder_wizardSeen_v04')&&!localStorage.getItem('PanelBuilder_wizardSeen_v03'))openWizard();}catch(e){}
})();