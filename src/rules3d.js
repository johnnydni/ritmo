/* ═══════════════════════════════════════════════════════════════
   REGELWERK 3D — die 2D-Szenen aus scenes.jsx, in den Raum gestellt.

   Keine eigene Choreografie: die 2D-Szene laeuft unsichtbar unter dem
   Canvas weiter (gleiche Uhr, gleiche Zeitleiste), und diese Engine
   liest je Bild ihr SVG aus und baut daraus die 3D-Szene. Was in 2D
   passiert, passiert in 3D — wer eine Szene aendert, aendert sie in
   scenes.jsx, und beide Fassungen ziehen mit.

   Wie gelesen wird:
   - Bausteine mit `data-k` sind Semantik und werden echte Koerper:
     `court` (Boden, Linien, Netz, Glas, Gitter — mit denselben
     Einsaetzen fuer draw/walls/mesh wie Court in 2D), `mini`
     (Mini-Court der Format-Szenen), `orb` (Glaskugel mit Nummer),
     `ball` (Ball in echter Hoehe z, mit Schatten und Schweif).
   - Alles andere (Linien, Pfade, Rechtecke, Kreise, Text) wird flach
     auf den Boden gelegt, in Farbe, Deckkraft und Zeichen-Fortschritt
     des SVG — wie Grafik, die auf den Platz gemalt ist. Rechtecke mit
     `data-slab` werden Glasplatten (die Anzeigetafel der Zaehlweise).
   - Ellipsen mit flachem Verhaeltnis sind in 2D gekippte Kreise
     (Aufpraller, Puls) und werden in 3D wieder rund.

   Einheiten: 2D 1 m = 9 SVG-Einheiten (K), 3D in Metern. Die Mitte der
   viewBox liegt im Ursprung, x → x, y → z (unten im Bild = zur Kamera).
═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const K=9;
const SL=10-6.95;
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ezio=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const seg=(t,a,b)=>ezio(cl((t-a)/(b-a)));
const num=(v,d=1)=>{const n=parseFloat(v);return isNaN(n)?d:n;};

export function webglOk(){
  try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}
  catch{return false;}
}

/* ── Texturen ─────────────────────────────────────────────────── */
export function canvasTex(w,h,draw,{repeat=null,srgb=true}={}){
  const c=document.createElement('canvas');c.width=Math.max(2,Math.ceil(w));c.height=Math.max(2,Math.ceil(h));
  draw(c.getContext('2d'),c.width,c.height);
  const t=new THREE.CanvasTexture(c);
  if(srgb) t.colorSpace=THREE.SRGBColorSpace;
  if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);}
  t.anisotropy=8;
  return t;
}
const rnd=(s=7)=>()=>(s=(s*16807)%2147483647)/2147483647;
export const turfTex=()=>canvasTex(256,256,(g,w,h)=>{
  g.fillStyle='#ffffff';g.fillRect(0,0,w,h);
  const r=rnd(3);
  for(let i=0;i<9000;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.6)':'rgba(0,0,0,.16)';g.fillRect(r()*w,r()*h,1,1+r()*2);}
},{repeat:[4,8]});
export const meshTex=()=>canvasTex(64,64,(g,w,h)=>{
  g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.lineTo(w,h);g.moveTo(w,0);g.lineTo(0,h);g.stroke();
},{srgb:false});
export const netTex=()=>canvasTex(64,64,(g,w,h)=>{g.strokeStyle='#fff';g.lineWidth=5;g.strokeRect(0,0,w,h);},{srgb:false});
export const blobTex=()=>canvasTex(128,128,(g)=>{
  const gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
});

/* Farbe aus dem berechneten Stil — "rgb(…)"/"rgba(…)"/Hex */
const nc=document.createElement('canvas').getContext('2d');
function colorOf(str){
  if(!str||str==='none'||str==='transparent') return null;
  const m=/rgba?\(([^)]+)\)/.exec(str);
  if(m){const p=m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat);
    return{c:new THREE.Color(p[0]/255,p[1]/255,p[2]/255).convertSRGBToLinear(),a:p.length>3?p[3]:1};}
  nc.fillStyle='#000';nc.fillStyle=str;return colorOf(nc.fillStyle.startsWith('#')?hexRgb(nc.fillStyle):nc.fillStyle);
}
const hexRgb=h=>{const n=parseInt(h.slice(1),16);return`rgb(${n>>16&255},${n>>8&255},${n&255})`;};

/* SVG-Pfad → Teilpfade aus Punkten (M L H V Z, gross und klein) */
function parsePath(d){
  const t=d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g)||[];
  const out=[];let i=0,cmd='',x=0,y=0,sx=0,sy=0,cur=null;
  const n=()=>parseFloat(t[i++]);
  const push=()=>{if(!cur){cur={pts:[[x,y]],closed:false};out.push(cur);}else cur.pts.push([x,y]);};
  while(i<t.length){
    if(/[a-zA-Z]/.test(t[i])) cmd=t[i++];
    switch(cmd){
      case'M':x=n();y=n();cur={pts:[[x,y]],closed:false};out.push(cur);sx=x;sy=y;cmd='L';break;
      case'm':x+=n();y+=n();cur={pts:[[x,y]],closed:false};out.push(cur);sx=x;sy=y;cmd='l';break;
      case'L':x=n();y=n();push();break; case'l':x+=n();y+=n();push();break;
      case'H':x=n();push();break; case'h':x+=n();push();break;
      case'V':y=n();push();break; case'v':y+=n();push();break;
      case'Z':case'z':if(cur)cur.closed=true;x=sx;y=sy;cur=null;break;
      default:i++;
    }
  }
  return out;
}
function rrect(x,y,w,h,r){
  r=Math.min(r||0,w/2,h/2);
  if(r<=.01) return[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
  const p=[],arc=(cx,cy,a0)=>{for(let i=0;i<=5;i++){const a=a0+i/5*Math.PI/2;p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}};
  arc(x+w-r,y+r,-Math.PI/2);arc(x+w-r,y+h-r,0);arc(x+r,y+h-r,Math.PI/2);arc(x+r,y+r,Math.PI);
  return p;
}
const circ=(cx,cy,rx,ry,n=48)=>Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;return[cx+Math.cos(a)*rx,cy+Math.sin(a)*ry];});

/* Flaches Band entlang Linienzuegen (Welt-Meter, xz) mit Fortschritt u
   und Strichmuster. Jedes Stueck bekommt Kappen, damit Ecken schliessen. */
export function ribbonGeo(lines,w,u=1,dash=null){
  const P=[];
  let total=0;lines.forEach(l=>{for(let i=1;i<l.length;i++)total+=Math.hypot(l[i][0]-l[i-1][0],l[i][1]-l[i-1][1]);});
  let left=total*u, dl=0, di=0, on=true;
  const quad=(a,b)=>{
    const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<1e-5)return;
    const ux=dx/L,uz=dz/L,cap=w/2,nx=-uz*w/2,nz=ux*w/2;
    const a0=[a[0]-ux*cap,a[1]-uz*cap],b0=[b[0]+ux*cap,b[1]+uz*cap];
    P.push(a0[0]+nx,0,a0[1]+nz, a0[0]-nx,0,a0[1]-nz, b0[0]+nx,0,b0[1]+nz,
      b0[0]+nx,0,b0[1]+nz, a0[0]-nx,0,a0[1]-nz, b0[0]-nx,0,b0[1]-nz);
  };
  for(const l of lines){
    for(let i=1;i<l.length&&left>0;i++){
      let a=l[i-1],b=l[i];let L=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(L>left){const k=left/L;b=[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];L=left;}
      left-=L;
      if(!dash){quad(a,b);continue;}
      let s=0;
      while(s<L){
        const rem=dash[di]-dl, step=Math.min(rem,L-s);
        if(on){const k0=s/L,k1=(s+step)/L;
          quad([a[0]+(b[0]-a[0])*k0,a[1]+(b[1]-a[1])*k0],[a[0]+(b[0]-a[0])*k1,a[1]+(b[1]-a[1])*k1]);}
        s+=step;dl+=step;
        if(dl>=dash[di]-1e-6){dl=0;di=(di+1)%dash.length;on=!on;}
      }
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
  g.computeVertexNormals();
  return g;
}
function fillGeo(pts){
  const sh=new THREE.Shape(pts.map(p=>new THREE.Vector2(p[0],-p[1])));
  const g=new THREE.ShapeGeometry(sh);g.rotateX(-Math.PI/2);
  return g;
}

/* Rand-Leuchten fuer die Glaskugeln: die Teamfarbe sitzt am Rand,
   wie die farbige Kontur des Orbs in 2D. */
export const rimMat=()=>new THREE.ShaderMaterial({
  uniforms:{col:{value:new THREE.Color()},op:{value:1}},
  transparent:true,depthWrite:false,
  vertexShader:`varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);
    vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform vec3 col;uniform float op;varying vec3 vN;varying vec3 vV;void main(){
    float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.4);
    gl_FragColor=vec4(col,clamp(f*1.6+.05,0.,1.)*op);
    #include <colorspace_fragment>
  }`,
});

/* ═══════════════════════════════════════════════════════════════ */
export function createRuleScene(canvas,root,{id,reduced=false}={}){
  const svg=root.querySelector('svg[data-stage]');
  if(!svg) throw new Error('Keine 2D-Szene');
  const vb=svg.viewBox.baseVal;
  const CX=vb.x+vb.width/2, CY=vb.y+vb.height/2;
  const wx=x=>(x-CX)/K, wz=y=>(y-CY)/K;

  const R=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  R.setClearColor(0x000000,0);
  R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
  R.outputColorSpace=THREE.SRGBColorSpace;
  R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;

  const S=new THREE.Scene();
  const pmrem=new THREE.PMREMGenerator(R);
  const envRT=pmrem.fromScene(new RoomEnvironment(),.04);
  S.environment=envRT.texture;
  const cam=new THREE.PerspectiveCamera(34,1,.1,400);
  const disposables=[envRT,pmrem];
  const own=o=>{disposables.push(o);return o;};

  const half=Math.max(vb.width,vb.height)/K/2+4;
  S.add(new THREE.HemisphereLight(0xdfe6ff,0x20222a,.75));
  const key=new THREE.DirectionalLight(0xfff4e6,2.3);
  key.position.set(-half*.5,half*1.6,half*.7);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-half,right:half,top:half,bottom:-half,near:.5,far:half*5});
  key.shadow.bias=-.0004;key.shadow.normalBias=.02;key.shadow.radius=5;
  S.add(key);
  const fill=new THREE.DirectionalLight(0xa9bcff,.5);fill.position.set(half,half*.6,-half);S.add(fill);

  /* Boden nur als Schattenfaenger: die Szene steht wie die 2D-Fassung
     auf der Karte darunter, ohne eigenen Hintergrund. */
  const shadowCatch=new THREE.Mesh(own(new THREE.PlaneGeometry(400,400)),own(new THREE.ShadowMaterial({opacity:.38})));
  shadowCatch.rotation.x=-Math.PI/2;shadowCatch.position.y=-.02;shadowCatch.receiveShadow=true;S.add(shadowCatch);

  /* Farben der App (CSS-Variablen) */
  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const cv=(n,f)=>colorOf(css(n))?.c||new THREE.Color(f);
  const COL={o:cv('--o','#ff7a1a'),blue:cv('--blue','#2e7bff'),t1:cv('--t1','#ffffff'),t3:cv('--t3','#8a8f98'),ball:cv('--ball','#d9f23a')};
  const team=t=>t==='a'?COL.o:t==='b'?COL.blue:COL.t3;

  const tTurf=own(turfTex()),tMesh=own(meshTex()),tNet=own(netTex()),tBlob=own(blobTex());
  const shared=new Set([tTurf,tMesh,tNet,tBlob]);
  const turfColor=new THREE.Color(0x1e4e93);
  const frameM=own(new THREE.MeshStandardMaterial({color:0x15171c,roughness:.45,metalness:.7}));
  const flatM=(c,o=1)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
  const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=o.receiveShadow=true;return o;};

  /* ── Baukasten ── */
  const pool=new Map();      // SVG-Element → Eintrag
  const free=e=>{
    e.obj.traverse(o=>{o.geometry?.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];
      ms.forEach(m=>{if(m&&!disposables.includes(m)){if(m.map&&!shared.has(m.map))m.map.dispose();m.dispose();}});});
    e.obj.parent?.remove(e.obj);
  };

  /* Ein Court: lokale Meter, Ecke links oben = (0,0), Netz bei z=10.
     Einsaetze wie Court() in scenes.jsx. */
  function makeCourt(el){
    const d=el.dataset, half2=d.half==='1', bare=d.bare==='1', y0=half2?10:0;
    const g=new THREE.Group();
    const mats=[];const M=m=>{mats.push([m,m.opacity]);return m;};
    const turf=M(new THREE.MeshStandardMaterial({map:tTurf,color:turfColor,roughness:.9,transparent:true}));
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(10,20-y0),turf);
    floor.rotation.x=-Math.PI/2;floor.position.set(5,.001,(20+y0)/2);floor.receiveShadow=true;g.add(floor);
    const lineM=M(flatM(COL.t1,.92)),netLineM=M(flatM(COL.o,1));
    const lines={o:new THREE.Mesh(new THREE.BufferGeometry(),lineM),s:new THREE.Mesh(new THREE.BufferGeometry(),M(flatM(COL.t1,.7))),
      c:new THREE.Mesh(new THREE.BufferGeometry(),M(flatM(COL.t1,.7)))};
    Object.values(lines).forEach(m=>{m.position.y=.012;m.renderOrder=3;g.add(m);});
    /* Netz: Maschen + oranges Band (in 2D die orange Netzlinie) */
    const net=new THREE.Group();net.position.set(-.35,0,10);g.add(net);
    const nm=M(new THREE.MeshStandardMaterial({color:0x111318,alphaMap:tNet.clone(),transparent:true,alphaTest:.35,side:THREE.DoubleSide,roughness:.8}));
    own(nm.alphaMap);nm.alphaMap.wrapS=nm.alphaMap.wrapT=THREE.RepeatWrapping;nm.alphaMap.repeat.set(10.7/.05,.84/.05);
    const netM=new THREE.Mesh(new THREE.PlaneGeometry(10.7,.84),nm);netM.position.set(5.35,.46,0);netM.castShadow=true;net.add(netM);
    const bandM=M(new THREE.MeshStandardMaterial({color:COL.o,emissive:COL.o,emissiveIntensity:.45,roughness:.5,transparent:true}));
    const band=box(10.7,.06,.05,bandM);band.position.set(5.35,.9,0);net.add(band);
    const netFloor=new THREE.Mesh(ribbonGeo([[[0,0],[10.7,0]]],.12),netLineM);netFloor.position.y=.013;net.add(netFloor);
    for(const x of [.2,10.5]){const p=box(.09,.95,.09,frameM);p.position.set(x,.475,0);net.add(p);}
    /* Waende: dieselbe Reihenfolge wie die Glas-Striche in 2D */
    const glassM=()=>M(new THREE.MeshPhysicalMaterial({color:0xd6ecff,transparent:true,opacity:.16,roughness:.04,
      envMapIntensity:1.5,side:THREE.DoubleSide,depthWrite:false,clearcoat:1,emissive:COL.o,emissiveIntensity:0}));
    const fenceM=M(new THREE.MeshStandardMaterial({color:0x2a2d33,alphaMap:tMesh.clone(),transparent:true,alphaTest:.3,
      side:THREE.DoubleSide,metalness:.6,roughness:.5}));
    own(fenceM.alphaMap);fenceM.alphaMap.wrapS=fenceM.alphaMap.wrapT=THREE.RepeatWrapping;fenceM.alphaMap.repeat.set(12/.2,3/.2);
    const piece=(parts)=>{const pg=new THREE.Group();const gm=glassM();
      parts.forEach(([w,h,x,y,z,ry,fenceH])=>{
        const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),gm);p.position.set(x,y,z);p.rotation.y=ry;p.renderOrder=2;pg.add(p);
        const fr=box(ry?.05:w,.05,ry?w:.05,frameM);fr.position.set(x,y+h/2,z);pg.add(fr);
        if(fenceH){const f=new THREE.Mesh(new THREE.PlaneGeometry(w,fenceH),fenceM);f.position.set(x,h+fenceH/2,z);f.rotation.y=ry;pg.add(f);}
      });
      g.add(pg);return{g:pg,m:gm};};
    const back=z=>[[10,3,5,1.5,z,0,1]];
    const side=(x,zEnd,s)=>[[2,3,x,1.5,zEnd+s*1,Math.PI/2,1],[2,2,x,1,zEnd+s*3,Math.PI/2,1]];
    const pieces=bare?[]:half2
      ?[piece(back(20)),piece(side(0,20,-1)),piece(side(10,20,-1))]
      :[piece(back(0)),piece(back(20)),piece(side(0,0,1)),piece(side(10,0,1)),piece(side(0,20,-1)),piece(side(10,20,-1))];
    const mid=new THREE.Group();g.add(mid);
    if(!bare) for(const x of [0,10]){const z0=Math.max(4,y0),L=16-z0;
      const f=new THREE.Mesh(new THREE.PlaneGeometry(L,3),fenceM);f.position.set(x,1.5,z0+L/2);f.rotation.y=Math.PI/2;mid.add(f);
      for(let z=z0;z<=16.01;z+=2){const p=box(.07,3,.07,frameM);p.position.set(x,1.5,z);mid.add(p);}}
    let key='';
    return{obj:g,update(op){
      const s=+d.s||K,draw=+d.draw,walls=+d.walls,mesh=+d.mesh,gh=d.gh===''?-1:+d.gh;
      g.position.set(wx(+d.ox),0,wz(+d.oy));g.scale.setScalar(s/K);
      const o=seg(draw,0,.45),n=seg(draw,.3,.65),sv=seg(draw,.5,.85),c=seg(draw,.68,1);
      const k=[o,sv,c].map(v=>v.toFixed(3)).join();
      if(k!==key){key=k;
        lines.o.geometry.dispose();lines.o.geometry=ribbonGeo([[[0,y0],[10,y0],[10,20],[0,20],[0,y0]]],.07,o);
        lines.s.geometry.dispose();lines.s.geometry=ribbonGeo([...(half2?[]:[[[0,SL],[10,SL]]]),[[0,20-SL],[10,20-SL]]],.06,sv);
        lines.c.geometry.dispose();lines.c.geometry=ribbonGeo([[[5,half2?10:SL],[5,20-SL]]],.06,c);}
      turf.opacity=.9*o*op;floor.visible=o>0;
      net.scale.set(Math.max(.001,n),1,1);net.visible=n>0;
      pieces.forEach((p,i)=>{const u=seg(walls,i*.08,.5+i*.08);p.g.scale.y=Math.max(.001,u);p.g.visible=u>0;
        p.m.opacity=(gh===i?.4:.09)*op;p.m.emissiveIntensity=gh===i?1.1:0;});
      mid.visible=mesh>0;mid.scale.y=Math.max(.001,mesh);
      mats.forEach(([m,base])=>{if(m!==turf&&!pieces.some(p=>p.m===m))m.opacity=base*op;});
    }};
  }

  /* Mini-Court der Format-Szenen (Hochformat: Netz quer; dir h: Netz laengs) */
  function makeMini(el){
    const d=el.dataset,w=+d.w/K,h=+d.h/K,horiz=d.dir==='h';
    const g=new THREE.Group();
    const turf=new THREE.MeshStandardMaterial({map:tTurf,color:turfColor,roughness:.9,transparent:true});
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(w,h),turf);floor.rotation.x=-Math.PI/2;floor.position.set(w/2,.001,h/2);
    floor.receiveShadow=true;g.add(floor);
    const edgeM=flatM(COL.t1,.6);
    const edge=new THREE.Mesh(ribbonGeo([rrect(0,0,w,h,.22).concat([[w-.22,0]])],.07),edgeM);edge.position.y=.012;g.add(edge);
    const svc=horiz?[[[w*.17,0],[w*.17,h]],[[w*.83,0],[w*.83,h]]]:[[[0,h*.17],[w,h*.17]],[[0,h*.83],[w,h*.83]]];
    const sm=new THREE.Mesh(ribbonGeo(svc,.045),flatM(COL.t1,.35));sm.position.y=.012;g.add(sm);
    const L=horiz?h:w;
    const net=new THREE.Group();
    const nm=new THREE.MeshStandardMaterial({color:0x111318,alphaMap:tNet,transparent:true,alphaTest:.35,side:THREE.DoubleSide});
    const nmesh=new THREE.Mesh(new THREE.PlaneGeometry(L+.3,.42),nm);nmesh.position.y=.23;nmesh.castShadow=true;net.add(nmesh);
    const bM=new THREE.MeshStandardMaterial({color:COL.o,emissive:COL.o,emissiveIntensity:.5});
    const b=box(L+.3,.05,.05,bM);b.position.y=.45;net.add(b);
    const nf=new THREE.Mesh(ribbonGeo([[[-(L+.3)/2,0],[(L+.3)/2,0]]],.12),flatM(COL.o,1));nf.position.y=.013;net.add(nf);
    net.position.set(w/2,0,h/2);if(horiz)net.rotation.y=Math.PI/2;g.add(net);
    return{obj:g,update(op){
      const hi=+d.hi||0;
      g.position.set(wx(+d.x),0,wz(+d.y));
      turf.opacity=(.85+hi*.15)*op;turf.emissive=COL.o;turf.emissiveIntensity=hi*.12;
      edgeM.color.copy(hi?COL.o:COL.t1);edgeM.opacity=(hi?.95:.6)*op;
    }};
  }

  /* Spieler als Glaskugel, Nummer darin, Kontur in Teamfarbe */
  const sphG=own(new THREE.SphereGeometry(1,40,28));
  const labelCache=new Map();
  const labelTex=txt=>{
    if(!labelCache.has(txt)) labelCache.set(txt,own(canvasTex(128,128,g=>{
      g.fillStyle='#fff';g.font=`600 76px ${css('--font-sans')||'system-ui'}`;g.textAlign='center';g.textBaseline='middle';
      g.fillText(txt,64,70);})));
    shared.add(labelCache.get(txt));
    return labelCache.get(txt);
  };
  function makeOrb(el){
    const d=el.dataset,g=new THREE.Group();
    const glass=new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.2,roughness:.06,metalness:0,
      clearcoat:1,clearcoatRoughness:.05,envMapIntensity:1.8,depthWrite:false});
    const s=new THREE.Mesh(sphG,glass);s.castShadow=true;g.add(s);
    const rim=rimMat();const rm=new THREE.Mesh(sphG,rim);rm.scale.setScalar(1.002);g.add(rm);
    const lab=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false}));lab.renderOrder=6;g.add(lab);
    const ringM=flatM(COL.o,0);const ring=new THREE.Mesh(new THREE.RingGeometry(.95,1,64),ringM);ring.rotation.x=-Math.PI/2;g.add(ring);
    let lt=null;
    return{obj:g,update(op){
      const r=(+d.r||6)/K, c=team(d.team);
      g.position.set(wx(+d.x),r+lift(+d.x,+d.y),wz(+d.y));
      s.scale.setScalar(r);rm.scale.setScalar(r*1.003);
      glass.opacity=.2*op;rim.uniforms.col.value.copy(c);rim.uniforms.op.value=op;
      const txt=d.label;
      if(txt!==lt){lt=txt;lab.material.map=txt?labelTex(txt):null;lab.material.needsUpdate=true;}
      lab.visible=!!txt;lab.scale.setScalar(r*1.25);lab.material.opacity=op;
      const rg=+d.ring||0;ring.visible=rg>0;ring.position.y=-r+.015;
      const rr=r+2.6/K;ring.scale.setScalar(rr);ringM.color.copy(c);ringM.opacity=rg*op;
    }};
  }

  /* Ball in echter Hoehe; Schattenfleck direkt darunter liest die Hoehe */
  const ballG=own(new THREE.SphereGeometry(1,24,18));
  function makeBall(el){
    const d=el.dataset,g=new THREE.Group();
    const bm=new THREE.MeshStandardMaterial({color:COL.ball,emissive:COL.ball,emissiveIntensity:.35,roughness:.5,transparent:true});
    const ball=new THREE.Mesh(ballG,bm);ball.castShadow=true;g.add(ball);
    const blobM=new THREE.MeshBasicMaterial({map:tBlob,transparent:true,depthWrite:false});
    const blob=new THREE.Mesh(new THREE.PlaneGeometry(1,1),blobM);blob.rotation.x=-Math.PI/2;g.add(blob);
    const trail=[0,1,2,3].map(i=>{const m=new THREE.Mesh(ballG,new THREE.MeshBasicMaterial({color:COL.ball,transparent:true,depthWrite:false,toneMapped:false}));g.add(m);return m;});
    return{obj:g,update(op){
      const k=(+d.s||K)/K, br=.2*k;
      const P=(x,y,z)=>[wx(x),z*k+br,wz(y)];
      const p=P(+d.x,+d.y,+d.z);ball.position.set(...p);ball.scale.setScalar(br);bm.opacity=op;
      blob.position.set(p[0],.02,p[2]);const bs=.55*k*(1+ +d.z*.25);blob.scale.set(bs,bs,1);
      blobM.opacity=.55*Math.max(.25,1-+d.z/2.5)*op;
      let tr=[];try{tr=JSON.parse(d.trail||'[]');}catch{}
      trail.forEach((m,i)=>{const q=tr[i];m.visible=!!q;if(!q)return;
        m.position.set(...P(q[0],q[1],q[2]));m.scale.setScalar(br*(1-i/(tr.length+1)));
        m.material.opacity=.4*(1-i/tr.length)*op;});
    }};
  }

  /* Flache Grafik: Fuellung + Kontur eines SVG-Elements */
  function makeFlat(){
    const g=new THREE.Group();
    const fm=flatM(new THREE.Color(),1), sm=flatM(new THREE.Color(),1);
    const fill=new THREE.Mesh(new THREE.BufferGeometry(),fm), stroke=new THREE.Mesh(new THREE.BufferGeometry(),sm);
    g.add(fill,stroke);
    let gk='',slab=null;
    return{obj:g,set({lines,closed,fillC,fillA,strokeC,strokeA,w,u,dash,y,order,isSlab,key}){
      if(key!==gk){gk=key;
        fill.geometry.dispose();fill.geometry=fillC&&closed.length?fillGeo(closed[0]):new THREE.BufferGeometry();
        stroke.geometry.dispose();stroke.geometry=strokeC&&w>0?ribbonGeo(lines,w,u,dash):new THREE.BufferGeometry();
        if(isSlab&&closed.length){
          if(slab){slab.geometry.dispose();g.remove(slab);}
          const sh=new THREE.Shape(closed[0].map(p=>new THREE.Vector2(p[0],-p[1])));
          const eg=new THREE.ExtrudeGeometry(sh,{depth:SLAB,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:3,curveSegments:4});
          eg.rotateX(-Math.PI/2);
          slab=new THREE.Mesh(eg,new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.14,roughness:.08,
            clearcoat:1,envMapIntensity:1.6,depthWrite:false}));
          slab.castShadow=true;slab.receiveShadow=true;g.add(slab);
        }
      }
      fill.visible=!!fillC&&!isSlab;stroke.visible=!!strokeC;
      if(fillC){fm.color.copy(fillC);fm.opacity=fillA;}
      if(strokeC){sm.color.copy(strokeC);sm.opacity=strokeA;}
      const top=isSlab?SLAB+.045:0;
      fill.position.y=y;stroke.position.y=y+top+.001;
      fill.renderOrder=stroke.renderOrder=order;
    }};
  }

  /* Text flach auf dem Boden, in Schrift, Farbe und Laufweite des SVG */
  const TS=14;
  function makeText(){
    const g=new THREE.Group();
    const m=new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),m);plane.rotation.x=-Math.PI/2;g.add(plane);
    let tk='';
    return{obj:g,set({el,cs,bb,mt,op,y,order}){
      const txt=el.textContent;
      const font=`${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize)}px ${cs.fontFamily}`;
      const k=[txt,font,cs.fill,cs.letterSpacing,bb.width.toFixed(1),bb.height.toFixed(1)].join('|');
      if(k!==tk){tk=k;m.map?.dispose();
        const pad=2,x0=bb.x-pad,y0=bb.y-pad,W=(bb.width+pad*2)*TS,H=(bb.height+pad*2)*TS;
        const ax=parseFloat(el.getAttribute('x'))||0, ay=parseFloat(el.getAttribute('y'))||0;
        m.map=canvasTex(W,H,(c)=>{
          c.font=`${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize)*TS}px ${cs.fontFamily}`;
          const ls=parseFloat(cs.letterSpacing);if(!isNaN(ls)&&'letterSpacing'in c)c.letterSpacing=`${ls*TS}px`;
          c.fillStyle=cs.fill;c.textBaseline='alphabetic';
          const anc=cs.textAnchor;c.textAlign=anc==='middle'?'center':anc==='end'?'right':'left';
          c.fillText(txt,(ax-x0)*TS,(ay-y0)*TS);
        });
        m.needsUpdate=true;
        plane.userData.box=[x0,y0,bb.width+pad*2,bb.height+pad*2];
      }
      const[x0,y0,w,h]=plane.userData.box;
      const cxl=x0+w/2,cyl=y0+h/2;
      const px=mt.a*cxl+mt.c*cyl+mt.e, py=mt.b*cxl+mt.d*cyl+mt.f;
      const sc=Math.hypot(mt.a,mt.b);
      g.position.set(wx(px),y+lift(px,py),wz(py));
      g.rotation.y=-Math.atan2(mt.b,mt.a);
      plane.scale.set(w*sc/K,h*sc/K,1);
      m.opacity=op;plane.renderOrder=order;
    }};
  }

  /* Glasplatten (data-slab): was darauf steht, steht oben drauf */
  const SLAB=.32;
  let slabs=[];
  const lift=(x,y)=>slabs.some(b=>x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3])?SLAB+.05:0;

  /* ── Lesen: einmal je Bild durch das SVG ── */
  const MAKE={court:makeCourt,mini:makeMini,orb:makeOrb,ball:makeBall};
  const SHAPES=new Set(['rect','line','path','circle','ellipse','polyline','polygon']);
  function sync(){
    const scr=svg.getScreenCTM();if(!scr) return false;
    const inv=scr.inverse();
    const seen=new Set();let order=0;
    slabs=[...svg.querySelectorAll('rect[data-slab]')].map(r=>{
      const x=+r.getAttribute('x'),y=+r.getAttribute('y');return[x,y,x+ +r.getAttribute('width'),y+ +r.getAttribute('height')];});
    const get=(el,make)=>{let e=pool.get(el);if(!e){e=make(el);pool.set(el,e);S.add(e.obj);}seen.add(el);return e;};
    const walk=(el,op)=>{
      const cs=getComputedStyle(el);
      if(cs.display==='none') return;
      const o=op*(parseFloat(cs.opacity)||0);
      const k=el.dataset?.k;
      if(k&&MAKE[k]){const e=get(el,MAKE[k]);e.obj.visible=o>.003;if(e.obj.visible)e.update(o);return;}
      const tag=el.tagName;
      if(tag==='g'||tag==='svg'){for(const c of el.children)walk(c,o);return;}
      if(o<=.003) return;
      const ctm=el.getScreenCTM();if(!ctm) return;
      const mt=inv.multiply(ctm);
      order++;
      const y=.004+order*.0012;
      if(tag==='text'){
        let bb;try{bb=el.getBBox();}catch{return;}
        if(!bb.width) return;
        const e=get(el,makeText);e.obj.visible=true;
        e.set({el,cs,bb,mt,op:o*num(cs.fillOpacity),y,order:10+order});
        return;
      }
      if(!SHAPES.has(tag)) return;
      const A=n=>parseFloat(el.getAttribute(n))||0;
      let subs=[];
      if(tag==='rect') subs=[{pts:rrect(A('x'),A('y'),A('width'),A('height'),A('rx')||A('ry')),closed:true}];
      else if(tag==='line') subs=[{pts:[[A('x1'),A('y1')],[A('x2'),A('y2')]],closed:false}];
      else if(tag==='circle') subs=[{pts:circ(A('cx'),A('cy'),A('r'),A('r')),closed:true}];
      else if(tag==='ellipse'){const rx=A('rx'),ry=A('ry');
        subs=[{pts:circ(A('cx'),A('cy'),rx,ry/rx<.75?rx:ry),closed:true}];}
      else if(tag==='path') subs=parsePath(el.getAttribute('d')||'');
      if(!subs.length) return;
      const T=p=>[wx(mt.a*p[0]+mt.c*p[1]+mt.e),wz(mt.b*p[0]+mt.d*p[1]+mt.f)];
      const lines=subs.map(s=>{const p=s.pts.map(T);if(s.closed&&p.length>2)p.push(p[0]);return p;});
      const closed=subs.filter(s=>s.closed&&s.pts.length>2).map(s=>s.pts.map(T));
      const fc=colorOf(cs.fill), sc=colorOf(cs.stroke);
      const fa=fc?fc.a*num(cs.fillOpacity)*o:0, sa=sc?sc.a*num(cs.strokeOpacity)*o:0;
      const scale=Math.hypot(mt.a,mt.b);
      const w=sc?parseFloat(cs.strokeWidth)*scale/K:0;
      /* Zeichnen per Strichmuster (pathLength=1, dasharray 1): Fortschritt */
      let u=1,dash=null;
      const da=cs.strokeDasharray;
      if(el.getAttribute('pathLength')==='1'&&da&&da!=='none'&&parseFloat(da)===1&&da.split(/[ ,]+/).filter(Boolean).length===1)
        u=cl(1-(parseFloat(cs.strokeDashoffset)||0));
      else if(da&&da!=='none'){const v=da.split(/[ ,]+/).map(parseFloat).filter(n=>n>0);if(v.length)dash=v.map(n=>n*scale/K);}
      const isSlab=el.hasAttribute('data-slab');
      const key=JSON.stringify([lines.map(l=>l.map(p=>[+p[0].toFixed(3),+p[1].toFixed(3)])),+w.toFixed(4),+u.toFixed(3),dash,!!fc,!!sc]);
      const e=get(el,makeFlat);e.obj.visible=true;
      e.set({lines,closed,fillC:fa>.002?fc.c:null,fillA:fa,strokeC:sa>.002?sc.c:null,strokeA:sa,w,u,dash,y,order:10+order,isSlab,key});
    };
    walk(svg,1);
    for(const[el,e] of pool) if(!seen.has(el)){free(e);pool.delete(el);}
    return true;
  }

  /* ── Kamera: Buehne passend ins Bild, leichtes Schweben ── */
  const POL={zaehlung:.5,formate:.7,americano:.74,mexicano:.7,rotation:.74,fairplay:.86};
  const camS={pol:POL[id]??.9,az:0,drag:0,dist:30};
  const tgt=new THREE.Vector3(0,0,0);
  /* Gerahmt wird, was die 2D-Szene tatsaechlich zeichnet (getBBox),
     nicht ihre viewBox mit allen Raendern. Die Flaeche waechst nur
     (Vereinigung ueber die Zeit), die Kamera folgt weich — so springt
     nichts, wenn eine Beschriftung erst spaeter auftaucht. */
  let bx=null,corners=[],want=30;
  const frame3=()=>{
    let b;try{b=svg.getBBox();}catch{return;}
    if(!b.width) return;
    const n=[b.x,b.y,b.x+b.width,b.y+b.height];
    if(bx&&n[0]>=bx[0]&&n[1]>=bx[1]&&n[2]<=bx[2]&&n[3]<=bx[3]) return;
    bx=bx?[Math.min(bx[0],n[0]),Math.min(bx[1],n[1]),Math.max(bx[2],n[2]),Math.max(bx[3],n[3])]:n;
    const p=3;corners=[];
    for(const x of [bx[0]-p,bx[2]+p]) for(const y of [bx[1]-p,bx[3]+p]) for(const h of [0,1.6]) corners.push(new THREE.Vector3(wx(x),h,wz(y)));
    tgt.set(wx((bx[0]+bx[2])/2),0,wz((bx[1]+bx[3])/2));
    fit();
  };
  const place=(az,d)=>{cam.position.set(tgt.x+d*Math.sin(camS.pol)*Math.sin(az),tgt.y+d*Math.cos(camS.pol),tgt.z+d*Math.sin(camS.pol)*Math.cos(az));cam.lookAt(tgt);cam.updateMatrixWorld();};
  const fits=d=>{place(0,d);const v=new THREE.Vector3();return corners.every(p=>{v.copy(p).project(cam);return Math.abs(v.x)<.97&&Math.abs(v.y)<.95&&v.z<1;});};
  const fit=()=>{if(!corners.length)return;let a=2,b=300;for(let i=0;i<40;i++){const m=(a+b)/2;fits(m)?b=m:a=m;}want=b;};
  let time=0;
  const setCam=()=>{camS.dist+=(want-camS.dist)*(camS.ready?.06:1);camS.ready=true;
    const az=camS.az+camS.drag+(reduced?0:Math.sin(time/18*Math.PI*2)*.07);place(az,camS.dist);};
  const resize=()=>{
    const w=canvas.clientWidth||1,h=canvas.clientHeight||1;
    R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();fit();camS.ready=false;
  };
  const ro=new ResizeObserver(()=>{resize();draw();});ro.observe(canvas);
  resize();

  function draw(){if(sync()){frame3();setCam();R.render(S,cam);}}

  let raf=0,active=false,last=0,iv=0;
  const frame=now=>{
    time+=Math.min(.05,(now-(last||now))/1000);last=now;
    if(!document.hidden) draw();
    raf=requestAnimationFrame(frame);
  };
  draw();
  return{
    setActive(on){
      if(on&&!active){active=true;last=0;
        if(reduced) iv=setInterval(draw,400); else raf=requestAnimationFrame(frame);}
      else if(!on&&active){active=false;cancelAnimationFrame(raf);clearInterval(iv);raf=iv=0;}
    },
    drag(dx){camS.drag=cl(camS.drag+dx*.006,-1.2,1.2);if(!active||reduced)draw();},
    dispose(){
      cancelAnimationFrame(raf);clearInterval(iv);ro.disconnect();
      for(const e of pool.values()) free(e);pool.clear();
      disposables.forEach(d=>d.dispose?.());
      R.dispose();R.forceContextLoss?.();
    },
  };
}
