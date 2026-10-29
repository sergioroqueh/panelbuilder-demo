/* PanelBuilder v0.12 R03 · Cuadro de materiales y control económico.
   SOLO lectura; no transforma el genérico, no valida compatibilidad o montaje.
   Sin sumar precios de IVA desconocido ni deducir PVP de registros privados. */
(function(root) {
'use strict';
const money=n=>Number(n).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
const sanePrice=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=10000000;
const safeText=(s)=>String(s??'');
// Enlaces de fuentes: HTTPS válido, sin credenciales ni caracteres de control.
// No interpreta una URL como prueba de vigencia o de compatibilidad técnica.
function safeSourceUrl(value){
 if(typeof value!=='string'||!/^https:\/\/[^/?#]+/i.test(value)||/[\u0000-\u0020\u007f\\]/.test(value))return '';
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&!!url.hostname&&!url.username&&!url.password?url.href:'';
 }catch{return '';}
}
function priceFor(brand,ref){
 if(!brand||!ref)return {value:null,status:'sin_referencia',label:'Sin referencia'};
 const official=root.PanelPricebook?.find?.(brand,ref);
 if(official&&root.PanelPricebook.valid(official)&&sanePrice(official.pvp_sin_iva_eur))
  return {value:official.pvp_sin_iva_eur,status:'pvp_verificado',label:'PVP verificado sin IVA · vigencia documentada',url:official.fuente_url};
 const doc=root.PanelCommercial?.get?.(brand,ref);
 if(doc?.iva_base==='sin_iva_confirmado'&&sanePrice(doc.pvp_sin_iva_eur)
   &&safeSourceUrl(doc.url_oficial))
  return {value:doc.pvp_sin_iva_eur,status:'documental',label:'PVP documental sin IVA · vigencia pendiente',url:doc.url_oficial};
 return {value:null,status:'pendiente',label:doc?.precio_publicado_eur!=null
  ?'Precio publicado: IVA sin confirmar · NO incluido':'PVP sin IVA pendiente'};
}
function item({id,origin,description,qty,brand='',ref='',eligible=false,comment=''}) {
 const p=priceFor(brand,ref);
 // Un precio legible de catálogo no implica una partida elegible de compra.
 // Nunca valorar una referencia no seleccionada, incompatible o sin cantidad.
 const amountAllowed=!!ref&&eligible&&p.value!==null&&Number.isInteger(qty)&&qty>0;
 const verified=p.status==='pvp_verificado'&&amountAllowed;
 return {id,origin,description,qty:Number.isInteger(qty)&&qty>0?qty:null,
   brand,ref,eligible,comment,
   price:p.value,priceStatus:p.status,priceLabel:amountAllowed?p.label
     :(p.value!==null?'PVP informativo · NO contabilizable (elegibilidad/cantidad pendiente)':p.label),
   source:safeSourceUrl(p.url),total:amountAllowed?p.value*qty:null,verified};
}
function collect(a,brand='Generico'){
 const rows=[],devices=Array.isArray(a?.devices)?a.devices:[];
 for(const d of devices){
  const doc=root.PanelApparatusCandidates?.getSelection?.(a,d);
  // El fabricante activo solo filtra/compara. NO transforma las coincidencias
  // automáticas de placement/mini-catálogo en referencias ya contratadas.
  const used=doc?.selection?{brand:doc.selection.fabricante,ref:doc.selection.referencia,
    ok:!!doc.record&&!!doc.review?.eligible}:null;
  rows.push(item({id:'device:'+d.id,origin:'Unifilar · '+safeText(d.label),
    description:safeText(d.name||d.kind)+' · '+safeText(d.poles||'')+
       (d.amp?' · '+d.amp+' A':''),
    qty:1,brand:used?.brand||'',ref:used?.ref||'',
    eligible:!!used?.ok,comment:used?'Preselección comercial, montaje no validado':'Genérico sin referencia'}));
 }
 if(Number(a?.rows)>0){
  const enc=root.PanelEnclosureCandidates?.getSelection?.(a);
  rows.push(item({id:'enclosure',origin:'Envolvente',
   description:enc?.record?.descripcion||'Envolvente genérica · '+safeText(a.rows)+' filas × '+safeText(a.slots)+' módulos',
   qty:1,brand:enc?.selection?.fabricante||'',ref:enc?.selection?.referencia||'',
   eligible:!!enc?.capacity&&!a.layoutDirty,comment:'Preselección por capacidad nominal; montaje no validado'}));
 }
 for(const [id,entry] of Object.entries(a?.physicalAccessoryPlans||{})){
  rows.push(item({id:'accessory:'+id,origin:'Accesorio anotado · '+safeText(devices.find(d=>d.id===id)?.label||id),
   description:safeText(root.PanelPhysicalAccessories?.byKey?.(entry.brand,entry.ref)?.name||'Accesorio físico'),
   qty:null,brand:entry.brand,ref:entry.ref,eligible:false,comment:'Anotación sin cantidad de compra ni compatibilidad comprobadas'}));
 }
 const assemblies=a?.dinAccessoryAssemblies||{};
 for(const [id,entries] of Object.entries(assemblies.chains||{})){
  for(const [i,p] of entries.entries()){
   rows.push(item({id:'aux:'+id+':'+i,origin:'Auxiliar · '+safeText(devices.find(d=>d.id===id)?.label||id),
    description:safeText(root.PanelPhysicalAccessories?.byKey?.(p.brand,p.ref)?.name||'Auxiliar'),
    qty:null,brand:p.brand,ref:p.ref,eligible:false,
    comment:'Anotación de conjunto DIN; revisar posibles duplicidades y acoplamiento'}));
  }
 }
 for(const p of (assemblies.combs||[])){
  rows.push(item({id:'comb:'+p.id,origin:'Peine anotado',
   description:safeText(root.PanelPhysicalAccessories?.byKey?.(p.brand,p.ref)?.name||'Peine de conexión'),
   qty:null,brand:p.brand,ref:p.ref,eligible:false,
   comment:'Longitud, corte y montaje por verificar; tramo anotado, no despiece comprado'}));
 }
 const bars=Array.isArray(a?.busbars)?a.busbars:[];
 if(bars.length)rows.push(item({id:'bars',origin:'Distribución N/PE',
   description:bars.length+' barras lógicas N/PE · pendiente de definir barras y bornas físicas',
   qty:null,eligible:false,comment:'Cantidad comercial no determinada, NO comprar según contador lógico'}));
 const circuits=Array.isArray(a?.circuits)?a.circuits:[];
 if(circuits.length)rows.push(item({id:'terminals',origin:'Salidas / bornas',
   description:circuits.length+' circuitos terminales · pendiente de despiece de bornas y conductores',
   qty:null,eligible:false,comment:'Sin cantidad comprable de bornas/conductores documentada'}));
 return rows;
}
function summarize(rows){
 const priced=rows.filter(r=>r.total!==null);
 const verified=rows.filter(r=>r.verified);
 const confirmedSubtotal=verified.reduce((s,r)=>s+r.total,0);
 const referenceSubtotal=priced.reduce((s,r)=>s+r.total,0);
 const missing=rows.filter(r=>r.total===null);
 const pendingProof=rows.filter(r=>!r.verified);
 // La ausencia de envolvente o dispositivos impide hablar de cuadro completo.
 // Este gate se limita a los conceptos identificados, NO al montaje ni despiece final.
 const hasEnclosure=rows.some(r=>r.id==='enclosure');
 const hasDevices=rows.some(r=>r.id.startsWith('device:'));
 const complete=hasEnclosure&&hasDevices&&pendingProof.length===0;
 return {count:rows.length,withPrice:priced.length,verifiedPrices:verified.length,
   missing:missing.length,excludedPricing:rows.filter(r=>r.price!==null&&r.total===null).length,
   pendingVerification:pendingProof.length,
   partialSubtotal:referenceSubtotal,confirmedSubtotal,
   complete,verifiedTotal:complete?confirmedSubtotal:null};
}
function render(a,brand,esc){
 const rows=collect(a,brand),s=summarize(rows);
 const table=rows.map(r=>{
  const cls=r.verified?'pb12-price-verified':r.price!==null?'pb12-price-doc':'pb12-price-missing';
  const priceText=r.price===null?'—':money(r.price);
  const amount=r.total===null?'—':money(r.total);
  const ref=r.ref?esc(r.brand)+'<small>'+esc(r.ref)+'</small>':'<span class="pb12-pending">Genérico sin SKU</span>';
  const source=r.source?'<a href="'+esc(r.source)+'" target="_blank" rel="noopener noreferrer">Fuente ↗</a>':'';
  const compare=r.id.startsWith('device:')?'<button type="button" class="button small pb12-review-compare" data-pb12-review-compare="'+esc(r.id.slice(7))+'" aria-label="Cruzar fabricante de '+esc(r.origin)+'">Cruzar fabricante →</button>':'';
  return '<tr data-pb12-review-row="'+esc(r.id)+'"><td>'+esc(r.origin)+'</td>'
    +'<td><strong>'+esc(r.description)+'</strong><small>'+esc(r.comment)+'</small>'+compare+'</td>'
    +'<td class="pb12-qty">'+(r.qty===null?'Por definir':esc(r.qty))+'</td>'
    +'<td>'+ref+'</td><td>'+priceText+'</td><td>'+amount+'</td>'
    +'<td class="'+cls+'">'+esc(r.priceLabel)+'<small>'+source+'</small></td></tr>';
 }).join('');
 const count=s.count+' conceptos identificados · '+s.withPrice+' contabilizables · '+s.missing+' pendientes';
 return '<section class="work-card pb12-material-review" data-pb12-material-review="true">'
  +'<div class="card-header"><div><strong>Tabla de materiales del cuadro</strong>'
  +'<small>Dispositivos, envolvente y accesorios anotados. No mezcla el presupuesto independiente ni valida el montaje.</small></div>'
  +'<button type="button" class="button small" data-pb12-review-csv="true">↓ CSV de esta tabla</button></div>'
  +'<div class="card-body">'
  +'<div class="pb12-review-actions"><button type="button" class="button primary" data-pb12-review-pending="true">Revisar referencias del unifilar →</button>'
  +'<span>Filtra por fabricante, elige candidatos y vuelve a esta tabla para revisar importes.</span></div>'
  +'<div class="pb12-economic-status"><div><strong>'+esc(count)+'</strong>'
  +'<small>PVP sin IVA solo para partidas elegibles. '+s.excludedPricing+' referencias con PVP informativo excluidas.</small></div>'
  +'<div><small>Subtotal informativo de importes conocidos</small><strong>'+(s.withPrice?money(s.partialSubtotal):'Sin PVP')+'</strong>'
  +'<small>No es el precio completo del cuadro.</small></div></div>'
  +(s.complete
    ?'<p class="pb12-completion">PVP verificados para todos los conceptos enumerados: '+money(s.verifiedTotal)+' sin IVA. El conjunto y el despiece siguen pendientes de revisión técnica.</p>'
    :'<p class="pb12-incomplete"><strong>Análisis económico completo: pendiente.</strong> '
      +s.pendingVerification+' conceptos sin importe plenamente verificado/candidata comprobada. '
      +'No se presenta un total definitivo ni se aplica descuento o IVA automático.</p>')
  +'<div class="table-wrap"><table class="materials-table pb12-review-table"><thead><tr>'
  +'<th>Origen</th><th>Material y características</th><th>Ud.</th><th>Marca / ref.</th><th>PVP €/ud.</th><th>Importe</th><th>Estado y fuente</th>'
  +'</tr></thead><tbody>'+ (table||'<tr><td colspan="7">No se han definido materiales del cuadro todavía.</td></tr>')+'</tbody></table></div>'
  +'<p class="tiny-hint">No incluye automáticamente canaletas, envolvente sin propuesta DIN, conductor interior, tapas, mano de obra, logística o impuestos. '
  +'Las anotaciones de peines/auxiliares no acreditan las cantidades de compra ni su compatibilidad. '
  +'Una línea con precio informado no representa un PVP vigente ni un montaje aprobado.</p></div></section>';
}
function csv(a,brand){
 const rows=collect(a,brand);
 const cell=v=>{const raw=safeText(v);const safe=/^[\s]*[=+@-]/.test(raw)&&!/^-[0-9]+(?:[.,][0-9]+)?$/.test(raw)?"'"+raw:raw;return '"'+safe.replace(/"/g,'""')+'"';};
 const fields=[['Origen','Descripción','Cantidad','Fabricante','Referencia','PVP ud sin IVA EUR','Importe sin IVA EUR','Estado precio','¿PVP verificado?','Observaciones']];
 for(const r of rows)fields.push([r.origin,r.description,r.qty??'',r.brand,r.ref,
  r.price===null?'':r.price.toFixed(2),r.total===null?'':r.total.toFixed(2),
  r.priceLabel,r.verified?'SI, solo precio':'NO',r.comment]);
 return '\ufeff'+fields.map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
}
root.PanelMaterialReviewV12=Object.freeze({collect,summarize,render,csv,priceFor});
})(window);
