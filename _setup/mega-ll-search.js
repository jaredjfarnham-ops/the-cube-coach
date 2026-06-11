/* Find engine-verified Megaminx last-layer algs as COMMUTATORS [A,B]=A B A' B' and
   conjugates A B A' — the structures that yield clean last-layer cycles. */
const fs=require('fs'), vm=require('vm');
const ctx={Math,JSON,Array,String,Object}; vm.createContext(ctx); vm.runInContext(fs.readFileSync('js/puzzles.js','utf8'),ctx);
const mg = ctx.makeMegaminx();
const D = mg.faceLetter.D, bottom = new Set([D, ...mg.neigh[D]]);
const inv = m => m.includes("'") ? m.replace("'","") : m+"'";
const invSeq = s => s.slice().reverse().map(inv);
const A_MOVES = ["R","R'","R2","R2'","F","F'","L","L'"];   // setup moves (touch the lower layers)
const B_MOVES = ["U","U'","U2","U2'"];                     // interchange = U turns (last-layer only)
function bottomOK(){ return mg.nonUniform().every(f => !bottom.has(f)); }
function order(toks){ mg.reset(); for(let k=1;k<=8;k++){ mg.applyTokens(toks); if(mg.isSolved()) return k; } return 99; }
const found=[], seen=new Set();
function consider(toks){
  const key=toks.join(' '); if(seen.has(key)) return; seen.add(key);
  mg.reset(); mg.applyTokens(toks);
  if (mg.isSolved() || !bottomOK()) return;
  const dist=mg.nonUniform().length; if (dist>6) return;
  const ord=order(toks); if (ord>5 || ord<2) return;
  found.push({ alg:key, ord, dist, len:toks.length });
}
// commutators [A,B] with A up to 2 moves from A_MOVES, B up to 2 from B_MOVES
function seqs(pool, maxLen){ const out=[[]]; let cur=[[]];
  for(let L=1;L<=maxLen;L++){ const nx=[]; cur.forEach(s=>pool.forEach(m=>{ if(s.length&&m[0]===s[s.length-1][0])return; nx.push(s.concat(m)); })); out.push(...nx); cur=nx; }
  return out.filter(s=>s.length>=1); }
const As=seqs(A_MOVES,4), Bs=seqs(B_MOVES,2);
As.forEach(A=>{ Bs.forEach(B=>{
  consider([...A, ...B, ...invSeq(A), ...invSeq(B)]);       // commutator [A,B]
  consider([...B, ...A, ...invSeq(B), ...invSeq(A)]);       // commutator [B,A]
}); });
// conjugates of the found 3-cycles by a U-turn give more cases
found.sort((x,y)=> x.ord-y.ord || x.len-y.len || x.dist-y.dist);
console.log('found', found.length, '(ord3=', found.filter(f=>f.ord===3).length, 'ord2=', found.filter(f=>f.ord===2).length, ')');
found.filter(f=>f.len<=10).slice(0,30).forEach(f => console.log('order='+f.ord+'  faces='+f.dist+'  ('+f.len+')  '+f.alg));
