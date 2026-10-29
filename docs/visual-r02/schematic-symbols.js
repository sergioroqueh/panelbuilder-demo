/* PanelBuilder · pictogramas unifilares revisados frente a 3 referencias
   visuales proporcionadas por el usuario el 15/10/2026.
   Construcciones SVG originales; geometría aún NO verificada conforme IEC 60617.
   La simbología NO modifica la topología de los conductores ni las protecciones.
 */
(function(root){
 'use strict';

 const ink='#414c58', muted='#87929f';
 const path=(d,extra='')=>`<path d="${d}" fill="none" stroke="${ink}" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
 const faint=(d)=>`<path d="${d}" fill="none" stroke="${muted}" stroke-width="1.35" stroke-linecap="square" stroke-linejoin="miter"/>`;
 const ring=(cy)=>`<circle class="symbol-terminal" cx="0" cy="${cy}" r="3.05" fill="#fff" stroke="${ink}" stroke-width="1.35"/>`;

 // 1) SPD: envolvente vertical, conductor pasante y diagonal acodada.
 // No debe confundirse esta forma gráfica con una conexión en paralelo ya modelada.
 function spd(){
  return `<g class="symbol-spd-reference">
   ${path('M 0 -32 V 32')}
   <rect class="symbol-spd-body" x="-9" y="-21" width="18" height="42" fill="#fff" stroke="#8b969f" stroke-width="1.35"/>
   ${faint('M -20 21 V 7 L 22 -9 V -24')}
  </g>`;
 }

 // 2) MCB: borne superior, contacto abierto sobre borne inferior,
 // disparador angular a la derecha y triángulo negro de accionamiento.
 function mcb(){
  return `<g class="symbol-mcb-reference">
   ${path('M 0 -32 V -24 M 0 20 V 32')}
   ${ring(-21)}${ring(17)}
   ${path('M 0 14 L 11 -16')}
   ${faint('M 6 -1 L 15 5 L 20 -8 L 31 0 L 27 12 L 39 19')}
   ${faint('M 2 6 L 13 15')}
   <path class="symbol-mcb-trip" d="M 13 10 L 20 22 L 7 22 Z" fill="#25282d"/>
  </g>`;
 }

 // 3) RCD: contactos superior/inferior, contacto móvil ascendente,
 // toroide inferior y conexión lateral del circuito de prueba ilustrado.
 function rcd(){
  return `<g class="symbol-rcd-reference">
   ${path('M 0 -32 V -23 M 0 8 V 32')}
   ${ring(-20)}${ring(5)}
   ${path('M 0 2 L 13 -17')}
   ${faint('M 8 -6 H 31 V 21 H 15')}
   <ellipse class="symbol-rcd-toroid" cx="0" cy="21" rx="15.5" ry="7.4" fill="none" stroke="${ink}" stroke-width="1.4"/>
  </g>`;
 }

 // El resto conserva símbolos de contacto provisionales ya diferenciados.
 function switchFigure(){
  return `<g class="symbol-switch-reference">
   ${path('M 0 -32 V -18 M 0 18 V 32 M 0 14 L 12 -12')}
   ${ring(-15)}${ring(16)}
  </g>`;
 }
 function contactor(){
  return `<g class="symbol-contactor-reference">
   ${path('M 0 -32 V -18 M 0 18 V 32 M 0 14 L 12 -12')}
   ${ring(-15)}${ring(16)}
   ${faint('M 17 -12 V 14')}
   <text x="20" y="-10" font-family="Arial,sans-serif" font-size="8" fill="${ink}">KM</text>
  </g>`;
 }
 const figures=Object.freeze({SPD:spd,MCB:mcb,RCD:rcd,SWITCH:switchFigure,CONTACT:contactor});
 const definitions=Object.freeze({
  MCB:{id:null,name:'Magnetotérmico',status:'calco SVG original basado en referencia visual del usuario; cotejo IEC pendiente'},
  RCD:{id:null,name:'Diferencial',status:'calco SVG original basado en referencia visual del usuario; cotejo IEC pendiente'},
  SPD:{id:null,name:'Protector de sobretensiones',status:'referencia visual del usuario; conexión real en derivación pendiente'},
  SWITCH:{id:null,name:'Interruptor seccionador',status:'geometría funcional provisional'},
  CONTACT:{id:null,name:'Contactor',status:'geometría funcional provisional'}
 });
 function render(kind,x,y){
  const symbol=figures[kind]?kind:'OTHER';
  const content=figures[kind]?figures[kind]():`<g>${path('M 0 -32 V -10 M 0 10 V 32')}<circle r="9" fill="#fff" stroke="${ink}"/><text y="3" text-anchor="middle" font-size="10">?</text></g>`;
  return `<g class="one-line-symbol symbol-reference-v3" data-symbol-kind="${symbol}" data-symbol-validation="pending" transform="translate(${Number(x)} ${Number(y)})" pointer-events="none" aria-hidden="true">${content}</g>`;
 }
 root.PanelSymbols=Object.freeze({render,definitions,revision:'user-reference-2026-10-15'});
})(window);
