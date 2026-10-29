/* PanelBuilder R33 · Evidencia de seccionamiento neutro / contactos POR SKU.
 * Archivo PUBLICO solo con fuentes primarias. No incluir tarifas ni precios.
 * "Acoplamiento neutro: SI" no permite inferir neutro seccionado ni número
 * de contactos abiertos; usar null hasta obtener esquema inequívoco. */
(function(root){'use strict';
const evidence=Object.freeze([
 Object.freeze({
  brand:'Legrand',ref:'403586',designation:'1P+N',neutralCoupled:true,
  neutralIsolated:null,switchedPoles:null,contactDiagramVerified:false,
  source:'https://www.legrand.es/es/productos/magnetotermico-tx3-1pn-230v-16a-curva-2-modulos-403586',
  basis:'Ficha individual: acoplamiento de conductor neutro Sí; 2 polos totales; 1 polo protegido. Sin esquema de contactos individuales confirmado.'
 }),
 Object.freeze({
  brand:'Hager',ref:'MN916V',designation:'1P+N',neutralCoupled:null,
  neutralIsolated:null,switchedPoles:null,contactDiagramVerified:false,
  source:'https://assets.hager.com/step-content/P/PDS_158311212101ES/Document/std.lang.all/PDS_MN916V_2101_es-ES.pdf',
  basis:'Ficha oficial MN916V de dos páginas, revisión completa: tipo 1P+N e Icn a 230 V, pero no esquema de contactos o declaración expresa de N seccionado.'
 }),
 Object.freeze({
  brand:'Hager',ref:'MN516V',designation:'1P+N',neutralCoupled:null,
  neutralIsolated:null,switchedPoles:null,contactDiagramVerified:false,
  source:'https://hager.com/es/catalogo/producto/mn516v-int-aut-serie-mn-1p-n-16a-curva-c-6ka',
  basis:'Página de producto consultada: denomina 1P+N; el esquema de apertura del neutro por referencia sigue pendiente.'
 }),
 Object.freeze({
  brand:'Hager',ref:'CDA440M',designation:'3P+N',neutralCoupled:null,
  neutralIsolated:null,switchedPoles:null,contactDiagramVerified:false,
  source:'https://hager.com/es/catalogo/producto/cda440m-diferencial-4p-40a-30ma-tipo-a',
  basis:'Ficha comercial: 4 polos y designación 3P+N. No proporciona evidencia independiente de polos efectivamente abiertos.'
 }),
 Object.freeze({
  brand:'Schneider',ref:'A9F79116',designation:'1P',neutralCoupled:null,
  neutralIsolated:null,switchedPoles:null,contactDiagramVerified:false,
  source:'https://www.se.com/es/es/product/A9F79116/',
  basis:'Página producto Acti9 iC60N 1P 16 A curva C, sin diagrama individual de apertura de contactos en el contenido consultado.'
 })
]);
const map=new Map(evidence.map(x=>[x.brand+'|'+x.ref,x]));
if(map.size!==evidence.length)throw Error('SKU duplicado en evidencias R33');
const get=(brand,ref)=>map.get(String(brand)+'|'+String(ref))||null;
function display(record){
 const d=get(record.fabricante,record.referencia);
 const designation=String(d?.designation||record.atributos?.polos||'');
 const includesNeutral=designation.includes('+N');
 if(d?.neutralCoupled===true){
  return 'Acoplamiento del conductor neutro: sí (fabricante). Neutro efectivamente seccionado: POR VERIFICAR; contactos conmutados: POR VERIFICAR.';
 }
 if(includesNeutral)return 'Designación '+designation+': no acredita por sí sola la apertura del neutro. Neutro seccionado y contactos conmutados: POR VERIFICAR.';
 return 'Número de contactos efectivamente conmutados: POR VERIFICAR mediante esquema individual.';
}
root.PanelSwitchingEvidenceR33=Object.freeze({get,all:()=>evidence.slice(),display});
})(window);