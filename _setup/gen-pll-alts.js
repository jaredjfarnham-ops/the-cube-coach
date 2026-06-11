/* Generate data/pll-alts.js — alternative algorithms for each PLL case.
   Source: logiqx/cubing-algs data/pll.js (real, hand-curated alg strings), saved to _setup/pll-src.js.

   Correctness model (matches the sheet player's arm(): it scrambles by invertSeq(THE ALG)
   then plays the alg, so playback is always self-consistent). An alt is valid for a case iff
   the case it sets up — invertSeq(alt) on a solved cube — is the SAME case the primary sets up,
   up to a whole-cube reorientation and a recognition AUF. We try leading AUFs to normalise, and
   keep the cleaned string. This guarantees the alt matches the displayed diagram and solves on play. */
const fs = require('fs'), vm = require('vm');
const root = 'C:/AI/RubiksCubeCoach/';
const ctx = { console }; vm.createContext(ctx);

// ---- parse the source dataset (algs + their vars) ----
const srcText = fs.readFileSync(root + '_setup/pll-src.js', 'utf8');
const algSet = new Function('var algSet;' + srcText + ';return algSet;')();
const clean = s => s.replace(/[()]/g, ' ')        // drop fingertrick parens
  .replace(/2'/g, '2')                            // X2' -> X2
  .replace(/\s+/g, ' ').trim();
const RAW = {};
algSet.cases.forEach(c => {
  if (!c.algs) return;
  const list = [];
  c.algs.forEach(a => { if (a.alg) list.push(clean(a.alg)); (a.vars || []).forEach(v => { if (v.alg) list.push(clean(v.alg)); }); });
  RAW[c.id] = list;
});

const bundle = 'const LESSONS={};' +
  ['data/notation.js', 'js/engine.js', 'data/algs.js'].map(f => fs.readFileSync(root + f, 'utf8')).join('\n') + `
  const ptype = c => { const n = Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z); return n===1?'center':n===2?'edge':'corner'; };
  const UPS = ['', 'x2', 'x', "x'", "y x'", "y' x'"], SPIN = ['', 'y', 'y2', "y'"];
  const ORIENTS = []; UPS.forEach(u => SPIN.forEach(s => ORIENTS.push((u+' '+s).trim())));
  const AUF = ['', 'U', 'U2', "U'"];
  // canonical key of a state's non-centre cubies, keyed by home
  function keyOf(st) {
    return st.cubies().filter(c => ptype(c)!=='center')
      .map(c => [c.home.x,c.home.y,c.home.z, c.pos.x,c.pos.y,c.pos.z, c.ori.join('')].join(','))
      .sort().join('|');
  }
  function setupKey(seq) {            // case that invertSeq(seq) builds from solved
    const st = makeState(); st.reset(); st.applyTokens(invertSeq(tokenize(seq))); return keyOf(st);
  }
  // set of keys for a case under all 24 whole-cube reorientations
  function orientKeys(seq) {
    const out = new Set();
    for (const o of ORIENTS) { const st = makeState(); st.reset(); st.applyTokens(invertSeq(tokenize(seq)));
      if (o) st.applyTokens(tokenize(o)); out.add(keyOf(st)); }
    return out;
  }
  // cancel/merge consecutive same-face moves (U' U -> nothing, U2 U' -> U), iterate to fixpoint
  function simplify(seq) {
    let toks = tokenize(seq);
    const base = t => t.match(/^[A-Za-z]+w?/)[0];
    const amt = t => { let q = /2/.test(t) ? 2 : 1; if (/'/.test(t)) q = (4 - q) % 4; return q; };
    for (;;) {
      const out = []; let changed = false;
      for (const t of toks) {
        if (out.length && base(out[out.length-1]) === base(t)) {
          const b = base(t), q = (amt(out[out.length-1]) + amt(t)) % 4; out.pop(); changed = true;
          if (q === 1) out.push(b); else if (q === 2) out.push(b + '2'); else if (q === 3) out.push(b + "'");
        } else out.push(t);
      }
      toks = out; if (!changed) break;
    }
    return toks.join(' ');
  }
  const PRIM = {}; ALG_SETS.pll.forEach(a => PRIM[a.name] = a.moves);
  const RAW = ${JSON.stringify(RAW)};
  const result = {};
  for (const name in PRIM) {
    const primTokKey = tokenize(PRIM[name]).join(' ');
    const target = setupKey(PRIM[name]);          // the diagram's case (canonical orientation)
    const cands = RAW[name] || [];
    const kept = [], seen = new Set([primTokKey]);
    for (const raw of cands) {
      let chosen = null;
      for (const a of AUF) {
        const cand = (a ? a + ' ' : '') + raw;
        let toks; try { toks = tokenize(cand); } catch (e) { continue; }
        // must build the same case as the primary, up to whole-cube reorientation
        let ok; try { ok = orientKeys(cand).has(target); } catch (e) { continue; }
        if (ok) { chosen = cand.replace(/\\s+/g,' ').trim(); break; }
      }
      if (!chosen) continue;
      const simp = simplify(chosen);              // cancel redundant AUF / merges
      if (!simp) continue;
      // the display cube only animates faces R/U/L/F/B/D, slices M/E/S and rotations x/y/z —
      // drop alts using lowercase wide moves (l, r, u, f, b, d, *w), which it can't render
      if (tokenize(simp).some(t => /^[lrufbd]/.test(t) || /w/.test(t))) continue;
      let stillOk; try { stillOk = orientKeys(simp).has(target); } catch (e) { continue; }
      if (!stillOk) continue;                     // simplification must preserve the case
      const tk = tokenize(simp).join(' ');
      if (seen.has(tk)) continue;                 // dedupe + skip if it collapses to the primary
      seen.add(tk); kept.push(simp);
    }
    if (kept.length) result[name] = kept.slice(0, 4);
  }
  result;`;

const ALTS = vm.runInContext(bundle, ctx, { filename: 'b.js' });

let js = `/* Alternative PLL algorithms — engine-verified to set up the same case as each primary.
   Sourced from logiqx/cubing-algs (data/pll.js). Generated by _setup/gen-pll-alts.js — do not hand-edit.
   Loaded after data/algs.js; attaches an \`alts\` array to each PLL case for the sheet's alt switcher. */
(function () {
  const ALTS = ${JSON.stringify(ALTS, null, 2)};
  if (typeof ALG_SETS === 'undefined' || !ALG_SETS.pll) return;
  ALG_SETS.pll.forEach(c => { if (ALTS[c.name] && ALTS[c.name].length) c.alts = ALTS[c.name]; });
})();
`;
fs.writeFileSync(root + 'data/pll-alts.js', js);

console.log('Wrote data/pll-alts.js');
let total = 0;
Object.keys(ALTS).forEach(k => { total += ALTS[k].length; console.log('  ' + k.padEnd(4) + ALTS[k].length + ' alts'); });
const none = Object.keys({Aa:1,Ab:1,E:1,F:1,Ga:1,Gb:1,Gc:1,Gd:1,H:1,Ja:1,Jb:1,Na:1,Nb:1,Ra:1,Rb:1,T:1,Ua:1,Ub:1,V:1,Y:1,Z:1}).filter(n => !ALTS[n]);
console.log('cases with alts:', Object.keys(ALTS).length, '/ 21   total alts:', total);
if (none.length) console.log('no alts for:', none.join(', '));
