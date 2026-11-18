/* =====================================================================
   The town's sound — index.html's sound system (A, spatial(), the room beds), moved here unchanged in how it sounds:
   everything is synthesised with the Web Audio API from three noise buffers (brown, white, pink) and oscillators, through the same
   chain (world → high-pass → low-pass → master + a little reverb → compressor), with the same voices (sea swells, fountain, engines,
   tram, washer, lamp hum, vending machine, the room beds, footsteps, door bell / clunk / creak, birds, crickets, a far dog, drips,
   cups, the espresso machine, hiss and ding). What is new is only where they are: every position, room and trigger comes from the
   map (the page passes them in each frame), and no index coordinate or object is used.

   Not moved, because the map has nothing they belong to: the radio and its music, the headphones, the CCTV tape hiss and camera
   motor, the cat's purr and meow, pigeons, ducks, the paper in the wind. The soft pad under everything is kept (index's own chord).

   Use: const AU = createTownAudio(); AU.start() on the first click or key (browsers allow sound only then);
        AU.update(state) every frame; AU.step / bell / clunk / creak / hiss / ding / … at the moment something happens.
   ===================================================================== */
export function createTownAudio(){
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const PROG = [[349.23,440,523.25,659.25],[329.63,392,493.88,587.33],[293.66,349.23,440,523.25],[261.63,329.63,392,493.88]];
  const LIS = { pos:{ x:0, y:0, z:0 }, room:null, inv:null, doorAmt:0 };
  // index's spatial(): distance in the listener's frame, a pan from the side, the inverse-square fall-off, and a wall between rooms
  // (quieter and duller; less so when the door between is open)
  function spatial(p, radius, room){ const m = LIS.inv; if (!m) return { g:0, pan:0, lpf:20000 };
    const e = m.elements, x = e[0]*p.x + e[4]*p.y + e[8]*p.z + e[12], y = e[1]*p.x + e[5]*p.y + e[9]*p.z + e[13], z = e[2]*p.x + e[6]*p.y + e[10]*p.z + e[14];
    const dist = Math.hypot(x, y, z), pan = clamp(x/(Math.abs(z) + 0.6), -1, 1)*0.85, att = 1/(1 + (dist/radius)**2);
    let occ = 1, lpf = 20000; if ((room ?? null) !== LIS.room){ occ = LIS.doorAmt > 0.3 ? 0.55 : 0.28; lpf = LIS.doorAmt > 0.3 ? 1600 : 650; }
    return { g:att*occ, pan, lpf }; }
  const A = { ctx:null, on:true, vol:0.9, shots:0, maxShots:28, baseWet:0.12,
    start(){ if (this.ctx){ if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const C = this.ctx = new (window.AudioContext || window.webkitAudioContext)(), sr = C.sampleRate;
      const mk = (sec, fn) => { const b = C.createBuffer(1, Math.floor(sr*sec), sr); fn(b.getChannelData(0)); return b; };
      this.brown = mk(3, d=>{ let l=0; for (let i=0;i<d.length;i++){ const w=Math.random()*2-1; l=(l+0.02*w)/1.02; d[i]=l*3.5; } });
      this.white = mk(2, d=>{ for (let i=0;i<d.length;i++) d[i]=Math.random()*2-1; });
      this.pink  = mk(3, d=>{ let b0=0,b1=0,b2=0; for (let i=0;i<d.length;i++){ const w=Math.random()*2-1; b0=0.99765*b0+w*0.099046; b1=0.963*b1+w*0.2965164; b2=0.57*b2+w*1.0526913; d[i]=(b0+b1+b2+w*0.1848)*0.16; } });
      this.master = C.createGain(); this.master.gain.value = 0; this.master.gain.setTargetAtTime(this.on ? this.vol : 0, C.currentTime, 1.5);   // fades in: never a pop at the start
      const comp = C.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; this.master.connect(comp); comp.connect(C.destination);
      this.world = C.createGain(); this.hp = this.filt('highpass', 20); this.lp = this.filt('lowpass', 14000);
      this.wet = C.createGain(); this.wet.gain.value = 0.12; this.conv = C.createConvolver(); this.conv.buffer = this.ir(3.6);
      this.world.connect(this.hp); this.hp.connect(this.lp); this.lp.connect(this.master); this.lp.connect(this.wet); this.wet.connect(this.conv); this.conv.connect(this.master);
      const loop = (buf) => { const s = C.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, Math.random()*2); return s; };
      this.cityG = C.createGain(); this.cityG.gain.value = 0; loop(this.brown).connect(this.filt('lowpass',170)).connect(this.cityG).connect(this.world);
      this.windF = this.filt('bandpass', 400, 0.6); this.windG = C.createGain(); this.windG.gain.value = 0; loop(this.brown).connect(this.windF).connect(this.windG).connect(this.world);
      this.rainF = this.filt('highpass', 900); this.rainG = C.createGain(); this.rainG.gain.value = 0; loop(this.pink).connect(this.rainF).connect(this.rainG).connect(this.world);
      this.bakeryRoom = this.spat(); loop(this.pink).connect(this.filt('lowpass', 520)).connect(this.bakeryRoom.g);
      this.laundryRoom = this.spat(); loop(this.pink).connect(this.filt('lowpass', 380)).connect(this.laundryRoom.g);
      { const o = C.createOscillator(); o.frequency.value = 120; const g = C.createGain(); g.gain.value = 0.25; o.connect(g).connect(this.laundryRoom.g); o.start(); }
      this.fountain = this.spat(); loop(this.white).connect(this.filt('bandpass', 2200, 0.5)).connect(this.fountain.g);
      this.engines = [0,1,2,3,4,5,6].map((_,i)=>{ const s = this.spat(); loop(this.brown).connect(this.filt('lowpass', 320)).connect(s.g);
        const o = C.createOscillator(); o.type='sawtooth'; o.frequency.value = 48+i*5; const g=C.createGain(); g.gain.value=0.05; o.connect(this.filt('lowpass',180)).connect(g).connect(s.g); o.start(); s.osc = o; return s; });
      this.seaS = this.spat();
      { const am = C.createGain(); am.gain.value = 0.55; const lfo = C.createOscillator(); lfo.frequency.value = 0.11; const lg = C.createGain(); lg.gain.value = 0.45;
        lfo.connect(lg).connect(am.gain); lfo.start(); loop(this.brown).connect(this.filt('lowpass', 700)).connect(am).connect(this.seaS.g);
        loop(this.white).connect(this.filt('bandpass', 2400, 0.4)).connect(this.filt('lowpass', 3000)).connect(am); }
      this.tramS = this.spat();
      { loop(this.brown).connect(this.filt('lowpass', 260)).connect(this.tramS.g); const o = C.createOscillator(); o.type = 'triangle'; o.frequency.value = 72; const g2 = C.createGain(); g2.gain.value = 0.08; o.connect(g2).connect(this.tramS.g); o.start(); this.tramOsc = o; }
      this.washS = this.spat();
      { const am = C.createGain(); am.gain.value = 0.5; const lfo = C.createOscillator(); lfo.frequency.value = 1.3; const lg = C.createGain(); lg.gain.value = 0.45;
        lfo.connect(lg).connect(am.gain); lfo.start(); loop(this.brown).connect(this.filt('lowpass',260)).connect(am).connect(this.washS.g); }
      this.humS = this.spat();
      { const o1 = C.createOscillator(); o1.type='sawtooth'; o1.frequency.value=120; const o2 = C.createOscillator(); o2.frequency.value=240;
        const g2 = C.createGain(); g2.gain.value = 0.3; o1.connect(this.filt('lowpass',420)).connect(this.humS.g); o2.connect(g2).connect(this.humS.g); o1.start(); o2.start(); }
      { const bed = (fn) => { const g = C.createGain(); g.gain.value = 0; fn(g); g.connect(this.world); return g; };
        const swell = (src, rate, depth, dest) => { const am = C.createGain(); am.gain.value = 1 - depth; const l = C.createOscillator(); l.frequency.value = rate; const lg = C.createGain(); lg.gain.value = depth; l.connect(lg).connect(am.gain); l.start(); src.connect(am).connect(dest); };
        const hum = (type, f, v, dest, lp) => { const o = C.createOscillator(); o.type = type; o.frequency.value = f; const g = C.createGain(); g.gain.value = v; (lp ? o.connect(this.filt('lowpass', lp)) : o).connect(g).connect(dest); o.start(); };
        this.BED = {
          cafe:    bed(g=>{ swell(loop(this.pink).connect(this.filt('bandpass', 650, 0.7)), 0.23, 0.5, g); swell(loop(this.pink).connect(this.filt('bandpass', 1100, 1.2)), 0.37, 0.7, g); hum('sine', 100, 0.05, g); }),
          laundry: bed(g=>{ swell(loop(this.brown).connect(this.filt('lowpass', 220)), 0.8, 0.55, g); hum('sawtooth', 120, 0.008, g, 2600); loop(this.pink).connect(this.filt('bandpass', 1800, 0.6)).connect(this.filt('lowpass', 2400)).connect(g); }),
          store:   bed(g=>{ loop(this.brown).connect(this.filt('lowpass', 140)).connect(g); hum('sine', 58, 0.12, g); hum('sawtooth', 120, 0.006, g, 3000); const v = C.createGain(); v.gain.value = 0.5; loop(this.pink).connect(this.filt('highpass', 1400)).connect(this.filt('lowpass', 4500)).connect(v).connect(g); }),
          flat:    bed(g=>{ loop(this.brown).connect(this.filt('lowpass', 90)).connect(g); hum('sine', 50, 0.03, g); }),
          leaves:  bed(g=>{ swell(loop(this.pink).connect(this.filt('bandpass', 3400, 0.5)), 0.15, 0.75, g); swell(loop(this.white).connect(this.filt('bandpass', 5200, 0.8)), 0.09, 0.8, g); }),
          pond:    bed(g=>{ swell(loop(this.brown).connect(this.filt('bandpass', 420, 0.9)), 0.55, 0.85, g); swell(loop(this.white).connect(this.filt('bandpass', 1600, 2)), 0.9, 0.9, g); }),
          station: bed(g=>{ hum('sine', 50, 0.06, g); hum('triangle', 100, 0.02, g); loop(this.pink).connect(this.filt('bandpass', 700, 0.5)).connect(g); }),
          alley:   bed(g=>{ swell(loop(this.brown).connect(this.filt('lowpass', 180)), 0.07, 0.2, g); hum('square', 47, 0.05, g, 200); loop(this.pink).connect(this.filt('bandpass', 2600, 1.5)).connect(g); }),
          high:    bed(g=>{ swell(loop(this.brown).connect(this.filt('bandpass', 600, 0.4)), 0.11, 0.6, g); swell(loop(this.pink).connect(this.filt('highpass', 2500)), 0.07, 0.7, g); }),
          cabin:   bed(g=>{ loop(this.brown).connect(this.filt('lowpass', 110)).connect(g); loop(this.pink).connect(this.filt('bandpass', 380, 0.8)).connect(g); }),
        };
        this.vendS = this.spat(); loop(this.brown).connect(this.filt('lowpass', 120)).connect(this.vendS.g); hum('sine', 60, 0.12, this.vendS.g); loop(this.pink).connect(this.filt('bandpass', 900, 1)).connect(this.vendS.g);
        this.patterG = C.createGain(); this.patterG.gain.value = 1; this.patterG.connect(this.world); this.patT = 0; }
      // the soft pad under everything (index's chord, filtered, slowly breathing)
      this.padG = C.createGain(); this.padG.gain.value = 0; this.padG.gain.setTargetAtTime(0.03, C.currentTime, 3);
      const pf = this.filt('lowpass', 900); pf.connect(this.padG).connect(this.master);
      PROG[0].forEach((f,i)=>{ const o=C.createOscillator(); o.type=i%2?'triangle':'sine'; o.frequency.value=f/2; o.detune.value=(i-1.5)*5; const g=C.createGain(); g.gain.value=0.2; o.connect(g).connect(pf); o.start(); });
      const l = C.createOscillator(); l.frequency.value = 0.07; const lg = C.createGain(); lg.gain.value = 350; l.connect(lg).connect(pf.frequency); l.start(); },
    filt(type, f, Q=0.7){ const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = Q; return b; },
    ir(sec){ const C=this.ctx, n=Math.floor(C.sampleRate*sec), b=C.createBuffer(2,n,C.sampleRate); for (let ch=0; ch<2; ch++){ const d=b.getChannelData(ch); for (let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n, 2.6); } return b; },
    spat(){ const C=this.ctx, g=C.createGain(), f=C.createBiquadFilter(), p=C.createStereoPanner(); g.gain.value=0; f.type='lowpass'; f.frequency.value=20000; g.connect(f); f.connect(p); p.connect(this.world); return { g, f, p }; },
    place(sp, pos, vol, radius, room){ const s = spatial(pos, radius, room), t = this.ctx.currentTime; sp.g.gain.setTargetAtTime(vol*s.g, t, 0.08); sp.p.pan.setTargetAtTime(s.pan, t, 0.08); sp.f.frequency.setTargetAtTime(s.lpf, t, 0.08); },
    // one-off sounds: a short-lived voice of its own, never more than maxShots at once (the rest are skipped, not queued)
    shot(pos, vol, radius, fn, room){ if (!this.ctx || !this.on) return; const s = spatial(pos, radius, room); if (vol*s.g < 0.003 || this.shots >= this.maxShots) return;
      const sp = this.spat(), t = this.ctx.currentTime; sp.g.gain.value = vol*s.g; sp.p.pan.value = s.pan; sp.f.frequency.value = s.lpf; this.shots++;
      fn(sp.g, t); setTimeout(()=>{ sp.p.disconnect(); this.shots--; }, 4000); },
    noise(dest, t, dur, type, freq, Q, vol, attack=0.005, buf){ const C=this.ctx, s=C.createBufferSource(); s.buffer = buf || this.white; const f=this.filt(type, freq, Q); const g=C.createGain();
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+attack); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()*1.5); s.stop(t+dur+0.05); },
    tone(dest, t, f0, f1, dur, type, vol, attack=0.008){ const C=this.ctx, o=C.createOscillator(), g=C.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur);
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+attack); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t+dur+0.05); },
    step(pos, vol, kind, room){ this.shot(pos, vol, 2.2, (d,t)=>{ this.noise(d,t, kind==='wet'?0.12:0.07,'bandpass', kind==='wood'?1800:kind==='wet'?2600:850+Math.random()*300, 0.9, kind==='wet'?0.35:0.5); this.tone(d,t,95,45,0.07,'sine',0.35); if (kind==='wood') this.tone(d,t,520,380,0.04,'triangle',0.1); }, room); },
    bell(pos, room){ this.shot(pos, 0.55, 3, (d,t)=>[1760,2349,2637].forEach((f,i)=>this.tone(d,t+i*0.07,f,f*0.995,1.4,'sine',0.13)), room); },
    clunk(pos, room){ this.shot(pos, 0.5, 2.5, (d,t)=>{ this.tone(d,t,140,70,0.18,'sine',0.4); this.noise(d,t,0.08,'lowpass',900,0.7,0.3); }, room); },
    creak(pos, room){ this.shot(pos, 0.4, 2.5, (d,t)=>{ this.tone(d,t,180,240,0.35,'sawtooth',0.04); this.tone(d,t+0.3,120,60,0.15,'sine',0.25); }, room); },
    clink(pos, room){ this.shot(pos, 0.4, 2.5, (d,t)=>{ const f=2800+Math.random()*1400; this.tone(d,t,f,f,0.25,'sine',0.12); this.tone(d,t,f*1.5,f*1.5,0.15,'sine',0.05); }, room); },
    espresso(pos, room){ this.shot(pos, 0.5, 2.5, (d,t)=>{ this.noise(d,t,2.6,'bandpass',2600,1.4,0.16,0.35); this.noise(d,t+0.3,2.0,'lowpass',300,0.7,0.3,0.2,this.brown); }, room); },
    chirp(pos){ this.shot(pos, 0.45, 5, (d,t)=>{ const b=2400+Math.random()*900, n=2+Math.floor(Math.random()*3); for (let i=0;i<n;i++) this.tone(d,t+i*0.11,b,b+900+Math.random()*400,0.07,'sine',0.12); }); },
    cricket(pos){ this.shot(pos, 0.3, 6, (d,t)=>{ for (let i=0;i<6;i++) this.tone(d,t+i*0.045,4300,4300,0.03,'sine',0.06); }); },
    bark(pos){ this.shot(pos, 0.35, 12, (d,t)=>{ for (let i=0;i<2;i++){ this.tone(d,t+i*0.28,520,300,0.12,'sawtooth',0.08); this.noise(d,t+i*0.28,0.1,'bandpass',900,1,0.15); } }); },
    drip(pos){ this.shot(pos, 0.4, 3, (d,t)=>{ const f = 1400+Math.random()*900; this.tone(d,t,f,f*1.6,0.06,'sine',0.18); }); },
    ding(pos){ this.shot(pos, 0.5, 12, (d,t)=>{ for (let i=0;i<4;i++) this.tone(d,t+i*0.32,1480,1470,0.25,'square',0.03); }); },
    ping(pos, room){ this.shot(pos, 0.6, 2, (d,t)=>{ this.tone(d,t,1318,1318,0.3,'sine',0.25); this.tone(d,t+0.13,1760,1760,0.45,'sine',0.2); }, room); },
    hiss(pos, room){ this.shot(pos, 0.6, 4, (d,t)=>{ this.noise(d,t,0.9,'highpass',3000,0.7,0.3,0.05); }, room); },
    murmur(pos, room){ this.shot(pos, 0.5, 3, (d,t)=>{ for (let i=0;i<4;i++){ const f = 160+Math.random()*120; this.tone(d,t+i*0.18,f,f*(0.8+Math.random()*0.5),0.16,'sawtooth',0.03); } }, room); },
    chime(){ if (!this.ctx || !this.on) return; const t = this.ctx.currentTime; [1318.5,1975.5].forEach((f,i)=>this.tone(this.master,t+i*0.12,f,f,0.9,'sine',0.035)); },
    /* every frame. st: { cam (camera), lis {x,y,z} (where the ears are: the player's head, or the camera), room (the room the ears are in:
       a shop name, 'home', 'tram' or null), doorAmt, night, rain, wind, mist, open (shops open), covered (a roof right over the ears),
       dt, height, cars [{pos, v, room}], tram {pos, v, room}, sea {x, z}, fountain, bakery, laundry, lampHead, vend, beds {park, pond,
       station, alley} (0..1 nearness), cabin } */
    update(st){ if (!this.ctx) return; const t = this.ctx.currentTime, C = this.ctx;
      st.cam.updateMatrixWorld(); LIS.inv = st.cam.matrixWorldInverse; LIS.pos = st.lis; LIS.room = st.room; LIS.doorAmt = st.doorAmt;
      const inRoom = !!st.room, out = inRoom ? 0 : 1, alley = st.beds.alley > 0.5, day = 1 - st.night*0.6, high = out*clamp((st.height - 6)/20, 0, 1);
      this.wet.gain.setTargetAtTime(this.baseWet + (alley ? 0.35 : 0), t, 0.5);
      this.cityG.gain.setTargetAtTime((inRoom ? 0.06 : alley ? 0.15 : 0.3)*(1 - st.night*0.5)*(1 - st.mist*0.35)*(st.room === 'tram' ? 0.4 : 1), t, 0.4);
      this.windG.gain.setTargetAtTime((inRoom ? 0.2 : 1)*(0.035 + st.wind*0.3), t, 0.25); this.windF.frequency.setTargetAtTime(300 + st.wind*800, t, 0.3);
      // the rain itself: outside full; under a roof, in a room or in the tram only through the walls (one rain bed, never two)
      this.rainG.gain.setTargetAtTime(st.rain*(inRoom ? 0.08 : st.covered ? 0.2 : 0.32), t, 0.5); this.rainF.frequency.setTargetAtTime(inRoom ? 300 : 900, t, 0.5);
      // the places' own voices, placed where they are in the map
      this.place(this.bakeryRoom, st.bakery.pos, st.open ? 0.3 : 0.05, 4, st.bakery.room);
      this.place(this.laundryRoom, st.laundry.pos, 0.25, 4, st.laundry.room);
      this.place(this.washS, st.laundry.pos, st.laundry.spin*0.7, 3, st.laundry.room);
      this.place(this.fountain, st.fountain, 0.2, 7);
      this.place(this.seaS, st.sea, 0.55, 22);
      st.cars.forEach((c, i)=>{ const e = this.engines[i]; if (!e) return; this.place(e, c.pos, 0.8*Math.min(1, 0.3 + c.v/9), 6, null); e.osc.frequency.setTargetAtTime(44 + i*5 + c.v*3, t, 0.2); });
      for (let i = st.cars.length; i < this.engines.length; i++) this.engines[i].g.gain.setTargetAtTime(0, t, 0.2);
      this.place(this.tramS, st.tram.pos, 0.35 + 0.55*Math.min(1, st.tram.v/8), 14, st.room === 'tram' ? 'tram' : null); this.tramOsc.frequency.setTargetAtTime(60 + st.tram.v*3, t, 0.3);
      this.place(this.humS, st.lampHead, 0.03*st.night, 0.9);
      this.place(this.vendS, st.vend || { x:0, y:-99, z:0 }, 0.22, 1.4);
      const B = { cafe:st.room === 'bakery' || st.room === 'cafe' ? 0.11*(st.open ? 1 : 0.15) : 0, laundry:st.room === 'laundry' ? 0.16 : 0, store:st.room === 'store' ? 0.14 : 0,
        flat:st.room === 'home' || st.room === 'b3' || st.room === 'flowers' ? 0.18 : 0,
        leaves:out*st.beds.park*(0.07 + st.wind*0.12)*(1 - high), pond:out*st.beds.pond*0.16, station:out*st.beds.station*0.09*day, alley:out*st.beds.alley*0.12,
        high:high*(0.05 + st.wind*0.1), cabin:st.room === 'tram' ? 0.12*(0.4 + 0.6*Math.min(1, st.tram.v/8)) : 0 };
      for (const k in this.BED) this.BED[k].gain.setTargetAtTime(B[k], t, 0.7);
      // rain on what is right above you: a roof ticks, in a room or the tram it taps on the glass
      const rate = st.rain*(st.covered && !inRoom ? 34 : inRoom ? 7 : 0); this.patT += rate*st.dt;
      while (this.patT > 1){ this.patT -= 1; const tt = t + Math.random()*0.05;
        if (!inRoom) this.noise(this.patterG, tt, 0.025, 'bandpass', 2600 + Math.random()*2600, 3, 0.05 + Math.random()*0.05);
        else { const f = 2400 + Math.random()*1800; this.tone(this.patterG, tt, f, f*0.9, 0.03, 'sine', 0.02 + Math.random()*0.02); } }
      // things now and then (as in index): birds by day near trees, crickets at night, a far dog, drips in the alley when wet, cups and the espresso machine in the café
      const L = st.lis;
      if (out && st.night < 0.5 && st.rain < 0.3 && st.tree && Math.random() < st.dt*0.25) this.chirp({ x:st.tree.x + (Math.random()-0.5)*3, y:3.2, z:st.tree.z + (Math.random()-0.5)*3 });
      if (out && st.night > 0.6 && st.rain < 0.3 && Math.random() < st.dt*0.8) this.cricket({ x:L.x + (Math.random()-0.5)*16, y:0.2, z:L.z + (Math.random()-0.5)*16 });
      if (st.night > 0.7 && Math.random() < st.dt*0.03) this.bark({ x:L.x + (Math.random() < 0.5 ? -20 : 20), y:1, z:L.z - 10 });
      if (alley && Math.random() < st.dt*(0.6 + st.wetGround*1.5)) this.drip({ x:L.x + (Math.random()-0.5)*6, y:2, z:L.z + (Math.random()-0.5)*2 });
      if (st.open && Math.random() < st.dt*0.3) this.clink({ x:st.cafe.pos.x + (Math.random()-0.5)*3, y:1.1, z:st.cafe.pos.z + (Math.random()-0.5)*2 }, st.cafe.room);
      this.espT = (this.espT ?? 6) - st.dt; if (this.espT < 0){ this.espT = 11 + Math.random()*6; if (st.open) this.espresso(st.cafe.pos, st.cafe.room); }
      this.master.gain.setTargetAtTime(this.on ? this.vol : 0, t, 0.15); },
    setVolume(v){ this.vol = clamp(v, 0, 1.5); if (this.ctx) this.master.gain.setTargetAtTime(this.on ? this.vol : 0, this.ctx.currentTime, 0.1); },
    toggle(){ this.on = !this.on; if (this.ctx) this.master.gain.setTargetAtTime(this.on ? this.vol : 0, this.ctx.currentTime, 0.1); return this.on; },
    stats(){ return { running:!!this.ctx && this.ctx.state, on:this.on, vol:this.vol, shots:this.shots }; } };
  return A;
}
