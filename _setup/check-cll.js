/* Validate the tao-yu/Alg-Trainer CLL/EG1/EG2 dataset before relying on it:
   for each case (a "/"-separated alg list), confirm every alternative solves the
   SAME 2x2 corner case as the first alg (canonical over whole-cube orientation + AUF). */
const fs = require('fs'), vm = require('vm');
const root = 'C:/AI/RubiksCubeCoach/';
const ctx = { console }; vm.createContext(ctx);

// run engine + the trainer source so CLL/EG1/EG2 become context globals
const code = 'const LESSONS={}; var window={};' +
  ['data/notation.js', 'js/engine.js'].map(f => fs.readFileSync(root + f, 'utf8')).join('\n') +
  '\n' + fs.readFileSync(root + '_setup/algtrainer-src.js', 'utf8') + `
  const clean = s => s.replace(/[()]/g,' ').replace(/2'/g,'2').replace(/\\s+/g,' ').trim();
  const UPS=['','x2','x',"x'","y x'","y' x'"], SP=['','y','y2',"y'"], OR=[];
  UPS.forEach(u=>SP.forEach(s=>OR.push((u+' '+s).trim())));
  const isC = c => Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z)===3;
  function cornerKey(seq){ let best=null;
    for(const o of OR) for(const pre of ['','U','U2',"U'"]){ const st=makeState(); st.reset();
      try{ st.applyTokens(tokenize(seq)); if(pre)st.applyTokens(tokenize(pre)); if(o)st.applyTokens(tokenize(o)); }catch(e){ continue; }
      const k=st.cubies().filter(isC).map(c=>[c.home.x,c.home.y,c.home.z,c.pos.x,c.pos.y,c.pos.z,c.ori.flat().join('')].join(',')).sort().join('|');
      if(best===null||k<best) best=k; }
    return best; }
  function check(SET){ let cases=0, totAlts=0, matchAlts=0, parseFail=0; const bad=[];
    for(const grp in SET){ SET[grp].forEach((caseStr,ci)=>{ cases++;
      const algs=caseStr.split('/').map(clean).filter(Boolean); if(!algs.length) return;
      let pk; try{ pk=cornerKey(algs[0]); }catch(e){ parseFail++; return; }
      algs.slice(1).forEach(a=>{ totAlts++; let k; try{ k=cornerKey(a); }catch(e){ parseFail++; return; }
        if(k===pk) matchAlts++; else bad.push(grp+'#'+ci+' alt: '+a); }); }); }
    return { cases, totAlts, matchAlts, parseFail, badSample: bad.slice(0,4) }; }
  ({ CLL: check(CLL), EG1: check(EG1), EG2: check(EG2) });`;
console.log(JSON.stringify(vm.runInContext(code, ctx, { filename: 'b.js' }), null, 1));
