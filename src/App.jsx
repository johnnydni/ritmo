import { useState, useEffect, useLayoutEffect, useReducer, useCallback, useMemo, useRef, Fragment } from "react";
import { SKILL_DESCRIPTIONS } from "./skillDescriptions.js";
import { loadProfile as dbLoadProfile, saveProfile as dbSaveProfile, logMatch as dbLogMatch, loadMatchStats as dbLoadMatchStats,
  createOnlineTournament, joinOnlineTournament, fetchOnlineTournament, updateOnlineTournament, subscribeToTournament,
  publishTournamentState, submitScore, approveScore, rejectScore, sendReadyCheck, confirmReady, clearReadyCheck,
  checkBetaKey, redeemBetaKey, deleteMyMatches as dbDeleteMyMatches,
  logMatchLocal, loadMatchStatsLocal as dbLoadMatchStatsLocal, clearMatchLog,
  // Social layer
  fetchPublicProfile, searchPlayers, followUser, unfollowUser, followCounts, isFollowing,
  listFollowers, listFollowing,
  listClubs, fetchClub, createClub, joinClub, leaveClub, clubMembers, isClubMember,
  clubMemberCount, updateClub, myOwnedClubId,
  listClubMessages, sendClubMessage, markChatRead, listMyChats, totalUnreadCount,
  subscribeClubMessages,
  // DNA Cup Cloud-Sync
  createCupSync, fetchCupSync, pushCupSync, subscribeCupSync,
  // DNA Liga
  createLigaSync, fetchLigaSync, pushLigaSync, subscribeLigaSync
  } from "./db.js";
import { LIGA_PHASES, LIGA_GROUPS, initialLigaState, ligaAddParticipant,
  ligaFormTeams, ligaAssignGroups, genGroupMatches, ligaGroupTable, ligaDnaBoard,
  genViertelfinale, genNextKoRound, ligaReportResult, ligaConfirmResult,
  ligaDisputeResult, ligaTeamLabel, ligaTeamOfUser, ligaMyOpenAction,
  ligaMatchTier } from "./liga.js";

/* ── Refactor (Phase 1): pure modules extracted from App.jsx.
   Components, screens and routing remain colocated here for now;
   only side-effect-free units are split out. See CLAUDE.md. */
import { T, CSS, rgba } from "./theme.js";
import { lsGet, lsSet, getAssetBase, getInitials, readImageAsDataUrl, resizeImage, safeImageSrc, buzz } from "./utils.js";
import { getLevelLabel, getLevelTier, getLevelColor, estimateLevel } from "./levels.js";
import { B0, A0, PL, ptD, wG, bo3R, amR, DEFCFG } from "./game.js";
import { PCOLS, shuffle, genAmericanoRound, genMexicanoRound, calcLeaderboard, FORMATS, genRound } from "./tournament.js";
import { RINGS, playRing, unlockAudio } from "./audio.js";
import { auth } from "./auth.js";
import {
  RitmoWordmark, RitmoSplashLogo, CourtIcon, RacketMini, TrophyIcon, JoinIcon,
  SingleMatchIcon, BestOfThreeIcon,
  HomeIcon, LiveIcon, GearIcon, SearchIcon, Hl, DNAIcon, FullscreenIcon, EditIcon,
  ExitFullscreenIcon, KiwiIcon, PineappleIcon, CoconutIcon, TennisBallIcon, ParrotIcon,
  FunkyFruitsRow, BookIcon, JourneyIcon, ArrowRightCircleIcon, WandIcon,
  MiniBall, BallSpinner, GoogleGlyph, AppleGlyph, AppStoreIcon, PersonGlyph,
  HeroRulesVisual, HeroJourneyVisual,
  // Settings + RITMO Post line-art icons
  SteeringWheelIcon, PaletteIcon, EyeIcon, BellIcon, LockIcon, DoorOutIcon,
  ChevronRightIcon, AirPlayIcon, CoffeeCupIcon,
  ArchetypeGlyph, PauseIcon,
  // Emoji-Ersatz-Glyphen
  HeartIcon, MedalIcon, PhoneIcon, KeyboardIcon, RingIcon, WatchIcon, FlicIcon,
  MoonIcon, SunIcon, LeafIcon, TargetIcon, ScrollIcon, StopwatchIcon, MaskIcon,
  PeopleIcon, HandIcon, WarnIcon, SkipIcon, LaptopIcon, MonitorIcon,
  MenuIcon,
} from "./icons.jsx";
import { PADEL_STYLES, PADEL_QUIZ, computeStyle, computeStyles, computeMatchTier, STYLE_IMAGES } from "./padelStyles.js";
import { CUP_PIN, CUP_PHASES, CUP_ALERTS, CUP_WARN, initialCupState, cupLeaderboard, cupMatchTier,
  genCupKO, genCupCourageHF, genCupHF, genCupFinals, cupPlayerLabel, cupDuplicateNums } from "./dnaCup.js";
import GlassSurface from "./GlassSurface.jsx";

/* ═══════════════════════════════════════════════════════════════
   Theme/CSS, helpers, reducers, auth, audio and icons all live in
   their dedicated modules now (imports above). The remainder of
   this file holds the screens and the root <App/> component that
   wires them together via the `scr` state machine.
═══════════════════════════════════════════════════════════════ */


/* ─── Landing pages ─────────────────────────────────────────── */
function RulesLanding({onHome,onContinue,onMarkRead,alreadyRead}){
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden'}}>
      {/* Header */}
      <div style={{paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',
        padding:'calc(env(safe-area-inset-top,0px) + 60px) 22px 18px',
        flexShrink:0,zIndex:2,background:T.bg}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <BookIcon size={32}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:26,fontWeight:800,letterSpacing:-.3}}>Regelwerk</div>
            <div style={{color:T.t2,fontSize:16,marginTop:2,fontWeight:400}}>
              Padel-Regeln, Formate, Begriffe.
            </div>
          </div>
          <QuestionToggle filled={alreadyRead} onClick={onMarkRead}/>
        </div>
      </div>

      {/* Hero */}
      <div className="fi" style={{width:'100%',flexShrink:0,
        height:'clamp(220px,42vh,420px)',overflow:'hidden',
        borderTop:`1px solid ${T.sep}`,borderBottom:`1px solid ${T.sep}`}}>
        <HeroRulesVisual/>
      </div>

      {/* Title + description */}
      <div style={{flex:1,padding:'24px 22px 16px',overflowY:'auto',
        display:'flex',flexDirection:'column'}}>
        <div className="fi" style={{color:T.t1,fontSize:36,fontWeight:900,
          letterSpacing:-.6,lineHeight:1,animationDelay:'.05s'}}>Padel Up</div>
        <div className="fu" style={{color:T.t2,fontSize:15,marginTop:14,lineHeight:1.55,
          fontWeight:400,animationDelay:'.15s'}}>
          Die Regeln zu verstehen ist die Basis für jedes gute Spiel. Wer sie
          verinnerlicht hat, spielt entspannter, fairer und kann sich auf das
          Wesentliche konzentrieren — Strategie, Schlagwahl, Teamwork.
        </div>
      </div>

      <MatchBar onHome={onHome} rightButtons={[
        {icon:<ArrowRightCircleIcon size={22}/>,onClick:onContinue}
      ]}/>
    </div>
  );
}

function JourneyLanding({onHome,onContinue,onMarkRead,alreadyRead}){
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'calc(env(safe-area-inset-top,0px) + 60px) 22px 18px',
        flexShrink:0,zIndex:2,background:T.bg}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <JourneyIcon size={32}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:26,fontWeight:800,letterSpacing:-.3}}>Journey</div>
            <div style={{color:T.t2,fontSize:16,marginTop:2,fontWeight:400}}>
              Tipps & Tricks für dein Padel-Spiel.
            </div>
          </div>
          <QuestionToggle filled={alreadyRead} onClick={onMarkRead}/>
        </div>
      </div>

      {/* Hero */}
      <div className="fi" style={{width:'100%',flexShrink:0,
        height:'clamp(220px,42vh,420px)',overflow:'hidden',
        borderTop:`1px solid ${T.sep}`,borderBottom:`1px solid ${T.sep}`}}>
        <HeroJourneyVisual/>
      </div>

      {/* Title + description */}
      <div style={{flex:1,padding:'24px 22px 16px',overflowY:'auto',
        display:'flex',flexDirection:'column'}}>
        <div className="fi" style={{color:T.t1,fontSize:36,fontWeight:900,
          letterSpacing:-.6,lineHeight:1,animationDelay:'.05s'}}>Spielsinn</div>
        <div className="fu" style={{color:T.t2,fontSize:15,marginTop:14,lineHeight:1.55,
          fontWeight:400,animationDelay:'.15s'}}>
          Regeln sind die Pflicht, Spielsinn ist die Kür. Wer Schlagwahl,
          Position und Material versteht, gewinnt nicht über Power, sondern über
          Köpfchen — und genau dorthin führt diese Sektion.
        </div>
      </div>

      <MatchBar onHome={onHome} rightButtons={[
        {icon:<ArrowRightCircleIcon size={22}/>,onClick:onContinue}
      ]}/>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   ServiceIndicator — top-down court showing serve direction.
   In padel: ball must land in the diagonally opposite service box.
   - servingTeam: 'A' (bottom) or 'B' (top)
   - isDeuce: true → server's right (Einstand-Seite), false → ad/left
─────────────────────────────────────────────────────────────── */
function ServiceIndicator({servingTeam,isDeuce}){
  // Diagonals across the net: BR↔TL, BL↔TR.
  let stanceX,stanceY,targetBoxX,targetBoxY,ballX,ballY;
  if(servingTeam==='A'){
    stanceY=114;
    if(isDeuce){stanceX=60;targetBoxX=4;targetBoxY=32;ballX=22;ballY=46;}
    else{stanceX=20;targetBoxX=40;targetBoxY=32;ballX=58;ballY=46;}
  } else {
    stanceY=6;
    if(isDeuce){stanceX=20;targetBoxX=40;targetBoxY=60;ballX=58;ballY=74;}
    else{stanceX=60;targetBoxX=4;targetBoxY=60;ballX=22;ballY=74;}
  }
  const teamColor=servingTeam==='A'?T.o:T.blue;
  const lineCol='rgba(255,255,255,0.55)';

  return(
    <svg viewBox="0 0 80 120" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <marker id="svArrow" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
          <polygon points="0 0, 5 2.5, 0 5" fill="#FFE600"/>
        </marker>
      </defs>
      {/* Court outline */}
      <rect x="3" y="3" width="74" height="114" rx="2"
        fill="rgba(255,255,255,0.04)" stroke={lineCol} strokeWidth="1.4"/>
      {/* Net */}
      <line x1="3" y1="60" x2="77" y2="60" stroke={lineCol} strokeWidth="2"
        strokeDasharray="2 1.5"/>
      {/* Service lines */}
      <line x1="3" y1="32" x2="77" y2="32" stroke={lineCol} strokeWidth=".9"/>
      <line x1="3" y1="88" x2="77" y2="88" stroke={lineCol} strokeWidth=".9"/>
      {/* Center service line */}
      <line x1="40" y1="32" x2="40" y2="88" stroke={lineCol} strokeWidth=".9"/>
      {/* Target service box highlight */}
      <rect x={targetBoxX} y={targetBoxY} width="36" height="28"
        fill={teamColor} fillOpacity="0.20"
        stroke={teamColor} strokeWidth="1.5"/>
      {/* Server stance */}
      <circle cx={stanceX} cy={stanceY} r="2.8" fill={teamColor}/>
      {/* Trajectory */}
      <line x1={stanceX} y1={stanceY} x2={ballX} y2={ballY}
        stroke="#FFE600" strokeWidth="1.4" strokeLinecap="round"
        strokeDasharray="3 2" markerEnd="url(#svArrow)" opacity="0.85"/>
      {/* Tennis ball */}
      <circle cx={ballX} cy={ballY} r="3" fill="#E8FF3D" stroke="rgba(0,0,0,.4)" strokeWidth="0.4"/>
      <path d={`M${ballX-2.4} ${ballY-1} Q${ballX} ${ballY-2.5} ${ballX+2.4} ${ballY-1}`}
        stroke="rgba(255,255,255,.6)" strokeWidth=".35" fill="none"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BETA LANDING — Pre-Auth Marketing Screen

   Wird nach dem Splash gezeigt, solange der User nicht eingeloggt ist.
   Kommuniziert "Store-Release-Bald" + verweist Beta-Tester per Klick
   auf Login / Registrierung. Im Browser-Build die erste echte Seite,
   die ein neuer Besucher sieht.

   Visuell: schwarzer Hintergrund + RITMO-Logo, dezent darunter die
   beiden Store-"Badges" als Bauhaus-Style-Pillen (Play-Dreieck +
   Apple-Logo) — keine offiziellen Store-Buttons, weil die App noch
   nicht im jeweiligen Store liegt; es ist eine reine Ankündigung.
═══════════════════════════════════════════════════════════════ */
function BetaLanding({onLogin,onRegister}){
  return(
    <div style={{minHeight:'100dvh',background:T.bgGrad,color:T.t1,
      display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 40px)',
      paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 32px)',
      paddingLeft:24,paddingRight:24,position:'relative',overflow:'hidden'}}>

      {/* Hero — Logo + Coming-Soon Anchor */}
      <div className="fi" style={{flex:1,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',gap:34,textAlign:'center'}}>

        <RitmoSplashLogo size={200}/>

        <div style={{maxWidth:340,display:'flex',flexDirection:'column',gap:18}}>
          <div style={{color:T.t3,fontSize:11,fontWeight:800,letterSpacing:2.5,
            textTransform:'uppercase'}}>Coming Soon</div>
          <div style={{color:T.t1,fontSize:24,fontWeight:900,letterSpacing:-.4,lineHeight:1.2,
            fontStyle:'italic'}}>
            Bald im Google Play Store<br/>und App Store erhältlich!
          </div>
        </div>

        {/* Store-"Badges" — keine offiziellen Marken, sondern Bauhaus-Pillen
            mit Play-Dreieck bzw. Apple-Logo. */}
        <div className="fu" style={{display:'flex',gap:10,flexWrap:'wrap',
          justifyContent:'center',animationDelay:'.1s'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',
            background:T.card,border:`1px solid ${T.border}`,borderRadius:13,
            color:T.t2,opacity:.85}}>
            {/* Google Play Dreieck — multi-stop gradient als Hommage */}
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <linearGradient id="ritmo-play-a" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFC107"/>
                  <stop offset="1" stopColor="#FF7A1A"/>
                </linearGradient>
                <linearGradient id="ritmo-play-b" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#0A84FF"/>
                  <stop offset="1" stopColor="#7DD3FC"/>
                </linearGradient>
                <linearGradient id="ritmo-play-c" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#34C759"/>
                  <stop offset="1" stopColor="#A7F3D0"/>
                </linearGradient>
                <linearGradient id="ritmo-play-d" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FF375F"/>
                  <stop offset="1" stopColor="#E84545"/>
                </linearGradient>
              </defs>
              <path d="M4.5 2.5v19l8-9.5z" fill="url(#ritmo-play-b)"/>
              <path d="M12.5 12L4.5 2.5l13.2 7.6z" fill="url(#ritmo-play-c)"/>
              <path d="M12.5 12L4.5 21.5l13.2-7.6z" fill="url(#ritmo-play-d)"/>
              <path d="M17.7 10.1l3.3 1.9-3.3 1.9-5.2-2z" fill="url(#ritmo-play-a)"/>
            </svg>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:.8,color:T.t3,
                textTransform:'uppercase'}}>Bald auf</div>
              <div style={{fontSize:13,fontWeight:800,color:T.t1,letterSpacing:.2}}>Google Play</div>
            </div>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',
            background:T.card,border:`1px solid ${T.border}`,borderRadius:13,
            color:T.t2,opacity:.85}}>
            <AppStoreIcon size={24}/>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:.8,color:T.t3,
                textTransform:'uppercase'}}>Bald im</div>
              <div style={{fontSize:13,fontWeight:800,color:T.t1,letterSpacing:.2}}>Apple App Store</div>
            </div>
          </div>
        </div>
      </div>

      {/* Beta CTA — unten zentriert */}
      <div className="fu" style={{flexShrink:0,display:'flex',flexDirection:'column',
        alignItems:'center',gap:14,paddingTop:24,animationDelay:'.18s'}}>

        <div style={{maxWidth:340,textAlign:'center'}}>
          <div style={{color:T.o,fontSize:13,fontWeight:800,letterSpacing:.3,marginBottom:6}}>
            Du hast einen Beta-Zugangscode?
          </div>
          <div style={{color:T.t2,fontSize:13,lineHeight:1.5,fontWeight:500}}>
            Teste schon jetzt — hier geht es zu Login&nbsp;/&nbsp;Registrierung.
          </div>
        </div>

        <div style={{display:'flex',gap:10,width:'100%',maxWidth:340}}>
          <button onClick={onLogin}
            style={{flex:1,padding:'14px 16px',background:T.card,
              border:`1px solid ${T.border}`,borderRadius:15,
              color:T.t1,fontSize:16,fontWeight:800,letterSpacing:.3,
              cursor:'pointer',transition:'background .15s'}}
            onPointerDown={e=>e.currentTarget.style.background=T.card2}
            onPointerUp={e=>e.currentTarget.style.background=T.card}
            onPointerLeave={e=>e.currentTarget.style.background=T.card}>
            Login
          </button>
          <button onClick={onRegister}
            style={{flex:1,padding:'14px 16px',background:T.o,border:'none',borderRadius:15,
              color:'#000',fontSize:16,fontWeight:800,letterSpacing:.3,
              cursor:'pointer',boxShadow:'0 6px 18px var(--oGlow)'}}>
            Registrierung
          </button>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPLASH SCREEN
═══════════════════════════════════════════════════════════════ */
function Splash({onDone}){
  // Nach ~4 s öffnet die App automatisch (vorher hing das am
  // animationend des Ladebalkens); ein Tap überspringt sofort.
  const doneRef=useRef(false);
  const finish=()=>{ if(doneRef.current) return; doneRef.current=true; onDone(); };
  useEffect(()=>{
    const t=setTimeout(finish,4000);
    return()=>clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  return(
    <div onClick={finish} style={{height:'100dvh',width:'100vw',
      /* Ladebildschirm IMMER schwarz — bewusst hartkodiert (#000),
         unabhängig vom gewählten Theme. */
      background:'#000',position:'relative',overflow:'hidden',
      cursor:'pointer',userSelect:'none'}}>
      {/* Loading-Video — füllt den Screen auf schwarzem Grund. */}
      <video
        src={`${getAssetBase()}assets/ritmo-loadingscreen.mp4`}
        autoPlay muted playsInline loop preload="auto" aria-hidden="true"
        style={{position:'absolute',inset:0,width:'100%',height:'100%',
          objectFit:'contain',background:'#000',pointerEvents:'none'}}/>

      {/* Pulsierende RITMO-Streifen statt Ladebalken — schlicht, im
          Loop (Echo der Logo-Speed-Lines), knapp unter dem Splash-Logo.
          Brand-Orange bewusst hartkodiert wie der schwarze Grund. */}
      <div style={{position:'absolute',left:0,right:0,top:'47%',
        display:'flex',justifyContent:'center',pointerEvents:'none',zIndex:2}}>
        <div style={{display:'flex',flexDirection:'column',gap:7}}>
          {[64,42,26].map((w,i)=>(
            <span key={i} style={{width:w,height:5.5,borderRadius:3,
              background:'#FF7A1A',transformOrigin:'left center',
              animation:`stripePulse 1.5s ease-in-out ${i*0.18}s infinite`,
              display:'block'}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN — RITMO + (Google/Apple placeholders)
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   FIRST-LAUNCH DISCLAIMER — einmaliger Hinweis beim ersten Start
═══════════════════════════════════════════════════════════════ */
function WelcomeNotice({onConfirm}){
  return(
    <div style={{position:'fixed',inset:0,zIndex:1000,
      background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)',
      display:'flex',alignItems:'center',justifyContent:'center',
      padding:'24px',animation:'fadeIn .25s ease'}}>
      <div className="si" style={{
        maxWidth:380,width:'100%',background:T.card,
        border:`1px solid ${T.border}`,borderRadius:23,
        padding:'28px 24px 22px',
        boxShadow:'0 24px 48px rgba(0,0,0,0.55)'}}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
          <RitmoSplashLogo size={80}/>
        </div>
        <div style={{color:T.t1,fontSize:13,lineHeight:1.6,textAlign:'center',
          marginBottom:22,letterSpacing:.1}}>
          Die App ist aktuell in Entwicklung und wird sich noch viel ändern.
          Sei nicht zu böse, wenn etwas nicht funktioniert. It's all about Padel.
          <div style={{marginTop:10,color:T.o,fontWeight:700}}>
            Dein RITMO-Team {'<3'}
          </div>
        </div>
        <button onClick={onConfirm}
          style={{width:'100%',background:T.o,border:'none',borderRadius:15,
            padding:'13px 16px',color:'#000',fontSize:15,fontWeight:800,letterSpacing:.3,
            cursor:'pointer',boxShadow:'0 4px 14px var(--oGlow)'}}>
          OK
        </button>
      </div>
    </div>
  );
}

/* ── Anzeige-Name: Spitzname hat Vorrang vor dem echten Namen. ── */
function displayName(p){
  return (p&&(p.nickname||'').trim())||(p&&(p.name||'').trim())||'Spieler';
}

/* ═══ Login-Drosselung (clientseitig, eskalierend) ═══
   Ab dem 3. Fehlversuch in Folge greift eine Sperre: 1 → 3 → 10 → 30 min
   (kappt bei 30). Reiner Brute-Force-Deterrent im Browser; das echte
   Rate-Limiting macht Supabase serverseitig. Ein erfolgreicher Login
   setzt den Zähler zurück. Persistiert in localStorage (übersteht Reload). */
const LOGIN_LOCK_TIERS=[1,3,10,30]; // Minuten
const LOGIN_THROTTLE_KEY='ritmo_login_throttle';
function readLoginThrottle(){
  const t=lsGet(LOGIN_THROTTLE_KEY,null);
  return (t&&typeof t==='object')?{fails:t.fails||0,lockUntil:t.lockUntil||0}:{fails:0,lockUntil:0};
}
function recordLoginFail(){
  const t=readLoginThrottle();
  const fails=t.fails+1;
  let lockUntil=0;
  if(fails>=3){
    const tier=Math.min(fails-3,LOGIN_LOCK_TIERS.length-1);
    lockUntil=Date.now()+LOGIN_LOCK_TIERS[tier]*60000;
  }
  const next={fails,lockUntil};
  lsSet(LOGIN_THROTTLE_KEY,next);
  return next;
}
function clearLoginThrottle(){ lsSet(LOGIN_THROTTLE_KEY,{fails:0,lockUntil:0}); }
function fmtLockRemain(ms){
  const s=Math.max(0,Math.ceil(ms/1000));
  const m=Math.floor(s/60), ss=s%60;
  return m>0?`${m}:${String(ss).padStart(2,'0')} min`:`${ss}s`;
}

/* ═══ Länder (DACH) für die Telefon-Vorwahl bei der Registrierung ═══ */
const PHONE_COUNTRIES=[
  {code:'DE',dial:'+49',name:'Deutschland'},
  {code:'AT',dial:'+43',name:'Österreich'},
  {code:'CH',dial:'+41',name:'Schweiz'},
];
/* Schlichte SVG-Flaggen (keine Emojis — renderkonsistent über alle OS). */
function FlagIcon({code,size=20}){
  const w=size, h=Math.round(size*0.72);
  const box={borderRadius:3,display:'block',flexShrink:0,border:`1px solid ${T.border}`};
  if(code==='DE') return(
    <svg width={w} height={h} viewBox="0 0 30 21" style={box} aria-hidden="true">
      <rect width="30" height="7" y="0" fill="#000"/>
      <rect width="30" height="7" y="7" fill="#DD0000"/>
      <rect width="30" height="7" y="14" fill="#FFCE00"/>
    </svg>
  );
  if(code==='AT') return(
    <svg width={w} height={h} viewBox="0 0 30 21" style={box} aria-hidden="true">
      <rect width="30" height="7" y="0" fill="#ED2939"/>
      <rect width="30" height="7" y="7" fill="#fff"/>
      <rect width="30" height="7" y="14" fill="#ED2939"/>
    </svg>
  );
  // CH — quadratisch, weißes Kreuz auf Rot
  return(
    <svg width={h} height={h} viewBox="0 0 21 21" style={box} aria-hidden="true">
      <rect width="21" height="21" fill="#D52B1E"/>
      <rect x="9" y="4" width="3" height="13" fill="#fff"/>
      <rect x="4" y="9" width="13" height="3" fill="#fff"/>
    </svg>
  );
}

function Login({onSuccess,onRegister}){
  const[username,setUsername]=useState('');
  const[password,setPassword]=useState('');
  const[error,setError]=useState('');
  const[shake,setShake]=useState(false);
  const[busy,setBusy]=useState(false);

  // Eskalierende Login-Sperre (siehe recordLoginFail). lockUntil aus
  // localStorage gelesen → übersteht Reload; nowTs tickt für den
  // Live-Countdown im Button/Fehlertext.
  const[lockUntil,setLockUntil]=useState(()=>readLoginThrottle().lockUntil);
  const[nowTs,setNowTs]=useState(()=>Date.now());
  const locked=lockUntil>nowTs;
  const lockRemain=Math.max(0,lockUntil-nowTs);
  useEffect(()=>{
    if(lockUntil<=Date.now()) return;
    const id=setInterval(()=>{
      const n=Date.now(); setNowTs(n);
      if(n>=lockUntil) clearInterval(id);
    },500);
    return()=>clearInterval(id);
  },[lockUntil]);

  // Passwort-Reset-Inline-Flow
  const[resetMode,setResetMode]=useState(false);
  const[resetEmail,setResetEmail]=useState('');
  const[resetSent,setResetSent]=useState(false);
  const[resetBusy,setResetBusy]=useState(false);
  const[resetError,setResetError]=useState('');

  const fail=(msg)=>{
    setError(msg);
    setShake(true);
    setTimeout(()=>setShake(false),420);
  };

  const submitReset=async()=>{
    setResetBusy(true);setResetError('');
    try{
      await auth.requestPasswordReset(resetEmail);
      setResetSent(true);
    }catch(e){
      setResetError(e.message||'Reset fehlgeschlagen');
    }finally{setResetBusy(false);}
  };

  const tryLogin=async()=>{
    if(lockUntil>Date.now()){
      fail(`Zu viele Versuche — gesperrt für ${fmtLockRemain(lockUntil-Date.now())}.`);
      return;
    }
    setBusy(true);setError('');
    try{
      const result=await auth.signInWithEmail(username,password);
      clearLoginThrottle(); setLockUntil(0);
      onSuccess(result);
    }catch(e){
      // Jeder Fehlversuch zählt; ab dem 3. greift die eskalierende Sperre.
      const t=recordLoginFail();
      setLockUntil(t.lockUntil); setNowTs(Date.now());
      if(t.lockUntil>Date.now()){
        fail(`Zu viele Fehlversuche — gesperrt für ${fmtLockRemain(t.lockUntil-Date.now())}.`);
      }else{
        const left=Math.max(0,3-t.fails);
        fail((e.message||'Anmeldung fehlgeschlagen')+(left>0?` · noch ${left} Versuch${left===1?'':'e'}`:''));
      }
    }finally{setBusy(false);}
  };

  const onKeyDown=(e)=>{ if(e.key==='Enter'&&!locked) tryLogin(); };

  return(
    <div style={{minHeight:'100dvh',background:T.bgGrad,display:'flex',
      flexDirection:'column',alignItems:'center',justifyContent:'center',
      padding:'calc(env(safe-area-inset-top,0px) + 40px) 22px calc(env(safe-area-inset-bottom,0px) + 40px)',
      overflow:'auto'}}>
      <style>{`
        @keyframes shakeBox {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
        .login-shake{animation:shakeBox .42s ease}
      `}</style>

      <div className={`fi ${shake?'login-shake':''}`}
        style={{width:'100%',maxWidth:380,display:'flex',flexDirection:'column',alignItems:'stretch'}}>

        {/* Logo + Title */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,marginBottom:32}}>
          <RitmoSplashLogo size={120}/>
          <div style={{color:T.t1,fontSize:24,fontWeight:800,letterSpacing:-.3}}>RITMO Log-In</div>
        </div>

        {/* Google — disabled (OAuth folgt) */}
        <button disabled
          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,
            background:T.card,border:`1px solid ${T.border}`,borderRadius:15,
            padding:'13px 16px',color:T.t2,fontSize:15,fontWeight:600,
            cursor:'not-allowed',marginBottom:10,position:'relative'}}>
          <GoogleGlyph size={18}/>
          <span>Mit Google anmelden</span>
          <span style={{position:'absolute',top:6,right:10,fontSize:9,fontWeight:700,
            letterSpacing:.5,color:T.t3,textTransform:'uppercase'}}>bald</span>
        </button>

        {/* Apple — disabled bis Apple Dev Program aktiv */}
        <button disabled
          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,
            background:'#000',border:'1px solid rgba(255,255,255,.08)',borderRadius:15,
            padding:'13px 16px',color:'rgba(255,255,255,.4)',fontSize:15,fontWeight:600,
            cursor:'not-allowed',marginBottom:22,position:'relative'}}>
          <AppleGlyph size={18}/>
          <span>Mit Apple anmelden</span>
          <span style={{position:'absolute',top:6,right:10,fontSize:9,fontWeight:700,
            letterSpacing:.5,color:T.t1,textTransform:'uppercase'}}>bald</span>
        </button>

        {/* Divider */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
          <div style={{flex:1,height:1,background:T.border}}/>
          <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.5}}>ODER MIT RITMO</div>
          <div style={{flex:1,height:1,background:T.border}}/>
        </div>

        {/* Email */}
        <div style={{marginBottom:10}}>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>E-Mail</div>
          <input value={username} onChange={e=>{setUsername(e.target.value);setError('');}}
            onKeyDown={onKeyDown} autoComplete="email" type="email"
            autoCapitalize="off" autoCorrect="off" spellCheck={false}
            placeholder="du@example.com"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
              outline:'none',boxSizing:'border-box'}}/>
        </div>

        {/* Password */}
        <div style={{marginBottom:16}}>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Passwort</div>
          <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError('');}}
            onKeyDown={onKeyDown} autoComplete="current-password"
            placeholder="••••••••"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
              outline:'none',boxSizing:'border-box'}}/>
        </div>

        {/* Error */}
        {error&&(
          <div style={{background:'rgba(232,69,69,.12)',border:'1px solid rgba(232,69,69,.4)',
            borderRadius:8,padding:'9px 12px',marginBottom:12,
            color:'#FF6B6B',fontSize:12,fontWeight:600,letterSpacing:.2}}>
            {error}
          </div>
        )}

        {/* Submit — bei aktiver Sperre disabled + Live-Countdown */}
        <button onClick={tryLogin} disabled={busy||locked}
          style={{background:locked?T.card2:T.o,border:locked?`1px solid ${T.border}`:'none',
            borderRadius:15,
            padding:'14px 16px',color:locked?T.t2:'#000',fontSize:15,fontWeight:800,letterSpacing:.2,
            cursor:(busy||locked)?'not-allowed':'pointer',opacity:busy?.6:1,
            boxShadow:locked?'none':'0 4px 14px var(--oGlow)'}}>
          {locked?`Gesperrt · ${fmtLockRemain(lockRemain)}`:(busy?'…':'Anmelden')}
        </button>

        {/* Passwort vergessen */}
        <div style={{display:'flex',justifyContent:'center',marginTop:12}}>
          <button onClick={()=>{setResetMode(m=>!m);setResetError('');setResetSent(false);}}
            style={{background:'none',border:'none',color:T.t2,fontSize:12,
              fontWeight:600,cursor:'pointer',padding:'4px 8px',textDecoration:'underline'}}>
            Passwort vergessen?
          </button>
        </div>

        {resetMode&&(
          <div className="fi" style={{marginTop:10,background:T.card2,
            border:`1px solid ${T.border}`,borderRadius:15,padding:'14px 14px 12px'}}>
            {resetSent?(
              <div style={{color:T.g,fontSize:13,fontWeight:600,textAlign:'center',
                padding:'6px 0'}}>
                ✓ Reset-Mail gesendet — prüfe dein Postfach.
              </div>
            ):(<>
              <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
                textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>E-Mail für Reset</div>
              <input value={resetEmail}
                onChange={e=>{setResetEmail(e.target.value);setResetError('');}}
                onKeyDown={e=>{if(e.key==='Enter') submitReset();}}
                autoComplete="email" type="email"
                autoCapitalize="off" autoCorrect="off" spellCheck={false}
                placeholder="du@example.com"
                style={{width:'100%',background:T.bg,border:`1px solid ${T.border}`,
                  borderRadius:13,padding:'10px 12px',color:T.t1,fontSize:13,fontWeight:500,
                  outline:'none',boxSizing:'border-box',marginBottom:10}}/>
              {resetError&&(
                <div style={{color:'#FF6B6B',fontSize:11,fontWeight:600,
                  marginBottom:8,paddingLeft:2}}>{resetError}</div>
              )}
              <button onClick={submitReset} disabled={resetBusy}
                style={{width:'100%',background:T.o,border:'none',borderRadius:13,
                  padding:'10px 14px',color:'#000',fontSize:13,fontWeight:800,
                  cursor:resetBusy?'not-allowed':'pointer',opacity:resetBusy?.6:1}}>
                {resetBusy?'Sende…':'Reset-Mail anfordern'}
              </button>
            </>)}
          </div>
        )}

        {/* Register */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:18,
          justifyContent:'center'}}>
          <div style={{color:T.t3,fontSize:12}}>Noch kein Account?</div>
          <button onClick={onRegister}
            style={{background:'none',border:'none',color:T.o,fontSize:13,
              fontWeight:700,cursor:'pointer',padding:'4px 8px',textDecoration:'underline'}}>
            Registrieren
          </button>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REGISTER — Email Signup + OAuth Optionen
═══════════════════════════════════════════════════════════════ */
function Register({onSuccess,onLogin,onNeedsVerification}){
  // Multi-step Beta-Gate:
  //   step='key'  → User gibt einen Beta-Key ein, der über die
  //                 check_beta_key-RPC verifiziert wird.
  //   step='form' → Klassische E-Mail/Passwort-Registrierung.
  //                 Nach erfolgreichem signUp wird der gehaltene Key
  //                 atomar über redeem_beta_key eingelöst.
  // Der validierte Key wird zwischen Schritten in betaKey gehalten;
  // ein Abbruch/Reload setzt den Flow zurück (Key bleibt unverbraucht).
  const[step,setStep]=useState('key');
  const[betaKey,setBetaKey]=useState('');
  const[betaInput,setBetaInput]=useState('');
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[password2,setPassword2]=useState('');
  const[phone,setPhone]=useState('');
  const[phoneCountry,setPhoneCountry]=useState('DE');
  const[ccOpen,setCcOpen]=useState(false);
  const[error,setError]=useState('');
  const[shake,setShake]=useState(false);
  const[busy,setBusy]=useState(false);

  const fail=(msg)=>{
    setError(msg);
    setShake(true);
    setTimeout(()=>setShake(false),420);
  };

  const tryCheckKey=async()=>{
    const code=(betaInput||'').trim().toUpperCase();
    if(!code){ fail('Bitte Beta-Key eingeben'); return; }
    setBusy(true); setError('');
    try{
      const ok=await checkBetaKey(code);
      if(!ok){
        fail('Beta-Key ungültig oder bereits eingelöst');
        return;
      }
      setBetaKey(code);
      setStep('form');
    }catch(e){
      fail(e.message||'Beta-Key konnte nicht geprüft werden');
    }finally{ setBusy(false); }
  };

  const tryRegister=async()=>{
    if(password!==password2){
      fail('Passwörter stimmen nicht überein');
      return;
    }
    // Telefon: Pflichtfeld, nur Format-Check (DACH-Vorwahl + 6–14 Ziffern).
    const dial=PHONE_COUNTRIES.find(c=>c.code===phoneCountry)?.dial||'';
    const nat=(phone||'').replace(/[^\d]/g,'').replace(/^0+/,'');
    if(nat.length<6||nat.length>14){
      fail('Bitte gültige Telefonnummer eingeben.');
      return;
    }
    const fullPhone=dial+nat;
    setBusy(true);setError('');
    try{
      // Final guard: Beta-Key noch unverbraucht? Verhindert Edge-Case,
      // wenn jemand zwischen Schritten den Key woanders verbraucht hat.
      const stillOk=await checkBetaKey(betaKey);
      if(!stillOk){
        // Zurück auf Step 1 — Key ist tot, User muss einen neuen holen.
        setStep('key');
        setBetaKey('');
        setBetaInput('');
        fail('Beta-Key wurde inzwischen anderweitig eingelöst — bitte neuen Key eingeben.');
        return;
      }
      const r=await auth.signUpWithEmail(email,password,fullPhone);
      // Erst nach erfolgreichem signUp wird der Key atomar verbraucht.
      // Race-edge-case ist akzeptiert: Account funktioniert weiter, Key
      // wurde ggf. von jemand anderem gleichzeitig verbraucht.
      try{
        const redeemed=await redeemBetaKey(betaKey,r.email||email);
        if(!redeemed){
          console.warn('[beta] redeem returned false — race or expired key');
        }
      }catch(redeemErr){
        // Non-fatal: log only, der User hat den Account schon.
        console.warn('[beta] redeem failed (non-fatal):',redeemErr?.message);
      }
      if(r.needsVerification){
        onNeedsVerification(r.email);
      }else{
        onSuccess();
      }
    }catch(e){
      fail(e.message||'Registrierung fehlgeschlagen');
    }finally{setBusy(false);}
  };

  const onKeyDown=(e)=>{
    if(e.key!=='Enter') return;
    if(step==='key') tryCheckKey(); else tryRegister();
  };

  return(
    <div style={{minHeight:'100dvh',background:T.bgGrad,display:'flex',
      flexDirection:'column',alignItems:'center',justifyContent:'center',
      padding:'calc(env(safe-area-inset-top,0px) + 40px) 22px calc(env(safe-area-inset-bottom,0px) + 40px)',
      overflow:'auto'}}>
      <style>{`
        @keyframes shakeBox {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}80%{transform:translateX(5px)}
        }
        .reg-shake{animation:shakeBox .42s ease}
      `}</style>

      <div className={`fi ${shake?'reg-shake':''}`}
        style={{width:'100%',maxWidth:380,display:'flex',flexDirection:'column'}}>

        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,marginBottom:28}}>
          <RitmoSplashLogo size={110}/>
          <div style={{color:T.t1,fontSize:22,fontWeight:800,letterSpacing:-.3}}>
            {step==='key'?'Beta-Zugang':'Account erstellen'}
          </div>
          <div style={{color:T.t3,fontSize:12,textAlign:'center',maxWidth:280}}>
            {step==='key'
              ?'Die App ist aktuell in einer geschlossenen Beta. Mit deinem Beta-Key kannst du dich registrieren.'
              :'Beta-Key bestätigt — leg jetzt dein Konto an.'}
          </div>
        </div>

        {step==='key'?(
          /* ───── STEP 1: Beta-Key prüfen ───── */
          <Fragment>
            <div style={{marginBottom:14}}>
              <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
                textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Beta-Key</div>
              <input value={betaInput}
                onChange={e=>{setBetaInput(e.target.value.toUpperCase());setError('');}}
                onKeyDown={onKeyDown}
                autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                placeholder="RITMO-XXXX-XXXX"
                style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                  borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:700,
                  letterSpacing:1,outline:'none',boxSizing:'border-box',
                  fontFamily:'-apple-system,SFMono-Regular,Menlo,monospace'}}/>
            </div>

            {error&&(
              <div style={{background:'rgba(232,69,69,.12)',border:'1px solid rgba(232,69,69,.4)',
                borderRadius:8,padding:'9px 12px',marginBottom:12,
                color:'#FF6B6B',fontSize:12,fontWeight:600,letterSpacing:.2}}>
                {error}
              </div>
            )}

            <button onClick={tryCheckKey} disabled={busy}
              style={{background:T.o,border:'none',borderRadius:15,
                padding:'14px 16px',color:'#000',fontSize:15,fontWeight:800,letterSpacing:.2,
                cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,
                boxShadow:'0 4px 14px var(--oGlow)'}}>
              {busy?'…':'Beta-Key prüfen'}
            </button>

            <div style={{color:T.t3,fontSize:11,textAlign:'center',marginTop:14,
              lineHeight:1.5,letterSpacing:.2}}>
              Du hast noch keinen Beta-Key? Schreib uns an
              {' '}<span style={{color:T.t2}}>hallo@ritmopadel.app</span>.
            </div>

            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:20,
              justifyContent:'center'}}>
              <div style={{color:T.t3,fontSize:12}}>Hast du schon einen Account?</div>
              <button onClick={onLogin}
                style={{background:'none',border:'none',color:T.o,fontSize:13,
                  fontWeight:700,cursor:'pointer',padding:'4px 8px',textDecoration:'underline'}}>
                Anmelden
              </button>
            </div>
          </Fragment>
        ):(
          /* ───── STEP 2: E-Mail / Passwort ───── */
          <Fragment>
            {/* Beta-Key Quittung (read-only) + Zurück */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              gap:8,marginBottom:16,padding:'10px 12px',
              background:T.oSoft,border:`1px solid ${T.o}`,borderRadius:13}}>
              <div>
                <div style={{color:T.t3,fontSize:9,fontWeight:800,letterSpacing:1.4,
                  textTransform:'uppercase'}}>Beta-Key bestätigt</div>
                <div style={{color:T.t1,fontSize:13,fontWeight:700,
                  fontFamily:'-apple-system,SFMono-Regular,Menlo,monospace',
                  letterSpacing:.5,marginTop:2}}>{betaKey}</div>
              </div>
              <button onClick={()=>{setStep('key');setBetaKey('');setError('');}}
                style={{background:'none',border:'none',color:T.o,fontSize:12,
                  fontWeight:700,cursor:'pointer',padding:'4px 8px',textDecoration:'underline'}}>
                Ändern
              </button>
            </div>

            {/* Google — disabled (OAuth folgt) */}
            <button disabled
              style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                background:T.card,border:`1px solid ${T.border}`,borderRadius:15,
                padding:'13px 16px',color:T.t2,fontSize:15,fontWeight:600,
                cursor:'not-allowed',marginBottom:10,position:'relative'}}>
              <GoogleGlyph size={18}/>
              <span>Mit Google registrieren</span>
              <span style={{position:'absolute',top:6,right:10,fontSize:9,fontWeight:700,
                letterSpacing:.5,color:T.t3,textTransform:'uppercase'}}>bald</span>
            </button>

            {/* Apple disabled */}
            <button disabled
              style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                background:'#000',border:'1px solid rgba(255,255,255,.08)',borderRadius:15,
                padding:'13px 16px',color:'rgba(255,255,255,.4)',fontSize:15,fontWeight:600,
                cursor:'not-allowed',marginBottom:22,position:'relative'}}>
              <AppleGlyph size={18}/>
              <span>Mit Apple registrieren</span>
              <span style={{position:'absolute',top:6,right:10,fontSize:9,fontWeight:700,
                letterSpacing:.5,color:T.t1,textTransform:'uppercase'}}>bald</span>
            </button>

            {/* Divider */}
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <div style={{flex:1,height:1,background:T.border}}/>
              <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.5}}>ODER MIT E-MAIL</div>
              <div style={{flex:1,height:1,background:T.border}}/>
            </div>

            {/* Email */}
            <div style={{marginBottom:10}}>
              <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
                textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>E-Mail</div>
              <input value={email} onChange={e=>{setEmail(e.target.value);setError('');}}
                onKeyDown={onKeyDown} autoComplete="email" type="email"
                autoCapitalize="off" autoCorrect="off" spellCheck={false}
                placeholder="du@example.com"
                style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                  borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
                  outline:'none',boxSizing:'border-box'}}/>
            </div>

            {/* Telefon — Pflichtfeld, nur Format-Check; Länder-Vorwahl
                (DACH) mit Flagge im Dropdown davor. */}
            <div style={{marginBottom:10}}>
              <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
                textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Telefon</div>
              <div style={{display:'flex',gap:8,position:'relative'}}>
                <button type="button" onClick={()=>setCcOpen(o=>!o)}
                  aria-label="Ländervorwahl wählen" aria-expanded={ccOpen}
                  style={{display:'flex',alignItems:'center',gap:7,flexShrink:0,
                    background:T.card2,border:`1px solid ${T.border}`,borderRadius:13,
                    padding:'12px 12px',color:T.t1,fontSize:16,fontWeight:700,cursor:'pointer'}}>
                  <FlagIcon code={phoneCountry} size={20}/>
                  <span>{PHONE_COUNTRIES.find(c=>c.code===phoneCountry)?.dial}</span>
                  <span style={{display:'inline-flex',transform:ccOpen?'rotate(90deg)':'none',
                    transition:'transform .2s'}}><ChevronRightIcon size={12} color={T.t3}/></span>
                </button>
                <input value={phone} onChange={e=>{setPhone(e.target.value);setError('');}}
                  onKeyDown={onKeyDown} type="tel" inputMode="tel" autoComplete="tel"
                  placeholder="170 1234567"
                  style={{flex:1,minWidth:0,background:T.card2,border:`1px solid ${T.border}`,
                    borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
                    outline:'none',boxSizing:'border-box'}}/>
                {ccOpen&&(
                  <div className="fi" style={{position:'absolute',top:'calc(100% + 6px)',left:0,
                    zIndex:20,background:T.card,border:`1px solid ${T.border}`,borderRadius:13,
                    padding:6,minWidth:210,boxShadow:'0 12px 30px rgba(0,0,0,.45)'}}>
                    {PHONE_COUNTRIES.map(c=>(
                      <button key={c.code} type="button"
                        onClick={()=>{setPhoneCountry(c.code);setCcOpen(false);}}
                        style={{display:'flex',alignItems:'center',gap:10,width:'100%',
                          background:c.code===phoneCountry?T.card2:'none',border:'none',
                          borderRadius:9,padding:'10px 10px',cursor:'pointer',textAlign:'left'}}>
                        <FlagIcon code={c.code} size={20}/>
                        <span style={{flex:1,color:T.t1,fontSize:13,fontWeight:600}}>{c.name}</span>
                        <span style={{color:T.t3,fontSize:13,fontWeight:700}}>{c.dial}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div style={{marginBottom:10}}>
              <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
                textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Passwort</div>
              <input type="password" value={password}
                onChange={e=>{setPassword(e.target.value);setError('');}}
                onKeyDown={onKeyDown} autoComplete="new-password"
                placeholder="Min. 10 Zeichen, mit Ziffer"
                style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                  borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
                  outline:'none',boxSizing:'border-box'}}/>
            </div>

            {/* Confirm Password */}
            <div style={{marginBottom:16}}>
              <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
                textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Passwort bestätigen</div>
              <input type="password" value={password2}
                onChange={e=>{setPassword2(e.target.value);setError('');}}
                onKeyDown={onKeyDown} autoComplete="new-password"
                placeholder="••••••••"
                style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                  borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
                  outline:'none',boxSizing:'border-box'}}/>
            </div>

            {error&&(
              <div style={{background:'rgba(232,69,69,.12)',border:'1px solid rgba(232,69,69,.4)',
                borderRadius:8,padding:'9px 12px',marginBottom:12,
                color:'#FF6B6B',fontSize:12,fontWeight:600,letterSpacing:.2}}>
                {error}
              </div>
            )}

            <button onClick={tryRegister} disabled={busy}
              style={{background:T.o,border:'none',borderRadius:15,
                padding:'14px 16px',color:'#000',fontSize:15,fontWeight:800,letterSpacing:.2,
                cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,
                boxShadow:'0 4px 14px var(--oGlow)'}}>
              {busy?'…':'Registrieren'}
            </button>

            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:18,
              justifyContent:'center'}}>
              <div style={{color:T.t3,fontSize:12}}>Hast du schon einen Account?</div>
              <button onClick={onLogin}
                style={{background:'none',border:'none',color:T.o,fontSize:13,
                  fontWeight:700,cursor:'pointer',padding:'4px 8px',textDecoration:'underline'}}>
                Anmelden
              </button>
            </div>
          </Fragment>
        )}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL VERIFICATION — nach Email-Signup
═══════════════════════════════════════════════════════════════ */
function EmailVerification({email,onBack,onSignIn}){
  const[busy,setBusy]=useState(false);
  const[resent,setResent]=useState(false);
  const[error,setError]=useState('');

  const resend=async()=>{
    setBusy(true);setError('');
    try{
      await auth.resendVerification(email);
      setResent(true);
      setTimeout(()=>setResent(false),3000);
    }catch(e){setError(e.message||'Fehler beim Senden');}
    finally{setBusy(false);}
  };

  return(
    <div style={{minHeight:'100dvh',background:T.bgGrad,display:'flex',
      flexDirection:'column',alignItems:'center',justifyContent:'center',
      padding:'calc(env(safe-area-inset-top,0px) + 40px) 22px calc(env(safe-area-inset-bottom,0px) + 40px)'}}>
      <div className="fi" style={{width:'100%',maxWidth:380,display:'flex',
        flexDirection:'column',alignItems:'center'}}>

        {/* Mail icon */}
        <div style={{width:88,height:88,borderRadius:'50%',background:T.oSoft,
          display:'flex',alignItems:'center',justifyContent:'center',marginBottom:22,
          border:`2px solid ${T.o}40`}}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
            stroke={T.o} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <div style={{color:T.t1,fontSize:22,fontWeight:800,letterSpacing:-.3,
          textAlign:'center',marginBottom:8}}>
          Bestätige deine E-Mail
        </div>
        <div style={{color:T.t2,fontSize:16,lineHeight:1.5,textAlign:'center',
          maxWidth:320,marginBottom:6}}>
          Wir haben einen Link an
        </div>
        <div style={{color:T.o,fontSize:15,fontWeight:700,marginBottom:14,
          wordBreak:'break-all',textAlign:'center'}}>
          {email}
        </div>
        <div style={{color:T.t3,fontSize:13,lineHeight:1.5,textAlign:'center',
          maxWidth:320,marginBottom:26}}>
          geschickt. Klick darauf, um dein Konto zu aktivieren. Danach kannst
          du dich hier ganz normal anmelden.
        </div>

        {error&&(
          <div style={{background:'rgba(232,69,69,.12)',border:'1px solid rgba(232,69,69,.4)',
            borderRadius:8,padding:'9px 12px',marginBottom:14,
            color:'#FF6B6B',fontSize:12,fontWeight:600,width:'100%',textAlign:'center'}}>
            {error}
          </div>
        )}

        <button onClick={resend} disabled={busy||resent}
          style={{width:'100%',background:T.card,border:`1px solid ${T.border}`,
            borderRadius:15,padding:'12px 16px',color:T.t1,fontSize:13,fontWeight:600,
            cursor:(busy||resent)?'not-allowed':'pointer',opacity:(busy||resent)?.6:1,
            marginBottom:10}}>
          {resent?'✓ Erneut gesendet':'E-Mail erneut senden'}
        </button>

        <button onClick={()=>onSignIn?.(email)}
          style={{width:'100%',background:T.o,border:'none',borderRadius:15,
            padding:'14px 16px',color:'#000',fontSize:16,fontWeight:800,letterSpacing:.3,
            cursor:'pointer',marginBottom:18,
            boxShadow:'0 4px 14px var(--oGlow)'}}>
          Bestätigt? Auf zum Login →
        </button>

        <button onClick={onBack}
          style={{background:'none',border:'none',color:T.t3,fontSize:12,
            cursor:'pointer',padding:6,textDecoration:'underline'}}>
          Falsche E-Mail? Zurück
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PASSWORD RECOVERY — User klickt auf Reset-Link, Supabase setzt
   temporäre Session, App leitet hierher um, neues Passwort wird
   gesetzt und gespeichert.
═══════════════════════════════════════════════════════════════ */
function PasswordRecovery({onDone}){
  const[pw,setPw]=useState('');
  const[pw2,setPw2]=useState('');
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');

  const submit=async()=>{
    if(pw!==pw2){setError('Passwörter stimmen nicht überein');return;}
    setBusy(true);setError('');
    try{
      await auth.updatePassword(pw);
      onDone();
    }catch(e){
      setError(e.message||'Passwort konnte nicht gesetzt werden');
    }finally{setBusy(false);}
  };

  return(
    <div style={{minHeight:'100dvh',background:T.bgGrad,display:'flex',
      flexDirection:'column',alignItems:'center',justifyContent:'center',
      padding:'calc(env(safe-area-inset-top,0px) + 40px) 22px calc(env(safe-area-inset-bottom,0px) + 40px)'}}>
      <div className="fi" style={{width:'100%',maxWidth:380,display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,marginBottom:24}}>
          <RitmoSplashLogo size={110}/>
          <div style={{color:T.t1,fontSize:22,fontWeight:800,letterSpacing:-.3}}>
            Neues Passwort setzen
          </div>
          <div style={{color:T.t3,fontSize:12,textAlign:'center',maxWidth:300,lineHeight:1.5}}>
            Wähle ein neues Passwort für dein RITMO-Konto.
          </div>
        </div>

        <div style={{marginBottom:10}}>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Neues Passwort</div>
          <input type="password" value={pw}
            onChange={e=>{setPw(e.target.value);setError('');}}
            autoComplete="new-password"
            placeholder="Min. 10 Zeichen, mit Ziffer"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
              outline:'none',boxSizing:'border-box'}}/>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Passwort bestätigen</div>
          <input type="password" value={pw2}
            onChange={e=>{setPw2(e.target.value);setError('');}}
            onKeyDown={e=>{if(e.key==='Enter') submit();}}
            autoComplete="new-password"
            placeholder="••••••••"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
              outline:'none',boxSizing:'border-box'}}/>
        </div>

        {error&&(
          <div style={{background:'rgba(232,69,69,.12)',border:'1px solid rgba(232,69,69,.4)',
            borderRadius:8,padding:'9px 12px',marginBottom:12,
            color:'#FF6B6B',fontSize:12,fontWeight:600}}>
            {error}
          </div>
        )}

        <button onClick={submit} disabled={busy}
          style={{background:T.o,border:'none',borderRadius:15,
            padding:'14px 16px',color:'#000',fontSize:15,fontWeight:800,letterSpacing:.2,
            cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,
            boxShadow:'0 4px 14px var(--oGlow)'}}>
          {busy?'…':'Passwort speichern'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VERIFIED LANDING — Standalone Info-Page nach Email-Verify
   (statt direkter Sprung ins Onboarding). Wird durch ?verified=1
   in der Redirect-URL aus dem Supabase-Mail-Link aktiviert.
═══════════════════════════════════════════════════════════════ */
function VerifiedLanding(){
  return(
    <div style={{position:'fixed',inset:0,zIndex:900,
      background:T.bg,display:'flex',
      flexDirection:'column',alignItems:'center',justifyContent:'center',
      overflowY:'auto',
      padding:'calc(env(safe-area-inset-top,0px) + 40px) 22px calc(env(safe-area-inset-bottom,0px) + 40px)'}}>
      <div className="fi" style={{width:'100%',maxWidth:380,display:'flex',
        flexDirection:'column',alignItems:'center'}}>

        {/* Check-Icon */}
        <div style={{width:96,height:96,borderRadius:'50%',
          background:`${T.g}22`,border:`2px solid ${T.g}`,
          display:'flex',alignItems:'center',justifyContent:'center',
          marginBottom:24,boxShadow:`0 0 24px ${T.g}55`}}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
            stroke={T.g} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <RitmoSplashLogo size={88}/>

        <div style={{color:T.t1,fontSize:22,fontWeight:800,letterSpacing:-.3,
          textAlign:'center',marginTop:20,marginBottom:14,maxWidth:320,lineHeight:1.45}}>
          Deine Email ist nun bestätigt.
        </div>

        <div style={{color:T.t2,fontSize:16,lineHeight:1.55,textAlign:'center',
          maxWidth:320}}>
          Logge dich nun gerne in der Applikation ein.
        </div>

      </div>
    </div>
  );
}

function OnboardProgress({total,current}){
  return(
    <div style={{display:'flex',gap:6,justifyContent:'center',padding:'10px 0',alignItems:'center'}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{
          width:i===current?22:6,height:6,borderRadius:3,
          background:i<=current?T.o:T.t4,
          transition:'all .25s ease'
        }}/>
      ))}
    </div>
  );
}

function ChapterWelcome(){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,padding:'30px 0'}}>
      <RitmoSplashLogo size={130}/>
      <div style={{color:T.t2,fontSize:16,textAlign:'center',maxWidth:300,lineHeight:1.6}}>
        Lass uns RITMO kurz für dich einrichten — dauert keine Minute.
      </div>
      {/* Beruhigungs-Hinweis: Onboarding ist nicht "jetzt oder nie" — nimmt
          beim ersten Start den Druck raus und senkt die Abbruchrate. */}
      <div className="fu" style={{animationDelay:'.18s',display:'flex',alignItems:'flex-start',
        gap:10,maxWidth:300,background:T.card,border:`1px solid ${T.border}`,
        borderRadius:15,padding:'11px 13px'}}>
        <span style={{flexShrink:0,marginTop:1,width:17,height:17,borderRadius:'50%',
          background:T.oSoft,color:T.o,fontSize:11,fontWeight:900,fontStyle:'italic',
          display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>i</span>
        <div style={{color:T.t3,fontSize:12.5,lineHeight:1.5,textAlign:'left'}}>
          Du kannst auch später in deinem Profil das Onboarding nachholen. Keine Sorge.
        </div>
      </div>
    </div>
  );
}

function ChapterName({profile,setProfile,onEnter}){
  return(
    <div>
      <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
        textTransform:'uppercase',marginBottom:8,paddingLeft:4}}>
        Name oder Spitzname
      </div>
      <input value={profile.name}
        onChange={e=>setProfile(p=>({...p,name:e.target.value}))}
        onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();onEnter&&onEnter();}}}
        placeholder="z.B. Alex"
        autoFocus autoCapitalize="words" autoCorrect="off" spellCheck={false}
        enterKeyHint="next"
        style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
          borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
          outline:'none',boxSizing:'border-box'}}/>
      <div style={{color:T.t3,fontSize:11,marginTop:8,lineHeight:1.5,paddingLeft:4}}>
        Wird beim Match-Setup voreingetragen und in Turnieren angezeigt.
      </div>
    </div>
  );
}

/* Question helper: stacked option buttons with selected highlight */
function QuestionGroup({label,value,onChange,options,sub}){
  return(
    <div style={{marginBottom:18}}>
      <div style={{color:T.t1,fontSize:16,fontWeight:700,marginBottom:sub?2:8,paddingLeft:2}}>{label}</div>
      {sub&&<div style={{color:T.t3,fontSize:11,marginBottom:8,paddingLeft:2,lineHeight:1.4}}>{sub}</div>}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {options.map(o=>{
          const sel=value===o.id;
          return(
            <button key={o.id} onClick={()=>onChange(o.id)}
              style={{padding:'14px 16px',textAlign:'left',
                background:sel?T.oSoft:T.card,
                border:`1.5px solid ${sel?T.o:T.border}`,
                borderRadius:13,color:T.t1,fontSize:13,fontWeight:sel?700:500,
                cursor:'pointer',transition:'all .15s',
                display:'flex',alignItems:'center',gap:10}}>
              <span style={{flex:1}}>{o.label}</span>
              {sel&&<span style={{color:T.o,fontSize:16}}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}


function ChapterPlaytomic({profile,setProfile}){
  const hasPlaytomic=profile.playtomicLevel!=null;
  const estimated=estimateLevel(profile);
  const m=parseInt(profile.matchesPlayed)||0;

  // Playtomic stepper: ±0.01
  const setPlaytomicLevel=(delta)=>{
    const cur=profile.playtomicLevel??2.00;
    const next=Math.min(7,Math.max(0,Math.round((cur+delta)*100)/100));
    setProfile(p=>({...p,playtomicLevel:next}));
  };

  return(
    <div>
      {/* Toggle */}
      <div style={{display:'flex',gap:8,marginBottom:18}}>
        <button onClick={()=>setProfile(p=>({...p,playtomicLevel:p.playtomicLevel??2.50}))}
          style={{flex:1,padding:'11px 10px',
            background:hasPlaytomic?T.oSoft:T.card,
            border:`1.5px solid ${hasPlaytomic?T.o:T.border}`,
            borderRadius:13,color:T.t1,fontSize:12,fontWeight:hasPlaytomic?700:500,
            cursor:'pointer',transition:'all .15s',lineHeight:1.3,textAlign:'center'}}>
          Habe Playtomic-Level
        </button>
        <button onClick={()=>setProfile(p=>({...p,playtomicLevel:null}))}
          style={{flex:1,padding:'11px 10px',
            background:!hasPlaytomic?T.oSoft:T.card,
            border:`1.5px solid ${!hasPlaytomic?T.o:T.border}`,
            borderRadius:13,color:T.t1,fontSize:12,fontWeight:!hasPlaytomic?700:500,
            cursor:'pointer',transition:'all .15s',lineHeight:1.3,textAlign:'center'}}>
          {'Habe ich nicht —\nGib mir ein RITMO Level'}
        </button>
      </div>

      {hasPlaytomic?(
        /* ── Playtomic Level — 0.01-Schritte ── */
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
          padding:'20px 18px 16px'}}>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',textAlign:'center',marginBottom:14}}>
            Playtomic Level
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
            <button onClick={()=>setPlaytomicLevel(-0.01)}
              style={{width:42,height:42,borderRadius:'50%',
                background:T.card2,border:`1px solid ${T.border}`,
                color:T.o,fontSize:22,fontWeight:700,cursor:'pointer',flexShrink:0}}>−</button>
            <input
              type="number" min="0" max="7" step="0.01"
              value={(profile.playtomicLevel??2.50).toFixed(2)}
              onChange={e=>{
                const v=parseFloat(e.target.value);
                if(!isNaN(v)) setProfile(p=>({...p,playtomicLevel:Math.min(7,Math.max(0,Math.round(v*100)/100))}));
              }}
              style={{width:110,textAlign:'center',
                color:T.o,fontSize:42,fontWeight:900,letterSpacing:-1,lineHeight:1,
                background:'transparent',border:'none',outline:'none',
                fontFamily:'inherit'}}/>
            <button onClick={()=>setPlaytomicLevel(+0.01)}
              style={{width:42,height:42,borderRadius:'50%',
                background:T.card2,border:`1px solid ${T.border}`,
                color:T.o,fontSize:22,fontWeight:700,cursor:'pointer',flexShrink:0}}>+</button>
          </div>
          <div style={{color:T.t3,fontSize:11,textAlign:'center',marginTop:6}}>
            Skala 0.00 – 7.00
          </div>
          {profile.playtomicLevel!=null&&(
            <div style={{color:T.o,fontSize:12,fontWeight:700,textAlign:'center',marginTop:8}}>
              {getLevelLabel(profile.playtomicLevel)}
            </div>
          )}
        </div>
      ):(
        /* ── RITMO Level Fragebogen — 6 Fragen ── */
        <div>
          <div style={{color:T.t2,fontSize:13,lineHeight:1.55,marginBottom:16,padding:'0 2px'}}>
            Beantworte 6 kurze Fragen — wir schätzen dein RITMO-Level. Je mehr du angibst, desto genauer.
          </div>

          <QuestionGroup
            label="Wie lange spielst du schon Padel?"
            value={profile.yearsPlaying}
            onChange={v=>setProfile(p=>({...p,yearsPlaying:v}))}
            options={[
              {id:'lt6m',   label:'Weniger als 6 Monate'},
              {id:'6-12m',  label:'6–12 Monate'},
              {id:'1-2y',   label:'1–2 Jahre'},
              {id:'2-5y',   label:'2–5 Jahre'},
              {id:'5y+',    label:'5+ Jahre'},
            ]}/>

          <QuestionGroup
            label="Wie oft spielst du pro Woche?"
            value={profile.frequencyPerWeek}
            onChange={v=>setProfile(p=>({...p,frequencyPerWeek:v}))}
            options={[
              {id:'rare',   label:'Selten (weniger als 1×)'},
              {id:'1x',     label:'1× pro Woche'},
              {id:'2x',     label:'2× pro Woche'},
              {id:'3x+',    label:'3× oder mehr'},
            ]}/>

          <QuestionGroup
            label="Spielst du Turniere?"
            value={profile.playsTournaments}
            onChange={v=>setProfile(p=>({...p,playsTournaments:v,
              tournamentCount:v==='never'?'0':p.tournamentCount}))}
            options={[
              {id:'never',      label:'Nie'},
              {id:'occasional', label:'Gelegentlich'},
              {id:'regular',    label:'Regelmäßig'},
            ]}/>

          {profile.playsTournaments&&profile.playsTournaments!=='never'&&(
            <QuestionGroup
              label="Wie viele Turniere hast du bisher gespielt?"
              value={profile.tournamentCount}
              onChange={v=>setProfile(p=>({...p,tournamentCount:v}))}
              options={[
                {id:'1-3',   label:'1–3 Turniere'},
                {id:'4-10',  label:'4–10 Turniere'},
                {id:'10+',   label:'Mehr als 10'},
              ]}/>
          )}

          {/* Matches — Zahlen-Input */}
          <div style={{marginBottom:18}}>
            <div style={{color:T.t1,fontSize:16,fontWeight:700,marginBottom:8,paddingLeft:2}}>
              Wettbewerbsfähige Matches gespielt?
            </div>
            <input
              type="number" min="0" max="9999"
              value={profile.matchesPlayed??''}
              placeholder="z.B. 45"
              onChange={e=>{
                const v=e.target.value;
                setProfile(p=>({...p,matchesPlayed:v===''?'':Math.max(0,parseInt(v)||0)}));
              }}
              style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:600,
                outline:'none',boxSizing:'border-box'}}/>
          </div>

          {m>0&&(
            <div style={{marginBottom:18}}>
              <div style={{color:T.t1,fontSize:16,fontWeight:700,marginBottom:8,paddingLeft:2}}>
                Davon Siege?
              </div>
              <input
                type="number" min="0" max={m}
                value={profile.winsCount??''}
                placeholder={`0 – ${m}`}
                onChange={e=>{
                  const v=e.target.value;
                  const wins=Math.min(m,Math.max(0,parseInt(v)||0));
                  setProfile(p=>({...p,winsCount:v===''?'':wins}));
                }}
                style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                  borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:600,
                  outline:'none',boxSizing:'border-box'}}/>
              {profile.winsCount!==''&&profile.winsCount!=null&&(
                <div style={{color:T.t3,fontSize:12,marginTop:6,paddingLeft:2}}>
                  Siegquote: {Math.round((parseInt(profile.winsCount)||0)/m*100)}%
                </div>
              )}
            </div>
          )}

          {/* Live estimate */}
          {estimated!=null&&(
            <div className="fi" style={{background:T.oSoft,
              border:`1px solid ${T.o}`,borderRadius:15,padding:'16px 18px',
              display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
              <div>
                <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
                  textTransform:'uppercase',marginBottom:4}}>RITMO Level (Schätzung)</div>
                <div style={{color:T.o,fontSize:40,fontWeight:900,letterSpacing:-.5,lineHeight:1}}>
                  {estimated.toFixed(2)}
                </div>
                <div style={{color:T.o,fontSize:12,fontWeight:700,marginTop:4}}>
                  {getLevelLabel(estimated)}
                </div>
              </div>
              <div style={{color:T.t3,fontSize:11,textAlign:'right',lineHeight:1.5}}>
                Im Profil<br/>anpassbar
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function StyleVisual({styleId}){
  const s=PADEL_STYLES[styleId];
  const filename=STYLE_IMAGES[styleId];
  const[imgError,setImgError]=useState(false);

  if(!s) return null;

  if(imgError||!filename){
    // Fallback: solid color block with style name
    return(
      <div style={{width:'100%',aspectRatio:'7/5',background:s.accent,
        display:'flex',alignItems:'center',justifyContent:'center',
        color:'white',fontSize:24,fontWeight:900,letterSpacing:1.5,
        textShadow:'0 2px 8px rgba(0,0,0,0.3)'}}>
        {s.name.toUpperCase()}
      </div>
    );
  }

  return(
    <img src={`${getAssetBase()}assets/${filename}`}
      onError={()=>setImgError(true)}
      style={{width:'100%',height:'auto',aspectRatio:'7/5',
        objectFit:'cover',display:'block'}}
      alt={s.name}/>
  );
}

/* Kompakte 3D-Spielkarte für den DNA-Screen: Querformat, volle
   Breite, NUR Labels (Name/Subtitle/Symbol) auf dem Stil-Bild in
   einem Creme-Rahmen — die Beschreibung wohnt außerhalb der Karte. */
function StylePlayingCard({styleId}){
  const s=PADEL_STYLES[styleId];
  const filename=STYLE_IMAGES[styleId];
  const[imgError,setImgError]=useState(false);
  if(!s) return null;
  return(
    <div style={{background:'#F5EDDC',borderRadius:22,padding:8,
      boxShadow:'0 18px 44px rgba(0,0,0,.5), 0 4px 14px rgba(0,0,0,.35)'}}>
      <div style={{position:'relative',height:162,borderRadius:15,overflow:'hidden',
        background:s.accent}}>
        {!imgError&&filename&&(
          <img src={`${getAssetBase()}assets/${filename}`} alt={s.name}
            onError={()=>setImgError(true)} draggable={false}
            style={{position:'absolute',inset:0,width:'100%',height:'100%',
              objectFit:'cover',objectPosition:'center 28%',userSelect:'none'}}/>
        )}
        <div aria-hidden="true" style={{position:'absolute',inset:0,
          background:'linear-gradient(180deg, rgba(0,0,0,.04) 40%, rgba(0,0,0,.5) 100%)'}}/>
        <div style={{position:'absolute',left:10,top:7,color:'#FFF',fontSize:17,
          fontWeight:900,textShadow:'0 1px 6px rgba(0,0,0,.55)'}}>{s.symbol}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        gap:10,padding:'10px 8px 4px'}}>
        <div style={{minWidth:0}}>
          <div style={{color:'#1A1A1A',fontSize:24,fontWeight:900,letterSpacing:-.5,
            lineHeight:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {s.name.toUpperCase()}
          </div>
          <div style={{color:'#1A1A1A',fontSize:10,fontWeight:800,letterSpacing:2,
            textTransform:'uppercase',marginTop:3,opacity:.65}}>
            {s.subtitle.toUpperCase()}
          </div>
        </div>
        <div style={{color:s.accent,fontSize:22,fontWeight:900,flexShrink:0}}>{s.symbol}</div>
      </div>
    </div>
  );
}

/* Sektion im DNA-Screen: Accent-Icon-Chip + Titel + Fließtext,
   optional Schwächen-Chips und ein großes, schwach sichtbares
   animiertes Stil-Sigil als Hintergrund-Deko. */
function DnaSection({icon,title,children,chips,accent,deco,delay}){
  return(
    <div className="fu" style={{animationDelay:delay,position:'relative',
      background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
      padding:'16px 18px',marginBottom:14,overflow:'hidden'}}>
      {deco&&(
        <div aria-hidden="true" style={{position:'absolute',right:-12,bottom:-16,
          opacity:.09,pointerEvents:'none'}}>{deco}</div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:9}}>
        <span style={{width:30,height:30,borderRadius:11,flexShrink:0,
          background:rgba(accent,0.14),border:`1px solid ${rgba(accent,0.5)}`,
          color:accent,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
          {icon}
        </span>
        <span style={{color:T.t1,fontSize:16,fontWeight:800,letterSpacing:-.2}}>{title}</span>
      </div>
      <div style={{color:T.t2,fontSize:13,lineHeight:1.65,position:'relative'}}>{children}</div>
      {chips&&chips.length>0&&(
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:11,position:'relative'}}>
          {chips.map(c=>(
            <span key={c} style={{padding:'3px 9px',borderRadius:7,fontSize:10.5,
              fontWeight:700,letterSpacing:.3,color:accent,
              background:rgba(accent,0.1),border:`1px solid ${rgba(accent,0.45)}`}}>
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StyleHeroCard({styleId}){
  const s=PADEL_STYLES[styleId];
  if(!s) return null;
  return(
    <div style={{background:'#F5EDDC',borderRadius:21,overflow:'hidden',
      marginBottom:16,boxShadow:'0 4px 24px rgba(0,0,0,0.35)'}}>
      {/* Visual */}
      <div style={{background:'#F5EDDC',padding:'20px 20px 0',paddingBottom:8}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
          <div>
            <div style={{color:'#1A1A1A',fontSize:26,fontWeight:900,letterSpacing:-.5,lineHeight:1}}>
              {s.name.toUpperCase()}
            </div>
            <div style={{color:'#1A1A1A',fontSize:11,fontWeight:800,letterSpacing:2,
              textTransform:'uppercase',marginTop:3,opacity:0.7}}>
              {s.subtitle.toUpperCase()}
            </div>
          </div>
          <div style={{color:s.accent,fontSize:24,fontWeight:900,marginTop:2}}>{s.symbol}</div>
        </div>
        <StyleVisual styleId={styleId}/>
      </div>
      {/* Bottom info */}
      <div style={{padding:'14px 20px 18px',background:'#F5EDDC',
        borderTop:'1px solid rgba(0,0,0,0.08)'}}>
        <div style={{color:'#1A1A1A',fontSize:13,fontWeight:600,
          textTransform:'uppercase',letterSpacing:1,marginBottom:10,opacity:0.55}}>
          {s.tagline.toUpperCase()}
        </div>
        {/* Description */}
        <div style={{color:'#1A1A1A',fontSize:13,lineHeight:1.55,marginBottom:14,opacity:0.78}}>
          {s.desc}
        </div>
        {/* Kernwerte */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
          {s.kernwerte.map(k=>(
            <div key={k} style={{padding:'4px 10px',background:s.accent,borderRadius:25,
              color:'white',fontSize:11,fontWeight:700,letterSpacing:.5}}>
              {k}
            </div>
          ))}
        </div>
        {/* Shots */}
        <div style={{color:'#1A1A1A',fontSize:10,fontWeight:700,letterSpacing:1.2,
          textTransform:'uppercase',marginBottom:6,opacity:0.5}}>Typische Shots</div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:12}}>
          {s.shots.map(sh=>(
            <div key={sh} style={{padding:'3px 8px',background:'rgba(0,0,0,0.08)',
              borderRadius:19,color:'#1A1A1A',fontSize:11,fontWeight:500}}>
              {sh}
            </div>
          ))}
        </div>
        {/* Weaknesses */}
        <div style={{color:'#1A1A1A',fontSize:10,fontWeight:700,letterSpacing:1.2,
          textTransform:'uppercase',marginBottom:6,opacity:0.5}}>Schwächen</div>
        <div style={{color:'#1A1A1A',fontSize:12,opacity:0.55,lineHeight:1.5}}>
          {s.weaknesses.join(' · ')}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANALYTICS / HEALTH-STYLE GRAPHS — Wiederverwendbar
═══════════════════════════════════════════════════════════════ */

function Sparkline({data,color,height=40,fill=true}){
  if(!data||data.length<2) return null;
  const w=200, h=height, pad=4;
  const max=Math.max(...data), min=Math.min(...data), range=max-min||1;
  const points=data.map((v,i)=>{
    const x=pad+(i/(data.length-1))*(w-pad*2);
    const y=pad+(1-(v-min)/range)*(h-pad*2);
    return [x,y];
  });
  const path=points.map((p,i)=>`${i===0?'M':'L'} ${p[0]} ${p[1]}`).join(' ');
  const area=`${path} L ${points[points.length-1][0]} ${h} L ${points[0][0]} ${h} Z`;
  return(
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
      style={{width:'100%',height,display:'block'}}>
      {fill&&<path d={area} fill={color} opacity="0.18"/>}
      <path d={path} stroke={color} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p,i)=>(
        <circle key={i} cx={p[0]} cy={p[1]} r={i===points.length-1?3:0} fill={color}/>
      ))}
    </svg>
  );
}

function RingChart({value,total=100,size=80,color,trackColor,label,subLabel}){
  const r=size/2-6, c=2*Math.PI*r, frac=Math.max(0,Math.min(1,value/total));
  return(
    <div style={{position:'relative',width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={trackColor||T.card2} strokeWidth="6"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${c*frac} ${c*(1-frac)}`}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',gap:0}}>
        <div style={{color,fontSize:18,fontWeight:900,letterSpacing:-.5,lineHeight:1}}>
          {label}
        </div>
        {subLabel&&<div style={{color:T.t3,fontSize:9,fontWeight:600,
          letterSpacing:.5,marginTop:2,textTransform:'uppercase'}}>{subLabel}</div>}
      </div>
    </div>
  );
}

function BarChart({values,labels,color,height=80}){
  const max=Math.max(...values,1);
  return(
    <div style={{display:'flex',alignItems:'flex-end',gap:6,height,paddingTop:4}}>
      {values.map((v,i)=>{
        const h=Math.max(2,(v/max)*(height-22));
        return(
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',
            alignItems:'center',gap:4}}>
            <div style={{color,fontSize:9,fontWeight:700,letterSpacing:.3}}>{v}</div>
            <div style={{width:'100%',height:h,background:color,borderRadius:'4px 4px 0 0',
              opacity:0.85,transition:'height .35s ease'}}/>
            <div style={{color:T.t3,fontSize:9,fontWeight:600,letterSpacing:.3,textTransform:'uppercase'}}>
              {labels?.[i]||''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatTile({label,value,unit,trend,color,sparklineData}){
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
      padding:'14px 16px'}}>
      <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.2,
        textTransform:'uppercase',marginBottom:4}}>{label}</div>
      <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:4}}>
        <div style={{color:color||T.t1,fontSize:24,fontWeight:900,letterSpacing:-.5,lineHeight:1}}>
          {value}
        </div>
        {unit&&<div style={{color:T.t3,fontSize:12,fontWeight:600}}>{unit}</div>}
        {trend!=null&&(
          <div style={{color:trend>=0?'#1A8754':'#E84545',fontSize:11,fontWeight:700,
            marginLeft:'auto'}}>
            {trend>=0?'▲':'▼'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      {sparklineData&&<Sparkline data={sparklineData} color={color||T.o} height={32}/>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE RITMO DNA SCREEN — Persönliche Stil + Analytics
═══════════════════════════════════════════════════════════════ */
function ProfileRitmoDNA({profile,onBack,onHome}){
  // Statistiken wohnen jetzt im Profil — dieser Screen fokussiert
  // auf den Stil: Hero-Karte, Skill-Ring, Partner-Chemie.
  const style=profile.styleType?PADEL_STYLES[profile.styleType]:null;
  const lvl=profile.playtomicLevel??profile.estimatedLevel;
  const accent=style?.accent||T.o;
  // Swoosh-Charakter je Spielstil (siehe theme.js Keyframes).
  const SWOOSH={toro:'aggro',motor:'aggro',hysterica:'aggro',muro:'calm',chico:'calm',
    fantasma:'creative',individuoso:'creative'};

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden'}}>

      {/* HEADER ZONE — colored with style accent */}
      <div style={{
        padding:'calc(env(safe-area-inset-top,0px) + 60px) 22px 36px',
        background:style?`linear-gradient(135deg, ${accent}55 0%, ${T.bg} 100%)`:'var(--headerGrad)',
        display:'flex',alignItems:'flex-start',gap:12,position:'relative',zIndex:1,
      }}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:T.t1,fontSize:11,fontWeight:700,letterSpacing:1.5,
            textTransform:'uppercase',opacity:0.7,marginBottom:6}}>Spielerprofil</div>
          <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:4}}>
            <div style={{color:T.t1,fontSize:32,fontWeight:900,letterSpacing:-.8,lineHeight:1}}>
              RITMO
            </div>
            <div style={{color:accent,fontSize:32,fontWeight:900,letterSpacing:-.8,lineHeight:1}}>
              DNA
            </div>
          </div>
          <div style={{color:T.t2,fontSize:13,marginTop:6,fontWeight:500}}>
            Kenne deinen Stil. Finde deinen Rhythmus.
          </div>
        </div>
      </div>

      {/* CORPUS — drawer */}
      <div style={{
        flex:1,background:T.bg,
        borderTopLeftRadius:24,borderTopRightRadius:24,
        marginTop:-20,
        boxShadow:'0 -10px 28px rgba(0,0,0,0.55), 0 -1px 0 rgba(255,255,255,0.04) inset',
        padding:'26px 22px 0',
        overflowY:'auto',WebkitOverflowScrolling:'touch',
        position:'relative',zIndex:2,
      }}>

        {/* Spielkarte — volle Breite, flach, nur Labels. Dealt sich
            wie eine echte 3D-Karte herein (rotateY-Drehung), Charakter
            je Spielstil (aggro/calm/creative). */}
        {profile.styleType&&(<>
          <div className={`dna-swoosh-${SWOOSH[profile.styleType]||'calm'}`}
            style={{transformOrigin:'center',marginBottom:16}}>
            <StylePlayingCard styleId={profile.styleType}/>
          </div>

          {/* Beschreibung — bewusst AUSSERHALB der Karte */}
          <div className="fu" style={{animationDelay:'.4s',marginBottom:4,padding:'0 2px'}}>
            <div style={{color:accent,fontSize:12.5,fontWeight:800,letterSpacing:1.4,
              textTransform:'uppercase',marginBottom:8}}>
              „{style.tagline}"
            </div>
            <div style={{color:T.t2,fontSize:13.5,lineHeight:1.65}}>
              {style.desc}
            </div>
          </div>

          {/* Animierte Stil-Sigille — jede Kategorie bringt ihre
              eigene Bewegung mit (ArchetypeGlyph-Loops) */}
          <div className="fu" aria-hidden="true" style={{animationDelay:'.5s',
            display:'flex',justifyContent:'center',alignItems:'center',gap:22,
            margin:'18px 0 22px'}}>
            {[34,25,19].map((sz,i)=>(
              <span key={i} className="float-y" style={{animationDelay:`${i*.45}s`,
                opacity:[1,.5,.28][i],display:'inline-flex'}}>
                <ArchetypeGlyph type={profile.styleType} active color={accent} size={sz}/>
              </span>
            ))}
          </div>

          {/* Die Persönlichkeit dahinter */}
          {style.persona&&(
            <DnaSection delay=".56s" accent={accent} title="Die Persönlichkeit dahinter"
              icon={<MaskIcon size={18}/>}
              deco={<ArchetypeGlyph type={profile.styleType} active color={accent} size={96}/>}>
              {style.persona}
            </DnaSection>
          )}

          {/* Worauf du achten musst */}
          {style.watchout&&(
            <DnaSection delay=".64s" accent={accent} title="Worauf du achten musst"
              icon={<WarnIcon size={18}/>}
              chips={style.weaknesses}>
              {style.watchout}
            </DnaSection>
          )}

          {/* So spielt man gegen dich */}
          {style.counter&&(
            <DnaSection delay=".72s" accent={accent} title="So spielt man gegen dich"
              icon={<TargetIcon size={18}/>}>
              {style.counter}
            </DnaSection>
          )}
        </>)}

        {/* Section: Level & Ring */}
        {lvl!=null&&style&&(
          <div className="fu" style={{animationDelay:'.25s',background:T.card,
            border:`1px solid ${T.border}`,borderRadius:19,padding:'16px 18px',marginBottom:14,
            display:'flex',alignItems:'center',gap:18}}>
            <RingChart value={(lvl/7)*100} size={90} color={accent}
              label={lvl.toFixed(2)} subLabel="Level"/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
                textTransform:'uppercase',marginBottom:3}}>Skill</div>
              <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:6}}>
                <div style={{color:T.t1,fontSize:18,fontWeight:800,letterSpacing:-.3}}>
                  {getLevelLabel(lvl)}
                </div>
                <div style={{padding:'2px 7px',background:getLevelColor(lvl),
                  color:'#fff',borderRadius:5,fontSize:10,fontWeight:900,letterSpacing:.5}}>
                  {getLevelTier(lvl)}
                </div>
              </div>
              <div style={{color:T.t2,fontSize:12,lineHeight:1.5}}>
                {SKILL_DESCRIPTIONS[getLevelTier(lvl)]?.desc}
              </div>
            </div>
          </div>
        )}

        {/* Section: Beste Partner-Stile (Mock) */}
        {style&&(
          <div className="fu" style={{animationDelay:'.3s',background:T.card,
            border:`1px solid ${T.border}`,borderRadius:19,padding:'16px 18px',marginBottom:14}}>
            <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
              textTransform:'uppercase',marginBottom:10}}>Beste Partner-Chemie</div>
            {style.partners?.slice(0,2).map(p=>{
              const pStyle=PADEL_STYLES[p.id];
              return(
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,
                  padding:'10px 0',borderTop:`1px solid ${T.sep}`}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:pStyle.accent,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    color:'white',fontSize:16,fontWeight:800,flexShrink:0}}>
                    {pStyle.symbol}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:pStyle.accent,fontSize:13,fontWeight:800}}>
                      {pStyle.name}
                    </div>
                    <div style={{color:T.t3,fontSize:11,marginTop:1}}>{p.why}</div>
                  </div>
                  <div style={{color:'#1A8754',fontSize:11,fontWeight:800,letterSpacing:.5}}>
                    S-TIER
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{height:120,flexShrink:0}}/>
      </div>

      <MatchBar onHome={onHome} rightButtons={[
        {icon:<PersonGlyph size={20}/>, onClick:onBack}
      ]}/>
    </div>
  );
}

/* Option-ID → Archetyp-Schlüssel (deckungsgleich mit computeStyle in
   padelStyles.js). Treibt das animierte Kategorie-Sigil je Antwort. */
const QUIZ_GLYPHS={a:'chico',b:'toro',c:'individuoso',d:'muro',e:'fantasma',f:'motor',g:'hysterica'};

/* ── Updated ChapterPlaystyle with full personality quiz ────── */
function ChapterPlaystyle({profile,setProfile}){
  const qa=profile.quizAnswers||{};
  const answered=Object.values(qa).filter(Boolean).length;
  const result=answered===4?computeStyle(qa):null;

  return(
    <div>
      {/* Personality Quiz */}
      <div style={{marginBottom:6}}>
        <div style={{color:T.t1,fontSize:15,fontWeight:800,marginBottom:4}}>
          Padel Personality Quiz
        </div>
        <div style={{color:T.t3,fontSize:12,marginBottom:16,lineHeight:1.5}}>
          4 kurze Fragen — dein Spieltyp wird automatisch erkannt.
        </div>
        {PADEL_QUIZ.map(q=>(
          <div key={q.key} style={{marginBottom:14}}>
            <div style={{color:T.t1,fontSize:13,fontWeight:700,marginBottom:8}}>{q.label}</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {q.options.map(o=>{
                const sel=qa[q.key]===o.id;
                const aType=QUIZ_GLYPHS[o.id];
                const accent=PADEL_STYLES[aType]?.accent||T.o;
                return(
                  <button key={o.id} onClick={()=>{
                    const newQa={...qa,[q.key]:o.id};
                    // Primär- UND Sekundär-Stil aus denselben Antworten
                    const styles=computeStyles(newQa);
                    setProfile(p=>({...p,quizAnswers:newQa,
                      styleType:styles.primary,styleType2:styles.secondary}));
                  }} style={{display:'flex',alignItems:'center',gap:11,padding:'9px 11px',
                    background:sel?rgba(accent,0.14):T.card,
                    border:`1.5px solid ${sel?accent:T.border}`,
                    borderRadius:9,color:T.t1,fontSize:12,fontWeight:sel?700:500,
                    cursor:'pointer',textAlign:'left',transition:'all .2s var(--ease-out-expo)'}}>
                    <ArchetypeGlyph type={aType} active={sel} color={accent} size={22}/>
                    <span style={{flex:1}}>{o.label}</span>
                    {sel&&<span className="dot-pop" style={{width:7,height:7,borderRadius:'50%',
                      flexShrink:0,background:accent,boxShadow:`0 0 0 3px ${rgba(accent,0.22)}`}}/>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Live result */}
        {result&&(
          <div className="fi" style={{background:PADEL_STYLES[result].card,
            border:`1.5px solid ${PADEL_STYLES[result].accent}`,
            borderRadius:15,padding:'14px 16px',marginBottom:16,
            display:'flex',alignItems:'center',gap:12}}>
            <ArchetypeGlyph type={result} active color={PADEL_STYLES[result].accent} size={34}/>
            <div>
              <div style={{color:PADEL_STYLES[result].accent,fontSize:16,fontWeight:900}}>
                {PADEL_STYLES[result].name}
              </div>
              <div style={{color:PADEL_STYLES[result].text,fontSize:12,opacity:0.7,marginTop:2}}>
                {PADEL_STYLES[result].subtitle} — {PADEL_STYLES[result].tagline}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{height:1,background:T.sep,margin:'8px 0 18px'}}/>

      {/* Technical questions */}
      <QuestionGroup
        label="Welche Hand?"
        value={profile.handPreference}
        onChange={v=>setProfile(p=>({...p,handPreference:v}))}
        options={[
          {id:'right',label:'Rechtshänder'},
          {id:'left',label:'Linkshänder'},
        ]}/>
      <QuestionGroup
        label="Lieblings-Position am Court"
        value={profile.courtSide}
        onChange={v=>setProfile(p=>({...p,courtSide:v}))}
        options={[
          {id:'left',label:'Ad-Seite (links)'},
          {id:'right',label:'Deuce-Seite (rechts)'},
          {id:'any',label:'Beides geht'},
        ]}/>
      <QuestionGroup
        label="Stärkster Schlag"
        value={profile.strongestShot}
        onChange={v=>setProfile(p=>({...p,strongestShot:v}))}
        options={[
          {id:'smash',label:'Smash / Remate'},
          {id:'volley',label:'Volea'},
          {id:'bandeja',label:'Bandeja'},
          {id:'vibora',label:'Víbora'},
          {id:'drive',label:'Drive'},
          {id:'globo',label:'Globo (Lob)'},
        ]}/>
    </div>
  );
}

function ChapterTheme({theme,setTheme}){
  const themes=[
    {id:'glass',      label:'Liquid Glass',       swatch:['#060709','#FF7A1A','#0A84FF']},
    {id:'glass-light',label:'Liquid Glass Hell',  swatch:['#EEF1F6','#F26A00','#007AFF']},
    {id:'dark',     label:'RITMO BAUHAUS Dark',  swatch:['#000000','#FF7A1A','#FFFFFF']},
    {id:'light',    label:'Federleicht',         swatch:['#FFFFFF','#FF9500','#000000']},
    {id:'padel',    label:'Padelhaus Blue',      swatch:['#0018F9','#FFD60A','#FFFFFF']},
    // Wimbledon Green + RITMO BAUHAUS Funky vorerst ausgeblendet.
  ];
  return(
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {themes.map(t=>{
        const sel=theme===t.id;
        return(
          <div key={t.id} onClick={()=>setTheme(t.id)} style={{
            display:'flex',alignItems:'center',gap:14,
            background:sel?T.oSoft:T.card,
            border:`1.5px solid ${sel?T.o:T.border}`,
            borderRadius:15,padding:'14px 16px',
            cursor:'pointer',transition:'all .15s'}}>
            <div style={{display:'flex',flexShrink:0,borderRadius:5,overflow:'hidden',
              boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.06)'}}>
              {t.swatch.map((c,i)=>(
                <div key={i} style={{width:18,height:30,background:c}}/>
              ))}
            </div>
            <div style={{flex:1,color:T.t1,fontSize:16,fontWeight:sel?700:500}}>
              {t.label}
            </div>
            {sel&&<span style={{color:T.o,fontSize:18,width:16,textAlign:'center'}}>✓</span>}
          </div>
        );
      })}
    </div>
  );
}

function Welcome({profile,setProfile,theme,setTheme,onComplete}){
  const[step,setStep]=useState(0);

  /* CHAPTER DEFINITIONS — extend this array for future onboarding steps
     (Playtomic-Level, Spielstil, Hand-Präferenz, Lieblings-Format, ...) */
  const chapters=[
    {
      id:'welcome',
      title:profile.name?`Willkommen zurück, ${profile.name}!`:'Willkommen!',
      subtitle:'Schön dass du da bist — wir starten kurz mit dem Setup.',
      Content:ChapterWelcome,
      contentProps:{},
      canContinue:()=>true,
      cta:'Los geht\'s',
      skippable:false,
    },
    {
      id:'name',
      title:'Wie heißt du?',
      subtitle:'Damit dich Mitspieler:innen am Court erkennen.',
      Content:ChapterName,
      contentProps:{profile,setProfile},
      canContinue:()=>profile.name.trim().length>0,
      cta:'Weiter',
      skippable:true,
    },
    {
      id:'theme',
      title:'Wähle dein Theme',
      subtitle:'Kann in den Einstellungen jederzeit geändert werden.',
      Content:ChapterTheme,
      contentProps:{theme,setTheme},
      canContinue:()=>true,
      cta:'Weiter',
      skippable:true,
    },
    {
      id:'playtomic',
      title:'Dein Spielniveau',
      subtitle:'Falls du Playtomic spielst — trag dein Level ein. Sonst schätzen wir es.',
      Content:ChapterPlaytomic,
      contentProps:{profile,setProfile},
      canContinue:()=>profile.playtomicLevel!=null||estimateLevel(profile)!=null,
      cta:'Weiter',
      skippable:true,
    },
    {
      id:'playstyle',
      title:'Dein Spielstil',
      subtitle:'Hilft uns, dich besser kennenzulernen und passende Mitspieler:innen vorzuschlagen.',
      Content:ChapterPlaystyle,
      contentProps:{profile,setProfile},
      canContinue:()=>profile.handPreference!=null&&profile.styleType!=null,
      cta:'Fertig',
      skippable:true,
    },
    /* FUTURE: weitere Kapitel hier */
  ];

  const current=chapters[step];
  const isLast=step===chapters.length-1;
  const Content=current.Content;

  const goNext=()=>{ if(isLast) onComplete(); else setStep(s=>s+1); };
  const goBack=()=>{ if(step>0) setStep(s=>s-1); };

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 30px)',position:'relative',overflow:'hidden'}}>

      {/* Header: chapter counter + skip */}
      <div style={{padding:'0 22px',display:'flex',alignItems:'center',
        justifyContent:'space-between',minHeight:24}}>
        <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.5}}>
          {String(step+1).padStart(2,'0')} / {String(chapters.length).padStart(2,'0')}
        </div>
        {current.skippable?(
          <button onClick={goNext}
            style={{background:'none',border:'none',color:T.t3,fontSize:12,
              fontWeight:600,cursor:'pointer',padding:'4px 8px',letterSpacing:.3}}>
            Überspringen
          </button>
        ):<div style={{width:1,height:1}}/>}
      </div>

      <OnboardProgress total={chapters.length} current={step}/>

      {/* Body — re-mount on step change for fresh fade animations */}
      <div key={step} style={{flex:1,padding:'24px 22px 16px',
        overflowY:'auto',WebkitOverflowScrolling:'touch',
        display:'flex',flexDirection:'column'}}>

        <div className="fi" style={{marginBottom:24}}>
          <div style={{color:T.t1,fontSize:28,fontWeight:900,letterSpacing:-.5,lineHeight:1.15}}>
            {current.title}
          </div>
          <div style={{color:T.t2,fontSize:16,marginTop:10,lineHeight:1.55,fontWeight:400}}>
            {current.subtitle}
          </div>
        </div>

        <div className="fu" style={{animationDelay:'.1s'}}>
          <Content {...current.contentProps} onEnter={()=>{if(current.canContinue())goNext();}}/>
        </div>
      </div>

      {/* Footer: back + primary CTA */}
      <div style={{padding:'14px 22px calc(env(safe-area-inset-bottom,0px) + 22px)',
        display:'flex',gap:10,alignItems:'center',background:T.bg,
        borderTop:`1px solid ${T.sep}`}}>
        {step>0&&(
          <button onClick={goBack}
            style={{padding:'14px 18px',background:T.card,
              border:`1px solid ${T.border}`,borderRadius:15,
              color:T.t1,fontSize:16,fontWeight:600,cursor:'pointer'}}>
            Zurück
          </button>
        )}
        <button onClick={goNext} disabled={!current.canContinue()}
          style={{flex:1,padding:'14px 18px',
            background:current.canContinue()?T.o:T.card2,
            border:current.canContinue()?'none':`1px solid ${T.border}`,
            borderRadius:15,
            color:current.canContinue()?'#000':T.t4,
            fontSize:15,fontWeight:800,letterSpacing:.2,
            cursor:current.canContinue()?'pointer':'not-allowed',
            boxShadow:current.canContinue()?'0 4px 14px var(--oGlow)':'none',
            opacity:current.canContinue()?1:0.7,
            transition:'all .2s ease'}}>
          {current.cta}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BOTTOM TAB BAR
═══════════════════════════════════════════════════════════════ */
/* Tab-Icons — Auswahl-Logik: aktiv = Icon wird FILLED in der normalen
   Textfarbe (T.t1, „bleibt weiß"), KEIN Blau. Inaktiv = Outline. */
function ProfilTabIcon({active,size=22}){
  if(active){
    return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4.3" fill={T.t1}/>
      <path d="M 4 20.6 Q 4 13.4 12 13.4 Q 20 13.4 20 20.6 Z" fill={T.t1}/>
    </svg>);
  }
  return(<span style={{display:'inline-flex',color:T.t1}}>
    <PersonGlyph size={size}/>
  </span>);
}
function SucheTabIcon({active,size=22}){
  return(<svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <circle cx="9.5" cy="9.5" r="6" stroke={T.t1} strokeWidth="1.7"
      fill={active?T.t1:'none'}/>
    <line x1="14" y1="14" x2="19" y2="19" stroke={T.t1}
      strokeWidth={active?2.4:1.9} strokeLinecap="round"/>
  </svg>);
}
function BibelTabIcon({active,size=22}){
  return(<svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M4 7 L4 25 L15 27 L15 9 Z" stroke={T.t1} strokeWidth="2.2"
      strokeLinejoin="round" fill={active?T.t1:'none'}/>
    <path d="M28 7 L28 25 L17 27 L17 9 Z" stroke={T.t1} strokeWidth="2.2"
      strokeLinejoin="round" fill={active?T.t1:'none'}/>
  </svg>);
}
/* Live-Tab: Padel-Schläger als SVG (das PNG-LiveIcon kann nicht
   „filled" — andere Verwendungen behalten es). Aktiv = gefüllter
   Schlägerkopf mit ausgestanzten Löchern (evenodd). */
function LiveTabIcon({active,size=22}){
  const head="M12 2.6 C16.6 2.6 19.2 5.7 19.2 9.6 C19.2 13.6 16.1 16.1 12 16.1 C7.9 16.1 4.8 13.6 4.8 9.6 C4.8 5.7 7.4 2.6 12 2.6 Z";
  const holes="M8.7 8.5 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z M13.3 8.5 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z M11 12.1 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z";
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {active
      ?<path d={`${head} ${holes}`} fill={T.t1} fillRule="evenodd"/>
      :<>
        <path d={head} stroke={T.t1} strokeWidth="1.7" strokeLinejoin="round"/>
        <circle cx="9.7" cy="8.5" r="0.95" fill={T.t1}/>
        <circle cx="14.3" cy="8.5" r="0.95" fill={T.t1}/>
        <circle cx="12" cy="12.1" r="0.95" fill={T.t1}/>
      </>}
    <line x1="12" y1="16.6" x2="12" y2="21" stroke={T.t1}
      strokeWidth={active?3:2.6} strokeLinecap="round"/>
  </svg>);
}

/* Fade-out-Blur am unteren Rand — ersetzt die früheren Fußzeilen.
   Inhalte laufen unter Navbar/FABs progressiv in Blur + bg aus.
   Sitzt als Sibling VOR TabBar/MatchBar (zIndex 4 < Bar zIndex 5). */
function BottomFade({height=118}){
  return <div className="bottom-fade" aria-hidden="true" style={{height}}/>;
}

/* ── Einheitlicher Screen-Header ──
   Alle Screens teilen dieselbe Kopf-Geometrie: RITMO-Logo links
   (optisch bündig bei marginLeft -24), Aktions-Icon rechts, darunter
   die drei animierten Bauhaus-Streifen (Echo der Logo-Speed-Lines)
   und der Titel (30/800, T.t2) + optionaler Untertitel. Padding
   überall '0 9px <pad>', Texte/Streifen bei marginLeft 10. */
function BauhausStripes({delay=.15,style}){
  return(
    <div aria-hidden="true" style={{display:'flex',flexDirection:'column',
      gap:3.5,marginLeft:10,marginTop:2,...style}}>
      {[26,17,10].map((w,i)=>(
        <span key={i} className="stripe-in" style={{width:w,height:3,
          borderRadius:2,background:T.o,'--so':[1,.55,.3][i],
          animationDelay:`${delay+i*.1}s`,display:'block'}}/>
      ))}
    </div>
  );
}
/* Kleine Aktions-Glyphen — geteilt von Burger-Menü + Profil-Zeilen. */
function RefreshGlyph({size=18}){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6"/>
      <path d="M20.5 2.5V6h-3.5"/>
    </svg>
  );
}
function ExitGlyph({size=18}){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4H19a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 20h-4.5"/>
      <path d="M10 8l4 4-4 4"/><path d="M14 12H3"/>
    </svg>
  );
}

function ScreenHeader({title,subtitle,icon,right,pad=22,ellipsis=false}){
  return(
    <div className="fi" style={{padding:`0 9px ${pad}px`,flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <RitmoWordmark size={52} style={{marginLeft:-24}}/>
        {(right||icon)&&(
          <span style={{marginRight:5,display:'inline-flex',alignItems:'center'}}>
            {right||icon}
          </span>
        )}
      </div>
      <BauhausStripes/>
      {title!=null&&(
        <div style={{color:T.t2,fontSize:30,marginTop:6,marginLeft:10,fontWeight:800,
          ...(ellipsis?{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}:{})}}>
          {title}
        </div>
      )}
      {subtitle&&(
        <div style={{color:T.t2,fontSize:16,marginTop:2,marginLeft:10,fontWeight:400}}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

/* Tab-Tap → Pill-Blend-Handshake über den Screen-Wechsel hinweg.
   Jeder Screen mountet seine EIGENE TabBar; beim Tap wird der Blend
   hier „bewaffnet" und vom TabBar-Mount des Ziel-Screens konsumiert.
   Event-Handler feuern genau einmal → StrictMode-sicher (im Gegensatz
   zu Initializer-/Effect-Seiteneffekten). Drag-Commits armen nicht —
   nach dem Snap sitzt die Pill bereits unterm Finger. */
let __navBlendArm=false;

/* ── FEEDBACK-BUS — leichtes Toast-System (Liquid-Glass-Look) ─────
   notify('Text') von überall aufrufbar (modul-scope, kein Context
   nötig); <Toasts/> hängt einmal im App-Root. Auto-Dismiss nach
   2.6s, gestapelt über der TabBar, pointer-events:none — Toasts
   informieren, sie blockieren nie. */
let __toastPush=null;
function notify(msg,kind='ok'){
  buzz(kind==='err'?[24,40,24]:8);
  if(__toastPush) __toastPush({msg,kind});
}
function Toasts(){
  const[items,setItems]=useState([]);
  useEffect(()=>{
    __toastPush=t=>{
      const id=Math.random().toString(36).slice(2);
      setItems(x=>[...x.slice(-2),{...t,id}]);
      setTimeout(()=>setItems(x=>x.filter(i=>i.id!==id)),2600);
    };
    return()=>{__toastPush=null;};
  },[]);
  if(!items.length) return null;
  return(
    <div style={{position:'fixed',left:0,right:0,zIndex:400,pointerEvents:'none',
      bottom:'calc(env(safe-area-inset-bottom,0px) + 104px)',
      display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
      {items.map(t=>(
        <div key={t.id} className="si" style={{display:'flex',alignItems:'center',gap:9,
          maxWidth:'min(86vw, 420px)',padding:'11px 18px',borderRadius:999,
          background:'color-mix(in srgb, var(--bg) 62%, var(--card2))',
          backdropFilter:'blur(18px) saturate(1.5)',WebkitBackdropFilter:'blur(18px) saturate(1.5)',
          border:`1px solid ${T.border}`,boxShadow:'0 12px 34px rgba(0,0,0,.38)',
          color:T.t1,fontSize:13.5,fontWeight:700}}>
          <span style={{color:t.kind==='err'?T.r:T.g,fontWeight:900,flexShrink:0}}>
            {t.kind==='err'?'✕':'✓'}
          </span>
          <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',
            whiteSpace:'nowrap'}}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ── KONTEXTUELLE ACTION-BAR — Primäraktionen eines Screens als
   schwebende Glass-Pills über der Navigation (iOS-26-Muster:
   Navigation unten, situative Aktionen direkt darüber im
   Daumenradius). primary bekommt Brand-Orange, Rest Milchglas. */
function GlassActionBar({actions=[],bottom='calc(env(safe-area-inset-bottom,0px) + 96px)'}){
  if(!actions.length) return null;
  return(
    <div style={{position:'fixed',left:0,right:0,bottom,zIndex:6,pointerEvents:'none',
      display:'flex',justifyContent:'center',gap:10,padding:'0 22px'}}>
      {actions.map((a,i)=>(
        <button key={i} onClick={()=>{buzz(8);a.onClick&&a.onClick();}}
          className="fu" style={{animationDelay:`${i*0.04}s`,pointerEvents:'auto',
            padding:'14px 22px',borderRadius:999,cursor:'pointer',
            border:a.primary?'none':`1px solid ${T.border}`,
            background:a.primary?T.o:'color-mix(in srgb, var(--bg) 55%, var(--card2))',
            backdropFilter:'blur(18px) saturate(1.5)',WebkitBackdropFilter:'blur(18px) saturate(1.5)',
            color:a.primary?'#000':T.t1,fontSize:14.5,fontWeight:800,
            boxShadow:a.primary?`0 12px 30px ${T.oGlow}`:'0 12px 30px rgba(0,0,0,.35)'}}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

function TabBar({active,onTab}){
  // Such-FAB + Navbar-Suchmodus sind entfernt (Einstellungen haben ein
  // eigenes Suchfeld im Screen). Die früheren searchable/rightAction-
  // Codepfade bleiben inert über diese Konstanten.
  const searchable=false, rightAction=null, onSearch=null;
  const tabs=[
    {id:'home',label:'Home',Icon:HomeIcon},
    {id:'profil',label:'Profil',Icon:ProfilTabIcon},
    {id:'live',label:'Live',Icon:LiveTabIcon},
    {id:'suche',label:'Suche',Icon:SucheTabIcon},
    {id:'bibel',label:'Bibel',Icon:BibelTabIcon},
  ];
  // Search-Mode: nur aktiv wenn searchable=true. Tab "Home" bleibt sichtbar,
  // die anderen schrumpfen via maxWidth/opacity raus, ein Such-Input
  // expandiert in den freigewordenen Platz.
  const[searchMode,setSearchMode]=useState(false);
  const[searchValue,setSearchValue]=useState('');
  const inputRef=useRef(null);

  // ── Liquid-Glass-Pill ──
  // Refs auf jeden Tab-Button + Container, damit wir die exakte
  // Position der aktiven Karte messen können. Mouse-Hover (NICHT
  // Touch) zeigt eine Preview-Position der Pill, damit das Glas
  // dem Finger/Cursor folgt — analog iOS 26.
  const navRef=useRef(null);
  const tabRefs=useRef({});
  const[hovered,setHovered]=useState(null);
  const[pill,setPill]=useState({left:0,top:0,width:0,height:0,ready:false});
  const targetTab=hovered||active;
  // ── Greifbare Pill (Apple-style) ──
  // grab=true solange der Finger die Pill hält und führt. grabFlag
  // spiegelt den State als Ref, damit der Mess-Loop (rAF) nicht
  // gegen den Finger kämpft. movedRef schluckt den Klick, der nach
  // einem Drag auf dem darunterliegenden Tab-Button landen würde.
  const[grab,setGrab]=useState(false);
  const grabFlag=useRef(false);
  const movedRef=useRef(false);
  // ── Blend-in der Pill bei Tab-TAP ──
  // Wurde dieser Mount durch einen Tab-Tap ausgelöst (__navBlendArm),
  // „kondensiert" die Pill am aktiven Tab: Opacity + Blur klingen ab,
  // der Backdrop-Blur rampt hoch (pillBlend-Keyframes). Beide
  // StrictMode-Render-Pässe lesen das Flag nur; zurückgesetzt wird es
  // erst im Mount-Effect → konsistenter Wert.
  const[blendIn]=useState(()=>__navBlendArm);
  useEffect(()=>{__navBlendArm=false;},[]);

  // Tab-Geometrien relativ zur Padding-Box des Navbars (gleicher
  // Bezugsrahmen wie die absolute Pill).
  const tabRects=()=>{
    const navEl=navRef.current; if(!navEl) return [];
    const navRect=navEl.getBoundingClientRect();
    const cs=window.getComputedStyle(navEl);
    const bL=parseFloat(cs.borderLeftWidth)||0;
    const bT=parseFloat(cs.borderTopWidth)||0;
    return tabs.map(t=>{
      const el=tabRefs.current[t.id]; if(!el) return null;
      const r=el.getBoundingClientRect();
      return {id:t.id,left:r.left-navRect.left-bL,top:r.top-navRect.top-bT,
        width:r.width,height:r.height,center:r.left-navRect.left-bL+r.width/2};
    }).filter(Boolean);
  };
  const nearestTab=(x)=>{
    const rs=tabRects(); if(!rs.length) return null;
    let best=rs[0];
    for(const r of rs){ if(Math.abs(r.center-x)<Math.abs(best.center-x)) best=r; }
    return best;
  };
  const navX=(clientX)=>{
    const navEl=navRef.current; if(!navEl) return 0;
    return clientX-navEl.getBoundingClientRect().left;
  };

  // Pointer-Down auf der Bar: ab 6px Bewegung „löst" sich die Pill
  // und folgt dem Finger (geclampt zwischen erstem/letztem Tab-Center);
  // der nächstgelegene Tab bekommt eine Preview-Tönung. Loslassen
  // snappt auf den nächsten Tab und committet ihn.
  const onBarPointerDown=(e)=>{
    if(searchable&&searchMode) return;          // im Such-Modus kein Drag
    if(e.pointerType==='mouse'&&e.button!==0) return;
    const startX=e.clientX; let moved=false;
    const move=(ev)=>{
      if(!moved&&Math.abs(ev.clientX-startX)<6) return;
      if(!moved){ moved=true; movedRef.current=true; grabFlag.current=true; setGrab(true); }
      const x=navX(ev.clientX);
      const t=nearestTab(x);
      if(!t) return;
      setHovered(t.id);
      const rs=tabRects();
      const minC=rs[0].center, maxC=rs[rs.length-1].center;
      const cx=Math.max(minC,Math.min(maxC,x));
      setPill({left:cx-t.width/2,top:t.top,width:t.width,height:t.height,ready:true});
    };
    const up=(ev)=>{
      window.removeEventListener('pointermove',move);
      window.removeEventListener('pointerup',up);
      window.removeEventListener('pointercancel',up);
      if(!moved) return;                         // Tap → Button-onClick übernimmt
      grabFlag.current=false; setGrab(false); setHovered(null);
      const t=nearestTab(navX(ev.clientX));
      if(t&&t.id!==active){buzz(6);onTab(t.id);}
      else { const m=measurePill(); if(m) setPill({...m,ready:true}); }
      // Klick-Event des Buttons unter dem Finger schlucken (feuert
      // direkt nach pointerup, vor dem Timeout).
      setTimeout(()=>{movedRef.current=false;},0);
    };
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up);
    window.addEventListener('pointercancel',up);
  };

  // Mess-Helper: liefert die Position des Ziel-Tabs RELATIV zur
  // Padding-Box des Navbar-Containers — das ist auch der Bezugsrahmen
  // für absolute-positionierte Kinder mit top:0/left:0. Wir nutzen
  // getBoundingClientRect statt offsetLeft/Top, weil das in jedem
  // Browser konsistent verhält (offsetLeft ist je nach Engine vom
  // Border- oder Padding-Rand gemessen → kann 1–5px off sein).
  const measurePill=()=>{
    const navEl=navRef.current;
    const tabEl=tabRefs.current[targetTab];
    if(!navEl||!tabEl) return null;
    const navRect=navEl.getBoundingClientRect();
    const tabRect=tabEl.getBoundingClientRect();
    const cs=window.getComputedStyle(navEl);
    // Border + (left:0 sitzt auf der Padding-Innenkante, also nur die
    // Border der Box rausrechnen). Padding selbst gehört zum
    // Bezugsrahmen, also NICHT abziehen.
    const bL=parseFloat(cs.borderLeftWidth)||0;
    const bT=parseFloat(cs.borderTopWidth)||0;
    return {
      left:tabRect.left-navRect.left-bL,
      top:tabRect.top-navRect.top-bT,
      width:tabRect.width,
      height:tabRect.height,
    };
  };

  // useLayoutEffect, damit die Pill schon im ersten Frame korrekt
  // sitzt — sonst sähe man sie 1 Tick lang an der falschen Stelle.
  useLayoutEffect(()=>{
    // Im Search-Mode wird die Pill ausgeblendet (siehe opacity
    // unten), weil der aktive Tab (z. B. "settings") in Search-Mode
    // auf width:0 kollabiert. Eine 0-Pixel-Pill mit Glow würde sonst
    // als kleine graue Box am Rand stehenbleiben.
    if(searchMode){
      setPill(p=>({...p,ready:false}));
      return;
    }
    // rAF-Follow statt Einmal-Messung: der aktive Tab animiert seine
    // Breite (Label klappt auf), also läuft die Messung ~520ms mit,
    // damit die Pill der wachsenden Kante folgt. Während eines Drags
    // (grabFlag) führt der Finger — kein Auto-Snap dazwischenfunken.
    let raf; const t0=performance.now();
    const tick=()=>{
      if(!grabFlag.current){
        const m=measurePill();
        if(m) setPill({...m,ready:true});
      }
      if(performance.now()-t0<520) raf=requestAnimationFrame(tick);
    };
    tick();
    return()=>cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[targetTab,searchMode]);

  // Resize: TabBar-Layout kann sich z. B. bei Theme-Wechsel oder
  // Rotation ändern — Pill nachjustieren. ResizeObserver wäre sauberer,
  // aber window-resize reicht für unser Inline-Layout.
  useEffect(()=>{
    const onResize=()=>{
      if(searchMode) return;
      const m=measurePill();
      if(!m) return;
      setPill(p=>({...p,...m}));
    };
    window.addEventListener('resize',onResize);
    return()=>window.removeEventListener('resize',onResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[targetTab,searchMode]);

  // Beim Verlassen des suchbaren Screens: Mode + Query zurücksetzen.
  useEffect(()=>{
    if(!searchable||active!=='settings'){
      if(searchMode||searchValue){
        setSearchMode(false);setSearchValue('');
        onSearch?.('');
      }
    }
    // eslint-disable-next-line
  },[active,searchable]);

  // Auto-focus auf den Input direkt beim Eintritt in Search-Mode.
  useEffect(()=>{
    if(searchMode) requestAnimationFrame(()=>inputRef.current?.focus());
  },[searchMode]);

  const exitSearch=()=>{setSearchMode(false);setSearchValue('');onSearch?.('');};
  const submit=()=>{
    if(!searchValue.trim()){exitSearch();return;}
    onSearch?.(searchValue.trim());
  };
  const clearText=()=>{setSearchValue('');onSearch?.('');inputRef.current?.focus();};

  const isSearching=searchable&&searchMode;
  // Default-Action: passives Such-Icon. Screens dürfen rightAction
  // überschreiben (z.B. Home → RITMO DNA Shortcut).
  const action=rightAction||{icon:<SearchIcon size={20}/>,onClick:undefined,title:''};
  // Klick-Handler des rechten Floating-Buttons:
  //  - Im Search-Mode → submit() (oder exit wenn leer)
  //  - Sonst suchbar → Search-Mode einschalten
  //  - Sonst → rightAction.onClick
  const rightClick=()=>{
    if(isSearching) return submit();
    if(searchable){setSearchMode(true);return;}
    action.onClick?.();
  };
  const rightIcon=isSearching
    ?<SearchIcon size={20} filled={!!searchValue}/>
    :(searchable?<SearchIcon size={20}/>:action.icon);
  const rightTitle=isSearching
    ?(searchValue?'Suchen':'Suche schließen')
    :(searchable?'Suchen':action.title);
  const rightHighlight=isSearching?!!searchValue:!!action.highlight;

  return(
    <div style={{position:'absolute',
      // Navbar tiefer ansetzen: nur ~30% des Bottom-Safe-Insets als Abstand
      // (vorher fast der volle Inset), zusätzlich 5px tiefer → die Bar
      // hugt die untere Kante.
      bottom:'calc(env(safe-area-inset-bottom, 0px) * 0.3 - 3px)',
      left:0,right:0,display:'flex',alignItems:'center',justifyContent:'center',gap:10,
      padding:'0 14px',pointerEvents:'none',zIndex:5}}>
      {/* Liquid-Glass-Surface (reactbits GlassSurface) als Glas-
          HINTERGRUND — echte SVG-Refraktion auf Chromium, Blur-Fallback
          auf Safari/iOS. Die interaktive Bar (Pill + Tabs) liegt als
          Geschwister DARUEBER: so bleibt die Pill-Messung unveraendert
          und sie steckt nicht im gefilterten/geklippten Glas-Subtree
          (das sonst die Transitions der Pill einfriert). */}
      <div style={{position:'relative',flex:1,maxWidth:440,height:57,pointerEvents:'auto'}}>
      <GlassSurface width="100%" height="100%" borderRadius={28}
        className="nav-glass"
        brightness={58} opacity={0.92} blur={11}
        displace={0.6} distortionScale={-130}
        redOffset={0} greenOffset={8} blueOffset={16}
        style={{position:'absolute',inset:0,pointerEvents:'none'}}/>
      <div ref={navRef} onPointerDown={onBarPointerDown}
        style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',gap:2,
        width:'100%',height:'100%',
        /* Voll gerundete Enden (999), minimale vertikale Paddings —
           die Bar liest sich als echte Pille. */
        borderRadius:999,padding:'3px 5px',
        // touchAction none: während des Pill-Drags darf der Browser
        // die Pointer-Events nicht für Scroll/Swipe übernehmen.
        touchAction:'none',
        transition:'padding .25s ease'}}>

        {/* Liquid-Glass-Pill — folgt dem aktiven (bzw. hovered) Tab.
            Greifbar: pointerdown + Bewegung löst sie vom Raster, sie
            folgt dem Finger (data-grab), Loslassen snappt mit Spring
            auf den nächsten Tab (iOS-26-Gefühl). Nach Tab-Tap (blendIn)
            kondensiert das Glas am Ziel weich ein statt zu sliden. */}
        <div className="liquid-pill"
          data-hover={hovered!=null?'true':'false'}
          data-grab={grab?'true':'false'}
          data-blend={blendIn?'true':'false'}
          style={{
            transform:`translate(${pill.left}px, ${pill.top}px)`,
            width:pill.width,
            height:pill.height,
            opacity:pill.ready?1:0,
          }}/>

        {tabs.map(({id,label,Icon})=>{
          const isActive=active===id;
          const isPreview=hovered===id;       // Drag/Maus-Preview-Tönung
          // Im Search-Mode bleibt nur Home sichtbar; die übrigen Tabs
          // animieren weg (Breite/Padding/Opacity).
          const hidden=isSearching&&id!=='home';
          return(
            <button key={id}
              onClick={()=>{
                // Nach einem Pill-Drag landet der synthetische Klick
                // auf dem Button unterm Finger — schlucken, der Drag
                // hat den Tab bereits committet.
                if(movedRef.current) return;
                // Tap auf einen ANDEREN Tab → Blend-in der Pill auf
                // dem Ziel-Screen bewaffnen (siehe __navBlendArm).
                if(id!==active){__navBlendArm=true;buzz(6);}
                onTab(id);
              }}
              ref={el=>{tabRefs.current[id]=el;}}
              onPointerEnter={e=>{
                // Nur Maus-Hover → Preview-Position der Pill.
                // Touch-Devices triggern pointerEnter beim ersten
                // Berühren — das wäre ein versehentlicher Preview.
                if(e.pointerType==='mouse'&&!hidden&&!grabFlag.current) setHovered(id);
              }}
              onPointerLeave={e=>{
                if(e.pointerType==='mouse'&&!grabFlag.current) setHovered(null);
              }}
              style={{display:'flex',flexDirection:'column',alignItems:'center',
                justifyContent:'center',gap:2,
                /* eBay-Style: Icon oben, Label IMMER darunter. Flach
                   gehalten (kompakte Paddings) und per flex:1 über die
                   volle Bar-Breite verteilt — alle Tabs gleich breit,
                   die Pill bleibt damit konstant groß. */
                padding:hidden?'6px 0':'6px 4px',
                flex:hidden?'0 0 0':'1 1 0',
                minWidth:0,
                maxWidth:hidden?0:140,
                opacity:hidden?0:1,
                overflow:'hidden',
                borderRadius:999,border:'none',cursor:'pointer',
                /* Hintergrund ist transparent — die Pill übernimmt
                   das "Active"-Indicator-Bild. */
                background:'transparent',
                color:isActive?T.t1:T.t2,
                fontSize:10,fontWeight:600,
                position:'relative',zIndex:1,
                transition:'min-width .25s ease, max-width .25s ease, padding .25s ease, opacity .2s ease, color var(--anim-base)'}}>
              {/* key=isActive zwingt das Icon-Wrapper-Element zum Remount
                  beim Tab-Wechsel, sodass die Bounce-Animation jedes Mal
                  neu durchläuft. */}
              <span key={isActive?'on':'off'}
                className={isActive?'nav-icon-active':''}
                style={{display:'inline-flex',transformOrigin:'center'}}>
                <Icon active={isActive||isPreview} size={23}/>
              </span>
              <span style={{fontSize:10,whiteSpace:'nowrap',letterSpacing:.1,
                color:isActive?T.t1:T.t3,fontWeight:isActive?800:600,
                transition:'color var(--anim-base)'}}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   IN-MATCH BOTTOM BAR (Home + Search separat)
═══════════════════════════════════════════════════════════════ */
function MatchBar({onHome,rightIcon,onRight,rightButtons}){
  // Liquid-Glass-FABs: Material kommt aus der .glass-bar-Klasse
  // (Backdrop-Blur + Tönung); eigene btn.style-Overrides (z. B. der
  // grüne Start-Button) gewinnen als Inline-Styles weiterhin.
  const baseStyle={
    width:48,height:48,borderRadius:'50%',
    display:'flex',alignItems:'center',justifyContent:'center',
    pointerEvents:'auto',
    flexShrink:0,
  };
  // Legacy single-button mode → wrap into array
  const buttons=rightButtons||(rightIcon?[{icon:rightIcon,onClick:onRight}]:[]);
  return(
    <div style={{position:'absolute',
      // Auf Navbar-Hoehe: gleicher Bottom-Anchor wie die TabBar
      // (calc(...*0.3 - 3px)) + feste Hoehe = Navbar-Pillen-Hoehe (57px).
      // So sitzen Home/Start/Index/Weiter exakt auf der Navbar-Mittel-
      // linie; alignItems:center zentriert auch groessere FABs (56px) darauf.
      bottom:'calc(env(safe-area-inset-bottom, 0px) * 0.3 - 3px)',height:57,
      left:0,right:0,display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'0 24px',pointerEvents:'none',zIndex:5}}>
      <button onClick={onHome} className="glass-bar" style={{...baseStyle,cursor:'pointer'}}>
        <HomeIcon size={20}/>
      </button>
      <div style={{display:'flex',gap:10,alignItems:'center',pointerEvents:'auto'}}>
        {buttons.map((btn,i)=>(
          <button key={i} onClick={btn.onClick} disabled={btn.disabled}
            className="glass-bar"
            style={{
              ...baseStyle,
              ...(btn.style||{}),
              cursor:btn.disabled?'not-allowed':'pointer',
              opacity:btn.disabled?.5:1,
              transition:'opacity .15s',
            }}
            onPointerDown={e=>!btn.disabled&&(e.currentTarget.style.opacity='.7')}
            onPointerUp={e=>e.currentTarget.style.opacity=btn.disabled?.5:1}
            onPointerLeave={e=>e.currentTarget.style.opacity=btn.disabled?.5:1}>
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOME SCREEN
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   PROFILE — Avatar + Spielerprofil-Seite
═══════════════════════════════════════════════════════════════ */


function ProfileAvatar({name,avatar,size=40,onClick,emphasize=false}){
  const init=getInitials(name);
  const ringColor=emphasize?T.o:T.border;
  return(
    <button onClick={onClick} aria-label="Spielerprofil"
      style={{width:size,height:size,borderRadius:'50%',
        background:T.card2,border:`1.5px solid ${ringColor}`,
        color:T.o,fontWeight:800,fontSize:size*0.4,
        cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
        padding:0,letterSpacing:.5,flexShrink:0,overflow:'hidden',
        transition:'transform .15s, border-color .15s',
        boxShadow:emphasize?'0 4px 14px var(--oGlow)':'0 1px 3px rgba(0,0,0,.25)'}}>
      {(()=>{
        // Defensive: avatar kommt aus User-Upload via Canvas-Re-Encoding →
        // immer data:image/jpeg. Wenn etwas Anderes drinsteht (DB-Tampering,
        // älteres Profil mit fremder URL), fallen wir auf die Initialen
        // zurück statt arbitrary content zu rendern.
        const safe=safeImageSrc(avatar);
        return safe
          ?<img src={safe} alt={name||'Profil'}
            style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
          :(init||<span style={{color:T.t2}}><PersonGlyph size={size*0.55}/></span>);
      })()}
    </button>
  );
}

/* Avatar im Profile-Screen: zeigt profile.avatar (Base64), wenn
   vorhanden, sonst Initials. Klick öffnet File-Picker und
   resampled das Bild auf 256x256 als JPEG-DataURL → ins Profil.
   Kleines Edit-Badge in der unteren rechten Ecke. */
function AvatarWithUpload({profile,setProfile,size=72}){
  const inputRef=useRef(null);
  const onPick=async(e)=>{
    const file=e.target.files?.[0];
    e.target.value='';
    if(!file) return;
    try{
      const dataUrl=await readImageAsDataUrl(file);
      const resized=await resizeImage(dataUrl,256);
      setProfile(p=>({...p,avatar:resized}));
    }catch(err){
      console.warn('[avatar] upload failed:',err);
    }
  };
  return(
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <ProfileAvatar name={profile.name} avatar={profile.avatar}
        size={size} emphasize
        onClick={()=>inputRef.current?.click()}/>
      {/* Edit-Badge im Outline-Look: dunkler Kreis, oranger Ring +
          oranger Stift — sitzt auf dem Avatar-Ring (vgl. Mock). */}
      <button onClick={()=>inputRef.current?.click()} aria-label="Profilbild ändern"
        style={{position:'absolute',right:size*0.02,bottom:size*0.02,
          width:Math.max(26,size*0.2),height:Math.max(26,size*0.2),borderRadius:'50%',
          background:T.bg,border:`1.5px solid ${T.o}`,color:T.o,
          fontSize:13,fontWeight:800,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,.45)'}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp"
        onChange={onPick} style={{display:'none'}}/>
    </div>
  );
}


/* Dezente Gradient-Töne für die Stil-Buttons im Profil (User-Spec):
   toro rot · motor dunkelgrün · muro hellgrün · individuoso dunkel-
   blau · fantasma dezentes violett · chico/chica beige. */
const STYLE_GRAD={
  toro:'#C0392B',
  motor:'#1B5E20',
  muro:'#2ECC71',
  individuoso:'#1F4E8C',
  fantasma:'#6E5A8E',
  chico:'#C9B18C',
  hysterica:'#D81E5B',
};
/* Subtiler Stil-Gradient: Farbton oben links, läuft ins Transparente. */
const styleGrad=id=>{
  const g=STYLE_GRAD[id];
  return g?`linear-gradient(135deg, ${g}45 0%, ${g}1C 55%, rgba(0,0,0,0) 100%)`:'transparent';
};

/* Zähl-Animation für die Auswertungs-Zahlen — 0 → Zielwert (easeOutCubic).
   Re-triggert, sobald sich der Wert ändert (Stats geladen / Reset). */
function CountUp({value,dur=750,suffix=''}){
  const target=Number(value)||0;
  // Reduced-Motion (Accessibility) ODER kein rAF → direkt den Zielwert
  // zeigen statt zu animieren (sonst bliebe die Zahl auf 0 stehen).
  const reduce=typeof window!=='undefined'&&window.matchMedia
    &&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const[n,setN]=useState(reduce?target:0);
  useEffect(()=>{
    if(reduce||target<=0){setN(target>0?target:0);return;}
    let raf,start=null;
    const tick=(ts)=>{
      if(start===null)start=ts;
      const p=Math.min(1,(ts-start)/dur);
      setN(Math.round(target*(1-Math.pow(1-p,3))));
      if(p<1) raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(raf);
  },[target,dur,reduce]);
  return <>{n}{suffix}</>;
}

function Profile({profile,setProfile,onHome,onLogout,onResetOnboarding,onOpenRitmoDNA,
  currentUid,onOpenFollowers,onOpenFollowing,onTab,onOpenSettings,onOpenEdit,onResetStats}){
  // Kurzlabels für die Stats-Spalten (Mock: nur „Rechts"/„Links").
  const handLabels={right:'Rechts',left:'Links'};
  const sideLabels={left:'Ad-Seite (links)',right:'Deuce-Seite (rechts)',any:'Beides geht'};

  const[editingLevel,setEditingLevel]=useState(false);
  const[confirmReset,setConfirmReset]=useState(false);
  // Follower-Counts werden bei jedem Mount frisch geladen, damit nach
  // Follow/Unfollow im anderen Screen die Anzeige aktualisiert.
  const[counts,setCounts]=useState({followers:0,following:0});
  useEffect(()=>{
    if(!currentUid) return;
    let cancelled=false;
    followCounts(currentUid).then(c=>{ if(!cancelled) setCounts(c); });
    return()=>{cancelled=true;};
  },[currentUid]);

  // Statistiken (ritmo_matches) — aus dem DNA-Screen hierher umgezogen.
  const STATS_EMPTY={matches:0,wins:0,losses:0,winRate:0,formTrend:[],
    weeklyMatches:[0,0,0,0,0,0,0],weekDays:['M','D','M','D','F','S','S'],avgSets:'0'};
  const[stats,setStats]=useState(null);
  useEffect(()=>{
    let alive=true;
    // Supabase hat Vorrang; ohne Backend/Session greift das lokale
    // Match-Log → gespielte Single Matches (Best of 3) und Turniere
    // fliessen so auch offline in die Auswertung ein.
    dbLoadMatchStats().then(s=>{if(alive)setStats(s||dbLoadMatchStatsLocal()||STATS_EMPTY);})
      .catch(()=>{if(alive)setStats(dbLoadMatchStatsLocal()||STATS_EMPTY);});
    return()=>{alive=false;};
  // Neu laden nach Reset (matchesPlayed→0) bzw. neu geloggten Matches.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile.matchesPlayed]);
  const safeStats=stats||STATS_EMPTY;

  // Scroll-Navigation: die rechte Dot-Leiste bildet die Sektionen ab
  // (kopf · dna · stats · mehr) und füllt die Linie mit dem Fortschritt.
  const SECTIONS=['kopf','dna','stats','mehr'];
  const scrollRef=useRef(null);
  const secRefs=useRef({});
  const[navSec,setNavSec]=useState(0);
  const[scrollProg,setScrollProg]=useState(0);
  const onProfileScroll=()=>{
    const el=scrollRef.current;if(!el)return;
    const p=el.scrollTop/Math.max(1,el.scrollHeight-el.clientHeight);
    setScrollProg(p);
    const marker=el.scrollTop+el.clientHeight*0.35;
    let act=0;
    SECTIONS.forEach((k,i)=>{const r=secRefs.current[k];if(r&&r.offsetTop<=marker)act=i;});
    // Am Scroll-Ende zählt immer die letzte Sektion — sonst wäre sie
    // bei hohen Viewports nie erreichbar (Marker kommt nicht so tief).
    if(p>=0.98) act=SECTIONS.length-1;
    setNavSec(act);
  };

  const lvl=profile.playtomicLevel??profile.estimatedLevel??estimateLevel(profile);
  const isEstimated=profile.playtomicLevel==null&&lvl!=null;
  const isPublic=!profile.private;
  const togglePublic=()=>setProfile(p=>({...p,private:!p.private?true:false}));

  // Editorial-Look (per Design-Mock): pures Orange als einziger Accent,
  // keine Cards — Sektionen trennen sich über Hairlines (T.sep).
  const tint=p=>`color-mix(in srgb, var(--o) ${p}%, transparent)`;
  const hasStyle=!!(profile.styleType&&PADEL_STYLES[profile.styleType]);
  // Zweiter Spielstil: gespeichert (styleType2) oder lazy aus den
  // Quiz-Antworten abgeleitet (ältere Profile ohne Feld).
  const style2=(profile.styleType2&&PADEL_STYLES[profile.styleType2])
    ?profile.styleType2
    :(profile.quizAnswers?computeStyles(profile.quizAnswers).secondary:null);
  const eyeb={color:T.t3,fontSize:9.5,fontWeight:700,letterSpacing:1.9,textTransform:'uppercase'};
  const statVal={color:T.t1,fontSize:11,fontWeight:800,letterSpacing:.4,textTransform:'uppercase',
    marginTop:9,lineHeight:1.3,minHeight:29,display:'flex',alignItems:'center',justifyContent:'center'};
  const rowSty=top=>({width:'100%',display:'flex',alignItems:'center',gap:14,padding:'17px 2px',
    background:'none',border:'none',borderTop:top?`1px solid ${T.sep}`:'none',
    cursor:'pointer',textAlign:'left'});
  const rowLbl={display:'block',color:T.t1,fontSize:12,fontWeight:800,letterSpacing:1.7,
    textTransform:'uppercase'};

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden'}}>

      <div ref={scrollRef} onScroll={onProfileScroll}
        style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',position:'relative',
        padding:'calc(env(safe-area-inset-top,0px) + 56px) 22px 0'}}>

        {/* Deko — linke Dot-Kolonne (artistischer Marker aus dem Mock) */}
        <div aria-hidden="true" className="fi" style={{position:'absolute',left:8,
          top:'calc(env(safe-area-inset-top,0px) + 78px)',
          display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
          {[0,1,2].map(i=>(
            <span key={i} style={{display:'flex',gap:3.5}}>
              <span style={{width:3.5,height:3.5,borderRadius:'50%',
                border:`1px solid ${T.t4}`,display:'block'}}/>
              <span style={{width:3.5,height:3.5,borderRadius:'50%',
                border:`1px solid ${T.t4}`,display:'block'}}/>
            </span>
          ))}
        </div>

        {/* Kopf: links Eyebrow + Name + Tagline, rechts das große Level
            (Dezimalpunkt in Orange) + kompakter Sichtbarkeits-Switch */}
        <div ref={el=>{secRefs.current.kopf=el;}} className="fi"
          style={{display:'flex',justifyContent:'space-between',
          alignItems:'flex-start',gap:12}}>
          <div style={{minWidth:0,flex:1}}>
            {/* Bauhaus-Streifen wie in den Screen-Headern — links,
                über dem Eyebrow */}
            <BauhausStripes delay={.05} style={{marginLeft:0,marginTop:0,marginBottom:9}}/>
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:T.o,flexShrink:0}}/>
              <span style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:2.4,
                textTransform:'uppercase'}}>Profil</span>
            </div>
            <div className="fu" style={{color:T.t1,fontSize:38,fontWeight:900,letterSpacing:-1.4,
              lineHeight:1.02,marginTop:8,overflowWrap:'anywhere'}}>
              {displayName(profile)}
            </div>
            <div className="fu" style={{animationDelay:'.05s',...eyeb,marginTop:11}}>
              Dein Stil · Dein Rhythmus · Deine Stats
            </div>
          </div>
          <div className="fu" style={{animationDelay:'.07s',textAlign:'right',flexShrink:0}}>
            {lvl!=null&&(<>
              <div style={{...eyeb,marginBottom:5}}>RITMO Level</div>
              <div style={{color:T.t1,fontSize:48,fontWeight:900,letterSpacing:-2,lineHeight:.95}}>
                {lvl.toFixed(2).split('.')[0]}
                <span style={{color:T.o}}>.</span>
                {lvl.toFixed(2).split('.')[1]}
              </div>
            </>)}
            {/* Sichtbarkeit: Auge + Switch — die ehemalige
                „Profil öffentlich"-Zeile, kompakt unterm Level */}
            <div style={{display:'flex',alignItems:'center',gap:8,
              justifyContent:'flex-end',marginTop:lvl!=null?10:2}}>
              <span style={{color:isPublic?T.o:T.t3,display:'inline-flex',
                transition:'color .25s'}}><EyeIcon size={16}/></span>
              <span onClick={togglePublic} role="switch" aria-checked={isPublic}
                aria-label={isPublic?'Profil öffentlich':'Profil privat'}
                style={{width:38,height:22,borderRadius:14,flexShrink:0,
                  background:isPublic?T.o:'rgba(120,120,128,.32)',position:'relative',
                  cursor:'pointer',transition:'background .25s',display:'inline-block'}}>
                <span style={{width:18,height:18,borderRadius:'50%',background:T.bg,
                  position:'absolute',top:2,left:isPublic?18:2,transition:'left .25s',
                  boxShadow:'0 1px 3px rgba(0,0,0,.3)',display:'block'}}/>
              </span>
            </div>
          </div>
        </div>

        {/* Avatar mit Orange-Glow → RITMO DNA → Stil-Pill */}
        <div ref={el=>{secRefs.current.dna=el;}} className="zi"
          style={{animationDelay:'.1s',display:'flex',flexDirection:'column',
          alignItems:'center',marginTop:30}}>
          <div className="float-y" style={{borderRadius:'50%',
            boxShadow:`0 0 70px ${tint(26)}, 0 0 22px ${tint(20)}`}}>
            <AvatarWithUpload profile={profile} setProfile={setProfile} size={150}/>
          </div>
          <div className="fu" style={{animationDelay:'.18s',marginTop:26,color:T.t1,
            fontSize:16,fontWeight:800,letterSpacing:4.5,textTransform:'uppercase'}}>
            RITMO <span style={{color:T.o}}>DNA</span>
          </div>
          <button className="fu" onClick={hasStyle?()=>onOpenRitmoDNA&&onOpenRitmoDNA():onResetOnboarding}
            style={{animationDelay:'.22s',marginTop:15,display:'inline-flex',alignItems:'center',
              gap:11,padding:'12px 24px',borderRadius:999,
              background:hasStyle?styleGrad(profile.styleType):'transparent',
              border:`1px solid ${hasStyle?`${STYLE_GRAD[profile.styleType]}66`:T.t4}`,
              color:T.t1,fontSize:11.5,fontWeight:800,
              letterSpacing:2,textTransform:'uppercase',cursor:'pointer'}}>
            {hasStyle
              ?`${PADEL_STYLES[profile.styleType].name} · ${PADEL_STYLES[profile.styleType].subtitle}`
              :'Spielstil bestimmen'}
            <ChevronRightIcon size={13} color={T.t2}/>
          </button>
        </div>

        {/* Bio — Spruch fürs Profil (max. 200), den andere sehen */}
        <ProfileBio profile={profile} setProfile={setProfile}/>

        {/* Stats-Zeile: 4 Spalten mit Hairline-Trennern.
            Level (tap = geschätztes Level editieren) · Hand · Seite · Stil */}
        <div className="fu" style={{animationDelay:'.26s',display:'flex',
          alignItems:'stretch',marginTop:36}}>
          <button onClick={()=>{if(isEstimated)setEditingLevel(e=>!e);}}
            style={{flex:1,minWidth:0,background:'none',border:'none',
              borderRight:`1px solid ${T.sep}`,padding:'2px 4px',textAlign:'center',
              cursor:isEstimated?'pointer':'default',color:T.t1}}>
            <div style={eyeb}>Level</div>
            <div style={{color:T.o,fontSize:23,fontWeight:900,letterSpacing:-.8,
              lineHeight:1,marginTop:10}}>
              {lvl!=null?lvl.toFixed(2):'—'}
            </div>
            {lvl!=null&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',
                gap:4,marginTop:8}}>
                <span style={{color:T.o,fontSize:9,fontWeight:800,letterSpacing:1,
                  textTransform:'uppercase'}}>{getLevelLabel(lvl)}</span>
                <span style={{color:T.o,fontSize:8,fontWeight:900,letterSpacing:.5,
                  padding:'1.5px 4px',border:`1px solid ${T.o}`,borderRadius:4}}>
                  {getLevelTier(lvl)}
                </span>
              </div>
            )}
          </button>
          <div style={{flex:1,minWidth:0,borderRight:`1px solid ${T.sep}`,
            padding:'2px 4px',textAlign:'center'}}>
            <div style={eyeb}>Hand</div>
            <div style={statVal}>{handLabels[profile.handPreference]||'—'}</div>
            <div style={{marginTop:6,color:T.t2,display:'flex',justifyContent:'center'}}>
              <HandIcon size={17}/>
            </div>
          </div>
          <div style={{flex:1,minWidth:0,borderRight:`1px solid ${T.sep}`,
            padding:'2px 4px',textAlign:'center'}}>
            <div style={eyeb}>Seite</div>
            <div style={statVal}>{sideLabels[profile.courtSide]||'—'}</div>
            <div style={{marginTop:6,color:T.t2,display:'flex',justifyContent:'center'}}>
              <TargetIcon size={17}/>
            </div>
          </div>
          <div style={{flex:1,minWidth:0,padding:'2px 4px',textAlign:'center'}}>
            <div style={eyeb}>2. Stil</div>
            <div style={statVal}>
              {style2?(
                <span style={{padding:'3px 9px',borderRadius:999,fontSize:10,
                  whiteSpace:'nowrap',color:T.t1,
                  background:styleGrad(style2),
                  border:`1px solid ${STYLE_GRAD[style2]}59`}}>
                  {PADEL_STYLES[style2].name}
                </span>
              ):'—'}
            </div>
            <div style={{marginTop:6,opacity:.7,display:'flex',justifyContent:'center'}}>
              <LiveTabIcon size={17}/>
            </div>
          </div>
        </div>

        {/* Inline-Editor fürs geschätzte RITMO-Level (tap auf Level) */}
        {isEstimated&&editingLevel&&lvl!=null&&(
          <div className="fi" style={{maxWidth:300,margin:'20px auto 0',
            display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
              <button onClick={()=>setProfile(p=>({...p,estimatedLevel:Math.max(0.30,Math.round((lvl-0.03)*100)/100)}))}
                style={{width:30,height:30,borderRadius:'50%',background:T.card2,
                  border:`1px solid ${T.border}`,color:T.o,fontSize:15,fontWeight:700,
                  cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>−</button>
              <input key={lvl.toFixed(2)} type="text" inputMode="decimal" defaultValue={lvl.toFixed(2)}
                onBlur={e=>{
                  const v=parseFloat(e.target.value.replace(',','.'));
                  if(!isNaN(v)) setProfile(p=>({...p,estimatedLevel:Math.min(7.0,Math.max(0.3,Math.round(v*100)/100))}));
                  else e.target.value=lvl.toFixed(2);
                }}
                onKeyDown={e=>{if(e.key==='Enter') e.target.blur();}}
                style={{flex:1,minWidth:0,width:0,
                  textAlign:'center',background:T.card2,
                  border:`1px solid ${T.o}`,borderRadius:8,padding:'5px 4px',
                  color:T.o,fontSize:22,fontWeight:900,outline:'none',
                  boxSizing:'border-box'}}/>
              <button onClick={()=>setProfile(p=>({...p,estimatedLevel:Math.min(7.00,Math.round((lvl+0.03)*100)/100)}))}
                style={{width:30,height:30,borderRadius:'50%',background:T.card2,
                  border:`1px solid ${T.border}`,color:T.o,fontSize:15,fontWeight:700,
                  cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
            </div>
            <button onClick={()=>setEditingLevel(false)}
              style={{padding:'8px',background:T.o,border:'none',borderRadius:8,
                color:'#000',fontSize:12,fontWeight:800,cursor:'pointer'}}>Fertig</button>
          </div>
        )}

        {/* Follower / Folgt — Hairline-Sektion, tap öffnet die Listen */}
        <div className="fu" style={{animationDelay:'.32s',display:'flex',marginTop:30,
          borderTop:`1px solid ${T.sep}`,borderBottom:`1px solid ${T.sep}`,padding:'15px 0'}}>
          <button onClick={()=>onOpenFollowers&&onOpenFollowers()}
            style={{flex:1,background:'none',border:'none',cursor:'pointer',
              textAlign:'center',borderRight:`1px solid ${T.sep}`}}>
            <div style={eyeb}>Follower</div>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,marginTop:5}}>
              <span style={{color:T.t1,fontSize:27,fontWeight:900,letterSpacing:-.5}}>{counts.followers}</span>
              <span style={{color:T.t2,display:'inline-flex'}}><PeopleIcon size={16}/></span>
            </div>
          </button>
          <button onClick={()=>onOpenFollowing&&onOpenFollowing()}
            style={{flex:1,background:'none',border:'none',cursor:'pointer',textAlign:'center'}}>
            <div style={eyeb}>Folgt</div>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,marginTop:5}}>
              <span style={{color:T.t1,fontSize:27,fontWeight:900,letterSpacing:-.5}}>{counts.following}</span>
              <span style={{color:T.t2,display:'inline-flex'}}><PeopleIcon size={16}/></span>
            </div>
          </button>
        </div>

        {/* ── STATISTIKEN — aus dem DNA-Screen umgezogen, im
            Editorial-Stil: Hairlines, Eyebrows, große Ziffern. */}
        <div ref={el=>{secRefs.current.stats=el;}} className="fu"
          style={{animationDelay:'.4s',marginTop:34}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:T.o,flexShrink:0}}/>
            <span style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:2.4,
              textTransform:'uppercase'}}>Statistiken</span>
            <span style={{flex:1,height:1,background:T.sep,display:'block'}}/>
          </div>
          {/* Kennzahlen-Zeile mit Hairline-Trennern */}
          <div style={{display:'flex',alignItems:'stretch'}}>
            {[
              {l:'Matches',v:safeStats.matches,suf:'',c:T.t1},
              {l:'Siege',v:safeStats.wins,suf:'',c:T.t1},
              {l:'Niederl.',v:safeStats.losses,suf:'',c:T.t1},
              {l:'Win-Rate',v:safeStats.winRate,suf:'%',c:T.o},
            ].map((s,i)=>(
              <div key={s.l} className="zi" style={{animationDelay:`${.46+i*.07}s`,
                flex:1,minWidth:0,textAlign:'center',padding:'2px 4px',
                borderRight:i<3?`1px solid ${T.sep}`:'none'}}>
                <div style={eyeb}>{s.l}</div>
                <div style={{color:s.c,fontSize:24,fontWeight:900,letterSpacing:-.8,
                  lineHeight:1,marginTop:9}}>
                  <CountUp value={s.v} suffix={s.suf}/>
                </div>
              </div>
            ))}
          </div>
          {safeStats.matches>0?(<>
            {/* Form-Verlauf */}
            <div className="fu" style={{animationDelay:'.58s',marginTop:28}}>
              <div style={{display:'flex',justifyContent:'space-between',
                alignItems:'baseline',marginBottom:10}}>
                <span style={eyeb}>
                  Form-Verlauf · letzte {Math.min(safeStats.formTrend.length,12)} Matches
                </span>
                <span style={{color:T.o,fontSize:12,fontWeight:800,flexShrink:0}}>
                  {(()=>{
                    const f=safeStats.formTrend;
                    if(f.length<3) return '→ Neu';
                    const last=f.slice(-Math.min(4,f.length)).reduce((a,b)=>a+b,0)/Math.min(4,f.length);
                    const all=f.reduce((a,b)=>a+b,0)/f.length;
                    if(last>all+.3) return '↑ Steigend';
                    if(last<all-.3) return '↓ Fallend';
                    return '→ Stabil';
                  })()}
                </span>
              </div>
              <Sparkline data={safeStats.formTrend} color={T.o} height={64}/>
            </div>
            {/* Aktivität */}
            <div className="fu" style={{animationDelay:'.66s',marginTop:26,
              paddingBottom:26,borderBottom:`1px solid ${T.sep}`}}>
              <div style={{...eyeb,marginBottom:12}}>Aktivität · Matches pro Woche</div>
              <BarChart values={safeStats.weeklyMatches} labels={safeStats.weekDays}
                color={T.o} height={86}/>
            </div>
          </>):(
            <div className="fu" style={{animationDelay:'.58s',marginTop:26,paddingBottom:26,
              borderBottom:`1px solid ${T.sep}`,textAlign:'center'}}>
              <div style={{color:T.t2,fontSize:13,fontWeight:700,marginBottom:4}}>
                Noch keine Matches geloggt
              </div>
              <div style={{color:T.t3,fontSize:11.5,lineHeight:1.5}}>
                Spiel ein Single Match oder ein Turnier — die Stats landen automatisch hier.
              </div>
            </div>
          )}
        </div>

        {/* ── MEHR: Profil bearbeiten (Name, Spitzname, Vorlieben,
            Stats-Reset) + Onboarding. Einstellungen + Abmelden wohnen
            im Burger des Home-Headers. */}
        <button ref={el=>{secRefs.current.mehr=el;}} onClick={onOpenEdit}
          className="fu" style={{...rowSty(true),animationDelay:'.70s'}}>
          <span style={{width:26,display:'inline-flex',justifyContent:'center',
            flexShrink:0,color:T.t2}}><EditIcon size={17}/></span>
          <span style={{flex:1,minWidth:0}}><span style={rowLbl}>Profil bearbeiten</span></span>
          <ChevronRightIcon size={15} color={T.t3}/>
        </button>
        <button onClick={onResetOnboarding}
          className="fu" style={{...rowSty(true),animationDelay:'.74s'}}>
          <span style={{width:26,display:'inline-flex',justifyContent:'center',
            flexShrink:0,color:T.t2}}><RefreshGlyph/></span>
          <span style={{flex:1,minWidth:0}}><span style={rowLbl}>Onboarding wiederholen</span></span>
          <ChevronRightIcon size={15} color={T.t3}/>
        </button>
        {/* Statistik zurücksetzen — alle Auswertungen auf 0 (geloggte
            Matches + laufendes Scoreboard). */}
        <button onClick={()=>setConfirmReset(true)}
          className="fu" style={{...rowSty(true),animationDelay:'.78s',
          borderBottom:`1px solid ${T.sep}`}}>
          <span style={{width:26,display:'inline-flex',justifyContent:'center',
            flexShrink:0,color:T.r}}><RefreshGlyph/></span>
          <span style={{flex:1,minWidth:0}}><span style={{...rowLbl,color:T.r}}>Statistik zurücksetzen</span></span>
          <ChevronRightIcon size={15} color={T.t3}/>
        </button>
        {confirmReset&&(
          <div className="fi" style={{marginTop:12,background:'rgba(232,69,69,0.08)',
            border:'1px solid rgba(232,69,69,0.35)',borderRadius:14,padding:'14px 16px'}}>
            <div style={{color:T.t1,fontSize:13,fontWeight:600,lineHeight:1.5,marginBottom:12}}>
              Alle Statistiken auf 0 setzen? Geloggte Matches und das laufende
              Scoreboard werden gelöscht — das lässt sich nicht rückgängig machen.
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setConfirmReset(false)}
                style={{flex:1,padding:'11px',background:'none',border:`1px solid ${T.border}`,
                  borderRadius:11,color:T.t2,fontSize:13,fontWeight:700,cursor:'pointer'}}>Abbrechen</button>
              <button onClick={()=>{onResetStats&&onResetStats();setConfirmReset(false);}}
                style={{flex:1,padding:'11px',background:'#E84545',border:'none',
                  borderRadius:11,color:'#fff',fontSize:13,fontWeight:800,cursor:'pointer'}}>Auf 0 setzen</button>
            </div>
          </div>
        )}

        <div style={{height:120,flexShrink:0}}/>
      </div>

      {/* Scroll-Navigation: rechte Dot-Leiste — Linie füllt sich mit
          dem Scroll-Fortschritt, der aktive Abschnitt leuchtet orange;
          Tap springt smooth zur Sektion. */}
      <div style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',
        display:'flex',flexDirection:'column',alignItems:'center',gap:5,zIndex:3}}>
        <span aria-hidden="true" style={{width:1.5,height:42,background:T.t4,borderRadius:1,
          position:'relative',overflow:'hidden',display:'block',marginBottom:3}}>
          <span style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',
            background:T.o,transform:`scaleY(${scrollProg})`,transformOrigin:'top',
            transition:'transform .12s linear',display:'block'}}/>
        </span>
        {SECTIONS.map((k,i)=>(
          <button key={k} aria-label={`Zu Abschnitt ${i+1}`}
            onClick={()=>{secRefs.current[k]?.scrollIntoView({behavior:'smooth',block:'start'});}}
            style={{width:16,height:16,padding:0,background:'none',border:'none',
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <span style={{width:i===navSec?6.5:4,height:i===navSec?6.5:4,
              borderRadius:'50%',background:i===navSec?T.o:T.t4,
              boxShadow:i===navSec?`0 0 9px ${tint(60)}`:'none',
              transition:'all .3s var(--ease-out-expo)',display:'block'}}/>
          </button>
        ))}
      </div>

      <BottomFade/>
      {/* Profil ist jetzt ein Haupt-Tab → Navbar statt Home-FAB.
          Fallback MatchBar, falls (alte Aufrufer) kein onTab geben. */}
      {onTab?<TabBar active="profil" onTab={onTab}/>:<MatchBar onHome={onHome}/>}
    </div>
  );
}

/* ─── Profil-Bio — Spruch (max. 200 Zeichen) mit Inline-Editor.
   Wird auf dem eigenen Profil mit Edit-Stift gezeigt; andere Spieler
   sehen ihn read-only im PublicProfile. ─────────────────────────── */
function ProfileBio({profile,setProfile}){
  const[editing,setEditing]=useState(false);
  const[val,setVal]=useState(profile.bio||'');
  const bio=(profile.bio||'').trim();
  const save=()=>{ setProfile(p=>({...p,bio:val.trim().slice(0,200)})); setEditing(false); };
  if(editing){
    return(
      <div className="fi" style={{marginTop:22,width:'100%',maxWidth:520,
        marginLeft:'auto',marginRight:'auto'}}>
        <textarea value={val} onChange={e=>setVal(e.target.value.slice(0,200))}
          maxLength={200} rows={3} autoFocus
          placeholder="Dein Spruch fürs Profil … (max. 200 Zeichen)"
          style={{width:'100%',background:T.card2,border:`1px solid ${T.o}`,borderRadius:14,
            padding:'14px 16px',color:T.t1,fontSize:16,lineHeight:1.5,fontWeight:500,
            outline:'none',boxSizing:'border-box',resize:'none',fontFamily:'inherit'}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
          <span style={{color:val.length>=200?T.r:T.t3,fontSize:11,fontWeight:700,
            fontVariantNumeric:'tabular-nums'}}>{val.length}/200</span>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>{setVal(profile.bio||'');setEditing(false);}}
              style={{padding:'7px 14px',background:'none',border:`1px solid ${T.border}`,
                borderRadius:10,color:T.t2,fontSize:12,fontWeight:700,cursor:'pointer'}}>Abbrechen</button>
            <button onClick={save}
              style={{padding:'7px 16px',background:T.o,border:'none',borderRadius:10,
                color:'#000',fontSize:12,fontWeight:800,cursor:'pointer'}}>Speichern</button>
          </div>
        </div>
      </div>
    );
  }
  return(
    <button onClick={()=>{setVal(profile.bio||'');setEditing(true);}} className="fu"
      style={{animationDelay:'.24s',marginTop:22,width:'100%',background:'none',
        border:'none',cursor:'pointer',display:'flex',alignItems:'center',
        justifyContent:'center',gap:9,padding:0}}>
      <span style={{color:bio?T.t2:T.t3,fontSize:16,fontWeight:bio?600:500,
        fontStyle:bio?'italic':'normal',lineHeight:1.5,maxWidth:430,textAlign:'center'}}>
        {bio?`„${bio}"`:'Bio hinzufügen — dein Spruch fürs Profil'}
      </span>
      <span style={{color:T.o,display:'inline-flex',flexShrink:0}}><EditIcon size={15}/></span>
    </button>
  );
}

/* ─── Profil bearbeiten — Name, Spitzname, Vorlieben + Stats-Reset.
   Macht die letzten Onboarding-Schritte überflüssig. Eigene Chrome
   (Person-FAB → zurück ins Profil), FABs auf Navbar-Höhe. ────────── */
function ProfileEdit({profile,setProfile,onBack,onHome,onResetStats}){
  const set=(patch)=>setProfile(p=>({...p,...patch}));
  const[confirmReset,setConfirmReset]=useState(false);
  const HANDS=[{id:'right',label:'Rechts'},{id:'left',label:'Links'}];
  const SIDES=[{id:'left',label:'Ad-Seite'},{id:'right',label:'Deuce-Seite'},{id:'any',label:'Beides'}];
  const seg=(opts,val,onPick)=>(
    <div style={{display:'flex',gap:8}}>
      {opts.map(o=>{
        const active=val===o.id;
        return(
          <button key={o.id} onClick={()=>onPick(o.id)}
            style={{flex:1,padding:'11px 6px',borderRadius:12,
              background:active?T.o:'transparent',color:active?'#000':T.t2,
              border:`1px solid ${active?T.o:T.border}`,fontSize:13,
              fontWeight:active?800:600,letterSpacing:.2,cursor:'pointer',
              transition:'all .18s'}}>{o.label}</button>
        );
      })}
    </div>
  );
  const lblSty={color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
    textTransform:'uppercase',marginBottom:7,paddingLeft:2};
  const inputSty={width:'100%',background:T.card2,border:`1px solid ${T.border}`,
    borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
    outline:'none',boxSizing:'border-box'};
  const fabBase={position:'absolute',
    bottom:'calc(env(safe-area-inset-bottom, 0px) * 0.3 - 1.5px)',
    width:54,height:54,borderRadius:'50%',color:T.t1,cursor:'pointer',
    display:'flex',alignItems:'center',justifyContent:'center',zIndex:5};
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',
      position:'relative',overflow:'hidden'}}>
      <div style={{padding:'0 22px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <div style={{flexShrink:0,color:T.o,width:36,height:36,background:T.card2,
            border:`1px solid ${T.border}`,borderRadius:13,display:'flex',
            alignItems:'center',justifyContent:'center'}}><EditIcon size={18}/></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.5,
              textTransform:'uppercase'}}>Profil</div>
            <div style={{color:T.t1,fontSize:24,fontWeight:800,letterSpacing:-.3,marginTop:2}}>
              Bearbeiten
            </div>
          </div>
        </div>
        <div style={{color:T.t3,fontSize:13,lineHeight:1.5,marginTop:8}}>
          Name, Spitzname und Vorlieben — jederzeit änderbar.
        </div>
      </div>

      <div style={{flex:1,padding:'0 22px 140px',overflowY:'auto',
        WebkitOverflowScrolling:'touch',display:'flex',flexDirection:'column',gap:22}}>
        <div>
          <div style={lblSty}>Name</div>
          <input value={profile.name||''} onChange={e=>set({name:e.target.value})}
            placeholder="Dein Name" autoCapitalize="words" style={inputSty}/>
        </div>
        <div>
          <div style={lblSty}>Spitzname · wird in der App angezeigt</div>
          <input value={profile.nickname||''} onChange={e=>set({nickname:e.target.value})}
            placeholder="z. B. Felix" autoCapitalize="words" style={inputSty}/>
        </div>
        <div>
          <div style={lblSty}>Bevorzugte Hand</div>
          {seg(HANDS,profile.handPreference,v=>set({handPreference:v}))}
        </div>
        <div>
          <div style={lblSty}>Bevorzugte Seite</div>
          {seg(SIDES,profile.courtSide,v=>set({courtSide:v}))}
        </div>

        <div style={{marginTop:6,paddingTop:18,borderTop:`1px solid ${T.sep}`}}>
          <div style={lblSty}>Zurücksetzen</div>
          {!confirmReset?(
            <button onClick={()=>setConfirmReset(true)}
              style={{width:'100%',background:'rgba(232,69,69,0.08)',
                border:'1px solid rgba(232,69,69,0.35)',borderRadius:13,
                padding:'14px 16px',color:'#FF6B6B',fontSize:16,fontWeight:700,
                letterSpacing:.2,cursor:'pointer',textAlign:'left',
                display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span>Spiele & Statistik zurücksetzen</span>
              <RefreshGlyph/>
            </button>
          ):(
            <div className="fi" style={{background:'rgba(232,69,69,0.08)',
              border:'1px solid rgba(232,69,69,0.35)',borderRadius:13,padding:'14px 16px'}}>
              <div style={{color:T.t1,fontSize:13,fontWeight:600,lineHeight:1.5,marginBottom:12}}>
                Alle geloggten Matches und das laufende Scoreboard werden gelöscht.
                Das kann nicht rückgängig gemacht werden.
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setConfirmReset(false)}
                  style={{flex:1,padding:'11px',background:'none',border:`1px solid ${T.border}`,
                    borderRadius:11,color:T.t2,fontSize:13,fontWeight:700,cursor:'pointer'}}>Abbrechen</button>
                <button onClick={()=>{onResetStats&&onResetStats();setConfirmReset(false);}}
                  style={{flex:1,padding:'11px',background:'#E84545',border:'none',
                    borderRadius:11,color:'#fff',fontSize:13,fontWeight:800,cursor:'pointer'}}>Zurücksetzen</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomFade/>
      {onHome&&(
        <button onClick={onHome} aria-label="Zurück zur Startseite"
          className="glass-bar" style={{...fabBase,left:22}}>
          <HomeIcon size={22}/>
        </button>
      )}
      <button onClick={onBack} aria-label="Zurück zum Profil"
        className="glass-bar" style={{...fabBase,right:22}}>
        <PersonGlyph size={22}/>
      </button>
    </div>
  );
}

/* Event-Tage — Schlüssel 'Monat-Tag' (1-basiert), orange markiert in
   der Home-Datums-Leiste (die immer am heutigen Tag startet). */
const HOME_EVENTS={'7-18':'RITMO X Padel Haus'};

/* Match-Vorschläge für „Matches für dich" (Feature-Preview) —
   bis zu 5, horizontal swipebar, eine Karte pro Match. */
const MATCH_SLOTS=[
  {loc:'Padel Haus Großmehring',date:'29. Juni',time:'18:00–19:30',players:['Chris','Daniel','Michael']},
  {loc:'Padel Haus Großmehring',date:'4. Juli', time:'18:00–19:30',players:['Nadin','Alessa.','Nora']},
  {loc:'Padel Haus Großmehring',date:'6. Juli', time:'19:30–21:00',players:['Jonas','Mia']},
  {loc:'Padel Haus Großmehring',date:'9. Juli', time:'17:00–18:30',players:['Tom']},
  {loc:'Padel Haus Großmehring',date:'12. Juli',time:'10:00–11:30',players:[]},
];

/* Padel-Clubs in der Nähe — Pins auf der RITMO-Map in den Match-
   Präferenzen (x/y in % der Kartenfläche; Mock-Distanzen). */
const NEARBY_CLUBS=[
  {id:'phg',name:'Padel Haus Großmehring', dist:'2,1 km',x:58,y:34},
  {id:'pai',name:'Padel Arena Ingolstadt', dist:'8,4 km',x:26,y:58},
  {id:'mpc',name:'Munich Padel Club',      dist:'58 km', x:79,y:74},
];


/* ── „Discover the RITMO" — horizontale Card-Galerie (Apple-Health-
   Look): Bauhaus-Grafik-Cards mit starkem Radius, Scroll-Snap, Titel
   auf dunklem Verlauf. id = nav()-Ziel. */
const DISCOVER_CARDS=[
  {id:'events',        eyebrow:'Community', title:'Events',            tint:'#0A84FF'},
  {id:'booking-assist',eyebrow:'Courts',    title:'Buchungsassistent', tint:'#30D158'},
  {id:'rules',         eyebrow:'Regelwerk', title:'Neue Regularien',   tint:'#BF5AF2'},
  {id:'weltrangliste', eyebrow:'Ranking',   title:'Weltrangliste',     tint:'#FFD60A'},
];
/* Bauhaus-Grafiken für die Discover-Karten — gleiche Formsprache wie
   die RITMO Mail-Templates: tiefes Schwarz, Colour-Bar oben, Speed-
   Lines, geometrische Kompositionen in Tint + Creme + Brand-Orange. */
function DiscoverArt({id,tint}){
  const cream='#F5EDDC';
  return(
    <svg viewBox="0 0 190 248" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
      style={{position:'absolute',inset:0,width:'100%',height:'100%',display:'block'}}>
      <rect width="190" height="248" fill="#0C0C10"/>
      {/* Bauhaus Colour-Bar (Mail-Template-Signatur) */}
      <rect x="0" y="0" width="58" height="7" fill="var(--o)"/>
      <rect x="58" y="0" width="52" height="7" fill={tint}/>
      <rect x="110" y="0" width="44" height="7" fill={cream}/>
      <rect x="154" y="0" width="36" height="7" fill={tint} opacity=".45"/>
      {/* RITMO Speed-Lines */}
      <rect x="14" y="24" width="26" height="3.5" rx="1.75" fill="var(--o)"/>
      <rect x="14" y="32" width="17" height="3.5" rx="1.75" fill="var(--o)" opacity=".55"/>
      <rect x="14" y="40" width="10" height="3.5" rx="1.75" fill="var(--o)" opacity=".3"/>
      {id==='events'&&(<>
        {/* Pokal aus Dreieck + Sockel, Tint-Sonne, Konfetti */}
        <circle cx="152" cy="58" r="44" fill={tint} opacity=".92"/>
        <polygon points="55,176 95,84 135,176" fill={cream}/>
        <rect x="83" y="176" width="24" height="9" fill={cream}/>
        <rect x="71" y="185" width="48" height="7" fill="var(--o)"/>
        <circle cx="44" cy="92" r="5" fill="var(--o)"/>
        <circle cx="156" cy="140" r="4" fill={cream} opacity=".8"/>
        <line x1="26" y1="208" x2="84" y2="150" stroke={tint} strokeWidth="3"/>
        <line x1="40" y1="218" x2="92" y2="166" stroke={tint} strokeWidth="3" opacity=".5"/>
      </>)}
      {id==='booking-assist'&&(<>
        {/* Court von oben + Ball mit Flugkurve */}
        <rect x="34" y="62" width="122" height="124" fill="none" stroke={cream} strokeWidth="3"/>
        <line x1="34" y1="124" x2="156" y2="124" stroke={cream} strokeWidth="2"/>
        <line x1="95" y1="62" x2="95" y2="124" stroke={cream} strokeWidth="2" opacity=".7"/>
        <circle cx="138" cy="96" r="9" fill="var(--o)"/>
        <path d="M52 180 Q95 138 138 105" fill="none" stroke="var(--o)" strokeWidth="2.5"
          strokeDasharray="2 7" strokeLinecap="round"/>
        <circle cx="-6" cy="240" r="52" fill={tint} opacity=".85"/>
        <circle cx="160" cy="206" r="14" fill="none" stroke={tint} strokeWidth="3"/>
      </>)}
      {id==='rules'&&(<>
        {/* Paragraphen-Zeilen + Viertelkreis */}
        <circle cx="190" cy="64" r="58" fill={tint} opacity=".9"/>
        <rect x="26" y="92" width="96" height="11" rx="2" fill={cream}/>
        <rect x="26" y="114" width="124" height="11" rx="2" fill={cream} opacity=".85"/>
        <rect x="26" y="136" width="78" height="11" rx="2" fill={cream} opacity=".65"/>
        <rect x="26" y="158" width="106" height="11" rx="2" fill={cream} opacity=".45"/>
        <circle cx="46" cy="200" r="9" fill="var(--o)"/>
        <line x1="68" y1="200" x2="150" y2="200" stroke={tint} strokeWidth="4" strokeLinecap="round"/>
      </>)}
      {id==='weltrangliste'&&(<>
        {/* Podium + Ball-Sonne */}
        <circle cx="95" cy="74" r="22" fill="var(--o)"/>
        <rect x="34" y="142" width="34" height="48" fill={cream} opacity=".8"/>
        <rect x="78" y="112" width="34" height="78" fill={tint}/>
        <rect x="122" y="158" width="34" height="32" fill={cream} opacity=".55"/>
        <line x1="24" y1="190" x2="166" y2="190" stroke={cream} strokeWidth="3"/>
        <circle cx="150" cy="74" r="4" fill={cream}/>
        <circle cx="38" cy="96" r="3" fill={tint}/>
      </>)}
    </svg>
  );
}
function DiscoverSection({nav}){
  return(
    <div className="fu" style={{animationDelay:'.14s'}}>
      <div style={{color:T.t1,fontSize:20,fontWeight:800,letterSpacing:-.4,
        margin:'22px 0 2px'}}>
        Discover the RITMO
      </div>
      {/* Galerie blutet bis an die Screen-Kante (negiert das Corpus-
          Padding), Cards snappen am linken Rand. */}
      <div className="hscroll" style={{display:'flex',gap:12,overflowX:'auto',
        margin:'0 -22px',padding:'10px 22px 6px',
        scrollSnapType:'x mandatory',scrollPaddingLeft:22,
        WebkitOverflowScrolling:'touch'}}>
        {DISCOVER_CARDS.map(c=>(
          <button key={c.id} onClick={()=>nav(c.id)} aria-label={c.title}
            style={{position:'relative',flexShrink:0,width:190,height:248,
              borderRadius:30,overflow:'hidden',border:`1px solid ${T.border}`,
              scrollSnapAlign:'start',cursor:'pointer',padding:0,
              background:T.card,textAlign:'left',
              boxShadow:'0 10px 26px rgba(0,0,0,.32)'}}>
            <DiscoverArt id={c.id} tint={c.tint}/>
            {/* Lesbarkeits-Verlauf für die Labels */}
            <div aria-hidden="true" style={{position:'absolute',inset:0,
              background:'linear-gradient(180deg, rgba(0,0,0,0) 56%, rgba(0,0,0,.72) 100%)'}}/>
            <div style={{position:'absolute',left:16,right:14,bottom:15}}>
              <div style={{color:c.tint,fontSize:10,fontWeight:800,
                letterSpacing:1.2,textTransform:'uppercase',marginBottom:4,
                textShadow:'0 1px 6px rgba(0,0,0,.6)'}}>
                {c.eyebrow}
              </div>
              <div style={{color:'#FFF',fontSize:17,fontWeight:800,
                letterSpacing:-.3,lineHeight:1.18,
                textShadow:'0 1px 8px rgba(0,0,0,.55)'}}>
                {c.title}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Match-Präferenzen — neuer Screen hinter dem Herz in „Matches
   für dich": Mit welchen Spielstilen man spielen will (horizontale
   Karten, Mehrfachauswahl), Spielort sowie Tage + Uhrzeit. Persistiert
   in profile.matchPrefs (läuft den normalen Profil-Sync mit). */
function MatchPrefs({profile,setProfile,currentUid,onHome}){
  const DEFAULTS={styles:[],players:[],location:'',days:[],from:'18:00',to:'20:00'};
  // Bevorzugte Spieler: ausschliesslich die Nutzer, denen man folgt.
  const[following,setFollowing]=useState([]);
  useEffect(()=>{
    if(!currentUid) return;
    let alive=true;
    listFollowing(currentUid,{limit:50})
      .then(r=>{if(alive)setFollowing(r||[]);})
      .catch(()=>{});
    return()=>{alive=false;};
  },[currentUid]);
  const playerChoices=following.map(f=>{
    const p=f.profile||{};
    return p.display_name||p.data?.name||p.data?.nickname||'Spieler:in';
  });
  const prefs={...DEFAULTS,...(profile.matchPrefs||{})};
  // Patches IMMER aus dem aktuellen State ableiten (nicht aus dem
  // Render-Closure) — sonst überschreiben sich schnelle Taps in einem
  // React-Batch gegenseitig.
  const setPrefs=patch=>setProfile(p=>({...p,
    matchPrefs:{...DEFAULTS,...(p.matchPrefs||{}),...patch}}));
  const toggleIn=(key,val)=>setProfile(p=>{
    const cur={...DEFAULTS,...(p.matchPrefs||{})};
    const next=cur[key].includes(val)
      ?cur[key].filter(x=>x!==val):[...cur[key],val];
    return {...p,matchPrefs:{...cur,[key]:next}};
  });
  const toggleStyle=id=>toggleIn('styles',id);
  const togglePlayer=n=>toggleIn('players',n);
  const toggleDay=d=>toggleIn('days',d);
  const DAYS=['Mo','Di','Mi','Do','Fr','Sa','So'];
  const lbl={color:T.o,fontSize:18,fontWeight:800,marginBottom:4};
  const sub={color:T.t3,fontSize:11,fontWeight:500,lineHeight:1.5,marginBottom:12};
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>
      <ScreenHeader title="Matches für dich"
        subtitle="Sag uns, wie du spielen willst — wir schlagen passende Matches vor."
        icon={<span style={{color:T.t1,display:'inline-flex'}}><HeartIcon size={30} filled/></span>}/>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,
        overflowY:'auto',WebkitOverflowScrolling:'touch'}}>

        {/* Spielstile — horizontale Karten, Mehrfachauswahl */}
        <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
          borderRadius:19,padding:'16px 18px'}}>
          <div style={lbl}>Mit wem willst du spielen?</div>
          <div style={sub}>Spielstile, die dir liegen — Mehrfachauswahl.</div>
          <div className="hscroll" style={{display:'flex',gap:10,overflowX:'auto',
            margin:'0 -18px',padding:'4px 18px 6px',
            scrollSnapType:'x mandatory',scrollPaddingLeft:18,
            WebkitOverflowScrolling:'touch'}}>
            {Object.entries(PADEL_STYLES).map(([id,s])=>{
              const sel=prefs.styles.includes(id);
              return(
                <button key={id} onClick={()=>toggleStyle(id)}
                  aria-pressed={sel}
                  style={{flexShrink:0,width:124,borderRadius:18,padding:'14px 10px 12px',
                    scrollSnapAlign:'start',cursor:'pointer',textAlign:'center',
                    background:sel?styleGrad(id):T.card2,
                    border:`1.5px solid ${sel?(STYLE_GRAD[id]||T.o):T.border}`,
                    color:T.t1,transition:'all .2s var(--ease-out-expo)'}}>
                  <div style={{display:'flex',justifyContent:'center',marginBottom:8}}>
                    <ArchetypeGlyph type={id} active={sel} color={s.accent} size={30}/>
                  </div>
                  <div style={{fontSize:12.5,fontWeight:800,letterSpacing:-.2,
                    whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                  <div style={{color:T.t3,fontSize:9,fontWeight:700,marginTop:2,
                    textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap',
                    overflow:'hidden',textOverflow:'ellipsis'}}>{s.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bevorzugte Spieler */}
        <div className="fu" style={{animationDelay:'.04s',background:T.card,
          border:`1px solid ${T.border}`,borderRadius:19,padding:'16px 18px'}}>
          <div style={lbl}>Bevorzugte Spieler</div>
          <div style={sub}>Mit wem willst du am liebsten auf dem Court stehen?</div>
          {playerChoices.length===0?(
            <div style={{color:T.t3,fontSize:12,fontWeight:500,lineHeight:1.5,
              padding:'6px 0 2px'}}>
              Du folgst noch niemandem. Folge Spielern (Suche → Spieler),
              dann erscheinen sie hier zur Auswahl.
            </div>
          ):(
          <div className="hscroll" style={{display:'flex',gap:10,overflowX:'auto',
            margin:'0 -18px',padding:'4px 18px 6px',
            scrollSnapType:'x mandatory',scrollPaddingLeft:18,
            WebkitOverflowScrolling:'touch'}}>
            {playerChoices.map(n=>{
              const sel=prefs.players.includes(n);
              return(
                <button key={n} onClick={()=>togglePlayer(n)} aria-pressed={sel}
                  style={{flexShrink:0,width:74,borderRadius:16,padding:'10px 6px 9px',
                    scrollSnapAlign:'start',cursor:'pointer',textAlign:'center',
                    background:sel?T.oSoft:T.card2,
                    border:`1.5px solid ${sel?T.o:T.border}`,
                    color:T.t1,transition:'all .2s var(--ease-out-expo)'}}>
                  <span style={{width:40,height:40,borderRadius:'50%',margin:'0 auto 6px',
                    background:sel?T.o:T.card,display:'flex',alignItems:'center',
                    justifyContent:'center',color:sel?'#000':T.o,fontSize:16,
                    fontWeight:800,border:`1.5px solid ${sel?T.o:T.border}`,
                    transition:'all .2s var(--ease-out-expo)'}}>
                    {getInitials(n)||'?'}
                  </span>
                  <span style={{display:'block',fontSize:10,fontWeight:700,
                    whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{n}</span>
                </button>
              );
            })}
          </div>
          )}
        </div>

        {/* Spielort — RITMO-Map mit Clubs in der Nähe */}
        <div className="fu" style={{animationDelay:'.08s',background:T.card,
          border:`1px solid ${T.border}`,borderRadius:19,padding:'16px 18px'}}>
          <div style={lbl}>Spielort</div>
          <div style={sub}>Padel-Clubs in deiner Nähe — tippe einen Pin oder Club an.</div>
          {/* Bauhaus-Karte: Straßenraster, Blöcke, Du-Punkt, Club-Pins */}
          <div style={{position:'relative',borderRadius:16,overflow:'hidden',
            border:`1px solid ${T.border}`,height:172,marginBottom:12,
            background:'#0C0C10'}}>
            <svg viewBox="0 0 340 172" preserveAspectRatio="xMidYMid slice"
              style={{position:'absolute',inset:0,width:'100%',height:'100%'}}
              aria-hidden="true">
              <path d="M0 118 C70 104 120 132 200 112 S320 96 340 104"
                stroke="rgba(255,255,255,.14)" strokeWidth="7" fill="none"/>
              <path d="M0 60 C90 72 150 48 230 64 S320 78 340 70"
                stroke="rgba(255,255,255,.1)" strokeWidth="5" fill="none"/>
              <path d="M96 0 C88 60 110 110 92 172"
                stroke="rgba(255,255,255,.1)" strokeWidth="5" fill="none"/>
              <path d="M236 0 C246 50 224 120 240 172"
                stroke="rgba(255,255,255,.08)" strokeWidth="4" fill="none"/>
              <rect x="18" y="14" width="44" height="26" rx="4" fill="rgba(255,255,255,.05)"/>
              <rect x="262" y="120" width="52" height="30" rx="4" fill="rgba(255,255,255,.05)"/>
              <rect x="150" y="22" width="36" height="22" rx="4" fill="rgba(255,255,255,.04)"/>
              <rect x="40" y="128" width="34" height="22" rx="4" fill="rgba(255,255,255,.04)"/>
              <rect x="12" y="150" width="22" height="3" rx="1.5" fill="var(--o)"/>
              <rect x="12" y="157" width="14" height="3" rx="1.5" fill="var(--o)" opacity=".55"/>
            </svg>
            <span aria-label="Dein Standort" style={{position:'absolute',left:'46%',top:'52%',
              width:11,height:11,borderRadius:'50%',background:'#0A84FF',
              border:'2px solid #FFF',boxShadow:'0 0 0 5px rgba(10,132,255,.25)',
              transform:'translate(-50%,-50%)',display:'block'}}/>
            {NEARBY_CLUBS.map(c=>{
              const sel=prefs.location===c.name;
              return(
                <button key={c.id} onClick={()=>setPrefs({location:c.name})}
                  aria-label={`${c.name} auswählen`} aria-pressed={sel}
                  style={{position:'absolute',left:`${c.x}%`,top:`${c.y}%`,
                    transform:'translate(-50%,-90%)',background:'none',border:'none',
                    padding:4,cursor:'pointer',
                    filter:sel?'drop-shadow(0 0 7px rgba(255,122,26,.85))':'drop-shadow(0 2px 4px rgba(0,0,0,.5))'}}>
                  <svg width={sel?30:24} height={sel?30:24} viewBox="0 0 24 24"
                    fill={sel?T.o:'#0C0C10'} stroke={sel?'#FFF':T.o} strokeWidth="2"
                    strokeLinejoin="round" style={{transition:'all .2s var(--ease-out-back)',display:'block'}}>
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/>
                    <circle cx="12" cy="10" r="3" fill={sel?'#FFF':T.o} stroke="none"/>
                  </svg>
                </button>
              );
            })}
          </div>
          {/* Club-Liste zur Auswahl */}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {NEARBY_CLUBS.map(c=>{
              const sel=prefs.location===c.name;
              return(
                <button key={c.id} onClick={()=>setPrefs({location:c.name})} aria-pressed={sel}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'11px 13px',
                    borderRadius:13,cursor:'pointer',textAlign:'left',width:'100%',
                    background:sel?T.oSoft:T.card2,
                    border:`1.5px solid ${sel?T.o:T.border}`,
                    transition:'all .2s var(--ease-out-expo)'}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={sel?T.o:T.t3} strokeWidth="2.2" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true" style={{flexShrink:0}}>
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span style={{flex:1,minWidth:0,color:T.t1,fontSize:13,fontWeight:700,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</span>
                  <span style={{color:T.t3,fontSize:11,fontWeight:700,flexShrink:0}}>{c.dist}</span>
                  {sel&&(
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke={T.o} strokeWidth="3" strokeLinecap="round"
                      strokeLinejoin="round" aria-hidden="true" style={{flexShrink:0}}>
                      <path d="M4.5 12.5 10 18 19.5 6.5"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tag & Uhrzeit */}
        <div className="fu" style={{animationDelay:'.12s',background:T.card,
          border:`1px solid ${T.border}`,borderRadius:19,padding:'16px 18px'}}>
          <div style={lbl}>Tag &amp; Uhrzeit</div>
          <div style={sub}>An welchen Tagen und in welchem Zeitfenster passt es dir?</div>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:14}}>
            {DAYS.map(d=>{
              const sel=prefs.days.includes(d);
              return(
                <button key={d} onClick={()=>toggleDay(d)} aria-pressed={sel}
                  style={{width:40,height:40,borderRadius:13,cursor:'pointer',
                    background:sel?T.o:T.card2,
                    border:`1.5px solid ${sel?T.o:T.border}`,
                    color:sel?'#000':T.t2,fontSize:12.5,fontWeight:800,
                    transition:'all .2s var(--ease-out-expo)'}}>
                  {d}
                </button>
              );
            })}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <input type="time" value={prefs.from}
              onChange={e=>setPrefs({from:e.target.value})}
              style={{flex:1,minWidth:0,height:44,borderRadius:13,background:T.card2,
                border:`1px solid ${T.border}`,color:T.t1,fontSize:15,fontWeight:700,
                padding:'0 10px',outline:'none',boxSizing:'border-box',
                textAlign:'center'}}/>
            <span style={{color:T.t3,fontSize:16,fontWeight:700,flexShrink:0}}>–</span>
            <input type="time" value={prefs.to}
              onChange={e=>setPrefs({to:e.target.value})}
              style={{flex:1,minWidth:0,height:44,borderRadius:13,background:T.card2,
                border:`1px solid ${T.border}`,color:T.t1,fontSize:15,fontWeight:700,
                padding:'0 10px',outline:'none',boxSizing:'border-box',
                textAlign:'center'}}/>
          </div>
        </div>

        <div style={{height:110,flexShrink:0}}/>
      </div>

      <BottomFade/>
      <MatchBar onHome={onHome}/>
    </div>
  );
}

/* Liquid-Glass-Props fuer die Home-Karten — gleiches Material wie die
   Navbar, als absoluter Hintergrund-Layer hinter dem Karten-Inhalt.
   Chromium → echte SVG-Refraktion, Safari/iOS → Blur-Fallback. */
const HOME_CARD_GLASS={
  width:'100%',height:'100%',borderRadius:22,
  brightness:58,opacity:0.9,blur:10,displace:0.5,distortionScale:-120,
  redOffset:0,greenOffset:8,blueOffset:16,backgroundOpacity:0.06,
  style:{position:'absolute',inset:0,pointerEvents:'none'},
};

function Home({nav,activeTab,setActiveTab,profile,onboarded,unread}){
  // Hinweis-Banner falls Onboarding nicht abgeschlossen ist UND der
  // User nicht den Test-Bypass benutzt (Test-User hat onboarded=true).
  const needsOnboarding=!onboarded;
  const hasUnread=(unread||0)>0;

  // Events-Leiste: startet IMMER am heutigen Tag, läuft bis Monatsende.
  // Event-Tage kommen aus HOME_EVENTS ('Monat-Tag', 1-basiert).
  const today=new Date();
  const MONTH_NAMES=['Januar','Februar','März','April','Mai','Juni','Juli',
    'August','September','Oktober','November','Dezember'];
  const monthName=MONTH_NAMES[today.getMonth()];
  const lastDay=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
  const eventDays=Array.from({length:lastDay-today.getDate()+1},(_,i)=>today.getDate()+i);
  const eventFor=d=>HOME_EVENTS[`${today.getMonth()+1}-${d}`];

  // Pull-to-Stretch: Ist der Corpus ganz oben gescrollt und zieht der
  // Finger weiter nach unten, wächst der Header-Gradient elastisch mit;
  // Loslassen federt zurück (Spring-Transition nur beim Snap-Back).
  const corpusRef=useRef(null);
  const pullRef=useRef({startY:0,pulling:false});
  const[stretch,setStretch]=useState(0);
  const[snapBack,setSnapBack]=useState(false);
  const pullStart=e=>{
    if((corpusRef.current?.scrollTop||0)<=0){
      pullRef.current={startY:e.clientY,pulling:true};
      setSnapBack(false);
    }
  };
  const pullMove=e=>{
    if(!pullRef.current.pulling) return;
    if((corpusRef.current?.scrollTop||0)>0){pullRef.current.pulling=false;setStretch(0);return;}
    const dy=e.clientY-pullRef.current.startY;
    setStretch(dy>0?Math.min(96,dy*0.45):0);
  };
  const pullEnd=()=>{
    if(!pullRef.current.pulling) return;
    pullRef.current.pulling=false;
    setSnapBack(true);
    setStretch(0);
  };

  // Collapse-Fortschritt (Health-App-Style): 0 = ganz oben, 1 = ein-
  // geklappt. Treibt Logo-Schwenk, Glas-Bar und das Ausblenden von
  // Begrüßung + Streifen.
  const[scrollY,setScrollY]=useState(0);
  const onHomeScroll=()=>setScrollY(corpusRef.current?.scrollTop||0);
  const tCol=Math.min(1,Math.max(0,scrollY/90));
  const barGlass=Math.min(1,Math.max(0,(scrollY-8)/56));
  // Home-Tab erneut antippen → smooth zurück nach oben.
  const onTabLocal=id=>{
    if(id==='home') corpusRef.current?.scrollTo({top:0,behavior:'smooth'});
    setActiveTab(id);
  };
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden'}}>

      {/* 1) Gradient-Backdrop — liegt HINTER dem Content; der Content
          scrollt darüber hinweg (Health-App-Look). Höhe wächst beim
          Pull-to-Stretch elastisch. Tap → RITMO DNA. */}
      <div aria-hidden="true" onClick={()=>nav('profile-ritmodna')}
        style={{position:'absolute',top:0,left:0,right:0,
          height:`calc(env(safe-area-inset-top,0px) + ${238+stretch}px)`,
          transition:snapBack?'height .5s var(--ease-out-back)':'none',
          background:'var(--homeHeaderGrad)',cursor:'pointer'}}/>

      {/* 2) Scroller — voll-hoch; Inhalte ziehen beim Hochscrollen
          über den Gradient. Pointer-Handler treiben Pull-to-Stretch. */}
      <div ref={corpusRef} onScroll={onHomeScroll}
        onPointerDown={pullStart} onPointerMove={pullMove}
        onPointerUp={pullEnd} onPointerCancel={pullEnd} onPointerLeave={pullEnd}
        style={{position:'absolute',inset:0,zIndex:2,
          overflowY:'auto',WebkitOverflowScrolling:'touch',
          overscrollBehavior:'contain'}}>

        {/* Scroll-Header: Streifen + Name am Ende des oberen Strichs —
            die Begrüßung blendet beim Hochscrollen aus. */}
        <div onClick={()=>nav('profile-ritmodna')}
          style={{padding:'calc(env(safe-area-inset-top,0px) + 150px) 19px 0',
            height:'calc(env(safe-area-inset-top,0px) + 218px)',
            boxSizing:'border-box',cursor:'pointer',
            opacity:1-tCol,pointerEvents:tCol>.6?'none':'auto'}}>
          <div style={{display:'flex',flexDirection:'column',gap:6,
            transform:'scale(.9)',transformOrigin:'left top'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span className="stripe-in" aria-hidden="true" style={{width:84,height:7,
                borderRadius:4,background:'#FFFFFF','--so':1,
                animationDelay:'.12s',display:'block'}}/>
              <span style={{color:'#FFF',fontSize:18,fontWeight:700,letterSpacing:-.3,
                whiteSpace:'nowrap',lineHeight:1}}>
                Hi, {displayName(profile).split(' ')[0]}!
              </span>
            </div>
            <span className="stripe-in" aria-hidden="true" style={{width:52,height:7,
              borderRadius:4,background:'#FFFFFF','--so':.7,
              animationDelay:'.22s',display:'block'}}/>
            <span className="stripe-in" aria-hidden="true" style={{width:30,height:7,
              borderRadius:4,background:'#FFFFFF','--so':.45,
              animationDelay:'.32s',display:'block'}}/>
          </div>
          {document.documentElement.getAttribute('data-theme')==='funky'&&(
            <div style={{marginTop:12}}><FunkyFruitsRow size={20} gap={10}/></div>
          )}
        </div>

        {/* CORPUS — drawer-style panel, scrollt über den Gradient */}
        <div style={{
        background:T.bgGrad,
        borderTopLeftRadius:24,
        borderTopRightRadius:24,
        boxShadow:'0 -10px 28px rgba(0,0,0,0.55), 0 -1px 0 rgba(255,255,255,0.04) inset',
        padding:'26px 22px 0',
        display:'flex',flexDirection:'column',gap:14,
        minHeight:'calc(100dvh - env(safe-area-inset-top,0px) - 198px)',
      }}>

        {/* Onboarding-Prompt — sichtbar wenn das Profil noch nicht
            durch das Onboarding gelaufen ist. */}
        {needsOnboarding&&(
          <button onClick={()=>nav('welcome')} className="fu"
            style={{background:T.oSoft,border:`1px solid ${T.o}`,borderRadius:23,
              padding:'16px 18px',display:'flex',alignItems:'center',gap:14,
              cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s',
              animationDelay:'.02s'}}
            onPointerDown={e=>e.currentTarget.style.background=T.card2}
            onPointerUp={e=>e.currentTarget.style.background=T.oSoft}
            onPointerLeave={e=>e.currentTarget.style.background=T.oSoft}>
            <div style={{flexShrink:0,display:'flex',alignItems:'center'}}><WandIcon size={26}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.o,fontSize:16,fontWeight:800,marginBottom:2,letterSpacing:.2}}>
                Profil vervollständigen
              </div>
              <div style={{color:T.t2,fontSize:11,fontWeight:500,lineHeight:1.55}}>
                Beantworte ein paar Fragen und entdecke deinen RITMO-Spielstil.
              </div>
            </div>
            <div style={{color:T.o,fontSize:18,fontWeight:800,flexShrink:0}}>›</div>
          </button>
        )}

        {/* Single Match + Turnier — nebeneinander (Mock) */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <button onClick={()=>nav('single-setup')} className="fu" data-lift
            style={{position:'relative',overflow:'hidden',background:'transparent',
              border:`1px solid ${T.border}`,borderRadius:22,padding:0,width:'100%',
              minHeight:172,cursor:'pointer',color:T.t1,textAlign:'left',
              transition:'filter .15s'}}
            onPointerDown={e=>e.currentTarget.style.filter='brightness(1.15)'}
            onPointerUp={e=>e.currentTarget.style.filter=''}
            onPointerLeave={e=>e.currentTarget.style.filter=''}>
            <GlassSurface {...HOME_CARD_GLASS}/>
            <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',
              alignItems:'flex-start',padding:'18px 18px 16px'}}>
              <SingleMatchIcon size={52}/>
              <div style={{marginTop:14}}>
                <div style={{color:T.o,fontSize:23,fontWeight:800,marginBottom:4,letterSpacing:-.4}}>Single Match</div>
                <div style={{color:T.t1,fontSize:13.5,fontWeight:600,lineHeight:1.45}}>Best of 3 | Americano</div>
              </div>
            </div>
          </button>
          <button onClick={()=>nav('tournament-hub')} className="fu" data-lift
            style={{position:'relative',overflow:'hidden',background:'transparent',
              border:`1px solid ${T.border}`,borderRadius:22,padding:0,width:'100%',
              minHeight:172,cursor:'pointer',color:T.t1,textAlign:'left',
              animationDelay:'.06s',transition:'filter .15s'}}
            onPointerDown={e=>e.currentTarget.style.filter='brightness(1.15)'}
            onPointerUp={e=>e.currentTarget.style.filter=''}
            onPointerLeave={e=>e.currentTarget.style.filter=''}>
            <GlassSurface {...HOME_CARD_GLASS}/>
            <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',
              alignItems:'flex-start',padding:'18px 18px 16px'}}>
              <TrophyIcon size={52}/>
              <div style={{marginTop:14}}>
                <div style={{color:T.o,fontSize:23,fontWeight:800,marginBottom:4,letterSpacing:-.4}}>Turnier</div>
                <div style={{color:T.t1,fontSize:13.5,fontWeight:600,lineHeight:1.45}}>Americano | Mexicano &amp; mehr</div>
              </div>
            </div>
          </button>
        </div>

        {/* RITMO DNA Liga — große Karte mit Luft (Mock) */}
        <button onClick={()=>nav('liga')} className="fu" data-lift
          style={{position:'relative',overflow:'hidden',background:'transparent',
            border:`1px solid ${T.border}`,borderRadius:22,padding:0,width:'100%',
            minHeight:168,cursor:'pointer',color:T.t1,textAlign:'left',
            animationDelay:'.1s',transition:'filter .15s'}}
          onPointerDown={e=>e.currentTarget.style.filter='brightness(1.15)'}
          onPointerUp={e=>e.currentTarget.style.filter=''}
          onPointerLeave={e=>e.currentTarget.style.filter=''}>
          <GlassSurface {...HOME_CARD_GLASS}/>
          <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',
            alignItems:'flex-start',padding:'18px 20px 16px'}}>
            <span style={{display:'inline-flex',flexShrink:0,color:T.t1}}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true">
                <path d="M20 12a8 8 0 1 1-3.1-6.3"/>
                <path d="M20 3.5V7h-3.5"/>
                <circle cx="12" cy="12" r="2.4" fill={T.o} stroke="none"/>
              </svg>
            </span>
            <div style={{marginTop:14}}>
              <div style={{color:T.o,fontSize:25,fontWeight:800,letterSpacing:-.4}}>RITMO DNA Liga</div>
              <div style={{color:T.t1,fontSize:16,fontWeight:600,marginTop:5,
                maxWidth:170,lineHeight:1.4}}>
                Die Liga mit der du wöchentlich wächst.
              </div>
            </div>
          </div>
        </button>

        {/* ── Events — Datums-Leiste, scrollbar bis Monatsende.
            Tage MIT Event sind orange markiert; der 18. zeigt auf das
            RITMO X Padel Haus Event. */}
        <div className="fu" style={{animationDelay:'.14s',marginTop:17}}>
          <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',
            gap:9,paddingRight:14}}>
            <div style={{color:T.t1,fontSize:21,fontWeight:800,letterSpacing:-.4}}>Events</div>
            <span style={{width:27,height:27,borderRadius:7,border:`1.8px solid ${T.t1}`,
              display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.t1}
                strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/>
                <line x1="3.5" y1="10" x2="20.5" y2="10"/>
                <line x1="8" y1="2.8" x2="8" y2="6.6"/>
                <line x1="16" y1="2.8" x2="16" y2="6.6"/>
              </svg>
            </span>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',paddingRight:84}}>
            <span style={{display:'block',width:1.5,height:13,background:T.t2,
              marginTop:5,borderRadius:1}}/>
          </div>
          <div className="hscroll" style={{display:'flex',gap:11,overflowX:'auto',
            margin:'9px -22px 0',padding:'2px 22px 4px',
            /* scrollPaddingLeft: sonst snappt 'mandatory' das erste
               Tile an die Container-Kante (x=0) statt bündig zu den
               Karten bei 22px. */
            scrollSnapType:'x mandatory',scrollPaddingLeft:22,
            WebkitOverflowScrolling:'touch'}}>
            {eventDays.map(d=>{
              const ev=eventFor(d);
              return(
                <button key={d} onClick={()=>nav('events')}
                  aria-label={ev?`${d}. ${monthName} — ${ev}`:`Events am ${d}. ${monthName}`}
                  title={ev||undefined}
                  style={{flexShrink:0,width:72,height:72,borderRadius:18,
                    background:'transparent',scrollSnapAlign:'start',cursor:'pointer',
                    border:`2.5px solid ${ev?T.o:T.t1}`,
                    color:ev?T.o:T.t1,fontSize:32,fontWeight:800,letterSpacing:-1,
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Matches für dich — zwei Vorschläge; das Herz öffnet die
            Match-Präferenzen (neuer Screen). */}
        <div className="fu" style={{animationDelay:'.18s'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
            margin:'18px 2px 12px 0'}}>
            <div style={{color:T.t1,fontSize:21,fontWeight:800,letterSpacing:-.4}}>
              Matches für dich
            </div>
            <button onClick={()=>nav('match-prefs')} aria-label="Match-Präferenzen"
              style={{background:'none',border:'none',padding:4,cursor:'pointer',
                color:T.t1,display:'inline-flex'}}>
              <HeartIcon size={24} filled/>
            </button>
          </div>
          {/* Horizontal swipebar — EINE Karte pro Match (bis zu 5),
              großzügiger skaliert; nächste Karte peekt rechts an. */}
          <div className="hscroll" style={{display:'flex',gap:12,overflowX:'auto',
            margin:'0 -22px',padding:'2px 22px 6px',
            scrollSnapType:'x mandatory',scrollPaddingLeft:22,
            WebkitOverflowScrolling:'touch'}}>
            {MATCH_SLOTS.slice(0,5).map(s=>(
              <button key={s.date} onClick={()=>nav('booking-assist')}
                style={{flexShrink:0,width:'calc(100vw - 56px)',maxWidth:420,
                  height:168,position:'relative',overflow:'hidden',
                  scrollSnapAlign:'start',border:`1.5px solid ${T.o}`,
                  borderRadius:22,padding:0,cursor:'pointer',textAlign:'left',
                  color:'#FFF',background:'#1A1208',transition:'filter .15s'}}
                onPointerDown={e=>e.currentTarget.style.filter='brightness(1.1)'}
                onPointerUp={e=>e.currentTarget.style.filter=''}
                onPointerLeave={e=>e.currentTarget.style.filter=''}>
                {/* Hero-Bild + Lesbarkeits-Verlauf */}
                <img src={`${getAssetBase()}assets/regelwerkhero.jpeg`} alt=""
                  aria-hidden="true" loading="lazy" draggable={false}
                  style={{position:'absolute',inset:0,width:'100%',height:'100%',
                    objectFit:'cover',userSelect:'none'}}/>
                <span aria-hidden="true" style={{position:'absolute',inset:0,
                  background:'linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,.08) 38%, rgba(0,0,0,.74) 100%)'}}/>
                {/* Overlay-Inhalte */}
                <span style={{position:'absolute',inset:0,padding:'14px 16px',
                  display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                  {/* Oben: Standort-Chip · Wegbeschreibung + Chat (Mock) */}
                  <span style={{display:'flex',alignItems:'flex-start',
                    justifyContent:'space-between',gap:8}}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:4,
                      padding:'4px 10px',borderRadius:999,
                      border:'1.5px solid #FFC078',background:'rgba(20,12,2,.55)',
                      color:'#FFF',fontSize:9,fontWeight:800,letterSpacing:.2,
                      whiteSpace:'nowrap',overflow:'hidden',minWidth:0,marginTop:1}}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                        stroke="#FFF" strokeWidth="2.6" strokeLinecap="round"
                        strokeLinejoin="round" aria-hidden="true" style={{flexShrink:0}}>
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span style={{overflow:'hidden',textOverflow:'ellipsis'}}>{s.loc}</span>
                    </span>
                    <span style={{display:'flex',gap:8,flexShrink:0}}>
                      {/* Wegbeschreibung zum Court (öffnet Maps) */}
                      <span role="button" aria-label="Wegbeschreibung"
                        onClick={e=>{e.stopPropagation();
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.loc)}`,'_blank','noopener');}}
                        style={{width:30,height:30,borderRadius:'50%',
                          background:'rgba(20,12,2,.55)',border:'1px solid rgba(255,255,255,.35)',
                          display:'inline-flex',alignItems:'center',justifyContent:'center',
                          cursor:'pointer'}}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="#FFF" strokeWidth="2" strokeLinecap="round"
                          strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 2.5 21.5 12 12 21.5 2.5 12 12 2.5z"/>
                          <path d="M9.5 13.5v-2.2a1.3 1.3 0 0 1 1.3-1.3h3.7"/>
                          <path d="M12.6 8.2 14.5 10l-1.9 1.8"/>
                        </svg>
                      </span>
                      {/* Match-Chat (Mock) */}
                      <span role="button" aria-label="Match-Chat (bald)"
                        onClick={e=>e.stopPropagation()}
                        style={{width:30,height:30,borderRadius:'50%',
                          background:'rgba(20,12,2,.55)',border:'1px solid rgba(255,255,255,.35)',
                          display:'inline-flex',alignItems:'center',justifyContent:'center',
                          cursor:'pointer'}}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="#FFF" strokeWidth="2" strokeLinecap="round"
                          strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.6 0-3.1-.4-4.4-1.2L3 20l1.2-5.1A8.5 8.5 0 1 1 21 11.5z"/>
                        </svg>
                      </span>
                    </span>
                  </span>
                  {/* Unten: Avatare links · Uhrzeit ÜBER Datum (rechts) */}
                  <span style={{display:'flex',alignItems:'flex-end',
                    justifyContent:'space-between',gap:8}}>
                    <span style={{display:'flex',gap:7,alignItems:'flex-start'}}>
                      {[0,1,2,3].map(i=>{
                        const p=s.players[i];
                        if(p) return(
                          <span key={i} style={{display:'flex',flexDirection:'column',
                            alignItems:'center',gap:2,minWidth:0}}>
                            <span style={{width:27,height:27,borderRadius:'50%',
                              background:'linear-gradient(140deg,#FFD9A8 0%,#FF7A1A 55%,#C25A12 100%)',
                              display:'block',boxShadow:'0 1px 4px rgba(0,0,0,.4)',
                              border:'1px solid rgba(255,255,255,.35)'}}/>
                            <span style={{fontSize:8,fontWeight:800,color:'#FFF',
                              maxWidth:38,overflow:'hidden',textOverflow:'ellipsis',
                              whiteSpace:'nowrap',textShadow:'0 1px 3px rgba(0,0,0,.6)'}}>{p}</span>
                          </span>
                        );
                        if(i===s.players.length) return(
                          <span key={i} style={{width:27,height:27,borderRadius:'50%',
                            background:'rgba(255,122,26,.92)',color:'#000',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:15,fontWeight:800,lineHeight:1,flexShrink:0}}>+</span>
                        );
                        return(
                          <span key={i} style={{width:27,height:27,borderRadius:'50%',
                            border:'1.5px dashed rgba(255,255,255,.6)',
                            display:'block',flexShrink:0,boxSizing:'border-box'}}/>
                        );
                      })}
                    </span>
                    {/* Uhrzeit exakt ÜBER dem Datum — rechtsbündig gestapelt */}
                    <span style={{display:'flex',flexDirection:'column',alignItems:'flex-end',
                      flexShrink:0,lineHeight:1}}>
                      <span style={{fontSize:12,fontWeight:600,letterSpacing:'-0.02em',
                        color:'#FFF',whiteSpace:'nowrap',marginBottom:3,
                        textShadow:'0 1px 4px rgba(0,0,0,.55)'}}>{s.time}</span>
                      <span style={{fontSize:22,fontWeight:600,letterSpacing:'-0.1em',
                        color:'#FFF',whiteSpace:'nowrap',
                        textShadow:'0 1px 5px rgba(0,0,0,.55)'}}>{s.date}</span>
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Discover the RITMO — horizontale Bild-Cards */}
        <DiscoverSection nav={nav}/>

        {/* Internal scroll-bottom spacer so last card isn't hidden behind floating TabBar */}
        <div style={{height:120,flexShrink:0}}/>
        </div>{/* /CORPUS */}
      </div>{/* /Scroller */}

      {/* 3) Fixe Top-Bar — Glas blendet beim Scrollen ein, das Logo
          schwenkt von links in die Mitte und bleibt oben fixiert;
          Glocke + Burger sind dauerhaft fixiert. */}
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:5,
        height:'calc(env(safe-area-inset-top,0px) + 72px)',pointerEvents:'none'}}>
        <div aria-hidden="true" style={{position:'absolute',inset:0,
          opacity:barGlass,
          background:'color-mix(in srgb, var(--card) 55%, transparent)',
          WebkitBackdropFilter:'blur(18px) saturate(160%)',
          backdropFilter:'blur(18px) saturate(160%)',
          borderBottom:'1px solid color-mix(in srgb, var(--t1) 10%, transparent)'}}/>
        {/* Logo: links groß → mittig kompakt (per Scroll interpoliert).
            Die calc-Formel zentriert die SICHTBARE Wortmarke. */}
        <div onClick={()=>nav('profile-ritmodna')}
          style={{position:'absolute',left:9,
            top:`calc(env(safe-area-inset-top,0px) + ${Math.round(60-54*tCol)}px)`,
            transform:`translateX(calc((50vw - 51.5px) * ${tCol.toFixed(3)})) scale(${(1-0.38*tCol).toFixed(3)})`,
            transformOrigin:'left top',pointerEvents:'auto',cursor:'pointer'}}>
          <RitmoWordmark size={66} style={{marginLeft:-35,display:'block'}}/>
        </div>
        {/* Glocke + Burger — fixiert, unabhängig vom Scroll */}
        <div style={{position:'absolute',right:13,
          top:'calc(env(safe-area-inset-top,0px) + 20px)',
          display:'flex',alignItems:'center',gap:22,pointerEvents:'auto'}}>
          <button onClick={()=>nav('ritmopost')}
            aria-label="Benachrichtigungen"
            style={{background:'none',border:'none',padding:4,position:'relative',
              color:'#FFFFFF',cursor:'pointer',display:'inline-flex',
              filter:'drop-shadow(0 1px 4px rgba(0,0,0,.3))'}}>
            <BellIcon size={24}/>
            {hasUnread&&(
              <span aria-label="Ungelesene Nachrichten"
                style={{position:'absolute',top:1,right:1,
                  width:10,height:10,borderRadius:'50%',
                  background:'#E84545',
                  boxShadow:'0 0 0 2px rgba(0,0,0,.35)'}}/>
            )}
          </button>
          {/* Burger fuehrt direkt in die Einstellungen (Abmelden wohnt
              jetzt ganz unten in den Einstellungen). */}
          <button onClick={()=>nav('settings')}
            aria-label="Einstellungen"
            style={{background:'none',border:'none',padding:4,
              color:'#FFFFFF',cursor:'pointer',display:'inline-flex',
              filter:'drop-shadow(0 1px 4px rgba(0,0,0,.3))'}}>
            <MenuIcon size={25}/>
          </button>
        </div>
      </div>

      <BottomFade/>
      <TabBar active={activeTab} onTab={onTabLocal}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUCHE-HUB — eigener Tab: Spieler, Clubs, Buchungsassistent.
═══════════════════════════════════════════════════════════════ */
function SearchHub({nav,onTab}){
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)'}}>
      <ScreenHeader title="Suche" subtitle="Finde Spieler, Clubs und Courts."
        icon={<SearchIcon size={34}/>}/>

      <div style={{flex:1,padding:'0 22px 140px',overflowY:'auto',
        WebkitOverflowScrolling:'touch',display:'flex',flexDirection:'column',gap:14}}>
        <HubBigCard
          icon={<PersonGlyph size={28}/>}
          title="Spieler"
          desc="Suchen, folgen, Profile entdecken."
          onClick={()=>nav('player-search')} delay=".02s"/>
        <HubBigCard
          icon={<CoffeeCupIcon size={28} color={T.o}/>}
          title="Clubs"
          desc="Beitreten, gründen, Club-Chat."
          onClick={()=>nav('clubs')} delay=".06s"/>
        <HubBigCard
          icon={<AirPlayIcon size={28} color={T.o}/>}
          title="Buchungsassistent"
          desc="Freie Courts finden & direkt buchen — bald."
          onClick={()=>nav('booking-assist')} delay=".1s"/>
      </div>

      <BottomFade/>
      <TabBar active="suche" onTab={onTab}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMING SOON — Teaser-Shell für Liga + Buchungsassistent.
═══════════════════════════════════════════════════════════════ */
function ComingSoon({icon,title,desc,bullets=[],onHome}){
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)'}}>
      <div style={{flex:1,padding:'0 22px 140px',overflowY:'auto',
        WebkitOverflowScrolling:'touch'}}>
        <div className="fi" style={{
          background:`linear-gradient(135deg, ${T.o}18 0%, ${T.card} 100%)`,
          border:`1px solid ${T.o}55`,borderRadius:23,padding:'30px 24px',
          textAlign:'center'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:14}}>{icon}</div>
          <div style={{color:T.t1,fontSize:26,fontWeight:900,letterSpacing:-.4}}>{title}</div>
          <div style={{display:'inline-block',marginTop:10,fontSize:10,fontWeight:800,
            letterSpacing:1.6,color:T.o,background:T.oSoft,border:`1px solid ${T.o}55`,
            borderRadius:9,padding:'4px 11px',textTransform:'uppercase'}}>Bald verfügbar</div>
          <div style={{color:T.t2,fontSize:16,lineHeight:1.6,marginTop:16}}>{desc}</div>
        </div>
        {bullets.length>0&&(
          <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
            borderRadius:19,padding:'18px',marginTop:14,animationDelay:'.08s'}}>
            <div style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.3,
              textTransform:'uppercase',marginBottom:10}}>Was kommt</div>
            {bullets.map((b,i)=>(
              <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',
                padding:'7px 0',borderTop:i>0?`1px solid ${T.sep}`:'none'}}>
                <span style={{color:T.o,fontWeight:800,lineHeight:1.55}}>·</span>
                <span style={{color:T.t2,fontSize:13,lineHeight:1.55}}>{b}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomFade/>
      <MatchBar onHome={onHome}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   APP-FAQ — häufige Fragen zur App (Teil der RITMO Bibel).
═══════════════════════════════════════════════════════════════ */
const APP_FAQ=[
  {q:'Was ist der Unterschied zwischen Americano und Mexicano?',
   a:'Americano lost jede Runde zufällige Partner aus, Punkte zählen individuell. Mexicano paart ab Runde 2 nach Tabellenstand (1+4 gegen 2+3) — enger, fairer, spannender.'},
  {q:'Wie funktioniert der Pausen-Bonus?',
   a:'Wer aussetzen muss, bekommt den aufgerundeten Mittelwert aller Punkte dieser Runde gutgeschrieben. Niemand wird durch eine erzwungene Pause benachteiligt.'},
  {q:'Kann ich ein Turnier als Entwurf speichern?',
   a:'Ja — im Turnier-Setup auf das Lesezeichen-Symbol tippen. Der Entwurf erscheint unter Live → Entwürfe und lässt sich jederzeit weiterbearbeiten und starten.'},
  {q:'Wie ändere ich den Timer-Klingelton?',
   a:'Einstellungen → Steuerung → Timer-Klingelton. Der RITMO-Ton ist Standard; antippen zum Vorhören, auswählen zum Setzen — gilt für alle Timer in der App.'},
  {q:'Wie verbinde ich einen Smart Ring oder Presenter?',
   a:'Gerät per Bluetooth mit dem Smartphone koppeln, dann Einstellungen → Steuerung → Score-Gerät wählen. Der Eingabe-Tester zeigt live, welche Tasten ankommen.'},
  {q:'Funktioniert RITMO ohne Internet?',
   a:'Lokale Matches und Turniere laufen komplett offline auf deinem Gerät. Online-Turniere, Profile-Sync und Clubs brauchen eine Verbindung.'},
  {q:'Wie treten andere meinem Online-Turnier bei?',
   a:'Beim Erstellen „Online" wählen — du bekommst PIN + QR-Code in der Lobby. Mitspieler scannen den Code oder geben den PIN unter Turnier beitreten ein.'},
  {q:'Wer sieht mein Profil und meine Statistiken?',
   a:'Das steuerst du selbst: Profil → „Profil öffentlich" oder Einstellungen → Privatsphäre. Privat heißt: niemand findet dich, nur du siehst deine Daten.'},
  {q:'Wie wechsle ich das Design?',
   a:'Einstellungen → Anpassung → Theme. Fünf Looks von RITMO BAUHAUS Dark bis Funky — die ganze App färbt sich sofort um.'},
  {q:'Wie lösche ich mein Konto?',
   a:'Einstellungen → Privatsphäre → Konto und Daten löschen. Dort siehst du vorab, welche Daten entfernt werden (DSGVO-konform).'},
];
function AppFAQ({onBack,onHome}){
  const[open,setOpen]=useState(null);
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)'}}>
      <ScreenHeader pad={18} title="App FAQ" subtitle="Häufige Fragen, kurze Antworten."
        icon={<BookIcon size={36}/>}/>

      <div style={{flex:1,padding:'0 22px 140px',overflowY:'auto',
        WebkitOverflowScrolling:'touch',display:'flex',flexDirection:'column',gap:10}}>
        {APP_FAQ.map((f,i)=>{
          const isOpen=open===i;
          return(
            <button key={i} onClick={()=>setOpen(isOpen?null:i)} className="fu"
              style={{background:isOpen?T.card2:T.card,border:`1px solid ${isOpen?T.o:T.border}`,
                borderRadius:17,padding:'15px 17px',textAlign:'left',cursor:'pointer',
                color:T.t1,animationDelay:`${Math.min(i*0.04,0.3)}s`,
                transition:'background var(--anim-base), border-color var(--anim-base)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{flex:1,color:isOpen?T.o:T.t1,fontSize:16,fontWeight:700,
                  lineHeight:1.5,transition:'color var(--anim-base)'}}>{f.q}</div>
                <span style={{flexShrink:0,display:'inline-flex',
                  transform:isOpen?'rotate(90deg)':'rotate(0deg)',
                  transition:'transform var(--anim-spring)'}}>
                  <ChevronRightIcon size={16} color={isOpen?T.o:T.t3}/>
                </span>
              </div>
              <div style={{maxHeight:isOpen?220:0,opacity:isOpen?1:0,overflow:'hidden',
                transition:'max-height var(--anim-slow), opacity .25s ease'}}>
                <div style={{color:T.t2,fontSize:13,lineHeight:1.6,paddingTop:10}}>{f.a}</div>
              </div>
            </button>
          );
        })}
      </div>

      <BottomFade/>
      <MatchBar onHome={onHome} rightButtons={[{icon:<BookIcon size={22}/>,onClick:onBack}]}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SINGLE SETUP
═══════════════════════════════════════════════════════════════ */
/* Wiederverwendbare Hero-Card oben auf den Setup-Screens.
   Großes Icon + Headline + 1-Satz Beschreibung. Optionales accent
   für die Border. */
function SetupHero({icon,title,desc,accent}){
  const c=accent||T.o;
  return(
    <div className="fi" style={{
      background:`linear-gradient(135deg, ${c}18 0%, ${T.card} 100%)`,
      border:`1px solid ${c}55`,
      borderRadius:23,padding:'20px 22px',
      display:'flex',alignItems:'center',gap:18}}>
      <div style={{flexShrink:0,width:64,height:64,borderRadius:'50%',
        background:`${c}22`,border:`1.5px solid ${c}`,
        display:'flex',alignItems:'center',justifyContent:'center'}}>
        {icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:T.t1,fontSize:18,fontWeight:900,letterSpacing:-.3,marginBottom:4}}>
          {title}
        </div>
        <div style={{color:T.t2,fontSize:12,lineHeight:1.5}}>
          {desc}
        </div>
      </div>
    </div>
  );
}

function SingleSetup({nav,onHome,cfg,setCfg,profile}){
  const userName=profile?.name||'';
  // Spielername-Slots: User belegt Slot 0 (sein Profil), die uebrigen
  // bekommen Default-Namen, damit das Setup ohne Tippen startbar ist.
  const[players,setPlayers]=useState(()=>{
    const stored=cfg.players;
    if(stored&&stored.length===4) return stored;
    return [userName,'Spieler 2','Spieler 3','Spieler 4'];
  });
  const setPlayer=(idx,val)=>setPlayers(p=>p.map((v,i)=>i===idx?val:v));

  const[fmt,setFmt]=useState(cfg.format||'bo3');
  const[amLim,setAmLim]=useState(cfg.amLimit??21);
  const[gpAfter,setGpAfter]=useState(cfg.goldenPointAfter??null);

  // Anzeige-Namen fuer die Match-Screen (Team A & Team B).
  const teamA=[players[0]||'Spieler 1',players[1]||'Spieler 2'].join(' & ');
  const teamB=[players[2]||'Spieler 3',players[3]||'Spieler 4'].join(' & ');

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <ScreenHeader title="Single Match" icon={<SingleMatchIcon size={40}/>}/>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>

        <SetupHero
          icon={<SingleMatchIcon size={36}/>}
          title="Schnelles Match"
          desc="Du, dein Partner, zwei Gegner. Waehle Best-of-3 oder Americano (Freestyle) und leg los."/>

        {/* Team 1 */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19}}>
          <div style={{padding:'14px 18px 6px',color:T.o,fontSize:11,fontWeight:700,
            letterSpacing:1.3,textTransform:'uppercase'}}>
            Team 1
          </div>
          {[0,1].map(idx=>{
            const isUser=idx===0;
            return(
              <div key={idx} style={{display:'flex',alignItems:'center',
                padding:'14px 18px',borderTop:`1px solid ${T.sep}`,gap:12}}>
                {/* Kein festes width mehr: seit 16px-Schrift passte
                    "Spieler 1" nicht mehr in 94px und die Ziffer brach
                    um. nowrap + Eigenbreite hält das Label einzeilig. */}
                <span style={{color:T.t1,fontSize:16,fontWeight:600,whiteSpace:'nowrap',
                  flexShrink:0,display:'flex',alignItems:'center',gap:5}}>
                  Spieler {idx+1}
                  {isUser&&<span style={{color:T.o,fontWeight:700}}>(Du)</span>}
                </span>
                <input value={players[idx]}
                  onChange={e=>setPlayer(idx,e.target.value)}
                  placeholder={isUser?'Dein Name':`Spieler ${idx+1}`}
                  autoCapitalize="words" autoCorrect="off" spellCheck={false}
                  style={{flex:1,fontSize:16,color:T.t2,fontWeight:500,textAlign:'right',
                    background:'transparent',border:'none',outline:'none'}}/>
                <button onClick={()=>setPlayer(idx,'')}
                  style={{width:20,height:20,borderRadius:'50%',background:T.t4,border:'none',
                    color:T.t1,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',
                    justifyContent:'center',fontWeight:700,flexShrink:0}}>{'×'}</button>
              </div>
            );
          })}
        </div>

        {/* Team 2 */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19}}>
          <div style={{padding:'14px 18px 6px',color:T.o,fontSize:11,fontWeight:700,
            letterSpacing:1.3,textTransform:'uppercase'}}>
            Team 2
          </div>
          {[2,3].map(idx=>(
            <div key={idx} style={{display:'flex',alignItems:'center',
              padding:'14px 18px',borderTop:`1px solid ${T.sep}`,gap:12}}>
              <span style={{color:T.t1,fontSize:16,fontWeight:600,
                whiteSpace:'nowrap',flexShrink:0}}>
                Spieler {idx+1}
              </span>
              <input value={players[idx]}
                onChange={e=>setPlayer(idx,e.target.value)}
                placeholder={`Spieler ${idx+1}`}
                autoCapitalize="words" autoCorrect="off" spellCheck={false}
                style={{flex:1,fontSize:16,color:T.t2,fontWeight:500,textAlign:'right',
                  background:'transparent',border:'none',outline:'none'}}/>
              <button onClick={()=>setPlayer(idx,'')}
                style={{width:20,height:20,borderRadius:'50%',background:T.t4,border:'none',
                  color:T.t1,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',
                  justifyContent:'center',fontWeight:700,flexShrink:0}}>{'×'}</button>
            </div>
          ))}
        </div>

        {/* Spielmodus */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
          padding:'18px 18px 20px'}}>
          <div style={{color:T.o,fontSize:21,fontWeight:800,marginBottom:14}}>Spielmodus</div>

          <div style={{display:'flex',background:T.card2,borderRadius:30,padding:4,gap:4,
            border:`1px solid ${T.border}`,marginBottom:14}}>
            <button onClick={()=>setFmt('bo3')}
              style={{flex:1,padding:'10px',borderRadius:24,border:'none',cursor:'pointer',
                background:fmt==='bo3'?T.t4:'transparent',
                display:'flex',alignItems:'center',justifyContent:'center',
                transition:'background .2s'}}>
              <BestOfThreeIcon size={22}/>
            </button>
            <button onClick={()=>setFmt('americano')}
              style={{flex:1,padding:'10px',borderRadius:24,border:'none',cursor:'pointer',
                background:fmt==='americano'?T.t4:'transparent',
                display:'flex',alignItems:'center',justifyContent:'center',
                transition:'background .2s'}}>
              <RacketMini size={20}/>
            </button>
          </div>

          {fmt==='bo3'&&(
            <div>
              <div style={{color:T.t1,fontSize:15,fontWeight:700,marginBottom:6}}>Best of Three</div>
              <div style={{marginBottom:6}}><BestOfThreeIcon size={20}/></div>
              <div style={{color:T.t3,fontSize:12,lineHeight:1.6,fontWeight:500,marginBottom:14}}>
                Klassisches Scoring:<br/>
                15 - 30 - 40 | Einstand - Vorteil<br/>
                2 Saetze zum Sieg
              </div>
              <div style={{borderTop:`1px solid ${T.sep}`,paddingTop:10}}>
                <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
                  textTransform:'uppercase',marginBottom:6}}>Golden Point</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {[
                    {v:null,l:'Aus'},
                    {v:0,l:'Sofort'},
                    {v:1,l:'nach 1×'},
                    {v:2,l:'nach 2×'},
                  ].map(opt=>(
                    <button key={String(opt.v)} onClick={()=>setGpAfter(opt.v)}
                      style={{padding:'5px 11px',borderRadius:19,cursor:'pointer',
                        background:gpAfter===opt.v?T.oSoft:'transparent',
                        border:`1px solid ${gpAfter===opt.v?T.o:T.border}`,
                        color:gpAfter===opt.v?T.o:T.t2,
                        fontSize:11,fontWeight:600,transition:'all .15s'}}>
                      {opt.l}
                    </button>
                  ))}
                </div>
                <div style={{color:T.t3,fontSize:10,marginTop:6,lineHeight:1.4}}>
                  {gpAfter===null?'Traditionell: Vorteil → 2 Punkte Vorsprung'
                    :gpAfter===0?'Beim 1. Einstand entscheidet der naechste Punkt'
                    :`Ab dem ${gpAfter+1}. Einstand entscheidet der naechste Punkt`}
                </div>
              </div>
            </div>
          )}

          {fmt==='americano'&&(
            <div>
              <div style={{color:T.t1,fontSize:15,fontWeight:700,marginBottom:4}}>
                Americano <span style={{color:T.t3,fontWeight:600}}>(Freestyle)</span>
              </div>
              <div style={{marginBottom:6}}><RacketMini size={18}/></div>
              <div style={{color:T.t3,fontSize:12,lineHeight:1.6,fontWeight:500,marginBottom:14}}>
                Punkte zaehlen pro Team. Optional mit Timer.
              </div>
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <div style={{display:'flex',background:T.card2,borderRadius:24,padding:3,
                  border:`1px solid ${T.border}`}}>
                  <button onClick={()=>setAmLim(21)}
                    style={{padding:'5px 14px',borderRadius:25,border:'none',cursor:'pointer',
                      background:amLim===21?T.t4:'transparent',
                      color:T.t1,fontSize:12,fontWeight:600,transition:'background .2s'}}>
                    Split 21
                  </button>
                  <button onClick={()=>setAmLim(0)}
                    style={{padding:'5px 14px',borderRadius:25,border:'none',cursor:'pointer',
                      background:amLim===0?T.t4:'transparent',
                      color:T.t1,fontSize:16,fontWeight:600,transition:'background .2s',
                      display:'flex',alignItems:'center'}}>
                    {'∞'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{height:100,flexShrink:0}}/>
      </div>

      <MatchBar onHome={onHome} rightButtons={[{
        icon:'Start',
        onClick:()=>{
          setCfg({players,nameA:teamA,nameB:teamB,format:fmt,amLimit:amLim,goldenPointAfter:gpAfter});
          nav('match');
        },
        style:{
          width:56,height:56,
          background:T.g,
          border:'1px solid rgba(255,255,255,0.18)',
          color:T.t1,
          fontSize:13,fontWeight:800,
        }
      }]}/>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MATCH SCREEN
═══════════════════════════════════════════════════════════════ */
function Match({cfg,setCfg,bo3,dBo3,am,dAm,onHome,inputMode='smartphone',ringId='ritmo',matchKeyRef,theme='dark',voiceOn=false,voiceBaseUrl='',tabletMode=false,onMatchLogged}){
  // Tablet-Modus-Skalierungsfaktor — wird auf alle größenbezogenen
  // Stylings im Portrait-Layout angewandt. BigScreen hat eigenen
  // Zoom-Multiplier; Tablet-Modus erhöht dort den Default-Zoom auf 1.5.
  // Service-Indikator + Verlauf-Bar bleiben in beiden Pfaden erhalten.
  const tm=tabletMode?1.35:1;
  const isB=cfg.format==='bo3';
  const[flA,setFA]=useState(false);const[flB,setFB]=useState(false);
  const[confReset,setConfReset]=useState(false);
  const[castSheet,setCastSheet]=useState(false);
  const[bigScreen,setBigScreen]=useState(false);
  // Zoom-Level im BigScreen: skaliert alle Anzeige-Größen (Score, Sätze,
  // Game-Count, Service-Indikator). Zyklus 1 → 1.5 → 2 → 0.5 → 1.
  // Reset beim Schließen von BigScreen.
  const ZOOM_CYCLE=[1,1.5,2,0.5];
  const[zoomLevel,setZoomLevel]=useState(1);
  // BigScreen → Reset auf Default. Im Tablet-Modus ist Default 1.5×
  // (statt 1×), damit iPad-Anzeigen sofort groß wirken.
  useEffect(()=>{if(!bigScreen) setZoomLevel(tabletMode?1.5:1);},[bigScreen,tabletMode]);
  const cycleZoom=()=>setZoomLevel(z=>{
    const i=ZOOM_CYCLE.indexOf(z);
    return ZOOM_CYCLE[(i+1)%ZOOM_CYCLE.length];
  });
  const[hint,setHint]=useState('');

  // ═══ TIMER STATE (Americano) ═══
  const[timerMin,setTimerMin]=useState(cfg.timerMin||10);
  const[secsLeft,setSecsLeft]=useState((cfg.timerMin||10)*60);
  const[running,setRunning]=useState(false);
  const[timerFinished,setTimerFinished]=useState(false);
  const[hasStarted,setHasStarted]=useState(false); // false = picker visible, true = countdown

  // Persist minutes
  useEffect(()=>{
    if(setCfg) setCfg(c=>({...c,timerMin}));
  },[timerMin]);// eslint-disable-line

  // Reset secsLeft when minutes change (only if not started)
  useEffect(()=>{
    if(!hasStarted) setSecsLeft(timerMin*60);
  },[timerMin,hasStarted]);

  // Tick
  useEffect(()=>{
    if(!running||timerFinished) return;
    const id=setInterval(()=>{
      setSecsLeft(s=>{
        if(s<=1){
          setRunning(false);
          setTimerFinished(true);
          playRing(ringId);
          dAm({type:'TIME_UP'});
          return 0;
        }
        return s-1;
      });
    },1000);
    return()=>clearInterval(id);
  },[running,timerFinished,ringId,dAm]);

  const startTimer=()=>{setHasStarted(true);setRunning(true);setTimerFinished(false);};
  const pauseTimer=()=>setRunning(false);
  const resetTimer=()=>{
    setRunning(false);setTimerFinished(false);setHasStarted(false);
    setSecsLeft(timerMin*60);
  };

  const dsp=useCallback(a=>isB?dBo3(a):dAm(a),[isB,dBo3,dAm]);
  const punkt=useCallback(t=>{
    // limit:cfg.amLimit wird mit jeder Action mitgegeben, damit der
    // Americano-Reducer immer das aktuelle Limit aus dem Setup
    // verwendet — auch wenn der am-State noch ein altes Limit aus
    // einem früheren Spiel in localStorage trägt (z.B. wechselt
    // der User von 21 auf ∞, ohne dazwischen zu resetten).
    buzz(12); // haptisches Punkt-Feedback (Android; iOS ignoriert still)
    dsp({type:'PT',t,goldenPointAfter:cfg.goldenPointAfter,limit:cfg.amLimit??21});
    if(t==='A'){setFA(true);setTimeout(()=>setFA(false),420);}
    else{setFB(true);setTimeout(()=>setFB(false),420);}
  },[dsp,cfg.goldenPointAfter,cfg.amLimit]);

  /* ── Voice announce engine ──────────────────────────────────────
     Plays {baseUrl}/{key}.mp3 on score-changing events.
     Silent on missing files / blocked autoplay (logs to console). */
  const audioRef=useRef(null);
  const announce=useCallback((key)=>{
    if(!voiceOn||!voiceBaseUrl) return;
    try{
      const url=voiceBaseUrl.replace(/\/+$/,'')+'/'+key+'.mp3';
      // Stop any in-flight announcement so the latest event wins
      if(audioRef.current){
        try{audioRef.current.pause();}catch{}
        audioRef.current=null;
      }
      const a=new Audio(url);
      a.volume=0.9;
      audioRef.current=a;
      a.play().catch(err=>{
        console.debug('[voice] play failed for',key,'-',err?.message||err);
      });
    }catch(err){
      console.debug('[voice] error for',key,err);
    }
  },[voiceOn,voiceBaseUrl]);

  /* Watch bo3 state changes and call announce() with the right key.
     Priority: match > set > game > point. Only Bo3 supported. */
  const prevBo3Ref=useRef(bo3);
  useEffect(()=>{
    const prev=prevBo3Ref.current;
    prevBo3Ref.current=bo3;
    if(!isB||!voiceOn||!voiceBaseUrl) return;
    if(bo3===prev) return;

    // Match win
    if(bo3.winner&&!prev.winner){
      announce(`match-${bo3.winner.toLowerCase()}`);
      return;
    }
    // Set win (sets array grew)
    if(bo3.sets.length>prev.sets.length){
      const w=bo3.sets[bo3.sets.length-1].w;
      announce(`satz-${w.toLowerCase()}`);
      return;
    }
    // Game win (games count went up — covers regular + tiebreak-won)
    if(bo3.gA>prev.gA){announce('spiel-a'); return;}
    if(bo3.gB>prev.gB){announce('spiel-b'); return;}
    // Inside tiebreak — skip individual point announcements (could explode)
    if(bo3.tb) return;
    // Regular point change
    if(bo3.pA!==prev.pA||bo3.pB!==prev.pB){
      const a=bo3.pA, b=bo3.pB;
      const gpAct=cfg.goldenPointAfter!=null&&cfg.goldenPointAfter>=0
        &&(bo3.deuces||0)>cfg.goldenPointAfter;
      if(a>=3&&b>=3){
        if(a===b) announce(gpAct?'golden-point':'einstand');
        else announce(a>b?'vorteil-a':'vorteil-b');
      } else {
        const LU=['0','15','30','40'];
        announce(`s-${LU[a]}-${LU[b]}`);
      }
    }
  },[bo3,isB,voiceOn,voiceBaseUrl,announce,cfg.goldenPointAfter]);

  // Live refs to current state for use in reset (saving state before wipe)
  const bo3Ref=useRef(bo3);const amRef=useRef(am);
  useEffect(()=>{bo3Ref.current=bo3;},[bo3]);
  useEffect(()=>{amRef.current=am;},[am]);

  // Saved state for undo-reset functionality
  const resetHistRef=useRef(null);

  const reset=useCallback(()=>{
    // Save current state before resetting (enables undo-reset)
    resetHistRef.current={
      format:cfg.format,
      bo3:bo3Ref.current,
      am:amRef.current,
      timestamp:Date.now(),
    };
    dBo3({type:'RESET'});dAm({type:'RESET',limit:cfg.amLimit??21});
    resetTimer();
  },[cfg.format,cfg.amLimit,dBo3,dAm]);// eslint-disable-line

  const undoReset=useCallback((maxAgeMs=Infinity)=>{
    const saved=resetHistRef.current;
    if(!saved) return false;
    if(Date.now()-saved.timestamp>maxAgeMs) return false;
    if(saved.format==='bo3'){dBo3({type:'_R',s:saved.bo3});}
    else{dAm({type:'_R',s:saved.am});}
    resetHistRef.current=null;
    return true;
  },[dBo3,dAm]);

  const undo=useCallback(()=>{buzz([8,40,8]);dsp({type:'UNDO'});},[dsp]);

  // ═══ PRESENTER / RING KEY HANDLER ═══
  // App-level <KeyCapture> (in App.jsx return) catches Bluetooth-Keyboard events
  // and dispatches them via matchKeyRef.current to handleHWKey below.
  // App-level mounting ensures KeyCapture survives bigScreen toggles.
  const upTimer=useRef(null);const downTimer=useRef(null);
  const showHint=(t)=>{setHint(t);setTimeout(()=>setHint(''),1400);};

  const handleHWKey=(e)=>{
    const D=380;

    // ── SMART RING: direct mappings (1, 2, 4, Space) ──
    if(inputMode==='ring'){
      if(e.key==='2'){
        punkt('A');
        return;
      }
      if(e.key==='4'){
        punkt('B');
        return;
      }
      if(e.key===' '||e.code==='Space'){
        undo();
        showHint('↩ Rückgängig');
        return;
      }
      if(e.key==='1'){
        // First press: reset (saves state). Second press within 1.5s: undo reset.
        if(undoReset(1500)){
          showHint('↺ Reset rückgängig gemacht');
        } else {
          reset();
          showHint('↺ Zurückgesetzt · 1 erneut für Rückgängig');
        }
        return;
      }
      return;
    }

    // ── PRESENTER: PageUp/PageDown with double-click ──
    const isUp=e.key==='PageUp'||e.code==='PageUp';
    const isDown=e.key==='PageDown'||e.code==='PageDown';
    if(!isUp&&!isDown) return;

    if(isUp){
      if(downTimer.current){clearTimeout(downTimer.current);downTimer.current=null;}
      if(upTimer.current){
        clearTimeout(upTimer.current);upTimer.current=null;
        undo();showHint('↩ Rückgängig');
      } else {
        upTimer.current=setTimeout(()=>{
          upTimer.current=null;punkt('A');
        },D);
      }
    } else if(isDown){
      if(upTimer.current){clearTimeout(upTimer.current);upTimer.current=null;}
      if(downTimer.current){
        clearTimeout(downTimer.current);downTimer.current=null;
        reset();showHint('↺ Spiel zurückgesetzt');
      } else {
        downTimer.current=setTimeout(()=>{
          downTimer.current=null;punkt('B');
        },D);
      }
    }
  };

  // Cleanup timers on unmount or mode change
  useEffect(()=>{
    return()=>{
      if(upTimer.current){clearTimeout(upTimer.current);upTimer.current=null;}
      if(downTimer.current){clearTimeout(downTimer.current);downTimer.current=null;}
    };
  },[inputMode]);

  // Register handler with App-level KeyCapture. Runs every render to keep the
  // closure fresh (handleHWKey depends on latest punkt/undo/reset/undoReset).
  // No cleanup: nulling the ref between renders would create a micro-window
  // where keystrokes from the smart ring hit a null handler and are dropped.
  // When Match unmounts, App-level KeyCapture is disabled (scr changes) so
  // the dangling ref is never invoked anyway.
  if(matchKeyRef) matchKeyRef.current=handleHWKey;

  // bigScreen toggle removes the previously focused button from DOM and focus
  // falls back to <body>. iOS Safari only dispatches Bluetooth-keyboard
  // (smart-ring) keys to a focused input, so we ping the App-level KeyCapture
  // to immediately refocus its hidden input instead of waiting for the 400ms
  // safety-net interval.
  useEffect(()=>{
    if(inputMode!=='ring'&&inputMode!=='presenter')return;
    window.dispatchEvent(new Event('ritmo-refocus-key'));
  },[bigScreen,inputMode]);

  const{pA,pB,gA,gB,sA,sB,tb,tA,tB,sets,winner,deuces}=bo3;
  const gpAct=cfg.goldenPointAfter!=null&&cfg.goldenPointAfter>=0
    &&(deuces||0)>cfg.goldenPointAfter;
  const[dA,dB]=tb?[String(tA),String(tB)]:ptD(pA,pB,gpAct);
  const win=isB?winner:am.winner;

  // ── Match-Logging zur DB bei winner-Transition null→Wert ──
  // useRef wird beim Mount auf den aktuellen win-Wert initialisiert.
  // Dadurch loggen wir ein bereits abgeschlossenes Match NICHT erneut,
  // wenn der User den Screen erneut öffnet (Match-State liegt in
  // localStorage). Erst nach RESET (win wird null) und neuem Sieg
  // wird wieder geloggt.
  const loggedWinRef=useRef(win);
  useEffect(()=>{
    if(win&&!loggedWinRef.current){
      loggedWinRef.current=win;
      const userWon=win==='A';
      dbLogMatch({
        format:isB?'bo3':'americano',
        player_names:cfg.players||[cfg.nameA,cfg.nameB],
        score_a:isB?sA:am.pA,
        score_b:isB?sB:am.pB,
        sets:isB?sets:null,
        user_team:'A', // Konvention: User ist im Single immer Team A
        user_won:userWon,
      }).catch(()=>{});
      // Lokales Match-Log (Fallback ohne Supabase) → fliesst in die
      // Profil-Statistik ein, auch wenn kein Backend verbunden ist.
      logMatchLocal({format:isB?'bo3':'americano',user_won:userWon,sets:isB?sets:null});
      // Counter im Profil hochzählen (matchesPlayed + ggf. winsCount),
      // damit App-Matches in den Spielniveau-Estimate einfließen.
      onMatchLogged?.({userWon});
      notify(userWon?"Match gespeichert — Sieg!":"Match gespeichert");
    } else if(!win){
      loggedWinRef.current=null;
    }
  },[win]);// eslint-disable-line

  // ── Serving team + side (Padel rules) ──
  // Total completed games across all sets (excludes current in-progress game)
  const totalCompletedGames = gA + gB + sets.reduce((acc,s)=>acc+(s.gA||0)+(s.gB||0),0);
  // Team A always starts the match; alternates each game
  const baseServer = totalCompletedGames % 2 === 0 ? 'A' : 'B';
  // Tiebreak: server changes after 1st point, then every 2 points
  let servingTeam = baseServer;
  if(tb){
    const tp = tA + tB;
    if(tp >= 1){
      const pair = Math.floor((tp - 1) / 2);
      // odd pair-index → original server back; even pair → opponent
      servingTeam = pair % 2 === 0
        ? (baseServer === 'A' ? 'B' : 'A')
        : baseServer;
    }
  }
  // Side (deuce/ad) alternates each point.
  const pointsInCurrent = tb ? (tA + tB) : (pA + pB);
  const isDeuce = pointsInCurrent % 2 === 0;

  // ═══ BIG SCREEN HORIZONTAL ═══
  const HintToast=()=>hint?(
    <div style={{position:'fixed',bottom:'calc(env(safe-area-inset-bottom,0px) + 100px)',
      left:'50%',transform:'translateX(-50%)',
      background:T.card,border:`1px solid ${T.o}`,color:T.o,padding:'10px 18px',
      borderRadius:24,fontSize:13,fontWeight:700,zIndex:100,
      animation:'fadeIn .15s ease',pointerEvents:'none',
      boxShadow:'0 4px 20px rgba(0,0,0,.6)',
      whiteSpace:'nowrap'}}>
      {hint}
    </div>
  ):null;

  if(bigScreen){
    const totalSecs=timerMin*60;
    const progress=totalSecs?secsLeft/totalSecs:0;
    const fmtT=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
    // Zoom-Level Multiplier — 0.5/1/1.5/2 skaliert alle clamp()-Werte.
    const m=zoomLevel;
    // vh-Helper: dämpft die vh-Komponente der Clamps mit einer
    // Obergrenze, damit Score + Margin + Dots-Row bei m=2 zusammen
    // nicht über 100vh hinausgehen (vertikales Budget: ~85vh nach
    // Top-Header). Bei m≤1.5 wirkt der Cap nicht; bei m=2 schon.
    const vh=(base,cap)=>Math.min(base*m,cap);
    // vw-Helper analog für die horizontale Achse: kappt die vw-
    // Komponente des Score-fontSize-clamp, damit zweistellige Werte
    // (z. B. "40") auf schmalen Geräten nicht über die Hälfte der
    // Screen-Breite hinausragen. Jede Score-Spalte hat ~50vw minus
    // Padding zur Verfügung; mit letterSpacing:-12 passen ~38vw als
    // Schrift-Höhe (Glyphen-Breite ≈ 0.55 × Höhe).
    const vwCap=(base,cap)=>Math.min(base*m,cap);
    // Horizontal-Padding der Score-Buttons: bei höherem Zoom etwas
    // schmaler, damit die großen Zahlen mehr Platz haben und nicht
    // seitlich an Geschwister-Spalten anstoßen.
    const sidePad=Math.max(10,Math.round(28/Math.max(1,m)));
    return(
      <div style={{height:'100dvh',width:'100vw',background:T.bgGrad,
        display:'flex',flexDirection:'column',animation:'fadeIn .2s ease',position:'relative'}}>

        {/* Progress bar (Americano with active timer) */}
        {!isB&&hasStarted&&(
          <div style={{height:5,background:T.card2,position:'relative',overflow:'hidden'}}>
            <div style={{height:'100%',background:timerFinished?T.r:T.o,
              width:`${progress*100}%`,transition:'width 1s linear'}}/>
          </div>
        )}

        {/* Top: Team labels + close + countdown */}
        <div style={{display:'flex',padding:'18px 24px 0',gap:14,alignItems:'center'}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.o,fontSize:20,fontWeight:800,letterSpacing:.3,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {cfg.nameA}
            </div>
          </div>
          {!isB&&hasStarted&&(
            <div style={{fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',fontSize:20,fontWeight:800,
              color:timerFinished?T.r:T.t1,letterSpacing:1,flexShrink:0}}>
              {fmtT(secsLeft)}
            </div>
          )}
          <div style={{flex:1,minWidth:0,
            textAlign:!isB&&hasStarted?'right':'left'}}>
            <div style={{color:T.o,fontSize:20,fontWeight:800,letterSpacing:.3,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {cfg.nameB}
            </div>
          </div>
        </div>

        {/* Scores */}
        <div style={{flex:1,display:'flex',padding:'0 24px',minHeight:0,overflow:'hidden'}}>
          {['A','B'].map((team,ti)=>{
            const isA=team==='A';
            const fl=isA?flA:flB;
            const big=isB?(isA?dA:dB):(isA?am.pA:am.pB);
            const setsCount=isA?sA:sB;
            const gamesCount=isA?gA:gB;
            // Detect Vorteil/Einstand/—  states (Bo3 only, regular points are short strings/numbers)
            const isAdv = isB && big==='Vorteil';
            const isDeuce = isB && (big==='Einstand'||big==='Golden Point');
            const isDash = isB && big==='—';
            const isSpecial = isAdv || isDeuce || isDash;
            return(
              <Fragment key={team}>
              <button onClick={()=>punkt(team)}
                style={{flex:1,minWidth:0,overflow:'hidden',
                  display:'flex',flexDirection:'column',justifyContent:'center',
                  background:fl?'var(--oFlash)':'transparent',
                  border:'none',cursor:win?'default':'pointer',padding:`0 ${sidePad}px`,
                  transition:'background .3s',textAlign:'left'}}>
                {isSpecial ? (
                  <>
                    {/* Tennis ball indicator */}
                    <div style={{
                      width:`clamp(${7*m}rem,${vh(19,26)}vh,${13*m}rem)`,
                      height:`clamp(${7*m}rem,${vh(19,26)}vh,${13*m}rem)`,
                      borderRadius:'50%',
                      background: isAdv ? T.o : T.t1,
                      boxShadow: isAdv
                        ? '0 0 36px var(--oGlow), inset 0 -12px 26px rgba(0,0,0,.18)'
                        : '0 0 28px rgba(255,255,255,.22), inset 0 -12px 26px rgba(0,0,0,.10)',
                      marginBottom:`clamp(${1*m}rem,${vh(2.8,4)}vh,${1.8*m}rem)`
                    }}/>
                    {/* Label below */}
                    <div style={{
                      color:T.t1,
                      fontSize:`clamp(${2.4*m}rem,${vh(8,12)}vh,${4.5*m}rem)`,
                      fontWeight:800,letterSpacing:-1,lineHeight:1,
                      whiteSpace:'nowrap'}}>
                      {big}
                    </div>
                  </>
                ) : (
                  <div style={{
                    // clamp(MIN, PREFERRED, MAX). Bei m=1.5 / m=2 darf
                    // die PREFERRED nicht stur an vh hängen, sonst werden
                    // zweistellige Scores breiter als die halbe Screen-
                    // Breite und kollidieren mit dem overflow:hidden des
                    // Buttons (→ Ziffern abgeschnitten).
                    //   - MIN gesenkt auf ${4*m}rem (sonst forciert clamp
                    //     einen Wert, den der Container nie tragen kann)
                    //   - PREFERRED = min(vh, vw) → das Geringere gewinnt,
                    //     unabhängig ob das Gerät hoch oder breit ist
                    //   - vw-Cap 38vw entspricht ~38% der Screen-Breite,
                    //     was bei zweistelligen Werten mit letterSpacing
                    //     -12 sauber in eine 50%-Spalte passt
                    fontSize:`clamp(${4*m}rem, min(${vh(36,52)}vh, ${vwCap(22,38)}vw), ${22*m}rem)`,
                    fontWeight:900,color:T.t1,lineHeight:.95,letterSpacing:-12,
                    whiteSpace:'nowrap'}}>
                    {big}
                  </div>
                )}
                {/* Games + Set traffic-light dots — im BigScreen mit
                    eigenständigen Dots (pro Satz), im Tablet-Modus
                    werden zusätzlich die Games-Zahlen ausgegeben. */}
                {isB&&(<>
                  {/* Horizontale Trennlinie unter dem Score */}
                  <div aria-hidden="true" style={{alignSelf:'stretch',height:2,
                    background:T.border,borderRadius:1,
                    marginTop:`clamp(${1.4*m}rem,${vh(3.5,5)}vh,${2.4*m}rem)`}}/>
                  <div style={{display:'flex',alignItems:'center',gap:`clamp(${1.5*m}rem,${vh(4,5)}vw,${3*m}rem)`,
                    marginTop:`clamp(${.9*m}rem,${vh(2.4,3.4)}vh,${1.6*m}rem)`}}>
                    <div style={{display:'flex',gap:`clamp(${.7*m}rem,${vh(1.5,2.2)}vw,${1.2*m}rem)`}}>
                      {[0,1,2].map(i=>{
                        const setRec=bo3.sets&&bo3.sets[i];
                        const played=!!setRec;
                        const won=played&&setRec.w===team;
                        const games=played?(team==='A'?setRec.gA:setRec.gB):null;
                        const dotSize=`clamp(${1.4*m}rem,${vh(3.5,5)}vh,${2.5*m}rem)`;
                        return(
                          <div key={i} style={{
                            width:dotSize,height:dotSize,borderRadius:'50%',
                            background:played?(won?T.o:T.card2):'transparent',
                            border:`2.5px solid ${played?(won?T.o:T.border):T.o}`,
                            boxSizing:'border-box',
                            boxShadow:won?'0 0 14px var(--oGlow)':'none',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            color:played?(won?'#000':T.t2):'transparent',
                            fontSize:`clamp(${.8*m}rem,${vh(1.6,2.4)}vh,${1.4*m}rem)`,
                            fontWeight:900,lineHeight:1,
                          }}>
                            {played&&tabletMode?games:''}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{color:T.o,fontSize:`clamp(${3.5*m}rem,${vh(12,18)}vh,${8*m}rem)`,
                      fontWeight:900,letterSpacing:-3,lineHeight:1}}>
                      {gamesCount}
                    </div>
                  </div>
                </>)}
              </button>
              {ti===0&&theme==='wimbledon'&&!isB&&(
                <div style={{flex:'0 0 auto',display:'flex',alignItems:'center',
                  justifyContent:'center',padding:'0 12px',minWidth:0}}>
                  <WimbledonDial minutes={timerMin} secsLeft={secsLeft}
                    running={running} finished={timerFinished}
                    hasStarted={hasStarted}
                    interactive={true}
                    onToggle={()=>{
                      if(!hasStarted) startTimer();
                      else if(running) pauseTimer();
                      else startTimer();
                    }}
                    onSetMinutes={(m)=>setTimerMin(m)}
                    svgStyle={{height:'72vh',maxHeight:'72vh',width:'auto',maxWidth:'40vw'}}/>
                </div>
              )}
              {/* Vertikale Trennlinie zwischen Team A und Team B —
                  als Flex-Kind exakt an der Spaltengrenze (außer im
                  Wimbledon-Americano-Dial-Layout). */}
              {ti===0&&!(theme==='wimbledon'&&!isB)&&(
                <div aria-hidden="true" style={{flexShrink:0,alignSelf:'stretch',
                  width:2,marginTop:'3vh',marginBottom:'3vh',background:T.border,borderRadius:1}}/>
              )}
              </Fragment>
            );
          })}
          {isB&&(
            <div style={{flexShrink:0,display:'flex',alignItems:'flex-start',
              padding:'2vh 4px 0 12px'}}>
              {/* Service-Indikator: vw-Anteil gedämpft, damit er die Score-
                  Spalten bei m=2 nicht verdrängt. min() mit Cap auf 18vw. */}
              <div style={{width:`min(${Math.min(12*m,18)}vw,${130*m}px)`,aspectRatio:'2/3'}}>
                <ServiceIndicator servingTeam={servingTeam} isDeuce={isDeuce}/>
              </div>
            </div>
          )}
        </div>

        {/* Padelhaus-Sponsor-Banner — nur im Padelhaus-Blue-Theme.
            Sitzt am unteren Rand wie ein Court-Werbebanner, full-width.
            Die Bottom-Buttons (Home / Reset / Zoom / Exit) sind 42 px
            hoch und 18 px vom Rand — schweben damit visuell über dem
            Banner an den Ecken, wie Schiedsrichter, die am LED-Strip
            vorbeilaufen. pointer-events:none, damit es nichts blockt. */}
        {theme==='padel'&&(
          <div aria-hidden="true"
            style={{position:'absolute',left:0,right:0,bottom:0,height:44,
              background:T.o,color:'#000018',
              display:'flex',alignItems:'center',justifyContent:'center',
              gap:14,
              borderTop:'2px solid #000018',
              borderBottom:'2px solid #000018',
              boxShadow:'0 -6px 24px rgba(0,0,0,0.35)',
              fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",sans-serif',
              letterSpacing:0.4,
              pointerEvents:'none',
              zIndex:0,
              overflow:'hidden'}}>
            {/* LED-Punkte links — kleines Detail, das den Stadion-Look
                trägt ohne abzulenken. */}
            <div style={{display:'flex',gap:5,opacity:0.55}}>
              <span style={{width:6,height:6,background:'#000018',borderRadius:'50%'}}/>
              <span style={{width:6,height:6,background:'#000018',borderRadius:'50%'}}/>
              <span style={{width:6,height:6,background:'#000018',borderRadius:'50%'}}/>
            </div>

            {/* RITMO Wordmark — bewusst inline-stilisiert (statt der
                normalen RitmoWordmark-PNG), damit das italic-Bold sicher
                über dem gelben Strip in tiefem Padelhaus-Blau sitzt. */}
            <span style={{fontWeight:900,fontStyle:'italic',fontSize:22,
              letterSpacing:1.5,lineHeight:1}}>RITMO</span>

            {/* Cross-Symbol — normale Schrift, etwas kleiner. */}
            <span style={{fontWeight:500,fontSize:18,opacity:0.65,lineHeight:1}}>×</span>

            {/* "Padel Haus" — explizit normale Schriftweite gemäß Wunsch. */}
            <span style={{fontWeight:400,fontSize:18,letterSpacing:1.2,lineHeight:1}}>
              Padel&nbsp;Haus
            </span>

            <div style={{display:'flex',gap:5,opacity:0.55}}>
              <span style={{width:6,height:6,background:'#000018',borderRadius:'50%'}}/>
              <span style={{width:6,height:6,background:'#000018',borderRadius:'50%'}}/>
              <span style={{width:6,height:6,background:'#000018',borderRadius:'50%'}}/>
            </div>
          </div>
        )}

        {/* Home bottom-left.
            Im Padelhaus-Theme rutschen die Bottom-Controls 40 px nach
            oben, damit sie über dem 44 px Werbebanner schweben statt
            ihn anzufressen. */}
        <div style={{position:'absolute',bottom:theme==='padel'?58:18,left:18}}>
          <button onClick={onHome}
            style={{width:42,height:42,borderRadius:'50%',
              background:T.card,border:`1px solid ${T.border}`,
              cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 4px 20px rgba(0,0,0,.6)'}}>
            <HomeIcon size={18}/>
          </button>
        </div>

        {/* Reset + Max + Exit Big Screen bottom-right */}
        <div style={{position:'absolute',bottom:theme==='padel'?58:18,right:18,display:'flex',gap:10}}>
          <button onClick={()=>setConfReset(true)}
            style={{width:42,height:42,borderRadius:'50%',
              background:'rgba(232,69,69,0.12)',border:`1px solid rgba(232,69,69,0.5)`,
              cursor:'pointer',color:T.r,fontSize:20,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 4px 20px rgba(0,0,0,.6)'}}>
            ↺
          </button>
          <button onClick={cycleZoom}
            title="Zoom (1× · 1.5× · 2× · 0.5×)"
            style={{minWidth:52,height:42,borderRadius:21,padding:'0 14px',
              background:zoomLevel===1?T.card:T.o,
              border:`1px solid ${zoomLevel===1?T.border:T.o}`,
              cursor:'pointer',color:zoomLevel===1?T.t1:'#000',
              fontSize:13,fontWeight:900,letterSpacing:.5,
              display:'flex',alignItems:'center',justifyContent:'center',gap:3,
              boxShadow:'0 4px 20px rgba(0,0,0,.6)'}}>
            <span>{zoomLevel===0.5?'0.5':zoomLevel===1.5?'1.5':zoomLevel}</span>
            <span style={{fontSize:11,opacity:.85}}>×</span>
          </button>
          <button onClick={()=>setBigScreen(false)}
            style={{width:42,height:42,borderRadius:'50%',
              background:T.card,border:`1px solid ${T.border}`,
              cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 4px 20px rgba(0,0,0,.6)'}}>
            <ExitFullscreenIcon size={18}/>
          </button>
        </div>

        {confReset&&<ResetModal onCancel={()=>setConfReset(false)} onConfirm={()=>{reset();setConfReset(false);}}/>}
        <HintToast/>
      </div>
    );
  }

  // ═══ NORMAL VERTICAL ═══
  // Tablet-Modus: Content wird auf maxWidth ~720px zentriert, alle
  // Größen werden um Faktor `tm` skaliert. Phone-Modus rendert wie
  // gewohnt (tm=1).
  const contentMaxWidth=tabletMode?720:'100%';
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:`0 ${Math.round(9*tm)}px ${Math.round(22*tm)}px`,
        maxWidth:contentMaxWidth,width:'100%',margin:'0 auto',boxSizing:'border-box'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <RitmoWordmark size={Math.round(52*tm)} style={{marginLeft:-3}}/>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {isB
              ?<BestOfThreeIcon size={Math.round(33*tm)}/>
              :<RacketMini size={Math.round(31*tm)}/>}
          </div>
        </div>
        <div style={{color:T.t1,fontSize:Math.round(40*tm),marginTop:4,marginLeft:10,fontWeight:900}}>
          {isB?'Best of Three':'Americano (Freestyle)'}
        </div>
      </div>

      <div style={{flex:1,padding:`0 ${Math.round(22*tm)}px`,display:'flex',flexDirection:'column',
        gap:Math.round(14*tm),overflowY:'auto',
        maxWidth:contentMaxWidth,width:'100%',margin:'0 auto',boxSizing:'border-box'}}>

        {['A','B'].map(team=>{
          const isA=team==='A';
          const fl=isA?flA:flB;
          const isW=win===team;
          const nm=isA?cfg.nameA:cfg.nameB;
          const big=isB?(isA?dA:dB):(isA?am.pA:am.pB);
          const setsCount=isA?sA:sB;
          const gamesCount=isA?gA:gB;
          const isAdv = isB && big==='Vorteil';
          const isDeuce = isB && (big==='Einstand'||big==='Golden Point');
          const isDash = isB && big==='—';
          const isSpecial = isAdv || isDeuce || isDash;
          return(
            <button key={team} onClick={()=>punkt(team)} className={fl?'flash':''}
              style={{background:T.card,border:`1px solid ${isW?T.o:T.border}`,
                borderRadius:Math.round(14*tm),
                padding:`${Math.round(18*tm)}px ${Math.round(22*tm)}px`,
                display:'flex',alignItems:'center',
                cursor:win?'default':'pointer',color:T.t1,textAlign:'left',
                transition:'border-color .25s',minHeight:Math.round(120*tm)}}>

              <div style={{flex:1,display:'flex',flexDirection:'column',gap:Math.round(14*tm),minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:Math.round(9*tm),minWidth:0}}>
                  <div style={{width:Math.round(12*tm),height:Math.round(12*tm),borderRadius:'50%',
                    background:isA?T.o:T.blue,flexShrink:0,
                    boxShadow:`0 0 8px ${isA?T.oGlow:T.blueGlow}`}}/>
                  <div style={{color:T.t1,fontSize:Math.round(24*tm),fontWeight:800,letterSpacing:-.3,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nm}</div>
                </div>
                {isB&&(
                  <div style={{display:'flex',alignItems:'center',gap:Math.round(12*tm)}}>
                    <div style={{display:'flex',gap:Math.round(6*tm),alignItems:'center'}}>
                      {/* Pro Satz ein Marker: gefüllter Kreis mit der
                          Games-Anzahl für DIESES Team in jenem Satz.
                          Farbe: orange = Satz gewonnen, gedämpft grau =
                          verloren, leerer outline-Kreis = noch nicht
                          gespielt. So sieht man den Satz-Verlauf auf
                          einen Blick (z. B. 6–2, 3–6, im 3. Satz). */}
                      {[0,1,2].map(i=>{
                        const setRec=bo3.sets&&bo3.sets[i];
                        const played=!!setRec;
                        const won=played&&setRec.w===team;
                        const games=played?(team==='A'?setRec.gA:setRec.gB):null;
                        const dotSize=Math.round(20*tm);
                        return(
                          <div key={i} style={{
                            width:dotSize,height:dotSize,borderRadius:'50%',
                            background:played?(won?T.o:T.card2):'transparent',
                            border:`1.5px solid ${played?(won?T.o:T.border):T.o}`,
                            boxSizing:'border-box',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            color:played?(won?'#000':T.t2):'transparent',
                            fontSize:Math.round(11*tm),fontWeight:900,lineHeight:1,
                          }}>
                            {played?games:''}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{color:T.o,fontSize:Math.round(32*tm),fontWeight:900,
                      letterSpacing:-1,lineHeight:1}}>
                      {gamesCount}
                    </div>
                  </div>
                )}
                {!isB&&(
                  <div style={{color:T.o,fontSize:Math.round(14*tm),fontWeight:600}}>
                    {(cfg.amLimit??21)>0?`${big} / ${cfg.amLimit??21}`:'∞'}
                  </div>
                )}
              </div>

              {isSpecial ? (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',
                  flexShrink:0,gap:Math.round(6*tm),maxWidth:'55%'}}>
                  <div style={{
                    width:Math.round(48*tm),height:Math.round(48*tm),borderRadius:'50%',
                    background:isAdv?T.o:T.t1,
                    boxShadow:isAdv
                      ?'0 0 14px var(--oGlow), inset 0 -4px 10px rgba(0,0,0,.18)'
                      :'0 0 10px rgba(255,255,255,.18), inset 0 -4px 10px rgba(0,0,0,.10)'
                  }}/>
                  <div style={{color:T.t1,fontSize:Math.round(18*tm),fontWeight:800,letterSpacing:-.3,
                    whiteSpace:'nowrap',lineHeight:1}}>
                    {big}
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize:Math.round(96*tm),fontWeight:900,color:T.t1,
                  lineHeight:.85,letterSpacing:-5,
                  textAlign:'right',whiteSpace:'nowrap',
                  flexShrink:0,maxWidth:'55%'}}>
                  {big}
                </div>
              )}
            </button>
          );
        })}

        {/* Punkte-Verlauf */}
        {(() => {
          const hist=isB?bo3.hist:am.hist;
          if(!hist||hist.length===0) return null;
          const recent=hist.slice(-18);
          return(
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:15,
              padding:'10px 14px',display:'flex',alignItems:'center',gap:10,
              overflowX:'auto'}}>
              <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1,
                textTransform:'uppercase',flexShrink:0}}>Verlauf</div>
              <div style={{display:'flex',gap:4,flex:1,justifyContent:'flex-end'}}>
                {recent.map((entry,i)=>(
                  <div key={i} title={entry._t==='A'?cfg.nameA:cfg.nameB}
                    style={{
                      width:14,height:14,borderRadius:4,
                      background:entry._t==='A'?T.o:T.blue,
                      flexShrink:0,
                      opacity:0.4+0.6*((i+1)/recent.length),
                    }}/>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Anzeigetafel verbinden — öffnet ein Sheet mit AirPlay / Cast /
            Miracast-Anleitung, weil Browser keinen direkten Mirror-API-
            Aufruf erlauben. Die Card bleibt zwischen Verlauf und Timer
            sichtbar; tap → CastSheet. */}
        <button onClick={()=>setCastSheet(true)}
          style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:15,
            padding:'14px 16px',display:'flex',alignItems:'center',gap:12,
            color:T.t1,textAlign:'left',cursor:'pointer',
            transition:'background .15s'}}
          onPointerDown={e=>e.currentTarget.style.background=T.card2}
          onPointerUp={e=>e.currentTarget.style.background=T.card}
          onPointerLeave={e=>e.currentTarget.style.background=T.card}>
          <div style={{flexShrink:0,width:38,height:38,borderRadius:13,
            background:T.card2,border:`1px solid ${T.border}`,color:T.o,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <AirPlayIcon size={20} color="currentColor"/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:16,fontWeight:700,letterSpacing:-.1,marginBottom:2}}>
              Anzeigetafel verbinden
            </div>
            <div style={{color:T.t3,fontSize:11,fontWeight:500,lineHeight:1.55}}>
              Score per AirPlay · Cast · Miracast auf einen großen Bildschirm spiegeln.
            </div>
          </div>
          <ChevronRightIcon size={18} color={T.t3}/>
        </button>

        {/* Timer (Americano only) */}
        {!isB&&(
          <TimerCard
            minutes={timerMin} setMinutes={setTimerMin}
            running={running} secsLeft={secsLeft} finished={timerFinished}
            hasStarted={hasStarted} theme={theme}
            onStart={startTimer} onPause={pauseTimer} onReset={resetTimer}/>
        )}

        {win&&win!=='draw'&&(
          <div style={{textAlign:'center',padding:14,background:T.oSoft,borderRadius:15,
            border:`1px solid ${T.o}`,color:T.o,fontWeight:700}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:8}}><TrophyIcon size={20}/>{win==='A'?cfg.nameA:cfg.nameB} gewinnt!</span>
          </div>
        )}
        <div style={{height:100,flexShrink:0}}/>
      </div>

      <MatchBar
        onHome={onHome}
        rightButtons={[
          {icon:<span style={{color:T.r,fontSize:20,lineHeight:1}}>↺</span>,
           onClick:()=>setConfReset(true),
           style:{background:'rgba(232,69,69,0.12)',
                  border:`1px solid rgba(232,69,69,0.45)`}},
          {icon:<FullscreenIcon size={18}/>,
           onClick:()=>setBigScreen(true)},
        ]}/>

      {confReset&&<ResetModal onCancel={()=>setConfReset(false)} onConfirm={()=>{reset();setConfReset(false);}}/>}
      {castSheet&&<CastSheet onClose={()=>setCastSheet(false)} onEnterBigScreen={()=>{setCastSheet(false);setBigScreen(true);}}/>}
      <HintToast/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAST SHEET — "Anzeigetafel verbinden"

   Browser können nicht programmatisch eine OS-weite Bildschirm-
   spiegelung auslösen — AirPlay (iOS/macOS), Cast (Android/Chrome)
   und Miracast (Windows) sind System-Features. Unser Sheet:

     1. Geräte-Carousel: vier Plattform-Kacheln (iPhone, Mac, Android,
        Windows), nach links/rechts swipebar via scroll-snap. Initial-
        Auswahl folgt der userAgent-Erkennung, lässt sich aber frei
        wechseln (z. B. wenn der User vom Phone aus für einen Mac
        nachschlagen will).
     2. Pro-Tip + BigScreen-Direktaktion.
     3. Best-Effort Cast via Presentation API (BETA, Chrome/Edge).
     4. Schritte für das gewählte Gerät — mit Inline-Icons der System-
        Symbole, die der User tappen muss.
     5. Konstanter Receiver-Name: "Court 1" bzw.
        "RITMO Score Tafel | Court 1" wird in jeder Anleitung
        prominent genannt.
═══════════════════════════════════════════════════════════════ */

/* Inline-Glyphs für die Schritt-Anleitungen — kleine SVGs, die genau
   wie die System-Icons aussehen, die der User tappen muss.
   Bewusst hier lokal definiert (statt in icons.jsx), weil sie nur im
   CastSheet benutzt werden und keinen separaten Export rechtfertigen. */

// iOS-Kontrollzentrum: zwei sich überlappende abgerundete Rechtecke
// (so wie Apple es im Status-Bar zeigt).
function GlyphControlCenter({size=16}){
  return(<svg width={size} height={size} viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    style={{verticalAlign:'-3px'}}>
    <rect x="2" y="2" width="9" height="9" rx="2"/>
    <rect x="7" y="7" width="9" height="9" rx="2"/>
  </svg>);
}

// "Bildschirmsynchronisierung" / AirPlay-Mirror — zwei sich
// überlappende Rechtecke (Apples eigenes Symbol). Klar erkennbar.
function GlyphAirPlayMirror({size=16}){
  return(<svg width={size} height={size} viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    style={{verticalAlign:'-3px'}}>
    <rect x="1.5" y="3" width="11" height="9" rx="1.5"/>
    <rect x="5.5" y="6" width="11" height="9" rx="1.5" fill="var(--bg)"/>
  </svg>);
}

// Android-Cast — Bildschirmrahmen mit drei Wellen-Strahlen unten-links
// (Chromecast-Logo).
function GlyphAndroidCast({size=16}){
  return(<svg width={size} height={size} viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    style={{verticalAlign:'-3px'}}>
    <path d="M1 13a3 3 0 0 1 3 3"/>
    <path d="M1 10a6 6 0 0 1 6 6"/>
    <path d="M1 7a9 9 0 0 1 9 9"/>
    <path d="M1 4h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-4"/>
  </svg>);
}

// Windows-Logo (4 Kacheln) — für den "Windows-Taste + K"-Hinweis.
function GlyphWindowsKey({size=16}){
  return(<svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor"
    style={{verticalAlign:'-3px'}}>
    <rect x="2" y="2" width="6" height="6"/>
    <rect x="10" y="2" width="6" height="6"/>
    <rect x="2" y="10" width="6" height="6"/>
    <rect x="10" y="10" width="6" height="6"/>
  </svg>);
}

// Swipe-Down-Gesten-Glyph für Android-Schnelleinstellungen.
function GlyphSwipeDown({size=16}){
  return(<svg width={size} height={size} viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    style={{verticalAlign:'-3px'}}>
    <path d="M9 2v12"/>
    <polyline points="4 9 9 14 14 9"/>
  </svg>);
}

// Wiederverwendbarer „Token" für Inline-Icon-Refs in den Schritten
// (z. B. „Tippe auf [ICON]"). Rendert einen kleinen Pill-Container
// mit Outline.
function StepIcon({children}){
  return(
    <span style={{display:'inline-flex',alignItems:'center',
      padding:'1px 7px',margin:'0 2px',gap:5,
      borderRadius:6,background:'var(--card2)',
      border:`1px solid var(--border)`,color:'var(--t1)',
      fontSize:11,fontWeight:700,verticalAlign:'baseline'}}>
      {children}
    </span>
  );
}

const CAST_DEVICE_NAME='Court 1';
const CAST_DEVICE_FULL='RITMO Score Tafel | Court 1';

function CastSheet({onClose,onEnterBigScreen}){
  // Plattform-Erkennung — bewusst defensiv (userAgent kann gefälscht
  // sein). Wir setzen sie nur als Initial-Index des Carousels; der
  // User kann frei swipen.
  const ua=typeof navigator!=='undefined'?(navigator.userAgent||''):'';
  const isIOS=/iPad|iPhone|iPod/.test(ua)||(typeof navigator!=='undefined'&&navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const isMac=!isIOS&&/Macintosh/.test(ua);
  const isAndroid=/Android/i.test(ua);
  const isWin=/Windows/i.test(ua);

  // Devices — Reihenfolge ist die Carousel-Reihenfolge.
  const devices=[
    {id:'ios',     label:'iPhone / iPad', emoji:<PhoneIcon size={38} color={T.t1}/>, detected:isIOS},
    {id:'mac',     label:'Mac',           emoji:<LaptopIcon size={38} color={T.t1}/>, detected:isMac},
    {id:'android', label:'Android',       emoji:<PhoneIcon size={38} color={T.t1}/>, detected:isAndroid},
    {id:'windows', label:'Windows',       emoji:<MonitorIcon size={38} color={T.t1}/>, detected:isWin},
  ];
  const defaultIndex=Math.max(0,devices.findIndex(d=>d.detected));
  const[idx,setIdx]=useState(defaultIndex);
  const railRef=useRef(null);

  // Scroll-Snap → idx-Sync: wenn der User swiped, wird die nächste
  // Karte automatisch eingerastet, wir lesen die Position zurück und
  // aktualisieren idx (für Pagination-Dots + Schritte unten).
  const onRailScroll=()=>{
    const el=railRef.current;
    if(!el) return;
    const i=Math.round(el.scrollLeft/el.clientWidth);
    if(i!==idx) setIdx(Math.max(0,Math.min(devices.length-1,i)));
  };

  // Programmatic snap to a specific index (Pfeil-Buttons + Dot-Tap).
  const snapTo=(i)=>{
    const el=railRef.current;
    if(!el) return;
    el.scrollTo({left:i*el.clientWidth,behavior:'smooth'});
  };

  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState('');

  const tryPresentation=async()=>{
    if(busy) return;
    setErr('');
    setBusy(true);
    try{
      if(typeof window==='undefined'||!('PresentationRequest' in window)){
        setErr('Dein Browser unterstützt keinen direkten Bildschirm-Stream. Folge der Anleitung unten.');
        return;
      }
      const req=new window.PresentationRequest([window.location.href]);
      await req.start();
      setBusy(false);
      onClose();
    }catch(e){
      setErr(e?.message||'Kein Bildschirm gefunden. Folge der Anleitung unten.');
      setBusy(false);
    }
  };

  // Pro-Device-Schritte. Jeder Schritt-Eintrag ist React-Node-fähig,
  // damit wir Inline-Icons rendern können. Der Receiver-Name wird
  // konsistent als <strong>Court 1</strong> ausgegeben — der lange
  // Name folgt direkt als Klammer-Hinweis.
  const receiverName=(<strong style={{color:T.o,fontWeight:900}}>{CAST_DEVICE_NAME}</strong>);
  const receiverLongHint=(
    <span style={{color:T.t3,fontStyle:'italic'}}> (oder „{CAST_DEVICE_FULL}")</span>
  );

  const stepsByDevice={
    ios:[
      <>Wisch vom oberen rechten Eck nach unten → Kontrollzentrum
        <StepIcon><GlyphControlCenter size={14}/></StepIcon> öffnet sich.</>,
      <>Tippe auf „Bildschirmsynchronisierung"
        <StepIcon><GlyphAirPlayMirror size={14}/> Sync</StepIcon>.</>,
      <>Wähle {receiverName}{receiverLongHint} aus der Geräteliste.</>,
      <>Falls Code abgefragt: am TV-Bildschirm ablesen und am iPhone eingeben.</>,
    ],
    mac:[
      <>Klick auf das Kontrollzentrum-Symbol
        <StepIcon><GlyphControlCenter size={14}/></StepIcon>
        oben rechts in der Menüleiste.</>,
      <>Wähle „Bildschirmsynchronisierung"
        <StepIcon><GlyphAirPlayMirror size={14}/> Sync</StepIcon>.</>,
      <>Wähle {receiverName}{receiverLongHint} und bestätige den Code, falls Apple TV einen anzeigt.</>,
    ],
    android:[
      <>Schnelleinstellungen aufziehen
        <StepIcon><GlyphSwipeDown size={14}/></StepIcon>
        (zweimal vom oberen Rand nach unten wischen).</>,
      <>Tippe auf „Streamen" / „Smart View" / „Cast"
        <StepIcon><GlyphAndroidCast size={14}/> Cast</StepIcon>.</>,
      <>Wähle {receiverName}{receiverLongHint} aus der Empfänger-Liste.</>,
      <>Bestätige am TV, falls eine Pairing-Aufforderung erscheint.</>,
    ],
    windows:[
      <>Drücke
        <StepIcon><GlyphWindowsKey size={13}/> Win</StepIcon> +
        <StepIcon>K</StepIcon> — das Casten-Panel öffnet sich.</>,
      <>Wähle {receiverName}{receiverLongHint} aus der Liste.</>,
      <>Falls dein TV nicht erscheint: PC + TV im selben WLAN, Miracast-Empfänger am TV aktivieren.</>,
    ],
  };

  const currentDevice=devices[idx];
  const currentSteps=stepsByDevice[currentDevice.id];

  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:220,
      background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',
      display:'flex',alignItems:'flex-end',justifyContent:'center',
      animation:'fadeIn .15s ease'}}>
      <div onClick={e=>e.stopPropagation()} className="si"
        style={{background:T.bg,border:`1px solid ${T.border}`,
          borderTopLeftRadius:20,borderTopRightRadius:20,
          width:'100%',maxWidth:520,maxHeight:'92vh',overflowY:'auto',
          padding:'20px 22px calc(env(safe-area-inset-bottom,0px) + 22px)',
          boxShadow:'0 -8px 30px rgba(0,0,0,.5)'}}>

        {/* Drag handle */}
        <div style={{width:38,height:4,borderRadius:2,background:T.border,
          margin:'0 auto 14px'}}/>

        {/* Hero */}
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
          <div style={{width:48,height:48,borderRadius:15,background:T.card,
            border:`1px solid ${T.border}`,color:T.o,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <AirPlayIcon size={26} color="currentColor"/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:18,fontWeight:800,letterSpacing:-.2}}>
              Anzeigetafel verbinden
            </div>
            <div style={{color:T.t3,fontSize:12,marginTop:2,lineHeight:1.5}}>
              Spiegel den Score auf TV, Beamer oder zweiten Monitor.
            </div>
          </div>
        </div>

        {/* Einleitung mit Icon-Token-Vorschau — der User sieht direkt,
            welche System-Symbole gleich in der Anleitung erscheinen. */}
        <div style={{color:T.t2,fontSize:12,lineHeight:1.65,marginBottom:14,padding:'0 2px'}}>
          Wähle dein Gerät, dann folge den drei Schritten. Such in der
          Empfänger-Liste deines Geräts nach&nbsp;{receiverName}{receiverLongHint}.
          <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
            <span style={{color:T.t3,fontSize:11}}>Du tippst auf:</span>
            <StepIcon><GlyphControlCenter size={13}/> iOS/Mac</StepIcon>
            <StepIcon><GlyphAirPlayMirror size={13}/> Sync</StepIcon>
            <StepIcon><GlyphAndroidCast size={13}/> Cast</StepIcon>
            <StepIcon><GlyphWindowsKey size={12}/> Win+K</StepIcon>
          </div>
        </div>

        {/* Pro-Tip: BigScreen zuerst */}
        <div style={{background:T.oSoft,border:`1px solid ${T.o}`,borderRadius:15,
          padding:'14px 16px',marginBottom:16,display:'flex',alignItems:'flex-start',gap:10}}>
          <span style={{color:T.o,fontSize:16,lineHeight:1.5,flexShrink:0}}>★</span>
          <div style={{color:T.t1,fontSize:12,lineHeight:1.55,flex:1}}>
            <strong style={{color:T.o,fontWeight:800}}>Tipp:</strong> Erst
            BigScreen einschalten, dann spiegeln — so erscheint sofort die
            XXL-Score-Optik auf der Tafel.
            <div style={{marginTop:8}}>
              <button onClick={onEnterBigScreen}
                style={{background:T.o,border:'none',borderRadius:8,
                  padding:'8px 12px',color:'#000',fontSize:11,fontWeight:800,
                  letterSpacing:.3,cursor:'pointer'}}>
                BigScreen einschalten →
              </button>
            </div>
          </div>
        </div>

        {/* Device-Carousel — swipeable rail mit scroll-snap.
            Jede Karte = 100% Breite des Containers, snap-mandatory
            rastet sauber ein. Pfeile + Pagination unten. */}
        <div style={{color:T.t3,fontSize:10,fontWeight:800,letterSpacing:1.5,
          textTransform:'uppercase',marginBottom:8,padding:'0 2px',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>Dein Gerät</span>
          <span style={{color:T.t3,fontSize:10,fontWeight:600,letterSpacing:.5}}>
            ‹ swipe ›
          </span>
        </div>

        <div style={{position:'relative',marginBottom:14}}>
          {/* Pfeil links */}
          <button onClick={()=>snapTo(Math.max(0,idx-1))}
            disabled={idx===0}
            aria-label="Vorheriges Gerät"
            style={{position:'absolute',top:'50%',left:-2,transform:'translateY(-50%)',
              zIndex:2,width:32,height:32,borderRadius:'50%',
              background:T.card,border:`1px solid ${T.border}`,
              color:idx===0?T.t3:T.t1,
              cursor:idx===0?'not-allowed':'pointer',opacity:idx===0?.4:1,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 2px 8px rgba(0,0,0,.4)'}}>
            <span style={{transform:'rotate(180deg)',lineHeight:0}}>
              <ChevronRightIcon size={16} color="currentColor"/>
            </span>
          </button>
          {/* Pfeil rechts */}
          <button onClick={()=>snapTo(Math.min(devices.length-1,idx+1))}
            disabled={idx===devices.length-1}
            aria-label="Nächstes Gerät"
            style={{position:'absolute',top:'50%',right:-2,transform:'translateY(-50%)',
              zIndex:2,width:32,height:32,borderRadius:'50%',
              background:T.card,border:`1px solid ${T.border}`,
              color:idx===devices.length-1?T.t3:T.t1,
              cursor:idx===devices.length-1?'not-allowed':'pointer',
              opacity:idx===devices.length-1?.4:1,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 2px 8px rgba(0,0,0,.4)'}}>
            <ChevronRightIcon size={16} color="currentColor"/>
          </button>

          <div ref={railRef} onScroll={onRailScroll}
            style={{display:'flex',overflowX:'auto',
              scrollSnapType:'x mandatory',
              WebkitOverflowScrolling:'touch',
              scrollbarWidth:'none',
              msOverflowStyle:'none'}}>
            {devices.map((d,i)=>(
              <div key={d.id}
                style={{flex:'0 0 100%',scrollSnapAlign:'center',
                  padding:'2px 40px',boxSizing:'border-box'}}>
                <div style={{background:i===idx?T.card2:T.card,
                  border:`1px solid ${i===idx?T.o:T.border}`,borderRadius:19,
                  padding:'22px 14px',display:'flex',flexDirection:'column',
                  alignItems:'center',gap:8,transition:'border-color .2s,background .2s'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:44}}>{d.emoji}</div>
                  <div style={{color:T.t1,fontSize:16,fontWeight:800,letterSpacing:-.1}}>
                    {d.label}
                  </div>
                  {d.detected&&(
                    <span style={{color:T.o,fontSize:9,fontWeight:900,letterSpacing:1.4,
                      textTransform:'uppercase',padding:'2px 7px',background:T.oSoft,
                      border:`1px solid ${T.o}`,borderRadius:6}}>
                      Dein Gerät
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination-Dots */}
          <div style={{display:'flex',justifyContent:'center',gap:7,marginTop:10}}>
            {devices.map((_,i)=>(
              <button key={i} onClick={()=>snapTo(i)}
                aria-label={`Gerät ${i+1}`}
                style={{width:i===idx?22:7,height:7,borderRadius:4,
                  background:i===idx?T.o:T.border,
                  border:'none',cursor:'pointer',padding:0,
                  transition:'width .2s,background .2s'}}/>
            ))}
          </div>
        </div>

        {/* Schritte fürs gewählte Gerät — animation:fadeIn via key,
            damit der Inhalt beim Wechseln „neu reinkommt". */}
        <div key={currentDevice.id} className="fi" style={{marginBottom:12}}>
          <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.4,
            textTransform:'uppercase',marginBottom:8,padding:'0 2px'}}>
            So verbindest du dein {currentDevice.label}
          </div>
          <ol style={{margin:0,paddingLeft:22,color:T.t2,fontSize:13,lineHeight:1.7}}>
            {currentSteps.map((step,i)=>(
              <li key={i} style={{marginBottom:6}}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Versuch: Presentation API */}
        <button onClick={tryPresentation} disabled={busy}
          style={{width:'100%',padding:'14px 16px',marginTop:6,marginBottom:6,
            background:busy?T.card2:T.card,
            border:`1px solid ${T.border}`,borderRadius:13,
            color:T.t1,fontSize:13,fontWeight:700,letterSpacing:.2,
            cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,
            textAlign:'left',
            display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
          <span>{busy?'Suche Geräte …':'Geräte im Netzwerk suchen'}</span>
          <span style={{color:T.o,fontSize:11,fontWeight:900,letterSpacing:1}}>BETA</span>
        </button>
        {err&&(
          <div style={{color:T.t3,fontSize:11,lineHeight:1.55,marginBottom:8,padding:'0 4px'}}>
            {err}
          </div>
        )}
        <div style={{color:T.t3,fontSize:10,lineHeight:1.6,marginBottom:14,padding:'0 4px'}}>
          Funktioniert auf Chrome / Edge im selben WLAN. iOS / macOS nutzen
          das System-Menü (siehe Anleitung oben).
        </div>

        <button onClick={onClose}
          style={{width:'100%',marginTop:6,padding:'12px',background:T.card2,
            border:`1px solid ${T.border}`,borderRadius:13,
            color:T.t2,fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Schließen
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESET MODAL
═══════════════════════════════════════════════════════════════ */
function ResetModal({onCancel,onConfirm,
  title='Zurücksetzen',
  description='Dadurch werden die Sätze und Punkte zurückgesetzt.',
  question='Spiel zurücksetzen?',
  confirmLabel='Ja',
  cancelLabel='Nein'}){
  return(
    <div onClick={onCancel} style={{position:'fixed',inset:0,zIndex:200,
      background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:24,
      animation:'fadeIn .15s ease'}}>
      <div onClick={e=>e.stopPropagation()} className="si"
        style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:23,
          padding:'22px 22px 20px',width:'100%',maxWidth:340}}>
        <div style={{color:T.t1,fontSize:18,fontWeight:800,marginBottom:6}}>{title}</div>
        <div style={{color:T.t2,fontSize:13,lineHeight:1.5,marginBottom:16}}>
          {description}
        </div>
        <div style={{background:T.card2,borderRadius:13,padding:'14px 16px',marginBottom:16,
          border:`1px solid ${T.border}`}}>
          <div style={{color:T.t1,fontSize:16,fontWeight:600}}>{question}</div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onCancel}
            style={{flex:1,padding:'12px',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:13,color:T.t1,fontSize:16,fontWeight:600,cursor:'pointer'}}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            style={{flex:1,padding:'12px',background:'rgba(232,69,69,0.18)',
              border:`1px solid ${T.r}`,borderRadius:13,color:T.r,
              fontSize:16,fontWeight:700,cursor:'pointer'}}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL PICKER (iPhone-Timer-Style)
═══════════════════════════════════════════════════════════════ */
function ScrollPicker({value,onChange,options,bgColor=T.card,width=86}){
  const ref=useRef(null);
  const ITEM_H=42;
  const HEIGHT=ITEM_H*5;
  const PAD=(HEIGHT-ITEM_H)/2;
  const initialized=useRef(false);
  const scrollTimeoutRef=useRef(null);

  // Position scroll on mount/value change (only externally)
  useEffect(()=>{
    if(!ref.current)return;
    const idx=options.indexOf(value);
    if(idx<0)return;
    const target=idx*ITEM_H;
    if(!initialized.current){
      ref.current.scrollTop=target;
      initialized.current=true;
    }
  },[value,options]);

  const handleScroll=(e)=>{
    if(scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current=setTimeout(()=>{
      const idx=Math.round(e.target.scrollTop/ITEM_H);
      const newVal=options[Math.max(0,Math.min(options.length-1,idx))];
      if(newVal!==value) onChange(newVal);
    },80);
  };

  // Schmaler Fade nur am oberen/unteren Rand — die innere Reihe
  // (direkt über/unter der Auswahl) bleibt komplett lesbar, nur die
  // äußerste fadet weich aus. `transparent` ist valides CSS und
  // funktioniert auch wenn bgColor eine CSS-Variable ist.
  const FADE_H=Math.round(ITEM_H*0.6);

  return(
    <div style={{position:'relative',height:HEIGHT,width,flexShrink:0}}>
      {/* Selection band */}
      <div style={{position:'absolute',top:PAD,left:0,right:0,height:ITEM_H,
        background:'var(--oSoft)',borderTop:`1px solid ${T.border}`,
        borderBottom:`1px solid ${T.border}`,pointerEvents:'none',borderRadius:8}}/>
      {/* Top fade — kürzer + sanfter, damit die Reihe direkt über
          der Auswahl klar lesbar bleibt. */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:FADE_H,
        background:`linear-gradient(${bgColor},transparent)`,
        pointerEvents:'none',zIndex:2}}/>
      {/* Bottom fade — symmetrisch */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:FADE_H,
        background:`linear-gradient(transparent,${bgColor})`,
        pointerEvents:'none',zIndex:2}}/>

      <div ref={ref} onScroll={handleScroll}
        style={{height:HEIGHT,overflowY:'scroll',
          scrollSnapType:'y mandatory',
          scrollPaddingTop:`${PAD}px`,
          WebkitOverflowScrolling:'touch'}}>
        <div style={{height:PAD}}/>
        {options.map(o=>{
          const active=o===value;
          return(
            <div key={o} style={{
              height:ITEM_H,
              display:'flex',alignItems:'center',justifyContent:'center',
              scrollSnapAlign:'start',
              fontSize:active?28:20,
              fontWeight:active?800:500,
              // Inaktive Zahlen heller (T.t2 statt T.t3) damit die
              // Reihen über/unter der Auswahl gut lesbar sind.
              color:active?T.t1:T.t2,
              transition:'color .15s,font-size .15s'}}>
              {o}
            </div>
          );
        })}
        <div style={{height:PAD}}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HORIZONTAL SCROLL PICKER

   Wie ScrollPicker, nur horizontal. Wird im Turnier-Setup für die
   Rundendauer verwendet — der User scrollt schnell durch Minuten
   1..60 und die mittlere Ziffer wird "vergrößert" (Lupen-Effekt).

   Layout: ITEMS_VISIBLE Items in einer Reihe (≈ 5–7), das mittlere
   Item ist die Auswahl. PAD links/rechts so groß, dass auch die
   ersten/letzten Werte ihre Mitte erreichen können.
═══════════════════════════════════════════════════════════════ */
function HorizontalScrollPicker({value,onChange,options,bgColor=T.card,
  itemW=56,visible=5,height=60,unit}){
  const ref=useRef(null);
  const TOTAL_W=itemW*visible;
  const PAD=(TOTAL_W-itemW)/2;
  const initialized=useRef(false);
  const scrollTimeoutRef=useRef(null);

  // Initial- und externe Wertänderungen: Scroll-Position auf das
  // value setzen. Nur einmal beim Mount, danach lassen wir den User
  // frei scrollen (sonst springen wir während des Snap-Vorgangs).
  useEffect(()=>{
    if(!ref.current) return;
    const idx=options.indexOf(value);
    if(idx<0) return;
    const target=idx*itemW;
    if(!initialized.current){
      ref.current.scrollLeft=target;
      initialized.current=true;
    }
  },[value,options,itemW]);

  const handleScroll=(e)=>{
    if(scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current=setTimeout(()=>{
      const idx=Math.round(e.target.scrollLeft/itemW);
      const newVal=options[Math.max(0,Math.min(options.length-1,idx))];
      if(newVal!==value) onChange(newVal);
    },80);
  };

  const FADE_W=Math.round(itemW*0.9);

  return(
    <div style={{position:'relative',width:TOTAL_W,height,flexShrink:0}}>
      {/* Selection band — die "Lupe" sitzt mittig und hebt das
          aktive Item visuell hervor. */}
      <div style={{position:'absolute',top:0,bottom:0,left:PAD,width:itemW,
        background:'var(--oSoft)',
        borderLeft:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,
        pointerEvents:'none',borderRadius:13}}/>

      {/* Linker Fade — kaschiert das Ende der Reihe, damit der User
          das Gefühl hat, durch eine Lupe zu schauen. */}
      <div style={{position:'absolute',top:0,bottom:0,left:0,width:FADE_W,
        background:`linear-gradient(to right, ${bgColor}, transparent)`,
        pointerEvents:'none',zIndex:2}}/>
      <div style={{position:'absolute',top:0,bottom:0,right:0,width:FADE_W,
        background:`linear-gradient(to left, ${bgColor}, transparent)`,
        pointerEvents:'none',zIndex:2}}/>

      <div ref={ref} onScroll={handleScroll}
        style={{width:TOTAL_W,height,overflowX:'scroll',overflowY:'hidden',
          scrollSnapType:'x mandatory',
          scrollPaddingLeft:`${PAD}px`,
          WebkitOverflowScrolling:'touch',
          display:'flex',alignItems:'center'}}>
        {/* Pad vor dem ersten Item, damit Wert 0 zentriert werden kann */}
        <div style={{width:PAD,height:'100%',flexShrink:0}}/>
        {options.map(o=>{
          const active=o===value;
          return(
            <div key={o} style={{
              width:itemW,height:'100%',flexShrink:0,
              display:'flex',alignItems:'center',justifyContent:'center',
              scrollSnapAlign:'start',
              fontSize:active?26:16,
              fontWeight:active?900:500,
              color:active?T.t1:T.t2,
              letterSpacing:active?-.5:0,
              transform:active?'scale(1.05)':'scale(1)',
              transformOrigin:'center',
              transition:'color .18s,font-size .18s,transform .18s,font-weight .18s'}}>
              {o}{active&&unit?<span style={{color:T.t3,fontSize:12,fontWeight:600,marginLeft:3}}>{unit}</span>:null}
            </div>
          );
        })}
        <div style={{width:PAD,height:'100%',flexShrink:0}}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TIMER CARD (Americano)
═══════════════════════════════════════════════════════════════ */
function WimbledonDial({minutes,secsLeft,running,finished,hasStarted,svgStyle,
  interactive=false,onToggle,onSetMinutes}){
  const totalSecs=minutes*60;
  const elapsed=totalSecs-secsLeft;
  const progress=totalSecs?elapsed/totalSecs:0;
  const fmtTime=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const mainHandAngle=progress*360;
  const secsInMin=secsLeft%60;
  const secsHandAngle=((60-secsInMin)%60)*6;

  const cx=120, cy=120;
  const rimR=118, dialR=111;
  const handR=78, secsHandR=92, arcR=80;
  const C=2*Math.PI*arcR;
  const hourMarks=[0,30,60,90,120,150,180,210,240,270,300,330];
  const minMarks=Array.from({length:60},(_,i)=>i*6).filter(d=>d%30!==0);

  // Crown drag state — accumulated rotation around dial center
  const dragRef=useRef({active:false,lastAngle:0,startMinutes:0,accumDeg:0,moved:false});

  const onCrownPointerDown=(e)=>{
    if(!interactive||hasStarted) return;
    e.stopPropagation();
    const rect=e.currentTarget.ownerSVGElement.getBoundingClientRect();
    const x=e.clientX-rect.left-(rect.width/2);
    const y=e.clientY-rect.top-(rect.height/2);
    const a=Math.atan2(y,x)*180/Math.PI;
    dragRef.current={active:true,lastAngle:a,startMinutes:minutes,accumDeg:0,moved:false};
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onCrownPointerMove=(e)=>{
    if(!dragRef.current.active) return;
    const rect=e.currentTarget.ownerSVGElement.getBoundingClientRect();
    const x=e.clientX-rect.left-(rect.width/2);
    const y=e.clientY-rect.top-(rect.height/2);
    const a=Math.atan2(y,x)*180/Math.PI;
    // shortest-path delta to handle wrap-around
    let da=a-dragRef.current.lastAngle;
    if(da>180) da-=360;
    if(da<-180) da+=360;
    dragRef.current.lastAngle=a;
    dragRef.current.accumDeg+=da;
    dragRef.current.moved=true;
    // 12° per minute (so a full revolution = 30 min — comfortable resolution)
    const deltaMin=Math.round(dragRef.current.accumDeg/12);
    const newMin=Math.max(1,Math.min(60,dragRef.current.startMinutes+deltaMin));
    if(newMin!==minutes&&onSetMinutes) onSetMinutes(newMin);
  };
  const onCrownPointerUp=(e)=>{
    dragRef.current.active=false;
    try{e.currentTarget.releasePointerCapture(e.pointerId);}catch{}
  };

  // Tap on dial (non-crown area) toggles start/pause
  const onDialTap=()=>{
    if(!interactive) return;
    if(dragRef.current.moved){dragRef.current.moved=false; return;}
    if(onToggle) onToggle();
  };

  // Crown position (3-o'clock side)
  const crownX=cx+rimR;
  const crownY=cy;

  return (
    <svg viewBox="0 0 264 240"
      onClick={onDialTap}
      style={{width:'100%',maxWidth:280,aspectRatio:'264/240',display:'block',
        filter:'drop-shadow(0 6px 20px rgba(0,0,0,.35))',
        cursor:interactive?'pointer':'default',...svgStyle}}>
      <defs>
        <radialGradient id="wimbRim" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="var(--o)" stopOpacity="1"/>
          <stop offset="100%" stopColor="var(--o)" stopOpacity="0.65"/>
        </radialGradient>
        <radialGradient id="wimbDial" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--card2)" stopOpacity="1"/>
          <stop offset="100%" stopColor="var(--bg)" stopOpacity="1"/>
        </radialGradient>
      </defs>

      {/* Crown (right side, like real watch). Touch target slightly larger. */}
      {interactive&&(
        <g style={{cursor:hasStarted?'default':'grab'}}>
          {/* Hit area */}
          <rect x={crownX-4} y={crownY-16} width="26" height="32" fill="transparent"
            onPointerDown={onCrownPointerDown}
            onPointerMove={onCrownPointerMove}
            onPointerUp={onCrownPointerUp}
            onPointerCancel={onCrownPointerUp}/>
          {/* Visible crown body */}
          <rect x={crownX-1} y={crownY-8} width="6" height="16" rx="1.5"
            fill="var(--o)" stroke="rgba(0,0,0,.25)" strokeWidth="0.5"/>
          <rect x={crownX+5} y={crownY-5} width="3" height="10" rx="1"
            fill="var(--o)" opacity="0.85"/>
          {/* Ridges */}
          {[-5,-2,1,4].map(o=>(
            <line key={o} x1={crownX} y1={crownY+o} x2={crownX+4} y2={crownY+o}
              stroke="rgba(0,0,0,.35)" strokeWidth="0.6"/>
          ))}
        </g>
      )}

      <circle cx={cx} cy={cy} r={rimR} fill="url(#wimbRim)"/>
      <circle cx={cx} cy={cy} r={dialR+2} fill="var(--bg)" opacity="0.6"/>
      <circle cx={cx} cy={cy} r={dialR} fill="url(#wimbDial)"/>
      <circle cx={cx} cy={cy} r={dialR-2} fill="none" stroke="var(--o)" strokeWidth="0.6" opacity="0.35"/>

      {hourMarks.map(deg=>{
        const rad=(deg-90)*Math.PI/180;
        const x1=cx+95*Math.cos(rad), y1=cy+95*Math.sin(rad);
        const x2=cx+105*Math.cos(rad), y2=cy+105*Math.sin(rad);
        return <line key={`h${deg}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="var(--o)" strokeWidth="2.4" strokeLinecap="round"/>;
      })}

      {minMarks.map(deg=>{
        const rad=(deg-90)*Math.PI/180;
        const x1=cx+100*Math.cos(rad), y1=cy+100*Math.sin(rad);
        const x2=cx+105*Math.cos(rad), y2=cy+105*Math.sin(rad);
        return <line key={`m${deg}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="var(--o)" strokeWidth="0.7" opacity="0.6"/>;
      })}

      <text x={cx} y={cy-78} textAnchor="middle" dominantBaseline="middle"
        fontSize="14" fontWeight="600" fill="var(--o)"
        fontFamily="'Times New Roman', Georgia, serif" letterSpacing="0.5">XII</text>
      <text x={cx+78} y={cy} textAnchor="middle" dominantBaseline="middle"
        fontSize="14" fontWeight="600" fill="var(--o)"
        fontFamily="'Times New Roman', Georgia, serif" letterSpacing="0.5">III</text>
      <text x={cx} y={cy+78} textAnchor="middle" dominantBaseline="middle"
        fontSize="14" fontWeight="600" fill="var(--o)"
        fontFamily="'Times New Roman', Georgia, serif" letterSpacing="0.5">VI</text>
      <text x={cx-78} y={cy} textAnchor="middle" dominantBaseline="middle"
        fontSize="14" fontWeight="600" fill="var(--o)"
        fontFamily="'Times New Roman', Georgia, serif" letterSpacing="0.5">IX</text>

      <text x={cx} y={cy-34} textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fontWeight="700" fill="var(--o)"
        letterSpacing="3.5" fontFamily="-apple-system, sans-serif">RITMO</text>
      <text x={cx} y={cy-22} textAnchor="middle" dominantBaseline="middle"
        fontSize="4.5" fontWeight="500" fill="var(--o)" opacity="0.7"
        letterSpacing="2.5" fontFamily="-apple-system, sans-serif">CHRONOMETER · AUTOMATIC</text>

      <text x={cx} y={cy+34} textAnchor="middle" dominantBaseline="middle"
        fontSize="22" fontWeight="700" fill="var(--t1)" letterSpacing="1.5"
        fontFamily="-apple-system, sans-serif">
        {hasStarted?fmtTime(secsLeft):`${String(minutes).padStart(2,'0')}:00`}
      </text>
      <text x={cx} y={cy+50} textAnchor="middle" dominantBaseline="middle"
        fontSize="5.5" fontWeight="600" fill="var(--t2)"
        letterSpacing="2.5" fontFamily="-apple-system, sans-serif">
        {interactive&&!hasStarted?'TIPPEN ZUM START':interactive&&running?'TIPPEN: PAUSE':interactive?'TIPPEN: WEITER':'MINUTEN'}
      </text>

      {hasStarted&&progress>0&&(
        <circle cx={cx} cy={cy} r={arcR}
          fill="none" stroke="var(--o)" strokeWidth="1.5" opacity="0.22"
          strokeDasharray={C} strokeDashoffset={C*(1-progress)}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{transition:'stroke-dashoffset 1s linear'}}/>
      )}

      {hasStarted&&(
        <g style={{
          transform:`rotate(${mainHandAngle}deg)`,
          transformOrigin:`${cx}px ${cy}px`,
          transition:'transform 1s linear',
          pointerEvents:'none'}}>
          <line x1={cx} y1={cy+12} x2={cx} y2={cy-handR}
            stroke="var(--o)" strokeWidth="3.2" strokeLinecap="round"/>
          <polygon
            points={`${cx-3.5},${cy-handR+5} ${cx+3.5},${cy-handR+5} ${cx},${cy-handR-3}`}
            fill="var(--o)"/>
        </g>
      )}

      {hasStarted&&running&&!finished&&(
        <g style={{
          transform:`rotate(${secsHandAngle}deg)`,
          transformOrigin:`${cx}px ${cy}px`,
          pointerEvents:'none'}}>
          <line x1={cx} y1={cy+15} x2={cx} y2={cy-secsHandR}
            stroke="var(--o)" strokeWidth="0.9" strokeLinecap="round" opacity="0.55"/>
          <circle cx={cx} cy={cy-secsHandR+4} r="1.6" fill="var(--o)" opacity="0.55"/>
        </g>
      )}

      <circle cx={cx} cy={cy} r="5.5" fill="var(--o)" style={{pointerEvents:'none'}}/>
      <circle cx={cx} cy={cy} r="1.8" fill="var(--bg)" style={{pointerEvents:'none'}}/>
    </svg>
  );
}

/* Timer-Steuerung: saubere SVG-Glyphen (statt Farb-Emojis ▶/⏸), die
   farblich zum orangen Timer-Knopf passen (color = Knopf-Vordergrund). */
function PlayGlyph({size=16,color=T.bg}){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.55.83l9.5-6.86a1 1 0 0 0 0-1.66l-9.5-6.86A1 1 0 0 0 8 5.14Z" fill={color}/>
    </svg>
  );
}
function PauseGlyph({size=16,color=T.bg}){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6.5" y="5" width="4" height="14" rx="1.6" fill={color}/>
      <rect x="13.5" y="5" width="4" height="14" rx="1.6" fill={color}/>
    </svg>
  );
}

function WimbledonTimerCard({minutes,setMinutes,running,secsLeft,finished,onStart,onPause,onReset,hasStarted}){
  const opts=Array.from({length:60},(_,i)=>i+1);

  return(
    <div style={{
      background:T.bg,
      border:`1px solid ${T.o}`,
      borderRadius:19,
      padding:'20px 16px 16px',
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      gap:16}}>

      <WimbledonDial minutes={minutes} secsLeft={secsLeft}
        running={running} finished={finished} hasStarted={hasStarted}/>

      {/* Controls */}
      {!hasStarted&&!finished&&(
        <div style={{display:'flex',alignItems:'center',gap:14,
          width:'100%',justifyContent:'space-between'}}>
          <div style={{flexShrink:0}}>
            <div style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:2}}>TIMER</div>
            <div style={{color:T.t3,fontSize:10,fontWeight:500,marginTop:2,letterSpacing:1.5}}>MINUTEN</div>
          </div>
          <ScrollPicker value={minutes} onChange={setMinutes} options={opts} bgColor={T.bg}/>
          <button onClick={onStart}
            style={{flexShrink:0,background:T.o,color:T.bg,
              border:'none',borderRadius:'50%',width:52,height:52,
              fontSize:18,fontWeight:800,cursor:'pointer',
              boxShadow:'0 4px 16px var(--oGlow)',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
            <PlayGlyph size={19} color={T.bg}/>
          </button>
        </div>
      )}

      {hasStarted&&!finished&&(
        <div style={{display:'flex',gap:10}}>
          <button onClick={running?onPause:onStart}
            style={{width:46,height:46,borderRadius:'50%',
              background:T.o,border:'none',color:T.bg,
              fontSize:15,fontWeight:800,cursor:'pointer',
              boxShadow:'0 3px 12px var(--oGlow)',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
            {running?<PauseGlyph size={16} color={T.bg}/>:<PlayGlyph size={16} color={T.bg}/>}
          </button>
          <button onClick={onReset}
            style={{width:46,height:46,borderRadius:'50%',
              border:`1px solid ${T.border}`,background:T.card2,
              color:T.t2,fontSize:18,cursor:'pointer'}}>
            ↺
          </button>
        </div>
      )}

      {finished&&(
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{color:T.r,fontSize:16,fontWeight:700,letterSpacing:.5}}>
            Zeit abgelaufen
          </div>
          <button onClick={onReset}
            style={{padding:'10px 18px',borderRadius:24,border:'none',
              background:T.o,color:T.bg,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            ↺ Neu
          </button>
        </div>
      )}
    </div>
  );
}

function TimerCard({minutes,setMinutes,running,secsLeft,finished,onStart,onPause,onReset,
  hasStarted,theme='dark'}){
  if(theme==='wimbledon'){
    return <WimbledonTimerCard minutes={minutes} setMinutes={setMinutes}
      running={running} secsLeft={secsLeft} finished={finished}
      hasStarted={hasStarted}
      onStart={onStart} onPause={onPause} onReset={onReset}/>;
  }
  const totalSecs=minutes*60;
  const progress=totalSecs?secsLeft/totalSecs:0;
  const fmtTime=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const opts=Array.from({length:60},(_,i)=>i+1);

  // 3 states: idle (picker visible), running/paused (countdown), finished
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
      padding:'14px 16px',transition:'border-color .25s'}}>

      {!hasStarted&&!finished&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14}}>
          <div style={{flexShrink:0}}>
            <div style={{color:T.o,fontSize:16,fontWeight:800}}>Timer</div>
            <div style={{color:T.t3,fontSize:11,fontWeight:500,marginTop:2}}>Minuten</div>
          </div>
          <ScrollPicker value={minutes} onChange={setMinutes} options={opts} bgColor={T.card}/>
          <button onClick={onStart}
            style={{flexShrink:0,background:T.g,color:T.t1,
              border:`1px solid rgba(255,255,255,0.18)`,
              borderRadius:'50%',width:56,height:56,fontSize:13,fontWeight:700,
              cursor:'pointer',transition:'opacity .15s'}}
            onPointerDown={e=>e.currentTarget.style.opacity='.7'}
            onPointerUp={e=>e.currentTarget.style.opacity='1'}
            onPointerLeave={e=>e.currentTarget.style.opacity='1'}>
            Start
          </button>
        </div>
      )}

      {hasStarted&&!finished&&(
        <div style={{position:'relative',margin:-16,padding:16,
          border:`1px solid ${T.o}`,borderRadius:19,
          overflow:'hidden'}}>
          {/* Progress fill — shrinks as time runs out (tournament pattern) */}
          <div style={{position:'absolute',left:0,top:0,bottom:0,
            width:`${progress*100}%`,
            background:'var(--oSoft)',
            transition:'width 1s linear'}}/>
          <div style={{position:'relative',zIndex:1,
            display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:34,fontWeight:800,color:T.o,
              fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',letterSpacing:1.5}}>
              {fmtTime(secsLeft)}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={running?onPause:onStart}
                style={{width:42,height:42,borderRadius:'50%',
                  background:T.o,border:'none',color:T.bg,
                  fontSize:16,fontWeight:800,cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                {running?<PauseGlyph size={16} color={T.bg}/>:<PlayGlyph size={16} color={T.bg}/>}
              </button>
              <button onClick={onReset}
                style={{width:42,height:42,borderRadius:'50%',
                  border:`1px solid ${T.border}`,background:T.card2,
                  color:T.t2,fontSize:16,cursor:'pointer'}}>
                ↺
              </button>
            </div>
          </div>
        </div>
      )}

      {finished&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{color:T.r,fontSize:16,fontWeight:800}}>Zeit abgelaufen</div>
            <div style={{color:T.t3,fontSize:12,marginTop:2}}>Spiel beendet</div>
          </div>
          <button onClick={onReset}
            style={{padding:'10px 18px',borderRadius:24,border:'none',
              background:T.o,color:T.bg,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            ↺ Neu
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SWIPEABLE CARD (Swipe-to-Delete)
═══════════════════════════════════════════════════════════════ */
function SwipeableCard({children,onDelete}){
  const[tx,setTx]=useState(0);
  const[swiping,setSwiping]=useState(false);
  const startX=useRef(0);
  const startTx=useRef(0);
  const moved=useRef(false);

  const onStart=(e)=>{
    const x=e.touches?e.touches[0].clientX:e.clientX;
    startX.current=x;
    startTx.current=tx;
    moved.current=false;
    setSwiping(true);
  };
  const onMove=(e)=>{
    if(!swiping)return;
    const x=e.touches?e.touches[0].clientX:e.clientX;
    const dx=x-startX.current;
    if(Math.abs(dx)>4) moved.current=true;
    const newTx=Math.min(0,Math.max(-100,startTx.current+dx));
    setTx(newTx);
  };
  const onEnd=()=>{
    setSwiping(false);
    if(tx<-90){
      // Threshold passed → delete
      setTx(-400);
      setTimeout(()=>onDelete(),200);
    } else if(tx<-50){
      setTx(-80); // Snap to reveal
    } else {
      setTx(0);
    }
  };

  // Click on revealed delete background should trigger delete too
  const handleDeleteClick=(e)=>{
    e.stopPropagation();
    setTx(-400);
    setTimeout(()=>onDelete(),200);
  };

  // Block click on card when swiped
  const handleCardClick=(e)=>{
    if(moved.current||tx!==0){
      e.stopPropagation();
      e.preventDefault();
      if(tx!==0) setTx(0); // reset on tap
    }
  };

  return(
    <div style={{position:'relative',overflow:'hidden',borderRadius:23}}>
      {/* Delete-Hintergrund — füllt die komplette Card-Fläche (inset:0)
          mit gleichem Radius, sodass das Rot die Card beim Swipen sauber
          umhüllt statt als kantiger Streifen abzustehen. Label rechts,
          wird beim Wegswipen der Card sichtbar. */}
      <div onClick={handleDeleteClick}
        style={{position:'absolute',inset:0,background:T.r,borderRadius:23,
          display:'flex',alignItems:'center',justifyContent:'flex-end',
          paddingRight:26,gap:8,cursor:'pointer',color:'#fff',
          fontSize:13,fontWeight:800,letterSpacing:.3}}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" stroke="#fff"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Löschen
      </div>
      {/* Card content — eigener Radius, damit die führende Kante beim
          Swipen rund bleibt und nicht eckig über dem Rot absteht. */}
      <div onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
        onMouseDown={onStart} onMouseMove={swiping?onMove:undefined} onMouseUp={onEnd} onMouseLeave={swiping?onEnd:undefined}
        onClickCapture={handleCardClick}
        style={{transform:`translateX(${tx}px)`,
          transition:swiping?'none':'transform .25s cubic-bezier(.3,0,.2,1)',
          willChange:'transform',background:T.bg,borderRadius:23,position:'relative'}}>
        {children}
      </div>
    </div>
  );
}


/* ── Spielstil-Picker (Bottom-Sheet) — Auswahl eines der sechs RITMO-
   Archetypen pro Spieler. Treibt das Match-Tier-Rating der Paarungen. */
function StylePickerSheet({current,onSelect,onClose}){
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:300,
      background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',display:'flex',
      alignItems:'flex-end',justifyContent:'center',animation:'fadeIn .15s ease'}}>
      <div onClick={e=>e.stopPropagation()} className="slide-up"
        style={{background:T.card,borderTopLeftRadius:20,borderTopRightRadius:20,
          borderTop:`1px solid ${T.border}`,width:'100%',maxWidth:480,
          padding:'16px 18px calc(env(safe-area-inset-bottom,0px) + 18px)',
          maxHeight:'82vh',overflowY:'auto'}}>
        <div style={{width:36,height:4,borderRadius:2,background:T.border,margin:'0 auto 14px'}}/>
        <div style={{color:T.t1,fontSize:17,fontWeight:800,marginBottom:3}}>Spielstil wählen</div>
        <div style={{color:T.t3,fontSize:12,lineHeight:1.5,marginBottom:14}}>
          Bestimmt das Match-Tier-Rating der Paarungen im Turnier.
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {Object.keys(PADEL_STYLES).map(key=>{
            const st=PADEL_STYLES[key]; const sel=current===key;
            return(
              <button key={key} onClick={()=>{onSelect(key);onClose();}}
                style={{display:'flex',alignItems:'center',gap:12,width:'100%',
                  background:sel?rgba(st.accent,0.14):T.card2,
                  border:`1.5px solid ${sel?st.accent:T.border}`,borderRadius:15,
                  padding:'11px 13px',cursor:'pointer',textAlign:'left',
                  transition:'all .18s var(--ease-out-expo)'}}>
                <ArchetypeGlyph type={key} active color={st.accent} size={26}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:T.t1,fontSize:16,fontWeight:800}}>{st.name}</div>
                  <div style={{color:T.t3,fontSize:11,fontWeight:500,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {st.subtitle} — {st.tagline}
                  </div>
                </div>
                {sel&&<span style={{color:st.accent,fontSize:16,fontWeight:900,flexShrink:0}}>✓</span>}
              </button>
            );
          })}
          {current&&(
            <button onClick={()=>{onSelect(null);onClose();}}
              style={{marginTop:4,padding:'11px',background:T.card2,border:`1px solid ${T.border}`,
                borderRadius:15,color:T.t3,fontSize:13,fontWeight:600,cursor:'pointer'}}>
              Kein Stil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Court-Label: eigener Name (aus dem Setup) oder Default "Court N". */
const courtLabel=(names,i)=>((names&&names[i]&&String(names[i]).trim())||`Court ${i+1}`);

/* ═══════════════════════════════════════════════════════════════
   TURNIER-ASSISTENT — geführter Setup-Wizard (6 Schritte).

   Format → Spieler → Courts → Zeit → Wertung → Zusammenfassung.
   Schreibt DIREKT in die TournamentSetup-States (Setter-Props):
   nichts geht beim Schließen verloren, das klassische Formular
   spiegelt jeden Schritt live. Nur für den Lokal-Modus — Online
   hat mit der Lobby bereits einen eigenen geführten Flow.
═══════════════════════════════════════════════════════════════ */
function TournamentWizard({onClose,onFinish,canStart,
  format,setFormat,winMode,setWinMode,name,setName,
  players,addPlayer,addPlayerNamed,removePlayer,renamePlayer,setPlayerGroup,
  numCourts,setNumCourts,maxCourts,courtNames,setCourtName,
  startTime,setStartTime,endTime,setEndTime,roundPrio,setRoundPrio,
  roundDur,setRoundDur,suggest,pauseStats,nameHistory}){
  const[step,setStep]=useState(0);
  const inputRefs=useRef({});
  // Validierung je Schritt — „Weiter" bleibt aus, bis der Schritt steht.
  const namesOk=players.every(p=>(p.name||'').trim().length>0);
  const meta=FORMATS[format]||FORMATS.americano;
  const wGrpA=players.filter(p=>(p.group||'A')!=='B').length;
  const wGrpB=players.length-wGrpA;
  const wTeamOk=!meta.team||players.length%2===0;
  const wGroupsOk=!meta.groups||(wGrpA>=2&&wGrpB>=2);
  const GRPB=PCOLS[1]; // Gruppe-B-Farbe (aus der Spieler-Palette)
  const valid=[true,players.length>=4&&namesOk&&wTeamOk&&wGroupsOk,true,true,true,canStart][step];
  const next=()=>{if(!valid)return;buzz(6);setStep(s=>Math.min(s+1,5));};
  const back=()=>{buzz(6);setStep(s=>Math.max(s-1,0));};
  // Historie-Chips: nur Namen, die noch nicht in der Liste stehen.
  const inList=new Set(players.map(p=>(p.name||'').trim().toLowerCase()));
  const histFree=(nameHistory||[]).filter(n=>!inList.has(n.toLowerCase())).slice(0,8);

  // ── Shared Styles ──
  const card=sel=>({width:'100%',textAlign:'left',padding:'16px 18px',borderRadius:19,
    background:sel?T.oSoft:T.card2,border:`1.5px solid ${sel?T.o:T.border}`,
    cursor:'pointer',display:'flex',alignItems:'center',gap:14});
  const chip=sel=>({flex:1,padding:'12px 10px',borderRadius:13,
    background:sel?T.oSoft:T.card2,border:`1.5px solid ${sel?T.o:T.border}`,
    color:sel?T.o:T.t2,fontSize:13,fontWeight:700,cursor:'pointer'});
  const stepTitle={color:T.t1,fontSize:22,fontWeight:900,letterSpacing:-.4,marginBottom:6};
  const stepSub={color:T.t3,fontSize:13,lineHeight:1.55,marginBottom:18};
  const label={color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.3,
    textTransform:'uppercase',marginBottom:8};
  const inp={width:'100%',height:46,borderRadius:13,background:T.card2,
    border:`1px solid ${T.border}`,color:T.t1,fontSize:16,fontWeight:600,
    padding:'0 12px',outline:'none',boxSizing:'border-box'};
  const timeInp={width:'100%',height:46,borderRadius:13,background:T.card2,
    border:`1px solid ${T.border}`,color:T.t1,fontSize:16,fontWeight:700,textAlign:'center',
    outline:'none',boxSizing:'border-box',fontFamily:'inherit',
    display:'flex',alignItems:'center',justifyContent:'center'};
  const stepBtn={width:38,height:38,borderRadius:12,background:T.card2,
    border:`1px solid ${T.border}`,color:T.t1,fontSize:18,fontWeight:800,cursor:'pointer',
    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0};
  const infoBox={padding:'12px 16px',borderRadius:13,background:T.oSoft,
    border:`1px solid ${T.o}`,color:T.t2,fontSize:12.5,lineHeight:1.6};

  // Zusammenfassungs-Zeilen (Schritt 6) — [Label, Wert, Ziel-Schritt].
  const fmtLabel=meta.name;
  const wmLabel=winMode==='wins'?'Siege':'Punkte';
  const rows=[
    ['Format',fmtLabel,0],
    ['Spieler',`${players.length} — ${players.slice(0,4).map(p=>(p.name||'').trim().split(/\s+/)[0]).join(', ')}${players.length>4?' …':''}`,1],
    ['Courts',String(numCourts),2],
    ['Zeit',startTime&&endTime?`${startTime}–${endTime} · ${roundDur} Min/Runde`:`${roundDur} Min/Runde`,3],
    ['Wertung',wmLabel,4],
    ...(name.trim()?[['Name',name.trim(),4]]:[]),
  ];

  return(
    <div className="fi" style={{position:'fixed',inset:0,zIndex:300,background:T.bg,
      display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 18px)'}}>

      {/* Kopf: Fortschritt + Schließen */}
      <div style={{padding:'0 22px 14px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{color:T.o,fontSize:12,fontWeight:800,letterSpacing:1.4,textTransform:'uppercase'}}>
            Turnier-Assistent · {step+1}/6
          </div>
          <button onClick={onClose} aria-label="Assistent schließen"
            style={{width:34,height:34,borderRadius:'50%',background:T.card2,
              border:`1px solid ${T.border}`,color:T.t2,fontSize:16,fontWeight:700,
              cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>×</button>
        </div>
        <div style={{height:5,borderRadius:3,background:T.card2,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${((step+1)/6)*100}%`,borderRadius:3,
            background:T.o,transition:'width .35s var(--ease-out-expo)'}}/>
        </div>
      </div>

      {/* Body — key={step} remountet pro Schritt → Entrance-Animation */}
      <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'8px 22px 20px'}}>
        <div key={step} className="fu">

          {step===0&&(<>
            <div style={stepTitle}>Welches Format passt zu euch?</div>
            <div style={stepSub}>7 klassische Modi — von locker gemischt bis K.-o.-Bracket.</div>
            {Object.entries(FORMATS).map(([id,f],i)=>(
              <button key={id} onClick={()=>setFormat(id)}
                style={{...card(format===id),marginTop:i?10:0}}>
                <span style={{flex:1,minWidth:0}}>
                  <span style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{color:T.t1,fontSize:17,fontWeight:800}}>{f.name}</span>
                    {id==='americano'&&(
                      <span style={{padding:'2px 8px',borderRadius:999,background:T.oSoft,
                        color:T.o,fontSize:10,fontWeight:800,letterSpacing:.5}}>BELIEBT</span>
                    )}
                    {f.team&&(
                      <span style={{padding:'2px 8px',borderRadius:999,background:T.card,
                        border:`1px solid ${T.border}`,color:T.t2,fontSize:10,fontWeight:800,
                        letterSpacing:.5}}>FESTE TEAMS</span>
                    )}
                    {f.groups&&(
                      <span style={{padding:'2px 8px',borderRadius:999,background:T.card,
                        border:`1px solid ${T.border}`,color:T.t2,fontSize:10,fontWeight:800,
                        letterSpacing:.5}}>MIXED</span>
                    )}
                  </span>
                  <span style={{display:'block',color:T.t3,fontSize:12.5,lineHeight:1.55,marginTop:4}}>
                    {f.short}
                  </span>
                </span>
                {format===id&&<span style={{color:T.o,fontSize:18,fontWeight:900,flexShrink:0}}>✓</span>}
              </button>
            ))}
          </>)}

          {step===1&&(<>
            <div style={stepTitle}>Wer spielt mit?</div>
            <div style={stepSub}>Mindestens 4 Spieler — Enter springt zum nächsten Namen.</div>
            {histFree.length>0&&(<>
              <div style={label}>Zuletzt dabei</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
                {histFree.map(n=>(
                  <button key={n} onClick={()=>{buzz(6);addPlayerNamed(n);}}
                    style={{padding:'7px 12px',borderRadius:999,background:T.card2,
                      border:`1px solid ${T.border}`,color:T.t2,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                    + {n}
                  </button>
                ))}
              </div>
            </>)}
            {players.map((p,idx)=>(
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{width:26,height:26,borderRadius:'50%',background:p.color,flexShrink:0,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  color:'#000',fontSize:12,fontWeight:900}}>{idx+1}</span>
                <input ref={el=>{inputRefs.current[p.id]=el;}} value={p.name}
                  onChange={e=>renamePlayer(p.id,e.target.value)}
                  autoCapitalize="words" autoCorrect="off" spellCheck={false} enterKeyHint="next"
                  onFocus={e=>e.target.select()}
                  onKeyDown={e=>{if(e.key==='Enter'){
                    const nx=players[idx+1];
                    if(nx) inputRefs.current[nx.id]?.focus(); else addPlayer();
                  }}}
                  style={{...inp,flex:1,width:'auto',minWidth:0,height:44,borderRadius:12}}/>
                {meta.groups&&(
                  <button onClick={()=>setPlayerGroup(p.id,(p.group||'A')==='B'?'A':'B')}
                    aria-label="Gruppe wechseln" title="Gruppe A/B wechseln"
                    style={{...stepBtn,width:34,height:34,fontSize:13,
                      background:(p.group||'A')==='B'?rgba(GRPB,0.16):T.oSoft,
                      border:`1.5px solid ${(p.group||'A')==='B'?GRPB:T.o}`,
                      color:(p.group||'A')==='B'?GRPB:T.o}}>
                    {(p.group||'A')==='B'?'B':'A'}
                  </button>
                )}
                {players.length>4&&(
                  <button onClick={()=>removePlayer(p.id)} aria-label="Spieler entfernen"
                    style={{...stepBtn,width:34,height:34,color:T.t3}}>×</button>
                )}
              </div>
            ))}
            <button onClick={addPlayer}
              style={{width:'100%',padding:'12px',borderRadius:12,background:'none',
                border:`1.5px dashed ${T.border}`,color:T.o,fontSize:16,fontWeight:700,
                cursor:'pointer',marginTop:2}}>
              + Spieler hinzufügen
            </button>
            {format!=='knockout'&&pauseStats&&pauseStats.sitOut>0&&(
              <div style={{marginTop:14,padding:'10px 14px',borderRadius:12,background:T.card2,
                border:`1px solid ${T.border}`,color:T.t3,fontSize:12,lineHeight:1.55}}>
                Bei {players.length} Spielern pausieren {pauseStats.sitOut} pro Runde — RITMO rotiert fair (±1 Pause).
              </div>
            )}
            {/* Team-Formate: feste Paare nach Listen-Reihenfolge */}
            {meta.team&&wTeamOk&&(
              <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:6}}>
                {Array.from({length:Math.floor(players.length/2)}).map((_,ti)=>(
                  <div key={ti} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',
                    borderRadius:11,background:T.card2,border:`1px solid ${T.border}`}}>
                    <span style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:.5,
                      width:56,flexShrink:0}}>TEAM {ti+1}</span>
                    <span style={{color:T.t1,fontSize:13,fontWeight:600,minWidth:0,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {(players[2*ti]?.name||'?')} & {(players[2*ti+1]?.name||'?')}
                    </span>
                  </div>
                ))}
                <div style={{color:T.t3,fontSize:11,lineHeight:1.5}}>
                  Feste Teams nach Listen-Reihenfolge — Liste ändern = Teams ändern.
                </div>
              </div>
            )}
            {meta.team&&!wTeamOk&&(
              <div style={{marginTop:14,padding:'10px 14px',borderRadius:12,
                background:'rgba(232,69,69,0.08)',border:'1px solid rgba(232,69,69,0.4)',
                color:'#FF6B6B',fontSize:12,fontWeight:600,lineHeight:1.55}}>
                {meta.name} braucht eine gerade Spielerzahl — aktuell {players.length}.
              </div>
            )}
            {/* Mixicano: Gruppen-Zähler + Anleitung */}
            {meta.groups&&(
              <div style={{marginTop:14,padding:'10px 14px',borderRadius:12,background:T.card2,
                border:`1px solid ${T.border}`,color:T.t3,fontSize:12,lineHeight:1.55}}>
                Gruppen: <span style={{color:T.o,fontWeight:800}}>A ×{wGrpA}</span>
                {' · '}<span style={{color:GRPB,fontWeight:800}}>B ×{wGrpB}</span>
                {!wGroupsOk&&<span style={{color:'#FF6B6B',fontWeight:600}}> — mind. 2 pro Gruppe nötig.</span>}
                {' '}Jedes Team = 1×A + 1×B (z. B. Damen/Herren) — per Knopf neben dem Namen.
              </div>
            )}
          </>)}

          {step===2&&(<>
            <div style={stepTitle}>Wie viele Courts habt ihr?</div>
            <div style={stepSub}>4 Spieler pro Court — mehr Courts bedeuten weniger Pausen.</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:20,margin:'6px 0 14px'}}>
              <button onClick={()=>setNumCourts(Math.max(1,numCourts-1))}
                style={{...stepBtn,width:52,height:52,borderRadius:16,fontSize:24}}>−</button>
              <div style={{textAlign:'center',minWidth:84}}>
                <div style={{color:T.t1,fontSize:46,fontWeight:900,lineHeight:1}}>{numCourts}</div>
                <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.2,
                  textTransform:'uppercase',marginTop:5}}>Court{numCourts>1?'s':''}</div>
              </div>
              <button onClick={()=>setNumCourts(Math.min(maxCourts,numCourts+1))}
                style={{...stepBtn,width:52,height:52,borderRadius:16,fontSize:24}}>+</button>
            </div>
            <div style={{color:T.t3,fontSize:12,textAlign:'center',marginBottom:18}}>
              Maximal {maxCourts} bei {players.length} Spielern.
            </div>
            <div style={label}>Court-Namen (optional)</div>
            {Array.from({length:numCourts}).map((_,i)=>(
              <input key={i} value={courtNames[i]??''} onChange={e=>setCourtName(i,e.target.value)}
                placeholder={`Court ${i+1}`} autoCapitalize="words" autoCorrect="off" spellCheck={false}
                style={{...inp,height:44,borderRadius:12,marginBottom:8}}/>
            ))}
          </>)}

          {step===3&&(<>
            <div style={stepTitle}>Wie lange wollt ihr spielen?</div>
            <div style={stepSub}>Mit Start & Ende schlägt RITMO Rundenzahl und -dauer automatisch vor.</div>
            <div style={{display:'flex',gap:10,marginBottom:16}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={label}>Start</div>
                <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} style={timeInp}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={label}>Ende</div>
                <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} style={timeInp}/>
              </div>
            </div>
            <div style={label}>Was ist euch wichtiger?</div>
            <div style={{display:'flex',gap:8,marginBottom:18}}>
              <button onClick={()=>setRoundPrio('variety')} style={chip(roundPrio==='variety')}>
                Jeder mit jedem
              </button>
              <button onClick={()=>setRoundPrio('length')} style={chip(roundPrio==='length')}>
                Längere Runden
              </button>
            </div>
            <div style={label}>Rundendauer</div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
              <button onClick={()=>setRoundDur(Math.max(4,roundDur-1))} style={stepBtn}>−</button>
              <div style={{flex:1,textAlign:'center',color:T.t1,fontSize:24,fontWeight:900}}>
                {roundDur} Min
              </div>
              <button onClick={()=>setRoundDur(Math.min(45,roundDur+1))} style={stepBtn}>+</button>
            </div>
            {suggest?(
              <div style={infoBox}>
                <span style={{color:T.o,fontWeight:800}}>Empfehlung:</span>{' '}
                ≈ {suggest.rounds} Runden à {suggest.roundTime} Min — jede:r spielt ~{suggest.gamesEach} Matches
                {pauseStats&&pauseStats.pauses!=null&&pauseStats.sitOut>0?` und pausiert ~${pauseStats.pauses}×`:''}.
              </div>
            ):(
              <div style={{color:T.t3,fontSize:12,lineHeight:1.55}}>
                Ohne Zeitfenster läuft das Turnier einfach Runde für Runde weiter — du beendest es manuell.
              </div>
            )}
          </>)}

          {step===4&&(<>
            <div style={stepTitle}>Wie wird gewertet?</div>
            <div style={stepSub}>Bestimmt, wonach das Leaderboard sortiert.</div>
            <button onClick={()=>setWinMode('points')} style={card(winMode==='points')}>
              <span style={{flex:1,minWidth:0}}>
                <span style={{color:T.t1,fontSize:17,fontWeight:800}}>Punkte zählen</span>
                <span style={{display:'block',color:T.t3,fontSize:12.5,lineHeight:1.55,marginTop:4}}>
                  Jeder gewonnene Punkt zählt fürs Ranking — der Americano-Klassiker.
                </span>
              </span>
              {winMode==='points'&&<span style={{color:T.o,fontSize:18,fontWeight:900,flexShrink:0}}>✓</span>}
            </button>
            <div style={{height:10}}/>
            <button onClick={()=>setWinMode('wins')} style={card(winMode==='wins')}>
              <span style={{flex:1,minWidth:0}}>
                <span style={{color:T.t1,fontSize:17,fontWeight:800}}>Siege zählen</span>
                <span style={{display:'block',color:T.t3,fontSize:12.5,lineHeight:1.55,marginTop:4}}>
                  Nur Match-Siege zählen — einfach & klar.
                </span>
              </span>
              {winMode==='wins'&&<span style={{color:T.o,fontSize:18,fontWeight:900,flexShrink:0}}>✓</span>}
            </button>
            <div style={{height:18}}/>
            <div style={label}>Turniername (optional)</div>
            <input value={name} onChange={e=>setName(e.target.value)} maxLength={40}
              placeholder="z. B. Sunset Americano · Fr" style={inp}/>
          </>)}

          {step===5&&(<>
            <div style={stepTitle}>Alles bereit?</div>
            <div style={stepSub}>Kurz prüfen — jeden Punkt kannst du noch anpassen.</div>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
              padding:'6px 18px',marginBottom:14}}>
              {rows.map(([k,v,s],i)=>(
                <div key={k+i} style={{display:'flex',alignItems:'center',gap:10,
                  padding:'13px 0',borderTop:i>0?`1px solid ${T.sep}`:'none'}}>
                  <div style={{width:74,flexShrink:0,color:T.t3,fontSize:11,fontWeight:700,
                    letterSpacing:1,textTransform:'uppercase'}}>{k}</div>
                  <div style={{flex:1,minWidth:0,color:T.t1,fontSize:16,fontWeight:600,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</div>
                  <button onClick={()=>setStep(s)}
                    style={{padding:'6px 11px',borderRadius:999,background:T.card2,
                      border:`1px solid ${T.border}`,color:T.o,fontSize:11.5,fontWeight:700,
                      cursor:'pointer',flexShrink:0}}>
                    Ändern
                  </button>
                </div>
              ))}
            </div>
            {suggest&&(
              <div style={infoBox}>
                Plan: ≈ {suggest.rounds} Runden à {suggest.roundTime} Min auf {suggest.courts} Court{suggest.courts>1?'s':''}
                {suggest.sitOut>0?` · ${suggest.sitOut} pausieren pro Runde`:''}.
              </div>
            )}
          </>)}

        </div>
      </div>

      {/* Footer: Zurück / Weiter bzw. Starten */}
      <div style={{flexShrink:0,display:'flex',gap:10,
        padding:'14px 22px calc(env(safe-area-inset-bottom,0px) + 18px)',
        borderTop:`1px solid ${T.sep}`,background:T.bg}}>
        {step>0&&(
          <button onClick={back}
            style={{flex:1,padding:'15px',borderRadius:15,background:T.card2,
              border:`1px solid ${T.border}`,color:T.t1,fontSize:16,fontWeight:700,cursor:'pointer'}}>
            Zurück
          </button>
        )}
        {step<5?(
          <button onClick={next} disabled={!valid}
            style={{flex:2,padding:'15px',borderRadius:15,border:'none',
              background:valid?T.o:T.card2,color:valid?'#000':T.t3,
              fontSize:16,fontWeight:800,cursor:valid?'pointer':'not-allowed'}}>
            Weiter
          </button>
        ):(
          <button onClick={()=>{if(!canStart)return;buzz(18);onFinish();}} disabled={!canStart}
            style={{flex:2,padding:'15px',borderRadius:15,border:'none',
              background:canStart?T.g:T.card2,color:canStart?T.t1:T.t3,
              fontSize:16,fontWeight:800,cursor:canStart?'pointer':'not-allowed'}}>
            Turnier starten
          </button>
        )}
      </div>
    </div>
  );
}

function TournamentSetup({nav,onHome,onStart,onSave,onSaveDraft,saved,isEdit,profile,onCreateOnline}){
  // mode: 'lokal' = bestehender Flow (lokale Spielerliste).
  // 'online' = Host erstellt Session, Player joinen via PIN/QR.
  const[mode,setMode]=useState(saved?.mode||'lokal');
  const[players,setPlayers]=useState(saved?.players||[
    {id:0,name:'Spieler 1',color:PCOLS[0]},
    {id:1,name:'Spieler 2',color:PCOLS[1]},
    {id:2,name:'Spieler 3',color:PCOLS[2]},
    {id:3,name:'Spieler 4',color:PCOLS[3]},
  ]);
  const[format,setFormat]=useState(saved?.format||'americano');
  const[winMode,setWinMode]=useState(saved?.winMode||'points');
  const[numCourts,setNumCourts]=useState(saved?.numCourts||1);
  const[roundDur,setRoundDur]=useState(saved?.roundDurationMin||10);
  const[name,setName]=useState(saved?.name||'');
  const[startTime,setStartTime]=useState(saved?.startTime||'');
  const[endTime,setEndTime]=useState(saved?.endTime||'');
  // Priorität für den Rundenzeit-Vorschlag: 'length' = längere Runden
  // (weniger Runden, dafür spielt nicht jeder gegen jeden), 'variety' =
  // jeder gegen jeden (mehr Runden, dafür kürzer).
  const[roundPrio,setRoundPrio]=useState(saved?.roundPrio||'variety');
  // Bumpt nur beim Übernehmen eines Vorschlags → der Rundendauer-Picker
  // remountet und springt auf den neuen Wert (er repositioniert sonst
  // nur beim Mount, nicht bei externer value-Änderung).
  const[pickerKey,setPickerKey]=useState(0);
  const[creatingOnline,setCreatingOnline]=useState(false);
  // Court-Namen — werden auf die Matches angewendet. Sparse-Array:
  // Index i = eigener Name fuer Court i, sonst Default "Court i+1".
  const[courtNames,setCourtNames]=useState(saved?.courtNames||[]);
  const setCourtName=(i,val)=>setCourtNames(a=>{const n=[...a];n[i]=val;return n;});
  const courtInputRefs=useRef({});
  // Edit-Scope-Popup: haelt die zu speichernden Updates, bis der Host
  // waehlt, ob sie fuer die aktuelle oder die naechste Runde gelten.
  const[editScopePrompt,setEditScopePrompt]=useState(null);
  // Turnier-Assistent (geführter Setup) — nur im Lokal-Modus.
  const[wizardOpen,setWizardOpen]=useState(false);
  // Namens-Historie für die Schnellauswahl im Assistenten (LRU, max 24;
  // wird bei jedem lokalen Start in startLocal() gepflegt).
  const[nameHistory]=useState(()=>lsGet('ritmo_player_history',[]));

  // Refs auf alle Spieler-Inputs — Enter springt zum nächsten Slot,
  // damit man die Liste in einem Rutsch durchtippen kann.
  const playerInputRefs=useRef({});
  const focusPlayer=(playerId)=>{
    const el=playerInputRefs.current[playerId];
    if(!el) return;
    el.focus();
    el.select?.();
  };
  const[onlineError,setOnlineError]=useState('');
  const nextId=useRef(players.reduce((m,p)=>Math.max(m,p.id),0)+1);

  // Format-Meta: Team-Formate brauchen gerade Spielerzahl, Mixicano
  // zwei Gruppen (A/B) mit je >= 2 Spielern.
  const fmtMeta=FORMATS[format]||FORMATS.americano;
  const grpA=players.filter(p=>(p.group||'A')!=='B').length;
  const grpB=players.length-grpA;
  const teamOk=!fmtMeta.team||players.length%2===0;
  const groupsOk=!fmtMeta.groups||(grpA>=2&&grpB>=2);
  // Im Online-Modus joinen Spieler erst nach Erstellung — daher hier
  // keine Cap durch lokale Spielerzahl. Trotzdem ein sinnvolles UI-
  // Maximum (20 Courts), damit der +/-/Picker nicht ins Endlose läuft.
  // Lokal: floor(players/4); Mixicano: pro Court 2×A + 2×B.
  const maxCourts=mode==='online'?20:Math.max(1,fmtMeta.groups
    ?Math.floor(Math.min(grpA,grpB)/2)
    :Math.floor(players.length/4));
  // Online unterstützt Mixicano nicht (Teilnehmer haben keine Gruppen).
  useEffect(()=>{if(mode==='online'&&fmtMeta.online===false)setFormat('americano');},[mode,format]); // eslint-disable-line react-hooks/exhaustive-deps
  // Auto-clamp courts when players reduced (gilt nur im Lokal-Modus)
  useEffect(()=>{if(numCourts>maxCourts)setNumCourts(maxCourts);},[maxCourts,numCourts]);

  // ══ RUNDENZEIT-VORSCHLAG — Gesamtlogik ════════════════════════════
  //  Eingaben:  Spielerzahl P · Courts (4 Spieler/Court) · Zeitfenster W
  //             (Start→Ende) · 2 Min Rotation zwischen den Runden.
  //  Ziele:     möglichst viele Runden (jeder mit möglichst jedem),
  //             aber Runden nicht zu kurz (≥ MIN) und nicht zu lang (≤ MAX).
  //
  //  Schritte:
  //   1. Courts realistisch kappen: C = min(gewählt, ⌊P/4⌋).
  //      perRound = 4·C aktive Spieler, sitOut = P − perRound pausieren.
  //   2. So viele Runden, wie bei ~13-Min-Runde + 2-Min-Rotation ins
  //      Fenster passen:  rounds ≈ W / (TARGET + ROT).
  //   3. Rundenzeit = ⌊W / rounds⌋ − ROT.
  //   4. Zu kurz? Runden reduzieren bis Rundenzeit ≥ MIN (nicht zu kurz).
  //      Zu lang? Runden erhöhen für mehr Partner-Vielfalt, solange ≥ MIN.
  //   5. Faire Pausen-Rotation steckt im Runden-Generator (fewest-sat-out
  //      sitzt zuerst) → jeder spielt ±1 gleich oft, unabhängig von rounds.
  //   Courts laufen PARALLEL → sie bestimmen Spiele/Spieler + Pausen,
  //   die Rundenzahl hängt am Zeitfenster (nicht an der Court-Zahl).
  const parseHM=s=>{const m=/^(\d{1,2}):(\d{2})$/.exec((s||'').trim());if(!m)return null;
    const h=+m[1],mi=+m[2];if(h>23||mi>59)return null;return h*60+mi;};
  const windowMin=(()=>{const a=parseHM(startTime),b=parseHM(endTime);
    if(a==null||b==null)return null;let d=b-a;if(d<=0)d+=1440;return d;})();
  const ROT=2; // 1–2 Min Rotation zwischen den Runden
  // Prioritäts-Bänder: 'length' → längere Runden (Ziel 18, 14–30 Min) =
  // weniger Runden / weniger Mix; 'variety' → jeder gegen jeden (Ziel 10,
  // 8–16 Min) = mehr Runden / mehr Partner, dafür kürzer.
  const PRIO = roundPrio==='length' ? {TARGET:18,MIN:14,MAX:30} : {TARGET:10,MIN:8,MAX:16};
  const suggest=(()=>{
    if(mode!=='lokal'||!windowMin||players.length<4)return null;
    const P=players.length;
    const C=Math.max(1,Math.min(numCourts,Math.floor(P/4)));   // 4 Spieler/Court, an P angepasst
    const perRound=4*C, sitOut=P-perRound;
    let rounds=Math.max(1,Math.round(windowMin/(PRIO.TARGET+ROT))); // so viele Ziel-Slots wie passen
    let roundTime=Math.floor(windowMin/rounds)-ROT;
    // Nicht zu kurz: Runden reduzieren, bis Rundenzeit ≥ MIN (oder 1 Runde).
    while(roundTime<PRIO.MIN && rounds>1){ rounds--; roundTime=Math.floor(windowMin/rounds)-ROT; }
    // Nicht zu lang: Runden erhöhen (mehr verschiedene Partner), solange ≥ MIN.
    while(roundTime>PRIO.MAX){ const r=rounds+1,rt=Math.floor(windowMin/r)-ROT; if(rt<PRIO.MIN)break; rounds=r; roundTime=rt; }
    roundTime=Math.max(1,roundTime);
    const gamesEach=Math.round(rounds*perRound/P);
    return {rounds,roundTime,gamesEach,courts:C,sitOut,rotation:ROT};
  })();
  // Vorschlag übernehmen, wenn sich Fenster/Spielerzahl/Courts/Prio ändern.
  useEffect(()=>{ if(suggest){ setRoundDur(suggest.roundTime); setPickerKey(k=>k+1); }
    /* eslint-disable-next-line */ },[startTime,endTime,players.length,numCourts,mode,roundPrio]);

  // ── Pausen pro Spieler ("jeder gegen jeden") ──────────────────────
  //  Haengt an Rundendauer (→ wie viele Runden ins Zeitfenster passen),
  //  Court-Zahl (4 Spieler/Court → Sit-Outs/Runde) und Spielerzahl. Der
  //  Runden-Generator laesst immer die mit den wenigsten Pausen spielen,
  //  also verteilt sich's fair (±1). Ohne Zeitfenster gibt es keine feste
  //  Rundenzahl → dann nur Sit-Outs/Runde, keine Gesamt-Pausen.
  const pauseStats=(()=>{
    if(players.length<4) return null;
    const P=players.length;
    const C=Math.max(1,Math.min(numCourts,Math.floor(P/4)));
    const sitOut=P-4*C;
    if(sitOut<=0) return {sitOut:0,pauses:0,rounds:null};
    if(!windowMin) return {sitOut,pauses:null,rounds:null};
    const rounds=Math.max(1,Math.floor(windowMin/((roundDur||1)+ROT)));
    return {sitOut,rounds,pauses:Math.round(rounds*sitOut/P)};
  })();

  const addPlayer=()=>{
    // Keine Obergrenze mehr — beliebig viele Spieler. Farben zyklen via
    // Modulo durch die PCOLS-Palette, Courts werden separat auf
    // floor(Spieler/4) gedeckelt (maxCourts).
    const id=nextId.current++;
    setPlayers(p=>[...p,{id,name:`Spieler ${p.length+1}`,color:PCOLS[id%PCOLS.length]}]);
  };
  const removePlayer=id=>setPlayers(p=>p.filter(x=>x.id!==id));
  const renamePlayer=(id,name)=>setPlayers(p=>p.map(x=>x.id===id?{...x,name}:x));
  // Spieler mit fertigem Namen anlegen (Historie-Chips im Assistenten).
  const addPlayerNamed=(nm)=>{const id=nextId.current++;
    setPlayers(p=>[...p,{id,name:nm,color:PCOLS[id%PCOLS.length]}]);};
  // Spielstil je Spieler — treibt das Match-Tier-Rating der Paarungen.
  const setPlayerStyle=(id,style)=>setPlayers(p=>p.map(x=>x.id===id?{...x,style:style||null}:x));
  // Gruppe A/B je Spieler (Mixicano). Beim Wechsel auf ein Gruppen-
  // Format bekommen Spieler ohne Gruppe alternierend A/B zugewiesen.
  const setPlayerGroup=(id,g)=>setPlayers(p=>p.map(x=>x.id===id?{...x,group:g}:x));
  useEffect(()=>{
    if(!FORMATS[format]?.groups) return;
    setPlayers(p=>{
      let changed=false;
      const n=p.map((x,i)=>{if(x.group)return x;changed=true;return {...x,group:i%2?'B':'A'};});
      return changed?n:p;
    });
  },[format]);
  // Welcher Spieler hat gerade den Stil-Picker offen (id | null).
  const[stylePickerFor,setStylePickerFor]=useState(null);

  const canStart=players.length>=4&&teamOk&&groupsOk;

  // Lokalen Start bündeln — MatchBar-Button UND Assistent nutzen ihn.
  const startLocal=()=>{
    if(!canStart) return;
    // Namens-Historie pflegen (echte Namen, keine "Spieler N"-Defaults).
    const hist=lsGet('ritmo_player_history',[]);
    const cur=players.map(p=>(p.name||'').trim()).filter(n=>n&&!/^Spieler \d+$/i.test(n));
    lsSet('ritmo_player_history',[...new Set([...cur,...hist])].slice(0,24));
    const lb=calcLeaderboard(players,[],winMode);
    const r0=genRound(format,players,{leaderboard:lb,maxCourts:numCourts});
    if(!r0) return; // defensiv — kann bei gültigem canStart nicht passieren
    onStart({
      // id/createdAt durchreichen, falls aus einem Entwurf gestartet —
      // startTourney ersetzt den Eintrag dann in-place (Entwurf-Flag
      // fällt weg, da es hier nicht mitgegeben wird).
      id:saved?.id,createdAt:saved?.createdAt,
      name:name.trim()||('Turnier '+new Date().toLocaleDateString('de-DE')),
      startTime,endTime,roundPrio,
      players,format,winMode,
      numCourts,courtNames,
      roundDurationMin:roundDur,
      rounds:[r0],
      current:0,
      finished:false,
      timerSecsLeft:roundDur*60,
      timerRunning:false,
      timerFinished:false,
    });
  };

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <ScreenHeader title={isEdit?'Turnier bearbeiten':saved?.draft?'Entwurf':'Turnier'}
        icon={<TrophyIcon size={40}/>}/>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>

        <SetupHero
          icon={<TrophyIcon size={40}/>}
          title="Turnier erstellen"
          desc="Mehrere Runden, rotierende Partner oder Mexicano-Pairings. Beliebig viele Spieler — lokal oder online via QR-Code."/>

        {/* Turnier-Assistent — geführter Einstieg (nur neu + lokal) */}
        {!isEdit&&mode==='lokal'&&(
          <button onClick={()=>{buzz(6);setWizardOpen(true);}} data-lift
            style={{width:'100%',textAlign:'left',padding:'16px 18px',borderRadius:19,
              background:T.oSoft,border:`1.5px solid ${T.o}`,cursor:'pointer',
              display:'flex',alignItems:'center',gap:14,flexShrink:0}}>
            <span style={{width:44,height:44,borderRadius:14,background:T.o,flexShrink:0,
              display:'flex',alignItems:'center',justifyContent:'center'}} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 17.5 9.5 12 4 6.5M11.5 17.5 17 12l-5.5-5.5"
                  stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span style={{flex:1,minWidth:0}}>
              <span style={{display:'block',color:T.t1,fontSize:17,fontWeight:800,letterSpacing:-.2}}>
                Turnier-Assistent
              </span>
              <span style={{display:'block',color:T.t2,fontSize:12.5,marginTop:3,lineHeight:1.5}}>
                In 6 Schritten zum fertigen Turnier — mit Empfehlungen.
              </span>
            </span>
            <span style={{color:T.o,fontSize:20,fontWeight:900,flexShrink:0}}>›</span>
          </button>
        )}

        {/* Turniername — damit Turniere unter „Live" einzeln gespeichert
            werden (laufende werden nicht mehr überschrieben). */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,padding:'16px 18px'}}>
          <div style={{color:T.o,fontSize:18,fontWeight:800,marginBottom:10}}>Turniername</div>
          <input value={name} onChange={e=>setName(e.target.value)} maxLength={40}
            placeholder="z. B. Sunset Americano · Fr"
            style={{width:'100%',height:46,borderRadius:13,background:T.card2,border:`1px solid ${T.border}`,
              color:T.t1,fontSize:16,fontWeight:600,padding:'0 14px',outline:'none',boxSizing:'border-box'}}/>
          <div style={{color:T.t3,fontSize:11,fontWeight:500,marginTop:8,lineHeight:1.5}}>
            Jedes Turnier wird einzeln gespeichert — laufende werden nicht mehr überschrieben.
          </div>
        </div>

        {/* Modus: Lokal vs Online */}
        {!isEdit&&(
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,padding:'18px'}}>
            <div style={{color:T.o,fontSize:18,fontWeight:800,marginBottom:12}}>Modus</div>
            <div style={{display:'flex',background:T.card2,borderRadius:30,padding:4,gap:4,
              border:`1px solid ${T.border}`}}>
              {[{v:'lokal',l:'Lokal'},{v:'online',l:'Online'}].map(o=>(
                <button key={o.v} onClick={()=>{setMode(o.v);setOnlineError('');}}
                  style={{flex:1,padding:'10px',borderRadius:24,border:'none',cursor:'pointer',
                    background:mode===o.v?T.t4:'transparent',color:T.t1,fontSize:13,fontWeight:600,
                    transition:'background .2s'}}>
                  {o.l}
                </button>
              ))}
            </div>
            <div style={{color:T.t3,fontSize:12,lineHeight:1.6,marginTop:10,fontWeight:500}}>
              {mode==='lokal'
                ?'Alle Spieler auf diesem Gerät. Keine Internet-Verbindung nötig.'
                :'Host erstellt das Turnier, andere Spieler joinen per PIN oder QR-Code von ihren eigenen Geräten.'}
            </div>
          </div>
        )}

        {/* Format — 7 klassische Modi als 2-Spalten-Grid */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,padding:'18px'}}>
          <div style={{color:T.o,fontSize:18,fontWeight:800,marginBottom:12}}>Format</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {Object.entries(FORMATS)
              .filter(([,f])=>mode!=='online'||f.online!==false)
              .map(([id,f])=>(
              <button key={id} onClick={()=>setFormat(id)}
                style={{padding:'11px 10px',borderRadius:13,cursor:'pointer',textAlign:'center',
                  background:format===id?T.oSoft:T.card2,
                  border:`1.5px solid ${format===id?T.o:T.border}`,
                  color:format===id?T.o:T.t1,fontSize:13,fontWeight:700,
                  transition:'background .2s, border-color .2s'}}>
                {f.name}
              </button>
            ))}
          </div>
          <div style={{color:T.t3,fontSize:12,lineHeight:1.6,marginTop:12,fontWeight:500}}>
            {fmtMeta.short}
            {fmtMeta.team&&' Feste Teams nach Listen-Reihenfolge (1+2, 3+4, …) — gerade Spielerzahl nötig.'}
            {fmtMeta.groups&&' Gruppen per A/B-Knopf neben den Namen zuweisen (z. B. Damen/Herren).'}
          </div>
        </div>

        {/* Sieger-Modus */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,padding:'18px'}}>
          <div style={{color:T.o,fontSize:18,fontWeight:800,marginBottom:12}}>Sieger-Modus</div>
          <div style={{display:'flex',background:T.card2,borderRadius:30,padding:4,gap:4,
            border:`1px solid ${T.border}`}}>
            {[{v:'points',l:'Höchste Punkte'},{v:'wins',l:'Meiste Siege'}].map(o=>(
              <button key={o.v} onClick={()=>setWinMode(o.v)}
                style={{flex:1,padding:'10px',borderRadius:24,border:'none',cursor:'pointer',
                  background:winMode===o.v?T.t4:'transparent',color:T.t1,fontSize:13,fontWeight:600,
                  transition:'background .2s'}}>
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* Zeitfenster (nur lokal) — Start/End-Uhrzeit → Rundenzeit-Vorschlag. */}
        {mode==='lokal'&&(
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,padding:'14px 18px'}}>
            <div style={{color:T.t1,fontSize:15,fontWeight:600,marginBottom:2}}>Zeitfenster</div>
            <div style={{color:T.t3,fontSize:11,fontWeight:500,marginBottom:12}}>
              Start- & End-Uhrzeit → schlägt die Rundenzeit vor (− 2 Min Rotation/Runde)
            </div>
            {/* START + ENDE in einer Zeile, aber als feste 2-Spalten-Grid
                mit minmax(0,1fr): so respektiert die native type=time-
                Mindestbreite die Spaltenbreite und steht nicht über den
                Card-Rand. */}
            <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:8}}>
              <div style={{minWidth:0}}>
                <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:.4,marginBottom:5}}>START</div>
                <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}
                  style={{width:'100%',maxWidth:'100%',height:44,borderRadius:12,background:T.card2,
                    border:`1px solid ${T.border}`,color:T.t1,fontSize:15,fontWeight:700,padding:'0 4px',
                    outline:'none',boxSizing:'border-box',colorScheme:'dark',minWidth:0,
                    textAlign:'center',WebkitAppearance:'none',appearance:'none',
                    fontFamily:'inherit',display:'flex',alignItems:'center',
                    justifyContent:'center'}}/>
              </div>
              <div style={{minWidth:0}}>
                <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:.4,marginBottom:5}}>ENDE</div>
                <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}
                  style={{width:'100%',maxWidth:'100%',height:44,borderRadius:12,background:T.card2,
                    border:`1px solid ${T.border}`,color:T.t1,fontSize:15,fontWeight:700,padding:'0 4px',
                    outline:'none',boxSizing:'border-box',colorScheme:'dark',minWidth:0,
                    textAlign:'center',WebkitAppearance:'none',appearance:'none',
                    fontFamily:'inherit',display:'flex',alignItems:'center',
                    justifyContent:'center'}}/>
              </div>
            </div>

            {/* Priorität: Längere Runden ⇄ Jeder gegen Jeden — steuert
                Ziel-/Min-/Max-Rundenzeit des Vorschlags. */}
            <div style={{marginTop:14}}>
              <div style={{color:T.t3,fontSize:11,fontWeight:600,marginBottom:7}}>
                Priorität: Längere Runden oder Jeder gegen Jeden?
              </div>
              <div style={{display:'flex',background:T.card2,borderRadius:30,padding:4,gap:4,
                border:`1px solid ${T.border}`}}>
                {[{v:'length',l:'Längere Runden'},{v:'variety',l:'Jeder gegen Jeden'}].map(o=>(
                  <button key={o.v} onClick={()=>setRoundPrio(o.v)}
                    style={{flex:1,padding:'9px 6px',borderRadius:24,border:'none',cursor:'pointer',
                      background:roundPrio===o.v?T.o:'transparent',
                      color:roundPrio===o.v?'#000':T.t2,fontSize:12,fontWeight:800,
                      transition:'background .2s,color .2s',lineHeight:1.2}}>
                    {o.l}
                  </button>
                ))}
              </div>
              <div style={{color:T.t4,fontSize:10.5,fontWeight:500,marginTop:6,lineHeight:1.55}}>
                {roundPrio==='length'
                  ?'Längere, ruhigere Runden — dafür spielt nicht jeder gegen jeden.'
                  :'Mehr Runden, jeder gegen möglichst jeden — dafür kürzere Runden.'}
              </div>
            </div>
            {suggest&&(
              <div style={{marginTop:12,padding:'10px 12px',borderRadius:12,background:T.oSoft,
                border:`1px solid ${T.o}`,display:'flex',alignItems:'flex-start',gap:8}}>
                <span style={{marginTop:1,display:'inline-flex'}}><StopwatchIcon size={15} color={T.o}/></span>
                <div style={{color:T.t2,fontSize:12,fontWeight:600,lineHeight:1.5,minWidth:0}}>
                  Vorschlag: <span style={{color:T.o,fontWeight:800}}>≈ {suggest.rounds} Runden × {suggest.roundTime} Min</span>
                  {' '}+ {suggest.rotation} Min Rotation · füllt {Math.floor(windowMin/60)} h {windowMin%60} Min.
                  <br/>Bei {suggest.courts} Court{suggest.courts>1?'s':''}: ~{suggest.gamesEach} Spiele/Spieler
                  {suggest.sitOut>0?` · ${suggest.sitOut} pausieren/Runde`:' · keine Pausen'} — alle ±1 gleich oft.
                </div>
              </div>
            )}
            {windowMin&&!suggest&&(
              <div style={{color:T.t3,fontSize:11,fontWeight:500,marginTop:10}}>
                Mind. 4 Spieler eintragen für einen Rundenzeit-Vorschlag.
              </div>
            )}
          </div>
        )}

        {/* Rundendauer — horizontaler Scroll-Picker mit Lupen-Effekt
            auf dem mittleren Minutenwert. Schnelles Swipen statt
            +/- Klick-Klick-Klick. */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
          padding:'14px 18px 16px'}}>
          <div style={{marginBottom:10}}>
            <div style={{color:T.t1,fontSize:15,fontWeight:600}}>Rundendauer{suggest?' · Vorschlag übernommen':''}</div>
            <div style={{color:T.t3,fontSize:11,fontWeight:500,marginTop:1}}>
              Timer pro Runde — wische zur gewünschten Minute
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'center'}}>
            <HorizontalScrollPicker
              key={pickerKey}
              value={roundDur}
              onChange={setRoundDur}
              options={Array.from({length:60},(_,i)=>i+1)}
              bgColor={T.card}
              itemW={67}
              visible={5}
              unit="min"/>
          </div>
        </div>

        {/* Anzahl Courts — zwischen Rundendauer und Spieler-Card. */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
          padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{color:T.t1,fontSize:15,fontWeight:600}}>Anzahl Courts</div>
            <div style={{color:T.t3,fontSize:11,fontWeight:500,marginTop:1}}>
              max. {maxCourts} bei {players.length} Spielern
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <button onClick={()=>setNumCourts(c=>Math.max(1,c-1))}
              style={{width:32,height:32,borderRadius:'50%',background:T.card2,border:`1px solid ${T.border}`,
                color:T.t1,fontSize:16,cursor:'pointer'}}>−</button>
            <span style={{color:T.t1,fontWeight:800,fontSize:18,minWidth:24,textAlign:'center'}}>{numCourts}</span>
            <button onClick={()=>setNumCourts(c=>Math.min(maxCourts,c+1))}
              style={{width:32,height:32,borderRadius:'50%',background:T.card2,border:`1px solid ${T.border}`,
                color:T.t1,fontSize:16,cursor:'pointer'}}>+</button>
          </div>
        </div>

        {/* Court-Namen — werden auf die Matches angewendet. +/- ändert
            die Court-Zahl, Enter springt zum nächsten Court. Standard:
            "Court 1", "Court 2" … */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
          padding:'18px 18px 8px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div style={{color:T.o,fontSize:18,fontWeight:800}}>Court-Namen</div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{color:T.t3,fontSize:12,fontWeight:600}}>{numCourts} Court{numCourts>1?'s':''}</span>
              {numCourts>1&&(
                <button onClick={()=>setNumCourts(c=>Math.max(1,c-1))}
                  title="Court entfernen" aria-label="Court entfernen"
                  style={{width:30,height:30,borderRadius:'50%',background:T.card2,
                    border:`1px solid ${T.border}`,color:T.t1,fontSize:18,fontWeight:800,
                    cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
                    lineHeight:1,paddingBottom:3}}>−</button>
              )}
              <button onClick={()=>setNumCourts(c=>Math.min(maxCourts,c+1))}
                title="Court hinzufügen" aria-label="Court hinzufügen"
                style={{width:30,height:30,borderRadius:'50%',background:T.o,border:'none',
                  color:T.bg,fontSize:18,fontWeight:800,cursor:'pointer',display:'flex',
                  alignItems:'center',justifyContent:'center',lineHeight:1,paddingBottom:2}}>+</button>
            </div>
          </div>
          {Array.from({length:numCourts},(_,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',padding:'10px 0',
              borderBottom:i<numCourts-1?`1px solid ${T.sep}`:'none',gap:10}}>
              <span style={{width:24,height:24,borderRadius:7,flexShrink:0,background:T.oSoft,
                border:`1px solid ${T.o}`,color:T.o,fontSize:11,fontWeight:800,
                display:'flex',alignItems:'center',justifyContent:'center'}}>{i+1}</span>
              <input value={courtNames[i]??''}
                ref={el=>{courtInputRefs.current[i]=el;}}
                onChange={e=>setCourtName(i,e.target.value)}
                onKeyDown={e=>{
                  if(e.key==='Enter'){
                    e.preventDefault();
                    const next=courtInputRefs.current[i+1];
                    if(next) next.focus(); else e.currentTarget.blur();
                  }
                }}
                autoCapitalize="words" autoCorrect="off" spellCheck={false} enterKeyHint="next"
                placeholder={`Court ${i+1}`}
                style={{flex:1,fontSize:16,color:T.t1,fontWeight:500}}/>
            </div>
          ))}
        </div>

        {/* Spieler — nur im Lokal-Modus editierbar.
            Im Online-Modus erscheint stattdessen eine Info-Karte,
            da Spieler nach Erstellung über PIN/QR joinen. */}
        {mode==='lokal'?(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
          padding:'18px 18px 8px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div style={{color:T.o,fontSize:18,fontWeight:800}}>Spieler</div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{color:T.t3,fontSize:12,fontWeight:600}}>{players.length} Spieler</span>
              {/* Minus = nur den ZULETZT hinzugefügten Spieler entfernen
                  (nicht die ganze Liste leeren). Spiegelt das „+" daneben.
                  Nur sichtbar, solange Spieler in der Liste sind. */}
              {players.length>0&&(
                <button onClick={()=>setPlayers(p=>p.slice(0,-1))}
                  title="Letzten Spieler entfernen"
                  aria-label="Letzten Spieler entfernen"
                  style={{width:30,height:30,borderRadius:'50%',
                    background:T.card2,
                    border:`1px solid ${T.border}`,
                    color:T.t1,
                    fontSize:18,fontWeight:800,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    lineHeight:1,paddingBottom:3,transition:'opacity .15s,background .15s'}}
                  onPointerDown={e=>e.currentTarget.style.opacity='.7'}
                  onPointerUp={e=>e.currentTarget.style.opacity='1'}
                  onPointerLeave={e=>e.currentTarget.style.opacity='1'}>−</button>
              )}
              <button onClick={addPlayer}
                title="Spieler hinzufügen"
                aria-label="Spieler hinzufügen"
                style={{width:30,height:30,borderRadius:'50%',
                  background:T.o,border:'none',color:T.bg,
                  fontSize:18,fontWeight:800,cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  lineHeight:1,paddingBottom:2,transition:'opacity .15s'}}
                onPointerDown={e=>e.currentTarget.style.opacity='.7'}
                onPointerUp={e=>e.currentTarget.style.opacity='1'}
                onPointerLeave={e=>e.currentTarget.style.opacity='1'}>+</button>
            </div>
          </div>
          {players.map((p,i)=>(
            <div key={p.id} style={{display:'flex',alignItems:'center',padding:'10px 0',
              borderBottom:i<players.length-1?`1px solid ${T.sep}`:'none',gap:10}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:p.color,flexShrink:0}}/>
              <input value={p.name}
                ref={el=>{playerInputRefs.current[p.id]=el;}}
                onChange={e=>renamePlayer(p.id,e.target.value)}
                onFocus={e=>{
                  // Default-Namen ("Spieler N") räumen wir beim ersten
                  // Tap automatisch ab — sonst tippt der User in den
                  // Platzhalter rein und produziert "Spieler 1Anna".
                  // Echte Namen bleiben unangetastet.
                  if(/^Spieler\s*\d+$/i.test(p.name||'')){
                    renamePlayer(p.id,'');
                    // select() ist nach dem state-Update keinen Sinn —
                    // wir leeren das Feld direkt, der Caret landet
                    // automatisch am Anfang.
                  } else {
                    e.currentTarget.select();
                  }
                }}
                onKeyDown={e=>{
                  // Enter → zum nächsten Spieler-Slot springen, damit
                  // man die Liste in einem Rutsch durchtippen kann.
                  // Beim letzten Slot tut Enter nichts (oder
                  // blur-aus), damit man nicht versehentlich „Start"
                  // triggert. Tab funktioniert weiterhin nativ.
                  if(e.key==='Enter'){
                    e.preventDefault();
                    const next=players[i+1];
                    if(next){
                      focusPlayer(next.id);
                    } else {
                      e.currentTarget.blur();
                    }
                  }
                }}
                autoCapitalize="words" autoCorrect="off" spellCheck={false}
                enterKeyHint="next"
                placeholder={`Spieler ${i+1}`}
                style={{flex:1,fontSize:16,color:T.t1,fontWeight:500}}/>
              {/* Spielstil-Picker — Glyph des gewählten Archetyps, sonst
                  DNA-Platzhalter. Bestimmt das Match-Tier der Paarungen. */}
              <button onClick={()=>setStylePickerFor(p.id)}
                title="Spielstil wählen" aria-label="Spielstil wählen"
                style={{width:34,height:34,borderRadius:'50%',flexShrink:0,padding:0,cursor:'pointer',
                  background:p.style?rgba(PADEL_STYLES[p.style].accent,0.16):T.card2,
                  border:`1.5px solid ${p.style?PADEL_STYLES[p.style].accent:T.border}`,
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                {p.style
                  ?<ArchetypeGlyph type={p.style} active color={PADEL_STYLES[p.style].accent} size={20}/>
                  :<DNAIcon size={16} color={T.t3}/>}
              </button>
              {fmtMeta.groups&&(
                <button onClick={()=>setPlayerGroup(p.id,(p.group||'A')==='B'?'A':'B')}
                  aria-label="Gruppe wechseln" title="Gruppe A/B wechseln"
                  style={{width:26,height:26,borderRadius:9,flexShrink:0,cursor:'pointer',
                    background:(p.group||'A')==='B'?rgba(PCOLS[1],0.16):T.oSoft,
                    border:`1.5px solid ${(p.group||'A')==='B'?PCOLS[1]:T.o}`,
                    color:(p.group||'A')==='B'?PCOLS[1]:T.o,fontSize:11,fontWeight:900,
                    display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>
                  {(p.group||'A')==='B'?'B':'A'}
                </button>
              )}
              {players.length>4&&(
                <button onClick={()=>removePlayer(p.id)}
                  style={{width:22,height:22,borderRadius:'50%',background:T.t4,border:'none',
                    color:T.t1,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',
                    justifyContent:'center',fontWeight:700,lineHeight:1}}>×</button>
              )}
            </div>
          ))}
          {!canStart&&(
            <div style={{color:T.r,fontSize:11,marginTop:10,paddingBottom:6,fontWeight:500}}>
              {players.length<4?'Mindestens 4 Spieler nötig'
                :!teamOk?`${fmtMeta.name} braucht eine gerade Spielerzahl — aktuell ${players.length}.`
                :`Mixicano braucht mind. 2 pro Gruppe (aktuell A ×${grpA} · B ×${grpB}).`}
            </div>
          )}
          {canStart&&format!=='knockout'&&pauseStats&&pauseStats.sitOut>0&&(
            <div style={{color:T.t3,fontSize:11,marginTop:10,paddingBottom:6,fontWeight:500,lineHeight:1.55}}>
              {pauseStats.sitOut} {pauseStats.sitOut===1?'Spieler rotiert':'Spieler rotieren'} pro Runde durch den Pausen-Pool.
              {pauseStats.pauses!=null
                ?<> Bei {roundDur}-Min-Runden: <span style={{color:T.o,fontWeight:800}}>≈ {pauseStats.pauses} Pause{pauseStats.pauses===1?'':'n'} pro Spieler</span> ({pauseStats.rounds} Runden · alle ±1 gleich oft).</>
                :<> <span style={{color:T.t2}}>Setze ein Zeitfenster, um die Pausen pro Spieler zu sehen.</span></>}
            </div>
          )}
        </div>
        ):(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
          padding:'18px'}}>
          <div style={{color:T.o,fontSize:18,fontWeight:800,marginBottom:8}}>Spieler joinen via QR</div>
          <div style={{color:T.t2,fontSize:13,lineHeight:1.55,marginBottom:6}}>
            Nach dem Start öffnest du die Lobby. Dort siehst du PIN + QR-Code.
          </div>
          <div style={{color:T.t3,fontSize:12,lineHeight:1.55}}>
            Du bist als <span style={{color:T.o,fontWeight:700}}>{profile?.name||'Host'}</span> automatisch erster Spieler.
            Andere scannen den QR oder geben den PIN unter „Turnier beitreten" ein.
          </div>
          {onlineError&&(
            <div style={{color:T.r,fontSize:12,marginTop:10,fontWeight:600}}>{onlineError}</div>
          )}
        </div>
        )}
        <div style={{height:100,flexShrink:0}}/>
      </div>

      <MatchBar onHome={onHome} rightButtons={[
        // „Als Entwurf speichern" — nur im Lokal-Neu-Modus (online erzeugt
        // direkt eine Session, edit hat schon ein laufendes Turnier). Ein
        // Entwurf darf unvollständig sein (kein 4-Spieler-Minimum).
        ...((!isEdit&&mode==='lokal')?[{
          icon:(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-3.8L5 20V5.5a1 1 0 0 1 1-1Z"
              stroke={T.t1} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"/></svg>),
          title:'Als Entwurf speichern',
          onClick:()=>onSaveDraft?.({
            id:saved?.id,createdAt:saved?.createdAt,
            name:name.trim(),startTime,endTime,roundPrio,
            players,format,winMode,numCourts,roundDurationMin:roundDur,courtNames,
          }),
          style:{width:56,height:56,background:T.card2,border:`1px solid ${T.border}`,color:T.t1},
        }]:[]),
        {
        icon:creatingOnline?'…':(isEdit?'✓':'Start'),
        disabled:creatingOnline||(mode==='lokal'&&!canStart),
        onClick:async()=>{
          if(creatingOnline) return;
          if(isEdit){
            // Änderungen am laufenden Turnier → erst fragen, ob sie für
            // die aktuelle oder die nächste Runde wirksam werden.
            setEditScopePrompt({players,format,winMode,numCourts,roundDurationMin:roundDur,
              name:name.trim(),startTime,endTime,roundPrio,courtNames});
            return;
          }
          if(mode==='online'){
            // Host erstellt Session und navigiert zur Lobby —
            // Player-Liste wird in der Lobby live via Realtime gefüllt.
            setCreatingOnline(true);setOnlineError('');
            try{
              const hostName=(profile?.name||'').trim()||'Host';
              const pin=await createOnlineTournament({
                format,winMode,numCourts,
                roundDurationMin:roundDur,
                hostName,
                mode:'online',
              });
              onCreateOnline?.(pin);
            }catch(e){
              setOnlineError(e?.message||'Konnte Tournament nicht erstellen.');
            }finally{setCreatingOnline(false);}
            return;
          }
          if(!canStart) return;
          startLocal();
        },
        style:{
          width:56,height:56,
          background:(mode==='online'||canStart)&&!creatingOnline?T.g:T.card2,
          border:`1px solid ${T.border}`,
          color:(mode==='online'||canStart)&&!creatingOnline?T.t1:T.t3,
          fontSize:isEdit?22:13,
          fontWeight:800,
        }
      }]}/>

      {/* Turnier-Assistent — Vollbild-Overlay über dem Formular. */}
      {wizardOpen&&(
        <TournamentWizard
          onClose={()=>setWizardOpen(false)}
          onFinish={()=>{setWizardOpen(false);startLocal();}}
          canStart={canStart}
          format={format} setFormat={setFormat}
          winMode={winMode} setWinMode={setWinMode}
          name={name} setName={setName}
          players={players} addPlayer={addPlayer} addPlayerNamed={addPlayerNamed}
          removePlayer={removePlayer} renamePlayer={renamePlayer} setPlayerGroup={setPlayerGroup}
          numCourts={numCourts} setNumCourts={setNumCourts} maxCourts={maxCourts}
          courtNames={courtNames} setCourtName={setCourtName}
          startTime={startTime} setStartTime={setStartTime}
          endTime={endTime} setEndTime={setEndTime}
          roundPrio={roundPrio} setRoundPrio={setRoundPrio}
          roundDur={roundDur} setRoundDur={setRoundDur}
          suggest={suggest} pauseStats={pauseStats}
          nameHistory={nameHistory}/>
      )}

      {stylePickerFor!=null&&(
        <StylePickerSheet
          current={players.find(p=>p.id===stylePickerFor)?.style||null}
          onSelect={(style)=>setPlayerStyle(stylePickerFor,style)}
          onClose={()=>setStylePickerFor(null)}/>
      )}

      {/* Edit-Scope: gelten die Änderungen ab der nächsten Runde
          (sicher) oder schon für die laufende (neu gemischt)? */}
      {editScopePrompt&&(
        <div onClick={()=>setEditScopePrompt(null)}
          style={{position:'fixed',inset:0,zIndex:400,background:'rgba(0,0,0,.7)',
            backdropFilter:'blur(4px)',display:'flex',alignItems:'center',
            justifyContent:'center',padding:24,animation:'fadeIn .15s ease'}}>
          <div onClick={e=>e.stopPropagation()} className="si"
            style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:23,
              padding:'22px',width:'100%',maxWidth:360}}>
            <div style={{color:T.t1,fontSize:18,fontWeight:800,marginBottom:6}}>Änderungen anwenden</div>
            <div style={{color:T.t3,fontSize:13,lineHeight:1.55,marginBottom:18}}>
              Sollen die Änderungen schon für die aktuelle Runde gelten oder erst
              ab der nächsten? „Aktuelle Runde" mischt die laufende Runde neu
              (Paarungen & Courts werden neu gelost).
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button onClick={()=>{const u=editScopePrompt;setEditScopePrompt(null);onSave(u,'next');}}
                style={{width:'100%',padding:'13px',borderRadius:13,border:'none',background:T.o,
                  color:'#000',fontSize:16,fontWeight:800,cursor:'pointer'}}>
                Ab nächster Runde
              </button>
              <button onClick={()=>{const u=editScopePrompt;setEditScopePrompt(null);onSave(u,'current');}}
                style={{width:'100%',padding:'13px',borderRadius:13,
                  border:`1px solid ${T.border}`,background:T.card2,
                  color:T.t1,fontSize:16,fontWeight:700,cursor:'pointer'}}>
                Aktuelle Runde (neu mischen)
              </button>
              <button onClick={()=>setEditScopePrompt(null)}
                style={{width:'100%',padding:'11px',borderRadius:13,border:'none',background:'none',
                  color:T.t3,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ONLINE TOURNAMENT LOBBY — Host view

   Zeigt PIN + QR-Code, live-updated Spieler-Liste mit Approve/Reject
   Buttons. Bei Klick auf Start: Tournament wird aus der approved-Liste
   gebaut, Session-Status auf 'playing' gesetzt, Host navigiert weiter
   in den lokalen TournamentPlay-Screen.

   QR-URL nutzt qrserver.com (kostenlos, keine zusätzliche Lib). Der
   verlinkte Inhalt ist die App-URL mit ?join=PIN — Scan öffnet die
   App und füllt den PIN in der Join-Maske automatisch.
═══════════════════════════════════════════════════════════════ */
function OnlineTournamentLobby({pin,onHome,onStart,onCancel}){
  const[session,setSession]=useState(null);
  const[err,setErr]=useState('');
  const[busy,setBusy]=useState(false);
  const[copied,setCopied]=useState(''); // ''|'pin'|'link' — Feedback fürs Kopieren

  // Initial laden + Realtime-Subscription.
  useEffect(()=>{
    let alive=true;
    fetchOnlineTournament(pin).then(s=>{if(alive&&s)setSession(s);});
    const unsub=subscribeToTournament(pin,(data)=>{if(alive)setSession(data);});
    return ()=>{alive=false;unsub();};
  },[pin]);

  const participants=session?.participants||[];
  const approved=participants.filter(p=>p.approved);
  const pending=participants.filter(p=>!p.approved);

  // Join-URL für QR-Code. Nutzt window.__BASE__ (siehe vite.config).
  const joinUrl=(()=>{
    if(typeof window==='undefined') return '';
    const base=window.__BASE__||'/';
    return window.location.origin+base+'?join='+pin;
  })();
  const qrSrc=`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(joinUrl)}&size=220x220&bgcolor=ffffff&color=000000&margin=8`;

  // QoL: PIN/Link in die Zwischenablage — mit sichtbarem „Kopiert ✓".
  const copyTimer=useRef(null);
  const copyShare=async(txt,kind)=>{
    try{
      if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(txt);
      else{
        const ta=document.createElement('textarea');
        ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';
        document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
      }
      buzz(10);
      setCopied(kind);
      clearTimeout(copyTimer.current);
      copyTimer.current=setTimeout(()=>setCopied(''),1600);
    }catch(e){}
  };

  const setParticipantApproved=async(id,approved)=>{
    if(!session) return;
    const newParticipants=session.participants.map(p=>
      p.id===id?{...p,approved}:p);
    setSession({...session,participants:newParticipants});
    await updateOnlineTournament(pin,{...session,participants:newParticipants});
  };
  const removeParticipant=async(id)=>{
    if(!session) return;
    const newParticipants=session.participants.filter(p=>p.id!==id);
    setSession({...session,participants:newParticipants});
    await updateOnlineTournament(pin,{...session,participants:newParticipants});
  };

  // Team-Formate (feste Paare) brauchen eine gerade Teilnehmerzahl.
  const lobbyFmt=FORMATS[session?.format]||FORMATS.americano;
  const canStart=approved.length>=4&&(!lobbyFmt.team||approved.length%2===0);
  const startTournament=async()=>{
    if(!canStart||busy) return;
    setBusy(true);setErr('');
    try{
      // Spieler-Liste für die lokale Tournament-Engine bauen.
      const tPlayers=approved.map((p,i)=>({
        id:i,
        name:p.name,
        color:PCOLS[i%PCOLS.length],
        sessionParticipantId:p.id,
      }));
      const lb=calcLeaderboard(tPlayers,[],session.winMode||'points');
      const r0=genRound(session.format||'americano',tPlayers,
        {leaderboard:lb,maxCourts:session.numCourts});
      if(!r0) throw new Error('Zu wenige Teams für dieses Format.');
      const tourneyState={
        players:tPlayers,
        format:session.format,
        winMode:session.winMode||'points',
        numCourts:session.numCourts,
        roundDurationMin:session.roundDurationMin,
        rounds:[r0],
        current:0,
        finished:false,
        timerSecsLeft:(session.roundDurationMin||10)*60,
        timerRunning:false,
        timerFinished:false,
        // Online-Marker, damit später die Score-Submission etc. weiß,
        // dass es eine geteilte Session ist.
        onlinePin:pin,
        isHost:true,
      };
      // Session in DB auf 'playing' setzen + Tournament-State publishen,
      // damit joinende Player den Spielplan sehen.
      await updateOnlineTournament(pin,{
        ...session,
        status:'playing',
        tournamentState:tourneyState,
      });
      onStart(tourneyState);
    }catch(e){
      setErr(e?.message||'Start fehlgeschlagen.');
    }finally{setBusy(false);}
  };

  if(!session){
    return(
      <div style={{height:'100dvh',background:T.bgGrad,display:'flex',
        alignItems:'center',justifyContent:'center'}}>
        <BallSpinner/>
      </div>
    );
  }

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <ScreenHeader title="Online-Lobby" icon={<TrophyIcon size={40}/>}/>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>

        {/* PIN + QR */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
          padding:'18px',textAlign:'center'}}>
          <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.3,
            textTransform:'uppercase',marginBottom:6}}>Beitritts-PIN</div>
          <div style={{color:T.o,fontSize:34,fontWeight:900,letterSpacing:6,
            fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',marginBottom:14}}>
            {pin.toUpperCase()}
          </div>
          {/* QoL: PIN + Beitritts-Link kopieren */}
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:14}}>
            <button onClick={()=>copyShare(pin.toUpperCase(),'pin')}
              style={{padding:'9px 14px',background:copied==='pin'?T.oSoft:T.card2,
                border:`1px solid ${copied==='pin'?T.o:T.border}`,borderRadius:11,
                color:copied==='pin'?T.o:T.t2,fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {copied==='pin'?'Kopiert ✓':'PIN kopieren'}
            </button>
            <button onClick={()=>copyShare(joinUrl,'link')}
              style={{padding:'9px 14px',background:copied==='link'?T.oSoft:T.card2,
                border:`1px solid ${copied==='link'?T.o:T.border}`,borderRadius:11,
                color:copied==='link'?T.o:T.t2,fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {copied==='link'?'Kopiert ✓':'Link kopieren'}
            </button>
          </div>
          <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
            <div style={{width:220,height:220,background:'#fff',padding:8,borderRadius:13}}>
              <img src={qrSrc} alt={`QR für PIN ${pin}`}
                style={{width:'100%',height:'100%',display:'block'}}
                onError={(e)=>{e.currentTarget.style.opacity='0.2';}}/>
            </div>
          </div>
          <div style={{color:T.t3,fontSize:11,lineHeight:1.55}}>
            Andere Spieler scannen den QR oder geben den PIN unter
            <span style={{color:T.t2,fontWeight:700}}> „Turnier beitreten"</span> ein.
          </div>
        </div>

        {/* Teilnehmer */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
          padding:'18px 18px 8px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{color:T.o,fontSize:18,fontWeight:800}}>Teilnehmer</div>
            <span style={{color:T.t3,fontSize:12,fontWeight:600}}>
              {approved.length} bestätigt · {pending.length} wartend
            </span>
          </div>
          {participants.length===0?(
            <div style={{color:T.t3,fontSize:13,padding:'14px 0',textAlign:'center'}}>
              Warte auf erste Teilnehmer…
            </div>
          ):null}
          {participants.map((p,i)=>(
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,
              padding:'12px 0',borderBottom:i<participants.length-1?`1px solid ${T.sep}`:'none'}}>
              <div style={{width:10,height:10,borderRadius:'50%',
                background:p.approved?T.g:T.t4,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:T.t1,fontSize:16,fontWeight:600,
                  display:'flex',alignItems:'center',gap:6}}>
                  {p.name}
                  {p.isHost&&(
                    <span style={{color:T.o,fontSize:9,fontWeight:800,letterSpacing:1,
                      background:T.oSoft,padding:'2px 6px',borderRadius:4}}>HOST</span>
                  )}
                </div>
                {!p.approved&&(
                  <div style={{color:T.t3,fontSize:11,marginTop:1}}>Wartet auf Freigabe</div>
                )}
              </div>
              {!p.isHost&&!p.approved&&(<>
                {/* Tick — approve */}
                <button onClick={()=>setParticipantApproved(p.id,true)}
                  style={{width:34,height:34,borderRadius:'50%',
                    background:`${T.g}22`,border:`1.5px solid ${T.g}`,
                    color:T.g,fontSize:16,fontWeight:900,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    lineHeight:1,flexShrink:0}}
                  title="Annehmen">✓</button>
                {/* Cross — slightly smaller */}
                <button onClick={()=>removeParticipant(p.id)}
                  style={{width:28,height:28,borderRadius:'50%',
                    background:`${T.r}22`,border:`1.5px solid ${T.r}`,
                    color:T.r,fontSize:13,fontWeight:900,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    lineHeight:1,flexShrink:0}}
                  title="Ablehnen">✕</button>
              </>)}
              {!p.isHost&&p.approved&&(
                /* Approved → kann wieder rausgeworfen werden */
                <button onClick={()=>removeParticipant(p.id)}
                  style={{width:26,height:26,borderRadius:'50%',
                    background:T.card2,border:`1px solid ${T.border}`,
                    color:T.t2,fontSize:12,fontWeight:700,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    lineHeight:1,flexShrink:0}}
                  title="Entfernen">×</button>
              )}
            </div>
          ))}
          {approved.length>0&&approved.length<4&&(
            <div style={{color:T.t3,fontSize:11,marginTop:10,paddingBottom:6,fontWeight:500}}>
              Mindestens 4 bestätigte Teilnehmer für den Start nötig.
            </div>
          )}
          {canStart&&(approved.length-(session.numCourts||1)*4)>0&&(
            <div style={{color:T.t3,fontSize:11,marginTop:10,paddingBottom:6,fontWeight:500}}>
              {approved.length-(session.numCourts||1)*4} Spieler rotieren pro Runde durch den Pausen-Pool
            </div>
          )}
        </div>

        {err&&(
          <div style={{background:'rgba(232,69,69,.12)',border:'1px solid rgba(232,69,69,.4)',
            borderRadius:8,padding:'10px 14px',color:'#FF6B6B',fontSize:12,fontWeight:600}}>
            {err}
          </div>
        )}

        <div style={{height:100,flexShrink:0}}/>
      </div>

      <MatchBar onHome={onHome} rightButtons={[
        {icon:'✕',onClick:onCancel,
          style:{width:46,height:46,
            background:'rgba(232,69,69,0.12)',
            border:'1px solid rgba(232,69,69,0.4)',color:T.r,
            fontSize:16,fontWeight:700}},
        {icon:busy?'…':'Start',
          disabled:!canStart||busy,
          onClick:startTournament,
          style:{width:56,height:56,
            background:canStart&&!busy?T.g:T.card2,
            border:`1px solid ${T.border}`,
            color:canStart&&!busy?T.t1:T.t3,
            fontSize:13,fontWeight:800}},
      ]}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOURNAMENT PARTICIPANT VIEW — Read-only Spielplan + Score-Submit

   Wird im JoinTournament-Screen gerendert, sobald die Session auf
   status='playing' steht. Spieler sehen Round-Header + Courts der
   aktuellen Runde, finden ihren eigenen Court (über Name-Match auf
   den team-arrays) und können dort das Ergebnis einreichen.
═══════════════════════════════════════════════════════════════ */
/* ── Score-Modus für Online-Teilnehmer — großer Live-Zähler fürs
   eigene Match. Tippen auf eine Team-Fläche = +1, kleiner −1-Button
   korrigiert. „Einreichen" schickt den Stand als Submission an den Host
   (gleicher Weg wie die Schnell-Eingabe). Vollbild-Overlay über der
   Teilnehmer-Ansicht. */
function ParticipantScoreSheet({court,labelA,labelB,myTeam,initialA,initialB,
  roundIndex,pin,participantId,myName,onClose}){
  const[a,setA]=useState(Number.isFinite(initialA)?initialA:0);
  const[b,setB]=useState(Number.isFinite(initialB)?initialB:0);
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState('');
  const submit=async()=>{
    setBusy(true);setErr('');
    try{
      await submitScore(pin,{roundIndex,courtId:court.id,scoreA:a,scoreB:b,
        submittedBy:participantId,submitterName:myName});
      onClose();
    }catch(e){ setErr(e?.message||'Senden fehlgeschlagen.');setBusy(false); }
  };
  const panel=(team,label,score,setScore)=>{
    const mine=myTeam===team;
    return(
      <div onClick={()=>setScore(s=>Math.min(99,s+1))}
        style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',gap:12,cursor:'pointer',
          background:mine?'var(--oSoft)':T.card,position:'relative',
          border:`2px solid ${mine?T.o:T.border}`,borderRadius:23,padding:'20px 12px'}}>
        {mine&&<div style={{position:'absolute',top:10,color:T.o,fontSize:10,fontWeight:900,
          letterSpacing:1.4,textTransform:'uppercase'}}>Du</div>}
        <div style={{color:T.t2,fontSize:13,fontWeight:700,textAlign:'center',maxWidth:'100%',
          overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',
          lineHeight:1.25}}>{label}</div>
        <div style={{color:mine?T.o:T.t1,fontSize:72,fontWeight:900,lineHeight:1,
          letterSpacing:-2,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>{score}</div>
        <button onClick={e=>{e.stopPropagation();setScore(s=>Math.max(0,s-1));}}
          style={{width:40,height:40,borderRadius:'50%',background:T.card2,
            border:`1px solid ${T.border}`,color:T.t1,fontSize:22,fontWeight:800,
            cursor:'pointer',lineHeight:1}}>−</button>
        <div style={{color:T.t4,fontSize:10,fontWeight:600,letterSpacing:.5}}>Tippen = +1</div>
      </div>
    );
  };
  return(
    <div style={{position:'fixed',inset:0,zIndex:400,background:T.bg,
      display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 14px)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'0 18px 12px'}}>
        <div style={{color:T.o,fontSize:12,fontWeight:900,letterSpacing:1.4,
          textTransform:'uppercase'}}>Score-Modus · Runde {roundIndex+1}</div>
        <button onClick={onClose}
          style={{width:36,height:36,borderRadius:'50%',background:T.card,
            border:`1px solid ${T.border}`,color:T.t1,fontSize:18,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
      </div>
      <div style={{flex:1,display:'flex',gap:12,padding:'0 16px',minHeight:0,alignItems:'stretch'}}>
        {panel('A',labelA,a,setA)}
        <div style={{display:'flex',alignItems:'center',color:T.t3,fontSize:16,
          fontWeight:800,flexShrink:0}}>:</div>
        {panel('B',labelB,b,setB)}
      </div>
      {err&&<div style={{color:'#FF6B6B',fontSize:12,fontWeight:600,textAlign:'center',
        padding:'10px 18px 0'}}>{err}</div>}
      <div style={{padding:'14px 18px calc(env(safe-area-inset-bottom,0px) + 16px)'}}>
        <button onClick={submit} disabled={busy}
          style={{width:'100%',padding:'16px',background:T.o,border:'none',borderRadius:19,
            color:'#000',fontSize:16,fontWeight:800,letterSpacing:.3,
            cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,
            boxShadow:'0 6px 20px var(--oGlow)'}}>
          {busy?'…':`Ergebnis einreichen (${a}:${b})`}
        </button>
      </div>
    </div>
  );
}

function TournamentParticipantView({session,participantId,pin}){
  const ts=session.tournamentState||{};
  const me=session.participants?.find(p=>p.id===participantId);
  const myName=me?.name||'';
  const round=ts.rounds?.[ts.current];
  const roundIndex=ts.current??0;

  // Welcher Court (wenn überhaupt) hat den User? Match anhand
  // sessionParticipantId (bevorzugt) oder Name.
  const playerById=id=>ts.players?.find(p=>p.id===id);
  const myCourt=round?.courts?.find(c=>{
    const all=[...(c.t1||[]),...(c.t2||[])];
    return all.some(pid=>{
      const p=playerById(pid);
      if(!p) return false;
      if(p.sessionParticipantId&&p.sessionParticipantId===participantId) return true;
      return p.name&&p.name.toLowerCase()===myName.toLowerCase();
    });
  });

  // Lokaler Score-Submit State
  const[sA,setSA]=useState('');
  const[sB,setSB]=useState('');
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState('');
  // Score-Modus (Vollbild-Live-Zähler) für das eigene Match
  const[scoreMode,setScoreMode]=useState(false);

  // Habe ich bereits etwas eingereicht?
  const mySubmission=(session.scoreSubmissions||[]).find(s=>
    s.submittedBy===participantId
    &&s.courtId===myCourt?.id
    &&s.roundIndex===roundIndex
  );

  // Wenn Court bereits done ist (Host approved): zeige Approved-Status.
  const courtDone=!!myCourt?.done;

  const submit=async()=>{
    const a=parseInt(sA,10), b=parseInt(sB,10);
    if(isNaN(a)||isNaN(b)||a<0||b<0){
      setErr('Bitte zwei gültige Zahlen eingeben.');return;
    }
    setBusy(true);setErr('');
    try{
      await submitScore(pin,{
        roundIndex,
        courtId:myCourt.id,
        scoreA:a,scoreB:b,
        submittedBy:participantId,
        submitterName:myName,
      });
    }catch(e){
      setErr(e?.message||'Senden fehlgeschlagen.');
    }finally{setBusy(false);}
  };

  const teamLabel=(team)=>(team||[])
    .map(pid=>playerById(pid)?.name||'?')
    .join(' & ');
  const myTeam=myCourt?(
    myCourt.t1?.some(pid=>{
      const p=playerById(pid);
      return p?.sessionParticipantId===participantId||p?.name?.toLowerCase()===myName.toLowerCase();
    })?'A':'B'
  ):null;

  // Ready-Check Status
  const rc=session.readyCheck;
  const rcActive=rc&&rc.roundIndex===roundIndex;
  const iConfirmed=rcActive&&(rc.confirmedBy||[]).includes(participantId);
  const confirmingReady=useRef(false);
  const doConfirmReady=async()=>{
    if(confirmingReady.current) return;
    confirmingReady.current=true;
    try{await confirmReady(pin,participantId);}catch{}
    finally{confirmingReady.current=false;}
  };

  // Wenn der Host das Turnier beendet hat, sehen die Teilnehmer
  // das Endstand-Layout (Winner + komplettes Leaderboard) — gleicher
  // Inhalt wie TournamentLeaderboard für die lokale Variante.
  if(ts.finished&&ts.players&&ts.rounds){
    const lb=calcLeaderboard(ts.players,ts.rounds,ts.winMode||'points');
    const sortedLb=lb.sort((a,b)=>ts.winMode==='points'
      ?b.totalPts-a.totalPts||b.totalWins-a.totalWins
      :b.totalWins-a.totalWins||b.totalPts-a.totalPts);
    const winner=sortedLb[0];
    const myRow=sortedLb.find(p=>{
      // Match by sessionParticipantId, fall back to name.
      return (p.sessionParticipantId===participantId)
        ||(p.name&&myName&&p.name.toLowerCase()===myName.toLowerCase());
    });
    const myRank=myRow?sortedLb.indexOf(myRow)+1:null;
    return(<>
      {/* Winner Hero */}
      <div className="fi" style={{background:T.card,border:`1px solid ${T.o}`,borderRadius:23,
        padding:'24px 22px',textAlign:'center'}}>
        <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.5,
          textTransform:'uppercase',marginBottom:6}}>Turnier beendet</div>
        <div style={{marginBottom:8,display:'flex',justifyContent:'center'}}><MedalIcon size={50} rank={1}/></div>
        <div style={{fontSize:24,fontWeight:800,color:T.t1,letterSpacing:-.3}}>
          {winner?.name||'?'}
        </div>
        <div style={{fontSize:16,color:T.o,fontWeight:700,marginTop:4}}>
          {ts.winMode==='wins'?`${winner?.totalWins??0} Siege`:`${winner?.totalPts??0} Punkte`}
        </div>
        {myRow&&myRank&&winner&&myRow.id!==winner.id&&(
          <div style={{marginTop:14,padding:'8px 12px',background:T.card2,
            borderRadius:13,color:T.t2,fontSize:12,fontWeight:600,display:'inline-block'}}>
            Du bist auf Platz <span style={{color:T.o,fontWeight:800}}>#{myRank}</span> gelandet.
          </div>
        )}
      </div>

      {/* Full Leaderboard */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
        overflow:'hidden'}}>
        {sortedLb.map((p,i)=>{
          const isMe=myRow&&p.id===myRow.id;
          return(
            <div key={p.id} style={{display:'flex',alignItems:'center',padding:'12px 16px',
              gap:10,borderBottom:i<sortedLb.length-1?`1px solid ${T.sep}`:'none',
              background:isMe?T.oSoft:'transparent'}}>
              <div style={{width:24,fontSize:i<3?16:13,fontWeight:800,
                color:i===0?T.o:i===1?T.t2:i===2?T.t3:T.t3,textAlign:'center'}}>
                {i<3?<MedalIcon size={20} rank={i+1}/>:`${i+1}`}
              </div>
              <div style={{width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:T.t1,fontSize:16,fontWeight:isMe||i===0?700:600,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {p.name}{isMe?' (Du)':''}
                </div>
                <div style={{color:T.t3,fontSize:11}}>
                  {p.played} Spiele · {p.wins}S {p.losses}N
                  {p.sitOut>0&&<> · {p.sitOut} Pause{p.sitOut>1?'n':''}</>}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{color:T.o,fontSize:16,fontWeight:800}}>
                  {ts.winMode==='wins'?p.totalWins:p.totalPts}
                </div>
                {((ts.winMode==='wins'?p.bonusWins:p.bonusPts)>0)&&(
                  <div style={{color:T.t3,fontSize:10,fontWeight:600}}>
                    +{ts.winMode==='wins'?p.bonusWins:p.bonusPts} Pause
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>);
  }

  return(<>
    {/* Ready-Check Banner */}
    {rcActive&&!iConfirmed&&(
      <div className="fi" style={{background:T.oSoft,border:`1.5px solid ${T.o}`,
        borderRadius:19,padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.3,
            textTransform:'uppercase',marginBottom:2}}>Bereit?</div>
          <div style={{color:T.t1,fontSize:13,fontWeight:600}}>
            Host wartet auf deine Bereitschaft für Runde {roundIndex+1}.
          </div>
        </div>
        <button onClick={doConfirmReady}
          style={{padding:'10px 18px',background:T.o,color:'#000',border:'none',
            borderRadius:13,fontSize:13,fontWeight:800,cursor:'pointer',
            boxShadow:'0 4px 14px var(--oGlow)'}}>
          Bereit ✓
        </button>
      </div>
    )}
    {rcActive&&iConfirmed&&(
      <div style={{background:T.card,border:`1px solid ${T.g}`,borderRadius:19,
        padding:'10px 14px',color:T.g,fontSize:12,fontWeight:700,textAlign:'center'}}>
        ✓ Du bist bereit — warte auf andere Spieler
      </div>
    )}

    {/* Round-Header */}
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
      padding:'16px 18px'}}>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}>
        <div>
          <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.3,
            textTransform:'uppercase',marginBottom:2}}>
            {(FORMATS[ts.format]||FORMATS.americano).name}
          </div>
          <div style={{color:T.t1,fontSize:20,fontWeight:800,letterSpacing:-.3}}>
            Runde {roundIndex+1}{ts.rounds?.length>1?` / ${ts.rounds.length}`:''}
          </div>
        </div>
        {typeof ts.timerSecsLeft==='number'&&(
          <div style={{color:ts.timerFinished?T.r:T.o,fontSize:20,fontWeight:800,
            fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',letterSpacing:1}}>
            {Math.floor(ts.timerSecsLeft/60)}:{String(ts.timerSecsLeft%60).padStart(2,'0')}
          </div>
        )}
      </div>
    </div>

    {/* Eigener Court — Score Submission */}
    {myCourt&&(
      <div style={{background:T.card,border:`1px solid ${myTeam?T.o:T.border}`,
        borderRadius:19,padding:'18px'}}>
        <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.3,
          textTransform:'uppercase',marginBottom:10}}>Dein Match</div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:myTeam==='A'?T.o:T.t1,fontSize:16,fontWeight:myTeam==='A'?800:600,
              textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}>
              {teamLabel(myCourt.t1)}
            </div>
          </div>
          <div style={{color:T.t3,fontSize:12,fontWeight:700,padding:'0 6px'}}>vs</div>
          <div style={{flex:1,minWidth:0,textAlign:'right'}}>
            <div style={{color:myTeam==='B'?T.o:T.t1,fontSize:16,fontWeight:myTeam==='B'?800:600,
              textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}>
              {teamLabel(myCourt.t2)}
            </div>
          </div>
        </div>
        {/* Score-Modus — Live-Zähler fürs eigene Match (öffnet Vollbild) */}
        {!courtDone&&(
          <button onClick={()=>setScoreMode(true)}
            style={{width:'100%',marginBottom:14,padding:'13px',background:T.o,border:'none',
              borderRadius:13,color:'#000',fontSize:16,fontWeight:800,letterSpacing:.3,
              cursor:'pointer',boxShadow:'0 4px 14px var(--oGlow)',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <span style={{fontSize:12}}>▶</span> Score-Modus öffnen
          </button>
        )}
        {courtDone?(
          <div style={{background:`${T.g}15`,border:`1px solid ${T.g}`,borderRadius:13,
            padding:'12px',textAlign:'center'}}>
            <div style={{color:T.g,fontSize:11,fontWeight:800,letterSpacing:1,
              textTransform:'uppercase',marginBottom:4}}>Vom Host bestätigt</div>
            <div style={{color:T.t1,fontSize:24,fontWeight:900,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>
              {myCourt.s1??0} : {myCourt.s2??0}
            </div>
          </div>
        ):mySubmission?(
          <div style={{background:T.card2,border:`1px dashed ${T.o}`,borderRadius:13,
            padding:'12px',textAlign:'center'}}>
            <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1,
              textTransform:'uppercase',marginBottom:4}}>Wartet auf Host</div>
            <div style={{color:T.t1,fontSize:22,fontWeight:900,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',marginBottom:8}}>
              {mySubmission.scoreA} : {mySubmission.scoreB}
            </div>
            <button onClick={()=>{setSA(String(mySubmission.scoreA));setSB(String(mySubmission.scoreB));}}
              style={{background:'none',border:'none',color:T.t3,fontSize:11,fontWeight:600,
                textDecoration:'underline',cursor:'pointer'}}>
              Korrigieren
            </button>
          </div>
        ):null}
        {!courtDone&&(
          <div style={{marginTop:mySubmission?12:0}}>
            <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.2,
              textTransform:'uppercase',marginBottom:8}}>
              {mySubmission?'Neuer Vorschlag':'Oder direkt eintragen'}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
              <input type="number" inputMode="numeric" min="0"
                value={sA} onChange={e=>{setSA(e.target.value);setErr('');}}
                placeholder="0"
                style={{flex:1,minWidth:0,width:0,padding:'12px',
                  background:T.card2,boxSizing:'border-box',
                  border:`1px solid ${T.border}`,borderRadius:13,
                  color:T.t1,fontSize:20,fontWeight:800,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',
                  textAlign:'center',outline:'none'}}/>
              <span style={{color:T.t3,fontSize:18,fontWeight:700,flexShrink:0}}>:</span>
              <input type="number" inputMode="numeric" min="0"
                value={sB} onChange={e=>{setSB(e.target.value);setErr('');}}
                placeholder="0"
                style={{flex:1,minWidth:0,width:0,padding:'12px',
                  background:T.card2,boxSizing:'border-box',
                  border:`1px solid ${T.border}`,borderRadius:13,
                  color:T.t1,fontSize:20,fontWeight:800,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',
                  textAlign:'center',outline:'none'}}/>
            </div>
            {err&&<div style={{color:'#FF6B6B',fontSize:11,fontWeight:600,marginTop:6}}>{err}</div>}
            <button onClick={submit} disabled={busy}
              style={{width:'100%',marginTop:10,padding:'12px',background:T.o,
                border:'none',borderRadius:13,color:'#000',fontSize:16,fontWeight:800,
                cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,
                boxShadow:'0 4px 14px var(--oGlow)'}}>
              {busy?'…':(mySubmission?'Neu einreichen':'Ergebnis einreichen')}
            </button>
          </div>
        )}
      </div>
    )}

    {/* Andere Courts (read-only) */}
    {round&&round.courts.length>1&&(
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
        padding:'14px 18px'}}>
        <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.3,
          textTransform:'uppercase',marginBottom:8}}>Weitere Courts</div>
        {round.courts.filter(c=>c.id!==myCourt?.id).map(c=>(
          <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,
            padding:'10px 0',borderTop:`1px solid ${T.sep}`}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.t1,fontSize:12,fontWeight:600,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {teamLabel(c.t1)}
              </div>
              <div style={{color:T.t2,fontSize:11,fontWeight:500,marginTop:1,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                vs {teamLabel(c.t2)}
              </div>
            </div>
            <div style={{color:c.done?T.g:T.t3,fontSize:13,fontWeight:700,
              fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',flexShrink:0}}>
              {c.done?`${c.s1??0} : ${c.s2??0}`:'–'}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Pausen-Spieler */}
    {round?.sitOut?.length>0&&(
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
        padding:'14px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:8}}>
          <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,background:T.oSoft,
            border:`1px solid ${T.o}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <PauseIcon size={12} color={T.o}/>
          </div>
          <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.3,
            textTransform:'uppercase'}}>Pausiert diese Runde</div>
        </div>
        <div style={{color:T.t2,fontSize:13,fontWeight:500}}>
          {round.sitOut.map(pid=>playerById(pid)?.name||'?').join(' · ')}
        </div>
      </div>
    )}

    {/* Score-Modus Vollbild-Overlay */}
    {scoreMode&&myCourt&&!courtDone&&(
      <ParticipantScoreSheet
        court={myCourt}
        labelA={teamLabel(myCourt.t1)}
        labelB={teamLabel(myCourt.t2)}
        myTeam={myTeam}
        initialA={mySubmission?mySubmission.scoreA:0}
        initialB={mySubmission?mySubmission.scoreB:0}
        roundIndex={roundIndex}
        pin={pin}
        participantId={participantId}
        myName={myName}
        onClose={()=>setScoreMode(false)}/>
    )}
  </>);
}

/* QR-Scanner Modal — öffnet die Kamera, decodet QR-Codes via
   qr-scanner Lib. Auf Match wird onResult mit dem decoded Text
   gerufen und der Stream sofort gestoppt. */
function QRScannerModal({onResult,onClose}){
  const videoRef=useRef(null);
  const scannerRef=useRef(null);
  const[err,setErr]=useState('');

  useEffect(()=>{
    let mounted=true;
    let scanner;
    (async()=>{
      try{
        // qr-scanner ist ~12kB minified, lädt einen Worker zum Decoden.
        const mod=await import('qr-scanner');
        const QrScanner=mod.default;
        if(!videoRef.current||!mounted) return;
        scanner=new QrScanner(videoRef.current,(result)=>{
          const text=typeof result==='string'?result:result?.data;
          if(text) onResult(text);
        },{
          highlightScanRegion:true,
          highlightCodeOutline:true,
          preferredCamera:'environment',
        });
        scannerRef.current=scanner;
        await scanner.start();
      }catch(e){
        if(mounted){
          setErr(e?.message||'Kamera konnte nicht gestartet werden.');
        }
      }
    })();
    return()=>{
      mounted=false;
      try{scanner?.stop();scanner?.destroy();}catch{}
    };
  },[onResult]);

  return(
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'#000',
      display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'calc(env(safe-area-inset-top,0px) + 14px) 18px 14px',
        background:'rgba(0,0,0,.7)',color:'#fff'}}>
        <div style={{fontSize:16,fontWeight:700,letterSpacing:.3}}>QR-Code scannen</div>
        <button onClick={onClose}
          style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.15)',
            border:'none',color:'#fff',fontSize:18,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
      </div>
      <div style={{flex:1,position:'relative',overflow:'hidden'}}>
        <video ref={videoRef} playsInline muted autoPlay
          style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        {err&&(
          <div style={{position:'absolute',inset:0,display:'flex',
            alignItems:'center',justifyContent:'center',padding:24}}>
            <div style={{background:T.card,border:`1px solid ${T.r}`,
              borderRadius:19,padding:'20px',maxWidth:320,textAlign:'center'}}>
              <div style={{color:T.r,fontSize:16,fontWeight:800,marginBottom:8}}>
                Kamera nicht verfügbar
              </div>
              <div style={{color:T.t2,fontSize:12,lineHeight:1.55}}>
                {err}
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{padding:'14px 18px calc(env(safe-area-inset-bottom,0px) + 14px)',
        background:'rgba(0,0,0,.7)',color:'#fff',fontSize:12,textAlign:'center',
        lineHeight:1.5}}>
        Halte den QR-Code des Hosts in den Rahmen.
      </div>
    </div>
  );
}

/* Hilfsfunktion: PIN aus QR-Text extrahieren. Akzeptiert sowohl die
   App-URL mit ?join=PIN als auch einen rohen PIN-String. */
function extractPinFromScan(text){
  if(!text) return null;
  try{
    const u=new URL(text);
    const p=u.searchParams.get('join');
    if(p) return p.trim().toLowerCase();
  }catch{}
  const clean=String(text).trim().toLowerCase();
  if(/^[a-z0-9]{4,12}$/.test(clean)) return clean;
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   JOIN TOURNAMENT (Player-Side)

   Flow:
   1. PIN-Eingabe (kann auch via ?join=PIN URL vorbelegt sein)
   2. Username eingeben (prefilled aus profile)
   3. Joinen → wartet auf Host-Freigabe (Realtime)
   4. Wenn Host startet (status='playing') → TournamentParticipantView
═══════════════════════════════════════════════════════════════ */
function JoinTournament({initialPin,profile,onHome,onJoin,restored}){
  const[pin,setPin]=useState((restored?.pin||initialPin||'').toLowerCase());
  const[name,setName]=useState(restored?.name||profile?.name||'');
  // Wenn wir mit gespeichertem participantId starten, springen wir
  // direkt in waiting/approved/playing — die Subscription cleart das.
  const[status,setStatus]=useState(restored?.participantId?'waiting':'input');
  const[participantId,setParticipantId]=useState(restored?.participantId||null);
  const[session,setSession]=useState(null);
  const[err,setErr]=useState('');
  const[scannerOpen,setScannerOpen]=useState(false);

  const onScanResult=useCallback((text)=>{
    const found=extractPinFromScan(text);
    if(found){
      setPin(found);
      setErr('');
      setScannerOpen(false);
    }
  },[]);

  // Sobald wir gejoint sind: Realtime-Subscription auf die Session.
  useEffect(()=>{
    if(status!=='waiting'&&status!=='approved'&&status!=='playing') return;
    const unsub=subscribeToTournament(pin,(data)=>{
      setSession(data);
      const me=(data.participants||[]).find(p=>p.id===participantId);
      if(!me){
        setStatus('rejected');
        return;
      }
      if(data.status==='playing'){
        setStatus('playing');
        return;
      }
      setStatus(me.approved?'approved':'waiting');
    });
    return ()=>unsub();
  },[status,pin,participantId]);

  const submitJoin=async()=>{
    const p=(pin||'').trim().toLowerCase();
    const n=(name||'').trim();
    if(!p||p.length<4){setErr('Bitte PIN eingeben.');return;}
    if(!n){setErr('Bitte Namen eingeben.');return;}
    setStatus('joining');setErr('');
    try{
      const id=await joinOnlineTournament(p,n);
      setParticipantId(id);
      setPin(p);
      setStatus('waiting');
      // App-State persistieren, damit der Beitritt unter Live
      // sichtbar bleibt und beim Reload wiederhergestellt wird.
      onJoin?.({pin:p,participantId:id,name:n});
    }catch(e){
      setErr(e?.message||'Beitritt fehlgeschlagen.');
      setStatus('input');
    }
  };

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <ScreenHeader title="Turnier beitreten" icon={<JoinIcon size={36}/>}/>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>
        {status==='input'||status==='joining'?(<>
          <SetupHero
            icon={<JoinIcon size={36}/>}
            title="Beitreten"
            desc="Scan den QR-Code des Hosts oder tippe den PIN ein, um in ein laufendes Online-Turnier einzusteigen."/>
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
            padding:'18px'}}>
            {/* QR-Code Scanner Button */}
            <button onClick={()=>setScannerOpen(true)}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                background:T.oSoft,border:`1px solid ${T.o}`,borderRadius:13,
                padding:'14px 16px',color:T.o,fontSize:16,fontWeight:700,
                cursor:'pointer',marginBottom:14,letterSpacing:.2}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="6" height="6" rx="1"/>
                <rect x="15" y="3" width="6" height="6" rx="1"/>
                <rect x="3" y="15" width="6" height="6" rx="1"/>
                <line x1="14" y1="14" x2="21" y2="14"/>
                <line x1="14" y1="18" x2="17" y2="18"/>
                <line x1="14" y1="21" x2="21" y2="21"/>
              </svg>
              <span>QR-Code scannen</span>
            </button>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <div style={{flex:1,height:1,background:T.border}}/>
              <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.5}}>ODER</div>
              <div style={{flex:1,height:1,background:T.border}}/>
            </div>
            <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
              textTransform:'uppercase',marginBottom:6}}>PIN</div>
            <input value={pin}
              onChange={e=>{setPin(e.target.value.toLowerCase());setErr('');}}
              placeholder="z.B. j3k7p2"
              autoCapitalize="off" autoCorrect="off" spellCheck={false}
              maxLength={8}
              style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:18,
                fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',letterSpacing:4,
                outline:'none',boxSizing:'border-box',textAlign:'center'}}/>
            <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
              textTransform:'uppercase',marginTop:14,marginBottom:6}}>Dein Name</div>
            <input value={name}
              onChange={e=>{setName(e.target.value);setErr('');}}
              placeholder="Wie du im Tournament heißt"
              autoCapitalize="words" autoCorrect="off" spellCheck={false}
              style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
                outline:'none',boxSizing:'border-box'}}/>
            {err&&(
              <div style={{color:'#FF6B6B',fontSize:12,fontWeight:600,marginTop:10}}>
                {err}
              </div>
            )}
          </div>
        </>):null}

        {status==='waiting'&&(
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
            padding:'24px 20px',textAlign:'center'}}>
            <div style={{display:'flex',justifyContent:'center',marginBottom:18}}>
              <BallSpinner/>
            </div>
            <div style={{color:T.t1,fontSize:16,fontWeight:800,marginBottom:6}}>
              Warte auf den Host…
            </div>
            <div style={{color:T.t3,fontSize:12,lineHeight:1.55,maxWidth:280,margin:'0 auto'}}>
              Du bist als <span style={{color:T.o,fontWeight:700}}>{name}</span> beigetreten.
              Sobald der Host dich freigegeben hat, geht's los.
            </div>
          </div>
        )}

        {status==='approved'&&(
          <div style={{background:T.card,border:`1px solid ${T.g}`,borderRadius:19,
            padding:'24px 20px',textAlign:'center'}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:`${T.g}22`,
              border:`2px solid ${T.g}`,display:'flex',alignItems:'center',justifyContent:'center',
              margin:'0 auto 16px'}}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke={T.g} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{color:T.t1,fontSize:16,fontWeight:800,marginBottom:6}}>
              Freigegeben!
            </div>
            <div style={{color:T.t3,fontSize:12,lineHeight:1.55,maxWidth:280,margin:'0 auto'}}>
              Warte noch kurz, bis der Host das Turnier startet —
              {session?.participants?.filter(p=>p.approved).length||0} Spieler bereit.
            </div>
          </div>
        )}

        {status==='playing'&&session?.tournamentState&&(
          <TournamentParticipantView
            session={session}
            participantId={participantId}
            pin={pin}/>
        )}

        {status==='rejected'&&(
          <div style={{background:T.card,border:`1px solid ${T.r}`,borderRadius:19,
            padding:'24px 20px',textAlign:'center'}}>
            <div style={{color:T.r,fontSize:42,fontWeight:900,marginBottom:8}}>✕</div>
            <div style={{color:T.t1,fontSize:16,fontWeight:800,marginBottom:6}}>
              Vom Host entfernt
            </div>
            <div style={{color:T.t3,fontSize:12,lineHeight:1.55,maxWidth:280,margin:'0 auto',marginBottom:14}}>
              Frag den Host kurz, oder versuche es mit einem anderen PIN.
            </div>
            <button onClick={()=>{
                onJoin?.(null);  // persisted Join löschen
                setStatus('input');setParticipantId(null);
              }}
              style={{padding:'10px 20px',background:T.oSoft,border:`1px solid ${T.o}`,
                borderRadius:13,color:T.o,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              Erneut versuchen
            </button>
          </div>
        )}

        <div style={{height:100,flexShrink:0}}/>
      </div>

      <MatchBar onHome={onHome} rightButtons={[
        (status==='input'||status==='joining')?{
          icon:status==='joining'?'…':'Join',
          disabled:status==='joining',
          onClick:submitJoin,
          style:{width:56,height:56,background:T.g,
            border:`1px solid ${T.border}`,
            color:T.t1,fontSize:13,fontWeight:800}
        }:null,
      ].filter(Boolean)}/>

      {scannerOpen&&(
        <QRScannerModal
          onResult={onScanResult}
          onClose={()=>setScannerOpen(false)}/>
      )}
    </div>
  );
}

/* Eine eingereichte Score-Anfrage in der Host-Übersicht.
   Host kann die vorgeschlagenen Scores editieren und dann approven,
   oder die ganze Submission verwerfen. */
function PendingSubmissionRow({sub,tourney,onApprove,onReject}){
  const[a,setA]=useState(sub.scoreA);
  const[b,setB]=useState(sub.scoreB);
  const[busy,setBusy]=useState(false);
  const round=tourney.rounds[sub.roundIndex];
  const court=round?.courts?.find(c=>c.id===sub.courtId);
  const playerById=id=>tourney.players?.find(p=>p.id===id);
  const teamLabel=(team)=>(team||[])
    .map(pid=>playerById(pid)?.name||'?')
    .join(' & ');
  const ci=round?.courts?.findIndex(c=>c.id===sub.courtId);
  const handle=async(fn)=>{
    if(busy) return;
    setBusy(true);
    try{await fn();}catch{}
    finally{setBusy(false);}
  };
  return(
    <div style={{padding:'10px 0',borderTop:`1px solid ${T.sep}`}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        marginBottom:6,fontSize:11,color:T.t3,fontWeight:600}}>
        <span>Court {ci!=null?ci+1:'?'} · von <span style={{color:T.t1,fontWeight:700}}>{sub.submitterName}</span></span>
      </div>
      {court&&(
        <div style={{color:T.t2,fontSize:12,marginBottom:8,lineHeight:1.55}}>
          {teamLabel(court.t1)} <span style={{color:T.t3}}>vs</span> {teamLabel(court.t2)}
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
        <input type="number" inputMode="numeric" min="0" value={a}
          onChange={e=>setA(parseInt(e.target.value)||0)}
          style={{flex:1,minWidth:0,width:0,padding:'8px',
            background:T.card2,boxSizing:'border-box',
            border:`1px solid ${T.border}`,
            borderRadius:8,color:T.t1,fontSize:18,fontWeight:800,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',
            textAlign:'center',outline:'none'}}/>
        <span style={{color:T.t3,fontSize:16,fontWeight:700,flexShrink:0}}>:</span>
        <input type="number" inputMode="numeric" min="0" value={b}
          onChange={e=>setB(parseInt(e.target.value)||0)}
          style={{flex:1,minWidth:0,width:0,padding:'8px',
            background:T.card2,boxSizing:'border-box',
            border:`1px solid ${T.border}`,
            borderRadius:8,color:T.t1,fontSize:18,fontWeight:800,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',
            textAlign:'center',outline:'none'}}/>
        <button onClick={()=>{buzz(18);handle(()=>onApprove(sub,a,b));}} disabled={busy}
          title="Bestätigen"
          style={{width:38,height:38,borderRadius:'50%',
            background:`${T.g}22`,border:`1.5px solid ${T.g}`,
            color:T.g,fontSize:16,fontWeight:900,cursor:busy?'not-allowed':'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          ✓
        </button>
        <button onClick={()=>handle(()=>onReject(sub.id))} disabled={busy}
          title="Verwerfen"
          style={{width:30,height:30,borderRadius:'50%',
            background:`${T.r}22`,border:`1.5px solid ${T.r}`,
            color:T.r,fontSize:13,fontWeight:900,cursor:busy?'not-allowed':'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          ✕
        </button>
      </div>
    </div>
  );
}

/* Ready-Check Karte für den Host. Zeigt aktuellen Stand und Button
   zum Auslösen (oder Schließen) eines Ready-Checks pro Runde. */
function ReadyCheckHostCard({tourney,participants,readyCheck,onBroadcast,onDismiss}){
  const active=readyCheck&&readyCheck.roundIndex===tourney.current;
  const approved=participants.filter(p=>p.approved);
  const confirmed=active?(readyCheck.confirmedBy||[]).length:0;
  const total=approved.filter(p=>!p.isHost).length;
  const allReady=active&&confirmed>=total&&total>0;

  if(!active){
    return(
      <div style={{background:T.card,border:`1px dashed ${T.border}`,borderRadius:19,
        padding:'14px 16px',display:'flex',alignItems:'center',gap:10}}>
        <div style={{flex:1,color:T.t3,fontSize:12,fontWeight:500}}>
          Vor Rundenstart Bereitschaft der Spieler abfragen?
        </div>
        <button onClick={onBroadcast}
          style={{padding:'8px 14px',background:T.oSoft,border:`1px solid ${T.o}`,
            borderRadius:8,color:T.o,fontSize:11,fontWeight:800,letterSpacing:.3,
            cursor:'pointer',whiteSpace:'nowrap'}}>
          Ready-Check senden
        </button>
      </div>
    );
  }
  return(
    <div style={{background:T.card,border:`1.5px solid ${allReady?T.g:T.o}`,borderRadius:19,
      padding:'14px 16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        marginBottom:8}}>
        <div style={{color:allReady?T.g:T.o,fontSize:11,fontWeight:800,letterSpacing:1.3,
          textTransform:'uppercase'}}>
          {allReady?'Alle bereit ✓':'Ready-Check läuft'}
        </div>
        <div style={{color:T.t2,fontSize:12,fontWeight:700}}>
          {confirmed} / {total}
        </div>
      </div>
      <div style={{color:T.t3,fontSize:11,lineHeight:1.55,marginBottom:8}}>
        {approved.filter(p=>!p.isHost).map(p=>{
          const ok=(readyCheck.confirmedBy||[]).includes(p.id);
          return (
            <span key={p.id} style={{
              display:'inline-block',marginRight:8,marginBottom:4,
              padding:'2px 8px',borderRadius:13,fontSize:11,fontWeight:600,
              background:ok?`${T.g}22`:T.card2,
              color:ok?T.g:T.t3,
              border:`1px solid ${ok?T.g:T.border}`,
            }}>{ok?'✓ ':''}{p.name}</span>
          );
        })}
      </div>
      <button onClick={onDismiss}
        style={{background:'none',border:'none',color:T.t3,fontSize:11,fontWeight:600,
          textDecoration:'underline',cursor:'pointer',padding:'4px 0'}}>
        Ready-Check beenden
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOURNAMENT COURT CARD

   Animierter Court-Eintrag im Runden-View. Zeigt pro Court:
     - Court-Nummer (groß, Akzent-Farbe)
     - Live-Pulse oder Fertig-Häkchen rechts oben
     - Team A links: Spieler-Avatare (Initial-Pill) + Namen, Farbpunkt
     - „VS" zwischen den Teams, dauerhaft pulsierend solange offen
     - Team B rechts: gespiegelt
     - Score-Felder mittig unten, gross + Score-Pop-Animation bei
       Punktänderung
     - Confirm-/Edit-Button am unteren Rand
   Staggered Entrance via animationDelay (50ms × Court-Index).
═══════════════════════════════════════════════════════════════ */
/* ── Lineup-Editor — Host tauscht die Spieler eines Courts. Auswahl
   aus ALLEN Turnier-Spielern (inkl. Pause). Tausch ist immer 1:1
   (conserving): wählt man einen Spieler, der schon woanders spielt,
   wechseln beide Positionen; kommt er aus der Pause, wandert der
   Ersetzte in die Pause. sitOut wird in TournamentPlay neu berechnet. */
function LineupEditSheet({court,courtIndex,players,round,onAssign,onClose}){
  const[pick,setPick]=useState(null); // {teamKey,idx} | null
  const playerById=id=>players.find(p=>p.id===id);
  const statusOf=(pid)=>{
    const ci=round.courts.findIndex(c=>(c.t1||[]).includes(pid)||(c.t2||[]).includes(pid));
    if(ci<0) return {label:'Pause',color:T.t3};
    if(round.courts[ci].id===court.id) return {label:`Court ${courtIndex+1}`,color:T.o};
    return {label:`Court ${ci+1}`,color:T.t2};
  };
  const slotRow=(teamKey,idx)=>{
    const p=playerById(court[teamKey]?.[idx]);
    return(
      <button key={`${teamKey}-${idx}`} onClick={()=>setPick({teamKey,idx})}
        style={{display:'flex',alignItems:'center',gap:10,width:'100%',
          background:T.card2,border:`1px solid ${T.border}`,borderRadius:13,
          padding:'11px 12px',cursor:'pointer',textAlign:'left'}}>
        <div style={{width:26,height:26,borderRadius:'50%',flexShrink:0,
          background:`${p?.color||T.t3}22`,border:`1.5px solid ${p?.color||T.border}`,
          color:p?.color||T.t1,display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:10,fontWeight:800}}>{getInitials(p?.name||'?')}</div>
        <div style={{flex:1,minWidth:0,color:T.t1,fontSize:16,fontWeight:600,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p?.name||'—'}</div>
        <EditIcon size={14} color={T.t3}/>
      </button>
    );
  };
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:300,
      background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',display:'flex',
      alignItems:'center',justifyContent:'center',padding:20,animation:'fadeIn .15s ease'}}>
      <div onClick={e=>e.stopPropagation()} className="si"
        style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:23,
          padding:'20px',width:'100%',maxWidth:380,maxHeight:'82vh',overflowY:'auto'}}>
        {!pick?(<>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
            <div style={{color:T.t1,fontSize:18,fontWeight:800}}>Aufstellung</div>
            <div style={{color:T.o,fontSize:11,fontWeight:900,letterSpacing:1.2,
              textTransform:'uppercase',padding:'3px 9px',borderRadius:7,
              background:`${T.o}1A`,border:`1px solid ${T.o}`}}>Court {courtIndex+1}</div>
          </div>
          <div style={{color:T.t3,fontSize:12,lineHeight:1.5,marginBottom:16}}>
            Tippe einen Slot, um den Spieler zu tauschen — auch gegen pausierte Spieler.
          </div>
          <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:8}}>Team 1</div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
            {slotRow('t1',0)}{slotRow('t1',1)}
          </div>
          <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:8}}>Team 2</div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18}}>
            {slotRow('t2',0)}{slotRow('t2',1)}
          </div>
          <button onClick={onClose}
            style={{width:'100%',padding:'12px',background:T.o,border:'none',borderRadius:13,
              color:'#000',fontSize:16,fontWeight:800,cursor:'pointer'}}>Fertig</button>
        </>):(<>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <button onClick={()=>setPick(null)}
              style={{width:32,height:32,borderRadius:9,background:T.card2,
                border:`1px solid ${T.border}`,color:T.t1,fontSize:18,cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>‹</button>
            <div style={{color:T.t1,fontSize:16,fontWeight:800}}>
              Spieler wählen · {pick.teamKey==='t1'?'Team 1':'Team 2'}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {players.map(p=>{
              const st=statusOf(p.id);
              const isCurrent=court[pick.teamKey]?.[pick.idx]===p.id;
              return(
                <button key={p.id} onClick={()=>{onAssign(pick.teamKey,pick.idx,p.id);setPick(null);}}
                  style={{display:'flex',alignItems:'center',gap:10,width:'100%',
                    background:isCurrent?T.oSoft:T.card2,
                    border:`1px solid ${isCurrent?T.o:T.border}`,borderRadius:13,
                    padding:'10px 12px',cursor:'pointer',textAlign:'left'}}>
                  <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,
                    background:`${p.color||T.t3}22`,border:`1.5px solid ${p.color||T.border}`,
                    color:p.color||T.t1,display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:10,fontWeight:800}}>{getInitials(p.name||'?')}</div>
                  <div style={{flex:1,minWidth:0,color:T.t1,fontSize:16,fontWeight:600,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                  <span style={{color:st.color,fontSize:10,fontWeight:700,letterSpacing:.5,
                    flexShrink:0,padding:'3px 8px',borderRadius:6,background:`${st.color}1A`}}>
                    {st.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>)}
      </div>
    </div>
  );
}

/* ── Leaderboard-Punkte manuell anpassen. Host gibt den NEUEN
   Gesamtwert ein; intern wird die Differenz als adjustment auf dem
   Spieler gespeichert (adjPts/adjWins), damit weitere Matches normal
   weiterzählen. */
function PointsEditModal({entry,winMode,onSave,onClose}){
  const isWins=winMode==='wins';
  const current=isWins?entry.totalWins:entry.totalPts;
  const[val,setVal]=useState(String(current));
  const save=()=>{
    const n=parseInt(val,10);
    onSave(Number.isFinite(n)?Math.max(0,n):current);
  };
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:300,
      background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',display:'flex',
      alignItems:'center',justifyContent:'center',padding:24,animation:'fadeIn .15s ease'}}>
      <div onClick={e=>e.stopPropagation()} className="si"
        style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:23,
          padding:'22px',width:'100%',maxWidth:330}}>
        <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:4}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:entry.color,flexShrink:0}}/>
          <div style={{color:T.t1,fontSize:18,fontWeight:800,overflow:'hidden',
            textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{entry.name}</div>
        </div>
        <div style={{color:T.t3,fontSize:12,lineHeight:1.5,marginBottom:16}}>
          {isWins?'Siege':'Punkte'} manuell setzen. Korrigiert den Gesamtwert; folgende Matches zählen normal weiter.
        </div>
        <input type="number" inputMode="numeric" min="0" autoFocus
          value={val} onChange={e=>setVal(e.target.value)}
          onFocus={e=>e.currentTarget.select()}
          onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();save();}}}
          style={{width:'100%',background:T.card2,border:`1.5px solid ${T.o}`,borderRadius:15,
            padding:'14px',color:T.t1,fontSize:24,fontWeight:900,textAlign:'center',
            fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',outline:'none',boxSizing:'border-box',marginBottom:16}}/>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose}
            style={{flex:1,padding:'12px',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:13,color:T.t1,fontSize:16,fontWeight:600,cursor:'pointer'}}>Abbrechen</button>
          <button onClick={save}
            style={{flex:1,padding:'12px',background:T.o,border:'none',borderRadius:13,
              color:'#000',fontSize:16,fontWeight:800,cursor:'pointer'}}>Speichern</button>
        </div>
      </div>
    </div>
  );
}

/* Kompaktes Score-Wheel (iPhone-Wecker-Stil) für die Court-Übersicht —
   3 sichtbare Reihen, Snap, statt Zahleneingabe. */
function ScoreWheel({value,onChange,max=40,color=T.o,w=52}){
  const ref=useRef(null);
  const ITEM_H=34, VISIBLE=3, HEIGHT=ITEM_H*VISIBLE, PAD=(HEIGHT-ITEM_H)/2;
  const opts=Array.from({length:max+1},(_,i)=>i);
  const v=value==null?0:value;
  const init=useRef(false), toRef=useRef(null);
  useEffect(()=>{ if(ref.current&&!init.current){ ref.current.scrollTop=v*ITEM_H; init.current=true; } },[v]);
  const onScroll=e=>{ const el=e.target; if(toRef.current)clearTimeout(toRef.current);
    toRef.current=setTimeout(()=>{ const idx=Math.max(0,Math.min(max,Math.round(el.scrollTop/ITEM_H)));
      if(idx!==value) onChange(idx); },90); };
  return(
    <div style={{position:'relative',width:w,height:HEIGHT,flexShrink:0}}>
      <div style={{position:'absolute',top:PAD,left:0,right:0,height:ITEM_H,
        background:`${color}1A`,border:`1.5px solid ${color}`,borderRadius:11,pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:0,left:0,right:0,height:PAD,
        background:`linear-gradient(${T.card},transparent)`,pointerEvents:'none',zIndex:2}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:PAD,
        background:`linear-gradient(transparent,${T.card})`,pointerEvents:'none',zIndex:2}}/>
      <div ref={ref} onScroll={onScroll}
        style={{height:HEIGHT,overflowY:'scroll',scrollSnapType:'y mandatory',
          scrollPaddingTop:`${PAD}px`,WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
        <div style={{height:PAD}}/>
        {opts.map(o=>{ const active=o===v;
          return <div key={o} style={{height:ITEM_H,display:'flex',alignItems:'center',justifyContent:'center',
            scrollSnapAlign:'start',fontSize:active?24:15,fontWeight:active?900:600,
            color:active?T.t1:T.t3,transition:'color .15s,font-size .15s'}}>{o}</div>; })}
        <div style={{height:PAD}}/>
      </div>
    </div>
  );
}

function TournamentCourtCard({court,courtIndex,courtName,playerById,onScoreChange,onConfirm,onEditLineup,scoreMax=40}){
  // Score-Werte aus dem Court ziehen. null/undefined = noch nicht
  // eingegeben → Input rendert leer, damit Tippen "5" auch wirklich
  // "5" wird und nicht "05". Beim Abschluss zählt 0 als gültiger
  // Score (z. B. 6-0), daher fallback nur in Logik/Display, nicht
  // im Input-Value.
  const s1Raw=court.s1;
  const s2Raw=court.s2;
  const s1=s1Raw??0;
  const s2=s2Raw??0;
  const done=!!court.done;

  // Match-Tier-Rating aus den Spielstilen der vier Spieler (RITMO DNA).
  // null, wenn nicht alle vier einen Stil gesetzt haben → kein Label.
  const tier=computeMatchTier(
    (court.t1||[]).map(pid=>playerById(pid)?.style),
    (court.t2||[]).map(pid=>playerById(pid)?.style),
  );

  // Gewinnerseite ermitteln (für goldenen Glow auf der Karte).
  const winnerTeam=done?(s1>s2?'A':s2>s1?'B':null):null;

  // Pill mit Initialen + Farb-Border um den Spieler-Avatar zu hinten —
  // sieht in der Liste lebendiger aus als nur ein Farbpunkt.
  const Avatar=({player})=>(
    <div style={{
      width:28,height:28,borderRadius:'50%',flexShrink:0,
      background:`${player?.color||T.t3}22`,
      border:`1.5px solid ${player?.color||T.border}`,
      color:player?.color||T.t1,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:11,fontWeight:800,letterSpacing:.3,
      boxShadow:`0 0 8px ${player?.color||'transparent'}44`,
    }}>
      {getInitials(player?.name||'?')}
    </div>
  );

  // Spieler-Namen leicht VERSETZT (gestaffelt) übereinander: der 2. Spieler
  // ist nach innen eingerückt, damit beide Zeilen klar getrennt lesbar
  // sind. Namen bleiben EINZEILIG (nowrap + Ellipsis) — kein Umbruch
  // mitten im Namen ("Spieler 1" brach als "Spieler"/"1" um).
  const teamSide=(playerIds,align)=>(
    <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:8,
      alignItems:align==='right'?'flex-end':'flex-start'}}>
      {playerIds.map((pid,idx)=>{
        const p=playerById(pid);
        return(
          <div key={pid}
            style={{display:'flex',alignItems:'center',gap:7,minWidth:0,width:'100%',
              flexDirection:align==='right'?'row-reverse':'row',
              justifyContent:align==='right'?'flex-end':'flex-start',
              // 2. Spieler versetzt einrücken → gestaffelte Optik.
              ...(idx===1?(align==='right'?{paddingRight:12}:{paddingLeft:12}):null)}}>
            <Avatar player={p}/>
            <div style={{minWidth:0,flex:'1 1 auto',
              textAlign:align==='right'?'right':'left'}}>
              <div style={{color:T.t1,fontSize:12.5,fontWeight:700,letterSpacing:-.2,
                lineHeight:1.16,whiteSpace:'nowrap',overflow:'hidden',
                textOverflow:'ellipsis'}}>
                {p?.name||'—'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return(
    <div className="court-card"
      style={{
        position:'relative',
        background:done
          ?`linear-gradient(135deg, ${T.card} 0%, ${T.card2} 100%)`
          :T.card,
        border:`1.5px solid ${done?T.o:T.border}`,
        borderRadius:21,padding:'16px 16px 14px',
        animationDelay:`${courtIndex*60}ms`,
        boxShadow:done?`0 0 0 1px ${T.o}33 inset, 0 8px 20px rgba(0,0,0,.25)`:'0 4px 14px rgba(0,0,0,.18)',
        overflow:'hidden',
        // Eltern-Container des Runden-Tabs ist ein Flex-Column mit
        // overflowY:auto. Ohne flexShrink:0 würden mehrere Court-
        // Karten sich gegenseitig komprimieren statt zu scrollen —
        // mit overflow:hidden auf der Karte wird dann unten der
        // Bestätigen-Button abgeschnitten und sieht nur noch wie ein
        // dünner oranger Streifen aus.
        flexShrink:0,
      }}>

      {/* Subtiler Gradient-Akzent als Hintergrund-Layer — nimmt nur
          Top-Right-Ecke ein, gibt dem Card mehr Tiefe ohne den
          Content zu überdecken. */}
      <div aria-hidden style={{
        position:'absolute',top:-50,right:-50,width:120,height:120,
        borderRadius:'50%',
        background:`radial-gradient(circle, ${done?T.o:T.o}1A 0%, transparent 70%)`,
        pointerEvents:'none',
      }}/>

      {/* Header: Court-Nummer + Status + Lineup-Edit */}
      <div style={{position:'relative',display:'flex',alignItems:'center',
        justifyContent:'space-between',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{
            padding:'4px 10px',borderRadius:8,
            background:done?T.oSoft:`${T.o}1A`,
            border:`1px solid ${T.o}`,
            color:T.o,fontSize:11,fontWeight:900,letterSpacing:1.4,
            textTransform:'uppercase'}}>
            {courtName||`Court ${courtIndex+1}`}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {done?(
            <div style={{display:'flex',alignItems:'center',gap:6,
              padding:'4px 10px',borderRadius:8,
              background:`${T.g}22`,border:`1px solid ${T.g}`,
              color:T.g,fontSize:10,fontWeight:900,letterSpacing:1.2,
              textTransform:'uppercase'}}>
              <span style={{fontSize:11,lineHeight:1}}>✓</span>
              Fertig
            </div>
          ):(
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <div className="court-live-dot"
                style={{width:8,height:8,borderRadius:'50%',background:T.r,
                  boxShadow:`0 0 8px ${T.r}aa`}}/>
              <span style={{color:T.r,fontSize:10,fontWeight:900,letterSpacing:1.3,
                textTransform:'uppercase'}}>Live</span>
            </div>
          )}
          {onEditLineup&&(
            <button onClick={onEditLineup}
              title="Aufstellung bearbeiten" aria-label="Aufstellung bearbeiten"
              style={{width:30,height:30,borderRadius:9,background:T.card2,
                border:`1px solid ${T.border}`,color:T.t2,cursor:'pointer',flexShrink:0,
                display:'flex',alignItems:'center',justifyContent:'center'}}>
              <EditIcon size={15} color={T.t2}/>
            </button>
          )}
        </div>
      </div>

      {/* Matchup: [Team A] [Score A] [VS] [Score B] [Team B]
          Alles in einer Zeile, Scores links + rechts vom VS-Kreis,
          mittig vertikal ausgerichtet. Score-Inputs sind kompakter
          gehalten (48x48 statt 60x60) damit die Karte auf 320px+
          Screens nicht überläuft. */}
      <div style={{position:'relative',display:'flex',alignItems:'center',
        gap:6,marginBottom:14}}>
        {teamSide(court.t1||[],'left')}

        {/* Score A — Input wenn offen, große Zahl wenn fertig */}
        {done?(
          <div key={`s1-${s1}`} className="court-score-pop"
            style={{
              flexShrink:0,
              minWidth:44,textAlign:'center',
              fontSize:32,fontWeight:900,letterSpacing:-1,lineHeight:1,
              color:winnerTeam==='A'?T.o:T.t2,
            }}>
            {s1}
          </div>
        ):(
          <ScoreWheel value={s1Raw} onChange={v=>onScoreChange('s1',v)} max={scoreMax} w={46}/>
        )}

        {/* VS-Kreis bleibt zentral zwischen den Scores */}
        <div className={done?'':'court-vs'}
          style={{
            flexShrink:0,
            width:30,height:30,borderRadius:'50%',
            background:done
              ?(winnerTeam?`${T.o}33`:T.card2)
              :`${T.r}22`,
            border:`1.5px solid ${done?(winnerTeam?T.o:T.border):T.r}`,
            color:done?(winnerTeam?T.o:T.t3):T.r,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:10,fontWeight:900,letterSpacing:.4,
          }}>
          VS
        </div>

        {/* Score B */}
        {done?(
          <div key={`s2-${s2}`} className="court-score-pop"
            style={{
              flexShrink:0,
              minWidth:44,textAlign:'center',
              fontSize:32,fontWeight:900,letterSpacing:-1,lineHeight:1,
              color:winnerTeam==='B'?T.o:T.t2,
            }}>
            {s2}
          </div>
        ):(
          <ScoreWheel value={s2Raw} onChange={v=>onScoreChange('s2',v)} max={scoreMax} w={46}/>
        )}

        {teamSide(court.t2||[],'right')}
      </div>

      {/* Match-Tier-Rating (RITMO DNA) — Stil-Chemie beider Teams */}
      {tier&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,
          marginBottom:12,padding:'7px 12px',borderRadius:13,
          background:`${tier.color}14`,border:`1px solid ${tier.color}55`}}>
          <span style={{color:tier.color,fontSize:12,fontWeight:900,letterSpacing:.6}}>{tier.label}</span>
          <span style={{color:T.t3,fontSize:11,fontWeight:700}}>·</span>
          <span style={{color:T.t2,fontSize:11,fontWeight:600}}>{tier.sub}</span>
          <span style={{color:tier.color,fontSize:10,letterSpacing:1,marginLeft:2}}>
            {'★'.repeat(tier.stars)}{'☆'.repeat(5-tier.stars)}
          </span>
        </div>
      )}

      {/* Confirm / Edit Button */}
      <button onClick={onConfirm}
        style={{width:'100%',padding:'11px 14px',borderRadius:13,
          background:done?T.card2:T.o,
          color:done?T.t2:'#000',fontSize:13,fontWeight:800,letterSpacing:.3,
          cursor:'pointer',
          border:done?`1px solid ${T.border}`:'none',
          transition:'background .2s,color .2s'}}>
        {done?'✎ Bearbeiten':'✓ Ergebnis bestätigen'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOURNAMENT PLAY
═══════════════════════════════════════════════════════════════ */
/* ── Pausen-Ausgleich einer Runde: aufgerundeter Mittelwert aller
   Punkte aus BESTÄTIGTEN Matches (spiegelt calcLeaderboard). null,
   wenn noch kein Match bestätigt ist. */
function roundMeanBonus(round){
  const scores=[];
  (round?.courts||[]).forEach(m=>{
    if(!m.done) return;
    (m.t1||[]).forEach(()=>scores.push(m.s1??0));
    (m.t2||[]).forEach(()=>scores.push(m.s2??0));
  });
  if(!scores.length) return null;
  return Math.ceil(scores.reduce((a,b)=>a+b,0)/scores.length);
}

/* Kleiner blauer Chip „⏸ +X" — kennzeichnet im Leaderboard farblich,
   wie viele Punkte/Siege aus dem Pausen-Ausgleich stammen. */
function PauseBonusChip({value,size=9.5}){
  if(!value) return null;
  return(
    <span title="Aus Pausen-Ausgleich (aufgerundeter Runden-Mittelwert)"
      style={{display:'inline-flex',alignItems:'center',gap:3,
        background:T.blueSoft,border:`1px solid ${T.blue}`,borderRadius:8,
        padding:'1px 6px',color:T.blue,fontSize:size,fontWeight:800,lineHeight:1.4}}>
      <PauseIcon size={size} color={T.blue}/>+{value}
    </span>
  );
}

/* Uhr mit Rückwärts-Pfeil — Runden-Historie. */
function HistoryIcon({size=22,color=T.o}){
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/>
    <path d="M18.5 2.5v3.6h-3.6"/>
    <path d="M12 8v4.3l2.9 1.7"/>
  </svg>);
}

/* Court/Leaderboard-Umschalter — ANIMIERT: die beiden Mini-Glyphs
   tauschen beim Umschalten diagonal die Plätze. Der abgehende rotiert
   dabei einmal um sich selbst und „swooshed" HINTER den anderen
   (kleiner + gedimmt, z-Index wechselt), der ankommende dreht sich
   groß nach vorn. Der Slash bleibt statisch. mode = aktueller Tab
   ('round' → Court vorn, 'board' → Spieler vorn). */
function ViewSwitchIcon({mode='round',size=24,color=T.o}){
  const g=Math.round(size*0.58);   // Glyph-Box
  const d=size-g;                  // diagonaler Versatz nach unten-rechts
  const courtFront=mode!=='board';
  const sty=(front,dir)=>({
    position:'absolute',top:0,left:0,width:g,height:g,
    display:'flex',alignItems:'center',justifyContent:'center',
    zIndex:front?2:1,
    opacity:front?1:.4,
    transform:front
      ?'translate(0px,0px) rotate(0deg) scale(1)'
      :`translate(${d}px,${d}px) rotate(${dir*360}deg) scale(.78)`,
    transition:'transform .55s var(--ease-out-back), opacity .35s ease',
    willChange:'transform',
  });
  return(
    <span aria-hidden="true" style={{position:'relative',width:size,height:size,
      display:'inline-block',flexShrink:0}}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        style={{position:'absolute',inset:0}}
        stroke={color} strokeWidth="1.6" strokeLinecap="round">
        <line x1="14.8" y1="2.5" x2="9.2" y2="21.5"/>
      </svg>
      {/* Mini-Court */}
      <span style={sty(courtFront,1)}>
        <svg width={g} height={g} viewBox="0 0 12 10" fill="none" stroke={color}
          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="1" width="10" height="8" rx="1.6"/>
          <line x1="6" y1="1" x2="6" y2="9"/>
        </svg>
      </span>
      {/* Mini-Spieler */}
      <span style={sty(!courtFront,-1)}>
        <svg width={g} height={g} viewBox="0 0 12 12" fill="none" stroke={color}
          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="4.2" r="2.1"/>
          <path d="M1.9 11c0-2.4 1.8-3.7 4.1-3.7s4.1 1.3 4.1 3.7"/>
        </svg>
      </span>
    </span>
  );
}

/* ── Runden-Abschluss-Bestätigung — macht den Pausen-Ausgleich
   TRANSPARENT: zeigt vor dem Rundenwechsel den aufgerundeten
   Mittelwert dieser Runde und wer ihn gutgeschrieben bekommt. */
function RoundEndModal({roundNo,bonus,names,winMode,onConfirm,onCancel}){
  return(
    <div onClick={onCancel} style={{position:'fixed',inset:0,zIndex:300,
      background:'rgba(0,0,0,.72)',backdropFilter:'blur(4px)',
      display:'flex',alignItems:'center',justifyContent:'center',
      padding:'0 26px',animation:'fadeIn .15s ease'}}>
      <div onClick={e=>e.stopPropagation()} className="slide-up"
        style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:21,
          width:'100%',maxWidth:380,padding:'22px 20px'}}>
        <div style={{color:T.t1,fontSize:18,fontWeight:800,letterSpacing:-.2}}>
          Runde {roundNo} abschließen
        </div>
        <div style={{color:T.t3,fontSize:12,lineHeight:1.5,marginTop:4,marginBottom:14}}>
          Pausen-Ausgleich dieser Runde — wird dem Gesamtscore gutgeschrieben.
        </div>

        {winMode==='points'?(
          bonus!=null?(
            <div style={{background:T.blueSoft,border:`1px solid ${T.blue}`,
              borderRadius:15,padding:'14px 16px',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:34,height:34,borderRadius:'50%',flexShrink:0,
                  background:T.card,border:`1.5px solid ${T.blue}`,
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <PauseIcon size={15} color={T.blue}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:T.blue,fontSize:20,fontWeight:900,lineHeight:1.1}}>
                    +{bonus} Punkte
                  </div>
                  <div style={{color:T.t2,fontSize:11,fontWeight:500,marginTop:2,lineHeight:1.55}}>
                    Aufgerundeter Mittelwert aller Punkte dieser Runde.
                  </div>
                </div>
              </div>
              <div style={{color:T.t1,fontSize:13,fontWeight:600,marginTop:10}}>
                geht an: <span style={{color:T.blue,fontWeight:800}}>{names.join(', ')}</span>
              </div>
            </div>
          ):(
            <div style={{background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:15,padding:'14px 16px',marginBottom:14,
              color:T.t3,fontSize:12,lineHeight:1.5}}>
              Noch kein Ergebnis bestätigt — ohne bestätigte Matches gibt es keinen
              Ausgleich für {names.join(', ')}.
            </div>
          )
        ):(
          <div style={{background:T.blueSoft,border:`1px solid ${T.blue}`,
            borderRadius:15,padding:'14px 16px',marginBottom:14}}>
            <div style={{color:T.blue,fontSize:16,fontWeight:800}}>+1 Sieg pro Pause</div>
            <div style={{color:T.t2,fontSize:11,marginTop:3,lineHeight:1.55}}>
              Gutschrift für pausierte Spieler der unteren Tabellenhälfte:
              {' '}{names.join(', ')}
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:10}}>
          <button onClick={onCancel}
            style={{flex:1,padding:'12px',borderRadius:13,background:T.card2,
              border:`1px solid ${T.border}`,color:T.t1,fontSize:13,fontWeight:600,
              cursor:'pointer'}}>
            Zurück
          </button>
          <button onClick={()=>{buzz(18);onConfirm();}}
            style={{flex:1.4,padding:'12px',borderRadius:13,background:T.o,
              border:'none',color:T.bg,fontSize:13,fontWeight:800,cursor:'pointer'}}>
            Bestätigen & weiter
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Runden-Historie — alle gespielten Runden mit Paarungen,
   Ergebnissen, Pausen und dem jeweils angewandten Ausgleich.
   Die Runden liegen vollständig in tourney.rounds (persistiert
   via localStorage zusammen mit dem Turnier). */
function RoundHistorySheet({tourney,onClose}){
  const pById=id=>tourney.players.find(p=>p.id===id);
  const teamNames=ids=>(ids||[]).map(id=>pById(id)?.name||'?').join(' + ');
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:300,
      background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',display:'flex',
      alignItems:'flex-end',justifyContent:'center',animation:'fadeIn .15s ease'}}>
      <div onClick={e=>e.stopPropagation()} className="slide-up"
        style={{background:T.card,borderTopLeftRadius:20,borderTopRightRadius:20,
          borderTop:`1px solid ${T.border}`,width:'100%',maxWidth:480,
          padding:'16px 18px calc(env(safe-area-inset-bottom,0px) + 18px)',
          maxHeight:'82vh',overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
        <div style={{width:36,height:4,borderRadius:2,background:T.border,margin:'0 auto 14px'}}/>
        <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:3}}>
          <HistoryIcon size={19} color={T.o}/>
          <div style={{color:T.t1,fontSize:17,fontWeight:800}}>Runden-Historie</div>
        </div>
        <div style={{color:T.t3,fontSize:12,lineHeight:1.5,marginBottom:14}}>
          Alle Runden mit Ergebnissen & Pausen-Ausgleich — bleiben über das
          ganze Turnier gespeichert.
        </div>
        {tourney.rounds.map((r,ri)=>{
          const isCurrent=ri===tourney.current;
          const bonus=tourney.winMode==='points'?roundMeanBonus(r):null;
          return(
            <div key={ri} style={{background:T.card2,borderRadius:15,marginBottom:10,
              border:`1px solid ${isCurrent?T.o:T.border}`,padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{color:isCurrent?T.o:T.t1,fontSize:13,fontWeight:800}}>
                  Runde {ri+1}
                </span>
                {isCurrent&&(
                  <span style={{fontSize:9,fontWeight:800,letterSpacing:1,color:T.o,
                    background:T.oSoft,border:`1px solid ${T.o}55`,borderRadius:7,
                    padding:'1px 7px',textTransform:'uppercase'}}>laufend</span>
                )}
              </div>
              {(r.courts||[]).map((c,ci)=>(
                <div key={ci} style={{display:'flex',alignItems:'center',gap:8,
                  padding:'6px 0',borderTop:ci>0?`1px solid ${T.sep}`:'none'}}>
                  <span style={{color:T.t4,fontSize:10,fontWeight:800,width:18,flexShrink:0}}>
                    C{ci+1}
                  </span>
                  <span style={{flex:1,minWidth:0,color:T.t2,fontSize:12,fontWeight:600,
                    textAlign:'right',overflow:'hidden',textOverflow:'ellipsis',
                    whiteSpace:'nowrap'}}>{teamNames(c.t1)}</span>
                  <span style={{flexShrink:0,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',fontSize:13,fontWeight:800,
                    color:c.done?T.o:T.t4,padding:'0 4px'}}>
                    {c.done?`${c.s1??0}:${c.s2??0}`:'– : –'}
                  </span>
                  <span style={{flex:1,minWidth:0,color:T.t2,fontSize:12,fontWeight:600,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {teamNames(c.t2)}
                  </span>
                </div>
              ))}
              {(r.sitOut||[]).length>0&&(
                <div style={{display:'flex',alignItems:'center',gap:7,marginTop:8,
                  paddingTop:8,borderTop:`1px solid ${T.sep}`}}>
                  <PauseBonusChip value={tourney.winMode==='points'?bonus:(r.sitOut.length?1:0)}/>
                  <span style={{color:T.t3,fontSize:11,fontWeight:500,minWidth:0,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    Pause: <span style={{color:T.t1,fontWeight:600}}>
                      {r.sitOut.map(id=>pById(id)?.name||'?').join(', ')}
                    </span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TournamentPlay({tourney,setTourney,onHome,nav,ringId='ritmo',onEdit,onMatchLogged}){
  const[tab,setTab]=useState('round');
  const[confirmEnd,setConfirmEnd]=useState(false);
  const[showSitOutInfo,setShowSitOutInfo]=useState(false);
  // Runden-Historie-Sheet + Transparenz-Popup vor dem Rundenwechsel.
  const[showHistory,setShowHistory]=useState(false);
  const[roundEndInfo,setRoundEndInfo]=useState(null);
  const[editLineupCourtId,setEditLineupCourtId]=useState(null);
  const[editPtsId,setEditPtsId]=useState(null);
  // Defensive: korrupte/unvollständige persistierte Turniere (z. B.
  // ohne generierte Runde) würden hart crashen — leeres Fallback
  // rendern und sauber zur Home navigieren (kein früher Return, damit
  // die Hook-Reihenfolge stabil bleibt).
  const rawRound=tourney.rounds[tourney.current];
  const round=rawRound||{courts:[],sitOut:[]};
  useEffect(()=>{ if(!rawRound) onHome&&onHome(); },[rawRound]);  // eslint-disable-line react-hooks/exhaustive-deps
  const playerById=id=>tourney.players.find(p=>p.id===id);

  // ── Online-Sync (nur wenn dieses Turnier eine Online-Session hat) ──
  // Host publiziert tourney → session.tournamentState. Andere
  // Teilnehmer abonnieren die Session via subscribeToTournament.
  // Hier auch: pending-Submissions + Ready-Check aus Realtime.
  const isOnline=!!tourney.onlinePin&&tourney.isHost;
  const[pendingSubs,setPendingSubs]=useState([]);
  const[readyCheckState,setReadyCheckState]=useState(null);
  const[onlineParticipants,setOnlineParticipants]=useState([]);

  // 1) Sub: Session-Änderungen empfangen (nur Submissions+ReadyCheck+
  //    Participants — der Tournament-State wird VOM Host publiziert,
  //    daher nicht zurücklesen, sonst Feedback-Loop).
  useEffect(()=>{
    if(!isOnline) return;
    let alive=true;
    fetchOnlineTournament(tourney.onlinePin).then(s=>{
      if(!alive||!s) return;
      setPendingSubs(s.scoreSubmissions||[]);
      setReadyCheckState(s.readyCheck||null);
      setOnlineParticipants(s.participants||[]);
    });
    const unsub=subscribeToTournament(tourney.onlinePin,(data)=>{
      if(!alive) return;
      setPendingSubs(data.scoreSubmissions||[]);
      setReadyCheckState(data.readyCheck||null);
      setOnlineParticipants(data.participants||[]);
    });
    return ()=>{alive=false;unsub();};
  },[isOnline,tourney.onlinePin]);

  // 2) Publish: Host pushed tourney→session bei jeder Änderung,
  //    debounced auf 500ms, damit Timer-Ticks die DB nicht fluten.
  useEffect(()=>{
    if(!isOnline) return;
    const id=setTimeout(()=>{publishTournamentState(tourney.onlinePin,tourney).catch(()=>{});},500);
    return()=>clearTimeout(id);
  },[isOnline,tourney]);

  // Approve-Score Handler: nimmt Score wie eingereicht (oder editiert).
  const onApprove=async(sub,scoreA,scoreB)=>{
    await approveScore(tourney.onlinePin,sub.id,scoreA,scoreB);
    // Lokal sofort updaten, damit Host nicht auf Realtime warten muss.
    setTourney(t=>{
      const rounds=[...t.rounds];
      rounds[sub.roundIndex]={
        ...rounds[sub.roundIndex],
        courts:rounds[sub.roundIndex].courts.map(c=>c.id===sub.courtId
          ?{...c,s1:scoreA,s2:scoreB,done:true}:c),
      };
      return {...t,rounds};
    });
  };
  const onReject=async(subId)=>{await rejectScore(tourney.onlinePin,subId);};

  // Ready-Check Broadcast
  const broadcastReady=async()=>{await sendReadyCheck(tourney.onlinePin,tourney.current);};
  const dismissReady=async()=>{await clearReadyCheck(tourney.onlinePin);};

  // ── Tournament-Court Logging ──
  // Wenn ein Court done=true wird (und noch nicht .logged), wird das
  // Match in die DB geschrieben und der Court mit .logged=true markiert,
  // damit Toggling "Bearbeiten"/"Bestätigen" keine Duplikate erzeugt.
  // Annahme: Spieler[0] ist der eingeloggte User → user_team/user_won
  // werden anhand dessen abgeleitet.
  useEffect(()=>{
    if(!tourney||!tourney.rounds) return;
    const userPid=tourney.players?.[0]?.id;
    let dirty=false;
    const newRounds=tourney.rounds.map((r,rIdx)=>({
      ...r,
      courts:r.courts.map(c=>{
        if(!c.done||c.logged) return c;
        dirty=true;
        const userTeam=userPid!=null
          ?(c.t1?.includes(userPid)?'A':(c.t2?.includes(userPid)?'B':null))
          :null;
        const userWon=userTeam==='A'?(c.s1>c.s2)
          :userTeam==='B'?(c.s2>c.s1)
          :null;
        dbLogMatch({
          format:'tournament-'+(tourney.format||'americano'),
          player_names:[...(c.t1||[]),...(c.t2||[])].map(pid=>tourney.players.find(p=>p.id===pid)?.name||''),
          score_a:c.s1??0,
          score_b:c.s2??0,
          sets:null,
          user_team:userTeam,
          user_won:userTeam?userWon:null,
          tournament_id:tourney.id||tourney.createdAt||null,
          round_index:rIdx,
        }).catch(()=>{});
        // Lokales Match-Log (Fallback ohne Supabase) + Profil-Counter —
        // nur wenn der User identifizierbar ist (sonst kein userWon).
        if(userTeam){
          logMatchLocal({format:'tournament-'+(tourney.format||'americano'),user_won:userWon,sets:null});
          onMatchLogged?.({userWon});
          notify(userWon?"Match gespeichert — Sieg!":"Match gespeichert");
      notify(userWon?"Match gespeichert — Sieg!":"Match gespeichert");
        }
        return {...c,logged:true};
      }),
    }));
    if(dirty) setTourney(t=>({...t,rounds:newRounds}));
    // eslint-disable-next-line
  },[tourney]);

  const updateScore=(courtId,field,val)=>{
    setTourney(t=>{
      const newRounds=[...t.rounds];
      newRounds[t.current]={...newRounds[t.current],
        courts:newRounds[t.current].courts.map(c=>c.id!==courtId?c:{...c,[field]:val})
      };
      return {...t,rounds:newRounds};
    });
  };

  const confirmCourt=(courtId)=>{
    setTourney(t=>{
      const newRounds=[...t.rounds];
      newRounds[t.current]={...newRounds[t.current],
        courts:newRounds[t.current].courts.map(c=>c.id!==courtId?c:{...c,done:!c.done})
      };
      return {...t,rounds:newRounds};
    });
  };

  // ── Aufstellung tauschen ──
  // Setzt newPid auf (courtId,teamKey,idx). Der bisherige Spieler dort
  // wandert auf die alte Position von newPid (Court-Slot) bzw. — wenn
  // newPid pausiert war — in die Pause. So bleibt jeder Spieler genau
  // einmal vergeben; sitOut wird aus der Court-Belegung neu abgeleitet.
  const assignPlayer=(courtId,teamKey,idx,newPid)=>{
    setTourney(t=>{
      const ci=t.current;
      const rnd=t.rounds[ci];
      if(!rnd) return t;
      const courts=rnd.courts.map(c=>({...c,t1:[...(c.t1||[])],t2:[...(c.t2||[])]}));
      const tCourt=courts.find(c=>c.id===courtId);
      if(!tCourt) return t;
      const oldPid=tCourt[teamKey][idx];
      if(oldPid===newPid) return t;
      // Wo steckt newPid gerade (Court-Slot)?
      let src=null;
      for(const c of courts){
        const i1=c.t1.indexOf(newPid); if(i1>=0){src={arr:c.t1,i:i1};break;}
        const i2=c.t2.indexOf(newPid); if(i2>=0){src={arr:c.t2,i:i2};break;}
      }
      tCourt[teamKey][idx]=newPid;
      if(src){ src.arr[src.i]=oldPid; } // Swap; sonst landet oldPid in der Pause
      const playing=new Set(courts.flatMap(c=>[...c.t1,...c.t2]));
      const sitOut=t.players.map(p=>p.id).filter(id=>!playing.has(id));
      const rounds=[...t.rounds];
      rounds[ci]={...rnd,courts,sitOut};
      return {...t,rounds};
    });
  };

  // ── Leaderboard-Punkte manuell setzen ──
  // newTotal = gewünschter Gesamtwert. Wir speichern die Differenz zur
  // berechneten Basis (echte Punkte + Pausen-Bonus) als adjPts/adjWins
  // auf dem Spieler, damit künftige Matches normal weiterzählen.
  const savePlayerPoints=(playerId,newTotal)=>{
    setTourney(t=>{
      // Gleiche (bestätigte) Basis wie das angezeigte Leaderboard.
      const lb=calcLeaderboard(t.players,t.finished?t.rounds:t.rounds.slice(0,t.current),t.winMode);
      const e=lb.find(x=>x.id===playerId);
      if(!e) return t;
      const players=t.players.map(p=>{
        if(p.id!==playerId) return p;
        return t.winMode==='wins'
          ?{...p,adjWins:newTotal-(e.wins+e.bonusWins)}
          :{...p,adjPts:newTotal-(e.pts+e.bonusPts)};
      });
      return {...t,players};
    });
  };

  // ═══ TIMER LOGIC ═══
  useEffect(()=>{
    if(!tourney.timerRunning||tourney.finished)return;
    const id=setInterval(()=>{
      // playRing MUSS innerhalb des State-Updaters laufen — React 18
      // batched State-Updates aus setInterval-Callbacks; ein Flag
      // außerhalb zu setzen und danach abzufragen kommt zu früh
      // (Updater läuft erst beim nächsten Tick). Der Pattern matched
      // jetzt 1:1 die Americano-Timer-Logik in Match. AudioContext-
      // Resume() in audio.js sorgt dafür, dass der Ton auch nach
      // langer User-Inaktivität noch durchkommt.
      setTourney(t=>{
        if(!t||!t.timerRunning)return t;
        if(t.timerSecsLeft<=1){
          playRing(ringId);
          return {...t,timerSecsLeft:0,timerRunning:false,timerFinished:true};
        }
        return {...t,timerSecsLeft:t.timerSecsLeft-1};
      });
    },1000);
    return()=>clearInterval(id);
  },[tourney.timerRunning,tourney.finished,ringId,setTourney]);

  const toggleTimer=()=>{
    setTourney(t=>{
      if(t.timerFinished||t.timerSecsLeft<=0){
        return {...t,timerSecsLeft:t.roundDurationMin*60,timerRunning:true,timerFinished:false};
      }
      return {...t,timerRunning:!t.timerRunning};
    });
  };

  const fmtT=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const nextRound=()=>{
    // Außerhalb von setTourney generieren: bei K.-o. kann null kommen
    // (Finale entschieden) → Turnier direkt sauber beenden.
    const t=tourney;
    const lb=calcLeaderboard(t.players,t.rounds,t.winMode);
    const sortedLb=lb.sort((a,b)=>t.winMode==='points'?b.totalPts-a.totalPts:b.totalWins-a.totalWins);
    const newR=genRound(t.format,t.players,
      {history:t.rounds,leaderboard:sortedLb,maxCourts:t.numCourts});
    if(!newR){ endTournament(); return; }
    setTourney(tt=>({...tt,
      rounds:[...tt.rounds,newR],
      current:tt.current+1,
      timerSecsLeft:tt.roundDurationMin*60,
      timerRunning:false,
      timerFinished:false,
    }));
  };

  // Vor dem Rundenwechsel: Pausen-Ausgleich transparent bestätigen
  // lassen (Popup mit Mittelwert + Empfängern). Ohne Pausierte geht
  // es direkt weiter.
  const requestNextRound=()=>{
    const so=round.sitOut||[];
    if(so.length===0){ nextRound(); return; }
    setRoundEndInfo({
      roundNo:tourney.current+1,
      bonus:tourney.winMode==='points'?roundMeanBonus(round):null,
      names:so.map(id=>playerById(id)?.name||'?'),
    });
  };

  const endTournament=()=>{
    setTourney(t=>({...t,finished:true,timerRunning:false}));
    nav('tournament-leaderboard');
  };

  const allDone=round.courts.every(c=>c.done);
  // Leaderboard nur aus BESTÄTIGTEN Runden (vor der laufenden) — er
  // aktualisiert sich erst beim Rundenwechsel ("Nächste Runde"), nicht
  // schon beim Bestätigen einzelner Courts in der aktuellen Runde.
  const lbRounds=tourney.finished?tourney.rounds:tourney.rounds.slice(0,tourney.current);
  const lb=calcLeaderboard(tourney.players,lbRounds,tourney.winMode);
  const sortedLb=lb.sort((a,b)=>tourney.winMode==='points'?b.totalPts-a.totalPts||b.totalWins-a.totalWins:b.totalWins-a.totalWins||b.totalPts-a.totalPts);
  // Live nachgeschlagen, damit die offenen Modals immer den frischen
  // Court/Leaderboard-Eintrag bekommen (sonst stale nach setTourney).
  const editLineupCourt=editLineupCourtId!=null?round.courts.find(c=>c.id===editLineupCourtId):null;
  const editPtsEntry=editPtsId!=null?sortedLb.find(p=>p.id===editPtsId):null;

  const totalSecs=(tourney.roundDurationMin||10)*60;
  const progress=totalSecs?(tourney.timerSecsLeft||0)/totalSecs:0;

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <ScreenHeader pad={14} ellipsis
        title={tourney.name||(FORMATS[tourney.format]||FORMATS.americano).name}
        subtitle={`${(FORMATS[tourney.format]||FORMATS.americano).name} · Runde ${tourney.current+1}${round.koPhase?` · ${round.koPhase}`:''}${tourney.endTime?` · bis ${tourney.endTime}`:''}`}
        icon={<TrophyIcon size={40}/>}/>

      {/* Timer + Leaderboard Toggle */}
      <div style={{display:'flex',gap:10,padding:'0 22px 14px'}}>
        {/* Timer Card */}
        <div style={{flex:1,minWidth:0,
          background:T.bg,
          border:`2px solid ${tourney.timerFinished?T.r:T.o}`,
          borderRadius:19,padding:'10px 14px',
          display:'flex',alignItems:'center',gap:10,
          position:'relative',overflow:'hidden'}}>
          {/* Progress fill */}
          <div style={{position:'absolute',left:0,top:0,bottom:0,
            width:`${progress*100}%`,
            background:tourney.timerFinished?'rgba(232,69,69,0.12)':'var(--oSoft)',
            transition:'width 1s linear'}}/>
          <div style={{flex:1,fontSize:30,fontWeight:800,
            color:tourney.timerFinished?T.r:T.o,
            fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',letterSpacing:1.5,
            position:'relative',zIndex:1}}>
            {fmtT(tourney.timerSecsLeft||0)}
          </div>
          <button onClick={toggleTimer}
            style={{width:40,height:40,borderRadius:'50%',
              background:tourney.timerFinished?T.r:T.o,border:'none',
              color:T.bg,fontSize:16,fontWeight:800,
              cursor:'pointer',position:'relative',zIndex:1,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
            {tourney.timerFinished?'↺':tourney.timerRunning?<PauseGlyph size={15} color={T.bg}/>:<PlayGlyph size={15} color={T.bg}/>}
          </button>
        </div>

        {/* Courts ⇄ Leaderboard — Icon-Umschalter */}
        <button onClick={()=>setTab(tab==='board'?'round':'board')}
          title={tab==='board'?'Courts anzeigen':'Leaderboard anzeigen'}
          aria-label="Courts/Leaderboard umschalten"
          style={{width:58,flexShrink:0,
            background:tab==='board'?T.oSoft:T.bg,
            border:`2px solid ${T.o}`,
            borderRadius:19,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            transition:'background .2s'}}>
          <ViewSwitchIcon mode={tab} size={27} color={T.o}/>
        </button>

        {/* Runden-Historie */}
        <button onClick={()=>setShowHistory(true)}
          title="Runden-Historie" aria-label="Runden-Historie"
          style={{width:58,flexShrink:0,background:T.bg,
            border:`2px solid ${T.o}`,borderRadius:19,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
          <HistoryIcon size={25} color={T.o}/>
        </button>
      </div>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:12,overflowY:'auto'}}>

        {tab==='round'&&(<>
          {/* Online: Pending Score-Submissions (Host approved/rejected) */}
          {isOnline&&pendingSubs.filter(s=>s.roundIndex===tourney.current).length>0&&(
            <div style={{background:T.card,border:`1.5px solid ${T.o}`,borderRadius:19,
              padding:'14px 16px'}}>
              <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.3,
                textTransform:'uppercase',marginBottom:8}}>
                Score-Anfragen ({pendingSubs.filter(s=>s.roundIndex===tourney.current).length})
              </div>
              {pendingSubs.filter(s=>s.roundIndex===tourney.current).map(sub=>(
                <PendingSubmissionRow key={sub.id} sub={sub} tourney={tourney}
                  onApprove={onApprove} onReject={onReject}/>
              ))}
            </div>
          )}

          {/* Online: Ready-Check Banner für aktuelle Runde */}
          {isOnline&&(
            <ReadyCheckHostCard
              tourney={tourney}
              participants={onlineParticipants}
              readyCheck={readyCheckState}
              onBroadcast={broadcastReady}
              onDismiss={dismissReady}/>
          )}

          {round.courts.map((court,ci)=>(
            <TournamentCourtCard key={court.id}
              court={court} courtIndex={ci}
              courtName={courtLabel(tourney.courtNames,ci)}
              playerById={playerById}
              onScoreChange={(field,val)=>updateScore(court.id,field,val)}
              onConfirm={()=>confirmCourt(court.id)}
              onEditLineup={()=>setEditLineupCourtId(court.id)}/>
          ))}

          {/* K.-o.: Wartende dieser Welle (Freilos / Warteschlange) —
              bewusst NICHT in sitOut (keine Pausen-Boni im Bracket). */}
          {round.koIdle?.length>0&&(
            <div style={{background:T.card2,borderRadius:13,border:`1px solid ${T.border}`,
              padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:26,height:26,borderRadius:'50%',flexShrink:0,background:T.oSoft,
                border:`1px solid ${T.o}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <PauseIcon size={13} color={T.o}/>
              </div>
              <div style={{flex:1,minWidth:0,color:T.t3,fontSize:12,fontWeight:500}}>
                Wartet (K.-o.): <span style={{color:T.t1,fontWeight:600}}>
                  {round.koIdle.map(id=>playerById(id)?.name).join(', ')}
                </span>
              </div>
            </div>
          )}

          {round.sitOut?.length>0&&(
            <div style={{background:T.card2,borderRadius:13,
              border:`1px solid ${T.border}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px'}}>
                <div style={{width:26,height:26,borderRadius:'50%',flexShrink:0,background:T.oSoft,
                  border:`1px solid ${T.o}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <PauseIcon size={13} color={T.o}/>
                </div>
                <div style={{flex:1,minWidth:0,color:T.t3,fontSize:12,fontWeight:500}}>
                  Pausiert: <span style={{color:T.t1,fontWeight:600}}>
                    {round.sitOut.map(id=>playerById(id)?.name).join(', ')}
                  </span>
                </div>
                <QuestionToggle filled={showSitOutInfo}
                  onClick={()=>setShowSitOutInfo(v=>!v)}/>
              </div>
              {showSitOutInfo&&(
                <div style={{padding:'0 14px 12px',borderTop:`1px solid ${T.sep}`,
                  marginTop:2,paddingTop:10}}>
                  <div style={{color:T.t1,fontSize:12,fontWeight:600,marginBottom:4}}>
                    Pausen-Bonus
                  </div>
                  <div style={{color:T.t3,fontSize:11,lineHeight:1.5}}>
                    {tourney.winMode==='points'
                      ?'Pausierte Spieler bekommen den aufgerundeten Mittelwert aller Punkte einer Runde gutgeschrieben — keine Benachteiligung durch erzwungene Pause.'
                      :'Pausierte Spieler in der unteren Tabellenhälfte bekommen +1 Sieg pro Pause gutgeschrieben — damit niemand durch erzwungene Pause weiter zurückfällt.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next round (when allDone) — öffnet erst das Transparenz-
              Popup zum Pausen-Ausgleich (wenn jemand pausiert hat). */}
          {allDone&&(
            <button onClick={requestNextRound}
              style={{padding:'14px',borderRadius:19,border:'none',
                background:T.o,color:T.bg,fontSize:15,fontWeight:800,cursor:'pointer',
                marginTop:6}}>
              Nächste Runde →
            </button>
          )}
        </>)}

        {tab==='board'&&(
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
            overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:'100%'}}>
            <div style={{overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
              {sortedLb.map((p,i)=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',padding:'12px 16px',
                  gap:10,borderBottom:i<sortedLb.length-1?`1px solid ${T.sep}`:'none',
                  background:i===0?'var(--oSoft)':'transparent'}}>
                  <div style={{width:24,fontSize:i<3?18:13,fontWeight:800,
                    color:i===0?T.o:i===1?T.t2:i===2?T.t3:T.t3,textAlign:'center'}}>
                    {i<3?<MedalIcon size={20} rank={i+1}/>:`${i+1}`}
                  </div>
                  <div style={{width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:T.t1,fontSize:16,fontWeight:i===0?700:600,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <div style={{color:T.t3,fontSize:11,marginTop:1}}>
                      {p.played} Spiele · {p.wins}S {p.losses}N
                      {p.sitOut>0&&<> · {p.sitOut} Pause{p.sitOut>1?'n':''}</>}
                    </div>
                  </div>
                  <button onClick={()=>setEditPtsId(p.id)}
                    title="Punkte anpassen"
                    style={{textAlign:'right',background:'none',border:'none',cursor:'pointer',
                      padding:'2px 0 2px 10px',display:'flex',flexDirection:'column',
                      alignItems:'flex-end',gap:1,flexShrink:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <EditIcon size={12} color={T.t4}/>
                      <span style={{color:T.o,fontSize:18,fontWeight:800}}>
                        {tourney.winMode==='wins'?p.totalWins:p.totalPts}
                      </span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <PauseBonusChip value={tourney.winMode==='wins'?p.bonusWins:p.bonusPts}/>
                      <span style={{color:(tourney.winMode==='wins'?p.adjWins:p.adjPts)?T.o:T.t3,
                        fontSize:10,fontWeight:600}}>
                        {tourney.winMode==='wins'?'Siege':'Punkte'}
                        {(tourney.winMode==='wins'?p.adjWins:p.adjPts)?' · angepasst':''}
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{height:100,flexShrink:0}}/>
      </div>

      <MatchBar onHome={onHome} rightButtons={[
        {
          icon:'■',
          onClick:()=>setConfirmEnd(true),
          style:{
            background:'rgba(232,69,69,0.12)',
            border:`1px solid rgba(232,69,69,0.5)`,
            color:T.r,
            fontSize:18,
            fontWeight:800,
          }
        },
        {
          icon:<EditIcon size={20} color={T.o}/>,
          onClick:onEdit,
        }
      ]}/>

      {confirmEnd&&(
        <ResetModal
          title="Turnier beenden"
          description="Das Turnier wird beendet und der Endstand angezeigt."
          question="Turnier jetzt beenden?"
          confirmLabel="Beenden"
          onCancel={()=>setConfirmEnd(false)}
          onConfirm={()=>{setConfirmEnd(false);endTournament();}}/>
      )}

      {/* Aufstellung bearbeiten */}
      {editLineupCourt&&(
        <LineupEditSheet
          court={editLineupCourt}
          courtIndex={round.courts.indexOf(editLineupCourt)}
          players={tourney.players}
          round={round}
          onAssign={(tk,i,pid)=>assignPlayer(editLineupCourt.id,tk,i,pid)}
          onClose={()=>setEditLineupCourtId(null)}/>
      )}

      {/* Leaderboard-Punkte anpassen */}
      {editPtsEntry&&(
        <PointsEditModal
          entry={editPtsEntry}
          winMode={tourney.winMode}
          onSave={(v)=>{savePlayerPoints(editPtsEntry.id,v);setEditPtsId(null);}}
          onClose={()=>setEditPtsId(null)}/>
      )}

      {/* Runden-Abschluss: Pausen-Ausgleich bestätigen */}
      {roundEndInfo&&(
        <RoundEndModal
          roundNo={roundEndInfo.roundNo}
          bonus={roundEndInfo.bonus}
          names={roundEndInfo.names}
          winMode={tourney.winMode}
          onCancel={()=>setRoundEndInfo(null)}
          onConfirm={()=>{setRoundEndInfo(null);nextRound();}}/>
      )}

      {/* Runden-Historie */}
      {showHistory&&(
        <RoundHistorySheet tourney={tourney} onClose={()=>setShowHistory(false)}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOURNAMENT LEADERBOARD (Endstand)
═══════════════════════════════════════════════════════════════ */
function TournamentLeaderboard({tourney,onHome,onNew}){
  const lb=calcLeaderboard(tourney.players,tourney.rounds,tourney.winMode);
  const sortedLb=lb.sort((a,b)=>tourney.winMode==='points'?b.totalPts-a.totalPts||b.totalWins-a.totalWins:b.totalWins-a.totalWins||b.totalPts-a.totalPts);
  const winner=sortedLb[0];

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <ScreenHeader title="Endstand" icon={<TrophyIcon size={40}/>}/>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>

        {/* Winner Hero */}
        <div style={{background:T.card,border:`1px solid ${T.o}`,borderRadius:23,
          padding:'24px 22px',textAlign:'center'}}>
          <div style={{marginBottom:8,display:'flex',justifyContent:'center'}}><MedalIcon size={50} rank={1}/></div>
          <div style={{fontSize:24,fontWeight:800,color:T.t1,letterSpacing:-.3}}>{winner?.name}</div>
          <div style={{fontSize:16,color:T.o,fontWeight:700,marginTop:4}}>
            {tourney.winMode==='wins'?`${winner?.totalWins} Siege`:`${winner?.totalPts} Punkte`}
          </div>
        </div>

        {/* Full Leaderboard */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
          overflow:'hidden',flex:1,minHeight:120,display:'flex',flexDirection:'column'}}>
          <div style={{overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
            {sortedLb.map((p,i)=>(
              <div key={p.id} style={{display:'flex',alignItems:'center',padding:'12px 16px',
                gap:10,borderBottom:i<sortedLb.length-1?`1px solid ${T.sep}`:'none'}}>
                <div style={{width:24,fontSize:i<3?16:13,fontWeight:800,
                  color:i===0?T.o:i===1?T.t2:i===2?T.t3:T.t3,textAlign:'center'}}>
                  {i<3?<MedalIcon size={20} rank={i+1}/>:`${i+1}`}
                </div>
                <div style={{width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{color:T.t1,fontSize:16,fontWeight:i===0?700:600}}>{p.name}</div>
                  <div style={{color:T.t3,fontSize:11}}>
                    {p.played} Spiele · {p.wins}S {p.losses}N
                    {p.sitOut>0&&<> · {p.sitOut} Pause{p.sitOut>1?'n':''}</>}
                  </div>
                </div>
                <div style={{textAlign:'right',display:'flex',flexDirection:'column',
                  alignItems:'flex-end',gap:2}}>
                  <div style={{color:T.o,fontSize:16,fontWeight:800}}>
                    {tourney.winMode==='wins'?p.totalWins:p.totalPts}
                  </div>
                  <PauseBonusChip value={tourney.winMode==='wins'?p.bonusWins:p.bonusPts}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'flex',gap:10,marginTop:6}}>
          <button onClick={onNew}
            style={{flex:1,padding:'14px',borderRadius:19,border:'none',
              background:T.o,color:T.bg,fontSize:16,fontWeight:800,cursor:'pointer'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:7,justifyContent:'center'}}><TrophyIcon size={17} color={T.bg}/>Neues Turnier</span>
          </button>
          <button onClick={onHome}
            style={{flex:1,padding:'14px',borderRadius:19,
              border:`1px solid ${T.border}`,background:T.card,
              color:T.t1,fontSize:16,fontWeight:600,cursor:'pointer'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:7,justifyContent:'center'}}><HomeIcon size={16}/>Home</span>
          </button>
        </div>
        <div style={{height:100,flexShrink:0}}/>
      </div>

      <MatchBar onHome={onHome} rightIcon={<SearchIcon size={20}/>}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIVE SCREEN
═══════════════════════════════════════════════════════════════ */
function Live({hasMatch,tourneys=[],matchCfg,nav,activeTab,setActiveTab,
  onDeleteMatch,onDeleteTourney,onOpenTourney,joinedSession,onLeaveJoined}){
  const items=[];
  if(hasMatch){
    items.push({
      id:'match',type:'match',
      title:`${matchCfg.nameA} vs ${matchCfg.nameB}`,
      sub:matchCfg.format==='bo3'?'Best of Three':'Americano',
      navTo:'match',group:'active',
      onDelete:onDeleteMatch,
    });
  }
  // Alle benannten Turniere — laufende/Entwürfe oben, beendete darunter.
  [...tourneys]
    .sort((a,b)=>(a.finished?1:0)-(b.finished?1:0)||(b.createdAt||0)-(a.createdAt||0))
    .forEach(t=>{
      const isDraft=!!t.draft;
      const fmt=(FORMATS[t.format]||FORMATS.americano).name;
      items.push({
        id:'t-'+t.id,type:'tourney',finished:!!t.finished,draft:isDraft,
        group:isDraft?'drafts':(t.finished?'done':'active'),
        title:t.name||(isDraft?'Entwurf':'Turnier'),
        sub:isDraft
          ?`Entwurf · ${fmt} · ${(t.players||[]).length} Spieler`
          :`${fmt} · ${t.finished?'beendet':'Runde '+((t.current||0)+1)} · ${(t.players||[]).length} Spieler`,
        onClick:()=>onOpenTourney(t.id),
        onDelete:()=>onDeleteTourney(t.id),
      });
    });
  if(joinedSession){
    items.push({
      id:'joined',type:'joined',
      title:`Online-Turnier · ${joinedSession.name||'Du'}`,
      sub:`PIN ${joinedSession.pin?.toUpperCase()} · Tippen zum Wiedereintreten`,
      navTo:'remote',group:'active',
      onDelete:onLeaveJoined,
    });
  }

  // Gruppierte Anzeige: Laufend & anstehend → Entwürfe → Beendet.
  // Header werden als Pseudo-Items eingestreut; leere Gruppen entfallen.
  const renderList=[];
  [['active','Laufend & anstehend'],['drafts','Entwürfe'],['done','Beendet']]
    .forEach(([g,label])=>{
      const list=items.filter(it=>it.group===g);
      if(!list.length) return;
      renderList.push({id:'h-'+g,header:label});
      renderList.push(...list);
    });

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <ScreenHeader pad={24}
        title={items.length===0?'Keine laufenden Spiele.':'Laufende Spiele und Turniere.'}
        subtitle={items.length>0?'← Wische nach links zum Löschen':null}
        icon={<LiveTabIcon size={34}/>}/>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>

        {items.length===0&&(
          <div style={{textAlign:'center',color:T.t3,fontSize:16,padding:'40px 20px',lineHeight:1.6}}>
            Starte ein neues Spiel oder Turnier auf dem Home-Screen, um es hier wieder aufzunehmen.
          </div>
        )}

        {renderList.map((item,i)=> item.header?(
          <div key={item.id} className="fi" style={{color:T.t3,fontSize:11,fontWeight:800,
            letterSpacing:1.4,textTransform:'uppercase',margin:'6px 2px -4px'}}>
            {item.header}
          </div>
        ):(
          <div key={item.id} className="fu" style={{animationDelay:`${Math.min(i*0.06,0.4)}s`}}>
            <SwipeableCard onDelete={item.onDelete}>
              <button onClick={()=>item.onClick?item.onClick():nav(item.navTo)}
                style={{width:'100%',background:T.card,border:`1px solid ${item.finished?T.border:T.border}`,
                  borderRadius:23,padding:'18px 20px',display:'flex',alignItems:'center',gap:18,
                  cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s',
                  opacity:item.finished?0.82:1}}
                onPointerDown={e=>e.currentTarget.style.background=T.card2}
                onPointerUp={e=>e.currentTarget.style.background=T.card}
                onPointerLeave={e=>e.currentTarget.style.background=T.card}>
                {item.type==='match'?<SingleMatchIcon size={42}/>:<TrophyIcon size={42}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:item.draft?T.t2:item.finished?T.t1:T.o,fontSize:16,fontWeight:700,marginBottom:3,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div>
                  <div style={{color:T.t3,fontSize:12,fontWeight:500}}>{item.sub}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,
                  background:(item.finished||item.draft)?T.card2:T.oSoft,borderRadius:25,
                  padding:'5px 12px',border:`1px solid ${(item.finished||item.draft)?T.border:T.o}`,flexShrink:0}}>
                  {item.draft
                    ?<span style={{color:T.t2,fontSize:10.5,fontWeight:800,letterSpacing:.3}}>Entwurf</span>
                    :<span style={{color:item.finished?T.t2:T.o,fontSize:11,fontWeight:700}}>{item.finished?'✓':'▶'}</span>}
                </div>
              </button>
            </SwipeableCard>
          </div>
        ))}
      </div>

      <div style={{height:120}}/>
      <BottomFade/>
      <TabBar active={activeTab} onTab={setActiveTab}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KEY CAPTURE — Smart-Ring / Bluetooth-Keyboard Eingabe.

   Doppelter Ansatz:
   1) document-level keydown-Listener: trifft Android/Desktop direkt
      und iOS Safari per Bubbling vom fokussierten Hidden-Input.
   2) Minimal sichtbarer Input (4×4 px, opacity 0.01): iOS Safari
      dispatcht Bluetooth-Keyboard-Events NUR an fokussierte Inputs,
      und nur an solche, die der Render-Engine "sichtbar genug"
      sind — opacity:0 reicht iOS nicht.

   Latest-Handler-Pattern via Ref: onKey wird in einer Ref gehalten,
   damit der document-Listener nicht für jedes Rerender neu auf-
   und abgebaut wird (das war der "Verzögerungs-/Refocus-Bug").
═══════════════════════════════════════════════════════════════ */
function KeyCapture({onKey,enabled=true}){
  const inputRef=useRef(null);
  const onKeyRef=useRef(onKey);
  useEffect(()=>{onKeyRef.current=onKey;},[onKey]);

  useEffect(()=>{
    if(!enabled)return;
    const el=inputRef.current;
    if(!el)return;

    const focusInput=()=>{
      try{el.focus({preventScroll:true});}catch{try{el.focus();}catch{}}
    };
    focusInput();

    // Single source of truth: document-level keydown (capture phase).
    // Real form inputs müssen normal tippbar bleiben — wir filtern raus.
    const handleKey=(e)=>{
      const t=e.target;
      if(t&&t!==el&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable)) return;
      onKeyRef.current?.(e);
    };
    document.addEventListener('keydown',handleKey,true);

    // Aggressive Refocus — jeder Pfad in dem iOS Safari den Fokus
    // verlieren könnte muss sofort restored werden.
    const refocus=()=>requestAnimationFrame(focusInput);
    const handlePointer=(e)=>{
      const t=e.target;
      if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable)) return;
      refocus();
    };
    const handleVisibility=()=>{
      if(document.visibilityState==='visible') refocus();
    };
    document.addEventListener('pointerdown',handlePointer);
    document.addEventListener('touchend',handlePointer,{passive:true});
    document.addEventListener('visibilitychange',handleVisibility);
    window.addEventListener('focus',focusInput);
    window.addEventListener('ritmo-refocus-key',refocus);

    // Sicherheitsnetz: 150 ms statt 400 ms — die Wahrnehmungsschwelle
    // für "fühlt sich sofort an" liegt bei ~100 ms.
    const interval=setInterval(()=>{
      const ae=document.activeElement;
      if(ae===el) return;
      if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.isContentEditable)) return;
      focusInput();
    },150);

    return()=>{
      document.removeEventListener('keydown',handleKey,true);
      document.removeEventListener('pointerdown',handlePointer);
      document.removeEventListener('touchend',handlePointer);
      document.removeEventListener('visibilitychange',handleVisibility);
      window.removeEventListener('focus',focusInput);
      window.removeEventListener('ritmo-refocus-key',refocus);
      clearInterval(interval);
    };
  },[enabled]);

  if(!enabled)return null;

  return(
    <input
      ref={inputRef}
      type="text"
      inputMode="none"
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck="false"
      value=""
      onChange={()=>{}}
      onBeforeInput={(e)=>e.preventDefault()}
      aria-hidden="true"
      tabIndex={-1}
      style={{
        position:'fixed',top:0,left:0,
        width:4,height:4,
        // opacity 0 würde iOS Safari den Fokus verweigern lassen.
        opacity:0.01,
        border:'none',outline:'none',
        background:'transparent',color:'transparent',
        caretColor:'transparent',
        zIndex:-1,
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   INPUT TESTER — zeigt live welche Tasten von der Hardware kommen
═══════════════════════════════════════════════════════════════ */
function InputTester(){
  const[last,setLast]=useState(null);
  const[tick,setTick]=useState(0);

  const handleKey=(e)=>{
    setLast({
      key: e.key===' '?'Space':e.key,
      code: e.code,
      time: Date.now(),
    });
  };

  // Tick to update "fresh" highlight
  useEffect(()=>{
    const id=setInterval(()=>setTick(t=>t+1),200);
    return()=>clearInterval(id);
  },[]);

  const fresh=last&&(Date.now()-last.time<1500);

  return(
    <div style={{margin:'8px 0 14px',padding:'14px',
      background:T.card2,borderRadius:13,border:`1px solid ${T.border}`}}>
      <KeyCapture onKey={handleKey}/>
      <div style={{color:T.t1,fontSize:12,fontWeight:700,marginBottom:10}}>
        Eingabe testen
      </div>

      {/* Detection display */}
      <div style={{
        background: fresh?T.oSoft:T.card,
        border:`1.5px solid ${fresh?T.o:T.border}`,
        borderRadius:13,padding:'18px 14px',textAlign:'center',
        transition:'background .2s, border-color .2s'}}>
        {last?(
          <>
            <div style={{color:fresh?T.o:T.t1,fontSize:22,fontWeight:800,
              fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',transition:'color .2s',letterSpacing:.5}}>
              {last.key}
            </div>
            <div style={{color:T.t3,fontSize:10,marginTop:4,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>
              {last.code}
            </div>
          </>
        ):(
          <div style={{color:T.t3,fontSize:13,fontWeight:600,
            animation:'pulse 1.5s ease infinite'}}>
            Warte auf Eingabe...
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUESTION TOGGLE (Tastenbelegung an/aus)
═══════════════════════════════════════════════════════════════ */
function QuestionToggle({filled,onClick}){
  return(
    <span onClick={(e)=>{e.stopPropagation();e.preventDefault();onClick();}}
      onPointerDown={e=>e.stopPropagation()}
      role="button" tabIndex={0}
      style={{width:24,height:24,borderRadius:'50%',cursor:'pointer',
        display:'inline-flex',alignItems:'center',justifyContent:'center',
        flexShrink:0,userSelect:'none'}}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9.5"
          fill={filled?T.o:'none'}
          stroke={T.o} strokeWidth="1.6"/>
        <text x="11" y="15.5" textAnchor="middle"
          fill={filled?T.bg:T.o} fontSize="13" fontWeight="800"
          fontFamily="-apple-system,sans-serif">?</text>
      </svg>
    </span>
  );
}


/* ═══════════════════════════════════════════════════════════════
   SETTINGS SCREEN
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   SETTINGS — Top-Level Card-List

   Jede Karte führt in einen Sub-Screen (SettingsSubLayout) mit
   einem floating Gear-Button unten-rechts, der zurück nach
   /settings navigiert. Die einzelnen Inhalte (Steuerung,
   Anpassung, Privatsphäre, …) leben in eigenen Komponenten
   weiter unten.
═══════════════════════════════════════════════════════════════ */

function SettingsCard({icon,title,desc,onClick,destructive=false,q=''}){
  const color   = destructive ? '#FF6B6B' : T.t1;
  const accent  = destructive ? '#FF6B6B' : T.o;
  const border  = destructive ? 'rgba(232,69,69,0.35)' : T.border;
  const bg      = destructive ? 'rgba(232,69,69,0.08)' : T.card;
  return(
    <button onClick={onClick} data-lift
      style={{width:'100%',background:bg,border:`1px solid ${border}`,borderRadius:19,
        padding:'16px 18px',display:'flex',alignItems:'center',gap:16,
        color,textAlign:'left',cursor:'pointer'}}
      onPointerDown={e=>e.currentTarget.style.background = destructive ? 'rgba(232,69,69,0.14)' : T.card2}
      onPointerUp={e=>e.currentTarget.style.background = bg}
      onPointerLeave={e=>e.currentTarget.style.background = bg}>
      <div style={{flexShrink:0,color:accent,display:'flex',alignItems:'center',
        justifyContent:'center',width:38,height:38,
        background:destructive?'rgba(232,69,69,0.10)':T.card2,
        border:`1px solid ${destructive?'rgba(232,69,69,0.25)':T.border}`,borderRadius:13}}>
        {icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color,fontSize:15,fontWeight:700,letterSpacing:-.1,marginBottom:2}}>
          <Hl text={title} q={q}/>
        </div>
        <div style={{color:destructive?'rgba(255,107,107,0.7)':T.t3,fontSize:12,
          fontWeight:500,lineHeight:1.55}}>
          <Hl text={desc} q={q}/>
        </div>
      </div>
      <ChevronRightIcon size={18} color={destructive?'rgba(255,107,107,0.7)':T.t3}/>
    </button>
  );
}

function Settings({onHome,onBack,nav,onLogout}){
  // Such-Query — eigenes Suchfeld im Screen (die Navbar-Suche ist weg,
  // Einstellungen sind kein Tab mehr und wohnen im Profil).
  const[query,setQuery]=useState('');
  const q=query;

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <ScreenHeader pad={0} title={<Hl text="Einstellungen" q={q}/>}
        icon={<GearIcon size={34}/>}/>
      <div style={{padding:'0 9px 22px'}}>
        {/* iOS-style Suchfeld unter dem Large Title */}
        <div style={{margin:'14px 13px 0',display:'flex',alignItems:'center',gap:8,
          background:T.card,border:`1px solid ${T.border}`,borderRadius:13,
          padding:'9px 12px'}}>
          <SearchIcon size={16}/>
          <input value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Einstellungen durchsuchen…"
            autoCorrect="off" autoCapitalize="off" spellCheck={false}
            style={{flex:1,minWidth:0,border:'none',background:'transparent',
              outline:'none',color:T.t1,fontSize:16,fontWeight:500}}/>
          {query&&(
            <button onClick={()=>setQuery('')} aria-label="Eingabe löschen"
              style={{width:20,height:20,borderRadius:'50%',background:T.card2,
                border:'none',color:T.t1,fontSize:11,fontWeight:700,cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',
                flexShrink:0,lineHeight:1}}>×</button>
          )}
        </div>
      </div>

      {/* Einheitlicher gap — alle Cards sitzen gleichmäßig auseinander.
          Visuelle Gruppierung läuft jetzt nur noch über die Card-Farbe
          (destruktive Konto-Karte = rot), nicht mehr über Extra-Spacer. */}
      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:12,overflowY:'auto'}}>

        <SettingsCard q={q}
          icon={<SteeringWheelIcon size={22} color="currentColor"/>}
          title="Steuerung"
          desc="Score-Gerät, Sprachansagen und mehr."
          onClick={()=>nav('settings-steuerung')}/>

        <SettingsCard q={q}
          icon={<PaletteIcon size={22} color="currentColor"/>}
          title="Anpassung"
          desc="Wähle dein Erscheinungsbild."
          onClick={()=>nav('settings-anpassung')}/>

        <SettingsCard q={q}
          icon={<EyeIcon size={22} color="currentColor"/>}
          title="Privatsphäre"
          desc="Wer dich findet · wer deine Stats sieht."
          onClick={()=>nav('settings-privatsphaere')}/>

        <SettingsCard q={q}
          icon={<BellIcon size={22} color="currentColor"/>}
          title="Benachrichtigungen"
          desc="Match-Reminder, Turnier-Alerts, Chats."
          onClick={()=>nav('settings-benachrichtigungen')}/>

        <SettingsCard q={q}
          icon={<LockIcon size={22} color="currentColor"/>}
          title="Sicherheit"
          desc="Passwort, Sessions, Zwei-Faktor."
          onClick={()=>nav('settings-sicherheit')}/>

        {/* Konto-Löschung wird bewusst NICHT als eigene Top-Level-Karte
            angeboten — sie liegt ausschließlich unter
            Privatsphäre → "Konto und Daten löschen", damit User vor
            dem Schritt erst die DSGVO-Konsequenzen sehen. */}

        {/* Abmelden — ganz unten in den Einstellungen (aus dem
            Home-Burger hierher verlegt). */}
        <button onClick={onLogout}
          style={{width:'100%',marginTop:4,background:T.card,
            border:`1px solid ${T.border}`,borderRadius:19,
            padding:'16px 18px',display:'flex',alignItems:'center',gap:16,
            color:T.o,fontWeight:800,fontSize:15,letterSpacing:-.1,
            cursor:'pointer',textAlign:'left'}}
          onPointerDown={e=>e.currentTarget.style.background=T.card2}
          onPointerUp={e=>e.currentTarget.style.background=T.card}
          onPointerLeave={e=>e.currentTarget.style.background=T.card}>
          <div style={{flexShrink:0,color:T.o,display:'flex',alignItems:'center',
            justifyContent:'center',width:38,height:38,background:T.card2,
            border:`1px solid ${T.border}`,borderRadius:13}}>
            <ExitGlyph size={20}/>
          </div>
          <span style={{flex:1}}>Abmelden</span>
        </button>

        <div style={{height:120,flexShrink:0}}/>
      </div>

      <BottomFade/>
      <MatchBar onHome={onHome}
        rightButtons={[{icon:<PersonGlyph size={20}/>,onClick:onBack}]}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS-SUB-LAYOUT — Wrapper für alle Sub-Screens.

   Konsistente Chrome: Header mit Titel + Beschreibung, scrollbarer
   Content-Bereich, floating Gear-FAB unten-rechts, der zurück zur
   Einstellungs-Übersicht navigiert.
═══════════════════════════════════════════════════════════════ */
function SettingsSubLayout({title,desc,icon,onBack,onHome,children}){
  // Wiederverwendbarer FAB-Stil — beide Buttons sind identisch aufgebaut,
  // nur die Position (links vs. rechts) und das Icon unterscheiden sich.
  // Liquid-Glass-FABs — Material liefert die .glass-bar-Klasse.
  const fabBase={
    position:'absolute',
    // Auf Navbar-Hoehe: 54px-FAB so setzen, dass sein Zentrum auf der
    // Navbar-Mittellinie liegt (Navbar-Center = inset*0.3 + 25.5px →
    // FAB-bottom = center - 27 = inset*0.3 - 1.5px).
    bottom:'calc(env(safe-area-inset-bottom, 0px) * 0.3 - 1.5px)',
    width:54,height:54,borderRadius:'50%',
    color:T.t1,cursor:'pointer',
    display:'flex',alignItems:'center',justifyContent:'center',
    zIndex:5,
  };
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',
      position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 22px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          {icon&&(
            <div style={{flexShrink:0,color:T.o,
              width:36,height:36,background:T.card2,
              border:`1px solid ${T.border}`,borderRadius:13,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              {icon}
            </div>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.5,
              textTransform:'uppercase'}}>Einstellungen</div>
            <div style={{color:T.t1,fontSize:24,fontWeight:800,letterSpacing:-.3,marginTop:2}}>
              {title}
            </div>
          </div>
        </div>
        {desc&&(
          <div style={{color:T.t3,fontSize:13,lineHeight:1.5,marginTop:8}}>{desc}</div>
        )}
      </div>

      <div style={{flex:1,padding:'0 22px 140px',overflowY:'auto',
        WebkitOverflowScrolling:'touch'}}>
        {children}
      </div>

      <BottomFade/>

      {/* Floating Home-FAB links → zur Startseite */}
      {onHome&&(
        <button onClick={onHome} aria-label="Zurück zur Startseite"
          className="glass-bar" style={{...fabBase,left:22}}>
          <HomeIcon size={22}/>
        </button>
      )}

      {/* Floating Gear-FAB rechts → zurück zur Settings-Übersicht */}
      <button onClick={onBack} aria-label="Zurück zu Einstellungen"
        className="glass-bar" style={{...fabBase,right:22}}>
        <GearIcon size={22}/>
      </button>
    </div>
  );
}

/* ─── Steuerung — Score-Gerät, Sprachansage, Timer-Klingelton ────── */
function SettingsSteuerung({onBack,onHome,inputMode,setInputMode,voiceOn,setVoiceOn,
  ringId,setRingId}){
  const[showInfo,setShowInfo]=useState(false);
  const inputs=[
    {id:'smartphone',label:'Smartphone',icon:<PhoneIcon size={22} color={T.t1}/>,sub:'Tippen auf die Score-Karten'},
    {id:'presenter',label:'Presenter',icon:<KeyboardIcon size={22} color={T.t1}/>,sub:'Page Up / Page Down Tasten'},
    {id:'ring',label:'Smart Ring',icon:<RingIcon size={22} color={T.t1}/>,sub:'Bluetooth Scroll-Ring am Finger'},
    {id:'watch',label:'Smartwatch',icon:<WatchIcon size={22} color={T.t1}/>,sub:'Bald verfügbar'},
    {id:'flic',label:'Flic Button',icon:<FlicIcon size={22} color={T.t1}/>,sub:'Bald verfügbar'},
  ];
  return(
    <SettingsSubLayout title="Steuerung"
      desc="Wie Punkte vergeben werden, Klang & Stimme."
      icon={<SteeringWheelIcon size={22} color="currentColor"/>}
      onBack={onBack} onHome={onHome}>

      {/* Score-Gerät */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
        padding:'18px 18px 6px',marginBottom:12}}>
        <div style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.3,
          textTransform:'uppercase',marginBottom:8}}>Score-Gerät</div>
        {inputs.map((opt,i)=>{
          const isSel=inputMode===opt.id;
          const hasInfo=opt.id==='presenter'||opt.id==='ring';
          const disabled=opt.id==='flic'||opt.id==='watch';
          return(
            <button key={opt.id} onClick={()=>!disabled&&setInputMode(opt.id)}
              disabled={disabled}
              style={{width:'100%',padding:'14px 0',background:'transparent',
                border:'none',borderTop:i>0?`1px solid ${T.sep}`:'none',
                display:'flex',alignItems:'center',gap:14,
                cursor:disabled?'not-allowed':'pointer',
                opacity:disabled?.45:1,textAlign:'left'}}>
              <span style={{width:32,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{opt.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:T.t1,fontSize:15,fontWeight:600}}>{opt.label}</div>
                <div style={{color:T.t3,fontSize:11,marginTop:1,fontWeight:500}}>{opt.sub}</div>
              </div>
              {isSel&&hasInfo&&(
                <QuestionToggle filled={showInfo} onClick={()=>setShowInfo(s=>!s)}/>
              )}
              {isSel&&<span style={{color:T.o,fontSize:18,fontWeight:700,paddingRight:4}}>✓</span>}
            </button>
          );
        })}

        {/* Sub-Info pro Modus */}
        {inputMode==='presenter'&&!showInfo&&<InputTester/>}
        {inputMode==='presenter'&&showInfo&&(
          <div style={{margin:'8px 0 14px',padding:'14px 16px',background:T.card2,borderRadius:13,
            border:`1px solid ${T.border}`,color:T.t2,fontSize:12,lineHeight:1.7}}>
            <div style={{color:T.t1,fontWeight:700,marginBottom:6}}>Tasten-Belegung:</div>
            <div>Page Up → Punkt Team A</div>
            <div>Page Down → Punkt Team B</div>
            <div>Doppelklick Page Up → Letzten Punkt rückgängig</div>
            <div>Doppelklick Page Down → Spiel zurücksetzen</div>
          </div>
        )}
        {inputMode==='ring'&&!showInfo&&<InputTester/>}
        {inputMode==='ring'&&showInfo&&(
          <div style={{margin:'8px 0 14px',padding:'14px 16px',background:T.card2,borderRadius:13,
            border:`1px solid ${T.border}`,color:T.t2,fontSize:12,lineHeight:1.7}}>
            <div style={{color:T.t1,fontWeight:700,marginBottom:6}}>Tasten-Belegung:</div>
            <div><span style={{color:T.t1,fontWeight:700,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>2</span> → Punkt Team A</div>
            <div><span style={{color:T.t1,fontWeight:700,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>4</span> → Punkt Team B</div>
            <div><span style={{color:T.t1,fontWeight:700,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>Leertaste</span> → Letzten Punkt rückgängig</div>
            <div><span style={{color:T.t1,fontWeight:700,fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>1</span> → Spiel zurücksetzen</div>
            <div style={{color:T.t1,fontWeight:700,marginTop:10,marginBottom:4}}>Reset rückgängig:</div>
            <div style={{color:T.t3}}>
              Nach Reset hast du 1.5 Sekunden Zeit, durch erneutes Drücken von 1 den vorherigen Spielstand wiederherzustellen.
            </div>
            <div style={{marginTop:10,color:T.t3,fontStyle:'italic',fontSize:11}}>
              Setup: Ring per Bluetooth koppeln, RITMO Padel öffnen, drücken — funktioniert sofort.
            </div>
          </div>
        )}
        {inputMode==='flic'&&(
          <div style={{margin:'8px 0 14px',padding:'14px 16px',background:T.card2,borderRadius:13,
            border:`1px solid ${T.border}`,color:T.t3,fontSize:12,lineHeight:1.6}}>
            Flic Button Integration kommt in einer zukünftigen Version.
          </div>
        )}
        {inputMode==='watch'&&(
          <div style={{margin:'8px 0 14px',padding:'14px 16px',background:T.card2,borderRadius:13,
            border:`1px solid ${T.border}`,color:T.t3,fontSize:12,lineHeight:1.6}}>
            Smartwatch Integration kommt in einer zukünftigen Version.
          </div>
        )}
      </div>

      {/* Sprachansage */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
        padding:'14px 18px',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:15,fontWeight:600}}>Sprachansage</div>
            <div style={{color:T.t3,fontSize:11,marginTop:2}}>
              Score wird vom RITMO-Voice angesagt.
            </div>
          </div>
          <div onClick={()=>setVoiceOn(!voiceOn)}
            style={{width:48,height:28,borderRadius:19,
              background:voiceOn?T.o:'rgba(120,120,128,.32)',
              position:'relative',cursor:'pointer',transition:'background .25s',flexShrink:0}}>
            <div style={{width:24,height:24,borderRadius:'50%',background:T.bg,
              position:'absolute',top:2,left:voiceOn?22:2,transition:'left .25s',
              boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
          </div>
        </div>
      </div>

      {/* Timer-Klingelton — globale Einstellung für ALLE Timer in
          der App (Americano + Turnier-Rundentimer). Wer die Glocke
          hier wechselt, hört sie überall. */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
        padding:'18px 18px 8px'}}>
        <div style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.3,
          textTransform:'uppercase',marginBottom:4}}>Timer-Klingelton</div>
        <div style={{color:T.t3,fontSize:12,fontWeight:500,marginBottom:14,lineHeight:1.5}}>
          Globaler Ton — spielt beim Ablaufen aller Timer (Americano + Turnier-Runden).
        </div>
        {RINGS.map((r,i)=>(
          <div key={r.id} onClick={()=>setRingId(r.id)}
            style={{display:'flex',alignItems:'center',padding:'12px 0',
              borderBottom:i<RINGS.length-1?`1px solid ${T.sep}`:'none',cursor:'pointer'}}>
            <div style={{flex:1}}>
              <div style={{color:T.t1,fontSize:16,fontWeight:ringId===r.id?700:500}}>{r.label}</div>
              <div style={{color:T.t3,fontSize:11,marginTop:1}}>{r.desc}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <button onClick={e=>{e.stopPropagation();playRing(r.id);}}
                aria-label="Vorhören"
                style={{width:30,height:30,borderRadius:8,background:T.card2,
                  border:`1px solid ${T.border}`,
                  cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill={T.o} aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
              </button>
              {ringId===r.id
                ?<span style={{color:T.o,fontSize:16,width:16,textAlign:'center'}}>✓</span>
                :<span style={{width:16}}/>}
            </div>
          </div>
        ))}
      </div>
    </SettingsSubLayout>
  );
}

/* ─── Anpassung — Theme picker + Tablet-Modus ────────────────────
   Tablet-Modus skaliert das Match-Scoreboard für größere Screens
   (Padel-Court-Display, iPad neben dem Platz). Service-Indikator und
   Punkte-Verlauf bleiben in beiden Modi erhalten — siehe Match.jsx.
═══════════════════════════════════════════════════════════════ */
function SettingsAnpassung({onBack,onHome,theme,setTheme,tabletMode,setTabletMode}){
  const themes=[
    {id:'glass',label:'Liquid Glass',icon:<MoonIcon size={20} color={T.t1}/>,desc:'iOS-Look — dunkles Milchglas, farbiges Licht'},
    {id:'glass-light',label:'Liquid Glass Hell',icon:<SunIcon size={20} color={T.t1}/>,desc:'iOS-Look — helles Milchglas'},
    {id:'dark',label:'RITMO BAUHAUS Dark',icon:<MoonIcon size={20} color={T.t1}/>,desc:'Schwarz, weiß, orange'},
    {id:'light',label:'Federleicht',icon:<SunIcon size={20} color={T.t1}/>,desc:'Weiß, schwarz, blau'},
    {id:'padel',label:'Padelhaus Blue',icon:<TennisBallIcon size={20}/>,desc:'Elektroblau, weiß, gelb'},
    // Wimbledon Green + RITMO BAUHAUS Funky vorerst ausgeblendet.
  ];
  return(
    <SettingsSubLayout title="Anpassung"
      desc="Wähle dein Erscheinungsbild."
      icon={<PaletteIcon size={22} color="currentColor"/>}
      onBack={onBack} onHome={onHome}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
        padding:'18px 18px 8px',marginBottom:12}}>
        <div style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.3,
          textTransform:'uppercase',marginBottom:8}}>Theme</div>
        {themes.map((th,i)=>(
          <div key={th.id} onClick={()=>setTheme(th.id)}
            style={{display:'flex',alignItems:'center',padding:'12px 0',
              borderBottom:i<themes.length-1?`1px solid ${T.sep}`:'none',cursor:'pointer'}}>
            <div style={{marginRight:12,width:22,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{th.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.t1,fontSize:16,fontWeight:theme===th.id?700:500}}>{th.label}</div>
              <div style={{color:T.t3,fontSize:11,marginTop:1}}>{th.desc}</div>
              {th.id==='funky'&&<div style={{marginTop:6}}><FunkyFruitsRow size={14} gap={6}/></div>}
            </div>
            {theme===th.id
              ?<span style={{color:T.o,fontSize:16,width:16,textAlign:'center'}}>✓</span>
              :<span style={{width:16}}/>}
          </div>
        ))}
      </div>

      {/* Tablet-Modus */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
        padding:'18px 18px',marginBottom:12}}>
        <div style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.3,
          textTransform:'uppercase',marginBottom:12}}>Anzeige</div>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:32,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:T.t1}}><PhoneIcon size={22}/></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:16,fontWeight:700}}>Tablet-Modus</div>
            <div style={{color:T.t3,fontSize:11,marginTop:2,lineHeight:1.5}}>
              Score-Anzeige wird für iPad-Größen optimiert: größere Karten,
              dickere Zahlen, mehr Luft. Service-Indikator und Punkte-Verlauf
              bleiben erhalten.
            </div>
          </div>
          <SettingsToggle on={tabletMode} onToggle={()=>setTabletMode(!tabletMode)}/>
        </div>
      </div>
    </SettingsSubLayout>
  );
}

/* ─── Wiederverwendbare iOS-Style Toggle ────────────────────────
   Settings-Sub-Screens nutzen alle das gleiche Switch-Pattern.
   Wir bündeln es hier, damit die Sub-Screens nur noch Reihen
   beschreiben und sich nicht um Layout-Kram kümmern müssen.
═══════════════════════════════════════════════════════════════ */
function SettingsToggle({on,onToggle,disabled=false}){
  return(
    <div onClick={()=>!disabled&&onToggle&&onToggle()}
      role="switch" aria-checked={!!on} aria-disabled={disabled||undefined}
      style={{width:48,height:28,borderRadius:19,
        background:on?T.o:'rgba(120,120,128,.32)',
        position:'relative',cursor:disabled?'not-allowed':'pointer',
        opacity:disabled?.5:1,
        transition:'background .25s',flexShrink:0}}>
      <div style={{width:24,height:24,borderRadius:'50%',background:T.bg,
        position:'absolute',top:2,left:on?22:2,transition:'left .25s',
        boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
    </div>
  );
}

function SettingsToggleRow({title,desc,on,onToggle,first=false,disabled=false}){
  return(
    <div style={{display:'flex',alignItems:'center',padding:'14px 0',gap:12,
      borderTop:first?'none':`1px solid ${T.sep}`}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:disabled?T.t3:T.t1,fontSize:16,fontWeight:600}}>{title}</div>
        {desc&&(
          <div style={{color:T.t3,fontSize:11,marginTop:2,lineHeight:1.55}}>{desc}</div>
        )}
      </div>
      <SettingsToggle on={on} onToggle={onToggle} disabled={disabled}/>
    </div>
  );
}

function SettingsSection({eyebrow,children,style}){
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
      padding:'18px 18px 6px',marginBottom:12,...(style||{})}}>
      {eyebrow&&(
        <div style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.3,
          textTransform:'uppercase',marginBottom:8}}>{eyebrow}</div>
      )}
      {children}
    </div>
  );
}

/* Kleines Inline-Flash für Erfolg/Fehler. Verschwindet nach ~4s. */
function SettingsFlash({kind,text}){
  if(!text) return null;
  const ok=kind==='ok';
  return(
    <div style={{
      padding:'10px 14px',marginBottom:12,borderRadius:13,
      background:ok?'rgba(34,180,90,0.10)':'rgba(232,69,69,0.10)',
      border:`1px solid ${ok?'rgba(34,180,90,0.4)':'rgba(232,69,69,0.4)'}`,
      color:ok?'#7ED39C':'#FF8A8A',fontSize:12,fontWeight:600,lineHeight:1.5}}>
      {text}
    </div>
  );
}

/* ─── Privatsphäre — Wer sieht was vom Profil ──────────────────
   Spiegelt profile.private (Public-Profile-Toggle) und führt drei
   neue Hide-Flags ein (hideStats / hideDna / hideMatches), die im
   Profile-Blob persistiert werden. Public-Profile-Konsumenten
   (PublicProfile, PlayerSearch) können diese Flags respektieren —
   default ist "alles teilen", damit Bestands-User keine
   versteckten Profile bekommen.
═══════════════════════════════════════════════════════════════ */
function SettingsPrivatsphaere({onBack,onHome,profile,setProfile,onOpenDelete}){
  const[flash,setFlash]=useState(null);
  const isPublic=!profile.private;
  const togglePublic =()=>setProfile(p=>({...p,private:!p.private}));
  const toggleHide   =(k)=>setProfile(p=>({...p,[k]:!p[k]}));

  /* DSGVO — User darf eine vollständige Kopie seiner Daten als JSON
     herunterladen. Wir sammeln das Profil + alle ritmo_*-Keys aus
     localStorage und triggern einen Download. */
  const onExport=()=>{
    try{
      const dump={
        exportedAt:new Date().toISOString(),
        app:'RITMO Padel',
        profile,
        localStorage:Object.keys(localStorage)
          .filter(k=>k.startsWith('ritmo_'))
          .reduce((acc,k)=>{
            try{ acc[k]=JSON.parse(localStorage.getItem(k)); }
            catch{ acc[k]=localStorage.getItem(k); }
            return acc;
          },{}),
      };
      const blob=new Blob([JSON.stringify(dump,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download=`ritmo-export-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFlash({kind:'ok',text:'Export gestartet — schau in deine Downloads.'});
      setTimeout(()=>setFlash(null),4000);
    }catch(e){
      setFlash({kind:'err',text:'Export fehlgeschlagen: '+(e?.message||'unbekannt')});
      setTimeout(()=>setFlash(null),4000);
    }
  };

  return(
    <SettingsSubLayout title="Privatsphäre"
      desc="Wer dich findet, wer deine Stats sieht."
      icon={<EyeIcon size={22} color="currentColor"/>}
      onBack={onBack} onHome={onHome}>

      {flash&&<SettingsFlash kind={flash.kind} text={flash.text}/>}

      {/* Sichtbarkeit */}
      <SettingsSection eyebrow="Sichtbarkeit">
        <SettingsToggleRow first
          title={isPublic?'Profil öffentlich':'Profil privat'}
          desc={isPublic
            ?'Andere können dich in der Spielersuche finden und dir folgen.'
            :'Niemand findet dich — nur du siehst dein Profil.'}
          on={isPublic} onToggle={togglePublic}/>
        <SettingsToggleRow
          title="RITMO DNA teilen"
          desc="Spielstil-Karte (z. B. Motor, Architekt) im öffentlichen Profil."
          on={!profile.hideDna} onToggle={()=>toggleHide('hideDna')}
          disabled={!isPublic}/>
        <SettingsToggleRow
          title="Stats teilen"
          desc="Level, Siegquote und Match-Count auf deinem öffentlichen Profil."
          on={!profile.hideStats} onToggle={()=>toggleHide('hideStats')}
          disabled={!isPublic}/>
        <SettingsToggleRow
          title="Match-Historie teilen"
          desc="Deine letzten Matches sind für Follower sichtbar."
          on={!profile.hideMatches} onToggle={()=>toggleHide('hideMatches')}
          disabled={!isPublic}/>
      </SettingsSection>

      {/* DSGVO */}
      <SettingsSection eyebrow="Deine Daten (DSGVO)">
        <div style={{color:T.t2,fontSize:12,lineHeight:1.6,padding:'6px 0 14px'}}>
          Du hast jederzeit Anspruch auf eine Kopie deiner Daten und auf
          deren Löschung. Der Export enthält dein Profil + alle lokal
          gespeicherten Einstellungen als JSON-Datei.
        </div>
        <button onClick={onExport}
          style={{width:'100%',marginBottom:10,padding:'14px 16px',
            background:T.card2,border:`1px solid ${T.border}`,borderRadius:13,
            color:T.t1,fontSize:13,fontWeight:700,letterSpacing:.2,
            cursor:'pointer',textAlign:'left',
            display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>Meine Daten exportieren</span>
          <span style={{color:T.o,fontSize:18,fontWeight:900}}>↓</span>
        </button>
        <button onClick={onOpenDelete}
          style={{width:'100%',marginBottom:12,padding:'14px 16px',
            background:'rgba(232,69,69,0.08)',border:'1px solid rgba(232,69,69,0.35)',
            borderRadius:13,color:'#FF6B6B',fontSize:13,fontWeight:700,letterSpacing:.2,
            cursor:'pointer',textAlign:'left',
            display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>Konto und Daten löschen</span>
          <ChevronRightIcon size={16} color="currentColor"/>
        </button>
      </SettingsSection>

    </SettingsSubLayout>
  );
}

/* ─── Benachrichtigungen — Push + In-App Mitteilungen ─────────
   Speichert Präferenzen in localStorage (ritmo_notify). Der Push-
   Permission-Status wird live aus window.Notification gelesen,
   damit System-Settings (z. B. iOS-Sperre) sofort sichtbar sind.
═══════════════════════════════════════════════════════════════ */
function SettingsBenachrichtigungen({onBack,onHome,notify,setNotify}){
  // Live-Spiegel von Notification.permission (kann sich durch System
  // ändern, ohne dass die App re-rendert — wir aktualisieren bei jedem
  // Mount).
  const[perm,setPerm]=useState(()=>{
    if(typeof window==='undefined'||!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });
  const[busy,setBusy]=useState(false);
  const[flash,setFlash]=useState(null);

  const requestPush=async()=>{
    if(busy) return;
    if(perm==='unsupported'){
      setFlash({kind:'err',text:'Dein Browser unterstützt keine Push-Benachrichtigungen.'});
      setTimeout(()=>setFlash(null),4000);
      return;
    }
    if(perm==='denied'){
      setFlash({kind:'err',text:'Benachrichtigungen sind blockiert — bitte in den System-Einstellungen freigeben.'});
      setTimeout(()=>setFlash(null),5000);
      return;
    }
    setBusy(true);
    try{
      const r=await Notification.requestPermission();
      setPerm(r);
      if(r==='granted'){
        setFlash({kind:'ok',text:'Push aktiviert. Wir melden uns nur, wenn es wichtig ist.'});
      } else if(r==='denied'){
        setFlash({kind:'err',text:'Push wurde abgelehnt.'});
      }
      setTimeout(()=>setFlash(null),4000);
    }catch(e){
      setFlash({kind:'err',text:'Konnte nicht angefragt werden: '+(e?.message||'unbekannt')});
      setTimeout(()=>setFlash(null),4000);
    }finally{ setBusy(false); }
  };

  const set=(k,v)=>setNotify(n=>({...n,[k]:v}));
  const tog=(k)=>setNotify(n=>({...n,[k]:!n[k]}));

  // Wenn Push nicht aktiv ist, sind die Kategorie-Toggles "Push" gedämpft.
  // In-App-Toggles (Sound, Vibration) bleiben unabhängig nutzbar.
  const pushOn=perm==='granted';

  const permLabel=
    perm==='granted'?'Aktiv':
    perm==='denied' ?'Blockiert':
    perm==='unsupported'?'Nicht verfügbar':'Nicht aktiviert';
  const permColor=
    perm==='granted'?'#7ED39C':
    perm==='denied' ?'#FF8A8A':T.t3;

  return(
    <SettingsSubLayout title="Benachrichtigungen"
      desc="Push, In-App-Hinweise, Sound & Vibration."
      icon={<BellIcon size={22} color="currentColor"/>}
      onBack={onBack} onHome={onHome}>

      {flash&&<SettingsFlash kind={flash.kind} text={flash.text}/>}

      {/* Push-Status */}
      <SettingsSection eyebrow="Push-Status">
        <div style={{display:'flex',alignItems:'center',gap:14,padding:'6px 0 14px'}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:16,fontWeight:700,marginBottom:2}}>
              Push-Benachrichtigungen
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:permColor,
                display:'inline-block',flexShrink:0}}/>
              <span style={{color:permColor,fontSize:11,fontWeight:800,
                letterSpacing:1,textTransform:'uppercase'}}>{permLabel}</span>
            </div>
          </div>
          {perm!=='granted'&&perm!=='unsupported'&&(
            <button onClick={requestPush} disabled={busy}
              style={{padding:'10px 14px',background:T.o,border:'none',borderRadius:13,
                color:'#000',fontSize:12,fontWeight:800,letterSpacing:.3,
                cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,flexShrink:0}}>
              Aktivieren
            </button>
          )}
        </div>
        {perm==='denied'&&(
          <div style={{padding:'10px 12px',background:T.card2,borderRadius:13,
            border:`1px solid ${T.border}`,color:T.t3,fontSize:11,lineHeight:1.55,marginBottom:10}}>
            Browser/System hat Push blockiert. Du musst es in den System-Einstellungen
            wieder freigeben, bevor wir dir senden dürfen.
          </div>
        )}
      </SettingsSection>

      {/* Kategorien — was wir senden dürfen */}
      <SettingsSection eyebrow="Was wir senden dürfen">
        <SettingsToggleRow first
          title="Match-Reminder"
          desc="15 Minuten und 1 Stunde vor einem geplanten Match."
          on={notify.matchReminder} onToggle={()=>tog('matchReminder')}
          disabled={!pushOn}/>
        <SettingsToggleRow
          title="Turnier-Updates"
          desc="Ready-Check, neue Runde, Score-Approval."
          on={notify.tournamentAlerts} onToggle={()=>tog('tournamentAlerts')}
          disabled={!pushOn}/>
        <SettingsToggleRow
          title="Chat-Mitteilungen"
          desc="Neue Nachrichten in deinen Club-Chats."
          on={notify.chatMessages} onToggle={()=>tog('chatMessages')}
          disabled={!pushOn}/>
        <SettingsToggleRow
          title="Follower & Soziales"
          desc="Wenn dir jemand folgt oder dich erwähnt."
          on={notify.social} onToggle={()=>tog('social')}
          disabled={!pushOn}/>
      </SettingsSection>

      {/* Wie wir benachrichtigen — funktioniert auch in-App, daher
          unabhängig vom Push-Status. */}
      <SettingsSection eyebrow="In-App-Verhalten">
        <SettingsToggleRow first
          title="Sound"
          desc="Kurzer Ton bei neuen In-App-Mitteilungen."
          on={notify.sound} onToggle={()=>tog('sound')}/>
        <SettingsToggleRow
          title="Vibration"
          desc="Haptisches Feedback (sofern vom Gerät unterstützt)."
          on={notify.vibration} onToggle={()=>tog('vibration')}/>
        <SettingsToggleRow
          title="Roter Marker im RITMO Post"
          desc="Zeige ungelesene Chats mit einem roten Punkt am Tab-Icon."
          on={notify.redDot} onToggle={()=>tog('redDot')}/>
      </SettingsSection>

    </SettingsSubLayout>
  );
}

/* ─── Sicherheit — Passwort, Sessions, Konto-Info ─────────────
   Echte Auth-Operationen via auth.* und window.supabase.auth.
   2FA ist als Roadmap-Sektion markiert: Supabase MFA-Setup
   erfordert eigenen Flow (Enrollment, QR-Render, TOTP-Verify),
   den wir in einer separaten PR liefern.
═══════════════════════════════════════════════════════════════ */
function SettingsSicherheit({onBack,onHome}){
  const[email,setEmail]=useState('');
  const[lastSignIn,setLastSignIn]=useState(null);
  const[busy,setBusy]=useState(false);
  const[flash,setFlash]=useState(null);

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        if(typeof window==='undefined'||!window.supabase) return;
        const{data}=await window.supabase.auth.getUser();
        if(cancelled) return;
        setEmail(data?.user?.email||'');
        setLastSignIn(data?.user?.last_sign_in_at||null);
      }catch{}
    })();
    return()=>{cancelled=true;};
  },[]);

  const showFlash=(kind,text,ms=4000)=>{
    setFlash({kind,text});
    setTimeout(()=>setFlash(null),ms);
  };

  // Passwort-Änderung läuft bewusst NUR über den E-Mail-Reset-Flow.
  // Das verhindert, dass jemand mit Zugriff auf eine offene Session
  // (gestohlenes Handy, vergessen abzumelden) das Passwort still
  // umschreibt und den Account übernimmt — der Mail-Link erzwingt
  // Besitz der hinterlegten Mailbox.
  const sendReset=async()=>{
    if(busy||!email) return;
    setBusy(true);
    try{
      await auth.requestPasswordReset(email);
      showFlash('ok','Reset-Link an '+email+' gesendet. Schau in dein Postfach.');
    }catch(e){
      showFlash('err',e?.message||'Reset-Link konnte nicht gesendet werden.');
    }finally{ setBusy(false); }
  };

  const signOutAll=async()=>{
    if(busy) return;
    setBusy(true);
    try{
      // scope:'global' beendet alle Sessions des Users auf allen
      // Geräten — der refresh_token wird invalidiert.
      if(window.supabase) await window.supabase.auth.signOut({scope:'global'});
      showFlash('ok','Alle Sessions beendet. Du wirst gleich abgemeldet …',2500);
      setTimeout(()=>{
        try{ if(typeof window!=='undefined') window.location.reload(); }catch{}
      },1500);
    }catch(e){
      showFlash('err',e?.message||'Sessions konnten nicht beendet werden.');
      setBusy(false);
    }
  };

  const fmtDate=(iso)=>{
    if(!iso) return '—';
    try{
      const d=new Date(iso);
      return d.toLocaleString('de-DE',{day:'2-digit',month:'2-digit',
        year:'numeric',hour:'2-digit',minute:'2-digit'});
    }catch{ return '—'; }
  };

  return(
    <SettingsSubLayout title="Sicherheit"
      desc="Passwort, aktive Sessions und Konto-Schutz."
      icon={<LockIcon size={22} color="currentColor"/>}
      onBack={onBack} onHome={onHome}>

      {flash&&<SettingsFlash kind={flash.kind} text={flash.text}/>}

      {/* Konto-Info */}
      <SettingsSection eyebrow="Konto">
        <div style={{padding:'4px 0 14px'}}>
          <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1,
            textTransform:'uppercase',marginBottom:4}}>E-Mail</div>
          <div style={{color:T.t1,fontSize:16,fontWeight:600,wordBreak:'break-all'}}>
            {email||'—'}
          </div>
          <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1,
            textTransform:'uppercase',marginTop:12,marginBottom:4}}>
            Letzter Login
          </div>
          <div style={{color:T.t2,fontSize:13,fontWeight:500,fontVariantNumeric:'tabular-nums'}}>
            {fmtDate(lastSignIn)}
          </div>
        </div>
      </SettingsSection>

      {/* Reset per E-Mail — einziger Pfad, ein Passwort zu setzen.
          Erzwingt Postfach-Besitz und schließt damit den Vector
          "offene Session → stille Passwort-Übernahme". */}
      <SettingsSection eyebrow="Reset per E-Mail">
        <div style={{padding:'4px 0 14px'}}>
          <div style={{color:T.t2,fontSize:13,lineHeight:1.6,marginBottom:12}}>
            Wir senden dir einen Link an deine E-Mail, mit dem du ein
            neues Passwort setzen kannst. So stellen wir sicher, dass
            wirklich nur du es ändern kannst.
          </div>
          <button onClick={sendReset} disabled={!email||busy}
            style={{width:'100%',padding:'14px 16px',
              background:!email||busy?T.card2:T.o,
              border:!email||busy?`1px solid ${T.border}`:'none',borderRadius:13,
              color:!email||busy?T.t3:'#000',
              fontSize:13,fontWeight:800,letterSpacing:.3,
              cursor:!email||busy?'not-allowed':'pointer',
              textAlign:'left',
              display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>Reset-Link senden</span>
            <ChevronRightIcon size={16} color={!email||busy?T.t3:'#000'}/>
          </button>
          {email&&!busy&&(
            <div style={{color:T.t3,fontSize:11,marginTop:8,lineHeight:1.5}}>
              Der Link geht an <strong style={{color:T.t2}}>{email}</strong>.
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Sessions */}
      <SettingsSection eyebrow="Sessions">
        <div style={{padding:'4px 0 14px'}}>
          <div style={{color:T.t3,fontSize:11,lineHeight:1.55,marginBottom:10}}>
            Beendet alle aktiven RITMO-Sessions auf allen Geräten. Du musst
            dich danach neu anmelden.
          </div>
          <button onClick={signOutAll} disabled={busy}
            style={{width:'100%',padding:'14px 16px',
              background:'rgba(232,69,69,0.08)',
              border:'1px solid rgba(232,69,69,0.35)',borderRadius:13,
              color:'#FF6B6B',fontSize:13,fontWeight:700,letterSpacing:.2,
              cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,textAlign:'left',
              display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>Auf allen Geräten abmelden</span>
            <ChevronRightIcon size={16} color="rgba(255,107,107,0.7)"/>
          </button>
        </div>
      </SettingsSection>

      {/* 2FA — Roadmap */}
      <SettingsSection eyebrow="Zwei-Faktor (Coming Soon)">
        <div style={{padding:'4px 0 14px'}}>
          <div style={{color:T.t2,fontSize:13,lineHeight:1.55,marginBottom:8}}>
            TOTP-basierte Zwei-Faktor-Authentifizierung (Google Authenticator,
            1Password, Authy) ist in Vorbereitung.
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,
            color:T.o,fontSize:10,fontWeight:800,letterSpacing:1.5,
            textTransform:'uppercase'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:T.o,
              display:'inline-block'}}/>
            <span>In Entwicklung</span>
          </div>
        </div>
      </SettingsSection>

    </SettingsSubLayout>
  );
}

/* ─── Konto löschen — Destructive sub-screen ────────────────────── */
function SettingsKonto({onBack,onHome,onLogout}){
  const[confirmText,setConfirmText]=useState('');
  const ready=confirmText.trim().toUpperCase()==='LÖSCHEN';
  return(
    <SettingsSubLayout title="Konto und Daten löschen"
      desc="Endgültig, ohne Wiederherstellung."
      icon={<DoorOutIcon size={22} color="currentColor"/>}
      onBack={onBack} onHome={onHome}>

      <div style={{background:'rgba(232,69,69,0.08)',border:'1px solid rgba(232,69,69,0.35)',
        borderRadius:19,padding:'20px 22px',marginBottom:14}}>
        <div style={{color:'#FF6B6B',fontSize:11,fontWeight:800,letterSpacing:2,
          textTransform:'uppercase',marginBottom:8}}>Achtung</div>
        <div style={{color:T.t1,fontSize:15,fontWeight:700,marginBottom:8,letterSpacing:-.1}}>
          Diese Aktion ist endgültig.
        </div>
        <div style={{color:T.t2,fontSize:13,lineHeight:1.6}}>
          Profil, Matches, RITMO DNA, Turnier-Historie — alles wird unwiderruflich
          gelöscht. Wir können das nicht rückgängig machen. Wenn du dir unsicher
          bist, melde dich erstmal nur ab; dein Konto bleibt erhalten.
        </div>
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
        padding:'18px 22px',marginBottom:14}}>
        <div style={{color:T.t2,fontSize:12,lineHeight:1.6,marginBottom:10}}>
          Zur Bestätigung tippe das Wort <strong style={{color:T.t1}}>LÖSCHEN</strong> in
          das Feld:
        </div>
        <input value={confirmText} onChange={e=>setConfirmText(e.target.value)}
          autoCapitalize="characters" autoCorrect="off" spellCheck={false}
          placeholder="LÖSCHEN"
          style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
            borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:700,
            letterSpacing:1,outline:'none',boxSizing:'border-box',
            fontFamily:'-apple-system,SFMono-Regular,Menlo,monospace'}}/>
        <button disabled={!ready}
          onClick={()=>{
            // Phase 1: nur Abmelden + Hinweis. Echte Konto-Löschung
            // braucht eine Server-Route (Supabase admin.deleteUser via
            // Edge Function); wird in einer separaten PR nachgereicht.
            alert('Konto-Löschung steht serverseitig noch aus. Du wirst stattdessen abgemeldet — bitte melde dich beim Team RITMO, falls die endgültige Löschung gewünscht ist.');
            if(onLogout) onLogout();
          }}
          style={{width:'100%',marginTop:12,padding:'14px 16px',
            background:ready?'#E84545':'rgba(232,69,69,0.25)',
            border:'none',borderRadius:15,
            color:ready?'#FFFFFF':'rgba(255,255,255,0.5)',
            fontSize:16,fontWeight:800,letterSpacing:.3,
            cursor:ready?'pointer':'not-allowed',
            transition:'background .15s'}}>
          Konto endgültig löschen
        </button>
      </div>

      <button onClick={onBack}
        style={{width:'100%',padding:'14px 16px',background:'transparent',
          border:`1px solid ${T.border}`,borderRadius:15,
          color:T.t2,fontSize:13,fontWeight:700,cursor:'pointer'}}>
        Doch nicht — zurück zu den Einstellungen
      </button>
    </SettingsSubLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RITMO POST — drei Sektionen (Benachrichtigungen, Chats, Events).
   Phase 1: leere Posteingänge mit Empty-States. Inhalte folgen,
   sobald Real-Time-Notifications und Chats wired sind.
═══════════════════════════════════════════════════════════════ */
/* RITMO Post — kuratierte Events (Tab "Events"). Bewusst statische,
   vom RITMO-Team kuratierte Liste (kein User-Content). Jede Karte
   verlinkt auf die offizielle Event-Seite mit Termin/Location/Tickets. */
const POST_EVENTS=[];

/* Event-Karte — ganze Karte ist ein Link auf die Event-Seite (neuer Tab).
   Bauhaus-Signaturstreifen oben, Event-Badge + Zeitraum, Titel/Untertitel. */
function PostEventCard({ev,i=0}){
  return(
    <a href={ev.url} target="_blank" rel="noopener noreferrer" data-lift
      className="fu" style={{display:'block',textDecoration:'none',color:'inherit',
        background:T.card,border:`1px solid ${T.border}`,borderRadius:21,
        overflow:'hidden',animationDelay:`${i*0.05}s`}}>
      <div style={{display:'flex',height:6}} aria-hidden="true">
        {['#FF7A1A','#FFD60A','#0A84FF','#E84545','#FFFFFF'].map((c,j)=>(
          <div key={j} style={{flex:1,background:c}}/>
        ))}
      </div>
      <div style={{padding:'15px 16px 16px'}}>
        {/* Kopf: Datum-Badge + Titelblock */}
        <div style={{display:'flex',gap:13,alignItems:'flex-start'}}>
          {ev.day&&(
            <div style={{flexShrink:0,width:50,borderRadius:15,overflow:'hidden',
              border:`1px solid ${T.o}`,textAlign:'center'}}>
              <div style={{background:T.o,color:'#000',fontSize:18,fontWeight:900,
                lineHeight:1,padding:'6px 0 5px'}}>{ev.day}</div>
              <div style={{background:T.oSoft,color:T.o,fontSize:10,fontWeight:800,
                letterSpacing:1,textTransform:'uppercase',padding:'3px 0 4px'}}>{ev.mon}</div>
            </div>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.o,fontSize:10,fontWeight:900,letterSpacing:1.4,
              textTransform:'uppercase',marginBottom:3}}>{ev.kicker||'Event'}</div>
            <div style={{color:T.t1,fontSize:18,fontWeight:900,letterSpacing:-.3,lineHeight:1.15}}>
              {ev.title}
            </div>
            {ev.subtitle&&(
              <div style={{color:T.t2,fontSize:13,fontWeight:700,marginTop:2}}>{ev.subtitle}</div>
            )}
          </div>
        </div>

        {/* Meta: Datum + Venue */}
        <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:5}}>
          {ev.when&&<div style={{color:T.t1,fontSize:12.5,fontWeight:600}}>{ev.when}</div>}
          {ev.venue&&<div style={{color:T.t3,fontSize:12,fontWeight:500}}>{ev.venue}</div>}
        </div>

        {/* Beschreibung */}
        {ev.desc&&(
          <div style={{color:T.t2,fontSize:12.5,lineHeight:1.55,marginTop:11}}>{ev.desc}</div>
        )}

        {/* Ticket-Pills */}
        {ev.tickets&&ev.tickets.length>0&&(
          <div style={{display:'flex',gap:8,marginTop:13}}>
            {ev.tickets.map(t=>(
              <div key={t.label} style={{flex:'1 1 0',minWidth:0,
                background:T.card2,border:`1px solid ${T.border}`,borderRadius:13,
                padding:'9px 11px'}}>
                <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:.6,
                  textTransform:'uppercase'}}>{t.label}</div>
                <div style={{display:'flex',alignItems:'baseline',gap:6,marginTop:2}}>
                  <span style={{color:T.t1,fontSize:15,fontWeight:900}}>{t.price}</span>
                  {t.note&&<span style={{color:T.t3,fontSize:10,fontWeight:600}}>{t.note}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,
          marginTop:14,background:T.o,color:'#000',borderRadius:13,padding:'11px 14px',
          fontSize:13,fontWeight:800,letterSpacing:.2}}>
          {ev.cta||'Zur Event-Seite'} <span style={{fontSize:16,lineHeight:1}}>→</span>
        </div>
      </div>
    </a>
  );
}

function RitmoPost({onHome,profile,onOpenChat,unread=0}){
  const[tab,setTab]=useState('notify');
  const[chats,setChats]=useState([]);
  const[chatsBusy,setChatsBusy]=useState(false);
  // Lade die Chats-Liste sobald der Chats-Tab aktiv wird. Nicht eager,
  // damit beim Tab-Wechsel die letzten Unread-Counts frisch sind.
  useEffect(()=>{
    if(tab!=='chats') return;
    let cancelled=false;
    setChatsBusy(true);
    listMyChats().then(c=>{ if(!cancelled){ setChats(c); setChatsBusy(false); } });
    return()=>{cancelled=true;};
  },[tab]);
  // Pro-Tab-Notification-Counts. Aktuell hat nur "chats" einen echten
  // Wert (vom App-Level totalUnreadCount). updates/events bleiben 0
  // bis es dort echte Events gibt.
  const notifByTab={ notify: 0, chats: unread, events: 0 };
  const tabs=[
    {id:'notify',label:'Benachrichtigungen',short:'Updates'},
    {id:'chats', label:'Chats',short:'Chats'},
    {id:'events',label:'Events',short:'Events'},
  ];
  const fmtAgo=(iso)=>{
    if(!iso) return '';
    const d=new Date(iso);
    const now=Date.now();
    const diff=Math.floor((now-d.getTime())/1000);
    if(diff<60) return 'jetzt';
    if(diff<3600) return Math.floor(diff/60)+' Min';
    if(diff<86400) return Math.floor(diff/3600)+' h';
    return d.toLocaleDateString('de-DE',{day:'2-digit',month:'short'});
  };

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',
      position:'relative',overflow:'hidden'}}>

      {/* Header */}
      <div style={{padding:'0 22px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <div style={{flexShrink:0,color:T.o,
            width:38,height:38,background:T.card2,
            border:`1px solid ${T.border}`,borderRadius:13,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <BellIcon size={22} color="currentColor"/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.5,
              textTransform:'uppercase'}}>RITMO</div>
            <div style={{color:T.t1,fontSize:24,fontWeight:800,letterSpacing:-.3,marginTop:2}}>
              Post
            </div>
          </div>
        </div>
        <div style={{color:T.t3,fontSize:13,lineHeight:1.5,marginTop:6}}>
          Updates, Chats und Events an einem Ort.
        </div>
      </div>

      {/* Tab strip — active button invertiert in der Theme-Farbe.
          Text-Farbe nutzt T.bg, damit sie immer kontrastiert: in den
          dunklen Themes (dark/padel/wimbledon/funky) wird der Text
          dunkel, in 'light' (Federleicht) wird er weiß — kein
          Black-on-Black mehr.

          Pro Tab kann ein roter Notification-Dot oben rechts gerendert
          werden (notifByTab); aktuell nur "chats" bekommt einen, wenn
          unread > 0. */}
      <div style={{display:'flex',gap:8,padding:'0 22px 16px',flexShrink:0}}>
        {tabs.map(t=>{
          const active=tab===t.id;
          const n=notifByTab[t.id]||0;
          return(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:1,padding:'10px 8px',
                background:active?T.t1:'transparent',
                color:active?T.bg:T.t2,
                border:`1px solid ${active?T.t1:T.border}`,borderRadius:13,
                fontSize:12,fontWeight:active?800:600,letterSpacing:.3,
                cursor:'pointer',transition:'all .15s',
                position:'relative'}}>
              {t.short}
              {n>0&&(
                <span aria-label={`${n} ungelesen`}
                  style={{position:'absolute',top:5,right:7,
                    minWidth:9,height:9,borderRadius:'50%',
                    background:'#E84545',border:`2px solid ${active?T.t1:T.bg}`,
                    boxShadow:'0 0 0 2px rgba(232,69,69,.30)'}}/>
              )}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div style={{flex:1,padding:'0 22px 120px',overflowY:'auto',
        WebkitOverflowScrolling:'touch'}}>

        {tab==='notify'&&(
          <RitmoPostEmpty
            icon={<BellIcon size={28} color="currentColor"/>}
            title="Noch keine Benachrichtigungen"
            desc="Match-Reminder, Turnier-Alerts und Updates landen hier, sobald sie für dich relevant sind."/>
        )}

        {tab==='chats'&&(
          chatsBusy?(
            <div style={{color:T.t3,fontSize:13,padding:'24px 0',textAlign:'center'}}>Lädt …</div>
          ):chats.length===0?(
            <RitmoPostEmpty
              icon={<BellIcon size={28} color="currentColor"/>}
              title="Noch keine Chats"
              desc="Sobald du einem Club beitrittst, erscheint sein Chat hier."/>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {chats.map((c,i)=>(
                <button key={c.club.id} onClick={()=>onOpenChat&&onOpenChat(c.club.id)}
                  className="fu" style={{
                    background:T.card,border:`1px solid ${c.unread>0?T.o:T.border}`,borderRadius:19,
                    padding:'14px 16px',display:'flex',alignItems:'center',gap:12,
                    cursor:'pointer',color:T.t1,textAlign:'left',
                    animationDelay:`${i*0.03}s`}}>
                  {/* Mini-Cover */}
                  {(()=>{const safe=safeImageSrc(c.club.cover);return safe?(
                    <img src={safe} alt={c.club.name}
                      style={{width:42,height:42,borderRadius:13,objectFit:'cover',
                        flexShrink:0,border:`1px solid ${T.border}`}}/>
                  ):(
                    <div style={{flexShrink:0,width:42,height:42,borderRadius:13,
                      background:T.card2,border:`1px solid ${T.border}`,color:T.o,
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <TrophyIcon size={20}/>
                    </div>
                  );})()}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                      <div style={{color:T.t1,fontSize:16,fontWeight:c.unread>0?800:700,
                        letterSpacing:-.1,
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',flex:1}}>
                        {c.club.name}
                      </div>
                      {c.lastMessage&&(
                        <div style={{color:T.t3,fontSize:10,fontWeight:600,flexShrink:0}}>
                          {fmtAgo(c.lastMessage.created_at)}
                        </div>
                      )}
                    </div>
                    <div style={{color:T.t2,fontSize:12,marginTop:2,
                      whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                      fontWeight:c.unread>0?600:400}}>
                      {c.lastMessage?.body||'Noch keine Nachrichten.'}
                    </div>
                  </div>
                  {c.unread>0&&(
                    <div style={{flexShrink:0,minWidth:22,height:22,borderRadius:13,
                      background:T.o,color:'#000',fontSize:11,fontWeight:900,
                      padding:'0 7px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {c.unread>99?'99+':c.unread}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )
        )}

        {tab==='events'&&(
          POST_EVENTS.length===0?(
            <RitmoPostEmpty
              icon={<TrophyIcon size={28}/>}
              title="Noch keine Events"
              desc="RITMO Turniere, Open Days und Meetups in deiner Nähe — sobald die ersten Daten verfügbar sind."/>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {POST_EVENTS.map((ev,i)=>(<PostEventCard key={ev.id} ev={ev} i={i}/>))}
            </div>
          )
        )}
      </div>

      {/* Floating Home-FAB → zurück (links-unten) */}
      <button onClick={onHome} aria-label="Zurück zu Home"
        style={{position:'absolute',left:22,bottom:'calc(env(safe-area-inset-bottom,0px) + 28px)',
          width:54,height:54,borderRadius:'50%',
          background:T.card,border:`1px solid ${T.border}`,
          color:T.t1,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 8px 24px rgba(0,0,0,.45)',zIndex:5}}>
        <HomeIcon size={22}/>
      </button>
    </div>
  );
}

function RitmoPostEmpty({icon,title,desc,cta}){
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
      padding:'40px 28px',textAlign:'center',color:T.t2}}>
      <div style={{display:'flex',justifyContent:'center',marginBottom:14,color:T.o}}>
        {icon}
      </div>
      <div style={{color:T.t1,fontSize:16,fontWeight:800,letterSpacing:-.1,marginBottom:8}}>
        {title}
      </div>
      <div style={{color:T.t3,fontSize:13,lineHeight:1.6,maxWidth:'34ch',margin:'0 auto'}}>
        {desc}
      </div>
      {cta&&(
        <button onClick={cta.onClick}
          style={{marginTop:18,padding:'10px 18px',background:T.oSoft,
            border:`1px solid ${T.o}`,borderRadius:13,
            color:T.o,fontSize:12,fontWeight:800,letterSpacing:.3,cursor:'pointer'}}>
          {cta.label}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SOCIAL LAYER — Phase 1 Screens

   PublicProfile, PlayerSearch, Clubs, ClubDetail, Bookings,
   BookingDetail, BookingCreate, Invites.

   Alle screens nutzen das gleiche SocialHeader-Layout (RITMO Eyebrow,
   großer Titel, optionale Beschreibung) und einen floating Home-FAB
   unten-links. Datenzugriffe gehen über die social-helpers in db.js.

   Animationen: .fi/.fu CSS-Klassen (siehe theme.js) liefern die
   stagger-fade-ins; einzelne Listen-Items bekommen animationDelay
   über inline style.
═══════════════════════════════════════════════════════════════ */

/* ── Helper: Spieler-Listen-Item (Avatar + Name + Level + Style-Tag) */
function PlayerListItem({profile,onClick,trailing}){
  const data=profile?.data||{};
  const name=profile?.display_name||data.name||'Spieler';
  const lvl=data.playtomicLevel??data.estimatedLevel;
  const styleType=data.styleType;
  const style=styleType?PADEL_STYLES[styleType]:null;
  return(
    <button onClick={onClick}
      style={{width:'100%',background:T.card,border:`1px solid ${T.border}`,borderRadius:15,
        padding:'14px 16px',display:'flex',alignItems:'center',gap:12,
        color:T.t1,textAlign:'left',cursor:'pointer',transition:'background .15s'}}
      onPointerDown={e=>e.currentTarget.style.background=T.card2}
      onPointerUp={e=>e.currentTarget.style.background=T.card}
      onPointerLeave={e=>e.currentTarget.style.background=T.card}>
      <ProfileAvatar name={name} avatar={data.avatar} size={42}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:T.t1,fontSize:16,fontWeight:700,letterSpacing:-.1,
          whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3,flexWrap:'wrap'}}>
          {lvl!=null&&(
            <span style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:.3}}>
              Lv {lvl.toFixed(2)}
            </span>
          )}
          {style&&(
            <span style={{padding:'1px 6px',background:`${style.accent}22`,
              border:`1px solid ${style.accent}`,borderRadius:5,
              color:style.accent,fontSize:9,fontWeight:800,letterSpacing:.4,
              textTransform:'uppercase'}}>
              {style.name}
            </span>
          )}
        </div>
      </div>
      {trailing}
    </button>
  );
}

/* ── Generischer Screen-Wrapper (Header + Home-FAB)
   Optional onBack rendert eine kleine Zurück-Pille oben links — etwa
   um vom PublicProfile zurück zur Player-Suche zu kommen. Home-FAB
   bleibt erhalten, damit ein User immer auch direkt nach Hause kann. */
function SocialScreen({eyebrow,title,desc,icon,onHome,onBack,backLabel='Zurück',children}){
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',
      position:'relative',overflow:'hidden'}}>
      <div className="fi" style={{padding:'0 22px 14px'}}>
        {onBack&&(
          <button onClick={onBack}
            style={{display:'inline-flex',alignItems:'center',gap:6,
              background:'transparent',border:`1px solid ${T.border}`,
              borderRadius:999,padding:'5px 12px 5px 8px',color:T.t2,
              fontSize:12,fontWeight:700,letterSpacing:.3,cursor:'pointer',
              marginBottom:12,maxWidth:'fit-content'}}>
            <span style={{transform:'rotate(180deg)',display:'inline-flex'}}>
              <ChevronRightIcon size={14} color="currentColor"/>
            </span>
            {backLabel}
          </button>
        )}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          {icon&&(
            <div style={{flexShrink:0,color:T.o,
              width:36,height:36,background:T.card2,
              border:`1px solid ${T.border}`,borderRadius:13,
              display:'flex',alignItems:'center',justifyContent:'center'}}>{icon}</div>
          )}
          <div style={{flex:1,minWidth:0}}>
            {eyebrow&&(
              <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.5,
                textTransform:'uppercase'}}>{eyebrow}</div>
            )}
            <div style={{color:T.t1,fontSize:24,fontWeight:800,letterSpacing:-.3,marginTop:2}}>
              {title}
            </div>
          </div>
        </div>
        {desc&&<div style={{color:T.t3,fontSize:13,lineHeight:1.5,marginTop:6}}>{desc}</div>}
      </div>
      <div style={{flex:1,padding:'0 22px 140px',overflowY:'auto',
        WebkitOverflowScrolling:'touch'}}>{children}</div>
      <button onClick={onHome} aria-label="Zurück zur Startseite"
        style={{position:'absolute',left:22,bottom:'calc(env(safe-area-inset-bottom,0px) + 28px)',
          width:54,height:54,borderRadius:'50%',
          background:T.card,border:`1px solid ${T.border}`,
          color:T.t1,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 8px 24px rgba(0,0,0,.45)',zIndex:5}}>
        <HomeIcon size={22}/>
      </button>
    </div>
  );
}

/* ═══ PlayerSearch — Suche nach öffentlichen Profilen ═══ */
function PlayerSearch({onHome,onOpenPlayer}){
  const[q,setQ]=useState('');
  const[results,setResults]=useState([]);
  const[busy,setBusy]=useState(false);
  // Debounced Search — 250 ms nach letztem Tastendruck
  useEffect(()=>{
    const tq=q.trim();
    if(!tq){setResults([]);return;}
    const t=setTimeout(async()=>{
      setBusy(true);
      try{ setResults(await searchPlayers(tq,{limit:30})); }
      finally{ setBusy(false); }
    },250);
    return()=>clearTimeout(t);
  },[q]);
  return(
    <SocialScreen eyebrow="Community" title="Spieler suchen"
      desc="Find Mitspieler — nach Name."
      icon={<SearchIcon size={22}/>} onHome={onHome}>
      <div className="fu" style={{marginBottom:14,position:'relative'}}>
        <input value={q} onChange={e=>setQ(e.target.value)}
          autoCapitalize="off" autoCorrect="off" spellCheck={false}
          enterKeyHint="search" placeholder="Name eingeben …"
          style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
            borderRadius:15,padding:'14px 46px 14px 16px',color:T.t1,fontSize:16,fontWeight:500,
            outline:'none',boxSizing:'border-box'}}/>
        {q!==''&&(
          <button onClick={()=>setQ('')} aria-label="Suche löschen"
            style={{position:'absolute',right:9,top:'calc(50% - 14px)',width:28,height:28,
              borderRadius:'50%',background:T.card,border:`1px solid ${T.border}`,
              color:T.t3,fontSize:15,fontWeight:700,cursor:'pointer',lineHeight:1,
              display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        )}
      </div>
      {q.trim()===''?(
        <RitmoPostEmpty icon={<SearchIcon size={28}/>}
          title="Tipp einen Namen"
          desc="Mindestens ein Buchstabe — du siehst sofort, wer öffentlich verfügbar ist."/>
      ):busy?(
        <div style={{color:T.t3,fontSize:13,padding:'24px 0',textAlign:'center'}}>Suche …</div>
      ):results.length===0?(
        <RitmoPostEmpty icon={<PersonGlyph size={28}/>}
          title="Niemand gefunden"
          desc="Kein öffentliches Profil entspricht der Suche."/>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {results.map((p,i)=>(
            <div key={p.user_id} className="fu" style={{animationDelay:`${i*0.03}s`}}>
              <PlayerListItem profile={p}
                onClick={()=>onOpenPlayer(p.user_id)}
                trailing={<ChevronRightIcon size={16} color={T.t3}/>}/>
            </div>
          ))}
        </div>
      )}
    </SocialScreen>
  );
}

/* ═══ PublicProfile — Profil eines anderen Spielers ═══ */
function PublicProfile({userId,currentUid,onHome,onBack,backLabel}){
  const[prof,setProf]=useState(null);
  const[counts,setCounts]=useState({followers:0,following:0});
  const[following,setFollowing]=useState(false);
  const[busy,setBusy]=useState(false);
  const isSelf=userId===currentUid;

  const refresh=useCallback(async()=>{
    const [p,c,f]=await Promise.all([
      fetchPublicProfile(userId),
      followCounts(userId),
      isSelf?false:isFollowing(userId),
    ]);
    setProf(p); setCounts(c); setFollowing(f);
  },[userId,isSelf]);

  useEffect(()=>{ refresh(); },[refresh]);

  const toggle=async()=>{
    if(busy||isSelf) return;
    setBusy(true);
    try{
      const ok=await (following?unfollowUser(userId):followUser(userId));
      if(ok){
        setFollowing(!following);
        setCounts(c=>({...c,followers:Math.max(0,c.followers+(following?-1:1))}));
      }
    }finally{ setBusy(false); }
  };

  const data=prof?.data||{};
  const name=prof?.display_name||data.nickname||data.name||'Spieler';
  const bio=(data.bio||'').trim();
  const lvl=data.playtomicLevel??data.estimatedLevel;
  const styleType=data.styleType;
  const style=styleType?PADEL_STYLES[styleType]:null;
  // Sichtbarkeit: öffentliche Profile zeigen alles inkl. Statistik;
  // private nur Spielstil (DNA) + Bio.
  const isPriv=prof?(data.private===true||prof.is_public===false):false;
  const pMatches=parseInt(data.matchesPlayed||'0',10)||0;
  const pWins=parseInt(data.winsCount||'0',10)||0;
  const pLosses=Math.max(0,pMatches-pWins);
  const pWinRate=pMatches>0?Math.round(pWins/pMatches*100):0;

  return(
    <SocialScreen eyebrow="Profil" title={name}
      icon={<PersonGlyph size={22}/>} onHome={onHome}
      onBack={onBack} backLabel={backLabel||'Zurück'}>
      {!prof?(
        <RitmoPostEmpty icon={<EyeIcon size={28}/>}
          title="Profil nicht verfügbar"
          desc="Dieses Profil ist entweder privat oder existiert nicht."
          cta={{label:'Zurück',onClick:onBack}}/>
      ):(
        <Fragment>
          {/* Hero */}
          <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
            borderRadius:21,padding:'24px 22px',marginBottom:12,
            display:'flex',alignItems:'center',gap:16}}>
            <ProfileAvatar name={name} avatar={data.avatar} size={72}/>
            <div style={{flex:1,minWidth:0}}>
              {!isPriv&&lvl!=null&&(
                <Fragment>
                  <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
                    textTransform:'uppercase',marginBottom:2}}>
                    {data.playtomicLevel!=null?'Playtomic Level':'RITMO Level'}
                  </div>
                  <div style={{color:T.o,fontSize:34,fontWeight:900,letterSpacing:-.6,lineHeight:1}}>
                    {lvl.toFixed(2)}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                    <span style={{color:T.o,fontSize:12,fontWeight:700}}>{getLevelLabel(lvl)}</span>
                    <span style={{padding:'1px 6px',background:getLevelColor(lvl),color:'#fff',
                      borderRadius:4,fontSize:9,fontWeight:900,letterSpacing:.5}}>
                      {getLevelTier(lvl)}
                    </span>
                  </div>
                </Fragment>
              )}
              {isPriv&&(
                <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:.3,
                  display:'inline-flex',alignItems:'center',gap:6}}>
                  <LockIcon size={13}/> Privates Profil
                </div>
              )}
              {style&&(
                <div style={{marginTop:8}}>
                  <span style={{padding:'3px 8px',background:`${style.accent}22`,
                    border:`1px solid ${style.accent}`,borderRadius:6,
                    color:style.accent,fontSize:10,fontWeight:800,letterSpacing:.3,
                    textTransform:'uppercase'}}>
                    {style.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bio — Spruch des Spielers (read-only) */}
          {bio&&(
            <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
              borderRadius:15,padding:'14px 16px',marginBottom:12,animationDelay:'.03s'}}>
              <div style={{color:T.t2,fontSize:16,fontStyle:'italic',lineHeight:1.55,
                fontWeight:500}}>„{bio}"</div>
            </div>
          )}

          {/* Follower / Following — nur öffentlich */}
          {!isPriv&&(
          <div className="fu" style={{display:'flex',gap:10,marginBottom:12,animationDelay:'.04s'}}>
            <div style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:15,
              padding:'14px 12px',textAlign:'center'}}>
              <div style={{color:T.t1,fontSize:22,fontWeight:900,letterSpacing:-.3}}>{counts.followers}</div>
              <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
                textTransform:'uppercase',marginTop:2}}>Follower</div>
            </div>
            <div style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:15,
              padding:'14px 12px',textAlign:'center'}}>
              <div style={{color:T.t1,fontSize:22,fontWeight:900,letterSpacing:-.3}}>{counts.following}</div>
              <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
                textTransform:'uppercase',marginTop:2}}>Folgt</div>
            </div>
          </div>
          )}

          {/* Follow button */}
          {!isSelf&&(
            <button onClick={toggle} disabled={busy} className="fu"
              style={{width:'100%',marginBottom:12,padding:'14px 16px',
                background:following?T.card:T.o,
                border:following?`1px solid ${T.border}`:'none',borderRadius:15,
                color:following?T.t1:'#000',fontSize:16,fontWeight:800,letterSpacing:.3,
                cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,
                animationDelay:'.08s'}}>
              {following?'Du folgst':'Folgen'}
            </button>
          )}

          {/* Statistik — nur bei öffentlichem Profil (komplettes Profil). */}
          {!isPriv&&(
            <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
              borderRadius:15,padding:'16px 16px 14px',marginBottom:12,animationDelay:'.1s'}}>
              <div style={{color:T.o,fontSize:10,fontWeight:800,letterSpacing:1.8,
                textTransform:'uppercase',marginBottom:12}}>Statistik</div>
              <div style={{display:'flex',alignItems:'stretch'}}>
                {[
                  {l:'Matches',v:`${pMatches}`},
                  {l:'Siege',v:`${pWins}`},
                  {l:'Niederl.',v:`${pLosses}`},
                  {l:'Win-Rate',v:`${pWinRate}%`,o:true},
                ].map((s,i)=>(
                  <div key={s.l} style={{flex:1,minWidth:0,textAlign:'center',
                    borderRight:i<3?`1px solid ${T.sep}`:'none'}}>
                    <div style={{color:T.t3,fontSize:9,fontWeight:700,letterSpacing:1,
                      textTransform:'uppercase'}}>{s.l}</div>
                    <div style={{color:s.o?T.o:T.t1,fontSize:22,fontWeight:900,
                      letterSpacing:-.5,marginTop:7}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RITMO DNA Card (wenn vorhanden) */}
          {style&&(
            <div className="fu" style={{
              background:'linear-gradient(135deg,#1A1A1A 0%,#000 100%)',
              border:`1px solid ${style.accent}40`,borderRadius:21,
              padding:'18px 20px',animationDelay:'.12s'}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:48,height:48,borderRadius:'50%',flexShrink:0,
                  background:`${style.accent}22`,
                  border:`1.5px solid ${style.accent}`,
                  display:'flex',alignItems:'center',justifyContent:'center',color:style.accent}}>
                  <DNAIcon size={26} color="currentColor"/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:'#fff',fontSize:16,fontWeight:900,letterSpacing:-.3}}>
                    RITMO <span style={{color:style.accent}}>DNA</span>
                  </div>
                  <div style={{color:'rgba(255,255,255,0.55)',fontSize:11,marginTop:3}}>
                    {style.subtitle} · {style.tagline}
                  </div>
                </div>
              </div>
              <div style={{color:'rgba(255,255,255,0.75)',fontSize:12,lineHeight:1.6,marginTop:14}}>
                {style.desc}
              </div>
            </div>
          )}
        </Fragment>
      )}
    </SocialScreen>
  );
}

/* ═══ Clubs — List + Create entry ═══ */
function Clubs({onHome,onOpenClub,onCreateClub}){
  const[q,setQ]=useState('');
  const[clubs,setClubs]=useState([]);
  const[busy,setBusy]=useState(false);
  // Hat der User schon einen Club? Dann darf er keinen weiteren anlegen.
  const[ownedId,setOwnedId]=useState(null);
  useEffect(()=>{
    let cancelled=false;
    myOwnedClubId().then(id=>{ if(!cancelled) setOwnedId(id); });
    return()=>{cancelled=true;};
  },[]);
  const load=useCallback(async()=>{
    setBusy(true);
    try{ setClubs(await listClubs({query:q,limit:50})); }
    finally{ setBusy(false); }
  },[q]);
  useEffect(()=>{
    const t=setTimeout(load,200);
    return()=>clearTimeout(t);
  },[load]);

  return(
    <SocialScreen eyebrow="Community" title="Clubs"
      desc={ownedId?'Du bist Inhaber:in eines Clubs.':'Find oder gründe deinen Club.'}
      icon={<CoffeeCupIcon size={22}/>} onHome={onHome}>
      <div className="fu" style={{display:'flex',gap:8,marginBottom:14}}>
        <div style={{flex:1,position:'relative',minWidth:0}}>
          <input value={q} onChange={e=>setQ(e.target.value)}
            enterKeyHint="search" placeholder="Name oder Stadt …"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:13,padding:'14px 42px 14px 16px',color:T.t1,fontSize:16,fontWeight:500,
              outline:'none',boxSizing:'border-box'}}/>
          {q!==''&&(
            <button onClick={()=>setQ('')} aria-label="Suche löschen"
              style={{position:'absolute',right:8,top:'calc(50% - 13px)',width:26,height:26,
                borderRadius:'50%',background:T.card,border:`1px solid ${T.border}`,
                color:T.t3,fontSize:14,fontWeight:700,cursor:'pointer',lineHeight:1,
                display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
          )}
        </div>
        <button onClick={onCreateClub} disabled={!!ownedId}
          title={ownedId?'Du hast bereits einen Club.':'Neuen Club gründen'}
          style={{padding:'14px 16px',
            background:ownedId?T.card2:T.o,
            border:ownedId?`1px solid ${T.border}`:'none',borderRadius:13,
            color:ownedId?T.t3:'#000',fontSize:13,fontWeight:800,letterSpacing:.3,
            cursor:ownedId?'not-allowed':'pointer',flexShrink:0,
            opacity:ownedId?.55:1}}>
          + Neu
        </button>
      </div>

      {/* Mein Club als gepinnte Karte ganz oben */}
      {ownedId&&clubs.some(c=>c.id===ownedId)&&(()=>{
        const mine=clubs.find(c=>c.id===ownedId);
        return(
          <div className="fu" style={{marginBottom:14,animationDelay:'.02s'}}>
            <div style={{color:T.o,fontSize:10,fontWeight:800,letterSpacing:2,
              textTransform:'uppercase',marginBottom:6,marginLeft:4}}>Dein Club</div>
            <button onClick={()=>onOpenClub(mine.id)}
              style={{width:'100%',background:T.card,
                border:`1px solid ${T.o}`,borderRadius:15,
                padding:'14px 16px',display:'flex',alignItems:'center',gap:12,
                color:T.t1,textAlign:'left',cursor:'pointer'}}>
              {(()=>{const safe=safeImageSrc(mine.cover);return safe?(
                <img src={safe} alt={mine.name}
                  style={{width:40,height:40,borderRadius:13,objectFit:'cover',
                    flexShrink:0,border:`1px solid ${T.border}`}}/>
              ):(
                <div style={{flexShrink:0,width:40,height:40,borderRadius:13,
                  background:T.card2,border:`1px solid ${T.border}`,color:T.o,
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <TrophyIcon size={20}/>
                </div>
              );})()}
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:T.t1,fontSize:16,fontWeight:700,letterSpacing:-.1}}>{mine.name}</div>
                {mine.city&&<div style={{color:T.t3,fontSize:11,marginTop:2}}>{mine.city}</div>}
              </div>
              <span style={{padding:'2px 8px',background:T.oSoft,color:T.o,borderRadius:5,
                fontSize:9,fontWeight:800,letterSpacing:.8,textTransform:'uppercase'}}>
                Inhaber
              </span>
            </button>
          </div>
        );
      })()}

      {busy?(
        <div style={{color:T.t3,fontSize:13,padding:'24px 0',textAlign:'center'}}>Lädt …</div>
      ):clubs.length===0?(
        <RitmoPostEmpty icon={<TrophyIcon size={28}/>}
          title="Noch keine Clubs"
          desc={ownedId?'Andere Clubs werden hier aufgelistet.':'Sei der/die Erste und gründe einen Club.'}
          cta={ownedId?null:{label:'Club gründen',onClick:onCreateClub}}/>
      ):(
        (()=>{
          // Eigenen Club aus der Haupt-Liste rausfiltern — er wird oben
          // als gepinnte "Dein Club"-Karte separat gerendert.
          const rest=clubs.filter(c=>c.id!==ownedId);
          if(rest.length===0) return(
            <div style={{color:T.t3,fontSize:13,padding:'18px 0',textAlign:'center'}}>
              Keine weiteren Clubs gefunden.
            </div>
          );
          return(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {ownedId&&(
                <div style={{color:T.t3,fontSize:10,fontWeight:800,letterSpacing:2,
                  textTransform:'uppercase',marginLeft:4,marginBottom:0}}>Andere Clubs</div>
              )}
              {rest.map((c,i)=>(
                <button key={c.id} onClick={()=>onOpenClub(c.id)} className="fu"
                  style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:15,
                    padding:'14px 16px',display:'flex',alignItems:'center',gap:12,
                    color:T.t1,textAlign:'left',cursor:'pointer',animationDelay:`${i*0.03}s`}}>
                  {(()=>{const safe=safeImageSrc(c.cover);return safe?(
                    <img src={safe} alt={c.name}
                      style={{width:40,height:40,borderRadius:13,objectFit:'cover',
                        flexShrink:0,border:`1px solid ${T.border}`}}/>
                  ):(
                    <div style={{flexShrink:0,width:40,height:40,borderRadius:13,
                      background:T.card2,border:`1px solid ${T.border}`,color:T.o,
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <TrophyIcon size={20}/>
                    </div>
                  );})()}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:T.t1,fontSize:16,fontWeight:700,letterSpacing:-.1}}>{c.name}</div>
                    {c.city&&<div style={{color:T.t3,fontSize:11,marginTop:2}}>{c.city}</div>}
                  </div>
                  <ChevronRightIcon size={16} color={T.t3}/>
                </button>
              ))}
            </div>
          );
        })()
      )}
    </SocialScreen>
  );
}

/* ═══ ClubCreate — Formular ═══ */
function ClubCreate({onHome,onDone,onCancel,initial}){
  // Doppel-funktion: ohne `initial` ist es Anlage, mit `initial` wird
  // dieselbe Maske als Edit-Formular vom Owner benutzt.
  const editMode=!!initial;
  const[name,setName]=useState(initial?.name||'');
  const[city,setCity]=useState(initial?.city||'');
  const[desc,setDesc]=useState(initial?.description||'');
  const[cover,setCover]=useState(initial?.cover||null);
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState('');
  const coverInput=useRef(null);
  const pickCover=async(e)=>{
    const f=e.target.files?.[0];
    e.target.value='';
    if(!f) return;
    try{
      // Re-encoded JPEG ≤ 1200 px Kante hält die Cover unter ~200 KB
      const url=await readImageAsDataUrl(f);
      const resized=await resizeImage(url,1200);
      setCover(resized);
    }catch(err){ console.warn('[club cover]',err); }
  };
  const save=async()=>{
    setErr(''); setBusy(true);
    try{
      if(editMode){
        const c=await updateClub(initial.id,{name,city,description:desc,cover});
        onDone(c);
      } else {
        // Cover wird direkt mit createClub atomar gespeichert — kein
        // separater updateClub-Call mehr, der bei Fehler den Cover
        // verschluckt hätte.
        const c=await createClub({name,city,description:desc,cover});
        onDone(c);
      }
    }catch(e){ setErr(e.message||'Fehler.'); }
    finally{ setBusy(false); }
  };
  return(
    <SocialScreen eyebrow="Clubs" title={editMode?'Club bearbeiten':'Neuer Club'}
      desc={editMode?'Aktualisiere Cover, Name oder Beschreibung.':'Leg den Namen fest — der Rest folgt.'}
      icon={<TrophyIcon size={22}/>} onHome={onHome}
      onBack={onCancel} backLabel={editMode?'Club':'Clubs'}>
      <div className="fu" style={{display:'flex',flexDirection:'column',gap:12}}>

        {/* Cover-Upload */}
        <div>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Cover</div>
          <button onClick={()=>coverInput.current?.click()}
            style={{width:'100%',position:'relative',aspectRatio:'16/9',
              background:T.card2,border:`1px dashed ${T.border}`,borderRadius:15,
              overflow:'hidden',cursor:'pointer',color:T.t2,padding:0}}>
            {(()=>{const safe=safeImageSrc(cover);return safe?(
              <img src={safe} alt="Cover"
                style={{position:'absolute',inset:0,width:'100%',height:'100%',
                  objectFit:'cover',display:'block'}}/>
            ):(
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
                alignItems:'center',justifyContent:'center',gap:6,color:T.t3}}>
                <TrophyIcon size={28}/>
                <div style={{fontSize:12,fontWeight:600,letterSpacing:.3}}>Cover-Bild wählen</div>
              </div>
            );})()}
            {cover&&(
              <div style={{position:'absolute',right:10,top:10,
                padding:'4px 10px',background:'rgba(0,0,0,.55)',color:'#fff',
                fontSize:10,fontWeight:800,letterSpacing:1,borderRadius:6,
                textTransform:'uppercase'}}>Ändern</div>
            )}
          </button>
          <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp"
            onChange={pickCover} style={{display:'none'}}/>
        </div>

        <div>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Name *</div>
          <input value={name} onChange={e=>setName(e.target.value)}
            placeholder="z.B. Padelhaus München"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:600,
              outline:'none',boxSizing:'border-box'}}/>
        </div>
        <div>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Stadt</div>
          <input value={city} onChange={e=>setCity(e.target.value)}
            placeholder="z.B. München"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:600,
              outline:'none',boxSizing:'border-box'}}/>
        </div>
        <div>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Beschreibung</div>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4}
            placeholder="Was zeichnet euch aus? Wann trefft ihr euch? Welche Levels seid ihr?"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:13,padding:'14px 16px',color:T.t1,fontSize:16,fontWeight:500,
              outline:'none',boxSizing:'border-box',resize:'vertical',lineHeight:1.55}}/>
        </div>
        {err&&(
          <div style={{background:'rgba(232,69,69,.12)',border:'1px solid rgba(232,69,69,.4)',
            borderRadius:8,padding:'9px 12px',color:'#FF6B6B',fontSize:12,fontWeight:600}}>
            {err}
          </div>
        )}
        <button onClick={save} disabled={busy||!name.trim()}
          style={{padding:'14px 16px',background:T.o,border:'none',borderRadius:15,
            color:'#000',fontSize:16,fontWeight:800,letterSpacing:.3,
            cursor:(busy||!name.trim())?'not-allowed':'pointer',
            opacity:(busy||!name.trim())?.55:1,marginTop:6}}>
          {busy?'…':editMode?'Änderungen speichern':'Club gründen'}
        </button>
        <button onClick={onCancel}
          style={{padding:'12px 16px',background:'transparent',border:`1px solid ${T.border}`,
            borderRadius:15,color:T.t2,fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Abbrechen
        </button>
      </div>
    </SocialScreen>
  );
}

/* ═══ ClubDetail ═══ */
function ClubDetail({clubId,currentUid,onHome,onBack,onOpenPlayer,onOpenChat,onEdit}){
  const[club,setClub]=useState(null);
  const[members,setMembers]=useState([]);
  const[memberCount,setMemberCount]=useState(0);
  const[joined,setJoined]=useState(false);
  const[busy,setBusy]=useState(false);

  const refresh=useCallback(async()=>{
    // Vier parallele Reads. memberCount nutzt eine eigene head:true-Query
    // damit auch nicht-Mitglieder die Größe sehen können, falls RLS später
    // strenger wird.
    const [c,m,n,j]=await Promise.all([
      fetchClub(clubId),
      clubMembers(clubId,{limit:50}),
      clubMemberCount(clubId),
      isClubMember(clubId),
    ]);
    setClub(c); setMembers(m); setMemberCount(n); setJoined(j);
  },[clubId]);
  useEffect(()=>{ refresh(); },[refresh]);

  const toggle=async()=>{
    if(busy) return;
    setBusy(true);
    try{
      const ok=await (joined?leaveClub(clubId):joinClub(clubId));
      if(ok) await refresh();
    }finally{ setBusy(false); }
  };

  const isOwner=club?.owner_id===currentUid;
  const cover=club?.cover;

  return(
    <SocialScreen eyebrow="Club" title={club?.name||'Lädt …'}
      desc={club?.city||''}
      icon={<TrophyIcon size={22}/>} onHome={onHome}
      onBack={onBack} backLabel="Clubs">
      {!club?null:(
        <Fragment>
          {/* Hero-Image (Cover) — mit Bauhaus-Fallback wenn null */}
          <div className="fu" style={{position:'relative',width:'100%',aspectRatio:'16/9',
            borderRadius:19,overflow:'hidden',marginBottom:12,
            background:T.card2,border:`1px solid ${T.border}`}}>
            {(()=>{const safe=safeImageSrc(cover);return safe?(
              <img src={safe} alt={club.name}
                style={{position:'absolute',inset:0,width:'100%',height:'100%',
                  objectFit:'cover',display:'block'}}/>
            ):(
              /* Bauhaus-Komposition als Default-Cover */
              <svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice"
                style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
                <rect width="400" height="225" fill="#0A0A0A"/>
                <circle cx="90" cy="80" r="60" fill="#FFD60A"/>
                <rect x="170" y="40" width="100" height="100" fill="#0A84FF"/>
                <polygon points="60,180 260,180 160,80" fill="#E84545" opacity=".85"/>
                <rect x="20" y="195" width="360" height="6" fill="#FF7A1A"/>
              </svg>
            );})()}
            {/* Untere Verdunkelung für Lesbarkeit des Titel-Overlays */}
            <div style={{position:'absolute',left:0,right:0,bottom:0,height:'55%',
              background:'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.72) 100%)',
              pointerEvents:'none'}}/>
            {/* Titel + Stadt im Hero — über dem Cover */}
            <div style={{position:'absolute',left:16,right:16,bottom:14,
              color:'#FFFFFF'}}>
              <div style={{fontSize:24,fontWeight:900,letterSpacing:-.3,
                textShadow:'0 2px 8px rgba(0,0,0,.6)'}}>{club.name}</div>
              {club.city&&(
                <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,opacity:.85,marginTop:2,
                  textShadow:'0 1px 4px rgba(0,0,0,.6)'}}>{club.city}</div>
              )}
            </div>
          </div>

          {/* Description-Card (Hero-Text) — falls vorhanden */}
          {club.description&&(
            <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
              borderRadius:19,padding:'16px 18px',marginBottom:12,
              color:T.t2,fontSize:16,lineHeight:1.6,animationDelay:'.03s',whiteSpace:'pre-wrap'}}>
              {club.description}
            </div>
          )}

          {/* Member-Count + Chat-Button als Status-Tiles */}
          <div className="fu" style={{display:'flex',gap:10,marginBottom:12,animationDelay:'.05s'}}>
            <div style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:15,
              padding:'14px 16px',textAlign:'center'}}>
              <div style={{color:T.t1,fontSize:20,fontWeight:900,letterSpacing:-.3}}>{memberCount}</div>
              <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
                textTransform:'uppercase',marginTop:2}}>Mitglieder</div>
            </div>
            {joined&&(
              <button onClick={()=>onOpenChat&&onOpenChat(clubId)}
                style={{flex:1,background:T.oSoft,border:`1px solid ${T.o}`,borderRadius:15,
                  padding:'14px 16px',textAlign:'center',cursor:'pointer',color:T.o}}>
                <BellIcon size={20} color="currentColor"/>
                <div style={{color:T.o,fontSize:10,fontWeight:800,letterSpacing:1.3,
                  textTransform:'uppercase',marginTop:4}}>Chat öffnen</div>
              </button>
            )}
          </div>

          {!isOwner&&(
            <button onClick={toggle} disabled={busy} className="fu"
              style={{width:'100%',marginBottom:14,padding:'14px 16px',
                background:joined?T.card:T.o,
                border:joined?`1px solid ${T.border}`:'none',borderRadius:15,
                color:joined?T.t1:'#000',fontSize:16,fontWeight:800,letterSpacing:.3,
                cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,
                animationDelay:'.07s'}}>
              {joined?'Mitglied · Austreten':'Club beitreten'}
            </button>
          )}
          {isOwner&&(
            <div className="fu" style={{display:'flex',gap:10,marginBottom:14,
              animationDelay:'.07s'}}>
              <div style={{flex:1,padding:'10px 14px',
                background:T.oSoft,border:`1px solid ${T.o}`,borderRadius:13,
                color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.5,
                textTransform:'uppercase',textAlign:'center'}}>
                Du bist Inhaber:in
              </div>
              {onEdit&&(
                <button onClick={()=>onEdit(club)}
                  style={{padding:'10px 14px',background:T.card,border:`1px solid ${T.border}`,
                    borderRadius:13,color:T.t1,fontSize:11,fontWeight:800,letterSpacing:.5,
                    cursor:'pointer'}}>
                  Bearbeiten
                </button>
              )}
            </div>
          )}

          <div className="fu" style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.5,
            textTransform:'uppercase',marginBottom:8,marginLeft:4,animationDelay:'.09s'}}>
            Mitgliederliste
          </div>
          {members.length===0?(
            <div style={{color:T.t3,fontSize:13,padding:14,textAlign:'center'}}>
              Noch keine Mitglieder.
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {members.map((m,i)=>(
                <div key={m.user_id} className="fu" style={{animationDelay:`${0.1+i*0.03}s`}}>
                  <PlayerListItem profile={m.profile||{user_id:m.user_id}}
                    onClick={()=>onOpenPlayer(m.user_id)}
                    trailing={m.role==='admin'?(
                      <span style={{padding:'2px 6px',background:T.oSoft,color:T.o,borderRadius:4,
                        fontSize:9,fontWeight:800,letterSpacing:.8,textTransform:'uppercase'}}>
                        Admin
                      </span>
                    ):null}/>
                </div>
              ))}
            </div>
          )}
        </Fragment>
      )}
    </SocialScreen>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CLUB CHAT — Realtime-Messages für Club-Mitglieder
═══════════════════════════════════════════════════════════════ */
function ClubChat({clubId,currentUid,onHome,onBack}){
  const[club,setClub]=useState(null);
  const[msgs,setMsgs]=useState([]);
  const[text,setText]=useState('');
  const[busy,setBusy]=useState(false);
  // Defensive Membership-Gate: RLS verbietet das Lesen / Posten in
  // Chats von Clubs in denen man nicht Mitglied ist — aber wenn jemand
  // direkt zum Screen navigiert, zeigen wir lieber einen "kein Zugriff"-
  // Zustand statt einer leeren Liste. State 'pending' | 'ok' | 'denied'.
  const[access,setAccess]=useState('pending');
  const scrollRef=useRef(null);
  const scrollToBottom=()=>{
    requestAnimationFrame(()=>{
      const el=scrollRef.current;
      if(el) el.scrollTop=el.scrollHeight;
    });
  };
  // Initial load + Subscribe auf Realtime-Inserts
  useEffect(()=>{
    let cancelled=false;
    let unsub=()=>{};
    (async()=>{
      // Erst Membership prüfen, dann erst Daten + Realtime-Subscribe.
      const member=await isClubMember(clubId);
      if(cancelled) return;
      if(!member){ setAccess('denied'); return; }
      setAccess('ok');
      const [c,ms]=await Promise.all([fetchClub(clubId),listClubMessages(clubId,{limit:100})]);
      if(cancelled) return;
      setClub(c); setMsgs(ms);
      scrollToBottom();
      markChatRead(clubId);
      unsub=subscribeClubMessages(clubId, async(row)=>{
        setMsgs(prev=>{
          if(prev.some(m=>m.id===row.id)) return prev;
          return [...prev,{...row,profile:null}];
        });
        scrollToBottom();
        markChatRead(clubId);
      });
    })();
    return()=>{ cancelled=true; unsub(); };
  },[clubId]);

  // Kein Zugriff → freundliche Sperr-Karte mit Zurück-Button.
  if(access==='denied'){
    return(
      <SocialScreen eyebrow="Chat" title="Kein Zugriff"
        icon={<LockIcon size={22}/>} onHome={onHome}
        onBack={onBack} backLabel="Zurück">
        <RitmoPostEmpty icon={<LockIcon size={28}/>}
          title="Nur für Mitglieder"
          desc="Tritt dem Club bei, um den Chat zu sehen und mitzuschreiben."/>
      </SocialScreen>
    );
  }

  const send=async()=>{
    // Harte 500-Zeichen-Grenze (zusätzlich zu maxLength am Input).
    const body=text.trim().slice(0,500);
    if(!body||busy) return;
    setBusy(true);
    try{
      const row=await sendClubMessage(clubId,body);
      setText('');
      setMsgs(prev=>prev.some(m=>m.id===row.id)?prev:[...prev,row]);
      scrollToBottom();
    }catch(e){ alert(e.message); }
    finally{ setBusy(false); }
  };

  const fmtTime=(iso)=>{
    try{ return new Date(iso).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}); }
    catch{ return ''; }
  };
  const fmtDay=(iso)=>{
    try{
      const d=new Date(iso), now=new Date();
      const same=(a,b)=>a.toDateString()===b.toDateString();
      if(same(d,now)) return 'Heute';
      const y=new Date(now); y.setDate(now.getDate()-1);
      if(same(d,y)) return 'Gestern';
      return d.toLocaleDateString('de-DE',{day:'2-digit',month:'long'});
    }catch{ return ''; }
  };

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 40px)',
      position:'relative',overflow:'hidden'}}>

      {/* Compact Chat-Header: Cover-Mini + Club-Name + Back-Pill */}
      <div className="fi" style={{padding:'0 22px 12px',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onBack} aria-label="Zurück"
          style={{flexShrink:0,width:38,height:38,borderRadius:13,
            background:T.card2,border:`1px solid ${T.border}`,color:T.t1,
            display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <span style={{transform:'rotate(180deg)',display:'inline-flex'}}>
            <ChevronRightIcon size={16} color="currentColor"/>
          </span>
        </button>
        {(()=>{const safe=safeImageSrc(club?.cover);return safe?(
          <img src={safe} alt={club.name}
            style={{width:38,height:38,borderRadius:13,objectFit:'cover',flexShrink:0,
              border:`1px solid ${T.border}`}}/>
        ):(
          <div style={{flexShrink:0,width:38,height:38,background:T.card2,
            border:`1px solid ${T.border}`,borderRadius:13,color:T.o,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <TrophyIcon size={20}/>
          </div>
        );})()}
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
            textTransform:'uppercase'}}>Club Chat</div>
          <div style={{color:T.t1,fontSize:17,fontWeight:800,letterSpacing:-.2,marginTop:1,
            whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {club?.name||'Lädt …'}
          </div>
        </div>
      </div>

      {/* Message-Stream */}
      <div ref={scrollRef} style={{flex:1,overflowY:'auto',padding:'4px 18px 96px',
        display:'flex',flexDirection:'column',gap:7,WebkitOverflowScrolling:'touch'}}>
        {msgs.length===0?(
          <div className="fi" style={{margin:'auto',textAlign:'center',padding:'24px',
            display:'flex',flexDirection:'column',alignItems:'center',gap:14,maxWidth:260}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:T.card,
              border:`1px solid ${T.border}`,display:'flex',alignItems:'center',
              justifyContent:'center',color:T.o}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </div>
            <div>
              <div style={{color:T.t1,fontSize:15,fontWeight:800,letterSpacing:-.2,marginBottom:4}}>
                Noch keine Nachrichten
              </div>
              <div style={{color:T.t3,fontSize:12.5,lineHeight:1.55}}>
                Schreib die erste Nachricht im Club-Chat.
              </div>
            </div>
          </div>
        ):msgs.map((m,i)=>{
          const mine=m.user_id===currentUid;
          const name=m.profile?.display_name||m.profile?.data?.name||'Spieler';
          const prev=msgs[i-1];
          const showHeader=!prev||prev.user_id!==m.user_id;
          const showDay=!prev||(()=>{try{return new Date(prev.created_at).toDateString()!==new Date(m.created_at).toDateString();}catch{return false;}})();
          return(
            <Fragment key={m.id}>
              {showDay&&(
                <div style={{alignSelf:'center',margin:'10px 0 6px',padding:'4px 12px',
                  borderRadius:999,background:T.card2,border:`1px solid ${T.border}`,
                  color:T.t3,fontSize:10.5,fontWeight:800,letterSpacing:.8,
                  textTransform:'uppercase'}}>
                  {fmtDay(m.created_at)}
                </div>
              )}
              <div className="fi" style={{display:'flex',gap:8,alignItems:'flex-end',
                marginTop:showHeader?5:0,
                flexDirection:mine?'row-reverse':'row'}}>
                {!mine&&showHeader?(
                  <ProfileAvatar name={name} avatar={m.profile?.data?.avatar} size={28}/>
                ):(<div style={{width:28,flexShrink:0}}/>)}
                <div style={{maxWidth:'76%',display:'flex',flexDirection:'column',
                  alignItems:mine?'flex-end':'flex-start',gap:3}}>
                  {!mine&&showHeader&&(
                    <div style={{color:T.o,fontSize:10.5,fontWeight:800,letterSpacing:.4,
                      paddingLeft:6}}>{name}</div>
                  )}
                  <div style={{padding:'9px 13px',
                    background:mine?T.o:T.card,
                    border:mine?'none':`1px solid ${T.border}`,
                    color:mine?'#000':T.t1,fontSize:16,lineHeight:1.55,
                    whiteSpace:'pre-wrap',wordBreak:'break-word',
                    borderRadius:18,
                    borderBottomRightRadius:mine?5:18,
                    borderBottomLeftRadius:mine?18:5,
                    boxShadow:mine?'0 2px 10px var(--oGlow)':'0 1px 4px rgba(0,0,0,.18)'}}>
                    {m.body}
                  </div>
                  <div style={{color:T.t3,fontSize:9.5,fontWeight:600,
                    paddingLeft:mine?0:6,paddingRight:mine?6:0}}>
                    {fmtTime(m.created_at)}
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Composer — RITMO-Pille mit 500-Zeichen-Limit + Rund-Send */}
      <div style={{position:'absolute',left:0,right:0,
        bottom:'calc(env(safe-area-inset-bottom,0px) + 14px)',
        padding:'0 18px',zIndex:5}}>
        {text.length>=440&&(
          <div style={{textAlign:'right',padding:'0 10px 5px',
            color:text.length>=500?T.r:T.t3,fontSize:10.5,fontWeight:800,
            fontVariantNumeric:'tabular-nums'}}>
            {text.length}/500
          </div>
        )}
        <div style={{display:'flex',alignItems:'flex-end',gap:9,background:T.card,
          border:`1px solid ${T.border}`,borderRadius:24,padding:'6px 6px 6px 16px',
          boxShadow:'0 10px 30px rgba(0,0,0,.45)'}}>
          <input value={text}
            onChange={e=>setText(e.target.value.slice(0,500))}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
            maxLength={500}
            placeholder="Nachricht …"
            style={{flex:1,background:'transparent',border:'none',color:T.t1,
              fontSize:16,fontWeight:500,outline:'none',minWidth:0,padding:'9px 0'}}/>
          <button onClick={send} disabled={busy||!text.trim()} aria-label="Senden"
            style={{flexShrink:0,width:40,height:40,borderRadius:'50%',background:T.o,
              border:'none',display:'flex',alignItems:'center',justifyContent:'center',
              cursor:(busy||!text.trim())?'not-allowed':'pointer',
              opacity:(busy||!text.trim())?.45:1,
              transition:'opacity .15s, transform .12s'}}
            onPointerDown={e=>{if(!(busy||!text.trim()))e.currentTarget.style.transform='scale(.88)';}}
            onPointerUp={e=>e.currentTarget.style.transform='scale(1)'}
            onPointerLeave={e=>e.currentTarget.style.transform='scale(1)'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOLLOW LIST — Tab Folgt / Follower
═══════════════════════════════════════════════════════════════ */
function FollowList({userId,initial='followers',onHome,onBack,onOpenPlayer}){
  const[tab,setTab]=useState(initial);
  const[rows,setRows]=useState([]);
  const[busy,setBusy]=useState(true);
  useEffect(()=>{
    let cancelled=false;
    setBusy(true);
    (async()=>{
      const data=tab==='followers'
        ? await listFollowers(userId,{limit:200})
        : await listFollowing(userId,{limit:200});
      if(!cancelled){ setRows(data); setBusy(false); }
    })();
    return()=>{cancelled=true;};
  },[userId,tab]);
  const keyOf=(r)=>tab==='followers'?r.follower_id:r.followee_id;
  return(
    <SocialScreen eyebrow="Community"
      title={tab==='followers'?'Follower':'Folgt'}
      icon={<PersonGlyph size={22}/>} onHome={onHome}
      onBack={onBack} backLabel="Profil">
      <div className="fu" style={{display:'flex',gap:8,marginBottom:14}}>
        {[{id:'followers',label:'Follower'},{id:'following',label:'Folgt'}].map(t=>{
          const active=tab===t.id;
          return(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:1,padding:'10px 8px',
                background:active?T.t1:'transparent',color:active?T.bg:T.t2,
                border:`1px solid ${active?T.t1:T.border}`,borderRadius:13,
                fontSize:12,fontWeight:active?800:600,letterSpacing:.3,cursor:'pointer'}}>
              {t.label}
            </button>
          );
        })}
      </div>
      {busy?(
        <div style={{color:T.t3,fontSize:13,padding:'24px 0',textAlign:'center'}}>Lädt …</div>
      ):rows.length===0?(
        <RitmoPostEmpty icon={<PersonGlyph size={28}/>}
          title={tab==='followers'?'Noch keine Follower':'Folgst noch niemandem'}
          desc={tab==='followers'
            ?'Sobald jemand dir folgt, taucht das hier auf.'
            :'Such nach Spielern und folge ihnen, um ihre Aktivität zu sehen.'}/>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {rows.map((r,i)=>(
            <div key={keyOf(r)} className="fu" style={{animationDelay:`${i*0.03}s`}}>
              <PlayerListItem profile={r.profile||{user_id:keyOf(r)}}
                onClick={()=>onOpenPlayer(keyOf(r))}
                trailing={<ChevronRightIcon size={16} color={T.t3}/>}/>
            </div>
          ))}
        </div>
      )}
    </SocialScreen>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RITMO DNA CUP — Event-Modul (18.07.2026, RITMO × Padel Haus).

   PIN-geschützter Bereich unter Turnier (rein UND raus nur mit PIN
   1862 — Kiosk-Logik: Tablets/Screens sollen nicht versehentlich
   verlassen werden). Vier Modi: Admin (steuert alles), Tickets
   (Check-in am Einlass), Center Screen (Diashow), Court Screen
   (Punkte-Eingabe am Court). Daten-Logik: src/dnaCup.js ·
   Persistenz: localStorage 'ritmo_dnacup_state'. Mehrgeräte-Betrieb:
   optionaler Cloud-Sync über die ritmo_sessions-Tabelle (Code am
   Hauptgerät erzeugen, an den anderen Geräten eingeben) — Details
   am DnaCupScreen unten.
═══════════════════════════════════════════════════════════════ */

/* Ticket-Glyph — nur im Cup verwendet, daher lokal statt icons.jsx. */
function CupTicketIcon({size=24,color='currentColor'}){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8.5V6.8C4 6.36 4.36 6 4.8 6h14.4c.44 0 .8.36.8.8v1.7a2.5 2.5 0 0 0 0 5V17.2c0 .44-.36.8-.8.8H4.8a.8.8 0 0 1-.8-.8v-1.7a2.5 2.5 0 0 0 0-5Z"
        stroke={color} strokeWidth="1.7" strokeLinejoin="round"/>
      <line x1="14.5" y1="7" x2="14.5" y2="17" stroke={color} strokeWidth="1.5" strokeDasharray="2.4 2.6"/>
    </svg>
  );
}

/* Icon-Map für Warnmeldungen (Banner auf Center-/Court-Screens). */
function CupAlertIcon({icon,size=18,color='#000'}){
  if(icon==='ball') return <TennisBallIcon size={size}/>;
  if(icon==='pause') return <PauseIcon size={size} color={color}/>;
  if(icon==='edit') return <EditIcon size={size} color={color}/>;
  return <WarnIcon size={size} color={color}/>;
}

/* Toast-Optik der Warnmeldung — Admin-Vorschau; Center/Court zeigen
   exakt dieselbe Komponente, wenn sie gebaut werden. */
/* Warn-Banner (Referenz-Design): dunkler, gelb getönter Balken —
   Warn-Icon links, Titel + Untertitel gestapelt, optional gelber
   CTA-Pill rechts ("Jetzt eintragen"). big = Center-Screen-Größe. */
function CupAlertToast({alert,big=false,solid=false}){
  if(!alert) return null;
  /* solid: knalliges Vollflächen-Gelb (Event-Branding) mit schwarzem
     Icon-Kreis — Court-Screen-Kopf, muss vom Court aus lesbar sein. */
  if(solid) return(
    <div className="si" style={{display:'flex',alignItems:'center',gap:big?16:12,minWidth:0,
      background:CUP_WARN,borderRadius:big?22:16,padding:big?'12px 24px':'10px 16px',
      boxShadow:`0 10px 30px color-mix(in srgb, ${CUP_WARN} 30%, transparent)`}}>
      <span style={{width:big?46:34,height:big?46:34,borderRadius:'50%',background:'#000',
        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <CupAlertIcon icon={alert.icon} size={big?22:16} color={CUP_WARN}/>
      </span>
      <span style={{minWidth:0}}>
        <span style={{display:'block',color:'#000',fontWeight:900,letterSpacing:-.3,
          fontSize:big?'clamp(20px, 2.4vw, 32px)':16,lineHeight:1.15,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{alert.label}</span>
        {alert.sub&&(
          <span style={{display:'block',color:'#000',opacity:.75,fontWeight:700,marginTop:1,
            fontSize:big?'clamp(12px, 1.4vw, 17px)':12,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{alert.sub}</span>
        )}
      </span>
      {alert.cta&&(
        <span style={{flexShrink:0,marginLeft:big?8:4,background:'#000',color:CUP_WARN,
          fontWeight:800,borderRadius:999,padding:big?'10px 18px':'7px 12px',
          fontSize:big?'clamp(11px, 1.25vw, 17px)':11.5,whiteSpace:'nowrap'}}>{alert.cta}</span>
      )}
    </div>
  );
  return(
    <div className="si" style={{display:'flex',alignItems:'center',gap:big?18:12,minWidth:0,
      background:`color-mix(in srgb, ${CUP_WARN} 10%, ${T.card})`,
      border:`1px solid color-mix(in srgb, ${CUP_WARN} 40%, transparent)`,
      borderRadius:big?17:13,padding:big?'14px 22px':'11px 14px',
      boxShadow:'0 10px 28px rgba(0,0,0,.4)'}}>
      <span style={{color:CUP_WARN,display:'inline-flex',flexShrink:0}}>
        <CupAlertIcon icon={alert.icon} size={big?30:20} color={CUP_WARN}/>
      </span>
      <span style={{minWidth:0,flex:'0 1 auto'}}>
        <span style={{display:'block',color:T.t1,fontWeight:900,letterSpacing:-.2,
          fontSize:big?'clamp(16px, 1.9vw, 26px)':15,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{alert.label}</span>
        {alert.sub&&(
          <span style={{display:'block',color:T.t2,fontWeight:500,marginTop:2,
            fontSize:big?'clamp(11px, 1.2vw, 16px)':11.5,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{alert.sub}</span>
        )}
      </span>
      {alert.cta&&(
        <span style={{flexShrink:0,marginLeft:big?10:6,background:CUP_WARN,color:'#000',
          fontWeight:800,borderRadius:999,padding:big?'10px 18px':'7px 12px',
          fontSize:big?'clamp(11px, 1.25vw, 17px)':11.5,whiteSpace:'nowrap'}}>{alert.cta}</span>
      )}
    </div>
  );
}

/* Runden-Timer im Uhr-Look (Referenz: Apple-Timer): dunkles Ziffern-
   blatt mit Minuten-Ticks, grüner Fortschrittsring (Restzeit-Anteil,
   abgerundete Enden, Glow), mittig "Zeit" + -HH:MM:SS- in Grün und
   die Einheiten Std./Min./Sek. darunter. Restzeit kommt aus dem
   startedAt-Timestamp (kein Tick-Sync nötig); der 500ms-Repaint
   läuft nur lokal. Rendert nichts, solange der Timer inaktiv ist. */
function CupTimer({timer,big=false}){
  const[,force]=useState(0);
  useEffect(()=>{
    if(!timer?.startedAt) return;
    const id=setInterval(()=>force(x=>x+1),500);
    return()=>clearInterval(id);
  },[timer?.startedAt]);
  if(!timer||(!timer.startedAt&&timer.left==null)) return null;
  const left=timer.startedAt
    ?Math.max(0,timer.sec-Math.floor((Date.now()-timer.startedAt)/1000))
    :Math.max(0,timer.left||0);
  const paused=!timer.startedAt;
  const frac=timer.sec>0?left/timer.sec:0;
  const hh=String(Math.floor(left/3600)).padStart(2,'0');
  const mm=String(Math.floor((left%3600)/60)).padStart(2,'0');
  const ss=String(left%60).padStart(2,'0');
  // FLACHER Pill (16:9-Monitor): Mini-Fortschrittsring als Uhr-Element
  // + Zeit-Label + -HH:MM:SS- inline — gleiche Bauhöhe wie der Toast.
  const R=13,C=2*Math.PI*R;
  return(
    <div className="si" style={{display:'inline-flex',alignItems:'center',gap:big?12:9,
      alignSelf:'center',background:T.card,opacity:paused?.8:1,
      border:`1.5px solid ${T.g}`,borderRadius:999,
      padding:big?'7px 16px':'6px 12px',
      boxShadow:`0 0 14px color-mix(in srgb, ${T.g} 30%, transparent), 0 6px 18px rgba(0,0,0,.3)`}}>
      <svg viewBox="0 0 32 32" aria-hidden="true"
        style={{width:big?'clamp(26px, 2.6vw, 38px)':24,height:'auto',flexShrink:0,display:'block'}}>
        <circle cx="16" cy="16" r={R} fill="none" strokeWidth="3.5"
          stroke={`color-mix(in srgb, ${T.g} 20%, transparent)`}/>
        <circle cx="16" cy="16" r={R} fill="none" stroke={T.g} strokeWidth="3.5"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-frac)}
          transform="rotate(-90 16 16)"
          style={{transition:'stroke-dashoffset .5s linear'}}/>
      </svg>
      <span style={{display:'flex',flexDirection:'column',lineHeight:1}}>
        <span style={{color:T.g,fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',
          marginBottom:2,fontSize:big?'clamp(9px, .95vw, 13px)':9}}>
          {paused?'Pause':'Zeit'}
        </span>
        <span style={{color:T.g,fontWeight:800,letterSpacing:.5,
          fontSize:big?'clamp(18px, 2vw, 30px)':18,
          fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',
          fontVariantNumeric:'tabular-nums'}}>
          -{hh}:{mm}:{ss}-
        </span>
      </span>
    </div>
  );
}

/* PIN-Pad — Zugang UND Ausgang. Kiosk-tauglich (eigenes Tastenfeld,
   keine OS-Tastatur). 4 Punkte, Shake + Reset bei falschem PIN. */
function CupPinPad({title,sub,onOk,onCancel}){
  const[pin,setPin]=useState('');
  const[err,setErr]=useState(false);
  const push=d=>{
    if(err) return;
    const v=pin+d;
    setPin(v);
    if(v.length<4){buzz(6);return;}
    if(v===CUP_PIN){buzz(14);onOk();}
    else{setErr(true);buzz([30,40,30]);setTimeout(()=>{setErr(false);setPin('');},650);}
  };
  return(
    <div className="fi" style={{position:'fixed',inset:0,zIndex:340,background:T.bg,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{color:T.o,fontSize:12,fontWeight:800,letterSpacing:1.6,
        textTransform:'uppercase',marginBottom:8}}>RITMO DNA CUP</div>
      <div style={{color:T.t1,fontSize:22,fontWeight:900,letterSpacing:-.4,marginBottom:6}}>{title}</div>
      <div style={{color:T.t3,fontSize:13,marginBottom:26,textAlign:'center',lineHeight:1.5}}>{sub}</div>
      <div className={err?'cup-shake':''} style={{display:'flex',gap:14,marginBottom:30}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:16,height:16,borderRadius:'50%',
            background:i<pin.length?(err?T.r:T.o):'transparent',
            border:`2px solid ${err?T.r:(i<pin.length?T.o:T.border)}`,
            transition:'background .15s, border-color .15s'}}/>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3, 76px)',gap:12}}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k,i)=>k===''
          ?<div key={i}/>
          :<button key={i} onClick={()=>k==='⌫'?setPin(p=>p.slice(0,-1)):push(k)}
            aria-label={k==='⌫'?'Ziffer löschen':`Ziffer ${k}`}
            style={{height:64,borderRadius:18,background:T.card,border:`1px solid ${T.border}`,
              color:T.t1,fontSize:k==='⌫'?20:24,fontWeight:700,cursor:'pointer'}}>
            {k}
          </button>
        )}
      </div>
      {onCancel&&(
        <button onClick={onCancel}
          style={{marginTop:26,padding:'11px 24px',borderRadius:13,background:'none',
            border:`1px solid ${T.border}`,color:T.t3,fontSize:14,fontWeight:600,cursor:'pointer'}}>
          Abbrechen
        </button>
      )}
    </div>
  );
}

/* Spieler-Auswahl-Sheet für Match-Slots (Admin: Paarungen editieren). */
function CupPickSheet({cup,current,onPick,onClose}){
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:360,background:'rgba(0,0,0,.7)',
      backdropFilter:'blur(4px)',display:'flex',alignItems:'flex-end'}} className="fi">
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxHeight:'75dvh',overflowY:'auto',
        background:T.card,borderTopLeftRadius:24,borderTopRightRadius:24,
        padding:'18px 18px calc(env(safe-area-inset-bottom,0px) + 18px)'}}>
        <div style={{width:36,height:4,borderRadius:2,background:T.border,margin:'0 auto 14px'}}/>
        <div style={{color:T.t1,fontSize:17,fontWeight:800,marginBottom:12}}>Spieler wählen</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {cup.players.map(p=>{
            const sel=current===p.num;
            return(
              <button key={p.num} onClick={()=>{buzz(6);onPick(p.num);onClose();}}
                style={{padding:'12px 12px',borderRadius:13,textAlign:'left',cursor:'pointer',
                  background:sel?T.oSoft:T.card2,
                  border:`1.5px solid ${sel?T.o:T.border}`,
                  display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                <span style={{color:T.o,fontSize:13,fontWeight:900,flexShrink:0}}>P{p.num}</span>
                <span style={{color:T.t1,fontSize:13,fontWeight:600,minWidth:0,overflow:'hidden',
                  textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {(p.name||'').trim()||'—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Match-Karte im Admin: Court-Zuordnung, Slots, Score, Fertig-Toggle.
   Tier-Badge erscheint, sobald alle 4 Spielstile gesetzt sind. */
function CupMatchCard({m,cup,label,onPatch,onPickSlot}){
  const styleOf=num=>cup.players.find(p=>p.num===num)?.style;
  const tier=computeMatchTier(m.t1.map(styleOf),m.t2.map(styleOf));
  const slot=(side,idx)=>{
    const num=m[side][idx];
    return(
      <button key={side+idx} onClick={()=>onPickSlot({matchId:m.id,side,idx,current:num})}
        style={{flex:1,minWidth:0,padding:'9px 8px',borderRadius:11,cursor:'pointer',
          background:T.card2,border:`1px solid ${T.border}`,textAlign:'center'}}>
        <span style={{display:'block',color:T.o,fontSize:12,fontWeight:900}}>P{num}</span>
        <span style={{display:'block',color:T.t2,fontSize:10.5,fontWeight:600,marginTop:1,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {(cup.players.find(p=>p.num===num)?.name||'').trim().split(/\s+/)[0]||'·'}
        </span>
      </button>
    );
  };
  const scoreInp=(field)=>(
    <input type="number" inputMode="numeric" min="0" value={m[field]??''}
      onChange={e=>{const v=e.target.value;onPatch(m.id,{[field]:v===''?null:Math.max(0,parseInt(v)||0)});}}
      style={{width:58,padding:'9px 4px',background:T.card2,border:`1px solid ${T.border}`,
        borderRadius:10,color:T.t1,fontSize:17,fontWeight:800,textAlign:'center',outline:'none',
        fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}/>
  );
  return(
    <div style={{background:T.card,border:`1.5px solid ${m.done?T.o:T.border}`,borderRadius:17,
      padding:'13px 14px',marginBottom:10}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,flexWrap:'wrap'}}>
        <span style={{color:T.t1,fontSize:13,fontWeight:800,flexShrink:0}}>{label}</span>
        {m.bo3&&(
          <span style={{padding:'2px 8px',borderRadius:999,background:T.card2,
            border:`1px solid ${T.border}`,color:T.t2,fontSize:10,fontWeight:800,letterSpacing:.5}}>
            BEST OF 3
          </span>
        )}
        {tier&&(
          <span style={{padding:'2px 8px',borderRadius:999,background:`${tier.color}14`,
            border:`1px solid ${tier.color}55`,color:tier.color,fontSize:10,fontWeight:900,letterSpacing:.5}}>
            {tier.label}
          </span>
        )}
        <span style={{flex:1}}/>
        {/* Court-Zuordnung — steuert, welcher Court-Screen das Match zeigt */}
        {[1,2,3].map(c=>(
          <button key={c} onClick={()=>{buzz(6);onPatch(m.id,{court:c});}}
            aria-label={`Court ${c} zuweisen`}
            style={{width:30,height:30,borderRadius:9,cursor:'pointer',fontSize:12,fontWeight:800,
              background:m.court===c?T.oSoft:T.card2,
              border:`1.5px solid ${m.court===c?T.o:T.border}`,
              color:m.court===c?T.o:T.t3}}>
            {c}
          </button>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{flex:1,minWidth:0,display:'flex',gap:6}}>{slot('t1',0)}{slot('t1',1)}</div>
        <span style={{color:T.t3,fontSize:11,fontWeight:800,flexShrink:0}}>vs</span>
        <div style={{flex:1,minWidth:0,display:'flex',gap:6}}>{slot('t2',0)}{slot('t2',1)}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10}}>
        {scoreInp('s1')}
        <span style={{color:T.t3,fontSize:15,fontWeight:800}}>:</span>
        {scoreInp('s2')}
        <span style={{flex:1}}/>
        <button onClick={()=>{buzz(12);onPatch(m.id,{done:!m.done});}}
          style={{padding:'9px 16px',borderRadius:11,cursor:'pointer',fontSize:13,fontWeight:800,
            background:m.done?T.o:T.card2,color:m.done?'#000':T.t2,
            border:`1.5px solid ${m.done?T.o:T.border}`}}>
          {m.done?'Fertig ✓':'Offen'}
        </button>
      </div>
    </div>
  );
}

/* ── ADMIN — Steuerung · Spieler · Matches · Leaderboard ────────── */
function CupAdmin({cup,setCup,lb,onBack}){
  const[tab,setTab]=useState('steuerung');
  const[pick,setPick]=useState(null);        // {matchId,side,idx,current}
  const[styleFor,setStyleFor]=useState(null); // Spieler-Index für StylePicker
  const[customAlert,setCustomAlert]=useState('');
  const[genMsg,setGenMsg]=useState('');
  const[confirmReset,setConfirmReset]=useState(false);
  const dups=cupDuplicateNums(cup.players);
  // Spielerfoto: EIN verstecktes File-Input für alle Zeilen; photoIdx
  // merkt, wessen Foto gerade aufgenommen wird. 160px-JPEG hält den
  // State klein (localStorage + Cloud-Sync tragen ihn komplett).
  const photoInRef=useRef(null);
  const[photoIdx,setPhotoIdx]=useState(-1);
  const onPhotoFile=async e=>{
    const f=e.target.files&&e.target.files[0];
    e.target.value='';
    if(!f||photoIdx<0) return;
    try{
      const raw=await readImageAsDataUrl(f);
      const photo=await resizeImage(raw,160);
      setPlayerAt(photoIdx,{photo});
      buzz(10);
    }catch(err){}
  };

  const patchMatch=(id,partial)=>setCup(c=>({...c,matches:c.matches.map(m=>m.id===id?{...m,...partial}:m)}));
  const setPlayerAt=(idx,partial)=>setCup(c=>{
    const players=[...c.players];players[idx]={...players[idx],...partial};return {...c,players};});
  const sendAlert=a=>{buzz(10);setCup(c=>({...c,alert:{...a,ts:Date.now()}}));};
  const clearAlert=()=>setCup(c=>({...c,alert:null}));
  // Runden-Timer (Center Screen) — laufend über startedAt-Timestamp,
  // pausiert über left; Resume rechnet startedAt zurück, damit die
  // Restzeit-Formel sec-(now-startedAt) überall gleich bleibt.
  const tm=cup.timer||{sec:600,startedAt:null,left:null};
  const setTimer=p=>setCup(c=>({...c,timer:{...(c.timer||{sec:600,startedAt:null,left:null}),...p}}));
  const timerLeftNow=()=>tm.startedAt
    ?Math.max(0,tm.sec-Math.floor((Date.now()-tm.startedAt)/1000))
    :(tm.left??tm.sec);
  const timerStart=()=>{buzz(12);setTimer({startedAt:Date.now(),left:null});};
  const timerPause=()=>{buzz(8);setTimer({startedAt:null,left:timerLeftNow()});};
  const timerResume=()=>{buzz(8);setTimer({startedAt:Date.now()-(tm.sec-(tm.left??tm.sec))*1000,left:null});};
  const timerReset=()=>{buzz(8);setTimer({startedAt:null,left:null});};
  const timerAdjust=d=>setTimer({sec:Math.min(3600,Math.max(60,tm.sec+d)),startedAt:null,left:null});
  const toggleLock=court=>{buzz(8);setCup(c=>({...c,locks:{...c.locks,[court]:!c.locks[court]}}));};
  const setAllLocks=v=>{buzz(8);setCup(c=>({...c,locks:{1:v,2:v,3:v}}));};

  const grpDone=cup.matches.filter(m=>m.phase==='gruppe'&&m.done).length;
  const grpAll=cup.matches.filter(m=>m.phase==='gruppe').length;
  const koAll=cup.matches.filter(m=>m.phase==='ko');
  const koDone=koAll.filter(m=>m.done).length;
  const hfAll=cup.matches.filter(m=>m.phase==='hf'||m.phase==='courage-hf');
  const hfDone=hfAll.filter(m=>m.done).length;

  // Generatoren — bauen die jeweils nächste Phase aus dem Leaderboard.
  // Platzierungen werden erst gezogen, wenn die Gruppenphase KOMPLETT
  // ist (18/18) — vorher wären die Paarungen aus einer halben Tabelle.
  const genKO=()=>{
    if(grpDone<grpAll){
      setGenMsg(`Platzierungen werden erst nach der Gruppenphase gezogen — ${grpDone}/${grpAll} Matches fertig.`);
      buzz([20,40,20]);
      return;
    }
    setCup(c=>({...c,
      matches:[...c.matches.filter(m=>m.phase==='gruppe'),...genCupKO(lb),...genCupCourageHF(lb)],
      phase:'ko'}));
    setGenMsg('KO-Phase (Rang 3–14, gespiegelt) + Courage-HF (15–22) erzeugt.');
    buzz(14);
  };
  const genHF=()=>{
    const hf=genCupHF(cup,lb);
    if(!hf){setGenMsg('Erst alle 3 KO-Matches auf „Fertig ✓" setzen.');return;}
    setCup(c=>({...c,
      matches:[...c.matches.filter(m=>m.phase!=='hf'&&m.phase!=='finals'),...hf],
      phase:'hf'}));
    setGenMsg('DNA-Halbfinals erzeugt — KO-Siegerteams gesplittet (A→HF1, B→HF2).');
    buzz(14);
  };
  const genFin=()=>{
    const f=genCupFinals(cup);
    if(!f){setGenMsg('Erst beide DNA-HF und beide Courage-HF abschließen.');return;}
    setCup(c=>({...c,matches:[...c.matches.filter(m=>m.phase!=='finals'),...f],phase:'finals'}));
    setGenMsg('Finals erzeugt: Grande Finale · Platz 3 · Courage-Finale.');
    buzz(14);
  };

  const card={background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
    padding:'16px 18px',marginBottom:14};
  const h={color:T.o,fontSize:16,fontWeight:800,marginBottom:10};
  const chip=(sel,color=T.o)=>({padding:'10px 12px',borderRadius:13,cursor:'pointer',
    background:sel?T.oSoft:T.card2,border:`1.5px solid ${sel?color:T.border}`,
    color:sel?color:T.t2,fontSize:13,fontWeight:700});
  const matchLabel=m=>
    m.phase==='gruppe'?`Runde ${m.round}`
    :m.phase==='ko'?`KO · Match ${m.id.slice(2)}`
    :m.phase==='hf'?(m.id==='hf1'?'DNA-Halbfinale 1':'DNA-Halbfinale 2')
    :m.phase==='courage-hf'?(m.id==='chf1'?'Courage-HF 1':'Courage-HF 2')
    :(m.title||'Finale');

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
      {/* Kopf */}
      <div style={{padding:'0 22px 12px',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onBack} aria-label="Zurück zur Kachel-Auswahl"
          style={{width:38,height:38,borderRadius:13,background:T.card,border:`1px solid ${T.border}`,
            color:T.t1,fontSize:18,fontWeight:800,cursor:'pointer',flexShrink:0,
            display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:T.t1,fontSize:22,fontWeight:900,letterSpacing:-.4}}>Admin</div>
          <div style={{color:T.t3,fontSize:11.5}}>Änderungen wirken sofort auf Center- & Court-Screens.</div>
        </div>
      </div>
      {/* Tabs */}
      <div style={{display:'flex',gap:8,padding:'0 22px 14px',overflowX:'auto',flexShrink:0}}>
        {[['steuerung','Steuerung'],['spieler','Spieler'],['matches','Matches'],['leaderboard','Leaderboard']].map(([id,l])=>(
          <button key={id} onClick={()=>{buzz(6);setTab(id);}} style={{...chip(tab===id),flexShrink:0}}>{l}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',
        padding:'2px 22px calc(env(safe-area-inset-bottom,0px) + 26px)'}}>

        {/* ── STEUERUNG ── */}
        {tab==='steuerung'&&(<div className="fi">
          <div style={card}>
            <div style={h}>Phase</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {CUP_PHASES.map(p=>(
                <button key={p.id} onClick={()=>{buzz(8);setCup(c=>({...c,phase:p.id}));}}
                  style={{...chip(cup.phase===p.id),textAlign:'left'}}>
                  <span style={{display:'block'}}>{p.name}</span>
                  <span style={{display:'block',fontSize:10,fontWeight:600,opacity:.75,marginTop:2}}>{p.sub}</span>
                </button>
              ))}
            </div>
            {cup.phase==='gruppe'&&(
              <div style={{display:'flex',alignItems:'center',gap:12,marginTop:12}}>
                <span style={{color:T.t2,fontSize:13,fontWeight:600}}>Aktive Runde</span>
                <button onClick={()=>setCup(c=>({...c,activeRound:Math.max(1,c.activeRound-1)}))}
                  style={{...chip(false),width:38,textAlign:'center',padding:'8px 0'}}>−</button>
                <span style={{color:T.t1,fontSize:18,fontWeight:900,minWidth:44,textAlign:'center'}}>
                  {cup.activeRound}/6
                </span>
                <button onClick={()=>setCup(c=>({...c,activeRound:Math.min(6,c.activeRound+1)}))}
                  style={{...chip(false),width:38,textAlign:'center',padding:'8px 0'}}>+</button>
              </div>
            )}
          </div>

          <div style={card}>
            <div style={h}>Warnmeldung an alle Screens</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
              {CUP_ALERTS.map(a=>(
                <button key={a.id} onClick={()=>sendAlert(a)}
                  style={{...chip(cup.alert?.id===a.id),display:'flex',alignItems:'center',gap:7}}>
                  <CupAlertIcon icon={a.icon} size={15} color={cup.alert?.id===a.id?T.o:T.t2}/>
                  {a.label}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <input value={customAlert} onChange={e=>setCustomAlert(e.target.value)} maxLength={40}
                placeholder="Eigene Meldung …"
                style={{flex:1,minWidth:0,height:44,borderRadius:12,background:T.card2,
                  border:`1px solid ${T.border}`,color:T.t1,fontSize:16,fontWeight:600,
                  padding:'0 12px',outline:'none',boxSizing:'border-box'}}/>
              <button onClick={()=>{if(!customAlert.trim())return;
                  sendAlert({id:'custom',label:customAlert.trim(),icon:'edit'});setCustomAlert('');}}
                style={{...chip(true),flexShrink:0}}>Senden</button>
            </div>
            {cup.alert&&(
              <div style={{marginTop:14}}>
                <div style={{color:T.t3,fontSize:10.5,fontWeight:700,letterSpacing:1.2,
                  textTransform:'uppercase',marginBottom:8}}>Aktive Meldung — Vorschau</div>
                <CupAlertToast alert={cup.alert}/>
                <button onClick={clearAlert}
                  style={{marginTop:10,padding:'9px 16px',borderRadius:11,background:'none',
                    border:`1px solid ${T.border}`,color:T.t3,fontSize:12.5,fontWeight:700,cursor:'pointer'}}>
                  Meldung entfernen
                </button>
              </div>
            )}
          </div>

          <div style={card}>
            <div style={h}>Runden-Timer (Center Screen)</div>
            <div style={{color:T.t3,fontSize:12,lineHeight:1.55,marginBottom:12}}>
              Grüner Sport-Timer neben der Warnmeldung auf dem Center Screen.
              Dauer einstellen, dann starten — pausieren und zurücksetzen jederzeit.
            </div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
              <button onClick={()=>timerAdjust(-60)} disabled={!!tm.startedAt}
                aria-label="Eine Minute weniger"
                style={{...chip(false),width:44,textAlign:'center',padding:'10px 0',
                  opacity:tm.startedAt?.45:1}}>−</button>
              <div style={{flex:1,textAlign:'center'}}>
                <div style={{color:T.g,fontSize:26,fontWeight:900,letterSpacing:1,
                  fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',
                  fontVariantNumeric:'tabular-nums'}}>
                  {String(Math.floor(tm.sec/60)).padStart(2,'0')}:{String(tm.sec%60).padStart(2,'0')}
                </div>
                <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.2,
                  textTransform:'uppercase',marginTop:2}}>Dauer</div>
              </div>
              <button onClick={()=>timerAdjust(60)} disabled={!!tm.startedAt}
                aria-label="Eine Minute mehr"
                style={{...chip(false),width:44,textAlign:'center',padding:'10px 0',
                  opacity:tm.startedAt?.45:1}}>+</button>
            </div>
            <div style={{display:'flex',gap:8}}>
              {tm.startedAt?(
                <button onClick={timerPause} style={{...chip(true,T.g),flex:1,textAlign:'center',
                  background:`color-mix(in srgb, ${T.g} 14%, transparent)`,
                  border:`1.5px solid ${T.g}`,color:T.g}}>Pause</button>
              ):tm.left!=null?(
                <button onClick={timerResume} style={{...chip(true,T.g),flex:1,textAlign:'center',
                  background:`color-mix(in srgb, ${T.g} 14%, transparent)`,
                  border:`1.5px solid ${T.g}`,color:T.g}}>Weiter</button>
              ):(
                <button onClick={timerStart} style={{...chip(true,T.g),flex:1,textAlign:'center',
                  background:`color-mix(in srgb, ${T.g} 14%, transparent)`,
                  border:`1.5px solid ${T.g}`,color:T.g}}>Start</button>
              )}
              {(tm.startedAt||tm.left!=null)&&(<>
                <button onClick={timerStart} style={{...chip(false),flex:1,textAlign:'center'}}>
                  Neu starten
                </button>
                <button onClick={timerReset} style={{...chip(false),flex:1,textAlign:'center'}}>
                  Stopp
                </button>
              </>)}
            </div>
            {(tm.startedAt||tm.left!=null)&&(
              <div style={{marginTop:12,display:'flex',justifyContent:'center'}}>
                <CupTimer timer={tm}/>
              </div>
            )}
          </div>

          <div style={card}>
            <div style={h}>Court-Screens sperren</div>
            <div style={{color:T.t3,fontSize:12,lineHeight:1.55,marginBottom:10}}>
              Gesperrte Courts zeigen das Match, erlauben aber keine Punkteeingabe —
              z. B. während das Match läuft.
            </div>
            <div style={{display:'flex',gap:8}}>
              {[1,2,3].map(c=>(
                <button key={c} onClick={()=>toggleLock(c)}
                  style={{...chip(cup.locks[c],T.r),flex:1,textAlign:'center'}}>
                  Court {c}{cup.locks[c]?' 🔒':''}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button onClick={()=>setAllLocks(true)} style={{...chip(false),flex:1,textAlign:'center'}}>Alle sperren</button>
              <button onClick={()=>setAllLocks(false)} style={{...chip(false),flex:1,textAlign:'center'}}>Alle freigeben</button>
            </div>
            <div style={{color:T.t3,fontSize:11.5,lineHeight:1.55,marginTop:12}}>
              Kiosk: Die Court-Ansicht ist auf den Tablets immer fixiert —
              verlassen geht am Gerät nur per PIN.
            </div>
          </div>

          <div style={card}>
            <div style={h}>Phasen-Generator</div>
            <div style={{color:T.t3,fontSize:12,lineHeight:1.55,marginBottom:10}}>
              Baut die nächste Phase aus dem aktuellen Leaderboard. Paarungen bleiben
              danach im Tab „Matches" frei editierbar.
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button onClick={genKO} style={{...chip(false),textAlign:'left'}}>
                KO + Courage-HF erzeugen
                <span style={{display:'block',fontSize:10.5,fontWeight:600,opacity:.7,marginTop:2}}>
                  Gruppenphase: {grpDone}/18 Matches fertig
                </span>
              </button>
              <button onClick={genHF} style={{...chip(false),textAlign:'left'}}>
                DNA-Halbfinals erzeugen (Team-Split)
                <span style={{display:'block',fontSize:10.5,fontWeight:600,opacity:.7,marginTop:2}}>
                  KO: {koDone}/{koAll.length||3} fertig
                </span>
              </button>
              <button onClick={genFin} style={{...chip(false),textAlign:'left'}}>
                Finals erzeugen
                <span style={{display:'block',fontSize:10.5,fontWeight:600,opacity:.7,marginTop:2}}>
                  Halbfinals: {hfDone}/{hfAll.length||4} fertig
                </span>
              </button>
            </div>
            {genMsg&&(
              <div style={{marginTop:10,padding:'10px 14px',borderRadius:12,background:T.oSoft,
                border:`1px solid ${T.o}`,color:T.t1,fontSize:12.5,fontWeight:600,lineHeight:1.5}}>
                {genMsg}
              </div>
            )}
          </div>

          <div style={{...card,border:`1px solid rgba(232,69,69,0.4)`}}>
            <div style={{...h,color:T.r}}>Gefahrenzone</div>
            {!confirmReset?(
              <button onClick={()=>setConfirmReset(true)}
                style={{...chip(false),width:'100%',textAlign:'center'}}>Cup zurücksetzen …</button>
            ):(
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{setCup(initialCupState());setConfirmReset(false);setGenMsg('');buzz([20,50,20]);}}
                  style={{...chip(true,T.r),flex:1,textAlign:'center',background:'rgba(232,69,69,0.12)',
                    border:`1.5px solid ${T.r}`,color:T.r}}>
                  Wirklich alles löschen
                </button>
                <button onClick={()=>setConfirmReset(false)}
                  style={{...chip(false),flex:1,textAlign:'center'}}>Abbrechen</button>
              </div>
            )}
          </div>
        </div>)}

        {/* ── SPIELER ── */}
        {tab==='spieler'&&(<div className="fi">
          {dups.size>0&&(
            <div style={{padding:'10px 14px',borderRadius:12,background:'rgba(232,69,69,0.08)',
              border:'1px solid rgba(232,69,69,0.4)',color:'#FF6B6B',fontSize:12,fontWeight:600,
              lineHeight:1.5,marginBottom:12}}>
              Doppelte Spielernummer: {[...dups].map(n=>'P'+n).join(', ')} — bitte korrigieren.
            </div>
          )}
          <div style={{color:T.t3,fontSize:12,lineHeight:1.55,marginBottom:12}}>
            Die Spielernummer (P1–P22) ist die Identität im Spielplan — unabhängig von der
            Leaderboard-Platzierung. Der Spielstil bestimmt die Extra-Punkte der Matches (Tier).
            Der grüne Punkt zeigt den Check-in (Tickets) —
            aktuell {cup.players.filter(p=>p.inAt).length}/{cup.players.length}.
            Über das Foto-Feld nimmst du ein Spielerbild auf — es erscheint an
            den Matches auf Center- & Court-Screen.
          </div>
          <input ref={photoInRef} type="file" accept="image/*"
            style={{display:'none'}} onChange={onPhotoFile}/>
          {cup.players.map((p,idx)=>(
            <div key={idx} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span title={p.inAt?'Eingecheckt':'Noch nicht eingecheckt'}
                style={{width:8,height:8,borderRadius:'50%',flexShrink:0,
                  background:p.inAt?T.g:'transparent',
                  border:`1.5px solid ${p.inAt?T.g:T.border}`}}/>
              <div style={{position:'relative',flexShrink:0}}>
                <button onClick={()=>{buzz(6);setPhotoIdx(idx);photoInRef.current&&photoInRef.current.click();}}
                  title={p.photo?'Foto ersetzen':'Foto aufnehmen'} aria-label={`Foto für P${p.num}`}
                  style={{width:44,height:44,borderRadius:12,padding:0,overflow:'hidden',
                    cursor:'pointer',background:T.card2,color:T.t3,display:'flex',
                    alignItems:'center',justifyContent:'center',
                    border:`1.5px solid ${p.photo?T.o:T.border}`}}>
                  {p.photo
                    ?<img src={p.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    :<PersonGlyph size={18}/>}
                </button>
                {p.photo&&(
                  <button onClick={()=>{buzz(6);setPlayerAt(idx,{photo:null});}}
                    aria-label={`Foto für P${p.num} entfernen`} title="Foto entfernen"
                    style={{position:'absolute',top:-6,right:-6,width:18,height:18,
                      borderRadius:'50%',background:T.r,border:'none',color:'#FFF',
                      fontSize:11,fontWeight:900,cursor:'pointer',lineHeight:1,padding:0}}>×</button>
                )}
              </div>
              <input type="number" inputMode="numeric" min="1" max="99" value={p.num}
                onChange={e=>setPlayerAt(idx,{num:Math.max(1,parseInt(e.target.value)||1)})}
                aria-label="Spielernummer"
                style={{width:58,height:44,borderRadius:12,textAlign:'center',
                  background:T.card2,border:`1.5px solid ${dups.has(p.num)?T.r:T.border}`,
                  color:dups.has(p.num)?T.r:T.o,fontSize:15,fontWeight:900,outline:'none'}}/>
              <input value={p.name} onChange={e=>setPlayerAt(idx,{name:e.target.value})}
                placeholder={`Spieler P${p.num}`}
                autoCapitalize="words" autoCorrect="off" spellCheck={false} enterKeyHint="next"
                style={{flex:1,minWidth:0,height:44,borderRadius:12,background:T.card2,
                  border:`1px solid ${T.border}`,color:T.t1,fontSize:16,fontWeight:600,
                  padding:'0 12px',outline:'none',boxSizing:'border-box'}}/>
              <button onClick={()=>setStyleFor(idx)} title="Spielstil wählen"
                aria-label="Spielstil wählen"
                style={{width:44,height:44,borderRadius:12,flexShrink:0,cursor:'pointer',
                  background:p.style?`${PADEL_STYLES[p.style]?.accent||T.o}18`:T.card2,
                  border:`1.5px solid ${p.style?(PADEL_STYLES[p.style]?.accent||T.o):T.border}`,
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                {p.style
                  ?<ArchetypeGlyph type={p.style} active color={PADEL_STYLES[p.style]?.accent||T.o} size={20}/>
                  :<DNAIcon size={16} color={T.t3}/>}
              </button>
            </div>
          ))}
        </div>)}

        {/* ── MATCHES ── */}
        {tab==='matches'&&(<div className="fi">
          {[1,2,3,4,5,6].map(r=>(
            <div key={r}>
              <div style={{color:T.t3,fontSize:11,fontWeight:800,letterSpacing:1.3,
                textTransform:'uppercase',margin:'6px 2px 8px'}}>
                Gruppenphase · Runde {r}{cup.activeRound===r&&cup.phase==='gruppe'?' · AKTIV':''}
              </div>
              {cup.matches.filter(m=>m.phase==='gruppe'&&m.round===r).map(m=>(
                <CupMatchCard key={m.id} m={m} cup={cup} label={`R${r} · Court ${m.court}`}
                  onPatch={patchMatch} onPickSlot={setPick}/>
              ))}
            </div>
          ))}
          {['ko','hf','courage-hf','finals'].map(ph=>{
            const ms=cup.matches.filter(m=>m.phase===ph);
            const names={ko:'KO-Phase',hf:'DNA-Halbfinals','courage-hf':'Courage-Halbfinals',finals:'Finals'};
            return(
              <div key={ph}>
                <div style={{color:T.t3,fontSize:11,fontWeight:800,letterSpacing:1.3,
                  textTransform:'uppercase',margin:'14px 2px 8px'}}>{names[ph]}</div>
                {ms.length===0?(
                  <div style={{color:T.t3,fontSize:12,padding:'4px 2px 8px',lineHeight:1.5}}>
                    Noch nicht erzeugt — im Tab „Steuerung" generieren.
                  </div>
                ):ms.map(m=>(
                  <CupMatchCard key={m.id} m={m} cup={cup} label={matchLabel(m)}
                    onPatch={patchMatch} onPickSlot={setPick}/>
                ))}
              </div>
            );
          })}
        </div>)}

        {/* ── LEADERBOARD ── */}
        {tab==='leaderboard'&&(<div className="fi">
          <div style={{color:T.t3,fontSize:12,lineHeight:1.55,marginBottom:12}}>
            Punkte aus abgeschlossenen Gruppen-Matches + Korrektur. Die Platzierung steuert
            KO (Rang 3–14) und Courage (15–22). <span style={{color:T.gold}}>Gold = Freilos HF</span> ·{' '}
            <span style={{color:T.blue}}>Blau = Courage</span>.
          </div>
          {lb.map(row=>{
            const zone=row.rank<=2?'top':row.rank<=14?'mid':'courage';
            return(
              <div key={row.num} style={{display:'flex',alignItems:'center',gap:9,
                padding:'10px 12px',borderRadius:13,marginBottom:7,
                background:zone==='top'?`color-mix(in srgb, ${T.gold} 12%, transparent)`
                  :zone==='courage'?T.blueSoft:T.card,
                border:`1.5px solid ${zone==='top'?T.gold:zone==='courage'?T.blue:T.border}`}}>
                <span style={{width:26,color:zone==='top'?T.gold:zone==='courage'?T.blue:T.t2,
                  fontSize:14,fontWeight:900,flexShrink:0,textAlign:'center'}}>{row.rank}</span>
                <span style={{color:T.o,fontSize:12,fontWeight:900,flexShrink:0,width:32}}>P{row.num}</span>
                <span style={{flex:1,minWidth:0,color:T.t1,fontSize:14,fontWeight:600,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {(row.name||'').trim()||'—'}
                  <span style={{color:T.t3,fontSize:10.5,fontWeight:500}}>
                    {' '}· {row.played} Sp · {row.wins}S
                    {row.tierBonus>0&&<span style={{color:T.o,fontWeight:800}}> · +{row.tierBonus}★</span>}
                  </span>
                </span>
                <button onClick={()=>{buzz(6);setPlayerAt(cup.players.findIndex(p=>p.num===row.num),{adj:(row.adj||0)-1});}}
                  aria-label="Punkt abziehen"
                  style={{width:30,height:30,borderRadius:9,background:T.card2,cursor:'pointer',
                    border:`1px solid ${T.border}`,color:T.t2,fontSize:15,fontWeight:800,flexShrink:0}}>−</button>
                <span style={{width:52,textAlign:'center',flexShrink:0}}>
                  <span style={{display:'block',color:T.t1,fontSize:16,fontWeight:900,lineHeight:1}}>{row.total}</span>
                  {row.adj!==0&&(
                    <span style={{display:'block',color:row.adj>0?T.g:T.r,fontSize:9.5,fontWeight:800}}>
                      {row.adj>0?`+${row.adj}`:row.adj} Korr.
                    </span>
                  )}
                </span>
                <button onClick={()=>{buzz(6);setPlayerAt(cup.players.findIndex(p=>p.num===row.num),{adj:(row.adj||0)+1});}}
                  aria-label="Punkt hinzufügen"
                  style={{width:30,height:30,borderRadius:9,background:T.card2,cursor:'pointer',
                    border:`1px solid ${T.border}`,color:T.t2,fontSize:15,fontWeight:800,flexShrink:0}}>+</button>
              </div>
            );
          })}
        </div>)}
      </div>

      {/* Sheets */}
      {pick&&(
        <CupPickSheet cup={cup} current={pick.current}
          onPick={num=>patchMatch(pick.matchId,{[pick.side]:pick.idx===0
            ?[num,cup.matches.find(m=>m.id===pick.matchId)[pick.side][1]]
            :[cup.matches.find(m=>m.id===pick.matchId)[pick.side][0],num]})}
          onClose={()=>setPick(null)}/>
      )}
      {styleFor!=null&&(
        <StylePickerSheet
          current={cup.players[styleFor]?.style||null}
          onSelect={style=>setPlayerAt(styleFor,{style:style||null})}
          onClose={()=>setStyleFor(null)}/>
      )}
    </div>
  );
}

/* ── CENTER SCREEN — Diashow für den großen Screen/Beamer ─────────
   Drei Slides im automatischen Wechsel (12 s):
     1. Aktuelle Paarungen je Court + Phase (Gruppe: aktive Runde)
     2. Leaderboard (Zonen wie auf dem Plakat)
     3. Turnierbaum mit aktuellem Stand (DNA-Lane + Courage-Lane)
   Read-only. Admin-Warnmeldungen liegen als großes Toast-Overlay
   über jedem Slide. Schriftgrößen skalieren per clamp() mit der
   Viewport-Breite (Beamer/TV im Querformat). Läuft der Admin in
   einem anderen Tab desselben Geräts, synct der storage-Listener
   in DnaCupScreen jede Änderung live hierher. */
function CupCenterScreen({cup,lb,onBack}){
  const[slide,setSlide]=useState(0);
  const[paused,setPaused]=useState(false);
  // Ein Timeout PRO Slide (statt Dauer-Interval): jeder Wechsel — auch
  // ein manueller Tap — startet das 12-Sekunden-Fenster neu. Hinweis:
  // In versteckten Tabs drosselt Chrome Timer (~1 Tick/Min); auf dem
  // sichtbaren Beamer-Tab läuft die Rotation normal.
  useEffect(()=>{
    if(paused) return;
    const id=setTimeout(()=>setSlide(s=>(s+1)%3),12000);
    return()=>clearTimeout(id);
  },[paused,slide]);
  const phase=CUP_PHASES.find(p=>p.id===cup.phase);
  const nm=n=>cupPlayerLabel(cup,n,true);
  const findM=id=>cup.matches.find(m=>m.id===id);
  const photoOf=n=>cup.players.find(p=>p.num===n)?.photo||null;

  // Slide 1: Matches der aktiven Phase (Gruppe → nur aktive Runde).
  const cur=cup.phase==='gruppe'
    ?cup.matches.filter(m=>m.phase==='gruppe'&&m.round===cup.activeRound)
    :cup.phase==='ko'?cup.matches.filter(m=>m.phase==='ko')
    :cup.phase==='hf'?cup.matches.filter(m=>m.phase==='hf'||m.phase==='courage-hf')
    :cup.matches.filter(m=>m.phase==='finals');

  // Team-Zeile: beide Spieler als eigene Spalten mit vertikalem
  // Trennstrich dazwischen — stabile Mittelachse wie auf einer
  // Anzeigetafel, jeder Name kürzt unabhängig mit Ellipsis.
  const teamRow=(team,score,win,done)=>(
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',minWidth:0}}>
      <div style={{flex:1,minWidth:0,display:'flex',alignItems:'stretch',
        gap:'clamp(8px, .9vw, 14px)'}}>
        {team.map((n,i)=>(
          <Fragment key={i}>
            {i>0&&(
              <span aria-hidden="true" style={{width:2,alignSelf:'stretch',margin:'2px 0',
                borderRadius:1,background:T.o,opacity:.55,flexShrink:0}}/>
            )}
            <span style={{flex:'1 1 50%',minWidth:0,alignSelf:'center',display:'flex',
              alignItems:'center',gap:'clamp(6px, .7vw, 10px)'}}>
              {photoOf(n)&&(
                <img src={photoOf(n)} alt="" style={{width:'clamp(26px, 2.6vw, 40px)',
                  height:'clamp(26px, 2.6vw, 40px)',borderRadius:'50%',objectFit:'cover',
                  border:`1.5px solid ${T.o}`,flexShrink:0,
                  filter:done&&!win?'grayscale(1) opacity(.6)':'none'}}/>
              )}
              <span style={{minWidth:0,color:done&&!win?T.t3:T.t1,
                fontSize:'clamp(15px, 1.8vw, 26px)',fontWeight:win?900:600,letterSpacing:-.2,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {nm(n)}
              </span>
            </span>
          </Fragment>
        ))}
      </div>
      {/* Trennbalken Namen ↔ Punkte — gleiche Optik wie der
          Spieler-Trenner, damit die Punktespalte klar absetzt. */}
      <span aria-hidden="true" style={{width:2,alignSelf:'stretch',margin:'2px 0',
        borderRadius:1,background:T.o,opacity:.55,flexShrink:0}}/>
      <span style={{color:win?T.o:T.t2,fontSize:'clamp(18px, 2.2vw, 32px)',fontWeight:900,
        fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',flexShrink:0}}>
        {score??'–'}
      </span>
    </div>
  );
  const matchBlock=m=>{
    const w1=m.done&&(m.s1??0)>=(m.s2??0), w2=m.done&&(m.s2??0)>(m.s1??0);
    const styleOf=n=>cup.players.find(p=>p.num===n)?.style;
    const tier=cupMatchTier(cup.players,m);
    return(
      <div key={m.id} style={{marginBottom:14,minWidth:0}}>
        {/* Match-Box: orangene Outline + dezente Ball-Grafik als Deko */}
        <div style={{position:'relative',overflow:'hidden',background:T.card,
          border:`2px solid ${T.o}`,borderRadius:18,
          padding:'clamp(12px, 1.4vw, 20px) clamp(16px, 1.8vw, 26px)',
          boxShadow:m.done?`0 0 14px ${T.oGlow}, 0 6px 18px rgba(0,0,0,.3)`:'0 4px 14px rgba(0,0,0,.2)'}}>
          <div aria-hidden="true" style={{position:'absolute',right:-16,top:-16,
            opacity:.09,pointerEvents:'none'}}>
            <TennisBallIcon size={78}/>
          </div>
          {m.title&&(
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
              <TrophyIcon size={15}/>
              <span style={{color:T.o,fontSize:'clamp(11px, 1.1vw, 15px)',fontWeight:800,
                letterSpacing:1,textTransform:'uppercase'}}>{m.title}</span>
            </div>
          )}
          {teamRow(m.t1,m.s1,w1,m.done)}
          {/* VS-Trenner mit pulsierendem Badge statt nackter Linie */}
          <div style={{display:'flex',alignItems:'center',gap:10,margin:'2px 0'}}>
            <div style={{flex:1,height:1,background:T.sep}}/>
            <span className="court-vs" style={{width:'clamp(22px, 2.2vw, 32px)',
              height:'clamp(22px, 2.2vw, 32px)',borderRadius:'50%',flexShrink:0,
              background:T.oSoft,border:`1.5px solid ${T.o}`,color:T.o,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:'clamp(9px, .9vw, 12px)',fontWeight:900}}>VS</span>
            <div style={{flex:1,height:1,background:T.sep}}/>
          </div>
          {teamRow(m.t2,m.s2,w2,m.done)}
        </div>
        {/* Tier-Toast: Spielstile der 4 + Extra-Punkte bei Sieg —
            gut sichtbar in der Tier-Farbe unter der Box. */}
        {tier?(
          <div className="si" style={{display:'flex',alignItems:'center',gap:10,marginTop:8,
            background:tier.color,borderRadius:13,padding:'9px 14px',minWidth:0,
            boxShadow:'0 6px 16px rgba(0,0,0,.3)'}}>
            <span style={{display:'inline-flex',gap:5,alignItems:'center',flexShrink:0}}>
              {[...m.t1,...m.t2].map((n,i)=>(
                <span key={i} style={{display:'inline-flex'}}>
                  <ArchetypeGlyph type={styleOf(n)} active color="#FFFFFF"
                    size={Math.round(15)}/>
                </span>
              ))}
            </span>
            <span style={{color:'#FFF',fontSize:'clamp(11px, 1.2vw, 17px)',fontWeight:900,
              letterSpacing:.4,flexShrink:0}}>{tier.label}</span>
            <span style={{flex:1,minWidth:0,textAlign:'right',color:'#FFF',
              fontSize:'clamp(11px, 1.25vw, 17px)',fontWeight:800,overflow:'hidden',
              textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              Sieg = +{tier.stars} Extra-Punkte
            </span>
          </div>
        ):(
          <div style={{marginTop:8,padding:'7px 12px',borderRadius:11,opacity:.75,
            border:`1.5px dashed ${T.border}`,color:T.t4,textAlign:'center',
            fontSize:'clamp(10px, 1vw, 14px)',fontWeight:600}}>
            Spielstile im Admin setzen → Tier & Extra-Punkte
          </div>
        )}
      </div>
    );
  };

  // Turnierbaum erst „ziehen", wenn die Gruppenphase KOMPLETT ist —
  // vorher zeigt Slide 3 ausschließlich Platzhalter, auch wenn im
  // Admin schon (Test-)Paarungen existieren sollten.
  const gruppeMs=cup.matches.filter(m=>m.phase==='gruppe');
  const gruppeFertig=gruppeMs.length>0&&gruppeMs.every(m=>m.done);

  // Slide 3: Turnierbaum-Knoten — echtes Match oder Platzhalter.
  const Node=({id,title,hint,accent=T.o})=>{
    const m=gruppeFertig?findM(id):null;
    if(!m) return(
      <div style={{border:`1.5px dashed ${T.border}`,borderRadius:16,padding:'13px 16px',
        background:T.card}}>
        <div style={{color:T.t3,fontSize:'clamp(12px, 1.2vw, 17px)',fontWeight:800,
          letterSpacing:.8,textTransform:'uppercase'}}>{title}</div>
        <div style={{color:T.t4,fontSize:'clamp(13px, 1.35vw, 19px)',marginTop:5}}>{hint}</div>
      </div>
    );
    const w1=m.done&&(m.s1??0)>=(m.s2??0), w2=m.done&&(m.s2??0)>(m.s1??0);
    const row=(team,score,win)=>(
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',minWidth:0}}>
        <span style={{flex:1,minWidth:0,color:m.done&&!win?T.t3:T.t1,
          fontSize:'clamp(13px, 1.55vw, 22px)',fontWeight:win?900:600,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {team.map(nm).join(' & ')}
        </span>
        <span style={{color:win?accent:T.t3,fontSize:'clamp(13px, 1.55vw, 22px)',fontWeight:900,
          fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',flexShrink:0}}>{score??'–'}</span>
      </div>
    );
    return(
      <div style={{background:T.card,border:`1.5px solid ${m.done?accent:T.border}`,
        borderRadius:16,padding:'12px 16px'}}>
        <div style={{color:m.done?accent:T.t3,fontSize:'clamp(11px, 1.15vw, 16px)',fontWeight:800,
          letterSpacing:.8,textTransform:'uppercase',marginBottom:4}}>{title}</div>
        {row(m.t1,m.s1,w1)}
        {row(m.t2,m.s2,w2)}
      </div>
    );
  };
  /* Bracket-Bausteine (Slide 3): gestrichelte Verbindungslinien wie
     auf dem Event-Plakat. Alle Positionen sind Spalten-Prozente der
     jeweiligen Zeile — deterministisch, kein Messen nötig.
     V = vertikaler Stub (obere/untere Hälfte), H = Sammellinie. */
  const V=({x,c,bottom=false})=>(
    <div aria-hidden="true" style={{position:'absolute',left:`calc(${x}% - 1.5px)`,
      top:bottom?'50%':0,height:'50%',borderLeft:`3px dashed ${c}`}}/>
  );
  const H=({x1,x2,c})=>(
    <div aria-hidden="true" style={{position:'absolute',left:`${x1}%`,width:`${x2-x1}%`,
      top:'calc(50% - 1.5px)',borderTop:`3px dashed ${c}`}}/>
  );
  const Conn=({h=34,children})=>(
    <div style={{position:'relative',height:h,flexShrink:0}}>{children}</div>
  );
  const bracketCap=(t,c=T.o)=>(
    <div style={{color:c,fontSize:'clamp(12px, 1.25vw, 18px)',fontWeight:900,
      letterSpacing:1.4,textTransform:'uppercase',textAlign:'center',margin:'0 0 8px'}}>{t}</div>
  );

  const SLIDE_TITLES=['Aktuelle Paarungen','Leaderboard','Turnierbaum'];

  return(
    <div className="fi" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0,
      padding:'0 28px',position:'relative'}}>

      {/* Kopf: Wordmark + Phase + Slide-Titel */}
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12,flexWrap:'wrap'}}>
        <div style={{color:T.t1,fontSize:'clamp(20px, 2.6vw, 40px)',fontWeight:900,
          letterSpacing:-.6,flexShrink:0}}>
          RITMO <span style={{color:T.o}}>DNA CUP</span>
        </div>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 14px',
          borderRadius:999,background:T.oSoft,border:`1px solid ${T.o}`,flexShrink:0}}>
          <span className="court-live-dot" style={{width:8,height:8,borderRadius:'50%',background:T.o}}/>
          <span style={{color:T.o,fontSize:'clamp(12px, 1.3vw, 18px)',fontWeight:800}}>
            {phase?.name}{cup.phase==='gruppe'?` · Runde ${cup.activeRound}/6`:''}
          </span>
        </div>
        {/* Warnmeldung — mittig zwischen Phase-Pill und Slide-Titel,
            gleicher Gelb-Look wie am Court-Screen. */}
        <div style={{flex:1,minWidth:0,display:'flex',justifyContent:'center'}}>
          {cup.alert&&<CupAlertToast alert={cup.alert} big solid/>}
        </div>
        <div style={{color:T.t2,fontSize:'clamp(16px, 1.9vw, 28px)',fontWeight:800,flexShrink:0}}>
          {SLIDE_TITLES[slide]}
        </div>
      </div>

      {/* Slides — key remountet → Fade pro Wechsel */}
      <div key={slide} className="fi" style={{flex:1,minHeight:0,overflowY:'auto',
        WebkitOverflowScrolling:'touch',paddingBottom:8}}>

        {slide===0&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:16,
            alignItems:'start'}}>
            {[1,2,3].map(c=>{
              const ms=cur.filter(m=>m.court===c);
              return(
                <div key={c} style={{minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <TennisBallIcon size={18}/>
                    <span style={{color:T.o,fontSize:'clamp(15px, 1.8vw, 26px)',fontWeight:900,
                      letterSpacing:.5}}>COURT {c}</span>
                    {cup.locks[c]&&<LockIcon size={16} color={T.t3}/>}
                  </div>
                  {ms.length===0?(
                    <div style={{border:`1.5px dashed ${T.border}`,borderRadius:17,
                      padding:'18px 16px',color:T.t4,fontSize:'clamp(12px, 1.3vw, 18px)',
                      fontWeight:600,textAlign:'center'}}>
                      Kein Match
                    </div>
                  ):ms.map(matchBlock)}
                  {/* Upcoming: nächstes Match auf DIESEM Court — Spieler
                      können sich vorbereiten (nur Gruppenphase, fester
                      Spielplan). */}
                  {cup.phase==='gruppe'&&(()=>{
                    const nxt=cup.matches.find(x=>x.phase==='gruppe'
                      &&x.round===cup.activeRound+1&&x.court===c);
                    if(!nxt) return null;
                    return(<>
                      <div style={{color:T.t3,fontSize:'clamp(10px, 1vw, 14px)',fontWeight:800,
                        letterSpacing:1.2,textTransform:'uppercase',margin:'6px 2px 7px'}}>
                        Upcoming · Runde {cup.activeRound+1}
                      </div>
                      <div style={{border:`1.5px dashed ${T.border}`,borderRadius:15,
                        padding:'10px 14px',opacity:.9}}>
                        <div style={{color:T.t2,fontSize:'clamp(13px, 1.5vw, 20px)',fontWeight:600,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {nxt.t1.map(nm).join('  &  ')}
                        </div>
                        <div style={{color:T.t4,fontSize:'clamp(10px, 1vw, 13px)',fontWeight:800,
                          margin:'3px 0'}}>vs</div>
                        <div style={{color:T.t2,fontSize:'clamp(13px, 1.5vw, 20px)',fontWeight:600,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {nxt.t2.map(nm).join('  &  ')}
                        </div>
                      </div>
                    </>);
                  })()}
                </div>
              );
            })}
          </div>
        )}

        {slide===1&&(()=>{
          // Spaltenweise statt zeilenweise: links #1–11 von oben nach
          // unten, rechts #12–22 — intuitive Lesereihenfolge.
          const half=Math.ceil(lb.length/2);
          const lbRow=row=>{
            const zone=row.rank<=2?'top':row.rank<=14?'mid':'courage';
            const zc=zone==='top'?T.gold:zone==='courage'?T.blue:null;
            return(
              <div key={row.num} style={{display:'flex',alignItems:'center',gap:10,
                padding:'7px 14px',borderRadius:12,marginBottom:6,minWidth:0,
                background:zone==='top'?`color-mix(in srgb, ${T.gold} 12%, transparent)`
                  :zone==='courage'?T.blueSoft:'transparent',
                border:`1px solid ${zc||T.sep}`}}>
                <span style={{width:'clamp(32px, 3vw, 50px)',textAlign:'right',flexShrink:0,
                  color:zc||T.t2,fontSize:'clamp(13px, 1.5vw, 22px)',fontWeight:900}}>
                  #{row.rank}
                </span>
                {/* Trennstrich zwischen Platzierung und Spielernummer */}
                <span aria-hidden="true" style={{width:2,alignSelf:'stretch',margin:'3px 0',
                  borderRadius:1,background:T.o,opacity:.5,flexShrink:0}}/>
                <span style={{color:T.o,fontSize:'clamp(11px, 1.2vw, 17px)',fontWeight:900,
                  flexShrink:0,width:'clamp(26px, 2.6vw, 40px)'}}>P{row.num}</span>
                <span style={{flex:1,minWidth:0,color:T.t1,fontSize:'clamp(13px, 1.5vw, 22px)',
                  fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {(row.name||'').trim()||'—'}
                </span>
                <span style={{color:T.t1,fontSize:'clamp(14px, 1.6vw, 24px)',fontWeight:900,
                  fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',flexShrink:0}}>
                  {row.total}
                </span>
              </div>
            );
          };
          return(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 26px',
              alignItems:'start'}}>
              <div style={{minWidth:0}}>{lb.slice(0,half).map(lbRow)}</div>
              <div style={{minWidth:0}}>{lb.slice(half).map(lbRow)}</div>
            </div>
          );
        })()}

        {slide===2&&(<>
          {!gruppeFertig&&(
            <div style={{marginBottom:14,padding:'12px 18px',borderRadius:13,
              background:T.oSoft,border:`1px solid ${T.o}`,display:'flex',
              alignItems:'center',gap:10}}>
              <StopwatchIcon size={18} color={T.o}/>
              <span style={{color:T.t1,fontSize:'clamp(12px, 1.3vw, 18px)',fontWeight:700}}>
                Der Turnierbaum wird nach der Gruppenphase gezogen —{' '}
                {gruppeMs.filter(m=>m.done).length}/{gruppeMs.length} Matches gespielt.
              </span>
            </div>
          )}
          {/* Echter Turnierbaum wie auf dem Plakat: DNA-Ast (orange,
              links) und Courage-Ast (blau, rechts), verbunden mit
              gestrichelten Linien von oben nach unten. Spalten-
              Geometrie DNA: Zeile 1 = '1fr 3fr' → Seeds-Chip bei
              12.5%, KOs bei 37.5/62.5/87.5 · Zeile 2/3 = '1fr 1fr'
              → Zentren bei 25/75. */}
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'0 34px',
            alignItems:'start'}}>

            {/* ── DNA-Ast ── */}
            <div style={{minWidth:0,display:'flex',flexDirection:'column'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 3fr',gap:0,alignItems:'stretch'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',gap:6,padding:'0 10px'}}>
                  <div style={{padding:'10px 16px',borderRadius:14,background:T.oSoft,
                    border:`2px solid ${T.o}`,textAlign:'center'}}>
                    <div style={{color:T.o,fontSize:'clamp(16px, 1.8vw, 26px)',fontWeight:900,
                      letterSpacing:-.3}}>#1 & #2</div>
                    <div style={{color:T.t3,fontSize:'clamp(10px, 1vw, 14px)',fontWeight:700,
                      marginTop:2}}>direkt ins HF</div>
                  </div>
                </div>
                <div style={{border:`3px dashed ${T.o}`,borderRadius:19,padding:'12px 14px'}}>
                  {bracketCap('KO-Phase · Rang 3–14')}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:12}}>
                    <Node id="ko1" title="KO 1 · Court 1" hint="3+14 vs 4+13"/>
                    <Node id="ko2" title="KO 2 · Court 2" hint="5+12 vs 6+11"/>
                    <Node id="ko3" title="KO 3 · Court 3" hint="7+10 vs 8+9"/>
                  </div>
                </div>
              </div>
              <Conn h={40}>
                <V x={12.5} c={T.o}/><V x={37.5} c={T.o}/><V x={62.5} c={T.o}/><V x={87.5} c={T.o}/>
                <H x1={12.5} x2={87.5} c={T.o}/>
                <V x={25} c={T.o} bottom/><V x={75} c={T.o} bottom/>
              </Conn>
              {bracketCap('Halbfinals · Best of 3')}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <Node id="hf1" title="DNA-HF 1 · Court 1" hint="#1 + Sieger-Split A"/>
                <Node id="hf2" title="DNA-HF 2 · Court 2" hint="#2 + Sieger-Split B"/>
              </div>
              <Conn h={40}>
                <V x={25} c={T.o}/><V x={75} c={T.o}/>
                <H x1={25} x2={75} c={T.o}/>
                <V x={25} c={T.o} bottom/><V x={75} c={T.o} bottom/>
              </Conn>
              {bracketCap('Finals · Best of 3')}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <Node id="final" title="🏆 Grande Finale · Court 1" hint="Sieger HF1 vs Sieger HF2"/>
                <Node id="platz3" title="Spiel um Platz 3 · Court 2" hint="Verlierer der Halbfinals"/>
              </div>
            </div>

            {/* ── Courage-Ast (blau) ── */}
            <div style={{minWidth:0,display:'flex',flexDirection:'column'}}>
              <div style={{display:'flex',justifyContent:'center'}}>
                <div style={{padding:'10px 20px',borderRadius:14,background:T.blueSoft,
                  border:`2px solid ${T.blue}`,textAlign:'center'}}>
                  <div style={{color:T.blue,fontSize:'clamp(16px, 1.8vw, 26px)',fontWeight:900,
                    letterSpacing:-.3}}>COURAGE 8</div>
                  <div style={{color:T.t3,fontSize:'clamp(10px, 1vw, 14px)',fontWeight:700,
                    marginTop:2}}>Plätze 15–22 aus der Gruppenphase</div>
                </div>
              </div>
              <Conn h={32}>
                <V x={50} c={T.blue}/><V x={50} c={T.blue} bottom/>
                <H x1={25} x2={75} c={T.blue}/>
                <V x={25} c={T.blue} bottom/><V x={75} c={T.blue} bottom/>
              </Conn>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <Node id="chf1" title="Courage-HF 1" hint="15+22 vs 16+21" accent={T.blue}/>
                <Node id="chf2" title="Courage-HF 2" hint="17+20 vs 18+19" accent={T.blue}/>
              </div>
              <Conn h={40}>
                <V x={25} c={T.blue}/><V x={75} c={T.blue}/>
                <H x1={25} x2={75} c={T.blue}/>
                <V x={50} c={T.blue} bottom/>
              </Conn>
              {bracketCap('Courage-Finale · Best of 3',T.blue)}
              <div style={{display:'flex',justifyContent:'center'}}>
                <div style={{width:'86%'}}>
                  <Node id="cfinal" title="Ehren-Finale · Court 3" hint="Sieger der Courage-HF"
                    accent={T.blue}/>
                </div>
              </div>
            </div>
          </div>
        </>)}
      </div>

      {/* Fußleiste: Dots + Steuerung (dezent, für den Kiosk-Betrieb) */}
      <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:12,
        padding:'10px 0 calc(env(safe-area-inset-bottom,0px) + 14px)'}}>
        {/* Operator-Steuerung: 44px-Touch-Ziele (HIG), bewusst dunkel
            gehalten — auf dem Beamer soll nur der Inhalt leuchten. */}
        <button onClick={onBack} style={{padding:'12px 18px',borderRadius:13,background:T.card,
          border:`1px solid ${T.border}`,color:T.t3,fontSize:13.5,fontWeight:700,cursor:'pointer'}}>
          ‹ Auswahl
        </button>
        <span style={{flex:1}}/>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          {[0,1,2].map(i=>(
            <button key={i} onClick={()=>{buzz(6);setSlide(i);}} aria-label={`Slide ${i+1}`}
              style={{width:i===slide?30:12,height:12,borderRadius:999,border:'none',
                cursor:'pointer',background:i===slide?T.o:T.t4,transition:'width .25s, background .25s',
                padding:0}}/>
          ))}
        </div>
        <span style={{flex:1}}/>
        {/* Runden-Timer — unten in der Fußleiste */}
        <CupTimer timer={cup.timer} big/>
        <button onClick={()=>setSlide(s=>(s+2)%3)} aria-label="Vorheriger Slide"
          style={{width:44,height:44,borderRadius:13,background:T.card,border:`1px solid ${T.border}`,
            color:T.t2,fontSize:17,fontWeight:800,cursor:'pointer'}}>‹</button>
        <button onClick={()=>setPaused(p=>!p)} aria-label={paused?'Diashow fortsetzen':'Diashow pausieren'}
          style={{width:44,height:44,borderRadius:13,background:paused?T.oSoft:T.card,
            border:`1px solid ${paused?T.o:T.border}`,color:paused?T.o:T.t2,
            fontSize:15,fontWeight:900,cursor:'pointer'}}>
          {paused?'▶':'⏸'}
        </button>
        <button onClick={()=>setSlide(s=>(s+1)%3)} aria-label="Nächster Slide"
          style={{width:44,height:44,borderRadius:13,background:T.card,border:`1px solid ${T.border}`,
            color:T.t2,fontSize:17,fontWeight:800,cursor:'pointer'}}>›</button>
      </div>
    </div>
  );
}

/* ── COURT SCREEN — Tablet am Court ───────────────────────────────
   Zeigt die Paarung(en) des gewählten Courts in der aktiven Phase
   und nimmt die Punkte entgegen (±1-Schritte, wie die Zählweise des
   Cups) + "Match abschließen". Oben rechts der COURT-KREIS: ein Tap
   schaltet 1 → 2 → 3 durch; die Wahl wird pro Gerät gemerkt, damit
   jedes Tablet nach einem Reload auf seinem Court bleibt.
   Respektiert die Admin-Sperre (cup.locks) und zeigt Warnmeldung
   (Toast) + Runden-Timer. */
function CupCourtScreen({cup,setCup,onBack}){
  const[court,setCourt]=useState(()=>{
    const c=lsGet('ritmo_dnacup_court',1);
    return c===2||c===3?c:1;
  });
  useEffect(()=>{lsSet('ritmo_dnacup_court',court);},[court]);
  const[exitAsk,setExitAsk]=useState(false); // Kiosk: Exit nur per PIN
  const[courtAsk,setCourtAsk]=useState(false);  // Court-Wechsel: erst PIN …
  const[courtPick,setCourtPick]=useState(false);// … dann Court-Auswahl
  const[lbShow,setLbShow]=useState(false);      // Leaderboard-Overlay (nur ansehen)
  const lbRows=useMemo(()=>cupLeaderboard(cup),[cup]);
  const locked=!!cup.locks[court];
  const phase=CUP_PHASES.find(p=>p.id===cup.phase);
  const nm=n=>cupPlayerLabel(cup,n,true);
  const photoOf=n=>cup.players.find(p=>p.num===n)?.photo||null;
  const cur=(cup.phase==='gruppe'
    ?cup.matches.filter(m=>m.phase==='gruppe'&&m.round===cup.activeRound)
    :cup.phase==='ko'?cup.matches.filter(m=>m.phase==='ko')
    :cup.phase==='hf'?cup.matches.filter(m=>m.phase==='hf'||m.phase==='courage-hf')
    :cup.matches.filter(m=>m.phase==='finals')).filter(m=>m.court===court);
  const patchMatch=(id,partial)=>setCup(c=>({...c,
    matches:c.matches.map(m=>m.id===id?{...m,...partial}:m)}));
  const bump=(m,f,d)=>{
    if(locked||m.done) return;
    buzz(10);
    patchMatch(m.id,{[f]:Math.max(0,(m[f]??0)+d)});
  };

  // Punkte-Panel einer Seite: Namen + große Zahl + ±1.
  // Touch-Ziele nach HIG: +1 ist die Primäraktion (größte Fläche),
  // −1 sekundär aber ≥44px hoch — Fehltipps am Court sind teuer.
  const side=(m,f,team)=>(
    <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',
      alignItems:'center',gap:'clamp(8px, 1.4vw, 14px)'}}>
      <div style={{minWidth:0,width:'100%'}}>
        {team.map(n=>(
          <div key={n} style={{display:'flex',alignItems:'center',justifyContent:'center',
            gap:10,minWidth:0,padding:'2px 0'}}>
            {photoOf(n)&&(
              <img src={photoOf(n)} alt="" style={{width:'clamp(30px, 4vw, 42px)',
                height:'clamp(30px, 4vw, 42px)',borderRadius:'50%',
                objectFit:'cover',border:`1.5px solid ${T.o}`,flexShrink:0}}/>
            )}
            <span style={{minWidth:0,color:T.t1,fontSize:'clamp(15px, 2.6vw, 24px)',fontWeight:700,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {nm(n)}
            </span>
          </div>
        ))}
      </div>
      <div style={{color:m.done?T.o:T.t1,fontWeight:900,lineHeight:1,
        fontSize:'clamp(54px, 11vw, 110px)',
        fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',
        fontVariantNumeric:'tabular-nums'}}>
        {m[f]??0}
      </div>
      <button onClick={()=>bump(m,f,1)} disabled={locked||m.done}
        aria-label="Punkt hinzufügen"
        style={{width:'100%',maxWidth:210,height:'clamp(58px, 9vw, 76px)',borderRadius:18,
          cursor:'pointer',background:locked||m.done?T.card2:T.o,border:'none',
          color:locked||m.done?T.t3:'#000',fontSize:'clamp(24px, 3.4vw, 32px)',fontWeight:900}}>
        +1
      </button>
      <button onClick={()=>bump(m,f,-1)} disabled={locked||m.done}
        aria-label="Punkt abziehen"
        style={{width:'100%',maxWidth:210,height:46,borderRadius:13,cursor:'pointer',
          background:'none',border:`1.5px solid ${T.border}`,
          color:locked||m.done?T.t4:T.t2,fontSize:'clamp(15px, 2vw, 18px)',fontWeight:800}}>
        −1
      </button>
    </div>
  );

  return(
    <div className="fi" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0,
      padding:'0 22px'}}>

      {/* Kopf: Court-Titel + Phase-Pill in EINER Zeile links · großes
          Warn-Toast mittig · COURT-KREIS oben rechts */}
      <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:10,flexShrink:0}}>
        {/* Titelblock schrumpft NICHT — die Pill bleibt neben der
            Court-Zahl; das Toast rechts nimmt den Restplatz und kürzt
            notfalls intern mit Ellipsis. */}
        <div style={{flex:'0 0 auto',maxWidth:'82%',minWidth:0}}>
          <div style={{color:T.o,fontSize:'clamp(12px, 1.4vw, 16px)',fontWeight:800,
            letterSpacing:2,textTransform:'uppercase'}}>RITMO DNA CUP</div>
          <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',
            margin:'4px 0 2px'}}>
            <span style={{color:T.t1,fontSize:'clamp(38px, 6vw, 60px)',fontWeight:900,
              letterSpacing:-1,lineHeight:1}}>COURT {court}</span>
            {locked&&<LockIcon size={26} color={T.r}/>}
            <span style={{display:'inline-flex',alignItems:'center',gap:10,padding:'6px 15px',
              borderRadius:999,background:T.oSoft,border:`1px solid ${T.o}`}}>
              <span className="court-live-dot" style={{width:10,height:10,borderRadius:'50%',background:T.o}}/>
              <span style={{color:T.o,fontSize:'clamp(17px, 3.2vw, 26px)',fontWeight:800,
                whiteSpace:'nowrap'}}>
                {phase?.name}{cup.phase==='gruppe'?` · Runde ${cup.activeRound}/6`:''}
              </span>
            </span>
          </div>
        </div>
        {/* Warnmeldung vom Admin — groß & gelb im Kopf, vom Court
            lesbar; der COURT-KREIS sitzt unten rechts in der
            Fußleiste, damit das Toast die volle Breite bekommt. */}
        <div style={{flex:1,minWidth:0,display:'flex',justifyContent:'flex-end'}}>
          {cup.alert&&<CupAlertToast alert={cup.alert} big solid/>}
        </div>
      </div>

      {/* Sperr-Hinweis */}
      {locked&&(
        <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:12,marginBottom:10,
          padding:'14px 18px',borderRadius:15,background:'rgba(232,69,69,0.08)',
          border:'1px solid rgba(232,69,69,0.4)'}}>
          <LockIcon size={24} color={T.r}/>
          <span style={{color:T.r,fontSize:'clamp(17px, 3.2vw, 26px)',fontWeight:700}}>
            Court gesperrt — Punkteeingabe ist gerade deaktiviert.
          </span>
        </div>
      )}

      <div style={{flex:1,minHeight:0,overflowY:'auto',WebkitOverflowScrolling:'touch',
        paddingBottom:10}}>
        {cur.length===0?(
          <div style={{border:`1.5px dashed ${T.border}`,borderRadius:19,padding:'34px 20px',
            color:T.t4,fontSize:15,fontWeight:600,textAlign:'center',marginTop:10}}>
            Kein Match auf diesem Court in der aktuellen Phase.
          </div>
        ):cur.map(m=>(
          <div key={m.id} style={{position:'relative',overflow:'hidden',background:T.card,
            border:`2px solid ${T.o}`,borderRadius:22,
            padding:'clamp(16px, 2.4vw, 26px) clamp(18px, 3vw, 32px)',marginBottom:16,
            boxShadow:m.done?`0 0 14px ${T.oGlow}`:'0 4px 14px rgba(0,0,0,.2)'}}>
            <div aria-hidden="true" style={{position:'absolute',right:-16,top:-16,
              opacity:.08,pointerEvents:'none'}}>
              <TennisBallIcon size={80}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <span style={{color:T.o,fontSize:'clamp(12px, 1.5vw, 16px)',fontWeight:800,
                letterSpacing:1,textTransform:'uppercase'}}>
                {m.title||(m.phase==='gruppe'?`Runde ${m.round}`
                  :m.phase==='ko'?'KO-Phase'
                  :m.phase==='courage-hf'?'Courage-Halbfinale':'DNA-Halbfinale')}
              </span>
              {m.bo3&&(
                <span style={{padding:'3px 10px',borderRadius:999,background:T.card2,
                  border:`1px solid ${T.border}`,color:T.t2,
                  fontSize:'clamp(10px, 1.2vw, 13px)',fontWeight:800,
                  letterSpacing:.5}}>BEST OF 3</span>
              )}
              <span style={{flex:1}}/>
              {m.done&&(
                <span style={{color:T.o,fontSize:'clamp(12px, 1.4vw, 15px)',fontWeight:900,
                  letterSpacing:.5}}>
                  GESPEICHERT ✓
                </span>
              )}
            </div>
            <div style={{display:'flex',alignItems:'stretch',gap:'clamp(10px, 3vw, 26px)'}}>
              {side(m,'s1',m.t1)}
              <div style={{alignSelf:'center',flexShrink:0}}>
                <span className="court-vs" style={{width:'clamp(38px, 5.5vw, 50px)',
                  height:'clamp(38px, 5.5vw, 50px)',borderRadius:'50%',
                  background:T.oSoft,border:`1.5px solid ${T.o}`,color:T.o,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:'clamp(12px, 1.6vw, 15px)',fontWeight:900}}>VS</span>
              </div>
              {side(m,'s2',m.t2)}
            </div>
            <button
              onClick={()=>{if(locked)return;buzz(m.done?8:18);patchMatch(m.id,{done:!m.done});}}
              disabled={locked}
              style={{width:'100%',marginTop:18,padding:'16px',borderRadius:16,
                cursor:locked?'not-allowed':'pointer',
                background:m.done?T.card2:T.g,border:m.done?`1.5px solid ${T.border}`:'none',
                color:m.done?T.t2:T.t1,fontSize:'clamp(15px, 2.2vw, 19px)',fontWeight:800}}>
              {m.done?'Korrigieren (erneut öffnen)':'Match abschließen ✓'}
            </button>
          </div>
        ))}

        {/* Upcoming auf diesem Court (nur Gruppenphase) */}
        {cup.phase==='gruppe'&&(()=>{
          const nxt=cup.matches.find(x=>x.phase==='gruppe'
            &&x.round===cup.activeRound+1&&x.court===court);
          if(!nxt) return null;
          // Quer-Layout: Team links · VS-Badge mittig · Team rechts;
          // pro Spieler steht die P-Nummer klein ÜBER dem Vornamen.
          const upPlayer=n=>{
            const p=cup.players.find(x=>x.num===n);
            const first=(p?.name||'').trim().split(/\s+/)[0]||'—';
            return(
              <div key={n} style={{flex:1,minWidth:0,textAlign:'center'}}>
                <div style={{color:T.o,fontSize:'clamp(12px, 2vw, 16px)',fontWeight:900,
                  letterSpacing:.5}}>P{n}</div>
                <div style={{color:T.t1,fontSize:'clamp(17px, 3.2vw, 26px)',fontWeight:700,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{first}</div>
              </div>
            );
          };
          const upTeam=team=>(
            <div style={{flex:1,minWidth:0,display:'flex',alignItems:'center',gap:10}}>
              {team.map(upPlayer)}
            </div>
          );
          return(<>
            <div style={{color:T.t2,fontSize:14,fontWeight:800,letterSpacing:1.2,
              textTransform:'uppercase',margin:'8px 2px 8px'}}>
              Upcoming · Runde {cup.activeRound+1}
            </div>
            <div style={{border:`1.5px dashed ${T.border}`,borderRadius:17,
              padding:'16px 18px',display:'flex',alignItems:'center',
              gap:'clamp(10px, 2.5vw, 22px)'}}>
              {upTeam(nxt.t1)}
              <span className="court-vs" style={{width:'clamp(34px, 5vw, 44px)',
                height:'clamp(34px, 5vw, 44px)',borderRadius:'50%',flexShrink:0,
                background:T.oSoft,border:`1.5px solid ${T.o}`,color:T.o,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:'clamp(11px, 1.6vw, 14px)',fontWeight:900}}>VS</span>
              {upTeam(nxt.t2)}
            </div>
          </>);
        })()}
      </div>

      {/* Fußleiste: Zurück + Runden-Timer */}
      <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:12,
        padding:'10px 0 calc(env(safe-area-inset-bottom,0px) + 14px)'}}>
        {/* Utility-Buttons: ≥44px Touch-Ziel (HIG), gedeckt — die
            Bühne gehört dem Match, nicht der Navigation. */}
        <button
          onClick={()=>{buzz(8);setExitAsk(true);}}
          style={{padding:'12px 18px',borderRadius:13,background:T.card,
            border:`1px solid ${T.border}`,color:T.t3,fontSize:13.5,fontWeight:700,cursor:'pointer'}}>
          ‹ Auswahl 🔒
        </button>
        <button
          onClick={()=>{buzz(8);setLbShow(true);}}
          style={{padding:'12px 18px',borderRadius:13,background:T.card,
            border:`1px solid ${T.border}`,color:T.t2,fontSize:13.5,fontWeight:700,cursor:'pointer'}}>
          Leaderboard
        </button>
        <span style={{flex:1}}/>
        <CupTimer timer={cup.timer}/>
        {/* Kiosk: Court-Wechsel nur per PIN — unten rechts im Eck,
            damit das Warn-Toast im Kopf die volle Breite bekommt. */}
        <button onClick={()=>{buzz(8);setCourtAsk(true);}}
          aria-label="Court wechseln (PIN nötig)" title="Court wechseln (PIN nötig)"
          style={{width:60,height:60,borderRadius:'50%',flexShrink:0,cursor:'pointer',
            background:T.oSoft,border:`2.5px solid ${T.o}`,color:T.o,
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            lineHeight:1,boxShadow:`0 0 14px color-mix(in srgb, ${T.o} 35%, transparent)`}}>
          <span style={{fontSize:24,fontWeight:900}}>{court}</span>
          <span style={{fontSize:7.5,fontWeight:800,letterSpacing:1,marginTop:2}}>COURT</span>
        </button>
      </div>

      {/* Kiosk: die Court-Ansicht verlässt man IMMER nur per PIN —
          Tablets bleiben bei den Spielern in der Ansicht. */}
      {exitAsk&&(
        <CupPinPad title="Court verlassen"
          sub="PIN eingeben, um zur Auswahl zurückzukehren."
          onOk={()=>{setExitAsk(false);onBack();}} onCancel={()=>setExitAsk(false)}/>
      )}
      {/* Court-Wechsel: erst PIN, dann Auswahl 1/2/3. */}
      {courtAsk&&(
        <CupPinPad title="Court wechseln"
          sub="PIN eingeben, um diesem Tablet einen anderen Court zuzuweisen."
          onOk={()=>{setCourtAsk(false);setCourtPick(true);}} onCancel={()=>setCourtAsk(false)}/>
      )}
      {courtPick&&(
        <div onClick={()=>setCourtPick(false)} className="fi"
          style={{position:'fixed',inset:0,zIndex:350,background:'rgba(0,0,0,.7)',
            backdropFilter:'blur(4px)',display:'flex',alignItems:'center',
            justifyContent:'center',padding:24}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:380,
            background:T.card,border:`1px solid ${T.border}`,borderRadius:23,padding:'20px 20px'}}>
            <div style={{color:T.t1,fontSize:18,fontWeight:900,letterSpacing:-.3,
              marginBottom:14}}>Court wählen</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:10}}>
              {[1,2,3].map(c=>(
                <button key={c} onClick={()=>{buzz(10);setCourt(c);setCourtPick(false);}}
                  style={{aspectRatio:'1/1',borderRadius:19,cursor:'pointer',
                    background:c===court?T.oSoft:T.card2,
                    border:`2px solid ${c===court?T.o:T.border}`,
                    color:c===court?T.o:T.t1,display:'flex',flexDirection:'column',
                    alignItems:'center',justifyContent:'center',lineHeight:1}}>
                  <span style={{fontSize:30,fontWeight:900}}>{c}</span>
                  <span style={{fontSize:9,fontWeight:800,letterSpacing:1,marginTop:4}}>COURT</span>
                </button>
              ))}
            </div>
            <button onClick={()=>setCourtPick(false)}
              style={{width:'100%',marginTop:12,padding:'11px 16px',borderRadius:13,
                background:'none',border:`1px solid ${T.border}`,color:T.t3,
                fontSize:13,fontWeight:700,cursor:'pointer'}}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
      {/* Leaderboard — reines Anzeige-Overlay (kein PIN nötig). */}
      {lbShow&&(
        <div className="fi" style={{position:'fixed',inset:0,zIndex:345,background:T.bg,
          display:'flex',flexDirection:'column',
          padding:'calc(env(safe-area-inset-top,0px) + 22px) 22px calc(env(safe-area-inset-bottom,0px) + 18px)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14,flexShrink:0}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.6,
                textTransform:'uppercase'}}>RITMO DNA CUP</div>
              <div style={{color:T.t1,fontSize:24,fontWeight:900,letterSpacing:-.4}}>Leaderboard</div>
            </div>
            <button onClick={()=>{buzz(6);setLbShow(false);}} aria-label="Leaderboard schließen"
              style={{padding:'11px 20px',borderRadius:13,background:T.o,border:'none',
                color:'#000',fontSize:14,fontWeight:800,cursor:'pointer',flexShrink:0}}>
              Schließen
            </button>
          </div>
          <div style={{flex:1,minHeight:0,overflowY:'auto',WebkitOverflowScrolling:'touch',
            paddingBottom:8}}>
            {lbRows.map(row=>{
              const zone=row.rank<=2?'top':row.rank<=14?'mid':'courage';
              const zc=zone==='top'?T.gold:zone==='courage'?T.blue:null;
              return(
                <div key={row.num} style={{display:'flex',alignItems:'center',gap:10,
                  padding:'9px 14px',borderRadius:12,marginBottom:6,minWidth:0,
                  background:zone==='top'?`color-mix(in srgb, ${T.gold} 12%, transparent)`
                    :zone==='courage'?T.blueSoft:T.card,
                  border:`1px solid ${zc||T.border}`}}>
                  <span style={{width:40,textAlign:'right',flexShrink:0,
                    color:zc||T.t2,fontSize:17,fontWeight:900}}>#{row.rank}</span>
                  <span aria-hidden="true" style={{width:2,alignSelf:'stretch',margin:'3px 0',
                    borderRadius:1,background:T.o,opacity:.5,flexShrink:0}}/>
                  <span style={{color:T.o,fontSize:14,fontWeight:900,flexShrink:0,width:34}}>
                    P{row.num}
                  </span>
                  <span style={{flex:1,minWidth:0,color:T.t1,fontSize:16,fontWeight:600,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {(row.name||'').trim()||'—'}
                  </span>
                  <span style={{color:T.t1,fontSize:18,fontWeight:900,flexShrink:0,
                    fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>
                    {row.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── TICKETS — Check-in & Einlass ─────────────────────────────────
   Tablet am Eingang: alle 22 Spieler als Liste, ein Tap checkt ein
   (Zeitstempel inAt am Spieler), nochmaliger Tap macht den Check-in
   rückgängig. Fortschrittsbalken + Filter Alle/Offen/Da. Der Status
   lebt im Cup-State — Admin & Screens lesen ihn live mit. */
function CupTicketsScreen({cup,setCup,onBack}){
  const[filter,setFilter]=useState('alle');
  const total=cup.players.length;
  const done=cup.players.filter(p=>p.inAt).length;
  const all=done===total;
  const toggle=num=>{
    buzz(10);
    setCup(c=>({...c,players:c.players.map(p=>
      p.num===num?{...p,inAt:p.inAt?null:new Date().toISOString()}:p)}));
  };
  const list=cup.players.filter(p=>
    filter==='offen'?!p.inAt:filter==='da'?!!p.inAt:true);
  const chip=sel=>({flex:1,padding:'10px 12px',borderRadius:13,cursor:'pointer',
    background:sel?T.oSoft:T.card2,border:`1.5px solid ${sel?T.o:T.border}`,
    color:sel?T.o:T.t2,fontSize:13,fontWeight:700});
  const hhmm=iso=>{try{
    return new Date(iso).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
  }catch(e){return '';}};
  return(
    <div className="fi" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0,
      padding:'0 22px'}}>
      {/* Kopf */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12,flexShrink:0}}>
        <button onClick={onBack} aria-label="Zurück zur Kachel-Auswahl"
          style={{width:38,height:38,borderRadius:13,background:T.card,border:`1px solid ${T.border}`,
            color:T.t1,fontSize:18,fontWeight:800,cursor:'pointer',flexShrink:0,
            display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:T.t1,fontSize:22,fontWeight:900,letterSpacing:-.4}}>Tickets</div>
          <div style={{color:T.t3,fontSize:11.5}}>Check-in & Einlass — ein Tap checkt ein.</div>
        </div>
      </div>
      {/* Fortschritt */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
        padding:'16px 18px',marginBottom:12,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
          <span style={{color:all?T.g:T.t1,fontSize:34,fontWeight:900,lineHeight:1,
            fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',
            fontVariantNumeric:'tabular-nums'}}>{done}</span>
          <span style={{color:T.t3,fontSize:15,fontWeight:700}}>/ {total} eingecheckt</span>
          <span style={{marginLeft:'auto',color:all?T.g:T.t3,fontSize:12.5,fontWeight:800}}>
            {all?'Alle da!':`${total-done} offen`}
          </span>
        </div>
        <div style={{height:8,borderRadius:999,background:T.card2,marginTop:12,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${total?(done/total)*100:0}%`,borderRadius:999,
            background:all?T.g:T.o,transition:'width .3s ease'}}/>
        </div>
      </div>
      {/* Filter */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexShrink:0}}>
        {[['alle','Alle'],['offen','Offen'],['da','Eingecheckt']].map(([id,l])=>(
          <button key={id} onClick={()=>{buzz(6);setFilter(id);}} style={chip(filter===id)}>{l}</button>
        ))}
      </div>
      {/* Liste */}
      <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',
        display:'flex',flexDirection:'column',gap:8,
        paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 26px)'}}>
        {list.map(p=>{
          const da=!!p.inAt;
          const nm=(p.name||'').trim();
          return(
            <button key={p.num} onClick={()=>toggle(p.num)}
              aria-label={`P${p.num}${nm?` ${nm}`:''} ${da?'auschecken':'einchecken'}`}
              style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
                borderRadius:16,cursor:'pointer',textAlign:'left',flexShrink:0,
                background:da?`color-mix(in srgb, ${T.g} 9%, ${T.card})`:T.card,
                border:`1.5px solid ${da?T.g:T.border}`}}>
              <span style={{width:44,height:38,borderRadius:12,flexShrink:0,
                background:da?T.g:T.card2,color:da?'#000':T.t2,
                border:`1px solid ${da?T.g:T.border}`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:14,fontWeight:900,fontVariantNumeric:'tabular-nums'}}>
                P{p.num}
              </span>
              <span style={{flex:1,minWidth:0,color:nm?T.t1:T.t4,fontSize:15.5,fontWeight:700,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {nm||'Noch ohne Name'}
              </span>
              {da?(
                <span style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                  <span style={{color:T.t3,fontSize:12,fontWeight:700,
                    fontVariantNumeric:'tabular-nums'}}>{hhmm(p.inAt)}</span>
                  <span style={{color:T.g,fontSize:17,fontWeight:900}}>✓</span>
                </span>
              ):(
                <span style={{width:22,height:22,borderRadius:'50%',flexShrink:0,
                  border:`1.5px solid ${T.border}`}}/>
              )}
            </button>
          );
        })}
        {list.length===0&&(
          <div style={{color:T.t3,fontSize:13,textAlign:'center',padding:'26px 0'}}>
            {filter==='offen'?'Alle Spieler sind eingecheckt.':'Noch niemand eingecheckt.'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── CLOUD-SYNC — Sheet zum Starten/Beitreten ─────────────────────
   Ein Gerät (Admin-Tablet) startet den Sync und lädt seinen Stand
   hoch; jedes weitere Gerät (Tickets · Center · Courts) gibt den
   6er-Code einmal ein und übernimmt den Cloud-Stand. Der Code liegt
   danach in localStorage — nach Reload verbindet sich das Gerät
   automatisch wieder (Kiosk-tauglich). */
function CupSyncModal({sync,status,onStart,onJoin,onDisconnect,onClose}){
  const[code,setCode]=useState('');
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState('');
  const run=fn=>async()=>{
    setBusy(true);setErr('');
    try{await fn();}catch(e){setErr(e?.message||'Fehler — bitte erneut versuchen.');}
    setBusy(false);
  };
  const btn=(bg,fg,line)=>({width:'100%',padding:'13px 16px',borderRadius:14,
    background:bg,border:line?`1.5px solid ${line}`:'none',color:fg,
    fontSize:14.5,fontWeight:800,cursor:'pointer',opacity:busy?.55:1});
  return(
    <div onClick={onClose} className="fi" style={{position:'fixed',inset:0,zIndex:360,
      background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'flex-end'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxHeight:'85dvh',overflowY:'auto',
        background:T.card,borderTopLeftRadius:24,borderTopRightRadius:24,
        padding:'18px 20px calc(env(safe-area-inset-bottom,0px) + 20px)'}}>
        <div style={{width:36,height:4,borderRadius:2,background:T.border,margin:'0 auto 14px'}}/>
        <div style={{color:T.t1,fontSize:18,fontWeight:900,letterSpacing:-.3,marginBottom:4}}>Cloud-Sync</div>
        {sync?(
          <>
            <div style={{color:T.t3,fontSize:12.5,lineHeight:1.55,marginBottom:14}}>
              Dieses Gerät ist verbunden. Gib den Code an jedem weiteren Gerät
              (Tickets · Center · Courts) unter Cloud-Sync ein — alle zeigen
              denselben Live-Stand.
            </div>
            <div style={{background:T.card2,border:`1.5px solid ${status==='err'?T.r:T.g}`,
              borderRadius:16,padding:'16px 18px',textAlign:'center',marginBottom:10}}>
              <div style={{color:T.t3,fontSize:11,fontWeight:800,letterSpacing:1.2,
                textTransform:'uppercase'}}>Code</div>
              <div style={{color:T.t1,fontSize:34,fontWeight:900,letterSpacing:8,
                fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>
                {sync.pin.toUpperCase()}
              </div>
              <div style={{color:status==='err'?T.r:T.g,fontSize:12,fontWeight:700,marginTop:4}}>
                {status==='err'?'Verbindung gestört — Änderungen werden nachgereicht.':'Live verbunden'}
              </div>
            </div>
            <button disabled={busy} onClick={run(async()=>{await onDisconnect();onClose();})}
              style={btn(T.card2,T.r,T.border)}>
              Sync trennen — Gerät arbeitet lokal weiter
            </button>
          </>
        ):(
          <>
            <div style={{color:T.t3,fontSize:12.5,lineHeight:1.55,marginBottom:14}}>
              Verbindet Admin, Tickets, Center- und Court-Screens live über die
              Cloud. Am Hauptgerät (Admin) einmal starten — jedes weitere Gerät
              tritt nur mit dem Code bei.
            </div>
            <button disabled={busy} onClick={run(onStart)} style={btn(T.o,'#000')}>
              Sync starten — dieser Stand wird hochgeladen
            </button>
            <div style={{display:'flex',alignItems:'center',gap:10,margin:'14px 0'}}>
              <span style={{flex:1,height:1,background:T.border}}/>
              <span style={{color:T.t4,fontSize:11,fontWeight:800,letterSpacing:1}}>ODER</span>
              <span style={{flex:1,height:1,background:T.border}}/>
            </div>
            <input value={code} maxLength={6} autoCapitalize="off" autoCorrect="off"
              spellCheck={false} placeholder="CODE"
              onChange={e=>setCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g,''))}
              aria-label="Sync-Code eingeben"
              style={{width:'100%',padding:'13px 14px',borderRadius:13,background:T.card2,
                border:`1.5px solid ${T.border}`,color:T.t1,fontSize:18,fontWeight:900,
                letterSpacing:6,textAlign:'center',textTransform:'uppercase',outline:'none',
                boxSizing:'border-box',marginBottom:10,
                fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}/>
            <button disabled={busy||code.length<6}
              onClick={run(async()=>{await onJoin(code);onClose();})}
              style={{...btn(T.g,'#000'),opacity:busy||code.length<6?.45:1}}>
              Verbinden — Stand wird vom Sync übernommen
            </button>
          </>
        )}
        {err&&(
          <div style={{color:T.r,fontSize:12.5,fontWeight:700,lineHeight:1.5,marginTop:12,
            textAlign:'center'}}>{err}</div>
        )}
        <button onClick={onClose}
          style={{width:'100%',marginTop:12,padding:'12px 16px',borderRadius:13,background:'none',
            border:`1px solid ${T.border}`,color:T.t3,fontSize:13.5,fontWeight:700,cursor:'pointer'}}>
          Schließen
        </button>
      </div>
    </div>
  );
}

/* Kachel-Auswahl (Home des Cup-Bereichs). */
function CupHome({cup,onView,onAskExit,sync,syncStatus,onSync}){
  const phase=CUP_PHASES.find(p=>p.id===cup.phase);
  const tiles=[
    {id:'admin', title:'Admin',        desc:'Turnier steuern & verwalten', icon:<GearIcon size={30}/>,        accent:T.o},
    {id:'tickets',title:'Tickets',     desc:'Check-in & Einlass',          icon:<CupTicketIcon size={30}/>,   accent:T.gold},
    {id:'center',title:'Center Screen',desc:'Diashow · Leaderboard · Phase',icon:<MonitorIcon size={30}/>,    accent:T.blue},
    {id:'court', title:'Court Screen', desc:'Court wählen · Punkte · Zeit', icon:<TennisBallIcon size={30}/>, accent:T.g},
  ];
  return(
    <div className="fi" style={{flex:1,display:'flex',flexDirection:'column',minHeight:0,padding:'0 22px'}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:6}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:T.o,fontSize:12,fontWeight:800,letterSpacing:1.6,textTransform:'uppercase'}}>
            RITMO × Padel Haus · 18.07.2026
          </div>
          <div style={{color:T.t1,fontSize:30,fontWeight:900,letterSpacing:-.6,margin:'4px 0 6px'}}>
            RITMO <span style={{color:T.o}}>DNA CUP</span>
          </div>
          <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 12px',
            borderRadius:999,background:T.oSoft,border:`1px solid ${T.o}`}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:T.o}} className="court-live-dot"/>
            <span style={{color:T.o,fontSize:11.5,fontWeight:800}}>{phase?.name||'—'}</span>
          </div>
        </div>
        <button onClick={onAskExit} title="Cup verlassen (PIN)" aria-label="Cup verlassen (PIN nötig)"
          style={{width:42,height:42,borderRadius:14,background:T.card,border:`1px solid ${T.border}`,
            display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
          <LockIcon size={18} color={T.t2}/>
        </button>
      </div>
      {/* Cloud-Sync-Status: ein Tap öffnet das Sync-Sheet. */}
      <button onClick={()=>{buzz(6);onSync();}} aria-label="Cloud-Sync verwalten"
        style={{display:'flex',alignItems:'center',gap:9,padding:'11px 14px',marginTop:10,
          borderRadius:14,cursor:'pointer',background:T.card,
          border:`1px solid ${sync?(syncStatus==='err'?T.r:T.g):T.border}`,flexShrink:0}}>
        <span className={sync&&syncStatus!=='err'?'court-live-dot':''}
          style={{width:8,height:8,borderRadius:'50%',flexShrink:0,
            background:sync?(syncStatus==='err'?T.r:T.g):T.t4}}/>
        <span style={{flex:1,minWidth:0,textAlign:'left',color:T.t2,fontSize:12.5,fontWeight:700,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {sync
            ?(syncStatus==='err'
              ?'Cloud-Sync gestört — Änderungen werden nachgereicht'
              :`Cloud-Sync aktiv · Code ${sync.pin.toUpperCase()}`)
            :'Cloud-Sync aus — nur dieses Gerät'}
        </span>
        <ChevronRightIcon size={14} color={T.t3}/>
      </button>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,
        alignContent:'start',paddingTop:14,overflowY:'auto',
        paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 22px)'}}>
        {tiles.map((t,i)=>(
          <button key={t.id} onClick={()=>{buzz(8);onView(t.id);}} data-lift className="fu"
            style={{animationDelay:`${i*0.05}s`,aspectRatio:'1/0.92',borderRadius:23,cursor:'pointer',
              background:T.card,border:`1.5px solid ${T.border}`,padding:'18px 16px',
              display:'flex',flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between',
              textAlign:'left'}}>
            <span style={{width:52,height:52,borderRadius:17,background:`${t.accent}1c`,
              border:`1px solid ${t.accent}`,color:t.accent,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              {t.icon}
            </span>
            <span style={{minWidth:0}}>
              <span style={{display:'block',color:T.t1,fontSize:17,fontWeight:800,letterSpacing:-.2}}>
                {t.title}
              </span>
              <span style={{display:'block',color:T.t3,fontSize:11.5,lineHeight:1.45,marginTop:3}}>
                {t.desc}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* Root des Cup-Bereichs: PIN-Gate → Kacheln → Modus. Ausgang ebenfalls
   nur per PIN (Kiosk-Schutz für Tablets & Beamer-Gerät).

   CLOUD-SYNC (Mehrgeräte-Betrieb): Ist ein Sync verbunden
   (localStorage 'ritmo_dnacup_sync' = {pin}), laufen alle Writes der
   Unter-Screens durch setCupSync: sofort lokal anwenden, den Mutator
   in eine Queue legen und debounced per Merge-Write pushen —
   pushCupSync wendet die Mutatoren auf den FRISCHEN Remote-State an,
   nie auf den lokalen (Lost-Update-Schutz: Tickets/Courts/Admin
   schreiben parallel disjunkte Felder). Eingehende Remote-Stände
   (Realtime + 5s-Poll als Fallback) ersetzen den lokalen State,
   noch ungepushte Mutatoren werden oben drauf re-appliziert. */
function DnaCupScreen({onExit}){
  const[unlocked,setUnlocked]=useState(false);
  const[exitAsk,setExitAsk]=useState(false);
  const[adminAsk,setAdminAsk]=useState(false); // Admin-Kachel: eigener PIN-Schritt
  const[view,setView]=useState('home');
  const[cup,setCup]=useState(()=>{
    const s=lsGet('ritmo_dnacup_state',null);
    return (s&&s.v===1)?s:initialCupState();
  });
  useEffect(()=>{
    lsSet('ritmo_dnacup_state',cup.createdAt?cup:{...cup,createdAt:new Date().toISOString()});
  },[cup]);
  // Cross-Tab-Sync: Admin in einem Tab, Center-/Court-Screen in einem
  // anderen (gleiches Gerät) — storage-Events feuern nur in FREMDEN
  // Tabs, daher keine Schleife mit den eigenen Writes oben.
  useEffect(()=>{
    const onStorage=e=>{
      if(e.key!=='ritmo_dnacup_state'||!e.newValue) return;
      try{const s=JSON.parse(e.newValue);if(s&&s.v===1)setCup(s);}catch(err){}
    };
    window.addEventListener('storage',onStorage);
    return()=>window.removeEventListener('storage',onStorage);
  },[]);
  const lb=useMemo(()=>cupLeaderboard(cup),[cup]);

  /* ── Cloud-Sync ── */
  const[sync,setSync]=useState(()=>lsGet('ritmo_dnacup_sync',null)); // {pin}|null
  const[syncAsk,setSyncAsk]=useState(false);
  const[syncStatus,setSyncStatus]=useState('ok'); // ok|err
  const syncRef=useRef(sync);syncRef.current=sync;
  const pendingRef=useRef([]);   // lokal applizierte, noch ungepushte Mutatoren
  const flushingRef=useRef(false);
  const flushTimerRef=useRef(null);
  useEffect(()=>{lsSet('ritmo_dnacup_sync',sync);},[sync]);
  useEffect(()=>()=>clearTimeout(flushTimerRef.current),[]);
  const withPending=s=>pendingRef.current.reduce((acc,fn)=>fn(acc),s);
  const applyRemote=remote=>{
    if(!remote||remote.v!==1) return;
    setCup(prev=>{
      const next=withPending(remote);
      return JSON.stringify(next)===JSON.stringify(prev)?prev:next;
    });
  };
  const flush=useCallback(async()=>{
    if(flushingRef.current||!syncRef.current?.pin) return;
    flushingRef.current=true;
    try{
      while(pendingRef.current.length){
        const batch=pendingRef.current.splice(0,pendingRef.current.length);
        try{
          const fresh=await pushCupSync(syncRef.current.pin,batch);
          setSyncStatus('ok');
          setCup(prev=>{
            const next=withPending(fresh);
            return JSON.stringify(next)===JSON.stringify(prev)?prev:next;
          });
        }catch(e){
          // Netz weg o. ä.: Batch zurück in die Queue, Poll-Intervall
          // versucht es weiter — es geht nichts verloren.
          pendingRef.current=batch.concat(pendingRef.current);
          setSyncStatus('err');
          break;
        }
      }
    }finally{flushingRef.current=false;}
  },[]);
  // setCup-Ersatz für die Unter-Screens: lokal sofort, Cloud debounced
  // (Tipp-Bursts im Admin erzeugen sonst einen Write pro Tastendruck).
  const setCupSync=useCallback(f=>{
    const fn=typeof f==='function'?f:()=>f;
    setCup(fn);
    if(!syncRef.current?.pin) return;
    pendingRef.current.push(fn);
    clearTimeout(flushTimerRef.current);
    flushTimerRef.current=setTimeout(flush,700);
  },[flush]);
  // Eingehende Änderungen: Realtime-Subscription + 5s-Poll (Fallback,
  // falls Realtime für ritmo_sessions nicht aktiviert ist). Bei
  // wartenden eigenen Änderungen wird stattdessen geflusht.
  useEffect(()=>{
    if(!sync?.pin) return;
    const off=subscribeCupSync(sync.pin,applyRemote);
    // Sofort-Fetch: nach Reload/Reconnect nicht auf den ersten Poll warten.
    fetchCupSync(sync.pin).then(r=>{if(r)applyRemote(r);}).catch(()=>{});
    const iv=setInterval(()=>{
      if(pendingRef.current.length){flush();return;}
      fetchCupSync(sync.pin)
        .then(r=>{if(syncRef.current?.pin===sync.pin&&r){applyRemote(r);setSyncStatus('ok');}})
        .catch(()=>{});
    },5000);
    return()=>{off();clearInterval(iv);};
  },[sync?.pin,flush]);
  const startSync=async()=>{
    const pin=await createCupSync(cup);
    pendingRef.current=[];
    setSyncStatus('ok');
    setSync({pin});
  };
  const joinSync=async code=>{
    const pin=code.trim().toLowerCase();
    const remote=await fetchCupSync(pin);
    if(!remote||remote.v!==1) throw new Error('Kein Cup-Sync unter diesem Code gefunden.');
    pendingRef.current=[];
    setCup(remote);
    setSyncStatus('ok');
    setSync({pin});
  };
  const stopSync=()=>{
    pendingRef.current=[];
    clearTimeout(flushTimerRef.current);
    setSync(null);
    setSyncStatus('ok');
  };

  if(!unlocked){
    return <CupPinPad title="Zugang" sub="PIN eingeben, um den DNA Cup zu öffnen."
      onOk={()=>setUnlocked(true)} onCancel={onExit}/>;
  }
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      overflow:'hidden',position:'relative',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 26px)'}}>
      {/* Admin nur per PIN — Spieler an den Tablets kommen nicht rein. */}
      {view==='home'&&<CupHome cup={cup}
        onView={id=>id==='admin'?setAdminAsk(true):setView(id)}
        onAskExit={()=>setExitAsk(true)}
        sync={sync} syncStatus={syncStatus} onSync={()=>setSyncAsk(true)}/>}
      {view==='admin'&&<CupAdmin cup={cup} setCup={setCupSync} lb={lb} onBack={()=>setView('home')}/>}
      {view==='center'&&<CupCenterScreen cup={cup} lb={lb} onBack={()=>setView('home')}/>}
      {view==='court'&&<CupCourtScreen cup={cup} setCup={setCupSync} onBack={()=>setView('home')}/>}
      {view==='tickets'&&<CupTicketsScreen cup={cup} setCup={setCupSync} onBack={()=>setView('home')}/>}
      {syncAsk&&(
        <CupSyncModal sync={sync} status={syncStatus}
          onStart={startSync} onJoin={joinSync} onDisconnect={stopSync}
          onClose={()=>setSyncAsk(false)}/>
      )}
      {exitAsk&&(
        <CupPinPad title="Cup verlassen" sub="PIN eingeben, um den DNA Cup zu schließen."
          onOk={()=>{setExitAsk(false);onExit();}} onCancel={()=>setExitAsk(false)}/>
      )}
      {adminAsk&&(
        <CupPinPad title="Admin" sub="PIN eingeben, um den Admin-Bereich zu öffnen."
          onOk={()=>{setAdminAsk(false);setView('admin');}} onCancel={()=>setAdminAsk(false)}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RITMO DNA LIGA — Club-Liga-Zyklus (3 Monate).
   Logik: src/liga.js · Sync: ritmo_sessions kind='liga' (Merge-
   Writes wie beim Cup) · Persistenz: localStorage ritmo_liga_*.
   Rollen: Ersteller = Admin (steuert Phasen), Spieler melden sich
   individuell an; Ergebnis eintragen + Gegner bestätigt (9a),
   Streitfall entscheidet der Admin.
═══════════════════════════════════════════════════════════════ */
function LigaScreen({profile,onHome}){
  const[sync,setSync]=useState(()=>lsGet('ritmo_liga_sync',null)); // {pin,admin}
  const[liga,setLiga]=useState(()=>lsGet('ritmo_liga_state',null));
  const[tab,setTab]=useState('start');
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState('');
  const[code,setCode]=useState('');
  const[report,setReport]=useState(null); // Match fürs Ergebnis-Sheet
  const[rs1,setRs1]=useState('');const[rs2,setRs2]=useState('');
  const[me,setMe]=useState({userId:null,name:(profile?.name||'Spieler')});
  const syncRef=useRef(sync);syncRef.current=sync;
  const pendingRef=useRef([]);const flushingRef=useRef(false);const timerRef=useRef(null);
  useEffect(()=>{lsSet('ritmo_liga_sync',sync);},[sync]);
  useEffect(()=>{lsSet('ritmo_liga_state',liga);},[liga]);
  useEffect(()=>()=>clearTimeout(timerRef.current),[]);
  useEffect(()=>{(async()=>{
    try{
      const u=await window.supabase?.auth?.getUser?.();
      setMe(m=>({...m,userId:u?.data?.user?.id||('local-'+(profile?.name||'gast'))}));
    }catch(e){setMe(m=>({...m,userId:'local-'+(profile?.name||'gast')}));}
  })();},[]);
  const withPending=s=>pendingRef.current.reduce((a,f)=>f(a),s);
  const applyRemote=r=>{if(r&&r.v===1)setLiga(prev=>{
    const n=withPending(r);
    return JSON.stringify(n)===JSON.stringify(prev)?prev:n;});};
  const flush=useCallback(async()=>{
    if(flushingRef.current||!syncRef.current?.pin) return;
    flushingRef.current=true;
    try{
      while(pendingRef.current.length){
        const batch=pendingRef.current.splice(0,pendingRef.current.length);
        try{
          const fresh=await pushLigaSync(syncRef.current.pin,batch);
          setLiga(prev=>{const n=withPending(fresh);
            return JSON.stringify(n)===JSON.stringify(prev)?prev:n;});
        }catch(e){pendingRef.current=batch.concat(pendingRef.current);break;}
      }
    }finally{flushingRef.current=false;}
  },[]);
  const mutate=useCallback(f=>{
    setLiga(f);
    if(!syncRef.current?.pin) return;
    pendingRef.current.push(f);
    clearTimeout(timerRef.current);
    timerRef.current=setTimeout(flush,700);
  },[flush]);
  useEffect(()=>{
    if(!sync?.pin) return;
    const off=subscribeLigaSync(sync.pin,applyRemote);
    fetchLigaSync(sync.pin).then(r=>{if(r)applyRemote(r);}).catch(()=>{});
    const iv=setInterval(()=>{
      if(pendingRef.current.length){flush();return;}
      fetchLigaSync(sync.pin).then(r=>{if(r)applyRemote(r);}).catch(()=>{});
    },6000);
    return()=>{off();clearInterval(iv);};
  },[sync?.pin,flush]);

  const run=fn=>async()=>{
    setBusy(true);setErr('');
    try{await fn();}catch(e){setErr(e?.message||'Fehler — bitte erneut versuchen.');}
    setBusy(false);
  };
  const createLiga=run(async()=>{
    const s={...initialLigaState('RITMO DNA Liga'),createdAt:new Date().toISOString()};
    const pin=await createLigaSync(s);
    setLiga(s);setSync({pin,admin:true});
    notify('Liga erstellt — Code '+pin.toUpperCase());
  });
  const joinLiga=run(async()=>{
    const pin=code.trim().toLowerCase();
    const r=await fetchLigaSync(pin);
    if(!r||r.v!==1) throw new Error('Keine Liga unter diesem Code gefunden.');
    pendingRef.current=[];
    setLiga(r);setSync({pin,admin:false});
    notify('Liga beigetreten');
  });
  const leaveLiga=()=>{
    pendingRef.current=[];clearTimeout(timerRef.current);
    setSync(null);setLiga(null);setTab('start');
  };

  const phase=liga?LIGA_PHASES.find(p=>p.id===liga.phase):null;
  const iAmIn=liga&&liga.participants.some(p=>p.userId===me.userId);
  const myTeam=liga?ligaTeamOfUser(liga,me.userId):null;
  const action=liga&&me.userId?ligaMyOpenAction(liga,me.userId):null;
  const isAdmin=!!sync?.admin;

  /* ── kleine Bausteine ── */
  const card={background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
    padding:'16px 18px',marginBottom:12};
  const cap=t=>(
    <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.4,
      textTransform:'uppercase',marginBottom:10}}>{t}</div>);
  const btn=(bg,fg,line)=>({width:'100%',padding:'13px 16px',borderRadius:14,
    background:bg,border:line?`1.5px solid ${line}`:'none',color:fg,
    fontSize:14.5,fontWeight:800,cursor:'pointer',opacity:busy?.55:1});
  const chip=sel=>({flex:'0 0 auto',padding:'10px 15px',borderRadius:999,cursor:'pointer',
    background:sel?T.oSoft:T.card,border:`1.5px solid ${sel?T.o:T.border}`,
    color:sel?T.o:T.t2,fontSize:13,fontWeight:700});
  const statusChip=m=>{
    const map={offen:['Offen',T.t3],eingetragen:['Wartet auf Bestätigung',T.gold],
      bestaetigt:['Bestätigt ✓',T.g],streit:['Streitfall',T.r]};
    const[l,c]=map[m.status]||['—',T.t3];
    return <span style={{color:c,fontSize:11,fontWeight:800}}>{l}</span>;
  };
  const matchRow=m=>{
    const mine=myTeam&&(m.t1===myTeam.id||m.t2===myTeam.id);
    const tier=ligaMatchTier(liga,m);
    return(
      <div key={m.id} style={{padding:'11px 14px',borderRadius:14,marginBottom:8,minWidth:0,
        background:mine?T.oSoft:T.card2,
        border:`1.5px solid ${mine?T.o:T.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
          <span style={{color:T.t3,fontSize:11,fontWeight:800}}>
            {m.title||`Court ${m.court} · ${m.time}`}{m.phase==='gruppe'?` · Woche ${m.week}`:''}
          </span>
          {tier&&<span style={{color:tier.color,fontSize:11,fontWeight:900}}>{tier.label}</span>}
          <span style={{flex:1}}/>
          {statusChip(m)}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
          <span style={{flex:1,minWidth:0,color:T.t1,fontSize:14.5,fontWeight:700,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {ligaTeamLabel(liga,m.t1)}
          </span>
          <span style={{color:T.o,fontSize:13,fontWeight:900,flexShrink:0,
            fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>
            {m.s1==null?'– : –':`${m.s1} : ${m.s2}`}
          </span>
          <span style={{flex:1,minWidth:0,color:T.t1,fontSize:14.5,fontWeight:700,textAlign:'right',
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {ligaTeamLabel(liga,m.t2)}
          </span>
        </div>
        {/* Aktionen: eintragen / bestätigen / widersprechen */}
        {mine&&m.status==='offen'&&(
          <button onClick={()=>{buzz(6);setReport(m);setRs1('');setRs2('');}}
            style={{...btn(T.o,'#000'),marginTop:9,padding:'10px 14px'}}>Ergebnis eintragen</button>
        )}
        {mine&&m.status==='eingetragen'&&m.reportedBy!==me.userId&&(
          <div style={{display:'flex',gap:8,marginTop:9}}>
            <button onClick={()=>{mutate(s=>ligaConfirmResult(s,m.id));notify('Ergebnis bestätigt');}}
              style={{...btn(T.g,'#000'),padding:'10px 14px'}}>Bestätigen ✓</button>
            <button onClick={()=>{mutate(s=>ligaDisputeResult(s,m.id));notify('Einspruch — der Admin entscheidet','err');}}
              style={{...btn(T.card2,T.r,T.border),padding:'10px 14px'}}>Einspruch</button>
          </div>
        )}
        {isAdmin&&m.status==='streit'&&(
          <button onClick={()=>{mutate(s=>ligaConfirmResult(s,m.id));notify('Streitfall entschieden');}}
            style={{...btn(T.card2,T.t1,T.border),marginTop:9,padding:'10px 14px'}}>
            Als Admin bestätigen (Score ggf. vorher neu eintragen)
          </button>
        )}
      </div>
    );
  };

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      overflow:'hidden',position:'relative',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 26px)'}}>
      <div style={{padding:'0 22px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
          <button onClick={onHome} aria-label="Zurück zu Home"
            style={{width:40,height:40,borderRadius:13,background:T.card,
              border:`1px solid ${T.border}`,color:T.t1,fontSize:18,fontWeight:800,
              cursor:'pointer',flexShrink:0}}>‹</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.6,
              textTransform:'uppercase'}}>RITMO Club</div>
            <div style={{color:T.t1,fontSize:24,fontWeight:900,letterSpacing:-.4}}>
              RITMO <span style={{color:T.o}}>DNA Liga</span>
            </div>
          </div>
          {liga&&phase&&(
            <span style={{display:'inline-flex',alignItems:'center',gap:7,padding:'6px 13px',
              borderRadius:999,background:T.oSoft,border:`1px solid ${T.o}`,flexShrink:0}}>
              <span className="court-live-dot" style={{width:7,height:7,borderRadius:'50%',background:T.o}}/>
              <span style={{color:T.o,fontSize:11.5,fontWeight:800}}>{phase.name}</span>
            </span>
          )}
        </div>
        {liga&&(
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:12}}>
            {[['start','Start'],['gruppen','Gruppen'],['ko','KO'],['dna','DNA'],
              ...(isAdmin?[['admin','Admin']]:[])].map(([id,l])=>(
              <button key={id} onClick={()=>{buzz(6);setTab(id);}} style={chip(tab===id)}>{l}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{flex:1,minHeight:0,overflowY:'auto',WebkitOverflowScrolling:'touch',
        padding:'0 22px calc(env(safe-area-inset-bottom,0px) + 120px)'}}>

        {/* ── Nicht verbunden: erstellen oder beitreten ── */}
        {!liga&&(<>
          <div style={card}>
            {cap('Der Zyklus')}
            {LIGA_PHASES.filter(p=>p.id!=='planung').map((p,i)=>(
              <div key={p.id} style={{display:'flex',gap:10,alignItems:'baseline',
                padding:'5px 0',borderBottom:i<4?`1px solid ${T.sep}`:'none'}}>
                <span style={{color:T.o,fontSize:12,fontWeight:900,width:18}}>{i+1}</span>
                <span style={{color:T.t1,fontSize:14,fontWeight:700}}>{p.name}</span>
                <span style={{flex:1}}/>
                <span style={{color:T.t3,fontSize:11.5}}>{p.sub}</span>
              </div>
            ))}
            <div style={{color:T.t3,fontSize:12,lineHeight:1.55,marginTop:10}}>
              32 Spieler · 16 Teams · 4 Gruppen · 4 Courts. Monat 1: ein Liga-Abend
              pro Woche (19:00–21:30). Monat 2: jede Woche eine KO-Runde. Monat 3:
              Planung & Anmeldung des nächsten Zyklus.
            </div>
          </div>
          <div style={card}>
            {cap('Liga beitreten')}
            <input value={code} maxLength={6} placeholder="CODE"
              onChange={e=>setCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g,''))}
              autoCapitalize="off" autoCorrect="off" spellCheck={false}
              style={{width:'100%',padding:'13px 14px',borderRadius:13,background:T.card2,
                border:`1.5px solid ${T.border}`,color:T.t1,fontSize:18,fontWeight:900,
                letterSpacing:6,textAlign:'center',textTransform:'uppercase',outline:'none',
                boxSizing:'border-box',marginBottom:10,
                fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}/>
            <button disabled={busy||code.length<6} onClick={joinLiga}
              style={{...btn(T.g,'#000'),opacity:busy||code.length<6?.45:1}}>
              Beitreten
            </button>
          </div>
          <div style={card}>
            {cap('Neue Liga (Club-Admin)')}
            <div style={{color:T.t3,fontSize:12,lineHeight:1.55,marginBottom:10}}>
              Du bekommst einen 6er-Code für deine Club-Mitglieder. Wer den Code hat,
              kann sich anmelden — du steuerst Teams, Gruppen und Phasen.
            </div>
            <button disabled={busy} onClick={createLiga} style={btn(T.o,'#000')}>
              Liga erstellen
            </button>
          </div>
          {err&&<div style={{color:T.r,fontSize:12.5,fontWeight:700,textAlign:'center'}}>{err}</div>}
        </>)}

        {/* ── START ── */}
        {liga&&tab==='start'&&(<>
          <div style={card}>
            <div style={{display:'flex',alignItems:'baseline',gap:8}}>
              {cap(`Code ${sync.pin.toUpperCase()}`)}
              <span style={{flex:1}}/>
              <span style={{color:T.t3,fontSize:11.5}}>{liga.participants.length}/32 angemeldet</span>
            </div>
            {liga.phase==='anmeldung'&&!iAmIn&&(
              <button disabled={busy||!me.userId} onClick={()=>{
                mutate(s=>ligaAddParticipant(s,{userId:me.userId,name:me.name,style:profile?.style||null}));
                notify('Angemeldet — bis bald am Liga-Abend!');
              }} style={btn(T.o,'#000')}>Jetzt anmelden</button>
            )}
            {iAmIn&&(
              <div style={{color:T.g,fontSize:13.5,fontWeight:800}}>
                Du bist angemeldet ✓{myTeam?` — Team: ${ligaTeamLabel(liga,myTeam.id)}`:''}
              </div>
            )}
            {liga.phase==='planung'&&(
              <div style={{color:T.t2,fontSize:13,lineHeight:1.6,marginTop:8}}>
                Der Zyklus ist beendet — aktuell läuft die Planung. Die Anmeldung für
                die nächste Saison öffnet der Admin.
              </div>
            )}
          </div>
          {action&&(
            <div style={{...card,border:`1.5px solid ${T.o}`}}>
              {cap(action.kind==='confirm'?'Bitte bestätigen':'Dein nächstes Spiel')}
              {matchRow(action.match)}
            </div>
          )}
          {myTeam&&(
            <div style={card}>
              {cap('Meine Spiele')}
              {liga.matches.filter(m=>m.t1===myTeam.id||m.t2===myTeam.id).map(matchRow)}
              {liga.matches.filter(m=>m.t1===myTeam.id||m.t2===myTeam.id).length===0&&(
                <div style={{color:T.t3,fontSize:12.5}}>Noch keine Ansetzungen.</div>
              )}
            </div>
          )}
          {liga.phase==='anmeldung'&&(
            <div style={card}>
              {cap('Angemeldete Spieler')}
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {liga.participants.map(p=>(
                  <span key={p.id} style={{padding:'6px 12px',borderRadius:999,background:T.card2,
                    border:`1px solid ${T.border}`,color:T.t2,fontSize:12,fontWeight:700}}>
                    {p.name}
                  </span>
                ))}
                {liga.participants.length===0&&(
                  <span style={{color:T.t3,fontSize:12.5}}>Noch niemand — sei die/der Erste!</span>
                )}
              </div>
            </div>
          )}
        </>)}

        {/* ── GRUPPEN ── */}
        {liga&&tab==='gruppen'&&LIGA_GROUPS.map(g=>{
          const table=ligaGroupTable(liga,g);
          if(table.length===0) return null;
          return(
            <div key={g} style={card}>
              {cap(`Gruppe ${g} · Court ${LIGA_GROUPS.indexOf(g)+1}`)}
              {table.map(r=>(
                <div key={r.team.id} style={{display:'flex',alignItems:'center',gap:9,
                  padding:'7px 0',borderBottom:`1px solid ${T.sep}`,minWidth:0}}>
                  <span style={{color:r.rank===1?T.gold:T.t3,fontSize:13,fontWeight:900,width:20}}>
                    {r.rank}.
                  </span>
                  <span style={{flex:1,minWidth:0,color:T.t1,fontSize:14,fontWeight:700,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {ligaTeamLabel(liga,r.team.id)}
                  </span>
                  <span style={{color:T.t3,fontSize:12,flexShrink:0}}>{r.played} Sp.</span>
                  <span style={{color:T.t2,fontSize:12.5,fontWeight:700,flexShrink:0}}>
                    {r.gf}:{r.ga}
                  </span>
                  <span style={{color:T.o,fontSize:14,fontWeight:900,width:26,textAlign:'right'}}>
                    {r.w}S
                  </span>
                </div>
              ))}
              <div style={{marginTop:10}}>
                {[1,2,3].map(w=>{
                  const ms=liga.matches.filter(m=>m.phase==='gruppe'&&m.group===g&&m.week===w);
                  if(!ms.length) return null;
                  return(
                    <div key={w}>
                      <div style={{color:T.t3,fontSize:10.5,fontWeight:800,letterSpacing:1.1,
                        textTransform:'uppercase',margin:'8px 0 6px'}}>Woche {w}</div>
                      {ms.map(matchRow)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {liga&&tab==='gruppen'&&liga.teams.length===0&&(
          <div style={{...card,color:T.t3,fontSize:13,textAlign:'center'}}>
            Gruppen entstehen, sobald der Admin die Anmeldung schließt.
          </div>
        )}

        {/* ── KO ── */}
        {liga&&tab==='ko'&&(<>
          {['viertel','halb','finale'].map(ph=>{
            const ms=liga.matches.filter(m=>m.phase===ph);
            if(!ms.length) return null;
            return(
              <div key={ph} style={card}>
                {cap(LIGA_PHASES.find(p=>p.id===ph)?.name||ph)}
                {ms.map(matchRow)}
              </div>
            );
          })}
          {!liga.matches.some(m=>m.phase!=='gruppe')&&(
            <div style={{...card,color:T.t3,fontSize:13,textAlign:'center'}}>
              Die KO-Phase wird nach der Gruppenphase gesetzt — nur die Top 2
              jeder Gruppe sind dabei (8 Teams, Erste gegen Zweite über Kreuz).
            </div>
          )}
        </>)}

        {/* ── DNA ── */}
        {liga&&tab==='dna'&&(
          <div style={card}>
            {cap('DNA-Leaderboard · individuell')}
            <div style={{color:T.t3,fontSize:11.5,lineHeight:1.5,marginBottom:10}}>
              Team-Spiele zählen als Punkte, Siege bringen den Spielstil-Tier-Bonus —
              wie beim DNA Cup, über die ganze Saison.
            </div>
            {ligaDnaBoard(liga).map(r=>(
              <div key={r.p.id} style={{display:'flex',alignItems:'center',gap:9,
                padding:'7px 0',borderBottom:`1px solid ${T.sep}`,minWidth:0}}>
                <span style={{color:r.rank<=3?T.gold:T.t3,fontSize:13,fontWeight:900,width:26}}>
                  #{r.rank}
                </span>
                <span style={{flex:1,minWidth:0,color:T.t1,fontSize:14,fontWeight:700,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.p.name}</span>
                {r.tierBonus>0&&(
                  <span style={{color:T.o,fontSize:11,fontWeight:800}}>+{r.tierBonus}</span>
                )}
                <span style={{color:T.t1,fontSize:14,fontWeight:900,width:34,textAlign:'right',
                  fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}>{r.total}</span>
              </div>
            ))}
            {liga.participants.length===0&&(
              <div style={{color:T.t3,fontSize:12.5}}>Noch keine Spieler angemeldet.</div>
            )}
          </div>
        )}

        {/* ── ADMIN ── */}
        {liga&&tab==='admin'&&isAdmin&&(<>
          <div style={card}>
            {cap('Phasen-Steuerung')}
            {liga.phase==='anmeldung'&&(
              <button disabled={busy||liga.participants.length<4} onClick={()=>{
                mutate(s=>genGroupMatches(ligaAssignGroups(ligaFormTeams(s))));
                notify('Teams gebildet — die Gruppenphase läuft!');
              }} style={btn(T.o,'#000')}>
                Anmeldung schließen → Teams, Gruppen & Spielplan
              </button>
            )}
            {liga.phase==='gruppe'&&(
              <button disabled={busy} onClick={()=>{
                const gm=liga.matches.filter(m=>m.phase==='gruppe');
                if(gm.some(m=>m.status!=='bestaetigt')){
                  setErr('Es sind noch Gruppenspiele offen oder unbestätigt.');return;
                }
                mutate(s=>genViertelfinale(s));
                notify('Viertelfinale gesetzt — Top 2 jeder Gruppe!');
              }} style={btn(T.o,'#000')}>
                Gruppenphase beenden → Viertelfinale setzen
              </button>
            )}
            {['viertel','halb'].includes(liga.phase)&&(
              <button disabled={busy} onClick={()=>{
                const nxt=genNextKoRound(liga);
                if(!nxt){setErr('Die aktuelle Runde ist noch nicht komplett bestätigt.');return;}
                mutate(s=>genNextKoRound(s)||s);
                notify('Nächste KO-Runde steht!');
              }} style={btn(T.o,'#000')}>
                Nächste KO-Runde generieren
              </button>
            )}
            {liga.phase==='finale'&&(
              <button disabled={busy} onClick={()=>{
                mutate(s=>({...s,phase:'planung'}));
                notify('Saison abgeschlossen — Glückwunsch an die Sieger!');
              }} style={btn(T.gold,'#000')}>
                Saison abschließen → Planung
              </button>
            )}
            {liga.phase==='planung'&&(
              <button disabled={busy} onClick={()=>{
                mutate(s=>({...initialLigaState(s.name,s.clubId),
                  createdAt:new Date().toISOString()}));
                notify('Neue Anmeldung geöffnet!');
              }} style={btn(T.o,'#000')}>
                Neue Saison — Anmeldung öffnen
              </button>
            )}
            {err&&<div style={{color:T.r,fontSize:12.5,fontWeight:700,marginTop:10}}>{err}</div>}
          </div>
          <div style={card}>
            {cap('Streitfälle & Korrekturen')}
            {liga.matches.filter(m=>m.status==='streit').map(m=>(
              <div key={m.id}>
                {matchRow(m)}
                <button onClick={()=>{buzz(6);setReport(m);setRs1(String(m.s1??''));setRs2(String(m.s2??''));}}
                  style={{...btn(T.card2,T.t1,T.border),marginTop:-2,marginBottom:10,padding:'10px 14px'}}>
                  Score korrigieren
                </button>
              </div>
            ))}
            {liga.matches.filter(m=>m.status==='streit').length===0&&(
              <div style={{color:T.t3,fontSize:12.5}}>Keine offenen Streitfälle.</div>
            )}
          </div>
          <button onClick={leaveLiga} style={{...btn('none',T.r,T.border),marginBottom:12}}>
            Liga auf diesem Gerät trennen
          </button>
        </>)}
        {liga&&!isAdmin&&(
          <button onClick={leaveLiga} style={{...btn('none',T.t3,T.border),margin:'4px 0 12px'}}>
            Liga auf diesem Gerät trennen
          </button>
        )}
      </div>

      {/* Kontextuelle Primäraktion (Glass) — In-App-Reminder. */}
      {liga&&action&&tab!=='start'&&(
        <GlassActionBar bottom="calc(env(safe-area-inset-bottom,0px) + 24px)" actions={[
          {label:action.kind==='confirm'?'Ergebnis bestätigen':'Ergebnis eintragen',
            primary:true,onClick:()=>{setTab('start');}},
        ]}/>
      )}

      {/* Ergebnis-Sheet */}
      {report&&(
        <div onClick={()=>setReport(null)} className="fi" style={{position:'fixed',inset:0,
          zIndex:360,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',
          display:'flex',alignItems:'flex-end'}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',background:T.card,
            borderTopLeftRadius:24,borderTopRightRadius:24,
            padding:'18px 20px calc(env(safe-area-inset-bottom,0px) + 20px)'}}>
            <div style={{width:36,height:4,borderRadius:2,background:T.border,margin:'0 auto 14px'}}/>
            <div style={{color:T.t1,fontSize:17,fontWeight:900,marginBottom:2}}>Ergebnis eintragen</div>
            <div style={{color:T.t3,fontSize:12,marginBottom:14}}>
              {ligaTeamLabel(liga,report.t1)} vs {ligaTeamLabel(liga,report.t2)} — Spiele
              (z. B. 6:4). Das Gegner-Team bestätigt danach.
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              {[[rs1,setRs1],[rs2,setRs2]].map(([v,set],i)=>(
                <input key={i} type="number" inputMode="numeric" min="0" value={v}
                  onChange={e=>set(e.target.value)} placeholder="0"
                  style={{flex:1,padding:'14px',borderRadius:13,background:T.card2,
                    border:`1.5px solid ${T.border}`,color:T.t1,fontSize:24,fontWeight:900,
                    textAlign:'center',outline:'none',boxSizing:'border-box',
                    fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace'}}/>
              )).flatMap((el,i)=>i===0?[el,
                <span key="vs" style={{color:T.t3,fontSize:14,fontWeight:900}}>:</span>]:[el])}
            </div>
            <button disabled={rs1===''||rs2===''} onClick={()=>{
              const a=Math.max(0,parseInt(rs1)||0),b=Math.max(0,parseInt(rs2)||0);
              mutate(s=>ligaReportResult(s,report.id,a,b,me.userId));
              setReport(null);
              notify('Eingetragen — wartet auf Bestätigung des Gegners');
            }} style={{...btn(T.o,'#000'),opacity:rs1===''||rs2===''?.45:1}}>
              Eintragen
            </button>
            <button onClick={()=>setReport(null)}
              style={{...btn('none',T.t3,T.border),marginTop:8}}>Abbrechen</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HUB SCREENS — Tournament + RITMO Bibel

   TournamentHub bündelt "Turnier starten" + "Turnier beitreten" als
   zwei große Karten; das frühere "Turnier beitreten" auf dem Home-
   Screen ist hierher umgezogen. RitmoBibel bündelt Regelwerk +
   Journey unter einem gemeinsamen Dach.
═══════════════════════════════════════════════════════════════ */

/* Wiederverwendbare große Hub-Karte: Icon-Tile links, Titel + Desc,
   Chevron rechts. Animationen erbt sie über className="fu". */
function HubBigCard({icon,title,desc,onClick,accent,delay='0s'}){
  return(
    <button onClick={onClick} className="fu" data-lift
      style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:23,
        padding:'20px 22px',display:'flex',alignItems:'center',gap:18,
        cursor:'pointer',color:T.t1,textAlign:'left',
        animationDelay:delay,width:'100%'}}
      onPointerDown={e=>e.currentTarget.style.background=T.card2}
      onPointerUp={e=>e.currentTarget.style.background=T.card}
      onPointerLeave={e=>e.currentTarget.style.background=T.card}>
      <div style={{flexShrink:0,width:54,height:54,borderRadius:19,
        background:`${accent||T.o}22`,
        border:`1px solid ${accent||T.o}`,
        color:accent||T.o,
        display:'flex',alignItems:'center',justifyContent:'center'}}>
        {icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:accent||T.o,fontSize:18,fontWeight:800,letterSpacing:-.2,marginBottom:3}}>
          {title}
        </div>
        <div style={{color:T.t3,fontSize:12,fontWeight:500,lineHeight:1.55}}>
          {desc}
        </div>
      </div>
      <ChevronRightIcon size={20} color={T.t3}/>
    </button>
  );
}

function TournamentHub({onHome,onStart,onJoin,onCup}){
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)'}}>
      <ScreenHeader title="Turnier" subtitle="Spiele austragen oder einsteigen."
        icon={<TrophyIcon size={40}/>}/>

      <div style={{flex:1,padding:'0 22px 120px',overflowY:'auto',
        WebkitOverflowScrolling:'touch',display:'flex',flexDirection:'column',gap:14}}>
        <HubBigCard
          icon={<TrophyIcon size={28}/>}
          title="Turnier starten"
          desc="Americano oder Mexicano — du bist Host."
          onClick={onStart} delay=".02s"/>
        <HubBigCard
          icon={<JoinIcon size={28}/>}
          title="Turnier beitreten"
          desc="PIN eingeben oder QR scannen, Ergebnisse übertragen."
          onClick={onJoin} delay=".06s"/>
        <HubBigCard
          icon={<DNAIcon size={26} color={T.blue}/>}
          title="RITMO DNA CUP"
          desc="Event-Modus 18.07. — Zugang nur mit PIN."
          onClick={onCup} accent={T.blue} delay=".1s"/>
      </div>

      <GlassActionBar actions={[
        {label:'Turnier starten',primary:true,onClick:onStart},
        {label:'Beitreten',onClick:onJoin},
      ]}/>
      <MatchBar onHome={onHome}/>
    </div>
  );
}

function RitmoBibel({onHome,onRules,onJourney,onFaq,onTab}){
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)'}}>
      <ScreenHeader title="Bibel" subtitle="Regeln, Taktik und alles dazwischen."
        icon={<BookIcon size={36}/>}/>

      <div style={{flex:1,padding:'0 22px 120px',overflowY:'auto',
        WebkitOverflowScrolling:'touch',display:'flex',flexDirection:'column',gap:14}}>
        <HubBigCard
          icon={<BookIcon size={28}/>}
          title="Regelwerk"
          desc="Padel-Regeln, Formate, Begriffe."
          onClick={onRules} delay=".02s"/>
        <HubBigCard
          icon={<JourneyIcon size={28}/>}
          title="Journey"
          desc="Tipps & Tricks, Taktik, Material."
          onClick={onJourney} delay=".06s"/>
        <HubBigCard
          icon={<BookIcon size={28}/>}
          title="App FAQ"
          desc="Häufige Fragen zur RITMO App."
          onClick={onFaq} delay=".1s"/>
      </div>

      <BottomFade/>
      {/* Bibel ist jetzt Haupt-Tab → Navbar; Fallback für alte Aufrufer. */}
      {onTab?<TabBar active="bibel" onTab={onTab}/>:<MatchBar onHome={onHome}/>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REGELWERK (Rules) — Übersicht + Detail-Screens
═══════════════════════════════════════════════════════════════ */
function RulesH({children}){
  return <div style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.4,
    textTransform:'uppercase',marginTop:18,marginBottom:6}}>{children}</div>;
}
function RulesP({children}){
  return <div style={{color:T.t2,fontSize:13,lineHeight:1.6,marginBottom:4}}>{children}</div>;
}
function RulesUl({items}){
  return(
    <ul style={{margin:0,padding:0,listStyle:'none'}}>
      {items.map((item,i)=>(
        <li key={i} style={{color:T.t2,fontSize:13,lineHeight:1.55,
          paddingLeft:14,position:'relative',marginBottom:3}}>
          <span style={{position:'absolute',left:0,color:T.o,fontWeight:700}}>·</span>
          {item}
        </li>
      ))}
    </ul>
  );
}
function RulesDef({term,children}){
  return(
    <div style={{marginBottom:8}}>
      <span style={{color:T.t1,fontSize:13,fontWeight:700}}>{term}</span>
      <span style={{color:T.t2,fontSize:13,lineHeight:1.5}}> — {children}</span>
    </div>
  );
}

/* ───── Shared shell for detail screens ───── */
function RulesDetailLayout({icon,title,sub,visual,children,onBackToRules,onHome,
  onNext,onPrev,currentIdx,totalSections,backIcon}){
  const[dx,setDx]=useState(0);
  const[animating,setAnimating]=useState(false);
  const dragRef=useRef({active:false,startX:0,startY:0,isHoriz:false,decided:false});

  const onTouchStart=(e)=>{
    if(animating) return;
    const t=e.touches?e.touches[0]:e;
    dragRef.current={active:true,startX:t.clientX,startY:t.clientY,
      isHoriz:false,decided:false};
  };
  const onTouchMove=(e)=>{
    if(!dragRef.current.active||animating) return;
    const t=e.touches?e.touches[0]:e;
    const ddx=t.clientX-dragRef.current.startX;
    const ddy=t.clientY-dragRef.current.startY;
    if(!dragRef.current.decided){
      if(Math.abs(ddx)>8||Math.abs(ddy)>8){
        dragRef.current.isHoriz=Math.abs(ddx)>Math.abs(ddy);
        dragRef.current.decided=true;
      }
    }
    if(dragRef.current.isHoriz){
      // Edge resistance at start/end
      let applied=ddx;
      if((ddx>0&&!onPrev)||(ddx<0&&!onNext)) applied=ddx*0.25;
      setDx(applied);
    }
  };
  const onTouchEnd=()=>{
    if(!dragRef.current.active) return;
    const wasHoriz=dragRef.current.isHoriz;
    const finalDx=dx;
    dragRef.current.active=false;
    if(wasHoriz){
      const threshold=70;
      if(finalDx<-threshold&&onNext){
        setAnimating(true);
        setDx(-window.innerWidth);
        setTimeout(()=>{onNext();setDx(0);setAnimating(false);},220);
        return;
      } else if(finalDx>threshold&&onPrev){
        setAnimating(true);
        setDx(window.innerWidth);
        setTimeout(()=>{onPrev();setDx(0);setAnimating(false);},220);
        return;
      }
    }
    setDx(0);
  };

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 22px 8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <div style={{width:42,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:22,fontWeight:800,letterSpacing:-.3}}>{title}</div>
            <div style={{color:T.t3,fontSize:12,marginTop:2,fontWeight:500}}>{sub}</div>
          </div>
        </div>
        {totalSections>1&&(
          <div style={{display:'flex',gap:6,justifyContent:'center',
            padding:'10px 0 4px',alignItems:'center'}}>
            {Array.from({length:totalSections}).map((_,i)=>(
              <div key={i} style={{
                width:i===currentIdx?18:6,height:6,borderRadius:3,
                background:i===currentIdx?T.o:T.t4,
                transition:'all .25s ease'}}/>
            ))}
          </div>
        )}
      </div>

      <div style={{flex:1,padding:'0 22px',overflowY:'auto',
        WebkitOverflowScrolling:'touch',
        transform:`translateX(${dx}px)`,
        transition:dragRef.current.active?'none':'transform .22s ease',
        willChange:'transform'}}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onMouseDown={onTouchStart}
        onMouseMove={(e)=>dragRef.current.active&&onTouchMove(e)}
        onMouseUp={onTouchEnd}
        onMouseLeave={()=>dragRef.current.active&&onTouchEnd()}>
        {visual&&(
          <div className="fi" style={{background:T.card,border:`1px solid ${T.border}`,
            borderRadius:19,padding:16,marginBottom:18,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            {visual}
          </div>
        )}
        <div className="fu" style={{animationDelay:'.1s'}}>
          {children}
        </div>
      </div>

      <MatchBar onHome={onHome} rightButtons={[
        {icon:backIcon||<BookIcon size={18}/>,onClick:onBackToRules}
      ]}/>
    </div>
  );
}

/* ───── Animated visual: Padel Court diagram (portrait, 20m × 10m) ───── */
function CourtVisual(){
  return(
    <svg viewBox="0 0 140 220" style={{width:'auto',maxHeight:280,height:'70vh',display:'block'}}>
      <defs>
        <style>{`
          .court-line { stroke-dasharray: 600; stroke-dashoffset: 600;
            animation: drawLine 1.4s ease forwards; }
          .court-line.delay1 { animation-delay: .3s; }
          .court-line.delay2 { animation-delay: .6s; }
          .court-line.delay3 { animation-delay: .9s; }
          @keyframes drawLine { to { stroke-dashoffset: 0; } }
          @keyframes fadeIn2 { from { opacity: 0 } to { opacity: 1 } }
          .court-label { opacity: 0; animation: fadeIn2 .6s ease forwards; animation-delay: 1.2s; }
        `}</style>
      </defs>
      {/* Court outline — 100 wide × 180 tall (10m × 20m proportion) */}
      <rect className="court-line" x="20" y="20" width="100" height="180" rx="2"
        fill="rgba(255,255,255,0.04)" stroke="var(--t1)" strokeWidth="1.6"/>
      {/* Net — horizontal across middle (long axis split) */}
      <line className="court-line delay1" x1="20" y1="110" x2="120" y2="110"
        stroke="var(--o)" strokeWidth="2" strokeDasharray="3 2"/>
      {/* Service lines — 3m from net = ~27 units (out of 90 per half) */}
      <line className="court-line delay2" x1="20" y1="83" x2="120" y2="83"
        stroke="var(--t1)" strokeWidth="1" opacity="0.6"/>
      <line className="court-line delay2" x1="20" y1="137" x2="120" y2="137"
        stroke="var(--t1)" strokeWidth="1" opacity="0.6"/>
      {/* Center service line — vertical between service lines */}
      <line className="court-line delay3" x1="70" y1="83" x2="70" y2="137"
        stroke="var(--t1)" strokeWidth="1" opacity="0.6"/>
      {/* Labels */}
      <text className="court-label" x="70" y="14" textAnchor="middle"
        fontSize="7" fill="var(--t3)" letterSpacing="1.5">10 m</text>
      <text className="court-label" x="11" y="113" textAnchor="middle"
        fontSize="7" fill="var(--t3)" letterSpacing="1.5"
        transform="rotate(-90 11 113)">20 m</text>
      <text className="court-label" x="70" y="214" textAnchor="middle"
        fontSize="7" fill="var(--o)" fontWeight="700" letterSpacing="2">NETZ</text>
    </svg>
  );
}

/* ───── Bo3 score hierarchy pyramid ───── */
function Bo3HierarchyVisual(){
  const rows=[
    {label:'MATCH',sub:'Best of 3',color:T.o,bars:[100]},
    {label:'SÄTZE',sub:'2 zum Sieg',color:T.t1,bars:[48,48]},
    {label:'SPIELE',sub:'6 (+2 Vorsprung)',color:T.t2,bars:[16,16,16,16,16,16]},
    {label:'PUNKTE',sub:'0/15/30/40',color:T.t3,bars:[10,10,10,10]},
  ];
  return(
    <div style={{width:'100%',maxWidth:300,display:'flex',flexDirection:'column',gap:10}}>
      {rows.map((row,i)=>(
        <div key={row.label} className="fu" style={{animationDelay:`${i*.15}s`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',
            marginBottom:4}}>
            <div style={{color:row.color,fontSize:11,fontWeight:700,letterSpacing:1.5}}>
              {row.label}</div>
            <div style={{color:T.t3,fontSize:10,fontWeight:500}}>{row.sub}</div>
          </div>
          <div style={{display:'flex',gap:3}}>
            {row.bars.map((w,j)=>(
              <div key={j} style={{flex:w,height:8,borderRadius:4,
                background:row.color,opacity:0.85-i*0.15}}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───── Americano rotation diagram ───── */
function AmericanoRotationVisual(){
  const players=[
    {label:'A',x:60,y:30,delay:0},
    {label:'B',x:140,y:60,delay:.15},
    {label:'C',x:60,y:130,delay:.3},
    {label:'D',x:140,y:160,delay:.45},
  ];
  return(
    <svg viewBox="0 0 200 200" style={{width:'100%',maxWidth:240,height:'auto'}}>
      <defs>
        <marker id="rotArr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="var(--o)"/>
        </marker>
        <style>{`
          .rot-player { animation: rotPop .5s ease backwards; }
          @keyframes rotPop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      </defs>
      {/* Rotation arrows in a soft circular pattern */}
      <path d="M 85 35 Q 130 30 145 70" stroke="var(--o)" strokeWidth="1.4"
        fill="none" markerEnd="url(#rotArr)" opacity="0.7"/>
      <path d="M 145 95 Q 130 130 90 130" stroke="var(--o)" strokeWidth="1.4"
        fill="none" markerEnd="url(#rotArr)" opacity="0.7"/>
      <path d="M 80 135 Q 110 160 130 160" stroke="var(--o)" strokeWidth="1.4"
        fill="none" markerEnd="url(#rotArr)" opacity="0.7"/>
      <path d="M 145 130 Q 165 100 90 35" stroke="var(--o)" strokeWidth="1.4"
        fill="none" strokeDasharray="3 2" opacity="0.4"/>

      {players.map(p=>(
        <g key={p.label} className="rot-player" style={{transformOrigin:`${p.x}px ${p.y}px`,
          animationDelay:`${p.delay}s`}}>
          <circle cx={p.x} cy={p.y} r="18" fill="var(--card2)"
            stroke="var(--o)" strokeWidth="1.5"/>
          <text x={p.x} y={p.y+1} textAnchor="middle" dominantBaseline="middle"
            fontSize="14" fontWeight="800" fill="var(--t1)">{p.label}</text>
        </g>
      ))}
      <text x="100" y="195" textAnchor="middle" fontSize="7"
        fill="var(--t3)" letterSpacing="2" fontWeight="600">ZUFÄLLIGE PAARUNGEN PRO RUNDE</text>
    </svg>
  );
}

/* ───── Mexicano pairing diagram ───── */
function MexicanoPairingVisual(){
  const ranks=[1,2,3,4,5,6,7,8];
  return(
    <svg viewBox="0 0 280 140" style={{width:'100%',maxWidth:340,height:'auto'}}>
      <defs>
        <style>{`
          .pair-line { stroke-dasharray: 200; stroke-dashoffset: 200;
            animation: drawP 1s ease forwards; }
          @keyframes drawP { to { stroke-dashoffset: 0; } }
        `}</style>
      </defs>
      {/* Court labels */}
      <text x="65" y="14" textAnchor="middle" fontSize="9" fontWeight="700"
        fill="var(--o)" letterSpacing="1.5">COURT 1</text>
      <text x="215" y="14" textAnchor="middle" fontSize="9" fontWeight="700"
        fill="var(--o)" letterSpacing="1.5">COURT 2</text>

      {/* Rank circles in a row */}
      {ranks.map((r,i)=>{
        const x=20+i*32;
        return(
          <g key={r}>
            <circle cx={x} cy="40" r="13" fill="var(--card2)"
              stroke="var(--o)" strokeWidth="1.5"/>
            <text x={x} y="41" textAnchor="middle" dominantBaseline="middle"
              fontSize="11" fontWeight="800" fill="var(--t1)">{r}</text>
            <text x={x} y="70" textAnchor="middle" fontSize="7"
              fill="var(--t3)" letterSpacing=".5">{r===1?'TOP':r===8?'LAST':''}</text>
          </g>
        );
      })}

      {/* Pairing arcs (1-4 vs 2-3, 5-8 vs 6-7) */}
      <path className="pair-line" d="M 20 53 Q 50 100 116 53"
        stroke="var(--o)" strokeWidth="1.7" fill="none" opacity="0.85"
        style={{animationDelay:'.2s'}}/>
      <path className="pair-line" d="M 52 53 Q 70 80 84 53"
        stroke="var(--blue)" strokeWidth="1.7" fill="none" opacity="0.85"
        style={{animationDelay:'.4s'}}/>
      <path className="pair-line" d="M 148 53 Q 180 100 244 53"
        stroke="var(--o)" strokeWidth="1.7" fill="none" opacity="0.85"
        style={{animationDelay:'.6s'}}/>
      <path className="pair-line" d="M 180 53 Q 200 80 212 53"
        stroke="var(--blue)" strokeWidth="1.7" fill="none" opacity="0.85"
        style={{animationDelay:'.8s'}}/>

      {/* Legend */}
      <g transform="translate(0,105)">
        <rect x="20" y="0" width="14" height="3" fill="var(--o)" rx="1.5"/>
        <text x="40" y="3" fontSize="8" fill="var(--t2)" dominantBaseline="middle">Team 1 (1+4)</text>
        <rect x="120" y="0" width="14" height="3" fill="var(--blue)" rx="1.5"/>
        <text x="140" y="3" fontSize="8" fill="var(--t2)" dominantBaseline="middle">Team 2 (2+3)</text>
      </g>
      <text x="140" y="128" textAnchor="middle" fontSize="7"
        fill="var(--t3)" letterSpacing="1.5" fontWeight="600">
        TOP + LOW  vs  MITTEN-PAARUNG → AUSGEGLICHENE MATCHES
      </text>
    </svg>
  );
}

/* ───── Pausen-Pool visual ───── */
function PausenPoolVisual(){
  const players=['A','B','C','D','E'];
  const paused=2; // E (index 4) and C (index 2) — show one
  return(
    <svg viewBox="0 0 240 130" style={{width:'100%',maxWidth:300,height:'auto'}}>
      <defs>
        <style>{`
          .pulse { animation: pulse 2s ease infinite; transform-origin: center; }
          @keyframes pulse { 0%,100% { opacity:0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
        `}</style>
      </defs>
      <text x="120" y="12" textAnchor="middle" fontSize="8" fontWeight="700"
        fill="var(--o)" letterSpacing="1.5">5 SPIELER · 1 COURT</text>

      {/* Active 4 players */}
      <text x="55" y="34" textAnchor="middle" fontSize="6"
        fill="var(--t3)" letterSpacing="1">SPIELT</text>
      {[0,1,2,3].map(i=>{
        const x=20+i*30;
        const isPlayingNow=i!==paused;
        return(
          <g key={i}>
            <circle cx={x} cy="55" r="11" 
              fill={isPlayingNow?'var(--card2)':'transparent'}
              stroke={isPlayingNow?'var(--o)':'var(--t4)'}
              strokeWidth="1.5"
              strokeDasharray={isPlayingNow?'0':'2 2'}/>
            <text x={x} y="56" textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fontWeight="800"
              fill={isPlayingNow?'var(--t1)':'var(--t3)'}>{players[i]}</text>
          </g>
        );
      })}

      {/* Paused player on right */}
      <text x="195" y="34" textAnchor="middle" fontSize="6"
        fill="var(--t3)" letterSpacing="1">PAUSIERT</text>
      <g className="pulse" style={{transformOrigin:'195px 55px'}}>
        <circle cx="195" cy="55" r="13"
          fill="var(--oSoft)" stroke="var(--o)" strokeWidth="1.8"/>
        <text x="195" y="56" textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fontWeight="800" fill="var(--o)">{players[paused]}</text>
      </g>

      {/* Rotation arrow */}
      <path d="M 170 55 Q 130 95 90 80" stroke="var(--o)" strokeWidth="1.4"
        strokeDasharray="3 2" fill="none" opacity="0.55"/>
      <polygon points="92 76, 86 79, 90 82" fill="var(--o)" opacity="0.55"/>

      <text x="120" y="115" textAnchor="middle" fontSize="7"
        fill="var(--t3)" letterSpacing="1.5" fontWeight="600">
        ROTATION: WER AM WENIGSTEN PAUSIERT HAT, SITZT AUS
      </text>
    </svg>
  );
}

/* ───── Shot illustrations: stick-figure player + racket + ball ─────
   Common defs: arrow marker. Base body: head + torso + legs.
   Each shot overrides arms, racket position, ball location & trajectory.
─────────────────────────────────────────────────────────────────── */
function ShotBase({head=true,leftArm,rightArm,racket,ball,trajectory,arrowId}){
  return(
    <>
      <defs>
        <marker id={arrowId} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="var(--o)"/>
        </marker>
      </defs>
      {/* Head */}
      {head&&<circle cx="78" cy="32" r="10" fill="var(--t1)" opacity="0.85"/>}
      {/* Torso */}
      <line x1="78" y1="42" x2="78" y2="105" stroke="var(--t1)" strokeWidth="4" strokeLinecap="round"/>
      {/* Legs */}
      <line x1="78" y1="105" x2="60" y2="158" stroke="var(--t1)" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="78" y1="105" x2="96" y2="158" stroke="var(--t1)" strokeWidth="3.5" strokeLinecap="round"/>
      {/* Arms (per-shot) */}
      {leftArm}
      {rightArm}
      {/* Racket */}
      {racket}
      {/* Ball */}
      {ball}
      {/* Trajectory */}
      {trajectory}
    </>
  );
}

function SmashFigure(){
  return(
    <svg viewBox="0 0 160 180" style={{width:'100%',maxWidth:140,height:'auto',display:'block'}}>
      <ShotBase
        arrowId="arrSmash"
        leftArm={<line x1="72" y1="52" x2="58" y2="80" stroke="var(--t1)" strokeWidth="3" strokeLinecap="round"/>}
        rightArm={<line x1="84" y1="52" x2="90" y2="14" stroke="var(--t1)" strokeWidth="3.5" strokeLinecap="round"/>}
        racket={<g transform="rotate(15 90 8)"><ellipse cx="90" cy="8" rx="8" ry="11" stroke="var(--o)" strokeWidth="2.4" fill="none"/><line x1="90" y1="14" x2="90" y2="20" stroke="var(--o)" strokeWidth="2"/></g>}
        ball={<><circle cx="98" cy="-2" r="4.5" fill="#E8FF3D" stroke="rgba(0,0,0,.4)" strokeWidth=".5"/><path d="M 95 -1 Q 98 -3.5 101 -1" stroke="rgba(255,255,255,.5)" fill="none"/></>}
        trajectory={<path d="M 96 6 Q 125 70 145 165" stroke="var(--o)" strokeWidth="1.6" strokeDasharray="3 3" fill="none" markerEnd="url(#arrSmash)" opacity="0.7"/>}
      />
    </svg>
  );
}

function BandejaFigure(){
  return(
    <svg viewBox="0 0 160 180" style={{width:'100%',maxWidth:140,height:'auto',display:'block'}}>
      <ShotBase
        arrowId="arrBand"
        leftArm={<line x1="72" y1="52" x2="62" y2="86" stroke="var(--t1)" strokeWidth="3" strokeLinecap="round"/>}
        rightArm={<><line x1="84" y1="52" x2="116" y2="32" stroke="var(--t1)" strokeWidth="3.5" strokeLinecap="round"/></>}
        racket={<g transform="rotate(55 122 28)"><ellipse cx="122" cy="28" rx="8" ry="11" stroke="var(--o)" strokeWidth="2.4" fill="none"/><line x1="122" y1="34" x2="122" y2="40" stroke="var(--o)" strokeWidth="2"/></g>}
        ball={<><circle cx="132" cy="14" r="4.5" fill="#E8FF3D" stroke="rgba(0,0,0,.4)" strokeWidth=".5"/><path d="M 129 15 Q 132 12.5 135 15" stroke="rgba(255,255,255,.5)" fill="none"/></>}
        trajectory={<path d="M 130 22 Q 140 90 155 160" stroke="var(--o)" strokeWidth="1.4" strokeDasharray="3 3" fill="none" markerEnd="url(#arrBand)" opacity="0.6"/>}
      />
    </svg>
  );
}

function ViboraFigure(){
  return(
    <svg viewBox="0 0 160 180" style={{width:'100%',maxWidth:140,height:'auto',display:'block'}}>
      <ShotBase
        arrowId="arrVib"
        leftArm={<line x1="72" y1="52" x2="58" y2="82" stroke="var(--t1)" strokeWidth="3" strokeLinecap="round"/>}
        rightArm={<line x1="84" y1="52" x2="110" y2="42" stroke="var(--t1)" strokeWidth="3.5" strokeLinecap="round"/>}
        racket={<g transform="rotate(80 116 36)"><ellipse cx="116" cy="36" rx="8" ry="11" stroke="var(--o)" strokeWidth="2.4" fill="none"/><line x1="116" y1="42" x2="116" y2="48" stroke="var(--o)" strokeWidth="2"/></g>}
        ball={<><circle cx="125" cy="26" r="4.5" fill="#E8FF3D" stroke="rgba(0,0,0,.4)" strokeWidth=".5"/><path d="M 122 27 Q 125 24.5 128 27" stroke="rgba(255,255,255,.5)" fill="none"/></>}
        trajectory={<path d="M 122 35 Q 138 75 132 145" stroke="var(--o)" strokeWidth="1.6" strokeDasharray="3 2" fill="none" markerEnd="url(#arrVib)" opacity="0.7"/>}
      />
    </svg>
  );
}

function VoleaFigure(){
  return(
    <svg viewBox="0 0 160 180" style={{width:'100%',maxWidth:140,height:'auto',display:'block'}}>
      <ShotBase
        arrowId="arrVol"
        leftArm={<line x1="72" y1="52" x2="50" y2="70" stroke="var(--t1)" strokeWidth="3" strokeLinecap="round"/>}
        rightArm={<line x1="84" y1="52" x2="118" y2="68" stroke="var(--t1)" strokeWidth="3.5" strokeLinecap="round"/>}
        racket={<g transform="rotate(75 126 65)"><ellipse cx="126" cy="65" rx="8" ry="11" stroke="var(--o)" strokeWidth="2.4" fill="none"/><line x1="126" y1="71" x2="126" y2="77" stroke="var(--o)" strokeWidth="2"/></g>}
        ball={<><circle cx="138" cy="62" r="4.5" fill="#E8FF3D" stroke="rgba(0,0,0,.4)" strokeWidth=".5"/><path d="M 135 63 Q 138 60.5 141 63" stroke="rgba(255,255,255,.5)" fill="none"/></>}
        trajectory={<path d="M 140 64 L 155 62" stroke="var(--o)" strokeWidth="1.6" fill="none" markerEnd="url(#arrVol)" opacity="0.7"/>}
      />
    </svg>
  );
}

function DriveFigure(){
  return(
    <svg viewBox="0 0 160 180" style={{width:'100%',maxWidth:140,height:'auto',display:'block'}}>
      <ShotBase
        arrowId="arrDrv"
        leftArm={<line x1="72" y1="55" x2="55" y2="78" stroke="var(--t1)" strokeWidth="3" strokeLinecap="round"/>}
        rightArm={<line x1="84" y1="55" x2="42" y2="92" stroke="var(--t1)" strokeWidth="3.5" strokeLinecap="round"/>}
        racket={<g transform="rotate(-30 38 96)"><ellipse cx="38" cy="96" rx="8" ry="11" stroke="var(--o)" strokeWidth="2.4" fill="none"/><line x1="38" y1="102" x2="38" y2="108" stroke="var(--o)" strokeWidth="2"/></g>}
        ball={<><circle cx="50" cy="98" r="4.5" fill="#E8FF3D" stroke="rgba(0,0,0,.4)" strokeWidth=".5"/><path d="M 47 99 Q 50 96.5 53 99" stroke="rgba(255,255,255,.5)" fill="none"/></>}
        trajectory={<path d="M 54 96 Q 100 80 145 96" stroke="var(--o)" strokeWidth="1.6" strokeDasharray="3 3" fill="none" markerEnd="url(#arrDrv)" opacity="0.7"/>}
      />
    </svg>
  );
}

function GloboFigure(){
  return(
    <svg viewBox="0 0 160 180" style={{width:'100%',maxWidth:140,height:'auto',display:'block'}}>
      <ShotBase
        arrowId="arrGlb"
        leftArm={<line x1="72" y1="55" x2="60" y2="92" stroke="var(--t1)" strokeWidth="3" strokeLinecap="round"/>}
        rightArm={<line x1="84" y1="55" x2="48" y2="115" stroke="var(--t1)" strokeWidth="3.5" strokeLinecap="round"/>}
        racket={<g transform="rotate(-60 44 122)"><ellipse cx="44" cy="122" rx="8" ry="11" stroke="var(--o)" strokeWidth="2.4" fill="none"/><line x1="44" y1="128" x2="44" y2="134" stroke="var(--o)" strokeWidth="2"/></g>}
        ball={<><circle cx="58" cy="118" r="4.5" fill="#E8FF3D" stroke="rgba(0,0,0,.4)" strokeWidth=".5"/><path d="M 55 119 Q 58 116.5 61 119" stroke="rgba(255,255,255,.5)" fill="none"/></>}
        trajectory={<path d="M 62 115 Q 105 -10 155 130" stroke="var(--o)" strokeWidth="1.6" strokeDasharray="3 3" fill="none" markerEnd="url(#arrGlb)" opacity="0.7"/>}
      />
    </svg>
  );
}

function ChiquitaFigure(){
  return(
    <svg viewBox="0 0 160 180" style={{width:'100%',maxWidth:140,height:'auto',display:'block'}}>
      <ShotBase
        arrowId="arrChq"
        leftArm={<line x1="72" y1="55" x2="60" y2="82" stroke="var(--t1)" strokeWidth="3" strokeLinecap="round"/>}
        rightArm={<line x1="84" y1="55" x2="104" y2="92" stroke="var(--t1)" strokeWidth="3.5" strokeLinecap="round"/>}
        racket={<g transform="rotate(40 110 98)"><ellipse cx="110" cy="98" rx="8" ry="11" stroke="var(--o)" strokeWidth="2.4" fill="none"/><line x1="110" y1="104" x2="110" y2="110" stroke="var(--o)" strokeWidth="2"/></g>}
        ball={<><circle cx="120" cy="92" r="4.5" fill="#E8FF3D" stroke="rgba(0,0,0,.4)" strokeWidth=".5"/><path d="M 117 93 Q 120 90.5 123 93" stroke="rgba(255,255,255,.5)" fill="none"/></>}
        trajectory={<path d="M 124 88 Q 140 70 152 100" stroke="var(--o)" strokeWidth="1.4" strokeDasharray="3 2" fill="none" markerEnd="url(#arrChq)" opacity="0.7"/>}
      />
    </svg>
  );
}

/* ───── Rules — Übersicht ───── */
function Rules({onHome,onSelect,alreadyRead,onToggleRead,onBibel}){
  const sections=[
    {id:'basics',    icon:<TennisBallIcon size={24}/>,title:'Padel-Grundregeln', sub:'Aufschlag, Wände, Punktezählung'},
    {id:'bo3',       icon:<ScrollIcon size={24} color={T.o}/>,title:'Best of 3',         sub:'Klassisches Tennis-Scoring, Tiebreak bei 6:6'},
    {id:'americano', icon:<TrophyIcon size={26}/>,title:'Americano',         sub:'Wechselnde Partner, individuelle Punkte'},
    {id:'mexicano',  icon:<TargetIcon size={24} color={T.o}/>,title:'Mexicano',          sub:'Ranking-basierte Paarungen ab Runde 2'},
    {id:'rotation',  icon:<StopwatchIcon size={24} color={T.o}/>,title:'Pausen & Rotation', sub:'Fairer Rotations-Pool bei ungeraden Spielern'},
    {id:'glossar',   icon:<BookIcon size={24}/>,title:'Schlagarten',       sub:'Bandeja, Víbora, Smash & mehr'},
  ];
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>
      <div style={{padding:'0 22px 22px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <BookIcon size={32}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:26,fontWeight:800,letterSpacing:-.3}}>Regelwerk</div>
            <div style={{color:T.t2,fontSize:16,marginTop:2,fontWeight:400}}>
              Padel-Regeln, Formate, Begriffe.
            </div>
          </div>
          {onToggleRead&&<QuestionToggle filled={alreadyRead} onClick={onToggleRead}/>}
        </div>
      </div>
      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:10,
        overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
        {sections.map((s,i)=>(
          <button key={s.id} onClick={()=>onSelect(s.id)} className="fu"
            style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
              padding:'14px 16px',display:'flex',alignItems:'center',gap:14,
              cursor:'pointer',color:T.t1,textAlign:'left',
              animationDelay:`${i*40}ms`,transition:'background .15s, border-color .15s'}}
            onPointerDown={e=>e.currentTarget.style.background=T.card2}
            onPointerUp={e=>e.currentTarget.style.background=T.card}
            onPointerLeave={e=>e.currentTarget.style.background=T.card}>
            <div style={{width:32,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.t1,fontSize:15,fontWeight:700,marginBottom:2}}>{s.title}</div>
              <div style={{color:T.t3,fontSize:11,fontWeight:500}}>{s.sub}</div>
            </div>
            <div style={{color:T.t3,fontSize:18,fontWeight:600,width:16,textAlign:'center'}}>›</div>
          </button>
        ))}
      </div>
      <MatchBar onHome={onHome}
        rightButtons={onBibel?[{icon:<BookIcon size={20}/>,onClick:onBibel}]:[]}/>
    </div>
  );
}

/* ───── Detail screens (one per section) ───── */
function RulesBasics({onBackToRules,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon={<TennisBallIcon size={32}/>} title="Padel-Grundregeln"
      sub="Aufschlag, Wände, Punktezählung"
      visual={<CourtVisual/>}
      onBackToRules={onBackToRules} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}>
      <RulesH>Platz & Format</RulesH>
      <RulesP>Padel-Court ist 20 m × 10 m, umschlossen von 3 m Glas und 4 m Drahtgitter. Gespielt wird ausschließlich im Doppel — 2 vs 2.</RulesP>
      <RulesH>Aufschlag</RulesH>
      <RulesUl items={[
        'Unterhand-Aufschlag — Treffpunkt unterhalb der Hüfte',
        'Ball muss vor dem Schlag einmal am Boden aufspringen',
        'Erstes Aufschlag-Ziel: diagonales Service-Feld der Gegenseite',
        'Zwei Versuche pro Punkt (wie Tennis)',
        'Seitenwechsel innerhalb des Spiels: rechts → links → rechts …',
      ]}/>
      <RulesH>Wandspiel</RulesH>
      <RulesP>Nach dem Boden-Aufprall darf der Ball die eigenen Wände berühren und bleibt im Spiel. Direkter Wandkontakt vor dem Boden = Punkt für den Gegner.</RulesP>
      <RulesH>Punktezählung</RulesH>
      <RulesUl items={[
        '0 → 15 → 30 → 40 → Spiel',
        'Bei 40-40: Einstand (Deuce). 2 Punkte in Folge nötig',
        'Erster Punkt nach Einstand = Vorteil; danach 1 weiterer = Spiel',
      ]}/>
    </RulesDetailLayout>
  );
}

function RulesBo3({onBackToRules,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon={<ScrollIcon size={30} color={T.o}/>} title="Best of 3"
      sub="Klassisches Tennis-Scoring, Tiebreak bei 6:6"
      visual={<Bo3HierarchyVisual/>}
      onBackToRules={onBackToRules} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}>
      <RulesH>Satz- und Match-Struktur</RulesH>
      <RulesUl items={[
        'Match endet, sobald ein Team 2 Sätze gewinnt (max. 3 Sätze)',
        'Ein Satz: erstes Team mit 6 Spielen UND 2 Spielen Vorsprung',
        'Bei 5-5: weiterspielen bis 7-5 oder Tiebreak bei 6-6',
        'Beim Tiebreak (6-6): erstes Team mit 7 Punkten und 2 Vorsprung gewinnt den Satz',
      ]}/>
      <RulesH>Aufschlagswechsel</RulesH>
      <RulesUl items={[
        'Aufschlag wechselt nach jedem abgeschlossenen Spiel',
        'Im Tiebreak: 1. Punkt vom ursprünglichen Aufschläger, dann alle 2 Punkte Wechsel',
        'Service-Seite (rechts/links) alterniert mit jedem Punkt',
      ]}/>
      <RulesH>Visualisierung in dieser App</RulesH>
      <RulesP>Im Big-Screen siehst du rechts ein Court-Diagramm, das anzeigt, wer aufschlägt und in welche Service-Box der nächste Ball gespielt werden muss.</RulesP>
    </RulesDetailLayout>
  );
}

function RulesAmericano({onBackToRules,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon={<TrophyIcon size={34}/>} title="Americano"
      sub="Wechselnde Partner, individuelle Punkte"
      visual={<AmericanoRotationVisual/>}
      onBackToRules={onBackToRules} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}>
      <RulesH>Spielprinzip</RulesH>
      <RulesUl items={[
        'Doppel-Turnier mit rotierenden Partnern',
        'Jede Runde neue, zufällige Paarungen',
        'Algorithmus vermeidet Wiederholung gleicher Partner über mehrere Runden',
        'Individuelle Wertung — jeder Spieler sammelt eigene Punkte',
      ]}/>
      <RulesH>Scoring-Varianten</RulesH>
      <RulesUl items={[
        'Split-21: 21 Punkte pro Match werden zwischen beiden Teams aufgeteilt (z. B. 13-8)',
        'Zeit-basiert: feste Rundenzeit, am Ende der Zeit zählt der aktuelle Stand',
        'Unlimitiert (∞): Spiel läuft bis Timer-Ende oder manueller Stop',
      ]}/>
      <RulesH>Sieger-Modus</RulesH>
      <RulesUl items={[
        'Meiste Punkte: Summe aller in Matches gesammelten Punkte',
        'Meiste Siege: Anzahl gewonnener Matches',
      ]}/>
      <RulesH>Vorteile</RulesH>
      <RulesP>Ideal für gemischte Spielstärken — alle spielen mit jedem. Kein "stärkstes Team gewinnt" sondern individuelle Performance entscheidet.</RulesP>
    </RulesDetailLayout>
  );
}

function RulesMexicano({onBackToRules,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon={<TargetIcon size={30} color={T.o}/>} title="Mexicano"
      sub="Ranking-basierte Paarungen ab Runde 2"
      visual={<MexicanoPairingVisual/>}
      onBackToRules={onBackToRules} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}>
      <RulesH>Unterschied zu Americano</RulesH>
      <RulesP>Wie Americano, aber Paarungen werden nach Tabellenstand zusammengestellt. Hält das Niveau jedes Matches ausgeglichen.</RulesP>
      <RulesH>Paarungs-Logik</RulesH>
      <RulesUl items={[
        'Runde 1: zufällige Paarungen (wie Americano)',
        'Ab Runde 2: nach Tabellenstand sortieren',
        'Pro Court werden 4 nebeneinanderliegende Plätze gepaart:',
        'Platz 1 + Platz 4  vs  Platz 2 + Platz 3',
        'Court 2: Plätze 5+8 vs 6+7, usw.',
      ]}/>
      <RulesH>Effekt</RulesH>
      <RulesUl items={[
        'Top-Spieler treten gegen ähnlich starke Gegner an',
        'Schwächere Spieler werden mit stärkeren gepaart',
        'Spiele bleiben kompetitiv — kein "Walk-over"',
      ]}/>
    </RulesDetailLayout>
  );
}

function RulesRotation({onBackToRules,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon={<StopwatchIcon size={30} color={T.o}/>} title="Pausen & Rotation"
      sub="Fairer Rotations-Pool bei ungeraden Spielern"
      visual={<PausenPoolVisual/>}
      onBackToRules={onBackToRules} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}>
      <RulesH>Pausen-Logik</RulesH>
      <RulesUl items={[
        'Bei ungerader Spielerzahl (nicht durch 4 teilbar) pausieren Spieler pro Runde',
        'Anzahl der Pausierenden = Spieler − (Courts × 4)',
        'Faire Rotation: wer am wenigsten pausiert hat, sitzt als nächstes aus',
        'Bei Gleichstand entscheidet der Zufall (Tiebreak)',
        'Über genug Runden hat jeder gleich oft pausiert',
      ]}/>
      <RulesH>Pausen-Bonus (Punkte-Modus)</RulesH>
      <RulesP>Pausierte Spieler bekommen für die Pausenrunde den <strong style={{color:T.t1}}>aufgerundeten Mittelwert aller Punkte</strong> dieser Runde gutgeschrieben. So entgehen sie keinem Punkteverlust durch erzwungene Pause.</RulesP>
      <RulesH>Pausen-Bonus (Siege-Modus)</RulesH>
      <RulesP>Spieler in der <strong style={{color:T.t1}}>unteren Tabellenhälfte</strong> bekommen <strong style={{color:T.t1}}>+1 Sieg pro Pause</strong>. So fallen Spieler nicht weiter zurück, die ohnehin schon hinten liegen.</RulesP>
      <RulesH>Transparenz</RulesH>
      <RulesP>Im Tournament-Play öffnet das ?-Icon neben "Pausiert: …" eine Info-Box mit der aktuell aktiven Bonus-Regel. Im Leaderboard erscheint bei jedem Bonus-Empfänger ein "+X Pause"-Hinweis unter der Punktezahl.</RulesP>
    </RulesDetailLayout>
  );
}

function RulesGlossar({onBackToRules,onHome,onNext,onPrev,currentIdx,totalSections}){
  const shots=[
    {id:'smash',title:'Smash / Remate',Fig:SmashFigure,
      desc:'Kraftvoller Schlag aus der Luft. Treffpunkt direkt über dem Kopf, Trajektorie steil nach unten.',
      stance:'Körper unter dem Ball, beide Arme hoch — der linke zielt zum Ball, der rechte schwingt voll aus.'},
    {id:'bandeja',title:'Bandeja',Fig:BandejaFigure,
      desc:'Defensiver Smash mit Slice. Gleitende, kontrollierte Bewegung — weniger Power, mehr Genauigkeit.',
      stance:'Treffpunkt rechts und oberhalb des Kopfes. Racketfläche flach, Schwung von hoch nach tief mit Seitenschnitt.'},
    {id:'vibora',title:'Víbora',Fig:ViboraFigure,
      desc:'Kürzerer, schärferer Smash mit aggressivem Slice. Zwischen Bandeja und Smash — kontrolliert aber bissig.',
      stance:'Treffpunkt auf Schulterhöhe seitlich, Schlag mit gekürztem, schnellem Ausschwung.'},
    {id:'volea',title:'Volea',Fig:VoleaFigure,
      desc:'Volley — Schlag aus der Luft, ohne Bodenkontakt. Klassischer Netz-Schlag.',
      stance:'Frontal zum Netz, kompakte Bewegung. Racket vor dem Körper, Schlag aus der Schulter, kurzer Punch.'},
    {id:'drive',title:'Drive',Fig:DriveFigure,
      desc:'Grundlinienschlag mit Topspin, gerade oder cross gespielt. Klassischer Aufbau- oder Druck-Schlag.',
      stance:'Seitlicher Stand, Racket weit zurück geführt, Treffpunkt auf Hüfthöhe, Schwung von tief nach hoch.'},
    {id:'globo',title:'Globo',Fig:GloboFigure,
      desc:'Lob über die Gegner. Hoch und tief — zwingt das Gegner-Team zurück zur Grundlinie.',
      stance:'Tiefer Stand, Schläger unter dem Ball, weicher Schwung von tief nach hoch — der Ball muss fast vertikal nach oben.'},
    {id:'chiquita',title:'Chiquita',Fig:ChiquitaFigure,
      desc:'Kurzer, weicher Ball direkt hinters Netz. Technische Antwort auf Volleys am Netz.',
      stance:'Stand zentral, Racket leicht von oben nach unten geführt, weicher Touch ohne Schwung.'},
  ];
  return(
    <RulesDetailLayout icon={<BookIcon size={30}/>} title="Schlagarten"
      sub="Körperhaltung & Treffpunkt der wichtigsten Schläge"
      onBackToRules={onBackToRules} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {shots.map((s,i)=>(
          <div key={s.id} className="fu"
            style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
              padding:14,display:'flex',gap:14,animationDelay:`${i*60}ms`}}>
            <div style={{flexShrink:0,width:120,display:'flex',alignItems:'center',
              justifyContent:'center',background:T.card2,borderRadius:13,padding:6,
              border:`1px solid ${T.sep}`}}>
              <s.Fig/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.o,fontSize:16,fontWeight:800,marginBottom:4,letterSpacing:.2}}>{s.title}</div>
              <div style={{color:T.t2,fontSize:12,lineHeight:1.5,marginBottom:6}}>{s.desc}</div>
              <div style={{color:T.t3,fontSize:11,lineHeight:1.5,
                padding:'6px 8px',background:T.card2,borderRadius:6,
                borderLeft:`2px solid ${T.o}`}}>
                <span style={{color:T.t1,fontWeight:700}}>Haltung: </span>{s.stance}
              </div>
            </div>
          </div>
        ))}

        <RulesH>Weitere Begriffe</RulesH>
        <RulesDef term="Por 3 / x3">Ball geht durch die Glasecke ins Aus — Punktgewinn, wenn der Gegner ihn nicht zurückholen kann.</RulesDef>
        <RulesDef term="Por 4 / x4">Ball wird über die Wand gespielt — extrem schwer zu retournieren.</RulesDef>
        <RulesDef term="Contrapared">Ball aus der eigenen Wand zurück übers Netz — kontrollierte Verteidigung.</RulesDef>
        <RulesDef term="Doble Pared">Ball berührt 2 Wände nach Boden-Aufprall — bleibt weiterhin im Spiel.</RulesDef>
      </div>
    </RulesDetailLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   JOURNEY — Tipps & Tricks
═══════════════════════════════════════════════════════════════ */

function AngabenVisual(){
  return(
    <svg viewBox="0 0 140 220" style={{width:'auto',maxHeight:260,height:'62vh',display:'block'}}>
      <defs>
        <style>{`
          @keyframes drawIn { to { stroke-dashoffset: 0; } }
          .ang-arc { stroke-dasharray: 200; stroke-dashoffset: 200; animation: drawIn 1.4s ease forwards; animation-delay: .3s; }
        `}</style>
      </defs>
      <rect x="20" y="20" width="100" height="180" rx="2" fill="rgba(255,255,255,0.04)"
        stroke="var(--t1)" strokeWidth="1.8"/>
      <line x1="20" y1="110" x2="120" y2="110" stroke="var(--o)" strokeWidth="2" strokeDasharray="3 2"/>
      <line x1="20" y1="83" x2="120" y2="83" stroke="var(--t1)" strokeWidth="1.4"/>
      <line x1="20" y1="137" x2="120" y2="137" stroke="var(--t1)" strokeWidth="1.4"/>
      <line x1="70" y1="83" x2="70" y2="137" stroke="var(--t1)" strokeWidth="1.4"/>
      <rect x="20" y="83" width="50" height="27" fill="var(--oSoft)" stroke="var(--o)"
        strokeWidth="0.8" opacity="0.85"/>
      <text x="45" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="14"
        fill="var(--o)" fontWeight="800">×</text>
      <circle cx="95" cy="180" r="7" fill="var(--o)"/>
      <text x="95" y="180" textAnchor="middle" dominantBaseline="middle" fontSize="7"
        fill="white" fontWeight="800">A</text>
      <text x="95" y="195" textAnchor="middle" fontSize="6" fill="var(--t2)"
        fontWeight="700" letterSpacing="0.5">AUFSCHLAG</text>
      <path className="ang-arc" d="M 95 175 Q 65 110 45 95"
        stroke="var(--o)" strokeWidth="1.6" strokeDasharray="3 2" fill="none" opacity="0.8"/>
      <circle r="3" fill="#E8FF3D" stroke="rgba(0,0,0,.4)" strokeWidth="0.5">
        <animateMotion dur="2.4s" repeatCount="indefinite" begin="1s"
          path="M 95 175 Q 65 110 45 95"/>
      </circle>
      <text x="70" y="14" textAnchor="middle" fontSize="7" fill="var(--o)"
        fontWeight="700" letterSpacing="1.5">DIAGONAL · UNTER DER HÜFTE</text>
    </svg>
  );
}

function AufstellungenVisual(){
  return(
    <svg viewBox="0 0 140 220" style={{width:'auto',maxHeight:260,height:'62vh',display:'block'}}>
      <defs>
        <style>{`
          @keyframes pulseDot { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
          .pulse-dot { animation: pulseDot 1.8s ease infinite; }
        `}</style>
      </defs>
      <rect x="20" y="20" width="100" height="180" rx="2" fill="rgba(255,255,255,0.04)"
        stroke="var(--t1)" strokeWidth="1.8"/>
      <line x1="20" y1="110" x2="120" y2="110" stroke="var(--o)" strokeWidth="2" strokeDasharray="3 2"/>
      <line x1="20" y1="83" x2="120" y2="83" stroke="var(--t1)" strokeWidth="1.2" opacity="0.55"/>
      <line x1="20" y1="137" x2="120" y2="137" stroke="var(--t1)" strokeWidth="1.2" opacity="0.55"/>
      <line x1="70" y1="83" x2="70" y2="137" stroke="var(--t1)" strokeWidth="1.2" opacity="0.55"/>
      <g className="pulse-dot">
        <circle cx="50" cy="175" r="7" fill="var(--o)"/>
        <text x="50" y="175" textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill="white" fontWeight="800">A1</text>
        <text x="50" y="192" textAnchor="middle" fontSize="5.5" fill="var(--t3)" fontWeight="600">HINTEN</text>
      </g>
      <g className="pulse-dot" style={{animationDelay:'.3s'}}>
        <circle cx="90" cy="135" r="7" fill="var(--o)"/>
        <text x="90" y="135" textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill="white" fontWeight="800">A2</text>
        <text x="90" y="152" textAnchor="middle" fontSize="5.5" fill="var(--t3)" fontWeight="600">NETZ</text>
      </g>
      <g className="pulse-dot" style={{animationDelay:'.6s'}}>
        <circle cx="90" cy="45" r="7" fill="var(--blue)"/>
        <text x="90" y="45" textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill="white" fontWeight="800">B1</text>
        <text x="90" y="32" textAnchor="middle" fontSize="5.5" fill="var(--t3)" fontWeight="600">HINTEN</text>
      </g>
      <g className="pulse-dot" style={{animationDelay:'.9s'}}>
        <circle cx="50" cy="85" r="7" fill="var(--blue)"/>
        <text x="50" y="85" textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill="white" fontWeight="800">B2</text>
        <text x="50" y="72" textAnchor="middle" fontSize="5.5" fill="var(--t3)" fontWeight="600">NETZ</text>
      </g>
      <text x="70" y="14" textAnchor="middle" fontSize="7" fill="var(--o)" fontWeight="700" letterSpacing="1.5">EINER NETZ · EINER HINTEN</text>
      <text x="70" y="214" textAnchor="middle" fontSize="6" fill="var(--t3)" opacity="0.7" letterSpacing="1">DIAGONALE DECKUNG · MITTE SCHLIESST</text>
    </svg>
  );
}

function HandSeitenVisual(){
  return(
    <svg viewBox="0 0 200 200" style={{width:'auto',maxHeight:240,height:'58vh',display:'block'}}>
      <defs>
        <style>{`
          @keyframes fadeArrow { 0% { opacity: 0 } 50% { opacity: 1 } 100% { opacity: 0.4 } }
          .fade-arrow { animation: fadeArrow 2.4s ease infinite; }
        `}</style>
      </defs>
      <text x="100" y="14" textAnchor="middle" fontSize="8" fill="var(--o)" fontWeight="700" letterSpacing="1.5">VORHÄNDE ZUR MITTE</text>
      <rect x="30" y="30" width="140" height="130" rx="3" fill="rgba(255,255,255,0.04)" stroke="var(--t1)" strokeWidth="1.4"/>
      <line x1="100" y1="30" x2="100" y2="160" stroke="var(--t1)" strokeWidth="1.1" opacity="0.45" strokeDasharray="3 2"/>
      <g transform="translate(60, 95)">
        <circle r="14" fill="var(--card2)" stroke="var(--o)" strokeWidth="1.8"/>
        <text y="0" textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="var(--o)" fontWeight="800">R</text>
        <line x1="13" y1="-2" x2="28" y2="-2" stroke="var(--o)" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="33" cy="-2" rx="5" ry="6" fill="none" stroke="var(--o)" strokeWidth="1.6"/>
        <text y="32" textAnchor="middle" fontSize="6" fill="var(--t3)" fontWeight="600" letterSpacing="0.5">RECHTSHÄNDER</text>
      </g>
      <g transform="translate(140, 95)">
        <circle r="14" fill="var(--card2)" stroke="var(--blue)" strokeWidth="1.8"/>
        <text y="0" textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="var(--blue)" fontWeight="800">L</text>
        <line x1="-13" y1="-2" x2="-28" y2="-2" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="-33" cy="-2" rx="5" ry="6" fill="none" stroke="var(--blue)" strokeWidth="1.6"/>
        <text y="32" textAnchor="middle" fontSize="6" fill="var(--t3)" fontWeight="600" letterSpacing="0.5">LINKSHÄNDER</text>
      </g>
      <g className="fade-arrow">
        <path d="M 93 75 L 107 75" stroke="var(--o)" strokeWidth="1.4" strokeLinecap="round"/>
        <polygon points="93 75, 96 73, 96 77" fill="var(--o)"/>
        <polygon points="107 75, 104 73, 104 77" fill="var(--o)"/>
      </g>
      <text x="100" y="186" textAnchor="middle" fontSize="6.5" fill="var(--o)" opacity="0.85" fontWeight="700">OPTIMALE PADEL-PAARUNG</text>
    </svg>
  );
}

function SchlagwahlVisual(){
  return(
    <svg viewBox="0 0 220 200" style={{width:'auto',maxHeight:240,height:'58vh',display:'block'}}>
      <text x="110" y="14" textAnchor="middle" fontSize="8" fill="var(--o)" fontWeight="700" letterSpacing="1.5">BALLHÖHE → SCHLAGART</text>
      <text x="110" y="26" textAnchor="middle" fontSize="6" fill="var(--t3)" opacity="0.8" letterSpacing="1">HOCH = AGGRESSIV · TIEF = KONTROLLE</text>
      <g className="fi" style={{animationDelay:'.1s'}}>
        <rect x="30" y="38" width="160" height="42" rx="8" fill="var(--oSoft)" stroke="var(--o)" strokeWidth="1.4"/>
        <text x="46" y="58" fontSize="9" fill="var(--o)" fontWeight="800">HOCH</text>
        <text x="46" y="72" fontSize="6.5" fill="var(--t3)">über Schulter</text>
        <text x="180" y="58" textAnchor="end" fontSize="7.5" fill="var(--t1)" fontWeight="700">Smash</text>
        <text x="180" y="68" textAnchor="end" fontSize="6.5" fill="var(--t2)">Bandeja · Víbora</text>
      </g>
      <g className="fi" style={{animationDelay:'.25s'}}>
        <rect x="30" y="86" width="160" height="42" rx="8" fill="var(--blueSoft)" stroke="var(--blue)" strokeWidth="1.4"/>
        <text x="46" y="106" fontSize="9" fill="var(--blue)" fontWeight="800">MITTE</text>
        <text x="46" y="120" fontSize="6.5" fill="var(--t3)">Brust – Hüfte</text>
        <text x="180" y="106" textAnchor="end" fontSize="7.5" fill="var(--t1)" fontWeight="700">Volea</text>
        <text x="180" y="116" textAnchor="end" fontSize="6.5" fill="var(--t2)">Drive · Chiquita</text>
      </g>
      <g className="fi" style={{animationDelay:'.4s'}}>
        <rect x="30" y="134" width="160" height="42" rx="8" fill="rgba(255,255,255,0.04)" stroke="var(--t1)" strokeWidth="1.4"/>
        <text x="46" y="154" fontSize="9" fill="var(--t1)" fontWeight="800">TIEF</text>
        <text x="46" y="168" fontSize="6.5" fill="var(--t3)">unterhalb Hüfte</text>
        <text x="180" y="154" textAnchor="end" fontSize="7.5" fill="var(--t1)" fontWeight="700">Globo</text>
        <text x="180" y="164" textAnchor="end" fontSize="6.5" fill="var(--t2)">Drive · Reset</text>
      </g>
      <text x="110" y="190" textAnchor="middle" fontSize="6.5" fill="var(--t3)" opacity="0.7" letterSpacing="0.5">Nach Wand-Rückprall → Drive oder Globo</text>
    </svg>
  );
}

function SchlaegerVisual(){
  return(
    <svg viewBox="0 0 240 200" style={{width:'auto',maxHeight:240,height:'58vh',display:'block'}}>
      <text x="120" y="14" textAnchor="middle" fontSize="8" fill="var(--o)" fontWeight="700" letterSpacing="1.5">3 SCHLÄGER-FORMEN</text>
      <g transform="translate(50, 32)" className="fi">
        <ellipse cx="0" cy="42" rx="22" ry="28" fill="rgba(255,255,255,0.05)" stroke="var(--o)" strokeWidth="1.6"/>
        <circle cx="0" cy="42" r="7" fill="var(--oSoft)" stroke="var(--o)" strokeWidth="1.2"/>
        <line x1="0" y1="72" x2="0" y2="98" stroke="var(--o)" strokeWidth="3.5" strokeLinecap="round"/>
        <text y="120" textAnchor="middle" fontSize="9" fill="var(--t1)" fontWeight="800">Rund</text>
        <text y="134" textAnchor="middle" fontSize="6.5" fill="var(--t3)">Kontrolle</text>
        <text y="146" textAnchor="middle" fontSize="6" fill="var(--t3)" opacity="0.7">Anfänger</text>
      </g>
      <g transform="translate(120, 32)" className="fi" style={{animationDelay:'.1s'}}>
        <path d="M 0 14 L 22 42 L 0 70 L -22 42 Z" fill="rgba(255,255,255,0.05)" stroke="var(--o)" strokeWidth="1.6" strokeLinejoin="round"/>
        <circle cx="0" cy="30" r="7" fill="var(--oSoft)" stroke="var(--o)" strokeWidth="1.2"/>
        <line x1="0" y1="72" x2="0" y2="98" stroke="var(--o)" strokeWidth="3.5" strokeLinecap="round"/>
        <text y="120" textAnchor="middle" fontSize="9" fill="var(--t1)" fontWeight="800">Diamant</text>
        <text y="134" textAnchor="middle" fontSize="6.5" fill="var(--t3)">Power</text>
        <text y="146" textAnchor="middle" fontSize="6" fill="var(--t3)" opacity="0.7">Smash-Spieler</text>
      </g>
      <g transform="translate(190, 32)" className="fi" style={{animationDelay:'.2s'}}>
        <path d="M 0 14 Q 22 22 22 44 Q 22 70 0 70 Q -22 70 -22 44 Q -22 22 0 14 Z" fill="rgba(255,255,255,0.05)" stroke="var(--o)" strokeWidth="1.6"/>
        <circle cx="0" cy="36" r="7" fill="var(--oSoft)" stroke="var(--o)" strokeWidth="1.2"/>
        <line x1="0" y1="72" x2="0" y2="98" stroke="var(--o)" strokeWidth="3.5" strokeLinecap="round"/>
        <text y="120" textAnchor="middle" fontSize="9" fill="var(--t1)" fontWeight="800">Tropfen</text>
        <text y="134" textAnchor="middle" fontSize="6.5" fill="var(--t3)">Allround</text>
        <text y="146" textAnchor="middle" fontSize="6" fill="var(--t3)" opacity="0.7">Fortgeschr.</text>
      </g>
      <text x="120" y="186" textAnchor="middle" fontSize="6" fill="var(--o)" opacity="0.7" fontWeight="700" letterSpacing="1">SWEET SPOT (ORANGE) WANDERT NACH OBEN</text>
    </svg>
  );
}

function BaelleVisual(){
  return(
    <svg viewBox="0 0 240 200" style={{width:'auto',maxHeight:240,height:'58vh',display:'block'}}>
      <text x="120" y="14" textAnchor="middle" fontSize="8" fill="var(--o)" fontWeight="700" letterSpacing="1.5">TENNIS vs PADEL</text>
      <g transform="translate(70, 55)" className="fi">
        <circle r="32" fill="#E8FF3D" stroke="rgba(0,0,0,.3)" strokeWidth="0.6"/>
        <path d="M -32 0 Q -16 -12 0 -10 Q 16 -12 32 0" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" fill="none"/>
        <path d="M -32 0 Q -16 12 0 10 Q 16 12 32 0" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" fill="none"/>
        <text y="52" textAnchor="middle" fontSize="9" fill="var(--t1)" fontWeight="800">TENNIS</text>
        <text y="64" textAnchor="middle" fontSize="6" fill="var(--t3)">~6.5 cm</text>
      </g>
      <g transform="translate(170, 55)" className="fi" style={{animationDelay:'.15s'}}>
        <circle r="30" fill="#E8FF3D" stroke="rgba(0,0,0,.3)" strokeWidth="0.6"/>
        <path d="M -30 0 Q -15 -11 0 -9 Q 15 -11 30 0" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" fill="none"/>
        <path d="M -30 0 Q -15 11 0 9 Q 15 11 30 0" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" fill="none"/>
        <text y="52" textAnchor="middle" fontSize="9" fill="var(--t1)" fontWeight="800">PADEL</text>
        <text y="64" textAnchor="middle" fontSize="6" fill="var(--t3)">~6.3 cm</text>
      </g>
      <g transform="translate(0, 138)">
        <text x="120" y="0" textAnchor="middle" fontSize="6" fill="var(--t3)" fontWeight="700" letterSpacing="1.2">INNENDRUCK (PSI)</text>
        <text x="22" y="16" fontSize="7" fill="var(--t2)" fontWeight="700">T</text>
        <rect x="36" y="10" width="170" height="6" rx="3" fill="var(--card2)"/>
        <rect x="36" y="10" width="155" height="6" rx="3" fill="var(--o)"/>
        <text x="210" y="16" fontSize="6" fill="var(--t2)" textAnchor="end" fontWeight="600">14 PSI</text>
        <text x="22" y="32" fontSize="7" fill="var(--t2)" fontWeight="700">P</text>
        <rect x="36" y="26" width="170" height="6" rx="3" fill="var(--card2)"/>
        <rect x="36" y="26" width="55" height="6" rx="3" fill="var(--blue)"/>
        <text x="210" y="32" fontSize="6" fill="var(--t2)" textAnchor="end" fontWeight="600">~5 PSI</text>
      </g>
      <text x="120" y="190" textAnchor="middle" fontSize="6" fill="var(--t3)" opacity="0.7" letterSpacing="0.5">Padel-Ball springt niedriger · mehr Kontrolle</text>
    </svg>
  );
}

function Journey({onHome,onSelect,alreadyRead,onToggleRead,onBibel}){
  const sections=[
    {id:'ritmodna',     icon:<DNAIcon size={24} color={T.o}/>,title:'RITMO DNA',     sub:'Stil · Chemie · Tier-Matching · Levels'},
    {id:'spielstile',   icon:<MaskIcon size={24} color={T.o}/>,title:'Spielstile',    sub:'Die 6 Padel-Personalities'},
    {id:'angaben',      icon:<TargetIcon size={24} color={T.o}/>,title:'Aufschlag',     sub:'Reihenfolge, Position & Strategie'},
    {id:'aufstellungen',icon:<PeopleIcon size={24} color={T.o}/>,title:'Aufstellungen', sub:'Netz, Hinten, Verteidigung, Angriff'},
    {id:'haende',       icon:<HandIcon size={24} color={T.o}/>,title:'Hand-Seiten',   sub:'Links-/Rechtshänder am Court'},
    {id:'schlagwahl',   icon:<TennisBallIcon size={24}/>,title:'Schlagwahl',    sub:'Wann welche Schlagart?'},
    {id:'schlaeger',    icon:<RacketMini size={24} color={T.o}/>,title:'Schläger',      sub:'Rund, Diamant, Tropfen — Materialkunde'},
    {id:'baelle',       icon:<TennisBallIcon size={24}/>,title:'Bälle',         sub:'Tennis vs Padel — die Unterschiede'},
  ];
  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>
      <div style={{padding:'0 22px 22px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <JourneyIcon size={32}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:26,fontWeight:800,letterSpacing:-.3}}>Journey</div>
            <div style={{color:T.t2,fontSize:16,marginTop:2,fontWeight:400}}>
              Tipps & Tricks für dein Padel-Spiel.
            </div>
          </div>
          {onToggleRead&&<QuestionToggle filled={alreadyRead} onClick={onToggleRead}/>}
        </div>
      </div>
      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:10,
        overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
        {sections.map((s,i)=>(
          <button key={s.id} onClick={()=>onSelect(s.id)} className="fu"
            style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
              padding:'14px 16px',display:'flex',alignItems:'center',gap:14,
              cursor:'pointer',color:T.t1,textAlign:'left',
              animationDelay:`${i*40}ms`,transition:'background .15s, border-color .15s'}}
            onPointerDown={e=>e.currentTarget.style.background=T.card2}
            onPointerUp={e=>e.currentTarget.style.background=T.card}
            onPointerLeave={e=>e.currentTarget.style.background=T.card}>
            <div style={{width:32,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.t1,fontSize:15,fontWeight:700,marginBottom:2}}>{s.title}</div>
              <div style={{color:T.t3,fontSize:11,fontWeight:500}}>{s.sub}</div>
            </div>
            <div style={{color:T.t3,fontSize:18,fontWeight:600,width:16,textAlign:'center'}}>›</div>
          </button>
        ))}
      </div>
      <MatchBar onHome={onHome}
        rightButtons={onBibel?[{icon:<BookIcon size={20}/>,onClick:onBibel}]:[]}/>
    </div>
  );
}

const J_BACK={backIcon:<JourneyIcon size={18}/>};

/* ── JourneySpielstileList — Overview of 6 styles ──────────────── */
function JourneySpielstileList({onBack,onHome,onSelect}){
  const order=['chico','toro','individuoso','muro','fantasma','motor','hysterica'];
  const[imgErr,setImgErr]=useState({});

  return(
    <div style={{height:'100dvh',background:T.bgGrad,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>
      <div style={{padding:'0 22px 8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <div style={{width:42,display:'flex',justifyContent:'center'}}><MaskIcon size={30} color={T.o}/></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:22,fontWeight:800,letterSpacing:-.3}}>
              Die 6 Spielstile
            </div>
            <div style={{color:T.t3,fontSize:12,marginTop:2,fontWeight:500}}>
              Jeder Padel-Typ — Stärken, Schwächen und Partner.
            </div>
          </div>
        </div>
      </div>

      {/* Style cards */}
      <div style={{flex:1,padding:'14px 22px 0',display:'flex',flexDirection:'column',gap:10,
        overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
        {order.map((id,i)=>{
          const s=PADEL_STYLES[id];
          const fn=STYLE_IMAGES[id];
          return(
            <button key={id} onClick={()=>onSelect(id)} className="fu"
              style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:19,
                padding:0,display:'flex',alignItems:'stretch',gap:0,
                cursor:'pointer',color:T.t1,textAlign:'left',overflow:'hidden',
                animationDelay:`${i*40}ms`,transition:'border-color .15s'}}
              onPointerDown={e=>e.currentTarget.style.borderColor=s.accent}
              onPointerUp={e=>e.currentTarget.style.borderColor=T.border}
              onPointerLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <div style={{width:96,flexShrink:0,background:s.accent,
                position:'relative',overflow:'hidden'}}>
                {imgErr[id]?(
                  <div style={{width:'100%',height:'100%',display:'flex',
                    alignItems:'center',justifyContent:'center',color:'white',
                    fontSize:22,fontWeight:900}}>
                    {s.symbol}
                  </div>
                ):(
                  <img src={`${getAssetBase()}assets/${fn}`}
                    onError={()=>setImgErr(e=>({...e,[id]:true}))}
                    style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                    alt={s.name}/>
                )}
              </div>
              <div style={{flex:1,minWidth:0,padding:'14px 14px 14px 16px',
                display:'flex',flexDirection:'column',justifyContent:'center'}}>
                <div style={{display:'flex',alignItems:'baseline',gap:7,marginBottom:3}}>
                  <div style={{color:s.accent,fontSize:16,fontWeight:900,letterSpacing:-.2}}>
                    {s.name}
                  </div>
                  <div style={{color:T.t3,fontSize:10,fontWeight:600,letterSpacing:.5,
                    textTransform:'uppercase'}}>{s.subtitle}</div>
                </div>
                <div style={{color:T.t2,fontSize:11,lineHeight:1.5,fontStyle:'italic'}}>
                  „{s.tagline}"
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',paddingRight:14,
                color:T.t3,fontSize:20,fontWeight:600}}>›</div>
            </button>
          );
        })}
      </div>
      <MatchBar onHome={onHome} rightButtons={[
        {icon:<JourneyIcon size={18}/>,onClick:onBack}
      ]}/>
    </div>
  );
}

/* ── JourneySpielstile — Detail via RulesDetailLayout ──────────── */
function JourneySpielstile({styleId,onBack,onHome,onNext,onPrev,currentIdx,totalSections,onPartnerJump}){
  const style=PADEL_STYLES[styleId];
  const filename=STYLE_IMAGES[styleId];
  const[imgErr,setImgErr]=useState(false);

  if(!style) return null;

  const hero=imgErr?(
    <div style={{width:'100%',aspectRatio:'7/5',background:style.accent,
      display:'flex',alignItems:'center',justifyContent:'center',
      color:'white',fontSize:28,fontWeight:900,letterSpacing:1.5,borderRadius:8}}>
      {style.name.toUpperCase()}
    </div>
  ):(
    <img src={`${getAssetBase()}assets/${filename}`}
      onError={()=>setImgErr(true)}
      style={{width:'100%',height:'auto',aspectRatio:'7/5',
        objectFit:'cover',display:'block',borderRadius:8}}
      alt={style.name}/>
  );

  return(
    <RulesDetailLayout
      icon={<span style={{fontSize:28,fontWeight:900,lineHeight:1,color:style.accent}}>{style.symbol}</span>}
      title={style.name}
      sub={style.subtitle}
      visual={hero}
      onBackToRules={onBack}
      onHome={onHome}
      onNext={onNext}
      onPrev={onPrev}
      currentIdx={currentIdx}
      totalSections={totalSections}
      backIcon={<JourneyIcon size={18}/>}>

      {/* Tagline */}
      <div style={{color:style.accent,fontSize:16,fontWeight:600,fontStyle:'italic',
        marginBottom:14,lineHeight:1.4}}>
        „{style.tagline}"
      </div>

      {/* Description */}
      <div style={{color:T.t2,fontSize:16,lineHeight:1.6,marginBottom:18}}>
        {style.desc}
      </div>

      {/* Strengths */}
      <SectionTitle accent={style.accent}>Stärken</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
        {style.strengths.map(s=>(
          <div key={s} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
            <div style={{width:5,height:5,borderRadius:'50%',background:style.accent,
              marginTop:7,flexShrink:0}}/>
            <div style={{color:T.t1,fontSize:13,lineHeight:1.5}}>{s}</div>
          </div>
        ))}
      </div>

      {/* Weaknesses */}
      <SectionTitle accent={T.t3}>Schwächen</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
        {style.weaknesses.map(w=>(
          <div key={w} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
            <div style={{width:5,height:5,borderRadius:'50%',background:T.t4,
              marginTop:7,flexShrink:0}}/>
            <div style={{color:T.t2,fontSize:13,lineHeight:1.5}}>{w}</div>
          </div>
        ))}
      </div>

      {/* Kernwerte */}
      <SectionTitle accent={style.accent}>Kernwerte</SectionTitle>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {style.kernwerte.map(k=>(
          <div key={k} style={{padding:'5px 11px',background:style.accent,
            borderRadius:25,color:'white',fontSize:11,fontWeight:700,letterSpacing:.5}}>
            {k}
          </div>
        ))}
      </div>

      {/* Shots */}
      <SectionTitle accent={style.accent}>Typische Shots</SectionTitle>
      <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:18}}>
        {style.shots.map(sh=>(
          <div key={sh} style={{padding:'4px 10px',background:T.card,
            border:`1px solid ${T.border}`,borderRadius:19,
            color:T.t1,fontSize:11,fontWeight:500}}>{sh}</div>
        ))}
      </div>

      {/* Partners */}
      <SectionTitle accent={style.accent}>Passt gut zu</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18}}>
        {style.partners.map(p=>{
          const pStyle=PADEL_STYLES[p.id];
          const pFile=STYLE_IMAGES[p.id];
          return(
            <PartnerCard key={p.id} pStyle={pStyle} pFile={pFile}
              why={p.why}
              onClick={()=>onPartnerJump&&onPartnerJump(p.id)}/>
          );
        })}
      </div>
    </RulesDetailLayout>
  );
}

/* Partner card — extracted so onClick can be passed cleanly */
function PartnerCard({pStyle,pFile,why,onClick}){
  const[err,setErr]=useState(false);
  return(
    <button onClick={onClick}
      style={{display:'flex',gap:12,alignItems:'center',
        background:pStyle.card,border:`1px solid ${pStyle.accent}40`,
        borderRadius:15,padding:10,cursor:'pointer',textAlign:'left',
        color:'inherit'}}>
      <div style={{width:56,height:40,borderRadius:6,overflow:'hidden',
        flexShrink:0,background:pStyle.accent}}>
        {err?(
          <div style={{width:'100%',height:'100%',display:'flex',
            alignItems:'center',justifyContent:'center',color:'white',
            fontSize:18,fontWeight:800}}>{pStyle.symbol}</div>
        ):(
          <img src={`${getAssetBase()}assets/${pFile}`}
            onError={()=>setErr(true)}
            style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
            alt={pStyle.name}/>
        )}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:2}}>
          <div style={{color:pStyle.accent,fontSize:13,fontWeight:800}}>
            {pStyle.name}
          </div>
          <div style={{color:T.t3,fontSize:10}}>{pStyle.subtitle}</div>
        </div>
        <div style={{color:T.t2,fontSize:11,lineHeight:1.4}}>{why}</div>
      </div>
      <div style={{color:T.t3,fontSize:16}}>›</div>
    </button>
  );
}

function SectionTitle({children,accent}){
  return(
    <div style={{color:accent||T.t3,fontSize:10,fontWeight:800,letterSpacing:1.5,
      textTransform:'uppercase',marginBottom:8,marginTop:0}}>{children}</div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   JOURNEY: RITMO DNA — Edukative Sektion
   Erklärt Matching-Ebenen, Match-Tier, Levels und Beispiele
═══════════════════════════════════════════════════════════════ */

const MATCHING_LEVELS=[
  {id:'duo',     name:'Duo',     subtitle:'Partner Matching',  symbol:'⊕',
   desc:'Stärken ergänzen, Schwächen ausgleichen. Für die perfekte Teamchemie.',
   color:'#3498DB'},
  {id:'mirror',  name:'Mirror',  subtitle:'Spiegel Matching',  symbol:'≡',
   desc:'Gleicher Stil, gleiche DNA. Hohe Identität, aber Risiko von Schwächen-Dopplung.',
   color:'#E67E22'},
  {id:'counter', name:'Counter', subtitle:'Gegensatz Matching',symbol:'≠',
   desc:'Stil-Konflikte verstehen und gezielt herausfordern. Der Clash der Archetypen.',
   color:'#9B59B6'},
];

const MATCH_TIERS=[
  {id:'S', name:'S-TIER', subtitle:'Elite Synergy',
   desc:'Perfekte Stilergänzung und ähnliches Spielniveau.', stars:5, color:'#1A8754'},
  {id:'A', name:'A-TIER', subtitle:'Starke Chemie',
   desc:'Sehr gute Kombination und kleiner Level-Unterschied.', stars:4, color:'#3498DB'},
  {id:'B', name:'B-TIER', subtitle:'Solides Match',
   desc:'Spielbar, aber Anpassung und Kommunikation nötig.', stars:3, color:'#F39C12'},
  {id:'C', name:'C-TIER', subtitle:'Reibungs-Match',
   desc:'Stil-Konflikte oder Levelreibung — mehr Aufwand, weniger Flow.', stars:2, color:'#E67E22'},
  {id:'X', name:'X-TIER', subtitle:'Chaos Mode',
   desc:'Bewusst wild und unvorhersehbar — für Spaß, Experimente und Events.', stars:1, color:'#9B59B6'},
];

const PLAYER_LEVELS=[
  {id:'L1', label:'Beginner',         desc:'Grundlagen verstehen und erste Erfahrungen sammeln.',                  color:'#7F8C8D'},
  {id:'L2', label:'Fortgeschritten',  desc:'Solide Technik, konstante Fortschritte und einfache Spielzüge.',       color:'#16A085'},
  {id:'L3', label:'Kompetitiv',       desc:'Sicheres Spiel, taktisches Denken und gezielte Schlagwahl.',           color:'#27AE60'},
  {id:'L4', label:'Expert',           desc:'Hohe Konstanz, komplexe Taktik und kontrollierte Spielsituationen.',   color:'#2980B9'},
  {id:'L5', label:'Master',           desc:'Wettkampfniveau mit präziser Technik und mentaler Stärke.',            color:'#C0392B'},
  {id:'L6', label:'Elite',            desc:'Spitzenamateur — antizipiert das Spiel, dominiert Rallyes.',            color:'#8E44AD'},
  {id:'L7', label:'Ikone',            desc:'Maximales Niveau — Padel als Kunst, Stil prägend für andere.',          color:'#F39C12'},
];

function JourneyRitmoDNA({onBackToJourney,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout
      icon={<DNAIcon size={32} color={T.o}/>}
      title="RITMO DNA"
      sub="Dein Stil. Deine Chemie. Dein Rhythmus."
      visual={
        <div style={{padding:'20px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <div style={{color:T.t1,fontSize:40,fontWeight:900,letterSpacing:-1,lineHeight:1}}>
              RITMO
            </div>
            <div style={{color:T.o,fontSize:40,fontWeight:900,letterSpacing:-1,lineHeight:1}}>
              DNA
            </div>
          </div>
          <div style={{color:T.t2,fontSize:13,textAlign:'center',letterSpacing:.5}}>
            Kenne deinen Stil. Finde deinen Rhythmus.
          </div>
        </div>
      }
      onBackToRules={onBackToJourney}
      onHome={onHome}
      onNext={onNext}
      onPrev={onPrev}
      currentIdx={currentIdx}
      totalSections={totalSections}
      backIcon={<JourneyIcon size={18}/>}>

      <div style={{color:T.t2,fontSize:16,lineHeight:1.6,marginBottom:22}}>
        RITMO DNA ist das System hinter den Partner- und Gegner-Matchings.
        Es kombiniert Spielstil-Chemie und Spielniveau zu einem Tier-Ranking — damit du
        weißt, wie gut Spieler:innen zusammenpassen.
      </div>

      {/* 1. MATCHING-EBENEN */}
      <SectionTitle accent={T.o}>1. Matching-Ebenen</SectionTitle>
      <div style={{color:T.t2,fontSize:13,marginBottom:14,lineHeight:1.5}}>
        Wie funktioniert das Matching?
      </div>
      {MATCHING_LEVELS.map(m=>(
        <div key={m.id} style={{background:T.card,border:`1px solid ${T.border}`,
          borderRadius:15,padding:'14px 16px',marginBottom:10,
          display:'flex',gap:14,alignItems:'flex-start'}}>
          <div style={{width:42,height:42,borderRadius:'50%',flexShrink:0,
            background:`${m.color}22`,border:`1.5px solid ${m.color}`,
            display:'flex',alignItems:'center',justifyContent:'center',
            color:m.color,fontSize:22,fontWeight:900}}>{m.symbol}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:m.color,fontSize:16,fontWeight:900,letterSpacing:-.2,
              marginBottom:2}}>{m.name}</div>
            <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1,
              textTransform:'uppercase',marginBottom:6}}>{m.subtitle}</div>
            <div style={{color:T.t2,fontSize:12,lineHeight:1.5}}>{m.desc}</div>
          </div>
        </div>
      ))}

      <div style={{height:20}}/>

      {/* 2. MATCH TIER */}
      <SectionTitle accent={T.o}>2. Match Tier</SectionTitle>
      <div style={{color:T.t2,fontSize:13,marginBottom:14,lineHeight:1.5}}>
        Wie stark passt ihr zusammen?
      </div>
      {MATCH_TIERS.map(t=>(
        <div key={t.id} style={{background:T.card,border:`1px solid ${T.border}`,
          borderRadius:15,padding:'12px 16px',marginBottom:8,
          display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:36,height:36,borderRadius:'50%',flexShrink:0,
            background:t.color,color:'white',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:16,fontWeight:900,letterSpacing:-.5}}>{t.id}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:2}}>
              <div style={{color:t.color,fontSize:13,fontWeight:900,letterSpacing:-.2}}>
                {t.name}
              </div>
              <div style={{color:T.t3,fontSize:10,fontWeight:600,
                textTransform:'uppercase',letterSpacing:.5}}>{t.subtitle}</div>
            </div>
            <div style={{color:T.t2,fontSize:11,lineHeight:1.5,marginBottom:3}}>{t.desc}</div>
            <div style={{color:t.color,fontSize:11,letterSpacing:2}}>
              {'★'.repeat(t.stars)}{'☆'.repeat(5-t.stars)}
            </div>
          </div>
        </div>
      ))}

      <div style={{height:20}}/>

      {/* 3. LEVEL MATTERS */}
      <SectionTitle accent={T.o}>3. Level Matters</SectionTitle>
      <div style={{color:T.t2,fontSize:13,marginBottom:14,lineHeight:1.5}}>
        Das Level entscheidet — gleiches Niveau, höherer Match-Tier.
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:15,
        overflow:'hidden',marginBottom:14}}>
        {PLAYER_LEVELS.map((lv,i)=>(
          <div key={lv.id} style={{display:'flex',alignItems:'center',gap:12,
            padding:'14px 16px',borderTop:i>0?`1px solid ${T.sep}`:'none'}}>
            <div style={{width:44,height:36,borderRadius:6,flexShrink:0,
              background:lv.color,color:'white',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              gap:0}}>
              <div style={{fontSize:16,fontWeight:900,letterSpacing:-.5,lineHeight:1}}>{lv.id}</div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:lv.color,fontSize:13,fontWeight:800,marginBottom:1}}>
                {lv.label.toUpperCase()}
              </div>
              <div style={{color:T.t2,fontSize:11,lineHeight:1.4}}>{lv.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:13,
        padding:'14px 16px',marginBottom:22,color:T.t2,fontSize:12,lineHeight:1.6}}>
        <span style={{color:T.t1,fontWeight:700}}>Warum?</span> Je größer die Level-Differenz,
        desto höher die Gefahr von Dominanz und desto stärker leidet die Chemie. Spieler:innen
        auf gleichem Niveau erleben mehr Vertrauen und Impact.
      </div>

      {/* 4. EXAMPLES */}
      <SectionTitle accent={T.o}>Beispiele</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
        {/* Matching example */}
        <div style={{background:T.card,border:`1px solid #1A875440`,borderRadius:15,
          padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',
            marginBottom:8}}>
            <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.2,
              textTransform:'uppercase'}}>Matching-Beispiel</div>
            <div style={{color:'#1A8754',fontSize:12,fontWeight:900,letterSpacing:.5}}>S-TIER</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <div style={{padding:'5px 11px',background:'#C0392B',color:'white',
              borderRadius:6,fontSize:11,fontWeight:800,letterSpacing:.5}}>TORO L3</div>
            <div style={{color:T.t3,fontSize:16}}>+</div>
            <div style={{padding:'5px 11px',background:'#1E8449',color:'white',
              borderRadius:6,fontSize:11,fontWeight:800,letterSpacing:.5}}>MURO L3</div>
          </div>
          <div style={{color:T.t2,fontSize:12,lineHeight:1.5}}>
            Elite Synergy. Perfekte Balance zwischen Druck und Absicherung.
          </div>
        </div>

        {/* Counter example */}
        <div style={{background:T.card,border:`1px solid #3498DB40`,borderRadius:15,
          padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',
            marginBottom:8}}>
            <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.2,
              textTransform:'uppercase'}}>Counter-Beispiel</div>
            <div style={{color:'#3498DB',fontSize:12,fontWeight:900,letterSpacing:.5}}>A-TIER</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <div style={{padding:'5px 11px',background:'#C0392B',color:'white',
              borderRadius:6,fontSize:11,fontWeight:800,letterSpacing:.5}}>TORO L3</div>
            <div style={{color:T.t3,fontSize:11,fontWeight:700}}>vs</div>
            <div style={{padding:'5px 11px',background:'#1E8449',color:'white',
              borderRadius:6,fontSize:11,fontWeight:800,letterSpacing:.5}}>MURO L3</div>
          </div>
          <div style={{color:T.t2,fontSize:12,lineHeight:1.5}}>
            Spannungsreiches Duell. Power gegen Geduld, beide Stile fordern sich auf höchstem Niveau.
          </div>
        </div>

        {/* Mirror example */}
        <div style={{background:T.card,border:`1px solid #F39C1240`,borderRadius:15,
          padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',
            marginBottom:8}}>
            <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.2,
              textTransform:'uppercase'}}>Mirror-Beispiel</div>
            <div style={{color:'#F39C12',fontSize:12,fontWeight:900,letterSpacing:.5}}>B-TIER</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <div style={{padding:'5px 11px',background:'#C0392B',color:'white',
              borderRadius:6,fontSize:11,fontWeight:800,letterSpacing:.5}}>TORO L3</div>
            <div style={{color:T.t3,fontSize:16}}>+</div>
            <div style={{padding:'5px 11px',background:'#C0392B',color:'white',
              borderRadius:6,fontSize:11,fontWeight:800,letterSpacing:.5}}>TORO L3</div>
          </div>
          <div style={{color:T.t2,fontSize:12,lineHeight:1.5}}>
            Hohes Risiko. Doppelter Druck, doppelte Power — aber mehr Fehlerpotenzial und
            weniger Absicherung.
          </div>
        </div>
      </div>

      {/* 5. HOW IT WORKS */}
      <SectionTitle accent={T.o}>So funktioniert RITMO DNA</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {[
          {n:'1.',title:'Quiz machen',desc:'Finde deinen primären und sekundären Spielstil.'},
          {n:'2.',title:'Level wählen',desc:'Wähle dein aktuelles Spielniveau realistisch aus.'},
          {n:'3.',title:'Match finden',desc:'RITMO DNA berechnet die besten Partner und deine härtesten Gegner.'},
          {n:'4.',title:'Spielen',desc:'Verstehe die Dynamik. Nutze eure Chemie. Gewinne mit deinem Rhythmus.'},
        ].map(step=>(
          <div key={step.n} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:T.oSoft,
              border:`1.5px solid ${T.o}`,color:T.o,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:13,fontWeight:900,flexShrink:0}}>{step.n.replace('.','')}</div>
            <div style={{flex:1,minWidth:0,paddingTop:4}}>
              <div style={{color:T.t1,fontSize:16,fontWeight:800,marginBottom:3}}>{step.title}</div>
              <div style={{color:T.t2,fontSize:12,lineHeight:1.5}}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{height:30}}/>
    </RulesDetailLayout>
  );
}

function JourneyAngaben({onBackToJourney,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon={<TargetIcon size={30} color={T.o}/>} title="Aufschlag"
      sub="Reihenfolge, Position & Strategie"
      visual={<AngabenVisual/>}
      onBackToRules={onBackToJourney} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}
      {...J_BACK}>
      <RulesH>Reihenfolge</RulesH>
      <RulesUl items={[
        'Aufschlag wechselt nach jedem Spiel zur Gegen-Mannschaft',
        'Innerhalb eines Spiels schlägt derselbe Spieler durch',
        'Service-Seite alterniert mit jedem Punkt (rechts/links)',
      ]}/>
      <RulesH>Technik</RulesH>
      <RulesUl items={[
        'Treffpunkt UNTER der Hüfte (Pflicht)',
        'Ball muss vorher einmal am Boden aufspringen',
        'Ziel: diagonales Service-Feld der Gegenseite',
        'Zwei Versuche pro Punkt (wie Tennis)',
      ]}/>
      <RulesH>Strategie</RulesH>
      <RulesUl items={[
        'Variation in Effet & Tempo schlägt rohe Power',
        'T-Aufschlag (an die Mittellinie) holt Returner aus der Komfortzone',
        'Kurzer, niedriger Slice zwingt zum Vorrücken',
        'Aufschlag auf den Körper neutralisiert Vorhand und Rückhand',
      ]}/>
      <RulesH>Tipp</RulesH>
      <RulesP>Beim ersten Versuch ruhig riskanter spielen — der zweite muss "nur" rein. Genau wie Tennis: ein zweiter Aufschlag, der nicht angegriffen wird, ist Gold wert.</RulesP>
    </RulesDetailLayout>
  );
}

function JourneyAufstellungen({onBackToJourney,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon={<PeopleIcon size={30} color={T.o}/>} title="Aufstellungen"
      sub="Netz, Hinten, Verteidigung, Angriff"
      visual={<AufstellungenVisual/>}
      onBackToRules={onBackToJourney} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}
      {...J_BACK}>
      <RulesH>Grundregel</RulesH>
      <RulesP>Einer am Netz, einer hinten. Diese diagonale Aufstellung deckt den meisten Court ab.</RulesP>
      <RulesH>Phasen</RulesH>
      <RulesUl items={[
        'Aufschlag: Aufschläger hinten, Partner am Netz',
        'Return: Returner hinten, Partner am Netz',
        'Angriff: BEIDE am Netz nach gutem Schlag',
        'Verteidigung: BEIDE hinten wenn Gegner attackiert',
      ]}/>
      <RulesH>Tipps</RulesH>
      <RulesUl items={[
        'Nie beide gleichzeitig zurück — außer in echter Verteidigung',
        'Nie beide gleichzeitig vor — außer nach gutem Angriff',
        'Lücke zwischen euch schließen: ein leichter Diagonal-Versatz',
        'Wer den Ball spielt, kommunizieren (laut "MEIN!")',
      ]}/>
      <RulesH>Faustregel</RulesH>
      <RulesP>Das Netz-Spiel gewinnt. Wer am Netz steht, hat den Winkel-Vorteil. Aber niemals blind vorrücken — erst nach einem Schlag, der den Gegner unter Druck setzt.</RulesP>
    </RulesDetailLayout>
  );
}

function JourneyHaende({onBackToJourney,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon={<HandIcon size={30} color={T.o}/>} title="Hand-Seiten"
      sub="Links-/Rechtshänder am Court"
      visual={<HandSeitenVisual/>}
      onBackToRules={onBackToJourney} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}
      {...J_BACK}>
      <RulesH>Klassische Regel</RulesH>
      <RulesP>Die stärkere Vorhand zeigt zur Mitte. Dort kommen die meisten Bälle — Mitte ist der wichtigste Bereich.</RulesP>
      <RulesH>Rechtshänder + Rechtshänder</RulesH>
      <RulesUl items={[
        'Spieler 1 (stärker): links — Vorhand zur Mitte',
        'Spieler 2: rechts',
        'Die Mitte wird mit zwei Vorhänden gedeckt — gut',
        'Beide Rückhände stehen außen — schwächere Außen-Abdeckung',
      ]}/>
      <RulesH>Rechtshand + Linkshand — die "Padel-Aufstellung"</RulesH>
      <RulesUl items={[
        'Rechtshänder: links · Linkshänder: rechts',
        'BEIDE Vorhände decken die Mitte',
        'Beide Rückhände decken die Außenseite (zu den Wänden)',
        'Gilt in der Padel-Welt als optimale Paarung',
      ]}/>
      <RulesH>Wer steht wo?</RulesH>
      <RulesP>Die "Ad-Seite" (links beim Rechtshänder) entscheidet die wichtigen Punkte — Einstand, Vorteil, Match-Point. Dort gehört der stärkere/erfahrenere Spieler hin.</RulesP>
    </RulesDetailLayout>
  );
}

function JourneySchlagwahl({onBackToJourney,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon={<TennisBallIcon size={32}/>} title="Schlagwahl"
      sub="Wann welche Schlagart?"
      visual={<SchlagwahlVisual/>}
      onBackToRules={onBackToJourney} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}
      {...J_BACK}>
      <RulesH>Faustregel</RulesH>
      <RulesP>Ballhöhe entscheidet: <strong style={{color:T.t1}}>Hoch = aggressiv</strong>, <strong style={{color:T.t1}}>Mitte = Aufbau</strong>, <strong style={{color:T.t1}}>Tief = Kontrolle</strong>.</RulesP>
      <RulesH>Hoch (über Schulter)</RulesH>
      <RulesUl items={[
        'Nah am Netz → Smash / Remate',
        'Hinten am Court → Bandeja (Kontrolle statt Power)',
        'Mittlere Position → Víbora (Slice mit Biss)',
      ]}/>
      <RulesH>Mitte (Brust- bis Hüfthöhe)</RulesH>
      <RulesUl items={[
        'Am Netz → Volea (kompakter Punch)',
        'Grundlinie → Drive mit Topspin',
        'Gegen Netz-Spieler → Chiquita (weich, knapp übers Netz)',
      ]}/>
      <RulesH>Tief (unterhalb Hüfte)</RulesH>
      <RulesUl items={[
        'Globo (Lob) → Gegner zurück zwingen, Druck rausnehmen',
        'Flacher Drive → Verteidigung, Reset',
        'Nach Wand-Rückprall → ruhig spielen, nichts erzwingen',
      ]}/>
      <RulesH>Tipp</RulesH>
      <RulesP>Wenn unsicher: nicht den schwersten Schlag wählen, sondern den, der dich am Ball-Tausch hält. 90% der Punkte werden durch Fehler entschieden, nicht durch Winner.</RulesP>
    </RulesDetailLayout>
  );
}

function JourneySchlaeger({onBackToJourney,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon={<RacketMini size={30} color={T.o}/>} title="Schläger"
      sub="Rund, Diamant, Tropfen — Materialkunde"
      visual={<SchlaegerVisual/>}
      onBackToRules={onBackToJourney} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}
      {...J_BACK}>
      <RulesH>Drei Hauptformen</RulesH>
      <RulesDef term="Rund">Sweet Spot zentriert, maximale Kontrolle. Ideal für Anfänger und defensives Spiel.</RulesDef>
      <RulesDef term="Diamant">Sweet Spot oben, kopflastig, maximale Power. Für Smash-orientierte Spieler.</RulesDef>
      <RulesDef term="Tropfen">Sweet Spot oben-mittig, ausgewogen. Beliebte Allround-Wahl für Fortgeschrittene.</RulesDef>
      <RulesH>Gewicht</RulesH>
      <RulesUl items={[
        'Männer: 360-380 g',
        'Frauen: 340-365 g',
        'Schwerer = mehr Power, weniger Wendigkeit',
        'Leichter = mehr Spielgefühl, weniger Power',
      ]}/>
      <RulesH>Core (Kern)</RulesH>
      <RulesUl items={[
        'EVA-Soft → Komfort & Kontrolle, gut für Gelenke',
        'EVA-Hard → mehr Power & Direktheit, härter zum Arm',
        'Foam → sehr weich, Anfänger-Komfort',
      ]}/>
      <RulesH>Oberfläche & Löcher</RulesH>
      <RulesUl items={[
        'Glatt → mehr Power, weniger Spin',
        'Rauh (Sand-Coating) → mehr Spin, weniger Power',
        'Mehr Löcher → leichter, weniger stabil',
        'Weniger Löcher → stabiler, schwerer',
      ]}/>
      <RulesH>Tipp</RulesH>
      <RulesP>Anfänger sollten mit RUND + WEICH + LEICHT starten. Erst wenn die Technik sitzt, lohnt sich Diamant oder härtere Cores.</RulesP>
    </RulesDetailLayout>
  );
}

function JourneyBaelle({onBackToJourney,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon={<TennisBallIcon size={32}/>} title="Bälle"
      sub="Tennis vs Padel — die Unterschiede"
      visual={<BaelleVisual/>}
      onBackToRules={onBackToJourney} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}
      {...J_BACK}>
      <RulesH>Optisch identisch — technisch nicht</RulesH>
      <RulesP>Beide gelb, beide Filz. Aber Größe, Druck und Sprung-Verhalten unterscheiden sich.</RulesP>
      <RulesH>Größe & Druck</RulesH>
      <RulesUl items={[
        'Tennis: ~6.5 cm Durchmesser · 14 PSI Innendruck',
        'Padel: ~6.3 cm · nur 4.6-5.2 PSI',
        'Padel-Ball ist also etwas kleiner UND deutlich weniger unter Druck',
      ]}/>
      <RulesH>Sprung-Verhalten</RulesH>
      <RulesUl items={[
        'Aus 254 cm Höhe fallen gelassen:',
        'Tennis springt 135-147 cm hoch',
        'Padel springt 135-145 cm hoch',
        'Klingt ähnlich, aber Padel-Ball verlangsamt sich schneller',
      ]}/>
      <RulesH>Warum die Unterschiede wichtig sind</RulesH>
      <RulesUl items={[
        'Tennis-Ball auf Padel-Court: zu schnell, zu hoch nach Wand',
        'Padel-Ball auf Tennis-Court: zu langsam, zu wenig Sprung',
        'Niedrigerer Druck → langsamere Geschwindigkeit → mehr Kontrolle möglich',
        'Wand-Rückprall: Padel-Ball verliert Energie schneller, ist berechenbarer',
      ]}/>
      <RulesH>Lebensdauer</RulesH>
      <RulesUl items={[
        'Profis: alle 9 Spiele neuer Ball',
        'Hobby: nach 2-3 Sessions deutlicher Druck-Verlust',
        'Auch ungeöffnete Dosen verlieren Druck nach ~3 Wochen',
        'Tipp: Dose immer im Kühlschrank — verlängert Lebensdauer',
      ]}/>
    </RulesDetailLayout>
  );
}


/* ═══════════════════════════════════════════════════════════════
   FUNKY AMBIENT — Bauhaus Funky theme's living background layer.

   Mounted only when theme === 'funky'. Renders four layers that
   stack BEHIND the React app tree (z-index 0–3):
     1) Pexels stock video (autoplay, muted, looped, low opacity,
        blended over the conic-gradient defined in theme.js)
     2) Vignette darkening the edges so foreground content stays
        readable
     3) Marquee strip at the very top — kinetic typography that
        screams "this theme is different"
     4) Floating tropical fruit sprites scattered across the
        viewport, each on its own float keyframe

   Plus: a document-level pointerdown listener that spawns
   short-lived click ripples. All animations honour the global
   prefers-reduced-motion media query (via theme.js CSS).

   Stock-Video-URLs sind absichtlich an MEHRERE Kandidaten
   gebunden — der erste der lädt gewinnt; bei Netz-/CSP-Problemen
   degradiert die Komponente still zu "nur Gradient + Fruits".
═══════════════════════════════════════════════════════════════ */
const FUNKY_VIDEO_CANDIDATES = [
  // Pexels CDN-Direktlinks (frei nutzbar gemäß Pexels License).
  // SD-Auflösungen reichen, weil der Layer eh nur ~32% Opazität hat
  // und ständig blendet — höhere Auflösung wäre Daten-Verschwendung.
  'https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_24fps.mp4',
  'https://videos.pexels.com/video-files/3214448/3214448-sd_640_360_25fps.mp4',
  'https://videos.pexels.com/video-files/2491284/2491284-sd_640_360_30fps.mp4',
];

const FUNKY_MARQUEE_TEXT = [
  '★ RITMO PADEL', '◐ BAUHAUS FUNKY', '⚡ DISCO MODE',
  '✦ TROPICAL VIBES', '◉ SPIEL HEISS', '☀ SUNSET COURT',
  '♪ NEON SLAM', '✺ KIWI · KOKOSNUSS · ANANAS', '◆ EXPERIMENTAL THEME',
];

/* Generiert einen frischen Schwarm Tropical-Floaters mit zufälligen
   Positionen, Größen, Rotationen + Float-Timings. Wird beim Mount
   und nach jedem "Clear" (alle 9 sliced) neu aufgerufen. */
function buildFunkyFloaters(){
  const sprites=['kiwi','pineapple','coconut','ball','parrot'];
  return Array.from({length:9},(_,i)=>({
    key:Date.now()+'_'+i,                    // unique key über Respawns hinweg
    kind:sprites[i%sprites.length],
    left:Math.floor(8+Math.random()*84),     // %
    top: Math.floor(6+Math.random()*84),     // %
    size:Math.floor(28+Math.random()*30),
    rot: Math.floor(-25+Math.random()*50),
    dur: (4+Math.random()*5).toFixed(1),
    delay:(Math.random()*-6).toFixed(1),
    sliced:false,
  }));
}

function FunkyAmbient({scr}){
  // Floater-Schwarm jetzt stateful — Slice-Aktionen schalten einzelne
  // Sprites auf sliced:true, was die .funky-floater-sliced-Animation
  // triggert. Nach einer Cooldown-Pause wird der ganze Schwarm
  // erneuert (Respawn), damit "Fruit Ninja"-Modus wiederholbar bleibt.
  const[floaters,setFloaters]=useState(buildFunkyFloaters);

  // Racket-Position + Rotation für den Pointer-folgenden Schläger.
  // null = inaktiv (auf Desktop bleibt der Schläger zwischen Bewegungen
  // sichtbar; auf Touch ohne Pointer ist null → fade-out).
  const racketRef=useRef(null);
  const lastPosRef=useRef(null);
  const lastSliceAtRef=useRef(0);
  // Floater-Live-Ref → der Pointer-Listener liest immer den aktuellen
  // Stand, ohne dass wir ihn bei jedem setFloaters neu anmelden müssen.
  const floatersRef=useRef(floaters);
  useEffect(()=>{ floatersRef.current=floaters; },[floaters]);

  // Globaler Pointer-Handler:
  //   pointerdown  → Klick-Ripple spawnen
  //   pointermove  → Racket nachführen + Floater-Kollisionen prüfen
  //   pointerleave → Racket ausblenden (Desktop)
  useEffect(()=>{
    const reduced=typeof window!=='undefined'
      &&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced) return;

    const spawnRipple=(x,y)=>{
      const el=document.createElement('div');
      el.className='funky-ripple';
      el.style.left=x+'px';
      el.style.top=y+'px';
      document.body.appendChild(el);
      setTimeout(()=>{ try{el.remove();}catch{} },800);
    };

    const spawnTrail=(x,y,rot)=>{
      const el=document.createElement('div');
      el.className='funky-slice-trail';
      el.style.left=x+'px';
      el.style.top=y+'px';
      el.style.setProperty('--trail-rot',rot+'deg');
      document.body.appendChild(el);
      setTimeout(()=>{ try{el.remove();}catch{} },500);
    };

    /* Hit-Test: ist (x,y) innerhalb des Bounding-Box eines Floaters?
       Floater-Position kommt aus der CSS-%-Angabe — wir rechnen sie
       hier in Pixel um. Padding (16px) toleranter als die Sprite-Größe,
       damit Slicing nicht haarscharf sein muss. */
    const hitTest=(x,y,vw,vh)=>{
      const hits=[];
      for(const f of floatersRef.current){
        if(f.sliced) continue;
        const fx=f.left*vw/100;
        const fy=f.top *vh/100;
        const r=f.size/2 + 16;
        if(Math.abs(x-fx)<=r && Math.abs(y-fy)<=r) hits.push(f.key);
      }
      return hits;
    };

    const onDown=(e)=>{
      const x=e.clientX, y=e.clientY;
      if(typeof x!=='number'||typeof y!=='number') return;
      spawnRipple(x,y);
      // Beim ersten Touch sofort auch den Schläger zeigen.
      if(racketRef.current){
        racketRef.current.classList.add('is-active');
        racketRef.current.style.left=x+'px';
        racketRef.current.style.top=y+'px';
      }
      lastPosRef.current={x,y,t:performance.now()};
    };

    const onMove=(e)=>{
      const x=e.clientX, y=e.clientY;
      if(typeof x!=='number'||typeof y!=='number') return;

      // Bewegungsrichtung → Racket-Rotation. Wenn keine vorige Position
      // existiert, schwingt der Schläger einfach im Default-Winkel.
      let rot=-30;
      const last=lastPosRef.current;
      if(last){
        const dx=x-last.x, dy=y-last.y;
        if(Math.abs(dx)+Math.abs(dy)>2){
          // atan2 in Grad. Offset -30° lässt den Schläger natürlich
          // in Schwung-Richtung fliegen.
          rot=Math.atan2(dy,dx)*180/Math.PI - 30;
        }
      }

      // Racket-DOM direkt anstoßen — kein React-Re-render pro Move.
      const r=racketRef.current;
      if(r){
        r.classList.add('is-active');
        r.style.left=x+'px';
        r.style.top=y+'px';
        r.style.setProperty('--racket-rot',rot+'deg');
      }

      // Slice-Logik: prüfen, ob die Bewegung über einen lebenden Floater
      // gestrichen ist. Throttle auf 30ms damit wir nicht jedes mickrige
      // Pixel-Tick spammen.
      const now=performance.now();
      if(now-lastSliceAtRef.current<30){ lastPosRef.current={x,y,t:now}; return; }
      const vw=window.innerWidth||0, vh=window.innerHeight||0;
      const hits=hitTest(x,y,vw,vh);
      if(hits.length>0){
        lastSliceAtRef.current=now;
        // Trail markiert die Schnittlinie senkrecht zur Bewegung.
        spawnTrail(x,y,rot+90);
        setFloaters(prev=>prev.map(f=>hits.includes(f.key)?{...f,sliced:true}:f));
      }
      lastPosRef.current={x,y,t:now};
    };

    const onLeave=()=>{
      if(racketRef.current) racketRef.current.classList.remove('is-active');
    };

    document.addEventListener('pointerdown',onDown,{passive:true});
    document.addEventListener('pointermove',onMove,{passive:true});
    document.addEventListener('pointerleave',onLeave);
    document.addEventListener('pointercancel',onLeave);
    return()=>{
      document.removeEventListener('pointerdown',onDown);
      document.removeEventListener('pointermove',onMove);
      document.removeEventListener('pointerleave',onLeave);
      document.removeEventListener('pointercancel',onLeave);
    };
    // Eslint-Disable für deps: floaters wird über floatersRef gelesen,
    // damit Listener stabil bleiben (siehe oben).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Respawn nur bei Screen-Wechsel. Wenn der User alle Floater
  // weggesliced hat, bleibt der Screen "clean" — erst wenn er auf
  // einen anderen Screen navigiert (scr-Prop ändert sich), wird ein
  // neuer Schwarm gewürfelt. Macht das Mini-Spiel zu einer kleinen
  // Belohnung pro Screen statt eines Endlos-Loops.
  useEffect(()=>{
    setFloaters(buildFunkyFloaters());
  },[scr]);

  // Video-Source rotieren wenn der erste Kandidat fehlschlägt.
  const[srcIdx,setSrcIdx]=useState(0);
  const onError=()=>{
    setSrcIdx(i=>i+1<FUNKY_VIDEO_CANDIDATES.length?i+1:i);
  };

  // Marquee verdoppeln → nahtlose Schleife.
  const marquee=[...FUNKY_MARQUEE_TEXT,...FUNKY_MARQUEE_TEXT];

  // Padel-Racket-Asset. Wenn das PNG fehlt (z. B. lokal noch nicht
  // committed), fällt der <img>-onError-Handler auf ein inline-SVG
  // zurück, sodass das Feature trotzdem funktioniert.
  const racketUrl=getAssetBase()+'assets/padelracket.png';
  const[racketBroken,setRacketBroken]=useState(false);

  return(
    <Fragment>
      {/* Layer 0 — Pexels Stock Video */}
      <video key={srcIdx} className="funky-ambient-video"
        autoPlay muted loop playsInline preload="auto"
        onError={onError} aria-hidden="true">
        <source src={FUNKY_VIDEO_CANDIDATES[srcIdx]} type="video/mp4"/>
      </video>

      {/* Layer 1 — Vignette */}
      <div className="funky-ambient-vignette" aria-hidden="true"/>

      {/* Layer 2 — Marquee-Strip ganz oben */}
      <div className="funky-ambient-marquee" aria-hidden="true">
        <div className="funky-marquee" style={{paddingLeft:24}}>
          {marquee.map((t,i)=>(
            <span key={i} style={{display:'inline-flex',alignItems:'center',gap:8}}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Layer 3 — Floating Tropical Sprites */}
      {floaters.map(f=>(
        <div key={f.key}
          className={f.sliced?'funky-floater funky-floater-sliced':'funky-floater'}
          style={{
            left:f.left+'%',
            top:f.top+'%',
            '--funky-rot':f.rot+'deg',
            '--funky-dur':f.dur+'s',
            animationDelay:f.sliced?'0s':f.delay+'s',
            transform:`rotate(${f.rot}deg)`,
          }}
          aria-hidden="true">
          {f.kind==='kiwi'      &&<KiwiIcon       size={f.size}/>}
          {f.kind==='pineapple' &&<PineappleIcon  size={f.size}/>}
          {f.kind==='coconut'   &&<CoconutIcon    size={f.size}/>}
          {f.kind==='ball'      &&<TennisBallIcon size={f.size}/>}
          {f.kind==='parrot'    &&<ParrotIcon     size={f.size}/>}
        </div>
      ))}

      {/* Layer 4 — Padel-Racket folgt dem Pointer (Fruit-Ninja-Modus) */}
      <div ref={racketRef} className="funky-racket" aria-hidden="true">
        {racketBroken?(
          /* Fallback-SVG: schmaler Padel-Schläger im Bauhaus-Stil.
             Bewahrt das Feature wenn die PNG-Datei fehlt. */
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="racket-head" cx=".4" cy=".35" r=".7">
                <stop offset="0" stopColor="#FFE800"/>
                <stop offset=".6" stopColor="#FF1A8C"/>
                <stop offset="1" stopColor="#00F0FF"/>
              </radialGradient>
            </defs>
            {/* Griff */}
            <rect x="46" y="55" width="8" height="40" rx="2" fill="#1a0014" stroke="#FFE800" strokeWidth="2"/>
            <rect x="44" y="92" width="12" height="4" fill="#FFE800"/>
            {/* Kopf */}
            <ellipse cx="50" cy="36" rx="32" ry="34"
              fill="url(#racket-head)" stroke="#000" strokeWidth="3"/>
            {/* Bespannung */}
            <g stroke="#000" strokeWidth="1" opacity=".6">
              <line x1="22" y1="36" x2="78" y2="36"/>
              <line x1="30" y1="20" x2="30" y2="55"/>
              <line x1="50" y1="6"  x2="50" y2="66"/>
              <line x1="70" y1="20" x2="70" y2="55"/>
              <line x1="22" y1="22" x2="78" y2="22"/>
              <line x1="22" y1="50" x2="78" y2="50"/>
            </g>
          </svg>
        ):(
          <img src={racketUrl} alt=""
            onError={()=>setRacketBroken(true)}
            draggable={false}/>
        )}
      </div>
    </Fragment>
  );
}

export default function App(){
  const[scr,setScr]=useState('splash');
  const[activeTab,setActiveTab]=useState('home');
  const[loggedIn,setLoggedIn]=useState(()=>lsGet('ritmo_logged_in',false));
  const[onboarded,setOnboarded]=useState(()=>lsGet('ritmo_onboarded',false));
  const[rulesRead,setRulesRead]=useState(()=>lsGet('ritmo_rules_read',false));
  const[journeyRead,setJourneyRead]=useState(()=>lsGet('ritmo_journey_read',false));
  const[welcomeSeen,setWelcomeSeen]=useState(()=>lsGet('ritmo_welcome_seen',false));

  // VerifiedLanding: aktiv wenn der Supabase-Mail-Link uns mit
  // ?verified=1 zurückgeschickt hat. Blockiert das Auto-Routing
  // des Auth-Listeners, damit der User die Info-Seite zuerst sieht.
  const[verifyLanding,setVerifyLanding]=useState(()=>{
    if(typeof window==='undefined') return false;
    try{return new URLSearchParams(window.location.search).get('verified')==='1';}
    catch(e){return false;}
  });
  const verifyLandingRef=useRef(verifyLanding);
  useEffect(()=>{verifyLandingRef.current=verifyLanding;},[verifyLanding]);
  // Aktuelle Online-Tournament-Session des Hosts (während die Lobby
  // offen ist).
  const[onlinePin,setOnlinePin]=useState(null);
  // Joined-Session des Players: bleibt persistent solange die Session
  // läuft. Damit erscheint das Turnier unter "Live" und kann
  // jederzeit wieder geöffnet werden.
  const[joinedSession,setJoinedSession]=useState(()=>lsGet('ritmo_joined',null));
  useEffect(()=>{
    if(joinedSession===null){try{localStorage.removeItem('ritmo_joined');}catch{}}
    else lsSet('ritmo_joined',joinedSession);
  },[joinedSession]);
  // ?join=PIN aus der URL extrahieren (vom QR-Scan). Wird beim
  // Cold-Load gelesen und an JoinTournament als initialPin gegeben.
  // Sobald gelesen, säubern wir die URL via history.replaceState.
  const[joinPinFromUrl,setJoinPinFromUrl]=useState(()=>{
    if(typeof window==='undefined') return null;
    try{
      const p=new URLSearchParams(window.location.search).get('join');
      return p?p.trim().toLowerCase():null;
    }catch{return null;}
  });
  useEffect(()=>{
    if(!joinPinFromUrl) return;
    try{
      const url=new URL(window.location.href);
      url.searchParams.delete('join');
      window.history.replaceState({},'',url.toString());
    }catch{}
  },[joinPinFromUrl]);
  const[pendingEmail,setPendingEmail]=useState('');
  // Aktuelle Supabase User-ID — wird vom Auth-Listener gesetzt und
  // an Social-Screens (PublicProfile, BookingDetail, …) durchgereicht.
  const[currentUid,setCurrentUid]=useState(null);
  // Social-Navigation-State: welcher Player/Club/Match wird gerade
  // angezeigt? Wird beim setScr nicht zurückgesetzt — die jeweiligen
  // Screens prüfen ihre IDs vor dem Mount.
  const[viewPlayerId,setViewPlayerId]=useState(null);
  // playerBackTo: wohin der Zurück-Pfeil auf dem PublicProfile geht
  // ('player-search' | 'club-detail' | null).
  const[playerBackTo,setPlayerBackTo]=useState(null);
  const[viewClubId,setViewClubId]=useState(null);
  // followListInitial steuert, ob FollowList mit 'followers' oder
  // 'following' tab öffnet.
  const[followListInitial,setFollowListInitial]=useState('followers');
  // editClub: vorgefüllter Club beim Sprung in ClubCreate-Edit-Mode.
  const[editClub,setEditClub]=useState(null);
  // chatBackTo: woher der User in den Club-Chat gekommen ist. Default
  // 'club-detail'; wenn er aus RITMO Post Chats kam, setzen wir
  // 'ritmopost'. Wird beim Schließen des Chats ausgewertet.
  const[chatBackTo,setChatBackTo]=useState('club-detail');
  // Aggregierter Unread-Count für den Home-Post-Dot. Wird alle 30 s
  // refreshed plus beim Verlassen eines Chat-Screens. State auf App-Ebene
  // damit der Dot nicht erst beim Re-Mount aktualisiert.
  const[unreadTotal,setUnreadTotal]=useState(0);
  useEffect(()=>{
    if(!currentUid) return;
    let cancelled=false;
    const tick=async()=>{
      const n=await totalUnreadCount();
      if(!cancelled) setUnreadTotal(n);
    };
    tick();
    const id=setInterval(tick,30000);
    return()=>{ cancelled=true; clearInterval(id); };
  },[currentUid,scr]);
  const[profile,setProfile]=useState(()=>lsGet('ritmo_profile',{
    name:'',
    playtomicLevel:null,
    estimatedLevel:null,
    yearsPlaying:null,
    frequencyPerWeek:null,
    playsTournaments:null,
    tournamentCount:null,
    matchesPlayed:'',
    winsCount:'',
    handPreference:null,
    courtSide:null,
    playStyle:null,
    strongestShot:null,
    quizAnswers:{q1:null,q2:null,q3:null,q4:null},
    styleType:null,
    avatar:null,
  }));
  const[cfg,setCfg]=useState(()=>lsGet('ritmo_cfg',{nameA:'Team A',nameB:'Team B',format:'bo3',amLimit:21}));
  const[bo3,dBo3]=useReducer(bo3R,B0,init=>lsGet('ritmo_bo3',init));
  const[am,dAm]=useReducer(amR,A0,init=>lsGet('ritmo_am',init));
  // Mehrere benannte Turniere als Liste (statt Einzelobjekt), damit ein
  // laufendes Turnier nicht vom nächsten überschrieben wird. Migration
  // vom alten Einzel-Key ritmo_tourney.
  const[tourneys,setTourneys]=useState(()=>{
    const list=lsGet('ritmo_tourneys',null);
    if(Array.isArray(list)) return list;
    const old=lsGet('ritmo_tourney',null);
    if(old) return [{...old,id:old.id||('t-'+Date.now()),name:old.name||'Turnier',createdAt:old.createdAt||Date.now()}];
    return [];
  });
  const[currentTourneyId,setCurrentTourneyId]=useState(null);
  const tourney=tourneys.find(t=>t.id===currentTourneyId)||null;
  const setTourney=useCallback(updater=>{
    setTourneys(list=>list.map(t=>t.id===currentTourneyId
      ?(typeof updater==='function'?updater(t):updater):t));
  },[currentTourneyId]);
  // Ring-ID gegen die aktuellen RINGS normalisieren — alte gespeicherte
  // IDs (z. B. 'soft' aus früheren Versionen) fallen sauber auf 'ritmo'.
  const[ringId,setRingId]=useState(()=>{const v=lsGet('ritmo_ring','ritmo');return RINGS.some(r=>r.id===v)?v:'ritmo';});
  const[inputMode,setInputMode]=useState(()=>lsGet('ritmo_input','smartphone'));
  const[voiceOn,setVoiceOn]=useState(()=>lsGet('ritmo_voice',false));
  const[voiceBaseUrl,setVoiceBaseUrl]=useState(()=>lsGet('ritmo_voice_url',''));
  const[theme,setTheme]=useState(()=>lsGet('ritmo_theme','glass'));
  // Tablet-Modus skaliert das Scoreboard (Match-Screen) auf größere
  // Bildschirme. Eigene Persistenz, weil der Mode bewusst manuell vom
  // User aktiviert wird — nicht automatisch via Viewport-Erkennung,
  // damit Tester:innen die Tablet-Optik auch am Phone prüfen können.
  const[tabletMode,setTabletMode]=useState(()=>lsGet('ritmo_tablet',false));
  useEffect(()=>{ lsSet('ritmo_tablet',tabletMode); },[tabletMode]);
  // Benachrichtigungs-Präferenzen — werden in den Settings gepflegt
  // und hier zentral gehalten, damit sie an mehreren Stellen (z. B.
  // RITMO Post, Home-Badge) ausgelesen werden können.
  const[notify,setNotify]=useState(()=>lsGet('ritmo_notify',{
    matchReminder:true,
    tournamentAlerts:true,
    chatMessages:true,
    social:true,
    sound:true,
    vibration:true,
    redDot:true,
  }));
  useEffect(()=>{ lsSet('ritmo_notify',notify); },[notify]);

  // iOS Audio Unlock — auf iOS Safari + installierte Web.App ist
  // ein frisch erstellter AudioContext suspended, und resume() läuft
  // NUR aus einer User-Geste durch. Wir hängen einen One-Shot-
  // Listener auf den ersten Tap/Touch/Keypress; danach kann
  // playRing() jederzeit Töne abspielen, auch aus setInterval-
  // Callbacks (Tournament-Round-Timer). Pointerdown + touchstart
  // + keydown decken alle Eingabe-Modalitäten ab; passive:true,
  // damit wir scrolling nicht blockieren.
  useEffect(()=>{
    const opts={once:true,passive:true,capture:true};
    const handler=()=>{
      try{ unlockAudio(); }catch{}
      // Andere Listener via { once:true } werden automatisch entfernt.
    };
    window.addEventListener('pointerdown',handler,opts);
    window.addEventListener('touchstart',handler,opts);
    window.addEventListener('keydown',handler,opts);
    return()=>{
      window.removeEventListener('pointerdown',handler,opts);
      window.removeEventListener('touchstart',handler,opts);
      window.removeEventListener('keydown',handler,opts);
    };
  },[]);

  // Apply theme to document root → CSS vars cascade everywhere
  // Also sync the theme-color meta tag so iOS/Android system UI matches
  useEffect(()=>{
    document.documentElement.setAttribute('data-theme',theme);
    // Read computed --bg value and reflect it to body inline bg + theme-color meta.
    // Done in a microtask so the data-theme attribute is fully applied first.
    Promise.resolve().then(()=>{
      try{
        const bg=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#000';
        document.documentElement.style.background=bg;
        document.body.style.background=bg;
        const meta=document.getElementById('theme-color-meta');
        if(meta) meta.setAttribute('content',bg);
      }catch(e){}
    });
  },[theme]);

  // App-level KeyCapture: lives outside Match's render tree so bigScreen
  // toggles in Match never unmount/remount the hidden input. Match registers
  // its handler via this ref.
  const matchKeyRef=useRef(null);
  const onMatchKey=useRef((e)=>matchKeyRef.current?.(e)).current;

  // Supabase auth listener — fängt die Session, die der Email-Verify-Link
  // (oder ein bereits eingeloggter Session-Cookie) beim Page-Load setzt,
  // und schiebt den User automatisch weiter ins Onboarding/Home.
  // onboarded wird über eine ref gelesen, damit die Subscription nicht
  // bei jedem Onboarding-Schritt neu aufgebaut wird.
  const onboardedRef=useRef(onboarded);
  useEffect(()=>{onboardedRef.current=onboarded;},[onboarded]);
  useEffect(()=>{
    if(typeof window==='undefined'||!window.supabase) return;
    const enter=async()=>{
      // Während VerifiedLanding sichtbar ist: NICHT auto-routen,
      // sonst springt der Listener sofort weiter und der User
      // sieht die Info-Page nie.
      if(verifyLandingRef.current) return;
      setLoggedIn(true);
      // Erst Profil aus DB ziehen, DANN routen. Sonst würde der
      // Listener auf neuem Gerät (onboarded=false in localStorage)
      // immer auf 'welcome' schicken, obwohl der User längst onboarded
      // ist und das Profil nur in der DB liegt.
      let isOnboarded=onboardedRef.current;
      try{
        const dbProfile=await dbLoadProfile();
        if(dbProfile){
          setProfile(p=>({...p,...dbProfile}));
          // Explizites Onboarded-Flag in der DB ist die Source-of-Truth.
          // Fallback (Legacy-Profile ohne Flag): Onboarding gilt als
          // erledigt wenn styleType/Level gesetzt sind.
          const dbOnboarded=dbProfile.onboarded===true
            ||(dbProfile.styleType||dbProfile.playtomicLevel!=null||dbProfile.estimatedLevel!=null);
          if(dbOnboarded){
            setOnboarded(true);
            isOnboarded=true;
          } else {
            setOnboarded(false);
            isOnboarded=false;
          }
        }
      }catch(e){}
      setScr(curr=>{
        // Auth-Screens und welcome/home: hier korrigiert der Listener
        // nach DB-Profil, falls Login.onSuccess auf Basis von stale
        // localStorage-Werten geroutet hat. Andere Screens (match,
        // tournament-*, profile, etc.) bleiben unverändert.
        //
        // 'splash' ist BEWUSST ausgenommen: der Ladebildschirm soll NICHT
        // automatisch in die App reinladen, sondern stehen bleiben, bis
        // der User tippt. loggedIn + onboarded sind oben bereits gesetzt,
        // sodass der Tap (Splash.onDone) dann korrekt nach home routet.
        if(curr==='login'||curr==='register'||curr==='verify-email'
          ||curr==='beta-landing'||curr==='welcome'||curr==='home'){
          return isOnboarded?'home':'welcome';
        }
        return curr;
      });
    };
    // Initiale Session (Verify-Link auf Cold-Load) prüfen
    window.supabase.auth.getSession().then(({data})=>{
      if(data?.session){
        setCurrentUid(data.session.user?.id||null);
        enter();
      }
    }).catch(()=>{});
    // Live-Updates (SIGNED_IN nach Verify-Klick im selben Tab)
    const {data:sub}=window.supabase.auth.onAuthStateChange((event,session)=>{
      // currentUid spiegelt die aktuelle Session — wird von Social-Screens
      // benutzt (PublicProfile.isSelf, BookingDetail.mySlot, …).
      setCurrentUid(session?.user?.id||null);
      if(event==='PASSWORD_RECOVERY'){
        // Supabase hat temporäre Recovery-Session gesetzt → User zum
        // Passwort-neu-setzen-Screen schicken. Nicht loggedIn=true setzen,
        // damit Logout/Done-Pfade sauber bleiben.
        setScr('password-recovery');
      } else if(event==='SIGNED_IN') enter();
      else if(event==='SIGNED_OUT') setLoggedIn(false);
    });
    return ()=>sub?.subscription?.unsubscribe();
  },[]);

  // Persist
  useEffect(()=>lsSet('ritmo_cfg',cfg),[cfg]);
  useEffect(()=>lsSet('ritmo_bo3',bo3),[bo3]);
  useEffect(()=>lsSet('ritmo_am',am),[am]);
  useEffect(()=>{
    if(!tourneys.length){try{localStorage.removeItem('ritmo_tourneys');}catch(e){}}
    else lsSet('ritmo_tourneys',tourneys);
    try{localStorage.removeItem('ritmo_tourney');}catch(e){} // alter Einzel-Key
  },[tourneys]);
  useEffect(()=>lsSet('ritmo_ring',ringId),[ringId]);
  useEffect(()=>lsSet('ritmo_input',inputMode),[inputMode]);
  useEffect(()=>lsSet('ritmo_voice',voiceOn),[voiceOn]);
  useEffect(()=>lsSet('ritmo_voice_url',voiceBaseUrl),[voiceBaseUrl]);
  useEffect(()=>lsSet('ritmo_theme',theme),[theme]);
  useEffect(()=>lsSet('ritmo_logged_in',loggedIn),[loggedIn]);
  useEffect(()=>lsSet('ritmo_onboarded',onboarded),[onboarded]);
  useEffect(()=>lsSet('ritmo_rules_read',rulesRead),[rulesRead]);
  useEffect(()=>lsSet('ritmo_journey_read',journeyRead),[journeyRead]);
  useEffect(()=>lsSet('ritmo_welcome_seen',welcomeSeen),[welcomeSeen]);
  useEffect(()=>lsSet('ritmo_profile',profile),[profile]);

  // onboarded ist die Source-of-Truth im React-State, profile.onboarded
  // ist die DB-Persistenz. Spiegel das eine ins andere, damit der
  // debounced Profile-Save den Onboarding-Status mitnimmt.
  useEffect(()=>{
    setProfile(p=>p.onboarded===onboarded?p:{...p,onboarded});
  },[onboarded]);

  // Debounced Profile-Sync zur DB. Greift nur, wenn der User eingeloggt
  // ist und eine echte Supabase-Session besteht (db.js no-op'pt sonst).
  useEffect(()=>{
    if(!loggedIn) return;
    const id=setTimeout(()=>{dbSaveProfile(profile).catch(()=>{});},800);
    return ()=>clearTimeout(id);
  },[profile,loggedIn]);

  const nav=useCallback(s=>{
    if(s==='rules'&&rulesRead) return setScr('rules-overview');
    if(s==='journey'&&journeyRead) return setScr('journey-overview');
    setScr(s);
  },[rulesRead,journeyRead]);
  const goHome=useCallback(()=>{setScr('home');setActiveTab('home');setTourneyEditMode(false);},[]);

  // Live = active match if scoreboard has progress
  const hasMatch=(bo3.gA>0||bo3.gB>0||bo3.pA>0||bo3.pB>0||bo3.sA>0||bo3.sB>0
    ||am.pA>0||am.pB>0||(bo3.hist&&bo3.hist.length>0)||(am.hist&&am.hist.length>0));
  const hasTourney=tourney!==null&&!tourney.finished;

  const handleTab=(t)=>{
    setActiveTab(t);
    if(t==='home') setScr('home');
    else if(t==='profil') setScr('profile');
    else if(t==='suche') setScr('search-hub');
    else if(t==='live') setScr('live');
    else if(t==='bibel') setScr('ritmo-bibel');
  };

  const[tourneyEditMode,setTourneyEditMode]=useState(false);

  const startTourney=(t)=>{
    const id=t.id||('t-'+Date.now());
    const nt={...t,id,name:t.name||('Turnier '+new Date().toLocaleDateString('de-DE')),createdAt:t.createdAt||Date.now()};
    setTourneys(list=>[nt,...list.filter(x=>x.id!==id)]);
    setCurrentTourneyId(id);
    setScr('tournament-play');setTourneyEditMode(false);
  };
  const newTourney=()=>{setCurrentTourneyId(null);setScr('tournament-setup');setTourneyEditMode(false);};
  // Entwurf speichern: Turnier OHNE generierte Runden in der Liste ablegen
  // (draft:true). Erscheint unter „Live" als Entwurf; beim Öffnen landet man
  // wieder im Setup (vorbefüllt) und kann es fertig konfigurieren + starten.
  const saveTourneyDraft=(t)=>{
    const id=t.id||('t-'+Date.now());
    const nt={...t,id,draft:true,finished:false,rounds:[],current:0,
      name:t.name||('Entwurf '+new Date().toLocaleDateString('de-DE')),
      createdAt:t.createdAt||Date.now()};
    setTourneys(list=>[nt,...list.filter(x=>x.id!==id)]);
    setCurrentTourneyId(null);
    setTourneyEditMode(false);
    setActiveTab('live');setScr('live');
  };
  const openTourney=(id)=>{
    const t=tourneys.find(x=>x.id===id); if(!t) return;
    setCurrentTourneyId(id); setTourneyEditMode(false);
    // Entwurf → zurück ins Setup (vorbefüllt). Start generiert die Runden
    // und ersetzt den Entwurf in-place (siehe TournamentSetup-onStart).
    if(t.draft){ setScr('tournament-setup'); return; }
    setScr(t.finished?'tournament-leaderboard':'tournament-play');
  };

  const editTourney=()=>{setTourneyEditMode(true);setScr('tournament-setup');};
  // scope='next' (Standard): Settings gelten ab der nächsten Runde, die
  // laufende Runde bleibt unangetastet. scope='current': die laufende
  // Runde wird mit den neuen Settings neu generiert (Paarungen/Courts/
  // Pausen neu) — frühere Runden bleiben erhalten.
  const saveTourneyEdit=(updates,scope='next')=>{
    setTourney(prev=>{
      if(!prev)return prev;
      let next={...prev,
        players:updates.players,
        format:updates.format,
        winMode:updates.winMode,
        numCourts:updates.numCourts,
        roundDurationMin:updates.roundDurationMin,
        courtNames:updates.courtNames,
        name:updates.name||prev.name,
        startTime:updates.startTime,
        endTime:updates.endTime,
        roundPrio:updates.roundPrio,
      };
      if(scope==='current'&&Array.isArray(next.rounds)){
        const prevRounds=next.rounds.slice(0,next.current);
        const lb=calcLeaderboard(next.players,prevRounds,next.winMode);
        const sortedLb=lb.sort((a,b)=>next.winMode==='points'?b.totalPts-a.totalPts:b.totalWins-a.totalWins);
        const newR=genRound(next.format,next.players,
          {history:prevRounds,leaderboard:sortedLb,maxCourts:next.numCourts});
        // K.-o. fertig (null) → keine neue Runde, Turnier gilt als beendet.
        next=newR
          ?{...next,rounds:[...prevRounds,newR],
            timerSecsLeft:(updates.roundDurationMin||10)*60,
            timerRunning:false,timerFinished:false}
          :{...next,rounds:prevRounds,finished:true,timerRunning:false};
      }
      return next;
    });
    setTourneyEditMode(false);
    setScr('tournament-play');
  };

  // ── Undo nach Löschen: 5s-Fenster mit „Rückgängig"-Toast.
  // restore() stellt das gelöschte Objekt wieder her; nach Ablauf
  // (oder neuem Löschen) verfällt die Option.
  const[undoInfo,setUndoInfo]=useState(null);
  const undoTimer=useRef(null);
  const offerUndo=(label,restore)=>{
    clearTimeout(undoTimer.current);
    setUndoInfo({label,restore,key:Date.now()});
    undoTimer.current=setTimeout(()=>setUndoInfo(null),5000);
  };
  const runUndo=()=>{
    clearTimeout(undoTimer.current);
    undoInfo?.restore?.();
    setUndoInfo(null);
  };

  const deleteMatch=()=>{
    // Snapshot der Reducer-States — die '_R'-Action hydriert sie zurück.
    const snap={bo3,am};
    dBo3({type:'RESET'});
    dAm({type:'RESET',limit:cfg.amLimit??21});
    offerUndo('Match gelöscht',()=>{
      dBo3({type:'_R',s:snap.bo3});
      dAm({type:'_R',s:snap.am});
    });
  };
  // „Spiele & Statistik zurücksetzen" (aus Profil bearbeiten): aktive
  // Scoreboards leeren + geloggte Matches (Supabase, RLS) löschen +
  // Match-Zähler im Profil nullen (fließen ins Level-Estimate ein).
  const resetStats=()=>{
    dBo3({type:'RESET'});
    dAm({type:'RESET',limit:cfg.amLimit??21});
    setProfile(p=>({...p,matchesPlayed:0,winsCount:0}));
    dbDeleteMyMatches();
    clearMatchLog();
  };
  const deleteTourney=(id)=>{
    const target=id||currentTourneyId;
    const removed=tourneys.find(t=>t.id===target);
    const wasCurrent=target===currentTourneyId;
    setTourneys(list=>list.filter(t=>t.id!==target));
    if(wasCurrent) setCurrentTourneyId(null);
    if(removed) offerUndo(removed.draft?'Entwurf gelöscht':'Turnier gelöscht',()=>{
      setTourneys(list=>[removed,...list.filter(t=>t.id!==removed.id)]);
      if(wasCurrent) setCurrentTourneyId(removed.id);
    });
  };

  // Wird von Match + TournamentPlay aufgerufen, sobald ein Match
  // tatsächlich geloggt wird (winner-Transition / done=true→logged).
  // Inkrementiert profile.matchesPlayed (+ winsCount wenn user_won).
  // Dadurch fließen App-gespielte Matches ins Spielniveau-Estimate ein,
  // zusätzlich zur Quiz-Eingabe.
  const onMatchLogged=useCallback(({userWon})=>{
    setProfile(p=>{
      const matches=(parseInt(p.matchesPlayed||'0',10)||0)+1;
      const winsBase=parseInt(p.winsCount||'0',10)||0;
      const wins=winsBase+(userWon?1:0);
      return {...p,matchesPlayed:String(matches),winsCount:String(wins)};
    });
  },[]);

  return(<>
    <style>{CSS}</style>
    <Toasts/>

    {/* Funky-Theme-Ambient-Layer — Stock-Video + Marquee + Fruits +
        Click-Ripples. Wird NUR gemountet wenn das Bauhaus-Funky-
        Theme aktiv ist, sodass andere Themes 0 externe Requests
        und 0 zusätzliche DOM-Knoten haben. */}
    {theme==='funky'&&<FunkyAmbient scr={scr}/>}

    {/* App-level KeyCapture — never unmounts when Match re-renders (e.g. bigScreen toggle).
        Active only on Match screen with ring/presenter input mode. */}
    <KeyCapture
      enabled={scr==='match'&&(inputMode==='ring'||inputMode==='presenter')}
      onKey={onMatchKey}/>

    {scr==='splash'&&<Splash onDone={()=>{
      // ?join=PIN aus QR-Scan: direkt zur Turnier-Join-Maske, auch
      // ohne Login (Auth-Pflicht wäre Reibung für den eingeladenen
      // Spieler).
      if(joinPinFromUrl) return nav('remote');
      // Vor Login zeigen wir die Beta-Landing-Page (Coming-Soon-
      // Ankündigung + CTA-Buttons). Eingeloggte User springen direkt
      // weiter zu welcome / home.
      if(!loggedIn) return nav('beta-landing');
      if(!onboarded) return nav('welcome');
      return nav('home');
    }}/>}
    {scr==='beta-landing'&&<BetaLanding
      onLogin={()=>nav('login')}
      onRegister={()=>nav('register')}/>}
    {scr==='login'&&<Login
      onSuccess={(result)=>{
        setLoggedIn(true);
        // Test-User-Bypass: kein SIGNED_IN-Event vom Supabase-Listener,
        // also setzen wir onboarded selbst und routen direkt nach home.
        if(result?.user?.provider==='test'){
          setOnboarded(true);
          return nav('home');
        }
        // Real user: aktuellen onboarded-Flag respektieren. Auf einem
        // neuen Gerät ist onboarded=false → welcome (Onboarding); der
        // Auth-Listener kann das später per DB-Profil korrigieren.
        nav(onboarded?'home':'welcome');
      }}
      onRegister={()=>nav('register')}/>}
    {scr==='register'&&<Register
      onSuccess={()=>{setLoggedIn(true);setOnboarded(false);nav('welcome');}}
      onLogin={()=>nav('login')}
      onNeedsVerification={(email)=>{
        setPendingEmail(email);
        // Frische Registrierung → Onboarding-Flag zurücksetzen, damit
        // auch der Supabase-Auth-Listener (SIGNED_IN nach Verify-Klick)
        // zuverlässig auf 'welcome' routet und nicht auf 'home'.
        setOnboarded(false);
        nav('verify-email');
      }}/>}
    {scr==='verify-email'&&<EmailVerification
      email={pendingEmail}
      onBack={()=>nav('register')}
      onSignIn={()=>nav('login')}/>}
    {scr==='password-recovery'&&<PasswordRecovery
      onDone={()=>{setLoggedIn(true);nav(onboarded?'home':'welcome');}}/>}
    {scr==='welcome'&&<Welcome
      profile={profile} setProfile={setProfile}
      theme={theme} setTheme={setTheme}
      onComplete={()=>{setOnboarded(true);nav('home');}}/>}
    {scr==='home'&&<Home nav={nav} activeTab={activeTab} setActiveTab={handleTab}
      profile={profile} onboarded={onboarded} unread={unreadTotal}/>}
    {scr==='profile'&&<Profile profile={profile} setProfile={setProfile}
      onHome={goHome} currentUid={currentUid} onTab={handleTab}
      onOpenSettings={()=>setScr('settings')}
      onOpenEdit={()=>setScr('profile-edit')}
      onResetStats={resetStats}
      onOpenRitmoDNA={()=>setScr('profile-ritmodna')}
      onOpenFollowers={()=>{ if(currentUid){ setViewPlayerId(currentUid); setFollowListInitial('followers'); setScr('follow-list'); } }}
      onOpenFollowing={()=>{ if(currentUid){ setViewPlayerId(currentUid); setFollowListInitial('following'); setScr('follow-list'); } }}
      onResetOnboarding={()=>{setOnboarded(false);nav('welcome');}}
      onLogout={async()=>{
        try{await auth.signOut();}catch(e){}
        setLoggedIn(false);
        // onboarded NICHT zurücksetzen — bleibt persistiert, damit
        // ein erneuter Login desselben Users nicht ins Onboarding
        // läuft. Bei User-Wechsel auf demselben Gerät korrigiert der
        // Auth-Listener (DB-Profil-Load) den Status nach Login.
        nav('login');
      }}/>}
    {scr==='profile-ritmodna'&&<ProfileRitmoDNA profile={profile}
      onBack={()=>setScr('profile')}
      onHome={goHome}/>}
    {scr==='profile-edit'&&<ProfileEdit profile={profile} setProfile={setProfile}
      onBack={()=>setScr('profile')} onHome={goHome}
      onResetStats={resetStats}/>}
    {scr==='rules'&&<RulesLanding onHome={goHome}
      onContinue={()=>setScr('rules-overview')}
      onMarkRead={()=>{setRulesRead(true);setScr('rules-overview');}}
      alreadyRead={rulesRead}/>}
    {scr==='rules-overview'&&<Rules onHome={goHome}
      onSelect={(id)=>setScr(`rules-${id}`)}
      alreadyRead={rulesRead}
      onToggleRead={()=>setRulesRead(r=>!r)}
      onBibel={()=>setScr('ritmo-bibel')}/>}
    {(()=>{
      const order=['basics','bo3','americano','mexicano','rotation','glossar'];
      const id=scr.startsWith('rules-')?scr.slice(6):null;
      if(id==='overview') return null;
      const idx=id?order.indexOf(id):-1;
      if(idx<0) return null;
      const nav={
        onBackToRules:()=>setScr('rules-overview'),
        onHome:goHome,
        currentIdx:idx,
        totalSections:order.length,
        onNext:idx<order.length-1?()=>setScr(`rules-${order[idx+1]}`):null,
        onPrev:idx>0?()=>setScr(`rules-${order[idx-1]}`):null,
      };
      const Comp={basics:RulesBasics,bo3:RulesBo3,americano:RulesAmericano,
        mexicano:RulesMexicano,rotation:RulesRotation,glossar:RulesGlossar}[id];
      return Comp?<Comp {...nav}/>:null;
    })()}
    {scr==='journey'&&<JourneyLanding onHome={goHome}
      onContinue={()=>setScr('journey-overview')}
      onMarkRead={()=>{setJourneyRead(true);setScr('journey-overview');}}
      alreadyRead={journeyRead}/>}
    {scr==='journey-overview'&&<Journey onHome={goHome}
      onSelect={(id)=>setScr(id==='spielstile'?'journey-spielstile':`journey-${id}`)}
      alreadyRead={journeyRead}
      onToggleRead={()=>setJourneyRead(r=>!r)}
      onBibel={()=>setScr('ritmo-bibel')}/>}
    {scr==='journey-spielstile'&&<JourneySpielstileList
      onBack={()=>setScr('journey-overview')}
      onHome={goHome}
      onSelect={(id)=>setScr(`journey-spielstil-${id}`)}/>}
    {scr.startsWith('journey-spielstil-')&&(()=>{
      const id=scr.slice('journey-spielstil-'.length);
      const order=['chico','toro','individuoso','muro','fantasma','motor','hysterica'];
      const idx=order.indexOf(id);
      if(idx<0) return null;
      return <JourneySpielstile
        styleId={id}
        currentIdx={idx}
        totalSections={order.length}
        onBack={()=>setScr('journey-spielstile')}
        onHome={goHome}
        onNext={idx<order.length-1?()=>setScr(`journey-spielstil-${order[idx+1]}`):null}
        onPrev={idx>0?()=>setScr(`journey-spielstil-${order[idx-1]}`):null}
        onPartnerJump={(pid)=>setScr(`journey-spielstil-${pid}`)}/>;
    })()}
    {(()=>{
      const order=['ritmodna','angaben','aufstellungen','haende','schlagwahl','schlaeger','baelle'];
      const id=scr.startsWith('journey-')?scr.slice(8):null;
      if(id==='overview'||id==='spielstile'||!id||scr.startsWith('journey-spielstil-')) return null;
      const idx=id?order.indexOf(id):-1;
      if(idx<0) return null;
      const nav={
        onBackToJourney:()=>setScr('journey-overview'),
        onHome:goHome,
        currentIdx:idx,
        totalSections:order.length,
        onNext:idx<order.length-1?()=>setScr(`journey-${order[idx+1]}`):null,
        onPrev:idx>0?()=>setScr(`journey-${order[idx-1]}`):null,
      };
      const Comp={ritmodna:JourneyRitmoDNA,angaben:JourneyAngaben,aufstellungen:JourneyAufstellungen,
        haende:JourneyHaende,schlagwahl:JourneySchlagwahl,
        schlaeger:JourneySchlaeger,baelle:JourneyBaelle}[id];
      return Comp?<Comp {...nav}/>:null;
    })()}
    {scr==='live'&&<Live nav={nav} hasMatch={hasMatch} tourneys={tourneys}
      matchCfg={cfg}
      activeTab={activeTab} setActiveTab={handleTab}
      onDeleteMatch={deleteMatch} onDeleteTourney={deleteTourney} onOpenTourney={openTourney}
      joinedSession={joinedSession}
      onLeaveJoined={()=>setJoinedSession(null)}/>}
    {scr==='settings'&&<Settings onHome={goHome} nav={nav}
      onBack={()=>setScr('profile')}
      onLogout={async()=>{
        try{await auth.signOut();}catch(e){}
        setLoggedIn(false);
        nav('login');
      }}/>}
    {scr==='settings-steuerung'&&<SettingsSteuerung
      onBack={()=>setScr('settings')} onHome={goHome}
      inputMode={inputMode} setInputMode={setInputMode}
      voiceOn={voiceOn} setVoiceOn={setVoiceOn}
      ringId={ringId} setRingId={setRingId}/>}
    {scr==='settings-anpassung'&&<SettingsAnpassung
      onBack={()=>setScr('settings')} onHome={goHome}
      theme={theme} setTheme={setTheme}
      tabletMode={tabletMode} setTabletMode={setTabletMode}/>}
    {scr==='settings-privatsphaere'&&<SettingsPrivatsphaere
      onBack={()=>setScr('settings')} onHome={goHome}
      profile={profile} setProfile={setProfile}
      onOpenDelete={()=>setScr('settings-konto')}/>}
    {scr==='settings-benachrichtigungen'&&<SettingsBenachrichtigungen
      onBack={()=>setScr('settings')} onHome={goHome}
      notify={notify} setNotify={setNotify}/>}
    {scr==='settings-sicherheit'&&<SettingsSicherheit
      onBack={()=>setScr('settings')} onHome={goHome}/>}
    {scr==='settings-konto'&&<SettingsKonto
      onBack={()=>setScr('settings')} onHome={goHome}
      onLogout={async()=>{
        try{await auth.signOut();}catch(e){}
        setLoggedIn(false);
        nav('login');
      }}/>}
    {scr==='ritmopost'&&<RitmoPost onHome={goHome} profile={profile}
      unread={unreadTotal}
      onOpenChat={(id)=>{ setViewClubId(id); setChatBackTo('ritmopost'); setScr('club-chat'); }}/>}

    {/* ─── Social Layer Screens ──────────────────────────────────── */}
    {scr==='player-search'&&<PlayerSearch onHome={goHome}
      onOpenPlayer={(uid)=>{ setViewPlayerId(uid); setPlayerBackTo('player-search'); setScr('public-profile'); }}/>}
    {scr==='public-profile'&&viewPlayerId&&<PublicProfile
      userId={viewPlayerId} currentUid={currentUid}
      onHome={goHome}
      onBack={playerBackTo?()=>setScr(playerBackTo):null}
      backLabel={playerBackTo==='club-detail'?'Club':'Suche'}/>}
    {scr==='follow-list'&&viewPlayerId&&<FollowList userId={viewPlayerId}
      initial={followListInitial} onHome={goHome}
      onBack={()=>setScr('profile')}
      onOpenPlayer={(uid)=>{ setViewPlayerId(uid); setPlayerBackTo('follow-list'); setScr('public-profile'); }}/>}
    {scr==='clubs'&&<Clubs onHome={goHome}
      onOpenClub={(id)=>{ setViewClubId(id); setScr('club-detail'); }}
      onCreateClub={()=>{ setEditClub(null); setScr('club-create'); }}/>}
    {scr==='club-create'&&<ClubCreate onHome={goHome} initial={editClub}
      onDone={(club)=>{ setEditClub(null); setViewClubId(club.id); setScr('club-detail'); }}
      onCancel={()=>{ setEditClub(null); setScr(editClub?'club-detail':'clubs'); }}/>}
    {scr==='club-detail'&&viewClubId&&<ClubDetail clubId={viewClubId}
      currentUid={currentUid} onHome={goHome} onBack={()=>setScr('clubs')}
      onOpenPlayer={(uid)=>{ setViewPlayerId(uid); setPlayerBackTo('club-detail'); setScr('public-profile'); }}
      onOpenChat={(id)=>{ setViewClubId(id); setChatBackTo('club-detail'); setScr('club-chat'); }}
      onEdit={(club)=>{ setEditClub(club); setScr('club-create'); }}/>}
    {scr==='club-chat'&&viewClubId&&<ClubChat clubId={viewClubId}
      currentUid={currentUid} onHome={goHome}
      onBack={()=>setScr(chatBackTo||'club-detail')}/>}
    {scr==='single-setup'&&<SingleSetup nav={nav} onHome={goHome} cfg={cfg} setCfg={setCfg} profile={profile} currentUid={currentUid}/>}
    {scr==='match'&&<Match cfg={cfg} setCfg={setCfg} bo3={bo3} dBo3={dBo3} am={am} dAm={dAm}
      onHome={goHome} inputMode={inputMode} ringId={ringId}
      matchKeyRef={matchKeyRef} theme={theme}
      voiceOn={voiceOn} voiceBaseUrl={voiceBaseUrl}
      tabletMode={tabletMode}
      onMatchLogged={onMatchLogged}/>}
    {scr==='tournament-setup'&&<TournamentSetup nav={nav} onHome={goHome}
      onStart={startTourney} onSave={saveTourneyEdit} onSaveDraft={saveTourneyDraft}
      saved={tourney} isEdit={tourneyEditMode&&!!tourney}
      profile={profile}
      onCreateOnline={(pin)=>{setOnlinePin(pin);setScr('online-lobby');}}/>}
    {scr==='online-lobby'&&onlinePin&&<OnlineTournamentLobby
      pin={onlinePin}
      onHome={goHome}
      onCancel={()=>{setOnlinePin(null);setScr('tournament-setup');}}
      onStart={(tourneyState)=>{
        startTourney(tourneyState);
        setOnlinePin(null);
      }}/>}
    {scr==='tournament-play'&&tourney&&<TournamentPlay tourney={tourney} setTourney={setTourney}
      onHome={goHome} nav={nav} ringId={ringId} onEdit={editTourney}
      onMatchLogged={onMatchLogged}/>}
    {scr==='tournament-leaderboard'&&tourney&&<TournamentLeaderboard tourney={tourney}
      onHome={goHome} onNew={newTourney}/>}

    {scr==='remote'&&<JoinTournament
      initialPin={joinPinFromUrl}
      profile={profile}
      restored={joinedSession}
      onJoin={setJoinedSession}
      onHome={()=>{setJoinPinFromUrl(null);goHome();}}/>}

    {/* Hub-Screens: Turnier-Auswahl + RITMO Bibel */}
    {scr==='tournament-hub'&&<TournamentHub
      onHome={goHome}
      onStart={newTourney}
      onJoin={()=>setScr('remote')}
      onCup={()=>setScr('dnacup')}/>}
    {/* RITMO DNA CUP — PIN-geschützter Event-Bereich (rein & raus nur mit PIN). */}
    {scr==='dnacup'&&<DnaCupScreen onExit={()=>setScr('tournament-hub')}/>}
    {scr==='ritmo-bibel'&&<RitmoBibel
      onHome={goHome}
      onRules={()=>nav('rules')}
      onJourney={()=>nav('journey')}
      onFaq={()=>setScr('app-faq')}
      onTab={handleTab}/>}
    {scr==='app-faq'&&<AppFAQ onBack={()=>setScr('ritmo-bibel')} onHome={goHome}/>}

    {/* Suche-Tab-Hub + Coming-Soon-Teaser (Liga, Buchungsassistent) */}
    {scr==='search-hub'&&<SearchHub nav={nav} onTab={handleTab}/>}
    {scr==='liga'&&<LigaScreen profile={profile} onHome={goHome}/>}
    {scr==='booking-assist'&&<ComingSoon
      icon={<AirPlayIcon size={52} color={T.o}/>}
      title="Buchungsassistent"
      desc="Finde freie Courts in deiner Nähe und buche direkt aus RITMO — abgestimmt auf deine Matches und deinen Club."
      bullets={[
        'Court-Verfügbarkeit in Echtzeit',
        'Buchung direkt aus dem Match-Setup',
        'Vorschläge passend zu deinen Mitspielern',
      ]}
      onHome={goHome}/>}

    {/* Match-Präferenzen (Herz auf der Startseite) */}
    {scr==='match-prefs'&&<MatchPrefs profile={profile} setProfile={setProfile}
      currentUid={currentUid} onHome={goHome}/>}

    {/* Discover-Teaser: News, Events, Weltrangliste */}
    {scr==='news'&&<ComingSoon
      icon={<ScrollIcon size={52} color={T.o}/>}
      title="Was gibt es neues?"
      desc="Alle Updates, neuen Features und Ankündigungen aus der RITMO Welt — gesammelt an einem Ort."
      bullets={[
        'Release Notes zu jeder App-Version',
        'Feature-Previews & Abstimmungen',
        'Community-Highlights des Monats',
      ]}
      onHome={goHome}/>}
    {scr==='events'&&<ComingSoon
      icon={<TrophyIcon size={52}/>}
      title="RITMO Events"
      desc="Cups, Socials und Special Events — vom Turnier bis zum Sunset Americano in deinem Club."
      bullets={[
        'Event-Kalender mit Anmeldung',
        'Club-Socials & Open Plays',
      ]}
      onHome={goHome}/>}
    {scr==='weltrangliste'&&<ComingSoon
      icon={<TargetIcon size={52} color={T.o}/>}
      title="Weltrangliste"
      desc="Die besten Spieler:innen der Welt — und wo du stehst. Offizielle Tour-Rankings plus das RITMO Community-Ranking."
      bullets={[
        'FIP / Premier Padel Rankings',
        'RITMO Community-Leaderboard',
        'Dein Verlauf über die Saison',
      ]}
      onHome={goHome}/>}

    {/* Undo-Toast — 5s Rückgängig-Fenster nach einem Löschen. Der
        dünne Balken unten läuft die Restzeit ab. */}
    {undoInfo&&(
      <div key={undoInfo.key} className="glass-bar slide-up"
        style={{position:'fixed',left:'50%',transform:'translateX(-50%)',
          bottom:'calc(env(safe-area-inset-bottom,0px) + 86px)',zIndex:60,
          borderRadius:17,padding:'11px 12px 13px 16px',overflow:'hidden',
          display:'flex',alignItems:'center',gap:14,maxWidth:'calc(100vw - 44px)'}}>
        <span style={{color:T.t1,fontSize:13.5,fontWeight:600,whiteSpace:'nowrap'}}>
          {undoInfo.label}
        </span>
        <button onClick={runUndo}
          style={{background:T.o,border:'none',borderRadius:10,padding:'7px 13px',
            color:'#000',fontSize:12.5,fontWeight:800,cursor:'pointer',
            flexShrink:0,letterSpacing:.2}}>
          Rückgängig
        </button>
        <span aria-hidden="true" style={{position:'absolute',left:0,right:0,bottom:0,
          height:2.5,background:T.o,transformOrigin:'left center',
          animation:'undoShrink 5s linear forwards',display:'block'}}/>
      </div>
    )}

    {/* First-launch disclaimer — liegt über allen Screens, blockiert
        Interaktion bis OK gedrückt wurde */}
    {!welcomeSeen&&<WelcomeNotice onConfirm={()=>setWelcomeSeen(true)}/>}

    {/* Verified-Landing nach Email-Verify (?verified=1 in der URL).
        Statisches Overlay ohne Buttons — User soll den Tab manuell
        schließen und sich neu einloggen. */}
    {verifyLanding&&<VerifiedLanding/>}
  </>);
}
