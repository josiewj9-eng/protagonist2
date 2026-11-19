/* =====================================================================
   WAYS OF WATCHING (2026-11-18, rev. 2). Specs: docs/视角与感知系统-v5.md, docs/幻想与梦境系统-v5.md.

   Rev. 2, by the user's request: everything about watching is index.html's own, moved over unchanged where it can be —
   - turning the eyes: index's look (drag right → the view turns right; LOOKR yaw ±2.6, pitch ±1.05, s 0.0042, no spring back) and
     its steady eye (camSmooth: the head's direction followed with a lag, the walking bob smoothed out, the horizon level);
     the cameras: index's ccLook (pan ±0.5, tilt ±0.2, eased; the wheel zooms 1–3.2×).
   - choosing: index's pick (the click bent by the lens like the picture, a ray to the first thing with a role, else the nearest
     one within 28 px (34 on a camera) that is in plain view), hover once a frame, the cursor (pointer / grab / crosshair), the
     hovered body lit a little; right click, Esc, ↑, Backspace and the wheel step back to the camera; ← → the next camera (or the
     next one in view), ↓ the nearest one in view; 1–0 the cameras.
   - the screen: index's REC frame (REC, CAM nn, the four corners, the centre cross), the folded face top right with everyone in it,
     the little sweet beside it (here: the inner world of whoever the eyes are), index's post pass (its modes: CCTV 14, cat & dog 1,
     the person 2, tree 3, lamp 5, barista 7, sitter 8, washer 10, birds 11, vehicles 12, the others 13; its dream grade) and its
     final blit (vignette, grain, the 40-level dither, the transitions: blink, fade, pupil, static).
   What is new here is only what the specs add: the map's cameras and people, and the inner worlds of K02, K07, K08.
   Nothing here changes the world.
   ===================================================================== */
export function createViews(C){
const { THREE, scene, renderer, cam, canvas, LIFE, WORLD } = C;
const clamp = C.clamp, lerp = C.lerp, smooth = C.smooth, wrapA = C.wrapA, ease = C.ease;
const L = LIFE, P_OF = (id) => L.BYID[id];
const LOG = [];
const $ = (s) => document.querySelector(s);
/* ---------------------------------------------------------------------
   CAMERAS
   --------------------------------------------------------------------- */
const CAMS = [];
const camModel = (x, y, z, yaw) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; scene.add(g);
  const m = (w, h, d, c, px, py, pz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color:c })); o.position.set(px, py, pz); g.add(o); return o; };
  m(0.2, 0.07, 0.2, '#3a3640', 0, 0.05, 0); m(0.14, 0.1, 0.14, '#26242c', 0, -0.05, 0); m(0.05, 0.05, 0.03, '#10141a', 0, -0.03, 0.08);   // index's housing
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), new THREE.MeshBasicMaterial({ color:'#ff5a7a' })); led.position.set(0.07, 0.06, 0.2); g.add(led); g.userData.dyn = true;
  // a thin pole down to the floor under it (outdoors; the room's camera hangs from its ceiling), and the path-finder walks round it
  const roof = C.WX.coverAt(x, z);
  if (y > -20 && roof > y + 0.2 && roof < y + 4){ const rod = new THREE.Mesh(new THREE.BoxGeometry(0.06, roof - y, 0.06), new THREE.MeshLambertMaterial({ color:'#8a8098' })); rod.position.set(x, (roof + y)/2 + 0.05, z); scene.add(rod); return g; }   // under a roof: it hangs from it
  if (y > -20){ const f = C.WORLD.floorAt(x - Math.sin(yaw)*0.3, z - Math.cos(yaw)*0.3), h = y + 0.1 - f; const pole = new THREE.Mesh(new THREE.BoxGeometry(0.09, h, 0.09), new THREE.MeshLambertMaterial({ color:'#8a8098' }));
    pole.position.set(x - Math.sin(yaw + Math.PI)*0.0 - Math.sin(yaw)*0.3, f + h/2, z - Math.cos(yaw)*0.3); scene.add(pole); g.userData.pole = pole;
    C.WORLD.addCollider({ cx:pole.position.x, cz:pole.position.z, ux:1, uz:0, hx:0.06, hz:0.06, y0:f, y1:f + h, glass:false, owner:'cam pole', name:'cam pole' }); }
  return g; };
// a camera: where its lens is, where it looks at first, how wide, whether it sees in infrared at night
function addCam(id, pos, look, o = {}){ const v = new THREE.Vector3(...pos), t = new THREE.Vector3(...look), d = t.clone().sub(v);
  const c = { id, pos:v, yaw0:Math.atan2(-d.x, -d.z), pitch0:Math.atan2(d.y, Math.hypot(d.x, d.z)), fov:o.fov || 56, ir:!!o.ir, room:o.room || null, follow:o.follow || null, model:null, place:o.place || '', icon:o.icon || 'street', range:o.range || 30 };
  if (!o.noModel && !o.follow){ c.model = camModel(v.x, v.y, v.z, c.yaw0 + Math.PI); c.model.userData.camId = id; }
  CAMS.push(c); return c; }
// the map's own eleven: the lens on its arm, looking down the street the pole faces
C.CAMS.forEach((k, i)=>{ const f = [Math.sin(k.yaw), Math.cos(k.yaw)], p = [k.x + f[0]*0.57, C.G + 3.86, k.z + f[1]*0.57];
  addCam('C' + String(i + 1).padStart(2, '0'), p, [p[0] + f[0]*12, 0.6, p[2] + f[1]*12], { noModel:true, ir:i === 8, icon:'street' }); CAMS[CAMS.length - 1].legacy = k; });
// the cameras of phase 1 — each made for something that happens there (see the coverage list in the report)
addCam('C12', [8.8, 4.2, -6.8], [0, 0.4, 3.4], { fov:58, icon:'plaza' });                                 // the plaza: both benches, the pigeons
addCam('C13', [-19.0, 3.2, -16.6], [-22.4, 0.2, -14.8], { fov:62, ir:true, icon:'alley' });               // behind the café: the back door, the bowl
addCam('C14', [41.6, 2.55, -4.85], [39.5, 0.95, -6.9], { fov:62, ir:true, icon:'laundry', place:'laundry' });         // in the laundry: the folding table, the box, the machines
addCam('C17', [0, 2.35, 5.4], [0, 0.7, -2.5], { fov:70, follow:'tram', icon:'tram' });                    // in the tram
addCam('C18', [16.4, 3.0, -63.8], [9.6, 0.5, -60.6], { fov:56, icon:'clinic' });                           // the clinic's door and its bench
addCam('C24', [-51.6, 3.2, -31.4], [-56.0, 0.5, -27.4], { fov:58, ir:true, icon:'house' });               // grandma's porch: the two chairs
addCam('C51', [L.ROOM.ox + 2.3, L.ROOM.y0 + 2.45, L.ROOM.oz + 1.9], [L.ROOM.ox - 1.2, L.ROOM.y0 + 0.5, L.ROOM.oz - 0.3], { fov:72, room:'H01', icon:'room' });   // her living room
addCam('C27', [-17.4, 3.1, -0.4], [-21.4, 0.8, -3.3], { fov:58, icon:'cafe' });                          // the café's counter and the window table
addCam('C28', [27.9, 2.75, -5.2], [24.6, 0.9, -8.6], { fov:66, icon:'bakery', place:'bakery' });          // the bakery, inside
addCam('C16', [-24.2, 3.4, -55.2], [-27.2, 0.6, -50.2], { fov:52, ir:true, icon:'empty' });               // the lane to the empty house
addCam('C43', [-62.2, 3.6, 1.6], [-65.8, 0.8, 9.0], { fov:60, icon:'station' });                          // the station's platform
addCam('C42', [66.6, 3.6, 61.6], [73.6, 0.8, 65.0], { fov:60, icon:'quay' });                             // the quay platform
addCam('C37', [66.4, 4.0, -33.2], [71.4, 0.5, -42.0], { fov:58, icon:'harbour' });                        // the north shed: the car, the crates
addCam('C47', [36.0, 3.6, 37.4], [28.5, 0.5, 45.0], { fov:60, ir:true, icon:'carpark' });                // the car park by the flats
addCam('C44', [41.6, 3.4, -33.2], [48.0, 0.6, -38.0], { fov:58, icon:'school' });                         // the school gate
addCam('C46', [18.4, 3.6, -8.6], [18.4, 0.6, -14.2], { fov:58, icon:'office' });                          // the office's door (moved in batch 2: the old spot looked into a wall)
addCam('C49', [62.6, 3.0, -31.0], [58.0, 0.5, -27.2], { fov:56, ir:true, icon:'house' });                 // the nurse's door
addCam('C55', [37.6, 3.0, -31.2], [42.2, 0.5, -27.0], { fov:56, ir:true, icon:'house' });                 // the launderer's door
addCam('C56', [-36.4, 3.4, -31.6], [-43.8, 0.4, -27.4], { fov:62, icon:'street' });                       // the west street: 3B, the sitter's door
addCam('C33', [C.wx(738) - 5.5, 4.0, C.wz(286) + 7.5], [C.wx(738), 0.4, C.wz(286) + 1.4], { fov:58, icon:'pier' });    // the ferry pier, where the visitors come in
addCam('C57', [30.0, 3.4, 47.6], [50.8, 0.6, 48.4], { fov:52, icon:'flats' });                           // the flats' doors
addCam('C60', [22.4, 3.3, -2.9], [16.8, 0.7, 1.2], { fov:58, icon:'arcade' });                         // the arcade's east gate: shelter in rain (grandma, the pigeons)
addCam('C61', [-13.6, 3.3, 3.6], [-17.6, 0.8, -1.8], { fov:58, icon:'arcade' });                       // the arcade's west gate: shelter in rain (the bench man)
addCam('C62', [-24.2, 3.3, 1.2], [-28.4, 0.8, -2.6], { fov:56, icon:'flowers' });                       // batch 2: the flower shop's rack (the reserved bouquet)
addCam('C63', [-0.6, 3.6, 40.4], [-5.2, 0.6, 36.8], { fov:56, ir:true, icon:'street' });                 // batch 2: the corner on the south avenue, its bench (E07)
addCam('C64', [13.6, 3.4, 31.6], [9.4, 0.8, 27.9], { fov:58, ir:true, icon:'house' });                    // batch 2: K10's door and the vase
addCam('C67', [72.6, 3.6, -26.6], [76.0, 0.5, -30.4], { fov:58, icon:'harbour' });                      // batch 7: the angler on the north quay (the hat, the gull, the rod)
addCam('C68', [71.6, 3.4, 24.4], [75.0, 0.5, 20.0], { fov:58, ir:true, icon:'sea' });                     // batch 7: the bench by the sea
addCam('C69', [28.4, 3.4, 1.0], [32.6, 0.6, -1.4], { fov:68, icon:'arcade' });                              // batch 7: the clock shop and the bicycle repair
addCam('C70', [56.0, 3.3, 0.0], [60.8, 0.6, 2.2], { fov:58, icon:'arcade' });                              // batch 7: the stationer
addCam('C71', [-54.2, 3.4, 45.0], [-51.8, 0.6, 49.8], { fov:60, ir:true, icon:'alley' });                  // batch 7: the bar alley (the water, the parcel)
addCam('C66', [3.2, 3.4, 41.0], [8.4, 0.6, 45.4], { fov:58, ir:true, icon:'store' });                       // batch 6: the store's counter and its door (E11, the shift)
addCam('C65', [-4.6, 3.6, -3.4], [0.6, 0.4, -9.4], { fov:56, icon:'plaza' });                            // batch 5: the plaza's north bench (K01: the ring, the bread)
C.WORLD.buildNav();
// neighbours: the four nearest of the street cameras; rooms and the tram link to the cameras by their doors; then the graph is checked
CAMS.forEach(c=>{ c.n = []; });
const link = (a, b) => { const A = CAMS.find(c=>c.id === a), B = CAMS.find(c=>c.id === b); if (!A || !B) return; if (!A.n.includes(b)) A.n.push(b); if (!B.n.includes(a)) B.n.push(a); };
const posOf = (c) => c.follow === 'tram' ? C.TRAM.position : c.room ? new THREE.Vector3(L.ROOM.ox, 0, L.ROOM.oz) : c.pos;
CAMS.forEach(c=>{ if (c.follow || c.room) return; CAMS.filter(o=>o !== c && !o.follow && !o.room).map(o=>[o, posOf(o).distanceTo(posOf(c))]).sort((a, b)=>a[1] - b[1]).slice(0, 3).forEach(([o])=>link(c.id, o.id)); });
link('C51', 'C24'); link('C17', 'C43'); link('C17', 'C42'); link('C14', 'C06'); link('C28', 'C46'); link('C28', 'C06'); link('C33', 'C08'); link('C42', 'C09'); link('C43', 'C01');
{ const seen = new Set(['C01']), q = ['C01']; while (q.length){ const id = q.shift(); CAMS.find(c=>c.id === id).n.forEach(n=>{ if (!seen.has(n)){ seen.add(n); q.push(n); } }); }
  CAMS.forEach(c=>{ if (!seen.has(c.id)){ const near = CAMS.filter(o=>seen.has(o.id) && !o.follow && !o.room).sort((a, b)=>posOf(a).distanceTo(posOf(c)) - posOf(b).distanceTo(posOf(c)))[0]; link(c.id, near.id); seen.add(c.id); LOG.push('linked ' + c.id + ' to ' + near.id); } }); }
const CAM = (id) => CAMS.find(c=>c.id === id);

/* ---------------------------------------------------------------------
   VIEW TARGETS: what can be clicked to look through it (people, animals, a few things, cameras)
   --------------------------------------------------------------------- */
const THINGS = [
  { id:'O01', name:'广场路灯', kind:'lamp', pos:()=>new THREE.Vector3(-9.2 + 0.5, C.G + 3.75, -9.2 + 0.5), look:[0, 0.5, -9] },
  { id:'O11', name:'洗衣机', kind:'washer', pos:()=>new THREE.Vector3(41.3, C.G + 0.75, -9.4), look:[40.0, 1.0, -6.4] },
  { id:'O15', name:'奶奶的盆栽', kind:'plant', pos:()=>{ const v = L.ROOM.W(1.15, -1.9); return new THREE.Vector3(v.x, L.ROOM.y0 + 1.15, v.z); }, look:()=>{ const v = L.ROOM.W(-1.2, 0.8); return [v.x, L.ROOM.y0 + 0.8, v.z]; }, room:'H01' },
  { id:'O19', name:'电车车灯', kind:'tramlight', pos:()=>C.TRAM.localToWorld(new THREE.Vector3(0, 2.45, -3.6)), look:()=>{ const v = C.TRAM.localToWorld(new THREE.Vector3(0, 0.9, 2.5)); return [v.x, v.y, v.z]; } },
  { id:'O21', name:'车里的收音机', kind:'radio', pos:()=>L.R22CAR.g.localToWorld(new THREE.Vector3(0.55, 0.92, 0.12)), look:()=>{ const v = L.R22CAR.g.localToWorld(new THREE.Vector3(6, 0.9, -0.2)); return [v.x, v.y, v.z]; }, radius:0.3 },
];
const targets = () => { const out = [];
  L.PEOPLE.forEach(P=>{ if (P.hidden || !P.pp.g.visible) return; const g = P.pp.g; out.push({ kind:'person', id:P.id, P, c:new THREE.Vector3(g.position.x, g.position.y + 0.85*P.pp.S/0.82*(P.seated || P.driving ? 0.75 : 1), g.position.z), r:0.42*P.pp.S/0.82, room:P.room }); });
  L.VIEW_ANIMALS.forEach(({ A, vk })=>{ if (!A.g.visible) return; const bird = vk === 'pigeon'; out.push({ kind:'animal', id:A.id, A, c:new THREE.Vector3(A.x, A.y + (bird ? 0.15 : 0.3), A.z), r:bird ? 0.3 : 0.38, room:A.room ? 'H01' : null }); });
  THINGS.forEach(T=>out.push({ kind:'thing', id:T.id, T, c:T.pos(), r:T.radius || 0.4, room:T.room || null }));
  CAMS.forEach(c=>{ if (c.model) out.push({ kind:'cam', id:c.id, c:c.pos.clone(), r:0.45, room:c.room }); });
  return out; };


// cameras in numeric order: CAM 01 … (1–0 on the keyboard reach the first ten, ← → go round all of them)
CAMS.sort((a, b)=>+a.id.slice(1) - +b.id.slice(1));
// every clickable thing carries a role, as in index: people and animals by their groups, cameras by their housings, things by a small proxy
L.PEOPLE.forEach(P=>{ P.pp.g.traverse(o=>{ o.userData.role = 'person'; o.userData.pid = P.id; }); });
L.VIEW_ANIMALS.forEach(({ A, id })=>A.g.traverse(o=>{ o.userData.role = 'animal'; o.userData.pid = id; }));
CAMS.forEach(c=>{ if (c.model) c.model.traverse(o=>{ o.userData.role = 'camdev'; o.userData.pid = c.id; }); });
const PROXY_G = new THREE.SphereGeometry(1, 8, 6), PROXY_M = new THREE.MeshBasicMaterial({ visible:false });
THINGS.forEach(T=>{ const m = new THREE.Mesh(PROXY_G, PROXY_M); m.scale.setScalar(T.radius || 0.35); m.userData.role = 'thing'; m.userData.pid = T.id; m.userData.keep = true; m.userData.noCollide = true; scene.add(m); T.proxy = m; });

/* ---------------------------------------------------------------------
   VIEWS (index's table): a way of seeing (mode), a field of view, a way in (trans)
   --------------------------------------------------------------------- */
const KIND = {
  cctv:{ cctv:true, mode:14, fov:60, trans:'static' },
  cat:{ mode:1, fov:74, trans:'pupil' }, dog:{ mode:1, fov:74, trans:'pupil' }, pigeon:{ mode:11, fov:78, trans:'blink' },
  human:{ mode:2, fov:62, trans:'blink' }, barista:{ mode:7, fov:62, trans:'blink' }, sitter:{ mode:8, fov:58, trans:'blink' }, launderer:{ mode:2, fov:60, trans:'blink' },
  npc:{ mode:13, fov:62, trans:'blink' }, stranger:{ mode:13, fov:62, trans:'blink' },
  lamp:{ mode:5, fov:62, trans:'blink' }, washer:{ mode:10, fov:66, trans:'blink' }, plant:{ mode:3, fov:68, trans:'fade' }, tramlight:{ mode:12, fov:64, trans:'blink' }, radio:{ mode:12, fov:64, trans:'blink' } };
// index's people and what they were in index (K01 human, K06 barista, K07 sitter, K08 launderer, K02–K05 the npc family, the rest strangers)
const PERSON_KIND = { K01:'human', K06:'barista', K07:'sitter', K08:'launderer', K02:'npc', K03:'npc', K04:'npc', K05:'npc', K09:'human', K10:'human' };
const kindOf = (k, id) => k === 'cam' ? 'cctv' : k === 'person' ? (PERSON_KIND[id] || 'stranger') : k === 'animal' ? (({ A01:'cat', A02:'dog' })[id] || 'pigeon') : THINGS.find(t=>t.id === id).kind;
const LOOKR = { yaw:2.6, pitch:1.05, s:0.0042 };
const TRANS = { blink:[0.14, 0.3, 0], fade:[0.5, 1.0, 0], pupil:[0.2, 0.9, 1], static:[0.12, 0.35, 3], none:[0.001, 0.001, 0] };

/* ---------------------------------------------------------------------
   THE CURRENT VIEW (index: cur / view / setP / applyView / goCam / stepBack / putDown / hop)
   --------------------------------------------------------------------- */
const V = { kind:null, id:null, dream:null, dreamK:0, dreamWant:false, token:0, hintShown:false };
const look = { yaw:0, pitch:0 }, ccLook = { yaw:0, pitch:0, ty:0, tp:0, zoom:1, tz:1 }, camSmooth = { init:false, yaw:0, pitch:0, y:0 };
const tr = { phase:'idle', t:0, open:0, mode:3, close:0.2, dur:0.3, next:null, nextMode:0 };
let lastCam = 'C12', pendingTarget = null;
const isCur = (k, id) => V.kind === k && V.id === id;
function setP(kind, id){ if (isCur(kind, id) && tr.phase !== 'close') return; if (tr.phase === 'close' && tr.next && tr.next.kind === kind && tr.next.id === id) return;
  if (V.kind === 'cam' && kind !== 'cam') lastCam = V.id;
  const [cl, op, md] = TRANS[KIND[kindOf(kind, id)].trans];
  tr.phase = 'close'; tr.t = 0; tr.close = cl; tr.dur = op; tr.nextMode = md; tr.next = { kind, id }; }
function applyView(next){ if (V.dream) dreamOff(true);
  V.token++; V.kind = next.kind; V.id = next.id; look.yaw = 0; look.pitch = 0; camSmooth.init = false;
  const v = KIND[kindOf(V.kind, V.id)];
  if (v.cctv){ const c = CAM(V.id); ccLook.yaw = ccLook.ty = ccLook.pitch = ccLook.tp = 0; ccLook.zoom = ccLook.tz = 1; lastCam = V.id; $('#camno').textContent = 'CAM ' + c.id.slice(1); }
  else { cam.fov = v.fov; cam.updateProjectionMatrix(); }
  $('#rec').classList.toggle('on', !!v.cctv); refreshWho();
  if (V.kind === 'person' && DREAM_OF[V.id] && !V.hintShown){ V.hintShown = true; tip.textContent = 'Space'; tip.style.opacity = 1; setTimeout(()=>{ tip.style.opacity = 0; }, 3800); } }
const camIndex = () => Math.max(0, CAMS.findIndex(c=>c.id === (V.kind === 'cam' ? V.id : lastCam)));
function goCam(i){ setP('cam', CAMS[((i % CAMS.length) + CAMS.length) % CAMS.length].id); }
function stepBack(){ if (V.kind === 'cam') return; goCam(CAMS.findIndex(c=>c.id === nearestCam(eyeOf().clone()))); }
// someone walks out of the world (in through a door, out of town): the camera nearest to where they were
function nearestCam(pos){ const inR = pos.y < -20; let best = lastCam, bd = 1e9; CAMS.forEach(c=>{ if (c.follow || !!c.room !== inR) return; const d = c.pos.distanceTo(pos); if (d < bd){ bd = d; best = c.id; } }); return best; }
const shown = (o) => { while (o){ if (!o.visible) return false; o = o.parent; } return true; };
// everyone you could become, with where they are right now
function candidates(){ const out = [];
  L.PEOPLE.forEach(P=>{ if (!P.hidden && shown(P.pp.g)) out.push({ kind:'person', id:P.id, pos:P.pp.g.getWorldPosition(new THREE.Vector3()), body:true }); });
  L.VIEW_ANIMALS.forEach(({ A, id })=>{ if (shown(A.g)) out.push({ kind:'animal', id, pos:A.g.getWorldPosition(new THREE.Vector3()) }); });
  THINGS.forEach(T=>out.push({ kind:'thing', id:T.id, pos:T.pos() }));
  CAMS.forEach(c=>{ if (c.model) out.push({ kind:'cam', id:c.id, pos:c.pos.clone() }); });
  return out; }
const frus = new THREE.Frustum(), frusM = new THREE.Matrix4();
function hop(dir){ cam.updateMatrixWorld(); frusM.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); frus.setFromProjectionMatrix(frusM);
  const self = cam.getWorldPosition(new THREE.Vector3()), right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0); right.y = 0; right.normalize();
  const Lc = candidates().filter(c=>c.kind !== 'cam' && !isCur(c.kind, c.id) && frus.containsPoint(c.pos.clone().setY(c.pos.y + 0.5)) && c.pos.distanceTo(self) < 30);
  let best = null, bd = 1e9; for (const c of Lc){ const d = c.pos.clone().sub(self); d.y = 0; const side = d.dot(right)*dir; if (dir !== 0 && side < 0.2) continue;
    const score = dir === 0 ? d.length() : side + Math.abs(d.length() - side)*0.4; if (score < bd){ bd = score; best = c; } }
  if (best) setP(best.kind, best.id); }

/* ---------------------------------------------------------------------
   PICKING (index: clickNdc → pickRay → near miss with seenFrom)
   --------------------------------------------------------------------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const pickFrom = new THREE.Vector3(), pickTo = new THREE.Vector3();
// the picture on screen is bent by some lenses (the cameras, the birds, the cat) — and K07's page shows the world in one frame — so bend the click the same way
function clickNdc(e){ const r = canvas.getBoundingClientRect(); let x = (e.clientX - r.left)/r.width, y = 1 - (e.clientY - r.top)/r.height;
  const m = Math.round(post.uniforms.uMode.value), k = m === 14 ? post.uniforms.uBarrel.value : m === 1 ? 0.08 : m === 11 ? 0.1 : 0;
  if (k){ const cx = x - 0.5, cy = y - 0.5, f = 1 - k*(cx*cx + cy*cy); x = 0.5 + cx*f; y = 0.5 + cy*f; }
  if (V.dream === 'F07' && V.dreamK > 0.5){ const R = COMIC.rect; x = (x - R[0])/(R[2] - R[0]); y = (y - R[1])/(R[3] - R[1]); if (x < 0 || x > 1 || y < 0 || y > 1) return null; }
  ndc.set(x*2 - 1, y*2 - 1); return r; }
// nothing solid between the eye and this point. index cast a ray at every mesh with a role; the map's town is baked into a few huge
// meshes, so the same question is asked of the map's own solid boxes (glass does not count, as in index)
function seenFrom(pt){ cam.getWorldPosition(pickFrom); if (pickFrom.y < -20) return true; const d = pt.clone().sub(pickFrom), L2 = d.length(); d.normalize();
  // the box the eye itself is in (a camera hung inside a roof, a lens in its housing) does not hide anything from it
  const own = new Set(); WORLD.near(pickFrom.x, pickFrom.z, 0.3, c=>{ if (pickFrom.y > c.y0 - 0.1 && pickFrom.y < c.y1 + 0.1 && WORLD.distOBB(c, pickFrom.x, pickFrom.z).d < 0.3) own.add(c); });
  // … nor the box the looked-at point rests in (a thing on a bench, a counter, a shelf)
  WORLD.near(pt.x, pt.z, 0.3, c=>{ if (pt.y > c.y0 - 0.05 && pt.y < c.y1 + 0.1 && WORLD.distOBB(c, pt.x, pt.z).d < 0.05) own.add(c); });
  for (let t = 0.5; t < L2 - 0.35; t += 0.25){ const x = pickFrom.x + d.x*t, y = pickFrom.y + d.y*t, z = pickFrom.z + d.z*t; let hit = false;
    WORLD.near(x, z, 0.2, c=>{ if (!hit && !c.glass && !own.has(c) && y > c.y0 + 0.02 && y < c.y1 - 0.02 && WORLD.distOBB(c, x, z).d < 0.02) hit = true; }); if (hit) return false; } return true; }
const pickables = () => { const o = []; L.PEOPLE.forEach(P=>{ if (!P.hidden && shown(P.pp.g)) o.push(P.pp.g); }); L.VIEW_ANIMALS.forEach(({ A })=>{ if (shown(A.g)) o.push(A.g); });
  CAMS.forEach(c=>{ if (c.model) o.push(c.model); }); THINGS.forEach(T=>{ T.proxy.position.copy(T.pos()); T.proxy.updateMatrixWorld(); o.push(T.proxy); }); return o; };
function pickRay(){ ray.setFromCamera(ndc, cam); const hits = ray.intersectObjects(pickables(), true);
  for (const h of hits){ const role = h.object.userData.role; if (!role) continue; const kind = role === 'camdev' ? 'cam' : role, id = h.object.userData.pid;
    if (isCur(kind, id)) continue; if (h.distance > (scene.fog ? scene.fog.far*0.85 : 400)) return null; if (!seenFrom(h.point)) return null; return { kind, id }; }
  return null; }
function pick(e){ const r = clickNdc(e); if (!r) return null; const first = pickRay(); if (first) return first;
  // a near miss: whoever is closest to the pointer on screen, if they are in plain view
  cam.updateMatrixWorld(); const q = new THREE.Vector3(); let best = null, bd = V.kind === 'cam' ? 34 : 28;
  for (const c of candidates()){ if (isCur(c.kind, c.id)) continue; pickTo.copy(c.pos); if (c.body) pickTo.y += 0.85; q.copy(pickTo).project(cam); if (q.z > 1 || q.z < -1) continue;
    if (pickTo.distanceTo(cam.position) > (scene.fog ? scene.fog.far*0.85 : 400)) continue;
    const d = Math.hypot((q.x - ndc.x)*r.width/2, (q.y - ndc.y)*r.height/2); if (d >= bd) continue;
    if (!seenFrom(pickTo)){ if (!c.body) continue; pickTo.y += 0.6; if (!seenFrom(pickTo)) continue; }
    best = c; bd = d; }
  return best ? { kind:best.kind, id:best.id } : null; }
let down = null, hoverAt = null, hover = null;
canvas.addEventListener('pointerdown', e=>{ if (C.view.mode !== 'life' || SHOW.on) return; down = { x:e.clientX, y:e.clientY, lx:e.clientX, ly:e.clientY, b:e.button }; });
addEventListener('pointerup', e=>{ if (C.view.mode !== 'life' || !down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), b = down.b; down = null;
  if (moved > 9 || e.target !== canvas) return;
  if (b === 2){ stepBack(); return; } if (b !== 0) return;
  const hit = pick(e); if (!hit) return; setP(hit.kind, hit.id); });
canvas.addEventListener('contextmenu', e=>e.preventDefault());
canvas.addEventListener('pointermove', e=>{ if (C.view.mode !== 'life') return;
  if (down){ const dx = e.clientX - down.lx, dy = e.clientY - down.ly;
    if (V.kind === 'cam'){ ccLook.ty = clamp(ccLook.ty - dx*0.0026/ccLook.zoom, -0.5, 0.5); ccLook.tp = clamp(ccLook.tp - dy*0.0026/ccLook.zoom, -0.2, 0.2); }
    else { look.yaw = clamp(look.yaw - dx*LOOKR.s, -LOOKR.yaw, LOOKR.yaw); look.pitch = clamp(look.pitch - dy*LOOKR.s, -LOOKR.pitch, LOOKR.pitch); }
    down.lx = e.clientX; down.ly = e.clientY; return; }
  hoverAt = { clientX:e.clientX, clientY:e.clientY }; });          // looked at once per frame (see hoverPick), however fast the mouse sends moves
canvas.addEventListener('pointerleave', ()=>{ hoverAt = null; hover = null; });
function hoverPick(){ if (!hoverAt) return; const e = hoverAt; hoverAt = null; hover = pick(e);
  canvas.style.cursor = hover ? 'pointer' : (V.kind === 'cam' ? 'grab' : 'crosshair'); }
canvas.addEventListener('wheel', e=>{ if (C.view.mode !== 'life' || SHOW.on) return; e.preventDefault();
  if (V.kind === 'cam') ccLook.tz = clamp(ccLook.tz - e.deltaY*0.0022, 1, 3.2); else if (e.deltaY > 30) stepBack(); }, { passive:false });
addEventListener('keydown', e=>{ if (C.view.mode !== 'life' || SHOW.on) return;
  if (e.key === ' '){ e.preventDefault(); if (!e.repeat) toggleDream(); return; }
  if (/^[0-9]$/.test(e.key)){ goCam(e.key === '0' ? 9 : +e.key - 1); return; }
  if (e.key === 'Escape' || e.key === 'ArrowUp' || e.key === 'Backspace'){ stepBack(); e.preventDefault(); }
  else if (e.key === 'ArrowLeft'){ V.kind === 'cam' ? goCam(camIndex() - 1) : hop(-1); e.preventDefault(); }
  else if (e.key === 'ArrowRight'){ V.kind === 'cam' ? goCam(camIndex() + 1) : hop(1); e.preventDefault(); }
  else if (e.key === 'ArrowDown'){ if (V.kind !== 'cam') hop(0); e.preventDefault(); } });

/* ---------------------------------------------------------------------
   THE SCREEN (index's #rec, #who, #dream, as they are)
   --------------------------------------------------------------------- */
const css = document.createElement('style'); css.textContent = `
  #rec { position:fixed; inset:0; pointer-events:none; z-index:3; opacity:0; transition:opacity .25s; font:600 15px/1 ui-monospace,Menlo,monospace; color:#f4f1ea; letter-spacing:.08em; text-shadow:0 0 3px rgba(0,0,0,.6); }
  #rec.on { opacity:1; }
  #rec .tl { position:absolute; left:28px; top:24px; display:flex; gap:14px; align-items:center; }
  #rec .dot { width:11px; height:11px; border-radius:50%; background:#e8352b; box-shadow:0 0 8px #e8352b; animation:rec 1.2s steps(1) infinite; }
  @keyframes rec { 50% { opacity:0; } }
  #rec .c { position:absolute; width:26px; height:26px; border:2px solid rgba(244,241,234,.75); }
  #rec .c1 { left:14px; top:14px; border-right:0; border-bottom:0; } #rec .c2 { right:14px; top:14px; border-left:0; border-bottom:0; }
  #rec .c3 { left:14px; bottom:14px; border-right:0; border-top:0; } #rec .c4 { right:14px; bottom:14px; border-left:0; border-top:0; }
  #rec .x { position:absolute; left:50%; top:50%; width:18px; height:18px; margin:-9px; opacity:.5; }
  #rec .x::before, #rec .x::after { content:''; position:absolute; background:#f4f1ea; } #rec .x::before { left:8px; top:0; width:2px; height:18px; } #rec .x::after { top:8px; left:0; height:2px; width:18px; }
  #who { position:fixed; right:22px; top:20px; z-index:4; opacity:0; transition:opacity .6s; }
  #who.on { opacity:1; }
  #who button { width:34px; height:34px; padding:0; border:2px solid rgba(255,240,250,.35); border-radius:50%; overflow:hidden; background:#2a2440; cursor:pointer; transition:opacity .2s, border-color .2s, transform .2s; }
  #who canvas { width:100%; height:100%; image-rendering:pixelated; display:block; }
  #who .me { width:44px; height:44px; border-color:rgba(255,240,250,.85); box-shadow:0 4px 18px rgba(60,40,90,.35); }
  #who .me:hover { transform:scale(1.06); }
  #who .panel { position:absolute; right:0; top:54px; display:grid; grid-template-columns:repeat(5, 34px); gap:7px; padding:10px; border-radius:16px;
    background:rgba(52,42,82,.5); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); box-shadow:0 8px 30px rgba(40,30,70,.3);
    opacity:0; transform:translateY(-6px) scale(.96); transform-origin:top right; pointer-events:none; transition:opacity .2s, transform .2s; }
  #who.open .panel { opacity:1; transform:none; pointer-events:auto; }
  #who .panel button:hover { transform:translateY(-1px); border-color:#fff; }
  #who .panel button.cur { border-color:#fff; }
  #who .panel button.away { opacity:.22; filter:grayscale(.5); cursor:default; pointer-events:none; }
  #dream { position:fixed; right:78px; top:25px; z-index:4; width:34px; height:34px; padding:0; border:2px solid rgba(255,240,250,.35); border-radius:50%; overflow:hidden; background:#2a2440; cursor:pointer;
    opacity:0; pointer-events:none; transition:opacity .4s, border-color .2s, transform .2s, box-shadow .3s, filter .3s; }
  #dream.show { opacity:1; pointer-events:auto; }
  #dream canvas { width:100%; height:100%; image-rendering:pixelated; display:block; }
  #dream:hover { transform:scale(1.08); border-color:#fff; }
  #dream.lit { border-color:#ffd0e4; box-shadow:0 0 16px 3px rgba(255,150,200,.6); background:#5a2f5a; }
  @media (max-width:600px){ #dream { right:58px; top:15px; width:30px; height:30px; } }
  @media (max-width:600px){ #who { right:10px; top:10px; } #who .panel { grid-template-columns:repeat(4, 30px); } #who button { width:30px; height:30px; } #who .me { width:40px; height:40px; } #rec .tl { left:20px; top:18px; } }`;
document.head.append(css);
document.body.insertAdjacentHTML('beforeend', `<div id="rec" aria-hidden="true"><div class="tl"><span class="dot"></span><span>REC</span><span id="camno">CAM 01</span><span id="camtc" style="opacity:.8"></span></div><i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i><i class="x"></i></div><nav id="who" aria-label="eyes"></nav><button id="dream" type="button" aria-label="dream"></button>`);
// index's faces: 12×12 portraits, no names
function face(o){ const c = document.createElement('canvas'); c.width = c.height = 12; const g = c.getContext('2d'); const R = (x, y, w, h, col)=>{ g.fillStyle = col; g.fillRect(x, y, w, h); };
  R(0, 0, 12, 12, o.bg || o.coat || '#555');
  if (o.kind === 'cam'){ R(0, 0, 12, 12, '#26282c'); R(2, 4, 7, 4, '#9aa0a8'); R(9, 5, 2, 2, '#9aa0a8'); R(3, 5, 2, 2, '#e8352b'); return c; }
  if (o.kind === 'cat'){ R(0, 0, 12, 12, '#3a4a5a'); R(2, 3, 8, 7, '#e8954a'); R(2, 1, 2, 3, '#e8954a'); R(8, 1, 2, 3, '#e8954a'); R(4, 6, 1, 1, '#222'); R(7, 6, 1, 1, '#222'); R(5, 8, 2, 1, '#c06a3a'); return c; }
  if (o.kind === 'dog'){ R(0, 0, 12, 12, '#4a5a4a'); R(3, 3, 6, 7, '#c8a070'); R(1, 3, 2, 5, '#8a6040'); R(9, 3, 2, 5, '#8a6040'); R(4, 6, 1, 1, '#222'); R(7, 6, 1, 1, '#222'); R(5, 8, 2, 1, '#3a2a20'); return c; }
  if (o.kind === 'bird'){ R(0, 0, 12, 12, o.duck ? '#4a7a8a' : '#5a6a8a'); R(2, 4, 8, 6, o.col); R(5, 2, 4, 4, o.head); R(9, 3, 2, 1, o.bill); R(7, 3, 1, 1, '#222'); return c; }
  if (o.kind === 'pigeon'){ R(0, 0, 12, 12, '#5a6a8a'); R(3, 2, 6, 8, '#ffffff'); R(8, 4, 2, 1, '#d9b07a'); R(6, 4, 1, 1, '#222'); return c; }
  if (o.kind === 'thing'){ R(0, 0, 12, 12, '#3a3448'); R(4, 3, 4, 6, o.col || '#ffe2c8'); return c; }
  R(0, 9, 12, 3, o.coat || '#555'); const S = o.small ? 1 : 0; R(3 + S, 3 + S, 6 - 2*S, 7 - 2*S, o.skin); const hc = o.hair || '#2a2220';
  switch (o.hairT){ case 'long': R(2, 2, 8, 3, hc); R(2, 4, 1, 6, hc); R(9, 4, 1, 6, hc); break; case 'bun': R(3, 2, 6, 2, hc); R(5, 0, 2, 2, hc); break;
    case 'pigtails': R(3 + S, 2 + S, 6 - 2*S, 2, hc); R(1, 4, 2, 3, hc); R(9, 4, 2, 3, hc); break; case 'beanie': R(3, 1, 6, 3, o.hat || '#3f8f8a'); break;
    case 'cap': R(3, 2, 6, 2, o.capC || '#444'); R(8, 3, 3, 1, o.capC || '#444'); break; case 'whitecap': R(3, 0, 6, 3, '#fbfaf6'); break;
    case 'pony': R(3, 2, 6, 2, hc); R(9, 3, 2, 4, hc); break; case 'bald': R(3, 5, 1, 2, hc); R(8, 5, 1, 2, hc); break; default: R(3 + S, 2 + S, 6 - 2*S, 2, hc); }
  R(5, 6, 1, 1, '#222'); R(7, 6, 1, 1, '#222'); if (o.glasses){ R(4, 6, 3, 1, '#222'); R(6, 6, 3, 1, '#222'); } if (o.beard) R(4, 8, 4, 2, hc); return c; }
const faceOfP = (P) => { const Lk = P.def.look, O = { ...Lk.fixed, ...(Lk.outfits[P.pp.outfit] || Lk.outfits.casual || Object.values(Lk.outfits)[0]) }; return { coat:O.coat, skin:O.skin, hair:O.hair, hairT:Lk.hair, capC:Lk.capC, glasses:Lk.glasses, beard:Lk.beard, small:(Lk.s || 1) < 0.8 }; };
// progress (docs/头像与成就系统-v5.md): who has been looked through, which cameras, which stories were seen; kept apart from the world
const PR = C.createProgress({ THREE, LIFE:L, cam, URLQ:C.URLQ, canvas:renderer.domElement, shown:(o)=>shown(o), seen:(pt)=>seenFrom(pt),
  get V(){ return V; }, ok:()=>!SHOW.on && C.view.mode === 'life' && tr.phase === 'idle',
  dream:()=>{ const P = P_OF('K02'); return { id:V.dream, k:V.dreamK, flyT:FLY.t, roofed:!P || !!P.room || C.WX.coverAt(P.w.x, P.w.z) > P.w.y + 2.0 || !!P.w.ride, comicN:COMIC.n, flip:COMIC.flip, FX }; } });
// index's panel: the camera first, then everyone whose eyes can be borrowed. Only those who exist in the town are here; a face stays
// dark until the viewer has really looked through those eyes; round each face a thin ring, one piece per story, lit when it was seen.
const ORDER = (id) => ({ K:0, R:1, D:2 })[id[0]]*1000 + +id.slice(1);
const WHO = [ { kind:'cam', f:{ kind:'cam' }, here:()=>true, group:'top' },
  ...[...L.PEOPLE].sort((x, y)=>ORDER(x.id) - ORDER(y.id)).map(P=>({ kind:'person', id:P.id, P, here:()=>!P.hidden, group:'People' })),
  ...L.VIEW_ANIMALS.map(({ id, A, vk })=>({ kind:'animal', id, f:vk === 'pigeon' ? { kind:'bird', col:A.g.children[0].material.color.getStyle(), head:A.head.children[0].material.color.getStyle(), bill:A.head.children[1].material.color.getStyle(), duck:/^A1[234]$/.test(id) } : { kind:vk }, here:()=>shown(A.g), group:'Animals' })) ];
const ringCss = document.createElement('style'); ringCss.textContent = `
  #who .tabs { grid-column:1 / -1; display:flex; gap:6px; margin:-2px 0 2px; }
  #who .tabs button { width:auto; height:22px; padding:0 9px; border-radius:11px; border-width:1px; font:600 10px/1 ui-monospace,Menlo,monospace; letter-spacing:.08em; color:rgba(255,245,250,.6); background:transparent; }
  #who .tabs button.on { color:#fff; border-color:rgba(255,240,250,.8); background:rgba(255,255,255,.08); }
  #who .slot { position:relative; width:34px; height:34px; }
  #who .slot.hid { display:none; }
  #who .slot svg { position:absolute; left:-5px; top:-5px; width:44px; height:44px; pointer-events:none; overflow:visible; opacity:0; transition:opacity .25s ease; z-index:2; }
  #who .slot:hover svg, #who .slot:focus-within svg, #who .slot.show svg { opacity:1; }
  #who .slot::after { content:''; position:absolute; inset:-5px; border-radius:50%; z-index:0; }
  #who .slot > button { position:relative; z-index:1; }
  #who .meslot { position:relative; display:inline-block; }
  #who .meslot svg { position:absolute; left:-5px; top:-5px; width:54px; height:54px; pointer-events:none; overflow:visible; opacity:0; transition:opacity .25s ease; }
  #who .meslot:hover svg, #who .meslot:focus-within svg, #who .meslot.show svg { opacity:1; }
  #who .slot svg circle { fill:none; stroke-width:1.6; transition:stroke .9s ease, stroke-opacity .9s ease; }
  #who .panel button.unk canvas { filter:brightness(.22) saturate(0) contrast(.9); }
  #who .panel button.unk { cursor:default; border-color:rgba(255,240,250,.14); }
  #who .panel button.unk:hover { transform:none; border-color:rgba(255,240,250,.22); }
  #who .panel button.away { opacity:.28; filter:grayscale(.5); cursor:default; pointer-events:auto; }
  #who .panel button.lit { animation:litIn 1.2s ease; }
  @keyframes litIn { from { opacity:.3; } to { opacity:1; } }
  #whotip { position:fixed; z-index:6; max-width:240px; padding:7px 10px; border-radius:10px; background:rgba(52,42,82,.72); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
    color:#fff; font:12px/1.45 -apple-system, "Helvetica Neue", sans-serif; pointer-events:none; opacity:0; transition:opacity .15s; }
  #whotip.on { opacity:1; } #whotip b { font-weight:600; display:block; } #whotip i { font-style:normal; display:block; opacity:.82; }
  #who .camfly { position:absolute; right:calc(100% + 8px); top:54px; display:none; grid-template-columns:repeat(2, 104px); gap:7px; padding:9px; max-height:62vh; overflow:auto; border-radius:14px;
    background:rgba(52,42,82,.5); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); box-shadow:0 8px 30px rgba(40,30,70,.3); }
  #who .camfly.on { display:grid; }
  #who .camfly button { width:104px; height:auto; border-radius:8px; border-width:1px; padding:0; background:#1c1a24; overflow:hidden; display:block; }
  #who .camfly button.cur { border-color:#fff; }
  #who .camfly img, #who .camfly canvas { width:104px; height:65px; display:block; object-fit:cover; image-rendering:auto; }
  #who .camfly span { display:block; padding:3px 0 4px; font:600 10px/1 ui-monospace,Menlo,monospace; letter-spacing:.08em; color:#f4f1ea; }
  #who .eye canvas { image-rendering:pixelated; }
  #eggv { position:fixed; inset:0; z-index:8; display:none; cursor:pointer; background:rgba(13,10,18,.18); }
  #eggv.on { display:block; }
  #eggv .f { position:absolute; width:40px; height:40px; margin:-20px; border-radius:50%; overflow:hidden; border:2px solid rgba(255,240,250,.85); opacity:0; animation:eggIn 3.2s ease forwards; }
  #eggv .f canvas { width:100%; height:100%; image-rendering:pixelated; display:block; }
  #eggv h2 { position:absolute; left:0; right:0; top:50%; margin:-0.6em 0 0; text-align:center; font:400 clamp(26px, 5vw, 60px)/1.2 Georgia, "Times New Roman", serif; color:#fff6f8;
    text-shadow:0 2px 0 rgba(90,60,120,.55), 0 0 26px rgba(255,170,210,.45); opacity:0; animation:eggIn 2.4s ease forwards; }
  @keyframes eggIn { to { opacity:1; } }
  @media (prefers-reduced-motion: reduce){ #eggv .f, #eggv h2 { animation-duration:.4s; animation-delay:0s !important; } #who .panel button.lit { animation:none; } }
  @media (max-width:600px){ #who .slot { width:30px; height:30px; } #who .slot svg { left:-5px; top:-5px; width:40px; height:40px; } #who .camfly { grid-template-columns:repeat(2, 84px); } #who .camfly button, #who .camfly img, #who .camfly canvas { width:84px; } #who .camfly img, #who .camfly canvas { height:52px; } }`;
document.head.append(ringCss);
const whoEl = $('#who'), meBtn = document.createElement('button'); meBtn.type = 'button'; meBtn.className = 'me'; meBtn.setAttribute('aria-label', 'eyes');
const meCv = document.createElement('canvas'); meCv.width = meCv.height = 12; meBtn.appendChild(meCv); const meSlot = document.createElement('div'); meSlot.className = 'meslot'; meSlot.append(meBtn); whoEl.appendChild(meSlot);
let meRing = null, meId = null;
const panel = document.createElement('div'); panel.className = 'panel'; whoEl.appendChild(panel);
const tipEl = document.createElement('div'); tipEl.id = 'whotip'; document.body.append(tipEl);
const camFly = document.createElement('div'); camFly.className = 'camfly'; whoEl.appendChild(camFly);
meSlot.addEventListener('pointerenter', e=>{ if (e.pointerType === 'touch' || !meId || whoEl.classList.contains('open')) return; showTip({ id:meId, slot:meSlot }); });
meSlot.addEventListener('pointerleave', ()=>{ if (!whoEl.classList.contains('open')) hideTip(); });
meBtn.addEventListener('click', e=>{ e.stopPropagation(); hideTip(); whoEl.classList.toggle('open'); if (!whoEl.classList.contains('open')) closeAll(); else showGroup(groupOfView()); });
addEventListener('pointerdown', e=>{ if (!whoEl.contains(e.target)){ whoEl.classList.remove('open'); closeAll(); } });
function closeAll(){ hideTip(); camFly.classList.remove('on'); if (armed && armed.slot) armed.slot.classList.remove('show'); armed = null; meSlot.classList.remove('show'); }
let lastPtr = 'mouse', armed = null; whoEl.addEventListener('pointerdown', e=>{ lastPtr = e.pointerType || 'mouse'; }, true);
// the two groups (People / Animals): one shown at a time, the one of the current eyes first
const tabs = document.createElement('div'); tabs.className = 'tabs'; const TAB = {};
['People', 'Animals'].forEach(g=>{ const b = document.createElement('button'); b.type = 'button'; b.textContent = g; b.addEventListener('click', e=>{ e.stopPropagation(); showGroup(g); }); tabs.append(b); TAB[g] = b; });
let group = 'People';
const groupOfView = () => V.kind === 'animal' ? 'Animals' : 'People';
function showGroup(g){ group = g; for (const k in TAB) TAB[k].classList.toggle('on', k === g); WHO.forEach(w=>{ if (w.slot) w.slot.classList.toggle('hid', w.group !== 'top' && w.group !== g); }); if (eyeSlot) eyeSlot.classList.toggle('hid', g !== 'People' || !PR.encore()); }
// the ring: one arc per story entry, equal, with small gaps; the unlit ones barely there
const SVGNS = 'http://www.w3.org/2000/svg';
function ringFor(n){ const svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('viewBox', '0 0 44 44'); const r = 20.2, Cc = 2*Math.PI*r, gap = n > 1 ? 2.2 : 0, seg = (Cc - gap*n)/n, arcs = [];
  for (let k = 0; k < n; k++){ const c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('cx', 22); c.setAttribute('cy', 22); c.setAttribute('r', r);
    c.setAttribute('stroke-dasharray', n > 1 ? `${seg} ${Cc - seg}` : `${Cc}`); c.setAttribute('stroke-dashoffset', String(Cc*0.25 - k*(seg + gap)));
    c.setAttribute('stroke', '#ffffff'); c.setAttribute('stroke-opacity', '0.13'); svg.append(c); arcs.push(c); }
  return { svg, arcs }; }
function placeTip(el){ const r = el.getBoundingClientRect(), pr = panel.getBoundingClientRect(), left = pr.left - tipEl.offsetWidth - 8;   // beside the panel, level with the face
  tipEl.style.top = Math.max(8, Math.min(innerHeight - tipEl.offsetHeight - 8, r.top + r.height/2 - 14)) + 'px'; tipEl.style.left = (left > 8 ? left : Math.max(8, Math.min(innerWidth - tipEl.offsetWidth - 8, r.right - tipEl.offsetWidth))) + 'px';
  if (left <= 8) tipEl.style.top = Math.min(innerHeight - tipEl.offsetHeight - 8, pr.bottom + 8) + 'px'; }
function showTip(w){ const id = w.id, done = PR.entries(id).filter(e=>e.done), known = PR.visited(id);
  if (!known && !done.length){ hideTip(); return false; }
  tipEl.innerHTML = ''; const b = document.createElement('b'); b.textContent = PR.name(id); tipEl.append(b); done.forEach(e=>{ const i = document.createElement('i'); i.textContent = e.title; tipEl.append(i); });
  tipEl.classList.add('on'); placeTip(w.slot); return true; }
function hideTip(){ tipEl.classList.remove('on'); }
panel.append(tabs);
WHO.forEach(w=>{ const slot = document.createElement('div'); slot.className = 'slot'; const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', w.kind === 'cam' ? 'cameras' : (PR.visited(w.id) ? PR.name(w.id) : 'unknown'));
  w.cv = face(w.f || faceOfP(w.P)); b.appendChild(w.cv); slot.append(b); w.el = b; w.slot = slot;
  if (w.kind !== 'cam'){ const n = PR.entries(w.id).length; if (n){ const R = ringFor(n); w.arcs = R.arcs; slot.append(R.svg); } }
  if (w.group === 'top'){ panel.insertBefore(slot, tabs); } else panel.append(slot);
  b.addEventListener('click', e=>{ e.stopPropagation();
    if (w.kind === 'cam'){ if (lastPtr === 'touch' && !camFly.classList.contains('on') && PR.cams().length){ openFly(); return; } whoEl.classList.remove('open'); closeAll(); if (V.kind === 'cam') goCam(camIndex() + 1); else setP('cam', lastCam); return; }
    if (lastPtr === 'touch' && armed !== w){ if (armed && armed.slot) armed.slot.classList.remove('show'); armed = w; slot.classList.add('show'); showTip(w); return; }                  // touch: the first tap shows (the face's ring and its titles), the second goes
    if (!PR.visited(w.id) || !w.here()) return;                                                   // a dark face is found in the town first; someone away cannot be reached now
    whoEl.classList.remove('open'); closeAll(); setP(w.kind, w.id); });
  const enter = () => { if (w.kind === 'cam'){ openFly(); return; } if (PR.visited(w.id) && w.here()) hover = { kind:w.kind, id:w.id }; showTip(w); };
  const leave = () => { if (w.kind === 'cam'){ flyLater(); return; } hover = null; hideTip(); };
  slot.addEventListener('pointerenter', e=>{ if (e.pointerType !== 'touch') enter(); }); slot.addEventListener('pointerleave', e=>{ if (e.pointerType !== 'touch') leave(); });
  b.addEventListener('focus', enter); b.addEventListener('blur', leave); });
// the cameras already seen: a little still of each, by number; hover the camera face to see them, click one to go back to it
let flyT = null;
function openFly(){ clearTimeout(flyT); const ids = PR.cams(); if (!ids.length){ camFly.classList.remove('on'); return; }
  if (camFly.dataset.k !== ids.join(',') + '|' + V.id){ camFly.dataset.k = ids.join(',') + '|' + V.id; camFly.innerHTML = '';
    ids.forEach(id=>{ if (!CAM(id)) return; const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'CAM ' + id.slice(1)); if (V.kind === 'cam' && V.id === id) b.classList.add('cur');
      const t = PR.thumb(id); if (t){ const im = new Image(); im.src = t; im.alt = ''; b.append(im); } else { const c = face({ kind:'cam' }); c.style.imageRendering = 'pixelated'; b.append(c); }
      const s = document.createElement('span'); s.textContent = 'CAM ' + id.slice(1); b.append(s);
      b.addEventListener('click', e=>{ e.stopPropagation(); whoEl.classList.remove('open'); closeAll(); setP('cam', id); }); camFly.append(b); }); }
  const wr = whoEl.getBoundingClientRect(), pr = panel.getBoundingClientRect(); camFly.style.top = (WHO[0].slot.getBoundingClientRect().top - wr.top) + 'px'; camFly.style.right = (wr.right - pr.left + 8) + 'px'; camFly.classList.add('on'); }
function flyLater(){ clearTimeout(flyT); flyT = setTimeout(()=>camFly.classList.remove('on'), 350); }
camFly.addEventListener('pointerenter', ()=>clearTimeout(flyT)); camFly.addEventListener('pointerleave', e=>{ if (e.pointerType !== 'touch') flyLater(); });
// the eye at the end (only once everything the spec asks for has really been seen)
const EYE_ART = pix12Art(['............', '............', '...wwwwww...', '.ww......ww.', 'w...kkkk...w', 'w..kkbbkk..w', 'w..kkbbkk..w', 'w...kkkk...w', '.ww......ww.', '...wwwwww...', '............', '............'], { w:'#fff1dc', k:'#3a2a50', b:'#ffffff' });
let eyeSlot = null;
function pix12Art(art, col){ const cv = document.createElement('canvas'); cv.width = cv.height = 12; const g = cv.getContext('2d'); g.fillStyle = '#2a2440'; g.fillRect(0, 0, 12, 12); art.forEach((row, y)=>[...row].forEach((ch, x)=>{ if (col[ch]){ g.fillStyle = col[ch]; g.fillRect(x, y, 1, 1); } })); return cv; }
function makeEye(){ if (eyeSlot) return; eyeSlot = document.createElement('div'); eyeSlot.className = 'slot'; const b = document.createElement('button'); b.type = 'button'; b.className = 'eye lit'; b.setAttribute('aria-label', 'You');
  const c = document.createElement('canvas'); c.width = c.height = 12; c.getContext('2d').drawImage(EYE_ART, 0, 0); b.append(c); eyeSlot.append(b); panel.append(eyeSlot);
  const tipW = { id:'You', slot:eyeSlot };
  b.addEventListener('pointerenter', ()=>{ tipEl.innerHTML = '<b>You</b>'; tipEl.classList.add('on'); placeTip(eyeSlot); }); b.addEventListener('pointerleave', hideTip);
  b.addEventListener('focus', ()=>{ tipEl.innerHTML = '<b>You</b>'; tipEl.classList.add('on'); placeTip(eyeSlot); }); b.addEventListener('blur', hideTip);
  b.addEventListener('click', e=>{ e.stopPropagation(); if (lastPtr === 'touch' && armed !== tipW){ armed = tipW; tipEl.innerHTML = '<b>You</b>'; tipEl.classList.add('on'); placeTip(eyeSlot); return; } whoEl.classList.remove('open'); closeAll(); openEgg(); });
  showGroup(group); }
// the encore: every face found, and the eye, rise slowly at the same size and brightness; then the question. The town goes on behind.
const eggEl = document.createElement('div'); eggEl.id = 'eggv'; document.body.append(eggEl);
function openEgg(){ eggEl.innerHTML = ''; const list = WHO.filter(w=>w.kind === 'person' && PR.visited(w.id)).map(w=>w.cv); list.push(EYE_ART);
  const n = list.length, W = innerWidth, H = innerHeight, cx = W/2, cy = H/2;
  list.forEach((src, k)=>{ const d = document.createElement('div'); d.className = 'f'; const c = document.createElement('canvas'); c.width = c.height = 12; c.getContext('2d').drawImage(src, 0, 0); d.append(c);
    const a = k*2.39996, r = Math.sqrt((k + 0.5)/n)*Math.min(W, H)*0.42; let x = cx + Math.cos(a)*r*(W/H > 1 ? 1.4 : 1), y = cy + Math.sin(a)*r;
    if (Math.abs(y - cy) < 46 && Math.abs(x - cx) < W*0.36) y = cy + Math.sign(y - cy || 1)*(46 + Math.random()*20);     // keep the line of the question clear
    d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.animationDelay = (0.4 + k*(5.5/n)) + 's'; eggEl.append(d); });
  const h = document.createElement('h2'); h.textContent = 'Who Is the Protagonist?'; h.style.animationDelay = (6.6) + 's'; eggEl.append(h); eggEl.classList.add('on'); }
function closeEgg(){ eggEl.classList.remove('on'); eggEl.innerHTML = ''; }
eggEl.addEventListener('click', closeEgg); addEventListener('keydown', e=>{ if (e.key === 'Escape' && eggEl.classList.contains('on')){ closeEgg(); e.stopImmediatePropagation(); } }, true);
// lit and ringed from the record (and again whenever it changes)
function refreshRings(){ for (const w of WHO){ if (w.kind === 'cam') continue; const vis = PR.visited(w.id);
    if (w.known !== vis){ if (w.known === false && vis) w.el.classList.add('lit'); w.known = vis; w.el.classList.toggle('unk', !vis); w.el.setAttribute('aria-label', vis ? PR.name(w.id) : 'unknown'); }
    if (w.arcs){ PR.entries(w.id).forEach((e, k)=>{ const c = w.arcs[k]; if (!c) return; c.setAttribute('stroke-opacity', e.done ? '0.95' : '0.13'); }); } }
  if (PR.encore()) makeEye(); }
PR.onChange(refreshRings); refreshRings(); showGroup(group);
function refreshWho(){ let mine = null;
  for (const w of WHO){ const cur = w.kind === V.kind && (w.kind === 'cam' || w.id === V.id); if (cur) mine = w; w.el.classList.toggle('cur', cur); w.el.classList.toggle('away', w.kind !== 'cam' && !w.here());
    if (w.P && w.P.pp.outfit !== w.outfit){ w.outfit = w.P.pp.outfit; const c = face(faceOfP(w.P)); w.cv.getContext('2d').clearRect(0, 0, 12, 12); w.cv.getContext('2d').drawImage(c, 0, 0); } }
  if (mine){ const g = meCv.getContext('2d'); g.clearRect(0, 0, 12, 12); g.drawImage(mine.cv, 0, 0); }
  const curId = V.kind === 'person' || V.kind === 'animal' ? V.id : null;
  if (curId !== meId){ meId = curId; if (meRing) meRing.svg.remove(); meRing = null; if (curId && PR.entries(curId).length){ meRing = ringFor(PR.entries(curId).length); meSlot.append(meRing.svg); } }
  if (meRing) PR.entries(meId).forEach((e, k)=>{ if (meRing.arcs[k]) meRing.arcs[k].setAttribute('stroke-opacity', e.done ? '0.95' : '0.13'); });
  // the little sweet: only for someone whose inner world exists (index's K04 sweet, the others their own sign)
  const dId = V.kind === 'person' ? DREAM_OF[V.id] : null; dreamBtn.classList.toggle('show', !!dId); dreamBtn.classList.toggle('lit', !!V.dream);
  if (dId && dreamBtn.dataset.id !== dId){ dreamBtn.dataset.id = dId; dreamBtn.innerHTML = ''; dreamBtn.append(DREAM_ICON[dId]()); } }
whoEl.classList.add('on');
const dreamBtn = $('#dream'); dreamBtn.addEventListener('click', e=>{ e.stopPropagation(); toggleDream(); });
const pix12 = (art, col) => () => { const cv = document.createElement('canvas'); cv.width = cv.height = 12; const g = cv.getContext('2d'); art.forEach((row, y)=>[...row].forEach((ch, x)=>{ if (col[ch]){ g.fillStyle = col[ch]; g.fillRect(x, y, 1, 1); } })); return cv; };
const DREAM_ICON = {
  F04:pix12(['............', '....pppp....', '...pwwppp...', '..pwppwwpp..', '..pwpwpwpp..', '..ppwppwpp..', '...ppwwpp...', '....pppp....', '.....ss.....', '.....ss.....', '.....ss.....', '............'], { p:'#ff8fb8', w:'#fff1dc', s:'#f4e8f0' }),
  F02:pix12(['............', '.........ww.', '........www.', '.......www..', '......www...', '.....www....', '....www.....', '...www......', '..ww........', '.w..........', '............', '............'], { w:'#fff1dc' }),
  F07:pix12(['............', '.kkkkkkkkkk.', '.kwwwwkwwwk.', '.kwwwwkwwwk.', '.kwwwwkkkkk.', '.kwwwwkwwwk.', '.kkkkkkwwwk.', '.kwwwwkwwwk.', '.kwwwwkkkkk.', '.kkkkkk.....', '............', '............'], { k:'#1a1828', w:'#fff8f0' }),
  F01:pix12(['............', '.wwwwwwwwww.', '.wkkkkkkkkw.', '.wkooookkkw.', '.wkooooookw.', '.wkkooookkw.', '.wkkkkkkkkw.', '.wwwwwwwwww.', '............', '............', '............', '............'], { w:'#f4ecdc', k:'#8a8478', o:'#f4a86a' }),
  F03:pix12(['............', '...dddddd...', '...d....d...', '...d....d...', '...d....d...', '...d...yd...', '...d....d...', '...d....d...', '...d....d...', '...dddddd...', '............', '............'], { d:'#5a8aa8', y:'#f4d24a' }),
  F05:pix12(['............', '..s.....s...', '...l...l....', '....l.l.....', '.....s......', '....l.l.....', '...l...l....', '..s.....s...', '............', '.....s......', '............', '............'], { s:'#fff0a8', l:'#8aa0e8' }),
  F06:pix12(['............', '............', '............', '...cc..cc...', '...cch.cch..', '...cc..cc...', '............', 'tttttttttttt', 'TTTTTTTTTTTT', 'TTTTTTTTTTTT', '............', '............'], { c:'#fbf4ea', h:'#fbf4ea', t:'#e8c8a8', T:'#a8785a' }),
  F09:pix12(['............', '..bbbbbbbb..', '..b..bb..b..', '..bbbbbbbb..', '............', 'wwwwwwwwwwww', '............', '..bbbbbbbb..', '..b..bb..b..', '..bbbbbbbb..', '............', '............'], { b:'#8aa8d8', w:'#d8e8f8' }),
  F10:pix12(['............', '.....p......', '....ppp.....', '...ppwpp....', '....ppp.....', '.....g......', '.....g..p...', '.....g.ppp..', '.....gg.p...', '.....g......', '............', '............'], { p:'#f48ab0', w:'#fff1dc', g:'#8ac88a' }),
  F08:pix12(['............', '....bbbb....', '...b....b...', '...b....b...', '....bbbb....', '.....bb.....', '....b..b....', '...b....b...', '..b......b..', '............', '............', '............'], { b:'#7ea8f4' }) };
const DREAM_OF = { K04:'F04', K02:'F02', K07:'F07', K08:'F08', K01:'F01', K03:'F03', K05:'F05', K06:'F06', K09:'F09', K10:'F10' };
const ui = () => refreshWho();
const tip = document.createElement('div'); tip.style.cssText = 'position:fixed;right:22px;top:74px;z-index:4;padding:6px 10px;border-radius:10px;background:rgba(52,42,82,.55);color:#fff;font:12px/1.4 -apple-system,"PingFang SC",sans-serif;opacity:0;transition:opacity .4s;pointer-events:none'; document.body.append(tip);

/* ---------------------------------------------------------------------
   index's post pass (FS) and final blit (FSB), unchanged; then the inner worlds the specs add (K02, K07, K08)
   --------------------------------------------------------------------- */
const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FS = `
precision highp float;
uniform sampler2D tCur; uniform sampler2D tPrevScene; uniform sampler2D tPrevOut; uniform sampler2D tDepth; uniform sampler2D tRaw, tSnapA, tSnapB;
uniform vec2 uRes; uniform float uTime, uMode, uNear, uFar, uFocus, uAperture, uWind, uAspect, uSpin, uIR, uZoom, uBarrel, uSignal, uWarm, uGrade, uDream;
uniform float uWarmK, uEmpty, uComic, uFlip, uSnapK; uniform vec4 uRect; uniform vec3 uBubble;
uniform float uFx, uFk; uniform vec4 uFa, uFb, uFc;
uniform vec3 uPal[16];
varying vec2 vUv;
float bay2(vec2 a){ a = floor(a); return fract(a.x/2.0 + a.y*a.y*0.75); }
float bay4(vec2 a){ return bay2(0.5*a)*0.25 + bay2(a); }
// the map's picture reaches this pass already in display colour (painted); index's tCur was linear (it did pow 1/2.2 here)
vec3 cur(vec2 uv){ return max(texture2D(tCur, uv).rgb, 0.0); }
vec3 prevS(vec2 uv){ return max(texture2D(tPrevScene, uv).rgb, 0.0); }
vec3 raw(vec2 uv){ return texture2D(tRaw, uv).rgb; }
float lin(vec2 uv){ float d = texture2D(tDepth, uv).x; float z = d*2.0-1.0; return 2.0*uNear*uFar/(uFar+uNear - z*(uFar-uNear)); }
vec3 blur(vec2 uv, float r){ vec3 c = vec3(0.0);
  for (int i=0;i<12;i++){ float fi=float(i); float a=fi*2.39996; float rr=sqrt(fi+0.5)/3.4641; c += cur(uv + vec2(cos(a),sin(a))*rr*r/uRes); }
  return c/12.0; }
float luma(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
vec3 dof(vec2 uv, float focus, float ap){ float d = lin(uv); float coc = clamp(abs(1.0/d - 1.0/focus)*ap, 0.0, 6.0);
  return coc < 0.5 ? cur(uv) : blur(uv, coc); }
// K07's page (new for the specs): ink from depth and light, two flat tones, a dot screen
vec3 comic(vec2 uv, vec2 px){ vec3 c = raw(uv); float z = lin(uv); vec2 e = 1.5/uRes;
  float zx = abs(lin(uv + vec2(e.x, 0.0)) - lin(uv - vec2(e.x, 0.0))), zy = abs(lin(uv + vec2(0.0, e.y)) - lin(uv - vec2(0.0, e.y)));
  float edge = step(0.035, max(zx, zy)/max(z, 0.1)); float cl = abs(luma(raw(uv + vec2(e.x, 0.0))) - luma(raw(uv - vec2(e.x, 0.0)))) + abs(luma(raw(uv + vec2(0.0, e.y))) - luma(raw(uv - vec2(0.0, e.y))));
  edge = max(edge, step(0.16, cl)); float l = luma(c); vec3 tone = l > 0.72 ? vec3(1.0, 0.98, 0.96) : l > 0.45 ? vec3(1.0, 0.86, 0.9) : vec3(0.72, 0.8, 0.98);
  float dots = length(fract(px/4.0) - 0.5); float shade = clamp((0.62 - l)*1.6, 0.0, 0.9); tone *= 1.0 - step(dots, shade*0.55)*0.55; return mix(tone, vec3(0.12, 0.1, 0.16), edge); }
vec3 still(sampler2D t, vec2 b, vec2 px){ vec3 c = texture2D(t, vec2(0.25 + b.x*0.5, b.y)).rgb; float l = luma(c); vec3 t2 = l > 0.6 ? vec3(1.0, 0.95, 0.96) : l > 0.38 ? vec3(0.96, 0.82, 0.88) : vec3(0.66, 0.74, 0.94);
  float dd = length(fract(px/4.0) - 0.5); return t2*(1.0 - step(dd, clamp((0.6 - l)*1.4, 0.0, 0.8)*0.5)*0.5); }
void main(){
  vec2 uv = vUv; vec3 col = vec3(0.0); float glow = 0.0;
  int m = int(uMode + 0.5);
  vec2 cc = (vUv-0.5)*vec2(uAspect,1.0); float r = length(cc);
  if (m == 14){                       // a security camera: plain, a little tired, sees in infrared at night
    vec2 c = uv-0.5; uv = 0.5 + c*(1.0 - uBarrel*dot(c,c));
    if (uZoom > 1.05){ vec2 px = uRes/(1.0 + (uZoom-1.0)*1.6); uv = (floor(uv*px)+0.5)/px; }
    col = cur(uv);
    float l = luma(col);
    col = mix(vec3(l), col, 0.9) * vec3(0.96,0.99,1.05);
    vec3 ir = vec3(pow(l*1.25, 0.62)) * vec3(1.0,0.86,0.97);
    col = mix(col, ir, uIR);
    if (mod(gl_FragCoord.y, 3.0) < 1.0) col *= 0.95;
    float roll = smoothstep(0.0, 0.02, abs(fract(vUv.y*0.6 - uTime*0.07) - 0.5));
    col *= 0.985 + 0.015*roll;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) col = vec3(0.0);
    if (uSignal < 0.5){ float n = hash(floor(gl_FragCoord.xy*0.5) + floor(uTime*24.0)); col = vec3(0.08 + n*0.32); }
  } else if (m == 1){                 // cat & dog: few colours, motion lingers
    vec2 c = uv-0.5; uv = 0.5 + c*(1.0 - 0.08*dot(c,c));
    col = cur(uv); vec3 pv = prevS(uv);
    float mo = smoothstep(0.06, 0.22, length(col-pv));
    float l = luma(col); float by = (col.r+col.g)*0.5 - col.b;
    vec3 di = vec3(l+by*0.4, l+by*0.32, l-by*0.7);
    col = mix(di, col, 0.35); col = pow(max(col, 0.0), vec3(0.7));
    glow = max(mo, texture2D(tPrevOut, vUv).a*0.88 - 0.008);
    col += vec3(1.0,0.72,0.3)*glow*0.22;
  } else if (m == 2){
    col = uAperture > 0.01 ? dof(uv, uFocus, uAperture) : cur(uv);
    col = mix(col, vec3(luma(col)), 0.08);
  } else if (m == 3){                 // the tree: soft greens, nothing more
    col = cur(uv); col = mix(col, vec3(luma(col)), 0.1) * vec3(0.98,1.03,0.98);
  } else if (m == 4){                 // the passerby: the edges quietly fade out of attention
    float a = smoothstep(0.5, 0.95, r)*0.6;
    col = mix(cur(uv), vec3(luma(cur(uv))), a);
  } else if (m == 5){
    col = cur(uv); col = floor(col*12.0+0.5)/12.0;
    col *= 0.97 + 0.03*sin(uTime*50.0);
  } else if (m == 6){
    vec2 dir = normalize(uv-0.5+0.0001); float k = 0.0015 + uWind*0.006;
    col = vec3(cur(uv+dir*k).r, cur(uv).g, cur(uv-dir*k).b);
  } else if (m == 7){
    col = cur(uv); col = mix(col, vec3(luma(col))*vec3(1.05,0.98,0.88), 0.18);
  } else if (m == 8){
    col = cur(uv) * vec3(1.04, 1.0, 0.95);
  } else if (m == 9){
    col = uAperture > 0.01 ? dof(uv, uFocus, uAperture) : cur(uv); col *= vec3(1.05,1.0,0.9);
  } else if (m == 10){
    col = cur(uv) * vec3(0.92,0.98,1.05);
    float rim = smoothstep(0.58, 0.61, r) - smoothstep(0.65, 0.68, r);
    col = mix(col, vec3(0.62,0.66,0.7), rim);
    col *= 1.0 - smoothstep(0.66, 0.7, r)*0.9;
  } else if (m == 11){
    vec2 c = uv-0.5; uv = 0.5 + c*(1.0 - 0.1*dot(c,c));
    col = cur(uv); float l = luma(col);
    col = mix(vec3(l), col, 1.3);
  } else if (m == 12){
    col = cur(uv);
  } else { col = cur(uv); }
  // a child's dream: big soft pixels, a box of sixteen sweets for colours, a dark-berry line round everything,
  // and it blows up from the middle of the eye like a bubble
  if (uDream > 0.001){
    vec2 px = floor(uRes/3.0), cell = floor(vUv*px), puv = (cell+0.5)/px;
    vec3 d = raw(puv);
    float z0 = lin(puv), zx = lin(puv + vec2(1.0/px.x, 0.0)), zy = lin(puv + vec2(0.0, 1.0/px.y));
    float edge = step(0.07, max(abs(zx-z0), abs(zy-z0))/max(z0, 0.05)) * step(z0, 60.0);
    d = clamp(pow(d, vec3(0.85))*1.08 + 0.03, 0.0, 1.0);
    vec3 c1 = uPal[0], c2 = uPal[0]; float d1 = 9.0, d2 = 9.0;
    for (int i = 0; i < 16; i++){ vec3 q = d - uPal[i]; float e = dot(q*q, vec3(0.3, 0.5, 0.2));
      if (e < d1){ d2 = d1; c2 = c1; d1 = e; c1 = uPal[i]; } else if (e < d2){ d2 = e; c2 = uPal[i]; } }
    float t = sqrt(d1)/(sqrt(d1)+sqrt(d2)+1e-5);
    d = bay4(cell) < t*1.1 ? c2 : c1;
    d = mix(d, uPal[0], edge*0.85);
    float sp = hash(cell + floor(uTime*4.0)*7.13);
    if (luma(d) > 0.78 && sp > 0.994) d = vec3(1.0, 0.98, 0.86);
    d = mix(d, vec3(1.0, 0.72, 0.86), smoothstep(0.5, 0.98, r)*0.4);
    float rr = r + 0.025*sin(atan(cc.y, cc.x)*7.0 + uTime*2.5);
    float R = uDream*1.3, mask = 1.0 - smoothstep(R-0.05, R, rr);
    float rim = (smoothstep(R-0.09, R-0.03, rr) - smoothstep(R-0.03, R+0.01, rr)) * step(uDream, 0.995);
    col = mix(col, d, mask);
    col = mix(col, vec3(1.0, 0.88, 0.97), rim*0.7);
  }
  // K02 (specs): warm paper, the light lifted, soft edges
  if (uWarmK > 0.001){ float l = luma(col); vec3 p = mix(vec3(l), col, 0.75)*vec3(1.06, 1.0, 0.86) + vec3(0.06, 0.04, 0.0); p += hash(floor(gl_FragCoord.xy/2.0))*0.04;
    p = mix(p, vec3(0.98, 0.93, 0.82), smoothstep(0.55, 1.05, r)*0.55); col = mix(col, p, uWarmK); }
  // K08 (specs): the town without its colour; only what is strongly coloured (his blue glove, a lamp) keeps some
  if (uEmpty > 0.001){ float l = luma(col), mx = max(col.r, max(col.g, col.b)), mn = min(col.r, min(col.g, col.b)), sat = (mx - mn)/max(mx, 0.001);
    vec3 g2 = vec3(l)*vec3(0.94, 0.97, 1.02)*0.92 + 0.04; float keep = smoothstep(0.42, 0.62, sat); col = mix(col, mix(g2, col, keep*0.9), uEmpty); col = mix(col, col*0.82, smoothstep(0.5, 1.0, r)*uEmpty); }
  // the other six inner worlds (specs F01 F03 F05 F06 F09 F10): one branch each, weighted by uFk
  if (uFk > 0.001){ int fx = int(uFx + 0.5); vec3 o = col; float l = luma(col), mx = max(col.r, max(col.g, col.b)), mn = min(col.r, min(col.g, col.b)), sat = (mx - mn)/max(mx, 0.001);
    vec2 ap = vec2(uAspect, 1.0);
    if (fx == 1){        // K01: a faded photograph; warm colour only where he really looks (the photo in his hand, the one he is watching); a faint after-image; the photo's edge
      vec3 fade = vec3(l)*vec3(1.04, 0.98, 0.86)*0.88 + vec3(0.07, 0.06, 0.04);
      float wa = uFa.w*(1.0 - smoothstep(uFa.z*0.6, uFa.z, length((vUv - uFa.xy)*ap))), wb = uFb.w*(1.0 - smoothstep(uFb.z*0.55, uFb.z, length((vUv - uFb.xy)*ap)));
      float w = max(wa, wb); o = mix(fade, col*vec3(1.08, 1.0, 0.9) + vec3(0.04, 0.02, 0.0), w);
      o = mix(o, texture2D(tPrevOut, uv).rgb, 0.2);
      vec2 e = min(vUv, 1.0 - vUv); float edge = min(e.x*uAspect, e.y); o = mix(o, vec3(0.97, 0.94, 0.86), (1.0 - smoothstep(0.02, 0.035, edge))*0.85); o = mix(o, o*0.9, smoothstep(0.035, 0.0, abs(edge - 0.04))*0.5); }
    else if (fx == 3){   // K03: a grey stage set; only the strongly coloured stays (his daughter, the old door colour)
      vec3 g2 = vec3(l)*vec3(0.95, 0.96, 1.0)*0.9 + 0.05; float keep = smoothstep(0.4, 0.6, sat); o = mix(g2, col, keep);
      o *= 1.0 - smoothstep(0.55, 1.1, r)*0.35; o = mix(o, o*0.92, step(0.5, fract(vUv.x*3.0 + 0.02*sin(vUv.y*9.0)))*0.08*(1.0 - keep)); }
    else if (fx == 5){   // K05: the street's lines kept, a deep quiet sky; her stars are scene lights
      float d = lin(uv); vec3 night = col*vec3(0.5, 0.58, 0.86) + vec3(0.01, 0.02, 0.06);
      vec3 sky = mix(vec3(0.03, 0.04, 0.12), vec3(0.1, 0.1, 0.26), vUv.y); float st = step(0.9975, hash(floor(gl_FragCoord.xy/2.0)))*0.9;
      o = d > uFar*0.9 ? sky + st : night; o = max(o, col*step(0.92, mx)*step(sat, 0.5)); }
    else if (fx == 6){   // K06: the street as a model on her table: tilt-shift, a little more colour, the table's edge with three cups (they straighten; the cat tips one)
      float bl = smoothstep(0.1, 0.38, abs(vUv.y - 0.5)); o = bl > 0.02 ? blur(uv, bl*7.0) : col; float ll = luma(o); o = mix(vec3(ll), o, 1.28)*1.04;
      if (vUv.y < 0.13){ float t2 = vUv.y/0.13; o = mix(vec3(0.58, 0.42, 0.32), vec3(0.78, 0.6, 0.46), t2); o *= 0.92 + 0.08*hash(floor(vec2(vUv.x*60.0, vUv.y*8.0))); if (vUv.y > 0.12) o = vec3(0.9, 0.78, 0.66); }
      for (int i = 0; i < 3; i++){ float fi = float(i), ang = fi == 0.0 ? uFa.x : fi == 1.0 ? uFa.y : uFa.z; vec2 c = vec2(0.22 + fi*0.28, 0.125);
        vec2 q = (vUv - c)*ap; q = mat2(cos(ang), sin(ang), -sin(ang), cos(ang))*q;
        float body = step(abs(q.x), 0.032)*step(0.0, q.y)*step(q.y, 0.075), handle = step(abs(length(q - vec2(0.042, 0.04)) - 0.016), 0.005)*step(0.032, q.x);
        float sh = step(abs(q.x - 0.012), 0.04)*step(abs(q.y + 0.004), 0.006);
        o = mix(o, o*0.7, sh*0.6); o = mix(o, vec3(0.98, 0.95, 0.9), max(body, handle)); o = mix(o, vec3(0.45, 0.32, 0.26), body*step(0.068, q.y)); } }
    else if (fx == 9){   // K09: the far town as a reflection, upside down and slipping sideways; where they meet it lines up
      float d = lin(uv); float far = smoothstep(18.0, 30.0, d); vec2 ruv = vec2(uv.x + uFa.x + 0.003*sin(uv.y*90.0 + uTime*2.0), 2.0*uFa.y - uv.y);
      vec3 rc = (ruv.y > 0.0 && ruv.y < 1.0) ? cur(clamp(ruv, 0.0, 1.0))*vec3(0.8, 0.9, 1.05) + vec3(0.02, 0.04, 0.08) : vec3(0.3, 0.36, 0.5);
      if (uFb.z > 0.5){ float fl = 1.0 - smoothstep(0.012, 0.03, length((vUv - uFb.xy)*ap)); rc = mix(rc, vec3(1.0, 0.62, 0.78), fl); }
      o = mix(col, rc, far*0.92); o = mix(o, o*vec3(0.9, 0.96, 1.05), smoothstep(0.6, 1.0, r)); }
    else if (fx == 10){  // K10: the street as it is, a little paler; the paper flowers are in the scene
      o = mix(vec3(l), col, 0.82)*1.02 + vec3(0.02, 0.01, 0.015); }
    col = mix(col, o, uFk); }
  // the dream grade: lavender in the shadows, pink-white in the light, soft contrast
  float LL = luma(col);
  vec3 dg = mix(col, vec3(LL), 0.06)*0.86 + vec3(0.085,0.065,0.13)*(1.0-LL) + vec3(0.05,0.025,0.045)*LL;
  col = mix(col, dg, uGrade*(1.0 - uDream*0.9));
  col = mix(col, col*vec3(1.1,1.0,0.86) + vec3(0.03,0.015,0.0), uWarm);
  // K07 (specs): the page — one live frame, two still frames from earlier, an empty balloon, a page that turns by itself
  if (uComic > 0.001){ vec2 px2 = gl_FragCoord.xy; vec3 page = vec3(0.99, 0.97, 0.94); vec2 a = (vUv - uRect.xy)/(uRect.zw - uRect.xy); vec3 pc = page;
    bool inMain = a.x > 0.0 && a.x < 1.0 && a.y > 0.0 && a.y < 1.0;
    if (inMain){ pc = comic(a, a*uRes); if (uSnapK > 0.0){ vec3 g = texture2D(tSnapA, a).rgb; pc = mix(pc, mix(pc, g, 0.5), 0.18*uSnapK); } }
    vec4 s1 = vec4(uRect.z + 0.025, 0.53, 0.975, uRect.w), s2 = vec4(uRect.z + 0.025, uRect.y, 0.975, 0.47);
    vec2 b1 = (vUv - s1.xy)/(s1.zw - s1.xy), b2 = (vUv - s2.xy)/(s2.zw - s2.xy);
    if (b1.x > 0.0 && b1.x < 1.0 && b1.y > 0.0 && b1.y < 1.0) pc = mix(page, still(tSnapA, b1, px2), uSnapK);
    if (b2.x > 0.0 && b2.x < 1.0 && b2.y > 0.0 && b2.y < 1.0) pc = mix(page, still(tSnapB, b2, px2), step(0.5, uSnapK));
    float fl = 0.0; vec4 rs[3]; rs[0] = uRect; rs[1] = s1; rs[2] = s2;
    for (int i = 0; i < 3; i++){ vec4 q = rs[i]; vec2 p0 = (vUv - q.xy)*uRes, p1 = (q.zw - vUv)*uRes; float inside = step(0.0, p0.x)*step(0.0, p0.y)*step(0.0, p1.x)*step(0.0, p1.y); float bd = min(min(p0.x, p0.y), min(p1.x, p1.y)); fl = max(fl, inside*step(bd, 3.0)); }
    pc = mix(pc, vec3(0.1, 0.09, 0.14), fl);
    if (uBubble.z > 0.5 && inMain){ vec2 bp = uBubble.xy, d2 = (a - bp)*vec2(uAspect*(uRect.z - uRect.x)/(uRect.w - uRect.y), 1.0); float e2 = length(d2*vec2(1.0, 1.5));
      float tail = step(0.0, -(a.y - bp.y + 0.05))*step(abs(a.x - bp.x + (a.y - bp.y)*0.6 + 0.01), 0.012)*step(bp.y - 0.11, a.y);
      if (e2 < 0.075 || tail > 0.5) pc = vec3(1.0); if (abs(e2 - 0.075) < 0.004) pc = vec3(0.1, 0.09, 0.14); }
    float sweep = smoothstep(uFlip - 0.02, uFlip, 1.0 - vUv.x)*step(0.001, uFlip)*step(uFlip, 0.999); pc = mix(pc, page, sweep*0.9);
    col = mix(col, pc, uComic); }
  gl_FragColor = vec4(col, glow);
}`;
const FSB = `
precision highp float;
uniform sampler2D tOut; uniform float uTime, uAspect, uOpen, uTMode, uGrain; varying vec2 vUv;
float bayer2(vec2 a){ a = floor(a); return fract(a.x/2.0 + a.y*a.y*0.75); }
float bayer4(vec2 a){ return bayer2(0.5*a)*0.25 + bayer2(a); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 uv = vUv; vec3 col = texture2D(tOut, uv).rgb;
  vec2 c = (vUv-0.5)*vec2(uAspect,1.0); float r = length(c);
  col *= 1.0 - smoothstep(0.65, 1.15, r)*0.16;
  if (uTMode > 2.5){                  // a monitor switching feeds: a short tear of static
    float s = 1.0-uOpen, n = hash(floor(gl_FragCoord.xy*vec2(0.25,1.0)) + floor(uTime*30.0));
    float band = step(0.5, fract(vUv.y*6.0 + uTime*9.0));
    col = mix(col, vec3(n*0.55 + 0.05), clamp(s*1.4, 0.0, 1.0)) * (1.0 - s*0.35*band);
  } else if (uTMode > 0.5 && uTMode < 1.5){
    float w = 0.012 + pow(uOpen, 1.7)*1.3*uAspect, h = 0.18 + uOpen*0.95;
    float e = (c.x*c.x)/(w*w) + (c.y*c.y)/(h*h);
    col *= 1.0 - smoothstep(0.82, 1.0, e);
  } else col *= uOpen;
  col += (hash(gl_FragCoord.xy + fract(uTime)*91.0) - 0.5) * uGrain;
  float L = 40.0;
  col = floor(col*L + bayer4(gl_FragCoord.xy)) / L;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
const PAL = ['#3a1d44','#7a4436','#c47e5a','#f2bc84','#fff1dc','#ff8fb8','#ffc6de','#e0578e','#94e6cc','#4fb4a4','#a8d8ff','#6c8ce4','#c8a8f2','#fff08a','#ffb27a','#ffffff'].map(c=>{ const o = {}; new THREE.Color(c).getRGB(o, THREE.SRGBColorSpace); return new THREE.Vector3(o.r, o.g, o.b); });
const post = new THREE.ShaderMaterial({ vertexShader:VS, fragmentShader:FS, depthTest:false, depthWrite:false, uniforms:{
  tCur:{value:null}, tPrevScene:{value:null}, tPrevOut:{value:null}, tDepth:{value:null}, tRaw:{value:null}, tSnapA:{value:null}, tSnapB:{value:null}, uRes:{value:new THREE.Vector2(1,1)},
  uTime:{value:0}, uMode:{value:0}, uNear:{value:0.1}, uFar:{value:200}, uFocus:{value:1}, uAperture:{value:0},
  uWind:{value:0}, uAspect:{value:1}, uSpin:{value:0}, uIR:{value:0}, uZoom:{value:1}, uBarrel:{value:0.06}, uSignal:{value:1}, uWarm:{value:0}, uGrade:{value:1}, uDream:{value:0},
  uFx:{value:0}, uFk:{value:0}, uFa:{value:new THREE.Vector4()}, uFb:{value:new THREE.Vector4()}, uFc:{value:new THREE.Vector4()}, uWarmK:{value:0}, uEmpty:{value:0}, uComic:{value:0}, uFlip:{value:0}, uSnapK:{value:0}, uRect:{value:new THREE.Vector4(0, 0, 1, 1)}, uBubble:{value:new THREE.Vector3(-1, -1, 0)}, uPal:{value:PAL} } });
const blit = new THREE.ShaderMaterial({ vertexShader:VS, fragmentShader:FSB, depthTest:false, depthWrite:false, uniforms:{ tOut:{value:null}, uTime:{value:0}, uAspect:{value:1}, uOpen:{value:0}, uTMode:{value:3}, uGrain:{value:0.012} } });
const copyM = new THREE.ShaderMaterial({ vertexShader:VS, fragmentShader:`uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(t, vUv).rgb, 1.0); }`, uniforms:{ t:{ value:null } }, depthTest:false, depthWrite:false });
const fxMat = post;                                            // (the inner worlds below set their uniforms on index's post pass)
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post), qScene = new THREE.Scene(), qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); quad.frustumCulled = false; qScene.add(quad);
// index's double buffers: the last frame's picture (for the cat's and dog's lingering motion) and the last post output (its glow in alpha)
const RT = { w:0, h:0, scene:[null, null], out:[null, null], fi:0, oi:0 };
function rts(){ const v = renderer.getDrawingBufferSize(new THREE.Vector2()); if (RT.w === v.x && RT.h === v.y) return; RT.w = v.x; RT.h = v.y;
  [...RT.scene, ...RT.out].forEach(t=>t && t.dispose()); for (let i=0;i<2;i++){ RT.scene[i] = new THREE.WebGLRenderTarget(v.x, v.y); RT.out[i] = new THREE.WebGLRenderTarget(v.x, v.y, { type:THREE.HalfFloatType }); } }
const S = { fD:0.1, mode:2, barrel:0.06, ir:0, signal:1 };
function finalFn(shown, rawTex, depth, c){ rts(); const U = post.uniforms;
  U.tCur.value = shown; U.tRaw.value = rawTex; U.tDepth.value = depth; U.tPrevScene.value = RT.scene[1 - RT.fi].texture; U.tPrevOut.value = RT.out[1 - RT.oi].texture;
  U.uNear.value = c.near; U.uFar.value = c.far; U.uRes.value.set(RT.w, RT.h); U.uAspect.value = RT.w/Math.max(1, RT.h); U.uTime.value = performance.now()/1000;
  quad.material = post; renderer.setRenderTarget(RT.out[RT.oi]); renderer.render(qScene, qCam);
  if (Math.round(U.uMode.value) === 1){ copyM.uniforms.t.value = shown; quad.material = copyM; renderer.setRenderTarget(RT.scene[RT.fi]); renderer.render(qScene, qCam); }   // only the cat and the dog look back a frame
  blit.uniforms.tOut.value = RT.out[RT.oi].texture; blit.uniforms.uTime.value = U.uTime.value; blit.uniforms.uAspect.value = U.uAspect.value; blit.uniforms.uOpen.value = tr.open;
  blit.uniforms.uTMode.value = tr.phase === 'close' ? TRANS[KIND[kindOf(tr.next.kind, tr.next.id)].trans][2] : tr.mode; blit.uniforms.uGrain.value = V.kind === 'cam' && !SHOW.on ? 0.05 : 0.01;   // (index 0.022: under the oil paint its noise vanished; the camera keeps a visible grain)
  quad.material = blit; renderer.setRenderTarget(null); renderer.render(qScene, qCam); RT.fi = 1 - RT.fi; RT.oi = 1 - RT.oi; }
C.FINAL.fx = () => finalFn;

/* ---------------------------------------------------------------------
   EYES (index's camera code: a steady eye that follows the head with a lag; the CCTV's eased pan, tilt and zoom)
   --------------------------------------------------------------------- */
const animalOf = (id) => (L.VIEW_ANIMALS.find(v=>v.id === id) || L.VIEW_ANIMALS[2]).A;
const _e = new THREE.Vector3(), _q = new THREE.Quaternion(), _f = new THREE.Vector3();
// the eye's place and the way it faces: people look along their head's +x, the cat along +z, the dog and the birds +x; a thing at its anchor toward what it watches
function eyeOf(){ if (V.kind === 'person'){ const P = P_OF(V.id), h = P.pp.head; h.updateWorldMatrix(true, false); h.getWorldPosition(_e); h.getWorldQuaternion(_q); _f.set(1, 0, 0).applyQuaternion(_q); _e.addScaledVector(_f, 0.1*P.pp.S); _e.y += 0.05*P.pp.S/0.82; return _e; }
  if (V.kind === 'animal'){ const A = animalOf(V.id); A.head.updateWorldMatrix(true, false); A.head.getWorldPosition(_e); A.head.getWorldQuaternion(_q); _f.set(A === L.CAT ? 0 : 1, 0, A === L.CAT ? 1 : 0).applyQuaternion(_q); _e.y += A === L.CAT ? 0.02 : 0.05; return _e; }
  if (V.kind === 'thing'){ const T = THINGS.find(t=>t.id === V.id); _e.copy(T.pos()); const l = typeof T.look === 'function' ? T.look() : T.look; _f.set(l[0] - _e.x, l[1] - _e.y, l[2] - _e.z).normalize(); return _e; }
  if (V.kind === 'cam') return _e.copy(CAM(V.id).pos);
  return _e.set(0, 5, 0); }
function camera(dt){
  if (SHOW.on){ showTick(dt); return; }
  hoverPick();
  // index's transitions: close, change the eyes, open
  if (tr.phase === 'close'){ tr.t += dt; tr.open = Math.max(0, 1 - tr.t/tr.close); if (tr.t >= tr.close){ applyView(tr.next); tr.phase = 'open'; tr.t = 0; tr.mode = tr.nextMode; } }
  else if (tr.phase === 'open'){ tr.t += dt; tr.open = Math.min(1, tr.t/tr.dur); if (tr.t >= tr.dur){ tr.phase = 'idle'; tr.open = 1; } }
  const v = KIND[kindOf(V.kind, V.id)]; let gone = null; S.barrel = 0.06; S.ir = 0; S.signal = 1;
  if (v.cctv){ const c = CAM(V.id), kk = 1 - Math.exp(-dt*3.2);
    ccLook.yaw += (ccLook.ty - ccLook.yaw)*kk; ccLook.pitch += (ccLook.tp - ccLook.pitch)*kk; ccLook.zoom += (ccLook.tz - ccLook.zoom)*kk;
    cam.fov = c.fov/ccLook.zoom; cam.near = 0.08; cam.updateProjectionMatrix();
    if (c.follow === 'tram'){ C.TRAM.updateWorldMatrix(true, false); cam.position.copy(C.TRAM.localToWorld(c.pos.clone())); cam.rotation.set(-0.12 + ccLook.pitch, C.TRAM.rotation.y + Math.PI + ccLook.yaw, 0, 'YXZ'); }
    else { cam.position.copy(c.pos); cam.rotation.set(c.pitch0 + ccLook.pitch, c.yaw0 + ccLook.yaw, 0, 'YXZ'); }
    S.ir = c.ir ? smooth(0.45, 0.8, C.night(C.hour())) : 0; }
  else { const e = eyeOf().clone(), kd = kindOf(V.kind, V.id), upright = V.kind === 'person' && !P_OF(V.id).seated && !P_OF(V.id).driving;
    if (V.kind === 'person' && P_OF(V.id).hidden) gone = e;
    let yaw0 = Math.atan2(-_f.x, -_f.z), pitch0 = Math.asin(clamp(_f.y, -1, 1));
    if (upright) pitch0 = clamp(pitch0, -0.22, 0.2);
    if (!camSmooth.init){ camSmooth.yaw = yaw0; camSmooth.pitch = pitch0; camSmooth.y = e.y; camSmooth.init = true; }
    const ks = 1 - Math.exp(-dt*(kd === 'radio' || kd === 'tramlight' || (V.kind === 'person' && (P_OF(V.id).driving || P_OF(V.id).w.ride)) ? 8 : upright ? 1.5 : 2.6));
    camSmooth.yaw += wrapA(yaw0 - camSmooth.yaw)*ks; camSmooth.pitch += (pitch0 - camSmooth.pitch)*ks; camSmooth.y += (e.y - camSmooth.y)*(1 - Math.exp(-dt*3));
    cam.position.set(e.x, camSmooth.y, e.z); cam.near = V.kind === 'animal' ? 0.03 : 0.05;
    cam.rotation.set(clamp(camSmooth.pitch + look.pitch, -1.45, 1.45), camSmooth.yaw + look.yaw, 0, 'YXZ'); cam.fov = v.fov; cam.updateProjectionMatrix(); }
  if (gone && tr.phase === 'idle') setP('cam', nearestCam(gone));
  S.mode = v.mode; const U = post.uniforms; U.uMode.value = S.mode; U.uBarrel.value = S.barrel; U.uIR.value = S.ir; U.uSignal.value = S.signal; U.uZoom.value = v.cctv ? ccLook.zoom : 1;
  U.uGrade.value = v.cctv ? 0.55 : 1; U.uAperture.value = 0; U.uFocus.value = 12;
  dreamTick(dt);
  const tc = $('#camtc'); if (tc && V.kind === 'cam'){ const h = C.hour(); tc.textContent = String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1)*60)).padStart(2, '0'); }
  if ((window.__whoT = (window.__whoT || 0) + dt) > 0.5){ window.__whoT = 0; refreshWho(); } }
const COMIC = { rect:[0.03, 0.12, 0.72, 0.88], snapA:null, snapB:null, t:0, flip:0, n:0 };
function toggleDream(){ if (V.kind !== 'person') return; const id = DREAM_OF[V.id]; if (!id) return;
  if (V.dream){ V.dreamWant = false; dreamOff(false); } else { V.dreamWant = true; V.dream = id; V.dreamToken = ++V.token; DREAMS[id].enter(); } ui(); }
function dreamOff(now){ const id = V.dream; if (!id) return; V.dreamExit = id; if (now){ V.dreamK = 0; DREAMS[id].exit(); V.dream = null; V.dreamExit = null; } else V.dreamWant = false; ui(); }
function dreamTick(dt){ const id = V.dream; if (!id){ setU(0); return; } const want = V.dreamWant ? 1 : 0, sp = id === 'F04' ? 1/1.3 : 1/0.6;
  V.dreamK = clamp(V.dreamK + (want ? 1 : -1)*dt*sp, 0, 1); DREAMS[id].tick(dt, V.dreamK);
  if (!want && V.dreamK <= 0){ DREAMS[id].exit(); V.dream = null; setU(0); ui(); } }
function setU(k){ const U = fxMat.uniforms; U.uDream.value = 0; U.uWarmK.value = 0; U.uEmpty.value = 0; U.uComic.value = 0; U.uFk.value = 0; }
const DREAMS = {};
const SAVE = { list:[] };                      // render-local changes made in pre(), undone in post() (also on an error)
const later = (fn) => SAVE.list.push(fn);

// F04 — K04, the candy world (index's dream): her picture through the sweets' palette, the town as she sees it for this frame only
const CANDY = { u:{ value:0 }, built:false, clouds:[], canes:null, beans:[], ears:null, mons:[] };
{ // every Lambert surface gets the sweets' colours when uCandy > 0 (one shared uniform; nothing is recompiled to switch)
  const patched = new WeakSet(); const GLSL = `uniform float uCandy;
    vec3 c_rgb2hsl(vec3 c){ float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), l = (mx + mn)*0.5, h = 0.0, s = 0.0; if (mx > mn){ float d = mx - mn; s = l > 0.5 ? d/(2.0 - mx - mn) : d/(mx + mn);
      if (mx == c.r) h = (c.g - c.b)/d + (c.g < c.b ? 6.0 : 0.0); else if (mx == c.g) h = (c.b - c.r)/d + 2.0; else h = (c.r - c.g)/d + 4.0; h /= 6.0; } return vec3(h, s, l); }
    float c_h2(float p, float q, float t){ t = fract(t); if (t < 1.0/6.0) return p + (q - p)*6.0*t; if (t < 0.5) return q; if (t < 2.0/3.0) return p + (q - p)*(2.0/3.0 - t)*6.0; return p; }
    vec3 c_hsl2rgb(vec3 x){ float h = x.x, s = x.y, l = x.z; if (s < 1e-4) return vec3(l); float q = l < 0.5 ? l*(1.0 + s) : l + s - l*s, p = 2.0*l - q; return vec3(c_h2(p, q, h + 1.0/3.0), c_h2(p, q, h), c_h2(p, q, h - 1.0/3.0)); }
    vec3 candyOf(vec3 lin, float id){ vec3 c = pow(max(lin, 0.0), vec3(0.4545)); vec3 x = c_rgb2hsl(c); vec3 o;
      if (x.y < 0.3){ if (x.z < 0.58) o = c_hsl2rgb(vec3(0.03, 0.45, 0.2 + (x.z - 0.3)*0.5)); else if (x.z < 0.74) o = c_hsl2rgb(vec3(0.08, 0.7, 0.55 + (x.z - 0.58)*0.8));
        else { float k = floor(fract(id)*6.0); o = k < 1.0 ? vec3(1.0, 0.945, 0.863) : k < 2.0 ? vec3(1.0, 0.776, 0.871) : k < 3.0 ? vec3(0.784, 0.941, 0.878) : k < 4.0 ? vec3(1.0, 0.957, 0.659) : k < 5.0 ? vec3(0.812, 0.902, 1.0) : vec3(0.902, 0.831, 1.0); } }
      else if (x.x > 0.2 && x.x < 0.47) o = fract(id*7.0) < 0.7 ? c_hsl2rgb(vec3(0.93, 0.85, 0.8)) : c_hsl2rgb(vec3(0.43, 0.65, 0.74));
      else { float bd = 9.0; float H[6]; H[0] = 0.95; H[1] = 0.42; H[2] = 0.13; H[3] = 0.55; H[4] = 0.76; H[5] = 0.06; for (int i = 0; i < 6; i++){ float d = H[i] - x.x; d -= floor(d + 0.5); if (abs(d) < abs(bd)) bd = d; } o = c_hsl2rgb(vec3(fract(x.x + bd), 0.65 + x.y*0.3, 0.48 + x.z*0.4)); }
      return pow(o, vec3(2.2)); }`;
  const patch = (mt) => { if (!mt || patched.has(mt) || !mt.isMeshLambertMaterial || mt.userData.noDream) return; patched.add(mt); const prev = mt.onBeforeCompile;
    mt.onBeforeCompile = (sh, r) => { prev && prev.call(mt, sh, r); sh.uniforms.uCandy = CANDY.u;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GLSL).replace('#include <color_fragment>', `#include <color_fragment>
        if (uCandy > 0.001){ float cid = fract(sin(dot(floor(vViewPosition.xy*0.0 + gl_FragCoord.xy*0.0) + vec2(diffuseColor.r*91.0, diffuseColor.g*37.0 + diffuseColor.b*13.0), vec2(12.9898, 78.233)))*43758.5453); diffuseColor.rgb = mix(diffuseColor.rgb, candyOf(diffuseColor.rgb, cid), uCandy); }`); };
    const pk = mt.customProgramCacheKey; mt.customProgramCacheKey = () => (pk ? pk.call(mt) : '') + '|candy1'; mt.needsUpdate = true; };
  scene.traverse(o=>{ const m = o.material; if (!m) return; (Array.isArray(m) ? m : [m]).forEach(patch); });
  CANDY.patch = patch; }
function buildCandy(){ if (CANDY.built) return; CANDY.built = true;
  const dmat = (o) => { const m = new THREE.MeshLambertMaterial(o); m.userData.noDream = true; return m; };
  // houses of cloud (index's buildTown): a heap of puffs on each building, an overhang along the eaves, not at the doors
  const puff = new THREE.SphereGeometry(1, 10, 7), tones = ['#ffffff', '#ffe8f2', '#f0e8ff', '#e8f4ff', '#fff4e4', '#ffe0ec'].map(c=>new THREE.Color(c));
  let q = 31; const R = () => (q = (q*16807) % 2147483647)/2147483647;
  C.BUILD.forEach((b, bi)=>{ const bx = b.box; if (!bx || bx.isEmpty()) return; const sz = bx.getSize(new THREE.Vector3()); if (sz.x < 2 || sz.z < 2 || sz.x > 40 || sz.z > 40) return;
    const x0 = bx.min.x, x1 = bx.max.x, z0 = bx.min.z, z1 = bx.max.z, y0 = bx.min.y, T = bx.max.y, xc = (x0 + x1)/2, zc = (z0 + z1)/2, P = [], add = (x, y, z, r) => P.push([x - xc, y - y0, z - zc, r]);
    for (let x = x0 - 0.2; x <= x1 + 0.21; x += 1.6) for (let z = z0 - 0.2; z <= z1 + 0.21; z += 1.6){ const inner = Math.min(x - x0, x1 - x, z - z0, z1 - z)/Math.max(1, Math.min(sz.x, sz.z)/2); add(x + (R() - 0.5)*0.4, T - 0.5 + inner*1.4 + R()*0.4, z + (R() - 0.5)*0.4, 0.95 + R()*0.6 + inner*0.5); }
    for (let a = 0; a <= sz.x; a += 1.3){ add(x0 + a, T - 1.0 - R()*0.3, z0 - 0.25, 0.75 + R()*0.35); add(x0 + a, T - 1.0 - R()*0.3, z1 + 0.25, 0.75 + R()*0.35); }
    for (let a = 0; a <= sz.z; a += 1.3){ add(x0 - 0.25, T - 1.0 - R()*0.3, z0 + a, 0.75 + R()*0.35); add(x1 + 0.25, T - 1.0 - R()*0.3, z0 + a, 0.75 + R()*0.35); }
    const im = new THREE.InstancedMesh(puff, dmat({ color:'#ffffff', emissive:'#fff0f8', emissiveIntensity:0.18 }), P.length), M4 = new THREE.Matrix4(), c = new THREE.Color();
    P.forEach(([x, y, z, r], i)=>{ M4.makeScale(r, r*0.86, r).setPosition(x, y, z); im.setMatrixAt(i, M4); im.setColorAt(i, c.copy(tones[bi % tones.length]).offsetHSL(0, 0, (R() - 0.5)*0.05)); });
    im.position.set(xc, y0, zc); im.visible = false; im.frustumCulled = false; im.raycast = () => {}; scene.add(im); CANDY.clouds.push({ im, b, ph:R()*6 }); });
  // lamps are candy canes: a striped stick over each lamp post
  const stripe = (()=>{ const c = document.createElement('canvas'); c.width = 8; c.height = 8; const g = c.getContext('2d'); g.fillStyle = '#fff4f0'; g.fillRect(0, 0, 8, 8); g.fillStyle = '#ff4f7a'; for (let i = -8; i < 8; i += 4){ g.beginPath(); g.moveTo(i, 8); g.lineTo(i + 8, 0); g.lineTo(i + 9.5, 0); g.lineTo(i + 1.5, 8); g.fill(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 7); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const caneG = new THREE.CylinderGeometry(0.11, 0.11, 4.0, 8); caneG.translate(0, 2.0 + C.G, 0); CANDY.canes = new THREE.InstancedMesh(caneG, dmat({ color:'#ffffff', map:stripe }), C.LAMP_AT.length);
  C.LAMP_AT.forEach(([x, z], i)=>{ CANDY.canes.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 0, z)); }); CANDY.canes.visible = false; CANDY.canes.frustumCulled = false; scene.add(CANDY.canes);
  // cars are jelly beans that hop
  const BEAN = new THREE.CapsuleGeometry(0.78, 2.0, 4, 12); BEAN.rotateZ(Math.PI/2); const BC = ['#ff6fa4', '#6fd6b0', '#ffd65a', '#8fb8ff', '#b98cf2', '#ff9a5a', '#7ee07e', '#ff5a6a'];
  C.CARS.forEach((c, i)=>{ const g = new THREE.Group(); const body = new THREE.Mesh(BEAN, dmat({ color:BC[i % BC.length], emissive:BC[i % BC.length], emissiveIntensity:0.12 })); body.position.y = 0.85; g.add(body);
    [-0.32, 0.32].forEach(z=>{ const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.24), dmat({ color:'#fffaf2' })); w.position.set(1.72, 1.08, z); g.add(w); const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.12), dmat({ color:'#2a1838' })); p.position.set(1.75, 1.04, z); g.add(p); });
    g.visible = false; c.g.add(g); CANDY.beans.push({ c, g, i }); });
  // the father: a big soft bear (ears on his head); others: little monster parts on their heads
  const bearM = dmat({ color:'#8a5a3a' }), bearIn = dmat({ color:'#e8b48a' }), F = P_OF('K03').pp, HD = F.HD; CANDY.ears = new THREE.Group(); CANDY.ears.position.y = HD*1.18; F.head.add(CANDY.ears); CANDY.ears.visible = false;
  [-1, 1].forEach(sg=>{ const e = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.17, 0.17), bearM); e.position.set(-0.02, 0.1, sg*HD*0.46); CANDY.ears.add(e); const e2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.09), bearIn); e2.position.set(0.04, 0.09, sg*HD*0.46); CANDY.ears.add(e2); });
  const MC = ['#9ce6c8', '#c8a8f2', '#a8d8ff', '#ffb27a', '#fff08a', '#ff9ec4', '#b4f0a0'];
  L.PEOPLE.forEach((P, n)=>{ if (P.id === 'K04' || P.id === 'K03') return; const g = new THREE.Group(); g.position.y = P.pp.HD*1.18; g.scale.setScalar(1.7); P.pp.head.add(g); g.visible = false; const m = dmat({ color:MC[n % MC.length] });
    const kind = n % 4; if (kind === 0) [-1, 1].forEach(sg=>{ const a = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.26, 0.025), dmat({ color:'#2a1838' })); a.position.set(-0.02, 0.1, sg*P.pp.HD*0.25); g.add(a); const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), m); b2.position.set(-0.02, 0.25, sg*P.pp.HD*0.25); g.add(b2); });
    if (kind === 1) [-1, 1].forEach(sg=>{ const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 5), dmat({ color:'#fff1dc' })); c2.position.set(0, 0.06, sg*P.pp.HD*0.32); c2.rotation.x = sg*0.35; g.add(c2); });
    if (kind === 2) [-1, 1].forEach(sg=>{ const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 5), m); c2.position.set(-0.02, 0.08, sg*P.pp.HD*0.3); c2.rotation.x = sg*0.2; g.add(c2); });
    if (kind === 3) [0, 1, 2].forEach(j=>{ const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.13, 5), dmat({ color:'#fff1dc' })); c2.position.set(-P.pp.HD*0.2 + j*P.pp.HD*0.22, 0.05, 0); g.add(c2); });
    CANDY.mons.push(g); });
  L.CAT.base = L.CAT.s; }
const CANDY_TOP = new THREE.Color('#ffa8d0'), CANDY_HOR = new THREE.Color('#fff0d4'), CANDY_SUN = new THREE.Color('#fff08a');
DREAMS.F04 = { enter(){ buildCandy(); }, exit(){}, tick(dt, k){ fxMat.uniforms.uDream.value = C.ease ? C.ease(k) : k; },
  pre(k){ const e = C.ease ? C.ease(k) : k; CANDY.u.value = e; const on = e > 0.4;
    CANDY.clouds.forEach(c=>{ const inside = c.b.box.containsPoint(cam.position); c.im.visible = on && !inside; if (c.im.visible){ const s = smooth(0.4, 1, e), br = Math.sin(performance.now()/1000*0.7 + c.ph)*0.02; c.im.scale.set(lerp(0.85, 1, s)*(1 + br*0.5), lerp(0.6, 1, s)*(1 + br), lerp(0.85, 1, s)*(1 + br*0.5)); } });
    CANDY.canes.visible = on; CANDY.ears.visible = e > 0.05; CANDY.mons.forEach(m=>{ m.visible = e > 0.05; m.scale.setScalar(1.7*Math.max(0.01, e)); });
    const dad = P_OF('K03').pp.g, s0 = dad.scale.x; dad.scale.setScalar(s0*lerp(1, 1.4, e)); later(()=>dad.scale.setScalar(s0));
    const cat = L.CAT.g, cs = cat.scale.clone(); cat.scale.multiplyScalar(lerp(1, 3.1, e)); later(()=>cat.scale.copy(cs));
    CANDY.beans.forEach(B=>{ const ch = B.c.g.children; const vis = ch.map(x=>x.visible); if (on){ ch.forEach(x=>{ if (x !== B.g) x.visible = false; }); B.g.visible = true; B.g.position.y = Math.abs(Math.sin(performance.now()/1000*6 + B.i*1.7))*0.14; } later(()=>{ ch.forEach((x, i)=>x.visible = vis[i]); B.g.visible = false; }); });
    L.PIGEONS.forEach(B=>{ const s = B.g.scale.x; B.g.scale.setScalar(s*lerp(1, 3, e)); later(()=>B.g.scale.setScalar(s)); });
    const U = C.WX.SKYU, top = U.uTop.value.clone(), hor = U.uHor.value.clone(), bg = scene.background.clone(), fog = scene.fog.color.clone(), rc = C.WX.RU.uCol.value.clone();
    U.uTop.value.lerp(CANDY_TOP, e); U.uHor.value.lerp(CANDY_HOR, e); scene.background.lerp(CANDY_HOR, e); scene.fog.color.lerp(CANDY_HOR, e); C.WX.RU.uCol.value.lerp(new THREE.Color('#ff8fb8'), e);   // rain is sprinkles
    const hi = C.hemi.intensity, si = C.sun.intensity; C.hemi.intensity *= 1 + 0.25*e; C.sun.intensity *= 1 - 0.25*e;
    later(()=>{ U.uTop.value.copy(top); U.uHor.value.copy(hor); scene.background.copy(bg); scene.fog.color.copy(fog); C.WX.RU.uCol.value.copy(rc); C.hemi.intensity = hi; C.sun.intensity = si; CANDY.u.value = 0;
      CANDY.clouds.forEach(c=>c.im.visible = false); CANDY.canes.visible = false; CANDY.ears.visible = false; CANDY.mons.forEach(m=>m.visible = false); }); } };

// F02 — K02 flying: her eyes drift up and round on a fixed curve (the body stays on the bench); warm paper; chairs, pots and passers-by lift
const FLY = { k:0, t:0, props:null, prints:null };
function buildFly(){ if (FLY.props) return; FLY.props = new THREE.Group(); scene.add(FLY.props); const m = (c) => { const x = new THREE.MeshLambertMaterial({ color:c, flatShading:true }); x.userData.noDream = true; return x; };
  const mk = (kind, i) => { const g = new THREE.Group(); if (kind === 'chair'){ const s = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), m('#d8c0d0')); s.position.y = 0.45; g.add(s); const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.44), m('#d8c0d0')); b2.position.set(-0.2, 0.7, 0); g.add(b2); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b3])=>{ const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), m('#7a7088')); l.position.set(a, 0.22, b3); g.add(l); }); }
    else { const p = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.34), m(['#e4c0cc', '#c8d8e8', '#f4e4c8'][i % 3])); p.position.y = 0.15; g.add(p); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), m('#9ad0a8')); l.position.y = 0.45; g.add(l); }
    g.userData.ph = i*1.3; g.userData.r = 3 + (i % 4)*1.6; g.userData.a = i*1.05; FLY.props.add(g); return g; };
  for (let i=0;i<8;i++) mk(i % 2 ? 'chair' : 'pot', i); FLY.props.visible = false;
  // young footsteps where her cane's shadow falls (pale prints ahead of her, fading)
  FLY.prints = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.01, 0.24), new THREE.MeshBasicMaterial({ color:'#fff2c8', transparent:true, opacity:0.75, depthWrite:false }), 10); FLY.prints.frustumCulled = false; FLY.prints.visible = false; scene.add(FLY.prints);
  FLY.ground = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshBasicMaterial({ color:'#ffe6b8', transparent:true, opacity:0.5, depthWrite:false })); FLY.ground.rotation.x = -Math.PI/2; FLY.ground.visible = false; scene.add(FLY.ground);
  FLY.ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.45, 32), new THREE.MeshBasicMaterial({ color:'#fff4d0', transparent:true, opacity:0.6, depthWrite:false, side:THREE.DoubleSide })); FLY.ring.rotation.x = -Math.PI/2; FLY.ring.visible = false; scene.add(FLY.ring); }
DREAMS.F02 = { enter(){ buildFly(); FLY.t = 0; }, exit(){}, tick(dt, k){ FLY.k = k; FLY.t += dt; fxMat.uniforms.uWarmK.value = smooth(0, 1, k); },
  // the float: up to ~8 m over her head and out to ~12 m on a slow curve; held low under a roof or in the room (no flying through ceilings)
  offset(){ const P = P_OF('K02'), e = smooth(0, 1, FLY.k), roofed = P.room || C.WX.coverAt(P.w.x, P.w.z) > P.w.y + 2.0 || P.w.ride, up = roofed ? 0.25 : 1;
    const u = Math.min(1, FLY.t/9), ang = FLY.t*0.06, h = (1.5 + 6.5*smooth(0, 1, u))*up, rad = (3 + 9*smooth(0.1, 1, u))*up;
    return new THREE.Vector3(Math.cos(ang)*rad, h, Math.sin(ang)*rad).multiplyScalar(e); },
  pre(k){ const e = smooth(0, 1, k), P = P_OF('K02'); if (!FLY.props) return; FLY.props.visible = e > 0.02 && !P.room; const base = P.pp.g.position, tt = performance.now()/1000;
    FLY.props.children.forEach(g=>{ const a = g.userData.a + tt*0.05, r = g.userData.r; g.position.set(base.x + Math.cos(a)*r, base.y + e*(0.6 + 1.2*(0.5 + 0.5*Math.sin(tt*0.6 + g.userData.ph))), base.z + Math.sin(a)*r); g.rotation.set(Math.sin(tt*0.4 + g.userData.ph)*0.3, a, Math.cos(tt*0.5 + g.userData.ph)*0.2); });
    // passers-by lift a little and sway (not her, not the dog)
    L.PEOPLE.forEach(Q=>{ if (Q.id === 'K02' || Q.hidden) return; const g = Q.pp.g, d = g.position.distanceTo(base); if (d > 30) return; const y = g.position.y; g.position.y += e*(0.35 + 0.35*Math.sin(tt*0.8 + Q.pp.seed)); later(()=>{ g.position.y = y; }); });
    // her steps as they were: prints ahead of her on the ground; the dog's patch of ground that does not float; the pigeons' spot
    FLY.prints.visible = e > 0.1 && !P.room; if (FLY.prints.visible){ const f = P.w.yaw; for (let i=0;i<10;i++){ const s = (i % 2 ? 1 : -1)*0.13, d = 0.6 + i*0.42, x = base.x + Math.cos(f)*d - Math.sin(f)*s, z = base.z - Math.sin(f)*d - Math.cos(f)*s;
        FLY.prints.setMatrixAt(i, new THREE.Matrix4().makeRotationY(f - Math.PI/2).setPosition(x, C.WORLD.floorAt(x, z) + 0.02, z)); } FLY.prints.instanceMatrix.needsUpdate = true; FLY.prints.material.opacity = 0.65*e; }
    FLY.ground.visible = e > 0.1 && !L.DOG.room; FLY.ground.position.set(L.DOG.x, L.DOG.y + 0.02, L.DOG.z); FLY.ground.material.opacity = 0.5*e;
    FLY.ring.visible = e > 0.1 && !P.room; FLY.ring.position.set(L.PL.PLAZA_FEED.x, C.G + 0.03, L.PL.PLAZA_FEED.z); FLY.ring.material.opacity = 0.55*e;
    later(()=>{ FLY.props.visible = false; FLY.prints.visible = false; FLY.ground.visible = false; FLY.ring.visible = false; }); } };

// F07 — K07 the comic page: the live frame in the middle, two still frames of what he saw earlier today; the page turns by itself
DREAMS.F07 = { enter(){ if (!COMIC.snapA){ COMIC.snapA = new THREE.WebGLRenderTarget(320, 180); COMIC.snapB = new THREE.WebGLRenderTarget(320, 180); COMIC.copy = new THREE.ShaderMaterial({ uniforms:{ t:{ value:null } }, vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`, fragmentShader:`uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = texture2D(t, vUv); }`, depthTest:false, depthWrite:false }); const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), COMIC.copy); q.frustumCulled = false; COMIC.scene = new THREE.Scene(); COMIC.scene.add(q); COMIC.oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); }
    COMIC.t = 0; COMIC.flip = 0; COMIC.n = 0; COMIC.wantSnap = 2; },
  exit(){}, tick(dt, k){ COMIC.t += dt; const U = fxMat.uniforms; U.uComic.value = smooth(0, 1, k); U.uRect.value.set(...COMIC.rect);
    // every 11 s the page turns: the frame he was looking at becomes the first still, the old first the second
    if (COMIC.t > 11){ COMIC.t = 0; COMIC.flip = 0.0001; COMIC.wantSnap = 1; }
    if (COMIC.flip > 0){ COMIC.flip += dt/0.6; if (COMIC.flip >= 1) COMIC.flip = 0; } U.uFlip.value = COMIC.flip; U.uSnapK.value = COMIC.n > 0 ? 1 : 0;
    // an empty balloon by the person he draws: the nearest person in the frame, else none
    let best = null, bd = 30; L.PEOPLE.forEach(Q=>{ if (Q.id === 'K07' || Q.hidden) return; const p = Q.pp.g.position.clone(); p.y += 1.9*Q.pp.S/0.82; const d = p.distanceTo(cam.position); const q = p.clone().project(cam); if (q.z > 1 || Math.abs(q.x) > 0.9 || Math.abs(q.y) > 0.85) return; if (d < bd){ bd = d; best = q; } });
    U.uBubble.value.set(best ? best.x*0.5 + 0.5 + 0.06 : -1, best ? best.y*0.5 + 0.5 + 0.08 : -1, best ? 1 : 0); },
  post(){ if (!COMIC.wantSnap) return; const T = C.OILF.targets(); if (!T.outRT) return; // keep the frame just drawn (raw picture) as a still
    const a = COMIC.snapA; COMIC.snapA = COMIC.snapB; COMIC.snapB = a; COMIC.copy.uniforms.t.value = T.outRT.texture; renderer.setRenderTarget(COMIC.snapA); renderer.render(COMIC.scene, COMIC.oc); renderer.setRenderTarget(null);
    if (COMIC.wantSnap === 2){ renderer.setRenderTarget(COMIC.snapB); renderer.render(COMIC.scene, COMIC.oc); renderer.setRenderTarget(null); }
    COMIC.wantSnap = 0; COMIC.n++; fxMat.uniforms.tSnapA.value = COMIC.snapA.texture; fxMat.uniforms.tSnapB.value = COMIC.snapB.texture; } };

// F08 — K08 empty clothes: the people near him are clothes without anyone in them (no head, no hands); the town greys; his glove keeps its blue
DREAMS.F08 = { enter(){}, exit(){}, tick(dt, k){ fxMat.uniforms.uEmpty.value = smooth(0, 1, k); },
  pre(k){ if (k < 0.3) return; const me = P_OF('K08'), base = me.pp.g.position, tt = performance.now()/1000;
    L.PEOPLE.forEach(Q=>{ if (Q.id === 'K08' || Q.hidden) return; const d = Q.pp.g.position.distanceTo(base); if (d > 28) return; const h = Q.pp.head, hv = h.visible; h.visible = false; const hands = Q.pp.comps.hands || []; const hv2 = hands.map(m=>m.visible); hands.forEach(m=>m.visible = false);
      const y = Q.pp.g.position.y; Q.pp.g.position.y += 0.04*Math.sin(tt*1.3 + Q.pp.seed); later(()=>{ h.visible = hv; hands.forEach((m, i)=>m.visible = hv2[i]); Q.pp.g.position.y = y; }); });
    const g = L.ITEMS.mitten_blue.m; const ms = []; g.traverse(o=>{ if (o.isMesh && o.material.emissive){ ms.push([o.material, o.material.emissive.clone(), o.material.emissiveIntensity]); o.material.emissive.set('#2a4ad0'); o.material.emissiveIntensity = 0.5; } });
    later(()=>ms.forEach(([m, e, i])=>{ m.emissive.copy(e); m.emissiveIntensity = i; })); } };


// ---- the six of batch 5 (specs F01 F03 F05 F06 F09 F10). FX holds what each shows now (also read by the rings) ----
const FX = { f01:{ phone:0, att:0, attId:null, attT:0 }, f03:{ doors:[], seen:0, real:0 }, f05:{ g:null, lines:0, self:0 }, f06:{ ang:[0.18, -0.12, 0.08], tilt:-1, kicked:0, catT:0, stays:false }, f09:{ off:0, prevOff:0, moving:0, flower:0 }, f10:{ inst:null, open:0, fold:0, want:0 } };
const _sp = new THREE.Vector3();
const scr = (v) => { _sp.copy(v).project(cam); return _sp.z < 1 && Math.abs(_sp.x) < 1.2 && Math.abs(_sp.y) < 1.2 ? [_sp.x*0.5 + 0.5, _sp.y*0.5 + 0.5] : null; };
const fxSet = (id, k) => { const U = fxMat.uniforms; U.uFx.value = id; U.uFk.value = smooth(0, 1, k); };
const handPos = (P, v) => { (P.pp.hands && P.pp.hands[1] ? P.pp.hands[1] : P.pp.head).getWorldPosition(v); return v; };
const nowH = () => C.hour();
// F01 — K01: his attention (his own: the photo while the phone is up; a passer-by now and then; after the ring is back, the people in front of him)
DREAMS.F01 = { enter(){ FX.f01.attT = 0; }, exit(){}, tick(dt, k){ fxSet(1, k); const P = P_OF('K01'), f = FX.f01, U = fxMat.uniforms;
    f.phone = P.act === 'phone' ? Math.min(1, f.phone + dt*2) : Math.max(0, f.phone - dt*2);
    const hp = handPos(P, new THREE.Vector3()), s1 = scr(hp); U.uFa.value.set(s1 ? s1[0] : -1, s1 ? s1[1] : -1, 0.16, f.phone);
    const ringBack = L.EVENTS.E03 && L.EVENTS.E03.state === 'done' && L.EVENTS.E03.day === Math.floor(L.nowMin()/1440);
    f.attT += dt; const looking = ringBack || f.phone < 0.3 || (f.attT % 18) > 13;   // the phone mostly; now and then he looks up
    let best = null, bd = 13; const fwd = new THREE.Vector3(Math.cos(P.w.yaw), 0, -Math.sin(P.w.yaw));
    if (looking) L.PEOPLE.forEach(Q=>{ if (Q === P || Q.hidden || !Q.pp.g.visible) return; const d = Q.pp.g.position.clone().sub(P.pp.g.position); const dist = d.length(); if (dist > bd || dist < 0.8) return; d.y = 0; if (d.normalize().dot(fwd) < 0.2) return; best = Q; bd = dist; });
    f.att += ((best ? 1 : 0) - f.att)*Math.min(1, dt*2.5); f.attId = best ? best.id : f.attId;
    const Q = f.attId && P_OF(f.attId), s2 = Q && !Q.hidden ? scr(Q.pp.g.position.clone().setY(Q.pp.g.position.y + 0.85)) : null;
    U.uFb.value.set(s2 ? s2[0] : -1, s2 ? s2[1] : -1, 0.2, s2 ? f.att : 0); } };
// F03 — K03: door frames in the old door colour at the ends of his way (along his real path ahead); at the empty house only the real door keeps it
const DOORC = '#4a86b0';
function buildDoors(){ if (FX.f03.g) return; const g = new THREE.Group(); g.visible = false; scene.add(g); FX.f03.g = g; const m = new THREE.MeshBasicMaterial({ color:DOORC }), mf = new THREE.MeshBasicMaterial({ color:'#e8e4dc' });
  for (let i=0;i<4;i++){ const d = new THREE.Group(); const fr = (w, h, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), mf); b.position.set(x, y, 0); d.add(b); };
    fr(0.12, 2.3, -0.56, 1.15); fr(0.12, 2.3, 0.56, 1.15); fr(1.24, 0.14, 0, 2.3); const p = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 0.05), m); p.position.y = 1.1; d.add(p);
    d.userData.dyn = true; d.traverse(o=>{ o.raycast = () => {}; }); g.add(d); FX.f03.doors.push(d); }
  const real = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.95), new THREE.MeshBasicMaterial({ color:DOORC, transparent:true, opacity:0 })); real.position.set(-27.35, C.G + 1.0, -49.66); real.raycast = () => {}; scene.add(real); FX.f03.realM = real; real.visible = false; }
DREAMS.F03 = { enter(){ buildDoors(); }, exit(){}, tick(dt, k){ fxSet(3, k); },
  pre(k){ const f = FX.f03, P = P_OF('K03'); if (!f.g) return; const atEmpty = Math.hypot(P.w.x + 27.35, P.w.z + 51) < 9; f.real = atEmpty ? Math.min(1, f.real + 0.02) : Math.max(0, f.real - 0.02);
    f.g.visible = k > 0.2 && !atEmpty; let shown = 0;
    if (f.g.visible){ const path = P.w.path, fwd = new THREE.Vector3(Math.cos(P.w.yaw), 0, -Math.sin(P.w.yaw)), side = new THREE.Vector3(fwd.z, 0, -fwd.x), tt = performance.now()/1000;
      f.doors.forEach((d, i)=>{ const ahead = 9 + i*6, sd = (i % 2 ? 1 : -1)*(2.4 + (i % 3)*0.6); let x = P.w.x + fwd.x*ahead + side.x*sd, z = P.w.z + fwd.z*ahead + side.z*sd;
        if (path && path.length > P.w.pj){ const q = path[Math.min(path.length - 1, P.w.pj + 1 + i)]; x = q.x + side.x*sd; z = q.z + side.z*sd; }
        const fade = 0.5 + 0.5*Math.sin(tt*0.35 + i*1.7); d.visible = fade > 0.25; d.position.set(x, WORLD.floorAt(x, z), z); d.rotation.y = Math.atan2(P.w.x - x, P.w.z - z); d.scale.setScalar(0.6 + 0.4*fade);
        if (d.visible && scr(d.position.clone().setY(d.position.y + 1.1))) shown++; }); }
    f.seen = shown; f.realM.visible = k > 0.2 && f.real > 0.02; f.realM.material.opacity = f.real*k; f.realSeen = f.real > 0.6 && !!scr(f.realM.position) && seenFrom(f.realM.position.clone().setZ(f.realM.position.z + 0.15));
    later(()=>{ f.g.visible = false; f.realM.visible = false; }); } };
// F05 — K05: the people she cares for are stars, joined to her by thin lines that light as the care really happens; her own star at night
function buildStars(){ if (FX.f05.g) return; const g = new THREE.Group(); g.visible = false; scene.add(g); FX.f05.g = g;
  const sm = new THREE.MeshBasicMaterial({ color:'#fff0a8', toneMapped:false }), dm = new THREE.MeshBasicMaterial({ color:'#6a78a8', toneMapped:false });
  FX.f05.stars = {}; ['self', 'K02', 'R13', 'K08', 'R06'].forEach(id=>{ const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), sm.clone()); s.raycast = () => {}; g.add(s); FX.f05.stars[id] = s; });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(4*6), 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(4*6), 3));
  FX.f05.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors:true, toneMapped:false })); FX.f05.lines.frustumCulled = false; FX.f05.lines.raycast = () => {}; g.add(FX.f05.lines); }
DREAMS.F05 = { enter(){ buildStars(); }, exit(){}, tick(dt, k){ fxSet(5, k); },
  pre(k){ const f = FX.f05; if (!f.g) return; f.g.visible = k > 0.2; const me = P_OF('K05'), day = Math.floor(L.nowMin()/1440), h = nowH(), tt = performance.now()/1000;
    const at = (id) => { const Q = P_OF(id); if (!Q) return null; if (!Q.hidden && Q.pp.g.visible) return Q.pp.g.position.clone().setY(Q.pp.g.position.y + 2.1*Q.pp.S/0.82);
      const H = L.PL[Q.def.home] || L.PL[Q.def.room]; return H ? new THREE.Vector3(H.x, C.G + 4.5, H.z) : null; };
    const done = (e) => L.EVENTS[e] && (L.EVENTS[e].state === 'done' || L.EVENTS[e].state === 'run') && L.EVENTS[e].day === day;
    const lit = { K02:done('E06') ? 1 : 0.18, R13:(h > 9 && h < 18) || done('E06') ? 0.8 : 0.18, K08:0.3, R06:done('E06') ? 0.5 : 0.15 };
    const night = h >= 21 || h < 5 || (L.EVENTS.E10.state === 'run'); f.self = night ? 1 : 0.15;
    const sp = at('K05') || me.pp.g.position.clone(); f.stars.self.position.copy(sp); f.stars.self.material.color.set(night ? '#fff6c8' : '#6a6a88'); f.stars.self.scale.setScalar(night ? 1.2 + 0.2*Math.sin(tt*2) : 0.7);
    const pos = f.lines.geometry.attributes.position, col = f.lines.geometry.attributes.color; let n = 0, lines = 0;
    ['K02', 'R13', 'K08', 'R06'].forEach((id, i)=>{ const p = at(id), s = f.stars[id]; if (!p){ s.visible = false; return; } s.visible = true; s.position.copy(p); s.rotation.y = tt*0.6; s.scale.setScalar(0.7 + 0.6*lit[id]);
      s.material.color.setRGB(0.4 + 0.6*lit[id], 0.4 + 0.54*lit[id], 0.55 + 0.1*lit[id]);
      pos.setXYZ(n*2, sp.x, sp.y, sp.z); pos.setXYZ(n*2 + 1, p.x, p.y, p.z); const c = 0.25 + 0.75*lit[id]; col.setXYZ(n*2, c, c*0.92, c*0.6); col.setXYZ(n*2 + 1, c, c*0.92, c*0.6); n++; if (lit[id] > 0.5) lines++; });
    for (let j = n*2; j < 8; j++){ pos.setXYZ(j, sp.x, sp.y, sp.z); } pos.needsUpdate = true; col.needsUpdate = true; f.litLines = lines;
    later(()=>{ f.g.visible = false; }); } };
// F06 — K06: the cups on the table's edge straighten by themselves; the cat going by tips one; after she has fed the cat, the tipped one may stay
DREAMS.F06 = { enter(){ const f = FX.f06; if (!f.stays) f.ang = [0.22, -0.16, 0.1]; f.wasTilted = true; }, exit(){}, tick(dt, k){ fxSet(6, k); const f = FX.f06, U = fxMat.uniforms, day = Math.floor(L.nowMin()/1440);
    const fed = L.EVENTS.E08.state === 'done' && L.EVENTS.E08.day === day; f.stays = fed && f.tilt >= 0;
    const me = P_OF('K06'), cat = L.CAT, near = Math.hypot(cat.x - me.w.x, cat.z - me.w.z) < 8 && cat.moving; f.catT = near ? f.catT + dt : 0;
    if (f.catT > 0.6 && f.kicked <= 0){ f.tilt = (f.tilt + 1 + Math.floor(Math.random()*2)) % 3; f.ang[f.tilt] = (Math.random() > 0.5 ? 1 : -1)*0.4; f.kicked = 8; f.kickedAt = performance.now(); }
    f.kicked -= dt; let aligned = true;
    f.ang = f.ang.map((a, i)=>{ if (f.stays && i === f.tilt) return a; const na = a*Math.exp(-dt*0.35); if (Math.abs(na) > 0.03) aligned = false; return na; }); f.aligned = aligned;
    U.uFa.value.set(f.ang[0], f.ang[1], f.ang[2], 0); } };
// F09 — K09: the far town a reflection, slipping sideways by how far apart they are; lined up when they stand together. After he held out
// the flowers and drew them back, the reflection shows them given (only there)
DREAMS.F09 = { enter(){}, exit(){}, tick(dt, k){ fxSet(9, k); const f = FX.f09, U = fxMat.uniforms, me = P_OF('K09'), B = P_OF('K10'), day = Math.floor(L.nowMin()/1440);
    const dist = B && !B.hidden ? Math.hypot(B.w.x - me.w.x, B.w.z - me.w.z) : 120, tt = performance.now()/1000;
    const want = Math.min(0.12, dist/600)*Math.sin(tt*0.13 + 0.7) + (dist < 4 ? 0 : 0.015*Math.sin(tt*0.4));
    f.prevOff = f.off; f.off += (want - f.off)*Math.min(1, dt*0.8); f.moving = Math.abs(f.off - f.prevOff)/Math.max(dt, 1e-3);
    // the horizon line on screen: where the eye height's horizontal meets the picture
    const hz = new THREE.Vector3(Math.sin(cam.rotation.y)*-60, 0, Math.cos(cam.rotation.y)*-60).add(cam.position); hz.y = cam.position.y; const sh = scr(hz); U.uFa.value.set(f.off, sh ? sh[1] : 0.55, 0, 0);
    const e7 = L.EVENTS.E07; f.flower = e7 && e7.day === day && (e7.state === 'done' || (e7.state === 'run' && e7.t > 4.2)) ? 1 : 0;
    let fp = null; if (f.flower && B && !B.hidden){ const s = scr(B.pp.g.position.clone().setY(B.pp.g.position.y + 1.0)); if (s) fp = [s[0] + f.off*0.5, 2*(sh ? sh[1] : 0.55) - s[1]]; }
    U.uFb.value.set(fp ? fp[0] : -1, fp ? fp[1] : -1, fp ? 1 : 0, 0); f.flowerShown = !!fp; } };
// F10 — K10: paper flowers along his sleeve and in the cracks round his feet: folds before he has the flowers, open while he holds them
// out, folded back when he draws them back; warm by his door once they are in the vase
function buildPaper(){ if (FX.f10.inst) return; const g = new THREE.BufferGeometry(); const a = new THREE.PlaneGeometry(0.16, 0.16), b = a.clone().rotateY(Math.PI/2);
  const m = new THREE.MeshBasicMaterial({ color:'#ffffff', side:THREE.DoubleSide, toneMapped:false }); const geo = mergeG([a, b]);
  const inst = new THREE.InstancedMesh(geo, m, 36); inst.frustumCulled = false; inst.raycast = () => {}; inst.visible = false; const cs = ['#f48ab0', '#fff1dc', '#f4d24a', '#c8a8f2', '#ff9a7a'];
  for (let i=0;i<36;i++) inst.setColorAt(i, new THREE.Color(cs[i % 5])); scene.add(inst); FX.f10.inst = inst;
  const warm = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.2), new THREE.MeshBasicMaterial({ color:'#ffd8a0', transparent:true, opacity:0, toneMapped:false })); warm.position.set(10.2, C.G + 1.4, 27.75); warm.raycast = () => {}; warm.visible = false; scene.add(warm); FX.f10.warm = warm; }
const mergeG = (gs) => { const out = new THREE.BufferGeometry(); const pos = []; gs.forEach(g=>{ const p = g.toNonIndexed().attributes.position.array; for (let i=0;i<p.length;i++) pos.push(p[i]); }); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return out; };
DREAMS.F10 = { enter(){ buildPaper(); }, exit(){}, tick(dt, k){ fxSet(10, k); const f = FX.f10, me = P_OF('K10'), day = Math.floor(L.nowMin()/1440), e7 = L.EVENTS.E07, it = L.ITEMS.bouquet_k10;
    const has = it && it.holder === 'K10', out = me.act === 'give', drawn = e7 && e7.day === day && ((e7.state === 'run' && e7.t > 4.2) || e7.state === 'done') && !(L.EVENTS.E07B.state !== 'idle' && L.EVENTS.E07B.day === day && has);
    f.want = out ? 1 : has && !drawn ? 0.75 : has && drawn ? 0.75 : drawn ? 0.08 : 0.04; if (drawn && !has) f.want = 0.08;
    f.open += (f.want - f.open)*Math.min(1, dt*1.4); f.fold = drawn && !has ? 1 : 0; f.vase = L.EVENTS.EVASE && L.EVENTS.EVASE.state === 'done' && L.EVENTS.EVASE.day === day; },
  pre(k){ const f = FX.f10, me = P_OF('K10'); if (!f.inst) return; f.inst.visible = k > 0.2 && !me.hidden; const tt = performance.now()/1000, hp = handPos(me, new THREE.Vector3()), base = me.pp.g.position;
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3(), E = new THREE.Euler();
    for (let i=0;i<36;i++){ let x, y, z; if (i < 12){ const u = i/12; x = hp.x + Math.sin(i*2.1)*0.12; y = hp.y + 0.1 + u*0.25; z = hp.z + Math.cos(i*2.1)*0.12; }
      else { const a = i*2.39996, rr = 0.6 + (i % 7)*0.32; x = base.x + Math.cos(a)*rr; z = base.z + Math.sin(a)*rr; y = WORLD.floorAt(x, z) + 0.03; }
      const op = Math.max(0.05, f.open*(0.8 + 0.2*Math.sin(tt*1.3 + i))); E.set(i < 12 ? 0 : -Math.PI/2*(1 - op), i*1.3 + tt*0.1, 0); Q.setFromEuler(E);
      Sv.set(op*k, i < 12 ? op*k : Math.max(0.12, op)*k, op*k); M.compose(Pv.set(x, y, z), Q, Sv); f.inst.setMatrixAt(i, M); }
    f.inst.instanceMatrix.needsUpdate = true; f.warm.visible = k > 0.2 && !!f.vase; f.warm.material.opacity = 0.45*k;
    later(()=>{ f.inst.visible = false; f.warm.visible = false; }); } };

/* ---------------------------------------------------------------------
   render-local: just before the frame is drawn, undone right after (also on an error)
   --------------------------------------------------------------------- */
const HL = new Map();                // index lit what the pointer was over (emissive ≈ a quarter of its own colour): the hovered body, for this frame
function hlMat(m){ let h = HL.get(m); if (!h){ h = m.clone(); h.emissive = new THREE.Color('#ffffff'); h.emissiveIntensity = 0.16; h.userData.noDream = true; HL.set(m, h); } return h; }
function pre(dt){ SAVE.list.length = 0;
  if (C.view.mode !== 'life'){ const U = post.uniforms; U.uMode.value = 13; U.uIR.value = 0; U.uDream.value = 0; U.uWarmK.value = 0; U.uEmpty.value = 0; U.uComic.value = 0; U.uFk.value = 0; U.uGrade.value = 0; tr.open = 1; tr.phase = 'idle'; $('#rec').classList.remove('on'); return; }   // the developer's free camera: the plain picture
  if (SHOW.on){ const U = post.uniforms; U.uMode.value = 13; U.uIR.value = 0; U.uDream.value = 0; U.uWarmK.value = 0; U.uEmpty.value = 0; U.uComic.value = 0; U.uFk.value = 0; U.uGrade.value = 0.8; U.uBarrel.value = 0; return; }
  if (V.kind === 'cam') $('#rec').classList.add('on');
  if (V.kind === 'cam'){ const m = CAM(V.id).model; if (m){ const pl = m.userData.pole; m.visible = false; if (pl) pl.visible = false; later(()=>{ m.visible = true; if (pl) pl.visible = true; }); } }          // a camera does not see its own housing
  if (V.kind === 'person'){ const P = P_OF(V.id), h = P.pp.head, u = P.pp.umb, hv = h.visible, uv = u.visible; h.visible = false; u.visible = false; later(()=>{ h.visible = hv; u.visible = uv; }); }
  if (V.kind === 'animal'){ const A = animalOf(V.id), hv = A.head.visible; A.head.visible = false; later(()=>{ A.head.visible = hv; }); }
  if (hover && hover.kind !== 'cam' && hover.kind !== 'thing'){ const root = hover.kind === 'person' ? P_OF(hover.id).pp.g : animalOf(hover.id).g, sw = [];
    root.traverse(o=>{ if (o.isMesh && o.material && !Array.isArray(o.material) && o.material.isMeshLambertMaterial){ sw.push([o, o.material]); o.material = hlMat(o.material); } });
    later(()=>sw.forEach(([o, m])=>{ o.material = m; })); }
  if (V.dream && DREAMS[V.dream].pre) DREAMS[V.dream].pre(V.dreamK);
  if (V.dream === 'F02'){ const off = DREAMS.F02.offset(); cam.position.add(off);
    // high up, the eyes keep her (and the dog) in the picture; the viewer's own turn is added on top
    const P = P_OF('K02'), k = smooth(0.5, 3, off.length()), d = P.pp.g.position.clone().sub(cam.position);
    const yT = Math.atan2(-d.x, -d.z) + look.yaw*0.6, pT = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z))*0.75 + look.pitch*0.5, -1.2, 0.3);
    cam.rotation.order = 'YXZ'; cam.rotation.set(lerp(cam.rotation.x, pT, k), cam.rotation.y + wrapA(yT - cam.rotation.y)*k, 0); } }
function post_(){ try { PR.tick(); } catch (e){ LOG.push('progress: ' + e.message); }
  for (let i = SAVE.list.length - 1; i >= 0; i--){ try { SAVE.list[i](); } catch (e){ LOG.push('restore failed: ' + e.message); } } SAVE.list.length = 0; if (V.dream && DREAMS[V.dream].post) DREAMS[V.dream].post(); }
function focus(){ return V.kind === 'cam' ? 18 : 6; }
// the inner-world hint (once): index had a little sweet only; the specs ask for one short line the first time
const _toggle = toggleDream;


/* ---------------------------------------------------------------------
   THE START SCREEN's picture: a few still compositions of the live town, one every ~10 s with a short dip to black. It is a camera of
   its own (no one's eyes, no camera of the network): nothing is chosen, visited, seen or opened while it runs, and the world is not told.
   --------------------------------------------------------------------- */
const SHOW = { on:!(C.URLQ.get('intro') === '0' || C.URLQ.get('test') === '1'), first:true, i:0, t:0, hold:10, fadeOut:0.7, fadeIn:0.9, ready:0, frames:0, leaving:false,
  shots:[ { p:[15.5, 6.2, 13.5], t:[0, 1.0, 0], fov:52 },              // the plaza from a corner: the benches, the fountain, the arcade behind
          { p:[60.0, 9.0, 52.0], t:[80.0, 0.0, 70.0], fov:52 },         // the quay platform, the pier and the sea
          { p:[30.0, 14.0, 30.0], t:[0.0, 0.0, -10.0], fov:50 },        // over the roofs to the plaza and the clock tower
          { p:[95.0, 10.0, -15.0], t:[62.0, 1.0, -36.0], fov:50 },      // from the water: the harbour road, the sheds, the town behind
          { p:[-5.0, 5.0, 7.0], t:[-18.0, 1.0, -2.0], fov:54 } ] };     // the arcade's west gate and the café     // the quay and the sea
function showTick(dt){ const n = SHOW.shots.length, s = SHOW.shots[SHOW.i % n]; SHOW.frames++;
  if (SHOW.frames > 8) SHOW.t += dt;
  let open = 1; const T = SHOW.t;
  if (T < SHOW.fadeIn) open = SHOW.first ? 1 : T/SHOW.fadeIn; else if (T > SHOW.hold - SHOW.fadeOut) open = Math.max(0, (SHOW.hold - T)/SHOW.fadeOut);   // (the first shot opens at once: it takes over from the still preview)
  if (T >= SHOW.hold + 0.25){ SHOW.i++; SHOW.t = 0; open = 0; SHOW.first = false; }
  if (SHOW.frames > 8 && !SHOW.ready){ SHOW.ready = 1; document.body.classList.add('ready'); }
  tr.phase = 'idle'; tr.mode = 0; tr.open = SHOW.leaving ? Math.min(tr.open, open) : open;
  // a slow sideways pan across the hold (about 5°), the same for every shot; nothing else moves
  const a = ((SHOW.t/SHOW.hold) - 0.5)*0.09*(SHOW.i % 2 ? -1 : 1), dx = s.t[0] - s.p[0], dz = s.t[2] - s.p[2], ca = Math.cos(a), sa = Math.sin(a);
  cam.position.set(...s.p); cam.lookAt(s.p[0] + dx*ca + dz*sa, s.t[1], s.p[2] - dx*sa + dz*ca); cam.fov = s.fov; cam.near = 0.1; cam.updateProjectionMatrix();
  if (SHOW.leaving && (SHOW.leaveT += dt) > 0.6) endShow(); }
// Start: the screen fades, and the eyes open where the work starts (a camera, index's static open)
function startShow(){ if (!SHOW.on || SHOW.leaving || !SHOW.ready) return; SHOW.leaving = true; SHOW.leaveT = 0; document.body.classList.add('leaving'); }
function endShow(){ SHOW.on = false; SHOW.leaving = false; document.body.classList.remove('intro', 'leaving'); const el = document.getElementById('intro'); if (el) el.remove();
  camSmooth.init = false; applyView({ kind:V.kind, id:V.id }); tr.phase = 'open'; tr.t = 0; tr.dur = 1.4; tr.mode = 3; tr.open = 0; }
if (SHOW.on){ document.body.classList.add('intro'); const b = document.getElementById('start'); if (b) b.addEventListener('click', e=>{ e.stopPropagation(); startShow(); }); }
else { const el = document.getElementById('intro'); if (el) el.remove(); }

// start: a camera (index starts on CAM 01 with a static open); test pages may name the first eyes (?cam=C27, ?view=K04, &dream=1)
{ const q = C.URLQ, first = q.get('view'), c0 = q.get('cam');
  const target = first && P_OF(first) ? { kind:'person', id:first } : first && L.VIEW_ANIMALS.some(v=>v.id === first) ? { kind:'animal', id:first } : first && THINGS.find(t=>t.id === first) ? { kind:'thing', id:first } : { kind:'cam', id:c0 && CAM(c0) ? c0 : 'C12' };
  applyView(target); tr.phase = 'open'; tr.t = 0; tr.dur = 1.4; tr.mode = 3; tr.open = 0;
  if (q.get('dream') === '1' && target.kind === 'person'){ const go = () => SHOW.on ? setTimeout(go, 300) : toggleDream(); setTimeout(go, 600); } }

window.__V = V; window.__show = SHOW; window.__progress = PR; if (C.DEV || C.URLQ.get("test") === "1") window.__eggPreview = openEgg; window.__look = look; window.__CAMS = CAMS;
return { camera, pre, post:post_, focus, V, CAMS, setView:(k, id)=>setP(k, id), pick:(x, y)=>pick({ clientX:x, clientY:y }), LOG, toggleDream, post_pass:post, fxMat:post, CANDY, look, ccLook, hop, goCam, stepBack };
}
