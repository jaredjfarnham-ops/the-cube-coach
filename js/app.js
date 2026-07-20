/* ================================================================
   APP — theme, cubes, view renderers, mega-menu, router.
   Data globals: groups, moveById (notation.js); LESSONS (lessons.js +
   algs.js); ALG_SETS (algs.js); PUZZLES (taxonomy.js).
   Engine: makeCube, parse, invertSeq, tokenize, busy, DUR_NOTE.
   Diagrams: ollSVG, pllSVG.
   ================================================================ */

/* ---------- Preferences (settings dialog) ---------- */
const themeBtn = document.getElementById('themeToggle');
const PREFS = Object.assign(
  { theme: localStorage.getItem('coach-theme') || 'dark', inspection: 'off', anim: 'normal', hideTimer: false, showScramble: true, scrLen: 'normal', pbBest: '#16a34a', pbWorst: '#dc2626' },
  JSON.parse(localStorage.getItem('coach-prefs') || '{}'));
if (typeof PREFS.inspection === 'boolean') PREFS.inspection = PREFS.inspection ? 'on' : 'off';   // migrate old on/off boolean
const ANIM = { slow:700, normal:430, fast:230 };
const BOOL_PREFS = ['hideTimer','showScramble'];               // inspection is now tri-state (off / on / exceptbld)
const BLD_EVENTS = ['3bld','4bld','5bld','mbld'];
const inspectionOn = () => PREFS.inspection==='on' || (PREFS.inspection==='exceptbld' && !BLD_EVENTS.includes(trPuzzle));
function savePrefs() { localStorage.setItem('coach-prefs', JSON.stringify(PREFS)); }
function refreshPrefsUI() {
  document.querySelectorAll('#settingsModal [data-pref]').forEach(b => {
    const k = b.dataset.pref, cur = BOOL_PREFS.includes(k) ? (PREFS[k] ? 'on' : 'off') : PREFS[k];
    b.classList.toggle('on', b.dataset.val === cur);
  });
}
function applyPrefs() {
  document.documentElement.dataset.theme = PREFS.theme;
  themeBtn.textContent = PREFS.theme==='light' ? '☀️' : '🌙';
  DUR_SEQ = ANIM[PREFS.anim] || 430;
  const scr = document.getElementById('trainerScramble'); if (scr) scr.style.display = PREFS.showScramble===false ? 'none' : '';
  document.documentElement.style.setProperty('--pb-best', PREFS.pbBest);     // PB highlight colours (timer history)
  document.documentElement.style.setProperty('--pb-worst', PREFS.pbWorst);
  document.querySelectorAll('.color-swatch[data-pbkey]').forEach(b => { b.style.background = PREFS[b.dataset.pbkey]; });
  refreshPrefsUI();
}
themeBtn.onclick = () => { PREFS.theme = PREFS.theme==='light' ? 'dark' : 'light'; savePrefs(); applyPrefs(); };
const settingsModal = document.getElementById('settingsModal');
document.getElementById('prefsBtn').onclick = () => settingsModal.classList.remove('hidden');
document.getElementById('settingsClose').onclick = () => settingsModal.classList.add('hidden');
settingsModal.onclick = e => { if (e.target === settingsModal) settingsModal.classList.add('hidden'); };
document.querySelectorAll('#settingsModal [data-pref]').forEach(b => b.onclick = () => {
  const k = b.dataset.pref;
  PREFS[k] = BOOL_PREFS.includes(k) ? (b.dataset.val==='on') : b.dataset.val;
  savePrefs(); applyPrefs();
});

/* ---- Google-Slides-style colour picker (preset swatches + custom HSV square / hue slider / hex) ---- */
const _hex2rgb = h => { h=h.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16)||0; return [(n>>16)&255,(n>>8)&255,n&255]; };
const _rgb2hex = (r,g,b) => '#'+[r,g,b].map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('');
const _rgb2hsv = (r,g,b) => { r/=255;g/=255;b/=255; const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn; let h=0;
  if(d){ if(mx===r)h=((g-b)/d)%6; else if(mx===g)h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; if(h<0)h+=360; } return [h, mx?d/mx:0, mx]; };
const _hsv2rgb = (h,s,v) => { const c=v*s, x=c*(1-Math.abs(((h/60)%2)-1)), m=v-c; let r,g,b;
  if(h<60)[r,g,b]=[c,x,0]; else if(h<120)[r,g,b]=[x,c,0]; else if(h<180)[r,g,b]=[0,c,x];
  else if(h<240)[r,g,b]=[0,x,c]; else if(h<300)[r,g,b]=[x,0,c]; else [r,g,b]=[c,0,x];
  return [(r+m)*255,(g+m)*255,(b+m)*255]; };
const SWATCHES = [   // top row greys, then the Google-Slides standard-colour rows
  '#000000','#434343','#666666','#999999','#b7b7b7','#cccccc','#d9d9d9','#efefef','#f3f3f3','#ffffff',
  '#980000','#ff0000','#ff9900','#ffff00','#00ff00','#00ffff','#4a86e8','#0000ff','#9900ff','#ff00ff',
  '#e6b8af','#f4cccc','#fce5cd','#fff2cc','#d9ead3','#d0e0e3','#c9daf8','#cfe2f3','#d9d2e9','#ead1dc',
  '#cc4125','#dd7e6b','#e69138','#f6b26b','#6aa84f','#45818e','#3c78d8','#3d85c6','#674ea7','#a64d79',
  '#990000','#cc0000','#b45f06','#bf9000','#38761d','#134f5c','#1155cc','#0b5394','#351c75','#741b47' ];
let _cpEl=null, _cpClose=null;
function openColorPicker(anchor, current, onPick) {
  closeColorPicker();
  let [h,s,v] = _rgb2hsv(..._hex2rgb(current||'#16a34a'));
  const el = document.createElement('div'); el.className='cpick';
  el.innerHTML = `
    <div class="cpick-swatches">${SWATCHES.map(c=>`<button class="cpick-sw" data-c="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>
    <button class="cpick-custom" type="button">＋ Custom</button>
    <div class="cpick-panel hidden">
      <div class="cpick-sv"><div class="cpick-sv-thumb"></div></div>
      <div class="cpick-hue"><div class="cpick-hue-thumb"></div></div>
      <div class="cpick-foot"><span class="cpick-prev"></span><input class="cpick-hex" maxlength="7" spellcheck="false"><button class="cpick-ok" type="button">OK</button></div>
    </div>`;
  document.body.appendChild(el);
  const r = anchor.getBoundingClientRect();
  el.style.left = Math.min(r.left, window.innerWidth - el.offsetWidth - 12) + 'px';
  el.style.top  = (r.bottom + 6 + window.scrollY) + 'px';
  const panel=el.querySelector('.cpick-panel'), sv=el.querySelector('.cpick-sv'), svT=el.querySelector('.cpick-sv-thumb'),
        hue=el.querySelector('.cpick-hue'), hueT=el.querySelector('.cpick-hue-thumb'),
        prev=el.querySelector('.cpick-prev'), hex=el.querySelector('.cpick-hex');
  const curHex = () => _rgb2hex(..._hsv2rgb(h,s,v));
  function paint(){ sv.style.background=`linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent),hsl(${h},100%,50%)`;
    svT.style.left=(s*100)+'%'; svT.style.top=((1-v)*100)+'%'; hueT.style.top=((h/360)*100)+'%';
    const c=curHex(); prev.style.background=c; if(document.activeElement!==hex) hex.value=c; }
  el.querySelectorAll('.cpick-sw').forEach(b => b.onclick = () => { onPick(b.dataset.c); closeColorPicker(); });
  el.querySelector('.cpick-custom').onclick = () => { panel.classList.toggle('hidden'); paint(); };
  const drag = (box, mv) => { const go = ev => { const rr=box.getBoundingClientRect();
      mv(Math.max(0,Math.min(1,((ev.touches?ev.touches[0].clientX:ev.clientX)-rr.left)/rr.width)),
         Math.max(0,Math.min(1,((ev.touches?ev.touches[0].clientY:ev.clientY)-rr.top)/rr.height))); paint(); };
    box.addEventListener('pointerdown', e => { box.setPointerCapture(e.pointerId); go(e);
      const m=ev=>go(ev), u=()=>{box.removeEventListener('pointermove',m);box.removeEventListener('pointerup',u);};
      box.addEventListener('pointermove',m); box.addEventListener('pointerup',u); }); };
  drag(sv, (x,y)=>{ s=x; v=1-y; });
  drag(hue, (x,y)=>{ h=y*360; });
  hex.oninput = () => { const m=hex.value.trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i); if(m){ [h,s,v]=_rgb2hsv(..._hex2rgb(m[1])); paint(); } };
  el.querySelector('.cpick-ok').onclick = () => { onPick(curHex()); closeColorPicker(); };
  paint();
  _cpEl = el;
  _cpClose = e => { if (!el.contains(e.target) && e.target!==anchor) closeColorPicker(); };
  setTimeout(() => document.addEventListener('pointerdown', _cpClose), 0);
}
function closeColorPicker() { if (_cpEl) { _cpEl.remove(); _cpEl=null; } if (_cpClose) { document.removeEventListener('pointerdown', _cpClose); _cpClose=null; } }
document.querySelectorAll('.color-swatch[data-pbkey]').forEach(b => b.onclick = () => {
  const k = b.dataset.pbkey;
  openColorPicker(b, PREFS[k], hex => { PREFS[k]=hex; savePrefs(); applyPrefs(); });
});
applyPrefs();

/* ================================================================
   PROFILES — per-user storage (learned-state + solve times).
   Local for now; the whole app reads/writes through the "current
   profile" seam, so a real sign-in can later swap localStorage for a
   synced backend without touching the rest of the app.
   ================================================================ */
const Profiles = (() => {
  const PKEY = 'coach-profiles';
  const dataKey = id => 'coach-data-' + id;
  const loadData = id => JSON.parse(localStorage.getItem(dataKey(id)) || '{"learn":{},"times":{}}');
  const saveData = (id, d) => localStorage.setItem(dataKey(id), JSON.stringify(d));
  const newId = () => 'u' + Date.now() + Math.floor(Math.random() * 1000);

  let meta = JSON.parse(localStorage.getItem(PKEY) || 'null');
  if (!meta) {                                   // first run: create default profile, migrate legacy learned-state
    const id = newId();
    meta = { users: [{ id, name: 'Player 1' }], current: id };
    const legacy = localStorage.getItem('coach-learn');
    saveData(id, { learn: legacy ? JSON.parse(legacy) : {}, times: {} });
    localStorage.setItem(PKEY, JSON.stringify(meta));
  }
  const saveMeta = () => localStorage.setItem(PKEY, JSON.stringify(meta));
  let curId = meta.current, data = loadData(curId);

  return {
    list: () => meta.users.slice(),
    currentId: () => curId,
    current: () => meta.users.find(u => u.id === curId),
    data: () => data,
    save: () => saveData(curId, data),
    switchTo(id) { if (meta.users.some(u => u.id === id)) { curId = id; meta.current = id; saveMeta(); data = loadData(id); } },
    add(name) { const id = newId(); meta.users.push({ id, name: name || ('Player ' + (meta.users.length + 1)) }); saveData(id, { learn:{}, times:{} }); saveMeta(); this.switchTo(id); return id; },
    rename(id, name) { const u = meta.users.find(x => x.id === id); if (u && name) { u.name = name; saveMeta(); } },
    remove(id) { if (meta.users.length <= 1) return false; meta.users = meta.users.filter(u => u.id !== id); localStorage.removeItem(dataKey(id)); if (curId === id) this.switchTo(meta.users[0].id); saveMeta(); return true; },
  };
})();

/* learned-state (per current profile) */
const learnKey = (set, name) => set + '/' + name;
const getLearn = (set, name) => Profiles.data().learn[learnKey(set, name)] || 0;
function cycleLearn(set, name) {
  const d = Profiles.data(), k = learnKey(set, name);
  d.learn[k] = ((d.learn[k] || 0) + 1) % 3; Profiles.save();
  return d.learn[k];
}
/* solve times (per current profile, per set). Each solve = {ms, p, t}: raw ms, penalty (0 | 2 | 'dnf'), timestamp. */
const getSolves = setId => (Profiles.data().times[setId] = Profiles.data().times[setId] || []);
function addSolve(setId, ms, p, scr) { const o = { ms: Math.round(ms), p: p || 0, t: Date.now() }; if (scr) o.scr = scr; getSolves(setId).push(o); Profiles.save(); if (window.cloudSyncSet) cloudSyncSet(setId); }
function clearSolves(setId) { Profiles.data().times[setId] = []; Profiles.save(); if (window.cloudSyncSet) cloudSyncSet(setId); }

/* custom algorithms a user adds to a sheet case, and which algorithm they prefer to see.
   Stored per current profile (so the account profile carries them) and mirrored to the cloud. */
const algStoreKey = (set, name) => set + '/' + name;
const getCustomAlgs = (set, name) => ((Profiles.data().custom || {})[algStoreKey(set, name)] || []).slice();
const getAlgPref    = (set, name) => (Profiles.data().algpref || {})[algStoreKey(set, name)] || null;
function addCustomAlg(set, name, alg) {
  const d = Profiles.data(); (d.custom = d.custom || {}); const k = algStoreKey(set, name);
  const l = (d.custom[k] = d.custom[k] || []); if (!l.includes(alg)) l.push(alg);
  Profiles.save(); if (window.cloudSaveAlgs) cloudSaveAlgs();
}
function removeCustomAlg(set, name, alg) {
  const d = Profiles.data(); if (!d.custom) return; const k = algStoreKey(set, name);
  d.custom[k] = (d.custom[k] || []).filter(a => a !== alg); if (!d.custom[k].length) delete d.custom[k];
  Profiles.save(); if (window.cloudSaveAlgs) cloudSaveAlgs();
}
function setAlgPref(set, name, alg) {
  const d = Profiles.data(); (d.algpref = d.algpref || {}); const k = algStoreKey(set, name);
  if (alg) d.algpref[k] = alg; else delete d.algpref[k];
  Profiles.save(); if (window.cloudSaveAlgs) cloudSaveAlgs();
}

/* ---------- User menu UI ---------- */
const userBtn = document.getElementById('userBtn'), userPanel = document.getElementById('userPanel'),
      userNameEl = document.getElementById('userName'), userList = document.getElementById('userList'), userInput = document.getElementById('userInput');
function refreshUserUI() {
  userNameEl.textContent = Profiles.current().name;
  userList.innerHTML = '';
  Profiles.list().forEach(u => {
    const b = document.createElement('button'); b.className = 'user-item' + (u.id === Profiles.currentId() ? ' active' : '');
    b.innerHTML = `<span>${u.name}</span>` + (u.id === Profiles.currentId() ? '<span class="chk">✓</span>' : '');
    b.onclick = () => { Profiles.switchTo(u.id); refreshUserUI(); render(); userPanel.classList.add('hidden'); };
    userList.appendChild(b);
  });
}
userBtn.onclick = e => { e.stopPropagation(); userPanel.classList.toggle('hidden'); };
document.addEventListener('click', e => { if (!document.getElementById('userMenu').contains(e.target)) userPanel.classList.add('hidden'); });
document.getElementById('userAdd').onclick = () => { const n = userInput.value.trim(); Profiles.add(n || undefined); userInput.value = ''; refreshUserUI(); render(); };
document.getElementById('userRename').onclick = () => { const n = userInput.value.trim(); if (n) { Profiles.rename(Profiles.currentId(), n); userInput.value = ''; refreshUserUI(); } };
document.getElementById('userDelete').onclick = () => { if (Profiles.remove(Profiles.currentId())) { refreshUserUI(); render(); } };
refreshUserUI();

/* ---------- Cubes ---------- */
const ncube = makeCube(document.getElementById('cube'));
const lcube = makeCube(document.getElementById('lessonCube'));
const scube = makeCube(document.getElementById('sheetCube'));
const tcube = makeCube(document.getElementById('trainerCube'));

/* ---------- Generic algorithm player (cube + readout element) ---------- */
function makePlayer(cube, readoutEl) {
  let moves = [], idx = 0;
  function draw() {
    if (!readoutEl) return;
    readoutEl.innerHTML = moves.map((m,i) =>
      `<span class="mv ${i<idx?'done':''} ${i===idx?'now':''}">${m.replace("'","′")}</span>`).join(' ');
  }
  function arm(seq) { moves = tokenize(seq).slice(); idx = 0; cube.reset(); cube.applyInstant(invertSeq(moves)); draw(); }
  async function play() { if (busy || idx>=moves.length) return; busy=true; while (idx<moves.length) { await cube.animateMove(cube.parse(moves[idx])); idx++; draw(); } busy=false; }
  async function step() { if (busy || idx>=moves.length) return; busy=true; await cube.animateMove(cube.parse(moves[idx])); idx++; draw(); busy=false; }
  function reset() { if (!busy) arm(moves); }
  return { arm, play, step, reset };
}
const lessonPlayer  = makePlayer(lcube, document.getElementById('algoReadout'));
const sheetPlayer   = makePlayer(scube, document.getElementById('sheetReadout'));
const trainerPlayer = makePlayer(tcube, null);

/* ---------- Non-cube puzzle simulators (Square-1, Clock), rendered as SVG ---------- */
const sqSim = makeSquare1(), clockSim = makeClock(), pyraSim = makePyraminx(), skewbSim = makeSkewb(), megaSim = makeMegaminx(), rediSim = makeRedi();
megaSim.flipTurn = true;   // Megaminx face turns read the opposite way from the drag without this
const SIM = { sq1: sqSim, clock: clockSim, pyra: pyraSim, skewb: skewbSim, mega: megaSim, redi: rediSim };
const SIM_KEYS = {                                       // 3-D sims solvable with the camera-relative u/l/r/b keys
  pyra:  { sim: pyraSim,  map: { u:'U', l:'L', r:'R', b:'B' } },
  skewb: { sim: skewbSim, map: { u:'U', l:'L', r:'R', b:'B' } },
  mega:  { sim: megaSim,  map: { u:'U', l:'L', r:'R', b:'B', f:'F' } },
};
const CLOCK_SENS = 0.6;   // Virtual Clock drag sensitivity: <1 = less twitchy (1 hour per ~50° of finger sweep instead of 30°)
const trainerSimEl = document.getElementById('trainerSim');
const lessonSimEl   = document.getElementById('lessonSim');
/* ---- shared SIM interaction (orbit + click-to-turn for 3-D sims like Pyraminx) ---- */
function simKeyMove(sim, e, opts={}) {          // camera-relative screen-role keys: u/l/r/b, plus f (front) on Megaminx
  const role = { u:'top', l:'bl', r:'br', b:'back', f:'front' }[e.key.toLowerCase()];
  if (!role) return;
  const V = sim.screenRoles()[role];
  if (V == null) return;                         // this sim has no such role (only Megaminx exposes 'front')
  e.preventDefault();
  if (opts.onTurnStart) opts.onTurnStart();
  let tok;
  if (sim.faceLetter) {                          // Megaminx has doubles: Ctrl = ×2, Shift = prime, Shift+Ctrl = 2'
    tok = V + ((e.ctrlKey||e.altKey) ? 'd' : '') + (e.shiftKey ? "'" : '');
  } else {                                       // Pyraminx/Skewb: Ctrl = tip, Shift = prime
    const tip = e.ctrlKey || e.altKey;
    tok = (tip ? V.toLowerCase() : V) + (e.shiftKey ? "'" : '');
  }
  if (sim.animateMove) sim.animateMove(tok, 220, opts.onChange).then(() => { if (opts.onTurn) opts.onTurn(); });
  else { sim.applyTokens([tok]); if (opts.onChange) opts.onChange(); if (opts.onTurn) opts.onTurn(); }
}
function attachSimPointer(el, getSim, onChange, hooks={}) {
  let mode=null, sx=0, sy=0, turnV=null, turnTip=null, dnx=0, dny=0;
  el.addEventListener('pointerdown', e => {
    const sim=getSim(); if (!sim) return;
    const fl = e.target.closest('[data-v]');
    // DRAG a sticker (any length, or a short flick) to TURN that piece — like the 3-D models. Orbit the
    // camera by dragging EMPTY space (or double-click to recentre / use the keyboard).
    if (fl && sim.screenRoles) { mode='pending'; turnV=fl.dataset.v; turnTip=fl.dataset.tip; dnx=sx=e.clientX; dny=sy=e.clientY; try{ el.setPointerCapture(e.pointerId); }catch(_){} return; }
    if (sim.rotateView) { mode='orbit'; sx=e.clientX; sy=e.clientY; try{ el.setPointerCapture(e.pointerId); }catch(_){} }
  });
  el.addEventListener('pointermove', e => { const sim=getSim(); if (!sim) return;
    if (mode==='orbit') { sim.rotateView(e.clientX-sx, e.clientY-sy); sx=e.clientX; sy=e.clientY; onChange(); } });
  el.addEventListener('pointerup', e => {
    const sim=getSim();
    const wasOrbit = mode==='orbit';
    if (mode==='pending' && turnV && sim) {
      const r=el.getBoundingClientRect();
      const dx=e.clientX-dnx, dy=e.clientY-dny;
      if (Math.hypot(dx,dy) >= 9) {                 // drag a sticker to turn (a TIP facelet → tip turn)
        let tok;
        if (sim.moveFromDrag) tok = sim.moveFromDrag(turnV, dnx, dny, e.clientX, e.clientY, r);   // Megaminx: turn the face the drag points to (may be a neighbour)
        if (!tok) { let cr = (dnx-(r.left+r.width/2))*dy - (dny-(r.top+r.height/2))*dx; if (sim.flipTurn) cr=-cr;   // fallback (also covers Megaminx's centre "dead zone"): turn the clicked face
               tok = (turnTip ? turnV.toLowerCase() : turnV) + (cr > 0 ? "'" : ''); }
        if (tok) { if (hooks.onTurnStart) hooks.onTurnStart();
          if (sim.animateMove) sim.animateMove(tok, 220, onChange).then(() => { if (hooks.onTurn) hooks.onTurn(); });
          else { sim.applyTokens([tok]); onChange(); if (hooks.onTurn) hooks.onTurn(); } }
      }
    }
    mode=null; turnV=null; turnTip=null;
    if (wasOrbit && sim && sim.snapView) sim.snapView(onChange);   // settle to the nearest face-up 3/4 view
  });
  el.addEventListener('pointercancel', () => { const sim=getSim(); const wasOrbit=mode==='orbit'; mode=null; turnV=null; turnTip=null; if (wasOrbit && sim && sim.snapView) sim.snapView(onChange); });
  el.addEventListener('dblclick', () => { const sim=getSim(); if (sim && sim.recenter) { sim.recenter(); onChange(); } });
}
/* trainer: orbit + click-to-turn for 3-D sims (Pyraminx), driving the timer */
attachSimPointer(trainerSimEl,
  () => (SIM[trPuzzle] && SIM[trPuzzle].screenRoles && trCubeMode==='virtual' && !trView.classList.contains('hidden') && !TWISTY_TIMER[trPuzzle]) ? SIM[trPuzzle] : null,   // Megaminx has an SVG sim too, but in the timer it uses the 3-D twisty — don't let this handler overwrite it
  () => { trainerSimEl.innerHTML = SIM[trPuzzle].svg(); },
  { onTurnStart: () => { tryStartSolve(); },
    onTurn:      () => { if (trState==='running' && SIM[trPuzzle].isSolved()) stopSolve(); } });
/* a play/step/reset player for a sim lesson (animates a token sequence from solved) */
function makeSimPlayer(sim, container, readoutEl) {
  const use3d = !!sim.animateMove3d;                                  // Square-1: animate on the new 3-D model, not the top-down circles
  const mount = use3d ? sim.mount3d : sim.mount, animate = use3d ? sim.animateMove3d : sim.animateMove;
  let toks = [], idx = 0;
  const seed = () => { sim.reset(); mount(container); };              // mount so animate can drive the live DOM
  function draw() { if (readoutEl) readoutEl.innerHTML = toks.map((t,i)=>`<span class="mv ${i<idx?'done':''} ${i===idx?'now':''}">${t.replace(/'/g,'′')}</span>`).join(' '); }
  function arm(seq) { toks = (Array.isArray(seq)?seq:String(seq).split(/\s+/)).filter(Boolean); idx=0; seed(); draw(); }
  async function play() { if (busy) return; busy=true; seed(); idx=0; draw();
    while (idx < toks.length) { await animate(toks[idx], DUR_SEQ); idx++; draw(); } busy=false; }
  async function step() { if (busy||idx>=toks.length) return; busy=true; await animate(toks[idx], DUR_SEQ); idx++; draw(); busy=false; }
  function reset() { if (busy) return; seed(); idx=0; draw(); }
  return { arm, play, step, reset };
}
const simLessonPlayer = makeSimPlayer(sqSim, lessonSimEl, document.getElementById('algoReadout'));
let curLessonPlayer = lessonPlayer;

/* ---- 3-D sim embedded in puzzle lessons (Pyraminx/Skewb/Megaminx/Clock): VIEW-ONLY, it PLAYS the listed algorithms ---- */
let lessonSim = null, lessonAlgTimer = null, lessonAlgGen = 0;
const lessonView   = document.getElementById('view-lesson');
const lessonSimCtl  = document.getElementById('lessonSimCtl');
const lessonSimHintEl = document.getElementById('lessonSimHint');
const renderLessonSim = () => { if (lessonSim) lessonSimEl.innerHTML = lessonSim.svg(); };
const lessonSimHintFor = pz =>
    pz==='clock' ? 'The clock shows the position. <b>Drag</b> to look around.'
  : 'Click an <b>algorithm</b> above to set up its case and watch it <b>solve</b>. <b>Drag</b> to rotate the view, double-click to recentre.';
// Invert a sim token. Skewb has no doubles — "X2" already means "X′" (240°), so its inverse is "X" (120°), NOT "X2′".
const invSimToken = (t, skewb) => {
  if (skewb && /[ULRB]/i.test(t)) { const b = t.replace(/['2]/g,''); return (t.includes("'") || t.includes('2')) ? b : b+"'"; }
  return t.includes("'") ? t.replace("'","") : t + "'";
};
/* Demonstrate an algorithm: set up its case (the inverse), then ANIMATE the alg forward so it ends SOLVED. */
function playLessonAlg(algStr) {
  if (!lessonSim) return;
  clearTimeout(lessonAlgTimer); lessonAlgGen = (lessonAlgGen||0) + 1; const myGen = lessonAlgGen;
  const toks = String(algStr).replace(/′/g,"'").split(/\s+/).filter(Boolean);
  const skewb = lessonSim === skewbSim;
  lessonSim.reset();
  lessonSim.applyTokens(toks.slice().reverse().map(t => invSimToken(t, skewb)));   // set up the case = inverse of the alg
  renderLessonSim();
  let i = 0;
  const stepNext = () => {
    if (i >= toks.length || myGen !== lessonAlgGen || lessonView.classList.contains('hidden') || !lessonSim) return;
    const tk = toks[i++];
    if (lessonSim.animateMove)
      lessonSim.animateMove(tk, 300, renderLessonSim).then(() => { if (myGen===lessonAlgGen) lessonAlgTimer = setTimeout(stepNext, 70); });
    else { lessonSim.applyTokens([tk]); renderLessonSim(); lessonAlgTimer = setTimeout(stepNext, 250); }
  };
  lessonAlgTimer = setTimeout(stepNext, 450);   // pause on the case, then solve it
}
/* click an algorithm row in the lesson text → play it on the sim */
document.getElementById('lessonText').addEventListener('click', e => {
  const row = e.target.closest('.alg-ref-row'); if (!row || !lessonSim) return;
  const code = row.querySelector('code'); if (!code) return;
  lessonText.querySelectorAll('.alg-ref-row.playing').forEach(r => r.classList.remove('playing'));
  row.classList.add('playing'); playLessonAlg(code.textContent);
});
/* view-only orbit (no turning the puzzle) */
(() => { let o=null;
  lessonSimEl.addEventListener('pointerdown', e => { if (!lessonSim || lessonView.classList.contains('hidden') || !lessonSim.rotateView) return;
    o={x:e.clientX,y:e.clientY}; try{lessonSimEl.setPointerCapture(e.pointerId);}catch(_){} });
  lessonSimEl.addEventListener('pointermove', e => { if(!o||!lessonSim)return; lessonSim.rotateView(e.clientX-o.x,e.clientY-o.y); o.x=e.clientX; o.y=e.clientY; renderLessonSim(); });
  const end=()=>{ const wasOrbit=!!o; o=null; if (wasOrbit && lessonSim && lessonSim.snapView) lessonSim.snapView(renderLessonSim); };   // settle to nearest face-up 3/4
  lessonSimEl.addEventListener('pointerup',end); lessonSimEl.addEventListener('pointercancel',end);
  lessonSimEl.addEventListener('dblclick', () => { if (lessonSim && lessonSim.recenter) { lessonSim.recenter(); renderLessonSim(); } });
})();
document.getElementById('lsSimReplay').onclick    = () => { const row = lessonText.querySelector('.alg-ref-row.playing') || lessonText.querySelector('.alg-ref-row');
  if (row) { lessonText.querySelectorAll('.alg-ref-row.playing').forEach(r=>r.classList.remove('playing')); row.classList.add('playing'); playLessonAlg(row.querySelector('code').textContent); } };
document.getElementById('lsSimReset').onclick     = () => { if (lessonSim) { clearTimeout(lessonAlgTimer); lessonText.querySelectorAll('.alg-ref-row.playing').forEach(r=>r.classList.remove('playing')); lessonSim.reset(); renderLessonSim(); } };
document.getElementById('lsSimRecenter').onclick  = () => { if (lessonSim && lessonSim.recenter) { lessonSim.recenter(); renderLessonSim(); } };

/* ================================================================
   MOUSE CONTROLS for any cube — drag a sticker to turn its layer
   (r = n × u, finger-following), drag the background to orbit.
   Reused by the Virtual Cube playground AND the trainer's virtual mode.
   ================================================================ */
const FACE_N = [ {x:0,y:0,z:1}, {x:0,y:0,z:-1}, {x:1,y:0,z:0}, {x:-1,y:0,z:0}, {x:0,y:-1,z:0}, {x:0,y:1,z:0} ]; // front,back,right,left,up,down
const PAXES = { x:{x:1,y:0,z:0}, y:{x:0,y:1,z:0}, z:{x:0,y:0,z:1} };
const cross = (a,b) => ({ x:a.y*b.z-a.z*b.y, y:a.z*b.x-a.x*b.z, z:a.x*b.y-a.y*b.x });
function viewRot(rxd, ryd) {                       // CSS rotateX(rx)·rotateY(ry) as a 3×3 (engine convention)
  const rx=rxd*Math.PI/180, ry=ryd*Math.PI/180;
  const Rx=[[1,0,0],[0,Math.cos(rx),-Math.sin(rx)],[0,Math.sin(rx),Math.cos(rx)]];
  const Ry=[[Math.cos(ry),0,Math.sin(ry)],[0,1,0],[-Math.sin(ry),0,Math.cos(ry)]];
  return mul(Rx,Ry);
}
/* "Solved by colour" — every face one colour — so a solve in ANY orientation (and slice/center
   shuffles) counts, unlike the exact-home isSolved(). */
const SOLVE_DIRS = [{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
function cubeSolvedByColor(cube) {
  return SOLVE_DIRS.every(d => { const cols = cube.cubies().map(c => facing(c, d)).filter(x => x!==null);
    return cols.length>0 && cols.every(x => x===cols[0]); });
}
/* keyboard moves are CAMERA-RELATIVE: each key names a screen direction; we turn whatever
   face/slice/axis currently points that way (so F = the face toward you, U = the top face). */
const KEYSPEC = {
  r:{d:{x:1,y:0,z:0},  k:'face'},  l:{d:{x:-1,y:0,z:0}, k:'face'},
  u:{d:{x:0,y:-1,z:0}, k:'face'},  d:{d:{x:0,y:1,z:0},  k:'face'},
  f:{d:{x:0,y:0,z:1},  k:'face'},  b:{d:{x:0,y:0,z:-1}, k:'face'},
  m:{d:{x:-1,y:0,z:0}, k:'slice'}, e:{d:{x:0,y:1,z:0},  k:'slice'}, s:{d:{x:0,y:0,z:1}, k:'slice'},
  x:{d:{x:1,y:0,z:0},  k:'rot'},   y:{d:{x:0,y:-1,z:0}, k:'rot'},   z:{d:{x:0,y:0,z:1},  k:'rot'},
};
function makeCubeControls(cube, cubeEl, sceneEl, opts={}) {
  const DEF_RX=-30, DEF_RY=-18;   // face-up 3/4: more top (white), less of the right face
  let rx=DEF_RX, ry=DEF_RY, mode=null, sx=0, sy=0, downFace=null;
  let enabled=false, dragTurns=false, keysActive=false;   // orbit when enabled; sticker-drag turns only if dragTurns; keyboard only if keysActive
  const faceMap = new Map();
  const apply = () => { cubeEl.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; };
  /* after an orbit, settle to the nearest face-up 3/4 view (top/front/right visible): pitch ±|DEF_RX|, yaw on the DEF_RY+90k grid */
  function snapView() {
    const tx = rx<=0 ? DEF_RX : -DEF_RX, ty = Math.round((ry-DEF_RY)/90)*90 + DEF_RY;
    if (Math.abs(tx-rx)<0.4 && Math.abs(ty-ry)<0.4) { rx=tx; ry=ty; apply(); return; }
    const x0=rx, y0=ry; let t0=null;
    const step=now=>{ if(t0===null)t0=now; const k=Math.min(1,(now-t0)/200), e=1-Math.pow(1-k,3);
      rx=x0+(tx-x0)*e; ry=y0+(ty-y0)*e; apply(); if(k<1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function rebuildMap() { faceMap.clear(); cube.cubies().forEach(c => [...c.el.children].forEach((fe,i) => faceMap.set(fe, {c, ln:FACE_N[i]}))); }
  const project = a => { const S = mvVec(viewRot(rx,ry), a); return {x:S.x, y:S.y}; };
  async function doTurn(df, dx, dy) {
    if (busy) return;
    const c = df.c, n = mvVec(c.ori, df.ln);                       // face's current world-local normal
    const nAxis = Math.abs(n.x)>0.5?'x' : Math.abs(n.y)>0.5?'y' : 'z';
    const inPlane = ['x','y','z'].filter(k=>k!==nAxis).map(k=>PAXES[k]);
    const PRIO = { y:1.35, x:1.15, z:1.0 };   // bias ambiguous drags toward E/Y > M/X > S/Z rotations (most→least common)
    let best=null, ba=-1, bs=1;
    inPlane.forEach(a => { const P=project(a); const d=dx*P.x+dy*P.y;
      const rv=cross(n,a), rax=Math.abs(rv.x)>=Math.abs(rv.y)&&Math.abs(rv.x)>=Math.abs(rv.z)?'x':Math.abs(rv.y)>=Math.abs(rv.z)?'y':'z';
      const score=Math.abs(d)*(PRIO[rax]||1);   // weight by the rotation AXIS this drag would produce
      if (score>ba) { ba=score; best=a; bs=Math.sign(d)||1; } });
    const u = { x:best.x*bs, y:best.y*bs, z:best.z*bs };
    const r = cross(n, u);
    const axis = Math.abs(r.x)>0.5?'x' : Math.abs(r.y)>0.5?'y' : 'z';
    const angle = 90 * (r[axis]>0 ? 1 : -1), lvl = c.pos[axis];
    if (opts.onTurnStart) opts.onTurnStart();
    busy = true;
    await cube.animateMove({ axis, angle, sel: p => p[axis]===lvl });   // sel receives a cubie position
    busy = false;
    if (opts.onTurn) opts.onTurn({ axis, angle, lvl });
  }
  sceneEl.addEventListener('pointerdown', e => {
    if (!enabled) return;
    const fe = e.target.closest('.face');
    sx=e.clientX; sy=e.clientY;
    mode = (fe && faceMap.has(fe) && dragTurns) ? 'turn' : 'orbit';   // keyboard mode: sticker drag only orbits
    downFace = mode==='turn' ? faceMap.get(fe) : null;
    try { sceneEl.setPointerCapture(e.pointerId); } catch(_) {}
  });
  sceneEl.addEventListener('pointermove', e => {
    if (!enabled || !mode) return;
    const dx=e.clientX-sx, dy=e.clientY-sy;
    if (mode==='orbit') { ry += dx*0.5; rx -= dy*0.5; apply(); sx=e.clientX; sy=e.clientY; return; }   // free tumble (no gyro-lock) → any cross colour
    if (Math.hypot(dx,dy) < 10) return;              // need a deliberate drag to turn
    mode=null; doTurn(downFace, dx, dy);             // one turn per drag
  });
  const end = e => { const wasOrbit = mode==='orbit'; if (mode){ try{ sceneEl.releasePointerCapture(e.pointerId); }catch(_){} } mode=null; if (wasOrbit) snapView(); };
  sceneEl.addEventListener('pointerup', end);
  sceneEl.addEventListener('pointercancel', end);
  sceneEl.addEventListener('dblclick', () => { if (enabled) { rx=DEF_RX; ry=DEF_RY; apply(); } });
  /* keyboard moves — only in keyboard mode, when this cube is the active/visible one */
  const keysOn = () => keysActive && (opts.isActive ? opts.isActive() : true);
  async function keyMove(kc, suffix) {                    // kc = key char; camera-relative
    if (busy) return;
    const spec = KEYSPEC[kc]; if (!spec) return;
    const loc = mvVec(T(viewRot(rx, ry)), spec.d);        // screen direction → current cube-local axis
    const ax = Math.abs(loc.x)>=Math.abs(loc.y) && Math.abs(loc.x)>=Math.abs(loc.z) ? 'x'
             : Math.abs(loc.y)>=Math.abs(loc.z) ? 'y' : 'z';
    const sign = loc[ax] >= 0 ? 1 : -1;
    let angle = sign*90; if (suffix==='2') angle=180; else if (suffix==="'") angle=-angle;
    const mv = spec.k==='rot' ? { axis:ax, angle, whole:true }
             : { axis:ax, angle, sel:p => p[ax] === (spec.k==='slice' ? 0 : sign) };   // 3×3 coords −1/0/1
    if (opts.onTurnStart) opts.onTurnStart();
    busy = true; await cube.animateMove(mv); busy = false;
    if (opts.onTurn) opts.onTurn();
  }
  document.addEventListener('keydown', e => {
    if (!keysOn() || e.metaKey || e.altKey) return;
    if (e.key==='Delete') { e.preventDefault(); if (opts.onReset) opts.onReset(); return; }   // Del = reset
    const kc = e.key.toLowerCase(); if (!KEYSPEC[kc]) return;
    e.preventDefault();                                   // also suppresses Ctrl+R/Ctrl+S etc.
    keyMove(kc, e.ctrlKey ? '2' : e.shiftKey ? "'" : '');   // Ctrl = double, Shift = prime
  });
  rebuildMap();
  function setInteract({ drag=false, keys=false } = {}) {
    dragTurns = drag; keysActive = keys; enabled = drag || keys;
    if (enabled) { rebuildMap(); apply(); } else { rx=DEF_RX; ry=DEF_RY; cubeEl.style.transform=''; }
  }
  return { rebuildMap, setInteract, recenter: () => { rx=DEF_RX; ry=DEF_RY; apply(); } };
}

/* Trainer's "virtual cube" timer mode: solve the scrambled cube on screen. */
let trCubeMode = 'physical';
const trainerCubeEl = document.getElementById('trainerCube');
const trCubeControls = makeCubeControls(tcube, trainerCubeEl, trainerCubeEl.closest('.scene'), {
  isActive:    () => !trView.classList.contains('hidden') && CUBE_N[trPuzzle]===3,        // keyboard context: 3×3 only for now
  onTurnStart: () => { if (trCubeMode!=='physical') tryStartSolve(); },  // start timing on first move (gated by post-solve cooldown)
  onTurn:      () => { if (trCubeMode!=='physical' && trState==='running' && cubeSolvedByColor(tcube)) stopSolve(); },  // auto-stop when solved (any orientation)
  onReset:     () => resetAttempt(),                                                       // Del = restart the current scramble
});
function updateTrHint() {
  const h = document.getElementById('trHint'); if (!h) return;
  if (SIM_KEYS[trPuzzle] && trCubeMode==='virtual') {
    h.innerHTML = 'Solve the Pyraminx on screen: <b>drag a sticker</b> to turn its corner, or <b>keyboard</b> U L R B (the face in that screen spot) — <b>Shift</b> = prime, <b>Ctrl</b> = tip. <b>Drag the background</b> to rotate, <b>Del</b> restarts. Timer starts on your first move and stops when solved.'; return;
  }
  if (trPuzzle==='clock' && trCubeMode==='virtual') {
    h.innerHTML = 'Solve on screen: <b>click a pin</b> to raise/lower it, then <b>drag a corner clock</b> to turn it and the pinned clocks. <b>Del</b> restarts the scramble. Timer starts on your first turn and stops when solved.'; return;
  }
  h.innerHTML =
    trCubeMode==='mouse'    ? 'Solve on screen with the mouse: <b>drag a sticker</b> to turn, <b>drag the background</b> to rotate (double-click to recentre). Timer starts on your first move and stops when solved, in any orientation.' :
    trCubeMode==='keyboard' ? 'Solve with the <b>keyboard</b> (3×3): R L U D F B · slices M E S · rotations x y z — hold <b>Shift</b> for prime, <b>Ctrl</b> for double. <b>Del</b> restarts the scramble; drag the background to look around. Timer starts on your first move and stops when solved.' :
                              'Apply the scramble to your cube, then <b>tap the timer</b> or press <b>Space</b> to start/stop · <b>R</b> reveal · <b>N</b> next';
}
/* Keyboard solving for 3-D SVG sims (Pyraminx) — camera-relative, Alt = tip, drives the timer. */
document.addEventListener('keydown', e => {
  const sk = SIM_KEYS[trPuzzle];
  if (!sk || trCubeMode!=='virtual' || trView.classList.contains('hidden')) return;
  if (e.metaKey) return;                          // Ctrl is allowed through — it's the tip modifier for sims (handled in simKeyMove)
  if (e.key==='Delete') { e.preventDefault(); resetAttempt(); return; }
  simKeyMove(sk.sim, e, {
    onTurnStart: () => { tryStartSolve(); },
    onChange:    () => { trainerSimEl.innerHTML = sk.sim.svg(); },
    onTurn:      () => { if (trState==='running' && sk.sim.isSolved()) stopSolve(); },
  });
});
/* Interactive Clock solving in the trainer (Virtual mode): click pins, drag corners; drives the timer. */
const clockActive = () => trPuzzle==='clock' && trCubeMode==='virtual' && !trView.classList.contains('hidden');
(() => { let drag=null;
  trainerSimEl.addEventListener('pointerdown', e => {
    if (!clockActive()) return;
    const pin = e.target.closest('[data-pin]');
    if (pin) { clockSim.togglePin(pin.dataset.pin); trainerSimEl.innerHTML=clockSim.svg(); return; }
    const corner = e.target.closest('[data-corner]');
    if (corner) { const r=corner.getBoundingClientRect();
      drag={ key:corner.dataset.corner, side:corner.dataset.side==='B'?'back':'front', cx:r.left+r.width/2, cy:r.top+r.height/2, acc:0, applied:0 };
      drag.last = Math.atan2(e.clientY-drag.cy, e.clientX-drag.cx);
      try{ trainerSimEl.setPointerCapture(e.pointerId); }catch(_){} }
  });
  trainerSimEl.addEventListener('pointermove', e => {
    if (!drag) return;
    const a = Math.atan2(e.clientY-drag.cy, e.clientX-drag.cx);
    let dd = a - drag.last; while (dd>Math.PI) dd-=2*Math.PI; while (dd<-Math.PI) dd+=2*Math.PI;
    drag.acc += dd * CLOCK_SENS; drag.last = a;
    const hours = Math.round(drag.acc / (Math.PI/6));
    if (hours !== drag.applied) {
      tryStartSolve();
      clockSim.turn(drag.side, drag.key, hours-drag.applied); drag.applied=hours; trainerSimEl.innerHTML=clockSim.svg();
      if (trState==='running' && clockSim.isSolved()) stopSolve();
    }
  });
  const end=()=>{ drag=null; }; trainerSimEl.addEventListener('pointerup', end); trainerSimEl.addEventListener('pointercancel', end);
})();
document.addEventListener('keydown', e => { if (clockActive() && e.key==='Delete') { e.preventDefault(); resetAttempt(); } });
/* Interactive Redi solving in the trainer (Virtual mode): click a corner sticker to twist it (Shift = counter-clockwise). */
trainerSimEl.addEventListener('pointerdown', e => {
  if (trPuzzle!=='redi' || trCubeMode!=='virtual' || trView.classList.contains('hidden')) return;
  const cn = e.target.closest('[data-corner]'); if (!cn) return;
  tryStartSolve();
  rediSim.twist(+cn.dataset.corner, e.shiftKey); trainerSimEl.innerHTML = rediSim.svg();
  if (trState==='running' && rediSim.isSolved()) stopSolve();
});

/* ================================================================
   NOTATION LESSON
   ================================================================ */
let usePrime=false, useDouble=false, lastPlay=null;
const btnPrime=document.getElementById('mPrime'), btnDouble=document.getElementById('mDouble');
btnPrime.onclick  = () => { usePrime=!usePrime; btnPrime.classList.toggle('on',usePrime); };
btnDouble.onclick = () => { useDouble=!useDouble; btnDouble.classList.toggle('on',useDouble); };
async function playNotation(move, btn) {
  if (busy) return; busy=true;
  let angle = move.angle; if (usePrime) angle=-angle; if (useDouble) angle=180;
  document.getElementById('roNotation').textContent = move.id + (useDouble?'2':'') + (usePrime?'′':'');
  document.getElementById('roName').textContent = move.name;
  document.getElementById('roDesc').textContent = move.desc;
  document.querySelectorAll('.move.active').forEach(e=>e.classList.remove('active'));
  if (btn) btn.classList.add('active');
  lastPlay = move; ncube.reset();
  await ncube.animateMove({axis:move.axis, angle, sel:move.sel, whole:move.whole}, {dim:true, dur:DUR_NOTE});
  busy=false;
}
const moveList = document.getElementById('moveList');
groups.forEach(g => {
  const t=document.createElement('div'); t.className='group-title'; t.textContent=g.title;
  const b=document.createElement('p');   b.className='group-blurb'; b.textContent=g.blurb;
  const row=document.createElement('div'); row.className='move-row';
  g.moves.forEach(m => { const btn=document.createElement('button'); btn.className='move'; btn.textContent=m.id; btn.onclick=()=>playNotation(m,btn); row.appendChild(btn); });
  moveList.append(t,b,row);
});
document.getElementById('replay').onclick = () => { if (lastPlay) playNotation(lastPlay); };
document.getElementById('reset').onclick  = () => { if (!busy) ncube.reset(); };

/* ================================================================
   LESSON VIEW (anatomy highlighter / algorithm player)
   ================================================================ */
const lessonText = document.getElementById('lessonText');
const algoControls = document.getElementById('algoControls');
const hlControls = document.getElementById('hlControls');
const algoNote = document.getElementById('algoNote');
document.getElementById('lsPlay').onclick  = () => curLessonPlayer.play();
document.getElementById('lsStep').onclick  = () => curLessonPlayer.step();
document.getElementById('lsReset').onclick = () => curLessonPlayer.reset();
function setHighlight(type, btn) {
  hlControls.querySelectorAll('.ctl').forEach(b=>b.classList.toggle('on', b===btn));
  lcube.highlight(c => { if (type==='all') return true;
    const n = Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z);
    return type==='center'? n===1 : type==='edge'? n===2 : n===3; });
}
hlControls.querySelectorAll('[data-hl]').forEach(b => b.onclick = () => setHighlight(b.dataset.hl, b));

function renderLesson(path) {
  const L = LESSONS[path];
  const pz = path.split('/')[0];
  const iSim = (!L.sim && SIM[pz]) ? SIM[pz] : null;            // auto-embed the interactive 3-D sim (Pyraminx/Skewb/Megaminx/Clock)
  const hasSim = !!L.sim || !!iSim;
  if (!hasSim) lcube.rebuild(CUBE_N[pz] || 3);                  // lesson cube matches the puzzle (2×2 … 7×7)
  const view = document.getElementById('view-lesson');
  view.classList.toggle('text-only', L.type==='text' && !iSim);
  view.classList.toggle('has-sim', hasSim);                     // SVG sim instead of the 3-D cube
  lessonText.innerHTML = '';
  const h=document.createElement('h2'); h.textContent=L.title; lessonText.appendChild(h);
  (L.intro||[]).forEach(p => { const el=document.createElement('p'); el.innerHTML=p; lessonText.appendChild(el); });
  if (iSim) {                                                   // view-only puzzle embedded in the lesson; it plays the listed algorithms
    clearTimeout(lessonAlgTimer);
    lessonSim = iSim; algoControls.classList.add('hidden'); hlControls.classList.add('hidden'); lessonSimCtl.classList.remove('hidden');
    lessonSim.reset(); if (lessonSim.recenter) lessonSim.recenter(); renderLessonSim();
    lessonSimHintEl.innerHTML = lessonSimHintFor(pz);
    const firstRow = lessonText.querySelector('.alg-ref-row');   // auto-play the first algorithm the lesson lists
    if (firstRow) { firstRow.classList.add('playing'); playLessonAlg(firstRow.querySelector('code').textContent); }
    return;
  }
  lessonSim = null; lessonSimCtl.classList.add('hidden');
  if (L.type === 'text') return;
  if (L.type === 'anatomy') {
    algoControls.classList.add('hidden'); hlControls.classList.remove('hidden');
    lcube.reset(); setHighlight('all', hlControls.querySelector('[data-hl="all"]'));
  } else { // algo (cube or sim)
    hlControls.classList.add('hidden'); algoControls.classList.remove('hidden');
    curLessonPlayer = L.sim ? simLessonPlayer : lessonPlayer;
    const sections = L.sections || [{ head:null, algs:L.algs }];
    const mvStr = a => Array.isArray(a.moves) ? a.moves.join(' ') : a.moves;
    const allChips = []; let first=null, firstChip=null;
    sections.forEach(sec => {
      if (sec.head) { const hh=document.createElement('div'); hh.className='alg-sec'; hh.textContent=sec.head; lessonText.appendChild(hh); }
      const wrap=document.createElement('div'); wrap.className='alg-list';
      sec.algs.forEach(a => {
        const chip=document.createElement('button'); chip.className='alg-chip';
        chip.innerHTML = `<b>${a.name}</b><span class="mono">${fmtAlg(a.moves)}</span>`;
        chip.onclick = () => { allChips.forEach(c=>c.classList.remove('sel')); chip.classList.add('sel'); curLessonPlayer.arm(a.moves); algoNote.textContent=a.note||''; };
        wrap.appendChild(chip); allChips.push(chip); if (!first){ first=a; firstChip=chip; }
      });
      lessonText.appendChild(wrap);
    });
    firstChip.classList.add('sel'); curLessonPlayer.arm(first.moves); algoNote.textContent = first.note || '';
  }
}

/* ================================================================
   ALGORITHM SHEET (grid of case cards w/ auto diagrams)
   ================================================================ */
const sheetIntro = document.getElementById('sheetIntro');
const sheetGrid  = document.getElementById('sheetGrid');
const diagramFor = (kind, setup) => kind==='zbll' ? zbllSVG(setup) : kind==='pll' ? pllSVG(setup) : kind==='cll' ? cll2SVG(setup) : ollSVG(setup);   // setup = scramble that produces the case

/* ---- verify a user-entered algorithm actually solves a sheet case ---------------
   Each sheet has a GOAL describing what "solved" means for that case:
     'solved' (PLL/ZBLL)  – whole cube solved (centre orientation ignored).
     'orient' (OLL)       – F2L intact + every U-layer piece shows U on top.
     'coll'               – F2L intact + LL corners home + LL edges oriented.
     'cmll'               – both Roux blocks intact + LL corners home.
   We set up the case (invertSeq(primary)), then try every holding orientation +
   recognition AUF, and accept if the alg reaches the goal under any finish orientation. */
const sheetGoal = L => L.goal || (L.kind === 'oll' ? 'orient' : 'solved');
const _ccOrients = (() => { const ups=['','x2','x',"x'","y x'","y' x'"], spin=['','y','y2',"y'"], o=[];
  ups.forEach(u => spin.forEach(s => o.push((u + ' ' + s).trim()))); return o; })();
const _ccType = c => { const n = Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z); return n===1?'center':n===2?'edge':'corner'; };
const _ccHome = c => c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z && JSON.stringify(c.ori)===JSON.stringify(I3);
const _ccPos  = c => c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z;
const _ccUP = { x:0, y:-1, z:0 };
function _ccGoal(goal, st) {
  const cs = st.cubies();
  const f2l = () => cs.every(c => _ccType(c)==='center' ? _ccPos(c) : (c.home.y===-1 ? true : _ccHome(c)));
  if (goal === 'orient') return f2l() && cs.filter(c => c.pos.y===-1 && _ccType(c)!=='center').every(c => facing(c,_ccUP)==='U');
  if (goal === 'coll')   return f2l() && cs.filter(c => c.home.y===-1 && _ccType(c)==='corner').every(_ccHome)
                                       && cs.filter(c => c.pos.y===-1 && _ccType(c)==='edge').every(c => facing(c,_ccUP)==='U');
  if (goal === 'cmll')   return cs.filter(c => Math.abs(c.home.x)===1 && (c.home.y===0||c.home.y===1)).every(_ccHome)
                                       && cs.filter(c => c.home.y===-1 && _ccType(c)==='corner').every(_ccHome);
  if (goal === 'corners') return cs.filter(c => _ccType(c)==='corner').every(_ccHome);   // 2×2 (CLL/EG): all corners home, ignore edges+centres
  return cs.every(c => _ccType(c)==='center' ? _ccPos(c) : _ccHome(c));   // 'solved' (ignore centre orientation)
}
/* returns 'ok' | 'notation' | 'wrongcase' */
function algSolvesCase(goal, primary, candidate) {
  let toks; try { toks = tokenize(candidate); } catch (e) { return 'notation'; }
  if (!toks.length) return 'notation';
  try { toks.forEach(t => parse(t)); } catch (e) { return 'notation'; }     // unknown move token (incl. wide/slice/rotation all OK)
  const invP = invertSeq(primary);
  for (const hold of _ccOrients) { const ht = hold ? tokenize(hold) : null;
    for (const pre of ['','U','U2',"U'"]) {
      const st = makeState(); st.reset();            // base = case + hold + recognition AUF + candidate, built once
      try { st.applyTokens(invP); if (ht) st.applyTokens(ht); if (pre) st.applyTokens(tokenize(pre)); st.applyTokens(toks); }
      catch (e) { continue; }
      for (const O of _ccOrients) {                  // accept if solved under any whole-cube finish orientation
        const ot = O ? tokenize(O) : null;
        if (ot) st.applyTokens(ot);
        const reached = _ccGoal(goal, st);
        if (ot) st.applyTokens(invertSeq(ot));        // integer matrices → exact revert
        if (reached) return 'ok';
      }
    }
  }
  return 'wrongcase';
}

/* wrap recognised fingertrick "triggers" (sexy move, sledgehammer, insert triggers) in parentheses,
   the way algs are conventionally written. Purely cosmetic — the stored move list is unchanged. */
const TRIGGERS = [
  "R U R' U'", "R' U' R U", "R U' R' U", "R' U R U'",            // sexy + variants
  "L' U' L U", "L U L' U'", "L U' L' U", "L' U L U'",
  "U R U' R'", "U' R' U R", "U R' U' R", "U' R U R'", "U L' U' L", "U' L U L'",
  "R' F R F'", "F R' F' R", "R F R' F'", "F R F' R'",            // sledgehammer + variants
  "L F' L' F", "F' L F L'", "L' F L F'", "F L' F' L",
  "R U R'", "R U' R'", "R U2 R'", "R' U R", "R' U' R", "R' U2 R", // 3-move insert triggers
  "L' U L", "L' U' L", "L' U2 L", "L U L'", "L U' L'", "L U2 L'",
].map(s => s.split(' '));
TRIGGERS.sort((a, b) => b.length - a.length);                    // greedy match prefers the longest trigger
function groupTriggers(alg) {
  const toks = (Array.isArray(alg) ? alg.slice() : String(alg).trim().split(/\s+/)).filter(Boolean);
  const out = []; let i = 0;
  while (i < toks.length) {
    let m = null;
    for (const t of TRIGGERS) { if (i + t.length <= toks.length && t.every((x, k) => x === toks[i+k])) { m = t; break; } }
    if (m) { out.push('(' + m.join(' ') + ')'); i += m.length; } else { out.push(toks[i++]); }
  }
  return out.join(' ');
}
const fmtAlg = m => groupTriggers(m).replace(/'/g, '′');
/* diagram setup for a case: invert the alg, then — if it left the cube rotated (an alg with an
   uncancelled whole-cube rotation, e.g. a one-handed V/Y perm with a lone x) — re-orient so the
   centres are back home, or the diagram reads the wrong face. No-op for net-rotationless algs. */
function caseSetup(alg) {
  const inv = invertSeq(alg);
  const llOff = st => { let n=0; st.cubies().forEach(c => {                    // # U-layer edges/corners not home
    if (c.home.y===-1 && (Math.abs(c.home.x)+Math.abs(c.home.z))>=1 &&
        !(c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z && JSON.stringify(c.ori)===JSON.stringify(I3))) n++; }); return n; };
  for (const O of _ccOrients) {
    const base = makeState(); base.reset();
    try { if (O) base.applyTokens(tokenize(O)); base.applyTokens(inv); } catch (e) { continue; }   // re-orient FIRST, then build the case
    const restHome = base.cubies().every(c => {                  // everything except the last-layer pieces must be home
      const n = Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z);
      if (n === 1) return c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z;   // centre: position only
      if (c.home.y === -1) return true;                          // a U-layer edge/corner is part of the case
      return c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z && JSON.stringify(c.ori)===JSON.stringify(I3);
    });
    if (!restHome) continue;
    let bk = 0, bll = 99;                                        // show the AUF with the fewest disturbed LL pieces (cleanest case)
    for (let k = 0; k < 4; k++) { const st = makeState(); st.reset(); if (O) st.applyTokens(tokenize(O)); st.applyTokens(inv);
      for (let j = 0; j < k; j++) st.applyTokens(['U']); const ll = llOff(st); if (ll < bll) { bll = ll; bk = k; } }
    return (O ? tokenize(O) : []).concat(inv).concat(Array(bk).fill('U'));
  }
  return inv;
}
function renderSheet(path) {
  const L = LESSONS[path], set = ALG_SETS[L.set], goal = sheetGoal(L);
  sheetIntro.innerHTML = `<h2>${L.title}</h2>` + (L.intro||[]).map(p=>`<p>${p}</p>`).join('')
    + `<p class="learn-hint"><b>Right-click</b> a case to mark progress (⚫→🟡→🟢). Click <b>⋮</b> on a case to browse algorithms or add your own.</p>`;
  sheetGrid.innerHTML = '';
  set.forEach(a => {
    const built = [a.moves, ...(a.alts || [])];        // shipped algorithm + any verified alternatives
    const inList = alg => built.includes(alg) || getCustomAlgs(L.set, a.name).includes(alg);
    let current = (() => { const p = getAlgPref(L.set, a.name); return p && inList(p) ? p : a.moves; })();
    const card = document.createElement('button'); card.className = 'case-card learn-' + getLearn(L.set, a.name);
    card.innerHTML = `<span class="learn-dot"></span>
      <div class="case-dia">${diagramFor(L.kind, caseSetup(a.moves))}</div>
      <div class="case-name">${a.name}</div>
      <div class="case-alg"></div>
      <span class="case-menubtn" title="Choose an algorithm or add your own">⋮</span>`
      + (a.alt ? `<div class="case-alt">${a.alt.replace(/'/g,'′')}</div>` : '');
    const algEl = card.querySelector('.case-alg');
    const showAlg = () => { algEl.textContent = fmtAlg(current); };
    showAlg();
    const selectCard = () => { sheetGrid.querySelectorAll('.case-card').forEach(c=>c.classList.remove('sel')); card.classList.add('sel'); };
    card.onclick = () => { selectCard(); sheetPlayer.arm(current); sheetPlayer.play(); };
    card.querySelector('.case-menubtn').onclick = e => {
      e.stopPropagation();
      openAlgMenu(card.querySelector('.case-menubtn'), {
        goal, set: L.set, name: a.name, primary: a.moves, built, getCurrent: () => current,
        onChoose: alg => { current = alg; setAlgPref(L.set, a.name, alg === a.moves ? null : alg); showAlg(); selectCard(); sheetPlayer.arm(alg); sheetPlayer.play(); },
      });
    };
    card.addEventListener('contextmenu', e => { e.preventDefault(); const s = cycleLearn(L.set, a.name);
      card.classList.remove('learn-0','learn-1','learn-2'); card.classList.add('learn-' + s); });
    sheetGrid.appendChild(card);
  });
  if (set[0]) { const p = getAlgPref(L.set, set[0].name); sheetPlayer.arm(p && [set[0].moves, ...(set[0].alts||[]), ...getCustomAlgs(L.set, set[0].name)].includes(p) ? p : set[0].moves); }
}

/* ---- ⋮ algorithm menu: browse every algorithm for a case (JPerm-style), pick a preferred
   one, or type your own — the simulator verifies it solves the case before saving. ---- */
let _amEl = null, _amClose = null;
function closeAlgMenu() { if (_amEl) { _amEl.remove(); _amEl = null; } if (_amClose) { document.removeEventListener('pointerdown', _amClose); _amClose = null; } }
function openAlgMenu(anchor, cfg) {
  closeAlgMenu();
  const fmt = fmtAlg;
  const el = document.createElement('div'); el.className = 'algmenu';
  el.innerHTML = `<div class="algmenu-head">${cfg.name} — choose an algorithm</div>
    <div class="algmenu-list"></div>
    <div class="algmenu-add">
      <input class="algmenu-in" placeholder="Add your own (e.g. R U R′ U′)…" spellcheck="false" autocapitalize="off" autocomplete="off">
      <button class="algmenu-addbtn" type="button">Add</button>
    </div>
    <div class="algmenu-msg"></div>`;
  document.body.appendChild(el);
  const r = anchor.getBoundingClientRect();
  el.style.left = Math.max(8, Math.min(r.left - 20, window.innerWidth - el.offsetWidth - 12)) + 'px';
  el.style.top  = (r.bottom + 6 + window.scrollY) + 'px';
  const listEl = el.querySelector('.algmenu-list'), inEl = el.querySelector('.algmenu-in'), msgEl = el.querySelector('.algmenu-msg');
  function renderList() {
    listEl.innerHTML = '';
    const rows = [...cfg.built.map((m, i) => ({ alg: m, custom: false, def: i === 0 })),
                  ...getCustomAlgs(cfg.set, cfg.name).map(m => ({ alg: m, custom: true }))];
    rows.forEach(({ alg, custom, def }) => {
      const row = document.createElement('div'); row.className = 'algmenu-row' + (alg === cfg.getCurrent() ? ' active' : '');
      row.innerHTML = `<span class="algmenu-alg">${fmt(alg)}</span>`
        + (custom ? `<span class="algmenu-tag you">yours</span><button class="algmenu-del" title="Remove this algorithm">✕</button>`
                  : (def ? `<span class="algmenu-tag">default</span>` : ''));
      row.querySelector('.algmenu-alg').onclick = () => { cfg.onChoose(alg); renderList(); };
      const del = row.querySelector('.algmenu-del');
      if (del) del.onclick = ev => { ev.stopPropagation(); removeCustomAlg(cfg.set, cfg.name, alg); if (cfg.getCurrent() === alg) cfg.onChoose(cfg.primary); renderList(); };
      listEl.appendChild(row);
    });
  }
  renderList();
  const submit = () => {
    const norm = inEl.value.trim().replace(/[′’]/g, "'").replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();   // accept the pretty prime ′ and grouping parens
    if (!norm) return;
    const res = algSolvesCase(cfg.goal, cfg.primary, norm);
    if (res === 'ok') {
      addCustomAlg(cfg.set, cfg.name, norm); inEl.value = '';
      msgEl.textContent = '✓ Added — the simulator confirmed it solves this case.'; msgEl.className = 'algmenu-msg ok';
      cfg.onChoose(norm); renderList();
    } else if (res === 'notation') {
      msgEl.textContent = 'Unrecognized notation — use face moves like R U R′ U′ (no wide moves).'; msgEl.className = 'algmenu-msg err';
    } else {
      msgEl.textContent = "That doesn't solve this case. Double-check your algorithm."; msgEl.className = 'algmenu-msg err';
    }
  };
  el.querySelector('.algmenu-addbtn').onclick = submit;
  inEl.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };
  inEl.focus();
  _amEl = el;
  _amClose = e => { if (!el.contains(e.target) && e.target !== anchor) closeAlgMenu(); };
  setTimeout(() => document.addEventListener('pointerdown', _amClose), 0);
}

/* ================================================================
   TRAINER — timer + status filter + frequency + stats, with our own
   scramble generator (AUF-randomized so the case can't just be
   reversed) and an optional whole-solve mode.
   ================================================================ */
const trDiagram = document.getElementById('trainerDiagram');
const trAnswer  = document.getElementById('trainerAnswer');
const trTimerEl = document.getElementById('trainerTimer');
const trStatsEl = document.getElementById('trainerStats');
const trHistEl  = document.getElementById('trainerHistory');
const trStatusEl= document.getElementById('trainerStatus');
const trScrambleEl = document.getElementById('trainerScramble');
const trView = document.getElementById('view-trainer');
const STATUS_LABEL = ['Unlearned','Learning','Finished'];
const STATUS_BG    = ['#3a3f55','#ffcf5a','#25c277'];
let trSet=[], trKind='pll', trSetId='pll', trPuzzle='3x3', trFilter='all', trProb='balanced', trMode='step', trCount=false;
let trCur=null, trScramble=[], trSolves=[], trState='idle', trStart=0, trRAF=0;
let trModeDefs=null, trKey=null;   // multi-mode trainers (3×3 Timer): mode list + per-mode storage key

/* ---- solve-time helpers + WCA averages.  FMC stores a move COUNT in `ms`, shown as a plain number. ---- */
const fmtNum = v => trCount ? String(Math.round(v)) : fmt(v);
const effMs = s => s.p==='dnf' ? null : s.ms + (s.p===2 ? 2000 : 0);   // null = DNF
const fmtSolve = s => s.p==='dnf' ? 'DNF' : fmtNum(effMs(s)) + (s.p===2 ? '+' : '');
function avgN(solves, end, n) {                  // WCA average of n solves ending at index `end`
  if (end+1 < n) return undefined;               // not enough solves yet
  const win = solves.slice(end-n+1, end+1).map(effMs);
  if (win.filter(x => x===null).length >= 2) return 'dnf';
  const v = win.map(x => x===null ? Infinity : x).sort((a,b)=>a-b).slice(1,-1);  // drop best & worst
  return v.reduce((a,b)=>a+b,0) / v.length;
}
const fmtAvg = x => x===undefined ? '—' : x==='dnf' ? 'DNF' : fmtNum(x);
const trMoves = a => Array.isArray(a.moves) ? a.moves.join(' ') : a.moves;
const fmt = ms => { const s = ms/1000; if (s < 60) return s.toFixed(2);   // ≥1 min → M:SS.ss (e.g. 1:10.36)
  const m = Math.floor(s/60), r = s - m*60; return m + ':' + (r<10?'0':'') + r.toFixed(2); };
const rnd = n => Math.floor(Math.random()*n);
const showMoves = seq => seq.join(' ').replace(/'/g,'′');

/* ---- scramble generators (standard random-move technique) ---- */
const AUF = ['','U','U2',"U'"];
function caseScramble(algMoves) {                 // case in a random orientation — reversing it is NOT the clean alg
  let s = invertSeq(algMoves);
  const pre = AUF[rnd(4)], post = AUF[rnd(4)];
  if (pre)  s = [pre].concat(s);
  if (post) s = s.concat(post);
  return s;
}
/* Shaped / non-cubic puzzles use their own standard scramble notations (no NxN renderer). */
function pyraScramble() {                           // Pyraminx: U L R B (±) then small tips
  const F=['U','L','R','B'], T=['u','l','r','b'], seq=[]; let last=null;
  const n = 8 + rnd(3);
  while (seq.length < n) { const f=F[rnd(4)]; if (f===last) continue; seq.push(f+(rnd(2)?"'":"")); last=f; }
  T.forEach(t => { if (rnd(3)) seq.push(t + (rnd(2)?"'":"")); });   // ~2/3 of tips, randomly
  return seq;
}
function skewbScramble() {                          // Skewb: U L R B (±)
  const F=['U','L','R','B'], seq=[]; let last=null; const n = 9 + rnd(3);
  while (seq.length < n) { const f=F[rnd(4)]; if (f===last) continue; seq.push(f+(rnd(2)?"'":"")); last=f; }
  return seq;
}
function megaScramble() {                           // Megaminx: 7 lines of R±±/D±± ×5 then U/U'
  const lines=[];
  for (let l=0;l<7;l++) { const row=[];
    for (let i=0;i<5;i++) { row.push('R'+(rnd(2)?'++':'--')); row.push('D'+(rnd(2)?'++':'--')); }
    row.push(rnd(2)?'U':"U'"); lines.push(row.join(' '));
  }
  return [lines.join('\n')];                        // single pre-wrapped block
}
/* ---- Non-WCA scramble generators (random-move). Non-WCA sizes have no official standard, so these
   are app-defined and labelled as such in each puzzle's pages; refine once real models exist. ---- */
function minxScrambleN(layers) {                    // Megaminx-family: R±±/D±± rows + U; inner-layer turns for >3 layers
  const lines=[];
  for (let l=0;l<7;l++) { const row=[];
    for (let i=0;i<5;i++){ row.push('R'+(rnd(2)?'++':'--')); row.push('D'+(rnd(2)?'++':'--')); }
    row.push(rnd(2)?'U':"U'"); lines.push(row.join(' ')); }
  if (layers>3) { const inner=[]; const n=(layers-3)*10;       // app-defined inner-layer turns: 2R±±, 3R±± … inward
    for (let i=0;i<n;i++){ const d=2+rnd(layers-2); inner.push(d+(rnd(2)?'R':'D')+(rnd(2)?'++':'--')); }
    lines.push(inner.join(' ')); }
  return [lines.join('\n')];
}
function pyraScrambleN(layers) {                    // Pyraminx-family: U/L/R/B faces, wide turns for inner layers, then tips
  const F=['U','L','R','B'], seq=[]; let last=null; const n = 8 + layers*5;
  while (seq.length < n) { const f=F[rnd(4)]; if (f===last) continue; last=f;
    const w = layers>3 ? 1+rnd(layers-2) : 1; const tok = w===1?f : w===2?f+'w' : w+f+'w';
    seq.push(tok + (rnd(2)?"'":"")); }
  ['u','l','r','b'].forEach(t => { if (rnd(3)) seq.push(t + (rnd(2)?"'":"")); });
  return seq;
}
function ctoScramble() {                            // Corner-Turning Octahedron: 6 vertices L R F B U D
  const V=['L','R','F','B','U','D'], M=['',"'",'2'], seq=[]; let last=null;
  while (seq.length < 18) { const v=V[rnd(6)]; if (v===last) continue; last=v; seq.push(v+M[rnd(3)]); }
  return seq;
}
function rediScramble() {                           // Redi: 4 top corners R L F B + 4 bottom r l f b
  const C=['R','L','F','B','r','l','f','b'], seq=[]; let last=null;
  while (seq.length < 18) { const c=C[rnd(8)]; if (c.toUpperCase()===(last||'').toUpperCase()) continue; last=c; seq.push(c+(rnd(2)?"'":"")); }
  return seq;
}
function skewbScrambleN(layers) {                   // Skewb-family: R L U B corner twists, wide (inner-cut) for Master/Elite
  const F=['R','L','U','B'], seq=[]; let last=null; const n = 8 + layers*4;
  while (seq.length < n) { const f=F[rnd(4)]; if (f===last) continue; last=f;
    const tok = layers>2 && rnd(2) ? f+'w' : f; seq.push(tok+(rnd(2)?"'":"")); }
  return seq;
}
/* Square-1 & Clock scrambles come from their simulators (legal moves; sim is left showing the state). */
const SHAPED_SCRAMBLE = { pyra:()=>pyraSim.scramble(), skewb:()=>skewbSim.scramble(), mega:()=>megaScramble(),   // proper WCA R++/D--/U notation (the SVG sim's single-face turns can't represent it)
                          sq1:()=>sqSim.scramble(), clock:()=>clockSim.scramble(),
                          // non-WCA (no sim): app-defined random-move generators
                          cto:()=>ctoScramble(), redi:()=>rediScramble(),
                          masterkilo:()=>minxScrambleN(4), giga:()=>minxScrambleN(5), elitekilo:()=>minxScrambleN(6), tera:()=>minxScrambleN(7),
                          profpyra:()=>pyraScrambleN(5), royalpyra:()=>pyraScrambleN(6),
                          masterskewb:()=>skewbScrambleN(3), eliteskewb:()=>skewbScrambleN(4), skewb7:()=>skewbScrambleN(7) };

function fullScramble(puzzle) {                    // whole-solve scramble in WCA format (proper move set, restriction & length)
  if (SHAPED_SCRAMBLE[puzzle]) return SHAPED_SCRAMBLE[puzzle]();
  const N = typeof puzzle === 'number' ? puzzle : (CUBE_N[puzzle] || 3);   // accept a raw N (e.g. from the Virtual Cube size dropdown)
  const faces = N===2 ? ['R','U','F'] : ['U','D','L','R','F','B'];   // 2×2 scrambles in <R,U,F>, like WCA
  const axis = {U:'y',D:'y',L:'x',R:'x',F:'z',B:'z'}, mods = ['',"'",'2'];
  const maxW = N<=3 ? 1 : N<=5 ? 2 : 3;            // 4–5: up to 2-wide (Rw); 6–7: up to 3-wide (3Rw)
  const base = { 2:11, 3:20, 4:45, 5:60, 6:80, 7:100 }[N] || 20;     // official WCA move counts
  const len = Math.round(base * ({short:0.65, normal:1, long:1.45}[PREFS.scrLen] || 1));
  /* WCA restriction: never the same face twice in a row, and never three moves in a row on one axis (e.g. R L R). */
  const seq = []; let pf = null, lastAx = null, prevAx = null;
  while (seq.length < len) {
    const f = faces[rnd(faces.length)];
    if (f === pf) continue;                                          // no repeated face
    if (axis[f] === lastAx && lastAx === prevAx) continue;           // no 3rd consecutive on the same axis
    const w = N<=3 ? 1 : 1 + rnd(maxW);                              // layer width → R / Rw / 3Rw
    const tok = w===1 ? f : w===2 ? f+'w' : w+f+'w';
    seq.push(tok + mods[rnd(3)]);
    prevAx = lastAx; lastAx = axis[f]; pf = f;
  }
  return seq;
}

function trPool() {
  if (trFilter==='all') return trSet.slice();
  const f = +trFilter; return trSet.filter(a => getLearn(trSetId, a.name) === f);
}
function pickCase() {
  let pool = trPool(); if (!pool.length) pool = trSet.slice();
  if (trProb==='realistic' && typeof PROBS!=='undefined' && PROBS[trKind]) {
    const w = pool.map(a => PROBS[trKind][a.name] || 1);
    let r = Math.random() * w.reduce((s,x)=>s+x,0);
    for (let i=0;i<pool.length;i++){ r -= w[i]; if (r<=0) return pool[i]; }
  }
  return pool[rnd(pool.length)];
}
function updateStatusPill() {
  if (!trCur) return;
  const s = getLearn(trSetId, trCur.name);
  trStatusEl.textContent = STATUS_LABEL[s]; trStatusEl.style.background = STATUS_BG[s];
  trStatusEl.style.color = s===0 ? '#cfd6f5' : '#06122e';
}
/* ---- WCA scrambles via the vendored cubing.js (offline, ./vendor/cubing). Full solves get official
   random-state scrambles; case trainers keep their own case generators. Async: shows "scrambling…"
   then fills in, with a graceful fallback to the local generator if cubing.js isn't loaded yet. ---- */
const WCA_EVENT = { '3x3':'333','2x2':'222','4x4':'444','5x5':'555','6x6':'666','7x7':'777',
  'oh':'333oh','3bld':'333bf','4bld':'444bf','5bld':'555bf','fmc':'333fm',
  'pyra':'pyram','skewb':'skewb','sq1':'sq1','clock':'clock',
  'fto':'fto','mpyra':'master_tetraminx','kilo':'kilominx',
  'pyramorphix':'222' };   // Pyramorphix is a 2×2 mechanism → official 2×2 scrambles
  // NB: Megaminx is intentionally absent — its SVG sim can't render WCA "R++/D--" notation, so it
  // falls back to its own (renderable) scramble generator. Re-add once a notation adapter exists.
/* WCA Clock notation (U3- R5+ … y2 …) → this sim's pin/turn tokens; front moves until y2, then back. */
const _CLK_F = {U:['UL,UR','UL'],R:['UR,DR','UR'],D:['DL,DR','DL'],L:['UL,DL','UL'],ALL:['UL,UR,DL,DR','UL'],UL:['UL','UL'],UR:['UR','UR'],DL:['DL','DL'],DR:['DR','DR']};
const _CLK_B = {U:['DL,DR','UL'],R:['UR,DR','UR'],D:['UL,UR','DL'],L:['UL,DL','UL'],ALL:['','UL']};
function wcaClockToSim(str) {
  const out = []; let side = 'F';
  for (const tok of String(str).trim().split(/\s+/)) {
    if (tok === 'y2') { side = 'B'; continue; }
    const m = tok.match(/^(UR|DR|DL|UL|ALL|U|R|D|L)(\d+)([+-])$/); if (!m) continue;
    const h = (m[3]==='-'?-1:1)*(+m[2]), map = (side==='F'?_CLK_F:_CLK_B)[m[1]]; if (!map) continue;
    out.push('('+map[0]+')'); if (h) out.push(`${side}:${map[1]}:${h}`);
  }
  return out;
}
/* cubing.js emits clock moves as edges→ALL→corners; reorder to the canonical TNoodle order
   (corners UR DR DL UL, then edges U R D L, then ALL) on each side of y2. The 9 front + 5 back
   moves are an independent basis (they commute), so this is purely cosmetic — identical state. */
function normalizeClockScramble(tokens) {
  const yi = tokens.indexOf('y2'); if (yi < 0) return tokens;             // not WCA notation → leave as-is
  const name = t => (t.match(/^(UR|DR|DL|UL|ALL|U|R|D|L)/) || [])[1];
  const ord = (arr, seq) => arr.slice().sort((a,b) => seq.indexOf(name(a)) - seq.indexOf(name(b)));
  return [...ord(tokens.slice(0,yi), ['UR','DR','DL','UL','U','R','D','L','ALL']), 'y2',
          ...ord(tokens.slice(yi+1), ['U','R','D','L','ALL'])];
}
/* a WCA scramble STRING → the token array each display engine expects */
function scrambleToTokens(puzzle, str) {
  if (puzzle === 'sq1') return String(str).match(/\([^)]*\)|\//g) || [];   // (a, b) tuples + slashes
  if (isRenderable(puzzle)) return tokenize(str);                          // NxN cubes
  if (puzzle === 'clock') return normalizeClockScramble(String(str).trim().split(/\s+/));   // canonical move order
  return String(str).trim().split(/\s+/);                                 // pyra / mega / skewb notation tokens
}
/* drive the on-screen SVG sim from trScramble (clock needs WCA→pin/turn; old saved tokens pass through) */
function setSimScramble() {
  if (trPuzzle === 'clock') { const t = trScramble, isWca = t.some(x => /^(UR|DR|DL|UL|ALL|U|R|D|L)\d/.test(x) || x === 'y2');
    clockSim.setTokens(isWca ? wcaClockToSim(t.join(' ')) : t); }
  else SIM[trPuzzle].setTokens(trScramble);
}
/* Megaminx scrambles are 7 rows, each ending in U/U′. Shrink the font so every row fits on ONE
   line at any width / aspect ratio (instead of wrapping mid-row). No-ops for single-line scrambles. */
function fitScramble() {
  const el = trScrambleEl;
  el.style.fontSize = ''; el.style.whiteSpace = '';                 // reset → other puzzles keep the CSS default
  if (!el.textContent.includes('\n')) return;                       // only the multi-line Megaminx scramble
  el.style.whiteSpace = 'pre';                                      // each row on its own line (don't wrap)
  if (el.clientWidth <= 0 || el.scrollWidth <= el.clientWidth) return;   // hidden, or already fits
  // Measure the element itself (so word-spacing/kerning are exact): first-estimate then fine-tune until it fits.
  let size = parseFloat(getComputedStyle(el).fontSize);
  size = Math.max(7, size * el.clientWidth / el.scrollWidth);
  el.style.fontSize = size + 'px';
  let guard = 0;
  while (el.scrollWidth > el.clientWidth && size > 7 && guard++ < 30) { size = Math.max(7, size - 0.3); el.style.fontSize = size + 'px'; }
}
window.addEventListener('resize', fitScramble);                     // keep rows fitting as the window/aspect changes
function applyScrambleDisplay() {
  if (isRenderable(trPuzzle)) { tcube.reset(); tcube.applyInstant(trScramble); }   // shaped puzzles have no 3-D renderer
  else if (SIM[trPuzzle] && trPuzzle!=='mega') { setSimScramble(); trainerSimEl.innerHTML = SIM[trPuzzle].svg(); }
  // Megaminx: WCA R++/D-- scramble can't drive the single-face-turn SVG sim → text-only (the sim stays in lessons/playground)
  trScrambleEl.textContent = showMoves(trScramble);
  fitScramble();                                                    // size multi-line (Megaminx) rows to fit
  trAnswer.classList.remove('show'); trAnswer.innerHTML = '';
  if (TWISTY_TIMER[trPuzzle] && trCubeMode==='virtual') buildTwistyTimer();   // load the fresh scramble into the 3-D model
}
let scrambleSeq = 0;                                  // guards async scrambles against rapid "new scramble" clicks
function newScramble() {
  if (trMode !== 'solve') {                           // case trainers: local case generator + diagram
    trCur = pickCase(); trScramble = caseScramble(trCur.moves);
    trDiagram.innerHTML = (trKind==='oll'||trKind==='pll')        // F2L etc. have no last-layer diagram → solve on the cube
      ? diagramFor(trKind, trScramble)
      : '<div class="dia-note">Solve the case<br>on the cube →</div>';
    updateStatusPill(); applyScrambleDisplay(); return;
  }
  trCur = null;
  const ev = WCA_EVENT[trPuzzle], seq = ++scrambleSeq;
  if (ev && typeof window.wcaScramble === 'function') {            // official WCA random-state scramble (async)
    trScrambleEl.textContent = 'scrambling…';
    window.wcaScramble(ev)
      .then(str => { if (seq===scrambleSeq) { trScramble = scrambleToTokens(trPuzzle, str); applyScrambleDisplay(); } })
      .catch(() => { if (seq===scrambleSeq) { trScramble = fullScramble(trPuzzle); applyScrambleDisplay(); } });
    return;
  }
  trScramble = fullScramble(trPuzzle); applyScrambleDisplay();     // fallback when cubing.js isn't ready
}
/* the current scramble as a re-applicable string (for saving with a solve) */
const curScramble = () => Array.isArray(trScramble) ? trScramble.join(' ') : (trScramble ? String(trScramble) : '');
/* load a saved scramble back into the trainer for another attempt (idles the timer, keeps the scramble fixed) */
function retryScramble(scr) {
  if (!scr) return;
  trState = 'idle'; cancelAnimationFrame(trRAF); trTimerEl.classList.remove('armed','inspecting'); trTimerEl.textContent = trCount ? '—' : '0.00';
  trCur = null;                                   // a fixed scramble, not a generated case
  trScramble = scrambleToTokens(trPuzzle, scr);
  if (trMode !== 'solve') trDiagram.innerHTML = (trKind==='oll'||trKind==='pll') ? diagramFor(trKind, trScramble) : '<div class="dia-note">Solve the case<br>on the cube →</div>';
  applyScrambleDisplay();
  trScrambleEl.classList.remove('flash'); void trScrambleEl.offsetWidth; trScrambleEl.classList.add('flash');   // brief cue
  trScrambleEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function trReveal() {
  if (!trCur) return;
  trAnswer.innerHTML = `<b>${trCur.name}</b><span class="mono">${fmtAlg(trMoves(trCur))}</span>`
    + (trCur.alt ? `<span class="mono alt">alt: ${trCur.alt.replace(/'/g,'′')}</span>` : '');
  trAnswer.classList.add('show');
}
async function trPlayAnswer() {                    // solve the on-screen scramble
  if (busy) return; busy = true;
  for (const t of invertSeq(trScramble)) await tcube.animateMove(tcube.parse(t));
  busy = false;
}
const statsKey = () => { const b = trKey || (trMode==='solve' ? trSetId + ':solve' : trSetId);
  return trCubeMode !== 'physical' ? b + ':virtual' : b; };   // virtual (on-screen) solves kept separate from physical — in history, stats & cloud
/* multi-mode trainers: resolve a mode's case set + apply it */
function f2lSet() { const L = LESSONS['3x3/cfop/f2l']; const out = [];
  (L && (L.sections || [{ algs:L.algs }]) || []).forEach(s => (s.algs||[]).forEach(a => out.push({ name:a.name, moves:a.moves }))); return out; }
const resolveSet = name => name==='f2l' ? f2lSet() : (ALG_SETS[name] || []);
function applyMode(def) {
  trSetId = 'timer:' + trPuzzle + ':' + def.id; trKey = trSetId;     // per-mode times + learn status
  if (def.solve) { trMode='solve'; trSet=[]; trKind='oll'; }
  else { trMode='step'; trSet = resolveSet(def.set); trKind = def.kind; }
  trView.classList.toggle('mode-solve', !!def.solve);
}
function renderStats() {
  const n = trSolves.length;
  if (!n) { trStatsEl.textContent = 'No solves yet'; return; }
  const singles = trSolves.map(effMs).filter(x => x!==null);
  const best = singles.length ? Math.min(...singles) : null;
  const bestLbl = trCount ? 'fewest' : 'best';
  trStatsEl.innerHTML = `Solves <b>${n}</b> · ${bestLbl} <b>${best!=null ? fmtNum(best) : '—'}</b>`
    + ` · ao5 <b>${fmtAvg(avgN(trSolves, n-1, 5))}</b> · ao12 <b>${fmtAvg(avgN(trSolves, n-1, 12))}</b>`;
}
/* per-column best (min) & worst (max) across the whole history, so the timer table can flag PBs.
   Lower is always better here (faster time / fewer moves). Only finite values count (DNF / not-enough excluded). */
function histExtremes() {
  const single=[], a5=[], a12=[];
  for (let i=0;i<trSolves.length;i++){
    const e=effMs(trSolves[i]); if (e!==null) single.push(e);
    const v5=avgN(trSolves,i,5);  if (typeof v5==='number') a5.push(v5);
    const v12=avgN(trSolves,i,12); if (typeof v12==='number') a12.push(v12);
  }
  const ext = arr => arr.length ? { best:Math.min(...arr), worst:Math.max(...arr) } : null;
  return { single:ext(single), a5:ext(a5), a12:ext(a12) };
}
const pbClass = (ext, val) => {                  // green for the best, red for the worst (skip worst if only one value)
  if (!ext || typeof val!=='number') return '';
  if (val===ext.best) return ' pb-best';
  if (val===ext.worst && ext.worst!==ext.best) return ' pb-worst';
  return '';
};
function renderHistory() {
  if (!trSolves.length) { trHistEl.innerHTML = ''; return; }
  const X = histExtremes();
  let rows = '';
  for (let i = trSolves.length-1; i >= 0; i--) {
    const s = trSolves[i];
    const e=effMs(s), v5=avgN(trSolves,i,5), v12=avgN(trSolves,i,12);
    rows += `<tr data-i="${i}">
      <td class="num">${i+1}</td>
      <td class="single click ${s.p==='dnf'?'dnf':''}${pbClass(X.single,e)}" data-i="${i}" title="Tap for penalties, scramble & retry">${fmtSolve(s)}</td>
      <td class="${pbClass(X.a5,v5).trim()}">${fmtAvg(v5)}</td>
      <td class="${pbClass(X.a12,v12).trim()}">${fmtAvg(v12)}</td></tr>`;
  }
  trHistEl.innerHTML = `<table class="times-table"><thead><tr><th>#</th><th>${trCount?'Moves':'Single'}</th><th>Ao5</th><th>Ao12</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function reloadTimes() { trSolves = getSolves(statsKey()); renderStats(); renderHistory(); }
function tick() { trTimerEl.textContent = PREFS.hideTimer ? 'solving…' : fmt(performance.now()-trStart); trRAF = requestAnimationFrame(tick); }
let trInspStart=0, trInspRAF=0, trPenalty=0;
let trCooldownUntil = 0;   // brief lockout after a solve so a still-held mouse can't auto-start the next virtual solve on reset
function startSolve() {
  const ae=document.activeElement; if (ae && ae!==document.body && ae.blur) ae.blur();   // drop focus off the Event/Mode dropdowns so a sloppy stop can't type-ahead-switch the puzzle (which would reset trState and lose the solve)
  trState='running'; trStart=performance.now(); trTimerEl.classList.remove('armed','inspecting'); tick(); }
function tryStartSolve() { if (trState!=='idle' || performance.now() < trCooldownUntil) return; startSolve(); }   // virtual-solve start, gated by the post-solve cooldown
function startInspection() { trState='inspecting'; trInspStart=performance.now(); trTimerEl.classList.remove('armed'); trTimerEl.classList.add('inspecting'); inspTick(); }
function inspTick() { const left = 15 - (performance.now()-trInspStart)/1000; trTimerEl.textContent = left<=0 ? '+'+(-left).toFixed(1) : left.toFixed(1); trInspRAF = requestAnimationFrame(inspTick); }
function endInspection() { const insp = (performance.now()-trInspStart)/1000; cancelAnimationFrame(trInspRAF); trPenalty = insp>17 ? 'dnf' : insp>15 ? 2000 : 0; startSolve(); }
function stopSolve() {
  if (trState !== 'running') return;   // ignore duplicate/late stops (e.g. several deferred twisty solved-fires queued before the first runs)
  cancelAnimationFrame(trRAF); trState='idle'; trTimerEl.classList.remove('armed');
  trCooldownUntil = performance.now() + 1000;   // ignore solve-starts for 1s (mouse is often still down through the reset)
  const rawMs = performance.now()-trStart;
  const p = trPenalty==='dnf' ? 'dnf' : trPenalty===2000 ? 2 : 0; trPenalty=0;
  addSolve(statsKey(), rawMs, p, curScramble());
  trTimerEl.textContent = p==='dnf' ? 'DNF' : fmt(rawMs + (p===2?2000:0)) + (p===2 ? ' +2' : '');
  renderStats(); renderHistory(); newScramble();
}
/* FMC: record the typed move count (or a DNF) instead of a stopwatch time. */
const countInput = document.getElementById('countInput');
function recordCount(dnf) {
  let v = parseInt(countInput.value, 10);
  if (!dnf && (!Number.isFinite(v) || v < 1)) { countInput.focus(); return; }
  addSolve(statsKey(), dnf ? 0 : v, dnf ? 'dnf' : 0, curScramble());
  countInput.value = ''; countInput.focus();
  renderStats(); renderHistory(); newScramble();
}
document.getElementById('countSubmit').onclick = () => recordCount(false);
document.getElementById('countDnf').onclick    = () => recordCount(true);
countInput.addEventListener('keydown', e => { if (e.key==='Enter') { e.preventDefault(); recordCount(false); } });
function trSkip() {
  if (trState==='running') cancelAnimationFrame(trRAF);
  if (trState==='inspecting') cancelAnimationFrame(trInspRAF);
  trState='idle'; trPenalty=0; trTimerEl.classList.remove('armed','inspecting'); trTimerEl.textContent='0.00';
  newScramble();
}
/* Del (keyboard mode): restart the SAME scramble — re-apply it and reset the timer to idle. */
function resetAttempt() {
  cancelAnimationFrame(trRAF); cancelAnimationFrame(trInspRAF);
  trState='idle'; trPenalty=0; trTimerEl.classList.remove('armed','inspecting'); trTimerEl.textContent='0.00';
  if (isRenderable(trPuzzle)) { tcube.reset(); tcube.applyInstant(trScramble); }
  else if (SIM[trPuzzle]) { SIM[trPuzzle].setTokens(trScramble); trainerSimEl.innerHTML = SIM[trPuzzle].svg(); }
}
/* N for the on-screen renderer. The challenge events ARE a real cube (OH/FMC/MBLD/3BLD = 3×3,
   4BLD = 4×4, 5BLD = 5×5), so they render and scramble exactly like that cube. Shaped puzzles
   (Pyraminx/Megaminx/Skewb/Square-1/Clock) are absent here — they have no 3-D renderer. */
const CUBE_N = { '2x2':2, '3x3':3, '4x4':4, '5x5':5, '6x6':6, '7x7':7,
                 'oh':3, '3bld':3, 'mbld':3, 'fmc':3, '4bld':4, '5bld':5,
                 'pyramorphix':2 };   // Pyramorphix is mechanically a 2×2 → reuse the cube engine as its (rough-shape) virtual model
const isRenderable = p => Object.prototype.hasOwnProperty.call(CUBE_N, p);
const isLLstep = () => trMode==='step' && (trKind==='oll' || trKind==='pll');

/* ---- Virtual 3-D timer: an interactive cubing.js model you solve on screen. Auto-starts on the first
   move and auto-stops when solved (via experimentalModel.currentPattern + a solved check). Offered for
   every non-WCA puzzle that has a 3-D model — TWISTY_TIMER is filled from PLAY_PUZZLES (twisty entries)
   after that list is defined. ---- */
const TWISTY_TIMER = {};   // id -> { tw | twDesc }
function twPatternSolved(kp){ try { return kp.experimentalIsSolved({ ignorePuzzleOrientation:true, ignoreCenterOrientation:true }); } catch(e){ return kp.isIdentical(kp.kpuzzle.defaultPattern()); } }
/* A random scramble in a MODEL's own move notation, for geometry puzzles whose app-text scramble the
   model can't parse. Skips whole-puzzle rotations (names ending in 'v') and avoids repeating a move. */
function randomModelScramble(kpuzzle){
  const moves = (kpuzzle && kpuzzle.definition && kpuzzle.definition.moves) || {};
  const names = Object.keys(moves).filter(n => !/v$/.test(n));
  if (!names.length) return '';
  const seq = []; let last = '';
  for (let i=0; i<25; i++){ let n, t=0; do { n = names[Math.floor(Math.random()*names.length)]; } while (n===last && ++t<6); last = n; seq.push(n); }
  return seq.join(' ');
}
/* Per-puzzle camera config for the 3-D models. For FTO we lift cubing's default ±35° latitude clamp
   (latLimit:90) so the camera can orbit the full sphere freely — no snap on release — and map the arrow
   keys to whole-puzzle rotations (rotKeys) for setting a specific face as the top. */
const TW_CAM_SNAP = { fto: { init:{latitude:20,longitude:0}, latLimit:90,
  // Camera fully unlocked: full latitude (±90) and NO longitude snap on release — drag orbits freely to any angle.
  // arrow-key reorientation. Face-axis rotations alone only reach half the orientations (tetrahedral
  // orbit), so include F_Rv/F_Lv (edge-axis) — with Dv/Lv these reach EVERY orientation, incl. yellow-top.
  rotKeys:{ ArrowUp:'F_Rv', ArrowDown:'F_Lv', ArrowLeft:'Dv', ArrowRight:'Lv' } } };
function snapTwistyOrbit(snap, o){
  const lat  = snap.lats ? snap.lats.reduce((a,b) => Math.abs(b-o.latitude) < Math.abs(a-o.latitude) ? b : a) : o.latitude;
  const long = snap.longStep ? (((Math.round(o.longitude/snap.longStep)*snap.longStep) % 360) + 360) % 360 : o.longitude;
  return { latitude: lat, longitude: long };
}
/* Drag-to-tumble: mouse-drag rotates the WHOLE 3-D puzzle (like the app's own cubes) so any face —
   including the bottom — can be stood upright on top, no arrow keys needed. Each puzzle's two moves are a
   VERIFIED generating pair for its full rotation group (octahedron/cube-variant = 24, dodecahedron = 60,
   tetrahedron = 12) — face-only/corner-only pairs get stuck in a subgroup, so these were checked by
   counting the rotation orbit. vertical drag = 'tilt' axis, horizontal drag = 'spin' axis. */
const TW_TUMBLE = {
  fto:{tilt:'D_BR_R_Fv',spin:'D_F_L_BLv'}, cto:{tilt:'DBRRFv',spin:'DFLBLv'},                 // octahedra: perpendicular vertex 4-folds
  mega:{tilt:'Fv',spin:'Uv'}, kilo:{tilt:'Fv',spin:'Uv'}, giga:{tilt:'Fv',spin:'Uv'}, tera:{tilt:'Fv',spin:'Uv'},   // dodecahedra: two face 5-folds
  mpyra:{tilt:'Rv',spin:'Lv'}, profpyra:{tilt:'Rv',spin:'Lv'}, royalpyra:{tilt:'Rv',spin:'Lv'},   // tetrahedra: two vertex 3-folds
  redi:{tilt:'Lv',spin:'Dv'}, masterskewb:{tilt:'Lv',spin:'Dv'}, eliteskewb:{tilt:'Lv',spin:'Dv'},   // cube-variants: perpendicular face 4-folds
};
/* Give every 3-D model NxN-style input: DRAG or CLICK a sticker turns that sticker's layer (right-click /
   right-drag = reverse); DRAG empty space tumbles the whole puzzle. cubing has no drag-to-turn and ties
   orbit + click-press to one canvas tracker, so we set experimentalDragInput='none' and own all pointer
   input, reusing cubing's exposed THREE puzzle object + camera to raycast, its own getClosestMoveToAxis
   picker (the turn is always the exact move cubing itself would apply — never the wrong face), and its
   move animator. */
async function attachTwistyControls(tp, tumbleCfg){
  let THREE, pg3d, targets, cam, canvas, faceAxes=[];
  try {
    THREE = await import('/vendor/cubing/npm/three/three.module.js');
    pg3d = await tp.experimentalCurrentThreeJSPuzzleObject();
    targets = (pg3d && pg3d.experimentalGetControlTargets) ? pg3d.experimentalGetControlTargets() : [];
    cam = await [...await tp.experimentalCurrentVantages()][0].camera();
    canvas = [...await tp.experimentalCurrentCanvases()][0];
    const kp = (await tp.experimentalModel.currentPattern.get()).kpuzzle;
    const turnSet = new Set(Object.keys(kp.definition.moves).map(m => m.replace(/(['0-9]+)$/,''))
      .filter(m => !/v$/.test(m) && !/^\d/.test(m)));             // outer-layer turn families (drop rotations and 2X inner slices)
    // Build the face-turn axes. Do NOT match stickerDat's axis names against move names: stickerDat uses an
    // internal notation that only partly overlaps (Megaminx: BF/E/C/A/I where the moves are B/DR/DL/FR/FL),
    // so name-matching silently dropped real faces AND let same-named EDGE axes in. Instead ask cubing's own
    // picker what move lies along each axis, and keep the first (face) axis for each distinct move.
    const seen = new Set();
    faceAxes = [];
    for (const a of (pg3d.stickerDat && pg3d.stickerDat.axis || [])) {
      const v = new THREE.Vector3(...a.coordinates).normalize();
      let mv = null;
      try { const r = pg3d.getClosestMoveToAxis(v.clone().multiplyScalar(2), { invert:false, depth:'none' }); mv = (r && r.move) ? String(r.move) : null; } catch(_){}
      if (!mv) continue;
      const base = mv.replace(/(['0-9]+)$/,'');
      if (!turnSet.has(base) || seen.has(base)) continue;
      seen.add(base); faceAxes.push({ move: base, v });
    }
  } catch(_) { return; }                                          // model API unavailable → leave it inert (native input already off)
  if (!targets.length || !cam || !canvas) return;
  const rc = new THREE.Raycaster();
  const addMove = m => { try { tp.experimentalAddMove(m); } catch(_){} };
  const pick = e => { const r=canvas.getBoundingClientRect();
    rc.setFromCamera(new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1), (cam.updateMatrixWorld(), cam));
    return rc.intersectObjects(targets, true)[0] || null; };
  const turnAt = (pt, reverse) => {                               // CLICK: apply the exact move cubing's own picker chooses for this sticker
    try { const r = pg3d.getClosestMoveToAxis(pt, { invert: !!reverse, depth: 'none' }); if (r && r.move) addMove(String(r.move)); } catch(_){}
  };
  /* DRAG: turn the face the sticker is ON, taking the direction from the drag's rotational sense about that
     face's centre ON SCREEN — i.e. from WHERE you grabbed relative to the face, not from the drag angle
     alone. This is the same rule the Megaminx/Pyraminx sims use (see moveFromDrag in puzzles.js), so the
     3-D models and the sims feel identical: drag a face and THAT face turns, and which side of the face
     centre you pull from decides clockwise vs anticlockwise. */
  function dragTurn(pt, face, downX, downY, dx, dy, reverse){
    const fa = faceAxes.find(a => a.move === face);
    if (!fa || !faceAxes.length) { turnAt(pt, reverse); return; }
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const up    = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const D = right.multiplyScalar(dx).add(up.multiplyScalar(-dy)); if (D.lengthSq() < 1e-6) return; D.normalize();
    // TARGET = the neighbouring face the drag heads toward (drag from a sticker toward a face → that face turns)
    let best=null, bs=0;
    for (const ax of faceAxes){
      if (ax.move === face) continue;                                      // not the face you started on
      if (ax.v.dot(fa.v) < -0.9) continue;                                 // nor the one directly opposite it
      const s = ax.v.dot(D); if (s > bs){ bs = s; best = ax; }
    }
    if (!best) { turnAt(pt, reverse); return; }
    // DIRECTION: rotational sense of the drag about the TARGET face's centre on screen (same rule as the sims)
    const c = best.v.clone().multiplyScalar(pt.length()).project(cam);
    const r = canvas.getBoundingClientRect();
    const cx = r.left + (c.x*0.5+0.5)*r.width, cy = r.top + (-c.y*0.5+0.5)*r.height;
    const wx = downX-cx, wy = downY-cy;
    let inv = (wx*dy - wy*dx) > 0; if (reverse) inv = !inv;
    addMove(best.move + (inv?"'":''));
  }
  let mode=null, down=null, hitPt=null, hitFace=null, accX=0, accY=0, acted=false;
  const STEP=46, TH=8;
  tp.addEventListener('pointerdown', e => {
    if (e.button!==0 && e.button!==2) return;
    down=e; acted=false; accX=accY=0;
    const hit=pick(e);
    mode = hit ? 'turn' : (tumbleCfg ? 'tumble' : null);
    hitPt = hit ? hit.point.clone() : null;
    hitFace = hit ? String(hit.object.userData.quantumMove) : null;   // the face you grabbed → its true normal drives the drag maths
    try { tp.setPointerCapture(e.pointerId); } catch(_){}
  });
  tp.addEventListener('pointermove', e => {
    if (!mode || !down) return;
    if (mode==='turn') {                                          // drag a sticker past a small threshold → turn its layer
      if (acted) return;
      const dx=e.clientX-down.clientX, dy=e.clientY-down.clientY;
      if (Math.hypot(dx,dy) < TH) return;
      acted=true; dragTurn(hitPt, hitFace, down.clientX, down.clientY, dx, dy, down.button===2);
    } else {                                                      // accumulate the tumble drag; the whole-puzzle rotation commits on release, not mid-drag
      accX+=e.movementX; accY+=e.movementY;
    }
  });
  const end = e => {
    if (mode==='turn' && !acted && down && hitPt &&               // a click (no drag) on a sticker → turn its layer
        Math.hypot(e.clientX-down.clientX, e.clientY-down.clientY) < TH) turnAt(hitPt, down.button===2);
    else if (mode==='tumble' && tumbleCfg) {                      // commit the tumble on release: rotate by however far you dragged (capped)
      const ty=Math.max(-4,Math.min(4,Math.round(accY/STEP))), tx=Math.max(-4,Math.min(4,Math.round(accX/STEP)));
      for (let i=0;i<Math.abs(ty);i++) addMove(ty>0?tumbleCfg.tilt:tumbleCfg.tilt+"'");
      for (let i=0;i<Math.abs(tx);i++) addMove(tx>0?tumbleCfg.spin+"'":tumbleCfg.spin);
    }
    mode=null; down=null; acted=false;
    try { tp.releasePointerCapture(e.pointerId); } catch(_){}
  };
  tp.addEventListener('pointerup', end);
  tp.addEventListener('pointercancel', end);
  tp.addEventListener('contextmenu', e => e.preventDefault());     // right-click reverses, so suppress its menu
}
/* Secondary setup for a 3-D model: the initial camera view and single-letter keyboard turning + the hint.
   (Mouse turning/tumbling is owned by attachTwistyControls; the playground disables cubing's native input.) */
function renderTwistyMoves(tp, containerEl, opts){
  opts = opts || {};
  containerEl.innerHTML='';
  if (!tp || !tp.experimentalModel) return;
  if (opts.snap){ tp._twSnap = opts.snap;                          // snap free-orbit on release
    if (opts.snap.latLimit) { try { tp.cameraLatitudeLimit = opts.snap.latLimit; } catch(_){} }   // lift the ±35° clamp so any face reaches the top
    try { tp.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set(opts.snap.init); } catch(_){} }
  tp.experimentalModel.currentPattern.get().then(kp => {
    const names = Object.keys((kp.kpuzzle && kp.kpuzzle.definition && kp.kpuzzle.definition.moves) || {})
      .filter(n => !/^\d/.test(n) && !/v$/.test(n));               // outer layers (drop inner 2U/3U… and rotations …v)
    tp._twMoves = names;                                           // for keyboard turning (single-letter face keys)
    tp._twRots = Object.keys((kp.kpuzzle && kp.kpuzzle.definition && kp.kpuzzle.definition.moves) || {}).filter(n => /v$/.test(n) && !/_/.test(n));   // whole-puzzle rotations (arrow keys, generic fallback)
    tp._twArrows = (opts.snap && opts.snap.rotKeys) || null;       // explicit per-puzzle arrow→rotation map (FTO)
    const hint=document.createElement('div'); hint.className='tw-moves-hint';
    hint.innerHTML='<b>Drag or click a piece</b> to turn its layer (<b>right-click</b> reverses) · <b>drag empty space</b> to tumble the puzzle · or a face key (Shift = reverse)';
    containerEl.appendChild(hint);
  }).catch(()=>{});
}
/* the 3-D model the user is currently interacting with (playground puzzle, or the virtual-timer model) */
function activeTwisty(){
  if (!playView.classList.contains('hidden') && playEntry && playEntry.kind==='twisty') return playSimEl.querySelector('twisty-player');
  if (!trView.classList.contains('hidden') && trCubeMode==='virtual' && TWISTY_TIMER[trPuzzle]) return trTwistyEl;
  return null;
}
/* Keyboard turning for the 3-D models: a single-letter key = that face move; Shift = reverse (′). */
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const tp = activeTwisty(); if (!tp) return;
  // Arrow keys reorient the WHOLE puzzle (so any face can be brought to the top). Playground only —
  // a reorientation would otherwise break the timer's exact solved-check.
  if (/^Arrow/.test(e.key) && !playView.classList.contains('hidden') && playEntry && playEntry.kind==='twisty') {
    const rot = (tp._twArrows && tp._twArrows[e.key])              // explicit map (reaches every orientation)
      || (tp._twRots && tp._twRots.length && tp._twRots[{ ArrowUp:0, ArrowRight:1, ArrowDown:2, ArrowLeft:3 }[e.key] % tp._twRots.length]);   // generic fallback
    if (rot) { e.preventDefault(); try { tp.experimentalAddMove(rot); } catch(_){} }
    return;
  }
  // single-letter key = that face move; Shift = reverse (multi-letter moves stay mouse-only)
  if (e.key.length !== 1 || !tp._twMoves) return;
  const mv = tp._twMoves.find(n => n.toUpperCase() === e.key.toUpperCase());
  if (!mv) return;
  e.preventDefault();
  try { tp.experimentalAddMove(e.shiftKey ? mv + "'" : mv); } catch(_){}
});
/* after an orbit drag on a snap-enabled model (FTO), settle the camera to the nearest clean vertex/face view */
document.addEventListener('pointerup', () => {
  const tp = activeTwisty(); if (!tp || !tp._twSnap || !tp.experimentalModel) return;
  const M = tp.experimentalModel.twistySceneModel;
  M.orbitCoordinates.get().then(o => M.orbitCoordinatesRequest.set(snapTwistyOrbit(tp._twSnap, o))).catch(()=>{});
});
let trTwistyUnsub = null, trTwistyEl = null;
function teardownTwistyTimer(){ if (trTwistyUnsub){ trTwistyUnsub(); trTwistyUnsub=null; }
  if (trTwistyEl){ if (trTwistyEl.parentNode===trainerSimEl) trainerSimEl.innerHTML=''; trTwistyEl=null; } }   // drop the element (frees its WebGL context)
function buildTwistyTimer(){
  const cfg = TWISTY_TIMER[trPuzzle]; if (!cfg){ teardownTwistyTimer(); return; }
  teardownTwistyTimer();
  const tp = document.createElement('twisty-player');
  tp.setAttribute('background','none'); tp.setAttribute('control-panel','none'); tp.setAttribute('hint-facelets','none'); tp.setAttribute('tempo-scale','6');
  tp.experimentalMovePressInput = 'basic';                         // mouse turning: drag/click a piece to turn it
  tp.style.cssText = 'width:100%;max-width:300px;height:280px;margin:0 auto;touch-action:none';   // touch-action:none → touch/trackpad drags turn pieces instead of scrolling
  if (cfg.tw) tp.setAttribute('puzzle', cfg.tw); else if (cfg.twDesc) tp.experimentalPuzzleDescription = cfg.twDesc;
  const scr = Array.isArray(trScramble) ? trScramble.join(' ') : String(trScramble || '');
  if (scr.trim()) { try { tp.experimentalSetupAlg = scr; tp.alg = ''; } catch(e){} }   // try the app scramble (a no-op for geometry puzzles)
  trainerSimEl.innerHTML = ''; trainerSimEl.appendChild(tp); trTwistyEl = tp;
  const mw = document.createElement('div'); trainerSimEl.appendChild(mw); renderTwistyMoves(tp, mw, { snap: TW_CAM_SNAP[trPuzzle] });   // move buttons (+ FTO orbit-snap)
  const mine = tp;
  setTimeout(async () => {
    if (trTwistyEl !== mine || !tp.experimentalModel) return;
    try {                                                                // if the app scramble was a no-op, self-scramble with the model's own moves
      const kp = await tp.experimentalModel.currentPattern.get();
      if (trTwistyEl !== mine) return;
      if (kp.isIdentical(kp.kpuzzle.defaultPattern())) {
        const own = randomModelScramble(kp.kpuzzle);
        if (own) { tp.experimentalSetupAlg = own; tp.alg = ''; await new Promise(r=>setTimeout(r,450)); }
      }
    } catch(e){}
    if (trTwistyEl !== mine || !tp.experimentalModel) return;
    const prop = tp.experimentalModel.currentPattern;
    // Baseline = the settled scrambled position. Start the timer only when the position actually CHANGES
    // from it (a real move) — robust against extra scramble-settle fires, not just skipping the first one.
    // Defer stopSolve out of the listener dispatch: stopSolve -> newScramble -> buildTwistyTimer would
    // remove THIS listener (and drop the player) mid-callback.
    let baseline = null; try { baseline = await prop.get(); } catch(e){}
    if (trTwistyEl !== mine) return;
    const listener = (kp) => {
      if (trState === 'idle') { if (!baseline || !kp.isIdentical(baseline)) tryStartSolve(); }   // first real move starts the clock
      else if (trState === 'running' && twPatternSolved(kp)) setTimeout(stopSolve, 0);            // solved → stop (deferred)
    };
    prop.addFreshListener(listener);
    trTwistyUnsub = () => { try { prop.removeFreshListener(listener); } catch(e){} };
  }, 700);
}
function configTcube() {
  const ok = isRenderable(trPuzzle);
  trView.classList.toggle('no-cube', !ok);
  trView.classList.toggle('has-sim', !!SIM[trPuzzle] && trPuzzle!=='mega');     // SVG sim instead of the 3-D cube (Megaminx is text-only — its WCA scramble can't drive the sim)
  if (ok) tcube.rebuild({ N: CUBE_N[trPuzzle], flip: isLLstep() });
  // Cube-interaction options for THIS puzzle
  const P=['physical','Physical — Space timer'], M=['mouse','Virtual — mouse'], K=['keyboard','Virtual — keyboard'];
  let opts = ok ? (CUBE_N[trPuzzle]===3 ? [P,M,K] : [P,M])   // 3×3 cubes: keyboard too; big cubes: mouse only
              : TWISTY_TIMER[trPuzzle] ? [P, ['virtual','Virtual — 3-D model']]   // interactive cubing.js 3-D model
              : SIM_KEYS[trPuzzle] ? [P, ['virtual','Virtual — mouse & keyboard']]   // 3-D sim (Pyraminx)
              : trPuzzle==='clock' ? [P, ['virtual','Virtual — click & drag']]   // interactive clock
              : null;                                         // display-only sim (Square-1/Megaminx)
              // NB: Redi is a twisty timer (handled by TWISTY_TIMER above) → it gets the 3-D model, not the old SVG-net mode
  const row = document.getElementById('trCubeRow'), sel = document.getElementById('trCubeMode');
  row.style.display = opts ? '' : 'none';
  if (opts) { sel.innerHTML = opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('');
    if (!opts.some(o => o[0]===trCubeMode)) trCubeMode='physical'; }
  else trCubeMode='physical';
  applyCubeMode();
}
function applyCubeMode() {
  const ok = isRenderable(trPuzzle);
  document.getElementById('trCubeMode').value = trCubeMode;
  trView.classList.toggle('cube-virtual', trCubeMode!=='physical');
  trCubeControls.rebuildMap();
  trCubeControls.setInteract({ drag: ok && trCubeMode==='mouse', keys: ok && trCubeMode==='keyboard' });
  if (TWISTY_TIMER[trPuzzle]) {                                         // virtual 3-D model timer
    trView.classList.toggle('has-sim', trCubeMode==='virtual');
    if (trCubeMode==='virtual') buildTwistyTimer(); else teardownTwistyTimer();
  } else teardownTwistyTimer();
  updateTrHint();
}
function setActive(sel, btn) { document.querySelectorAll('#view-trainer '+sel).forEach(x=>x.classList.toggle('on', x===btn)); }

trDiagram.addEventListener('click', () => { if (!trCur) return; cycleLearn(trSetId, trCur.name); updateStatusPill(); });
document.getElementById('trReveal').onclick = trReveal;
document.getElementById('trNext').onclick = trSkip;
document.getElementById('trPlay').onclick = trPlayAnswer;
document.getElementById('trReset').onclick = () => { clearSolves(statsKey()); trSolves = getSolves(statsKey()); renderStats(); renderHistory(); };
/* ---- Import times: paste a list of times (or FMC move counts) into the current event/session ---- */
function parseTimeToken(tok, count) {
  tok = tok.trim(); if (!tok) return null;
  if (/^dnf$/i.test(tok)) return { ms:0, p:'dnf' };
  if (count) { const v = parseInt(tok, 10); return (Number.isFinite(v) && v>0) ? { ms:v, p:0 } : null; }
  let p = 0; let t = tok;
  if (/\+2?$/.test(t)) { p = 2; t = t.replace(/\+2?$/, '').trim(); }   // "12.34+" / "12.34+2" → +2 penalty on a base time
  if (/^dnf$/i.test(t)) return { ms:0, p:'dnf' };
  let ms = null, mm = t.match(/^(\d+):(\d+(?:\.\d+)?)$/);              // M:SS.ss or SS.ss
  if (mm) ms = (parseInt(mm[1],10)*60 + parseFloat(mm[2]))*1000;
  else if (/^\d+(?:\.\d+)?$/.test(t)) ms = parseFloat(t)*1000;
  return (ms!=null && isFinite(ms) && ms>0) ? { ms:Math.round(ms), p } : null;
}
function openImportDialog() {
  const ov = document.createElement('div'); ov.className = 'import-ov';
  const hint = trCount
    ? 'Paste <b>move counts</b> — one per line or comma-separated. Use a whole number, or <b>DNF</b>.'
    : 'Paste times — one per line or comma-separated. Use <b>SS.ss</b> or <b>M:SS.ss</b>; add <b>+</b> for a +2, or <b>DNF</b>.';
  ov.innerHTML = `<div class="import-box"><h3>Import times</h3>
    <p class="import-hint">${hint} They’re added to the current event (<b>${statsLabel(statsKey())}</b>).</p>
    <textarea class="import-ta" spellcheck="false" placeholder="${trCount?'25\n28\nDNF':'12.34\n10.05+\nDNF\n1:02.11'}"></textarea>
    <div class="import-actions"><button class="ctl" data-act="cancel">Cancel</button><button class="ctl primary" data-act="go">Import</button></div>
    <div class="import-msg"></div></div>`;
  document.body.appendChild(ov);
  const ta = ov.querySelector('.import-ta'), msg = ov.querySelector('.import-msg'), close = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  document.addEventListener('keydown', function esc(e){ if (e.key==='Escape'){ close(); document.removeEventListener('keydown', esc); } });
  ov.querySelector('[data-act=cancel]').onclick = close;
  ov.querySelector('[data-act=go]').onclick = () => {
    const toks = ta.value.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);
    const arr = getSolves(statsKey()), base = Date.now(); let n = 0;
    toks.forEach(t => { const r = parseTimeToken(t, trCount); if (r) { arr.push({ ms:r.ms, p:r.p, t:base+n }); n++; } });
    if (n) { Profiles.save(); if (window.cloudSyncSet) cloudSyncSet(statsKey());
      trSolves = getSolves(statsKey()); renderStats(); renderHistory(); close(); }
    else msg.textContent = 'No valid entries found — check the format.';
  };
  setTimeout(() => ta.focus(), 0);
}
document.getElementById('trImport').onclick = openImportDialog;
/* tap a time → popover with penalties, the date, its scramble + retry, and delete */
let _smEl = null, _smClose = null;
function closeSolveMenu() { if (_smEl) { _smEl.remove(); _smEl = null; } if (_smClose) { document.removeEventListener('pointerdown', _smClose); _smClose = null; } }
function openSolveMenu(anchor, i) {
  closeSolveMenu();
  const s = trSolves[i]; if (!s) return;
  const date = new Date(s.t).toLocaleString([], { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
  const isOk = s.p !== 2 && s.p !== 'dnf';
  const el = document.createElement('div'); el.className = 'solvemenu';
  el.innerHTML = `<div class="sm-head"><b>Solve #${i+1}</b><span class="sm-time">${fmtSolve(s)}</span></div>
    <div class="sm-date">${date}</div>
    <div class="sm-pens">
      ${trCount ? '' : `<button data-p="0" class="${isOk?'on':''}">OK</button><button data-p="2" class="${s.p===2?'on':''}">+2</button>`}
      <button data-p="dnf" class="${s.p==='dnf'?'on':''}">DNF</button>
    </div>
    ${s.scr ? `<div class="sm-scr-label">Scramble</div>
      <div class="sm-scr-row"><span class="sm-scr">${String(s.scr).replace(/'/g,'′')}</span><button class="sm-retry" title="Load this scramble to try again">↻ Retry</button></div>`
            : `<div class="sm-noscr">No scramble saved for this solve.</div>`}
    <button class="sm-del">✕ Delete solve</button>`;
  document.body.appendChild(el);
  // Centre the menu over the tapped time, clamped to stay on-screen.
  const r = anchor.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  el.style.left = Math.max(8, Math.min(cx - el.offsetWidth / 2, window.innerWidth - el.offsetWidth - 8)) + 'px';
  el.style.top  = Math.max(8, Math.min(cy - el.offsetHeight / 2, window.innerHeight - el.offsetHeight - 8)) + window.scrollY + 'px';
  const refresh = () => { Profiles.save(); if (window.cloudSyncSet) cloudSyncSet(statsKey()); renderStats(); renderHistory(); };
  el.querySelectorAll('.sm-pens button').forEach(b => b.onclick = () => {
    s.p = b.dataset.p==='dnf' ? 'dnf' : b.dataset.p==='2' ? 2 : 0; refresh(); closeSolveMenu();
  });
  el.querySelector('.sm-del').onclick = () => { trSolves.splice(i, 1); refresh(); closeSolveMenu(); };
  const rt = el.querySelector('.sm-retry'); if (rt) rt.onclick = () => { retryScramble(s.scr); closeSolveMenu(); };
  _smEl = el;
  _smClose = e => { if (isGhostMouse(e)) return; if (!el.contains(e.target) && e.target !== anchor) closeSolveMenu(); };
  setTimeout(() => document.addEventListener('pointerdown', _smClose), 0);
}
trHistEl.addEventListener('click', e => {
  const cell = e.target.closest('td.single.click'); if (!cell) return;
  openSolveMenu(cell, +cell.dataset.i);
});
document.getElementById('trFilter').addEventListener('change', e => { trFilter=e.target.value; newScramble(); });
document.getElementById('trProb').addEventListener('change', e => { trProb=e.target.value; newScramble(); });
document.getElementById('trMode').addEventListener('change', e => {
  if (trModeDefs) applyMode(trModeDefs.find(m => m.id === e.target.value));
  else { trMode = e.target.value; trView.classList.toggle('mode-solve', trMode==='solve'); }
  configTcube(); reloadTimes(); newScramble();
});
document.getElementById('trCubeMode').addEventListener('change', e => {
  trCubeMode = e.target.value;
  trState='idle'; cancelAnimationFrame(trRAF); trTimerEl.classList.remove('armed','inspecting'); trTimerEl.textContent='0.00';
  applyCubeMode(); reloadTimes(); newScramble();   // reload: physical & virtual keep separate histories
});
/* Timer keys: start ONLY on spacebar release (so holding it doesn't fire repeatedly),
   stop on the first keydown. Auto-repeat keydown events are ignored. */
let trArmed = false, trIgnoreUp = false;
document.addEventListener('keydown', e => {
  if (trView.classList.contains('hidden')) return;
  if (trCount) { if ((e.key==='n'||e.key==='N') && e.target!==countInput) trSkip(); return; }   // FMC: no stopwatch
  if (e.code==='Space') {
    e.preventDefault();
    if (trCubeMode!=='physical') return;                           // virtual modes: solve on screen, not Space
    if (e.repeat) return;                                          // ignore key-repeat while held
    if (trState==='running') { stopSolve(); trIgnoreUp = true; }   // first input ends the solve
    else { trArmed = true; trTimerEl.classList.add('armed'); if (trState==='idle') trTimerEl.textContent='0.00'; }
  } else if (e.repeat) return;
  else if ((e.key==='r'||e.key==='R') && trCubeMode==='physical') trReveal();   // in virtual modes, R turns the cube
  else if (e.key==='n'||e.key==='N') trSkip();
});
document.addEventListener('keyup', e => {
  if (trCount || trCubeMode!=='physical' || e.code!=='Space' || trView.classList.contains('hidden')) return;
  if (trIgnoreUp) { trIgnoreUp = false; trArmed = false; trTimerEl.classList.remove('armed'); return; }
  if (!trArmed) return;                                            // start only on release
  trArmed = false; trTimerEl.classList.remove('armed');
  if (trState==='idle') { inspectionOn() ? startInspection() : startSolve(); }
  else if (trState==='inspecting') endInspection();
});
/* Tap the timer to start & stop — mobile has no spacebar. Mirrors the Space arm(press)/start(release)/stop logic. */
function timerPressStart() {
  if (trCount || trCubeMode!=='physical' || trView.classList.contains('hidden')) return false;
  if (trState==='running') { stopSolve(); trIgnoreUp = true; }     // tap while running → stop
  else { trArmed = true; trTimerEl.classList.add('armed'); if (trState==='idle') trTimerEl.textContent = '0.00'; }
  return true;
}
function timerPressEnd() {
  if (trCount || trCubeMode!=='physical' || trView.classList.contains('hidden')) return;
  if (trIgnoreUp) { trIgnoreUp = false; trArmed = false; trTimerEl.classList.remove('armed'); return; }
  if (!trArmed) return;
  trArmed = false; trTimerEl.classList.remove('armed');
  if (trState==='idle') { inspectionOn() ? startInspection() : startSolve(); }
  else if (trState==='inspecting') endInspection();
}
/* Touch taps fire the touch pointer events, then synthesised mouse-compat pointer events
   ~10ms later. Those "ghost" mouse events would arm→start→stop a solve in a single tap
   (0.01s phantom solves) and instantly dismiss the solve menu the same tap just opened.
   Stamp the last real touch and ignore mouse pointer events that closely follow it — while
   still honouring genuine desktop mouse clicks (no recent touch). */
let _lastTouchTs = -1e9;
document.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') _lastTouchTs = performance.now(); }, true);
document.addEventListener('pointerup',   e => { if (e.pointerType !== 'mouse') _lastTouchTs = performance.now(); }, true);
const isGhostMouse = e => e.pointerType === 'mouse' && (performance.now() - _lastTouchTs) < 700;
trTimerEl.addEventListener('pointerdown', e => { if (isGhostMouse(e)) return; if (timerPressStart()) e.preventDefault(); });
trTimerEl.addEventListener('pointerup',   e => { if (isGhostMouse(e)) return; e.preventDefault(); timerPressEnd(); });
trTimerEl.addEventListener('pointercancel', () => { trArmed = false; trTimerEl.classList.remove('armed'); });

function renderTrainer(path) {
  trView.classList.remove('universal');           // a normal lesson-driven timer is not the universal Timer tab
  const L = LESSONS[path];
  document.getElementById('trainerIntro').innerHTML = `<h2>${L.title}</h2>` + (L.intro||[]).map(p=>`<p>${p}</p>`).join('');
  trPuzzle = L.puzzle || path.split('/')[0];
  trCount = !!L.countMode;                                  // FMC: enter a move count instead of timing
  trModeDefs = L.modes || null;
  const modeSel = document.getElementById('trMode');
  if (trModeDefs) {                                         // multi-mode trainer (3×3 Timer): build the Mode dropdown
    modeSel.innerHTML = trModeDefs.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    modeSel.value = trModeDefs[0].id; applyMode(trModeDefs[0]);
    trView.classList.toggle('solve-only', false);
  } else {                                                  // single-mode: default Step / Full-solve
    modeSel.innerHTML = `<option value="step">Step (case)</option><option value="solve">Full solve</option>`;
    trSet = ALG_SETS[L.set] || []; trKind = L.kind || 'pll'; trSetId = L.set || ('timer:' + trPuzzle); trKey = null;
    trMode = L.solveOnly ? 'solve' : 'step';
    trView.classList.toggle('mode-solve', trMode==='solve');
    trView.classList.toggle('solve-only', !!L.solveOnly);
    modeSel.value = trMode;
  }
  trView.classList.toggle('count-mode', trCount);
  document.getElementById('trFilter').value = trFilter;
  document.getElementById('trProb').value = trProb;
  configTcube();   // also syncs the Cube dropdown + virtual availability
  trState='idle'; cancelAnimationFrame(trRAF); trTimerEl.classList.remove('armed'); trTimerEl.textContent = '0.00';
  reloadTimes(); newScramble();
}

/* ================================================================
   CARD HOME
   ================================================================ */
const homeEl = document.getElementById('view-home');
/* Map each puzzle to its official WCA event icon (the @cubing/icons font). */
const EVENT = {
  '3x3':'333', 'oh':'333oh', '2x2':'222', '4x4':'444', '5x5':'555', '6x6':'666', '7x7':'777',
  'pyra':'pyram', 'mega':'minx', 'skewb':'skewb', 'sq1':'sq1', 'clock':'clock',
  '3bld':'333bf', 'fmc':'333fm', 'mbld':'333mbf', '4bld':'444bf', '5bld':'555bf',
  // non-WCA: no dedicated glyphs — closest shape stand-ins
  'fto':'pyram', 'cto':'pyram', 'mpyra':'pyram', 'profpyra':'pyram', 'royalpyra':'pyram',
  'kilo':'minx', 'masterkilo':'minx', 'giga':'minx', 'elitekilo':'minx', 'tera':'minx',
  'masterskewb':'skewb', 'eliteskewb':'skewb', 'redi':'333',
};
/* Custom inline-SVG icons for non-WCA puzzles (the icon font only ships WCA glyphs). Shape reflects
   the puzzle family; internal lines hint at size/order. */
/* Non-WCA icons in the WCA style: a single flat FACE of the puzzle with its grid (denser = bigger).
   minx→pentagon face, pyra/octa→triangle face, skewb/redi→square face. */
const NW_ICON = (() => {
  const O='<svg viewBox="0 0 24 24" class="puz-svg" aria-hidden="true">', C='</svg>';
  const ln=(a,b,c,d)=>`<line x1="${(+a).toFixed(1)}" y1="${(+b).toFixed(1)}" x2="${(+c).toFixed(1)}" y2="${(+d).toFixed(1)}"/>`;
  const lerp=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t, P[1]+(Q[1]-P[1])*t];
  const TA=[12,3], TB=[3.5,20], TC=[20.5,20];                     // a triangular face (pyraminx / octahedron)
  const PENT=[[12,2.5],[21,9.3],[17.4,20],[6.6,20],[3,9.3]];
  function minx(layers){ let g=`<polygon class="pz-face" points="${PENT.map(p=>p.join(',')).join(' ')}"/>`;
    const rings = layers<=2?1 : layers<=4?2 : 3;                   // concentric pentagons + spokes = megaminx face
    for(let i=1;i<=rings;i++){ const s=1-i*(0.62/(rings+0.4)); g+=`<polygon points="${PENT.map(p=>(12+(p[0]-12)*s).toFixed(1)+','+(12+(p[1]-12)*s).toFixed(1)).join(' ')}"/>`; }
    const s=1-(0.62/(rings+0.4)); PENT.forEach(p=>g+=ln(12+(p[0]-12)*s,12+(p[1]-12)*s,p[0],p[1]));
    return O+g+C; }
  function tri(layers){ let g=`<polygon class="pz-face" points="${TA.join(',')} ${TB.join(',')} ${TC.join(',')}"/>`;
    for(let i=1;i<layers;i++){ const t=i/layers;                  // full triangular grid: lines parallel to all three sides
      g+=ln(...lerp(TA,TB,t), ...lerp(TA,TC,t)); g+=ln(...lerp(TC,TA,t), ...lerp(TC,TB,t)); g+=ln(...lerp(TB,TA,t), ...lerp(TB,TC,t)); }
    return O+g+C; }
  function octaFace(corner){ const mAB=lerp(TA,TB,.5), mBC=lerp(TB,TC,.5), mCA=lerp(TC,TA,.5);
    let g=`<polygon class="pz-face" points="${TA.join(',')} ${TB.join(',')} ${TC.join(',')}"/>`
        + `<polygon points="${mAB.map(v=>v.toFixed(1)).join(',')} ${mBC.map(v=>v.toFixed(1)).join(',')} ${mCA.map(v=>v.toFixed(1)).join(',')}"/>`;
    if(corner) [TA,TB,TC].forEach(p=>g+=`<circle class="pz-dot" cx="${p[0]}" cy="${p[1]}" r="1.7"/>`);
    return O+g+C; }
  function skewb(layers){ const M=[[12,4],[20,12],[12,20],[4,12]];   // square face + inscribed diamond(s) = skewb cut
    let g='<rect class="pz-face" x="4" y="4" width="16" height="16" rx="1.5"/>'+`<polygon points="${M.map(p=>p.join(',')).join(' ')}"/>`;
    for(let i=1;i<=Math.min(layers-2,3);i++){ const s=1-i*0.24; g+=`<polygon points="${M.map(p=>(12+(p[0]-12)*s).toFixed(1)+','+(12+(p[1]-12)*s).toFixed(1)).join(' ')}"/>`; }
    return O+g+C; }
  function redi(){ let g='<rect class="pz-face" x="4" y="4" width="16" height="16" rx="1.5"/>';
    [[4,4,8,4,4,8],[20,4,16,4,20,8],[4,20,8,20,4,16],[20,20,16,20,20,16]].forEach(c=>g+=`<polygon class="pz-dot" points="${c[0]},${c[1]} ${c[2]},${c[3]} ${c[4]},${c[5]}"/>`);
    return O+g+C; }
  const map={ fto:()=>octaFace(false), cto:()=>octaFace(true), redi:()=>redi(),
    kilo:()=>minx(2), masterkilo:()=>minx(4), giga:()=>minx(5), elitekilo:()=>minx(6), tera:()=>minx(7),
    mpyra:()=>tri(4), profpyra:()=>tri(5), royalpyra:()=>tri(6), pyramorphix:()=>tri(2),
    masterskewb:()=>skewb(3), eliteskewb:()=>skewb(4), skewb7:()=>skewb(7) };
  return id => map[id] ? map[id]() : null;
})();
function iconHTML(id, cls) { const ic = NW_ICON(id);
  return ic ? `<span class="puz-icon ${cls||''}">${ic}</span>` : `<span class="cubing-icon event-${EVENT[id]||'333'} ${cls||''}"></span>`; }
function cubeArt(p) { return iconHTML(p.id, 'art-icon'); }
// Official WCA event order (matches the WCA site's event filter): cubes, then 3×3 variations, then the shaped puzzles, then big-BLD & MBLD.
const WCA_ORDER = ['3x3','2x2','4x4','5x5','6x6','7x7','3bld','fmc','oh','clock','mega','pyra','skewb','sq1','4bld','5bld','mbld'];
const wcaRank = id => { const i = WCA_ORDER.indexOf(id); return i<0 ? 99 : i; };
function firstEntry(p) {
  const m = p.methods[0];
  return { m: m.id, i: (m.items && m.items.length) ? m.items[0].id : null };
}
function renderHome() {
  homeEl.innerHTML = `<div class="home-grid"></div>`;
  const grid = homeEl.querySelector('.home-grid');
  [...PUZZLES].filter(p => !NONWCA.has(p.id)).sort((a,b) => wcaRank(a.id) - wcaRank(b.id)).forEach(p => {
    const card = document.createElement('button'); card.className='home-card';
    const nm = p.methods.filter(m => m.id !== 'timer' && m.id !== 'fund').length;   // Timer & Fundamentals aren't solving methods
    card.innerHTML = `${cubeArt(p)}<div class="home-name">${p.name}</div>
      <div class="home-sub">${nm} method${nm===1?'':'s'}</div>`;
    card.onclick = e => { e.stopPropagation();              // open the puzzle's dropdown menu (not the first lesson)
      const cat = catOf(p.id); if (cat) openCategory(cat.id, p.id); };
    grid.appendChild(card);
  });
}

/* ================================================================
   MEGA-MENU + ROUTER
   ================================================================ */
const megabar=document.getElementById('megabar'), megapanel=document.getElementById('megapanel'),
      megawrap=document.getElementById('megawrap'), crumb=document.getElementById('breadcrumb');
let cur = { p:null, m:null, i:null }, homeMode=true, statsMode=false, timerMode=false, openPuzzle=null;
const getP = id => PUZZLES.find(p=>p.id===id);
const shortName = n => n.split('(')[0].trim();
const pathOf = (p,m,i) => `${p}/${m}/${i}`;
const isReady = (p,m,i) => pathOf(p,m,i)==='3x3/fund/notation' || !!LESSONS[pathOf(p,m,i)];

/* Top-level categories that group the 17 events. */
const CATEGORIES = [
  { id:'nxn',    name:'Cubes',         puzzles:['2x2','3x3','4x4','5x5','6x6','7x7'] },
  { id:'var',    name:'Challenges',    puzzles:['oh','3bld','fmc','mbld','4bld','5bld'] },
  { id:'shaped', name:'Other Puzzles', puzzles:['pyra','mega','skewb','sq1','clock'] },
  { id:'nonwca', name:'Non-WCA',      puzzles:['fto','cto','kilo','masterkilo','giga','elitekilo','tera','pyramorphix','mpyra','profpyra','royalpyra','masterskewb','eliteskewb','skewb7','redi'] },
];
const catOf = pid => CATEGORIES.find(c => c.puzzles.includes(pid));
const NONWCA = new Set((CATEGORIES.find(c => c.id==='nonwca') || { puzzles:[] }).puzzles);   // kept off the home page; menu tab sits after Stats

const homeTab = document.createElement('button');
homeTab.className='puzzle-tab home-tab'; homeTab.textContent='⌂ Home';
homeTab.onclick = goHome; megabar.appendChild(homeTab);
function makeCatTab(cat) {
  const tab=document.createElement('button'); tab.className='puzzle-tab'; tab.dataset.cat=cat.id;
  tab.innerHTML = cat.name+'<span class="caret">▾</span>';
  tab.addEventListener('click', () => openPuzzle===cat.id ? closePanel() : openCategory(cat.id));
  tab.addEventListener('mouseenter', () => { if (openPuzzle) openCategory(cat.id); });
  megabar.appendChild(tab);
}
CATEGORIES.forEach(cat => { if (cat.id!=='nonwca') makeCatTab(cat); });   // Non-WCA is appended after the Stats tab below
const playTab = document.createElement('button');
playTab.className='puzzle-tab'; playTab.dataset.cat='play'; playTab.textContent='🧩 Virtual Cube';
playTab.addEventListener('click', openPlay); megabar.appendChild(playTab);

const timerTab = document.createElement('button');
timerTab.className='puzzle-tab'; timerTab.dataset.cat='timer'; timerTab.textContent='⏱ Timer';
timerTab.addEventListener('click', openTimer); megabar.appendChild(timerTab);

const statsTab = document.createElement('button');
statsTab.className='puzzle-tab'; statsTab.dataset.cat='stats'; statsTab.textContent='📊 Statistics';
statsTab.addEventListener('click', openStats); megabar.appendChild(statsTab);

const _nonwcaCat = CATEGORIES.find(c => c.id==='nonwca');   // Non-WCA category tab, placed AFTER Stats
if (_nonwcaCat) makeCatTab(_nonwcaCat);

/* Render one puzzle's methods+lessons into the right pane. */
function renderMethods(container, pId) {
  const p = getP(pId); container.innerHTML='';
  const methods = [...p.methods].sort((a,b) => (b.id==='timer') - (a.id==='timer'));   // Timer section first
  methods.forEach(m => {
    const col=document.createElement('div'); col.className='method-col';
    const h=document.createElement('h4'); h.textContent=m.name; col.appendChild(h);
    if (m.blurb) { const bl=document.createElement('div'); bl.className='mblurb'; bl.textContent=m.blurb; col.appendChild(bl); }
    if (m.items && m.items.length) {
      m.items.forEach(i => {
        const link=document.createElement('button');
        link.className='lesson-link'+(cur.p===p.id&&cur.m===m.id&&cur.i===i.id?' selected':'');
        const ready=isReady(p.id,m.id,i.id);
        link.innerHTML = `<span>${i.name}</span>`+(ready?'<span class="tag-ready">▶ play</span>':'<span class="tag-soon">soon</span>');
        link.addEventListener('click', () => select(p.id,m.id,i.id));
        col.appendChild(link);
      });
    } else { col.classList.add('clickable'); h.addEventListener('click', () => select(p.id,m.id,null)); }
    container.appendChild(col);
  });
}

/* Two-pane category menu: puzzles on the left, hovered puzzle's methods on the right. */
function openCategory(catId, wantPz) {
  openPuzzle = catId; const cat = CATEGORIES.find(c=>c.id===catId);
  megapanel.innerHTML = '<div class="cat-puzzles"></div><div class="cat-methods"></div>';
  const left = megapanel.querySelector('.cat-puzzles'), right = megapanel.querySelector('.cat-methods');
  const activePz = (wantPz && cat.puzzles.includes(wantPz)) ? wantPz
                 : (cur.p && cat.puzzles.includes(cur.p)) ? cur.p : cat.puzzles[0];
  let lastFam = null;
  cat.puzzles.forEach(pid => {
    const p = getP(pid);
    if (p.fam && p.fam !== lastFam) { lastFam = p.fam;              // SpeedCubeShop-style family headers (Non-WCA submenu)
      const h = document.createElement('div'); h.className='cat-fam-head'; h.textContent = p.fam; left.appendChild(h); }
    const b = document.createElement('button'); b.className='cat-pz'+(pid===activePz?' active':''); b.dataset.pz=pid;
    b.innerHTML = `${iconHTML(pid,'')}<span>${p.fam ? p.name : shortName(p.name)}</span>`;   // Non-WCA (fam) puzzles keep their shape name — several share an NxN size (two "4×4"s), so "4×4" alone is ambiguous
    const activate = () => { left.querySelectorAll('.cat-pz').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderMethods(right, pid); };
    b.addEventListener('mouseenter', activate);
    b.addEventListener('click', activate);
    left.appendChild(b);
  });
  renderMethods(right, activePz);
  megapanel.classList.add('show');
  document.querySelectorAll('.puzzle-tab').forEach(t=>t.classList.toggle('open', t.dataset.cat===catId));
}
function closePanel() { openPuzzle=null; megapanel.classList.remove('show'); document.querySelectorAll('.puzzle-tab.open').forEach(t=>t.classList.remove('open')); }
megawrap.addEventListener('mouseleave', closePanel);
document.addEventListener('click', e => { if (!megawrap.contains(e.target)) closePanel(); });
document.addEventListener('keydown', e => { if (e.key==='Escape') closePanel(); });

const VIEWS = ['view-home','view-notation','view-lesson','view-sheet','view-trainer','view-placeholder','view-play','view-stats'];
const show = id => {
  if (id !== 'view-trainer' && (trTwistyEl || trState !== 'idle')) {   // leaving the timer → stop it & free the 3-D model (no leaked WebGL context or stuck 'running' state)
    teardownTwistyTimer(); cancelAnimationFrame(trRAF); trState='idle'; trTimerEl.classList.remove('armed','inspecting');
  }
  VIEWS.forEach(v => document.getElementById(v).classList.toggle('hidden', v!==id));
};

function goHome() { homeMode=true; statsMode=false; timerMode=false; closePanel(); document.querySelectorAll('.puzzle-tab.selected').forEach(t=>t.classList.remove('selected')); crumb.innerHTML='<b>Home</b>'; renderHome(); show('view-home'); }
function select(pId,mId,iId) { homeMode=false; statsMode=false; timerMode=false; cur={p:pId,m:mId,i:iId}; render(); closePanel(); }

function render() {
  if (statsMode) { renderStatsView(); return; }   // keep Statistics live across profile switches (explicit nav clears statsMode)
  if (timerMode) { renderUniversalTimer(); return; }   // keep the universal Timer live across profile switches
  if (homeMode) { show('view-home'); return; }
  const p=getP(cur.p), m=p.methods.find(x=>x.id===cur.m);
  const i=(m.items&&m.items.length)? m.items.find(x=>x.id===cur.i) : null;
  const myCat = catOf(cur.p);
  document.querySelectorAll('.puzzle-tab').forEach(t=>t.classList.toggle('selected', !!myCat && t.dataset.cat===myCat.id));
  crumb.innerHTML = `<b>${shortName(p.name)}</b> › <b>${m.name}</b>`+(i?` › <b>${i.name}</b>`:'');
  const path = i ? pathOf(cur.p,cur.m,cur.i) : null;

  if (path === '3x3/fund/notation') { show('view-notation'); return; }
  const L = path && LESSONS[path];
  if (L && (L.type==='anatomy' || L.type==='algo' || L.type==='text')) { show('view-lesson'); renderLesson(path); return; }
  if (L && L.type==='sheet')   { show('view-sheet');   renderSheet(path);   return; }
  if (L && L.type==='trainer') { show('view-trainer'); renderTrainer(path); return; }

  show('view-placeholder');
  document.getElementById('phPath').textContent = shortName(p.name)+'  ·  '+m.name;
  document.getElementById('phTitle').textContent = i ? i.name : m.name;
  document.getElementById('phDesc').textContent =
    (i&&i.desc)? i.desc : i ? `This lesson — “${i.name}” — is on the roadmap and not built yet.` : (m.blurb||'On the roadmap.');
  document.getElementById('phMethod').innerHTML = '<b>About this method:</b> '+(m.blurb||'');
}

/* ================================================================
   VIRTUAL CUBE — mouse-interactable playground.
   Drag a sticker to turn its layer (in the drag direction); drag the
   background to orbit the view. r = n × u maps a face normal + drag
   direction to a layer move (verified finger-following).
   ================================================================ */
const playCube = makeCube(document.getElementById('playCube'));
const playScene = document.querySelector('.play-scene');
const playSimEl = document.getElementById('playSim');
const playStatus = document.getElementById('playStatus');
const playScrText = document.getElementById('playScrambleText');
const playView = document.getElementById('view-play');
let playN = 3, playHist = [], playEntry = null, playMoves = 0;   // playHist = undo stack (drag turns); playMoves = the displayed counter (also counts keyboard turns, resets on solve)

/* Every interactable virtual puzzle auto-appears here. Add an entry → it shows in the dropdown. */
const PLAY_PUZZLES = [
  { id:'2x2', name:'2×2', kind:'cube', n:2 }, { id:'3x3', name:'3×3', kind:'cube', n:3 },
  { id:'4x4', name:'4×4', kind:'cube', n:4 }, { id:'5x5', name:'5×5', kind:'cube', n:5 },
  { id:'6x6', name:'6×6', kind:'cube', n:6 }, { id:'7x7', name:'7×7', kind:'cube', n:7 },
  { id:'pyra', name:'Pyraminx', kind:'sim', sim:pyraSim, keys:{ u:'U', l:'L', r:'R', b:'B' } },
  { id:'skewb', name:'Skewb', kind:'sim', sim:skewbSim, keys:{ u:'U', l:'L', r:'R', b:'B' } },
  { id:'mega', name:'Megaminx', kind:'twisty', tw:'megaminx', scr:'minx' },   // 3-D cubing model + real WCA scramble (SVG megaSim still used in lessons)
  { id:'sq1', name:'Square-1', kind:'sim', sim:sqSim },     // interactive via drag (sqSim.turnLayer / slash)
  { id:'clock', name:'Clock', kind:'sim', sim:clockSim },   // interactive via clicks/drags (clockSim.turn)
  // ---- Non-WCA: full 3-D interactive models via cubing.js <twisty-player> (tw = cubing puzzle id; scr = scramble event id or null) ----
  { id:'fto', name:'FTO', kind:'twisty', tw:'fto', scr:'fto' },
  { id:'kilo', name:'Kilominx', kind:'twisty', tw:'kilominx', scr:'kilominx' },
  { id:'mpyra', name:'Master Pyraminx', kind:'twisty', tw:'master_tetraminx', scr:'master_tetraminx' },
  { id:'giga', name:'Gigaminx', kind:'twisty', tw:'gigaminx', scr:null },     // no cubing scramble — drag to mix
  { id:'redi', name:'Redi Cube', kind:'twisty', twDesc:'c v 0.915641442663986', scr:null },   // redi_cube has no twisty renderer → render as its mechanical twin, the Compy Cube
  // puzzle-geometry models — rendered from a geometry SPEC via experimentalPuzzleDescription.
  // (experimentalPuzzleName silently falls back to a 3x3; only registry names + geometry specs render.)
  // Specs derived from cubing puzzle-geometry: shape + cut-type/distance pairs. No cubing scramble — drag to mix.
  { id:'masterskewb', name:'Master Skewb', kind:'twisty', twDesc:'c v 0.275', scr:null },
  { id:'profpyra', name:"Professor's Pyraminx", kind:'twisty', twDesc:'t v -0.2 v 0.6 v 1.4 v 2.2', scr:null },
  { id:'royalpyra', name:'Royal Pyraminx', kind:'twisty', twDesc:'t v -0.333333333333333 v 0.333333333333333 v 1 v 1.66666666666667 v 2.33333333333333', scr:null },
  { id:'tera', name:'Teraminx', kind:'twisty', twDesc:'d f 0.64 f 0.76 f 0.88', scr:null },
  { id:'cto', name:'CTO', kind:'twisty', twDesc:'o v 0.433012701892219', scr:null },   // corner-turning octahedron (Trajber's)
  { id:'eliteskewb', name:'Elite Skewb', kind:'twisty', twDesc:'c v 0 v 0.38', scr:null },   // order-4 skewb (cubing: "professor skewb")
];
// Every non-WCA puzzle with a 3-D model gets the virtual-timer option (self-scrambled when the app text
// scramble isn't in the model's own notation). Pyramorphix renders as a 2×2 (cube engine); Master/Elite
// Kilominx and 7×7 Skewb have no cubing model, so they stay physical-only.
PLAY_PUZZLES.forEach(p => { if (p.kind==='twisty') TWISTY_TIMER[p.id] = { tw:p.tw, twDesc:p.twDesc }; });

const playControls = makeCubeControls(playCube, document.getElementById('playCube'), playScene, {
  isActive: () => !playView.classList.contains('hidden') && playEntry && playEntry.kind==='cube' && playN===3,
  onTurn: m => { if (m) playHist.push(m); playMoves++; updateStatus(); },   // keyboard turns call onTurn() with no move — count them too, they just aren't undoable
  onReset: () => { playCube.reset(); playHist=[]; playMoves=0; playScrText.textContent=''; updateStatus(); },
});
const renderSim = () => { playSimEl.innerHTML = playEntry.sim.svg3d ? playEntry.sim.svg3d() : playEntry.sim.svg(); };
function updateStatus() {
  if (!playEntry || playEntry.kind==='twisty') return;     // twisty model manages its own state
  const solved = playEntry.kind==='cube' ? cubeSolvedByColor(playCube) : playEntry.sim.isSolved();
  if (solved) playMoves = 0;                               // solved → the counter starts fresh, so the next solve counts from 1
  playStatus.classList.toggle('solved', solved);
  playStatus.textContent = solved ? 'Solved ✔'
    : (playEntry.kind==='cube' && playMoves) ? playMoves + ' move' + (playMoves===1?'':'s') : 'Scrambled';
}
function playSelect(entry) {
  playEntry = entry; playHist = []; playMoves = 0; playScrText.textContent = ''; busy = false;
  if (entry.kind==='twisty') {                              // 3-D cubing.js model (FTO/Kilominx/Master Pyraminx/Gigaminx/Redi)
    playView.classList.toggle('sim-mode', true);
    document.getElementById('playUndo').style.display = 'none';
    playControls.setInteract({});
    document.getElementById('playHint').innerHTML = 'A full <b>3-D interactive model</b> (powered by cubing.js). <b>Drag or click a piece</b> to turn its layer (<b>right-click</b> reverses); <b>drag empty space</b> to tumble the whole puzzle. Use <b>Scramble</b> to shuffle.';
    const tp = document.createElement('twisty-player');
    tp.setAttribute('background','none'); tp.setAttribute('control-panel','none'); tp.setAttribute('hint-facelets','none'); tp.setAttribute('tempo-scale','5');
    tp.experimentalDragInput = 'none';                             // turn off cubing's native orbit/click-press; attachTwistyControls owns all pointer input (drag-to-turn + tumble)
    // NOTE: do NOT set display here — twisty-player needs its default :host{display:grid};
    // forcing display:block collapses its internal grid layout to 0 height (blank 360x0 canvas).
    // margin:0 auto still centres it (grid host is block-level).
    tp.style.cssText = 'width:100%;max-width:360px;height:340px;margin:0 auto;touch-action:none';   // touch-action:none so touch/trackpad drags turn pieces instead of scrolling the page (cubing's vendored code doesn't set it)
    if (entry.tw) tp.setAttribute('puzzle', entry.tw);                         // cubing registry puzzle
    else if (entry.twName) tp.experimentalPuzzleName = entry.twName;           // puzzle-geometry by name
    else if (entry.twDesc) tp.experimentalPuzzleDescription = entry.twDesc;    // puzzle-geometry by spec
    playSimEl.innerHTML = ''; playSimEl.appendChild(tp);
    const mw = document.createElement('div'); playSimEl.appendChild(mw); renderTwistyMoves(tp, mw, { snap: TW_CAM_SNAP[entry.id] });   // clickable move buttons (+ FTO orbit-snap)
    attachTwistyControls(tp, TW_TUMBLE[entry.id]);                           // NxN-style input: drag a sticker to turn, drag empty space to tumble
    playStatus.textContent = '3-D model'; playStatus.classList.remove('solved');
    return;
  }
  const isSim = entry.kind==='sim';
  playView.classList.toggle('sim-mode', isSim);
  document.getElementById('playUndo').style.display = isSim ? 'none' : '';
  document.getElementById('playHint').innerHTML =
      !isSim   ? 'Drag a <b>sticker</b> to turn that layer; drag the <b>background</b> to rotate (double-click to recentre). Or the <b>keyboard</b> (3×3, camera-relative): R L U D F B · slices M E S · rotations x y z (Shift = prime, Ctrl = double).'
    : entry.id==='pyra'  ? 'Drag a <b>sticker</b> to turn its corner, or <b>keyboard</b> U L R B (the face in that screen spot) — <b>Shift</b> = prime, <b>Ctrl</b> = tip. Drag the <b>background</b> to rotate (double-click to recentre). <b>Del</b> resets.'
    : entry.id==='skewb' ? 'Drag a <b>corner sticker</b> to twist that corner, or <b>keyboard</b> U L R B (the corner in that screen spot, Shift = reverse). Drag the <b>background</b> to rotate (double-click to recentre). <b>Del</b> resets.'
    : entry.id==='mega'  ? 'Drag any <b>sticker</b> to turn its face, or <b>keyboard</b> U L R B F (the face in that screen spot) — <b>Shift</b> = reverse, <b>Ctrl</b> = double (×2), <b>Shift+Ctrl</b> = double-reverse. Drag the <b>background</b> to rotate (double-click to recentre). <b>Del</b> resets.'
    : entry.id==='sq1'   ? 'Drag the <b>top</b> or <b>bottom</b> layer to rotate it (snaps to 30°); <b>click the middle band</b> (or press <b>/</b>) to slash. Drag the <b>background</b> to rotate the view. <b>Del</b> resets.'
    :                      'Click a <b>pin</b> to raise/lower it (on either face), then <b>drag a corner clock</b> to turn it and the pinned clocks. <b>Del</b> resets.';
  if (isSim) { playControls.setInteract({}); entry.sim.reset(); renderSim(); }
  else { playSimEl.innerHTML=''; playN = entry.n; playCube.rebuild({ N:playN }); playControls.setInteract({ drag:true, keys:true }); }   // clear any leftover twisty-player (frees its WebGL context)
  updateStatus();
}
function playScramble() {
  if (busy) return;
  if (playEntry.kind==='twisty') {                          // scramble the 3-D model
    const tp = playSimEl.querySelector('twisty-player'); if (!tp) return;
    if (playEntry.scr && window.wcaScramble) window.wcaScramble(playEntry.scr).then(s => { tp.experimentalSetupAlg = s; tp.alg = ''; playScrText.textContent = showMoves(s.split(/\s+/)); });
    else if (tp.experimentalModel) tp.experimentalModel.currentPattern.get().then(kp => { const own = randomModelScramble(kp.kpuzzle); if (own) { tp.experimentalSetupAlg = own; tp.alg = ''; } }).catch(()=>{});   // no cubing scramble → self-scramble with the model's own moves
    playStatus.textContent='Scrambled'; playStatus.classList.remove('solved'); return;
  }
  if (playEntry.kind==='cube') { const seq=fullScramble(playN); playCube.reset(); playCube.applyInstant(seq); playHist=[]; playMoves=0; playScrText.textContent=showMoves(seq); }
  else { const seq=playEntry.sim.scramble(); renderSim(); playScrText.textContent=showMoves(seq); }
  playStatus.textContent='Scrambled'; playStatus.classList.remove('solved');
}
async function playUndo() {
  if (busy || playEntry.kind!=='cube' || !playHist.length) return;
  const m = playHist.pop(); playMoves = Math.max(0, playMoves-1); busy = true;
  await playCube.animateMove({ axis:m.axis, angle:-m.angle, sel: p => p[m.axis]===m.lvl });
  busy = false; updateStatus();
}
const playSel = document.getElementById('playPuzzle');
playSel.innerHTML = PLAY_PUZZLES.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
playSel.value = '3x3';
playSel.addEventListener('change', e => playSelect(PLAY_PUZZLES.find(p => p.id===e.target.value)));
document.getElementById('playScramble').onclick = playScramble;
document.getElementById('playUndo').onclick = playUndo;
document.getElementById('playReset').onclick = () => { if (busy) return;
  if (playEntry.kind==='cube') playCube.reset();
  else if (playEntry.kind==='twisty') { const tp=playSimEl.querySelector('twisty-player'); if (tp) { tp.experimentalSetupAlg=''; tp.alg=''; } }   // 3-D model → back to solved
  else { playEntry.sim.reset(); renderSim(); }
  playHist=[]; playMoves=0; playScrText.textContent=''; updateStatus(); };
document.getElementById('playRecenter').onclick = () => {
  if (playEntry.kind==='cube') playControls.recenter();
  else if (playEntry.kind==='twisty') { /* the 3-D model auto-centres — nothing to recentre */ }
  else if (playEntry.sim && playEntry.sim.recenter) { playEntry.sim.recenter(); renderSim(); }
};
/* keyboard for SIM puzzles in the playground (Pyraminx: camera-relative faces + Alt = tips) */
document.addEventListener('keydown', e => {
  if (playView.classList.contains('hidden') || !playEntry || playEntry.kind!=='sim') return;
  if (e.metaKey) return;
  const sim = playEntry.sim;
  if (e.key==='Delete') { e.preventDefault(); sim.reset(); playHist=[]; playMoves=0; playScrText.textContent=''; renderSim(); updateStatus(); return; }
  if (playEntry.id==='sq1') { if (e.key==='/') { e.preventDefault(); sim.snapSlash(0, ()=>renderSim(), ()=>updateStatus()); } return; }   // Square-1: / = right slash (animated)
  if (sim.screenRoles) { simKeyMove(sim, e, { onChange:()=>{ renderSim(); updateStatus(); } }); return; }   // Pyraminx / Skewb / Megaminx
  if (e.altKey) return;
  const base = playEntry.keys && playEntry.keys[e.key.toLowerCase()]; if (!base) return;
  e.preventDefault();
  sim.applyTokens([base + (e.shiftKey ? "'" : '')]); renderSim(); updateStatus();
});
/* orbit + click-to-turn for sticker-based SIM puzzles (Pyraminx/Skewb/Megaminx); Square-1 has its own handler below */
attachSimPointer(playSimEl, () => playEntry && playEntry.kind==='sim' && playEntry.id!=='sq1' ? playEntry.sim : null, () => { renderSim(); updateStatus(); });
/* Square-1 interactivity (piece-based): drag a layer for a LIVE continuous spin that snap-animates to 30° on
   release; click the middle band to slash; drag the background to orbit. */
(() => { let st=null;
  playSimEl.addEventListener('pointerdown', e => {
    if (!playEntry || playEntry.id!=='sq1') return;
    const layerEl=e.target.closest('[data-layer]'), slashEl=e.target.closest('[data-slash]');
    if (layerEl)      st={ kind:'layer', layer:layerEl.dataset.layer, sx0:e.clientX, deg:0 };
    else if (slashEl) st={ kind:'slash', side: slashEl.dataset.slash==='L' ? 1 : 0 };   // flip whichever half was clicked
    else              st={ kind:'orbit', sx:e.clientX, sy:e.clientY };
    try{ playSimEl.setPointerCapture(e.pointerId); }catch(_){}
  });
  playSimEl.addEventListener('pointermove', e => {
    if (!st || !playEntry || playEntry.id!=='sq1') return; const sim=playEntry.sim;
    if (st.kind==='orbit') { sim.rotateView(e.clientX-st.sx, e.clientY-st.sy); st.sx=e.clientX; st.sy=e.clientY; renderSim(); updateStatus(); }
    else if (st.kind==='layer') { st.deg=-(e.clientX-st.sx0)*1.2; sim.setSpin(st.layer, st.deg); renderSim(); }   // ~25px = 30°, sign follows the mouse
  });
  const end=()=>{ if (!st) return; const sim=playEntry&&playEntry.sim;
    if (sim && st.kind==='slash') { sim.snapSlash(st.side, () => renderSim(), () => updateStatus()); }
    else if (sim && st.kind==='layer') { sim.snapTurn(st.layer, st.deg, () => renderSim(), () => updateStatus()); }
    else if (sim && st.kind==='orbit' && sim.snapView) { sim.snapView(() => { renderSim(); updateStatus(); }); }   // settle to nearest face-up 3/4
    st=null; };
  playSimEl.addEventListener('pointerup', end);
  playSimEl.addEventListener('pointercancel', end);
})();
/* Clock interactivity: click a pin to toggle it; drag a corner clock to turn it + the up-pinned clocks */
(() => { let drag=null;
  playSimEl.addEventListener('pointerdown', e => {
    const sim = playEntry && playEntry.sim; if (!sim || !sim.turn) return;     // clock-like sims only
    const pin = e.target.closest('[data-pin]');
    if (pin) { sim.togglePin(pin.dataset.pin); renderSim(); updateStatus(); return; }
    const corner = e.target.closest('[data-corner]');
    if (corner) { const r=corner.getBoundingClientRect();
      drag={ sim, key:corner.dataset.corner, side:corner.dataset.side==='B'?'back':'front', cx:r.left+r.width/2, cy:r.top+r.height/2, acc:0, applied:0 };
      drag.last = Math.atan2(e.clientY-drag.cy, e.clientX-drag.cx);
      try{ playSimEl.setPointerCapture(e.pointerId); }catch(_){} }
  });
  playSimEl.addEventListener('pointermove', e => {
    if (!drag) return;
    const a = Math.atan2(e.clientY-drag.cy, e.clientX-drag.cx);
    let dd = a - drag.last; while (dd>Math.PI) dd-=2*Math.PI; while (dd<-Math.PI) dd+=2*Math.PI;
    drag.acc += dd * CLOCK_SENS; drag.last = a;
    const hours = Math.round(drag.acc / (Math.PI/6));
    if (hours !== drag.applied) { drag.sim.turn(drag.side, drag.key, hours-drag.applied); drag.applied=hours; renderSim(); updateStatus(); }
  });
  const end=()=>{ drag=null; }; playSimEl.addEventListener('pointerup', end); playSimEl.addEventListener('pointercancel', end);
})();
/* Redi Cube in the playground: click a corner sticker to twist it (Shift = counter-clockwise). */
playSimEl.addEventListener('pointerdown', e => {
  if (!playEntry || playEntry.id!=='redi') return;
  const cn = e.target.closest('[data-corner]'); if (!cn) return;
  rediSim.twist(+cn.dataset.corner, e.shiftKey); renderSim(); updateStatus();
});
playSelect(PLAY_PUZZLES.find(p => p.id==='3x3'));   // initialise

function openPlay() {
  homeMode=false; statsMode=false; timerMode=false; closePanel();
  document.querySelectorAll('.puzzle-tab.selected').forEach(t=>t.classList.remove('selected'));
  document.querySelector('.puzzle-tab[data-cat="play"]').classList.add('selected');
  crumb.innerHTML = '<b>Virtual Cube</b>';
  updateStatus(); show('view-play');
}
function openStats() {
  homeMode=false; statsMode=true; timerMode=false; closePanel();
  document.querySelectorAll('.puzzle-tab.selected').forEach(t=>t.classList.remove('selected'));
  document.querySelector('.puzzle-tab[data-cat="stats"]').classList.add('selected');
  crumb.innerHTML = '<b>Statistics</b>';
  renderStatsView(); show('view-stats');
}
/* ---- Universal Timer: a top-level tab running any event's full-solve timer (no per-step Mode selector).
   Reuses the whole trainer view; solves share each event's existing 'timer:<event>:solve' history. ---- */
const TIMER_EVENTS = PUZZLES.filter(p => p.methods.some(m => m.id==='timer' && (m.items||[]).some(i => i.id==='solve')))
                            .map(p => ({ id:p.id, name: p.fam ? p.name : shortName(p.name) }));   // Non-WCA keep their shape name (several share an NxN size)
let timerEvent = '3x3';
function loadTimerEvent(ev) {
  timerEvent = ev;
  const L = LESSONS[ev+'/timer/solve'] || {};
  document.getElementById('trainerIntro').innerHTML =
    `<h2>${shortName(getP(ev).name)} — Timer</h2><p>Full-solve timer for any event — pick one above. Inspection, penalties, scramble and history all work exactly like each event's own timer, and share the same saved records.</p>`;
  trPuzzle = ev;
  trCount = !!L.countMode;                       // FMC: record a move count instead of a time
  trModeDefs = null;
  trSet = []; trKind = L.kind || 'oll'; trSetId = 'timer:'+ev; trKey = null;
  trMode = 'solve';
  trView.classList.toggle('mode-solve', true);
  trView.classList.toggle('solve-only', true);   // hides the Step/Full Mode selector for every event
  trView.classList.toggle('count-mode', trCount);
  document.getElementById('trFilter').value = trFilter;
  document.getElementById('trProb').value = trProb;
  configTcube();
  trState='idle'; cancelAnimationFrame(trRAF); trTimerEl.classList.remove('armed'); trTimerEl.textContent = trCount ? '—' : '0.00';
  reloadTimes(); newScramble();
}
function renderUniversalTimer() {
  trView.classList.add('universal');             // reveals the Event dropdown, keeps the Mode one hidden
  document.getElementById('trEvent').value = timerEvent;
  loadTimerEvent(timerEvent);
}
function openTimer() {
  homeMode=false; statsMode=false; timerMode=true; closePanel();
  document.querySelectorAll('.puzzle-tab.selected').forEach(t=>t.classList.remove('selected'));
  document.querySelector('.puzzle-tab[data-cat="timer"]').classList.add('selected');
  crumb.innerHTML = '<b>Timer</b>';
  renderUniversalTimer(); show('view-trainer');
}
(function initTimerDropdown(){
  const sel=document.getElementById('trEvent'); if (!sel) return;
  sel.innerHTML = TIMER_EVENTS.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
  sel.addEventListener('change', e => { loadTimerEvent(e.target.value); e.target.blur(); });   // blur so the dropdown can't keep focus and swallow timer keystrokes (type-ahead switching events mid-solve)
})();

/* ================================================================
   STATISTICS VIEW — historical analysis of every solve on the current
   profile, across all events. Reads the same per-profile store the
   trainer writes to (Profiles → times[setId]); re-rendered on profile
   switch via render(). Excludes deleted solves (deletion removes them).
   ================================================================ */
const statsView = document.getElementById('view-stats');
document.getElementById('statsGroupBy').addEventListener('change', e => { statsGroupBy = e.target.value; renderStatsView(); });
document.getElementById('statsSubX').addEventListener('input', e => {
  const v=parseFloat(e.target.value); statsSubMs = (Number.isFinite(v)&&v>0) ? Math.round(v*1000) : null; renderStatsView();
});
document.getElementById('statsEvents').addEventListener('click', e => { const tr=e.target.closest('tr[data-eid]'); if (!tr) return; statsSelEvent=tr.dataset.eid; renderStatsView(); });
const STATS_PZNAME = (() => { const m={}; (typeof PUZZLES!=='undefined'?PUZZLES:[]).forEach(p=>{ m[p.id]=p.name.split('(')[0].trim(); }); return m; })();
function statsLabel(setId) {
  const titleCase = s => s.replace(/\b\w/g, c => c.toUpperCase());
  const virt = setId.endsWith(':virtual'); if (virt) setId = setId.slice(0, -8);   // strip ':virtual'
  const tag = virt ? ' · Virtual' : '';
  if (setId.startsWith('timer:')) { const parts=setId.split(':'); const pz=STATS_PZNAME[parts[1]]||parts[1]; const mode=parts[2]||'solve';
    return (mode==='solve' ? pz+' — Timer' : pz+' — '+mode.toUpperCase()) + tag; }
  const base = setId.replace(/:solve$/,'');
  const known = { pll:'PLL', oll:'OLL', f2l:'F2L', cll:'CLL', eg1:'EG-1', eg2:'EG-2', pbl:'PBL', cmll:'CMLL', zbll:'ZBLL' };
  if (known[base]) return known[base]+' Trainer'+tag;
  return titleCase(base.replace(/[-_/]/g,' '))+tag;
}
function statsAllSets() {
  const times = Profiles.data().times || {};
  return Object.keys(times).map(id => ({ id, solves: times[id]||[] })).filter(e => e.solves.length>0);
}
function statsMeanSd(solves) {
  const xs = solves.map(effMs).filter(x => x!==null); const n = xs.length;
  if (!n) return { n:0, mean:null, sd:null };
  const mean = xs.reduce((a,b)=>a+b,0)/n;
  if (n<2) return { n, mean, sd:0 };
  const variance = xs.reduce((a,x)=>a+(x-mean)*(x-mean),0)/(n-1);
  return { n, mean, sd:Math.sqrt(variance) };
}
let statsGroupBy = 'week';                               // Solve | Hour | Day | Week | Month — x-axis granularity of the trend chart
let statsSelEvent = null;                                // event id whose trend the chart shows (null → the most-solved event)
let statsSubMs = null;                                   // sub-X target (ms) for the deep panel; null → auto from the selected event's mean
function statsBucketStart(t, g) {
  const d=new Date(t);
  if (g==='hour') { d.setMinutes(0,0,0); return d; }
  d.setHours(0,0,0,0);
  if (g==='day') return d;
  if (g==='month') { d.setDate(1); return d; }
  const dow=(d.getDay()+6)%7; d.setDate(d.getDate()-dow); return d;   // week → Monday
}
function statsBuckets(solves, g) {
  if (g==='solve')                                        // each solve is its own point (no σ band)
    return solves.slice().sort((a,b)=>a.t-b.t).map(s => ({ start:new Date(s.t), n:1, mean:effMs(s), sd:0 }));
  const buckets = new Map();
  solves.forEach(s => { const k=statsBucketStart(s.t,g).getTime(); if(!buckets.has(k)) buckets.set(k,[]); buckets.get(k).push(s); });
  return [...buckets.keys()].sort((a,b)=>a-b).map(k => { const st=statsMeanSd(buckets.get(k)); return { start:new Date(k), n:st.n, mean:st.mean, sd:st.sd }; });
}
const statsDateFmt = (d, g) => g==='hour' ? d.toLocaleString([],{month:'short',day:'numeric',hour:'numeric'})
  : g==='month' ? d.toLocaleDateString([],{month:'short',year:'numeric'})
  : g==='solve' ? d.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})
  : d.toLocaleDateString([],{month:'short',day:'numeric'});
function statsChartSVG(weeks, g) {
  const pts = weeks.filter(w => w.mean!==null);
  if (pts.length<2) return '<div class="stats-empty">Not enough timed solves yet to chart a trend at this grouping.</div>';
  const W=760, H=240, padL=56, padR=16, padT=16, padB=34, iw=W-padL-padR, ih=H-padT-padB;
  let lo=Infinity, hi=-Infinity;
  pts.forEach(w => { lo=Math.min(lo,w.mean-(w.sd||0)); hi=Math.max(hi,w.mean+(w.sd||0)); });
  if (lo===hi) { lo-=1000; hi+=1000; }
  const pad=(hi-lo)*0.08; lo-=pad; hi+=pad; lo=Math.max(0,lo);
  const n=pts.length, x=i=>padL+(n===1?iw/2:(i/(n-1))*iw), y=v=>padT+ih-((v-lo)/(hi-lo))*ih;
  const tops=pts.map((w,i)=>`${x(i).toFixed(1)},${y(w.mean+(w.sd||0)).toFixed(1)}`);
  const bots=pts.map((w,i)=>`${x(i).toFixed(1)},${y(w.mean-(w.sd||0)).toFixed(1)}`).reverse();
  const band=`<polygon class="sc-band" points="${tops.concat(bots).join(' ')}"/>`;
  const line=`<polyline class="sc-line" points="${pts.map((w,i)=>`${x(i).toFixed(1)},${y(w.mean).toFixed(1)}`).join(' ')}"/>`;
  const dots=pts.map((w,i)=>`<circle class="sc-dot" cx="${x(i).toFixed(1)}" cy="${y(w.mean).toFixed(1)}" r="3"/>`).join('');
  let grid='';
  for (let g=0;g<=3;g++){ const v=lo+(g/3)*(hi-lo), yy=y(v).toFixed(1);
    grid+=`<line class="sc-grid" x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}"/><text class="sc-txt" x="${padL-6}" y="${(+yy+3).toFixed(1)}" text-anchor="end">${fmt(v)}</text>`; }
  const idxs = n<=6 ? pts.map((_,i)=>i) : [0,Math.floor(n/2),n-1];
  const xlab = idxs.map(i => `<text class="sc-txt" x="${x(i).toFixed(1)}" y="${H-12}" text-anchor="middle">${statsDateFmt(pts[i].start, g)}</text>`).join('');
  const axis=`<line class="sc-axis" x1="${padL}" y1="${padT+ih}" x2="${W-padR}" y2="${padT+ih}"/><line class="sc-axis" x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+ih}"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly mean solve time with standard-deviation band">${grid}${band}${line}${dots}${axis}${xlab}</svg>`;
}
function statsBucketTable(weeks, g) {
  if (!weeks.length) return '';
  const head = g==='hour' ? 'Hour' : g==='day' ? 'Day' : g==='month' ? 'Month' : 'Week of';
  let rows='';
  for (let i=weeks.length-1;i>=0;i--){ const w=weeks[i];
    rows+=`<tr><td class="ev">${statsDateFmt(w.start, g)}</td><td>${w.n}</td><td>${w.mean==null?'—':fmt(w.mean)}</td><td>${w.sd==null?'—':fmt(w.sd)}</td></tr>`; }
  return `<table class="stats-table"><thead><tr><th>${head}</th><th>n</th><th>Mean</th><th>σ</th></tr></thead><tbody>${rows}</tbody></table>`;
}
/* best / worst / current WCA average of n across the whole history (rolling window) */
function rollingAo(solves, n) {
  const cur = avgN(solves, solves.length-1, n);
  let best=null, worst=null;
  for (let e=n-1; e<solves.length; e++) { const v=avgN(solves,e,n);
    if (typeof v==='number') { if (best==null||v<best) best=v; if (worst==null||v>worst) worst=v; } }
  return { cur, best, worst };
}
const fmtA = x => (x==null || x===undefined) ? '—' : x==='dnf' ? 'DNF' : fmt(x);   // average formatter (always time-style, for the stats page)
/* Deep per-event panel: best/mean/σ/worst, best & current Ao5/12/50/100, sub-X %, DNF rate. */
function statsDeepPanel(sel) {
  const deepEl=document.getElementById('statsDeep'), titleEl=document.getElementById('statsDeepTitle'), subInput=document.getElementById('statsSubX');
  const solves=sel.solves, singles=solves.map(effMs).filter(x=>x!==null);
  const n=solves.length, valid=singles.length, dnf=solves.filter(s=>s.p==='dnf').length;
  titleEl.textContent='Averages & distribution — '+statsLabel(sel.id);
  const ms=statsMeanSd(solves);
  const best=valid?Math.min(...singles):null, worst=valid?Math.max(...singles):null;
  if (statsSubMs==null && ms.mean) statsSubMs=Math.max(1000, Math.round(ms.mean/1000)*1000);
  if (document.activeElement!==subInput) subInput.value = statsSubMs ? (statsSubMs/1000) : '';
  const sub=statsSubMs, subCount=sub?singles.filter(x=>x<=sub).length:0, subPct=valid?subCount/valid*100:0;
  const isCount = /(?:^|:)fmc(?::|$)/.test(sel.id || '');   // FMC stores a move COUNT, not a time
  const fA = x => (x==null) ? '—' : x==='dnf' ? 'DNF' : (isCount ? String(Math.round(x)) : fmt(x));
  const cards=[];
  cards.push({l:'Best single', v:fA(best)});
  cards.push({l:'Mean', v:fA(ms.mean), s:valid+' valid'});
  cards.push({l:'σ spread', v:ms.sd==null?'—':(isCount?ms.sd.toFixed(1):fmt(ms.sd))});
  cards.push({l:'Worst single', v:fA(worst)});
  [['Ao5',5],['Ao12',12],['Ao50',50],['Ao100',100]].forEach(([l,k])=>{
    if (n>=k) { const r=rollingAo(solves,k); cards.push({l:'Best '+l, v:fA(r.best), s:'now '+fA(r.cur)}); } });
  cards.push({l:'Sub-'+(sub/1000)+'s', v:subPct.toFixed(0)+'%', s:subCount+' of '+valid});
  cards.push({l:'DNF rate', v:(n?(dnf/n*100).toFixed(0):'0')+'%', s:dnf+' of '+n, dnf:dnf>0});
  deepEl.innerHTML = cards.map(c=>`<div class="deep-card"><div class="dc-lbl">${c.l}</div><div class="dc-val${c.dnf?' dnf':''}">${c.v}</div>${c.s?`<div class="dc-sub">${c.s}</div>`:''}</div>`).join('');
}
/* Distribution histogram of single times for the selected event. Bars left of the median are "fast" (accent). */
function statsHistoSVG(solves) {
  const xs=solves.map(effMs).filter(x=>x!==null).sort((a,b)=>a-b);
  if (xs.length<5) return '<div class="stats-empty">Need at least 5 timed solves to plot a distribution.</div>';
  const lo=xs[0], hi=xs[xs.length-1];
  if (lo===hi) return '<div class="stats-empty">Every solve is identical — no spread to plot.</div>';
  const bins=Math.min(18, Math.max(6, Math.round(Math.sqrt(xs.length))));
  const w=(hi-lo)/bins, counts=new Array(bins).fill(0);
  xs.forEach(v=>{ let b=Math.floor((v-lo)/w); if (b>=bins) b=bins-1; counts[b]++; });
  const maxC=Math.max(...counts), median=xs[Math.floor(xs.length/2)];
  const W=760,H=200,padL=30,padR=12,padT=12,ih=H-padT-26, iw=W-padL-padR, bw=iw/bins;
  let grid='';
  for (let g=0;g<=2;g++){ const c=Math.round(maxC*g/2), yy=(padT+ih-ih*g/2).toFixed(1);
    grid+=`<line class="sc-grid" x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}"/><text class="sc-txt" x="${padL-5}" y="${(+yy+3).toFixed(1)}" text-anchor="end">${c}</text>`; }
  let bars='';
  for (let i=0;i<bins;i++){ const h=ih*counts[i]/maxC, x=padL+i*bw, y=padT+ih-h, mid=lo+(i+0.5)*w;
    bars+=`<rect class="hb-bar ${mid>median?'slow':''}" x="${(x+1).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw-2).toFixed(1)}" height="${Math.max(0,h).toFixed(1)}" rx="2"><title>${fmt(lo+i*w)}–${fmt(lo+(i+1)*w)}: ${counts[i]} solve${counts[i]===1?'':'s'}</title></rect>`; }
  const lab=(v,xx,a)=>`<text class="sc-txt" x="${xx}" y="${H-9}" text-anchor="${a}">${fmt(v)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Distribution of single solve times">${grid}${bars}${lab(lo,padL,'start')}${lab(median,padL+iw/2,'middle')}${lab(hi,W-padR,'end')}</svg>`;
}
/* GitHub-style practice heatmap: solves per day across the whole profile, plus active-day & streak counts. */
function statsHeatRender() {
  const heatEl=document.getElementById('statsHeat'), subEl=document.getElementById('statsHeatSub');
  const times=Profiles.data().times||{}, byDay=new Map(); let total=0;
  Object.keys(times).forEach(id=>(times[id]||[]).forEach(s=>{ const d=new Date(s.t); d.setHours(0,0,0,0); const k=d.getTime(); byDay.set(k,(byDay.get(k)||0)+1); total++; }));
  if (!total) { heatEl.innerHTML='<div class="stats-empty">No solves yet.</div>'; subEl.textContent=''; return; }
  const DAY=86400000, today=new Date(); today.setHours(0,0,0,0); const todayT=today.getTime();
  const mondayOf=t=>{ const d=new Date(t); d.setHours(0,0,0,0); const dow=(d.getDay()+6)%7; d.setDate(d.getDate()-dow); return d.getTime(); };
  const start=Math.max(mondayOf(Math.min(...byDay.keys())), mondayOf(todayT-52*7*DAY));
  const cols=Math.round((mondayOf(todayT)-start)/(7*DAY))+1;
  const cell=12, gap=3, step=cell+gap, padTop=16, padLeft=28, W=padLeft+cols*step, H=padTop+7*step;
  let cells='', labels='', lastMonth=-1;
  for (let c=0;c<cols;c++){ const colStart=start+c*7*DAY, m=new Date(colStart).getMonth();
    if (m!==lastMonth){ lastMonth=m; labels+=`<text class="hc-txt" x="${padLeft+c*step}" y="10">${new Date(colStart).toLocaleDateString([],{month:'short'})}</text>`; }
    for (let r=0;r<7;r++){ const t=colStart+r*DAY; if (t>todayT) continue;
      const ct=byDay.get(t)||0, lv=ct===0?0:ct<=2?1:ct<=5?2:ct<=12?3:4;
      const dl=new Date(t).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric',year:'numeric'});
      cells+=`<rect class="hc${lv}" x="${padLeft+c*step}" y="${padTop+r*step}" width="${cell}" height="${cell}" rx="2"><title>${dl}: ${ct} solve${ct===1?'':'s'}</title></rect>`; } }
  ['Mon','Wed','Fri'].forEach((d,i)=>{ labels+=`<text class="hc-txt" x="0" y="${padTop+(i*2)*step+cell-2}">${d}</text>`; });
  heatEl.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Solves per day heatmap">${labels}${cells}</svg>`;
  const days=[...byDay.keys()].sort((a,b)=>a-b), daySet=new Set(days);
  let cur=0, probe=daySet.has(todayT)?todayT:todayT-DAY;      // count today, or through yesterday if nothing logged today yet
  while (daySet.has(probe)) { cur++; probe-=DAY; }
  let longest=0, run=0, prev=null;
  days.forEach(d=>{ run=(prev!=null && d-prev===DAY)?run+1:1; if (run>longest) longest=run; prev=d; });
  subEl.textContent=`${total} solves over ${days.length} day${days.length===1?'':'s'} · current streak ${cur} · longest ${longest}`;
}
function renderStatsView() {
  const sets = statsAllSets();
  const summaryEl=document.getElementById('statsSummary'), eventsEl=document.getElementById('statsEvents'),
        chartEl=document.getElementById('statsChart'), weeksEl=document.getElementById('statsWeeks'),
        trendTtl=document.getElementById('statsTrendTitle'), histEl=document.getElementById('statsHistory');
  if (!sets.length) {
    summaryEl.innerHTML='<div class="stats-empty">No solves recorded yet on this profile. Use any Timer or Trainer to start building history.</div>';
    eventsEl.innerHTML=''; chartEl.innerHTML=''; weeksEl.innerHTML=''; histEl.innerHTML='';
    document.getElementById('statsDeep').innerHTML=''; document.getElementById('statsHisto').innerHTML='';
    statsHeatRender(); return;
  }
  let totalSolves=0, overallBest=null; const allSingles=[];
  sets.forEach(e => { totalSolves+=e.solves.length; e.solves.forEach(s=>{ const v=effMs(s); if(v!==null) allSingles.push(v); }); });
  if (allSingles.length) overallBest=Math.min(...allSingles);
  summaryEl.innerHTML =
      `<div class="stat-card"><div class="sc-val">${totalSolves}</div><div class="sc-lbl">Total solves</div></div>`
    + `<div class="stat-card"><div class="sc-val">${sets.length}</div><div class="sc-lbl">Events practiced</div></div>`
    + `<div class="stat-card"><div class="sc-val">${overallBest==null?'—':fmt(overallBest)}</div><div class="sc-lbl">Best single</div></div>`;
  const rows = sets.map(e => {
    const n=e.solves.length, singles=e.solves.map(effMs).filter(x=>x!==null);
    const best=singles.length?Math.min(...singles):null, ao5=avgN(e.solves,n-1,5), ao12=avgN(e.solves,n-1,12);
    let trend='', tcls='';
    if (singles.length>=6) { const k=Math.floor(singles.length/3); const early=singles.slice(0,k), late=singles.slice(-k);
      const mean=a=>a.reduce((x,y)=>x+y,0)/a.length; const em=mean(early), lm=mean(late), pct=(em-lm)/em*100; const up=pct>=0;
      tcls=Math.abs(pct)<1?'':up?'up':'down'; trend=(up?'▼ ':'▲ ')+Math.abs(pct).toFixed(0)+'%'; } else trend='—';
    return { id:e.id, n, best, ao5, ao12, trend, tcls, label:statsLabel(e.id) };
  }).sort((a,b)=>b.n-a.n);
  const top = sets.slice().sort((a,b)=>b.solves.length-a.solves.length)[0];
  const sel = sets.find(e=>e.id===statsSelEvent) || top;     // the trend chart follows the clicked event row
  let evHtml='';
  rows.forEach(r => { evHtml+=`<tr class="ev-row${r.id===sel.id?' sel':''}" data-eid="${r.id}" title="Show this event in the chart"><td class="ev">${r.label}</td><td>${r.n}</td><td>${r.best==null?'—':fmt(r.best)}</td>`
    +`<td class="${r.ao5==='dnf'?'dnf':''}">${fmtAvg(r.ao5)}</td><td class="${r.ao12==='dnf'?'dnf':''}">${fmtAvg(r.ao12)}</td>`
    +`<td class="stats-trend ${r.tcls}">${r.trend}</td></tr>`; });
  eventsEl.innerHTML=`<table class="stats-table"><thead><tr><th>Event / Mode</th><th>Solves</th><th>Best</th><th>Ao5</th><th>Ao12</th><th>Trend</th></tr></thead><tbody>${evHtml}</tbody></table>`;
  const g = statsGroupBy, weeks = statsBuckets(sel.solves, g);
  const GL = { solve:'by solve', hour:'by hour', day:'by day', week:'by week', month:'by month' }[g];
  trendTtl.textContent='Improvement over time — '+statsLabel(sel.id)+' ('+GL+')';
  chartEl.innerHTML=statsChartSVG(weeks, g); weeksEl.innerHTML = g==='solve' ? '' : statsBucketTable(weeks, g);
  statsDeepPanel(sel);
  document.getElementById('statsHisto').innerHTML = statsHistoSVG(sel.solves);
  statsHeatRender();
  const flat=[]; sets.forEach(e => { const lbl=statsLabel(e.id); e.solves.forEach(s=>flat.push({s,lbl})); });
  flat.sort((a,b)=>b.s.t-a.s.t);
  let hrows='';
  flat.forEach((r,i) => { const s=r.s; const date=new Date(s.t).toLocaleString([],{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    hrows+=`<tr><td class="muted">${i+1}</td><td class="ev">${r.lbl}</td><td class="${s.p==='dnf'?'dnf':''}">${fmtSolve(s)}</td><td class="muted" style="font-family:inherit">${date}</td></tr>`; });
  histEl.innerHTML=`<table class="stats-table"><thead><tr><th>#</th><th>Event</th><th>Time</th><th>Date</th></tr></thead><tbody>${hrows}</tbody></table>`;
}

/* ===== START ===== */
goHome();
