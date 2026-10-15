/* Visor de catálogo documental. Sin selección automática ni precios inferidos. */
(function(root){
'use strict';
let text='',brand='',category='',limit=45;
const C=()=>root.PanelCommercial;
const escape=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const brands=[['','Todos los fabricantes'],['Schneider','Schneider Electric'],['Legrand','Legrand'],['Hager','Hager'],['ABB','ABB'],['Siemens','Siemens']];
const categories=[['','Todas las familias'],['magnetotermico','Magnetotérmicos'],['diferencial','Diferenciales/RCBO'],['contactor','Contactores'],['repartidor','Repartidores'],['peine','Peines'],['borna','Bornas y barras'],['accesorio','Accesorios'],['sobretensiones','Sobretensiones (SPD)'],['guardamotor','Guardamotores'],['caja_moldeada','Interruptores caja moldeada'],['seccionador','Seccionadores'],['envolvente','Envolventes']];
function option([key,label],selected){return `<option value="${escape(key)}" ${key===selected?'selected':''}>${escape(label)}</option>`;}
function matching(){return C().search(text,brand,category);}
function rows(items){
 return items.slice(0,limit).map(o=>{
  const pvp=o.precio_publicado_eur===null?'<span class="badge amber">Precio pendiente</span>':
   o.iva_base==='sin_iva_confirmado'?`<strong class="catalog-price">${escape(C().priceLabel(o))}</strong><small class="catalog-price-note">Recomendado · vigencia no publicada</small>`:
   `<strong class="catalog-price">${escape(C().priceLabel(o))}</strong><small class="catalog-price-note">Importe publicado · no presupuestar como neto</small>`;
  const attrs=Object.entries(o.atributos||{}).map(([k,v])=>k.replaceAll('_',' ')+': '+v).join(' · ');
  const src=o.fuente_tipo==='listado_oficial'?'Listado oficial':
   o.fuente_tipo==='faq_oficial'?'FAQ oficial (códigos)':
   o.fuente_tipo==='hipotesis_por_patron'?'FAQ de familia (NO confirma referencia)':'Ficha oficial';
  const status=o.procedencia_referencia?
   '<small class="catalog-record-status" data-ic60n-status="'+escape(o.estado_comercial)+'">'+
   escape(o.estado_comercial==='descatalogado'?'DESCATALOGADA':
    o.estado_comercial==='gama_no_comercializada'?'GAMA RETIRADA EN ESPAÑA':
    o.procedencia_referencia==='patron_sin_verificar'?'REFERENCIA SIN VERIFICAR':
    o.admision_comparador?'Ficha individual · revisión de montaje pendiente':
    'Código en FAQ · falta ficha individual')+'</small>':'';

  const relations=root.PanelAccessoryLinks.get(o.fabricante,o.referencia);
  const related=relations.length?`<div class="commercial-inline-relations" data-commercial-links="${escape(o.referencia)}">
   <strong class="commercial-inline-title">${relations.length} vínculo(s) documentado(s)</strong>
   <div class="commercial-inline-links">
    <p>Asociaciones indicadas por el fabricante; NO se ha validado el conjunto. Sin selección automática.</p>
    ${relations.map(link=>{
      const incoming=link.accesorio===o.referencia;
      const peer=C().get(link.fabricante,incoming?link.origen:link.accesorio);
      if(!peer)return '';
      return `<div class="commercial-inline-link" data-related-peer="${escape(peer.referencia)}">
        <strong>${escape(peer.referencia)}</strong><small>${escape(peer.descripcion)}</small>
        <small>${incoming?'Accesorio utilizado por':'Accesorio relacionado'} · ${link.ambito==='modelo'?'Referencia específica':'Familia'}</small>
        <small>${escape(link.nota)}</small>
        <a class="small-link" target="_blank" rel="noopener noreferrer" href="${escape(link.fuente)}">Ficha con evidencia ↗</a></div>`;
    }).join('')}
   </div></div>`:
   '<small>Sin relaciones estudiadas</small>';
  return `<tr data-commercial-ref="${escape(o.referencia)}" data-commercial-brand="${escape(o.fabricante)}">
   <td><strong>${escape(o.referencia)}</strong><small>${escape(o.fabricante)}</small>${status}</td>
   <td><strong>${escape(o.descripcion)}</strong><small>${escape(o.categoria)}</small><small class="catalog-attrs" title="${escape(attrs)}">${escape(attrs)}</small></td>
   <td>${pvp}<small>${escape(o.fecha_consulta)} · ES</small></td>
   <td><span class="badge amber">Montaje pendiente</span>${related}<small>Prohibida la asociación automática</small></td>
   <td><a class="small-link" target="_blank" rel="noopener noreferrer" href="${escape(o.url_oficial)}" aria-label="Abrir fuente oficial ${escape(o.fabricante+' '+o.referencia)}">${src} ↗</a></td>
  </tr>`;
 }).join('');
}
function countSummary(items){
 const s=C().stats(items);
 return `<strong>${s.total} resultados</strong> · ${s.iva_confirmado} PVP sin IVA confirmados · ${s.iva_pendiente} importes con IVA pendiente · ${s.sin_precio} sin precio · mostrando ${Math.min(limit,items.length)}`;
}
function render(){
 const total=C().stats(),items=matching();
 return `<div class="work-card commercial-catalog-work"><div class="view-heading">Biblioteca comercial documentada · multimarca</div>
 <div class="card-body">
 <div class="commercial-intro"><p><strong>${total.total} referencias de fabricante</strong> · Schneider ${total.brand.Schneider||0} · Legrand ${total.brand.Legrand||0} · Hager ${total.brand.Hager||0} · ABB ${total.brand.ABB||0} · Siemens ${total.brand.Siemens||0}</p>
 <div class="commercial-coverage" data-commercial-coverage="true"><strong>Cobertura documental actual · no equivale a compatibilidad técnica</strong><span>Envolventes: ${total.category.envolvente||0} · Magnetotérmicos: ${total.category.magnetotermico||0} · Diferenciales/RCBO: ${total.category.diferencial||0} · SPD: ${total.category.sobretensiones||0} · Contactores: ${total.category.contactor||0}</span><small>Próximos lotes prioritarios: MCB 1P+N de 1 y 2 módulos, diferenciales A/F/B según aplicación, RCBO, sobretensiones TT/TN y envolventes de 2–4 filas con fichas dimensionales.</small></div>
 <p>Datos de fichas/listados oficiales consultados el ${C().fecha_captura}. Los ${total.iva_confirmado} importes con base confirmada son <b>precios recomendados sin IVA</b>; los ${total.iva_pendiente} importes restantes publicados no tienen la base de IVA confirmada. La fecha de entrada en vigor de las tarifas <b>no se ha acreditado</b>.</p>
 <p><strong>Acti9 iC60N:</strong> matriz de 90 combinaciones teóricas B/C, con procedencia y estado por referencia. Las fichas sin verificar, gamas retiradas y descatalogadas NO son candidatas comerciales. La existencia de un código en la FAQ no garantiza stock ni vigencia. Sin IVA confirmado, ningún precio Schneider es PVP neto.</p>
 <p><strong>Ninguna referencia está habilitada como recomendación de compatibilidad.</strong> Para peines/repartidores necesitamos comprobar familia y borne del aparato, número de polos, paso, corriente, sección, accesorios y documento de combinación. Envolventes: dimensiones interiores y accesorios pendientes.</p></div>
 <div class="commercial-filters">
 <label>Buscar por referencia, descripción o dato <input type="search" data-commercial-search="1" placeholder="Ej. contactor 25A, 004840, peine tetrapolar…" value="${escape(text)}" autocomplete="off"></label>
 <label>Fabricante <select data-commercial-brand-filter="1">${brands.map(x=>option(x,brand)).join('')}</select></label>
 <label>Familia <select data-commercial-category-filter="1">${categories.map(x=>option(x,category)).join('')}</select></label>
 </div>
 <div class="commercial-count" id="commercialCount">${countSummary(items)}</div>
 <div class="table-wrap commercial-table"><table class="materials-table"><thead><tr><th>Referencia</th><th>Descripción y características</th><th>Precio publicado</th><th>Validación técnica</th><th>Fuente</th></tr></thead><tbody id="commercialRows">${rows(items)||'<tr><td colspan="5">Sin coincidencias para estos filtros.</td></tr>'}</tbody></table></div>
 <div class="commercial-more" id="commercialMore">${items.length>limit?'<button type="button" class="button" data-action="commercialMore">Mostrar más referencias</button>':''}</div>
 <div class="node-caption"><strong>Alcance:</strong> primera muestra documental; no es el catálogo completo de los tres fabricantes. No confundir un precio observado en web con una tarifa vigente comprobada ni un producto localizado con una compatibilidad confirmada. Las fichas comerciales originales son la autoridad ante cualquier discrepancia.</div>
 </div></div>`;
}
function refresh(){
 const target=document.getElementById('commercialRows');if(!target)return;
 const items=matching();target.innerHTML=rows(items)||'<tr><td colspan="5">Sin coincidencias.</td></tr>';
 document.getElementById('commercialCount').innerHTML=countSummary(items);
 document.getElementById('commercialMore').innerHTML=items.length>limit?'<button type="button" class="button" data-action="commercialMore">Mostrar más referencias</button>':'';
}
function update(e){
 if(e.target.matches('[data-commercial-search]')){text=e.target.value;limit=45;refresh();return true;}
 if(e.target.matches('[data-commercial-brand-filter]')){brand=e.target.value;limit=45;refresh();return true;}
 if(e.target.matches('[data-commercial-category-filter]')){category=e.target.value;limit=45;refresh();return true;}
 return false;
}
function more(){limit+=60;refresh();}
root.PanelCommercialUI=Object.freeze({render,refresh,update,more});
})(window);