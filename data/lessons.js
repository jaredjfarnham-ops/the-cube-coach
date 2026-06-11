/* Tutorial lessons (Fundamentals + Beginner method + 2-Look OLL/PLL). */
const LESSONS = {
  '3x3/fund/anatomy': { type:'anatomy', title:'Cube Anatomy',
    intro:[
      'A 3×3 isn’t 27 loose stickers — it’s a rigid frame of <b>pieces</b> that can only move in fixed ways. Understanding the three piece types is the key that makes every later step make sense.',
      'There are exactly three kinds of piece. Use the buttons under the cube to light each kind up.',
      '<b>Centers (6):</b> one sticker each, fixed to the inner core. They spin in place but never change neighbours — white is always opposite yellow, blue opposite green, red opposite orange. A center’s color <i>defines</i> the color of its whole face.',
      '<b>Edges (12):</b> two stickers each. Each lives in the gap between two centers (e.g. the white-red edge).',
      '<b>Corners (8):</b> three stickers each, sitting at the eight corners (e.g. the white-red-green corner).',
      '<b>The big idea:</b> because the centers are locked in place, “solving the cube” really means shuffling the 12 edges and 8 corners around those fixed centers until every piece is home.'
    ]},
  '3x3/fund/fingers': { type:'algo', title:'Finger Tricks',
    intro:[
      'Fast cubing isn’t fast <i>arm</i> movement — it’s <b>finger tricks</b>: flicking single layers with a finger or thumb so your hands barely move and never have to re-grip.',
      '<b>Pushes:</b> your index or middle finger pushes a face (U, R, L). <b>Flicks:</b> a thumb or finger snaps a layer the other way (U′, R′).',
      'The most important pattern to drill is the <b>“sexy move”</b>: <b>R&nbsp;U&nbsp;R′&nbsp;U′</b>. It appears constantly. Watch it play, then try to do it with only your fingers — right hand flicks R, left thumb flicks U.',
      'A second essential trigger is the <b>“sledgehammer”</b>: <b>R′&nbsp;F&nbsp;R&nbsp;F′</b>.',
      '<b>Practice tips:</b> turn smoothly rather than forcefully, keep a light grip, and learn these triggers as single motions instead of four separate turns.'
    ],
    algs:[
      { name:'Sexy move', moves:['R','U',"R'","U'"], note:'The single most common trigger in all of cubing. Repeated 6 times it returns to solved.' },
      { name:'Sledgehammer', moves:["R'",'F','R',"F'"], note:'The other workhorse trigger — used all over F2L and last-layer algorithms.' },
    ]},
  '3x3/beginner/cross': { type:'algo', title:'Step 1 — The White Cross',
    intro:[
      'Goal: a white plus-sign on one face, with each white edge’s <b>side</b> color matching its neighbouring center. This step is mostly <b>intuitive</b> — you don’t memorize it, you learn to see it.',
      'A friendly way in is the <b>“daisy”</b>: first gather the four white edges around the <i>yellow</i> center so they look like flower petals, lining each one up with the center of its other color. Then turn each petal down with a <b>180° turn (F2, R2, …)</b> to drop it straight into the cross.',
      'Play the demo: a white edge is sitting up top, and <b>F2</b> drops it neatly into place. Mentally, repeat that idea four times — one per edge.'
    ],
    algs:[ { name:'Drop a petal into the cross', moves:['F','F'], note:'With a white edge on top lined up over its matching center, F2 sends it straight down into the cross.' } ]},
  '3x3/beginner/fl': { type:'algo', title:'Step 2 — First Layer Corners',
    intro:[
      'Goal: finish the first (white) layer by dropping in its four white corners.',
      'Find a white corner in the top layer and position it <b>directly above the slot it belongs in</b> (between its two matching side colors). Then repeat the <b>sexy move R U R′ U′</b> until the corner drops in correctly — it always takes <b>1, 3, or 5</b> repetitions.',
      'Press Play to watch one sexy move; if the corner isn’t in yet, you’d simply do it again.'
    ],
    algs:[ { name:'Insert a corner (R U R′ U′)', moves:['R','U',"R'","U'"], note:'Place the white corner above its slot, then repeat R U R′ U′ until it seats correctly (1, 3, or 5 times).' } ]},
  '3x3/beginner/ml': { type:'algo', title:'Step 3 — Middle Layer Edges',
    intro:[
      'Flip the cube so the solved white layer is on the <b>bottom</b>. Now place the four middle-layer edges (the ones with <b>no yellow</b>).',
      'Find a top edge with no yellow, turn U until its front color matches the center below it (forming an upside-down T), then send it <b>left</b> or <b>right</b> with the matching algorithm.',
      'Try both demos — they’re mirror images of each other.'
    ],
    algs:[
      { name:'Insert to the RIGHT', moves:['U','R',"U'","R'","U'","F'",'U','F'], note:'Use when the edge needs to go into the slot on your right.' },
      { name:'Insert to the LEFT',  moves:["U'","L'",'U','L','U','F',"U'","F'"], note:'The mirror: use when the edge belongs in the slot on your left.' },
    ]},
  '3x3/beginner/yc': { type:'algo', title:'Step 4 — The Yellow Cross',
    intro:[
      'Now work on the last (yellow) layer. First make a yellow <b>cross</b> on top using one repeated algorithm: <b>F R U R′ U′ F′</b>.',
      'It walks through the stages <b>dot → L-shape → line → cross</b>. Hold the L-shape in the back-left, or the line horizontally, then apply the algorithm; repeat until the cross appears.',
      'Press Play to watch it form the cross.'
    ],
    algs:[ { name:'Cross algorithm (F R U R′ U′ F′)', moves:['F','R','U',"R'","U'","F'"], note:'Repeat until the yellow cross appears: dot → L → line → cross.' } ]},
  '3x3/beginner/oll': { type:'algo', title:'Step 5 — Orient the Last Layer',
    intro:[
      'Goal: make the entire top face yellow (the corners may be in the wrong spots — that’s fine, the next step fixes that).',
      'Use <b>Sune: R U R′ U R U2 R′</b>. Hold the cube so a correctly-oriented corner (or the right pattern) sits front-left, apply Sune, and repeat until the whole top is yellow.',
      'Press Play to watch one Sune.'
    ],
    algs:[ { name:'Sune (R U R′ U R U2 R′)', moves:['R','U',"R'",'U','R','U2',"R'"], note:'Orients the last-layer corners. Re-apply, repositioning between, until the top is all yellow.' } ]},
  '3x3/beginner/pll': { type:'algo', title:'Step 6 — Permute the Last Layer',
    intro:[
      'The top is all yellow — now slide the last pieces into their correct positions to finish the cube.',
      'First cycle the <b>corners</b> into place with the <b>A-perm</b> (R′ F R′ B2 R F′ R′ B2 R2) — it moves three corners <i>without</i> disturbing the top color. Repeat until all four corners are home (keep a solved corner at the back-right). Then cycle the <b>edges</b> with a U-perm to finish.',
      'Try both demos — each one scrambles itself and then solves.'
    ],
    algs:[
      { name:'Cycle 3 corners (A-perm)', moves:"R' F R' B2 R F' R' B2 R2", note:'Cycles three last-layer corners while keeping them oriented; repeat until every corner is home.' },
      { name:'Cycle 3 edges (U-perm)', moves:['R',"U'",'R','U','R','U','R',"U'","R'","U'",'R2'], note:'Cycles three edges to finish the solve.' },
    ]},

  '3x3/cfop/2loll': { type:'algo', title:'2-Look OLL',
    intro:[
      'Full OLL is 57 algorithms. <b>2-Look OLL</b> gets the same all-yellow top with only about <b>10</b>, by splitting it into two looks: first orient the <b>edges</b> (make the cross), then orient the <b>corners</b>.',
      'This is the natural step up from the beginner method — you already know the cross algorithm and Sune; this fills in the rest of the cases so you’re not repeating one algorithm several times.',
      'Pick a case to load it onto the cube, then <b>Play</b> to watch it solve.'
    ],
    sections:[
      { head:'Look 1 — Orient the edges (yellow cross)', algs:[
        { name:'Dot', moves:"F R U R' U' F' f R U R' U' f'", note:'No edges oriented yet. Two short algorithms back-to-back turn the dot into a full cross.' },
        { name:'L-shape', moves:"f R U R' U' f'", note:'Two oriented edges forming an L — hold the L pointing to the top-left.' },
        { name:'Line', moves:"F R U R' U' F'", note:'Two oriented edges in a line — hold it horizontally.' },
      ]},
      { head:'Look 2 — Orient the corners (all yellow up)', algs:[
        { name:'Sune', moves:"R U R' U R U2 R'", note:'The cornerstone case — one corner already points up.' },
        { name:'Anti-Sune', moves:"R U2 R' U' R U' R'", note:'The mirror of Sune.' },
        { name:'Pi (Bruno)', moves:"R U2 R2 U' R2 U' R2 U2 R", note:'Two adjacent corners point up.' },
        { name:'H (Double Sune)', moves:"R U R' U R U' R' U R U2 R'", note:'No corners point up — the symmetric “H” case.' },
        { name:'T', moves:"r U R' U' r' F R F'", note:'The T case (uses a wide r turn).' },
        { name:'U (Headlights)', moves:"R2 D R' U2 R D' R' U2 R'", note:'Two corners point up at the front — like headlights.' },
        { name:'L (Bowtie)', moves:"F R' F' r U R U' r'", note:'The bowtie / L case.' },
      ]},
    ]},

  '3x3/cfop/2lpll': { type:'algo', title:'2-Look PLL',
    intro:[
      'Full PLL is 21 algorithms. <b>2-Look PLL</b> finishes the cube with only about <b>6</b>: first put the <b>corners</b> in place, then cycle the <b>edges</b>.',
      'Solve the corners first (you can tell they’re right when each pair of side colors matches — “headlights”). Add a U turn (AUF) to line things up, then handle the edges.',
      'Pick a case, then <b>Play</b> to watch it solve.'
    ],
    sections:[
      { head:'Look 1 — Permute the corners', algs:[
        { name:'Adjacent swap (A-perm)', moves:"R' F R' B2 R F' R' B2 R2", note:'A 3-corner cycle that keeps the top oriented. Hold a solved pair (matching “headlights”) at the back, then repeat until all corners are placed.' },
        { name:'Diagonal swap (Y-perm)', moves:"F R U' R' U' R U R' F' R U R' U' R' F R F'", note:'Swaps two corners that sit diagonally — the case the 3-cycle can’t fix in one go.' },
      ]},
      { head:'Look 2 — Permute the edges', algs:[
        { name:'Ua-perm', moves:"R U' R U R U R U' R' U' R2", note:'Cycles three edges counter-clockwise.' },
        { name:'Ub-perm', moves:"R2 U R U R' U' R' U' R' U R'", note:'Cycles three edges clockwise — the mirror of Ua.' },
        { name:'H-perm', moves:"M2 U M2 U2 M2 U M2", note:'Swaps both pairs of opposite edges.' },
        { name:'Z-perm', moves:"M2 U M2 U M' U2 M2 U2 M'", note:'Swaps both pairs of adjacent edges.' },
      ]},
    ]},
};
