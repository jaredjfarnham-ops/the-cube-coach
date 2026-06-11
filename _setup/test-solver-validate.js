/* Verify the solver's pre-solve validation catches illegal states (so solve() never
   runs on an unsolvable cube and hangs). Mirrors the checks added to js/solver.js. */
const fs = require('fs'), vm = require('vm');
// cubejs.js is cube.js+solve.js concatenated and only wires up when `module` is undefined
// (browser path); load it in a sandbox without `module` so this.Cube gets set.
const sandbox = { console }; vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname + '/../js/vendor/cubejs.js', 'utf8'), sandbox, { filename: 'cubejs.js' });
const Cube = sandbox.Cube;
const SOLVED = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

function solvableReason(cube) {
  const { cp, co, ep, eo } = cube;
  const isPerm = (a, n) => { const seen = new Array(n).fill(false);
    for (const v of a) { if (v == null || v < 0 || v >= n || seen[v]) return false; seen[v] = true; } return seen.every(Boolean); };
  if (!isPerm(cp, 8) || !isPerm(ep, 12)) return 'pieces';
  if (co.reduce((a, b) => a + b, 0) % 3 !== 0) return 'twist';
  if (eo.reduce((a, b) => a + b, 0) % 2 !== 0) return 'flip';
  const par = p => { let n = 0; for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (p[i] > p[j]) n++; return n & 1; };
  if (par(cp) !== par(ep)) return 'swap';
  return null;
}
// full validation as solver.js will do it: counts -> faithful facelets -> solvable
function validate(str) {
  const counts = {}; for (const c of str) counts[c] = (counts[c] || 0) + 1;
  for (const f of ['U','R','F','D','L','B']) if (counts[f] !== 9) return 'count';
  const cube = Cube.fromString(str);
  if (cube.asString() !== str) return 'stickers';   // a piece's colours can't exist (e.g. swapped pair)
  return solvableReason(cube);                       // null = solvable
}

const tests = [];
// 1. solved
tests.push(['solved', SOLVED, null]);
// 2. a real scramble (valid, solvable)
const scrambled = Cube.fromString(SOLVED); scrambled.move("R U R' U' F2 L D B2");
tests.push(['scrambled', scrambled.asString(), null]);
// 3. swapped pair on the URF corner (R-face & F-face stickers) — counts stay 9, but illegal
const sw = SOLVED.split(''); [sw[9], sw[20]] = [sw[20], sw[9]];   // URF: R0 <-> F2
tests.push(['swapped-sticker URF', sw.join(''), 'caught']);
// 4. wrong count (sanity)
const wc = SOLVED.split(''); wc[0] = 'R';
tests.push(['wrong count', wc.join(''), 'count']);

let pass = 0;
for (const [name, str, expect] of tests) {
  const r = validate(str);
  const got = r === null ? null : (['count'].includes(r) ? r : 'caught');
  const ok = (expect === null && r === null) || (expect === 'caught' && r && r !== 'count') || (expect === r);
  console.log((ok ? 'PASS' : 'FAIL').padEnd(5), name.padEnd(20), 'reason=' + (r || 'solvable'));
  if (ok) pass++;
}
// confirm valid states actually solve quickly, and we never call solve() on the bad one
Cube.initSolver();
const t0 = Date.now();
const sol = Cube.fromString(tests[1][1]).solve();
console.log('\nscramble solves in', Date.now() - t0, 'ms ->', sol.split(/\s+/).length, 'moves; valid=', Cube.fromString(tests[1][1]).move(sol).asString() === SOLVED);
console.log(pass + '/' + tests.length + ' validation tests pass');
