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
   Drei Signale für den Turnierbetrieb, geklaut aus der Stadionakustik
   von Baseball und Eishockey — die kennt jeder, ohne dass sie
   jemand erklären muss:

     start  Orgel-Fanfare — der „Charge!"-Ruf aus dem Ballpark
     last   Air-Horn      — zwei kurze Stöße, Aufmerksamkeit
     end    Tor-Horn      — das tiefe Blasen aus der Eishalle

   Synthese statt Datei: kein Asset, kein Ladezeitpunkt, kein
   CSP-Thema — und der Klang lässt sich hier direkt nachjustieren.
   Die Tonhöhen und Längen stehen alle unten in cue().
──────────────────────────────────────────────────────────────── */
export const CUES=[
  {id:'start', label:'Rundenstart!', desc:'Orgel-Fanfare wie im Ballpark.'},
  {id:'last',  label:'Letzter Ball!', desc:'Doppelter Air-Horn-Stoß.'},
  {id:'end',   label:'Runde aus!',    desc:'Tiefes Tor-Horn aus der Eishalle.'},
];

/* Weiche Sättigung. Ohne die klingen gestapelte Oszillatoren nach
   Synthesizer; erst das Anzerren gibt dem Horn den Trichter-Biss,
   den man aus der Halle kennt. */
function driveCurve(amount) {
  const n = 1024, c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * 2 / n - 1;
    c[i] = (1 + amount) * x / (1 + amount * Math.abs(x));
  }
  return c;
}

/* Pegel-Ausgleich pro Ansage. Ohne den lag die Orgel-Fanfare rund
   10 dB unter dem Tor-Horn (offline gerendert und nachgemessen:
   RMS 0.11 gegen 0.34) — auf dem Platz haette man den Rundenstart
   schlicht ueberhoert, waehrend das Schluss-Horn ins Clipping lief. */
const CUE_GAIN = { start: 1.55, last: 0.85, end: 0.58 };

function cue(ctx, id) {
  const t0 = ctx.currentTime + 0.03;
  const master = ctx.createGain();
  master.gain.value = CUE_GAIN[id] || 0.85;
  master.connect(ctx.destination);

  /* Hammond-Prinzip: eine Orgelstimme ist nichts als eine Handvoll
     Sinus-Partiale übereinander. Genau das steht auf jedem
     Baseball-Feld. Die Zugriegel-Mischung unten ist bewusst
     obertonreich — dünner klingt sie nach Spielzeug. */
  const ORGAN = [[1, 1.0], [2, 0.62], [3, 0.42], [4, 0.30], [6, 0.20], [8, 0.13]];
  const organ = (f, start, dur, vol = 0.5) => {
    const s = t0 + start;
    const bus = ctx.createGain();
    bus.connect(master);
    bus.gain.setValueAtTime(0.0001, s);
    bus.gain.exponentialRampToValueAtTime(vol, s + 0.012);   // harter Anschlag
    bus.gain.setValueAtTime(vol, s + dur * 0.80);
    bus.gain.exponentialRampToValueAtTime(0.0008, s + dur);
    ORGAN.forEach(([mult, amp]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * mult;
      g.gain.value = amp * 0.34;
      o.connect(g); g.connect(bus);
      o.start(s); o.stop(s + dur + 0.06);
    });
  };

  /* Air-Horn / Tor-Horn: mehrere leicht verstimmte Sägezähne durch
     einen resonanten Tiefpass, davor ein kurzer Tonhöhen-Rutsch
     nach oben. Der Rutsch ist der Trick — ein Horn braucht einen
     Moment, bis die Luft steht, und genau daran erkennt man es. */
  const airhorn = (f, start, dur, vol = 0.5, drive = 6) => {
    const s = t0 + start;
    const shaper = ctx.createWaveShaper();
    shaper.curve = driveCurve(drive);
    shaper.oversample = '2x';
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(6200, f * 9);
    lp.Q.value = 3.2;
    const bus = ctx.createGain();
    shaper.connect(lp); lp.connect(bus); bus.connect(master);
    bus.gain.setValueAtTime(0.0001, s);
    bus.gain.exponentialRampToValueAtTime(vol, s + 0.03);
    bus.gain.setValueAtTime(vol, s + dur * 0.86);
    bus.gain.exponentialRampToValueAtTime(0.0008, s + dur);
    // Grundton dreifach verstimmt (Schwebung = Hallen-Rauheit),
    // dazu Quinte und Oktave für den typischen Zwei-Ton-Trichter.
    [[0.994, 0.34], [1.0, 0.36], [1.007, 0.34],
     [1.5, 0.20], [2.0, 0.13]].forEach(([mult, amp]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      const target = f * mult;
      o.frequency.setValueAtTime(target * 0.70, s);
      o.frequency.exponentialRampToValueAtTime(target, s + 0.075);
      g.gain.value = amp;
      o.connect(g); g.connect(shaper);
      o.start(s); o.stop(s + dur + 0.06);
    });
  };

  if (id === 'start') {
    // Der „Charge!"-Ruf: G – G – C – E – G, letzter Ton gehalten.
    // Fünf Töne, nicht drei — an der Anzahl hängt der Wiedererkennungs-
    // wert mindestens so sehr wie an den Intervallen.
    organ(392, 0.00, 0.15, 0.42);
    organ(392, 0.15, 0.15, 0.42);
    organ(523, 0.30, 0.15, 0.46);
    organ(659, 0.44, 0.15, 0.46);
    organ(784, 0.58, 0.62, 0.52);
  } else if (id === 'last') {
    // Zwei kurze Stöße aus der Handhupe, hoch genug, dass sie über
    // Platzlärm kommen.
    airhorn(415, 0.00, 0.26, 0.44, 7);
    airhorn(415, 0.34, 0.34, 0.46, 7);
  } else { // 'end'
    // Tor-Horn: tief, lang, zwei Trichter im Quintabstand. Das ist
    // der Schlusspunkt — hier darf es dick sein.
    airhorn(155, 0.00, 1.45, 0.50, 9);
    airhorn(233, 0.05, 1.40, 0.30, 9);
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
