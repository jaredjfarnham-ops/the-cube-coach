/* Verifier for data/cmll-sheets.js (ALG_SETS.cmllFull).
   For each case:
   1. apply invertSeq(alg) to solved makeState (sets up the case)
   2. apply alg — must return to solved
   3. Roux blocks preserved: all cubies with |x|===1, y∈{0,1} must remain at home
      after the inverse scramble (proves the algorithm only touches LL corners + LL edges)
   Also verifies each alt passes the same test and sets up the same corner state as its primary.
*/
const fs = require('fs'), vm = require('vm');
const root = 'C:/AI/RubiksCubeCoach/';
const files = ['data/notation.js', 'js/engine.js', 'data/algs.js', 'data/cfop-sets.js',
               'data/algs-sheets.js', 'data/cmll-sheets.js'];

const test = `
(function() {
  const ptype = c => { const n=Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z); return n===1?'center':n===2?'edge':'corner'; };
  function homed(c) {
    return c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z
      && JSON.stringify(c.ori)===JSON.stringify(I3);
  }

  function cornerKeyOf(st) {
    return st.cubies().filter(c => ptype(c)==='corner')
      .map(c => [c.home.x,c.home.y,c.home.z, c.pos.x,c.pos.y,c.pos.z, c.ori.map(r=>r.join(',')).join(';')].join(','))
      .sort().join('|');
  }

  // Test one alg: round-trip + block preservation
  function testAlg(alg) {
    const toks = tokenize(alg);
    const hasWide = toks.some(t => /^[lrufbd]/.test(t) || /w/.test(t));
    if (hasWide) return { ok: false, reason: 'wide' };
    // round-trip
    const st = makeState(); st.reset(); st.applyTokens(invertSeq(toks));
    st.applyTokens(toks);
    if (!st.isSolved()) return { ok: false, reason: 'no-solve' };
    // block preservation
    const st2 = makeState(); st2.reset(); st2.applyTokens(invertSeq(toks));
    const blocksBroken = st2.cubies().some(c => {
      if (Math.abs(c.home.x)!==1) return false;
      if (c.home.y!==0 && c.home.y!==1) return false;
      return !homed(c);
    });
    if (blocksBroken) return { ok: false, reason: 'blocks-broken' };
    return { ok: true };
  }

  // Check alt sets up same corner state as primary (orientation-tolerant)
  const ORIENTS = [];
  ['','x2','x',"x'","y x'","y' x'"].forEach(u =>
    ['','y','y2',"y'"].forEach(s => ORIENTS.push((u+' '+s).trim()))
  );
  function orientKeys(seq) {
    const out = new Set();
    for (const o of ORIENTS) {
      const st = makeState(); st.reset(); st.applyTokens(invertSeq(tokenize(seq)));
      if (o) st.applyTokens(tokenize(o));
      out.add(cornerKeyOf(st));
    }
    return out;
  }

  let totalOk = 0, totalFail = 0, totalAlts = 0, altFail = 0;
  const RESULT = ALG_SETS.cmllFull.map(c => {
    const primResult = testAlg(c.moves);
    const primKey = primResult.ok ? cornerKeyOf((() => { const st = makeState(); st.reset(); st.applyTokens(invertSeq(tokenize(c.moves))); return st; })()) : null;

    const altResults = (c.alts || []).map(alt => {
      const v = testAlg(alt);
      if (!v.ok) return { alg: alt, ok: false, reason: v.reason };
      // check same case
      const altOrients = orientKeys(alt);
      const sameCase = primKey && altOrients.has(primKey);
      return { alg: alt, ok: v.ok && sameCase, reason: sameCase ? 'ok' : 'diff-case' };
    });

    const ok = primResult.ok && altResults.every(a => a.ok);
    if (ok) totalOk++; else totalFail++;
    totalAlts += altResults.length;
    altFail += altResults.filter(a => !a.ok).length;
    return { name: c.name, group: c.group, ok, primResult, altResults };
  });

  return { RESULT, totalOk, totalFail, totalAlts, altFail };
})()
`;

const ctx = { console };
vm.createContext(ctx);
const code = 'const LESSONS = {};\n' +
  files.map(f => fs.readFileSync(root + f, 'utf8')).join('\n') + '\n' + test;
const { RESULT, totalOk, totalFail, totalAlts, altFail } = vm.runInContext(code, ctx, { filename: 'bundle.js' });

let hadBad = false;
for (const r of RESULT) {
  const flag = r.ok ? 'OK  ' : 'FAIL';
  const altSummary = r.altResults.length ? ` alts:${r.altResults.filter(a=>a.ok).length}/${r.altResults.length}` : '';
  console.log(`${flag} ${r.name.padEnd(28)} [${r.group.substring(0,20).padEnd(20)}]${altSummary}  => ${r.primResult.reason || 'ok'}`);
  if (!r.ok) {
    hadBad = true;
    if (!r.primResult.ok) console.log(`     PRIMARY FAILED: ${r.primResult.reason}`);
    r.altResults.filter(a => !a.ok).forEach(a => console.log(`     ALT FAILED (${a.reason}): ${a.alg}`));
  }
}

console.log(`\nSummary: ${totalOk} cases ok, ${totalFail} cases failed`);
console.log(`Alts: ${totalAlts} total, ${altFail} failed`);
if (!hadBad) console.log('ALL CASES VERIFIED OK');
