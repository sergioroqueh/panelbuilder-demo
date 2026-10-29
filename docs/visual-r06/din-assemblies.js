/* PanelBuilder v0.11 · conjuntos constructivos opcionales.
 * Distancia horizontal ilustrativa: 18 mm/M. SIN validacion de acoplamiento,
 * peines, borne, instalacion, termica ni cumplimiento normativo.
 */
(function(root){'use strict';
const LIMIT_CHAIN=8,LIMIT_SPANS=100,DIN=18;
const get=(brand,ref)=>root.PanelPhysicalAccessories?.byKey(brand,ref);
const idFor=(a,id,brand)=>root.PanelPhysicalAccessories.identity(a,(a.devices||[]).find(d=>d.id===id),brand);
const metric=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=300;
const plain=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
function storage(a){return a.dinAccessoryAssemblies||(a.dinAccessoryAssemblies={chains:{},combs:[]});}
function valid(a){
 const s=a?.dinAccessoryAssemblies;if(s===undefined)return true;
 if(!plain(s)||Object.keys(s).some(k=>!['chains','combs'].includes(k)))return false;
 const chains=s.chains||{},combs=s.combs||[];
 const ids=new Set((a.devices||[]).map(d=>d.id));
 if(!plain(chains)||Object.keys(chains).length>350||!Array.isArray(combs)||combs.length>LIMIT_SPANS)return false;
 if(!Object.entries(chains).every(([id,entries])=>ids.has(id)&&Array.isArray(entries)&&entries.length>0&&entries.length<=LIMIT_CHAIN
  &&entries.every(e=>plain(e)&&Object.keys(e).every(k=>['brand','ref','side','observedMm','hostIdentity'].includes(k))
    &&get(e.brand,e.ref)?.kind==='auxiliar'&&['left','right'].includes(e.side)
    &&!(false /* registros históricos con posición equivocada siguen importables, pero quedan pendientes */)
    &&(e.observedMm===undefined||metric(e.observedMm))
    &&typeof e.hostIdentity==='string'&&e.hostIdentity.length<=600)))return false;
 const spans=new Set();
 return combs.every(c=>{
  if(!plain(c)||Object.keys(c).some(k=>!['id','brand','ref','deviceIds','hostIdentities'].includes(k))
   ||typeof c.id!=='string'||!/^comb-[1-9]\d{0,5}$/.test(c.id)||spans.has(c.id)
   ||get(c.brand,c.ref)?.kind!=='peine'||!Array.isArray(c.deviceIds)
   ||c.deviceIds.length<2||c.deviceIds.length>48||new Set(c.deviceIds).size!==c.deviceIds.length
   ||!c.deviceIds.every(id=>ids.has(id))||!plain(c.hostIdentities)
   ||Object.keys(c.hostIdentities).length!==c.deviceIds.length
   ||!Object.keys(c.hostIdentities).every(id=>c.deviceIds.includes(id))
   ||!Object.values(c.hostIdentities).every(v=>typeof v==='string'&&v.length<=600))return false;
  spans.add(c.id);return true;
 });
}
function addAux(a,id,brand,ref,side,raw,activeBrand){
 if(!(a.devices||[]).some(d=>d.id===id)||get(brand,ref)?.kind!=='auxiliar'||!['left','right'].includes(side)
   ||(get(brand,ref).side==='left'||get(brand,ref).documentedSide==='left')&&side!=='left')return false;
 const s=storage(a),prior=s.chains?.[id]||[];
 if(prior.length>=LIMIT_CHAIN)return false;
 const member={brand,ref,side,hostIdentity:idFor(a,id,activeBrand)};
 if(String(raw).trim()!==''){const v=Number(raw);if(!metric(v))return false;member.observedMm=v;}
 s.chains={...(s.chains||{}),[id]:[...prior,member]};return true;
}
function removeAux(a,id,index){
 const list=a.dinAccessoryAssemblies?.chains?.[id];
 if(!Array.isArray(list)||!Number.isInteger(index)||index<0||index>=list.length)return false;
 const next=list.filter((_,i)=>i!==index);
 if(next.length)a.dinAccessoryAssemblies.chains[id]=next;
 else delete a.dinAccessoryAssemblies.chains[id];
 return true;
}
function addComb(a,brand,ref,deviceIds,activeBrand){
 if(get(brand,ref)?.kind!=='peine'||!Array.isArray(deviceIds)||deviceIds.length<2||deviceIds.length>48
  ||new Set(deviceIds).size!==deviceIds.length||!deviceIds.every(id=>(a.devices||[]).some(d=>d.id===id)))return false;
 const s=storage(a);s.combs=s.combs||[];
 if(s.combs.length>=LIMIT_SPANS)return false;
 let n=1;while(s.combs.some(x=>x.id==='comb-'+n))n++;
 s.combs.push({id:'comb-'+n,brand,ref,deviceIds:[...deviceIds],
   hostIdentities:Object.fromEntries(deviceIds.map(id=>[id,idFor(a,id,activeBrand)]))});
 return true;
}
function removeComb(a,id){const s=a.dinAccessoryAssemblies;if(!s?.combs?.some(c=>c.id===id))return false;s.combs=s.combs.filter(c=>c.id!==id);return true;}
function removeDevice(a,id){
 const s=a.dinAccessoryAssemblies;if(!s)return;
 if(s.chains)delete s.chains[id];
 if(s.combs)s.combs=s.combs.map(c=>({...c,deviceIds:c.deviceIds.filter(x=>x!==id),
   hostIdentities:Object.fromEntries(Object.entries(c.hostIdentities).filter(([key])=>key!==id))}))
   .filter(c=>c.deviceIds.length>=2);
}
function report(a,activeBrand){
 const issues=[],pending=[],reserves=[],s=a.dinAccessoryAssemblies||{};
 const intervals=[],ds=a.devices||[],map=new Map(ds.map(d=>[d.id,d]));
 let chainCount=0,spanCount=0;
 for(const [id,list] of Object.entries(s.chains||{})){
  const d=map.get(id);if(!d)continue;
  chainCount+=list.length;
  const sides={left:[],right:[]};
  for(const m of list)sides[m.side].push(m);
  for(const side of ['left','right']){
   let width=0,complete=true;
   for(let i=0;i<sides[side].length;i++){
    const m=sides[side][i],item=get(m.brand,m.ref),label=d.label+' · '+m.ref+' #'+(i+1);
    const stale=m.hostIdentity!==idFor(a,id,activeBrand);
    if(stale||m.brand!==activeBrand){pending.push(label+': marca o datos del anfitrión cambiados; revisar el conjunto.');complete=false;continue;}
    if(!a.apparatusCandidates?.[id]||a.apparatusCandidates[id].fabricante!==m.brand)
      pending.push(label+': no hay candidata documental del anfitrión para esta marca.');
    pending.push(label+': comprobar por SKU, orden de acoplamiento, límites de auxiliares y seguridad.');
    if(item.documentedSide&&m.side!==item.documentedSide){
      pending.push(label+': lado distinto del catálogo histórico Hager; corregir antes de reservar.');
      complete=false;
    }
    if(item.side==='unknown'&&!item.documentedSide)pending.push(label+': lado de montaje no confirmado por ficha individual.');
    if(m.observedMm!==undefined&&item.widthMm!==null&&m.observedMm<item.widthMm)
      pending.push(label+': medición inferior a ficha; se usa el mínimo de '+item.widthMm+' mm.');
    const w=item.widthMm===null?m.observedMm:(m.observedMm===undefined?item.widthMm:Math.max(item.widthMm,m.observedMm));
    if(w===undefined||w===null){pending.push(label+': anchura montada desconocida.');complete=false;}
    if(complete)width+=w;
   }
   if(!sides[side].length)continue;
   if(a.physicalAccessoryPlans?.[id]&&a.physicalAccessoryPlans[id].ref){pending.push(d.label+': existen anotaciones antiguas y nuevas simultáneas: posible doble conteo; no proponer reserva hasta resolver ambas.');complete=false;}
   if(!complete){pending.push(d.label+': cadena '+side+' no contrastable, no reservar automáticamente.');continue;}
   if(!Number.isInteger(d.row)||!Number.isInteger(d.pos)||!Number.isInteger(a.slots)){
    pending.push(d.label+': falta ubicación para contrastar la cadena '+side+'.');continue;
   }
   const lo=side==='left'?d.pos*DIN-width:(d.pos+Number(d.modules))*DIN;
   const hi=lo+width;
   intervals.push({id,side,row:d.row,lo,hi,label:d.label+' auxiliares '+side});
   if(lo<0||hi>a.slots*DIN)issues.push(d.label+': conjunto '+side+' rebasa carril DIN nominal.');
   if(side==='right'){
    const current=a.dinClearancesMm?.[id]??0;
    if(width>current)reserves.push({id,label:d.label,side:'right',mm:Math.min(width,300),neededMm:width,existingMm:current,complete:true});
    }else {
    const current=a.dinLeftClearancesMm?.[id]??0;
    if(width>current)reserves.push({id,label:d.label,side:'left',mm:Math.min(width,300),neededMm:width,existingMm:current,complete:true});
   }
  }
  if(a.physicalAccessoryPlans?.[id])pending.push(d.label+': también existe anotación antigua; revisar doble conteo.');
 }
 for(const x of intervals){
  for(const d of ds){
   if(d.id===x.id||d.row!==x.row||!Number.isInteger(d.pos))continue;
   const l=d.pos*DIN,r=(d.pos+Number(d.modules))*DIN;
   if(x.lo<r&&x.hi>l)issues.push(x.label+' interfiere con '+d.label+' (rejilla provisional).');
  }
 }
 for(let i=0;i<intervals.length;i++)for(let j=i+1;j<intervals.length;j++){
  const x=intervals[i],y=intervals[j];if(x.row===y.row&&x.lo<y.hi&&y.lo<x.hi)
   issues.push(x.label+' se solapa con '+y.label+' (cadenas distintas).');
 }
 for(const c of s.combs||[]){
  spanCount++;const label=c.brand+' '+c.ref+' · '+c.id;
  const devices=c.deviceIds.map(id=>map.get(id)),rows=new Set(devices.map(d=>d.row));
  if(rows.size>1||rows.has(null))issues.push(label+': tramo en varios carriles o equipos sin ubicar; no conectar.');
  if(activeBrand!==c.brand||c.deviceIds.some(id=>c.hostIdentities[id]!==idFor(a,id,activeBrand)))
   pending.push(label+': fabricante, candidata o datos originales cambiaron; tramo CADUCADO.');
  const placed=devices.every(d=>Number.isInteger(d.row)&&Number.isInteger(d.pos));
  if(placed&&rows.size===1){
   const sorted=[...devices].sort((x,y)=>x.pos-y.pos);
   if(sorted.some((d,i)=>i>0&&sorted[i-1].pos+Number(sorted[i-1].modules)!==d.pos))
    pending.push(label+': hay huecos, solapes o aparatos no seleccionados entre extremos.');
   const mm=(Math.max(...sorted.map(d=>(d.pos+Number(d.modules))*DIN))-Math.min(...sorted.map(d=>d.pos*DIN)));
   const item=get(c.brand,c.ref);
   pending.push(label+': intervalo geométrico orientativo '+mm+' mm; longitud exterior de peine '+(item.lengthMm??'desconocida')+' mm. NO acredita conexión ni alineación.');
   if(item.lengthMm!==undefined&&mm>item.lengthMm)
    pending.push(label+': intervalo DIN aproximado '+mm+' mm mayor que longitud física '+item.lengthMm+' mm; revisar paso, extremos, ubicación y dientes, sin concluir aptitud.');
   if(c.ref==='KDN163A')pending.push(label+': NO atribuir tapas Hager KZN023/KZN024, previstas expresamente para KDN263B/KDN363B/KDN463B, no KDN163A.');
   if(c.ref==='KDN163A'&&c.deviceIds.some(id=>(s.chains?.[id]||[]).length>0||!!a.physicalAccessoryPlans?.[id]))
    issues.push(label+': ficha Hager advierte que KDN163A no es apto para dispositivo con auxiliar; revisar combinación.');
  }
  if(devices.some(d=>!a.apparatusCandidates?.[d.id]||a.apparatusCandidates[d.id].fabricante!==c.brand))
   pending.push(label+': faltan candidatas individuales de los aparatos del tramo.');
  pending.push(label+': verificar peine físico, número/paso de dientes, fases, polos, sección, terminales, corriente, tapas, corte y alimentación. No es conexión eléctrica ni BOM.');
 }
 return {issues,pending,reserves,chains:chainCount,combs:spanCount,intervals};
}
function render(a,brand,esc){
 const s=a.dinAccessoryAssemblies||{},r=report(a,brand);
 const aux=root.PanelPhysicalAccessories.items.filter(i=>i.kind==='auxiliar');
 const comb=root.PanelPhysicalAccessories.items.filter(i=>i.kind==='peine');
 const sel=options=>options.map(i=>'<option value="'+esc(i.brand+'|'+i.ref)+'">'+esc(i.brand+' '+i.ref+' · '+i.name)+'</option>').join('');
 const devOptions=(a.devices||[]).map(d=>'<option value="'+esc(d.id)+'">'+esc(d.label)+'</option>').join('');
 const rows=(a.devices||[]).map(d=>{
  const entries=s.chains?.[d.id]||[];
  return '<div class="notice-box" data-assembly-host="'+esc(d.id)+'"><strong>'+esc(d.label)+' · auxiliares en secuencia desde el aparato hacia fuera</strong>'
  +entries.map((m,i)=>'<p class="small-text">'+(i+1)+'. '+esc(m.brand+' '+m.ref+' · '+m.side)
    +(m.observedMm===undefined?' · sin medición de montaje':' · medición '+m.observedMm+' mm')
    +' <button type="button" class="button small" data-assembly-remove="'+esc(d.id)+'" data-assembly-index="'+i+'">Retirar</button></p>').join('')
  +'<label class="form-field">Añadir auxiliar <select data-assembly-aux="'+esc(d.id)+'">'+sel(aux)+'</select></label>'
  +'<label class="form-field">Lado <select data-assembly-side="'+esc(d.id)+'"><option value="left">Izquierda</option><option value="right">Derecha</option></select></label>'
  +'<label class="form-field">Anchura montada medida (mm; opcional) <input type="number" min="0" max="300" step="0.1" data-assembly-width="'+esc(d.id)+'" placeholder="Sin medir"></label>'
  +'<button type="button" class="button small" data-assembly-add="'+esc(d.id)+'">Añadir en último lugar de ese lado</button></div>';
 }).join('');
 const crows=(s.combs||[]).map(c=>'<p class="small-text">'+esc(c.brand+' '+c.ref+' · '+c.id+' → '+c.deviceIds.map(id=>(a.devices||[]).find(d=>d.id===id)?.label||id).join(', '))
  +' <button class="button small" type="button" data-comb-remove="'+esc(c.id)+'">Retirar tramo</button></p>').join('');
 return '<details class="aux-physical-panel" data-assemblies-panel><summary><strong>Conjuntos DIN experimentales · '+r.chains+' auxiliares · '+r.combs+' peines · '+r.issues.length+' conflictos</strong></summary>'
  +'<p class="tiny-hint">Anota auxiliares en el orden desde el aparato hacia fuera y un tramo de peine marcando EXPLÍCITAMENTE sus dispositivos. No hay asociación comercial aprobada ni conexiones eléctricas reales. Los anchos sin ficha permanecen pendientes; montaje lateral y combinaciones sujetos a ficha individual.</p>'+rows
  +'<div class="notice-box" data-comb-editor><strong>Tramo de peine preliminar</strong><label class="form-field">Peine <select data-comb-ref>'+sel(comb)+'</select></label>'
  +'<div class="small-text">'+(a.devices||[]).map(d=>'<label style="display:inline-flex;align-items:center;margin:6px"><input type="checkbox" data-comb-member="'+esc(d.id)+'"> '+esc(d.label)+'</label>').join('')+'</div>'
  +'<button type="button" class="button small" data-comb-add>Registrar tramo de al menos dos equipos</button>'+crows+'</div>'
  +r.reserves.filter(x=>x.neededMm<=300).map(x=>'<p class="small-text">Reserva '+(x.side==='left'?'izquierda':'derecha')+' propuesta: '+esc(x.label)+' · '+x.neededMm.toFixed(1)+' mm (actual '+x.existingMm+' mm). <button type="button" class="button small" data-assembly-reserve="'+esc(x.id)+'" data-assembly-reserve-side="'+x.side+'">Confirmar reserva DIN; no recoloca</button></p>').join('')
  +r.issues.map(x=>'<p class="notice-line warn">⚠ '+esc(x)+'</p>').join('')
  +r.pending.map(x=>'<p class="tiny-hint">Pendiente: '+esc(x)+'</p>').join('')
  +'<p class="tiny-hint">Una reserva confirmada a izquierda o derecha se guarda en la cota lateral correspondiente; puede generar solapamientos y requerir redistribución DIN asistida aparte. Propuesta no certificada.</p></details>';
}
function materials(a,esc){
 const s=a.dinAccessoryAssemblies||{},chains=Object.values(s.chains||{}).flat(),combs=s.combs||[];
 if(!chains.length&&!combs.length)return '';
 return '<section class="terminal-bom"><strong>Conjuntos constructivos anotados (sin validar)</strong><p class="small-text">'
  +chains.length+' auxiliares; '+combs.length+' tramos de peine. Sin PVP, sin compra automática y sin inclusión en CSV comercial.</p>'
  +chains.map(x=>'<p class="tiny-hint">'+esc(x.brand+' '+x.ref+' · '+x.side)+'</p>').join('')
  +combs.map(x=>'<p class="tiny-hint">Peine '+esc(x.brand+' '+x.ref+' · '+x.id)+'</p>').join('')+'</section>';
}
root.PanelDINAssemblies=Object.freeze({valid,addAux,removeAux,addComb,removeComb,removeDevice,report,render,materials});
})(window);
