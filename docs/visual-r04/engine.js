/* PanelBuilder · motor genérico experimental v0.5. Sin validación eléctrica normativa. */
(function (root, build) {
  const api = build();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PanelEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const brands = {
    Hager: [
      { ref: 'MCA216', kind: 'MCB', poles: '2P', amp: 16, curve: 'C', modules: 2,
        name: 'Magnetotérmico 2P C16', widthMm: 35,
        source: 'https://hager.com/es/catalogo/producto/mca216-automatico-mca-2p-16a-c-6-10ka' },
      { ref: 'CDA240M', kind: 'RCD', poles: '2P', amp: 40, sensitivity: 30, rcdType: 'A', modules: 2,
        name: 'Diferencial 2P 40 A / 30 mA tipo A', widthMm: 35,
        source: 'https://hager.com/es/catalogo/producto/cda240m-diferencial-2p-40a-30ma-tipo-a' }
    ]
  };
  function matchBrand(device, brand) {
    if (!brand || brand === 'Generico') return null;
    return (brands[brand] || []).find(item => item.kind === device.kind &&
      item.poles === device.poles && Number(item.amp) === Number(device.amp) &&
      (item.kind !== 'MCB' || item.curve === device.curve) &&
      (item.kind !== 'RCD' || (item.sensitivity === Number(device.sensitivity) && item.rcdType === device.rcdType))) || null;
  }
  function graphCheck(devices) {
    const ids = new Set(devices.map(d => d.id));
    const errors = [];
    if (ids.size !== devices.length) errors.push('Hay identificadores de dispositivo duplicados.');
    const byId = new Map(devices.map(d => [d.id, d]));
    for (const d of devices) {
      if (d.parent && !ids.has(d.parent)) errors.push(`${d.label}: conexión de origen inexistente.`);
      if (d.parent === d.id) errors.push(`${d.label}: no puede conectarse a sí mismo.`);
      let p = d.parent;
      const seen = new Set([d.id]);
      while (p && byId.has(p)) {
        if (seen.has(p)) { errors.push(`${d.label}: se ha detectado un ciclo en las relaciones.`); break; }
        seen.add(p); p = byId.get(p).parent;
      }
      if (!Number.isInteger(Number(d.modules)) || Number(d.modules) < 1 || Number(d.modules) > 48) {
        errors.push(`${d.label}: ocupación modular no válida.`);
      }
    }
    return [...new Set(errors)];
  }
  function orderedDevices(devices) {
    const children = new Map();
    devices.forEach(d => { const k = d.parent || '__root'; if (!children.has(k)) children.set(k, []); children.get(k).push(d); });
    const order = [], visited = new Set();
    function visit(parent) {
      (children.get(parent) || []).forEach(d => {
        if (visited.has(d.id)) return;
        visited.add(d.id); order.push(d); visit(d.id);
      });
    }
    visit('__root');
    devices.forEach(d => { if (!visited.has(d.id)) { visited.add(d.id); order.push(d); }});
    return order;
  }
  // Dimensión PROVISIONAL: estimación modular deliberadamente prudente,
  // NO es característica verificada ni sustituye al ancho real del fabricante.
  function estimateModules(device) {
    const poles = String(device.poles || '2P');
    if (poles === '1P') return 1;
    if (poles === '3P' ) return 3;
    if (poles === '4P' || poles === '3P+N') return 4;
    // 1P+N puede ocupar uno o dos módulos según producto; estimamos 2.
    return 2;
  }
  function recalcWidths(devices, brand) {
    return devices.map(d => {
      const match=matchBrand(d,brand);
      return {...d, modules: match ? match.modules : estimateModules(d),
        moduleSource: match ? 'catalog' : 'estimate',
        matchedRef: match ? match.ref : null};
    });
  }
  function propose(devices, reservePct = 20) {
    const errors = graphCheck(devices);
    if (errors.length) return { ok: false, errors };
    if (!devices.length) return { ok: false, errors: ['Primero añade al menos un componente.'] };
    const order = orderedDevices(devices);
    const used = order.reduce((s, d) => s + Number(d.modules), 0);
    const demand = Math.ceil(used * (1 + Math.max(0, Math.min(50, Number(reservePct) || 0)) / 100));
    const options = [];
    // Formatos genéricos prácticos para cuadros modulares: 12, 18, 24 M/fila.
    // Una fila de 48 M no se trata como formato modular estándar por defecto.
    for (const slots of [12, 18, 24]) {
      for (let rows = 1; rows <= 10; rows++) {
        const capacity = rows * slots;
        if (capacity < demand) continue;
        const positions = {}, widths = Array(rows).fill(0);
        let current = 0, valid = true;
        for (const d of order) {
          const w = Number(d.modules);
          if (w > slots) { valid = false; break; }
          if (widths[current] + w > slots) current++;
          if (current >= rows) { valid = false; break; }
          positions[d.id] = { row: current, pos: widths[current] };
          widths[current] += w;
        }
        if (valid) options.push({ rows, slots, capacity, positions, widths });
      }
    }
    // Mínimo por capacidad; en empate priorizar menos filas (no filas kilométricas).
    options.sort((a, b) => a.capacity - b.capacity || a.rows - b.rows || a.slots - b.slots);
    const best = options[0];
    if (!best) return {ok:false,errors:['No hay formato genérico compatible en el rango de prueba.']};
    return { ok:true, ...best, options, used, reserved: best.capacity - used, demand, reservePct: Number(reservePct) || 0,
      caveat: 'Mínimo modular aproximado de 12/18/24 módulos por fila. Geometría y térmica NO verificadas.' };
  }
  // Inserta un dispositivo en una arista sin alterar las derivaciones hermanas.
  // parentId=null representa la entrada de alimentación de un dispositivo raíz.
  function insertBetween(devices, parentId, childId, newDevice) {
    const parent = parentId || null;
    const child = devices.find(d => d.id === childId);
    if (!child) throw new Error('El dispositivo destino ya no existe.');
    if ((child.parent || null) !== parent) throw new Error('La conexión ha cambiado; vuelve a seleccionarla.');
    if (devices.some(d => d.id === newDevice.id)) throw new Error('Identificador de dispositivo duplicado.');
    if (parent && !devices.some(d => d.id === parent)) throw new Error('La protección de origen no existe.');
    const next = devices.map(d => d.id === childId ? {...d,parent:newDevice.id} : {...d});
    const index = next.findIndex(d => d.id === childId);
    next.splice(index,0,{...newDevice,parent,row:null,pos:null});
    const errors=graphCheck(next);
    if (errors.length) throw new Error(errors.join(' '));
    return next;
  }
  // Árbol de lectura vertical, con nodos agrupados por sus descendientes.
  function verticalTree(devices) {
    if (!devices.length) return {locations:new Map(),width:560,height:280,depth:0};
    const children=new Map(),byId=new Map(devices.map(d=>[d.id,d]));
    devices.forEach(d=>{const key=d.parent&&byId.has(d.parent)?d.parent:'__root';
      if(!children.has(key))children.set(key,[]);children.get(key).push(d);
    });
    const positions=new Map();let leaf=0,maxDepth=0;
    const dx=174,dy=154,baseX=95,baseY=164;
    const walk=(d,depth)=>{
      maxDepth=Math.max(maxDepth,depth);
      const kids=children.get(d.id)||[];
      let x;
      if(!kids.length){x=baseX+leaf*dx;leaf++;}
      else {const xs=kids.map(ch=>walk(ch,depth+1));x=(xs[0]+xs[xs.length-1])/2;}
      positions.set(d.id,{x,y:baseY+depth*dy,depth});return x;
    };
    (children.get('__root')||[]).forEach(d=>walk(d,0));
    devices.filter(d=>!positions.has(d.id)).forEach(d=>walk(d,0));
    return {locations:positions,width:Math.max(560,baseX*2+Math.max(0,leaf-1)*dx+144),height:baseY+(maxDepth*dy)+135,depth:maxDepth};
  }
  function fitsPlacement(devices, subjectId, row, pos, rows, slots) {
    const d = devices.find(x => x.id === subjectId);
    if (!d || row < 0 || row >= rows || pos < 0 || pos + d.modules > slots) return false;
    return devices.filter(x => x.id !== subjectId && x.row === row && x.pos !== null && x.pos !== undefined)
      .every(x => pos + d.modules <= x.pos || x.pos + x.modules <= pos);
  }
  return { brands, matchBrand, estimateModules, recalcWidths, graphCheck, orderedDevices, propose, fitsPlacement, insertBetween, verticalTree };
});