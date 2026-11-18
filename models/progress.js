/* =====================================================================
   PROGRESS (2026-11-18). Spec: docs/头像与成就系统-v5.md.
   What the viewer has seen, kept apart from the world: whose eyes they have looked through (1 s of real, rendered first-person
   view), which cameras (1 s), which phases of which stories (the phase really happening, its people / things on the picture,
   not hidden behind a wall, for 0.8 s; a result 1.5 s), and the 17:47 stare (not built in this version).
   - ROSTER: every identity and every ring entry of the spec, by stable id (K01.S1 …). Entries whose phases are not built stay dark.
   - PH: the phases that exist in the world now. Each check() reads LIFE's real state and returns the things that must be seen, or
     null when the phase is not happening. Only the phases happening now are looked at, once a frame, from the current eyes.
   - Saved in localStorage under a versioned key (test instances — any ?t= ?cam= ?view= … — under their own key). Writes that fail
     keep the progress in memory; nothing here can stop the world.
   ===================================================================== */
export function createProgress(X){
const { THREE, LIFE, cam } = X;
const L = LIFE, BY = (id) => L.BYID[id], EV = L.EVENTS, IT = L.ITEMS;

/* ---------- the roster (the spec's tables; English short names and titles are what the screen may show) ---------- */
const R = [];
const who = (id, name, entries) => R.push({ id, name, entries:entries.map(([title, ph], i)=>({ key:id + '.S' + (i + 1), title, ph })) });
// core people
who('K01', 'The Bench Sitter', [['Looking Up', ['E03.ringOut', 'E03.ringBack', 'E03.lookUp']], ['An Extra Portion', ['E13.twoPortions', 'E13.leftForK01']], ['A Little Color', ['F01.warmPhoto', 'F01.colorBack']]]);
who('K02', 'Grandma', [['For the Latecomer', ['E01.scatter', 'E01.latecomer']], ['Being Cared For', ['E06.arrive', 'E06.care']], ["The Neighbor's Plate", ['E17.orange', 'E17.biscuit']], ['Light as a Bird', ['F02.high', 'F02.ground']]]);
who('K03', 'The Father', [['The Unknocked Door', ['E05.photo', 'E05.hesitate', 'E05.drawingLeft']], ['The Other Glove', ['E02.pickRed', 'E02.putOn']], ['Every Road Leads Back', ['F03.doors', 'F03.realDoor']]]);
who('K04', 'The Daughter', [['A Drawing Left Behind', ['E05.offer', 'E05.drawingLeft']], ['The Other Glove', ['E02.pigeonCarry', 'E02.pickRed', 'E02.putOn']], ['A Sweeter World', ['F04.candy', 'F04.figure']]]);
who('K05', 'The Nurse', [['Someone to Care For', ['E06.arrive', 'E06.care', 'E06.leave']], ['After Caring', ['E10.sit', 'E10.rise']], ['A Constellation', ['F05.lines', 'F05.selfStar']]]);
who('K06', 'The Barista', [['The First Delivery', ['E04.handover', 'E04.received']], ['She Knew It Would Come', ['E08.catWaits', 'E08.bowlDown', 'E08.catEats']], ['Room for Disorder', ['F06.cupsAlign', 'F06.catTilts', 'F06.tiltStays']]]);
who('K07', 'The Observer', [['A Seat by the Window', ['ECUP.cupSet', 'ECUP.reading']], ['The Same Breeze', ['E12.drift', 'E12.drawn']], ['Life in Panels', ['F07.panels', 'F07.flip']]]);
who('K08', 'The Mender', [['Two in the Morning', ['E09.take', 'E09.mend', 'E09.back']], ['Back in Good Hands', ['E09.back', 'GLOVE.pick', 'GLOVE.give']], ['Clothes Without People', ['F08.clothes', 'F08.glove']]]);
who('K09', 'The Partner in Gray', [['Words Apart', ['E07.meet', 'E07.flowerBack', 'E07.part']], ['Almost Aligned', ['F09.reflection', 'F09.given']]]);
who('K10', 'The Partner in Red', [['Flowers on Hold', ['R14.hold', 'R14.collect']], ['The Ungiven Flowers', ['E07.flowerBack', 'E07.leftOnBench', 'E07.part']], ['Brought Home', ['E07.return', 'E07.vase']], ['What Would Not Be Said', ['F10.open', 'F10.fold']]]);
// people of the relationships
who('R01', 'The Bread Buyer', [['An Extra Portion', ['E13.twoPortions', 'E13.leftForK01']]]);
who('R02', 'The Baker', [['The First Delivery', ['E04.depart', 'E04.handover']]]);
who('R03', 'The Night Clerk', [['Still Warm', ['E11.left', 'E11.taken']]]);
who('R04', 'The Morning Clerk', [['Before the Night Shift', ['R04.meal', 'R04.handover']]]);
who('R05', 'The Commuter', [['On the Way Home', ['R05.leaveOffice', 'R05.storeMeal']]]);
who('R06', 'The Student', [['A Stitch in Blue', ['GLOVE.give', 'GLOVE.received']]]);
who('R07', 'The Runner', [['Caught by the Wind', ['R07.hatSeen', 'R07.hatReturned']]]);
who('R08', 'The Angler', [['A Small Share', ['R08.fish', 'R08.gull']]]);
who('R09', 'The Hooded Neighbor', [['The Evening Check', ['R09.bowl', 'R09.fill']]]);
who('R10', 'The Courier', [['Ringing Again', ['E14.check', 'E14.fixed', 'E14.ring']]]);
who('R11', 'Waiting by the Sea', [['A Place Beside Me', ['R11.dry', 'R23.drink']]]);
who('R12', 'The Stationer', [['A Little Chalk Left', ['R12.chalk']]]);
who('R13', 'The Doctor', [['Between Patients', ['R13.out', 'R13.sun']]]);
who('R14', 'The Florist', [['Flowers on Hold', ['R14.hold', 'R14.collect']]]);
who('R15', 'The Laundry Keeper', [['Lost and Returned', ['GLOVE.pick', 'GLOVE.carry', 'GLOVE.give']]]);
who('R16', 'The Clockmaker', [['Keeping Time', ['E15.received', 'E15.mended']]]);
who('R17', 'The Bartender', [['Before Closing', ['E16.water', 'E16.parcel']]]);
who('R18', 'The Teacher', [['The Last Student', ['R18.dismiss', 'R18.lastPickedUp']]]);
who('R19', 'The Neighbor', [["The Neighbor's Plate", ['E17.orange', 'E17.biscuit']]]);
who('R20', 'The Cleaner', [['Still Warm', ['E11.taken', 'E11.emptyCup']], ['Leave the Drawing', ['R20.drawingSeen', 'R20.around']]]);
who('R21', 'The Station Keeper', [['Time for Repair', ['E15.handed', 'E15.mended']]]);
who('R22', 'The Harbor Worker', [['Ready to Fish', ['R22.rodTaken', 'R22.rodBack']]]);
who('R23', 'Arriving by the Sea', [['A Place Beside Me', ['R23.arrive', 'R23.drink']]]);
who('R24', 'The Bicycle Repairer', [['Ringing Again', ['E14.check', 'E14.fixed', 'E14.ring']]]);
who('R25', 'The Town Clerk', [['Before You Go', ['R25.papers']]]);
who('R26', 'The Stallholder', [['Before Closing', ['E16.water', 'E16.parcel']]]);
// the town's people: one entry each
[['D01', 'The Archivist', 'A Midday Pause'], ['D02', 'The Desk Clerk', 'The Rightmost Step'], ['D03', 'The Surveyor', 'Along the Curb'], ['D04', 'The Map Assistant', 'A Map at Noon'],
 ['D05', 'The Accountant', 'Saved for Later', 'D13.noodles'], ['D06', 'The Receptionist', 'Making Room'], ['D07', 'The Teaching Assistant', 'After the Bell'], ['D08', 'The Caretaker', 'Lights Out'],
 ['D09', 'The Clinic Registrar', 'Under the Eaves'], ['D10', 'The Harbor Counter', 'Counted and Stacked'], ['D11', 'The Ticket Clerk', 'Around the Tree'], ['D12', 'The Produce Clerk', 'Before the Flowers Open'],
 ['D13', 'The Grocer', 'Saved for Later', 'D13.noodles'], ['D14', 'The Deli Cook', 'A Familiar Lunch', 'D14.lunch'], ['D15', 'The Sweet Shop Clerk', 'Within Reach'], ['D16', 'The West Bookseller', 'Across the Street', 'D16.books'],
 ['D17', 'The South Bookseller', 'Across the Street', 'D16.books'], ['D18', 'The Repairer', 'Collected at Dusk', 'D18.screws'], ['D19', 'The Bicycle Apprentice', 'A Dry Seat'], ['D20', 'The Stationery Assistant', 'Chalk for Tomorrow'],
 ['D21', 'The Tavern Clerk', 'An Evening Welcome'], ['D22', 'The Afternoon Clerk', 'Taking Over'], ['D23', 'The Hopscotch Student', 'Five Light Squares'], ['D24', 'The Leaf Collector', 'One Leaf'],
 ['D25', 'The Window Watcher', 'The Sweet Window'], ['D26', 'The Young Cyclist', 'Watching the Workshop'], ['D27', 'The Waiting Student', 'Someone Came', 'D46.pickup'], ['D28', 'The Chalk Artist', 'A Drawing on the Ground'],
 ['D29', 'The Puddle Dodger', 'A Dry Way Home'], ['D30', 'The Clock Watcher', 'A Glance at the Time'], ['D31', 'The Lunchbox Student', 'The Box Comes Back'], ['D32', 'The Step Counter', 'Step by Step'],
 ['D33', 'The Quiet Reader', 'A Book Returned'], ['D34', 'The Illustrator', 'Light on the Street'], ['D35', 'The Translator', 'Back on the Shelf'], ['D36', 'The Remote Worker', 'Just Around the Corner'],
 ['D37', 'The Seamster', 'Passed to the Mender'], ['D38', 'The Pottery Mender', 'A Cup Comes Back'], ['D39', 'The Musician', 'A Quiet Rehearsal'], ['D40', 'The Recipe Writer', 'A Familiar Lunch', 'D14.lunch'],
 ['D41', 'The Plant Keeper', 'Three Pots'], ['D42', 'The Model Maker', 'Collected at Dusk', 'D18.screws'], ['D43', 'The Photographer', 'Pillars at Noon'], ['D44', 'The Proofreader', 'An Evening Exchange'],
 ['D45', 'The Morning Shopper', 'The Morning Basket'], ['D46', 'The Caregiver', 'Someone Came', 'D46.pickup'], ['D47', 'The Umbrella Mender', 'Ready for Rain'], ['D48', 'The Ferry Watcher', 'One Passing Ferry'],
 ['D49', 'The Plant Neighbor', 'A Different Windowsill'], ['D50', 'The First Chess Friend', 'The Other Seat', 'D50.chess'], ['D51', 'The Second Chess Friend', 'The Other Seat', 'D50.chess'], ['D52', 'The Neighborhood Walker', 'A Little Rest'],
 ['D53', 'The Caring Partner', 'Side by Side', 'D53.sit'], ['D54', 'The Sun Seeker', 'Side by Side', 'D53.sit'], ['D55', 'The Home Baker', 'A Plate at the Door'], ['D56', 'The Warehouse Sorter', 'In Good Order'],
 ['D57', 'The Market Vendor', 'After the Market'], ['D58', 'The Evening Station Keeper', 'The Evening Shift'], ['D59', 'The Ferry Ticket Seller', 'A Short Relief', 'D59.relief'], ['D60', 'The Night Watch', 'The School at Night'],
 ['D61', 'The Lamp Keeper', 'Before the Street Goes Dark'], ['D62', 'The Harbor Night Keeper', 'A Short Relief', 'D59.relief'], ['D63', 'The Evening Courier', 'Supper on the Way'], ['D64', 'The Park Keeper', 'Leave the Drawing'],
 ['D65', 'The Building Cleaner', 'Before Everyone Leaves'], ['D66', 'The Tower Keeper', 'Upkeep']
].forEach(([id, name, title, shared])=>who(id, name, [[title, [shared || id + '.day']]]));
R.find(r=>r.id === 'D22').entries[0].ph = ['R04.handover', 'D22.day'];   // taking over: the hand-over, then R04 gone and D22 on
const HUMANS = R.map(r=>r.id);                     // the 102 human identities
// animals (their own group)
who('A01', 'Cat', [['Under the Bench', ['E03.ringOut', 'E03.ringBack']], ['Dinner at the Back Door', ['E08.catWaits', 'E08.bowlDown', 'E08.catEats']]]);
who('A02', 'Dog', [['A Walk Together', ['DOG.out', 'DOG.lie']]]);
who('A03', 'White Pigeon', [['For the Latecomer', ['E01.lateWait', 'E01.latecomer']], ['The Other Glove', ['E02.pigeonCarry', 'E02.pickRed']]]);
for (let i = 4; i <= 10; i++){ const id = 'A' + String(i).padStart(2, '0'); who(id, 'Pigeon', [['Back to the Roof', [id + '.ground', id + '.roof']]]); }
who('A11', 'Crow', [['Something Blue', ['A11.cap', 'A11.nest']]]);
who('A12', 'Duck', [['Leading the Way', ['A12.out', 'A12.stop']]]); who('A13', 'Duck', [['Catching Up', ['A13.lag', 'A13.join']]]); who('A14', 'Duck', [['The Same Stone', ['A14.stone', 'A14.leave']]]);
for (let i = 15; i <= 19; i++) who('A' + i, 'Gull', [['Following the Ferry', ['A' + i + '.follow', 'A' + i + '.home']]]);
const BYR = Object.fromEntries(R.map(r=>[r.id, r]));

/* ---------- phases that exist in the world now ---------- */
const NOW = () => L.nowMin(), DAYM = () => ((NOW() % 1440) + 1440) % 1440, HM = (s) => { const [h, m] = s.split(':'); return +h*60 + +m; };
const run = (id) => EV[id] && EV[id].state === 'run', today = (id) => EV[id] && EV[id].day === Math.floor(NOW()/1440);
const doneToday = (id) => EV[id] && EV[id].state === 'done' && today(id);
const near = (P, x, z, r) => P && Math.hypot(P.w.x - x, P.w.z - z) < r;
const placeIs = (it, name) => it && it.state !== 'heldBy' && it.place && it.place.name === name;
const p = (id) => ({ p:id }), a = (id) => ({ a:id }), i = (id) => ({ i:id });
const PH = {
  // E01: grandma throws one handful far out on purpose; the white pigeon waits apart, then eats from that one
  'E01.scatter':{ check:()=>run('E01') && EV.E01.t > 2.6 && EV.E01.t < 9.2 ? [p('K02')] : null },
  'E01.lateWait':{ check:()=>run('E01') && EV.E01.t > 1 && EV.E01.t < 6 ? [a('A03')] : null },
  'E01.latecomer':{ check:()=>{ const B = L.PIGEONS[0], cr = L.CRUMBS; if (!(run('E01') || (EV.E01.state === 'done' && NOW() - (EV.E01.ended || 0) < 40)) || !cr || cr.count < 9 || B.roost) return null;
    const m = new THREE.Matrix4(); cr.getMatrixAt(8, m); return Math.hypot(B.x - m.elements[12], B.z - m.elements[14]) < 0.45 ? [a('A03')] : null; } },
  // E04: the basket leaves the bakery, changes hands at the café, is set on her counter
  'E04.depart':{ check:()=>{ const P = BY('R02'); return P && IT.bread_delivery.holder === 'R02' && P.variant && P.variant.ev === 'E04' && P.stage === 'go' && P.w.moving && L.PL.BAKERY_COUNTER && near(P, L.PL.BAKERY_COUNTER.x, L.PL.BAKERY_COUNTER.z, 14) ? [p('R02')] : null; } },
  'E04.handover':{ check:()=>run('E04') && !EV.E04.sub && EV.E04.t > 0.4 && EV.E04.t < 2.8 ? [p('R02'), p('K06'), i('bread_delivery')] : null },
  'E04.received':{ check:()=>run('E04') && EV.E04.sub >= 1 ? [p('K06'), i('bread_delivery')] : null },
  // the cup to the window table, and him reading by it
  'ECUP.cupSet':{ check:()=>run('ECUP') && EV.ECUP.sub === 2 ? [p('K06'), i('cup_k07')] : null },
  'ECUP.reading':{ check:()=>{ const P = BY('K07'); return P && P.seated && placeIs(IT.cup_k07, 'window table') ? [p('K07'), i('cup_k07')] : null; }, dur:1.5 },
  // E05: she holds the drawing out to him; he lifts his hand to the door and lets it fall; the drawing stays in the slot
  'E05.offer':{ check:()=>run('E05') && EV.E05.t > 1.4 && EV.E05.t < 3.9 ? [p('K04'), p('K03'), i('drawing')] : null },
  'E05.hesitate':{ check:()=>run('E05') && EV.E05.t < 10.5 ? [p('K03')] : null },
  'E05.drawingLeft':{ check:()=>(run('E05') && EV.E05.t > 7.5) || doneToday('E05') ? (placeIs(IT.drawing, 'door slot') ? [i('drawing')] : null) : null, dur:1.5 },
  // E06: the nurse comes to grandma's, gives water, the blanket round her shoulders; then she goes
  'E06.arrive':{ check:()=>{ const N = BY('K05'); if (run('E06') && EV.E06.t < 2.1) return [p('K05'), p('K02')];
    return N && N.variant && N.variant.ev === 'E06' && N.stage === 'go' && !N.hidden && (N.room === 'H01' || near(N, L.PL.H01.x, L.PL.H01.z, 12)) ? [p('K05')] : null; } },
  'E06.care':{ check:()=>run('E06') && EV.E06.t > 2.1 && EV.E06.t < 7.8 ? [p('K05'), p('K02')] : null },
  'E06.leave':{ check:()=>{ const N = BY('K05'); return doneToday('E06') && NOW() - (EV.E06.ended || 0) < 60 && N && !N.hidden && N.w.moving && N.variant && N.variant.ev !== 'E06' ? [p('K05')] : null; } },
  // E08: the cat waits by the back door; the bowl goes down; the cat eats
  'E08.catWaits':{ check:()=>{ const d = DAYM(); return ((d >= HM('18:40') && d < HM('18:55') && !run('E08') && !doneToday('E08')) || (run('E08') && EV.E08.t < 1.4)) && Math.hypot(L.CAT.x + 22.3, L.CAT.z + 15.75) < 1.4 ? [a('A01')] : null; } },
  'E08.bowlDown':{ check:()=>run('E08') && EV.E08.t > 1.0 && EV.E08.t < 2.8 ? [p('K06'), i('cat_bowl')] : null },
  'E08.catEats':{ check:()=>run('E08') && EV.E08.catFed && L.CAT.eat ? [a('A01'), i('cat_bowl')] : null },
  // E09: from the lost box, mended, back with its white stitches; then the same glove to school and into the boy's hands
  'E09.take':{ check:()=>run('E09') && !EV.E09.sub ? [p('K08')] : null },
  'E09.mend':{ check:()=>run('E09') && EV.E09.sub === 1 ? [p('K08'), i('mitten_blue')] : null },
  'E09.back':{ check:()=>IT.mitten_blue.mended && placeIs(IT.mitten_blue, 'lost box') && (run('E09') || doneToday('E09')) ? [i('mitten_blue')] : null, dur:1.5 },
  'GLOVE.pick':{ check:()=>run('EGLOVE_PICK') ? [p('R15')] : null },
  'GLOVE.carry':{ check:()=>{ const P = BY('R15'); return P && IT.mitten_blue.holder === 'R15' && IT.mitten_blue.mended && L.PL.SCHOOL_GATE && near(P, L.PL.SCHOOL_GATE.x, L.PL.SCHOOL_GATE.z, 25) ? [p('R15')] : null; } },
  'GLOVE.give':{ check:()=>run('EGLOVE') && EV.EGLOVE.t > 0.4 && EV.EGLOVE.t < 2.8 ? [p('R15'), p('R06'), i('mitten_blue')] : null },
  'GLOVE.received':{ check:()=>IT.mitten_blue.holder === 'R06' && IT.mitten_blue.mended && (run('EGLOVE') || doneToday('EGLOVE')) ? [p('R06'), i('mitten_blue')] : null, dur:1.5 },
  // E10: the nurse at her own door in the small hours; then she gets up and goes in
  'E10.sit':{ check:()=>run('E10') || (BY('K05') && BY('K05').variant && BY('K05').variant.ev === 'E10' && BY('K05').seated && DAYM() >= HM('02:15') && DAYM() < HM('02:50')) ? [p('K05')] : null },
  'E10.rise':{ check:()=>{ const P = BY('K05'), d = DAYM(); return P && !P.hidden && !P.seated && d >= HM('02:50') && d < HM('03:30') && L.PL.H06_CHAIR && near(P, L.PL.H06_CHAIR.x, L.PL.H06_CHAIR.z, 6) ? [p('K05')] : null; } },
  // R13: out of the clinic at midday, onto the bench in the sun
  'R13.out':{ check:()=>{ const P = BY('R13'), d = DAYM(); return P && !P.hidden && P.w.moving && d >= HM('12:00') && d < HM('12:50') && L.PL.CLINIC_BENCH2 && near(P, L.PL.CLINIC_BENCH2.x, L.PL.CLINIC_BENCH2.z, 14) ? [p('R13')] : null; } },
  'R13.sun':{ check:()=>{ const P = BY('R13'); return P && P.seated && !L.RAIN.on && L.PL.CLINIC_BENCH2 && near(P, L.PL.CLINIC_BENCH2.x, L.PL.CLINIC_BENCH2.z, 1.5) ? [p('R13')] : null; }, dur:1.5 },
  // the dog: out with grandma, then lying down beside her
  'DOG.out':{ check:()=>{ const K = BY('K02'), H = L.PL.H01; return K && !K.hidden && !K.room && !L.DOG.room && K.w.moving && H && near(K, H.x, H.z, 16) ? [p('K02'), a('A02')] : null; } },
  'DOG.lie':{ check:()=>{ const K = BY('K02'); return K && K.seated && !K.room && !L.DOG.room && L.DOG.lie > 0.8 ? [a('A02')] : null; }, dur:1.5 },
  // batch 2: the folder at the office door; the reserved flowers; E07 at the avenue corner, the flowers left, taken back, put in the vase
  'R25.papers':{ check:()=>run('EFILE') && EV.EFILE.t > 0.6 && EV.EFILE.t < 3.4 ? [p('K10'), p('R25'), i('folder_k10')] : null },
  'R14.hold':{ check:()=>run('EFLOWER') && !EV.EFLOWER.sub && EV.EFLOWER.t > 0.6 ? [p('R14'), i('bouquet_k10')] : null },
  'R14.collect':{ check:()=>run('EFLOWER') && EV.EFLOWER.sub === 1 ? [p('R14'), p('K10'), i('bouquet_k10')] : null },
  'E07.meet':{ check:()=>{ const A = BY('K09'), B = BY('K10'); return ((run('E07') && EV.E07.t < 4.2) || (!doneToday('E07') && A && B && A.variant && B.variant && A.variant.ev === 'E07' && B.variant.ev === 'E07' && A.stage === 'do' && B.stage === 'do' && Math.hypot(A.w.x - B.w.x, A.w.z - B.w.z) < 4)) ? [p('K09'), p('K10')] : null; } },
  'E07.flowerBack':{ check:()=>run('E07') && EV.E07.t > 1.5 && EV.E07.t < 5.4 ? [p('K10'), p('K09'), i('bouquet_k10')] : null },
  'E07.leftOnBench':{ check:()=>((run('E07') && EV.E07.t > 12.6) || doneToday('E07')) && placeIs(IT.bouquet_k10, 'meeting bench') ? [i('bouquet_k10')] : null, dur:1.5 },
  'E07.part':{ check:()=>{ const A = BY('K09'), B = BY('K10'); return doneToday('E07') && NOW() - (EV.E07.ended || 0) < 45 && A && B && A.w.moving && B.w.moving ? [p('K09'), p('K10')] : null; } },
  'E07.return':{ check:()=>run('E07B') ? [p('K10'), i('bouquet_k10')] : null },
  'E07.vase':{ check:()=>(run('EVASE') || doneToday('EVASE')) && placeIs(IT.bouquet_k10, 'vase') ? [i('bouquet_k10')] : null, dur:1.5 },
  // batch 5: the core people's own stories
  'E03.ringOut':{ check:()=>run('E03') && EV.E03.sub === 1 ? [a('A01'), i('ring_k01')] : null },
  'E03.ringBack':{ check:()=>run('E03') && (EV.E03.sub === 2 || (EV.E03.sub === 3 && EV.E03.t - EV.E03.t0 < 1.5)) ? [p('K01')] : null },
  'E03.lookUp':{ check:()=>{ const P = BY('K01'); return P && P.seated && P.ringDay === Math.floor(NOW()/1440) && (P.act === 'look' || P.act === 'idle') && !run('E03') && !P.hold.phone ? [p('K01')] : null; }, dur:1.5 },
  'E13.twoPortions':{ check:()=>run('E13A') && EV.E13A.t > 0.4 && EV.E13A.t < 3 ? [p('R02'), p('R01'), i('bread2')] : null },
  'E13.leftForK01':{ check:()=>run('E13B') && EV.E13B.t > 0.4 && EV.E13B.t < 3 ? [p('R01'), p('K01'), i('bread2')] : null },
  'E17.orange':{ check:()=>run('E17') && !EV.E17.sub ? [p('R19'), p('K02'), i('oranges')] : null },
  'E17.biscuit':{ check:()=>run('E17') && EV.E17.sub === 1 ? [p('K02'), p('R19'), i('biscuits')] : null },
  'E02.pigeonCarry':{ check:()=>IT.mitten_red.holder === 'A03' ? [a('A03'), i('mitten_red')] : null },
  'E02.pickRed':{ check:()=>run('E02') && !EV.E02.sub && EV.E02.t > 1.2 ? [p('K04'), i('mitten_red')] : null },
  'E02.putOn':{ check:()=>run('E02') && EV.E02.sub === 2 ? [p('K03'), p('K04')] : null },
  'E12.drift':{ check:()=>run('E12') && EV.E12.wind ? [i('paper_sheet'), { any:[a('A01'), p('K07')] }] : null },
  'E12.drawn':{ check:()=>run('E12') && EV.E12.t > 9 ? [p('K07')] : null, dur:1.5 },
  'E05.photo':{ check:()=>run('E05') && EV.E05.t > 0.15 && EV.E05.t < 1.4 ? [p('K03'), i('photo_k03')] : null },
  // batch 6: the store's chain
  'E11.left':{ check:()=>run('E11A') ? [p('R03'), i('drink_r20')] : null },
  'E11.taken':{ check:()=>run('E11B') && EV.E11B.sub === 1 ? [p('R20'), i('drink_r20')] : null },
  'E11.emptyCup':{ check:()=>(run('E11C') || doneToday('E11C')) && placeIs(IT.drink_r20, 'empty cup by the cleaning cart') ? [i('drink_r20')] : null, dur:1.5 },
  'R04.meal':{ check:()=>(run('R04M') || doneToday('R04M')) && placeIs(IT.meal_r03, 'for the night shift') ? [p('R04'), i('meal_r03')] : null },
  'R04.handover':{ check:()=>run('R04H') && EV.R04H.t > 0.2 && EV.R04H.t < 3.4 ? [p('R04'), p('D22'), i('till_key')] : null },
  'D22.day':{ check:()=>{ const R = BY('R04'), Dd = BY('D22'); return doneToday('R04H') && NOW() - (EV.R04H.ended || 0) < 50 && R && R.w.moving && Dd && !Dd.hidden ? [p('R04'), p('D22')] : null; } },
  // the inner worlds: seen through their own eyes, open, for a whole round of what they show
  'F02.high':{ dream:'F02', check:(D)=>D.k > 0.95 && D.flyT > 9 && !D.roofed ? [] : null, dur:1.0 },
  'F02.ground':{ dream:'F02', check:(D)=>D.k > 0.9 && D.flyT > 3 && !L.DOG.room ? [a('A02')] : null },
  'F04.candy':{ dream:'F04', check:(D)=>D.k > 0.9 ? [] : null, dur:1.5 },
  'F04.figure':{ dream:'F04', check:(D)=>D.k > 0.9 ? [{ any:[p('K03'), a('A01')] }] : null },
  'F07.panels':{ dream:'F07', check:(D)=>D.k > 0.9 && D.comicN > 0 ? [] : null, dur:1.5 },
  'F07.flip':{ dream:'F07', check:(D)=>D.k > 0.9 && D.comicN > 1 && D.flip > 0 ? [] : null, dur:0.3 },
  // batch 5: the other six inner worlds
  'F01.warmPhoto':{ dream:'F01', check:(D)=>D.k > 0.9 && D.FX.f01.phone > 0.8 ? [] : null, dur:1.5 },
  'F01.colorBack':{ dream:'F01', check:(D)=>D.k > 0.9 && D.FX.f01.att > 0.7 && D.FX.f01.attId ? [{ p:D.FX.f01.attId }] : null, dur:1.0 },
  'F03.doors':{ dream:'F03', check:(D)=>D.k > 0.9 && D.FX.f03.seen > 0 ? [] : null, dur:1.0 },
  'F03.realDoor':{ dream:'F03', check:(D)=>D.k > 0.9 && D.FX.f03.realSeen ? [] : null, dur:1.5 },
  'F05.lines':{ dream:'F05', check:(D)=>D.k > 0.9 && D.FX.f05.litLines > 0 ? [] : null, dur:1.5 },
  'F05.selfStar':{ dream:'F05', check:(D)=>D.k > 0.9 && D.FX.f05.self > 0.9 ? [] : null, dur:1.0 },
  'F06.cupsAlign':{ dream:'F06', check:(D)=>D.k > 0.9 && D.FX.f06.aligned && D.FX.f06.wasTilted ? [] : null, dur:1.0 },
  'F06.catTilts':{ dream:'F06', check:(D)=>D.k > 0.9 && D.FX.f06.kicked > 5 ? [{ a:'A01' }] : null, dur:0.8 },
  'F06.tiltStays':{ dream:'F06', check:(D)=>D.k > 0.9 && D.FX.f06.stays && Math.abs(D.FX.f06.ang[D.FX.f06.tilt] || 0) > 0.2 ? [] : null, dur:1.5 },
  'F09.reflection':{ dream:'F09', check:(D)=>D.k > 0.9 && D.FX.f09.moving > 0.0015 ? [] : null, dur:1.5 },
  'F09.given':{ dream:'F09', check:(D)=>D.k > 0.9 && D.FX.f09.flowerShown ? [] : null, dur:1.0 },
  'F10.open':{ dream:'F10', check:(D)=>D.k > 0.9 && D.FX.f10.open > 0.6 && IT.bouquet_k10 && IT.bouquet_k10.holder === 'K10' ? [] : null, dur:1.0 },
  'F10.fold':{ dream:'F10', check:(D)=>D.k > 0.9 && D.FX.f10.fold && D.FX.f10.open < 0.2 ? [] : null, dur:1.0 },
  'F08.clothes':{ dream:'F08', check:(D)=>D.k > 0.9 ? [{ anyPerson:'K08' }] : null },
  'F08.glove':{ dream:'F08', check:(D)=>D.k > 0.9 && run('E09') && EV.E09.sub === 1 ? [i('mitten_blue')] : null },
};
// batch 5 animals
L.PIGEONS.forEach(B=>{ if (B.i === 0) return; const hh = () => { const d = ((L.nowMin() % 1440) + 1440) % 1440; return d; };
  PH[B.id + '.ground'] = { check:()=>!B.roost && (B.flyT || 0) <= 0 && hh() > 420 && hh() < 1160 ? [a(B.id)] : null };
  PH[B.id + '.roof'] = { check:()=>B.roost && (B.flyT || 0) > 0.55 ? [a(B.id)] : null }; });
PH['A11.cap'] = { check:()=>L.CROW.state === 'ground' ? [a('A11'), i('blue_cap')] : null };
PH['A11.nest'] = { check:()=>L.CROW.state === 'nest' && L.CROW.capDay === Math.floor(NOW()/1440) && placeIs(IT.blue_cap, 'crow nest') ? [a('A11'), i('blue_cap')] : null, dur:1.5 };
const DK = (n) => L.DUCKS[n];
PH['A12.out'] = { check:()=>DK(0).stage === 'lead' && DK(0).moving ? [a('A12')] : null };
PH['A12.stop'] = { check:()=>DK(0).stage === 'stop' ? [a('A12')] : null, dur:1.5 };
PH['A13.lag'] = { check:()=>DK(1).lag > 1.4 ? [a('A13'), a('A12')] : null };
PH['A13.join'] = { check:()=>DK(1).lag !== undefined && DK(1).lag < 0.3 && DK(0).stage === 'stop' ? [a('A13'), a('A12')] : null };
PH['A14.stone'] = { check:()=>DK(2).stage === 'stone' ? [a('A14')] : null, dur:1.5 };
PH['A14.leave'] = { check:()=>DK(2).stage === 'back' && DK(2).moving ? [a('A14')] : null };
L.GULLS.forEach(B=>{ PH[B.id + '.follow'] = { check:()=>B.mode === 'follow' && B.near < 12 ? [a(B.id)] : null };
  PH[B.id + '.home'] = { check:()=>B.mode === 'post' && (B.atPostT || 0) > 0.5 ? [a(B.id)] : null, dur:1.0 }; });
const BUILT = new Set(Object.keys(PH));

/* ---------- the record ---------- */
const TEST = ['t', 'test', 'view', 'cam', 'dream', 'hs', 'dev', 'day', 'wx', 'legacy', 'q'].some(k=>X.URLQ.has(k)) && X.URLQ.get('real') !== '1';
const KEY = TEST ? 'witp.progress.test.v1' : 'witp.progress.v1', TKEY = KEY + '.thumbs';
const blank = () => ({ v:1, visitedActors:{}, visitedCameras:{}, witnessedPhases:{}, completedEntries:{}, stareWitnessed:false, encoreUnlocked:false });
let S = blank(), THUMBS = {};
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 1) S = { ...blank(), ...s }; } catch {}
try { THUMBS = JSON.parse(localStorage.getItem(TKEY) || '{}') || {}; } catch {}
let dirty = false, saveT = 0; const listeners = [];
function save(){ dirty = false; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
function changed(){ dirty = true; listeners.forEach(f=>{ try { f(); } catch {} }); }
function complete(){ let any = false;
  for (const r of R) for (const e of r.entries){ if (S.completedEntries[e.key]) continue; if (e.ph.every(id=>S.witnessedPhases[id])){ S.completedEntries[e.key] = Date.now(); any = true; } }
  if (!S.encoreUnlocked && S.stareWitnessed && HUMANS.every(id=>S.visitedActors[id]) && HUMANS.every(id=>BYR[id].entries.every(e=>S.completedEntries[e.key]))){ S.encoreUnlocked = true; any = true; }
  return any; }

/* ---------- is it on the picture? ---------- */
const v3 = new THREE.Vector3(), q3 = new THREE.Vector3();
function entPos(e){ if (e.p){ const P = BY(e.p); if (!P || P.hidden || !X.shown(P.pp.g)) return null; const g = P.pp.g; return { pos:v3.set(g.position.x, g.position.y + 0.85*P.pp.S/0.82*(P.seated || P.driving ? 0.75 : 1), g.position.z).clone(), size:1.6*P.pp.S/0.82, body:true, room:P.room }; }
  if (e.a){ const A = L.ANIMALS.find(x=>x.id === e.a); if (!A || !X.shown(A.g)) return null; return { pos:v3.set(A.x, A.y + 0.2, A.z).clone(), size:e.a === 'A01' || e.a === 'A02' ? 0.5 : 0.3, room:A.room }; }
  if (e.i){ const it = IT[e.i]; if (!it || !it.m || !X.shown(it.m)) return null; it.m.getWorldPosition(v3); return { pos:v3.clone().setY(v3.y + 0.08), size:0.3 }; }
  return null; }
// self: the eyes' own body counts as there (its hidden head and body are not asked for); their held things still have to be in view
function onPicture(e){ const self = X.V.kind === 'person' ? X.V.id : X.V.kind === 'animal' ? X.V.id : null;
  if (e.any) return e.any.some(onPicture);
  if (e.anyPerson){ return L.PEOPLE.some(P=>P.id !== e.anyPerson && P.id !== self && onPicture({ p:P.id })); }
  if ((e.p && e.p === self) || (e.a && e.a === self)) return true;
  const o = entPos(e); if (!o) return false;
  const camIn = cam.position.y < -20, objIn = o.pos.y < -20; if (camIn !== objIn) return false;
  const dist = o.pos.distanceTo(cam.position); if (dist > 60) return false;
  q3.copy(o.pos).project(cam); if (q3.z > 1 || q3.z < -1 || Math.abs(q3.x) > 0.96 || Math.abs(q3.y) > 0.96) return false;
  const px = o.size*innerHeight/(2*dist*Math.tan(cam.fov*Math.PI/360)); if (px < (e.i || (e.a && e.a !== 'A01' && e.a !== 'A02') ? 10 : 14)) return false;   // readable on the screen, not a speck
  if (X.seen(o.pos)) return true; if (o.body){ const up = o.pos.clone(); up.y += 0.6; return X.seen(up); } return false; }

/* ---------- every frame: the eyes (1 s), the cameras (1 s), the phases happening now ---------- */
const acc = { actor:{}, cam:{}, ph:{} };
let lastT = performance.now();
function tick(){ const now = performance.now(), dt = Math.min(0.1, (now - lastT)/1000); lastT = now;
  if (!X.ok() || document.visibilityState !== 'visible') return;
  const V = X.V, D = X.dream();
  // eyes: only the real first-person view of someone (not their inner world), counted while it is really shown
  if ((V.kind === 'person' || V.kind === 'animal' || V.kind === 'thing') && !V.dream){ const k = V.id; if (!S.visitedActors[k]){ acc.actor[k] = (acc.actor[k] || 0) + dt; if (acc.actor[k] >= 1){ S.visitedActors[k] = Date.now(); complete(); changed(); } } }
  if (V.kind === 'cam'){ const k = V.id; if (!S.visitedCameras[k]){ acc.cam[k] = (acc.cam[k] || 0) + dt; if (acc.cam[k] >= 1){ S.visitedCameras[k] = Date.now(); thumb(k); changed(); } } else if (!THUMBS[k]) thumb(k); }
  // phases
  for (const id in PH){ if (S.witnessedPhases[id]) continue; const ph = PH[id];
    if (ph.dream){ if (V.dream !== ph.dream || V.kind !== 'person') { acc.ph[id] = 0; continue; } }
    else if (V.dream) continue;                                  // an inner world is not evidence of the real one
    let ents = null; try { ents = ph.dream ? ph.check(D) : ph.check(); } catch { ents = null; }
    if (!ents){ continue; }                                      // not happening (what was seen of it is kept)
    if (!ents.every(onPicture)) continue;
    acc.ph[id] = (acc.ph[id] || 0) + dt;
    if (acc.ph[id] >= (ph.dur || 0.8)){ S.witnessedPhases[id] = Date.now(); complete(); changed(); } }
  if (dirty && (saveT += dt) > 1){ saveT = 0; save(); } }
// a small still of a camera's picture, taken once when it is first seen (the just-drawn frame)
function thumb(id){ try { const c = document.createElement('canvas'); c.width = 128; c.height = 80; const src = X.canvas, w = src.width, h = src.height, r = Math.min(w/128, h/80);
  c.getContext('2d').drawImage(src, (w - 128*r)/2, (h - 80*r)/2, 128*r, 80*r, 0, 0, 128, 80); THUMBS[id] = c.toDataURL('image/jpeg', 0.7); try { localStorage.setItem(TKEY, JSON.stringify(THUMBS)); } catch {} } catch {} }
addEventListener('pagehide', ()=>{ if (dirty) save(); });

/* ---------- what the screen may ask ---------- */
const API = {
  ROSTER:R, BYR, HUMANS, BUILT, PH, TEST,
  visited:(id) => !!S.visitedActors[id],
  camSeen:(id) => !!S.visitedCameras[id],
  cams:() => Object.keys(S.visitedCameras).sort((x, y)=>+x.slice(1) - +y.slice(1)),
  thumb:(id) => THUMBS[id] || null,
  entries:(id) => (BYR[id] ? BYR[id].entries : []).map(e=>({ key:e.key, title:e.title, done:!!S.completedEntries[e.key] })),
  name:(id) => BYR[id] ? BYR[id].name : '',
  encore:() => S.encoreUnlocked,
  onChange:(f) => listeners.push(f),
  tick,
  // development only (never on the screen): what is built and what is not
  report:() => { const out = { built:[...BUILT], entries:[] }; for (const r of R) for (const e of r.entries){ const miss = e.ph.filter(id=>!BUILT.has(id)); out.entries.push({ key:e.key, title:e.title, buildable:!miss.length, missing:miss, done:!!S.completedEntries[e.key] }); } return out; },
  state:() => JSON.parse(JSON.stringify(S)), acc,
  why:(id) => { const ph = PH[id]; let ents = null; try { ents = ph.dream ? ph.check(X.dream()) : ph.check(); } catch (e){ return 'err ' + e.message; } if (!ents) return 'not happening'; return ents.map(e=>[JSON.stringify(e), onPicture(e), (()=>{ const o = entPos(e); return o ? [+o.pos.distanceTo(cam.position).toFixed(1), o.pos.clone().project(cam).toArray().map(v=>+v.toFixed(2)), X.seen(o.pos)] : null; })()]); },
  reset:() => { S = blank(); THUMBS = {}; try { localStorage.removeItem(KEY); localStorage.removeItem(TKEY); } catch {} changed(); },
};
return API;
}
