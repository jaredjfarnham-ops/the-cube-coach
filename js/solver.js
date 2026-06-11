/* ================================================================
   SOLVER (the easter-egg). Two ways in:
     • Reverse a scramble — paste a scramble, get its inverse.
     • Color-pick the cube — paint the 6 faces, get a real solution
       (Herbert Kociemba two-phase, via the vendored cubejs `Cube`).
   Loads after app.js + js/vendor/cubejs.js. Self-contained; degrades
   quietly if its DOM or the solver lib is absent.
   ================================================================ */
(function () {
  const $ = id => document.getElementById(id);
  const modal = $('solverModal'); if (!modal) return;
  const pretty = s => s.replace(/'/g, '′');

  /* ---- open / close / tabs ---- */
  const open  = () => { modal.classList.remove('hidden'); };
  const close = () => { modal.classList.add('hidden'); };
  const btn = $('solverBtn'); if (btn) btn.onclick = open;
  const x = $('solverClose'); if (x) x.onclick = close;
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelectorAll('.solver-tab').forEach(t => t.onclick = () => {
    modal.querySelectorAll('.solver-tab').forEach(o => o.classList.toggle('active', o === t));
    $('solverReverse').classList.toggle('hidden', t.dataset.mode !== 'reverse');
    $('solverPaint').classList.toggle('hidden', t.dataset.mode !== 'paint');
  });

  /* ---- mode 1: reverse a scramble ---- */
  const revBtn = $('solverReverseBtn'), revOut = $('solverReverseOut'), revIn = $('solverScramble');
  if (revBtn) revBtn.onclick = () => {
    const raw = (revIn.value || '').trim().replace(/[′’]/g, "'");
    if (!raw) { revOut.innerHTML = ''; return; }
    let sol;
    try { sol = invertSeq(raw).join(' '); } catch (e) { revOut.innerHTML = `<span class="err">Couldn't read that scramble.</span>`; return; }
    revOut.innerHTML = `<div class="solver-sol-label">Do this to undo it:</div><div class="solver-sol">${pretty(sol)}</div>
      <div class="solver-foot">(It's literally your scramble, backwards.)</div>`;
  };

  /* ---- mode 2: color-pick the cube ---- */
  // facelet order cubejs expects: U R F D L B, each face read left→right, top→bottom from outside.
  const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
  const SOLVED = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
  let state = SOLVED.split('');                 // 54 letters
  let paintColor = 'U';

  // Displayed colour per face. The SOLVER is unaffected — it works on face letters / the relative
  // arrangement, and white-up/green-front is the reference for every scheme — so changing this only
  // changes what the user sees, letting them match their physical cube.
  const SCHEMES = {
    western:  { U:'#f7f7f7', R:'#d4202a', F:'#00a651', D:'#ffd500', L:'#ff7416', B:'#0050d8' },
    japanese: { U:'#f7f7f7', R:'#d4202a', F:'#00a651', D:'#0050d8', L:'#ff7416', B:'#ffd500' },  // blue↔yellow vs Western
  };
  let scheme = { ...SCHEMES.western };   // mutable: a preset, or per-centre custom colours

  const palette = $('solverPalette'), net = $('solverNet'), paintOut = $('solverPaintOut');
  // net layout: a 4-col × 3-row grid of faces; only U / L F R B / D are filled.
  const NETSLOTS = [ null,'U',null,null,  'L','F','R','B',  null,'D',null,null ];
  const faceStart = f => FACES.indexOf(f) * 9;

  function buildPalette() {
    palette.innerHTML = FACES.map(f =>
      `<button class="solver-sw${f === paintColor ? ' sel' : ''}" data-f="${f}" title="${f} face" style="background:${scheme[f]}"></button>`).join('');
    palette.querySelectorAll('.solver-sw').forEach(b => b.onclick = () => {
      paintColor = b.dataset.f; palette.querySelectorAll('.solver-sw').forEach(o => o.classList.toggle('sel', o === b));
    });
  }
  function buildNet() {
    net.innerHTML = '';
    NETSLOTS.forEach(f => {
      const cell = document.createElement('div');
      if (!f) { cell.className = 'solver-face blank'; net.appendChild(cell); return; }
      cell.className = 'solver-face';
      for (let i = 0; i < 9; i++) {
        const s = document.createElement('button'); const idx = faceStart(f) + i;
        s.className = 'solver-st'; s.style.background = scheme[state[idx]];
        if (i === 4) {           // centre: defines the face's colour — click to recolour it to match your cube
          s.classList.add('center'); s.title = f + ' centre — click to set this colour';
          s.onclick = () => { if (typeof openColorPicker === 'function') openColorPicker(s, scheme[f], hex => { scheme[f] = hex; buildPalette(); buildNet(); }); };
        } else s.onclick = () => { state[idx] = paintColor; s.style.background = scheme[paintColor]; };
        cell.appendChild(s);
      }
      net.appendChild(cell);
    });
  }
  function repaintNet() { buildNet(); }

  if ($('solverPaintReset')) $('solverPaintReset').onclick = () => { state = SOLVED.split(''); repaintNet(); paintOut.innerHTML = ''; };
  if ($('solverPaintClear')) $('solverPaintClear').onclick = () => {
    // clear to centres only (each face shows just its centre colour, rest blanked to that centre)
    state = SOLVED.split('').map((c, i) => c); // keep solved as a sane base; "clear" = reset is friendlier
    state = FACES.flatMap(f => Array(9).fill(f)); repaintNet(); paintOut.innerHTML = '';
  };

  let solverReady = false;
  // Why a state can't be solved (null = solvable). Reads cubejs's piece arrays — cubejs itself
  // does NOT validate, and handing it an impossible state sends solve() into an endless search.
  function solvableReason(cube) {
    const { cp, co, ep, eo } = cube;
    const isPerm = (a, n) => { const seen = new Array(n).fill(false);
      for (const v of a) { if (v == null || v < 0 || v >= n || seen[v]) return false; seen[v] = true; } return seen.every(Boolean); };
    if (!isPerm(cp, 8) || !isPerm(ep, 12)) return 'a piece is duplicated or missing.';
    if (co.reduce((a, b) => a + b, 0) % 3 !== 0) return 'a corner is twisted — that can’t happen on a real cube.';
    if (eo.reduce((a, b) => a + b, 0) % 2 !== 0) return 'an edge is flipped — that can’t happen on a real cube.';
    const par = p => { let n = 0; for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (p[i] > p[j]) n++; return n & 1; };
    if (par(cp) !== par(ep)) return 'two pieces are swapped — that can’t happen on a real cube.';
    return null;
  }
  if ($('solverPaintBtn')) $('solverPaintBtn').onclick = async () => {
    const str = state.join('');
    // 1. each colour exactly 9 times
    const counts = {}; for (const c of str) counts[c] = (counts[c] || 0) + 1;
    const bad = FACES.find(f => counts[f] !== 9);
    if (bad) { paintOut.innerHTML = `<span class="err">Each colour must appear 9 times — ${bad} appears ${counts[bad] || 0}.</span>`; return; }
    if (typeof Cube === 'undefined') { paintOut.innerHTML = `<span class="err">Solver engine didn't load.</span>`; return; }
    // 2. validate BEFORE solving (else an impossible state makes solve() search forever):
    //    (a) the stickers must form real pieces — re-encoding the decoded cube must reproduce them
    //        (catches swapped stickers / impossible colour combos cubejs silently drops), and
    //    (b) the piece arrangement must be reachable (twist / flip / swap parity).
    const cube = Cube.fromString(str);
    if (cube.asString() !== str) { paintOut.innerHTML = `<span class="err">Those stickers don't form a real cube — a corner or edge has colours that can't exist (e.g. two stickers swapped). Check your colouring.</span>`; return; }
    const reason = solvableReason(cube);
    if (reason) { paintOut.innerHTML = `<span class="err">That cube can't be solved — ${reason}</span>`; return; }
    paintOut.innerHTML = `<span class="muted">Solving…</span>`;
    await new Promise(r => setTimeout(r, 20));                 // let the message paint
    try {
      if (!solverReady) { Cube.initSolver(); solverReady = true; }   // ~0.6s, once
      const sol = Cube.fromString(str).solve();
      const ok = sol != null && Cube.fromString(str).move(sol).asString() === SOLVED;   // belt-and-suspenders
      if (!ok) { paintOut.innerHTML = `<span class="err">That cube state isn't solvable — check for a flipped edge or twisted corner.</span>`; return; }
      paintOut.innerHTML = sol.trim()
        ? `<div class="solver-sol-label">Solution (${sol.trim().split(/\s+/).length} moves):</div><div class="solver-sol">${pretty(sol)}</div>`
        : `<div class="solver-sol-label">It's already solved.</div>`;
    } catch (e) { paintOut.innerHTML = `<span class="err">Couldn't solve that — is the colouring valid?</span>`; }
  };

  function setScheme(name) { scheme = { ...SCHEMES[name] }; buildPalette(); buildNet(); }
  if ($('solverSchemeW')) $('solverSchemeW').onclick = () => setScheme('western');
  if ($('solverSchemeJ')) $('solverSchemeJ').onclick = () => setScheme('japanese');

  buildPalette(); buildNet();
})();
