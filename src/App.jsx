import { useState, useEffect, useReducer, useCallback, useRef, Fragment } from "react";
import { SKILL_DESCRIPTIONS } from "./skillDescriptions.js";
import { loadProfile as dbLoadProfile, saveProfile as dbSaveProfile, logMatch as dbLogMatch, loadMatchStats as dbLoadMatchStats,
  createOnlineTournament, joinOnlineTournament, fetchOnlineTournament, updateOnlineTournament, subscribeToTournament,
  publishTournamentState, submitScore, approveScore, rejectScore, sendReadyCheck, confirmReady, clearReadyCheck,
  checkBetaKey, redeemBetaKey,
  // Social layer
  fetchPublicProfile, searchPlayers, followUser, unfollowUser, followCounts, isFollowing,
  listFollowers, listFollowing,
  listClubs, fetchClub, createClub, joinClub, leaveClub, clubMembers, isClubMember,
  listBookings, fetchBooking, createBooking, bookingSlots, joinSlot, leaveSlot,
  listIncomingInvites, sendInvite, respondInvite } from "./db.js";

/* ── Refactor (Phase 1): pure modules extracted from App.jsx.
   Components, screens and routing remain colocated here for now;
   only side-effect-free units are split out. See CLAUDE.md. */
import { T, CSS } from "./theme.js";
import { lsGet, lsSet, getAssetBase, getInitials, readImageAsDataUrl, resizeImage } from "./utils.js";
import { getLevelLabel, getLevelTier, getLevelColor, estimateLevel } from "./levels.js";
import { B0, A0, PL, ptD, wG, bo3R, amR } from "./game.js";
import { PCOLS, shuffle, genAmericanoRound, genMexicanoRound, calcLeaderboard } from "./tournament.js";
import { RINGS, playRing } from "./audio.js";
import { auth } from "./auth.js";
import {
  RitmoWordmark, RitmoSplashLogo, CourtIcon, RacketMini, TrophyIcon, JoinIcon,
  HomeIcon, LiveIcon, GearIcon, SearchIcon, Hl, DNAIcon, FullscreenIcon, EditIcon,
  ExitFullscreenIcon, KiwiIcon, PineappleIcon, CoconutIcon, TennisBallIcon, ParrotIcon,
  FunkyFruitsRow, BookIcon, JourneyIcon, ArrowRightCircleIcon, WandIcon,
  MiniBall, BallSpinner, GoogleGlyph, AppleGlyph, PersonGlyph,
  HeroRulesVisual, HeroJourneyVisual,
  // Settings + RITMO Post line-art icons
  SteeringWheelIcon, PaletteIcon, EyeIcon, BellIcon, LockIcon, DoorOutIcon,
  ChevronRightIcon, RitmoPostIcon,
} from "./icons.jsx";
import { PADEL_STYLES, PADEL_QUIZ, computeStyle, STYLE_IMAGES } from "./padelStyles.js";

/* ═══════════════════════════════════════════════════════════════
   Theme/CSS, helpers, reducers, auth, audio and icons all live in
   their dedicated modules now (imports above). The remainder of
   this file holds the screens and the root <App/> component that
   wires them together via the `scr` state machine.
═══════════════════════════════════════════════════════════════ */


/* ─── Landing pages ─────────────────────────────────────────── */
function RulesLanding({onHome,onContinue,onMarkRead,alreadyRead}){
  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden'}}>
      {/* Header */}
      <div style={{paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',
        padding:'calc(env(safe-area-inset-top,0px) + 60px) 22px 18px',
        flexShrink:0,zIndex:2,background:T.bg}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <BookIcon size={32}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:26,fontWeight:800,letterSpacing:-.3}}>Regelwerk</div>
            <div style={{color:T.t2,fontSize:14,marginTop:2,fontWeight:400}}>
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
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'calc(env(safe-area-inset-top,0px) + 60px) 22px 18px',
        flexShrink:0,zIndex:2,background:T.bg}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <JourneyIcon size={32}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:26,fontWeight:800,letterSpacing:-.3}}>Journey</div>
            <div style={{color:T.t2,fontSize:14,marginTop:2,fontWeight:400}}>
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

// Tennis Ball mini (für Splash-Spinner)
/* ═══════════════════════════════════════════════════════════════
   SPLASH SCREEN
═══════════════════════════════════════════════════════════════ */
function Splash({onDone}){
  const[ready,setReady]=useState(false);
  useEffect(()=>{
    const t=setTimeout(()=>setReady(true),1600);
    return()=>clearTimeout(t);
  },[]);
  return(
    <div onClick={ready?onDone:undefined}
      style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',gap:36,
        cursor:ready?'pointer':'default',userSelect:'none',position:'relative'}}>
      <div className="fi"><RitmoSplashLogo size={250}/></div>
      <div className="fi" style={{animationDelay:'.3s'}}><BallSpinner/></div>
      <div style={{position:'absolute',bottom:48,color:T.t3,fontSize:13,letterSpacing:.3,
        opacity:ready?1:0,transition:'opacity .4s'}}>
        Tippen um fortzufahren
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
        border:`1px solid ${T.border}`,borderRadius:18,
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
          style={{width:'100%',background:T.o,border:'none',borderRadius:12,
            padding:'13px 16px',color:'#000',fontSize:15,fontWeight:800,letterSpacing:.3,
            cursor:'pointer',boxShadow:'0 4px 14px var(--oGlow)'}}>
          OK
        </button>
      </div>
    </div>
  );
}

function Login({onSuccess,onRegister}){
  const[username,setUsername]=useState('');
  const[password,setPassword]=useState('');
  const[error,setError]=useState('');
  const[shake,setShake]=useState(false);
  const[busy,setBusy]=useState(false);

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
    setBusy(true);setError('');
    try{
      const result=await auth.signInWithEmail(username,password);
      onSuccess(result);
    }catch(e){
      fail(e.message||'Anmeldung fehlgeschlagen');
    }finally{setBusy(false);}
  };

  const onKeyDown=(e)=>{ if(e.key==='Enter') tryLogin(); };

  return(
    <div style={{minHeight:'100dvh',background:T.bg,display:'flex',
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
            background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
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
            background:'#000',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,
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
              borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:500,
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
              borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:500,
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

        {/* Submit */}
        <button onClick={tryLogin} disabled={busy}
          style={{background:T.o,border:'none',borderRadius:12,
            padding:'14px 16px',color:'#000',fontSize:15,fontWeight:800,letterSpacing:.2,
            cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,
            boxShadow:'0 4px 14px var(--oGlow)'}}>
          {busy?'…':'Anmelden'}
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
            border:`1px solid ${T.border}`,borderRadius:12,padding:'14px 14px 12px'}}>
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
                  borderRadius:10,padding:'10px 12px',color:T.t1,fontSize:13,fontWeight:500,
                  outline:'none',boxSizing:'border-box',marginBottom:10}}/>
              {resetError&&(
                <div style={{color:'#FF6B6B',fontSize:11,fontWeight:600,
                  marginBottom:8,paddingLeft:2}}>{resetError}</div>
              )}
              <button onClick={submitReset} disabled={resetBusy}
                style={{width:'100%',background:T.o,border:'none',borderRadius:10,
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

        <div style={{color:T.t3,fontSize:10,textAlign:'center',marginTop:18,
          letterSpacing:.3,opacity:0.7}}>
          Made by Team RITMO. With love for Padel ♡
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
      const r=await auth.signUpWithEmail(email,password);
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
    <div style={{minHeight:'100dvh',background:T.bg,display:'flex',
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
                  borderRadius:10,padding:'13px 14px',color:T.t1,fontSize:15,fontWeight:700,
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
              style={{background:T.o,border:'none',borderRadius:12,
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
              background:T.oSoft,border:`1px solid ${T.o}`,borderRadius:10}}>
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
                background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
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
                background:'#000',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,
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
                  borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:500,
                  outline:'none',boxSizing:'border-box'}}/>
            </div>

            {/* Password */}
            <div style={{marginBottom:10}}>
              <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
                textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Passwort</div>
              <input type="password" value={password}
                onChange={e=>{setPassword(e.target.value);setError('');}}
                onKeyDown={onKeyDown} autoComplete="new-password"
                placeholder="Mindestens 8 Zeichen"
                style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                  borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:500,
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
                  borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:500,
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
              style={{background:T.o,border:'none',borderRadius:12,
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

        <div style={{color:T.t3,fontSize:10,textAlign:'center',marginTop:18,
          letterSpacing:.3,opacity:0.7}}>
          Made by Team RITMO. With love for Padel ♡
        </div>
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
    <div style={{minHeight:'100dvh',background:T.bg,display:'flex',
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
        <div style={{color:T.t2,fontSize:14,lineHeight:1.5,textAlign:'center',
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
            borderRadius:12,padding:'12px 16px',color:T.t1,fontSize:13,fontWeight:600,
            cursor:(busy||resent)?'not-allowed':'pointer',opacity:(busy||resent)?.6:1,
            marginBottom:10}}>
          {resent?'✓ Erneut gesendet':'E-Mail erneut senden'}
        </button>

        <button onClick={()=>onSignIn?.(email)}
          style={{width:'100%',background:T.o,border:'none',borderRadius:12,
            padding:'14px 16px',color:'#000',fontSize:14,fontWeight:800,letterSpacing:.3,
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
    <div style={{minHeight:'100dvh',background:T.bg,display:'flex',
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
            placeholder="Mindestens 8 Zeichen"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:500,
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
              borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:500,
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
          style={{background:T.o,border:'none',borderRadius:12,
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
          textAlign:'center',marginTop:20,marginBottom:14,maxWidth:320,lineHeight:1.35}}>
          Deine Email ist nun bestätigt.
        </div>

        <div style={{color:T.t2,fontSize:14,lineHeight:1.55,textAlign:'center',
          maxWidth:320}}>
          Logge dich nun gerne in der Applikation ein.
        </div>

        <div style={{color:T.t3,fontSize:10,textAlign:'center',marginTop:28,
          letterSpacing:.3,opacity:0.7}}>
          Made by Team RITMO. With love for Padel ♡
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
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:24,padding:'30px 0'}}>
      <RitmoSplashLogo size={130}/>
      <div style={{color:T.t2,fontSize:14,textAlign:'center',maxWidth:300,lineHeight:1.6}}>
        Lass uns RITMO kurz für dich einrichten — dauert keine Minute.
      </div>
    </div>
  );
}

function ChapterName({profile,setProfile}){
  return(
    <div>
      <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
        textTransform:'uppercase',marginBottom:8,paddingLeft:4}}>
        Name oder Spitzname
      </div>
      <input value={profile.name}
        onChange={e=>setProfile(p=>({...p,name:e.target.value}))}
        placeholder="z.B. Alex"
        autoFocus autoCapitalize="words" autoCorrect="off" spellCheck={false}
        style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
          borderRadius:10,padding:'14px 16px',color:T.t1,fontSize:15,fontWeight:500,
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
      <div style={{color:T.t1,fontSize:14,fontWeight:700,marginBottom:sub?2:8,paddingLeft:2}}>{label}</div>
      {sub&&<div style={{color:T.t3,fontSize:11,marginBottom:8,paddingLeft:2,lineHeight:1.4}}>{sub}</div>}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {options.map(o=>{
          const sel=value===o.id;
          return(
            <button key={o.id} onClick={()=>onChange(o.id)}
              style={{padding:'12px 14px',textAlign:'left',
                background:sel?T.oSoft:T.card,
                border:`1.5px solid ${sel?T.o:T.border}`,
                borderRadius:10,color:T.t1,fontSize:13,fontWeight:sel?700:500,
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
            borderRadius:10,color:T.t1,fontSize:12,fontWeight:hasPlaytomic?700:500,
            cursor:'pointer',transition:'all .15s',lineHeight:1.3,textAlign:'center'}}>
          Habe Playtomic-Level
        </button>
        <button onClick={()=>setProfile(p=>({...p,playtomicLevel:null}))}
          style={{flex:1,padding:'11px 10px',
            background:!hasPlaytomic?T.oSoft:T.card,
            border:`1.5px solid ${!hasPlaytomic?T.o:T.border}`,
            borderRadius:10,color:T.t1,fontSize:12,fontWeight:!hasPlaytomic?700:500,
            cursor:'pointer',transition:'all .15s',lineHeight:1.3,textAlign:'center'}}>
          {'Habe ich nicht —\nGib mir ein RITMO Level 😉'}
        </button>
      </div>

      {hasPlaytomic?(
        /* ── Playtomic Level — 0.01-Schritte ── */
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
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
            <div style={{color:T.t1,fontSize:14,fontWeight:700,marginBottom:8,paddingLeft:2}}>
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
                borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:15,fontWeight:600,
                outline:'none',boxSizing:'border-box'}}/>
          </div>

          {m>0&&(
            <div style={{marginBottom:18}}>
              <div style={{color:T.t1,fontSize:14,fontWeight:700,marginBottom:8,paddingLeft:2}}>
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
                  borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:15,fontWeight:600,
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
              border:`1px solid ${T.o}`,borderRadius:12,padding:'16px 18px',
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

function StyleHeroCard({styleId}){
  const s=PADEL_STYLES[styleId];
  if(!s) return null;
  return(
    <div style={{background:'#F5EDDC',borderRadius:16,overflow:'hidden',
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
            <div key={k} style={{padding:'4px 10px',background:s.accent,borderRadius:20,
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
              borderRadius:14,color:'#1A1A1A',fontSize:11,fontWeight:500}}>
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
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
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
  // Stats aus der DB (ritmo_matches). Null = noch nicht geladen,
  // 0-Matches = Empty-State, sonst echte Aggregate.
  const[stats,setStats]=useState(null);
  useEffect(()=>{
    let alive=true;
    dbLoadMatchStats().then(s=>{
      if(!alive) return;
      // Falls keine Session/Supabase verfügbar (Test-User): Empty-State.
      setStats(s||{
        matches:0,wins:0,losses:0,winRate:0,
        formTrend:[],weeklyMatches:[0,0,0,0,0,0,0],
        weekDays:['M','D','M','D','F','S','S'],avgSets:'0',
      });
    }).catch(()=>{
      if(alive) setStats({
        matches:0,wins:0,losses:0,winRate:0,
        formTrend:[],weeklyMatches:[0,0,0,0,0,0,0],
        weekDays:['M','D','M','D','F','S','S'],avgSets:'0',
      });
    });
    return ()=>{alive=false;};
  },[]);
  // Während des Loadings: einen sicheren Default zeigen, damit Renderer
  // (Sparkline etc.) nicht auf undefined arrays crashen.
  const safeStats=stats||{
    matches:0,wins:0,losses:0,winRate:0,
    formTrend:[],weeklyMatches:[0,0,0,0,0,0,0],
    weekDays:['M','D','M','D','F','S','S'],avgSets:'0',
  };
  const hasMatches=safeStats.matches>0;

  const style=profile.styleType?PADEL_STYLES[profile.styleType]:null;
  const lvl=profile.playtomicLevel??profile.estimatedLevel;
  const accent=style?.accent||T.o;

  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
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

        {/* Spielstil Hero */}
        {profile.styleType&&(
          <div className="fi" style={{marginBottom:18}}>
            <StyleHeroCard styleId={profile.styleType}/>
          </div>
        )}

        {/* Section: Performance Übersicht */}
        <div className="fu" style={{animationDelay:'.1s',marginBottom:18}}>
          <div style={{color:T.t3,fontSize:11,fontWeight:800,letterSpacing:1.5,
            textTransform:'uppercase',marginBottom:10,paddingLeft:2}}>
            Performance Übersicht
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <StatTile label="Matches" value={safeStats.matches} color={T.t1}/>
            <StatTile label="Siege" value={safeStats.wins} color={'#1A8754'}/>
            <StatTile label="Niederlagen" value={safeStats.losses} color={'#E84545'}/>
            <StatTile label="Win Rate" value={safeStats.winRate} unit="%"
              color={accent}/>
          </div>
        </div>

        {hasMatches?(<>
        {/* Section: Form Trend */}
        <div className="fu" style={{animationDelay:'.15s',background:T.card,
          border:`1px solid ${T.border}`,borderRadius:14,padding:'16px 18px',marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',
            marginBottom:10}}>
            <div>
              <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
                textTransform:'uppercase',marginBottom:3}}>Form-Verlauf</div>
              <div style={{color:T.t1,fontSize:18,fontWeight:800,letterSpacing:-.3}}>
                Letzte {Math.min(safeStats.formTrend.length,12)} Matches
              </div>
            </div>
            <div style={{color:accent,fontSize:14,fontWeight:800}}>
              {(()=>{
                const f=safeStats.formTrend;
                if(f.length<3) return '→ Neu';
                const last=f.slice(-Math.min(4,f.length)).reduce((a,b)=>a+b,0)/Math.min(4,f.length);
                const all=f.reduce((a,b)=>a+b,0)/f.length;
                if(last>all+.3) return '↑ Steigend';
                if(last<all-.3) return '↓ Fallend';
                return '→ Stabil';
              })()}
            </div>
          </div>
          <Sparkline data={safeStats.formTrend} color={accent} height={70}/>
        </div>

        {/* Section: Match Aktivität pro Woche */}
        <div className="fu" style={{animationDelay:'.2s',background:T.card,
          border:`1px solid ${T.border}`,borderRadius:14,padding:'16px 18px',marginBottom:14}}>
          <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
            textTransform:'uppercase',marginBottom:3}}>Aktivität</div>
          <div style={{color:T.t1,fontSize:18,fontWeight:800,letterSpacing:-.3,marginBottom:14}}>
            Matches pro Woche
          </div>
          <BarChart values={safeStats.weeklyMatches} labels={safeStats.weekDays}
            color={accent} height={100}/>
        </div>
        </>):(
          <div className="fu" style={{animationDelay:'.15s',background:T.card,
            border:`1px solid ${T.border}`,borderRadius:14,padding:'24px 20px',
            marginBottom:14,textAlign:'center'}}>
            <div style={{color:T.t2,fontSize:14,fontWeight:700,marginBottom:6}}>
              Noch keine Matches geloggt
            </div>
            <div style={{color:T.t3,fontSize:12,lineHeight:1.5}}>
              Spiel ein Single Match oder ein Turnier — sobald es beendet ist,
              landet es automatisch hier in deinen Stats.
            </div>
          </div>
        )}

        {/* Section: Level & Ring */}
        {lvl!=null&&style&&(
          <div className="fu" style={{animationDelay:'.25s',background:T.card,
            border:`1px solid ${T.border}`,borderRadius:14,padding:'16px 18px',marginBottom:14,
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
            border:`1px solid ${T.border}`,borderRadius:14,padding:'16px 18px',marginBottom:14}}>
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
                return(
                  <button key={o.id} onClick={()=>{
                    const newQa={...qa,[q.key]:o.id};
                    const styleType=computeStyle(newQa);
                    setProfile(p=>({...p,quizAnswers:newQa,styleType}));
                  }} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',
                    background:sel?T.oSoft:T.card,
                    border:`1.5px solid ${sel?T.o:T.border}`,
                    borderRadius:9,color:T.t1,fontSize:12,fontWeight:sel?700:500,
                    cursor:'pointer',textAlign:'left',transition:'all .12s'}}>
                    <span style={{width:18,height:18,borderRadius:'50%',flexShrink:0,
                      background:sel?T.o:T.card2,border:`1.5px solid ${sel?T.o:T.border}`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      color:sel?'#000':T.t3,fontSize:10,fontWeight:800}}>
                      {o.id.toUpperCase()}
                    </span>
                    {o.label}
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
            borderRadius:12,padding:'14px 16px',marginBottom:16,
            display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontSize:28}}>{PADEL_STYLES[result].symbol}</div>
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
          {id:'right',label:'Rechtshänder 🤚'},
          {id:'left',label:'Linkshänder ✋'},
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
    {id:'dark',     label:'RITMO BAUHAUS Dark',  swatch:['#000000','#FF7A1A','#FFFFFF']},
    {id:'light',    label:'Federleicht',         swatch:['#FFFFFF','#FF9500','#000000']},
    {id:'padel',    label:'Padelhaus Blue',      swatch:['#0018F9','#FFD60A','#FFFFFF']},
    {id:'wimbledon',label:'Wimbledon Green',     swatch:['#006039','#D4B98F','#F4EFE3']},
    {id:'funky',    label:'RITMO BAUHAUS Funky', swatch:['#1A0918','#FFE52D','#FF3D5A']},
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
            borderRadius:12,padding:'12px 14px',
            cursor:'pointer',transition:'all .15s'}}>
            <div style={{display:'flex',flexShrink:0,borderRadius:5,overflow:'hidden',
              boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.06)'}}>
              {t.swatch.map((c,i)=>(
                <div key={i} style={{width:18,height:30,background:c}}/>
              ))}
            </div>
            <div style={{flex:1,color:T.t1,fontSize:14,fontWeight:sel?700:500}}>
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
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
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
          <div style={{color:T.t2,fontSize:14,marginTop:10,lineHeight:1.55,fontWeight:400}}>
            {current.subtitle}
          </div>
        </div>

        <div className="fu" style={{animationDelay:'.1s'}}>
          <Content {...current.contentProps}/>
        </div>
      </div>

      {/* Footer: back + primary CTA */}
      <div style={{padding:'14px 22px calc(env(safe-area-inset-bottom,0px) + 22px)',
        display:'flex',gap:10,alignItems:'center',background:T.bg,
        borderTop:`1px solid ${T.sep}`}}>
        {step>0&&(
          <button onClick={goBack}
            style={{padding:'14px 18px',background:T.card,
              border:`1px solid ${T.border}`,borderRadius:12,
              color:T.t1,fontSize:14,fontWeight:600,cursor:'pointer'}}>
            Zurück
          </button>
        )}
        <button onClick={goNext} disabled={!current.canContinue()}
          style={{flex:1,padding:'14px 18px',
            background:current.canContinue()?T.o:T.card2,
            border:current.canContinue()?'none':`1px solid ${T.border}`,
            borderRadius:12,
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
function TabBar({active,onTab,rightAction,searchable=false,onSearch}){
  const tabs=[
    {id:'home',label:'Home',Icon:HomeIcon},
    {id:'live',label:'Live',Icon:LiveIcon},
    {id:'settings',label:'Einstellungen',Icon:GearIcon},
  ];
  // Search-Mode: nur aktiv wenn searchable=true. Tab "Home" bleibt sichtbar,
  // die anderen schrumpfen via maxWidth/opacity raus, ein Such-Input
  // expandiert in den freigewordenen Platz.
  const[searchMode,setSearchMode]=useState(false);
  const[searchValue,setSearchValue]=useState('');
  const inputRef=useRef(null);

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
      bottom:'max(1px, calc(env(safe-area-inset-bottom,0px) - 2px))',
      left:0,right:0,display:'flex',alignItems:'center',justifyContent:'center',gap:10,
      padding:'0 20px',pointerEvents:'none',zIndex:5}}>
      <div style={{display:'flex',alignItems:'center',gap:2,
        background:T.card,borderRadius:30,padding:'5px',
        border:`1px solid ${T.border}`,pointerEvents:'auto',
        boxShadow:'0 4px 20px rgba(0,0,0,.6)',
        transition:'padding .25s ease'}}>
        {tabs.map(({id,label,Icon})=>{
          const isActive=active===id;
          // Im Search-Mode bleibt nur Home sichtbar; Live + Settings
          // animieren weg (Breite/Padding/Opacity).
          const hidden=isSearching&&id!=='home';
          return(
            <button key={id} onClick={()=>onTab(id)}
              style={{display:'flex',alignItems:'center',gap:7,
                padding:hidden?'10px 0':'10px 14px',
                maxWidth:hidden?0:200,
                opacity:hidden?0:1,
                overflow:'hidden',
                borderRadius:24,border:'none',cursor:'pointer',
                background:isActive?T.blueSoft:'transparent',
                color:isActive?T.blue:T.t2,
                fontSize:11,fontWeight:600,
                transition:'max-width .25s ease, padding .25s ease, opacity .2s ease'}}>
              <Icon active={isActive} size={20}/>
              <span style={{fontSize:11,color:isActive?T.blue:T.t3,
                fontWeight:isActive?700:500,whiteSpace:'nowrap'}}>{label}</span>
            </button>
          );
        })}
        {searchable&&(
          <input ref={inputRef}
            value={searchValue}
            onChange={e=>setSearchValue(e.target.value)}
            onKeyDown={e=>{
              if(e.key==='Enter') submit();
              else if(e.key==='Escape') exitSearch();
            }}
            placeholder="Einstellungen durchsuchen…"
            autoCorrect="off" autoCapitalize="off" spellCheck={false}
            style={{
              flex:isSearching?1:0,
              maxWidth:isSearching?260:0,
              opacity:isSearching?1:0,
              padding:isSearching?'8px 10px':'8px 0',
              minWidth:0,
              border:'none',background:'transparent',outline:'none',
              color:T.t1,fontSize:13,fontWeight:500,
              transition:'max-width .25s ease, padding .25s ease, opacity .2s ease'}}/>
        )}
        {searchable&&isSearching&&searchValue&&(
          <button onClick={clearText} title="Eingabe löschen"
            className="fi"
            style={{
              width:22,height:22,borderRadius:'50%',
              background:T.card2,border:'none',
              color:T.t1,fontSize:12,fontWeight:700,
              cursor:'pointer',marginRight:4,
              display:'flex',alignItems:'center',justifyContent:'center',
              flexShrink:0,lineHeight:1}}>
            ×
          </button>
        )}
      </div>
      <button onClick={rightClick} title={rightTitle}
        style={{width:48,height:48,borderRadius:'50%',
          background:T.card,
          border:`1px solid ${rightHighlight?T.o:T.border}`,
          display:'flex',alignItems:'center',justifyContent:'center',
          cursor:rightClick?'pointer':'default',pointerEvents:'auto',
          transition:'border-color .2s ease, box-shadow .2s ease',
          boxShadow:rightHighlight
            ?`0 4px 20px rgba(0,0,0,.6), 0 0 0 2px ${T.o}33`
            :'0 4px 20px rgba(0,0,0,.6)'}}>
        {rightIcon}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   IN-MATCH BOTTOM BAR (Home + Search separat)
═══════════════════════════════════════════════════════════════ */
function MatchBar({onHome,rightIcon,onRight,rightButtons}){
  const baseStyle={
    width:48,height:48,borderRadius:'50%',
    background:T.card,border:`1px solid ${T.border}`,
    display:'flex',alignItems:'center',justifyContent:'center',
    pointerEvents:'auto',
    boxShadow:'0 4px 20px rgba(0,0,0,.6)',
    flexShrink:0,
  };
  // Legacy single-button mode → wrap into array
  const buttons=rightButtons||(rightIcon?[{icon:rightIcon,onClick:onRight}]:[]);
  return(
    <div style={{position:'absolute',bottom:'calc(env(safe-area-inset-bottom,0px) + 20px)',
      left:0,right:0,display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'0 24px',pointerEvents:'none',zIndex:5}}>
      <button onClick={onHome} style={{...baseStyle,cursor:'pointer'}}>
        <HomeIcon size={20}/>
      </button>
      <div style={{display:'flex',gap:10,alignItems:'center',pointerEvents:'auto'}}>
        {buttons.map((btn,i)=>(
          <button key={i} onClick={btn.onClick} disabled={btn.disabled}
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
      {avatar
        ?<img src={avatar} alt={name||'Profil'}
          style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
        :(init||<span style={{color:T.t2}}><PersonGlyph size={size*0.55}/></span>)}
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
      <button onClick={()=>inputRef.current?.click()} aria-label="Profilbild ändern"
        style={{position:'absolute',right:-2,bottom:-2,
          width:26,height:26,borderRadius:'50%',
          background:T.o,border:`2px solid ${T.bg}`,color:'#000',
          fontSize:13,fontWeight:800,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 2px 6px rgba(0,0,0,.35)'}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <input ref={inputRef} type="file" accept="image/*"
        onChange={onPick} style={{display:'none'}}/>
    </div>
  );
}


function Profile({profile,setProfile,onHome,onLogout,onResetOnboarding,onOpenRitmoDNA,
  currentUid,onOpenFollowers,onOpenFollowing}){
  // Nur die Labels, die noch in der Tag-Reihe der Level-Karte gerendert werden.
  const handLabels={right:'Rechtshänder',left:'Linkshänder'};
  const sideLabels={left:'Ad-Seite (links)',right:'Deuce-Seite (rechts)',any:'Beides geht'};

  const[editingLevel,setEditingLevel]=useState(false);
  // Follower-Counts werden bei jedem Mount frisch geladen, damit nach
  // Follow/Unfollow im anderen Screen die Anzeige aktualisiert.
  const[counts,setCounts]=useState({followers:0,following:0});
  useEffect(()=>{
    if(!currentUid) return;
    let cancelled=false;
    followCounts(currentUid).then(c=>{ if(!cancelled) setCounts(c); });
    return()=>{cancelled=true;};
  },[currentUid]);

  const lvl=profile.playtomicLevel??profile.estimatedLevel??estimateLevel(profile);
  const isEstimated=profile.playtomicLevel==null&&lvl!=null;
  const isPublic=!profile.private;
  const togglePublic=()=>setProfile(p=>({...p,private:!p.private?true:false}));

  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 22px 18px'}}>
        <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.5,marginBottom:4}}>PROFIL</div>
        <div style={{color:T.t1,fontSize:26,fontWeight:800,letterSpacing:-.3}}>
          {profile.name||'Spieler'}
        </div>
      </div>

      <div style={{flex:1,padding:'0 22px',overflowY:'auto',WebkitOverflowScrolling:'touch'}}>

        {/* Spielniveau — avatar + level (TOP) */}
        <div className="fi" style={{background:T.card,border:`1px solid ${T.border}`,
          borderRadius:16,padding:'24px 20px',marginBottom:14,
          display:'flex',alignItems:'center',gap:18}}>
          <AvatarWithUpload profile={profile} setProfile={setProfile} size={72}/>
          <div style={{flex:1,minWidth:0}}>
            {lvl!=null?(
              <>
                <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
                  textTransform:'uppercase',marginBottom:2}}>
                  {isEstimated?'RITMO Level':'Playtomic Level'}
                </div>
                {isEstimated&&editingLevel?(
                  <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
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
                ):(
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{color:T.o,fontSize:38,fontWeight:900,letterSpacing:-.8,lineHeight:1}}>
                      {lvl.toFixed(2)}
                    </div>
                    {isEstimated&&(
                      <button onClick={()=>setEditingLevel(true)}
                        style={{background:'none',border:'none',padding:4,cursor:'pointer',
                          display:'flex',alignItems:'center',color:T.t3,flexShrink:0}}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                  <div style={{color:T.o,fontSize:12,fontWeight:700}}>
                    {getLevelLabel(lvl)}
                  </div>
                  <div style={{padding:'1px 6px',background:getLevelColor(lvl),
                    color:'#fff',borderRadius:4,fontSize:9,fontWeight:900,letterSpacing:.5}}>
                    {getLevelTier(lvl)}
                  </div>
                </div>
                {/* RITMO-DNA Tags: Hand · Seite · Spielstil-Archetyp.
                    Jedes Tag wird nur gerendert, wenn der zugehörige
                    Profil-Wert gesetzt ist — fehlt alles, fällt der
                    ganze Block weg. */}
                {(profile.handPreference||profile.courtSide||profile.styleType)&&(
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:10}}>
                    {profile.handPreference&&(
                      <span style={{padding:'3px 8px',background:T.card2,
                        border:`1px solid ${T.border}`,borderRadius:6,
                        color:T.t2,fontSize:10,fontWeight:700,letterSpacing:.3,
                        textTransform:'uppercase'}}>
                        {handLabels[profile.handPreference]||profile.handPreference}
                      </span>
                    )}
                    {profile.courtSide&&(
                      <span style={{padding:'3px 8px',background:T.card2,
                        border:`1px solid ${T.border}`,borderRadius:6,
                        color:T.t2,fontSize:10,fontWeight:700,letterSpacing:.3,
                        textTransform:'uppercase'}}>
                        {sideLabels[profile.courtSide]||profile.courtSide}
                      </span>
                    )}
                    {profile.styleType&&PADEL_STYLES[profile.styleType]&&(
                      <span style={{padding:'3px 8px',
                        background:`${PADEL_STYLES[profile.styleType].accent}22`,
                        border:`1px solid ${PADEL_STYLES[profile.styleType].accent}`,
                        borderRadius:6,
                        color:PADEL_STYLES[profile.styleType].accent,
                        fontSize:10,fontWeight:800,letterSpacing:.3,
                        textTransform:'uppercase'}}>
                        {PADEL_STYLES[profile.styleType].name}
                      </span>
                    )}
                  </div>
                )}
              </>
            ):(
              <div style={{color:T.t3,fontSize:13,lineHeight:1.5}}>Noch kein Spielniveau eingetragen.</div>
            )}
          </div>
        </div>

        {/* RITMO DNA — Entry card to dedicated screen */}
        {profile.styleType?(
          <button onClick={()=>onOpenRitmoDNA&&onOpenRitmoDNA()} className="fu"
            style={{animationDelay:'.05s',width:'100%',
              background:'linear-gradient(135deg,#1A1A1A 0%,#000000 100%)',
              border:`1px solid ${PADEL_STYLES[profile.styleType].accent}40`,
              borderRadius:16,padding:'20px 20px',marginBottom:14,
              display:'flex',alignItems:'center',gap:16,cursor:'pointer',
              boxShadow:`0 0 0 1px ${PADEL_STYLES[profile.styleType].accent}20, 0 4px 20px rgba(0,0,0,0.4)`,
              textAlign:'left',color:'#FFF'}}>
            {/* DNA helix icon */}
            <div style={{width:56,height:56,borderRadius:'50%',flexShrink:0,
              background:`${PADEL_STYLES[profile.styleType].accent}22`,
              border:`1.5px solid ${PADEL_STYLES[profile.styleType].accent}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                stroke={PADEL_STYLES[profile.styleType].accent} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4 C 4 10, 20 14, 20 20"/>
                <path d="M20 4 C 20 10, 4 14, 4 20"/>
                <line x1="6" y1="6" x2="18" y2="6"/>
                <line x1="6" y1="18" x2="18" y2="18"/>
                <line x1="9" y1="10" x2="15" y2="10"/>
                <line x1="9" y1="14" x2="15" y2="14"/>
              </svg>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:3}}>
                <div style={{fontSize:18,fontWeight:900,letterSpacing:-.3,color:'#FFF'}}>
                  RITMO <span style={{color:PADEL_STYLES[profile.styleType].accent}}>DNA</span>
                </div>
              </div>
              <div style={{color:'rgba(255,255,255,0.6)',fontSize:12,lineHeight:1.4}}>
                Dein Stil · Dein Rhythmus · Deine Stats
              </div>
              <div style={{color:PADEL_STYLES[profile.styleType].accent,fontSize:11,
                fontWeight:700,marginTop:6,letterSpacing:.5,textTransform:'uppercase'}}>
                {PADEL_STYLES[profile.styleType].name} · {PADEL_STYLES[profile.styleType].subtitle}
              </div>
            </div>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:22,fontWeight:600}}>›</div>
          </button>
        ):(
          <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
            borderRadius:14,padding:'16px 18px',marginBottom:14,animationDelay:'.05s'}}>
            <div style={{color:T.t3,fontSize:13,lineHeight:1.5}}>
              Spielstil noch nicht bestimmt — Onboarding-Quiz abschließen.
            </div>
          </div>
        )}

        {/* Followers / Following — Counter-Karten, tap öffnet die Liste */}
        <div className="fu" style={{display:'flex',gap:10,marginBottom:14,animationDelay:'.08s'}}>
          <button onClick={()=>onOpenFollowers&&onOpenFollowers()}
            style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
              padding:'14px 12px',textAlign:'center',cursor:'pointer',color:T.t1}}>
            <div style={{fontSize:22,fontWeight:900,letterSpacing:-.3}}>{counts.followers}</div>
            <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
              textTransform:'uppercase',marginTop:2}}>Follower</div>
          </button>
          <button onClick={()=>onOpenFollowing&&onOpenFollowing()}
            style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
              padding:'14px 12px',textAlign:'center',cursor:'pointer',color:T.t1}}>
            <div style={{fontSize:22,fontWeight:900,letterSpacing:-.3}}>{counts.following}</div>
            <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
              textTransform:'uppercase',marginTop:2}}>Folgt</div>
          </button>
        </div>

        {/* Sichtbarkeit — Public Profile Toggle.
            Spiegelt profile.private; das Schema-Trigger synchronisiert
            is_public beim Save, sodass das Profil in Suchen auftaucht. */}
        <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
          borderRadius:14,padding:'14px 18px',marginBottom:14,animationDelay:'.1s',
          display:'flex',alignItems:'center',gap:12}}>
          <div style={{flexShrink:0,width:36,height:36,borderRadius:10,background:T.card2,
            border:`1px solid ${T.border}`,color:isPublic?T.o:T.t3,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <EyeIcon size={20}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:14,fontWeight:700}}>
              {isPublic?'Profil öffentlich':'Profil privat'}
            </div>
            <div style={{color:T.t3,fontSize:11,marginTop:2,lineHeight:1.45}}>
              {isPublic
                ?'Andere Spieler:innen können dich finden und folgen.'
                :'Niemand kann dich finden — nur du siehst dein Profil.'}
            </div>
          </div>
          <div onClick={togglePublic}
            style={{width:48,height:28,borderRadius:14,
              background:isPublic?T.o:'rgba(120,120,128,.32)',
              position:'relative',cursor:'pointer',transition:'background .25s',flexShrink:0}}>
            <div style={{width:24,height:24,borderRadius:'50%',background:T.bg,
              position:'absolute',top:2,left:isPublic?22:2,transition:'left .25s',
              boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
          </div>
        </div>

        {/* Actions */}
        <div className="fu" style={{animationDelay:'.15s',
          display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
          <button onClick={onResetOnboarding}
            style={{padding:'13px 16px',background:T.card,
              border:`1px solid ${T.border}`,borderRadius:12,
              color:T.t1,fontSize:14,fontWeight:600,cursor:'pointer',
              textAlign:'left'}}>
            Onboarding wiederholen
          </button>
          <button onClick={onLogout}
            style={{padding:'13px 16px',background:'rgba(232,69,69,0.08)',
              border:'1px solid rgba(232,69,69,0.35)',borderRadius:12,
              color:'#FF6B6B',fontSize:14,fontWeight:700,cursor:'pointer',
              textAlign:'left'}}>
            Abmelden
          </button>
        </div>

        <div style={{height:120,flexShrink:0}}/>
      </div>

      <MatchBar onHome={onHome}/>
    </div>
  );
}

function Home({nav,activeTab,setActiveTab,profile,onboarded}){
  // Hinweis-Banner falls Onboarding nicht abgeschlossen ist UND der
  // User nicht den Test-Bypass benutzt (Test-User hat onboarded=true).
  const needsOnboarding=!onboarded;
  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      position:'relative',overflow:'hidden'}}>

      {/* HEADER ZONE — gradient via theme CSS var.
          Reduziertes Horizontal-Padding (14px statt 22px) lässt das Logo
          und den Avatar näher an den Rand rücken. Logo + Avatar liegen
          in einer eigenen flex row, vertikal mittig zueinander zentriert,
          damit der Avatar bündig mit dem Logo sitzt. Texte darunter. */}
      <div style={{
        padding:'calc(env(safe-area-inset-top,0px) + 60px) 9px 40px',
        background:'var(--headerGrad)',
        position:'relative',zIndex:1,
        cursor:'pointer',
      }} onClick={()=>nav('profile-ritmodna')}>
        <div style={{display:'flex',alignItems:'center',
          justifyContent:'space-between',gap:14}}>
          <RitmoWordmark size={52} style={{marginLeft:-3}}/>
          {/* Rechts gruppiert: RITMO Post Icon + Profil-Avatar, vertikal
              zentriert ausgerichtet zueinander. Beide stoppen die
              Header-onClick-Propagation, damit der Tap nicht durch zum
              DNA-Screen rutscht. */}
          <div style={{display:'flex',alignItems:'center',gap:14,marginRight:5}}>
            <button onClick={(e)=>{e?.stopPropagation?.();nav('ritmopost');}}
              aria-label="RITMO Post"
              style={{width:44,height:44,borderRadius:'50%',flexShrink:0,
                background:'rgba(0,0,0,0.22)',border:'1px solid rgba(255,255,255,0.18)',
                color:'#FFFFFF',cursor:'pointer',padding:0,
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:'0 2px 8px rgba(0,0,0,0.25)'}}>
              <RitmoPostIcon size={22} color="currentColor"/>
            </button>
            <ProfileAvatar name={profile?.name} avatar={profile?.avatar} size={88}
              onClick={(e)=>{e?.stopPropagation?.();nav('profile');}}/>
          </div>
        </div>
        {profile?.name?(
          <div style={{color:T.t1,fontSize:18,fontWeight:700,marginTop:10,marginLeft:10,letterSpacing:-.2}}>
            Hi, {profile.name}! 👋
          </div>
        ):null}
        <div style={{color:T.t2,fontSize:14,marginTop:profile?.name?4:8,marginLeft:10,fontWeight:400}}>
          Wähle deinen Modus.
        </div>
        {document.documentElement.getAttribute('data-theme')==='funky'&&(
          <div style={{marginTop:14,marginLeft:10}}><FunkyFruitsRow size={20} gap={10}/></div>
        )}
      </div>

      {/* CORPUS — drawer-style panel (rounded top, elevated shadow) */}
      <div style={{
        flex:1,
        background:T.bg,
        borderTopLeftRadius:24,
        borderTopRightRadius:24,
        marginTop:-20,
        boxShadow:'0 -10px 28px rgba(0,0,0,0.55), 0 -1px 0 rgba(255,255,255,0.04) inset',
        padding:'26px 22px 0',
        display:'flex',flexDirection:'column',gap:14,
        overflowY:'auto',WebkitOverflowScrolling:'touch',
        position:'relative',zIndex:2,
      }}>

        {/* Onboarding-Prompt — sichtbar wenn das Profil noch nicht
            durch das Onboarding gelaufen ist. */}
        {needsOnboarding&&(
          <button onClick={()=>nav('welcome')} className="fu"
            style={{background:T.oSoft,border:`1px solid ${T.o}`,borderRadius:18,
              padding:'16px 18px',display:'flex',alignItems:'center',gap:14,
              cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s',
              animationDelay:'.02s'}}
            onPointerDown={e=>e.currentTarget.style.background=T.card2}
            onPointerUp={e=>e.currentTarget.style.background=T.oSoft}
            onPointerLeave={e=>e.currentTarget.style.background=T.oSoft}>
            <div style={{fontSize:28,lineHeight:1,flexShrink:0}}>✨</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.o,fontSize:14,fontWeight:800,marginBottom:2,letterSpacing:.2}}>
                Profil vervollständigen
              </div>
              <div style={{color:T.t2,fontSize:11,fontWeight:500,lineHeight:1.45}}>
                Beantworte ein paar Fragen und entdecke deinen RITMO-Spielstil.
              </div>
            </div>
            <div style={{color:T.o,fontSize:18,fontWeight:800,flexShrink:0}}>›</div>
          </button>
        )}

        {/* Single Match */}
        <button onClick={()=>nav('single-setup')} className="fu"
          style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,
            padding:'18px 20px',display:'flex',alignItems:'center',gap:18,
            cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s'}}
          onPointerDown={e=>e.currentTarget.style.background=T.card2}
          onPointerUp={e=>e.currentTarget.style.background=T.card}
          onPointerLeave={e=>e.currentTarget.style.background=T.card}>
          <CourtIcon size={42}/>
          <div style={{flex:1}}>
            <div style={{color:T.o,fontSize:18,fontWeight:700,marginBottom:3}}>Single Match</div>
            <div style={{color:T.t3,fontSize:12,fontWeight:500}}>Best of 3 | Americano</div>
          </div>
        </button>

        {/* Turnier */}
        <button onClick={()=>nav('tournament-setup')} className="fu"
          style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,
            padding:'18px 20px',display:'flex',alignItems:'center',gap:18,
            cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s',
            animationDelay:'.06s'}}
          onPointerDown={e=>e.currentTarget.style.background=T.card2}
          onPointerUp={e=>e.currentTarget.style.background=T.card}
          onPointerLeave={e=>e.currentTarget.style.background=T.card}>
          <TrophyIcon size={42}/>
          <div style={{flex:1}}>
            <div style={{color:T.o,fontSize:18,fontWeight:700,marginBottom:3}}>Turnier</div>
            <div style={{color:T.t3,fontSize:12,fontWeight:500}}>Americano | Mexicano</div>
          </div>
        </button>

        {/* Matches buchen — offene Spielangebote */}
        <button onClick={()=>nav('bookings')} className="fu"
          style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,
            padding:'18px 20px',display:'flex',alignItems:'center',gap:18,
            cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s',
            animationDelay:'.08s'}}
          onPointerDown={e=>e.currentTarget.style.background=T.card2}
          onPointerUp={e=>e.currentTarget.style.background=T.card}
          onPointerLeave={e=>e.currentTarget.style.background=T.card}>
          <CourtIcon size={42}/>
          <div style={{flex:1}}>
            <div style={{color:T.o,fontSize:18,fontWeight:700,marginBottom:3}}>Match buchen</div>
            <div style={{color:T.t3,fontSize:12,fontWeight:500}}>Offene Matches | Spieler einladen</div>
          </div>
        </button>

        {/* Community: Spieler-Suche + Clubs in einer Zeile */}
        <div className="fu" style={{display:'flex',gap:10,animationDelay:'.1s'}}>
          <button onClick={()=>nav('player-search')}
            style={{flex:1,background:'transparent',border:`1px solid ${T.border}`,borderRadius:16,
              padding:'14px 14px',display:'flex',flexDirection:'column',alignItems:'flex-start',
              gap:8,cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s'}}
            onPointerDown={e=>e.currentTarget.style.background=T.card2}
            onPointerUp={e=>e.currentTarget.style.background='transparent'}
            onPointerLeave={e=>e.currentTarget.style.background='transparent'}>
            <SearchIcon size={22}/>
            <div>
              <div style={{color:T.o,fontSize:14,fontWeight:700,marginBottom:1}}>Spieler</div>
              <div style={{color:T.t3,fontSize:11,fontWeight:500}}>Suchen | Folgen</div>
            </div>
          </button>
          <button onClick={()=>nav('clubs')}
            style={{flex:1,background:'transparent',border:`1px solid ${T.border}`,borderRadius:16,
              padding:'14px 14px',display:'flex',flexDirection:'column',alignItems:'flex-start',
              gap:8,cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s'}}
            onPointerDown={e=>e.currentTarget.style.background=T.card2}
            onPointerUp={e=>e.currentTarget.style.background='transparent'}
            onPointerLeave={e=>e.currentTarget.style.background='transparent'}>
            <TrophyIcon size={22}/>
            <div>
              <div style={{color:T.o,fontSize:14,fontWeight:700,marginBottom:1}}>Clubs</div>
              <div style={{color:T.t3,fontSize:11,fontWeight:500}}>Beitreten | Gründen</div>
            </div>
          </button>
        </div>

        {/* Turnier beitreten */}
        <button onClick={()=>nav('remote')} className="fu"
          style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:16,
            padding:'14px 20px',display:'flex',alignItems:'center',gap:16,
            cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s',
            animationDelay:'.12s'}}
          onPointerDown={e=>e.currentTarget.style.background=T.card2}
          onPointerUp={e=>e.currentTarget.style.background='transparent'}
          onPointerLeave={e=>e.currentTarget.style.background='transparent'}>
          <JoinIcon size={28}/>
          <div style={{flex:1}}>
            <div style={{color:T.o,fontSize:15,fontWeight:700,marginBottom:1}}>Turnier beitreten</div>
            <div style={{color:T.t3,fontSize:11,fontWeight:500}}>PIN eingeben | Ergebnis übertragen</div>
          </div>
        </button>

        {/* Regelwerk */}
        <button onClick={()=>nav('rules')} className="fu"
          style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:16,
            padding:'14px 20px',display:'flex',alignItems:'center',gap:16,
            cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s',
            animationDelay:'.18s'}}
          onPointerDown={e=>e.currentTarget.style.background=T.card2}
          onPointerUp={e=>e.currentTarget.style.background='transparent'}
          onPointerLeave={e=>e.currentTarget.style.background='transparent'}>
          <BookIcon size={28}/>
          <div style={{flex:1}}>
            <div style={{color:T.o,fontSize:15,fontWeight:700,marginBottom:1}}>Regelwerk</div>
            <div style={{color:T.t3,fontSize:11,fontWeight:500}}>Padel-Regeln | Formate | Begriffe</div>
          </div>
        </button>

        {/* Journey — Tipps & Tricks */}
        <button onClick={()=>nav('journey')} className="fu"
          style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:16,
            padding:'14px 20px',display:'flex',alignItems:'center',gap:16,
            cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s',
            animationDelay:'.22s'}}
          onPointerDown={e=>e.currentTarget.style.background=T.card2}
          onPointerUp={e=>e.currentTarget.style.background='transparent'}
          onPointerLeave={e=>e.currentTarget.style.background='transparent'}>
          <JourneyIcon size={28}/>
          <div style={{flex:1}}>
            <div style={{color:T.o,fontSize:15,fontWeight:700,marginBottom:1}}>Journey</div>
            <div style={{color:T.t3,fontSize:11,fontWeight:500}}>Tipps & Tricks | Taktik | Material</div>
          </div>
        </button>

        {/* Internal scroll-bottom spacer so last card isn't hidden behind floating TabBar */}
        <div style={{height:120,flexShrink:0}}/>
      </div>

      <TabBar active={activeTab} onTab={setActiveTab}/>
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
      borderRadius:18,padding:'20px 22px',
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
  // Initialize players: prefer stored, else seed mit Defaults — Spieler 1
  // ist der User, die anderen kriegen einen generischen "Spieler N" Namen
  // damit das Setup ohne Tippen direkt startbar ist.
  const[players,setPlayers]=useState(()=>{
    const stored=cfg.players;
    if(stored&&stored.length===4) return stored;
    return [userName,'Spieler 2','Spieler 3','Spieler 4'];
  });
  const setPlayer=(idx,val)=>setPlayers(p=>p.map((v,i)=>i===idx?val:v));

  const[fmt,setFmt]=useState(cfg.format||'bo3');
  const[amLim,setAmLim]=useState(cfg.amLimit??21);
  const[gpAfter,setGpAfter]=useState(cfg.goldenPointAfter??null);

  // Computed team display names (used during scoring)
  const teamA=[players[0]||'Spieler 1',players[1]||'Spieler 2'].join(' & ');
  const teamB=[players[2]||'Spieler 3',players[3]||'Spieler 4'].join(' & ');

  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 9px 22px',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <RitmoWordmark size={52} style={{marginLeft:-3}}/>
          <div style={{color:T.t2,fontSize:30,marginTop:6,marginLeft:10,fontWeight:800}}>Single Match</div>
        </div>
        <CourtIcon size={36}/>
      </div>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>

        <SetupHero
          icon={<CourtIcon size={36}/>}
          title="Schnelles Match"
          desc="Du, dein Partner, zwei Gegner. Wähle Best-of-3 oder Americano und leg los."/>

        {/* Team 1 */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14}}>
          <div style={{padding:'14px 18px 6px',color:T.o,fontSize:11,fontWeight:700,
            letterSpacing:1.3,textTransform:'uppercase'}}>
            Team 1
          </div>
          {[0,1].map(idx=>{
            const isUser=idx===0;
            return(
              <div key={idx} style={{display:'flex',alignItems:'center',
                padding:'14px 18px',borderTop:`1px solid ${T.sep}`,gap:12}}>
                <span style={{color:T.t1,fontSize:14,fontWeight:600,
                  width:94,flexShrink:0,display:'flex',alignItems:'center',gap:5}}>
                  Spieler {idx+1}
                  {isUser&&<span style={{color:T.o,fontWeight:700}}>(Du)</span>}
                </span>
                <input value={players[idx]}
                  onChange={e=>setPlayer(idx,e.target.value)}
                  placeholder={isUser?'Dein Name':`Spieler ${idx+1}`}
                  autoCapitalize="words" autoCorrect="off" spellCheck={false}
                  style={{flex:1,fontSize:14,color:T.t2,fontWeight:500,textAlign:'right',
                    background:'transparent',border:'none',outline:'none'}}/>
                <button onClick={()=>setPlayer(idx,'')}
                  style={{width:20,height:20,borderRadius:'50%',background:T.t4,border:'none',
                    color:T.t1,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',
                    justifyContent:'center',fontWeight:700,flexShrink:0}}>×</button>
              </div>
            );
          })}
        </div>

        {/* Team 2 */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14}}>
          <div style={{padding:'14px 18px 6px',color:T.o,fontSize:11,fontWeight:700,
            letterSpacing:1.3,textTransform:'uppercase'}}>
            Team 2
          </div>
          {[2,3].map(idx=>(
            <div key={idx} style={{display:'flex',alignItems:'center',
              padding:'14px 18px',borderTop:`1px solid ${T.sep}`,gap:12}}>
              <span style={{color:T.t1,fontSize:14,fontWeight:600,
                width:94,flexShrink:0}}>
                Spieler {idx+1}
              </span>
              <input value={players[idx]}
                onChange={e=>setPlayer(idx,e.target.value)}
                placeholder={`Spieler ${idx+1}`}
                autoCapitalize="words" autoCorrect="off" spellCheck={false}
                style={{flex:1,fontSize:14,color:T.t2,fontWeight:500,textAlign:'right',
                  background:'transparent',border:'none',outline:'none'}}/>
              <button onClick={()=>setPlayer(idx,'')}
                style={{width:20,height:20,borderRadius:'50%',background:T.t4,border:'none',
                  color:T.t1,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',
                  justifyContent:'center',fontWeight:700,flexShrink:0}}>×</button>
            </div>
          ))}
        </div>

        {/* Spielmodus */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
          padding:'18px 18px 20px'}}>
          <div style={{color:T.o,fontSize:21,fontWeight:800,marginBottom:14}}>Spielmodus</div>

          <div style={{display:'flex',background:T.card2,borderRadius:30,padding:4,gap:4,
            border:`1px solid ${T.border}`,marginBottom:14}}>
            <button onClick={()=>setFmt('bo3')}
              style={{flex:1,padding:'10px',borderRadius:24,border:'none',cursor:'pointer',
                background:fmt==='bo3'?T.t4:'transparent',
                display:'flex',alignItems:'center',justifyContent:'center',
                transition:'background .2s'}}>
              <span style={{fontSize:18,fontWeight:800,color:T.t1,letterSpacing:2}}>•••</span>
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
              <div style={{color:T.t1,fontSize:14,fontWeight:700,marginBottom:6,letterSpacing:2}}>•••</div>
              <div style={{color:T.t3,fontSize:12,lineHeight:1.6,fontWeight:500,marginBottom:14}}>
                Klassisches Scoring:<br/>
                15 - 30 - 40 | Einstand - Vorteil<br/>
                2 Sätze zum Sieg
              </div>
              {/* Golden Point picker */}
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
                      style={{padding:'5px 11px',borderRadius:14,cursor:'pointer',
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
                    :gpAfter===0?'Beim 1. Einstand entscheidet der nächste Punkt'
                    :`Ab dem ${gpAfter+1}. Einstand entscheidet der nächste Punkt`}
                </div>
              </div>
            </div>
          )}

          {fmt==='americano'&&(
            <div>
              <div style={{color:T.t1,fontSize:15,fontWeight:700,marginBottom:4}}>Americano</div>
              <div style={{marginBottom:6}}><RacketMini size={18}/></div>
              <div style={{color:T.t3,fontSize:12,lineHeight:1.6,fontWeight:500,marginBottom:14}}>
                Punkte zählen pro Team. Optional mit Timer.
              </div>
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <div style={{display:'flex',background:T.card2,borderRadius:24,padding:3,
                  border:`1px solid ${T.border}`}}>
                  <button onClick={()=>setAmLim(21)}
                    style={{padding:'5px 14px',borderRadius:20,border:'none',cursor:'pointer',
                      background:amLim===21?T.t4:'transparent',
                      color:T.t1,fontSize:12,fontWeight:600,transition:'background .2s'}}>
                    Split 21
                  </button>
                  <button onClick={()=>setAmLim(0)}
                    style={{padding:'5px 14px',borderRadius:20,border:'none',cursor:'pointer',
                      background:amLim===0?T.t4:'transparent',
                      color:T.t1,fontSize:14,fontWeight:600,transition:'background .2s',
                      display:'flex',alignItems:'center'}}>
                    ∞
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
function Match({cfg,setCfg,bo3,dBo3,am,dAm,onHome,inputMode='smartphone',ringId='soft',matchKeyRef,theme='dark',voiceOn=false,voiceBaseUrl='',onMatchLogged}){
  const isB=cfg.format==='bo3';
  const[flA,setFA]=useState(false);const[flB,setFB]=useState(false);
  const[confReset,setConfReset]=useState(false);
  const[bigScreen,setBigScreen]=useState(false);
  // Zoom-Level im BigScreen: skaliert alle Anzeige-Größen (Score, Sätze,
  // Game-Count, Service-Indikator). Zyklus 1 → 1.5 → 2 → 0.5 → 1.
  // Reset beim Schließen von BigScreen.
  const ZOOM_CYCLE=[1,1.5,2,0.5];
  const[zoomLevel,setZoomLevel]=useState(1);
  useEffect(()=>{if(!bigScreen) setZoomLevel(1);},[bigScreen]);
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

  const undo=useCallback(()=>dsp({type:'UNDO'}),[dsp]);

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
      // Counter im Profil hochzählen (matchesPlayed + ggf. winsCount),
      // damit App-Matches in den Spielniveau-Estimate einfließen.
      onMatchLogged?.({userWon});
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
    // Horizontal-Padding der Score-Buttons: bei höherem Zoom etwas
    // schmaler, damit die großen Zahlen mehr Platz haben und nicht
    // seitlich an Geschwister-Spalten anstoßen.
    const sidePad=Math.max(10,Math.round(28/Math.max(1,m)));
    return(
      <div style={{height:'100dvh',width:'100vw',background:T.bg,
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
          <div style={{flex:1,display:'flex',alignItems:'center',gap:10,minWidth:0}}>
            <div style={{width:14,height:14,borderRadius:'50%',background:T.o,flexShrink:0,
              boxShadow:'0 0 8px var(--oGlow)'}}/>
            <div style={{color:T.t1,fontSize:20,fontWeight:800,letterSpacing:.3,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {cfg.nameA}
            </div>
          </div>
          {!isB&&hasStarted&&(
            <div style={{fontFamily:'monospace',fontSize:20,fontWeight:800,
              color:timerFinished?T.r:T.t1,letterSpacing:1,flexShrink:0}}>
              {fmtT(secsLeft)}
            </div>
          )}
          <div style={{flex:1,display:'flex',alignItems:'center',gap:10,minWidth:0,
            justifyContent:!isB&&hasStarted?'flex-end':'flex-start'}}>
            <div style={{width:14,height:14,borderRadius:'50%',background:T.blue,flexShrink:0,
              boxShadow:'0 0 8px var(--blueGlow)'}}/>
            <div style={{color:T.t1,fontSize:20,fontWeight:800,letterSpacing:.3,
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
                    fontSize:`clamp(${9*m}rem,${vh(36,60)}vh,${22*m}rem)`,
                    fontWeight:900,color:T.t1,lineHeight:.95,letterSpacing:-12,
                    whiteSpace:'nowrap'}}>
                    {big}
                  </div>
                )}
                {/* Games + Set traffic-light dots */}
                {isB&&(
                  <div style={{display:'flex',alignItems:'center',gap:`clamp(${1.5*m}rem,${vh(4,5)}vw,${3*m}rem)`,
                    marginTop:`clamp(${1.6*m}rem,${vh(4.5,6)}vh,${3*m}rem)`}}>
                    <div style={{color:T.o,fontSize:`clamp(${3.5*m}rem,${vh(12,18)}vh,${8*m}rem)`,
                      fontWeight:900,letterSpacing:-3,lineHeight:1}}>
                      {gamesCount}
                    </div>
                    <div style={{display:'flex',gap:`clamp(${.7*m}rem,${vh(1.5,2.2)}vw,${1.2*m}rem)`}}>
                      {[0,1,2].map(i=>(
                        <div key={i} style={{
                          width:`clamp(${1.4*m}rem,${vh(3.5,5)}vh,${2.5*m}rem)`,
                          height:`clamp(${1.4*m}rem,${vh(3.5,5)}vh,${2.5*m}rem)`,
                          borderRadius:'50%',
                          background:i<setsCount?T.o:'transparent',
                          border:`2.5px solid ${T.o}`,
                          boxSizing:'border-box',
                          boxShadow:i<setsCount?'0 0 14px var(--oGlow)':'none'
                        }}/>
                      ))}
                    </div>
                  </div>
                )}
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

        {/* Home bottom-left */}
        <div style={{position:'absolute',bottom:18,left:18}}>
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
        <div style={{position:'absolute',bottom:18,right:18,display:'flex',gap:10}}>
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
  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 9px 22px',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <RitmoWordmark size={52} style={{marginLeft:-3}}/>
          <div style={{color:T.t1,fontSize:40,marginTop:4,marginLeft:10,fontWeight:900}}>
            {isB?'Best of Three':'Americano'}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:T.t2,fontSize:18,fontWeight:800,letterSpacing:2}}>•••</span>
          <CourtIcon size={32}/>
        </div>
      </div>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>

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
              style={{background:T.card,border:`1px solid ${isW?T.o:T.border}`,borderRadius:14,
                padding:'18px 22px',display:'flex',alignItems:'center',
                cursor:win?'default':'pointer',color:T.t1,textAlign:'left',
                transition:'border-color .25s',minHeight:120}}>

              <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:9,minWidth:0}}>
                  <div style={{width:12,height:12,borderRadius:'50%',
                    background:isA?T.o:T.blue,flexShrink:0,
                    boxShadow:`0 0 8px ${isA?T.oGlow:T.blueGlow}`}}/>
                  <div style={{color:T.t1,fontSize:24,fontWeight:800,letterSpacing:-.3,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nm}</div>
                </div>
                {isB&&(
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{color:T.o,fontSize:32,fontWeight:900,
                      letterSpacing:-1,lineHeight:1}}>
                      {gamesCount}
                    </div>
                    <div style={{display:'flex',gap:5}}>
                      {[0,1,2].map(i=>(
                        <div key={i} style={{
                          width:10,height:10,borderRadius:'50%',
                          background:i<setsCount?T.o:'transparent',
                          border:`1.5px solid ${T.o}`,boxSizing:'border-box'
                        }}/>
                      ))}
                    </div>
                  </div>
                )}
                {!isB&&(
                  <div style={{color:T.o,fontSize:14,fontWeight:600}}>
                    {(cfg.amLimit??21)>0?`${big} / ${cfg.amLimit??21}`:'∞'}
                  </div>
                )}
              </div>

              {isSpecial ? (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',
                  flexShrink:0,gap:6,maxWidth:'55%'}}>
                  <div style={{
                    width:48,height:48,borderRadius:'50%',
                    background:isAdv?T.o:T.t1,
                    boxShadow:isAdv
                      ?'0 0 14px var(--oGlow), inset 0 -4px 10px rgba(0,0,0,.18)'
                      :'0 0 10px rgba(255,255,255,.18), inset 0 -4px 10px rgba(0,0,0,.10)'
                  }}/>
                  <div style={{color:T.t1,fontSize:18,fontWeight:800,letterSpacing:-.3,
                    whiteSpace:'nowrap',lineHeight:1}}>
                    {big}
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize:96,fontWeight:900,color:T.t1,
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
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
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

        {/* Timer (Americano only) */}
        {!isB&&(
          <TimerCard
            minutes={timerMin} setMinutes={setTimerMin}
            running={running} secsLeft={secsLeft} finished={timerFinished}
            hasStarted={hasStarted} theme={theme}
            onStart={startTimer} onPause={pauseTimer} onReset={resetTimer}/>
        )}

        {win&&win!=='draw'&&(
          <div style={{textAlign:'center',padding:14,background:T.oSoft,borderRadius:12,
            border:`1px solid ${T.o}`,color:T.o,fontWeight:700}}>
            🏆 {win==='A'?cfg.nameA:cfg.nameB} gewinnt!
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
      <HintToast/>
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
        style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,
          padding:'22px 22px 20px',width:'100%',maxWidth:340}}>
        <div style={{color:T.t1,fontSize:18,fontWeight:800,marginBottom:6}}>{title}</div>
        <div style={{color:T.t2,fontSize:13,lineHeight:1.5,marginBottom:16}}>
          {description}
        </div>
        <div style={{background:T.card2,borderRadius:10,padding:'12px 14px',marginBottom:16,
          border:`1px solid ${T.border}`}}>
          <div style={{color:T.t1,fontSize:14,fontWeight:600}}>{question}</div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onCancel}
            style={{flex:1,padding:'12px',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:10,color:T.t1,fontSize:14,fontWeight:600,cursor:'pointer'}}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            style={{flex:1,padding:'12px',background:'rgba(232,69,69,0.18)',
              border:`1px solid ${T.r}`,borderRadius:10,color:T.r,
              fontSize:14,fontWeight:700,cursor:'pointer'}}>
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

  return(
    <div style={{position:'relative',height:HEIGHT,width,flexShrink:0}}>
      {/* Selection band */}
      <div style={{position:'absolute',top:PAD,left:0,right:0,height:ITEM_H,
        background:'var(--oSoft)',borderTop:`1px solid ${T.border}`,
        borderBottom:`1px solid ${T.border}`,pointerEvents:'none',borderRadius:8}}/>
      {/* Top fade */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:PAD,
        background:`linear-gradient(${bgColor},${bgColor}00)`,
        pointerEvents:'none',zIndex:2}}/>
      {/* Bottom fade */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:PAD,
        background:`linear-gradient(${bgColor}00,${bgColor})`,
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
              color:active?T.t1:T.t3,
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

function WimbledonTimerCard({minutes,setMinutes,running,secsLeft,finished,onStart,onPause,onReset,hasStarted}){
  const opts=Array.from({length:60},(_,i)=>i+1);

  return(
    <div style={{
      background:T.bg,
      border:`1px solid ${T.o}`,
      borderRadius:14,
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
            ▶
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
            {running?'⏸':'▶'}
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
          <div style={{color:T.r,fontSize:14,fontWeight:700,letterSpacing:.5}}>
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
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
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
          border:`1px solid ${T.o}`,borderRadius:14,
          overflow:'hidden'}}>
          {/* Progress fill — shrinks as time runs out (tournament pattern) */}
          <div style={{position:'absolute',left:0,top:0,bottom:0,
            width:`${progress*100}%`,
            background:'var(--oSoft)',
            transition:'width 1s linear'}}/>
          <div style={{position:'relative',zIndex:1,
            display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:34,fontWeight:800,color:T.o,
              fontFamily:'monospace',letterSpacing:1.5}}>
              {fmtTime(secsLeft)}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={running?onPause:onStart}
                style={{width:42,height:42,borderRadius:'50%',
                  background:T.o,border:'none',color:T.bg,
                  fontSize:14,fontWeight:800,cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                {running?'⏸':'▶'}
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
    <div style={{position:'relative',overflow:'hidden',borderRadius:18}}>
      {/* Delete background */}
      <div onClick={handleDeleteClick}
        style={{position:'absolute',top:0,right:0,bottom:0,width:80,
          background:T.r,display:'flex',alignItems:'center',justifyContent:'center',
          cursor:'pointer',color:T.t1,fontSize:13,fontWeight:700}}>
        Löschen
      </div>
      {/* Card content */}
      <div onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
        onMouseDown={onStart} onMouseMove={swiping?onMove:undefined} onMouseUp={onEnd} onMouseLeave={swiping?onEnd:undefined}
        onClickCapture={handleCardClick}
        style={{transform:`translateX(${tx}px)`,
          transition:swiping?'none':'transform .25s cubic-bezier(.3,0,.2,1)',
          willChange:'transform',background:T.bg,position:'relative'}}>
        {children}
      </div>
    </div>
  );
}


function TournamentSetup({nav,onHome,onStart,onSave,saved,isEdit,profile,onCreateOnline}){
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
  const[creatingOnline,setCreatingOnline]=useState(false);
  const[onlineError,setOnlineError]=useState('');
  const nextId=useRef(players.reduce((m,p)=>Math.max(m,p.id),0)+1);

  // Im Online-Modus joinen Spieler erst nach Erstellung — daher hier
  // keine Cap durch lokale Spielerzahl. Trotzdem ein sinnvolles UI-
  // Maximum (20 Courts), damit der +/-/Picker nicht ins Endlose läuft.
  // Lokal: weiterhin floor(players/4) als Obergrenze.
  const maxCourts=mode==='online'?20:Math.max(1,Math.floor(players.length/4));
  // Auto-clamp courts when players reduced (gilt nur im Lokal-Modus)
  useEffect(()=>{if(numCourts>maxCourts)setNumCourts(maxCourts);},[maxCourts,numCourts]);

  const addPlayer=()=>{
    if(players.length>=12)return;
    const id=nextId.current++;
    setPlayers(p=>[...p,{id,name:`Spieler ${p.length+1}`,color:PCOLS[id%PCOLS.length]}]);
  };
  const removePlayer=id=>setPlayers(p=>p.filter(x=>x.id!==id));
  const renamePlayer=(id,name)=>setPlayers(p=>p.map(x=>x.id===id?{...x,name}:x));

  const canStart=players.length>=4;

  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 9px 22px',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <RitmoWordmark size={52} style={{marginLeft:-3}}/>
          <div style={{color:T.t2,fontSize:30,marginTop:6,marginLeft:10,fontWeight:800}}>
            {isEdit?'Turnier bearbeiten':'Turnier'}
          </div>
        </div>
        <TrophyIcon size={36}/>
      </div>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>

        <SetupHero
          icon={<TrophyIcon size={40}/>}
          title="Turnier erstellen"
          desc="Mehrere Runden, rotierende Partner oder Mexicano-Pairings. Bis zu 12+ Spieler — lokal oder online via QR-Code."/>

        {/* Modus: Lokal vs Online */}
        {!isEdit&&(
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:'18px'}}>
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

        {/* Format */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:'18px'}}>
          <div style={{color:T.o,fontSize:18,fontWeight:800,marginBottom:12}}>Format</div>
          <div style={{display:'flex',background:T.card2,borderRadius:30,padding:4,gap:4,
            border:`1px solid ${T.border}`}}>
            {[{v:'americano',l:'Americano'},{v:'mexicano',l:'Mexicano'}].map(o=>(
              <button key={o.v} onClick={()=>setFormat(o.v)}
                style={{flex:1,padding:'10px',borderRadius:24,border:'none',cursor:'pointer',
                  background:format===o.v?T.t4:'transparent',color:T.t1,fontSize:13,fontWeight:600,
                  transition:'background .2s'}}>
                {o.l}
              </button>
            ))}
          </div>
          <div style={{color:T.t3,fontSize:12,lineHeight:1.6,marginTop:10,fontWeight:500}}>
            {format==='americano'?'Zufällige Partner jede Runde, Punkte zählen individuell.':'Ranking-basierte Paarungen ab Runde 2 (1+4 vs 2+3).'}
          </div>
        </div>

        {/* Sieger-Modus */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:'18px'}}>
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

        {/* Anzahl Courts */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
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

        {/* Rundendauer */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
          padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{color:T.t1,fontSize:15,fontWeight:600}}>Rundendauer</div>
            <div style={{color:T.t3,fontSize:11,fontWeight:500,marginTop:1}}>
              Timer pro Runde
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <button onClick={()=>setRoundDur(d=>Math.max(1,d-1))}
              style={{width:32,height:32,borderRadius:'50%',background:T.card2,border:`1px solid ${T.border}`,
                color:T.t1,fontSize:16,cursor:'pointer'}}>−</button>
            <span style={{color:T.t1,fontWeight:800,fontSize:18,minWidth:60,textAlign:'center'}}>
              {roundDur} min
            </span>
            <button onClick={()=>setRoundDur(d=>Math.min(60,d+1))}
              style={{width:32,height:32,borderRadius:'50%',background:T.card2,border:`1px solid ${T.border}`,
                color:T.t1,fontSize:16,cursor:'pointer'}}>+</button>
          </div>
        </div>

        {/* Spieler — nur im Lokal-Modus editierbar.
            Im Online-Modus erscheint stattdessen eine Info-Karte,
            da Spieler nach Erstellung über PIN/QR joinen. */}
        {mode==='lokal'?(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
          padding:'18px 18px 8px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div style={{color:T.o,fontSize:18,fontWeight:800}}>Spieler</div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{color:T.t3,fontSize:12,fontWeight:600}}>{players.length}/12</span>
              {players.length<12&&(
                <button onClick={addPlayer}
                  style={{width:30,height:30,borderRadius:'50%',
                    background:T.o,border:'none',color:T.bg,
                    fontSize:18,fontWeight:800,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    lineHeight:1,paddingBottom:2,transition:'opacity .15s'}}
                  onPointerDown={e=>e.currentTarget.style.opacity='.7'}
                  onPointerUp={e=>e.currentTarget.style.opacity='1'}
                  onPointerLeave={e=>e.currentTarget.style.opacity='1'}>+</button>
              )}
            </div>
          </div>
          {players.map((p,i)=>(
            <div key={p.id} style={{display:'flex',alignItems:'center',padding:'10px 0',
              borderBottom:i<players.length-1?`1px solid ${T.sep}`:'none',gap:10}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:p.color,flexShrink:0}}/>
              <input value={p.name} onChange={e=>renamePlayer(p.id,e.target.value)}
                style={{flex:1,fontSize:14,color:T.t1,fontWeight:500}}/>
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
              Mindestens 4 Spieler nötig
            </div>
          )}
          {canStart&&(players.length-numCourts*4)>0&&(
            <div style={{color:T.t3,fontSize:11,marginTop:10,paddingBottom:6,fontWeight:500}}>
              {players.length-numCourts*4} Spieler {(players.length-numCourts*4)===1?'rotiert':'rotieren'} pro Runde durch den Pausen-Pool
            </div>
          )}
        </div>
        ):(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
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

      <MatchBar onHome={onHome} rightButtons={[{
        icon:creatingOnline?'…':(isEdit?'✓':'Start'),
        disabled:creatingOnline||(mode==='lokal'&&!canStart),
        onClick:async()=>{
          if(creatingOnline) return;
          if(isEdit){
            onSave({players,format,winMode,numCourts,roundDurationMin:roundDur});
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
          const lb=calcLeaderboard(players,[],winMode);
          const r0=format==='mexicano'
            ?genMexicanoRound(players.map(p=>p.id),lb,numCourts)
            :genAmericanoRound(players.map(p=>p.id),[],numCourts);
          onStart({
            players,format,winMode,
            numCourts,
            roundDurationMin:roundDur,
            rounds:[r0],
            current:0,
            finished:false,
            timerSecsLeft:roundDur*60,
            timerRunning:false,
            timerFinished:false,
          });
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

  const canStart=approved.length>=4;
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
      const r0=session.format==='mexicano'
        ?genMexicanoRound(tPlayers.map(p=>p.id),lb,session.numCourts)
        :genAmericanoRound(tPlayers.map(p=>p.id),[],session.numCourts);
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
      <div style={{height:'100dvh',background:T.bg,display:'flex',
        alignItems:'center',justifyContent:'center'}}>
        <BallSpinner/>
      </div>
    );
  }

  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 9px 22px',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <RitmoWordmark size={52} style={{marginLeft:-3}}/>
          <div style={{color:T.t2,fontSize:30,marginTop:6,marginLeft:10,fontWeight:800}}>
            Online-Lobby
          </div>
        </div>
        <TrophyIcon size={36}/>
      </div>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>

        {/* PIN + QR */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
          padding:'18px',textAlign:'center'}}>
          <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.3,
            textTransform:'uppercase',marginBottom:6}}>Beitritts-PIN</div>
          <div style={{color:T.o,fontSize:34,fontWeight:900,letterSpacing:6,
            fontFamily:'monospace',marginBottom:14}}>
            {pin.toUpperCase()}
          </div>
          <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
            <div style={{width:220,height:220,background:'#fff',padding:8,borderRadius:10}}>
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
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
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
                <div style={{color:T.t1,fontSize:14,fontWeight:600,
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
      <div className="fi" style={{background:T.card,border:`1px solid ${T.o}`,borderRadius:18,
        padding:'24px 22px',textAlign:'center'}}>
        <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.5,
          textTransform:'uppercase',marginBottom:6}}>Turnier beendet</div>
        <div style={{fontSize:42,marginBottom:8}}>🥇</div>
        <div style={{fontSize:24,fontWeight:800,color:T.t1,letterSpacing:-.3}}>
          {winner?.name||'?'}
        </div>
        <div style={{fontSize:14,color:T.o,fontWeight:700,marginTop:4}}>
          {ts.winMode==='wins'?`${winner?.totalWins??0} Siege`:`${winner?.totalPts??0} Punkte`}
        </div>
        {myRow&&myRank&&winner&&myRow.id!==winner.id&&(
          <div style={{marginTop:14,padding:'8px 12px',background:T.card2,
            borderRadius:10,color:T.t2,fontSize:12,fontWeight:600,display:'inline-block'}}>
            Du bist auf Platz <span style={{color:T.o,fontWeight:800}}>#{myRank}</span> gelandet.
          </div>
        )}
      </div>

      {/* Full Leaderboard */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
        overflow:'hidden'}}>
        {sortedLb.map((p,i)=>{
          const isMe=myRow&&p.id===myRow.id;
          return(
            <div key={p.id} style={{display:'flex',alignItems:'center',padding:'12px 16px',
              gap:10,borderBottom:i<sortedLb.length-1?`1px solid ${T.sep}`:'none',
              background:isMe?T.oSoft:'transparent'}}>
              <div style={{width:24,fontSize:i<3?16:13,fontWeight:800,
                color:i===0?T.o:i===1?T.t2:i===2?T.t3:T.t3,textAlign:'center'}}>
                {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`}
              </div>
              <div style={{width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:T.t1,fontSize:14,fontWeight:isMe||i===0?700:600,
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
        borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.3,
            textTransform:'uppercase',marginBottom:2}}>Bereit?</div>
          <div style={{color:T.t1,fontSize:13,fontWeight:600}}>
            Host wartet auf deine Bereitschaft für Runde {roundIndex+1}.
          </div>
        </div>
        <button onClick={doConfirmReady}
          style={{padding:'10px 18px',background:T.o,color:'#000',border:'none',
            borderRadius:10,fontSize:13,fontWeight:800,cursor:'pointer',
            boxShadow:'0 4px 14px var(--oGlow)'}}>
          Bereit ✓
        </button>
      </div>
    )}
    {rcActive&&iConfirmed&&(
      <div style={{background:T.card,border:`1px solid ${T.g}`,borderRadius:14,
        padding:'10px 14px',color:T.g,fontSize:12,fontWeight:700,textAlign:'center'}}>
        ✓ Du bist bereit — warte auf andere Spieler
      </div>
    )}

    {/* Round-Header */}
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
      padding:'16px 18px'}}>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}>
        <div>
          <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.3,
            textTransform:'uppercase',marginBottom:2}}>
            {ts.format==='mexicano'?'Mexicano':'Americano'}
          </div>
          <div style={{color:T.t1,fontSize:20,fontWeight:800,letterSpacing:-.3}}>
            Runde {roundIndex+1}{ts.rounds?.length>1?` / ${ts.rounds.length}`:''}
          </div>
        </div>
        {typeof ts.timerSecsLeft==='number'&&(
          <div style={{color:ts.timerFinished?T.r:T.o,fontSize:20,fontWeight:800,
            fontFamily:'monospace',letterSpacing:1}}>
            {Math.floor(ts.timerSecsLeft/60)}:{String(ts.timerSecsLeft%60).padStart(2,'0')}
          </div>
        )}
      </div>
    </div>

    {/* Eigener Court — Score Submission */}
    {myCourt&&(
      <div style={{background:T.card,border:`1px solid ${myTeam?T.o:T.border}`,
        borderRadius:14,padding:'18px'}}>
        <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.3,
          textTransform:'uppercase',marginBottom:10}}>Dein Court</div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:myTeam==='A'?T.o:T.t1,fontSize:14,fontWeight:myTeam==='A'?800:600,
              textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}>
              {teamLabel(myCourt.t1)}
            </div>
          </div>
          <div style={{color:T.t3,fontSize:12,fontWeight:700,padding:'0 6px'}}>vs</div>
          <div style={{flex:1,minWidth:0,textAlign:'right'}}>
            <div style={{color:myTeam==='B'?T.o:T.t1,fontSize:14,fontWeight:myTeam==='B'?800:600,
              textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}>
              {teamLabel(myCourt.t2)}
            </div>
          </div>
        </div>
        {courtDone?(
          <div style={{background:`${T.g}15`,border:`1px solid ${T.g}`,borderRadius:10,
            padding:'12px',textAlign:'center'}}>
            <div style={{color:T.g,fontSize:11,fontWeight:800,letterSpacing:1,
              textTransform:'uppercase',marginBottom:4}}>Vom Host bestätigt</div>
            <div style={{color:T.t1,fontSize:24,fontWeight:900,fontFamily:'monospace'}}>
              {myCourt.s1??0} : {myCourt.s2??0}
            </div>
          </div>
        ):mySubmission?(
          <div style={{background:T.card2,border:`1px dashed ${T.o}`,borderRadius:10,
            padding:'12px',textAlign:'center'}}>
            <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:1,
              textTransform:'uppercase',marginBottom:4}}>Wartet auf Host</div>
            <div style={{color:T.t1,fontSize:22,fontWeight:900,fontFamily:'monospace',marginBottom:8}}>
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
              {mySubmission?'Neuer Vorschlag':'Ergebnis eingeben'}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
              <input type="number" inputMode="numeric" min="0"
                value={sA} onChange={e=>{setSA(e.target.value);setErr('');}}
                placeholder="0"
                style={{flex:1,minWidth:0,width:0,padding:'12px',
                  background:T.card2,boxSizing:'border-box',
                  border:`1px solid ${T.border}`,borderRadius:10,
                  color:T.t1,fontSize:20,fontWeight:800,fontFamily:'monospace',
                  textAlign:'center',outline:'none'}}/>
              <span style={{color:T.t3,fontSize:18,fontWeight:700,flexShrink:0}}>:</span>
              <input type="number" inputMode="numeric" min="0"
                value={sB} onChange={e=>{setSB(e.target.value);setErr('');}}
                placeholder="0"
                style={{flex:1,minWidth:0,width:0,padding:'12px',
                  background:T.card2,boxSizing:'border-box',
                  border:`1px solid ${T.border}`,borderRadius:10,
                  color:T.t1,fontSize:20,fontWeight:800,fontFamily:'monospace',
                  textAlign:'center',outline:'none'}}/>
            </div>
            {err&&<div style={{color:'#FF6B6B',fontSize:11,fontWeight:600,marginTop:6}}>{err}</div>}
            <button onClick={submit} disabled={busy}
              style={{width:'100%',marginTop:10,padding:'12px',background:T.o,
                border:'none',borderRadius:10,color:'#000',fontSize:14,fontWeight:800,
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
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
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
              fontFamily:'monospace',flexShrink:0}}>
              {c.done?`${c.s1??0} : ${c.s2??0}`:'–'}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Pausen-Spieler */}
    {round?.sitOut?.length>0&&(
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
        padding:'14px 18px'}}>
        <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1.3,
          textTransform:'uppercase',marginBottom:6}}>Pausiert diese Runde</div>
        <div style={{color:T.t2,fontSize:13,fontWeight:500}}>
          {round.sitOut.map(pid=>playerById(pid)?.name||'?').join(' · ')}
        </div>
      </div>
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
        <div style={{fontSize:14,fontWeight:700,letterSpacing:.3}}>QR-Code scannen</div>
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
              borderRadius:14,padding:'20px',maxWidth:320,textAlign:'center'}}>
              <div style={{color:T.r,fontSize:14,fontWeight:800,marginBottom:8}}>
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
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 9px 22px'}}>
        <RitmoWordmark size={52} style={{marginLeft:-3}}/>
        <div style={{color:T.t2,fontSize:30,marginTop:8,marginLeft:10,fontWeight:800}}>
          Turnier beitreten
        </div>
      </div>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>
        {status==='input'||status==='joining'?(<>
          <SetupHero
            icon={<JoinIcon size={36}/>}
            title="Beitreten"
            desc="Scan den QR-Code des Hosts oder tippe den PIN ein, um in ein laufendes Online-Turnier einzusteigen."/>
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
            padding:'18px'}}>
            {/* QR-Code Scanner Button */}
            <button onClick={()=>setScannerOpen(true)}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                background:T.oSoft,border:`1px solid ${T.o}`,borderRadius:10,
                padding:'12px 14px',color:T.o,fontSize:14,fontWeight:700,
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
                borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:18,
                fontFamily:'monospace',letterSpacing:4,
                outline:'none',boxSizing:'border-box',textAlign:'center'}}/>
            <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
              textTransform:'uppercase',marginTop:14,marginBottom:6}}>Dein Name</div>
            <input value={name}
              onChange={e=>{setName(e.target.value);setErr('');}}
              placeholder="Wie du im Tournament heißt"
              autoCapitalize="words" autoCorrect="off" spellCheck={false}
              style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:500,
                outline:'none',boxSizing:'border-box'}}/>
            {err&&(
              <div style={{color:'#FF6B6B',fontSize:12,fontWeight:600,marginTop:10}}>
                {err}
              </div>
            )}
          </div>
        </>):null}

        {status==='waiting'&&(
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
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
          <div style={{background:T.card,border:`1px solid ${T.g}`,borderRadius:14,
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
          <div style={{background:T.card,border:`1px solid ${T.r}`,borderRadius:14,
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
                borderRadius:10,color:T.o,fontSize:12,fontWeight:700,cursor:'pointer'}}>
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
        <div style={{color:T.t2,fontSize:12,marginBottom:8,lineHeight:1.45}}>
          {teamLabel(court.t1)} <span style={{color:T.t3}}>vs</span> {teamLabel(court.t2)}
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
        <input type="number" inputMode="numeric" min="0" value={a}
          onChange={e=>setA(parseInt(e.target.value)||0)}
          style={{flex:1,minWidth:0,width:0,padding:'8px',
            background:T.card2,boxSizing:'border-box',
            border:`1px solid ${T.border}`,
            borderRadius:8,color:T.t1,fontSize:18,fontWeight:800,fontFamily:'monospace',
            textAlign:'center',outline:'none'}}/>
        <span style={{color:T.t3,fontSize:16,fontWeight:700,flexShrink:0}}>:</span>
        <input type="number" inputMode="numeric" min="0" value={b}
          onChange={e=>setB(parseInt(e.target.value)||0)}
          style={{flex:1,minWidth:0,width:0,padding:'8px',
            background:T.card2,boxSizing:'border-box',
            border:`1px solid ${T.border}`,
            borderRadius:8,color:T.t1,fontSize:18,fontWeight:800,fontFamily:'monospace',
            textAlign:'center',outline:'none'}}/>
        <button onClick={()=>handle(()=>onApprove(sub,a,b))} disabled={busy}
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
      <div style={{background:T.card,border:`1px dashed ${T.border}`,borderRadius:14,
        padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
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
    <div style={{background:T.card,border:`1.5px solid ${allReady?T.g:T.o}`,borderRadius:14,
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
              padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,
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
   TOURNAMENT PLAY
═══════════════════════════════════════════════════════════════ */
function TournamentPlay({tourney,setTourney,onHome,nav,ringId='soft',onEdit,onMatchLogged}){
  const[tab,setTab]=useState('round');
  const[confirmEnd,setConfirmEnd]=useState(false);
  const[showSitOutInfo,setShowSitOutInfo]=useState(false);
  const round=tourney.rounds[tourney.current];
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
        // Profile-Counter aktualisieren — nur wenn der User
        // identifizierbar ist (sonst kein userWon).
        if(userTeam) onMatchLogged?.({userWon});
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

  // ═══ TIMER LOGIC ═══
  useEffect(()=>{
    if(!tourney.timerRunning||tourney.finished)return;
    const id=setInterval(()=>{
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
    setTourney(t=>{
      const lb=calcLeaderboard(t.players,t.rounds,t.winMode);
      const sortedLb=lb.sort((a,b)=>t.winMode==='points'?b.totalPts-a.totalPts:b.totalWins-a.totalWins);
      const newR=t.format==='mexicano'
        ?genMexicanoRound(t.players.map(p=>p.id),sortedLb,t.numCourts,t.rounds)
        :genAmericanoRound(t.players.map(p=>p.id),t.rounds,t.numCourts);
      return {...t,
        rounds:[...t.rounds,newR],
        current:t.current+1,
        timerSecsLeft:t.roundDurationMin*60,
        timerRunning:false,
        timerFinished:false,
      };
    });
  };

  const endTournament=()=>{
    setTourney(t=>({...t,finished:true,timerRunning:false}));
    nav('tournament-leaderboard');
  };

  const allDone=round.courts.every(c=>c.done);
  const lb=calcLeaderboard(tourney.players,tourney.rounds,tourney.winMode);
  const sortedLb=lb.sort((a,b)=>tourney.winMode==='points'?b.totalPts-a.totalPts||b.totalWins-a.totalWins:b.totalWins-a.totalWins||b.totalPts-a.totalPts);

  const totalSecs=(tourney.roundDurationMin||10)*60;
  const progress=totalSecs?(tourney.timerSecsLeft||0)/totalSecs:0;

  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 22px 14px',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <RitmoWordmark size={52} style={{marginLeft:-3}}/>
          <div style={{color:T.t2,fontSize:30,marginTop:6,marginLeft:10,fontWeight:800}}>
            {tourney.format==='mexicano'?'Mexicano':'Americano'} · Runde {tourney.current+1}
          </div>
        </div>
        <TrophyIcon size={36}/>
      </div>

      {/* Timer + Leaderboard Toggle */}
      <div style={{display:'flex',gap:10,padding:'0 22px 14px'}}>
        {/* Timer Card */}
        <div style={{flex:'1 1 60%',
          background:T.bg,
          border:`2px solid ${tourney.timerFinished?T.r:T.o}`,
          borderRadius:14,padding:'10px 14px',
          display:'flex',alignItems:'center',gap:10,
          position:'relative',overflow:'hidden'}}>
          {/* Progress fill */}
          <div style={{position:'absolute',left:0,top:0,bottom:0,
            width:`${progress*100}%`,
            background:tourney.timerFinished?'rgba(232,69,69,0.12)':'var(--oSoft)',
            transition:'width 1s linear'}}/>
          <div style={{flex:1,fontSize:30,fontWeight:800,
            color:tourney.timerFinished?T.r:T.o,
            fontFamily:'monospace',letterSpacing:1.5,
            position:'relative',zIndex:1}}>
            {fmtT(tourney.timerSecsLeft||0)}
          </div>
          <button onClick={toggleTimer}
            style={{width:40,height:40,borderRadius:'50%',
              background:tourney.timerFinished?T.r:T.o,border:'none',
              color:T.bg,fontSize:14,fontWeight:800,
              cursor:'pointer',position:'relative',zIndex:1,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
            {tourney.timerFinished?'↺':tourney.timerRunning?'⏸':'▶'}
          </button>
        </div>

        {/* Leaderboard Toggle */}
        <button onClick={()=>setTab(tab==='board'?'round':'board')}
          style={{flex:'1 1 40%',
            background:tab==='board'?T.oSoft:T.card,
            border:`1px solid ${tab==='board'?T.o:T.border}`,
            borderRadius:14,padding:'10px 14px',
            color:tab==='board'?T.o:T.t1,fontSize:14,fontWeight:600,
            cursor:'pointer',transition:'all .2s'}}>
          {tab==='board'?'Courts':'Leaderboard'}
        </button>
      </div>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:12,overflowY:'auto'}}>

        {tab==='round'&&(<>
          {/* Online: Pending Score-Submissions (Host approved/rejected) */}
          {isOnline&&pendingSubs.filter(s=>s.roundIndex===tourney.current).length>0&&(
            <div style={{background:T.card,border:`1.5px solid ${T.o}`,borderRadius:14,
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
            <div key={court.id} style={{background:T.card,border:`1px solid ${court.done?T.o:T.border}`,
              borderRadius:14,padding:'14px 16px',transition:'border-color .2s'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{color:T.t3,fontSize:11,fontWeight:700,letterSpacing:1}}>COURT {ci+1}</div>
                {court.done&&<div style={{color:T.o,fontSize:11,fontWeight:700}}>✓ FERTIG</div>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                {/* Team 1 */}
                <div style={{flex:1,minWidth:0}}>
                  {court.t1.map(pid=>{const p=playerById(pid);return(
                    <div key={pid} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:p?.color,flexShrink:0}}/>
                      <span style={{fontSize:13,color:T.t1,fontWeight:600,
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p?.name}</span>
                    </div>
                  );})}
                </div>
                {/* Scores */}
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <input type="number" min="0" max="99" value={court.s1??0}
                    onChange={e=>updateScore(court.id,'s1',Math.max(0,parseInt(e.target.value)||0))}
                    disabled={court.done}
                    style={{width:48,height:48,borderRadius:10,
                      border:`1.5px solid ${court.done?T.border:T.o}`,
                      background:T.card2,color:T.t1,fontSize:22,fontWeight:800,
                      textAlign:'center',opacity:court.done?.55:1}}/>
                  <span style={{color:T.t3,fontSize:18,fontWeight:700}}>:</span>
                  <input type="number" min="0" max="99" value={court.s2??0}
                    onChange={e=>updateScore(court.id,'s2',Math.max(0,parseInt(e.target.value)||0))}
                    disabled={court.done}
                    style={{width:48,height:48,borderRadius:10,
                      border:`1.5px solid ${court.done?T.border:T.o}`,
                      background:T.card2,color:T.t1,fontSize:22,fontWeight:800,
                      textAlign:'center',opacity:court.done?.55:1}}/>
                </div>
                {/* Team 2 */}
                <div style={{flex:1,minWidth:0,textAlign:'right'}}>
                  {court.t2.map(pid=>{const p=playerById(pid);return(
                    <div key={pid} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,justifyContent:'flex-end'}}>
                      <span style={{fontSize:13,color:T.t1,fontWeight:600,
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p?.name}</span>
                      <div style={{width:7,height:7,borderRadius:'50%',background:p?.color,flexShrink:0}}/>
                    </div>
                  );})}
                </div>
              </div>
              <button onClick={()=>confirmCourt(court.id)}
                style={{width:'100%',marginTop:12,padding:'9px',borderRadius:10,border:'none',
                  background:court.done?T.card2:T.oSoft,
                  color:court.done?T.t2:T.o,fontSize:12,fontWeight:700,cursor:'pointer',
                  border:`1px solid ${court.done?T.border:T.o}`}}>
                {court.done?'✓ Bearbeiten':'Bestätigen'}
              </button>
            </div>
          ))}

          {round.sitOut?.length>0&&(
            <div style={{background:T.card2,borderRadius:10,
              border:`1px solid ${T.border}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px'}}>
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
                      ?'Pausierte Spieler bekommen den Median aller Punkte einer Runde gutgeschrieben — keine Benachteiligung durch erzwungene Pause.'
                      :'Pausierte Spieler in der unteren Tabellenhälfte bekommen +1 Sieg pro Pause gutgeschrieben — damit niemand durch erzwungene Pause weiter zurückfällt.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next round (when allDone) */}
          {allDone&&(
            <button onClick={nextRound}
              style={{padding:'14px',borderRadius:14,border:'none',
                background:T.o,color:T.bg,fontSize:15,fontWeight:800,cursor:'pointer',
                marginTop:6}}>
              Nächste Runde →
            </button>
          )}
        </>)}

        {tab==='board'&&(
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
            overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:'100%'}}>
            <div style={{overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
              {sortedLb.map((p,i)=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',padding:'12px 16px',
                  gap:10,borderBottom:i<sortedLb.length-1?`1px solid ${T.sep}`:'none',
                  background:i===0?'var(--oSoft)':'transparent'}}>
                  <div style={{width:24,fontSize:i<3?18:13,fontWeight:800,
                    color:i===0?T.o:i===1?T.t2:i===2?T.t3:T.t3,textAlign:'center'}}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`}
                  </div>
                  <div style={{width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:T.t1,fontSize:14,fontWeight:i===0?700:600,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <div style={{color:T.t3,fontSize:11,marginTop:1}}>
                      {p.played} Spiele · {p.wins}S {p.losses}N
                      {p.sitOut>0&&<> · {p.sitOut} Pause{p.sitOut>1?'n':''}</>}
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{color:T.o,fontSize:18,fontWeight:800}}>
                      {tourney.winMode==='wins'?p.totalWins:p.totalPts}
                    </div>
                    <div style={{color:T.t3,fontSize:10,fontWeight:600}}>
                      {tourney.winMode==='wins'
                        ?(p.bonusWins>0?`Siege (+${p.bonusWins})`:'Siege')
                        :(p.bonusPts>0?`Punkte (+${p.bonusPts})`:'Punkte')}
                    </div>
                  </div>
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
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 9px 22px',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <RitmoWordmark size={52} style={{marginLeft:-3}}/>
          <div style={{color:T.t2,fontSize:30,marginTop:6,marginLeft:10,fontWeight:800}}>Endstand</div>
        </div>
        <TrophyIcon size={36}/>
      </div>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>

        {/* Winner Hero */}
        <div style={{background:T.card,border:`1px solid ${T.o}`,borderRadius:18,
          padding:'24px 22px',textAlign:'center'}}>
          <div style={{fontSize:42,marginBottom:8}}>🥇</div>
          <div style={{fontSize:24,fontWeight:800,color:T.t1,letterSpacing:-.3}}>{winner?.name}</div>
          <div style={{fontSize:14,color:T.o,fontWeight:700,marginTop:4}}>
            {tourney.winMode==='wins'?`${winner?.totalWins} Siege`:`${winner?.totalPts} Punkte`}
          </div>
        </div>

        {/* Full Leaderboard */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
          overflow:'hidden',flex:1,minHeight:120,display:'flex',flexDirection:'column'}}>
          <div style={{overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
            {sortedLb.map((p,i)=>(
              <div key={p.id} style={{display:'flex',alignItems:'center',padding:'12px 16px',
                gap:10,borderBottom:i<sortedLb.length-1?`1px solid ${T.sep}`:'none'}}>
                <div style={{width:24,fontSize:i<3?16:13,fontWeight:800,
                  color:i===0?T.o:i===1?T.t2:i===2?T.t3:T.t3,textAlign:'center'}}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`}
                </div>
                <div style={{width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{color:T.t1,fontSize:14,fontWeight:i===0?700:600}}>{p.name}</div>
                  <div style={{color:T.t3,fontSize:11}}>
                    {p.played} Spiele · {p.wins}S {p.losses}N
                    {p.sitOut>0&&<> · {p.sitOut} Pause{p.sitOut>1?'n':''}</>}
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:T.o,fontSize:16,fontWeight:800}}>
                    {tourney.winMode==='wins'?p.totalWins:p.totalPts}
                  </div>
                  {((tourney.winMode==='wins'?p.bonusWins:p.bonusPts)>0)&&(
                    <div style={{color:T.t3,fontSize:10,fontWeight:600}}>
                      +{tourney.winMode==='wins'?p.bonusWins:p.bonusPts} Pause
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'flex',gap:10,marginTop:6}}>
          <button onClick={onNew}
            style={{flex:1,padding:'14px',borderRadius:14,border:'none',
              background:T.o,color:T.bg,fontSize:14,fontWeight:800,cursor:'pointer'}}>
            🏆 Neues Turnier
          </button>
          <button onClick={onHome}
            style={{flex:1,padding:'14px',borderRadius:14,
              border:`1px solid ${T.border}`,background:T.card,
              color:T.t1,fontSize:14,fontWeight:600,cursor:'pointer'}}>
            🏠 Home
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
function Live({hasMatch,hasTourney,tourneyData,matchCfg,nav,activeTab,setActiveTab,
  onDeleteMatch,onDeleteTourney,joinedSession,onLeaveJoined}){
  const items=[];
  if(hasMatch){
    items.push({
      id:'match',type:'match',
      title:`${matchCfg.nameA} vs ${matchCfg.nameB}`,
      sub:matchCfg.format==='bo3'?'Best of Three':'Americano',
      navTo:'match',
      onDelete:onDeleteMatch,
    });
  }
  if(hasTourney){
    items.push({
      id:'tourney',type:'tourney',
      title:`Turnier · ${tourneyData.format==='mexicano'?'Mexicano':'Americano'}`,
      sub:`Runde ${tourneyData.current+1} · ${tourneyData.players.length} Spieler`,
      navTo:tourneyData.finished?'tournament-leaderboard':'tournament-play',
      onDelete:onDeleteTourney,
    });
  }
  if(joinedSession){
    items.push({
      id:'joined',type:'joined',
      title:`Online-Turnier · ${joinedSession.name||'Du'}`,
      sub:`PIN ${joinedSession.pin?.toUpperCase()} · Tippen zum Wiedereintreten`,
      navTo:'remote',
      onDelete:onLeaveJoined,
    });
  }

  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 9px 24px'}}>
        <RitmoWordmark size={52} style={{marginLeft:-3}}/>
        <div style={{color:T.t2,fontSize:30,marginTop:8,marginLeft:10,fontWeight:800}}>
          {items.length===0?'Keine laufenden Spiele.':'Laufende Spiele und Turniere.'}
        </div>
        {items.length>0&&(
          <div style={{color:T.t3,fontSize:11,marginTop:4,fontWeight:500}}>
            ← Wische nach links zum Löschen
          </div>
        )}
      </div>

      <div style={{flex:1,padding:'0 22px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>

        {items.length===0&&(
          <div style={{textAlign:'center',color:T.t3,fontSize:14,padding:'40px 20px',lineHeight:1.6}}>
            Starte ein neues Spiel oder Turnier auf dem Home-Screen, um es hier wieder aufzunehmen.
          </div>
        )}

        {items.map((item,i)=>(
          <div key={item.id} className="fu" style={{animationDelay:`${i*0.06}s`}}>
            <SwipeableCard onDelete={item.onDelete}>
              <button onClick={()=>nav(item.navTo)}
                style={{width:'100%',background:T.card,border:`1px solid ${T.border}`,
                  borderRadius:18,padding:'18px 20px',display:'flex',alignItems:'center',gap:18,
                  cursor:'pointer',color:T.t1,textAlign:'left',transition:'background .15s'}}
                onPointerDown={e=>e.currentTarget.style.background=T.card2}
                onPointerUp={e=>e.currentTarget.style.background=T.card}
                onPointerLeave={e=>e.currentTarget.style.background=T.card}>
                {item.type==='match'?<CourtIcon size={42}/>:<TrophyIcon size={42}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:T.o,fontSize:16,fontWeight:700,marginBottom:3,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div>
                  <div style={{color:T.t3,fontSize:12,fontWeight:500}}>{item.sub}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,
                  background:T.oSoft,borderRadius:20,
                  padding:'5px 12px',border:`1px solid ${T.o}`,flexShrink:0}}>
                  <span style={{color:T.o,fontSize:11,fontWeight:700}}>▶</span>
                </div>
              </button>
            </SwipeableCard>
          </div>
        ))}
      </div>

      <div style={{height:120}}/>
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
      background:T.card2,borderRadius:10,border:`1px solid ${T.border}`}}>
      <KeyCapture onKey={handleKey}/>
      <div style={{color:T.t1,fontSize:12,fontWeight:700,marginBottom:10}}>
        Eingabe testen
      </div>

      {/* Detection display */}
      <div style={{
        background: fresh?T.oSoft:T.card,
        border:`1.5px solid ${fresh?T.o:T.border}`,
        borderRadius:10,padding:'18px 14px',textAlign:'center',
        transition:'background .2s, border-color .2s'}}>
        {last?(
          <>
            <div style={{color:fresh?T.o:T.t1,fontSize:22,fontWeight:800,
              fontFamily:'monospace',transition:'color .2s',letterSpacing:.5}}>
              {last.key}
            </div>
            <div style={{color:T.t3,fontSize:10,marginTop:4,fontFamily:'monospace'}}>
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
    <button onClick={onClick}
      style={{width:'100%',background:bg,border:`1px solid ${border}`,borderRadius:14,
        padding:'16px 18px',display:'flex',alignItems:'center',gap:16,
        color,textAlign:'left',cursor:'pointer',transition:'background .15s'}}
      onPointerDown={e=>e.currentTarget.style.background = destructive ? 'rgba(232,69,69,0.14)' : T.card2}
      onPointerUp={e=>e.currentTarget.style.background = bg}
      onPointerLeave={e=>e.currentTarget.style.background = bg}>
      <div style={{flexShrink:0,color:accent,display:'flex',alignItems:'center',
        justifyContent:'center',width:38,height:38,
        background:destructive?'rgba(232,69,69,0.10)':T.card2,
        border:`1px solid ${destructive?'rgba(232,69,69,0.25)':T.border}`,borderRadius:10}}>
        {icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color,fontSize:15,fontWeight:700,letterSpacing:-.1,marginBottom:2}}>
          <Hl text={title} q={q}/>
        </div>
        <div style={{color:destructive?'rgba(255,107,107,0.7)':T.t3,fontSize:12,
          fontWeight:500,lineHeight:1.45}}>
          <Hl text={desc} q={q}/>
        </div>
      </div>
      <ChevronRightIcon size={18} color={destructive?'rgba(255,107,107,0.7)':T.t3}/>
    </button>
  );
}

function Settings({onHome,activeTab,setActiveTab,nav}){
  // Such-Query — TabBar setzt sie via onSearch.
  const[query,setQuery]=useState('');
  const q=query;

  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 9px 22px'}}>
        <RitmoWordmark size={52} style={{marginLeft:-3}}/>
        <div style={{color:T.t2,fontSize:30,marginTop:8,marginLeft:10,fontWeight:800}}>
          <Hl text="Einstellungen" q={q}/>
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

        <SettingsCard q={q} destructive
          icon={<DoorOutIcon size={22} color="currentColor"/>}
          title="Ich muss hier raus!"
          desc="Konto löschen. Endgültig — keine Wiederherstellung."
          onClick={()=>nav('settings-konto')}/>

        {/* About — schlichte Marker, kein Tap-Target */}
        <div style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:14,
          padding:'14px 18px',color:T.t3,fontSize:11,lineHeight:1.6,textAlign:'center'}}>
          <Hl text="Made by Team RITMO." q={q}/><br/><Hl text="With love for Padel ♡" q={q}/>
        </div>

        <div style={{height:120,flexShrink:0}}/>
      </div>

      <TabBar active={activeTab} onTab={setActiveTab}
        searchable={true} onSearch={setQuery}/>
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
  const fabBase={
    position:'absolute',
    bottom:'calc(env(safe-area-inset-bottom,0px) + 28px)',
    width:54,height:54,borderRadius:'50%',
    background:T.card,border:`1px solid ${T.border}`,
    color:T.t1,cursor:'pointer',
    display:'flex',alignItems:'center',justifyContent:'center',
    boxShadow:'0 8px 24px rgba(0,0,0,.45)',zIndex:5,
  };
  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',
      position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 22px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          {icon&&(
            <div style={{flexShrink:0,color:T.o,
              width:36,height:36,background:T.card2,
              border:`1px solid ${T.border}`,borderRadius:10,
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

      {/* Floating Home-FAB links → zur Startseite */}
      {onHome&&(
        <button onClick={onHome} aria-label="Zurück zur Startseite"
          style={{...fabBase,left:22}}>
          <HomeIcon size={22}/>
        </button>
      )}

      {/* Floating Gear-FAB rechts → zurück zur Settings-Übersicht */}
      <button onClick={onBack} aria-label="Zurück zu Einstellungen"
        style={{...fabBase,right:22}}>
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
    {id:'smartphone',label:'Smartphone',icon:'📱',sub:'Tippen auf die Score-Karten'},
    {id:'presenter',label:'Presenter',icon:'⌨️',sub:'Page Up / Page Down Tasten'},
    {id:'ring',label:'Smart Ring',icon:'💍',sub:'Bluetooth Scroll-Ring am Finger'},
    {id:'watch',label:'Smartwatch',icon:'⌚',sub:'Bald verfügbar'},
    {id:'flic',label:'Flic Button',icon:'🔘',sub:'Bald verfügbar'},
  ];
  return(
    <SettingsSubLayout title="Steuerung"
      desc="Wie Punkte vergeben werden, Klang & Stimme."
      icon={<SteeringWheelIcon size={22} color="currentColor"/>}
      onBack={onBack} onHome={onHome}>

      {/* Score-Gerät */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
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
              <span style={{fontSize:24,width:32,textAlign:'center'}}>{opt.icon}</span>
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
          <div style={{margin:'8px 0 14px',padding:'12px 14px',background:T.card2,borderRadius:10,
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
          <div style={{margin:'8px 0 14px',padding:'12px 14px',background:T.card2,borderRadius:10,
            border:`1px solid ${T.border}`,color:T.t2,fontSize:12,lineHeight:1.7}}>
            <div style={{color:T.t1,fontWeight:700,marginBottom:6}}>Tasten-Belegung:</div>
            <div><span style={{color:T.t1,fontWeight:700,fontFamily:'monospace'}}>2</span> → Punkt Team A</div>
            <div><span style={{color:T.t1,fontWeight:700,fontFamily:'monospace'}}>4</span> → Punkt Team B</div>
            <div><span style={{color:T.t1,fontWeight:700,fontFamily:'monospace'}}>Leertaste</span> → Letzten Punkt rückgängig</div>
            <div><span style={{color:T.t1,fontWeight:700,fontFamily:'monospace'}}>1</span> → Spiel zurücksetzen</div>
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
          <div style={{margin:'8px 0 14px',padding:'12px 14px',background:T.card2,borderRadius:10,
            border:`1px solid ${T.border}`,color:T.t3,fontSize:12,lineHeight:1.6}}>
            Flic Button Integration kommt in einer zukünftigen Version.
          </div>
        )}
        {inputMode==='watch'&&(
          <div style={{margin:'8px 0 14px',padding:'12px 14px',background:T.card2,borderRadius:10,
            border:`1px solid ${T.border}`,color:T.t3,fontSize:12,lineHeight:1.6}}>
            Smartwatch Integration kommt in einer zukünftigen Version.
          </div>
        )}
      </div>

      {/* Sprachansage */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
        padding:'14px 18px',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:15,fontWeight:600}}>Sprachansage</div>
            <div style={{color:T.t3,fontSize:11,marginTop:2}}>
              Score wird vom RITMO-Voice angesagt.
            </div>
          </div>
          <div onClick={()=>setVoiceOn(!voiceOn)}
            style={{width:48,height:28,borderRadius:14,
              background:voiceOn?T.o:'rgba(120,120,128,.32)',
              position:'relative',cursor:'pointer',transition:'background .25s',flexShrink:0}}>
            <div style={{width:24,height:24,borderRadius:'50%',background:T.bg,
              position:'absolute',top:2,left:voiceOn?22:2,transition:'left .25s',
              boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
          </div>
        </div>
      </div>

      {/* Timer-Klingelton */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
        padding:'18px 18px 8px'}}>
        <div style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.3,
          textTransform:'uppercase',marginBottom:4}}>Timer-Klingelton</div>
        <div style={{color:T.t3,fontSize:12,fontWeight:500,marginBottom:14,lineHeight:1.5}}>
          Ton wenn Americano-Timer abläuft.
        </div>
        {RINGS.map((r,i)=>(
          <div key={r.id} onClick={()=>setRingId(r.id)}
            style={{display:'flex',alignItems:'center',padding:'12px 0',
              borderBottom:i<RINGS.length-1?`1px solid ${T.sep}`:'none',cursor:'pointer'}}>
            <div style={{flex:1}}>
              <div style={{color:T.t1,fontSize:14,fontWeight:ringId===r.id?700:500}}>{r.label}</div>
              <div style={{color:T.t3,fontSize:11,marginTop:1}}>{r.desc}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <button onClick={e=>{e.stopPropagation();playRing(r.id);}}
                style={{width:30,height:30,borderRadius:8,background:T.card2,
                  border:`1px solid ${T.border}`,color:T.o,fontSize:11,
                  cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
                  fontWeight:700}}>▶</button>
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

/* ─── Anpassung — Theme picker ──────────────────────────────────── */
function SettingsAnpassung({onBack,onHome,theme,setTheme}){
  const themes=[
    {id:'dark',label:'RITMO BAUHAUS Dark',icon:'🌙',desc:'Schwarz, weiß, orange'},
    {id:'light',label:'Federleicht',icon:'☀️',desc:'Weiß, schwarz, blau'},
    {id:'padel',label:'Padelhaus Blue',icon:'🎾',desc:'Elektroblau, weiß, gelb'},
    {id:'wimbledon',label:'Wimbledon Green',icon:'🌿',desc:'Rolex-Grün, beige, bone white'},
    {id:'funky',label:'RITMO BAUHAUS Funky',icon:'🦜',desc:'Tropisch — Gelb, Papageienrot, Kiwi'},
  ];
  return(
    <SettingsSubLayout title="Anpassung"
      desc="Wähle dein Erscheinungsbild."
      icon={<PaletteIcon size={22} color="currentColor"/>}
      onBack={onBack} onHome={onHome}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
        padding:'18px 18px 8px'}}>
        <div style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.3,
          textTransform:'uppercase',marginBottom:8}}>Theme</div>
        {themes.map((th,i)=>(
          <div key={th.id} onClick={()=>setTheme(th.id)}
            style={{display:'flex',alignItems:'center',padding:'12px 0',
              borderBottom:i<themes.length-1?`1px solid ${T.sep}`:'none',cursor:'pointer'}}>
            <div style={{fontSize:18,marginRight:12,width:22,textAlign:'center'}}>{th.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.t1,fontSize:14,fontWeight:theme===th.id?700:500}}>{th.label}</div>
              <div style={{color:T.t3,fontSize:11,marginTop:1}}>{th.desc}</div>
              {th.id==='funky'&&<div style={{marginTop:6}}><FunkyFruitsRow size={14} gap={6}/></div>}
            </div>
            {theme===th.id
              ?<span style={{color:T.o,fontSize:16,width:16,textAlign:'center'}}>✓</span>
              :<span style={{width:16}}/>}
          </div>
        ))}
      </div>
    </SettingsSubLayout>
  );
}

/* ─── Generischer Coming-Soon Sub-Screen ───────────────────────── */
function SettingsComingSoon({title,desc,icon,onBack,onHome,bullets=[]}){
  return(
    <SettingsSubLayout title={title} desc={desc} icon={icon}
      onBack={onBack} onHome={onHome}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
        padding:'24px 22px',textAlign:'center'}}>
        <div style={{color:T.o,fontSize:11,fontWeight:800,letterSpacing:2.5,
          textTransform:'uppercase',marginBottom:8}}>Coming Soon</div>
        <div style={{color:T.t1,fontSize:18,fontWeight:800,letterSpacing:-.2,marginBottom:10}}>
          Wir bauen gerade.
        </div>
        <div style={{color:T.t3,fontSize:13,lineHeight:1.6,marginBottom:bullets.length?20:0}}>
          Diese Sektion wird bald freigeschaltet. Wir bauen sie aktiv — bei Wunsch melden wir uns, sobald sie live ist.
        </div>
        {bullets.length>0&&(
          <div style={{marginTop:14,textAlign:'left',display:'flex',flexDirection:'column',gap:10}}>
            {bullets.map((b,i)=>(
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,
                color:T.t2,fontSize:13,lineHeight:1.55}}>
                <span style={{color:T.o,fontSize:14,lineHeight:1.4,flexShrink:0}}>·</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsSubLayout>
  );
}

/* ─── Konto löschen — Destructive sub-screen ────────────────────── */
function SettingsKonto({onBack,onHome,onLogout}){
  const[confirmText,setConfirmText]=useState('');
  const ready=confirmText.trim().toUpperCase()==='LÖSCHEN';
  return(
    <SettingsSubLayout title="Ich muss hier raus!"
      desc="Konto löschen — endgültig, ohne Wiederherstellung."
      icon={<DoorOutIcon size={22} color="currentColor"/>}
      onBack={onBack} onHome={onHome}>

      <div style={{background:'rgba(232,69,69,0.08)',border:'1px solid rgba(232,69,69,0.35)',
        borderRadius:14,padding:'20px 22px',marginBottom:14}}>
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

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
        padding:'18px 22px',marginBottom:14}}>
        <div style={{color:T.t2,fontSize:12,lineHeight:1.6,marginBottom:10}}>
          Zur Bestätigung tippe das Wort <strong style={{color:T.t1}}>LÖSCHEN</strong> in
          das Feld:
        </div>
        <input value={confirmText} onChange={e=>setConfirmText(e.target.value)}
          autoCapitalize="characters" autoCorrect="off" spellCheck={false}
          placeholder="LÖSCHEN"
          style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
            borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:700,
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
            border:'none',borderRadius:12,
            color:ready?'#FFFFFF':'rgba(255,255,255,0.5)',
            fontSize:14,fontWeight:800,letterSpacing:.3,
            cursor:ready?'pointer':'not-allowed',
            transition:'background .15s'}}>
          Konto endgültig löschen
        </button>
      </div>

      <button onClick={onBack}
        style={{width:'100%',padding:'14px 16px',background:'transparent',
          border:`1px solid ${T.border}`,borderRadius:12,
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
function RitmoPost({onHome,profile,onOpenInvites,onOpenBookings}){
  const[tab,setTab]=useState('notify');
  const tabs=[
    {id:'notify',label:'Benachrichtigungen',short:'Updates'},
    {id:'chats', label:'Chats',short:'Chats'},
    {id:'events',label:'Events',short:'Events'},
  ];

  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',
      position:'relative',overflow:'hidden'}}>

      {/* Header */}
      <div style={{padding:'0 22px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <div style={{flexShrink:0,color:T.o,
            width:38,height:38,background:T.card2,
            border:`1px solid ${T.border}`,borderRadius:10,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <RitmoPostIcon size={22} color="currentColor"/>
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
          Black-on-Black mehr. */}
      <div style={{display:'flex',gap:8,padding:'0 22px 16px',flexShrink:0}}>
        {tabs.map(t=>{
          const active=tab===t.id;
          return(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:1,padding:'10px 8px',
                background:active?T.t1:'transparent',
                color:active?T.bg:T.t2,
                border:`1px solid ${active?T.t1:T.border}`,borderRadius:10,
                fontSize:12,fontWeight:active?800:600,letterSpacing:.3,
                cursor:'pointer',transition:'all .15s'}}>
              {t.short}
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
            title="Match-Einladungen ansehen"
            desc="Eingehende Einladungen zu offenen Matches findest du im eigenen Posteingang."
            cta={{label:'Einladungen öffnen',onClick:onOpenInvites}}/>
        )}

        {tab==='chats'&&(
          <RitmoPostEmpty
            icon={<RitmoPostIcon size={28} color="currentColor"/>}
            title="Noch keine Chats"
            desc="Schreib mit Mitspielern, Turnier-Hosts und der RITMO Community. Coming soon."/>
        )}

        {tab==='events'&&(
          <RitmoPostEmpty
            icon={<CourtIcon size={28}/>}
            title="Offene Matches ansehen"
            desc="Buchbare Matches und Events findest du gebündelt unter „Match buchen“."
            cta={{label:'Zu den Matches',onClick:onOpenBookings}}/>
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
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
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
            border:`1px solid ${T.o}`,borderRadius:10,
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
      style={{width:'100%',background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
        padding:'12px 14px',display:'flex',alignItems:'center',gap:12,
        color:T.t1,textAlign:'left',cursor:'pointer',transition:'background .15s'}}
      onPointerDown={e=>e.currentTarget.style.background=T.card2}
      onPointerUp={e=>e.currentTarget.style.background=T.card}
      onPointerLeave={e=>e.currentTarget.style.background=T.card}>
      <ProfileAvatar name={name} avatar={data.avatar} size={42}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:T.t1,fontSize:14,fontWeight:700,letterSpacing:-.1,
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

/* ── Generischer Screen-Wrapper (Header + Home-FAB) ──────────────── */
function SocialScreen({eyebrow,title,desc,icon,onHome,children}){
  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',
      position:'relative',overflow:'hidden'}}>
      <div className="fi" style={{padding:'0 22px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          {icon&&(
            <div style={{flexShrink:0,color:T.o,
              width:36,height:36,background:T.card2,
              border:`1px solid ${T.border}`,borderRadius:10,
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
      <div className="fu" style={{marginBottom:14}}>
        <input value={q} onChange={e=>setQ(e.target.value)}
          autoCapitalize="off" autoCorrect="off" spellCheck={false}
          placeholder="Name eingeben …"
          style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
            borderRadius:12,padding:'13px 16px',color:T.t1,fontSize:15,fontWeight:500,
            outline:'none',boxSizing:'border-box'}}/>
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
function PublicProfile({userId,currentUid,onHome,onBack}){
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
  const name=prof?.display_name||data.name||'Spieler';
  const lvl=data.playtomicLevel??data.estimatedLevel;
  const styleType=data.styleType;
  const style=styleType?PADEL_STYLES[styleType]:null;

  return(
    <SocialScreen eyebrow="Profil" title={name}
      icon={<PersonGlyph size={22}/>} onHome={onHome}>
      {!prof?(
        <RitmoPostEmpty icon={<EyeIcon size={28}/>}
          title="Profil nicht verfügbar"
          desc="Dieses Profil ist entweder privat oder existiert nicht."
          cta={{label:'Zurück',onClick:onBack}}/>
      ):(
        <Fragment>
          {/* Hero */}
          <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
            borderRadius:16,padding:'24px 22px',marginBottom:12,
            display:'flex',alignItems:'center',gap:16}}>
            <ProfileAvatar name={name} avatar={data.avatar} size={72}/>
            <div style={{flex:1,minWidth:0}}>
              {lvl!=null&&(
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

          {/* Follower / Following */}
          <div className="fu" style={{display:'flex',gap:10,marginBottom:12,animationDelay:'.04s'}}>
            <div style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
              padding:'14px 12px',textAlign:'center'}}>
              <div style={{color:T.t1,fontSize:22,fontWeight:900,letterSpacing:-.3}}>{counts.followers}</div>
              <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
                textTransform:'uppercase',marginTop:2}}>Follower</div>
            </div>
            <div style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
              padding:'14px 12px',textAlign:'center'}}>
              <div style={{color:T.t1,fontSize:22,fontWeight:900,letterSpacing:-.3}}>{counts.following}</div>
              <div style={{color:T.t3,fontSize:10,fontWeight:700,letterSpacing:1.3,
                textTransform:'uppercase',marginTop:2}}>Folgt</div>
            </div>
          </div>

          {/* Follow button */}
          {!isSelf&&(
            <button onClick={toggle} disabled={busy} className="fu"
              style={{width:'100%',marginBottom:12,padding:'14px 16px',
                background:following?T.card:T.o,
                border:following?`1px solid ${T.border}`:'none',borderRadius:12,
                color:following?T.t1:'#000',fontSize:14,fontWeight:800,letterSpacing:.3,
                cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,
                animationDelay:'.08s'}}>
              {following?'Du folgst':'Folgen'}
            </button>
          )}

          {/* RITMO DNA Card (wenn vorhanden) */}
          {style&&(
            <div className="fu" style={{
              background:'linear-gradient(135deg,#1A1A1A 0%,#000 100%)',
              border:`1px solid ${style.accent}40`,borderRadius:16,
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
      desc="Find oder gründe deinen Club."
      icon={<TrophyIcon size={22}/>} onHome={onHome}>
      <div className="fu" style={{display:'flex',gap:8,marginBottom:14}}>
        <input value={q} onChange={e=>setQ(e.target.value)}
          placeholder="Name oder Stadt …"
          style={{flex:1,background:T.card2,border:`1px solid ${T.border}`,
            borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:500,
            outline:'none',boxSizing:'border-box',minWidth:0}}/>
        <button onClick={onCreateClub}
          style={{padding:'12px 14px',background:T.o,border:'none',borderRadius:10,
            color:'#000',fontSize:13,fontWeight:800,letterSpacing:.3,cursor:'pointer',
            flexShrink:0}}>
          + Neu
        </button>
      </div>
      {busy?(
        <div style={{color:T.t3,fontSize:13,padding:'24px 0',textAlign:'center'}}>Lädt …</div>
      ):clubs.length===0?(
        <RitmoPostEmpty icon={<TrophyIcon size={28}/>}
          title="Noch keine Clubs"
          desc="Sei der/die Erste und gründe einen Club."
          cta={{label:'Club gründen',onClick:onCreateClub}}/>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {clubs.map((c,i)=>(
            <button key={c.id} onClick={()=>onOpenClub(c.id)} className="fu"
              style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
                padding:'14px 16px',display:'flex',alignItems:'center',gap:12,
                color:T.t1,textAlign:'left',cursor:'pointer',animationDelay:`${i*0.03}s`}}>
              <div style={{flexShrink:0,width:40,height:40,borderRadius:10,
                background:T.card2,border:`1px solid ${T.border}`,color:T.o,
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                <TrophyIcon size={20}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:T.t1,fontSize:14,fontWeight:700,letterSpacing:-.1}}>{c.name}</div>
                {c.city&&<div style={{color:T.t3,fontSize:11,marginTop:2}}>{c.city}</div>}
              </div>
              <ChevronRightIcon size={16} color={T.t3}/>
            </button>
          ))}
        </div>
      )}
    </SocialScreen>
  );
}

/* ═══ ClubCreate — Formular ═══ */
function ClubCreate({onHome,onDone,onCancel}){
  const[name,setName]=useState('');
  const[city,setCity]=useState('');
  const[desc,setDesc]=useState('');
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState('');
  const save=async()=>{
    setErr(''); setBusy(true);
    try{
      const club=await createClub({name,city,description:desc});
      onDone(club);
    }catch(e){ setErr(e.message||'Fehler.'); }
    finally{ setBusy(false); }
  };
  return(
    <SocialScreen eyebrow="Clubs" title="Neuer Club"
      desc="Leg den Namen fest — der Rest folgt."
      icon={<TrophyIcon size={22}/>} onHome={onHome}>
      <div className="fu" style={{display:'flex',flexDirection:'column',gap:12}}>
        <div>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Name *</div>
          <input value={name} onChange={e=>setName(e.target.value)}
            placeholder="z.B. Padelhaus München"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:600,
              outline:'none',boxSizing:'border-box'}}/>
        </div>
        <div>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Stadt</div>
          <input value={city} onChange={e=>setCity(e.target.value)}
            placeholder="z.B. München"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:600,
              outline:'none',boxSizing:'border-box'}}/>
        </div>
        <div>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Beschreibung</div>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3}
            placeholder="Was zeichnet euch aus?"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:500,
              outline:'none',boxSizing:'border-box',resize:'vertical'}}/>
        </div>
        {err&&(
          <div style={{background:'rgba(232,69,69,.12)',border:'1px solid rgba(232,69,69,.4)',
            borderRadius:8,padding:'9px 12px',color:'#FF6B6B',fontSize:12,fontWeight:600}}>
            {err}
          </div>
        )}
        <button onClick={save} disabled={busy||!name.trim()}
          style={{padding:'14px 16px',background:T.o,border:'none',borderRadius:12,
            color:'#000',fontSize:14,fontWeight:800,letterSpacing:.3,
            cursor:(busy||!name.trim())?'not-allowed':'pointer',
            opacity:(busy||!name.trim())?.55:1,marginTop:6}}>
          {busy?'…':'Club gründen'}
        </button>
        <button onClick={onCancel}
          style={{padding:'12px 16px',background:'transparent',border:`1px solid ${T.border}`,
            borderRadius:12,color:T.t2,fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Abbrechen
        </button>
      </div>
    </SocialScreen>
  );
}

/* ═══ ClubDetail ═══ */
function ClubDetail({clubId,currentUid,onHome,onBack,onOpenPlayer}){
  const[club,setClub]=useState(null);
  const[members,setMembers]=useState([]);
  const[joined,setJoined]=useState(false);
  const[busy,setBusy]=useState(false);

  const refresh=useCallback(async()=>{
    const [c,m,j]=await Promise.all([
      fetchClub(clubId), clubMembers(clubId,{limit:50}), isClubMember(clubId)
    ]);
    setClub(c); setMembers(m); setJoined(j);
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

  return(
    <SocialScreen eyebrow="Club" title={club?.name||'Lädt …'}
      desc={club?.city||''}
      icon={<TrophyIcon size={22}/>} onHome={onHome}>
      {!club?null:(
        <Fragment>
          {club.description&&(
            <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
              borderRadius:14,padding:'16px 18px',marginBottom:12,
              color:T.t2,fontSize:14,lineHeight:1.6}}>
              {club.description}
            </div>
          )}

          {!isOwner&&(
            <button onClick={toggle} disabled={busy} className="fu"
              style={{width:'100%',marginBottom:14,padding:'14px 16px',
                background:joined?T.card:T.o,
                border:joined?`1px solid ${T.border}`:'none',borderRadius:12,
                color:joined?T.t1:'#000',fontSize:14,fontWeight:800,letterSpacing:.3,
                cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,
                animationDelay:'.05s'}}>
              {joined?'Mitglied · Austreten':'Club beitreten'}
            </button>
          )}
          {isOwner&&(
            <div className="fu" style={{padding:'10px 14px',marginBottom:14,
              background:T.oSoft,border:`1px solid ${T.o}`,borderRadius:10,
              color:T.o,fontSize:11,fontWeight:800,letterSpacing:1.5,
              textTransform:'uppercase',textAlign:'center',animationDelay:'.05s'}}>
              Du bist Inhaber:in
            </div>
          )}

          <div className="fu" style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.5,
            textTransform:'uppercase',marginBottom:8,marginLeft:4,animationDelay:'.08s'}}>
            Mitglieder · {members.length}
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

/* ═══ Bookings — Liste offener Matches ═══ */
function Bookings({onHome,onOpenBooking,onCreateBooking}){
  const[mode,setMode]=useState('open'); // 'open' | 'mine'
  const[items,setItems]=useState([]);
  const[busy,setBusy]=useState(false);
  const load=useCallback(async()=>{
    setBusy(true);
    try{ setItems(await listBookings({mine:mode==='mine',limit:50})); }
    finally{ setBusy(false); }
  },[mode]);
  useEffect(()=>{ load(); },[load]);

  const fmtDate=(iso)=>{
    try{
      const d=new Date(iso);
      const opt={weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'};
      return d.toLocaleString('de-DE',opt);
    }catch(e){ return iso; }
  };

  return(
    <SocialScreen eyebrow="Spiel" title="Buchen"
      desc="Offene Matches finden oder selber anbieten."
      icon={<CourtIcon size={22}/>} onHome={onHome}>
      <div className="fu" style={{display:'flex',gap:8,marginBottom:14}}>
        {[{id:'open',label:'Offen'},{id:'mine',label:'Meine'}].map(t=>{
          const active=mode===t.id;
          return(
            <button key={t.id} onClick={()=>setMode(t.id)}
              style={{flex:1,padding:'10px 8px',
                background:active?T.t1:'transparent',color:active?T.bg:T.t2,
                border:`1px solid ${active?T.t1:T.border}`,borderRadius:10,
                fontSize:12,fontWeight:active?800:600,letterSpacing:.3,cursor:'pointer'}}>
              {t.label}
            </button>
          );
        })}
        <button onClick={onCreateBooking}
          style={{padding:'10px 14px',background:T.o,border:'none',borderRadius:10,
            color:'#000',fontSize:13,fontWeight:800,letterSpacing:.3,cursor:'pointer',
            flexShrink:0}}>
          + Neu
        </button>
      </div>
      {busy?(
        <div style={{color:T.t3,fontSize:13,padding:'24px 0',textAlign:'center'}}>Lädt …</div>
      ):items.length===0?(
        <RitmoPostEmpty icon={<CourtIcon size={28}/>}
          title={mode==='mine'?'Keine eigenen Matches':'Keine offenen Matches'}
          desc={mode==='mine'
            ?'Du hast aktuell kein Match angeboten.'
            :'Niemand hat ein Match offen — sei der/die Erste.'}
          cta={{label:'Match anlegen',onClick:onCreateBooking}}/>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {items.map((b,i)=>(
            <button key={b.id} onClick={()=>onOpenBooking(b.id)} className="fu"
              style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
                padding:'14px 16px',display:'flex',alignItems:'center',gap:12,
                color:T.t1,textAlign:'left',cursor:'pointer',animationDelay:`${i*0.03}s`}}>
              <div style={{flexShrink:0,width:40,height:40,borderRadius:10,
                background:T.card2,border:`1px solid ${T.border}`,color:T.o,
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                <CourtIcon size={20}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:T.t1,fontSize:14,fontWeight:700,letterSpacing:-.1}}>
                  {fmtDate(b.starts_at)}
                </div>
                <div style={{color:T.t3,fontSize:11,marginTop:2}}>
                  {b.format==='bo3'?'Best-of-3':'Americano'} · {b.duration_min} Min
                  {b.court_label?` · ${b.court_label}`:''}
                  {b.level_min!=null&&b.level_max!=null
                    ?` · Lv ${b.level_min.toFixed?.(1)||b.level_min}–${b.level_max.toFixed?.(1)||b.level_max}`
                    :''}
                </div>
              </div>
              <ChevronRightIcon size={16} color={T.t3}/>
            </button>
          ))}
        </div>
      )}
    </SocialScreen>
  );
}

/* ═══ BookingDetail ═══ */
function BookingDetail({matchId,currentUid,onHome,onBack,onInvite}){
  const[booking,setBooking]=useState(null);
  const[slots,setSlots]=useState([]);
  const[busy,setBusy]=useState(false);

  const refresh=useCallback(async()=>{
    const [b,s]=await Promise.all([fetchBooking(matchId),bookingSlots(matchId)]);
    setBooking(b); setSlots(s);
  },[matchId]);
  useEffect(()=>{ refresh(); },[refresh]);

  if(!booking) return(
    <SocialScreen eyebrow="Match" title="Lädt …" onHome={onHome}>
      <div style={{color:T.t3,fontSize:13,padding:'24px 0',textAlign:'center'}}>Lädt …</div>
    </SocialScreen>
  );

  const total=booking.total_slots||4;
  const slotMap=Object.fromEntries(slots.map(s=>[s.slot_index,s]));
  const mySlot=slots.find(s=>s.user_id===currentUid);
  const fmtDate=(iso)=>{
    try{
      return new Date(iso).toLocaleString('de-DE',
        {weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'});
    }catch(e){ return iso; }
  };

  const join=async(idx)=>{
    if(busy) return; setBusy(true);
    try{ await joinSlot(matchId,idx); await refresh(); }
    catch(e){ alert(e.message); }
    finally{ setBusy(false); }
  };
  const leave=async()=>{
    if(busy) return; setBusy(true);
    try{ await leaveSlot(matchId); await refresh(); }
    finally{ setBusy(false); }
  };

  return(
    <SocialScreen eyebrow="Match" title={fmtDate(booking.starts_at)}
      desc={`${booking.format==='bo3'?'Best-of-3':'Americano'} · ${booking.duration_min} Min`+
        (booking.court_label?` · ${booking.court_label}`:'')}
      icon={<CourtIcon size={22}/>} onHome={onHome}>

      {booking.notes&&(
        <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
          borderRadius:14,padding:'14px 16px',marginBottom:12,
          color:T.t2,fontSize:13,lineHeight:1.55}}>
          {booking.notes}
        </div>
      )}

      <div className="fu" style={{color:T.o,fontSize:11,fontWeight:700,letterSpacing:1.5,
        textTransform:'uppercase',marginBottom:8,marginLeft:4,animationDelay:'.04s'}}>
        Plätze · {slots.length}/{total}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        {Array.from({length:total},(_,i)=>{
          const s=slotMap[i];
          const isMe=s?.user_id===currentUid;
          return(
            <div key={i} className="fu" style={{animationDelay:`${0.08+i*0.04}s`,
              background:s?T.card:T.card2,
              border:`1px ${s?'solid':'dashed'} ${isMe?T.o:T.border}`,
              borderRadius:12,padding:'14px 12px',
              display:'flex',flexDirection:'column',alignItems:'center',gap:6,minHeight:120,
              justifyContent:'center'}}>
              {s?(
                <Fragment>
                  <ProfileAvatar name={s.profile?.display_name||s.profile?.data?.name||'?'}
                    avatar={s.profile?.data?.avatar} size={44}/>
                  <div style={{color:T.t1,fontSize:12,fontWeight:700,textAlign:'center',
                    whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                    maxWidth:'100%'}}>
                    {s.profile?.display_name||s.profile?.data?.name||'Spieler'}
                  </div>
                  {isMe&&(
                    <span style={{padding:'2px 6px',background:T.oSoft,color:T.o,borderRadius:4,
                      fontSize:9,fontWeight:800,letterSpacing:.8,textTransform:'uppercase'}}>
                      Du
                    </span>
                  )}
                </Fragment>
              ):(
                <button onClick={()=>join(i)} disabled={busy||!!mySlot}
                  style={{padding:'10px 12px',background:'transparent',
                    border:`1px solid ${mySlot?T.border:T.o}`,borderRadius:8,
                    color:mySlot?T.t4:T.o,fontSize:11,fontWeight:800,letterSpacing:.4,
                    cursor:(busy||!!mySlot)?'not-allowed':'pointer'}}>
                  + Beitreten
                </button>
              )}
            </div>
          );
        })}
      </div>

      {mySlot&&(
        <button onClick={leave} className="fu"
          style={{width:'100%',marginBottom:10,padding:'12px 16px',
            background:'transparent',border:`1px solid ${T.border}`,borderRadius:12,
            color:T.t2,fontSize:13,fontWeight:700,cursor:'pointer',animationDelay:'.2s'}}>
          Platz frei geben
        </button>
      )}

      <button onClick={()=>onInvite(matchId)} className="fu"
        style={{width:'100%',padding:'12px 16px',
          background:T.oSoft,border:`1px solid ${T.o}`,borderRadius:12,
          color:T.o,fontSize:13,fontWeight:800,letterSpacing:.3,cursor:'pointer',
          animationDelay:'.22s'}}>
        Spieler einladen
      </button>
    </SocialScreen>
  );
}

/* ═══ BookingCreate ═══ */
function BookingCreate({onHome,onDone,onCancel}){
  // Default-Startzeit: heute + 1 h, auf volle Stunde gerundet
  const defaultStart=()=>{
    const d=new Date(Date.now()+60*60*1000);
    d.setMinutes(0,0,0);
    // ins "datetime-local"-Format (yyyy-MM-ddThh:mm, lokale Zeitzone)
    const pad=(n)=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const[starts,setStarts]=useState(defaultStart());
  const[duration,setDuration]=useState(90);
  const[court,setCourt]=useState('');
  const[format,setFormat]=useState('bo3');
  const[total,setTotal]=useState(4);
  const[lmin,setLmin]=useState('');
  const[lmax,setLmax]=useState('');
  const[notes,setNotes]=useState('');
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState('');

  const save=async()=>{
    setErr(''); setBusy(true);
    try{
      const b=await createBooking({
        starts_at:new Date(starts).toISOString(),
        duration_min:Number(duration)||90,
        court_label:court,
        format,
        total_slots:Number(total)||4,
        level_min:lmin?Number(lmin):null,
        level_max:lmax?Number(lmax):null,
        notes,
      });
      onDone(b);
    }catch(e){ setErr(e.message||'Fehler.'); }
    finally{ setBusy(false); }
  };

  return(
    <SocialScreen eyebrow="Match" title="Neues Match"
      desc="Leg die Eckdaten fest — Slot 1 ist automatisch deins."
      icon={<CourtIcon size={22}/>} onHome={onHome}>
      <div className="fu" style={{display:'flex',flexDirection:'column',gap:12}}>

        <div>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Startzeit *</div>
          <input type="datetime-local" value={starts} onChange={e=>setStarts(e.target.value)}
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:600,
              outline:'none',boxSizing:'border-box'}}/>
        </div>

        <div style={{display:'flex',gap:10}}>
          <div style={{flex:1}}>
            <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
              textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Dauer (Min)</div>
            <input type="number" min="30" step="15" value={duration}
              onChange={e=>setDuration(e.target.value)}
              style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:600,
                outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
              textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Plätze</div>
            <input type="number" min="2" max="8" value={total}
              onChange={e=>setTotal(e.target.value)}
              style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:600,
                outline:'none',boxSizing:'border-box'}}/>
          </div>
        </div>

        <div>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Format</div>
          <div style={{display:'flex',gap:8}}>
            {[{id:'bo3',label:'Best-of-3'},{id:'americano',label:'Americano'}].map(f=>(
              <button key={f.id} onClick={()=>setFormat(f.id)}
                style={{flex:1,padding:'11px 8px',
                  background:format===f.id?T.oSoft:T.card2,
                  border:`1px solid ${format===f.id?T.o:T.border}`,borderRadius:10,
                  color:format===f.id?T.o:T.t2,fontSize:13,
                  fontWeight:format===f.id?800:600,cursor:'pointer'}}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{display:'flex',gap:10}}>
          <div style={{flex:1}}>
            <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
              textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Level Min</div>
            <input type="number" step="0.1" min="0" max="7" value={lmin}
              onChange={e=>setLmin(e.target.value)} placeholder="z.B. 2.0"
              style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:600,
                outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
              textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Level Max</div>
            <input type="number" step="0.1" min="0" max="7" value={lmax}
              onChange={e=>setLmax(e.target.value)} placeholder="z.B. 4.0"
              style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
                borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:600,
                outline:'none',boxSizing:'border-box'}}/>
          </div>
        </div>

        <div>
          <div style={{color:T.t2,fontSize:11,fontWeight:700,letterSpacing:1.2,
            textTransform:'uppercase',marginBottom:6,paddingLeft:4}}>Court / Notiz</div>
          <input value={court} onChange={e=>setCourt(e.target.value)}
            placeholder="z.B. Platz 3"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:600,
              outline:'none',boxSizing:'border-box',marginBottom:10}}/>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
            placeholder="Optionale Notiz für Mitspieler …"
            style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
              borderRadius:10,padding:'12px 14px',color:T.t1,fontSize:14,fontWeight:500,
              outline:'none',boxSizing:'border-box',resize:'vertical'}}/>
        </div>

        {err&&(
          <div style={{background:'rgba(232,69,69,.12)',border:'1px solid rgba(232,69,69,.4)',
            borderRadius:8,padding:'9px 12px',color:'#FF6B6B',fontSize:12,fontWeight:600}}>
            {err}
          </div>
        )}

        <button onClick={save} disabled={busy||!starts}
          style={{padding:'14px 16px',background:T.o,border:'none',borderRadius:12,
            color:'#000',fontSize:14,fontWeight:800,letterSpacing:.3,
            cursor:busy?'not-allowed':'pointer',opacity:busy?.6:1,marginTop:6}}>
          {busy?'…':'Match anlegen'}
        </button>
        <button onClick={onCancel}
          style={{padding:'12px 16px',background:'transparent',border:`1px solid ${T.border}`,
            borderRadius:12,color:T.t2,fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Abbrechen
        </button>
      </div>
    </SocialScreen>
  );
}

/* ═══ BookingInvite — Spielersuche mit "Einladen"-Button ═══ */
function BookingInvite({matchId,onHome,onDone}){
  const[q,setQ]=useState('');
  const[results,setResults]=useState([]);
  const[invited,setInvited]=useState({});
  const[busy,setBusy]=useState(false);
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
  const invite=async(uid)=>{
    try{
      await sendInvite(matchId,uid);
      setInvited(m=>({...m,[uid]:true}));
    }catch(e){ alert(e.message); }
  };
  return(
    <SocialScreen eyebrow="Einladen" title="Spieler suchen"
      desc="Such Mitspieler über den Namen — sie bekommen die Einladung in ihrem RITMO Post."
      icon={<RitmoPostIcon size={22}/>} onHome={onHome}>
      <div className="fu" style={{marginBottom:14}}>
        <input value={q} onChange={e=>setQ(e.target.value)}
          placeholder="Name eingeben …"
          style={{width:'100%',background:T.card2,border:`1px solid ${T.border}`,
            borderRadius:12,padding:'13px 16px',color:T.t1,fontSize:15,fontWeight:500,
            outline:'none',boxSizing:'border-box'}}/>
      </div>
      {q.trim()===''?(
        <RitmoPostEmpty icon={<SearchIcon size={28}/>}
          title="Wen suchst du?"
          desc="Tipp einen Namen und lade direkt aus den Suchergebnissen ein."/>
      ):busy?(
        <div style={{color:T.t3,fontSize:13,padding:'24px 0',textAlign:'center'}}>Suche …</div>
      ):results.length===0?(
        <RitmoPostEmpty icon={<PersonGlyph size={28}/>}
          title="Niemand gefunden" desc="Anderen Namen probieren?"/>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {results.map((p,i)=>(
            <div key={p.user_id} className="fu" style={{animationDelay:`${i*0.03}s`}}>
              <PlayerListItem profile={p} onClick={()=>!invited[p.user_id]&&invite(p.user_id)}
                trailing={
                  <span style={{padding:'4px 10px',borderRadius:6,fontSize:10,fontWeight:800,
                    letterSpacing:.5,textTransform:'uppercase',
                    background:invited[p.user_id]?T.card2:T.oSoft,
                    border:`1px solid ${invited[p.user_id]?T.border:T.o}`,
                    color:invited[p.user_id]?T.t2:T.o}}>
                    {invited[p.user_id]?'✓ Eingeladen':'Einladen'}
                  </span>
                }/>
            </div>
          ))}
        </div>
      )}
      <div style={{marginTop:18}}>
        <button onClick={onDone}
          style={{width:'100%',padding:'12px 16px',background:'transparent',
            border:`1px solid ${T.border}`,borderRadius:12,
            color:T.t2,fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Fertig
        </button>
      </div>
    </SocialScreen>
  );
}

/* ═══ Invites — Eingehende Einladungen ═══ */
function InvitesScreen({onHome,onOpenBooking}){
  const[items,setItems]=useState([]);
  const[busy,setBusy]=useState(true);
  const load=useCallback(async()=>{
    setBusy(true);
    try{ setItems(await listIncomingInvites({limit:50})); }
    finally{ setBusy(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);
  const respond=async(id,accept)=>{
    await respondInvite(id,accept);
    await load();
  };
  const fmtDate=(iso)=>{
    try{ return new Date(iso).toLocaleString('de-DE',
      {weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }
    catch(e){ return iso; }
  };
  return(
    <SocialScreen eyebrow="RITMO Post" title="Einladungen"
      desc="Pending Match-Einladungen für dich."
      icon={<RitmoPostIcon size={22}/>} onHome={onHome}>
      {busy?(
        <div style={{color:T.t3,fontSize:13,padding:'24px 0',textAlign:'center'}}>Lädt …</div>
      ):items.length===0?(
        <RitmoPostEmpty icon={<RitmoPostIcon size={28}/>}
          title="Keine Einladungen"
          desc="Sobald jemand dich zu einem Match einlädt, erscheint sie hier."/>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {items.map((inv,i)=>{
            const from=inv.from_profile;
            const m=inv.match;
            const fromName=from?.display_name||from?.data?.name||'Spieler';
            const pending=inv.status==='pending';
            return(
              <div key={inv.id} className="fu" style={{animationDelay:`${i*0.04}s`,
                background:T.card,border:`1px solid ${pending?T.o:T.border}`,
                borderRadius:14,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                  <ProfileAvatar name={fromName} avatar={from?.data?.avatar} size={42}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:T.t1,fontSize:14,fontWeight:700}}>{fromName}</div>
                    <div style={{color:T.t3,fontSize:11,marginTop:2}}>
                      lädt dich ein
                    </div>
                  </div>
                  <span style={{padding:'2px 8px',borderRadius:4,fontSize:9,fontWeight:800,
                    letterSpacing:.8,textTransform:'uppercase',
                    background:pending?T.oSoft:T.card2,
                    color:pending?T.o:T.t3}}>
                    {inv.status==='accepted'?'Angenommen':inv.status==='declined'?'Abgelehnt':'Offen'}
                  </span>
                </div>
                {m&&(
                  <button onClick={()=>onOpenBooking(m.id)}
                    style={{width:'100%',padding:'10px 12px',background:T.card2,
                      border:`1px solid ${T.border}`,borderRadius:10,
                      color:T.t2,fontSize:12,fontWeight:600,cursor:'pointer',
                      display:'flex',alignItems:'center',gap:8,marginBottom:pending?10:0,textAlign:'left'}}>
                    <CourtIcon size={18}/>
                    <span style={{flex:1,minWidth:0}}>
                      {fmtDate(m.starts_at)} · {m.format==='bo3'?'Best-of-3':'Americano'}
                    </span>
                    <ChevronRightIcon size={14} color={T.t3}/>
                  </button>
                )}
                {pending&&(
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>respond(inv.id,true)}
                      style={{flex:1,padding:'10px 14px',background:T.o,border:'none',
                        borderRadius:10,color:'#000',fontSize:12,fontWeight:800,
                        letterSpacing:.3,cursor:'pointer'}}>
                      Annehmen
                    </button>
                    <button onClick={()=>respond(inv.id,false)}
                      style={{flex:1,padding:'10px 14px',background:'transparent',
                        border:`1px solid ${T.border}`,borderRadius:10,
                        color:T.t2,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                      Ablehnen
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SocialScreen>
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
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>

      <div style={{padding:'0 22px 8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <div style={{fontSize:32,width:42,textAlign:'center'}}>{icon}</div>
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
            borderRadius:14,padding:16,marginBottom:18,
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
function Rules({onHome,onSelect,alreadyRead,onToggleRead}){
  const sections=[
    {id:'basics',    icon:'🎾',title:'Padel-Grundregeln', sub:'Aufschlag, Wände, Punktezählung'},
    {id:'bo3',       icon:'📜',title:'Best of 3',         sub:'Klassisches Tennis-Scoring, Tiebreak bei 6:6'},
    {id:'americano', icon:'🏆',title:'Americano',         sub:'Wechselnde Partner, individuelle Punkte'},
    {id:'mexicano',  icon:'🎯',title:'Mexicano',          sub:'Ranking-basierte Paarungen ab Runde 2'},
    {id:'rotation',  icon:'⏱',title:'Pausen & Rotation', sub:'Fairer Rotations-Pool bei ungeraden Spielern'},
    {id:'glossar',   icon:'📖',title:'Schlagarten',       sub:'Bandeja, Víbora, Smash & mehr'},
  ];
  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>
      <div style={{padding:'0 22px 22px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <BookIcon size={32}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:26,fontWeight:800,letterSpacing:-.3}}>Regelwerk</div>
            <div style={{color:T.t2,fontSize:14,marginTop:2,fontWeight:400}}>
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
            style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
              padding:'14px 16px',display:'flex',alignItems:'center',gap:14,
              cursor:'pointer',color:T.t1,textAlign:'left',
              animationDelay:`${i*40}ms`,transition:'background .15s, border-color .15s'}}
            onPointerDown={e=>e.currentTarget.style.background=T.card2}
            onPointerUp={e=>e.currentTarget.style.background=T.card}
            onPointerLeave={e=>e.currentTarget.style.background=T.card}>
            <div style={{fontSize:24,width:32,textAlign:'center'}}>{s.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.t1,fontSize:15,fontWeight:700,marginBottom:2}}>{s.title}</div>
              <div style={{color:T.t3,fontSize:11,fontWeight:500}}>{s.sub}</div>
            </div>
            <div style={{color:T.t3,fontSize:18,fontWeight:600,width:16,textAlign:'center'}}>›</div>
          </button>
        ))}
      </div>
      <MatchBar onHome={onHome}/>
    </div>
  );
}

/* ───── Detail screens (one per section) ───── */
function RulesBasics({onBackToRules,onHome,onNext,onPrev,currentIdx,totalSections}){
  return(
    <RulesDetailLayout icon="🎾" title="Padel-Grundregeln"
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
    <RulesDetailLayout icon="📜" title="Best of 3"
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
    <RulesDetailLayout icon="🏆" title="Americano"
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
    <RulesDetailLayout icon="🎯" title="Mexicano"
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
    <RulesDetailLayout icon="⏱" title="Pausen & Rotation"
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
      <RulesP>Pausierte Spieler bekommen für die Pausenrunde den <strong style={{color:T.t1}}>Median aller Punkte</strong> dieser Runde gutgeschrieben. So entgehen sie keinem Punkteverlust durch erzwungene Pause.</RulesP>
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
    <RulesDetailLayout icon="📖" title="Schlagarten"
      sub="Körperhaltung & Treffpunkt der wichtigsten Schläge"
      onBackToRules={onBackToRules} onHome={onHome}
      onNext={onNext} onPrev={onPrev}
      currentIdx={currentIdx} totalSections={totalSections}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {shots.map((s,i)=>(
          <div key={s.id} className="fu"
            style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
              padding:14,display:'flex',gap:14,animationDelay:`${i*60}ms`}}>
            <div style={{flexShrink:0,width:120,display:'flex',alignItems:'center',
              justifyContent:'center',background:T.card2,borderRadius:10,padding:6,
              border:`1px solid ${T.sep}`}}>
              <s.Fig/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.o,fontSize:14,fontWeight:800,marginBottom:4,letterSpacing:.2}}>{s.title}</div>
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

function Journey({onHome,onSelect,alreadyRead,onToggleRead}){
  const sections=[
    {id:'ritmodna',     icon:'🧬',title:'RITMO DNA',     sub:'Stil · Chemie · Tier-Matching · Levels'},
    {id:'spielstile',   icon:'🎭',title:'Spielstile',    sub:'Die 6 Padel-Personalities'},
    {id:'angaben',      icon:'🎯',title:'Aufschlag',     sub:'Reihenfolge, Position & Strategie'},
    {id:'aufstellungen',icon:'👥',title:'Aufstellungen', sub:'Netz, Hinten, Verteidigung, Angriff'},
    {id:'haende',       icon:'🤝',title:'Hand-Seiten',   sub:'Links-/Rechtshänder am Court'},
    {id:'schlagwahl',   icon:'🎾',title:'Schlagwahl',    sub:'Wann welche Schlagart?'},
    {id:'schlaeger',    icon:'🏓',title:'Schläger',      sub:'Rund, Diamant, Tropfen — Materialkunde'},
    {id:'baelle',       icon:'🟡',title:'Bälle',         sub:'Tennis vs Padel — die Unterschiede'},
  ];
  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>
      <div style={{padding:'0 22px 22px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <JourneyIcon size={32}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:T.t1,fontSize:26,fontWeight:800,letterSpacing:-.3}}>Journey</div>
            <div style={{color:T.t2,fontSize:14,marginTop:2,fontWeight:400}}>
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
            style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
              padding:'14px 16px',display:'flex',alignItems:'center',gap:14,
              cursor:'pointer',color:T.t1,textAlign:'left',
              animationDelay:`${i*40}ms`,transition:'background .15s, border-color .15s'}}
            onPointerDown={e=>e.currentTarget.style.background=T.card2}
            onPointerUp={e=>e.currentTarget.style.background=T.card}
            onPointerLeave={e=>e.currentTarget.style.background=T.card}>
            <div style={{fontSize:24,width:32,textAlign:'center'}}>{s.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:T.t1,fontSize:15,fontWeight:700,marginBottom:2}}>{s.title}</div>
              <div style={{color:T.t3,fontSize:11,fontWeight:500}}>{s.sub}</div>
            </div>
            <div style={{color:T.t3,fontSize:18,fontWeight:600,width:16,textAlign:'center'}}>›</div>
          </button>
        ))}
      </div>
      <MatchBar onHome={onHome}/>
    </div>
  );
}

const J_BACK={backIcon:<JourneyIcon size={18}/>};

/* ── JourneySpielstileList — Overview of 6 styles ──────────────── */
function JourneySpielstileList({onBack,onHome,onSelect}){
  const order=['chico','toro','individuoso','muro','fantasma','motor'];
  const[imgErr,setImgErr]=useState({});

  return(
    <div style={{height:'100dvh',background:T.bg,display:'flex',flexDirection:'column',
      paddingTop:'calc(env(safe-area-inset-top,0px) + 60px)',position:'relative',overflow:'hidden'}}>
      <div style={{padding:'0 22px 8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <div style={{fontSize:32,width:42,textAlign:'center'}}>🎭</div>
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
              style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
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
                  <div style={{color:s.accent,fontSize:14,fontWeight:900,letterSpacing:-.2}}>
                    {s.name}
                  </div>
                  <div style={{color:T.t3,fontSize:10,fontWeight:600,letterSpacing:.5,
                    textTransform:'uppercase'}}>{s.subtitle}</div>
                </div>
                <div style={{color:T.t2,fontSize:11,lineHeight:1.4,fontStyle:'italic'}}>
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
      icon={style.symbol}
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
      <div style={{color:style.accent,fontSize:14,fontWeight:600,fontStyle:'italic',
        marginBottom:14,lineHeight:1.4}}>
        „{style.tagline}"
      </div>

      {/* Description */}
      <div style={{color:T.t2,fontSize:14,lineHeight:1.6,marginBottom:18}}>
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
            borderRadius:20,color:'white',fontSize:11,fontWeight:700,letterSpacing:.5}}>
            {k}
          </div>
        ))}
      </div>

      {/* Shots */}
      <SectionTitle accent={style.accent}>Typische Shots</SectionTitle>
      <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:18}}>
        {style.shots.map(sh=>(
          <div key={sh} style={{padding:'4px 10px',background:T.card,
            border:`1px solid ${T.border}`,borderRadius:14,
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
        borderRadius:12,padding:10,cursor:'pointer',textAlign:'left',
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
  {id:'counter', name:'Counter', subtitle:'Gegensatz Matching',symbol:'⚡',
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
      icon="🧬"
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

      <div style={{color:T.t2,fontSize:14,lineHeight:1.6,marginBottom:22}}>
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
          borderRadius:12,padding:'14px 16px',marginBottom:10,
          display:'flex',gap:14,alignItems:'flex-start'}}>
          <div style={{width:42,height:42,borderRadius:'50%',flexShrink:0,
            background:`${m.color}22`,border:`1.5px solid ${m.color}`,
            display:'flex',alignItems:'center',justifyContent:'center',
            color:m.color,fontSize:22,fontWeight:900}}>{m.symbol}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:m.color,fontSize:14,fontWeight:900,letterSpacing:-.2,
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
          borderRadius:12,padding:'12px 16px',marginBottom:8,
          display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:36,height:36,borderRadius:'50%',flexShrink:0,
            background:t.color,color:'white',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:14,fontWeight:900,letterSpacing:-.5}}>{t.id}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:2}}>
              <div style={{color:t.color,fontSize:13,fontWeight:900,letterSpacing:-.2}}>
                {t.name}
              </div>
              <div style={{color:T.t3,fontSize:10,fontWeight:600,
                textTransform:'uppercase',letterSpacing:.5}}>{t.subtitle}</div>
            </div>
            <div style={{color:T.t2,fontSize:11,lineHeight:1.4,marginBottom:3}}>{t.desc}</div>
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
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
        overflow:'hidden',marginBottom:14}}>
        {PLAYER_LEVELS.map((lv,i)=>(
          <div key={lv.id} style={{display:'flex',alignItems:'center',gap:12,
            padding:'12px 14px',borderTop:i>0?`1px solid ${T.sep}`:'none'}}>
            <div style={{width:44,height:36,borderRadius:6,flexShrink:0,
              background:lv.color,color:'white',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              gap:0}}>
              <div style={{fontSize:14,fontWeight:900,letterSpacing:-.5,lineHeight:1}}>{lv.id}</div>
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
      <div style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,
        padding:'12px 14px',marginBottom:22,color:T.t2,fontSize:12,lineHeight:1.6}}>
        <span style={{color:T.t1,fontWeight:700}}>Warum?</span> Je größer die Level-Differenz,
        desto höher die Gefahr von Dominanz und desto stärker leidet die Chemie. Spieler:innen
        auf gleichem Niveau erleben mehr Vertrauen und Impact.
      </div>

      {/* 4. EXAMPLES */}
      <SectionTitle accent={T.o}>Beispiele</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
        {/* Matching example */}
        <div style={{background:T.card,border:`1px solid #1A875440`,borderRadius:12,
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
            <div style={{color:T.t3,fontSize:14}}>+</div>
            <div style={{padding:'5px 11px',background:'#1E8449',color:'white',
              borderRadius:6,fontSize:11,fontWeight:800,letterSpacing:.5}}>MURO L3</div>
          </div>
          <div style={{color:T.t2,fontSize:12,lineHeight:1.5}}>
            Elite Synergy. Perfekte Balance zwischen Druck und Absicherung.
          </div>
        </div>

        {/* Counter example */}
        <div style={{background:T.card,border:`1px solid #3498DB40`,borderRadius:12,
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
        <div style={{background:T.card,border:`1px solid #F39C1240`,borderRadius:12,
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
            <div style={{color:T.t3,fontSize:14}}>+</div>
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
              <div style={{color:T.t1,fontSize:14,fontWeight:800,marginBottom:3}}>{step.title}</div>
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
    <RulesDetailLayout icon="🎯" title="Aufschlag"
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
    <RulesDetailLayout icon="👥" title="Aufstellungen"
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
    <RulesDetailLayout icon="🤝" title="Hand-Seiten"
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
    <RulesDetailLayout icon="🎾" title="Schlagwahl"
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
    <RulesDetailLayout icon="🏓" title="Schläger"
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
    <RulesDetailLayout icon="🟡" title="Bälle"
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
  const[viewClubId,setViewClubId]=useState(null);
  const[viewBookingId,setViewBookingId]=useState(null);
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
  const[tourney,setTourney]=useState(()=>lsGet('ritmo_tourney',null));
  const[ringId,setRingId]=useState(()=>lsGet('ritmo_ring','soft'));
  const[inputMode,setInputMode]=useState(()=>lsGet('ritmo_input','smartphone'));
  const[voiceOn,setVoiceOn]=useState(()=>lsGet('ritmo_voice',false));
  const[voiceBaseUrl,setVoiceBaseUrl]=useState(()=>lsGet('ritmo_voice_url',''));
  const[theme,setTheme]=useState(()=>lsGet('ritmo_theme','dark'));

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
        if(curr==='splash'||curr==='login'||curr==='register'||curr==='verify-email'
          ||curr==='welcome'||curr==='home'){
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
  useEffect(()=>{if(tourney===null){try{localStorage.removeItem('ritmo_tourney');}catch(e){}}else lsSet('ritmo_tourney',tourney);},[tourney]);
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
    else if(t==='live') setScr('live');
    else if(t==='settings') setScr('settings');
  };

  const[tourneyEditMode,setTourneyEditMode]=useState(false);

  const startTourney=(t)=>{setTourney(t);setScr('tournament-play');setTourneyEditMode(false);};
  const newTourney=()=>{setTourney(null);setScr('tournament-setup');setTourneyEditMode(false);};

  const editTourney=()=>{setTourneyEditMode(true);setScr('tournament-setup');};
  const saveTourneyEdit=(updates)=>{
    setTourney(prev=>{
      if(!prev)return prev;
      return {...prev,
        players:updates.players,
        format:updates.format,
        winMode:updates.winMode,
        numCourts:updates.numCourts,
        roundDurationMin:updates.roundDurationMin,
      };
    });
    setTourneyEditMode(false);
    setScr('tournament-play');
  };

  const deleteMatch=()=>{
    dBo3({type:'RESET'});
    dAm({type:'RESET',limit:cfg.amLimit??21});
  };
  const deleteTourney=()=>setTourney(null);

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

    {/* App-level KeyCapture — never unmounts when Match re-renders (e.g. bigScreen toggle).
        Active only on Match screen with ring/presenter input mode. */}
    <KeyCapture
      enabled={scr==='match'&&(inputMode==='ring'||inputMode==='presenter')}
      onKey={onMatchKey}/>

    {scr==='splash'&&<Splash onDone={()=>{
      // ?join=PIN aus QR-Scan: direkt zur Join-Maske, auch ohne Login
      // (Auth-Pflicht wäre Reibung für den eingeladenen Spieler).
      if(joinPinFromUrl) return nav('remote');
      if(!loggedIn) return nav('login');
      if(!onboarded) return nav('welcome');
      return nav('home');
    }}/>}
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
    {scr==='home'&&<Home nav={nav} activeTab={activeTab} setActiveTab={handleTab} profile={profile} onboarded={onboarded}/>}
    {scr==='profile'&&<Profile profile={profile} setProfile={setProfile}
      onHome={goHome} currentUid={currentUid}
      onOpenRitmoDNA={()=>setScr('profile-ritmodna')}
      onOpenFollowers={()=>{ if(currentUid){ setViewPlayerId(currentUid); setScr('public-profile'); } }}
      onOpenFollowing={()=>{ if(currentUid){ setViewPlayerId(currentUid); setScr('public-profile'); } }}
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
    {scr==='rules'&&<RulesLanding onHome={goHome}
      onContinue={()=>setScr('rules-overview')}
      onMarkRead={()=>{setRulesRead(true);setScr('rules-overview');}}
      alreadyRead={rulesRead}/>}
    {scr==='rules-overview'&&<Rules onHome={goHome}
      onSelect={(id)=>setScr(`rules-${id}`)}
      alreadyRead={rulesRead}
      onToggleRead={()=>setRulesRead(r=>!r)}/>}
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
      onToggleRead={()=>setJourneyRead(r=>!r)}/>}
    {scr==='journey-spielstile'&&<JourneySpielstileList
      onBack={()=>setScr('journey-overview')}
      onHome={goHome}
      onSelect={(id)=>setScr(`journey-spielstil-${id}`)}/>}
    {scr.startsWith('journey-spielstil-')&&(()=>{
      const id=scr.slice('journey-spielstil-'.length);
      const order=['chico','toro','individuoso','muro','fantasma','motor'];
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
    {scr==='live'&&<Live nav={nav} hasMatch={hasMatch} hasTourney={hasTourney}
      tourneyData={tourney} matchCfg={cfg}
      activeTab={activeTab} setActiveTab={handleTab}
      onDeleteMatch={deleteMatch} onDeleteTourney={deleteTourney}
      joinedSession={joinedSession}
      onLeaveJoined={()=>setJoinedSession(null)}/>}
    {scr==='settings'&&<Settings onHome={goHome} nav={nav}
      activeTab={activeTab} setActiveTab={handleTab}/>}
    {scr==='settings-steuerung'&&<SettingsSteuerung
      onBack={()=>setScr('settings')} onHome={goHome}
      inputMode={inputMode} setInputMode={setInputMode}
      voiceOn={voiceOn} setVoiceOn={setVoiceOn}
      ringId={ringId} setRingId={setRingId}/>}
    {scr==='settings-anpassung'&&<SettingsAnpassung
      onBack={()=>setScr('settings')} onHome={goHome}
      theme={theme} setTheme={setTheme}/>}
    {scr==='settings-privatsphaere'&&<SettingsComingSoon
      onBack={()=>setScr('settings')} onHome={goHome}
      title="Privatsphäre"
      desc="Wer dich findet · wer deine Stats sieht."
      icon={<EyeIcon size={22} color="currentColor"/>}
      bullets={[
        'Profil-Sichtbarkeit (öffentlich / nur Freunde / privat)',
        'RITMO DNA + Stats freigeben oder verstecken',
        'Match-Historie als Privat markieren',
        'Datenexport und -löschung gemäß DSGVO',
      ]}/>}
    {scr==='settings-benachrichtigungen'&&<SettingsComingSoon
      onBack={()=>setScr('settings')} onHome={goHome}
      title="Benachrichtigungen"
      desc="Match-Reminder, Turnier-Alerts, Chats."
      icon={<BellIcon size={22} color="currentColor"/>}
      bullets={[
        'Push-Benachrichtigungen aktivieren',
        'Match-Reminder (1 Stunde · 15 Min vorher)',
        'Turnier-Updates und Ready-Checks',
        'Chat- und Community-Mitteilungen',
      ]}/>}
    {scr==='settings-sicherheit'&&<SettingsComingSoon
      onBack={()=>setScr('settings')} onHome={goHome}
      title="Sicherheit"
      desc="Passwort, Sessions, Zwei-Faktor."
      icon={<LockIcon size={22} color="currentColor"/>}
      bullets={[
        'Passwort ändern',
        'Aktive Sessions einsehen und beenden',
        'Zwei-Faktor-Authentifizierung (TOTP)',
        'Login-Aktivitäts-Log',
      ]}/>}
    {scr==='settings-konto'&&<SettingsKonto
      onBack={()=>setScr('settings')} onHome={goHome}
      onLogout={async()=>{
        try{await auth.signOut();}catch(e){}
        setLoggedIn(false);
        nav('login');
      }}/>}
    {scr==='ritmopost'&&<RitmoPost onHome={goHome} profile={profile}
      onOpenInvites={()=>setScr('invites')}
      onOpenBookings={()=>setScr('bookings')}/>}

    {/* ─── Social Layer Screens ──────────────────────────────────── */}
    {scr==='player-search'&&<PlayerSearch onHome={goHome}
      onOpenPlayer={(uid)=>{ setViewPlayerId(uid); setScr('public-profile'); }}/>}
    {scr==='public-profile'&&viewPlayerId&&<PublicProfile
      userId={viewPlayerId} currentUid={currentUid}
      onHome={goHome} onBack={()=>setScr('player-search')}/>}
    {scr==='clubs'&&<Clubs onHome={goHome}
      onOpenClub={(id)=>{ setViewClubId(id); setScr('club-detail'); }}
      onCreateClub={()=>setScr('club-create')}/>}
    {scr==='club-create'&&<ClubCreate onHome={goHome}
      onDone={(club)=>{ setViewClubId(club.id); setScr('club-detail'); }}
      onCancel={()=>setScr('clubs')}/>}
    {scr==='club-detail'&&viewClubId&&<ClubDetail clubId={viewClubId}
      currentUid={currentUid} onHome={goHome} onBack={()=>setScr('clubs')}
      onOpenPlayer={(uid)=>{ setViewPlayerId(uid); setScr('public-profile'); }}/>}
    {scr==='bookings'&&<Bookings onHome={goHome}
      onOpenBooking={(id)=>{ setViewBookingId(id); setScr('booking-detail'); }}
      onCreateBooking={()=>setScr('booking-create')}/>}
    {scr==='booking-create'&&<BookingCreate onHome={goHome}
      onDone={(b)=>{ setViewBookingId(b.id); setScr('booking-detail'); }}
      onCancel={()=>setScr('bookings')}/>}
    {scr==='booking-detail'&&viewBookingId&&<BookingDetail matchId={viewBookingId}
      currentUid={currentUid} onHome={goHome} onBack={()=>setScr('bookings')}
      onInvite={(id)=>{ setViewBookingId(id); setScr('booking-invite'); }}/>}
    {scr==='booking-invite'&&viewBookingId&&<BookingInvite matchId={viewBookingId}
      onHome={goHome} onDone={()=>setScr('booking-detail')}/>}
    {scr==='invites'&&<InvitesScreen onHome={goHome}
      onOpenBooking={(id)=>{ setViewBookingId(id); setScr('booking-detail'); }}/>}
    {scr==='single-setup'&&<SingleSetup nav={nav} onHome={goHome} cfg={cfg} setCfg={setCfg} profile={profile}/>}
    {scr==='match'&&<Match cfg={cfg} setCfg={setCfg} bo3={bo3} dBo3={dBo3} am={am} dAm={dAm}
      onHome={goHome} inputMode={inputMode} ringId={ringId}
      matchKeyRef={matchKeyRef} theme={theme}
      voiceOn={voiceOn} voiceBaseUrl={voiceBaseUrl}
      onMatchLogged={onMatchLogged}/>}
    {scr==='tournament-setup'&&<TournamentSetup nav={nav} onHome={goHome}
      onStart={startTourney} onSave={saveTourneyEdit}
      saved={tourney} isEdit={tourneyEditMode&&!!tourney}
      profile={profile}
      onCreateOnline={(pin)=>{setOnlinePin(pin);setScr('online-lobby');}}/>}
    {scr==='online-lobby'&&onlinePin&&<OnlineTournamentLobby
      pin={onlinePin}
      onHome={goHome}
      onCancel={()=>{setOnlinePin(null);setScr('tournament-setup');}}
      onStart={(tourneyState)=>{
        setTourney(tourneyState);
        setOnlinePin(null);
        setScr('tournament-play');
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

    {/* First-launch disclaimer — liegt über allen Screens, blockiert
        Interaktion bis OK gedrückt wurde */}
    {!welcomeSeen&&<WelcomeNotice onConfirm={()=>setWelcomeSeen(true)}/>}

    {/* Verified-Landing nach Email-Verify (?verified=1 in der URL).
        Statisches Overlay ohne Buttons — User soll den Tab manuell
        schließen und sich neu einloggen. */}
    {verifyLanding&&<VerifiedLanding/>}
  </>);
}
