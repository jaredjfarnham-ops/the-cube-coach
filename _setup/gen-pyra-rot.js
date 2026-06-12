/* Compute the Pyraminx whole-puzzle y rotation as a 36-facelet permutation, from the engine's
   own geometry. y = 120° about the U-vertex axis [1,1,1] (maps a point [a,b,c] -> [c,a,b]),
   which cycles vertices L->R->B->L and keeps U. Output the permutation array (applyPerm form:
   p[dst] = src, i.e. new[dst] = old[src]) plus a self-check (y^3 = identity). */
const T = 1/3, TT = 2/3;
const GV = [ [[1,0,0],[TT,T,0],[TT,0,T]], [[TT,T,0],[T,TT,0],[T,T,T]], [[TT,0,T],[T,T,T],[T,0,TT]],
  [[T,TT,0],[0,1,0],[0,TT,T]], [[T,T,T],[0,TT,T],[0,T,TT]], [[T,0,TT],[0,T,TT],[0,0,1]],
  [[TT,T,0],[TT,0,T],[T,T,T]], [[T,TT,0],[T,T,T],[0,TT,T]], [[T,T,T],[T,0,TT],[0,T,TT]] ];
const VT = { U:[1,1,1], L:[1,-1,-1], R:[-1,1,-1], B:[-1,-1,1] };
const FV = [['U','L','R'],['U','B','L'],['U','R','B'],['L','B','R']];

// centroid (3-D) of facelet (face f, sub-triangle i)
function centroid(f, i) {
  const cb = [0,1,2].map(k => (GV[i][0][k] + GV[i][1][k] + GV[i][2][k]) / 3);   // barycentric centroid
  const [a,b,c] = FV[f];
  return [0,1,2].map(k => VT[a][k]*cb[0] + VT[b][k]*cb[1] + VT[c][k]*cb[2]);
}
const C = []; for (let f=0; f<4; f++) for (let i=0; i<9; i++) C.push(centroid(f,i));
const rot = p => [p[2], p[0], p[1]];                       // 120° about [1,1,1]
const close = (a,b) => Math.abs(a[0]-b[0])<1e-6 && Math.abs(a[1]-b[1])<1e-6 && Math.abs(a[2]-b[2])<1e-6;

// p[dst] = src where rot(C[src]) == C[dst]
const perm = new Array(36).fill(-1);
for (let dst=0; dst<36; dst++) { for (let src=0; src<36; src++) { if (close(rot(C[src]), C[dst])) { perm[dst]=src; break; } } }

// validate: total permutation, and y^3 = identity
const bad = perm.filter(x => x<0).length;
const apply = (st, p) => p.map(s => st[s]);
let id = [...Array(36).keys()]; let s = id; for (let k=0;k<3;k++) s = apply(s, perm);
const cube3 = s.every((v,i)=>v===i);
console.log('unmatched facelets:', bad, ' y^3==identity:', cube3, ' isPermutation:', new Set(perm).size===36);
console.log('\nY: [' + perm.join(',') + '],');
