/* =====================================================================
   World simulation for the map (2026-11-18): what is solid, where one can stand, doors, and how people find their way.

   One set of data serves everything — the player, the town's people and their path-finding:
   - colliders: every solid mesh of the built town as a simple box (an oriented rectangle in plan + a height range), found once
     before the bake. Glass is solid. Light pools, glows, signs (flat planes), neon and decals are not. Moving things (people,
     cars, the tram, door leaves) are not in this list: they are added each frame as dynamic boxes.
   - a height field (0.5 m cells): the ground (pavement, carriageway, terrain) raised by every low flat box resting on it
     (block slabs, the plaza, platforms, steps, plinths, interior floors). One can step up 0.35 m; anything higher is a wall.
   - doors: each door of the town (doorOn) is an opening in its wall; shut, a thin box blocks it; open, it lets people through.
     Doors of houses with no inside are 'sealed': walking into the open doorway means going in (the person is hidden).
   - a navigation grid on the same cells: a cell is free when a person (r 0.3 m) fits there; the carriageway costs 8×
     except on the zebras, so people cross the road on the stripes; door cells are passable but the walker opens the door first.
   - a spatial hash (2 m) so a query looks at the few boxes near it, never at the whole town.
   ===================================================================== */
export function createWorldSim({ THREE, scene, bounds, baseFloor, roadCost = () => 1, cell = 0.5, step = 0.35, headroom = 1.8 }){
  const [X0, X1, Z0, Z1] = bounds, NX = Math.ceil((X1 - X0)/cell), NZ = Math.ceil((Z1 - Z0)/cell);
  const FLOOR = new Float32Array(NX*NZ), BASE = new Float32Array(NX*NZ);
  const ci = (x) => Math.floor((x - X0)/cell), cj = (z) => Math.floor((z - Z0)/cell);
  const idx = (i, j) => (i < 0 || j < 0 || i >= NX || j >= NZ) ? -1 : j*NX + i;
  for (let j=0;j<NZ;j++) for (let i=0;i<NX;i++){ const v = baseFloor(X0 + (i + 0.5)*cell, Z0 + (j + 0.5)*cell); BASE[j*NX + i] = v; FLOOR[j*NX + i] = v; }
  const floorAt = (x, z) => { const k = idx(ci(x), cj(z)); return k < 0 ? -9 : FLOOR[k]; };
  const baseAt = (x, z) => { const k = idx(ci(x), cj(z)); return k < 0 ? -9 : BASE[k]; };

  // ---------------- colliders ----------------
  const COL = [];                                        // { cx, cz, ux, uz, hx, hz, y0, y1, glass, owner, name }
  const HASH = new Map(), HC = 2;
  const hkey = (a, b) => a*73856093 ^ b*19349663;
  const hashAdd = (c, k) => { const r = Math.hypot(c.hx, c.hz); for (let a = Math.floor((c.cx - r)/HC); a <= Math.floor((c.cx + r)/HC); a++) for (let b = Math.floor((c.cz - r)/HC); b <= Math.floor((c.cz + r)/HC); b++){ const key = hkey(a, b); let L = HASH.get(key); if (!L) HASH.set(key, L = []); L.push(k); } };
  // closest point of an oriented rectangle to (x, z): returns the distance (0 inside) and the outward push direction
  const _q = { d:0, nx:0, nz:0, pen:0 };
  function distOBB(c, x, z){ const dx = x - c.cx, dz = z - c.cz, u = dx*c.ux + dz*c.uz, v = -dx*c.uz + dz*c.ux;
    const cu = Math.max(-c.hx, Math.min(c.hx, u)), cv = Math.max(-c.hz, Math.min(c.hz, v)), eu = u - cu, ev = v - cv, d = Math.hypot(eu, ev);
    if (d > 1e-6){ _q.d = d; _q.nx = (eu*c.ux - ev*c.uz)/d; _q.nz = (eu*c.uz + ev*c.ux)/d; _q.pen = 0; return _q; }
    const pu = c.hx - Math.abs(u), pv = c.hz - Math.abs(v);                       // inside: out along the nearer side
    if (pu < pv){ const s = Math.sign(u) || 1; _q.nx = s*c.ux; _q.nz = s*c.uz; _q.pen = pu; } else { const s = Math.sign(v) || 1; _q.nx = -s*c.uz; _q.nz = s*c.ux; _q.pen = pv; }
    _q.d = 0; return _q; }
  const blocks = (c, f) => c.y1 > f + step && c.y0 < f + headroom;

  const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _b = new THREE.Box3();
  function boxOf(o){ const geo = o.geometry; if (!geo.boundingBox) geo.computeBoundingBox(); const bb = geo.boundingBox; if (bb.isEmpty()) return null;
    const e = o.matrixWorld.elements, sx = Math.hypot(e[0], e[1], e[2]), sy = Math.hypot(e[4], e[5], e[6]), sz = Math.hypot(e[8], e[9], e[10]);
    const size = bb.getSize(new THREE.Vector3());
    if (Math.abs(e[4]) < 0.02*sy && Math.abs(e[6]) < 0.02*sy && Math.abs(e[1]) < 0.02*sx){        // upright: an oriented rectangle
      bb.getCenter(_v).applyMatrix4(o.matrixWorld); const ux = e[0]/sx, uz = e[2]/sx, n = Math.hypot(ux, uz) || 1;
      return { cx:_v.x, cz:_v.z, ux:ux/n, uz:uz/n, hx:size.x*sx/2, hz:size.z*sz/2, y0:_v.y - size.y*sy/2, y1:_v.y + size.y*sy/2 }; }
    _b.copy(bb).applyMatrix4(o.matrixWorld);                                                  // tilted (roof slabs, a sign at an angle): its upright bounds
    return { cx:(_b.min.x + _b.max.x)/2, cz:(_b.min.z + _b.max.z)/2, ux:1, uz:0, hx:(_b.max.x - _b.min.x)/2, hz:(_b.max.z - _b.min.z)/2, y0:_b.min.y, y1:_b.max.y }; }
  function rasterTop(c, top){ const r = Math.hypot(c.hx, c.hz);
    for (let i = ci(c.cx - r); i <= ci(c.cx + r); i++) for (let j = cj(c.cz - r); j <= cj(c.cz + r); j++){ const k = idx(i, j); if (k < 0) continue;
      const x = X0 + (i + 0.5)*cell, z = Z0 + (j + 0.5)*cell; if (distOBB(c, x, z).d > 0) continue; if (top > FLOOR[k]) FLOOR[k] = top; } }
  const isGlass = (mt) => mt.transparent || mt.userData.glass;
  // walk the scene once (before the bake merges everything): every solid mesh becomes a box; low flat ones also raise the floor
  function collect({ ownerOf = (o)=>o, skip = () => false } = {}){
    scene.updateMatrixWorld(true); const floors = [], solids = [];
    const visit = (o, dyn) => { if (o.userData.noCollide) return; dyn = dyn || !!o.userData.dyn; if (skip(o)) return;
      if (o.isMesh && !dyn && !o.isInstancedMesh && !o.userData.keep && o.geometry){
        const mt = o.material, gp = o.geometry.parameters || {};
        const ok = mt && !Array.isArray(mt) && !mt.isMeshBasicMaterial && !mt.isShaderMaterial && !mt.isPointsMaterial && (gp.width != null || gp.radiusTop != null || o.geometry.type === 'ExtrudeGeometry' || o.userData.collide);
        if (ok){ const c = boxOf(o);
          if (c && !(o.geometry.type === 'PlaneGeometry') && (c.hx > 0.02 || c.hz > 0.02)){
            const base = baseAt(c.cx, c.cz), flat = c.y1 - c.y0 <= 0.8 && c.y0 <= base + 0.1 && c.hx >= 0.25 && c.hz >= 0.25 && c.hx*c.hz*4 >= 0.6 && c.y1 <= base + 0.8;
            if (flat) floors.push(c);
            if ((c.y1 > base + 0.3 || !flat) && o.geometry.type === 'ExtrudeGeometry' && o.geometry.parameters.shapes && !Array.isArray(o.geometry.parameters.shapes)){
              // a shaped body (the school's L): its outline as wall strips, never its bounding box (that would fill the courtyard)
              const pts = o.geometry.parameters.shapes.getPoints(), own = ownerOf(o);
              for (let i=0;i<pts.length;i++){ const p0 = pts[i], p1 = pts[(i+1) % pts.length], a = new THREE.Vector3(p0.x, 0, p0.y).applyMatrix4(o.matrixWorld), b2 = new THREE.Vector3(p1.x, 0, p1.y).applyMatrix4(o.matrixWorld);
                const L = Math.hypot(b2.x - a.x, b2.z - a.z); if (L < 0.05) continue; solids.push({ cx:(a.x + b2.x)/2, cz:(a.z + b2.z)/2, ux:(b2.x - a.x)/L, uz:(b2.z - a.z)/L, hx:L/2, hz:0.15, y0:c.y0, y1:c.y1, glass:false, owner:own, name:o.name || '' }); } }
            else if (c.y1 > base + 0.3 || !flat){ c.glass = isGlass(mt); c.owner = ownerOf(o); c.name = o.name || ''; solids.push(c); } } } }
      for (const ch of o.children) visit(ch, dyn); };
    visit(scene, false);
    floors.sort((a, b)=>a.y1 - b.y1).forEach(c=>rasterTop(c, c.y1));
    solids.forEach(c=>{ if (c.y1 <= floorAt(c.cx, c.cz) + 0.02 && c.y1 - c.y0 < 0.9) return; const k = COL.length; COL.push(c); hashAdd(c, k); });
    return { colliders:COL.length, floors:floors.length };
  }
  function addCollider(c){ const k = COL.length; COL.push(c); hashAdd(c, k); return c; }
  function addRamp(x0, z0, x1, z1, y0, y1, alongX){ for (let i = ci(x0); i <= ci(x1); i++) for (let j = cj(z0); j <= cj(z1); j++){ const k = idx(i, j); if (k < 0) continue;
    const x = X0 + (i + 0.5)*cell, z = Z0 + (j + 0.5)*cell, t = alongX ? (x - x0)/(x1 - x0) : (z - z0)/(z1 - z0); FLOOR[k] = Math.max(FLOOR[k], y0 + (y1 - y0)*Math.max(0, Math.min(1, t))); } }
  function setFloorRect(x0, z0, x1, z1, y){ for (let i = ci(x0); i <= ci(x1); i++) for (let j = cj(z0); j <= cj(z1); j++){ const k = idx(i, j); if (k >= 0) FLOOR[k] = y; } }
  const near = (x, z, r, fn) => { const seen = new Set(); for (let a = Math.floor((x - r)/HC); a <= Math.floor((x + r)/HC); a++) for (let b = Math.floor((z - r)/HC); b <= Math.floor((z + r)/HC); b++){ const L = HASH.get(hkey(a, b)); if (!L) continue; for (const k of L){ if (seen.has(k)) continue; seen.add(k); fn(COL[k], k); } } };

  // ---------------- doors ----------------
  const DOORS = [];
  /* d: { a, c, along ('x' | 'z'), out (±1), w, h, pivot (group of the leaf), sealed, building, inward (true: swings in) } — its opening is
     the gap between the jambs on the wall line, its centre (cx, cz); 'front' is a point 1 m outside it, 'inside' one 0.6 m in. */
  function addDoor(d){ const ax = d.along === 'x'; d.cx = ax ? d.a : d.c; d.cz = ax ? d.c : d.a; d.nx = ax ? 0 : d.out; d.nz = ax ? d.out : 0;
    d.front = [d.cx + d.nx*1.0, d.cz + d.nz*1.0]; d.inside = [d.cx - d.nx*0.7, d.cz - d.nz*0.7]; d.open = 0; d.target = 0; d.lastUse = -1e9; d.by = null;
    d.box = { cx:d.cx - d.nx*0.02, cz:d.cz - d.nz*0.02, ux:ax ? 1 : 0, uz:ax ? 0 : 1, hx:d.w/2 + 0.02, hz:0.07, y0:-1, y1:9, door:d };
    if (d.pivot){ d.pivot.userData.dyn = true; d.pivot.userData.noCollide = true; }
    d.id = DOORS.length; DOORS.push(d); return d; }
  function doorTick(dt, now, agentsNear){
    DOORS.forEach(d=>{ const busy = agentsNear(d); if (busy) d.lastUse = now;
      if (d.target > 0 && !busy && now - d.lastUse > (d.hold || 3.0)) d.target = 0;
      const k = 1 - Math.exp(-dt*5); d.open += (d.target - d.open)*k; if (Math.abs(d.target - d.open) < 0.002) d.open = d.target;
      if (d.pivot){ const s = (d.pivSign ?? (d.along === 'x' ? d.out : -d.out))*(d.inward ? 1 : -1); d.pivot.rotation.y = s*1.4*d.open; } }); }
  const doorShut = (d) => d.open < 0.8;
  const nearestDoor = (x, z, r = 1.6) => { let best = null, bd = r; DOORS.forEach(d=>{ const dd = Math.hypot(d.cx - x, d.cz - z); if (dd < bd){ bd = dd; best = d; } }); return best; };

  // ---------------- dynamic boxes (refilled every frame: cars, the tram, ...) ----------------
  let DYN = [];
  const setDynamic = (list) => { DYN = list; };

  // ---------------- moving a body (a circle r on its floor) ----------------
  /* the body moves by (dx, dz); boxes push it out (it slides along walls); it can step up 0.35 m and down 1 m, never more.
     opts.ignore: a function(collider) → true to pass through it (e.g. the tram the walker is boarding through an open door). */
  function solveAt(x, z, f, r, ignore){ let hit = false;
    for (let it=0; it<3; it++){ let moved = false;
      const push = (c) => { if (!blocks(c, f) || (ignore && ignore(c))) return; const q = distOBB(c, x, z); if (q.d >= r) return; const p = q.d > 0 ? r - q.d : q.pen + r;
        x += q.nx*p; z += q.nz*p; moved = true; hit = true; };
      near(x, z, r + 0.5, push); DOORS.forEach(d=>{ if (doorShut(d) && Math.abs(d.cx - x) < 3 && Math.abs(d.cz - z) < 3) push(d.box); }); DYN.forEach(push);
      if (!moved) break; }
    return { x, z, hit }; }
  function move(body, dx, dz, opts = {}){
    const r = body.r || 0.25, f0 = body.y ?? floorAt(body.x, body.z);
    const tryTo = (tx, tz) => { const s = solveAt(tx, tz, f0, r, opts.ignore), f1 = floorAt(s.x, s.z);
      if (f1 - f0 > step + 0.01 || f1 < f0 - 1.0 || f1 < -1) return null; return { ...s, f:f1 }; };
    let res = tryTo(body.x + dx, body.z + dz) || tryTo(body.x + dx, body.z) || tryTo(body.x, body.z + dz);
    if (!res){ body.blocked = true; return body; }
    body.blocked = res.hit; body.x = res.x; body.z = res.z;
    const f = res.f; body.y = body.y == null ? f : body.y + (f - body.y)*Math.min(1, (opts.dt || 0.016)*14);   // steps are climbed, not teleported
    if (Math.abs(body.y - f) < 0.005) body.y = f;
    return body; }
  const freeAt = (x, z, r, f = floorAt(x, z)) => { let ok = true; near(x, z, r + 0.5, c=>{ if (ok && blocks(c, f) && distOBB(c, x, z).d < r) ok = false; }); return ok; };

  // ---------------- navigation grid & A* ----------------
  const NAV = new Uint8Array(NX*NZ);                    // 0 free, 1 blocked, 2 door
  const DOORCELL = new Int16Array(NX*NZ).fill(-1), COST = new Float32Array(NX*NZ);
  function buildNav(rNav = 0.3){
    NAV.fill(0); DOORCELL.fill(-1);
    COL.forEach(c=>{ const r = Math.hypot(c.hx, c.hz) + rNav;
      for (let i = ci(c.cx - r); i <= ci(c.cx + r); i++) for (let j = cj(c.cz - r); j <= cj(c.cz + r); j++){ const k = idx(i, j); if (k < 0 || NAV[k] === 1) continue;
        const x = X0 + (i + 0.5)*cell, z = Z0 + (j + 0.5)*cell; if (!blocks(c, FLOOR[k])) continue; if (distOBB(c, x, z).d < rNav) NAV[k] = 1; } });
    for (let k=0;k<NX*NZ;k++){ if (FLOOR[k] < -1) NAV[k] = 1; const x = X0 + ((k % NX) + 0.5)*cell, z = Z0 + (Math.floor(k/NX) + 0.5)*cell; COST[k] = roadCost(x, z); }
    // door openings: the cells on the wall line between the jambs, and a cell either side, are passable (through the door)
    DOORS.forEach(d=>{ if (d.sealed) return; for (let t = -d.w/2 + 0.25; t <= d.w/2 - 0.25 + 1e-6; t += cell*0.5) for (let o = -0.6; o <= 0.6; o += cell*0.5){
      const x = d.cx + (d.along === 'x' ? t : d.nx*o), z = d.cz + (d.along === 'x' ? d.nz*o : t), k = idx(ci(x), cj(z)); if (k < 0) continue;
      if (Math.abs(o) < 0.3) { NAV[k] = 2; DOORCELL[k] = d.id; } else if (NAV[k] === 1 && freeAt(x, z, 0.2)) NAV[k] = 0; } });
    let free = 0; for (let k=0;k<NX*NZ;k++) if (NAV[k] !== 1) free++; return { cells:NX*NZ, free };
  }
  const passable = (k) => k >= 0 && NAV[k] !== 1;
  function path(ax, az, bx, bz, maxIter = 120000){
    let s = idx(ci(ax), cj(az)), g = idx(ci(bx), cj(bz)); if (s < 0 || g < 0) return null;
    const nearFree = (k0) => { if (passable(k0)) return k0; const i0 = k0 % NX, j0 = Math.floor(k0/NX); for (let r=1;r<6;r++) for (let di=-r;di<=r;di++) for (let dj=-r;dj<=r;dj++){ const k = idx(i0 + di, j0 + dj); if (passable(k)) return k; } return -1; };
    s = nearFree(s); g = nearFree(g); if (s < 0 || g < 0) return null;
    const G = new Float32Array(NX*NZ).fill(Infinity), P = new Int32Array(NX*NZ).fill(-1), C = new Uint8Array(NX*NZ);
    const gi = g % NX, gj = Math.floor(g/NX), h = (k) => { const di = Math.abs(k % NX - gi), dj = Math.abs(Math.floor(k/NX) - gj); return (Math.max(di, dj) + 0.414*Math.min(di, dj)); };
    const heap = [], push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i){ const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length){ heap[0] = last; let i = 0; for (;;){ const l = i*2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    G[s] = 0; push(s, h(s)); let it = 0;
    while (heap.length && it++ < maxIter){ const [, k] = pop(); if (C[k]) continue; C[k] = 1; if (k === g) break; const i = k % NX, j = Math.floor(k/NX);
      for (let di=-1;di<=1;di++) for (let dj=-1;dj<=1;dj++){ if (!di && !dj) continue; const n = idx(i + di, j + dj); if (!passable(n) || C[n]) continue;
        if (di && dj && (!passable(idx(i + di, j)) || !passable(idx(i, j + dj)))) continue;                               // no cutting corners
        if (Math.abs(FLOOR[n] - FLOOR[k]) > step) continue;
        if ((NAV[n] === 2 || NAV[k] === 2) && di && dj) continue;                                                           // straight through doors
        const w = (di && dj ? 1.414 : 1)*Math.max(COST[n], 1), ng = G[k] + w; if (ng < G[n]){ G[n] = ng; P[n] = k; push(n, ng + h(n)); } } }
    if (P[g] < 0 && g !== s) return null;
    const cells = []; for (let k = g; k >= 0; k = P[k]){ cells.push(k); if (k === s) break; } cells.reverse();
    // string-pulling: keep a cell only when the straight line past it would leave the free cells, change cost class or cross a door
    const pt = (k) => [X0 + (k % NX + 0.5)*cell, Z0 + (Math.floor(k/NX) + 0.5)*cell];
    const los = (a, b) => { const [x0, z0] = pt(a), [x1, z1] = pt(b), n = Math.ceil(Math.hypot(x1 - x0, z1 - z0)/(cell*0.4)); const c0 = COST[a];
      for (let t=1;t<n;t++){ const k = idx(ci(x0 + (x1 - x0)*t/n), cj(z0 + (z1 - z0)*t/n)); if (!passable(k) || NAV[k] === 2 || Math.abs(COST[k] - c0) > 0.5 || Math.abs(FLOOR[k] - FLOOR[a]) > step) return false; } return true; };
    const out = [cells[0]]; let a = 0;
    for (let i = 2; i < cells.length; i++){ if (!los(cells[a], cells[i]) || NAV[cells[i-1]] === 2){ out.push(cells[i-1]); a = i - 1; } }
    out.push(cells[cells.length - 1]);
    return out.map(k=>{ const [x, z] = pt(k); return { x, z, door:DOORCELL[k] >= 0 ? DOORS[DOORCELL[k]] : null }; });
  }
  // the first door on the way from (x, z) to (tx, tz), if the straight step crosses a door cell
  function doorOnLine(x, z, tx, tz){ const n = Math.ceil(Math.hypot(tx - x, tz - z)/(cell*0.4)); for (let t=0;t<=n;t++){ const k = idx(ci(x + (tx - x)*t/n), cj(z + (tz - z)*t/n)); if (k >= 0 && DOORCELL[k] >= 0) return DOORS[DOORCELL[k]]; } return null; }

  // ---------------- checks ----------------
  // pairs of solid things standing in each other (different owners, overlapping more than tol in plan and in height)
  function overlaps({ tol = 0.06, filter = () => true } = {}){ const out = [];
    COL.forEach((a, ka)=>{ if (!filter(a)) return; near(a.cx, a.cz, Math.hypot(a.hx, a.hz) + 0.5, (b, kb)=>{ if (kb <= ka || b.owner === a.owner || !filter(b)) return;
      if (a.y1 < b.y0 + tol || b.y1 < a.y0 + tol) return;
      // separating axes in plan (4 axes)
      let sep = false, minPen = 1e9; for (const [ux, uz] of [[a.ux, a.uz], [-a.uz, a.ux], [b.ux, b.uz], [-b.uz, b.ux]]){
        const pa = (c) => Math.abs(c.hx*(c.ux*ux + c.uz*uz)) + Math.abs(c.hz*(-c.uz*ux + c.ux*uz)), d = Math.abs((b.cx - a.cx)*ux + (b.cz - a.cz)*uz), pen = pa(a) + pa(b) - d;
        if (pen < tol){ sep = true; break; } minPen = Math.min(minPen, pen); }
      if (!sep) out.push({ a:a.owner, b:b.owner, an:a.name, bn:b.name, pen:+minPen.toFixed(2), x:+((a.cx + b.cx)/2).toFixed(1), z:+((a.cz + b.cz)/2).toFixed(1) }); }); });
    return out; }
  // a debug drawing: every collider as a red outline at its height, doors green (shut) or blue (open), nav cells as dots
  let dbg = null;
  function debug(on, { nav = false } = {}){ if (dbg){ scene.remove(dbg); dbg.traverse(o=>{ o.geometry && o.geometry.dispose(); }); dbg = null; } if (!on) return;
    const p = [], pc = []; const seg = (a, b, col) => { p.push(...a, ...b); pc.push(...col, ...col); };
    COL.forEach(c=>{ const f0 = floorAt(c.cx, c.cz); if (!blocks(c, f0) && !blocks(c, f0 - 0.12)) return; const y = Math.max(c.y0, f0) + 0.05, col = c.glass ? [0.3, 0.7, 1] : [1, 0.15, 0.2], hx = c.hx, hz = c.hz;
      const P = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([u, v])=>[c.cx + u*c.ux - v*c.uz, y, c.cz + u*c.uz + v*c.ux]); for (let i=0;i<4;i++) seg(P[i], P[(i+1)%4], col); });
    DOORS.forEach(d=>{ const b = d.box, y = floorAt(d.cx, d.cz) + 0.1, col = d.sealed ? [0.9, 0.5, 1] : [0.1, 1, 0.3]; const P = [[-b.hx, 0], [b.hx, 0]].map(([u])=>[b.cx + u*b.ux, y, b.cz + u*b.uz]); seg(P[0], P[1], col); seg([d.cx, y, d.cz], [d.front[0], y, d.front[1]], col); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(pc, 3));
    dbg = new THREE.Group(); dbg.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors:true, depthTest:false, transparent:true })));
    if (nav){ const q = []; for (let k=0;k<NX*NZ;k+=1){ if (NAV[k] === 0) continue; q.push(X0 + (k % NX + 0.5)*cell, FLOOR[k] + 0.04, Z0 + (Math.floor(k/NX) + 0.5)*cell); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(q, 3)); dbg.add(new THREE.Points(pg, new THREE.PointsMaterial({ color:'#ff4060', size:3, sizeAttenuation:false, depthTest:false }))); }
    dbg.renderOrder = 50; dbg.userData.keep = true; dbg.userData.noCollide = true; scene.add(dbg); }

  function penetration(x, z, r, f){ let worst = 0, who = null; near(x, z, r + 0.5, c=>{ if (!blocks(c, f)) return; const q = distOBB(c, x, z), p = q.d > 0 ? r - q.d : r + q.pen; if (p > worst){ worst = p; who = c; } }); return { depth:worst, c:who }; }
  return { penetration, NX, NZ, cell, X0, Z0, FLOOR, NAV, COL, DOORS, floorAt, baseAt, collect, addCollider, addRamp, setFloorRect, addDoor, doorTick, nearestDoor, doorShut,
    setDynamic, move, solveAt, freeAt, buildNav, path, doorOnLine, overlaps, debug, distOBB, blocks, near };
}
