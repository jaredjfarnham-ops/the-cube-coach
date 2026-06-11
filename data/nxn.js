/* Big cubes (4×4–7×7): Reduction method lessons, 4×4 parity, and full-solve timers.
   Concept lessons are type 'text' (explanation only). Parity is type 'algo' (plays on the real
   N×N cube). Timers are solve-only trainers. */

/* ---------- 4×4 Reduction ---------- */
LESSONS['4x4/reduction/centers'] = { type:'text', title:'4×4 Reduction — Centers',
  intro:[
    'Big cubes are solved by <b>Reduction</b>: turn the 4×4 into a “3×3” by first fixing the <b>centers</b>, then <b>pairing the edges</b>, then solving it like a normal 3×3. This first step builds the six centers.',
    'On a 4×4 each face center is a <b>2×2 block</b> of pieces, and — unlike a 3×3 — the centers can move, so <b>you</b> choose where each color goes. Keep the standard scheme: white opposite yellow, green opposite blue, red opposite orange.',
    'Build one center (say white), then its opposite (yellow), then the remaining four as a belt around the middle. Because there are no fixed centers, use the colors of the already-built faces to place the last ones correctly. This step is entirely <b>intuitive</b> — no algorithms.'
  ]};
LESSONS['4x4/reduction/edges'] = { type:'text', title:'4×4 Reduction — Edge Pairing',
  intro:[
    'Each 3×3 edge is split into <b>two “wing” pieces</b> on a 4×4. Pairing joins the matching wings so every edge behaves like a single 3×3 edge.',
    'The core idea: hold two matching wings in the front-up and front-down slots, then use a <b>slice + flip + slice-back</b> (e.g. <b>Uw</b> to bring a fresh edge up, pair it, then <b>Uw’</b> to restore the centers). Work with one or two pairs at a time so you never wreck your finished centers.',
    'A common finish is “last two edges” (L2E), where the final pairs are solved together. Edge pairing is mostly intuitive once you see how the slice moves shuttle wings around.'
  ]};
LESSONS['4x4/reduction/3x3'] = { type:'text', title:'4×4 Reduction — Solve as a 3×3',
  intro:[
    'With all centers built and all edges paired, the 4×4 is now <b>reduced</b>: treat each paired edge as one edge and each center block as one center, and solve with your normal <b>3×3 method (CFOP, etc.)</b>.',
    'Use <b>wide turns</b> (Rw, Uw…) where you would turn a face on a 3×3, so you move the paired edge + its center together and don’t split a pair.',
    'Two things can happen that never happen on a 3×3 — they’re called <b>parity</b>. If you reach the last layer and one edge looks flipped, or two edges look swapped, see the <b>4×4 Parity</b> lesson.'
  ]};
LESSONS['4x4/reduction/parity'] = { type:'algo', title:'4×4 Parity',
  intro:[
    'Because a 4×4 has no fixed centers and paired edges, you can reach two last-layer states that are <b>impossible on a 3×3</b>. Each is fixed by one algorithm. Pick a case and press <b>Play</b> to watch it on the cube.',
    '<b>OLL parity</b> — a single edge appears flipped during the last-layer orientation. <b>PLL parity</b> — two edges (or two corners/edges) appear swapped during permutation.'
  ],
  sections:[
    { head:'The two parity cases', algs:[
      { name:'OLL parity (one flipped edge)', moves:"r2 B2 U2 l U2 r' U2 r U2 F2 r F2 l' B2 r2", note:'Run this when a single last-layer edge is flipped. (r and l are wide / 2-layer turns.)' },
      { name:'PLL parity (two swapped edges)', moves:"2r2 U2 2r2 Uw2 2r2 Uw2 U2", note:'Run this when two last-layer edges need swapping — then finish with your normal PLL.' },
    ]},
  ]};

/* ---------- 5×5 / 6×6 / 7×7 Reduction (same idea, scaled) ----------
   Parity differs by cube: even cubes (6×6) have BOTH OLL and PLL parity;
   odd cubes (5×5, 7×7) have OLL parity ONLY (a single flipped dedge). */
const NXN_OLL_PARITY = "r2 B2 U2 l U2 r' U2 r U2 F2 r F2 l' B2 r2";
const NXN_PLL_PARITY = "2r2 U2 2r2 Uw2 2r2 Uw2 U2";
[['5x5','5×5','an odd cube with fixed centers'],
 ['6x6','6×6','an even cube (expect parity, like the 4×4)'],
 ['7x7','7×7','an odd cube with fixed centers']].forEach(([id,nm,note]) => {
  const even = (id==='6x6');
  LESSONS[id+'/reduction/centers'] = { type:'text', title:nm+' — Centers',
    intro:[
      `<b>Reduction</b> scales straight up to the ${nm}: solve the six centers, pair the edges, then solve as a 3×3. The ${nm} is ${note}.`,
      `Each face center is a larger block of pieces; build them with the same intuitive approach as the 4×4 (one center, its opposite, then the belt), keeping white-yellow, green-blue, red-orange opposite.`
    ]};
  LESSONS[id+'/reduction/edges'] = { type:'text', title:nm+' — Edge Pairing',
    intro:[
      `Each 3×3 edge is split into several wing/midge pieces on the ${nm}. Pair them all up — often three at a time — using slice moves to shuttle wings into place without disturbing finished centers.`,
      `On odd cubes the true center edge piece (“midge”) fixes each edge’s orientation; on the ${nm} the standard “3-2-3 / last-two-edges” techniques finish the job.`
    ]};
  LESSONS[id+'/reduction/3x3'] = { type:'text', title:nm+' — Solve as a 3×3',
    intro:[
      `Centers built and edges paired → the ${nm} is reduced. Solve it like a 3×3 with <b>wide turns</b> to keep pairs together.`,
      even
        ? 'As an <b>even</b> cube, the 6×6 can show <b>both OLL and PLL parity</b>, just like a 4×4 — fix them with the parity algorithms in the next lesson, applied to the outer two layers.'
        : `Being an <b>odd</b> cube, the ${nm} can still show <b>OLL parity</b> (a single flipped dedge) but <b>never PLL parity</b> — see the next lesson.`
    ]};
  LESSONS[id+'/reduction/parity'] = { type:'algo', title:nm+' — Parity',
    intro:[
      even
        ? `As an <b>even</b> cube the ${nm} has no fixed center alignment, so the reduced 3×3 stage can show two states impossible on a real 3×3: <b>OLL parity</b> and <b>PLL parity</b>. Each is fixed by one algorithm — pick a case and press <b>Play</b>.`
        : `As an <b>odd</b> cube the ${nm} can show <b>OLL parity only</b> — a single flipped dedge. There is <b>no PLL parity</b> on odd cubes. Press <b>Play</b> to watch the fix.`,
      '<b>OLL parity</b> — a single last-layer dedge appears flipped during orientation. ' + (even ? '<b>PLL parity</b> — two dedges appear swapped during permutation; run it, then finish with your normal PLL.' : 'Run OLL parity, then orient and permute the last layer as a normal 3×3.')
    ],
    sections:[
      { head: even ? 'The two parity cases' : 'The parity case', algs: even ? [
        { name:'OLL parity (one flipped dedge)', moves:NXN_OLL_PARITY, note:'Run this when a single last-layer dedge is flipped during OLL. (r and l are wide / 2-layer turns.)' },
        { name:'PLL parity (two swapped dedges)', moves:NXN_PLL_PARITY, note:'Run this when two last-layer dedges need swapping — then finish with your normal PLL.' },
      ] : [
        { name:'OLL parity (one flipped dedge)', moves:NXN_OLL_PARITY, note:'The only parity on an odd cube: run it when a single last-layer dedge is flipped, then finish the 3×3 normally.' },
      ]},
    ]};
});

/* ---------- Full-solve timers (4×4–7×7) ---------- */
[['4x4','4×4'],['5x5','5×5'],['6x6','6×6'],['7x7','7×7']].forEach(([id,nm]) => {
  LESSONS[id+'/timer/solve'] = { type:'trainer', solveOnly:true, puzzle:id, title:nm+' Timer',
    intro:[`A full-solve timer for the ${nm}. Apply the random scramble (it uses wide turns) to your cube, hold <b>Space</b> and release to start, then press a key to stop. Times save to your profile, with Ao5 / Ao12.`] };
});
