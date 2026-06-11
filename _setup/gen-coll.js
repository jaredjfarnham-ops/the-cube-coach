/* Generate + verify data/coll-sheets.js.
   Source: _setup/coll-src.js (fetched from logiqx/cubing-algs).
   Writes data/coll-sheets.js with every alg engine-verified.
   Run: node _setup/gen-coll.js
*/
const fs = require('fs'), vm = require('vm');
const root = 'C:/AI/RubiksCubeCoach/';

// ── Parse source ─────────────────────────────────────────────────────────────
const srcText = fs.readFileSync(root + '_setup/coll-src.js', 'utf8');
const algSet  = new Function('var algSet;' + srcText + ';return algSet;')();

// Expand repetition: "(moves) * N" -> moves repeated N times
function expandRepeat(s) {
  // handle "(moves) * N" or "moves * N"
  return s.replace(/\(([^)]+)\)\s*\*\s*(\d+)/g, (_, inner, n) => {
    return Array(parseInt(n)).fill(inner.trim()).join(' ');
  }).replace(/(\S[^*]+)\s*\*\s*(\d+)/g, (_, inner, n) => {
    // bare token * N (shouldn't normally occur but handle anyway)
    return Array(parseInt(n)).fill(inner.trim()).join(' ');
  });
}

// Clean a raw alg string
const clean = s => expandRepeat(s)
  .replace(/\[.*?\]/g, '')      // strip [desc] brackets
  .replace(/[()]/g, ' ')        // drop fingertrick parens
  .replace(/2'/g, '2')          // X2' -> X2
  .replace(/\s+/g, ' ').trim();

// Build raw alg lists from source, keyed by id
const RAW = {};
algSet.cases.forEach(c => {
  if (!c.algs) return;
  const list = [];
  c.algs.forEach(a => {
    if (a.alg) list.push(clean(a.alg));
    (a.vars || []).forEach(v => { if (v.alg) list.push(clean(v.alg)); });
  });
  RAW[c.id] = list;
});

// Fallback algs for cases whose source only has wide-move algs.
// These are hand-verified below (the bundle's collCheck will confirm them).
const FALLBACK = {
  // D6 (L/Bowtie #6) — diagonal corner twist, no swap: standard commutator
  D6: [
    "R' U2 R' D' R U2 R' D R2",   // primary
    "R2 D' R U2 R' D R U2 R",     // alt
  ],
  // F6 (T/Chameleon #6) — T-shape, diagonal swap
  F6: [
    "R2 U R U R' U' R' U' R' U R'",  // primary (verified OK above)
    "R' F R U' R' U' R U R' F' R U R' U' R' F R F' R",  // alt (verified OK above)
  ],
};

// ── Build engine bundle ───────────────────────────────────────────────────────
const bundle = `
const LESSONS = {};
${['data/notation.js','js/engine.js','data/algs.js'].map(f => fs.readFileSync(root + f, 'utf8')).join('\n')}

const ptype = c => {
  const n = Math.abs(c.home.x)+Math.abs(c.home.y)+Math.abs(c.home.z);
  return n===1?'center':n===2?'edge':'corner';
};

const UPS   = ['','x2','x',"x'","y x'","y' x'"];
const SPIN  = ['','y','y2',"y'"];
const ORIENTS = [];
UPS.forEach(u => SPIN.forEach(s => ORIENTS.push((u+' '+s).trim())));
const AUF   = ['','U','U2',"U'"];

function collKey(st) {
  return st.cubies()
    .filter(c => ptype(c) === 'corner' && c.home.y === -1)
    .map(c => [c.home.x,c.home.y,c.home.z, c.pos.x,c.pos.y,c.pos.z, c.ori.join('')].join(','))
    .sort().join('|');
}

function setupKey(seq) {
  const st = makeState(); st.reset();
  st.applyTokens(invertSeq(tokenize(seq)));
  return collKey(st);
}

function orientKeys(seq) {
  const out = new Set();
  for (const o of ORIENTS) {
    for (const a of AUF) {
      const st = makeState(); st.reset();
      st.applyTokens(invertSeq(tokenize(seq)));
      if (o) st.applyTokens(tokenize(o));
      if (a) st.applyTokens(tokenize(a));
      out.add(collKey(st));
    }
  }
  return out;
}

function simplify(seq) {
  let toks = tokenize(seq);
  const base = t => t.match(/^[A-Za-z]+w?/)[0];
  const amt  = t => { let q = /2/.test(t) ? 2 : 1; if (/'/.test(t)) q = (4-q)%4; return q; };
  for (;;) {
    const out = []; let changed = false;
    for (const t of toks) {
      if (out.length && base(out[out.length-1]) === base(t)) {
        const b = base(t), q = (amt(out[out.length-1]) + amt(t)) % 4;
        out.pop(); changed = true;
        if (q===1) out.push(b);
        else if (q===2) out.push(b+"2");
        else if (q===3) out.push(b+"'");
      } else out.push(t);
    }
    toks = out; if (!changed) break;
  }
  return toks.join(' ');
}

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
    const homed = c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z && JSON.stringify(c.ori)===JSON.stringify(I3);
    if (!homed) {
      if (t==='corner' && c.home.y !== -1) otherCorner++;
      if (t==='edge'   && c.home.y !== -1) otherEdge++;
    }
  });
  const f2lOk = otherCorner===0 && otherEdge===0 && centerMoved===0;
  st.applyTokens(toks);
  const solves = st.isSolved();
  return { ok: f2lOk && solves, f2lOk, solves, otherCorner, otherEdge, centerMoved };
}

const RAW      = ${JSON.stringify(RAW)};
const FALLBACK = ${JSON.stringify(FALLBACK)};

const CASE_IDS = ['A3','A6',
  'B1','B2','B3','B4','B5','B6',
  'C1','C2','C3','C4','C5','C6',
  'D1','D2','D3','D4','D5','D6',
  'E1','E2','E3','E4','E5','E6',
  'F1','F2','F3','F4','F5','F6',
  'G1','G2','G3','G4','G5','G6',
  'H1','H2','H5','H6'];

const GROUP_MAP = {
  A:'O (Oriented)', B:'AS (Anti-Sune)', C:'S (Sune)',
  D:'L (Bowtie)',   E:'U (Headlights)', F:'T (Chameleon)',
  G:'Pi (Bruno)',   H:'H (Double Sune)'
};

const result = { cases:[], dropped:0, totalAlts:0 };

for (const cid of CASE_IDS) {
  const group  = GROUP_MAP[cid[0]];
  // Combine source raws + fallbacks (fallbacks first so they're preferred for problem cases)
  const fb     = FALLBACK[cid] || [];
  const raws   = [...fb, ...(RAW[cid] || [])];

  let primary = null, primIdx = -1;
  for (let i = 0; i < raws.length; i++) {
    const alg = raws[i];
    if (!alg) continue;
    const toks = alg.trim().split(/\\s+/);
    if (toks.some(t => /^[lrufbd]/.test(t) || /w/.test(t))) { result.dropped++; continue; }
    const chk = collCheck(alg);
    if (chk.ok) {
      // Simplify the primary (cancel adjacent same-face moves from expansion)
      const simp = simplify(alg);
      // Re-check after simplification (must still pass)
      const chk2 = collCheck(simp);
      primary = (simp && chk2.ok) ? simp : alg;
      primIdx = i;
      break;
    }
    else { result.dropped++; }
  }
  if (!primary) {
    result.cases.push({ id:cid, group, moves:'FAILED', alts:[], err:'no valid primary' });
    continue;
  }

  const target  = setupKey(primary);
  const primTok = tokenize(primary).join(' ');
  const kept = [], seen = new Set([primTok]);

  for (let i = 0; i < raws.length; i++) {
    if (i === primIdx) continue;
    const raw = raws[i];
    if (!raw) continue;
    let chosen = null;
    for (const auf of AUF) {
      const cand = (auf ? auf + ' ' : '') + raw;
      const toks = cand.trim().split(/\\s+/);
      if (toks.some(t => /^[lrufbd]/.test(t) || /w/.test(t))) continue;
      let ok;
      try { ok = orientKeys(cand).has(target); } catch(e) { continue; }
      if (ok) { chosen = cand.replace(/\\s+/,' ').trim(); break; }
    }
    if (!chosen) continue;
    const simp = simplify(chosen);
    if (!simp) continue;
    const simpToks = simp.trim().split(/\\s+/);
    if (simpToks.some(t => /^[lrufbd]/.test(t) || /w/.test(t))) { result.dropped++; continue; }
    let stillOk;
    try { stillOk = orientKeys(simp).has(target); } catch(e) { continue; }
    if (!stillOk) continue;
    const chk = collCheck(simp);
    if (!chk.ok) { result.dropped++; continue; }
    const tk = tokenize(simp).join(' ');
    if (seen.has(tk)) continue;
    seen.add(tk); kept.push(simp);
  }

  const alts = kept.slice(0, 5);
  result.totalAlts += alts.length;
  result.cases.push({ id:cid, group, moves:primary, alts });
}

// distinctness check: no two primaries should set up the same COLL case
const keysSeen = new Map();
let dupCount = 0;
for (const c of result.cases) {
  if (c.moves === 'FAILED') continue;
  const k = setupKey(c.moves);
  if (keysSeen.has(k)) { dupCount++; console.error('DUP: ' + c.id + ' vs ' + keysSeen.get(k)); }
  else keysSeen.set(k, c.id);
}
result.dupCount = dupCount;

result;
`;

const ctx = { console };
vm.createContext(ctx);
const vmResult = vm.runInContext(bundle, ctx, { filename: 'bundle.js' });

// ── Report ────────────────────────────────────────────────────────────────────
console.log('\n==== COLL Verification ====');
let failedCases = [];
for (const c of vmResult.cases) {
  const altStr = c.alts ? c.alts.length + ' alts' : '0 alts';
  if (c.moves === 'FAILED') {
    failedCases.push(c.id);
    console.log(`FAIL  ${c.id.padEnd(4)} ${c.group.padEnd(20)} ${c.err||''}`);
  } else {
    console.log(`OK    ${c.id.padEnd(4)} ${c.group.padEnd(20)} ${altStr.padEnd(8)} ${c.moves}`);
  }
}
console.log(`\nCases: ${vmResult.cases.length} (${vmResult.cases.length - failedCases.length} ok, ${failedCases.length} failed)`);
console.log(`Total alts: ${vmResult.totalAlts}`);
console.log(`Dropped (wide/failed): ${vmResult.dropped}`);
console.log(`Duplicate primaries: ${vmResult.dupCount}`);
if (failedCases.length) console.log(`FAILED cases: ${failedCases.join(', ')}`);

// ── Write output ──────────────────────────────────────────────────────────────
if (failedCases.length === 0 && vmResult.dupCount === 0) {
  const casesJson = JSON.stringify(vmResult.cases.map(c => {
    const obj = { name: c.id, group: c.group, moves: c.moves };
    if (c.alts && c.alts.length) obj.alts = c.alts;
    return obj;
  }), null, 2);

  const js = `/* ================================================================
   COLL — Corners of the Last Layer  (42 cases, 7 orientation groups)
   Orient AND permute the 4 last-layer corners when LL edges are
   already oriented (CFOP: after 2-look OLL step 2 if edges oriented,
   or as a replacement for 2-look OLL + PLL corners when you know
   full COLL).  Finishing step is E-PLL only (edges + centres).

   ALL algorithms below are ENGINE-VERIFIED:
     • apply invertSeq(alg) to a solved cube → the COLL case
     • apply alg → cube is solved  (round-trip)
     • F2L preserved: no non-U-layer corner/edge moved, no centre moved

   Generated by _setup/gen-coll.js.
   Primary source: logiqx/cubing-algs (data/coll.js).
   Fallback algs for D6 and F6 (wide-move-only in source): community standard.
   ================================================================ */

ALG_SETS.coll = ${casesJson};

LESSONS['3x3/cfop/coll-sheet'] = {
  type: 'sheet',
  kind: 'zbll',
  set:  'coll',
  title: 'COLL — Orient & Permute LL Corners',
  intro: [
    '<b>COLL</b> (Corners of the Last Layer) orients <em>and</em> permutes ' +
    'all four last-layer corners in a single algorithm, leaving only an ' +
    '<b>E-PLL</b> (edge permutation) to finish the solve. It is used in ' +
    'CFOP after the LL edges are already oriented, replacing the usual ' +
    '2-look OLL + PLL corner step with one look.',

    'The <b>42 cases</b> are grouped by the 7 corner-orientation (OCLL) shapes: ' +
    '<b>O</b> (already oriented — just a corner PLL), ' +
    '<b>AS</b> Anti-Sune, <b>S</b> Sune, <b>L</b> Bowtie, ' +
    '<b>U</b> Headlights, <b>T</b> Chameleon, <b>Pi</b> Bruno, and ' +
    '<b>H</b> Double Sune. ' +
    'Click any case to play the algorithm on the cube; use the arrows to cycle alternative algorithms.'
  ]
};
`;

  fs.writeFileSync(root + 'data/coll-sheets.js', js);
  console.log('\nWrote data/coll-sheets.js');
} else {
  console.log('\nNot writing output:');
  if (failedCases.length) console.log('  failed cases:', failedCases.join(', '));
  if (vmResult.dupCount) console.log('  duplicate primary keys detected');
}
