/* Generate the FP (Face-Permuting) Pyraminx step-2 set by exhaustive engine search — every alg
   correct by construction, no untrusted source. FP step 2: one face already solid (tips ignored),
   permute everything. Full BFS from solved over the 8 face turns (tips never move); every reachable
   state whose held face (face 3) is solid but the puzzle is unsolved is an FP case, solved by the
   reverse of its BFS path. Cases deduped up to the grip symmetry y (120° about the held face). */

// move permutations, applyPerm form (new[i] = old[p[i]]) — copied from js/puzzles.js makePyraminx
const P = {
  U:[9,10,11,3,4,5,15,7,8,18,19,20,12,13,14,24,16,17,0,1,2,21,22,23,6,25,26,27,28,29,30,31,32,33,34,35],
  L:[0,29,2,27,28,5,6,33,8,9,10,4,12,1,3,15,16,7,18,19,20,21,22,23,24,25,26,14,11,13,30,31,32,17,34,35],
  R:[0,1,22,3,19,21,6,7,25,9,10,11,12,13,14,15,16,17,18,31,20,32,29,23,24,35,26,27,28,2,30,4,5,33,34,8],
  B:[0,1,2,3,4,5,6,7,8,9,28,11,30,31,14,15,34,17,18,19,13,21,10,12,24,25,16,27,22,29,23,20,32,33,26,35],
  Y:[9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,0,1,2,3,4,5,6,7,8,30,31,28,32,29,27,34,35,33],
  M:[0,2,1,5,4,3,6,8,7,18,20,19,23,22,21,24,26,25,9,11,10,14,13,12,15,17,16,32,31,29,30,28,27,35,34,33],
};
const apply = (st, p) => p.map(s => st[s]);
const twice = (st, p) => apply(apply(st, p), p);
const MOVES = {                                   // each as a function state->state
  U: s => apply(s, P.U), "U'": s => twice(s, P.U),
  L: s => apply(s, P.L), "L'": s => twice(s, P.L),
  R: s => apply(s, P.R), "R'": s => twice(s, P.R),
  B: s => apply(s, P.B), "B'": s => twice(s, P.B),
};
const INV = { U:"U'", "U'":'U', L:"L'", "L'":'L', R:"R'", "R'":'R', B:"B'", "B'":'B' };
const Y  = s => apply(s, P.Y), Y2 = s => twice(s, P.Y);

const SOLVED = []; for (let f=0;f<4;f++) for (let i=0;i<9;i++) SOLVED.push(f);
const key = st => st.join('');
const SK = key(SOLVED);
const faceSolid = (st, f) => { const c = st[f*9]; for (let i=1;i<9;i++) if (st[f*9+i] !== c) return false; return true; };

// --- full BFS from solved; store, per state, the move that produced it (for path reconstruction) ---
const dist = new Map([[SK, null]]);              // key -> producing move (null for solved)
let frontier = [SOLVED];
const order = ['U',"U'",'L',"L'",'R',"R'",'B',"B'"];
while (frontier.length) {
  const next = [];
  for (const st of frontier) {
    for (const m of order) { const ns = MOVES[m](st), nk = key(ns); if (!dist.has(nk)) { dist.set(nk, m); next.push(ns); } }
  }
  frontier = next;
}
console.error('reachable states:', dist.size);

// solving alg for a state: walk back to solved, undoing each producing move
function solveAlg(st) { let cur = st, out = []; while (key(cur) !== SK) { const m = dist.get(key(cur)); out.push(INV[m]); cur = MOVES[INV[m]](cur); } return out; }

// --- enumerate FP cases: face 3 solid + unsolved, grouped up to the grip symmetry Yc
//     (rotation WITH recolour, so it maps cases→equivalent cases) and the top-corner AUF (U turns) ---
const cmap = [2,0,1,3];                            // colour relabel that makes Y(solved)==solved
const cmapM = [0,2,1,3];                           // colour relabel that makes M(solved)==solved
const Yc  = s => apply(s, P.Y).map(c => cmap[c]);  // proper grip symmetry (rotation)
const Yc2 = s => Yc(Yc(s));
const Mc  = s => apply(s, P.M).map(c => cmapM[c]); // mirror symmetry
const gens = [ s => MOVES.U(s), s => MOVES["U'"](s), Yc, Yc2, Mc ];
// bottom-edge side colours [face0 LR, face1 LB, face2 BR] → bottom permutation type
const bottomType = st => { const s = [st[4], st[13], st[22]].join('');
  if (s === '012') return 'Solved bottom';
  if (s === '120' || s === '201') return '3-cycle bottom';
  return 'Adjacent swap bottom'; };
const fss = [];
for (const k of dist.keys()) { if (k === SK) continue; const st = k.split('').map(Number); if (faceSolid(st, 3)) fss.push(k); }
console.error('raw face-3-solid states:', fss.length);
const seen = new Set(), cases = [];
for (const start of fss) {
  if (seen.has(start)) continue;
  const orbit = new Set([start]), q = [start];
  while (q.length) { const cs = q.pop().split('').map(Number);
    for (const g of gens) { const nk = key(g(cs)); if (!orbit.has(nk)) { orbit.add(nk); q.push(nk); } } }
  orbit.forEach(k => seen.add(k));
  let best = null;
  orbit.forEach(k => { if (!dist.has(k)) return; const st = k.split('').map(Number); const a = solveAlg(st);
    if (!best || a.length < best.len) best = { alg: a.join(' '), len: a.length, bottom: bottomType(st) }; });
  if (best && best.len > 0) cases.push(best);     // drop the trivial AUF-only "case"
}
cases.sort((a,b)=> a.bottom.localeCompare(b.bottom) || a.len - b.len);
console.error('FP cases (grip symmetry + mirror + U-AUF):', cases.length);
const byBottom = {};
cases.forEach(c => (byBottom[c.bottom] = byBottom[c.bottom] || []).push(c));
for (const b in byBottom) { console.log('\n# ' + b + ' (' + byBottom[b].length + ')');
  byBottom[b].forEach((c,i) => console.log(`  ${i+1}\t${c.len}\t${c.alg}`)); }
