/* ═══════════════════════════════════════════════════════════════
   GAME LOGIC — pure reducers for Best-of-3 + Americano.

   Both reducers are pure JS — no React, no side effects. Snapshot
   semantics: every action pushes the prior state onto `s.hist` so
   the UI can offer single-step UNDO without reverse-replay logic.

   bo3R handles full padel scoring (points → games → sets) with
   tiebreak at 6-6 and an optional "Golden Point" after N deuces.
   amR is point-based to a configurable limit (lim<=0 = ∞ mode).
═══════════════════════════════════════════════════════════════ */

/* ── Best-of-3 ────────────────────────────────────────────────── */

export const B0 = {
  pA:0,pB:0,gA:0,gB:0,sA:0,sB:0,tb:false,tA:0,tB:0,
  winner:null,sets:[],hist:[],deuces:0,
};

export const PL = ['0','15','30','40'];

export function ptD(a,b,gpFlag){
  if(a<3||b<3) return [PL[Math.min(a,3)],PL[Math.min(b,3)]];
  if(a===b) return gpFlag?['Golden Point','Golden Point']:['Einstand','Einstand'];
  return a>b ? ['Vorteil','—'] : ['—','Vorteil'];
}

export function wG(s,t){
  const nA=s.gA+(t==='A'?1:0), nB=s.gB+(t==='B'?1:0);
  const sw=(nA>=6&&nA-nB>=2)||nA===7?'A':(nB>=6&&nB-nA>=2)||nB===7?'B':null;
  if(sw){
    const sA=s.sA+(sw==='A'?1:0), sB=s.sB+(sw==='B'?1:0);
    return {...s,pA:0,pB:0,gA:0,gB:0,sA,sB,tb:false,tA:0,tB:0,deuces:0,
      sets:[...s.sets,{gA:nA,gB:nB,w:sw}],winner:sA===2?'A':sB===2?'B':null};
  }
  if(nA===6&&nB===6) return {...s,pA:0,pB:0,gA:nA,gB:nB,tb:true,deuces:0};
  return {...s,pA:0,pB:0,gA:nA,gB:nB,deuces:0};
}

export function bo3R(s,a){
  if(a.type==='_R') return a.s;
  if(a.type==='UNDO'){if(!s.hist.length)return s; return {...s.hist[s.hist.length-1],hist:s.hist.slice(0,-1)};}
  if(a.type==='RESET') return B0;
  if(s.winner) return s;
  const {hist,...snap}=s; const h=[...hist,{...snap,_t:a.t}];
  if(a.type==='PT'){
    if(s.tb){
      const nA=s.tA+(a.t==='A'?1:0), nB=s.tB+(a.t==='B'?1:0);
      const w=nA>=7&&nA-nB>=2?'A':nB>=7&&nB-nA>=2?'B':null;
      if(w) return {...wG({...s,tA:nA,tB:nB},w),hist:h};
      return {...s,tA:nA,tB:nB,hist:h};
    }
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
