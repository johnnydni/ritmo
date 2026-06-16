/* ═══════════════════════════════════════════════════════════════
   GAME LOGIC — pure reducers for Best-of-3 + Americano.

   Both reducers are pure JS — no React, no side effects. Snapshot
   semantics: every action pushes the prior state onto `s.hist` so
   the UI can offer single-step UNDO without reverse-replay logic.

   bo3R handles full padel scoring (points → games → sets). Its rules
   are CONFIGURABLE via an optional `s.cfg` block:

     cfg.setsToWin   sets needed to win the match        (default 2)
     cfg.gamesPerSet games needed to win a set           (default 6)
     cfg.tbAt        games-each that triggers a set TB    (default 6)
     cfg.tbPoints    points to win a tiebreak            (default 7)
     cfg.noDecider   true → max 2 sets; if 1-1 compare    (default false)
                     total games, then a match-TB decides
     cfg.goldenPointAfter  see PT handler (passed per-action)

   When `s.cfg` is absent the DEFCFG values apply, which reproduce the
   classic Bo3 behaviour (6-game sets, tiebreak at 6-6, best of 3) —
   so the existing Match screen, which never sets cfg, is unchanged.

   makeBo3(cfg) seeds bespoke cfg blocks for custom formats
   (single-set / two-set-no-decider / short-set / best-of-3).

   amR is point-based to a configurable limit (lim<=0 = ∞ mode).
═══════════════════════════════════════════════════════════════ */

/* ── Best-of-3 ────────────────────────────────────────────────── */

// Default rule set — identical to the historic hard-coded Bo3.
export const DEFCFG = {setsToWin:2,gamesPerSet:6,tbAt:6,tbPoints:7,noDecider:false};

export const B0 = {
  pA:0,pB:0,gA:0,gB:0,sA:0,sB:0,tb:false,tA:0,tB:0,
  winner:null,sets:[],hist:[],deuces:0,matchTb:false,
};

// Seed a Bo3 state with a specific format cfg.
export function makeBo3(cfg){ return {...B0,cfg:{...DEFCFG,...(cfg||{})}}; }

export const PL = ['0','15','30','40'];

export function ptD(a,b,gpFlag){
  if(a<3||b<3) return [PL[Math.min(a,3)],PL[Math.min(b,3)]];
  if(a===b) return gpFlag?['Golden Point','Golden Point']:['Einstand','Einstand'];
  return a>b ? ['Vorteil','—'] : ['—','Vorteil'];
}

// Close the current set whose final games are (nA,nB). Updates the
// set list + set counts and resolves the match winner per cfg —
// including the no-decider total-games comparison and the flag that
// a match-tiebreak is required (matchTb).
function finishSet(s,nA,nB){
  const c=s.cfg||DEFCFG;
  const w=nA>nB?'A':'B';
  const sA=s.sA+(w==='A'?1:0), sB=s.sB+(w==='B'?1:0);
  const sets=[...s.sets,{gA:nA,gB:nB,w}];
  let winner=null, matchTb=false;
  if(c.noDecider){
    if(sets.length>=2){
      if(sA>sB) winner='A';
      else if(sB>sA) winner='B';
      else{ // 1-1 in sets → compare total games won across both sets
        const tgA=sets.reduce((x,st)=>x+st.gA,0), tgB=sets.reduce((x,st)=>x+st.gB,0);
        if(tgA>tgB) winner='A';
        else if(tgB>tgA) winner='B';
        else matchTb=true; // still tied → 7-point match tiebreak on the spot
      }
    }
  } else {
    winner = sA>=c.setsToWin?'A':sB>=c.setsToWin?'B':null;
  }
  return {...s,pA:0,pB:0,gA:0,gB:0,tb:false,tA:0,tB:0,deuces:0,sA,sB,sets,winner,matchTb};
}

// A regular game was won by team t. Decides set-win / tiebreak-trigger
// / continue, honouring cfg.gamesPerSet + cfg.tbAt.
export function wG(s,t){
  const c=s.cfg||DEFCFG, G=c.gamesPerSet, TB=c.tbAt;
  const nA=s.gA+(t==='A'?1:0), nB=s.gB+(t==='B'?1:0);
  const aSet=(nA>=G&&nA-nB>=2)||nA===G+1;
  const bSet=(nB>=G&&nB-nA>=2)||nB===G+1;
  if(aSet||bSet) return finishSet(s,nA,nB);
  if(nA===TB&&nB===TB) return {...s,pA:0,pB:0,gA:nA,gB:nB,tb:true,deuces:0};
  return {...s,pA:0,pB:0,gA:nA,gB:nB,deuces:0};
}

export function bo3R(s,a){
  if(a.type==='_R') return a.s;
  if(a.type==='UNDO'){if(!s.hist.length)return s; return {...s.hist[s.hist.length-1],hist:s.hist.slice(0,-1)};}
  if(a.type==='RESET') return a.cfg?makeBo3(a.cfg):B0;
  if(s.winner) return s;
  const {hist,...snap}=s; const h=[...hist,{...snap,_t:a.t}];
  const c=s.cfg||DEFCFG;
  if(a.type==='PT'){
    // ── Match-tiebreak (no-decider format, 1-1 + equal games) ──
    // Reuses tA/tB as the match-TB point counters (the set TB is over).
    if(s.matchTb){
      const P=c.tbPoints||7;
      const nA=s.tA+(a.t==='A'?1:0), nB=s.tB+(a.t==='B'?1:0);
      const w=nA>=P&&nA-nB>=2?'A':nB>=P&&nB-nA>=2?'B':null;
      return {...s,tA:nA,tB:nB,winner:w,hist:h};
    }
    // ── Set-tiebreak ──
    if(s.tb){
      const P=c.tbPoints||7;
      const nA=s.tA+(a.t==='A'?1:0), nB=s.tB+(a.t==='B'?1:0);
      const w=nA>=P&&nA-nB>=2?'A':nB>=P&&nB-nA>=2?'B':null;
      if(w){
        // Tiebreak winner takes the set — bump their game then close.
        const fA=s.gA+(w==='A'?1:0), fB=s.gB+(w==='B'?1:0);
        return {...finishSet({...s,tA:nA,tB:nB},fA,fB),hist:h};
      }
      return {...s,tA:nA,tB:nB,hist:h};
    }
    // ── Regular point ──
    let pA=s.pA+(a.t==='A'?1:0), pB=s.pB+(a.t==='B'?1:0), gw=null;
    const wasDeuce=s.pA>=3&&s.pB>=3&&s.pA===s.pB;
    const newIsDeuce=pA>=3&&pB>=3&&pA===pB;
    let deuces=s.deuces||0;
    if(newIsDeuce&&!wasDeuce) deuces++;
    // Golden Point: active when deuces > goldenPointAfter (null/undefined = disabled)
    const gpActive=a.goldenPointAfter!=null&&a.goldenPointAfter>=0
      &&deuces>a.goldenPointAfter;
    if(pA>=3&&pB>=3){
      if(gpActive&&wasDeuce){
        // GP: first scorer from deuce wins immediately
        if(pA>pB) gw='A'; else if(pB>pA) gw='B';
      } else {
        if(pA-pB>=2) gw='A'; else if(pB-pA>=2) gw='B';
      }
    } else if(pA>=4) gw='A'; else if(pB>=4) gw='B';
    if(gw) return {...wG(s,gw),hist:h};
    return {...s,pA,pB,deuces,hist:h};
  }
  return s;
}

/* ── Americano (Point-Race) ───────────────────────────────────── */

export const A0 = {pA:0,pB:0,winner:null,limit:21,hist:[]};

export function makeAm(limit){ return {...A0,limit:limit??21}; }

export function amR(s,a){
  if(a.type==='_R') return a.s;
  if(a.type==='UNDO'){if(!s.hist.length)return s; return {...s.hist[s.hist.length-1],hist:s.hist.slice(0,-1)};}
  if(a.type==='RESET') return {...A0,limit:a.limit??21};
  if(a.type==='TIME_UP'){
    if(s.winner) return s;
    if(s.pA===s.pB) return {...s,winner:'draw'};
    return {...s,winner:s.pA>s.pB?'A':'B'};
  }
  if(s.winner) return s;
  const h=[...s.hist,{pA:s.pA,pB:s.pB,winner:null,_t:a.t}];
  if(a.type==='PT'){
    const pA=s.pA+(a.t==='A'?1:0), pB=s.pB+(a.t==='B'?1:0);
    // Limit nimmt den Wert aus der Action wenn dabei (kommt aus
    // cfg.amLimit, ist die Source-of-Truth). Sonst Fallback auf
    // den im State persistierten Wert. lim<=0 = ∞ Mode: kein Winner.
    const lim=a.limit!=null?a.limit:(s.limit??21);
    let winner=null;
    if(lim>0&&pA+pB>=lim) winner=pA>pB?'A':pB>pA?'B':'draw';
    return {...s,pA,pB,winner,limit:lim,hist:h};
  }
  return s;
}
