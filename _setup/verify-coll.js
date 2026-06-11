/* Final independent verification of data/coll-sheets.js.
   Loads the engine, then checks every primary + alt.
   Run: node _setup/verify-coll.js
*/
const fs = require('fs'), vm = require('vm');
const root = 'C:/AI/RubiksCubeCoach/';

const ctx = { console };
vm.createContext(ctx);

const bundle = 'const LESSONS = {};\n' +
  ['data/notation.js','js/engine.js','data/algs.js','data/coll-sheets.js']
    .map(f => fs.readFileSync(root + f, 'utf8')).join('\n');

vm.runInContext(bundle, ctx, { filename: 'bundle.js' });

const verifyCode = `
const ptype = c => {
  const n = Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z);
  return n===1?'center':n===2?'edge':'corner';
};

function collCheck(alg) {
  const st = makeState(); st.reset();
  let toks;
  try { toks = tokenize(alg); } catch(e) { return {ok:false, err:'tokenize: '+e.message}; }
  st.applyTokens(invertSeq(toks));
  let otherCorner=0, otherEdge=0, centerMoved=0;
  st.cubies().forEach(c => {
    const t = ptype(c);
    if (t==='center') {
      if (!(c.pos.x===c.home.x&&c.pos.y===c.home.y&&c.pos.z===c.home.z)) centerMoved++;
      return;
    }
    const homed = c.pos.x===c.home.x&&c.pos.y===c.home.y&&c.pos.z===c.home.z&&JSON.stringify(c.ori)===JSON.stringify(I3);
    if (!homed) {
      if (t==='corner'&&c.home.y!==-1) otherCorner++;
      if (t==='edge'&&c.home.y!==-1) otherEdge++;
    }
  });
  const f2lOk = otherCorner===0&&otherEdge===0&&centerMoved===0;
  st.applyTokens(toks);
  return { ok:f2lOk&&st.isSolved(), f2lOk, solves:st.isSolved(), otherCorner, otherEdge, centerMoved };
}

// Distinctness: unique LL corner state up to AUF
function collKey(st) {
  return st.cubies()
    .filter(c => ptype(c)==='corner' && c.home.y===-1)
    .map(c => [c.home.x,c.home.y,c.home.z, c.pos.x,c.pos.y,c.pos.z, c.ori.join('')].join(','))
    .sort().join('|');
}
function setupKey(seq) {
  const st = makeState(); st.reset();
  st.applyTokens(invertSeq(tokenize(seq)));
  return collKey(st);
}

let totalOk = 0, totalFail = 0, totalAlts = 0;
const primKeys = new Map();
let dupCount = 0;

for (const c of ALG_SETS.coll) {
  const chk = collCheck(c.moves);
  if (chk.ok) {
    totalOk++;
    const k = setupKey(c.moves);
    if (primKeys.has(k)) { dupCount++; console.log('DUP primary:', c.name, 'vs', primKeys.get(k)); }
    else primKeys.set(k, c.name);
  } else {
    totalFail++;
    console.log('FAIL primary', c.name, c.moves, JSON.stringify(chk));
  }
  for (const alt of (c.alts||[])) {
    totalAlts++;
    const chkA = collCheck(alt);
    if (!chkA.ok) {
      totalFail++;
      console.log('FAIL alt', c.name, alt, JSON.stringify(chkA));
    } else {
      totalOk++;
    }
  }
}

console.log('\\n==== Independent Verification ====');
console.log('Cases: ' + ALG_SETS.coll.length);
console.log('Total alts: ' + totalAlts);
console.log('Checks passed: ' + totalOk);
console.log('Checks failed: ' + totalFail);
console.log('Duplicate primaries: ' + dupCount);
console.log(totalFail===0&&dupCount===0 ? '\\nALL PASS' : '\\nFAILURES FOUND');
`;

vm.runInContext(verifyCode, ctx, { filename: 'verify.js' });
