/* PanelBuilder v0.11 · cotas de montaje APORTADAS POR EL USUARIO.
 * No deducir saliente DIN a puerta ni proyecciones verticales de las dimensiones
 * exteriores de las fichas comerciales. No es verificación constructiva.
 */
(function(root){'use strict';
const MAX_MM=10000,MAX_ROWS=10,FIELDS=['frontMm','aboveMm','belowMm'];
const mm=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=MAX_MM;
function valid(a){
 const devs=a?.dinMountProjectionMm,doors=a?.dinRailDoorMm;
 if(devs!==undefined){
  if(!devs||typeof devs!=='object'||Array.isArray(devs)||Object.keys(devs).length>350)return false;
  const ids=new Set((a.devices||[]).map(d=>d.id));
  if(!Object.entries(devs).every(([id,x])=>ids.has(id)&&x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length>0&&
   Object.entries(x).every(([k,v])=>FIELDS.includes(k)&&mm(v))))return false;
 }
 if(doors!==undefined){
  if(!doors||typeof doors!=='object'||Array.isArray(doors)||Object.keys(doors).length>MAX_ROWS)return false;
  if(!Object.entries(doors).every(([r,v])=>/^(0|[1-9])$/.test(r)&&Number(r)<MAX_ROWS&&mm(v)))return false;
 }
 return true;
}
function parse(raw){
 if(String(raw).trim()==='')return {ok:true,value:null};
 const v=Number(raw);
 return mm(v)?{ok:true,value:v}:{ok:false};
}
function setDevice(a,id,field,raw){
 if(!FIELDS.includes(field)||!(a.devices||[]).some(d=>d.id===id))return false;
 const next=parse(raw);if(!next.ok)return false;
 const maps={...(a.dinMountProjectionMm||{})},old={...(maps[id]||{})};
 if(next.value===null)delete old[field];else old[field]=next.value;
 if(Object.keys(old).length)maps[id]=old;else delete maps[id];
 a.dinMountProjectionMm=maps;return true;
}
function setDoor(a,row,raw){
 const r=Number(row);
 if(!Number.isInteger(r)||r<0||r>=Number(a.rows)||r>=MAX_ROWS)return false;
 const next=parse(raw);if(!next.ok)return false;
 const map={...(a.dinRailDoorMm||{})};
 if(next.value===null)delete map[r];else map[r]=next.value;
 a.dinRailDoorMm=map;return true;
}
function clearProfiles(a){a.dinMountProjectionMm={};}
function report(a){
 const issues=[],pending=[],devs=a.devices||[],profiles=a.dinMountProjectionMm||{},doors=a.dinRailDoorMm||{};
 const rows=Number(a.rows)||0,pitch=a.enclosureGeometry?.railPitchMm;
 let frontChecks=0,verticalChecks=0,frontDeclared=0,verticalDeclared=0;
 for(const d of devs){
  if(!Number.isInteger(d.row)||!Number.isInteger(d.pos)||d.row<0||d.row>=rows)continue;
  const front=profiles[d.id]?.frontMm,gap=doors[d.row];
  if(front!==undefined)frontDeclared++;
  if(front===undefined||gap===undefined){
   pending.push(d.label+': distancia frontal desde carril hasta puerta sin cotejar ('+
    (front===undefined?'falta saliente del aparato':'falta distancia carril-puerta')+').');
  }else{
   frontChecks++;
   if(front>gap+0.01)issues.push(d.label+': saliente desde DIN de '+front+' mm supera distancia carril-puerta de '+gap+' mm (carril '+(d.row+1)+').');
  }
 }
 // Solo equipos alineados en horizontal y filas consecutivas. No se presupone
 // forma/anchura de accesorios verticales ni sobreespacio útil.
 for(let row=0;row<rows-1;row++){
  const upper=devs.filter(d=>d.row===row&&Number.isInteger(d.pos));
  const lower=devs.filter(d=>d.row===row+1&&Number.isInteger(d.pos));
  for(const d of upper)for(const e of lower){
   const dx=d.pos,ex=e.pos, dw=root.PanelDINReflow?.footprint(a,d)??Number(d.modules),
    ew=root.PanelDINReflow?.footprint(a,e)??Number(e.modules);
   if(!(dx<ex+ew&&ex<dx+dw))continue;
   const below=profiles[d.id]?.belowMm,above=profiles[e.id]?.aboveMm;
   if(below!==undefined&&above!==undefined)verticalDeclared++;
   if(!(typeof pitch==='number'&&pitch>0)||below===undefined||above===undefined){
    pending.push(d.label+' / '+e.label+': voladizos verticales o distancia entre ejes DIN pendientes de cotejar.');
    continue;
   }
   verticalChecks++;
   if(below+above>pitch+0.01)
    issues.push('Carriles '+(row+1)+'-'+(row+2)+': '+d.label+' ('+below+' mm bajo eje) y '+e.label+
     ' ('+above+' mm sobre eje) suman '+(below+above)+' mm; paso DIN declarado '+pitch+' mm.');
  }
 }
 return {issues,pending,frontChecks,verticalChecks,frontDeclared,verticalDeclared};
}
function input(attr,label,value){
 return '<label style="display:grid;gap:4px;font-size:12px">'+label+
  '<input '+attr+' type="number" min="0" max="10000" step="0.1" value="'+
  (value??'')+'" placeholder="Sin medir" style="width:100%;padding:8px;border:1px solid #9daab9;border-radius:5px;background:transparent;color:inherit"></label>';
}
function inspector(a,d,esc){
 const p=a.dinMountProjectionMm?.[d.id]||{},id=esc(d.id);
 return '<details data-mount-device-form="'+id+'" class="mounting-device-form"><summary>Medidas de montaje desde el carril DIN · opcional</summary>'+
  '<p class="tiny-hint">Solo valores medidos o extraídos de un plano específico de montaje. La altura, profundidad y anchura TOTAL de catálogo NO son proyecciones desde el carril.</p>'+
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px">'+
  input('data-mount-device="'+id+'" data-mount-field="frontMm"','Saliente hacia la puerta desde el plano de fijación DIN (mm)',p.frontMm)+
  input('data-mount-device="'+id+'" data-mount-field="aboveMm"','Extensión superior desde el eje DIN (mm)',p.aboveMm)+
  input('data-mount-device="'+id+'" data-mount-field="belowMm"','Extensión inferior desde el eje DIN (mm)',p.belowMm)+
  '</div><p class="tiny-hint">Vacío = desconocido, no cero. Estas mediciones se invalidan al cambiar las características eléctricas o el fabricante.</p></details>';
}
function railForm(a,esc){
 return '<section class="aux-physical-panel" data-mount-rail-form="true"><div class="aux-physical-head"><strong>Separación carril DIN → cara interior puerta</strong></div>'+
  '<p class="small-text">Medir la distancia disponible desde el mismo plano de fijación DIN utilizado para medir los salientes de los aparatos. No utilizar la profundidad total de la envolvente ni la de la ficha como sustituto.</p>'+
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px">'+
  Array.from({length:Math.min(MAX_ROWS,Math.max(0,Number(a.rows)||0))},(_,r)=>
   input('data-mount-rail="'+r+'"','Carril '+(r+1)+' · hasta puerta (mm)',a.dinRailDoorMm?.[r])).join('')+
  '</div><p class="tiny-hint">No considera bisagras, placa de montaje, tapas interiores, cierre, conductores ni distancias obligatorias de accesorios.</p></section>';
}
function summary(a,esc){
 if(!(Number(a.rows)>0))return '';
 const r=report(a);
 return '<section class="aux-physical-panel" data-mount-summary="true"><div class="aux-physical-head"><strong>'+
  (r.issues.length?'⚠ Conflictos de montaje detectados':'Cotejo de proyecciones de montaje · preliminar')+'</strong></div>'+
  '<p class="small-text">'+r.frontChecks+' comprobación(es) carril-puerta · '+r.verticalChecks+
  ' pareja(s) de aparatos entre carriles cotejadas; '+r.pending.length+' dato(s)/pareja(s) pendientes.</p>'+
  r.issues.map(x=>'<p class="pending-check">⚠ '+esc(x)+'</p>').join('')+
  '<details><summary>Ver medidas que faltan y límites</summary>'+
  r.pending.slice(0,15).map(x=>'<p class="tiny-hint">Pendiente: '+esc(x)+'</p>').join('')+
  (r.pending.length>15?'<p class="tiny-hint">Y '+(r.pending.length-15)+' comprobaciones pendientes adicionales.</p>':'')+
  '<p class="tiny-hint">Solo detecta incompatibilidades obvias con medidas declaradas. Sin cotas de montaje o fuente de medidas no permite aprobar el cuadro.</p></details></section>';
}
root.PanelMountClearance=Object.freeze({valid,setDevice,setDoor,clearProfiles,report,inspector,railForm,summary});
})(window);
