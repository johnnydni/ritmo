/* ═══════════════════════════════════════════════════════════════
   RITMO DNA LIGA — pure Daten-Logik für den Club-Liga-Zyklus.

   Zyklus (3 Monate):
     Monat 1  Gruppenphase — 4 Gruppen à 4 Teams (16 Teams / 32
              Spieler), 1 Liga-Abend pro Woche (19–21:30), jede
              Gruppe auf ihrem Court. Round Robin = 3 Spieltage,
              Woche 4 = Nachholtermin.
     Monat 2  KO — Woche 1 Achtelfinale (alle 16 Teams, gesetzt
              über die Gruppentabellen), Woche 2 Viertel-, Woche 3
              Halbfinale, Woche 4 Finale + Spiel um Platz 3.
     Monat 3  Planung & Anmeldung des nächsten Zyklus.

   Anmeldung ist INDIVIDUELL (Club-Mitglieder), der Admin formt
   daraus die 16 Teams. DNA-Punkte werden pro SPIELER geführt
   (Team-Spiele + Tier-Bonus wie beim Cup), die Gruppentabellen
   pro TEAM (Seeding fürs KO).

   Ergebnis-Flow: ein Spieler trägt ein (status 'eingetragen'),
   ein Gegner bestätigt ('bestaetigt' — erst dann zählt es) oder
   widerspricht ('streit' — der Admin entscheidet).

   Kein React, keine Side-Effects — Persistenz/Sync übernimmt der
   Screen (localStorage + ritmo_sessions kind='liga').
═══════════════════════════════════════════════════════════════ */

import { computeMatchTier } from './padelStyles.js';

export const LIGA_PHASES=[
  {id:'anmeldung', name:'Anmeldung',    sub:'Spieler melden sich an'},
  {id:'gruppe',    name:'Gruppenphase', sub:'4 Gruppen · 1 Abend/Woche'},
  {id:'viertel',   name:'Viertelfinale',sub:'Top 2 jeder Gruppe · 8 Teams'},
  {id:'halb',      name:'Halbfinale',   sub:'4 Teams'},
  {id:'finale',    name:'Finale',       sub:'Finale + Spiel um Platz 3'},
  {id:'planung',   name:'Planung',      sub:'Nächster Zyklus'},
];
export const LIGA_GROUPS=['A','B','C','D'];
export const LIGA_SLOT_TIMES=['19:00','20:15'];

export function initialLigaState(name,clubId){
  return {
    v:1, name:name||'RITMO DNA Liga', clubId:clubId||null,
    createdAt:null, phase:'anmeldung',
    participants:[],  // {id,userId,name,style}
    teams:[],         // {id,name,p:[pid,pid],group}
    matches:[],       // s. genGroupMatches / genKoRound
    week:1,           // aktueller Spieltag innerhalb der Phase
  };
}

const rid=p=>p+'_'+Math.random().toString(36).slice(2,8);

export function ligaAddParticipant(state,{userId,name,style}){
  if(state.participants.some(x=>x.userId===userId)) return state;
  return {...state,participants:[...state.participants,
    {id:rid('p'),userId,name:(name||'').trim()||'Spieler',style:style||null}]};
}
export function ligaRemoveParticipant(state,pid){
  return {...state,
    participants:state.participants.filter(p=>p.id!==pid),
    teams:state.teams.map(t=>({...t,p:t.p.filter(x=>x!==pid)}))};
}

/* Teams aus der Anmeldereihenfolge formen (Paare 1+2, 3+4, …) —
   der Admin kann danach per Slot-Tausch umbauen. */
export function ligaFormTeams(state){
  const ps=state.participants;
  const teams=[];
  for(let i=0;i+1<ps.length&&teams.length<16;i+=2){
    teams.push({id:rid('t'),name:'',p:[ps[i].id,ps[i+1].id],group:null});
  }
  return {...state,teams};
}

/* Gruppen zuteilen: Team-Index round-robin auf A–D (0→A, 1→B, …). */
export function ligaAssignGroups(state){
  const teams=state.teams.map((t,i)=>({...t,group:LIGA_GROUPS[i%4]}));
  return {...state,teams};
}

/* Gruppen-Spielplan: Round Robin für 4er-Gruppe = 3 Runden à 2
   Matches. Woche w (1..3) = Runde w; Gruppe g spielt auf Court
   (Index+1); pro Abend 2 Slots (19:00 / 20:15). Woche 4 bleibt
   frei als Nachholtermin. */
const RR4=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
export function genGroupMatches(state){
  const matches=[];
  LIGA_GROUPS.forEach((g,gi)=>{
    const gt=state.teams.filter(t=>t.group===g);
    if(gt.length<4) return;
    RR4.forEach((runde,w)=>{
      runde.forEach((pair,si)=>{
        matches.push({
          id:`g${g}w${w+1}s${si+1}`,phase:'gruppe',group:g,week:w+1,
          court:gi+1,time:LIGA_SLOT_TIMES[si],
          t1:gt[pair[0]].id,t2:gt[pair[1]].id,
          s1:null,s2:null,status:'offen',reportedBy:null,
        });
      });
    });
  });
  return {...state,matches,phase:'gruppe',week:1};
}

/* Nur bestätigte Ergebnisse zählen. */
const done=m=>m.status==='bestaetigt';
const teamOf=(state,id)=>state.teams.find(t=>t.id===id);
const playerOf=(state,id)=>state.participants.find(p=>p.id===id);

export function ligaMatchTier(state,m){
  const styles=[m.t1,m.t2].map(tid=>{
    const t=teamOf(state,tid);
    return t?t.p.map(pid=>playerOf(state,pid)?.style):[null,null];
  });
  return computeMatchTier(styles[0]||[null,null],styles[1]||[null,null]);
}

/* Gruppentabelle (Teams): Siege → Spiele-Differenz → Spiele. */
export function ligaGroupTable(state,g){
  const rows={};
  state.teams.filter(t=>t.group===g).forEach(t=>{
    rows[t.id]={team:t,w:0,played:0,gf:0,ga:0};
  });
  state.matches.filter(m=>m.phase==='gruppe'&&m.group===g&&done(m)).forEach(m=>{
    const a=rows[m.t1],b=rows[m.t2];if(!a||!b)return;
    const s1=m.s1??0,s2=m.s2??0;
    a.played++;b.played++;a.gf+=s1;a.ga+=s2;b.gf+=s2;b.ga+=s1;
    if(s1>s2)a.w++;else if(s2>s1)b.w++;
  });
  const list=Object.values(rows);
  list.sort((a,b)=>b.w-a.w||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf);
  list.forEach((r,i)=>{r.rank=i+1;});
  return list;
}

/* DNA-Leaderboard (individuell, Cup-Mechanik): jeder Spieler
   bekommt die Team-Spiele seiner Matches als Punkte; das SIEGER-
   Team bekommt pro Spieler den Tier-Bonus (Sterne des Match-Tiers).
   Zählt über ALLE Phasen (Gruppe + KO). */
export function ligaDnaBoard(state){
  const rows={};
  state.participants.forEach(p=>{
    rows[p.id]={p,pts:0,wins:0,played:0,tierBonus:0};
  });
  state.matches.filter(done).forEach(m=>{
    const s1=m.s1??0,s2=m.s2??0;
    const tier=ligaMatchTier(state,m);
    [[m.t1,s1,s1>s2],[m.t2,s2,s2>s1]].forEach(([tid,pts,won])=>{
      const t=teamOf(state,tid);if(!t)return;
      t.p.forEach(pid=>{
        const r=rows[pid];if(!r)return;
        r.pts+=pts;r.played++;
        if(won){r.wins++;if(tier)r.tierBonus+=tier.stars;}
      });
    });
  });
  const list=Object.values(rows).map(r=>({...r,total:r.pts+r.tierBonus}));
  list.sort((a,b)=>b.total-a.total||b.wins-a.wins);
  list.forEach((r,i)=>{r.rank=i+1;});
  return list;
}

/* ── KO ──────────────────────────────────────────────────────────
   Viertelfinale: NUR die Top 2 jeder Gruppe (8 Teams / 16 Spieler),
   klassisch über Kreuz gesetzt — Gruppenerste treffen Gruppenzweite
   der Partnergruppe, getrennte Tableau-Hälften, damit sich
   Gruppengegner frühestens im Finale wiedersehen. Alle 4 Matches
   parallel um 19:00 auf den 4 Courts. */
const QF_PAIRS=[
  ['A1','B2'],['C1','D2'],   // obere Hälfte
  ['B1','A2'],['D1','C2'],   // untere Hälfte
];
const seedMap=state=>{
  const map={};
  LIGA_GROUPS.forEach(g=>{
    ligaGroupTable(state,g).forEach(r=>{map[`${g}${r.rank}`]=r.team.id;});
  });
  return map;
};
export function genViertelfinale(state){
  const S=seedMap(state);
  const matches=QF_PAIRS.map((pair,i)=>({
    id:`vf${i+1}`,phase:'viertel',week:1,
    court:i+1,time:LIGA_SLOT_TIMES[0],
    t1:S[pair[0]],t2:S[pair[1]],seed:pair.join(' vs '),
    s1:null,s2:null,status:'offen',reportedBy:null,
  }));
  return {...state,matches:[...state.matches,...matches],phase:'viertel',week:1};
}

const winnerOf=m=>(m.s2??0)>(m.s1??0)?m.t2:m.t1;
const loserOf =m=>(m.s2??0)>(m.s1??0)?m.t1:m.t2;
const NEXT={viertel:['halb','hf',2],halb:['finale','fin',1]};

/* Nächste KO-Runde aus den Siegern der vorigen; null solange die
   vorige Runde nicht komplett bestätigt ist. Beim Finale entsteht
   zusätzlich das Spiel um Platz 3 aus den Halbfinal-Verlierern. */
export function genNextKoRound(state){
  const cfg=NEXT[state.phase];
  if(!cfg) return null;
  const[nextPhase,prefix,count]=cfg;
  const prev=state.matches.filter(m=>m.phase===state.phase);
  if(prev.length===0||prev.some(m=>!done(m))) return null;
  const ws=prev.map(winnerOf);
  const matches=[];
  for(let i=0;i<count;i++){
    matches.push({
      id:`${prefix}${i+1}`,phase:nextPhase,week:1,
      court:count===1?1:(i%4)+1,
      time:LIGA_SLOT_TIMES[count===1?0:Math.floor(i/4)],
      t1:ws[i*2],t2:ws[i*2+1],
      s1:null,s2:null,status:'offen',reportedBy:null,
    });
  }
  if(nextPhase==='finale'){
    const hf=prev;
    matches.push({
      id:'platz3',phase:'finale',week:1,court:2,time:LIGA_SLOT_TIMES[0],
      t1:loserOf(hf[0]),t2:loserOf(hf[1]),title:'Spiel um Platz 3',
      s1:null,s2:null,status:'offen',reportedBy:null,
    });
  }
  return {...state,matches:[...state.matches,...matches],phase:nextPhase,week:1};
}

/* ── Ergebnis-Flow ──────────────────────────────────────────────── */
export function ligaTeamOfUser(state,userId){
  const p=state.participants.find(x=>x.userId===userId);
  if(!p) return null;
  return state.teams.find(t=>t.p.includes(p.id))||null;
}
export function ligaReportResult(state,matchId,s1,s2,userId){
  return {...state,matches:state.matches.map(m=>m.id===matchId
    ?{...m,s1,s2,status:'eingetragen',reportedBy:userId}:m)};
}
export function ligaConfirmResult(state,matchId){
  return {...state,matches:state.matches.map(m=>m.id===matchId
    ?{...m,status:'bestaetigt'}:m)};
}
export function ligaDisputeResult(state,matchId){
  return {...state,matches:state.matches.map(m=>m.id===matchId
    ?{...m,status:'streit'}:m)};
}

/* Anzeige-Helfer. */
export function ligaTeamLabel(state,teamId){
  const t=teamOf(state,teamId);
  if(!t) return '—';
  if(t.name) return t.name;
  const names=t.p.map(pid=>{
    const p=playerOf(state,pid);
    return p?(p.name.split(/\s+/)[0]):'?';
  });
  return names.join(' & ');
}
export function ligaMyOpenAction(state,userId){
  // Nächste Aktion des Users: offenes Match eintragen oder ein vom
  // Gegner gemeldetes Ergebnis bestätigen (In-App-Reminder).
  const team=ligaTeamOfUser(state,userId);
  if(!team) return null;
  const mine=state.matches.filter(m=>m.t1===team.id||m.t2===team.id);
  const confirm=mine.find(m=>m.status==='eingetragen'&&m.reportedBy!==userId);
  if(confirm) return {kind:'confirm',match:confirm};
  const open=mine.find(m=>m.status==='offen');
  if(open) return {kind:'report',match:open};
  return null;
}
