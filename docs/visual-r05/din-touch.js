/* PanelBuilder R05: mover aparatos por toques, sin gesto drag.
 * Capa pura de destino. Reutiliza PanelDINInsert (bloqueos, reservas y auditoria).
 * Las acciones de interfaz son efimeras; nunca se serializan en el proyecto.
 */
(function(root){'use strict';
const integer=Number.isInteger;
function target(a,row,hit){
 if(!a||!integer(a.rows)||!integer(a.slots)||!integer(row)||row<0||row>=a.rows)
  return null;
 if(!hit||!['left','right'].includes(hit.side))return null;
 let boundary;
 if(hit.deviceId){
  const d=(a.devices||[]).find(d=>d.id===hit.deviceId&&d.row===row&&integer(d.pos));
  if(!d)return null;
  const occupied=root.PanelDINReflow.occupied(a,d);
  boundary=hit.side==='left'?occupied.start:occupied.end;
 }else{
  if(!integer(hit.slot)||hit.slot<0||hit.slot>=a.slots)return null;
  boundary=hit.slot+(hit.side==='right'?1:0);
 }
 if(!integer(boundary)||boundary<0||boundary>a.slots)return null;
 return {row,boundary};
}
function plan(a,movingId,row,hit){
 const t=target(a,row,hit);
 return t?root.PanelDINInsert.plan(a,movingId,t.row,t.boundary):
  {ok:false,reason:'Selecciona un aparato o un espacio válido del carril.'};
}
root.PanelDINTouch=Object.freeze({target,plan});
})(window);
