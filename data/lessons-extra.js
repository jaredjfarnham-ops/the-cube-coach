/* Additional lessons: 3×3 CFOP (Cross, F2L) + Beginner 2×2.
   Registered into the shared LESSONS object (defined in lessons.js). */

/* ---------------- 3×3 CFOP — Cross ---------------- */
LESSONS['3x3/cfop/cross'] = { type:'algo', title:'CFOP — The Cross',
  intro:[
    'CFOP starts the same way the beginner method does: a <b>cross</b> on one face, with each cross edge’s side color matching its center. The difference is you build it <b>faster and on the bottom</b>, planning it during inspection so you never have to look underneath.',
    'The cross is <b>intuitive</b> — there’s no algorithm to memorize. The goal is to do it in <b>8 moves or fewer</b>. Watch the demo to see an edge dropping into place, then practice solving the cross without turning the cube over.',
    'Pro tip: solve the cross on the <b>bottom</b> (yellow on top once you flip), so your first F2L pairs are already in view.'
  ],
  algs:[ { name:'Drop an edge into the cross', moves:"F2", note:'When a cross edge sits on top lined up with its center, a 180° turn drops it straight down. Plan all four during inspection.' } ]};

/* ---------------- 3×3 CFOP — F2L ---------------- */
LESSONS['3x3/cfop/f2l'] = { type:'algo', title:'F2L — First Two Layers',
  intro:[
    'After the cross, <b>F2L</b> solves the first two layers together by inserting four <b>corner+edge pairs</b> into the bottom slots. It replaces the beginner method’s separate “first layer corners” and “middle edges” steps — and it’s where most of your time savings come from.',
    'F2L is mostly <b>intuitive</b>: you <b>join</b> the corner and its edge into a pair in the top layer, then <b>insert</b> the pair into its slot. There are 41 named cases in total, but you only need a handful of ideas — the rest you’ll learn to see. Always keep the pair’s slot empty and avoid disturbing your other pairs.',
    'Below are the core cases. Pick one to load it, then <b>Play</b> to watch the pair go in.'
  ],
  sections:[
    { head:'Pair already made — just insert', algs:[
      { name:'Pair on the right', moves:"U R U' R'", note:'Corner+edge already joined at the top-right. Line it up over the slot and insert.' },
      { name:'Pair on the front', moves:"U' F' U F", note:'Mirror of the above, inserting over the front-left slot.' },
    ]},
    { head:'Make the pair, then insert', algs:[
      { name:'Corner up, edge in top (split)', moves:"U' R U R' U2 R U' R'", note:'Separate the pieces, pair them with the right finger trick, then insert.' },
      { name:'Edge ready, corner needs joining', moves:"U R U2 R' U R U' R'", note:'A common “make-a-pair” case — a couple of triggers join and insert.' },
      { name:'Corner in slot, twisted', moves:"R U' R' U R U' R'", note:'A wrongly-seated corner: pull it out, re-pair, and reinsert.' },
    ]},
  ]};

/* ---------------- Beginner 2×2 — First Layer ---------------- */
LESSONS['2x2/beginner/fl'] = { type:'algo', title:'2×2 — First Layer',
  intro:[
    'A 2×2 is just the <b>corners</b> of a 3×3 — no edges, no centers. So solving it is solving 8 corners, and your 3×3 skills carry straight over.',
    'Start by building one full face <b>with matching sides</b> (e.g. all white on top and the side stickers of those corners agreeing). This is <b>intuitive</b>: place three corners easily, then insert the last with the <b>sexy move R U R′ U′</b> — position the corner under its spot and repeat until it seats.',
    'The demo plays the sexy move (shown on a 3×3 so you can see the corner travel — only the corners matter on a 2×2).'
  ],
  algs:[ { name:'Insert the last corner', moves:"R U R' U'", note:'Place the corner below where it belongs, then repeat R U R′ U′ until it’s in correctly (1, 3, or 5 times).' } ]};

/* ---------------- Beginner 2×2 — Last Layer ---------------- */
LESSONS['2x2/beginner/ll'] = { type:'algo', title:'2×2 — Last Layer',
  intro:[
    'With the first face done, finish the top in two steps — exactly like the 3×3 beginner last layer, but corners only.',
    '<b>1) Orient:</b> make the whole top one color using <b>Sune</b> (R U R′ U R U2 R′), repeating until every top sticker matches.',
    '<b>2) Permute:</b> with the top oriented, cycle the corners into place with the <b>corner 3-cycle</b> until the sides are solid.',
    'Try both — each one scrambles itself and then solves when you press Play.'
  ],
  sections:[
    { head:'Step 1 — Orient the top', algs:[ { name:'Sune', moves:"R U R' U R U2 R'", note:'Repeat until the whole top face is one color.' } ]},
    { head:'Step 2 — Permute the corners', algs:[ { name:'Corner 3-cycle (A-perm)', moves:"R' F R' B2 R F' R' B2 R2", note:'Cycles three corners without disturbing the solved top color. Hold a solved pair at the back; repeat until all four corners match their sides.' } ]},
  ]};

/* ---------------- 2×2 Ortega (Varasano) ---------------- */
LESSONS['2x2/ortega/face'] = { type:'algo', title:'2×2 Ortega — Build a Face',
  intro:[
    'Ortega is a fast intermediate 2×2 method in three steps: build any <b>face</b>, <b>orient</b> the opposite layer, then <b>permute both layers</b> at once.',
    'Step 1 is <b>intuitive</b>: build one full face (all four stickers the same color). You do <b>not</b> need the side colors to match yet — PBL fixes that at the end. Try to plan it during inspection.'
  ],
  algs:[ { name:'Insert a corner', moves:"R U R' U'", note:'Place a corner under its spot and repeat until the face is built. The sides need not match yet.' } ]};

LESSONS['2x2/ortega/oll'] = { type:'algo', title:'2×2 Ortega — OLL',
  intro:['Step 2: flip to the empty face and make its whole top one color. These are the same 7 corner-orientation cases as 3×3 OLL — pick the one that matches your top.'],
  sections:[
    { head:'Orient the last face (7 cases)', algs:[
      { name:'Sune', moves:"R U R' U R U2 R'" }, { name:'Anti-Sune', moves:"R U2 R' U' R U' R'" },
      { name:'Pi', moves:"R U2 R2 U' R2 U' R2 U2 R" }, { name:'H', moves:"R U R' U R U' R' U R U2 R'" },
      { name:'T', moves:"R U R' U' R' F R F'" }, { name:'U', moves:"R2 D R' U2 R D' R' U2 R'" },
      { name:'L', moves:"F R' F' R U R U' R'" },
    ]},
  ]};

LESSONS['2x2/ortega/pbl'] = { type:'algo', title:'2×2 Ortega — PBL',
  intro:['Step 3: <b>Permute Both Layers</b>. Both faces are oriented; now swap the corners into place. Add a U turn (AUF) to line up whatever the algorithm doesn’t.'],
  sections:[
    { head:'Permute both layers', algs:[
      { name:'Top adjacent swap · bottom solved', moves:"R U' R F2 R' U R'" },
      { name:'Top diagonal swap · bottom solved', moves:"F R U' R' U' R U R' F' R U R' U' R' F R F'" },
      { name:'Adjacent / Adjacent', moves:"R2 U' B2 U2 R2 U' R2" },
      { name:'Diagonal / Diagonal', moves:"R2 F2 R2" },
    ]},
  ]};

/* ---------------- 2×2 Timer (full solve) ---------------- */
LESSONS['2x2/timer/solve'] = { type:'trainer', solveOnly:true, puzzle:'2x2', title:'2×2 Timer',
  intro:['A full-solve timer for the 2×2. Apply the random scramble to your cube, hold <b>Space</b> and release to start, then press any key to stop. Your times are saved to your profile.'] };
