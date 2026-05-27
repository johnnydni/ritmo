/* ═══════════════════════════════════════════════════════════════
   AUDIO — short notification rings via Web Audio API.

   No audio files; everything is synthesized inline.

   iOS-Spezifika (Safari + installierte Web.App):
     * Ein frisch erstellter AudioContext startet in 'suspended'.
       resume() funktioniert NUR aus einer User-Geste (touchstart,
       click, keydown) heraus — aus setInterval-Callbacks wird der
       Promise zwar resolved, der Context bleibt aber stumm.
     * Jeder neue AudioContext braucht eine separate Unlock-Geste.
       Mehrfaches "new AudioContext()" pro Klingelton (alter Code)
       war auf iOS extrem fragil.
     * Lösung: EIN geteilter Context fürs gesamte App-Leben. Beim
       ersten User-Gesture entsperren wir ihn mit einem silent
       Buffer-Source (klassischer iOS-Unlock-Trick). Danach kann
       playRing() jederzeit Töne planen — auch aus setInterval.

   Wrapped in try/catch — audio is non-essential, never crash the
   UI if the browser refuses (private mode, blocked autoplay).
═══════════════════════════════════════════════════════════════ */

export const RINGS=[
  {id:'soft',label:'Sanft',desc:'Weiche Glockentöne'},
  {id:'alarm',label:'Alarm',desc:'Klassischer Wecker'},
  {id:'double',label:'Doppelton',desc:'Zwei absteigende Töne'},
  {id:'rising',label:'Aufsteigend',desc:'Vier steigende Töne'},
  {id:'whistle',label:'Schiedsrichter',desc:'Pfiff – lang kurz kurz'},
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
  // Suspended → resume zwingend aus Gesture-Handler, sonst no-op
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  if (unlocked) return;
  try {
    // Silent buffer-source: iOS markiert den Context als "primed"
    // sobald irgendetwas darüber abgespielt wurde — selbst bei
    // gain=0. AudioBuffer mit 1 Sample @ 22050Hz ist <1ms lang.
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    unlocked = true;
  } catch (e) {
    // Auch wenn der silent buffer scheitert, lassen wir den Context
    // bestehen — ein späteres playRing kann es nochmal versuchen.
  }
}

export function playRing(id) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    // Belt-and-suspenders: falls der Context nach Inaktivität wieder
    // suspended ist, versuchen wir resume(). Wenn das aus einem
    // setInterval-Callback fehlschlägt (kein Gesture), bleibt der
    // Context stumm — der unlockAudio()-Aufruf beim ersten Tap hat
    // das aber idR bereits abgefangen.
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Alle Töne werden RELATIV zum aktuellen Context-Zeitpunkt
    // gescheduled — sonst würde "0" auf der Zeitachse weit in der
    // Vergangenheit liegen und die Browser droppen die Events.
    const t0 = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.65;
    master.connect(ctx.destination);
    const beep = (f, start, dur, vol = 0.5, type = 'sine') => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      o.connect(g);
      g.connect(master);
      g.gain.setValueAtTime(0, t0 + start);
      g.gain.linearRampToValueAtTime(vol, t0 + start + 0.015);
      g.gain.setValueAtTime(vol, t0 + start + dur - 0.03);
      g.gain.linearRampToValueAtTime(0, t0 + start + dur);
      o.start(t0 + start);
      o.stop(t0 + start + dur + 0.05);
    };
    if (id === 'alarm') for (let i = 0; i < 6; i++) beep(880, i * 0.18, 0.12, 0.5, 'square');
    else if (id === 'double') for (let i = 0; i < 3; i++) { beep(880, i * 0.4, 0.16); beep(660, i * 0.4 + 0.2, 0.16); }
    else if (id === 'rising') [523, 659, 784, 1047].forEach((f, i) => beep(f, i * 0.2, 0.18, 0.5));
    else if (id === 'whistle') { beep(1100, 0, 0.45, 0.55); beep(1100, 0.6, 0.18, 0.55); beep(1100, 0.88, 0.18, 0.55); }
    else if (id === 'soft') [0, 0.65, 1.3].forEach(t => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 528;
      o.connect(g);
      g.connect(master);
      g.gain.setValueAtTime(0, t0 + t);
      g.gain.linearRampToValueAtTime(0.4, t0 + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + t + 0.6);
      o.start(t0 + t);
      o.stop(t0 + t + 0.65);
    });
    // Bewusst kein ctx.close() — der gemeinsame Context bleibt
    // bestehen, damit der nächste playRing-Aufruf ohne neuen
    // Unlock-Tanz auskommt.
  } catch (e) {
    console.warn('Audio:', e);
  }
}
