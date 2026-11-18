/* =====================================================================
   Oil filter — the painting pass from oil-test.html, as a module any page can switch on.

   Taken from oil-test.html without changes to how it paints: the shader FSOIL (anisotropic Kuwahara, strokes in surface
   coordinates, near outlines, canvas grain), the moving-object pass (moving meshes draw their own local coordinates into a
   half-float target that shares the scene's depth, so strokes ride on them), the noise texture with its own seed, the
   GPU timer and the A/B bench. Not taken: index's camera post pass (CCTV, lenses, depth of field, palette grade), its final
   blit (vignette, grain, 40-level dither), the dream, the panel's CCTV switch. In their place a plain pass turns the scene's
   linear colour into display colour — the same conversion index's post pass does first (pow 1/2.2) — so the paint pass gets
   the kind of image it was tuned on.

   Use:  const oil = createOilFilter({ THREE, renderer, scene, movers, classOf });   oil.render(camera, dt) instead of
         renderer.render(scene, camera). movers(): the moving roots (their meshes get the object pass); classOf(mesh, root):
         0 building-like, 2 organic, 3 small / figure, 4 metal / hard.
   ===================================================================== */
/* final (optional, added 2026-11-18 for the life page): a function returning a ShaderMaterial, or null. When it returns one, that pass
   draws the picture to the screen instead of the plain copy: uniforms tOut (the painted picture, display colour), tRaw (the scene in
   display colour before painting), tDepth (the scene's depth), uNear/uFar. Pages that do not pass it are drawn exactly as before. */
export function createOilFilter({ THREE, renderer, scene, movers = () => [], classOf = () => 0, skip = new Set(), late = () => [], onLate = () => {}, final = () => null }){
const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FSOIL = `
precision highp float;
uniform sampler2D tOut, tNoise, tDepth, tObj; uniform vec2 uTexel;
uniform float uFG, uBG, uSkyTex, uColorS, uZN, uZF; uniform vec3 uAtmos;
uniform float uAnimT, uAnimAmp, uVary, uLodFix, uScale, uRadius, uK, uStroke, uCanvas, uSplit, uWarp, uPix, uTime, uLive, uLine, uLineNear, uLineFar, uObjOn, uNear, uFar, uDbg;
uniform int uSectors;
uniform mat4 uInvProj, uCamWorld;
varying vec2 vUv;
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
// YIQ: Y = value, I = orange..blue, Q = purple..green. Strokes now move hue and chroma; value only a little.
vec3 toYIQ(vec3 c){ return mat3(0.299, 0.596, 0.211,  0.587, -0.274, -0.523,  0.114, -0.322, 0.312)*c; }
vec3 toRGB(vec3 y){ return mat3(1.0, 1.0, 1.0,  0.956, -0.272, -1.106,  0.621, -0.647, 1.703)*y; }
float lumAt(vec2 uv){ return lum(texture2D(tOut, uv).rgb); }
// a fixed 256x256 random texture (wraps, bilinear): r/g/b are three independent fields
vec4 nz(vec2 p){ return texture2D(tNoise, p/256.0); }
// the post pass bends some lenses (CCTV, cat/dog, one more); depth and object data are looked up through the same bend
vec2 warp(vec2 uv){ vec2 c = uv - 0.5; return 0.5 + c*(1.0 - uWarp*dot(c, c)); }
vec3 viewPos(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 v = uInvProj*vec4(uv*2.0 - 1.0, d*2.0 - 1.0, 1.0); return v.xyz/v.w; }
float linZ(vec2 uv){ float z = texture2D(tDepth, uv).x*2.0 - 1.0; return 2.0*uNear*uFar/(uFar + uNear - z*(uFar - uNear)); }
// ---- brushwork, by kind of surface. a = (size, length:width, contrast, pigment), b = (fixed irregularity, bend, -, how much it lives)
//   0 buildings: structured long horizontal strokes, clear pigment
//   1 ground / sky / water: broad soft short strokes, wandering
//   2 vegetation & animals: short, irregular, expressive
//   3 small things & people: small and faint, so forms stay readable
//   4 metal / hard (cars, bus, trams, boats, vending machines): long smooth strokes, little contrast, never dark
void classParams(float c, out vec4 a, out vec4 b){
  if (c < 0.5)      { a = vec4(1.0, 6.5, 1.0, 1.0);  b = vec4(0.25, 0.8, 0.0, 1.0); }
  else if (c < 1.5) { a = vec4(1.9, 2.6, 0.75, 0.8); b = vec4(1.1, 1.0, 0.0, 1.0); }
  else if (c < 2.5) { a = vec4(1.15, 2.0, 1.4, 1.25); b = vec4(1.6, 1.3, 0.0, 1.2); }
  else if (c < 3.5) { a = vec4(0.75, 3.5, 0.5, 0.6); b = vec4(0.4, 0.5, 0.0, 0.5); }
  else              { a = vec4(1.6, 10.0, 0.4, 0.35); b = vec4(0.15, 0.3, 0.0, 0.4); }
}
// time as a third axis of the noise: two random layers of the same texture, cross-faded with a smooth step. The pattern
// changes shape in place; nothing is translated, so it can't scroll, and it changes slowly, so it can't flicker.
// Each area runs on its own phase (a smooth offset field), so no two regions change in step: no global 'pulse'.
float tn(vec2 Q, float t, vec2 off){ t += nz(Q*0.11 + off + 3.7).b*4.0; float k = floor(t), f = t - k; f = f*f*(3.0 - 2.0*f);
  return mix(nz(Q + off + k*vec2(37.13, 91.71)).r, nz(Q + off + (k + 1.0)*vec2(37.13, 91.71)).r, f); }
// one octave of strokes. p: surface coordinates (m), S: stroke width (m), t: animation clock, A: animation amplitude.
// Returns about -0.5..0.5 (strokes) and, in pig, a warm/cool pigment value for the same spot.
float strokes(vec2 p, float S, vec4 a, vec4 b, float t, float A, out float pig){
  vec2 q = p/S;                                                  // in stroke widths
  // a fixed irregularity per surface kind (organic things wander more), and a living bend that slowly changes:
  // both are small, bounded displacements, so the strokes bend and reshape where they are, they never travel
  vec2 w0 = vec2(nz(q/5.0 + 11.0).g, nz(q/5.0 + 29.0).b) - 0.5;
  vec2 w1 = vec2(tn(q/3.5, t, vec2(0.0)), tn(q/3.5, t, vec2(71.0, 13.0))) - 0.5;
  vec2 w2 = vec2(tn(q/9.0, t*0.6, vec2(5.0, 41.0)), tn(q/9.0, t*0.6, vec2(23.0, 7.0))) - 0.5;     // broader sway = slow change of direction
  vec2 qq = q + w0*b.x*2.0 + (w1*1.6 + w2*3.0*b.y)*A*b.w;
  vec2 e = vec2(qq.x/a.y, qq.y);                                  // long along the surface's u, narrow across
  // the stroke layout itself reorganises slowly (each stroke fades into a new one over ~8 s at speed 1)
  // the cross-fade always runs the full way (stopping part-way and starting the next one would pop); the amplitude
  // instead blends between a still layout and the living one. The phase varies smoothly in space, so areas re-form in turn.
  float tt = t*0.3 + nz(q/40.0 + 17.0).b*3.0, k = floor(tt), f = tt - k; f = f*f*(3.0 - 2.0*f);
  float s1 = nz(e + k*vec2(17.3, 59.1)).r, s2 = nz(e + (k + 1.0)*vec2(17.3, 59.1)).r;
  float sLive = (mix(s1, s2, f) - 0.5)/sqrt((1.0 - f)*(1.0 - f) + f*f);   // keep the contrast while cross-fading
  float sStill = nz(e + vec2(203.0, 77.0)).r - 0.5, aL = clamp(A, 0.0, 1.0);
  float sv = mix(sStill, sLive, aL)/sqrt((1.0 - aL)*(1.0 - aL) + aL*aL);
  float broad = nz(e*vec2(0.5, 0.35) + vec2(37.0, 11.0)).g - 0.5;
  pig = tn(q/4.0 + vec2(7.0, 3.0), t*0.5, vec2(0.0)) - 0.5;
  return (sv*0.75 + broad*0.25)*a.z;
}
void main(){
  vec3 src = texture2D(tOut, vUv).rgb;
  if (vUv.x < uSplit){                                   // compare: the original on the left of the split
    float line = 1.0 - smoothstep(0.0, 1.5, abs(gl_FragCoord.x - uSplit/uTexel.x));
    gl_FragColor = vec4(mix(src, vec3(1.0), line*0.8), 1.0); return; }

  // ---- 1. anisotropic generalized Kuwahara (after @react-three/postprocessing Kuwahara.tsx / Kyprianidis et al.)
  vec2 d = uTexel * max(1.0, uRadius*0.5);
  float tl = lumAt(vUv + vec2(-d.x, d.y)), tc = lumAt(vUv + vec2(0.0, d.y)), tr = lumAt(vUv + d);
  float ml = lumAt(vUv - vec2(d.x, 0.0)),                                     mr = lumAt(vUv + vec2(d.x, 0.0));
  float bl = lumAt(vUv - d),              bc = lumAt(vUv - vec2(0.0, d.y)), br = lumAt(vUv + vec2(d.x, -d.y));
  float gx = (tr + 2.0*mr + br) - (tl + 2.0*ml + bl);
  float gy = (tl + 2.0*tc + tr) - (bl + 2.0*bc + br);
  vec3 st = vec3(gx*gx, gy*gy, gx*gy);
  float df = st.x - st.y, root = sqrt(df*df + 4.0*st.z*st.z);
  float aniso = root / (st.x + st.y + 1e-7);
  float phi = 0.5 * atan(2.0*st.z, df + 1e-7);
  float c = cos(phi), s = sin(phi);
  mat2 T = mat2(c, s, -s, c) * mat2(1.0/(1.0 + aniso), 0.0, 0.0, 1.0 + aniso);
  float sectorAngle = 6.28318531 / float(uSectors);
  vec3 colSum = vec3(0.0); float wSum = 0.0;
  for (int i = 0; i < 8; i++){
    if (i >= uSectors) break;
    vec3 sum = src, sq = src*src; float n = 1.0;
    for (int k = 0; k < 3; k++){
      float a = (float(i) + (float(k) + 0.5)/3.0) * sectorAngle;
      vec2 stp = (T*vec2(cos(a), sin(a)))*uTexel;
      for (int ri = 1; ri <= 4; ri++){
        float r = float(ri); if (r > uRadius + 0.001) break;
        vec3 cc = texture2D(tOut, vUv + stp*r).rgb;
        sum += cc; sq += cc*cc; n += 1.0;
      }
    }
    vec3 m = sum/n, v = abs(sq/n - m*m);
    float w = 1.0 / (1.0 + pow(255.0*sqrt(v.r + v.g + v.b), 4.0));
    colSum += m*w; wSum += w;
  }
  // the weights can be tiny everywhere on a hard edge (every sector straddles it): normalise by their sum, never by a
  // floor, or the colour is scaled toward black. That floor was where the stray black outlines came from.
  vec3 paint = wSum > 1e-30 ? colSum/wSum : src;

  // ---- 2. where on which surface is this pixel? (the brushwork is painted in those coordinates, not the screen's)
  vec2 duv = warp(vUv);
  float dep = texture2D(tDepth, duv).x;
  vec3 V = viewPos(duv);
  float dist = length(V);
  vec4 ob = texture2D(tObj, duv);
  vec2 sp; float kind, axisO = 3.0, cls = 1.0; vec3 Lw = vec3(0.0);                                  // kind: 0 sky, 1 still world, 2 moving thing (own coordinates)
  if (dep > 0.99999){
    // the sky is infinitely far: its strokes hang on the view direction, so they turn with the head and ignore walking
    vec3 dir = normalize(mat3(uCamWorld)*V);
    sp = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0)))*100.0; dist = 100.0; kind = 0.0;
  } else {
    vec3 L; float axis;
    if (ob.a > 0.5 && uObjOn > 0.5){ L = ob.rgb; float code = floor(ob.a - 1.0 + 0.5); cls = floor(code/3.0); axis = code - cls*3.0; kind = 2.0; }   // object-local (m) + its kind
    else {
      L = (uCamWorld*vec4(V, 1.0)).xyz; kind = 1.0;
      // the surface normal from the depth of the neighbours; the nearer difference each way, so edges don't bend it
      vec3 x1 = viewPos(duv + vec2(uTexel.x, 0.0)) - V, x2 = V - viewPos(duv - vec2(uTexel.x, 0.0));
      vec3 y1 = viewPos(duv + vec2(0.0, uTexel.y)) - V, y2 = V - viewPos(duv - vec2(0.0, uTexel.y));
      vec3 N = mat3(uCamWorld)*cross(abs(x1.z) < abs(x2.z) ? x1 : x2, abs(y1.z) < abs(y2.z) ? y1 : y2);
      vec3 an = abs(N); axis = (an.x > an.y && an.x > an.z) ? 0.0 : (an.y > an.z ? 1.0 : 2.0);
    }
    // still world: ground = low horizontal faces; greenish = vegetation; everything else = building
    if (kind < 1.5){ cls = 0.0;
      if (axis > 0.5 && axis < 1.5 && L.y < 0.6) cls = 1.0;
      float green = src.g - max(src.r, src.b); if (green > 0.025) cls = 2.0; }
    // walls get horizontal strokes, the ground diagonal ones
    axisO = axis; Lw = L;
    sp = axis < 0.5 ? L.zy : (axis < 1.5 ? mat2(0.82, 0.57, -0.57, 0.82)*L.xz : L.xy);
  }

  // ---- 3. brushwork with a level of detail: the stroke keeps about the same size on screen, but lives on the surface.
  //         Two octaves cross-fade as the distance halves or doubles (no popping, no sliding).
  float bw = 0.9 + uRadius*0.55;                          // stroke width in pixels, grows with the brush
  // ... in metres at this distance; x uScale (2) so a stroke is never thinner than ~2.5 px (thinner aliases and shimmers in motion)
  // ---- depth zones (smooth, never layered): near = full brushwork and lines; mid = broader, softer strokes, weaker lines;
  //      far = little texture, a touch of atmosphere. The sky is its own case: almost clean.
  float zMid = smoothstep(uZN*0.6, uZN*2.5, dist), zFar = smoothstep(uZF, uZF*3.5, dist);
  float strokeK = kind < 0.5 ? uSkyTex*0.3 : uFG*(1.0 - 0.5*zMid)*(1.0 - 0.85*uBG*zFar);
  float W = max(dist*uPix, 1e-6)*bw*uScale*(1.0 + 0.8*zMid + 0.8*zFar);    // strokes grow broader with distance
  float lv = log2(W/0.01), l0 = floor(lv), t = lv - l0;
  if (uLodFix > 0.0){ l0 = log2(uLodFix/0.01); t = 0.0; }   // test only: one fixed stroke size
  vec4 ca, cb; classParams(mix(1.0, cls, uVary), ca, cb);          // uVary 0 = one treatment for all (the old look)
  float S0 = 0.01*exp2(l0)*mix(1.0, ca.x, uVary);
  float A = uAnimAmp;
  float pg1, pg2;
  float streak = strokes(sp, S0, ca, cb, uAnimT, A, pg1)*(1.0 - t) + strokes(sp + vec2(13.7, 7.1), 2.0*S0, ca, cb, uAnimT, A, pg2)*t;
  streak /= sqrt((1.0 - t)*(1.0 - t) + t*t);
  float pig = mix(pg1, pg2, t);
  float L = lum(paint);
  // the strokes take their colour from the surface under them: each dab leans its hue a little and swings its
  // saturation; value moves only slightly. Neutral surfaces get broken colour: warm leans in the light, cool in shadow.
  // (Before, the strokes only multiplied brightness: grey speckle, the main source of the muddy look.)
  float sv = streak*uStroke*strokeK;
  if (cls > 3.5) sv = max(sv, -0.03);                              // metal: no dark strokes
  vec3 yq = toYIQ(paint);
  float pk = pig*uStroke*strokeK*mix(1.0, ca.w, uVary);
  float hue = pk*0.9*uColorS;
  yq.yz = mat2(cos(hue), sin(hue), -sin(hue), cos(hue))*yq.yz*(1.0 + 0.55*sv);
  yq.yz += mix(vec2(-0.045, 0.03), vec2(0.06, 0.012), smoothstep(0.25, 0.75, yq.x))*(pk + 0.3*sv)*0.7*uColorS;
  yq.x *= 1.0 + 0.16*sv;
  if (kind > 0.5){
    // luminous colour: dull colours gain chroma (vibrance), shadows turn coloured instead of grey, a slight lift
    float C = length(yq.yz);
    yq.yz *= 1.0 + uColorS*0.5*(1.0 - smoothstep(0.02, 0.16, C));
    yq.yz += vec2(-0.03, 0.035)*uColorS*(1.0 - smoothstep(0.12, 0.5, yq.x));
    yq.x = mix(yq.x, sqrt(max(yq.x, 0.0))*0.25 + yq.x*0.75, uColorS*0.15);   // r5: was 0.35 — it lifted every shadow toward grey
    // atmospheric perspective: far things lose a little chroma and lean toward the air colour (no grey fog)
    yq.yz *= 1.0 - 0.25*uBG*zFar;
  }
  paint = toRGB(yq);
  if (kind > 0.5) paint = mix(paint, uAtmos, 0.18*uBG*zFar);

  // ---- 4. selective painted outlines: only near things, mostly silhouettes (creases faint), on the nearer side of a
  //         jump, broken by a surface-anchored noise that slowly breathes. Colour: a deeper, more saturated shade of the
  //         object's own colour. Dark objects get no line at all (a darker shade of dark is black, which we never want).
  float lineA = 0.0;
  if (uLine > 0.001 && kind > 0.5){
    float zc = linZ(duv), fade = 1.0 - smoothstep(uLineNear, uLineFar, zc);
    if (fade > 0.001){
      vec2 o = uTexel*1.7;
      float iz = 1.0/zc;
      float ex = (1.0/linZ(duv - vec2(o.x, 0.0)) + 1.0/linZ(duv + vec2(o.x, 0.0)) - 2.0*iz)/iz;
      float ey = (1.0/linZ(duv - vec2(0.0, o.y)) + 1.0/linZ(duv + vec2(0.0, o.y)) - 2.0*iz)/iz;
      float e = max(-min(ex, ey), 0.0);                 // > 0 on the nearer side only
      float edge = smoothstep(0.035, 0.1, e)*0.35 + smoothstep(0.15, 0.4, e)*0.65;  // creases faint, silhouettes full
      vec2 gp = sp/(S0*9.0) + vec2(5.0, 9.0);
      float keep = smoothstep(0.34, 0.56, tn(gp, uAnimT*0.4, vec2(0.0)));   // ~a third missing; the gaps wander slowly
      float thick = 0.7 + 0.5*nz(gp*2.3 + 3.0).r;
      float Lp = lum(paint);
      lineA = clamp(edge*fade*keep*thick*uLine*(0.85 + 0.6*streak), 0.0, 0.92) * smoothstep(0.07, 0.22, Lp) * (1.0 - 0.5*zMid);
      vec3 lc = paint*0.55; lc = mix(vec3(lum(lc)), lc, 1.45);     // deeper and a bit richer, same hue
      lc = max(lc, paint*0.38 + 0.02);                             // floor relative to the colour: never black
      paint = mix(paint, lc, lineA);
    }
  }

  // ---- 5. the canvas itself: fixed to the frame, like the cloth under the paint; soft weave + tooth + blotch, mostly in the lights
  vec2 q = gl_FragCoord.xy;
  float weave = sin(q.x*1.0472)*sin(q.y*1.0472);
  float tooth = texture2D(tNoise, (q + 0.5)/256.0).g - 0.5, blotch = nz(q/27.0 + 91.0).r - 0.5;
  float canvas = weave*0.25 + tooth*0.35 + blotch*0.8;            // less tooth: grain read as dirt
  if (kind > 0.5) paint *= 1.0 + canvas*uCanvas*0.05*(0.45 + 0.55*L)*(1.0 - 0.7*zFar);   // not on the sky, little far away

  vec3 outc = mix(src, clamp(paint, 0.0, 1.0), uK);
  if (uDbg > 0.5 && uDbg < 1.5) outc = kind < 0.5 ? vec3(0.55, 0.7, 0.95) : (kind < 1.5 ? vec3(0.75) : vec3(1.0, 0.45, 0.3));   // which coordinates
  if (uDbg > 1.5 && uDbg < 2.5) outc = vec3(0.5 + streak*0.9);                                                                // the stroke field alone
  if (uDbg > 2.5 && uDbg < 3.5) outc = mix(vec3(1.0), vec3(0.2, 0.1, 0.3), lineA/0.85);                                        // the outlines alone
  if (uDbg > 7.5){ vec3 cc = cls < 0.5 ? vec3(0.9,0.75,0.6) : cls < 1.5 ? vec3(0.6,0.6,0.65) : cls < 2.5 ? vec3(0.4,0.85,0.4) : cls < 3.5 ? vec3(0.95,0.5,0.8) : vec3(0.4,0.7,1.0); gl_FragColor = vec4(mix(cc, src, 0.35), 1.0); return; }   // test: surface kinds
  if (uDbg > 6.5){ gl_FragColor = vec4(src, 1.0); return; }   // test: the picture before painting
  if (uDbg > 5.5){ gl_FragColor = vec4(mix(src, vec3(1.0, 0.3, 0.1), kind > 1.5 ? 0.45 : 0.0), 1.0); return; }   // test: object data over the picture (alignment)
  if (uDbg > 4.5){ outc = fract(Lw); gl_FragColor = vec4(outc, 1.0); return; }   // test: the surface position the strokes use
  if (uDbg > 3.5){ float zz = clamp(length(V)/200.0, 0.0, 0.99999)*255.0; outc = vec3(floor(zz)/255.0, fract(zz), (kind*4.0 + axisO)/15.0); }  // test: distance (16 bit) + kind
  gl_FragColor = vec4(outc, 1.0);
}`;
const OIL = { on:true, k:1, strength:0.9, radius:3, sectors:4, stroke:0.85, canvas:0.25, anim:true, animSpeed:1, animAmp:0.6, fg:1, bg:0.7, sky:0.15, color:0.6, zoneNear:8, zoneFar:35, animT:0, vary:1, scale:2, line:0.85, lineNear:3, lineFar:14, obj:true, dbg:0, split:-1, hold:false, rt:null,
  res:1, maxPx:1.2e6, gpu:{ ok:false, oil:0, frame:0, scene:0, n:0 }, calls:0, cpuR:0,
  // the depth zones (zoneNear/zoneFar) and the outline range (lineNear/lineFar) were tuned in oil-test for index's views, which look at
  // things 3–30 m away. The map's bird's-eye camera looks from 40–300 m: at that distance every pixel fell in the far zone, which removes
  // ~80% of the strokes, all the outlines and the colour work — the filter was there but barely visible. zoneAuto scales the zones by the
  // distance to what the camera looks at (focus / 12 m, never below 1), so a view from above is painted as oil-test paints a street view.
  zoneAuto:true, focus:12, zoneK:1 };
const OIL_DEFAULTS = JSON.parse(JSON.stringify(OIL));
const oilMat = new THREE.ShaderMaterial({ vertexShader:VS, fragmentShader:FSOIL, depthTest:false, depthWrite:false, uniforms:{
  tOut:{value:null}, tNoise:{value:null}, uTexel:{value:new THREE.Vector2(1,1)}, uRadius:{value:3}, uSectors:{value:4},
  uK:{value:1}, uStroke:{value:0.5}, uCanvas:{value:0.5}, uSplit:{value:-1},
  tDepth:{value:null}, tObj:{value:null}, uWarp:{value:0}, uPix:{value:0.002}, uTime:{value:0}, uLive:{value:0}, uAnimT:{value:0}, uAnimAmp:{value:0.7}, uVary:{value:1}, uFG:{value:1}, uBG:{value:0.7}, uSkyTex:{value:0.15}, uColorS:{value:0.6}, uZN:{value:8}, uZF:{value:35}, uAtmos:{value:new THREE.Vector3(0.8,0.82,0.88)}, uLine:{value:0.85},
  uLineNear:{value:3}, uLineFar:{value:14}, uScale:{value:2}, uLodFix:{value:0}, uObjOn:{value:1}, uNear:{value:0.1}, uFar:{value:2000}, uDbg:{value:0},
  uInvProj:{value:new THREE.Matrix4()}, uCamWorld:{value:new THREE.Matrix4()} } });
{ // its own little random generator, as in oil-test.html (same seed, same texture)
  let seed = 20261117; const R = () => (seed = (seed*1664525 + 1013904223) >>> 0) / 4294967296;
  const N = 256, d = new Uint8Array(N*N*4); for (let i = 0; i < N*N; i++){ d[i*4] = R()*255; d[i*4+1] = R()*255; d[i*4+2] = R()*255; d[i*4+3] = 255; }
  const t = new THREE.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
  oilMat.uniforms.tNoise.value = t; }
// linear scene colour → display colour (index's post pass starts the same way: pow(c, 0.4545))
const gammaMat = new THREE.ShaderMaterial({ vertexShader:VS, depthTest:false, depthWrite:false, uniforms:{ tCur:{ value:null } },
  fragmentShader:`precision highp float; uniform sampler2D tCur; varying vec2 vUv; void main(){ gl_FragColor = vec4(pow(max(texture2D(tCur, vUv).rgb, 0.0), vec3(0.4545)), 1.0); }` });
// the final copy to the screen (the painted image is already display colour)
const copyMat = new THREE.ShaderMaterial({ vertexShader:VS, depthTest:false, depthWrite:false, uniforms:{ tOut:{ value:null } },
  fragmentShader:`precision highp float; uniform sampler2D tOut; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tOut, vUv).rgb, 1.0); }` });
const postCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1), quad = (m) => { const s = new THREE.Scene(), q = new THREE.Mesh(new THREE.PlaneGeometry(2,2), m); q.frustumCulled = false; s.add(q); return s; };
const oilScene = quad(oilMat), gammaScene = quad(gammaMat), copyScene = quad(copyMat), lateScene = new THREE.Scene(); lateScene.matrixWorldAutoUpdate = false;
/* ---- moving things carry their own coordinates (oil-test.html, unchanged): drawn once more after the scene into a small
   half-float buffer sharing the scene's depth (no depth write, equal test), each pixel = the mesh's own local position in
   metres + its dominant local axis + its kind. Only the meshes under movers() are put on the extra layer. */
const OBJ_LAYER = 7;
const objMat = new THREE.ShaderMaterial({
  vertexShader:`varying vec3 vL; varying vec3 vN;
    void main(){ vL = position*length(modelMatrix[0].xyz); vN = normal; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
  fragmentShader:`uniform float uCls; varying vec3 vL; varying vec3 vN;
    void main(){ vec3 a = abs(vN); gl_FragColor = vec4(vL, 1.0 + ((a.x > a.y && a.x > a.z) ? 0.0 : (a.y > a.z ? 1.0 : 2.0)) + 3.0*uCls); }`,
  uniforms:{ uCls:{ value:0 } },
  depthWrite:false, depthFunc:THREE.LessEqualDepth, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-4 });
objMat.onBeforeRender = (r, sc, cam, geo, obj) => { const c = obj.userData.__oilCls || 0; if (objMat.uniforms.uCls.value !== c){ objMat.uniforms.uCls.value = c; objMat.uniformsNeedUpdate = true; } };
const LATE = { rt:null };
const OBJ = { rt:null, tagT:-1e9, n:0, lights:0, calls:0, cpu:0, skipped:[] };
function objTag(now){
  if (now - OBJ.tagT < 5000) return; OBJ.tagT = now; let n = 0, l = 0; const skipped = [];
  const roots = new Set(movers().filter(Boolean));
  scene.traverse(o=>{
    if (o.isLight){ o.layers.enable(OBJ_LAYER); l++; return; }
    if (!o.isMesh || skip.has(o)) return;
    let root = null; for (let a = o; a && !root; a = a.parent) if (roots.has(a)) root = a;
    if (!root){ o.layers.disable(OBJ_LAYER); return; }
    const m = o.material;
    // as in oil-test: basic, shader and point materials keep the world strokes. Instanced and skinned meshes would draw their
    // pose wrongly with the override material: they are listed so the page knows to handle them (none move in the map today)
    if (o.isInstancedMesh || o.isSkinnedMesh || !m || Array.isArray(m) || m.isMeshBasicMaterial || m.isShaderMaterial || m.isPointsMaterial){ o.layers.disable(OBJ_LAYER); skipped.push(o.name || o.type); return; }
    o.layers.enable(OBJ_LAYER); n++; o.userData.__oilCls = classOf(o, root); });
  OBJ.n = n; OBJ.lights = l; OBJ.skipped = skipped;
}
let sceneRT = null, outRT = null;
function targets(){
  const v = new THREE.Vector2(); renderer.getDrawingBufferSize(v); const sc = Math.min(OIL.res, Math.sqrt(OIL.maxPx/Math.max(1, v.x*v.y))), w = Math.max(1, Math.round(v.x*sc)), h = Math.max(1, Math.round(v.y*sc));   // the paint pass costs by pixels: a cap, not a fixed scale, so a high-DPI screen does not double it
  if (sceneRT && sceneRT.width === w && sceneRT.height === h) return;
  if (LATE.rt){ LATE.rt.depthTexture = null; LATE.rt.dispose(); LATE.rt = null; }
  [sceneRT, outRT, OIL.rt].forEach(t=>{ if (!t) return; if (t.depthTexture && t === sceneRT) t.depthTexture.dispose(); t.dispose(); });
  if (OBJ.rt){ OBJ.rt.depthTexture = null; OBJ.rt.dispose(); OBJ.rt = null; }       // never dispose the scene's depth with it
  const dt = new THREE.DepthTexture(w, h); dt.type = THREE.UnsignedIntType;
  sceneRT = new THREE.WebGLRenderTarget(w, h, { depthTexture:dt, depthBuffer:true, samples:0 });
  outRT = new THREE.WebGLRenderTarget(w, h, { magFilter:THREE.NearestFilter, minFilter:THREE.NearestFilter, depthBuffer:false });
  // the painted picture; it shares the scene's depth so thin bright things (rain, ripples) can be drawn over the paint afterwards,
  // hidden behind what is in front of them, without passing through the Kuwahara (which smudged them into grey haze)
  // (the paint pass reads the depth, so it can't draw into a target that holds it: the late layer gets its own target, LATE.rt)
  OIL.rt = new THREE.WebGLRenderTarget(w, h, { magFilter:THREE.LinearFilter, minFilter:THREE.LinearFilter, depthBuffer:false });
  LATE.rt = new THREE.WebGLRenderTarget(w, h, { magFilter:THREE.LinearFilter, minFilter:THREE.LinearFilter, depthBuffer:true }); LATE.rt.depthTexture = sceneRT.depthTexture;
  OBJ.rt = new THREE.WebGLRenderTarget(w, h, { type:THREE.HalfFloatType, magFilter:THREE.NearestFilter, minFilter:THREE.NearestFilter, depthBuffer:true }); OBJ.rt.depthTexture = sceneRT.depthTexture;
  oilMat.uniforms.uTexel.value.set(1/w, 1/h);
}
function renderObj(cam){
  objTag(performance.now());
  const rt = OBJ.rt, ac = renderer.autoClear, bg = scene.background, sm = renderer.shadowMap.autoUpdate, smn = renderer.shadowMap.needsUpdate, au = scene.matrixWorldAutoUpdate, mask = cam.layers.mask;
  const cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false);
  renderer.autoClear = false; scene.background = null; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = false; scene.matrixWorldAutoUpdate = false;
  scene.overrideMaterial = objMat; cam.layers.set(OBJ_LAYER);
  const c0 = renderer.info.render.calls, t0 = performance.now();
  renderer.render(scene, cam);
  OBJ.calls = renderer.info.render.calls - c0; OBJ.cpu = OBJ.cpu*0.95 + (performance.now() - t0)*0.05;
  cam.layers.mask = mask; scene.overrideMaterial = null; scene.matrixWorldAutoUpdate = au; renderer.shadowMap.autoUpdate = sm; renderer.shadowMap.needsUpdate = smn; scene.background = bg; renderer.autoClear = ac;
  renderer.setClearColor(cc, ca);
  return rt;
}
// GPU timing (oil-test.html): frames alternate between timing the oil pass and the whole frame
const GT = (()=>{ const gl = renderer.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!ext) return null;
  const pend = [], acc = { oil:[], frame:[], scene:[] };
  return {
    begin(kind){ if (this.open || pend.length > 16) return; const q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); this.open = { q, kind }; },
    end(kind){ if (!this.open || this.open.kind !== kind) return; gl.endQuery(ext.TIME_ELAPSED_EXT); pend.push(this.open); this.open = null; },
    poll(){ const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
      while (pend.length && gl.getQueryParameter(pend[0].q, gl.QUERY_RESULT_AVAILABLE)){ const { q, kind } = pend.shift(); const ns = gl.getQueryParameter(q, gl.QUERY_RESULT); gl.deleteQuery(q); if (!disjoint){ const a = acc[kind]; a.push(ns/1e6); if (a.length > 120) a.shift(); } }
      const med = a => { if (!a.length) return 0; const b = [...a].sort((x,y)=>x-y); return b[b.length>>1]; };
      const avg = a => a.length ? a.reduce((x,y)=>x+y, 0)/a.length : 0; OIL.gpu.ok = true; OIL.gpu.scene = avg(acc.scene); OIL.gpu.oil = OIL.on ? avg(acc.oil) : 0; OIL.gpu.frame = OIL.gpu.scene + OIL.gpu.oil; OIL.gpu.n = acc.scene.length; },
    reset(){ acc.oil.length = 0; acc.frame.length = 0; acc.scene.length = 0; } }; })();
let frame = 0, tReal = 0;
// one frame: either the scene straight to the screen (filter off), or scene → depth + moving-object coordinates → display colour → paint → screen
function render(cam, dt, focus){
  frame++; tReal += dt; const cpu0 = performance.now(), c0 = renderer.info.render.calls;
  if (GT){ GT.poll(); GT.begin('scene'); }
  OIL.k += ((OIL.on ? 1 : 0) - OIL.k)*Math.min(1, dt*6);
  const oilK = (OIL.hold ? 0 : OIL.k) * OIL.strength;
  const fx = final();
  if (oilK < 0.002 && !(OIL.split > 0 && OIL.on) && fx){ targets(); renderer.setRenderTarget(sceneRT); renderer.render(scene, cam);
    gammaMat.uniforms.tCur.value = sceneRT.texture; renderer.setRenderTarget(outRT); renderer.render(gammaScene, postCam);
    finalPass(fx, outRT, cam); if (GT) GT.end('scene'); OIL.calls = renderer.info.render.calls - c0; OIL.cpuR = performance.now() - cpu0; return; }
  if (oilK < 0.002 && !(OIL.split > 0 && OIL.on)){ renderer.setRenderTarget(null); renderer.render(scene, cam); if (GT) GT.end('scene'); OIL.calls = renderer.info.render.calls - c0; OIL.cpuR = performance.now() - cpu0; return; }
  targets();
  const lateList = late().filter(o=>o && o.visible); lateList.forEach(o=>{ o.visible = false; });
  renderer.setRenderTarget(sceneRT); renderer.render(scene, cam);
  const objRT = OIL.obj && (OIL.stroke > 0.001 || OIL.line > 0.001) ? renderObj(cam) : null;
  gammaMat.uniforms.tCur.value = sceneRT.texture; renderer.setRenderTarget(outRT); renderer.render(gammaScene, postCam);
  const O = oilMat.uniforms, rt = OIL.rt;
  O.tOut.value = outRT.texture; O.uK.value = oilK; O.uRadius.value = OIL.radius; O.uSectors.value = OIL.sectors;
  O.uStroke.value = OIL.stroke; O.uCanvas.value = OIL.canvas; O.uSplit.value = OIL.split;
  O.tDepth.value = sceneRT.depthTexture; O.tObj.value = objRT ? objRT.texture : null; O.uObjOn.value = objRT ? 1 : 0; O.uWarp.value = 0;
  O.uPix.value = 2*Math.tan(THREE.MathUtils.degToRad(cam.fov)/2)/cam.zoom/rt.height;
  OIL.animT += (OIL.anim ? 1 : 0)*OIL.animSpeed*Math.min(dt, 0.1);
  O.uTime.value = tReal; O.uAnimT.value = OIL.animT; O.uAnimAmp.value = OIL.animAmp; O.uVary.value = OIL.vary;
  if (focus != null) OIL.focus = focus; const zk = OIL.zoneK = OIL.zoneAuto ? Math.max(1, OIL.focus/12) : 1;
  O.uFG.value = OIL.fg; O.uBG.value = OIL.bg; O.uSkyTex.value = OIL.sky; O.uColorS.value = OIL.color; O.uZN.value = OIL.zoneNear*zk; O.uZF.value = OIL.zoneFar*zk;
  { const c = scene.fog ? scene.fog.color : scene.background, o = {}; c.getRGB(o, THREE.SRGBColorSpace); O.uAtmos.value.set(o.r, o.g, o.b); }
  O.uLine.value = OIL.line; O.uLineNear.value = OIL.lineNear*zk; O.uLineFar.value = OIL.lineFar*zk;
  O.uNear.value = cam.near; O.uFar.value = cam.far; O.uDbg.value = OIL.dbg; O.uScale.value = OIL.scale; O.uLodFix.value = OIL.lodFix || 0;
  O.uInvProj.value.copy(cam.projectionMatrixInverse); O.uCamWorld.value.copy(cam.matrixWorld);
  if (GT){ GT.end('scene'); GT.begin('oil'); }
  renderer.setRenderTarget(rt); renderer.render(oilScene, postCam);
  let shown = rt;
  if (lateList.length){ const ac = renderer.autoClear; renderer.autoClear = false;              // never clear: the depth is the scene's
    copyMat.uniforms.tOut.value = rt.texture; renderer.setRenderTarget(LATE.rt); renderer.render(copyScene, postCam);
    lateList.forEach(o=>{ o.visible = true; lateScene.add(o); }); onLate(true);
    renderer.render(lateScene, cam); renderer.autoClear = ac;
    lateList.forEach(o=>scene.add(o)); onLate(false); shown = LATE.rt; }
  if (fx) finalPass(fx, shown, cam);
  else { copyMat.uniforms.tOut.value = shown.texture; renderer.setRenderTarget(null); renderer.render(copyScene, postCam); }
  if (GT) GT.end('oil');
  OIL.calls = renderer.info.render.calls - c0; OIL.cpuR = performance.now() - cpu0;
}
const fxQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMat), fxScene = new THREE.Scene(); fxQuad.frustumCulled = false; fxScene.add(fxQuad);
function finalPass(fx, shown, cam){ if (typeof fx === 'function'){ fx(shown.texture, outRT.texture, sceneRT.depthTexture, cam); return; } const U = fx.uniforms; if (U.tOut) U.tOut.value = shown.texture; if (U.tRaw) U.tRaw.value = outRT.texture; if (U.tDepth) U.tDepth.value = sceneRT.depthTexture;
  if (U.uNear) U.uNear.value = cam.near; if (U.uFar) U.uFar.value = cam.far; fxQuad.material = fx; renderer.setRenderTarget(null); renderer.render(fxScene, postCam); }
// A/B bench (oil-test.html): off / on / off / on, frame times, draw calls, GPU frame and oil pass
const bench = { list:null, calls:[], cpu:[], obj:[] };
function benchTick(ms){ if (bench.list){ bench.list.push(ms); bench.calls.push(OIL.calls); bench.cpu.push(OIL.cpuR); bench.obj.push(OBJ.calls); } }
async function oilBench(secs = 6){
  const wait = s => new Promise(r=>setTimeout(r, s*1000)), was = OIL.on;
  const avg = a => a.reduce((x,y)=>x+y,0)/Math.max(1,a.length), p95 = a => [...a].sort((x,y)=>x-y)[Math.floor(a.length*0.95)];
  const run = async on => { OIL.on = on; OIL.k = on ? 1 : 0; await wait(0.6); GT && GT.reset(); bench.list = []; bench.calls = []; bench.cpu = []; bench.obj = []; await wait(secs);
    const r = { fps:+(1000/avg(bench.list)).toFixed(1), frameMs:+avg(bench.list).toFixed(2), p95Ms:+p95(bench.list).toFixed(2), drawCalls:Math.round(avg(bench.calls)), cpuRenderMs:+avg(bench.cpu).toFixed(2), gpuFrameMs:GT ? +OIL.gpu.frame.toFixed(2) : null };
    if (on){ r.gpuOilPassMs = GT ? +OIL.gpu.oil.toFixed(2) : null; r.objPassCalls = Math.round(avg(bench.obj)); r.objPassCpuMs = +OBJ.cpu.toFixed(2); r.target = OIL.rt ? OIL.rt.width + '×' + OIL.rt.height : null; }
    bench.list = null; return r; };
  const off1 = await run(false), on1 = await run(true), off2 = await run(false), on2 = await run(true);
  OIL.on = was; return { off:[off1, off2], on:[on1, on2] };
}
// ---- the test panel from oil-test.html (Shift+O): the same sliders, switches, split compare, debug views and the A/B benchmark,
//      plus what the map adds: depth zones that follow the view distance, the render-size cap, and a reset to the defaults.
const OP = { el:null, t:0, ms:[], last:performance.now(), out:null, res:'', rows:[], draws:[] };
function panel(){
  if (OP.el){ OP.el.hidden = !OP.el.hidden; return; }
  const el = OP.el = document.createElement('div'); el.className = 'dbg-panel';
  el.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99;width:262px;max-height:calc(100vh - 24px);overflow:auto;padding:10px 12px;border-radius:10px;background:rgba(20,18,28,.86);color:#eee;font:11px/1.5 ui-monospace,Menlo,monospace;user-select:none';
  ['keydown','keyup'].forEach(t=>el.addEventListener(t, e=>e.stopPropagation()));            // typing in the panel never moves the person
  const row = (label, key, min, max, step, fmt) => { const w = document.createElement('label'); w.style.cssText = 'display:grid;grid-template-columns:74px 1fr 40px;gap:6px;align-items:center';
    const r = document.createElement('input'); Object.assign(r, { type:'range', min, max, step, value:OIL[key] }); r.style.width = '100%';
    const v = document.createElement('span'); v.style.textAlign = 'right'; const draw = () => { r.value = OIL[key]; v.textContent = fmt(OIL[key]); }; draw();
    r.oninput = () => { OIL[key] = +r.value; v.textContent = fmt(OIL[key]); }; w.append(label, r, v); el.append(w); OP.rows.push(draw); };
  const tog = (label, get, set) => { const b = document.createElement('button'); b.style.cssText = 'margin:2px 4px 2px 0;padding:2px 7px;border:1px solid #777;border-radius:5px;background:#2a2733;color:#eee;font:inherit;cursor:pointer';
    const draw = () => { b.textContent = label + ': ' + get(); }; b.onclick = () => { set(); draw(); }; draw(); el.append(b); OP.draws.push(draw); return draw; };
  const h = document.createElement('div'); h.textContent = '油画滤镜（oil-test 迁移）'; h.style.cssText = 'font-weight:bold;margin-bottom:4px'; el.append(h);
  row('强度', 'strength', 0, 1, 0.01, x=>x.toFixed(2)); row('笔触大小', 'radius', 2, 4, 0.1, x=>x.toFixed(1)+'px'); row('近景笔触', 'fg', 0, 2, 0.01, x=>x.toFixed(2));
  row('远景衰减', 'bg', 0, 1, 0.01, x=>x.toFixed(2)); row('天空纹理', 'sky', 0, 1, 0.01, x=>x.toFixed(2)); row('印象派色彩', 'color', 0, 1.5, 0.01, x=>x.toFixed(2));
  row('笔触总量', 'stroke', 0, 1.5, 0.01, x=>x.toFixed(2)); row('画布纹理', 'canvas', 0, 1, 0.01, x=>x.toFixed(2)); row('动画速度', 'animSpeed', 0, 3, 0.05, x=>x.toFixed(2));
  row('动画幅度', 'animAmp', 0, 1.5, 0.01, x=>x.toFixed(2)); row('材质差异', 'vary', 0, 1, 0.01, x=>x.toFixed(2)); row('彩色描边', 'line', 0, 1.5, 0.01, x=>x.toFixed(2));
  row('描边距离', 'lineFar', 4, 30, 0.5, x=>x.toFixed(0)+'m'); row('近景分区', 'zoneNear', 2, 30, 0.5, x=>x.toFixed(1)+'m'); row('远景分区', 'zoneFar', 10, 120, 1, x=>x.toFixed(0)+'m');
  row('渲染像素上限', 'maxPx', 0.3e6, 2.5e6, 0.05e6, x=>(x/1e6).toFixed(2)+'M');
  tog('滤镜', ()=>OIL.on ? '开' : '关', ()=>{ OIL.on = !OIL.on; });
  tog('扇区', ()=>OIL.sectors, ()=>{ OIL.sectors = OIL.sectors === 4 ? 8 : 4; GT && GT.reset(); });
  tog('笔触动画', ()=>OIL.anim ? '开' : '关', ()=>{ OIL.anim = !OIL.anim; });
  tog('笔触跟随移动物体', ()=>OIL.obj ? '开' : '关', ()=>{ OIL.obj = !OIL.obj; GT && GT.reset(); });
  tog('分区随视距', ()=>OIL.zoneAuto ? '开' : '关', ()=>{ OIL.zoneAuto = !OIL.zoneAuto; });
  tog('调试', ()=>({0:'关',1:'坐标',2:'笔触',3:'描边',5:'表面坐标',6:'移动物体',8:'材质分类'})[OIL.dbg] ?? OIL.dbg, ()=>{ OIL.dbg = ({0:1,1:2,2:3,3:5,5:6,6:8,8:0})[OIL.dbg] ?? 0; });
  tog('分屏对比', ()=>OIL.split > 0 ? '开' : '关', ()=>{ OIL.split = OIL.split > 0 ? -1 : 0.5; });
  const btn = (t, f) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'display:block;margin:4px 0;padding:2px 7px;border:1px solid #777;border-radius:5px;background:#3a3350;color:#eee;font:inherit;cursor:pointer'; b.onclick = f; el.append(b); };
  btn('跑 A/B 测试（约 26 秒）', async ()=>{ OP.res = '测试中…'; const r = await oilBench(); OP.res = 'A/B 结果\n关: ' + JSON.stringify(r.off[1]) + '\n开: ' + JSON.stringify(r.on[1]); });
  btn('恢复默认参数', ()=>{ const keep = { rt:OIL.rt, gpu:OIL.gpu }; Object.assign(OIL, JSON.parse(JSON.stringify(OIL_DEFAULTS)), keep); OP.rows.forEach(f=>f()); OP.draws.forEach(f=>f()); });
  const hint = document.createElement('div'); hint.style.cssText = 'opacity:.65;margin-top:4px'; hint.textContent = 'O 开关滤镜 · 按住 B 看原画面 · Shift+O 关闭面板 · 分屏时 Shift+拖动画面 移动分割线'; el.append(hint);
  OP.out = document.createElement('pre'); OP.out.style.cssText = 'margin:6px 0 0;white-space:pre-wrap;font:inherit'; el.append(OP.out);
  document.body.append(el);
}
function panelTick(){ const now = performance.now(), ms = now - OP.last; OP.last = now; OP.ms.push(ms); if (OP.ms.length > 120) OP.ms.shift();
  if (!OP.el || OP.el.hidden || now - OP.t < 400) return; OP.t = now;
  const avg = OP.ms.reduce((a,b)=>a+b, 0)/OP.ms.length, worst = Math.max(...OP.ms), g = OIL.gpu, tex = OIL.rt ? OIL.rt.width + '×' + OIL.rt.height : '-';
  OP.out.textContent = `FPS ${(1000/avg).toFixed(1)}  帧 ${avg.toFixed(1)}ms  最差 ${worst.toFixed(1)}ms\n` +
    (GT && g.ok ? `GPU 场景 ${g.scene.toFixed(2)}ms  油画 pass ${g.oil.toFixed(2)}ms（${g.n} 样本）` : 'GPU 计时器不可用：只看 FPS / 帧时间') +
    `\nCPU 渲染调用 ${OIL.cpuR.toFixed(2)}ms  draw calls ${OIL.calls}\n分辨率 ${tex}  ${OIL.sectors} 扇区 · 半径 ${OIL.radius.toFixed(1)}\n分区倍率 ×${OIL.zoneK.toFixed(1)}（视距 ${OIL.focus.toFixed(0)}m）\n移动物体坐标 pass: ${OBJ.n} 个网格 · ${OBJ.calls} 次绘制` + (OP.res ? '\n\n' + OP.res : '');
  OP.draws.forEach(f=>f()); }
addEventListener('pointermove', e=>{ if (OIL.split > 0 && e.shiftKey && e.buttons) OIL.split = Math.min(0.98, Math.max(0.02, e.clientX/innerWidth)); });
return { OIL, OBJ, GT, render, bench:oilBench, benchTick, oilMat, panel, panelTick, DEFAULTS:OIL_DEFAULTS, targets:() => ({ sceneRT, outRT, rt:OIL.rt }) };
}
