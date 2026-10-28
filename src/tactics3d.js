/* ═══════════════════════════════════════════════════════════════
   TAKTIK-BOARD 3D — die Engine hinter dem Taktik-Board der Bibel.

   Wird per import() erst beim Oeffnen geladen (three.js ~150 kB gz),
   gleiches Muster wie jsPDF und tesseract. Kein React hier: die Engine
   bekommt ein <canvas>, zeichnet, nimmt Gesten an und meldet sich per
   Callback. Der Screen (TacticsBoard in App.jsx) baut die Oberflaeche.

   Bildsprache: Toon-Shading in drei Stufen, Umrisslinien per
   „inverted hull“ (Rueckseite, etwas groesser, schwarz) — wie ein
   Indie-Spiel. Der Platz steht auf einer schwebenden Insel mit
   Clubhaus, zweitem Court, Teich, Bach und Wasserfall; ringsum
   Wolken, kleine Inseln, Voegel.

   Einheiten: Meter. Court 10 x 20, Mitte im Ursprung, Netz entlang
   der x-Achse. Team A (orange, 1+2) steht bei z > 0, Team B (blau,
   3+4) bei z < 0.

   Ein Spielzug ist eine Folge von Schritten:
     {label, p:[[x,z]×4], b:[x,y,z], h}
   p = Spielerpositionen, b = Ball am Ende des Schritts, h = Scheitel-
   hoehe des Balls auf dem Weg HIN zu diesem Schritt.
═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

/* ── Spielzuege ──────────────────────────────────────────────── */
const ST=(label,p,b,h=1)=>({label,p,b,h});
export const PLAYS=[
  {id:'globo',name:'Globo & Netz erobern',sub:'Der Lob über den Netzspieler',steps:[
    ST('Aufschlag',[[2.6,9.6],[-2.6,3.4],[-2.6,-9.4],[2.6,-3.4]],[2.9,1,9.2]),
    ST('Return',[[2.4,8],[-2.6,3.4],[-2.4,-8.6],[2.6,-3.4]],[-2.3,1,-8.4],1.3),
    ST('Gegner rücken vor',[[2.2,8.4],[-2.4,3.6],[-2.4,-3.2],[2.4,-3.2]],[2.1,.9,8.2],1.1),
    ST('Globo',[[2.2,7.4],[-2.4,4.4],[-2.4,-3.6],[2.4,-3.4]],[-1.8,.12,-8.4],6),
    ST('Netz erobert',[[2.4,3.2],[-2.4,3.2],[-2.6,-9.2],[2.6,-8.8]],[-2.1,1.3,-9.85],.9),
  ]},
  {id:'bandeja',name:'Bandeja statt Smash',sub:'Am Netz bleiben, wenn der Lob kommt',steps:[
    ST('Am Netz',[[2.4,3.2],[-2.4,3.2],[-2.6,-8.8],[2.6,-8.8]],[-2.4,1,-8.6]),
    ST('Lob des Gegners',[[2.4,3.4],[-2.4,3.4],[-2.6,-8.8],[2.6,-8.8]],[-2.2,2.6,6.4],6.5),
    ST('Zurück & Bandeja',[[2.2,4.4],[-2.2,6.4],[-2.6,-8.8],[2.6,-8.8]],[-2.1,2.4,6.6],.3),
    ST('Tief ins Eck',[[2.2,4],[-2.3,5.2],[-2.2,-8.6],[2.4,-8.4]],[3.6,.12,-8.8],1.8),
    ST('Wieder vorn',[[2.4,3.2],[-2.4,3.2],[-2,-9.1],[3.4,-9.2]],[3.9,1,-9.6],.5),
  ]},
  {id:'serve',name:'Aufschlag & Volley',sub:'Mit dem Aufschlag ans Netz',steps:[
    ST('Aufschlag',[[2.6,9.6],[-2.6,3.4],[-2.6,-9.4],[2.6,-3.4]],[2.9,1,9.2]),
    ST('Return kurz',[[2.4,7],[-2.6,3.4],[-2.4,-8.8],[2.6,-3.4]],[-2.4,1,-8.6],1.3),
    ST('Server rückt vor',[[2.2,4.6],[-2.4,3.2],[-2.4,-8.6],[2.6,-3.6]],[1.8,.9,4.3],1.2),
    ST('Volley zwischen sie',[[2.2,4.2],[-2.4,3.2],[-1.8,-8.8],[1.9,-3.9]],[.1,.12,-5.6],1),
  ]},
  {id:'eigen',name:'Eigener Spielzug',sub:'Spieler und Ball verschieben, Schritte anlegen',steps:[
    ST('Start',[[2.6,8],[-2.6,8],[-2.6,-8],[2.6,-8]],[2.9,1,7.6]),
    ST('Schritt 2',[[2.4,4],[-2.4,4],[-2.6,-8],[2.6,-8]],[0,.12,-6],2.5),
  ]},
];
export const clonePlay=p=>JSON.parse(JSON.stringify(p));

/* ── Wetter ──────────────────────────────────────────────────── */
export const WEATHERS=[
  {id:'sun',label:'Sonne'},{id:'rain',label:'Regen'},{id:'night',label:'Nacht'},
  {id:'fog',label:'Nebel'},{id:'snow',label:'Schnee'},
];
const WX={
  sun:  {skyT:0x6fa8ff,skyB:0xffd9a8,fog:0xffe0bd,fN:70,fF:260,sun:0xfff1d6,sunI:2.6,hS:0xfff0e0,hG:0x6a8a4a,hI:1.1,grass:0x8fcf5a,leaf:0x55b04a,exp:1.0,night:0,rain:0,snow:0,cloud:0xffffff},
  rain: {skyT:0x5f6f80,skyB:0xa7b3bf,fog:0x8996a3,fN:30,fF:150,sun:0xdde6ef,sunI:.9,hS:0xc3ced9,hG:0x3e4f3a,hI:1.2,grass:0x5f9a4a,leaf:0x3f7f3f,exp:.95,night:0,rain:1,snow:0,cloud:0x9aa6b2},
  night:{skyT:0x050a1c,skyB:0x1b2a52,fog:0x101a33,fN:70,fF:260,sun:0x8aa2ff,sunI:.5,hS:0x5a6aa0,hG:0x16203a,hI:.95,grass:0x4f8048,leaf:0x2d5634,exp:1.05,night:1,rain:0,snow:0,cloud:0x39466e},
  fog:  {skyT:0xc9d1d8,skyB:0xe6eaee,fog:0xdfe4e8,fN:8,fF:62,sun:0xffffff,sunI:1.2,hS:0xf2f5f8,hG:0x7d8f72,hI:1.3,grass:0x8db87a,leaf:0x6a9a68,exp:1.0,night:0,rain:0,snow:0,cloud:0xf3f5f7},
  snow: {skyT:0x9cb7d6,skyB:0xeef3fa,fog:0xe8eef6,fN:40,fF:200,sun:0xffffff,sunI:1.9,hS:0xffffff,hG:0x9fb0c4,hI:1.25,grass:0xf1f5fb,leaf:0xdfe9f2,exp:1.0,night:0,rain:0,snow:1,cloud:0xffffff},
};
const COLKEYS=['skyT','skyB','fog','sun','hS','hG','grass','leaf','cloud'];

/* ── Hilfen ──────────────────────────────────────────────────── */
const ORANGE=0xff7a1a, BLUE=0x2e7bff, BALL=0xd8f23b, INK=0x14161b;
const rng=(s=11)=>()=>(s=(s*16807)%2147483647)/2147483647;
const easeIO=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function webglOk(){
  try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}
  catch{return false;}
}

export function createBoard(canvas,{play,weather='sun',onState,onEdit,reduced=false}={}){
  const R=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  R.shadowMap.enabled=true; R.shadowMap.type=THREE.PCFSoftShadowMap;
  R.outputColorSpace=THREE.SRGBColorSpace;
  R.toneMapping=THREE.ACESFilmicToneMapping;

  const S=new THREE.Scene();
  S.fog=new THREE.Fog(0xffffff,60,240);
  const cam=new THREE.PerspectiveCamera(50,1,.1,900);

  /* Toon: drei harte Stufen statt weicher Verlauf */
  const gm=new THREE.DataTexture(new Uint8Array([90,90,90,255,175,175,175,255,255,255,255,255]),3,1,THREE.RGBAFormat);
  gm.minFilter=gm.magFilter=THREE.NearestFilter; gm.needsUpdate=true;
  const toon=(c,o={})=>new THREE.MeshToonMaterial({color:c,gradientMap:gm,...o});
  const INKM=new THREE.MeshBasicMaterial({color:INK,side:THREE.BackSide});
  const outline=(m,w=.06)=>{const o=new THREE.Mesh(m.geometry,INKM);o.scale.setScalar(1+w);m.add(o);return m;};
  const shadowy=o=>{o.traverse(c=>{if(c.isMesh&&c.material!==INKM){c.castShadow=true;c.receiveShadow=true;}});return o;};

  /* ── Himmel ── */
  const skyU={a:{value:new THREE.Color()},b:{value:new THREE.Color()}};
  S.add(new THREE.Mesh(new THREE.SphereGeometry(500,32,16),new THREE.ShaderMaterial({
    side:THREE.BackSide,fog:false,depthWrite:false,uniforms:skyU,
    vertexShader:'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 a;uniform vec3 b;varying vec3 p;void main(){float t=smoothstep(-.25,.6,p.y);gl_FragColor=vec4(mix(b,a,t),1.);}'})));
  const stars=(()=>{const n=700,pos=new Float32Array(n*3),r=rng(5);
    for(let i=0;i<n;i++){const th=r()*6.283,ph=r()*1.4;pos.set([Math.cos(th)*Math.cos(ph)*420,Math.sin(ph)*420+30,Math.sin(th)*Math.cos(ph)*420],i*3);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const p=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,fog:false,transparent:true,opacity:0}));
    S.add(p);return p;})();
  const disc=(col,r)=>{const m=new THREE.Mesh(new THREE.CircleGeometry(r,32),new THREE.MeshBasicMaterial({color:col,fog:false,transparent:true}));S.add(m);return m;};
  const sunDisc=disc(0xfff1c4,14), moonDisc=disc(0xe9efff,9);
  sunDisc.position.set(-160,120,-260); sunDisc.lookAt(0,0,0);
  moonDisc.position.set(170,150,-240); moonDisc.lookAt(0,0,0);

  /* ── Licht ── */
  const hemi=new THREE.HemisphereLight(0xffffff,0x445533,1); S.add(hemi);
  const sun=new THREE.DirectionalLight(0xffffff,2); sun.position.set(-30,42,-18); sun.castShadow=true;
  sun.shadow.mapSize.set(1536,1536);
  Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:140});
  sun.shadow.bias=-.0005; sun.shadow.normalBias=.04; S.add(sun);

  /* ── Insel ── */
  const world=new THREE.Group(); S.add(world);
  const RIM=(th)=>34+Math.sin(th*3)*2.2+Math.sin(th*7+1)*1.3+Math.cos(th*5)*1.6;
  const grassM=toon(0x8fcf5a);
  {
    const N=72, shape=new THREE.Shape();
    for(let i=0;i<=N;i++){const th=i/N*Math.PI*2,r=RIM(th);i?shape.lineTo(Math.cos(th)*r,Math.sin(th)*r):shape.moveTo(r,0);}
    const top=new THREE.Mesh(new THREE.ShapeGeometry(shape,1),grassM);
    top.rotation.x=-Math.PI/2; top.position.y=-.02; top.receiveShadow=true; world.add(top);
    // Flanke: Erde, dann Fels, bis zur Spitze
    const rings=[[0,1,0x7a5a3a],[-2.2,.985,0x6b4b2f],[-6,.82,0x7d766c],[-11,.55,0x6c665e],[-16,.26,0x5d5852],[-21,.04,0x524e49]];
    const pos=[],col=[],c=new THREE.Color(),r=rng(3);
    const jit=rings.map(()=>Array.from({length:N},()=>.9+r()*.2));
    for(let k=0;k<rings.length-1;k++) for(let i=0;i<N;i++){
      const a0=i/N*Math.PI*2,a1=(i+1)/N*Math.PI*2;
      const P=(kk,a,ii)=>{const s=rings[kk][1]*(kk?jit[kk][ii%N]:1);const rr=RIM(a)*s;return[Math.cos(a)*rr,rings[kk][0],-Math.sin(a)*rr];};
      const q=[P(k,a0,i),P(k,a1,i+1),P(k+1,a1,i+1),P(k+1,a0,i)];
      [[0,2,1],[0,3,2]].forEach(t=>t.forEach(j=>{pos.push(...q[j]);c.set(rings[j>1?k+1:k][2]);col.push(c.r,c.g,c.b);}));
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
    world.add(new THREE.Mesh(g,toon(0xffffff,{vertexColors:true,flatShading:true})));
  }
  // Wege (hell)
  const pathM=toon(0xe9dcc2);
  const strip=(x,z,w,l,ry=0)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),pathM);m.rotation.set(-Math.PI/2,0,ry);m.position.set(x,.015,z);m.receiveShadow=true;world.add(m);return m;};
  strip(-9.5,-2,7,2.2,Math.PI/2); strip(11.5,0,5,2.4,Math.PI/2); strip(-17,6,2.2,14);

  /* ── Court ── */
  const courtTex=(()=>{
    const cv=document.createElement('canvas');cv.width=512;cv.height=1024;const c=cv.getContext('2d');
    c.fillStyle='#2f6fd0';c.fillRect(0,0,512,1024);
    const r=rng(9);for(let i=0;i<9000;i++){c.fillStyle=`rgba(255,255,255,${r()*.05})`;c.fillRect(r()*512,r()*1024,2,2);}
    c.strokeStyle='#fff';c.lineWidth=7;c.strokeRect(3.5,3.5,505,1017);
    const k=51.2,sl=10-6.95;c.beginPath();
    c.moveTo(0,sl*k);c.lineTo(512,sl*k);c.moveTo(0,(20-sl)*k);c.lineTo(512,(20-sl)*k);
    c.moveTo(256,sl*k);c.lineTo(256,(20-sl)*k);c.stroke();
    const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;})();
  const glassM=new THREE.MeshBasicMaterial({color:0xd9f2ff,transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false});
  const glassEdge=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.75});
  const frameM=toon(0x2b2f37), meshM=new THREE.MeshBasicMaterial({color:0x22252b,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false});
  const lampLens=[], spots=[], masts=[];
  function buildCourt(ox,oz,full=true){
    const g=new THREE.Group();g.position.set(ox,0,oz);world.add(g);
    const slab=new THREE.Mesh(new THREE.BoxGeometry(12.6,.3,22.8),toon(0xb9b2a4));slab.position.y=-.13;slab.receiveShadow=true;g.add(slab);
    const turf=new THREE.Mesh(new THREE.PlaneGeometry(10,20),new THREE.MeshToonMaterial({map:courtTex,gradientMap:gm}));
    turf.rotation.x=-Math.PI/2;turf.position.y=.025;turf.receiveShadow=true;g.add(turf);
    const net=new THREE.Mesh(new THREE.BoxGeometry(10.4,.86,.04),new THREE.MeshBasicMaterial({color:0x1b1d22,transparent:true,opacity:.55}));
    net.position.y=.46;g.add(net);
    const tape=new THREE.Mesh(new THREE.BoxGeometry(10.4,.07,.07),toon(0xffffff));tape.position.y=.9;g.add(tape);
    [-5.25,5.25].forEach(x=>{const p=outline(new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.95,8),frameM),.25);p.position.set(x,.47,0);g.add(p);});
    const panel=(w,h,x,y,z,ry,mat)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.rotation.y=ry;g.add(m);
      if(mat===glassM){const e=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),glassEdge);e.position.copy(m.position);e.rotation.copy(m.rotation);g.add(e);}};
    [-10,10].forEach(z=>{panel(10,3,0,1.5,z,0,glassM);panel(10,1,0,3.5,z,0,meshM);});
    [-5,5].forEach(x=>{[-1,1].forEach(s=>{panel(2,3,x,1.5,s*9,Math.PI/2,glassM);panel(2,2,x,1,s*7,Math.PI/2,glassM);});
      panel(12,3,x,1.5,0,Math.PI/2,meshM);});
    const pg=new THREE.BoxGeometry(.09,1,.09);
    for(let z=-10;z<=10;z+=2)[-5,5].forEach(x=>{const h=Math.abs(z)>=8?4:3;const p=new THREE.Mesh(pg,frameM);p.scale.y=h;p.position.set(x,h/2,z);p.castShadow=true;g.add(p);});
    for(let x=-4;x<=4;x+=2)[-10,10].forEach(z=>{const p=new THREE.Mesh(pg,frameM);p.scale.y=4;p.position.set(x,2,z);g.add(p);});
    [-5,5].forEach(x=>[-10,10].forEach(z=>{const b=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,1),frameM);b.position.set(x,4,z*.95);}));
    // Flutlicht
    [[-6.8,-6],[6.8,-6],[-6.8,6],[6.8,6]].forEach(([x,z])=>{
      const pm=toon(0x2b2f37,{transparent:true}),om=INKM.clone();om.transparent=true;
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,7.2,8),pm);pole.position.set(x,3.6,z);pole.castShadow=true;g.add(pole);
      const po=new THREE.Mesh(pole.geometry,om);po.scale.setScalar(1.2);pole.add(po);
      const head=new THREE.Mesh(new THREE.BoxGeometry(1,.18,.5),pm);head.position.set(x-Math.sign(x)*.4,7.2,z);g.add(head);
      if(full)masts.push({x:ox+x,z:oz+z,ms:[pm,om]});
      const lens=new THREE.Mesh(new THREE.PlaneGeometry(.86,.38),new THREE.MeshBasicMaterial({color:0x555555}));
      lens.rotation.x=Math.PI/2;lens.position.set(x-Math.sign(x)*.4,7.1,z);g.add(lens);lampLens.push(lens);
    });
    if(full){
      [-1,1].forEach(s=>{const sp=new THREE.SpotLight(0xfff0d6,0,46,Math.PI/3.4,.6,1.2);
        sp.position.set(ox+s*6,7,oz);sp.target.position.set(ox+s*1.5,0,oz);S.add(sp,sp.target);spots.push(sp);});
    }
    shadowy(g);return g;
  }
  buildCourt(0,0,true);
  buildCourt(17,0,false);

  /* ── Clubhaus mit Terrasse ── */
  const houseWin=[];
  {
    const h=new THREE.Group();h.position.set(-17,0,-5);world.add(h);
    const wall=outline(new THREE.Mesh(new THREE.BoxGeometry(6,3.2,9),toon(0xf3e6cf)),.03);wall.position.y=1.6;h.add(wall);
    const roofGeo=new THREE.CylinderGeometry(0,4.9,2.2,4,1);roofGeo.rotateY(Math.PI/4);
    const roof=outline(new THREE.Mesh(roofGeo,toon(0xd9572b)),.04);roof.scale.set(.95,1,1.45);roof.position.y=4.3;h.add(roof);
    const winM=new THREE.MeshBasicMaterial({color:0x7da9c9});
    for(let i=-1;i<=1;i++){const w=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.1),winM);w.position.set(3.01,1.9,i*2.6);w.rotation.y=Math.PI/2;h.add(w);}
    houseWin.push(winM);
    const door=new THREE.Mesh(new THREE.PlaneGeometry(1.1,2),toon(0x8a5a36));door.position.set(3.01,1,0);door.rotation.y=Math.PI/2;door.position.z=1.3;h.add(door);
    const deck=new THREE.Mesh(new THREE.BoxGeometry(4.2,.25,9),toon(0xb98a5a));deck.position.set(5.1,.12,0);h.add(deck);
    [-2.4,2.4].forEach(z=>{
      const t=outline(new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.08,14),toon(0xffffff)),.08);t.position.set(5.3,.95,z);h.add(t);
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.75,6),frameM);leg.position.set(5.3,.55,z);h.add(leg);
      const um=outline(new THREE.Mesh(new THREE.ConeGeometry(1.5,.7,8,1,true),toon(z<0?ORANGE:0xffffff,{side:THREE.DoubleSide})),.03);um.position.set(5.3,2.6,z);h.add(um);
      const st=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2.4,6),frameM);st.position.set(5.3,1.4,z);h.add(st);
    });
    // Schild
    const cv=document.createElement('canvas');cv.width=256;cv.height=64;const c=cv.getContext('2d');
    c.fillStyle='#1b1d22';c.fillRect(0,0,256,64);c.fillStyle='#ff7a1a';c.font='700 40px "Space Grotesk",system-ui,sans-serif';
    c.textAlign='center';c.textBaseline='middle';c.fillText('RITMO CLUB',128,34);
    const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(4,1),new THREE.MeshBasicMaterial({map:tx}));sign.position.set(3.05,3.0,0);sign.rotation.y=Math.PI/2;h.add(sign);
    shadowy(h);
  }
  /* Fahnenmast */
  const flag=(()=>{
    const pole=outline(new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,7,8),toon(0xdddddd)),.25);pole.position.set(-10.5,3.5,-11);world.add(pole);
    const g=new THREE.PlaneGeometry(2.2,1.3,12,4);g.translate(1.1,0,0);
    const f=new THREE.Mesh(g,toon(ORANGE,{side:THREE.DoubleSide}));f.position.set(-10.45,6.2,-11);world.add(f);
    return{f,base:g.attributes.position.array.slice()};})();
  /* Baenke */
  [[-7.6,-4],[-7.6,4],[7.6,-4],[7.6,4]].forEach(([x,z])=>{
    const b=new THREE.Group();b.position.set(x,0,z);
    const seat=outline(new THREE.Mesh(new THREE.BoxGeometry(.5,.1,2.2),toon(0xc8874e)),.06);seat.position.y=.48;b.add(seat);
    const back=outline(new THREE.Mesh(new THREE.BoxGeometry(.08,.5,2.2),toon(0xc8874e)),.06);back.position.set(x>0?.24:-.24,.8,0);b.add(back);
    [-.9,.9].forEach(dz=>{const l=new THREE.Mesh(new THREE.BoxGeometry(.4,.46,.08),frameM);l.position.set(0,.23,dz);b.add(l);});
    world.add(shadowy(b));
  });

  /* ── Teich, Bach, Wasserfall ── */
  const waterTex=(()=>{const cv=document.createElement('canvas');cv.width=64;cv.height=256;const c=cv.getContext('2d');
    c.fillStyle='#5cc4ee';c.fillRect(0,0,64,256);c.fillStyle='rgba(255,255,255,.6)';
    for(let i=0;i<18;i++){c.fillRect((i*23)%64,(i*37)%256,10+(i%3)*8,3);}
    const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;})();
  const waterM=new THREE.MeshBasicMaterial({map:waterTex,transparent:true,opacity:.92});
  const pond=new THREE.Mesh(new THREE.CircleGeometry(4.2,28),waterM);pond.rotation.x=-Math.PI/2;pond.position.set(-15,.02,18);world.add(pond);
  // Bach: vom Teich gerade zur Kante; dort faellt er ueber den Rand.
  const BD=[-.62,.78],bth=Math.atan2(-BD[1],BD[0]),bR=RIM(bth)-.15;
  const B0=[-15+BD[0]*3.6,18+BD[1]*3.6],B1=[BD[0]*bR,BD[1]*bR],bL=Math.hypot(B1[0]-B0[0],B1[1]-B0[1]);
  const bg=new THREE.PlaneGeometry(1.8,bL);bg.rotateX(-Math.PI/2);
  const brook=new THREE.Mesh(bg,waterM);brook.position.set((B0[0]+B1[0])/2,.03,(B0[1]+B1[1])/2);brook.rotation.y=Math.atan2(BD[0],BD[1]);world.add(brook);
  const fall=new THREE.Mesh(new THREE.PlaneGeometry(1.9,24),waterM);fall.position.set(B1[0]+BD[0]*.6,-12,B1[1]+BD[1]*.6);
  fall.rotation.y=Math.atan2(BD[0],BD[1]);world.add(fall);
  const mist=new THREE.Mesh(new THREE.SphereGeometry(2.4,10,8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35}));
  mist.position.set(fall.position.x,-23.5,fall.position.z);mist.scale.y=.5;world.add(mist);
  /* Steine */
  {const r=rng(21),rm=toon(0x9a958c,{flatShading:true});
    [[-11,20],[-19,15],[-12,14.5],[22,-16],[25,12],[-26,-14],[6,-17],[-4,18]].forEach(([x,z])=>{
      const s=.5+r()*1.1,m=outline(new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),rm),.06);m.position.set(x,s*.45,z);m.rotation.set(r()*3,r()*3,0);world.add(shadowy(m));});}

  /* ── Baeume (instanziert, samt Umriss) ── */
  const leafMs=[];
  {
    const r=rng(42), spots_=[];
    for(let i=0;i<400&&spots_.length<70;i++){
      const a=r()*Math.PI*2, d=8+r()*25, x=Math.cos(a)*d, z=Math.sin(a)*d;
      if(d>RIM(Math.atan2(-z,x))-2.5) continue;
      if(Math.abs(x)<8&&Math.abs(z)<13) continue;          // Court 1
      if(Math.abs(x-17)<8&&Math.abs(z)<13) continue;       // Court 2
      if(x<-12&&x>-23&&z>-12&&z<3) continue;               // Clubhaus
      if(Math.hypot(x-22,z+20)<4) continue;                // Windmuehle
      if(Math.hypot(x+15,z-18)<6) continue;                // Teich
      {const t=clamp(((x-B0[0])*(B1[0]-B0[0])+(z-B0[1])*(B1[1]-B0[1]))/(bL*bL),0,1);
        if(Math.hypot(x-B0[0]-(B1[0]-B0[0])*t,z-B0[1]-(B1[1]-B0[1])*t)<2.4) continue;}   // Bach
      if(spots_.some(([sx,sz])=>Math.hypot(sx-x,sz-z)<2.6)) continue;
      spots_.push([x,z,r()<.5?0:1,.8+r()*.7]);
    }
    const trunkG=new THREE.CylinderGeometry(.16,.24,1,6), roundG=new THREE.IcosahedronGeometry(1,0), pineG=new THREE.ConeGeometry(1,2.2,7);
    const mk=(geo,mat,list,f)=>{const im=new THREE.InstancedMesh(geo,mat,list.length);const o=new THREE.Object3D();
      list.forEach((s,i)=>{f(o,s);o.updateMatrix();im.setMatrixAt(i,o.matrix);});im.castShadow=true;im.receiveShadow=true;world.add(im);return im;};
    const leafA=toon(0x55b04a,{flatShading:true}), leafB=toon(0x3f9a52,{flatShading:true});leafMs.push(leafA,leafB);
    const round=spots_.filter(s=>s[2]===0), pine=spots_.filter(s=>s[2]===1);
    mk(trunkG,toon(0x8a5a36),spots_,(o,[x,z,,s])=>{o.position.set(x,.6*s,z);o.scale.set(s,1.2*s,s);o.rotation.set(0,0,0);});
    const roundF=(w)=>(o,[x,z,,s])=>{o.position.set(x,2*s,z);o.scale.setScalar(1.25*s*(1+w));o.rotation.set(x,z,0);};
    const pineF=(w)=>(o,[x,z,,s])=>{o.position.set(x,2.3*s,z);o.scale.set(1.1*s*(1+w),1.3*s*(1+w*.6),1.1*s*(1+w));o.rotation.set(0,x,0);};
    mk(roundG,leafA,round,roundF(0)); mk(pineG,leafB,pine,pineF(0));
    const ol=(geo,list,f)=>{const im=mk(geo,INKM,list,f);im.castShadow=false;};
    ol(roundG,round,roundF(.07)); ol(pineG,pine,pineF(.07));
    // Hecken entlang des Clubhaus-Wegs
    const hedgeM=toon(0x4b9e47,{flatShading:true});leafMs.push(hedgeM);
    for(let i=0;i<6;i++){const hh=outline(new THREE.Mesh(new THREE.BoxGeometry(1.2,.9,1.2),hedgeM),.05);hh.position.set(-14.6+(i%2)*-4.8,.45,-12+Math.floor(i/2)*2.2+20);world.add(shadowy(hh));}
  }

  /* ── Wolken, Nebeninseln, Voegel ── */
  const cloudM=toon(0xffffff,{flatShading:true});
  const clouds=new THREE.Group();S.add(clouds);
  {const r=rng(77);
    for(let i=0;i<18;i++){
      const g=new THREE.Group();const n=3+Math.floor(r()*3);
      for(let k=0;k<n;k++){const s=2.2+r()*2.6;const m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,1),cloudM);
        m.position.set((k-n/2)*s*1.1,r()*1.2,r()*2);m.scale.y=.75;g.add(m);}
      const a=r()*Math.PI*2,d=48+r()*90;g.position.set(Math.cos(a)*d,(r()<.4?-14-r()*18:8+r()*26),Math.sin(a)*d);
      g.rotation.y=r()*6;clouds.add(g);}}
  {const r=rng(31);
    [[70,-6,-60,.32],[-85,4,-35,.25],[60,-14,70,.28],[-50,-20,90,.22],[110,10,20,.2]].forEach(([x,y,z,s])=>{
      const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(s);
      const top=new THREE.Mesh(new THREE.CylinderGeometry(30,16,8,9),toon(0x8fcf5a,{flatShading:true}));top.position.y=-4;g.add(top);
      const bot=new THREE.Mesh(new THREE.ConeGeometry(16,26,9),toon(0x7d766c,{flatShading:true}));bot.rotation.x=Math.PI;bot.position.y=-21;g.add(bot);
      for(let k=0;k<4;k++){const t=new THREE.Mesh(new THREE.ConeGeometry(5,12,7),toon(0x3f9a52,{flatShading:true}));t.position.set((r()-.5)*36,6,(r()-.5)*36);g.add(t);}
      S.add(g);});}
  /* Heissluftballon und Windmuehle — das bisschen Leben am Rand */
  const balloon=new THREE.Group();
  {const env=outline(new THREE.Mesh(new THREE.SphereGeometry(3,16,12),toon(0xffffff)),.04);env.scale.y=1.15;balloon.add(env);
    for(let i=0;i<8;i+=2){const st=new THREE.Mesh(new THREE.SphereGeometry(3.02,16,12,i/8*Math.PI*2,Math.PI/8),toon(ORANGE));st.scale.y=1.15;balloon.add(st);}
    const bask=outline(new THREE.Mesh(new THREE.BoxGeometry(1.2,.9,1.2),toon(0x9a6a3c)),.08);bask.position.y=-4.6;balloon.add(bask);
    [[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]].forEach(([x,z])=>{const r=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.6,4),toon(INK));r.position.set(x,-3.6,z);balloon.add(r);});
    S.add(balloon);}
  const mill=new THREE.Group();
  {mill.position.set(22,0,-20);world.add(mill);
    const tw=outline(new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.9,6.5,8),toon(0xf3e6cf)),.04);tw.position.y=3.25;mill.add(tw);
    const cap=outline(new THREE.Mesh(new THREE.ConeGeometry(1.7,1.8,8),toon(0xd9572b)),.05);cap.position.y=7.4;mill.add(cap);
    const hub=new THREE.Group();hub.position.set(0,6.4,1.6);mill.add(hub);
    for(let i=0;i<4;i++){const b=outline(new THREE.Mesh(new THREE.BoxGeometry(.7,4.6,.08),toon(0xffffff)),.06);b.position.y=2.4;
      const arm=new THREE.Group();arm.rotation.z=i*Math.PI/2;arm.add(b);hub.add(arm);}
    mill.rotation.y=-.9;mill.userData.hub=hub;shadowy(mill);}
  const birds=[];
  {const bm=new THREE.MeshBasicMaterial({color:INK,side:THREE.DoubleSide});
    for(let i=0;i<6;i++){const g=new THREE.Group();
      const w=new THREE.PlaneGeometry(.9,.18);w.translate(.45,0,0);
      const l=new THREE.Mesh(w,bm),rr=new THREE.Mesh(w,bm);rr.rotation.y=Math.PI;g.add(l,rr);
      S.add(g);birds.push({g,l,r:rr,ph:i*1.1,rad:26+i*4,h:14+i*1.5,sp:.18+i*.02});}}

  /* ── Wetter-Partikel ── */
  const RN=2600, rainPos=new Float32Array(RN*6), rr=rng(13);
  for(let i=0;i<RN;i++){const x=(rr()-.5)*80,y=rr()*40,z=(rr()-.5)*80;rainPos.set([x,y,z,x+.04,y-.7,z+.02],i*6);}
  const rainG=new THREE.BufferGeometry();rainG.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
  const rain=new THREE.LineSegments(rainG,new THREE.LineBasicMaterial({color:0xdfe9f5,transparent:true,opacity:0}));rain.frustumCulled=false;S.add(rain);
  const SN=1800, snowPos=new Float32Array(SN*3);
  for(let i=0;i<SN;i++)snowPos.set([(rr()-.5)*80,rr()*40,(rr()-.5)*80],i*3);
  const snowG=new THREE.BufferGeometry();snowG.setAttribute('position',new THREE.BufferAttribute(snowPos,3));
  const snow=new THREE.Points(snowG,new THREE.PointsMaterial({color:0xffffff,size:.16,transparent:true,opacity:0}));snow.frustumCulled=false;S.add(snow);

  /* ── Spieler & Ball ── */
  const label=(txt,col)=>{const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');
    x.fillStyle='#14161b';x.beginPath();x.arc(64,64,54,0,7);x.fill();x.lineWidth=10;x.strokeStyle=col;x.stroke();
    x.fillStyle='#fff';x.font='700 64px "Space Grotesk",system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,64,70);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,fog:false}));s.scale.set(.8,.8,1);s.renderOrder=10;return s;};
  const pickM=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
  const skins=[0xf0c8a4,0xc68e63,0xe8b48c,0x9b6a48];
  const players=[0,1,2,3].map(i=>{
    const team=i<2?'a':'b',col=team==='a'?ORANGE:BLUE;
    const g=new THREE.Group();
    const body=outline(new THREE.Mesh(new THREE.CapsuleGeometry(.3,.5,4,10),toon(col)),.08);body.position.y=1.05;g.add(body);
    const shorts=outline(new THREE.Mesh(new THREE.CylinderGeometry(.3,.32,.3,10),toon(0x23262d)),.08);shorts.position.y=.62;g.add(shorts);
    const head=outline(new THREE.Mesh(new THREE.SphereGeometry(.24,14,10),toon(skins[i])),.08);head.position.y=1.68;g.add(head);
    const hair=new THREE.Mesh(new THREE.SphereGeometry(.25,14,8,0,Math.PI*2,0,Math.PI/2.2),toon([0x2a1d14,0x5a3a20,0xd8b25a,0x1a1a1a][i]));hair.position.y=1.72;g.add(hair);
    [-.13,.13].forEach(o=>{const l=outline(new THREE.Mesh(new THREE.CapsuleGeometry(.09,.36,3,8),toon(skins[i])),.12);l.position.set(o,.27,0);g.add(l);});
    const rk=new THREE.Group();
    const rh=outline(new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.05,18),toon(INK)),.1);rh.rotation.x=Math.PI/2;rh.position.y=.3;rk.add(rh);
    rk.add(new THREE.Mesh(new THREE.CylinderGeometry(.03,.035,.28,6),toon(INK)));rk.position.set(.42,1.05,0);rk.rotation.z=-.5;g.add(rk);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.5,.62,40),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.95}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.035;g.add(ring);
    const lb=label(String(i+1),team==='a'?'#ff7a1a':'#2e7bff');lb.position.y=2.35;g.add(lb);
    const pick=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,2.6,8),pickM);pick.position.y=1.2;pick.userData.pi=i;g.add(pick);
    shadowy(g);S.add(g);return{g,team,pick,ring,rk};
  });
  const ball=outline(new THREE.Mesh(new THREE.SphereGeometry(.16,16,12),toon(BALL)),.18);ball.castShadow=true;S.add(ball);
  const ballPick=new THREE.Mesh(new THREE.SphereGeometry(.9,8,6),pickM);ballPick.userData.ball=true;S.add(ballPick);
  const ballShadow=new THREE.Mesh(new THREE.CircleGeometry(.2,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,depthWrite:false}));
  ballShadow.rotation.x=-Math.PI/2;S.add(ballShadow);

  /* ── Hilfslinien des naechsten Schritts ── */
  const guides=new THREE.Group();S.add(guides);
  const ARROW=new THREE.BufferGeometry();ARROW.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.42,.3,0,-.2,-.3,0,-.2],3));
  const ribbon=(a,b,col,dash=true,w=.11)=>{
    const ax=a[0],az=a[1],bx=b[0],bz=b[1],L=Math.hypot(bx-ax,bz-az);if(L<.35)return;
    const N=Math.max(4,Math.round(L*4)),nx=-(bz-az)/L*w,nz=(bx-ax)/L*w,pos=[],idx=[];
    for(let i=0;i<=N;i++){const u=i/N*(1-.5/L),x=ax+(bx-ax)*u,z=az+(bz-az)*u;pos.push(x+nx,.045,z+nz,x-nx,.045,z-nz);
      if(i<N&&(!dash||i%3<2))idx.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);
    const m=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false});
    guides.add(new THREE.Mesh(g,m));
    const hd=new THREE.Mesh(ARROW,m);hd.position.set(bx-(bx-ax)/L*.3,.05,bz-(bz-az)/L*.3);
    hd.rotation.y=Math.atan2(bx-ax,bz-az);guides.add(hd);
  };
  const arc=(a,b,h)=>{const pts=[];for(let i=0;i<=40;i++){const u=i/40;pts.push(new THREE.Vector3(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u+4*h*u*(1-u),a[2]+(b[2]-a[2])*u));}
    const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),60,.045,6,false),
      new THREE.MeshBasicMaterial({color:BALL,transparent:true,opacity:.9}));guides.add(t);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.35,.5,30),new THREE.MeshBasicMaterial({color:BALL,transparent:true,opacity:.9,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2;ring.position.set(b[0],.05,b[2]);guides.add(ring);};
  const clearGuides=()=>{guides.children.slice().forEach(c=>{guides.remove(c);if(c.geometry!==ARROW)c.geometry?.dispose();c.material?.dispose?.();});};

  /* ── Zustand ── */
  let P=clonePlay(play||PLAYS[0]);
  let t=0, tTarget=0, speed=0, playing=false, editable=true;
  let wx={...WX[weather]}, wxT=WX[weather], wxId=weather;
  const col={};COLKEYS.forEach(k=>col[k]=new THREE.Color(wx[k]));

  const state=()=>onState&&onState({step:Math.round(t),t,playing,count:P.steps.length,label:P.steps[Math.round(clamp(t,0,P.steps.length-1))]?.label});
  function rebuildGuides(){
    clearGuides();const i=Math.round(t);if(playing||Math.abs(t-i)>.001||i>=P.steps.length-1)return;
    const A=P.steps[i],B=P.steps[i+1];
    A.p.forEach((p,k)=>ribbon(p,B.p[k],k<2?ORANGE:BLUE));
    arc(A.b,B.b,B.h);
  }
  function poseAt(tt){
    const n=P.steps.length,i=clamp(Math.floor(tt),0,n-1),j=Math.min(n-1,i+1),u=clamp(tt-i,0,1),e=easeIO(u);
    const A=P.steps[i],B=P.steps[j];
    players.forEach((pl,k)=>{const x=A.p[k][0]+(B.p[k][0]-A.p[k][0])*e,z=A.p[k][1]+(B.p[k][1]-A.p[k][1])*e;pl.g.position.set(x,0,z);});
    const bx=A.b[0]+(B.b[0]-A.b[0])*u,bz=A.b[2]+(B.b[2]-A.b[2])*u,by=A.b[1]+(B.b[1]-A.b[1])*u+(j>i?4*B.h*u*(1-u):0);
    ball.position.set(bx,by,bz);ballPick.position.copy(ball.position);
    ballShadow.position.set(bx,.04,bz);ballShadow.material.opacity=.35*Math.max(.25,1-by/5);
    // Blick: Team A schaut zum Netz (-z), Team B (+z); dreht sich zum Ball
    players.forEach(pl=>{const dx=bx-pl.g.position.x,dz=bz-pl.g.position.z;pl.g.rotation.y=Math.atan2(dx,dz);});
  }
  function setPlay(p){P=clonePlay(p);t=tTarget=0;playing=false;poseAt(0);rebuildGuides();state();}
  function seek(i){playing=false;tTarget=clamp(i,0,P.steps.length-1);speed=3.2;state();}
  function play_(){if(t>=P.steps.length-1-1e-3){t=0;}playing=true;tTarget=P.steps.length-1;speed=1/1.7;clearGuides();state();}
  function pause(){playing=false;tTarget=Math.round(t);speed=3;state();}

  /* ── Kamera ── */
  const cs={az:.62,el:.55,dist:66,tx:0,ty:-2,tz:1};
  const cur={pos:new THREE.Vector3(60,40,60),look:new THREE.Vector3()};
  let camMode='orbit';
  const PRESETS={orbit:{az:.62,el:.55,dist:66},top:{az:0,el:1.45,dist:62},low:{az:-.35,el:.16,dist:30}};
  function camGoal(){
    if(camMode==='player'){const p=players[1].g.position;return{pos:new THREE.Vector3(p.x*.6+1.4,4.4,p.z+8.5),look:new THREE.Vector3(p.x*.2,.6,-5)};}
    const c=Math.cos(cs.el);return{pos:new THREE.Vector3(cs.tx+Math.sin(cs.az)*c*cs.dist,cs.ty+Math.sin(cs.el)*cs.dist,cs.tz+Math.cos(cs.az)*c*cs.dist),look:new THREE.Vector3(cs.tx,cs.ty,cs.tz)};
  }
  function setCamera(m){camMode=m;if(PRESETS[m])Object.assign(cs,PRESETS[m]);}

  /* ── Wetter ── */
  function setWeather(id){wxId=id;wxT=WX[id];}
  const lerpWx=(k)=>{
    COLKEYS.forEach(c=>col[c].lerp(new THREE.Color(wxT[c]),k));
    ['fN','fF','sunI','hI','exp','night','rain','snow'].forEach(n=>wx[n]+=(wxT[n]-wx[n])*k);
  };
  function applyWx(){
    skyU.a.value.copy(col.skyT);skyU.b.value.copy(col.skyB);
    S.fog.color.copy(col.fog);S.fog.near=wx.fN;S.fog.far=wx.fF;
    sun.color.copy(col.sun);sun.intensity=wx.sunI;hemi.color.copy(col.hS);hemi.groundColor.copy(col.hG);hemi.intensity=wx.hI;
    R.toneMappingExposure=wx.exp;grassM.color.copy(col.grass);leafMs.forEach((m,i)=>m.color.copy(col.leaf).offsetHSL(0,0,i*.04-.03));
    cloudM.color.copy(col.cloud);
    const n=wx.night;stars.material.opacity=n;moonDisc.material.opacity=n;sunDisc.material.opacity=Math.max(0,1-n-wx.rain-wx.snow*.3-(wxId==='fog'?1:0));
    spots.forEach(s=>s.intensity=60*n);lampLens.forEach(l=>l.material.color.setRGB(.33+.67*n,.33+.62*n,.33+.5*n));
    houseWin.forEach(m=>m.color.setRGB(.49+.51*n,.66+.25*n,.79-.3*n));
    rain.material.opacity=.5*wx.rain;rain.visible=wx.rain>.02;snow.material.opacity=.95*wx.snow;snow.visible=wx.snow>.02;
  }
  COLKEYS.forEach(c=>col[c].set(wx[c]));applyWx();

  /* ── Gesten ── */
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
  const ptrs=new Map();let drag=null,pinch0=0,dist0=0,moved=false;
  const toNdc=e=>{const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);};
  const onDown=e=>{
    canvas.setPointerCapture?.(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;
    if(ptrs.size===2){drag=null;const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);dist0=cs.dist;return;}
    toNdc(e);ray.setFromCamera(ndc,cam);
    const hits=ray.intersectObjects([ballPick,...players.map(p=>p.pick)],false);
    if(hits.length&&editable){const o=hits[0].object;drag=o.userData.ball?{ball:true}:{pi:o.userData.pi};if(playing)pause();t=tTarget=Math.round(t);}
    else drag={orbit:true,x:e.clientX,y:e.clientY};
  };
  const onMove=e=>{
    if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptrs.size===2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0)cs.dist=clamp(dist0*pinch0/d,14,150);if(camMode!=='orbit'&&camMode!=='top'&&camMode!=='low')camMode='orbit';return;}
    if(!drag)return;
    if(drag.orbit){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
      if(Math.abs(dx)+Math.abs(dy)>1)moved=true;
      if(camMode==='player'){Object.assign(cs,PRESETS.orbit);}
      camMode='orbit';cs.az-=dx*.0075;cs.el=clamp(cs.el+dy*.005,.06,1.5);return;}
    toNdc(e);ray.setFromCamera(ndc,cam);
    if(!ray.ray.intersectPlane(plane,hit))return;
    const st=P.steps[Math.round(t)];moved=true;
    if(drag.ball){st.b=[clamp(hit.x,-6,6),st.b[1],clamp(hit.z,-10.5,10.5)];}
    else{const k=drag.pi,a=k<2;st.p[k]=[clamp(hit.x,-5.4,5.4),a?clamp(hit.z,.6,11.5):clamp(hit.z,-11.5,-.6)];}
    poseAt(t);rebuildGuides();
  };
  const onUp=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch0=0;
    if(drag&&!drag.orbit&&moved)onEdit&&onEdit(clonePlay(P));drag=null;};
  const onWheel=e=>{e.preventDefault();cs.dist=clamp(cs.dist*(1+e.deltaY*.001),14,150);};
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);
  canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);
  canvas.addEventListener('wheel',onWheel,{passive:false});
  canvas.style.touchAction='none';

  /* ── Groesse ── */
  const resize=()=>{const w=canvas.clientWidth||1,h=canvas.clientHeight||1;R.setSize(w,h,false);cam.aspect=w/h;
    cam.fov=w/h<.7?58:44;cam.updateProjectionMatrix();};
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();

  /* ── Schleife ── */
  let raf=0,last=performance.now(),clock=0,alive=true;
  const fb=flag.f.geometry.attributes.position;
  function frame(now){
    if(!alive)return;raf=requestAnimationFrame(frame);
    if(document.hidden)return;
    const dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;
    // Zeitleiste
    if(t!==tTarget){const d=tTarget-t,s=speed*dt;t=Math.abs(d)<=s?tTarget:t+Math.sign(d)*s;poseAt(t);
      if(t===tTarget){if(playing){playing=false;}rebuildGuides();state();}
      else if(Math.floor(t)!==Math.floor(t-Math.sign(d)*s))state();}
    // Wetter
    lerpWx(1-Math.pow(.02,dt));applyWx();
    if(!reduced){
      clouds.rotation.y+=dt*.006;
      mill.userData.hub.rotation.z-=dt*.8;
      {const a=clock*.03;balloon.position.set(Math.cos(a)*58,18+Math.sin(clock*.4)*1.5,Math.sin(a)*58-10);balloon.rotation.y=clock*.1;}
      birds.forEach(b=>{const a=clock*b.sp+b.ph;b.g.position.set(Math.cos(a)*b.rad,b.h+Math.sin(a*2)*1.2,Math.sin(a)*b.rad);b.g.rotation.y=-a;
        const f=Math.sin(clock*9+b.ph)*.6;b.l.rotation.x=f;b.r.rotation.x=-f;});
      for(let i=0;i<fb.count;i++){const x=flag.base[i*3];fb.setZ(i,Math.sin(clock*4+x*2.2)*.18*x/2.2);}fb.needsUpdate=true;
      waterTex.offset.y=(clock*.25)%1;
      if(wx.rain>.02){for(let i=0;i<RN;i++){let y=rainPos[i*6+1]-dt*26;if(y<-2)y+=40;rainPos[i*6+1]=y;rainPos[i*6+4]=y-.7;}rainG.attributes.position.needsUpdate=true;}
      if(wx.snow>.02){for(let i=0;i<SN;i++){let y=snowPos[i*3+1]-dt*1.6;if(y<-1)y+=40;snowPos[i*3+1]=y;snowPos[i*3]+=Math.sin(clock+i)*dt*.3;}snowG.attributes.position.needsUpdate=true;}
      players.forEach((pl,k)=>{pl.ring.material.opacity=.65+.3*Math.sin(clock*3+k);});
    }
    // Masten zwischen Kamera und Platz ausblenden
    masts.forEach(m=>{const vx=m.x-cam.position.x,vz=m.z-cam.position.z,cx=-cam.position.x,cz=-cam.position.z;
      const lm=Math.hypot(vx,vz),lc=Math.hypot(cx,cz),cos=(vx*cx+vz*cz)/(lm*lc||1);
      const o=lm<lc&&cos>.9?.12:1;m.ms.forEach(x=>{x.opacity+=(o-x.opacity)*.2;x.depthWrite=x.opacity>.9;});});
    // Kamera
    const g=camGoal(),k=1-Math.pow(.004,dt);cur.pos.lerp(g.pos,k);cur.look.lerp(g.look,k);
    cam.position.copy(cur.pos);cam.lookAt(cur.look);
    R.render(S,cam);
  }
  poseAt(0);rebuildGuides();state();raf=requestAnimationFrame(frame);

  return{
    setPlay,seek,play:play_,pause,setWeather,setCamera,
    getPlay:()=>clonePlay(P),
    setEditable:v=>{editable=v;},
    addStep(){playing=false;const i=Math.round(t),c=JSON.parse(JSON.stringify(P.steps[i]));c.label=`Schritt ${P.steps.length+1}`;c.h=1.5;
      P.steps.splice(i+1,0,c);t=tTarget=i+1;poseAt(t);rebuildGuides();state();onEdit&&onEdit(clonePlay(P));},
    removeStep(){if(P.steps.length<3)return;const i=Math.round(t);P.steps.splice(i,1);t=tTarget=Math.max(0,i-1);poseAt(t);rebuildGuides();state();onEdit&&onEdit(clonePlay(P));},
    dispose(){alive=false;cancelAnimationFrame(raf);ro.disconnect();
      canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);
      canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);canvas.removeEventListener('wheel',onWheel);
      S.traverse(o=>{o.geometry?.dispose?.();const m=o.material;(Array.isArray(m)?m:[m]).forEach(x=>{x?.map?.dispose?.();x?.dispose?.();});});
      R.dispose();R.forceContextLoss?.();},
  };
}
