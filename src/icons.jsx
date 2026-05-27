/* ═══════════════════════════════════════════════════════════════
   ICONS — small SVG glyphs and brand logos.

   All icons are pure components. They consume CSS variables via
   the `T` token mirror so they restyle automatically with the
   active theme. Logo components (RitmoWordmark, RitmoSplashLogo)
   load PNGs with an inline SVG fallback if the asset is missing.
═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { T } from "./theme.js";
import { getAssetBase } from "./utils.js";

/* ─── RITMO Wortmarke (klein) ─────────────────────────────────── */
export function RitmoWordmark({size=22,style}){
  const[err,setErr]=useState(false);
  const G=T.gold;
  // Theme-dependent: light theme braucht dunkle Logos für Kontrast
  const isLight=typeof document!=='undefined'&&
    document.documentElement.getAttribute('data-theme')==='light';
  const file=isLight?'ritmowidedark.png':'ritmowide.png';
  if(err){
    // SVG fallback wenn das PNG nicht vorhanden
    const iconSize=size*1.2;
    return(
      <div style={{display:'flex',alignItems:'center',gap:7,...style}}>
        <svg width={iconSize} height={iconSize} viewBox="0 0 30 30" fill="none" style={{display:'block'}}>
          <line x1="0" y1="8"  x2="3" y2="8"  stroke={G} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="0" y1="14" x2="3" y2="14" stroke={G} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="0" y1="20" x2="3" y2="20" stroke={G} strokeWidth="1.2" strokeLinecap="round"/>
          <g stroke="var(--t1)" fill="none" strokeLinecap="square">
            <line x1="6" y1="2" x2="6" y2="26" strokeWidth="3.5"/>
            <path d="M7.5 2 L14 2 Q21 2 21 8 Q21 14 14 14 L7.5 14"
              strokeWidth="3.5" strokeLinejoin="miter"/>
            <line x1="11.5" y1="14" x2="22" y2="26" strokeWidth="3.5"/>
          </g>
          <circle cx="24" cy="27" r="1.9" fill={G}/>
        </svg>
        <span style={{color:T.t1,fontSize:size,fontWeight:900,letterSpacing:0.6,
          fontStyle:'italic',fontFamily:'-apple-system,sans-serif',lineHeight:1}}>RITMO</span>
      </div>
    );
  }
  return(
    <img src={`${getAssetBase()}assets/${file}`}
      onError={()=>setErr(true)}
      style={{height:size*1.46,width:'auto',display:'block',userSelect:'none',...style}}
      alt="RITMO"/>
  );
}

/* ─── RITMO PADEL CLUB Splash Logo ────────────────────────────── */
export function RitmoSplashLogo({size=260}){
  const[err,setErr]=useState(false);
  const G=T.gold;
  const isLight=typeof document!=='undefined'&&
    document.documentElement.getAttribute('data-theme')==='light';
  const file=isLight?'ritmohighdark.png':'ritmohigh.png';
  if(err){
    // SVG fallback
    return(
      <svg width={size} height={size} viewBox="0 0 280 280" fill="none">
        <text x="140" y="44" textAnchor="middle" fill="var(--t1)" fontSize="14"
          fontWeight="700" letterSpacing="8"
          fontFamily="-apple-system,sans-serif">PADEL</text>
        <g transform="translate(86,62)">
          <line x1="-50" y1="22" x2="-2" y2="22" stroke={G} strokeWidth="3" strokeLinecap="round"/>
          <line x1="-65" y1="42" x2="-2" y2="42" stroke={G} strokeWidth="3" strokeLinecap="round"/>
          <line x1="-72" y1="62" x2="-2" y2="62" stroke={G} strokeWidth="3" strokeLinecap="round"/>
          <g stroke="var(--t1)" fill="none" strokeLinecap="square">
            <line x1="0" y1="0" x2="0" y2="125" strokeWidth="14"/>
            <path d="M7 0 L46 0 Q88 0 88 33 Q88 66 46 66 L7 66" strokeWidth="14" strokeLinejoin="miter"/>
            <line x1="38" y1="66" x2="100" y2="125" strokeWidth="14"/>
          </g>
          <circle cx="106" cy="130" r="6" fill={G}/>
        </g>
        <text x="140" y="240" textAnchor="middle" fill="var(--t1)" fontSize="14"
          fontWeight="700" letterSpacing="8"
          fontFamily="-apple-system,sans-serif">CLUB</text>
      </svg>
    );
  }
  return(
    <img src={`${getAssetBase()}assets/${file}`}
      onError={()=>setErr(true)}
      style={{width:size,height:'auto',display:'block',userSelect:'none'}}
      alt="RITMO PADEL CLUB"/>
  );
}

/* ─── Court icon ──────────────────────────────────────────────── */
export function CourtIcon({size=36}){
  return(
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <line x1="11" y1="6"  x2="11" y2="30" stroke="var(--t1)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="25" y1="6"  x2="25" y2="30" stroke="var(--t1)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="6"  y1="18" x2="30" y2="18" stroke="var(--t1)" strokeWidth="1" strokeLinecap="round" opacity=".4"/>
      <circle cx="29" cy="9" r="3.4" fill={T.o}/>
      <path d="M26.3 9 Q29 7.5 31.7 9" stroke="var(--t1)" strokeWidth=".7" fill="none" opacity=".7"/>
    </svg>
  );
}

/* ─── Padel-Schläger mini ─────────────────────────────────────── */
export function RacketMini({size=24,color=T.t1}){
  return(
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <ellipse cx="14" cy="11" rx="8.5" ry="9" fill="none" stroke={color} strokeWidth="1.7"/>
      {[10,14,18].map(x=><line key={x} x1={x} y1="4" x2={x} y2="18" stroke={color} strokeWidth=".5" opacity=".5"/>)}
      {[7,11,15].map(y=><line key={y} x1="6.5" y1={y} x2="21.5" y2={y} stroke={color} strokeWidth=".5" opacity=".5"/>)}
      <line x1="14" y1="20" x2="14" y2="26" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Trophy ──────────────────────────────────────────────────── */
export function TrophyIcon({size=42}){
  return(
    <svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <path d="M13 9 L29 9 L28 22 Q28 26 21 26 Q14 26 14 22 Z"
        fill="none" stroke={T.o} strokeWidth="1.8"/>
      <path d="M13 11 Q6 11 6 16 Q6 21 13 21" stroke={T.o} strokeWidth="1.6" fill="none"/>
      <path d="M29 11 Q36 11 36 16 Q36 21 29 21" stroke={T.o} strokeWidth="1.6" fill="none"/>
      <line x1="21" y1="26" x2="21" y2="33" stroke={T.o} strokeWidth="1.8"/>
      <rect x="15" y="33" width="12" height="2.5" rx="1" fill={T.o}/>
    </svg>
  );
}

/* ─── Person mit Pfeil (Beitreten) ────────────────────────────── */
export function JoinIcon({size=32}){
  return(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="14" cy="11" r="4.5" stroke="var(--t1)" strokeWidth="1.6" fill="none"/>
      <path d="M5 26 Q5 18 14 18 Q19 18 21.5 20" stroke="var(--t1)" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <circle cx="24" cy="22" r="6.5" fill={T.bg} stroke="var(--t1)" strokeWidth="1.4"/>
      <path d="M21 22 L24 19 M21 22 L24 25 M21 22 L27.5 22" stroke="var(--t1)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

/* ─── Tab-Bar Icons ───────────────────────────────────────────── */
export function HomeIcon({active,size=22}){
  return(<svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <path d="M3 10 L11 3 L19 10 L19 19 L13.5 19 L13.5 13 L8.5 13 L8.5 19 L3 19 Z"
      stroke={active?T.blue:T.t1} strokeWidth="1.7" strokeLinejoin="round"
      fill={active?T.blueSoft:'none'}/>
  </svg>);
}
export function LiveIcon({active,size=22}){
  return(<svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <ellipse cx="11" cy="9" rx="6.5" ry="7" stroke={active?T.blue:T.t1} strokeWidth="1.6" fill="none"/>
    <line x1="6" y1="6" x2="9" y2="9" stroke={active?T.blue:T.t1} strokeWidth=".8" opacity=".6"/>
    <line x1="11" y1="16" x2="11" y2="20" stroke={active?T.blue:T.t1} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>);
}
export function GearIcon({active,size=22}){
  return(<svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="3" stroke={active?T.blue:T.t1} strokeWidth="1.6" fill="none"/>
    <path d="M11 1 L11 4 M11 18 L11 21 M1 11 L4 11 M18 11 L21 11
             M3.9 3.9 L6 6 M16 16 L18.1 18.1 M3.9 18.1 L6 16 M16 6 L18.1 3.9"
      stroke={active?T.blue:T.t1} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>);
}
export function SearchIcon({size=22,filled=false}){
  // filled = aktiv (z.B. Search-Mode mit Text). Lupe wird komplett orange
  // ausgefüllt statt nur Outline.
  if(filled){
    return(<svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="9.5" cy="9.5" r="6" stroke="var(--o)" strokeWidth="1.9" fill="var(--o)"/>
      <line x1="14" y1="14" x2="19" y2="19" stroke="var(--o)" strokeWidth="2.3" strokeLinecap="round"/>
    </svg>);
  }
  return(<svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <circle cx="9.5" cy="9.5" r="6" stroke="var(--t1)" strokeWidth="1.7" fill="none"/>
    <line x1="14" y1="14" x2="19" y2="19" stroke="var(--t1)" strokeWidth="1.9" strokeLinecap="round"/>
  </svg>);
}

/* ─── Highlight helper ────────────────────────────────────────── */
/* Markiert alle Vorkommen eines Such-Strings (case-insensitive)
   im gegebenen Text gelb. Nichts zu tun, wenn q leer. */
export function Hl({text,q}){
  if(!q||!text||typeof text!=='string') return text||'';
  const lo=text.toLowerCase(), qLo=q.toLowerCase();
  if(!lo.includes(qLo)) return text;
  const out=[]; let i=0, k=0;
  while(i<text.length){
    const f=lo.indexOf(qLo,i);
    if(f<0){out.push(text.slice(i));break;}
    if(f>i) out.push(text.slice(i,f));
    out.push(<mark key={k++} style={{background:'#FFE600',color:'#000',
      padding:'0 2px',borderRadius:3,fontWeight:'inherit'}}>
      {text.slice(f,f+q.length)}
    </mark>);
    i=f+q.length;
  }
  return <>{out}</>;
}

export function DNAIcon({size=22,color='var(--t1)'}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4 C 4 10, 20 14, 20 20"/>
    <path d="M20 4 C 20 10, 4 14, 4 20"/>
    <line x1="6" y1="6" x2="18" y2="6"/>
    <line x1="6" y1="18" x2="18" y2="18"/>
    <line x1="9" y1="10" x2="15" y2="10"/>
    <line x1="9" y1="14" x2="15" y2="14"/>
  </svg>);
}
export function FullscreenIcon({size=18}){
  return(<svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M2 6 L2 2 L6 2 M12 2 L16 2 L16 6 M16 12 L16 16 L12 16 M6 16 L2 16 L2 12"
      stroke="var(--t1)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>);
}
export function EditIcon({size=20,color=T.t1}){
  return(<svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    {/* Pencil/edit shape */}
    <path d="M3 19 L3 14 L14 3 L19 8 L8 19 L3 19 Z"
      stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    {/* Eraser separator line */}
    <line x1="12" y1="5" x2="17" y2="10" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>);
}
export function ExitFullscreenIcon({size=18}){
  return(<svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M6 2 L6 6 L2 6 M12 6 L16 6 L12 2 L12 6 Z M6 16 L6 12 L2 12 M16 12 L12 12 L12 16"
      stroke="var(--t1)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>);
}

/* ─── Funky-Theme Fruchticons ────────────────────────────────── */
export function KiwiIcon({size=18}){
  const seeds=[[12,5.5],[16,7],[18,11],[16.5,15.5],[12,18.5],[7.5,15.5],[6,11],[8,7]];
  return(<svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#7BAB3E"/>
    <circle cx="12" cy="12" r="9.2" fill="#A7D070"/>
    <circle cx="12" cy="12" r="1.7" fill="#FFFCEB"/>
    {seeds.map(([x,y],i)=>(
      <ellipse key={i} cx={x} cy={y} rx="0.55" ry="0.95" fill="#1A1A1A"
        transform={`rotate(${i*45} ${x} ${y})`}/>
    ))}
  </svg>);
}

export function PineappleIcon({size=18}){
  return(<svg width={size} height={size} viewBox="0 0 24 24">
    {/* Leaves */}
    <path d="M 12 1 L 9 5 L 12 4 L 15 5 Z" fill="#3AA050"/>
    <path d="M 8 5.5 L 11 2 L 12 4 L 10 6 Z" fill="#3AA050"/>
    <path d="M 16 5.5 L 13 2 L 12 4 L 14 6 Z" fill="#3AA050"/>
    {/* Body */}
    <ellipse cx="12" cy="14.5" rx="5.4" ry="6.8" fill="#FFD93C"/>
    <ellipse cx="12" cy="14.5" rx="5.4" ry="6.8" fill="none" stroke="#C8860B" strokeWidth="0.5" opacity="0.4"/>
    {/* Diamond cross-hatch */}
    <path d="M 9 9 L 13 12 L 9 15 M 15 9 L 11 12 L 15 15 M 9 15 L 13 18 L 9 21 M 15 15 L 11 18 L 15 21"
      stroke="#C8860B" strokeWidth="0.55" fill="none" opacity="0.7"/>
  </svg>);
}

export function CoconutIcon({size=18}){
  return(<svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#6B4226"/>
    <circle cx="12" cy="12" r="8" fill="#F4ECDF"/>
    {/* Brown shell flecks on inside ring */}
    <circle cx="10" cy="10" r="0.6" fill="#6B4226"/>
    <circle cx="14" cy="11" r="0.5" fill="#6B4226"/>
    <circle cx="11.5" cy="14" r="0.55" fill="#6B4226"/>
    <circle cx="14.5" cy="14.5" r="0.45" fill="#6B4226"/>
    {/* Three eyes (coconut signature) */}
    <circle cx="9.5" cy="7" r="0.85" fill="#3D1F0E"/>
    <circle cx="12" cy="6" r="0.85" fill="#3D1F0E"/>
    <circle cx="14.5" cy="7" r="0.85" fill="#3D1F0E"/>
  </svg>);
}

export function TennisBallIcon({size=18}){
  return(<svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10.5" fill="#E8FF3D" stroke="rgba(0,0,0,0.32)" strokeWidth="0.4"/>
    <path d="M 2 12 Q 7 9 12 10 Q 17 9 22 12" stroke="white" strokeWidth="1.4" fill="none" opacity="0.85"/>
    <path d="M 2 12 Q 7 15 12 14 Q 17 15 22 12" stroke="white" strokeWidth="1.4" fill="none" opacity="0.85"/>
  </svg>);
}

export function ParrotIcon({size=18}){
  return(<svg width={size} height={size} viewBox="0 0 24 24">
    {/* Body */}
    <ellipse cx="11" cy="13" rx="6.5" ry="7.5" fill="#FF3D5A"/>
    {/* Wing */}
    <path d="M 7 11 Q 10 9 13 11 Q 13 16 9 17 Q 6 16 7 11 Z" fill="#FFE52D"/>
    {/* Head */}
    <circle cx="11" cy="7.5" r="4" fill="#FF3D5A"/>
    {/* Beak */}
    <path d="M 14 7 L 18 6 L 14.5 9 Z" fill="#FFE52D" stroke="#C8860B" strokeWidth="0.3" strokeLinejoin="round"/>
    {/* Eye */}
    <circle cx="12.5" cy="6.8" r="1.1" fill="#FFF"/>
    <circle cx="12.7" cy="6.8" r="0.55" fill="#1A1A1A"/>
    {/* Tail feathers */}
    <path d="M 5 18 L 3 22 L 6 20 L 5 23 L 8 21 Z" fill="#00C896"/>
  </svg>);
}

export function FunkyFruitsRow({size=16,gap=7}){
  return(
    <div style={{display:'flex',alignItems:'center',gap}}>
      <PineappleIcon size={size}/>
      <KiwiIcon size={size}/>
      <CoconutIcon size={size}/>
      <TennisBallIcon size={size}/>
      <ParrotIcon size={size}/>
    </div>
  );
}

/* ─── Rules / Journey ─────────────────────────────────────────── */
export function BookIcon({size=28}){
  return(<svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Open book silhouette */}
    <path d="M4 7 L4 25 L15 27 L15 9 Z" fill="none" stroke="var(--o)" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M28 7 L28 25 L17 27 L17 9 Z" fill="none" stroke="var(--o)" strokeWidth="1.6" strokeLinejoin="round"/>
    <line x1="15" y1="9" x2="15" y2="27" stroke="var(--o)" strokeWidth="1.6"/>
    <line x1="17" y1="9" x2="17" y2="27" stroke="var(--o)" strokeWidth="1.6"/>
    {/* Page lines */}
    <line x1="7" y1="13" x2="12" y2="13.5" stroke="var(--o)" strokeWidth=".9" opacity=".55"/>
    <line x1="7" y1="17" x2="12" y2="17.5" stroke="var(--o)" strokeWidth=".9" opacity=".55"/>
    <line x1="20" y1="13.5" x2="25" y2="13" stroke="var(--o)" strokeWidth=".9" opacity=".55"/>
    <line x1="20" y1="17.5" x2="25" y2="17" stroke="var(--o)" strokeWidth=".9" opacity=".55"/>
  </svg>);
}

export function JourneyIcon({size=28}){
  return(<svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Compass: outer ring */}
    <circle cx="16" cy="16" r="13" stroke="var(--o)" strokeWidth="1.6"/>
    <circle cx="16" cy="16" r="10" stroke="var(--o)" strokeWidth="0.8" opacity="0.4"/>
    {/* N pointer (filled) */}
    <path d="M 16 5.5 L 12 16 L 16 13.5 L 20 16 Z" fill="var(--o)"/>
    {/* S pointer (outlined) */}
    <path d="M 16 26.5 L 12 16 L 16 18.5 L 20 16 Z" fill="none" stroke="var(--o)" strokeWidth="1.2" opacity="0.55"/>
    {/* Cardinal marks */}
    <circle cx="16" cy="3" r="0.9" fill="var(--o)" opacity="0.7"/>
    <circle cx="29" cy="16" r="0.9" fill="var(--o)" opacity="0.7"/>
    <circle cx="16" cy="29" r="0.9" fill="var(--o)" opacity="0.7"/>
    <circle cx="3" cy="16" r="0.9" fill="var(--o)" opacity="0.7"/>
    {/* Center dot */}
    <circle cx="16" cy="16" r="1.6" fill="var(--o)"/>
  </svg>);
}

export function ArrowRightCircleIcon({size=26}){
  return(<svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" stroke="var(--o)" strokeWidth="2.2"/>
    <path d="M 10 16 L 21 16" stroke="var(--o)" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M 17 11.5 L 21.5 16 L 17 20.5" stroke="var(--o)" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>);
}

export function WandIcon({size=22}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Wand body diagonal */}
    <line x1="4" y1="20" x2="17" y2="7" stroke="var(--o)" strokeWidth="1.8" strokeLinecap="round"/>
    {/* Wand tip star */}
    <circle cx="18" cy="6" r="2.2" fill="var(--o)"/>
    {/* Sparkles */}
    <path d="M14 4 L14.6 5.5 L16 6 L14.6 6.5 L14 8 L13.4 6.5 L12 6 L13.4 5.5 Z"
      fill="var(--o)" opacity="0.8"/>
    <path d="M20 11 L20.4 12 L21.4 12.4 L20.4 12.8 L20 13.8 L19.6 12.8 L18.6 12.4 L19.6 12 Z"
      fill="var(--o)" opacity="0.6"/>
  </svg>);
}

/* ─── MiniBall + Spinner ──────────────────────────────────────── */
export function MiniBall({size=10,color=T.o}){
  return <svg width={size} height={size} viewBox="0 0 10 10">
    <circle cx="5" cy="5" r="4.5" fill={color}/>
    <path d="M1.5 3.5 Q5 2 8.5 3.5 M1.5 6.5 Q5 8 8.5 6.5" stroke="var(--t1)" strokeWidth=".5" fill="none" opacity=".7"/>
  </svg>;
}

export function BallSpinner(){
  return(
    <div style={{position:'relative',width:80,height:80,animation:'spin 4s linear infinite'}}>
      {[0,1,2,3,4,5,6,7].map(i=>(
        <div key={i} style={{position:'absolute',top:'50%',left:'50%',marginTop:-5,marginLeft:-5,
          transform:`rotate(${i*45}deg) translateX(28px)`,
          opacity: 0.25 + (i/7)*0.75}}>
          <MiniBall size={10}/>
        </div>
      ))}
    </div>
  );
}

/* ─── Provider glyphs (Login / Register) ──────────────────────── */
export function GoogleGlyph({size=18}){
  return(<svg width={size} height={size} viewBox="0 0 18 18">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>);
}
export function AppleGlyph({size=20}){
  return(<svg width={size} height={size} viewBox="0 0 384 512" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.1 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>);
}

/* ─── Person glyph (avatar fallback) ──────────────────────────── */
export function PersonGlyph({size=22}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M 4.5 20 Q 4.5 14 12 14 Q 19.5 14 19.5 20"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
  </svg>);
}

/* ─── Hero visuals (Rules / Journey landings) ─────────────────── */
export function HeroRulesVisual(){
  return(
    <img src={`${getAssetBase()}assets/regelwerkhero.jpeg`}
      style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
      alt="Regelwerk"/>
  );
}

export function HeroJourneyVisual(){
  return(
    <img src={`${getAssetBase()}assets/journeyhero.jpeg`}
      style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
      alt="Journey"/>
  );
}

/* ─── Settings / Post — Line-Art Icons ─────────────────────────────
   Alle minimal, gleicher Stroke-Width (1.8), durchgängig
   `currentColor` damit sie sich in Card-Kontext einfach umfärben lassen.
─────────────────────────────────────────────────────────────────── */

// Lenkrad — Steuerung
export function SteeringWheelIcon({size=24,color='currentColor'}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="1.6" fill={color}/>
    <line x1="12" y1="3" x2="12" y2="10.4"/>
    <line x1="3" y1="12" x2="10.4" y2="13.6"/>
    <line x1="21" y1="12" x2="13.6" y2="13.6"/>
  </svg>);
}

// Palette — Anpassung
export function PaletteIcon({size=24,color='currentColor'}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a9 9 0 1 0 0 18 2.5 2.5 0 0 0 2-4c-.5-1-.3-2 .7-2.4l2-.6A4 4 0 0 0 21 11
             a9 9 0 0 0-9-8z"/>
    <circle cx="8"   cy="11" r=".8" fill={color}/>
    <circle cx="11"  cy="7.5" r=".8" fill={color}/>
    <circle cx="15.5" cy="9" r=".8" fill={color}/>
  </svg>);
}

// Auge — Privatsphäre
export function EyeIcon({size=24,color='currentColor'}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>);
}

// Glocke — Benachrichtigungen
export function BellIcon({size=24,color='currentColor'}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 1 1 12 0c0 4 2 5 2 7H4c0-2 2-3 2-7z"/>
    <path d="M10 20a2 2 0 0 0 4 0"/>
  </svg>);
}

// Schloss — Sicherheit
export function LockIcon({size=24,color='currentColor'}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2"/>
    <path d="M8 11V8a4 4 0 1 1 8 0v3"/>
    <circle cx="12" cy="15.5" r="1.2" fill={color}/>
  </svg>);
}

// Tür mit Pfeil raus — "Ich muss hier raus!" / Konto löschen
export function DoorOutIcon({size=24,color='currentColor'}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3h5v18h-5"/>
    <path d="M3 12h11"/>
    <path d="M8 7l-5 5 5 5"/>
  </svg>);
}

// Chevron rechts — `>` ohne Stab, klar dünn, für Card-Affordance
export function ChevronRightIcon({size=18,color='currentColor'}){
  return(<svg width={size} height={size} viewBox="0 0 18 18" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 3 12 9 6 15"/>
  </svg>);
}

// AirPlay-Style "Cast"-Icon — Rechteck oben (Bildschirm) + Dreieck
// unten (Stream-Pfeil). Funktioniert auch ohne Vendor-Brand-Kontext
// als "Display-Mirror"-Sigil; auf Android/Win wird dieselbe Card für
// Miracast/Cast-to-Device verwendet.
export function AirPlayIcon({size=22,color='currentColor'}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {/* TV-Rahmen oben — offen an der Unterkante, damit das Dreieck "rein-streamt" */}
    <path d="M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1"/>
    {/* Stream-Dreieck */}
    <polygon points="12 14 17 20 7 20" fill={color} stroke="none"/>
  </svg>);
}

// RITMO Post — Mash aus Glocke + Chat-Bubble, line art.
// Die Glocke sitzt rechts-unten als Notification-Sigil über der Chat-Bubble.
export function RitmoPostIcon({size=24,color='currentColor'}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Speech bubble — abgerundetes Rechteck mit "Tail" links unten */}
    <path d="M3 6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-4 3.5V6z"/>
    {/* Bell badge — kleine Glocke rechts-unten überlappt die Bubble */}
    <g transform="translate(13.5 11)">
      <path d="M0 4a3 3 0 1 1 6 0c0 2 1 2.5 1 3.5H-1C-1 6.5 0 6 0 4z" fill={color === 'currentColor' ? 'var(--bg)' : '#0A0A0A'}/>
      <path d="M0 4a3 3 0 1 1 6 0c0 2 1 2.5 1 3.5H-1C-1 6.5 0 6 0 4z"/>
      <path d="M2 8.5a1 1 0 0 0 2 0"/>
    </g>
  </svg>);
}
