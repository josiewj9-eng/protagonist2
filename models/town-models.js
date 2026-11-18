/* =====================================================================
   Shared town models — the shapes from index.html, built in local coordinates so any page can place them.

   Every builder takes the page's own helper kit (so a model is made of exactly the same boxes, walls,
   windows, doors, textures and colour treatment as the page it lives in) and a placement:
     buildX(kit, { x, z, rot })
   Local frame: the origin is the centre of the footprint on the ground; the shop front faces +z.
   rot turns the model about y (0: front faces +z / south, Math.PI: north, Math.PI/2: east, -Math.PI/2: west).

   Only the outside and what can be seen through the glass is built here — no interactive parts,
   no sounds, no people, no lights that cast. index.html does not use this file yet (phase 1):
   its own code is the reference these models were measured against.

   kit = { THREE, G, TEX, ICON, building, bb, box, wall, glass, doorOn, plane, texFor, plain, seal, jhouse, bulbMat, group, dreamC }
   ===================================================================== */

// footprints in metres (width along the front × depth); side: extra room a model needs on its local +x side (an outside stair)
export const FOOTPRINT = {
  bakery:  { w:9.0,  d:9.5 },
  laundry: { w:8.0,  d:9.5, side:1.3 },
  flowers: { w:6.5,  d:9.5 },
  cafe:    { w:5.5,  d:9.5 },
  store:   { w:13.0, d:9.5 },
  b3:      { w:7.0,  d:9.5 },
};

// small things shared by several models, built into a parent group in its own coordinates
function chairIn(kit, parent, x, z, rot, col = '#d8a8b8'){ const { box, group, G } = kit; const c = group(parent, x, G, z); c.rotation.y = rot;
  box(c, 0.42,0.05,0.42, col, 0,0.45,0, 'world', { round:0.04 }); box(c, 0.42,0.45,0.05, col, 0,0.5,-0.19, 'world', { round:0.03 });
  [[-0.18,-0.18],[0.18,-0.18],[-0.18,0.18],[0.18,0.18]].forEach(([a,b])=>box(c, 0.04,0.45,0.04, '#5a5470', a,0,b)); return c; }
function tableIn(kit, parent, x, z, r = 0.4, col = '#c8a090', h = 0.72){ const { box, G } = kit;
  box(parent, r*2,0.05,r*2, col, x,G+h,z, 'world', { round:0.08 }); box(parent, 0.08,h,0.08, '#5a5470', x,G,z); box(parent, 0.44,0.04,0.44, '#5a5470', x,G,z); }
function benchIn(kit, parent, x, z, rot, col = '#d8a8b8'){ const { box, group, G } = kit; const b = group(parent, x, G, z); b.rotation.y = rot;
  box(b, 1.5, 0.08, 0.42, col, 0, 0.42, 0, 'world', { round:0.03 }); box(b, 1.5, 0.36, 0.06, col, 0, 0.5, -0.2, 'world', { round:0.02 }); [-0.62, 0.62].forEach(a=>box(b, 0.08, 0.42, 0.36, '#5a5470', a, 0, 0)); return b; }
function plantIn(kit, parent, x, z, s = 0.35, potC = '#d8a8b8'){ const { box, group, G } = kit; const p = group(parent, x, G, z);
  box(p, s*1.3, s*1.3, s*1.3, potC, 0, 0, 0, 'world', { round:0.08 });
  [[0, s*1.3, 0, s*1.6, s*2.2],[s*0.4, s*2.4, s*0.2, s*1.0, s*1.2],[-s*0.4, s*2.2, -s*0.3, s*1.0, s*1.3]].forEach(([px,py,pz,w,h])=>box(p, w, h, w, '#a8d0a8', px, py, pz, 'world', { round:Math.min(w,h)*0.4 })); return p; }
function vendingIn(kit, parent, x, z, rot, col){ const { box, group, G, THREE } = kit; const v = group(parent, x, G, z); v.rotation.y = rot;
  box(v, 1.0, 1.85, 0.8, col, 0, 0, 0, 'world', { round:0.05 }); const p = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.9, 0.04), new THREE.MeshBasicMaterial({ color:'#e8f4ff' })); p.position.set(0, 1.25, 0.41); v.add(p);
  const C = ['#ff9ec4','#9ec8f4','#c8f4dc','#f4e49e','#d8b4f4','#f4b49e']; for (let r=0;r<3;r++) for (let c=0;c<5;c++) box(v, 0.1, 0.18, 0.04, C[(r+c)%6], -0.3+c*0.15, 0.88+r*0.27, 0.42);
  box(v, 0.3, 0.12, 0.05, '#3a3448', 0.25, 0.5, 0.41); box(v, 0.6, 0.18, 0.1, '#3a3448', 0, 0.2, 0.41); return v; }
function potsIn(kit, parent, x, z, n, along = 'x'){ const { box, G } = kit; const C = ['#e4c0cc','#c8d8e8','#f4e4c8','#d8c8e8'], L = ['#9ad0a8','#b4d8c0','#f4a8c8','#c8e0b8'];
  for (let i=0;i<n;i++){ const px = along === 'x' ? x + i*0.5 : x, pz = along === 'x' ? z : z + i*0.5; box(parent, 0.36,0.32,0.36, C[i%4], px,G,pz, 'world', { round:0.08 }); box(parent, 0.42,0.42 + (i%3)*0.12,0.42, L[(i+1)%4], px,G+0.32,pz, 'world', { round:0.18 }); } }
function bikeIn(kit, parent, x, z, rot, col = '#8aa0c8'){ const { box, group, G, THREE, dreamC } = kit; const b = group(parent, x, G, z); b.rotation.y = rot;
  [-0.5,0.5].forEach(px=>{ const w = new THREE.Mesh(new THREE.TorusGeometry(0.32,0.03,5,14), new THREE.MeshLambertMaterial({ color:dreamC('#3a3448') })); w.position.set(px,0.34,0); b.add(w); });
  box(b, 1.0, 0.05, 0.05, col, 0, 0.55, 0); box(b, 0.05, 0.45, 0.05, col, -0.15, 0.4, 0); box(b, 0.05, 0.5, 0.05, col, 0.45, 0.45, 0); box(b, 0.05, 0.05, 0.45, '#3a3448', 0.45, 0.95, 0); box(b, 0.22, 0.06, 0.12, '#3a3448', -0.15, 0.86, 0); return b; }

// index's jhouse() takes a world rectangle and a front side; here it is placed by centre, size and turn like every other model.
// w: width along the front, d: depth; door: offset of the door from the centre along the front (local +x); returns jhouse's result
const FRONT_OF = (rot) => { const r = ((Math.round(rot/(Math.PI/2)) % 4) + 4) % 4; return ['s', 'e', 'n', 'w'][r]; };
function jhouseAt(kit, { x, z, rot = 0, w, d, door, ...o }){
  const f = FRONT_OF(rot), along = f === 's' || f === 'n', W = along ? w : d, D = along ? d : w;
  const opt = { ...o, x0:x - W/2, x1:x + W/2, z0:z - D/2, z1:z + D/2, front:f };
  if (door != null) opt.door = f === 's' ? x + door : f === 'n' ? x - door : f === 'e' ? z - door : z + door;
  const h = kit.jhouse(opt);
  if (o.shop){ const sh = kit.SHUTTERS[kit.SHUTTERS.length - 1]; if (sh && !o.closed){ sh.m.parent && sh.m.parent.remove(sh.m); kit.SHUTTERS.pop(); } }   // open shops: the shutter is rolled up
  return h; }
// a point given in a model's local frame (front +z), in world coordinates
const toWorld = (x, z, rot, lx, lz) => [x + lx*Math.cos(rot) + lz*Math.sin(rot), z - lx*Math.sin(rot) + lz*Math.cos(rot)];
export { jhouseAt, toWorld };

/* ---------- the bakery (index.html: BK / BAKERY, x −4…5, z −28.5…−19, front to the south) ----------
   A small shop of 9 × 9.5 m: wood walls, a green frame, a big window with a striped awning, a glass door
   with a bell and a lamp, a flat of one storey above under a single-slope roof. Through the window:
   the counter, a glass case of buns, the till, three shelves of bread on the back wall, lamps, a little
   table and two stools at the window. Outside: an A-board. Index coordinates minus the footprint centre
   (0.5, −23.75) give the local ones used here. */
export function buildBakery(kit, { x = 0, z = 0, rot = 0, name = 'bakery' } = {}){
  const { THREE, G, TEX, ICON, building, bb, box, wall, glass, doorOn, plane, texFor, plain, seal, jhouse, bulbMat, group } = kit;
  const B = building(name, 'bakery'), g = B.g;
  const x0 = -4.5, x1 = 4.5, z0 = -4.75, z1 = 4.75, H = 3.0, back = -0.85, wc = '#fbf0e0';
  // the shell
  wall(B, 'x', x0, x1, z1, H, 0.25, wc, [{ a0:-4.1, a1:0.4, y0:0.7, y1:2.5 }, { a0:1.3, a1:2.5, y0:0, y1:2.3 }], TEX.wood, 0.8);
  wall(B, 'x', x0, x1, z0, H, 0.25, wc, [{ a0:3.0, a1:4.2, y0:0, y1:2.1 }], TEX.wood, 0.8);
  wall(B, 'x', x0+0.12, x1-0.12, back, H, 0.12, '#f6eadc', [{ a0:2.9, a1:4.3, y0:0, y1:2.1 }]);
  wall(B, 'z', z0, z1, x0, H, 0.25, wc, [], TEX.wood, 0.8);
  wall(B, 'z', z0, z1, x1, H, 0.25, wc, [{ a0:0.15, a1:3.35, y0:0.9, y1:2.3 }], TEX.wood, 0.8);
  glass(g, 4.5, 1.8, 0.04, -1.85, G+0.7, z1); glass(g, 0.04, 1.4, 3.2, x1, G+0.9, 1.75);
  bb(B, 4.7, 0.1, 0.32, '#7aa890', -1.85, G+0.6, z1+0.12); bb(B, 0.06, 1.8, 0.08, '#7aa890', -1.85, G+0.7, z1+0.1);
  bb(B, 9.4, 0.25, 9.9, '#c8a8a0', 0, G+H, 0);
  bb(B, 9.4, 0.5, 0.3, '#7aa890', 0, G+2.5, z1+0.12); [x0+0.08, x1-0.08].forEach(px=>bb(B, 0.25, H, 0.35, '#7aa890', px, G, z1+0.08));
  const aw = bb(B, 4.8, 0.08, 1.2, '#ffffff', -1.85, G+2.75, z1+0.6, { map:texFor(TEX.stripes, 4.8, 1, 0.5) }); aw.rotation.x = 0.3;
  plane(g, 1.0, 0.42, ICON.bread, 1.9, G+2.75, z1+0.3, 'bakery');
  doorOn(B, 'x', 1.9, z1, 1.2, 2.3, 1, '#7aa890', { glass:true, bell:true, lamp:true });
  doorOn(B, 'x', 3.6, z0, 1.0, 2.1, -1, '#a88a7a', { step:false });
  // inside, as far as the window shows it
  box(g, 9, 0.03, 9.5, '#ffffff', 0, G, 0, 'world', plain(TEX.plank, 9, 9.5, 0.9));
  box(g, 4.0,0.95,0.6, '#a87a6a', 0.9,G,1.15, 'world', { round:0.03 }); box(g, 4.2,0.06,0.7, '#f8f0ea', 0.9,G+0.95,1.15);
  box(g, 1.3,0.03,0.5, '#e8e0d8', 0.1,G+1.01,1.15); glass(g, 1.4,0.42,0.56, 0.1,G+1.01,1.15);
  for (let i=0;i<5;i++) box(g, 0.22,0.12,0.14, ['#e8c890','#d8a070','#f0dcb0','#c89070','#f4c8d8'][i], -0.4+i*0.25,G+1.06,1.15, 'world', { round:0.05 });
  box(g, 0.5,0.55,0.45, '#d8d4e0', 2.5,G+1.01,1.05, 'world', { round:0.04 }); box(g, 0.32,0.08,0.22, '#3a3448', 2.5,G+1.22,1.33);
  box(g, 0.36,0.26,0.3, '#5a5470', 1.6,G+1.01,1.05, 'world', { round:0.03 }); for (let i=0;i<4;i++) box(g, 0.1,0.1+i*0.02,0.1, '#fbfaff', -0.85+i*0.13,G+1.01,1.35, 'world', { round:0.03 });
  for (let k=0;k<3;k++) box(g, 6.6,0.05,0.36, '#a87a6a', -0.2,G+0.85+k*0.55,-0.6);
  { const sz = -0.6, CR = ['#e8c890','#d8a070','#f0dcb0','#c89070','#d0b8a0'], TRAY = '#ece6ee', BASK = '#c8a078';
    const slot = (sx, y, kind, c) => {
      if (kind === 0){ [-0.13, 0.13].forEach(dx=>{ box(g, 0.25,0.17,0.23, c, sx+dx,y,sz, 'world', { round:0.09 }); box(g, 0.16,0.012,0.03, '#f8ecd8', sx+dx,y+0.168,sz); }); }
      else if (kind === 1){ box(g, 0.56,0.1,0.3, BASK, sx,y,sz, 'world', { round:0.04 }); [-0.08,0,0.08].forEach((dz,i)=>{ const b2 = box(g, 0.52,0.07,0.075, CR[(i+1)%3], sx,y+0.08,sz+dz, 'world', { round:0.03 }); b2.rotation.y = (i-1)*0.06; }); }
      else if (kind === 2){ box(g, 0.52,0.02,0.3, TRAY, sx,y,sz); for (let i=0;i<4;i++){ const m = box(g, 0.14,0.06,0.08, '#e0a860', sx-0.18+i*0.12,y+0.02,sz+((i%2)-0.5)*0.1, 'world', { round:0.03 }); m.rotation.y = 0.4 + i*0.5; } }
      else if (kind === 3){ [-0.12, 0.12].forEach(dx=>{ box(g, 0.2,0.18,0.22, '#f6ead4', sx+dx,y,sz, 'world', { round:0.02 }); box(g, 0.21,0.05,0.23, '#d8a070', sx+dx,y+0.16,sz, 'world', { round:0.025 }); }); }
      else if (kind === 4){ box(g, 0.52,0.02,0.32, TRAY, sx,y,sz); for (let i=0;i<6;i++) box(g, 0.1,0.07,0.1, c, sx-0.16+(i%3)*0.16,y+0.02,sz-0.07+Math.floor(i/3)*0.14, 'world', { round:0.045 }); }
      else { [-0.12, 0.1].forEach((dx,i)=>{ box(g, 0.17,0.27,0.11, '#e4ccb0', sx+dx,y,sz, 'world', { round:0.01 }); box(g, 0.12,0.08,0.07, CR[i*2], sx+dx,y+0.25,sz, 'world', { round:0.03 }); }); }
      box(g, 0.1,0.055,0.008, '#fffaf6', sx, y-0.07, sz+0.19); };
    [-2.9,-2.0,-1.1,-0.2,0.7,1.6,2.5].forEach((sx,i)=>{ for (let k=0;k<3;k++) slot(sx + (k%2)*0.05, G+0.9+k*0.55, (i*2 + k*3) % 6, CR[(i+k)%5]); }); }
  [-0.4, 0.9, 2.2].forEach(px=>{ box(g, 0.015, 0.62, 0.015, '#5a5470', px, G+2.38, 1.15); box(g, 0.3, 0.17, 0.3, '#7aa890', px, G+2.22, 1.15, 'world', { round:0.11 });
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.09), bulbMat); bl.position.set(px, G+2.2, 1.15); g.add(bl); });
  box(g, 0.42, 0.02, 0.3, '#f4c8d8', -0.8, G+1.0, 1.0); [-0.05, 0.05].forEach(dz=>{ const t = box(g, 0.3, 0.015, 0.025, '#c8ccd8', -0.8, G+1.025, 1.0+dz); t.rotation.y = dz*3; });
  box(g, 0.22, 0.3, 0.14, '#e8dcc8', 2.85, G+1.0, 0.9, 'world', { round:0.02 });
  box(g, 1.8,0.8,0.04, '#5a6a60', -2.9,G+2.05,-0.75); [[-0.5,'#f4a8c8'],[0.2,'#fff0a8'],[0.6,'#c8e4f4']].forEach(([dx,c])=>box(g, 0.4,0.32,0.02, c, -2.9+dx,G+2.2,-0.72));
  { const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.04,16), new THREE.MeshLambertMaterial({ color:kit.dreamC('#fbf6f4') })); ck.rotation.x = Math.PI/2; ck.position.set(0.5, G+2.35, -0.75); g.add(ck); }
  [-3.1,-0.3,2.5].forEach(px=>box(g, 0.14,0.18,9.5, '#c89a80', px,G+H-0.2,0));                                   // ceiling beams
  box(g, 4.3,0.05,0.42, '#c89a80', -1.9,G+0.98,4.3); [-3.9,-1.9,0.1].forEach(px=>box(g, 0.05,0.98,0.05, '#8a7a7a', px,G,4.3));   // the window bar
  [-3.3,-1.7].forEach(px=>{ box(g, 0.36,0.05,0.36, '#d8a8b8', px,G+0.72,3.65, 'world', { round:0.14 }); box(g, 0.05,0.72,0.05, '#5a5470', px,G,3.65); });
  { const tx = -3.1, tz = 1.15; box(g, 0.72,0.05,0.72, '#c8a090', tx,G+0.72,tz, 'world', { round:0.08 }); box(g, 0.08,0.72,0.08, '#5a5470', tx,G,tz); box(g, 0.44,0.04,0.44, '#5a5470', tx,G,tz);   // a little table
    [[-3.1, 0.5, 0],[-3.8, 1.45, Math.PI/2]].forEach(([cx, cz, r])=>{ const c = group(g, cx, G, cz); c.rotation.y = r; box(c, 0.42,0.05,0.42, '#d8c8e0', 0,0.45,0, 'world', { round:0.04 }); box(c, 0.42,0.45,0.05, '#d8c8e0', 0,0.5,-0.19, 'world', { round:0.03 });
      [[-0.18,-0.18],[0.18,-0.18],[-0.18,0.18],[0.18,0.18]].forEach(([a,b2])=>box(c, 0.04,0.45,0.04, '#5a5470', a,0,b2)); }); }
  { const p = group(g, -4.1, G, -0.35), s = 0.35; box(p, s*1.3, s*1.3, s*1.3, '#d8a8b8', 0, 0, 0, 'world', { round:0.08 });            // a plant in the corner
    [[0, s*1.3, 0, s*1.6, s*2.2],[s*0.4, s*2.4, s*0.2, s*1.0, s*1.2],[-s*0.4, s*2.2, -s*0.3, s*1.0, s*1.3]].forEach(([px,py,pz,w,h])=>box(p, w, h, w, '#a8d0a8', px, py, pz, 'world', { round:Math.min(w,h)*0.4 })); }
  [[3.4,3.75],[3.9,3.25]].forEach(([px,pz],i)=>{ box(g, 0.4,0.3,0.4, '#e0c8a8', px,G,pz, 'world', { round:0.05 }); box(g, 0.32,0.12,0.32, ['#e8c890','#d8a070'][i], px,G+0.3,pz, 'world', { round:0.06 }); });
  box(g, 0.2,0.5,0.2, '#8aa0c8', 0.6,G,4.35, 'world', { round:0.06 });                                           // an umbrella stand by the door
  box(g, 0.25, 0.04, 1.6, '#a87a6a', -4.24, G+1.6, 2.15); for (let i=0;i<5;i++) box(g, 0.16, 0.2+(i%2)*0.06, 0.16, ['#f4e4c8','#f4c8d8','#c8e4d8','#fff0c8','#e8d8f0'][i], -4.24, G+1.64, 1.55+i*0.3, 'world', { round:0.05 });
  [[0.85,'#f4c8d8'],[2.55,'#c8e0f4']].forEach(([pz,c])=>{ box(g, 0.03, 0.55, 0.42, '#fbf6f4', -4.35, G+2.0, pz); box(g, 0.02, 0.45, 0.32, c, -4.33, G+2.05, pz); });
  box(g, 1.0, 0.01, 0.6, '#c8a8b8', 1.9, G+0.02, 3.85);
  { const cs = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.03,14), new THREE.MeshLambertMaterial({ color:kit.dreamC('#fbf6f4') })); cs.position.set(-0.9, G+1.18, 1.15); g.add(cs);
    box(g, 0.04, 0.16, 0.04, '#e0d8e8', -0.9, G+1.01, 1.15); box(g, 0.26, 0.12, 0.26, '#f4c8d8', -0.9, G+1.2, 1.15, 'world', { round:0.1 }); }
  box(g, 0.02, 0.5, 0.02, '#8a7a7a', -1.9, G+2.3, 3.85); box(g, 0.3, 0.25, 0.3, '#d8a8b8', -1.9, G+2.05, 3.85, 'world', { round:0.08 }); box(g, 0.45, 0.35, 0.45, '#a8d0a8', -1.9, G+1.8, 3.85, 'world', { round:0.18 });
  box(g, 0.45,0.28,0.22, '#d87a8a', -3.7,G+1.4,-0.6, 'world', { round:0.04 });                                     // the radio
  [[-2.1,2.75],[0.9,2.15]].forEach(([px,pz])=>{ box(g, 0.02,0.6,0.02, '#3a3448', px,G+2.4,pz); box(g, 0.4,0.24,0.4, '#7aa890', px,G+2.2,pz, 'world', { round:0.1 });
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.12), bulbMat); bl.position.set(px, G+2.18, pz); g.add(bl); });
  // outside: the A-board by the door
  { const ab = group(g, 3.8, G, 5.65); box(ab, 0.55,0.85,0.04, '#5a6a60', 0,0,0.2).rotation.x = -0.25; box(ab, 0.55,0.85,0.04, '#5a6a60', 0,0,-0.2).rotation.x = 0.25; }
  // the flat above: one storey under a single-slope roof (index: jhouse 'bk-up', lifted onto the shop)
  const up = jhouse({ name:name + '-up', x0, x1, z0, z1, floors:1, front:'s', roof:'mono', color:'#f8ecd8', skin:'gLap', lift:H+0.25, shop:false, balcony:false });
  g.add(up.b.g);
  g.position.set(x, 0, z); g.rotation.y = rot; seal(B);
  return { b:B, g, footprint:FOOTPRINT.bakery };
}

/* ---------- the coin laundry (index.html: LA / LAUND, x 19…28.5, z −10.5…−2.5, front to the west) ----------
   Tiled walls, three tall windows and a glass door on the front, a dark sign band with the washing icon, flats of two floors above
   with balconies (index: jhouse 'la-up'), an outside stair up to them on one side. Through the glass: two rows of stacked machines
   with round doors, a folding table with towels, the detergent machine and the coin changer, a bench, two chairs, a rack of clothes,
   the long ceiling lights. Index (X, Z) → local (lx, lz) = (Z + 6.5, 23.75 − X): the front, X = 19, becomes lz = +4.75. */
export function buildLaundry(kit, { x = 0, z = 0, rot = 0, name = 'laundry' } = {}){
  const { THREE, G, TEX, ICON, building, bb, box, wall, glass, doorOn, plane, texFor, plain, seal, jhouse, group, dreamC, checker } = kit;
  const B = building(name, 'laundry'), g = B.g, H = 3.0, wc = '#d8f0f0';
  wall(B, 'x', -4, 4, 4.75, H, 0.25, wc, [{ a0:-3.5, a1:-0.5, y0:0.6, y1:2.4 }, { a0:-0.1, a1:1.1, y0:0, y1:2.3 }, { a0:1.5, a1:3.5, y0:0.6, y1:2.4 }], TEX.gTile, 0.5);
  wall(B, 'x', -4, 4, -4.75, H, 0.25, wc, [], TEX.gTile, 0.5); wall(B, 'z', -4.75, 4.75, -4, H, 0.25, wc, [], TEX.gTile, 0.5); wall(B, 'z', -4.75, 4.75, 4, H, 0.25, wc, [], TEX.gTile, 0.5);
  wall(B, 'x', -3.88, 3.88, -1.25, H, 0.12, '#eef6f6');
  glass(g, 3.0, 1.8, 0.04, -2, G+0.6, 4.75); glass(g, 2.0, 1.8, 0.04, 2.5, G+0.6, 4.75);
  bb(B, 8.4, 0.25, 10, '#8ab8b8', 0, G+H, 0);
  bb(B, 6.0, 0.5, 0.3, '#3a4a58', 0, G+2.45, 4.95);
  { const n = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshBasicMaterial({ map:ICON.wash, transparent:true })); n.position.set(0, G+2.7, 5.11); g.add(n); }
  doorOn(B, 'x', 0.5, 4.75, 1.2, 2.3, 1, '#e8f0f0', { glass:true, clunk:true });
  box(g, 8, 0.03, 9.5, '#ffffff', 0, G, 0, 'world', { map:checker('#f4f4f4','#c8e4e8', 10, 8) });
  // the machines: washers below, dryers above, their round doors facing the window
  [-3.1,-1.9,-0.7,0.5,1.7,2.9].forEach((lx, i)=>{ box(g, 0.7,0.85,0.7, '#f2f2f6', lx,G+0.2,-0.75, 'world', { round:0.05 }); box(g, 0.7,0.2,0.7, '#c8c4d0', lx,G,-0.75); box(g, 0.7,0.8,0.7, '#f2f2f6', lx,G+1.07,-0.75, 'world', { round:0.05 });
    [[0.23, 0.6, '#7a8aa8'], [0.2, 1.48, '#8a9ab8']].forEach(([r, y, c])=>{ const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 16), new THREE.MeshLambertMaterial({ color:dreamC(c) })); p.rotation.x = Math.PI/2; p.position.set(lx, G+y, -0.38); g.add(p); });
    box(g, 0.34, 0.06, 0.01, i%2 ? '#9ec8f4' : '#f4a8c8', lx, G+0.98, -0.39); });
  box(g, 0.6,0.85,2.4, '#e8e4ec', -3.5,G,2.55, 'world', { round:0.03 }); [[3.25,'#ffffff'],[2.55,'#f4c8d8'],[1.95,'#c8d8f4']].forEach(([lz,c])=>box(g, 0.3,0.12,0.4, c, -3.5,G+0.85,lz, 'world', { round:0.03 }));
  box(g, 0.4,1.5,0.5, '#f4b8c8', -3.6,G,0.15, 'world', { round:0.05 }); box(g, 0.03,0.4,0.4, '#fff0f4', -3.39,G+0.9,0.15);   // detergent machine
  box(g, 0.4,1.3,0.45, '#c8d8f0', 3.6,G,0.15, 'world', { round:0.05 }); box(g, 0.03,0.2,0.3, '#3a3448', 3.39,G+0.9,0.15);    // coin changer
  benchIn(kit, g, -0.1, 2.0, Math.PI, '#a8d8d0'); chairIn(kit, g, 3.3, 3.75, -Math.PI/2, '#f4c8d8'); chairIn(kit, g, 3.3, 3.15, -Math.PI/2, '#f4c8d8');
  { const rk = group(g, 2.1, G, 2.55); rk.rotation.y = Math.PI/2; box(rk, 0.05, 1.5, 0.05, '#c8ccd8', -0.55, 0, 0); box(rk, 0.05, 1.5, 0.05, '#c8ccd8', 0.55, 0, 0); box(rk, 1.2, 0.04, 0.04, '#c8ccd8', 0, 1.48, 0);
    [['#f4c8d8',-0.35],['#c8d8f4',-0.05],['#ffffff',0.25],['#fff0c8',0.45]].forEach(([c,px])=>box(rk, 0.24, 0.62, 0.03, c, px, 0.8, 0)); }
  [[-1.9,2.55],[1.9,2.55],[-1.9,0.75],[1.9,0.75]].forEach(([lx,lz])=>{ const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 1.3), new THREE.MeshBasicMaterial({ color:'#f8fbff' })); m.position.set(lx, G+2.96, lz); g.add(m); });
  plantIn(kit, g, -3.6, 4.3, 0.3);
  // the flats above (index: jhouse 'la-up') and the outside stair up to them
  const up = jhouse({ name:name + '-up', x0:-4, x1:4, z0:-4.75, z1:4.75, floors:2, front:'s', roof:'flat', color:'#d8ecf0', skin:'gPanel', lift:H+0.25, balcony:true }); g.add(up.b.g);
  for (let i=0;i<10;i++) box(g, 1.0, 0.08, 0.28, '#c8ccd8', 4.6, G+0.3+i*0.31, -3.85+i*0.32);
  box(g, 0.05, 3.4, 0.05, '#c8ccd8', 5.1, G, -4.05); box(g, 0.05, 0.05, 3.4, '#c8ccd8', 5.1, G+3.6, -2.45);
  g.position.set(x, 0, z); g.rotation.y = rot; seal(B); return { b:B, g, footprint:FOOTPRINT.laundry };
}

/* ---------- the flower shop (index.html: FLOWERS = jhouse 'flowers', 6.5 × 9.5 m, front to the west) ----------
   Two floors, a low gable, a shop front of glass with a mint awning and sign, the flower icon; outside, three wooden stands of pots
   against the front (the one that stood in the doorway is left out) and a group of tall pots by the side. */
export function buildFlowers(kit, { x = 0, z = 0, rot = 0, name = 'flowers' } = {}){
  const { G, ICON, building, box, group, seal } = kit;
  const h = jhouseAt(kit, { name, x, z, rot, w:6.5, d:9.5, floors:2, roof:'gable', color:'#fbe4ec', skin:'gBoard', shop:true, awning:'#9ad0b8', sign:'#c8ecd8', icon:ICON.flower, door:0 });
  const op = openShop(kit, h, { x, z, rot, w:6.5, d:9.5, floors:2, color:'#fbe4ec', skin:'gBoard', mode:'room', door:0, doorC:'#9ad0b8', floorTex:'stone', name });
  if (op) flowersRoom(kit, op.R, 6.5, 9.5);
  const out = building(name + '-out'), g = out.g;
  [-2.65, -1.32, 1.85].forEach((lx, i)=>{ box(g, 1.2, 0.5, 0.7, '#c8a890', lx, G, 5.15); for (let k=0;k<3;k++) box(g, 0.26,0.26,0.26, ['#f4a8c8','#fff0a8','#ffffff','#c8a8f4'][(i+k)%4], lx - 0.35 + k*0.35, G+0.5, 5.25 - (k%2)*0.2, 'world', { round:0.12 }); });
  potsIn(kit, g, 3.6, 4.4, 3, 'z'); plantIn(kit, g, -3.65, 5.6, 0.4, '#e4c0cc');
  g.position.set(x, 0, z); g.rotation.y = rot; seal(out); return { b:h.b, g, footprint:FOOTPRINT.flowers, room:op && op.room };
}

/* ---------- the café (index.html: jhouse 'cafe', 5.5 × 9.5 m, front to the south) ----------
   Two floors, a gable, a glass shop front under a mint awning, the cup icon; outside, two small tables with chairs, a menu board, pots. */
export function buildCafe(kit, { x = 0, z = 0, rot = 0, name = 'cafe' } = {}){
  const { G, ICON, building, box, group, seal } = kit;
  const h = jhouseAt(kit, { name, x, z, rot, w:5.5, d:9.5, floors:2, roof:'gable', color:'#f8dce4', skin:'gBoard', shop:true, awning:'#9ad0b8', sign:'#c8e8dc', icon:ICON.cafe, door:1.6 });
  const op = openShop(kit, h, { x, z, rot, w:5.5, d:9.5, floors:2, color:'#f8dce4', skin:'gBoard', mode:'room', door:1.6, doorC:'#9ad0b8', floorTex:'plank', name });
  if (op) cafeRoom(kit, op.R, 5.5, 9.5);
  const out = building(name + '-out'), g = out.g;
  [[-1.6, 5.75], [0.4, 5.75]].forEach(([lx, lz], i)=>{ tableIn(kit, g, lx, lz, 0.32, '#c8a090'); chairIn(kit, g, lx - 0.55, lz, Math.PI/2, ['#d8c8e0','#f4c8d8'][i]); chairIn(kit, g, lx + 0.55, lz, -Math.PI/2, ['#d8c8e0','#f4c8d8'][i]); });
  { const ab = group(g, 2.5, G, 6.3); box(ab, 0.5,0.8,0.04, '#5a6a60', 0,0,0.18).rotation.x = -0.25; box(ab, 0.5,0.8,0.04, '#5a6a60', 0,0,-0.18).rotation.x = 0.25; }
  plantIn(kit, g, -2.5, 5.0, 0.32, '#c8d8e8');
  g.position.set(x, 0, z); g.rotation.y = rot; seal(out); return { b:h.b, g, footprint:FOOTPRINT.cafe, room:op && op.room };
}

/* ---------- shop rooms (r5): a jhouse shop's ground floor was one solid box right behind its glass, so the café, the flower shop and
   the small shops showed a flat wall through their windows. openShop() turns that floor into a real room (mode 'room': walls, floor,
   ceiling, a glass door one can walk through) or a shallow display niche behind the glass (mode 'niche'). It changes the meshes jhouse
   already built — jhouse itself is called exactly as before, so the town's random sequence (rnd) is untouched.
   Returns the room box { x, z, rot, w, d, y0, y1 } in the model's frame, for the page's interior light and level-of-detail. */
const near = (a, b, e = 0.02) => Math.abs(a - b) < e;
function openShop(kit, h, { x, z, rot = 0, w, d, floors = 2, fh = 3.0, color, skin, mode = 'room', depth = 1.3, door = null, doorC = '#9ad0b8', floorTex = 'plank', name = 'shop' }){
  const { THREE, G, TEX, box, group, texFor, doorOn } = kit, g = h.b.g, H = floors*fh;
  const f = FRONT_OF(rot), along = f === 's' || f === 'n', W = along ? w : d, D = along ? d : w, c = Math.cos(rot), sn = Math.sin(rot);
  const loc = (X, Z) => { const dx = X - x, dz = Z - z; return [dx*c - dz*sn, dx*sn + dz*c]; };
  const P = (m) => m.geometry && m.geometry.parameters || {};
  const meshes = []; g.children.forEach(m=>{ if (m.isMesh) meshes.push(m); });
  // 1. the body: only the floors above stay solid
  const body = meshes.find(m=>{ const q = P(m); return near(q.width, W) && near(q.height, H) && near(q.depth, D); });
  if (!body) return null;
  if (floors > 1){ body.geometry = new THREE.BoxGeometry(W, H - fh, D); body.position.y = G + fh + (H - fh)/2; } else g.remove(body);
  // 2. the plinth (a solid band 0.42 high all round) would fill the room: it becomes a kerb along the outside of the walls
  const plinth = meshes.find(m=>{ const q = P(m); return near(q.width, W + 0.08) && near(q.height, 0.42) && near(q.depth, D + 0.08); }); if (plinth) g.remove(plinth);
  const R = group(g, x, 0, z); R.rotation.y = rot; R.userData.shopRoom = name;
  const wallC = color, sk = (a, b2) => skin ? { map:texFor(TEX[skin], a, b2, skin === 'gLap' ? 1.0 : 1.6) } : {};
  const t = 0.2, fz = d/2, iw = w - 2*t;
  box(R, w + 0.08, 0.42, 0.12, '#d4ccd8', 0, G, -fz - 0.02); [-1, 1].forEach(sd=>box(R, 0.12, 0.42, d + 0.08, '#d4ccd8', sd*(w/2 + 0.02), G, 0));
  const room = mode === 'room', z0 = room ? -fz : fz - depth;                                  // the back of the room / niche
  if (!room) box(R, w, fh, z0 + fz, wallC, 0, G, (-fz + z0)/2, 'world', sk(w, fh));        // the rest of the ground floor stays a solid block
  [-1, 1].forEach(sd=>box(R, t, fh, fz - z0, wallC, sd*(w/2 - t/2), G, (z0 + fz)/2, 'world', sk(fz - z0, fh)));   // side walls
  if (room) box(R, w, fh, t, wallC, 0, G, -fz + t/2, 'world', sk(w, fh));                 // back wall
  box(R, w, fh - 2.55, t, wallC, 0, G + 2.55, fz - t/2, 'world', sk(w, fh - 2.55));        // lintel over the shop front
  [-1, 1].forEach(sd=>box(R, 0.3, 2.55, t, wallC, sd*(w/2 - 0.15), G, fz - t/2, 'world', sk(0.3, 2.55)));       // the piers beside the glass
  const inner = room ? d - 2*t : depth - t;
  box(R, iw, 0.03, inner, '#ffffff', 0, G, (room ? 0 : (z0 + fz - t)/2), 'world', { map:texFor(TEX[floorTex] || TEX.plank, iw, inner, 0.9) });
  box(R, iw, 0.05, inner, '#f8f2ee', 0, G + fh - 0.05, (room ? 0 : (z0 + fz - t)/2));       // ceiling
  // 3. a glass door in the shop front: the glass, the base strip and any mullion in its way are cut round it
  let dd = null;
  if (room && door != null){ const gap = 0.62;
    meshes.forEach(m=>{ if (!m.parent) return; const q = P(m), [lx, lz] = loc(m.position.x, m.position.z); if (lz < fz - 0.05) return;
      const long = along ? q.width : q.depth, thin = along ? q.depth : q.width; if (long == null) return;
      const isGlass = m.material && m.material.transparent && near(q.height, 2.1), isBase = near(q.height, 0.45) && long > 1.5, isMull = near(q.height, 2.1) && near(long, 0.08);
      if (isMull && Math.abs(lx - door) < gap + 0.1){ g.remove(m); return; }
      if (!isGlass && !isBase) return;
      const a0 = lx - long/2, a1 = lx + long/2, y = m.position.y, mat = m.material, ro = m.renderOrder; g.remove(m);
      [[a0, door - gap], [door + gap, a1]].forEach(([p0, p1])=>{ if (p1 - p0 < 0.05) return; const n = new THREE.Mesh(new THREE.BoxGeometry(p1 - p0, q.height, thin), mat);
        const [X, Z] = toWorld(x, z, rot, (p0 + p1)/2, lz); n.position.set(X, y, Z); n.rotation.y = rot; n.renderOrder = ro; n.userData = { ...m.userData }; n.castShadow = m.castShadow; n.receiveShadow = m.receiveShadow; g.add(n); }); });
    const [DX, DZ] = toWorld(x, z, rot, door, fz), al = along ? 'x' : 'z', a = along ? DX : DZ, cc = along ? DZ : DX, out = f === 's' || f === 'e' ? 1 : -1;
    dd = doorOn(h.b, al, a, cc, 1.1, 2.3, out, doorC, { glass:true, bell:true, step:false }); }
  return { R, room:{ name, x, z, rot, w:w - 2*t, d:room ? d - 2*t : depth - t, cz:room ? 0 : (z0 + fz - t)/2, y0:G, y1:G + fh }, door:dd };
}
// a pendant lamp: cord, shade, bulb (in a room's own frame)
function pendant(kit, R, x, y, z, shadeC = '#7aa890'){ const { box, THREE, bulbMat } = kit; box(R, 0.015, 0.5, 0.015, '#4a4458', x, y - 0.5, z); box(R, 0.34, 0.18, 0.34, shadeC, x, y - 0.68, z, 'world', { round:0.12 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.12), bulbMat); b.position.set(x, y - 0.7, z); R.add(b); }
// small goods on a shelf: n boxes in a row (deterministic colours, no rnd())
const GOODS = ['#f4a8c8','#a8c8f4','#fff0a8','#c8e4d8','#d8c8f4','#f4c8a8','#ffffff','#e8a878'];
function goodsRow(kit, R, x0, x1, y, z, h = 0.2, dep = 0.16, seed = 0){ const n = Math.max(1, Math.floor((x1 - x0)/0.17)); for (let i=0;i<n;i++){ const k = (i*7 + seed*3) % GOODS.length;
  kit.box(R, 0.13, h*(0.75 + ((i*5 + seed) % 4)*0.1), dep, GOODS[k], x0 + (i + 0.5)*(x1 - x0)/n, y, z, 'world', { round:0.02 }); } }
// what a niche shows, by kind of shop
function nicheGoods(kit, R, kind, name, w, fz, depth){ const { box, THREE } = kit, G = kit.G, zb = fz - depth + 0.05, iw = w - 0.4;
  const strip = new THREE.Mesh(new THREE.BoxGeometry(iw - 0.2, 0.04, 0.1), kit.bulbMat); strip.position.set(0, G + 2.88, fz - depth*0.55); R.add(strip);
  if (kind === 'books'){ for (let k=0;k<4;k++){ box(R, iw - 0.1, 0.04, 0.3, '#b89a80', 0, G + 0.35 + k*0.5, zb + 0.15); goodsRow(kit, R, -iw/2 + 0.1, iw/2 - 0.1, G + 0.39 + k*0.5, zb + 0.13, 0.36, 0.22, k + name.length); }
    box(R, 0.9, 0.7, 0.5, '#c8a888', -iw/4, G, fz - 0.55, 'world', { round:0.02 }); for (let i=0;i<5;i++) box(R, 0.24, 0.05, 0.32, GOODS[(i*3) % 8], -iw/4 - 0.3 + (i%3)*0.3, G + 0.7 + Math.floor(i/3)*0.05, fz - 0.55);
    if (name.includes('stationer')){ for (let i=0;i<6;i++) box(R, 0.05, 0.18, 0.05, GOODS[i % 8], iw/4 - 0.25 + i*0.1, G + 0.7, fz - 0.6); box(R, 0.7, 0.7, 0.45, '#d8c8e8', iw/4, G, fz - 0.6, 'world', { round:0.02 }); }
    return; }
  if (kind === 'clock'){ box(R, iw - 0.1, 0.9, 0.35, '#a88a78', 0, G, zb + 0.18, 'world', { round:0.02 }); glass(kit, R, iw - 0.2, 0.3, 0.3, 0, G + 0.9, zb + 0.18);
    for (let i=0;i<5;i++) box(R, 0.1, 0.03, 0.1, ['#f4d48a','#c8ccd8','#e8c0a0'][i%3], -iw/2 + 0.4 + i*(iw - 0.6)/4, G + 0.93, zb + 0.18);
    [[-0.9, 1.9, 0.28], [0, 2.2, 0.36], [0.85, 1.75, 0.22], [-0.3, 1.45, 0.16], [0.45, 2.45, 0.18]].forEach(([cx, cy, r], i)=>{ if (Math.abs(cx) > iw/2 - r) return;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 18), new THREE.MeshLambertMaterial({ color:kit.dreamC(['#fbf6f0','#f4e4c8','#e8f0f8'][i%3]) })); m.rotation.x = Math.PI/2; m.position.set(cx, G + cy, zb + 0.04); R.add(m);
      box(R, 0.025, r*0.75, 0.02, '#3a3448', cx, G + cy, zb + 0.08); });
    box(R, 0.42, 1.9, 0.3, '#8a6a5a', iw/2 - 0.3, G, zb + 0.2, 'world', { round:0.03 }); return; }
  // grocery / deli / sweets
  if (name === 'deli'){ box(R, iw - 0.2, 0.95, 0.6, '#e8e0ec', 0, G, zb + 0.35, 'world', { round:0.03 }); glass(kit, R, iw - 0.3, 0.4, 0.5, 0, G + 0.95, zb + 0.35);
    for (let i=0;i<Math.floor(iw/0.45);i++) box(R, 0.36, 0.06, 0.3, ['#f4c8a8','#e8a878','#f4e4c8','#c8e4a8'][i%4], -iw/2 + 0.4 + i*0.45, G + 0.95, zb + 0.35, 'world', { round:0.02 });
    for (let k=0;k<2;k++) goodsRow(kit, R, -iw/2 + 0.2, iw/2 - 0.2, G + 1.55 + k*0.45, zb + 0.06, 0.26, 0.12, k + 4); return; }
  if (name === 'sweets'){ for (let k=0;k<3;k++){ box(R, iw - 0.1, 0.04, 0.32, '#f4e4ec', 0, G + 0.5 + k*0.55, zb + 0.16); const n = Math.floor((iw - 0.3)/0.3);
      for (let i=0;i<n;i++){ glass(kit, R, 0.2, 0.28, 0.2, -iw/2 + 0.3 + i*0.3, G + 0.54 + k*0.55, zb + 0.16); box(R, 0.16, 0.14, 0.16, GOODS[(i + k*3) % 8], -iw/2 + 0.3 + i*0.3, G + 0.55 + k*0.55, zb + 0.16, 'world', { round:0.06 }); } }
    return; }
  for (let k=0;k<3;k++){ const zz = zb + 0.25 + k*0.3, yy = G + 0.95 - k*0.3; box(R, iw - 0.1, 0.06, 0.3, '#c8a890', 0, yy, zz);     // a stepped stand of crates
    const n = Math.floor((iw - 0.2)/0.5); for (let i=0;i<n;i++){ const cx = -iw/2 + 0.35 + i*0.5; box(R, 0.44, 0.16, 0.28, '#d8b898', cx, yy + 0.06, zz);
      for (let j=0;j<3;j++) box(R, 0.11, 0.11, 0.11, ['#f4a070','#a8d890','#f4e070','#e87a8a','#f4c8a8'][(i + j + k*2) % 5], cx - 0.13 + j*0.13, yy + 0.2, zz, 'world', { round:0.05 }); } }
}
function glass(kit, R, w, h, d, x, y, z){ const m = kit.glass(R, w, h, d, x, y, z); return m; }

/* ---------- the café's room: a counter with the espresso machine and the cake case, a menu board, shelves of jars and coffee,
   two little tables and a window bar with stools, pendant lamps; a partition with a doorway to the back kitchen ---------- */
function cafeRoom(kit, R, w, d){ const { box, group, THREE, G } = kit, fz = d/2, iw = w - 0.4;
  const pz = -fz + 2.0;                                                                          // the kitchen partition
  box(R, 1.6, 2.95, 0.12, '#f4e8dc', -iw/2 + 0.8, G, pz); box(R, iw - 2.5, 2.95, 0.12, '#f4e8dc', iw/2 - (iw - 2.5)/2, G, pz); box(R, 0.9, 0.75, 0.12, '#f4e8dc', -iw/2 + 2.05, G + 2.2, pz);
  // counter along the partition, front to the door
  const cz = pz + 1.1; box(R, 2.9, 0.95, 0.6, '#b08068', -iw/2 + 1.6, G, cz, 'world', { round:0.03 }); box(R, 3.0, 0.05, 0.7, '#f4ece4', -iw/2 + 1.6, G + 0.95, cz);
  box(R, 0.56, 0.42, 0.42, '#c8ccd8', -iw/2 + 0.55, G + 1.0, cz - 0.05, 'world', { round:0.05 }); [-0.14, 0.14].forEach(dx=>box(R, 0.08, 0.1, 0.08, '#3a3448', -iw/2 + 0.55 + dx, G + 1.12, cz + 0.2));
  box(R, 0.18, 0.4, 0.18, '#3a3448', -iw/2 + 1.05, G + 1.0, cz - 0.1, 'world', { round:0.04 }); for (let i=0;i<4;i++) box(R, 0.09, 0.08, 0.09, '#fbfaff', -iw/2 + 1.35 + (i%2)*0.1, G + 1.0 + Math.floor(i/2)*0.08, cz - 0.15, 'world', { round:0.03 });
  box(R, 0.85, 0.06, 0.5, '#e8e0d8', -iw/2 + 2.3, G + 1.0, cz); glass(kit, R, 0.85, 0.42, 0.5, -iw/2 + 2.3, G + 1.06, cz);
  for (let i=0;i<4;i++) box(R, 0.16, 0.12, 0.16, ['#f4c8d8','#e8c890','#c89070','#fff0c8'][i], -iw/2 + 2.0 + i*0.2, G + 1.07, cz, 'world', { round:0.05 });
  box(R, 0.3, 0.18, 0.25, '#5a5470', -iw/2 + 2.9, G + 1.0, cz - 0.05, 'world', { round:0.03 });                            // the till
  // the back wall of the room (the partition): menu board, shelves of jars and bags
  box(R, 1.3, 0.85, 0.04, '#3e4a44', -iw/2 + 0.9, G + 1.75, pz + 0.08); [[0.0, '#f4e4c8'], [0.2, '#f4c8d8'], [0.4, '#c8e4d8'], [0.6, '#f4e4c8']].forEach(([dy, cc])=>box(R, 0.9 - dy*0.6, 0.06, 0.01, cc, -iw/2 + 0.85, G + 2.38 - dy, pz + 0.11));
  for (let k=0;k<2;k++){ box(R, iw - 2.6, 0.04, 0.26, '#b08068', iw/2 - (iw - 2.6)/2, G + 1.5 + k*0.5, pz + 0.18); goodsRow(kit, R, iw/2 - (iw - 2.6) + 0.1, iw/2 - 0.1, G + 1.54 + k*0.5, pz + 0.18, 0.24, 0.14, 2 + k); }
  // tables, the window bar with stools
  [[-iw/2 + 0.75, fz - 2.7], [-0.25, fz - 1.55]].forEach(([tx, tz], i)=>{ tableIn(kit, R, tx, tz, 0.34, '#c8a090'); chairIn(kit, R, tx, tz - 0.55, 0, ['#d8c8e0','#f4c8d8'][i]); chairIn(kit, R, tx, tz + 0.55, Math.PI, ['#d8c8e0','#f4c8d8'][i]);
    box(R, 0.09, 0.08, 0.09, '#fbfaff', tx + 0.08, G + 0.77, tz, 'world', { round:0.03 }); });
  box(R, 2.2, 0.05, 0.32, '#c89a80', -iw/2 + 1.1, G + 1.0, fz - 0.42); [0.4, 1.1, 1.8].forEach(sx=>{ box(R, 0.32, 0.05, 0.32, '#7aa890', -iw/2 + sx, G + 0.72, fz - 0.8, 'world', { round:0.12 }); box(R, 0.05, 0.72, 0.05, '#5a5470', -iw/2 + sx, G, fz - 0.8); });
  // lamps, a plant, a coat stand
  [[-iw/2 + 1.6, cz], [-iw/2 + 0.75, fz - 2.7], [-0.25, fz - 1.55]].forEach(([lx, lz])=>pendant(kit, R, lx, G + 2.95, lz));
  plantIn(kit, R, iw/2 - 0.3, pz + 0.55, 0.32); box(R, 0.05, 1.7, 0.05, '#5a5470', iw/2 - 0.25, G, fz - 0.6); box(R, 0.3, 0.45, 0.12, '#c8b8a8', iw/2 - 0.25, G + 1.1, fz - 0.6);
}
/* ---------- the flower shop's room: tiered stands of buckets, a glass cooler, a counter with the till and paper, a work table of
   bouquets, hanging plants, buckets by the window ---------- */
function flowersRoom(kit, R, w, d){ const { box, THREE, G } = kit, fz = d/2, iw = w - 0.4, FL = ['#f4a8c8','#fff0a8','#ffffff','#c8a8f4','#f4c0a0','#e87a8a'];
  const pz = -fz + 1.8; box(R, iw - 1.3, 2.95, 0.12, '#eef4ec', -0.65, G, pz); box(R, 0.4, 2.95, 0.12, '#eef4ec', iw/2 - 0.2, G, pz); box(R, 0.9, 0.75, 0.12, '#eef4ec', iw/2 - 0.85, G + 2.2, pz);
  const bunch = (bx, by, bz, k) => { box(R, 0.26, 0.3, 0.26, ['#c8ccd8','#a8b8c8','#d8c8b8'][k % 3], bx, by, bz, 'world', { round:0.04 }); box(R, 0.06, 0.25, 0.06, '#7aa870', bx, by + 0.3, bz);
    for (let j=0;j<3;j++) box(R, 0.15, 0.13, 0.15, FL[(k + j) % FL.length], bx - 0.08 + j*0.08, by + 0.5 + (j%2)*0.06, bz + ((j%2) - 0.5)*0.08, 'world', { round:0.07 }); };
  for (let k=0;k<3;k++){ const xx = -iw/2 + 0.25 + k*0.35, yy = G + 0.75 - k*0.35; box(R, 0.34, 0.05, 3.6, '#c8a890', xx, yy, fz - 2.9); for (let i=0;i<7;i++) bunch(xx, yy + 0.05, fz - 4.5 + i*0.5, i + k*2); }
  // the cooler
  box(R, 0.7, 2.0, 1.6, '#e8f0f4', iw/2 - 0.35, G, pz + 1.4, 'world', { round:0.02 }); glass(kit, R, 0.06, 1.7, 1.4, iw/2 - 0.71, G + 0.15, pz + 1.4);
  for (let k=0;k<3;k++) for (let i=0;i<3;i++) bunch(iw/2 - 0.38, G + 0.12 + k*0.55, pz + 0.9 + i*0.5, i + k);
  // counter, till, paper, ribbon
  box(R, 1.8, 0.95, 0.6, '#c8b8a8', 0.3, G, pz + 0.75, 'world', { round:0.03 }); box(R, 1.9, 0.05, 0.7, '#f8f4ee', 0.3, G + 0.95, pz + 0.75);
  box(R, 0.3, 0.18, 0.25, '#5a5470', 0.9, G + 1.0, pz + 0.7, 'world', { round:0.03 }); { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 10), new THREE.MeshLambertMaterial({ color:kit.dreamC('#f4e4c8') })); r.rotation.z = Math.PI/2; r.position.set(-0.1, G + 1.08, pz + 0.85); R.add(r); }
  box(R, 0.12, 0.12, 0.12, '#e87a8a', 0.45, G + 1.0, pz + 0.95, 'world', { round:0.05 });
  // a work table of bouquets in the middle, off the way in
  box(R, 1.2, 0.85, 0.7, '#b8a088', -0.75, G, 0.55, 'world', { round:0.03 }); for (let i=0;i<4;i++){ box(R, 0.2, 0.08, 0.32, '#f8f0e8', -1.15 + i*0.27, G + 0.85, 0.55); box(R, 0.16, 0.12, 0.16, FL[i], -1.15 + i*0.27, G + 0.93, 0.45, 'world', { round:0.07 }); }
  // buckets by the window, either side of the door
  [-1, 1].forEach(sd=>{ for (let i=0;i<3;i++) bunch(sd*(0.95 + i*0.42), G, fz - 0.55, i + (sd > 0 ? 3 : 0)); });
  // hanging plants and lamps
  [[-1.2, fz - 1.6], [1.3, fz - 1.6], [0.2, -0.6]].forEach(([hx, hz], i)=>{ box(R, 0.015, 0.7, 0.015, '#4a4458', hx, G + 2.25, hz); box(R, 0.3, 0.22, 0.3, '#e4c0cc', hx, G + 2.05, hz, 'world', { round:0.08 }); box(R, 0.45, 0.35, 0.45, ['#9ad0a8','#a8c8a0','#b4d8c0'][i], hx, G + 1.78, hz, 'world', { round:0.16 }); });
  [[0.3, pz + 0.75], [-0.75, 0.55]].forEach(([lx, lz])=>pendant(kit, R, lx, G + 2.95, lz, '#e8f0e0'));
}

/* ---------- the convenience store (index.html: ST / STORE, x −6.5…6.5, z 19…28.5, front to the north) ----------
   13 × 9.5 m of white walls, two wide windows and a glass door, the long pink-and-blue sign band. Through the glass: the magazine rack
   at the window, two gondolas of goods, the fridges along the back, the counter with the till, the bun warmer and the coffee machine.
   Outside: two vending machines, bins, bicycles. Index (X, Z) → local (−X, 23.75 − Z). */
export function buildStore(kit, { x = 0, z = 0, rot = 0, name = 'store' } = {}){
  const { THREE, G, building, bb, box, wall, glass, doorOn, seal, checker, paint } = kit;
  const B = building(name, 'store'), g = B.g, H = 3.2, wc = '#f8f4f8';
  wall(B, 'x', -6.5, 6.5, 4.75, H, 0.25, wc, [{ a0:-6.1, a1:-0.9, y0:0.5, y1:2.6 }, { a0:-0.7, a1:0.7, y0:0, y1:2.5 }, { a0:0.9, a1:6.1, y0:0.5, y1:2.6 }]);
  wall(B, 'x', -6.5, 6.5, -4.75, H, 0.25, wc); wall(B, 'z', -4.75, 4.75, 6.5, H, 0.25, wc); wall(B, 'z', -4.75, 4.75, -6.5, H, 0.25, wc);
  wall(B, 'x', -6.38, 6.38, -2.75, H, 0.12, '#f4eef6', [{ a0:4.6, a1:5.6, y0:0, y1:2.2 }]);
  glass(g, 5.2, 2.1, 0.04, 3.5, G+0.5, 4.75); glass(g, 5.2, 2.1, 0.04, -3.5, G+0.5, 4.75);
  bb(B, 13.4, 0.25, 9.9, '#e8e0ec', 0, G+H, 0);
  doorOn(B, 'x', 0, 4.75, 1.4, 2.5, 1, '#e8e0f0', { glass:true, bell:true });
  const signMat = new THREE.MeshBasicMaterial({ map:paint(32,4,(c)=>{ c.fillStyle='#ff9ec4'; c.fillRect(0,0,32,4); c.fillStyle='#9ec8f4'; c.fillRect(0,3,32,1); c.fillStyle='#fff4fa'; [3,9,15,21,27].forEach(px=>{ c.fillRect(px,1,2,1); }); }, true) });
  { const sg = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.55, 0.14), signMat); sg.position.set(0, G+2.85, 4.95); g.add(sg); }
  box(g, 12.6, 0.03, 9, '#ffffff', 0, G, 0, 'world', { map:checker('#f8f4f8','#e0d8f0', 12, 8) });
  const SC = ['#ff9ec4','#9ec8f4','#c8f4dc','#f4e49e','#d8b4f4','#f4b49e','#ffffff','#f8d0a0'];
  [2.15, -0.15].forEach((lz, gi)=>{ box(g, 6.0,1.45,0.16, '#ece4f0', 2.0,G,lz, 'world', { round:0.02 }); box(g, 6.0,0.155,0.7, '#ddd4e6', 2.0,G,lz, 'world', { round:0.02 });
    for (let k=0;k<3;k++) [-1,1].forEach(sd=>{ if (k) box(g, 6.0, 0.025, 0.27, '#ddd4e6', 2.0, G+0.13+k*0.44, lz+sd*0.215);
      for (let j=0;j<8;j++) box(g, 0.66, 0.2 + ((j+k+gi)%3)*0.05, 0.2, SC[(j*3 + k + gi + (sd>0?1:0)) % SC.length], -0.6 + j*0.74, G+0.155+k*0.44, lz+sd*0.22, 'world', { round:0.02 }); }); });
  const fridgeMat = new THREE.MeshBasicMaterial({ color:'#dcf2ff' });
  for (let i=0;i<7;i++){ const lx = 5.4 - i*1.2; box(g, 1.15,2.1,0.65, '#e0d8ec', lx,G,-2.3, 'world', { round:0.02 }); const f = new THREE.Mesh(new THREE.BoxGeometry(0.98,1.8,0.04), fridgeMat); f.position.set(lx, G+1.12, -1.96); g.add(f);
    for (let k=0;k<4;k++) box(g, 0.9, 0.24, 0.3, SC[(i*2 + k) % SC.length], lx, G+0.3+k*0.44, -2.2, 'world', { round:0.03 }); }
  box(g, 0.65,1.0,2.6, '#f4c8dc', -4.0,G,1.45, 'world', { round:0.03 }); box(g, 0.75,0.06,2.7, '#fbf4f8', -4.0,G+1.0,1.45);
  box(g, 0.38,0.28,0.34, '#4a4258', -4.0,G+1.06,2.25, 'world', { round:0.03 }); box(g, 0.5,0.45,0.45, '#e8d0b8', -4.0,G+1.06,1.25, 'world', { round:0.04 }); glass(g, 0.52,0.4,0.47, -4.0,G+1.08,1.25);
  box(g, 0.4,0.6,0.4, '#d8d4e0', -4.0,G+1.06,0.45, 'world', { round:0.05 });
  for (let k=0;k<3;k++) box(g, 1.6,0.05,0.3, '#e0d0e8', -6.0,G+1.3+k*0.45,-1.55); for (let i=0;i<12;i++) box(g, 0.12,0.22,0.12, SC[i%6], -5.4-(i%4)*0.4+0.0,G+1.36+Math.floor(i/4)*0.45,-1.55);
  box(g, 4.4,1.1,0.35, '#e8d8f0', 3.7,G,4.3, 'world', { round:0.03 }); for (let i=0;i<14;i++) box(g, 0.28,0.36,0.03, SC[i%6], 5.6-i*0.3,G+0.55+(i%2)*0.2,4.11);
  box(g, 0.6,1.5,0.5, '#d8d8e8', 5.8,G,-1.15, 'world', { round:0.04 }); box(g, 0.4,0.3,0.03, '#9ec8f4', 5.8,G+1.0,-0.89);
  // in front: two vending machines against the wall, two bins, a few bicycles
  vendingIn(kit, g, -5.4, 5.35, 0, '#f4a8c8'); vendingIn(kit, g, -4.3, 5.35, 0, '#a8c8f4');
  [-2.9, -2.4].forEach((lx, i)=>{ box(g, 0.45,0.85,0.45, ['#9ab8c8','#c8b8d8'][i], lx,G,5.15, 'world', { round:0.08 }); });
  [3.2, 4.0, 4.8].forEach((lx, i)=>bikeIn(kit, g, lx, 5.9, Math.PI/2, ['#f4a8c8','#a8c8f4','#fff0a8'][i]));
  g.position.set(x, 0, z); g.rotation.y = rot; seal(B); return { b:B, g, footprint:FOOTPRINT.store };
}

/* ---------- streets around them: jhouse in different shapes ----------
   house:     index's jhouse home (door with canopy, mailbox, lamp, pots; windows on every side; balconies; flat / mono / gable roof)
   shopHouse: a shop below and a home above — jhouse with a shop front; kind sets what shows: an open shop with its goods outside,
              or a repair shop / a shop that never opens with the shutter down
   shed / bikeShed: small back-alley buildings */
export function buildHouse(kit, o){ return jhouseAt(kit, { balcony:true, ...o }); }
export function buildShopHouse(kit, o){
  const { G, building, box, group, seal } = kit, { x, z, rot = 0, w, d, kind = 'grocery', name = 'shop' } = o;
  const closed = kind === 'repair' || kind === 'shut';
  const h = jhouseAt(kit, { floors:2, roof:'flat', ...o, shop:true, closed, awning:closed ? null : (o.awning || '#f4b8c8'), sign:o.sign || (closed ? '#b8bcc8' : '#f4d8a8') });
  if (!closed){ const op = openShop(kit, h, { x, z, rot, w, d, floors:o.floors || 2, color:o.color, skin:o.skin, mode:'niche', depth:1.35, floorTex:'plank', name });
    if (op){ nicheGoods(kit, op.R, kind, name, w, d/2, 1.35); h.room = op.room; } }
  const out = building(name + '-out'), g = out.g, fz = d/2;
  if (kind === 'grocery'){ [-1, 0, 1].forEach((k)=>{ const lx = k*Math.min(1.3, w/4); box(g, 1.0, 0.55, 0.6, '#c8a890', lx, G, fz + 0.55, 'world', { round:0.03 }); for (let j=0;j<4;j++) box(g, 0.2, 0.2, 0.2, ['#f4a070','#a8d890','#f4e070','#e87a8a'][(j + k + 3) % 4], lx - 0.33 + j*0.22, G + 0.55, fz + 0.55, 'world', { round:0.09 }); }); }
  if (kind === 'books'){ box(g, Math.min(2.4, w - 1.6), 0.9, 0.5, '#c8b8a0', -w/4, G, fz + 0.45); for (let j=0;j<8;j++) box(g, 0.2, 0.3, 0.06, ['#f4c8d8','#c8d8f4','#fff0c8','#c8e4d8'][j%4], -w/4 - 1 + j*0.27, G + 0.9, fz + 0.45); }
  if (kind === 'clock'){ box(g, 0.15, 0.15, 0.15, '#3a3448', 0, G + 3.4, fz + 0.3); }
  if (kind === 'repair'){ [[-w/2 + 0.9, fz + 0.7], [-w/2 + 1.6, fz + 0.7]].forEach(([lx, lz])=>{ box(g, 0.62, 0.62, 0.22, '#3a3448', lx, G, lz, 'world', { round:0.08 }); }); bikeIn(kit, g, w/2 - 1.0, fz + 0.9, 0, '#a8c8f4'); box(g, 0.5, 0.7, 0.4, '#e05a6a', 0.4, G, fz + 0.5, 'world', { round:0.04 }); }
  if (kind === 'shut'){ box(g, 0.6, 0.4, 0.02, '#fbf4f6', 0, G + 1.4, fz + 0.24); }
  if (kind !== 'shut') plantIn(kit, g, w/2 - 0.45, fz + 0.45, 0.28);
  g.position.set(x, 0, z); g.rotation.y = rot; seal(out); return h;
}
export function buildShed(kit, { x, z, rot = 0, w = 3.0, d = 2.2, name = 'shed', color = '#d8d4e2' }){
  const { G, building, bb, seal } = kit, B = building(name), g = B.g;
  bb(B, w, 2.2, d, color, 0, G, 0, { round:0.03 }); const r = bb(B, w + 0.3, 0.1, d + 0.4, '#8a90a8', 0, G + 2.25, 0); r.rotation.x = 0.12;
  bb(B, 0.9, 1.8, 0.05, '#b8b4c8', -w/4, G, d/2 + 0.02); bb(B, 0.05, 1.0, 0.05, '#c8ccd8', w/2 - 0.2, G + 2.2, d/2 - 0.2);
  g.position.set(x, 0, z); g.rotation.y = rot; seal(B); return { b:B, g };
}
export function buildBikeShed(kit, { x, z, rot = 0, w = 5.0, d = 2.2, name = 'bikes' }){
  const { G, building, bb, box, seal } = kit, B = building(name), g = B.g;
  bb(B, w + 0.4, 0.08, d + 0.6, '#a8c0e0', 0, G + 2.2, 0); [-1, 1].forEach(sx=>bb(B, 0.08, 2.2, 0.08, '#8a9ab8', sx*w/2, G, -d/2 + 0.1)); bb(B, w, 1.0, 0.04, '#dce8f4', 0, G + 0.9, -d/2, { transparent:true, opacity:0.5 });
  const C = ['#f4a8c8','#a8c8f4','#fff0a8','#c8e4d8','#d8c8f4','#f4c8a8'];
  for (let i=0;i<Math.floor(w/0.6);i++) if (i % 4 !== 3) bikeIn(kit, g, -w/2 + 0.4 + i*0.6, 0, Math.PI/2, C[i%6]);
  g.position.set(x, 0, z); g.rotation.y = rot; seal(B); return { b:B, g };
}

/* ---------- the tram car (index.html: makeTram, one of its two 12 m sections, made into a car with a cab at both ends) ----------
   Local frame: the car runs along +z, its middle at the origin, its floor frame at y 0 = 0.06 below the rail tops (as index sets it).
   From index: the pink lower body, the white band and roof, the window pillars, the long side glass, the seats behind it, the roof box
   and pantograph, the four bogies. Added for a car that runs on its own: cab ends with windscreens, two pairs of doors a side, head and
   tail lights, a destination board, wheels sitting on the rails (gauge 1.44 m as the map's track), a skirt over the running gear.
   The pieces are merged into one opaque mesh and one glass mesh, so a car costs two draw calls. */
export function buildTramCar(kit, { name = 'tram' } = {}){
  /* A car people really ride in (2026-11-18). The outside keeps index's look (pink lower body, white band and roof, pillars and long
     side glass, roof box, pantograph, cab ends, lights); the inside is hollow: a low floor 0.45 m above the floor frame (level with the
     0.6 m platforms), 2.15 m to the ceiling, long bench seats along both sides, poles and hand rails, a driver's desk at each end, ceiling
     lights. Two doorways a side (1.3 m) with sliding leaves that open at stops. Everything that never moves inside the car is merged into
     one mesh that rides with the car (it is never baked into the world). */
  const { THREE, box, glass, dreamC, mergeGeometries } = kit;
  const g = new THREE.Group(), parts = new THREE.Group(); g.add(parts);
  const b = (w,h,d,col,x,y,z,r=0.03) => box(parts, w,h,d, col, x,y,z, 'world', { round:r });
  const L = 12.0, HW = 1.3, FL = TRAM_CAR.floor, WIN0 = 1.25, WIN1 = 2.45, ROOF = 2.6, DOORS = TRAM_CAR.doors, DW = TRAM_CAR.doorW;
  const PINK = '#f4b8c8', WHITE = '#fbf4f6';
  // running gear and floor: a skirt under the floor (bogie wells), the floor slab, a dark rubber floor inside
  b(2.3, FL - 0.08, L - 0.4, '#d8a0b4', 0, 0.0, 0, 0.04); b(2.5, 0.08, L, '#cfc6d6', 0, FL - 0.08, 0, 0.01); b(2.36, 0.012, L - 0.2, '#8e8aa0', 0, FL, 0, 0);
  // the sides, with the doorways cut out: lower panel, pillars between the windows, the band above, the glass
  const segs = []; { let a = -L/2; [...DOORS].sort((p,q)=>p-q).forEach(dz=>{ segs.push([a, dz - DW/2]); a = dz + DW/2; }); segs.push([a, L/2]); }
  [-1, 1].forEach(sx=>{ const x = sx*(HW - 0.04);
    segs.forEach(([z0, z1])=>{ const zc = (z0 + z1)/2, len = z1 - z0;
      b(0.08, WIN0 - 0.3, len, PINK, x, 0.3, zc, 0.02);                                    // lower panel (outside pink, its inside shows the same)
      b(0.1, 0.06, len, '#e8dce4', x - sx*0.02, WIN0 - 0.03, zc, 0.01);                    // the window sill inside
      glass(parts, 0.04, WIN1 - WIN0, len - 0.1, x, WIN0, zc);
      const n = Math.max(1, Math.round(len/2.2)); for (let i=0;i<=n;i++) b(0.1, WIN1 - WIN0, 0.12, PINK, x, WIN0, z0 + 0.06 + i*(len - 0.12)/n, 0.01); });
    b(0.08, ROOF - WIN1, L, WHITE, x, WIN1, 0, 0.01);                                       // the white band runs over the doors
    DOORS.forEach(dz=>{ [-1, 1].forEach(e=>b(0.12, WIN1 - 0.3, 0.1, '#e8a0b8', x, 0.3, dz + e*(DW/2 + 0.02), 0.01)); b(0.12, 0.12, DW + 0.2, '#e8a0b8', x, 2.33, dz, 0.01);   // door frames
      b(0.3, 0.05, DW, '#8a8098', sx*(HW - 0.05), FL - 0.05, dz, 0.01); b(0.04, 0.02, DW, '#ffd24a', sx*(HW - 0.05), FL, dz, 0); }); });   // the threshold with its yellow edge
  // roof, ceiling, roof box, pantograph
  b(2.62, 0.14, L, WHITE, 0, ROOF, 0, 0.05); b(2.5, 0.42, L - 0.4, WHITE, 0, ROOF + 0.14, 0, 0.18); b(2.3, 0.03, L - 0.3, '#f4f0f6', 0, ROOF - 0.03, 0, 0);
  b(0.6, 0.6, 1.0, '#5a5470', 0, ROOF + 0.55, 0); b(1.4, 1.2, 0.06, '#5a5470', 0, ROOF + 1.15, 0, 0.01);
  // cab ends: a rounded nose, the windscreen, lights, the destination board; a driver's desk inside
  [-1, 1].forEach(e=>{ const zc = e*(L/2);
    b(2.6, WIN0 - 0.3 + 0.0, 0.3, PINK, 0, 0.3, zc + e*0.1, 0.12); b(2.5, ROOF - WIN1, 0.3, WHITE, 0, WIN1, zc + e*0.1, 0.05); b(2.62, 0.14, 0.32, WHITE, 0, ROOF, zc + e*0.1, 0.05);
    glass(parts, 2.2, WIN1 - WIN0, 0.06, 0, WIN0, zc + e*0.22); [-1, 1].forEach(sx=>b(0.16, WIN1 - WIN0, 0.14, PINK, sx*1.18, WIN0, zc + e*0.2, 0.02));
    b(1.4, 0.32, 0.06, '#2e2a3e', 0, 2.2, zc + e*0.27, 0.02);
    b(2.3, 0.5, 0.55, '#6a6280', 0, FL, zc - e*0.42, 0.04); b(2.3, 0.06, 0.5, '#3a3448', 0, FL + 0.5, zc - e*0.4, 0.02);   // the desk (a low console, under the windscreen)
    b(1.9, 1.15, 0.05, '#e8dce4', 0, FL + 0.55, zc - e*0.72, 0.01);                       // the partition behind the cab: waist-high, then open
    const hl = new THREE.MeshBasicMaterial({ color:'#fff2c8' }), tl = new THREE.MeshBasicMaterial({ color:'#ff6a7a' });
    [-0.85, 0.85].forEach(sx=>{ const m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.06), e > 0 ? hl : tl); m.position.set(sx, 0.62, zc + e*0.27); parts.add(m); }); });
  // bench seats along both sides between the doors and the cabs: a cushion 0.45 m above the floor, a back against the wall under the glass
  TRAM_CAR.benches.forEach(([z0, z1])=>[-1, 1].forEach(sx=>{ const zc = (z0 + z1)/2, len = z1 - z0;
    b(0.46, 0.38, len, '#7a6a90', sx*(HW - 0.33), FL, zc, 0.04); b(0.5, 0.08, len, '#c8a8d8', sx*(HW - 0.33), FL + 0.38, zc, 0.04);
    b(0.1, 0.5, len, '#c8a8d8', sx*(HW - 0.13), FL + 0.46, zc, 0.04); }));
  // poles and rails to hold on to
  [...DOORS.flatMap(dz=>[dz - DW/2 - 0.15, dz + DW/2 + 0.15]), -1.2, 1.2].forEach(z=>[-1, 1].forEach(sx=>b(0.045, ROOF - FL - 0.03, 0.045, '#d8d4e0', sx*0.62, FL, z, 0.01)));
  [-1, 1].forEach(sx=>b(0.04, 0.04, L - 1.6, '#d8d4e0', sx*0.62, 2.08, 0, 0.01));
  // bogies, wheels on the rails (gauge 1.44 m), a skirt over the running gear
  [-3, 3].forEach(z0=>[-1, 1].forEach(sx=>b(0.25, 0.45, 2.2, '#5a5470', sx*0.95, 0.0, z0, 0.06)));
  const wm = new THREE.MeshLambertMaterial({ color:dreamC('#3a3448') });
  [-3, 3].forEach(z0=>[-0.6, 0.6].forEach(dz=>[-0.72, 0.72].forEach(x=>{ const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 12), wm); w.rotation.z = Math.PI/2; w.position.set(x, 0.32, z0 + dz); parts.add(w); })));
  // merged: everything opaque in one mesh (vertex colours), the glass in another
  parts.updateMatrixWorld(true); const op = [], gl = []; let glassMat = null;
  parts.traverse(m=>{ if (!m.isMesh) return; let geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); geo.applyMatrix4(m.matrixWorld);
    for (const k of Object.keys(geo.attributes)) if (!['position','normal'].includes(k)) geo.deleteAttribute(k);
    if (m.material.transparent){ glassMat = m.material; gl.push(geo); return; }
    const c = m.material.color, n = geo.attributes.position.count, a = new Float32Array(n*3); for (let i=0;i<n;i++){ a[i*3] = c.r; a[i*3+1] = c.g; a[i*3+2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); op.push(geo); });
  g.remove(parts);
  const body = new THREE.Mesh(mergeGeometries(op, false), new THREE.MeshLambertMaterial({ vertexColors:true, flatShading:true })); body.castShadow = true; body.receiveShadow = true; g.add(body);
  if (gl.length){ const gm = new THREE.Mesh(mergeGeometries(gl, false), glassMat); gm.renderOrder = 2; g.add(gm); }
  op.concat(gl).forEach(x=>x.dispose());
  // ceiling lights: a strip down the middle, lit at night (the page sets its colour with the hour)
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, L - 1.2), new THREE.MeshBasicMaterial({ color:'#f4ece8' })); lamp.position.set(0, ROOF - 0.05, 0); g.add(lamp); g.userData.lamp = lamp;
  // the door leaves: two per doorway and side, each slides along the car (open 0..1 per side: g.userData.doors[side] with side −1 / +1)
  const leaves = { '-1':[], '1':[] }, leafG = new THREE.BoxGeometry(0.05, WIN1 - FL - 0.12, DW/2 - 0.02);
  const leafM = new THREE.MeshLambertMaterial({ color:dreamC('#e8a0b8'), flatShading:true }), leafWin = new THREE.MeshLambertMaterial({ color:dreamC('#b8c8e8'), flatShading:true });
  const winG = new THREE.BoxGeometry(0.06, 0.9, DW/2 - 0.22);
  [-1, 1].forEach(sx=>DOORS.forEach(dz=>[-1, 1].forEach(e=>{ const lg = new THREE.Group(), m = new THREE.Mesh(leafG, leafM), w = new THREE.Mesh(winG, leafWin);
    m.position.y = (WIN1 - FL - 0.12)/2; w.position.y = 1.25; m.castShadow = true; lg.add(m, w); const z0 = dz + e*(DW/4); lg.position.set(sx*(HW - 0.03), FL, z0); g.add(lg);
    leaves[sx].push({ g:lg, z0, e }); })));
  g.userData.leaves = leaves; g.userData.doorOpen = { '-1':0, '1':0 };
  g.userData.dyn = true; g.name = name; return g;
}
// opens the doors on one side (0 shut … 1 open); the leaves slide back over the panels beside the doorway
export function setTramDoors(g, side, k){ const L = g.userData.leaves[side]; if (!L) return; g.userData.doorOpen[side] = k;
  L.forEach(l=>{ l.g.position.z = l.z0 + l.e*k*(TRAM_CAR.doorW/2 - 0.04); l.g.position.x = side*(1.3 - 0.03) + side*0.07*Math.min(1, k*4); }); }
/* the car's inside, in its own frame (z along the car, x across, floor at y = floor): where one can stand (the aisle and the two door
   vestibules), the seats (each a place facing the aisle), the doorways. */
export const TRAM_CAR = { length:12.6, bogies:3.0, floor:0.45, ceiling:2.6, doors:[-2.9, 2.9], doorW:1.3, halfW:1.3,
  benches:[[-5.15, -3.75], [-2.05, 2.05], [3.75, 5.15]],
  aisle:{ x:0.68, z:5.2 },                               // standing room: |x| < aisle.x along the car, |z| < aisle.z
  vest:0.6 };                                            // a door vestibule: |z − door| < vest, right across the car
TRAM_CAR.seats = TRAM_CAR.benches.flatMap(([z0, z1])=>{ const n = Math.floor((z1 - z0)/0.55), out = []; for (let i=0;i<n;i++){ const z = z0 + (i + 0.5)*(z1 - z0)/n; [-1, 1].forEach(sx=>out.push({ x:sx*(1.3 - 0.36), z, face:-sx })); } return out; });

/* ---------- index's car (makeCar): body, hood and trunk, roof on six pillars, a pale stripe, glass all round, a dashboard with a gauge,
   a steering wheel, two front seats and a back bench, mirrors, four wheels with hubs, head and tail lights, and (when it drives) a driver
   (index's makeRider). Front = +x, the wheels' bottom at y = −0.06 (set the group 0.06 above the road). merge: one opaque mesh + one glass
   mesh (a car that drives costs two draw calls); otherwise plain boxes the page's bake merges with the town (parked cars). ---------- */
export const CAR = { length:3.82, width:1.72, height:1.68, wheelLift:0.06, mirrors:2.0 };
export function buildCar(kit, { color = '#7aa6d6', driver = null, merge = false, scale = 1 } = {}){
  const { THREE, box, glass, dreamC, bulbMat, mergeGeometries } = kit;
  const g = new THREE.Group(), parts = new THREE.Group(); g.add(parts); parts.scale.setScalar(scale);
  const b = (w,h,d,col,x,y,z,r=0.06) => box(parts, w,h,d, col, x,y,z, 'world', { round:r });
  b(3.8,0.5,1.7, color, 0,0.22,0, 0.14); b(1.1,0.16,1.66, color, 1.3,0.72,0, 0.08); b(0.7,0.16,1.66, color, -1.5,0.72,0, 0.08); b(2.0,0.08,1.6, color, -0.25,1.64,0, 0.04);
  [[0.72,0.72],[0.72,-0.72],[-1.2,0.72],[-1.2,-0.72],[-0.25,0.76],[-0.25,-0.76]].forEach(([x,z])=>b(0.08,0.9,0.08, color, x,0.76,z, 0.02));
  b(3.82,0.1,1.72, '#e4dcea', 0,0.5,0, 0.03);
  glass(parts, 0.04,0.8,1.36, 0.72,0.82,0); glass(parts, 0.04,0.76,1.36, -1.2,0.84,0); [-0.79,0.79].forEach(z=>glass(parts, 1.84,0.74,0.03, -0.24,0.86,z));
  b(0.3,0.26,1.5, '#4a4258', 0.55,0.72,0, 0.05); b(0.06,0.08,0.3, '#ffc8d8', 0.4,0.86,-0.38, 0.02);
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.16,0.025,6,14), new THREE.MeshLambertMaterial({ color:dreamC('#2a2630'), flatShading:true })); sw.position.set(0.36,0.95,-0.38); sw.rotation.y = Math.PI/2; sw.rotation.x = 0.35; parts.add(sw);
  b(0.05,0.05,0.25, '#2a2630', 0.46,0.88,-0.38, 0.01);
  [[-0.05,-0.38],[-0.05,0.38]].forEach(([x,z])=>{ b(0.46,0.12,0.5, '#6a5a7a', x,0.5,z, 0.05); b(0.12,0.62,0.5, '#6a5a7a', x-0.26,0.56,z, 0.05); });
  b(0.5,0.12,1.3, '#6a5a7a', -0.95,0.5,0, 0.05); b(0.12,0.56,1.3, '#6a5a7a', -1.18,0.56,0, 0.05);
  b(0.04,0.08,0.22, '#cfc8dc', 0.6,1.46,0, 0.02); [-0.9,0.9].forEach(z=>b(0.14,0.1,0.12, color, 0.62,0.98,z, 0.03));
  const wg = new THREE.CylinderGeometry(0.33,0.33,0.24,14), hg = new THREE.CylinderGeometry(0.17,0.17,0.26,10);
  const wmat = new THREE.MeshLambertMaterial({ color:dreamC('#2a2a32'), flatShading:true }), hmat = new THREE.MeshLambertMaterial({ color:dreamC('#d8d4e0'), flatShading:true });
  [[1.25,0.82],[1.25,-0.82],[-1.25,0.82],[-1.25,-0.82]].forEach(([x,z])=>{ [[wg, wmat], [hg, hmat]].forEach(([gg, mm])=>{ const w = new THREE.Mesh(gg, mm); w.rotation.x = Math.PI/2; w.position.set(x, 0.27, z); w.castShadow = true; parts.add(w); }); });
  const tail = new THREE.MeshBasicMaterial({ color:'#ff6a8a' });
  [-0.55,0.55].forEach(z=>{ const h = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.14,0.32), bulbMat); h.position.set(1.91,0.5,z); parts.add(h); const t = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.12,0.3), tail); t.position.set(-1.91,0.52,z); parts.add(t); });
  if (driver){ const c = driver, d = new THREE.Group(); d.position.set(-0.05, 0.56, -0.38); d.scale.setScalar(0.82); parts.add(d);           // index's makeRider (driving)
    const r = (w,h,dd,col,px,py,pz,rr=0.04) => box(d, w,h,dd, col, px,py,pz, 'world', { round:rr });
    r(0.46,0.17,0.38, c.pants, 0.14,0,0, 0.06); r(0.16,0.42,0.34, c.pants, 0.38,-0.38,0, 0.05); r(0.3,0.64,0.44, c.coat, -0.08,0.12,0, 0.08); r(0.12,0.1,0.12, c.skin, -0.06,0.8,0, 0.03);
    [-1,1].forEach(sg=>{ r(0.4,0.12,0.12, c.coat, 0.12,0.62,sg*0.2, 0.04); r(0.1,0.1,0.1, c.skin, 0.36,0.62,sg*0.17, 0.03); });
    r(0.32,0.34,0.3, c.skin, -0.06,1.0,0, 0.08); r(0.35,0.12,0.33, c.hair, -0.08,1.14,0, 0.05); r(0.12,0.28,0.33, c.hair, -0.18,1.02,0, 0.04);
    [-1,1].forEach(sg=>r(0.02,0.05,0.04, '#2a2430', 0.1,1.03,sg*0.07, 0)); }
  if (merge){ parts.updateMatrixWorld(true); const op = [], gl = [], basic = new Map(); let glassMat = null;
    parts.traverse(m=>{ if (!m.isMesh) return; let geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); m.updateWorldMatrix(true, false); geo.applyMatrix4(new THREE.Matrix4().copy(g.matrixWorld).invert().multiply(m.matrixWorld));
      for (const k of Object.keys(geo.attributes)) if (!['position','normal'].includes(k)) geo.deleteAttribute(k);
      if (m.material.transparent){ glassMat = m.material; gl.push(geo); return; }
      if (m.material.isMeshBasicMaterial){ if (!basic.has(m.material)) basic.set(m.material, []); basic.get(m.material).push(geo); return; }
      const c = m.material.color, n = geo.attributes.position.count, a = new Float32Array(n*3); for (let i=0;i<n;i++){ a[i*3] = c.r; a[i*3+1] = c.g; a[i*3+2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); op.push(geo); });
    g.remove(parts);
    const body = new THREE.Mesh(mergeGeometries(op, false), new THREE.MeshLambertMaterial({ vertexColors:true, flatShading:true })); body.castShadow = true; body.receiveShadow = true; g.add(body);
    if (gl.length){ const gm = new THREE.Mesh(mergeGeometries(gl, false), glassMat); gm.renderOrder = 2; g.add(gm); }
    basic.forEach((list, mat)=>{ const m = new THREE.Mesh(mergeGeometries(list, false), mat); g.add(m); list.forEach(x=>x.dispose()); });
    op.concat(gl).forEach(x=>x.dispose()); }
  g.userData.car = { hx:1.92*scale, hz:0.88*scale, h:1.68*scale };
  return g;
}
/* a person sitting (index's sit pose for buildPerson): thighs forward, shins down, arms resting. The group's y is set by the caller so the
   seat of the trousers is on the seat: hip height standing is LL·S; sitting it should be seatTop + 0.06. */
export function sitPose(pp){ for (let i=0;i<2;i++){ pp.legs[i].rotation.z = Math.PI/2; pp.shins[i].rotation.z = -Math.PI/2; pp.feet[i].rotation.z = 0; pp.arms[i].rotation.z = 0.35; pp.fores[i].rotation.z = 0.9; }
  pp.up.rotation.set(0, 0, 0); pp.mv = 0; }


/* ---------- people (index.html: makePerson / walkTo — the same blocky bodies with knees and elbows, life-size) ----------
   Copied without the parts that belong to index's other systems (dream fading, the camera's own person, umbrellas, sitting):
   the body is built exactly as in index at PS = 0.82 and walks with the same leg, knee, foot and arm swing. */
export function buildPerson(kit, c, o = {}){
  const { box, group, G, scene } = kit, PS = 0.82;
  const S = (o.s||1)*PS, Hm = o.h||1, Wm = o.w||1, HS = o.head||1;
  const LL = 0.85*Hm, TH = 0.75*Hm, TW = 0.5*Wm, HD = 0.38*HS, AL = 0.62*Hm;
  const p = group(scene, 0, G, 0); p.scale.setScalar(S); p.userData.person = true; p.userData.dyn = true;
  const b = (par, w,h,d, col, x,y,z, r=0.05) => box(par, w,h,d, col, x,y,z, 'person', { round:r });
  const UL = LL*0.52, LO = LL - UL, legs = [], shins = [], feet = [];
  [-1,1].forEach(sg=>{ const l = group(p, 0, LL, sg*0.12*Wm); b(l, 0.2,UL+0.04,0.2, c.pants, 0,-UL-0.02,0, 0.06);
    const sh = group(l, 0, -UL, 0); b(sh, 0.17,LO,0.17, o.skirt ? c.skin : c.pants, 0,-LO,0, 0.05);
    const ft = group(sh, 0, -LO, 0); b(ft, 0.3,0.1,0.19, c.shoes||'#2a2a30', 0.05,-0.02,0, 0.04); b(ft, 0.31,0.03,0.2, '#e8e2ea', 0.05,-0.03,0, 0.01);
    legs.push(l); shins.push(sh); feet.push(ft); });
  const up = group(p, 0, LL, 0);
  b(up, 0.3*Wm, 0.22, TW*0.92, c.pants, 0,-0.08,0, 0.06); b(up, 0.34*Wm, TH*0.62, TW, c.coat, 0,0.1,0, 0.08); b(up, 0.38*Wm, TH*0.42, TW+0.06, c.coat, 0,TH*0.56,0, 0.09);
  b(up, 0.2, 0.06, 0.22, c.collar||'#f2eef4', 0.1*Wm,TH*0.94,0, 0.02);
  if (o.skirt) b(up, 0.5*Wm, 0.55, TW+0.14, c.skirt||c.coat, 0,-0.5,0, 0.06);
  if (c.scarf) b(up, 0.4*Wm, 0.13, TW+0.08, c.scarf, 0,TH*0.92,0, 0.05);
  if (o.apron) b(up, 0.04, TH*0.95, TW*0.86, o.apron, 0.19*Wm, -0.05, 0, 0.01);
  if (o.pack){ b(up, 0.24, 0.48*Hm, TW*0.8, o.pack, -0.29*Wm, TH*0.25, 0, 0.07); b(up, 0.08, 0.14, TW*0.6, o.pack, -0.42*Wm, TH*0.3, 0, 0.03); }
  const arms = [], fores = [];
  [-1,1].forEach(sg=>{ const a = group(up, 0, TH-0.06, sg*(TW/2+0.08)); b(a, 0.15,AL*0.52,0.15, c.sleeve||c.coat, 0,-AL*0.52,0, 0.06);
    const fa = group(a, 0, -AL*0.5, 0); b(fa, 0.13,AL*0.5,0.13, c.sleeve||c.coat, 0,-AL*0.5,0, 0.05); b(fa, 0.12,0.14,0.11, c.skin, 0.01,-AL*0.5-0.14,0, 0.05);
    arms.push(a); fores.push(fa); });
  if (o.bag) b(fores[0], 0.12,0.32,0.3, o.bag, 0,-AL*0.5-0.42,0, 0.04);
  const head = group(up, 0, TH+0.08, 0); head.rotation.order = 'YXZ';
  b(up, 0.14,0.12,0.14, c.skin, 0,TH-0.02,0, 0.04); b(head, HD,HD*1.08,HD*0.94, c.skin, 0,0,0, 0.1);
  [-1,1].forEach(sg=>b(head, 0.06,0.1,0.04, c.skin, -0.01, HD*0.4, sg*HD*0.5, 0.015));
  b(head, 0.05,0.07,0.06, c.skin, HD/2+0.02, HD*0.38, 0, 0.015); b(head, 0.02,0.02,0.1, '#b0606a', HD/2+0.002, HD*0.18, 0, 0.005);
  const hc = c.hair || '#2a2220', cap = () => b(head, HD+0.05, HD*0.4, HD*0.98+0.04, hc, -0.02, HD*0.82, 0, 0.08);
  if (o.hair === 'long'){ cap(); b(head, 0.13, HD*1.55, HD+0.06, hc, -HD/2-0.03, HD*0.0, 0, 0.05); }
  else if (o.hair === 'cap'){ b(head, HD+0.07, HD*0.38, HD+0.07, o.capC||'#444', 0, HD*0.86, 0, 0.08); b(head, 0.22, 0.04, HD*0.9, o.capC||'#444', HD/2+0.09, HD*0.72, 0, 0.015); }
  else cap();
  [-1,1].forEach(sg=>{ b(head, 0.02, 0.06, 0.05, '#2a2430', HD/2+0.005, HD*0.6, sg*HD*0.22, 0.01); b(head, 0.02, 0.02, 0.07, hc, HD/2+0.005, HD*0.72, sg*HD*0.22, 0.005); });
  // each moving part (a thigh, a shin, a foot, the upper body, an arm, a forearm, the head) becomes one mesh: the walk moves the same groups
  // as in index, but a person costs about a dozen draw calls instead of forty
  if (kit.mergeGeometries){ const THREE = kit.THREE; p.updateMatrixWorld(true);
    const groupsOf = []; p.traverse(o=>{ if (o.isGroup || o === p) groupsOf.push(o); });
    groupsOf.forEach(gr=>{ const ms = gr.children.filter(c=>c.isMesh); if (ms.length < 2) return; const geos = ms.map(c=>{ const gg = (c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone()); c.updateMatrix(); gg.applyMatrix4(c.matrix);
        for (const k of Object.keys(gg.attributes)) if (!['position','normal'].includes(k)) gg.deleteAttribute(k); const col = c.material.color, n = gg.attributes.position.count, arr = new Float32Array(n*3); for (let i=0;i<n;i++){ arr[i*3] = col.r; arr[i*3+1] = col.g; arr[i*3+2] = col.b; } gg.setAttribute('color', new THREE.BufferAttribute(arr, 3)); return gg; });
      ms.forEach(c=>gr.remove(c)); const mm = new THREE.Mesh(kit.mergeGeometries(geos, false), new THREE.MeshLambertMaterial({ vertexColors:true, flatShading:true })); mm.castShadow = true; gr.add(mm); geos.forEach(g2=>g2.dispose()); }); }
  return { g:p, legs, shins, feet, arms, fores, head, up, LL, S, HD, last:0, mv:0, seed:Math.random()*9, freq:o.freq||7, swing:o.swing??0.5, bounce:o.bounce??0.04, stride:o.stride??0.55 };
}
// index's walkTo, unchanged in what it does to the body (the camera's own person and the waving are left out)
export function walkPose(pp, x, z, ang, moving, t, dt, y){
  const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  if (moving && pp.lwx !== undefined && dt > 0 && Math.hypot(x - pp.lwx, z - pp.lwz) < 1e-4) moving = false;
  pp.lwx = x; pp.lwz = z;
  pp.mv += ((moving ? 1 : 0) - pp.mv)*(1 - Math.exp(-dt*5));
  const m = pp.mv, ph = t*pp.freq, sw = Math.sin(ph);
  pp.g.position.set(x, y + Math.abs(Math.cos(ph))*pp.bounce*m, z);
  pp.g.rotation.y += wrapA(ang - pp.g.rotation.y) * (1 - Math.exp(-dt*6));
  const kk = 1 - Math.exp(-dt*14);
  for (let i=0;i<2;i++){ const sg = i ? -1 : 1, th = sw*sg*pp.stride*m, kn = -(0.08 + 1.0*Math.max(0, Math.cos(ph)*sg))*m;
    pp.legs[i].rotation.z += (th - pp.legs[i].rotation.z)*kk; pp.shins[i].rotation.z += (kn - pp.shins[i].rotation.z)*kk; pp.feet[i].rotation.z += (-(th + kn)*0.5 - pp.feet[i].rotation.z)*kk;
    const ar = -sw*sg*pp.swing*m; pp.arms[i].rotation.z += (ar - pp.arms[i].rotation.z)*kk; pp.fores[i].rotation.z += (0.12 + 0.45*Math.max(0, ar) + 0.1*m - pp.fores[i].rotation.z)*kk; }
  pp.up.rotation.y = sw*0.06*m; pp.up.rotation.x = Math.cos(ph)*0.03*m; pp.up.scale.y = 1 + Math.sin(t*1.7 + pp.seed)*0.012*(1-m);
}

/* ---------- the 3B house (index.html: B3, a narrow modern house of three floors whose second-floor front room is real) ----------
   7 × 9.5 m, front to the south. From index: the board-clad walls, the shop-wide opening of the ground floor, the big glass of the room on the
   second floor with its balcony, the windows on every side, the door with lamp and mailbox, the single-slope roof; the room itself as far as
   the glass shows it (bed, desk with laptop, wardrobe, shelves, rack of clothes, mirror, string lights, posters, a plant).
   Index (X, Z) → local (X + 8, Z + 23.75). */
export function buildB3(kit, { x = 0, z = 0, rot = 0, name = 'b3' } = {}){
  const { THREE, G, TEX, building, bb, box, wall, glass, winOn, doorOn, onFace, texFor, seal, group, bulbMat } = kit;
  const B = building(name, 'room'), g = B.g, x0 = -3.5, x1 = 3.5, z0 = -4.75, z1 = 4.75, fh = 3.0, col = '#c8e4d4', xc = 0, zc = 0, rz = -0.65, w = x1 - x0;
  const sk = (W2, H2) => ({ map:texFor(TEX.gBoard, W2, H2, 1.4) });
  bb(B, w, fh, z1-z0, col, xc, G, zc, sk(w, fh));
  wall(B, 'x', x0, x1, z1, fh, 0.25, col, [{ a0:-2.4, a1:1.4, y0:0.15, y1:2.4 }], TEX.gBoard, 1.4, fh);
  [x0, x1].forEach(px=>bb(B, 0.25, fh, z1-rz, col, px, G+fh, (z1+rz)/2, sk(z1-rz, fh)));
  bb(B, w, fh, rz-z0, col, xc, G+fh, (rz+z0)/2, sk(w, fh)); bb(B, w-0.5, fh, 0.1, '#f6eee8', xc, G+fh, rz+0.05);
  bb(B, w-0.5, 0.1, z1-rz, '#e0c8b8', xc, G+fh, (z1+rz)/2); bb(B, w-0.5, 0.1, z1-rz, '#fbf6f4', xc, G+2*fh-0.1, (z1+rz)/2);
  [x0+0.17, x1-0.17].forEach(px=>bb(B, 0.08, fh, z1-rz, '#f6eee8', px, G+fh, (z1+rz)/2));
  bb(B, w, fh, z1-z0, col, xc, G+2*fh, zc, sk(w, fh));
  glass(g, 3.8, 2.25, 0.04, -0.5, G+fh+0.15, z1+0.02);
  bb(B, 0.06, 2.25, 0.08, '#c8ccd8', -0.5, G+fh+0.15, z1+0.06); bb(B, 3.9, 0.08, 0.08, '#c8ccd8', -0.5, G+fh+2.4, z1+0.06);
  bb(B, 4.2, 0.1, 0.9, '#ece8f0', -0.5, G+fh+0.02, z1+0.45); bb(B, 4.2, 0.8, 0.03, '#e8f0f8', -0.5, G+fh+0.12, z1+0.88); bb(B, 4.2, 0.05, 0.05, '#c8ccd8', -0.5, G+fh+0.95, z1+0.88);
  winOn(B, 'x', -2.2, z1, 1.0, 0.8, 1.1, 1, { frame:'#c8ccd8', slide:true });
  [-1.8, 1.6].forEach(px=>winOn(B, 'x', px, z1, 2*fh+0.6, 1.4, 1.6, 1, { frame:'#c8ccd8', slide:true }));
  [x0, x1].forEach((c,i)=>[0,1,2].forEach(f=>winOn(B, 'z', -2.85, c, f*fh+1.1, 0.7, 1.0, i ? 1 : -1, { frame:'#c8ccd8', slide:true, ac: f===1 && i===1 })));
  winOn(B, 'x', 0, z0, 2*fh+1.0, 1.2, 1.0, -1, { frame:'#c8ccd8', slide:true });
  doorOn(B, 'x', 0, z1, 0.95, 2.1, 1, '#e48a9a', { lamp:true, mail:'#c8ccd8', dark:true });
  onFace(B, 'x', 0, z1, 1)(1.6, 0.08, 0.9, '#f8f4f6', 0, 2.35, 0.45);
  const rise = 1.4, ang = Math.atan2(rise, (z1-z0)+0.6), roof = bb(B, w+0.6, 0.18, Math.hypot(z1-z0+0.6, rise), '#8aa0c8', xc, G+3*fh+rise/2-0.09, zc); roof.rotation.x = ang;
  bb(B, w+0.4, rise, 0.2, col, xc, G+3*fh, z0+0.1);
  // the room, 6.4 × 5 m behind the big glass
  const fy = G + fh + 0.1, X = (v) => v + 8, Z = (v) => v + 23.75, bx = (W,H,D,c,px,py,pz,o) => box(g, W,H,D, c, X(px), py, Z(pz), 'world', o);
  bx(1.25,0.3,2.0, '#c8a898', -10.45,fy,-23.2, { round:0.03 }); bx(1.25,0.18,2.0, '#ffffff', -10.45,fy+0.3,-23.2, { round:0.06 });
  bx(1.25,0.12,1.3, '#f4c8d8', -10.45,fy+0.46,-22.9, { round:0.05 }); bx(0.8,0.12,0.4, '#ffffff', -10.45,fy+0.48,-24.0, { round:0.05 });
  bx(1.3,0.6,0.06, '#c8a898', -10.45,fy,-24.25); bx(0.4,0.45,0.35, '#d8b8a8', -9.5,fy,-24.05, { round:0.03 }); bx(0.18,0.25,0.18, '#fff0c8', -9.5,fy+0.45,-24.05, { round:0.06 });
  bx(1.1,0.05,0.55, '#e0c8b0', -5.3,fy+0.72,-23.4, { round:0.02 }); [[-5.8,-23.6],[-4.85,-23.6],[-5.8,-23.2],[-4.85,-23.2]].forEach(([px,pz])=>bx(0.04,0.72,0.04, '#8a7a7a', px,fy,pz));
  bx(0.38,0.26,0.03, '#4a4258', -5.3,fy+0.8,-23.6); bx(0.34,0.02,0.24, '#d8d4e0', -5.55,fy+0.77,-23.35);
  { const c = group(g, X(-5.3), fy, Z(-22.85)); c.rotation.y = Math.PI; box(c, 0.42,0.05,0.42, '#b8c8e8', 0,0.45,0, 'world', { round:0.04 }); box(c, 0.42,0.45,0.05, '#b8c8e8', 0,0.5,-0.19, 'world', { round:0.03 }); [[-0.18,-0.18],[0.18,-0.18],[-0.18,0.18],[0.18,0.18]].forEach(([a,b2])=>box(c, 0.04,0.45,0.04, '#5a5470', a,0,b2)); }
  bx(1.0,1.9,0.55, '#e8d8c8', -6.6,fy,-24.05, { round:0.03 });
  const SC = ['#ff9ec4','#9ec8f4','#c8f4dc','#f4e49e','#d8b4f4','#f4b49e'];
  bx(0.32,1.4,0.8, '#d8c0b0', -10.95,fy,-20.2, { round:0.02 }); for (let i=0;i<4;i++) for (let k=0;k<3;k++) bx(0.22,0.26,0.12, SC[(i+k)%6], -10.9,fy+0.1+i*0.34,-20.45+k*0.24);
  bx(0.9,0.35,0.6, '#f4e4d8', -8.4,fy,-21.6, { round:0.05 }); bx(1.6,0.02,1.2, '#e8c8d8', -8.4,fy,-21.6);
  bx(0.12,0.9,0.32, '#d8a070', -6.1,fy,-20.0, { round:0.04 }); bx(0.04,1.4,0.6, '#fbfaff', -5.0,fy+0.4,-21.0);
  bx(0.9,1.4,0.04, '#c8ccd8', -5.4,fy,-19.8); [['#f4c8d8',0],['#c8d8f4',0.25],['#ffffff',0.5]].forEach(([c,dx])=>bx(0.22,0.6,0.04, c, -5.7+dx,fy+0.7,-19.85));
  { const p = group(g, X(-10.6), fy, Z(-19.8)), s = 0.3; box(p, s*1.3, s*1.3, s*1.3, '#d8a8b8', 0, 0, 0, 'world', { round:0.08 }); box(p, s*1.6, s*2.2, s*1.6, '#a8d0a8', 0, s*1.3, 0, 'world', { round:s*0.6 }); }
  [-10.6,-6.4].forEach(px=>bx(0.5,2.3,0.06, '#f4c8d8', px,fy+0.2,-19.4, { round:0.02 }));
  [[-9.6,'#f4a8c8'],[-7.4,'#a8d8c8']].forEach(([px,c])=>{ bx(0.55,0.75,0.03, '#fbf6f4', px,fy+1.4,-24.33); bx(0.45,0.65,0.02, c, px,fy+1.45,-24.31); });
  for (let i=0;i<9;i++){ const m = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.06), bulbMat); m.position.set(X(-11.12), fy+1.95 - Math.sin(i/8*Math.PI)*0.15, Z(-24.1 + i*0.32)); g.add(m); }
  bx(0.9,0.04,0.22, '#c8a898', -5.3,fy+1.5,-24.2); [['#f4a8c8',-5.6],['#a8d8c8',-5.3],['#fff0a8',-5.0]].forEach(([c,px])=>bx(0.12,0.18,0.12, c, px,fy+1.54,-24.2, { round:0.04 }));
  g.position.set(x, 0, z); g.rotation.y = rot; seal(B); return { b:B, g, footprint:{ w:7.0, d:9.5 } };
}
