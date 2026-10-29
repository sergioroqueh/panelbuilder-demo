/* PanelBuilder R41 | Provisional manufacturer evidence and missing proof.
 * ISOLATED: not loaded by index.html. No installation approval or automated cutting.
 * Public source references only: NO PVP/private tariffs, commercial prices or contract data.
 */
(function (root) {
  'use strict';
  const frozen = Object.freeze;
  const sources = frozen([
    frozen({id:'HAGER-ES-KDN463B',brand:'Hager',ref:'KDN463B',scope:'sku_product_page',medium:'html',
      url:'https://hager.com/es/catalogo/producto/kdn463b-puente-de-horquilla-4p-10mm2-63a-56m',
      assertion:'Product title says 56 modules; technical table says 57; actual revision-specific coverage unresolved.',
      inspection:'html_text',documentDate:null}),
    frozen({id:'HAGER-UK-KDN463B',brand:'Hager',ref:'KDN463B',scope:'sku_datasheet',medium:'pdf',
      url:'https://assets.hager.com/step-content/P/PDS_156495582001EN/Document/std.lang.all/PDS_KDN463B_2001_en-GB.pdf',
      assertion:'Individual datasheet KDN463B gives 57 modules. Document visual screenshot unavailable.',
      inspection:'pdf_text_screenshot_unavailable',documentDate:'2026-03-03'}),
    frozen({id:'HAGER-ES-KZN024',brand:'Hager',ref:'KZN024',scope:'exact_accessory_to_busbar',medium:'html',
      relatedRef:'KDN463B',url:'https://hager.com/es/catalogo/producto/kzn024-tapa-lateral-para-kdn463b',
      assertion:'Individual end-cap is expressly described for KDN463B.',inspection:'html_text',documentDate:null}),
    frozen({id:'HAGER-ES-KF84A',brand:'Hager',ref:'KF84A',scope:'sku_capacity_claim',medium:'html',
      url:'https://hager.com/es/catalogo/producto/kf84a-borne-de-conexion-horquilla-lat-2x25mm2',
      assertion:'Title 2x25 mm2, separate technical limits rigid 25 and flexible 16 mm2; number of simultaneously permissible wires unconfirmed.',
      inspection:'html_text',documentDate:null}),
    frozen({id:'HAGER-UK-KF84A',brand:'Hager',ref:'KF84A',scope:'sku_capacity_claim',medium:'pdf',
      url:'https://assets.hager.com/step-content/P/PDS_160038850000EN/Document/std.lang.all/PDS_KF84A_0000_en-GB.pdf',
      assertion:'Individual UK datasheet calls KF84A 1 cable 25mm2; does not approve dual-wire arrangement.',
      inspection:'pdf_text_screenshot_unavailable',documentDate:'2026-03-14'}),
    frozen({id:'HAGER-MY-KF84A',brand:'Hager',ref:'KF84A',scope:'sku_capacity_claim',medium:'pdf',
      url:'https://assets.hager.com/step-content/P/PDS_160038856401EN/Document/std.lang.all/KF84A_6401_en-GB.pdf',
      assertion:'Individual MY datasheet calls KF84A 1 cable 25mm2; indexed dates differ from PDF extracted date.',
      inspection:'pdf_text_screenshot_unavailable',documentDate:'2026-05-04'}),
    frozen({id:'HAGER-PT-KZ059',brand:'Hager',ref:'KZ059',scope:'sku_accessory_function',medium:'html',
      url:'https://hager.com/pt/catalogo/produto/kz059-perfil-de-protec-p-pente-de-ligacao-5m',
      assertion:'KZ059 protection profile is described as 5-module product, without a cut plan for KDN463B.',
      inspection:'html_text',documentDate:null}),
    frozen({id:'HAGER-AU-ONEKONEKT',brand:'Hager',ref:null,scope:'other_market_system_guidance',medium:'html',
      url:'https://hager.com/au/solutions-for-your-project/product-and-installation-solutions/onekonekt',
      assertion:'In onekonekt assemblies, unused fork contacts may remain and be shielded by suitable protective caps. NOT KDN463B-specific installation instructions.',
      inspection:'html_text',documentDate:null}),
    frozen({id:'HAGER-ES-CAT-2023',brand:'Hager',ref:'KDN463B',scope:'historic_catalog_listing',medium:'pdf',
      url:'https://assets1.sc.hager.com/spain/document/tarifa_923_web.pdf',
      assertion:'Hager 2023 tariff/catalogue lists KDN463B as 56 modules, KZN024 separately as its end cap and KZ059 for reserve teeth.',
      inspection:'indexed_pdf_text_no_visual',documentDate:'2023'})
  ]);
  const uniqueSources = new Set(sources.map(s=>s.id));
  if(uniqueSources.size!==sources.length) throw Error('R41 duplicate evidence ids');
  const exactly=(x,r)=>!!x && typeof x==='object' && x.brand==='Hager' && x.ref===r;
  const rule=(id,label,status,ids,requiredForApproval,notes)=>frozen({
    id,label,status,evidenceIds:frozen(ids.slice()),requiredForApproval,notes
  });
  function assess(config) {
    const q=config&&typeof config==='object' ? config : {};
    const known=exactly(q.busbar,'KDN463B');
    const isCap=exactly(q.endCap,'KZN024');
    const isFeed=exactly(q.feedTerminal,'KF84A');
    const isCover=exactly(q.spareCover,'KZ059');
    const rows = [];
    if(known) {
      rows.push(rule('busbar_identity','Reference identity','documented_listing', ['HAGER-ES-KDN463B','HAGER-UK-KDN463B'],false,'Exact catalogue SKU, not individual lot or revision.'));
      rows.push(rule('module_span','Catalog coverage','conflicting_sources',['HAGER-ES-KDN463B','HAGER-UK-KDN463B','HAGER-ES-CAT-2023'],true,'56/57 contradictory; no approved value.'));
      rows.push(rule('cutting','Cutting and exposed conductor treatment','missing_exact_installation_instruction',[],true,'Require exact revision-specific cutting instructions; no calculated cut length.'));
      rows.push(rule('end_cap','Terminal/end cover',isCap?'documented_exact_accessory':'not_documented_for_configuration',isCap?['HAGER-ES-KZN024']:[],true,'Listing does not validate installed width, quantity or finishing of cut.'));
      rows.push(rule('feed_terminal','Feed terminal',isFeed?'family_application_documented':'not_documented_for_configuration',isFeed?['HAGER-ES-KF84A','HAGER-UK-KF84A','HAGER-MY-KF84A']:[],true,'Multiple markets disagree in title on 1x25 / 2x25; no approved conductor count.'));
      rows.push(rule('unused_forks','Protection for unused forks',isCover?'documented_function_only':'not_documented_for_configuration',isCover?['HAGER-PT-KZ059','HAGER-AU-ONEKONEKT']:[],true,'Five nominal module profile is not a KDN463B cut length, assembled IP2X is not certified.'));
      rows.push(rule('device_busbar','Device connection and order','needs_exact_assembly_diagram',[],true,'Check exact MCB/RCCB/RCBO SKUs, terminations, phase and neutral pattern, and temperature.'));
      rows.push(rule('cabinet','Cabinet and door clearances','needs_installed_geometry',[],true,'External component dimensions are insufficient to confirm door/channel clearance.'));
    } else {
      rows.push(rule('busbar_identity','Reference identity','no_case_file',[],true,'No R41 evidence for this exact brand and busbar SKU.'));
    }
    const missing=rows.filter(x=>x.requiredForApproval).map(x=>x.id);
    const byId=new Map(sources.map(x=>[x.id,x]));
    const listed=[...new Set(rows.flatMap(x=>x.evidenceIds))].map(id=>byId.get(id));
    return frozen({
      status:known?'PARTIAL_EVIDENCE_NOT_INSTALLATION_APPROVAL':'NO_CASE_FILE',
      busbar:frozen({brand:String(q.busbar?.brand||''),ref:String(q.busbar?.ref||'')}),
      checks:frozen(rows),evidence:frozen(listed),blockingTopics:frozen(missing),
      documentedNominalReserveCoverModules:isCover&&known?5:null,
      approvedSpanModules:null,approvedWireCount:null,approvedTerminalTorqueNm:null,
      approvedCutLengthMm:null,approvedCoverCutLengthMm:null,confirmedInstallationClearanceMm:null,
      allowedCurrentForAssemblyA:null,assemblyCompatibility:null,
      canAutoCut:false,canAutoPlace:false,canAutoPurchase:false,canCertify:false,
      disclaimer:'All evidence is informative. SKU identity, cuts, wire count and assembly compliance require current manufacturer instructions and competent validation.'
    });
  }
  root.PanelInstallationGateR41=frozen({
    assess, sources:()=>sources.slice(),
    forSku:(brand,ref)=>sources.filter(s=>s.brand===brand&&s.ref===ref),
    checkedOn:'2026-10-22'
  });
})(window);
