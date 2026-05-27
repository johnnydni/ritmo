/* ═══════════════════════════════════════════════════════════════
   THEME — Design tokens, CSS variables, palette helpers.

   All visual values are CSS custom properties driven by
   `data-theme` on <html>. Components consume them via the `T`
   token mirror so React style objects stay in pure JS.

   buildThemePalette() lets users define a custom theme from
   four base colors; the derived palette keeps contrast sane.
═══════════════════════════════════════════════════════════════ */

export const T = {
  bg:       'var(--bg)',
  card:     'var(--card)',
  card2:    'var(--card2)',
  border:   'var(--border)',
  sep:      'var(--sep)',
  t1:       'var(--t1)',
  t2:       'var(--t2)',
  t3:       'var(--t3)',
  t4:       'var(--t4)',
  o:        'var(--o)',
  oSoft:    'var(--oSoft)',
  oGlow:    'var(--oGlow)',     // Stronger alpha of brand for glows
  oFlash:   'var(--oFlash)',    // Subtle flash background
  g:        'var(--g)',
  r:        'var(--r)',
  blue:     'var(--blue)',
  blueSoft: 'var(--blueSoft)',
  blueGlow: 'var(--blueGlow)',
  gold:     'var(--gold)',
};

export const CSS = `
:root, :root[data-theme="dark"] {
  --bg: #000000;
  --card: #141414;
  --card2: #1C1C1C;
  --border: rgba(255,255,255,0.08);
  --sep: rgba(255,255,255,0.06);
  --t1: #FFFFFF;
  --t2: rgba(255,255,255,0.6);
  --t3: rgba(255,255,255,0.35);
  --t4: rgba(255,255,255,0.18);
  --o: #FF7A1A;
  --oSoft: rgba(255,122,26,0.12);
  --oGlow: rgba(255,122,26,0.5);
  --oFlash: rgba(255,122,26,0.14);
  --g: #1A8754;
  --r: #E84545;
  --blue: #0A84FF;
  --blueSoft: rgba(10,132,255,0.18);
  --blueGlow: rgba(10,132,255,0.5);
  --gold: #C8A878;
  --headerGrad: linear-gradient(90deg, #FFC037 0%, #5F4848 100%);
}
:root[data-theme="light"] {
  --bg: #FFFFFF;
  --card: #F5F5F7;
  --card2: #EBEBEF;
  --border: rgba(0,0,0,0.10);
  --sep: rgba(0,0,0,0.06);
  --t1: #000000;
  --t2: rgba(0,0,0,0.65);
  --t3: rgba(0,0,0,0.42);
  --t4: rgba(0,0,0,0.22);
  --o: #007AFF;
  --oSoft: rgba(0,122,255,0.12);
  --oGlow: rgba(0,122,255,0.5);
  --oFlash: rgba(0,122,255,0.14);
  --g: #34C759;
  --r: #FF3B30;
  --blue: #FF9500;
  --blueSoft: rgba(255,149,0,0.18);
  --blueGlow: rgba(255,149,0,0.5);
  --gold: #B8945A;
  --headerGrad: linear-gradient(135deg, #EAF3FF 0%, #C9DBF2 100%);
}
:root[data-theme="padel"] {
  --bg: #0018F9;
  --card: #1F2FFA;
  --card2: #3548FB;
  --border: rgba(255,255,255,0.14);
  --sep: rgba(255,255,255,0.08);
  --t1: #FFFFFF;
  --t2: rgba(255,255,255,0.72);
  --t3: rgba(255,255,255,0.48);
  --t4: rgba(255,255,255,0.25);
  --o: #FFD60A;
  --oSoft: rgba(255,214,10,0.15);
  --oGlow: rgba(255,214,10,0.55);
  --oFlash: rgba(255,214,10,0.18);
  --g: #34C759;
  --r: #FF6B6B;
  --blue: #FF9500;
  --blueSoft: rgba(255,149,0,0.18);
  --blueGlow: rgba(255,149,0,0.5);
  --gold: #FFD60A;
  --headerGrad: linear-gradient(90deg, #FFD60A 0%, #1F2FFA 100%);
}
:root[data-theme="wimbledon"] {
  --bg: #006039;
  --card: #0A6E45;
  --card2: #137A50;
  --border: rgba(244,239,227,0.14);
  --sep: rgba(244,239,227,0.08);
  --t1: #F4EFE3;
  --t2: rgba(244,239,227,0.72);
  --t3: rgba(244,239,227,0.50);
  --t4: rgba(244,239,227,0.25);
  --o: #D4B98F;
  --oSoft: rgba(212,185,143,0.16);
  --oGlow: rgba(212,185,143,0.55);
  --oFlash: rgba(212,185,143,0.18);
  --g: #5BC48E;
  --r: #C46B5E;
  --blue: #EDE5D0;
  --blueSoft: rgba(237,229,208,0.20);
  --blueGlow: rgba(237,229,208,0.55);
  --gold: #D4B98F;
  --headerGrad: linear-gradient(90deg, #D4B98F 0%, #006039 100%);
}

/* ════ BAUHAUS FUNKY — Tropical Disco × Vaporwave × Brutalism ════
   Fusion aus 4 Style-Welten:
     • Bauhaus-Primärfarben (Gelb · Magenta · Cyan · Schwarz)
     • Vaporwave-Sunset-Gradient (Pink · Cyan · Purple)
     • Brutalismus (harte 0px-Radien, dicke Outlines, offset-Drop-Shadows)
     • Gen-Z-Chaos (Sticker-Tilts, Marquee, Glitch, Konfetti)
   Stock-Assets (Pexels-Video + Unsplash-Stills) werden über die
   <FunkyAmbient/>-React-Komponente eingehängt — CSS hier liefert
   Variablen, Layer-Overlays, Keyframes und Utility-Klassen.
═══════════════════════════════════════════════════════════════ */
:root[data-theme="funky"] {
  --bg: #0A0014;             /* tiefes Nacht-Magenta — sitzt unter Sunset-Layer */
  --card: rgba(20,8,30,0.78); /* halbtransparent, damit Video-BG durchschimmert */
  --card2: rgba(34,16,50,0.82);
  --border: #00F0FF;          /* Cyan-Outline — Bauhaus-Knaller */
  --sep: rgba(0,240,255,0.22);
  --t1: #FFFFFF;
  --t2: rgba(255,255,255,0.85);
  --t3: rgba(255,236,170,0.78);
  --t4: rgba(255,236,170,0.42);
  --o: #FFE800;               /* Electric Yellow — Bauhaus-Primärfarbe */
  --oSoft: rgba(255,232,0,0.18);
  --oGlow: rgba(255,232,0,0.65);
  --oFlash: rgba(255,232,0,0.20);
  --g: #B8FF3E;               /* Lime-Mint */
  --r: #FF006E;               /* Magenta-Rot */
  --blue: #FF1A8C;            /* Hot Pink (statt Blau — disco) */
  --blueSoft: rgba(255,26,140,0.20);
  --blueGlow: rgba(255,26,140,0.60);
  --gold: #FFE800;
  --headerGrad: linear-gradient(90deg, #FFE800 0%, #FF006E 50%, #00F0FF 100%);
  /* Funky-only Sub-Tokens */
  --funky-magenta: #FF006E;
  --funky-cyan:    #00F0FF;
  --funky-lime:    #B8FF3E;
  --funky-orange:  #FF6B00;
  --funky-purple:  #B967FF;
  --funky-hot:     #FF1A8C;
}

/* ════ Funky Globals — Body, Headings, Cards ════════════════════
   Scoped: nur aktiv wenn data-theme="funky" am :root sitzt.
═══════════════════════════════════════════════════════════════ */

/* Animated sunset gradient als full-viewport-Layer hinter allem.
   Sitzt am body::before, damit React-Tree die normalen z-Indizes
   behält. Conic + radial gemischt für ungleichmäßigen Disco-Look. */
[data-theme="funky"] body::before {
  content: '';
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 80% 60% at 20% 10%, rgba(255,26,140,0.55), transparent 60%),
    radial-gradient(ellipse 70% 70% at 90% 30%, rgba(0,240,255,0.42), transparent 60%),
    radial-gradient(ellipse 90% 60% at 50% 100%, rgba(255,232,0,0.40), transparent 65%),
    conic-gradient(from 0deg at 50% 50%,
      #FF006E 0%, #FF1A8C 12%, #B967FF 25%, #00F0FF 38%,
      #B8FF3E 50%, #FFE800 62%, #FF6B00 75%, #FF006E 100%);
  background-blend-mode: screen, screen, screen, normal;
  filter: saturate(1.4) blur(0px);
  animation: funky-bg-drift 38s linear infinite;
  opacity: 0.55;
}

/* Grain/Noise SVG-Layer + CRT-Scanlines obenauf. Die Scanlines
   sind sehr subtil (alpha .04) — nur ein Hauch CRT-Atmosphäre. */
[data-theme="funky"] body::after {
  content: '';
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background-image:
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/></svg>"),
    repeating-linear-gradient(to bottom,
      transparent 0px, transparent 2px,
      rgba(0,0,0,0.13) 2px, rgba(0,0,0,0.13) 3px);
  mix-blend-mode: overlay;
  opacity: 0.85;
}

/* Sub-Elemente sitzen über den body-Layern. */
[data-theme="funky"] #root { position: relative; z-index: 2; }

/* Bauhaus-Brutalism — alle Karten, Buttons und Inputs bekommen
   feste 0px-Radien aufgezwungen. Wir machen das per attribute-
   Selektor, damit Inline-Styles mit borderRadius weiter funktionieren,
   wo sie wichtig sind (Avatar runde Kreise z. B. — die nutzen 50%
   und überschreiben). Hier targeten wir nur generische divs/buttons
   ohne explicit border-radius wäre zu invasiv. Daher: nur unsere
   Funky-Utility-Klassen erzwingen Brutalismus.

   Wir lassen die App-Layout-Inline-Styles in Ruhe und liefern stattdessen
   schmuckhafte zusätzliche Effekte: starker Outline-Ring + offset-Shadow
   auf den Top-Level Karten via einer .fu-Klasse, die bereits an vielen
   Karten hängt. */
[data-theme="funky"] .fu {
  box-shadow:
    6px 6px 0 0 var(--funky-magenta),
    -2px -2px 0 0 var(--funky-cyan);
  transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s;
}
[data-theme="funky"] .fu:hover {
  transform: translate(-2px,-2px) rotate(-0.4deg);
  box-shadow:
    10px 10px 0 0 var(--funky-magenta),
    -4px -4px 0 0 var(--funky-cyan);
}

/* Inputs + Buttons: dicker, kontrastreicher, Bauhaus-Bold. */
[data-theme="funky"] input,
[data-theme="funky"] button {
  letter-spacing: 0.5px;
}
[data-theme="funky"] input:focus {
  outline: 2px solid var(--funky-cyan);
  outline-offset: 2px;
}

/* Tabs/Active-Pills: stickerartiges Tilt + Magenta-Outline. */
[data-theme="funky"] button:hover {
  filter: saturate(1.1);
}

/* ════ Funky Keyframes ══════════════════════════════════════════ */
@keyframes funky-bg-drift {
  0%   { transform: rotate(0deg) scale(1.05); }
  50%  { transform: rotate(180deg) scale(1.12); }
  100% { transform: rotate(360deg) scale(1.05); }
}
@keyframes funky-jitter {
  0%,100% { transform: translate(0,0) rotate(0deg); }
  25%     { transform: translate(-0.5px, 0.5px) rotate(-0.3deg); }
  50%     { transform: translate(0.5px, -0.5px) rotate(0.4deg); }
  75%     { transform: translate(-0.3px, 0.3px) rotate(-0.2deg); }
}
@keyframes funky-glitch {
  0%,100% { transform: translate(0,0); text-shadow: 2px 0 var(--funky-magenta), -2px 0 var(--funky-cyan); }
  20%     { transform: translate(-1px,1px); text-shadow: 3px 0 var(--funky-magenta), -3px 0 var(--funky-cyan); }
  40%     { transform: translate(1px,-1px); text-shadow: -2px 0 var(--funky-magenta), 2px 0 var(--funky-cyan); }
  60%     { transform: translate(-1px,-1px); text-shadow: 2px 1px var(--funky-magenta), -2px -1px var(--funky-cyan); }
  80%     { transform: translate(1px,1px); text-shadow: -3px 0 var(--funky-magenta), 3px 0 var(--funky-cyan); }
}
@keyframes funky-pulse-glow {
  0%,100% { box-shadow: 0 0 12px var(--funky-cyan), 0 0 24px rgba(0,240,255,0.4); }
  50%     { box-shadow: 0 0 20px var(--funky-magenta), 0 0 40px rgba(255,0,110,0.55); }
}
@keyframes funky-marquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes funky-float {
  0%,100% { transform: translateY(0) rotate(var(--funky-rot,0deg)); }
  50%     { transform: translateY(-12px) rotate(calc(var(--funky-rot,0deg) + 8deg)); }
}
@keyframes funky-shimmer {
  0%   { background-position: -200% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes funky-ripple {
  0%   { transform: scale(0); opacity: 0.85; }
  100% { transform: scale(28); opacity: 0; }
}
@keyframes funky-hue-spin {
  0%   { filter: hue-rotate(0deg) saturate(1.1); }
  100% { filter: hue-rotate(360deg) saturate(1.1); }
}

/* ════ Funky Utility Classes ════════════════════════════════════ */

/* Sticker-Tilt + Neon-Glow für Eyebrows / Section-Headlines. */
[data-theme="funky"] .funky-sticker {
  display: inline-block;
  background: var(--o);
  color: #000;
  padding: 4px 10px;
  font-weight: 900;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  transform: rotate(-2deg);
  box-shadow: 3px 3px 0 0 var(--funky-magenta);
  border: 2px solid #000;
}

/* Animiertes Gradient-Text-Highlight für Hero-Headlines. */
[data-theme="funky"] .funky-gradient-text {
  background: linear-gradient(90deg, #FFE800, #FF006E, #00F0FF, #B8FF3E, #FFE800);
  background-size: 200% 100%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: funky-shimmer 4s linear infinite;
  font-weight: 900;
  letter-spacing: -0.5px;
}

/* Neon-Glow um RITMO-Wordmark / Logo-Headlines. */
[data-theme="funky"] .funky-glow {
  text-shadow:
    0 0 8px var(--o),
    0 0 16px var(--funky-magenta),
    0 0 32px var(--funky-cyan);
  animation: funky-pulse-glow 3.5s ease-in-out infinite;
}

/* Glitch-Text (sparsam einsetzen — flackert). */
[data-theme="funky"] .funky-glitch {
  animation: funky-glitch 2.4s steps(2, end) infinite;
}

/* Marquee-Strip oben am Bildschirm. */
.funky-marquee {
  display: flex; gap: 32px;
  white-space: nowrap;
  animation: funky-marquee 28s linear infinite;
  will-change: transform;
}

/* Floating Tropical Sprites — von <FunkyAmbient/> gestreut. */
.funky-floater {
  position: fixed;
  pointer-events: none;
  z-index: 1;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));
  animation: funky-float var(--funky-dur, 6s) ease-in-out infinite;
  will-change: transform;
}

/* Click-Ripple — Punkt am Pointer-Down explodiert. */
.funky-ripple {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  width: 18px; height: 18px;
  margin-left: -9px; margin-top: -9px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--funky-cyan) 0%, var(--funky-magenta) 50%, transparent 80%);
  mix-blend-mode: screen;
  animation: funky-ripple .65s cubic-bezier(.2,.7,.4,1) forwards;
}

/* ════ Fruit-Ninja Modus — Racket folgt dem Pointer, schneidet Floater ═══
   Der Schläger sitzt fixed über allem (pointer-events:none, damit Klicks
   durch ihn hindurch auf die echten Buttons gehen). Die Sprite-Rotation
   wird per --racket-rot CSS-Variable aus React-State diktiert, damit die
   Schwingung der Bewegungsrichtung folgt. */
.funky-racket {
  position: fixed;
  pointer-events: none;
  z-index: 9998;
  width: 104px; height: 104px;
  margin-left: -52px; margin-top: -52px;
  transform: rotate(var(--racket-rot, -30deg));
  transition: transform .06s linear, opacity .25s;
  filter: drop-shadow(0 6px 18px rgba(0,0,0,.55));
  will-change: transform, left, top;
  opacity: 0;
}
.funky-racket.is-active { opacity: 1; }
.funky-racket img,
.funky-racket svg { width:100%; height:100%; display:block; }

/* Slice-Trail — Neon-Streifen, der jeden Treffer markiert.
   Wird kurzlebig ans body angehängt und nach .35s entfernt. */
.funky-slice-trail {
  position: fixed; pointer-events: none; z-index: 9997;
  width: 78px; height: 8px;
  margin-left: -39px; margin-top: -4px;
  background: linear-gradient(90deg, transparent 0%, var(--funky-cyan) 35%, var(--funky-magenta) 65%, transparent 100%);
  border-radius: 4px;
  mix-blend-mode: screen;
  filter: blur(.6px);
  animation: funky-trail-fade .42s cubic-bezier(.2,.8,.3,1) forwards;
}
@keyframes funky-trail-fade {
  from { opacity: .95; transform: rotate(var(--trail-rot,0deg)) scaleX(1.05); }
  to   { opacity: 0;   transform: rotate(var(--trail-rot,0deg)) scaleX(.35); }
}

/* Geschnittenes Sprite: pulsiert auf, dreht sich, fällt in den unteren
   Bildschirmrand und verblasst. Die rotate-Variable wird vom Float-
   Initial-State übernommen, damit die Rotation organisch fortgesetzt
   aussieht. */
.funky-floater-sliced {
  animation: funky-slice .85s cubic-bezier(.4,.6,.6,1) forwards !important;
  pointer-events: none;
}
@keyframes funky-slice {
  0%   { transform: rotate(var(--funky-rot,0deg)) scale(1);
         opacity: 1; filter: brightness(1) saturate(1.3); }
  18%  { transform: rotate(calc(var(--funky-rot,0deg) + 32deg)) scale(1.18);
         opacity: 1; filter: brightness(2.2) saturate(1.7); }
  100% { transform: translateY(120vh) rotate(calc(var(--funky-rot,0deg) + 540deg)) scale(.55);
         opacity: 0; filter: brightness(.5) saturate(.8); }
}

@media (prefers-reduced-motion: reduce) {
  .funky-racket { display: none; }
  .funky-slice-trail,
  .funky-floater-sliced { animation: none; opacity: 0; }
}

/* Scanline-/Vignette-Layer für FunkyAmbient. */
.funky-ambient-video {
  position: fixed; inset: 0;
  width: 100vw; height: 100dvh;
  object-fit: cover;
  z-index: 0;
  opacity: 0.32;
  mix-blend-mode: screen;
  pointer-events: none;
  filter: contrast(1.1) saturate(1.3);
}
.funky-ambient-vignette {
  position: fixed; inset: 0; z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgba(10,0,20,0.55) 100%);
}
.funky-ambient-marquee {
  position: fixed; top: 0; left: 0; right: 0;
  z-index: 3;
  height: 28px;
  background: #000;
  border-bottom: 2px solid var(--funky-cyan);
  color: var(--o);
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 2px;
  display: flex; align-items: center;
  overflow: hidden;
  text-transform: uppercase;
  font-family: 'Courier New', Courier, monospace;
  pointer-events: none;
}

/* prefers-reduced-motion → alle Funky-Animationen einfrieren */
@media (prefers-reduced-motion: reduce) {
  [data-theme="funky"] body::before { animation: none; }
  [data-theme="funky"] .funky-gradient-text,
  [data-theme="funky"] .funky-glow,
  [data-theme="funky"] .funky-glitch,
  .funky-floater,
  .funky-marquee { animation: none; }
}

*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body,#root{background:var(--bg);height:100%;min-height:100dvh;overflow:hidden;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Helvetica Neue',sans-serif;
  -webkit-font-smoothing:antialiased;color:var(--t1);}
button,input{font-family:inherit;color:inherit;}
input{outline:none;border:none;background:none;}
::-webkit-scrollbar{display:none;}
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}

@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes flashOrange{0%,100%{background:var(--card)}40%{background:var(--oFlash)}}
/* Court-View: Live-Pulse (Punkt + Border), VS-Pulse (rotation + scale)
   und Score-Pop (Skalierung beim Punkte-Update). Eigene Animationen,
   damit die übrigen Screens nicht versehentlich mitwackeln. */
@keyframes courtLivePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.92)}}
@keyframes courtBorderPulse{0%,100%{box-shadow:0 0 0 0 var(--oGlow)}50%{box-shadow:0 0 0 6px transparent}}
@keyframes vsPulse{0%,100%{transform:scale(1) rotate(0deg);opacity:.85}50%{transform:scale(1.12) rotate(-3deg);opacity:1}}
@keyframes scorePop{0%{transform:scale(.7);opacity:.4}60%{transform:scale(1.18);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes courtCardEnter{from{opacity:0;transform:translateY(22px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
.fu{animation:fadeUp .4s ease both;}
.fi{animation:fadeIn .25s ease both;}
.si{animation:scaleIn .2s ease both;}
.flash{animation:flashOrange .42s ease;}
.court-card{animation:courtCardEnter .5s cubic-bezier(.22,.95,.34,1) both;}
.court-live-dot{animation:courtLivePulse 1.4s ease-in-out infinite;}
.court-live-border{animation:courtBorderPulse 2s ease-in-out infinite;}
.court-vs{animation:vsPulse 2.6s ease-in-out infinite;}
.court-score-pop{animation:scorePop .35s cubic-bezier(.22,.95,.34,1) both;}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL MICRO-INTERACTIONS

   Universelle Animationsebene für die gesamte App. Greift via
   Element-Selector (button, input, a) auf alle Komponenten zu — die
   Inline-Styles in App.jsx werden NICHT überschrieben, sondern nur
   um Übergangszeiten + State-Animationen ergänzt.

   Timings folgen den UI/UX Pro Max-Empfehlungen (150–300ms für
   Micro-Interactions, niemals > 500ms). Animiert wird ausschließlich
   transform + opacity + color/background/border/shadow, damit kein
   Layout-Reflow auftritt.
═══════════════════════════════════════════════════════════════ */

/* Animation-Tokens — Easings + Durations zentralisiert. */
:root{
  --anim-fast:120ms cubic-bezier(.2,.9,.3,1.2);
  --anim-base:200ms cubic-bezier(.2,.9,.3,1.05);
  --anim-slow:320ms cubic-bezier(.16,.84,.44,1);
  --anim-spring:280ms cubic-bezier(.34,1.56,.64,1);
}

/* Jeder Button bekommt smooth transitions auf seinen visuellen
   Eigenschaften, plus einen Press-Scale beim active-State. Inline-
   Styles in App.jsx ändern Farbe/Border/Background per onPointerDown
   — der globale transition-Eintrag macht jeden dieser Wechsel weich. */
button{
  transition:
    transform var(--anim-fast),
    background-color var(--anim-base),
    color var(--anim-base),
    border-color var(--anim-base),
    box-shadow var(--anim-base),
    opacity var(--anim-base);
  -webkit-tap-highlight-color:transparent;
  touch-action:manipulation;
}
button:active:not(:disabled){transform:scale(.97);}
button:disabled{cursor:not-allowed;opacity:.55;}

/* Inputs animieren ihren Focus-State sanft. */
input,textarea,select{
  transition:
    border-color var(--anim-base),
    background-color var(--anim-base),
    box-shadow var(--anim-base),
    color var(--anim-base);
  -webkit-tap-highlight-color:transparent;
}

/* Sichtbare Focus-Ringe für Keyboard-Nutzer — aber ONLY :focus-visible
   damit Maus-Klicks keinen Ring hinterlassen. */
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
a:focus-visible{
  outline:2px solid var(--o);
  outline-offset:2px;
  border-radius:inherit;
}

/* Cards mit data-lift bekommen auf Desktop-Hover einen kleinen Lift.
   Touch-Devices (hover:none) sehen den Lift NIE — dort gilt nur der
   Press-Scale. So gibt's keinen "klebrigen" Hover-Status auf Mobile. */
@media (hover:hover) and (pointer:fine){
  button[data-lift]:hover:not(:disabled),
  a[data-lift]:hover{
    transform:translateY(-1px);
    box-shadow:0 6px 22px rgba(0,0,0,.32);
  }
}

/* ── Keyframes ── */

/* Shimmer für Skeleton-Loader. */
@keyframes shimmer{
  0%{background-position:-220% 0;}
  100%{background-position:220% 0;}
}
/* Bounce-In für aktivierte Nav-Icons. */
@keyframes navIconBounce{
  0%{transform:scale(.85) translateY(2px);}
  55%{transform:scale(1.18) translateY(-2px);}
  100%{transform:scale(1) translateY(0);}
}
/* Dot-Pop — kleiner Spring beim Erscheinen, z. B. Notification-Marker. */
@keyframes dotPop{
  0%{transform:scale(0);opacity:0;}
  60%{transform:scale(1.25);opacity:1;}
  100%{transform:scale(1);}
}
/* Slide-Varianten für Banner/Toast/Chips. */
@keyframes slideUp{
  from{opacity:0;transform:translateY(20px);}
  to{opacity:1;transform:translateY(0);}
}
@keyframes slideDown{
  from{opacity:0;transform:translateY(-20px);}
  to{opacity:1;transform:translateY(0);}
}
@keyframes slideInRight{
  from{opacity:0;transform:translateX(20px);}
  to{opacity:1;transform:translateX(0);}
}
/* Press-Pop — Bestätigungs-Spring nach erfolgreichem Tap (optional). */
@keyframes pressPop{
  0%{transform:scale(.92);}
  60%{transform:scale(1.04);}
  100%{transform:scale(1);}
}
/* Glow-Pulse für "Aufmerksamkeit"-Badges (z. B. Live-Indikator). */
@keyframes glowPulse{
  0%,100%{box-shadow:0 0 0 0 var(--oGlow);}
  50%{box-shadow:0 0 0 8px transparent;}
}
/* Floating-Wobble für Hero-Elemente (sehr subtil). */
@keyframes floatY{
  0%,100%{transform:translateY(0);}
  50%{transform:translateY(-3px);}
}

/* ── Utility-Klassen ── */
.nav-icon-active{animation:navIconBounce var(--anim-spring) ease both;}
.dot-pop{animation:dotPop var(--anim-spring) ease both;}
.slide-up{animation:slideUp var(--anim-base) ease both;}
.slide-down{animation:slideDown var(--anim-base) ease both;}
.slide-in-right{animation:slideInRight var(--anim-base) ease both;}
.press-pop{animation:pressPop var(--anim-spring) ease both;}
.glow-pulse{animation:glowPulse 1.8s ease-in-out infinite;}
.float-y{animation:floatY 3.2s ease-in-out infinite;}
.skeleton{
  background:linear-gradient(90deg,var(--card) 0%,var(--card2) 50%,var(--card) 100%);
  background-size:220% 100%;
  animation:shimmer 1.8s linear infinite;
  border-radius:8px;
}

/* Stagger-Helper: setze inline --i: <index>, der Delay rechnet sich
   automatisch (z. B. style={{'--i':2}}). Spart pro-Element delay. */
.stagger > *{animation-delay:calc(var(--i,0) * 50ms);}

/* ── prefers-reduced-motion Killswitch ──
   Respektiert OS-/Browser-Setting; deaktiviert ALLE App-Animationen
   inklusive Transitions, damit motion-sensitive User nichts wackeln
   sehen. Form-Funktionen bleiben unverändert. */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    animation-duration:.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.01ms !important;
    scroll-behavior:auto !important;
  }
}
`;

/* ───── Color helpers (for custom themes) ───── */

export function hexToRgb(hex){
  const h=(hex||'#000000').replace('#','');
  return {r:parseInt(h.slice(0,2),16)||0,g:parseInt(h.slice(2,4),16)||0,b:parseInt(h.slice(4,6),16)||0};
}

export function rgba(hex,a){
  const{r,g,b}=hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function luminance(hex){
  const{r,g,b}=hexToRgb(hex);
  return (0.299*r+0.587*g+0.114*b)/255;
}

export function shiftColor(hex,amount){
  // amount: positive = lighten, negative = darken (0-1 range)
  const{r,g,b}=hexToRgb(hex);
  const dir=amount>=0?1:-1;
  const t=Math.abs(amount);
  const f=(c)=>Math.max(0,Math.min(255,Math.round(c+dir*t*(dir>0?(255-c):c))));
  const toHex=(n)=>n.toString(16).padStart(2,'0');
  return `#${toHex(f(r))}${toHex(f(g))}${toHex(f(b))}`;
}

/* Derive a full theme palette from 4 base colors + font.
   Card/card2 shift relative to bg's luminance. Alpha variants of text and highlight. */
export function buildThemePalette({bg,text,highlight,secondary,font}){
  const bgIsLight=luminance(bg)>0.5;
  const cardShift=bgIsLight?-0.06:0.10;
  const card2Shift=bgIsLight?-0.10:0.18;
  return {
    bg, card:shiftColor(bg,cardShift), card2:shiftColor(bg,card2Shift),
    border:rgba(text,0.12), sep:rgba(text,0.07),
    t1:text, t2:rgba(text,0.70), t3:rgba(text,0.45), t4:rgba(text,0.22),
    o:highlight, oSoft:rgba(highlight,0.15), oGlow:rgba(highlight,0.55),
    oFlash:rgba(highlight,0.18),
    g:'#34C759', r:'#E84545',
    blue:secondary, blueSoft:rgba(secondary,0.20), blueGlow:rgba(secondary,0.50),
    gold:highlight,
    font,
  };
}
