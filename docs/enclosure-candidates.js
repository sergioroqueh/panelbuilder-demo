/* Candidatas comerciales DOCUMENTALES; no se verifica montaje ni normativa.
   La preselección comercial no altera el cuadro genérico ni sus dimensiones. */
(function(root){
'use strict';
const STATUS='candidata_no_validada',SOURCE='catalogo_documental';
function valid(sel){
 if(sel===undefined||sel===null)return true;
 if(!sel||typeof sel!=='object'||Array.isArray(sel))return false;
 if(Object.keys(sel).some(k=>!['fabricante','referencia','estado','fuente'].includes(k)))return false;
 return typeof sel.fabricante==='string'&&sel.fabricante.length>0&&sel.fabricante.length<=80
  &&typeof sel.referencia==='string'&&sel.referencia.length>0&&sel.referencia.length<=80
  &&sel.estado===STATUS&&sel.fuente===SOURCE;
}
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
function getSelection(a){
 if(!valid(a.enclosureSelection)||!a.enclosureSelection)return null;
 const sel=a.enclosureSelection,record=root.PanelCommercial.get(sel.fabricante,sel.referencia);
 const capacity=!!record&&Number(record.atributos?.filas)>=Number(a.rows)&&Number(record.atributos?.modulos_fila)>=Number(a.slots)
   &&Number(a.rows)>0&&Number(a.slots)>0;
 return {selection:sel,record,capacity};
}
function choose(a,brand,ref){
 if(!candidates(a).some(x=>x.fabricante===brand&&x.referencia===ref))return false;
 a.enclosureSelection={fabricante:brand,referencia:ref,estado:STATUS,fuente:SOURCE};
 return true;
}
function clear(a){delete a.enclosureSelection;}
function checks(a){
 const info=getSelection(a);
 if(!a.enclosureSelection)return [];
 if(!info)return ['Envolvente comercial: preselección guardada con datos incorrectos.'];
 if(!info.record)return ['Envolvente comercial: la referencia preseleccionada ya no figura en esta biblioteca.'];
 const errs=[];
 if(!info.capacity)errs.push('Envolvente comercial '+info.record.fabricante+' '+info.record.referencia+': capacidad modular INSUFICIENTE o distribución pendiente respecto al diseño actual.');
 if(a.layoutDirty)errs.push('Envolvente comercial: cambió la distribución desde la última propuesta; revisar la candidata.');
 errs.push('Envolvente comercial '+info.record.fabricante+' '+info.record.referencia+': SOLO PRESELECCIONADA. Sin verificar cotas interiores, profundidad, montaje, accesorios, espacio de cableado, temperatura, IP/IK ni conjunto normativo.');
 return errs;
}
function priceText(x){
 if(x.pvp_sin_iva_eur!==null&&x.pvp_sin_iva_eur!==undefined)
  return x.pvp_sin_iva_eur.toLocaleString('es-ES',{style:'currency',currency:'EUR'})+' · recomendado sin IVA, vigencia sin confirmar';
 if(x.precio_publicado_eur!==null&&x.precio_publicado_eur!==undefined)
  return x.precio_publicado_eur.toLocaleString('es-ES',{style:'currency',currency:'EUR'})+' · IVA sin confirmar, no presupuestar como neto';
 return 'Precio pendiente';
}
function summary(a,escape){
 const item=getSelection(a);
 if(!a.enclosureSelection)return '';
 if(!item)return '<p class="enclosure-selected-alert">Preselección comercial inválida: revisar el proyecto.</p>';
 const x=item.record;
 return '<div class="enclosure-selected" data-enclosure-selection="true"><div class="enclosure-selected-heading"><strong>Preselección comercial · NO VALIDADA</strong><button type="button" class="button small" data-enclosure-clear="true">Quitar preselección</button></div>'
 +(!x?'<p>La referencia '+escape(item.selection.fabricante)+' '+escape(item.selection.referencia)+' ya no está en el catálogo documental.</p>':
 '<p><strong>'+escape(x.fabricante)+' · '+escape(x.referencia)+'</strong> — '+escape(x.descripcion)+'</p>'
 +'<p class="small-text">'+(item.capacity?'Capacidad modular nominal suficiente para la propuesta actual.':'⚠ Capacidad modular insuficiente o pendiente para la propuesta actual.')+'</p>'
 +'<p class="small-text">'+escape(priceText(x))+' · <a href="'+escape(x.url_oficial)+'" target="_blank" rel="noopener noreferrer">Ficha del fabricante ↗</a></p>')
 +'<p class="small-text">La elección es reversible. No ha cambiado la geometría, los aparatos, la marca de las protecciones ni la lista de compra. El conjunto requiere revisión técnica.</p></div>';
}
function render(a,escape){
 const has=Number(a.rows)>0&&Number(a.slots)>0,items=candidates(a),list=items.slice(0,8);
 const info=getSelection(a);
 const selected=info?.selection;
 return '<section class="enclosure-shortlist" data-enclosure-shortlist="true"><div class="enclosure-shortlist-head"><strong>Envolventes comerciales · búsqueda por capacidad</strong><small>'+escape(String(items.length))+' referencia(s) con filas/módulos suficientes en esta muestra</small></div>'
 +summary(a,escape)+
 (!has?'<p>Primero calcula una distribución DIN para comparar capacidades.</p>':
 !items.length?'<p>No encontramos referencias en la muestra actual con la capacidad solicitada. Esto NO significa que no existan en catálogo.</p>':
 '<div class="enclosure-shortlist-grid">'+list.map(x=>{
 const at=x.atributos,capacity=at.filas*at.modulos_fila,active=selected?.fabricante===x.fabricante&&selected?.referencia===x.referencia;
 return '<article class="enclosure-candidate'+(active?' is-preselected':'')+'" data-enclosure-ref="'+escape(x.referencia)+'" data-enclosure-brand="'+escape(x.fabricante)+'"><strong>'+escape(x.fabricante)+' · '+escape(x.referencia)+'</strong><span>'+escape(x.descripcion)+'</span><small>'+escape(at.filas+' filas × '+at.modulos_fila+' M = '+capacity+' M')+' · '+escape(at.montaje||'montaje por confirmar')+'</small><small>'+escape(priceText(x))+'</small><a target="_blank" rel="noopener noreferrer" href="'+escape(x.url_oficial)+'">Consultar ficha oficial ↗</a><button type="button" class="button small" data-enclosure-pick="'+escape(x.referencia)+'" data-enclosure-pick-brand="'+escape(x.fabricante)+'" '+(active?'disabled aria-disabled="true"':'')+'>'+(active?'Candidata guardada':'Marcar como candidata')+'</button></article>';
 }).join('')+'</div>')+
 '<p class="small-text"><strong>Filtro únicamente modular.</strong> Una preselección NO es una asociación técnica validada ni una autorización de montaje. Verificar cotas interiores, profundidad, IP/IK, carriles, tapas, disipación, bornas, accesorios y requisitos normativos. Precios y vigencia no garantizados.</p></section>';
}
root.PanelEnclosureCandidates=Object.freeze({candidates,valid,choose,clear,getSelection,checks,summary,render});
})(window);
