/* ═══════════════════════════════════════════════════════════════
   TOURNAMENT LOGIC — Round generation + leaderboard for Americano
   and Mexicano.

   Pure functions. Both round generators:
     - Compute number of courts (min(maxCourts, ⌊players/4⌋))
     - Fair sit-out: prefer players with fewest prior sit-outs
     - Return {courts:[{id,t1,t2,s1,s2,done}], sitOut:[id]}

   Americano, Team-Americano, Mixicano und King-of-the-Court (Runde 1)
   paaren ueber EINEN Optimierer (anneal): mehrere Zufallsstarts, dann
   Bergabstieg auf die Runde mit den wenigsten Wiederholungen. Die
   Kosten stehen bei meetCost — Partner schwerer als Gegner, und ein
   Anteil auf jede Begegnung ueberhaupt, damit „jeder gegen jeden"
   nicht daran scheitert, dass zwei Leute nur die Netzseite wechseln.

   Mexicano und Team-Mexicano paaren nach Tabellenstand (1+4 vs 2+3
   bzw. 1. gegen 2.). Frei ist dort nur die Reihenfolge unter
   Punktgleichen — und genau die nutzt derselbe Optimierer.

   Ueber Turniere hinweg zaehlt ein kleines Gedaechtnis mit
   (meetLog/priorFromLog): gedaempft und gedeckelt, damit es eine
   Wiederholung im laufenden Turnier nie aufwiegt.

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

/* ── Einzel-Courts (1v1) ──────────────────────────────────────────
   singles[i]=true ⇒ Court i ist ein Einzel-Court: 2 Spieler (1v1)
   statt 4 (2v2). planCourts liefert die Kapazitäten der nutzbaren
   Courts in Index-Reihenfolge; passt ein Court nicht mehr komplett
   in die Restspieler, bleibt er (und alles dahinter) leer — die
   Reihenfolge bleibt so vorhersehbar (Court-Namen!). Ein 1v1-Match
   trägt single:true und 1er-Teams (t1:[a], t2:[b]) — calcLeaderboard
   und die Court-Karten arbeiten team-agnostisch damit. */
const planCourts=(numPlayers,maxCourts,singles)=>{
  const caps=[];let used=0;
  const lim=maxCourts||Math.ceil(numPlayers/2);
  for(let i=0;i<lim;i++){
    const cap=singles?.[i]?2:4;
    if(used+cap>numPlayers)break;
    caps.push(cap);used+=cap;
  }
  return caps;
};

/* ── BEGEGNUNGEN ZAEHLEN ──────────────────────────────────────────
   Wer hat mit wem gespielt, wer gegen wen. Beides getrennt, weil
   „jeder gegen jeden" beide Seiten meint: einmal zusammen im Team
   und einmal auf der anderen Netzseite sind zwei verschiedene
   Begegnungen. Einzel-Courts liefern nur Gegner-Paare. */
const pairKey=(a,b)=>a<b?`${a}_${b}`:`${b}_${a}`;

export function meetCounts(history=[]){
  const partner=new Map(),opp=new Map();
  const bump=(m,a,b)=>{const k=pairKey(a,b);m.set(k,(m.get(k)||0)+1);};
  history.forEach(r=>(r.courts||[]).forEach(m=>{
    const t1=m.t1||[],t2=m.t2||[];
    if(t1.length>1) bump(partner,t1[0],t1[1]);
    if(t2.length>1) bump(partner,t2[0],t2[1]);
    t1.forEach(a=>t2.forEach(b=>bump(opp,a,b)));
  }));
  return {partner,opp};
}

/* ── GEDAECHTNIS UEBER TURNIERE HINWEG ────────────────────────────
   Innerhalb eines Turniers weiss der Generator aus der Historie, wer
   schon mit wem gespielt hat. Ueber Turniere hinweg wusste er es
   nicht — und dieselbe Stammgruppe bekam Woche fuer Woche aehnliche
   Paarungen, weil jedes Turnier bei null anfing.

   Deshalb fuehrt die App ein kleines Gedaechtnis: die Begegnungen der
   letzten MEET_LOG_MAX Turniere, ueber NAMEN statt ids (die id ist
   nur die Listenposition und gilt nur innerhalb eines Turniers).
   Ein Eintrag je Turnier, ersetzt sich selbst — wer dasselbe Turnier
   zweimal wegschreibt, zaehlt es trotzdem einmal.

   Das Gedaechtnis ist ein Tiebreaker, kein Gesetz: PRIOR_CAP und
   PRIOR_W sind so gewaehlt, dass es eine Wiederholung IM LAUFENDEN
   Turnier nie aufwiegen kann (siehe meetCost). */
export const MEET_LOG_MAX=6;
export const meetName=n=>String(n||'').trim().toLowerCase();

export function meetLogEntry(players,rounds){
  const nm=new Map((players||[]).map(p=>[p.id,meetName(p.name)]));
  const pairs={};
  const bump=(a,b,i)=>{
    const na=nm.get(a),nb=nm.get(b);
    if(!na||!nb||na===nb) return;
    const k=na<nb?`${na}|${nb}`:`${nb}|${na}`;
    (pairs[k]||(pairs[k]=[0,0]))[i]++;
  };
  (rounds||[]).forEach(r=>(r.courts||[]).forEach(m=>{
    const t1=m.t1||[],t2=m.t2||[];
    if(t1.length>1) bump(t1[0],t1[1],0);
    if(t2.length>1) bump(t2[0],t2[1],0);
    t1.forEach(a=>t2.forEach(b=>bump(a,b,1)));
  }));
  return pairs;
}

export function pushMeetLog(log,id,pairs){
  if(!pairs||!Object.keys(pairs).length) return Array.isArray(log)?log:[];
  const rest=(Array.isArray(log)?log:[]).filter(e=>e&&e.id!==id);
  return [...rest,{id,pairs}].slice(-MEET_LOG_MAX);
}

/* Log (Namen) → Karten fuer genau dieses Feld (ids). Wer heute nicht
   dabei ist, faellt still raus; wer neu ist, hat eine leere Akte. */
export function priorFromLog(players,log){
  const partner=new Map(),opp=new Map();
  if(!Array.isArray(log)||!log.length) return {partner,opp};
  const byName=new Map();
  (players||[]).forEach(p=>{const k=meetName(p.name);if(k&&!byName.has(k))byName.set(k,p.id);});
  if(byName.size<2) return {partner,opp};
  log.forEach(e=>Object.entries(e?.pairs||{}).forEach(([k,v])=>{
    const i=k.indexOf('|'); if(i<0) return;
    const a=byName.get(k.slice(0,i)),b=byName.get(k.slice(i+1));
    if(a===undefined||b===undefined||a===b) return;
    const key=pairKey(a,b);
    if(v?.[0]) partner.set(key,(partner.get(key)||0)+v[0]);
    if(v?.[1]) opp.set(key,(opp.get(key)||0)+v[1]);
  }));
  return {partner,opp};
}

/* ── KOSTEN EINER PAARUNG ─────────────────────────────────────────
   Ein zweites Mal mit demselben Partner faellt staerker auf als ein
   zweites Mal gegen dieselbe Person — deshalb wiegt Partner schwerer.

   W_MEET ist der Teil, der „jeder gegen jeden" erzwingt: er zaehlt
   jede Begegnung, egal ob mit oder gegen. Ohne ihn waeren zwei
   Leute, die dreimal zusammen im Team standen, als Gegner gratis —
   und es entstand das Feld, in dem sich immer dieselben Gesichter
   begegnen, waehrend zwei andere sich nie sehen.

   Die Kosten wachsen linear mit der Zahl der bisherigen Begegnungen:
   das dritte Treffen kostet doppelt so viel wie das zweite, wodurch
   sich Wiederholungen von selbst ueber das Feld verteilen, statt sich
   auf ein Paar zu haeufen.

   Die Abstaende zwischen den Gewichten sind bewusst gross — sie
   bilden eine Rangfolge, keine Abwaegung:

     1. keinen Partner zweimal          (W_PARTNER)
     2. dann keinen Gegner zweimal      (W_OPP)
     3. dann Begegnungen gleich streuen (W_MEET)

   Mit engeren Abstaenden kippt Stufe 3 die Stufe 1: ein Court hat
   zwei Partner-, aber vier Gegner-Paare, und vier kleine Ersparnisse
   kaufen dann eine Partner-Wiederholung. Genau das ist passiert —
   bei 8 Spielern und 7 Runden, wo jeder mit jedem genau einmal
   spielen kann und eine Wiederholung sofort auffaellt.

   Turniere davor liegen als eigener, kleiner Summand daneben
   (W_PRIOR, gedeckelt auf PRIOR_CAP): genug, um einen Gleichstand zu
   entscheiden, zu wenig, um irgendeine der drei Stufen zu kippen. */
const W_PARTNER=60, W_OPP=8, W_MEET=1, W_MATCH=40;
const W_PRIOR=0.3, PRIOR_CAP=2;

export function meetCost(history=[],prior=null,ids=null){
  const {partner,opp}=meetCounts(history);
  const pp=prior?.partner,po=prior?.opp;
  const cap=v=>Math.min(v||0,PRIOR_CAP);
  const pCost=k=>{const p=partner.get(k)||0,o=opp.get(k)||0;
    return W_PARTNER*p+W_MEET*(p+o)+W_PRIOR*(2*cap(pp?.get(k))+cap(po?.get(k)));};
  const oCost=k=>{const p=partner.get(k)||0,o=opp.get(k)||0;
    return W_OPP*o+W_MEET*(p+o)+W_PRIOR*(cap(pp?.get(k))+cap(po?.get(k)));};
  if(!ids) return {partner:(a,b)=>pCost(pairKey(a,b)),opp:(a,b)=>oCost(pairKey(a,b))};
  // Kosten einmal als Tabelle. Der Optimierer fragt sie zehntausendfach
  // ab; jedes Mal einen Schluessel-String zu bauen und in einer Map
  // nachzuschlagen war der Loewenanteil der Rechenzeit.
  const at=new Map(ids.map((id,i)=>[id,i]));
  const n=ids.length;
  const P=new Float64Array(n*n),O=new Float64Array(n*n);
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
    const k=pairKey(ids[i],ids[j]),pv=pCost(k),ov=oCost(k);
    P[i*n+j]=P[j*n+i]=pv; O[i*n+j]=O[j*n+i]=ov;
  }
  const idx=(a,b)=>{const i=at.get(a),j=at.get(b);return i===undefined||j===undefined?-1:i*n+j;};
  return {
    partner:(a,b)=>{const k=idx(a,b);return k<0?pCost(pairKey(a,b)):P[k];},
    opp:    (a,b)=>{const k=idx(a,b);return k<0?oCost(pairKey(a,b)):O[k];},
  };
}

/* ── OPTIMIERER ───────────────────────────────────────────────────
   Bergabstieg mit mehreren Zufallsstarts: zwei Plaetze tauschen,
   solange es billiger wird, das Ganze aus verschiedenen zufaelligen
   Anfangsaufstellungen. Frueher nahm der Generator den ERSTEN Wurf
   ohne Wiederholung und fiel nach 60 Fehlversuchen auf reinen Zufall
   zurueck — genau in den spaeten Runden, wo Struktur am meisten
   zaehlt. Jetzt gibt es keinen Absturz mehr: schlimmstenfalls die am
   wenigsten schlechte Loesung.

   Der Zufallsstart ist zugleich das, was zwei Turniere mit demselben
   Feld verschieden aussehen laesst — bei Kostengleichstand entscheidet
   er, nicht eine feste Reihenfolge.

   cells sind die Gruppen von Plaetzen, die zusammen einen Court (bzw.
   eine Begegnung) ergeben; jeder Platz liegt in genau einer. Ein
   Tausch beruehrt damit hoechstens ZWEI Courts, und nur die werden
   neu gerechnet. Mit der vollen Rundenkosten-Rechnung je Probetausch
   brauchte eine Runde bei 24 Spielern rund 90 ms — auf einem Telefon
   ein sichtbares Stocken beim Rundenwechsel.

   blocks grenzt ein, welche Plaetze ueberhaupt tauschen duerfen. Damit
   laeuft derselbe Optimierer auch dort, wo die Reihenfolge feststeht
   und nur Gleichstaende frei sind (Mexicano) oder zwei Gruppen
   getrennt bleiben muessen (Mixicano). */
function anneal(items,cells,cellCost,{starts=20,passes=8,blocks=null}={}){
  const n=items.length;
  const owner=new Array(n).fill(-1);
  cells.forEach((c,ci)=>c.forEach(k=>{if(k>=0&&k<n)owner[k]=ci;}));
  const bl=(blocks||[[0,n]]).filter(([a,b])=>b-a>1);
  const cc=new Array(cells.length).fill(0);
  const total=s=>{let t=0;for(let c=0;c<cells.length;c++){cc[c]=cellCost(s,cells[c]);t+=cc[c];}return t;};
  // Kein Start aus der unveraenderten Liste: in Runde 1 ist noch nichts
  // gespielt, jede Aufstellung kostet 0 — und die erste, die geprueft
  // wird, gewinnt. Das war die Anmeldeliste, Turnier fuer Turnier
  // dieselbe: 1+2 gegen 3+4 auf Court 1. Der erste Wurf ist deshalb
  // immer ein gemischter.
  let best=null,bestC=Infinity;
  for(let a=0;a<starts;a++){
    const s=[...items];
    bl.forEach(([lo,hi])=>{const part=shuffle(s.slice(lo,hi));for(let i=lo;i<hi;i++)s[i]=part[i-lo];});
    let cur=total(s);
    for(let pass=0;pass<passes&&cur>0;pass++){
      let moved=false;
      for(const [lo,hi] of bl)
        for(let i=lo;i<hi-1;i++)
          for(let j=i+1;j<hi;j++){
            const ci=owner[i],cj=owner[j];
            if(ci<0&&cj<0) continue;          // Platz ohne Court — Tausch aendert nichts
            const one=cj<0||cj===ci;
            const before=(ci<0?0:cc[ci])+(one?0:cc[cj]);
            [s[i],s[j]]=[s[j],s[i]];
            const nci=ci<0?0:cellCost(s,cells[ci]);
            const ncj=one?0:cellCost(s,cells[cj]);
            if(nci+ncj<before-1e-9){
              if(ci>=0)cc[ci]=nci;
              if(!one)cc[cj]=ncj;
              cur+=nci+ncj-before;moved=true;
            }else [s[i],s[j]]=[s[j],s[i]];
          }
      if(!moved) break;
    }
    if(cur<bestC){bestC=cur;best=s;}
    if(bestC<=0) break;
  }
  return best||[...items];
}

/* ── SITZORDNUNG → COURTS ─────────────────────────────────────────
   Eine Sitzordnung wird der Reihe nach in die Courts gefuellt
   (cap 2 ⇒ 1v1, cap 4 ⇒ 2v2). split sagt, wie die Vier auf die
   Netzseiten geht — beim Americano die ersten zwei gegen die letzten
   zwei, beim Mexicano 1+4 gegen 2+3. */
const SPLIT_FREE=g=>[[g[0],g[1]],[g[2],g[3]]];
const SPLIT_RANK=g=>[[g[0],g[3]],[g[1],g[2]]];

const seatsToCourts=(seats,caps,split)=>{
  const courts=[];let p=0;
  caps.forEach((cap,ci)=>{
    if(cap===2){
      courts.push({id:`c${ci}`,t1:[seats[p]],t2:[seats[p+1]],s1:null,s2:null,done:false,single:true});
      p+=2;
    }else{
      const [t1,t2]=split(seats.slice(p,p+4));
      courts.push({id:`c${ci}`,t1,t2,s1:null,s2:null,done:false});
      p+=4;
    }
  });
  return courts;
};

/* Platzgruppen: je Court die Plaetze, die darauf stehen. */
const seatCells=caps=>{const out=[];let p=0;
  caps.forEach(cap=>{out.push(Array.from({length:cap},(_,k)=>p+k));p+=cap;});return out;};

const seatCellCost=(split,mc)=>(s,cell)=>{
  if(cell.length===2) return mc.opp(s[cell[0]],s[cell[1]]);
  const [t1,t2]=split(cell.map(k=>s[k]));
  let c=mc.partner(t1[0],t1[1])+mc.partner(t2[0],t2[1]);
  t1.forEach(a=>t2.forEach(b=>{c+=mc.opp(a,b);}));
  return c;
};

/* Faire Pause: wer am wenigsten pausiert hat, pausiert als Naechstes.
   Gleichstand entscheidet der Zufall — das ist die Stelle, an der
   zwei Turniere mit demselben Feld auseinanderlaufen duerfen. */
const sitCount=(history,id)=>history.filter(r=>r.sitOut?.includes(id)).length;
const pickSitOut=(ids,history,numSit)=>numSit>0
  ? ids.map(id=>({id,c:sitCount(history,id),r:Math.random()}))
       .sort((a,b)=>a.c-b.c||a.r-b.r).slice(0,numSit).map(x=>x.id)
  : [];

export function genAmericanoRound(playerIds,history=[],maxCourts=null,singles=[],prior=null){
  const mc=meetCost(history,prior,playerIds);
  const caps=planCourts(playerIds.length,maxCourts,singles);
  const numSit=playerIds.length-caps.reduce((a,b)=>a+b,0);
  const sitOut=pickSitOut(playerIds,history,numSit);
  const playing=playerIds.filter(id=>!sitOut.includes(id));
  const seats=anneal(playing,seatCells(caps),seatCellCost(SPLIT_FREE,mc));
  return {courts:seatsToCourts(seats,caps,SPLIT_FREE),sitOut};
}

/* ── MEXICANO ─────────────────────────────────────────────────────
   Die Tabelle bestimmt die Paarung: je vier Nachbarn bilden einen
   Court, 1+4 gegen 2+3. Das ist das Format und bleibt unangetastet.

   Frei ist nur eines: die Reihenfolge unter Punktgleichen. Die war
   bisher die Listenreihenfolge — in Runde 1 steht die ganze Tabelle
   auf null, und damit spielte Court 1 jedes Mal 1+4 gegen 2+3 der
   Anmeldeliste. Jetzt entscheidet unter Gleichstand die Historie:
   dieselbe Tabelle, aber die Begegnungen, die es noch nicht gab. */
export function genMexicanoRound(playerIds,leaderboard,maxCourts=null,history=[],singles=[],prior=null){
  const mc=meetCost(history,prior,playerIds);
  const caps=planCourts(playerIds.length,maxCourts,singles);
  const numSit=playerIds.length-caps.reduce((a,b)=>a+b,0);
  const sitOut=pickSitOut(playerIds,history,numSit);
  const playing=playerIds.filter(id=>!sitOut.includes(id));

  // Rang = Position in der (vom Aufrufer sortierten) Tabelle. Ueber
  // pts zu sortieren wuerde Pausen-Boni und Host-Korrekturen
  // uebergehen, die dort laengst eingerechnet sind.
  const lb=new Map((leaderboard||[]).map((x,i)=>[x.id,i]));
  const val=id=>{const x=(leaderboard||[])[lb.get(id)];
    return x?`${x.totalPts??x.pts??0}/${x.totalWins??x.wins??0}`:'-';};
  const ranked=[...playing].sort((a,b)=>(lb.get(a)??1e9)-(lb.get(b)??1e9));

  // Gleichstands-Bloecke: nur innerhalb dieser Bloecke darf getauscht
  // werden, die Tabellenordnung bleibt damit exakt erhalten.
  const blocks=[];let lo=0;
  for(let i=1;i<=ranked.length;i++){
    if(i===ranked.length||val(ranked[i])!==val(ranked[lo])){ if(i-lo>1) blocks.push([lo,i]); lo=i; }
  }
  const seats=blocks.length
    ? anneal(ranked,seatCells(caps),seatCellCost(SPLIT_RANK,mc),{blocks})
    : ranked;
  return {courts:seatsToCourts(seats,caps,SPLIT_RANK),sitOut};
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

/* Kurzregeln je Format — Inhalt für den Info-Aufklapper in der
   Format-Karte des Konfigurators. Bewusst knapp: was gespielt wird,
   wie RITMO paart und wer gewinnt. Die ausführliche Fassung steht in
   der Regel-Bibel. */
export const FORMAT_RULES={
  americano:[
    ['Prinzip','Doppel mit wechselnden Partnern — jede Runde werden neu gemischt.'],
    ['Paarung','Jede Runde wird so gelost, dass möglichst neue Partner UND neue Gegner entstehen.'],
    ['Wertung','Individuell: jede:r sammelt eigene Punkte, unabhängig vom Partner.'],
    ['Passt für','Gemischte Spielstärken — jede:r spielt mit jedem.'],
  ],
  mexicano:[
    ['Prinzip','Americano mit Leistungsprinzip: die Tabelle bestimmt, wer gegen wen spielt.'],
    ['Paarung','Je vier Nachbarn der Tabelle bilden einen Court — 1+4 gegen 2+3. Bei Punktgleichstand entscheidet, wer noch nicht gegeneinander gespielt hat.'],
    ['Wertung','Individuell. Nach jeder Runde wird die Tabelle neu sortiert.'],
    ['Passt für','Ausgeglichene Matches — die Spitze spielt gegen die Spitze.'],
  ],
  teamamericano:[
    ['Prinzip','Feste Paare über das ganze Turnier, nur die Gegner rotieren.'],
    ['Teams','Nach Listen-Reihenfolge: 1+2, 3+4, … — dafür braucht es eine gerade Spielerzahl.'],
    ['Paarung','So gelost, dass jedes Team gegen jedes andere spielt, bevor sich eine Begegnung wiederholt.'],
    ['Wertung','Beide Team-Mitglieder bekommen dieselben Punkte.'],
  ],
  teammexicano:[
    ['Prinzip','Feste Paare, Gegner nach Tabellenstand statt zufällig.'],
    ['Teams','Nach Listen-Reihenfolge: 1+2, 3+4, … — gerade Spielerzahl nötig.'],
    ['Paarung','Tabellennachbarn treffen aufeinander: 1. gegen 2., 3. gegen 4. und so weiter.'],
    ['Wertung','Beide Team-Mitglieder bekommen dieselben Punkte.'],
  ],
  mixicano:[
    ['Prinzip','Mixed-Format: jedes Team besteht aus einer Person aus Gruppe A und einer aus Gruppe B.'],
    ['Gruppen','Zuweisung über den A/B-Knopf neben den Namen — mindestens zwei pro Gruppe.'],
    ['Paarung','Partner und Gegner wechseln jede Runde, die Gruppen-Mischung bleibt erhalten.'],
    ['Wertung','Individuell wie beim Americano.'],
  ],
  kingofcourt:[
    ['Prinzip','Court 1 ist der Thron: wer gewinnt, rückt auf, wer verliert, rutscht ab.'],
    ['Paarung','Sieger steigen einen Court hoch, Verlierer einen runter; auf jedem Court wird neu gemischt.'],
    ['Wertung','Individuell — entscheidend ist, wie weit oben man am Ende steht.'],
    ['Wichtig','Jedes Match braucht einen Sieger — bei Gleichstand Golden Point spielen.'],
  ],
  knockout:[
    ['Prinzip','K.-o.-System mit festen Teams: wer verliert, ist raus.'],
    ['Teams','Nach Listen-Reihenfolge: 1+2, 3+4, … — gerade Spielerzahl nötig.'],
    ['Ablauf','Jede Runde halbiert das Feld bis zum Finale; bei ungerader Team-Zahl gibt es ein Freilos.'],
    ['Wichtig','Unentschieden gibt es nicht — bei Gleichstand entscheidet der Golden Point.'],
  ],
};

/* ── Gemeinsame Helfer ── */
// Feste Teams aus der Listen-Reihenfolge: (1,2)(3,4)… = Setzliste.
export const fixedTeams=ids=>{const t=[];for(let i=0;i+1<ids.length;i+=2)t.push([ids[i],ids[i+1]]);return t;};
const teamKey=t=>`${Math.min(t[0],t[1])}_${Math.max(t[0],t[1])}`;
// Platzgruppen bei Team-Formaten: je Begegnung zwei Plaetze.
const duelCells=n=>{const out=[];for(let i=0;i+1<n;i+=2)out.push([i,i+1]);return out;};
const matchKey=(a,b)=>[teamKey(a),teamKey(b)].sort().join('|');
// Sieger/Verlierer eines Courts. Gleichstand → t1 (dokumentiert:
// K.-o./King brauchen einen Sieger — Golden Point spielen).
const winnerOf=m=>(m.s2??0)>(m.s1??0)?m.t2:m.t1;
const loserOf =m=>(m.s2??0)>(m.s1??0)?m.t1:m.t2;

/* ── TEAM-AMERICANO ───────────────────────────────────────────────
   Feste Paare (Setzliste), nur die Gegner rotieren. Das Versprechen
   des Formats ist „jedes Team gegen jedes andere" — bisher wurde es
   per Zufall angenaehert: bis zu 60 Wuerfe ohne Wiederholung, danach
   reiner Zufall. Bei sechs Teams und neun Runden lief das zuverlaessig
   auf Begegnungen hinaus, die es dreimal gab, waehrend andere nie
   stattfanden.

   Jetzt sucht derselbe Optimierer wie beim Americano die Runde mit
   den wenigsten Wiederholungen. Kosten je Begegnung: das Matchup
   selbst (W_MATCH) plus die vier Spieler-Begegnungen darin — so
   zaehlt auch, wer sich ueber Turniere hinweg schon oft gegenueber
   stand, selbst wenn die Teams damals anders geschnitten waren. */
export function genTeamAmericanoRound(playerIds,history=[],maxCourts=null,prior=null){
  const mc=meetCost(history,prior,playerIds);
  const teams=fixedTeams(playerIds);
  const cap=Math.floor(teams.length/2);
  const numCourts=Math.max(1,maxCourts?Math.min(maxCourts,cap):cap);
  const numSit=teams.length-numCourts*2;
  const played=new Map();
  history.forEach(r=>(r.courts||[]).forEach(m=>{
    const k=matchKey(m.t1,m.t2);played.set(k,(played.get(k)||0)+1);}));
  // Team-Pause zaehlt ueber Mitglied 0 (Teams pausieren als Einheit).
  const bySit=teams.map(t=>({t,c:sitCount(history,t[0]),r:Math.random()}))
    .sort((a,b)=>a.c-b.c||a.r-b.r);
  const sitTeams=numSit>0?bySit.slice(0,numSit).map(x=>x.t):[];
  const sitKeys=new Set(sitTeams.map(teamKey));
  const active=teams.filter(t=>!sitKeys.has(teamKey(t)));
  const duel=(a,b)=>W_MATCH*(played.get(matchKey(a,b))||0)
    +a.reduce((s,x)=>s+b.reduce((t,y)=>t+mc.opp(x,y),0),0);
  const cells=duelCells(active.length);
  const order=anneal(active,cells,(s,c)=>duel(s[c[0]],s[c[1]]));
  const courts=[];
  for(let i=0;i+1<order.length;i+=2)
    courts.push({id:`c${i/2}`,t1:order[i],t2:order[i+1],s1:null,s2:null,done:false});
  return {courts,sitOut:sitTeams.flat()};
}

/* ── TEAM-MEXICANO ────────────────────────────────────────────────
   Feste Paare, Gegner nach Tabellenstand: Team-Rang = Summe der
   Ranglisten-Positionen beider Mitglieder (aufsteigend = besser).
   1. vs 2. auf Court 1, 3. vs 4. auf Court 2 usw. Pausen fair
   rotiert. Wie beim Mexicano ist nur der Gleichstand frei — und
   Runde 1 ist ein einziger Gleichstand, weshalb dort frueher immer
   die Setzliste gegen sich selbst antrat. */
export function genTeamMexicanoRound(playerIds,leaderboard,maxCourts=null,history=[],prior=null){
  const mc=meetCost(history,prior,playerIds);
  const teams=fixedTeams(playerIds);
  const cap=Math.floor(teams.length/2);
  const numCourts=Math.max(1,maxCourts?Math.min(maxCourts,cap):cap);
  const numSit=teams.length-numCourts*2;
  const rankOf=id=>{const i=leaderboard.findIndex(x=>x.id===id);return i<0?leaderboard.length:i;};
  const bySit=teams.map(t=>({t,c:sitCount(history,t[0]),r:Math.random()}))
    .sort((a,b)=>a.c-b.c||a.r-b.r);
  const sitTeams=numSit>0?bySit.slice(0,numSit).map(x=>x.t):[];
  const sitKeys=new Set(sitTeams.map(teamKey));
  const scored=teams.filter(t=>!sitKeys.has(teamKey(t)))
    .map(t=>({t,score:rankOf(t[0])+rankOf(t[1])}))
    .sort((a,b)=>a.score-b.score);
  const ranked=scored.map(x=>x.t);
  const played=new Map();
  history.forEach(r=>(r.courts||[]).forEach(m=>{
    const k=matchKey(m.t1,m.t2);played.set(k,(played.get(k)||0)+1);}));
  const duel=(a,b)=>W_MATCH*(played.get(matchKey(a,b))||0)
    +a.reduce((s,x)=>s+b.reduce((t,y)=>t+mc.opp(x,y),0),0);
  const blocks=[];let lo=0;
  for(let i=1;i<=scored.length;i++){
    if(i===scored.length||scored[i].score!==scored[lo].score){ if(i-lo>1) blocks.push([lo,i]); lo=i; }
  }
  const order=blocks.length
    ?anneal(ranked,duelCells(ranked.length),(s,c)=>duel(s[c[0]],s[c[1]]),{blocks})
    :ranked;
  const courts=[];
  for(let i=0;i+1<order.length;i+=2)
    courts.push({id:`c${i/2}`,t1:order[i],t2:order[i+1],s1:null,s2:null,done:false});
  return {courts,sitOut:sitTeams.flat()};
}

/* ── MIXICANO ─────────────────────────────────────────────────────
   Mixed-Americano: jedes Team = 1 Spieler aus Gruppe A + 1 aus
   Gruppe B (z. B. Damen/Herren). Pro Court 2+2. Pausen werden je
   Gruppe getrennt fair rotiert. players = Objekte mit
   {id, group:'A'|'B'} (fehlende group ⇒ 'A').

   Die Suche lief frueher nur auf die Partner-Frage (A_i mit B_i) und
   nahm den ersten Wurf ohne Wiederholung — wer gegen wen spielt, fiel
   dabei woertlich vom Mischen ab. Jetzt optimiert derselbe Bergabstieg
   beide Seiten; getauscht wird nur innerhalb einer Gruppe, damit die
   Mischung erhalten bleibt. */
export function genMixicanoRound(players,history=[],maxCourts=null,prior=null){
  const mc=meetCost(history,prior,players.map(p=>p.id));
  const A=players.filter(p=>(p.group||'A')!=='B').map(p=>p.id);
  const B=players.filter(p=>(p.group||'A')==='B').map(p=>p.id);
  const cap=Math.floor(Math.min(A.length,B.length)/2);
  const numCourts=Math.max(1,maxCourts?Math.min(maxCourts,cap):cap);
  const perGroup=numCourts*2;
  const pick=ids=>{
    const numSit=ids.length-perGroup;
    if(numSit<=0) return {act:ids,sit:[]};
    const ranked=ids.map(id=>({id,c:sitCount(history,id),r:Math.random()}))
      .sort((a,b)=>a.c-b.c||a.r-b.r);
    return {act:ranked.slice(numSit).map(x=>x.id),sit:ranked.slice(0,numSit).map(x=>x.id)};
  };
  const pa=pick(A),pb=pick(B);
  const sitOut=[...pa.sit,...pb.sit];
  const m=Math.min(pa.act.length,pb.act.length);
  // Sitzordnung = erst alle A, dann alle B. Team i = (A_i, B_i),
  // Court j = Team 2j gegen Team 2j+1.
  const seats=[...pa.act.slice(0,m),...pb.act.slice(0,m)];
  const teamAt=(s,i)=>[s[i],s[m+i]];
  // Ein Court traegt vier Plaetze: zwei aus A, zwei aus B.
  const cells=[];
  for(let i=0;i+1<m;i+=2) cells.push([i,i+1,m+i,m+i+1]);
  const cellCost=(s,c)=>{
    const t1=[s[c[0]],s[c[2]]],t2=[s[c[1]],s[c[3]]];
    let v=mc.partner(t1[0],t1[1])+mc.partner(t2[0],t2[1]);
    t1.forEach(a=>t2.forEach(b=>{v+=mc.opp(a,b);}));
    return v;
  };
  const best=anneal(seats,cells,cellCost,{blocks:[[0,m],[m,2*m]]});
  const courts=[];
  for(let i=0;i+1<m;i+=2)
    courts.push({id:`c${i/2}`,t1:teamAt(best,i),t2:teamAt(best,i+1),s1:null,s2:null,done:false});
  return {courts,sitOut};
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
export function genKingOfCourtRound(playerIds,history=[],maxCourts=null,prior=null){
  const maxByPlayers=Math.floor(playerIds.length/4);
  const numCourts=Math.max(1,maxCourts?Math.min(maxCourts,maxByPlayers):maxByPlayers);
  const playingCount=numCourts*4;
  const numSit=playerIds.length-playingCount;
  const sitOut=pickSitOut(playerIds,history,numSit);
  const playing=playerIds.filter(id=>!sitOut.includes(id));
  const last=history[history.length-1];
  if(!last||!last.courts?.length){
    // Runde 1: es gibt noch keine Leiter. Statt reinem Zufall die
    // Verteilung, die mit den Turnieren davor am wenigsten
    // wiederholt — dieselbe Startaufstellung ist das, was eine
    // Stammgruppe als Erstes auffaellt.
    const caps=Array.from({length:numCourts},()=>4);
    const seats=anneal(playing,seatCells(caps),seatCellCost(SPLIT_FREE,meetCost(history,prior,playerIds)));
    return {courts:seatsToCourts(seats,caps,SPLIT_FREE),sitOut};
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
  // Tiebreak einmal auswuerfeln, nicht im Vergleicher: Math.random()
  // dort macht die Ordnung inkonsistent (a<b und b<a zugleich) und
  // damit das Ergebnis der Sortierung undefiniert.
  const jitter=new Map(playing.map(id=>[id,Math.random()]));
  const ladder=[...playing].sort((a,b)=>
    (pos[a]??BOTTOM)-(pos[b]??BOTTOM)||jitter.get(a)-jitter.get(b));
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
   Gibt null zurück, wenn der Modus fertig ist (nur K.-o.).
   singles (Einzel-Courts) gilt nur für Americano/Mexicano — Team-,
   Gruppen- und Leiter-Formate brauchen zwingend 4er-Courts. */
export function genRound(format,players,{history=[],leaderboard=[],maxCourts=null,singles=[],meetLog=null}={}){
  const objs=players.map(p=>(typeof p==='object'&&p!==null)?p:{id:p});
  const ids=objs.map(p=>p.id);
  // Gedaechtnis der letzten Turniere — nur ein Tiebreaker, siehe
  // meetCost. Fehlt es (Online-Gast, erstes Turnier), aendert sich
  // nichts am Verhalten.
  const prior=meetLog?priorFromLog(objs,meetLog):null;
  switch(format){
    case 'mexicano':      return genMexicanoRound(ids,leaderboard,maxCourts,history,singles,prior);
    case 'teamamericano': return genTeamAmericanoRound(ids,history,maxCourts,prior);
    case 'teammexicano':  return genTeamMexicanoRound(ids,leaderboard,maxCourts,history,prior);
    case 'mixicano':      return genMixicanoRound(objs,history,maxCourts,prior);
    case 'kingofcourt':   return genKingOfCourtRound(ids,history,maxCourts,prior);
    case 'knockout':      return genKnockoutRound(ids,history,maxCourts);
    default:              return genAmericanoRound(ids,history,maxCourts,singles,prior);
  }
}

/* pauseMode steuert den Pausen-Ausgleich:
     'mean'  Pausierende bekommen etwas gutgeschrieben (Vorgabe) —
             in Punkte-Wertung den aufgerundeten Rundenmittelwert,
             in Siege-Wertung +1 Sieg je Pause fuer die untere
             Tabellenhaelfte.
     'none'  Gar nichts. Eine Pause ist dann schlicht eine Runde
             ohne Punkte — haerter, aber fuer manche Runden das
             ehrlichere Bild.
     'fixed' Ein fester Wert je Pause, pausePts. Unabhaengig davon,
             was auf den Courts passiert ist — planbar, und bei
             Turnieren mit festem Punktelimit oft das Erwartete.
             Gutgeschrieben wird als bonusPts, auch in der Siege-
             Wertung: dort sortiert die App nach Siegen und nimmt
             Punkte als Gleichstand-Kriterium.
   Die Boni liegen weiterhin auf eigenen Feldern (bonusPts/bonusWins)
   und werden erst am Ende in totalPts/totalWins gefaltet. */
export function calcLeaderboard(players,rounds,winMode='points',pauseMode='mean',pausePts=0){
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
  if(pauseMode==='none'){
    // Kein Ausgleich gewuenscht — sitOut wird weiter gezaehlt (die
    // Tabelle zeigt die Pausen), aber ohne Gutschrift.
  } else if(pauseMode==='fixed'){
    // Fester Wert je Pause. Kein Blick auf die Rundenergebnisse noetig,
    // also auch dann gueltig, wenn in der Runde noch nichts bestaetigt
    // ist — anders als beim Mittelwert.
    const per=Math.max(0,Math.round(Number(pausePts)||0));
    if(per>0) Object.values(stats).forEach(st=>{ st.bonusPts+=st.sitOut*per; });
  } else if(winMode==='points'){
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

/* ── SCHNELLSTARTS ────────────────────────────────────────────────
   Fertige Turnier-Zuschnitte fuer die Home-Karten. Sie fuellen nur
   den Konfigurator vor — gestartet wird weiterhin dort, damit Namen
   und Zeiten noch stimmen koennen, bevor es losgeht.

   Die Werte sind bewusst die haeufigen Faelle aus der Halle: ein
   volles Feld Americano, eine gemischte Runde, eine Runde nach
   Tabellenstand. Wer etwas anderes will, hat den Assistenten. */
/* ── Schnellstarts ────────────────────────────────────────────────
   Die Karten im "Spielen"-Streifen auf Home. Sie sind KEINE feste
   Liste mehr: der Host legt seine wiederkehrenden Formate selbst an
   (Dienstagsrunde, Firmenturnier, Feierabend zu viert) und die App
   bringt nur eine Startaufstellung mit. Gespeichert wird unter
   `ritmo_quickstarts`; ist dort nichts, gelten diese vier. */
export const DEFAULT_QUICK_STARTS=[
  {id:'americano12', label:'Americano',
   format:'americano', players:12, courts:3, winMode:'points', roundDurationMin:12},
  {id:'mixicano8',   label:'Mixicano',
   format:'mixicano',  players:8,  courts:2, winMode:'points', roundDurationMin:12},
  {id:'wettkampf8',  label:'Wettkampf',
   format:'mexicano',  players:8,  courts:2, winMode:'wins',   roundDurationMin:14},
  {id:'feierabend4', label:'Feierabend',
   format:'americano', players:4,  courts:1, winMode:'points', roundDurationMin:15},
];
export const QS_MAX=12;

/* Die Unterzeile wird GERECHNET, nicht getippt. Sonst steht auf einer
   Karte "8 Spieler", während zehn drin sind — und der Host merkt es
   erst im Konfigurator. */
export function quickStartSub(q,short=false){
  if(!q) return '';
  const base=`${q.players} Spieler · ${q.courts} Court${q.courts===1?'':'s'}`;
  /* Auf der Karte ohne Rundendauer: drei Angaben brechen dort in die
     dritte Zeile, und die Minute ist die unwichtigste von ihnen. */
  return short?base:`${base} · ${q.roundDurationMin} min`;
}

/* Laeuft bei JEDER Benutzung, nicht nur beim Speichern: so ueberleben
   halb kaputte Datensaetze, geaenderte Formatnamen und Listen von
   vor dieser Funktion — gleiche Regel wie normLayout. */
export function normQuickStart(q,i=0){
  const fmt=FORMATS[q?.format]?q.format:'americano';
  const players=Math.max(4,Math.min(32,Math.round(Number(q?.players)||8)));
  const maxC=Math.max(1,Math.floor(players/4));
  return {
    id:q?.id||`qs-${Date.now().toString(36)}-${i}`,
    label:String(q?.label||FORMATS[fmt].name).slice(0,24),
    format:fmt,
    players,
    courts:Math.max(1,Math.min(maxC,Math.round(Number(q?.courts)||1))),
    winMode:q?.winMode==='wins'?'wins':'points',
    roundDurationMin:Math.max(1,Math.min(60,Math.round(Number(q?.roundDurationMin)||12))),
  };
}
export function normQuickStarts(list){
  if(!Array.isArray(list)) return DEFAULT_QUICK_STARTS.map(normQuickStart);
  return list.filter(Boolean).slice(0,QS_MAX).map(normQuickStart);
}

/* Baut aus einem Schnellstart die Vorbelegung fuer TournamentSetup —
   dieselbe Form, die auch ein gespeichertes Turnier hat, nur ohne
   id/rounds. Gruppen haengen am Format (Mixicano braucht A/B) und
   nicht an einem zweiten Schalter im Datensatz. */
export function quickStartPreset(q){
  if(!q) return null;
  const n=normQuickStart(q);
  const groups=!!FORMATS[n.format]?.groups;
  return {
    name:n.label, format:n.format, winMode:n.winMode, numCourts:n.courts,
    roundDurationMin:n.roundDurationMin,
    players:Array.from({length:n.players},(_,i)=>({
      id:i, name:`Spieler ${i+1}`, color:PCOLS[i%PCOLS.length],
      ...(groups?{group:i%2?'B':'A'}:{}),
    })),
  };
}

/* ── Pausen-Ausgleich einer Runde: aufgerundeter Mittelwert aller
   Punkte aus BESTAETIGTEN Matches (spiegelt calcLeaderboard). null,
   wenn noch kein Match bestaetigt ist. Die Breakdown-Variante liefert
   zusaetzlich die Zusammensetzung fuers Runden-Abschluss-Popup:
   parts = eine Wertung je Team (score × Spielerzahl, Court-Reihen-
   folge), sum/count/mean = Rechenweg bis zum aufgerundeten Bonus. */
export function roundMeanBreakdown(round){
  const parts=[];
  (round?.courts||[]).forEach(m=>{
    if(!m.done) return;
    if((m.t1||[]).length) parts.push({score:m.s1??0,n:m.t1.length});
    if((m.t2||[]).length) parts.push({score:m.s2??0,n:m.t2.length});
  });
  if(!parts.length) return null;
  const sum=parts.reduce((a,p)=>a+p.score*p.n,0);
  const count=parts.reduce((a,p)=>a+p.n,0);
  const mean=sum/count;
  return {parts,sum,count,mean,bonus:Math.ceil(mean)};
}
export function roundMeanBonus(round){
  return roundMeanBreakdown(round)?.bonus??null;
}
