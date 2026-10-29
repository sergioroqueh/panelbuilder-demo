/* Componentes constructivos genéricos, sin referencia comercial ni validación constructiva. */
(function(root){
'use strict';
const MAX_ROWS=10,MAX_MM=10000;
function valid(c){
 if(c===undefined)return true;
 if(!c||Array.isArray(c)||typeof c!=='object')return false;
 if(Object.keys(c).some(k=>!['rails','ductDepthMm'].includes(k)))return false;
 if(c.ductDepthMm!==undefined&&c.ductDepthMm!==null&&(!Number.isFinite(c.ductDepthMm)||c.ductDepthMm<0||c.ductDepthMm>MAX_MM))return false;
 if(c.rails===undefined)return true;
 if(!c.rails||Array.isArray(c.rails)||typeof c.rails!=='object'||Object.keys(c.rails).length>MAX_ROWS)return false;
 return Object.entries(c.rails).every(([k,v])=>/^(0|[1-9])$/.test(k)&&v!==null&&Number.isFinite(v)&&v>0&&v<=MAX_MM);
}
function rails(a){
 const values=a.physicalConstruction?.rails||{};
 return Array.from({length:Math.max(0,Math.min(MAX_ROWS,Number(a.rows)||0))},(_,i)=>({id:'rail-'+i,index:i,lengthMm:values[i]??null,minimumNominalMm:Number(a.slots||0)*18}));
}
function set(a,key,value){
 const raw=String(value).trim(),v=raw===''?null:Number(raw);
 const rail=/^rail:([0-9])$/.exec(key);
 if(!rail&&key!=='ductDepthMm')return false;
 if(v!==null&&(!Number.isFinite(v)||v<0||v>MAX_MM))return false;
 if(rail&&v!==null&&v===0)return false;
 const obj=a.physicalConstruction||{rails:{}};
 obj.rails=obj.rails||{};
 if(rail){if(Number(rail[1])>=Number(a.rows||0))return false;if(v===null)delete obj.rails[rail[1]];else obj.rails[rail[1]]=v;}
 else obj.ductDepthMm=v;
 a.physicalConstruction=obj;
 return true;
}
function check(a){
 const c=a.physicalConstruction||{},issues=[];
 if(!valid(c))return ['Datos de elementos constructivos incorrectos.'];
 for(const rail of rails(a)){
  if(rail.lengthMm===null)issues.push('Carril DIN '+(rail.index+1)+': longitud física por confirmar.');
  else if(rail.lengthMm<rail.minimumNominalMm)issues.push('Carril DIN '+(rail.index+1)+': longitud declarada menor que los '+rail.minimumNominalMm+' mm modulares nominales.');
  const free=root.PanelEnclosureGeometry.measure(a).clearWidth;
  if(free!==null&&rail.lengthMm!==null&&rail.lengthMm>free)issues.push('Carril DIN '+(rail.index+1)+': longitud superior a anchura libre entre canaletas.');
 }
 const duct=Object.values(a.enclosureGeometry||{}).some((v)=>typeof v==='number'&&v>0);
 if(duct&&c.ductDepthMm==null)issues.push('Canaletas: falta profundidad de perfil; capacidad de cableado no comprobada.');
 return issues;
}
function form(a,esc){
 const c=a.physicalConstruction||{},list=rails(a);
 const input=(key,title,value)=>'<label style="display:grid;gap:5px;font-size:12px">'+esc(title)+'<input data-construction-field="'+esc(key)+'" type="number" step="0.1" min="0" max="10000" value="'+esc(value??'')+'" placeholder="Por definir" style="padding:8px;width:100%;min-width:0;border:1px solid #a8b6c5;border-radius:5px;background:transparent;color:inherit"></label>';
 return '<section class="aux-physical-panel" data-construction-panel="true"><div class="aux-physical-head"><strong>Carriles y canaletas · componentes genéricos</strong></div><p class="small-text">Cada carril tiene identidad por fila y una longitud declarada. Las anchuras reservadas para las cuatro canaletas se configuran arriba, en Dimensiones interiores.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">'+list.map(r=>input('rail:'+r.index,'Carril DIN '+(r.index+1)+' · longitud (mm)',r.lengthMm)).join('')+input('ductDepthMm','Profundidad de canaleta (mm)',c.ductDepthMm)+'</div><p class="small-text">No hay referencia comercial ni PVP asignado. No se calculan capacidad de llenado, fijaciones, cargas de carril ni interferencias tridimensionales.</p></section>';
}
root.PanelConstruction=Object.freeze({valid,rails,set,check,form});
})(window);
