/* R30: evidencia eléctrica parcial por SKU exacto y tensión.
   Fichas individuales PÚBLICAS, sin precios de las tarifas privadas.
   No certifica adecuación, coordinación ni compatibilidad de montaje. */
(function(root){'use strict';
const entries=Object.freeze({
 'Legrand\u001f407668':Object.freeze({
  icnByVoltage:Object.freeze({'230':6}),
  source:'https://www.legrand.es/es/productos/magnetotermico-dx3-600010ka-1p-230400v-10a-curva-407668',
  basis:'Ficha Legrand: Icn EN 60898 a 230 V 6 kA; In 10 A, 1P, curva C.'
 }),
 'Hager\u001fNCN463A':Object.freeze({
  icnByVoltage:Object.freeze({'230':20,'400':10}),
  source:'https://hager.com/es/catalogo/producto/ncn463a-automatico-ncn-4p-63a-c-10-15ka',
  basis:'Ficha Hager: Icn IEC 60898-1 20 kA a 230 V y 10 kA a 400 V; Icu IEC 60947-2 15 kA a 400 V.'
 })
});
function get(b,ref){return entries[String(b)+'\u001f'+String(ref)]||null;}
function icnAt(record,voltage){
 if(!Number.isInteger(voltage)||![230,400].includes(voltage))return null;
 const x=get(record.fabricante,record.referencia);
 const value=x?.icnByVoltage[String(voltage)];
 if(typeof value==='number'&&Number.isFinite(value)&&value>0)return {ka:value,voltage,source:x.source,basis:x.basis};
 const a=record.atributos||{};
 if(record.fuente_tipo==='ficha_oficial'&&Number(a.icn_voltage_v)===voltage
   &&typeof a.icn_60898_ka==='number'&&Number.isFinite(a.icn_60898_ka)&&a.icn_60898_ka>0
   &&String(record.url_oficial||'').startsWith('https://'))
  return {ka:a.icn_60898_ka,voltage,source:record.url_oficial,basis:'Icn IEC 60898-1 y tensión indicados en ficha estructurada.'};
 return null;
}
root.PanelTechnicalEvidence=Object.freeze({get,icnAt});
})(window);
