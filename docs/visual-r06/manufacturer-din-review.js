/* PanelBuilder v0.11 · lectura dimensional DOCUMENTAL por referencia individual.
 * Una candidatura no aplica una geometría ni acredita montaje/compatibilidad.
 */
(function(root){'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function bySku(brand,ref){
 if(brand==='Hager')return root.PanelManufacturerHosts?.findHost('Hager',ref)||null;
 if(brand==='Legrand'){
  const d=root.PanelManufacturerR15?.byKey('Legrand',ref);
  return d?.kind==='diferencial'?d:null;
 }
 if(brand==='Schneider'){
  const g=root.PanelSchneiderIC60N?.verifiedGeometry?.[ref];
  const p=g&&root.PanelSchneiderIC60N.records().find(x=>
   x.referencia===ref&&x.procedencia_referencia==='ficha_individual'
   &&x.admision_comparador&&x.estado_comercial!=='descatalogado');
  if(!p)return null;
  return {kind:'magnetotermico',poles:p.atributos.polos,ampA:p.atributos.amp,
   curve:p.atributos.curva,modules:g.modulos,widthMm:g.ancho_mm,
   heightMm:g.alto_mm,depthMm:g.profundidad_mm,
   source:p.url_oficial,geometrySource:g.url_fuente,
   evidence:g.fecha_ficha
    ?'Ficha Schneider fechada '+g.fecha_ficha+' alojada por distribuidor; vigencia pendiente.'
    :'Cotas reproducidas por distribuidor para ese SKU; falta ficha primaria vigente.'};
 }
 return null;
}
function annotationNotes(a,id,brand,ref){
 const notes=[],plans=[
  ...(a?.dinAccessoryAssemblies?.chains?.[id]||[]),
  ...(a?.physicalAccessoryPlans?.[id]?[a.physicalAccessoryPlans[id]]:[]),
  ...(a?.dinAccessoryAssemblies?.combs||[]).filter(x=>x.deviceIds?.includes(id))
 ];
 for(const p of plans){
  if(p.brand!==brand){
   notes.push('Anotación '+p.brand+' '+p.ref+': marca distinta del aparato; compatibilidad no acreditada.');
   continue;
  }
  if(brand==='Hager'){
   const listed=root.PanelManufacturerHosts?.listed('Hager',ref,p.ref);
   const comb=root.PanelManufacturerHosts?.findComb('Hager',p.ref);
   const capFor=(root.PanelManufacturerHosts?.combs||[]).filter(b=>b.brand==='Hager'&&b.endcap===p.ref);
   if(capFor.length){
    notes.push('Tapa '+p.ref+': pieza final documentada para peine(s) '+capFor.map(b=>b.ref).join(', ')+
     '; NO equivale a accesorio lateral del magnetotérmico '+ref+'. '+
     (listed?'Aparece en su lista comercial, sin montaje directo acreditado.':
       'No figura en la lista estudiada del anfitrión; no demuestra incompatibilidad.'));
    continue;
   }
   notes.push(p.ref+(listed
    ?': figura en lista oficial de accesorios del SKU '+ref+'; montaje sin aprobar.'
    :': asociación individual no acreditada; no demuestra incompatibilidad.'));
   if(comb?.endcap)notes.push('Peine '+p.ref+': tapa '+comb.endcap+
    ' documentada para este peine; verificar corte, número de tapas y conexión.');
   if(listed&&p.ref==='MZ201'){
    const item=root.PanelPhysicalAccessories?.byKey('Hager','MZ201');
    if(item&&item.widthMm===9.5&&item.modules===0.5)
     notes.push('MZ201: ficha individual, ancho exterior del accesorio 9,50 mm, 0,5 M nominal y montaje por clic. NO demuestra anchura del conjunto '+ref+' + MZ201, lado instalado, ni coexistencia con peines.');
   }
  }else if(brand==='Legrand'){
   const host=root.PanelManufacturerR15?.byKey('Legrand',ref);
   const isPeine=Array.isArray(p.deviceIds)||root.PanelPhysicalAccessories?.byKey(p.brand,p.ref)?.kind==='peine';
   notes.push(p.ref+(host?.additionalEquipment===false&&!isPeine
    ?': incompatibilidad documentada: el fabricante declara que NO acepta auxiliares.'
    :': combinación exacta con '+ref+' no acreditada; admisión genérica no basta.'));
  }else{
   notes.push(p.ref+': enlace con '+ref+' no acreditado por pareja SKU; verificar auxiliar/peine/tapa.');
  }
 }
 return [...new Set(notes)];
}
function annotationSources(a,id,brand){
 // Relaciones voluntarias: las fuentes SOLO enlazan fichas de accesorios
 // conocidas por SKU, no certifican la instalacion conjunta.
 const plans=[
  ...(a?.dinAccessoryAssemblies?.chains?.[id]||[]),
  ...(a?.physicalAccessoryPlans?.[id]?[a.physicalAccessoryPlans[id]]:[]),
  ...(a?.dinAccessoryAssemblies?.combs||[]).filter(x=>x.deviceIds?.includes(id))
 ];
 const found=new Map();
 for(const p of plans){
  if(p.brand!==brand||!p.ref)continue;
  const part=root.PanelPhysicalAccessories?.byKey(brand,p.ref)
   ||root.PanelManufacturerHosts?.findComb(brand,p.ref);
  if(typeof part?.source==='string'&&part.source.startsWith('https://'))
   found.set(p.ref,{ref:p.ref,source:part.source});
 }
 return [...found.values()].slice(0,8);
}
function pendingJointAssembly(a,id,brand,hostRef,discrepancies){
 // Abrir este gate SOLO para la terna anotada literalmente por el usuario.
 // La lista comercial no demuestra montaje simultaneo ni dimension instalada.
 if(brand!=='Hager'||hostRef!=='NCN463A')return null;
 const aux=[
  ...(a?.dinAccessoryAssemblies?.chains?.[id]||[]),
  ...(a?.physicalAccessoryPlans?.[id]?[a.physicalAccessoryPlans[id]]:[])
 ].some(p=>p?.brand==='Hager'&&p.ref==='MZ201');
 const comb=(a?.dinAccessoryAssemblies?.combs||[]).some(p=>
  p?.brand==='Hager'&&p.ref==='KDN463B'&&Array.isArray(p.deviceIds)&&p.deviceIds.includes(id));
 if(!aux||!comb)return null;
 // La terna literal no basta: una candidatura desactualizada (polos, In,
 // curva, anchura generica o Icn requerido) invalida este checklist concreto.
 if(discrepancies.length)return {
  status:'REVISAR_CANDIDATURA',
  title:'NCN463A + MZ201 + KDN463B',
  cap:'La referencia comercial ya no coincide con el equipo genérico; revisa primero la candidatura.',
  pending:['Diferencias detectadas: '+discrepancies.join(', ')+'. No evaluar ni aplicar dimensiones del conjunto hasta resolverlas.']
 };
 const cover=[
  ...(a?.dinAccessoryAssemblies?.chains?.[id]||[]),
  ...(a?.physicalAccessoryPlans?.[id]?[a.physicalAccessoryPlans[id]]:[])
 ].some(p=>p?.brand==='Hager'&&p.ref==='KZN024');
 return {
  status:'PENDIENTE_DE_VERIFICAR',
  title:'NCN463A + MZ201 + KDN463B',
  cap:cover
   ?'KZN024 anotada: verificar protección de extremos reales tras corte; anotación NO confirma colocación.'
   :'KZN024 documentada para KDN463B pero NO anotada en este dispositivo; verificar necesidad y extremos.',
  pending:[
   'Manual de montaje del conjunto exacto: no se ha acreditado la combinación simultánea.',
   'Lado, orden, límite de auxiliares y ancho total real NCN463A + MZ201 pendientes.',
   'Borne que admite horquilla, fase/neutro, posición y alimentación con KDN463B pendientes.',
   'Longitud tras corte, dientes útiles, aislamiento y tapas de ambos extremos pendientes.',
   'Revisar discrepancia de la ficha MZ201: título 5 A frente a corriente nominal 6 A; no resolver por suposición.',
   'Comprobar separación, puerta, cableado, calentamiento y condiciones normativas del cuadro.'
  ]
 };
}
function rows(a,activeBrand){
 if(!a||!['Hager','Legrand','Schneider'].includes(activeBrand))return [];
 return (a.devices||[]).flatMap(device=>{
  const sel=a.apparatusCandidates?.[device.id];
  if(!sel||sel.fabricante!==activeBrand||sel.estado!=='candidata_no_validada')return [];
  const record=bySku(activeBrand,sel.referencia);
  if(!record)return [];
  const matchesKind=record.kind==='magnetotermico'
    ?['MCB','MCB1'].includes(device.kind)
    :record.kind==='diferencial'&&device.kind==='RCD';
  const width=typeof record.widthMm==='number'&&Number.isFinite(record.widthMm)&&record.widthMm>0?record.widthMm:null;
  const height=typeof record.heightMm==='number'&&Number.isFinite(record.heightMm)&&record.heightMm>0?record.heightMm:null;
  const depth=typeof record.depthMm==='number'&&Number.isFinite(record.depthMm)&&record.depthMm>0?record.depthMm:null;
  const mods=Number.isInteger(record.modules)?record.modules:null;
  const genericMods=Number(device.modules);
  const discrepancies=[];
  if(!matchesKind)discrepancies.push('función');
  if(mods!==null&&genericMods!==mods)discrepancies.push('módulos DIN');
  if(record.poles&&device.poles&&record.poles!==device.poles)discrepancies.push('polos');
  if(Number.isFinite(record.ampA)&&Number.isFinite(device.amp)&&record.ampA!==device.amp)
   discrepancies.push('intensidad');
  if(record.curve&&device.curve&&record.curve!==device.curve)discrepancies.push('curva');
  // El checklist exacto NCN463A exige tambien datos genericos presentes;
  // ignorar campos ausentes daria apariencia de que el host ha sido cotejado.
  if(activeBrand==='Hager'&&sel.referencia==='NCN463A'){
   if(!device.poles)discrepancies.push('polos sin definir');
   if(!(Number(device.amp)>0))discrepancies.push('intensidad sin definir');
   if(!device.curve)discrepancies.push('curva sin definir');
   // Icn 400 V de la ficha no es Icu y no cubre exigencias superiores.
   if(Number(device.breakingKa)>10)discrepancies.push('Icn IEC 60898-1 a 400 V');
  }
  if(record.rcdType&&device.rcdType&&record.rcdType!==device.rcdType)discrepancies.push('tipo de diferencial');
  if(Number.isFinite(record.sensitivityMa)&&Number.isFinite(device.sensitivity)
     &&record.sensitivityMa!==device.sensitivity)discrepancies.push('sensibilidad');
  const mismatch=discrepancies.length>0;
  return [{id:device.id,label:device.label,brand:activeBrand,ref:sel.referencia,
   widthMm:width,heightMm:height,depthMm:depth,
   documentedModules:mods,genericModules:genericMods,
   mismatch,discrepancies,complete:width!==null&&height!==null&&depth!==null,
   source:record.source||'',geometrySource:record.geometrySource||'',evidence:record.evidence||'',
   annotationNotes:annotationNotes(a,device.id,activeBrand,sel.referencia),
   annotationSources:annotationSources(a,device.id,activeBrand),
   assemblyGate:pendingJointAssembly(a,device.id,activeBrand,sel.referencia,discrepancies),
   placed:Number.isInteger(device.row)&&Number.isInteger(device.pos)}];
 });
}
function render(a,brand){
 const list=rows(a,brand);
 if(!list.length)return '';
 const cards=list.map(r=>{
  const size=r.complete
   ?r.widthMm+' × '+r.heightMm+' × '+r.depthMm+' mm'
   :'Cotas exteriores incompletas o pendientes';
  const occupied=r.documentedModules===null?'módulos ficha pendientes':r.documentedModules+' M nominales en ficha';
  const difference=r.widthMm===null?''
   :' · el aparato mide '+r.widthMm+' mm y '+r.documentedModules+' M suponen '+(r.documentedModules*18)+' mm nominales. Esa diferencia NO se declara utilizable para otro equipo.';
  return '<li data-manufacturer-din-sku="'+esc(r.ref)+'" data-manufacturer-din-device="'+esc(r.id)+'"><strong>'
   +esc(r.label)+' · '+esc(r.brand+' '+r.ref)+'</strong> — '+esc(size)
   +' · '+esc(occupied)+'; distribución genérica: '+esc(r.genericModules)+' M.'
   +(r.mismatch?'<span class="manufacturer-din-mismatch"> ⚠ Diferencias con el genérico: '+esc(r.discrepancies.join(', '))+'. Revisar candidatura; no aplicar automáticamente.</span>':'')
   +(r.widthMm===null?'<span class="manufacturer-din-pending"> ⚠ No se aplicarán medidas desconocidas.</span>':'')
   +'<span class="manufacturer-din-note">'+esc(difference)+'</span>'
   +(r.evidence?'<span class="manufacturer-din-pending"> ⚠ '+esc(r.evidence)+'</span>':'')
   +(r.annotationNotes.length?'<div class="manufacturer-din-note"><strong>Accesorios anotados · sin aprobar:</strong> '+r.annotationNotes.map(esc).join(' · ')+'</div>':'')
   +(r.annotationSources.length?'<div class="manufacturer-din-note"><strong>Fichas individuales de accesorios:</strong> '+r.annotationSources.map(o=>'<a href="'+esc(o.source)+'" target="_blank" rel="noopener noreferrer">'+esc(o.ref)+' ↗</a>').join(' · ')+' · Documentación, NO aprobación de conjunto.</div>':'')
   +(r.assemblyGate?'<div class="manufacturer-din-pending" data-assembly-gate="'+esc(r.id)+'" data-assembly-status="'+esc(r.assemblyGate.status)+'"><strong>Conjunto '+esc(r.assemblyGate.title)+' · '+esc(r.assemblyGate.status==='REVISAR_CANDIDATURA'?'REVISAR CANDIDATURA':'SIN VALIDACIÓN CONSTRUCTIVA')+'</strong><p>'+esc(r.assemblyGate.cap)+'</p><ul>'+r.assemblyGate.pending.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul><small>Lista de comprobaciones, no instrucciones de montaje ni reserva de módulos.</small></div>':'')
   +'<a href="'+esc(r.source)+'" target="_blank" rel="noopener noreferrer">Ficha oficial ↗</a>'
   +(r.geometrySource&&r.geometrySource!==r.source?' · <a href="'+esc(r.geometrySource)+'" target="_blank" rel="noopener noreferrer">Fuente de cotas ↗</a>':'')+'</li>';
 }).join('');
 return '<details class="manufacturer-din-review" data-manufacturer-din-review><summary><strong>Geometría por referencia · '
  +list.length+' candidatura(s) documentadas (sin aplicar)</strong></summary>'
  +'<p>Comparación solo informativa con la distribución genérica. El ancho de producto '
  +'no equivale a espacio libre entre aparatos ni aprueba peines, accesorios, cableado o montaje. '
  +'Ninguna candidatura cambia módulos o posiciones sin la confirmación dimensional prevista.</p>'
  +'<ul>'+cards+'</ul></details>';
}
root.PanelManufacturerDINReview=Object.freeze({bySku,rows,render});
})(window);
