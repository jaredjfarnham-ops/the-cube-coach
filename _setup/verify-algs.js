const fs = require('fs'), vm = require('vm');
const root = 'C:/AI/RubiksCubeCoach/';
const files = ['data/notation.js', 'js/engine.js', 'data/algs.js'];

const test = `
const PT = c => { const n=Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z); return n===1?'center':n===2?'edge':n===3?'corner':'core'; };
function sig(moves){
  const st = makeState();
  st.reset(); st.applyTokens(tokenize(moves));
  let f2l=true, te=0, tc=0;
  st.cubies().forEach(c=>{
    const t=PT(c), ph=c.pos.x===c.home.x&&c.pos.y===c.home.y&&c.pos.z===c.home.z;
    const home = t==='center' ? ph : (ph && JSON.stringify(c.ori)===JSON.stringify(I3));
    if(c.home.y!==-1){ if(!home) f2l=false; }
    else if(t!=='center' && !home){ if(t==='edge') te++; else tc++; }
  });
  st.reset(); st.applyTokens(invertSeq(moves)); const scrambled=!st.isSolved(); st.applyTokens(tokenize(moves)); const solves=st.isSolved();
  return { f2l, te, tc, ok: f2l && scrambled && solves };
}
const RESULT = {};
for(const setName of Object.keys(ALG_SETS)){
  RESULT[setName] = ALG_SETS[setName].map(a => { const s=sig(a.moves); return { name:a.name, ok:s.ok, f2l:s.f2l, edges:s.te, corners:s.tc }; });
}
RESULT;
`;

const ctx = { console, LESSONS: {} };
vm.createContext(ctx);
const code = 'const LESSONS = ctxLESSONS;\n' +
  files.map(f => fs.readFileSync(root + f, 'utf8')).join('\n') + '\n' + test;
ctx.ctxLESSONS = {};
const result = vm.runInContext(code, ctx, { filename: 'bundle.js' });

for (const set of Object.keys(result)) {
  console.log('\n==== ' + set.toUpperCase() + ' ====');
  let bad = [];
  for (const r of result[set]) {
    const flag = r.ok ? 'OK ' : 'FAIL';
    console.log(`${flag}  ${r.name.padEnd(5)} edges=${r.edges} corners=${r.corners}${r.ok?'':'  <-- f2l='+r.f2l}`);
    if (!r.ok) bad.push(r.name);
  }
  console.log(bad.length ? `FAILURES: ${bad.join(', ')}` : 'ALL VALID');
}
