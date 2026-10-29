/* PanelBuilder R40 - public manufacturer evidence, isolated / read-only.
 * Not an installation design, no cuts, DIN placement, private tariffs or prices.
 */
(function(root){
'use strict';
const freeze=Object.freeze;
const facts=freeze([
 freeze({brand:'Hager',ref:'KDN463B',kind:'fork_busbar',lengthMm:1000,ratedCurrentA:63,
  poles:4,nominalCoverageModules:null,coverageClaims:freeze([56,57]),
  source:'https://hager.com/es/catalogo/producto/kdn463b-puente-de-horquilla-4p-10mm2-63a-56m',
  note:'Same SKU: Spanish title 56M, technical table 57M. No automatic coverage or cutting.'}),
 freeze({brand:'Hager',ref:'KF84A',kind:'fork_feed_terminal',ratedCurrentA:80,
  rigidMaxMm2:25,flexibleMaxMm2:16,conductorCountApproved:null,torqueNm:null,
  source:'https://hager.com/es/catalogo/producto/kf84a-borne-de-conexion-horquilla-lat-2x25mm2',
  note:'Current page 2x25 in title and rigid 25/flexible 16 technical fields; old Hager catalogue also lists 1x25. No assembled wiring certificate.'}),
 freeze({brand:'Hager',ref:'KZN024',kind:'end_cap',outerWidthMm:null,
  source:'https://hager.com/es/catalogo/producto/kzn024-tapa-lateral-para-kdn463b',
  note:'Individual end-cap listing for KDN463B; quantity and installed clearances unverified.'}),
 freeze({brand:'Hager',ref:'KZ059',kind:'spare_prong_cover',lengthForCutMm:null,
  source:'https://hager.com/es/catalogo/producto/kz059-perfil-protec-extremos-puentes-conexion',
  note:'Manufacturer identifies a protective profile for exposed spare contacts. No SKU-specific cutting schedule.'})
]);
const refs=freeze([
 freeze({id:'EN-CATALOG-FORK-FEED',subject:'KF84A',relation:'fork_busbar_family_feed',
  source:'https://assets1.sc.hager.com/exports/files/19en_imc_catafr_web_289_chapters_648-669.pdf',
  pageZeroBased:6,inspection:'pdf_visual_confirmed',
  statement:'Manufacturer fork busbar section names KDN463B and KF84A as lateral feed terminal; catalogue describes 1x25 mm2.'}),
 freeze({id:'PT-LEAFLET-FORK-FEED',subject:'KF84A',relation:'fork_busbar_family_feed',
  source:'https://assets.hager.com/step-content/P%2FHA_48130383%2FDocument%2Fstd.lang.all%2FHAGER_FOLHETO_RESIDENCIAL.pdf',
  pageZeroBased:3,inspection:'pdf_text_only_screenshot_failed',
  statement:'Portuguese Hager leaflet lists KDN463B and advises KF84A for incoming/outgoing cables.'}),
 freeze({id:'ES-2025-FEED-LABEL',subject:'KF84A',relation:'catalogue_capacity_label',
  source:'https://assets.sc.hager.com/es/-/media/project/hagerdeep/spain/hager/spain/downloads_es/documentaciones_es/tarifas/tarifa_926_2025.pdf?hash=9ACD036A6A3194713DEA01BA6AEA09DB&la=es-es',
  pageZeroBased:null,inspection:'indexed_text_only',
  statement:'Spanish Hager 2025 catalogue lists KF84A as 2x25 mm2 fork terminal; no number of admissible conductors approved.'}),
 freeze({id:'SKU-ENDCAP',subject:'KZN024',relation:'individual_endcap_for_KDN463B',
  source:'https://hager.com/es/catalogo/producto/kzn024-tapa-lateral-para-kdn463b',
  pageZeroBased:null,inspection:'official_product_html',
  statement:'Manufacturer specifically identifies KZN024 endcap for KDN463B.'}),
 freeze({id:'EN-CATALOG-SPARE-PRONGS',subject:'KZ059',relation:'spare_prong_protection',
  source:'https://assets1.sc.hager.com/exports/files/19en_imc_catafr_web_289_chapters_648-669.pdf',
  pageZeroBased:5,inspection:'pdf_text_and_page_not_individually_visual_checked',
  statement:'Hager catalogue says KZ059 protective strip for unused fork contacts, not an endcap.'}),
 freeze({id:'SKU-SPARE-PRONGS',subject:'KZ059',relation:'spare_prong_protection',
  source:'https://hager.com/es/catalogo/producto/kz059-perfil-protec-extremos-puentes-conexion',
  pageZeroBased:null,inspection:'official_product_html',
  statement:'Spanish Hager KZ059 product describes protection profile for busbar ends.'})
]);
const map=new Map(facts.map(x=>[x.brand+'\u001f'+x.ref,x]));
if(map.size!==facts.length||new Set(refs.map(x=>x.id)).size!==refs.length)throw Error('Duplicate R40 evidence');
const get=(brand,ref)=>map.get(String(brand)+'\u001f'+String(ref))||null;
const forSubject=ref=>refs.filter(x=>x.subject===ref);
function assess(request){
 const q=request&&typeof request==='object'?request:{};
 const id=(x)=>x&&typeof x==='object'&&x.brand==='Hager'&&typeof x.ref==='string'?x.ref:'';
 const busbar=id(q.busbar),terminal=id(q.terminal),endcap=id(q.endcap),cover=id(q.spareCover);
 const known=busbar==='KDN463B';
 const documentedTerminal=known&&terminal==='KF84A';
 const documentedEndcap=known&&endcap==='KZN024';
 const documentedCover=known&&cover==='KZ059';
 const codes=[];
 if(!known)codes.push('PEINE_SIN_EXPEDIENTE_R40');
 else {
  codes.push('COBERTURA_56_57_SIN_RESOLVER');
  codes.push('INSTRUCCION_CORTE_SKU_PENDIENTE');
  if(!terminal)codes.push('BORNA_ALIMENTACION_NO_SELECCIONADA');
  else if(documentedTerminal)codes.push('KF84A_ASOCIACION_FAMILIA_DOCUMENTADA_NO_MONTAJE');
  else codes.push('BORNA_SIN_ASOCIACION_DOCUMENTADA');
  if(documentedTerminal)codes.push('CAPACIDAD_KF84A_POR_TIPO_Y_CANTIDAD_PENDIENTE');
  if(!endcap)codes.push('TAPA_LATERAL_NO_SELECCIONADA');
  else if(documentedEndcap)codes.push('KZN024_IDENTIFICADA_SIN_COTAS_INSTALADAS');
  else codes.push('TAPA_LATERAL_SIN_ASOCIACION_DOCUMENTADA');
  if(!cover)codes.push('PROTECCION_CONTACTOS_RESERVA_NO_SELECCIONADA');
  else if(documentedCover)codes.push('KZ059_PERFIL_RESERVA_SIN_PLAN_DE_CORTE');
  else codes.push('PROTECCION_RESERVA_SIN_ASOCIACION_DOCUMENTADA');
 }
 return freeze({
  status:known?'DOCUMENTADO_PARCIAL_NO_APTO_PARA_MONTAJE_AUTOMATICO':'SIN_EXPEDIENTE',
  sku:freeze({brand:id(q.busbar)?'Hager':String(q.busbar?.brand||''),ref:String(q.busbar?.ref||'')}),
  terminalRelation:documentedTerminal?'FAMILIA_DOCUMENTADA':'NO_ACREDITADA',
  endcapRelation:documentedEndcap?'SKU_EXACTO_DOCUMENTADO':'NO_ACREDITADA',
  reserveProtection:documentedCover?'FUNCION_CATALOGO_DOCUMENTADA':'NO_ACREDITADA',
  issueCodes:freeze(codes), evidence:freeze(refs.slice()),
  approvedCoverageModules:null,allowedFeedConductorCount:null,approvedCutLengthMm:null,
  verifiedEndcapWidthMm:null,verifiedSpareCoverLengthMm:null,doorClearanceMm:null,
  assemblyApproved:false,canAutoPlace:false,canAutoCut:false,canAutoBuy:false,
  note:'Catalog association does not prove cut, connection quantity, torque, compatibility of assembled device or cabinet.'
 });
}
root.PanelAssemblyEvidenceR40=freeze({get,all:()=>facts.slice(),evidence:()=>refs.slice(),forSubject,assess});
})(window);
