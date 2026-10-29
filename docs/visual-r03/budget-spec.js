/* PanelBuilder · selección rápida por características.
   Cotejo estricto de fichas ya disponibles, sin equivalencias inventadas.
   F y A-SI no se confunden; Icn IEC 60898 no es Icu IEC 60947. */
(function(root){'use strict';
const rcdTypes=['AC','A','A-SI','F','F-SI','B','B-SI'];
const kinds=['MCB','RCD'];
const poles=['1P','1P+N','2P','3P','3P+N','4P'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const opts=(vals)=>vals.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
function normalize(src){
 const kind=String(src.kind||'');
 const brand=String(src.brand||'');
 const p=String(src.poles||'').trim().toUpperCase();
 const amp=Number(src.amp),qty=Number(src.qty);
 if(!kinds.includes(kind)||!(root.PanelQuickBudget.brands.includes(brand)||brand==='Cualquiera')||!poles.includes(p)
   ||!Number.isInteger(amp)||amp<1||amp>1600||!Number.isInteger(qty)||qty<1||qty>10000)return null;
 const s={kind,brand,poles:p,amp,qty};
 if(kind==='MCB'){
  s.curve=String(src.curve||'').trim().toUpperCase();
  s.breakingKa=Number(src.breakingKa);
  if(!['B','C','D'].includes(s.curve)||![3,4.5,6,10,15,20,25,36,50,70,100].includes(s.breakingKa))return null;
  const volts=String(src.voltage??'').trim();
  if(volts!==''){s.voltage=Number(volts);if(!['230','400'].includes(volts))return null;}
  const req=String(src.protectedPoles??'').trim();
  if(req!==''){
   const max=Number(p[0])+(p.endsWith('+N')?1:0);
   if(!/^[1-4]$/.test(req)||Number(req)>max)return null;
   s.protectedPoles=Number(req);
  }
 }else{
  s.sensitivity=Number(src.sensitivity);
  s.rcdType=String(src.rcdType||'').trim().toUpperCase();
  if(!Number.isInteger(s.sensitivity)||s.sensitivity<10||s.sensitivity>3000||!rcdTypes.includes(s.rcdType))return null;
 }
 return s;
}
function description(s){
 return s.kind==='MCB'
   ? 'Magnetotérmico '+s.poles+' '+s.amp+' A curva '+s.curve+' · Icn ≥ '+s.breakingKa+' kA (IEC 60898)'
   : 'Interruptor diferencial RCCB '+s.poles+' '+s.amp+' A '+s.sensitivity+' mA tipo '+s.rcdType;
}
function matches(s){
 const normalized=normalize(s);
 if(!normalized||normalized.brand==='Otra')return [];
 const brand=normalized.brand==='Cualquiera'?'':normalized.brand;
 const category=normalized.kind==='MCB'?'magnetotermico':'diferencial';
 const base=root.PanelCommercial.search('',brand,category);
 const existing=root.PanelTechnicalDossiersR31?.merge(base,brand,category)||base;
 const candidates=root.PanelPoleTopologyR32?.merge(existing,brand,category)||existing;
 return candidates.filter(x=>{
  const at=x.atributos||{};
  if(x.estado_comercial==='descatalogado'||x.estado_comercial==='gama_no_comercializada')return false;
  if(normalized.kind==='MCB'&&x.admision_comparador===false)return false;
  if(!String(x.url_oficial||'').startsWith('https://'))return false;
  if(root.PanelApparatusCandidates.normalizePoles(at.polos)!==normalized.poles)return false;
  if(Number(at.amp)!==normalized.amp)return false;
  if(normalized.kind==='MCB'){
   const icn=Number(at.icn_60898_ka??at.icn_ka);
   if(at.curva!==normalized.curve)return false;
   if(normalized.protectedPoles!==undefined&&!root.PanelPoleTopologyR32?.eligibleProtected(x,normalized.protectedPoles))return false;
   if(normalized.voltage){const proof=root.PanelPoleTopologyR32?.icnAt(x,normalized.voltage)||root.PanelTechnicalDossiersR31?.icnAt(x,normalized.voltage)
     ||root.PanelTechnicalEvidence?.icnAt(x,normalized.voltage);
    return !!proof&&proof.ka>=normalized.breakingKa;}
   return Number.isFinite(icn)&&icn>=normalized.breakingKa;
  }
  if(!root.PanelApparatusCandidates.isRccb(x))return false;
  const idn=Number(at.idn_ma??at.sensibilidad_ma);
  const type=String(at.tipo_rcd??at.tipo_diferencial??'').trim().toUpperCase();
  return idn===normalized.sensitivity&&type===normalized.rcdType&&!at.retardo;
 }).sort((a,b)=>a.referencia.localeCompare(b.referencia));
}
function add(a,s,ref='',selectedBrand=''){
 const normalized=normalize(s);
 if(!normalized)return false;
 if(ref&&normalized.brand==='Cualquiera'&&!selectedBrand)return false;
 const selected=ref?matches(normalized).find(x=>x.referencia===ref&&(!selectedBrand||x.fabricante===selectedBrand)):null;
 if(ref&&!selected)return false; // Rechazar una referencia diferente a los parámetros.
 if(selected){
  if(!root.PanelQuickBudget.add(a,{
   kind:'aparato',brand:selected.fabricante,ref:selected.referencia,
   description:selected.descripcion,qty:String(normalized.qty),price:''
  }))return false;
  a.quickBudget.lines[a.quickBudget.lines.length-1].spec={...normalized};
  return true;
 }
 const b=a.quickBudget||(a.quickBudget={lines:[],discount:0,nextId:1});
 if(b.lines.length>=2000)return false;
 b.lines.push({id:'q'+b.nextId++,kind:'aparato',brand:normalized.brand,ref:'',
  description:description(normalized),qty:normalized.qty,price:null,
  priceSource:'pendiente',sourceUrl:'',priceAsOf:'',spec:{...normalized}});
 return true;
}

/* v0.12: definir primero la partida generica y cruzar DESPUES.
   La seleccion comercial no modifica las propiedades de busqueda originales. */
function pendingLine(a,id){
 return root.PanelQuickBudget.get(a).lines.find(x=>x.id===id&&x.spec&&validSpec(x.spec))||null;
}
function assignExisting(a,id,brand,ref){
 const x=pendingLine(a,id);if(!x||!brand||!ref)return false;
 const matchesNow=matches({...x.spec,qty:x.qty});
 const product=matchesNow.find(r=>r.fabricante===brand&&r.referencia===ref);
 if(!product)return false;
 // Reusar el mismo calculo conservador de precio/procedencia del presupuesto.
 const scratch={quickBudget:{lines:[],discount:0,nextId:1}};
 if(!root.PanelQuickBudget.add(scratch,{kind:'aparato',brand:product.fabricante,
    ref:product.referencia,description:product.descripcion,qty:String(x.qty),price:''}))return false;
 const derived=scratch.quickBudget.lines[0];
 const priorManual=x.priceSource==='manual'?x.price:null;
 Object.assign(x,derived,{id:x.id,spec:{...x.spec,qty:x.qty}});
 if(priorManual!==null){
  x.price=priorManual;x.priceSource='manual';x.sourceUrl='';x.priceAsOf='';
 }
 return true;
}
function resetExisting(a,id){
 const x=pendingLine(a,id);if(!x)return false;
 x.brand=x.spec.brand;x.ref='';x.description=description(x.spec);
 x.price=null;x.priceSource='pendiente';x.sourceUrl='';x.priceAsOf='';
 return true;
}
function compareExisting(a,id,brandFilter=''){
 const x=pendingLine(a,id);
 if(!x)return '<p class="quote-warning">Esta partida no tiene propiedades genéricas válidas para el cruce.</p>';
 const candidates=matches({...x.spec,qty:x.qty}).filter(r=>!brandFilter||r.fabricante===brandFilter),shown=candidates.slice(0,16);
 return '<div class="pb12-spec-compare" data-spec-compare-panel="'+esc(id)+'">'
  +'<strong>Etapa 2 · Cruce de fabricantes · '+esc(x.description)+'</strong>'
  +'<p class="tiny-hint">'+candidates.length+' referencias con coincidencia de campos exigidos. '
  +'Se revisan fichas, tensión/Icn, condiciones de uso y montaje por separado. '
  +'No hay sustitución automática del elemento genérico. '
  +(x.spec.kind==='MCB'&&!x.spec.voltage?'Tensión no fijada: Icn aún sin verificar a tensión de servicio. ':'')
  +'</p>'
  +(x.ref?'<button type="button" class="button small" data-spec-reset="'+esc(id)+'">↶ Volver a genérico sin referencia</button>':'')
  +(shown.length?shown.map(r=>{
    const selected=x.brand===r.fabricante&&x.ref===r.referencia;
    const price=r.iva_base==='sin_iva_confirmado'&&Number.isFinite(r.pvp_sin_iva_eur)
     ?r.pvp_sin_iva_eur.toLocaleString('es-ES',{style:'currency',currency:'EUR'})+' PVP documental sin IVA · vigencia pendiente'
     :'PVP sin IVA pendiente / IVA por confirmar';
    return '<div class="pb12-spec-candidate"><span><b>'+esc(r.fabricante+' '+r.referencia)+'</b>'
      +'<small>'+esc(r.descripcion)+'</small><small>'+esc(price)+'</small>'
      +'<a href="'+esc(r.url_oficial)+'" target="_blank" rel="noopener noreferrer">Ficha oficial ↗</a></span>'
      +'<button type="button" class="button small" data-spec-assign="'+esc(id)+'" data-spec-ref="'+esc(r.referencia)+'" data-spec-brand="'+esc(r.fabricante)+'" '+(selected?'disabled':'')+'>'
      +(selected?'Preseleccionada':'Guardar candidata')+'</button></div>';
   }).join(''):'<p class="quote-warning">No se ha encontrado una referencia documental coincidente. '
      +'Conserva el genérico; no significa que el producto no exista.</p>')
  +(candidates.length>shown.length?'<p class="tiny-hint">Mostrando 16 de '+candidates.length+' coincidencias. Refinar características.</p>':'')
  +'<p class="tiny-hint">El cruce es documental y reversible. Revisa por referencia exacta corriente, polos, función, curva, tensión y requisitos pendientes antes de usarla.</p></div>';
}

function validSpec(s){
 if(s===undefined)return true;
 if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).length>9)return false;
 const v=normalize(s);
 return !!v&&Object.keys(v).every(k=>v[k]===s[k]);
}
function form(){
 return '<section class="quote-spec-entry"><div class="quote-section-title"><strong>① Definir material genérico</strong><small>Primero propiedades y cantidades, después cruce por fabricantes.</small></div>'
 +'<form id="quickSpecForm" data-spec-kind="MCB" class="quote-spec-form">'
 +'<label>Protección<select name="kind" id="quickSpecKind"><option value="MCB">Magnetotérmico</option><option value="RCD">Diferencial independiente (RCCB)</option></select></label>'
 +'<label>Fabricante<select name="brand"><option value="Cualquiera">Todas las marcas con ficha</option>'+opts(root.PanelQuickBudget.brands)+'</select></label>'
 +'<label>Polos<select name="poles" required><option value="">Seleccionar polos</option>'+opts(poles)+'</select></label>'
 +'<label>Intensidad (A)<input name="amp" type="number" min="1" max="1600" step="1" required placeholder="16" /></label>'
 +'<label class="spec-mcb">Curva<select name="curve"><option value="">Seleccionar curva</option>'+opts(['B','C','D'])+'</select></label>'
 +'<label class="spec-mcb">Icn mínimo (kA) · IEC 60898<select name="breakingKa"><option value="">Selecciona Icn</option>'+opts(['3','4.5','6','10','15','20','25','36','50','70','100'])+'</select></label>'
 +'<label class="spec-mcb">Comprobar Icn a tensión (opcional)<select name="voltage"><option value="">Sin contrastar tensión</option><option value="230">230 V</option><option value="400">400 V</option></select></label>'
 +'<label class="spec-mcb">Polos protegidos por sobreintensidad (opcional)<select name="protectedPoles"><option value="">No exigir dato acreditado</option>'+opts(['1','2','3','4'])+'</select></label>'
 +'<label class="spec-rcd">Sensibilidad (mA)<select name="sensitivity"><option value="">Seleccionar mA</option>'+opts(['10','30','100','300','500','1000'])+'</select></label>'
 +'<label class="spec-rcd">Tipo diferencial<select name="rcdType"><option value="">Seleccionar tipo</option>'+rcdTypes.map(k=>'<option value="'+k+'">'+k+(k==='A-SI'?' (superinmunizado)':k==='F-SI'?' (tipo F + alta inmunidad)':k==='B-SI'?' (tipo B + alta inmunidad)':'')+'</option>').join('')+'</select></label>'
 +'<label>Cantidad<input name="qty" type="number" min="1" max="10000" required step="1" value="1" /></label>'
 +'<button type="button" class="button primary" data-spec-save-generic="true">＋ Guardar material genérico</button>'
  +'<button type="submit" class="button" data-spec-search="true">Buscar referencias ahora →</button></form>'
 +'<p class="tiny-hint">Distingue 2P de 1P+N. Los tipos F y SI no son equivalentes: la alta inmunidad se recoge por separado. La búsqueda es documental y no valida el montaje. El acoplamiento del neutro o la etiqueta 1P+N NO demuestran, por sí solos, que el neutro esté seccionado: exige esquema de contactos por SKU. Los polos totales, protegidos por sobreintensidad y conmutados se documentan separadamente. En RCCB la protección por sobreintensidad no aplica. El Icn solo se solicita a magnetotérmicos, no a diferenciales RCCB independientes. Si seleccionas 230/400 V solo se muestran fichas donde el Icn IEC 60898-1 esté documentado expresamente para esa tensión; sin tensión, los resultados siguen pendientes de ese contraste.</p>'
 +(root.PanelEvidenceReviewR34?.overview(esc)||'')
 +'<div id="quickSpecMatches" aria-live="polite"></div></section>';
}
function results(s){
 const normalized=normalize(s);
 if(!normalized)return '<p class="quote-warning">Parámetros inválidos o incompletos.</p>';
 const rows=matches(normalized),query=description(normalized);
 const cards=rows.map(x=>{
  const price=x.iva_base==='sin_iva_confirmado'&&Number.isFinite(x.pvp_sin_iva_eur)
   ?x.pvp_sin_iva_eur.toLocaleString('es-ES',{style:'currency',currency:'EUR'})+' / ud · PVP documental sin IVA'
   :'PVP sin IVA pendiente';
  const proof=normalized.kind==='MCB'&&normalized.voltage
    ?root.PanelPoleTopologyR32?.icnAt(x,normalized.voltage)||root.PanelTechnicalDossiersR31?.icnAt(x,normalized.voltage)
       ||root.PanelTechnicalEvidence?.icnAt(x,normalized.voltage):null;
  const source=proof?.source||x.url_oficial;
  const evidence=proof
   ?'Icn IEC 60898-1: '+proof.ka+' kA a '+normalized.voltage+' V (ficha individual)'
   :normalized.kind==='MCB'
    ?'Icn mínimo declarado en catálogo técnico; tensión aún por contrastar'
    :'RCCB independiente con atributos documentales coincidentes';
  const summary=x.atributos?.modulos?' · '+x.atributos.modulos+' M documentales (sin asignación DIN)':' · ancho DIN pendiente';
  const topo=root.PanelPoleTopologyR32?.display(x);
  const poleText=topo?'Polos: '+topo.designation+' · totales '+topo.total+' · protegidos (sobrecorriente) '+topo.protected+' · conmutados '+topo.switched:'';
  const switchText=root.PanelSwitchingEvidenceR33?.display(x)||'';
  return '<div class="quote-spec-match"><div><strong>'+esc(x.fabricante+' '+x.referencia)+'</strong>'
   +'<small>'+esc(x.descripcion)+'</small><small>'+esc(evidence+summary)+'</small>'
   +(poleText?'<small>'+esc(poleText)+'</small>':'')
   +(switchText?'<small>'+esc(switchText)+'</small>':'')
   +(root.PanelEvidenceReviewR34?.render(x,esc)||'')
   +'<small>'+esc(price)+' · revisar vigencia y compatibilidad</small>'
   +'<small><a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">Ficha / procedencia oficial ↗</a></small></div>'
   +'<button type="button" class="button small" data-spec-brand="'+esc(x.fabricante)+'" data-spec-choose="'+esc(x.referencia)+'">Añadir '+esc(normalized.qty)+' ud.</button></div>';
 }).join('');
 const countProtectedMissing=normalized.kind==='MCB'&&normalized.protectedPoles!==undefined
  ?matches({...normalized,protectedPoles:undefined}):[];
 const notAccredited=countProtectedMissing.filter(x=>root.PanelPoleTopologyR32?.get(x.fabricante,x.referencia)?.protectedPoles==null).length;
 const otherProtected=countProtectedMissing.filter(x=>{
  const value=root.PanelPoleTopologyR32?.get(x.fabricante,x.referencia)?.protectedPoles;
  return value!=null&&value!==normalized.protectedPoles;
 }).length;
 const protectionNotice=countProtectedMissing.length&&normalized.protectedPoles!==undefined
  ?'<p class="tiny-hint">Filtro estricto de polos protegidos: '+countProtectedMissing.length
   +' referencia(s) coinciden en los demás parámetros; '+notAccredited
   +' sin número protegido acreditado y '+otherProtected
   +' con número diferente. Las referencias excluidas NO se deben dar por equivalentes.</p>':'';
 const bare=normalized.kind==='MCB'&&normalized.voltage
   ?matches({...normalized,voltage:undefined}).length:0;
 const note=normalized.kind==='MCB'&&normalized.voltage
   ?'<p class="tiny-hint">Filtro de seguridad documental: IEC 60898-1 a '+esc(normalized.voltage)
    +' V (no extrapola valores de otras tensiones ni Icu). '
    +(bare>rows.length?'Hay '+(bare-rows.length)+' coincidencia(s) básicas adicionales sin poder de corte acreditado a esa tensión o insuficientes.':'')+'</p>'
   :normalized.kind==='MCB'
    ?'<p class="quote-warning">⚠ Tensión no seleccionada: los valores Icn del catálogo necesitan contraste a la tensión del circuito antes de considerarlos adecuados.</p>':'';
 return '<div class="quote-spec-results"><strong>'+esc(query)+'</strong><p class="tiny-hint">Marca: '
  +esc(normalized.brand==='Cualquiera'?'todas las marcas documentadas':normalized.brand)
  +' · '+rows.length+' coincidencia(s) documentales entre las fichas disponibles. No es catálogo completo ni validación de montaje.</p>'
  +note+protectionNotice+(rows.length?cards:'<p class="quote-warning">No hay ficha suficiente para estos parámetros'
    +(normalized.voltage?' y tensión de comprobación.':'')+'; no significa que el producto no exista. Puedes crear una partida pendiente.</p>')
  +'<button type="button" class="button small" data-spec-pending="true">＋ Añadir '+esc(normalized.qty)
  +' ud. sin referencia (pendiente)</button></div>';
}

root.PanelBudgetSpec=Object.freeze({normalize,description,matches,add,validSpec,form,results,assignExisting,resetExisting,compareExisting});
})(window);
