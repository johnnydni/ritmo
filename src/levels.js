/* ═══════════════════════════════════════════════════════════════
   LEVEL MAPPING — Playtomic-style 0–7 skala plus RITMO estimation.

   Skala (integer ranges, Playtomic-aligned):
     L1 Beginner       0.00 – 1.99
     L2 Fortgeschritten 2.00 – 2.99
     L3 Kompetitiv     3.00 – 3.99
     L4 Expert         4.00 – 4.99
     L5 Master         5.00 – 5.99
     L6 Elite          6.00 – 6.99
     L7 Ikone          7.00

   estimateLevel(profile) bewertet einen Profil-Fragebogen
   (Jahre, Häufigkeit, Turniere, Matches, Siegquote) und liefert
   eine 0.03-rounded Schätzung im Bereich 0.30 – 7.00.

   Siegquote ist der stärkste Faktor, skaliert mit Zuverlässigkeit
   (steigt linear bis zu 50 Matches). Alle Mappings absichtlich
   konservativ — eher unterschätzen als übertreiben.
═══════════════════════════════════════════════════════════════ */

export function getLevelLabel(lvl){
  if(lvl==null) return '';
  if(lvl<2.0) return 'Beginner';
  if(lvl<3.0) return 'Fortgeschritten';
  if(lvl<4.0) return 'Kompetitiv';
  if(lvl<5.0) return 'Expert';
  if(lvl<6.0) return 'Master';
  if(lvl<7.0) return 'Elite';
  return 'Ikone';
}

export function getLevelTier(lvl){
  if(lvl==null) return '';
  if(lvl<2.0) return 'L1';
  if(lvl<3.0) return 'L2';
  if(lvl<4.0) return 'L3';
  if(lvl<5.0) return 'L4';
  if(lvl<6.0) return 'L5';
  if(lvl<7.0) return 'L6';
  return 'L7';
}

export function getLevelColor(lvl){
  if(lvl==null) return '#7F8C8D';
  if(lvl<2.0) return '#7F8C8D';  // L1 Beginner — grey
  if(lvl<3.0) return '#16A085';  // L2 Fortgeschritten — teal
  if(lvl<4.0) return '#27AE60';  // L3 Kompetitiv — green
  if(lvl<5.0) return '#2980B9';  // L4 Expert — blue
  if(lvl<6.0) return '#C0392B';  // L5 Master — red
  if(lvl<7.0) return '#8E44AD';  // L6 Elite — purple
  return '#F39C12';              // L7 Ikone — gold
}

export function estimateLevel(p){
  if(!p.yearsPlaying||!p.frequencyPerWeek) return null;

  let score=0.5; // Basis-Score

  // Wie lange spielst du schon? — mittel (HALBIERT)
  score+=({lt6m:0,'6-12m':0.20,'1-2y':0.45,'2-5y':0.75,'5y+':1.00}[p.yearsPlaying]||0);

  // Wie oft pro Woche? — gering
  score+=({rare:0,'1x':0.10,'2x':0.22,'3x+':0.38}[p.frequencyPerWeek]||0);

  // Spielst du Turniere? — mittel
  score+=({never:0,occasional:0.30,regular:0.60}[p.playsTournaments]||0);

  // Wie viele Turniere? — mittel (nur wenn Turniere vorhanden)
  if(p.playsTournaments&&p.playsTournaments!=='never'){
    score+=({'0':0,'1-3':0.15,'4-10':0.40,'10+':0.75}[p.tournamentCount]||0);
  }

  // Anzahl wettbewerbsfähiger Matches — mittel
  const m=Math.max(0,parseInt(p.matchesPlayed)||0);
  if(m>=100) score+=0.90;
  else if(m>=61) score+=0.70;
  else if(m>=31) score+=0.55;
  else if(m>=11) score+=0.35;
  else if(m>=1)  score+=0.15;

  // Siegquote — HOCH (stärkster Faktor, skaliert mit Zuverlässigkeit)
  if(m>0){
    const w=Math.min(m,50)/50; // Zuverlässigkeits-Faktor: wächst bis 50 Matches
    const wins=Math.max(0,Math.min(m,parseInt(p.winsCount)||0));
    const rate=wins/m;
    let winScore=0;
    if(rate>=0.80) winScore=1.80;
    else if(rate>=0.60) winScore=1.30;
    else if(rate>=0.40) winScore=0.80;
    else if(rate>=0.20) winScore=0.40;
    score+=winScore*w; // Skaliert bis auf vollen Wert bei 50+ Matches
  }

  // Runden auf 0.03-Schritte, Cap 0.0–7.0 (full L1-L7 range)
  const raw=Math.min(7.00,Math.max(0.30,score));
  return Math.round(raw/0.03)*0.03;
}
