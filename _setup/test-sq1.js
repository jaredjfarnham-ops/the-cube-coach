/* Verify the Square-1 two-sided slash model: right (slots 0-5) and left (slots 6-11)
   slashes are independent involutions, and isSolved tracks both halves. */
const fs = require('fs'), vm = require('vm');
let _t = 0;
const sandbox = { Math, console, document: {},
  performance: { now: () => _t },
  requestAnimationFrame: cb => { _t += 400; cb(_t); } };   // drive snapSlash's rAF tween to completion synchronously
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname + '/../js/puzzles.js', 'utf8'), sandbox, { filename: 'puzzles.js' });

const sq = sandbox.makeSquare1();
const R = [];
const ck = (label, got, want) => { R.push({ label, got, want, ok: got === want }); };

ck('fresh solved', sq.isSolved(), true);
sq.applyTokens(['/']);  ck('after 1 right slash', sq.isSolved(), false);
sq.applyTokens(['/']);  ck('right slash is an involution (R²=I)', sq.isSolved(), true);
sq.snapSlash(1);        ck('after 1 left slash', sq.isSolved(), false);
sq.snapSlash(1);        ck('left slash is an involution (L²=I)', sq.isSolved(), true);
sq.snapSlash(0); sq.snapSlash(1); ck('right+left → both halves flipped', sq.isSolved(), false);
sq.snapSlash(0); sq.snapSlash(1); ck('R L R L = solved (independent halves)', sq.isSolved(), true);
// a left slash alone must NOT equal a right slash alone (different states)
sq.snapSlash(0); const rightOnly = sq.isSolved(); sq.snapSlash(0);   // back to solved
sq.snapSlash(1); const leftOnly = sq.isSolved(); sq.snapSlash(1);
ck('right-only unsolved', rightOnly, false);
ck('left-only unsolved', leftOnly, false);

let pass = 0;
R.forEach(r => { console.log((r.ok ? 'PASS' : 'FAIL').padEnd(5), r.label.padEnd(40), 'got=' + r.got); if (r.ok) pass++; });
console.log(`\n${pass}/${R.length} pass`);
