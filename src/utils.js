/* ═══════════════════════════════════════════════════════════════
   UTILS — safe localStorage, asset base, image helpers, text helpers.

   Everything here is pure: no React, no closures over component
   state. Used across screens, reducers, and the data layer.

   Safety notes:
   - lsGet/lsSet swallow exceptions so quota errors / private mode
     never crash the app.
   - getAssetBase always returns a string ending in '/'.
   - Image helpers re-encode user-supplied files as JPEG to strip
     EXIF + reduce blob size before persisting (avatar upload).
═══════════════════════════════════════════════════════════════ */

/* ── Local storage (best-effort JSON) ─────────────────────────── */
export const lsGet=(k,d)=>{
  try{
    const v=localStorage.getItem(k);
    return v?JSON.parse(v):d;
  }catch(e){
    return d;
  }
};

export const lsSet=(k,v)=>{
  try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}
};

/* ── Asset path ───────────────────────────────────────────────── */
// Vite setzt window.__BASE__ über index.html-Injection. Im
// Artifact-Preview oder lokal fällt es auf '/' zurück. Wir
// garantieren immer einen Trailing-Slash, damit Konsumenten
// einfach `${getAssetBase()}assets/foo.png` konkatenieren können.
export function getAssetBase(){
  const b=(typeof window!=='undefined'&&window.__BASE__)||'/';
  return b.endsWith('/')?b:b+'/';
}

/* ── Initials (Avatar fallback) ───────────────────────────────── */
export function getInitials(name){
  if(!name) return '';
  const parts=name.trim().split(/\s+/).filter(Boolean);
  if(parts.length===0) return '';
  if(parts.length===1) return parts[0][0].toUpperCase();
  return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
}

/* ── Image helpers (Avatar-Upload) ────────────────────────────── */

// Liest ein File als Base64-DataURL.
export function readImageAsDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
    r.readAsDataURL(file);
  });
}

/* ── Upload-Härtung (Profilbild, Club-Cover, Spieler-Fotos) ──────
   Abwehr gemogelter Dateien: Endung und MIME-Type sind Angaben des
   Absenders und beliebig fälschbar — validiert wird deshalb gegen
   die Magic Bytes des tatsächlichen Datei-Inhalts. Nur echte
   JPEG/PNG/WebP/GIF kommen durch; SVG (Skript-fähig), PDFs,
   Executables o. Ä. mit Bild-Endung scheitern hier. Dazu ein
   Datei-Limit (Speicher) und in resizeImage() ein Pixel-Limit
   (Dekompressions-Bomben: winzige Datei, riesige Dekodier-Fläche).
   Der Canvas-Re-Encode danach zeichnet nur Pixel neu und liefert
   IMMER data:image/jpeg — eingebettete Payloads (Polyglot-Dateien,
   Skripte in Metadaten/EXIF) überleben ihn nicht; das Original
   wird nie persistiert. */
export const MAX_IMAGE_BYTES=10*1024*1024; // 10 MB Datei-Limit
export const MAX_IMAGE_PIXELS=32e6;        // ~32 MP dekodierte Fläche

// null = Wildcard-Byte (WebP: RIFF <4 Byte Länge> WEBP).
const IMAGE_MAGIC=[
  {mime:'image/jpeg',bytes:[0xFF,0xD8,0xFF]},
  {mime:'image/png', bytes:[0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]},
  {mime:'image/gif', bytes:[0x47,0x49,0x46,0x38]}, // GIF8(7|9)a
  {mime:'image/webp',bytes:[0x52,0x49,0x46,0x46,null,null,null,null,0x57,0x45,0x42,0x50]},
];

// Wirft mit deutscher Fehlermeldung; gibt den erkannten MIME zurück.
export async function validateImageFile(file){
  if(!file||typeof file.size!=='number') throw new Error('Keine Datei ausgewählt.');
  if(file.size===0) throw new Error('Die Datei ist leer.');
  if(file.size>MAX_IMAGE_BYTES) throw new Error('Bild zu groß — maximal 10 MB.');
  const head=new Uint8Array(await file.slice(0,16).arrayBuffer());
  const hit=IMAGE_MAGIC.find(m=>m.bytes.every((b,i)=>b===null||head[i]===b));
  if(!hit) throw new Error('Nur echte JPEG-, PNG-, WebP- oder GIF-Bilder sind erlaubt.');
  return hit.mime;
}

// Kompletter gehärteter Upload-Pfad: validieren → lesen → über
// Canvas als JPEG re-encoden. Einziger Weg, auf dem User-Dateien
// in den App-State gelangen sollten.
export async function processImageUpload(file,maxDim){
  await validateImageFile(file);
  const dataUrl=await readImageAsDataUrl(file);
  return resizeImage(dataUrl,maxDim);
}

/** Defensive guard für User-generierte Bild-DataURLs.
 *  Wir akzeptieren ausschließlich JPEG/PNG/WebP-DataURLs — alles
 *  andere (insbesondere `data:image/svg+xml;...`) könnte XSS via
 *  inline-Skript transportieren. Der Canvas-Re-Encoder in
 *  resizeImage() produziert immer `data:image/jpeg;base64,...`,
 *  alle anderen Quellen kommen direkt aus dem DB-Profil und sind
 *  damit suspekt. */
const SAFE_IMAGE_PREFIX = /^data:image\/(jpeg|png|webp);base64,/i;
export function safeImageSrc(src) {
  if (!src) return null;
  if (typeof src !== 'string') return null;
  // External HTTPS URLs sind zulässig (z.B. Assets aus /public),
  // aber http: + javascript: + data:image/svg+xml werden geblockt.
  if (src.startsWith('https://') || src.startsWith('/')) return src;
  return SAFE_IMAGE_PREFIX.test(src) ? src : null;
}

/* ── Haptik (Quality-of-Life) ─────────────────────────────────── */
// Kurzes Vibrations-Feedback auf unterstützten Geräten (Android
// Chrome etc.). iOS Safari ignoriert navigator.vibrate — der Guard
// macht den Call überall crash-frei. pattern: ms oder [ms,pause,ms].
export const buzz=(pattern=10)=>{
  try{navigator.vibrate&&navigator.vibrate(pattern);}catch(e){}
};

// Zeichnet die Source-DataURL auf ein Canvas <= maxDim x maxDim und
// gibt eine JPEG-DataURL zurück. Klein genug für JSONB-Persistenz
// und das Re-Encoding entfernt EXIF/Geo-Daten aus User-Uploads.
export function resizeImage(dataUrl,maxDim){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      // Dekodier-Guards: 0×0 (kaputte Datei) und Dekompressions-
      // Bomben (kleine Datei, absurde Pixel-Fläche) abfangen, BEVOR
      // die Fläche auf ein Canvas gezeichnet wird.
      if(!img.width||!img.height){reject(new Error('Ungültige Bilddaten.'));return;}
      if(img.width*img.height>MAX_IMAGE_PIXELS){reject(new Error('Bild-Auflösung zu groß.'));return;}
      const ratio=Math.min(1,maxDim/Math.max(img.width,img.height));
      const w=Math.round(img.width*ratio);
      const h=Math.round(img.height*ratio);
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0,w,h);
      resolve(canvas.toDataURL('image/jpeg',0.82));
    };
    img.onerror=()=>reject(new Error('Bild konnte nicht geladen werden.'));
    img.src=dataUrl;
  });
}
