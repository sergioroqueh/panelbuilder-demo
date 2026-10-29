/* PanelBuilder R37 | Public manufacturer-SKU evidence; isolated / not loaded by index.html.
 * External geometry is NOT installed envelope clearance, electrical equivalence,
 * terminal suitability, busbar compatibility, or permission for automatic placement.
 * No tariffs, published prices or private-commercial data in this file.
 */
(function (root) {
  'use strict';
  const examinedOn = '2026-10-22';
  const devices = [
    {
      brand: 'Hager', ref: 'MCA216', kind: 'MCB', designation: '2P, 16 A, curva C',
      widthMm: 35, heightMm: 83, depthMm: 70, nominalDinModules: 2,
      mountingDepthMm: null, terminalTorqueUpperNm: 2.8, terminalTorqueLowerNm: 2.8,
      upperTerminalType: 'screw', lowerTerminalType: 'biconnect',
      electricalVariant: '2P', canUseAdditionalEquipment: null,
      source: 'https://hager.com/es/catalogo/producto/mca216-automatico-mca-2p-16a-c-6-10ka',
      evidence: 'Individual MCA216 HTML manufacturer product sheet: dimensions, modules, screw upper and biconnect lower terminals, 2.8 Nm.',
      caution: 'Official Hager SKU page and dated individual PDF agree: Icn IEC 60898-1 at 230 V is 6 kA; 10 kA is Icu IEC 60947-2 at 400 V, not Icn. Values are documentary only in this geometry register.'
    },
    {
      brand: 'Legrand', ref: '403033', kind: 'RCCB', designation: 'TX3 2P 40 A 30 mA AC',
      widthMm: 35.6, heightMm: 88.9, depthMm: 77.8, nominalDinModules: 2,
      mountingDepthMm: 44, terminalTorqueUpperNm: null, terminalTorqueLowerNm: null,
      upperTerminalType: null, lowerTerminalType: null,
      electricalVariant: 'AC', canUseAdditionalEquipment: false,
      source: 'https://www.legrand.es/es/productos/diferencial-tx3-2p-230v-30ma-40a-tipo-ac-403033',
      evidence: 'Individual Legrand 403033 HTML: 2 spaces, exterior W35.6 H88.9 D77.8 mm, mounting depth 44 mm; additional equipment: no.',
      caution: 'Title identifies TX3 while marketing description mentions RX3. Do not infer family interchangeability or Icn MCB from RCCB Icw.'
    },
    {
      brand: 'Legrand', ref: '403036', kind: 'RCCB', designation: 'TX3 2P 40 A 30 mA A',
      widthMm: 35.6, heightMm: 88.9, depthMm: 77.8, nominalDinModules: 2,
      mountingDepthMm: 44, terminalTorqueUpperNm: null, terminalTorqueLowerNm: null,
      upperTerminalType: null, lowerTerminalType: null,
      electricalVariant: 'A', canUseAdditionalEquipment: false,
      source: 'https://www.legrand.es/es/productos/diferencial-tx3-2p-230v-30ma-40a-tipo-403036',
      evidence: 'Individual Legrand 403036 HTML: 2 spaces, exterior W35.6 H88.9 D77.8 mm, mounting depth 44 mm; additional equipment: no.',
      caution: 'Same outer geometry as 403033 does NOT make type AC interchangeable with type A.'
    }
  ];
  const accessories = [
    {
      brand: 'Hager', ref: 'LZ060', kind: 'thermal_separator',
      widthMm: 9, heightMm: 60, depthMm: 44, nominalDinModules: 0.5,
      lengthMm: null, lengthSpanModules: null, ratedCurrentA: null,
      source: 'https://hager.com/es/catalogo/producto/lz060-separador-disipador',
      evidence: 'Individual Hager LZ060: separator 60 x 9 x 44 mm; 0.5 nominal modules.',
      caution: 'Placement is not justified by dimensions alone. Thermal design remains unverified.'
    },
    {
      brand: 'Hager', ref: 'KDN263B', kind: 'fork_busbar',
      widthMm: null, heightMm: null, depthMm: null, nominalDinModules: null,
      lengthMm: 1000, lengthSpanModules: 56, ratedCurrentA: 63,
      poles: 2, conductorCrossSectionMm2: 10,
      source: 'https://hager.com/es/catalogo/producto/kdn263b-puente-de-horquilla-2p-10mm2-63a-56m',
      evidence: 'Individual Hager KDN263B: fork busbar, length 1000 mm, 56M span, 2P, 10 mm2, 63 A.',
      caution: '56M is bar coverage, NOT an occupied 56-module device footprint; no pitch, cutting, current derating or assembly approval inferred.'
    },
    {
      brand: 'Hager', ref: 'KZN023', kind: 'busbar_end_cap',
      widthMm: null, heightMm: null, depthMm: null, nominalDinModules: null,
      lengthMm: null, lengthSpanModules: null, ratedCurrentA: null,
      source: 'https://hager.com/es/catalogo/producto/kzn023-tapa-lateral-para-kdn263b-y-kdn363b',
      evidence: 'Hager KZN023 individual product description expressly names KDN263B and KDN363B.',
      caution: 'No individual geometric dimensions documented in consulted listing. Do not allocate modules or clearances.'
    }
  ];
  const fact = (x) => Object.freeze({
    ...x,
    sourceKind: 'official_individual_product_page',
    examinedOn,
    verifiedWiringDiagram: false,
    installedGeometryApproved: false,
    electricalEquivalenceApproved: false,
    automaticAccessoryPlacementApproved: false
  });
  const freezeUnique = (rows, kind) => {
    const items = Object.freeze(rows.map(fact));
    const keys = items.map(x => x.brand + '\u001f' + x.ref);
    if (new Set(keys).size !== keys.length) throw Error('Duplicated ' + kind + ' SKU in R37');
    return items;
  };
  const deviceRows = freezeUnique(devices, 'device');
  const accessoryRows = freezeUnique(accessories, 'accessory');
  const key = (brand, ref) => String(brand) + '\u001f' + String(ref);
  const deviceIndex = new Map(deviceRows.map(x => [key(x.brand, x.ref), x]));
  const accessoryIndex = new Map(accessoryRows.map(x => [key(x.brand, x.ref), x]));
  for (const k of deviceIndex.keys()) {
    if (accessoryIndex.has(k)) throw Error('SKU collides across device / accessory types');
  }

  /* Direction of information matters: these are manufacturer LISTINGS, not a
   * complete, engineer-approved assembly BOM or reciprocal fit certificate. */
  const publishedLinks = Object.freeze([
    Object.freeze({
      fromBrand: 'Hager', fromRef: 'MCA216', toBrand: 'Hager', toRef: 'KDN263B',
      relation: 'optional_accessory_listed_on_device_page',
      source: 'https://hager.com/es/catalogo/producto/mca216-automatico-mca-2p-16a-c-6-10ka'
    }),
    Object.freeze({
      fromBrand: 'Hager', fromRef: 'KDN263B', toBrand: 'Hager', toRef: 'KZN023',
      relation: 'end_cap_listed_on_busbar_page',
      source: 'https://hager.com/es/catalogo/producto/kdn263b-puente-de-horquilla-2p-10mm2-63a-56m'
    })
  ]);
  const getDevice = (brand, ref) => deviceIndex.get(key(brand, ref)) || null;
  const getAccessory = (brand, ref) => accessoryIndex.get(key(brand, ref)) || null;
  const get = (brand, ref) => getDevice(brand, ref) || getAccessory(brand, ref);
  const getListing = (fromBrand, fromRef, toBrand, toRef) =>
    publishedLinks.find(x => x.fromBrand === fromBrand && x.fromRef === fromRef &&
      x.toBrand === toBrand && x.toRef === toRef) || null;

  /* Informative comparison only; a smaller profile never certifies a valid
   * substitution. Keep mounting depth separate from external overall depth. */
  function compareDeviceOuters(brandA, refA, brandB, refB) {
    const a = getDevice(brandA, refA), b = getDevice(brandB, refB);
    if (!a || !b) return null;
    const dimensionsMatch = ['widthMm','heightMm','depthMm','nominalDinModules']
      .every(k => a[k] === b[k]);
    return Object.freeze({
      dimensionsMatch,
      sameElectricalVariant: a.kind === b.kind && a.electricalVariant === b.electricalVariant,
      electricalEquivalent: null,
      physicalInterchangeabilityApproved: false,
      mountingClearanceMm: null,
      reason: 'Matching exterior dimensions do not verify device equivalence, terminals, bar fit or enclosure clearance.'
    });
  }
  function describeDepth(brand, ref) {
    const r = getDevice(brand, ref);
    if (!r) return null;
    return Object.freeze({
      externalDepthMm: r.depthMm,
      manufacturerMountingDepthMm: r.mountingDepthMm,
      requiredCabinetDepthMm: null,
      availableDoorClearanceMm: null,
      reason: 'Mounting depth and total external depth are different catalog dimensions; neither certifies door clearance.'
    });
  }
  root.PanelInstallationFactsR37 = Object.freeze({
    get, getDevice, getAccessory,
    devices: () => deviceRows.slice(), accessories: () => accessoryRows.slice(),
    accessoryListings: () => publishedLinks.slice(), getListing,
    compareDeviceOuters, describeDepth
  });
})(window);
