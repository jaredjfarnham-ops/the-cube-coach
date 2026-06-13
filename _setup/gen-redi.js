/* Generate the Redi Cube's 8 corner-twist permutations from cube geometry, as 54-sticker perms.
   Redi: 6 fixed centres, 8 corners (twist in place), 12 edges (cycle). A corner twist = 120° rotation
   about that cube vertex's body diagonal, applied ONLY to the pieces incident to the vertex (the corner
   piece + its 3 edges); centres and far pieces stay. We compute it by rotating the 3-D centroid of each
   incident, non-centre sticker 120° about the diagonal and matching to the destination sticker.
   Sticker layout = a standard 3x3 net (faces U D L R F B, sticker 0..8 row-major), 9 per face. */

// face → { n: outward normal, r: +screen-right dir, d: +screen-down dir } in world axes (x right, y up, z toward viewer/front)
const F = {
  U: { n:[0, 1,0], r:[1,0,0],  d:[0,0,1]  },
  D: { n:[0,-1,0], r:[1,0,0],  d:[0,0,-1] },
  L: { n:[-1,0,0], r:[0,0,1],  d:[0,-1,0] },
  R: { n:[1,0,0],  r:[0,0,-1], d:[0,-1,0] },
  F: { n:[0,0,1],  r:[1,0,0],  d:[0,-1,0] },
  B: { n:[0,0,-1], r:[-1,0,0], d:[0,-1,0] },
};
const FACES = ['U','D','L','R','F','B'];
const add = (a,b,k=1) => a.map((v,i)=>v+b[i]*k);
const scale = (a,k) => a.map(v=>v*k);

// 54 stickers: index = faceIdx*9 + (row*3+col). coord = n*1.5 + (col-1)*r + (row-1)*d
const ST = [];
FACES.forEach((fk,fi) => { const f=F[fk];
  for (let row=0; row<3; row++) for (let col=0; col<3; col++) {
    let c = scale(f.n,1.5); c = add(c, f.r, col-1); c = add(c, f.d, row-1);
    ST.push({ face:fk, fi, idx:fi*9+row*3+col, c });
  }
});
const findSticker = c => ST.findIndex(s => s.c.every((v,i)=>Math.abs(v-c[i])<1e-6));
const isCenter = c => c.filter(v=>Math.abs(v)<1e-6).length === 2;   // two zero coords → face centre
const sgn = v => Math.abs(v)<1e-6 ? 0 : (v>0?1:-1);
const incident = (c, sv) => c.every((v,i)=> Math.abs(v)<1e-6 || sgn(v)===sv[i]);   // free on a 0 axis, else sign must match the vertex

// Rodrigues rotation of vector v by angle θ about unit axis k
function rot(v, k, th) {
  const ct=Math.cos(th), st=Math.sin(th);
  const dot=v[0]*k[0]+v[1]*k[1]+v[2]*k[2];
  const cross=[k[1]*v[2]-k[2]*v[1], k[2]*v[0]-k[0]*v[2], k[0]*v[1]-k[1]*v[0]];
  return v.map((vi,i)=> vi*ct + cross[i]*st + k[i]*dot*(1-ct));
}

const CORNERS = [[1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],[-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1]];
const CNAME   = ['URF','URB','DRF','DRB','ULF','ULB','DLF','DLB'];   // by sign of (x,y,z): +x=R, +y=U, +z=F
const TH = 2*Math.PI/3;   // 120°

const perms = CORNERS.map(sv => {
  const k = scale(sv, 1/Math.sqrt(3));
  const p = ST.map(s=>s.idx);                    // identity by default (applyPerm: new[i]=old[p[i]])
  ST.forEach(s => {
    if (isCenter(s.c) || !incident(s.c, sv)) return;
    const dest = rot(s.c, k, TH);
    const t = findSticker(dest);
    if (t<0) { console.error('UNMATCHED', s.face, s.idx, dest.map(x=>x.toFixed(2))); return; }
    p[t] = s.idx;                                 // sticker s moves into position t
  });
  return p;
});

// ---- verify: each perm^3 == identity, and is a true permutation; report moved-sticker count ----
const apply = (st,p)=>p.map(i=>st[i]);
const ident = [...Array(54).keys()];
perms.forEach((p,i)=>{
  const p3 = apply(apply(p,p),p);
  const isPerm = new Set(p).size===54;
  const moved = p.filter((v,j)=>v!==j).length;
  console.error(`${CNAME[i]}: perm=${isPerm} cube(perm^3==id)=${p3.every((v,j)=>v===j)} moved=${moved}`);
});
// every sticker reachable from solved by some move sequence? quick check: union of moved positions covers all non-centre, non-?
// corner index that each CORNER sticker belongs to (-1 for edge/centre) — for click-to-twist
const cornerOf = ST.map(s => { if (s.c.some(v=>Math.abs(v)<1e-6)) return -1;   // has a 0 coord → not a corner sticker
  return CORNERS.findIndex(sv => sv.every((q,i)=>sgn(s.c[i])===q)); });
console.log('\nconst REDI_CORNERS = ' + JSON.stringify(CNAME) + ';');
console.log('const REDI_PERM = [' + perms.map(p=>'['+p.join(',')+']').join(',\n  ') + '];');
console.log('const REDI_CORNER_OF = [' + cornerOf.join(',') + '];');
