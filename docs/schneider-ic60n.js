/* PanelBuilder · Acti9 iC60N ES · matriz documental, 15/10/2026.
 * No deducir disponibilidad de los controles del selector web.
 * La FAQ ES de Schneider acredita códigos C 6..63 A. Las referencias B sin ficha
 * individual se presentan como hipótesis por patrón, NO como producto validado.
 * 1P+N curva B: gama retirada, según FAQ del fabricante (últ. mod. 31/03/2025).
 * Ni precios con IVA desconocido ni Icu son PVP neto o Icn respectivamente.
 */
(function(root){
'use strict';
const FAQ='https://www.se.com/es/es/faqs/FAQ000234158/';
const currents=[6,10,16,20,25,32,40,50,63];
const family={
 B:{'1P':'A9F781','2P':'A9F782','3P':'A9F783','4P':'A9F784','1P+N':'A9F786'},
 C:{'1P':'A9F791','2P':'A9F792','3P':'A9F793','4P':'A9F794','1P+N':'A9F796'}
};
// Importe observado en ficha española el 15/10/2026 (base IVA NO indicada).
// SOLO hay importe cuando se consultó la ficha individual, no por analogía.
const individual=Object.freeze({
 A9F79106:64.96,A9F79110:58.45,A9F79163:187.09,
 A9F79206:141.33,A9F79210:128.84,A9F79216:131.17,
 A9F79220:132.59,A9F79225:137.80,A9F79232:146.01,
 A9F79240:182.87,A9F79250:351.05,A9F79263:375.24,
 A9F79310:190.41,A9F79332:215.76,
 A9F79410:265.45,A9F79463:803.44,
 A9F79606:124.43,A9F79610:114.25,A9F79640:167.61,A9F79663:351.45,
 A9F78110:70.85,A9F78125:75.81,
 A9F78210:152.27,A9F78216:155.25,A9F78220:159.89,
 A9F78225:162.74,A9F78240:219.02,
 A9F78332:257.85,A9F78350:663.13,A9F78363:696.24,
 A9F78406:354.63,A9F78410:333.25,A9F78425:356.44,
 A9F78450:913.81,A9F78463:968.88,
 A9F78610:135.47
});
const individualWithoutPrice=new Set(['A9F78250','A9F78263','A9F78632']);
const withdrawn=new Set(['A9F78250','A9F78263','A9F78632']);
// El encabezado español de A9F79210 tiene una errata: "66000 A/10 kA".
 // Se contrasta el mismo SKU en la web oficial internacional del fabricante,
 // que declara 6000 A IEC 60898-1 y 10 kA IEC 60947-2.
 // NUNCA se incorpora 66000 A como poder de corte.
/* Geometría verificada SOLO para este SKU, a partir de una ficha de datos
 * emitida por Schneider Electric el 25/09/2020, hospedada por distribuidor.
 * La geometría no certifica disponibilidad, conexión o montaje completo. */
const verifiedGeometry=Object.freeze({
 A9F79210:Object.freeze({
  ancho_mm:36,alto_mm:85,profundidad_mm:78.5,modulos:2,
  montaje:'carril_DIN',pasos_9_mm:4,
  bornes_rigido_max_mm2:25,bornes_flexible_max_mm2:16,
  pelado_mm:14,par_apriete_nm:2,
  fecha_ficha:'2020-09-25',
  url_fuente:'https://eriacomponentes.es/wp-content/uploads/2020/09/interruptor-automatico-magnetotermico-ic60n-2p-10a-curva-c.pdf',
  fabricante_documento:'Schneider Electric',
  estado:'geometria_documentada_no_montaje_validado'
 })
});
const sourceDiscrepancies=Object.freeze({
 A9F79210:Object.freeze({
  campo:'icn_60898_ka',
  valor_publicado_erroneo_a:66000,
  valor_normalizado_a:6000,
  nota:'Errata en el título Schneider España (66000 A). Confirmado: 6000 A IEC 60898-1; 10 kA IEC 60947-2.',
  fuente_original:'https://www.se.com/es/es/product/A9F79210/',
  fuente_contraste:'https://www.se.com/eg/en/product/A9F79210/'
 })
});
function reference(curve,poles,amp){
 return (family[curve]||{})[poles] && currents.includes(Number(amp))
   ?family[curve][poles]+String(amp).padStart(2,'0'):null;
}
function records(){
 const out=[];
 for(const curve of ['B','C'])for(const [poles,prefix] of Object.entries(family[curve]))
  for(const amp of currents){
   const ref=prefix+String(amp).padStart(2,'0');
   const verified=Object.prototype.hasOwnProperty.call(individual,ref)||individualWithoutPrice.has(ref);
   const retired=curve==='B'&&poles==='1P+N';
   const discontinued=withdrawn.has(ref);
   const price=Object.prototype.hasOwnProperty.call(individual,ref)?individual[ref]:null;
   const issue=sourceDiscrepancies[ref]||null;
   const geom=verifiedGeometry[ref]||null;
   // La FAQ lista expresamente las 45 refs de curva C; las B requieren prueba individual.
   const provenance=verified?'ficha_individual':curve==='C'?'faq_referencia':'patron_sin_verificar';
   const status=discontinued?'descatalogado':retired?'gama_no_comercializada':
     verified?'situacion_comercial_por_confirmar':curve==='C'?'situacion_comercial_por_confirmar':'referencia_por_confirmar';
   const source=verified?'https://www.se.com/es/es/product/'+ref+'/':FAQ;
   out.push({
     fabricante:'Schneider',categoria:'magnetotermico',referencia:ref,
     descripcion:'Acti9 iC60N MCB '+poles+' '+curve+amp+' · 6 kA Icn / 10 kA Icu (condiciones por comprobar)',
     atributos:{gama:'Acti9 iC60N',polos:poles,amp,curva:curve,
       icn_60898_ka:6,icu_60947_2_ka:10,
       polos_neutro_protegido:poles==='1P+N'?'fase protegida, N conmutado':'consultar esquema de polos',
       modulos:geom?geom.modulos:null,
       ...(geom?{ancho_mm:geom.ancho_mm,alto_mm:geom.alto_mm,
         profundidad_mm:geom.profundidad_mm,pasos_9_mm:geom.pasos_9_mm,
         montaje:geom.montaje,bornes_rigido_max_mm2:geom.bornes_rigido_max_mm2,
         bornes_flexible_max_mm2:geom.bornes_flexible_max_mm2,pelado_mm:geom.pelado_mm,
         par_apriete_nm:geom.par_apriete_nm}:{})},
     url_oficial:source,fuente_tipo:verified?'ficha_oficial':curve==='C'?'faq_oficial':'hipotesis_por_patron',
     procedencia_referencia:provenance,estado_comercial:status,
     incidencia_fuente:issue,
     geometria_documental:geom?{fuente:geom.url_fuente,fecha_ficha:geom.fecha_ficha,estado:geom.estado}:null,
     admision_comparador:verified&&!retired&&!discontinued,
     nota_validacion:discontinued?'Ficha declara fin de comercialización y ausencia de sustituto confirmado':
       retired?'Schneider indica que 1P+N curva B no se comercializa en España':
       !verified?'Falta comprobar individualmente ficha, disponibilidad y geometría':'Ficha localizada; disponibilidad actual, tensión y montaje pendientes',
     precio_publicado_eur:price,precio_contexto:price===null?null:'web_fabricante',
     iva_base:'no_especificado',pvp_sin_iva_eur:null,moneda:'EUR',unidad:'ud',
     fecha_consulta:'2026-10-15',fecha_vigencia:null,
     compatibilidad_automatica:false,estado_compatibilidad:'sin_validar'
   });
  }
 return out;
}
root.PanelSchneiderIC60N=Object.freeze({records,reference,FAQ,currents,sourceDiscrepancies,verifiedGeometry});
})(window);
