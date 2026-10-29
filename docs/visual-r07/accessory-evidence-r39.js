/* PanelBuilder R39 — Registro documental de afirmaciones por SKU, SOLO LECTURA.
 * No se carga en index.html. No certifica montajes, equivalencias, cortes,
 * distancias, bornas ni cubiertas. Sin precios/tarifas privadas.
 * Fecha de investigación: 2026-10-22. Fechas de documento ≠ fecha de consulta.
 */
(function(root) {
  'use strict';
  const freeze = x => Object.freeze(x);
  const claims = freeze([
    freeze({
      id:'ES-CAT-2025',brand:'Hager',ref:'KDN463B',attribute:'coverageModules',value:56,
      sourceType:'manufacturer_catalog_pdf',documentDate:'2025',inspection:'indexed_text_only',
      source:'https://assets.sc.hager.com/es/-/media/project/hagerdeep/spain/hager/spain/downloads_es/documentaciones_es/tarifas/tarifa_926_2025.pdf?hash=9ACD036A6A3194713DEA01BA6AEA09DB&la=es-es',
      scope:'Catálogo de puentes, fila exacta KDN463B; precio no registrado. PDF grande: sin captura visual validada.'
    }),
    freeze({
      id:'ES-PAGE-TITLE',brand:'Hager',ref:'KDN463B',attribute:'coverageModules',value:56,
      sourceType:'manufacturer_product_page_title',documentDate:null,inspection:'html_text',
      source:'https://hager.com/es/catalogo/producto/kdn463b-puente-de-horquilla-4p-10mm2-63a-56m',
      scope:'Título español KDN463B 4P 63 A 10 mm², 56 M.'
    }),
    freeze({
      id:'ES-PAGE-TABLE',brand:'Hager',ref:'KDN463B',attribute:'coverageModules',value:57,
      sourceType:'manufacturer_product_page_technical_table',documentDate:null,inspection:'html_text',
      source:'https://hager.com/es/catalogo/producto/kdn463b-puente-de-horquilla-4p-10mm2-63a-56m',
      scope:'Tabla técnica española «Número de módulos 57», contradice su propio título.'
    }),
    freeze({
      id:'EN-PDF-20260303',brand:'Hager',ref:'KDN463B',attribute:'coverageModules',value:57,
      sourceType:'manufacturer_sku_pdf',documentDate:'2026-03-03',inspection:'pdf_text_only_screenshot_failed',
      source:'https://assets.hager.com/step-content/P/PDS_156495580000EN/Document/std.lang.all/PDS_KDN463B_0000_en-GB.pdf',
      scope:'Ficha individual KDN463B, página 1, 57M y longitud 1000 mm; captura gráfica no disponible.'
    }),
    freeze({
      id:'MY-PDF-20260403',brand:'Hager',ref:'KDN463B',attribute:'coverageModules',value:57,
      sourceType:'manufacturer_sku_pdf',documentDate:'2026-04-03',inspection:'pdf_text_only_screenshot_failed',
      source:'https://assets.hager.com/step-content/P/PDS_156495586401EN/Document/std.lang.all/PDS_KDN463B_6401_en-GB.pdf',
      scope:'Ficha individual KDN463B, página 1, 57M; texto consultado sin captura gráfica.'
    }),
    freeze({
      id:'MY-PAGE',brand:'Hager',ref:'KDN463B',attribute:'coverageModules',value:57,
      sourceType:'manufacturer_product_page_title',documentDate:null,inspection:'html_text',
      source:'https://hager.com/my/catalogue/products/kdn463b-insulated-busbar-4p-fork-10mm2-57m',
      scope:'Mismo SKU KDN463B, EAN 3250613740979, página Malaysia 57M; no demuestra revisión física.'
    })
  ]);
  const connector = freeze({
    brand:'Hager',ref:'KF84A',kind:'fork_feed_terminal',
    type:'screw',ratedCurrentA:80,
    flexibleConductorMaxMm2:16,rigidConductorMaxMm2:25,
    declaredDesignation:'Borne de conexión con horquilla lateral 2x25 mm²',
    source:'https://hager.com/es/catalogo/producto/kf84a-borne-de-conexion-horquilla-lat-2x25mm2',
    dateChecked:'2026-10-22',
    sourceType:'manufacturer_individual_product_page',
    dimensionsMm:null,approvedWithKDN463B:null,
    approvedInstallation:false,
    note:'Título 2x25 mm² y ficha rígido 25 / flexible 16 mm². Son descriptores distintos; no inferir número de conductores admisibles, pares, compatibilidad ni certificación de conexión.'
  });
  const relation = freeze({
    brand:'Hager',deviceRef:'NCN463A',busbarRef:'KDN463B',
    relation:'busbar_listed_on_device_product_page',
    source:'https://hager.com/es/catalogo/producto/ncn463a-automatico-ncn-4p-63a-c-10-15ka',
    assemblyApproved:false,
    note:'Lista fabricante «Completa tu sistema»; no justifica corte, corriente de conjunto, tipo de borne ni combinación real del cuadro.'
  });
  const key = (b,r,a) => String(b)+'\u001f'+String(r)+'\u001f'+String(a);
  const indexed = new Map();
  for (const c of claims) {
    const k=key(c.brand,c.ref,c.attribute);
    if(!indexed.has(k)) indexed.set(k,[]);
    indexed.get(k).push(c);
  }
  if(new Set(claims.map(c=>c.id)).size!==claims.length)throw Error('R39 source ID duplicated');
  for (const [k,items] of indexed) indexed.set(k,freeze(items.slice()));
  const raw = (brand,ref,attribute) => (indexed.get(key(brand,ref,attribute))||[]).slice();
  function review(brand,ref,attribute='coverageModules') {
    const items=raw(brand,ref,attribute);
    const vals=[...new Set(items.map(i=>i.value))].sort((a,b)=>a-b);
    const conflict=vals.length>1;
    return freeze({
      brand:String(brand),ref:String(ref),attribute:String(attribute),
      values:freeze(vals),
      evidenceCount:items.length,
      evidence:freeze(items),
      conflict,
      status:items.length===0?'SIN_EVIDENCIA':conflict?'CONFLICTO_DOCUMENTAL':'UNICO_VALOR_DOCUMENTADO',
      approvedValue:null,
      isApproved:false,
      automaticResolutionForbidden:true,
      reason:'Conteo o fecha de documentos no sustituye verificación de revisión exacta del artículo, criterio de montaje ni confirmación del fabricante.'
    });
  }
  const eqRef=(x,brand,ref)=>!!x&&x.brand===brand&&x.ref===ref;
  function diagnose(query, prior) {
    const q=query&&typeof query==='object'?query:{};
    const b=q.busbar&&typeof q.busbar==='object'?q.busbar:{};
    const brand=String(b.brand||''),ref=String(b.ref||'');
    const supported=brand==='Hager'&&ref==='KDN463B';
    const reviewed=review(brand,ref);
    const flags=[];
    if(!supported) flags.push('SIN_EXPEDIENTE_DE_ESTA_REFERENCIA');
    if(supported&&reviewed.conflict) flags.push('COBERTURA_CONTRADICTORIA');
    if(supported) flags.push('LONGITUD_1000_MM_NO_APRUEBA_CORTE_NI_OCUPACION_DIN');
    let capAssociation='NO_ESPECIFICADA';
    if(q.endCap){
      capAssociation=eqRef(q.endCap,'Hager','KZN024')&&supported
        ?'TAPA_PUBLICADA_POR_FABRICANTE':'NO_LOCALIZADA';
      if(capAssociation==='NO_LOCALIZADA')flags.push('TAPA_SIN_ASOCIACION_REVISADA');
    } else if(supported) flags.push('FALTA_REFERENCIA_TAPA');
    let feedTerminal='NO_ESPECIFICADA';
    if(q.feedTerminal){
      feedTerminal=eqRef(q.feedTerminal,connector.brand,connector.ref)
        ?'FICHA_INDIVIDUAL_DISPONIBLE_SIN_ENLACE_DE_MONTAJE':'FICHA_NO_LOCALIZADA';
      flags.push('CONEXION_BORNA_PENDIENTE_DE_COMPATIBILIDAD');
    } else if(supported) flags.push('FALTA_REFERENCIA_BORNA_ALIMENTACION');
    let deviceListing='NO_ESPECIFICADO';
    if(q.device) {
      deviceListing=supported&&eqRef(q.device,'Hager','NCN463A')
        ?'LISTADO_EN_FICHA_DEL_AUTOMATICO':'LISTADO_NO_LOCALIZADO';
      if(deviceListing==='LISTADO_NO_LOCALIZADO') flags.push('APARATO_SIN_LISTADO_REVISADO');
    } else if(supported) flags.push('FALTA_REFERENCIA_APARATO');
    if(prior&&typeof prior.capListing==='function'&&supported&&q.endCap){
      const old=prior.capListing(brand,ref,String(q.endCap.ref||'')); 
      if(capAssociation==='TAPA_PUBLICADA_POR_FABRICANTE'&&!old.listingFound)
        flags.push('VERIFICAR_ENLACE_ENTRE_REGISTROS');
    }
    return freeze({
      busbar:freeze({brand,ref}),
      status:!supported?'SIN_EVIDENCIA_SUSTRATO':'REQUIERE_REVISION_DOCUMENTAL',
      verifiedCoverageModules:null,
      catalogEvidence:reviewed,
      capAssociation,feedTerminal,deviceListing,
      flags:freeze(flags),
      compatibleAssembly:null,
      canAutoPlace:false,canCutBusbar:false,canAssignDIN:false,
      canApplyPrice:false,canCertify:false,
      freeDoorDepthMm:null,remainingModules:null,cutLengthMm:null,
      requiredNextEvidence:freeze([
        'Documento o respuesta fabricante con SKU KDN463B y revisión inequívoca que aclare 56M/57M',
        'Instrucciones de corte y tapado aplicables al peine y tapa exactos',
        'Condiciones de montaje eléctrico y mecánico para conjunto peine-borna-aparato-envolvente'
      ])
    });
  }
  function getConnector(brand,ref) {
    return brand===connector.brand&&ref===connector.ref ? connector : null;
  }
  function linkedDevice(brand,deviceRef,busbarRef) {
    return brand===relation.brand&&deviceRef===relation.deviceRef&&busbarRef===relation.busbarRef ? relation:null;
  }
  root.PanelAccessoryEvidenceR39=freeze({
    allClaims:()=>claims.slice(),claimsFor:raw,review,diagnose,getConnector,linkedDevice,
    checkedOn:'2026-10-22'
  });
})(window);
