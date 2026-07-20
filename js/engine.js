/* ================================================================
   CUBE ENGINE — shared by the 3D renderer and the diagram generator.
   Each cubie has a grid position {x,y,z} and a 3×3 orientation matrix.
   A move applies a 90/180° rotation matrix to BOTH, so moves compose.
   (Coordinate frame: x=right, y=down, z=toward viewer.)
   ================================================================ */
const I3 = [[1,0,0],[0,1,0],[0,0,1]];
const RX = [[1,0,0],[0,0,-1],[0,1,0]];   // = CSS rotateX(90deg)
const RY = [[0,0,1],[0,1,0],[-1,0,0]];   // = CSS rotateY(90deg)
const RZ = [[0,-1,0],[1,0,0],[0,0,1]];   // = CSS rotateZ(90deg)
const T  = M => [[M[0][0],M[1][0],M[2][0]],[M[0][1],M[1][1],M[2][1]],[M[0][2],M[1][2],M[2][2]]];
const mul = (A,B) => A.map((r,i)=>[0,1,2].map(j => r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
const mvVec = (M,p) => ({ x:M[0][0]*p.x+M[0][1]*p.y+M[0][2]*p.z,
                          y:M[1][0]*p.x+M[1][1]*p.y+M[1][2]*p.z,
                          z:M[2][0]*p.x+M[2][1]*p.y+M[2][2]*p.z });
function rotMat(axis, angle) {
  let base = axis==='x'?RX : axis==='y'?RY : RZ;
  if (angle < 0) base = T(base);
  return Math.abs(angle) === 180 ? mul(base, base) : base;
}
function m3d(M) {  // 3×3 rotation → CSS matrix3d() args (column-major)
  return `${M[0][0]},${M[1][0]},${M[2][0]},0,${M[0][1]},${M[1][1]},${M[2][1]},0,${M[0][2]},${M[1][2]},${M[2][2]},0,0,0,0,1`;
}

/* token → move.  Uses the notation move table (moveById, from data/notation.js). */
function parse(tok) {
  const base = tok.replace(/['2]/g,'');
  const bm = moveById[base];
  let angle = bm.angle;
  if (tok.includes("'")) angle = -angle;
  if (tok.includes('2')) angle = 180;
  return { axis: bm.axis, angle, sel: bm.sel, whole: bm.whole };
}
const tokenize = a => Array.isArray(a) ? a : String(a).trim().split(/\s+/);
const invertTok = t => t.endsWith('2') ? t : t.endsWith("'") ? t.slice(0,-1) : t+"'";
const invertSeq = seq => tokenize(seq).slice().reverse().map(invertTok);

/* Coordinates for an N×N cube, centred on 0 (adjacent layers differ by 1). */
const rangeCoords = N => Array.from({ length:N }, (_,i) => i - (N-1)/2);
/* N-aware move parser: faces (R), wide (Rw / r), numbered wide (3Rw), slices (M/E/S), rotations (x/y/z). */
const FACEDEF = { R:['x','+',90], L:['x','-',-90], U:['y','-',-90], D:['y','+',90], F:['z','+',90], B:['z','-',-90] };
function parseGen(tok, coords) {
  const ax = (coords || [-1,0,1]).slice().sort((a,b)=>a-b);
  const prime = tok.includes("'"), dbl = tok.includes('2'), core = tok.replace(/['2]/g,'');
  const mod = a => dbl ? 180 : (prime ? -a : a);
  if (core==='x') return { axis:'x', angle:mod(90),  whole:true };
  if (core==='y') return { axis:'y', angle:mod(-90), whole:true };
  if (core==='z') return { axis:'z', angle:mod(90),  whole:true };
  if (core==='M') return { axis:'x', angle:mod(-90), sel:c=>c.x===0 };
  if (core==='E') return { axis:'y', angle:mod(90),  sel:c=>c.y===0 };
  if (core==='S') return { axis:'z', angle:mod(90),  sel:c=>c.z===0 };
  const m = core.match(/^(\d*)([RLUDFBrludfb])(w?)$/);
  if (m) {
    const lower = m[2] !== m[2].toUpperCase();
    const width = m[1] ? +m[1] : (m[3]==='w' || lower ? 2 : 1);
    const F = FACEDEF[m[2].toUpperCase()], a = F[0];
    const layers = new Set(F[1]==='+' ? ax.slice(ax.length-width) : ax.slice(0, width));
    return { axis:a, angle:mod(F[2]), sel:c=>layers.has(c[a]) };
  }
  return { axis:'x', angle:0, sel:()=>false };
}

/* Which solved-state sticker color sits on body-normal n for a cubie at `home`.
   Face letters: U=white top, D=yellow bottom, F=green, B=blue, R=red, L=orange. */
function stickerAt(home, n) {
  if (n.x=== 1) return home.x=== 1 ? 'R' : null;
  if (n.x===-1) return home.x===-1 ? 'L' : null;
  if (n.y=== 1) return home.y=== 1 ? 'D' : null;
  if (n.y===-1) return home.y===-1 ? 'U' : null;
  if (n.z=== 1) return home.z=== 1 ? 'F' : null;
  if (n.z===-1) return home.z===-1 ? 'B' : null;
  return null;
}
/* Color now facing world direction `dir` for cubie c (null if no sticker there). */
function facing(c, dir) { return stickerAt(c.home, mvVec(T(c.ori), dir)); }

/* ---------------- Headless state (no DOM) — used by diagrams ---------------- */
function makeState() {
  let cubies = [];
  for (let x=-1;x<=1;x++) for (let y=-1;y<=1;y++) for (let z=-1;z<=1;z++)
    cubies.push({ home:{x,y,z}, pos:{x,y,z}, ori:I3 });
  function reset() { cubies.forEach(c => { c.pos={...c.home}; c.ori=I3; }); }
  function applyTokens(seq) {
    tokenize(seq).forEach(t => {
      const mv=parse(t), R=rotMat(mv.axis,mv.angle);
      cubies.filter(c => mv.whole?true:mv.sel(c.pos)).forEach(c => { c.pos=mvVec(R,c.pos); c.ori=mul(R,c.ori); });
    });
  }
  function isSolved() { return cubies.every(c =>
    c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z && JSON.stringify(c.ori)===JSON.stringify(I3)); }
  return { cubies:()=>cubies, reset, applyTokens, isSolved };
}

/* ---------------- 3D DOM renderer ---------------- */
let DUR_NOTE = 720, DUR_SEQ = 430;   // DUR_SEQ adjustable from preferences (animation speed)
let busy = false;   // only one cube animates at a time

function makeCube(cubeEl, opts={}) {
  let cubies = [], coords = [-1,0,1], unit = 50, flip = false;
  const faces = ['front','back','right','left','up','down'];
  const P = t => parseGen(t, coords);   // moves parsed against this cube's size
  // `flip` = rest with yellow on top / white on bottom (a white-cross solve view; like an x2).
  const colorOf = (f,x,y,z) => {
    const mn = coords[0], mx = coords[coords.length-1];
    const U = flip ? 'c-D' : 'c-U', D = flip ? 'c-U' : 'c-D';
    return (f==='up'&&y===mn)?U:(f==='down'&&y===mx)?D:(f==='front'&&z===mx)?'c-F':
           (f==='back'&&z===mn)?'c-B':(f==='right'&&x===mx)?'c-R':(f==='left'&&x===mn)?'c-L':'';
  };
  // Configure for an N×N cube (any N). Cube size scales so the whole puzzle stays roughly constant on screen.
  function configure(o={}) {
    const N = o.N || 3;
    flip = !!o.flip;
    coords = rangeCoords(N);
    const size = N===3 ? 48 : Math.max(15, Math.round(144 / N));
    unit = size + Math.max(1, Math.round(size / 24));   // inter-cubie gap scales with piece size (≈2px on 3×3, ~1px on 7×7) so big cubes don't look separated
    cubeEl.style.setProperty('--cubie', size+'px');
    cubeEl.style.setProperty('--half', (size/2)+'px');
  }
  function build() {
    cubeEl.innerHTML = ''; cubies = [];
    const mn = coords[0], mx = coords[coords.length-1];
    for (const x of coords) for (const y of coords) for (const z of coords) {
      if (x>mn&&x<mx && y>mn&&y<mx && z>mn&&z<mx) continue;   // skip invisible interior cubies
      const el = document.createElement('div'); el.className='cubie';
      // Speedcube look: sticker rounding grows toward the cube's corners (the dark plastic between four
      // rounded corners reads as a diamond). 3 extreme coords = corner piece, 2 = edge, 1 = face interior.
      const ext = (x===mn||x===mx) + (y===mn||y===mx) + (z===mn||z===mx);
      el.style.setProperty('--rf', ext===3 ? '.28' : ext===2 ? '.20' : '.12');
      for (const f of faces) { const fd=document.createElement('div'); fd.className='face face-'+f+' '+colorOf(f,x,y,z); el.appendChild(fd); }
      cubeEl.appendChild(el);
      cubies.push({ el, home:{x,y,z}, pos:{x,y,z}, ori:I3 });
    }
    cubies.forEach(render);
  }
  function render(c) {
    c.el.style.transform = `translate3d(${c.pos.x*unit}px,${c.pos.y*unit}px,${c.pos.z*unit}px) matrix3d(${m3d(c.ori)})`;
  }
  function reset() {
    cubies.forEach(c => { c.pos={...c.home}; c.ori=I3; c.el.classList.remove('dim'); c.el.style.transition='none'; render(c); });
  }
  const affectedBy = mv => cubies.filter(c => mv.whole ? true : mv.sel(c.pos));
  function bake(mv, set) { const R=rotMat(mv.axis,mv.angle); set.forEach(c => { c.pos=mvVec(R,c.pos); c.ori=mul(R,c.ori); }); }
  function applyInstant(seq) { tokenize(seq).forEach(t => { const mv=P(t); bake(mv, affectedBy(mv)); }); cubies.forEach(render); }
  function animateMove(mv, opts={}) {
    return new Promise(res => {
      const dur = opts.dur||DUR_SEQ, set = affectedBy(mv);
      const layer = document.createElement('div'); layer.className='layer'; cubeEl.appendChild(layer);
      set.forEach(c => layer.appendChild(c.el));
      if (opts.dim) cubies.forEach(c => { if (!set.includes(c)) c.el.classList.add('dim'); });
      void layer.offsetWidth;
      layer.style.transition = `transform ${dur}ms ease-in-out`;
      requestAnimationFrame(() => { layer.style.transform = `rotate${mv.axis.toUpperCase()}(${mv.angle}deg)`; });
      setTimeout(() => {
        bake(mv, set);
        set.forEach(c => { cubeEl.appendChild(c.el); c.el.style.transition='none'; c.el.classList.remove('dim'); render(c); });
        layer.remove(); res();
      }, dur + 25);
    });
  }
  function highlight(pred) { cubies.forEach(c => c.el.classList.toggle('dim', !pred(c))); }
  function isSolved() { return cubies.every(c =>
      c.pos.x===c.home.x && c.pos.y===c.home.y && c.pos.z===c.home.z && JSON.stringify(c.ori)===JSON.stringify(I3)); }
  configure(opts); build();
  return { cubies:()=>cubies, reset, applyInstant, animateMove, highlight, isSolved, render, parse:P,
           rebuild:(o)=>{ configure(typeof o==='number' ? {N:o} : (o||{})); build(); } };
}
