/* =====================================================================
   THE REST OF THE TOWN (2026-11-18, batch 3–4): R01–R26 not yet in life.js, D01–D66 (D22 already there).
   Spec: docs/人物作息与关系网-v5.md §4 templates, §6–7 rows, §9 events; docs/头像与成就系统-v5.md §4–5 entries.
   Plain data; life.js builds the places, the people, the days, the items and the events from it.
   Times are arrival anchors (world HH:MM); life.js works the departures back from the real paths (walking ≈ 26 m a world hour).
   Where the spec's anchor cannot be walked, the anchor is moved and the reason is written next to it.
   ===================================================================== */

// ---------- places: [name, x, z, [face x, face z], options] — snapped to free, reachable ground at load ----------
// shops along the arcade: 's' (north row, opens to +z, front edge z −4.3) and 'n' (south row, opens to −z, front edge z 4.3)
const SHOP_S = { BOOKS_W:-41.6, CLOCKSHOP:31.2, GREENS:52.1, REPAIR:58.8 }, SHOP_N = { GROCER:-27.9, BOOKS_S:-21.6, DELI:21.1, BIKE_REPAIR:33.6, SWEETS:46.8, STATIONER:59.0 };
export const PLACES = [];
for (const [k, x] of Object.entries(SHOP_S)){ PLACES.push([k, x, -3.7, [0, -1], { shell:true }], [k + '_STAND', x + 1.3, -2.6, [0, 1]], [k + '_C', x + 1.3, -1.4, [0, -1]]); }
for (const [k, x] of Object.entries(SHOP_N)){ PLACES.push([k, x, 3.7, [0, 1], { shell:true }], [k + '_STAND', x + 1.3, 2.6, [0, -1]], [k + '_C', x + 1.3, 1.4, [0, 1]]); }
PLACES.push(
  ['CLOCKSHOP_UP', 31.2, -3.7, [0, -1], { shell:true }], ['BAR_UP', -51.5, 44.6, [0, -1], { shell:true }], ['SKEWERS_UP', -50.6, 48.6, [1, 0], { shell:true }], ['TAVERN_IN', -52.2, 48.0, [-1, 0], { shell:true }],
  ['BAR_STAND', -51.0, 45.6, [0, -1]], ['TAVERN_STAND', -51.6, 46.9, [0, 1]], ['SKEWERS_STAND', -51.3, 49.8, [1, 0]], ['SKEWERS_C', -52.4, 49.8, [1, 0]], ['ALLEY_MOUTH', -51.4, 40.0, [0, 1]],
  ['STATION_DESK', -53.6, 0.2, [1, 0]], ['STATION_DESK2', -53.6, 1.6, [1, 0]], ['STATION_TREE', -46.2, 2.0, [0, 1]], ['STATION_CLOCK', -53.6, -1.4, [1, 0]],
  ['TOWER_BASE', -51.5, -43.6, [0, -1]], ['TOWER_DOOR', -46.6, -48.6, [-1, 0]],
  ['PARK_PATH', -20.0, 41.0, [0, 1]], ['PARK_SWING', -8.0, 54.0, [0, 1]], ['PARK_GATE', -6.0, 39.6, [0, 1]], ['POND_EDGE', -24.0, 40.6, [0, 1]],
  ['FISH_SPOT', 76.0, -30.0, [1, 0]], ['FISH_HELP', 75.2, -30.6, [0.6, 0.8]], ['HARB_S', 71.5, 6.0, [1, 0]], ['FERRY_BOOTH', 75.4, -22.7, [1, 0]], ['FERRY_BOOTH2', 75.4, -21.4, [1, 0]], ['WHARF_LOOK', 76.0, -18.0, [1, 0]],
  ['SHED_SHADE', 69.6, -40.4, [1, 0]], ['CRATES_B', 72.4, -44.2, [-1, 0]], ['MARKET_LUNCH', 69.8, -21.0, [1, 0]],
  ['NORTH_CURB', 0.0, -32.3, [0, -1]], ['NORTH_CURB2', 20.0, -32.3, [0, -1]], ['RES_NW', -38.0, -31.8, [1, 0]], ['RES_NW2', -37.0, -31.8, [-1, 0]], ['RES_S', -20.0, 29.2, [0, 1]], ['RES_SE', 40.0, 29.2, [0, 1]],
  ['PLAZA_W', -10.0, 3.0, [1, 0]], ['PLAZA_E', 10.0, -3.0, [-1, 0]], ['PLAZA_NE', 9.0, -10.0, [0, 1]], ['PLAZA_CARTSIDE', 5.6, 11.4, [1, 0]],
  ['OFFICE_COL', 22.4, -12.6, [0, 1]], ['ARC_E', 14.0, 0.2, [1, 0]], ['ARC_MID_N', -33.0, -1.5, [0, 1]], ['ARC_MID_S', -33.0, 0.3, [0, -1]], ['ARC_PILLARS', 2.0, -1.8, [0, 1]], ['CAFE_OUT', -16.4, -0.6, [0, -1]],
  ['CLINIC_EAVES', 11.3, -61.5, [0, -1]], ['SCHOOL_STEPS', 49.6, -36.4, [0, 1]], ['SCHOOL_WAIT', 46.2, -35.6, [0, -1]], ['SCHOOL_LANE', 44.0, -34.6, [-1, 0]], ['SCHOOL_PAVE', 42.0, -33.2, [0, -1]],
  ['STORE_COUNTER2', 9.0, 45.7, [-1, 0]], ['STORE_OUT', 6.4, 44.0, [1, 0]], ['APT_N_DOOR', 53.8, 46.0, [0, 1]], ['APT_S_DOOR', 51.0, 51.0, [0, -1]],
  ['SEA_SEAT_A', 75.0, 19.6, [1, 0], { seat:true, top:0.47 }], ['SEA_SEAT_B', 75.0, 20.4, [1, 0], { seat:true, top:0.47 }], ['SEA_APPROACH', 73.4, 20.0, [1, 0]],
  ['PARK_SEAT_A', -14.4, 50.0, [0, 1], { seat:true, top:0.47 }], ['PARK_SEAT_B', -13.6, 50.0, [0, 1], { seat:true, top:0.47 }],
  ['H21_SEAT_A', 49.3, 28.7, [0, 1], { seat:true, top:0.44 }], ['H21_SEAT_B', 50.9, 28.7, [0, 1], { seat:true, top:0.44 }],
  ['FISH_SEAT', 76.0, -30.0, [1, 0], { seat:true, top:0.4 }],
);
// door steps of houses (in front of the door, on the street side)
export const STEPS = { H01:[-55.0, -28.4], H03:[-29.1, -28.4], H05:[42.9, -28.4], H17:[8.2, 28.4], H19:[23.6, 28.4], H20:[28.0, 28.4], H21:[50.1, 28.6], H08:[14.0, -36.4] };
// walking loops
export const LOOPS = { seaRun:[[73.4, -4], [73.6, 20], [73.4, 44], [73.6, 20], [73.4, -4]], cleanPark:[[-20, 41], [-8, 40], [-6, 50], [-20, 50], [-20, 41]], cleanAvenue:[[-20, 37], [0, 37.2], [20, 37], [0, 37.2]],
  cleanPlaza:[[-8, 9], [8, 9], [12, 0], [8, -9], [-8, -9], [-12, 0], [-8, 9]], resWalk:[[25.6, -33.4], [10, -33.4], [0, -32.6], [10, -33.4], [25.6, -33.4]], parkCheck:[[-6, 39.6], [-8, 54], [-20, 41], [-6, 39.6]],
  nightSchool:[[46.2, -35.6], [49.6, -36.4], [42, -33.2], [46.2, -35.6]], harbourNight:[[71.5, 6], [72, -5], [71.5, 6]], lamps:[[-9.2, -8.6], [9.2, -8.6], [9.2, 8.6], [-9.2, 8.6], [-9.2, -8.6]], courier:[[21.1, 1.6], [40, 30], [53.8, 45.6], [40, 30], [21.1, 1.6]] };
// props: benches for the park and the sea, two chairs at H21, three pots at H19, a cleaning cart, the bicycle at the repair shop, a store shelf, the clock window
export const PROPS = [
  ['bench', -14.0, 50.0, 0], ['bench', 75.0, 20.0, -Math.PI/2], ['chair', 49.3, 28.7, Math.PI/2], ['chair', 50.9, 28.7, Math.PI/2], ['stool', 76.0, -30.0, 0],
  ['pot', 23.0, 28.6], ['pot', 23.6, 28.8], ['pot', 24.2, 28.6], ['pot', 27.6, 28.6], ['cart', 6.6, 11.6, 0], ['bike', 35.0, 2.0, 0], ['shelf', 10.3, 45.0, 0], ['shelf', 59.9, 2.0, 0],
];
// sockets things are put on: [name, x, y over ground, z]
export const SOCKETS = { STORE_SHELF:[10.3, 0.92, 45.0], STATIONER_SHELF:[59.9, 0.92, 2.0], CLOCK_WINDOW:[30.2, 1.0, -4.0], CART_TOP:[6.6, 0.95, 11.6], H01_STEP_TOP:[-55.0, 0.02, -28.6], H03_STEP_TOP:[-29.1, 0.02, -28.6],
  FLOWERS_RACK:[-27.2, 0.8, -2.95], CAT_DISH:[-21.8, 0.01, -15.2], H19_POT:[24.2, 0.0, 28.6], H20_POT:[27.6, 0.0, 28.6], DELI_SHELF:[22.4, 0.95, 2.6], REPAIR_SHELF:[60.1, 0.95, -2.6] };

// ---------- the people ----------
// look: hair (short/long/bun/pony/pigtails/bald/beanie/cap), h, w, s (children 0.68–0.72), skin 0–5, coat/sleeve/pants, piece {kind, color} (the spec's recognisable piece)
// t(…) helpers write a day: h home, sh shell, wk work (visible at a post), st stand, si sit, ev event part, wa wander loop
const h = (t, o = 'home', x = {}) => [t, { act:'home', outfit:o, ...x }];
const sh = (t, at, o, x = {}) => [t, { act:'shell', at, ...(o ? { outfit:o } : {}), ...x }];
const wk = (t, at, anim = 'arrange', o, x = {}) => [t, { act:'work', at, anim, ...(o ? { outfit:o } : {}), ...x }];
const st = (t, at, anim = 'look', x = {}) => [t, { act:'stand', at, anim, ...x }];
const si = (t, at, x = {}) => [t, { act:'sit', at, ...x }];
const ev = (t, id, role, at, x = {}) => [t, { act:'event', ev:id, role, at, ...x }];
const wa = (t, loop, laps = 1, x = {}) => [t, { act:'wander', loop, laps, ...x }];
const LOOK = (hair, h, w, skin, coat, pants, piece, x = {}) => ({ hair, h, w, skin, coat, pants, piece, ...x });
export const PEOPLE = [
  // ---- relationship people ----
  { id:'R01', name:'戴帽子的买面包居民', home:'H03', look:LOOK('beanie', 1.0, 1.0, 1, '#7d5aa0', '#4a4a58', { kind:'scarf', color:'#f4c83a' }, { hatC:'#3f8f8a' }),
    day:[h('00:00'), h('09:00', 'casual'), ev('12:00', 'E13A', 'taker', 'BAKERY_C'), ev('13:30', 'E13B', 'giver', 'PLAZA_NE'), sh('15:30', 'OFFICE'), h('17:30')] },
  { id:'R03', name:'便利店夜班店员', home:'APT_S', look:LOOK('bun', 0.98, 0.98, 1, '#f4a8c8', '#4a4a58', { kind:'vest', color:'#f4a8c8' }),
    day:[wk('00:00', 'STORE_COUNTER', 'look', 'work'), ev('05:30', 'E11A', 'p', 'STORE_COUNTER2'), wk('05:45', 'STORE_COUNTER', 'look'), h('07:00'), wk('21:00', 'STORE_COUNTER', 'look', 'work')] },
  { id:'R04', name:'便利店白班店员', home:'APT_S', look:LOOK('bun', 1.0, 1.02, 2, '#a8c8e8', '#4a4a58', { kind:'vest', color:'#8ab8e0' }, { sleeve:'#f49a4a' }),
    day:[h('00:00'), wk('06:10', 'STORE_COUNTER', 'look', 'work'), ev('13:20', 'R04M', 'p', 'STORE_COUNTER2'), ev('14:00', 'R04H', 'giver', 'STORE_COUNTER2'), h('15:30')] },
  { id:'R07', name:'海岸慢跑者', home:'APT_N', speed:1.6, look:LOOK('pony', 1.0, 0.92, 0, '#d83a4a', '#3a3a48', null, { shoes:'#ffffff' }),
    day:[h('00:00'), wa('06:40', 'seaRun', 1, { outfit:'casual' }), ev('07:40', 'R07HAT', 'runner', 'FISH_HELP'), wa('08:00', 'seaRun', 1), h('09:30'), wa('17:00', 'seaRun', 1, { rain:{ act:'stand', at:'APT_N_DOOR', anim:'look' } }), h('18:40')] },
  { id:'R08', name:'老钓鱼者', home:'H11', speed:0.95, look:LOOK('cap', 0.96, 1.0, 1, '#6a7a6a', '#4a4a50', { kind:'scarf', color:'#c83a3a' }, { beard:true, hunch:0.25, hatC:'#4a6a4a', capC:'#4a6a4a' }),
    // spec 09–12; moved to 07:00–12:00 so the runner (06:40–08:00) can pass him when his hat goes
    day:[h('00:00'), si('07:00', 'FISH_SEAT', { anim:'idle' }), ev('07:40', 'R07HAT', 'angler', 'FISH_SEAT'), ev('08:30', 'R08FISH', 'p', 'FISH_SEAT'), si('09:00', 'FISH_SEAT', { anim:'idle' }), ev('10:30', 'R22ROD', 'owner', 'FISH_SEAT'), si('11:10', 'FISH_SEAT', { anim:'idle' }), h('14:00')] },
  { id:'R09', name:'帽衫居民', home:'H08', look:LOOK('beanie', 1.02, 1.0, 4, '#1e1c24', '#2a2a30', null, { hatC:'#1e1c24', sole:'#d8d8dc' }),
    day:[h('00:00'), ev('21:40', 'R09BOWL', 'p', 'CAT_BOWL_STAND', { outfit:'casual' }), h('23:00')] },
  { id:'R10', name:'骑车送货员', home:'APT_N', speed:1.7, look:LOOK('cap', 1.0, 1.0, 3, '#3a3a48', '#2a2a30', { kind:'pack', color:'#d83a4a' }, { capC:'#d83a4a' }),
    day:[h('00:00'), wk('08:00', 'HARB_S', 'carryBox', 'work'), st('09:10', 'DELI_C', 'hold'), st('10:30', 'GROCER_C', 'hold'), st('12:00', 'CLINIC_EAVES', 'hold'), ev('14:30', 'E14', 'rider', 'BIKE_REPAIR_C'), st('16:00', 'SCHOOL_WAIT', 'hold'), wk('18:00', 'HARB_S', 'carryBox'), h('20:00')] },
  { id:'R11', name:'看海的人A', home:'H22', look:LOOK('long', 0.98, 0.94, 0, '#f4c8d8', '#8a7a88', { kind:'scarf', color:'#c8c8d0' }),
    day:[h('00:00'), h('09:00', 'casual'), ev('17:30', 'ESEA', 'waiter', 'SEA_SEAT_A'), h('19:30')] },
  { id:'R12', name:'文具店主', home:'H10', look:LOOK('short', 1.0, 0.98, 1, '#e8e4ec', '#4a4a58', { kind:'bag', color:'#3a8a9a' }, { glasses:true, sleeve:'#3a8a9a' }),
    day:[h('00:00'), wk('09:00', 'STATIONER_STAND', 'arrange', 'work'), ev('14:00', 'R12CHALK', 'p', 'STATIONER_STAND'), wk('14:20', 'STATIONER_STAND', 'arrange'), h('19:30')] },
  { id:'R16', name:'钟表店主', home:'CLOCKSHOP_UP', look:LOOK('short', 0.98, 0.96, 0, '#d8d0c8', '#4a4048', null, { glasses:true, sleeve:'#5a4a40' }),
    day:[sh('00:00', 'CLOCKSHOP_UP', 'home'), wk('09:00', 'CLOCKSHOP_STAND', 'arrange', 'work'), ev('10:30', 'E15A', 'taker', 'CLOCKSHOP_STAND'), ev('13:30', 'E15B', 'p', 'CLOCKSHOP_STAND'), wk('14:00', 'CLOCKSHOP_STAND', 'arrange'), sh('18:00', 'CLOCKSHOP_UP', 'home')] },
  { id:'R17', name:'酒吧工作人员', home:'BAR_UP', look:LOOK('short', 1.02, 0.98, 3, '#fbfbfb', '#1e1c24', { kind:'vest', color:'#1e1c24' }),
    day:[ev('00:30', 'E16', 'barkeep', 'BAR_STAND'), wk('00:45', 'BAR_STAND', 'wipe'), sh('02:10', 'BAR_UP', 'home'), wk('16:00', 'BAR_STAND', 'carryBox', 'work'), wk('18:00', 'BAR_STAND', 'wipe')] },
  { id:'R18', name:'学校老师', home:'H09', look:LOOK('pony', 1.0, 0.96, 1, '#efe4d0', '#5a5a64', { kind:'scarf', color:'#2e5a4a' }),
    day:[h('00:00'), sh('08:30', 'SCHOOL', 'casual'), ev('15:00', 'R18GATE', 'teacher', 'SCHOOL_STEPS'), sh('15:50', 'SCHOOL'), h('18:30')] },
  { id:'R19', name:'奶奶的邻居', home:'H03', speed:1.0, look:LOOK('bun', 0.94, 1.18, 2, '#c8784a', '#5a4a48', { kind:'bag', color:'#c8a060' }),
    day:[h('00:00'), st('09:30', 'GREENS_C', 'look', { outfit:'casual' }), h('12:30'), ev('17:10', 'E17', 'giver', 'H01_STEP'), h('18:30')] },
  { id:'R20', name:'清晨清洁工', home:'APT_S', speed:1.2, look:LOOK('cap', 1.0, 1.04, 4, '#7a9a7a', '#4a5a4a', { kind:'vest', color:'#f49a3a' }, { capC:'#7a9a7a' }),
    day:[h('00:00'), wa('05:30', 'cleanPark', 1, { outfit:'work' }), ev('06:30', 'E11B', 'p', 'STORE_COUNTER2'), wa('07:00', 'cleanAvenue', 1), wa('08:30', 'cleanPlaza', 1), ev('09:40', 'E11C', 'p', 'PLAZA_CARTSIDE'), h('12:00')] },
  { id:'R21', name:'车站值勤员', home:'APT_S', look:LOOK('cap', 1.02, 1.0, 1, '#3a4a8a', '#2a3050', null, { beard:true, capC:'#3a4a8a' }),
    day:[h('00:00'), wk('06:00', 'STATION_DESK', 'look', 'work'), sh('08:10', 'STATION_DESK'), ev('10:30', 'E15A', 'giver', 'CLOCKSHOP_C'), wk('12:40', 'STATION_DESK', 'look'), h('16:00')] },
  { id:'R23', name:'看海的人B', home:'H22', look:LOOK('short', 1.06, 0.98, 2, '#6a7a98', '#3a3a48', null),
    day:[h('00:00'), sh('09:00', 'OFFICE', 'work'), ev('17:50', 'ESEA', 'arriver', 'SEA_APPROACH', { outfit:'casual' }), h('19:30')] },
  { id:'R24', name:'自行车修理者', home:'H15', look:LOOK('short', 0.94, 1.18, 3, '#3a4a7a', '#2a2a30', { kind:'apron', color:'#2a3a6a' }, { sleeve:'#d83a4a' }),
    day:[h('00:00'), wk('09:00', 'BIKE_REPAIR_STAND', 'crouch', 'work'), ev('14:30', 'E14', 'mender', 'BIKE_REPAIR_STAND'), wk('15:20', 'BIKE_REPAIR_STAND', 'crouch'), h('19:30')] },
  { id:'R26', name:'串烧摊主', home:'SKEWERS_UP', look:LOOK('short', 1.0, 1.08, 2, '#e8dcc8', '#4a3a38', { kind:'apron', color:'#f2e4cc' }, { hatC:'#a83a2a' }),
    day:[ev('00:30', 'E16', 'cook', 'SKEWERS_STAND'), wk('00:45', 'SKEWERS_STAND', 'wipe'), sh('02:00', 'SKEWERS_UP', 'home'), wk('16:00', 'SKEWERS_STAND', 'arrange', 'work'), wk('17:00', 'SKEWERS_STAND', 'wipe')] },
];
// ---- the town's people: [id, name, template, home, work, look, extra day entries {at time: entry}] ----
const D = (id, name, tpl, home, work, look, x = {}) => PEOPLE.push({ id, name, tpl, home, work, look, ...x });
const SK = ['#F0C8AA', '#DFAC86', '#C68F69', '#AB7453', '#89583F', '#684430'];
D('D01', '档案员', 'OFFICE_DAY', 'H04', 'OFFICE', LOOK('short', 1.0, 1.0, 0, '#8a8a7a', '#4a4a50', { kind:'bag', color:'#8a5a3a' }), { noon:ev('12:20', 'D01P', 'p', 'OFFICE_COL') });
D('D02', '窗口办事员', 'OFFICE_DAY', 'H06', 'OFFICE', LOOK('bun', 0.98, 0.96, 1, '#c8b8d8', '#4a4a58', null, { glasses:true }), { noon:ev('12:20', 'D02S', 'p', 'OFFICE_STEP_R') });
D('D03', '测绘员', 'OFFICE_DAY', 'H07', 'OFFICE', LOOK('cap', 1.04, 1.0, 2, '#8a9a6a', '#4a4a48', { kind:'bag', color:'#f4c83a' }, { capC:'#5a6a3a' }), { eve:ev('17:40', 'D03C', 'p', 'NORTH_CURB2') });
D('D04', '制图助理', 'OFFICE_DAY', 'H08', 'OFFICE', LOOK('pony', 0.96, 0.94, 0, '#e8d8a8', '#5a5a64', null, { shoes:'#f4e08a' }), { noon:ev('12:30', 'D04M', 'p', 'PLAZA_E') });
D('D05', '财务员', 'OFFICE_DAY', 'H09', 'OFFICE', LOOK('short', 1.0, 1.04, 1, '#6a7a8a', '#3a3a44', null, { shoes:'#5a4a3a' }), { eve:ev('18:00', 'D13N', 'taker', 'GROCER_C') });
D('D06', '接待员', 'OFFICE_DAY', 'H10', 'OFFICE', LOOK('long', 0.98, 0.94, 2, '#f2e8f0', '#4a4a58', null, { hatC:'#3a6ad0' }), { noon:ev('12:20', 'D06R', 'p', 'ARC_E') });
D('D07', '学校助教', 'OFFICE_DAY', 'H11', 'SCHOOL', LOOK('short', 0.98, 0.96, 3, '#d8c8b8', '#4a4a58', { kind:'scarf', color:'#f49a3a' }), { extra:[ev('14:30', 'D20K', 'taker', 'SCHOOL_GATE'), sh('14:45', 'SCHOOL'), ev('15:00', 'D07B', 'p', 'SCHOOL_GATE_OUT'), sh('15:40', 'SCHOOL')] });
D('D08', '校务管理员', 'OFFICE_DAY', 'H02', 'SCHOOL', LOOK('bald', 1.0, 1.06, 1, '#8a7a6a', '#3a3a40', { kind:'vest', color:'#5a5a50' }), { eve:ev('17:30', 'D08L', 'p', 'SCHOOL_LANE'), offAt:'17:30' });
D('D09', '诊所登记员', 'OFFICE_DAY', 'H05', 'CLINIC', LOOK('pony', 0.98, 0.98, 2, '#c8e8d0', '#4a5a50', null), { noon:ev('12:10', 'D09E', 'p', 'CLINIC_EAVES') });
D('D10', '港口记账员', 'HARBOUR', 'APT_N', 'HARBOUR_CRATES', LOOK('short', 1.02, 1.04, 3, '#efe4d0', '#3a3a48', { kind:'vest', color:'#2a3a6a' }), { workEv:ev('08:30', 'D10C', 'p', 'CRATES_B'), noon:st('10:30', 'SHED_SHADE', 'idle') });
D('D11', '车站票务员', 'OFFICE_DAY', 'H12', 'STATION_DESK2', LOOK('cap', 0.98, 0.96, 0, '#5a4a8a', '#3a3a48', null, { capC:'#7a4aa0' }), { post:'look', extra:[ev('14:30', 'D11T', 'p', 'STATION_TREE'), wk('15:00', 'STATION_DESK2', 'look')] });
D('D12', '蔬果店员', 'SHOP_DAY', 'H13', 'GREENS_STAND', LOOK('short', 1.0, 1.0, 1, '#e8e0c8', '#4a5a40', { kind:'apron', color:'#5a9a4a' }), { pre:ev('07:40', 'D12F', 'p', 'FLOWERS_PICK'), start:'10:30' });   // flowers first: the greengrocer opens 10:30 (the walk across the arcade)
D('D13', '杂货店员', 'SHOP_DAY', 'H14', 'GROCER_STAND', LOOK('short', 0.98, 1.0, 2, '#d8d0c0', '#4a4a50', null, { hatC:'#c83a3a' }), { extra:[ev('18:00', 'D13N', 'giver', 'GROCER_STAND')] });
D('D14', '熟食店主', 'SHOP_DAY', 'H15', 'DELI_STAND', LOOK('short', 1.02, 1.1, 2, '#f4f0ea', '#4a4a50', { kind:'apron', color:'#ffffff' }), { extra:[ev('12:20', 'D14L', 'giver', 'DELI_STAND'), ev('16:10', 'D31B', 'taker', 'DELI_STAND')] });
D('D15', '糖果店员', 'SHOP_DAY', 'H16', 'SWEETS_STAND', LOOK('cap', 0.96, 0.96, 0, '#f4c8d8', '#5a4a58', null, { capC:'#f4c83a' }), { extra:[ev('15:30', 'D15S', 'p', 'SWEETS_STAND')] });
D('D16', '西角书店员', 'SHOP_DAY', 'H17', 'BOOKS_W_STAND', LOOK('short', 0.98, 0.96, 0, '#9a8a7a', '#4a4a50', { kind:'bag', color:'#7a5a8a' }), { extra:[ev('14:30', 'D16X', 'a', 'ARC_MID_N'), wk('15:00', 'BOOKS_W_STAND', 'arrange'), ev('12:10', 'D35R', 'taker', 'BOOKS_W_STAND')] });
D('D17', '南书店员', 'SHOP_DAY', 'H18', 'BOOKS_S_STAND', LOOK('long', 0.98, 0.96, 1, '#d8d0e0', '#4a4a58', { kind:'scarf', color:'#2a3a6a' }), { extra:[ev('14:30', 'D16X', 'b', 'ARC_MID_S'), wk('15:00', 'BOOKS_S_STAND', 'arrange'), ev('16:00', 'D33R', 'taker', 'BOOKS_S_STAND')] });
D('D18', '电器修理员', 'SHOP_DAY', 'H19', 'REPAIR_STAND', LOOK('short', 1.0, 1.06, 3, '#8a7a9a', '#5a5068', null), { extra:[ev('18:30', 'D18S', 'giver', 'REPAIR_STAND')], end:'19:00' });
D('D19', '自行车学徒', 'SHOP_DAY', 'H20', 'BIKE_REPAIR_STAND', LOOK('cap', 1.0, 0.98, 2, '#d8c8b8', '#3a3a48', null, { capC:'#d83a4a' }), { extra:[ev('17:30', 'D19W', 'p', 'BIKE_REPAIR_C')] });
D('D20', '文具店助手', 'SHOP_DAY', 'H21', 'STATIONER_STAND', LOOK('pony', 0.96, 0.94, 1, '#f2eef4', '#4a4a58', null, { sleeve:'#a8c8e8' }), { extra:[ev('14:30', 'D20K', 'giver', 'SCHOOL_GATE'), wk('16:30', 'STATIONER_STAND', 'arrange')] });
D('D21', '小酒馆店员', 'SHOP_LATE', 'APT_S', 'TAVERN_STAND', LOOK('short', 1.0, 1.0, 4, '#e8e0e8', '#3a3040', { kind:'apron', color:'#5a3a6a' }), { extra:[ev('17:40', 'D21C', 'p', 'TAVERN_STAND'), ev('18:20', 'D21W', 'p', 'ALLEY_MOUTH'), wk('18:40', 'TAVERN_STAND', 'wipe')] });
// students: home → school → their own short way home
const STU = (id, name, home, look, stop) => D(id, name, 'STUDENT', home, 'SCHOOL', { ...look, s:0.7, head:1.25 }, { stop });
STU('D23', '跳格子学生', 'H01', LOOK('short', 1, 1, 1, '#e8a8c8', '#4a5a8a', { kind:'pack', color:'#a8d8f0' }), ev('15:20', 'D23H', 'p', 'SCHOOL_PAVE'));
STU('D24', '捡叶子学生', 'H02', LOOK('cap', 1, 1, 0, '#f4e8c8', '#4a4a58', null, { capC:'#5a9a4a' }), ev('15:40', 'D24L', 'p', 'NORTH_CURB2'));
STU('D25', '爱看橱窗的学生', 'H04', LOOK('pigtails', 1, 1, 2, '#a8d8f0', '#5a5a68', null, { shoes:'#f4d24a' }), ev('15:50', 'D15S', 'child', 'SWEETS_C'));
STU('D26', '修车学生', 'H06', LOOK('short', 1, 1, 3, '#7aa0b8', '#3a3a48', { kind:'pack', color:'#a83a3a' }), ev('16:00', 'D26W', 'p', 'BIKE_REPAIR_C'));
STU('D27', '等家长学生', 'H07', LOOK('pigtails', 1, 1, 1, '#f4b8c8', '#5a4a58', null), ev('15:05', 'D46P', 'child', 'SCHOOL_WAIT'));
STU('D28', '画画学生', 'H08', LOOK('short', 1, 1, 2, '#f4e0a0', '#4a5a8a', null, { sleeve:'#5a7ae0' }), ev('15:20', 'D28D', 'p', 'SCHOOL_PAVE'));
STU('D29', '绕水坑学生', 'H09', LOOK('beanie', 1, 1, 4, '#c8d8e8', '#3a3a48', null, { hatC:'#3a4a8a' }), ev('15:30', 'D29P', 'p', 'ARC_PILLARS', { rainOnly:true }));
STU('D30', '看钟学生', 'H10', LOOK('short', 1, 1, 0, '#d8e8c8', '#4a4a58', null, { glasses:true }), ev('15:50', 'D30C', 'p', 'CLOCKSHOP_C'));
STU('D31', '带餐盒学生', 'H11', LOOK('pony', 1, 1, 2, '#f4c8a8', '#4a4a58', { kind:'bag', color:'#e88a5a' }), ev('16:10', 'D31B', 'giver', 'DELI_C'));
STU('D32', '爱数台阶学生', 'H05', LOOK('short', 1, 1, 5, '#e8c8e8', '#4a4a58', null), ev('15:10', 'D32S', 'p', 'SCHOOL_STEPS'));
STU('D33', '安静读书学生', 'H03', LOOK('long', 1, 1, 1, '#efe6d6', '#5a5a68', { kind:'pack', color:'#e8dcc8' }), ev('16:00', 'D33R', 'giver', 'BOOKS_S_C'));
// at home, with one way out
const HW = (id, name, home, look, stop, x = {}) => D(id, name, 'HOME_WORK', home, 'HOME', look, { stop, ...x });
HW('D34', '插画者', 'H12', LOOK('long', 1.0, 0.96, 1, '#c8a8d8', '#4a4a58', null), ev('12:40', 'D34L', 'p', 'CAFE_OUT'));
HW('D35', '翻译者', 'H13', LOOK('bun', 0.98, 0.96, 0, '#a8b8d8', '#4a4a58', null, { hatC:'#3a6ad0' }), ev('12:10', 'D35R', 'giver', 'BOOKS_W_C'));
HW('D36', '远程职员', 'H14', LOOK('short', 1.02, 1.02, 2, '#f4f4f8', '#8a8a96', null), ev('17:30', 'D36S', 'p', 'RES_S'));
HW('D37', '缝纫者', 'H15', LOOK('bun', 0.96, 1.0, 3, '#d8a8a8', '#4a4048', { kind:'bag', color:'#f49a3a' }), ev('15:40', 'D37C', 'giver', 'H05_C'));
HW('D38', '陶器修补者', 'H16', LOOK('short', 1.0, 1.0, 1, '#f2ecdc', '#5a5a50', null), ev('17:30', 'D38C', 'giver', 'CAFE_FRONT'));
HW('D39', '音乐练习者', 'H17', LOOK('long', 1.0, 0.94, 4, '#4a4a58', '#2a2a30', null), ev('18:00', 'D39M', 'p', 'H17_STEP'));
HW('D40', '食谱记录者', 'H18', LOOK('bun', 0.98, 1.06, 2, '#f4c8d8', '#5a5050', { kind:'apron', color:'#f48ab0' }), ev('12:20', 'D14L', 'taker', 'DELI_C'));
HW('D41', '植物照顾者', 'H19', LOOK('short', 0.98, 1.0, 1, '#a8c8a0', '#4a5a48', null), ev('17:40', 'D41W', 'p', 'H19_STEP'), { extra:[ev('15:00', 'D49X', 'a', 'H19_STEP')] });
HW('D42', '模型制作者', 'H20', LOOK('short', 1.0, 0.98, 0, '#c8b098', '#4a4a50', { kind:'bag', color:'#a8805a' }), ev('18:30', 'D18S', 'taker', 'REPAIR_C'));
HW('D43', '自由摄影者', 'H21', LOOK('short', 1.0, 0.98, 2, '#5a5a6a', '#3a3a44', { kind:'bag', color:'#2a2a30' }), ev('12:30', 'D43P', 'p', 'ARC_PILLARS'));
HW('D44', '居家校对者', 'H22', LOOK('pony', 0.98, 0.96, 1, '#e8e0e8', '#4a4a58', null), ev('18:40', 'D44B', 'b', 'RES_NW2'));
// retired people
const RT = (id, name, home, look, stop, x = {}) => D(id, name, 'RETIRED', home, 'HOME', { ...look, hunch:look.hunch ?? 0.15 }, { stop, ...x });
RT('D45', '晨间买菜者', 'H12', LOOK('bun', 0.94, 1.04, 1, '#9a7aa8', '#4a4048', { kind:'bag', color:'#8a5aa8' }), ev('10:00', 'D45B', 'p', 'GREENS_C'));
D('D46', '接送照顾者', 'CARE', 'H07', 'HOME', LOOK('bun', 0.96, 1.04, 2, '#c8a890', '#4a4048', null, { umb:'#f49a3a' }), { stop:ev('15:05', 'D46P', 'carer', 'SCHOOL_WAIT') });
RT('D47', '修伞老人', 'H14', LOOK('cap', 0.98, 1.0, 0, '#8a8a7a', '#4a4a48', null, { capC:'#5a5a50', cane:true }), ev('10:00', 'D47U', 'p', 'RES_S'));
RT('D48', '看船居民', 'H19', LOOK('cap', 0.98, 0.98, 1, '#9a9aa8', '#4a4a50', { kind:'scarf', color:'#8a8a98' }, { capC:'#7a7a80' }), ev('10:00', 'D48F', 'p', 'WHARF_LOOK'));
RT('D49', '交换盆栽邻居', 'H20', LOOK('bun', 0.96, 1.08, 3, '#a8b0c8', '#4a4a58', null), ev('15:00', 'D49X', 'b', 'H20_STEP'));
RT('D50', '公园棋友A', 'H16', LOOK('cap', 1.0, 1.0, 2, '#7a6a5a', '#3a3a40', null, { capC:'#3a3a40' }), ev('14:30', 'D50C', 'a', 'PARK_SEAT_A'));
RT('D51', '公园棋友B', 'H17', LOOK('beanie', 0.98, 1.02, 4, '#6a7a8a', '#3a3a40', null, { hatC:'#6a5a4a' }), ev('14:38', 'D50C', 'b', 'PARK_SEAT_B'));
RT('D52', '散步居民', 'H08', LOOK('short', 0.96, 1.0, 1, '#a8b8c8', '#4a4a58', null, { cane:true }), ev('10:00', 'D52W', 'p', 'NORTH_CURB2'));
D('D53', '照顾伴侣者', 'CARE', 'H21', 'HOME', LOOK('short', 0.98, 1.0, 2, '#b8a8c8', '#4a4a58', null), { stop:ev('17:00', 'D53S', 'carer', 'H21_SEAT_A') });
RT('D54', '晒太阳居民', 'H21', LOOK('bun', 0.94, 1.0, 1, '#d8c8b8', '#5a4a48', { kind:'scarf', color:'#a83a3a' }, { hunch:0.3 }), ev('17:00', 'D53S', 'sunny', 'H21_SEAT_B'));
D('D55', '邻里烘焙者', 'CARE', 'H03', 'HOME', LOOK('bun', 0.96, 1.06, 1, '#f4d88a', '#5a5050', { kind:'scarf', color:'#f4c83a' }), { stop:ev('17:40', 'D55P', 'p', 'H03_STEP') });
// harbour and night work
D('D56', '北仓理货员', 'HARBOUR', 'APT_N', 'CRATES_B', LOOK('short', 1.02, 1.1, 3, '#efe4d0', '#3a3a48', { kind:'vest', color:'#3a6ab0' }), { workEv:ev('06:30', 'D56O', 'p', 'CRATES_B') });
D('D57', '市场摊主', 'HARBOUR', 'APT_N', 'MARKET2', LOOK('short', 1.0, 1.06, 2, '#d8d0c8', '#4a4048', { kind:'apron', color:'#c8a0c8' }), { workEv:ev('11:00', 'D57M', 'p', 'MARKET2'), noon:st('11:40', 'MARKET_LUNCH', 'idle') });
D('D58', '车站晚班值勤', 'SHIFT_LATE', 'APT_S', 'STATION_DESK', LOOK('cap', 1.0, 1.0, 1, '#5a6a8a', '#2a3050', null, { capC:'#5a6a8a' }), { extra:[ev('14:00', 'D58S', 'p', 'STATION_CLOCK')] });
D('D59', '渡轮售票者', 'SHOP_EARLY', 'APT_N', 'FERRY_BOOTH', LOOK('short', 0.98, 0.98, 0, '#e8f0f4', '#3a4a5a', null, { sleeve:'#7ac0d8' }), { extra:[ev('14:00', 'D59R', 'a', 'FERRY_BOOTH')], end:'14:30' });
D('D60', '学校夜间值守', 'SHIFT_NIGHT', 'H06', 'SCHOOL_WAIT', LOOK('short', 1.0, 1.04, 4, '#4a4a58', '#2a2a30', null), { patrol:wa('21:30', 'nightSchool', 2), extra:[ev('22:30', 'D60N', 'p', 'SCHOOL_STEPS')] });
D('D61', '路灯维护者', 'SHIFT_LATE', 'APT_S', 'PLAZA_NE', LOOK('cap', 1.0, 1.0, 2, '#d8c88a', '#4a4a48', { kind:'vest', color:'#e8d27a' }, { capC:'#d8c88a' }), { extra:[ev('18:30', 'D61L', 'p', 'PLAZA_NE')], end:'22:30' });
D('D62', '港口晚班值守', 'SHIFT_NIGHT', 'APT_N', 'HARB_S', LOOK('cap', 1.02, 1.04, 3, '#2a3a5a', '#2a2a30', null, { capC:'#2a3a5a' }), { extra:[ev('14:00', 'D59R', 'b', 'FERRY_BOOTH2')], patrol:wa('21:00', 'harbourNight', 3) });
D('D63', '夜间送餐者', 'SHIFT_LATE', 'APT_S', 'DELI_C', LOOK('cap', 1.0, 0.98, 1, '#8a8a90', '#3a3a40', { kind:'pack', color:'#f49a3a' }, { capC:'#7a7a80' }), { extra:[ev('17:30', 'D63D', 'taker', 'DELI_C'), ev('19:30', 'D63G', 'p', 'APT_N_DOOR')], end:'22:30' });
D('D64', '公园早班维护', 'HARBOUR', 'APT_S', 'PARK_PATH', LOOK('cap', 0.98, 1.0, 0, '#a8d8a8', '#4a5a48', null, { capC:'#a8d8a8' }), { patrol:wa('05:00', 'parkCheck', 2), workEv:ev('07:30', 'D64K', 'p', 'PARK_GATE') });
D('D65', '公寓保洁者', 'SHOP_EARLY', 'APT_S', 'APT_N_DOOR', LOOK('bun', 0.98, 1.0, 3, '#a898a8', '#4a4048', { kind:'apron', color:'#8a7a8a' }), { extra:[ev('07:00', 'D65A', 'p', 'APT_N_DOOR'), ev('09:00', 'D65B', 'p', 'APT_S_DOOR')], end:'12:00' });
D('D66', '钟塔维护者', 'OFFICE_DAY', 'H04', 'TOWER_BASE', LOOK('short', 1.02, 1.02, 2, '#6a7a8a', '#3a3a48', { kind:'bag', color:'#8a5a3a' }), { post:'arrange', extra:[ev('10:30', 'D66U', 'p', 'TOWER_DOOR'), wk('11:00', 'TOWER_BASE', 'arrange')] });

// ---------- events: give (a hands an item to b), put (p sets an item on a socket), take (p takes it), do (p does something), meet (two together) ----------
// phases (for the rings): EV.run — the act, its people (and the item) in view; EV.after — the result (the item where it went / the taker going with it)
export const EVENTS = [
  // E13: R02 hands R01 two portions; R01 gives one to K01 on his bench
  { id:'E13A', type:'give', win:['12:00', '12:40'], a:'R02', b:'R01', item:['bread2', 'parcel', '#e8c890'], aRole:'giver', bRole:'taker', aAt:'BAKERY_STAND' },
  { id:'E13B', type:'give', win:['13:30', '14:10'], a:'R01', b:'K01', item:['bread2', null], bAt:'PLAZA_N', bSeat:true },
  // E11: R03 sets a warm drink by the store; R20 takes it on the round; the empty cup goes onto the cleaning cart
  { id:'E11A', type:'put', win:['05:30', '05:50'], p:'R03', item:['drink_r20', 'drink', '#f4c8a0'], socket:'STORE_SHELF' },
  { id:'E11B', type:'take', win:['06:30', '07:00'], p:'R20', item:['drink_r20'], from:'STORE_SHELF' },
  { id:'E11C', type:'put', win:['09:40', '10:10'], p:'R20', item:['drink_r20'], socket:'CART_TOP', empty:true },
  // R04: a meal for the night shift on the shelf; the key of the till to D22 at two
  { id:'R04M', type:'put', win:['13:20', '13:40'], p:'R04', item:['meal_r03', 'lunchbox', '#e88a5a'], socket:'STORE_SHELF' },
  { id:'R04H', type:'give', win:['14:00', '14:30'], a:'R04', b:'D22', item:['till_key', 'key', '#e8c84a'], bAt:'STORE_COUNTER' },
  // E16: the bartender's glass of water to the skewer stall; a little parcel of food back
  { id:'E16', type:'give2', win:['00:30', '01:10'], a:'R17', b:'R26', item:['water_r26', 'drink', '#d8ecf8'], back:['food_r17', 'parcel', '#c87a4a'], aRole:'barkeep', bRole:'cook' },
  // E17: R19 brings grandma oranges at her door; grandma gives biscuits back
  { id:'E17', type:'give2', win:['17:10', '17:40'], a:'R19', b:'K02', item:['oranges', 'orange', '#f4a03a'], back:['biscuits', 'biscuits', '#e8c890'], aRole:'giver', bRole:'taker', bAt:'H01_STEP' },
  // E14: the courier's bell: checked, changed, rung twice
  { id:'E14', type:'do2', win:['14:30', '15:20'], a:'R24', b:'R10', aRole:'mender', bRole:'rider', anims:[['crouch', 'look', 3.5], ['mend', 'look', 3.5], ['wave', 'nod', 2.4]] },
  // E15: the station's spare clock to the clockmaker; mended; in his window to be collected
  { id:'E15A', type:'give', win:['10:30', '11:10'], a:'R21', b:'R16', item:['spare_clock', 'clock', '#c8a060'], aRole:'giver', bRole:'taker' },
  { id:'E15B', type:'put', win:['13:30', '14:00'], p:'R16', item:['spare_clock'], socket:'CLOCK_WINDOW', anim:'mend', pre:4 },
  // R12 leaves chalk ends in the little bag on the shelf for the students
  { id:'R12CHALK', type:'put', win:['14:00', '14:20'], p:'R12', item:['chalk_bag', 'chalk', '#f4f4f4'], socket:'STATIONER_SHELF' },
  // R18 at the school door; the last child goes with the one who came for her
  { id:'R18GATE', type:'do', win:['15:00', '15:50'], p:'R18', aRole:'teacher', anim:'wave', secs:4 },
  // R07 and R08's hat; R08's small fish for the gull; R22 mends R08's rod
  { id:'R07HAT', type:'hat', win:['07:40', '08:10'], a:'R08', b:'R07', aRole:'angler', bRole:'runner', item:['hat_r08', 'hat', '#4a6a4a'] },
  { id:'R08FISH', type:'gull', win:['08:30', '09:00'], p:'R08', item:['fish', 'fish', '#c8d8e0'], gull:'A15' },
  { id:'R22ROD', type:'mend', win:['10:30', '11:10'], a:'R08', b:'R22', aRole:'owner', bRole:'mender', item:['rod_r08', 'rod', '#5a4a3a'] },
  // R09 checks the cat's dish at night: fresh water
  { id:'R09BOWL', type:'put', win:['21:40', '22:10'], p:'R09', item:['cat_water', 'bowl2', '#a8d8f0'], socket:'CAT_DISH', anim:'crouch' },
  // R11 wipes the seat beside her; R23 comes with a warm drink and sits there
  { id:'ESEA', type:'sea', win:['17:30', '18:40'], a:'R11', b:'R23', aRole:'waiter', bRole:'arriver', item:['tea_r11', 'drink', '#f4c8a0'] },
  // R05: a meal from the store on the way home
  { id:'R05MEAL', type:'give', win:['20:00', '20:40'], a:'D22', b:'R05', item:['meal_r05', 'lunchbox', '#c8d8a8'], aAt:'STORE_COUNTER', aRole:'giver', bRole:'taker' },
  // ---- the town's people ----
  { id:'D01P', type:'do', win:['12:20', '13:00'], p:'D01', anim:'hold', secs:5, item:['file_d01', 'folder', '#8a5a3a'] },
  { id:'D02S', type:'sit', win:['12:20', '13:00'], p:'D02', secs:6 },
  { id:'D03C', type:'do', win:['17:40', '18:20'], p:'D03', anim:'crouch', secs:4 },
  { id:'D04M', type:'do', win:['12:30', '13:10'], p:'D04', anim:'draw', secs:5, item:['map_d04', 'paper', null] },
  { id:'D13N', type:'give', win:['18:00', '18:50'], a:'D13', b:'D05', item:['noodles', 'noodles', '#f4e0a0'], aRole:'giver', bRole:'taker' },
  { id:'D06R', type:'yield', win:['12:20', '12:50'], p:'D06' },
  { id:'D07B', type:'do', win:['15:00', '15:40'], p:'D07', anim:'wave', secs:5 },
  { id:'D08L', type:'lights', win:['17:30', '18:10'], p:'D08' },
  { id:'D09E', type:'sit', win:['12:10', '12:50'], p:'D09', secs:5, at:'CLINIC_EAVES' },
  { id:'D10C', type:'do', win:['08:30', '09:10'], p:'D10', anim:'nod', secs:5 },
  { id:'D11T', type:'walk', win:['14:30', '15:00'], p:'D11', secs:3 },
  { id:'D12F', type:'put', win:['07:40', '08:20'], p:'D12', item:['flowerbox', 'crate', null], socket:'FLOWERS_RACK' },
  { id:'D14L', type:'give', win:['12:20', '13:00'], a:'D14', b:'D40', item:['lunch_d40', 'lunchbox', '#c8e0a8'], aRole:'giver', bRole:'taker' },
  { id:'D15S', type:'give', win:['15:30', '16:20'], a:'D15', b:'D25', item:['sweet_bag', 'parcel', '#f4c8d8'], aRole:'p', bRole:'child', low:true },
  { id:'D16X', type:'give2', win:['14:30', '15:00'], a:'D16', b:'D17', item:['books_w', 'book', '#7a4a8a'], back:['books_s', 'book', '#2a5a8a'], aRole:'a', bRole:'b' },
  { id:'D18S', type:'give', win:['18:30', '19:10'], a:'D18', b:'D42', item:['screws', 'screws', '#8a8a9a'], aRole:'giver', bRole:'taker' },
  { id:'D19W', type:'do', win:['17:30', '18:00'], p:'D19', anim:'wipe', secs:5 },
  { id:'D20K', type:'give', win:['14:30', '15:00'], a:'D20', b:'D07', item:['chalk_d07', 'chalk', '#f4f4f4'], aRole:'giver', bRole:'taker' },
  { id:'D21C', type:'do', win:['17:40', '18:10'], p:'D21', anim:'align', secs:5 },
  { id:'D21W', type:'do', win:['18:20', '18:40'], p:'D21', anim:'wave', secs:4 },
  { id:'D23H', type:'hop', win:['15:20', '15:50'], p:'D23' },
  { id:'D24L', type:'take', win:['15:40', '16:10'], p:'D24', item:['leaf', 'leaf', '#d8a040'], ground:true },
  { id:'D26W', type:'do', win:['16:00', '16:40'], p:'D26', anim:'look', secs:5 },
  { id:'D46P', type:'meet', win:['15:05', '15:50'], a:'D46', b:'D27', aRole:'carer', bRole:'child', secs:3 },
  { id:'D28D', type:'draw', win:['15:20', '16:00'], p:'D28' },
  { id:'D29P', type:'puddle', win:['15:30', '16:10'], p:'D29' },
  { id:'D30C', type:'do', win:['15:50', '16:20'], p:'D30', anim:'look', secs:4, up:true },
  { id:'D31B', type:'give', win:['16:10', '16:50'], a:'D31', b:'D14', item:['lunchbox_d31', 'lunchbox', '#e88a5a'], aRole:'giver', bRole:'taker' },
  { id:'D32S', type:'steps', win:['15:10', '15:40'], p:'D32' },
  { id:'D33R', type:'give', win:['16:00', '16:40'], a:'D33', b:'D17', item:['book_d33', 'book', '#e8dcc8'], aRole:'giver', bRole:'taker' },
  { id:'D34L', type:'do', win:['12:40', '13:20'], p:'D34', anim:'look', secs:6 },
  { id:'D35R', type:'give', win:['12:10', '12:50'], a:'D35', b:'D16', item:['book_d35', 'book', '#3a6ad0'], aRole:'giver', bRole:'taker' },
  { id:'D36S', type:'do', win:['17:30', '18:00'], p:'D36', anim:'wave', secs:3 },
  { id:'D37C', type:'give', win:['15:40', '16:20'], a:'D37', b:'K08', item:['clothes_k08', 'cloth', '#c8a8d8'], aRole:'giver', bRole:'taker', bAt:'H05_STEP' },
  { id:'D38C', type:'give', win:['17:30', '18:20'], a:'D38', b:'K06', item:['mended_cup', 'cup2', '#f4eef4'], aRole:'giver', bRole:'taker', bAt:'CAFE_COUNTER' },
  { id:'D39M', type:'do', win:['18:00', '18:40'], p:'D39', anim:'hesitate', secs:6, feet:true },
  { id:'D41W', type:'water', win:['17:40', '18:20'], p:'D41' },
  { id:'D43P', type:'photo', win:['12:30', '13:10'], p:'D43' },
  { id:'D44B', type:'give2', win:['18:40', '19:30'], a:'K07', b:'D44', item:['oldbook_k07', 'book', '#9a7a5a'], back:['oldbook_d44', 'book', '#5a7a9a'], aRole:'a', bRole:'b', aAt:'RES_NW' },
  { id:'D45B', type:'take', win:['10:00', '10:40'], p:'D45', item:['veg', 'parcel', '#7ab85a'], from:'GREENS_STAND' },
  { id:'D47U', type:'do', win:['10:00', '10:40'], p:'D47', anim:'umb', secs:5, umbrella:true },
  { id:'D48F', type:'ferry', win:['10:00', '11:30'], p:'D48' },
  { id:'D49X', type:'give2', win:['15:00', '15:40'], a:'D41', b:'D49', item:['pot_d41', 'pot', '#c87a5a'], back:['pot_d49', 'pot', '#7aa0c8'], aRole:'a', bRole:'b', bAt:'H19_STEP' },
  { id:'D50C', type:'meet', win:['14:30', '15:30'], a:'D50', b:'D51', aRole:'a', bRole:'b', secs:4, seated:true, late:8 },
  { id:'D52W', type:'do', win:['10:00', '10:40'], p:'D52', anim:'idle', secs:5 },
  { id:'D53S', type:'meet', win:['17:00', '17:50'], a:'D53', b:'D54', aRole:'carer', bRole:'sunny', secs:4, seated:true, blanket:'D54' },
  { id:'D55P', type:'put', win:['17:40', '18:20'], p:'D55', item:['plate_r19', 'plate', '#f4eee0'], socket:'H03_STEP_TOP' },
  { id:'D56O', type:'do', win:['06:30', '07:10'], p:'D56', anim:'carryBox', secs:6, with:'R22' },
  { id:'D57M', type:'do', win:['11:00', '11:40'], p:'D57', anim:'wipe', secs:5 },
  { id:'D58S', type:'do', win:['14:00', '14:40'], p:'D58', anim:'nod', secs:4, with:'R21' },
  { id:'D59R', type:'meet', win:['14:00', '14:40'], a:'D59', b:'D62', aRole:'a', bRole:'b', secs:4 },
  { id:'D60N', type:'do', win:['22:30', '23:10'], p:'D60', anim:'look', secs:5 },
  { id:'D61L', type:'do', win:['18:30', '19:10'], p:'D61', anim:'reach', secs:5 },
  { id:'D63D', type:'give', win:['17:30', '18:10'], a:'D14', b:'D63', item:['supper', 'lunchbox', '#f49a3a'], aRole:'giver2', bRole:'taker' },
  { id:'D63G', type:'do', win:['19:30', '20:10'], p:'D63', anim:'give', secs:3 },
  { id:'D64K', type:'do', win:['07:30', '08:10'], p:'D64', anim:'look', secs:4, aroundDrawing:true },
  { id:'D65A', type:'do', win:['07:00', '07:40'], p:'D65', anim:'wipe', secs:5 },
  { id:'D65B', type:'do', win:['09:00', '09:40'], p:'D65', anim:'wipe', secs:5 },
  { id:'D66U', type:'do', win:['10:30', '11:00'], p:'D66', anim:'arrange', secs:6 },
];

// ---------- the rings: entry → the phases that light it (the spec's 头像与成就系统 §4–5) ----------
export const STORY = {
  'K01.S2':['E13A.run', 'E13B.run'], 'R01.S1':['E13A.run', 'E13B.run'], 'K02.S3':['E17.run', 'E17.back'], 'R19.S1':['E17.run', 'E17.back'],
  'R03.S1':['E11A.run', 'E11B.run'], 'R20.S1':['E11B.run', 'E11C.after'], 'R04.S1':['R04M.after', 'R04H.run'], 'R05.S1':['R05.leave', 'R05MEAL.run'],
  'R07.S1':['R07HAT.run', 'R07HAT.after'], 'R08.S1':['R08FISH.run', 'R08FISH.after'], 'R09.S1':['R09BOWL.run', 'R09BOWL.after'], 'R10.S1':['E14.s0', 'E14.s1', 'E14.s2'], 'R24.S1':['E14.s0', 'E14.s1', 'E14.s2'],
  'R11.S1':['ESEA.run', 'ESEA.after'], 'R23.S1':['ESEA.arrive', 'ESEA.after'], 'R12.S1':['R12CHALK.after'], 'R16.S1':['E15A.run', 'E15B.after'], 'R21.S1':['E15A.run', 'E15B.after'],
  'R17.S1':['E16.run', 'E16.back'], 'R26.S1':['E16.run', 'E16.back'], 'R18.S1':['R18GATE.run', 'D46P.after'], 'R22.S1':['R22ROD.run', 'R22ROD.after'],
  'R20.S2':['D28D.after', 'R20.around'], 'D64.S1':['D28D.after', 'D64K.run'],
  'D01.S1':['D01P.run', 'D01P.after'], 'D02.S1':['D02S.run'], 'D03.S1':['D03.leave', 'D03C.run'], 'D04.S1':['D04M.run', 'D04M.after'], 'D05.S1':['D13N.run', 'D13N.after'], 'D13.S1':['D13N.run', 'D13N.after'],
  'D06.S1':['D06R.run', 'D06R.after'], 'D07.S1':['D07B.run', 'D07B.after'], 'D08.S1':['D08L.run', 'D08L.after'], 'D09.S1':['D09.leave', 'D09E.run'], 'D10.S1':['D10C.run', 'D10C.after'],
  'D11.S1':['D11T.run', 'D11T.after'], 'D12.S1':['D12F.run', 'D12F.after'], 'D14.S1':['D14L.run', 'D14L.after'], 'D40.S1':['D14L.run', 'D14L.after'], 'D15.S1':['D15S.run', 'D15S.after'],
  'D16.S1':['D16X.run', 'D16X.back'], 'D17.S1':['D16X.run', 'D16X.back'], 'D18.S1':['D18S.run', 'D18S.after'], 'D42.S1':['D18S.run', 'D18S.after'], 'D19.S1':['D19W.run', 'D19W.after'],
  'D20.S1':['D20K.run', 'D20K.after'], 'D21.S1':['D21C.run', 'D21W.run'], 'D22.S1':['R04H.run', 'R04H.after'], 'D23.S1':['D23H.run'], 'D24.S1':['D24L.run', 'D24L.after'],
  'D25.S1':['D15S.run', 'D15S.after'], 'D26.S1':['D26W.run'], 'D27.S1':['D46P.run', 'D46P.after'], 'D46.S1':['D46P.run', 'D46P.after'], 'D28.S1':['D28D.run', 'D28D.after'], 'D29.S1':['D29P.run', 'D29P.after'],
  'D30.S1':['D30C.run', 'D30C.after'], 'D31.S1':['D31B.run', 'D31B.after'], 'D32.S1':['D32S.run'], 'D33.S1':['D33R.run', 'D33R.after'], 'D34.S1':['D34L.run', 'D34L.after'], 'D35.S1':['D35R.run', 'D35R.after'],
  'D36.S1':['D36S.run', 'D36S.after'], 'D37.S1':['D37C.run', 'D37C.after'], 'D38.S1':['D38C.run', 'D38C.after'], 'D39.S1':['D39M.run', 'D39M.after'], 'D41.S1':['D41W.run', 'D41W.after'], 'D43.S1':['D43P.run'],
  'D44.S1':['D44B.run', 'D44B.back'], 'D45.S1':['D45B.run', 'D45B.after'], 'D47.S1':['D47U.run', 'D47U.after'], 'D48.S1':['D48F.run', 'D48F.after'], 'D49.S1':['D49X.run', 'D49X.back'],
  'D50.S1':['D50C.first', 'D50C.run'], 'D51.S1':['D50C.first', 'D50C.run'], 'D52.S1':['D52.walk', 'D52W.run', 'D52W.after'], 'D53.S1':['D53S.run', 'D53S.after'], 'D54.S1':['D53S.run', 'D53S.after'], 'D55.S1':['D55P.run', 'D55P.after'],
  'D56.S1':['D56O.run', 'D56O.after'], 'D57.S1':['D57M.run', 'D57M.after'], 'D58.S1':['D58S.run', 'D58S.after'], 'D59.S1':['D59R.run', 'D59R.after'], 'D62.S1':['D59R.run', 'D59R.after'], 'D60.S1':['D60.round', 'D60N.run'],
  'D61.S1':['D61L.run'], 'D63.S1':['D63D.run', 'D63G.run'], 'D65.S1':['D65A.run', 'D65B.run'], 'D66.S1':['D66U.run', 'D66U.after'],
};
