/* Estudio dimensional preliminar: medidas declaradas, no homologación constructiva. */
(function(root){
'use strict';
const fields=[['innerWidthMm','Anchura interior'],['innerHeightMm','Altura interior'],['ductLeftMm','Canaleta izquierda'],['ductRightMm','Canaleta derecha'],['ductTopMm','Canaleta superior'],['ductBottomMm','Canaleta inferior'],['railPitchMm','Distancia entre ejes DIN']];
const keys=fields.map(x=>x[0]);
function valid(g){return g===undefined||!!g&&!Array.isArray(g)&&typeof g==='object'&&Object.entries(g).every(([k,v])=>keys.includes(k)&&(v===null||typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=10000));}
function measure(a){
 const g=a.enclosureGeometry||{};
 const n=k=>typeof g[k]==='number'?g[k]:null;
 const w=n('innerWidthMm'),h=n('innerHeightMm'),l=n('ductLeftMm'),r=n('ductRightMm'),t=n('ductTopMm'),b=n('ductBottomMm'),pitch=n('railPitchMm');
 const clearWidth=[w,l,r].every(x=>x!==null)?w-l-r:null;
 const clearHeight=[h,t,b].every(x=>x!==null)?h-t-b:null;
 const railWidth=a.slots>0?a.slots*18:null;
 const conflicts=[];
 if(clearWidth!==null&&clearWidth<=0)conflicts.push('Las canaletas laterales consumen la anchura interior.');
 if(clearHeight!==null&&clearHeight<=0)conflicts.push('Las canaletas superior e inferior consumen la altura interior.');
 if(clearWidth!==null&&railWidth!==null&&clearWidth<railWidth)conflicts.push('Anchura libre inferior al ancho modular orientativo del carril.');
 if(a.rows>1&&pitch!==null&&clearHeight!==null&&(a.rows-1)*pitch>clearHeight)conflicts.push('La separación entre ejes DIN supera la altura libre.');
 return {clearWidth,clearHeight,railWidth,conflicts,pending:keys.filter(k=>n(k)===null)};
}
function set(a,key,raw){
 if(!keys.includes(key))return false;
 const value=String(raw).trim()===''?null:Number(raw);
 if(value!==null&&(!Number.isFinite(value)||value<0||value>10000))return false;
 a.enclosureGeometry={...(a.enclosureGeometry||{}),[key]:value};return true;
}
function preview(a,esc){
 const g=a.enclosureGeometry||{},m=measure(a);
 const W=g.innerWidthMm,H=g.innerHeightMm;
 if(!(W>0&&H>0))return '<p class="small-text">Vista proporcional pendiente: declara anchura y altura interiores de la envolvente.</p>';
 const scale=Math.min(1.1,560/W,420/H),vw=W*scale,vh=H*scale;
 const L=g.ductLeftMm??0,R=g.ductRightMm??0,T=g.ductTopMm??0,B=g.ductBottomMm??0;
 const rect=(x,y,w,h,klass)=>w>0&&h>0?'<rect class="'+klass+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="2"/>':'';
 const x0=L*scale,y0=T*scale,usableW=Math.max(0,W-L-R)*scale,usableH=Math.max(0,H-T-B)*scale;
 const rails=Math.max(0,Math.min(10,Number(a.rows)||0)),slots=Math.max(0,Number(a.slots)||0);
 const railWidth=slots*18*scale;
 let railMarkup='';
 if(rails&&usableW>0&&usableH>0){
   const pitch=g.railPitchMm,step=rails>1?(pitch!==null&&pitch!==undefined?pitch*scale:usableH/(rails+1)):0;
   const yFirst=rails>1&&pitch!==null&&pitch!==undefined?y0+(usableH-(rails-1)*step)/2:y0+usableH/(rails+1);
   for(let i=0;i<rails;i++){
    const y=yFirst+i*step;
    if(y<y0||y>y0+usableH)continue;
    const declared=root.PanelConstruction.rails(a)[i]?.lengthMm;
    const drawnLength=(declared===null?slots*18:declared)*scale;
    const dx=x0+(usableW-drawnLength)/2;
    railMarkup+='<line class="geom-rail" x1="'+dx+'" y1="'+y+'" x2="'+(dx+drawnLength)+'" y2="'+y+'"/>';
    for(const d of a.devices.filter(d=>d.row===i&&Number.isInteger(Number(d.pos)))){
      const x=dx+Number(d.pos)*18*scale, ww=Number(d.modules)*18*scale;
      railMarkup+=rect(x,y-9,ww,18,'geom-device');
      if(ww>=25)railMarkup+='<text class="geom-device-label" x="'+(x+ww/2)+'" y="'+(y+3)+'" text-anchor="middle">'+esc(d.label).slice(0,14)+'</text>';
    }
   }
 }
 const duct=(x,y,w,h)=>rect(x*scale,y*scale,w*scale,h*scale,'geom-duct');
 const warnings=m.conflicts.length?'<span class="geom-warning">Incompatibilidad geométrica detectada</span>':'';
 return '<div class="geom-preview" data-geom-preview="true"><div class="geom-preview-head"><strong>Alzado proporcional interior</strong><span>'+esc(String(W))+' × '+esc(String(H))+' mm · no es plano de fabricación</span></div><svg role="img" aria-label="Proporciones interiores de envolvente y canaletas" viewBox="-16 -16 '+(vw+32)+' '+(vh+32)+'" style="width:min(100%, '+(vw+32)+'px);max-height:460px;display:block;margin:12px auto"><rect class="geom-envelope" x="0" y="0" width="'+vw+'" height="'+vh+'"/>'+duct(0,0,W,T)+duct(0,H-B,W,B)+duct(0,T,L,H-T-B)+duct(W-R,T,R,H-T-B)+railMarkup+'</svg><p class="small-text">Las canaletas reflejan las medidas declaradas. Los carriles usan la longitud declarada, si existe; en otro caso su longitud es nominal y orientativa. Los dispositivos representan ocupación modular horizontal y tienen altura ilustrativa, no su tamaño real. '+(rails>1&&g.railPitchMm==null?'Separación DIN repartida solo a efectos gráficos.':'')+'</p>'+warnings+'</div>';
}
function form(a,esc){
 const m=measure(a),g=a.enclosureGeometry||{};
 const fmt=v=>v===null?'Pendiente':v.toLocaleString('es-ES',{maximumFractionDigits:1})+' mm';
 return '<section class="aux-physical-panel"><div class="aux-physical-head"><strong>Dimensiones interiores · estudio previo</strong></div><p class="small-text">Introduce medidas reales conocidas de la envolvente; no se autocompletan dimensiones comerciales.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">'+fields.map(([key,label])=>'<label style="display:grid;gap:4px;font-size:12px">'+esc(label)+' (mm)<input data-geom-field="'+key+'" type="number" min="0" max="10000" step="0.1" value="'+esc(g[key]??'')+'" placeholder="Sin definir" style="min-width:0;width:100%;padding:8px;border:1px solid #a0aec0;border-radius:5px;background:transparent;color:inherit"></label>').join('')+'</div><p class="small-text">Anchura libre: '+fmt(m.clearWidth)+' · carril orientativo: '+fmt(m.railWidth)+' · altura libre: '+fmt(m.clearHeight)+'.</p>'+m.conflicts.map(x=>'<p style="color:#b45309">⚠ '+esc(x)+'</p>').join('')+'<p class="small-text">'+m.pending.length+' medidas pendientes. Comprobación preliminar: sin cálculo de profundidad, fijaciones, curvaturas, disipación, geometría de aparatos, cableado ni accesibilidad. 18 mm/módulo es un paso de planificación conservador; no es dimensión comercial comprobada ni separación certificada.</p></section>';
}
function check(a){const m=measure(a);return [...m.conflicts.map(s=>'Envolvente: '+s),...(a.rows&&m.pending.length?['Envolvente: estudio dimensional incompleto ('+m.pending.length+' campos pendientes).']:[])];}
root.PanelEnclosureGeometry=Object.freeze({valid,measure,set,form,preview,check});
})(window);
