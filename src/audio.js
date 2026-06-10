/* ═══════════════════════════════════════════════════════════════
   AUDIO — RITMO Timer-Klingeltöne, synthetisiert via Web Audio API.

   Bewusst KEINE Audio-Dateien und KEINE System-Sounds: drei eigene,
   mehrstimmige Klingeltöne werden live aus Oszillatoren gebaut. Das
   ist robuster als gehostete MP3s (keine CSP-/Hosting-Probleme) und
   klingt durch Obertöne + Glocken-Decay nach „Ton", nicht nach Piep.

   iOS-Spezifika (Safari + installierte Web.App):
     * Ein frisch erstellter AudioContext startet in 'suspended'.
       resume() funktioniert NUR aus einer User-Geste — aus einem
       setInterval-Callback bleibt der Context sonst stumm.
     * Lösung: EIN geteilter Context fürs gesamte App-Leben. Beim
       ersten User-Gesture (siehe unlockAudio) wird er mit einem
       silent Buffer entsperrt; danach kann playRing() jederzeit Töne
       planen — auch aus dem Runden-Timer.

   Alles in try/catch — Audio ist non-essential, nie die UI crashen.
═══════════════════════════════════════════════════════════════ */

export const RINGS=[
  {id:'chime',   label:'Glocke',  desc:'Warmes Glockenspiel, aufsteigend'},
  {id:'beacon',  label:'Signal',  desc:'Modernes Doppel-Signal'},
  {id:'fanfare', label:'Fanfare', desc:'Sportliche Fanfare zum Rundenende'},
];

/* Shared AudioContext — lazy initialisiert, lebt für die gesamte
   App-Session. */
let sharedCtx = null;
let unlocked = false;

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

/* Entsperrt den AudioContext nach iOS-Regeln. MUSS aus einem
   User-Gesture-Handler heraus aufgerufen werden (pointerdown,
   click, keydown). Spielt einen 1-Sample-Silent-Buffer, der
   ausreichend "Audio-Aktivität" registriert, damit der Context
   ab jetzt jederzeit Töne abspielen darf — auch aus setInterval. */
export function unlockAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  if (unlocked) return;
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    unlocked = true;
  } catch (e) {
    // Auch wenn der silent buffer scheitert, bleibt der Context
    // bestehen — ein späteres playRing kann es nochmal versuchen.
  }
}

/* Spielt einen der RINGS ab. Unbekannte/leere id → 'chime' (Default),
   damit alte gespeicherte Ring-IDs nie in Stille resultieren. */
export function playRing(id) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    // Falls der Context nach Inaktivität wieder suspended ist:
    // resume() versuchen (greift, weil unlockAudio() ihn beim ersten
    // Tap bereits "primed" hat).
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Kleiner Vorlauf (+0.03 s), damit der erste Ton nicht in der
    // Vergangenheit gescheduled wird (Browser droppen solche Events).
    const t0 = ctx.currentTime + 0.03;

    // Master mit etwas Headroom — laut genug, ohne zu clippen.
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    // Eine „Stimme": Grundton + optionaler Oktav-Oberton, weicher
    // Anschlag und glockiges exponentielles Ausklingen → voller,
    // ton-artiger Klang statt flachem Beep.
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
      // Sportliche Fanfare: G4–C5–E5, dann gehaltenes G5. Triangle =
      // weich-brassig, mit Oktav-Obertönen für Glanz.
      note(392, 0.00, 0.18, 0.55, 'triangle', 0.30);
      note(523, 0.17, 0.18, 0.55, 'triangle', 0.30);
      note(659, 0.34, 0.22, 0.60, 'triangle', 0.35);
      note(784, 0.55, 0.70, 0.62, 'triangle', 0.40);
    } else if (id === 'beacon') {
      // Modernes Doppel-Signal: zwei schnelle Hoch-Paare (B5→E6),
      // zweimal wiederholt — erinnert an ein klares Handy-Signal.
      for (let i = 0; i < 2; i++) {
        const b = i * 0.46;
        note(988,  b + 0.00, 0.14, 0.52, 'sine', 0.22);  // B5
        note(1319, b + 0.15, 0.20, 0.52, 'sine', 0.22);  // E6
      }
    } else {
      // 'chime' (Default): warmes, aufsteigendes Glockenspiel
      // C5–E5–G5–C6, jede Note mit langem Glocken-Decay + Oktav-Oberton.
      [523, 659, 784, 1047].forEach((f, i) =>
        note(f, i * 0.16, 0.95 - i * 0.07, 0.5, 'sine', 0.5));
    }
    // Bewusst kein ctx.close() — der gemeinsame Context bleibt
    // bestehen, damit der nächste Aufruf ohne neuen Unlock auskommt.
  } catch (e) {
    console.warn('Audio:', e);
  }
}
