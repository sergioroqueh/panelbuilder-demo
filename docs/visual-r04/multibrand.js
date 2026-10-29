/* PanelBuilder v0.6 · preselección COMERCIAL, sin certificar equivalencias */
(function(root){'use strict';
 const records=root.PanelCandidates||[];
 const family=k=>({RCD:'RCCB',CONTACT:'CONTACT'}[k]||k);
 function eligible(d,row){
   if(row.fabricante===undefined || row.familia!==family(d.kind))return null;
   if(String(row.polos)!==String(d.poles))return null;
   if(Number(row.intensidad_A)!==Number(d.amp))return null;
   if(d.kind==='MCB' && String(row.curva)!==String(d.curve))return null;
   if(d.kind==='RCD' && (Number(row['IΔn_mA'])!==Number(d.sensitivity)||String(row.tipo_diferencial)!==String(d.rcdType)))return null;
   // Aparamenta SPD y maniobra requieren parámetros que el editor aún no pide.
   if(['SPD','CONTACT','SWITCH'].includes(d.kind))return {blocked:true,reason:'Faltan datos funcionales para determinar una equivalencia.'};
   if((row.estado||'').includes('REVISI') || (row.estado||'').includes('BLOQUE'))return {blocked:true,reason:'Revisión documental o incertidumbre crítica.'};
   if(!Number.isFinite(Number(row.ancho_mm))||Number(row.ancho_mm)<=0)return {blocked:true,reason:'Ancho comercial no documentado.'};
   if(d.kind==='MCB'){
     if(row.Icn_60898_kA===null||row.Icn_60898_kA===undefined)return {blocked:true,reason:'Poder de corte Icn no verificado.'};
     if(Number(d.breakingKa)>0 && Number(row.Icn_60898_kA)<Number(d.breakingKa))return {blocked:true,reason:'Icn inferior al valor requerido.'};
   }
   return {blocked:false,reason: d.kind==='MCB'&&!Number(d.breakingKa)?'Falta fijar Icn requerido; selección condicionada.':'Preselección condicionada: revisar ficha y montaje.'};
 }
 function candidates(d,brand){return records.filter(r=>r.fabricante===brand).map(r=>({...r,...(eligible(d,r)||{notMatch:true})})).filter(r=>!r.notMatch).sort((a,b)=>Number(a.blocked)-Number(b.blocked)||Number(a.ancho_mm)-Number(b.ancho_mm));}
 function find(d,brand,ref){return candidates(d,brand).find(r=>r.referencia===ref&&!r.blocked)||null;}
 function normalized(d,brand,ref){const r=find(d,brand,ref);if(!r)return null;return {ref:r.referencia,name:r.perfil_id,source:r.fuente,widthMm:r.ancho_mm,modules:Math.ceil(Number(r.ancho_mm)/18),status:r.estado,reason:r.reason};}
 root.PanelMultibrand={records,candidates,find,normalized,eligible};
})(window);