/* ================================================================
   PUZZLES — the menu/taxonomy. Covers all 17 WCA events.
   Items whose path is in LESSONS render real content; others show a
   "coming soon" placeholder. (Loaded after lessons.js + algs.js.)
   ================================================================ */
const PUZZLES = [
  { id:'3x3', name:'3×3  (Rubik’s Cube)', art:'cube3', methods:[
      { id:'fund', name:'Fundamentals', blurb:'The basics every method is built on.',
        items:[
          { id:'notation', name:'Turn Notation', view:'notation', desc:'Read and perform every move.' },
          { id:'anatomy',  name:'Cube Anatomy', desc:'Centers, edges and corners.' },
          { id:'fingers',  name:'Finger Tricks', desc:'Efficient triggers for fast turning.' },
        ]},
      { id:'beginner', name:'Beginner — Layer by Layer', blurb:'The friendliest first solve, ~7 short algorithms.',
        items:[
          { id:'cross', name:'Step 1 — White Cross' }, { id:'fl', name:'Step 2 — First Layer Corners' },
          { id:'ml', name:'Step 3 — Middle Layer Edges' }, { id:'yc', name:'Step 4 — Yellow Cross' },
          { id:'oll', name:'Step 5 — Orient Last Layer' }, { id:'pll', name:'Step 6 — Permute Last Layer' },
        ]},
      { id:'cfop', name:'CFOP (Fridrich)', blurb:'The most popular speedsolving method: Cross, F2L, OLL, PLL.',
        items:[
          { id:'cross', name:'Cross' },
          { id:'f2l', name:'F2L Trainer', desc:'Pair and insert corner+edge pieces.' },
          { id:'2loll', name:'2-Look OLL' }, { id:'2lpll', name:'2-Look PLL' },
          { id:'oll-sheet', name:'OLL — Algorithm Sheet' },
          { id:'ocll-sheet', name:'OCLL — Orient LL Corners' },
          { id:'pll-sheet', name:'PLL — Algorithm Sheet' },
        ]},
      { id:'roux', name:'Roux', blurb:'Block-building, low move count, few algorithms.',
        items:[ {id:'fb',name:'First Block'}, {id:'sb',name:'Second Block'}, {id:'cmll',name:'CMLL'}, {id:'cmll-sheet',name:'CMLL — Algorithm Sheet'}, {id:'lse',name:'LSE — Last Six Edges'} ]},
      { id:'zz', name:'ZZ', blurb:'Orient all edges first for rotationless solves.',
        items:[ {id:'eoline',name:'EOLine'}, {id:'zzf2l',name:'ZZ-F2L'}, {id:'ocll',name:'OCLL + PLL'}, {id:'zbll',name:'ZBLL'} ]},
      { id:'petrus', name:'Petrus', blurb:'Minimise moves by growing a 2×2×2 block.',
        items:[ {id:'b1',name:'2×2×2 Block'}, {id:'b2',name:'2×2×3 Block'}, {id:'eo',name:'Edge Orientation'}, {id:'fin',name:'Finish'} ]},
      { id:'timer', name:'Timer', blurb:'One timer with modes: Full solve, F2L, OLL, PLL (and 2-look) — each with Ao5 / Ao12.',
        items:[ {id:'solve',name:'3×3 Timer'} ]},
    ]},
  { id:'oh', name:'3×3 One-Handed', art:'hand', methods:[
      { id:'oh', name:'One-Handed Technique', blurb:'CFOP optimised for one hand: regrip-light fingertricks, OH-friendly algorithms, and which moves to avoid.',
        items:[ {id:'grips',name:'Grips & Fingertricks'}, {id:'algs',name:'OH-friendly Algs'}, {id:'practice',name:'Drills'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with standard 3×3 scrambles — solve one-handed; times saved to your profile.', items:[ {id:'solve',name:'One-Handed Timer'} ]},
    ]},
  { id:'2x2', name:'2×2  (Pocket Cube)', art:'cube2', methods:[
      { id:'beginner', name:'Beginner (Layer by Layer)', blurb:'One face, then the last layer.', items:[ {id:'fl',name:'First Layer'}, {id:'ll',name:'Last Layer'} ]},
      { id:'ortega', name:'Ortega (Varasano)', blurb:'Any face, orient, then permute both layers.', items:[ {id:'face',name:'Build a Face'}, {id:'oll',name:'OLL (orient)'}, {id:'pbl',name:'PBL (permute)'}, {id:'ortega-sheet',name:'Ortega — Algorithm Sheet'} ]},
      { id:'cll', name:'CLL', blurb:'First layer, then the last layer in one step.', items:[ {id:'fl',name:'First Layer'}, {id:'cll',name:'CLL Trainer'}, {id:'cll-sheet',name:'CLL — Algorithm Sheet'} ]},
      { id:'eg', name:'EG', blurb:'Advanced; first layer need not be pre-solved.', items:[ {id:'eg1',name:'EG-1 Trainer'}, {id:'eg2',name:'EG-2 Trainer'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with random 2×2 scrambles; times saved to your profile.', items:[ {id:'solve',name:'2×2 Timer'} ]},
    ]},
  { id:'4x4', name:'4×4  (Rubik’s Revenge)', art:'cube4', methods:[
      { id:'reduction', name:'Reduction', blurb:'Reduce to a 3×3: centers, edges, then solve (+parity).', items:[ {id:'centers',name:'Centers'}, {id:'edges',name:'Edge Pairing'}, {id:'3x3',name:'Solve as 3×3'}, {id:'parity',name:'Parity'} ]},
      { id:'yau', name:'Yau', blurb:'Reduction variant building the cross early.', items:[ {id:'c2',name:'First 2 Centers'}, {id:'cross',name:'Cross (1st Dedge Set)'}, {id:'centers',name:'All Centers'}, {id:'edges',name:'Edge Pairing'}, {id:'323',name:'3-2-3 Edge Pairing'}, {id:'3x3',name:'Solve as 3×3'}, {id:'parity',name:'Parity'} ]},
      { id:'hoya', name:'Hoya', blurb:'Centers-first variant: 2 opposite centers + cross, then the rest.', items:[ {id:'centers2',name:'2 Opposite Centers'}, {id:'cross',name:'Cross'}, {id:'centers4',name:'Remaining Centers'}, {id:'edges',name:'Edge Pairing'} ]},
      { id:'meyer', name:'Meyer', blurb:'A Yau/Hoya hybrid, cross-early.', items:[ {id:'overview',name:'Overview'}, {id:'centers2',name:'2 Centers'}, {id:'cross',name:'Cross + Centers'}, {id:'edges',name:'Edge Pairing'} ]},
      { id:'k4', name:'K4', blurb:'Advanced direct-solving with commutators (no reduction).', items:[ {id:'intro',name:'Overview'}, {id:'f2l',name:'Centers &amp; First Two Layers'}, {id:'ll',name:'Last Layer (Commutators)'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with random 4×4 scrambles; times saved to your profile.', items:[ {id:'solve',name:'4×4 Timer'} ]},
    ]},
  { id:'5x5', name:'5×5  (Professor’s Cube)', art:'cube5', methods:[
      { id:'reduction', name:'Reduction', blurb:'Centers, pair edges, finish as a 3×3 (+ OLL parity).', items:[ {id:'centers',name:'Centers'}, {id:'edges',name:'Edge Pairing'}, {id:'3x3',name:'Solve as 3×3'}, {id:'parity',name:'Parity'} ]},
      { id:'yau', name:'Yau', blurb:'Reduction variant building the cross early.', items:[ {id:'c2',name:'First 2 Centers'}, {id:'cross',name:'Cross (1st Dedge Set)'}, {id:'centers',name:'All Centers'}, {id:'edges',name:'Edge Pairing'}, {id:'323',name:'3-2-3 Edge Pairing'}, {id:'3x3',name:'Solve as 3×3'}, {id:'parity',name:'Parity'} ]},
      { id:'hoya', name:'Hoya', blurb:'Centers-first variant: 2 opposite centers + cross, then the rest.', items:[ {id:'centers2',name:'2 Opposite Centers'}, {id:'cross',name:'Cross'}, {id:'centers4',name:'Remaining Centers'}, {id:'edges',name:'Edge Pairing'} ]},
      { id:'meyer', name:'Meyer', blurb:'A Yau/Hoya hybrid, cross-early.', items:[ {id:'overview',name:'Overview'}, {id:'centers2',name:'2 Centers'}, {id:'cross',name:'Cross + Centers'}, {id:'edges',name:'Edge Pairing'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with random 5×5 scrambles; times saved to your profile.', items:[ {id:'solve',name:'5×5 Timer'} ]},
    ]},
  { id:'6x6', name:'6×6', art:'cube6', methods:[
      { id:'reduction', name:'Reduction', blurb:'Centers, edge pairing, then 3×3 (+ OLL/PLL parity).', items:[ {id:'centers',name:'Centers'}, {id:'edges',name:'Edge Pairing'}, {id:'3x3',name:'Solve as 3×3'}, {id:'parity',name:'Parity'} ]},
      { id:'yau', name:'Yau', blurb:'Reduction variant building the cross early.', items:[ {id:'c2',name:'First 2 Centers'}, {id:'cross',name:'Cross (1st Dedge Set)'}, {id:'centers',name:'All Centers'}, {id:'edges',name:'Edge Pairing'}, {id:'323',name:'3-2-3 Edge Pairing'}, {id:'3x3',name:'Solve as 3×3'}, {id:'parity',name:'Parity'} ]},
      { id:'hoya', name:'Hoya', blurb:'Centers-first variant: 2 opposite centers + cross, then the rest.', items:[ {id:'centers2',name:'2 Opposite Centers'}, {id:'cross',name:'Cross'}, {id:'centers4',name:'Remaining Centers'}, {id:'edges',name:'Edge Pairing'} ]},
      { id:'meyer', name:'Meyer', blurb:'A Yau/Hoya hybrid, cross-early.', items:[ {id:'overview',name:'Overview'}, {id:'centers2',name:'2 Centers'}, {id:'cross',name:'Cross + Centers'}, {id:'edges',name:'Edge Pairing'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with random 6×6 scrambles; times saved to your profile.', items:[ {id:'solve',name:'6×6 Timer'} ]},
    ]},
  { id:'7x7', name:'7×7', art:'cube7', methods:[
      { id:'reduction', name:'Reduction', blurb:'Centers, edges, 3×3 (+ OLL parity).', items:[ {id:'centers',name:'Centers'}, {id:'edges',name:'Edge Pairing'}, {id:'3x3',name:'Solve as 3×3'}, {id:'parity',name:'Parity'} ]},
      { id:'yau', name:'Yau', blurb:'Reduction variant building the cross early.', items:[ {id:'c2',name:'First 2 Centers'}, {id:'cross',name:'Cross (1st Dedge Set)'}, {id:'centers',name:'All Centers'}, {id:'edges',name:'Edge Pairing'}, {id:'323',name:'3-2-3 Edge Pairing'}, {id:'3x3',name:'Solve as 3×3'}, {id:'parity',name:'Parity'} ]},
      { id:'hoya', name:'Hoya', blurb:'Centers-first variant: 2 opposite centers + cross, then the rest.', items:[ {id:'centers2',name:'2 Opposite Centers'}, {id:'cross',name:'Cross'}, {id:'centers4',name:'Remaining Centers'}, {id:'edges',name:'Edge Pairing'} ]},
      { id:'meyer', name:'Meyer', blurb:'A Yau/Hoya hybrid, cross-early.', items:[ {id:'overview',name:'Overview'}, {id:'centers2',name:'2 Centers'}, {id:'cross',name:'Cross + Centers'}, {id:'edges',name:'Edge Pairing'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with random 7×7 scrambles; times saved to your profile.', items:[ {id:'solve',name:'7×7 Timer'} ]},
    ]},
  { id:'pyra', name:'Pyraminx', art:'pyra', methods:[
      { id:'lbl', name:'Layer by Layer', blurb:'Tips and one layer, then the last layer.', items:[ {id:'tips',name:'Tips & Centers'}, {id:'l1',name:'First Layer'}, {id:'ll',name:'Last Layer Trainer'} ]},
      { id:'l4e', name:'Keyhole / L4E', blurb:'Intermediate last-layer methods.', items:[ {id:'setup',name:'Setup'}, {id:'l4e',name:'Last 4 Edges'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with random Pyraminx scrambles; times saved to your profile.', items:[ {id:'solve',name:'Pyraminx Timer'} ]},
    ]},
  { id:'mega', name:'Megaminx', art:'mega', methods:[
      { id:'lbl', name:'Layer by Layer', blurb:'Star, layers, then last-layer algorithms.', items:[ {id:'star',name:'Gray Star'}, {id:'layers',name:'Building Layers'}, {id:'ll',name:'Last Layer'} ]},
      { id:'ll', name:'Last Layer (OLL / PLL)', blurb:'Orient then permute — Megaminx-native algorithms, building toward 1-look.', items:[ {id:'2loll',name:'2-Look OLL'}, {id:'2lpll',name:'2-Look PLL'}, {id:'1look',name:'Toward 1-Look'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with standard Megaminx scrambles; times saved to your profile.', items:[ {id:'solve',name:'Megaminx Timer'} ]},
    ]},
  { id:'skewb', name:'Skewb', art:'skewb', methods:[
      { id:'sarah', name:'Sarah’s Beginner', blurb:'One face, then finish with a couple of algorithms.', items:[ {id:'face',name:'First Face'}, {id:'layer',name:'Layer'}, {id:'ll',name:'Last Layer'} ]},
      { id:'sarahadv', name:'Sarah’s Advanced', blurb:'Face + layer, then CLL-style last layer.', items:[ {id:'fl',name:'Face + Layer'}, {id:'cll',name:'CLL'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with random Skewb scrambles; times saved to your profile.', items:[ {id:'solve',name:'Skewb Timer'} ]},
    ]},
  { id:'sq1', name:'Square-1', art:'sq1', methods:[
      { id:'vandenbergh', name:'Vandenbergh (Layer by Layer)', blurb:'Cube shape, separate pieces, permute layers (+parity).', items:[ {id:'shape',name:'Cube Shape'}, {id:'ce',name:'Corners & Edges'}, {id:'parity',name:'Parity'}, {id:'ll',name:'Last Layer'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with random Square-1 scrambles; times saved to your profile.', items:[ {id:'solve',name:'Square-1 Timer'} ]},
    ]},
  { id:'clock', name:'Clock', art:'clock', methods:[
      { id:'standard', name:'Beginner (Standard)', blurb:'Set the pins and turn the wheels — intuitive, no memorised algorithms.',
        items:[ {id:'pins',name:'Pins & Wheels'}, {id:'solve',name:'Full Solve'} ]},
      { id:'7simul', name:'7-Simul (Advanced)', blurb:'7 simultaneous front+back move-pairs, no flips; the top world-record method (invented Nov 2022).',
        items:[ {id:'concept',name:'Concept & Inspection'}, {id:'pairs',name:'The 7 Move-Pairs'}, {id:'flip',name:'7-Simul Flip (variant)'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with standard Clock scrambles; times saved to your profile.', items:[ {id:'solve',name:'Clock Timer'} ]},
    ]},
  { id:'3bld', name:'3×3 Blindfolded', art:'bld', methods:[
      { id:'op', name:'Old Pochmann', blurb:'The classic intro to BLD: setup moves + one swap algorithm (T-perm / Y-perm) for edges and corners.', items:[ {id:'memo',name:'Memorisation & Letter Pairs'}, {id:'edges',name:'Edges (T-perm)'}, {id:'corners',name:'Corners (Y-perm)'} ]},
      { id:'m2', name:'M2 / OP', blurb:'Faster edges via the M2 method; corners via Old Pochmann.', items:[ {id:'m2',name:'M2 Edges'}, {id:'corners',name:'OP Corners'} ]},
      { id:'3style', name:'3-Style', blurb:'Advanced: solve pieces in commutator 3-cycles for top speed.', items:[ {id:'comms',name:'Commutators'}, {id:'edges',name:'Edge 3-Style'}, {id:'corners',name:'Corner 3-Style'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with standard 3×3 scrambles — memo + execution timed together; times saved to your profile.', items:[ {id:'solve',name:'3BLD Timer'} ]},
    ]},
  { id:'fmc', name:'3×3 Fewest Moves', art:'fmc', methods:[
      { id:'fmc', name:'FMC Techniques', blurb:'Find the shortest solution on paper: block-building, edge control, NISS, and insertions.', items:[ {id:'blocks',name:'Blockbuilding'}, {id:'niss',name:'NISS'}, {id:'insertions',name:'Insertions'} ]},
      { id:'timer', name:'Trainer', blurb:'Scored by move count, not time: solve the scramble on paper and record your solution length, with best & averages.', items:[ {id:'solve',name:'FMC Trainer'} ]},
    ]},
  { id:'mbld', name:'3×3 Multi-Blind', art:'mbld', methods:[
      { id:'mbld', name:'Multi-BLD', blurb:'Memorise and solve many cubes blindfolded: rooms/journey memory and review systems.', items:[ {id:'memo',name:'Memory Systems'}, {id:'review',name:'Review & Execution'} ]},
    ]},
  { id:'4bld', name:'4×4 Blindfolded', art:'bld', methods:[
      { id:'4bld', name:'4BLD', blurb:'Blindfolded big cube: centers, wings, then 3BLD, with parity.', items:[ {id:'centers',name:'Centers'}, {id:'wings',name:'Wings'}, {id:'parity',name:'Parity'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with standard 4×4 scrambles — memo + execution timed together; times saved to your profile.', items:[ {id:'solve',name:'4BLD Timer'} ]},
    ]},
  { id:'5bld', name:'5×5 Blindfolded', art:'bld', methods:[
      { id:'5bld', name:'5BLD', blurb:'The largest WCA BLD event: + and x centers, wings, midges, 3BLD.', items:[ {id:'centers',name:'Centers'}, {id:'wings',name:'Wings'}, {id:'midges',name:'Midges'} ]},
      { id:'timer', name:'Timer', blurb:'Full-solve timer with standard 5×5 scrambles — memo + execution timed together; times saved to your profile.', items:[ {id:'solve',name:'5BLD Timer'} ]},
    ]},
];
