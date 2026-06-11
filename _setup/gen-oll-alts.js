/* Generate data/oll-alts.js:
     • alts for the existing 57-case ALG_SETS.oll (matched by OLL number to logiqx oll.js),
     • ALG_SETS.ollOH / ALG_SETS.pllOH — one-handed sheets (OH-tagged alg as primary),
   all engine-verified. Sources: logiqx/cubing-algs oll.js + pll.js (saved under _setup/).
   An alg is valid for a case iff it reaches that case's GOAL (OLL=orient, PLL=solved),
   tolerant of holding orientation + recognition AUF. */
const fs = require('fs'), vm = require('vm');
const root = 'C:/AI/RubiksCubeCoach/';
const ctx = { console }; vm.createContext(ctx);

const parseSet = txt => new Function('var algSet;' + txt + ';return algSet;')();
const clean = s => s.replace(/[()]/g, ' ').replace(/2'/g, '2').replace(/\s+/g, ' ').trim();
function caseAlgs(algSet) {                 // id -> {primaryOH, all:[{alg, oh}]}
  const out = {};
  algSet.cases.forEach(c => {
    if (!c.algs) return;
    const list = [];
    c.algs.forEach(a => { if (!a.alg) return; const oh = (a.uses || []).some(u => u.id === 'OH');
      list.push({ alg: clean(a.alg), oh }); (a.vars || []).forEach(v => { if (v.alg) list.push({ alg: clean(v.alg), oh: oh || (v.uses || []).some(u => u.id === 'OH') }); }); });
    out[String(c.id)] = list;
  });
  return out;
}
const ollSrc = caseAlgs(parseSet(fs.readFileSync(root + '_setup/oll-src.js', 'utf8')));
const pllSrc = caseAlgs(parseSet(fs.readFileSync(root + '_setup/pll-src.js', 'utf8')));

const bundle = 'const LESSONS={};' +
  ['data/notation.js', 'js/engine.js', 'data/algs.js', 'data/cfop-sets.js'].map(f => fs.readFileSync(root + f, 'utf8')).join('\n') + `
  const ORIENTS = (() => { const ups=['','x2','x',"x'","y x'","y' x'"], spin=['','y','y2',"y'"], o=[]; ups.forEach(u=>spin.forEach(s=>o.push((u+' '+s).trim()))); return o; })();
  const PT = c => { const n=Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z); return n===1?'center':n===2?'edge':'corner'; };
  const HOME = c => c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z && JSON.stringify(c.ori)===JSON.stringify(I3);
  const POS  = c => c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z;
  const UP = {x:0,y:-1,z:0};
  function goalReached(goal, st){ const cs=st.cubies();
    const f2l=()=>cs.every(c=>PT(c)==='center'?POS(c):(c.home.y===-1?true:HOME(c)));
    if(goal==='orient') return f2l() && cs.filter(c=>c.pos.y===-1&&PT(c)!=='center').every(c=>facing(c,UP)==='U');
    return cs.every(c=>PT(c)==='center'?POS(c):HOME(c)); }
  function solvesCase(goal, primary, candidate){
    let toks; try{ toks=tokenize(candidate);}catch(e){return false;} if(!toks.length) return false;
    try{ toks.forEach(t=>parse(t)); }catch(e){ return false; }
    const invP=invertSeq(primary);
    for(const hold of ORIENTS){ const ht=hold?tokenize(hold):null;
      for(const pre of ['','U','U2',"U'"]){ const st=makeState(); st.reset();
        try{ st.applyTokens(invP); if(ht)st.applyTokens(ht); if(pre)st.applyTokens(tokenize(pre)); st.applyTokens(toks); }catch(e){ continue; }
        for(const O of ORIENTS){ const ot=O?tokenize(O):null; if(ot)st.applyTokens(ot); const ok=goalReached(goal,st); if(ot)st.applyTokens(invertSeq(ot)); if(ok) return true; } } }
    return false; }
  // cancel adjacent same-face moves
  function simplify(seq){ let toks=tokenize(seq); const base=t=>t.match(/^[A-Za-z]+w?/)[0]; const amt=t=>{let q=/2/.test(t)?2:1; if(/'/.test(t))q=(4-q)%4; return q;};
    for(;;){ const out=[]; let ch=false; for(const t of toks){ if(out.length&&base(out[out.length-1])===base(t)){ const b=base(t),q=(amt(out[out.length-1])+amt(t))%4; out.pop(); ch=true; if(q===1)out.push(b); else if(q===2)out.push(b+'2'); else if(q===3)out.push(b+"'"); } else out.push(t); } toks=out; if(!ch) break; }
    return toks.join(' '); }
  // one-handed friendliness penalty (lower = better): R/U/y are free, slices & wide & L/D/B are costly
  function ohScore(alg){ let s=0; const toks=tokenize(alg);
    for(const t of toks){ const b=t.replace(/['2]/g,'');
      if(/^[MES]$/.test(b)) s+=10;                       // M/E/S slices — need two hands
      else if(/w/.test(b) || /^[lrufbd]$/.test(b)) s+=8; // wide moves
      else if(b==='L'||b==='D') s+=4; else if(b==='B') s+=3;
      else if(b==='F') s+=1.5; else if(b==='x'||b==='z') s+=1.5; } // R, U, y = 0
    return s + toks.length*0.1; }                        // tie-break: shorter
  // pick the most OH-friendly alg as primary, rest as alts (OH order)
  function pickOH(c, goal, pool){ const seen=new Set(), verified=[];
    [c.moves, ...pool].forEach(a=>{ if(!solvesCase(goal, c.moves, a)) return; const s=simplify(a)||a; if(!solvesCase(goal,c.moves,s)) return; const tk=tokenize(s).join(' '); if(seen.has(tk)) return; seen.add(tk); verified.push(s); });
    verified.sort((a,b)=>ohScore(a)-ohScore(b) || tokenize(a).length-tokenize(b).length);
    const e={ name:c.name, group:c.group, moves: verified[0]||c.moves }; if(verified.length>1) e.alts=verified.slice(1,6); return e; }

  const OLL_SRC = ${JSON.stringify(ollSrc)}, PLL_SRC = ${JSON.stringify(pllSrc)};
  // ---- OLL: alts for each existing case (match by OLL number), + OH primary ----
  const ollAlts = {}, ollOH = [];
  ALG_SETS.oll.forEach(c => {
    const num = c.name.replace(/\\D/g,'');                  // "OLL 27" -> "27"
    const cands = OLL_SRC[num] || [];
    const verified = cands.filter(x => solvesCase('orient', c.moves, x.alg));
    const primTok = tokenize(c.moves).join(' ');
    const seen = new Set([primTok]); const alts = [];
    verified.forEach(x => { const s = simplify(x.alg); if(!s) return; if(!solvesCase('orient', c.moves, s)) return; const tk=tokenize(s).join(' '); if(seen.has(tk)) return; seen.add(tk); alts.push(s); });
    if (alts.length) ollAlts[c.name] = alts.slice(0,5);
    ollOH.push(pickOH(c, 'orient', verified.map(x => x.alg)));   // OH primary = most one-handed-friendly
  });
  // ---- PLL OH sheet (match by PLL letter name; ids in pll.js are the names) ----
  const pllOH = [];
  ALG_SETS.pll.forEach(c => {
    pllOH.push(pickOH(c, 'solved', (PLL_SRC[c.name] || []).map(x => x.alg)));   // OH primary = most one-handed-friendly
  });
  ({ ollAlts, ollOH, pllOH });`;

const { ollAlts, ollOH, pllOH } = vm.runInContext(bundle, ctx, { filename: 'b.js' });

let js = `/* OLL alternative algorithms + One-Handed (OH) OLL & PLL sheets — engine-verified.
   Sourced from logiqx/cubing-algs (oll.js, pll.js). Generated by _setup/gen-oll-alts.js — do not hand-edit.
   Loads after data/cfop-sets.js (OLL) and data/algs.js (PLL). */
(function () {
  if (typeof ALG_SETS === 'undefined') return;
  const OLL_ALTS = ${JSON.stringify(ollAlts, null, 0)};
  if (ALG_SETS.oll) ALG_SETS.oll.forEach(c => { if (OLL_ALTS[c.name]) c.alts = OLL_ALTS[c.name]; });
  ALG_SETS.ollOH = ${JSON.stringify(ollOH)};
  ALG_SETS.pllOH = ${JSON.stringify(pllOH)};
  LESSONS['3x3/cfop/oll-oh-sheet'] = { type:'sheet', kind:'oll', goal:'orient', set:'ollOH',
    title:'OLL — One-Handed', intro:['One-handed-friendly OLL algorithms (chosen to avoid regrips), with the two-handed and other variants available from the ⋮ menu on each case.'] };
  LESSONS['3x3/cfop/pll-oh-sheet'] = { type:'sheet', kind:'pll', goal:'solved', set:'pllOH',
    title:'PLL — One-Handed', intro:['One-handed-friendly PLL algorithms. Use the ⋮ menu on a case to see the two-handed alternatives or add your own.'] };
})();
`;
fs.writeFileSync(root + 'data/oll-alts.js', js);

const ollWith = Object.keys(ollAlts).length, ollAltN = Object.values(ollAlts).reduce((a, b) => a + b.length, 0);
const ohOll = ollOH.filter(e => e.alts).length, pllOHwithOH = pllOH.length;
console.log('Wrote data/oll-alts.js');
console.log('  OLL: ' + ollWith + '/57 cases have alts, ' + ollAltN + ' alts total');
console.log('  ollOH: ' + ollOH.length + ' cases; pllOH: ' + pllOH.length + ' cases');
