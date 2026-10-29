/* ═══════════════════════════════════════════════════════════════
   PROFIL-HINTERGRUENDE — die Auswahl hinter „Hintergrund ändern“
   (Menue am Profilbild). Reine Daten; gezeichnet von ProfileBackdrop
   in App.jsx.

   - 'foto' ist der Standard und heisst: das Foto der Startseite.
   - Jeder Verlauf ist DUNKEL genug fuer weisse Schrift und Glas —
     wer einen neuen anlegt, prueft das Level (3,40) darauf.
   - grain ist die Deckkraft des Korns (Rauschen, mix-blend overlay).
   - Die Hex-Werte stehen hier und nicht als Theme-Token: sie sind
     Bildinhalt wie die Fotos, keine Rollenfarbe der Oberflaeche.
═══════════════════════════════════════════════════════════════ */
export const WALLPAPERS=[
  {id:'foto',      name:'Foto',        sub:'Standard · die Startseite', grain:0},
  {id:'glut',      name:'Glut',        sub:'Verlauf · Korn', grain:.38,
    bg:'radial-gradient(120% 70% at 30% 110%,#ff7a1a 0%,#a8360c 28%,#2a0d06 58%,#0b0b0c 80%)'},
  {id:'nightcourt',name:'Night Court', sub:'Verlauf · Korn', grain:.32,
    bg:'radial-gradient(90% 60% at 80% 0%,#2f5bff 0%,#13256e 35%,#070b1f 75%),#070b1f'},
  {id:'rasen',     name:'Kunstrasen',  sub:'Verlauf · Korn', grain:.34,
    bg:'linear-gradient(200deg,#1f7a5a 0%,#0e3a2c 45%,#06120e 100%)'},
  {id:'abendrot',  name:'Abendrot',    sub:'Verlauf · Korn', grain:.36,
    bg:'radial-gradient(80% 55% at 85% 15%,#ff8a3d 0%,transparent 60%),radial-gradient(90% 70% at 10% 60%,#7a2a6b 0%,transparent 65%),linear-gradient(180deg,#2a1033,#0d0710)'},
  {id:'graphit',   name:'Graphit',     sub:'Nur Korn', grain:.45,
    bg:'linear-gradient(180deg,#2a2b2e,#141416 60%,#0b0b0c)'},
  {id:'sand',      name:'Sandplatz',   sub:'Verlauf · Korn', grain:.4,
    bg:'radial-gradient(100% 60% at 50% 0%,#c98a4a 0%,#7a4a22 40%,#25150a 80%)'},
  {id:'flutlicht', name:'Flutlicht',   sub:'Verlauf · Korn', grain:.3,
    bg:'radial-gradient(60% 40% at 50% -5%,rgba(255,255,255,.55) 0%,rgba(190,215,255,.18) 35%,transparent 70%),linear-gradient(180deg,#151a24,#08090c)'},
];
export const wallpaperById=id=>WALLPAPERS.find(w=>w.id===id)||WALLPAPERS[0];

/* Korn als SVG-Rauschen, einmal als data-URL (CSP: img-src data: ist
   erlaubt). Kachel 240 px, nahtlos (stitchTiles). */
export const GRAIN_URL="url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.2 -.1'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
