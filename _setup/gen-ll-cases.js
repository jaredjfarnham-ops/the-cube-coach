/* Generate ENGINE-VERIFIED last-layer case sets (case + solving alg) for Pyraminx, Skewb, Megaminx.
   Method: (1) bootstrap the set of "last-layer stickers" from known reference algs (the indices they ever
   disturb); (2) search commutators/conjugates + short sequences for algs that leave every NON-LL sticker
   solved; (3) each such alg A defines a case = A(solved), solved by A'. Dedup cases up to AUF (U-rotation).
   Output JSON case sets to paste into data/. */
const fs=require('fs'), vm=require('vm');
const ctx={Math,JSON,Array,String,Object}; vm.createContext(ctx); vm.runInContext(fs.readFileSync('js/puzzles.js','utf8'),ctx);

const inv = m => m.includes("'") ? m.replace("'","") : m+"'";       // cube/pyra/mega prime toggle (mega U2↔U2')
const invSkewb = m => /[ULRB]/i.test(m) ? ((m.includes("'")||m.includes('2')) ? m.replace(/['2]/g,'') : m+"'") : inv(m);
const invSeq = (s,sk) => s.slice().reverse().map(sk?invSkewb:inv);

function setup(P){
  const cfg = {
    pyra:  { mk:ctx.makePyraminx, moves:["U","U'","L","L'","R","R'","B","B'"], aufN:3, auf:'U', skewb:false,
             ll:[0,1,2,6, 9,10,11,15, 18,19,20,24] },     // geometric: the U-vertex facelets of faces 0,1,2
    skewb: { mk:ctx.makeSkewb, moves:["U","U'","R","R'","L","L'","B","B'"], aufN:3, auf:'U', skewb:true, bootstrap:["R' L R L'"] },
    mega:  { mk:ctx.makeMegaminx, moves:["U","U'","U2","U2'","R","R'","F","F'"], aufN:5, auf:'U', skewb:false, megaGeo:true },
  }[P];
  const probe = cfg.mk(); const solved = probe.state();
  let ll;
  if (cfg.ll) ll = new Set(cfg.ll);
  else if (cfg.megaGeo) { ll = new Set(); const m=cfg.mk(); [m.faceLetter.U, ...m.neigh[m.faceLetter.U]].forEach(f=>{ for(let i=0;i<11;i++) ll.add(f*11+i); }); }  // U-hemisphere = last layer
  else { ll = new Set(); cfg.bootstrap.forEach(a => { for(let k=0;k<cfg.aufN;k++){ const s=cfg.mk(); s.reset();
    for(let j=0;j<k;j++) s.applyTokens([cfg.auf]); s.applyTokens(a.split(/\s+/));
    s.state().forEach((v,i)=>{ if(v!==solved[i]) ll.add(i); }); } }); }
  const nonLL = solved.map((_,i)=>i).filter(i=>!ll.has(i));
  const llArr = [...ll];
  const s=cfg.mk();
  const bottomOK = () => { const st=s.state(); return nonLL.every(i=>st[i]===solved[i]); };
  const llSolved = () => { const st=s.state(); return llArr.every(i=>st[i]===solved[i]); };
  return { cfg, solved, ll:llArr, nonLL, s, bottomOK, llSolved };
}

function gen(P){
  const E = setup(P);
  const { cfg, s, bottomOK, llSolved } = E;
  const found = new Map();      // canonical AUF sig → {alg, len}
  // read the LL signature after pre-applying k AUF turns to a fresh replay of `seq`
  const sigAfterAuf = (seq,k) => { const t=cfg.mk(); t.reset(); t.applyTokens(seq); for(let j=0;j<k;j++) t.applyTokens([cfg.auf]); return E.ll.map(i=>t.state()[i]).join(','); };
  function recordIfValid(seq){
    s.reset(); s.applyTokens(seq);
    if (llSolved() || !bottomOK()) return;          // must disturb LL but preserve the rest
    for (let k=1;k<cfg.aufN;k++){ const t=cfg.mk(); t.reset(); t.applyTokens(seq); for(let j=0;j<k;j++) t.applyTokens([cfg.auf]);
      if (E.ll.every(i=>t.state()[i]===E.solved[i])) return; }   // pure-AUF (solved by a U-turn) → not a real case
    let sig=null; for (let k=0;k<cfg.aufN;k++){ const ss=sigAfterAuf(seq,k); if(sig===null||ss<sig) sig=ss; }  // canonical up to AUF
    const prev = found.get(sig);
    const alg = invSeq(seq, cfg.skewb).join(' ');    // SOLVING alg = inverse of the setup
    if (!prev || seq.length < prev.len) found.set(sig, { alg, len:seq.length });
  }
  // commutators [A,B]=A B A' B' and conjugates A B A'
  const Apool = cfg.moves, Bpool = cfg.moves.filter(m=>m[0]===cfg.auf);
  function seqs(pool, maxLen){ let cur=[[]], out=[]; for(let L=1;L<=maxLen;L++){ const nx=[]; cur.forEach(s=>pool.forEach(m=>{ if(s.length&&m[0]===s[s.length-1][0])return; nx.push(s.concat(m)); })); out.push(...nx); cur=nx; } return out; }
  const As=seqs(Apool,4), Bs=seqs(Bpool.length?Bpool:[cfg.auf],2);
  As.forEach(A=>Bs.forEach(B=>{ recordIfValid([...A,...B,...invSeq(A,cfg.skewb),...invSeq(B,cfg.skewb)]);
                                recordIfValid([...A,...B,...invSeq(A,cfg.skewb)]); }));
  // also plain short sequences
  seqs(cfg.moves,6).forEach(sq=>{ if(sq.length>=3) recordIfValid(sq); });
  return { cases:[...found.values()].sort((a,b)=>a.len-b.len), ll:E.ll.length, nonLL:E.nonLL.length };
}

['pyra','skewb','mega'].forEach(P=>{
  const r = gen(P);
  console.log('=== '+P+' ===  LL stickers='+r.ll+'  cases found='+r.cases.length);
  r.cases.slice(0,40).forEach(c=>console.log('  ('+c.len+')  '+c.alg));
});
