/* ═══════════════════════════════════════════════════════════════
   AUDIO — RITMO Timer-Klingeltöne.

   Zwei Quellen, EIN geteilter AudioContext:
     1. Datei-Töne (MP3 aus public/assets/sounds/) — dekodiert in einen
        AudioBuffer und über den Context abgespielt. Gleicher Origin →
        unter der CSP erlaubt (connect-src/media-src 'self').
     2. Synthese-Töne — live aus Oszillatoren (kein Asset nötig).

   Warum Buffer statt <audio>? Der Runden-Timer feuert aus einem
   setInterval — KEINE direkte User-Geste. Ein über den (beim ersten
   Tap entsperrten) Context abgespielter Buffer klingt dort zuverlässig,
   während <audio>.play() auf iOS aus setInterval oft blockiert wird.

   iOS-Spezifika:
     * Frischer AudioContext startet 'suspended'; resume() greift nur
       aus einer Geste. Lösung: EIN Context fürs App-Leben, beim ersten
       Tap via unlockAudio() entsperrt + Datei-Töne vorgeladen.

   Alles in try/catch — Audio ist non-essential, nie die UI crashen.
═══════════════════════════════════════════════════════════════ */

import { getAssetBase } from "./utils.js";

export const RINGS=[
  // Datei-Töne (src gesetzt). ritmo = Standard ab jetzt.
  {id:'ritmo',    label:'RITMO',    desc:'Original RITMO Timer-Ton, Standard', src:'assets/sounds/ritmo-timer.mp3'},
  {id:'dramatic', label:'Dramatisch',desc:'Dramatischer Countdown',             src:'assets/sounds/dramatic-timer.mp3'},
  // Synthese-Töne (live erzeugt).
  {id:'chime',    label:'Glocke',   desc:'Warmes Glockenspiel, aufsteigend'},
  {id:'beacon',   label:'Signal',   desc:'Modernes Doppel-Signal'},
  {id:'fanfare',  label:'Fanfare',  desc:'Sportliche Fanfare zum Rundenende'},
];

/* Shared AudioContext + Decode-Cache fürs gesamte App-Leben. */
let sharedCtx = null;
let unlocked = false;
const bufferCache = {}; // url → AudioBuffer

function getCtx() {
  if (sharedCtx) return sharedCtx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    sharedCtx = new AC();
  } catch (e) {
    return null;
  }
  return sharedCtx;
}

/* decodeAudioData robust (Promise- ODER Callback-Form, je nach Browser). */
function decode(ctx, arrayBuffer) {
  return new Promise((res, rej) => {
    let settled = false;
    const ok = b => { if (!settled) { settled = true; res(b); } };
    const no = e => { if (!settled) { settled = true; rej(e); } };
    let p;
    try { p = ctx.decodeAudioData(arrayBuffer, ok, no); } catch (e) { no(e); }
    if (p && typeof p.then === 'function') p.then(ok, no);
  });
}

/* Lädt + dekodiert eine Datei (gecached). */
function loadBuffer(ctx, url) {
  if (bufferCache[url]) return Promise.resolve(bufferCache[url]);
  return fetch(url)
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
    .then(ab => decode(ctx, ab))
    .then(buf => { bufferCache[url] = buf; return buf; });
}

function playBuffer(ctx, buf) {
  const s = ctx.createBufferSource(), g = ctx.createGain();
  g.gain.value = 1.0;
  s.buffer = buf;
  s.connect(g); g.connect(ctx.destination);
  s.start(ctx.currentTime + 0.02);
}

/* Datei-Ton: sofort spielen wenn gecached, sonst laden → dann spielen. */
function playFile(ctx, relSrc) {
  const url = getAssetBase() + relSrc;
  if (bufferCache[url]) return playBuffer(ctx, bufferCache[url]);
  loadBuffer(ctx, url).then(buf => playBuffer(ctx, buf)).catch(e => console.warn('Audio file:', e));
}

/* Entsperrt den AudioContext (iOS) + lädt die Datei-Töne vor. MUSS aus
   einem User-Gesture-Handler kommen (pointerdown/click/keydown). */
export function unlockAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (unlocked) return;
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    unlocked = true;
  } catch (e) {/* Context bleibt bestehen, späterer Versuch möglich. */}
  // Datei-Töne vorladen, damit der Timer sie sofort abspielen kann.
  try { RINGS.filter(r => r.src).forEach(r => loadBuffer(ctx, getAssetBase() + r.src).catch(() => {})); }
  catch (e) {}
}

/* Live-Synthese (chime / beacon / fanfare). */
function synth(ctx, id) {
  const t0 = ctx.currentTime + 0.03;
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  // Grundton + optionaler Oktav-Oberton, weicher Anschlag + Glocken-Decay.
  const note = (f, start, dur, vol = 0.5, type = 'sine', harm = 0) => {
    const s = t0 + start;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    o.connect(g); g.connect(master);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(vol, s + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, s + dur);
    o.start(s); o.stop(s + dur + 0.05);
    if (harm > 0) {
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'sine'; o2.frequency.value = f * 2;
      o2.connect(g2); g2.connect(master);
      g2.gain.setValueAtTime(0.0001, s);
      g2.gain.exponentialRampToValueAtTime(vol * harm, s + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0008, s + dur * 0.8);
      o2.start(s); o2.stop(s + dur + 0.05);
    }
  };
  if (id === 'fanfare') {
    note(392, 0.00, 0.18, 0.55, 'triangle', 0.30);
    note(523, 0.17, 0.18, 0.55, 'triangle', 0.30);
    note(659, 0.34, 0.22, 0.60, 'triangle', 0.35);
    note(784, 0.55, 0.70, 0.62, 'triangle', 0.40);
  } else if (id === 'beacon') {
    for (let i = 0; i < 2; i++) {
      const b = i * 0.46;
      note(988,  b + 0.00, 0.14, 0.52, 'sine', 0.22);  // B5
      note(1319, b + 0.15, 0.20, 0.52, 'sine', 0.22);  // E6
    }
  } else { // 'chime'
    [523, 659, 784, 1047].forEach((f, i) =>
      note(f, i * 0.16, 0.95 - i * 0.07, 0.5, 'sine', 0.5));
  }
}

/* ── PLATZ-ANSAGEN ────────────────────────────────────────────────
   Drei Signale für den Turnierbetrieb, gedacht für den Moment, in
   dem jemand vom Rand aus über die Courts ruft. Synthese statt
   Datei: kein Asset, kein Ladezeitpunkt, kein CSP-Thema — und der
   Klang lässt sich hier direkt nachjustieren.

   Jedes Signal hat eine eigene Kontur, damit man sie ohne Blick auf
   den Screen auseinanderhält:
     start  steigt   — es geht los
     last   klopft   — Achtung, gleich vorbei
     end    fällt    — vorbei
   Alle drei liegen deutlich über dem Timer-Ton, sonst gehen sie in
   der Hallenakustik unter.
──────────────────────────────────────────────────────────────── */
export const CUES=[
  {id:'start', label:'Rundenstart!', desc:'Aufsteigende Fanfare — die Runde läuft.'},
  {id:'last',  label:'Letzter Ball!', desc:'Doppelsignal — der letzte Ballwechsel.'},
  {id:'end',   label:'Runde aus!',    desc:'Abfallendes Horn — Schluss, rotieren.'},
];

function cue(ctx, id) {
  const t0 = ctx.currentTime + 0.03;
  const master = ctx.createGain();
  master.gain.value = 1.0;
  master.connect(ctx.destination);
  // Ein Ton mit Körper: Grundton als Sägezahn (durchsetzungsfähig),
  // darüber eine Quinte als Dreieck, damit es nach Signalhorn klingt
  // und nicht nach Piepser.
  const horn = (f, start, dur, vol = 0.5) => {
    const s = t0 + start;
    [['sawtooth', f, vol], ['triangle', f * 1.5, vol * 0.45],
     ['sine', f * 2, vol * 0.30]].forEach(([type, freq, v]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      o.connect(g); g.connect(master);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(v, s + 0.025);
      g.gain.setValueAtTime(v, s + dur * 0.62);
      g.gain.exponentialRampToValueAtTime(0.0008, s + dur);
      o.start(s); o.stop(s + dur + 0.05);
    });
  };
  if (id === 'start') {
    // C – G – C': klettert nach oben, letzter Ton trägt aus.
    horn(523, 0.00, 0.17, 0.50);
    horn(784, 0.16, 0.17, 0.52);
    horn(1047, 0.32, 0.62, 0.58);
  } else if (id === 'last') {
    // Zwei kurze, harte Schläge auf derselben Höhe — klingt wie
    // Klopfen, nicht wie Melodie. Deshalb keine Terz, keine Bewegung.
    horn(880, 0.00, 0.15, 0.55);
    horn(880, 0.22, 0.15, 0.55);
    horn(1175, 0.44, 0.34, 0.55);
  } else { // 'end'
    // Fällt in Quarten ab, letzter Ton lang und tief: Schlusspunkt.
    horn(880, 0.00, 0.20, 0.52);
    horn(659, 0.19, 0.20, 0.52);
    horn(440, 0.38, 0.85, 0.58);
  }
}

/* Spielt eine Platz-Ansage (siehe CUES). Unbekannte id → nichts. */
export function playCue(id) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (!CUES.some(c => c.id === id)) return;
    cue(ctx, id);
  } catch (e) {
    console.warn('Audio cue:', e);
  }
}

/* Spielt einen RINGS-Ton. Unbekannte/leere id → RINGS[0] (Standard,
   = RITMO-Datei), damit alte gespeicherte IDs nie in Stille resultieren. */
export function playRing(id) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const ring = RINGS.find(r => r.id === id) || RINGS[0];
    if (ring.src) playFile(ctx, ring.src);
    else synth(ctx, ring.id);
  } catch (e) {
    console.warn('Audio:', e);
  }
}
