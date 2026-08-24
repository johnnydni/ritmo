/* ═══════════════════════════════════════════════════════════════
   OCR — Spielernamen aus Screenshots lesen.

   Läuft komplett auf dem Gerät (Tesseract via WebAssembly): die
   Screenshots verlassen das Handy nie, es braucht keinen API-Key und
   nach dem ersten Lauf funktioniert es offline.

   Alles wird LAZY geladen — die ~3,8 MB WASM-Core landen erst im Netz,
   wenn jemand die Funktion wirklich benutzt, und danach im Service-
   Worker-Cache. Deshalb sind hier überall dynamische Imports.

   CSP-Hinweis: Worker, Core und Sprachdaten kommen ausschließlich aus
   'self' — die Default-CDN-Pfade von tesseract.js wären an der Policy
   in index.html gescheitert.
═══════════════════════════════════════════════════════════════ */

import { getAssetBase } from './utils.js';

/* WASM-SIMD-Probe (dieselben Bytes wie wasm-feature-detect). Ent-
   scheidet, welcher der beiden Cores geladen wird — SIMD ist gut
   doppelt so schnell, fehlt aber auf älteren iOS-Versionen. */
function hasSimd(){
  try{
    return WebAssembly.validate(new Uint8Array([
      0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11,
    ]));
  }catch(e){ return false; }
}

let workerPromise=null;

/* Worker einmal pro Session aufbauen und offenhalten — der Core-Download
   und das Laden der Sprachdaten sind der teure Teil, nicht das Erkennen. */
async function getWorker(onProgress){
  if(workerPromise) return workerPromise;
  workerPromise=(async()=>{
    const [{ createWorker }, workerMod, coreMod]=await Promise.all([
      import('tesseract.js'),
      import('tesseract.js/dist/worker.min.js?url'),
      hasSimd()
        ? import('tesseract.js-core/tesseract-core-simd-lstm.wasm.js?url')
        : import('tesseract.js-core/tesseract-core-lstm.wasm.js?url'),
    ]);
    return createWorker('deu',1,{
      workerPath:workerMod.default,
      corePath:coreMod.default,
      langPath:`${getAssetBase()}tesseract/lang`,
      gzip:true,
      logger:m=>{
        if(!onProgress) return;
        // Ladephase und Erkennung getrennt melden — der erste Lauf
        // hängt spürbar am Download, spätere nur noch am Rechnen.
        if(m.status==='recognizing text') onProgress('scan',m.progress||0);
        else onProgress('load',m.progress||0);
      },
    });
  })();
  try{ return await workerPromise; }
  catch(e){ workerPromise=null; throw e; }
}

/* Worker samt WASM-Speicher freigeben (beim Schließen des Sheets). */
export async function releaseOcr(){
  const p=workerPromise; workerPromise=null;
  if(!p) return;
  try{ const w=await p; await w.terminate(); }catch(e){}
}

/* ── Namens-Extraktion ─────────────────────────────────────────────
   Screenshots aus WhatsApp, Playtomic & Co. enthalten neben den Namen
   jede Menge Beiwerk: Uhrzeiten, Häkchen, Emojis, Systemzeilen. Wir
   werfen zeilenweise alles raus, was kein Name sein kann, statt zu
   raten — was durchrutscht, korrigiert der Bestätigungs-Dialog. */

// Zeilen, die in solchen Screenshots als Text auftauchen, aber nie ein
// Spielername sind (App-Chrome, Padel-Vokabular, Wochentage).
const NOISE=new Set([
  'du','you','ich','me','heute','gestern','morgen','online','offline','zuletzt',
  'montag','dienstag','mittwoch','donnerstag','freitag','samstag','sonntag',
  'mo','di','mi','do','fr','sa','so','uhr','min','std','stunde','stunden',
  'padel','tennis','court','courts','platz','plätze','halle','club','center',
  'buchung','buchungen','booking','reservierung','termin','level','match',
  'matches','spiel','spiele','spieler','teilnehmer','mitglieder','gruppe',
  'team','teams','turnier','americano','mexicano','whatsapp','telegram',
  'nachricht','nachrichten','info','gruppeninfo','admin','administrator',
  'gesamt','summe','preis','eur','euro','bezahlt','offen','anfrage','warteliste',
  'zusagen','absagen','zugesagt','abgesagt','vielleicht','anwesend','fehlt',
  'übersicht','uebersicht','platzbuchung','bestätigt','bestaetigt','offen',
  'zurück','zurueck','weiter','abbrechen','speichern','einstellungen','suche',
  'alle','neu','name','vorname','nachname','gast','gäste','gaeste','punkte',
]);

const EMOJI=/[\p{Extended_Pictographic}\u{1F000}-\u{1FAFF}\u{FE0F}\u{20E3}\u{2190}-\u{21FF}\u{2600}-\u{27BF}]/gu;

/* Namensbestandteile, die klein bleiben dürfen (niederländisch,
   spanisch, italienisch …) — sonst wird aus „van Dijk" ein „Van Dijk". */
const PARTICLES=new Set(['van','von','de','del','della','di','da','das','dos',
  'der','den','ter','ten','le','la','du','of','ibn']);

const isNameToken=t=>/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'’.-]*$/.test(t);
const isUpperStart=t=>{
  const c=t.charAt(0);
  return c===c.toUpperCase()&&c!==c.toLowerCase();
};

/* Eine Rohzeile in einen Namen verwandeln — oder null, wenn es keiner ist. */
export function lineToName(raw){
  let s=String(raw||'').replace(/\u00a0/g,' ');
  s=s.replace(EMOJI,' ');
  // Telefonnummern (auch mit Länderpräfix) und Zahlenblöcke raus.
  s=s.replace(/\+?\d[\d\s/()-]{5,}\d/g,' ');
  // Uhrzeiten, Datumsangaben, Preise.
  s=s.replace(/\b\d{1,2}[:.]\d{2}(\s*(uhr|am|pm))?\b/gi,' ');
  s=s.replace(/\b\d{1,2}\.\d{1,2}\.(\d{2,4})?\b/g,' ');
  s=s.replace(/\b\d+([.,]\d+)?\s*(€|eur|euro)\b/gi,' ');
  // Listen-/Chat-Marker am Zeilenanfang, Klammerzusätze irgendwo.
  s=s.replace(/^[\s>«»"„“”'’•·*\-–—~|]+/,'');
  s=s.replace(/^\d{1,2}\s*[.)\]]\s*/,'');
  s=s.replace(/\([^)]*\)/g,' ');
  s=s.replace(/\s{2,}/g,' ').trim();
  if(!s) return null;

  // Tokenweise sieben: Zahlen, Rauschwörter und Nicht-Namen fliegen
  // raus. So überlebt „Johannes Bauer" auch die Zeile
  // „2. Johannes Bauer   Level 3.5".
  const kept=[]; let dropped=0;
  for(let t of s.split(/\s+/)){
    t=t.replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ]+|[^A-Za-zÀ-ÖØ-öø-ÿ.'’-]+$/g,'');
    if(!t) continue;
    if(/\d/.test(t)) continue;                       // „3.5", „19h"
    if(NOISE.has(t.toLowerCase())){ dropped++; continue; } // „Level", „gestern"
    if(!isNameToken(t)) continue;
    kept.push(t);
  }
  if(!kept.length||kept.length>3) return null;
  // Überwiegt das Rauschen, war die Zeile eine Überschrift und kein
  // Name — „Padel Center Hamburg" soll nicht als „Hamburg" landen.
  if(dropped>kept.length) return null;
  // Echte Namen stehen in solchen Screenshots groß — Satzfragmente wie
  // „bin dabei" fallen damit raus, Partikel bleiben erlaubt.
  if(!kept.every(t=>isUpperStart(t)||PARTICLES.has(t.toLowerCase()))) return null;
  if(kept.every(t=>t.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g,'').length<2)) return null;
  const name=kept.map(t=>PARTICLES.has(t.toLowerCase())
    ? t.toLowerCase()
    : t.charAt(0).toUpperCase()+t.slice(1)).join(' ');
  if(name.length<2||name.length>28) return null;
  if(!/[aeiouäöüyAEIOUÄÖÜY]/.test(name)) return null; // typischer OCR-Müll
  return name;
}

/* Erkannten Text in eine Namensliste überführen — ohne Dubletten und
   ohne die bereits eingetragenen Spieler. */
export function namesFromText(text,existing=[]){
  const seen=new Set(existing.map(n=>String(n).trim().toLowerCase()));
  const out=[];
  for(const raw of String(text||'').split(/\r?\n/)){
    const n=lineToName(raw);
    if(!n) continue;
    const key=n.toLowerCase();
    if(seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

/* Einen Screenshot lesen. `image` ist alles, was tesseract.js frisst —
   wir übergeben eine Data-URL aus der Bild-Pipeline in utils.js. */
export async function readNamesFromImage(image,{existing=[],onProgress}={}){
  const worker=await getWorker(onProgress);
  const { data }=await worker.recognize(image);
  // Zeilen mit miserabler Konfidenz gar nicht erst anbieten — die
  // liefern fast nur Buchstabensalat.
  const lines=Array.isArray(data?.lines)&&data.lines.length
    ? data.lines.filter(l=>(l.confidence??100)>=55).map(l=>l.text).join('\n')
    : (data?.text||'');
  return namesFromText(lines,existing);
}
