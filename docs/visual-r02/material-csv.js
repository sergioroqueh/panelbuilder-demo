/* Exportación reproducible, sin cantidades comerciales inventadas.
   CSV Excel (;) UTF-8 BOM, escapado contra inyección de fórmulas de hoja de cálculo. */
(function(root){
'use strict';
const cols=[
 'Tipo línea','Identificador','Descripción','Cantidad','Ud.','Características',
 'Referencia aplicada (PRELIMINAR)','Fabricante aplicado','Candidata documental NO VALIDADA',
 'PVP fabricante sin IVA EUR','Precio publicado IVA sin confirmar EUR',
 'Vigencia tarifa','Fuente PVP / ficha','Estado de precio','Advertencias técnicas'
];
function cell(value){
 let s=value===null||value===undefined?'':String(value);
 // No permitir que una etiqueta editable se convierta en una fórmula al abrir Excel.
 if(/^[\s\u0000-\u001f]*[=+\-@]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
function fmt(n){return typeof n==='number'&&Number.isFinite(n)?n.toFixed(2).replace('.',','):'';}
function sourceFor(record){
 return record?.url_oficial||'';
}
function monetary(record,tariff){
 if(tariff&&root.PanelPricebook.valid(tariff))
  return {net:fmt(tariff.pvp_sin_iva_eur),unknown:'',vigencia:tariff.fecha_vigencia,
    source:tariff.fuente_url,state:'PVP fabricante documentado sin IVA; confirmar vigencia actual'};
 if(record?.pvp_sin_iva_eur!==null&&record?.pvp_sin_iva_eur!==undefined)
  return {net:fmt(record.pvp_sin_iva_eur),unknown:'',vigencia:record.fecha_vigencia||'',source:sourceFor(record),
    state:'PVP fabricante recomendado sin IVA; vigencia sin acreditar'};
 if(record?.precio_publicado_eur!==null&&record?.precio_publicado_eur!==undefined)
  return {net:'',unknown:fmt(record.precio_publicado_eur),vigencia:'',source:sourceFor(record),
    state:'PRECIO DOCUMENTAL: base de IVA no confirmada. No utilizar como PVP neto'};
 return {net:'',unknown:'',vigencia:'',source:sourceFor(record),state:'PVP pendiente'};
}
function build(a,brand,matchFn){
 const lines=[];
 const push=entry=>lines.push(cols.map((_,i)=>entry[i]??''));
 const short='Uso preliminar; verificar documentación, compatibilidad y normativa. No constituye lista validada para compra/fabricación.';
 for(const d of a.devices||[]){
  const match=typeof matchFn==='function'?matchFn(d):null;
  const applied=match?.ref||'';
  const record=applied&&brand!=='Generico'?root.PanelCommercial.get(brand,applied):null;
  const tariff=applied&&brand!=='Generico'?root.PanelPricebook.find(brand,applied):null;
  const candidate=root.PanelApparatusCandidates.getSelection(a,d);
  const price=monetary(record,tariff);
  const altCandidate=candidate?.selection;
  const spec=(d.poles||'?')+' · '+(d.amp||'?')+' A · '+d.modules+' M ('+(d.moduleSource==='catalog'?'referencia parcial':'estimado')+')';
  push(['APARATO',d.label,d.name,1,'ud',spec,applied,applied?brand:'',
    altCandidate?(altCandidate.fabricante+' '+altCandidate.referencia):'',
    price.net,price.unknown,price.vigencia,price.source,
    applied?price.state:'Sin PVP neto aplicado; referencia genérica o candidata',
    short+(candidate?' Candidata comercial independiente sin aplicar.':'')]);
 }
 const enc=root.PanelEnclosureCandidates.getSelection(a);
 if(enc?.selection){
  const e=enc.selection,p=monetary(enc.record,null);
  push(['ENVOLVENTE',e.referencia,enc.record?.descripcion||'Referencia sin ficha',1,'ud','Capacidad por filas/módulos sin validar',
    '', '',e.fabricante+' '+e.referencia,'','',p.vigencia,p.source,'CANDIDATA, no incluida como PVP neto aplicado',
    'Revisar cotas interiores, espacio, IP/IK, accesorios y fijación. '+p.state]);
 }
 for(const b of root.PanelBusbars.all(a)){
  push(['BARRA PREVISTA',b.label,'Barra '+b.kind,1,'ud','Sin referencia comercial',
    '','','','','','','','PVP pendiente',short]);
 }
 for(const c of root.PanelCircuits.all(a)){
  const count=root.PanelCircuits.terminalRows(c).length;
  if(!count)continue;
  push(['BORNAS ESTIMADAS',c.code,'Bornas del circuito '+(c.destination||'sin destino'),count,'posiciones',
    'Configuración, regleta y calibre pendientes de verificar','','','','','','','','PVP pendiente',
    'Cantidad de posiciones orientativa; NO equivale a unidades comerciales seleccionadas.']);
 }
 const rows=[cols,...lines].map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
 return {csv:'\ufeff'+rows,count:lines.length,applied:(a.devices||[]).filter(d=>typeof matchFn==='function'&&!!matchFn(d)).length};
}
root.PanelMaterialCSV=Object.freeze({columns:cols,cell,monetary,build});
})(window);
