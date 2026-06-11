/* ================================================================
   Non-cube puzzle simulators — Square-1 and Clock.
   The N×N CSS-3D engine can't represent these, so each is drawn as
   an accurate SVG (the conventional way both puzzles are diagrammed):
   Square-1 as top-down wedge circles, Clock as its two dial faces.
   Each factory returns { reset, applyTokens, setTokens, svg, scramble }
   so the trainer can show a scramble state and lessons can step algs.
   Pure SVG + state math — no DOM/engine dependency. Loaded before app.js.
   ================================================================ */

/* ---- shared 3-D camera helpers (used by the polyhedral sims: Skewb, Megaminx, Square-1) ---- */
function _rmat3(rxd, ryd) {                 // CSS-style rotateX(rx)·rotateY(ry) as a 3×3
  const rX=rxd*Math.PI/180, rY=ryd*Math.PI/180;
  const Rx=[[1,0,0],[0,Math.cos(rX),-Math.sin(rX)],[0,Math.sin(rX),Math.cos(rX)]];
  const Ry=[[Math.cos(rY),0,Math.sin(rY)],[0,1,0],[-Math.sin(rY),0,Math.cos(rY)]];
  return Rx.map(r=>[0,1,2].map(j=>r[0]*Ry[0][j]+r[1]*Ry[1][j]+r[2]*Ry[2][j]));
}
const _ap3=(M,p)=>[M[0][0]*p[0]+M[0][1]*p[1]+M[0][2]*p[2], M[1][0]*p[0]+M[1][1]*p[1]+M[1][2]*p[2], M[2][0]*p[0]+M[2][1]*p[1]+M[2][2]*p[2]];
const _avg3=pts=>{ const s=pts.reduce((a,p)=>[a[0]+p[0],a[1]+p[1],a[2]+p[2]],[0,0,0]); return [s[0]/pts.length,s[1]/pts.length,s[2]/pts.length]; };
const _mid3=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
function _rotAxis(p, k, ang) {               // Rodrigues: rotate point p about UNIT axis k by ang (radians) — for turn animations
  const c=Math.cos(ang), s=Math.sin(ang), d=k[0]*p[0]+k[1]*p[1]+k[2]*p[2];
  const cx=k[1]*p[2]-k[2]*p[1], cy=k[2]*p[0]-k[0]*p[2], cz=k[0]*p[1]-k[1]*p[0];
  return [ p[0]*c+cx*s+k[0]*d*(1-c), p[1]*c+cy*s+k[1]*d*(1-c), p[2]*c+cz*s+k[2]*d*(1-c) ];
}
const _lerp3=(a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];

/* ---- shared SVG helpers ---- */
function _polar(cx, cy, r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r*Math.cos(a), cy + r*Math.sin(a)]; }
function _wedge(cx, cy, rIn, rOut, a0, a1) {           // annular wedge path between angles a0..a1 (degrees, clockwise)
  const [x0o,y0o]=_polar(cx,cy,rOut,a0), [x1o,y1o]=_polar(cx,cy,rOut,a1);
  const [x1i,y1i]=_polar(cx,cy,rIn,a1),  [x0i,y0i]=_polar(cx,cy,rIn,a0);
  const big = (a1-a0) > 180 ? 1 : 0;
  return `M${x0o.toFixed(2)},${y0o.toFixed(2)} A${rOut},${rOut} 0 ${big} 1 ${x1o.toFixed(2)},${y1o.toFixed(2)} `
       + `L${x1i.toFixed(2)},${y1i.toFixed(2)} A${rIn},${rIn} 0 ${big} 0 ${x0i.toFixed(2)},${y0i.toFixed(2)} Z`;
}

/* ================================================================
   SQUARE-1
   Each layer is 12 thirty-degree slots (index 0 at 12 o'clock, clockwise).
   A corner piece fills 2 adjacent slots; an edge fills 1. Slots store a
   piece id; a corner appears in two consecutive slots. Moves:
     (a,b) : rotate top by a slots, bottom by b slots  (clockwise +)
     /     : flip the RIGHT half (slots 0..5) of the two layers together.
   ================================================================ */
function makeSquare1() {
  // piece catalogue: 8 corners (span 2) + 8 edges (span 1). 0..7 top, 8..15 bottom.
  // SIDE[1] & SIDE[3] are the two opposite faces the slash plane bisects (the "cut" faces) → orange & red;
  // SIDE[0] & SIDE[2] are the un-cut faces → blue & green.
  const FT = '#f3d019', FB = '#f7f7f7', SIDE = ['#1769d6', '#e8821b', '#16a34a', '#d22'];
  const TC = { x:90, y:66 }, BC = { x:230, y:66 }, R = 52, rIn = 14;     // layer centres + radii
  // build a solved layer: alternating corner,edge around → slots
  function solvedLayer(faceTop, base) {              // base id offset (0 top, 8 bottom)
    const slots = []; const pieces = [];
    for (let k=0; k<4; k++) {                          // 4 (corner,edge) groups
      const c = base + k, e = base + 4 + k;
      // colours chosen so the solved side FACES are contiguous 90° arcs (slots 3f+1..3f+3 share SIDE[f]):
      // corner's near half = previous face's colour, far half = this face's colour; edge = this face's colour.
      pieces[c] = { type:'C', face:faceTop, s1:SIDE[(k+3)%4], s2:SIDE[k] };
      pieces[e] = { type:'E', face:faceTop, s1:SIDE[k] };
      slots.push(c, c, e);                              // corner spans 2 slots, edge 1
    }
    return { slots, pieces };
  }
  let top, bot, PIECES, mid, CFLIP;     // mid = slice-layer orientation; CFLIP = per-corner mirror parity (odd # of slashes)
  function reset() {
    const T = solvedLayer(FT, 0), B = solvedLayer(FB, 8);
    top = T.slots.slice(); bot = B.slots.slice();
    PIECES = Object.assign({}, T.pieces, B.pieces); mid = 0; CFLIP = {};
  }
  const rot = (arr, n) => { n = ((n % 12) + 12) % 12; return arr.slice(n).concat(arr.slice(0, n)); };
  const cutClear = arr => arr[0] !== arr[11] && arr[5] !== arr[6];     // no corner straddling either cut
  function slash() {                                   // swap right halves (slots 0..5); flips the slice layer
    const moved = new Set();                           // right-half pieces are mirrored by the 180° flip
    for (let i = 0; i < 6; i++) { moved.add(top[i]); moved.add(bot[i]); }
    for (let i = 0; i < 6; i++) { const t = top[i]; top[i] = bot[5-i]; bot[5-i] = t; }
    moved.forEach(id => { if (PIECES[id] && PIECES[id].type === 'C') CFLIP[id] ^= 1; });   // toggle corner mirror parity once per piece
    mid ^= 1;
  }
  function applyTokens(tokens) {
    tokens.forEach(tok => {
      if (tok === '/') { slash(); return; }
      const m = tok.match(/^\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/);
      if (m) { top = rot(top, -(+m[1])); bot = rot(bot, -(+m[2])); }   // clockwise + → shift left in array
    });
  }
  const setTokens = t => { reset(); applyTokens(t); };
  function scramble(turns) {                            // generate a LEGAL (a,b)/ sequence
    reset(); const seq = []; turns = turns || 13;
    const norm = v => { v = ((v % 12) + 12) % 12; return v > 6 ? v - 12 : v; };   // → -5..6, clockwise +
    for (let n = 0; n < turns; n++) {
      const aOpts = [], bOpts = [];
      for (let a = 0; a < 12; a++) if (cutClear(rot(top, a))) aOpts.push(a);
      for (let b = 0; b < 12; b++) if (cutClear(rot(bot, b))) bOpts.push(b);
      let a, b, tries = 0;
      do { a = aOpts[Math.floor(Math.random()*aOpts.length)];
           b = bOpts[Math.floor(Math.random()*bOpts.length)]; tries++;
      } while (!(norm(-a) || norm(-b)) && tries < 20);     // avoid a (0,0) no-op before the slash
      top = rot(top, a); bot = rot(bot, b);
      seq.push(`(${norm(-a)},${norm(-b)})`, '/');
      slash();
    }
    setTokens(seq);                    // leave sim showing the scrambled state
    return seq;
  }
  /* ----- rendering (split so pieces can rotate under a fixed rim/ring/cut line) ----- */
  function piecesSVG(arr, cx, cy) {    // wedges + dividers, PER-SLOT (robust to mid-alg split corners)
    let out = '';
    for (let i = 0; i < 12; i++) {
      const pc = PIECES[arr[i]]; const a0 = i*30, a1 = (i+1)*30;
      out += `<path d="${_wedge(cx,cy,rIn,R,a0,a1)}" fill="${pc.face}" class="sq-pc"/>`;
      const secondHalf = pc.type === 'C' && arr[(i+11)%12] === arr[i];   // 2nd slot of a corner → its other side colour
      out += `<path d="${_wedge(cx,cy,R-7,R,a0,a1)}" fill="${secondHalf ? pc.s2 : pc.s1}" class="sq-band"/>`;
    }
    for (let i = 0; i < 12; i++) if (arr[i] !== arr[(i+11)%12]) {        // dividers only between different pieces
      const [x1,y1]=_polar(cx,cy,rIn,i*30), [x2,y2]=_polar(cx,cy,R,i*30);
      out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="sq-div"/>`;
    }
    return out;
  }
  const rimSVG   = (cx,cy)       => `<circle cx="${cx}" cy="${cy}" r="${R+3}" class="sq-rim"/>`;
  const frontSVG = (cx,cy,label) => `<circle cx="${cx}" cy="${cy}" r="${R}" class="sq-ring"/>`
      + `<line x1="${cx}" y1="${cy-R-6}" x2="${cx}" y2="${cy+R+6}" class="sq-cut"/>`
      + `<text x="${cx}" y="${cy+R+22}" class="sq-lab">${label}</text>`;
  /* slice-(equator-)layer indicator between the two halves, drawn as its top-down silhouette:
     a clean SQUARE when "fixed" (home / cube shape), and the offset "ship" (boat hull) shape once a
     slash has knocked it out of square — e.g. solved → (0,0)/(0,0). */
  function midSVG() {
    const cx = (TC.x+BC.x)/2, cy = TC.y, s = 13, fixed = mid === 0;
    const d = fixed
      ? `M${cx-s},${cy-s} L${cx+s},${cy-s} L${cx+s},${cy+s} L${cx-s},${cy+s} Z`          // square
      : `M${cx},${cy-s} L${cx+s},${cy+s} L${cx},${cy+s-7} L${cx-s},${cy+s} Z`;          // ship: convex back peak, 2 lines inward to a concave notch
    const sliceBottom = fixed ? cy+s : cy+s-7;                                            // keep the slice line inside the notch
    return `<text x="${cx}" y="${cy-s-7}" class="sq-lab">slice</text>`
      + `<path d="${d}" class="sq-mid ${fixed?'fixed':'ship'}"/>`                         // grey "pieces" (filled via CSS)
      + `<line x1="${cx}" y1="${cy-s}" x2="${cx}" y2="${sliceBottom}" class="sq-mid-slice"/>`   // green slice/cut line through the middle
      + `<text x="${cx}" y="${cy+s+15}" class="sq-lab">${fixed?'fixed':'not fixed'}</text>`;
  }
  function svg() {
    return `<svg viewBox="0 0 320 150" xmlns="http://www.w3.org/2000/svg" class="sim-svg">
      ${rimSVG(TC.x,TC.y)}${rimSVG(BC.x,BC.y)}
      <g class="sq-layer" id="sq-top">${piecesSVG(top, TC.x, TC.y)}</g>
      <g class="sq-layer" id="sq-bot">${piecesSVG(bot, BC.x, BC.y)}</g>
      ${frontSVG(TC.x,TC.y,'Top')}${frontSVG(BC.x,BC.y,'Bottom')}
      ${midSVG()}
    </svg>`;
  }
  /* ----- mount + animation (lesson player drives this; trainer just calls svg()) ----- */
  let container = null;
  const mount  = el => { container = el; render(); };
  const render = () => { if (container) container.innerHTML = svg(); };
  function animateMove(token, dur) {
    return new Promise(resolve => {
      if (!container) { applyTokens([token]); return resolve(); }
      if (token === '/') {                               // quick fade to read the swap
        const el = container.querySelector('svg');
        if (el) { el.style.transition = 'opacity 110ms'; el.style.opacity = '0.3'; }
        setTimeout(() => { applyTokens(['/']); render(); resolve(); }, 150);
        return;
      }
      const m = token.match(/^\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/);
      if (!m) { applyTokens([token]); render(); return resolve(); }
      const aDeg = (+m[1])*30, bDeg = (+m[2])*30;        // clockwise + (matches the array shift)
      const gT = container.querySelector('#sq-top'), gB = container.querySelector('#sq-bot');
      const D = Math.max(160, dur || 300); let t0 = null;
      function frame(now) {
        if (t0 === null) t0 = now;
        const k = Math.min(1, (now - t0) / D);
        const e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k+2, 2)/2;   // ease-in-out
        if (gT) gT.setAttribute('transform', `rotate(${(aDeg*e).toFixed(2)} ${TC.x} ${TC.y})`);
        if (gB) gB.setAttribute('transform', `rotate(${(bDeg*e).toFixed(2)} ${BC.x} ${BC.y})`);
        if (k < 1) requestAnimationFrame(frame);
        else { applyTokens([token]); render(); resolve(); }
      }
      requestAnimationFrame(frame);
    });
  }
  /* ----- 3-D interactive view (cylinder/prism model) for the Virtual Cube playground ----- */
  function isSolved() {
    if (mid !== 0) return false;                            // must be cube-shaped
    const tf = PIECES[top[0]].face; if (!top.every(s => PIECES[s].face === tf)) return false;
    const bf = PIECES[bot[0]].face; if (!bot.every(s => PIECES[s].face === bf)) return false;
    if (tf === bf) return false;
    const sideOf = (arr,i) => { const pc=PIECES[arr[i]]; return (pc.type==='C' && arr[(i+11)%12]===arr[i]) ? pc.s2 : pc.s1; };
    const sT = top.map((_,i)=>sideOf(top,i)), sB = bot.map((_,i)=>sideOf(bot,i));
    for (let i=0;i<12;i++) if (sT[i] !== sB[i]) return false;     // side colours line up top↔bottom
    for (let off=0; off<3; off++) {                          // side colours form 4 contiguous 90° faces
      let ok=true;
      for (let f=0; f<4 && ok; f++){ const c=sT[(off+f*3)%12]; for (let s=0;s<3;s++) if (sT[(off+f*3+s)%12]!==c) ok=false; }
      if (ok) return true;
    }
    return false;
  }
  const solvedSideCol = i => SIDE[(((Math.floor((i-1+12)/3))%4)+4)%4];   // static middle-band colour per slot
  let rx=60, ry=-30; const DEF3=[60,-30], CX3=160, CY3=150, SC3=78;
  const SQ2=Math.SQRT2, SC=1/Math.cos(Math.PI/12);  // SC≈1.035 = where the square edge crosses a slot boundary; cube corners at √2
  const TY=0.95, TS=0.30, BY=-0.95, BS=-0.30;
  let spinTop=0, spinBot=0;                          // live extra rotation (deg) of each layer — for drag + snap animation
  let slashAng=0, slashing=false;                    // slash animation: rotate the right half (slots 0–5) about the depth axis
  const rotZ=(p,deg)=>{ const t=deg*Math.PI/180, c=Math.cos(t), s=Math.sin(t); return [p[0]*c-p[1]*s, p[0]*s+p[1]*c, p[2]]; };
  /* PIECE-BASED render: each piece (corner kite / edge triangle) emits only its OUTER surfaces (top cap + the
     outer side walls). Internal radial walls touch neighbours, so they're never drawn — pieces share boundary
     vertices, which removes all seams and the centre hole "for free". A layer's `spin` rotates every piece in it.
     During a slash, the right-half pieces (start slot < 6) rotate 180° about the depth axis — this is exactly the
     (x,y,z)→(−x,−y,z) map that the top[i]↔bot[5−i] swap performs, so the animation lands seamlessly on the commit. */
  function svg3d() {
    const M=_rmat3(rx,ry);
    const proj=P=>{ const r=_ap3(M,P); return [CX3+SC3*r[0], CY3-SC3*r[1], r[2]]; };
    const PT=(r,deg,y)=>{ const t=deg*Math.PI/180; return [r*Math.cos(t), y, r*Math.sin(t)]; };
    const polys=[];
    const add=(N,pts,color,attr)=>{
      // Derive the TRUE face normal from the polygon's own edges (correct for the slanted kite walls and the
      // zig-zag slice band, where a radial approximation mis-culls). Use the supplied N only to orient outward.
      const k=pts.length-1;
      const e1=[pts[1][0]-pts[0][0],pts[1][1]-pts[0][1],pts[1][2]-pts[0][2]];
      const e2=[pts[k][0]-pts[0][0],pts[k][1]-pts[0][1],pts[k][2]-pts[0][2]];
      let fn=[e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]];
      const L=Math.hypot(fn[0],fn[1],fn[2])||1; fn=[fn[0]/L,fn[1]/L,fn[2]/L];
      if (fn[0]*N[0]+fn[1]*N[1]+fn[2]*N[2] < 0) fn=[-fn[0],-fn[1],-fn[2]];
      const n=_ap3(M,fn); if (n[2] <= 0.012) return;
      const pj=pts.map(proj); const depth=pj.reduce((a,p)=>a+p[2],0)/pj.length;
      polys.push([depth, `<polygon points="${pj.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="${color}" class="poly-fl"${attr||''}/>`]); };
    const wall=(d0,r0,d1,r1,yb,yt,color,attr)=>{ const md=(d0+d1)/2, nr=[Math.cos(md*Math.PI/180),0,Math.sin(md*Math.PI/180)];
      add(nr, [PT(r0,d0,yb),PT(r1,d1,yb),PT(r1,d1,yt),PT(r0,d0,yt)], color, attr); };
    const emit=(arr,capY,shoY,name,spin)=>{ const ny=capY>0?1:-1;
      for (let i=0;i<12;i++){ const id=arr[i]; if (arr[(i+11)%12]===id) continue;     // only at a piece's START slot
        const pc=PIECES[id], isC=pc.type==='C', span=isC?2:1, attr=` data-layer="${name}" data-slot="${i}"`;
        const tf = (slashAng && i<6) ? (p=>rotZ(p,slashAng)) : (p=>p);                 // right half flips during a slash
        const a0=i*30+spin, a1=i*30+span*30+spin, ac=(a0+a1)/2;
        const W=(d0,r0,d1,r1,color)=>{ const md=(d0+d1)/2;
          add(tf([Math.cos(md*Math.PI/180),0,Math.sin(md*Math.PI/180)]),
              [PT(r0,d0,shoY),PT(r1,d1,shoY),PT(r1,d1,capY),PT(r0,d0,capY)].map(tf), color, attr); };
        if (isC){
          add(tf([0,ny,0]), [PT(0,ac,capY),PT(SC,a0,capY),PT(SQ2,ac,capY),PT(SC,a1,capY)].map(tf), pc.face, attr);   // kite cap
          const fl = CFLIP[id] ? 1 : 0;                                                // a mirrored corner shows its two side colours in swapped order
          W(a0,SC,ac,SQ2, fl?pc.s2:pc.s1); W(ac,SQ2,a1,SC, fl?pc.s1:pc.s2);            // two side walls
        } else {
          add(tf([0,ny,0]), [PT(0,ac,capY),PT(SC,a0,capY),PT(SC,a1,capY)].map(tf), pc.face, attr); // triangle cap
          W(a0,SC,a1,SC, pc.s1);                                                       // square-edge wall
        } } };
    emit(top, TY, TS, 'top', spinTop);
    emit(bot, BY, BS, 'bot', spinBot);
    const bandOuter=i=>{ const m=i%3, a0=i*30, a1=a0+30;                              // a slot's slice outline (corners → √2, flush with the layers)
      return m===2 ? [[SC,a0],[SC,a1]] : m===0 ? [[SC,a0],[SQ2,a1]] : [[SQ2,a0],[SC,a1]]; };
    // group slots into CONTINUOUS runs, breaking only at colour changes (face corners) and the slash plane (slots 0 & 6).
    // → the two cut faces (orange=SIDE[1], red=SIDE[3]) split into continuous right/left slice pieces; blue/green stay whole; no internal slot seams.
    const runs=[]; let cur=null;
    for (let i=0;i<12;i++){ if (i===0 || i===6 || solvedSideCol(i)!==solvedSideCol((i+11)%12) || !cur) { cur=[]; runs.push(cur); } cur.push(i); }
    runs.forEach(run => {
      const out=[]; run.forEach((i,k)=>{ const seg=bandOuter(i); if (k===0) out.push(seg[0]); out.push(seg[1]); });
      // the right-half slice (slots 0–5) flips WITH the slash: persistent `mid`*180 lands the 0→180 tween seamlessly.
      const ba = run[0]<6 ? (mid*180 + slashAng) : 0, tf = ba ? (p=>rotZ(p,ba)) : (p=>p);
      const md=(out[0][1]+out[out.length-1][1])/2; let nr=[Math.cos(md*Math.PI/180),0,Math.sin(md*Math.PI/180)]; if (ba) nr=rotZ(nr,ba);
      const poly=out.map(([r,d])=>PT(r,d,BS)).concat(out.map(([r,d])=>PT(r,d,TS)).reverse()).map(tf);
      add(nr, poly, solvedSideCol(run[0]), ` data-slash="1"`); });
    polys.sort((a,b)=>a[0]-b[0]);
    return `<svg viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg" class="sim-svg">${polys.map(p=>p[1]).join('')}</svg>`;
  }
  const turnLayer=(which,steps)=>{ steps=((steps%12)+12)%12; if(!steps) return; applyTokens([which==='bot'?`(0,${steps})`:`(${steps},0)`]); };
  const setSpin=(name,deg)=>{ if(name==='bot') spinBot=deg; else spinTop=deg; };
  /* tween a dragged layer's live spin to the nearest 30° step, then commit it as a real (a,b) move */
  function snapTurn(name, deg, onFrame, onDone) {
    const target = Math.round(deg/30)*30; let start=null;
    const step = now => { if (start===null) start=now; const k=Math.min(1,(now-start)/140);
      const e = k<.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2;
      setSpin(name, deg+(target-deg)*e); if (onFrame) onFrame();
      if (k<1) requestAnimationFrame(step);
      else { turnLayer(name, Math.round(target/30)); setSpin(name,0); if (onFrame) onFrame(); if (onDone) onDone(); } };  // commit slots match the spin sign → no jump
    requestAnimationFrame(step);
  }
  /* animate the slash: tween the right half 0→180° about the depth axis, then commit `/` (lands seamlessly) */
  function snapSlash(onFrame, onDone) {
    if (slashing) return; slashing=true; let start=null;
    const step = now => { if (start===null) start=now; const k=Math.min(1,(now-start)/300);
      const e = k<.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2; slashAng=180*e; if (onFrame) onFrame();
      if (k<1) requestAnimationFrame(step);
      else { applyTokens(['/']); slashAng=0; slashing=false; if (onFrame) onFrame(); if (onDone) onDone(); } };
    requestAnimationFrame(step);
  }
  const doSlash=()=>applyTokens(['/']);
  /* 3-D lesson player: mount the svg3d view and animate a token like the 2-D animateMove, so Square-1
     lessons use the new model instead of the top-down circles. `(a,b)` spins the layers; `/` flips the right half. */
  let container3d = null;
  const render3d = () => { if (container3d) container3d.innerHTML = svg3d(); };
  const mount3d  = el => { container3d = el; render3d(); };
  function animateMove3d(token, dur) {
    return new Promise(resolve => {
      if (!container3d) { applyTokens([token]); return resolve(); }
      if (token === '/') {
        let t0=null; const D=Math.max(220, dur||300);
        const step=now=>{ if(t0===null)t0=now; const k=Math.min(1,(now-t0)/D); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
          slashAng=180*e; render3d(); if(k<1) requestAnimationFrame(step); else { applyTokens(['/']); slashAng=0; render3d(); resolve(); } };
        requestAnimationFrame(step); return;
      }
      const m = token.match(/^\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/);
      if (!m) { applyTokens([token]); render3d(); return resolve(); }
      const aT=(+m[1])*30, bT=(+m[2])*30; let t0=null; const D=Math.max(160, dur||300);
      const step=now=>{ if(t0===null)t0=now; const k=Math.min(1,(now-t0)/D); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
        spinTop=aT*e; spinBot=bT*e; render3d(); if(k<1) requestAnimationFrame(step); else { applyTokens(token); spinTop=0; spinBot=0; render3d(); resolve(); } };
      requestAnimationFrame(step);
    });
  }
  const rotateView=(dx,dy)=>{ ry+=dx*0.5; rx-=dy*0.5; };
  const recenter=()=>{ rx=DEF3[0]; ry=DEF3[1]; };
  reset();
  return { reset, applyTokens, setTokens, svg, scramble, mount, render, animateMove,
           svg3d, mount3d, render3d, animateMove3d, isSolved, turnLayer, setSpin, snapTurn, snapSlash, slash:doSlash, rotateView, recenter };
}

/* ================================================================
   CLOCK
   9 front + 9 back dials (hours 0..11; 0 = solved/up) and 4 pins.
   Mechanics (physically faithful): a pin is one peg through the puzzle,
   so up-on-front = down-on-back. Turning a corner WHEEL rotates every
   clock flood-connected to it through UP pins on the operating side
   (a pin up couples its 2×2 quadrant). The wheel's axle also turns the
   SAME corner clock on the opposite side the other way (front+back of a
   corner are linked) — coupled there through that side's up pins.
   You can operate EITHER side: drag a corner clock on Front or Back.
   ================================================================ */
function makeClock() {
  const REG = { UL:[0,1,3,4], UR:[1,2,4,5], DL:[3,4,6,7], DR:[4,5,7,8] };   // pin → its 2×2 quadrant of clocks
  const MIRROR = { UL:'UR', UR:'UL', DL:'DR', DR:'DL' };   // a pin's position is column-flipped between the two faces
  const CORNER = { UL:0, UR:2, DL:6, DR:8 };               // corner wheel → clock index (in that face's own 3×3 frame)
  const FLIP = [2,1,0, 5,4,3, 8,7,6];                       // front index ↔ back-frame index (column flip)
  const PK = ['UL','UR','DL','DR'];
  const m12 = v => (((v % 12) + 12) % 12);
  let front, back, pins;       // front = viewed from front; back = viewed from back (already mirrored); pins = up(1)/down(0) toward FRONT
  function reset() { front = Array(9).fill(0); back = Array(9).fill(0); pins = { UL:1, UR:1, DL:1, DR:1 }; }
  function flood(start, engagedPins) {                      // clocks coupled to `start` through the engaged pins' quadrants
    const comp = new Set([start]); let changed = true;
    while (changed) { changed = false;
      engagedPins.forEach(p => { const reg = REG[p];
        if (reg.some(i => comp.has(i))) reg.forEach(i => { if (!comp.has(i)) { comp.add(i); changed = true; } }); }); }
    return comp;
  }
  const CORNERS = [0,2,6,8];                                // the 4 axle clock indices (a face's own frame)
  /* One unified gear graph over 18 signed nodes (0–8 front, 9–17 back): clocks in an engaged-pin quadrant
     gear together (same sign); each corner AXLE rigidly links front[c] ↔ back[FLIP[c]] with OPPOSITE sign
     and NO pin needed — so the 4 corner dials can never desync. Turning seeds the operated corner (+h) and
     propagates signs through the whole connected component. */
  function turn(side, cornerKey, hours) {                   // side: 'front' | 'back'
    const h = m12(hours); if (!h) return;
    const upFront = PK.filter(k => pins[k]);                // pins up toward the front operator
    const upBack  = PK.filter(k => !pins[k]).map(k => MIRROR[k]);   // pins up toward the back operator (in back frame)
    const adj = Array.from({length:18}, () => []);
    const link = (a,b,s) => { adj[a].push([b,s]); adj[b].push([a,s]); };
    upFront.forEach(p => { const reg=REG[p]; for (let j=1;j<reg.length;j++) link(reg[0], reg[j], 1); });
    upBack .forEach(p => { const reg=REG[p]; for (let j=1;j<reg.length;j++) link(9+reg[0], 9+reg[j], 1); });
    CORNERS.forEach(c => link(c, 9+FLIP[c], -1));           // axle: always coupled, opposite direction
    const sign = new Array(18).fill(null);
    const seed = (side==='back' ? 9 : 0) + CORNER[cornerKey];
    sign[seed]=1; const stack=[seed];
    while (stack.length) { const u=stack.pop(); adj[u].forEach(([v,s]) => { if (sign[v]===null) { sign[v]=sign[u]*s; stack.push(v); } }); }
    for (let i=0;i<9;i++) { if (sign[i]   !==null) front[i] = m12(front[i] + sign[i]*h);
                            if (sign[9+i] !==null) back[i]  = m12(back[i]  + sign[9+i]*h); }
  }
  /* token format (self-generated, replayable by setTokens):
       "(UL,UR)"  → set those pins up (the rest down)
       "F:UL:4" / "B:DR:-3" → turn that wheel from that side by ±hours */
  function applyTokens(tokens) {
    (Array.isArray(tokens) ? tokens : String(tokens).split(/\s+/)).filter(Boolean).forEach(tok => {
      if (tok[0] === '(') { const up = tok.replace(/[()]/g,'').split(',').filter(Boolean); PK.forEach(k => pins[k] = up.includes(k) ? 1 : 0); return; }
      const m = tok.match(/^([FB]):(UL|UR|DL|DR):(-?\d+)$/);
      if (m) turn(m[1]==='B' ? 'back' : 'front', m[2], +m[3]);
    });
  }
  const setTokens = t => { reset(); applyTokens(t); };
  function scramble() {                                     // built from real turns → always solvable & self-consistent
    reset(); const seq = [];
    for (let n = 0; n < 9; n++) {
      const up = PK.filter(() => Math.random() < 0.5);
      seq.push('(' + up.join(',') + ')'); PK.forEach(k => pins[k] = up.includes(k) ? 1 : 0);
      const side = Math.random() < 0.5 ? 'F' : 'B', ck = PK[Math.floor(Math.random()*4)];
      const mag = 1 + Math.floor(Math.random()*6), h = Math.random() < 0.5 ? mag : -mag;
      seq.push(`${side}:${ck}:${h}`); turn(side==='B'?'back':'front', ck, h);
    }
    const up = PK.filter(() => Math.random() < 0.5);        // final pin pattern (display only)
    seq.push('(' + up.join(',') + ')'); PK.forEach(k => pins[k] = up.includes(k) ? 1 : 0);
    if (isSolved()) return scramble();
    return seq;
  }
  function dial(cx, cy, hour) {
    const r = 21; let t = '';
    for (let h = 0; h < 12; h++) { const [x1,y1]=_polar(cx,cy,r-3,h*30), [x2,y2]=_polar(cx,cy,r,h*30);
      t += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="clk-tick"/>`; }
    const [hx,hy] = _polar(cx, cy, r-6, hour*30);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" class="clk-face ${hour===0?'clk-solved':''}"/>${t}`
         + `<line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" class="clk-hand"/>`
         + `<circle cx="${cx}" cy="${cy}" r="2" class="clk-pivot"/>`;
  }
  const CKEY = { 0:'UL', 2:'UR', 6:'DL', 8:'DR' };       // corner clock index → wheel key (in this face's own frame)
  // pinUpFn(k): is the pin at this face-frame corner k showing "up"?  pinKeyFn(k): which FRONT-frame pin it toggles.
  function faceSVG(arr, ox, oy, label, side, pinUpFn, pinKeyFn) {
    const sp = 50; let out = '';
    for (let i = 0; i < 9; i++) { const r = (i/3)|0, c = i%3;
      const d = dial(ox + c*sp + 25, oy + r*sp + 25, arr[i]);
      out += CKEY[i] ? `<g data-corner="${CKEY[i]}" data-side="${side}" class="clk-corner">${d}</g>` : d; }
    const pp = { UL:[0,0], UR:[1,0], DL:[0,1], DR:[1,1] };
    Object.keys(pp).forEach(k => { const [pc,pr]=pp[k]; const up = pinUpFn(k);
      out += `<circle cx="${ox + pc*sp + 50}" cy="${oy + pr*sp + 50}" r="5.5" class="clk-pin ${up?'clk-pin-up':''}" data-pin="${pinKeyFn(k)}"/>`; });
    out += `<text x="${ox + sp + 25}" y="${oy + 3*sp + 18}" class="sq-lab">${label}</text>`;
    return out;
  }
  function svg() {
    return `<svg viewBox="0 0 330 190" xmlns="http://www.w3.org/2000/svg" class="sim-svg">
      ${faceSVG(front, 5,   8, 'Front', 'F', k => !!pins[k],          k => k)}
      ${faceSVG(back,  180, 8, 'Back',  'B', k => !pins[MIRROR[k]],   k => MIRROR[k])}
    </svg>`;
  }
  /* ---- interactivity: click a pin to toggle it (single peg → both faces); drag a corner clock to turn that wheel ---- */
  function togglePin(k) { if (k in pins) pins[k] ^= 1; }
  const isSolved = () => front.every(v => v===0) && back.every(v => v===0);
  reset();
  return { reset, applyTokens, setTokens, svg, scramble, togglePin, turn, isSolved };
}

/* ================================================================
   PYRAMINX — facelet model (4 faces × 9), permutations generated
   from tetrahedron geometry and verified (move³ = identity,
   scramble+inverse solves). Rendered as the classic triforce net.
   ================================================================ */
function makePyraminx() {
  const COL = ['#16a34a','#1769d6','#d22','#f3d019'];   // F, Lf, Rf, D face colours
  const PERM = {
    U:[9,10,11,3,4,5,15,7,8,18,19,20,12,13,14,24,16,17,0,1,2,21,22,23,6,25,26,27,28,29,30,31,32,33,34,35],
    L:[0,29,2,27,28,5,6,33,8,9,10,4,12,1,3,15,16,7,18,19,20,21,22,23,24,25,26,14,11,13,30,31,32,17,34,35],
    R:[0,1,22,3,19,21,6,7,25,9,10,11,12,13,14,15,16,17,18,31,20,32,29,23,24,35,26,27,28,2,30,4,5,33,34,8],
    B:[0,1,2,3,4,5,6,7,8,9,28,11,30,31,14,15,34,17,18,19,13,21,10,12,24,25,16,27,22,29,23,20,32,33,26,35],
  };
  const TIP = {
    U:[9,1,2,3,4,5,6,7,8,18,10,11,12,13,14,15,16,17,0,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35],
    L:[0,1,2,27,4,5,6,7,8,9,10,11,12,13,3,15,16,17,18,19,20,21,22,23,24,25,26,14,28,29,30,31,32,33,34,35],
    R:[0,1,2,3,4,21,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,32,22,23,24,25,26,27,28,29,30,31,5,33,34,35],
    B:[0,1,2,3,4,5,6,7,8,9,10,11,30,13,14,15,16,17,18,19,20,21,22,12,24,25,26,27,28,29,23,31,32,33,34,35],
  };
  const T = 1/3, TT = 2/3;
  const GV = [ [[1,0,0],[TT,T,0],[TT,0,T]], [[TT,T,0],[T,TT,0],[T,T,T]], [[TT,0,T],[T,T,T],[T,0,TT]],
    [[T,TT,0],[0,1,0],[0,TT,T]], [[T,T,T],[0,TT,T],[0,T,TT]], [[T,0,TT],[0,T,TT],[0,0,1]],
    [[TT,T,0],[TT,0,T],[T,T,T]], [[T,TT,0],[T,T,T],[0,TT,T]], [[T,T,T],[T,0,TT],[0,T,TT]] ];
  let st;
  const reset = () => { st = Array.from({length:36}, (_,i)=>Math.floor(i/9)); };
  const applyPerm = p => { st = p.map(src => st[src]); };
  function applyTokens(tokens) {
    (Array.isArray(tokens)?tokens:String(tokens).split(/\s+/)).filter(Boolean).forEach(t => {
      const prime = t.includes("'"), V = t.replace(/['2]/g,'').toUpperCase();
      const tbl = (t[0] === t[0].toLowerCase() && /[ulrb]/.test(t[0])) ? TIP : PERM;
      if (!tbl[V]) return;
      applyPerm(tbl[V]); if (prime) applyPerm(tbl[V]);   // 120° move: prime = apply twice
    });
  }
  const setTokens = t => { reset(); applyTokens(t); };
  function scramble() {
    reset();
    const F=['U','L','R','B'], seq=[]; let last=null; const n = 8 + Math.floor(Math.random()*3);
    while (seq.length < n) { const f=F[Math.floor(Math.random()*4)]; if (f===last) continue; seq.push(f+(Math.random()<.5?"'":"")); last=f; }
    ['u','l','r','b'].forEach(t => { if (Math.random()<.66) seq.push(t + (Math.random()<.5?"'":"")); });
    applyTokens(seq); return seq;
  }
  const isSolved = () => [0,1,2,3].every(f => { const c=st[f*9]; for (let i=1;i<9;i++) if (st[f*9+i]!==c) return false; return true; });

  /* ---- 3-D render: regular tetrahedron in perspective, orbitable (clearer than a flat net) ---- */
  const VT = { U:[1,1,1], L:[1,-1,-1], R:[-1,1,-1], B:[-1,-1,1] };   // regular tetra (matches the generator)
  const FV = [['U','L','R'],['U','B','L'],['U','R','B'],['L','B','R']];                // face → 3 vertices (matches facelet faces 0–3)
  const FC = FV.map(([a,b,c]) => GV.map(tri => tri.map(([wa,wb,wc]) =>
    [VT[a][0]*wa+VT[b][0]*wb+VT[c][0]*wc, VT[a][1]*wa+VT[b][1]*wb+VT[c][1]*wc, VT[a][2]*wa+VT[b][2]*wb+VT[c][2]*wc])));
  const FN = FV.map(([a,b,c]) => [ (VT[a][0]+VT[b][0]+VT[c][0])/3, (VT[a][1]+VT[b][1]+VT[c][1])/3, (VT[a][2]+VT[b][2]+VT[c][2])/3 ]);
  let rx=48, ry=-46;          // shows 3 faces (verified), tip toward viewer
  const DEF=[48,-46];
  function rmat(rxd,ryd){ const rX=rxd*Math.PI/180, rY=ryd*Math.PI/180;
    const Rx=[[1,0,0],[0,Math.cos(rX),-Math.sin(rX)],[0,Math.sin(rX),Math.cos(rX)]];
    const Ry=[[Math.cos(rY),0,Math.sin(rY)],[0,1,0],[-Math.sin(rY),0,Math.cos(rY)]];
    return Rx.map((r,i)=>[0,1,2].map(j=>r[0]*Ry[0][j]+r[1]*Ry[1][j]+r[2]*Ry[2][j])); }
  const ap=(M,p)=>[M[0][0]*p[0]+M[0][1]*p[1]+M[0][2]*p[2], M[1][0]*p[0]+M[1][1]*p[1]+M[1][2]*p[2], M[2][0]*p[0]+M[2][1]*p[1]+M[2][2]*p[2]];
  const CX=160, CY=150, SC=72;
  const DOM=[0,0,0,1,1,2,0,1,2];     // facelet → which of the face's 3 vertices it belongs to (for click-to-turn)
  const TIPF={0:1,3:1,5:1};          // these facelets are the 3 TIP triangles (drag one → tip turn)
  let _anim=null;                              // {moving:Set(globalFaceletIdx), axis, ang} during a turn animation
  function svg() {
    const M=rmat(rx,ry);
    const proj=p=>{ const r=ap(M,p); return [CX+SC*r[0], CY+SC*r[1], r[2]]; };
    const faces=[];
    for (let f=0; f<4; f++) {
      for (let i=0;i<9;i++){
        const gi=f*9+i, mov=_anim&&_anim.moving.has(gi);
        const fnorm = mov ? _rotAxis(FN[f], _anim.axis, _anim.ang) : FN[f];
        if (ap(M, fnorm)[2] <= 0.02) continue;             // per-facelet cull
        const pts=FC[f][i].map(p=>{ let q=p; if (mov) q=_rotAxis(q, _anim.axis, _anim.ang); return proj(q); });
        const depth=pts.reduce((a,p)=>a+p[2],0)/3;
        faces.push([depth, `<polygon points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="${COL[st[gi]]}" class="pyra-fl" data-v="${FV[f][DOM[i]]}"${TIPF[i]?' data-tip="1"':''}/>`]);
      }
    }
    faces.sort((a,b)=>a[0]-b[0]);
    return `<svg viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg" class="sim-svg">${faces.map(x=>x[1]).join('')}</svg>`;
  }
  function moveInfo(token) {
    const prime = token.includes("'"); const V = token.replace(/['2]/g,'').toUpperCase();
    if (!VT[V]) return null;
    const isTip = token[0]===token[0].toLowerCase() && /[ulrb]/.test(token[0]);
    const tbl = isTip ? TIP : PERM, moving=new Set(); tbl[V].forEach((src,i)=>{ if(src!==i) moving.add(i); });
    const a=VT[V], l=Math.hypot(a[0],a[1],a[2]);
    return { axis:[a[0]/l,a[1]/l,a[2]/l], angleDeg: prime ? -120 : 120, moving };
  }
  function animateMove(token, dur, onFrame) {
    return new Promise(resolve => {
      const info = moveInfo(token);
      if (!info) { applyTokens([token]); onFrame&&onFrame(); return resolve(); }
      let t0=null; const D=Math.max(140, dur||300);
      const step=now=>{ if(t0===null)t0=now; const k=Math.min(1,(now-t0)/D); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
        _anim={ moving:info.moving, axis:info.axis, ang: info.angleDeg*e*Math.PI/180 }; onFrame&&onFrame();
        if(k<1) requestAnimationFrame(step); else { _anim=null; applyTokens([token]); onFrame&&onFrame(); resolve(); } };
      requestAnimationFrame(step);
    });
  }
  /* current screen positions of the 4 vertices → which vertex sits top / bottom-left / bottom-right / back
     (so keyboard moves can be camera-relative) */
  function screenRoles() {
    const M=rmat(rx,ry);
    const v = ['U','L','R','B'].map(k => { const r=ap(M, VT[k]); return { k, x:CX+SC*r[0], y:CY+SC*r[1] }; });
    v.sort((a,b)=>a.y-b.y);
    const rest = v.slice(1).sort((a,b)=>a.x-b.x);
    return { top:v[0].k, bl:rest[0].k, br:rest[2].k, back:rest[1].k };
  }
  const rotateView=(dx,dy)=>{ ry+=dx*0.5; rx-=dy*0.5; };
  const recenter=()=>{ rx=DEF[0]; ry=DEF[1]; };
  const nonUniform = () => { const out=[]; for(let f=0;f<4;f++){ const c=st[f*9]; for(let i=1;i<9;i++) if(st[f*9+i]!==c){out.push(f);break;} } return out; };
  reset();
  return { reset, applyTokens, setTokens, scramble, svg, isSolved, animateMove, rotateView, recenter, screenRoles, nonUniform, state:()=>st.slice() };
}

/* ================================================================
   SKEWB — 6 faces × 5 stickers (1 centre + 4 corner triangles) = 30.
   Any of the 8 corners is twistable (120°); drag a corner sticker to
   turn it. Permutations generated from cube geometry and verified
   (move³ = identity, scramble+inverse solves) — see _setup/gen-puzzles.js.
   ================================================================ */
function makeSkewb() {
  const COL = ['#d22020','#e8821b','#f7f7f7','#f3d019','#16a34a','#1769d6'];   // +X,-X,+Y,-Y,+Z,-Z
  const PERM = [[20,21,22,3,24,5,26,7,8,9,0,1,2,13,4,15,6,17,18,19,10,11,12,23,14,25,16,27,28,29],[10,13,2,11,12,5,6,19,8,9,25,29,26,27,14,15,16,17,18,21,20,7,22,23,24,0,4,1,28,3],[15,19,16,17,4,5,6,7,8,11,10,27,12,13,14,20,24,21,18,23,0,3,22,1,2,25,26,9,28,29],[25,1,26,27,28,5,6,7,24,9,10,11,8,13,14,0,4,17,2,3,20,21,22,23,12,15,18,19,16,29],[0,17,2,3,4,10,14,11,8,13,20,23,12,21,22,15,16,29,18,19,5,9,6,7,24,25,26,27,28,1],[0,1,2,3,22,25,28,29,26,9,5,11,6,7,8,15,16,17,4,19,20,21,18,23,24,10,14,27,12,13],[0,1,28,3,4,20,24,7,22,23,10,11,12,13,2,5,8,9,6,19,15,21,16,17,18,25,26,27,14,29],[0,1,2,13,4,15,6,17,18,19,10,11,12,23,14,25,16,27,28,29,20,21,22,3,24,5,26,7,8,9]];
  const FN=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const UV=[ [[0,1,0],[0,0,1]], [[0,0,1],[0,1,0]], [[0,0,1],[1,0,0]],
             [[1,0,0],[0,0,1]], [[1,0,0],[0,1,0]], [[0,1,0],[1,0,0]] ];
  const SS=[[1,1],[-1,1],[-1,-1],[1,-1]];
  const MOVE = { U:0, R:3, L:5, B:6 };                  // 4 WCA-style named corner turns (a tetrad)
  const cidx = p => (p[0]<0?4:0)+(p[1]<0?2:0)+(p[2]<0?1:0);    // cube corner → 0..7 index (matches generator's CORN order)
  let st;
  const reset = () => { st = Array.from({length:30}, (_,i)=>Math.floor(i/5)); };
  const applyPerm = p => { st = p.map(src => st[src]); };
  // LETTER tokens (U/R/L/B) are moves — strip their ' and 2 modifiers; bare DIGIT tokens are corner indices (only ' is a modifier, never strip the digit 2).
  const tokIdx = t => { const c=t.toUpperCase();
    if (/^[ULRB]/.test(c)) { const b=c.replace(/['2]/g,''); return (b in MOVE) ? MOVE[b] : -1; }
    const n=parseInt(c.replace(/'/g,''),10); return (n>=0&&n<8)?n:-1; };
  function applyTokens(tokens) {
    (Array.isArray(tokens)?tokens:String(tokens).split(/\s+/)).filter(Boolean).forEach(t => {
      const i = tokIdx(t); if (i<0) return;
      const dbl = t.includes("'") || (/[ULRB]/i.test(t) && t.includes('2'));   // 120° move: ' or (on a letter) 2 = apply twice (R2 = R′)
      applyPerm(PERM[i]); if (dbl) applyPerm(PERM[i]);
    });
  }
  const setTokens = t => { reset(); applyTokens(t); };
  function scramble() {
    reset(); const F=['U','R','L','B'], seq=[]; let last=null; const n = 9 + Math.floor(Math.random()*3);
    while (seq.length < n) { const f=F[Math.floor(Math.random()*4)]; if (f===last) continue; seq.push(f+(Math.random()<.5?"'":"")); last=f; }
    applyTokens(seq); return seq;
  }
  const isSolved = () => [0,1,2,3,4,5].every(f => { const c=st[f*5]; for (let i=1;i<5;i++) if (st[f*5+i]!==c) return false; return true; });
  // geometry per face (centroid order matches the generator: slot0 centre, 1..4 corners)
  function facePolys(f) {                                  // → [{poly:[3D pts], slot, corner|null}]
    const N=FN[f],[u,v]=UV[f];
    const C=SS.map(([sx,sy])=>[N[0]+u[0]*sx+v[0]*sy, N[1]+u[1]*sx+v[1]*sy, N[2]+u[2]*sx+v[2]*sy]);
    const M=C.map((c,k)=>_mid3(c,C[(k+1)%4]));
    const out=[{ poly:[M[0],M[1],M[2],M[3]], slot:0, corner:null }];
    for (let k=0;k<4;k++) out.push({ poly:[C[k],M[k],M[(k+3)%4]], slot:k+1, corner:cidx(C[k]) });
    return out;
  }
  let rx=28, ry=-32; const DEF=[28,-32], CX=160, CY=150, SC=86;
  let _anim=null;                              // {moving:Set(globalFaceletIdx), axis, ang} during a turn animation
  function svg() {
    const M=_rmat3(rx,ry);
    const proj=p=>{ const r=_ap3(M,p); return [CX+SC*r[0], CY+SC*r[1], r[2]]; };
    const faces=[];
    for (let f=0; f<6; f++) {
      facePolys(f).forEach(s => {
        const gi=f*5+s.slot, mov=_anim&&_anim.moving.has(gi);
        const fnorm = mov ? _rotAxis(FN[f], _anim.axis, _anim.ang) : FN[f];
        if (_ap3(M, fnorm)[2] <= 0.02) return;                         // per-facelet cull
        const pj=s.poly.map(p=>{ let q=_lerp3(FN[f], p, 0.9); if (mov) q=_rotAxis(q, _anim.axis, _anim.ang); return proj(q); });
        const depth=_avg3(pj)[2];
        faces.push([depth, `<polygon points="${pj.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="${COL[st[gi]]}" class="poly-fl"${s.corner!=null?` data-v="${s.corner}"`:''}/>`]);
      });
    }
    faces.sort((a,b)=>a[0]-b[0]);
    return `<svg viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg" class="sim-svg">${faces.map(x=>x[1]).join('')}</svg>`;
  }
  function moveInfo(token) {
    const i = tokIdx(token); if (i<0) return null;
    const prime = token.includes("'") || (/[ULRB]/i.test(token) && token.includes('2'));
    const moving=new Set(); PERM[i].forEach((src,j)=>{ if(src!==j) moving.add(j); });
    const ax=[(i&4)?-1:1, (i&2)?-1:1, (i&1)?-1:1], l=Math.hypot(ax[0],ax[1],ax[2]);   // corner index → cube-corner axis
    return { axis:[ax[0]/l,ax[1]/l,ax[2]/l], angleDeg: prime ? -120 : 120, moving };
  }
  function animateMove(token, dur, onFrame) {
    return new Promise(resolve => {
      const info = moveInfo(token);
      if (!info) { applyTokens([token]); onFrame&&onFrame(); return resolve(); }
      let t0=null; const D=Math.max(140, dur||300);
      const step=now=>{ if(t0===null)t0=now; const k=Math.min(1,(now-t0)/D); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
        _anim={ moving:info.moving, axis:info.axis, ang: info.angleDeg*e*Math.PI/180 }; onFrame&&onFrame();
        if(k<1) requestAnimationFrame(step); else { _anim=null; applyTokens([token]); onFrame&&onFrame(); resolve(); } };
      requestAnimationFrame(step);
    });
  }
  function screenRoles() {                                   // 4 on-screen corners → keyboard u/l/r/b
    const M=_rmat3(rx,ry); const CORN=[]; for(const x of[1,-1])for(const y of[1,-1])for(const z of[1,-1])CORN.push([x,y,z]);
    const v=CORN.map((c,i)=>{ const r=_ap3(M,c); return { i, x:CX+SC*r[0], y:CY+SC*r[1], z:r[2] }; });
    const front=v.filter(p=>p.z>0).sort((a,b)=>a.y-b.y);
    const top=front[0]||v[0];
    const lower=front.slice(1).sort((a,b)=>a.x-b.x);
    const back=v.slice().sort((a,b)=>a.z-b.z)[0];
    return { top:String(top.i), bl:String((lower[0]||top).i), br:String((lower[lower.length-1]||top).i), back:String(back.i) };
  }
  const rotateView=(dx,dy)=>{ ry+=dx*0.5; rx-=dy*0.5; };
  const recenter=()=>{ rx=DEF[0]; ry=DEF[1]; };
  const nonUniform = () => { const out=[]; for(let f=0;f<6;f++){ const c=st[f*5]; for(let i=1;i<5;i++) if(st[f*5+i]!==c){out.push(f);break;} } return out; };
  reset();
  return { reset, applyTokens, setTokens, scramble, svg, isSolved, animateMove, rotateView, recenter, screenRoles, nonUniform, state:()=>st.slice() };
}

/* ================================================================
   MEGAMINX — regular dodecahedron, 12 faces × 11 stickers = 132.
   Drag any sticker to turn its face (72°). Geometry + permutations
   generated and verified (move⁵ = identity, scramble+inverse solves)
   — see _setup/gen-puzzles.js.
   ================================================================ */
function makeMegaminx() {
  // COL (standard Megaminx scheme — opposite faces paired) is computed after FN, below.
  const VERTS = [[1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],[-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1],[0,0.618034,1.618034],[0,0.618034,-1.618034],[0,-0.618034,1.618034],[0,-0.618034,-1.618034],[0.618034,1.618034,0],[0.618034,-1.618034,0],[-0.618034,1.618034,0],[-0.618034,-1.618034,0],[1.618034,0,0.618034],[-1.618034,0,0.618034],[1.618034,0,-0.618034],[-1.618034,0,-0.618034]];
  const FACES = [[4,8,0,12,14],[14,12,1,9,5],[15,13,2,10,6],[7,11,3,13,15],[1,12,0,16,18],[18,16,2,13,3],[19,17,4,14,5],[7,15,6,17,19],[2,16,0,8,10],[10,8,4,17,6],[11,9,1,18,3],[7,19,5,9,11]];
  const PERM = [[0,5,1,2,3,4,10,6,7,8,9,11,46,47,14,15,16,51,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,91,92,48,49,50,96,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,12,13,71,72,73,17,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,101,102,93,94,95,106,97,98,99,100,69,70,103,104,105,74,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131],[0,1,2,3,70,71,6,7,8,75,10,11,16,12,13,14,15,21,17,18,19,20,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,4,5,47,48,49,9,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,124,125,72,73,74,129,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,45,46,114,115,116,50,118,119,120,121,122,123,112,113,126,127,128,117,130,131],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,27,23,24,25,26,32,28,29,30,31,33,34,35,36,79,80,39,40,41,84,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,37,38,60,61,62,42,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,104,100,81,82,83,109,85,86,87,88,59,90,91,92,58,94,95,96,97,63,99,89,101,102,103,93,105,106,107,108,98,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,59,60,25,26,27,64,29,30,31,32,33,38,34,35,36,37,43,39,40,41,42,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,115,111,61,62,63,120,65,66,67,68,69,70,71,72,73,74,75,76,77,23,24,80,81,82,28,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,122,112,113,114,126,116,117,118,119,131,121,79,123,124,125,78,127,128,129,130,83],[0,1,2,13,14,5,6,7,18,9,10,11,12,113,114,15,16,17,118,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,49,45,46,47,48,54,50,51,52,53,55,90,91,58,59,60,95,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,3,4,92,93,94,8,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,56,57,115,116,117,61,119,120,121,122,123,124,125,126,127,128,129,130,131],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,89,90,26,27,28,94,30,31,32,33,34,35,24,25,38,39,40,29,42,43,44,45,46,47,114,115,50,51,52,119,54,55,60,56,57,58,59,65,61,62,63,64,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,48,49,91,92,93,53,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,36,37,116,117,118,41,120,121,122,123,124,125,126,127,128,129,130,131],[0,103,2,3,4,102,6,7,8,9,107,11,1,13,14,15,5,17,18,19,20,10,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,71,67,68,69,70,76,72,73,74,75,77,78,79,80,123,124,83,84,85,128,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,81,82,104,105,106,86,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,16,12,125,126,127,21,129,130,131],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,34,24,25,26,38,28,29,30,31,43,33,123,35,36,37,122,39,40,41,42,127,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,103,104,69,70,71,108,73,74,75,76,77,82,78,79,80,81,87,83,84,85,86,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,27,23,105,106,107,32,109,110,111,112,113,114,115,116,117,118,119,120,121,67,68,124,125,126,72,128,129,130,131],[0,1,47,48,4,5,6,52,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,100,101,27,28,29,105,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,57,58,49,50,51,62,53,54,55,56,25,26,59,60,61,30,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,93,89,90,91,92,98,94,95,96,97,99,2,3,102,103,104,7,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131],[0,92,93,3,4,5,97,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,80,81,28,29,30,85,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,1,2,70,71,72,6,74,75,76,77,78,79,68,69,82,83,84,73,86,87,88,89,90,91,26,27,94,95,96,31,98,99,104,100,101,102,103,109,105,106,107,108,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,125,126,16,17,18,130,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,60,56,37,38,39,65,41,42,43,44,15,46,47,48,14,50,51,52,53,19,55,45,57,58,59,49,61,62,63,64,54,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,115,111,112,113,114,120,116,117,118,119,121,122,123,124,35,36,127,128,129,40,131],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,71,67,17,18,19,76,21,22,23,24,25,26,27,28,29,30,31,32,33,111,112,36,37,38,116,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,78,68,69,70,82,72,73,74,75,87,77,35,79,80,81,34,83,84,85,86,39,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,15,16,113,114,115,20,117,118,119,120,121,126,122,123,124,125,131,127,128,129,130]];
  const FN = FACES.map(f => { const c=_avg3(f.map(i=>VERTS[i])); const l=Math.hypot(c[0],c[1],c[2]); return [c[0]/l,c[1]/l,c[2]/l]; });
  // face adjacency (share an edge = 2 vertices) — for letter mapping + the "drag toward the face you turn" interaction
  const NEIGH = FACES.map((fa,f) => { const sa=new Set(fa), ns=[]; FACES.forEach((fb,g)=>{ if(g===f)return; let sh=0; fb.forEach(v=>{ if(sa.has(v))sh++; }); if(sh>=2) ns.push(g); }); return ns; });
  // letter notation → face index. U/F/R/L must be MUTUALLY ADJACENT (meet at a corner) like a cube, or cube-style LL algs leak.
  const FACE_LETTER = (() => {
    let U=0,D=0; for(let f=1;f<12;f++){ if(FN[f][1]>FN[U][1])U=f; if(FN[f][1]<FN[D][1])D=f; }   // top / bottom
    const ring=NEIGH[U];
    let F=ring[0]; ring.forEach(g=>{ if(FN[g][2]>FN[F][2]) F=g; });                    // front = U-neighbour most toward +z
    const fset=new Set(NEIGH[F]), flank=ring.filter(g=>fset.has(g));                   // U-neighbours that also touch F (flank it)
    let R=flank[0], L=flank[0]; flank.forEach(g=>{ if(FN[g][0]>FN[R][0])R=g; if(FN[g][0]<FN[L][0])L=g; });   // right / left
    let B=ring[0]; ring.forEach(g=>{ if(FN[g][2]<FN[B][2]) B=g; });                    // back
    return { U, D, F, R, L, B };
  })();
  // STANDARD Megaminx colour scheme: opposite faces are a paired light/dark (white↔grey, yellow↔cream, blue↔sky, red↔orange, green↔lime, purple↔pink).
  const COL = (() => {
    const PAIRS=[['#ffffff','#9a9a9a'],['#fdd835','#f4eea0'],['#1f3bd6','#5fc6f2'],['#d31a1a','#ff7a1a'],['#16a64b','#8ee04e'],['#8e36c0','#ff8ecb']];
    const opp = FN.map(n => { let b=0,bd=2; for(let g=0;g<12;g++){ const d=n[0]*FN[g][0]+n[1]*FN[g][1]+n[2]*FN[g][2]; if(d<bd){bd=d;b=g;} } return b; });
    const used=Array(12).fill(false), col=Array(12).fill('#888'), pairs=[];
    for (let f=0;f<12;f++) if (!used[f]&&!used[opp[f]]) { used[f]=used[opp[f]]=true; pairs.push([f,opp[f]]); }
    pairs.sort((a,b)=> (b.indexOf(FACE_LETTER.U)>=0?1:0) - (a.indexOf(FACE_LETTER.U)>=0?1:0));   // white/grey pair first (the U axis)
    pairs.forEach((pr,i) => { const c=PAIRS[i%6], hi = FN[pr[0]][1]>=FN[pr[1]][1]?0:1; col[pr[hi]]=c[0]; col[pr[1-hi]]=c[1]; });
    return col;
  })();
  let st;
  const reset = () => { st = Array.from({length:132}, (_,i)=>Math.floor(i/11)); };
  const applyPerm = p => { st = p.map(src => st[src]); };
  function applyTokens(tokens) {
    (Array.isArray(tokens)?tokens:String(tokens).split(/\s+/)).filter(Boolean).forEach(t => {
      let f, reps;
      if (/^[A-Za-z]/.test(t)) {                                              // letter face (R/U/F/B/L/D) from a lesson alg
        const c=t.replace(/['2]/g,'').toUpperCase(); if (!(c in FACE_LETTER)) return; f=FACE_LETTER[c];
        const n = t.includes('2') ? 2 : 1;                                   // 72° FIFTHS: a face has 5 positions, so ' inverts the count
        reps = t.includes("'") ? (5 - n) : n;                                // U=1, U'=4, U2=2, U2'=3 (U2 ≠ U2' on Megaminx!)
      } else {                                                               // bare digit = face index (playground); only ' is a modifier
        f = parseInt(t.replace(/'/g,''),10); if (!(f>=0&&f<12)) return; reps = t.includes("'") ? 4 : 1;
      }
      for (let k=0;k<reps;k++) applyPerm(PERM[f]);
    });
  }
  const setTokens = t => { reset(); applyTokens(t); };
  function scramble() {
    reset(); const seq=[]; let last=-1; const n = 30 + Math.floor(Math.random()*8);
    while (seq.length < n) { const f=Math.floor(Math.random()*12); if (f===last) continue;
      const tok = f + (Math.random()<.5?"'":''); seq.push(tok);
      if (Math.random()<.35) seq.push(tok);                                    // ~⅓ are doubles (same token twice)
      last=f; }
    applyTokens(seq); return seq;
  }
  const isSolved = () => { for (let f=0;f<12;f++){ const c=st[f*11]; for (let i=1;i<11;i++) if (st[f*11+i]!==c) return false; } return true; };
  // sticker polygons for face f (order matches generator: 0 centre, 1..5 corners, 6..10 edges)
  function facePolys(f) {
    const vs=FACES[f].map(i=>VERTS[i]); const fc=_avg3(vs);
    const inner=vs.map(v=>_lerp3(fc,v,0.5));
    const p=[], q=[]; for (let i=0;i<5;i++){ const a=vs[i], b=vs[(i+1)%5]; p.push(_lerp3(a,b,0.32)); q.push(_lerp3(a,b,0.68)); }
    const out=[{ poly:inner, slot:0 }];
    for (let i=0;i<5;i++) out.push({ poly:[vs[i],p[i],inner[i],q[(i+4)%5]], slot:1+i });
    for (let i=0;i<5;i++) out.push({ poly:[p[i],q[i],inner[(i+1)%5],inner[i]], slot:6+i });
    return out;
  }
  let rx=18, ry=-26; const DEF=[18,-26], CX=160, CY=152, SC=74;
  let _anim=null;                              // {moving:Set(globalFaceletIdx), axis:[..], ang:rad} during a turn animation
  function svg() {
    const M=_rmat3(rx,ry);
    const proj=p=>{ const r=_ap3(M,p); return [CX+SC*r[0], CY+SC*r[1], r[2]]; };
    const faces=[];
    for (let f=0; f<12; f++) {
      facePolys(f).forEach(s => {
        const gi=f*11+s.slot, mov=_anim&&_anim.moving.has(gi);
        const fnorm = mov ? _rotAxis(FN[f], _anim.axis, _anim.ang) : FN[f];
        if (_ap3(M, fnorm)[2] <= 0.02) return;          // per-facelet cull (so rotating facelets show/hide correctly)
        const pj=s.poly.map(p=>{ let q=_lerp3(FN[f], p, 0.93); if (mov) q=_rotAxis(q, _anim.axis, _anim.ang); return proj(q); });
        const depth=Math.min(...pj.map(p=>p[2]));
        faces.push([depth, `<polygon points="${pj.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="${COL[st[gi]]}" class="poly-fl" data-v="${f}"/>`]);
      });
    }
    faces.sort((a,b)=>a[0]-b[0]);
    return `<svg viewBox="0 0 320 305" xmlns="http://www.w3.org/2000/svg" class="sim-svg">${faces.map(x=>x[1]).join('')}</svg>`;
  }
  function moveInfo(token) {                    // → {axis, angleDeg, moving} for animating, or null
    let f, reps;
    if (/^[A-Za-z]/.test(token)) { const c=token.replace(/['2]/g,'').toUpperCase(); if(!(c in FACE_LETTER)) return null; f=FACE_LETTER[c]; const n=token.includes('2')?2:1; reps=token.includes("'")?(5-n):n; }
    else { f=parseInt(token.replace(/'/g,''),10); if(!(f>=0&&f<12)) return null; reps=token.includes("'")?4:1; }
    const moving=new Set(); PERM[f].forEach((src,i)=>{ if(src!==i) moving.add(i); });
    const signed = reps<=2 ? reps : reps-5;     // turn the short way (−1,−2 for primes)
    return { axis:FN[f], angleDeg: signed*72, moving };
  }
  function animateMove(token, dur, onFrame) {
    return new Promise(resolve => {
      const info = moveInfo(token);
      if (!info) { applyTokens([token]); onFrame&&onFrame(); return resolve(); }
      let t0=null; const D=Math.max(140, dur||300);
      const step=now=>{ if(t0===null)t0=now; const k=Math.min(1,(now-t0)/D); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
        _anim={ moving:info.moving, axis:info.axis, ang: info.angleDeg*e*Math.PI/180 }; onFrame&&onFrame();
        if(k<1) requestAnimationFrame(step); else { _anim=null; applyTokens([token]); onFrame&&onFrame(); resolve(); } };
      requestAnimationFrame(step);
    });
  }
  function screenRoles() {                                   // 4 visible faces → keyboard u/l/r/b
    const M=_rmat3(rx,ry);
    const v=FN.map((N,f)=>{ const r=_ap3(M,N); return { f, x:CX+SC*r[0], y:CY+SC*r[1], z:r[2] }; }).filter(p=>p.z>0.05);
    v.sort((a,b)=>a.y-b.y); const top=v[0];
    const lower=v.slice(1).sort((a,b)=>a.x-b.x);
    const back=FN.map((N,f)=>{ const r=_ap3(M,N); return { f, z:r[2] }; }).sort((a,b)=>a.z-b.z)[0];
    return { top:String((top||{f:0}).f), bl:String((lower[0]||top||{f:0}).f), br:String((lower[lower.length-1]||top||{f:0}).f), back:String(back.f) };
  }
  /* Drag a sticker → turn the face it's ON (the clicked face), direction from the drag's tangential
     sense about THAT face's screen centre. Predictable: drag the DR face and DR turns (never U). */
  function moveFromDrag(faceIdx, dnx, dny, ux, uy, rect) {
    const f = +faceIdx;
    const M=_rmat3(rx,ry); const r=_ap3(M,FN[f]);
    const cx = rect.left + (CX+SC*r[0])/320*rect.width, cy = rect.top + (CY+SC*r[1])/305*rect.height;   // face centre on screen
    const w=[dnx-cx, dny-cy], drag=[ux-dnx, uy-dny];
    if (Math.hypot(drag[0],drag[1]) < 6 || Math.hypot(w[0],w[1]) < 4) return null;
    const cross = w[0]*drag[1] - w[1]*drag[0];               // rotational sense of the drag about the face centre
    return f + (cross > 0 ? "'" : '');
  }
  const rotateView=(dx,dy)=>{ ry+=dx*0.5; rx-=dy*0.5; };
  const recenter=()=>{ rx=DEF[0]; ry=DEF[1]; };
  const nonUniform = () => { const out=[]; for(let f=0;f<12;f++){ const c=st[f*11]; for(let i=1;i<11;i++) if(st[f*11+i]!==c){ out.push(f); break; } } return out; };
  reset();
  return { reset, applyTokens, setTokens, scramble, svg, isSolved, animateMove, moveFromDrag, rotateView, recenter, screenRoles,
           faceLetter:FACE_LETTER, neigh:NEIGH, nonUniform, state:()=>st.slice() };
}
