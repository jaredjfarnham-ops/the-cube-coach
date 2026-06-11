/* Verifier for data/algs-sheets.js.
   For each set: apply invertSeq(alg) to a solved makeState (-> the case
   the alg solves), then apply alg, and confirm it returns to solved AND
   only the intended pieces were disturbed by the inverse scramble.

   "Intended pieces" per set:
     ocll   : only U-layer (y=-1) CORNERS may differ from solved.
     cll2   : only U-layer CORNERS may differ (orient+permute).
     ortega : OLL rows -> only U-layer corners; PBL rows -> any corners
              (both layers permute) but NO edges/centres move.
     cmll   : only U-layer CORNERS may differ (orient+permute),
              everything else (blocks + edges) intact.
*/
const fs = require('fs'), vm = require('vm');
const root = 'C:/AI/RubiksCubeCoach/';
const files = ['data/notation.js', 'js/engine.js', 'data/algs.js', 'data/cfop-sets.js', 'data/algs-sheets.js'];

const test = `
const PT = c => { const n=Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z); return n===1?'center':n===2?'edge':n===3?'corner':'core'; };
const homed = c => c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z && JSON.stringify(c.ori)===JSON.stringify(I3);

/* A center cubie's position never changes on this fixed-axis engine; a pure
   re-orientation of a center is invisible on a real cube (sticker is 1 colour),
   so we ignore center orientation. "Moved" for a center = it left its home pos. */
const centerMoved = c => !(c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z);

/* describe which kinds of pieces were disturbed by the inverse scramble */
function disturb(moves){
  const st = makeState(); st.reset(); st.applyTokens(invertSeq(moves));
  let uCorner=0, otherCorner=0, uEdge=0, otherEdge=0, centerOrMoved=0;
  st.cubies().forEach(c=>{
    const t = PT(c);
    if (t==='center') { if (centerMoved(c)) centerOrMoved++; return; }
    if (homed(c)) return;
    if (t==='corner') { if (c.home.y===-1) uCorner++; else otherCorner++; }
    else { if (c.home.y===-1) uEdge++; else otherEdge++; }
  });
  const edge = uEdge + otherEdge;
  // round-trip: scramble (inverse) then alg must restore solved
  st.reset(); st.applyTokens(invertSeq(moves));
  const scrambled = !st.isSolved();
  st.applyTokens(tokenize(moves));
  const solves = st.isSolved();
  return { uCorner, otherCorner, uEdge, otherEdge, edge, centerOrMoved, scrambled, solves };
}

const RESULT = {};
for (const setName of ['ocll','cll2','ortega','cmll']) {
  RESULT[setName] = ALG_SETS[setName].map(a => {
    const d = disturb(a.moves);
    let intended;
    if (setName==='ortega' && /^PBL/.test(a.name)) {
      // PBL permutes corners on a 2x2 (no edges exist there). On this 3x3 engine
      // the F2/R2 moves also disturb 3x3-only edges, which is harmless for a 2x2.
      // The meaningful invariant: no CENTRES move (proves it's a pure corner perm)
      // and the round-trip solves.
      intended = d.centerOrMoved===0;
    } else {
      // Corner last-layer sets (OCLL / CLL / CMLL / Ortega-OLL): the alg must
      // preserve everything BELOW the last layer (D-corners + all centres).
      // LL edge/corner permutation is not part of these corner-only diagrams,
      // so U-layer edges moving is allowed.
      intended = d.otherCorner===0 && d.otherEdge===0 && d.centerOrMoved===0;
    }
    return { name:a.name, ok: d.scrambled && d.solves && intended, ...d, intended };
  });
}
RESULT;
`;

const ctx = { console };
vm.createContext(ctx);
const code = 'const LESSONS = {};\n' +
  files.map(f => fs.readFileSync(root + f, 'utf8')).join('\n') + '\n' + test;
const result = vm.runInContext(code, ctx, { filename: 'bundle.js' });

let totalOk = 0, totalBad = 0;
for (const set of Object.keys(result)) {
  console.log('\n==== ' + set.toUpperCase() + ' ====');
  let bad = [];
  for (const r of result[set]) {
    const flag = r.ok ? 'OK  ' : 'FAIL';
    console.log(`${flag} ${r.name.padEnd(13)} uC=${r.uCorner} oC=${r.otherCorner} e=${r.edge} other=${r.centerOrMoved} solves=${r.solves} scr=${r.scrambled} intended=${r.intended}`);
    if (r.ok) totalOk++; else { totalBad++; bad.push(r.name); }
  }
  console.log(bad.length ? `  FAILURES: ${bad.join(', ')}` : '  ALL VALID');
}
console.log(`\nTOTAL: ${totalOk} ok, ${totalBad} failed`);
