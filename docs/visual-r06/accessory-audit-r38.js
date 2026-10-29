/* PanelBuilder R38. PUBLIC individual SKU evidence; NOT loaded by index.html.
 * A manufacturer's accessory listing is not an assembly approval. Conflicting
 * data stays unresolved: never convert 56/57M into an assigned DIN footprint.
 * No pricing, private tariffs, automatic layout or electrical substitution.
 */
(function (root) {
  'use strict';
  const checkedOn = '2026-10-22';
  const rows = [
    {
      brand: 'Hager', ref: 'KDN363B', kind: 'fork_busbar', poles: 3,
      currentA: 63, conductorSectionMm2: 10, lengthMm: 1000,
      catalogSpanModules: 57, technicalSpanModules: 57,
      verifiedSpanModules: 57, occupiedDinModules: null,
      widthMm: null, heightMm: null, depthMm: null,
      source: 'https://hager.com/es/catalogo/producto/kdn363b-puente-de-horquilla-3p-10mm2-63a-57m',
      evidence: 'Hager individual KDN363B: 3P, 10 mm², 63 A, 1000 mm, 57 modules in title and characteristics.'
    },
    {
      brand: 'Hager', ref: 'KDN463B', kind: 'fork_busbar', poles: 4,
      currentA: 63, conductorSectionMm2: 10, lengthMm: 1000,
      catalogSpanModules: 56, technicalSpanModules: 57,
      verifiedSpanModules: null, occupiedDinModules: null,
      widthMm: null, heightMm: null, depthMm: null,
      source: 'https://hager.com/es/catalogo/producto/kdn463b-puente-de-horquilla-4p-10mm2-63a-56m',
      evidence: 'Hager KDN463B: title/description say 56M; individual technical table says 57M. Conflict unresolved.'
    },
    {
      brand: 'Hager', ref: 'KZN024', kind: 'busbar_end_cap', poles: null,
      currentA: null, conductorSectionMm2: null, lengthMm: null,
      catalogSpanModules: null, technicalSpanModules: null,
      verifiedSpanModules: null, occupiedDinModules: null,
      widthMm: null, heightMm: null, depthMm: null,
      source: 'https://hager.com/es/catalogo/producto/kzn024-tapa-lateral-para-kdn463b',
      evidence: 'Individual Hager KZN024 expressly specifies lateral end cap for KDN463B; no confirmed outer dimensions.'
    }
  ];
  const freeze = (o) => Object.freeze(o);
  const facts = freeze(rows.map(r => freeze({
    ...r, checkedOn, sourceType: 'official_manufacturer_sku',
    installationApproved: false, electricalCompatibilityApproved: false,
    mountingDimensionsApproved: false
  })));
  const key = (b,r) => String(b) + '\u001f' + String(r);
  const byKey = new Map(facts.map(f => [key(f.brand,f.ref),f]));
  if (byKey.size !== facts.length) throw Error('Duplicated R38 SKU');
  const relations = freeze([
    freeze({
      brand: 'Hager', parentRef: 'KDN363B', accessoryRef: 'KZN023',
      relation: 'listed_end_cap',
      source: 'https://hager.com/es/catalogo/producto/kdn363b-puente-de-horquilla-3p-10mm2-63a-57m'
    }),
    freeze({
      brand: 'Hager', parentRef: 'KDN463B', accessoryRef: 'KZN024',
      relation: 'listed_end_cap',
      source: 'https://hager.com/es/catalogo/producto/kdn463b-puente-de-horquilla-4p-10mm2-63a-56m'
    })
  ]);
  function get(brand, ref) { return byKey.get(key(brand,ref)) || null; }
  function coverage(brand, ref) {
    const x = get(brand,ref);
    if (!x || x.kind !== 'fork_busbar') return null;
    const conflict = x.catalogSpanModules !== x.technicalSpanModules;
    return freeze({
      brand:x.brand, ref:x.ref,
      catalogSpanModules:x.catalogSpanModules,
      technicalSpanModules:x.technicalSpanModules,
      confirmedSpanModules:conflict ? null : x.verifiedSpanModules,
      sourceConflict:conflict,
      occupiedDinModules:null,
      usableReserveMm:null,
      outcome:conflict ? 'CONFLICTO_DOCUMENTAL' : 'COBERTURA_LONGITUDINAL_DOCUMENTADA',
      source:x.source,
      note:'Number of modules describes longitudinal busbar coverage, not a DIN-mounted device footprint.'
    });
  }
  function capListing(brand, busbarRef, capRef, legacy) {
    const x = get(brand,busbarRef) ||
      (legacy && typeof legacy.getAccessory === 'function' ? legacy.getAccessory(brand,busbarRef) : null);
    if (!x || x.kind !== 'fork_busbar') return freeze({
      status:'REFERENCIA_NO_ACREDITADA', listingFound:false, approvedInstallation:false, source:null
    });
    const matching = relations.find(l => l.brand===brand && l.parentRef===busbarRef && l.accessoryRef===capRef) ||
      (legacy && typeof legacy.getListing === 'function' ? legacy.getListing(brand,busbarRef,brand,capRef) : null);
    return freeze({
      status:matching ? 'ASOCIACION_PUBLICADA_POR_FABRICANTE' : 'ASOCIACION_NO_LOCALIZADA',
      listingFound:!!matching,
      approvedInstallation:false,
      source:matching?.source || null,
      note:'Listing does not certify assembled installation; absence is not proof of incompatibility.'
    });
  }
  function audit(request, legacy) {
    const brand=String(request?.brand || ''), ref=String(request?.ref || '');
    const x=get(brand,ref) ||
      (legacy && typeof legacy.getAccessory==='function' ? legacy.getAccessory(brand,ref) : null);
    const messages=[];
    if (!x) messages.push('SKU_NO_DOCUMENTADO');
    else {
      if (x.kind === 'fork_busbar') {
        messages.push('LONGITUD_PEINE_NO_EQUIVALE_A_OCUPACION_DIN');
        if (coverage(brand,ref)?.sourceConflict) messages.push('COBERTURA_CONFLICTIVA');
        if (!Number.isFinite(x.widthMm)||!Number.isFinite(x.heightMm)||!Number.isFinite(x.depthMm))
          messages.push('GEOMETRIA_EXTERIOR_INCOMPLETA');
        if (request?.capRef) {
          if (!capListing(brand,ref,String(request.capRef),legacy).listingFound)
            messages.push('TAPA_SIN_ASOCIACION_DOCUMENTADA');
        } else messages.push('TAPA_NO_ESPECIFICADA');
      } else messages.push('REFERENCIA_NO_ES_PEINE');
    }
    return freeze({
      brand,ref,found:!!x,
      severity:messages.includes('COBERTURA_CONFLICTIVA')?'revision_documental':
        (!x?'no_documentado':'informativo'),
      codes:freeze(messages),
      canAutofit:false, canPrice:false, canCertify:false,
      finalDinWidthMm:null, doorClearanceMm:null, busbarCutLengthMm:null
    });
  }
  root.PanelAccessoryAuditR38 = freeze({
    all:()=>facts.slice(), relations:()=>relations.slice(), get, coverage, capListing, audit
  });
})(window);
