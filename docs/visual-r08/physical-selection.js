/* PanelBuilder R07 · Ficha compacta de selección física.
 * Solo lectura y controles UI; nunca infiere ficha comercial ni compatibilidad.
 * Fuente: modelo genérico actual. No modifica proyectos o DOM.
 */
(function(root){'use strict';
const types={MCB:'Magnetotérmico',MCB1:'Magnetotérmico',RCD:'Diferencial',
 SPD:'Protector de sobretensiones',SWITCH:'Seccionador',CONTACT:'Contactor'};
const positive=x=>typeof x==='number'&&Number.isFinite(x)&&x>0;
function describe(a,id){
 const d=(a?.devices||[]).find(x=>x.id===id);
 if(!d||!Number.isInteger(d.row)||!Number.isInteger(d.pos)||d.row<0||d.pos<0||
    d.row>=a.rows||d.pos+Number(d.modules)>a.slots)return null;
 const details=[];
 if(typeof d.poles==='string'&&d.poles.trim())details.push(d.poles.trim());
 if(positive(d.amp))details.push(d.amp+' A');
 if((d.kind==='MCB'||d.kind==='MCB1')&&d.curve)details.push('Curva '+d.curve);
 if(d.kind==='RCD'){
  if(positive(d.sensitivity))details.push(d.sensitivity+' mA');
  if(d.rcdType)details.push('Tipo '+d.rcdType);
 }
 if(d.kind==='SPD'){
  if(d.spdClass)details.push(d.spdClass);
  if(positive(d.spdUcV))details.push('Uc '+d.spdUcV+' V');
 }
 if(d.kind==='CONTACT'&&positive(d.contactCoilV))details.push('Bobina '+d.contactCoilV+' V');
 return {id:d.id,label:d.label,name:d.name||types[d.kind]||'Aparato',
  kind:types[d.kind]||d.kind||'Genérico',details,
  row:d.row+1,pos:d.pos+1,modules:Number(d.modules),
  fixed:a.dinLocks?.[id]===true};
}
function render(a,id,esc){
 const d=describe(a,id);
 if(!d)return '';
 const label=esc(d.label),name=esc(d.name),meta=esc(d.details.join(' · ')||'Características por completar');
 return '<section class="physical-selection-bar" data-physical-selection="'+esc(d.id)+'" aria-label="Aparato seleccionado">'
 +'<div class="physical-selection-main"><div class="physical-selection-title"><span class="physical-selection-dot" aria-hidden="true"></span>'
 +'<strong>'+label+'</strong><span>'+name+'</span></div>'
 +'<div class="physical-selection-meta"><span>'+esc(d.kind)+'</span><span>'+meta+'</span>'
 +'<button type="button" class="physical-selection-locate" data-physical-locate="'+esc(d.id)+'" aria-label="Localizar '+label+' en el cuadro" title="Ir a la protección en el cuadro">Carril '+d.row+' · M'+d.pos+' · '+d.modules+' M <span aria-hidden="true">↗</span></button>'
 +'<span class="physical-selection-lock">'+(d.fixed?'Posición fijada':'Posición libre')+'</span></div></div>'
 +'<div class="physical-selection-actions">'
 +'<button type="button" data-physical-edit="'+esc(d.id)+'" aria-label="Editar propiedades de '+label+'">Editar propiedades</button>'
 +'<button type="button" data-physical-lock="'+esc(d.id)+'" aria-label="'+(d.fixed?'Desbloquear':'Fijar')+' posición de '+label+'">'
 +(d.fixed?'Desbloquear posición':'Fijar posición')+'</button></div>'
 +'</section>';
}
/* Localización explícita: sin cambiar selección, datos ni distribución DIN. */
function locate(doc,id,reducedMotion=false){
 const core=doc?.querySelector?.('#editorArea .cabinet-core');
 if(!core||typeof core.querySelectorAll!=='function')return false;
 const target=Array.from(core.querySelectorAll('[data-physical-device]'))
  .find(el=>el.dataset.physicalDevice===id);
 if(!target||typeof target.scrollIntoView!=='function')return false;
 target.scrollIntoView({block:'center',inline:'nearest',behavior:reducedMotion?'auto':'smooth'});
 target.focus?.({preventScroll:true});
 return true;
}
root.PanelPhysicalSelection=Object.freeze({describe,render,locate});
})(window);
