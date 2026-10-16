/* Ruta 1 de PanelBuilder: reproducir unifilar existente.
   Auditoría de campos DESCONOCIDOS. Nunca sugiere valores ni implica validación. */
(function(root){
'use strict';
const defined=v=>v!==null&&v!==undefined&&String(v).trim()!=='';
const gt0=v=>defined(v)&&Number.isFinite(Number(v))&&Number(v)>0;
function missingFor(d){
 const fields=[];
 const need=(ok,field,name)=>{if(!ok)fields.push({field,name});};
 need(defined(d.poles),'poles','Polos');
 if(d.kind==='MCB'){
  need(gt0(d.amp),'amp','Intensidad asignada');
  need(defined(d.curve),'curve','Curva de disparo');
  need(gt0(d.breakingKa),'breakingKa','Poder de corte requerido (kA)');
 }else if(d.kind==='RCD'){
  need(gt0(d.amp),'amp','Intensidad asignada');
  need(gt0(d.sensitivity),'sensitivity','Sensibilidad (mA)');
  need(defined(d.rcdType),'rcdType','Tipo diferencial');
 }else if(d.kind==='SPD'){
  need(defined(d.spdClass),'spdClass','Clase SPD');
  need(defined(d.spdNetwork),'spdNetwork','Esquema de red TT/TN/IT');
  need(gt0(d.spdUcV),'spdUcV','Uc (V)');
  need(gt0(d.spdInKa),'spdInKa','In mínimo (kA)');
  need(gt0(d.spdImaxKa),'spdImaxKa','Imax mínimo (kA)');
  need(defined(d.spdPeBusbarId),'spdPeBusbarId','Barra PE de destino anotada (sin validar cableado)');
 }else if(d.kind==='CONTACT'){
  need(gt0(d.amp),'amp','Intensidad según categoría de empleo');
  need(gt0(d.contactCoilV),'contactCoilV','Bobina (V)');
  need(defined(d.contactContacts),'contactContacts','Contactos');
  need(defined(d.contactUsageCategory),'contactUsageCategory','Categoría AC-1/AC-3/AC-7');
  need(defined(d.contactMode),'contactMode','Modo de funcionamiento');
 }else if(d.kind==='SWITCH'){
  need(gt0(d.amp),'amp','Intensidad de empleo');
  need(defined(d.switchDuty),'switchDuty','Categoría de empleo');
  need(defined(d.switchMount),'switchMount','Tipo de montaje');
  need(defined(d.switchControl),'switchControl','Tipo de mando');
 }
 return fields;
}
function assess(a,brand){
 const items=(a.devices||[]).flatMap(d=>missingFor(d).map(f=>({...f,id:d.id,label:d.label})));
 const n=(a.devices||[]).length;
 const placed=!!a.rows&&!!a.slots&&!a.layoutDirty&&(a.devices||[]).every(d=>Number.isInteger(d.row)&&Number.isInteger(d.pos));
 const selections=(a.devices||[]).filter(d=>{
  if(a.apparatusCandidates?.[d.id])return true;
  return brand!=='Generico'&&!!a.assignments?.[d.id];
 }).length;
 const candidateCount=(a.devices||[]).filter(d=>!!a.apparatusCandidates?.[d.id]).length;
 const stages=[
  {number:1,title:'Reproducir unifilar',status:!n?'empty':items.length?'pending':'documented',detail:n?n+' aparato(s), '+items.length+' dato(s) pendiente(s)':'Añade o importa los aparatos de tu esquema',view:'unifilar'},
  {number:2,title:'Elegir fabricante',status:selections===n&&n?'pending':'incomplete',detail:selections+' / '+n+' referencias preliminares; ninguna validada',view:'brand'},
  {number:3,title:'Diseñar vista del cuadro',status:placed?'documented':'pending',detail:placed?a.rows+' × '+a.slots+' M (propuesta revisable)':!a.rows?'Sin propuesta de envolvente':'Distribución pendiente de revisión',view:'physical'},
  {number:4,title:'Exportar documentación',status:n?'available':'empty',detail:n?'SVG y CSV preliminares disponibles':'Necesitas algún dispositivo para exportar',view:'materials'}
 ];
 return {missing:items,stages,deviceCount:n,selections,candidateCount,placed};
}
function render(a,brand,esc){
 const data=assess(a,brand);
 return '<div class="workflow-guidance-head"><div><strong>Tu recorrido · de unifilar a cuadro</strong><span>Avanza libremente: los pasos son orientativos, nunca validan una instalación.</span></div><span class="workflow-guidance-total">'+data.missing.length+' dato(s) por completar</span></div>'
 +'<div class="workflow-guidance-steps">'+data.stages.map(step=>
  '<button type="button" class="workflow-guidance-step" data-flow-view="'+step.view+'"><span class="workflow-guidance-index">'+step.number+'</span><span><strong>'+esc(step.title)+'</strong><small>'+esc(step.detail)+'</small></span></button>'
 ).join('')+'</div>'
 +(data.missing.length?'<details class="workflow-missing" data-flow-missing="true"><summary>¿Qué información me falta? · '+data.missing.length+' dato(s)</summary><p>No deducimos valores eléctricos por el nombre del circuito. Consulta proyecto, memoria, ficha y cálculos de un profesional competente.</p><div class="workflow-missing-items">'+data.missing.slice(0,12).map(x=>'<button type="button" data-flow-device="'+esc(x.id)+'" data-flow-field="'+esc(x.field)+'">'+esc(x.label)+' · '+esc(x.name)+' → Ir a propiedades</button>').join('')+(data.missing.length>12?'<small>+ '+(data.missing.length-12)+' campos adicionales pendientes</small>':'')+'</div></details>':
 '<p class="workflow-ready-hint">No faltan campos básicos del checklist. Aún son necesarias las comprobaciones eléctricas, comerciales y normativas del conjunto.</p>')
 +'<div class="workflow-guidance-export"><span>Descargas disponibles:</span><button type="button" class="button small" data-flow-export="svg" '+(!data.deviceCount?'disabled':'')+'>↓ Unifilar SVG</button><button type="button" class="button small" data-flow-export="csv" '+(!data.deviceCount?'disabled':'')+'>↓ Materiales CSV</button><button type="button" class="button small" data-flow-export="json">↓ Proyecto JSON</button></div>';
}
root.PanelWorkflowGuidance=Object.freeze({missingFor,assess,render});
})(window);
