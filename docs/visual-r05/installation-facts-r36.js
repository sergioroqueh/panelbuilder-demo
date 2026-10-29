/* PanelBuilder R36 | Datos PUBLICOS de producto por SKU y ficha individual.
 * Solo lectura; NO sustituye dimensiones instaladas, aprobación de peines,
 * comprobación de puertas, disipación térmica ni contactos conmutados.
 * No contiene precios ni datos de tarifas privadas. No cargar en UI aún.
 */
(function (root) {
  'use strict';
  const rows = [
    {
      brand: 'Hager', ref: 'MN916V', designation: 'MCB 1P+N 16 A C 6 kA',
      widthMm: 17.5, heightMm: 83, depthMm: 70, nominalDinModules: 1,
      terminalTorqueNm: 1.9, documentDate: '2026-02-02',
      source: 'https://assets.hager.com/step-content/P/PDS_158311212101ES/Document/std.lang.all/PDS_MN916V_2101_es-ES.pdf',
      basis: 'Ficha Hager MN916V, páginas 1-2; dimensiones, número de módulos y par de apriete.'
    },
    {
      brand: 'Hager', ref: 'MN516V', designation: 'MCB 1P+N 16 A C 6 kA',
      widthMm: 35, heightMm: 83, depthMm: 70, nominalDinModules: 2,
      terminalTorqueNm: 2.8, documentDate: null,
      source: 'https://assets.hager.com/step-content/P/PDS_519477012101ES/Document/std.lang.all/MN516V_2101_es-ES.pdf',
      basis: 'Ficha Hager MN516V, páginas 1-2; dimensiones, módulos y par de apriete. La fecha mostrada por buscador (01.04.2026) difiere de la respuesta PDF (26.06.2026); confirmar revisión antes de fijar documentDate.'
    },
    {
      brand: 'Hager', ref: 'CDA440M', designation: 'RCCB 3P+N 40 A 30 mA A',
      widthMm: 70, heightMm: 83, depthMm: 70, nominalDinModules: 4,
      terminalTorqueNm: 2.8, documentDate: '2026-01-08',
      source: 'https://hager.com/es/catalogo/catalog/product/download/id/CDA440M',
      basis: 'Ficha Hager CDA440M, páginas 1-2, texto extraído. Inc EN 61008-1 no es Icn IEC 60898-1. Captura gráfica no confirmada.'
    },
    {
      brand: 'Legrand', ref: '403586', designation: 'MCB TX3 1P+N 16 A C 6 kA',
      widthMm: 35.4, heightMm: 88, depthMm: 77.8, nominalDinModules: 2,
      terminalTorqueNm: null, documentDate: null,
      source: 'https://www.legrand.es/es/productos/magnetotermico-tx3-1pn-230v-16a-curva-2-modulos-403586',
      basis: 'Página oficial Legrand de producto por referencia 403586: dimensiones y espacios modulares. Par de apriete no establecido en esa fuente.'
    }
  ];
  const keys = rows.map(x => x.brand + '\u001f' + x.ref);
  if (new Set(keys).size !== rows.length) throw Error('SKU duplicado R36');
  const items = Object.freeze(rows.map(x => Object.freeze({
    ...x, sourceType: 'manufacturer_sku', checkedOn: '2026-10-22',
    verifiedWiringDiagram: false, installationCompatibilityApproved: false,
    installedGeometryApproved: false
  })));
  const byKey = new Map(items.map(x => [x.brand + '\u001f' + x.ref, x]));
  function get(brand, ref) { return byKey.get(String(brand) + '\u001f' + String(ref)) || null; }
  function compareNominalWidth(brand, ref, nominalModulePitchMm = 18) {
    const x = get(brand, ref);
    if (!x || typeof nominalModulePitchMm !== 'number' || !Number.isFinite(nominalModulePitchMm) || nominalModulePitchMm <= 0) return null;
    return Object.freeze({
      nominalWidthMm: x.nominalDinModules * nominalModulePitchMm,
      externalProductWidthMm: x.widthMm,
      differenceMm: Number((x.nominalDinModules * nominalModulePitchMm - x.widthMm).toFixed(2)),
      usableExtraSpaceMm: null,
      disclaimer: 'Diferencia documental NO es hueco disponible ni valida la geometría montada.'
    });
  }
  root.PanelInstallationFactsR36 = Object.freeze({get, all: () => items.slice(), compareNominalWidth});
})(window);
