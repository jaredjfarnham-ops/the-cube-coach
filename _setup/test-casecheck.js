/* Validate the per-kind custom-algorithm verifier (algSolvesCase) before porting it into app.js.
   Goal per sheet kind/goal:
     'orient' (OLL): F2L intact + every U-layer piece shows U on top (orientation only).
     'solved' (PLL/ZBLL): whole cube solved.
     'coll'  : F2L intact + LL corners home + LL edges oriented (edge perm ignored).
     'cmll'  : both Roux blocks intact + LL corners home (LSE ignored).
   Accept up to a recognition AUF (pre) and any whole-cube reorientation (finish). */
const fs = require('fs'), vm = require('vm');
const root = 'C:/AI/RubiksCubeCoach/';
const ctx = { console }; vm.createContext(ctx);

const lib = `
const _ORIENTS = (()=>{ const ups=['','x2','x',"x'","y x'","y' x'"], spin=['','y','y2',"y'"], o=[]; ups.forEach(u=>spin.forEach(s=>o.push((u+' '+s).trim()))); return o; })();
const _ptype = c => { const n=Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z); return n===1?'center':n===2?'edge':'corner'; };
const _home = c => c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z && JSON.stringify(c.ori)===JSON.stringify(I3);
const _UP = {x:0,y:-1,z:0};
const _f2lHome = st => st.cubies().every(c => { const t=_ptype(c);
  if (t==='center') return c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z;   // ignore centre orientation
  if (c.home.y===-1) return true;                                                            // LL piece — not F2L
  return _home(c); });
const _uTop = st => st.cubies().filter(c=>c.pos.y===-1 && _ptype(c)!=='center').every(c=>facing(c,_UP)==='U');
const _uCornersHome = st => st.cubies().filter(c=>c.home.y===-1 && _ptype(c)==='corner').every(_home);
const _uEdgesOriented = st => st.cubies().filter(c=>c.pos.y===-1 && _ptype(c)==='edge').every(c=>facing(c,_UP)==='U');
const _blocksHome = st => st.cubies().filter(c=>Math.abs(c.home.x)===1 && (c.home.y===0||c.home.y===1)).every(_home);
// solved ignoring center ORIENTATION (invisible on a real cube; M-slice setups spin centers)
const _visSolved = st => st.cubies().every(c => _ptype(c)==='center'
  ? (c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z) : _home(c));
function _goal(goal, st){
  if (goal==='orient') return _f2lHome(st) && _uTop(st);
  if (goal==='coll')   return _f2lHome(st) && _uCornersHome(st) && _uEdgesOriented(st);
  if (goal==='cmll')   return _blocksHome(st) && _uCornersHome(st);
  return _visSolved(st);   // 'solved'
}
const _WIDE = t => /^\\d*[lrufbd]/.test(t) || /w/.test(t);
/* returns 'ok' | 'notation' | 'wrongcase' */
function algSolvesCase(goal, primary, candidate){
  let candToks; try { candToks = tokenize(candidate); } catch(e){ return 'notation'; }
  if (!candToks.length) return 'notation';
  if (candToks.some(_WIDE)) return 'notation';
  try { candToks.forEach(t => parse(t)); } catch(e){ return 'notation'; }   // unknown move
  const invP = invertSeq(primary);
  // try every holding orientation (Hold) + recognition AUF (pre) before the alg,
  // and accept if the alg reaches the goal under any whole-cube finish orientation (O).
  for (const hold of _ORIENTS) {
    const ht = hold ? tokenize(hold) : null;
    for (const pre of ['','U','U2',"U'"]) {
      const base = makeState(); base.reset();
      try { base.applyTokens(invP); if (ht) base.applyTokens(ht); if (pre) base.applyTokens(tokenize(pre)); base.applyTokens(candToks); }
      catch(e){ continue; }
      for (const O of _ORIENTS) {
        const st = makeState(); st.reset();
        try { st.applyTokens(invP); if (ht) st.applyTokens(ht); if (pre) st.applyTokens(tokenize(pre)); st.applyTokens(candToks); if (O) st.applyTokens(tokenize(O)); }
        catch(e){ continue; }
        if (_goal(goal, st)) return 'ok';
      }
    }
  }
  return 'wrongcase';
}
`;

const tests = `
const R = [];
const CK = (label, goal, primary, cand, expect) => { const got = algSolvesCase(goal, primary, cand); R.push({label, goal, cand, got, expect, pass: got===expect}); };

// PLL: a real Ua alt should pass; a wrong alg should fail; gibberish = notation
CK('PLL Ua primary self', 'solved', "M2 U M U2 M' U M2", "M2 U M U2 M' U M2", 'ok');
CK('PLL Ua RU alt',       'solved', "M2 U M U2 M' U M2", "R U' R U R U R U' R' U' R2", 'ok');
CK('PLL Ua wrong (Sune)', 'solved', "M2 U M U2 M' U M2", "R U R' U R U2 R'", 'wrongcase');
CK('PLL gibberish',       'solved', "M2 U M U2 M' U M2", "Q W E", 'notation');
CK('PLL wide rejected',   'solved', "M2 U M U2 M' U M2", "r U R' U' r' F R F'", 'notation');

// OLL (orient): Sune; a different alg that also orients THIS case should pass; a non-OLL should fail.
CK('OLL Sune self',       'orient', "R U R' U R U2 R'", "R U R' U R U2 R'", 'ok');
CK('OLL Sune via L-mirror','orient', "R U R' U R U2 R'", "L' U' L U' L' U2 L", 'wrongcase'); // different case (anti-sune mirror) -> should fail
CK('OLL Sune wrong',      'orient', "R U R' U R U2 R'", "R U R' U' R' F R F'", 'wrongcase');

// COLL (corners + EO): the corner alg solves corners and keeps edges oriented.
CK('COLL sune-perm self', 'coll', "R U R' U R U2 R'", "R U R' U R U2 R'", 'ok');

// CMLL: same corner alg, blocks preserved (R U R' U R U2 R' preserves blocks? R moves right block — but round trips).
CK('CMLL sune self',      'cmll', "R U R' U R U2 R'", "R U R' U R U2 R'", 'ok');
R;
`;

const code = 'const LESSONS={};' +
  ['data/notation.js','js/engine.js'].map(f=>fs.readFileSync(root+f,'utf8')).join('\n') + lib + tests;
const R = vm.runInContext(code, ctx, { filename:'b.js' });
let ok=0, bad=0;
R.forEach(r => { console.log((r.pass?'PASS':'FAIL').padEnd(5), r.label.padEnd(26), 'got='+r.got, 'want='+r.expect); r.pass?ok++:bad++; });
console.log('\n'+ok+' pass, '+bad+' fail');
