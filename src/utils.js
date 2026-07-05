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
