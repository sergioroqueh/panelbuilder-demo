/* PanelBuilder · barras N/PE lógicas y enlaces explícitos, sin cálculo eléctrico. */
(function(root){
'use strict';
const all=a=>Array.isArray(a?.busbars)?a.busbars:[];
function ancestorRcd(devices,deviceId){
 const byId=new Map(devices.map(d=>[d.id,d])),visited=new Set();let d=byId.get(deviceId);
 while(d&&!visited.has(d.id)){visited.add(d.id);if(d.kind==='RCD')return d.id;d=byId.get(d.parent);}
 return null;
}
function validAll(bars,devices){
 if(bars===undefined)return true;
 if(!Array.isArray(bars)||bars.length>200)return false;
 const ids=new Set(),labels=new Set();
 return bars.every(b=>{
  if(!b||typeof b.id!=='string'||!/^b[0-9]+$/.test(b.id)||ids.has(b.id)||
     !['N','PE'].includes(b.kind)||typeof b.label!=='string'||b.label.length>30||
     !b.label.trim()||labels.has(b.label.trim().toUpperCase()))return false;
  if(b.kind==='N'&&b.rcdId&& !devices.some(d=>d.id===b.rcdId&&d.kind==='RCD'))return false;
  if(b.kind==='PE'&&b.rcdId)return false;
  ids.add(b.id);labels.add(b.label.trim().toUpperCase());return true;
 });
}
function create(a,kind,rcdId=''){
 if(!['N','PE'].includes(kind))return null;
 if(kind==='N'&&rcdId&&!a.devices.some(d=>d.id===rcdId&&d.kind==='RCD'))return null;
 const used=new Set(all(a).map(b=>b.label));
 let n=1;while(used.has(kind+n))n++;
 const ids=new Set(all(a).map(b=>b.id));let idNum=1;while(ids.has('b'+idNum))idNum++;
 return {id:'b'+idNum,kind,label:kind+n,rcdId:kind==='N'?rcdId:'',notes:''};
}
function get(a,id,kind=''){
 const b=all(a).find(x=>x.id===id)||null;
 return b&&(!kind||b.kind===kind)?b:null;
}
function options(a,kind,selected=''){
 const ret=[['','Sin conectar / pendiente']];
 const choices=all(a).filter(b=>b.kind===kind).map(b=>[b.id,b.label+(b.rcdId?' (grupo '+(a.devices.find(d=>d.id===b.rcdId)?.label||b.rcdId)+')':'')]);
 ret.push(...choices);
 if(selected&&!ret.some(x=>x[0]===selected))ret.push([selected,'Referencia no encontrada (revisar)']);
 return ret;
}
function check(a){
 const warnings=[],bars=all(a);
 for(const b of bars){
  const linked=a.circuits?.filter(c=>c.neutralBusbarId===b.id||c.peBusbarId===b.id)||[];
  const spds=a.devices.filter(d=>d.kind==='SPD'&&d.spdPeBusbarId===b.id);
  if(!linked.length&&!spds.length)warnings.push('Barra '+b.label+': sin conexiones lógicas asignadas.');
  if(b.kind==='N'&&!b.rcdId)warnings.push('Barra '+b.label+': falta asociarla a un grupo diferencial.');
 }
 for(const c of (a.circuits||[])){
  if(c.configuration?.includes('N')){
   const bar=get(a,c.neutralBusbarId,'N');
   if(!bar)warnings.push('Salida '+c.code+': sin barra N vinculada.');
   else if(bar.rcdId&&bar.rcdId!==ancestorRcd(a.devices,c.deviceId))
     warnings.push('Salida '+c.code+': barra '+bar.label+' vinculada a otro diferencial.');
  }
  if(c.configuration?.includes('PE')&&!get(a,c.peBusbarId,'PE'))
   warnings.push('Salida '+c.code+': sin barra PE vinculada.');
 }
 for(const d of a.devices.filter(x=>x.kind==='SPD')){
  if(!get(a,d.spdPeBusbarId,'PE'))warnings.push('SPD '+d.label+': falta vincular el terminal PE a una barra de protección.');
  if(!d.parent)warnings.push('SPD '+d.label+': falta origen de derivación.');
 }
 return warnings;
}
function detail(b,a,escape){
 const optionsRcd=[['','Sin determinar'],...a.devices.filter(d=>d.kind==='RCD').map(d=>[d.id,d.label+' · '+d.name])];
 const select=optionsRcd.map(([id,text])=>`<option value="${escape(id)}" ${(b.rcdId||'')===id?'selected':''}>${escape(text)}</option>`).join('');
 return `<div class="section-heading">BARRA DE CONEXIÓN DOCUMENTADA</div>
 <h2>${b.kind==='N'?'Neutro':'Protección PE'} · ${escape(b.label)}</h2>
 <p>Enlaces lógicos explícitos de conductores, no esquema de borneros físicos ni continuidad comprobada.</p>
 <div class="form-field"><label for="busbar_label">Identificación</label><input id="busbar_label" data-busbar-edit="label" maxlength="30" value="${escape(b.label)}"/></div>
 ${b.kind==='N'?`<div class="form-field"><label for="busbar_rcd">Diferencial origen del grupo N</label><select id="busbar_rcd" data-busbar-edit="rcdId">${select}</select></div>`:''}
 <div class="form-field"><label for="busbar_notes">Observaciones</label><input id="busbar_notes" data-busbar-edit="notes" maxlength="250" value="${escape(b.notes||'')}"/></div>
 <div class="inspector-divider"></div>
 <button class="button danger full" data-action="deleteBusbar">Eliminar barra y desvincular salidas</button>
 <p class="tiny-hint">La referencia del grupo N se comprueba frente al diferencial aguas arriba. No asignamos barras automáticamente.</p>`;
}
function schedule(a,escape){
 const bars=all(a);
 if(!bars.length)return '<div class="busbar-note">Sin barras de neutro o PE registradas. Añádelas y vincula circuitos desde sus propiedades.</div>';
 return '<div class="busbar-items">'+bars.map(b=>{
  const links=(a.circuits||[]).filter(c=>c.neutralBusbarId===b.id||c.peBusbarId===b.id).length+
   a.devices.filter(d=>d.kind==='SPD'&&d.spdPeBusbarId===b.id).length;
  return `<button type="button" class="busbar-item ${b.kind==='N'?'neutral':'earth'}" data-busbar-id="${escape(b.id)}" title="Editar barra ${escape(b.label)}">
   <b>${escape(b.label)}</b><span>${b.kind==='N'?'N · '+escape(a.devices.find(d=>d.id===b.rcdId)?.label||'Grupo pendiente'):'PE común'}</span><small>${links} enlace(s)</small></button>`;
 }).join('')+'</div>';
}
function draw(a,locations,escape){
 let links='',endpoints='';
 const bars=all(a),cs=a.circuits||[];
 // Recuadros/etiquetas y líneas de TRAZABILIDAD lógica; línea punteada ≠ conductor cableado.
 for(const c of cs){
  const pt=locations.get(c.deviceId);
  if(!pt||a.devices.some(d=>d.parent===c.deviceId))continue;
  const y=pt.y+155;
  const wires=[['N',c.neutralBusbarId, 'N','#366cbe'],['PE',c.peBusbarId,'PE','#3b8761']];
  for(const [role,id,kind,color] of wires){
   if(!c.configuration?.includes(role))continue;
   const b=get(a,id,kind);if(!b)continue;
   const xx=pt.x+(role==='N'?-37:37);
   links+=`<g class="busbar-link" data-link-role="${role}" data-link-bar="${escape(b.id)}"><path d="M ${xx} ${pt.y+140} V ${y}" stroke="${color}" fill="none" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text x="${xx}" y="${y+9}" text-anchor="middle" font-family="Arial" font-size="8" fill="${color}">${escape(b.label)}</text>
    <title>Referencia lógica ${role} → ${escape(b.label)}. Trazado real pendiente.</title></g>`;
  }
 }
 for(const d of a.devices.filter(d=>d.kind==='SPD')){
  const pt=locations.get(d.id);if(!pt)continue;
  const b=get(a,d.spdPeBusbarId,'PE');
  endpoints+=`<g class="spd-pe-outlet" data-spd-id="${escape(d.id)}">
    <path d="M ${pt.x} ${pt.y+32} V ${pt.y+59}" stroke="#448363" stroke-width="1.6" fill="none" ${b?'':'stroke-dasharray="3 3"'}/>
    <path d="M ${pt.x-10} ${pt.y+59} H ${pt.x+10} M ${pt.x-7} ${pt.y+63} H ${pt.x+7} M ${pt.x-3} ${pt.y+67} H ${pt.x+3}" stroke="#448363" stroke-width="1.6" fill="none"/>
    <text x="${pt.x+15}" y="${pt.y+65}" font-family="Arial" font-size="9" fill="#2f7653">${escape(b?b.label:'PE pendiente')}</text>
    <title>Derivación SPD; terminal PE ${escape(b?b.label:'sin asignar')}. Coordinación y cableado por comprobar.</title>
  </g>`;
 }
 return {links,endpoints};
}
root.PanelBusbars=Object.freeze({all,validAll,create,get,options,ancestorRcd,check,detail,schedule,draw});
})(window);