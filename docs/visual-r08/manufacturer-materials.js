/* PanelBuilder v0.11 · lote documental de materiales constructivos.
 * Fuentes individuales; sin autocompra, inferencia de anchura instalada ni validacion de compatibilidad.
 */
(function(root){'use strict';
const checkedOn='2026-10-16';
const items=Object.freeze([
  {
    "brand": "Hager",
    "ref": "MZ202",
    "kind": "auxiliar",
    "name": "Contacto de defecto 1NA+1NC, serie M/N/HM/ML",
    "widthMm": 9,
    "depthMm": 68,
    "modules": 0.5,
    "side": "left",
    "facts": [
      "230–415 V AC según ficha ES",
      "6 A nominal (aunque título comercial menciona 5 A)",
      "Montaje a izquierda según catálogo oficial Hager Portugal"
    ],
    "source": "https://hager.com/es/catalogo/producto/mz202-contacto-de-defecto-1na-1nc-5a",
    "otherSource": "https://hager.com/pt/catalogo/produto/mz202-contacto-sinalizacao-de-defeito-1-2m",
    "status": "ficha_individual",
    "unknown": "Alto no confirmado; montaje en conjunto y referencia anfitriona aún por verificar"
  },
  {
    "brand": "Hager",
    "ref": "MZ203",
    "kind": "auxiliar",
    "name": "Bobina de emisión para series M/N/HM/ML",
    "widthMm": 18,
    "heightMm": 83,
    "depthMm": 68,
    "modules": 1,
    "side": "left",
    "facts": [
      "230–415 V AC / 110–130 V DC",
      "15 VA de arranque",
      "Tarifa oficial Hager 2025 p. 37: acoplamiento por clip a izquierda; serie y anfitrión individual pendientes"
    ],
    "source": "https://hager.com/es/catalogo/producto/mz203-bobina-de-emision-230-400v",
    "status": "ficha_individual",
    "unknown": "Anfitrión, máximo y orden de varios auxiliares sin acreditar por SKU específico",
    "otherSource": "https://assets.sc.hager.com/es/-/media/project/hagerdeep/spain/hager/spain/downloads_es/documentaciones_es/tarifas/tarifa_926_2025.pdf?hash=9ACD036A6A3194713DEA01BA6AEA09DB&la=es-es"
  },
  {
    "brand": "Hager",
    "ref": "MZ204",
    "kind": "auxiliar",
    "name": "Bobina de emisión 12–48 V DC, series M/N/HM/ML",
    "widthMm": 18,
    "heightMm": 83,
    "depthMm": 68,
    "modules": 1,
    "side": "left",
    "facts": [
      "12–48 V DC / 24–48 V AC",
      "27 VA de arranque",
      "Tarifa oficial Hager 2025 p. 37: acoplamiento por clip a izquierda; serie y anfitrión individual pendientes"
    ],
    "source": "https://hager.com/es/catalogo/producto/mz204-bobina-em-int-serie-m-n-hm-ml-12-48v-dc",
    "status": "ficha_individual",
    "unknown": "Anfitrión, máximo y orden de varios auxiliares sin acreditar por SKU específico",
    "otherSource": "https://assets.sc.hager.com/es/-/media/project/hagerdeep/spain/hager/spain/downloads_es/documentaciones_es/tarifas/tarifa_926_2025.pdf?hash=9ACD036A6A3194713DEA01BA6AEA09DB&la=es-es"
  },
  {
    "brand": "Hager",
    "ref": "MZ206",
    "kind": "auxiliar",
    "name": "Bobina de mínima tensión 230 V AC, series M/N/HM/ML",
    "widthMm": 17.5,
    "heightMm": null,
    "depthMm": 68,
    "modules": 1,
    "side": "left",
    "facts": [
      "230 V AC",
      "3,50 VA de arranque, 2 W potencia disipada",
      "Tarifa oficial Hager 2025 p. 37: acoplamiento por clip a izquierda; serie y anfitrión individual pendientes",
      "1 módulo nominal en catálogo Hager 2025, no equiparar con 18 mm de anchura real"
    ],
    "source": "https://hager.com/es/catalogo/producto/mz206-bobina-minima-para-int-m-n-hm-ml-230-v",
    "status": "ficha_individual",
    "unknown": "Anfitrión, máximo y orden de varios auxiliares sin acreditar por SKU específico",
    "otherSource": "https://assets.sc.hager.com/es/-/media/project/hagerdeep/spain/hager/spain/downloads_es/documentaciones_es/tarifas/tarifa_926_2025.pdf?hash=9ACD036A6A3194713DEA01BA6AEA09DB&la=es-es"
  },
  {
    "brand": "Hager",
    "ref": "LZ060",
    "kind": "separador",
    "name": "Separador disipador modular",
    "widthMm": 9,
    "heightMm": 60,
    "depthMm": 44,
    "modules": 0.5,
    "side": null,
    "facts": [
      "Material PVC",
      "Dimensión exterior de producto, no cota de disipación calculada"
    ],
    "source": "https://hager.com/es/catalogo/producto/lz060-separador-disipador",
    "status": "ficha_individual",
    "unknown": "Necesidad térmica y separación entre dispositivos por verificar"
  },
  {
    "brand": "Hager",
    "ref": "KZN023",
    "kind": "tapa_peine",
    "name": "Tapa lateral para peines de horquilla KDN263B/KDN363B",
    "widthMm": null,
    "heightMm": null,
    "depthMm": null,
    "modules": null,
    "side": null,
    "facts": [
      "Aislada; pieza final de cubierta anti-contactos",
      "No atribuir a KDN163A"
    ],
    "source": "https://hager.com/es/catalogo/producto/kzn023-tapa-lateral-para-kdn263b-y-kdn363b",
    "exactCombRefs": [
      "KDN263B",
      "KDN363B"
    ],
    "status": "compatibilidad_referencia_explicita",
    "unknown": "Dimensiones y situación de tapa instalada no acreditadas"
  },
  {
    "brand": "Hager",
    "ref": "KZN024",
    "kind": "tapa_peine",
    "name": "Tapa lateral para peine de horquilla KDN463B",
    "widthMm": null,
    "heightMm": null,
    "depthMm": null,
    "modules": null,
    "side": null,
    "facts": [
      "Aislada; pieza final de cubierta anti-contactos",
      "No atribuir a KDN163A"
    ],
    "source": "https://hager.com/es/catalogo/producto/kzn024-tapa-lateral-para-kdn463b",
    "exactCombRefs": [
      "KDN463B"
    ],
    "status": "compatibilidad_referencia_explicita",
    "unknown": "Dimensiones y situación de tapa instalada no acreditadas"
  },
  {
    "brand": "Hager",
    "ref": "MZN120",
    "kind": "cubrebornes",
    "name": "Tapa precinto para bornes de interruptores M/N",
    "widthMm": 18,
    "heightMm": 32,
    "depthMm": null,
    "modules": null,
    "side": null,
    "facts": [
      "18 × 32 mm en ficha individual Hager 04/03/2026",
      "No se trata de anchura adicional en carril DIN"
    ],
    "source": "https://assets.hager.com/step-content/P/PDS_157361262101ES/Document/std.lang.all/PDS_MZN120_2101_es-ES.pdf",
    "status": "ficha_individual",
    "unknown": "Posición real del accesorio y compatibilidad con SKU individual pendientes"
  },
  {
    "brand": "Schneider",
    "ref": "A9XPE110",
    "kind": "tapa_peine",
    "name": "Juego de 10 tapas terminales 1P para peine Acti9",
    "widthMm": null,
    "heightMm": null,
    "depthMm": null,
    "modules": null,
    "side": null,
    "facts": [
      "Conjunto de 10, 1 polo",
      "Ficha Schneider 2016: compatibilidad de familia Acti9, iC60, iID, iK60",
      "No atribuir automáticamente a A9XPH112 sin manual de montaje del peine"
    ],
    "source": "https://iportal.se.com/Contents/docs/SQD-A9XPE110.PDF",
    "status": "familia_documentada",
    "unknown": "Compatibilidad exacta con A9XPH112 y cota del conjunto pendientes"
  },
  {
    "brand": "Legrand",
    "ref": "406258",
    "kind": "auxiliar",
    "name": "Contacto auxiliar inversor DX³, 6 A, 240 V",
    "widthMm": null,
    "heightMm": null,
    "depthMm": null,
    "modules": null,
    "side": null,
    "facts": [
      "Serie DX³, contacto CA",
      "Ficha comercial Legrand muestra precio recomendado sin IVA, sujeto a fecha; no incluido en precios del motor"
    ],
    "source": "https://www.legrand.es/es/productos/contacto-auxiliar-inversor-ca",
    "status": "ficha_comercial",
    "unknown": "Cotas, lado y compatibilidad por referencia exacta de magnetotérmico pendientes"
  },
  {
    "brand": "Hager",
    "ref": "CZ001",
    "kind": "auxiliar_diferencial",
    "name": "Contacto auxiliar + contacto de defecto para interruptores diferenciales 2P/4P",
    "widthMm": 18,
    "heightMm": null,
    "depthMm": null,
    "modules": 1,
    "side": "left",
    "facts": [
      "6 A, 230 V AC, montaje por clic",
      "Tarifa Hager 2025: para diferenciales accesoriables de 25–63 A, requiere acoplar CZ001 antes que bobinas MZ203/204/205/206",
      "Ficha actual exceptúa CD728M, CD728V, CD748V"
    ],
    "source": "https://hager.com/es/catalogo/producto/cz001-contacto-aux-contacto-def-6a-230v-ac",
    "otherSource": "https://assets.sc.hager.com/es/-/media/project/hagerdeep/spain/hager/spain/downloads_es/documentaciones_es/tarifas/tarifa_926_2025.pdf?hash=9ACD036A6A3194713DEA01BA6AEA09DB&la=es-es",
    "status": "secuencia_documentada_para_gama",
    "unknown": "Verificar RCD anfitrión exacto, generación, accesorios intermedios y orden/posición individual antes de montar"
  },
  {
    "brand": "Hager",
    "ref": "CZN005",
    "kind": "cubrebornes",
    "name": "Juego tapas cubrebornes precintables para diferencial 25–63 A, 2M",
    "widthMm": 35,
    "heightMm": null,
    "depthMm": null,
    "modules": null,
    "side": null,
    "facts": [
      "Ancho de tapa de producto: 35 mm (NO es reserva adicional de carril DIN)",
      "Uso previsto en diferenciales 2M, 25–63 A, sujeto a SKU exacto"
    ],
    "source": "https://hager.com/es/catalogo/producto/czn005-cubrebornes-precint-int-dif-25-63a-2m",
    "status": "ficha_individual",
    "unknown": "Geometría instalada, espesor hacia puerta y ajuste con bornes sin verificar"
  },
  {
    "brand": "Hager",
    "ref": "CZN006",
    "kind": "cubrebornes",
    "name": "Juego tapas cubrebornes precintables para diferencial 25–63 A, 4M",
    "widthMm": 70,
    "heightMm": null,
    "depthMm": null,
    "modules": null,
    "side": null,
    "facts": [
      "Ancho 70 mm y longitud de producto 7 mm según ficha Hager",
      "NO es reserva lateral DIN de 70 mm",
      "Uso previsto en diferenciales 4M, 25–63 A"
    ],
    "source": "https://hager.com/es/catalogo/producto/czn006-cubrebornes-precint-int-dif-25-63a-4m",
    "status": "ficha_individual",
    "unknown": "Cota frontal y compatibilidad efectiva con SKU individual por verificar"
  }
].map(x=>Object.freeze(x)));
const byKey=(brand,ref)=>items.find(x=>x.brand===brand&&x.ref===ref);
const exactCapFor=(brand,combRef)=>items.filter(x=>x.kind==='tapa_peine'&&x.brand===brand&&x.exactCombRefs?.includes(combRef));
const hasExactCap=(brand,combRef,capRef)=>exactCapFor(brand,combRef).some(x=>x.ref===capRef);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
 const rows=items.map(x=>{
  const d=[x.widthMm===null?'ancho pendiente':x.widthMm+' mm ancho',
    x.heightMm===null?'alto pendiente':x.heightMm+' mm alto',
    x.depthMm===null?'fondo pendiente':x.depthMm+' mm fondo'].join(' · ');
  const exact=x.exactCombRefs?.length?' · Peines explícitos: '+x.exactCombRefs.join(', '):'';
  return '<tr><td><strong>'+esc(x.brand)+' '+esc(x.ref)+'</strong></td><td>'+esc(x.name)+'</td><td>'+esc(d)+'</td><td>'+esc(x.status+exact)+'</td><td><a href="'+esc(x.source)+'" target="_blank" rel="noopener noreferrer">Ficha oficial ↗</a><p class="tiny-hint">'+esc(x.facts.join(' · '))+'</p><p class="tiny-hint">Pendiente: '+esc(x.unknown)+'</p></td></tr>';
 }).join('');
 return '<details class="aux-physical-panel" data-manufacturer-research><summary><strong>Fichas verificadas de accesorios y materiales · '+items.length+' referencias nuevas (Hager, Schneider, Legrand)</strong></summary>'
  +'<p class="small-text">Investigación documental individual '+checkedOn+'. Solo referencias explícitas, medidas de producto acreditadas y pendientes reales. NO supone compatibilidad, compra, PVP actualizado ni montaje aprobado.</p>'
  +'<div class="table-wrap"><table class="materials-table"><thead><tr><th>SKU</th><th>Material</th><th>Cotas</th><th>Evidencia</th><th>Fuente y límites</th></tr></thead><tbody>'+rows+'</tbody></table></div></details>';
}
root.PanelManufacturerResearch=Object.freeze({checkedOn,items,byKey,exactCapFor,hasExactCap,render});
})(window);
