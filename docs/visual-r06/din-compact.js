/* PanelBuilder R04: compactación modular a la izquierda por carril.
 * No cambia el orden, la fila, el unifilar ni las reservas y bloqueos.
 * No valida montaje/compatibilidad física: solamente posiciones DIN nominales.
 */
(function(root){'use strict';
const R=()=>root.PanelDINReflow;
const integer=Number.isInteger;
function plan(a,row){
 if(!a||!integer(a.rows)||!integer(a.slots)||a.rows<1||a.slots<1||
    !integer(row)||row<0||row>=a.rows)return {ok:false,reason:'Carril DIN no válido.'};
 if(!R()||!R().validLocks(a)||!R().validClearances(a)||!R().audit(a).clear)
  return {ok:false,reason:'Revisa antes las posiciones, bloqueos y reservas de la distribución DIN.'};
 const devices=(a.devices||[]).filter(d=>d.row===row)
  .sort((x,y)=>R().occupied(a,x).start-R().occupied(a,y).start||
       x.pos-y.pos||x.id.localeCompare(y.id));
 const positions={};let cursor=0;
 for(const d of devices){
  const original=R().occupied(a,d);
  const fixed=R().pinned(a,d.id);
  const start=fixed?original.start:cursor;
  if(start<cursor||start>original.start&& !fixed)
   return {ok:false,reason:'No se puede compactar sin alterar el orden o los equipos fijados.'};
  const end=start+R().footprint(a,d);
  if(end>a.slots)return {ok:false,reason:'La ocupación o las reservas exceden el carril.'};
  positions[d.id]={row,pos:fixed?d.pos:start+R().leftModules(a,d)};
  cursor=end;
 }
 const trial={...a,devices:a.devices.map(d=>positions[d.id]?{...d,...positions[d.id]}:d)};
 if(!R().audit(trial).clear)
  return {ok:false,reason:'La compactación propuesta no supera la auditoría DIN.'};
 const movements=devices.filter(d=>d.pos!==positions[d.id].pos)
  .map(d=>({id:d.id,label:d.label,from:d.pos,to:positions[d.id].pos}));
 return {ok:true,row,signature:R().signature(a),positions,movements,
  movable:devices.filter(d=>!R().pinned(a,d.id)).length,
  pinned:devices.filter(d=>R().pinned(a,d.id)).length};
}
function apply(a,proposal){
 if(!proposal?.ok||!proposal.movements?.length||
    R().signature(a)!==proposal.signature)return false;
 const fresh=plan(a,proposal.row);
 if(!fresh.ok||JSON.stringify(fresh.positions)!==JSON.stringify(proposal.positions))return false;
 for(const d of a.devices||[]){
  if(Object.prototype.hasOwnProperty.call(fresh.positions,d.id))
   d.pos=fresh.positions[d.id].pos;
 }
 return true;
}
root.PanelDINCompact=Object.freeze({plan,apply});
})(window);
