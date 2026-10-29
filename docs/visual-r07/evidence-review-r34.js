/* R34 | Evidencia pública por SKU, con revisión pendiente y sin datos tarifarios.
 * Un rótulo 1P+N NO certifica seccionamiento del neutro. */
(function(root){'use strict';
const rows=[
 ['Legrand','403586','Ficha individual Legrand','https://www.legrand.es/es/productos/magnetotermico-tx3-1pn-230v-16a-curva-2-modulos-403586','2 polos totales; uno protegido; acoplamiento de neutro sí.','Diagrama por SKU con apertura efectiva del neutro y número de contactos.'],
 ['Hager','MN916V','PDF oficial, 2 páginas con inspección visual','https://assets.hager.com/step-content/P/PDS_158311212101ES/Document/std.lang.all/PDS_MN916V_2101_es-ES.pdf','1P+N, curva C, Icn 6 kA a 230 V, 1 módulo; sin diagrama inequívoco.','Esquema por SKU de contactos abiertos, especialmente el neutro.'],
 ['Hager','MN516V','PDF oficial, 2 páginas; texto consultado, captura gráfica fallida','https://assets.hager.com/step-content/P/PDS_519477012101ES/Document/std.lang.all/MN516V_2101_es-ES.pdf','1P+N, curva C, Icn 6 kA a 230 V, 2 módulos; no se confirmó apertura de N.','Revisión gráfica del PDF y esquema propio de conexión de contactos.'],
 ['Hager','CDA440M','Página Hager del RCCB 3P+N','https://hager.com/es/catalogo/producto/cda440m-diferencial-4p-40a-30ma-tipo-a','4 polos, arquitectura 3P+N; protección diferencial, no magnetotérmica.','Esquema individual de contactos, incluido N, no inferible de 3P+N.'],
 ['Schneider','A9F79116','Página Schneider Acti9 iC60N','https://www.se.com/es/es/product/A9F79116/','MCB 1P 16 A curva C; su nombre no declara polo N.','Esquema individual de contacto conmutado; no suponer neutro en 1P.']
];
const map=new Map(rows.map(([brand,ref,sourceKind,source,verified,missing])=>[
 brand+'\u001f'+ref,Object.freeze({brand,ref,sourceKind,source,verified,missing,diagramVerified:false})
]));
if(map.size!==rows.length)throw Error('Seguimiento R34 duplicado');
const get=(b,r)=>map.get(String(b)+'\u001f'+String(r))||null;
function state(record){
 const x=get(record.fabricante,record.referencia);
 if(!x)return null;
 const evidence=root.PanelSwitchingEvidenceR33?.get(x.brand,x.ref);
 const topology=root.PanelPoleTopologyR32?.get(x.brand,x.ref);
 return {...x,neutralCoupled:evidence?.neutralCoupled??null,
  neutralIsolated:evidence?.neutralIsolated??null,
  switchedPoles:topology?.switchedPoles??evidence?.switchedPoles??null};
}
function render(record,esc){
 const d=state(record);if(!d)return '';
 const noNeutral=d.brand==='Schneider'&&d.ref==='A9F79116';
 const neutral=noNeutral?'La ficha 1P no acredita un polo N.':
  d.neutralIsolated===null?'Apertura del neutro: por verificar.':'Apertura del neutro documentada.';
 return '<details class="quote-evidence-review"><summary>Revisión documental · esquema pendiente</summary>'
  +'<p><strong>Documento:</strong> '+esc(d.sourceKind)+'</p>'
  +'<p><strong>Acreditado:</strong> '+esc(d.verified)+'</p>'
  +'<p><strong>Pendiente:</strong> '+esc(d.missing)+'</p>'
  +'<p>'+esc(neutral)+' Contactos conmutados: '+(d.switchedPoles===null?'por verificar':esc(d.switchedPoles))+'.</p>'
  +'<a href="'+esc(d.source)+'" rel="noopener noreferrer" target="_blank">Abrir fuente oficial ↗</a>'
  +'</details>';
}
function overview(esc){
 return '<details class="quote-evidence-overview"><summary>Seguimiento documental · '+map.size
  +' referencias con esquema pendiente</summary><p class="tiny-hint">'
  +'Las fichas consultadas no acreditan todavía el neutro seccionado ni el número exacto de contactos. Falta de evidencia no significa falta de función.</p>'
  +'<ul>'+[...map.values()].map(x=>'<li><strong>'+esc(x.brand+' '+x.ref)+'</strong>: '+esc(x.missing)+'</li>').join('')+'</ul></details>';
}
root.PanelEvidenceReviewR34=Object.freeze({get,state,render,overview,all:()=>[...map.values()]});
})(window);