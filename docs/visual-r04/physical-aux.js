/* PanelBuilder v0.11 · Pre-disposición física de auxiliares.
   NO sustituye dimensiones reales, elementos de fijación, distancias ni térmica.
   Separado expresamente de carriles DIN y de productos comerciales. */
(function(root){
'use strict';
const zones=Object.freeze([
 ['','Sin ubicar'],['upper','Zona superior (orientativa)'],
 ['side','Zona lateral (orientativa)'],['lower','Zona inferior (orientativa)']
]);
const validZone=z=>zones.some(([key])=>key===z);
const maps=a=>a?.auxiliaryZones&&typeof a.auxiliaryZones==='object'?a.auxiliaryZones:{};
function validAll(a){
 if(a.auxiliaryZones===undefined)return true;
 const v=a.auxiliaryZones;
 if(!v||Array.isArray(v)||typeof v!=='object')return false;
 for(const key of ['bars','circuits']){
  if(v[key]===undefined)continue;
  if(!v[key]||Array.isArray(v[key])||typeof v[key]!=='object')return false;
  if(Object.keys(v[key]).length>350)return false;
  if(!Object.entries(v[key]).every(([id,zone])=>typeof id==='string'&&id.length<=40&&typeof zone==='string'&&validZone(zone)))return false;
 }
 return true;
}
function list(a){
 const placements=maps(a);
 const out=[];
 for(const b of root.PanelBusbars.all(a)){
  out.push({id:b.id,group:'bars',label:b.label,type:b.kind,
   description:b.kind==='N'?'Barra de neutro · '+(a.devices.find(d=>d.id===b.rcdId)?.label||'grupo ID sin definir'):'Barra de protección PE',
   zone:placements.bars?.[b.id]||'',quantity:1,unit:'barra (propuesta)',code:b.label});
 }
 for(const c of root.PanelCircuits.all(a)){
  const terminals=root.PanelCircuits.terminalRows(c);
  out.push({id:c.id,group:'circuits',label:c.terminalStrip||'Regleta pendiente',type:'X',
   description:c.code+' · '+(c.destination||'sin destino')+' · '+(terminals.map(t=>t.role).join('+')||'conductores por definir'),
   zone:placements.circuits?.[c.id]||'',quantity:terminals.length,unit:'posiciones de borne (estimadas)',
   code:c.terminalStrip||''});
 }
 return out;
}
function setZone(a,group,id,zone){
 if(!['bars','circuits'].includes(group)||!validZone(zone))return false;
 const valid=(group==='bars'?root.PanelBusbars.all(a):root.PanelCircuits.all(a)).some(o=>o.id===id);
 if(!valid)return false;
 if(!a.auxiliaryZones||typeof a.auxiliaryZones!=='object')a.auxiliaryZones={bars:{},circuits:{}};
 a.auxiliaryZones[group]=a.auxiliaryZones[group]||{};
 if(zone)a.auxiliaryZones[group][id]=zone;else delete a.auxiliaryZones[group][id];
 return true;
}
function suggest(a){
 let changes=0;
 for(const o of list(a)){
  if(o.zone)continue;
  const zone=o.group==='circuits'?'lower':o.type==='PE'?'side':'upper';
  if(setZone(a,o.group,o.id,zone))changes++;
 }
 return changes;
}
function stats(a){
 const all=list(a),barN=all.filter(x=>x.group==='bars'&&x.type==='N').length,
  barPE=all.filter(x=>x.group==='bars'&&x.type==='PE').length,
  strips=all.filter(x=>x.group==='circuits'),
  named=new Set(strips.filter(x=>x.code).map(x=>x.code.trim().toUpperCase()));
 return {barN,barPE,circuitCount:strips.length,
  distinctStrips:named.size,unnamedStrips:strips.filter(x=>!x.code).length,
  terminalPositions:strips.reduce((n,x)=>n+x.quantity,0),
  assigned:all.filter(x=>!!x.zone).length,pending:all.filter(x=>!x.zone).length};
}
function check(a){
 const s=stats(a),errors=[];
 if(s.pending)errors.push('Disposición física auxiliar: '+s.pending+' elemento(s) sin zona de montaje asignada.');
 const items=list(a),dup=new Map();
 for(const strip of items.filter(x=>x.group==='circuits'&&x.code)){
  const key=strip.code.trim().toUpperCase();
  const before=dup.get(key);
  if(before&&before.zone&&strip.zone&&before.zone!==strip.zone)
   errors.push('Regleta '+strip.code+': las salidas asociadas tienen zonas físicas contradictorias.');
  if(!before)dup.set(key,strip);
 }
 const referenceIds={bars:new Set(root.PanelBusbars.all(a).map(b=>b.id)),
  circuits:new Set(root.PanelCircuits.all(a).map(c=>c.id))};
 for(const key of ['bars','circuits'])for(const id of Object.keys(maps(a)[key]||{}))
  if(!referenceIds[key].has(id))errors.push('Asignación física obsoleta '+key+'/'+id+'.');
 if(items.length)errors.push('Montaje auxiliar orientativo: comprobar capacidad y accesorios de la envolvente comercial.');
 return [...new Set(errors)];
}
function optionMarkup(v,esc){return zones.map(([value,label])=>`<option value="${esc(value)}" ${v===value?'selected':''}>${esc(label)}</option>`).join('');}
function card(v,escape,editable){
 const type=v.type==='PE'?'earth':v.type==='N'?'neutral':'terminals';
 const select=editable?`<label class="aux-placement-label" for="aux_${escape(v.group+'_'+v.id)}">Posición:
 <select id="aux_${escape(v.group+'_'+v.id)}" data-aux-group="${escape(v.group)}" data-aux-id="${escape(v.id)}">${optionMarkup(v.zone,escape)}</select></label>`:'';
 return `<div class="aux-fixture ${type}" data-aux-fixture="${escape(v.group+'_'+v.id)}">
 <div class="aux-fixture-face" aria-hidden="true">${v.type==='X'?'<span class="aux-term-mark">▣ ▣ ▣</span>':'<span class="aux-bar-mark">▰ ▰ ▰</span>'}</div>
 <div class="aux-fixture-info"><strong>${escape(v.label)}</strong><span>${escape(v.description)}</span><small>${v.quantity} ${escape(v.unit)} · fabricante/PVP pendiente</small></div>${select}</div>`;
}
function physical(a,escape){
 const objects=list(a),summary=stats(a);
 const inside=key=>objects.filter(o=>o.zone===key);
 const area=(key,title)=>`<section class="aux-area aux-area-${key}" data-aux-zone-visible="${key}">
 <div class="aux-area-head">${escape(title)}<small>sin dimensiones verificadas</small></div>
 <div class="aux-area-items">${inside(key).length?inside(key).map(o=>card(o,escape,false)).join(''):'<span class="aux-empty">Sin elementos asignados</span>'}</div></section>`;
 const missing=inside('');
 const selection=objects.length?`<div class="aux-selection-list">${objects.map(o=>card(o,escape,true)).join('')}</div>`:'<p class="small-text">No hay todavía barras o salidas de circuito. Puedes diseñarlas desde el unifilar.</p>';
 return {header: `<div class="aux-layout-caption"><strong>Elementos auxiliares de la envolvente</strong><span>Propuesta de zonas, no ubicación acotada ni reserva de espacio calculada.</span></div>${area('upper','Zona superior propuesta')}`,
  side:area('side','Zona lateral propuesta'),
  bottom:area('lower','Zona inferior propuesta'),
  panel:`<section class="aux-physical-panel" data-aux-panel="true">
   <div class="aux-physical-head"><div><strong>Barras y borneros · pre-disposición</strong>
    <p>${summary.barN} barra(s) N · ${summary.barPE} barra(s) PE · ${summary.circuitCount} salida(s) documentada(s)</p></div>
    <button type="button" class="button small" data-action="suggestAuxZones" ${!objects.length?'disabled':''}>⌖ Sugerir zonas vacías</button>
   </div>
   <p class="small-text">${summary.assigned} asignados a zona · ${summary.pending} pendientes. ${summary.terminalPositions} posiciones de borne orientativas; ${summary.distinctStrips} identificador(es) de regleta; ${summary.unnamedStrips} sin etiqueta.</p>
   ${selection}
   ${missing.length?`<div class="aux-pending">${missing.length} elemento(s) sin ubicar: ${missing.map(x=>escape(x.label)).join(', ')}.</div>`:''}
   <div class="placeholder-tape">Las posiciones auxiliares no consumen módulos DIN; <strong>no equivalen a espacio libre garantizado</strong>. Se desconocen dimensiones, soportes, separaciones, canaletas, cableado y PVP hasta seleccionar productos comerciales reales.</div>
  </section>`};
}
root.PanelPhysicalAux=Object.freeze({zones,list,setZone,suggest,stats,check,validAll,physical});
})(window);