/* PanelBuilder v0.11 - inserción asistida dentro de un carril DIN.
 * Plan no mutante: recoloca un bloque conservando orden relativo y respeta
 * fijaciones, reserva de accesorios, capacidad y confirmación explícita.
 */
(function(root){'use strict';
const R=()=>root.PanelDINReflow;
const isInt=Number.isInteger;
function byOrder(a,row,id){
 return (a.devices||[]).filter(d=>d.id!==id&&d.row===row)
  .sort((x,y)=>R().occupied(a,x).start-R().occupied(a,y).start||x.pos-y.pos||x.id.localeCompare(y.id));
}
function positionFor(a,movingId,row,boundary){
 const others=byOrder(a,row,movingId);
 if(!isInt(boundary)||boundary<0||boundary>a.slots)return null;
 return others.findIndex(d=>R().occupied(a,d).start>=boundary);
}
function plan(a,movingId,row,boundary){
 if(!isInt(a?.rows)||!isInt(a?.slots)||a.rows<1||a.slots<1||!isInt(row)||row<0||row>=a.rows)
  return {ok:false,reason:'Primero calcula una distribución física válida.'};
 const moving=(a.devices||[]).find(d=>d.id===movingId);
 if(!moving||!isInt(moving.row)||!isInt(moving.pos))
  return {ok:false,reason:'Selecciona un aparato ya colocado en el cuadro.'};
 if(R().pinned(a,movingId))
  return {ok:false,reason:'El dispositivo arrastrado tiene posición fijada. Desbloquéala primero.'};
 if(!R().validLocks(a)||!R().validClearances(a)||!R().audit(a).clear)
  return {ok:false,reason:'Hay reservas o posiciones pendientes/solapadas. Revisa la distribución DIN antes de intercalar.'};
 if(!isInt(boundary)||boundary<0||boundary>a.slots)
  return {ok:false,reason:'El límite de inserción elegido está fuera del carril.'};
 const old=byOrder(a,row,movingId),idx=positionFor(a,movingId,row,boundary);
 if(idx===null)return {ok:false,reason:'Punto de inserción inválido.'};
 const at=idx<0?old.length:idx;
 const order=[...old.slice(0,at),moving,...old.slice(at)];
 const current=Object.fromEntries(a.devices.map(d=>[d.id,{row:d.row,pos:d.pos}]));
 const signature=R().signature(a);
 function build(compact){
  const positions={...current};let cursor=0;
  for(const d of order){
   const extraLeft=R().leftModules(a,d),actual=R().occupied(a,d);
   // Reservar los módulos que ocupan el aparato y sus accesorios sin asumir sus dimensiones exactas.
   const start=d.id===movingId
    ?Math.max(cursor,compact?0:boundary)
    :R().pinned(a,d.id)?actual.start
    :Math.max(cursor,compact?0:actual.start);
   const end=start+R().footprint(a,d);
   if(start<cursor||end>a.slots)return null;
   const pos=start+extraLeft;
   if(R().pinned(a,d.id)&&(pos!==d.pos||row!==d.row))return null;
   positions[d.id]={row,pos};cursor=end;
  }
  const trial={...a,devices:a.devices.map(d=>({...d,...positions[d.id]}))};
  if(!R().audit(trial).clear)return null;
  return positions;
 }
 const original=build(false), positions=original||build(true);
 if(!positions)return {ok:false,reason:'No cabe en este carril respetando el orden, las reservas laterales y las posiciones fijadas. Usa la redistribución DIN asistida o revisa la envolvente.'};
 const movements=a.devices.filter(d=>d.pos!==positions[d.id].pos||d.row!==positions[d.id].row)
   .map(d=>({id:d.id,label:d.label,from:'C'+(d.row+1)+' M'+(d.pos+1),
     to:'C'+(positions[d.id].row+1)+' M'+(positions[d.id].pos+1)}));
 if(!movements.length)return {ok:false,reason:'Este aparato ya ocupa la posición elegida.'};
 return {ok:true,signature,movingId,row,boundary,positions,movements,compacted:!original,
    target:'Carril '+(row+1)+' · junto a '+(at<old.length?old[at].label:'final del carril'),
    unchanged:a.devices.length-movements.length};
}
function apply(a,p){
 if(!p?.ok||R().signature(a)!==p.signature)return false;
 const fresh=plan(a,p.movingId,p.row,p.boundary);
 if(!fresh.ok||JSON.stringify(fresh.positions)!==JSON.stringify(p.positions))return false;
 a.devices.forEach(d=>{d.row=p.positions[d.id].row;d.pos=p.positions[d.id].pos;});
 // Mantener 'layoutDirty' si ya existían otras tareas de revisión física.
 return true;
}
function render(p,esc){
 if(!p?.ok)return '';
 return '<section class="aux-physical-panel din-insert-review" data-din-insert-preview="true" tabindex="-1" aria-label="Confirmar inserción física DIN">'
  +'<div class="aux-physical-head"><strong>Vista previa · intercalar aparato en carril DIN</strong></div>'
  +'<p class="small-text">'+esc(p.target)+'. '+p.movements.length+' aparato(s) cambian de posición; '
  +p.unchanged+' conservan su ubicación.'+(p.compacted?' Se han compactado huecos existentes para hacer sitio.':'')+'</p>'
  +'<div class="din-insert-moves">'+p.movements.map(m=>'<p class="small-text">'+esc(m.label)+': '+esc(m.from)+' → '+esc(m.to)+'</p>').join('')+'</div>'
  +'<p class="tiny-hint">Solo distribución modular provisional. Se respetan equipos fijados y reservas DIN declaradas; peines, cableado, ventilación y geometría comercial requieren revisión. El unifilar no cambia.</p>'
  +'<div class="din-insert-actions"><button type="button" class="button primary small" data-din-insert-action="confirm">Aplicar posiciones indicadas</button>'
  +'<button type="button" class="button small" data-din-insert-action="cancel">Cancelar</button></div></section>';
}
root.PanelDINInsert=Object.freeze({plan,apply,render});
})(window);
