/* ═══════════════════════════════════════════════════════════════
   RITMO DNA CUP — pure Daten-Logik für das Live-Event am 18.07.2026.
   (RITMO × Padel Haus · 22 Spieler · 3 Courts · 18–23 Uhr)

   Kein React, keine Side-Effects — die Screens (Admin / Tickets /
   Center / Court) in App.jsx konsumieren ausschließlich diese
   Funktionen. Persistenz übernimmt der Screen via lsGet/lsSet.

   Ablauf laut Plakat:
     Phase 1  Gruppenphase — 6 Runden à 10 Min, fester Spielplan,
              Punkte in 1er-Schritten ohne Limit.
     Phase 2  KO — Rang 3–14, gespiegelte Paarungen (3+14 vs 4+13 …),
              3 Matches à 30 Min parallel.
     Phase 3  Halbfinals — DNA: #1/#2 + gesplittete KO-Siegerteams
              (Best of Three). Courage (15–22): Punkte-Modus.
     Phase 4  Finals — Grande Finale, Platz 3, Courage-Finale
              (alle Best of Three, parallel).
═══════════════════════════════════════════════════════════════ */

import { computeMatchTier } from './padelStyles.js';

export const CUP_PIN='1862';

export const CUP_PHASES=[
  {id:'gruppe', name:'Gruppenphase', sub:'6 Runden à 10 Min'},
  {id:'ko',     name:'KO-Phase',     sub:'Rang 3–14 · 30 Min'},
  {id:'hf',     name:'Halbfinals',   sub:'DNA Bo3 · Courage Punkte'},
  {id:'finals', name:'Finals',       sub:'Grande · Platz 3 · Courage'},
];

/* Warnmeldungs-Presets für Center-/Court-Screens (Banner-Toast im
   Warn-Look: Titel + Untertitel + optionaler CTA-Pill). icon ist
   ein Schlüssel — die Icon-Komponente mappt der Screen. */
export const CUP_WARN='#FFC93D'; // Warn-Gelb (Event-Branding, wie PCOLS Daten)
export const CUP_ALERTS=[
  {id:'points', label:'Punkte eintragen!', icon:'warn',
    sub:'Bitte trage die Ergebnisse deiner Spiele ein.', cta:'Jetzt eintragen'},
  {id:'warmup', label:'Warm-Up!',          icon:'ball',
    sub:'Macht euch bereit — gleich geht es los.'},
  {id:'pause',  label:'Pause!',            icon:'pause',
    sub:'Kurze Pause — gleich geht es weiter.'},
];

/* ── Fester Gruppen-Spielplan (vom Plakat) ────────────────────────
   6 Runden × 3 Courts, Spielernummern P1–P22. Jede Runde spielen 12,
   10 pausieren; P1/P5/P9/P15/P17/P22 kommen auf 4 Einsätze, alle
   anderen auf 3 (72 Slots gesamt). Im Admin frei editierbar. */
export const CUP_SPIELPLAN=[
  [ [[1,5],[2,6]],    [[3,7],[4,8]],    [[9,12],[10,11]]  ],
  [ [[1,14],[13,17]], [[12,19],[15,16]],[[18,22],[20,21]] ],
  [ [[2,9],[3,13]],   [[7,18],[11,15]], [[5,22],[14,19]]  ],
  [ [[1,9],[4,20]],   [[6,21],[8,15]],  [[10,22],[16,17]] ],
  [ [[5,16],[7,9]],   [[1,18],[3,12]],  [[11,21],[17,19]] ],
  [ [[4,22],[6,13]],  [[5,17],[15,20]], [[2,14],[8,10]]   ],
];

/* ── Initialer Cup-State ──────────────────────────────────────────
   players: Spielernummer (num) ist die IDENTITÄT auf dem Plakat —
   unabhängig von der späteren Leaderboard-Platzierung (rank), die
   die KO-Phase aussteuert. style = RITMO-Spielstil (Extra-Punkte).
   inAt = Check-in-Zeitstempel (Tickets-Screen am Einlass); ältere
   gespeicherte States haben das Feld nicht — undefined gilt als
   nicht eingecheckt. */
export function initialCupState(){
  const players=Array.from({length:22},(_,i)=>({
    num:i+1, name:'', style:null, adj:0, inAt:null,
  }));
  const matches=[];
  CUP_SPIELPLAN.forEach((runde,r)=>{
    runde.forEach((m,c)=>{
      matches.push({
        id:`g${r+1}c${c+1}`, phase:'gruppe', round:r+1, court:c+1,
        t1:[...m[0]], t2:[...m[1]], s1:null, s2:null, done:false,
      });
    });
  });
  return {
    v:1,
    createdAt:null,          // wird beim ersten Speichern gestempelt
    phase:'gruppe',          // aktive Phase (steuert Center/Court)
    activeRound:1,           // aktive Gruppen-Runde (1..6)
    players,
    matches,                 // gruppe sofort, ko/hf/finals via Generator
    alert:null,              // {id,label,icon,ts} — Toast für Screens
    locks:{1:false,2:false,3:false}, // Court-Screens: Punkteeingabe gesperrt
    // Kiosk-Hinweis: die Court-Ansicht ist IMMER fixiert — der Exit
    // am Tablet verlangt grundsätzlich den PIN (kein Schalter nötig).
    // Runden-Timer (Center Screen): sec = eingestellte Dauer;
    // laufend = startedAt gesetzt (Restzeit wird aus dem Timestamp
    // berechnet — synct ohne Tick-Traffic); pausiert = left gesetzt.
    timer:{sec:600,startedAt:null,left:null},
  };
}

/* Match-Tier eines Cup-Matches aus den Spielstilen der 4 Spieler.
   null, solange nicht alle vier einen Stil haben. */
export function cupMatchTier(players,m){
  const styleOf=n=>players.find(p=>p.num===n)?.style;
  return computeMatchTier(m.t1.map(styleOf),m.t2.map(styleOf));
}

/* ── Leaderboard ─────────────────────────────────────────────────
   Punkte: Team-Score jedes abgeschlossenen GRUPPEN-Matches wird
   beiden Partnern gutgeschrieben; adj = manuelle Admin-Korrektur.
   EXTRA-PUNKTE (Spielstil-Mechanik): das SIEGER-Team eines fertigen
   Gruppen-Matches bekommt pro Spieler einen Tier-Bonus — Bonus =
   Sterne des Match-Tiers (S=+5 · A=+4 · B=+3 · C=+2 · X=+1).
   Ohne vollständige Stile gibt es kein Tier und keinen Bonus;
   Unentschieden ⇒ kein Sieger ⇒ kein Bonus.
   Sortierung: Gesamt → Siege → Spielernummer (deterministisch).
   rank (1..22) steuert KO-/Courage-Aussteuerung. */
export function cupLeaderboard(state){
  const rows={};
  state.players.forEach(p=>{rows[p.num]={num:p.num,name:p.name,style:p.style,
    pts:0,wins:0,played:0,tierBonus:0,adj:p.adj||0};});
  state.matches.filter(m=>m.phase==='gruppe'&&m.done).forEach(m=>{
    const s1=m.s1??0,s2=m.s2??0;
    m.t1.forEach(n=>{if(!rows[n])return;rows[n].pts+=s1;rows[n].played++;if(s1>s2)rows[n].wins++;});
    m.t2.forEach(n=>{if(!rows[n])return;rows[n].pts+=s2;rows[n].played++;if(s2>s1)rows[n].wins++;});
    const tier=cupMatchTier(state.players,m);
    const winners=s1>s2?m.t1:s2>s1?m.t2:null;
    if(tier&&winners) winners.forEach(n=>{if(rows[n])rows[n].tierBonus+=tier.stars;});
  });
  const list=Object.values(rows).map(r=>({...r,total:r.pts+r.tierBonus+r.adj}));
  list.sort((a,b)=>b.total-a.total||b.wins-a.wins||a.num-b.num);
  list.forEach((r,i)=>{r.rank=i+1;});
  return list;
}

/* Kleine Helfer für die Generatoren. */
const byRank=lb=>{const m={};lb.forEach(r=>{m[r.rank]=r.num;});return m;};
const winnerOf=m=>(m.s2??0)>(m.s1??0)?m.t2:m.t1;
const loserOf =m=>(m.s2??0)>(m.s1??0)?m.t1:m.t2;

/* ── KO-Phase erzeugen (Rang 3–14, gespiegelt) ────────────────────
   Court 1: 3+14 vs 4+13 · Court 2: 5+12 vs 6+11 · Court 3: 7+10 vs 8+9
   — jede Vierergruppe hat Rangsumme 17 (maximal ausgeglichen). */
export function genCupKO(lb){
  const R=byRank(lb);
  return [
    {id:'ko1',phase:'ko',court:1,t1:[R[3],R[14]],t2:[R[4],R[13]],s1:null,s2:null,done:false},
    {id:'ko2',phase:'ko',court:2,t1:[R[5],R[12]],t2:[R[6],R[11]],s1:null,s2:null,done:false},
    {id:'ko3',phase:'ko',court:3,t1:[R[7],R[10]],t2:[R[8],R[9]], s1:null,s2:null,done:false},
  ];
}

/* Courage-Halbfinals (Rang 15–22, gespiegelt, Punkte-Modus). */
export function genCupCourageHF(lb){
  const R=byRank(lb);
  return [
    {id:'chf1',phase:'courage-hf',court:3,t1:[R[15],R[22]],t2:[R[16],R[21]],s1:null,s2:null,done:false},
    {id:'chf2',phase:'courage-hf',court:3,t1:[R[17],R[20]],t2:[R[18],R[19]],s1:null,s2:null,done:false},
  ];
}

/* ── DNA-Halbfinals erzeugen (der Plakat-Split) ───────────────────
   Die 3 KO-Siegerteams werden GETRENNT: Spieler A (der besser
   platzierte des Duos) in HF1, Partner B in HF2. Dazu #1 und #2:
     HF1: #1 + KO1-A  vs  KO2-A + KO3-A   (Court 1, Bo3)
     HF2: #2 + KO1-B  vs  KO2-B + KO3-B   (Court 2, Bo3)
   Gibt null zurück, solange nicht alle 3 KO-Matches done sind. */
export function genCupHF(state,lb){
  const kos=['ko1','ko2','ko3'].map(id=>state.matches.find(m=>m.id===id));
  if(kos.some(m=>!m||!m.done)) return null;
  const rankOf=n=>lb.find(r=>r.num===n)?.rank??99;
  const split=m=>{const w=[...winnerOf(m)].sort((a,b)=>rankOf(a)-rankOf(b));return {A:w[0],B:w[1]};};
  const[w1,w2,w3]=kos.map(split);
  const R=byRank(lb);
  return [
    {id:'hf1',phase:'hf',court:1,t1:[R[1],w1.A],t2:[w2.A,w3.A],s1:null,s2:null,done:false,bo3:true},
    {id:'hf2',phase:'hf',court:2,t1:[R[2],w1.B],t2:[w2.B,w3.B],s1:null,s2:null,done:false,bo3:true},
  ];
}

/* ── Finals erzeugen ──────────────────────────────────────────────
   Grande Finale (Court 1): Sieger HF1 vs Sieger HF2.
   Platz 3 (Court 2): Verlierer HF1 vs Verlierer HF2.
   Courage-Finale (Court 3): Sieger der beiden Courage-HF (Teams
   bleiben zusammen). Alle Best of Three. null solange HF offen. */
export function genCupFinals(state){
  const hf1=state.matches.find(m=>m.id==='hf1');
  const hf2=state.matches.find(m=>m.id==='hf2');
  const chf1=state.matches.find(m=>m.id==='chf1');
  const chf2=state.matches.find(m=>m.id==='chf2');
  if(!hf1?.done||!hf2?.done||!chf1?.done||!chf2?.done) return null;
  return [
    {id:'final', phase:'finals',court:1,t1:[...winnerOf(hf1)],t2:[...winnerOf(hf2)],s1:null,s2:null,done:false,bo3:true,title:'Grande Finale'},
    {id:'platz3',phase:'finals',court:2,t1:[...loserOf(hf1)], t2:[...loserOf(hf2)], s1:null,s2:null,done:false,bo3:true,title:'Spiel um Platz 3'},
    {id:'cfinal',phase:'finals',court:3,t1:[...winnerOf(chf1)],t2:[...winnerOf(chf2)],s1:null,s2:null,done:false,bo3:true,title:'Courage-Finale'},
  ];
}

/* Anzeige-Helfer: "P7 - Max" (P-Nummer per Bindestrich vom Namen
   getrennt) bzw. "P7" ohne Namen. short = nur Vorname. */
export function cupPlayerLabel(state,num,short=false){
  const p=state.players.find(x=>x.num===num);
  if(!p) return `P${num}`;
  const nm=(p.name||'').trim();
  if(!nm) return `P${num}`;
  return short?`P${num} - ${nm.split(/\s+/)[0]}`:`P${num} - ${nm}`;
}

/* Duplikat-Check der Spielernummern (Admin-Warnung). */
export function cupDuplicateNums(players){
  const seen={},dup=new Set();
  players.forEach(p=>{if(seen[p.num])dup.add(p.num);seen[p.num]=true;});
  return dup;
}
