/* PanelBuilder · Presupuesto directo sin obligar a dibujar un unifilar.
   Importes solamente con PVP sin IVA expresamente documentado o introducido
   como precio sin IVA por usuario. No acredita compatibilidad ni montaje. */
(function(root){'use strict';
const types=Object.freeze({aparato:'Aparato',envolvente:'Envolvente',accesorio:'Accesorio',otro:'Otro'});
const brands=['Legrand','Schneider','Hager','ABB','Maxge','Otra'];
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const money=n=>round(n).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
// R08: an external catalogue address is not automatically a safe link.
// Keep imported project data unchanged; only allow a valid HTTPS href.
function safeSourceUrl(value){
 if(typeof value!=='string'||!/^https:\/\/[^/?#]+/i.test(value)||/[\u0000-\u0020\u007f\\]/.test(value))return '';
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&!!url.hostname&&!url.username&&!url.password?url.href:'';
 }catch{return '';}
}
function get(a){return a?.quickBudget||{lines:[],discount:0,nextId:1};}
function valid(a){
 const b=a?.quickBudget;
 if(b===undefined||b===null)return true;
 if(!b||typeof b!=='object'||Array.isArray(b)||!Array.isArray(b.lines)||b.lines.length>2000
    ||!Number.isInteger(b.nextId)||b.nextId<1||b.nextId>100000
    ||typeof b.discount!=='number'||!Number.isFinite(b.discount)||b.discount<0||b.discount>100)return false;
 const ids=new Set();
 for(const x of b.lines){
  if(!x||typeof x!=='object'||typeof x.id!=='string'||!/^q[0-9]+$/.test(x.id)||ids.has(x.id)
    ||!Object.hasOwn(types,x.kind)||typeof x.brand!=='string'||x.brand.length>80
    ||typeof x.ref!=='string'||x.ref.length>100
    ||typeof x.description!=='string'||!x.description.trim()||x.description.length>240
    ||!Number.isInteger(x.qty)||x.qty<1||x.qty>10000
    ||!(x.price===null||(typeof x.price==='number'&&Number.isFinite(x.price)&&x.price>=0&&x.price<=10000000))
    ||!['manual','catalogo','pendiente'].includes(x.priceSource)
    ||(x.spec!==undefined&&!root.PanelBudgetSpec.validSpec(x.spec))
    ||(x.genericAttributes!==undefined&&(typeof x.genericAttributes!=='string'||x.genericAttributes.length>500))
    ||(x.sourceUrl!==undefined&&(typeof x.sourceUrl!=='string'||x.sourceUrl.length>1000))
    ||(x.priceAsOf!==undefined&&(typeof x.priceAsOf!=='string'||x.priceAsOf.length>30)))return false;
  ids.add(x.id);
 }
 return true;
}
function ensure(a){if(!a.quickBudget)a.quickBudget={lines:[],discount:0,nextId:1};return a.quickBudget;}
function add(a,x){
 const b=ensure(a);
 if(b.lines.length>=2000)return false;
 const brand=String(x.brand||'').trim().slice(0,80);
 const ref=String(x.ref||'').trim().slice(0,100);
 const kind=String(x.kind||'aparato');
 const qty=Number(x.qty);
 if(!brand||!ref||!Object.hasOwn(types,kind)||!Number.isInteger(qty)||qty<1||qty>10000)return false;
 const catalog=root.PanelCommercial?.get(brand,ref);
 const tariff=root.PanelTariffLocal?.lookup(brand,ref);
 const description=(String(x.description||'').trim()||catalog?.descripcion||tariff?.descripcion_tarifa||'').slice(0,240);
 if(!description)return false;
 const raw=String(x.price||'').trim();
 let price=null,priceSource='pendiente';
 if(raw!==''){
  const n=Number(raw.replace(',','.'));
  if(!Number.isFinite(n)||n<0||n>10000000)return false;
  price=round(n);priceSource='manual';
 }else if(catalog?.iva_base==='sin_iva_confirmado'
           &&typeof catalog.pvp_sin_iva_eur==='number'&&Number.isFinite(catalog.pvp_sin_iva_eur)){
  price=round(catalog.pvp_sin_iva_eur);priceSource='catalogo';
 }
 b.lines.push({id:'q'+b.nextId++,kind,brand,ref,description,qty,price,priceSource,
  sourceUrl:priceSource==='catalogo'?safeSourceUrl(catalog?.url_oficial):'',
  priceAsOf:priceSource==='catalogo'?String(catalog?.fecha_consulta||''):''});
 return true;
}
function addGeneric(a,x){
 const b=ensure(a),kind=String(x.kind||'otro');
 const description=String(x.description||'').trim();
 const genericAttributes=String(x.genericAttributes||'').trim();
 const qty=Number(x.qty);
 if(b.lines.length>=2000||!Object.hasOwn(types,kind)||!description||description.length>240
   ||genericAttributes.length>500||!Number.isInteger(qty)||qty<1||qty>10000)return false;
 b.lines.push({id:'q'+b.nextId++,kind,brand:'Genérico',ref:'',description,qty,
  price:null,priceSource:'pendiente',sourceUrl:'',priceAsOf:'',genericAttributes});
 return true;
}
function change(a,id,field,raw){
 const b=a.quickBudget,x=b?.lines?.find(v=>v.id===id);
 if(!x)return false;
 if(field==='qty'){
  const n=Number(raw);if(!Number.isInteger(n)||n<1||n>10000)return false;
  x.qty=n;if(x.spec)x.spec.qty=n;return true;
 }
 if(field==='price'){
  const s=String(raw).trim();
  if(s===''){x.price=null;x.priceSource='pendiente';x.sourceUrl='';x.priceAsOf='';return true;}
  const n=Number(s.replace(',','.'));
  if(!Number.isFinite(n)||n<0||n>10000000)return false;
  x.price=round(n);x.priceSource='manual';x.sourceUrl='';x.priceAsOf='';return true;
 }
 if(field==='genericAttributes'&&x.genericAttributes!==undefined){
  const val=String(raw).trim();if(val.length>500)return false;
  x.genericAttributes=val;return true;
 }
 if(field==='description'){
  const val=String(raw).trim();
  if(!val||val.length>240)return false;
  x.description=val;return true;
 }
 return false;
}
function remove(a,id){const b=a.quickBudget;if(!b)return false;const n=b.lines.length;b.lines=b.lines.filter(x=>x.id!==id);return b.lines.length<n;}
function setDiscount(a,raw){
 const n=Number(String(raw).replace(',','.'));
 if(!Number.isFinite(n)||n<0||n>100)return false;
 ensure(a).discount=round(n);return true;
}
function totals(a){
 const b=get(a),priced=b.lines.filter(x=>x.price!==null);
 const subtotal=round(priced.reduce((s,x)=>s+round(x.price*x.qty),0));
 const discountValue=round(subtotal*b.discount/100);
 return {subtotal,discountValue,total:round(subtotal-discountValue),
  priced:priced.length,pending:b.lines.length-priced.length,discount:b.discount,
  count:b.lines.length};
}
function render(a,esc,compareId='',brandFilter=''){
 const b=get(a),t=totals(a);
 const isV12=typeof document!=='undefined'&&!!document.body?.classList?.contains('ux-v012');
 const opts=(arr)=>arr.map(([v,l])=>'<option value="'+esc(v)+'">'+esc(l)+'</option>').join('');
 const list=b.lines.map(x=>{
  const subt=x.price===null?'Pendiente':money(round(x.price*x.qty));
  const status=x.priceSource==='catalogo'?'PVP catálogo de '+(x.priceAsOf||'fecha desconocida')+' · vigencia pendiente'+(safeSourceUrl(x.sourceUrl)?'':' · enlace de ficha no verificable'):x.priceSource==='manual'?'Precio indicado por usuario · sin IVA':'Sin precio fiable · excluido del total';
  const safeLink=x.priceSource==='catalogo'?safeSourceUrl(x.sourceUrl):'';
  const link=safeLink?'<a href="'+esc(safeLink)+'" target="_blank" rel="noopener noreferrer">Ficha ↗</a>':'';
  const tariffLabel=x.ref?root.PanelTariffLocal?.label(x.brand,x.ref)||'':'';
  return '<tr data-quote-row="'+esc(x.id)+'"><td>'+esc(types[x.kind])+'</td><td>'+esc(x.brand)+'<small>'+esc(x.ref)+'</small></td>'
   +'<td><input aria-label="Descripción de '+esc(x.ref||x.id)+'" data-quote-id="'+esc(x.id)+'" data-quote-field="description" maxlength="240" value="'+esc(x.description)+'" />'
   +(x.genericAttributes!==undefined?'<input aria-label="Propiedades declaradas '+esc(x.id)+'" data-quote-id="'+esc(x.id)+'" data-quote-field="genericAttributes" maxlength="500" value="'+esc(x.genericAttributes)+'" placeholder="Propiedades y características" />':'')+'</td>'
   +'<td><input aria-label="Cantidad de '+esc(x.ref)+'" data-quote-id="'+esc(x.id)+'" data-quote-field="qty" type="number" min="1" max="10000" step="1" value="'+esc(x.qty)+'" /></td>'
   +'<td><input aria-label="Precio sin IVA de '+esc(x.ref)+'" data-quote-id="'+esc(x.id)+'" data-quote-field="price" type="number" min="0" max="10000000" step="0.01" value="'+(x.price===null?'':esc(x.price))+'" /></td>'
   +'<td><strong>'+esc(subt)+'</strong><small>'+esc(status)+' '+link+'</small>'+tariffLabel+'</td>'
   +'<td>'+(x.spec?'<button type="button" class="button small" data-spec-cross="'+esc(x.id)+'">'+(x.ref?'Cambiar candidata':'Cruzar marcas')+'</button> ':'')+'<button type="button" class="button tiny" data-quote-remove="'+esc(x.id)+'" aria-label="Eliminar '+esc(x.ref||x.description)+'">✕</button></td></tr>'
   +(x.spec&&compareId===x.id?'<tr class="pb12-match-expanded"><td colspan="7">'+root.PanelBudgetSpec.compareExisting(a,x.id,brandFilter)+'</td></tr>':'');
 }).join('');
 return '<div class="work-card quick-budget" data-quick-budget><div class="card-header"><div><strong>Lista de materiales · sin dibujar unifilar</strong>'
  +'<small>Define aparatos y cantidades por características. La referencia comercial se elige después.</small></div><button type="button" class="button small" data-quote-export="true" '+(!t.count?'disabled':'')+'>↓ Presupuesto CSV</button></div>'
  +'<div class="card-body">'+(isV12?'':(root.PanelTariffLocal?.form()||''))+root.PanelBudgetSpec.form()
  +'<details class="pb12-generic-other"><summary>＋ Añadir otra familia genérica (envolvente, maniobra, control, medida, accesorios…)</summary>'
  +'<p class="tiny-hint">Estos elementos pueden registrarse por descripción y propiedades, pero NO tienen todavía un cruce automático seguro por referencias. Sin precio ni equivalencia asignados.</p>'
  +'<form id="genericMaterialForm" class="quote-entry-form">'
  +'<label>Familia<select name="kind">'+opts(Object.entries(types))+'</select></label>'
  +'<label>Descripción / función<input name="description" required maxlength="240" placeholder="Ej.: Contactor modular 4P" /></label>'
  +'<label>Características declaradas<input name="genericAttributes" maxlength="500" placeholder="Bobina, polos, contacto, tensión, categoría…" /></label>'
  +'<label>Cantidad<input name="qty" type="number" min="1" max="10000" value="1" required /></label>'
  +'<button type="submit" class="button primary">Guardar material genérico</button></form></details>'
  +(isV12?'<details class="pb12-tariff-advanced"><summary>Tarifas privadas · opcional</summary>'+(root.PanelTariffLocal?.form()||'')+'</details>':'')
  +'<details class="quote-by-reference" data-quote-by-reference><summary>¿Ya conoces la referencia? Añadir directamente por código comercial</summary>'
  +'<form id="quickBudgetForm" class="quote-entry-form">'
  +'<label>Tipo<select name="kind">'+opts(Object.entries(types))+'</select></label>'
  +'<label>Marca<select name="brand">'+opts(brands.map(x=>[x,x]))+'</select></label>'
  +'<label>Referencia<input name="ref" required maxlength="100" placeholder="Ej. 004820" autocomplete="off" /></label>'
  +'<label>Descripción (opcional si existe en catálogo)<input name="description" maxlength="240" placeholder="Aparato, envolvente, accesorio…" /></label>'
  +'<label>Cantidad<input name="qty" type="number" required min="1" max="10000" step="1" value="1" /></label>'
  +'<label>PVP €/ud. sin IVA (opcional)<input name="price" type="number" min="0" max="10000000" step="0.01" placeholder="Del catálogo o introducir" /></label>'
  +'<button class="button primary" type="submit">＋ Añadir por referencia</button></form>'
  +'<p class="tiny-hint">Usa la referencia exacta para accesorios, envolventes o equipos que ya conozcas. PVP sin IVA solo cuando esté confirmado o sea introducido por el usuario. La compatibilidad del montaje no se valida.</p></details>'
  +(list?'<div class="table-wrap"><table class="materials-table quote-table"><thead><tr><th>Tipo</th><th>Marca / Ref.</th><th>Descripción</th><th>Ud.</th><th>€/ud. sin IVA</th><th>Importe</th><th></th></tr></thead><tbody>'+list+'</tbody></table></div>'
    :'<div class="quote-empty">Todavía no hay materiales en este presupuesto. Puedes empezar por la envolvente o por cualquier referencia.</div>')
  +'<div class="quote-summary"><label>Descuento global (%)<input id="quickBudgetDiscount" type="number" min="0" max="100" step="0.01" value="'+esc(b.discount)+'" /></label>'
  +'<div><span>Subtotal con precio</span><strong>'+esc(money(t.subtotal))+'</strong></div>'
  +'<div><span>Descuento aplicado</span><strong>− '+esc(money(t.discountValue))+'</strong></div>'
  +'<div class="quote-total"><span>Estimación sin IVA</span><strong>'+esc(money(t.total))+'</strong></div></div>'
  +(t.pending?'<p class="quote-warning">⚠ '+t.pending+' referencia(s) sin precio excluida(s) del total.</p>':'')
  +'<p class="tiny-hint">Estimación de materiales, sin impuestos, portes, montaje ni verificación técnica. El descuento se aplica únicamente a partidas con precio sin IVA documentado o introducido.</p>'
  +'</div></div>';
}
function csv(a){
 const b=get(a),t=totals(a),cols=['Tipo','Marca','Referencia','Descripción','Cantidad','PVP ud sin IVA EUR',
 'Descuento %','Total línea sin IVA EUR','Fuente precio','Fecha captura','URL fuente','Observaciones'];
 const data=b.lines.map(x=>{
  const net=x.price===null?'':round(round(x.price*x.qty)*(1-t.discount/100)).toFixed(2);
  return [types[x.kind],x.brand,x.ref,x.description,x.qty,x.price===null?'':x.price.toFixed(2),
   t.discount,net,x.priceSource,x.priceAsOf||'',x.sourceUrl||'',
   'Propiedades declaradas: '+(x.genericAttributes||'')+' · Presupuesto provisional; no acredita equivalencia ni compatibilidad constructiva'];
 });
 data.push(['TOTAL ESTIMADO SIN IVA','','','Solo partidas con precio',t.priced,'',t.discount,t.total.toFixed(2),'','','','Partidas sin precio: '+t.pending]);
 const cell=root.PanelMaterialCSV?.cell||((v)=>'"'+String(v??'').replace(/"/g,'""')+'"');
 return '\ufeff'+[cols,...data].map(r=>r.map(cell).join(';')).join('\r\n')+'\r\n';
}
root.PanelQuickBudget=Object.freeze({types,brands,get,valid,add,addGeneric,change,remove,setDiscount,totals,render,csv});
})(window);
