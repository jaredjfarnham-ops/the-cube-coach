/* Move notation table — drives the engine parser AND the Notation lesson. */
const groups = [
  { title:'Basic Face Turns', blurb:'A single capital letter = turn that one face 90° clockwise, as if looking straight at it. These six are the foundation — learn them cold.',
    moves:[
      {id:'R',name:'Right',axis:'x',angle:90, sel:c=>c.x===1, desc:'Right layer clockwise (seen from the right). The front-right edge lifts up.'},
      {id:'L',name:'Left', axis:'x',angle:-90,sel:c=>c.x===-1,desc:'Left layer clockwise (seen from the left). The front-left edge drops down.'},
      {id:'U',name:'Up',   axis:'y',angle:-90,sel:c=>c.y===-1,desc:'Top layer clockwise (seen from above). The front edge swings left.'},
      {id:'D',name:'Down', axis:'y',angle:90, sel:c=>c.y===1, desc:'Bottom layer clockwise (seen from below). The front edge swings right.'},
      {id:'F',name:'Front',axis:'z',angle:90, sel:c=>c.z===1, desc:'Front face clockwise. The top edge swings right.'},
      {id:'B',name:'Back', axis:'z',angle:-90,sel:c=>c.z===-1,desc:'Back face clockwise (seen from behind). The top edge swings left.'},
    ]},
  { title:'Slice Moves', blurb:'The three middle layers with no face of their own. Each follows a face you already know.',
    moves:[
      {id:'M',name:'Middle slice', axis:'x',angle:-90,sel:c=>c.x===0,desc:'Between L and R; follows the L direction (tracks down the front).'},
      {id:'E',name:'Equator slice',axis:'y',angle:90, sel:c=>c.y===0,desc:'Between U and D; follows the D direction.'},
      {id:'S',name:'Standing slice',axis:'z',angle:90,sel:c=>c.z===0,desc:'Between F and B; follows the F direction.'},
    ]},
  { title:'Cube Rotations', blurb:'x, y, z spin the WHOLE cube — they change your viewpoint without scrambling anything.',
    moves:[
      {id:'x',name:'Rotate on R',axis:'x',angle:90, whole:true,desc:'Roll the whole cube in the R direction; the front rolls up to the top.'},
      {id:'y',name:'Rotate on U',axis:'y',angle:-90,whole:true,desc:'Spin the whole cube in the U direction; the front turns to the left.'},
      {id:'z',name:'Rotate on F',axis:'z',angle:90, whole:true,desc:'Rotate the whole cube in the F direction, like a steering wheel.'},
    ]},
  { title:'Wide Turns (3×3)', blurb:'A LOWERCASE letter turns TWO layers — the face plus the slice beside it.',
    moves:[
      {id:'r',name:'Wide right',axis:'x',angle:90, sel:c=>c.x>=0,desc:'Right two layers (R + M), in the R direction.'},
      {id:'l',name:'Wide left', axis:'x',angle:-90,sel:c=>c.x<=0,desc:'Left two layers (L + M), in the L direction.'},
      {id:'u',name:'Wide up',   axis:'y',angle:-90,sel:c=>c.y<=0,desc:'Top two layers (U + E), in the U direction.'},
      {id:'d',name:'Wide down', axis:'y',angle:90, sel:c=>c.y>=0,desc:'Bottom two layers (D + E), in the D direction.'},
      {id:'f',name:'Wide front',axis:'z',angle:90, sel:c=>c.z>=0,desc:'Front two layers (F + S), in the F direction.'},
      {id:'b',name:'Wide back', axis:'z',angle:-90,sel:c=>c.z<=0,desc:'Back two layers (B + S), in the B direction.'},
    ]},
  { title:'Larger Cubes ( “w” = wide )', blurb:'On cubes bigger than 3×3 you say how many layers. “w” means wide. Rw = the outer two right layers (same as r on a 3×3).',
    moves:[
      {id:'Rw',name:'Wide right (big-cube)',axis:'x',angle:90, sel:c=>c.x>=0,desc:'Outer two right layers, like R.'},
      {id:'Lw',name:'Wide left (big-cube)', axis:'x',angle:-90,sel:c=>c.x<=0,desc:'Outer two left layers, like L.'},
      {id:'Uw',name:'Wide up (big-cube)',   axis:'y',angle:-90,sel:c=>c.y<=0,desc:'Outer two top layers, like U.'},
      {id:'Dw',name:'Wide down (big-cube)', axis:'y',angle:90, sel:c=>c.y>=0,desc:'Outer two bottom layers, like D.'},
      {id:'Fw',name:'Wide front (big-cube)',axis:'z',angle:90, sel:c=>c.z>=0,desc:'Outer two front layers, like F.'},
      {id:'Bw',name:'Wide back (big-cube)', axis:'z',angle:-90,sel:c=>c.z<=0,desc:'Outer two back layers, like B.'},
    ]},
];
const moveById = {};
groups.forEach(g => g.moves.forEach(m => moveById[m.id] = m));
