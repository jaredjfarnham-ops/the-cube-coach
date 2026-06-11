/**
 * test-solver.js — Validates js/vendor/cubejs.js
 *
 * Tests:
 *  1. Solver initialises (Cube.initSolver).
 *  2. Round-trip: apply scramble → solver gives solution → applying both returns to
 *     visually-solved state, verified independently by this repo's own engine
 *     (data/notation.js + js/engine.js), by comparing the 54-char facelet string.
 *  3. Reports init time, per-solve timing.
 *  4. Tests fromString / asString API.
 *  5. Tests invalid-state behaviour.
 *
 * NOTE: engine.isSolved() checks matrix identity (not just sticker colors), so
 * it can return false on a solved-looking cube after many moves.  We compare
 * facelet strings instead — this is the authoritative visual check.
 *
 * Run: node _setup/test-solver.js  (from the repo root or any directory)
 */
'use strict';

const fs   = require('fs');
const vm   = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Load cubejs into an isolated context so it behaves like a browser global ──
const cubeCtx = {};
vm.createContext(cubeCtx);
const cubeJsSrc = fs.readFileSync(path.join(ROOT, 'js/vendor/cubejs.js'), 'utf8');
// The IIFEs use .call(this); in a vm context 'this' at the top level is the sandbox object.
vm.runInContext('(function(){ ' + cubeJsSrc + ' }).call(this)', cubeCtx);
const Cube = cubeCtx.Cube;
if (!Cube) throw new Error('Cube global not found in vm context – check vendored file');
console.log('✓ Cube global loaded from js/vendor/cubejs.js');

// ── Load the repo engine for independent verification ──
const engineCtx = {};
vm.createContext(engineCtx);
let engineSrc = '';
for (const f of ['data/notation.js', 'js/engine.js']) {
  engineSrc += fs.readFileSync(path.join(ROOT, f), 'utf8') + '\n';
}
// tokenize/invertSeq are const-declared in engine.js → not auto-hoisted to context obj
engineSrc += '\n_tokenize = tokenize; _invertSeq = invertSeq;\n';
vm.runInContext(engineSrc, engineCtx);
const makeState  = () => engineCtx.makeState();
const tokenize   = (s) => engineCtx._tokenize(s);
if (!engineCtx.makeState) throw new Error('makeState not found in engine context');
console.log('✓ Repo engine (notation.js + engine.js) loaded');

// ── Facelet extractor from an engine state ─────────────────────────────────────
// Reads all 54 stickers in URFDLB order (9 per face, left-to-right top-to-bottom
// when looking at each face from outside).  Matches Cube.asString() format.
const facing = engineCtx.facing;
const FACE_SCAN = [
  // U (y=-1): viewed from above — rows front-to-back (z: -1→1), cols left-to-right (x: -1→1)
  { dir:{x:0,y:-1,z:0}, positions: [
    {x:-1,y:-1,z:-1},{x:0,y:-1,z:-1},{x:1,y:-1,z:-1},
    {x:-1,y:-1,z:0}, {x:0,y:-1,z:0}, {x:1,y:-1,z:0},
    {x:-1,y:-1,z:1}, {x:0,y:-1,z:1}, {x:1,y:-1,z:1},
  ]},
  // R (x=1): viewed from right — rows top-to-bottom (y: -1→1), cols front-to-back (z: 1→-1)
  { dir:{x:1,y:0,z:0}, positions: [
    {x:1,y:-1,z:1},{x:1,y:-1,z:0},{x:1,y:-1,z:-1},
    {x:1,y:0,z:1}, {x:1,y:0,z:0}, {x:1,y:0,z:-1},
    {x:1,y:1,z:1}, {x:1,y:1,z:0}, {x:1,y:1,z:-1},
  ]},
  // F (z=1): viewed from front — rows top-to-bottom (y: -1→1), cols left-to-right (x: -1→1)
  { dir:{x:0,y:0,z:1}, positions: [
    {x:-1,y:-1,z:1},{x:0,y:-1,z:1},{x:1,y:-1,z:1},
    {x:-1,y:0,z:1}, {x:0,y:0,z:1}, {x:1,y:0,z:1},
    {x:-1,y:1,z:1}, {x:0,y:1,z:1}, {x:1,y:1,z:1},
  ]},
  // D (y=1): viewed from below — rows front-to-back (z: 1→-1), cols left-to-right (x: -1→1)
  { dir:{x:0,y:1,z:0}, positions: [
    {x:-1,y:1,z:1},{x:0,y:1,z:1},{x:1,y:1,z:1},
    {x:-1,y:1,z:0},{x:0,y:1,z:0},{x:1,y:1,z:0},
    {x:-1,y:1,z:-1},{x:0,y:1,z:-1},{x:1,y:1,z:-1},
  ]},
  // L (x=-1): viewed from left — rows top-to-bottom (y: -1→1), cols back-to-front (z: -1→1)
  { dir:{x:-1,y:0,z:0}, positions: [
    {x:-1,y:-1,z:-1},{x:-1,y:-1,z:0},{x:-1,y:-1,z:1},
    {x:-1,y:0,z:-1}, {x:-1,y:0,z:0}, {x:-1,y:0,z:1},
    {x:-1,y:1,z:-1}, {x:-1,y:1,z:0}, {x:-1,y:1,z:1},
  ]},
  // B (z=-1): viewed from back — rows top-to-bottom (y: -1→1), cols right-to-left (x: 1→-1)
  { dir:{x:0,y:0,z:-1}, positions: [
    {x:1,y:-1,z:-1},{x:0,y:-1,z:-1},{x:-1,y:-1,z:-1},
    {x:1,y:0,z:-1}, {x:0,y:0,z:-1}, {x:-1,y:0,z:-1},
    {x:1,y:1,z:-1}, {x:0,y:1,z:-1}, {x:-1,y:1,z:-1},
  ]},
];

function engineFacelets(st) {
  const cubies = st.cubies();
  let result = '';
  for (const face of FACE_SCAN) {
    for (const pos of face.positions) {
      const cubie = cubies.find(c => c.pos.x===pos.x && c.pos.y===pos.y && c.pos.z===pos.z);
      result += (cubie ? (facing(cubie, face.dir) || '?') : '?');
    }
  }
  return result;
}

const SOLVED_FACELETS = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

// ── Verify the facelet extractor is correct for a solved state ─────────────────
{
  const st = makeState();
  const ef = engineFacelets(st);
  if (ef !== SOLVED_FACELETS) throw new Error('engineFacelets(solved) wrong: ' + ef);
  const cf = new Cube().asString();
  if (cf !== SOLVED_FACELETS) throw new Error('Cube.asString(solved) wrong: ' + cf);
  console.log('✓ Facelet extractor verified for solved state');
}

// ── Helper: independent round-trip check ──────────────────────────────────────
// Apply scramble, then solution; compare the 54-char facelet string to solved.
// This is independent of both engines' isSolved() implementations.
function engineRoundTrip(scramble, solution) {
  const st = makeState();
  st.applyTokens(tokenize(scramble));
  st.applyTokens(tokenize(solution));
  return engineFacelets(st) === SOLVED_FACELETS;
}

// ── Init solver ────────────────────────────────────────────────────────────────
console.log('\nInitialising solver (building pruning tables) …');
const t0 = Date.now();
Cube.initSolver();
const initMs = Date.now() - t0;
console.log(`✓ Solver initialised in ${initMs} ms (${(initMs/1000).toFixed(1)} s)`);

// ── Helper: run one solve and return { solution, solveMs, moves } ─────────────
function testScramble(scramble) {
  const cube = new Cube();
  cube.move(scramble);

  const ts = Date.now();
  const solution = cube.solve();
  const solveMs = Date.now() - ts;

  if (!solution) return { ok: false, error: 'solve() returned null', solveMs, solution };

  const moves = solution.trim().split(/\s+/).filter(Boolean).length;
  const roundTrip = engineRoundTrip(scramble, solution);

  return { ok: roundTrip, solution, solveMs, moves };
}

// ── Scrambles to test ─────────────────────────────────────────────────────────
const SCRAMBLES = [
  "R U R' U'",                              // simple 4-move
  "R U R' U' F2 L D B2",                   // task-specified scramble
  "F2 L2 B2 R2 U2 F2 D2 B2 L2 U2",        // all double moves
  "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2", // ~WCA scramble length
  "D' R2 U' F2 D' F2 U F2 D R2 D R' U2 R' D F L D' F' R2", // 20-mover
  "L' U2 R' D2 R U2 L D' B2 U2 B2 D B2 D2 F2 L2 B2 D2",   // 18-move scramble
  "U' D R L' F B' U' D",                   // mixed commutators
];

console.log('\nRunning solve round-trips…\n');
let allPass = true;
const timings = [];

for (const scramble of SCRAMBLES) {
  const res = testScramble(scramble);
  timings.push(res.solveMs);
  const status = res.ok ? '✓ PASS' : '✗ FAIL';
  if (!res.ok) allPass = false;
  const movesStr = res.ok ? `${res.moves} moves` : (res.error || `[round-trip FAILED]`);
  console.log(`${status} | scramble: ${scramble}`);
  console.log(`       | solution: ${res.solution}`);
  console.log(`       | ${movesStr} | ${res.solveMs} ms`);
  console.log();
}

const avgMs = Math.round(timings.reduce((a,b)=>a+b,0) / timings.length);
const maxMs = Math.max(...timings);
console.log(`Timing summary: avg=${avgMs} ms, max=${maxMs} ms (over ${SCRAMBLES.length} solves)`);
console.log(`Init time: ${initMs} ms`);

// ── Test fromString / asString round-trip ─────────────────────────────────────
console.log('\n── fromString / asString test ───────────────────────────────────────────');
const c1 = Cube.fromString(SOLVED_FACELETS);
const s1 = c1.asString();
console.log('Solved fromString → asString:', s1 === SOLVED_FACELETS ? '✓ identity' : '✗ MISMATCH: ' + s1);

// After scramble, asString should differ from solved
const c2 = new Cube();
c2.move("R U R' U'");
const s2 = c2.asString();
console.log("After R U R' U' asString:", s2 !== SOLVED_FACELETS ? '✓ differs from solved' : '✗ still looks solved!');
console.log('Sample facelet string:', s2);

// fromString → solve round-trip
const c3 = Cube.fromString(s2);
const sol3 = c3.solve();
const ok3 = engineRoundTrip("R U R' U'", sol3);
console.log('fromString → solve round-trip (engine verifies):', ok3 ? '✓ PASS' : '✗ FAIL');

// ── Color-to-face mapping for the app's convention ────────────────────────────
console.log('\n── App color → face letter mapping ──────────────────────────────────────');
const APP_COLOR_MAP = {
  white:  'U',
  red:    'R',
  green:  'F',
  yellow: 'D',
  orange: 'L',
  blue:   'B',
};
console.log('App color → face letter mapping (app convention matches solver convention):');
for (const [color, face] of Object.entries(APP_COLOR_MAP)) {
  console.log(`  ${color.padEnd(8)} → '${face}'`);
}

// ── Invalid state tests ───────────────────────────────────────────────────────
console.log('\n── Invalid state tests ──────────────────────────────────────────────────');

function testInvalid(desc, fn) {
  try {
    const result = fn();
    if (result === null || result === undefined) {
      console.log(`  ${desc}: returned ${result} (null/undefined, no throw)`);
    } else {
      // Check if the result looks like a real solution (short string of moves)
      // or garbage (returns solved string for invalid state = undetected error)
      console.log(`  ${desc}: returned non-null ("${String(result).substring(0,40)}…")`);
    }
  } catch (e) {
    console.log(`  ${desc}: threw ${e.constructor.name}: ${e.message.substring(0, 80)}`);
  }
}

// 1. Wrong-length string (53 chars)
testInvalid('Wrong length (53 chars → fromString+solve)', () => {
  const c = Cube.fromString('UUUUUUUUURRRRRRRRFFFFFFFFDDDDDDDDLLLLLLLLLBBBBBBBB'); // 53
  return c ? c.solve() : null;
});

// 2. Invalid color character
testInvalid('Invalid char in facelet string', () => {
  const c = Cube.fromString('XUUUUUUUURRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');
  return c ? c.solve() : null;
});

// 3. Algebraically invalid (twisted single corner — impossible physical state)
testInvalid('Twisted corner (impossible state)', () => {
  // Start from solved, swap one corner's U sticker with its R sticker
  let arr = SOLVED_FACELETS.split('');
  // URF corner: U9=arr[8], R1=arr[9], F3=arr[20]
  // Twist: rotate the stickers — U9→R1, R1→F3, F3→U9
  [arr[8], arr[9], arr[20]] = [arr[9], arr[20], arr[8]];
  const c = Cube.fromString(arr.join(''));
  return c ? c.solve() : null;
});

// 4. Null input
testInvalid('null input to fromString', () => {
  const c = Cube.fromString(null);
  return c ? c.solve() : null;
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════');
console.log(allPass ? '✓ ALL ROUND-TRIP TESTS PASSED' : '✗ SOME TESTS FAILED');
console.log('══════════════════════════════════════════════════════════\n');
