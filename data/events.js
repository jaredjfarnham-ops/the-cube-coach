/* ================================================================
   CHALLENGE EVENTS (OH, 3BLD, FMC, MBLD, 4BLD, 5BLD) and
   OTHER PUZZLES (Pyraminx, Megaminx, Skewb, Square-1, Clock).

   Renderable events ARE real cubes, so their how-to lessons are
   `algo` and play on the live cube using already-verified 3×3 algs
   (T-perm / Y-perm / OH PLLs pulled from ALG_SETS — no new algs to
   verify). Everything conceptual is `text`. The shaped puzzles have
   no 3-D renderer, so their methods are `text` with inline algorithm
   references, and their trainers are pure timers driven by the
   puzzle-specific scramble generators in app.js.
   Loaded AFTER algs.js (needs ALG_SETS) and BEFORE taxonomy.js.
   ================================================================ */
(function () {
  const pll = n => (ALG_SETS.pll.find(a => a.name === n) || {}).moves;   // verified 3×3 PLLs

  /* Speffz lettering diagram for 3BLD memo: a cube net with all 24
     stickers labelled A–X (clockwise-from-top-left, faces U L F R B D). */
  const bldScheme = () => {
    const C = { U:'#f5d915', L:'#e8801a', F:'#1c8c3b', R:'#c0271c', B:'#1f5fc0', D:'#eee' };
    // four stickers per face, drawn clockwise from top-left: [tl, tr, br, bl]
    const order = [[0,0],[1,0],[1,1],[0,1]];   // grid offsets matching clockwise A,B,C,D
    const faces = [
      { k:'U', col:2, row:0, letters:['A','B','C','D'] },
      { k:'L', col:0, row:1, letters:['E','F','G','H'] },
      { k:'F', col:2, row:1, letters:['I','J','K','L'] },
      { k:'R', col:4, row:1, letters:['M','N','O','P'] },
      { k:'B', col:6, row:1, letters:['Q','R','S','T'] },
      { k:'D', col:2, row:2, letters:['U','V','W','X'] },
    ];
    const s = 26, gap = 2, fs = s*2 + gap;     // sticker size / face size
    const W = 8*s + 3*gap + 4, H = 6*s + 2*gap + 4;
    let cells = '';
    faces.forEach(f => {
      const fx = 2 + f.col*s + (f.col/2)*gap, fy = 2 + f.row*(fs+gap);
      f.letters.forEach((ch, i) => {
        const x = fx + order[i][0]*s, y = fy + order[i][1]*s;
        const dark = f.k==='U';
        cells += `<rect x="${x}" y="${y}" width="${s-1}" height="${s-1}" rx="3" fill="${C[f.k]}" stroke="#222" stroke-width="1"/>`
          + `<text x="${x+s/2}" y="${y+s/2}" fill="${dark?'#222':'#fff'}" font-size="13" font-weight="700" text-anchor="middle" dominant-baseline="central">${ch}</text>`;
      });
    });
    return `<svg class="bld-scheme" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:340px;display:block;margin:8px auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Speffz lettering scheme: cube net with stickers A through X">${cells}</svg>`;
  };

  /* ============================================================
     3×3 ONE-HANDED  (a normal 3×3 — renders & scrambles as 3×3)
     ============================================================ */
  LESSONS['oh/oh/grips'] = { type:'text', title:'One-Handed — Grips & Fingertricks',
    intro:[
      'One-Handed (OH) is solved with the <b>same CFOP method</b> as two-handed — the challenge is purely execution. Most fast solvers turn with their <b>non-dominant hand</b> (a right-hander solves with the <b>left</b>), keeping the steady dominant hand free to rest the cube on a table or palm and to rotate it between turns. The cube sits in the turning hand and you lean on the table for support.',
      'Here’s the key insight beginners miss: if you keep using your normal <b>right-handed algorithms</b>, the <b>LEFT hand actually does R-moves more easily</b> than U-moves. Held in the left hand, the right face falls right under your fingers, so an RU-heavy alg flows naturally one-handed — you do <b>not</b> mirror your algs to the left, you just learn the left-hand fingertricks for them.',
      'The fingertricks for an R-handed alg in the <b>left</b> hand: <b>R and R′</b> come from the <b>ring or pinky finger</b> curling the right face; <b>U and U′</b> come from the <b>index finger</b> flicking the top layer; and <b>F′</b> (when needed) is taken by the <b>thumb</b>. The big idea is to <b>avoid regrips</b> — any time you let go and re-place fingers costs more than the turn itself — so pick algorithms that flow in one grip and use the table to rotate the cube (a “table abuse” <b>z</b> or <b>x</b>) instead of twisting it in the air.'
    ]};
  LESSONS['oh/oh/algs'] = { type:'algo', title:'One-Handed — OH-friendly Algorithms',
    intro:[
      'The single biggest OH improvement is swapping a few PLLs for <b>RU-heavy, regrip-light</b> versions. These are standard, verified algorithms that happen to flow well one-handed. Pick a case and press <b>Play</b> to watch it solve.',
      'Notice how each one stays mostly on <b>R and U</b> — the two fastest one-handed faces. Held in your <b>non-dominant (left) hand</b>, take the <b>R / R′</b> turns with the <b>ring or pinky finger</b> and the <b>U / U′</b> turns with the <b>index finger</b>; on the rare <b>F′</b> let the <b>thumb</b> do it. That lets you run each PLL without putting the cube down.'
    ],
    sections:[
      { head:'Permute the last layer (OH versions)', algs:[
        { name:'Ua perm (M-slice 3-cycle)', moves:pll('Ua'), note:'A clean edge 3-cycle. Many OH solvers do the M moves as table-supported slices.' },
        { name:'T perm', moves:pll('T'), note:'Adjacent corner + edge swap — almost entirely R and U, the OH workhorse.' },
        { name:'Jb perm', moves:pll('Jb'), note:'RU-dominant; a great first “real” PLL to learn for one hand.' },
        { name:'Y perm', moves:pll('Y'), note:'Diagonal corner swap. Use a table-assisted regrip on the F moves.' },
      ]},
    ]};
  LESSONS['oh/oh/practice'] = { type:'text', title:'One-Handed — Drills',
    intro:[
      'Improvement comes from <b>targeted drills</b>, not just full solves. Solve with your <b>non-dominant hand</b> and keep your R-handed algs — remember the left hand does <b>R / R′</b> from the <b>ring or pinky</b>, <b>U / U′</b> from the <b>index</b>, and an occasional <b>F′</b> from the <b>thumb</b>. Try these: (1) <b>Cross + first pair one-handed only</b> — slow down and eliminate every regrip; (2) <b>algorithm reps</b> — run a single RU PLL 10× in a row, drilling those exact fingertricks until they’re smooth; (3) <b>two-handed cross, OH the rest</b> to build F2L stamina without burning out your hand.',
      'A realistic first goal is simply <b>finishing</b> every solve one-handed. Speed follows smoothness — a controlled 40-second OH solve beats a frantic drop. As your F2L look-ahead improves two-handed, your OH times fall automatically.',
      'Use the <b>OH timer</b> (under this event’s Timer) for full solves; it uses standard 3×3 scrambles and saves your times with Ao5 / Ao12 so you can track progress.'
    ]};
  LESSONS['oh/timer/solve'] = { type:'trainer', solveOnly:true, puzzle:'oh', title:'One-Handed Timer',
    intro:['A full-solve timer using standard 3×3 scrambles — solve one-handed. Apply the scramble, hold <b>Space</b> and release to start, then press a key to stop. Times save to your profile with Ao5 / Ao12.'] };

  /* ============================================================
     3×3 BLINDFOLDED  (a normal 3×3 — Old Pochmann renders live)
     ============================================================ */
  LESSONS['3bld/op/memo'] = { type:'text', title:'3BLD — Memorisation & Letter Pairs',
    intro:[
      'Blindfolded solving splits into <b>memorise</b>, then <b>execute with the blindfold on</b>. The cube is never scrambled differently — you simply learn to track where pieces go without looking. <b>Old Pochmann</b> (OP) is the friendliest start: it solves <b>one piece at a time</b> with a single swap algorithm, so there is almost nothing to memorise about the method itself.',
      'Label each <b>sticker</b> with a letter (the common scheme is A–X using a Speffz-style lettering). On each face the four stickers are lettered <b>clockwise starting from the top-left</b>; the faces run U, L, F, R, B, D giving A–X. The net below shows exactly which letter sits at which position — corners and edges share the grid (a corner sticker and an edge sticker can carry the same letter; you just track them in separate cycles):',
      bldScheme(),
      'To memorise a solve you trace a <b>cycle</b>: the piece in your “buffer” spot needs to go somewhere — call out that target’s letter, then see what belongs there, and continue until the cycle closes. Edges and corners are memorised separately.',
      'Turn the letters into <b>memorable images</b>. Pair them up — “G, K” might become a word or a tiny scene — and string the images into a short story or place them along a familiar route (a “memory palace”). You only need to hold ~5–8 images for edges and a few for corners. Review the corner memo last (you execute corners last, so it’s freshest).'
    ]};
  LESSONS['3bld/op/edges'] = { type:'algo', title:'3BLD — Edges (Old Pochmann, T-perm)',
    intro:[
      'Old Pochmann edges work by <b>setup → swap → undo setup</b>, repeated once per target. The swap is a single <b>T-perm</b>, which trades the buffer edge (UR) with the edge at UL — and nothing else of importance.',
      'For each letter in your memo you do a short <b>setup move</b> to bring that target edge to the UL “swap” slot, run the <b>T-perm</b>, then <b>reverse the setup</b>. Repeat down your edge cycle. Watch the T-perm here so you can see exactly which two edges it exchanges.'
    ],
    algs:[ { name:'T perm — the edge swap', moves:pll('T'), note:'Swaps the UR (buffer) and UL edges (plus two corners that your setup/undo cancel out). Setup a target to UL, T-perm, then undo the setup. Repeat per letter.' } ]};
  LESSONS['3bld/op/corners'] = { type:'algo', title:'3BLD — Corners (Old Pochmann, Y-perm)',
    intro:[
      'Corners use the identical idea with a different swap: the <b>Y-perm</b>, which exchanges the buffer corner (UBL) with the corner at the UFR-area target — and is its own inverse, so it’s easy to learn.',
      'Per corner letter: <b>setup</b> the target into the swap slot, run the <b>Y-perm</b>, <b>undo</b> the setup. Because you execute corners after edges, keep that memo freshest. Press Play to see the Y-perm’s swap.'
    ],
    algs:[ { name:'Y perm — the corner swap', moves:pll('Y'), note:'Swaps the buffer corner with the target corner. Setup → Y-perm → undo setup, once per corner letter.' } ]};
  LESSONS['3bld/m2/m2'] = { type:'text', title:'3BLD — M2 Edges',
    intro:[
      '<b>M2</b> is the standard upgrade for edges: instead of a full T-perm per target, you shoot each edge into place with a single <b>M2</b> (and short setups), roughly halving your edge moves.',
      'The buffer is the <b>DF</b> edge. For most targets the pattern is <b>setup → M2 → undo setup</b>; a handful of special cases (the UF/UB and the buffer’s own slot) use small fixed insertions you memorise once. Because M2 is so short, execution is much faster and less error-prone than OP edges.',
      'Keep <b>Old Pochmann for corners</b> while you learn M2 edges — that combination (M2/OP) is the most popular intermediate 3BLD setup before 3-style.'
    ]};
  LESSONS['3bld/m2/corners'] = { type:'text', title:'3BLD — OP Corners (with M2)',
    intro:[
      'When you pair M2 edges with Old Pochmann corners, the corner half is <b>unchanged</b>: same buffer, same <b>Y-perm</b> swap, same setup → swap → undo rhythm described in the OP Corners lesson.',
      'The only thing to watch is <b>parity</b>: if your edge and corner cycles leave a single swap, do one extra fixed swap (commonly a <b>setup + the A/Y swap</b>) to resolve it. Practise edges and corners separately first, then combine.'
    ]};
  LESSONS['3bld/3style/comms'] = { type:'text', title:'3BLD — Commutators',
    intro:[
      '<b>3-style</b> is the advanced method: instead of one piece at a time, you solve pieces in <b>3-cycles</b> using <b>commutators</b> — sequences of the form <b>A B A′ B′</b> that move exactly three pieces and leave everything else untouched.',
      'A commutator has an <b>interchange</b> (A) and an <b>insert</b> (B): you insert a piece into a temporary slot, swap that slot away, undo the insert, and swap back. Done right it cycles three stickers and self-cancels everywhere else. The art is choosing A and B so the middle cancels cleanly (a “pure” comm) and is fast to execute.',
      'There are hundreds of cases, but you <b>derive</b> them rather than memorise — which is why 3-style scales to the lowest move-counts and fastest BLD times. Start by learning to spot the insert/interchange pair for a single corner 3-cycle.'
    ]};
  LESSONS['3bld/3style/edges'] = { type:'text', title:'3BLD — Edge 3-Style',
    intro:[
      'Edge 3-style replaces M2: each algorithm solves a <b>3-cycle of edges</b> with a commutator, averaging well under 10 moves per cycle. Buffers vary by solver; <b>UF</b> and <b>DF</b> are common.',
      'Group cases by their <b>insert</b> location and learn them in pairs (a case and its inverse). Most cases are pure commutators; a few are “cycle shifts” that need a setup move first. Build the set gradually — even mixing a few 3-style edge comms into M2 lowers your times.'
    ]};
  LESSONS['3bld/3style/corners'] = { type:'text', title:'3BLD — Corner 3-Style',
    intro:[
      'Corner 3-style is the usual <b>first</b> 3-style set people learn (fewer pieces than edges, and corners are executed last so accuracy matters most). Each case is a corner <b>commutator</b> cycling three corners.',
      'A typical buffer is <b>UBL</b>. Learn cases as insert/interchange pairs and recognise the <b>three corner-orientation types</b> (the insert changes with how the target is twisted). Once corner 3-style is solid, your corner execution becomes nearly silent and sub-second per cycle.'
    ]};
  LESSONS['3bld/timer/solve'] = { type:'trainer', solveOnly:true, puzzle:'3bld', title:'3BLD Timer',
    intro:['A full-solve timer using standard 3×3 scrambles — memorise, then solve. Apply the scramble, hold <b>Space</b> and release to start (memo + execution are timed together, WCA-style), then press a key to stop. Times save with Ao5 / Ao12.'] };

  /* ============================================================
     3×3 FEWEST MOVES  (paper/technique — text only, no timer)
     ============================================================ */
  LESSONS['fmc/fmc/blocks'] = { type:'text', title:'FMC — Blockbuilding',
    intro:[
      'Fewest Moves is the opposite of speed: you get <b>one hour</b> and pencil & paper to find the <b>shortest solution</b> to a single scramble. Solutions are written in move notation; the world’s best routinely break <b>20 moves</b>.',
      '<b>Blockbuilding</b> is the foundation. Rather than a cross + slot-by-slot F2L, you grow <b>blocks</b> (a 2×2×2, then 2×2×3) using whatever moves are most efficient, ignoring colour neutrality and rotation costs. Fewer, smarter moves beat fast familiar ones here.',
      'Plan on paper, try several starts, and keep the <b>shortest skeleton</b> you can reach toward the last layer — you’ll improve it with the techniques in the other FMC lessons.'
    ]};
  LESSONS['fmc/fmc/niss'] = { type:'text', title:'FMC — NISS',
    intro:[
      '<b>NISS</b> (Normal-Inverse Scramble Switching) is FMC’s signature trick. At any point you can <b>switch to solving the inverse scramble</b>: write your current moves down, invert the scramble, and continue from there — then merge the two halves into one solution.',
      'Why it helps: a position that’s awkward on the normal scramble is often <b>much shorter on the inverse</b>, and switching lets you attack a block-build or edge-orientation from both ends. You can switch multiple times, building a few moves on each side.',
      'NISS takes practice to track on paper, but it’s how solvers find those surprising sub-20 skeletons. Learn the bookkeeping (which moves go on which side, and how to combine) on easy scrambles first.'
    ]};
  LESSONS['fmc/fmc/insertions'] = { type:'text', title:'FMC — Insertions',
    intro:[
      'Once you have a <b>skeleton</b> that solves everything except a few corners or edges, you finish with <b>insertions</b>: you slip a commutator (a 3-cycle) into the <b>middle</b> of your solution where it cancels the most moves with the surrounding turns.',
      'You scan every position in the skeleton, try the cycle that fixes your remaining pieces, and count <b>cancellations</b> — an 8-move comm inserted at a good spot might add only 3–4 net moves. Multiple insertions (and choosing the order) can save a lot.',
      'Insertions are mechanical but powerful: a clean skeleton + a well-placed insertion is how most great FMC results are built. Practise by taking a skeleton with three unsolved corners and finding the cheapest insertion point.',
      'Practise on real scrambles in the <b>FMC Trainer</b> (under this event’s Timer): instead of a stopwatch it records your <b>solution’s move count</b>, so you can track your best and your averages over time.'
    ]};
  LESSONS['fmc/timer/solve'] = { type:'trainer', solveOnly:true, countMode:true, puzzle:'fmc', title:'FMC Trainer',
    intro:['Fewest Moves isn’t timed — it’s scored by <b>solution length</b>. Find a solution to the scramble on paper (you have the cube shown for reference), then type your <b>move count</b> (HTM) and press <b>Record</b>. Lower is better; your best and averages are saved to your profile. Use <b>DNF</b> if you don’t find a solution.'] };

  /* ============================================================
     3×3 MULTI-BLIND  (memory systems — text only, no timer)
     ============================================================ */
  LESSONS['mbld/mbld/memo'] = { type:'text', title:'Multi-BLD — Memory Systems',
    intro:[
      'Multi-Blind means memorising <b>many cubes</b>, then solving them all blindfolded in one sitting (up to a <b>one-hour</b> limit for the whole attempt). Your result counts solved minus unsolved, so <b>accuracy and durable memory</b> matter more than raw speed.',
      'The key upgrade over single BLD is <b>long-term, reviewable memory</b>. Most multi-blinders use a <b>memory palace / method of loci</b>: each cube gets its own “room” or stretch of a familiar journey, and the letter-pair images are placed along it so nothing overwrites another cube.',
      'You still trace edges and corners per cube (OP, M2/OP, or 3-style), but you encode them as <b>vivid, well-spaced images</b> you can revisit. Strong multi-blinders rehearse the first cubes again right before execution, since those have decayed the longest.'
    ]};
  LESSONS['mbld/mbld/review'] = { type:'text', title:'Multi-BLD — Review & Execution',
    intro:[
      'Execution order is usually the <b>reverse of memorisation</b>: solve the most-recently-memorised cube first (it’s freshest) and finish with the earliest, which you review one last time before donning the blindfold.',
      'Build a <b>review pass</b>: after memorising all cubes, walk your palace once more to firm up the weakest images, then execute steadily. A single mis-traced piece DNFs that cube, so <b>controlled and correct</b> beats fast.',
      'Start small — attempt <b>2 then 3 cubes</b> — and only scale up once you’re consistently getting all of them. Multi-BLD is untimed per-cube, so there’s no speed timer here; practise the underlying single-BLD execution with the 3BLD timer.'
    ]};

  /* ============================================================
     4×4 & 5×5 BLINDFOLDED  (concept — text; timers reuse the cube)
     ============================================================ */
  LESSONS['4bld/4bld/centers'] = { type:'text', title:'4BLD — Centers',
    intro:[
      '4×4 Blindfolded builds on 3BLD. The 4×4 has <b>movable centers and split “wing” edges</b>, so you memorise and solve <b>three groups</b>: centers, wings, then the reduced 3×3 corners/edges.',
      'Centers come <b>first</b>. There are 24 center stickers; you letter them like edges/corners and solve them in cycles with <b>commutators</b> (often pure 3-cycles using r/Rw slice setups). Get the centers solved blind and the cube starts behaving like a 3×3 for the rest.',
      'Because there are many pieces, 4BLD leans on <b>solid lettering and palace memory</b> — the same skills as Multi-BLD, applied to one bigger cube.'
    ]};
  LESSONS['4bld/4bld/wings'] = { type:'text', title:'4BLD — Wings',
    intro:[
      'After centers, solve the <b>wings</b> — the 24 outer edge pieces (each 3×3 edge is two wings on a 4×4). Wings are cycled with commutators much like 3-style edges, using <b>wide-layer setups</b> (r, u…) to reach targets.',
      'Wings are the most numerous group, so this is usually the <b>longest memo</b>. Many solvers use a dedicated wing buffer and a small comm set. Once centers and wings are done, the cube is <b>reduced</b> and the last group is just a 3×3 BLD solve.'
    ]};
  LESSONS['4bld/4bld/parity'] = { type:'text', title:'4BLD — 3×3 Stage & Parity',
    intro:[
      'With centers and wings solved, finish the <b>corners and (midge-less) edges as a 3×3 BLD</b> using your usual method (OP, M2/OP, or 3-style).',
      'Even cubes can leave <b>parity</b>: an odd number of swaps across wings/corners. You fix it with a single fixed <b>parity algorithm</b> (a known wing+corner swap) so the final 3×3 stage permutes cleanly. Memorise that one algorithm and apply it when your cycle counts come out odd.',
      'Use the <b>4BLD timer</b> for full attempts — it scrambles a real 4×4 and times memo + execution together.'
    ]};
  LESSONS['4bld/timer/solve'] = { type:'trainer', solveOnly:true, puzzle:'4bld', title:'4BLD Timer',
    intro:['A full-solve timer using standard 4×4 scrambles — memorise, then solve blindfolded. Apply the scramble, hold <b>Space</b> and release to start, then press a key to stop. Times save with Ao5 / Ao12.'] };

  LESSONS['5bld/5bld/centers'] = { type:'text', title:'5BLD — Centers',
    intro:[
      '5×5 Blindfolded is the <b>largest WCA blind event</b>. The 5×5 has <b>fixed centers</b> but two kinds of movable center pieces — <b>“+ centers”</b> (the four next to each fixed center) and <b>“x centers”</b> (the four diagonal ones) — solved as two separate groups, each by commutators.',
      'Letter and memorise the + and x centers like any other group and cycle them with slice-setup comms. Because there are <b>so many pieces</b>, 5BLD memo is long; reviewable palace memory and clean lettering are essential.'
    ]};
  LESSONS['5bld/5bld/wings'] = { type:'text', title:'5BLD — Wings',
    intro:[
      'As on the 4×4, the outer edge pieces are <b>wings</b> (two per 3×3 edge) and are solved with <b>commutators</b> using wide-layer setups. This is typically the bulkiest memo group on the 5×5.',
      'Keep a consistent wing buffer and comm set. Once + centers, x centers and wings are done, only the <b>midges</b> and corners remain — and those finish as a 3×3 BLD.'
    ]};
  LESSONS['5bld/5bld/midges'] = { type:'text', title:'5BLD — Midges & 3×3 Finish',
    intro:[
      'The <b>midges</b> are the true center edge pieces of each 5×5 edge (the ones with a fixed orientation reference). With centers and wings solved, you solve midges + corners as a <b>standard 3×3 BLD</b>.',
      'Being an <b>odd</b> cube, the 5×5 has <b>no parity</b> to fix at the end — once everything is reduced it permutes like a clean 3×3. Use the <b>5BLD timer</b> for full attempts (real 5×5 scrambles, memo + execution timed together).'
    ]};
  LESSONS['5bld/timer/solve'] = { type:'trainer', solveOnly:true, puzzle:'5bld', title:'5BLD Timer',
    intro:['A full-solve timer using standard 5×5 scrambles — memorise, then solve blindfolded. Apply the scramble, hold <b>Space</b> and release to start, then press a key to stop. Times save with Ao5 / Ao12.'] };

  /* ============================================================
     OTHER PUZZLES — no 3-D renderer, so text + inline alg refs.
     `algRef` helper renders a tidy name → moves list inside text.
     ============================================================ */
  const ref = rows => '<div class="alg-ref">' +
    rows.map(r => `<div class="alg-ref-row"><span class="arn">${r[0]}</span><code>${r[1]}</code></div>`).join('') +
    '</div>';

  /* ---------------- Pyraminx ---------------- */
  LESSONS['pyra/lbl/tips'] = { type:'text', title:'Pyraminx — Tips & Centers',
    intro:[
      'The Pyraminx is a tetrahedron. Its four corner <b>“tips”</b> rotate independently and are <b>trivial</b> — each tip just needs to match the three center pieces around its corner, so you can solve all four tips in seconds at any time.',
      'Below the tips are the <b>center (axial) pieces</b>, which always stay grouped at each corner. Orienting the four corner-trios so each face is heading toward one colour is the first real step. Notation is <b>U, L, R, B</b> for the big layers and lowercase <b>u, l, r, b</b> for the tips.',
      'Solve order in the beginner method: fix the <b>centers/tips of one corner</b>, build a <b>first layer</b>, then handle the <b>last layer edges</b>. With only ~4 cases to learn, Pyraminx is the fastest WCA event to pick up.'
    ]};
  LESSONS['pyra/lbl/l1'] = { type:'text', title:'Pyraminx — First Layer',
    intro:[
      'Pick a bottom colour and build one <b>face + its three edges</b> intuitively. First put the three <b>center</b> pieces of that corner in place (just rotating the axial layers), then insert the three <b>edges</b> so the bottom face and its three sides are complete.',
      'Inserting an edge uses a simple <b>right-hand trigger</b>: position the edge in the top, then <b>R U R′</b>-style moves drop it into the bottom layer. This is the same idea as a 3×3 F2L pair, but easier — there are no corners to worry about.',
      'After the first layer, only the <b>three top edges</b> remain. That’s the Last Layer step.'
    ]};
  LESSONS['pyra/lbl/ll'] = { type:'text', title:'Pyraminx — Last Layer',
    intro:[
      'With the first layer done, only the <b>three last-layer edges</b> can be wrong — a tiny case set. Hold the solved layer on the bottom; the top edges are either <b>cycled</b> (need rotating) and/or <b>flipped</b>.',
      'These algorithms are <b>engine-verified</b> — each one is generated and checked by the simulator to solve its last-layer case while leaving the first layer intact. Click one to set up its case on the puzzle below and watch it solve (add a <b>U</b> first to line your case up):',
      ref([
        ['Last-layer case 1', "L B U B' U' L'"],
        ['Last-layer case 2', "R U L U' L' R'"],
        ['Last-layer case 3', "B R U R' U' B'"],
        ['Last-layer case 4', "L U B U' B' L'"],
        ['Last-layer case 5', "R L U L' U' R'"],
        ['Last-layer case 6', "B U R U' R' B'"],
        ['Last-layer case 7', "L U' B U' B' U L'"],
        ['Last-layer case 8', "L U' B U B' U L'"],
        ['Last-layer case 9', "R U' L U L' U R'"],
      ]),
      'Pick the case that matches your top, AUF (a <b>U</b> turn) to line it up, apply it, then solve the four tips. That’s a complete Pyraminx.'
    ]};
  LESSONS['pyra/l4e/setup'] = { type:'text', title:'Pyraminx — Keyhole Setup',
    intro:[
      'Intermediate Pyraminx uses <b>Keyhole / L4E (Last Four Edges)</b>. Instead of finishing a full first layer, you solve the <b>centers and three of the four “bottom” edges</b>, deliberately leaving one slot open as a <b>“keyhole.”</b>',
      'That empty slot lets you place a top edge into the bottom layer (using the keyhole) <b>without an algorithm</b>, setting up a position where only <b>four edges</b> remain. Build the centers + a partial layer, keeping one slot free.'
    ]};
  LESSONS['pyra/l4e/l4e'] = { type:'text', title:'Pyraminx — Last 4 Edges (L4E)',
    intro:[
      'L4E solves the <b>final four edges in one step</b> — the keyhole slot plus the three top edges. There are a handful of cases recognised by how those four edges are cycled and flipped.',
      'Common L4E building blocks (hold the solved corner at <b>U</b>). Each of these is a <b>3-edge cycle</b> — the workhorses of L4E — not a flip-only case:',
      ref([
        ['Keyhole insert (3-edge cycle)', "R U' R'"],
        ['Top 3-edge cycle (CW)', "R U R' U R U R'"],
        ['Top 3-edge cycle (CCW)', "R U' R' U' R U' R'"],
        ['3-edge cycle w/ lower slot', "U R U' R' U R U' R'"],
      ]),
      'The two <b>R U R′…</b> triggers are inverses of each other: one cycles the three top edges clockwise, the other counter-clockwise (AUF with a <b>U</b> to aim). Chain a couple of these 3-cycles to place all four edges. L4E removes the separate last-layer step, cutting move count and time. It’s the standard bridge toward advanced methods like <b>OKA</b> and <b>one-flip</b>.'
    ]};
  /* ---------------- Pyraminx — FP (Face-Permuting) advanced method ---------------- */
  LESSONS['pyra/fp/face'] = { type:'text', title:'Pyraminx — FP: Make a Face',
    intro:[
      '<b>FP (Face-Permuting</b>, a.k.a. <b>Fan’s Pyraminx)</b> is the <b>Ortega of Pyraminx</b>: build one face, then permute everything in a single algorithm. It’s an advanced, low-move method that pairs naturally with the L4E recognition you already know.',
      '<b>Step 1 — make one full face.</b> Pick any colour and get all of that face one solid colour. The pieces do <b>not</b> need to be permuted correctly — only the colour of that one face matters. This is intuitive and short (about <b>3–7 moves</b>); solve the four tips whenever it’s convenient.',
      'Then hold that made face <b>down</b> and move to Step 2 (Permute). Because you don’t commit to a solved first layer, FP keeps move count low and lookahead easy.'
    ]};
  LESSONS['pyra/fp/permute'] = { type:'text', title:'Pyraminx — FP: Permute Everything',
    intro:[
      'With one face made and held <b>down</b>, a single algorithm permutes the rest. <b>Recognise by the bottom first</b> — how the three edges of your made face are arranged — then match the top. <b>Click any case to watch it solve on the puzzle.</b>',
      'These algorithms are <b>engine-generated and verified</b> (optimal solutions found by exhaustive search), and they’re <b>mirror-folded</b>: if your case is the mirror image, do the mirror of the algorithm (swap L↔R and reverse).',
      '<b>Solved bottom</b> — the three bottom edges are already in place; only the top needs permuting:',
      ref([
        ['Solved bottom — A', "L B U B' U' L'"],
        ['Solved bottom — B', "L U' L' U' L U' L'"],
        ['Solved bottom — C', "L U' B U' B' U L'"],
      ]),
      '<b>Adjacent-swap bottom</b> — two bottom edges are swapped:',
      ref([
        ['Adjacent — A', "L R U R' U L'"],
        ['Adjacent — B', "L R' U R U L'"],
        ['Adjacent — C', "R L' R' B L' B' L'"],
        ['Adjacent — D', "R L' R' B L' B' L' U'"],
        ['Adjacent — E', "R B U' L B' R' U' L'"],
        ['Adjacent — F', "B R U' B' L R' U L'"],
        ['Adjacent — G', "L R U' L U' L' R' L'"],
      ]),
      '<b>3-cycle bottom</b> — the three bottom edges are cycled:',
      ref([
        ['3-cycle — A', "L R' U R' U' R' L'"],
        ['3-cycle — B', "B R B' L U' R' U' L'"],
        ['3-cycle — C', "L' B' R B L' R' U' L'"],
        ['3-cycle — D', "L' B' R L' B R' U' L'"],
        ['3-cycle — E', "R' L R' B' U' B R' L'"],
        ['3-cycle — F', "B R B' R L U' R L'"],
      ]),
      '16 cases cover the whole step (up to grip rotation, top AUF and mirror). Drill recognition: glance at the bottom edges to pick the group, then the top to pick the case. With one-face-make + one alg + tips, FP is a strong sub-12 method.'
    ]};
  LESSONS['pyra/timer/solve'] = { type:'trainer', solveOnly:true, puzzle:'pyra', title:'Pyraminx Timer',
    intro:['A full-solve timer with random Pyraminx scrambles (U L R B + tips). Solve on your own puzzle, hold <b>Space</b> and release to start, then press a key to stop. Times save with Ao5 / Ao12.'] };

  /* ---------------- Megaminx ---------------- */
  LESSONS['mega/lbl/star'] = { type:'text', title:'Megaminx — The Gray Star',
    intro:[
      'The Megaminx is a 12-sided dodecahedron — essentially a “3×3 with more faces.” Each face is a pentagon with a fixed center, five edges and five corners. It’s solved <b>layer by layer</b>, and your 3×3 instincts transfer directly.',
      'Begin with a <b>star</b>: on one face (traditionally the gray/white center) place all <b>five edges</b> so each matches its center and its side colour — the Megaminx version of the cross. This is intuitive, just slower because there are five edges instead of four.',
      'Notation is mostly <b>R, D, U</b> with the special big turns <b>R++ / R-- / D++ / D--</b> used in scrambles (a 72° double-layer turn). For solving you’ll mainly use ordinary <b>R, U</b> and <b>F</b> style moves on individual faces.'
    ]};
  LESSONS['mega/lbl/layers'] = { type:'text', title:'Megaminx — Building Layers',
    intro:[
      'After the star, complete the <b>first face and first layer</b> (its corners), then keep adding layers around the puzzle exactly like 3×3 F2L: pair a <b>corner + edge</b> and insert them with <b>R U R′</b>-type triggers.',
      'Work face by face around the bottom and middle. Because there are so many slots, efficiency and look-ahead matter — but there’s no new theory, just more of the same intuitive pairing. Keep going until only the <b>last layer</b> (the top face) is unsolved.',
      'The final layer is solved in two stages — orient, then permute — just like the 3×3 Last Layer.'
    ]};
  LESSONS['mega/lbl/ll'] = { type:'text', title:'Megaminx — Last Layer',
    intro:[
      'The Megaminx last layer mirrors 3×3 <b>2-look</b>: first <b>orient</b> the last-layer edges then corners (make the top one colour), then <b>permute</b>. Your 3×3 OLL/PLL algorithms work directly because the pieces behave the same.',
      'Edge orientation uses the familiar <b>F (R U R′ U′) F′</b> family; corner orientation uses <b>Sune</b> repeated. Useful last-layer algorithms:',
      ref([
        ['Orient edges (F-trigger)', "F R U R' U' F'"],
        ['Orient corners (Sune)', "R U R' U R U2 R'"],
        ['Permute corners (3-cycle)', "R' F R' B2 R F' R' B2 R2"],
        ['Permute edges (U-perm)', "R U' R U R U R U' R' U' R2"],
      ]),
      'Because a pentagon has five pieces, you may repeat an orient/permute step with a different <b>AUF</b> (U-turn) to handle the extra positions — but no new algorithms are required to finish.'
    ]};
  LESSONS['mega/ll/2loll'] = { type:'text', title:'Megaminx — 2-Look OLL (Orient)',
    intro:[
      'The Megaminx last layer follows the same <b>plan</b> as a 3×3 — first <b>orient</b> the top so the whole face is one colour (OLL), then <b>permute</b> the pieces into place (PLL). The top face just has <b>five</b> corners and <b>five</b> edges instead of four.',
      '<b>Important — 3×3 algorithms do NOT transfer literally.</b> A Megaminx face turns <b>72°</b> (a fifth), not 90°, so a borrowed cube algorithm like <i>R U R′ U R U2 R′</i> leaves your already-solved lower layers disturbed (you can verify this on the simulator). Even the notation differs: on Megaminx <b>U2 ≠ U2′</b> — <b>U2</b> is two fifths (144°) and <b>U2′</b> is three fifths (216°). Megaminx therefore has its <b>own</b> last-layer algorithm set, almost all of it built from <b>commutators</b>.',
      '<b>2-Look OLL</b> orients in two steps:',
      '• <b>Orient the edges</b> first — flip the last-layer edges so all five show the top colour (intuitive edge-flip commutators, repeated with a <b>U</b> between).',
      '• <b>Orient the corners</b> — twist the corners until the top is solid, again with a U adjustment between cases.',
      'The orient-then-permute idea and the recognition are exactly the 3×3 skills; only the specific turn sequences are Megaminx-native. A fully engine-verified Megaminx OLL set is being built — for now, practise the recognition here and orient with short commutators.'
    ]};
  LESSONS['mega/ll/2lpll'] = { type:'text', title:'Megaminx — 2-Look PLL (Permute)',
    intro:[
      'With the top one colour, <b>permute</b> the pieces home. Permutation on Megaminx is done with <b>3-cycles</b>: an algorithm rotates three last-layer pieces and leaves the rest untouched, and you repeat it (with a <b>U</b> setup) to walk all five pieces into place — corners first, then edges.',
      'These are <b>engine-verified Megaminx last-layer algorithms</b> — each is generated and checked by the simulator to solve its case while leaving every solved lower layer intact (literal 3×3 PLLs do NOT, because a 72° face has no 180° turn). They’re commutators of the form <b>F R F′</b> + a top turn + restore. Click one to set up its case below and watch it solve:',
      ref([
        ['Permutation case 1', "R F U F' U' R'"],
        ['Permutation case 2', "R F U2 F' U2' R'"],
        ['Permutation case 3', "R U F U' F' R'"],
        ['Permutation case 4', "R U2 F U2' F' R'"],
        ['Permutation case 5', "F' R' U' R U F"],
        ['Permutation case 6', "F' R' U2' R U2 F"],
        ['Permutation case 7', "F' U' R' U R F"],
        ['Permutation case 8', "F' U2' R' U2 R F"],
        ['Permutation case 9', "R U2' F U' F' U2 R'"],
        ['Permutation case 10', "R U2' F U F' U2 R'"],
        ['Permutation case 11', "F' U2 R' U' R U2' F"],
        ['Permutation case 12', "F' U2 R' U R U2' F"],
      ]),
      'AUF (a <b>U</b> turn) to aim a cycle at the three pieces you want, run it, and repeat until the layer is permuted. This is the verified <b>permutation</b> set; the orientation (twist/flip) cases need their own commutators — a planned addition.',
      '<b>Why not 3×3 PLL?</b> Cube PLLs use 180° moves (R2, U2 = half turns) that don’t exist on a 72° puzzle, so they scramble the lower layers — which is exactly what the simulator shows if you try one.'
    ]};
  LESSONS['mega/ll/1look'] = { type:'text', title:'Megaminx — Toward 1-Look',
    intro:[
      '<b>1-Look</b> means orienting in a <b>single</b> algorithm and permuting in a <b>single</b> algorithm — recognising the whole top at once. It is the advanced goal that fast Megaminx times are built on.',
      'Scope check: because each face has <b>five</b> corners and <b>five</b> edges, the <b>full</b> Megaminx orientation and permutation sets are far larger than the 3×3’s 57 OLL / 21 PLL. There is no shortcut list — top solvers learn the cases gradually as commutators and their combinations, so treat 1-look as a long horizon you grow into from a fast, confident 2-look.',
      '<b>How to grow into it.</b> (1) Make 2-look orientation and permutation automatic. (2) Build a personal library of <b>commutators</b> — every clean 3-cycle, twist and flip you can verify on the simulator is a tool. (3) Start merging the most common orient-then-permute pairs into one algorithm. The recognition is the same skill as 3×3; the algorithm set is Megaminx’s own.',
      'Honest note: a complete, engine-verified Megaminx 1-look set is a substantial build (hundreds of cases). This trainer ships the verified building blocks and the recognition; the full named set is a planned addition.'
    ]};
  LESSONS['mega/timer/solve'] = { type:'trainer', solveOnly:true, puzzle:'mega', title:'Megaminx Timer',
    intro:['A full-solve timer with standard Megaminx scrambles (7 lines of R±± / D±± then U). Solve on your own puzzle, hold <b>Space</b> and release to start, then press a key to stop. Times save with Ao5 / Ao12.'] };

  /* ---------------- Skewb ---------------- */
  LESSONS['skewb/sarah/face'] = { type:'text', title:'Skewb — First Face (Sarah’s Beginner)',
    intro:[
      'The Skewb turns on its <b>corners</b>: each move rotates half the puzzle around a diagonal axis. Despite looking strange it’s solved with very few algorithms. Notation is <b>R, L, U, B</b> — each a 120° twist of a corner region (so <b>R2 = R′</b>).',
      'Step 1 is <b>intuitive</b>: solve one entire <b>face</b>, including the four center triangles around it and the face’s colour. Because Skewb pieces come in two types (4 centers + 4 corners that move together in tetrad sets), building one face takes only a few thoughtful turns — no algorithm.',
      'Hold that completed face on the <b>bottom</b> for the next steps.'
    ]};
  LESSONS['skewb/sarah/layer'] = { type:'text', title:'Skewb — The Layer',
    intro:[
      'With the bottom face built, finish the <b>bottom layer</b> by placing the remaining <b>centers</b> around the sides so each side center matches its neighbours. In Sarah’s Beginner this is the step that sets up a clean last layer.',
      'This is still largely intuitive — small <b>R / L / U</b> adjustments rotate centers into place without breaking the bottom. Once the bottom layer’s centers agree, only the <b>top</b> remains.'
    ]};
  LESSONS['skewb/sarah/ll'] = { type:'text', title:'Skewb — Last Layer',
    intro:[
      'The Skewb last layer is <b>two distinct steps</b>: first <b>orient the top corners</b> (make the top face one colour), then <b>permute the top centers</b> (put the four side/top centers on their correct faces). New solvers often forget the second step — after the corners are oriented the four <b>top centers can still be swapped</b>, and you fix that with a short center-swap algorithm. With the solved face on the bottom, these finish the puzzle:',
      ref([
        ['Orient corners — 2 twisted (Sune-like)', "R U R' U R U2 R'"],
        ['Orient corners — pinwheel / 4-twist', "R' L R L' R' L R L'"],
        ['Center swap — adjacent 2-swap', "R L' R' L"],
        ['Center swap — opposite / 3-cycle (repeat)', "R L' R' L R L' R' L"],
      ]),
      'The <b>R L′ R′ L</b> family is the center-swapping engine: one repetition does an <b>adjacent 2-swap</b> of top centers, and repeating it cycles them — keep applying it (with a <b>U</b> to aim) until all four top centers sit on the right face. Orient the corners first, then permute the centers, and the Skewb is solved. Sarah’s Beginner needs only these handful of algorithms.'
    ]};
  LESSONS['skewb/sarahadv/fl'] = { type:'text', title:'Skewb — Face + Layer (Sarah’s Advanced)',
    intro:[
      'Sarah’s <b>Advanced</b> keeps the same first steps — build a <b>face and the surrounding layer</b> — but you do it more efficiently and, crucially, you <b>predict the last-layer case</b> as you finish, so you go straight into a one-look finish.',
      'The goal is to set the bottom up so the top falls into a single <b>CLL</b> case (next lesson). Practise building face + layer while watching where the top corners and centers end up.'
    ]};
  LESSONS['skewb/sarahadv/cll'] = { type:'text', title:'Skewb — CLL (one-look last layer)',
    intro:[
      'Skewb <b>CLL</b> solves all the last-layer <b>corners</b> (both orientation and permutation) in <b>one algorithm</b> once the bottom layer is done. There are a small number of corner cases and good solvers learn them all for instant finishes.',
      'A few representative CLL algorithms (solved face on the bottom):',
      ref([
        ['Corners solved (skip)', "—"],
        ['Sune case', "R U R' U R U2 R'"],
        ['Anti-Sune case', "R U2 R' U' R U' R'"],
        ['Pinwheel (4 corners twisted)', "L' R L' R' L' R L' R'"],
      ]),
      'CLL solves the corners — but it does <b>not</b> guarantee the centers. After your CLL alg the <b>four top centers may still need permuting</b>, so an advanced solve is CLL + a center swap. Recognise the center case while inspecting and finish with the <b>R L′ R′ L</b> family — one repetition is an adjacent 2-swap, repeated it cycles three top centers:',
      ref([
        ['Center swap — adjacent 2-swap', "R L' R' L"],
        ['Center 3-cycle (repeat the trigger)', "R L' R' L R L' R' L"],
      ]),
      'CLL turns the beginner corner finish into a single look; pairing it with the center swap above is the full one-look-plus-centers finish that competitive Skewb is built on.'
    ]};
  LESSONS['skewb/timer/solve'] = { type:'trainer', solveOnly:true, puzzle:'skewb', title:'Skewb Timer',
    intro:['A full-solve timer with random Skewb scrambles (R L U B). Solve on your own puzzle, hold <b>Space</b> and release to start, then press a key to stop. Times save with Ao5 / Ao12.'] };

  /* ---------------- Square-1 (animates on the SVG simulator) ---------------- */
  LESSONS['sq1/vandenbergh/shape'] = { type:'algo', sim:'sq1', title:'Square-1 — Cube Shape',
    intro:[
      'Square-1 changes <b>shape</b> as it turns, so the first job is to get it back to a <b>cube</b>. The top and bottom layers hold wide “corner” pieces (60°) and narrow “edge” pieces (30°); scrambling makes stars, kites and other shapes — the wedge view below shows exactly which slots hold which.',
      'Notation is <b>(top, bottom)</b> twists with a slash <b>/</b>: <b>(1,0)</b> turns the top layer one 30° notch, <b>(0,-1)</b> the bottom, and <b>/</b> flips the right half over (swapping those pieces between layers). Pick a sequence and press <b>Play</b> to watch it on the simulator.',
      'Cubeshape itself is intuitive — you count pieces to aim for 6 in each layer alternating corner/edge — but seeing the slash and turns is the fastest way to understand it.'
    ],
    sections:[{ head:'Watch the moves', algs:[
      { name:'Slash — the core move', moves:"/", note:'One slash flips the right half: the three right-side slots of the top and bottom swap. Everything on Square-1 is built from this.' },
      { name:'Turn, then slash', moves:"(3,0) / (0,3) /", note:'Rotating a layer before slashing changes which pieces cross over — this is how you reshape toward a cube.' },
      { name:'Reshape sequence', moves:"(1,0) / (0,-1) / (-1,0) / (0,1) /", note:'A short shape-changing sequence. In a real solve you choose the turns by counting pieces.' },
    ]}]};
  LESSONS['sq1/vandenbergh/ce'] = { type:'algo', sim:'sq1', title:'Square-1 — Corners & Edges',
    intro:[
      'With a cube shape, the Vandenbergh method <b>separates corners from edges</b> so each layer has its corners grouped and its edges grouped, then permutes them. A common order is corners first, then edges.',
      'These steps are short <b>(x,y)/</b> sequences: line a piece up with a setup turn, run a swap or cycle, then undo. Press <b>Play</b> to see each on the simulator.'
    ],
    sections:[{ head:'Separation / permutation moves', algs:[
      { name:'Adjacent corner swap (top)', moves:"(1,0) / (-1,-1) / (0,1)", note:'Swaps two adjacent top corners — the workhorse for grouping corners.' },
      { name:'Edge shuffle (top)', moves:"(0,-1) / (0,1) /", note:'Moves top edges around; combine with setups to gather the edges together.' },
    ]}]};
  LESSONS['sq1/vandenbergh/parity'] = { type:'algo', sim:'sq1', title:'Square-1 — Parity',
    intro:[
      'Square-1 can reach a state where two pieces are <b>swapped</b> in a way ordinary turns can’t fix — its famous <b>parity</b>, caused by the two layers flipping relative to each other.',
      'It’s resolved with one long fixed <b>parity algorithm</b> that swaps a single pair while preserving the rest. Press <b>Play</b> to watch it run.'
    ],
    sections:[{ head:'Parity fix', algs:[
      { name:'Edge parity (adjacent swap)', moves:"/ (1,0) / (-1,0) / (0,3) / (0,-3) / (1,0) / (-1,0) /", note:'Recognise parity when exactly two last-layer pieces are swapped; run this, then finish normally.' },
    ]}]};
  LESSONS['sq1/vandenbergh/ll'] = { type:'algo', sim:'sq1', title:'Square-1 — Last Layer',
    intro:[
      'The Square-1 last layer <b>permutes the top and bottom layers</b> once corners and edges are separated — like PLL, a fixed set recognised by which pieces are out of place. Learn it in two looks (corners, then edges) before going one-look.',
      'Add a <b>(top,0)</b> twist to line up before each case. Press <b>Play</b> to perform each sequence on the simulator.'
    ],
    sections:[{ head:'Permutation cases', algs:[
      { name:'Adjacent corner swap (top)', moves:"(1,0) / (-1,-1) / (0,1)" },
      { name:'Opposite corner swap', moves:"/ (3,0) / (3,0) / (3,0) /" },
      { name:'Edge 3-cycle', moves:"(0,-1) / (0,1) / (0,-1) / (0,1)" },
    ]}]};
  LESSONS['sq1/timer/solve'] = { type:'trainer', solveOnly:true, puzzle:'sq1', title:'Square-1 Timer',
    intro:['A full-solve timer with random Square-1 scrambles in <b>(top,bottom)/</b> notation. Solve on your own puzzle, hold <b>Space</b> and release to start, then press a key to stop. Times save with Ao5 / Ao12.'] };

  /* ---------------- Clock ---------------- */
  LESSONS['clock/standard/pins'] = { type:'text', title:'Clock — Pins & Wheels',
    intro:[
      'Clock is unlike every other WCA puzzle: <b>no algorithms, no memorisation</b>, just setting <b>pins</b> and turning <b>wheels</b> until all 14 clock faces (9 front, 9 back) point to 12.',
      'The puzzle has <b>four pins</b> (up/down) and you turn the gear wheels at each corner. A raised pin <b>couples</b> the clocks it touches so they move together; a lowered pin <b>decouples</b> them. By choosing which pins are up and turning a wheel, you move a chosen group of clocks by a set amount.',
      'Scramble notation lists each pin position and an amount, e.g. <b>UR5+</b> (top-right region 5 hours clockwise), then a <b>y2</b> flip to do the back, and finally which pins end up. You don’t reproduce the scramble — you just understand that wheels move groups of clocks.'
    ]};
  LESSONS['clock/standard/solve'] = { type:'text', title:'Clock — Beginner Full Solve',
    intro:[
      'The simplest reliable method solves the <b>front</b>, then the <b>back</b>, fixing one row/column of clocks at a time. With all four pins up you can set the four corner clocks; changing pins lets you correct the edges and center without disturbing what’s done.',
      'A common beginner sequence: solve the <b>top row</b>, then the <b>bottom row</b>, then the <b>middle</b>, flipping to the back and repeating. Because every move is reversible and visible, you can always see your progress — there’s nothing to memorise, just careful pin management.',
      'Once comfortable, you’ll naturally start setting <b>multiple clocks per turn</b>, which is exactly what the advanced 7-Simul method formalises.'
    ]};
  LESSONS['clock/7simul/concept'] = { type:'text', title:'Clock — 7-Simul: How It Works',
    intro:[
      '<b>7-Simul</b> is the world-record Clock method, and at heart it’s simple. <b>Every</b> move you make is the same action: choose which of the four <b>pins are UP</b>, then turn <b>one wheel</b> by a number of hours. The pins decide which <b>group</b> of dials that wheel drags along. A <b>raised</b> pin couples the front and back only at that <b>corner</b> (a corner turn moves both faces there); to reach the <b>back edges</b> you <b>lower</b> the matching front pins. Solving both faces at once is the “simul”, and it’s why you never flip the puzzle.',
      'Learn what each pin pattern turns — this is the whole vocabulary:<br><b>UL / UR / DL / DR</b> (one corner pin) — turns that corner’s <b>2×2 block</b> of four dials.<br><b>U / D</b> (top or bottom pair of pins) — turns the whole <b>top / bottom band</b> of six dials.<br><b>L / R</b> (left or right pair) — turns the <b>left / right band</b> of six.<br><b>ALL</b> (all four pins) — turns <b>all nine</b> dials together.',
      'Second, learn to <b>read the clock as numbers</b>: for each dial, count how many hours <b>clockwise</b> it must move to reach 12 (a dial on 9 needs <b>+3</b>; on 3 needs <b>+9</b>). Note all 14. You haven’t touched the puzzle yet — this is inspection.',
      'The complete solve is just nine moves — one for each pin pattern: <b>UR DR DL UL U R D L ALL</b> — each turned by an amount you work out from the numbers you read. (You don’t reverse or replay the scramble: in a real solve you’re handed the scrambled puzzle, never the scramble — and it’s longer and flips the cube anyway. You read the 14 dials and compute the nine turns that take them all to 12.) <b>7-Simul’s edge</b> is that you compute <b>every amount during the 15-second inspection</b>, then (reading the back dials through the puzzle) execute the whole thing in one non-stop, flip-free burst — skilled solvers merge the nine into as few as <b>seven</b> turns.'
    ]};
  LESSONS['clock/7simul/pairs'] = { type:'text', title:'Clock — Executing the Solve',
    intro:[
      'Here is the actual procedure. Hold the clock front-toward-you and work in two stages: <b>corners first, then edges &amp; centre</b>.',
      '<b>Stage 1 — the four corners.</b> Each corner dial is reached by exactly one single-pin state: top-left by <b>UL</b>, top-right by <b>UR</b>, bottom-left by <b>DL</b>, bottom-right by <b>DR</b>. For each: put that one pin up, turn its wheel until the corner dial reads <b>12</b>, move on. These four <b>don’t interfere</b> — fixing one corner never moves another — so you can solve all four corners <b>greedily</b>, just turning each until it’s straight up.',
      '<b>Stage 2 — the four edges and the centre.</b> This is the catch that defines the method: every move that reaches an edge (<b>U, D, L, R, ALL</b>) <b>also nudges a corner you already fixed</b>. So you can’t keep turning greedily — instead you pick amounts that fix the edges <b>and re-correct</b> the corners those moves disturb, all together. Working out those compensating amounts is the inspection arithmetic; it becomes a few quick sums (for instance, the <b>ALL</b> turn is just the alternating total of the dials: <i>c1 − c2 + c3 − c4 …</i>).',
      'So the loop you execute is: <b>(1)</b> set this step’s pins, <b>(2)</b> turn its wheel by the planned amount, <b>(3)</b> go straight to the next step — no pauses, no flips. <b>Practise in three layers:</b> first just read every dial’s number fast; then drill the four corner turns until they’re automatic; finally learn the edge/centre amounts so the whole solve flows as one sequence. Pull real scrambles on the <b>Clock timer</b> to rehearse.'
    ]};
  LESSONS['clock/7simul/flip'] = { type:'text', title:'Clock — The Flip Variant',
    intro:[
      'True 7-Simul reads the <b>back dials through the puzzle</b> and never flips — fast, but judging dials through the plastic takes practice. The <b>Flip variant</b> trades a little speed for far easier reading: solve everything on the front, then do a single <b>y2</b> to turn the puzzle over and finish the back as a fresh front.',
      'Concretely: run your corner and edge turns for the front, then <b>flip (y2)</b>. What was the back now faces you, so you read and solve it with the <b>same pin patterns and turns you already know</b> — no through-the-puzzle guessing. One flip, two clean halves, identical move vocabulary.',
      'Decide during inspection: if the back is easy to read or the numbers come out clean, go <b>flip-free</b> for speed; otherwise plan the <b>y2</b>. <b>Beginners should start with the Flip variant</b> — same method, comfortable reading — then drop the flip as back-reading improves. The moves and the amount-arithmetic you drilled don’t change either way.'
    ]};
  LESSONS['clock/timer/solve'] = { type:'trainer', solveOnly:true, puzzle:'clock', title:'Clock Timer',
    intro:['A full-solve timer with standard Clock scrambles (pin amounts, a y2, then pin states). Solve on your own puzzle, hold <b>Space</b> and release to start, then press a key to stop. Times save with Ao5 / Ao12.'] };
})();
