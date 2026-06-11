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
function addSolve(setId, ms, p) { getSolves(setId).push({ ms: Math.round(ms), p: p || 0, t: Date.now() }); Profiles.save(); if (window.cloudSyncSet) cloudSyncSet(setId); }
function clearSolves(setId) { Profiles.data().times[setId] = []; Profiles.save(); if (window.cloudSyncSet) cloudSyncSet(setId); }

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
const sqSim = makeSquare1(), clockSim = makeClock(), pyraSim = makePyraminx(), skewbSim = makeSkewb(), megaSim = makeMegaminx();
megaSim.flipTurn = true;   // Megaminx face turns read the opposite way from the drag without this
const SIM = { sq1: sqSim, clock: clockSim, pyra: pyraSim, skewb: skewbSim, mega: megaSim };
const SIM_KEYS = {                                       // 3-D sims solvable with the camera-relative u/l/r/b keys
  pyra:  { sim: pyraSim,  map: { u:'U', l:'L', r:'R', b:'B' } },
  skewb: { sim: skewbSim, map: { u:'U', l:'L', r:'R', b:'B' } },
  mega:  { sim: megaSim,  map: { u:'U', l:'L', r:'R', b:'B' } },
};
const trainerSimEl = document.getElementById('trainerSim');
const lessonSimEl   = document.getElementById('lessonSim');
/* ---- shared SIM interaction (orbit + click-to-turn for 3-D sims like Pyraminx) ---- */
function simKeyMove(sim, e, opts={}) {          // Pyraminx camera-relative: u/l/r/b → screen role; Ctrl (or Alt) = tip; Shift = prime
  const role = { u:'top', l:'bl', r:'br', b:'back' }[e.key.toLowerCase()];
  if (!role) return;
  e.preventDefault();
  const V = sim.screenRoles()[role];
  if (opts.onTurnStart) opts.onTurnStart();
  const tip = e.ctrlKey || e.altKey;             // Pyraminx has no doubles, so the "double" modifier (Ctrl) turns the tip instead
  const tok = (tip ? V.toLowerCase() : V) + (e.shiftKey ? "'" : '');
  if (sim.animateMove) sim.animateMove(tok, 220, opts.onChange).then(() => { if (opts.onTurn) opts.onTurn(); });
  else { sim.applyTokens([tok]); if (opts.onChange) opts.onChange(); if (opts.onTurn) opts.onTurn(); }
}
function attachSimPointer(el, getSim, onChange, hooks={}) {
  let mode=null, sx=0, sy=0, turnV=null, turnTip=null, dnx=0, dny=0;
  const ORBIT_SWEEP=30;                       // a sticker drag past this becomes a free camera orbit (turns are short flicks)
  el.addEventListener('pointerdown', e => {
    const sim=getSim(); if (!sim) return;
    const fl = e.target.closest('[data-v]');
    // sticker-down starts PENDING: a short flick turns that piece; a longer sweep promotes to orbit so the
    // camera can be spun (incl. horizontal/Y) from anywhere, not just the thin empty margins.
    if (fl && sim.screenRoles) { mode='pending'; turnV=fl.dataset.v; turnTip=fl.dataset.tip; dnx=sx=e.clientX; dny=sy=e.clientY; try{ el.setPointerCapture(e.pointerId); }catch(_){} return; }
    if (sim.rotateView) { mode='orbit'; sx=e.clientX; sy=e.clientY; try{ el.setPointerCapture(e.pointerId); }catch(_){} }
  });
  el.addEventListener('pointermove', e => { const sim=getSim(); if (!sim) return;
    if (mode==='pending' && sim.rotateView && Math.hypot(e.clientX-dnx, e.clientY-dny) > ORBIT_SWEEP) { mode='orbit'; sx=e.clientX; sy=e.clientY; }
    if (mode==='orbit') { sim.rotateView(e.clientX-sx, e.clientY-sy); sx=e.clientX; sy=e.clientY; onChange(); } });
  el.addEventListener('pointerup', e => {
    const sim=getSim();
    if (mode==='pending' && turnV && sim) {
      const r=el.getBoundingClientRect();
      const dx=e.clientX-dnx, dy=e.clientY-dny;
      if (Math.hypot(dx,dy) >= 9) {                 // drag a sticker to turn (a TIP facelet → tip turn)
        let tok;
        if (sim.moveFromDrag) tok = sim.moveFromDrag(turnV, dnx, dny, e.clientX, e.clientY, r);   // Megaminx: turn the face the drag points to (may be a neighbour)
        else { let cr = (dnx-(r.left+r.width/2))*dy - (dny-(r.top+r.height/2))*dx; if (sim.flipTurn) cr=-cr;
               tok = (turnTip ? turnV.toLowerCase() : turnV) + (cr > 0 ? "'" : ''); }
        if (tok) { if (hooks.onTurnStart) hooks.onTurnStart();
          if (sim.animateMove) sim.animateMove(tok, 220, onChange).then(() => { if (hooks.onTurn) hooks.onTurn(); });
          else { sim.applyTokens([tok]); onChange(); if (hooks.onTurn) hooks.onTurn(); } }
      }
    }
    mode=null; turnV=null; turnTip=null;
  });
  el.addEventListener('pointercancel', () => { mode=null; turnV=null; turnTip=null; });
  el.addEventListener('dblclick', () => { const sim=getSim(); if (sim && sim.recenter) { sim.recenter(); onChange(); } });
}
/* trainer: orbit + click-to-turn for 3-D sims (Pyraminx), driving the timer */
attachSimPointer(trainerSimEl,
  () => (SIM[trPuzzle] && SIM[trPuzzle].screenRoles && trCubeMode==='virtual' && !trView.classList.contains('hidden')) ? SIM[trPuzzle] : null,
  () => { trainerSimEl.innerHTML = SIM[trPuzzle].svg(); },
  { onTurnStart: () => { if (trState==='idle') startSolve(); },
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
  const end=()=>{o=null;}; lessonSimEl.addEventListener('pointerup',end); lessonSimEl.addEventListener('pointercancel',end);
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
  const DEF_RX=-26, DEF_RY=-34;
  let rx=DEF_RX, ry=DEF_RY, mode=null, sx=0, sy=0, downFace=null;
  let enabled=false, dragTurns=false, keysActive=false;   // orbit when enabled; sticker-drag turns only if dragTurns; keyboard only if keysActive
  const faceMap = new Map();
  const apply = () => { cubeEl.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; };
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
  const end = e => { if (mode){ try{ sceneEl.releasePointerCapture(e.pointerId); }catch(_){} } mode=null; };
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
  onTurnStart: () => { if (trCubeMode!=='physical' && trState==='idle') startSolve(); },  // start timing on first move
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
    onTurnStart: () => { if (trState==='idle') startSolve(); },
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
    drag.acc += dd; drag.last = a;
    const hours = Math.round(drag.acc / (Math.PI/6));
    if (hours !== drag.applied) {
      if (trState==='idle') startSolve();
      clockSim.turn(drag.side, drag.key, hours-drag.applied); drag.applied=hours; trainerSimEl.innerHTML=clockSim.svg();
      if (trState==='running' && clockSim.isSolved()) stopSolve();
    }
  });
  const end=()=>{ drag=null; }; trainerSimEl.addEventListener('pointerup', end); trainerSimEl.addEventListener('pointercancel', end);
})();
document.addEventListener('keydown', e => { if (clockActive() && e.key==='Delete') { e.preventDefault(); resetAttempt(); } });

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
        chip.innerHTML = `<b>${a.name}</b><span class="mono">${mvStr(a).replace(/'/g,'′')}</span>`;
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
const diagramFor = (kind, setup) => kind==='pll' ? pllSVG(setup) : ollSVG(setup);   // setup = scramble that produces the case
function renderSheet(path) {
  const L = LESSONS[path], set = ALG_SETS[L.set];
  sheetIntro.innerHTML = `<h2>${L.title}</h2>` + (L.intro||[]).map(p=>`<p>${p}</p>`).join('')
    + `<p class="learn-hint"><b>Right-click</b> a case to mark your progress: ⚫ unlearned → 🟡 learning → 🟢 learned (saved on this device).</p>`;
  sheetGrid.innerHTML = '';
  set.forEach(a => {
    const card = document.createElement('button'); card.className = 'case-card learn-' + getLearn(L.set, a.name);
    card.innerHTML = `<span class="learn-dot"></span>
      <div class="case-dia">${diagramFor(L.kind, invertSeq(a.moves))}</div>
      <div class="case-name">${a.name}</div>
      <div class="case-alg">${(Array.isArray(a.moves)?a.moves.join(' '):a.moves).replace(/'/g,'′')}</div>`
      + (a.alt ? `<div class="case-alt">alt: ${a.alt.replace(/'/g,'′')}</div>` : '');
    card.onclick = () => { sheetGrid.querySelectorAll('.case-card').forEach(c=>c.classList.remove('sel')); card.classList.add('sel'); sheetPlayer.arm(a.moves); sheetPlayer.play(); };
    card.addEventListener('contextmenu', e => { e.preventDefault(); const s = cycleLearn(L.set, a.name);
      card.classList.remove('learn-0','learn-1','learn-2'); card.classList.add('learn-' + s); });
    sheetGrid.appendChild(card);
  });
  if (set[0]) sheetPlayer.arm(set[0].moves);
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
/* Square-1 & Clock scrambles come from their simulators (legal moves; sim is left showing the state). */
const SHAPED_SCRAMBLE = { pyra:()=>pyraSim.scramble(), skewb:()=>skewbSim.scramble(), mega:()=>megaSim.scramble(),
                          sq1:()=>sqSim.scramble(), clock:()=>clockSim.scramble() };

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
function newScramble() {
  if (trMode==='solve') {
    trCur = null; trScramble = fullScramble(trPuzzle);
  } else {
    trCur = pickCase(); trScramble = caseScramble(trCur.moves);
    trDiagram.innerHTML = (trKind==='oll'||trKind==='pll')        // F2L etc. have no last-layer diagram → solve on the cube
      ? diagramFor(trKind, trScramble)
      : '<div class="dia-note">Solve the case<br>on the cube →</div>';
    updateStatusPill();
  }
  if (isRenderable(trPuzzle)) { tcube.reset(); tcube.applyInstant(trScramble); }   // shaped puzzles have no 3-D renderer
  else if (SIM[trPuzzle]) trainerSimEl.innerHTML = SIM[trPuzzle].svg();            // Square-1 / Clock: draw the scrambled state
  trScrambleEl.textContent = showMoves(trScramble);
  trAnswer.classList.remove('show'); trAnswer.innerHTML = '';
}
function trReveal() {
  if (!trCur) return;
  trAnswer.innerHTML = `<b>${trCur.name}</b><span class="mono">${trMoves(trCur).replace(/'/g,'′')}</span>`
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
    const date = new Date(s.t).toLocaleString([], { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
    const e=effMs(s), v5=avgN(trSolves,i,5), v12=avgN(trSolves,i,12);
    rows += `<tr data-i="${i}">
      <td class="num">${i+1}</td>
      <td class="single ${s.p==='dnf'?'dnf':''}${pbClass(X.single,e)}">${fmtSolve(s)}</td>
      <td class="${pbClass(X.a5,v5).trim()}">${fmtAvg(v5)}</td>
      <td class="${pbClass(X.a12,v12).trim()}">${fmtAvg(v12)}</td>
      <td class="date">${date}</td>
      <td class="acts">
        ${trCount ? '' : `<button data-act="p2" class="${s.p===2?'on':''}" title="Toggle +2">+2</button>`}
        <button data-act="dnf" class="${s.p==='dnf'?'on':''}" title="Toggle DNF">DNF</button>
        <button data-act="del" title="Delete solve">✕</button>
      </td></tr>`;
  }
  trHistEl.innerHTML = `<table class="times-table"><thead><tr><th>#</th><th>${trCount?'Moves':'Single'}</th><th>Ao5</th><th>Ao12</th><th>Date</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}
function reloadTimes() { trSolves = getSolves(statsKey()); renderStats(); renderHistory(); }
function tick() { trTimerEl.textContent = PREFS.hideTimer ? 'solving…' : fmt(performance.now()-trStart); trRAF = requestAnimationFrame(tick); }
let trInspStart=0, trInspRAF=0, trPenalty=0;
function startSolve() { trState='running'; trStart=performance.now(); trTimerEl.classList.remove('armed','inspecting'); tick(); }
function startInspection() { trState='inspecting'; trInspStart=performance.now(); trTimerEl.classList.remove('armed'); trTimerEl.classList.add('inspecting'); inspTick(); }
function inspTick() { const left = 15 - (performance.now()-trInspStart)/1000; trTimerEl.textContent = left<=0 ? '+'+(-left).toFixed(1) : left.toFixed(1); trInspRAF = requestAnimationFrame(inspTick); }
function endInspection() { const insp = (performance.now()-trInspStart)/1000; cancelAnimationFrame(trInspRAF); trPenalty = insp>17 ? 'dnf' : insp>15 ? 2000 : 0; startSolve(); }
function stopSolve() {
  cancelAnimationFrame(trRAF); trState='idle'; trTimerEl.classList.remove('armed');
  const rawMs = performance.now()-trStart;
  const p = trPenalty==='dnf' ? 'dnf' : trPenalty===2000 ? 2 : 0; trPenalty=0;
  addSolve(statsKey(), rawMs, p);
  trTimerEl.textContent = p==='dnf' ? 'DNF' : fmt(rawMs + (p===2?2000:0)) + (p===2 ? ' +2' : '');
  renderStats(); renderHistory(); newScramble();
}
/* FMC: record the typed move count (or a DNF) instead of a stopwatch time. */
const countInput = document.getElementById('countInput');
function recordCount(dnf) {
  let v = parseInt(countInput.value, 10);
  if (!dnf && (!Number.isFinite(v) || v < 1)) { countInput.focus(); return; }
  addSolve(statsKey(), dnf ? 0 : v, dnf ? 'dnf' : 0);
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
                 'oh':3, '3bld':3, 'mbld':3, 'fmc':3, '4bld':4, '5bld':5 };
const isRenderable = p => Object.prototype.hasOwnProperty.call(CUBE_N, p);
const isLLstep = () => trMode==='step' && (trKind==='oll' || trKind==='pll');
function configTcube() {
  const ok = isRenderable(trPuzzle);
  trView.classList.toggle('no-cube', !ok);
  trView.classList.toggle('has-sim', !!SIM[trPuzzle]);     // SVG sim instead of the 3-D cube
  if (ok) tcube.rebuild({ N: CUBE_N[trPuzzle], flip: isLLstep() });
  // Cube-interaction options for THIS puzzle
  const P=['physical','Physical — Space timer'], M=['mouse','Virtual — mouse'], K=['keyboard','Virtual — keyboard'];
  let opts = ok ? (CUBE_N[trPuzzle]===3 ? [P,M,K] : [P,M])   // 3×3 cubes: keyboard too; big cubes: mouse only
              : SIM_KEYS[trPuzzle] ? [P, ['virtual','Virtual — mouse & keyboard']]   // 3-D sim (Pyraminx)
              : trPuzzle==='clock' ? [P, ['virtual','Virtual — click & drag']]   // interactive clock
              : null;                                         // display-only sim (Square-1/Megaminx)
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
  updateTrHint();
}
function setActive(sel, btn) { document.querySelectorAll('#view-trainer '+sel).forEach(x=>x.classList.toggle('on', x===btn)); }

trDiagram.addEventListener('click', () => { if (!trCur) return; cycleLearn(trSetId, trCur.name); updateStatusPill(); });
document.getElementById('trReveal').onclick = trReveal;
document.getElementById('trNext').onclick = trSkip;
document.getElementById('trPlay').onclick = trPlayAnswer;
document.getElementById('trReset').onclick = () => { clearSolves(statsKey()); trSolves = getSolves(statsKey()); renderStats(); renderHistory(); };
trHistEl.addEventListener('click', e => {                  // inline edit: +2 / DNF / delete
  const btn = e.target.closest('button[data-act]'); if (!btn) return;
  const i = +btn.closest('tr').dataset.i, s = trSolves[i]; if (!s) return;
  if (btn.dataset.act==='p2') s.p = (s.p===2 ? 0 : 2);
  else if (btn.dataset.act==='dnf') s.p = (s.p==='dnf' ? 0 : 'dnf');
  else if (btn.dataset.act==='del') trSolves.splice(i, 1);
  Profiles.save(); if (window.cloudSyncSet) cloudSyncSet(statsKey()); renderStats(); renderHistory();
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
trTimerEl.addEventListener('pointerdown', e => { if (timerPressStart()) e.preventDefault(); });
trTimerEl.addEventListener('pointerup',   e => { e.preventDefault(); timerPressEnd(); });
trTimerEl.addEventListener('pointercancel', () => { trArmed = false; trTimerEl.classList.remove('armed'); });

function renderTrainer(path) {
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
};
function cubeArt(p) {
  return `<span class="cubing-icon event-${EVENT[p.id] || '333'} art-icon"></span>`;
}
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
  [...PUZZLES].sort((a,b) => wcaRank(a.id) - wcaRank(b.id)).forEach(p => {
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
let cur = { p:null, m:null, i:null }, homeMode=true, statsMode=false, openPuzzle=null;
const getP = id => PUZZLES.find(p=>p.id===id);
const shortName = n => n.split('(')[0].trim();
const pathOf = (p,m,i) => `${p}/${m}/${i}`;
const isReady = (p,m,i) => pathOf(p,m,i)==='3x3/fund/notation' || !!LESSONS[pathOf(p,m,i)];

/* Top-level categories that group the 17 events. */
const CATEGORIES = [
  { id:'nxn',    name:'Cubes',         puzzles:['2x2','3x3','4x4','5x5','6x6','7x7'] },
  { id:'var',    name:'Challenges',    puzzles:['oh','3bld','fmc','mbld','4bld','5bld'] },
  { id:'shaped', name:'Other Puzzles', puzzles:['pyra','mega','skewb','sq1','clock'] },
];
const catOf = pid => CATEGORIES.find(c => c.puzzles.includes(pid));

const homeTab = document.createElement('button');
homeTab.className='puzzle-tab home-tab'; homeTab.textContent='⌂ Home';
homeTab.onclick = goHome; megabar.appendChild(homeTab);
CATEGORIES.forEach(cat => {
  const tab=document.createElement('button'); tab.className='puzzle-tab'; tab.dataset.cat=cat.id;
  tab.innerHTML = cat.name+'<span class="caret">▾</span>';
  tab.addEventListener('click', () => openPuzzle===cat.id ? closePanel() : openCategory(cat.id));
  tab.addEventListener('mouseenter', () => { if (openPuzzle) openCategory(cat.id); });
  megabar.appendChild(tab);
});
const playTab = document.createElement('button');
playTab.className='puzzle-tab'; playTab.dataset.cat='play'; playTab.textContent='🧩 Virtual Cube';
playTab.addEventListener('click', openPlay); megabar.appendChild(playTab);

const statsTab = document.createElement('button');
statsTab.className='puzzle-tab'; statsTab.dataset.cat='stats'; statsTab.textContent='📊 Statistics';
statsTab.addEventListener('click', openStats); megabar.appendChild(statsTab);

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
  cat.puzzles.forEach(pid => {
    const p = getP(pid);
    const b = document.createElement('button'); b.className='cat-pz'+(pid===activePz?' active':''); b.dataset.pz=pid;
    b.innerHTML = `<span class="cubing-icon event-${EVENT[pid]||'333'}"></span><span>${shortName(p.name)}</span>`;
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
const show = id => VIEWS.forEach(v => document.getElementById(v).classList.toggle('hidden', v!==id));

function goHome() { homeMode=true; statsMode=false; closePanel(); document.querySelectorAll('.puzzle-tab.selected').forEach(t=>t.classList.remove('selected')); crumb.innerHTML='<b>Home</b>'; renderHome(); show('view-home'); }
function select(pId,mId,iId) { homeMode=false; statsMode=false; cur={p:pId,m:mId,i:iId}; render(); closePanel(); }

function render() {
  if (statsMode) { renderStatsView(); return; }   // keep Statistics live across profile switches (explicit nav clears statsMode)
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
let playN = 3, playHist = [], playEntry = null;

/* Every interactable virtual puzzle auto-appears here. Add an entry → it shows in the dropdown. */
const PLAY_PUZZLES = [
  { id:'2x2', name:'2×2', kind:'cube', n:2 }, { id:'3x3', name:'3×3', kind:'cube', n:3 },
  { id:'4x4', name:'4×4', kind:'cube', n:4 }, { id:'5x5', name:'5×5', kind:'cube', n:5 },
  { id:'6x6', name:'6×6', kind:'cube', n:6 }, { id:'7x7', name:'7×7', kind:'cube', n:7 },
  { id:'pyra', name:'Pyraminx', kind:'sim', sim:pyraSim, keys:{ u:'U', l:'L', r:'R', b:'B' } },
  { id:'skewb', name:'Skewb', kind:'sim', sim:skewbSim, keys:{ u:'U', l:'L', r:'R', b:'B' } },
  { id:'mega', name:'Megaminx', kind:'sim', sim:megaSim, keys:{ u:'U', l:'L', r:'R', b:'B' } },
  { id:'sq1', name:'Square-1', kind:'sim', sim:sqSim },     // interactive via drag (sqSim.turnLayer / slash)
  { id:'clock', name:'Clock', kind:'sim', sim:clockSim },   // interactive via clicks/drags (clockSim.turn)
];

const playControls = makeCubeControls(playCube, document.getElementById('playCube'), playScene, {
  isActive: () => !playView.classList.contains('hidden') && playEntry && playEntry.kind==='cube' && playN===3,
  onTurn: m => { if (m) playHist.push(m); updateStatus(); },
  onReset: () => { playCube.reset(); playHist=[]; playScrText.textContent=''; updateStatus(); },
});
const renderSim = () => { playSimEl.innerHTML = playEntry.sim.svg3d ? playEntry.sim.svg3d() : playEntry.sim.svg(); };
function updateStatus() {
  if (!playEntry) return;
  const solved = playEntry.kind==='cube' ? cubeSolvedByColor(playCube) : playEntry.sim.isSolved();
  playStatus.classList.toggle('solved', solved);
  playStatus.textContent = solved ? 'Solved ✔'
    : (playEntry.kind==='cube' && playHist.length) ? playHist.length + ' move' + (playHist.length===1?'':'s') : 'Scrambled';
}
function playSelect(entry) {
  playEntry = entry; playHist = []; playScrText.textContent = ''; busy = false;
  const isSim = entry.kind==='sim';
  playView.classList.toggle('sim-mode', isSim);
  document.getElementById('playUndo').style.display = isSim ? 'none' : '';
  document.getElementById('playHint').innerHTML =
      !isSim   ? 'Drag a <b>sticker</b> to turn that layer; drag the <b>background</b> to rotate (double-click to recentre). Or the <b>keyboard</b> (3×3, camera-relative): R L U D F B · slices M E S · rotations x y z (Shift = prime, Ctrl = double).'
    : entry.id==='pyra'  ? 'Drag a <b>sticker</b> to turn its corner, or <b>keyboard</b> U L R B (the face in that screen spot) — <b>Shift</b> = prime, <b>Ctrl</b> = tip. Drag the <b>background</b> to rotate (double-click to recentre). <b>Del</b> resets.'
    : entry.id==='skewb' ? 'Drag a <b>corner sticker</b> to twist that corner, or <b>keyboard</b> U L R B (the corner in that screen spot, Shift = reverse). Drag the <b>background</b> to rotate (double-click to recentre). <b>Del</b> resets.'
    : entry.id==='mega'  ? 'Drag any <b>sticker</b> to turn its face, or <b>keyboard</b> U L R B (the face in that screen spot, Shift = reverse). Drag the <b>background</b> to rotate (double-click to recentre). <b>Del</b> resets.'
    : entry.id==='sq1'   ? 'Drag the <b>top</b> or <b>bottom</b> layer to rotate it (snaps to 30°); <b>click the middle band</b> (or press <b>/</b>) to slash. Drag the <b>background</b> to rotate the view. <b>Del</b> resets.'
    :                      'Click a <b>pin</b> to raise/lower it (on either face), then <b>drag a corner clock</b> to turn it and the pinned clocks. <b>Del</b> resets.';
  if (isSim) { playControls.setInteract({}); entry.sim.reset(); renderSim(); }
  else { playN = entry.n; playCube.rebuild({ N:playN }); playControls.setInteract({ drag:true, keys:true }); }
  updateStatus();
}
function playScramble() {
  if (busy) return;
  if (playEntry.kind==='cube') { const seq=fullScramble(playN); playCube.reset(); playCube.applyInstant(seq); playHist=[]; playScrText.textContent=showMoves(seq); }
  else { const seq=playEntry.sim.scramble(); renderSim(); playScrText.textContent=showMoves(seq); }
  playStatus.textContent='Scrambled'; playStatus.classList.remove('solved');
}
async function playUndo() {
  if (busy || playEntry.kind!=='cube' || !playHist.length) return;
  const m = playHist.pop(); busy = true;
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
  if (playEntry.kind==='cube') playCube.reset(); else { playEntry.sim.reset(); renderSim(); }
  playHist=[]; playScrText.textContent=''; updateStatus(); };
document.getElementById('playRecenter').onclick = () => {
  if (playEntry.kind==='cube') playControls.recenter();
  else if (playEntry.sim.recenter) { playEntry.sim.recenter(); renderSim(); }
};
/* keyboard for SIM puzzles in the playground (Pyraminx: camera-relative faces + Alt = tips) */
document.addEventListener('keydown', e => {
  if (playView.classList.contains('hidden') || !playEntry || playEntry.kind!=='sim') return;
  if (e.metaKey) return;
  const sim = playEntry.sim;
  if (e.key==='Delete') { e.preventDefault(); sim.reset(); playHist=[]; playScrText.textContent=''; renderSim(); updateStatus(); return; }
  if (playEntry.id==='sq1') { if (e.key==='/') { e.preventDefault(); sim.snapSlash(()=>renderSim(), ()=>updateStatus()); } return; }   // Square-1: / = slash (animated)
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
    else if (slashEl) st={ kind:'slash' };
    else              st={ kind:'orbit', sx:e.clientX, sy:e.clientY };
    try{ playSimEl.setPointerCapture(e.pointerId); }catch(_){}
  });
  playSimEl.addEventListener('pointermove', e => {
    if (!st || !playEntry || playEntry.id!=='sq1') return; const sim=playEntry.sim;
    if (st.kind==='orbit') { sim.rotateView(e.clientX-st.sx, e.clientY-st.sy); st.sx=e.clientX; st.sy=e.clientY; renderSim(); updateStatus(); }
    else if (st.kind==='layer') { st.deg=-(e.clientX-st.sx0)*1.2; sim.setSpin(st.layer, st.deg); renderSim(); }   // ~25px = 30°, sign follows the mouse
  });
  const end=()=>{ if (!st) return; const sim=playEntry&&playEntry.sim;
    if (sim && st.kind==='slash') { sim.snapSlash(() => renderSim(), () => updateStatus()); }
    else if (sim && st.kind==='layer') { sim.snapTurn(st.layer, st.deg, () => renderSim(), () => updateStatus()); }
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
    drag.acc += dd; drag.last = a;
    const hours = Math.round(drag.acc / (Math.PI/6));
    if (hours !== drag.applied) { drag.sim.turn(drag.side, drag.key, hours-drag.applied); drag.applied=hours; renderSim(); updateStatus(); }
  });
  const end=()=>{ drag=null; }; playSimEl.addEventListener('pointerup', end); playSimEl.addEventListener('pointercancel', end);
})();
playSelect(PLAY_PUZZLES.find(p => p.id==='3x3'));   // initialise

function openPlay() {
  homeMode=false; statsMode=false; closePanel();
  document.querySelectorAll('.puzzle-tab.selected').forEach(t=>t.classList.remove('selected'));
  document.querySelector('.puzzle-tab[data-cat="play"]').classList.add('selected');
  crumb.innerHTML = '<b>Virtual Cube</b>';
  updateStatus(); show('view-play');
}
function openStats() {
  homeMode=false; statsMode=true; closePanel();
  document.querySelectorAll('.puzzle-tab.selected').forEach(t=>t.classList.remove('selected'));
  document.querySelector('.puzzle-tab[data-cat="stats"]').classList.add('selected');
  crumb.innerHTML = '<b>Statistics</b>';
  renderStatsView(); show('view-stats');
}

/* ================================================================
   STATISTICS VIEW — historical analysis of every solve on the current
   profile, across all events. Reads the same per-profile store the
   trainer writes to (Profiles → times[setId]); re-rendered on profile
   switch via render(). Excludes deleted solves (deletion removes them).
   ================================================================ */
const statsView = document.getElementById('view-stats');
document.getElementById('statsGroupBy').addEventListener('change', e => { statsGroupBy = e.target.value; renderStatsView(); });
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
function renderStatsView() {
  const sets = statsAllSets();
  const summaryEl=document.getElementById('statsSummary'), eventsEl=document.getElementById('statsEvents'),
        chartEl=document.getElementById('statsChart'), weeksEl=document.getElementById('statsWeeks'),
        trendTtl=document.getElementById('statsTrendTitle'), histEl=document.getElementById('statsHistory');
  if (!sets.length) {
    summaryEl.innerHTML='<div class="stats-empty">No solves recorded yet on this profile. Use any Timer or Trainer to start building history.</div>';
    eventsEl.innerHTML=''; chartEl.innerHTML=''; weeksEl.innerHTML=''; histEl.innerHTML=''; return;
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
    return { n, best, ao5, ao12, trend, tcls, label:statsLabel(e.id) };
  }).sort((a,b)=>b.n-a.n);
  let evHtml='';
  rows.forEach(r => { evHtml+=`<tr><td class="ev">${r.label}</td><td>${r.n}</td><td>${r.best==null?'—':fmt(r.best)}</td>`
    +`<td class="${r.ao5==='dnf'?'dnf':''}">${fmtAvg(r.ao5)}</td><td class="${r.ao12==='dnf'?'dnf':''}">${fmtAvg(r.ao12)}</td>`
    +`<td class="stats-trend ${r.tcls}">${r.trend}</td></tr>`; });
  eventsEl.innerHTML=`<table class="stats-table"><thead><tr><th>Event / Mode</th><th>Solves</th><th>Best</th><th>Ao5</th><th>Ao12</th><th>Trend</th></tr></thead><tbody>${evHtml}</tbody></table>`;
  const top = sets.slice().sort((a,b)=>b.solves.length-a.solves.length)[0];
  const g = statsGroupBy, weeks = statsBuckets(top.solves, g);
  const GL = { solve:'by solve', hour:'by hour', day:'by day', week:'by week', month:'by month' }[g];
  trendTtl.textContent='Improvement over time — '+statsLabel(top.id)+' ('+GL+')';
  chartEl.innerHTML=statsChartSVG(weeks, g); weeksEl.innerHTML = g==='solve' ? '' : statsBucketTable(weeks, g);
  const flat=[]; sets.forEach(e => { const lbl=statsLabel(e.id); e.solves.forEach(s=>flat.push({s,lbl})); });
  flat.sort((a,b)=>b.s.t-a.s.t);
  let hrows='';
  flat.forEach((r,i) => { const s=r.s; const date=new Date(s.t).toLocaleString([],{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    hrows+=`<tr><td class="muted">${i+1}</td><td class="ev">${r.lbl}</td><td class="${s.p==='dnf'?'dnf':''}">${fmtSolve(s)}</td><td class="muted" style="font-family:inherit">${date}</td></tr>`; });
  histEl.innerHTML=`<table class="stats-table"><thead><tr><th>#</th><th>Event</th><th>Time</th><th>Date</th></tr></thead><tbody>${hrows}</tbody></table>`;
}

/* ===== START ===== */
goHome();
