/* PanelBuilder v0.11 · matrices de fichas individuales y enlaces comerciales.
 * Distingue "aparece listado en la ficha del host" de validacion
 * constructiva, acoplamiento y orden, que NO estan acreditados.
 */
(function(root){'use strict';
const checkedOn='2026-10-16';
const hosts=Object.freeze([
  {
    "brand": "Hager",
    "ref": "MCA216",
    "kind": "magnetotermico",
    "name": "M 2P 16A curva C",
    "poles": "2P",
    "ampA": 16,
    "curve": "C",
    "modules": 2,
    "widthMm": 35,
    "heightMm": 83,
    "depthMm": 70,
    "icn60898Ka": 6,
    "icnVoltageV": 400,
    "source": "https://hager.com/es/catalogo/producto/mca216-automatico-mca-2p-16a-c-6-10ka",
    "listed": [
      "MZ201",
      "MZ202",
      "MZ203",
      "MZ204",
      "MZ206",
      "KDN263B",
      "MZN120",
      "LZ060"
    ],
    "note": "Icn IEC 60898-1 6 kA a 400 V; los valores Icu/Ics dependen de norma y tensión. Listado de accesorios del producto no certifica conjunto."
  },
  {
    "brand": "Hager",
    "ref": "NCN263A",
    "kind": "magnetotermico",
    "name": "N 2P 63A curva C",
    "poles": "2P",
    "ampA": 63,
    "curve": "C",
    "modules": 2,
    "widthMm": 35,
    "heightMm": 83,
    "depthMm": 70,
    "icn60898Ka": 10,
    "icnVoltageV": null,
    "source": "https://hager.com/es/catalogo/producto/ncn263a-automatico-ncn-2p-63a-c-10-15ka",
    "listed": [
      "MZ201",
      "MZ202",
      "MZ203",
      "MZ204",
      "MZ206",
      "KDN263B",
      "MZN120"
    ],
    "note": "Icn según IEC 60898-1 indicado 10 kA en ficha; tensión específica asociada pendiente antes de usar como dato de cálculo."
  },
  {
    "brand": "Hager",
    "ref": "NRN263",
    "kind": "magnetotermico",
    "name": "NR 2P 63A curva C",
    "poles": "2P",
    "ampA": 63,
    "curve": "C",
    "modules": 2,
    "widthMm": 35,
    "heightMm": 83,
    "depthMm": 70,
    "icn60898Ka": 10,
    "icnVoltageV": null,
    "source": "https://hager.com/es/catalogo/producto/nrn263-automatico-nrn-2p-63a-c-15ka",
    "listed": [
      "MZ201",
      "MZ202",
      "MZ203",
      "MZ204",
      "MZ206",
      "KDN263B",
      "MZN120",
      "LZ060"
    ],
    "note": "Título anuncia 15 kA, ficha desglosa Icu 400 V=15 kA e Icn IEC 60898-1=10 kA; NO atribuir Icn=15 kA."
  },
  {
    "brand": "Hager",
    "ref": "NDN216A",
    "kind": "magnetotermico",
    "name": "N 2P 16A curva D",
    "poles": "2P",
    "ampA": 16,
    "curve": "D",
    "modules": 2,
    "widthMm": 35,
    "heightMm": 83,
    "depthMm": 70,
    "icn60898Ka": 10,
    "icnVoltageV": null,
    "source": "https://hager.com/es/catalogo/producto/ndn216a-automatico-ndn-2p-16a-d-10-15ka",
    "listed": [
      "MZ201",
      "MZ202",
      "MZ206",
      "KDN263B",
      "MZN120"
    ],
    "note": "Curva D, no sustituible por curva C; accesorio listado exige revisar montaje y alimentación."
  }
].map(Object.freeze));
const combs=Object.freeze([
  {
    "brand": "Hager",
    "ref": "KDN263B",
    "kind": "peine",
    "name": "Horquilla 2P 63 A / 10 mm²",
    "poles": "2P",
    "ratedA": 63,
    "sectionMm2": 10,
    "lengthMm": 1000,
    "modulesNominal": 56,
    "voltageVac": "230–400",
    "endcap": "KZN023",
    "source": "https://hager.com/es/catalogo/producto/kdn263b-puente-de-horquilla-2p-10mm2-63a-56m",
    "note": "En página ES, 56 M; catálogo internacional muestra título 57 M pero propiedad técnica 56 M. El valor nominal no demuestra cantidad de derivaciones ni longitud tras corte."
  },
  {
    "brand": "Hager",
    "ref": "KDN363B",
    "kind": "peine",
    "name": "Horquilla 3P 63 A / 10 mm²",
    "poles": "3P",
    "ratedA": 63,
    "sectionMm2": 10,
    "lengthMm": 1000,
    "modulesNominal": 57,
    "voltageVac": "230–400",
    "endcap": "KZN023",
    "source": "https://hager.com/es/catalogo/producto/kdn363b-puente-de-horquilla-3p-10mm2-63a-57m",
    "note": "Longitud exterior 1000 mm, 57 M nominales, no implica 57 dientes ni conjunto validado."
  },
  {
    "brand": "Hager",
    "ref": "KDN463B",
    "kind": "peine",
    "name": "Horquilla 4P 63 A / 10 mm²",
    "poles": "4P",
    "ratedA": 63,
    "sectionMm2": 10,
    "lengthMm": 1000,
    "modulesNominal": 57,
    "voltageVac": "230–400",
    "endcap": "KZN024",
    "source": "https://hager.com/es/catalogo/producto/kdn463b-puente-de-horquilla-4p-10mm2-63a-56m",
    "note": "Página Hager ES: título 56 M, tabla de capacidad 57 M; discrepancia explícita, NO usar módulos para plan de corte sin ficha de montaje."
  }
].map(Object.freeze));
const legrand=Object.freeze([
  {
    "brand": "Legrand",
    "ref": "406276",
    "kind": "bobina_emision",
    "name": "Bobina DX³ emisión 12–48 V AC/DC (texto comercial: VA)",
    "widthMm": null,
    "heightMm": null,
    "depthMm": null,
    "modules": null,
    "source": "https://www.legrand.es/es/productos/auxiliares-mando-mt-y-da",
    "status": "referencia_listada_fabricante",
    "note": "Categoría oficial menciona 12-48VA C/DC; nomenclatura ambigua del listado, comprobar tensión exacta por ficha individual. No asumir dimensiones ni montaje."
  },
  {
    "brand": "Legrand",
    "ref": "406278",
    "kind": "bobina_emision",
    "name": "Bobina DX³ emisión 110–415 V AC/DC",
    "widthMm": null,
    "heightMm": null,
    "depthMm": null,
    "modules": null,
    "source": "https://www.legrand.es/es/productos/auxiliares-mando-mt-y-da",
    "status": "referencia_listada_fabricante",
    "note": "Ficha de grupo; no asumir sección, dimensiones o compatibilidad con 406258 ni con todos los aparatos DX³."
  },
  {
    "brand": "Legrand",
    "ref": "406282",
    "kind": "bobina_minima",
    "name": "Bobina DX³ mínima tensión 230 V AC/DC",
    "widthMm": null,
    "heightMm": null,
    "depthMm": null,
    "modules": null,
    "source": "https://www.legrand.es/es/productos/auxiliares-mando-mt-y-da",
    "status": "referencia_listada_fabricante",
    "note": "Cota y modelo anfitrión pendientes; esta bobina no equivale a una bobina de emisión."
  }
].map(Object.freeze));
const findHost=(brand,ref)=>hosts.find(x=>x.brand===brand&&x.ref===ref);
const findComb=(brand,ref)=>combs.find(x=>x.brand===brand&&x.ref===ref);
const listed=(brand,hostRef,materialRef)=>!!findHost(brand,hostRef)?.listed.includes(materialRef);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function report(a,brand){
 const pending=[],known=[],chains=a?.dinAccessoryAssemblies?.chains||{},combsPlans=a?.dinAccessoryAssemblies?.combs||[];
 if(brand!=='Hager')return {pending,known};
 for(const [id,members] of Object.entries(chains)){
  const host=a?.apparatusCandidates?.[id];
  if(!host||host.fabricante!=='Hager')continue;
  const h=findHost('Hager',host.referencia);
  if(!h){pending.push('SKU anfitrión '+host.referencia+': ficha individual aún no cargada, no atribuir accesorios por serie.');continue;}
  for(const m of members){
   const name=h.ref+' + '+m.ref;
   if(m.brand==='Hager'&&listed('Hager',h.ref,m.ref)){
    known.push(name);
    pending.push(name+': aparece en la lista de accesorios de la ficha del anfitrión, PERO falta cotejar acoplamiento y combinación real.');}
   else pending.push(name+': NO acreditado en el listado INDIVIDUAL consultado; ausencia en lista no demuestra incompatibilidad.');
  }
 }
 for(const segment of combsPlans){
  if(segment.brand!=='Hager')continue;
  const physical=findComb('Hager',segment.ref);
  if(!physical)continue;
  pending.push(segment.ref+': peine '+physical.poles+' de '+physical.lengthMm+' mm de longitud total; requiere plano de corte, bornes y tapa '+physical.endcap+' antes de montar.');
  for(const id of segment.deviceIds){
   const candidate=a.apparatusCandidates?.[id];
   if(candidate?.fabricante!=='Hager')continue;
   const label=segment.ref+' ↔ '+candidate.referencia;
   if(listed('Hager',candidate.referencia,segment.ref)){
    known.push(label);
    pending.push(label+': asociación explícita en ficha Hager del aparato, NO validación de conexión, polos, corte ni corriente.');
   }else pending.push(label+': asociación individual pendiente; NO inferir compatibilidad por tener el mismo fabricante.');
  }
 }
 return {pending,known};
}
function render(){
 const header='<details class="aux-physical-panel" data-host-catalog><summary><strong>Fabricantes · 4 magnetotérmicos Hager + 3 peines + 3 bobinas Legrand · referencias individuales</strong></summary>'
 +'<p class="small-text">Fichas verificadas '+checkedOn+'. Relación accesorio/anfitrión = <strong>aparece en página oficial</strong>, NO certificación de acoplamiento. Sin PVP o precio neto acreditado para presupuestar.</p>';
 const rows=hosts.map(h=>'<tr><td><strong>'+esc(h.ref)+'</strong></td><td>'+esc(h.name)+'</td><td>'+h.widthMm+' × '+h.heightMm+' × '+h.depthMm+' mm · '+h.modules+' M · Icn '+h.icn60898Ka+' kA IEC 60898-1'+(h.icnVoltageV?' a '+h.icnVoltageV+' V':' (tensión específica pendiente)')+'</td><td>'+esc(h.listed.join(', '))+'<p class="tiny-hint">'+esc(h.note)+'</p></td><td><a href="'+esc(h.source)+'" target="_blank" rel="noopener noreferrer">Hager ↗</a></td></tr>').join('');
 const bars=combs.map(b=>'<tr><td><strong>'+esc(b.ref)+'</strong></td><td>'+esc(b.name)+'</td><td>'+b.lengthMm+' mm largo · '+b.modulesNominal+' M nominales · '+b.ratedA+' A</td><td>Tapa referenciada '+esc(b.endcap)+'<p class="tiny-hint">'+esc(b.note)+'</p></td><td><a href="'+esc(b.source)+'" target="_blank" rel="noopener noreferrer">Hager ↗</a></td></tr>').join('');
 const coils=legrand.map(b=>'<tr><td><strong>'+esc(b.ref)+'</strong></td><td>'+esc(b.name)+'</td><td>Cotas desconocidas</td><td>'+esc(b.note)+'</td><td><a href="'+esc(b.source)+'" target="_blank" rel="noopener noreferrer">Legrand ↗</a></td></tr>').join('');
 return header+'<div class="table-wrap"><table class="materials-table"><thead><tr><th>SKU</th><th>Producto</th><th>Datos de ficha</th><th>Accesorios relacionados y pendientes</th><th>Origen</th></tr></thead><tbody>'+rows+bars+coils+'</tbody></table></div></details>';
}
root.PanelManufacturerHosts=Object.freeze({hosts,combs,legrand,checkedOn,findHost,findComb,listed,report,render});
})(window);
