/* PanelBuilder: comprobación limitada de GEOMETRÍA comercial confirmada por usuario.
 * No constituye validación eléctrica, térmica, normativa ni de stock.
 * No modifica nunca las propiedades de un dispositivo genérico.
 */
(function(root){
'use strict';
const STATUS='dimension_confirmada_usuario';
const SOURCE='catalogo_documental';
function valid(a){
 const map=a?.physicalSelections;
 if(map===undefined)return true;
 if(!map||Array.isArray(map)||typeof map!=='object'||Object.keys(map).length>350)return false;
 const ids=new Set((a.devices||[]).map(d=>d.id));
 return Object.entries(map).every(([id,s])=>
   ids.has(id)&&s&&typeof s==='object'&&!Array.isArray(s)
   &&Object.keys(s).every(k=>['fabricante','referencia','estado','fuente'].includes(k))
   &&typeof s.fabricante==='string'&&s.fabricante.length<=80&&s.fabricante.length>0
   &&typeof s.referencia==='string'&&s.referencia.length<=80&&s.referencia.length>0
   &&s.estado===STATUS&&s.fuente===SOURCE);
}
function resolve(d,a,brand){
 const chosen=a?.physicalSelections?.[d.id];
 const doc=a?.apparatusCandidates?.[d.id];
 if(!chosen||chosen.fabricante!==brand||!doc||
   doc.fabricante!==brand||chosen.referencia!==doc.referencia||
   doc.estado!=='candidata_no_validada')return null;
 const item=root.PanelCommercial?.get(brand,chosen.referencia);
 if(!item||!root.PanelApparatusCandidates?.evaluate(d,item).eligible)return null;
 const at=item.atributos||{},proof=item.geometria_documental;
 const width=Number(at.ancho_mm),mod=Number(at.modulos);
 if(!proof||proof.estado!=='geometria_documentada_no_montaje_validado'||
   typeof proof.fuente!=='string'||!proof.fuente.startsWith('https://')||
   !Number.isFinite(width)||width<=0||!Number.isInteger(mod)||mod<1||mod>48||
   Math.ceil(width/18)!==mod||Math.abs(width-mod*18)>0.01||
   !(Number(at.alto_mm)>0&&Number(at.profundidad_mm)>0))return null;
 return {ref:item.referencia,name:item.descripcion,source:proof.fuente,
   widthMm:width,modules:mod,heightMm:Number(at.alto_mm),depthMm:Number(at.profundidad_mm),
   status:STATUS,reason:'Solo geometría de ficha aplicada por confirmación. Montaje y compatibilidades por comprobar.'};
}
function canApply(d,brand,ref){
 if(!d||!brand||!ref)return false;
 const a={devices:[d],apparatusCandidates:{
  [d.id]:{fabricante:brand,referencia:ref,estado:'candidata_no_validada',fuente:SOURCE}},
  physicalSelections:{[d.id]:{fabricante:brand,referencia:ref,estado:STATUS,fuente:SOURCE}}};
 return !!resolve(d,a,brand);
}
function set(a,id,brand,ref){
 const d=a?.devices?.find(x=>x.id===id);
 if(!d||!canApply(d,brand,ref))return false;
 // El acuerdo dimensional y la candidatura documental son dos hechos distintos.
 if(a.apparatusCandidates?.[id]?.fabricante!==brand||
    a.apparatusCandidates?.[id]?.referencia!==ref)return false;
 a.physicalSelections={...(a.physicalSelections||{}),
   [id]:{fabricante:brand,referencia:ref,estado:STATUS,fuente:SOURCE}};
 return true;
}
function clear(a,id){if(a.physicalSelections)delete a.physicalSelections[id];}
root.PanelCommercialPlacement=Object.freeze({STATUS,SOURCE,valid,resolve,canApply,set,clear});
})(window);
