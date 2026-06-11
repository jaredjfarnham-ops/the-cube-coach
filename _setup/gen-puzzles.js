/* Geometry generators for the Skewb and Megaminx facelet engines.
   Produces sticker-permutation tables (correct-by-construction) and
   self-verifies (move^k = identity, scramble+inverse = solved).
   Run with: node _setup/gen-puzzles.js
   The printed arrays are pasted into js/puzzles.js. */

/* ---- vector helpers ---- */
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const scl=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const len=a=>Math.hypot(a[0],a[1],a[2]);
const norm=a=>{const l=len(a)||1;return [a[0]/l,a[1]/l,a[2]/l];};
const avg=pts=>scl(pts.reduce(add,[0,0,0]),1/pts.length);
function rot(v,k,ang){ // Rodrigues: rotate v about unit axis k by ang
  k=norm(k); const c=Math.cos(ang),s=Math.sin(ang);
  return add(add(scl(v,c), scl(cross(k,v),s)), scl(k, dot(k,v)*(1-c)));
}
function matchPerm(centroids, moved, R){
  // moved = indices that rotate; build perm[i]=source index (new[i]=old[perm[i]])
  const perm = centroids.map((_,i)=>i);          // identity for non-movers
  const movedSet = new Set(moved);
  moved.forEach(i=>{
    const p = R(centroids[i]);                    // where sticker i's centroid goes
    let best=-1, bd=1e9;
    moved.forEach(j=>{ const d=len(sub(p,centroids[j])); if(d<bd){bd=d;best=j;} });
    if(bd>1e-6) throw new Error('no centroid match, d='+bd+' for '+i);
    perm[best]=i;                                  // sticker that LANDS at best came from i
  });
  // sanity: perm must be a bijection
  if(new Set(perm).size!==perm.length) throw new Error('perm not a bijection');
  return perm;
}
const applyPerm=(st,p)=>p.map(src=>st[src]);
const compose=(a,b)=>a.map((_,i)=>a[b[i]]);       // (a then b)? we use apply repeatedly instead
function inversePerm(p){const inv=Array(p.length);p.forEach((src,i)=>inv[src]=i);return inv;}

/* ================================================================
   SKEWB  — 6 faces x 5 stickers (center + 4 corner triangles) = 30.
   8 corner-turn moves (any corner twistable), 120 deg.
   ================================================================ */
function genSkewb(){
  const FN=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const UV=[ [[0,1,0],[0,0,1]], [[0,0,1],[0,1,0]], [[0,0,1],[1,0,0]],
             [[1,0,0],[0,0,1]], [[1,0,0],[0,1,0]], [[0,1,0],[1,0,0]] ];
  const SS=[[1,1],[-1,1],[-1,-1],[1,-1]];          // corner (sx,sy) order
  // build sticker centroids + piece vectors, ordered face*5 + slot (slot0=center,1..4=corners)
  const centroid=[], piece=[];
  for(let f=0; f<6; f++){
    const N=FN[f],[u,v]=UV[f];
    const C=SS.map(([sx,sy])=>add(N, add(scl(u,sx), scl(v,sy))));   // 4 cube corners on this face
    const M=C.map((c,k)=>scl(add(c,C[(k+1)%4]),0.5));               // edge mids
    centroid.push(N.slice()); piece.push(N.slice());                // center sticker
    for(let k=0;k<4;k++){ centroid.push(avg([C[k],M[k],M[(k+3)%4]])); piece.push(C[k].slice()); }
  }
  // 8 corner axes
  const CORN=[]; for(const x of[1,-1])for(const y of[1,-1])for(const z of[1,-1])CORN.push([x,y,z]);
  const PERM = CORN.map(Cax=>{
    const moved=[]; for(let i=0;i<30;i++) if(dot(piece[i],Cax)>1e-9) moved.push(i);
    return matchPerm(centroid, moved, v=>rot(v,Cax, 2*Math.PI/3));
  });
  // ---- verify ----
  const solved=centroid.map((_,i)=>Math.floor(i/5));
  PERM.forEach((p,idx)=>{ let s=solved.slice(); for(let k=0;k<3;k++) s=applyPerm(s,p);
    if(s.join()!==solved.join()) throw new Error('skewb move^3 != id @'+idx); });
  // scramble + inverse
  let s=solved.slice(); const seq=[];
  for(let n=0;n<25;n++){ const m=Math.floor(Math.random()*8), pr=Math.random()<.5; seq.push([m,pr]);
    s=applyPerm(s,PERM[m]); if(pr) s=applyPerm(s,PERM[m]); }
  for(let n=seq.length-1;n>=0;n--){ const[m,pr]=seq[n];               // inverse of a 120 move = apply twice (or once if it was prime)
    s=applyPerm(s,PERM[m]); if(!pr) s=applyPerm(s,PERM[m]); }
  if(s.join()!==solved.join()) throw new Error('skewb scramble+inverse failed');
  console.log('SKEWB ok: 8 moves, each ^3=id, scramble+inverse solves. movers/move='+
    CORN.map(Cax=>{let c=0;for(let i=0;i<30;i++)if(dot(piece[i],Cax)>1e-9)c++;return c;}).join(','));
  return PERM;
}

/* ================================================================
   MEGAMINX — regular dodecahedron, 12 faces x 11 stickers = 132.
   12 face-turn moves, 72 deg. Sticker order per face:
     slot 0     = center
     slots 1..5 = corner stickers at face vertices 0..4
     slots 6..10= edge stickers along face edges 0..4
   ================================================================ */
function genMega(){
  const P=(1+Math.sqrt(5))/2, I=1/P;
  // 20 dodecahedron vertices
  const V=[];
  for(const x of[1,-1])for(const y of[1,-1])for(const z of[1,-1])V.push([x,y,z]);
  for(const a of[I,-I])for(const b of[P,-P])V.push([0,a,b]);
  for(const a of[I,-I])for(const b of[P,-P])V.push([a,b,0]);
  for(const a of[I,-I])for(const b of[P,-P])V.push([b,0,a]);
  // 12 face normals = icosahedron vertices (dual). NOTE the long axis is φ, short is 1
  // (φ and 1 are swapped relative to the dodecahedron vertex coords).
  const FNraw=[];
  for(const a of[P,-P])for(const b of[1,-1])FNraw.push([0,a,b]);   // (0,±φ,±1)
  for(const a of[P,-P])for(const b of[1,-1])FNraw.push([a,b,0]);   // (±φ,±1,0)
  for(const a of[P,-P])for(const b of[1,-1])FNraw.push([b,0,a]);   // (±1,0,±φ)
  const FN=FNraw.map(norm);
  // each face: the 5 vertices with highest dot to its normal, ordered CCW
  const FACES=FN.map(N=>{
    const idx=V.map((v,i)=>[i,dot(norm(v),N)]).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
    // order around N
    const c=avg(idx.map(i=>V[i]));
    const u=norm(sub(V[idx[0]], scl(N,dot(V[idx[0]],N))));
    const w=cross(N,u);
    idx.sort((a,b)=>{
      const pa=sub(V[a],c), pb=sub(V[b],c);
      return Math.atan2(dot(pa,w),dot(pa,u)) - Math.atan2(dot(pb,w),dot(pb,u));
    });
    return idx;
  });
  // sticker centroids + piece id, ordered face*11 + slot
  const centroid=[], pieceKind=[], pieceKey=[];
  const C=FN.map((N,f)=>avg(FACES[f].map(i=>V[i])));      // face centre points
  function vkey(i){return 'V'+i;}
  function ekey(i,j){return 'E'+Math.min(i,j)+'_'+Math.max(i,j);}
  for(let f=0; f<12; f++){
    const fc=C[f], vs=FACES[f].map(i=>V[i]);
    const E=FACES[f].map(i=>scl(add(fc,[0,0,0]),0)); // placeholder, recompute below
    // inner pentagon vertices toward face vertices
    const inner=vs.map(v=>add(fc, scl(sub(v,fc),0.5)));
    // edge split points
    const r=0.32, pPts=[], qPts=[];
    for(let i=0;i<5;i++){ const a=vs[i], b=vs[(i+1)%5];
      pPts.push(add(a, scl(sub(b,a),r))); qPts.push(add(a, scl(sub(b,a),1-r))); }
    // center
    centroid.push(fc.slice()); pieceKind.push('c'); pieceKey.push('F'+f);
    // corner stickers at vertex i: [v_i, p_i, inner_i, q_{i-1}]
    for(let i=0;i<5;i++){ const poly=[vs[i],pPts[i],inner[i],qPts[(i+4)%5]];
      centroid.push(avg(poly)); pieceKind.push('v'); pieceKey.push(vkey(FACES[f][i])); }
    // edge stickers along edge i (v_i -> v_{i+1}): [p_i,q_i,inner_{i+1},inner_i]
    for(let i=0;i<5;i++){ const poly=[pPts[i],qPts[i],inner[(i+1)%5],inner[i]];
      centroid.push(avg(poly)); pieceKind.push('e'); pieceKey.push(ekey(FACES[f][i],FACES[f][(i+1)%5])); }
  }
  // face-F turn: move every sticker whose piece touches face F
  const faceVerts=FACES.map(f=>new Set(f));
  const faceEdges=FACES.map(f=>{const s=new Set();for(let i=0;i<5;i++)s.add(ekey(f[i],f[(i+1)%5]));return s;});
  const PERM=FN.map((N,f)=>{
    const moved=[];
    for(let i=0;i<132;i++){
      const k=pieceKind[i], key=pieceKey[i];
      let m=false;
      if(k==='c') m = (key==='F'+f);
      else if(k==='v') m = faceVerts[f].has(parseInt(key.slice(1)));
      else { const[a,b]=key.slice(1).split('_').map(Number); m = faceEdges[f].has(ekey(a,b)); }
      if(m) moved.push(i);
    }
    return matchPerm(centroid, moved, v=>rot(v,N, 2*Math.PI/5));
  });
  // ---- verify ----
  const moverCounts=PERM.map((p,f)=>{let c=0;p.forEach((src,i)=>{if(src!==i)c++;});return c;});
  const solved=centroid.map((_,i)=>Math.floor(i/11));
  PERM.forEach((p,idx)=>{ let s=solved.slice(); for(let k=0;k<5;k++) s=applyPerm(s,p);
    if(s.join()!==solved.join()) throw new Error('mega move^5 != id @'+idx); });
  let s=solved.slice(); const seq=[];
  for(let n=0;n<40;n++){ const m=Math.floor(Math.random()*12), t=1+Math.floor(Math.random()*4); seq.push([m,t]);
    for(let k=0;k<t;k++) s=applyPerm(s,PERM[m]); }
  for(let n=seq.length-1;n>=0;n--){ const[m,t]=seq[n]; for(let k=0;k<5-t;k++) s=applyPerm(s,PERM[m]); }
  if(s.join()!==solved.join()) throw new Error('mega scramble+inverse failed');
  console.log('MEGA ok: 12 moves, each ^5=id, scramble+inverse solves. movers/move='+moverCounts.join(','));
  return { PERM, VERTS:V, FACES };
}

/* ---- run + emit ---- */
const skewb = genSkewb();
const mega  = genMega();
const fmt = a => JSON.stringify(a);
console.log('\n/* paste into js/puzzles.js */');
console.log('SKEWB_PERM =', fmt(skewb), ';');
console.log('\nMEGA_VERTS =', fmt(mega.VERTS.map(v=>v.map(x=>+x.toFixed(6)))), ';');
console.log('\nMEGA_FACES =', fmt(mega.FACES), ';');
console.log('\nMEGA_PERM =', fmt(mega.PERM), ';');
