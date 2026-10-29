/* PanelBuilder R28: catálogo de tarifas PRIVADO de consulta temporal; nunca presupuestar
 * automáticamente un importe sin base IVA y unidad verificadas. */
(function(root){'use strict';
 let entries=new Map(),counts=null,lastError='';
 const key=(b,r)=>String(b).trim().toUpperCase()+'\u001F'+String(r).trim().toUpperCase();
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const brands=new Set(['Legrand','Schneider','Hager','Maxge']);
 function loadText(text){
  if(typeof text!=='string'||text.length>35_000_000)throw Error('Archivo no válido o demasiado grande (>35 MB de texto).');
  const doc=JSON.parse(text);
  if(doc?.schema!=='panelbuilder.tariffs.local.v1'||!Array.isArray(doc.records)||doc.records.length<1||doc.records.length>90_000)
    throw Error('Versión o estructura de tarifa incompatible.');
  const trial=new Map(),nextCount={total:0,porMarca:{},preciosPositivos:0,preciosCero:0};
  for(const r of doc.records){
   if(!r||!brands.has(r.fabricante)||typeof r.referencia!=='string'||!r.referencia.trim()||r.referencia.length>120
     ||typeof r.descripcion_tarifa!=='string'||r.descripcion_tarifa.length>400
     ||r.base_iva!=='NO_DOCUMENTADA_EN_XLSX'||typeof r.importe_original!=='string'||r.importe_original.length>40
     ||!/^\d+(?:\.\d+)?$/.test(r.importe_original))throw Error('Registro con campos incompatibles en tarifa local.');
   const id=key(r.fabricante,r.referencia);
   if(trial.has(id))throw Error('Referencia duplicada en tarifa local: '+r.fabricante+' '+r.referencia);
   trial.set(id,{fabricante:r.fabricante,referencia:r.referencia,descripcion_tarifa:r.descripcion_tarifa,
     importe_original:r.importe_original,unidad_precio_original:String(r.unidad_precio_original||''),
     cantidad_embalaje_original:String(r.cantidad_embalaje_original||''),
     fecha_vigencia_original:String(r.fecha_vigencia_original||''),
     hoja:String(r.hoja||''),fila:Number(r.fila)||0,base_iva:r.base_iva,
     avisos:String(r.avisos||''),estado:String(r.estado||'no_verificado')});
   nextCount.total++;nextCount.porMarca[r.fabricante]=(nextCount.porMarca[r.fabricante]||0)+1;
   if(Number(r.importe_original)>0)nextCount.preciosPositivos++;else nextCount.preciosCero++;
  }
  entries=trial;counts=nextCount;lastError='';return summary();
 }
 function clear(){entries=new Map();counts=null;lastError='';}
 function lookup(brand,ref){return entries.get(key(brand,ref))||null;}
 function summary(){return counts?{total:counts.total,porMarca:{...counts.porMarca},preciosPositivos:counts.preciosPositivos,preciosCero:counts.preciosCero}:null;}
 function formatPrice(r){
  if(!r)return '';
  const p=Number(r.importe_original);
  if(!Number.isFinite(p)||p===0)return 'Importe 0: no cotizable';
  const dec=r.fabricante==='Maxge'?3:2;
  return p.toLocaleString('es-ES',{minimumFractionDigits:dec,maximumFractionDigits:dec})
      +' · importe de tarifa ('+(r.unidad_precio_original||'unidad no verificada')+'; IVA sin confirmar)';
 }
 function label(brand,ref){
  const r=lookup(brand,ref);if(!r)return '';
  return '<small>Tarifa privada: '+esc(formatPrice(r))+' · '+esc(r.fecha_vigencia_original)
    +' · sólo consulta; excluido del cálculo automático</small>';
 }
 function form(){
  return '<section class="quote-spec-entry" data-private-tariff>'
    +'<div class="quote-section-title"><strong>Tarifas privadas (consulta local)</strong>'
    +'<small>El archivo se lee sólo en este navegador, sin almacenarse con el proyecto.</small></div>'
    +'<label>JSON local de las cuatro tarifas <input id="privateTariffInput" type="file" accept=".json,application/json" /></label>'
    +'<p class="tiny-hint" id="privateTariffStatus">'+(counts
      ?esc(counts.total.toLocaleString('es-ES'))+' referencias cargadas temporalmente · IVA y compatibilidad pendientes'
      :esc(lastError||'Aún no hay tarifa cargada. Usa el JSON privado de R28.'))+'</p></section>';
 }
 if(typeof document!=='undefined'&&document?.addEventListener){
  document.addEventListener('change',async e=>{
   if(e.target?.id!=='privateTariffInput')return;
   const file=e.target.files?.[0];if(!file)return;
   const status=document.getElementById('privateTariffStatus');
   try{
    if(file.size>35_000_000)throw Error('Archivo demasiado grande (>35 MB).');
    const loaded=loadText(await file.text());
    if(status)status.textContent=loaded.total.toLocaleString('es-ES')+' referencias cargadas: '
      +Object.entries(loaded.porMarca).map(([b,n])=>b+' '+n).join(', ')+'. Datos locales; sin IVA ni validación eléctrica.';
   }catch(err){lastError='Error al importar: '+(err?.message||String(err));if(status)status.textContent=lastError;}
  });
 }
 root.PanelTariffLocal=Object.freeze({loadText,lookup,summary,formatPrice,label,form,clear});
})(window);
