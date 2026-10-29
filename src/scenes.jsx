/* ═══════════════════════════════════════════════════════════════
   BIBEL-SZENEN — die bewegten Grafiken in Regelwerk und Journey.

   Ein kleines Zeitleisten-System statt dreissig CSS-Keyframes:
   jede Szene ist eine reine Funktion der Zeit t (Sekunden). Was wo
   steht, wird je Bild ausgerechnet — Positionen, Flugbahnen, Deckkraft.
   Dadurch laesst sich eine Szene wie in einem Motion-Studio
   choreografieren: Einsaetze, Kurven, Ueberlappungen, alles an einer
   Stelle und in Sekunden lesbar.

   - useSceneClock spielt nur, solange die Szene im Bild ist
     (IntersectionObserver), und haelt sonst an. Bei
     prefers-reduced-motion steht ein Standbild (still).
   - Der Court ist massstabsgetreu: 10 x 20 m, Netz 10 m, Aufschlag-
     linien 6,95 m vom Netz. 1 m = K Einheiten.
   - Der Ball fliegt auf einer Parabel ueber dem Boden: sein Schatten
     liegt auf dem Boden, der Ball selbst um die Hoehe versetzt —
     daran liest man Hoehe, ohne eine Seitenansicht zu brauchen.

   Farben nur ueber Tokens (T.*). Der Ball hat ein eigenes (--ball).
═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import { T } from "./theme.js";
import { getAssetBase } from "./utils.js";

/* ── Zeit ─────────────────────────────────────────────────────── */
export const ez={
  lin:u=>u,
  io:u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2,
  out:u=>1-Math.pow(1-u,4),
  in:u=>u*u*u,
  back:u=>{const c=1.5;return 1+(c+1)*Math.pow(u-1,3)+c*Math.pow(u-1,2);},
};
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
/* 0..1 zwischen den Zeitpunkten a und b, mit Kurve */
export const seg=(t,a,b,e=ez.io)=>e(cl((t-a)/(b-a)));
export const lerp=(a,b,u)=>a+(b-a)*u;
/* ein — halten — aus: Deckkraft eines Einsatzes */
const win=(t,a,b,f=.3)=>Math.min(seg(t,a,a+f,ez.out),1-seg(t,b-f,b,ez.in));

export function useSceneClock(dur,{loop=true,still}={}){
  const ref=useRef(null);
  const[t,setT]=useState(0);
  useEffect(()=>{
    const el=ref.current; if(!el) return;
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
      setT(still??(loop?0:dur)); return;
    }
    let raf=0,base=0,t0=0;
    const tick=now=>{
      const e=base+(now-t0)/1000;
      if(!loop&&e>=dur){setT(dur);base=dur;raf=0;return;}
      setT(loop?e%dur:e);
      raf=requestAnimationFrame(tick);
    };
    const play=()=>{if(raf||(!loop&&base>=dur))return;t0=performance.now();raf=requestAnimationFrame(tick);};
    const stop=()=>{if(!raf)return;cancelAnimationFrame(raf);raf=0;base+=(performance.now()-t0)/1000;};
    const io=new IntersectionObserver(([en])=>en.isIntersecting?play():stop(),{threshold:.2});
    io.observe(el);
    return()=>{io.disconnect();cancelAnimationFrame(raf);};
  },[dur,loop,still]);
  return[ref,t];
}

/* Sichtbar geworden? — fuer einmalige Auftritte (Strichzeichnungen). */
export function useInView(){
  const ref=useRef(null);
  const[seen,setSeen]=useState(false);
  useEffect(()=>{
    const el=ref.current; if(!el||seen) return;
    if(!window.IntersectionObserver){setSeen(true);return;}
    const io=new IntersectionObserver(([en])=>{if(en.isIntersecting){setSeen(true);io.disconnect();}},{threshold:.3});
    io.observe(el);
    return()=>io.disconnect();
  },[seen]);
  return[ref,seen];
}

/* ── Bausteine ───────────────────────────────────────────────── */
const K=9;                       // 1 m in SVG-Einheiten
const SL=10-6.95;                // Aufschlaglinie, von der Rueckwand gemessen
function Stage({vb,children,label,max=340}){
  return(
    <svg viewBox={vb} role="img" aria-label={label}
      style={{width:'100%',maxWidth:max,height:'auto',display:'block',overflow:'visible'}}>
      {children}
    </svg>
  );
}
/* Linie, die sich zeichnet (u 0..1) */
function Draw({d,u=1,stroke=T.t1,w=1,op=1,dash}){
  if(u<=0) return null;
  return <path d={d} fill="none" stroke={stroke} strokeWidth={w} opacity={op}
    strokeLinecap="round" pathLength="1"
    strokeDasharray={dash?undefined:'1'} strokeDashoffset={dash?undefined:1-u}/>;
}

/* Der Court von oben, im Hochformat. x 0..10 (links→rechts),
   y 0 (ferne Rueckwand) .. 20 (nahe). draw 0..1 laesst ihn entstehen. */
export function Court({ox=0,oy=0,k=K,draw=1,walls=1,mesh=1,glassHi=null,dim=1,half=false}){
  const X=x=>ox+x*k, Y=y=>oy+y*k;
  const y0=half?10:0;
  const W=10*k, H=(20-y0)*k;
  const o=seg(draw,0,.45), n=seg(draw,.3,.65), s=seg(draw,.5,.85), c=seg(draw,.68,1);
  const g=2.4;                   // Wandabstand nach aussen
  const glass=[                  // Glasstuecke: Rueckwaende + 4 m an jedem Ende der Seiten
    ...(half?[]:[`M${X(0)-g} ${Y(0)-g}H${X(10)+g}`]),
    `M${X(0)-g} ${Y(20)+g}H${X(10)+g}`,
    ...(half?[]:[`M${X(0)-g} ${Y(0)-g}V${Y(4)}`,`M${X(10)+g} ${Y(0)-g}V${Y(4)}`]),
    `M${X(0)-g} ${Y(16)}V${Y(20)+g}`,`M${X(10)+g} ${Y(16)}V${Y(20)+g}`,
  ];
  return(
    <g opacity={dim}>
      <rect x={X(0)} y={Y(y0)} width={W} height={H} rx="1.5"
        fill={T.t1} opacity={.035*o}/>
      {/* Gitter: feine Schraffur zwischen den Glasstuecken */}
      {mesh>0&&[0,10].map(sx=>(
        <g key={sx} opacity={.5*mesh}>
          {Array.from({length:Math.round((16-Math.max(4,y0))/0.8)}).map((_,i)=>{
            const yy=Y(Math.max(4,y0)+i*0.8);
            const xx=sx?X(10)+g:X(0)-g;
            return <line key={i} x1={xx-1.4} y1={yy} x2={xx+1.4} y2={yy+2.6}
              stroke={T.t3} strokeWidth=".5"/>;
          })}
        </g>
      ))}
      {walls>0&&glass.map((d,i)=>(
        <Draw key={i} d={d} u={seg(walls,i*.08,.5+i*.08)} stroke={glassHi===i?T.o:T.t1}
          w={glassHi===i?2.6:1.8} op={glassHi===i?1:.42}/>
      ))}
      <Draw d={`M${X(0)} ${Y(y0)}H${X(10)}V${Y(20)}H${X(0)}Z`} u={o} w={1}/>
      <Draw d={`M${X(-.35)} ${Y(10)}H${X(10.35)}`} u={n} stroke={T.o} w={1.6}/>
      {!half&&<Draw d={`M${X(0)} ${Y(SL)}H${X(10)}`} u={s} w={.8} op={.6}/>}
      <Draw d={`M${X(0)} ${Y(20-SL)}H${X(10)}`} u={s} w={.8} op={.6}/>
      <Draw d={`M${X(5)} ${Y(half?10:SL)}V${Y(20-SL)}`} u={c} w={.8} op={.6}/>
    </g>
  );
}

/* Spieler als Glaskugel — wie GlassOrb in der App, nur in SVG */
function Orb({x,y,label,team='a',r=6.2,op=1,ring}){
  const col=team==='a'?T.o:team==='b'?T.blue:T.t3;
  return(
    <g opacity={op}>
      <ellipse cx={x} cy={y+r*.9} rx={r*.9} ry={r*.32} fill="#000" opacity=".28"/>
      <circle cx={x} cy={y} r={r} fill={T.t1} fillOpacity=".08" stroke={col} strokeWidth="1.2"/>
      {ring&&<circle cx={x} cy={y} r={r+2.6} fill="none" stroke={col} strokeWidth=".8" opacity={ring}/>}
      {label!=null&&<text x={x} y={y+.4} textAnchor="middle" dominantBaseline="middle"
        fontSize={r*1.15} fontWeight="600" fill={T.t1}
        style={{fontFamily:T.fontSans,letterSpacing:0}}>{label}</text>}
    </g>
  );
}

/* Ball: Schatten am Boden, Ball um die Hoehe z (m) angehoben.
   trail: fruehere Positionen als feiner Schweif. */
function Ball({p,trail=[],k=K,op=1}){
  if(!p) return null;
  const lift=z=>z*k*.55;
  return(
    <g opacity={op}>
      {trail.map((q,i)=>q&&(
        <circle key={i} cx={q.x} cy={q.y-lift(q.z)} r={2.3*(1-i/(trail.length+1))}
          fill={T.ball} opacity={.32*(1-i/trail.length)}/>
      ))}
      <ellipse cx={p.x} cy={p.y} rx={2.6} ry={1.1} fill="#000"
        opacity={.4*Math.max(.25,1-p.z/2.5)}/>
      <circle cx={p.x} cy={p.y-lift(p.z)} r={2.6+p.z*.25} fill={T.ball}/>
    </g>
  );
}

/* Ausbreitender Ring: Aufsprung, Treffer */
function Ripple({x,y,u,col=T.ball}){
  if(u<=0||u>=1) return null;
  return <ellipse cx={x} cy={y} rx={2+u*9} ry={(2+u*9)*.45} fill="none"
    stroke={col} strokeWidth={1.2*(1-u)} opacity={1-u}/>;
}

/* Beschriftung, die aufsteigt und einblendet */
function Tag({x,y,u,children,anchor='middle',col=T.t1,size=7,weight=600,serif}){
  if(u<=0) return null;
  return <text x={x} y={y+(1-u)*4} textAnchor={anchor} fontSize={size} fontWeight={weight}
    fill={col} opacity={u}
    style={{fontFamily:serif?T.fontSerif:T.fontSans,letterSpacing:serif?0:'-0.02em',
      fontStyle:serif?'italic':'normal'}}>{children}</text>;
}
/* Ressort-Zeile in Centauri */
function Kicker({x,y,u=1,children,anchor='middle',col=T.t3}){
  if(u<=0) return null;
  return <text x={x} y={y} textAnchor={anchor} fontSize="5.6" fill={col} opacity={u}
    style={{fontFamily:T.fontDisplay,letterSpacing:1.6}}>{children}</text>;
}

/* Flugbahn: Boden von a nach b (m), Scheitelhoehe h, Start-/Endhoehe */
const fly=(a,b,u,h,z0=0,z1=0)=>({
  x:lerp(a[0],b[0],u),y:lerp(a[1],b[1],u),
  z:lerp(z0,z1,u)+4*h*u*(1-u),
});
/* m → SVG */
const at=(ox,oy,k=K)=>q=>q&&({x:ox+q.x*k,y:oy+q.y*k,z:q.z});

/* Schritte unter einer Szene: der aktuelle hell, erledigte mit Haken */
function Steps({x,y,w,items,active,done=[],k}){
  const n=items.length, cw=w/n;
  return(
    <g>
      {items.map((s,i)=>{
        const on=i===active, ok=done.includes(i);
        return(
          <g key={i} opacity={on?1:ok?.75:.38}>
            <rect x={x+i*cw+1} y={y} width={cw-2} height="1.6" rx=".8"
              fill={on||ok?T.o:T.t3}/>
            <text x={x+i*cw+cw/2} y={y+9} textAnchor="middle" fontSize="5.8" fontWeight="600"
              fill={T.t1} style={{fontFamily:T.fontSans,letterSpacing:'-0.02em'}}>{s}</text>
          </g>
        );
      })}
    </g>
  );
}

/* ═══ REGELWERK ═══════════════════════════════════════════════ */

/* 1 · Court & Ausrüstung — der Platz baut sich auf, dann die Masse,
   dann die Waende. Einmal, danach steht er. */
export function SceneCourt(){
  const[ref,t]=useSceneClock(5.6,{loop:false});
  const ox=34,oy=18;
  const X=x=>ox+x*K, Y=y=>oy+y*K;
  const dm=seg(t,1.7,2.4,ez.out), dl=seg(t,2.2,2.9,ez.out), sv=seg(t,2.7,3.4,ez.out);
  const wl=seg(t,3.2,4.6,ez.io), lb=seg(t,4.3,5.0,ez.out);
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 222" label="Padel-Court von oben, 20 mal 10 Meter">
        <Court ox={ox} oy={oy} draw={seg(t,0,1.9,ez.lin)} walls={wl} mesh={wl}/>
        {/* Masse */}
        <Draw d={`M${X(0)} ${Y(0)-9}H${X(10)}`} u={dm} w={.6} op={.7}/>
        <Tag x={X(5)} y={Y(0)-11.5} u={dm} size={6.4}>10 m</Tag>
        <Draw d={`M${X(0)-12} ${Y(0)}V${Y(20)}`} u={dl} w={.6} op={.7}/>
        <g transform={`rotate(-90 ${X(0)-14.5} ${Y(10)})`}>
          <Tag x={X(0)-14.5} y={Y(10)} u={dl} size={6.4}>20 m</Tag>
        </g>
        {/* Aufschlaglinie: 6,95 m vom Netz */}
        <Draw d={`M${X(10)+8} ${Y(10)}V${Y(20-SL)}`} u={sv} stroke={T.o} w={.7}/>
        <Tag x={X(10)+11} y={Y(13.6)} u={sv} anchor="start" size={6} col={T.o}>6,95 m</Tag>
        <Tag x={X(5)} y={Y(10)-2.4} u={sv} size={5.2} col={T.o}>Netz · 88 cm</Tag>
        <Kicker x={X(5)} y={Y(20)+15} u={lb}>Glas · Gitter · Glas</Kicker>
      </Stage>
    </div>
  );
}

/* 2 · Aufschlag — Aufspringen, unter Hüfthöhe, diagonal ins Feld,
   danach ans Glas. Jeder zweite Durchgang von der anderen Seite. */
export function SceneServe({targets=false}){
  const D=6.2;
  const[ref,tt]=useSceneClock(D*(targets?3:2),{still:1.6});
  const n=Math.floor(tt/D), t=tt%D;
  const side=targets?1:(n%2?-1:1);               // 1 = von rechts
  const m=x=>side>0?x:10-x;
  const ox=34,oy=14, P=at(ox,oy);
  // Ziel: diagonales Feld; im Taktik-Modus T / Körper / Außen
  const tg=targets?[[4.6,5.6],[2.6,4.2],[.7,5.4]][n%3]:[2.6,5.4];
  const srv=[m(7.2),17.6], tgt=[m(tg[0]),tg[1]];
  const glassPt=[m(lerp(tg[0],tg[0]-.9,1)),0];
  let b=null;
  if(t<.5) b={x:srv[0]+.15*side,y:srv[1]-.1,z:lerp(1,0,ez.in(t/.5))};
  else if(t<.95) b={x:srv[0]+.15*side,y:srv[1]-.1,z:.7*Math.sin(Math.PI*(t-.5)/.9)};
  else if(t<2.05) b=fly([srv[0],srv[1]-.3],tgt,(t-.95)/1.1,1.35,.65,0);
  else if(t<2.85) b=fly(tgt,glassPt,(t-2.05)/.8,.55,0,.9);
  else if(t<3.4) b=fly(glassPt,[glassPt[0]+.4*side,1.3],(t-2.85)/.55,.25,.9,0);
  const fade=1-seg(t,3.6,4.1);
  const pos=q=>q&&P({x:q.x,y:q.y,z:q.z});
  const trail=t>.95&&t<3.4?[.03,.06,.09,.12].map(d=>{
    const tp=t-d; if(tp<.95) return null;
    const q=tp<2.05?fly([srv[0],srv[1]-.3],tgt,(tp-.95)/1.1,1.35,.65,0)
      :tp<2.85?fly(tgt,glassPt,(tp-2.05)/.8,.55,0,.9):fly(glassPt,[glassPt[0]+.4*side,1.3],(tp-2.85)/.55,.25,.9,0);
    return pos(q);
  }):[];
  const box={x:ox+(side>0?0:5)*K,y:oy+SL*K,w:5*K,h:6.95*K};
  const boxU=win(t,.7,4.2,.4);
  const bounce=seg(t,2.05,2.6,ez.out), glassF=win(t,2.85,3.6,.15);
  const step=t<.95?0:t<1.6?1:t<2.4?2:t<4.4?3:4;
  const names=targets?['T-Linie','Körper','Außen']:null;
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 236" label="Aufschlag diagonal ins Aufschlagfeld">
        <Court ox={ox} oy={oy} glassHi={glassF>.3?0:null}/>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={T.o} opacity={.13*boxU}/>
        {targets&&<circle cx={ox+tgt[0]*K} cy={oy+tgt[1]*K} r={7} fill="none" stroke={T.o}
          strokeWidth="1" strokeDasharray="2 2" opacity={boxU}/>}
        <Orb x={ox+m(2.5)*K} y={oy+12.6*K} label="2" team="a" op={.8}/>
        <Orb x={ox+srv[0]*K} y={oy+(srv[1]+.6)*K} label="1" team="a"/>
        <Orb x={ox+m(2.6)*K} y={oy+1.4*K} team="b" op={.85}/>
        <Orb x={ox+m(7.4)*K} y={oy+6.9*K} team="b" op={.85}/>
        <Ripple x={ox+tgt[0]*K} y={oy+tgt[1]*K} u={bounce}/>
        <Ball p={pos(b)} trail={trail} op={fade}/>
        {targets
          ?<Tag x={80} y={212} u={win(tt%D,.4,5.6,.4)} size={10} serif>{names[n%3]}</Tag>
          :<Tag x={80} y={207} u={win(t,.2,5.8,.4)} size={6.2} col={T.t2}>
            {side>0?'Punkt 1 · von rechts':'Punkt 2 · von links'}</Tag>}
        {!targets&&<Steps x={8} y={216} w={144} active={step>3?-1:step} done={[0,1,2,3].filter(i=>i<step)}
          items={['aufspringen','unter Hüfte','diagonal','Glas ok']}/>}
      </Stage>
    </div>
  );
}

/* 3 · Wände — erst Boden, dann Glas (im Spiel); dann direkt ans Glas
   der Gegenseite (Punkt verloren). */
export function SceneWalls(){
  const[ref,t]=useSceneClock(9,{still:2});
  const ox=34,oy=14,P=at(ox,oy);
  const pA0=[3.6,16.6], pA1=[3.0,18.4];
  const a=seg(t,.5,1.9,ez.io);
  const pa=[lerp(pA0[0],pA1[0],a),lerp(pA0[1],pA1[1],a)];
  const path=tp=>{
    if(tp<0) return null;
    if(tp<1.3) return fly([6.6,2.6],[3.4,16.2],tp/1.3,1.9,.8,0);
    if(tp<1.8) return fly([3.4,16.2],[2.9,20],(tp-1.3)/.5,.55,0,1);
    if(tp<2.35) return fly([2.9,20],[3.0,18.6],(tp-1.8)/.55,.2,1,.7);
    if(tp<3.5) return fly([3.0,18.6],[6.4,4.6],(tp-2.35)/1.15,1.7,.7,0);
    if(tp<4.2) return fly([6.4,4.6],[6.6,2.8],(tp-3.5)/.7,.4,0,.6);
    if(tp<4.9) return null;
    if(tp<5.55) return fly([6.4,12.3],[4.6,0],(tp-4.9)/.65,.35,1.1,1.3);
    if(tp<6.3) return fly([4.6,0],[4.8,1.6],(tp-5.55)/.75,.4,1.3,0);
    return null;
  };
  const b=path(t);
  const trail=[.03,.06,.09,.12].map(d=>P(path(t-d)));
  const pb=[lerp(6.6,6.5,seg(t,4.4,4.9)),lerp(2.8,2.6,0)];
  const glassOk=win(t,1.75,2.6,.12), glassBad=win(t,5.5,6.4,.12);
  const ok=win(t,1.8,4.3,.35), bad=win(t,5.6,8.6,.35);
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 236" label="Ballwechsel mit Wandabpraller">
        <Court ox={ox} oy={oy} glassHi={glassOk>.3?1:glassBad>.3?0:null}/>
        <Ripple x={ox+3.4*K} y={oy+16.2*K} u={seg(t,1.3,1.8,ez.out)}/>
        <Ripple x={ox+6.4*K} y={oy+4.6*K} u={seg(t,3.5,4,ez.out)}/>
        {glassBad>0&&<g opacity={glassBad}>
          <path d={`M${ox+4.6*K-4} ${oy-6}l8 8m0 -8l-8 8`} stroke={T.r} strokeWidth="1.8" strokeLinecap="round"/>
        </g>}
        <Orb x={ox+pb[0]*K} y={oy+pb[1]*K} team="b"/>
        <Orb x={ox+3.4*K} y={oy+7.4*K} team="b" op={.75}/>
        <Orb x={ox+pa[0]*K} y={oy+pa[1]*K} label="1" team="a"/>
        <Orb x={ox+lerp(6.8,6.4,seg(t,4.2,4.8))*K} y={oy+lerp(13.6,12.8,seg(t,4.2,4.8))*K} label="2" team="a"/>
        <Ball p={P(b)} trail={trail}/>
        <Tag x={80} y={212} u={ok} size={9} serif>Boden, dann Glas — weiter.</Tag>
        <Tag x={80} y={212} u={bad} size={9} serif col={T.r}>Direkt ans Glas — Punkt weg.</Tag>
        <Kicker x={80} y={226} u={Math.max(ok,bad)}>{ok>bad?'Im Spiel':'Fehler'}</Kicker>
      </Stage>
    </div>
  );
}

/* 4 · Zählweise — eine Anzeigetafel zählt ein Spiel durch: Einstand,
   Vorteil, Spiel. Dann dasselbe mit Golden Point. */
const SCORE_SEQ=[
  ['0','0',''],['15','0',''],['15','15',''],['30','15',''],['30','30',''],
  ['40','30',''],['40','40','Einstand'],['AD','40','Vorteil'],['40','40','Einstand'],
  ['AD','40','Vorteil'],['✓','','Spiel'],
  ['40','40','Golden Point'],['','✓','Spiel'],
];
export function SceneScore(){
  const st=.95;
  const[ref,t]=useSceneClock(SCORE_SEQ.length*st+1.2,{still:6*st+.5});
  const i=Math.min(SCORE_SEQ.length-1,Math.floor(t/st)), u=(t%st)/st;
  const cur=SCORE_SEQ[i], prev=SCORE_SEQ[Math.max(0,i-1)];
  const inU=ez.out(cl(u/.45));
  const gp=i>=11;
  const cell=(col,row)=>{
    const a=prev[col], b=cur[col], changed=a!==b&&i>0;
    const y=row?96:56;
    const fs=b==='✓'?30:34;
    return(
      <g>
        {changed&&<text x={150} y={y-10*inU} textAnchor="end" fontSize={34} fontWeight="300"
          fill={T.t1} opacity={1-inU} style={{fontFamily:T.fontSans,letterSpacing:'-0.04em'}}>{a}</text>}
        <text x={150} y={y+(changed?10*(1-inU):0)} textAnchor="end" fontSize={fs} fontWeight="300"
          fill={b==='✓'||b==='AD'?T.o:T.t1} opacity={changed?inU:1}
          style={{fontFamily:T.fontSans,letterSpacing:'-0.04em',fontVariantNumeric:'tabular-nums'}}>{b}</text>
      </g>
    );
  };
  const word=cur[2], wordPrev=prev[2], wchg=word!==wordPrev;
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 170 152" label="Zählweise: 15, 30, 40, Einstand, Vorteil, Spiel">
        <Kicker x={12} y={14} anchor="start" col={gp?T.o:T.t3}>{gp?'Mit Golden Point':'Mit Vorteil'}</Kicker>
        {[0,1].map(r=>(
          <g key={r}>
            <rect x={10} y={r?70:30} width={150} height={34} rx={9} fill={T.t1} opacity=".05"
              stroke={T.t1} strokeOpacity=".16"/>
            <Orb x={30} y={r?87:47} label={r?'B':'A'} team={r?'b':'a'} r={8}/>
            <text x={46} y={r?91:51} fontSize="8" fontWeight="600" fill={T.t2}
              style={{fontFamily:T.fontSans}}>Team {r?'B':'A'}</text>
          </g>
        ))}
        {cell(0,0)}{cell(1,1)}
        <g>
          {['0','15','30','40','Spiel'].map((l,j)=>{
            const v=cur[0]==='✓'||cur[1]==='✓'?4:Math.max(['0','15','30','40'].indexOf(cur[0]),
              ['0','15','30','40'].indexOf(cur[1]));
            const on=j===v||(j===3&&(cur[0]==='AD'||cur[1]==='AD'));
            return <text key={l} x={22+j*31} y={146} textAnchor="middle" fontSize="6.6" fontWeight="600"
              fill={on?T.o:T.t3} style={{fontFamily:T.fontSans}}>{l}</text>;
          })}
        </g>
        <g>
          {wchg&&wordPrev&&<text x={85} y={130-8*inU} textAnchor="middle" fontSize="15" fontWeight="700"
            fill={T.t1} opacity={1-inU} style={{fontFamily:T.fontSerif,fontStyle:'italic'}}>{wordPrev}</text>}
          {word&&<text x={85} y={130+(wchg?8*(1-inU):0)} textAnchor="middle" fontSize="15" fontWeight="700"
            fill={word==='Spiel'?T.o:T.t1} opacity={wchg?inU:1}
            style={{fontFamily:T.fontSerif,fontStyle:'italic'}}>{word}</text>}
        </g>
      </Stage>
    </div>
  );
}

/* Mini-Court fuer die Format-Szenen: Hochformat, Sitzplaetze
   0,1 = nahes Team, 2,3 = fernes Team. */
const MINI={w:36,h:64};
function MiniCourt({x,y,label,hi=0}){
  return(
    <g>
      <rect x={x} y={y} width={MINI.w} height={MINI.h} rx="2" fill={T.t1} fillOpacity={.05+hi*.06}
        stroke={hi?T.o:T.t1} strokeOpacity={hi?.8:.55} strokeWidth=".8"/>
      <line x1={x} y1={y+MINI.h*.17} x2={x+MINI.w} y2={y+MINI.h*.17} stroke={T.t1} strokeOpacity=".3" strokeWidth=".5"/>
      <line x1={x} y1={y+MINI.h*.83} x2={x+MINI.w} y2={y+MINI.h*.83} stroke={T.t1} strokeOpacity=".3" strokeWidth=".5"/>
      <line x1={x-2} y1={y+MINI.h/2} x2={x+MINI.w+2} y2={y+MINI.h/2} stroke={T.o} strokeWidth="1.1"/>
      {label&&<Kicker x={x+MINI.w/2} y={y-4}>{label}</Kicker>}
    </g>
  );
}
const seat=(cx,cy,i)=>[cx+(i%2?MINI.w*.72:MINI.w*.28),cy+(i<2?MINI.h*.76:MINI.h*.24)];
/* weiche Bewegung von a nach b auf einem Bogen */
const glide=(a,b,u,bend=10)=>{
  const mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2;
  const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||1;
  const cx=mx-dy/L*bend, cy=my+dx/L*bend;
  const v=1-u;
  return[v*v*a[0]+2*v*u*cx+u*u*b[0], v*v*a[1]+2*v*u*cy+u*u*b[1]];
};

/* 5 · Americano — acht Spieler, drei Runden, nie zweimal derselbe
   Partner. Die Kugeln ziehen auf neuen Boegen zu ihren Plaetzen. */
const AM_ROUNDS=[
  [[1,2,3,4],[5,6,7,8]],
  [[1,5,2,6],[3,7,4,8]],
  [[1,8,3,6],[2,7,4,5]],
];
export function SceneAmericano(){
  const R=3.2;
  const[ref,t]=useSceneClock(R*3,{still:.2});
  const r=Math.floor(t/R), lt=t%R, nx=(r+1)%3;
  const courts=[[28,30],[96,30]];
  const where=(round,id)=>{
    for(let c=0;c<2;c++){const k=AM_ROUNDS[round][c].indexOf(id);if(k>=0)return seat(...courts[c],k);}
    return[0,0];
  };
  const mv=id=>seg(lt,R-1+id*.035,R-.15+id*.035,ez.io);
  const partner=1-seg(lt,R-1.1,R-.9)-(1-seg(lt,.1,.5));
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 128" label="Americano: Partner wechseln jede Runde">
        <MiniCourt x={courts[0][0]} y={courts[0][1]} label="Court 1"/>
        <MiniCourt x={courts[1][0]} y={courts[1][1]} label="Court 2"/>
        {/* Partner-Bänder */}
        {AM_ROUNDS[r].map((c,ci)=>[0,2].map(k=>{
          const a=seat(...courts[ci],k), b=seat(...courts[ci],k+1);
          return <line key={ci+'-'+k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
            stroke={k?T.blue:T.o} strokeWidth="2.4" strokeLinecap="round" opacity={.55*Math.max(0,partner)}/>;
        }))}
        {[1,2,3,4,5,6,7,8].map(id=>{
          const p=glide(where(r,id),where(nx,id),mv(id),id%2?12:-12);
          const k=AM_ROUNDS[r].flat().indexOf(id)%4;
          return <Orb key={id} x={p[0]} y={p[1]} label={id} team={k<2?'a':'b'} r={6}/>;
        })}
        <Tag x={80} y={14} u={1} size={9} serif>Runde {r+1}</Tag>
        <Tag x={80} y={122} u={1} size={6.6} col={T.t2}>Jede Runde neue Partner</Tag>
      </Stage>
    </div>
  );
}

/* 6 · Mexicano — die Tabelle sortiert, je vier Nachbarn bilden einen
   Court: 1+4 gegen 2+3. */
export function SceneMexicano(){
  const D=7;
  const[ref,t]=useSceneClock(D,{still:3});
  const rows=[1,2,3,4,5,6,7,8].map(i=>[22,22+(i-1)*13]);
  const courts=[[104,18],[104,112]];
  const target=id=>{
    const c=id<=4?0:1, k=(id-1)%4;
    const s=[0,2,3,1][k];                      // 1+4 nah, 2+3 fern
    return seat(...courts[c],s);
  };
  const go=id=>seg(t,1+id*.08,2.1+id*.08,ez.io)*(1-seg(t,5.6+id*.03,6.6+id*.03,ez.io));
  const lines=win(t,2.6,5.6,.4);
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 194" label="Mexicano: 1 und 4 gegen 2 und 3">
        <Kicker x={8} y={9} anchor="start">Tabelle</Kicker>
        {rows.map((p,i)=>(
          <g key={i} opacity={.9}>
            <text x={8} y={p[1]+2.6} fontSize="7" fontWeight="300" fill={T.t3}
              style={{fontFamily:T.fontSans}}>{i+1}</text>
            <rect x={32} y={p[1]-1} width={40-i*3.6} height="2" rx="1" fill={T.t1} opacity=".18"/>
          </g>
        ))}
        <MiniCourt x={courts[0][0]} y={courts[0][1]} label="Court 1"/>
        <MiniCourt x={courts[1][0]} y={courts[1][1]} label="Court 2"/>
        {[0,1].map(c=>[[0,1],[2,3]].map(([a,b],j)=>{
          const p=seat(...courts[c],a), q=seat(...courts[c],b);
          return <line key={c+'-'+j} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={j?T.blue:T.o}
            strokeWidth="2.4" strokeLinecap="round" opacity={.55*lines}/>;
        }))}
        {[1,2,3,4,5,6,7,8].map(id=>{
          const p=glide(rows[id-1],target(id),go(id),id%2?-14:14);
          const k=[0,2,3,1][(id-1)%4];
          return <Orb key={id} x={p[0]} y={p[1]} label={id} team={k<2?'a':'b'} r={5.6}/>;
        })}
        <Tag x={122} y={92} u={lines} size={6.4} col={T.t2}>1+4 · 2+3</Tag>
        <Tag x={122} y={186} u={lines} size={6.4} col={T.t2}>5+8 · 6+7</Tag>
      </Stage>
    </div>
  );
}

/* 7 · King of the Court — Sieger einen Court hoch, Verlierer runter. */
export function SceneKing(){
  const D=6;
  const[ref,t]=useSceneClock(D*2,{still:1.5});
  const lt=t%D, cyc=Math.floor(t/D);
  const cw=46,chh=26, cx=[8,57,106], cy=48;
  // je Court zwei Paare: Sieger (oben im Court) wechselt nach links (Court 1 = Thron, links)
  const pairs=[[1,2],[3,4],[5,6],[7,8],[9,10],[11,12]];
  // Belegung je Zyklus: der Tausch ist seine eigene Umkehrung — nach
  // zwei Runden steht die Ausgangslage wieder, die Schleife ist nahtlos.
  const base=cyc%2?[0,2,1,4,3,5]:[0,1,2,3,4,5];
  const slot=(i)=>[cx[Math.floor(i/2)]+(i%2?cw*.72:cw*.28),cy+chh/2];
  const winSlot=[0,2,4];                         // gewinnt je Court das erste Paar
  const dest=i=>{
    const c=Math.floor(i/2), w=i%2===0;
    if(w) return c===0?0:(c-1)*2+1;              // Sieger hoch (Court 1 bleibt)
    return c===2?5:(c+1)*2;                      // Verlierer runter (Court 3 bleibt)
  };
  const flash=win(lt,.8,2.4,.25), mv=seg(lt,2.4,3.6,ez.io);
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 110" label="King of the Court: Sieger steigen auf">
        {[0,1,2].map(c=>(
          <g key={c}>
            <rect x={cx[c]} y={cy} width={cw} height={chh} rx="2" fill={T.t1} opacity={c?.04:.09}
              stroke={c?T.t1:T.o} strokeOpacity={c?.35:.8} strokeWidth=".8"/>
            <line x1={cx[c]+cw/2} y1={cy-2} x2={cx[c]+cw/2} y2={cy+chh+2} stroke={T.o} strokeWidth="1"/>
            <Tag x={cx[c]+cw/2} y={cy+chh+10} u={1} size={6.6} col={c?T.t2:T.o}>{c?`Court ${c+1}`:'Court 1 · Thron'}</Tag>
          </g>
        ))}
        {[0,1,2,3,4,5].map(si=>{
          const pid=base[si];
          const a=slot(si), b=slot(dest(si));
          const u=mv;
          const p=glide(a,b,u,si%2?10:-10);
          const won=winSlot.includes(si);
          return(
            <g key={pid}>
              {[-1,1].map(s=>(
                <Orb key={s} x={p[0]+s*4.4} y={p[1]} label={pairs[pid][s<0?0:1]}
                  team={won?'a':'b'} r={4.6} ring={won?flash:0}/>
              ))}
            </g>
          );
        })}
        <path d="M150 36H14" stroke={T.t3} strokeWidth=".5" strokeDasharray="2 2"/>
        <path d="M14 36l4 -2.4v4.8z" fill={T.t3}/>
        <Kicker x={80} y={28}>Sieger rücken auf</Kicker>
        <Tag x={80} y={104} u={win(lt,.8,2.6,.3)} size={9} serif col={T.o}>Gewonnen.</Tag>
        <Tag x={80} y={104} u={win(lt,2.6,D,.3)} size={9} serif>Hoch, runter, neu gemischt.</Tag>
      </Stage>
    </div>
  );
}

/* 8 · Pausen — fünf Spieler, ein Court: reihum pausiert, wer am
   seltensten draussen war; der Ausgleich fliegt zur Bank. */
export function ScenePause(){
  const R=3.4;
  const[ref,t]=useSceneClock(R*5,{still:2});
  const r=Math.floor(t/R), lt=t%R;
  const court=[30,20];
  const bench=[132,52];
  const order=r=>{const ids=[1,2,3,4,5];const out=ids[(4+r)%5];return{out,play:ids.filter(i=>i!==out)};};
  const pos=(rr,id)=>{const o=order(rr);if(o.out===id)return bench;return seat(...court,o.play.indexOf(id));};
  const nx=(r+1)%5;
  const mv=id=>seg(lt,R-.9+id*.03,R-.1+id*.03,ez.io);
  const bonus=seg(lt,1,2,ez.io), bonusOp=win(lt,1,2.6,.25);
  const ox=court[0]+MINI.w/2, oy=court[1]+MINI.h/2;
  const bx=lerp(ox,bench[0],bonus), by=lerp(oy,bench[1]-10,bonus)-Math.sin(bonus*Math.PI)*14;
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 104" label="Pausen-Rotation mit Ausgleich">
        <MiniCourt x={court[0]} y={court[1]} label="Court"/>
        <rect x={bench[0]-12} y={bench[1]-8} width={24} height={16} rx={8} fill="none"
          stroke={T.t3} strokeWidth=".8" strokeDasharray="2 2"/>
        <Kicker x={bench[0]} y={bench[1]-12}>Pause</Kicker>
        {[1,2,3,4,5].map(id=>{
          const p=glide(pos(r,id),pos(nx,id),mv(id),id%2?12:-12);
          const k=order(r).play.indexOf(id);
          return <Orb key={id} x={p[0]} y={p[1]} label={id} team={k<0?'x':k<2?'a':'b'} r={6}/>;
        })}
        {bonusOp>0&&<g opacity={bonusOp}>
          <rect x={bx-10} y={by-5.5} width={20} height={11} rx={5.5} fill={T.blue} opacity=".9"/>
          <text x={bx} y={by+.4} textAnchor="middle" dominantBaseline="middle" fontSize="6"
            fontWeight="700" fill="#fff" style={{fontFamily:T.fontSans}}>+Ø</text>
        </g>}
        <Tag x={98} y={92} u={1} size={9} serif anchor="start">Runde {r+1}</Tag>
      </Stage>
    </div>
  );
}

/* ═══ JOURNEY ═════════════════════════════════════════════════ */

/* Aufstellungen — vier Phasen, die Spieler ziehen um. */
const PHASES=[
  ['Aufschlag',[[7.4,18.4],[2.6,12.6]],[[2.6,1.6],[7.4,7.4]]],
  ['Angriff',[[3,12.4],[7,12.4]],[[3,1.6],[7,1.6]]],
  ['Verteidigung',[[3,18.6],[7,18.6]],[[3,7.6],[7,7.6]]],
  ['Return',[[7.4,18.6],[2.6,13.6]],[[2.6,1.6],[7.4,7.4]]],
];
export function SceneFormation(){
  const R=2.8;
  const[ref,t]=useSceneClock(R*4,{still:.4});
  const p=Math.floor(t/R), lt=t%R, q=(p+1)%4;
  const u=seg(lt,R-.9,R-.05,ez.io);
  const ox=34,oy=14;
  const pos=(team,i)=>{const a=PHASES[p][team][i], b=PHASES[q][team][i];
    const g=glide(a,b,u,0); return[ox+g[0]*K,oy+g[1]*K];};
  const name=PHASES[p][0], nn=PHASES[q][0];
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 222" label="Aufstellungen: Aufschlag, Angriff, Verteidigung, Return">
        <Court ox={ox} oy={oy}/>
        {[0,1].map(i=>{const a=pos(2,i);return <Orb key={'b'+i} x={a[0]} y={a[1]} team="b"/>;})}
        {[0,1].map(i=>{const a=pos(1,i);return <Orb key={'a'+i} x={a[0]} y={a[1]} label={i+1} team="a"/>;})}
        <Tag x={80} y={206} u={1-seg(lt,R-.9,R-.5)} size={11} serif>{name}</Tag>
        <Tag x={80} y={206} u={seg(lt,R-.5,R-.05)} size={11} serif>{nn}</Tag>
      </Stage>
    </div>
  );
}

/* Hand-Seiten — wohin zeigt die Vorhand? Rechts+Rechts gegen
   Rechts+Links. Die Vorhand-Faecher drehen sich mit. */
export function SceneHands(){
  const D=7;
  const[ref,t]=useSceneClock(D*2,{still:4});
  const ph=Math.floor(t/D), lt=t%D;
  const mix=ph?1-seg(lt,D-1,D-.1,ez.io):seg(lt,D-1,D-.1,ez.io);
  const ox=34,oy=-58;
  const L=[ox+2.8*K,oy+15.6*K], Rr=[ox+7.2*K,oy+15.6*K];
  const fan=(c,ang,col,op)=>{
    const a0=ang-.75, a1=ang+.75, rr=26;
    const p=a=>[c[0]+Math.cos(a)*rr,c[1]+Math.sin(a)*rr];
    const s=p(a0), e=p(a1);
    return <path d={`M${c[0]} ${c[1]}L${s[0]} ${s[1]}A${rr} ${rr} 0 0 1 ${e[0]} ${e[1]}Z`}
      fill={col} opacity={op}/>;
  };
  const right=lerp(-Math.PI/2+.75,-Math.PI/2-.75,mix);
  const mid=win(t%D,0,D,.4);
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 150" label="Vorhand zur Mitte">
        <Court ox={ox} oy={oy} half/>
        <rect x={ox+4*K} y={oy+11*K} width={2*K} height={8.6*K} fill={T.o} opacity={.08+.06*mix}/>
        {fan(L,-Math.PI/2+.75,T.o,.3)}
        {fan(Rr,right,mix>.5?T.o:T.t1,.18+.12*mix)}
        <Orb x={L[0]} y={L[1]} label="R" team="a"/>
        <Orb x={Rr[0]} y={Rr[1]} label={mix>.5?'L':'R'} team="a"/>
        <Kicker x={80} y={oy+19.2*K} u={mid} col={T.o}>Mitte</Kicker>
        <Tag x={80} y={140} u={1-seg(lt,D-1,D-.5)} size={10} serif>{ph?'Rechts + Links':'Rechts + Rechts'}</Tag>
        <Tag x={80} y={140} u={seg(lt,D-.5,D-.05)} size={10} serif>{ph?'Rechts + Rechts':'Rechts + Links'}</Tag>
      </Stage>
    </div>
  );
}

/* Schlagwahl — Seitenansicht: der Ball kommt hoch, mittel, tief; die
   Hoehe entscheidet den Schlag. */
const SHOT_BANDS=[
  ['Hoch','Smash · Bandeja · Víbora',2.4],
  ['Mitte','Volea · Drive',1.25],
  ['Tief','Globo · Chiquita',.45],
];
export function SceneShotChoice(){
  const D=3.4;
  const[ref,t]=useSceneClock(D*3,{still:2});
  const i=Math.floor(t/D), lt=t%D;
  const gx=10, gy=96, sx=7, sy=22;          // Boden, Masse (m → Einheiten)
  const X=m=>gx+m*sx, Y=h=>gy-h*sy;
  const h=SHOT_BANDS[i][2];
  // Ball kommt von links (gegnerische Seite) zum Spieler bei 15.5 m
  const u=seg(lt,.2,1.5,ez.lin);
  const bx=lerp(3,15.5,u), bz=lerp(1.2,h,u)+Math.sin(Math.PI*u)*(i===0?1.2:i===1?.8:.9);
  const out=seg(lt,1.55,2.6,ez.lin);
  const rx=lerp(15.5,5,out), rz=lerp(h,i===2?.2:.6,out)+Math.sin(Math.PI*out)*(i===2?3:1);
  const showB=lt<1.5, showR=lt>=1.55&&lt<2.6;
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 112" label="Schlagwahl nach Ballhöhe">
        {SHOT_BANDS.map((b,j)=>{
          const top=j===0?3.2:j===1?1.8:1, bot=j===0?1.8:j===1?1:0;
          return(
            <g key={j}>
              <rect x={X(11)} y={Y(top)} width={X(20)-X(11)} height={Y(bot)-Y(top)}
                fill={T.o} opacity={j===i?.16:.04}/>
              <text x={X(20)-2} y={Y(top)+7} textAnchor="end" fontSize="5.6" fill={j===i?T.o:T.t3}
                style={{fontFamily:T.fontDisplay,letterSpacing:1.4}}>{b[0]}</text>
            </g>
          );
        })}
        <line x1={X(0)} y1={gy} x2={X(20)} y2={gy} stroke={T.t1} strokeWidth="1" opacity=".7"/>
        <line x1={X(10)} y1={gy} x2={X(10)} y2={Y(.88)} stroke={T.o} strokeWidth="1.8"/>
        <line x1={X(0)} y1={gy} x2={X(0)} y2={Y(3)} stroke={T.t1} strokeWidth="1.6" opacity=".4"/>
        <line x1={X(20)} y1={gy} x2={X(20)} y2={Y(3)} stroke={T.t1} strokeWidth="1.6" opacity=".4"/>
        <Orb x={X(15.9)} y={gy-6.5} label="Du" team="a" r={6}/>
        {showB&&<circle cx={X(bx)} cy={Y(bz)} r="2.6" fill={T.ball}/>}
        {showR&&<circle cx={X(rx)} cy={Y(rz)} r="2.6" fill={T.ball}/>}
        <Tag x={X(5)} y={22} u={win(lt,.2,D-.1,.3)} size={8} serif>{SHOT_BANDS[i][1]}</Tag>
      </Stage>
    </div>
  );
}

/* Schläger — Rund → Tropfen → Diamant, der Sweet Spot wandert mit
   nach oben, der Regler von Kontrolle nach Power. */
/* Die Zeichnungen sind dieselben wie im Kapitel darunter
   (public/assets/rackets/, aus der Vorlage des Teams vektorisiert).
   Sie liegen als CSS-Maske UEBER der Buehne — das SVG darunter malt
   nur den Sweet Spot, der durch die leere Flaeche der Zeichnung
   leuchtet. Box: 28/4, 68 x 120 Einheiten (Seitenverhaeltnis der
   Dateien, 384 x 676). Sweet Spot je Form in diesen Einheiten. */
const RK_IDS=['rund','tropfen','diamant'];
const RK_BOX={x:28,y:4,w:68,h:120};
const RK_SPOT=[{cy:37.6,rx:21,ry:21},{cy:37.6,rx:16,ry:25},{cy:20.8,rx:20,ry:6.6}];
export function SceneRacket(){
  const D=3;
  const[ref,t]=useSceneClock(D*3,{still:4});
  const i=Math.floor(t/D)%3, lt=t%D, j=(i+1)%3;
  const u=seg(lt,D-.9,D-.05,ez.io);
  const cx=RK_BOX.x+RK_BOX.w/2;
  const sp=k=>lerp(RK_SPOT[i][k],RK_SPOT[j][k],u);
  const pulse=.55+.25*Math.sin(t*Math.PI*1.3);
  const names=['Rund','Tropfen','Diamant'], sub=['Kontrolle','Allround','Power'];
  const bar=lerp(i/2,j/2,u);
  /* Wechsel als Kartendreher: die alte Form klappt zur Kante weg,
     die neue klappt auf. */
  const cur=u<.5?i:j, sx=u<.5?1-2*u:2*u-1;
  const url=`url(${getAssetBase()}assets/rackets/${RK_IDS[cur]}.svg)`;
  const pc=v=>`${v}%`;
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <div style={{position:'relative',width:'100%',maxWidth:340}}>
        <Stage vb="0 0 160 150" label="Schlägerformen: Rund, Tropfen, Diamant">
          <ellipse cx={cx} cy={sp('cy')} rx={sp('rx')+4} ry={sp('ry')+4} fill={T.o} opacity={pulse*.16}/>
          <ellipse cx={cx} cy={sp('cy')} rx={sp('rx')} ry={sp('ry')} fill={T.o} opacity={pulse*.55}/>
          <Tag x={128} y={48} u={1-seg(lt,D-.9,D-.5)} size={11} serif>{names[i]}</Tag>
          <Tag x={128} y={48} u={seg(lt,D-.5,D-.05)} size={11} serif>{names[j]}</Tag>
          <Tag x={128} y={60} u={1} size={6.4} col={T.t2}>{u>.5?sub[j]:sub[i]}</Tag>
          <line x1={10} y1={140} x2={150} y2={140} stroke={T.t1} strokeOpacity=".2" strokeWidth="2" strokeLinecap="round"/>
          <circle cx={lerp(14,146,bar)} cy={140} r="3.4" fill={T.o}/>
          <text x={10} y={133} fontSize="5.6" fill={T.t3} style={{fontFamily:T.fontDisplay,letterSpacing:1.4}}>Kontrolle</text>
          <text x={150} y={133} textAnchor="end" fontSize="5.6" fill={T.t3} style={{fontFamily:T.fontDisplay,letterSpacing:1.4}}>Power</text>
        </Stage>
        <div aria-hidden="true" style={{position:'absolute',
          left:pc(RK_BOX.x/160*100),top:pc(RK_BOX.y/150*100),
          width:pc(RK_BOX.w/160*100),height:pc(RK_BOX.h/150*100),
          background:T.t1,transform:`scaleX(${Math.max(.02,sx)})`,
          WebkitMaskImage:url,maskImage:url,WebkitMaskRepeat:'no-repeat',maskRepeat:'no-repeat',
          WebkitMaskPosition:'center',maskPosition:'center',
          WebkitMaskSize:'contain',maskSize:'contain'}}/>
      </div>
    </div>
  );
}

/* Bälle — beide aus 2,54 m fallen gelassen. Sie springen fast gleich
   hoch; ehrlicher als jede Uebertreibung. */
export function SceneBalls(){
  const D=3.2;
  const[ref,t]=useSceneClock(D,{still:.9});
  const gy=128, sc=44;                          // 1 m = 44 Einheiten
  const g=9.81, h0=2.54;
  const height=(e)=>{
    const t1=Math.sqrt(2*h0/g);
    if(t<t1) return h0-g*t*t/2;
    const v=g*t1*e, tt=t-t1, t2=2*v/g;
    if(tt<t2) return v*tt-g*tt*tt/2;
    const v2=v*e, t3=tt-t2;
    return Math.max(0,v2*t3-g*t3*t3/2);
  };
  const eT=Math.sqrt(1.41/2.54), eP=Math.sqrt(1.40/2.54);
  const balls=[[52,'Tennis',height(eT)],[108,'Padel',height(eP)]];
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 150" label="Sprunghöhe Tennis- und Padelball">
        <line x1={20} y1={gy} x2={140} y2={gy} stroke={T.t1} strokeWidth="1" opacity=".7"/>
        <rect x={24} y={gy-1.47*sc} width={112} height={(1.47-1.35)*sc} fill={T.o} opacity=".14"/>
        <line x1={20} y1={gy-h0*sc} x2={140} y2={gy-h0*sc} stroke={T.t1} strokeOpacity=".3"
          strokeWidth=".6" strokeDasharray="2 2"/>
        <text x={20} y={gy-h0*sc-3} fontSize="5.6" fill={T.t3} style={{fontFamily:T.fontSans}}>2,54 m</text>
        <text x={140} y={gy-1.47*sc-3} textAnchor="end" fontSize="5.6" fill={T.o}
          style={{fontFamily:T.fontSans}}>1,35–1,47 m</text>
        {balls.map(([x,l,hh])=>(
          <g key={l}>
            <ellipse cx={x} cy={gy+1} rx={4.6} ry={1.4} fill="#000" opacity={.45*Math.max(.2,1-hh/2.5)}/>
            <circle cx={x} cy={gy-hh*sc-(l==='Padel'?3.3:3.4)} r={l==='Padel'?3.3:3.4} fill={T.ball}/>
            <text x={x} y={gy+12} textAnchor="middle" fontSize="7" fontWeight="600" fill={T.t1}
              style={{fontFamily:T.fontSans}}>{l}</text>
          </g>
        ))}
      </Stage>
    </div>
  );
}

/* Fair Play — nach dem Match gehen beide Teams ans Netz; wo sich die
   Haende treffen, blitzt es kurz auf. */
export function SceneFairPlay(){
  const D=5.2;
  const[ref,t]=useSceneClock(D,{still:2.6});
  const k=K*.6, ox=80-5*k, oy=6;                // gleichmaessig verkleinert, sonst verzerrt
  const X=x=>ox+x*k, Y=y=>oy+y*k;
  const go=seg(t,.3,1.8,ez.io)*(1-seg(t,4.4,5.1,ez.io));
  const from={a:[[3,18],[7,18.4]],b:[[3,2],[7,1.6]]};
  const to={a:[[3.2,11.4],[6.8,11.4]],b:[[3.2,8.6],[6.8,8.6]]};
  const spark=win(t,1.8,3.6,.3), pulse=seg(t,1.8,2.6,ez.out);
  return(
    <div ref={ref} style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <Stage vb="0 0 160 142" label="Nach dem Match: Handschlag am Netz">
        <rect x={X(0)} y={Y(0)} width={10*k} height={20*k} rx="1.5" fill={T.t1} fillOpacity=".035"
          stroke={T.t1} strokeOpacity=".7"/>
        <line x1={X(-.35)} y1={Y(10)} x2={X(10.35)} y2={Y(10)} stroke={T.o} strokeWidth="1.6"/>
        {[3.2,6.8].map(x=>(
          <g key={x} opacity={spark}>
            <ellipse cx={X(x)} cy={Y(10)} rx={3+pulse*8} ry={(3+pulse*8)*.5} fill="none"
              stroke={T.o} strokeWidth={1.2*(1-pulse)+.3}/>
            <circle cx={X(x)} cy={Y(10)} r="1.8" fill={T.o}/>
          </g>
        ))}
        {['a','b'].map(tm=>[0,1].map(i=>{
          const p=[lerp(from[tm][i][0],to[tm][i][0],go),lerp(from[tm][i][1],to[tm][i][1],go)];
          return <Orb key={tm+i} x={X(p[0])} y={Y(p[1])} team={tm} label={tm==='a'?i+1:null} r={6}/>;
        }))}
        <Tag x={80} y={138} u={spark} size={9} serif>Netz. Hand. Danke.</Tag>
      </Stage>
    </div>
  );
}
