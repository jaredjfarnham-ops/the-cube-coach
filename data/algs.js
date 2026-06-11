/* ================================================================
   ALGORITHM SETS for sheets & trainers.  Every algorithm is verified
   (F2L-preserving + solves) by _setup/verify-algs.js before shipping.
   Diagrams are auto-generated from these by js/diagrams.js.
   ================================================================ */
const ALG_SETS = {
  pll: [
    // edges only
    { name:'Ua', group:'Edges', moves:"M2 U M U2 M' U M2", alt:'The same as Ub performed in reverse.' },
    { name:'Ub', group:'Edges', moves:"M2 U' M U2 M' U' M2", alt:'The same as Ua performed in reverse.' },
    { name:'H',  group:'Edges', moves:"M2 U M2 U2 M2 U M2", alt:'Fully symmetric — works from any of the four U angles.' },
    { name:'Z',  group:'Edges', moves:"M2 U M2 U M' U2 M2 U2 M'", alt:'Has a mirror variant (do it from the other diagonal).' },
    // corners only
    { name:'Aa', group:'Corners', moves:"R' F R' B2 R F' R' B2 R2", alt:'The same as Ab performed in reverse.' },
    { name:'Ab', group:'Corners', moves:"R2 B2 R F R' B2 R F' R", alt:'The same as Aa performed in reverse.' },
    { name:'E',  group:'Corners', moves:"x' L' U L D' L' U' L D L' U' L D' L' U L D x" },
    // adjacent corner swap
    { name:'T',  group:'Adjacent', moves:"R U R' U' R' F R2 U' R' U' R U R' F'" },
    { name:'Ja', group:'Adjacent', moves:"x R2 F R F' R U2 r' U r U2 x'", alt:'y2, then a left-handed Jb.' },
    { name:'Jb', group:'Adjacent', moves:"R U R' F' R U R' U' R' F R2 U' R' U'", alt:"R U2 R' U' R U2 L' U R' U' L" },
    { name:'Ra', group:'Adjacent', moves:"R U' R' U' R U R D R' U' R D' R' U2 R' U'" },
    { name:'Rb', group:'Adjacent', moves:"R' U2 R U2 R' F R U R' U' R' F' R2 U'" },
    { name:'F',  group:'Adjacent', moves:"R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
    { name:'Ga', group:'G-perms', moves:"R2 U R' U R' U' R U' R2 U' D R' U R D'" },
    { name:'Gb', group:'G-perms', moves:"R' U' R U D' R2 U R' U R U' R U' R2 D" },
    { name:'Gc', group:'G-perms', moves:"R2 U' R U' R U R' U R2 U D' R U' R' D" },
    { name:'Gd', group:'G-perms', moves:"R U R' U' D R2 U' R U' R' U R' U R2 D'" },
    // diagonal corner swap
    { name:'V',  group:'Diagonal', moves:"R' U R' U' y R' F' R2 U' R' U R' F R F y'" },
    { name:'Y',  group:'Diagonal', moves:"F R U' R' U' R U R' F' R U R' U' R' F R F'" },
    { name:'Na', group:'Diagonal', moves:"R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
    { name:'Nb', group:'Diagonal', moves:"R' U R U' R' F' U' F R U R' F R' F' R U' R" },
  ],
  oll: [
    { name:'Line',      group:'Edges',   moves:"F R U R' U' F'" },
    { name:'L-shape',   group:'Edges',   moves:"f R U R' U' f'" },
    { name:'Dot',       group:'Edges',   moves:"F R U R' U' F' f R U R' U' f'" },
    { name:'Sune',      group:'Corners', moves:"R U R' U R U2 R'" },
    { name:'Anti-Sune', group:'Corners', moves:"R U2 R' U' R U' R'" },
    { name:'Pi',        group:'Corners', moves:"R U2 R2 U' R2 U' R2 U2 R" },
    { name:'H',         group:'Corners', moves:"R U R' U R U' R' U R U2 R'" },
    { name:'T',         group:'Corners', moves:"r U R' U' r' F R F'" },
    { name:'U',         group:'Corners', moves:"R2 D R' U2 R D' R' U2 R'" },
    { name:'L',         group:'Corners', moves:"F R' F' r U R U' r'" },
  ],
};

/* 2-look subsets for the 3×3 Timer modes. oll2 = the standard 10 two-look OLL algs (the seed above,
   kept separate because cfop-sets.js replaces ALG_SETS.oll with the full 57). pll2 = the pure
   corner/edge perms used in two-look PLL. */
ALG_SETS.oll2 = ALG_SETS.oll.map(a => ({ ...a }));
ALG_SETS.pll2 = ALG_SETS.pll.filter(a => ['Aa','Ab','E','Ua','Ub','H','Z'].includes(a.name));

/* Register sheet + trainer lessons (the router/menu read these like any lesson).
   The algorithm SHEETS live under CFOP (learning); the timer-based TRAINERS live
   under the 3×3 "Timer" method alongside the full-solve timer. */
LESSONS['3x3/cfop/pll-sheet'] = { type:'sheet', kind:'pll', set:'pll', title:'PLL — Algorithm Sheet',
  intro:['<b>PLL</b> (Permute the Last Layer) is the final CFOP step: 21 cases that move the last-layer pieces into place once the top is oriented. Each card shows the case pattern (side colors + arrows for where pieces go) and its algorithm — click <b>play</b> to watch it on the cube.'] };
LESSONS['3x3/cfop/oll-sheet'] = { type:'sheet', kind:'oll', set:'oll', title:'OLL — Algorithm Sheet',
  intro:['<b>OLL</b> (Orient the Last Layer) makes the whole top one color in one algorithm. This is the complete set of all <b>57 cases</b>. Yellow = a sticker already facing up; the tabs around the edge show where yellow wraps onto a side. Click a case to play its algorithm on the cube.'] };

/* One 3×3 Timer with a Mode dropdown: time a whole solve, or drill a single step.
   Each mode maps to a set + diagram kind (or a full solve); times are stored per mode. */
LESSONS['3x3/timer/solve'] = { type:'trainer', puzzle:'3x3', title:'3×3 Timer',
  modes:[
    { id:'solve', name:'Full solve', solve:true },
    { id:'f2l',   name:'F2L',         set:'f2l',  kind:'f2l' },
    { id:'2loll', name:'2-Look OLL',  set:'oll2', kind:'oll' },
    { id:'oll',   name:'OLL',         set:'oll',  kind:'oll' },
    { id:'2lpll', name:'2-Look PLL',  set:'pll2', kind:'pll' },
    { id:'pll',   name:'PLL',         set:'pll',  kind:'pll' },
  ],
  intro:['A full-solve and step trainer for the 3×3. Pick a <b>Mode</b>: <b>Full solve</b> times a whole solve from a WCA scramble; <b>F2L / OLL / PLL</b> (and their 2-look subsets) drill a single random case. Apply the scramble, hold <b>Space</b> and release to start, press a key to stop — or set <b>Cube → Virtual</b> to solve on screen with the mouse. Each mode keeps its own times (Ao5 / Ao12).'] };
