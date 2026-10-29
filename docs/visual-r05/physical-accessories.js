/* PanelBuilder v0.11 — accesorios constructivos por referencia y SIN montaje aprobado.
 * Datos de fabricantes individuales. No adjudicar un accesorio automaticamente.
 */
(function(root){'use strict';
const SOURCE_DATE='2026-10-16';
const items=Object.freeze([
 {brand:'Schneider',ref:'A9A26904',kind:'auxiliar',name:'Contacto iOF Acti9 de señalización',side:'left',widthMm:null,modules:null,
  family:'iC60 / Acti9 (compatibilidad de familia, no conjunto completo)',
  source:'https://www.se.com/es/es/product/A9A26904/acti9-iof-contacto-auxiliar-100ma-to-6a-acdc/',
  detail:'Acoplamiento por clip a la izquierda según fabricante. Anchura instalada y combinaciones de auxiliares pendientes.'},
 ...['A9A26914','A9A26907','A9A26919'].map(ref=>{
  const d=root.PanelManufacturerR15.byKey('Schneider',ref);
  return {brand:d.brand,ref:d.ref,kind:'auxiliar',name:d.name,side:d.side,widthMm:null,modules:null,
   family:'Acti9 según ficha individual. Verificar anfitrión y orden con manual.',source:d.source,
   detail:d.facts.join(' · ')+' Anchura montada NO acreditada; no reserva automáticamente.'};
 }),
 ...['406260','406262','406266'].map(ref=>{
  const d=root.PanelManufacturerR15.byKey('Legrand',ref);
  return {brand:d.brand,ref:d.ref,kind:'auxiliar',name:d.name,side:'unknown',widthMm:null,modules:null,
   family:'DX³ documental sin unión a SKU de protección verificada.',source:d.source,
   detail:d.facts.join(' · ')+' Posición y anchura instaladas pendientes.'};
 }),
  {brand:'Hager',ref:'MZ201',kind:'auxiliar',name:'Contacto auxiliar 1NA+1NC, series M/N/HM/ML',side:'unknown',documentedSide:'left',widthMm:9.5,modules:0.5,
  family:'M / N / HM / ML, exclusivamente según ficha Hager',
  source:'https://hager.com/es/catalogo/producto/mz201-contacto-auxiliar-1na-1nc-5a',
  detail:'Anchura de producto 9,50 mm y ocupación nominal 0,5 M, que NO equivale a 9 mm libres. Un catálogo oficial Hager (edición histórica, p. 4.28) indica montaje lateral izquierdo; contrastar siempre SKU anfitrión y revisión vigente.'},
 ...['MZ202','MZ203','MZ204','MZ206'].map(ref=>{
  const doc=root.PanelManufacturerResearch.byKey('Hager',ref);
  return {brand:'Hager',ref,kind:'auxiliar',name:doc.name,side:doc.side||'unknown',
   documentedSide:doc.side||undefined,widthMm:doc.widthMm,modules:doc.modules,
   family:'Series M/N/HM/ML, validación de anfitrión individual pendiente',
   source:doc.source,
   detail:'Anchura exterior '+doc.widthMm+' mm, ficha del SKU. '+doc.unknown+
     '. No implica combinación aprobada ni que deba elegirse automáticamente.'};
 }),
  ...root.PanelManufacturerHosts.combs.map(b=>({brand:b.brand,ref:b.ref,kind:'peine',
  name:b.name,side:'comb',widthMm:null,modules:null,lengthMm:b.lengthMm,
  family:'Peine Hager: no se presume compatibilidad SKU ni número de dientes por longitud.',
  source:b.source,detail:b.note})),
  {brand:'Schneider',ref:'A9XPH112',kind:'peine',name:'Peine 1P, 12 módulos de 18 mm',side:'comb',widthMm:null,modules:null,
  family:'K60N/C60/ID descritos por fabricante; verificar referencia del dispositivo, borne y régimen',
  source:'https://www.se.com/es/es/product/A9XPH112/peine-unipolar-24-pasos-k60n-c60-id/',
  detail:'12 módulos es longitud nominal de catálogo, NO longitud física útil acreditada. Faltan dientes, corte, tapas, alimentación y disposición exacta.'},
 {brand:'Hager',ref:'KDN163A',kind:'peine',name:'Peine de horquilla 1P, 63 A, 12 M',side:'comb',widthMm:null,modules:null,lengthMm:210,
  family:'Compatibilidad con SKU anfitrión aún sin evidencia individual',
  source:'https://hager.com/intl-en/catalogue/information/kdn163a-insulated-busbar-1p-fork-10mm2-12m',
  detail:'Peine de horquilla de 10 mm², longitud exterior 210 mm según ficha oficial Hager. 12 módulos nominales: no equiparar a 216 mm de ocupación montada ni inferir dientes, aptitud para aparatos/auxiliares o distancia útil.'}
]);
const byKey=(brand,ref)=>items.find(i=>i.brand===brand&&i.ref===ref);
const mm=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=300;
function identity(a,d,brand){
 const c=a?.apparatusCandidates?.[d.id];
 return JSON.stringify([brand,d.kind,d.poles,d.amp,d.curve,d.breakingKa,
   d.sensitivity,d.rcdType,d.spdClass,d.contactCoilV,c?.fabricante||'',c?.referencia||'']);
}
function valid(a){
 const map=a?.physicalAccessoryPlans;if(map===undefined)return true;
 if(!map||Array.isArray(map)||typeof map!=='object'||Object.keys(map).length>350)return false;
 const ids=new Set((a.devices||[]).map(d=>d.id));
 return Object.entries(map).every(([id,p])=>ids.has(id)&&p&&typeof p==='object'&&!Array.isArray(p)
   &&Object.keys(p).every(k=>['brand','ref','side','observedMm','hostIdentity'].includes(k))
   &&!!byKey(p.brand,p.ref)&&['left','right','unknown','comb'].includes(p.side)
   &&(byKey(p.brand,p.ref).kind==='peine'?p.side==='comb':p.side!=='comb')
   &&(p.observedMm===undefined||mm(p.observedMm))
   &&typeof p.hostIdentity==='string'&&p.hostIdentity.length<=600);
}
function set(a,id,brand,ref,side,raw,activeBrand){
 const d=(a.devices||[]).find(x=>x.id===id);if(!d)return false;
 if(!ref){if(a.physicalAccessoryPlans)delete a.physicalAccessoryPlans[id];return true;}
 const item=byKey(brand,ref);if(!item||!['left','right','unknown','comb'].includes(side)||
   (item.kind==='peine'&&side!=='comb')||(item.kind!=='peine'&&side==='comb'))return false;
 let observedMm;
 if(String(raw).trim()!==''){observedMm=Number(raw);if(!mm(observedMm))return false;}
 const plan={brand,ref,side,hostIdentity:identity(a,d,activeBrand)};
 if(observedMm!==undefined)plan.observedMm=observedMm;
 a.physicalAccessoryPlans={...(a.physicalAccessoryPlans||{}),[id]:plan};
 return true;
}
function report(a,brand){
 const issues=[],pending=[],plans=a?.physicalAccessoryPlans||{};
 const count=Object.keys(plans).length;
 for(const [id,p] of Object.entries(plans)){
  const d=(a.devices||[]).find(x=>x.id===id),item=byKey(p.brand,p.ref);
  if(!d||!item)continue;
  const label=(d.label||id)+' · '+item.brand+' '+item.ref;
  const c=a.apparatusCandidates?.[id];
  if(p.hostIdentity!==identity(a,d,brand)){pending.push(label+': datos del anfitrión o fabricante cambiados; revisar la anotación.');continue;}
  if(brand!==item.brand){pending.push(label+': fabricante activo distinto; no atribuir compatibilidad.');continue;}
  if(!c||c.fabricante!==brand){pending.push(label+': falta candidata documental de producto anfitrión.');}
  else if(item.ref==='A9A26904'&&!(d.kind==='MCB'&&/^A9F79[0-9]{3}$/.test(c.referencia))){
   pending.push(label+': relación iC60 exacta no acreditada para esta referencia anfitriona.');
  }else if(item.ref==='MZ201'){pending.push(label+': series M/N/HM/ML documentadas; verificar SKU concreto y acoplamiento.');}
  else if(item.kind==='peine'){pending.push(label+': falta verificar esquema de alimentación, tipo de borne, polos, dientes, tapa y conjunto.');}
  if(item.kind==='peine'){pending.push(label+': '+(root.PanelManufacturerHosts.findComb(item.brand,item.ref)?'longitud exterior '+item.lengthMm+' mm, módulos nominales del SKU sin prueba de dientes/conexiones.':'longitud 12 M NOMINAL; no se ha reservado huella ni verificado fijación.')+' Sin reserva DIN ni montaje aprobado.');continue;}
  if(p.side==='unknown'){pending.push(label+': posición/acoplamiento lateral sin documento verificable.');continue;}
  if(item.documentedSide&&p.side!==item.documentedSide){pending.push(label+': lado '+p.side+' contradictorio con catálogo Hager ('+item.documentedSide+'); registro legado conservado, cotejo solo orientativo y requiere corregir.');}
  const width=item.widthMm===null?p.observedMm:(p.observedMm===undefined?item.widthMm:Math.max(item.widthMm,p.observedMm));
  if(item.widthMm!==null&&p.observedMm!==undefined&&p.observedMm<item.widthMm)pending.push(label+': medición manual inferior a '+item.widthMm+' mm de ficha; se usa el mínimo documental.');
  if(width===null||width===undefined){pending.push(label+': anchura montada pendiente, no se ha reservado ningún hueco.');continue;}
  if(d.row===null||d.pos===null||!Number.isInteger(d.row)||!Number.isInteger(d.pos)){
   pending.push(label+': colocar primero el aparato en carril DIN.');continue;
  }
  if(!Number.isInteger(a.slots)||a.slots<=0){pending.push(label+': capacidad DIN sin definir.');continue;}
  // Comparacion SOLO de intervalos horizontales aproximados (18 mm por modulo);
  // no validar profundidad, sujecion, capacidad ni peines con este calculo.
  const left=p.side==='left'?d.pos*18-width:(d.pos+Number(d.modules))*18;
  const right=left+width;
  if(left<0||right>a.slots*18)issues.push(label+': accesorio lateral excede el carril nominal.');
  for(const other of a.devices||[]){
   if(other.id===id||other.row!==d.row||other.pos===null)continue;
   const a0=other.pos*18,a1=(other.pos+Number(other.modules))*18;
   if(left<a1&&right>a0)issues.push(label+': la huella lateral se solapa con '+(other.label||other.id)+' (rejilla provisional 18 mm/M).');
  }
  pending.push(label+': cotejo lateral parcial; falta verificar la combinación real, puerta, bornes, separación y disipación.');
 }
 return {count,issues,pending};
}
function render(a,brand,esc){
 const p=a.physicalAccessoryPlans||{},options=items.map(i=>'<option value="'+esc(i.brand+'|'+i.ref)+'">'+esc(i.brand+' '+i.ref+' · '+i.name)+'</option>').join('');
 const rows=(a.devices||[]).map(d=>{
  const x=p[d.id],item=x?byKey(x.brand,x.ref):null,k=x?x.brand+'|'+x.ref:'';
  return '<div class="notice-box" data-accessory-row="'+esc(d.id)+'" style="margin:8px 0;padding:12px">'
   +'<strong>'+esc(d.label)+' · '+esc(d.name||d.kind)+'</strong>'
   +'<label class="form-field" style="display:block">Referencia <select data-accessory-ref="'+esc(d.id)+'" style="width:100%"><option value="">Sin accesorio anotado</option>'
   +options.replace('value="'+esc(k)+'"','value="'+esc(k)+'" selected')+'</select></label>'
   +'<label class="form-field" style="display:block">Situación <select data-accessory-side="'+esc(d.id)+'">'
   +[['unknown','Por definir'],['left','Lateral izquierda'],['right','Lateral derecha'],['comb','Peine (sin huella DIN)']].map(y=>'<option value="'+y[0]+'"'+(x?.side===y[0]?' selected':'')+'>'+y[1]+'</option>').join('')+'</select></label>'
   +'<label class="form-field" style="display:block">Anchura montada medida por usuario, mm (opcional) <input type="number" step="0.1" min="0" max="300" data-accessory-width="'+esc(d.id)+'" value="'+esc(x?.observedMm??'')+'" placeholder="Desconocida"></label>'
   +'<button type="button" class="button small" data-accessory-save="'+esc(d.id)+'">Guardar anotación / retirar</button>'
   +(item?'<p class="tiny-hint"><a href="'+esc(item.source)+'" target="_blank" rel="noopener noreferrer">Ficha '+esc(item.brand+' '+item.ref)+' ↗</a> · Anchura exterior '+esc(item.widthMm===null?'sin acreditar':item.widthMm+' mm')+' · '+esc(item.detail)+'</p>':'')
   +'</div>';
 }).join('');
 const r=report(a,brand);
 return '<details class="aux-physical-panel" data-accessories-panel><summary><strong>Accesorios por referencia · '+r.count+' anotados · '+r.issues.length+' interferencias</strong></summary>'
  +'<p class="tiny-hint">Anotación voluntaria, nunca asignación automática. Un auxiliar o peine NO está aprobado para el aparato solo por ser de la misma marca. La anchura real puede diferir de sus módulos nominales. Guardar NO mueve equipos ni modifica el unifilar.</p>'
  +rows
  +r.issues.map(s=>'<p class="notice-line warn">⚠ '+esc(s)+'</p>').join('')
  +r.pending.map(s=>'<p class="tiny-hint">Pendiente: '+esc(s)+'</p>').join('')
  +'</details>';
}
function materials(a,esc){
 const m=a.physicalAccessoryPlans||{},entries=Object.entries(m);
 if(!entries.length)return '';
 return '<section class="terminal-bom"><strong>Accesorios anotados (sin aprobación, sin PVP)</strong><p class="small-text">Anotaciones individuales; no constituyen pedido, BOM validada ni medición de peines.</p>'
  +entries.map(([id,x])=>'<p class="tiny-hint">'+esc((a.devices||[]).find(d=>d.id===id)?.label||id)+' — '+esc(x.brand+' '+x.ref)+' · '+esc(x.side==='comb'?'Peine sin recorrido definido':'Lado '+x.side)+' · PVP pendiente</p>').join('')
  +'</section>';
}
root.PanelPhysicalAccessories=Object.freeze({items,byKey,valid,set,report,render,materials,identity,SOURCE_DATE});
})(window);
