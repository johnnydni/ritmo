/* ═══════════════════════════════════════════════════════════════
   SPIELZUG-SIMULATOR — die Buehne (three.js).

   Ein Court, vier Glaskugeln, ein Ball. Die Engine spielt, was
   `scenesFor` (stylePlays.js) liefert, und weiss nichts ueber Padel:
   sie bewegt Rollen auf Plaetze und den Ball ueber Wegpunkte.

   Zwei Ansichten auf derselben Szene, die Kamera faehrt dazwischen:
   - `idle`  von oben, in einem Band zwischen Auswahl und Szenenliste
   - `kino`  tief hinter dem unteren Team, ueber den ganzen Screen
   Das Band ist ein Ausschnitt des Canvas (`setViewOffset`): der Canvas
   bleibt bildschirmgross, nur der Bildmittelpunkt wandert. So gibt es
   beim Wechsel keinen zweiten Canvas und keinen Schnitt.

   Wird per import() geladen; teilt sich Texturen und Kugel-Shader mit
   rules3d.js (ein gemeinsamer Chunk, kein zweites three.js).
═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { canvasTex, turfTex, netTex, blobTex, ribbonGeo, rimMat, webglOk } from './rules3d.js';
export { webglOk };

const SL=6.95;
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ez=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const lerp=(a,b,u)=>a+(b-a)*u;
/* Grundaufstellung, solange nichts laeuft: Platz 0/1 unten, 2/3 oben */
const HOME=[[2.8,6],[7.2,6],[2.8,-6],[7.2,-6]];
const CARTON='#F1E9D8';

/* Das Zeichen eines Typs, selbst gezeichnet: auf Schrift-Glyphen wie
   dem Sechseck ist nicht auf jedem Geraet Verlass. */
function symbol(g,id,col){
  g.fillStyle=g.strokeStyle=col;g.lineWidth=9;g.lineJoin='round';
  const poly=(n,r,rot,cx=64,cy=64)=>{g.beginPath();for(let i=0;i<n;i++){const a=rot+i/n*Math.PI*2;
    g[i?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r);}g.closePath();};
  if(id==='chico'){g.beginPath();g.arc(64,64,24,0,7);g.stroke();}
  else if(id==='toro'){poly(3,31,-Math.PI/2,64,69);g.fill();}
  else if(id==='individuoso'){g.fillRect(40,40,48,48);}
  else if(id==='muro'){poly(6,28,0);g.stroke();}
  else if(id==='fantasma'){g.beginPath();g.arc(64,64,26,0,7);g.fill();}
  else if(id==='motor'){poly(3,21,0,50,64);g.fill();poly(3,21,0,82,64);g.fill();}
  else{g.beginPath();g.moveTo(64,92);g.bezierCurveTo(14,58,34,26,64,48);g.bezierCurveTo(94,26,114,58,64,92);g.fill();}
}

export function createSim(canvas,{reduced=false,styles={},onState=()=>{},onProgress=()=>{}}={}){
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
  const cam=new THREE.PerspectiveCamera(30,1,.1,400);
  const texs=[];const tx=t=>{texs.push(t);return t;};

  S.add(new THREE.HemisphereLight(0xdfe6ff,0x20222a,.8));
  const key=new THREE.DirectionalLight(0xfff4e6,2.3);
  key.position.set(-8,22,9);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.5,far:60});
  key.shadow.bias=-.0004;key.shadow.normalBias=.02;key.shadow.radius=5;S.add(key);
  const fill=new THREE.DirectionalLight(0xa9bcff,.5);fill.position.set(12,8,-12);S.add(fill);

  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const col=(n,f)=>{try{const c=new THREE.Color(css(n)||f);return c;}catch{return new THREE.Color(f);}};
  const COL={o:col('--o','#ff7a1a'),blue:new THREE.Color('#4aa3ff'),t1:new THREE.Color('#ffffff'),ball:new THREE.Color('#d9f23a')};
  const serif=css('--font-serif')||'Times New Roman, serif';

  const flatM=(c,o=1)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
  const frameM=new THREE.MeshStandardMaterial({color:0x15171c,roughness:.45,metalness:.7});
  const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=o.receiveShadow=true;return o;};
  const tTurf=tx(turfTex()),tNet=tx(netTex()),tBlob=tx(blobTex());

  /* ── Court: Welt in Metern, Mitte im Ursprung, Netz bei z=0 ── */
  const W=new THREE.Group();W.position.x=-5;S.add(W);     // Feld-x 0..10 → Welt −5..5
  {
    const apron=new THREE.Mesh(new THREE.PlaneGeometry(11.6,21.6),new THREE.MeshStandardMaterial({color:0x0c234a,roughness:.95,envMapIntensity:.2}));
    apron.rotation.x=-Math.PI/2;apron.position.set(5,-.01,0);apron.receiveShadow=true;W.add(apron);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(10,20),new THREE.MeshStandardMaterial({map:tTurf,color:0x123a7c,roughness:.95,envMapIntensity:.25}));
    floor.rotation.x=-Math.PI/2;floor.position.set(5,0,0);floor.receiveShadow=true;W.add(floor);
    const ln=(lines,w,o)=>{const m=new THREE.Mesh(ribbonGeo(lines,w),flatM(COL.t1,o));m.position.y=.012;m.renderOrder=3;W.add(m);};
    ln([[[0,-10],[10,-10],[10,10],[0,10],[0,-10]]],.07,.92);
    ln([[[0,-SL],[10,-SL]],[[0,SL],[10,SL]],[[5,-SL],[5,SL]]],.06,.7);
    const nm=new THREE.MeshStandardMaterial({color:0x111318,alphaMap:tNet,transparent:true,alphaTest:.35,side:THREE.DoubleSide,roughness:.8});
    tNet.wrapS=tNet.wrapT=THREE.RepeatWrapping;tNet.repeat.set(10.7/.05,.84/.05);
    const net=new THREE.Mesh(new THREE.PlaneGeometry(10.7,.84),nm);net.position.set(5,.46,0);net.castShadow=true;W.add(net);
    const band=box(10.7,.07,.05,new THREE.MeshStandardMaterial({color:COL.o,emissive:COL.o,emissiveIntensity:.5,roughness:.5}));
    band.position.set(5,.9,0);W.add(band);
    const nf=new THREE.Mesh(ribbonGeo([[[-.35,0],[10.35,0]]],.1),flatM(COL.o,.9));nf.position.y=.013;W.add(nf);
    for(const x of [-.3,10.3]){const p=box(.09,.95,.09,frameM);p.position.set(x,.475,0);W.add(p);}
    const glassM=o=>new THREE.MeshPhysicalMaterial({color:0xd6ecff,transparent:true,opacity:o,roughness:.04,
      envMapIntensity:1.5,side:THREE.DoubleSide,depthWrite:false,clearcoat:1});
    const pane=(w,h,x,y,z,ry,m,fr)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);p.position.set(x,y,z);p.rotation.y=ry;p.renderOrder=2;W.add(p);
      if(fr){const f=box(ry?.05:w,.05,ry?w:.05,frameM);f.position.set(x,y+h/2,z);W.add(f);}};
    /* Die Wand zur Kamera ist fast unsichtbar und traegt kein Gitter:
       sie stuende sonst im Kino zwischen Zuschauer und Spiel. */
    for(const s of [-1,1]){const gm=glassM(s<0?.07:.04),far=s<0;
      pane(10,3,5,1.5,s*10,0,gm,far);
      for(const x of [0,10]){pane(2,3,x,1.5,s*9,Math.PI/2,gm,far);pane(2,2,x,1,s*7,Math.PI/2,gm,far);}
    }
    for(const x of [0,10]) for(const z of [-10,-8,-6]){const h=Math.abs(z)<7?2:3;const p=box(.06,h,.06,frameM);p.position.set(x,h/2,z);W.add(p);}
  }

  /* Zielzone: oranges Feld am Boden, blendet je Schritt ein */
  const zoneM=flatM(COL.o,0);
  const zone=new THREE.Mesh(new THREE.PlaneGeometry(1,1),zoneM);zone.rotation.x=-Math.PI/2;zone.position.y=.016;zone.renderOrder=4;W.add(zone);
  let zoneA=0,zoneT=0;

  /* ── Spieler: Glaskugel, darin ein Karton-Scheibchen mit dem Zeichen
        des Typs (die Sprache der Poster), darueber der Name ── */
  const sphG=new THREE.SphereGeometry(1,40,28),RAD=.8;
  const cache=new Map();
  const badge=id=>{const k='b'+id;if(!cache.has(k))cache.set(k,tx(canvasTex(128,128,g=>{
    g.fillStyle=CARTON;g.beginPath();g.arc(64,64,60,0,7);g.fill();symbol(g,id,styles[id]?.accent||'#111');})));return cache.get(k);};
  const nameT=(txt,me)=>{const k='n'+txt+me;if(!cache.has(k))cache.set(k,tx(canvasTex(512,128,g=>{
    g.font=`italic 700 76px ${serif}`;g.textAlign='center';g.textBaseline='middle';
    g.shadowColor='rgba(0,0,0,.85)';g.shadowBlur=14;g.shadowOffsetY=3;g.fillStyle=me?'#ff9a4d':'#fff';g.fillText(txt,256,66);})));return cache.get(k);};
  const orbs=[0,1,2,3].map(i=>{
    const g=new THREE.Group(),c=i<2?COL.o:COL.blue;
    const glass=new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.22,roughness:.06,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:1.8,depthWrite:false});
    const s=new THREE.Mesh(sphG,glass);s.scale.setScalar(RAD);s.castShadow=true;g.add(s);
    const rim=rimMat();rim.uniforms.col.value.copy(c);const rm=new THREE.Mesh(sphG,rim);rm.scale.setScalar(RAD*1.003);g.add(rm);
    const bd=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false}));bd.scale.setScalar(RAD*1.3);bd.renderOrder=6;g.add(bd);
    const nm=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false,depthTest:false}));nm.scale.set(4,1,1);nm.position.y=RAD+.75;nm.renderOrder=8;g.add(nm);
    const ring=new THREE.Mesh(new THREE.RingGeometry(RAD*1.12,RAD*1.22,64),flatM(c,.85));ring.rotation.x=-Math.PI/2;ring.position.y=-RAD+.02;g.add(ring);
    g.position.set(HOME[i][0],RAD,HOME[i][1]);W.add(g);
    return{g,bd,nm,ring,pos:[...HOME[i]],id:null};
  });

  /* ── Ball mit Schattenfleck und Schweif ── */
  const ballG=new THREE.SphereGeometry(1,24,18),BR=.2;
  const ballM=new THREE.MeshStandardMaterial({color:COL.ball,emissive:COL.ball,emissiveIntensity:.45,roughness:.5,transparent:true,opacity:0});
  const ball=new THREE.Mesh(ballG,ballM);ball.scale.setScalar(BR);ball.castShadow=true;W.add(ball);
  const blobM=new THREE.MeshBasicMaterial({map:tBlob,transparent:true,depthWrite:false,opacity:0});
  const blob=new THREE.Mesh(new THREE.PlaneGeometry(1,1),blobM);blob.rotation.x=-Math.PI/2;W.add(blob);
  const TR=7,trail=Array.from({length:TR},(_,i)=>{const m=new THREE.Mesh(ballG,new THREE.MeshBasicMaterial({color:COL.ball,transparent:true,depthWrite:false,toneMapped:false,opacity:0}));
    m.scale.setScalar(BR*(1-i/(TR+2)));W.add(m);return m;});
  const hist=[];let bp=[5,1,0],ballA=0;

  /* ── Ablauf ── */
  let scene=null,segs=[],tl=[],total=0,t=0,paused=false,stepNow=-1,doneSent=false;
  const INTRO=1.1,HOLD=.55,OUT=1.9;
  /* Ballweg eines Schritts: Zeitanteile nach Streckenlaenge */
  const build=sc=>{
    tl=[];let at=INTRO,from=sc.start.b,pp=sc.start.p;
    sc.steps.forEach(s=>{
      let prev=from;const legs=s.b.map(([x,y,z,h])=>{const to=[x,y,z];
        const L=Math.hypot(x-prev[0],z-prev[2],y-prev[1])+h*1.2+.6;const l={a:prev,b:to,h,L};prev=to;return l;});
      const sum=legs.reduce((n,l)=>n+l.L,0);let acc=0;
      legs.forEach(l=>{l.u0=acc/sum;acc+=l.L;l.u1=acc/sum;});
      tl.push({t0:at,d:s.d,legs,p0:pp,p1:s.p,zone:s.zone,c:s.c});
      at+=s.d+HOLD;from=prev;pp=s.p;
    });
    total=at+OUT;
  };
  const emit=()=>onState({playing:!!scene,paused,step:Math.max(0,stepNow),count:scene?scene.steps.length:0,
    caption:scene&&stepNow>=0?scene.steps[stepNow].c:''});

  /* ── Kamera ── */
  const VIEW={idle:{pol:.8,top:.34,h:.3},kino:{pol:1.2,top:.1,h:.64}};
  const cs={...VIEW.idle,dist:40,ready:false};
  let mode='idle',band=null,time=0;
  const tgt=new THREE.Vector3(0,.4,0);
  /* Gerahmt wird das Feld samt Rueckwand. Im Kino duerfen die vorderen
     Ecken aus dem Bild laufen — sonst diktiert die Grundlinie vor der
     Kamera den Abstand, und das Spiel dahinter wird klein. */
  const far=[],near=[[],[]];
  for(const x of [-5.6,5.6]){far.push(new THREE.Vector3(x,0,-10.4),new THREE.Vector3(x,3.4,-10));
    near[0].push(new THREE.Vector3(x,0,10.4));near[1].push(new THREE.Vector3(x*.72,0,9.4));}
  const v3=new THREE.Vector3();
  const place=(az,d)=>{cam.position.set(tgt.x+d*Math.sin(cs.pol)*Math.sin(az),tgt.y+d*Math.cos(cs.pol),tgt.z+d*Math.sin(cs.pol)*Math.cos(az));cam.lookAt(tgt);cam.updateMatrixWorld();};
  let cw=1,ch=1;
  const setCam=dt=>{
    const goal=band&&mode==='idle'?{...VIEW.idle,top:band[0],h:band[1]}:VIEW[mode];
    const k=cs.ready&&!reduced?1-Math.exp(-dt*3.2):1;
    const pts=[...far,...near[mode==='kino'?1:0]];
    for(const n of ['pol','top','h']) cs[n]=lerp(cs[n],goal[n],k);
    /* erst im Band rahmen (Seitenverhaeltnis des Bands), dann auf den
       ganzen Canvas aufziehen */
    const bh=Math.max(40,cs.h*ch);
    cam.clearViewOffset();cam.aspect=cw/bh;cam.updateProjectionMatrix();
    let a=6,b=220;
    for(let i=0;i<26;i++){const m=(a+b)/2;place(0,m);
      pts.every(p=>{v3.copy(p).project(cam);return Math.abs(v3.x)<.94&&Math.abs(v3.y)<.94&&v3.z<1;})?b=m:a=m;}
    cs.dist=cs.ready?lerp(cs.dist,b,k):b;cs.ready=true;
    cam.setViewOffset(cw,bh,0,-cs.top*ch,cw,ch);
    place(reduced?0:Math.sin(time/16*Math.PI*2)*(mode==='kino'?.05:.03),cs.dist);
  };
  const resize=()=>{cw=canvas.clientWidth||1;ch=canvas.clientHeight||1;R.setSize(cw,ch,false);cs.ready=false;};
  const ro=new ResizeObserver(()=>{resize();render();});ro.observe(canvas);

  const moveOrbs=dt=>{
    orbs.forEach((o,i)=>{
      let goal=HOME[i];
      if(scene){const r=scene.seat.indexOf(i);
        if(t<INTRO) goal=scene.start.p[r];
        else{const st=tl[Math.min(tl.length-1,Math.max(0,stepNow))];const u=ez(cl((t-st.t0)/st.d));
          goal=[lerp(st.p0[r][0],st.p1[r][0],u),lerp(st.p0[r][1],st.p1[r][1],u)];}}
      const k=reduced?1:scene&&t>=INTRO?.5:1-Math.pow(.02,dt);
      o.pos[0]=lerp(o.pos[0],goal[0],k);o.pos[1]=lerp(o.pos[1],goal[1],k);
      o.g.position.set(o.pos[0],RAD+(reduced?0:Math.sin(time*2.2+i*1.7)*.03),o.pos[1]);
    });
  };
  const ballAt=()=>{
    if(!scene) return null;
    if(t<INTRO) return scene.start.b;
    const st=tl[Math.min(tl.length-1,Math.max(0,stepNow))];
    const u=reduced?1:cl((t-st.t0)/st.d);
    const l=st.legs.find(l=>u<=l.u1)||st.legs[st.legs.length-1];
    const q=cl((u-l.u0)/Math.max(1e-4,l.u1-l.u0));
    return[lerp(l.a[0],l.b[0],q),lerp(l.a[1],l.b[1],q)+4*l.h*q*(1-q),lerp(l.a[2],l.b[2],q)];
  };
  function tick(dt){
    time+=dt;
    if(scene&&!paused){
      t+=dt;
      let s=-1;for(let i=0;i<tl.length;i++) if(t>=tl[i].t0) s=i;
      if(s!==stepNow){stepNow=s;const z=tl[s]?.zone;
        if(z){zone.scale.set(z[2],z[3],1);zone.position.set(z[0]+z[2]/2,.016,z[1]+z[3]/2);zoneT=.42;}else zoneT=0;
        emit();}
      onProgress(cl((t-INTRO)/(total-INTRO-OUT*.6)));
      if(t>=total&&!doneSent){doneSent=true;const sc=scene;scene=null;stepNow=-1;zoneT=0;emit();onState({done:sc.id});}
    }
    zoneA=lerp(zoneA,scene?zoneT:0,reduced?1:.08);zoneM.opacity=zoneA;zone.visible=zoneA>.01;
    moveOrbs(dt);
    const b=ballAt();
    ballA=lerp(ballA,b&&t>INTRO*.5?1:0,reduced?1:.12);
    if(b){bp=b;}
    ball.position.set(bp[0],bp[1]+BR,bp[2]);ballM.opacity=ballA;ball.visible=ballA>.02;
    blob.position.set(bp[0],.02,bp[2]);const bs=.6*(1+bp[1]*.22);blob.scale.set(bs,bs,1);blobM.opacity=.5*Math.max(.25,1-bp[1]/3)*ballA;
    if(!paused){hist.unshift([...bp]);hist.length=Math.min(hist.length,TR*2);}
    trail.forEach((m,i)=>{const q=hist[(i+1)*2-1];m.visible=!!q&&ballA>.5&&!reduced;if(!q)return;
      m.position.set(q[0],q[1]+BR,q[2]);m.material.opacity=.34*(1-i/TR)*ballA;});
  }
  function render(dt=0){setCam(dt);R.render(S,cam);}

  let raf=0,last=0,alive=true,iv=0;
  const frame=now=>{
    const dt=Math.min(.05,(now-(last||now))/1000);last=now;
    if(!document.hidden){tick(dt);render(dt);}
    raf=requestAnimationFrame(frame);
  };
  resize();tick(0);render();
  if(reduced){let l=performance.now();iv=setInterval(()=>{const n=performance.now();if(!document.hidden){tick((n-l)/1000);render(1);}l=n;},250);}
  else raf=requestAnimationFrame(frame);

  return{
    /* vier Stil-ids nach Platz: [unten links, unten rechts, oben links, oben rechts] */
    setTeams(ids,names={}){
      orbs.forEach((o,i)=>{if(o.id===ids[i])return;o.id=ids[i];
        o.bd.material.map=badge(ids[i]);o.bd.material.needsUpdate=true;
        o.nm.material.map=nameT(names[ids[i]]||ids[i],i<2);o.nm.material.needsUpdate=true;});
    },
    play(sc){build(sc);scene=sc;t=0;stepNow=-1;paused=false;doneSent=false;hist.length=0;onProgress(0);emit();},
    stop(){scene=null;stepNow=-1;paused=false;zoneT=0;emit();},
    pause(on){paused=on;emit();},
    setMode(m){mode=m;},
    /* Band der Uebersicht in Anteilen der Canvas-Hoehe: [oben, hoehe] */
    setBand(b){band=b;},
    dispose(){
      alive=false;cancelAnimationFrame(raf);clearInterval(iv);ro.disconnect();
      S.traverse(o=>{o.geometry?.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m?.dispose?.());});
      texs.forEach(x=>x.dispose());envRT.dispose();pmrem.dispose();
      R.dispose();R.forceContextLoss?.();
    },
  };
}
