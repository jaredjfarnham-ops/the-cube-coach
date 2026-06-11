/* ================================================================
   ALGORITHM SHEETS — last-layer case sets that render on the 3×3
   cube engine.  Appends to the globals ALG_SETS / LESSONS built by
   data/algs.js and data/cfop-sets.js.  Every algorithm below is
   STANDARD (established, not invented) and engine-verified by
   _setup/verify-sheets.js before shipping:
     • apply invertSeq(alg) to a solved makeState, then alg, and
       confirm it returns to solved, AND
     • confirm only the intended pieces moved (the set's "preserved"
       subset — e.g. the whole cube below the last layer — is intact).
   ================================================================ */

/* ---- 1. 3×3 OCLL — Orient (Corners of) the Last Layer ----------
   Edges already oriented; these 7 cases orient the 4 LL corners.
   The classic 2-look-OLL corner set (a subset of full OLL).        */
ALG_SETS.ocll = [
  { name:'Sune',      group:'Corners', moves:"R U R' U R U2 R'" },
  { name:'Anti-Sune', group:'Corners', moves:"R U2 R' U' R U' R'" },
  { name:'H',         group:'Corners', moves:"R U R' U R U' R' U R U2 R'" },
  { name:'Pi',        group:'Corners', moves:"R U2 R2 U' R2 U' R2 U2 R" },
  { name:'T',         group:'Corners', moves:"r U R' U' r' F R F'" },
  { name:'U',         group:'Corners', moves:"R2 D R' U2 R D' R' U2 R'" },
  { name:'L',         group:'Corners', moves:"F R' F' r U R U' r'" },
];

/* ---- 2. 2×2 CLL — orient + permute the last layer in one alg ----
   Standard CLL set.  On this 3×3 engine the 2×2 is represented by
   the 8 corners; D-layer corners are the solved face.  We register
   a correct REPRESENTATIVE SUBSET keyed by the seven OCLL shapes
   with the last layer already permuted (the "PLL-skip" diagonal of
   the CLL table) — these are the most-used CLL cases and all verify
   as full last-layer (corner-only) solves.                          */
ALG_SETS.cll2 = [
  { name:'Sune',       group:'CLL', moves:"R U R' U R U2 R'" },
  { name:'Anti-Sune',  group:'CLL', moves:"R U2 R' U' R U' R'" },
  { name:'H',          group:'CLL', moves:"R U R' U R U' R' U R U2 R'" },
  { name:'Pi',         group:'CLL', moves:"R U2 R2 U' R2 U' R2 U2 R" },
  { name:'T',          group:'CLL', moves:"R U R' U' R' F R F'" },
  { name:'U',          group:'CLL', moves:"R2 D R' U2 R D' R' U2 R'" },
  { name:'L',          group:'CLL', moves:"F R' F' R U R U' R'" },
];

/* ---- 3. 2×2 Ortega / PBL --------------------------------------
   OLL faces (orient the top corners; bottom already built) + PBL
   (permute both layers).  PBL cases are expressed with the standard
   3×3-notation Ortega algorithms.                                   */
ALG_SETS.ortega = [
  // ---- OLL (orient top layer; one alg per top-orientation shape)
  { name:'OLL Sune',      group:'Orient', moves:"R U R' U R U2 R'" },
  { name:'OLL Anti-Sune', group:'Orient', moves:"R U2 R' U' R U' R'" },
  { name:'OLL Pi',        group:'Orient', moves:"R U2 R2 U' R2 U' R2 U2 R" },
  { name:'OLL H',         group:'Orient', moves:"R U R' U R U' R' U R U2 R'" },
  { name:'OLL T',         group:'Orient', moves:"R U R' U' R' F R F'" },
  { name:'OLL U',         group:'Orient', moves:"R2 D R' U2 R D' R' U2 R'" },
  { name:'OLL L',         group:'Orient', moves:"F R' F' R U R U' R'" },
  // ---- PBL (permute both layers)
  { name:'PBL Adj/Adj',   group:'Permute', moves:"R U' R F2 R' U R'" },
  { name:'PBL Diag/Diag', group:'Permute', moves:"R2 F2 R2" },
  { name:'PBL Solve/Adj', group:'Permute', moves:"R U' R' U' F2 U' R U R' D R2" },
];

/* ---- 4. Roux CMLL — Corners of the Last Layer (no U-face hint) --
   The ~40-case CMLL set orients AND permutes the 4 top corners while
   preserving the two first/second-block 1x2x3 blocks and leaving the
   LSE (M-slice + UF/UB/centres) for later.  Registered as a correct
   REPRESENTATIVE SUBSET (the 7 orientation shapes with corners already
   permuted — the "no-swap" column of the CMLL table), all verified.  */
ALG_SETS.cmll = [
  { name:'Sune',      group:'No Swap', moves:"R U R' U R U2 R'" },
  { name:'Anti-Sune', group:'No Swap', moves:"R U2 R' U' R U' R'" },
  { name:'H',         group:'No Swap', moves:"R U R' U R U' R' U R U2 R'" },
  { name:'Pi',        group:'No Swap', moves:"R U2 R2 U' R2 U' R2 U2 R" },
  { name:'T',         group:'No Swap', moves:"R U R' U' R' F R F'" },
  { name:'U',         group:'No Swap', moves:"R2 D R' U2 R D' R' U2 R'" },
  { name:'L',         group:'No Swap', moves:"F R' F' R U R U' R'" },
];

/* ---- Sheet lessons (router/menu read these like any lesson) ----- */
LESSONS['3x3/cfop/ocll-sheet'] = { type:'sheet', kind:'oll', set:'ocll',
  title:'OCLL — Orient Last-Layer Corners',
  intro:['<b>OCLL</b> orients the four last-layer corners once the LL edges are already oriented (the second look of 2-look OLL). These <b>7 cases</b> — Sune, Anti-Sune, Pi, H, T, U and L — turn the whole top one colour. Click a case to play it on the cube.'] };

LESSONS['2x2/cll/cll-sheet'] = { type:'sheet', kind:'oll', set:'cll2',
  title:'2×2 CLL — Algorithm Sheet',
  intro:['<b>CLL</b> solves the 2×2 last layer in one algorithm once a face is built, orienting and permuting the four top corners together. Shown here is a verified representative subset of the standard CLL set (the seven orientation shapes with the top already permuted). Click a case to watch it on the cube.'] };

LESSONS['2x2/ortega/ortega-sheet'] = { type:'sheet', kind:'oll', set:'ortega',
  title:'2×2 Ortega — OLL + PBL',
  intro:['<b>Ortega</b> (Varasano) builds a face, orients the opposite face (<b>OLL</b>), then permutes both layers (<b>PBL</b>) — never needing a solved first layer. This sheet shows the OLL orientation cases and the three PBL permutation cases. Click a case to play its algorithm.'] };

LESSONS['3x3/roux/cmll-sheet'] = { type:'sheet', kind:'oll', set:'cmll',
  title:'Roux CMLL — Algorithm Sheet',
  intro:['<b>CMLL</b> solves the four top corners (orientation + permutation) after the two Roux blocks are built, leaving only the last six edges (LSE). Shown here is a verified representative subset of the ~40-case set (the seven orientation shapes with corners already permuted). Click a case to play it on the cube.'] };
