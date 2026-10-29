/* PanelBuilder v0.11 - ronda 15, evidencia de fabricantes por SKU.
   Datos descriptivos referenciados, no asignacion de componentes ni validacion IEC/REBT.
*/
(function(root){'use strict';
const checkedOn='2026-10-16';
const items=Object.freeze([
 {
  "brand": "Legrand",
  "ref": "411505",
  "kind": "diferencial",
  "name": "DX³ 2P 40 A tipo AC 30 mA",
  "poles": "2P",
  "ampA": 40,
  "sensitivityMa": 30,
  "rcdType": "AC",
  "modules": 2,
  "widthMm": 35.6,
  "heightMm": 94.8,
  "depthMm": 77.8,
  "installDepthMm": 44,
  "additionalEquipment": true,
  "source": "https://www.legrand.es/es/productos/interruptor-diferencial-dx3-2p-230v-40a-tipo-ac-30ma-2-modulos-411505",
  "facts": [
   "UNE-EN 61008-1; 230 V AC",
   "Profundidad de instalación 44 mm NO es profundidad exterior 77,8 mm",
   "Equipos adicionales posibles: sí; ninguna referencia auxiliar individual validada"
  ]
 },
 {
  "brand": "Legrand",
  "ref": "411524",
  "kind": "diferencial",
  "name": "DX³ 2P 25 A tipo AC 300 mA",
  "poles": "2P",
  "ampA": 25,
  "sensitivityMa": 300,
  "rcdType": "AC",
  "modules": 2,
  "widthMm": 35.6,
  "heightMm": 94.8,
  "depthMm": 77.8,
  "installDepthMm": 44,
  "additionalEquipment": true,
  "source": "https://www.legrand.es/es/productos/interruptor-diferencial-dx3-2p-230v-25a-tipo-ac-300ma-2-modulos-411524",
  "facts": [
   "300 mA, NO confundir con 30 mA",
   "Equipos adicionales posibles: sí; verificar referencia de accesorio exacta"
  ]
 },
 {
  "brand": "Legrand",
  "ref": "411556",
  "kind": "diferencial",
  "name": "DX³ 2P 63 A tipo A 30 mA",
  "poles": "2P",
  "ampA": 63,
  "sensitivityMa": 30,
  "rcdType": "A",
  "modules": 2,
  "widthMm": 35.6,
  "heightMm": 94.8,
  "depthMm": 77.8,
  "installDepthMm": 44,
  "additionalEquipment": true,
  "source": "https://www.legrand.es/es/productos/interruptor-diferencial-dx3-2p-230v-63a-tipo-30ma-2-modulos-411556",
  "facts": [
   "Tipo A distinto de AC; no reemplazo automático",
   "Equipos adicionales posibles: sí, sin relación de accesorio SKU verificada"
  ]
 },
 {
  "brand": "Legrand",
  "ref": "411591",
  "kind": "diferencial",
  "name": "DX³ 2P 40 A tipo F 30 mA",
  "poles": "2P",
  "ampA": 40,
  "sensitivityMa": 30,
  "rcdType": "F",
  "modules": 2,
  "widthMm": 35.6,
  "heightMm": 94.8,
  "depthMm": 77.8,
  "installDepthMm": 44,
  "additionalEquipment": true,
  "source": "https://www.legrand.es/es/productos/interruptor-diferencial-dx3-2p-230v-40a-tipo-f-30ma-2-modulos-411591",
  "facts": [
   "Tipo F con inmunidad reforzada, no confundir con tipo A o B",
   "Equipos adicionales posibles: sí, sujeto a ficha de montaje por referencia"
  ]
 },
 {
  "brand": "Legrand",
  "ref": "411668",
  "kind": "diferencial",
  "name": "DX³ 4P 40 A tipo AC 300 mA selectivo",
  "poles": "4P",
  "ampA": 40,
  "sensitivityMa": 300,
  "rcdType": "AC",
  "selective": true,
  "modules": 4,
  "widthMm": 71.2,
  "heightMm": 83,
  "depthMm": 77.8,
  "installDepthMm": 44,
  "additionalEquipment": true,
  "source": "https://www.legrand.es/es/productos/interruptor-diferencial-dx3-4p-400v-40a-tipo-ac-300ma-select-4-modulos-411668",
  "facts": [
   "Selectivo tipo AC, 300 mA; no sustituir por diferencial 30 mA",
   "Ancho exterior 71,2 mm y 4 M nominales; no inferir 72 mm físicos"
  ]
 },
 {
  "brand": "Legrand",
  "ref": "403032",
  "kind": "diferencial",
  "name": "TX³ 2P 25 A tipo AC 30 mA",
  "poles": "2P",
  "ampA": 25,
  "sensitivityMa": 30,
  "rcdType": "AC",
  "modules": 2,
  "widthMm": null,
  "heightMm": null,
  "depthMm": null,
  "installDepthMm": null,
  "additionalEquipment": false,
  "source": "https://www.legrand.es/es/productos/diferencial-tx3-2p-230v-30ma-25a-tipo-ac-403032",
  "facts": [
   "No acepta auxiliares: negación explícita de la ficha TX³",
   "No derivar medidas DX³/RX³ para esta referencia TX³"
  ]
 },
 {
  "brand": "Legrand",
  "ref": "402059",
  "kind": "diferencial",
  "name": "RX³ 2P 25 A tipo A 30 mA",
  "poles": "2P",
  "ampA": 25,
  "sensitivityMa": 30,
  "rcdType": "A",
  "modules": 2,
  "widthMm": null,
  "heightMm": null,
  "depthMm": null,
  "installDepthMm": null,
  "additionalEquipment": false,
  "source": "https://www.legrand.es/es/productos/diferencial-rx3-2p-230v-30ma-25a-tipoa-402059",
  "facts": [
   "No acepta auxiliares: negación explícita de la ficha RX³",
   "Sin ancho exterior comprobado para referencia exacta"
  ]
 },
 {
  "brand": "Legrand",
  "ref": "406260",
  "kind": "auxiliar",
  "name": "DX³ contacto señalización defecto SD 6 A 240 V~",
  "widthMm": null,
  "heightMm": null,
  "depthMm": null,
  "modules": null,
  "side": "unknown",
  "source": "https://www.legrand.es/es/productos/contacto-senal-defecto-inversor-sd",
  "facts": [
   "Función SD: señal de defecto, no indica simple estado ON/OFF",
   "No asignar automáticamente a un diferencial DX³ por marca"
  ]
 },
 {
  "brand": "Legrand",
  "ref": "406262",
  "kind": "auxiliar",
  "name": "DX³ contacto inversor CA/SD 6 A 240 V~",
  "widthMm": null,
  "heightMm": null,
  "depthMm": null,
  "modules": null,
  "side": "unknown",
  "source": "https://www.legrand.es/es/productos/contacto-auxiliar-inversor-casd",
  "facts": [
   "CA/SD: función seleccionable según configuración documentada",
   "Sin plano de acoplamiento, no se afirma simultaneidad funcional"
  ]
 },
 {
  "brand": "Legrand",
  "ref": "406266",
  "kind": "auxiliar",
  "name": "DX³ contacto auxiliar + defecto CA+SD 6 A 240 V~",
  "widthMm": null,
  "heightMm": null,
  "depthMm": null,
  "modules": null,
  "side": "unknown",
  "source": "https://www.legrand.es/es/productos/contacto-auxiliar-inversor-contacto-inversor-senalizacion-defectos-ca-sd",
  "facts": [
   "CA+SD: dos señalizaciones, distinto de CA/SD 406262",
   "Sin cota y compatibilidad de anfitrión exacto acreditadas"
  ]
 },
 {
  "brand": "Schneider",
  "ref": "A9A26914",
  "kind": "auxiliar",
  "name": "Acti9 iOF para PLC, 2–100 mA AC/DC",
  "function": "iOF",
  "widthMm": null,
  "heightMm": null,
  "depthMm": null,
  "modules": null,
  "side": "left",
  "source": "https://www.se.com/es/es/product/A9A26914/acti9-iof-contacto-auxiliar-2-hasta-100ma-acdc/",
  "facts": [
   "Contacto posición abierto/cerrado, uso de bajo nivel PLC",
   "Fijación con clips a izquierda; no se deduce ocupación lateral"
  ]
 },
 {
  "brand": "Schneider",
  "ref": "A9A26907",
  "kind": "auxiliar",
  "name": "Acti9 iSD señalización disparo 100 mA–6 A AC/DC",
  "function": "iSD",
  "widthMm": null,
  "heightMm": null,
  "depthMm": null,
  "modules": null,
  "side": "left",
  "source": "https://www.se.com/es/es/product/A9A26907/acti9-isd-contacto-auxiliar-100ma-to-6a-acdc/",
  "facts": [
   "iSD informa de disparo por defecto o acción auxiliar; no solo apertura manual",
   "Clip a izquierda; anchura por SKU no verificada"
  ]
 },
 {
  "brand": "Schneider",
  "ref": "A9A26917",
  "kind": "auxiliar",
  "name": "Acti9 iSD señalización disparo 2–100 mA AC/DC",
  "function": "iSD",
  "widthMm": null,
  "heightMm": null,
  "depthMm": null,
  "modules": null,
  "side": "unknown",
  "source": "https://www.se.com/es/es/product/A9A26917/acti9-isd-contacto-auxiliar-2-hasta-100ma-acdc/",
  "facts": [
   "Variante bajo nivel PLC, función de disparo iSD",
   "Cota y lado de montaje del SKU preciso pendientes de documento individual"
  ]
 },
 {
  "brand": "Schneider",
  "ref": "A9A26919",
  "kind": "auxiliar",
  "name": "Acti9 iOF+SD doble 2–100 mA AC/DC",
  "function": "iOF+SD",
  "widthMm": null,
  "heightMm": null,
  "depthMm": null,
  "modules": null,
  "side": "left",
  "source": "https://www.se.com/es/es/product/A9A26919/acti9-iof%2Bsd-contacto-auxiliar-doble-2-hasta-100ma-acdc/",
  "facts": [
   "Doble señalización estado/disparo, apto para bajo nivel PLC según ficha",
   "Clip a izquierda; familias iC60/iID anunciadas, no SKU anfitrión individual"
  ]
 },
 {
  "brand": "Schneider",
  "ref": "A9A26924",
  "kind": "auxiliar_historico",
  "name": "Acti9 iOF antiguo, descatalogado",
  "function": "iOF",
  "widthMm": null,
  "heightMm": null,
  "depthMm": null,
  "modules": null,
  "side": null,
  "status": "descatalogado",
  "discontinuedDate": "2024-04-05",
  "alternatives": [
   "A9A26904",
   "A9A26914"
  ],
  "source": "https://www.se.com/es/es/product/A9A26924/contacto-auxiliar-de-se%C3%B1alizaci%C3%B3n-acti9-iof-abierto-cerrado/",
  "facts": [
   "Schneider informa de fin de comercialización 05/04/2024",
   "Dos alternativas por rangos de corriente diferentes; NO sustitución automática"
  ]
 },
 {
  "brand": "Schneider",
  "ref": "A9A26927",
  "kind": "auxiliar_historico",
  "name": "Acti9 iSD antiguo, descatalogado",
  "function": "iSD",
  "widthMm": null,
  "heightMm": null,
  "depthMm": null,
  "modules": null,
  "side": null,
  "status": "descatalogado",
  "discontinuedDate": "2024-04-05",
  "alternatives": [
   "A9A26917",
   "A9A26907"
  ],
  "source": "https://www.se.com/es/es/product/A9A26927/isd-contacto-auxiliar/",
  "facts": [
   "Schneider informa de fin de comercialización 05/04/2024",
   "Reemplazos requieren confirmación de rangos y conexión; no equivalencia automática"
  ]
 }
].map(x=>Object.freeze(x)));
const byKey=(brand,ref)=>items.find(x=>x.brand===brand&&x.ref===ref)||null;
const possible=(brand,ref)=>byKey(brand,ref)?.additionalEquipment;
const replacements=(brand,ref)=>[...(byKey(brand,ref)?.alternatives||[])];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function report(a,brand){
 const issues=[],pending=[],ds=a?.devices||[];
 for(const d of ds){
  const candidate=a?.apparatusCandidates?.[d.id];
  if(!candidate||candidate.fabricante!==brand)continue;
  const row=byKey(brand,candidate.referencia);
  if(!row)continue;
  const name=(d.label||d.id)+' / '+brand+' '+candidate.referencia;
  const attached=[
   ...(a?.dinAccessoryAssemblies?.chains?.[d.id]||[]).filter(x=>x.brand===brand),
   ...(a?.physicalAccessoryPlans?.[d.id]?.brand===brand && a.physicalAccessoryPlans[d.id].side!=='comb'?[a.physicalAccessoryPlans[d.id]]:[])
  ];
  if(row.additionalEquipment===false&&attached.length)issues.push(name+': ficha oficial del anfitrión indica «No acepta auxiliares»; '+attached.length+' anotación(es) exigen revisión.');
  if(row.additionalEquipment===true&&attached.length)pending.push(name+': acepta equipos adicionales según ficha, pero compatibilidad con SKU de auxiliar concreto NO verificada.');
  if(row.status==='descatalogado')pending.push(name+': referencia DESCATALOGADA desde '+row.discontinuedDate+'; alternativas orientativas '+(row.alternatives||[]).join(', ')+', sin sustitución automática.');
 }
 return {issues,pending};
}
function render(){
 const n=items.filter(x=>x.brand==='Legrand').length,s=items.filter(x=>x.brand==='Schneider').length;
 const rows=items.map(x=>{
  const mm=(x.widthMm===null?'anchura pendiente':x.widthMm+' mm')+' × '+(x.heightMm===null?'altura pendiente':x.heightMm+' mm')+' × '+(x.depthMm===null?'fondo pendiente':x.depthMm+' mm');
  const units=x.modules===null?'módulos desconocidos':x.modules+' M nominales';
  let condition=x.status==='descatalogado'?'DESCATALOGADO '+x.discontinuedDate+'; opciones '+x.alternatives.join(' o '):
   x.additionalEquipment===false?'NO acepta auxiliares según fabricante':
   x.additionalEquipment===true?'Permite accesorios: combinación específica NO verificada':
   x.kind==='auxiliar'?'Accesorio documental; anfitrión, cotas y montaje pendientes':'Cotejo de SKU pendiente';
  return '<tr><td><strong>'+esc(x.brand+' '+x.ref)+'</strong></td><td>'+esc(x.name)+'</td><td>'+esc(mm+' · '+units)+'</td><td>'+esc(condition)+'<p class="tiny-hint">'+esc(x.facts.join(' · '))+'</p></td><td><a href="'+esc(x.source)+'" target="_blank" rel="noopener noreferrer">Fabricante ↗</a></td></tr>';
 }).join('');
 return '<details class="aux-physical-panel" data-manufacturer-r15><summary><strong>Ficha de fabricante · '+items.length+' SKU de Legrand DX³/TX³/RX³ y Schneider Acti9 ('+n+' Legrand, '+s+' Schneider)</strong></summary>'
  +'<p class="small-text">Consulta '+checkedOn+'. Medidas EXTERIORES por SKU, módulos nominales independientes, función diferencial, accesorios admitidos/prohibidos y retirada comercial; ningún dispositivo se aplica solo. No hay nuevos precios ni compra automática.</p>'
  +'<div class="table-wrap"><table class="materials-table"><thead><tr><th>Referencia</th><th>Función</th><th>Cotas individuales</th><th>Límites y estado</th><th>Ficha</th></tr></thead><tbody>'+rows+'</tbody></table></div></details>';
}
root.PanelManufacturerR15=Object.freeze({items,checkedOn,byKey,possible,replacements,report,render});
})(window);
