/* PanelBuilder R32: topología DOCUMENTAL por SKU, sin precios privados.
   "protegidos" = disparo por sobreintensidad (MCB); NO aplica a RCCB.
   "conmutados" NUNCA inferido de nombre de polos o de módulos. */
(function(root){'use strict';
const entries=[
 ['Legrand','403586','MCB','1P+N',2,1,null,'https://www.legrand.es/es/productos/magnetotermico-tx3-1pn-230v-16a-curva-2-modulos-403586'],
 ['Legrand','403620','MCB','3P',3,3,null,'https://www.legrand.es/es/productos/magnetotermico-tx3-3p-400v-40a-curva-3-modulos-403620'],
 ['Legrand','403626','MCB','4P',4,4,null,'https://www.legrand.es/productos/magnetotermico-tx3-4p-400v-16a-curva-4-modulos-403626'],
 ['Legrand','403616','MCB','3P',3,3,null,'https://www.legrand.es/es/productos/magnetotermico-tx3-3p-400v-16a-curva-3-modulos-403616'],
 ['Legrand','403033','RCCB','2P',2,null,null,'https://www.legrand.es/es/productos/diferencial-tx3-2p-230v-30ma-40a-tipo-ac-403033'],
 ['Legrand','403036','RCCB','2P',2,null,null,'https://www.legrand.es/es/productos/diferencial-tx3-2p-230v-30ma-40a-tipo-403036'],
 ['Hager','CDA440M','RCCB','3P+N',4,null,null,'https://hager.com/es/catalogo/producto/cda440m-diferencial-4p-40a-30ma-tipo-a'],
 ['Hager','MN916V','MCB','1P+N',null,null,null,'https://hager.com/es/catalogo/producto/mn916v-int-aut-serie-mn-1p-n-16a-c-6ka'],
 ['Hager','MN516V','MCB','1P+N',null,null,null,'https://hager.com/es/catalogo/producto/mn516v-int-aut-serie-mn-1p-n-16a-curva-c-6ka'],
 ['Schneider','A9F79116','MCB','1P',null,null,null,'https://www.se.com/es/es/product/A9F79116/'],
 ['Schneider','A9R61240','RCCB','2P',null,null,null,'https://www.se.com/es/es/product/A9R61240/'],
 ['Schneider','A9Z61440','RCCB','4P',null,null,null,'https://www.se.com/es/es/product/A9Z61440/'],
 ['Schneider','A9R93240','RCCB','2P',null,null,null,'https://www.se.com/es/es/product/A9R93240/']
];
const map=new Map(entries.map(([brand,ref,kind,designation,total,protectedPoles,switchedPoles,source])=>[
 brand+'|'+ref,Object.freeze({brand,ref,kind,designation,total,protectedPoles,switchedPoles,source})]));
if(map.size!==entries.length)throw Error('Duplicidad de SKU');
const get=(brand,ref)=>map.get(String(brand)+'|'+String(ref))||null;
const newDocs=Object.freeze([
 {fabricante:'Legrand',referencia:'403616',categoria:'magnetotermico',descripcion:'TX³ 3P 16A curva C · Icn IEC 60898-1 10kA/230V y 6kA/400V',
  atributos:{polos:'3P',amp:16,curva:'C',icn_60898_ka:6,modulos:3},
  url_oficial:'https://www.legrand.es/es/productos/magnetotermico-tx3-3p-400v-16a-curva-3-modulos-403616'},
 {fabricante:'Legrand',referencia:'403033',categoria:'diferencial',descripcion:'TX³ RCCB independiente 2P 40A 30mA tipo AC',
  atributos:{tipo:'RCCB',polos:'2P',amp:40,idn_ma:30,tipo_rcd:'AC',modulos:2},
  url_oficial:'https://www.legrand.es/es/productos/diferencial-tx3-2p-230v-30ma-40a-tipo-ac-403033'}
].map(d=>Object.freeze({...d,atributos:Object.freeze(d.atributos),fuente_tipo:'ficha_oficial',
 estado_comercial:'situacion_comercial_por_confirmar',fecha_consulta:'2026-10-22',
 compatibilidad_automatica:false,estado_compatibilidad:'sin_validar',
 precio_publicado_eur:null,iva_base:'no_especificado',pvp_sin_iva_eur:null})));
function merge(base,brand='',category=''){
 const m=new Map(base.map(x=>[x.fabricante+'|'+x.referencia,x]));
 for(const d of newDocs)if((!brand||d.fabricante===brand)&&(!category||d.categoria===category))
  if(!m.has(d.fabricante+'|'+d.referencia))m.set(d.fabricante+'|'+d.referencia,d);
 return [...m.values()];
}
function icnAt(record,voltage){
 if(record.fabricante!=='Legrand'||record.referencia!=='403616')return null;
 const ka=voltage===230?10:voltage===400?6:null;
 return ka===null?null:{ka,voltage,source:newDocs[0].url_oficial,basis:'Icn IEC 60898-1 en ficha individual y tensión'};
}
function display(record){
 const x=get(record.fabricante,record.referencia),f=n=>n===null||n===undefined?'por verificar':String(n);
 return {designation:x?.designation||String(record.atributos?.polos||'por verificar'),
  total:f(x?.total),protected:record.categoria==='diferencial'?'No aplica (RCCB)':f(x?.protectedPoles),
  switched:f(x?.switchedPoles),source:x?.source||null};
}
root.PanelPoleTopologyR32=Object.freeze({
 get,display,merge,icnAt,
 eligibleProtected:(r,n)=>{const x=get(r.fabricante,r.referencia);return !!x&&x.kind==='MCB'&&x.protectedPoles===n;},
 all:()=>[...map.values()],newDossiers:()=>newDocs.slice()
});
})(window);
