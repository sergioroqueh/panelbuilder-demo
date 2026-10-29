/* PanelBuilder R31: dossiers técnicos públicos por referencia EXACTA.
   No contiene precios ni datos de las cuatro tarifas privadas. No inferir normas,
   Icn por tensión, tipo residual, retardos, número de polos o compatibilidades.
   Las dimensiones declaradas NO implican distribución DIN validada. */
(function(root){'use strict';
const mk=(fabricante,referencia,categoria,descripcion,atributos,url,icn={},notas='')=>Object.freeze({
 fabricante,referencia,categoria,descripcion,atributos:Object.freeze(atributos),
 url_oficial:url,fuente_tipo:'ficha_oficial',fecha_consulta:'2026-10-22',
 estado_comercial:'situacion_comercial_por_confirmar',
 compatibilidad_automatica:false,estado_compatibilidad:'sin_validar',
 __icnPorTension:Object.freeze(icn),__notas:notas
});
const docs=Object.freeze([
 mk('Legrand','403586','magnetotermico','TX³ MCB 1P+N 16 A curva C; 6 kA Icn IEC 60898-1 a 230 V',
   {polos:'1P+N',amp:16,curva:'C',icn_60898_ka:6,modulos:2,polos_totales:2,polos_protegidos:1},
   'https://www.legrand.es/es/productos/magnetotermico-tx3-1pn-230v-16a-curva-2-modulos-403586',
   {'230':6},'Icn 6 kA a 230 V; Icu 6 kA a 230 V es medida distinta.'),
 mk('Legrand','403620','magnetotermico','TX³ MCB 3P 40 A curva C; Icn 10 kA/230 V y 6 kA/400 V',
   {polos:'3P',amp:40,curva:'C',icn_60898_ka:6,modulos:3,polos_totales:3,polos_protegidos:3},
   'https://www.legrand.es/es/productos/magnetotermico-tx3-3p-400v-40a-curva-3-modulos-403620',
   {'230':10,'400':6},'IEC 60898-1; el mismo aparato ofrece poderes de corte distintos por tensión.'),
 mk('Legrand','403626','magnetotermico','TX³ MCB 4P 16 A curva C; Icn 10 kA/230 V y 6 kA/400 V',
   {polos:'4P',amp:16,curva:'C',icn_60898_ka:6,modulos:4,polos_totales:4,polos_protegidos:4},
   'https://www.legrand.es/productos/magnetotermico-tx3-4p-400v-16a-curva-4-modulos-403626',
   {'230':10,'400':6},'IEC 60898-1; comprobar configuración eléctrica real antes de usar valor a 230 V.'),
 mk('Hager','MN916V','magnetotermico','MN MCB 1P+N 16 A curva C; 6 kA IEC 60898-1 a 230 V · 1 módulo',
   {polos:'1P+N',amp:16,curva:'C',icn_60898_ka:6,modulos:1,ancho_mm:17.5},
   'https://hager.com/es/catalogo/producto/mn916v-int-aut-serie-mn-1p-n-16a-c-6ka',
   {'230':6},'Un módulo 17,5 mm; accesorio/peine y montaje sin validar.'),
 mk('Hager','MN516V','magnetotermico','MN MCB 1P+N 16 A curva C; 6 kA IEC 60898-1 a 230 V · 2 módulos',
   {polos:'1P+N',amp:16,curva:'C',icn_60898_ka:6,modulos:2,ancho_mm:35},
   'https://hager.com/es/catalogo/producto/mn516v-int-aut-serie-mn-1p-n-16a-curva-c-6ka',
   {'230':6},'Dos módulos 35 mm; la misma In/curva no implica igual espacio ni accesorios.'),
 mk('Schneider','A9F79116','magnetotermico','Acti9 iC60N MCB 1P 16 A curva C; 6 kA IEC 60898-1 (tensión Icn no precisada)',
   {polos:'1P',amp:16,curva:'C',icn_60898_ka:6},
   'https://www.se.com/es/es/product/A9F79116/',
   {},'Página individual declara 6000 A IEC 60898-1 / 10 kA IEC 60947-2 pero no tensión explícita asociada al Icn; no activar filtro 230/400 V sin evidencia.'),
 mk('Legrand','403036','diferencial','TX³ RCCB 2P 40 A 30 mA tipo A, sin retardo/selectividad',
   {tipo:'RCCB',polos:'2P',amp:40,idn_ma:30,tipo_rcd:'A',modulos:2,selectivo:false},
   'https://www.legrand.es/es/productos/diferencial-tx3-2p-230v-30ma-40a-tipo-403036'),
 mk('Hager','CDA440M','diferencial','RCCB CDA440M 40 A 30 mA tipo A; 4 polos totales, arquitectura 3P+N',
   {tipo:'RCCB',polos:'3P+N',polos_totales:4,amp:40,idn_ma:30,tipo_rcd:'A',modulos:4,inc_condicional_61008_ka:6},
   'https://hager.com/es/catalogo/producto/cda440m-diferencial-4p-40a-30ma-tipo-a',
   {},'El fabricante lo comercializa como 4P, pero la ficha técnica indica tipo de polo 3P+N; Inc EN 61008-1 NO es Icn IEC 60898-1.'),
 mk('Schneider','A9R61240','diferencial','Acti9 iID RCCB 2P 40 A 30 mA A-SI superinmunizado',
   {tipo:'RCCB',polos:'2P',amp:40,idn_ma:30,tipo_rcd:'A-SI'},
   'https://www.se.com/es/es/product/A9R61240/',
   {},'Tipo A-SI NO equivale a tipo A, tipo F o A selectivo; rearme ARA es accesorio separado.'),
 mk('Schneider','A9Z61440','diferencial','Acti9 iID RCCB 4P 40 A 30 mA tipo B-SI superinmunizado',
   {tipo:'RCCB',polos:'4P',amp:40,idn_ma:30,tipo_rcd:'B-SI'},
   'https://www.se.com/es/es/product/A9Z61440/',
   {},'Tipo B-SI NO equivale a B a efectos de identidad exacta ni a B-EV.'),
 mk('Schneider','A9R93240','diferencial','Acti9 iID K RCCB 2P 40 A 30 mA tipo A',
   {tipo:'RCCB',polos:'2P',amp:40,idn_ma:30,tipo_rcd:'A'},
   'https://www.se.com/es/es/product/A9R93240/',
   {},'No sustituye automáticamente A-SI; IEC 61008-1, no RCBO.')
]);
const key=(b,r)=>String(b)+'\u001f'+String(r);
const byKey=new Map(docs.map(d=>[key(d.fabricante,d.referencia),d]));
if(byKey.size!==docs.length)throw Error('SKU documental duplicado');
function list(brand='',category=''){return docs.filter(x=>(!brand||x.fabricante===brand)&&(!category||x.categoria===category));}
function merge(base,brand='',category=''){
 const out=new Map(base.map(x=>[key(x.fabricante,x.referencia),x]));
 for(const d of list(brand,category)){
  const id=key(d.fabricante,d.referencia),prev=out.get(id);
  // Preservar EXCLUSIVAMENTE importes ya existentes en biblioteca pública,
  // nunca importar ni autocalcular precios desde tarifas privadas.
  out.set(id,{...d,
   precio_publicado_eur:prev?.precio_publicado_eur??null,
   precio_contexto:prev?.precio_contexto??'no_documentado',
   iva_base:prev?.iva_base??'no_especificado',
   pvp_sin_iva_eur:prev?.pvp_sin_iva_eur??null,
   moneda:'EUR',unidad:'ud',
   __icnPorTension:d.__icnPorTension});
 }
 return [...out.values()];
}
function icnAt(record,voltage){
 const dossier=byKey.get(key(record.fabricante,record.referencia));
 if(!dossier||dossier.categoria!=='magnetotermico'||![230,400].includes(voltage))return null;
 const ka=dossier.__icnPorTension[String(voltage)];
 return typeof ka==='number'&&ka>0
  ?{ka,voltage,source:dossier.url_oficial,basis:'Icn IEC 60898-1 por referencia y tensión exactas, ficha fabricante.'}:null;
}
function get(brand,ref){return byKey.get(key(brand,ref))||null;}
root.PanelTechnicalDossiersR31=Object.freeze({all:()=>docs.slice(),list,get,merge,icnAt});
})(window);
