/* PanelBuilder · propuesta reversible de redistribución DIN (no validación eléctrica). */
(function(root){'use strict';
const DIN_MM=18; // paso de planificación, no dimensión de fabricante.
function validClearances(a){
 const map=a?.dinClearancesMm;if(map===undefined)return true;
 if(!map||typeof map!=='object'||Array.isArray(map)||Object.keys(map).length>350)return false;
 const ids=new Set((a.devices||[]).map(d=>d.id));
 return Object.entries(map).every(([id,v])=>ids.has(id)&&typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=300);
}
function setClearance(a,id,raw){
 if(!(a.devices||[]).some(d=>d.id===id))return false;
 const v=String(raw).trim()===''?0:Number(raw);
 if(!Number.isFinite(v)||v<0||v>300)return false;
 a.dinClearancesMm={...(a.dinClearancesMm||{})};
 if(v===0)delete a.dinClearancesMm[id];else a.dinClearancesMm[id]=v;
 a.layoutDirty=true;return true;
}
function extraMm(a,id){return a?.dinClearancesMm?.[id]||0;}
function footprint(a,d){return Number(d.modules)+Math.ceil(extraMm(a,d.id)/DIN_MM);}
const pinned=(a,id)=>a?.dinLocks?.[id]===true;
const placed=d=>Number.isInteger(d.row)&&Number.isInteger(d.pos)&&d.row>=0&&d.pos>=0;
function validLocks(a){
 if(a.dinLocks===undefined)return true;
 const map=a.dinLocks,ids=new Set((a.devices||[]).map(d=>d.id));
 return !!map&&typeof map==='object'&&!Array.isArray(map)&&Object.keys(map).length<=350&&
  Object.entries(map).every(([id,v])=>ids.has(id)&&v===true);
}
function toggleLock(a,id){
 const d=(a.devices||[]).find(x=>x.id===id);
 if(!d||!a.rows||!a.slots||!placed(d)||d.row>=a.rows||d.pos+d.modules>a.slots)return false;
 if(pinned(a,id)){delete a.dinLocks[id];return true;}
 if((a.devices||[]).some(x=>x.id!==id&&pinned(a,x.id)&&x.row===d.row&&
  x.pos<d.pos+d.modules&&d.pos<x.pos+x.modules))return false;
 a.dinLocks={...(a.dinLocks||{}),[id]:true};return true;
}
function signature(a){return JSON.stringify([a.rows,a.slots,(a.devices||[]).map(d=>[d.id,d.modules,d.row,d.pos]),Object.keys(a.dinLocks||{}).filter(id=>pinned(a,id)).sort(),Object.entries(a.dinClearancesMm||{}).sort((x,y)=>x[0].localeCompare(y[0])),a.reserve]);}
function audit(a){
 const problems=[],seen=[],rows=Number(a.rows)||0,slots=Number(a.slots)||0;
 for(const d of a.devices||[]){
  const w=Number(d.modules),effective=footprint(a,d),r=d.row,p=d.pos;
  if(!Number.isInteger(w)||w<1||w>48){problems.push({code:'width',ids:[d.id],text:d.label+': ocupación inválida.'});continue;}
  if(r===null||r===undefined||p===null||p===undefined){problems.push({code:'unplaced',ids:[d.id],text:d.label+': sin posición.'});continue;}
  if(!Number.isInteger(r)||!Number.isInteger(p)||r<0||p<0||r>=rows||p+effective>slots){problems.push({code:'overflow',ids:[d.id],text:d.label+': excede el carril (aparato y reserva lateral declarada).'});continue;}
  for(const other of seen)if(other.r===r&&p<other.p+other.effective&&other.p<p+effective)problems.push({code:'overlap',ids:[d.id,other.id],text:'Solapamiento DIN o reserva lateral: '+other.label+' y '+d.label+' (carril '+(r+1)+').'});
  seen.push({id:d.id,label:d.label,r,p,w,effective});
 }
 return {problems,clear:problems.length===0,dirty:!!a.layoutDirty,reviewNeeded:!!a.layoutDirty||problems.length>0};
}
function pack(a,rows,slots){
 const devices=a.devices||[],grid=Array.from({length:rows},()=>Array(slots).fill(null)),positions={};
 const can=(r,p,w)=>r>=0&&r<rows&&p>=0&&p+w<=slots&&grid[r].slice(p,p+w).every(v=>v===null);
 const put=(d,r,p)=>{positions[d.id]={row:r,pos:p};for(let k=p;k<p+footprint(a,d);k++)grid[r][k]=d.id;};
 for(const d of devices.filter(d=>pinned(a,d.id))){
  if(!placed(d)||!can(d.row,d.pos,footprint(a,d)))return null;
  put(d,d.row,d.pos);
 }
 const free=devices.map((d,i)=>({d,i})).filter(x=>!pinned(a,x.d.id)).sort((x,y)=>{
  const px=placed(x.d),py=placed(y.d);
  return Number(py)-Number(px)||(px?x.d.row-y.d.row||x.d.pos-y.d.pos:0)||x.i-y.i;
 });
 // Conservar TODAS las ubicaciones válidas antes de recolocar las conflictivas.
 for(const {d}of free)if(placed(d)&&can(d.row,d.pos,footprint(a,d)))put(d,d.row,d.pos);
 for(const {d}of free){
  if(positions[d.id])continue;
  const w=footprint(a,d);if(w>slots)return null;
  const r0=placed(d)&&d.row<rows?d.row:0,p0=placed(d)?Math.min(d.pos,slots-w):0;
  const options=[];
  for(let r=0;r<rows;r++)for(let p=0;p<=slots-w;p++)
   options.push([r,p,Math.abs(r-r0)*1000+Math.abs(p-p0)*2+(p<p0?1:0)]);
  options.sort((x,y)=>x[2]-y[2]||x[0]-y[0]||x[1]-y[1]);
  const found=options.find(([r,p])=>can(r,p,w));
  if(!found)return null;
  put(d,found[0],found[1]);
 }
 return positions;
}

function plan(a){
 if(!(Number(a.rows)>0&&Number(a.slots)>0))return {ok:false,reason:'Primero calcula una envolvente.'};
 const ds=a.devices||[];
 if(!ds.length)return {ok:false,reason:'Todavía no hay dispositivos.'};
 if(!validLocks(a)||!validClearances(a))return {ok:false,reason:'Bloqueos o reservas DIN inválidos.'};
 if(ds.some(d=>!Number.isInteger(Number(d.modules))||Number(d.modules)<1||Number(d.modules)>48))return {ok:false,reason:'Ocupación modular inválida.'};
 let rows=a.rows,slots=a.slots,positions=pack(a,rows,slots),expanded=false;
 if(!positions){
  const proposal=root.PanelEngine.propose(ds.map(d=>({...d,modules:footprint(a,d)})),a.reserve??20);
  if(!proposal.ok)return {ok:false,reason:proposal.errors.join(' ')};
  for(const option of proposal.options.filter(x=>x.capacity>=a.rows*a.slots)){
   const trial=pack(a,option.rows,option.slots);
   if(trial){rows=option.rows;slots=option.slots;positions=trial;expanded=rows!==a.rows||slots!==a.slots;break;}
  }
 }
 if(!positions)return {ok:false,reason:'No hay distribución compatible con las posiciones fijadas y los formatos estudiados. Desbloquea un equipo o revisa la envolvente.'};
 const movements=ds.filter(d=>d.row!==positions[d.id].row||d.pos!==positions[d.id].pos).map(d=>({
  id:d.id,label:d.label,from:d.row==null?'Pendiente':'C'+(d.row+1)+' M'+(d.pos+1),
  to:'C'+(positions[d.id].row+1)+' M'+(positions[d.id].pos+1)
 }));
 return {ok:true,signature:signature(a),rows,slots,positions,movements,expanded,locked:ds.filter(d=>pinned(a,d.id)).length,unchanged:ds.length-movements.length,problems:audit(a).problems};
}
function apply(a,p){
 if(!p?.ok||signature(a)!==p.signature||a.devices.some(d=>!p.positions?.[d.id]||pinned(a,d.id)&&(d.row!==p.positions[d.id].row||d.pos!==p.positions[d.id].pos)))return false;
 const trial={rows:p.rows,slots:p.slots,dinClearancesMm:a.dinClearancesMm,devices:a.devices.map(d=>({...d,...p.positions[d.id]}))};
 if(trial.devices.some(d=>!p.positions[d.id])||!audit(trial).clear)return false;
 a.rows=p.rows;a.slots=p.slots;a.devices.forEach(d=>{d.row=p.positions[d.id].row;d.pos=p.positions[d.id].pos;});a.layoutDirty=false;
 return true;
}
function mmReport(a,resolve){
 const rows=[],issues=[],construction=root.PanelConstruction?.rails?.(a)||[];
 const clear=root.PanelEnclosureGeometry?.measure?.(a)?.clearWidth??null;
 let known=0,estimated=0,reserved=0;
 for(let r=0;r<(Number(a.rows)||0);r++){
  let extent=0,nominalEnd=0;
  const ds=(a.devices||[]).filter(d=>d.row===r&&Number.isInteger(d.pos)&&d.pos>=0);
  for(const d of ds){
   const match=typeof resolve==='function'?resolve(d):null;
   const width=Number(match?.widthMm);
   const verified=match?.status==='dimension_confirmada_usuario'&&Number.isFinite(width)&&width>0;
   verified?known++:estimated++;
   const w=verified?width:Number(d.modules)*DIN_MM,extra=extraMm(a,d.id);
   if(extra>0)reserved++;
   const requiredEnd=d.pos*DIN_MM+w+extra;
   const reservationEnd=(d.pos+footprint(a,d))*DIN_MM;
   extent=Math.max(extent,requiredEnd);nominalEnd=Math.max(nominalEnd,reservationEnd);
   if(w>Number(d.modules)*DIN_MM+0.01)issues.push(d.label+': anchura comercial superior a la reserva modular.');
   if(requiredEnd>reservationEnd+0.01)issues.push(d.label+': anchura y reserva lateral superan los módulos apartados.');
  }
  const rail=construction[r]?.lengthMm??null;
  if(rail!==null&&nominalEnd>rail+0.01)issues.push('Carril '+(r+1)+': reserva '+nominalEnd.toFixed(1)+' mm mayor que longitud declarada '+rail+' mm.');
  if(clear!==null&&nominalEnd>clear+0.01)issues.push('Carril '+(r+1)+': reserva '+nominalEnd.toFixed(1)+' mm mayor que anchura libre '+clear+' mm.');
  rows.push({row:r,extentMm:extent,reservationEndMm:nominalEnd,railMm:rail,count:ds.length});
 }
 return {rows,issues,known,estimated,reserved};
}
function render(a,open,esc,resolve){
 const status=audit(a);
 if(!(Number(a.rows)>0))return '';
 const mm=mmReport(a,resolve);
 const summary='<section class="aux-physical-panel" data-din-mm="true"><div class="aux-physical-head"><strong>Comprobación horizontal DIN en mm</strong></div><p class="small-text">'+mm.known+' anchura(s) documentadas y confirmadas · '+mm.estimated+' estimadas · '+mm.reserved+' reservas laterales declaradas. Paso conservador de planificación de 18 mm, NO montaje certificado.</p>'+mm.rows.filter(r=>r.count).map(r=>'<p class="small-text">Carril '+(r.row+1)+': ocupación ≈ '+r.extentMm.toFixed(1)+' mm; reserva modular '+r.reservationEndMm.toFixed(1)+' mm'+(r.railMm!==null?' / carril declarado '+r.railMm+' mm':' (longitud sin declarar)')+'</p>').join('')+mm.issues.map(x=>'<p class="pending-check">⚠ '+esc(x)+'</p>').join('')+'<p class="tiny-hint">'+Object.keys(a.dinLocks||{}).length+' posición(es) fijada(s). Las reservas introducidas se redondean a módulos completos; una separación no declarada sigue PENDIENTE. No se han verificado peines, ventilación ni cableado.</p></section>';
 if(!status.reviewNeeded)return summary;
 let html='<section class="aux-physical-panel" data-din-review="true" aria-label="Redistribución DIN asistida">'+
 '<div class="aux-physical-head"><strong>⚠ Revisión de colocación DIN</strong></div>'+
 '<p class="small-text">'+(status.problems.length?status.problems.map(p=>esc(p.text)).join(' · '):
 'Han cambiado anchuras o datos de la propuesta: revisa antes de aceptar.')+'</p>'+
 '<button class="button small" type="button" data-din-action="preview">Revisar propuesta sin aplicar</button>';
 if(open){
  const p=plan(a);
  if(p.ok){
   html+='<div data-din-preview="true"><p class="small-text"><strong>Propuesta: </strong>'+
   p.rows+' carril(es) × '+p.slots+' M, '+p.movements.length+' desplazamientos, '+p.unchanged+
   ' posiciones conservadas ('+p.locked+' fijadas). '+(p.expanded?'⚠ Cambia el formato de la envolvente.':'')+'</p>'+
   (p.movements.length?'<p class="small-text">'+p.movements.map(m=>esc(m.label+': '+m.from+' → '+m.to)).join(' · ')+'</p>':
   '<p class="small-text">Las posiciones se mantienen; confirmación de revisión pendiente.</p>')+
   '<button class="button primary small" type="button" data-din-action="confirm">Confirmar esta redistribución</button>';
  }else html+='<div class="error-text">'+esc(p.reason)+'</div>';
  html+='<button class="button small" type="button" data-din-action="cancel">Cancelar</button></div>';
 }
 return summary+html+'<p class="tiny-hint">Propuesta de módulos y carriles, con paso modular de referencia. NO cambia los datos eléctricos genéricos, las candidaturas, los precios ni valida dimensiones interiores, térmica o accesorios.</p></section>';
}
root.PanelDINReflow=Object.freeze({signature,audit,plan,apply,render,mmReport,validLocks,validClearances,setClearance,toggleLock,pinned,footprint});
})(window);
