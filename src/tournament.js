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
