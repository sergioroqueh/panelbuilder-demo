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
 return null;
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
  if(record.rcdType&&device.rcdType&&record.rcdType!==device.rcdType)discrepancies.push('tipo de diferencial');
  if(Number.isFinite(record.sensitivityMa)&&Number.isFinite(device.sensitivity)
     &&record.sensitivityMa!==device.sensitivity)discrepancies.push('sensibilidad');
  const mismatch=discrepancies.length>0;
  return [{id:device.id,label:device.label,brand:activeBrand,ref:sel.referencia,
   widthMm:width,heightMm:height,depthMm:depth,
   documentedModules:mods,genericModules:genericMods,
   mismatch,discrepancies,complete:width!==null&&height!==null&&depth!==null,
   source:record.source||'',placed:Number.isInteger(device.row)&&Number.isInteger(device.pos)}];
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
   +'<a href="'+esc(r.source)+'" target="_blank" rel="noopener noreferrer">Ficha oficial ↗</a></li>';
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
