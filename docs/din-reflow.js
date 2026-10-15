/* PanelBuilder · propuesta reversible de redistribución DIN (no validación eléctrica). */
(function(root){'use strict';
function signature(a){return JSON.stringify([a.rows,a.slots,(a.devices||[]).map(d=>[d.id,d.modules,d.row,d.pos])]);}
function audit(a){
 const problems=[],seen=[],rows=Number(a.rows)||0,slots=Number(a.slots)||0;
 for(const d of a.devices||[]){
  const w=Number(d.modules),r=d.row,p=d.pos;
  if(!Number.isInteger(w)||w<1||w>48){problems.push({code:'width',ids:[d.id],text:d.label+': ocupación inválida.'});continue;}
  if(r===null||r===undefined||p===null||p===undefined){problems.push({code:'unplaced',ids:[d.id],text:d.label+': sin posición.'});continue;}
  if(!Number.isInteger(r)||!Number.isInteger(p)||r<0||p<0||r>=rows||p+w>slots){problems.push({code:'overflow',ids:[d.id],text:d.label+': fuera del carril o sin espacio disponible.'});continue;}
  for(const other of seen)if(other.r===r&&p<other.p+other.w&&other.p<p+w)problems.push({code:'overlap',ids:[d.id,other.id],text:'Solapamiento DIN: '+other.label+' y '+d.label+' (carril '+(r+1)+').'});
  seen.push({id:d.id,label:d.label,r,p,w});
 }
 return {problems,clear:problems.length===0,dirty:!!a.layoutDirty,reviewNeeded:!!a.layoutDirty||problems.length>0};
}
function pack(devices,rows,slots){
 const grid=Array.from({length:rows},()=>Array(slots).fill(false)),positions={};
 const valid=d=>Number.isInteger(d.row)&&Number.isInteger(d.pos)&&d.row>=0&&d.row<rows&&d.pos>=0&&d.pos<slots;
 const order=devices.map((d,i)=>({d,i})).sort((x,y)=>Number(valid(y.d))-Number(valid(x.d))||(valid(x.d)?x.d.row-y.d.row||x.d.pos-y.d.pos:0)||x.i-y.i);
 for(const {d}of order){
  const w=Number(d.modules);if(!Number.isInteger(w)||w<1||w>slots)return null;
  const row=valid(d)?d.row:0, pos=valid(d)?Math.min(d.pos,slots-w):0;
  const places=[];
  for(let z=0;z<rows;z++){
   const r=(row+z)%rows;
   if(z===0){for(let p=pos;p<=slots-w;p++)places.push([r,p]);for(let p=0;p<pos;p++)places.push([r,p]);}
   else for(let p=0;p<=slots-w;p++)places.push([r,p]);
  }
  const spot=places.find(([r,p])=>grid[r].slice(p,p+w).every(v=>!v));
  if(!spot)return null;
  const [r,p]=spot;positions[d.id]={row:r,pos:p};for(let k=p;k<p+w;k++)grid[r][k]=true;
 }
 return positions;
}
function plan(a){
 if(!(Number(a.rows)>0&&Number(a.slots)>0))return {ok:false,reason:'Primero calcula una envolvente.'};
 const ds=a.devices||[];
 if(!ds.length)return {ok:false,reason:'Todavía no hay dispositivos.'};
 if(ds.some(d=>!Number.isInteger(Number(d.modules))||Number(d.modules)<1||Number(d.modules)>48))return {ok:false,reason:'Ocupación modular inválida.'};
 let rows=a.rows,slots=a.slots,positions=pack(ds,rows,slots),expanded=false;
 if(!positions){
  const proposal=root.PanelEngine.propose(ds,a.reserve??20);
  if(!proposal.ok)return {ok:false,reason:proposal.errors.join(' ')};
  for(const option of proposal.options.filter(x=>x.capacity>=a.rows*a.slots)){
   const trial=pack(ds,option.rows,option.slots);
   if(trial){rows=option.rows;slots=option.slots;positions=trial;expanded=rows!==a.rows||slots!==a.slots;break;}
  }
 }
 if(!positions)return {ok:false,reason:'Sin formato de envolvente válido; revisa la ocupación manualmente.'};
 const movements=ds.filter(d=>d.row!==positions[d.id].row||d.pos!==positions[d.id].pos).map(d=>({
  id:d.id,label:d.label,from:d.row==null?'Pendiente':'C'+(d.row+1)+' M'+(d.pos+1),
  to:'C'+(positions[d.id].row+1)+' M'+(positions[d.id].pos+1)
 }));
 return {ok:true,signature:signature(a),rows,slots,positions,movements,expanded,unchanged:ds.length-movements.length,problems:audit(a).problems};
}
function apply(a,p){
 if(!p?.ok||signature(a)!==p.signature)return false;
 const trial={rows:p.rows,slots:p.slots,devices:a.devices.map(d=>({...d,...p.positions[d.id]}))};
 if(trial.devices.some(d=>!p.positions[d.id])||!audit(trial).clear)return false;
 a.rows=p.rows;a.slots=p.slots;a.devices.forEach(d=>{d.row=p.positions[d.id].row;d.pos=p.positions[d.id].pos;});a.layoutDirty=false;
 return true;
}
function render(a,open,esc){
 const status=audit(a);
 if(!(Number(a.rows)>0)||!status.reviewNeeded)return '';
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
   ' posiciones conservadas. '+(p.expanded?'⚠ Cambia el formato de la envolvente.':'')+'</p>'+
   (p.movements.length?'<p class="small-text">'+p.movements.map(m=>esc(m.label+': '+m.from+' → '+m.to)).join(' · ')+'</p>':
   '<p class="small-text">Las posiciones se mantienen; confirmación de revisión pendiente.</p>')+
   '<button class="button primary small" type="button" data-din-action="confirm">Confirmar esta redistribución</button>';
  }else html+='<div class="error-text">'+esc(p.reason)+'</div>';
  html+='<button class="button small" type="button" data-din-action="cancel">Cancelar</button></div>';
 }
 return html+'<p class="tiny-hint">Propuesta de módulos y carriles, con paso modular de referencia. NO cambia los datos eléctricos genéricos, las candidaturas, los precios ni valida dimensiones interiores, térmica o accesorios.</p></section>';
}
root.PanelDINReflow=Object.freeze({signature,audit,plan,apply,render});
})(window);
