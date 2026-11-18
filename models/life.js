/* =====================================================================
   THE LIFE OF THE TOWN — phase 1 (2026-11-18). Specs: docs/人物作息与关系网-v5.md, docs/人物系统实施与验收-v5.md.

   A world that runs by itself. Nobody here is steered by the viewer: every walk, sit, hand-over, change of clothes, ride and drive
   comes from a person's own day (a list of anchors: where to be and what to do from what time), the weather and small scripted
   events between people. The viewer only borrows eyes (models/views.js).

   - people: index's blocky bodies (makePerson: hair styles, glasses, beard, cane, hunch), rebuilt so that each joint is one mesh whose
     vertex colours are grouped by part (coat, trousers, sleeves, collar, shoes ...): a change of clothes rewrites a few colours, never the
     body. Aprons, scarves, a blanket, an umbrella, a raincoat, hands, the head are their own pieces (shown, hidden, hidden for one view).
   - days: anchors are arrival times; the departure is worked back from the real path length (WORLD.path) at the person's own speed.
   - items: one instance each, always atPlace / heldBy; a hand-over moves it from one hand to the other at the moment the hands meet.
   - events: E01 pigeons, E04 bread, cup to the window table, E05 the empty house, E06 care, E08 the cat's bowl, E09 the glove, the glove
     at the school gate, E10 the nurse at night; each has a rain variant.
   - transport: R05 and the visiting father and daughter ride the tram (the map's own car, seats, doors); R22 drives a car of the
     town's traffic from the car park to the harbour and back.
   - animals: the cat, grandma's dog (on its lead), the white pigeon and four grey ones.
   - one interior: grandma's living room (H01), built below her house as its own room instance.
   ===================================================================== */
export function createLife(C){
const { THREE, scene, WORLD, WX, G } = C;
const clamp = C.clamp, lerp = C.lerp, smooth = C.smooth, wrapA = C.wrapA;
const STEP_H = C.SIM.hourSec || 25;                         // real seconds per world hour (the page's clock)
const hm = (s) => { const [h, m] = s.split(':').map(Number); return h*60 + (m || 0); };
const hash = (a, b = 0) => { const x = Math.sin(a*127.1 + b*311.7)*43758.5453; return x - Math.floor(x); };
const yawTo = (fx, fz) => Math.atan2(-fz, fx);              // a person faces +x: the yaw that faces (fx, fz)
const LOG = []; const log = (...a) => { LOG.push(a.join(' ')); if (LOG.length > 400) LOG.shift(); };

/* ---------------------------------------------------------------------
   PEOPLE: index's makePerson, parts kept apart by colour group
   --------------------------------------------------------------------- */
const PERSON_MAT = new THREE.MeshLambertMaterial({ vertexColors:true, flatShading:true });
const MATS = new Map(); const matOf = (c) => { let m = MATS.get(c); if (!m){ m = new THREE.MeshLambertMaterial({ color:c, flatShading:true }); MATS.set(c, m); } return m; };
const RBOX = new Map(); const rbox = (w, h, d, r) => { const k = [w, h, d, r].map(v=>v.toFixed(3)).join(','); let g = RBOX.get(k); if (!g){ g = new C.RoundedBoxGeometry(w, h, d, 2, Math.min(r, w/2, h/2, d/2)); RBOX.set(k, g); } return g; };
function buildPersonX(L){
  const PS = 0.82, S = (L.s || 1)*PS, Hm = L.h || 1, Wm = L.w || 1, HS = L.head || 1;
  const LL = 0.85*Hm, TH = 0.75*Hm, TW = 0.5*Wm, HD = 0.38*HS, AL = 0.62*Hm;
  const O0 = { ...L.fixed, ...(L.outfits[L.outfit0 || 'casual'] || Object.values(L.outfits)[0]) };   // (someone with no casual clothes is built in their first outfit)
  const p = new THREE.Group(); p.scale.setScalar(S); p.userData.person = true; p.userData.dyn = true; scene.add(p);
  const grp = (par, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); par.add(g); return g; };
  const comps = {};
  // slot: which colour group it belongs to; comp: a piece of its own (not merged)
  const b = (par, w, h, d, slot, x, y, z, r = 0.05, comp) => { const col = slot[0] === '#' ? slot : (O0[slot] || '#ff00ff');
    const m = new THREE.Mesh(rbox(w, h, d, r), comp ? matOf(col) : PERSON_MAT); m.position.set(x, y + h/2, z); m.castShadow = true; m.userData.slot = slot; m.userData.col = col;
    if (comp){ m.userData.comp = comp; (comps[comp] = comps[comp] || []).push(m); } par.add(m); return m; };
  const UL = LL*0.52, LO = LL - UL, legs = [], shins = [], feet = [];
  [-1, 1].forEach(sg=>{ const l = grp(p, 0, LL, sg*0.12*Wm); b(l, 0.2, UL + 0.04, 0.2, 'pants', 0, -UL - 0.02, 0, 0.06);
    const sh = grp(l, 0, -UL, 0); b(sh, 0.17, LO, 0.17, L.skirt ? 'skin' : 'pants', 0, -LO, 0, 0.05);
    const ft = grp(sh, 0, -LO, 0); b(ft, 0.3, 0.1, 0.19, 'shoes', 0.05, -0.02, 0, 0.04); b(ft, 0.31, 0.03, 0.2, 'sole', 0.05, -0.03, 0, 0.01);
    legs.push(l); shins.push(sh); feet.push(ft); });
  const up = grp(p, 0, LL, 0);
  b(up, 0.3*Wm, 0.22, TW*0.92, 'pants', 0, -0.08, 0, 0.06); b(up, 0.34*Wm, TH*0.62, TW, 'coat', 0, 0.1, 0, 0.08); b(up, 0.38*Wm, TH*0.42, TW + 0.06, 'coat', 0, TH*0.56, 0, 0.09);
  b(up, 0.2, 0.06, 0.22, 'collar', 0.1*Wm, TH*0.94, 0, 0.02);
  if (L.skirt) b(up, 0.5*Wm, 0.55, TW + 0.14, 'skirt', 0, -0.5, 0, 0.06);
  // pieces of their own: shown by the outfit (apron, scarf, vest), by the weather (raincoat) or by the day (blanket)
  if (L.apron) b(up, 0.04, TH*0.95, TW*0.86, L.apron, 0.19*Wm, -0.05, 0, 0.01, 'apron');
  if (L.scarf) b(up, 0.4*Wm, 0.13, TW + 0.08, L.scarf, 0, TH*0.92, 0, 0.05, 'scarf');
  if (L.vest) b(up, 0.36*Wm, TH*0.6, TW + 0.04, L.vest, 0, TH*0.3, 0, 0.08, 'vest');
  if (L.raincoat){ b(up, 0.42*Wm, TH*1.05, TW + 0.12, L.raincoat, 0, -0.12, 0, 0.1, 'raincoat'); }
  b(up, 0.46*Wm, 0.1, TW + 0.2, '#e8dcc8', -0.03, TH*0.86, 0, 0.05, 'blanket'); b(up, 0.1, TH*0.9, TW + 0.2, '#e8dcc8', -0.2*Wm, 0.0, 0, 0.04, 'blanket');
  if (L.pack){ b(up, 0.24, 0.48*Hm, TW*0.8, L.pack, -0.29*Wm, TH*0.25, 0, 0.07, 'pack'); }
  const arms = [], fores = [], hands = [];
  [-1, 1].forEach(sg=>{ const a = grp(up, 0, TH - 0.06, sg*(TW/2 + 0.08)); b(a, 0.15, AL*0.52, 0.15, 'sleeve', 0, -AL*0.52, 0, 0.06);
    const fa = grp(a, 0, -AL*0.5, 0); b(fa, 0.13, AL*0.5, 0.13, 'sleeve', 0, -AL*0.5, 0, 0.05);
    const hd = b(fa, 0.12, 0.14, 0.11, O0.skin, 0.01, -AL*0.5 - 0.14, 0, 0.05, 'hands');
    const sock = grp(fa, 0.06, -AL*0.5 - 0.1, 0); sock.userData.hand = sg;                          // where a held thing sits
    arms.push(a); fores.push(fa); hands.push(sock); });
  if (L.cane) b(arms[1], 0.05, LL + TH - AL - 0.2, 0.05, '#5a3a24', 0.1, -(LL + TH - 0.05), 0, 0.02, 'cane');
  if (L.bag) b(fores[0], 0.12, 0.32, 0.3, L.bag, 0, -AL*0.5 - 0.42, 0, 0.04, 'bag');
  const head = grp(up, 0, TH + 0.08, 0); head.rotation.order = 'YXZ';
  b(head, 0.14, 0.12, 0.14, 'skin', 0, -0.1, 0, 0.04);                                                  // the neck goes with the head (an empty-clothes view hides both)
  b(head, HD, HD*1.08, HD*0.94, 'skin', 0, 0, 0, 0.1);
  [-1, 1].forEach(sg=>b(head, 0.06, 0.1, 0.04, 'skin', -0.01, HD*0.4, sg*HD*0.5, 0.015));
  b(head, 0.05, 0.07, 0.06, 'skin', HD/2 + 0.02, HD*0.38, 0, 0.015); b(head, 0.02, 0.02, 0.1, '#b0606a', HD/2 + 0.002, HD*0.18, 0, 0.005);
  const cap = () => b(head, HD + 0.05, HD*0.4, HD*0.98 + 0.04, 'hair', -0.02, HD*0.82, 0, 0.08);
  switch (L.hair){
    case 'long': cap(); b(head, 0.13, HD*1.55, HD + 0.06, 'hair', -HD/2 - 0.03, 0, 0, 0.05); break;
    case 'pony': cap(); b(head, 0.12, 0.4, 0.12, 'hair', -HD/2 - 0.08, HD*0.25, 0, 0.05); break;
    case 'bun':  cap(); b(head, 0.2, 0.2, 0.2, 'hair', -HD/2 - 0.02, HD*0.95, 0, 0.09); break;
    case 'pigtails': cap(); [-1, 1].forEach(sg=>b(head, 0.12, 0.28, 0.12, 'hair', -0.05, HD*0.3, sg*(HD/2 + 0.08), 0.05)); break;
    case 'cap':  b(head, HD + 0.07, HD*0.38, HD + 0.07, L.capC || '#444', 0, HD*0.86, 0, 0.08); b(head, 0.22, 0.04, HD*0.9, L.capC || '#444', HD/2 + 0.09, HD*0.72, 0, 0.015); break;
    case 'beanie': b(head, HD + 0.06, HD*0.5, HD + 0.06, L.hatC || '#3f8f8a', 0, HD*0.8, 0, 0.1); b(head, 0.1, 0.1, 0.1, L.hatC || '#3f8f8a', 0, HD*1.12, 0, 0.05); break;
    case 'whitecap': cap(); b(head, HD + 0.08, HD*0.55, HD + 0.08, '#fbfaf6', -0.01, HD*0.9, 0, 0.12, 'workcap'); break;
    case 'bald': b(head, HD*0.6, HD*0.28, HD + 0.04, 'hair', -HD*0.22, HD*0.4, 0, 0.05); break;
    default: cap();
  }
  if (L.beard) b(head, 0.07, HD*0.42, HD*0.8, 'hair', HD/2 + 0.02, -HD*0.08, 0, 0.03);
  if (L.glasses){ [-1, 1].forEach(sg=>b(head, 0.03, 0.08, 0.12, '#2a2630', HD/2 + 0.02, HD*0.6, sg*HD*0.22, 0.01)); b(head, 0.02, 0.02, HD*0.9, '#2a2630', HD/2 + 0.02, HD*0.62, 0, 0.005); }
  [-1, 1].forEach(sg=>{ b(head, 0.02, 0.06, 0.05, '#2a2430', HD/2 + 0.005, HD*0.6, sg*HD*0.22, 0.01); b(head, 0.02, 0.02, 0.07, 'hair', HD/2 + 0.005, HD*0.72, sg*HD*0.22, 0.005); });
  if (L.hunch) up.rotation.z = -L.hunch;
  // the umbrella (index): on the shoulder, opened and closed by scale
  const umb = grp(up, 0.12, TH + HD + 0.2, 0.18); umb.userData.comp = 'umbrella';
  b(umb, 0.03, 0.75, 0.03, '#333333', 0, -0.75, 0, 0.01, 'umbrella'); b(umb, 1.15, 0.07, 1.15, L.umb || '#2f3a52', 0, 0, 0, 0.03, 'umbrella'); b(umb, 0.6, 0.12, 0.6, '#222222', 0, 0.07, 0, 0.04, 'umbrella');
  umb.visible = false; umb.scale.set(0.25, 1, 0.25);
  // merge each joint's plain boxes into one mesh; remember which vertices are which colour group
  p.updateMatrixWorld(true); const merged = [];
  const groups = []; p.traverse(o=>{ if (o.isGroup || o === p) groups.push(o); });
  groups.forEach(gr=>{ const ms = gr.children.filter(c=>c.isMesh && !c.userData.comp); if (!ms.length) return;
    let start = 0; const ranges = [];
    const geos = ms.map(c=>{ const gg = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); c.updateMatrix(); gg.applyMatrix4(c.matrix);
      for (const k of Object.keys(gg.attributes)) if (!['position', 'normal'].includes(k)) gg.deleteAttribute(k);
      const n = gg.attributes.position.count, col = new THREE.Color(c.userData.col), arr = new Float32Array(n*3); for (let i=0;i<n;i++){ arr[i*3] = col.r; arr[i*3+1] = col.g; arr[i*3+2] = col.b; }
      gg.setAttribute('color', new THREE.BufferAttribute(arr, 3)); ranges.push({ slot:c.userData.slot, start, n }); start += n; return gg; });
    ms.forEach(c=>gr.remove(c)); const mm = new THREE.Mesh(C.mergeGeometries(geos, false), PERSON_MAT); mm.castShadow = true; gr.add(mm); geos.forEach(g2=>g2.dispose());
    merged.push({ mesh:mm, ranges }); });
  const pp = { g:p, legs, shins, feet, arms, fores, hands, head, up, umb, comps, merged, LL, S, HD, TH, AL, mv:0, seed:hash(L.id.charCodeAt(1)*7 + L.id.charCodeAt(2), 3)*9,
    freq:L.freq || 6.5, swing:L.swing ?? 0.5, bounce:L.bounce ?? 0.035, stride:L.stride ?? 0.55, hunch:L.hunch || 0, outfit:null, look:L };
  showComp(pp, 'blanket', false); showComp(pp, 'raincoat', false);
  setOutfit(pp, L.outfit0 || 'casual'); return pp;
}
const _c = new THREE.Color();
function setOutfit(pp, name){ const L = pp.look, O = { ...L.fixed, ...(L.outfits[name] || L.outfits.casual || Object.values(L.outfits)[0]) }; if (pp.outfit === name) return; pp.outfit = name;
  pp.merged.forEach(({ mesh, ranges })=>{ const a = mesh.geometry.attributes.color;
    ranges.forEach(r=>{ if (r.slot[0] === '#' || !O[r.slot]) return; _c.set(O[r.slot]); for (let i=r.start;i<r.start + r.n;i++) a.setXYZ(i, _c.r, _c.g, _c.b); }); a.needsUpdate = true; });
  const on = new Set(O.comps || []); ['apron', 'scarf', 'vest', 'pack', 'bag', 'workcap'].forEach(k=>{ (pp.comps[k] || []).forEach(m=>m.visible = on.has(k)); }); }
const showComp = (pp, k, on) => { (pp.comps[k] || []).forEach(m=>m.visible = on); };

/* ---------------------------------------------------------------------
   ITEMS: one of each; atPlace (a socket in the world) or heldBy (a hand)
   --------------------------------------------------------------------- */
const ITEMS = {};
function itemMesh(kind){ const g = new THREE.Group(); const bx = (w, h, d, c, x = 0, y = 0, z = 0, r = 0.01) => { const m = new THREE.Mesh(rbox(w, h, d, r), matOf(c)); m.position.set(x, y + h/2, z); m.castShadow = true; g.add(m); return m; };
  if (kind === 'basket'){ bx(0.5, 0.18, 0.34, '#c8a078', 0, 0, 0, 0.04); bx(0.44, 0.08, 0.28, '#f2d29a', 0, 0.16, 0, 0.03); bx(0.18, 0.06, 0.12, '#d8a070', 0.1, 0.2, 0.05, 0.03); bx(0.04, 0.22, 0.04, '#a88058', 0, 0.18, 0, 0.01); }
  else if (kind === 'cup'){ bx(0.16, 0.012, 0.16, '#f4eef4'); bx(0.09, 0.1, 0.09, '#fbf4f6', 0, 0.012, 0, 0.02); bx(0.07, 0.01, 0.07, '#8a5a3a', 0, 0.108, 0); bx(0.03, 0.05, 0.015, '#fbf4f6', 0.06, 0.04, 0, 0.007); }
  else if (kind === 'bowl'){ bx(0.26, 0.07, 0.26, '#e88aa0', 0, 0, 0, 0.03); bx(0.2, 0.02, 0.2, '#c8945a', 0, 0.06, 0); }
  else if (kind === 'glove'){ bx(0.16, 0.2, 0.06, '#3a6ad0', 0, 0, 0, 0.03); bx(0.06, 0.09, 0.05, '#3a6ad0', 0.09, 0.07, 0, 0.02); const st = bx(0.17, 0.025, 0.065, '#ffffff', 0, 0.08, 0, 0.005); st.visible = false; g.userData.stitch = st; }
  else if (kind === 'paper'){ const m = bx(0.3, 0.004, 0.22, '#fffaf0'); const d = bx(0.16, 0.006, 0.1, '#f48ab0', -0.03, 0, 0.02); g.userData.sheet = m; }
  else if (kind === 'water'){ bx(0.07, 0.16, 0.07, '#d8ecf8', 0, 0, 0, 0.02); bx(0.05, 0.03, 0.05, '#4a8ad0', 0, 0.16, 0, 0.01); }
  else if (kind === 'carebag'){ bx(0.36, 0.26, 0.16, '#3a3e58', 0, 0, 0, 0.04); bx(0.1, 0.06, 0.01, '#ffffff', 0, 0.14, 0.085); }
  else if (kind === 'foodbag'){ bx(0.16, 0.2, 0.1, '#e8d4b0', 0, 0, 0, 0.02); }
  else if (kind === 'crate'){ bx(0.5, 0.36, 0.4, '#c8a888', 0, 0, 0, 0.02); bx(0.52, 0.04, 0.42, '#a88a6a', 0, 0.32, 0); }
  else if (kind === 'phone'){ bx(0.075, 0.14, 0.012, '#2a2838', 0, 0, 0, 0.006); bx(0.06, 0.11, 0.004, '#9ec8f4', 0, 0.015, 0.008); }
  else if (kind === 'notebook'){ bx(0.22, 0.03, 0.28, '#7a5a8a'); bx(0.2, 0.012, 0.26, '#fffaf0', 0, 0.03, 0); }
  else if (kind === 'bouquet'){ bx(0.16, 0.3, 0.16, '#f4ecd8', 0, 0, 0, 0.05); bx(0.12, 0.1, 0.12, '#f48ab0', -0.04, 0.28, 0.02, 0.05); bx(0.11, 0.1, 0.11, '#fff0a0', 0.05, 0.3, -0.03, 0.05); bx(0.1, 0.09, 0.1, '#ff9a7a', 0.02, 0.33, 0.05, 0.05); bx(0.05, 0.08, 0.05, '#6a9a5a', 0, 0.22, 0, 0.02); }
  else if (kind === 'folder'){ bx(0.26, 0.34, 0.03, '#f4c83a', 0, 0, 0, 0.01); bx(0.2, 0.02, 0.031, '#c89a2a', 0, 0.28, 0, 0.005); }
  else if (kind === 'briefcase'){ bx(0.36, 0.26, 0.09, '#6a4a32', 0, -0.26, 0, 0.02); }
  g.userData.kind = kind; g.userData.dyn = true; return g; }
function makeItem(id, kind, at){ const m = itemMesh(kind); scene.add(m); const it = { id, kind, m, state:'atPlace', place:null, holder:null, log:[] }; ITEMS[id] = it; placeItem(it, at); return it; }
function placeItem(it, at){ if (it.m.parent) it.m.parent.remove(it.m); scene.add(it.m); it.m.scale.setScalar(1); it.m.position.set(at.x, at.y, at.z); it.m.rotation.set(0, at.yaw || 0, 0); it.state = 'atPlace'; it.place = at; it.holder = null; it.m.visible = at.hidden ? false : true; it.log.push([nowMin(), 'at', at.name || '']); }
function holdItem(it, P, hand = 1, opts = {}){ const s = P.pp.hands[hand]; if (it.m.parent) it.m.parent.remove(it.m); s.add(it.m); it.m.scale.setScalar(1/P.pp.S); it.m.position.set(opts.x || 0, opts.y ?? -0.02, opts.z || 0); it.m.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz ?? Math.PI/2*0); it.state = 'heldBy'; it.holder = P.id; it.place = null; it.m.visible = !opts.hidden; it.log.push([nowMin(), 'held', P.id]); }
const handWorld = (P, hand = 1) => P.pp.hands[hand].getWorldPosition(new THREE.Vector3());

/* ---------------------------------------------------------------------
   PLACES: real doors, seats and spots of the v5 map (checked against the walkable grid at load)
   --------------------------------------------------------------------- */
const D = (b) => WORLD.DOORS.find(d=>d.building === b);
const HOUSE = { H03:'house-22', H01:'house-20', H02:'house-21', H05:'house-24', H06:'house-25', H07:'house-26', B3:'b3-19', H16:'house-35', H17:'house-36', H18:'house-37' };   // H_n = house-(19+n) (the spec's selector table)
const free = (x, z, r = 0.28) => { const f = WORLD.floorAt(x, z); if (WORLD.freeAt(x, z, r, f)) return [x, z];
  for (let k=1;k<=14;k++) for (let a=0;a<12;a++){ const xx = x + Math.cos(a/12*Math.PI*2)*k*0.15, zz = z + Math.sin(a/12*Math.PI*2)*k*0.15; if (WORLD.freeAt(xx, zz, r, WORLD.floorAt(xx, zz)) && Math.abs(WORLD.floorAt(xx, zz) - f) < 0.4) return [xx, zz]; } return [x, z]; };
const PL = {};
const reach = (x, z) => { const p = WORLD.path(0, 5, x, z); if (p && Math.hypot(p[p.length - 1].x - x, p[p.length - 1].z - z) < 0.45) return [x, z];
  for (let k=1;k<=10;k++) for (let a=0;a<16;a++){ const xx = x + Math.cos(a/16*Math.PI*2)*k*0.2, zz = z + Math.sin(a/16*Math.PI*2)*k*0.2; if (!WORLD.freeAt(xx, zz, 0.26)) continue; const q = WORLD.path(0, 5, xx, zz); if (q && Math.hypot(q[q.length - 1].x - xx, q[q.length - 1].z - zz) < 0.45) return [xx, zz]; } return [x, z]; };
const spot = (name, x, z, yaw = 0, o = {}) => { const [sx, sz] = o.exact ? [x, z] : reach(...free(x, z)); if (Math.hypot(sx - x, sz - z) > 0.05) log('place moved', name, x.toFixed(2), z.toFixed(2), '→', sx.toFixed(2), sz.toFixed(2)); PL[name] = { name, x:sx, z:sz, yaw, ...o }; return PL[name]; };
// a door of a house with no inside: the person stands at its front, opens it, steps in and is hidden
Object.entries(HOUSE).forEach(([k, b])=>{ const d = D(b); if (!d){ log('no door', k, b); return; } PL[k] = { name:k, door:d, x:d.front[0], z:d.front[1], yaw:yawTo(-d.nx, -d.nz) }; });
// places with no door in the world (shells): one goes in at the threshold and is hidden; comes out at the same spot
const shellIn = (name, x, z, fx, fz) => spot(name, x, z, yawTo(fx, fz), { shell:true });
const nx = C.nx, nz = C.nz, wx = C.wx, wz = C.wz;
spot('CAFE_IN', -19.75, -4.3, yawTo(-1, 0), { shell:true, exact:true });   // her side door, right behind the counter (the front door is boxed in by the café's own tables)
shellIn('CAFE_BACK', -22.6, -14.5, 0, 1);
shellIn('CLINIC', 9.45, -60.4, 0, 1); shellIn('OFFICE', 18.4, -14.9, 0, -1); shellIn('SCHOOL', 54.0, -45.0, 1, 0);
shellIn('APT_N', 53.8, 47.4, 0, -1); shellIn('APT_S', 51.0, 49.5, 0, 1); shellIn('LAUNDRY_UP', 47.6, -10.6, 0, -1);
shellIn('BAKERY_UP', 27.9, -14.6, 0, 1); shellIn('STORE', 9.0, 46.1, 1, 0);
spot('PIER', 77.0, wz(297), yawTo(-1, 0)); spot('MARKET', 72.0, -13.4, 0); spot('MARKET2', 72.0, -19.6, 0);   // the boardwalk and the pier are over the water (not walkable in the world): visitors come and go at the quay edge by the pier
// seats: a bench (index's: seat 0.47 m over the ground, sitters face the bench's +z)
const seat = (name, x, z, fx, fz, top = 0.47, o = {}) => spot(name, x, z, yawTo(fx, fz), { seat:true, top, exact:true, ...o });
const approachOf = (pl) => { if (pl.ap) return pl.ap; if (!pl.seat) return [pl.x, pl.z]; if (pl.room) return [pl.x + Math.cos(pl.yaw)*0.5, pl.z - Math.sin(pl.yaw)*0.5];
  pl.ap = reach(pl.x + Math.cos(pl.yaw)*0.6, pl.z - Math.sin(pl.yaw)*0.6); return pl.ap; };
seat('PLAZA_N', 0.35, -9.36 + 0.06, 0, 1); seat('PLAZA_S', -0.35, 9.36 - 0.06, 0, -1);
seat('CLINIC_BENCH', 12.45 - 0.35, -61.4 - 0.06, 0, -1); seat('CLINIC_BENCH2', 12.45 + 0.4, -61.4 - 0.06, 0, -1);
// spots
spot('CAFE_COUNTER', -19.4, -4.15, yawTo(0, 1)); spot('CAFE_FRONT', -19.4, -2.4, yawTo(0, -1));   // the take-away counter in the free corner east of the café (its front is crowded by its own tables) spot('K07_TABLE_STAND', -24.41, -2.5, yawTo(0, -1));
spot('BAKERY_COUNTER', 25.1, -8.7, yawTo(0, 1)); spot('BAKERY_DOOR_OUT', 26.0, -2.9, yawTo(-1, 0));
spot('LAUNDRY_TABLE', 40.05, -6.5, yawTo(-1, 0)); spot('LAUNDRY_MACH', 42.0, -8.85, yawTo(0, -1)); spot('LAUNDRY_MACH2', 44.5, -8.85, yawTo(0, -1)); spot('LAUNDRY_CHANGER', 45.7, -8.2, yawTo(1, 0));
seat('LAUNDRY_BENCH', 42.78, -7.05 + 0.02, 0, -1, 0.47);
spot('CAT_BOWL_STAND', -22.0, -14.6, yawTo(0, 1)); spot('PLAZA_FEED', 0.0, 7.2, yawTo(0, -1));
spot('EMPTY_FRONT', -27.35, -51.0, yawTo(0, 1)); spot('EMPTY_KID', -26.6, -50.7, yawTo(-0.3, 1));
seat('H01_CHAIR_W', -57.35, -27.3, 1, 0, 0.44); seat('H01_CHAIR_E', -54.4, -27.3, -1, 0, 0.44);
seat('H06_CHAIR', 57.6, -27.35, 0, -1, 0.44);
spot('SCHOOL_GATE', 47.5, -36.6, yawTo(0, 1)); spot('SCHOOL_GATE_OUT', 47.5, -35.4, yawTo(0, -1));
spot('GREENGROCER', 52.1, -2.4, yawTo(0, -1)); spot('STORE_COUNTER', 9.0, 44.6, yawTo(-1, 0));
spot('HARBOUR_CRATES', 71.0, -44.2, 0); spot('HARBOUR_DROP', 71.0, -49.0, 0); spot('B3_STOOP', -21.8, -27.6, yawTo(0, -1), { seat:true, top:0.42 });
// batch 2 (K09, K10, R14, R25): the flower shop's stand, the office door, the corner on the south avenue with its bench, K10's vase
{ const d = D('flowers-1'); PL.FLOWERS_UP = { name:'FLOWERS_UP', door:d, x:d.front[0], z:d.front[1], yaw:yawTo(-d.nx, -d.nz) }; }   // the shop's own door (she lives upstairs)
spot('FLOWERS_STAND', -28.4, -2.55, yawTo(0, 1)); spot('FLOWERS_PICK', -28.4, -1.35, yawTo(0, -1));
spot('OFFICE_DOOR_A', 18.4, -13.9, yawTo(0, 1)); spot('OFFICE_DOOR_B', 18.4, -12.75, yawTo(0, -1)); seat('OFFICE_STEP', 20.2, -13.9, 0, 1, 0.42);
spot('E07_A', -6.05, 36.55, yawTo(1, 0)); spot('E07_B', -4.15, 36.55, yawTo(-1, 0)); seat('E07_BENCH', -5.1, 37.55, 0, -1, 0.47);
spot('H17_VASE', 10.2, 28.4, yawTo(0, -1));
// batch 5 (the core people's own stories): K01's bench front, the café door for the red mitten, grandma's door step, the bakery door
spot('PLAZA_N_C', 0.35, -8.15, yawTo(0, -1)); spot('STORE_COUNTER2', 9.0, 45.7, yawTo(-1, 0)); spot('STORE_OUT', 6.4, 44.0, yawTo(1, 0));
const LOOP_CLEAN = [[8, 37.2], [0, 37.2], [-6, 37.2], [-8, 12], [8, 12], [10, -2], [6, -9]]; spot('CAFE_DOOR_F', -21.0, -2.3, yawTo(0, -1)); spot('CAFE_DOOR_K', -20.2, -2.0, yawTo(-1, 0)); spot('H01_STEP', -55.0, -28.5, yawTo(0, -1)); spot('H01_C', -55.0, -29.5, yawTo(0, 1)); spot('BAKERY_C', 26.0, -1.6, yawTo(0, -1)); spot('ARC_W_SHOP', -17.2, -1.0, yawTo(0, 1)); spot('E07_AWAY', 4.0, 36.7, yawTo(1, 0));
spot('ARCADE_COVER_W', -17.2, -2.3, yawTo(1, 0)); spot('ARCADE_COVER_E', 17.2, 2.3, yawTo(-1, 0));   // under the arcade's gate roofs (checked: covered)
const stP = C.PLATFORMS.find(p=>p.id === 'station'), qP = C.PLATFORMS.find(p=>p.id === 'quay');
spot('STATION_WAIT', (stP.x0 + stP.x1)/2 + 0.2, stP.z0 + 9, 0, { platform:'station' }); spot('STATION_WAIT2', (stP.x0 + stP.x1)/2 + 0.2, stP.z0 + 10.2, 0, { platform:'station' }); spot('STATION_WAIT3', (stP.x0 + stP.x1)/2 + 0.2, stP.z0 + 7.8, 0, { platform:'station' });
spot('QUAY_WAIT', (qP.x0 + qP.x1)/2 - 3, qP.z0 + 1.3, 0, { platform:'quay' }); spot('QUAY_WAIT2', (qP.x0 + qP.x1)/2 - 4.2, qP.z0 + 1.3, 0, { platform:'quay' });
spot('QUAY_EXIT', (qP.x0 + qP.x1)/2 + 5.5, qP.z0 + 1.2, yawTo(1, 0));                         // the quay's waiting hall: where the visitors' day ends
// walking loops
const LOOPS = { clean:LOOP_CLEAN, dogMorning:[[-55.8, -28.3], [-48, -28.2], [-40.5, -28.2], [-48, -28.4], [-55.8, -28.4], [-60.6, -28.6], [-55.8, -28.3]],
  dogEvening:[[-55.8, -28.3], [-50, -28.3], [-44.5, -28.3], [-50, -28.4], [-55.8, -28.3]] };
// props that make a place readable: the café's take-away counter, a chair at grandma's door and at the nurse's, the stoop by 3B,
// the lost-and-found box on the laundry's folding table, the slot by the empty house's boarded door, a stack of crates at the harbour
const PROPS = new THREE.Group(); scene.add(PROPS);
const pbox = (w, h, d, c, x, y, z, r = 0.03, yaw = 0, par = PROPS) => { const m = new THREE.Mesh(rbox(w, h, d, r), matOf(c)); m.position.set(x, y + h/2, z); m.rotation.y = yaw; m.castShadow = true; m.receiveShadow = true; par.add(m); return m; };
function chairAt(x, z, yaw, c = '#d8c0d0'){ const g = new THREE.Group(); g.position.set(x, G, z); g.rotation.y = yaw; PROPS.add(g);
  pbox(0.44, 0.05, 0.44, c, 0, 0.44, 0, 0.03, 0, g); pbox(0.05, 0.48, 0.44, c, -0.2, 0.47, 0, 0.02, 0, g); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b2])=>pbox(0.04, 0.44, 0.04, '#5a5470', a, 0, b2, 0.01, 0, g));
  WORLD.addCollider({ cx:x, cz:z, ux:1, uz:0, hx:0.24, hz:0.24, y0:G, y1:G + 0.9, glass:false, owner:'chair', name:'chair' }); return g; }
pbox(1.0, 1.0, 0.45, '#9ad0b8', -19.4, G, -3.35, 0.04); pbox(1.1, 0.06, 0.55, '#f4eef0', -19.4, G + 1.0, -3.35, 0.02); pbox(0.2, 0.26, 0.2, '#d8d0dc', -19.0, G + 1.06, -3.45, 0.03); pbox(0.06, 0.04, 0.12, '#5a5470', -19.0, G + 1.18, -3.32, 0.01);   // the counter and its little espresso machine
WORLD.addCollider({ cx:-19.4, cz:-3.35, ux:1, uz:0, hx:0.5, hz:0.23, y0:G, y1:G + 1.06, glass:false, owner:'counter', name:'cafe counter' });
PL.CAFE_COUNTER_TOP = { x:-19.72, y:G + 1.06, z:-3.3, name:'cafe counter' }; PL.CAFE_COUNTER_TOP2 = { x:-19.38, y:G + 1.06, z:-3.25, name:'cafe counter' };
PL.K07_TABLE_TOP = { x:-24.3, y:G + 0.77, z:-3.32, name:'window table' };
chairAt(-57.35, -27.3, 0); chairAt(-54.4, -27.3, Math.PI); chairAt(57.6, -27.35, Math.PI/2, '#c8d8e8');
// batch 2 props: the flower rack by the shop door (the reserved bouquet waits on its top shelf), the bench at the avenue corner, the vase stand by K10's door
{ const fx = -27.5, fz = -2.95; pbox(1.1, 0.75, 0.4, '#7a9a6a', fx, G, fz, 0.03); pbox(1.0, 0.05, 0.36, '#e8dcc8', fx, G + 0.75, fz, 0.02); pbox(1.0, 0.35, 0.05, '#5a7a4a', fx, G + 0.75, fz - 0.17, 0.02);
  [[-0.35, '#f48ab0'], [-0.1, '#fff0a0'], [0.15, '#c8a8f2'], [0.38, '#ff9a7a']].forEach(([dx, c])=>{ pbox(0.18, 0.22, 0.18, '#6a8a5a', fx + dx, G + 0.45, fz + 0.08, 0.04); pbox(0.16, 0.12, 0.16, c, fx + dx, G + 0.66, fz + 0.08, 0.06); });
  WORLD.addCollider({ cx:fx, cz:fz, ux:1, uz:0, hx:0.56, hz:0.21, y0:G, y1:G + 1.1, glass:false, owner:'flower rack', name:'flower rack' });
  PL.FLOWERS_SHELF = { x:fx + 0.3, y:G + 0.8, z:fz, name:'reserved shelf' }; }
{ const bx0 = -5.1, bz0 = 37.55, g = new THREE.Group(); g.position.set(bx0, G, bz0); g.rotation.y = Math.PI; PROPS.add(g);   // index's bench (its sitters face +z; turned to face the avenue)
  for (let i=0;i<3;i++) pbox(1.6, 0.05, 0.13, '#c8b8d8', 0, 0.42, -0.16 + i*0.16, 0.02, 0, g); for (let i=0;i<2;i++) pbox(1.6, 0.12, 0.05, '#c8b8d8', 0, 0.6 + i*0.17, -0.27, 0.02, 0, g);
  [-0.68, 0.68].forEach(sx=>{ pbox(0.08, 0.44, 0.48, '#5a5470', sx, 0, -0.02, 0.01, 0, g); pbox(0.08, 0.45, 0.06, '#5a5470', sx, 0.44, -0.28, 0.01, 0, g); });
  WORLD.addCollider({ cx:bx0, cz:bz0 + 0.05, ux:1, uz:0, hx:0.85, hz:0.3, y0:G, y1:G + 0.9, glass:false, owner:'bench', name:'avenue bench' });
  PL.E07_BENCH_TOP = { x:bx0 + 0.45, y:G + 0.47, z:bz0, name:'meeting bench' }; }
{ const vx = 10.2, vz = 27.95; pbox(0.32, 0.8, 0.32, '#d8c8d8', vx, G, vz, 0.03); pbox(0.16, 0.24, 0.16, '#a8d8f0', vx, G + 0.8, vz, 0.05);
  WORLD.addCollider({ cx:vx, cz:vz, ux:1, uz:0, hx:0.17, hz:0.17, y0:G, y1:G + 1.05, glass:false, owner:'vase stand', name:'vase stand' });
  PL.H17_VASE_TOP = { x:vx, y:G + 0.9, z:vz, name:'vase' }; }
pbox(0.9, 0.42, 0.42, '#d8c8b8', -21.8, G, -27.55, 0.04);                                                                // the stoop by 3B's door
WORLD.addCollider({ cx:-21.8, cz:-27.55, ux:1, uz:0, hx:0.45, hz:0.21, y0:G, y1:G + 0.42, glass:false, owner:'stoop', name:'stoop' });
pbox(0.42, 0.24, 0.32, '#f4f0e8', 39.38, G + 0.85, -7.4, 0.02); pbox(0.44, 0.02, 0.34, '#c8d8e8', 39.38, G + 1.09, -7.4, 0.005);   // the lost-and-found box
PL.LOST_BOX = { x:39.38, y:G + 1.0, z:-7.42, name:'lost box' }; PL.LAUNDRY_TABLE_TOP = { x:39.4, y:G + 0.86, z:-6.4, name:'folding table' };
pbox(0.5, 0.08, 0.12, '#5a5060', -26.6, G + 0.9, -49.78, 0.01); PL.EMPTY_SLOT = { x:-26.6, y:G + 0.98, z:-49.8, name:'door slot' };       // the slot by the boarded door
for (let i=0;i<3;i++) pbox(0.5, 0.36, 0.4, '#c8a888', 71.9, G + i*0.37, -43.6 + (i%2)*0.1, 0.02); pbox(0.5, 0.36, 0.4, '#c8a888', 71.9, G, -44.2, 0.02);
PL.CRATE_PICK = { x:71.3, y:G + 0.75, z:-43.9 }; PL.CRATE_DROP = { x:71.3, y:G, z:-49.2 };
WORLD.buildNav();                                               // the path-finder learns the counter, the chairs, the stoop
const CRUMBS = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.02, 0.04), matOf('#e8c890'), 40); CRUMBS.count = 0; CRUMBS.userData.dyn = true; CRUMBS.frustumCulled = false; scene.add(CRUMBS);

/* ---------------------------------------------------------------------
   GRANDMA'S LIVING ROOM (H01): a room instance 40 m under her house (no sky, no rain there). Her body and the dog are moved to it
   while she is home; the street sees a shut door. Bound to the house: a viewer reaches it through her, the dog, or its own camera.
   --------------------------------------------------------------------- */
const ROOM = (()=>{ const d = PL.H01.door, ox = d.cx, oz = d.cz + 2.6, y0 = -40, R = new THREE.Group(); R.position.set(ox, y0, oz); scene.add(R);
  const wm = (c) => { const m = new THREE.MeshLambertMaterial({ color:c, emissive:c, emissiveIntensity:0.35, flatShading:true }); return m; };
  const rb = (w, h, d2, c, x, y, z, r = 0.02) => { const m = new THREE.Mesh(rbox(w, h, d2, r), wm(c)); m.position.set(x, y + h/2, z); m.receiveShadow = true; R.add(m); return m; };
  rb(5.2, 0.1, 4.4, '#c8a890', 0, -0.1, 0); rb(5.2, 2.7, 0.12, '#f2e4dc', 0, 0, -2.2); rb(5.2, 2.7, 0.12, '#f2e4dc', 0, 0, 2.2); rb(0.12, 2.7, 4.4, '#ecdcd8', -2.6, 0, 0); rb(0.12, 2.7, 4.4, '#ecdcd8', 2.6, 0, 0); rb(5.2, 0.1, 4.4, '#f8f0ec', 0, 2.7, 0);
  rb(2.6, 0.01, 1.8, '#c88a9a', 0.2, 0.0, 0.3);                                                        // the rug
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({ color:'#cfe0f0' })); win.position.set(-0.8, 1.55, -2.13); R.add(win); rb(1.6, 0.06, 0.16, '#e8dcd4', -0.8, 0.98, -2.1);
  rb(0.9, 0.08, 0.04, '#8a7a8a', 1.4, 2.0, -2.13); const photo = rb(0.3, 0.38, 0.03, '#d8a8b8', 1.4, 1.55, -2.13);              // a photo over the cabinet
  rb(1.0, 0.8, 0.4, '#a8806a', 1.4, 0, -1.9); rb(0.2, 0.3, 0.2, '#e4c0cc', 1.15, 0.8, -1.9); rb(0.3, 0.32, 0.3, '#9ad0a8', 1.15, 1.1, -1.9, 0.1);   // cabinet with a plant
  // the armchair, a side table with a cup, the lamp, a chair for a visitor, the dog's bed, the door
  rb(0.8, 0.42, 0.75, '#8a5a7a', -1.4, 0, 0.6, 0.08); rb(0.18, 0.75, 0.75, '#8a5a7a', -1.8, 0.42, 0.6, 0.06); [-1, 1].forEach(s=>rb(0.8, 0.22, 0.14, '#8a5a7a', -1.4, 0.42, 0.6 + s*0.32, 0.05));
  rb(0.45, 0.6, 0.45, '#c8a090', -0.6, 0, 1.3); const lamp = rb(0.3, 0.3, 0.3, '#fff0c8', -2.2, 1.4, 1.6, 0.12); rb(0.05, 1.4, 0.05, '#5a5470', -2.2, 0, 1.6);
  rb(0.5, 0.45, 0.5, '#d8c0d0', 0.8, 0, 0.9, 0.04); rb(0.06, 0.45, 0.5, '#d8c0d0', 1.03, 0.45, 0.9);
  rb(0.9, 0.12, 0.6, '#c8b090', -1.6, 0, -1.3, 0.05); rb(0.8, 0.04, 0.5, '#e8dcc8', -1.6, 0.12, -1.3);
  rb(0.9, 2.1, 0.06, '#a88a7a', 1.6, 0, 2.15); rb(0.6, 0.5, 0.8, '#f4eef0', 1.9, 0, 0.2);             // the door to the street, a little desk for the grandchild
  R.updateMatrixWorld(true); const W = (x, z) => new THREE.Vector3(x, 0, z).applyMatrix4(R.matrixWorld);
  const at = (name, x, z, yaw, o = {}) => { const v = W(x, z); PL[name] = { name, x:v.x, z:v.z, y:y0, yaw, room:'H01', ...o }; };
  at('H01_DOOR', 1.6, 1.7, yawTo(0, 1)); at('H01_ARMCHAIR', -1.35, 0.6, yawTo(1, 0), { seat:true, top:0.42 }); at('H01_VISITOR', 0.75, 0.9, yawTo(-1, 0), { seat:true, top:0.45 });
  at('H01_DESK', 1.5, 0.2, yawTo(1, 0), { seat:false }); at('H01_DOGBED', -1.6, -1.3, 0); at('H01_WINDOW', -0.8, -1.5, yawTo(0, -1));
  PL.H01_TABLE_TOP = { ...(()=>{ const v = W(-0.6, 1.3); return { x:v.x, z:v.z }; })(), y:y0 + 0.62, name:'side table' };
  PL.H01_ARMCHAIR_TOP = { ...(()=>{ const v = W(-1.35, 0.6); return { x:v.x, z:v.z }; })(), y:y0 + 0.46, name:'armchair' };
  return { g:R, ox, oz, y0, x0:ox - 2.45, x1:ox + 2.45, z0:oz - 2.05, z1:oz + 2.05, win, lamp, photo, W }; })();

/* ---------------------------------------------------------------------
   THE CAST (phase 1: 15 of the 102). Looks: the spec's colours, index's shapes. Outfits: casual / work / home.
   --------------------------------------------------------------------- */
const SKIN = ['#F0C8AA', '#DFAC86', '#C68F69', '#AB7453', '#89583F', '#684430'];
const CAST = [
  { id:'K01', name:'长椅上的人', home:'B3', speed:1.3, look:{ hair:'long', h:1.0, w:1.0, fixed:{ skin:'#F0C8AA', hair:'#5a3424', shoes:'#2a2a30', sole:'#e8e2ea' },
      outfits:{ casual:{ coat:'#E0A24A', sleeve:'#E0A24A', pants:'#3a4a7a', collar:'#f2eef4' }, home:{ coat:'#efe6d6', sleeve:'#efe6d6', pants:'#3a4a7a', collar:'#efe6d6' } } } },
  { id:'K02', name:'奶奶', home:'H01', room:'H01', speed:0.95, look:{ hair:'bun', h:0.92, w:1.06, hunch:0.3, cane:true, skirt:true, freq:3.8, swing:0.15, bounce:0.015, scarf:'#e8d8b8',
      fixed:{ skin:'#efd0b6', hair:'#e8e4e0', shoes:'#4a3a40', sole:'#e8e2ea' }, outfits:{ casual:{ coat:'#8A5A7A', sleeve:'#8A5A7A', pants:'#4a4448', skirt:'#4a4448', collar:'#f2eef4' },
      evening:{ coat:'#8A5A7A', sleeve:'#8A5A7A', pants:'#4a4448', skirt:'#4a4448', collar:'#f2eef4', comps:['scarf'] }, home:{ coat:'#b8a8ac', sleeve:'#b8a8ac', pants:'#5a5458', skirt:'#5a5458', collar:'#ece4e4' } } } },
  { id:'K03', name:'父亲', home:'OFF', speed:1.2, visitor:true, look:{ hair:'short', h:1.08, w:1.1, beard:true, glasses:true, pack:'#7a5a3a', freq:6,
      fixed:{ skin:'#c9946a', hair:'#2a2018', shoes:'#2a2a30', sole:'#e8e2ea' }, outfits:{ casual:{ coat:'#4A6A8A', sleeve:'#4A6A8A', pants:'#3a3a3a', collar:'#e8eef4', comps:['pack'] } } } },
  { id:'K04', name:'女儿', home:'OFF', speed:1.2, visitor:true, look:{ hair:'pigtails', s:0.58, head:1.4, skirt:true, freq:9, bounce:0.07, umb:'#f48ab0',
      fixed:{ skin:'#f0c8a0', hair:'#5a3a24', shoes:'#d83a4a', sole:'#f4e8e8' }, outfits:{ casual:{ coat:'#E88AA8', sleeve:'#E88AA8', pants:'#E88AA8', skirt:'#E88AA8', collar:'#fff4f8' } } } },
  { id:'K05', name:'护士', home:'H06', speed:1.4, look:{ hair:'pony', h:1.0, w:0.96, bag:'#2a2e40',
      fixed:{ skin:'#DFAC86', hair:'#141016', shoes:'#f4f4f6', sole:'#e8e2ea' }, outfits:{ work:{ coat:'#5AA0A8', sleeve:'#5AA0A8', pants:'#4a8a92', collar:'#ffffff', comps:['bag'] },
      casual:{ coat:'#e4d4bc', sleeve:'#e4d4bc', pants:'#4a5060', collar:'#f2eef4', comps:['bag'] }, home:{ coat:'#8a9ab8', sleeve:'#8a9ab8', pants:'#7a88a8', collar:'#8a9ab8' } } } },
  { id:'K06', name:'咖啡师', home:'CAFE_IN', speed:1.3, look:{ hair:'bun', h:0.98, w:1.0, apron:'#2E5A4A',
      fixed:{ skin:'#F0C8AA', hair:'#7a4a2a', shoes:'#7a5a40', sole:'#e8e2ea' }, outfits:{ work:{ coat:'#efe6d6', sleeve:'#efe6d6', pants:'#4a4a52', collar:'#ffffff', comps:['apron'] },
      casual:{ coat:'#8a9e8a', sleeve:'#8a9e8a', pants:'#4a4a52', collar:'#8a9e8a' }, home:{ coat:'#8a9e8a', sleeve:'#8a9e8a', pants:'#4a4a52', collar:'#8a9e8a' } } } },
  { id:'K07', name:'窗边记录者', home:'H02', speed:0.95, look:{ hair:'short', glasses:true, h:0.98, w:0.94, hunch:0.12, freq:5, swing:0.3, vest:'#9a9aa8',
      fixed:{ skin:'#e8c4a4', hair:'#b8b8bc', shoes:'#3a3440', sole:'#e8e2ea' }, outfits:{ casual:{ coat:'#7AA0B8', sleeve:'#7AA0B8', pants:'#4a4a58', collar:'#f2eef4', comps:['vest'] },
      home:{ coat:'#7AA0B8', sleeve:'#7AA0B8', pants:'#4a4a58', collar:'#f2eef4' } } } },
  { id:'K08', name:'洗衣房的人', home:'H05', speed:1.25, look:{ hair:'short', h:0.98, w:1.15, freq:6,
      fixed:{ skin:'#684430', hair:'#141016', shoes:'#e8e4ec', sole:'#c8c4cc' }, outfits:{ casual:{ coat:'#5A6A8A', sleeve:'#5A6A8A', pants:'#3a3a44', collar:'#5A6A8A' },
      work:{ coat:'#5A6A8A', sleeve:'#684430', pants:'#3a3a44', collar:'#5A6A8A' }, home:{ coat:'#9a9aa2', sleeve:'#9a9aa2', pants:'#3a3a44', collar:'#9a9aa2' } } } },
  { id:'R02', name:'面包师', home:'BAKERY_UP', speed:1.35, look:{ hair:'whitecap', h:1.04, w:1.12, apron:'#f2e4cc', scarf:'#c83a3a',
      fixed:{ skin:'#e8b890', hair:'#4a3020', shoes:'#3a3030', sole:'#e8e2ea' }, outfits:{ work:{ coat:'#fbf6ee', sleeve:'#fbf6ee', pants:'#6a5a50', collar:'#fbf6ee', comps:['apron', 'workcap'] },
      casual:{ coat:'#8a5a3a', sleeve:'#8a5a3a', pants:'#4a4040', collar:'#c83a3a', comps:['scarf'] }, home:{ coat:'#8a5a3a', sleeve:'#8a5a3a', pants:'#4a4040', collar:'#c83a3a' } } } },
  { id:'R05', name:'公寓通勤者', home:'APT_N', speed:1.5, look:{ hair:'short', h:1.04, w:1.12, freq:7,
      fixed:{ skin:'#C68F69', hair:'#1a1416', shoes:'#2a2420', sole:'#3a3430' }, outfits:{ casual:{ coat:'#4a4a52', sleeve:'#4a4a52', pants:'#3a3a42', collar:'#e8eef4' }, home:{ coat:'#a8b0b8', sleeve:'#a8b0b8', pants:'#5a5a62', collar:'#a8b0b8' } } } },
  { id:'R06', name:'奶奶家的学生', home:'H01', room:'H01', speed:1.55, look:{ hair:'short', s:0.7, head:1.25, pack:'#f4c84a', freq:8.5, bounce:0.06,
      fixed:{ skin:'#efd0b6', hair:'#3a2a22', shoes:'#e8e4ec', sole:'#e8e2ea' }, outfits:{ casual:{ coat:'#3a5aa8', sleeve:'#3a5aa8', pants:'#2a3050', collar:'#ffffff', shoes:'#d83a4a', comps:['pack'] },
      home:{ coat:'#d8e0ec', sleeve:'#d8e0ec', pants:'#5a6078', collar:'#d8e0ec' } } } },
  { id:'R13', name:'诊所医生', home:'H07', speed:1.3, look:{ hair:'short', h:1.02, w:1.0,
      fixed:{ skin:'#89583F', hair:'#d8d8d8', shoes:'#8a5a3a', sole:'#e8e2ea' }, outfits:{ work:{ coat:'#fbfbfb', sleeve:'#fbfbfb', pants:'#4a4a58', collar:'#9ac8e0' }, casual:{ coat:'#6a7a6a', sleeve:'#6a7a6a', pants:'#4a4a58', collar:'#e8eef4' } } } },
  { id:'R15', name:'洗衣房值守', home:'LAUNDRY_UP', speed:1.25, look:{ hair:'short', h:0.96, w:1.02, vest:'#3a6ab0',
      fixed:{ skin:'#F0C8AA', hair:'#a8a8b0', shoes:'#3a3440', sole:'#e8e2ea' }, outfits:{ work:{ coat:'#e4e4ec', sleeve:'#e4e4ec', pants:'#4a4a58', collar:'#e4e4ec', comps:['vest'] }, home:{ coat:'#c8c0d0', sleeve:'#c8c0d0', pants:'#4a4a58', collar:'#c8c0d0' } } } },
  { id:'R22', name:'港口搬运者', home:'APT_N', speed:1.35, look:{ hair:'short', h:1.04, w:1.2, raincoat:'#f4d24a', freq:6,
      fixed:{ skin:'#AB7453', hair:'#1a1416', shoes:'#f4c83a', sole:'#c8a83a' }, outfits:{ work:{ coat:'#2a6a9a', sleeve:'#2a6a9a', pants:'#3a3a48', collar:'#2a6a9a' }, casual:{ coat:'#efe4d0', sleeve:'#efe4d0', pants:'#3a3a48', collar:'#efe4d0', shoes:'#3a3440', sole:'#e8e2ea' } } } },
  // batch 2
  { id:'K09', name:'情侣A', home:'H16', speed:1.25, look:{ hair:'long', h:1.0, w:0.94, fixed:{ skin:'#e8c0a0', hair:'#4a2a1e', shoes:'#2a2a30', sole:'#e8e2ea' },
      outfits:{ work:{ coat:'#8a8a96', sleeve:'#3A3A48', pants:'#3a3a44', collar:'#8a8a96' }, date:{ coat:'#1e1c24', sleeve:'#1e1c24', pants:'#2a2a32', collar:'#3A3A48' }, home:{ coat:'#c8c8d0', sleeve:'#c8c8d0', pants:'#5a5a64', collar:'#c8c8d0' } } } },
  { id:'K10', name:'情侣B', home:'H17', speed:1.35, look:{ hair:'short', h:1.06, w:1.03, fixed:{ skin:'#C68F69', hair:'#141016', shoes:'#2a2420', sole:'#3a3430' },
      outfits:{ work:{ coat:'#8a8a90', sleeve:'#8a8a90', pants:'#2e2e36', collar:'#8A3A3A' }, date:{ coat:'#8A3A3A', sleeve:'#8A3A3A', pants:'#2e2e36', collar:'#8A3A3A' }, home:{ coat:'#c8b0b0', sleeve:'#c8b0b0', pants:'#4a4a52', collar:'#8A3A3A' } } } },
  { id:'R14', name:'花店主', home:'FLOWERS_UP', speed:1.2, look:{ hair:'bun', h:0.96, w:0.98, apron:'#5a7a4a', fixed:{ skin:'#F0C8AA', hair:'#b06a3a', shoes:'#6a5a4a', sole:'#e8e2ea' },
      outfits:{ work:{ coat:'#f2ecdc', sleeve:'#f2ecdc', pants:'#5a5a50', collar:'#c8a060', comps:['apron'] }, home:{ coat:'#a8b8a0', sleeve:'#a8b8a0', pants:'#5a5a50', collar:'#c8a060' } } } },
  { id:'R25', name:'镇公所职员', home:'H18', speed:1.3, look:{ hair:'short', h:1.0, w:1.02, glasses:true, fixed:{ skin:'#DFAC86', hair:'#a8a8ac', shoes:'#3a3440', sole:'#e8e2ea' },
      outfits:{ work:{ coat:'#c8c8d0', sleeve:'#c8c8d0', pants:'#4a4a58', collar:'#f4f4f8' }, home:{ coat:'#9aa0b0', sleeve:'#9aa0b0', pants:'#4a4a58', collar:'#9aa0b0' } } } },
  // batch 5: the two neighbours the core people's stories need
  { id:'R01', name:'戴帽子的买面包居民', home:'H03', speed:1.25, look:{ hair:'beanie', h:1.0, w:1.0, hatC:'#3f8f8a', scarf:'#f4c83a', fixed:{ skin:'#c98e68', hair:'#2a2018', shoes:'#2a2a30', sole:'#e8e2ea' },
      outfits:{ casual:{ coat:'#7d5aa0', sleeve:'#7d5aa0', pants:'#4a4a58', collar:'#c8a8e0', comps:['scarf'] }, home:{ coat:'#b8a8c8', sleeve:'#b8a8c8', pants:'#4a4a58', collar:'#b8a8c8' } } } },
  { id:'R19', name:'奶奶的邻居', home:'H03', speed:1.0, look:{ hair:'bun', h:0.94, w:1.18, hunch:0.12, bag:'#c8a060', fixed:{ skin:'#DFAC86', hair:'#a8a8ac', shoes:'#5a4a3a', sole:'#e8e2ea' },
      outfits:{ casual:{ coat:'#c8784a', sleeve:'#c8784a', pants:'#5a4a48', collar:'#f2e4cc', comps:['bag'] }, home:{ coat:'#e0b898', sleeve:'#e0b898', pants:'#5a4a48', collar:'#e0b898' } } } },
  // batch 6: the store's chain (R03 night, R04 morning, D22 afternoon) and the morning cleaner who gets the night clerk's warm drink
  { id:'R03', name:'便利店夜班店员', home:'APT_S', speed:1.2, look:{ hair:'bun', h:0.98, w:0.98, vest:'#f4a8c8', fixed:{ skin:'#c99a78', hair:'#2a2030', shoes:'#e8e4ec', sole:'#e8e2ea' },
      outfits:{ work:{ coat:'#f2eef4', sleeve:'#f2eef4', pants:'#4a4a58', collar:'#f4a8c8', comps:['vest'] }, home:{ coat:'#a8a8b0', sleeve:'#a8a8b0', pants:'#4a4a58', collar:'#f4a8c8' } } } },
  { id:'R04', name:'便利店白班店员', home:'APT_S', speed:1.3, look:{ hair:'bun', h:1.0, w:1.02, vest:'#8ab8e0', fixed:{ skin:'#C68F69', hair:'#3a2418', shoes:'#2a2a30', sole:'#e8e2ea' },
      outfits:{ work:{ coat:'#f4f6fb', sleeve:'#f49a4a', pants:'#4a4a58', collar:'#8ab8e0', comps:['vest'] }, home:{ coat:'#c8d8e8', sleeve:'#c8d8e8', pants:'#4a4a58', collar:'#c8d8e8' } } } },
  { id:'R20', name:'清晨清洁工', home:'APT_S', speed:1.1, look:{ hair:'cap', capC:'#7a9a7a', h:1.0, w:1.04, vest:'#f49a3a', fixed:{ skin:'#89583F', hair:'#2a2018', shoes:'#3a3a40', sole:'#e8e2ea' },
      outfits:{ work:{ coat:'#7a9a7a', sleeve:'#7a9a7a', pants:'#4a5a4a', collar:'#7a9a7a', comps:['vest'] }, home:{ coat:'#b8c8b8', sleeve:'#b8c8b8', pants:'#4a5a4a', collar:'#b8c8b8' } } } },
  { id:'D22', name:'便利店中班', home:'APT_S', speed:1.45, look:{ hair:'pony', h:0.98, w:0.96,
      fixed:{ skin:'#DFAC86', hair:'#2a1a14', shoes:'#e8e4ec', sole:'#e8e2ea' }, outfits:{ work:{ coat:'#f4f6fb', sleeve:'#3a6ab0', pants:'#3a4058', collar:'#3a6ab0' }, casual:{ coat:'#c8a8c8', sleeve:'#c8a8c8', pants:'#3a4058', collar:'#f2eef4' } } } },
];

/* ---------------------------------------------------------------------
   DAYS. Each entry: the time to BE there (world HH:MM), what to do there. Departures are worked back from the real path.
   act: home (hidden behind the door; K02/R06 into the room), shell (into a building with no inside), stand, sit, work, wander,
   event (a part in a scripted event), tram {from, to}, drive {to}, off (a visitor out of town). rain: what to do instead in rain.
   --------------------------------------------------------------------- */
let DAYS = null; function days(){ return {
  K01:[ ['00:00', { act:'home', outfit:'home' }], ['09:00', { act:'home', outfit:'casual' }], ['13:00', { act:'sit', at:'PLAZA_N', hold:'phone', anim:'phone', rain:{ act:'stand', at:'ARCADE_COVER_W', hold:'phone', anim:'phone' } }],
        ['18:30', { act:'home', outfit:'home' }], ['20:00', { act:'sit', at:'B3_STOOP', anim:'idle', outfit:'home', rain:{ act:'home', outfit:'home' } }], ['22:00', { act:'home', outfit:'home' }] ],
  // her morning walk with the dog is the way to the plaza (at her pace it takes ~3 world hours: out at ~06:00)
  K02:[ ['00:00', { act:'home', outfit:'home', spot:'H01_ARMCHAIR' }],
        ['09:00', { act:'sit', at:'PLAZA_S', outfit:'casual', rain:{ act:'stand', at:'ARCADE_COVER_E' } }], ['09:15', { act:'event', ev:'E01', role:'feeder', at:'PLAZA_S', rain:{ act:'event', ev:'E01', role:'feeder', at:'ARCADE_COVER_E' } }],
        ['09:50', { act:'sit', at:'PLAZA_S', rain:{ act:'stand', at:'ARCADE_COVER_E' } }],
        ['14:30', { act:'home', outfit:'home', spot:'H01_ARMCHAIR' }], ['16:00', { act:'event', ev:'E06', role:'patient', at:'H01_CHAIR_W', outfit:'casual', rain:{ act:'event', ev:'E06', role:'patient', at:'H01_ARMCHAIR' } }],
        ['16:40', { act:'home', outfit:'home', spot:'H01_ARMCHAIR' }], ['17:30', { act:'wander', loop:'dogEvening', outfit:'evening', laps:1, rain:{ act:'home', spot:'H01_WINDOW' } }],
        ['18:40', { act:'home', outfit:'home', spot:'H01_ARMCHAIR' }] ],
  // the visitors (phase-1 timing, see the report): in by the pier at 9, the market, lunch by the harbour, then across town on foot to the
  // empty house (the morning tram from the quay goes round its sea loop first and would reach the station too late for 15:20), the last
  // tram of their day from the station, out at the quay's waiting hall
  K03:[ ['00:00', { act:'off' }], ['09:00', { act:'stand', at:'PIER', enterFrom:'PIER' }], ['09:20', { act:'stand', at:'MARKET', anim:'look' }],
        ['15:20', { act:'event', ev:'E05', role:'father', at:'EMPTY_FRONT' }],
        ['15:58', { act:'stand', at:'EMPTY_FRONT' }], ['19:50', { act:'tram', from:'station', to:'quay', wait:'STATION_WAIT' }], ['21:40', { act:'leave', at:'QUAY_EXIT' }] ],   // (later since batch 5: the café door and the red mitten are on their way)
  K05:[ ['00:00', { act:'home', outfit:'home' }], ['02:15', { act:'event', ev:'E10', role:'nurse', at:'H06_CHAIR', outfit:'home' }], ['02:50', { act:'home', outfit:'home' }],
        ['08:30', { act:'shell', at:'CLINIC', outfit:'work' }], ['12:05', { act:'sit', at:'CLINIC_BENCH', hold:'water', rain:{ act:'shell', at:'CLINIC' } }], ['12:50', { act:'shell', at:'CLINIC' }],
        ['16:00', { act:'event', ev:'E06', role:'nurse', at:'H01_CHAIR_E', rain:{ act:'event', ev:'E06', role:'nurse', at:'H01_DOOR' } }], ['20:00', { act:'home', outfit:'home' }] ],
  K06:[ ['00:00', { act:'shell', at:'CAFE_IN', outfit:'home' }], ['06:30', { act:'work', at:'CAFE_COUNTER', outfit:'work', anim:'wipe' }], ['07:20', { act:'event', ev:'E04', role:'receiver', at:'CAFE_COUNTER' }],
        ['08:00', { act:'work', at:'CAFE_COUNTER', anim:'wipe' }], ['09:10', { act:'event', ev:'ECUP', role:'server', at:'CAFE_COUNTER' }], ['09:40', { act:'work', at:'CAFE_COUNTER', anim:'align' }],
        ['16:20', { act:'event', ev:'ECUP2', role:'server', at:'CAFE_COUNTER' }], ['16:50', { act:'work', at:'CAFE_COUNTER', anim:'wipe' }],
        ['18:30', { act:'shell', at:'CAFE_IN' }], ['18:50', { act:'event', ev:'E08', role:'feeder', at:'CAT_BOWL_STAND', via:'CAFE_BACK' }], ['19:25', { act:'shell', at:'CAFE_BACK', outfit:'casual' }] ],
  K07:[ ['00:00', { act:'home', outfit:'home' }], ['09:00', { act:'sit', at:'K07_SEAT', hold:'notebook', anim:'read', outfit:'casual' }], ['13:00', { act:'sit', at:'K07_SEAT', hold:'notebook', anim:'draw' }],
        ['18:00', { act:'home', outfit:'home' }] ],
  K08:[ ['00:00', { act:'work', at:'LAUNDRY_TABLE', anim:'fold', outfit:'work' }], ['01:00', { act:'sit', at:'LAUNDRY_BENCH', anim:'idle' }], ['02:00', { act:'event', ev:'E09', role:'mender', at:'LAUNDRY_TABLE' }],
        ['02:40', { act:'work', at:'LAUNDRY_TABLE', anim:'fold' }], ['04:00', { act:'home', outfit:'home' }], ['16:30', { act:'stand', at:'GREENGROCER', anim:'look', outfit:'casual' }],
        ['18:00', { act:'home', outfit:'home' }], ['20:00', { act:'work', at:'LAUNDRY_MACH', anim:'load', outfit:'work' }], ['21:00', { act:'work', at:'LAUNDRY_TABLE', anim:'fold' }], ['23:00', { act:'sit', at:'LAUNDRY_BENCH', anim:'idle' }] ],
  R02:[ ['00:00', { act:'shell', at:'BAKERY_UP', outfit:'home' }], ['04:30', { act:'work', at:'BAKERY_COUNTER', outfit:'work', anim:'arrange' }], ['07:20', { act:'event', ev:'E04', role:'giver', at:'CAFE_FRONT', carry:'basket' }],
        ['09:20', { act:'work', at:'BAKERY_COUNTER', anim:'arrange' }], ['16:00', { act:'shell', at:'BAKERY_UP', outfit:'home' }] ],
  D22:[ ['00:00', { act:'shell', at:'APT_S', outfit:'casual' }], ['06:00', { act:'work', at:'BAKERY_COUNTER', anim:'look', cover:'R02' }], ['09:30', { act:'shell', at:'APT_S' }],
        ['14:00', { act:'work', at:'STORE_COUNTER', anim:'look', outfit:'work' }], ['21:00', { act:'shell', at:'APT_S', outfit:'casual' }] ],
  R05:[ ['00:00', { act:'shell', at:'APT_N', outfit:'home' }], ['09:00', { act:'shell', at:'OFFICE', outfit:'casual', hold:'briefcase' }],
        ['17:20', { act:'tram', from:'station', to:'quay', wait:'STATION_WAIT2', hold:'briefcase' }], ['21:00', { act:'shell', at:'APT_N', outfit:'home' }] ],
  R06:[ ['00:00', { act:'home', outfit:'home', spot:'H01_DESK' }], ['08:30', { act:'shell', at:'SCHOOL', outfit:'casual' }], ['15:00', { act:'event', ev:'EGLOVE', role:'child', at:'SCHOOL_GATE_OUT' }],
        ['15:25', { act:'stand', at:'SCHOOL_GATE_OUT', anim:'look' }], ['18:30', { act:'home', outfit:'home', spot:'H01_DESK' }] ],
  R13:[ ['00:00', { act:'home', outfit:'casual' }], ['09:00', { act:'shell', at:'CLINIC', outfit:'work' }], ['12:20', { act:'sit', at:'CLINIC_BENCH2', rain:{ act:'shell', at:'CLINIC' } }], ['13:00', { act:'shell', at:'CLINIC' }], ['18:40', { act:'home', outfit:'casual' }] ],
  R15:[ ['00:00', { act:'shell', at:'LAUNDRY_UP', outfit:'home' }], ['12:50', { act:'event', ev:'EGLOVE_PICK', role:'carrier', at:'LAUNDRY_TABLE', outfit:'work' }], ['15:00', { act:'event', ev:'EGLOVE', role:'carrier', at:'SCHOOL_GATE' }],
        ['16:30', { act:'work', at:'LAUNDRY_MACH2', anim:'wipe' }], ['19:00', { act:'work', at:'LAUNDRY_CHANGER', anim:'look' }], ['23:00', { act:'shell', at:'LAUNDRY_UP', outfit:'home' }] ],
  // batch 2. K10's 16:00 hand-over is moved to 14:30 (office → flowers → avenue corner is ~2 h + ~2 h on foot); R14 keeps the flowers at 17:00
  K09:[ ['00:00', { act:'home', outfit:'home' }], ['09:00', { act:'home', outfit:'work' }], ['12:30', { act:'sit', at:'PLAZA_S', hold:'phone_k09', anim:'phone', rain:{ act:'home' } }], ['14:00', { act:'home', outfit:'work' }],
        ['19:00', { act:'event', ev:'E07', role:'a', at:'E07_A', outfit:'date' }], ['20:20', { act:'home', outfit:'home' }] ],
  K10:[ ['00:00', { act:'home', outfit:'home' }], ['09:00', { act:'shell', at:'OFFICE', outfit:'work' }], ['12:10', { act:'sit', at:'OFFICE_STEP', rain:{ act:'shell', at:'OFFICE' } }], ['13:00', { act:'shell', at:'OFFICE' }],
        ['14:30', { act:'event', ev:'EFILE', role:'giver', at:'OFFICE_DOOR_A' }], ['17:00', { act:'event', ev:'EFLOWER', role:'buyer', at:'FLOWERS_PICK', outfit:'date' }],
        ['19:00', { act:'event', ev:'E07', role:'b', at:'E07_B' }], ['20:45', { act:'stand', at:'E07_AWAY', anim:'look' }],                 // away from her, along the avenue …
        ['21:15', { act:'event', ev:'E07B', role:'b', at:'E07_B' }], ['22:20', { act:'event', ev:'EVASE', role:'b', at:'H17_VASE' }], ['22:55', { act:'home', outfit:'home' }] ],   // … and back for the flowers
  R14:[ ['00:00', { act:'shell', at:'FLOWERS_UP', outfit:'home' }], ['08:30', { act:'work', at:'FLOWERS_STAND', outfit:'work', anim:'arrange' }], ['17:00', { act:'event', ev:'EFLOWER', role:'florist', at:'FLOWERS_STAND' }],
        ['17:30', { act:'work', at:'FLOWERS_STAND', anim:'arrange' }], ['18:00', { act:'shell', at:'FLOWERS_UP', outfit:'home' }] ],
  R25:[ ['00:00', { act:'home', outfit:'home' }], ['09:00', { act:'shell', at:'OFFICE', outfit:'work' }], ['12:30', { act:'stand', at:'OFFICE_DOOR_B', anim:'look' }], ['13:10', { act:'shell', at:'OFFICE' }],
        ['14:30', { act:'event', ev:'EFILE', role:'taker', at:'OFFICE_DOOR_B' }], ['14:55', { act:'shell', at:'OFFICE' }], ['17:00', { act:'home', outfit:'home' }] ],
  // batch 5: E13 (R01: two portions at the bakery, one for K01 on his bench), E17 (R19: oranges for grandma, biscuits back)
  R01:[ ['00:00', { act:'home', outfit:'home' }], ['10:30', { act:'home', outfit:'casual' }], ['12:00', { act:'event', ev:'E13A', role:'taker', at:'BAKERY_C' }],
        ['13:40', { act:'event', ev:'E13B', role:'giver', at:'PLAZA_N_C' }], ['15:30', { act:'shell', at:'OFFICE' }], ['17:30', { act:'home', outfit:'home' }] ],
  R19:[ ['00:00', { act:'home', outfit:'home' }], ['10:00', { act:'stand', at:'ARC_W_SHOP', anim:'look', outfit:'casual' }], ['12:00', { act:'home', outfit:'casual' }],
        ['16:50', { act:'event', ev:'E17', role:'giver', at:'H01_C' }], ['18:00', { act:'home', outfit:'home' }] ],
  R03:[ ['00:00', { act:'work', at:'STORE_COUNTER', anim:'look', outfit:'work' }], ['05:40', { act:'event', ev:'E11A', role:'clerk', at:'STORE_COUNTER2' }], ['06:00', { act:'work', at:'STORE_COUNTER', anim:'look' }],
        ['06:20', { act:'shell', at:'APT_S', outfit:'home' }], ['21:00', { act:'work', at:'STORE_COUNTER', anim:'look', outfit:'work' }] ],
  R04:[ ['00:00', { act:'shell', at:'APT_S', outfit:'home' }], ['06:05', { act:'work', at:'STORE_COUNTER2', anim:'look', outfit:'work' }], ['13:30', { act:'event', ev:'R04M', role:'clerk', at:'STORE_COUNTER2' }],
        ['14:00', { act:'event', ev:'R04H', role:'giver', at:'STORE_COUNTER2' }], ['15:00', { act:'shell', at:'APT_S', outfit:'home' }] ],
  R20:[ ['00:00', { act:'shell', at:'APT_S', outfit:'home' }], ['05:30', { act:'stand', at:'STORE_OUT', anim:'look', outfit:'work' }], ['06:05', { act:'event', ev:'E11B', role:'cleaner', at:'STORE_OUT' }],
        ['06:30', { act:'wander', loop:'clean', laps:1 }], ['10:20', { act:'event', ev:'E11C', role:'cleaner', at:'PLAZA_N_C' }], ['12:00', { act:'shell', at:'APT_S', outfit:'home' }] ],
  R22:[ ['00:00', { act:'shell', at:'APT_N', outfit:'casual' }], ['06:00', { act:'drive', car:'R22', to:'HARBOUR_PARK', outfit:'work' }], ['06:10', { act:'work', at:'HARBOUR_CRATES', anim:'carry' }],
        ['10:00', { act:'drive', car:'R22', to:'CARPARK' }], ['12:30', { act:'shell', at:'APT_N', outfit:'casual' }] ],
}; }
// K04 lives the same day as her father: she follows him, with her own part in E05
function k04(){ DAYS.K04 = DAYS.K03.map(([t, e])=>[t, e.act === 'event' ? { ...e, role:'daughter', at:'EMPTY_KID', follow:'K03' } : e.act === 'tram' ? { ...e, wait:e.from === 'quay' ? 'QUAY_WAIT2' : 'STATION_WAIT3', follow:'K03' } : { ...e, follow:'K03' }]); }
spot('K07_SEAT', -24.96, -3.32, yawTo(1, 0), { seat:true, top:0.47, exact:true }); PL.K07_SEAT.ap = reach(-24.96, -2.45); PL.K07_SERVE = (()=>{ const [x, z] = reach(-23.9, -2.45); return { x, z }; })();
// (he sits on the café's own chair at its west table — buildCafe's, facing east along the arcade)

/* ---------------------------------------------------------------------
   ANIMALS (index's models): the cat, grandma's dog, the pigeons
   --------------------------------------------------------------------- */
const ANIMALS = [];
function animalBox(par, w, h, d, c, x, y, z, r = 0.03){ const m = new THREE.Mesh(rbox(w, h, d, r), matOf(c)); m.position.set(x, y + h/2, z); m.castShadow = true; par.add(m); return m; }
function makeCat(){ const g = new THREE.Group(), CC = '#e8964a', s = 0.78; g.scale.setScalar(s); g.userData.dyn = true; scene.add(g);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b2])=>animalBox(g, 0.09, 0.14, 0.09, CC, a*0.11, 0, b2*0.2)); animalBox(g, 0.34, 0.28, 0.62, CC, 0, 0.12, 0, 0.05);
  [-0.15, 0, 0.15].forEach(z=>animalBox(g, 0.36, 0.02, 0.08, '#b86a2f', 0, 0.39, z, 0.005));
  const head = new THREE.Group(); head.position.set(0, 0.3, 0.32); g.add(head); animalBox(head, 0.34, 0.3, 0.3, CC, 0, -0.15, 0, 0.06);
  [-1, 1].forEach(s2=>{ animalBox(head, 0.08, 0.1, 0.07, CC, s2*0.11, 0.15, -0.03, 0.01); animalBox(head, 0.05, 0.05, 0.02, '#2b2b2b', s2*0.08, -0.02, 0.155, 0.005); });
  const tail = new THREE.Group(); tail.position.set(0, 0.33, -0.3); g.add(tail); animalBox(tail, 0.08, 0.08, 0.5, CC, 0, -0.04, -0.25, 0.02);
  return { g, head, tail, s, fwdZ:true }; }
function makeDog(){ const g = new THREE.Group(); g.userData.dyn = true; scene.add(g);
  animalBox(g, 0.5, 0.24, 0.22, '#c8a070', 0, 0.16, 0, 0.04); const head = new THREE.Group(); head.position.set(0.3, 0.3, 0); g.add(head); animalBox(head, 0.22, 0.2, 0.18, '#c8a070', 0, 0, 0, 0.04); animalBox(head, 0.1, 0.06, 0.1, '#3a2a20', 0.12, 0.02, 0, 0.02);
  [-1, 1].forEach(s=>animalBox(head, 0.05, 0.1, 0.04, '#8a6040', -0.03, 0.18, s*0.06, 0.01)); animalBox(g, 0.18, 0.04, 0.24, '#d83a4a', 0.2, 0.36, 0, 0.01);
  const legs = [[-0.18, -0.07], [-0.18, 0.07], [0.18, -0.07], [0.18, 0.07]].map(([x, z])=>{ const l = new THREE.Group(); l.position.set(x, 0.17, z); g.add(l); animalBox(l, 0.06, 0.17, 0.06, '#b08a60', 0, -0.17, 0, 0.01); return l; });
  const tail = new THREE.Group(); tail.position.set(-0.25, 0.3, 0); g.add(tail); animalBox(tail, 0.18, 0.05, 0.05, '#c8a070', -0.09, 0, 0, 0.01);
  return { g, head, legs, tail }; }
const PIGEON_C = [['#ffffff', '#f4f0f4', '#ffffff', '#e8e4ec'], ['#8a8a98', '#6a6a78', '#5a8a7a', '#7a7a88'], ['#9a98a4', '#7a7884', '#6a5a8a', '#8a8894'], ['#7a7a86', '#5a5a66', '#4a7a6a', '#6a6a76'], ['#a8a4b0', '#888494', '#7a6a9a', '#9894a0'],
  ['#b8a898', '#8a7a6a', '#6a8a6a', '#a89888'], ['#6a6a74', '#4a4a54', '#7a5a8a', '#5a5a64'], ['#c8c4cc', '#9a96a0', '#5a7a9a', '#b0acb4']];   // A08–A10: a brownish one, a dark one, a pale one (each tellable apart)
function makePigeon(i){ const g = new THREE.Group(), Cc = PIGEON_C[i]; g.userData.dyn = true; scene.add(g);
  animalBox(g, 0.3, 0.18, 0.18, Cc[0], 0, 0.06, 0, 0.05); animalBox(g, 0.14, 0.06, 0.2, Cc[1], -0.18, 0.12, 0, 0.02);
  const head = new THREE.Group(); head.position.set(0.17, 0.22, 0); g.add(head); animalBox(head, 0.12, 0.12, 0.12, Cc[2], 0, -0.06, 0, 0.03); animalBox(head, 0.06, 0.03, 0.04, '#d9b07a', 0.08, -0.02, 0, 0.01);
  animalBox(g, 0.1, 0.06, 0.16, Cc[3], 0.12, 0.17, 0, 0.02); if (i) g.scale.setScalar(0.9 + i*0.04); else g.scale.setScalar(0.82);
  return { g, head }; }

/* ---------------------------------------------------------------------
   RUNTIME
   --------------------------------------------------------------------- */
let NOW = 0;                                                            // absolute world minutes
const nowMin = () => NOW;
const mod1440 = (m) => ((m % 1440) + 1440) % 1440;
const PEOPLE = [], BYID = {};
const P_OF = (id) => BYID[id];
const RAIN = { on:false, t:0 };
const covered = (x, z, h) => WX.coverAt(x, z) > h;
// the map's walker body (so doors, the tram, cars and the crowd all see these people) with this phase's extras
function makePerson(def){ const pp = buildPersonX({ id:def.id, ...def.look, outfit0:'casual' });
  const TC = C.TIMECFG || { walk:1 }; pp.freq *= TC.walk;          // the shared walking setting: the feet keep pace with the ground they cover
  const w = { pp, name:def.name, x:0, z:0, y:G, r:0.25, yaw:0, ride:null, inside:null, moving:false, speed:def.speed*TC.walk, dist:0, sit:null, plan:[], pi:0, path:null, pj:0, wait:0, stuck:0, stats:{ clip:0, replans:0 }, life:true };
  C.WALKERS.push(w);
  const P = { id:def.id, def, w, pp, plan:[], cur:-1, stage:'', t:0, act:null, actT:0, hold:{}, room:null, hidden:false, seated:null, umbK:0, lookAt:null, rainVariant:false, log:[], arrivals:[], stats:{ late:0, early:0 } };
  P.w.P = P; PEOPLE.push(P); BYID[def.id] = P; return P; }
CAST.forEach(makePerson);
// the pair: a child walks by her father, the crowd lets them stand close
BYID.K04.w.pair = BYID.K03.w; BYID.K03.w.pair = BYID.K04.w;

// the items of phase 1 (their places at the start of a day; restored to that day's state on load)
makeItem('bread_delivery', 'basket', { ...PL.BAKERY_COUNTER, x:25.4, y:G + 1.01, z:-7.95, name:'bakery counter' });
makeItem('cup_k07', 'cup', { ...PL.CAFE_COUNTER_TOP, name:'cafe counter' });
makeItem('cat_bowl', 'bowl', { x:-22.6, y:G, z:-14.3, hidden:true, name:'inside the café' });
makeItem('mitten_blue', 'glove', { ...PL.LOST_BOX, y:PL.LOST_BOX.y + 0.02, name:'lost box' });
makeItem('drawing', 'paper', { x:0, y:-50, z:0, hidden:true, name:'with the visitors' });
makeItem('blanket_h01', 'blanket', { ...PL.H01_ARMCHAIR_TOP, name:'armchair' }); ITEMS.blanket_h01.m.add(new THREE.Mesh(rbox(0.6, 0.06, 0.5, 0.03), matOf('#e8dcc8')));
makeItem('water_k05', 'water', { x:0, y:-50, z:0, hidden:true, name:'care bag' });
makeItem('food_k02', 'foodbag', { x:0, y:-50, z:0, hidden:true, name:"grandma's pocket" });
makeItem('phone_k01', 'phone', { x:0, y:-50, z:0, hidden:true, name:"K01's pocket" });
makeItem('notebook_k07', 'notebook', { x:0, y:-50, z:0, hidden:true, name:"K07's bag" });
makeItem('briefcase_r05', 'briefcase', { x:0, y:-50, z:0, hidden:true, name:'R05 home' });
makeItem('crate', 'crate', { ...PL.CRATE_PICK, name:'crate stack' });
makeItem('bouquet_k10', 'bouquet', { x:0, y:-50, z:0, hidden:true, name:'flower shop (not yet made up)' });
makeItem('folder_k10', 'folder', { x:0, y:-50, z:0, hidden:true, name:"K10's bag" });
makeItem('ring_k01', 'phone', { x:0.55, y:G + 0.005, z:-9.75, name:'under the bench' }); ITEMS.ring_k01.m.scale.set(0.9, 0.35, 2.2); ITEMS.ring_k01.m.traverse(o=>{ if (o.isMesh) o.material = matOf('#f4c83a'); });
makeItem('bread2', 'foodbag', { x:0, y:-50, z:0, hidden:true, name:'bakery' });
makeItem('oranges', 'bowl', { x:0, y:-50, z:0, hidden:true, name:"R19's bag" }); ITEMS.oranges.m.traverse(o=>{ if (o.isMesh) o.material = matOf('#f4a03a'); });
makeItem('biscuits', 'notebook', { x:0, y:-50, z:0, hidden:true, name:"grandma's tin" }); ITEMS.biscuits.m.traverse(o=>{ if (o.isMesh) o.material = matOf('#e8c890'); });
makeItem('mitten_red', 'glove', { x:-21.6, y:G + 3.25, z:-4.7, name:'café eave' }); ITEMS.mitten_red.m.traverse(o=>{ if (o.isMesh && o.visible) o.material = matOf('#d83a4a'); });
makeItem('paper_sheet', 'paper', { x:-31, y:G + 0.02, z:-0.8, name:'arcade (blown in)' });
makeItem('photo_k03', 'paper', { x:0, y:-50, z:0, hidden:true, name:"the father's pocket" }); ITEMS.photo_k03.m.scale.setScalar(0.55);
makeItem('drink_r20', 'cup', { x:0, y:-50, z:0, hidden:true, name:'the store' });
makeItem('meal_r03', 'foodbag', { x:0, y:-50, z:0, hidden:true, name:'the store' });
makeItem('till_key', 'phone', { x:0, y:-50, z:0, hidden:true, name:"R04's pocket" }); ITEMS.till_key.m.traverse(o=>{ if (o.isMesh) o.material = matOf('#e8c84a'); }); ITEMS.till_key.m.scale.setScalar(0.8);
makeItem('phone_k09', 'phone', { x:0, y:-50, z:0, hidden:true, name:"K09's pocket" });
const POCKET = { phone:'phone_k01', notebook:'notebook_k07', water:'water_k05', briefcase:'briefcase_r05' };

/* ---------- compile the days: places, path lengths, departures ---------- */
const placeOf = (P, e) => { if (!e) return null; if (e.act === 'drive') return e.to === 'CARPARK' ? DRIVE.carStand : { x:69.9, z:-38.0, name:'harbour car' }; if (e.act === 'tram'){ const pl = C.PLATFORMS.find(p=>p.id === e.to); return { x:(pl.x0 + pl.x1)/2 + (pl.alongZ ? 0 : 3), z:(pl.z0 + pl.z1)/2 + (pl.alongZ ? 4 : 0.2), name:e.to + ' platform' }; } const k = e.at || (e.act === 'home' ? P.def.home : e.act === 'off' ? 'PIER' : null); return k ? PL[k] || (k === 'OFF' ? PL.PIER : null) : (e.act === 'wander' ? { x:LOOPS[e.loop][0][0], z:LOOPS[e.loop][0][1] } : null); };
const outsideOf = (pl) => pl ? (pl.room ? PL[pl.room] : pl.door ? { x:pl.door.front[0], z:pl.door.front[1] } : pl) : null;   // where it is reached from in the street
const pathLen = (a, b) => { if (!a || !b) return 0; const p = WORLD.path(a.x, a.z, b.x, b.z); if (!p){ log('NO PATH', a.name || '', '→', b.name || '', a.x.toFixed(1), a.z.toFixed(1), b.x.toFixed(1), b.z.toFixed(1)); return Math.hypot(a.x - b.x, a.z - b.z)*1.6; }
  let L = 0; for (let i=1;i<p.length;i++) L += Math.hypot(p[i].x - p[i-1].x, p[i].z - p[i-1].z); return L; };
const realToMin = (sec) => sec/STEP_H*60;
const TRAM_EST = { wait:30, ride:{ 'quay>station':88, 'station>quay':52, 'station>park':22, 'park>station':30 } };   // real seconds, measured on the map's tram (report): a round ~2.6 min
const DRIVE = {};                                                                                                     // routes, filled below
const COMPILED = {};
function compile(){ PEOPLE.forEach(P=>{ const days = DAYS[P.id] || []; const out = days.map(([t, e])=>({ t:hm(t), e }));
    out.forEach((it, i)=>{ const prev = out[(i - 1 + out.length) % out.length], e = it.e, a = e.via ? PL[e.via] : (outsideOf(placeOf(P, prev.e)) || PL.PIER);
      let sec = 0; const sp = P.def.speed;
      if (e.act === 'tram'){ const w0 = PL[e.wait]; sec = pathLen(a, w0)/sp + TRAM_EST.wait + (TRAM_EST.ride[e.from + '>' + e.to] || 60); }
      else if (e.act === 'drive'){ const carAt = e.to === 'CARPARK' ? { x:69.9, z:-38.0 } : DRIVE.carStand; sec = 10 + (DRIVE[e.to] ? DRIVE[e.to].L/6.8 : 60) + pathLen(a, carAt)/sp; }
      else if (e.act === 'off' || e.enterFrom) sec = 0;
      else { const b = outsideOf(placeOf(P, e)); sec = (prev.e.act === 'tram' ? 0 : pathLen(a, b)/sp) + (e.via ? 6 : 0); }
      it.travelSec = sec; it.dep = it.t - Math.ceil(realToMin(sec) + 6); });
    // never leave before the last part is over: an event keeps its people to the end of its window; anything else stays 5 minutes
    out.forEach((it, i)=>{ if (!i) return; const prev = out[i - 1], stay = prev.e.act === 'event' && EVENTS[prev.e.ev] ? hm(EVENTS[prev.e.ev].win[1]) - prev.t : 5; if (it.dep < prev.t + stay){ it.lateBy = prev.t + stay - it.dep; it.dep = prev.t + stay; } if (it.dep <= prev.dep) it.dep = prev.dep + 1; });   // departures strictly in order (a tie used to hide the later part)
    // the first entry starts at 00:00 — a departure before midnight is kept as negative minutes
    P.plan = out; COMPILED[P.id] = out.map(it=>({ t:it.t, dep:it.dep, act:it.e.act, at:it.e.at || '', travelMin:+realToMin(it.travelSec).toFixed(0) })); }); }

/* ---------- the plan: which entry is active at a minute ---------- */
function activeIndex(P, m){ const d = mod1440(m), plan = P.plan; let best = -1, bestDep = -1e9;
  // the entry whose departure is the latest one not after now (departures may be before midnight)
  for (let i=0;i<plan.length;i++){ let dep = plan[i].dep; if (dep > d) dep -= 1440; if (dep > bestDep){ bestDep = dep; best = i; } } return best; }

/* ---------- moving: paths, doors, rooms ---------- */
function planTo(P, x, z){ const w = P.w; if ((P.noPathT || 0) > simT){ w.path = [{ x:w.x, z:w.z }, { x, z }]; w.pj = 1; return false; }
  const p = WORLD.path(w.x, w.z, x, z); w.path = p; w.pj = 1; w.stats.replans++; if (!p){ log(P.id, 'no path to', x.toFixed(1), z.toFixed(1)); P.noPathT = simT + 1.5; w.path = [{ x:w.x, z:w.z }, { x, z }]; } return !!p; }
function follow(P, dt, sp){ const w = P.w, Pth = w.path; if (!Pth || w.pj >= Pth.length) return true;
  const q = Pth[w.pj], dx = q.x - w.x, dz = q.z - w.z, d = Math.hypot(dx, dz);
  const dr = q.door || WORLD.doorOnLine(w.x, w.z, q.x, q.z);
  if (dr && !dr.sealed && dr.open < 0.85){ dr.target = 1; dr.lastUse = C.SIM.steps; if (Math.hypot(w.x - dr.cx, w.z - dr.cz) < 1.2){ w.moving = false; return false; } }
  if (dr) dr.lastUse = C.SIM.steps;
  if (d < 0.3){ w.pj++; return w.pj >= Pth.length; }
  const s = Math.min(d, (sp || w.speed)*dt), ox = w.x, oz = w.z; w.yaw = Math.atan2(-dz, dx);
  C.stepWalker(w, dx/d*s, dz/d*s, dt); const moved = Math.hypot(w.x - ox, w.z - oz); w.moving = moved > 1e-4; w.dist += moved;
  if (moved < s*0.2){ w.stuck += dt; if (w.stuck > 2.5){ w.stuck = 0; w.stuckN = (w.stuckN || 0) + 1; const last = Pth[Pth.length - 1]; planTo(P, last.x, last.z);
      // stalled again on the same line (someone sitting in the way, a narrow gap): a step to the free side first, then on
      if (w.stuckN >= 2 && w.path){ const ux = -dz/d, uz = dx/d; for (const sgn of [1, -1]) for (const r of [0.9, 1.5]){ const sx = w.x + ux*r*sgn, sz = w.z + uz*r*sgn;
          if (WORLD.freeAt(sx, sz, 0.3, WORLD.floorAt(sx, sz))){ w.path.splice(w.pj, 0, { x:sx, z:sz }); w.stuckN = 0; log(P.id, 'side-step at', w.x.toFixed(1), w.z.toFixed(1)); return false; } } } } }
  else { w.stuck = 0; if (moved > s*0.6) w.stuckN = 0; }
  // no progress towards the next point for 3 s although the feet move (pushed back and forth by someone in the way): step aside
  if (!w.prog || w.prog.pj !== w.pj){ w.prog = { pj:w.pj, d, t:0 }; } else { w.prog.t += dt; if (d < w.prog.d - 0.3){ w.prog.d = d; w.prog.t = 0; }
    else if (w.prog.t > 3){ w.prog.t = 0; const ux = -dz/d, uz = dx/d; let done = false;
      for (const sgn of [1, -1]) for (const r of [0.9, 1.5]){ if (done) break; const sx = w.x + ux*r*sgn, sz = w.z + uz*r*sgn;
        if (WORLD.freeAt(sx, sz, 0.3, WORLD.floorAt(sx, sz))){ w.path.splice(w.pj, 0, { x:sx, z:sz }); done = true; log(P.id, 'side-step (no progress) at', w.x.toFixed(1), w.z.toFixed(1)); } } } }
  return false; }
// go to (x, z) in the street; true once there
function goTo(P, x, z, dt){ const w = P.w; if (!P.goal || Math.hypot(P.goal[0] - x, P.goal[1] - z) > 0.05){ P.goal = [x, z]; planTo(P, x, z); }
  if (Math.hypot(w.x - x, w.z - z) < 0.35){ w.moving = false; return true; }
  if (!w.path) planTo(P, x, z); const end = follow(P, dt), dd = Math.hypot(w.x - x, w.z - z);
  // the grid's path ends a little short of the spot: the last stretch straight to it (once), if it is open ground
  if (end && dd >= 0.6 && dd < 2.5 && w.path && !w.path.tail){ w.path.push({ x, z }); w.path.tail = true; }
  return end && dd < 0.6; }
function hide(P, why){ P.hiddenAt = why; P.hidden = true; P.w.hidden = true; P.w.inside = P.w.inside || { front:[P.w.x, P.w.z], nx:0, nz:1, cx:P.w.x, cz:P.w.z, shell:why }; P.pp.g.visible = false; }
function unhide(P, x, z, yaw){ P.hidden = false; P.w.hidden = false; P.w.inside = null; P.w.x = x; P.w.z = z; P.w.y = WORLD.floorAt(x, z); if (yaw != null) P.w.yaw = yaw; P.pp.g.visible = true; P.pp.g.rotation.y = P.w.yaw; }
function intoRoom(P, room){ P.room = room; P.hidden = false; P.w.hidden = true; P.w.inside = P.w.inside || { front:[0, 0], nx:0, nz:1, cx:0, cz:0, room }; const d = PL.H01_DOOR; P.rx = d.x; P.rz = d.z; P.ryaw = d.yaw + Math.PI; P.pp.g.visible = true; }
function outOfRoom(P){ P.room = null; const d = PL.H01.door; unhide(P, d.front[0], d.front[1], yawTo(d.nx, d.nz)); d.target = 1; d.lastUse = C.SIM.steps; }
// stepping in / out through a real house door (opened, walked through) — or a shell's threshold
function enterHome(P, pl, dt){ const w = P.w;
  if (pl.door){ const d = pl.door; if (!goTo(P, d.front[0], d.front[1], dt)) return false; d.target = 1; d.lastUse = C.SIM.steps; w.yaw = yawTo(-d.nx, -d.nz); if (d.open < 0.8) return false;
    P.t += dt; if (P.t < 0.6) { w.moving = true; C.stepWalker(w, -d.nx*w.speed*dt*0.6, -d.nz*w.speed*dt*0.6, dt); return false; } P.t = 0; d.target = 0;
    if (P.def.room) { w.x = d.cx; w.z = d.cz; intoRoom(P, P.def.room); } else hide(P, pl.name || 'home'); return true; }
  if (!goTo(P, pl.x, pl.z, dt)) return false; w.yaw = pl.yaw; P.t += dt; if (P.t < 0.5) return false; P.t = 0; hide(P, pl.name); return true; }
function leaveHome(P, pl){ if (P.room){ return 'room'; } if (pl && pl.door){ const d = pl.door; unhide(P, d.front[0] - d.nx*0.3, d.front[1] - d.nz*0.3, yawTo(d.nx, d.nz)); d.target = 1; d.lastUse = C.SIM.steps; }
  else if (pl) unhide(P, pl.x, pl.z, pl.yaw + Math.PI); return 'out'; }
// walking inside the room (no world collision there; the room's walls)
function roomGo(P, x, z, dt){ const dx = x - P.rx, dz = z - P.rz, d = Math.hypot(dx, dz); if (d < 0.12){ P.pp.walking = false; return true; }
  const s = Math.min(d, 0.8*dt); P.rx += dx/d*s; P.rz += dz/d*s; P.ryaw = Math.atan2(-dz, dx); P.pp.walking = true; return false; }

/* ---------- items in hand during an activity ---------- */
function takeOut(P, key){ const id = POCKET[key] || key, it = ITEMS[id]; if (!it) return; if (it.holder === P.id && it.m.visible) return; holdItem(it, P, 1, it.kind === 'notebook' ? { rx:Math.PI/2, y:-0.04 } : it.kind === 'briefcase' ? {} : {}); P.hold[key] = it; }
function putAway(P, key){ const it = P.hold[key]; if (!it) return; if (it.holder === P.id && POCKET[key]) placeItem(it, { x:0, y:-50, z:0, hidden:true, name:P.id + ' pocket' }); delete P.hold[key]; }

/* ---------- the action layer: what the arms, head and torso do on top of the walk ---------- */
// targets: [arm L, fore L, arm R, fore R, lean, nod, headYaw]; a name → a function of time
const ACTS = {
  idle:(t, P)=>[0.05, 0.25, 0.05, 0.25, 0, 0.04*Math.sin(t*0.4 + P.pp.seed), 0.25*Math.sin(t*0.13 + P.pp.seed)],
  look:(t, P)=>[0.05, 0.2, 0.05, 0.2, 0, -0.05, 0.5*Math.sin(t*0.21 + P.pp.seed)],
  phone:(t, P)=>[0.1, 0.3, 0.55, 2.05, -0.06, -0.42 + 0.03*Math.sin(t*0.7), 0],
  phoneDown:(t)=>[0.1, 0.3, 0.2, 0.9, 0, 0.0, 0.15*Math.sin(t*0.2)],
  read:(t)=>[0.45, 1.25, 0.45, 1.25, -0.12, -0.5, 0],
  draw:(t)=>[0.45, 1.25, 0.5 + 0.06*Math.sin(t*7), 1.25 + 0.15*Math.sin(t*5.3), -0.12, (Math.floor(t/7) % 3 === 2) ? 0.0 : -0.5, (Math.floor(t/7) % 3 === 2) ? 0.6 : 0],
  wipe:(t)=>[0.05, 0.3, 0.75 + 0.12*Math.sin(t*4), 0.5 + 0.2*Math.cos(t*4), -0.2, -0.35, 0],
  align:(t)=>[0.6, 0.5, 0.7, 0.45 + 0.1*Math.sin(t*1.5), -0.22, -0.45, 0.2*Math.sin(t*0.5)],
  arrange:(t)=>[0.1, 0.3, 1.1 + 0.25*Math.sin(t*1.1), 0.4, -0.05, -0.1, 0.4*Math.sin(t*0.3)],
  fold:(t)=>[0.75 + 0.18*Math.sin(t*2.4), 0.7, 0.75 + 0.18*Math.sin(t*2.4 + Math.PI), 0.7, -0.3, -0.45, 0],
  load:(t)=>[0.9 + 0.2*Math.sin(t*1.6), 0.4, 0.9 + 0.2*Math.sin(t*1.6), 0.4, -0.45, -0.35, 0],
  mend:(t)=>[0.5, 1.1 + 0.25*Math.sin(t*3.1), 0.5, 1.1 + 0.25*Math.sin(t*3.1 + Math.PI), -0.25, -0.55, 0],
  give:(t, P, k)=>[0.1, 0.3, 1.25, 0.25, -0.1, -0.15, 0],
  receive:(t)=>[1.0, 0.45, 1.0, 0.45, -0.08, -0.15, 0],
  hold:(t)=>[0.1, 0.3, 0.45, 1.15, 0, -0.1, 0],
  carry:(t)=>[0.1, 0.3, 0.55, 1.2, 0.02, 0, 0],
  reach:(t)=>[0.1, 0.3, 1.0, 0.3, -0.45, -0.5, 0],
  feed:(t)=>[0.1, 0.3, 0.5 + 0.7*Math.max(0, Math.sin(t*2.2)), 0.3, -0.18, -0.35, 0],
  hesitate:(t)=>{ const u = (t % 5)/5, up = u < 0.45 ? smooth(0, 0.3, u) : 1 - smooth(0.45, 0.8, u); return [0.05, 0.25, 0.3 + 1.1*up, 0.6 - 0.4*up, 0, -0.05, 0]; },
  pocket:(t)=>[0.1, 0.3, 0.25, 1.6, 0, -0.35, 0],
  crouch:(t)=>[0.1, 0.3, 0.9, 0.4, -0.55, -0.5, 0],
  drive:(t)=>[1.05, 0.65, 1.05, 0.65, 0, -0.05, 0.12*Math.sin(t*0.3)],
  wave:(t)=>[0.05, 0.25, 2.6, 0.3 + 0.3*Math.sin(t*9), 0, 0, 0],
  nod:(t)=>[0.05, 0.25, 0.05, 0.25, 0, -0.18*Math.max(0, Math.sin(t*3)), 0],
  blanket:(t)=>[1.25, 0.5, 1.25, 0.5, -0.12, -0.2, 0],
  carryBox:(t)=>[0.95, 0.95, 0.95, 0.95, 0, -0.05, 0],
  umb:(t)=>[0.05, 0.25, 0.35, 1.55, 0, 0, 0],
  argue:(t, P)=>{ const a = Math.max(0, Math.sin(t*2.6 + P.pp.seed)); return [0.2 + 0.9*a, 0.55, 0.15 + 0.5*Math.max(0, Math.sin(t*2.1 + 1.3 + P.pp.seed)), 0.6, 0.04, 0.06*Math.sin(t*1.7), 0.35*Math.sin(t*0.9 + P.pp.seed)]; },
  away:(t)=>[0.05, 0.2, 0.05, 0.2, 0, -0.25, 0.9],
};
function setAct(P, name, fade = 0.5){ if (P.act === name) return; P.act = name; P.actT = 0; P.actK = 0; P.actFade = fade; }
function doAct(P, dt){ if (P.act){ P.actT += dt; P.actK = Math.min(1, P.actK + dt/Math.max(0.05, P.actFade)); } }

/* ---------- the parts of a day ---------- */
function startEntry(P, idx, fromLoad){ const it = P.plan[idx]; P.cur = idx; P.entry = it; P.stage = 'go'; P.t = 0; P.goal = null; P.w.path = null; P.sub = 0;
  P.variant = (it.e.rain && RAIN.on) ? it.e.rain : it.e; P.rainVariant = !!(it.e.rain && RAIN.on);
  if (P.seated && !fromLoad) P.standUp = 0.6;
  P.log.push([NOW, it.e.act, (P.variant.at || '')]); if (P.log.length > 60) P.log.shift(); }
// an outfit is changed out of sight (inside): from the entry about to start, or 'home' once home
function changeIfHidden(P, name){ if (name && (P.hidden || P.room) && P.pp.outfit !== name){ setOutfit(P.pp, name); } }
function arrive(P){ if (P.arrived === P.cur) return; P.arrived = P.cur; const late = mod1440(NOW) - P.entry.t; const l2 = late > 720 ? late - 1440 : late < -720 ? late + 1440 : late; P.arrivals.push([P.entry.t, Math.round(l2)]); if (P.arrivals.length > 40) P.arrivals.shift(); if (l2 > 10) P.stats.late++; }
const UMB_OK = (P) => !P.hidden && !P.room && !P.w.ride && !P.driving && !(P.seated && covered(P.w.x, P.w.z, P.w.y + 2.2));

function personTick(P, dt){ const w = P.w; w.moving = false; w.held = false;
  let idx = activeIndex(P, NOW);
  if (idx !== P.cur && P.variant && P.variant.cover){ const O = BYID[P.variant.cover]; if (!(O.variant && O.variant.at === P.variant.at && O.stage === 'do') && mod1440(NOW - (P.entry.t || 0)) < 300) idx = P.cur; }
  if (idx !== P.cur && (P.driving || P.w.ride || (P.variant && P.variant.act === 'drive' && P.sub > 0 && P.sub < 4) || (P.variant && P.variant.act === 'event' && EVENTS[P.variant.ev] && EVENTS[P.variant.ev].state === 'run'))) idx = P.cur;
  if (idx !== P.cur) startEntry(P, idx);
  // weather: an outdoor part with a rain variant changes over when the rain sets in or ends (each person a little later than the last)
  if (P.entry && P.entry.e.rain && RAIN.on !== P.rainVariant && P.stage !== 'event' && (RAIN.t > 2 + hash(P.id.charCodeAt(2), 7)*4)) startEntry(P, P.cur);
  const e = P.variant, pl = e.at ? PL[e.at] : null;
  if (P.standUp > 0){ P.standUp -= dt; if (P.standUp <= 0){ P.seated = null; } else { w.held = true; return; } }
  const wantOutfit = e.outfit;
  // out of the room / out of a door first (dressed for what comes next)
  const SAMEB = { CAFE_IN:'cafe', CAFE_BACK:'cafe', BAKERY_UP:'bakery', LAUNDRY_UP:'laundry' }, sameB = (a, b) => a === b || (SAMEB[a] && SAMEB[a] === SAMEB[b]);
  const sameShell = e.act === 'shell' && P.hidden && sameB(P.hiddenAt, e.at);
  if ((P.hidden || P.room) && !['home', 'off'].includes(e.act) && !sameShell && !(e.act === 'event' && pl && pl.room)){
    if (P.room && !(pl && pl.room)){ changeIfHidden(P, wantOutfit); if (roomGo(P, PL.H01_DOOR.x, PL.H01_DOOR.z, dt)){ outOfRoom(P); } return; }
    if (P.hidden && P.def.visitor && !e.follow && P.w.inside && P.w.inside.shell === 'off'){ if (e.act === 'off' || e.act === 'leave') return; unhide(P, PL.PIER.x, PL.PIER.z, PL.PIER.yaw); }
    if (P.hidden){ changeIfHidden(P, wantOutfit); if (e.act === 'off' || (e.act === 'leave')) return; const from = PL[P.hiddenAt] || PL[P.def.home]; if (e.via){ leaveHome(P, PL[e.via]); } else leaveHome(P, from); } }
  switch (e.act){
    case 'off': if (!P.hidden){ hide(P, 'off'); } return;
    case 'leave': if (P.hidden) return; if (goTo(P, pl.x, pl.z, dt)){ arrive(P); hide(P, 'off'); } return;
    case 'home': { const H = PL[P.def.home];
      if (P.room){ changeIfHidden(P, wantOutfit || 'home'); const s = PL[e.spot || 'H01_ARMCHAIR'];
        if (P.seated){ setAct(P, P.id === 'K02' ? 'idle' : 'read'); w.held = true; return; }
        if (roomGo(P, s.x, s.z, dt)){ P.ryaw = s.yaw; arrive(P); if (s.seat) P.seated = s; } return; }
      if (P.hidden && (P.hiddenAt === P.def.home || P.hiddenAt === 'home')){ changeIfHidden(P, wantOutfit || 'home'); arrive(P); return; }
      if (P.hidden){ leaveHome(P, PL[P.hiddenAt] || H); return; }
      if (H && (H.door || H.shell)){ if (enterHome(P, H, dt)){ arrive(P); changeIfHidden(P, wantOutfit || 'home'); dropHeld(P); } } return; }
    case 'shell': { if (P.hidden && sameB(P.hiddenAt, e.at)){ P.hiddenAt = e.at; changeIfHidden(P, wantOutfit); arrive(P); return; } if (enterHome(P, pl, dt)){ arrive(P); dropHeld(P); changeIfHidden(P, wantOutfit); } return; }
    case 'tram': if (e.follow && P.sub === 0 && BYID[e.follow].sub < 1) return followTick(P, BYID[e.follow], dt); return tramTick(P, e, dt);
    case 'drive': return driveTick(P, e, dt);
    case 'wander': { const L = LOOPS[e.loop]; if (P.sub >= L.length*(e.laps || 1)){ if (goTo(P, L[0][0], L[0][1], dt)) { w.yaw = yawTo(0, -1); setAct(P, 'look'); } return; }
      const q = L[P.sub % L.length]; if (goTo(P, q[0], q[1], dt)){ P.sub++; P.goal = null; arrive(P); } return; }
    case 'event': if (e.follow && P.stage === 'go' && BYID[e.follow].stage !== 'do') return followTick(P, BYID[e.follow], dt); return eventPart(P, e, pl, dt);
  }
  // stand / work / sit at a place (a follower stays by the one she follows)
  if (e.follow && !pl){ return followTick(P, BYID[e.follow], dt); }
  if (e.follow){ const lead = BYID[e.follow]; if (lead.stage !== 'do' || Math.hypot(lead.w.x - pl.x, lead.w.z - pl.z) > 2.5) return followTick(P, lead, dt); }
  if (!pl) return;
  if (P.stage === 'go'){ const [tx, tz] = approachOf(pl), ax = e.follow ? tx + 0.9 : tx, az = e.follow ? tz + 0.6 : tz;
    if (e.hold) takeOut(P, e.hold); if (e.carry && ITEMS[carryId(e.carry)] && ITEMS[carryId(e.carry)].holder !== P.id) {}
    if (goTo(P, ax, az, dt)){ P.stage = 'do'; P.t = 0; arrive(P); if (pl.seat) { P.seated = pl; P.sitK = 0; } } setAct(P, e.hold === 'briefcase' ? 'carry' : P.hold.basket ? 'carry' : null); return; }
  // there
  w.held = true; P.t += dt;
  const yaw = pl.yaw; w.yaw += wrapA(yaw - w.yaw)*Math.min(1, dt*4);
  const ringBack = P.id === 'K01' && P.ringDay === Math.floor(NOW/1440) && e.anim === 'phone';
  if (e.hold && !ringBack) takeOut(P, e.hold); if (ringBack && P.hold.phone) putAway(P, 'phone');
  setAct(P, ringBack ? 'look' : (e.anim || (P.seated ? 'idle' : 'look')));
}
const carryId = (k) => ({ basket:'bread_delivery' })[k] || k;
function dropHeld(P){ Object.keys(P.hold).forEach(k=>putAway(P, k)); }
// the daughter by her father: 1.2 m behind on his left; she never wanders far, never crosses on her own
function followTick(P, lead, dt){ const w = P.w, lw = lead.w;
  if (lead.hidden){ if (!P.hidden){ if (Math.hypot(w.x - lw.x, w.z - lw.z) < 1.4) hide(P, 'with ' + lead.id); else goTo(P, lw.x, lw.z, dt); } return; }
  if (P.hidden){ unhide(P, lw.x + 0.6, lw.z + 0.4, lw.yaw); return; }
  const c = Math.cos(lw.yaw), s = Math.sin(lw.yaw), fx = c, fz = -s, tx = lw.x - fx*1.0 + fz*0.75, tz = lw.z - fz*1.0 - fx*0.75, d = Math.hypot(tx - w.x, tz - w.z);
  if (d > 4){ goTo(P, tx, tz, dt); return; }
  if (d > 0.35){ const sp = Math.min(d, (lw.moving ? Math.max(w.speed, 1.35) : 0.9)*dt); w.yaw = Math.atan2(-(tz - w.z), tx - w.x); C.stepWalker(w, (tx - w.x)/d*sp, (tz - w.z)/d*sp, dt); w.moving = true; P.goal = null; }
  else { w.yaw += wrapA(lw.yaw - w.yaw)*Math.min(1, dt*3); setAct(P, 'look'); }
}

/* ---------- the tram: wait on the platform, board when it stands with its doors open, sit, ride, get off, go on ---------- */
function tramTick(P, e, dt){ const w = P.w, S = C.TRAMST, TC = C.TC, wp = PL[e.wait];
  if (e.hold) takeOut(P, e.hold);
  const here = S.phase === 'dwell' && S.stop.plat.id === e.from && S.door > 0.9;
  if (P.sub === 0){ if (goTo(P, wp.x, wp.z, dt)){ P.sub = 1; w.yaw = yawTo(-1, 0); } return; }
  if (P.sub === 1){ w.held = true; setAct(P, 'look'); if (here){ // a child goes first: the father waits until she is in
      const kid = P.id === 'K03' ? BYID.K04 : null; if (kid && kid.sub < 3 && kid.entry && kid.entry.e.act === 'tram') { return; }
      const side = S.side, dz = TC.doors.map(dd=>({ dd, p:C.tramWorld(side*(TC.halfW + 0.5), TC.floor, dd) })).sort((a, b)=>Math.hypot(a.p.x - w.x, a.p.z - w.z) - Math.hypot(b.p.x - w.x, b.p.z - w.z))[0];
      if ((P.boardT || 0) < 0){ P.boardT += dt; return; } P.boardZ = dz.dd; P.sub = 2; P.atDoor = false; P.boardT = 0; } return; }
  if (P.sub === 2){ if (w.ride){ P.sub = 3; P.boardT = 0; return; } if (!here){ P.sub = 1; P.boardT = 0; return; } P.boardT = (P.boardT || 0) + dt; if (P.boardT > 8){ P.sub = 1; P.boardT = -30; return; }
    const out = C.tramWorld(S.side*(TC.halfW + 0.55), TC.floor, P.boardZ), inn = C.tramWorld(S.side*(TC.halfW - 0.6), TC.floor, P.boardZ);
    const front = Math.hypot(out.x - w.x, out.z - w.z) < 0.3 || P.atDoor; if (front) P.atDoor = true; const t = front ? inn : out, dx = t.x - w.x, dz2 = t.z - w.z, d = Math.hypot(dx, dz2) || 1;
    w.yaw = Math.atan2(-dz2, dx); C.stepWalker(w, dx/d*Math.min(d, w.speed*dt), dz2/d*Math.min(d, w.speed*dt), dt); w.moving = true; return; }
  if (P.sub === 3){ if (!w.ride){ P.sub = 5; return; } if (!w.sit){ C.sitDown(w); } w.held = true; setAct(P, P.hold.briefcase ? 'hold' : 'look'); arrive(P);
    if (S.phase === 'dwell' && S.stop.plat.id === e.to && S.door > 0.9){ const kid = BYID.K04; if (P.id === 'K03' && kid.w.ride && kid.sub === 3) return;   // the child gets off first
      C.standUp(w); P.sub = 4; } return; }
  if (P.sub === 4){ if (!w.ride){ P.sub = 5; return; } const side = S.side, dd = TC.doors.slice().sort((a, b)=>Math.abs(a - w.ride.lz) - Math.abs(b - w.ride.lz))[0], tx = side*(TC.halfW + 0.2), tz = dd;
    const dlx = tx - w.ride.lx, dlz = tz - w.ride.lz, d = Math.hypot(dlx, dlz) || 1, sp = Math.min(d, w.speed*dt), yaw = C.TRAM.rotation.y, c = Math.cos(yaw), s = Math.sin(yaw);
    const wx2 = (dlx*c + dlz*s)/d*sp, wz2 = (-dlx*s + dlz*c)/d*sp; w.yaw = Math.atan2(-wz2, wx2); C.stepWalker(w, wx2, wz2, dt); w.moving = true; return; }
  // off: stand clear of the doors and look round, until the next part of the day
  if (P.sub === 5){ const pl = C.PLATFORMS.find(p=>p.id === e.to), cx = (pl.x0 + pl.x1)/2, cz = (pl.z0 + pl.z1)/2;
    if (!P.offAt){ P.offAt = [cx + (P.id === 'K04' ? 0.7 : 0) + (pl.alongZ ? 0 : 3), cz + (pl.alongZ ? 4 : 0.2)]; }
    if (goTo(P, P.offAt[0], P.offAt[1], dt)){ setAct(P, 'look'); w.held = true; } }
}
const boarding = () => PEOPLE.some(P=>P.entry && P.variant && P.variant.act === 'tram' && ((P.sub === 2 && (P.boardT || 0) < 8) || P.sub === 4 || (P.id === 'K03' && P.sub === 1 && BYID.K04.sub === 2)));

/* ---------- driving: R22's car (not an anonymous driver: the car is empty until he gets in) ---------- */
const CARS = C.CARS, CAR = C.CAR;
const R22CAR = (()=>{ const g = C.buildCar(C.MODEL_KIT, { color:'#7a9ab8', driver:null, merge:true }); g.userData.dyn = true; g.userData.car2 = true; scene.add(g);
  const car = { g, manual:true, route:{ pts:[{ x:0, z:0, tx:1, tz:0, s:0, vmax:8 }], L:1 }, s:0, v:0, i:90, hx:CAR.length/2, hz:CAR.width/2, stopT:0, ignore:null, ignoreT:0, q:{ x:0, z:0, tx:1, tz:0 }, owner:'R22' };
  CARS.push(car); return car; })();
// its two places: a bay in the car park by the flats, and the quay strip by the north shed
const BAYS = { CARPARK:{ x:26.5, z:45.65, yaw:0 }, HARBOUR_PARK:{ x:71.1, z:-38.6, yaw:-Math.PI/2 } };
DRIVE.carStand = { x:26.5, z:44.6, name:'car door' };
function routeFrom(raw){ let P = raw; for (let it=0; it<2; it++){ const Q = [P[0]]; for (let i=0;i<P.length-1;i++){ const a = P[i], b = P[i+1]; Q.push([a[0]*0.75 + b[0]*0.25, a[1]*0.75 + b[1]*0.25], [a[0]*0.25 + b[0]*0.75, a[1]*0.25 + b[1]*0.75]); } Q.push(P[P.length-1]); P = Q; }
  const pts = []; let s = 0; for (let i=0;i<P.length-1;i++){ const a = P[i], b = P[i+1], L2 = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L2 < 1e-6) continue; const n = Math.max(1, Math.round(L2/0.5)); for (let k=0;k<n;k++){ pts.push({ x:a[0] + (b[0] - a[0])*k/n, z:a[1] + (b[1] - a[1])*k/n, s }); s += L2/n; } }
  const last = P[P.length-1]; pts.push({ x:last[0], z:last[1], s });
  pts.forEach((q, i)=>{ const a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1; q.tx = (b.x - a.x)/l; q.tz = (b.z - a.z)/l; });
  pts.forEach((q, i)=>{ const a = pts[Math.max(0, i - 6)], b = pts[Math.min(pts.length - 1, i + 6)]; const da = Math.abs(wrapA(Math.atan2(b.tz, b.tx) - Math.atan2(a.tz, a.tx))); q.vmax = da < 0.05 ? 8 : Math.max(2.6, Math.min(8, Math.sqrt(2.6*6/da))); });
  pts[pts.length - 1].vmax = 0; return { pts, L:s }; }
{ // the lanes: index's left-hand traffic. Out of the car park to 二丁目通 (r2) westbound, up the loop's west side, along the north side,
  // down the east side to the harbour; back: the loop's east and south sides, in by the car park's mouth.
  const A = C.CAR_ROUTES[0].pts, r2 = C.roadById('r2');
  const loopFrom = (x0, z0, x1, z1) => { const near = (x, z) => { let b = 0, bd = 1e9; A.forEach((q, i)=>{ const d = (q.x - x)**2 + (q.z - z)**2; if (d < bd){ bd = d; b = i; } }); return b; };
    const i0 = near(x0, z0), i1 = near(x1, z1), out = []; for (let i = i0; i !== i1; i = (i + 1) % A.length) if ((i - i0 + A.length) % 2 === 0) out.push([A[i].x, A[i].z]); return out; };
  const r2z = r2.az, wl = r2z + 1.44;                                       // westbound lane of r2
  const outR = [[26.5, 45.65], [29.6, 45.65], [31.6, 44.6], [31.9, 40.0], [31.4, wl + 1.2], [29.0, wl], ...Array.from({ length:9 }, (_, k)=>[25 - k*10, wl]).filter(p=>p[0] > r2.ax + 6),
    ...loopFrom(r2.ax - 2, wl - 2, 66, -40.5), [67.6, -39.8], [70.0, -39.2], [71.1, -38.6]];
  const backR = [[71.1, -38.6], [70.6, -36.6], [68.6, -34.6], ...loopFrom(67.5, -33, 31.6, 66.5).filter((p, i)=>i < 9999), [31.8, 62.0], [31.9, 52.0], [31.6, 47.6], [29.6, 45.65], [26.5, 45.65]];
  DRIVE.HARBOUR_PARK = routeFrom(outR); DRIVE.CARPARK = routeFrom(backR); }
const atS = (R, s) => { const P = R.pts; let lo = 0, hi = P.length - 1; if (s <= 0) return P[0]; if (s >= P[hi].s) return P[hi]; while (hi - lo > 1){ const m = (lo + hi) >> 1; if (P[m].s <= s) lo = m; else hi = m; } return P[lo]; };
function parkCar(where){ const b = BAYS[where]; R22CAR.g.position.set(b.x, Math.max(0.03, Math.min(WORLD.floorAt(b.x, b.z), G)) + CAR.wheelLift, b.z); R22CAR.g.rotation.y = b.yaw;
  R22CAR.q = { x:b.x, z:b.z, tx:Math.cos(b.yaw), tz:-Math.sin(b.yaw) }; R22CAR.v = 0; R22CAR.at = where; R22CAR.g.updateMatrixWorld(true); }
parkCar('CARPARK');
const SEAT_L = new THREE.Vector3(-0.1, 0.62, -0.38);
const carSeatWorld = () => R22CAR.g.localToWorld(SEAT_L.clone());
const carDoorWorld = () => { for (const z of [-1.45, 1.45, -1.9, 1.9]){ const v = R22CAR.g.localToWorld(new THREE.Vector3(-0.1, 0, z)); if (WORLD.freeAt(v.x, v.z, 0.25)) return v; } return R22CAR.g.localToWorld(new THREE.Vector3(-2.6, 0, 0)); };
function driveTick(P, e, dt){ const w = P.w, car = R22CAR;
  // 0 walk to the driver's door; 1 get in; 2 drive; 3 get out at the other end; 4 stand clear
  if (P.sub === 0){ if (car.at === e.to){ P.sub = 4; return; } const d = carDoorWorld(); if (goTo(P, d.x, d.z, dt)){ P.sub = 1; P.t = 0; } return; }
  if (P.sub === 1){ P.t += dt; w.held = true; w.yaw = car.g.rotation.y - Math.PI/2; if (P.t > 1.0){ P.driving = true; w.inside = { car:true, front:[w.x, w.z], nx:0, nz:1, cx:w.x, cz:w.z }; P.sub = 2; car.route = DRIVE[e.to]; car.s = 0; car.v = 0; car.at = null; arrive(P); } return; }
  if (P.sub === 2){ w.held = true; setAct(P, 'drive'); const R = car.route, L = R.L;
    // look ahead along its own path for cars, the tram and people; brake as the others do
    let hit = null; const look = 3 + car.v*car.v/(2*3) + 3;
    for (let d = 1.5; d <= look && hit == null; d += 0.8){ const q = atS(R, car.s + d);
      for (const o of CARS){ if (o === car) continue; if (WORLD.distOBB(C.carBox(o, 0.25), q.x, q.z).d < 0.95){ hit = d; break; } }
      if (hit == null && WORLD.distOBB(C.tramBox(), q.x, q.z).d < 1.6) hit = d;
      if (hit == null) for (const o of C.WALKERS){ if (o.ride || o.inside || o === w) continue; if (Math.hypot(o.x - q.x, o.z - q.z) < 1.5){ hit = d; break; } } }
    let vT = atS(R, car.s).vmax;
    for (let d = 2; d < 14; d += 2){ const q2 = atS(R, car.s + d); vT = Math.min(vT, Math.sqrt(q2.vmax*q2.vmax + 2*2.2*d)); }
    vT = Math.min(vT, Math.sqrt(2*2.0*Math.max(0, L - car.s - 0.2)));
    if (hit != null) vT = Math.min(vT, Math.sqrt(2*3.5*Math.max(0, hit - car.hx - 0.6)));
    car.v += clamp(vT - car.v, -6*dt, 2.0*dt); car.v = Math.max(0, car.v); car.s = Math.min(L, car.s + car.v*dt);
    const q = atS(R, car.s); car.q = q; const y = WORLD.floorAt(q.x, q.z);
    car.g.position.set(q.x, Math.max(0.03, Math.min(y, G)) + CAR.wheelLift, q.z); car.g.rotation.y = Math.atan2(-q.tz, q.tx); car.g.updateMatrixWorld(true);
    const sw = carSeatWorld(); w.x = sw.x; w.z = sw.z; w.yaw = car.g.rotation.y;
    if (L - car.s < 0.25 && car.v < 0.2){ parkCar(e.to); P.sub = 3; P.t = 0; } return; }
  if (P.sub === 3){ P.t += dt; w.held = true; if (P.t > 0.9){ P.driving = false; const d = carDoorWorld(); w.inside = null; w.x = d.x; w.z = d.z; w.y = WORLD.floorAt(d.x, d.z); w.yaw = car.g.rotation.y + Math.PI/2; P.seated = null; P.sub = 4; } return; }
  setAct(P, 'look'); w.held = true; }

/* ---------- events: who stands where, what passes from hand to hand ---------- */
const EVENTS = {};
const EV = (id, def) => { EVENTS[id] = { id, ...def, state:'idle', t:0, day:-1, log:[] }; };
// a hand-over: both face each other, the giver reaches out, the item changes hands where the hands meet, both draw back
function handOver(ev, giver, taker, item, t0, opt = {}){ const t = ev.t - t0; if (t < 0) return false;
  const g = BYID[giver], r = BYID[taker], it = ITEMS[item];
  const fx = r.w.x - g.w.x, fz = r.w.z - g.w.z; g.w.yaw += wrapA(yawTo(fx, fz) - g.w.yaw)*0.2; r.w.yaw += wrapA(yawTo(-fx, -fz) - r.w.yaw)*0.2;
  if (t < 1.6) setAct(g, 'give', 0.8); if (t > 0.5 && t < 2.4) setAct(r, 'receive', 0.6);
  if (t >= 1.6 && it.holder !== taker){ holdItem(it, r, 1, opt.hold || {}); ev.log.push([NOW, item, giver + '→' + taker]); }
  if (t > 1.8) setAct(g, 'idle', 0.6); if (t > 2.4) setAct(r, opt.after || 'hold', 0.6);
  return t > 2.8; }
function putDown(ev, who, item, at, t0){ const t = ev.t - t0; if (t < 0) return false; const P = BYID[who], it = ITEMS[item];
  if (t < 1.2) setAct(P, 'reach', 0.5); if (t >= 1.0 && it.holder === who){ placeItem(it, at); ev.log.push([NOW, item, who + '→' + (at.name || 'place')]); } if (t > 1.3) setAct(P, 'idle', 0.5); return t > 1.6; }
function pickUp(ev, who, item, t0, opt = {}){ const t = ev.t - t0; if (t < 0) return false; const P = BYID[who], it = ITEMS[item];
  if (t < 1.2) setAct(P, 'reach', 0.5); if (t >= 1.0 && it.holder !== who){ holdItem(it, P, 1, opt); ev.log.push([NOW, item, (it.place && it.place.name || '') + '→' + who]); } if (t > 1.3) setAct(P, opt.after || 'hold', 0.5); return t > 1.6; }
// E04 (07:20–07:50): the baker brings the basket; the barista takes it and sets it on her counter; one roll put aside for K07
EV('E04', { win:['07:20', '07:55'], roles:['giver', 'receiver'], setup(){ const it = ITEMS.bread_delivery; if (it.holder !== 'R02') holdItem(it, BYID.R02, 1); },
  run(ev){ if (!ev.sub){ if (handOver(ev, 'R02', 'K06', 'bread_delivery', 0)){ ev.sub = 1; ev.t0 = ev.t; } return false; }
    if (ev.sub === 1){ BYID.K06.w.yaw = yawTo(0, 1); if (putDown(ev, 'K06', 'bread_delivery', { ...PL.CAFE_COUNTER_TOP2, name:'cafe counter' }, ev.t0)){ ev.sub = 2; ev.t0 = ev.t; setAct(BYID.R02, 'nod', 0.3); } return false; }
    return ev.t - ev.t0 > 1.5; },
  miss(ev){ const it = ITEMS.bread_delivery; if (it.holder === 'R02') placeItem(it, { ...PL.CAFE_COUNTER_TOP2, name:'delivery basket left on the counter' }); } });
// the cup (09:10): she takes the cup from her counter, walks it to the window table, sets it down by the notebook; he nods
EV('ECUP', { win:['09:10', '09:45'], roles:['server'], need:['K07'],
  run(ev){ const P = BYID.K06, s = ev.sub || 0;
    if (s === 0){ if (pickUp(ev, 'K06', 'cup_k07', 0, { after:'hold' })){ ev.sub = 1; } return false; }
    if (s === 1){ P.w.held = false; if (goTo(P, PL.K07_SERVE.x, PL.K07_SERVE.z, 1/30)){ ev.sub = 2; ev.t0 = ev.t; } setAct(P, 'hold'); return false; }
    if (s === 2){ P.w.yaw = yawTo(0, -1); if (putDown(ev, 'K06', 'cup_k07', { ...PL.K07_TABLE_TOP, name:'window table' }, ev.t0)){ ev.sub = 3; ev.t0 = ev.t; setAct(BYID.K07, 'nod', 0.3); } return false; }
    if (s === 3){ if (ev.t - ev.t0 > 1.5) setAct(BYID.K07, 'read', 0.6); return ev.t - ev.t0 > 1.6; } return true; } });
// and back (16:20) once he has gone home
EV('ECUP2', { win:['16:20', '17:00'], roles:['server'],
  run(ev){ const P = BYID.K06, s = ev.sub || 0, it = ITEMS.cup_k07;
    if (it.holder === 'K06' && s < 2) ev.sub = 2;
    if (s === 0){ if (goTo(P, PL.K07_SERVE.x, PL.K07_SERVE.z, 1/30)){ ev.sub = 1; ev.t0 = ev.t; } return false; }
    if (s === 1){ P.w.yaw = yawTo(0, -1); if (pickUp(ev, 'K06', 'cup_k07', ev.t0)){ ev.sub = 2; } return false; }
    if (s === 2){ if (goTo(P, PL.CAFE_COUNTER.x, PL.CAFE_COUNTER.z, 1/30)){ ev.sub = 3; ev.t0 = ev.t; } setAct(P, 'hold'); return false; }
    if (s === 3){ P.w.yaw = yawTo(0, 1); return putDown(ev, 'K06', 'cup_k07', { ...PL.CAFE_COUNTER_TOP, name:'cafe counter' }, ev.t0); } return true; } });
// E01 (09:15–09:45): grandma stands, scatters a handful three times (one handful on purpose further out), sits again
EV('E01', { win:['09:15', '09:50'], roles:['feeder'],
  run(ev){ const P = BYID.K02, t = ev.t, out = !RAIN.on ? PL.PLAZA_FEED : { x:17.6, z:0.6 };
    if (t < 0.1){ P.standUp = 0.6; ev.base = out; holdItem(ITEMS.food_k02, P, 1); }
    if (t > 0.8 && t < 9){ setAct(P, 'feed', 0.4); const n = Math.min(36, Math.floor((t - 0.8)/0.22)); if (n > CRUMBS.count){ for (let i = CRUMBS.count; i < n; i++){ const far = i % 9 === 8, a = hash(i, 3)*Math.PI*2, r = far ? 2.4 + hash(i, 5) : 0.5 + hash(i, 4)*1.2;
          const x = ev.base.x + Math.cos(a)*r*(far ? 1 : 0.8), z = ev.base.z + Math.sin(a)*r*0.6 - (far ? 0 : 0.3); CRUMBS.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, WORLD.floorAt(x, z) + 0.01, z)); } CRUMBS.count = n; CRUMBS.instanceMatrix.needsUpdate = true; ev.crumbs = n; } }
    if (t > 9.2){ setAct(P, 'idle'); placeItem(ITEMS.food_k02, { x:0, y:-50, z:0, hidden:true, name:"grandma's pocket" }); }
    return t > 10; },
  after(){ /* the crumbs are eaten by the pigeons (they go one by one) */ } });
// E05 (15:20–15:55): the father lifts his hand to the boarded door and lets it fall, twice; the girl puts her drawing in the slot
EV('E05', { win:['15:20', '15:58'], roles:['father', 'daughter'], setup(){ holdItem(ITEMS.drawing, BYID.K04, 1); },
  run(ev){ const F = BYID.K03, K = BYID.K04, t = ev.t; F.w.yaw = yawTo(0, 1); K.w.yaw = yawTo(0, 1);   // (turned to each other below for the offer)
    // the old photo out of his pocket, held up against the door, put back
    if (t < 0.15 && ITEMS.photo_k03.holder !== 'K03'){ holdItem(ITEMS.photo_k03, F, 1, { rx:Math.PI/2 }); } if (t < 1.4) setAct(F, 'read', 0.4); else if (t < 1.6 && ITEMS.photo_k03.holder === 'K03') placeItem(ITEMS.photo_k03, { x:0, y:-50, z:0, hidden:true, name:"the father's pocket" });
    // first she holds the drawing out to him (a big arm, turned to him; he looks at it and does not take it), then she goes to the door
    if (t > 1.6 && t < 4.4){ K.w.yaw = yawTo(F.w.x - K.w.x, F.w.z - K.w.z); setAct(K, 'give', 0.6); if (t > 1.8 && t < 3.6) F.w.yaw = yawTo(K.w.x - F.w.x, K.w.z - F.w.z); }
    else if (t >= 4 && t < 4.2) setAct(K, 'idle', 0.5);
    if (t < 1.4){} else if (t < 2.0 || t > 4.0){ if (t < 10.5) setAct(F, 'hesitate', 0.6); else if (t < 14) setAct(F, 'pocket', 0.6); else setAct(F, 'look'); } else setAct(F, 'look', 0.6);
    if (t > 4 && t < 6.5){ K.w.x += (PL.EMPTY_SLOT.x - 0.05 - K.w.x)*0.04; K.w.z += (PL.EMPTY_SLOT.z - 0.75 - K.w.z)*0.04; }
    if (t > 6) putDown(ev, 'K04', 'drawing', { ...PL.EMPTY_SLOT, name:'door slot', slot:true }, 6);
    return t > 15; },
  miss(){} });
// E06 (16:00–16:30): grandma comes out to her chair with the household blanket; the nurse sets her bag by the door, gives her water,
// puts the blanket round her shoulders, sits a while, takes the bag and goes. In rain all of it happens in the living room.
EV('E06', { win:['16:00', '16:40'], roles:['nurse', 'patient'],
  setup(ev){ ev.inside = RAIN.on; const K = BYID.K02; const b = ITEMS.blanket_h01; if (b.holder !== 'K02') holdItem(b, K, 0, { y:-0.05 }); },
  run(ev){ const N = BYID.K05, K = BYID.K02, t = ev.t;
    if (t < 0.1){ holdItem(ITEMS.water_k05, N, 1); }
    if (t > 0.3 && t < 1.6) setAct(N, 'reach');
    if (t > 1.8 && t < 2.1) setAct(N, 'idle');
    const handed = t > 2.1 && handOver(ev, 'K05', 'K02', 'water_k05', 2.1, { after:'hold' });
    if (t > 5.0 && t < 5.1){ /* the blanket: from her lap to the nurse */ holdItem(ITEMS.blanket_h01, N, 1); }
    if (t > 5.1 && t < 7.4) setAct(N, 'blanket', 0.6);
    if (t > 7.0 && ITEMS.blanket_h01.holder === 'K05'){ placeItem(ITEMS.blanket_h01, { x:0, y:-50, z:0, hidden:true, name:'on grandma' }); ITEMS.blanket_h01.holder = 'K02'; ITEMS.blanket_h01.state = 'heldBy'; showComp(K.pp, 'blanket', true); ev.log.push([NOW, 'blanket_h01', 'K05→K02 (shoulders)']); }
    if (t > 7.8) { setAct(N, 'idle'); if (!N.seated && !ev.inside) N.seated = PL.H01_CHAIR_E; if (ev.inside && !N.seated) N.seated = PL.H01_VISITOR; }
    if (t > 8 && t < 13) setAct(K, Math.floor(t/2.5) % 2 ? 'nod' : 'idle');
    return t > 14; },
  miss(){} });
// E08 (18:50–19:20): the barista comes round the back with the cat's bowl, crouches, sets it down; the cat eats; she watches, takes it in
EV('E08', { win:['18:50', '19:25'], roles:['feeder'], setup(){ holdItem(ITEMS.cat_bowl, BYID.K06, 1); },
  run(ev){ const P = BYID.K06, t = ev.t; P.w.yaw = yawTo(0.3, -1);
    if (t < 2) setAct(P, 'crouch', 0.6); if (t > 1.4 && ITEMS.cat_bowl.holder === 'K06'){ placeItem(ITEMS.cat_bowl, { x:-22.1, y:G + 0.01, z:-15.35, name:'cat bowl by the back door' }); ev.log.push([NOW, 'cat_bowl', 'K06→back door']); }
    if (t > 2.4 && t < 8.6) setAct(P, 'look'); ev.catFed = t > 2 && t < 8.4;
    if (t > 8.6 && ITEMS.cat_bowl.holder !== 'K06'){ setAct(P, 'crouch', 0.5); pickUp(ev, 'K06', 'cat_bowl', 8.6); }
    return t > 10.6; } });
// E09 (02:00–02:30): from the lost box to the folding table, mended (a white line of stitches), back into the box
EV('E09', { win:['02:00', '02:40'], roles:['mender'],
  run(ev){ const t = ev.t, it = ITEMS.mitten_blue; if (!ev.sub && it.mended && it.holder !== 'K08'){ ev.sub = 9; }
    if (!ev.sub){ if (pickUp(ev, 'K08', 'mitten_blue', 0)){ ev.sub = 1; ev.t0 = ev.t; } return false; }
    if (ev.sub === 1){ setAct(BYID.K08, 'mend', 0.5); if (ev.t - ev.t0 > 10.5){ it.mended = true; it.m.userData.stitch.visible = true; it.mendedAt = NOW; ev.log.push([NOW, 'mitten_blue', 'mended']); ev.sub = 2; ev.t0 = ev.t; } return false; }
    if (ev.sub === 2) return putDown(ev, 'K08', 'mitten_blue', { ...PL.LOST_BOX, y:PL.LOST_BOX.y + 0.02, name:'lost box' }, ev.t0);
    return true; } });
// the mended glove goes to school (13:30 from the box; 15:00 at the gate, to the boy who lost it)
EV('EGLOVE_PICK', { win:['12:50', '13:05'], roles:['carrier'], run(ev){ if (!ITEMS.mitten_blue.mended) return true; return pickUp(ev, 'R15', 'mitten_blue', 0, { after:'carry' }); } });
EV('EGLOVE', { win:['15:00', '15:30'], roles:['carrier', 'child'],
  run(ev){ if (ITEMS.mitten_blue.holder !== 'R15') return true; const ok = handOver(ev, 'R15', 'R06', 'mitten_blue', 0, { after:'hold' }); if (ok){ ITEMS.mitten_blue.handedAt = NOW; } return ok; } });
// batch 2 ------------------------------------------------------------------------------------------------
// EFILE (14:30): K10 hands the yellow folder to R25 at the office door (the spec's 16:00, moved: see DAYS)
EV('EFILE', { win:['14:30', '15:00'], roles:['giver', 'taker'], setup(){ holdItem(ITEMS.folder_k10, BYID.K10, 1); },
  run(ev){ const ok = handOver(ev, 'K10', 'R25', 'folder_k10', 0.6); if (ok){ setAct(BYID.R25, 'nod', 0.3); } return ok && ev.t > 4.2; },
  end(){ if (ITEMS.folder_k10.holder === 'R25') placeItem(ITEMS.folder_k10, { x:0, y:-50, z:0, hidden:true, name:'office files' }); } });
// EFLOWER (17:00): R14 takes the reserved bouquet off the rack's top shelf and gives it to K10
EV('EFLOWER', { win:['17:00', '17:40'], roles:['florist', 'buyer'], setup(){ placeItem(ITEMS.bouquet_k10, PL.FLOWERS_SHELF); },
  run(ev){ if (!ev.sub){ BYID.R14.w.yaw = yawTo(1, 0); if (pickUp(ev, 'R14', 'bouquet_k10', 0.6, { after:'hold' })){ ev.sub = 1; ev.t0 = ev.t; } return false; }
    if (ev.sub === 1){ if (handOver(ev, 'R14', 'K10', 'bouquet_k10', ev.t0 + 0.4, { after:'hold' })){ ev.sub = 2; ev.t0 = ev.t; setAct(BYID.R14, 'nod', 0.3); } return false; }
    return ev.t - ev.t0 > 1.4; },
  miss(){ placeItem(ITEMS.bouquet_k10, { ...PL.FLOWERS_SHELF, name:'reserved shelf (not collected)' }); } });
// E07 (19:00–20:20): they meet at the corner; K10 steps half a step forward with the flowers, holds them out — and draws them back;
// words; K10 lays the flowers on the bench; each goes a different way. The flowers stay on the bench.
EV('E07', { win:['19:00', '20:45'], roles:['a', 'b'],
  run(ev){ const A = BYID.K09, B = BYID.K10, t = ev.t, it = ITEMS.bouquet_k10;
    A.w.yaw = yawTo(B.w.x - A.w.x, B.w.z - A.w.z); if (t < 11.5) B.w.yaw = yawTo(A.w.x - B.w.x, A.w.z - B.w.z);
    if (t < 1.5){ setAct(A, 'look', 0.5); setAct(B, 'hold', 0.5); }
    else if (t < 4.2){ setAct(B, 'give', 0.5); if (t < 2.6) B.w.x += (A.w.x + 0.75 - B.w.x)*0.03; setAct(A, 'look', 0.5); }       // half a step, the flowers held out
    else if (t < 5.4){ setAct(B, 'hold', 0.4); }                                                                                    // drawn back
    else if (t < 11.5){ setAct(A, t % 3 < 1.5 ? 'argue' : 'phone', 0.5); setAct(B, t % 3 < 1.5 ? 'look' : 'argue', 0.5); }
    else if (t < 13.2){ if (it.holder === 'K10'){ B.w.yaw = yawTo(0, 1); putDown(ev, 'K10', 'bouquet_k10', { ...PL.E07_BENCH_TOP }, 11.5); } setAct(A, 'away', 0.5); }
    else { setAct(A, 'away', 0.5); setAct(B, 'away', 0.5); }
    return t > 14.5; },
  end(){ const it = ITEMS.bouquet_k10; if (it.holder === 'K10') placeItem(it, { ...PL.E07_BENCH_TOP }); },
  miss(){ const it = ITEMS.bouquet_k10; if (it.holder === 'K10') placeItem(it, { ...PL.E07_BENCH_TOP }); } });
// E07B (from 20:20): K10 comes back on his own, picks the flowers up from the bench; EVASE (21:20): into the vase by his door
EV('E07B', { win:['21:00', '21:55'], roles:['b'], run(ev){ const it = ITEMS.bouquet_k10; if (!(it.place && it.place.name === 'meeting bench') && it.holder !== 'K10') return true;
    BYID.K10.w.yaw = yawTo(0, 1); if (ev.t < 1.5) setAct(BYID.K10, 'look', 0.5); return ev.t > 1.5 && pickUp(ev, 'K10', 'bouquet_k10', 1.5, { after:'hold' }) && ev.t > 4; } });
EV('EVASE', { win:['21:55', '23:05'], roles:['b'], run(ev){ if (ITEMS.bouquet_k10.holder !== 'K10') return true; BYID.K10.w.yaw = yawTo(0, -1);
    return putDown(ev, 'K10', 'bouquet_k10', { ...PL.H17_VASE_TOP }, 0.4) && ev.t > 2.4; } });
// batch 5 -------------------------------------------------------------------------------------------------------
// E13: R02 hands R01 the last two portions; R01 gives one to K01 on his bench
EV('E13A', { win:['12:00', '12:40'], roles:['giver', 'taker'], setup(){ holdItem(ITEMS.bread2, BYID.R02, 1); }, run(ev){ return handOver(ev, 'R02', 'R01', 'bread2', 0.4) && ev.t > 3.4; } });
EV('E13B', { win:['13:40', '14:10'], roles:['giver', 'taker'], setup(){ if (ITEMS.bread2.holder !== 'R01') holdItem(ITEMS.bread2, BYID.R01, 1); },
  run(ev){ const ok = handOver(ev, 'R01', 'K01', 'bread2', 0.4, { after:'idle' }); if (ok) setAct(BYID.R01, 'nod', 0.3); return ok && ev.t > 4; },
  end(){ if (ITEMS.bread2.holder === 'K01') placeItem(ITEMS.bread2, { x:0.85, y:G + 0.47, z:-9.3, name:'on the bench beside him' }); } });
// E03: the cat, under the bench, paws the ring out into the light; he looks down, picks it up; the phone goes into his pocket for the day
EV('E03', { win:['14:40', '16:15'], roles:['sitter'],
  run(ev){ const P = BYID.K01, it = ITEMS.ring_k01, t = ev.t, catNear = Math.hypot(CAT.x - 0.8, CAT.z + 9.9) < 0.9;
    if (!ev.sub){ if (catNear){ ev.sub = 1; ev.t0 = t; } return false; }
    if (ev.sub === 1){ const u = Math.min(1, (t - ev.t0)/3.6); CAT.paw = u < 1; it.m.position.set(0.55 + u*0.15, G + 0.005, -9.75 + u*1.15); if (u >= 1){ placeItem(it, { x:0.7, y:G + 0.005, z:-8.6, name:'by the bench, in the light' }); it.m.scale.set(0.9, 0.35, 2.2); ev.sub = 2; ev.t0 = t; } setAct(P, 'look', 0.5); return false; }
    if (ev.sub === 2){ setAct(P, 'reach', 0.4); if (t - ev.t0 > 2.2 && it.holder !== 'K01'){ holdItem(it, P, 0); ev.log.push([NOW, 'ring_k01', 'ground→K01']); P.ringDay = Math.floor(NOW/1440); if (P.hold.phone) putAway(P, 'phone'); ev.sub = 3; ev.t0 = t; } return false; }
    setAct(P, 'look', 0.6); return t - ev.t0 > 3; },
  miss(){} });
// E02: in the afternoon the white pigeon carries the red mitten down from the café eave to the dry spot by its door; at five the girl sees it,
// picks it up, and her father puts it on her hand
EV('E02', { win:['17:15', '19:15'], roles:['father', 'daughter'],
  run(ev){ const F = BYID.K03, K = BYID.K04, it = ITEMS.mitten_red, t = ev.t; if (!(it.place && it.place.name === 'by the café door') && it.holder !== 'K04' && it.holder !== 'K03') return t > 2;
    if (!ev.sub){ K.w.yaw = yawTo(0, -1); setAct(K, 'look', 0.4); if (t > 1.2 && pickUp(ev, 'K04', 'mitten_red', 1.2, { after:'hold' })){ ev.sub = 1; ev.t0 = t; } return false; }
    if (ev.sub === 1){ if (handOver(ev, 'K04', 'K03', 'mitten_red', ev.t0 + 0.3, { after:'hold' })){ ev.sub = 2; ev.t0 = t; } return false; }
    if (ev.sub === 2){ F.w.yaw = yawTo(K.w.x - F.w.x, K.w.z - F.w.z); setAct(F, 'crouch', 0.5); if (t - ev.t0 > 1.6 && it.holder === 'K03'){ holdItem(it, K, 1); ev.log.push([NOW, 'mitten_red', 'on her hand']); ev.sub = 3; ev.t0 = t; } return false; }
    setAct(F, 'look', 0.5); setAct(K, 'look', 0.5); return t - ev.t0 > 2; } });
// E12: a sheet of paper blows along the arcade, past the cat by the café and in front of the window; K07 draws it (it settles by the arcade's gate)
const PAPER_PATH = [[-31, -0.8], [-27.5, -1.6], [-24.5, -1.8], [-21.8, -1.0], [-19.0, -0.8], [-17.2, -0.4]];
EV('E12', { win:['14:05', '14:45'], roles:['drawer'],
  run(ev){ const it = ITEMS.paper_sheet, t = ev.t, u = Math.min(1, t/9), k = u*(PAPER_PATH.length - 1), i0 = Math.min(PAPER_PATH.length - 2, Math.floor(k)), f = k - i0, a = PAPER_PATH[i0], b = PAPER_PATH[i0 + 1];
    if (u < 1){ it.m.position.set(a[0] + (b[0] - a[0])*f, G + 0.25 + 0.55*Math.abs(Math.sin(t*1.7)), a[1] + (b[1] - a[1])*f); it.m.rotation.set(Math.sin(t*3)*0.6, t*1.4, Math.cos(t*2.3)*0.5); it.state = 'atPlace'; it.place = { name:'in the wind' }; ev.wind = true; }
    else if (ev.wind){ ev.wind = false; placeItem(it, { x:-17.2, y:G + 0.02, z:-0.4, name:'by the arcade gate' }); }
    const P = BYID.K07; if (t > 2) setAct(P, 'draw', 0.5); return t > 20; },
  end(){ ITEMS.paper_sheet.drawnDay = Math.floor(NOW/1440); } });
// E17: R19 brings oranges to grandma's door; grandma gives a tin of biscuits back
EV('E17', { win:['16:50', '17:30'], roles:['giver', 'taker'], setup(){ holdItem(ITEMS.oranges, BYID.R19, 1); holdItem(ITEMS.biscuits, BYID.K02, 0); },
  run(ev){ if (!ev.sub){ if (handOver(ev, 'R19', 'K02', 'oranges', 0.4, { after:'hold' })){ ev.sub = 1; ev.t0 = ev.t; } return false; }
    if (ev.sub === 1){ if (handOver(ev, 'K02', 'R19', 'biscuits', ev.t0 + 0.6, { after:'hold' })){ ev.sub = 2; ev.t0 = ev.t; setAct(BYID.R19, 'nod', 0.3); } return false; }
    return ev.t - ev.t0 > 1.8; },
  end(){ if (ITEMS.oranges.holder === 'K02') placeItem(ITEMS.oranges, { x:0, y:-50, z:0, hidden:true, name:"grandma's kitchen" }); } });
// batch 6 — E11: the night clerk leaves a warm drink at the store's door for the cleaner; the cleaner takes it on the round; the empty cup
// rides on the cart (her round ends at the plaza: set down by the bench). R04 leaves a meal for the night shift; at two she gives D22 the till's key.
EV('E11A', { win:['05:40', '06:05'], roles:['clerk'], setup(){ holdItem(ITEMS.drink_r20, BYID.R03, 1); },
  run(ev){ BYID.R03.w.yaw = yawTo(-1, 0); return putDown(ev, 'R03', 'drink_r20', { x:8.3, y:G + 0.02, z:45.3, name:'by the store door' }, 0.5) && ev.t > 2.4; } });
EV('E11B', { win:['06:05', '06:40'], roles:['cleaner'], run(ev){ const it = ITEMS.drink_r20; if (!(it.place && it.place.name === 'by the store door') && it.holder !== 'R20') return true;
    if (Math.hypot(BYID.R20.w.x - 8.3, BYID.R20.w.z - 45.3) > 1.3 && !ev.sub){ goTo(BYID.R20, 7.6, 45.1, 1/30); return false; } ev.sub = 1;
    return pickUp(ev, 'R20', 'drink_r20', 0.3, { after:'hold' }) && ev.t > 2.6; } });
EV('E11C', { win:['09:50', '11:20'], roles:['cleaner'], run(ev){ if (ITEMS.drink_r20.holder !== 'R20') return true; ITEMS.drink_r20.empty = true;
    return putDown(ev, 'R20', 'drink_r20', { x:0.9, y:G + 0.02, z:-8.0, name:'empty cup by the cleaning cart' }, 0.5) && ev.t > 2.4; } });
EV('R04M', { win:['13:30', '13:55'], roles:['clerk'], setup(){ holdItem(ITEMS.meal_r03, BYID.R04, 1); },
  run(ev){ BYID.R04.w.yaw = yawTo(-1, 0); return putDown(ev, 'R04', 'meal_r03', { x:8.4, y:G + 0.02, z:46.0, name:'for the night shift' }, 0.5) && ev.t > 2.2; } });
EV('R04H', { win:['14:00', '14:35'], roles:['giver', 'taker'], setup(){ holdItem(ITEMS.till_key, BYID.R04, 1); },
  run(ev){ const ok = handOver(ev, 'R04', 'D22', 'till_key', 0.4); if (ok) setAct(BYID.R04, 'nod', 0.3); return ok && ev.t > 3.6; },
  end(){ if (ITEMS.till_key.holder === 'D22') placeItem(ITEMS.till_key, { x:0, y:-50, z:0, hidden:true, name:'the till' }); } });
// E10 (02:15–02:45): the nurse at her own door at night, her own blanket on, an unopened bottle of water by her knee
EV('E10', { win:['02:15', '02:50'], roles:['nurse'], run(ev){ const P = BYID.K05; showComp(P.pp, 'blanket', true); P.seated = PL.H06_CHAIR; setAct(P, 'idle'); return ev.t > 6; },
  end(){ showComp(BYID.K05.pp, 'blanket', false); } });

// a person's part in an event: go to the slot, wait, play the part (the event drives the body), then stay until the next entry
function eventPart(P, e, pl, dt){ const ev = EVENTS[e.ev], w = P.w;
  if (pl && pl.room && !P.room){ // the event happens in the living room: in by the door
    const H = PL[P.def.room ? P.def.home : 'H01']; if (P.hidden) leaveHome(P, PL[P.def.home]);
    if (enterHome(P, { door:PL.H01.door }, dt)){ intoRoom(P, 'H01'); } return; }
  if (pl && pl.room){ if (P.stage !== 'do'){ if (roomGo(P, pl.x, pl.z, dt)){ P.ryaw = pl.yaw; P.stage = 'do'; arrive(P); if (pl.seat) P.seated = pl; } return; } }
  else if (P.stage === 'go'){ if (e.carry && ITEMS[carryId(e.carry)].holder !== P.id) holdItem(ITEMS[carryId(e.carry)], P, 1);
    if (e.ev === 'E01'){ if (!P.seated && !RAIN.on){ const [tx, tz] = approachOf(pl); if (goTo(P, tx, tz, dt)){ P.seated = pl; P.sitK = 0; P.stage = 'do'; arrive(P); } return; } }
    const [tx, tz] = approachOf(pl);
    if (P.hold.basket || ITEMS.bread_delivery.holder === P.id) setAct(P, 'carry');
    if (goTo(P, tx, tz, dt)){ P.stage = 'do'; arrive(P); if (pl.seat){ P.seated = pl; P.sitK = 0; } } return; }
  w.held = true; if (ev.state !== 'run' || !ev.drives) { w.yaw += wrapA(pl.yaw - w.yaw)*Math.min(1, dt*3); if (ev.state === 'idle' || ev.state === 'done') setAct(P, P.seated ? 'idle' : 'look'); }
  if (!P.room && pl && P.seated) { }
}
function eventsTick(dt){ const d = mod1440(NOW), day = Math.floor(NOW/1440);
  for (const ev of Object.values(EVENTS)){ const t0 = hm(ev.win[0]), t1 = hm(ev.win[1]);
    if (ev.day !== day && ev.state !== 'run'){ ev.state = 'idle'; ev.t = 0; ev.sub = 0; }
    if (ev.state === 'idle' && d >= t0 && d < t1){ const parts = PEOPLE.filter(P=>P.variant && P.variant.act === 'event' && P.variant.ev === ev.id);
      const ready = ev.roles.every(r=>parts.some(P=>P.variant.role === r && P.stage === 'do')) && (ev.need || []).every(id=>BYID[id].stage === 'do' && !BYID[id].hidden);
      if (ready){ ev.state = 'run'; ev.t = 0; ev.sub = 0; ev.day = day; ev.started = NOW; ev.drives = true; if (ev.setup) ev.setup(ev); ev.log.push([NOW, 'start']); } }
    if (ev.state === 'idle' && d >= t1 && ev.day !== day){ ev.day = day; ev.state = 'missed'; if (ev.miss) ev.miss(ev); ev.log.push([NOW, 'missed']); log('event missed', ev.id, 'day', day); }
    if (ev.state === 'run'){ ev.t += dt; let done = false; try { done = ev.run(ev); } catch (err){ log('event error', ev.id, err.message); done = true; }
      if (done || d >= t1 + 45){ ev.state = 'done'; ev.drives = false; ev.ended = NOW; if (ev.end) ev.end(ev); ev.log.push([NOW, 'done']); } } } }

/* ---------- animals' days ---------- */
const CAT = { id:'A01', ...makeCat(), x:-22.0, z:-15.8, y:G, yaw:0, moving:false, sp:1.0, goal:null, path:null, pj:0, lie:0 };
const DOG = { id:'A02', ...makeDog(), x:-55.8, z:-28.5, y:G, yaw:0, moving:false, lie:0, leash:null };
const PIGEONS = [0, 1, 2, 3, 4, 5, 6, 7].map(i=>({ id:'A' + String(3 + i).padStart(2, '0'), i, ...makePigeon(i), x:hash(i, 1)*4 - 2, z:6 + hash(i, 2)*2, y:G, yaw:hash(i, 3)*6, fly:0, sx:0, sz:0 }));
ANIMALS.push(CAT, DOG, ...PIGEONS);
// ---- batch 5 animals: the crow (A11), three ducks (A12–A14), five gulls (A15–A19); each a fixed individual with its own day ----
function makeBird(cs, s, duck){ const g = new THREE.Group(); g.userData.dyn = true; scene.add(g);
  if (duck){ animalBox(g, 0.42, 0.2, 0.26, cs[0], 0, 0.0, 0, 0.08); animalBox(g, 0.16, 0.08, 0.2, cs[1], -0.22, 0.1, 0, 0.03); }
  else { animalBox(g, 0.32, 0.18, 0.18, cs[0], 0, 0.06, 0, 0.05); animalBox(g, 0.16, 0.06, 0.22, cs[1], -0.19, 0.12, 0, 0.02); }
  const wings = [-1, 1].map(sd=>{ const w = new THREE.Group(); w.position.set(0, duck ? 0.14 : 0.18, sd*0.08); g.add(w); animalBox(w, 0.22, 0.03, 0.26, cs[1], 0, 0, sd*0.13, 0.01); w.visible = !duck; return w; });
  const head = new THREE.Group(); head.position.set(duck ? 0.22 : 0.18, duck ? 0.2 : 0.22, 0); g.add(head); animalBox(head, 0.13, 0.13, 0.12, cs[2], 0, -0.06, 0, 0.03); animalBox(head, 0.08, 0.035, 0.05, cs[3], 0.09, -0.03, 0, 0.01);
  g.scale.setScalar(s); return { g, head, wings }; }
const CROW = { id:'A11', ...makeBird(['#1e1c24', '#2a2832', '#1a1820', '#3a3a40'], 1.15), x:-46.5, z:-44.0, y:G + 3.1, yaw:0, fly:0, moving:false, state:'nest' };
const NEST = { x:-46.5, y:G + 3.05, z:-44.0 };
{ const pole = new THREE.Mesh(rbox(0.12, 3.0, 0.12, 0.03), matOf('#6a5a4a')); pole.position.set(NEST.x, G + 1.5, NEST.z); pole.castShadow = true; PROPS.add(pole);
  const nest = new THREE.Mesh(rbox(0.5, 0.14, 0.5, 0.07), matOf('#8a6a4a')); nest.position.set(NEST.x, NEST.y - 0.02, NEST.z); PROPS.add(nest);
  WORLD.addCollider({ cx:NEST.x, cz:NEST.z, ux:1, uz:0, hx:0.08, hz:0.08, y0:G, y1:G + 3, glass:false, owner:'nest pole', name:'nest pole' }); }
makeItem('blue_cap', 'chalk', { x:6.2, y:G + 0.01, z:9.4, name:'plaza (dropped)' }, '#3a6ad0'); ITEMS.blue_cap.m.scale.set(0.55, 0.6, 0.7);
const POND_C = { x:-23.58, z:44.01 }, STONE = { x:-20.6, z:45.2 };
{ const st = new THREE.Mesh(rbox(0.5, 0.18, 0.4, 0.08), matOf('#9a96a0')); st.position.set(STONE.x + 0.3, G + 0.04, STONE.z); PROPS.add(st); }
const DUCKS = [['A12', ['#f4f0e8', '#d8d0c0', '#3a8a5a', '#f49a3a'], 1.0], ['A13', ['#a8805a', '#8a6a4a', '#7a5a3a', '#f4a83a'], 0.88], ['A14', ['#e8e4dc', '#c8c0b0', '#3a6a8a', '#f49a3a'], 0.94]]
  .map(([id, cs, sc], i)=>({ id, i, ...makeBird(cs, sc, true), x:POND_C.x - 3.2, z:POND_C.z - 0.6 + i*0.6, y:G + 0.02, yaw:0, moving:false, home:[POND_C.x - 3.2 + (i % 2)*0.3, POND_C.z - 0.6 + i*0.6] }));
const GULLS = [15, 16, 17, 18, 19].map((n, i)=>({ id:'A' + n, i, ...makeBird([i % 2 ? '#f4f4f8' : '#ffffff', i === 3 ? '#5a5a66' : '#9aa0aa', '#ffffff', '#f4c83a'], 0.95 + (i % 3)*0.06), post:[78.4, -26.2 + i*1.5], x:78.4, z:-26.2 + i*1.5, y:G + 1.2, yaw:0, moving:false, fly:0, mode:'post', t:0 }));
ANIMALS.push(CROW, ...DUCKS, ...GULLS);
// who can be looked through, and with which lens (index's: cat/dog/bird)
const VIEW_ANIMALS = [{ id:'A01', A:CAT, vk:'cat' }, { id:'A02', A:DOG, vk:'dog' }, ...PIGEONS.map(B=>({ id:B.id, A:B, vk:'pigeon' })), { id:'A11', A:CROW, vk:'pigeon' }, ...DUCKS.map(D=>({ id:D.id, A:D, vk:'pigeon' })), ...GULLS.map(B=>({ id:B.id, A:B, vk:'pigeon' }))];
{ const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); DOG.leash = new THREE.Line(g, new THREE.LineBasicMaterial({ color:'#d83a4a' })); DOG.leash.frustumCulled = false; scene.add(DOG.leash); }
const CAT_DAY = [['00:00', 'sleep', -22.2, -15.9], ['05:00', 'walk', -26.5, -15.6], ['08:00', 'sun', -14.6, -4.8], ['11:00', 'sleep', -23.4, -15.9], ['13:50', 'sun', -21.8, -1.3], ['14:25', 'sit', 0.8, -9.9], ['16:20', 'sit', -18.6, -2.4], ['18:40', 'wait', -22.3, -15.75], ['19:35', 'walk', -17.5, -15.6], ['23:00', 'sleep', -22.2, -15.9]];
const AS = (C.TIMECFG && C.TIMECFG.animal) || 1;             // animals share the same setting
function animalMove(A, tx, tz, sp, dt, r = 0.18){ const dx = tx - A.x, dz = tz - A.z, d = Math.hypot(dx, dz); if (d < 0.2){ A.moving = false; return true; }
  const s = Math.min(d, sp*dt), body = { x:A.x, z:A.z, y:A.y, r }; WORLD.move(body, dx/d*s, dz/d*s, { dt }); const mv = Math.hypot(body.x - A.x, body.z - A.z);
  A.x = body.x; A.z = body.z; A.y = body.y; A.moving = mv > 1e-4; A.yaw = Math.atan2(dx, dz); if (mv < s*0.2){ A.stuck = (A.stuck || 0) + dt; } else A.stuck = 0; return false; }
function catTick(dt){ const d = mod1440(NOW); let k = 0; for (let i=0;i<CAT_DAY.length;i++) if (hm(CAT_DAY[i][0]) <= d) k = i; const [, what, tx0, tz0] = CAT_DAY[k];
  let tx = tx0, tz = tz0; if (EVENTS.E08.state === 'run' && EVENTS.E08.catFed){ tx = -22.1; tz = -15.75; }
  if (Math.hypot(tx - CAT.x, tz - CAT.z) > 0.3){ if (!CAT.goalK || CAT.goalK !== k + ',' + tx){ CAT.goalK = k + ',' + tx; CAT.path = WORLD.path(CAT.x, CAT.z, tx, tz); CAT.pj = 1; }
    const P = CAT.path; if (P && CAT.pj < P.length){ const q = P[CAT.pj]; if (animalMove(CAT, q.x, q.z, CAT.sp*AS, dt)) CAT.pj++; } else animalMove(CAT, tx, tz, CAT.sp*AS, dt); CAT.lie = Math.max(0, CAT.lie - dt*2); }
  else { CAT.moving = false; const eat = EVENTS.E08.state === 'run' && EVENTS.E08.catFed; CAT.lie = Math.min(1, CAT.lie + dt*(what === 'sleep' || what === 'sun' ? 0.8 : 0)); if (eat) CAT.yaw = Math.atan2(-22.1 - CAT.x + 0.0001, -15.35 - CAT.z); CAT.eat = eat; } }
function dogTick(dt){ const G2 = BYID.K02; let inRoom = G2.room === 'H01';
  if (inRoom){ DOG.room = true; const b = PL.H01_DOGBED, s = PL.H01_ARMCHAIR; const tx = G2.seated ? b.x : G2.rx - 0.7, tz = G2.seated ? b.z : G2.rz + 0.3; const dx = tx - DOG.x, dz = tz - DOG.z, d = Math.hypot(dx, dz);
    if (DOG.y > -30){ DOG.x = G2.rx; DOG.z = G2.rz; } DOG.y = ROOM.y0; if (d > 0.1){ DOG.x += dx/d*Math.min(d, 1.0*dt); DOG.z += dz/d*Math.min(d, 1.0*dt); DOG.yaw = Math.atan2(-dz, dx); DOG.moving = true; } else { DOG.moving = false; } DOG.lie = G2.seated && d < 0.2 ? Math.min(1, DOG.lie + dt) : 0; return; }
  if (DOG.room){ DOG.room = false; DOG.x = G2.w.x + 0.6; DOG.z = G2.w.z - 0.4; DOG.y = WORLD.floorAt(DOG.x, DOG.z); }
  if (G2.hidden){ DOG.moving = false; return; }
  const w = G2.w, c = Math.cos(w.yaw), s = Math.sin(w.yaw), tx = w.x + c*0.5 + s*0.75, tz = w.z - s*0.5 + c*0.75, d = Math.hypot(tx - DOG.x, tz - DOG.z);
  if (d > 0.25){ const body = { x:DOG.x, z:DOG.z, y:DOG.y, r:0.18 }, sp = Math.min(d, (d > 1.5 ? 1.6 : 1.0)*AS*dt); WORLD.move(body, (tx - DOG.x)/d*sp, (tz - DOG.z)/d*sp, { dt }); DOG.moving = Math.hypot(body.x - DOG.x, body.z - DOG.z) > 1e-4; DOG.yaw = Math.atan2(-(tz - DOG.z), tx - DOG.x); DOG.x = body.x; DOG.z = body.z; DOG.y = body.y; if (d > 6){ DOG.x = tx; DOG.z = tz; } }
  else { DOG.moving = false; DOG.yaw += wrapA(w.yaw - DOG.yaw)*Math.min(1, dt*2); }
  DOG.lie = !w.moving && G2.seated ? Math.min(1, DOG.lie + dt*0.7) : Math.max(0, DOG.lie - dt*3); }
// pigeons: on the plaza by day, onto the crumbs when there are some (the white one last, to the far ones), up onto the bakery roof at night
const ROOST = [[23.0, -6.5], [23.8, -6.8], [24.6, -6.4], [25.4, -6.9], [26.2, -6.6], [27.0, -6.5], [27.8, -6.8], [22.2, -6.7]];
function pigeonTick(dt){ const d = mod1440(NOW), night = d < hm('06:30') || d > hm('19:30'), feed = EVENTS.E01.state === 'run' || (EVENTS.E01.state === 'done' && NOW - (EVENTS.E01.ended || 0) < 40);   // (they stay on the crumbs a while: the white one's late meal can be seen)
  const base = EVENTS.E01.state === 'run' && EVENTS.E01.base ? EVENTS.E01.base : RAIN.on ? { x:17.6, z:0.6 } : { x:0, z:6.4 };
  const mit = ITEMS.mitten_red, W0 = PIGEONS[0];
  if (d >= hm('13:20') && d < hm('14:30') && !night && ((mit.place && mit.place.name === 'café eave') || mit.holder === 'A03')){   // E02, the pigeon's part
    const eave = { x:-21.6, y:G + 3.25, z:-4.7 }, door = { x:-21.0, y:G, z:-2.6 };
    if (mit.holder !== 'A03'){ if (birdFly(W0, { x:eave.x + 0.1, y:eave.y - 0.05, z:eave.z }, dt, 2.6)){ W0.carryT = (W0.carryT || 0) + dt; W0.peck = true; if (W0.carryT > 1.5){ mit.m.parent && mit.m.parent.remove(mit.m); W0.head.add(mit.m); mit.m.position.set(0.1, -0.12, 0); mit.m.scale.setScalar(0.9); mit.state = 'heldBy'; mit.holder = 'A03'; mit.place = null; mit.log.push([NOW, 'held', 'A03']); W0.carryT = 0; } } }
    else { W0.carry = true; if (birdFly(W0, { x:door.x, y:Math.max(door.y, W0.y - 0.5*dt), z:door.z }, dt, 0.7) && W0.y <= door.y + 0.02){ placeItem(mit, { ...door, y:G + 0.01, name:'by the café door' }); W0.carry = false; } } }
  PIGEONS.forEach(B=>{ if (B === W0 && (W0.carry || (mit.holder !== 'A03' && mit.place && mit.place.name === 'café eave' && d >= hm('13:20') && d < hm('14:30') && !night))) return;
    const roof = ROOST[B.i], up = night ? 1 : 0; B.fly += (up - B.fly)*0;
    if (night){ if (!B.roost){ B.flyT = 0; B.roost = true; B.from = [B.x, B.z, B.y]; } B.flyT = Math.min(1, (B.flyT || 0) + dt/2.5); const k = smooth(0, 1, B.flyT);
      B.x = lerp(B.from[0], roof[0], k); B.z = lerp(B.from[1], roof[1], k); B.y = lerp(B.from[2], 3.4 + G, k) + Math.sin(k*Math.PI)*2.5; B.moving = B.flyT < 1; B.yaw = Math.atan2(-(roof[1] - B.from[1]), roof[0] - B.from[0]); return; }
    if (B.roost){ B.flyT = Math.max(0, (B.flyT || 1) - dt/2.5); const k = smooth(0, 1, B.flyT); const gx = base.x + hash(B.i, 1)*3 - 1.5, gz = base.z + hash(B.i, 2)*1.6 - 0.8; B.x = lerp(gx, roof[0], k); B.z = lerp(gz, roof[1], k); B.y = lerp(WORLD.floorAt(gx, gz), 3.4 + G, k) + Math.sin(k*Math.PI)*2.5; if (B.flyT <= 0) B.roost = false; return; }
    // targets: a crumb (the white one waits, then takes a far one), or a wander point near the base
    let tx, tz; const tt = C.SIM.steps/30;
    if (feed && EVENTS.E01.crumbs && (B.i > 0 || EVENTS.E01.t > 6)){ const n = EVENTS.E01.crumbs; const ci = B.i === 0 ? Math.min(n - 1, 8) : (B.i*7) % n; const m = new THREE.Matrix4(); CRUMBS.getMatrixAt(ci, m); tx = m.elements[12] - 0.1; tz = m.elements[14]; }
    else { const k = Math.floor(tt/6 + B.i*0.7); tx = base.x + (hash(B.i*13 + k, 1) - 0.5)*4.5; tz = base.z + (hash(B.i*13 + k, 2) - 0.5)*2.2; }
    const dx = tx - B.x, dz = tz - B.z, dd = Math.hypot(dx, dz); B.y = WORLD.floorAt(B.x, B.z);
    if (dd > 0.15){ const s = Math.min(dd, 0.55*AS*dt); B.x += dx/dd*s; B.z += dz/dd*s; B.yaw = Math.atan2(-dz, dx); B.moving = true; } else { B.moving = false; B.peck = feed; } });
  if (EVENTS.E01.state === 'done' && CRUMBS.count > 0 && NOW - (EVENTS.E01.ended || 0) > 45){ CRUMBS.count = 0; } }
// the crow: on its pole by the tower; 10:40 it flies down to the plaza, takes the blue bottle cap (11:00), carries it back to the nest
const lerpF = (a, b, k) => a + (b - a)*k;
function birdFly(B, to, dt, sp = 3.2){ const dx = to.x - B.x, dz = to.z - B.z, dy = to.y - B.y, d = Math.hypot(dx, dz, dy); if (d < 0.08){ B.moving = false; B.flying = false; return true; }
  const s = Math.min(d, sp*AS*dt); B.x += dx/d*s; B.z += dz/d*s; B.y += dy/d*s; if (Math.hypot(dx, dz) > 0.05) B.yaw = Math.atan2(-dz, dx); B.moving = true; B.flying = true; return false; }
function crowTick(dt){ const d = mod1440(NOW), C2 = CROW, cap = ITEMS.blue_cap, day = Math.floor(NOW/1440);
  if (d < hm('05:00') && cap.holder !== 'A11' && cap.place && cap.place.name === 'crow nest' && C2.capDay !== day){ placeItem(cap, { x:6.2, y:G + 0.01, z:9.4, name:'plaza (dropped)' }); }   // (each morning another cap lies on the plaza)
  const at = { x:cap.m.position.x - 0.2, y:G, z:cap.m.position.z };
  if (d >= hm('10:30') && d < hm('11:50') && C2.capDay !== day){
    if (C2.state === 'nest' || C2.state === 'down'){ C2.state = 'down'; if (birdFly(C2, { x:at.x, y:at.y + Math.max(0, Math.hypot(at.x - C2.x, at.z - C2.z) > 3 ? 4 : 0), z:at.z }, dt, 6.5) && Math.abs(C2.y - G) < 0.1){ C2.state = 'ground'; C2.t = 0; } }
    else if (C2.state === 'ground'){ C2.t += dt; C2.peck = true; if (C2.t > 3 && cap.holder !== 'A11'){ cap.m.parent && cap.m.parent.remove(cap.m); C2.head.add(cap.m); cap.m.position.set(0.12, -0.05, 0); cap.m.scale.setScalar(1/C2.g.scale.x*0.6); cap.state = 'heldBy'; cap.holder = 'A11'; cap.place = null; cap.log.push([NOW, 'held', 'A11']); }
      if (C2.t > 5){ C2.state = 'up'; C2.peck = false; } }
    else if (C2.state === 'up'){ const mid = Math.hypot(NEST.x - C2.x, NEST.z - C2.z) > 2; if (birdFly(C2, { x:NEST.x, y:mid ? NEST.y + 2.5 : NEST.y, z:NEST.z }, dt, 6.5) && !mid){ placeItem(cap, { x:NEST.x + 0.08, y:NEST.y + 0.06, z:NEST.z, name:'crow nest' }); cap.m.scale.set(0.55, 0.6, 0.7); C2.capDay = day; C2.state = 'nest'; } } }
  else if (C2.state !== 'nest'){ if (birdFly(C2, NEST, dt)) C2.state = 'nest'; } }
// the ducks: twice a day the white one leads from the edge into the pond; the brown one falls behind and catches up; the blue-headed one goes to its stone
const DUCK_RUN = [hm('08:00'), hm('16:00')];
function duckTick(dt){ const d = mod1440(NOW), run = DUCK_RUN.find(t0=>d >= t0 && d < t0 + 60);
  DUCKS.forEach(D=>{ let tx = D.home[0], tz = D.home[1];
    if (run !== undefined){ const u = (d - run)/60, L0 = DUCKS[0];
      if (D.i === 0){ tx = lerpF(POND_C.x - 3.2, POND_C.x + 0.8, Math.min(1, u*2.5)); tz = POND_C.z + Math.sin(u*6)*0.3; D.stage = u < 0.4 ? 'lead' : 'stop'; }
      else if (D.i === 1){ const lag = u < 0.15 ? 0 : u < 0.4 ? 1.8 : Math.max(0, 1.8 - (u - 0.4)*8); tx = L0.x - 0.7 - lag; tz = L0.z + 0.5; D.lag = lag; }
      else { if (u < 0.2){ tx = L0.x - 0.9; tz = L0.z - 0.4; D.stage = 'follow'; } else if (u < 0.7){ tx = STONE.x - 0.25; tz = STONE.z; D.stage = Math.hypot(D.x - tx, D.z - tz) < 0.4 ? 'stone' : 'toStone'; } else { tx = L0.x - 0.6; tz = L0.z - 0.5; D.stage = 'back'; } } }
    else D.stage = 'rest';
    const dx = tx - D.x, dz = tz - D.z, dd = Math.hypot(dx, dz), sp = (D.i === 1 && D.lag > 1.5 ? 0.12 : D.i === 1 && D.lag !== undefined ? 0.45 : D.i === 2 ? 0.5 : 0.3)*AS;
    if (dd > 0.05){ const s = Math.min(dd, sp*dt); D.x += dx/dd*s; D.z += dz/dd*s; D.yaw = Math.atan2(-dz, dx); D.moving = true; } else D.moving = false; D.y = G + 0.02; }); }
// the gulls: each has its post on the pier rail; in turn (its own rhythm) it flies out to glide by the ferry, then comes back to the same post
function gullTick(dt){ const F = C.FERRY.position, tt = C.SIM.steps/30, d = mod1440(NOW), day = d > hm('06:00') && d < hm('19:30');
  GULLS.forEach(B=>{ const cyc = (tt + B.i*13) % 70, follow = day && cyc < 30; B.mode = follow ? 'follow' : 'post';
    if (follow){ const a = tt*0.6 + B.i*1.3; birdFly(B, { x:F.x - 4 + Math.cos(a)*5, y:G + 5 + B.i*0.6 + Math.sin(a*1.7)*0.6, z:F.z + Math.sin(a)*5 }, dt, 9); }
    else { const p = B.post, far = Math.hypot(p[0] - B.x, p[1] - B.z) > 2.5; if (birdFly(B, { x:p[0], y:far ? G + 4 : G + 1.2, z:p[1] }, dt, 8) && !far) { B.yaw = Math.PI; B.atPostT = (B.atPostT || 0) + dt; } else B.atPostT = 0; }
    B.near = Math.hypot(F.x - B.x, F.z - B.z); }); }
function poseAnimals(t, dt){
  [CROW, ...DUCKS, ...GULLS].forEach(B=>{ B.g.position.set(B.x, B.y, B.z); B.g.rotation.y = B.yaw; const fl = B.flying ? Math.sin(t*(B === CROW ? 10 : 7) + (B.i || 0))*0.7 : 0;
    B.wings.forEach((w, k)=>{ w.rotation.x = (k ? 1 : -1)*fl; }); B.head.rotation.z = B.peck ? -0.5 + Math.sin(t*6)*0.4 : 0; });
  // cat: lying squashes it, the tail sways, head down to the bowl
  CAT.g.position.set(CAT.x, CAT.y, CAT.z); CAT.g.rotation.y = CAT.yaw; CAT.g.scale.set(CAT.s, CAT.s*(1 - 0.25*CAT.lie), CAT.s*(1 + 0.05*CAT.lie)); CAT.tail.rotation.y = Math.sin(t*2)*0.4; CAT.head.rotation.x = CAT.eat ? 0.5 + Math.sin(t*6)*0.1 : CAT.lie*0.3;
  CAT.g.position.y += CAT.moving ? Math.abs(Math.sin(t*10))*0.02 : 0; if (CAT.paw) CAT.head.rotation.x = 0.6 + Math.sin(t*9)*0.25;
  DOG.g.position.set(DOG.x, DOG.y + (DOG.moving ? Math.abs(Math.sin(t*12))*0.03 : 0) - DOG.lie*0.1, DOG.z); DOG.g.rotation.y = DOG.yaw; DOG.tail.rotation.y = Math.sin(t*(DOG.moving ? 14 : 5))*0.5;
  DOG.legs.forEach((l, i)=>{ l.rotation.z = DOG.moving ? Math.sin(t*12 + (i%2 ? 0 : Math.PI) + (i > 1 ? Math.PI : 0))*0.5 : 0; l.scale.y = 1 - DOG.lie*0.6; });
  // the lead: from the collar to grandma's left hand
  const G2 = BYID.K02, on = !G2.hidden && !G2.room && !DOG.room && !G2.seated && G2.pp.g.visible; DOG.leash.visible = on;
  if (on){ const a = DOG.g.localToWorld(new THREE.Vector3(0.22, 0.38, 0)), b2 = G2.pp.hands[0].getWorldPosition(new THREE.Vector3()); if (!isFinite(a.x + b2.x)) return; const p = DOG.leash.geometry.attributes.position; p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b2.x, b2.y, b2.z); p.needsUpdate = true; }
  PIGEONS.forEach(B=>{ B.g.position.set(B.x, B.y, B.z); B.g.rotation.y = B.yaw; B.head.position.x = 0.17 + (B.moving ? Math.max(0, Math.sin(t*9 + B.i))*0.05 : 0); B.head.rotation.z = B.peck && !B.moving ? -0.6 + Math.sin(t*5 + B.i)*0.5 : 0; });
}

/* ---------- posing the people ---------- */
const _v = new THREE.Vector3();
function posePerson(P, t, dt){ const pp = P.pp, w = P.w, act = P.act ? ACTS[P.act] : null;
  if (P.hidden){ pp.g.visible = false; return; }
  pp.g.visible = true;
  if (P.room){ const sat = !!P.seated; if (sat){ C.sitPose(pp); const s = P.seated; pp.g.position.set(s.x - Math.cos(s.yaw)*0.08, ROOM.y0 + (s.top || 0.45) + 0.06 - pp.LL*pp.S, s.z + Math.sin(s.yaw)*0.08); pp.g.rotation.y = s.yaw; }
    else { C.walkPose(pp, P.rx, P.rz, P.ryaw, !!pp.walking, t, dt, ROOM.y0); pp.walking = false; } w.x = pp.g.position.x; w.z = pp.g.position.z; w.y = pp.g.position.y; }
  else if (P.driving){ C.sitPose(pp); const s = carSeatWorld(); pp.g.position.set(s.x, s.y + 0.06 - pp.LL*pp.S, s.z); pp.g.rotation.y = R22CAR.g.rotation.y; }
  else if (w.ride){ const TC = C.TC, ly = w.sit ? TC.floor + 0.46 + 0.04 - pp.LL*pp.S : TC.floor, p = C.tramWorld(w.ride.lx, ly, w.ride.lz), yaw = C.TRAM.rotation.y;
    if (w.sit){ C.sitPose(pp); pp.g.position.copy(p); pp.g.rotation.y = yaw + (w.sit.face > 0 ? 0 : Math.PI); w.x = p.x; w.z = p.z; w.y = p.y; }
    else { w.x = p.x; w.z = p.z; w.y = p.y; C.walkPose(pp, p.x, p.z, w.yaw, w.moving, t, dt, p.y); } }
  else if (P.seated && !P.room){ const s = P.seated, ap = approachOf(s); P.sitK = Math.min(1, (P.sitK ?? 1) + dt/0.6); let k = P.standUp > 0 ? smooth(0, 0.6, P.standUp) : smooth(0, 1, P.sitK);
    if (k > 0.35) C.sitPose(pp); else C.walkPose(pp, ap[0], ap[1], s.yaw, false, t, dt, w.y);
    const gx = s.x - Math.cos(s.yaw)*0.08, gz = s.z + Math.sin(s.yaw)*0.08, fy = WORLD.floorAt(ap[0], ap[1]);
    pp.g.position.set(lerp(ap[0], gx, k), lerp(fy, G + (s.top || 0.47) + 0.06 - pp.LL*pp.S + (WORLD.floorAt(s.x, s.z) - G), k), lerp(ap[1], gz, k)); pp.g.rotation.y = s.yaw;
    w.x = ap[0]; w.z = ap[1]; w.y = fy; w.yaw = s.yaw; }
  else C.walkPose(pp, w.x, w.z, w.yaw, w.moving, t, dt, w.y);
  // crouching (setting down the cat's bowl): the knees bend and the body goes down
  if (P.act === 'crouch' && !P.seated){ const k = P.actK; pp.g.position.y -= 0.32*k; for (let i=0;i<2;i++){ pp.legs[i].rotation.z = 1.2*k; pp.shins[i].rotation.z = -1.7*k; pp.feet[i].rotation.z = 0.5*k; } }
  // the action layer over the arms, the lean and the head
  if (act){ const k = P.actK, A = act(P.actT, P, k); const sw = w.moving ? 0.35 : 1;
    pp.arms[0].rotation.z = lerp(pp.arms[0].rotation.z, A[0], k*sw); pp.fores[0].rotation.z = lerp(pp.fores[0].rotation.z, A[1], k*sw);
    pp.arms[1].rotation.z = lerp(pp.arms[1].rotation.z, A[2], k); pp.fores[1].rotation.z = lerp(pp.fores[1].rotation.z, A[3], k);
    pp.up.rotation.z = lerp(-pp.hunch, -pp.hunch + A[4], k); pp.head.rotation.z = lerp(0, A[5], k); pp.head.rotation.y = lerp(0, A[6], k); }
  else { pp.up.rotation.z = -pp.hunch; pp.head.rotation.z *= 0.9; pp.head.rotation.y *= 0.9; }
  // a held cup or basket keeps the arm in front (no swinging it); the cane hand keeps the cane down
  if (!P.act && Object.keys(P.hold).length && w.moving){ pp.arms[1].rotation.z = 0.45; pp.fores[1].rotation.z = 1.1; }
  // the umbrella: opened under open sky in the rain (it takes half a second), closed under a roof
  const want = RAIN.on && UMB_OK(P) && !covered(w.x, w.z, w.y + 2.3) ? 1 : 0; P.umbK += (want - P.umbK)*Math.min(1, dt*3);
  pp.umb.visible = P.umbK > 0.02; pp.umb.scale.set(0.25 + 0.75*P.umbK, 1, 0.25 + 0.75*P.umbK);
  if (P.umbK > 0.3 && !act && !Object.keys(P.hold).length){ pp.arms[1].rotation.z = 0.35; pp.fores[1].rotation.z = 1.5; }
  showComp(pp, 'raincoat', RAIN.on && P.id === 'R22' && pp.outfit === 'work');
}

/* ---------- placing everyone where their day has them at the start (a test instance may start at any hour) ---------- */
function placeAll(){ NOW = C.worldMin(); RAIN.on = WX.W.cur.rain > 0.35; const d = mod1440(NOW);
  // (also used by the developer's time jumps: everyone is first taken out of whatever they were in the middle of)
  PEOPLE.forEach(P=>{ const w = P.w; P.room = null; P.hidden = false; P.hiddenAt = null; P.seated = null; P.driving = false; P.standUp = 0; P.sub = 0; P.act = null; P.arrived = -1; P.goal = null;
    w.hidden = false; w.inside = null; w.ride = null; w.sit = null; w.path = null; P.pp.g.visible = true; showComp(P.pp, 'blanket', false); });
  DOG.room = false; CRUMBS.count = 0; parkCar('CARPARK');
  Object.values(EVENTS).forEach(ev=>{ ev.state = 'idle'; ev.day = -1; ev.t = 0; ev.sub = 0; });
  PEOPLE.forEach(P=>{ const idx = activeIndex(P, NOW); const it = P.plan[idx]; startEntry(P, idx, true); const e = P.variant, w = P.w;
    // between the departure and the arrival: somewhere on the way (the fraction of the path); otherwise at the place
    const prev = P.plan[(idx - 1 + P.plan.length) % P.plan.length], a = outsideOf(placeOf(P, prev.e)), b = outsideOf(placeOf(P, e)) || a;
    let dep = it.dep, arr = it.t; if (dep > d) { dep -= 1440; arr -= 1440; } const f = it.travelSec > 0 ? clamp((d - dep)/Math.max(1, arr - dep - 6), 0, 1) : 1;
    const setAt = (x, z) => { w.x = x; w.z = z; w.y = WORLD.floorAt(x, z); w.path = null; };
    if (['home', 'shell', 'off'].includes(e.act) && f >= 1){ if (e.act === 'home' && P.def.room){ intoRoom(P, P.def.room); const s = PL[e.spot || 'H01_ARMCHAIR']; P.rx = s.x; P.rz = s.z; P.ryaw = s.yaw; if (s.seat) P.seated = s; }
      else { const H = e.act === 'home' ? PL[P.def.home] : pl0(e) || PL.PIER; setAt(H ? (H.door ? H.door.front[0] : H.x) : 0, H ? (H.door ? H.door.front[1] : H.z) : 0); hide(P, e.act === 'off' ? 'off' : (e.at || P.def.home)); }
      setOutfit(P.pp, e.outfit || (e.act === 'home' ? 'home' : P.pp.outfit)); P.stage = 'do'; P.arrived = P.cur; return; }
    if (e.act === 'tram' || e.act === 'drive' || e.follow && P.id === 'K04'){ /* they start where the last part ended */ }
    if (P.visitor && (prev.e.act === 'off') && f < 1 && e.enterFrom){ }
    const outfitNow = e.outfit || prev.e.outfit; if (outfitNow && outfitNow !== 'home') setOutfit(P.pp, outfitNow); else if (!e.outfit && P.pp.outfit === 'home' && !['home'].includes(e.act)) setOutfit(P.pp, P.def.look.outfits.work && ['work', 'event'].includes(e.act) ? 'work' : 'casual');
    if (P.def.visitor && d < hm('09:00')){ hide(P, 'off'); return; }
    const pth = a && b ? WORLD.path(a.x, a.z, b.x, b.z) : null;
    if (f < 1 && pth && pth.length > 1 && e.act !== 'tram' && e.act !== 'drive'){ let L = 0; const seg = []; for (let i=1;i<pth.length;i++){ const l = Math.hypot(pth[i].x - pth[i-1].x, pth[i].z - pth[i-1].z); seg.push(l); L += l; }
      let want = L*f; for (let i=1;i<pth.length;i++){ if (want <= seg[i-1]){ const q0 = pth[i-1], q1 = pth[i], u = want/seg[i-1]; setAt(q0.x + (q1.x - q0.x)*u, q0.z + (q1.z - q0.z)*u); w.yaw = Math.atan2(-(q1.z - q0.z), q1.x - q0.x); break; } want -= seg[i-1]; } return; }
    if (e.act === 'drive'){ setAt(DRIVE.carStand.x, DRIVE.carStand.z - (e.to === 'CARPARK' ? 0 : 0)); if (e.to === 'CARPARK'){ parkCar('HARBOUR_PARK'); const dw = carDoorWorld(); setAt(dw.x, dw.z); } return; }
    if (e.act === 'tram'){ const wp = PL[e.wait]; setAt(wp.x, wp.z); P.sub = 1; return; }
    const pl = pl0(e) || b; if (!pl) return; if (pl.room){ intoRoom(P, 'H01'); P.rx = pl.x; P.rz = pl.z; P.ryaw = pl.yaw; if (pl.seat) P.seated = pl; P.stage = 'do'; return; }
    if (e.follow){ const L2 = BYID[e.follow]; setAt(L2.w.x - 0.8, L2.w.z + 0.6); return; }
    const [sx, sz] = approachOf(pl); setAt(sx, sz); P.sitK = 1; w.yaw = pl.yaw; P.stage = 'do'; P.arrived = P.cur; if (pl.seat) P.seated = pl; if (e.hold) takeOut(P, e.hold); });
  { const R = BYID.R22, e = R.variant; if (e && (e.at === 'HARBOUR_CRATES' || (e.act === 'drive' && e.to === 'CARPARK'))) parkCar('HARBOUR_PARK'); }
  // the items: where the day has them by this hour (a test instance starting late finds the bread already at the café)
  if (d >= hm('07:55') && d < hm('18:30')) placeItem(ITEMS.bread_delivery, { ...PL.CAFE_COUNTER_TOP2, name:'cafe counter' });
  if (d >= hm('09:45') && d < hm('16:20')) placeItem(ITEMS.cup_k07, { ...PL.K07_TABLE_TOP, name:'window table' });
  if (d >= hm('02:30') || d < hm('01:00')){ ITEMS.mitten_blue.mended = true; ITEMS.mitten_blue.m.userData.stitch.visible = true; }       // mended last night
  if (d >= hm('13:05') && d < hm('15:30') && ITEMS.mitten_blue.mended) holdItem(ITEMS.mitten_blue, BYID.R15, 1);     // taken out at 12:50, on its way to school
  if (d >= hm('15:20') && d < hm('24:00')) { const it = ITEMS.mitten_blue; if (d >= hm('15:30')){ placeItem(it, { x:0, y:-50, z:0, hidden:true, name:'R06 (taken home)' }); it.holder = 'R06'; it.state = 'heldBy'; } }
  if (d >= hm('15:55') || d < hm('09:00')) placeItem(ITEMS.drawing, { ...PL.EMPTY_SLOT, name:'door slot' });
  if (d >= hm('14:30') && d < hm('19:15')) placeItem(ITEMS.mitten_red, { x:-21.0, y:G + 0.01, z:-2.6, name:'by the café door' });
  if (d >= hm('15:40') || d < hm('04:00')){ holdItem(ITEMS.ring_k01, BYID.K01, 0); BYID.K01.ringDay = Math.floor(NOW/1440); }
  { const it = ITEMS.bouquet_k10; if (d >= hm('17:40') && d < hm('20:45')) holdItem(it, BYID.K10, 1); else if (d >= hm('20:45') && d < hm('21:55')) placeItem(it, { ...PL.E07_BENCH_TOP }); else if (d >= hm('23:05') || d < hm('17:00')) placeItem(it, { ...PL.H17_VASE_TOP }); }
  // events that already happened today count as done (they are not replayed)
  Object.values(EVENTS).forEach(ev=>{ if (d > hm(ev.win[1])){ ev.day = Math.floor(NOW/1440); ev.state = 'done'; } });
  PEOPLE.forEach(P=>posePerson(P, 0, 0.016)); }
const pl0 = (e) => e.at ? PL[e.at] : null;

/* ---------- the minute step ---------- */
let simT = 0;
function tick(dt){ NOW = C.worldMin(); simT += dt;
  const r = WX.W.cur.rain, want = RAIN.on ? r > 0.2 : r > 0.35; if (want !== RAIN.on){ RAIN.cand = (RAIN.cand || 0) + dt; if (RAIN.cand > 2){ RAIN.on = want; RAIN.t = 0; RAIN.cand = 0; } } else RAIN.cand = 0; RAIN.t += dt;
  eventsTick(dt);
  for (const P of PEOPLE){ try { personTick(P, dt); } catch (err){ log('tick error', P.id, err.message, (err.stack || '').split('\n')[1]); } doAct(P, dt); }
  catTick(dt); dogTick(dt); pigeonTick(dt); crowTick(dt); duckTick(dt); gullTick(dt);
  // the glove's round: once the boy has it at home (he is in the living room at night), it is his; the next day's lost glove is another
  // lost thing in the box — the loop of phase 1 (see the report) — put back at 01:00 while the boy sleeps
  const d = mod1440(NOW); const it = ITEMS.mitten_blue;
  if (d >= hm('01:00') && d < hm('01:05') && it.holder === 'R06' && BYID.R06.room){ placeItem(it, { ...PL.LOST_BOX, y:PL.LOST_BOX.y + 0.02, name:'lost box' }); it.mended = false; it.m.userData.stitch.visible = false; }
  if (d >= hm('04:00') && d < hm('04:05')){ placeItem(ITEMS.ring_k01, { x:0.55, y:G + 0.005, z:-9.75, name:'under the bench' }); ITEMS.ring_k01.m.scale.set(0.9, 0.35, 2.2);
    if (!(ITEMS.mitten_red.place && ITEMS.mitten_red.place.name === 'café eave')) placeItem(ITEMS.mitten_red, { x:-21.6, y:G + 3.25, z:-4.7, name:'café eave' }); placeItem(ITEMS.paper_sheet, { x:-31, y:G + 0.02, z:-0.8, name:'arcade (blown in)' }); }
  if (d >= hm('03:00') && d < hm('03:05') && ITEMS.bread_delivery.holder == null && BYID.R02.hidden && BYID.K06.hidden){ placeItem(ITEMS.bread_delivery, { x:25.4, y:G + 1.01, z:-7.95, name:'bakery counter' }); }
  if (ITEMS.blanket_h01.holder === 'K02' && BYID.K02.room && BYID.K02.seated && EVENTS.E06.state !== 'run'){ showComp(BYID.K02.pp, 'blanket', false); placeItem(ITEMS.blanket_h01, { ...PL.H01_ARMCHAIR_TOP, name:'armchair' }); }
  if (ITEMS.water_k05.holder === 'K02' && EVENTS.E06.state === 'done'){ placeItem(ITEMS.water_k05, BYID.K02.room ? { ...PL.H01_TABLE_TOP, name:'side table' } : { x:PL.H01_CHAIR_W.x + 0.3, y:G, z:PL.H01_CHAIR_W.z + 0.3, name:'by her chair' }); }
  if (ITEMS.water_k05.place && ITEMS.water_k05.place.name === 'by her chair' && BYID.K02.room) placeItem(ITEMS.water_k05, { ...PL.H01_TABLE_TOP, name:'side table' });
  if (d >= hm('12:00') && d < hm('12:05') && ITEMS.water_k05.holder !== 'K05' && !ITEMS.water_k05.m.visible === false) {}
  if (d >= hm('15:30') && d < hm('15:35') && ITEMS.water_k05.holder !== 'K05' && BYID.K05.stage !== 'do'){ /* a fresh bottle in her bag for the visit */ placeItem(ITEMS.water_k05, { x:0, y:-50, z:0, hidden:true, name:'care bag' }); }
}
function pose(dt){ const t = C.SIM.steps/30; PEOPLE.forEach(P=>{ try { posePerson(P, t, dt); } catch (err){ log('pose error', P.id, err.message); } }); poseAnimals(t, dt); }

DAYS = days(); k04();
{ const ins = (id, t, e, back) => { const D0 = DAYS[id]; let cur = null; D0.forEach(([tt, x])=>{ if (hm(tt) <= hm(t)) cur = x; }); D0.push([t, e]); if (back && cur) D0.push([back, { ...cur, outfit:undefined }]); D0.sort((a, b)=>hm(a[0]) - hm(b[0])); };
  ins('R02', '12:00', { act:'event', ev:'E13A', role:'giver', at:'BAKERY_DOOR_OUT' }, '12:30');
  ins('D22', '14:00', { act:'event', ev:'R04H', role:'taker', at:'STORE_COUNTER', outfit:'work' }, '14:30');
  ins('K01', '13:40', { act:'event', ev:'E13B', role:'taker', at:'PLAZA_N' }, '14:05');
  ins('K01', '14:40', { act:'event', ev:'E03', role:'sitter', at:'PLAZA_N' }, '16:15');
  ins('K02', '16:50', { act:'event', ev:'E17', role:'taker', at:'H01_STEP', outfit:'casual' }, null);
  ins('K07', '14:05', { act:'event', ev:'E12', role:'drawer', at:'K07_SEAT' }, '14:40');
  // father and daughter: from the empty house by the café door (the red mitten) to the station
  DAYS.K03.push(['17:15', { act:'event', ev:'E02', role:'father', at:'CAFE_DOOR_K' }]); DAYS.K03.sort((a, b)=>hm(a[0]) - hm(b[0])); k04();
  DAYS.K04 = DAYS.K04.map(([t, e])=>e.ev === 'E02' ? [t, { ...e, role:'daughter', at:'CAFE_DOOR_F', follow:undefined }] : [t, e]); }
compile();
C.HOOK.tick = tick; C.HOOK.pose = pose; C.HOOK.holdTram = boarding;
C.HOOK.movers = () => [...PEOPLE.map(P=>P.pp.g), CAT.g, DOG.g, ...PIGEONS.map(B=>B.g), R22CAR.g];
WX.patchScene(PROPS); PEOPLE.forEach(P=>WX.patchScene(P.pp.g)); WX.patchScene(ROOM.g);
placeAll();

// what the developer's read-only window shows
function info(){ const d = mod1440(NOW), hh = String(Math.floor(d/60)).padStart(2, '0') + ':' + String(Math.floor(d % 60)).padStart(2, '0');
  return { time:hh, day:Math.floor(NOW/1440), rain:RAIN.on, people:PEOPLE.map(P=>({ id:P.id, name:P.def.name, act:P.variant && P.variant.act, at:P.variant && (P.variant.at || P.variant.ev || ''), stage:P.stage, sub:P.sub, hidden:P.hidden, room:P.room, outfit:P.pp.outfit, x:+P.w.x.toFixed(1), z:+P.w.z.toFixed(1), act2:P.act, holds:Object.keys(P.hold), ride:!!P.w.ride, driving:!!P.driving })),
    events:Object.values(EVENTS).map(ev=>({ id:ev.id, state:ev.state, day:ev.day, log:ev.log.slice(-6) })), items:Object.values(ITEMS).map(it=>({ id:it.id, state:it.state, holder:it.holder, place:it.place && it.place.name, mended:it.mended })), log:LOG.slice(-30) }; }
return { buildPersonX, CAST, PEOPLE, BYID, ANIMALS, VIEW_ANIMALS, CROW, DUCKS, GULLS, NEST, STONE, POND_C, CAT, DOG, PIGEONS, CRUMBS, ITEMS, EVENTS, PL, ROOM, R22CAR, DRIVE, COMPILED, RAIN, LOG, info, setOutfit, showComp, hash, nowMin, placeAll };
}
