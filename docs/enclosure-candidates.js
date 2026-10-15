/* Coincidencias documentales de capacidad, NUNCA validación de compatibilidad. */
(function(root){
'use strict';
function candidates(a){
 const rows=Number(a.rows)||0,slots=Number(a.slots)||0;
 if(!rows||!slots)return [];
 return root.PanelCommercial.search('','','envolvente').filter(x=>
  Number(x.atributos?.filas)>=rows&&Number(x.atributos?.modulos_fila)>=slots
 ).sort((x,y)=>{
  const sx=Number(x.atributos.filas)*Number(x.atributos.modulos_fila);
  const sy=Number(y.atributos.filas)*Number(y.atributos.modulos_fila);
  return sx-sy||x.fabricante.localeCompare(y.fabricante)||x.referencia.localeCompare(y.referencia);
 });
}
function render(a,escape){
 const has=Number(a.rows)>0&&Number(a.slots)>0,items=candidates(a),list=items.slice(0,8);
 return '<section class="enclosure-shortlist" data-enclosure-shortlist="true"><div class="enclosure-shortlist-head"><strong>Envolventes comerciales · búsqueda por capacidad</strong><small>'+escape(String(items.length))+' referencia(s) con filas/módulos suficientes en esta muestra</small></div>'+
 (!has?'<p>Primero calcula una distribución DIN para comparar capacidades.</p>':
 !items.length?'<p>No encontramos referencias en la muestra actual con la capacidad solicitada. Esto NO significa que no existan en catálogo.</p>':
 '<div class="enclosure-shortlist-grid">'+list.map(x=>{
 const at=x.atributos,capacity=at.filas*at.modulos_fila,price=x.pvp_sin_iva_eur!==null?x.pvp_sin_iva_eur.toLocaleString('es-ES',{style:'currency',currency:'EUR'})+' sin IVA':x.precio_publicado_eur!==null?x.precio_publicado_eur.toLocaleString('es-ES',{style:'currency',currency:'EUR'})+' · IVA sin confirmar':'Precio pendiente';
 return '<article class="enclosure-candidate" data-enclosure-ref="'+escape(x.referencia)+'"><strong>'+escape(x.fabricante)+' · '+escape(x.referencia)+'</strong><span>'+escape(x.descripcion)+'</span><small>'+escape(at.filas+' filas × '+at.modulos_fila+' M = '+capacity+' M')+' · '+escape(at.montaje||'montaje por confirmar')+'</small><small>'+escape(price)+'</small><a target="_blank" rel="noopener noreferrer" href="'+escape(x.url_oficial)+'">Consultar ficha oficial ↗</a></article>';
 }).join('')+'</div>')+
 '<p class="small-text"><strong>Filtro únicamente modular.</strong> No se ha asociado ni seleccionado ninguna envolvente. Comprobar dimensiones interiores y profundidad útiles, IP/IK, intensidad, carriles/tapas, térmica, bornas, accesorios, espacio para cables y montaje según fabricante. Precio y vigencia no garantizados.</p></section>';
}
root.PanelEnclosureCandidates=Object.freeze({candidates,render});
})(window);
