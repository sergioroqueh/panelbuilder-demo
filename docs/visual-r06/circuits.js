/* Salidas terminales de circuito: documentación sin cálculo ni validación eléctrica. */
(function(root){
'use strict';
const attrs=['code','destination','configuration','cableType','phaseMm2','neutralMm2','peMm2','lengthM','notes','terminalStrip','neutralBar','peBar','neutralBusbarId','peBusbarId'];
const cfgs=['','1F+N+PE','1F+PE','2F+PE','3F+N+PE','3F+PE'];
const num=x=>typeof x==='number'&&Number.isFinite(x)&&x>0&&x<=100000;
function all(a){return Array.isArray(a?.circuits)?a.circuits:[];}
function validAll(items,ds){
 if(items===undefined)return true;
 if(!Array.isArray(items)||items.length>350)return false;
 const ids=new Set(),owners=new Set();
 return items.every(c=>{
  if(!c||typeof c.id!=='string'||!/^c[0-9]+$/.test(c.id)||ids.has(c.id)||owners.has(c.deviceId)||
   !ds.some(d=>d.id===c.deviceId&&d.kind==='MCB')||
   !cfgs.includes(c.configuration))return false;
  for(const field of ['code','destination','cableType','notes'])
   if(typeof c[field]!=='string'||c[field].length>250)return false;
  for(const field of ['terminalStrip','neutralBar','peBar','neutralBusbarId','peBusbarId'])if(c[field]!==undefined&&(typeof c[field]!=='string'||c[field].length>30))return false;
  for(const field of ['phaseMm2','neutralMm2','peMm2','lengthM'])
   if(c[field]!==null&&c[field]!==''&&c[field]!==undefined&&!num(c[field]))return false;
  ids.add(c.id);owners.add(c.deviceId);return true;
 });
}
function create(a,deviceId){
 if(!a.devices.some(d=>d.id===deviceId&&d.kind==='MCB')||
    a.devices.some(d=>d.parent===deviceId)||all(a).some(c=>c.deviceId===deviceId))return null;
 const ids=new Set(all(a).map(c=>c.id)),labels=new Set(all(a).map(c=>c.code));
 let n=1;while(ids.has('c'+n)||labels.has('C'+n))n++;
 return {id:'c'+n,deviceId,code:'C'+n,destination:'',configuration:'',
   cableType:'',phaseMm2:null,neutralMm2:null,peMm2:null,lengthM:null,notes:'',
   terminalStrip:'X'+n,neutralBar:'',peBar:'',neutralBusbarId:'',peBusbarId:''};
}
const fmt=n=>num(n)?String(n).replace('.',','):'?';
function labels(c){
 if(!c.configuration)return ['Conductores por definir','Secciones pendientes'];
 const parts=['F '+fmt(c.phaseMm2)];
 if(c.configuration.includes('N'))parts.push('N '+fmt(c.neutralMm2));
 if(c.configuration.includes('PE'))parts.push('PE '+fmt(c.peMm2));
 return [c.configuration,parts.join(' · ')+' mm²'];
}
function terminalRows(c){
 if(!c.configuration)return [];
 const n=c.configuration.startsWith('3F')?3:c.configuration.startsWith('2F')?2:1;
 const rows=Array.from({length:n},(_,i)=>({role:n===1?'L':'L'+(i+1),section:c.phaseMm2,kind:'phase'}));
 if(c.configuration.includes('N'))rows.push({role:'N',section:c.neutralMm2,kind:'neutral'});
 if(c.configuration.includes('PE'))rows.push({role:'PE',section:c.peMm2,kind:'earth'});
 return rows;
}
function check(a){
 const out=[],ds=a.devices;
 all(a).forEach(c=>{
  const d=ds.find(d=>d.id===c.deviceId);
  if(!d||ds.some(other=>other.parent===c.deviceId))out.push('Salida '+c.code+': protección de origen no terminal. Revisar topología.');
  if(!c.destination)out.push('Salida '+c.code+': falta el destino.');
  if(!c.configuration)out.push('Salida '+c.code+': conductores no definidos.');
  if(c.configuration){
   if(!num(c.phaseMm2))out.push('Salida '+c.code+': sección de fase pendiente.');
   if(c.configuration.includes('N')&&!num(c.neutralMm2))out.push('Salida '+c.code+': sección de neutro pendiente.');
   if(c.configuration.includes('PE')&&!num(c.peMm2))out.push('Salida '+c.code+': sección de PE pendiente.');
   if(c.configuration.includes('N')&&!c.neutralBar&&!c.neutralBusbarId)out.push('Salida '+c.code+': referencia de barra N sin asignar.');
   if(c.configuration.includes('PE')&&!c.peBar&&!c.peBusbarId)out.push('Salida '+c.code+': referencia de barra PE sin asignar.');
   if(!c.terminalStrip)out.push('Salida '+c.code+': regleta de bornas por identificar.');
  }
 });return out;
}
function draw(a,locations,escape,interactive){
 let wires='',nodes='';
 all(a).forEach(c=>{
  const pt=locations.get(c.deviceId);
  if(!pt||a.devices.some(d=>d.parent===c.deviceId))return;
  const x=pt.x,oy=pt.y+81,[config,sections]=labels(c),rows=terminalRows(c);
  wires+=`<path d="M ${x} ${pt.y+32} V ${oy-10}" fill="none" stroke="#60809f" stroke-width="1.8"/>`;
  const attrs=interactive?`data-circuit-id="${escape(c.id)}" tabindex="0" role="button" aria-label="Editar salida ${escape(c.code)}"`:'';
  const showRows=rows.map((t,i)=>{
   const tx=x-64+i*26;
   const color=t.kind==='earth'?'#357351':t.kind==='neutral'?'#2369b7':'#27435c';
   const idx=c.terminalStrip?escape(c.terminalStrip+':'+(i+1)):'X?:?';
   return `<g class="terminal-role terminal-${t.kind}" data-terminal-role="${t.role}">
     <rect x="${tx}" y="${oy+43}" width="20" height="17" rx="2" fill="white" stroke="${color}" stroke-width="1.4"/>
     <text x="${tx+10}" y="${oy+54.5}" text-anchor="middle" font-family="Arial" font-size="7.5" font-weight="700" fill="${color}" pointer-events="none">${t.role}</text>
     <title>${idx} · ${t.role} · ${num(t.section)?t.section+' mm²':'sección pendiente'}</title>
   </g>`;
  }).join('');
  const descr=c.destination||'Destino pendiente';
  nodes+=`<g class="circuit-terminal terminal-schedule" ${attrs}>
    <rect class="circuit-hitbox" x="${x-78}" y="${oy-11}" width="158" height="85" rx="7" fill="#f3f8fe" stroke="#a8bed8" stroke-width="1.2"/>
    <rect x="${x-4}" y="${oy-6}" width="8" height="8" rx="1" fill="#fff" stroke="#57789a" stroke-width="1.5" pointer-events="none"/>
    <text x="${x+11}" y="${oy+1}" font-family="Arial" font-size="10.5" font-weight="800" fill="#254b75" pointer-events="none">${escape(c.code)}</text>
    <text x="${x-69}" y="${oy+19}" font-family="Arial" font-size="9.2" fill="#365c7e" pointer-events="none">${escape(descr.slice(0,26))}</text>
    <text x="${x-69}" y="${oy+32}" font-family="Arial" font-size="8.5" fill="#5e7896" pointer-events="none">${escape(config)}</text>
    ${rows.length?showRows:`<text x="${x-66}" y="${oy+54}" font-family="Arial" font-size="8.5" fill="#9c6a27" pointer-events="none">Bornas / conductores pendientes</text>`}
    <text x="${x-69}" y="${oy+69}" font-family="Arial" font-size="7.2" fill="#7790a6" pointer-events="none">${escape(c.terminalStrip||'X?')} · N:${escape(root.PanelBusbars.get(a,c.neutralBusbarId,'N')?.label||c.neutralBar||'?')} · PE:${escape(root.PanelBusbars.get(a,c.peBusbarId,'PE')?.label||c.peBar||'?')}</text>
    <title>${escape(c.code+' · '+descr+' · Bornas propuestas; N/PE sin conexionar')}</title>
   </g>`;
 });
 return {wires,nodes};
}
function form(c,escape,a){
 function field(key,label,type='text',opts){
  const id='circuit_'+key,value=c[key]??'';
  const content=opts?`<select data-circuit-edit="${key}" id="${id}">${opts.map(p=>`<option value="${escape(p[0])}" ${p[0]===value?'selected':''}>${escape(p[1])}</option>`).join('')}</select>`:
   `<input data-circuit-edit="${key}" id="${id}" type="${type}" ${type==='number'?'min="0.01" step="any"':''} value="${escape(String(value))}"/>`;
  return `<div class="form-field"><label for="${id}">${escape(label)}</label>${content}</div>`;
 }
 const [config,sections]=labels(c);
 return `<div class="section-heading">SALIDA DE CIRCUITO</div><h2>${escape(c.code)} · ${escape(c.destination||'Destino pendiente')}</h2>
 <p>Salida de una protección terminal. No se validan secciones, caída de tensión ni conexionado.</p>
 ${field('code','Identificación')}${field('destination','Destino / receptor')}
 ${field('configuration','Conductores',null,[['','Pendiente de definir'],['1F+N+PE','1 fase + N + PE'],['1F+PE','1 fase + PE'],['2F+PE','2 fases + PE'],['3F+N+PE','3 fases + N + PE'],['3F+PE','3 fases + PE']])}
 ${field('cableType','Designación de cable')}${field('phaseMm2','Sección fase (mm²)','number')}
 ${c.configuration.includes('N')?field('neutralMm2','Sección neutro (mm²)','number'):''}
 ${c.configuration.includes('PE')?field('peMm2','Sección PE (mm²)','number'):''}
 ${field('lengthM','Longitud orientativa (m)','number')}
 <div class="inspector-divider"></div><div class="section-heading">REGLETA Y ASIGNACIÓN N / PE</div>
 <p>Referencias de grupos de bornas y barras para documentar; no se dibujan conexiones ni se verifica su continuidad.</p>
 ${field('terminalStrip','Identificación regleta de salida (p.ej. X1)')}
 ${c.configuration.includes('N')?field('neutralBusbarId','Vincular barra N registrada',null,root.PanelBusbars.options(a,'N',c.neutralBusbarId||'')):''}
 ${c.configuration.includes('PE')?field('peBusbarId','Vincular barra PE registrada',null,root.PanelBusbars.options(a,'PE',c.peBusbarId||'')):''}
 ${c.configuration.includes('N')?field('neutralBar','Referencia N anterior (no vinculada)'):''}
 ${c.configuration.includes('PE')?field('peBar','Referencia PE anterior (no vinculada)'):''}
 ${field('notes','Notas')}
 <p class="tiny-hint">Bornas orientativas por conductores declarados: ${terminalRows(c).length}. Sin referencias comerciales/PVP ni asignación automática a embarrados.</p>
 <div class="estimated-width"><strong>${escape(config)}</strong><span>${escape(sections)} · Verificación pendiente.</span></div>
 <div class="inspector-buttons"><button class="button" data-action="inspectCircuitProtection">← Protección origen</button><button class="button danger" data-action="deleteCircuit">Eliminar salida</button></div>`;
}
root.PanelCircuits=Object.freeze({all,validAll,create,draw,form,check,attrs,terminalRows});
})(window);