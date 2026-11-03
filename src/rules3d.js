/* ═══════════════════════════════════════════════════════════════
   REGELWERK 3D — die Szenen des Regelwerks als echte 3D-Animation.

   Gegenstueck zu scenes.jsx (2D-SVG). Welche Darstellung laeuft,
   entscheidet der Schalter in Einstellungen → Anpassung
   (`ritmo_rules3d`); ohne WebGL faellt die Bibel still auf 2D zurueck.

   Wird per import() erst beim Oeffnen eines Kapitels geladen (three.js
   teilt sich den Chunk mit dem Taktik-Board). Kein React hier: die
   Engine bekommt ein <canvas> und eine Szenen-id, zeichnet und meldet
   Beschriftungen per Callback (`onCap`) — die setzt der Wrapper in
   App.jsx in den Hausschriften darueber, statt Text in WebGL zu malen.

   Wie in scenes.jsx ist jede Szene eine reine Funktion der Zeit t:
   update(t) setzt Spieler, Ball, Aufpraller, Glas-Blitze und Kamera.
   Dadurch laufen Schleifen nahtlos, und ein Standbild (reduzierte
   Bewegung) ist einfach update(still).

   Einheiten: Meter. Ein Court ist 10 x 20, Mitte im Ursprung, Netz
   entlang der x-Achse. Team A (orange) steht bei z > 0 — zur Kamera
   hin —, Team B (hell) bei z < 0. Die 2D-Koordinaten der alten Szenen
   (x 0..10, y 0..20, y=0 ferne Wand) gehen 1:1 ueber: x-5, y-10.
═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* ── Zeit ─────────────────────────────────────────────────────── */
const ez={lin:u=>u,io:u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2,out:u=>1-Math.pow(1-u,4),in:u=>u*u*u};
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const seg=(t,a,b,e=ez.io)=>e(cl((t-a)/(b-a)));
const lerp=(a,b,u)=>a+(b-a)*u;
const win=(t,a,b,f=.3)=>Math.min(seg(t,a,a+f,ez.out),1-seg(t,b-f,b,ez.in));
/* Flug zwischen zwei Bodenpunkten (2D-Koordinaten), Hoehe z */
const fly=(a,b,u,h,z0=0,z1=0)=>({x:lerp(a[0],b[0],u),y:lerp(a[1],b[1],u),z:lerp(z0,z1,u)+4*h*u*(1-u)});
/* weiche Bewegung auf einem Bogen */
const glide=(a,b,u,bend=1.2)=>{
  const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;
  const cx=mx-dy/L*bend,cy=my+dx/L*bend,v=1-u;
  return[v*v*a[0]+2*v*u*cx+u*u*b[0],v*v*a[1]+2*v*u*cy+u*u*b[1]];
};

/* ── Farben ───────────────────────────────────────────────────── */
const C={
  turf:0x2b62b0, turfOut:0x1d3f78, line:0xf4f6f8, ground:0x0c0e13, frame:0x15171c,
  orange:0xff7a1a, light:0xe9ecf1, blue:0x2e7bff, ball:0xd9f23a, green:0x34d27a, red:0xff4d4d,
  ink:0x101216, skin:0xc9ccd2,
};
const SL=6.95;                     // Aufschlaglinie, vom Netz gemessen

export function webglOk(){
  try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}
  catch{return false;}
}

/* ── Texturen ─────────────────────────────────────────────────── */
function canvasTex(w,h,draw,{repeat=null,srgb=true}={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);
  if(srgb) t.colorSpace=THREE.SRGBColorSpace;
  if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);}
  t.anisotropy=4;
  return t;
}
const rnd=(s=7)=>()=>(s=(s*16807)%2147483647)/2147483647;
function turfTex(){
  return canvasTex(256,256,(g,w,h)=>{
    g.fillStyle='#2b62b0';g.fillRect(0,0,w,h);
    const r=rnd(3);
    for(let i=0;i<9000;i++){const v=r();g.fillStyle=v<.5?'rgba(255,255,255,.05)':'rgba(0,0,30,.09)';
      g.fillRect(r()*w,r()*h,1,1+r()*2);}
  },{repeat:[6,12]});
}
function meshTex(){
  return canvasTex(64,64,(g,w,h)=>{
    g.clearRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,1)';g.lineWidth=3;
    g.beginPath();g.moveTo(0,0);g.lineTo(w,h);g.moveTo(w,0);g.lineTo(0,h);g.stroke();
  },{repeat:[1,1],srgb:false});
}
function netTex(){
  return canvasTex(64,64,(g,w,h)=>{
    g.clearRect(0,0,w,h);g.strokeStyle='#fff';g.lineWidth=4;g.strokeRect(0,0,w,h);
  },{repeat:[1,1],srgb:false});
}
function glowTex(){
  return canvasTex(128,128,(g,w,h)=>{
    const gr=g.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,240,210,.55)');gr.addColorStop(1,'rgba(255,240,210,0)');
    g.fillStyle=gr;g.fillRect(0,0,w,h);
  });
}
/* Kugel mit Nummer ueber dem Kopf — Space Grotesk, wie in der App */
function labelTex(txt,fill,ink){
  return canvasTex(128,128,(g)=>{
    g.beginPath();g.arc(64,64,54,0,Math.PI*2);g.fillStyle=fill;g.fill();
    g.lineWidth=5;g.strokeStyle='rgba(255,255,255,.75)';g.stroke();
    g.fillStyle=ink;g.font='700 58px "Space Grotesk", system-ui, sans-serif';
    g.textAlign='center';g.textBaseline='middle';g.fillText(String(txt),64,68);
  });
}

/* ═══════════════════════════════════════════════════════════════ */
export function createRuleScene(canvas,id,{onCap,reduced=false,still=null}={}){
  const R=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
  R.outputColorSpace=THREE.SRGBColorSpace;
  R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;

  const S=new THREE.Scene();
  S.background=new THREE.Color(0x07080b);
  S.fog=new THREE.Fog(0x07080b,38,95);
  const pmrem=new THREE.PMREMGenerator(R);
  const envRT=pmrem.fromScene(new RoomEnvironment(),.04);
  S.environment=envRT.texture;

  const cam=new THREE.PerspectiveCamera(38,1,.1,300);
  const disposables=[envRT,pmrem];
  const own=o=>{disposables.push(o);return o;};

  /* ── Licht: Flutlicht-Abend ── */
  S.add(new THREE.HemisphereLight(0xcfd8ff,0x1a1c22,.55));
  const key=new THREE.DirectionalLight(0xfff4e6,2.4);
  key.position.set(-12,26,14);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:80});
  key.shadow.bias=-.0004;key.shadow.normalBias=.03;key.shadow.radius=4;
  S.add(key);
  const fill=new THREE.DirectionalLight(0x9fb6ff,.55);fill.position.set(14,10,-16);S.add(fill);

  /* ── Materialien ── */
  const tTurf=own(turfTex()), tMesh=own(meshTex()), tNet=own(netTex()), tGlow=own(glowTex());
  const M={
    turf:own(new THREE.MeshStandardMaterial({map:tTurf,roughness:.92,metalness:0})),
    turfOut:own(new THREE.MeshStandardMaterial({color:C.turfOut,roughness:.95})),
    line:own(new THREE.MeshStandardMaterial({color:C.line,roughness:.6,emissive:0x222222})),
    ground:own(new THREE.MeshStandardMaterial({color:C.ground,roughness:1})),
    frame:own(new THREE.MeshStandardMaterial({color:C.frame,roughness:.45,metalness:.7})),
    glass:own(new THREE.MeshPhysicalMaterial({color:0xd6ecff,transparent:true,opacity:.13,roughness:.04,
      metalness:0,envMapIntensity:1.4,side:THREE.DoubleSide,depthWrite:false,clearcoat:1})),
    fence:own(new THREE.MeshStandardMaterial({color:0x2a2d33,alphaMap:tMesh,transparent:true,
      alphaTest:.3,side:THREE.DoubleSide,metalness:.6,roughness:.5})),
    net:own(new THREE.MeshStandardMaterial({color:0x111318,alphaMap:tNet,transparent:true,alphaTest:.35,
      side:THREE.DoubleSide,roughness:.8})),
    band:own(new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.7})),
    ball:own(new THREE.MeshStandardMaterial({color:C.ball,roughness:.55,emissive:0x5a6b10,emissiveIntensity:.5})),
    skin:own(new THREE.MeshStandardMaterial({color:C.skin,roughness:.6})),
    dark:own(new THREE.MeshStandardMaterial({color:0x1c1f26,roughness:.7})),
    racket:own(new THREE.MeshStandardMaterial({color:0x22252c,roughness:.35,metalness:.3})),
  };
  const teamMat={
    a:own(new THREE.MeshStandardMaterial({color:C.orange,roughness:.55,emissive:C.orange,emissiveIntensity:.08})),
    b:own(new THREE.MeshStandardMaterial({color:C.light,roughness:.55})),
    x:own(new THREE.MeshStandardMaterial({color:0x6c7280,roughness:.6})),
  };
  const G=(geo)=>own(geo);
  const box=(w,h,d,m)=>{const o=new THREE.Mesh(G(new THREE.BoxGeometry(w,h,d)),m);o.castShadow=o.receiveShadow=true;return o;};

  /* Boden rundum, mit weichem Lichtfleck */
  const ground=new THREE.Mesh(G(new THREE.PlaneGeometry(260,260)),M.ground);
  ground.rotation.x=-Math.PI/2;ground.position.y=-.02;ground.receiveShadow=true;S.add(ground);

  /* ── Court ────────────────────────────────────────────────────
     full: Waende aus Glas + Gitter und Netz in voller Ausfuehrung.
     Fuer mehrere Courts nebeneinander reicht dieselbe Bauweise —
     drei Courts sind ~200 Meshes, das schafft jedes Telefon. */
  const courts=[];
  function court(ox=0,oz=0,{walls:withWalls=true}={}){
    const g=new THREE.Group();g.position.set(ox,0,oz);S.add(g);
    const surround=new THREE.Mesh(G(new THREE.PlaneGeometry(11.2,21.2)),M.turfOut);
    surround.rotation.x=-Math.PI/2;surround.position.y=-.005;surround.receiveShadow=true;g.add(surround);
    const floor=new THREE.Mesh(G(new THREE.PlaneGeometry(10,20)),M.turf);
    floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;g.add(floor);
    /* Linien: Mittellinie zwischen den Aufschlaglinien, Aufschlaglinien,
       Grundlinien liegen an der Wand (Glas). Breite 5 cm. */
    const lines=new THREE.Group();g.add(lines);
    const ln=(w,d,x,z)=>{const m=new THREE.Mesh(G(new THREE.BoxGeometry(w,.012,d)),M.line);m.position.set(x,.006,z);m.receiveShadow=true;lines.add(m);return m;};
    const svc=[ln(10,.05,0,SL),ln(10,.05,0,-SL)];
    const mid=ln(.05,SL*2,0,0);
    const side=[ln(.05,20,-4.975,0),ln(.05,20,4.975,0),ln(10,.05,0,9.975),ln(10,.05,0,-9.975)];
    /* Waende */
    const walls=new THREE.Group();g.add(walls);walls.visible=withWalls;
    const glassPane=(w,h,x,y,z,ry=0)=>{
      const p=new THREE.Mesh(G(new THREE.PlaneGeometry(w,h)),M.glass);p.position.set(x,y,z);p.rotation.y=ry;p.renderOrder=2;walls.add(p);
      const fr=box(ry?.04:w,.04,ry?w:.04,M.frame);fr.position.set(x,y+h/2,z);walls.add(fr);
      return p;
    };
    const fencePane=(w,h,x,y,z,ry=0)=>{
      const m=M.fence.clone();own(m);m.alphaMap=tMesh.clone();own(m.alphaMap);
      m.alphaMap.wrapS=m.alphaMap.wrapT=THREE.RepeatWrapping;m.alphaMap.repeat.set(w/.05/4,h/.05/4);
      const p=new THREE.Mesh(G(new THREE.PlaneGeometry(w,h)),m);p.position.set(x,y,z);p.rotation.y=ry;walls.add(p);return p;
    };
    const post=(x,z,h)=>{const p=box(.07,h,.07,M.frame);p.position.set(x,h/2,z);walls.add(p);};
    const backGlass=[];
    for(const s of [-1,1]){
      const z=s*10;
      // Rueckwand: 3 m Glas in Feldern, 1 m Gitter darueber
      for(let i=0;i<5;i++){const x=-4+i*2;backGlass.push(glassPane(2,3,x,1.5,z));post(x-1,z,4);}
      post(5,z,4);fencePane(10,1,0,3.5,z);
      // Seiten: 2 m Glas 3 m hoch, dann 2 m Glas 2 m hoch (Stufe), Gitter bis 4 bzw. 3 m
      for(const sx of [-5,5]){
        glassPane(2,3,sx,1.5,z-s*1,Math.PI/2);fencePane(2,1,sx,3.5,z-s*1,Math.PI/2);
        glassPane(2,2,sx,1,z-s*3,Math.PI/2);fencePane(2,1,sx,2.5,z-s*3,Math.PI/2);
        post(sx,z-s*2,4);post(sx,z-s*4,3);
      }
    }
    for(const sx of [-5,5]){fencePane(12,3,sx,1.5,0,Math.PI/2);post(sx,-2,3);post(sx,2,3);post(sx,0,3);}
    /* Netz: 88 cm Mitte, 92 cm an den Pfosten — als Ebene mit Maschen */
    const netG=new THREE.Group();g.add(netG);
    const nm=M.net.clone();own(nm);nm.alphaMap=tNet.clone();own(nm.alphaMap);
    nm.alphaMap.wrapS=nm.alphaMap.wrapT=THREE.RepeatWrapping;nm.alphaMap.repeat.set(10/.045,.88/.045);
    const netM=new THREE.Mesh(G(new THREE.PlaneGeometry(10,.84)),nm);netM.position.set(0,.46,0);netG.add(netM);
    const band=box(10,.05,.03,M.band);band.position.set(0,.895,0);netG.add(band);
    for(const sx of [-5.06,5.06]){const p=box(.08,.95,.08,M.frame);p.position.set(sx,.475,0);netG.add(p);}
    /* Hervorhebungen: Aufschlagfelder, Glasblitze, Netzglanz */
    const hi=(w,d,x,z,col)=>{const m=new THREE.Mesh(G(new THREE.PlaneGeometry(w,d)),own(new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,depthWrite:false})));
      m.rotation.x=-Math.PI/2;m.position.set(x,.015,z);g.add(m);return m;};
    const flash=(z,col)=>{const m=new THREE.Mesh(G(new THREE.PlaneGeometry(10,3)),own(new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})));
      m.position.set(0,1.5,z-Math.sign(z)*.02);g.add(m);return m;};
    const c={g,lines:{svc,mid,side,all:lines},walls,netG,band,
      box:hi(5,SL,-2.5,-SL/2,C.orange),
      hi,flash,
      flashFar:flash(-10,C.green),flashNear:flash(10,C.green),
      glow:hi(10.6,20.6,0,0,C.orange)};
    c.glow.position.y=-.002;
    courts.push(c);return c;
  }

  /* Flutlichtmasten an den Ecken: nur Bild, kein Licht pro Mast */
  /* Masten auf der Kameraseite blenden aus (setCam) — sonst steht
     einer mitten im Bild vor dem Court, wie beim Taktik-Board. */
  const masts=[];
  function floodlights(xs,zs){
    for(const x of xs) for(const z of zs){
      const m=new THREE.Group();m.position.set(x,0,z);S.add(m);masts.push(m);
      const p=box(.12,7.4,.12,M.frame);p.position.set(0,3.7,0);m.add(p);
      const h=box(.9,.2,.4,M.frame);h.position.set(0,7.4,0);m.add(h);
      const s=new THREE.Sprite(own(new THREE.SpriteMaterial({map:tGlow,color:0xfff2dc,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})));
      s.scale.set(4,4,1);s.position.set(0,7.35,0);m.add(s);
    }
  }

  /* ── Spieler ──────────────────────────────────────────────────
     Koerper, Kopf, Beine, Schlaeger; die Nummer schwebt darueber.
     Bewegung: aus der Differenz zur letzten Lage — Schritt-Wippen
     und Blickrichtung ergeben sich daraus von selbst. */
  const capG=G(new THREE.CapsuleGeometry(.22,.62,6,14)), headG=G(new THREE.SphereGeometry(.15,20,16));
  const legG=G(new THREE.CapsuleGeometry(.075,.5,4,8)), padG=G(new THREE.CylinderGeometry(.2,.2,.035,24));
  const handleG=G(new THREE.CylinderGeometry(.02,.02,.22,8));
  const players=[];
  function player(team='a',num=null){
    const g=new THREE.Group();S.add(g);
    const body=new THREE.Mesh(capG,teamMat[team]);body.position.y=1.0;body.castShadow=true;g.add(body);
    const head=new THREE.Mesh(headG,M.skin);head.position.y=1.58;head.castShadow=true;g.add(head);
    const legs=[-.1,.1].map(x=>{const l=new THREE.Mesh(legG,M.dark);l.position.set(x,.36,0);l.castShadow=true;g.add(l);return l;});
    const arm=new THREE.Group();arm.position.set(.26,1.12,0);g.add(arm);
    const pad=new THREE.Mesh(padG,M.racket);pad.rotation.x=Math.PI/2;pad.position.set(.05,-.18,.32);pad.castShadow=true;arm.add(pad);
    const hd=new THREE.Mesh(handleG,M.racket);hd.rotation.x=Math.PI/2;hd.position.set(.05,-.18,.1);arm.add(hd);
    let sprite=null;
    if(num!=null){
      const fillC=team==='a'?'#ff7a1a':team==='b'?'#eef1f5':'#6c7280', inkC=team==='b'?'#111':'#000';
      const tx=own(labelTex(num,fillC,inkC));
      sprite=new THREE.Sprite(own(new THREE.SpriteMaterial({map:tx,transparent:true,depthWrite:false,depthTest:false})));
      sprite.scale.set(.5,.5,1);sprite.position.y=2.1;sprite.renderOrder=10;g.add(sprite);
    }
    const p={g,body,legs,arm,team,sprite,last:null,phase:0,face:0,
      set(x,z,{look=null,swing=0,op=1}={}){
        const dx=this.last?x-this.last[0]:0,dz=this.last?z-this.last[1]:0,sp=Math.hypot(dx,dz);
        this.phase+=sp*7;this.last=[x,z];
        g.position.set(x,Math.abs(Math.sin(this.phase))*Math.min(.08,sp*2),z);
        let want=look!=null?look:(sp>.004?Math.atan2(dx,dz):this.face);
        let d=want-this.face;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
        this.face+=d*.18;g.rotation.y=this.face;
        legs[0].rotation.x=Math.sin(this.phase)*Math.min(.6,sp*14);legs[1].rotation.x=-legs[0].rotation.x;
        arm.rotation.x=-swing*1.6;arm.rotation.z=swing*.4;
        g.visible=op>.02;
      }};
    players.push(p);return p;
  }
  /* Team A schaut zur fernen Wand (−z), Team B zur Kamera (+z) */
  const LOOK={a:Math.PI,b:0,x:-Math.PI/2};

  /* ── Ball samt Schatten und Schweif ── */
  const ball=new THREE.Mesh(G(new THREE.SphereGeometry(.15,24,18)),M.ball);ball.castShadow=true;S.add(ball);
  const trailM=own(new THREE.MeshBasicMaterial({color:C.ball,transparent:true,depthWrite:false}));
  const trail=Array.from({length:7},(_,i)=>{const m=new THREE.Mesh(G(new THREE.SphereGeometry(.12-i*.012,12,10)),trailM.clone());own(m.material);S.add(m);return m;});
  const ballShadow=new THREE.Mesh(G(new THREE.CircleGeometry(.14,20)),own(new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,depthWrite:false})));
  ballShadow.rotation.x=-Math.PI/2;S.add(ballShadow);
  /* bp: Bahn als Funktion der Zeit → {x,y,z} in 2D-Koordinaten (y=Laenge, z=Hoehe) eines Courts */
  function setBall(path,t,op=1,ox=0,oz=0){
    const q=path(t);
    ball.visible=!!q&&op>.02;ballShadow.visible=ball.visible;
    if(q){ball.position.set(ox+q.x-5,.11+q.z,oz+q.y-10);ballShadow.position.set(ox+q.x-5,.012,oz+q.y-10);
      ballShadow.material.opacity=.35*op/(1+q.z*.6);}
    trail.forEach((m,i)=>{const p=path(t-(i+1)*.028);m.visible=ball.visible&&!!p;
      if(p){m.position.set(ox+p.x-5,.11+p.z,oz+p.y-10);m.material.opacity=op*.45*(1-i/trail.length);}});
  }
  const hideBall=()=>{ball.visible=ballShadow.visible=false;trail.forEach(m=>m.visible=false);};

  /* Aufpraller: Ring auf dem Boden, waechst und verblasst */
  const ringG=G(new THREE.RingGeometry(.16,.22,40));
  const rings=Array.from({length:3},()=>{const m=new THREE.Mesh(ringG,own(new THREE.MeshBasicMaterial({color:C.ball,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide})));
    m.rotation.x=-Math.PI/2;m.position.y=.02;S.add(m);return m;});
  function setRings(list,t,ox=0,oz=0){
    rings.forEach((m,i)=>{const r=list[i];if(!r){m.visible=false;return;}
      const u=(t-r[0])/.7;m.visible=u>=0&&u<=1;if(!m.visible)return;
      m.position.set(ox+r[1]-5,.02,oz+r[2]-10);m.scale.setScalar(1+u*4.5);m.material.opacity=(1-u)*.9;
      m.material.color.setHex(r[3]||C.ball);});
  }

  /* Boden-Baender zwischen Partnern (Americano & Co.) */
  const bandG=G(new THREE.PlaneGeometry(1,.16));
  function floorBand(col){const m=new THREE.Mesh(bandG,own(new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,depthWrite:false})));
    m.rotation.x=-Math.PI/2;m.position.y=.02;S.add(m);return m;}
  function setBand(m,a,b,op){
    const dx=b[0]-a[0],dz=b[1]-a[1];m.visible=op>.02;m.material.opacity=op;
    m.position.set((a[0]+b[0])/2,.02,(a[1]+b[1])/2);m.scale.x=Math.hypot(dx,dz);m.rotation.z=-Math.atan2(dz,dx);
  }
  /* Funke am Netz (Fair Play) und schwebende Plakette (Pause) */
  function spark(){const s=new THREE.Sprite(own(new THREE.SpriteMaterial({map:tGlow,color:C.orange,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));S.add(s);return s;}
  function chip(txt,bg){const tx=own(canvasTex(192,96,(g)=>{g.fillStyle=bg;g.beginPath();g.roundRect(4,4,184,88,44);g.fill();
      g.fillStyle='#fff';g.font='700 52px "Space Grotesk", system-ui, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,96,52);}));
    const s=new THREE.Sprite(own(new THREE.SpriteMaterial({map:tx,transparent:true,depthWrite:false,depthTest:false})));s.scale.set(1,.5,1);s.renderOrder=11;S.add(s);return s;}

  /* ── Kamera: Kugelkoordinaten um ein Ziel, sanftes Pendeln,
     waagerecht ziehbar ── */
  const camS={r:24,pol:.95,az:.35,tgt:new THREE.Vector3(),drag:0,sway:.18,swayT:16};
  const setCam=(time)=>{
    const az=camS.az+camS.drag+Math.sin(time/camS.swayT*Math.PI*2)*camS.sway;
    cam.position.set(camS.tgt.x+camS.r*Math.sin(camS.pol)*Math.sin(az),camS.tgt.y+camS.r*Math.cos(camS.pol),camS.tgt.z+camS.r*Math.sin(camS.pol)*Math.cos(az));
    cam.lookAt(camS.tgt);
    const cx=cam.position.x-camS.tgt.x,cz=cam.position.z-camS.tgt.z,cl0=Math.hypot(cx,cz)||1;
    for(const m of masts){const mx=m.position.x-camS.tgt.x,mz=m.position.z-camS.tgt.z;
      m.visible=(mx*cx+mz*cz)/(cl0*(Math.hypot(mx,mz)||1))<.35;}
  };

  /* Beschriftung nach aussen — nur melden, wenn sie sich aendert */
  let capKey='';
  const cap=(o)=>{const k=JSON.stringify(o);if(k!==capKey){capKey=k;onCap&&onCap(o);}};

  /* ═══ Szenen ══════════════════════════════════════════════════ */
  const scenes={
    /* 1 · Der Court — baut sich auf: Boden, Linien, Waende, Netz;
       dann je ein Mass im Licht. Laeuft einmal und bleibt stehen. */
    court:()=>{
      const c=court();floodlights([-7.5,7.5],[-12,12]);
      Object.assign(camS,{r:30,pol:.92,az:.62,sway:.3,swayT:20});camS.tgt.set(0,.6,0);
      return{dur:13,loop:false,still:12.5,update(t){
        const ln=seg(t,.3,2.2,ez.out);
        c.lines.all.children.forEach(m=>{const w=m.geometry.parameters.width>m.geometry.parameters.depth;m.scale[w?'x':'z']=Math.max(.001,ln);});
        const wl=seg(t,1.8,3.6,ez.out);c.walls.scale.y=Math.max(.001,wl);c.walls.visible=wl>0;
        const nt=seg(t,3.2,4,ez.out);c.netG.scale.y=Math.max(.001,nt);
        const sv=win(t,5.2,7.6,.4), ne=win(t,7.6,9.8,.4), gl=win(t,9.8,12.2,.4);
        c.lines.svc.forEach(m=>{m.material=sv>.05?svcHi:M.line;});svcHi.opacity=sv;
        c.band.material=ne>.05?bandHi:M.band;
        c.flashFar.material.color.setHex(C.orange);c.flashNear.material.color.setHex(C.orange);
        c.flashFar.material.opacity=gl*.22;c.flashNear.material.opacity=gl*.22;
        c.glow.material.opacity=win(t,3.6,5.2,.4)*.12;
        hideBall();
        cap(t<3.6?{kicker:'Der Court',text:'Ein Platz, ganz aus Glas und Gitter.'}
          :t<5.2?{kicker:'Masse',text:'20 × 10 Meter.'}
          :t<7.6?{kicker:'Aufschlaglinie',text:'6,95 m vom Netz.',tone:'o'}
          :t<9.8?{kicker:'Netz',text:'88 cm in der Mitte, 92 an den Pfosten.',tone:'o'}
          :{kicker:'Wände',text:'3 m Glas hinten, darüber Gitter.'});
      }};
    },

    /* 2 · Aufschlag — aufspringen lassen, unter Hüfthöhe, diagonal ins
       Feld, danach ans Glas. Jeder zweite Durchgang von links. */
    aufschlag:()=>{
      const c=court();floodlights([-7.5,7.5],[-12,12]);
      Object.assign(camS,{r:27,pol:.9,az:.42,sway:.2});camS.tgt.set(0,.5,0);
      const A1=player('a',1),A2=player('a',2),B1=player('b'),B2=player('b');
      const D=6.2;
      return{dur:D*2,still:1.6,update(tt){
        const n=Math.floor(tt/D),t=tt%D,side=n%2?-1:1,m=x=>side>0?x:10-x;
        const srv=[m(7.2),17.6],tg=[m(2.6),5.4],gp=[m(1.7),0];
        const path=tp=>{if(tp<0)return null;
          if(tp<.5)return{x:srv[0]+.15*side,y:srv[1]-.4,z:lerp(1,0,ez.in(tp/.5))};
          if(tp<.95)return{x:srv[0]+.15*side,y:srv[1]-.4,z:.7*Math.sin(Math.PI*(tp-.5)/.9)};
          if(tp<2.05)return fly([srv[0],srv[1]-.4],tg,(tp-.95)/1.1,1.35,.65,0);
          if(tp<2.85)return fly(tg,gp,(tp-2.05)/.8,.55,0,.9);
          if(tp<3.4)return fly(gp,[gp[0]+.4*side,1.3],(tp-2.85)/.55,.25,.9,0);return null;};
        setBall(path,t,1-seg(t,3.6,4.1));
        setRings([[2.05,tg[0],tg[1]],[.5,srv[0]+.15*side,srv[1]-.4]],t);
        A1.set(srv[0]-5,srv[1]-10+.3,{look:LOOK.a,swing:win(t,.75,1.15,.15)});
        A2.set(m(2.5)-5,12.6-10,{look:LOOK.a});
        B1.set(m(2.6)-5,1.6-10,{look:LOOK.b});B2.set(m(7.4)-5,6.9-10,{look:LOOK.b});
        const box=c.box;box.position.x=side>0?-2.5:2.5;
        box.material.opacity=win(t,.7,4.2,.4)*.5;
        c.flashFar.material.color.setHex(C.green);c.flashFar.material.opacity=win(t,2.8,3.6,.15)*.45;
        const step=t<.95?0:t<1.6?1:t<2.4?2:3;
        cap({kicker:side>0?'Punkt 1 · von rechts':'Punkt 2 · von links',
          steps:['aufspringen','unter Hüfte','diagonal','Glas ok'],active:step});
      }};
    },

    /* 3 · Wände — erst Boden, dann Glas (im Spiel); danach direkt
       ans Glas der Gegenseite (Punkt verloren). */
    waende:()=>{
      const c=court();floodlights([-7.5,7.5],[-12,12]);
      Object.assign(camS,{r:27,pol:.93,az:-.5,sway:.18});camS.tgt.set(0,.6,0);
      const A1=player('a',1),A2=player('a',2),B1=player('b'),B2=player('b');
      const path=tp=>{if(tp<0)return null;
        if(tp<1.3)return fly([6.6,2.6],[3.4,16.2],tp/1.3,1.9,.8,0);
        if(tp<1.8)return fly([3.4,16.2],[2.9,20],(tp-1.3)/.5,.55,0,1);
        if(tp<2.35)return fly([2.9,20],[3.0,18.6],(tp-1.8)/.55,.2,1,.7);
        if(tp<3.5)return fly([3.0,18.6],[6.4,4.6],(tp-2.35)/1.15,1.7,.7,0);
        if(tp<4.2)return fly([6.4,4.6],[6.6,2.8],(tp-3.5)/.7,.4,0,.6);
        if(tp<4.9)return null;
        if(tp<5.55)return fly([6.4,12.3],[4.6,0],(tp-4.9)/.65,.35,1.1,1.3);
        if(tp<6.3)return fly([4.6,0],[4.8,1.6],(tp-5.55)/.75,.4,1.3,0);return null;};
      return{dur:9,still:2,update(t){
        setBall(path,t);
        setRings([[1.3,3.4,16.2],[3.5,6.4,4.6],[6.3,4.8,1.6]],t);
        const a=seg(t,.5,1.9);
        A1.set(lerp(3.6,3.0,a)-5,lerp(16.6,18.6,a)-10+.4,{look:LOOK.a,swing:win(t,2.2,2.6,.12)});
        A2.set(lerp(6.8,6.4,seg(t,4.2,4.8))-5,lerp(13.6,12.6,seg(t,4.2,4.8))-10,{look:LOOK.a,swing:win(t,4.85,5.2,.12)});
        B1.set(6.6-5,2.6-10,{look:LOOK.b,swing:win(t,.0,.3,.1)});B2.set(3.4-5,7.4-10,{look:LOOK.b});
        c.flashNear.material.color.setHex(C.green);c.flashNear.material.opacity=win(t,1.75,2.6,.12)*.5;
        c.flashFar.material.color.setHex(C.red);c.flashFar.material.opacity=win(t,5.5,6.4,.12)*.55;
        const ok=win(t,1.8,4.3,.35),bad=win(t,5.6,8.6,.35);
        cap(bad>ok?{kicker:'Fehler',text:'Direkt ans Glas — Punkt weg.',tone:'r'}
          :ok>0?{kicker:'Im Spiel',text:'Boden, dann Glas — weiter.'}:{kicker:'Wände',text:'Wer zuerst den Boden trifft, darf ans Glas.'});
      }};
    },

    /* 4 · Zählweise — jeder Punkt ein kurzer Ballwechsel, die Tafel
       zaehlt mit: Einstand, Vorteil, Spiel; dann Golden Point. */
    zaehlung:()=>{
      court();floodlights([-7.5,7.5],[-12,12]);
      Object.assign(camS,{r:26,pol:.97,az:.3,sway:.15});camS.tgt.set(0,.7,0);
      const A1=player('a',1),A2=player('a',2),B1=player('b'),B2=player('b');
      const SEQ=[['0','0',''],['15','0',''],['15','15',''],['30','15',''],['30','30',''],['40','30',''],
        ['40','40','Einstand'],['AD','40','Vorteil'],['40','40','Einstand'],['AD','40','Vorteil'],['✓','','Spiel'],
        ['40','40','Golden Point'],['','✓','Spiel']];
      const st=1.5;
      return{dur:SEQ.length*st+1,still:6*st+.6,update(t){
        const i=Math.min(SEQ.length-1,Math.floor(t/st)),u=(t%st);
        const nxt=SEQ[Math.min(SEQ.length-1,i+1)],cur=SEQ[i];
        // Wer macht den naechsten Punkt? A, wenn sich A aendert.
        const V={'':-1,'0':0,'15':1,'30':2,'40':3,'AD':4,'✓':5};
        const aWins=V[nxt[0]]>V[cur[0]];
        const from=aWins?[3.2,17]:[6.8,3], to=aWins?[7.2,1.2]:[2.8,18.8];
        const path=tp=>tp<.2||tp>1.25||i>=SEQ.length-1?null:fly(from,to,(tp-.2)/1.05,1.5,1,0);
        setBall(path,u);
        setRings([[1.25,to[0],to[1]]],u);
        const sw=win(u,.12,.4,.1);
        A1.set(3.2-5,7.2,{look:LOOK.a,swing:aWins?sw:0});A2.set(7-5,3.4,{look:LOOK.a});
        B1.set(6.8-5,-7.2,{look:LOOK.b,swing:aWins?0:sw});B2.set(3-5,-3.4,{look:LOOK.b});
        cap({kicker:i>=11?'Mit Golden Point':'Mit Vorteil',board:{a:cur[0],b:cur[1]},text:cur[2]||'',tone:cur[2]==='Spiel'?'o':null});
      }};
    },

    /* 5 · Americano — acht Spieler, zwei Courts, drei Runden, nie
       zweimal derselbe Partner. */
    americano:()=>{
      const X=[-5.8,5.8];court(X[0],0,{walls:false});court(X[1],0,{walls:false});floodlights([-12,0,12],[-12,12]);
      Object.assign(camS,{r:34,pol:.78,az:.18,sway:.14});camS.tgt.set(0,0,1);
      const ROUNDS=[[[1,2,3,4],[5,6,7,8]],[[1,5,2,6],[3,7,4,8]],[[1,8,3,6],[2,7,4,5]]];
      const seat=(c,k)=>[X[c]+(k%2?2.5:-2.5),k<2?5:-5];
      const P=[1,2,3,4,5,6,7,8].map(i=>player(i<=4?'a':'b',i));
      const bands=[0,1,2,3].map(i=>floorBand(i%2?C.blue:C.orange));
      const where=(r,id)=>{for(let c=0;c<2;c++){const k=ROUNDS[r][c].indexOf(id);if(k>=0)return[seat(c,k),k];}return[[0,0],0];};
      const Rd=3.8;
      return{dur:Rd*3,still:.4,update(t){
        hideBall();
        const r=Math.floor(t/Rd),lt=t%Rd,nx=(r+1)%3;
        P.forEach((p,i)=>{const id=i+1,[a,k]=where(r,id),[b]=where(nx,id),u=seg(lt,Rd-1.3+id*.04,Rd-.15+id*.04);
          const q=glide(a,b,u,id%2?1.6:-1.6);p.set(q[0],q[1],{look:u>0&&u<1?null:(k<2?LOOK.a:LOOK.b)});});
        const op=(1-seg(lt,Rd-1.4,Rd-1.1))*seg(lt,.1,.5)*.7;
        for(let c=0;c<2;c++){setBand(bands[c*2],seat(c,0),seat(c,1),op);setBand(bands[c*2+1],seat(c,2),seat(c,3),op);}
        cap({kicker:'Americano · Runde '+(r+1),text:'Jede Runde neue Partner.'});
      }};
    },

    /* 6 · Mexicano — die Tabelle sortiert, je vier Nachbarn bilden
       einen Court: 1+4 gegen 2+3. */
    mexicano:()=>{
      const X=[-5.8,5.8];court(X[0],0,{walls:false});court(X[1],0,{walls:false});floodlights([-12,0,12],[-12,12]);
      Object.assign(camS,{r:40,pol:.8,az:.12,sway:.12});camS.tgt.set(0,0,6.5);
      const seat=(c,k)=>[X[c]+(k%2?2.5:-2.5),k<2?5:-5];
      const P=[1,2,3,4,5,6,7,8].map(i=>player('x',i));
      const row=i=>[-7+i*2,13.5];
      const plates=[0,1,2,3,4,5,6,7].map(i=>{const m=new THREE.Mesh(G(new THREE.CylinderGeometry(.55,.6,.12-i*.01+.1,28)),i<3?M.frame:M.dark);
        m.position.set(row(i)[0],.06,row(i)[1]);m.receiveShadow=true;m.castShadow=true;S.add(m);return m;});
      const bands=[0,1,2,3].map(i=>floorBand(i%2?C.blue:C.orange));
      const target=id=>{const c=id<=4?0:1,k=(id-1)%4,s=[0,2,3,1][k];return[seat(c,s),s];};
      return{dur:8,still:3.4,update(t){
        hideBall();
        P.forEach((p,i)=>{const id=i+1,go=seg(t,1+id*.08,2.3+id*.08)*(1-seg(t,6.3+id*.03,7.5+id*.03));
          const[tg,s]=target(id);const q=glide(row(i),tg,go,id%2?-2:2);
          p.set(q[0],q[1],{look:go>.98?(s<2?LOOK.a:LOOK.b):go<.02?LOOK.b:null});
          p.body.material=go>.5?(s<2?teamMat.a:teamMat.b):teamMat.x;});
        const op=win(t,2.8,6.2,.4)*.7;
        for(let c=0;c<2;c++){setBand(bands[c*2],seat(c,0),seat(c,1),op);setBand(bands[c*2+1],seat(c,2),seat(c,3),op);}
        cap(t<2.6?{kicker:'Mexicano',text:'Die Tabelle stellt die Paarungen.'}
          :{kicker:'Mexicano',text:'1 + 4 gegen 2 + 3 — und so weiter.',tone:'o'});
      }};
    },

    /* 7 · King of the Court — Sieger einen Court hoch, Verlierer runter.
       Court 1 (links) ist der Thron. */
    formate:()=>{
      const X=[-11.6,0,11.6];X.forEach(x=>court(x,0,{walls:false}));floodlights([-18,-6,6,18],[-12,12]);
      courts[0].glow.material.opacity=.18;
      Object.assign(camS,{r:58,pol:.72,az:0,sway:.1});camS.tgt.set(0,0,1);
      const P=Array.from({length:12},(_,i)=>player('b',i+1));
      const D=6;
      const slotPos=(si,which)=>{const c=Math.floor(si/2),near=si%2===0;return[X[c]+(which?2.3:-2.3),near?5:-5];};
      const dest=i=>{const c=Math.floor(i/2),w=i%2===0;if(w)return c===0?0:(c-1)*2+1;return c===2?5:(c+1)*2;};
      return{dur:D*2,still:1.6,update(t){
        hideBall();
        const lt=t%D,cyc=Math.floor(t/D),base=cyc%2?[0,2,1,4,3,5]:[0,1,2,3,4,5];
        const mv=seg(lt,2.4,3.8),fl=win(lt,.8,2.4,.25);
        for(let si=0;si<6;si++){const pid=base[si],won=si%2===0;
          for(const w of [0,1]){const p=P[pid*2+w],a=slotPos(si,w),b=slotPos(dest(si),w);
            const q=glide(a,b,mv,si%2?1.4:-1.4);p.set(q[0],q[1],{look:mv>0&&mv<1?null:(si%2?LOOK.b:LOOK.a),swing:won?fl*.6:0});
            p.body.material=won&&fl>.1?teamMat.a:teamMat.b;}}
        cap(lt<2.4?{kicker:'King of the Court',text:'Gewonnen.',tone:'o'}:{kicker:'King of the Court',text:'Sieger rücken einen Court hoch.'});
      }};
    },

    /* 8 · Pausen — fuenf Spieler, ein Court: reihum pausiert, wer am
       seltensten draussen war; der Ausgleich fliegt zur Bank. */
    rotation:()=>{
      court(0,0,{walls:false});floodlights([-7.5,7.5],[-12,12]);
      Object.assign(camS,{r:28,pol:.88,az:.75,sway:.15});camS.tgt.set(1.6,0,0);
      const bench=box(2.4,.45,.6,M.frame);bench.position.set(7.4,.225,0);S.add(bench);
      const seatP=k=>[k%2?2.5:-2.5,k<2?5:-5],BEN=[7.4,0];
      const P=[1,2,3,4,5].map(i=>player('b',i));
      const plus=chip('+Ø','#2e7bff');
      const order=r=>{const ids=[1,2,3,4,5],out=ids[(4+r)%5];return{out,play:ids.filter(i=>i!==out)};};
      const pos=(r,id)=>{const o=order(r);return o.out===id?BEN:seatP(o.play.indexOf(id));};
      const Rd=3.8;
      return{dur:Rd*5,still:2,update(t){
        hideBall();
        const r=Math.floor(t/Rd),lt=t%Rd,nx=(r+1)%5;
        P.forEach((p,i)=>{const id=i+1,u=seg(lt,Rd-1.1+id*.04,Rd-.1+id*.04),k=order(r).play.indexOf(id);
          const q=glide(pos(r,id),pos(nx,id),u,id%2?1.6:-1.6);
          p.set(q[0],q[1],{look:u>0&&u<1?null:(k<0?-Math.PI/2:k<2?LOOK.a:LOOK.b)});
          p.body.material=k<0?teamMat.x:k<2?teamMat.a:teamMat.b;});
        const b=seg(lt,1,2.1),op=win(lt,1,2.7,.25);
        plus.visible=op>.02;plus.material.opacity=op;
        plus.position.set(lerp(0,BEN[0],b),2.2+Math.sin(b*Math.PI)*2.2,lerp(0,BEN[1],b));
        cap({kicker:'Pause · Runde '+(r+1),text:'Wer aussetzt, bekommt den Ausgleich.'});
      }};
    },

    /* 9 · Fair Play — nach dem Match: Netz, Hand, Danke. */
    fairplay:()=>{
      court();floodlights([-7.5,7.5],[-12,12]);
      Object.assign(camS,{r:20,pol:1.05,az:.9,sway:.14});camS.tgt.set(0,.8,0);
      const A=[player('a',1),player('a',2)],B=[player('b'),player('b')];
      const from={a:[[3,18],[7,18.4]],b:[[3,2],[7,1.6]]},to={a:[[3.2,10.7],[6.8,10.7]],b:[[3.2,9.3],[6.8,9.3]]};
      const sp=[spark(),spark()];
      return{dur:6,still:2.8,update(t){
        hideBall();
        const go=seg(t,.3,1.9)*(1-seg(t,4.8,5.8));
        [['a',A],['b',B]].forEach(([tm,ps])=>ps.forEach((p,i)=>{
          const x=lerp(from[tm][i][0],to[tm][i][0],go),y=lerp(from[tm][i][1],to[tm][i][1],go);
          p.set(x-5,y-10,{look:LOOK[tm],swing:win(t,2,3.6,.3)*.5});}));
        const s=win(t,2,3.8,.3),pulse=seg(t,2,2.8,ez.out);
        sp.forEach((m,i)=>{m.visible=s>.02;m.material.opacity=s;m.position.set(i?1.8:-1.8,1.15,0);m.scale.setScalar(.6+pulse*1.6);});
        cap({kicker:'Fair Play',text:s>.1?'Netz. Hand. Danke.':'Nach dem Match geht es ans Netz.'});
      }};
    },
  };
  /* Hervorhebungs-Materialien fuer die Court-Szene */
  const svcHi=own(new THREE.MeshBasicMaterial({color:C.orange,transparent:true}));
  const bandHi=own(new THREE.MeshBasicMaterial({color:C.orange}));

  const make=scenes[id]||scenes.court;
  const sc=make();

  /* ── Schleife ── */
  let raf=0,active=false,t=0,last=0,wall=0;
  const resize=()=>{
    const w=canvas.clientWidth||1,h=canvas.clientHeight||1;
    R.setSize(w,h,false);cam.aspect=w/h;
    /* Hochformat braucht mehr Abstand, sonst schneidet die Breite ab */
    cam.fov=w/h<.9?44:36;cam.updateProjectionMatrix();
  };
  const ro=new ResizeObserver(()=>{resize();if(!active)draw();});ro.observe(canvas);
  resize();
  function draw(){
    const tt=sc.loop===false?Math.min(t,sc.dur):t%sc.dur;
    sc.update(tt);setCam(wall);R.render(S,cam);
  }
  function frame(now){
    const dt=Math.min(.05,(now-(last||now))/1000);last=now;
    if(!document.hidden){t+=dt;wall+=dt;draw();}
    raf=requestAnimationFrame(frame);
  }
  if(reduced){t=still??sc.still??0;draw();}
  const api={
    setActive(on){
      if(reduced) return;
      if(on&&!active){active=true;last=0;raf=requestAnimationFrame(frame);}
      else if(!on&&active){active=false;cancelAnimationFrame(raf);raf=0;}
    },
    drag(dx){camS.drag=cl(camS.drag+dx*.006,-1.4,1.4);if(!active)draw();},
    dispose(){
      cancelAnimationFrame(raf);ro.disconnect();
      S.traverse(o=>{if(o.geometry&&!disposables.includes(o.geometry))o.geometry.dispose?.();});
      disposables.forEach(d=>d.dispose?.());
      R.dispose();R.forceContextLoss?.();
    },
  };
  draw();
  return api;
}
