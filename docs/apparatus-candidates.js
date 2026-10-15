/* PanelBuilder · cotejo DOCUMENTAL de aparamenta genérica con referencias comerciales.
   No calcula seguridad, ni aprueba utilización, ni modifica modelo, fabricante o módulos. */
(function(root){
'use strict';
const STATUS='candidata_no_validada',SOURCE='catalogo_documental';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function valid(a){
 const map=a?.apparatusCandidates;
 if(map===undefined)return true;
 if(!map||Array.isArray(map)||typeof map!=='object'||Object.keys(map).length>350)return false;
 const ids=new Set((a.devices||[]).map(d=>d.id));
 return Object.entries(map).every(([id,x])=>ids.has(id)&&x&&typeof x==='object'&&!Array.isArray(x)
  &&Object.keys(x).every(k=>['fabricante','referencia','estado','fuente'].includes(k))
  &&typeof x.fabricante==='string'&&x.fabricante.length>0&&x.fabricante.length<=80
  &&typeof x.referencia==='string'&&x.referencia.length>0&&x.referencia.length<=80
  &&x.estado===STATUS&&x.fuente===SOURCE);
}
function normalizePoles(x){
 if(x===null||x===undefined||String(x).trim()==='')return null;
 if(typeof x==='number'&&Number.isInteger(x)&&x>=1&&x<=4)return x+'P';
 const p=String(x).trim().toUpperCase().replace(/\s+/g,'');
 return /^[1-4]P(?:\+N)?$/.test(p)?p:null;
}
function isRccb(x){
 if(x.categoria!=='diferencial')return false;
 const label=String(x.descripcion||''),type=String(x.atributos?.tipo||'');
 return (type.toUpperCase()==='RCCB'||/\bRCCB\b/i.test(label))
   && !/\bRCBO\b|bloque diferencial|combinad[oa]|magnetot[eé]rmic[oa]\s+diferencial/i.test(label);
}
function kindCategory(d){return d.kind==='MCB'||d.kind==='MCB1'?'magnetotermico':d.kind==='RCD'?'diferencial':null;}
function evaluate(d,x){
 const failures=[],pending=[],matches=[];
 const category=kindCategory(d);
 if(!category)return {eligible:false,failures:['Esta familia requiere un perfil técnico específico antes de comparar.'],pending:[],matches:[]};
 if(x.categoria!==category)return {eligible:false,failures:['Función distinta del equipo genérico.'],pending:[],matches:[]};
 if(category==='diferencial'&&!isRccb(x)){
  return {eligible:false,failures:['No es un RCCB independiente acreditado (puede ser RCBO o bloque diferencial).'],pending:[],matches:[]};
 }
 const at=x.atributos||{};
 function exact(label,expected,actual){
  if(expected===null||expected===undefined||String(expected)===''){
   failures.push(label+': sin definir en el modelo genérico.');return;
  }
  if(actual===null||actual===undefined||String(actual)===''){
   failures.push(label+': ausente en la ficha comercial.');return;
  }
  if(String(expected)!==String(actual))failures.push(label+': proyecto '+expected+' / ficha '+actual+'.');
  else matches.push(label+': '+expected);
 }
 exact('Polos',normalizePoles(d.poles),normalizePoles(at.polos));
 exact('Intensidad',Number(d.amp)>0?Number(d.amp):null,Number(at.amp)>0?Number(at.amp):null);
 if(category==='magnetotermico'){
  exact('Curva',d.curve||null,at.curva||null);
  // IEC 60898 Icn is NOT interchangeable with IEC 60947 Icu or Ics.
  const icn=Number(at.icn_60898_ka??at.icn_ka)||null;
  const req=Number(d.breakingKa)>0?Number(d.breakingKa):null;
  if(req!==null&&icn!==null&&icn<req)failures.push('Icn (IEC 60898): '+icn+' kA es inferior a los '+req+' kA solicitados.');
  else if(icn===null&&req!==null)failures.push('Icn IEC 60898 no documentado para los '+req+' kA exigidos; Icu no lo sustituye.');
  else if(icn===null)pending.push('Icn IEC 60898 no documentado; Icu no lo sustituye.');
  else matches.push('Icn documentado: '+icn+' kA'+(req===null?' (sin mínimo de proyecto)':' ≥ '+req+' kA solicitados'));
  if(req===null)pending.push('Definir poder de corte requerido y condiciones del circuito.');
  pending.push('Comprobar Icu/Ics cuando proceda, tensión, coordinación y bornes.');
 }else{
  exact('Sensibilidad',Number(d.sensitivity)>0?Number(d.sensitivity):null,Number(at.idn_ma??at.sensibilidad_ma)>0?Number(at.idn_ma??at.sensibilidad_ma):null);
  exact('Tipo diferencial',d.rcdType||null,at.tipo_rcd??at.tipo_diferencial??null);
  if(at.retardo&&!d.rcdDelay)failures.push('La ficha declara '+at.retardo+' retardo y el proyecto no lo especifica.');
  else if(at.retardo&&d.rcdDelay!==at.retardo)failures.push('Retardo de actuación diferente.');
  pending.push('Comprobar tensión, capacidad de cortocircuito condicional, selectividad y compatibilidad con cargas.');
 }
 const modules=Number(at.modulos);
 if(!Number.isInteger(modules)||modules<1)pending.push('Ancho modular exacto por confirmar; no se modifica la distribución DIN.');
 else matches.push('Ocupación comercial declarada: '+modules+' M (no se aplica al proyecto)');
 if(!(typeof x.url_oficial==='string'&&x.url_oficial.startsWith('https://')))failures.push('Falta ficha oficial verificable.');
 return {eligible:failures.length===0,failures,pending,matches};
}
function list(d,brand=''){
 const category=kindCategory(d);
 if(!category)return [];
 return root.PanelCommercial.search('',brand,category).map(record=>({record,...evaluate(d,record)}))
 .sort((a,b)=>Number(b.eligible)-Number(a.eligible)
  ||a.failures.length-b.failures.length||a.record.fabricante.localeCompare(b.record.fabricante)||a.record.referencia.localeCompare(b.record.referencia));
}
function getSelection(a,d){
 const sel=a.apparatusCandidates?.[d.id];
 if(!sel)return null;
 const record=root.PanelCommercial.get(sel.fabricante,sel.referencia);
 const review=record?evaluate(d,record):{eligible:false,failures:['Referencia ya no incluida en el catálogo.'],pending:[],matches:[]};
 return {selection:sel,record,review};
}
function choose(a,id,brand,ref){
 const d=(a.devices||[]).find(x=>x.id===id);
 if(!d)return false;
 const record=root.PanelCommercial.get(brand,ref);
 if(!record||!evaluate(d,record).eligible)return false;
 a.apparatusCandidates={...(a.apparatusCandidates||{}),[id]:{fabricante:brand,referencia:ref,estado:STATUS,fuente:SOURCE}};
 return true;
}
function clear(a,id){if(a.apparatusCandidates)delete a.apparatusCandidates[id];}
function checks(a){
 const result=[];
 for(const d of a.devices||[]){
  const info=getSelection(a,d);
  if(!info)continue;
  const header='Aparato '+d.label+' · '+info.selection.fabricante+' '+info.selection.referencia+': ';
  if(!info.review.eligible)result.push(header+'referencia INCOMPATIBLE con los parámetros actuales o datos críticos incompletos. '+info.review.failures.join(' '));
  else result.push(header+'SOLO CANDIDATA DOCUMENTAL, no autorizada para montaje. '+info.review.pending.join(' '));
 }
 return result;
}
function price(record){
 if(record.pvp_sin_iva_eur!==null&&record.pvp_sin_iva_eur!==undefined)
  return record.pvp_sin_iva_eur.toLocaleString('es-ES',{style:'currency',currency:'EUR'})+' recomendado sin IVA · vigencia no acreditada';
 if(record.precio_publicado_eur!==null&&record.precio_publicado_eur!==undefined)
  return record.precio_publicado_eur.toLocaleString('es-ES',{style:'currency',currency:'EUR'})+' publicado · IVA sin confirmar';
 return 'Precio no documentado';
}
function summary(a,d){
 const item=getSelection(a,d);
 if(!item)return '';
 if(!item.record)return '<section class="apparatus-selected" data-apparatus-selected="'+escape(d.id)+'"><strong>Candidata '+escape(item.selection.fabricante)+' '+escape(item.selection.referencia)+' no encontrada en la biblioteca.</strong><button type="button" class="button small" data-apparatus-clear="'+escape(d.id)+'">Quitar</button></section>';
 return '<section class="apparatus-selected" data-apparatus-selected="'+escape(d.id)+'"><strong>Candidata '+escape(item.record.fabricante)+' '+escape(item.record.referencia)+' · '+(item.review.eligible?'Sin validar':'No coincide con el proyecto actual')+'</strong>'
 +'<p>'+escape(item.record.descripcion)+'</p>'
 +'<p class="small-text">'+escape(price(item.record))+'</p>'
 +'<p class="small-text">'+item.review.pending.map(escape).join(' · ')+'</p>'
 +'<a href="'+escape(item.record.url_oficial)+'" class="small-link" target="_blank" rel="noopener noreferrer">Consultar ficha del fabricante ↗</a>'
 +'<button type="button" class="button small" data-apparatus-clear="'+escape(d.id)+'">Quitar candidata</button></section>';
}
function inspector(a,d){
 const category=kindCategory(d),items=list(d),eligible=items.filter(x=>x.eligible),blocked=items.filter(x=>!x.eligible),selected=a.apparatusCandidates?.[d.id];
 let out='<details class="apparatus-compare" '+(a.apparatusCandidates?.[d.id]?'open':'')+'><summary>Comparar referencias comerciales · opcional</summary><div class="section-heading">COMPARADOR DOCUMENTAL · SIN VALIDACIÓN</div>';
 if(!category){
  return out+'<p class="tiny-hint">SPD, contactores y seccionadores necesitan perfiles propios de red, bobina, contactos y capacidades. Sin selección por parecido textual.</p></details>';
 }
 out+='<p class="tiny-hint">Comparación sobre el dispositivo genérico sin cambiar su circuito ni ocupación. Filtramos polos, intensidad, curva o sensibilidad/tipo. Las coincidencias NO certifican un conjunto.</p>';
 out+=summary(a,d);
 out+='<div class="candidate-count">'+eligible.length+' candidata(s) documentales con parámetros básicos coincidentes · '+blocked.length+' incompatible(s) o incompleta(s)</div>';
 if(eligible.length){
  out+='<div class="apparatus-candidates">'+eligible.slice(0,10).map(x=>{
   const b=x.record;
   const selectedHere=selected?.fabricante===b.fabricante&&selected?.referencia===b.referencia;
   return '<article class="apparatus-candidate" data-apparatus-option="'+escape(b.referencia)+'" data-apparatus-brand="'+escape(b.fabricante)+'"><strong>'+escape(b.fabricante)+' · '+escape(b.referencia)+'</strong><p>'+escape(b.descripcion)+'</p><small>'+escape(x.matches.join(' · '))+'</small><small>'+escape(x.pending.join(' · '))+'</small><small>'+escape(price(b))+'</small><a href="'+escape(b.url_oficial)+'" target="_blank" rel="noopener noreferrer" class="small-link">Ficha oficial ↗</a><button type="button" class="button small" data-apparatus-pick="'+escape(d.id)+'" data-apparatus-ref="'+escape(b.referencia)+'" data-apparatus-pick-brand="'+escape(b.fabricante)+'" '+(selectedHere?'disabled':'')+'>'+(selectedHere?'Candidata guardada':'Guardar como candidata')+'</button></article>';
  }).join('')+'</div>';
 }else out+='<p class="tiny-hint">No hay referencia seleccionable con los datos actuales. No equivale a inexistencia comercial.</p>';
 if(blocked.length)out+='<details class="apparatus-blocked"><summary>'+blocked.length+' referencia(s) bloqueada(s) por discrepancias</summary><div>'+blocked.slice(0,20).map(x=>'<p><strong>'+escape(x.record.fabricante)+' '+escape(x.record.referencia)+'</strong> · '+escape(x.failures.join(' · '))+'</p>').join('')+'</div></details>';
 return out+'<p class="tiny-hint">Selección independiente del antiguo selector de fabricante del prototipo. No asigna PVP al presupuesto ni altera el diseño DIN.</p></details>';
}
root.PanelApparatusCandidates=Object.freeze({valid,normalizePoles,isRccb,kindCategory,evaluate,list,getSelection,choose,clear,checks,summary,inspector});
})(window);
