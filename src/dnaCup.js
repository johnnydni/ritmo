/* ═══════════════════════════════════════════════════════════════
   RITMO DNA CUP — pure logic for the structured, multi-phase
   "Founders Edition" tournament format.

   Everything here is side-effect-free JS (no React). The DnaCup
   screen in App.jsx is a thin shell over these functions:

     • event + schedule + format + tier constants
     • lobbyStats / classifyTier   → match-tier classification
     • genDnaGroupRound            → Mexicano round + sit-out + tier
     • dnaLeaderboard              → group standings (points + tier
                                     bonus + CEIL-median sit-out comp.)
     • dnaQualify                  → Top-14 KO / Top-2 bye / Ehren split
     • bracket builders + advanceDnaCup  → auto-advancing KO + Ehren
     • validateCourts              → never two courts for one player

   Flow (state machine):
     setup → group → qualify → ko → completed
   The Ehren-Bracket runs in parallel with the KO from the semis on.
═══════════════════════════════════════════════════════════════ */

import { genAmericanoRound, genMexicanoRound } from './tournament.js';

/* ── Event basics ─────────────────────────────────────────────── */

// Director PIN — the cup can only be opened/started after entering it.
// Client-side gate only (visible in the bundle): keeps the console out
// of casual reach at the event, not a real secret.
export const DNA_CUP_PIN = '1862';

export const DNA_CUP_EVENT = {
  id:'ritmo-dna-cup-founders',
  name:'RITMO × Padel Haus · Summer Sunset Special',
  subtitle:'RITMO DNA Cup · Founders Edition',
  venue:'Padel Haus · Großmehring',
  date:'2026-07-18',
  doors:'17:30',
  courts:3,
  capacity:22,
  minPlayers:12,
};

// Public-facing schedule (mirrors the event detail page). `phase`
// links a row to the live tournament status for the on-schedule chip.
export const DNA_SCHEDULE = [
  {time:'17:30', phase:'setup',      title:'Doors open · Check-in',                 courts:'—'},
  {time:'18:15', phase:'group',      title:'Gruppenphase · Mexicano · Open Points', courts:'1 · 2 · 3'},
  {time:'19:30', phase:'qualify',    title:'Qualifikation · Top 14 / Ehren',        courts:'—'},
  {time:'19:45', phase:'ko',         title:'Knock-Out · 12 → 6',                    courts:'1 · 2 · 3'},
  {time:'20:45', phase:'ko',         title:'Halbfinale 8 → 4  ·  Ehren-HF',         courts:'1 · 2 · 3'},
  {time:'22:00', phase:'ko',         title:'Ehren-Finale',                          courts:'3'},
  {time:'22:30', phase:'ko',         title:'RITMO Grande Finale',                   courts:'3 · Flutlicht'},
  {time:'23:00', phase:'completed',  title:'Siegerehrung · Drop-Reveal · After-Party', courts:'—'},
];

/* ── Match formats + scoring rules ────────────────────────────── */
// type 'points' → americano (amR). type 'sets' → bo3R-cfg.
export const FORMATS = {
  'open-points':        {type:'points', limit:0, label:'Open Points',
                         short:'Punkte · Timer', rules:'Punkte sammeln über die Rundenzeit. Kein Satz, kein Game.'},
  'single-set':         {type:'sets', setsToWin:1, gamesPerSet:6, tbAt:5, tbPoints:7,
                         label:'1 Satz bis 6', short:'1 Satz · TB 5:5', rules:'Ein Satz bis 6 Games. Tiebreak bei 5:5.'},
  'two-sets-no-decider':{type:'sets', setsToWin:2, gamesPerSet:6, tbAt:5, tbPoints:7, noDecider:true,
                         label:'2 Sätze (Hin + Rück)', short:'2 Sätze · kein Decider',
                         rules:'Zwei Sätze bis 6 (TB 5:5). Bei 1:1 entscheiden die Gesamt-Games, dann 7-Punkte-Tiebreak.'},
  'best-of-three-sets': {type:'sets', setsToWin:2, gamesPerSet:6, tbAt:5, tbPoints:7,
                         label:'Best of 3 Sätze', short:'Best of 3 · TB 5:5', rules:'Best of 3 Sätze bis 6 Games. Tiebreak bei 5:5.'},
  'short-set':          {type:'sets', setsToWin:1, gamesPerSet:4, tbAt:3, tbPoints:7,
                         label:'Short Set bis 4', short:'Short Set · TB 3:3', rules:'Ein kurzer Satz bis 4 Games. Tiebreak bei 3:3.'},
};

// Which format each stage uses.
export const STAGE_FORMAT = {
  group:      'open-points',
  ko:         'single-set',
  semi:       'two-sets-no-decider',
  final:      'best-of-three-sets',
  ehrenSemi:  'short-set',
  ehrenFinal: 'single-set',
};

/* ── Match-tier classification ────────────────────────────────── */
export const TIER_BONUS = {S:4,A:3,B:2,C:1,X:0};
export const TIER_META = {
  S:{name:'Showmatch', color:'#FF375F'},
  A:{name:'Top-Tier',  color:'#FF9500'},
  B:{name:'Balanced',  color:'#0A84FF'},
  C:{name:'Grinder',   color:'#30D158'},
  X:{name:'Warm-up',   color:'#8E8E93'},
};

// Mean + population standard deviation of the rated players.
export function lobbyStats(ratings){
  const r=(ratings||[]).filter(x=>typeof x==='number'&&!isNaN(x));
  if(!r.length) return {avg:0,stdev:0,n:0};
  const avg=r.reduce((a,b)=>a+b,0)/r.length;
  const variance=r.reduce((a,b)=>a+(b-avg)**2,0)/r.length;
  return {avg,stdev:Math.sqrt(variance),n:r.length};
}

// Tier for the 4 players of a match relative to the lobby.
//   tierDelta = (matchAvg − lobbyAvg) / lobbyStdev
//   S ≥ +1.25 · A ≥ +0.50 · B (−0.50,+0.50) · C ≤ −0.50
//   X = round 1 (warm-up) or fewer than 3 rated players.
export function classifyTier(matchRatings, lobby, roundIndex){
  const rated=(matchRatings||[]).filter(x=>typeof x==='number'&&!isNaN(x));
  if(roundIndex===0 || rated.length<3) return 'X';
  if(!lobby||!lobby.stdev) return 'B';
  const matchAvg=rated.reduce((a,b)=>a+b,0)/rated.length;
  const d=(matchAvg-lobby.avg)/lobby.stdev;
  if(d>=1.25) return 'S';
  if(d>=0.5)  return 'A';
  if(d>-0.5)  return 'B';
  return 'C';
}

/* ── Group phase: round generation ────────────────────────────── */
// Round 0 = random (warm-up, partner rotation). Round ≥1 = Mexicano
// (standings-based 1+4 vs 2+3). Each court gets a `tier` badge.
// `players` = checked-in players [{id,name,color,rating,style}].
export function genDnaGroupRound(players, history, numCourts, roundIndex){
  const ids=players.map(p=>p.id);
  const ratingOf=id=>{const p=players.find(x=>x.id===id);return p?p.rating:undefined;};
  const lobby=lobbyStats(players.map(p=>p.rating));
  let r;
  if(roundIndex===0){
    r=genAmericanoRound(ids, history, numCourts);
  } else {
    const lb=dnaLeaderboard(players, history);
    r=genMexicanoRound(ids, lb.map(e=>({id:e.id,pts:e.totalPoints})), numCourts, history);
  }
  const courts=r.courts.map((c,i)=>{
    const ratings=[...(c.t1||[]),...(c.t2||[])].map(ratingOf);
    return {...c, court:i+1, tier:classifyTier(ratings,lobby,roundIndex), s1:null, s2:null, done:false};
  });
  return {courts, sitOut:r.sitOut||[]};
}

/* ── Group phase: leaderboard ─────────────────────────────────── */
// totalPoints = Σ match points + Σ tier-bonus (for WINS) + Σ sit-out
//               compensation (CEIL of that round's median score).
// Tiebreak order: totalPoints → head-to-head → opponent-avg-rating.
export function dnaLeaderboard(players, rounds){
  const stats={};
  players.forEach(p=>{stats[p.id]={
    id:p.id, name:p.name, color:p.color, rating:p.rating, style:p.style,
    points:0, tierBonus:0, sitOutBonus:0, played:0, sitOut:0, wins:0, losses:0,
    oppSum:0, oppN:0, h2h:{}, adjPts:p.adjPts||0,
  };});
  const ratingOf=id=>{const p=players.find(x=>x.id===id);return p?p.rating:undefined;};

  rounds.forEach(round=>{
    (round.courts||[]).forEach(m=>{
      if(!m.done) return;
      const bonus=TIER_BONUS[m.tier||'X']||0;
      const s1=m.s1??0, s2=m.s2??0;
      const t1win=s1>s2, t2win=s2>s1;
      const apply=(team,opp,mine,oppScore,won,otherWon)=>{
        (team||[]).forEach(pid=>{const st=stats[pid]; if(!st)return;
          st.points+=mine; st.played++;
          if(won){st.wins++; st.tierBonus+=bonus;} else if(otherWon){st.losses++;}
          (opp||[]).forEach(o=>{
            const orr=ratingOf(o); if(typeof orr==='number'&&!isNaN(orr)){st.oppSum+=orr;st.oppN++;}
            st.h2h[o]=(st.h2h[o]||0)+(won?1:otherWon?-1:0);
          });
        });
      };
      apply(m.t1,m.t2,s1,s2,t1win,t2win);
      apply(m.t2,m.t1,s2,s1,t2win,t1win);
    });
    (round.sitOut||[]).forEach(pid=>{if(stats[pid]) stats[pid].sitOut++;});
  });

  // Sit-out compensation: CEIL of the round's median player score, so
  // pausing players are not disadvantaged (per RITMO DNA Cup rules).
  rounds.forEach(round=>{
    if(!round.sitOut||!round.sitOut.length) return;
    const scores=[];
    (round.courts||[]).forEach(m=>{if(!m.done)return;
      (m.t1||[]).forEach(()=>scores.push(m.s1??0));
      (m.t2||[]).forEach(()=>scores.push(m.s2??0));});
    if(!scores.length) return;
    scores.sort((a,b)=>a-b);
    const mid=scores.length%2===0
      ?(scores[scores.length/2-1]+scores[scores.length/2])/2
      :scores[Math.floor(scores.length/2)];
    const comp=Math.ceil(mid);
    round.sitOut.forEach(pid=>{if(stats[pid]) stats[pid].sitOutBonus+=comp;});
  });

  const arr=Object.values(stats).map(s=>({
    ...s,
    oppAvg:s.oppN?s.oppSum/s.oppN:0,
    totalPoints:s.points+s.tierBonus+s.sitOutBonus+(s.adjPts||0),
  }));
  arr.sort((a,b)=>{
    if(b.totalPoints!==a.totalPoints) return b.totalPoints-a.totalPoints;
    const net=(a.h2h[b.id]||0); if(net) return net>0?-1:1; // a beat b net → a higher
    if(b.oppAvg!==a.oppAvg) return b.oppAvg-a.oppAvg;
    return 0;
  });
  arr.forEach((s,i)=>s.rank=i+1);
  return arr;
}

/* ── Qualification split ──────────────────────────────────────── */
// Top 14 → KO (Top 2 of those get a bye to the Halbfinale).
// Bottom 8 → Ehren-Bracket. Scales down for fewer check-ins:
//   mainCount = N≥22 ? 14 : floor(N·14/22), min 4.
export function dnaQualify(leaderboard){
  const N=leaderboard.length;
  let mainCount = N>=22?14:Math.max(4,Math.floor(N*14/22));
  if(mainCount>N) mainCount=N;
  if(mainCount%2!==0) mainCount--;           // keep even (whole teams)
  const main=leaderboard.slice(0,mainCount);
  const rest=leaderboard.slice(mainCount);
  let ehren=rest.slice(0,8).map(e=>e.id);
  if(ehren.length%2!==0) ehren=ehren.slice(0,ehren.length-1); // even for teams
  const seedRank={}; leaderboard.forEach(e=>{seedRank[e.id]=e.rank;});
  return {
    byes:  main.slice(0,2).map(e=>e.id),     // Top 2 → bye to Halbfinale
    ko:    main.slice(2).map(e=>e.id),        // seeds 3..mainCount → Knock-Out
    ehren,                                     // bottom up to 8 (even)
    mainIds: main.map(e=>e.id),
    seedRank,
  };
}

/* ── Team formation ───────────────────────────────────────────── */
// Balanced pairing of a seed-ordered id list: best + worst, etc.
export function pairBalanced(ids){
  const a=[...ids]; const teams=[]; let i=0,j=a.length-1;
  while(i<j){ teams.push([a[i],a[j]]); i++; j--; }
  if(i===j) teams.push([a[i]]);
  return teams;
}

let _mid=0;
function mkMatch(stage,label,court,team1,team2,format){
  _mid++;
  return {id:`${stage}-${court}-${_mid}`, stage, label, court,
    team1:team1||[], team2:team2||[], format,
    result:null, status:'pending'};
}
// Winning team's player ids for a completed match.
export function matchWinners(m){
  if(!m||!m.result) return [];
  return m.result.winner==='A'?(m.team1||[]):(m.team2||[]);
}

/* ── Bracket builders ─────────────────────────────────────────── */
// Pair a list of teams strongest-vs-weakest into matches. An odd
// team out gets a Freilos (auto-advances) so no team is ever dropped
// — keeps scaled-down fields valid; the canonical 22-field is even.
function pairTeamsIntoMatches(teams, stage, labelBase, courtFor){
  const matches=[]; let i=0,j=teams.length-1,n=1;
  while(i<j){
    matches.push(mkMatch(stage,`${labelBase} ${n}`, courtFor(n), teams[i], teams[j], STAGE_FORMAT[stage]));
    i++; j--; n++;
  }
  if(i===j){
    matches.push({...mkMatch(stage,`${labelBase} ${n} · Freilos`, courtFor(n), teams[i], [], STAGE_FORMAT[stage]),
      result:{winner:'A',bye:true}, status:'completed'});
  }
  return matches;
}
// KO Knock-Out: 12 ids → 6 balanced teams → 3 matches (one per court).
function buildKnockout(koIds){
  return pairTeamsIntoMatches(pairBalanced(koIds),'ko','Knock-Out', n=>((n-1)%3)+1);
}
// Halbfinale: 6 KO-winner ids + 2 byes → re-seed by group rank → 4
// teams → 2 matches on courts 2 + 3 (court 1 hosts the Ehren-HF).
function buildSemi(koWinnerIds, byeIds, seedRank){
  const all=[...byeIds,...koWinnerIds].sort((a,b)=>(seedRank[a]||99)-(seedRank[b]||99));
  return pairTeamsIntoMatches(pairBalanced(all),'semi','Halbfinale', n=>n%2===1?2:3);
}
// Grande Finale: the two surviving semi teams (stay paired) → Bo3.
function buildFinal(teamA, teamB){
  return mkMatch('final','RITMO Grande Finale', 3, teamA, teamB, STAGE_FORMAT.final);
}
// Ehren: bottom-8 ids → 4 balanced teams → 2 short-set semis (court 1).
function buildEhrenSemi(ehrenIds, seedRank){
  const sorted=[...ehrenIds].sort((a,b)=>(seedRank[a]||99)-(seedRank[b]||99));
  return pairTeamsIntoMatches(pairBalanced(sorted),'ehrenSemi','Ehren-Halbfinale', ()=>1);
}
function buildEhrenFinal(teamA, teamB){
  return mkMatch('ehrenFinal','Ehren-Finale', 3, teamA, teamB, STAGE_FORMAT.ehrenFinal);
}

// Create the fresh KO + Ehren skeleton right after qualification.
export function buildBrackets(qualified){
  return {
    ko:{
      knockout:{built:true, matches:buildKnockout(qualified.ko)},
      semi:{built:false, matches:[]},
      final:{built:false, match:null},
    },
    ehren:{
      semi:{built:true, matches:buildEhrenSemi(qualified.ehren, qualified.seedRank)},
      final:{built:false, match:null},
    },
  };
}

/* ── Auto-advance ─────────────────────────────────────────────── */
const allDone=ms=>ms.length>0&&ms.every(m=>m.status==='completed');

// Given a cup, fill in any next stage whose inputs are now complete and
// resolve the champion. Pure: returns a new cup (or the same ref).
export function advanceDnaCup(cup){
  if(cup.status!=='ko'||!cup.ko) return cup;
  let ko={...cup.ko, knockout:{...cup.ko.knockout}, semi:{...cup.ko.semi}, final:{...cup.ko.final}};
  let ehren={...cup.ehren, semi:{...cup.ehren.semi}, final:{...cup.ehren.final}};
  const seedRank=cup.qualified.seedRank;
  let changed=false;

  // Main: knockout → semi
  if(allDone(ko.knockout.matches)&&!ko.semi.built){
    const winners=ko.knockout.matches.flatMap(matchWinners);
    ko.semi={built:true, matches:buildSemi(winners, cup.qualified.byes, seedRank)};
    changed=true;
  }
  // Main: semi → final
  if(ko.semi.built&&allDone(ko.semi.matches)&&!ko.final.built){
    const [a,b]=ko.semi.matches;
    ko.final={built:true, match:buildFinal(matchWinners(a), matchWinners(b))};
    changed=true;
  }
  // Ehren: semi → final
  if(ehren.semi.built&&allDone(ehren.semi.matches)&&!ehren.final.built){
    const [a,b]=ehren.semi.matches;
    ehren.final={built:true, match:buildEhrenFinal(matchWinners(a), matchWinners(b))};
    changed=true;
  }

  // Champion + completion
  const mainDone=ko.final.built&&ko.final.match&&ko.final.match.status==='completed';
  // Empty Ehren bracket (scaled-down field) counts as done so the cup
  // can still complete; otherwise the Ehren-Final must be played.
  const ehrenEmpty=!ehren.semi.matches||ehren.semi.matches.length===0;
  const ehrenDone=ehrenEmpty?true:(ehren.final.built&&ehren.final.match&&ehren.final.match.status==='completed');
  let champion=cup.champion, ehrenChampion=cup.ehrenChampion, status=cup.status;
  if(mainDone) champion=matchWinners(ko.final.match);
  if(ehren.final.built&&ehrenDone) ehrenChampion=matchWinners(ehren.final.match);
  if(mainDone&&ehrenDone) status='completed';

  if(!changed&&champion===cup.champion&&ehrenChampion===cup.ehrenChampion&&status===cup.status) return cup;
  return {...cup, ko, ehren, champion, ehrenChampion, status};
}

/* ── Court conflict validation ────────────────────────────────── */
// A player must never be scheduled on two courts at once. Returns
// {ok, conflicts:[playerId]} for a set of concurrent matches.
export function validateCourts(matches){
  const seen={}; const conflicts=new Set();
  (matches||[]).forEach(m=>{
    [...(m.team1||[]),...(m.team2||[])].forEach(pid=>{
      if(seen[pid]) conflicts.add(pid); else seen[pid]=true;
    });
  });
  return {ok:conflicts.size===0, conflicts:[...conflicts]};
}

/* ── Result helpers ───────────────────────────────────────────── */
// Build a result object from a finished live match state.
//   points format → {winner,scoreA,scoreB}
//   sets format   → {winner,scoreA(sets),scoreB(sets),sets,games}
export function resultFromPoints(am){
  const winner=am.winner==='draw'?(am.pA>=am.pB?'A':'B'):am.winner; // open-points never truly draws a KO; fall to A on tie won't happen pre-KO
  return {winner, scoreA:am.pA, scoreB:am.pB, kind:'points'};
}
export function resultFromSets(bo3){
  const games=(bo3.sets||[]).reduce((a,s)=>[a[0]+s.gA,a[1]+s.gB],[0,0]);
  return {winner:bo3.winner, scoreA:bo3.sA, scoreB:bo3.sB,
    sets:bo3.sets, games:{a:games[0],b:games[1]}, kind:'sets'};
}
// Build a result from manually-typed set scores (director quick-entry).
// rawSets = [{a,b},…]; empty/0-0 rows are ignored. Winner is resolved
// with the same rules the live reducer uses (setsToWin / noDecider).
export function resultFromManualSets(fmt, rawSets){
  const sets=(rawSets||[])
    .filter(s=>s&&s.a!=null&&s.b!=null&&!(Number(s.a)===0&&Number(s.b)===0))
    .map(s=>({gA:Number(s.a),gB:Number(s.b),w:Number(s.a)>=Number(s.b)?'A':'B'}));
  const sA=sets.filter(s=>s.w==='A').length, sB=sets.filter(s=>s.w==='B').length;
  let winner=null;
  if(fmt.noDecider){
    if(sA>sB) winner='A'; else if(sB>sA) winner='B';
    else{ const tgA=sets.reduce((x,s)=>x+s.gA,0), tgB=sets.reduce((x,s)=>x+s.gB,0);
      winner=tgA>tgB?'A':tgB>tgA?'B':null; }
  } else {
    winner = sA>=fmt.setsToWin?'A':sB>=fmt.setsToWin?'B':(sA>sB?'A':sB>sA?'B':null);
  }
  const g=sets.reduce((a,s)=>[a[0]+s.gA,a[1]+s.gB],[0,0]);
  return {kind:'sets', winner, scoreA:sA, scoreB:sB, sets, games:{a:g[0],b:g[1]}};
}

// Short human label of a completed match result (for bracket cards).
export function resultLabel(m){
  if(!m||!m.result) return '';
  const r=m.result;
  if(r.bye) return 'Freilos';
  if(r.kind==='points') return `${r.scoreA} : ${r.scoreB}`;
  if(r.sets&&r.sets.length) return r.sets.map(s=>`${s.gA}-${s.gB}`).join('  ');
  return `${r.scoreA} : ${r.scoreB}`;
}
