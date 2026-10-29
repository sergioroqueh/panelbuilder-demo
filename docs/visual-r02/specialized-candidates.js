/* Perfiles de comparación documental para SPD, contactores y seccionadores.
   PRESELECCION no equivale a verificación: no comprueba coordinación, cables ni normativa. */
(function(root){
'use strict';
const family={SPD:'sobretensiones',CONTACT:'contactor',SWITCH:'seccionador'};
const pole=(value)=>{
 if(Number.isInteger(value)&&value>=1&&value<=4)return value+'P';
 const str=String(value??'').trim().toUpperCase().replace(/\s+/g,'');
 return /^[1-4]P(?:\+N)?$/.test(str)?str:null;
};
const positive=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))&&Number(value)>0?Number(value):null;
function evaluate(d,record){
 const failures=[],pending=[],matches=[],a=record?.atributos||{};
 const category=family[d.kind]||null;
 if(!category||record?.categoria!==category)return {eligible:false,failures:['Familia o función no comparable.'],pending:[],matches:[]};
 function equal(label,project,commercial){
  if(project===null||project===undefined||project===''){failures.push(label+': sin definir en el diseño.');return;}
  if(commercial===null||commercial===undefined||commercial===''){failures.push(label+': ausente en ficha comercial.');return;}
  if(String(project)!==String(commercial))failures.push(label+': diseño '+project+' / ficha '+commercial+'.');
  else matches.push(label+': '+project);
 }
 function minRating(label,request,rating){
  const r=positive(request),v=positive(rating);
  if(r===null){failures.push(label+': requisito por definir.');return;}
  if(v===null){failures.push(label+': valor nominal no documentado en ficha.');return;}
  if(v<r)failures.push(label+': ficha '+v+' inferior a '+r+' exigidos.');
  else matches.push(label+': '+v+' ≥ '+r);
 }
 equal('Polos',pole(d.poles),pole(a.polos));
 if(d.kind==='SPD'){
  const spdClass=String(d.spdClass||'');
  equal('Clase SPD',spdClass,a.tipo_spd||null);
  // Cada clase combinada necesita datos T1 específicos; no inferir Iimp a partir de Imax.
  if(spdClass!=='T2')failures.push('Comparación de descargadores T1/combinados pendiente de perfil Iimp y respaldo específico.');
  const selectedNetwork=d.spdNetwork||null;
  if(!selectedNetwork)failures.push('Esquema TT/TN/IT no definido.');
  else{
   const allowed=String(a.red||'').toUpperCase().split(/[\s,;/]+/).filter(Boolean);
   if(!allowed.length)failures.push('Red compatible no documentada en la ficha.');
   else if(!allowed.includes(selectedNetwork))failures.push('Red '+selectedNetwork+' no declarada como compatible (ficha: '+allowed.join(', ')+').');
   else matches.push('Red documentada: '+selectedNetwork);
  }
  equal('Uc (V)',positive(d.spdUcV),positive(a.uc_v));
  minRating('In (kA, 8/20 µs)',d.spdInKa,a.in_ka);
  minRating('Imax (kA)',d.spdImaxKa,a.imax_ka);
  const maxUp=positive(d.spdUpKv);
  if(maxUp!==null){
   const actualUp=positive(a.up_kv);
   if(actualUp===null)failures.push('Up no documentado para el máximo exigido '+maxUp+' kV.');
   else if(actualUp>maxUp)failures.push('Up '+actualUp+' kV supera el límite '+maxUp+' kV requerido.');
   else matches.push('Up: '+actualUp+' ≤ '+maxUp+' kV');
  }else pending.push('Límite Up máximo y coordinación con tensión soportada por equipos: pendientes.');
  pending.push('Verificar protección de respaldo, esquema de conexión, longitud a PE y separación/ubicación; no aplicar por coincidencia de datos.');
 }else if(d.kind==='CONTACT'){
  equal('Bobina (V CA)',positive(d.contactCoilV),positive(a.bobina_v));
  equal('Contactos de potencia',d.contactContacts||null,a.contactos||null);
  equal('Modo de actuación',d.contactMode||null,a.modo_mando||null);
  const duty=d.contactUsageCategory||null;
  const allowed=String(a.categoria_servicio||'').split(/\s+/).filter(Boolean);
  if(!duty)failures.push('Categoría de utilización no definida en el diseño.');
  else if(!allowed.includes(duty))failures.push('Categoría '+duty+' no acreditada en ficha.');
  else{
   const rating=({ 'AC-1':'amp_ac1','AC-3':'amp_ac3','AC-7a':'amp_ac7a','AC-7b':'amp_ac7b'})[duty];
   minRating('Corriente según '+duty+' (A)',d.amp,a[rating]);
  }
  pending.push('Comprobar carga real, maniobras, temperatura, bobina y categoría de empleo final; AC-1 NO sustituye AC-3.');
 }else if(d.kind==='SWITCH'){
  equal('Montaje',d.switchMount||null,a.montaje||null);
  equal('Tipo de mando',d.switchControl||null,a.mando||null);
  const duty=d.switchDuty||null;
  const allowed=String(a.categoria_servicio||'').split(/\s+/).filter(Boolean);
  if(!duty)failures.push('Categoría de empleo del seccionador sin definir.');
  else if(!allowed.includes(duty))failures.push('La ficha no declara categoría '+duty+'.');
  else {
   const rating=({'AC-21':'amp_ac21','AC-21A':'amp_ac21a','AC-22A':'amp_ac22a'})[duty];
   minRating('Intensidad de empleo '+duty+' (A)',d.amp,a[rating]);
  }
  if(a.montaje==='panel_no_din')failures.push('El editor físico actual monta dispositivos en carril DIN; esta referencia requiere montaje específico sobre panel/puerta y NO se puede preseleccionar para ese carril.');
  else pending.push('Comprobar aptitud para seccionamiento, Icw/Inc, coordinación con protección y bornes.');
 }
 const modules=positive(a.modulos);
 if(modules===null||!Number.isInteger(modules))pending.push('Ocupación constructiva sin validación de montaje/cotas; posible ancho no entero.');
 else matches.push('Ficha indica '+modules+' módulos (solo informativo, NO altera el cuadro).');
 if(!(typeof record.url_oficial==='string'&&/^https:\/\//.test(record.url_oficial)))failures.push('Falta fuente oficial enlazada.');
 return {eligible:failures.length===0,failures,pending,matches};
}
root.PanelSpecializedCandidates=Object.freeze({family,pole,evaluate});
})(window);
