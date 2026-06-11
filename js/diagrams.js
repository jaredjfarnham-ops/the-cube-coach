/* ================================================================
   DIAGRAM GENERATOR — builds 2D last-layer SVGs from an algorithm.
   Method: apply the algorithm's INVERSE to a solved headless state
   (that reproduces the case the algorithm solves), then read the
   top-layer sticker facings.  Derived from the algorithm itself, so
   a diagram can never disagree with its (verified) algorithm.
   Top-down view: back at top, front at bottom, right at right.
   ================================================================ */
const COLOR_HEX = { U:'#f7f7f7', D:'#ffd500', F:'#00a651', B:'#0050d8', R:'#d4202a', L:'#ff7416' };
const LL_FILL   = '#ffd500';   // last-layer "oriented" color (yellow, conventional)
const BARE_FILL = '#34394f';   // top sticker not oriented
const TOP_GRAY  = '#caccd6';   // solved/oriented top in PLL diagrams
const TAB_OFF   = '#262a3c';

const S = 24, GAP = 3, TAB = 6, PAD = TAB + 6;
const SPAN = 2*PAD + 3*S + 2*GAP;
const cellX = x => PAD + (x+1)*(S+GAP);          // x,z in {-1,0,1}
const cellY = z => PAD + (z+1)*(S+GAP);
const ctr   = i => PAD + (i+1)*(S+GAP) + S/2;

const rect = (x,y,w,h,fill,rx=3) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="#0a0d18" stroke-width="1.5"/>`;
const UP = {x:0,y:-1,z:0};
const SIDES = [
  { d:{x:0,y:0,z:1},  on:'front' }, { d:{x:0,y:0,z:-1}, on:'back' },
  { d:{x:1,y:0,z:0},  on:'right' }, { d:{x:-1,y:0,z:0}, on:'left' },
];

/* `setup` = the moves that scramble a solved cube INTO the case (e.g. invertSeq(alg),
   or an AUF-randomized scramble from the trainer). */
function llState(setup) { const st = makeState(); st.reset(); st.applyTokens(setup); return st; }
const topAt = (cs,x,z) => cs.find(c => c.pos.y===-1 && c.pos.x===x && c.pos.z===z);

/* tab rectangle hugging the outside of an edge cell, given side + lane index i (x or z) */
function tabRect(side, i, fill) {
  const gx = cellX(i), gy = cellY(i);
  if (side==='front') return rect(gx, cellY(1)+S+2, S, TAB, fill, 2);
  if (side==='back')  return rect(gx, cellY(-1)-2-TAB, S, TAB, fill, 2);
  if (side==='right') return rect(cellX(1)+S+2, gy, TAB, S, fill, 2);
  if (side==='left')  return rect(cellX(-1)-2-TAB, gy, TAB, S, fill, 2);
}

/* OLL: top cells yellow where the top color faces up; rim tabs where it wraps to a side. */
function ollSVG(setup) {
  const cs = llState(setup).cubies();
  let body = `<rect x="0" y="0" width="${SPAN}" height="${SPAN}" rx="8" fill="#11142a"/>`;
  for (let x=-1;x<=1;x++) for (let z=-1;z<=1;z++) {
    const c = topAt(cs,x,z);
    body += rect(cellX(x), cellY(z), S, S, facing(c,UP)==='U' ? LL_FILL : BARE_FILL);
  }
  for (const {d,on} of SIDES) {
    const fixed = on==='front'?{z:1}:on==='back'?{z:-1}:on==='right'?{x:1}:{x:-1};
    for (let i=-1;i<=1;i++) {
      const x = 'x' in fixed ? fixed.x : i, z = 'z' in fixed ? fixed.z : i, lane = ('x' in fixed)? z : x;
      const c = topAt(cs,x,z);
      body += tabRect(on, lane, facing(c,d)==='U' ? LL_FILL : TAB_OFF);
    }
  }
  return `<svg viewBox="0 0 ${SPAN} ${SPAN}" xmlns="http://www.w3.org/2000/svg" class="case-svg">${body}</svg>`;
}

/* ZBLL: shows BOTH orientation and permutation — top cells are LL-yellow where oriented and
   the wrapped side-colour where a corner is twisted; rim tabs show side colours; arrows show
   the corner+edge permutation. (Edges are pre-oriented in ZBLL, so only corners can be twisted.) */
function zbllSVG(setup) {
  const cs = llState(setup).cubies();
  let body = `<rect x="0" y="0" width="${SPAN}" height="${SPAN}" rx="8" fill="#11142a"/>`;
  body += `<defs><marker id="ahz" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#e8ecff"/></marker></defs>`;
  for (let x=-1;x<=1;x++) for (let z=-1;z<=1;z++) { const c=topAt(cs,x,z); const up=facing(c,UP);
    body += rect(cellX(x), cellY(z), S, S, up==='U' ? LL_FILL : (COLOR_HEX[up]||BARE_FILL)); }
  for (const {d,on} of SIDES) {
    const fixed = on==='front'?{z:1}:on==='back'?{z:-1}:on==='right'?{x:1}:{x:-1};
    for (let i=-1;i<=1;i++) { const x='x' in fixed?fixed.x:i, z='z' in fixed?fixed.z:i, lane=('x' in fixed)?z:x;
      const c=topAt(cs,x,z); const col=facing(c,d); body += tabRect(on, lane, col ? COLOR_HEX[col] : TAB_OFF); }
  }
  for (const c of cs) {
    if (c.pos.y!==-1) continue;
    if (c.pos.x===c.home.x && c.pos.z===c.home.z) continue;
    const x1=ctr(c.pos.x), y1=ctr(c.pos.z), x2=ctr(c.home.x), y2=ctr(c.home.z);
    body += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e8ecff" stroke-width="2.4" stroke-linecap="round" marker-end="url(#ahz)"/>`;
  }
  return `<svg viewBox="0 0 ${SPAN} ${SPAN}" xmlns="http://www.w3.org/2000/svg" class="case-svg">${body}</svg>`;
}

/* 2×2 (CLL / EG): only the four U-layer CORNERS — top sticker shows orientation
   (yellow where the U-colour faces up, else the wrapped side colour), corner side
   tabs show the side colours, arrows show the corner permutation. Built from the
   same inverse-setup state as the other diagrams, restricted to |x|=|z|=1. */
function cll2SVG(setup) {
  const cs = llState(setup).cubies();
  const S2 = 30, GAP2 = 5, TAB2 = 7, PAD2 = TAB2 + 8;
  const SP = 2*PAD2 + 2*S2 + GAP2;
  const cellc = v => PAD2 + (v===-1?0:1)*(S2+GAP2);          // top-left of a corner cell
  const mid   = v => cellc(v) + S2/2;
  const corner = (x,z) => cs.find(c => c.pos.y===-1 && c.pos.x===x && c.pos.z===z);
  let body = `<rect x="0" y="0" width="${SP}" height="${SP}" rx="8" fill="#11142a"/>`;
  body += `<defs><marker id="ah2" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#e8ecff"/></marker></defs>`;
  for (const x of [-1,1]) for (const z of [-1,1]) { const c=corner(x,z); const up=facing(c,UP);
    body += rect(cellc(x), cellc(z), S2, S2, up==='U' ? LL_FILL : (COLOR_HEX[up]||BARE_FILL)); }
  for (const x of [-1,1]) {                                   // front (z=1) + back (z=-1) tabs
    let c=corner(x,1),  col=facing(c,{x:0,y:0,z:1});  body += rect(cellc(x), cellc(1)+S2+2,   S2, TAB2, col?COLOR_HEX[col]:TAB_OFF, 2);
    c=corner(x,-1);     col=facing(c,{x:0,y:0,z:-1}); body += rect(cellc(x), cellc(-1)-2-TAB2, S2, TAB2, col?COLOR_HEX[col]:TAB_OFF, 2);
  }
  for (const z of [-1,1]) {                                   // right (x=1) + left (x=-1) tabs
    let c=corner(1,z),  col=facing(c,{x:1,y:0,z:0});  body += rect(cellc(1)+S2+2,   cellc(z), TAB2, S2, col?COLOR_HEX[col]:TAB_OFF, 2);
    c=corner(-1,z);     col=facing(c,{x:-1,y:0,z:0}); body += rect(cellc(-1)-2-TAB2, cellc(z), TAB2, S2, col?COLOR_HEX[col]:TAB_OFF, 2);
  }
  for (const c of cs) {                                       // corner permutation arrows
    if (c.pos.y!==-1 || Math.abs(c.home.x)!==1 || Math.abs(c.home.z)!==1) continue;
    if (c.pos.x===c.home.x && c.pos.z===c.home.z) continue;
    body += `<line x1="${mid(c.pos.x)}" y1="${mid(c.pos.z)}" x2="${mid(c.home.x)}" y2="${mid(c.home.z)}" stroke="#e8ecff" stroke-width="2.4" stroke-linecap="round" marker-end="url(#ah2)"/>`;
  }
  return `<svg viewBox="0 0 ${SP} ${SP}" xmlns="http://www.w3.org/2000/svg" class="case-svg">${body}</svg>`;
}

/* PLL: top solved-gray, rim tabs show side colors, arrows show the piece permutation. */
function pllSVG(setup) {
  const cs = llState(setup).cubies();
  let body = `<rect x="0" y="0" width="${SPAN}" height="${SPAN}" rx="8" fill="#11142a"/>`;
  body += `<defs><marker id="ah" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
    <path d="M0,0 L6,3 L0,6 Z" fill="#e8ecff"/></marker></defs>`;
  for (let x=-1;x<=1;x++) for (let z=-1;z<=1;z++) body += rect(cellX(x), cellY(z), S, S, TOP_GRAY);
  for (const {d,on} of SIDES) {
    const fixed = on==='front'?{z:1}:on==='back'?{z:-1}:on==='right'?{x:1}:{x:-1};
    for (let i=-1;i<=1;i++) {
      const x = 'x' in fixed ? fixed.x : i, z = 'z' in fixed ? fixed.z : i, lane = ('x' in fixed)? z : x;
      const c = topAt(cs,x,z); const col = facing(c,d);
      body += tabRect(on, lane, col ? COLOR_HEX[col] : TAB_OFF);
    }
  }
  // arrows: each displaced top piece (edge/corner) from current pos -> home
  for (const c of cs) {
    if (c.pos.y!==-1) continue;
    if (c.pos.x===c.home.x && c.pos.z===c.home.z) continue;
    const x1=ctr(c.pos.x), y1=ctr(c.pos.z), x2=ctr(c.home.x), y2=ctr(c.home.z);
    body += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e8ecff" stroke-width="2.4" stroke-linecap="round" marker-end="url(#ah)"/>`;
  }
  return `<svg viewBox="0 0 ${SPAN} ${SPAN}" xmlns="http://www.w3.org/2000/svg" class="case-svg">${body}</svg>`;
}
