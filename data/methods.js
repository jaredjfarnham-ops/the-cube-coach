/* ================================================================
   Alternate 3×3 methods (Roux, ZZ, Petrus) and the 4×4 Yau method.
   Conceptual tutorials (type:'text') with inline algorithm references.
   Loaded AFTER algs.js (uses ALG_SETS) and BEFORE taxonomy.js.
   ================================================================ */
(function () {
  // Standard OCLL (corner-orientation) algs — hardcoded because cfop-sets.js replaces ALG_SETS.oll
  // with the full 57-case set (numbered, not named Sune/etc).
  const OCLL = { Sune:"R U R' U R U2 R'", 'Anti-Sune':"R U2 R' U' R U' R'",
                 Pi:"R U2 R2 U' R2 U' R2 U2 R", H:"R U R' U R U' R' U R U2 R'" };
  const pll = n => (ALG_SETS.pll.find(a => a.name === n) || {}).moves || '';
  const ref = rows => '<div class="alg-ref">' +
    rows.map(r => `<div class="alg-ref-row"><span class="arn">${r[0]}</span><code>${(r[1]||'').replace(/'/g,'′')}</code>`
      + (r[2] ? `<span class="alt">alt: ${(r[2]||'').replace(/'/g,'′')}</span>` : '') + `</div>`).join('') +
    '</div>';

  /* ========================= ROUX ========================= */
  LESSONS['3x3/roux/fb'] = { type:'text', title:'Roux — First Block',
    intro:[
      'Roux is a <b>block-building</b> method with a very low move count and only a handful of algorithms (the rest is intuitive). It’s usually done holding the cube so you build on the <b>left and right</b> sides and finish with the top and the middle “M” slice.',
      'Step 1 is the <b>First Block</b>: a <b>1×2×3 block</b> on the <b>bottom-left</b>. Think of it as a little wall — two side colours, three pieces tall isn’t right; it’s 1 wide × 2 tall × 3 deep, made of the bottom-left edge, the two bottom-left corners, and the two left-side edges plus the centre. Build it <b>intuitively</b>, exactly like you’d build a face corner-and-edge pair, but as a connected block.',
      'There’s no algorithm here — the whole point of Roux’s opening is free-form efficiency. Aim to plan most of it during inspection. Keep the block <b>on the bottom-left</b> and don’t worry about the right side yet.'
    ]};
  LESSONS['3x3/roux/sb'] = { type:'text', title:'Roux — Second Block',
    intro:[
      'Step 2 builds the <b>mirror 1×2×3 block</b> on the <b>bottom-right</b>, without disturbing the first block. Now the entire bottom layer’s left and right walls are solid, and only the <b>top layer</b> and the <b>middle (M) slice</b> remain.',
      'Second Block is still <b>intuitive</b>, but the constraint is tighter: you may only use moves that don’t wreck the first block — primarily <b>R, r, U and M</b> turns. You pair a corner with its edge in the top/right and insert the pair into the bottom-right slot, just like F2L but restricted to the right side.',
      'Good Second Block technique is the heart of Roux speed. Once both blocks are done, the cube is in a very recognisable state: two solid side blocks, a scrambled top, and a free middle slice.'
    ]};
  LESSONS['3x3/roux/cmll'] = { type:'text', title:'Roux — CMLL',
    intro:[
      '<b>CMLL</b> = <i>Corners of the Last Layer</i>, solved while <b>ignoring the M-slice edges</b>. With both blocks done, the six top-layer corners are oriented <b>and</b> permuted in a single algorithm — there are <b>42 one-look cases</b>, but you can start with an easy <b>two-look</b> approach.',
      'Two-look CMLL — Step 1, <b>orient the corners</b> (make the top one colour). Use the <b>full set of 2-look OLL corner cases</b>, not just Sune and Anti-Sune. Crucially, because Roux <b>ignores the edges</b> here, you should swap the long edge-safe algs for the shorter edge-disturbing ones: for the <b>U/headlights (OLL 23)</b> case use the <b>OLL 45</b> alg, and for the <b>T/chameleon (OLL 24)</b> case use the <b>OLL 33</b> alg — both are far shorter than the corner-only versions, and the scrambled edges don’t matter (LSE fixes them later).',
      ref([
        ['Sune (OLL 27)', OCLL.Sune],
        ['Anti-Sune (OLL 26)', OCLL['Anti-Sune']],
        ['Pi (OLL 22)', OCLL.Pi],
        ['H (OLL 21)', OCLL.H],
        ['U / headlights — use OLL 45', "F R U R' U' F'"],
        ['T / chameleon — use OLL 33', "R U R' U' R' F R F'"],
        ['L / bowtie (OLL 25)', "F R' F' r U R U' r'"],
      ]),
      'Step 2 — <b>permute the corners</b>. With the top one colour, cycle the corners into place (any pure-corner perm is fine; edges still don’t matter):',
      ref([
        ['Corner 3-cycle (A-perm)', pll('Aa'), 'Ab reversed'],
        ['Diagonal swap (Y-perm)', pll('Y')],
      ]),
      'Once two-look is comfortable, learn the <b>42 one-look CMLL</b> algorithms (orientation + permutation in one) to cut a whole pause out of every solve.'
    ]};
  LESSONS['3x3/roux/lse'] = { type:'text', title:'Roux — LSE (Last Six Edges)',
    intro:[
      'The finish is <b>LSE</b>: the four U-layer edges plus the two M-slice edges — six edges in total — all solved with <b>only U and M turns</b>. No corners move, so it’s pure edge work and very satisfying.',
      'LSE goes in three quick phases. <b>(1) EO</b> — orient the remaining edges so the top is ready (flip mis-oriented UF/UB-type edges with the trigger <code>M U M′</code> patterns). <b>(2) UL/UR</b> — place the left and right U edges with <code>U</code> and <code>M</code> moves so the M-slice can drop in. <b>(3) Last 4 / EPLL of edges</b> — solve the four remaining edges with short <code>M2 / U2</code> sequences.',
      'Useful patterns:',
      ref([
        ['Flip two edges (EO)', "M U M U M U2 M U M U M"],
        ['Solve the middle slice', "M2"],
        ['Cycle the last edges', "M2 U M2 U2 M2 U M2"],
      ]),
      'LSE is mostly intuitive once you can “see” the M-slice as a single moving belt. Roux solvers love it because it’s fast, flowy, and needs no corner thinking.'
    ]};

  /* ========================= ZZ ========================= */
  LESSONS['3x3/zz/eoline'] = { type:'text', title:'ZZ — EOLine',
    intro:[
      'ZZ’s big idea: <b>orient every edge first</b>, so the entire rest of the solve can be done with only <b>R, U and L</b> turns — <b>no F moves, no cube rotations</b>. That makes look-ahead and ergonomics excellent.',
      'Step 1 is <b>EOLine</b>: in one go, <b>orient all 12 edges</b> while also placing the <b>DF and DB edges</b> (the “line” on the bottom). Edge orientation is judged relative to the F/B faces — an edge is “bad” if it would need an F or B move to solve; EOLine flips all the bad ones and parks the two line edges.',
      'EOLine is <b>intuitive but tricky</b> to plan — it’s the hardest part of ZZ to learn because you must track edge orientation during inspection. Aim for ~6–8 moves. Once the line is down and all edges are oriented, you never need F or rotations again.'
    ]};
  LESSONS['3x3/zz/zzf2l'] = { type:'text', title:'ZZ — ZZF2L',
    intro:[
      'With all edges oriented and the line placed, build the rest of the <b>first two layers using only R, U and L</b> moves. You raise the two side blocks around the line and fill the four F2L pairs — but because edges are already oriented, every insertion is a clean <code>R/U/L</code> trigger with no F turns.',
      'This is <b>rotationless</b> block-building: keep the bottom on the bottom the whole time, use your left hand for L moves and right for R/U, and watch pairs form in the top layer. Many ZZ solvers also influence the last-layer corners here (a stepping stone to ZBLL).',
      'The payoff is huge ergonomics and look-ahead — no regrips for F moves, no rotations to hunt for pieces. It feels very different from CFOP F2L once it clicks.'
    ]};
  LESSONS['3x3/zz/ocll'] = { type:'text', title:'ZZ — OCLL + PLL',
    intro:[
      'Because the edges are <b>already oriented</b> from EOLine, the last layer never needs edge orientation — the top edges are guaranteed to form the cross. So the easy two-look finish is <b>OCLL</b> (orient corners) then <b>PLL</b> (permute everything).',
      '<b>OCLL</b> is just the <b>7 corner-orientation cases</b> — the same Sune-family algorithms CFOP solvers know:',
      ref([
        ['Sune', OCLL.Sune],
        ['Anti-Sune', OCLL['Anti-Sune']],
        ['Pi', OCLL.Pi],
        ['H', OCLL.H],
      ]),
      'Then finish with any <b>PLL</b> (see the CFOP PLL sheet for all 21). This two-look LL is the friendly on-ramp; the advanced ZZ finish is <b>ZBLL</b> (next lesson), which does corners-and-edges permutation in a single algorithm.'
    ]};
  LESSONS['3x3/zz/zbll'] = { type:'text', title:'ZZ — ZBLL',
    intro:[
      '<b>ZBLL</b> solves the <b>entire last layer in one algorithm</b> whenever the edges are already oriented — which, in ZZ, they always are. It covers every arrangement of <b>corner orientation + corner permutation + edge permutation</b>: <b>493 cases</b>.',
      'That’s a big set, so almost nobody learns it cold. The standard path is to learn it in pieces: first <b>COLL</b> (orient + permute corners in one alg while preserving EO — 40 cases), pairing it with <b>EPLL</b> (the 4 edge-only perms). COLL + EPLL is a powerful, much smaller two-look that already beats OCLL+PLL.',
      'From there you expand into full ZBLL set by set (sorted by corner-orientation case: Sune, Anti-Sune, Pi, H, T, U, L). It’s the deep end of 3×3 — enormous recognition payoff, but learn COLL and EPLL first and grow from there.'
    ]};

  /* ========================= PETRUS ========================= */
  LESSONS['3x3/petrus/b1'] = { type:'text', title:'Petrus — 2×2×2 Block',
    intro:[
      'Petrus is the original <b>blockbuilding</b> method, designed to minimise moves and avoid wrecking solved pieces. Step 1: build a <b>2×2×2 block</b> in one corner of the cube — eight little cubies forming a solid corner.',
      'This is completely <b>intuitive</b> and very free: there are no fixed pieces yet, so you can build the block anywhere and use any moves. Plan it during inspection and aim for a handful of moves. The 2×2×2 becomes the anchor everything else grows from.',
      'Keep the block in a back-bottom corner so your working faces (the opposite two layers) stay free.'
    ]};
  LESSONS['3x3/petrus/b2'] = { type:'text', title:'Petrus — 2×2×3 Block',
    intro:[
      'Step 2 extends the corner block into a <b>2×2×3 block</b> — a solid 2×3 wall taking up one third of the cube. You add a second 2×2×1 slab next to the first block.',
      'Still <b>intuitive</b>, but now you must avoid disturbing the 2×2×2 you already built, so you work mostly with the two free layers (typically <code>R</code> and <code>U</code> style moves plus the far face). Efficient 2×2×3 is what gives Petrus its famously low move count.',
      'After this you have a big solid block and only a thin “L” of the cube left to solve — which is where Petrus’s clever edge-orientation trick comes in.'
    ]};
  LESSONS['3x3/petrus/eo'] = { type:'text', title:'Petrus — Edge Orientation',
    intro:[
      'Petrus’s signature step: with the 2×2×3 done, <b>orient the remaining edges</b> before finishing the first two layers. Because the big block restricts you to just a couple of faces, you can flip the bad edges with short <code>R U R′</code>-style sequences and the F face.',
      'Orienting edges now means the <b>last layer will never need edge orientation</b> — the cross is guaranteed later, exactly like ZZ. It also lets you finish the rest of F2L with only <code>R</code> and <code>U</code> moves (no F turns), keeping everything smooth.',
      'This is the step that makes Petrus efficient and rotationless from here on. Spot the few mis-oriented edges and fix them before moving on.'
    ]};
  LESSONS['3x3/petrus/fin'] = { type:'text', title:'Petrus — Finish',
    intro:[
      'Finish the <b>first two layers</b> by completing the remaining slots with <code>R</code> and <code>U</code> moves (edges are oriented, so insertions are clean), then solve the <b>last layer</b>.',
      'Because edge orientation is already done, the last layer is the same friendly two-look as ZZ: <b>OCLL</b> (orient the corners with the Sune family) then <b>PLL</b> (permute) — or one-look <b>ZBLL</b> if you’ve learned it.',
      ref([
        ['Orient corners — Sune', OCLL.Sune],
        ['Orient corners — Anti-Sune', OCLL['Anti-Sune']],
        ['Permute — see the full PLL set', '3×3 › CFOP › PLL sheet'],
      ]),
      'Petrus rewards planning: a well-built block + early EO gives very low move counts, which is why it’s a favourite for Fewest-Moves solving too.'
    ]};

  /* ========================= YAU (4×4–7×7) =========================
     Yau is a reduction variant that builds the cross early. It applies to
     every big cube; the centers simply get larger as the cube grows. The
     correct step order is:
       1st 2 centers → Cross (1st cross-dedge set) → All (remaining 4)
       centers → Edge Pairing (incl. 3-2-3) → 3×3 stage → Parity.
     The lessons below are generated for 4×4, 5×5, 6×6 and 7×7. Parity
     differs by cube: even cubes (4×4, 6×6) have OLL + PLL parity; odd
     cubes (5×5, 7×7) have OLL parity only. */
  const OLL_PARITY_44 = "r2 B2 U2 l U2 r' U2 r U2 F2 r F2 l' B2 r2";
  const PLL_PARITY_44 = "2r2 U2 2r2 Uw2 2r2 Uw2 U2";

  [['4x4','4×4',true],['5x5','5×5',false],['6x6','6×6',true],['7x7','7×7',false]]
    .forEach(([id,nm,even]) => {
    const centerNote = id==='4x4'
      ? 'each center is a <b>2×2 block</b> of pieces'
      : `each center is a larger block (on the ${nm} the centers are bigger than a 4×4’s 2×2), built the same way with wide turns`;

    LESSONS[id+'/yau/c2'] = { type:'text', title:'Yau — First 2 Centers',
      intro:[
        `<b>Yau</b> is the most popular speed method for the ${nm}. It’s a reduction method, but it builds the <b>cross early</b> so the final 3×3 stage flows straight into F2L. Step 1 lays down the <b>first 2 centers</b> — and only 2, the two you need on the sides for the cross.`,
        'Solve <b>two opposite centers</b> first (for a white-cross solve, do <b>white then yellow</b>) and <b>hold them on left and right</b>. That leaves the four “belt” faces (front, back, up, down) open as workspace for the cross. Do <b>not</b> build a third center yet — the remaining four centers are finished later, after the first cross edges.',
        `Center building is <b>intuitive</b> (${centerNote}). Keeping white and yellow opposite, and on the L/R, is the key set-up that makes the rest of Yau work.`
      ]};
    LESSONS[id+'/yau/cross'] = { type:'text', title:'Yau — Cross (1st Cross-Dedge Set)',
      intro:[
        'With just the <b>first 2 centers</b> on L/R, build the <b>cross early</b>. Pair and place <b>three of the four cross dedges</b> (the bottom edges) using the open belt faces as workspace, and park them on the bottom (the D layer) out of the way.',
        'This is the move that defines Yau: by laying most of the cross while only 2 centers exist, you reach the 3×3 stage already holding a cross, so you go directly into F2L like a normal CFOP solve.',
        'Use slice moves (<code>Uw</code> / <code>Rw</code>) to pair the cross dedges, and be careful to keep your <b>2 finished centers</b> intact. Leave the <b>fourth cross edge</b> for later — it gets solved during edge pairing.'
      ]};
    LESSONS[id+'/yau/centers'] = { type:'text', title:'Yau — All (Remaining 4) Centers',
      intro:[
        'Now finish the cube’s centers: with the <b>first 2 centers</b> and three cross edges already down, build the <b>remaining four centers</b> (the belt of front, back, up, down) <b>without disturbing</b> the cross or the 2 side centers.',
        'Work in the U/F area and tuck finished pairs away with wide slice + slice-back moves so the bottom cross stays put. Use the colors of your two solved side centers to place the belt centers correctly (white opposite yellow, green opposite blue, red opposite orange).',
        `On the ${nm} the centers are larger, so this step is the bulk of the center work — but it’s still entirely <b>intuitive</b>, no algorithms.`
      ]};
    LESSONS[id+'/yau/edges'] = { type:'text', title:'Yau — Edge Pairing',
      intro:[
        'All centers are built and three cross edges are down. Now <b>pair the remaining eight dedges</b>, keeping the cross and centers solved. When they’re all paired the cube is reduced to a 3×3 that already has a cross.',
        'Standard edge pairing applies: bring two matching wings together in the front-up/front-down slots, join them with a flip, then slice the pair away while bringing fresh wings up. Protect your cross and centers with the slice-back (<code>Uw … Uw′</code>) so nothing solved gets disturbed. Slot the final cross edge in as you go.',
        'For the last 8 edges the efficient batching technique is the <b>3-2-3 method</b> — covered in the next lesson.'
      ]};
    LESSONS[id+'/yau/323'] = { type:'text', title:'Yau — 3-2-3 Edge Pairing',
      intro:[
        'The <b>3-2-3 method</b> is the standard way to finish the <b>last 8 dedges</b> efficiently: you pair them in batches of <b>3, then 2, then 3</b> (3 + 2 + 3 = 8) instead of one slow pair at a time.',
        'How it works: bring a group of <b>3 unpaired dedges</b> into the U layer, pair each by flipping its matching wing in from the front-down slot, then <b>store</b> the three completed pairs with a single <code>Uw</code> slice. Repeat with a group of <b>2</b>, then the final group of <b>3</b> — restoring the centers with the matching slice-back (<code>Uw′</code>) each time so nothing you’ve solved breaks.',
        `On the ${nm} the same 3-2-3 rhythm applies to the outer wings; bigger cubes just have more inner-wing groups, but the last-8 finish is identical. 3-2-3 keeps the slice count low and your finished cross/centers safe — when all 8 are done, every dedge behaves like one 3×3 edge.`
      ]};
    LESSONS[id+'/yau/3x3'] = { type:'text', title:'Yau — 3×3 Stage',
      intro:[
        `The ${nm} is now <b>reduced</b> and you already have a cross — so solve it as a <b>3×3</b>: F2L, then OLL, then PLL, using <b>wide turns</b> where needed so paired edges and centers move together.`,
        'With Yau’s early cross, this last stage feels just like a slightly longer 3×3 solve — you skip straight to F2L because the cross was built back in step 2.',
        even
          ? `Being an <b>even</b> cube, the ${nm} can hit <b>OLL parity and PLL parity</b> during the last layer — see the next lesson.`
          : `Being an <b>odd</b> cube, the ${nm} can hit <b>OLL parity</b> (a single flipped dedge) but never PLL parity — see the next lesson.`
      ]};
    LESSONS[id+'/yau/parity'] = { type:'algo', title:'Yau — Parity',
      intro:[
        even
          ? `Because the ${nm} is an <b>even</b> cube with no fixed centers, the reduced 3×3 stage can show two states that are impossible on a real 3×3 — <b>OLL parity</b> and <b>PLL parity</b>. Each is fixed by one algorithm; pick a case and press <b>Play</b> to watch it on the cube.`
          : `Because the ${nm} is an <b>odd</b> cube, the reduced 3×3 stage can show <b>OLL parity only</b> — a single flipped dedge. There is <b>no PLL parity</b> on odd cubes. Press <b>Play</b> to watch the fix.`,
        '<b>OLL parity</b> — a single last-layer dedge appears flipped during orientation. ' + (even ? '<b>PLL parity</b> — two dedges (or two pairs) appear swapped during permutation; run it, then finish with your normal PLL.' : 'Run OLL parity, then orient and permute the last layer as a normal 3×3.')
      ],
      sections:[
        { head: even ? 'The two parity cases' : 'The parity case', algs: even ? [
          { name:'OLL parity (one flipped dedge)', moves:OLL_PARITY_44, note:'Run this when a single last-layer dedge is flipped during OLL. (r and l are wide / 2-layer turns.)' },
          { name:'PLL parity (two swapped dedges)', moves:PLL_PARITY_44, note:'Run this when two last-layer dedges need swapping — then finish with your normal PLL.' },
        ] : [
          { name:'OLL parity (one flipped dedge)', moves:OLL_PARITY_44, note:'The only parity on an odd cube: run it when a single last-layer dedge is flipped, then finish the 3×3 normally.' },
        ]},
      ]};
  });

  /* ===================== HOYA (4×4–7×7) =====================
     Centers-first reduction variant: 2 opposite centers + cross, then the
     remaining centers, then edges. */
  [['4x4','4×4',true],['5x5','5×5',false],['6x6','6×6',true],['7x7','7×7',false]]
    .forEach(([id,nm,even]) => {
    LESSONS[id+'/hoya/centers2'] = { type:'text', title:'Hoya — 2 Opposite Centers',
      intro:[
        `<b>Hoya</b> is a centers-first reduction variant for the ${nm}, an alternative to Yau that many solvers find more ergonomic. It starts by building <b>two opposite centers</b> and holding them on the <b>bottom and top</b> (Hoya’s signature is keeping a center on the <b>D face</b> as an anchor).`,
        'Solve the first center, then its opposite, keeping the standard scheme (white opposite yellow, etc.). Unlike Yau you don’t put them on L/R — Hoya keeps one on the bottom so the cross can be built around it next.',
        'This step is entirely <b>intuitive</b> — each center is a block of pieces assembled with wide turns.'
      ]};
    LESSONS[id+'/hoya/cross'] = { type:'text', title:'Hoya — Cross',
      intro:[
        'With two opposite centers in place (one on the bottom), build the <b>cross</b> against the bottom center — pair and place the four cross dedges early, just like Yau, but referenced to the D-face center you anchored.',
        'Building the cross now (before the remaining centers) is what makes Hoya a “cross-early” method: you reach the 3×3 stage already holding a cross, ready for F2L.',
        'Use <code>Uw</code> / <code>Rw</code> slices to pair the cross dedges, keeping the two opposite centers and the forming cross intact.'
      ]};
    LESSONS[id+'/hoya/centers4'] = { type:'text', title:'Hoya — Remaining Centers',
      intro:[
        'Now build the <b>remaining four centers</b> (the belt around the middle) <b>without disturbing</b> the cross or the two opposite centers you already solved.',
        `On the ${nm} these centers are larger, so this is the heaviest center step; tuck finished pairs away with wide slice + slice-back moves so the bottom cross stays put.`,
        'Use the colors of the two solved opposite centers to place the belt centers correctly. Still intuitive — no algorithms.'
      ]};
    LESSONS[id+'/hoya/edges'] = { type:'text', title:'Hoya — Edge Pairing',
      intro:[
        'With all centers built and the cross down, <b>pair the remaining dedges</b> exactly as in Reduction/Yau: shuttle matching wings together with slice moves and join them, protecting the cross and centers with the slice-back.',
        'The same <b>3-2-3</b> batching finishes the last 8 edges efficiently. When everything is paired the cube is reduced to a 3×3 with a cross already in place.',
        even
          ? `As an <b>even</b> cube the ${nm} can still leave <b>OLL and PLL parity</b> at the 3×3 stage — fix them with the Yau/Reduction parity algorithms.`
          : `As an <b>odd</b> cube the ${nm} can only leave <b>OLL parity</b> (a single flipped dedge) — no PLL parity.`
      ]};
  });

  /* ===================== MEYER (4×4–7×7) =====================
     A Yau/Hoya hybrid. */
  [['4x4','4×4'],['5x5','5×5'],['6x6','6×6'],['7x7','7×7']].forEach(([id,nm]) => {
    LESSONS[id+'/meyer/overview'] = { type:'text', title:'Meyer — Overview',
      intro:[
        `<b>Meyer</b> is a <b>Yau/Hoya hybrid</b> reduction method for the ${nm}. Like both parents it builds the <b>cross early</b>, but it blends Yau’s opening with Hoya’s center handling to balance look-ahead and ergonomics.`,
        'The flow is: solve <b>two opposite centers</b>, build <b>two of the cross dedges</b>, then solve the <b>remaining four centers</b> Hoya-style around the partial cross, finishing the cross as you go — then pair the rest of the edges and solve the 3×3.',
        'The idea is to keep the cross-early advantage (straight into F2L) while organising the center build so there’s less restriction than pure Yau. It’s an advanced choice — learn Yau and Hoya first, then try Meyer to see which fits your turning style.'
      ]};
    LESSONS[id+'/meyer/centers2'] = { type:'text', title:'Meyer — 2 Centers',
      intro:[
        'Start like Yau: build <b>two opposite centers</b>. Meyer holds them so you can comfortably attack a couple of cross dedges next, then transition into Hoya-style center building for the remaining four.',
        'Keep the standard color scheme and build intuitively with wide turns.'
      ]};
    LESSONS[id+'/meyer/cross'] = { type:'text', title:'Meyer — Cross + Centers',
      intro:[
        'Build <b>part of the cross</b> (a couple of cross dedges), then solve the <b>remaining four centers</b> Hoya-style around them, completing the cross during the process. This interleaving is the Meyer hybrid in action.',
        'Throughout, protect what’s solved with slice + slice-back moves. You finish this stage with all centers built and a full cross — reduced and cross-ready.'
      ]};
    LESSONS[id+'/meyer/edges'] = { type:'text', title:'Meyer — Edge Pairing',
      intro:[
        'Finish by <b>pairing the remaining dedges</b> just like Yau/Hoya, using the <b>3-2-3</b> batching for the last 8. Then solve the 3×3 stage (F2L from the existing cross, OLL, PLL).',
        'Parity at the 3×3 stage is the same as any big cube: even cubes can show OLL + PLL parity, odd cubes only OLL parity — see the Yau parity lesson for the algorithms.'
      ]};
  });

  /* ===================== K4 (4×4) =====================
     Advanced direct-solving / commutator method, 4×4-focused. */
  LESSONS['4x4/k4/intro'] = { type:'text', title:'K4 — Overview',
    intro:[
      '<b>K4</b> is an <b>advanced direct-solving</b> method for the 4×4 — it is <b>not</b> reduction. Instead of turning the cube into a 3×3 first, K4 solves pieces more or less in their final places using <b>commutators</b>, much like blindfolded 3-style. It’s prized for very low move counts but demands strong commutator intuition.',
      'The broad outline: build <b>two opposite centers + a partial first two layers</b> (corners and their wings) directly, then finish the remaining centers, then solve the rest of the edges and the last layer with <b>commutators / conjugates</b> rather than reduction edge-pairing.',
      'K4 has a steep learning curve and is mostly used by enthusiasts chasing move-count efficiency, not raw speed. Treat it as a deep-end project after you’re comfortable with reduction and a cross-early method.'
    ]};
  LESSONS['4x4/k4/f2l'] = { type:'text', title:'K4 — Centers & First Two Layers',
    intro:[
      'Begin with <b>two opposite centers</b>, then build the <b>first two layers directly</b> — placing corners together with their adjacent wing edges in their solved positions (no reduction). This is intuitive block-building plus a few insertion tricks.',
      'Because you’re solving real positions rather than reducing, you must keep the unsolved centers and edges manoeuvrable. Solvers typically finish the four belt centers around this stage, keeping the built layers intact.',
      'The payoff for this harder opening is that the finish is pure commutator work with almost no parity handling.'
    ]};
  LESSONS['4x4/k4/ll'] = { type:'text', title:'K4 — Last Layer (Commutators)',
    intro:[
      'Finish the cube with <b>commutators and conjugates</b>: solve the remaining edges (wings + their pairing) and the last-layer corners/edges as <b>3-cycles</b>, exactly the way 3-style blindfolded solving cycles pieces — A B A′ B′ sequences that move three pieces and leave the rest untouched.',
      'Because K4 never reduces, the usual 4×4 <b>OLL/PLL parity is handled implicitly</b> by the commutators (you place pieces directly, so there’s no last-layer “impossible” edge flip to fix with a long parity alg).',
      'This step is where K4’s difficulty lives — you derive cycles on the fly rather than recall a fixed list. Build the skill on corner 3-cycles first, then wings, then mixed cases.'
    ]};
})();
