/* PanelBuilder v0.11: PVP oficial, independiente de productos y de costes netos de compra. */
(function(root){
'use strict';
const records=[];
function valid(r){
 return !!r && r.tipo_precio==='PVP_FABRICANTE' && r.estado==='verificado' &&
 r.moneda==='EUR' && r.iva==='no_incluido' && r.unidad==='ud' &&
 typeof r.pvp_sin_iva_eur==='number' && Number.isFinite(r.pvp_sin_iva_eur) &&
 r.pvp_sin_iva_eur>=0 && typeof r.fabricante==='string' && r.fabricante.trim()!=='' &&
 typeof r.referencia==='string' && r.referencia.trim()!=='' &&
 typeof r.fuente_url==='string' && r.fuente_url.startsWith('https://') &&
 typeof r.fecha_consulta==='string' && r.fecha_consulta.length===10 &&
 typeof r.fecha_vigencia==='string' && r.fecha_vigencia.length===10;
}
function find(fabricante,referencia,fecha=new Date().toISOString().slice(0,10),tarifas=records){
 if(!fabricante||!referencia||!Array.isArray(tarifas))return null;
 const matches=tarifas.filter(r=>valid(r)&&r.fabricante===fabricante &&
 r.referencia===referencia&&r.fecha_vigencia<=fecha&&(!r.fecha_fin||fecha<=r.fecha_fin));
 matches.sort((a,b)=>b.fecha_vigencia.localeCompare(a.fecha_vigencia)||b.fecha_consulta.localeCompare(a.fecha_consulta));
 return matches[0]||null;
}
root.PanelPricebook=Object.freeze({records,valid,find});
})(window);