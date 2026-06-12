/* Check the extracted FP (Face-Permuting) Pyraminx algorithms against the engine:
   which tokens the engine can't parse, and whether each alg's inverse leaves exactly
   one face made (the FP step-2 precondition) and then solves. */
const fs = require('fs'), vm = require('vm');
const sandbox = { Math, console, document: {} };
vm.createContext(sandbox);
vm.runInContext(['data/notation.js', 'js/engine.js', 'js/puzzles.js']
  .map(f => fs.readFileSync(__dirname + '/../' + f, 'utf8')).join('\n'), sandbox, { filename: 'b.js' });
const { makePyraminx } = sandbox;
const invertSeq = alg => alg.split(/\s+/).filter(Boolean).reverse().map(t => t.endsWith("'") ? t.slice(0,-1) : t+"'").join(' ');

const ALGS = {
  '1 Two Flip':            "R U' R' U R' L R L'",
  '2 3-Clockwise':         "R U' R' U' R U' R'",
  '3 3-AntiClock':         "L' U L U L' U L",
  '4 Strange-Right':       "L U R U' R' L'",
  '5 Strange-Left':        "R' L R L' U' L' U L",
  '6 Swap Headlights':     "y' L R L R' y' L R L'",
  '7 Swap no Headlights':  "L' U R' U R L",
  '8 Headlights-R':        "R B L' U L U B' R'",
  '9 Headlights-L':        "R B U' L' U' L B' R'",
  '10 Solved Top':         "R L' R' L' y' L' R' L",
  '11 Two Flip':           "Rw' U' Rw* U R' B U R",
  '12 3-Clockwise':        "L R L' R y R U' L R'",
  '13 Checkerboard':       "Rw R l* R' U R l* U L' U",
  '14 Strange-Right':      "L B R U' B' R L' R",
  '15 Strange-Left':       "Rw R U' L R' U B L",
  '16 Solved Top':         "R L U L U' L R'",
  '17 Two Flip':           "L R L' U' y R L' U' R'",
  '18 Checkerboard':       "R L' y R U' R' l* L U L",
  '19 3-AntiClock':        "R L' U R' y' R' L R' L'",
  '20 Strange-Right':      "L' R' B L' R y' L' U' R'",
  '21 Strange-Left':       "Rw R' U R L l* U' R' U L",
};

const sim = makePyraminx();
const known = t => { const V = t.replace(/['2]/g, '').toUpperCase(); return /^[ULRBY]$/.test(V); };
const facesMade = () => { const st = sim.state(); let n = 0;
  for (let f = 0; f < 4; f++) { const c = st[f*9]; let u = true; for (let i = 1; i < 9; i++) if (st[f*9+i] !== c) { u = false; break; } if (u) n++; } return n; };

let ok = 0;
for (const name in ALGS) {
  const alg = ALGS[name], toks = alg.split(/\s+/);
  const bad = toks.filter(t => !known(t));
  if (bad.length) { console.log('SKIP '.padEnd(6) + name.padEnd(22) + 'unparseable: ' + bad.join(' ')); continue; }
  sim.reset(); sim.applyTokens(invertSeq(alg));
  const fm = facesMade(), wasSolved = sim.isSolved();
  sim.applyTokens(alg); const solves = sim.isSolved();
  const good = solves && !wasSolved && fm === 1;
  console.log((good ? 'OK ' : 'FAIL').padEnd(6) + name.padEnd(22) + `facesMade=${fm} solves=${solves} caseNonTrivial=${!wasSolved}`);
  if (good) ok++;
}
console.log('\n' + ok + ' algs verified as valid FP step-2 (one face made → solved)');
