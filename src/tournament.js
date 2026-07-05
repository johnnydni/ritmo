/* ═══════════════════════════════════════════════════════════════
   TOURNAMENT LOGIC — Round generation + leaderboard for Americano
   and Mexicano.

   Pure functions. Both round generators:
     - Compute number of courts (min(maxCourts, ⌊players/4⌋))
     - Fair sit-out: prefer players with fewest prior sit-outs
     - Return {courts:[{id,t1,t2,s1,s2,done}], sitOut:[id]}

   Americano: random pairings, up to 60 attempts to avoid partner
   repeats, then falls back to allowing them.

   Mexicano: 1+4 vs 2+3 group-of-four pairings driven by current
   leaderboard rank.

   Leaderboard supports two win modes:
     'points' — actual game points; sit-outs get the round's mean score (ceil)
     'wins'   — actual win count; sit-outs add +1 win (lower half only)

   Bonus values are kept SEPARATE (bonusPts/bonusWins) and folded
   into totalPts/totalWins only for ranking purposes.
═══════════════════════════════════════════════════════════════ */

export const PCOLS=['#FF7A1A','#0A84FF','#30D158','#BF5AF2','#FF375F','#FFD60A','#64D2FF','#5E5CE6','#FF9500','#AC8E68','#32D74B','#5AC8FA'];

export const shuffle=arr=>{
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
};

export function genAmericanoRound(playerIds,history=[],maxCourts=null){
  const used=new Set(history.flatMap(r=>r.courts.flatMap(m=>[
    `${Math.min(...m.t1)}_${Math.max(...m.t1)}`,
    `${Math.min(...m.t2)}_${Math.max(...m.t2)}`])));
  const maxByPlayers=Math.floor(playerIds.length/4);
  const numCourts=maxCourts?Math.min(maxCourts,maxByPlayers):maxByPlayers;
  const playingCount=numCourts*4;
  const numSit=playerIds.length-playingCount;

  // Fair sit-out: players with FEWEST prior sit-outs sit out next
  // (those with more sit-outs deserve to play; random tie-break)
  const sitOut=numSit>0
    ? playerIds
        .map(id=>({id,c:history.filter(r=>r.sitOut?.includes(id)).length,r:Math.random()}))
        .sort((a,b)=>a.c-b.c||a.r-b.r)
        .slice(0,numSit)
        .map(x=>x.id)
    : [];
  const playing=playerIds.filter(id=>!sitOut.includes(id));

  for(let attempt=0;attempt<60;attempt++){
    const s=shuffle(playing);const courts=[];let ok=true;
    for(let i=0;i<playingCount;i+=4){
      const p1=[s[i],s[i+1]].sort((a,b)=>a-b),p2=[s[i+2],s[i+3]].sort((a,b)=>a-b);
      const k1=`${p1[0]}_${p1[1]}`,k2=`${p2[0]}_${p2[1]}`;
      if(used.has(k1)||used.has(k2)){ok=false;break;}
      courts.push({id:`c${i/4}`,t1:[s[i],s[i+1]],t2:[s[i+2],s[i+3]],s1:null,s2:null,done:false});
    }
    if(ok) return {courts,sitOut};
  }
  // Fallback: accept partner repeats if no clean config found
  const s=shuffle(playing);
  const courts=[];
  for(let i=0;i<playingCount;i+=4){
    courts.push({id:`c${i/4}`,t1:[s[i],s[i+1]],t2:[s[i+2],s[i+3]],s1:null,s2:null,done:false});
  }
  return {courts,sitOut};
}

export function genMexicanoRound(playerIds,leaderboard,maxCourts=null,history=[]){
  const maxByPlayers=Math.floor(playerIds.length/4);
  const numCourts=maxCourts?Math.min(maxCourts,maxByPlayers):maxByPlayers;
  const playingCount=numCourts*4;
  const numSit=playerIds.length-playingCount;

  // Fair sit-out (same as americano)
  const sitOut=numSit>0
    ? playerIds
        .map(id=>({id,c:history.filter(r=>r.sitOut?.includes(id)).length,r:Math.random()}))
        .sort((a,b)=>a.c-b.c||a.r-b.r)
        .slice(0,numSit)
        .map(x=>x.id)
    : [];
  const playing=playerIds.filter(id=>!sitOut.includes(id));

  // Among playing players: sort by leaderboard for 1+4 vs 2+3 pairing
  const sorted=playing.sort((a,b)=>{
    const la=leaderboard.find(x=>x.id===a),lb=leaderboard.find(x=>x.id===b);
    return (lb?.pts??0)-(la?.pts??0);
  });
  const courts=[];
  for(let i=0;i<playingCount;i+=4){
    const g=sorted.slice(i,i+4);
    courts.push({id:`c${i/4}`,t1:[g[0],g[3]],t2:[g[1],g[2]],s1:null,s2:null,done:false});
  }
  return {courts,sitOut};
}

/* ═══════════════════════════════════════════════════════════════
   FORMAT-KATALOG + 5 weitere klassische Modi.

   Alle Generatoren liefern dieselbe Round-Shape wie Americano/
   Mexicano: {courts:[{id,t1,t2,s1,s2,done}],sitOut:[ids]} — damit
   funktionieren TournamentPlay, calcLeaderboard, Online-Sync und
   Court-Namen unverändert für jeden Modus.

   WICHTIG (K.-o.): Ausgeschiedene/Freilos-Teams stehen NICHT in
   sitOut — calcLeaderboard vergibt für sitOut Pausen-Boni, die ein
   K.-o.-Ranking verfälschen würden. Stattdessen informative Felder:
   koAdvanced/koQueue (Replay-State) + koIdle (Anzeige).
═══════════════════════════════════════════════════════════════ */

export const FORMATS={
  americano:    {name:'Americano',        short:'Zufällige Partner, jede Runde neu gemischt.',            team:false,groups:false,online:true},
  mexicano:     {name:'Mexicano',         short:'Paarungen nach Tabellenstand (1+4 vs 2+3).',             team:false,groups:false,online:true},
  teamamericano:{name:'Team-Americano',   short:'Feste Partner, rotierende Gegner ohne Wiederholung.',    team:true, groups:false,online:true},
  teammexicano: {name:'Team-Mexicano',    short:'Feste Partner, Gegner nach Tabellenstand (1. vs 2.).',   team:true, groups:false,online:true},
  mixicano:     {name:'Mixicano',         short:'Mixed: jedes Team = 1× Gruppe A + 1× Gruppe B.',         team:false,groups:true, online:false},
  kingofcourt:  {name:'King of the Court',short:'Sieger steigen auf, Verlierer ab — Court 1 ist der Thron.',team:false,groups:false,online:true},
  knockout:     {name:'K.-o.-Turnier',    short:'Feste Teams — wer verliert, ist raus. Bis zum Finale.',  team:true, groups:false,online:true},
};

/* ── Gemeinsame Helfer ── */
// Feste Teams aus der Listen-Reihenfolge: (1,2)(3,4)… = Setzliste.
export const fixedTeams=ids=>{const t=[];for(let i=0;i+1<ids.length;i+=2)t.push([ids[i],ids[i+1]]);return t;};
const teamKey=t=>`${Math.min(t[0],t[1])}_${Math.max(t[0],t[1])}`;
const matchKey=(a,b)=>[teamKey(a),teamKey(b)].sort().join('|');
const sitCount=(history,id)=>history.filter(r=>r.sitOut?.includes(id)).length;
// Sieger/Verlierer eines Courts. Gleichstand → t1 (dokumentiert:
// K.-o./King brauchen einen Sieger — Golden Point spielen).
const winnerOf=m=>(m.s2??0)>(m.s1??0)?m.t2:m.t1;
const loserOf =m=>(m.s2??0)>(m.s1??0)?m.t1:m.t2;

/* ── TEAM-AMERICANO ───────────────────────────────────────────────
   Feste Paare (Setzliste), Gegner rotieren zufällig. Wie beim
   Americano: bis zu 60 Versuche ohne Matchup-Wiederholung, dann
   Fallback. Faire Team-Pausen (wenigste bisherige Pausen zuerst). */
export function genTeamAmericanoRound(playerIds,history=[],maxCourts=null){
  const teams=fixedTeams(playerIds);
  const cap=Math.floor(teams.length/2);
  const numCourts=Math.max(1,maxCourts?Math.min(maxCourts,cap):cap);
  const playing=numCourts*2;
  const numSit=teams.length-playing;
  const played=new Set(history.flatMap(r=>r.courts.map(m=>matchKey(m.t1,m.t2))));
  // Team-Pause zählt über Mitglied 0 (Teams pausieren als Einheit).
  const bySit=teams
    .map(t=>({t,c:sitCount(history,t[0]),r:Math.random()}))
    .sort((a,b)=>a.c-b.c||a.r-b.r);
  const sitTeams=numSit>0?bySit.slice(0,numSit).map(x=>x.t):[];
  const sitKeys=new Set(sitTeams.map(teamKey));
  const active=teams.filter(t=>!sitKeys.has(teamKey(t)));
  const mk=list=>list.length?{courts:list.map((p,i)=>({id:`c${i}`,t1:p[0],t2:p[1],s1:null,s2:null,done:false})),
    sitOut:sitTeams.flat()}:null;
  for(let attempt=0;attempt<60;attempt++){
    const s=shuffle(active);const pairs=[];let ok=true;
    for(let i=0;i+1<s.length;i+=2){
      if(played.has(matchKey(s[i],s[i+1]))){ok=false;break;}
      pairs.push([s[i],s[i+1]]);
    }
    if(ok) return mk(pairs);
  }
  const s=shuffle(active);const pairs=[];
  for(let i=0;i+1<s.length;i+=2)pairs.push([s[i],s[i+1]]);
  return mk(pairs);
}

/* ── TEAM-MEXICANO ────────────────────────────────────────────────
   Feste Paare, Gegner nach Tabellenstand: Team-Rang = Summe der
   Ranglisten-Positionen beider Mitglieder (aufsteigend = besser).
   1. vs 2. auf Court 1, 3. vs 4. auf Court 2 usw. Runde 1 (leere
   Tabelle) = Setzlisten-Reihenfolge. Pausen fair rotiert. */
export function genTeamMexicanoRound(playerIds,leaderboard,maxCourts=null,history=[]){
  const teams=fixedTeams(playerIds);
  const cap=Math.floor(teams.length/2);
  const numCourts=Math.max(1,maxCourts?Math.min(maxCourts,cap):cap);
  const playing=numCourts*2;
  const numSit=teams.length-playing;
  const rankOf=id=>{const i=leaderboard.findIndex(x=>x.id===id);return i<0?leaderboard.length:i;};
  const bySit=teams
    .map(t=>({t,c:sitCount(history,t[0]),r:Math.random()}))
    .sort((a,b)=>a.c-b.c||a.r-b.r);
  const sitTeams=numSit>0?bySit.slice(0,numSit).map(x=>x.t):[];
  const sitKeys=new Set(sitTeams.map(teamKey));
  const ranked=teams.filter(t=>!sitKeys.has(teamKey(t)))
    .map(t=>({t,score:rankOf(t[0])+rankOf(t[1])}))
    .sort((a,b)=>a.score-b.score)
    .map(x=>x.t);
  const courts=[];
  for(let i=0;i+1<ranked.length;i+=2){
    courts.push({id:`c${i/2}`,t1:ranked[i],t2:ranked[i+1],s1:null,s2:null,done:false});
  }
  return {courts,sitOut:sitTeams.flat()};
}

/* ── MIXICANO ─────────────────────────────────────────────────────
   Mixed-Americano: jedes Team = 1 Spieler aus Gruppe A + 1 aus
   Gruppe B (z. B. Damen/Herren). Pro Court 2+2. Pausen werden je
   Gruppe getrennt fair rotiert; Partner-Wiederholungen werden wie
   beim Americano 60 Versuche lang vermieden. players = Objekte
   mit {id, group:'A'|'B'} (fehlende group ⇒ 'A'). */
export function genMixicanoRound(players,history=[],maxCourts=null){
  const A=players.filter(p=>(p.group||'A')!=='B').map(p=>p.id);
  const B=players.filter(p=>(p.group||'A')==='B').map(p=>p.id);
  const cap=Math.floor(Math.min(A.length,B.length)/2);
  const numCourts=Math.max(1,maxCourts?Math.min(maxCourts,cap):cap);
  const perGroup=numCourts*2;
  const pick=(ids)=>{
    const numSit=ids.length-perGroup;
    if(numSit<=0) return {act:ids,sit:[]};
    const ranked=ids.map(id=>({id,c:sitCount(history,id),r:Math.random()}))
      .sort((a,b)=>a.c-b.c||a.r-b.r);
    return {act:ranked.slice(numSit).map(x=>x.id),sit:ranked.slice(0,numSit).map(x=>x.id)};
  };
  const pa=pick(A),pb=pick(B);
  const sitOut=[...pa.sit,...pb.sit];
  const used=new Set(history.flatMap(r=>r.courts.flatMap(m=>[
    `${Math.min(...m.t1)}_${Math.max(...m.t1)}`,
    `${Math.min(...m.t2)}_${Math.max(...m.t2)}`])));
  const build=(sa,sb)=>{
    const teams=sa.map((a,i)=>[a,sb[i]]);
    const courts=[];
    for(let i=0;i+1<teams.length;i+=2){
      courts.push({id:`c${i/2}`,t1:teams[i],t2:teams[i+1],s1:null,s2:null,done:false});
    }
    return courts;
  };
  for(let attempt=0;attempt<60;attempt++){
    const sa=shuffle(pa.act),sb=shuffle(pb.act);
    const clean=sa.every((a,i)=>!used.has(`${Math.min(a,sb[i])}_${Math.max(a,sb[i])}`));
    if(clean) return {courts:build(sa,sb),sitOut};
  }
  return {courts:build(shuffle(pa.act),shuffle(pb.act)),sitOut};
}

/* ── KING OF THE COURT ────────────────────────────────────────────
   Court 1 = Thron. Sieger steigen einen Court auf, Verlierer einen
   ab; auf jedem Court werden die 4 Ankommenden neu gemischt (Cross-
   Split: je 1 Auf- + 1 Absteiger pro Team → niemand behält den
   Partner). Umsetzung über eine Leiter-Sortierung mit Rangwert
     Sieger  von Court i → max(0, 2i−1)
     Verlierer von Court i → 2i+2
   → die Reihenfolge W(C1) W(C2) L(C1) W(C3) L(C2) … in 4er-Blöcken
   ergibt exakt die klassische Bewegung: Court 1 = Sieger C1+C2,
   Court 2 = Verlierer C1 + Sieger C3 usw. Pausierende steigen unten
   ein (Fair-Rotation: wenigste Pausen sitzen als Nächste).
   Gleichstand ⇒ t1 gilt als Sieger. */
export function genKingOfCourtRound(playerIds,history=[],maxCourts=null){
  const maxByPlayers=Math.floor(playerIds.length/4);
  const numCourts=Math.max(1,maxCourts?Math.min(maxCourts,maxByPlayers):maxByPlayers);
  const playingCount=numCourts*4;
  const numSit=playerIds.length-playingCount;
  const sitOut=numSit>0
    ? playerIds
        .map(id=>({id,c:sitCount(history,id),r:Math.random()}))
        .sort((a,b)=>a.c-b.c||a.r-b.r)
        .slice(0,numSit)
        .map(x=>x.id)
    : [];
  const playing=playerIds.filter(id=>!sitOut.includes(id));
  const last=history[history.length-1];
  if(!last||!last.courts?.length){
    // Runde 1: zufällige Verteilung (wie Americano, ohne Historie).
    const s=shuffle(playing);const courts=[];
    for(let i=0;i<s.length-3;i+=4){
      courts.push({id:`c${i/4}`,t1:[s[i],s[i+1]],t2:[s[i+2],s[i+3]],s1:null,s2:null,done:false});
    }
    return {courts,sitOut};
  }
  // Leiter-Position aus der letzten Runde: Sieger vor Verlierern,
  // Court-Index zählt; wer pausierte, reiht sich unten ein.
  const pos={};
  last.courts.forEach((m,ci)=>{
    winnerOf(m).forEach(id=>{pos[id]=Math.max(0,2*ci-1);});
    loserOf(m).forEach(id=>{pos[id]=2*ci+2;});
  });
  // Wer letzte Runde pausierte, reiht sich ganz unten ein.
  const BOTTOM=2*numCourts+4;
  const ladder=[...playing].sort((a,b)=>
    (pos[a]??BOTTOM)-(pos[b]??BOTTOM)||Math.random()-0.5);
  const courts=[];
  for(let i=0;i<ladder.length-3;i+=4){
    const g=ladder.slice(i,i+4);
    // Cross-Split: [0,1] kamen gemeinsam von oben, [2,3] von unten →
    // Teams [0,2] vs [1,3] mischen Auf- und Absteiger.
    courts.push({id:`c${i/4}`,t1:[g[0],g[2]],t2:[g[1],g[3]],s1:null,s2:null,done:false});
  }
  return {courts,sitOut};
}

/* ── K.-o.-TURNIER (Single Elimination, feste Teams) ──────────────
   Teams = Setzliste (1,2)(3,4)… Bracket = nächste 2er-Potenz;
   Freilose gehen an die topgesetzten Teams (nur Runde 1). Paarung
   je Bracket-Runde: Erster gegen Letzter (Re-Seeding, wie z. B.
   NFL-Playoffs). Passen mehr Matches an als Courts da sind, wird
   die Bracket-Runde in Wellen gespielt (koQueue). Ausgeschiedene
   und Wartende stehen NICHT in sitOut (keine Pausen-Boni!) —
   Anzeige läuft über koIdle. Gleichstand ⇒ t1 kommt weiter
   (Golden Point spielen). Gibt null zurück, wenn das Finale
   entschieden ist → Turnier beenden. */
export function genKnockoutRound(playerIds,history=[],maxCourts=null){
  const seedTeams=fixedTeams(playerIds);
  const seedIdx=new Map(seedTeams.map((t,i)=>[teamKey(t),i]));
  const bySeed=list=>[...list].sort((a,b)=>(seedIdx.get(teamKey(a))??99)-(seedIdx.get(teamKey(b))??99));
  const pairFirstLast=alive=>{
    const pairs=[];const a=[...alive];
    while(a.length>1)pairs.push([a.shift(),a.pop()]);
    return pairs;
  };
  const phaseOf=n=>n===2?'Finale':n===4?'Halbfinale':n===8?'Viertelfinale':n===16?'Achtelfinale':`K.-o.-Runde (${n} Teams)`;
  const C=Math.max(1,maxCourts||1);
  let pairs,advanced,phase;
  const last=history[history.length-1];
  if(!last){
    // Bracket-Runde 1: Freilose für die Topgesetzten.
    const size=Math.pow(2,Math.ceil(Math.log2(Math.max(2,seedTeams.length))));
    const byes=size-seedTeams.length;
    advanced=seedTeams.slice(0,byes);
    pairs=pairFirstLast(seedTeams.slice(byes));
    phase=phaseOf(seedTeams.length);
    if(!pairs.length) return null; // <2 Teams — nichts zu spielen
  }else{
    const queue=last.koQueue||[];
    advanced=[...(last.koAdvanced||[]),...last.courts.map(winnerOf)];
    if(queue.length){
      // Bracket-Runde läuft noch — nächste Welle aus der Queue.
      pairs=queue;
      phase=last.koPhase;
    }else{
      const alive=bySeed(advanced);
      if(alive.length<=1) return null; // Sieger steht fest
      pairs=pairFirstLast(alive);
      advanced=[];
      phase=phaseOf(alive.length);
    }
  }
  const wave=pairs.slice(0,C);
  const koQueue=pairs.slice(C);
  const courts=wave.map((p,i)=>({id:`c${i}`,t1:p[0],t2:p[1],s1:null,s2:null,done:false}));
  // koIdle: rein informativ — wer diese Welle nicht spielt (Freilos/
  // Warteschlange). Ausgeschiedene tauchen gar nicht mehr auf.
  const koIdle=[...advanced.flat(),...koQueue.flat(2)].filter((v,i,a)=>a.indexOf(v)===i);
  return {courts,sitOut:[],koAdvanced:advanced,koQueue,koPhase:phase,koIdle};
}

/* ── Dispatcher — eine Signatur für alle Modi. ────────────────────
   players: Array von Spieler-Objekten ({id,group,…}) oder rohe ids.
   Gibt null zurück, wenn der Modus fertig ist (nur K.-o.). */
export function genRound(format,players,{history=[],leaderboard=[],maxCourts=null}={}){
  const objs=players.map(p=>(typeof p==='object'&&p!==null)?p:{id:p});
  const ids=objs.map(p=>p.id);
  switch(format){
    case 'mexicano':      return genMexicanoRound(ids,leaderboard,maxCourts,history);
    case 'teamamericano': return genTeamAmericanoRound(ids,history,maxCourts);
    case 'teammexicano':  return genTeamMexicanoRound(ids,leaderboard,maxCourts,history);
    case 'mixicano':      return genMixicanoRound(objs,history,maxCourts);
    case 'kingofcourt':   return genKingOfCourtRound(ids,history,maxCourts);
    case 'knockout':      return genKnockoutRound(ids,history,maxCourts);
    default:              return genAmericanoRound(ids,history,maxCourts);
  }
}

export function calcLeaderboard(players,rounds,winMode='points'){
  const stats={};
  // adjPts/adjWins = manuelle Korrekturen vom Host (Leaderboard-Edit).
  // Liegen auf dem Spieler-Record, damit sie persistieren + online
  // mitpubliziert werden. sessionParticipantId wird durchgereicht, damit
  // die Teilnehmer-Ansicht ihre eigene Zeile zuverlässig per ID findet.
  players.forEach(p=>{stats[p.id]={id:p.id,name:p.name,color:p.color,
    sessionParticipantId:p.sessionParticipantId,
    pts:0,wins:0,losses:0,played:0,sitOut:0,bonusPts:0,bonusWins:0,
    adjPts:p.adjPts||0,adjWins:p.adjWins||0};});
  // Phase 1: actual match stats + sit-out counts
  rounds.forEach(round=>{
    round.courts.forEach(m=>{
      if(!m.done) return;
      m.t1.forEach(pid=>{
        if(!stats[pid])return;
        stats[pid].pts+=(m.s1??0);
        if(m.s1>m.s2) stats[pid].wins++; else stats[pid].losses++;
        stats[pid].played++;
      });
      m.t2.forEach(pid=>{
        if(!stats[pid])return;
        stats[pid].pts+=(m.s2??0);
        if(m.s2>m.s1) stats[pid].wins++; else stats[pid].losses++;
        stats[pid].played++;
      });
    });
    (round.sitOut||[]).forEach(pid=>{if(stats[pid]) stats[pid].sitOut++;});
  });
  // Phase 2: compute bonuses (kept SEPARATE from real stats)
  if(winMode==='points'){
    // Mittelwert (mean, aufgerundet) per-round bonus for sit-outs
    rounds.forEach(round=>{
      if(!round.sitOut||round.sitOut.length===0)return;
      const scores=[];
      round.courts.forEach(m=>{
        if(!m.done)return;
        m.t1.forEach(()=>scores.push(m.s1??0));
        m.t2.forEach(()=>scores.push(m.s2??0));
      });
      if(scores.length===0)return;
      // Aufgerundeter Mittelwert (Durchschnitt) aller Rundenpunkte als
      // Pausen-Bonus → ganze Zahlen (keine 0.5-Schritte); niemand wird
      // durch eine erzwungene Pause benachteiligt.
      const mean=scores.reduce((a,b)=>a+b,0)/scores.length;
      const bonus=Math.ceil(mean);
      round.sitOut.forEach(pid=>{if(stats[pid]) stats[pid].bonusPts+=bonus;});
    });
  } else {
    // Wins mode: +1 win per sit-out, only for lower-half players (by actual wins)
    const arr=Object.values(stats);
    const ranked=[...arr].sort((a,b)=>b.wins-a.wins||b.pts-a.pts);
    const lowerStart=Math.ceil(ranked.length/2);
    const lowerIds=new Set(ranked.slice(lowerStart).map(s=>s.id));
    arr.forEach(s=>{
      if(lowerIds.has(s.id)&&s.sitOut>0) s.bonusWins=s.sitOut;
    });
  }
  // Convenience: total values for ranking (inkl. manueller Korrektur)
  Object.values(stats).forEach(s=>{
    s.totalPts=s.pts+s.bonusPts+s.adjPts;
    s.totalWins=s.wins+s.bonusWins+s.adjWins;
  });
  return Object.values(stats);
}
