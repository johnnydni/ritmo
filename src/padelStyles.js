/* ═══════════════════════════════════════════════════════════════
   PADEL SPIELSTILE — Data tables for the six RITMO playstyle
   archetypes plus the matchmaking quiz that maps answers to a
   style key.

   Pure content; visuals are rendered separately in App.jsx
   (StyleVisual / StyleHeroCard) using STYLE_IMAGES.
═══════════════════════════════════════════════════════════════ */

export const PADEL_STYLES={
  chico:{
    name:'Chico / Chica', subtitle:'Der Allrounder',
    tagline:'Kann alles. Macht wenig falsch.',
    desc:'Vielseitig, anpassungsfähig und konstant — Chico / Chica passt sich schnell an Gegner, Partner und Match-Dynamik an. Kein extremes Risiko, aber fast immer die richtige Lösung. Dieser Typ liest das Match in Echtzeit und wechselt zwischen Offensive und Defensive je nach Situation.',
    kernwerte:['Balance','Anpassung','Konstanz'],
    strengths:[
      'Stabilität in jedem Match-Szenario',
      'Minimiert eigene Fehler über lange Sätze',
      'Liest Gegner und Partner intuitiv',
      'Wechselt situativ zwischen Modi',
    ],
    shots:['Kontrollierte Volleys','Bandeja','Lob','Chiquita','Returns'],
    weaknesses:['Zu vorsichtig','Kein Killerinstinkt','Kann passiv wirken'],
    partners:[
      {id:'toro',why:'Du gleichst Toros Risiko aus und stabilisierst das Match.'},
      {id:'fantasma',why:'Du verankerst Fantasmas Chaos mit Konstanz.'},
    ],
    accent:'#C9943A', card:'#2E1E08', text:'#FFF3D9', symbol:'○',
  },
  toro:{
    name:'Toro', subtitle:'Der Aggressor',
    tagline:'Druck ist meine Defensive.',
    desc:'Toro lebt von Intensität und Netzkontrolle. Er sucht Punkte zu diktieren, forciert Fehler und macht das Match körperlich und mental anstrengend für den Gegner. Wenn Toro im Flow ist, fühlt sich der Court enger an — jeder Ball muss schneller, besser, riskanter gespielt werden.',
    kernwerte:['Power','Dominanz','Entschlossenheit'],
    strengths:[
      'Forciert Punktende durch Netzpräsenz',
      'Erzeugt physischen und mentalen Druck',
      'Belohnt aggressive Risikobereitschaft',
      'Dominiert kurze Punkte',
    ],
    shots:['Smash / Remate','Víbora','Aggressive Volley','Bajada','Netzangriff'],
    weaknesses:['Überhastung','Hohes Fehlerrisiko','Berechenbar'],
    partners:[
      {id:'muro',why:'Muro liefert die Defensive, die deine Aggression absichert.'},
      {id:'chico',why:'Chico balanciert deine Spitzen und macht weniger Fehler.'},
    ],
    accent:'#C0392B', card:'#2A0808', text:'#FFE0DC', symbol:'▲',
  },
  individuoso:{
    name:'Individuoso', subtitle:'Der Strategische',
    tagline:'Ich gewinne den Punkt vor dem Schlag.',
    desc:'Individuoso denkt mehrere Schläge voraus, analysiert Räume und Rhythmen, kontrolliert Tempo und zwingt Gegner in unangenehme Entscheidungen. Schach auf Glas. Dieser Typ baut Punkte über mehrere Schläge auf — der entscheidende Ball ist oft die Folge von zwei Schlägen davor.',
    kernwerte:['Strategie','Antizipation','Präzision'],
    strengths:[
      'Liest Spielmuster zwei bis drei Schläge voraus',
      'Findet Lücken in Gegner-Aufstellungen',
      'Setzt Tempo und Rhythmus gezielt ein',
      'Verwandelt Information in Punkte',
    ],
    shots:['Winkelvolleys','Tempowechsel','Präzisions-Lobs','Chiquita','Platzierungs-Bandeja'],
    weaknesses:['Overthinken','Zu wenig Direktheit','Risiko von Passivität'],
    partners:[
      {id:'motor',why:'Motor exekutiert deine Pläne mit Tempo und Reichweite.'},
      {id:'toro',why:'Toro setzt deine taktischen Lücken in Punkte um.'},
    ],
    accent:'#2471A3', card:'#071828', text:'#D0E8FF', symbol:'■',
  },
  muro:{
    name:'Muro', subtitle:'Die Wand',
    tagline:'Du machst den Fehler.',
    desc:'Muro gewinnt durch Geduld, Defensive und mentale Stärke. Er bringt jeden Ball zurück und zwingt Gegner dazu, selbst Fehler zu machen. Jeder Punkt fühlt sich länger an. Gegen Muro reichen normale Schläge nicht — du musst aktiv riskieren um zu gewinnen, und das ist genau die Falle.',
    kernwerte:['Geduld','Widerstandskraft','Kontrolle'],
    strengths:[
      'Bringt fast jeden Ball ins Spiel zurück',
      'Frustriert Gegner mental über lange Rallyes',
      'Verwandelt Defensive in Court-Kontrolle',
      'Verlängert jeden Punkt um zwei Schläge',
    ],
    shots:['Defensiv-Lob','Tiefe Returns','Glas-Defense','Hohe Bandeja','Crosscourt'],
    weaknesses:['Wenig Initiative','Gefahr passiv zu werden','Reaktiv'],
    partners:[
      {id:'toro',why:'Toro liefert die Offensive, die du absicherst.'},
      {id:'fantasma',why:'Fantasma erzeugt Überraschung, du bringst den Rest zurück.'},
    ],
    accent:'#1E8449', card:'#071A0E', text:'#C8F0D8', symbol:'⬡',
  },
  fantasma:{
    name:'Fantasma', subtitle:'Der Kreative',
    tagline:'Du weißt nie, was kommt.',
    desc:'Fantasma ist unvorhersehbar, intuitiv und liebt Überraschung. Mit ungewöhnlichen Winkeln, Rhythmusbrüchen und mutigen Ideen erzeugt er Chaos und Unsicherheit. Gegen Fantasma ist Lesen schwerer als Rennen — du weißt nie, ob jetzt der Chiquita oder der Smash kommt.',
    kernwerte:['Kreativität','Überraschung','Freiheit'],
    strengths:[
      'Bricht systematische Gegner-Strategien auf',
      'Erzeugt unlesbare, unkonventionelle Spielzüge',
      'Findet Winkel die Gegner nicht erwarten',
      'Mentaler Game-Changer in engen Sätzen',
    ],
    shots:['Trickshots','Chiquita','Spin-Lobs','Überraschungs-Lob','Unkonventionelle Volleys'],
    weaknesses:['Inkonsistenz','Hohes Risiko','Unnötig verspielt'],
    partners:[
      {id:'muro',why:'Muro fängt deine kreativen Risiken sicher auf.'},
      {id:'chico',why:'Chico bringt Konstanz in dein verspieltes Repertoire.'},
    ],
    accent:'#7D3C98', card:'#180828', text:'#EDD8FF', symbol:'●',
  },
  motor:{
    name:'Motor', subtitle:'Der Ausdauernde',
    tagline:'Ich krieg noch einen Ball.',
    desc:'Motor gewinnt durch Bewegung, Reichweite und nie endende Energie. Er deckt enorme Flächen ab und bleibt auch in langen Rallyes gefährlich. Wer ihn schlagen will, muss einen Extra-Ball spielen. Motor zermürbt Gegner allein durch seine Präsenz auf jedem Quadratmeter des Courts.',
    kernwerte:['Ausdauer','Geschwindigkeit','Kampfgeist'],
    strengths:[
      'Deckt enorme Court-Fläche ab',
      'Erreicht "unmögliche" Bälle und verlängert Punkte',
      'Bleibt fit und scharf über lange Matches',
      'Erzwingt Extra-Schläge beim Gegner',
    ],
    shots:['Recovery Lob','Laufvolleys','Defensive Counter','Tiefe Returns','Sprint-Retrievals'],
    weaknesses:['Wenig natürliche Power','Kann sich überarbeiten','Risiko von ineffizientem Energieeinsatz'],
    partners:[
      {id:'individuoso',why:'Individuoso lenkt deine Energie taktisch klug.'},
      {id:'muro',why:'Muro hält den Court, während du jagst.'},
    ],
    accent:'#27AE60', card:'#071A10', text:'#C8FFE0', symbol:'▶▶',
  },
};

export const PADEL_QUIZ=[
  {
    key:'q1',
    label:'Was fühlt sich für dich am besten an?',
    options:[
      {id:'a',label:'Ein solides, fehlerfreies Match'},
      {id:'b',label:'Den Punkt mit Power beenden'},
      {id:'c',label:'Den Gegner taktisch ausspielen'},
      {id:'d',label:'Alles verteidigen, bis der Fehler kommt'},
      {id:'e',label:'Mit etwas Unerwartetem überraschen'},
      {id:'f',label:'Jeden Ball noch erreichen'},
    ],
  },
  {
    key:'q2',
    label:'Deine größte Stärke?',
    options:[
      {id:'a',label:'Vielseitigkeit'},
      {id:'b',label:'Dominanz'},
      {id:'c',label:'Spielintelligenz'},
      {id:'d',label:'Geduld'},
      {id:'e',label:'Kreativität'},
      {id:'f',label:'Ausdauer'},
    ],
  },
  {
    key:'q3',
    label:'Wie gewinnst du am liebsten?',
    options:[
      {id:'a',label:'Konstanz'},
      {id:'b',label:'Druck'},
      {id:'c',label:'Strategie'},
      {id:'d',label:'Fehler des Gegners'},
      {id:'e',label:'Überraschung'},
      {id:'f',label:'Längere Rallyes'},
    ],
  },
  {
    key:'q4',
    label:'Dein größtes Risiko?',
    options:[
      {id:'a',label:'Zu vorsichtig'},
      {id:'b',label:'Zu aggressiv'},
      {id:'c',label:'Zu kompliziert'},
      {id:'d',label:'Zu passiv'},
      {id:'e',label:'Zu verspielt'},
      {id:'f',label:'Zu laufintensiv'},
    ],
  },
];

export function computeStyle(qa){
  if(!qa) return null;
  const counts={a:0,b:0,c:0,d:0,e:0,f:0};
  Object.values(qa).forEach(v=>{if(v&&counts[v]!==undefined) counts[v]++;});
  const max=Math.max(...Object.values(counts));
  if(max===0) return null;
  const winner=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  return {a:'chico',b:'toro',c:'individuoso',d:'muro',e:'fantasma',f:'motor'}[winner]||null;
}

/* Primär- UND Sekundär-Stil aus denselben Antworten: nach Häufigkeit
   sortiert (stabil — bei Gleichstand gewinnt die frühere Kategorie,
   identisch zu computeStyle). Sekundär = zweithäufigster Archetyp mit
   mindestens einer Stimme; gibt es nur einen, bleibt secondary null. */
export function computeStyles(qa){
  if(!qa) return {primary:null,secondary:null};
  const counts={a:0,b:0,c:0,d:0,e:0,f:0};
  Object.values(qa).forEach(v=>{if(v&&counts[v]!==undefined) counts[v]++;});
  const MAP={a:'chico',b:'toro',c:'individuoso',d:'muro',e:'fantasma',f:'motor'};
  const ranked=Object.entries(counts).filter(([,c])=>c>0).sort((a,b)=>b[1]-a[1]);
  return {
    primary:ranked[0]?MAP[ranked[0][0]]:null,
    secondary:ranked[1]?MAP[ranked[1][0]]:null,
  };
}

/* ═══════════════════════════════════════════════════════════════
   MATCH-TIER — RITMO DNA Rating einer 2-gegen-2-Paarung.

   Rein stilbasiert: Turnier-Spieler tragen einen Spielstil, aber kein
   Level — daher fließt nur die Stil-Chemie ein (Level ist im Turnier
   nicht erfasst). Pro Team ergibt sich ein Chemie-Wert aus den beiden
   Stilen, die Summe beider Teams (0..4) bestimmt das Tier:

     teamChem:
       2 = DUO     — empfohlene Partner (ergänzen sich)
       1 = MIXED   — verschieden, aber keine ausgewiesene Synergie
       0 = MIRROR  — gleicher Stil (Schwächen-Dopplung)

     Summe → Tier:  4→S · 3→A · 2→B · 1→C · 0→X
═══════════════════════════════════════════════════════════════ */

// Empfohlene-Partner-Beziehung (ungerichtet) aus den .partners-Listen.
function arePartners(a,b){
  if(!a||!b||a===b) return false;
  const inA=PADEL_STYLES[a]?.partners?.some(x=>x.id===b);
  const inB=PADEL_STYLES[b]?.partners?.some(x=>x.id===a);
  return !!(inA||inB);
}

// Chemie zweier Teammate-Stile: 2 Duo · 1 Mixed · 0 Mirror.
function teamChem(a,b){
  if(a===b) return 0;          // Mirror
  if(arePartners(a,b)) return 2; // Duo-Synergie
  return 1;                     // Mixed
}

export const MATCH_TIER_META={
  S:{tier:'S', label:'S-Tier', sub:'Elite Synergy',   stars:5, color:'#1A8754'},
  A:{tier:'A', label:'A-Tier', sub:'Starke Chemie',   stars:4, color:'#3498DB'},
  B:{tier:'B', label:'B-Tier', sub:'Solides Match',   stars:3, color:'#F39C12'},
  C:{tier:'C', label:'C-Tier', sub:'Reibungs-Match',  stars:2, color:'#E67E22'},
  X:{tier:'X', label:'X-Tier', sub:'Chaos Mode',      stars:1, color:'#9B59B6'},
};

/* Match-Tier aus den Stilen der vier Spieler (Team 1 vs Team 2).
   t1Styles/t2Styles sind je ein Array aus zwei Stil-Schlüsseln.
   Gibt das Tier-Meta-Objekt zurück — oder null, wenn nicht alle vier
   Stile gesetzt/gültig sind (dann zeigt die UI kein Label). */
export function computeMatchTier(t1Styles, t2Styles){
  const a=t1Styles?.[0], b=t1Styles?.[1], c=t2Styles?.[0], d=t2Styles?.[1];
  if(![a,b,c,d].every(s=>s&&PADEL_STYLES[s])) return null;
  const sum=teamChem(a,b)+teamChem(c,d); // 0..4
  const tier=sum>=4?'S':sum===3?'A':sum===2?'B':sum===1?'C':'X';
  return MATCH_TIER_META[tier];
}

/* ── Per-style image visuals ─────────────────────────────────
   Bilder werden aus /assets im Vite-Projekt geladen.
   Vite injiziert BASE_URL automatisch, sodass GitHub Pages-Pfade
   (/REPO-NAME/assets/...) korrekt aufgelöst werden.
─────────────────────────────────────────────────────────────── */
export const STYLE_IMAGES={
  chico:       'chicochica.jpeg',
  toro:        'toro.jpeg',
  individuoso: 'individuoso.jpeg',
  muro:        'muro.jpeg',
  fantasma:    'fantasma.jpeg',
  motor:       'motor.jpeg',
};
