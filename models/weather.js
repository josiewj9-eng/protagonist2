/* =====================================================================
   Weather and the light of the day for the map (2026-11-18).

   Weather and time are separate: any weather at any hour (rain at dusk, fog at dawn). Three numbers describe the weather —
   rain, fog, cloud — and every one eases toward its target (about 8 s), so nothing jumps. The ground gets wet as the rain goes on
   and dries slowly after it.
   - sky: a gradient dome with a glow round the sun, a warm band on the horizon at sunrise and sunset, a cloud layer (noise on the
     dome) whose cover and darkness follow the weather; the sun and the moon cross the sky on a real arc (rising over the sea in the
     east, setting in the west), and the light, its colour and the shadows follow them.
   - rain: one draw call of short streaks round the camera (GPU-animated). A streak is dropped where something covers the ground
     (the cover map: the highest roof, canopy or awning over each 0.5 m) and inside the tram, so it never rains indoors.
     Rings open on open ground where drops land.
   - wet: every Lambert material gets a small patch: upward faces under the open sky darken and take a sky reflection (stronger at a
     grazing angle), and puddles form in hollows of a fixed noise.
   - fog: distance fog whose colour is the air of the hour (never plain white at night) and whose range shrinks with the fog value;
     the sky dome dissolves into it near the horizon.
   ===================================================================== */
export function createWeather({ THREE, scene, renderer, grid, maxDrops = 7000 }){
  const W = { mode:'auto', target:{ rain:0, fog:0, cloud:0.15 }, cur:{ rain:0, fog:0, cloud:0.15 }, wet:0, ease:8, frozen:false };
  const PRESETS = { clear:{ rain:0, fog:0, cloud:0.12 }, rain:{ rain:1, fog:0.22, cloud:0.95 }, fog:{ rain:0, fog:1, cloud:0.55 }, cloudy:{ rain:0, fog:0.1, cloud:0.8 } };

  // ---- the cover map (highest thing over each cell) and the floor (where drops land), as float textures
  const { NX, NZ, X0, Z0, cell } = grid;
  const coverData = new Float32Array(NX*NZ).fill(-10), floorData = new Float32Array(NX*NZ);
  const coverTex = new THREE.DataTexture(coverData, NX, NZ, THREE.RedFormat, THREE.FloatType), floorTex = new THREE.DataTexture(floorData, NX, NZ, THREE.RedFormat, THREE.FloatType);
  [coverTex, floorTex].forEach(t=>{ t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true; });
  function buildCover(colliders, floorAt){ coverData.fill(-10);
    colliders.forEach(c=>{ if (c.y1 < 2.0 || c.hx*c.hz*4 < 0.25) return; const r = Math.hypot(c.hx, c.hz);
      for (let i = Math.floor((c.cx - r - X0)/cell); i <= Math.floor((c.cx + r - X0)/cell); i++) for (let j = Math.floor((c.cz - r - Z0)/cell); j <= Math.floor((c.cz + r - Z0)/cell); j++){
        if (i < 0 || j < 0 || i >= NX || j >= NZ) continue; const x = X0 + (i + 0.5)*cell, z = Z0 + (j + 0.5)*cell, dx = x - c.cx, dz = z - c.cz;
        if (Math.abs(dx*c.ux + dz*c.uz) > c.hx || Math.abs(-dx*c.uz + dz*c.ux) > c.hz) continue; const k = j*NX + i; if (c.y1 > coverData[k]) coverData[k] = c.y1; } });
    for (let j=0;j<NZ;j++) for (let i=0;i<NX;i++) floorData[j*NX + i] = floorAt(X0 + (i + 0.5)*cell, Z0 + (j + 0.5)*cell);
    coverTex.needsUpdate = true; floorTex.needsUpdate = true; }
  const coverAt = (x, z) => { const i = Math.floor((x - X0)/cell), j = Math.floor((z - Z0)/cell); return (i < 0 || j < 0 || i >= NX || j >= NZ) ? -10 : coverData[j*NX + i]; };
  const GRID_U = { uCover:{ value:coverTex }, uFloorM:{ value:floorTex }, uGrid:{ value:new THREE.Vector4(X0, Z0, NX*cell, NZ*cell) } };
  const GLSL_GRID = `uniform sampler2D uCover, uFloorM; uniform vec4 uGrid;
    float coverAt(vec2 xz){ vec2 uv = (xz - uGrid.xy)/uGrid.zw; if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return -10.0; return texture2D(uCover, uv).r; }
    float floorAtM(vec2 xz){ vec2 uv = (xz - uGrid.xy)/uGrid.zw; if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0; return texture2D(uFloorM, uv).r; }`;
  // the tram (a moving roof): its centre, axis and half size; no rain inside it
  const TRAMU = { uTramC:{ value:new THREE.Vector4(0, -99, 0, 0) }, uTramA:{ value:new THREE.Vector4(0, 1, 1.35, 6.4) } };
  const GLSL_TRAM = `uniform vec4 uTramC, uTramA;
    bool inTram(vec3 p){ vec2 d = p.xz - uTramC.xz; float u = dot(d, uTramA.xy), v = dot(d, vec2(-uTramA.y, uTramA.x)); return abs(v) < uTramA.z && abs(u) < uTramA.w && p.y > uTramC.y - 0.2 && p.y < uTramC.y + uTramC.w; }`;

  // ---- rain streaks, in two layers (2026-11-18 r5). Before, the one box of streaks was meant to follow the camera, but nothing ever
  //      told it where the camera was (uCam stayed at the origin): it only rained over the plaza. Now:
  //      near: dense short streaks in a 36 x 22 x 36 m box round the camera (walking, in a shop door, in the tram);
  //      far:  sparser, longer streaks in a box that covers what the view shows — round the place looked at, as wide as the view
  //            (about 100 m on foot, up to 360 m from above), from below the ground to above the tallest roof. They are drawn
  //            longer with distance so they still read as rain from high up. Both layers stop at the highest thing over each
  //            0.5 m (roofs, canopies, awnings, the tram) and at the floor, so drops end on roofs, roads and water, never indoors.
  const RU = { uT:{ value:0 }, uCam:{ value:new THREE.Vector3() }, uRain:{ value:0 }, uCol:{ value:new THREE.Color('#dfe4f4') }, uBox:{ value:new THREE.Vector3(36, 22, 36) }, uWind:{ value:new THREE.Vector2(0.9, 0.35) },
    uNearK:{ value:1 }, uFC:{ value:new THREE.Vector3() }, uFBox:{ value:new THREE.Vector3(140, 48, 140) }, uFarK:{ value:1 }, uFocus:{ value:new THREE.Vector3() }, uLate:{ value:0 }, ...GRID_U, ...TRAMU };
  const rainGeoN = (n, seed0) => { const g = new THREE.BufferGeometry(), pos = new Float32Array(n*6), sd = new Float32Array(n*8); let s = seed0; const R = () => (s = (s*16807) % 2147483647)/2147483647;
    for (let i=0;i<n;i++){ const a = [R(), R(), R(), R()]; for (let e=0;e<2;e++){ pos[(i*2 + e)*3 + 1] = e; sd.set(a, (i*2 + e)*4); } }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(sd, 4)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); return g; };
  // the colour is written in scene (linear) light, or in display colour when the oil filter draws the rain after painting (uLate)
  const RAIN_FS = `uniform vec3 uCol; uniform float uLate; varying float vA; void main(){ if (vA < 0.01) discard; vec3 c = uLate > 0.5 ? pow(uCol, vec3(0.4545)) : uCol; gl_FragColor = vec4(c, vA); }`;
  const rainMat = new THREE.ShaderMaterial({ uniforms:RU, transparent:true, depthWrite:false, fog:false,
    vertexShader:`${GLSL_GRID}${GLSL_TRAM}
      attribute vec4 seed; uniform float uT, uRain, uNearK; uniform vec3 uCam, uBox; uniform vec2 uWind; varying float vA;
      void main(){ float sp = 9.0 + seed.w*3.0;                                              // fall speed m/s
        vec3 p = seed.xyz*uBox; p.y -= uT*sp; p.xz += uWind*uT*0.8;
        p = mod(p - (uCam - uBox*0.5), uBox) + (uCam - uBox*0.5);                          // wrapped in a box that follows the camera
        float len = 0.35 + 0.25*seed.w; vec3 dir = normalize(vec3(uWind.x*0.08, -1.0, uWind.y*0.08));
        vec3 q = p - dir*len*position.y;
        float cov = coverAt(p.xz), fl = floorAtM(p.xz);
        vA = (seed.w < uRain ? 1.0 : 0.0) * (p.y > cov ? 1.0 : 0.0) * (p.y > fl ? 1.0 : 0.0) * (inTram(p) ? 0.0 : 1.0);
        vA *= (1.0 - smoothstep(12.0, 18.0, length(p - uCam)))*uNearK*0.42;
        gl_Position = projectionMatrix*viewMatrix*vec4(q, 1.0); }`,
    fragmentShader:RAIN_FS });
  const rain = new THREE.LineSegments(rainGeoN(maxDrops, 12345), rainMat); rain.frustumCulled = false; rain.renderOrder = 4; rain.userData.keep = true; rain.userData.noCollide = true; rain.userData.late = true; scene.add(rain);
  const farMat = new THREE.ShaderMaterial({ uniforms:RU, transparent:true, depthWrite:false, fog:false,
    vertexShader:`${GLSL_GRID}${GLSL_TRAM}
      attribute vec4 seed; uniform float uT, uRain, uFarK; uniform vec3 uCam, uFC, uFBox; uniform vec2 uWind; varying float vA;
      void main(){ float sp = 10.0 + seed.w*3.0;
        vec3 p = seed.xyz*uFBox; p.y -= uT*sp; p.xz += uWind*uT*0.8;
        p = mod(p - (uFC - uFBox*0.5), uFBox) + (uFC - uFBox*0.5);
        float dc = length(p - uCam), len = 0.6 + 0.02*dc; vec3 dir = normalize(vec3(uWind.x*0.08, -1.0, uWind.y*0.08));
        float cov = coverAt(p.xz), fl = floorAtM(p.xz);
        float top = p.y, bot = max(p.y - len, max(cov, fl));                                // the streak is cut where it meets a roof or the ground
        vec3 q = vec3(p.x, mix(top, bot, position.y), p.z) - vec3(dir.x, 0.0, dir.z)*len*position.y;
        vA = (seed.w < uRain ? 1.0 : 0.0) * (top > cov + 0.05 ? 1.0 : 0.0) * (top > fl + 0.05 ? 1.0 : 0.0) * (inTram(p) ? 0.0 : 1.0);
        vec2 e = abs(p.xz - uFC.xz)/(uFBox.xz*0.5);                                          // a soft edge: no hard border of the box
        vA *= smoothstep(12.0, 20.0, dc)*(1.0 - smoothstep(0.72, 1.0, max(e.x, e.y)))*uFarK*(0.22 + 0.1*seed.z);
        gl_Position = projectionMatrix*viewMatrix*vec4(q, 1.0); }`,
    fragmentShader:RAIN_FS });
  const rainFar = new THREE.LineSegments(rainGeoN(Math.round(maxDrops*2.4), 424242), farMat); rainFar.frustumCulled = false; rainFar.renderOrder = 4; rainFar.userData.keep = true; rainFar.userData.noCollide = true; rainFar.userData.late = true; scene.add(rainFar);
  // where the rain is: the camera (near layer), what the view shows (far layer), where one stands (rings on the ground)
  // cam: the camera position; focus: the place looked at / walked; span: how much ground the view covers (m); ground: the floor under the camera
  function place(cam, focus, span, ground){ RU.uCam.value.copy(cam); RU.uFocus.value.copy(focus);
    const L = Math.max(100, Math.min(360, span)); RU.uFBox.value.set(L, 48, L); RU.uFC.value.set(focus.x, -2 + 24, focus.z);
    RU.uNearK.value = 1 - Math.min(1, Math.max(0, (cam.y - ground - 30)/30)); }
  // ---- rings where drops land (open ground only)
  const RINGS = 260, ringGeo = new THREE.RingGeometry(0.06, 0.1, 12); ringGeo.rotateX(-Math.PI/2);
  const ringSeed = new Float32Array(RINGS*3); { let s = 777; const R = () => (s = (s*16807) % 2147483647)/2147483647; for (let i=0;i<RINGS*3;i++) ringSeed[i] = R(); }
  const ringInst = new THREE.InstancedBufferGeometry(); ringInst.index = ringGeo.index; ringInst.attributes.position = ringGeo.attributes.position; ringInst.setAttribute('rs', new THREE.InstancedBufferAttribute(ringSeed, 3)); ringInst.instanceCount = RINGS;
  ringInst.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const ringMat = new THREE.ShaderMaterial({ uniforms:RU, transparent:true, depthWrite:false, fog:false,
    vertexShader:`${GLSL_GRID}${GLSL_TRAM} attribute vec3 rs; uniform float uT, uRain, uLate; uniform vec3 uFocus; varying float vA;
      void main(){ float ph = fract(uT*1.3 + rs.z), cyc = floor(uT*1.3 + rs.z);
        vec2 xz = uFocus.xz + (fract(rs.xy + cyc*vec2(0.37, 0.61)) - 0.5)*24.0; float fl = floorAtM(xz), cov = coverAt(xz);
        vA = (1.0 - ph)*(rs.z < uRain ? 1.0 : 0.0)*(cov < fl + 0.3 ? 1.0 : 0.0)*(1.0 - smoothstep(8.0, 12.0, length(xz - uFocus.xz)));
        vec3 p = vec3(xz.x, fl + 0.012, xz.y) + position*(0.3 + ph*1.5);
        gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0); }`,
    fragmentShader:`uniform float uLate; varying float vA; void main(){ if (vA < 0.01) discard; vec3 c = vec3(0.93, 0.95, 1.0); gl_FragColor = vec4(uLate > 0.5 ? c : c*c, 0.32*vA); }` });
  const rings = new THREE.Mesh(ringInst, ringMat); rings.frustumCulled = false; rings.renderOrder = 4; rings.userData.keep = true; rings.userData.noCollide = true; rings.userData.late = true; scene.add(rings);

  // ---- wet ground: a patch for every Lambert material
  const WETU = { uWet:{ value:0 }, uWetSky:{ value:new THREE.Color('#9aa4c8') }, uRainNow:{ value:0 }, uTw:{ value:0 } };
  // r5: the light inside the shops and rooms one can see into: up to 16 boxes (centre x z, half sizes; cos, sin, floor, ceiling).
  // A face inside one of them gets a warm fill in proportion to its own colour — interiors read as lit rooms, not black holes,
  // at the cost of a few comparisons per pixel and no extra lights. The page sets the boxes once and the fill with the hour.
  const ROOMU = { uRoomA:{ value:Array.from({ length:16 }, ()=>new THREE.Vector4(0, 0, 0, 0)) }, uRoomB:{ value:Array.from({ length:16 }, ()=>new THREE.Vector4(1, 0, 0, 0)) }, uRoomN:{ value:0 }, uRoomFill:{ value:new THREE.Color(0, 0, 0) } };
  function setRooms(list){ list.slice(0, 16).forEach((r, i)=>{ ROOMU.uRoomA.value[i].set(r.cx, r.cz, r.hw, r.hd); ROOMU.uRoomB.value[i].set(Math.cos(r.rot), Math.sin(r.rot), r.y0, r.y1); }); ROOMU.uRoomN.value = Math.min(16, list.length); }
  const patched = new WeakSet();
  function patch(mt){ if (!mt || patched.has(mt) || !mt.isMeshLambertMaterial) return; patched.add(mt);
    const prev = mt.onBeforeCompile;
    mt.onBeforeCompile = (sh, r) => { prev && prev.call(mt, sh, r); Object.assign(sh.uniforms, WETU, GRID_U, ROOMU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWetW;').replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 wq = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            wq = instanceMatrix*wq;
          #endif
          vWetW = (modelMatrix*wq).xyz; }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWetW; uniform float uWet, uRainNow, uTw; uniform vec3 uWetSky, uRoomFill; uniform vec4 uRoomA[16], uRoomB[16]; uniform int uRoomN; ${GLSL_GRID}
        float wHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
        float wNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(wHash(i), wHash(i + vec2(1, 0)), f.x), mix(wHash(i + vec2(0, 1)), wHash(i + vec2(1, 1)), f.x), f.y); }`)
      .replace('#include <opaque_fragment>', `
        if (uWet > 0.001){
          vec3 upV = normalize((viewMatrix*vec4(0.0, 1.0, 0.0, 0.0)).xyz);
          float up = smoothstep(0.6, 0.92, dot(normal, upV));
          float open = vWetW.y > coverAt(vWetW.xz) - 0.05 ? 1.0 : 0.0;
          float wk = uWet*up*open;
          if (wk > 0.001){
            // r5: the old patch darkened every wet face by a third and laid dark puddle blotches everywhere — from above the town
            // read as dirty. Now the wet darkening is mild, puddles mostly add a soft sky sheen, and the puddle pattern fades out with
            // distance (far ground gets an even sheen instead of a speckle of blotches). Rings show on all open ground, more in puddles.
            float vd = length(vViewPosition), near = 1.0 - smoothstep(30.0, 75.0, vd);
            float n = wNoise(vWetW.xz*0.22) * 0.7 + wNoise(vWetW.xz*0.9 + 7.0)*0.3;
            float pud = smoothstep(0.56, 0.7, n)*smoothstep(0.25, 0.9, uWet);
            pud = mix(0.25*smoothstep(0.25, 0.9, uWet), pud, near);
            float fres = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 4.0);
            outgoingLight *= 1.0 - 0.16*wk - 0.08*pud*wk;
            float ring = 0.0; if (uRainNow > 0.01 && vd < 26.0){ vec2 g = vWetW.xz*1.6; vec2 c = floor(g); float ph = fract(uTw*0.9 + wHash(c)); float r = length(fract(g) - 0.5 - (wHash(c + 3.1) - 0.5)*0.4);
              ring = smoothstep(0.05, 0.0, abs(r - ph*0.45))*(1.0 - ph)*(0.35 + 0.65*pud)*uRainNow*(1.0 - smoothstep(14.0, 26.0, vd)); }
            outgoingLight += uWetSky*(0.05 + 0.5*fres)*(0.4*wk + 0.7*pud*wk) + uWetSky*ring*0.3;
          }
        }
        for (int i = 0; i < 16; i++){ if (i >= uRoomN) break; vec2 dq = vWetW.xz - uRoomA[i].xy; vec4 rb = uRoomB[i];
          vec2 lq = vec2(dq.x*rb.x - dq.y*rb.y, dq.x*rb.y + dq.y*rb.x);
          if (abs(lq.x) < uRoomA[i].z && abs(lq.y) < uRoomA[i].w && vWetW.y > rb.z - 0.05 && vWetW.y < rb.w + 0.02){ outgoingLight += diffuseColor.rgb*uRoomFill; break; } }
        #include <opaque_fragment>`);
    };
    const pk = mt.customProgramCacheKey; mt.customProgramCacheKey = () => (pk ? pk.call(mt) : '') + '|wet3'; mt.needsUpdate = true; }
  function patchScene(root = scene){ root.traverse(o=>{ const m = o.material; if (!m) return; (Array.isArray(m) ? m : [m]).forEach(patch); }); }

  // ---- the sky: gradient, sun glow, horizon band at low sun, clouds, fog at the horizon
  const SKYU = { uTop:{ value:new THREE.Color() }, uHor:{ value:new THREE.Color() }, uSunDir:{ value:new THREE.Vector3(0, 1, 0) }, uSunCol:{ value:new THREE.Color() }, uMoonDir:{ value:new THREE.Vector3(0, -1, 0) },
    uCloud:{ value:0.2 }, uCloudCol:{ value:new THREE.Color('#ffffff') }, uCloudDark:{ value:0 }, uFog:{ value:0 }, uFogCol:{ value:new THREE.Color() }, uT:{ value:0 }, uLow:{ value:0 }, uNight:{ value:0 } };
  const skyMat = new THREE.ShaderMaterial({ side:THREE.BackSide, depthWrite:false, depthTest:false, fog:false, uniforms:SKYU,
    vertexShader:`varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
    fragmentShader:`uniform vec3 uTop, uHor, uSunDir, uSunCol, uMoonDir, uCloudCol, uFogCol; uniform float uCloud, uCloudDark, uFog, uT, uLow, uNight; varying vec3 vP;
      float h2(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i=0;i<5;i++){ s += a*n2(p); p = p*2.03 + 7.1; a *= 0.5; } return s; }
      void main(){ vec3 d = normalize(vP); float t = smoothstep(-0.05, 0.6, d.y);
        vec3 col = mix(uHor, uTop, t);
        float sd = max(dot(d, uSunDir), 0.0), sunUp = smoothstep(-0.12, 0.05, uSunDir.y);
        col += uSunCol*(pow(sd, 6.0)*0.35 + pow(sd, 40.0)*0.5)*sunUp*(1.0 - 0.8*uCloud);                     // the glow round the sun
        float band = (1.0 - smoothstep(0.0, 0.35, d.y))*uLow*pow(max(dot(normalize(d.xz + 1e-4), normalize(uSunDir.xz + 1e-4)), 0.0), 2.0);
        col = mix(col, uSunCol*1.05, band*0.55*(1.0 - 0.7*uCloud));                                          // the warm band at sunrise and sunset
        float md = max(dot(d, uMoonDir), 0.0); col += vec3(0.75, 0.8, 0.95)*pow(md, 30.0)*0.25*uNight*(1.0 - uCloud);
        // clouds on a flat layer above: drift slowly; cover = weather
        if (d.y > 0.0){ vec2 uv = d.xz/(d.y + 0.12)*1.6 + vec2(uT*0.004, uT*0.0015);
          float c = fbm(uv), cov = smoothstep(1.0 - uCloud*0.95 - 0.05, 1.05 - uCloud*0.6, c + uCloud*0.35);
          vec3 cc = mix(uCloudCol, uCloudCol*0.55, uCloudDark) + uSunCol*pow(sd, 4.0)*0.25*sunUp;
          col = mix(col, cc, cov*smoothstep(0.0, 0.12, d.y)*0.92); }
        col = mix(col, uFogCol, uFog*(1.0 - smoothstep(0.0, 0.45, d.y))*0.95 + uFog*0.25);
        gl_FragColor = vec4(col, 1.0); }` });

  // ---- the sun and the moon on a real arc: sunrise 6:00 over the sea (east, +x), noon to the south (+z), sunset 18:30 in the west
  const RISE = 5.9, SET = 19.2;            // r5: the sun sets at 19:12, so the 18:30–19:00 sky keys get real low golden light (it used to be gone already)
  function sunDir(h, out){ const t = (h - RISE)/(SET - RISE); const az = Math.PI*t, el = Math.sin(Math.PI*Math.max(-0.25, Math.min(1.25, t)))*1.05;
    return out.set(Math.cos(az)*Math.cos(el), Math.sin(el), Math.sin(az)*Math.cos(el)*0.75 + 0.25).normalize(); }
  function moonDir(h, out){ let t = ((h - SET + 24) % 24)/(24 - (SET - RISE)); const az = Math.PI*t, el = Math.sin(Math.PI*Math.max(0, Math.min(1, t)))*0.9 + 0.08;
    return out.set(Math.cos(az)*Math.cos(el), Math.sin(el), Math.sin(az)*Math.cos(el)*0.6 + 0.3).normalize(); }

  function setPreset(name){ if (name === 'auto'){ W.mode = 'auto'; return; } W.mode = name; Object.assign(W.target, PRESETS[name]); }
  function set(k, v){ W.mode = 'manual'; W.target[k] = v; }
  // dt: real seconds; auto(h): the weather the town itself would have at this hour (given by the page)
  function tick(dt, h, autoW){ if (W.mode === 'auto' && autoW) Object.assign(W.target, autoW(h));
    const k = W.frozen ? 0 : 1 - Math.exp(-dt/W.ease*3); for (const key of ['rain', 'fog', 'cloud']) W.cur[key] += (W.target[key] - W.cur[key])*k;
    if (!W.frozen){ const want = W.cur.rain > 0.15 ? 1 : 0; W.wet += (want - W.wet)*(1 - Math.exp(-dt/(want ? 14 : 45))); }
    RU.uT.value += dt; RU.uRain.value = W.cur.rain; WETU.uWet.value = Math.min(1, W.wet); WETU.uRainNow.value = W.cur.rain; WETU.uTw.value = RU.uT.value;
    rain.visible = rainFar.visible = W.cur.rain > 0.01; rings.visible = W.cur.rain > 0.05; }
  return { W, PRESETS, setPreset, set, tick, place, setRooms, ROOMU, buildCover, coverAt, coverData, floorData, grid, patch, patchScene, skyMat, SKYU, RU, WETU, TRAMU, sunDir, moonDir, rain, rainFar, rings };
}
