/* PanelBuilder v0.11 - feedback visual EFÍMERO de reordenación DIN.
 * Ningún dato se almacena en el proyecto, historial o exportación.
 * Tres casos: aparato soltado, equipos empujados y cambios de carril.
 */
(function(root){'use strict';
let highlighted=[],cleanupTimer=null;
function changes(before,after,movingId){
 const left=new Map((before?.devices||[]).map(d=>[d.id,d]));
 return (after?.devices||[]).flatMap(d=>{
  const prior=left.get(d.id);
  if(!prior||!Number.isInteger(prior.row)||!Number.isInteger(prior.pos)
     ||!Number.isInteger(d.row)||!Number.isInteger(d.pos)
     ||prior.row===d.row&&prior.pos===d.pos)return [];
  return [{id:d.id,label:d.label,fromRow:prior.row,toRow:d.row,
    fromPos:prior.pos,toPos:d.pos,
    kind:d.id===movingId?'dragged':prior.row!==d.row?'crossrail':'shifted'}];
 });
}
function clear(){
 if(cleanupTimer!==null){root.clearTimeout(cleanupTimer);cleanupTimer=null;}
 highlighted.forEach(el=>{
  if(!el.isConnected)return;
  el.removeAttribute('data-din-motion');
  if(el.dataset.dinPriorTitle!==undefined){
   el.setAttribute('title',el.dataset.dinPriorTitle);
   delete el.dataset.dinPriorTitle;
  }
 });
 highlighted=[];
}
function flash(moves,doc=root.document){
 clear();
 if(!doc||!Array.isArray(moves)||!moves.length)return 0;
 const positions=new Map(moves.map(m=>[m.id,m]));
 doc.querySelectorAll('.rail-grid [data-physical-device]').forEach(el=>{
  const m=positions.get(el.dataset.physicalDevice);
  if(!m)return;
  el.dataset.dinPriorTitle=el.getAttribute('title')||'';
  el.dataset.dinMotion=m.kind;
  const detail=' · '+(m.kind==='dragged'?'Aparato colocado':m.kind==='crossrail'?'Desplazado de carril':'Recolocado')
    +' · C'+(m.fromRow+1)+' M'+(m.fromPos+1)+' → C'+(m.toRow+1)+' M'+(m.toPos+1);
  el.setAttribute('title',(el.dataset.dinPriorTitle||'')+detail);
  highlighted.push(el);
 });
 if(highlighted.length)cleanupTimer=root.setTimeout(clear,800);
 return highlighted.length;
}
root.PanelDINMotion=Object.freeze({changes,flash,clear});
})(window);
