/* ═══════════════════════════════════════════════════════════════
   LIQUID GLASS — Lichtbrechung am Rand statt nur Unschaerfe.

   Nur fuer die STEUERUNGSEBENE: Tab-Leiste, Knopfleiste, runde
   Glasknoepfe. Inhaltskarten bleiben klares GLASS (App.jsx) — Glas auf
   Inhalt ist ein Anti-Pattern, und Glas auf Glas erst recht.

   Wie es entsteht: eine Displacement-Map je Form (Canvas → data:-URL).
   Im Randband (`bezel`) wird der Hintergrund nach INNEN gesampelt, so
   wirkt die Kante wie eine gewoelbte Linse; dazu eine leichte
   Mattierung und drei Farbkanaele mit verschiedener Staerke
   (chromatische Aberration). Darueber die Glas-Haut (.lg-skin in
   theme.js): ein Hauch Weiss, Spiegelkante, Innenlicht.

   Zwei Wege, je nach Engine:
   - `backdrop` (Chromium): backdrop-filter:url(#…) bricht ALLES
     dahinter, auch scrollenden Inhalt.
   - `clone` (WebKit/iOS, Firefox): backdrop-filter:url() gibt es dort
     nicht. Stattdessen liegt eine Kopie des Fotos (PhotoBackdrop des
     Screens, gefunden ueber data-photo-backdrop) deckungsgleich im
     Glas und bekommt filter:url(#…). Gebrochen wird damit das Foto;
     scrollender Inhalt erscheint in der Mitte nur mattiert (die Kopie
     liegt nur im Randband, die Mitte ist ein normaler Backdrop-Blur).
   Ohne Foto im Screen faellt `clone` auf reines Mattglas zurueck.

   Testen: window.__LG_MODE = 'clone' | 'backdrop' | 'off' erzwingt
   einen Weg (z. B. per Playwright addInitScript).
═══════════════════════════════════════════════════════════════ */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

const DPR = 2;
const mapCache = new Map();

/* R = x-Versatz, G = y-Versatz, 128 = neutral. */
export function makeGlassMap(w, h, r, { bezel = 16, curve = 2.2 } = {}) {
  const key = `${w}|${h}|${r}|${bezel}|${curve}`;
  if (mapCache.has(key)) return mapCache.get(key);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * DPR)); c.height = Math.max(1, Math.round(h * DPR));
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(c.width, c.height), d = img.data;
  const hw = w / 2, hh = h / 2, rr = Math.min(r, hw, hh), b = Math.min(bezel, hw, hh);
  for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
    const i = (py * c.width + px) * 4;
    d[i] = 128; d[i + 1] = 128; d[i + 2] = 128; d[i + 3] = 255;
    const lx = (px + .5) / DPR - hw, ly = (py + .5) / DPR - hh;
    const qx = Math.abs(lx) - (hw - rr), qy = Math.abs(ly) - (hh - rr);
    const ox = Math.max(qx, 0), oy = Math.max(qy, 0), out = Math.hypot(ox, oy);
    const sdf = out + Math.min(Math.max(qx, qy), 0) - rr;
    if (sdf > 0) continue;
    const dist = -sdf; if (dist >= b) continue;
    let nx, ny;
    if (qx > 0 && qy > 0) { nx = ox / out; ny = oy / out; }
    else if (qx > qy) { nx = 1; ny = 0; } else { nx = 0; ny = 1; }
    if (lx < 0) nx = -nx; if (ly < 0) ny = -ny;
    const m = Math.pow(1 - dist / b, curve);
    d[i] = Math.round(128 - nx * m * 127);
    d[i + 1] = Math.round(128 - ny * m * 127);
  }
  ctx.putImageData(img, 0, 0);
  const url = c.toDataURL('image/png');
  if (mapCache.size > 60) mapCache.clear();
  mapCache.set(key, url);
  return url;
}

let modeCache = null;
export function lgMode() {
  if (typeof window === 'undefined') return 'off';
  if (window.__LG_MODE) return window.__LG_MODE;
  if (modeCache) return modeCache;
  const chromium = !!navigator.userAgentData?.brands?.some(b => /Chromium/.test(b.brand));
  modeCache = chromium ? 'backdrop' : 'clone';
  return modeCache;
}

/* Die Foto-Ebene des Screens, in dem das Glas steht. */
function findBackdrop(el) {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    const b = n.querySelector(':scope > [data-photo-backdrop]');
    if (b) return b;
  }
  return null;
}

/* Liegt absolut in einem positionierten Rahmen (inset 0), Kinder des
   Rahmens stehen darueber. `radius` in px (999 = Kapsel). */
export function LiquidGlass({ radius = 999, bezel = 16, scale = 34, frost = 1.6, className = '', style }) {
  const id = 'lg' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const box = useRef(null), bdEl = useRef(null), cl = useRef(null);
  const [g, setG] = useState(null);   // {w,h,map,bd:{x,y,w,h,k}}
  const mode = lgMode();

  useLayoutEffect(() => {
    if (mode === 'off') return;
    const el = box.current; if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width), h = Math.round(r.height);
      if (w < 2 || h < 2) return;
      const rr = Math.min(radius, w / 2, h / 2);
      const map = makeGlassMap(w, h, rr, { bezel });
      let bd = null;
      if (mode === 'clone') {
        const b = findBackdrop(el);
        if (b) {
          bdEl.current = b;
          const br = b.getBoundingClientRect();
          bd = { x: Math.round(br.left - r.left), y: Math.round(br.top - r.top),
            w: Math.round(br.width), h: Math.round(br.height), k: b.dataset.key || '' };
        }
      }
      setG(o => (o && o.w === w && o.h === h && o.map === map && JSON.stringify(o.bd) === JSON.stringify(bd)) ? o : { w, h, map, bd, rr });
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    const ro = new ResizeObserver(kick); ro.observe(el);
    window.addEventListener('resize', kick);
    return () => { ro.disconnect(); window.removeEventListener('resize', kick); if (raf) cancelAnimationFrame(raf); };
  }, [radius, bezel, mode]);

  /* Die Kopie des Hintergrunds: derselbe Knoten wie die Foto-Ebene
     des Screens (Foto samt Verlauf und Abdunklung, oder der Verlauf des
     Profils), nur absolut statt fixed. So stimmt sie Pixel fuer Pixel. */
  useEffect(() => {
    const host = cl.current, b = bdEl.current;
    if (!host || !b) return;
    const c = b.cloneNode(true);
    c.removeAttribute('data-photo-backdrop');
    Object.assign(c.style, { position: 'absolute', inset: 'auto', left: '0', top: '0',
      right: 'auto', bottom: 'auto', width: '100%', height: '100%', zIndex: '0' });
    host.replaceChildren(c);
  }, [g?.bd?.k, !!g?.bd]);

  const br = radius >= 999 ? 999 : radius;
  const filter = g && (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id={id} x="0" y="0" width={g.w} height={g.h} filterUnits="userSpaceOnUse"
        primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feImage href={g.map} x="0" y="0" width={g.w} height={g.h} preserveAspectRatio="none" result="map" />
        <feGaussianBlur in="SourceGraphic" stdDeviation={frost} result="frost" />
        <feDisplacementMap in="frost" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" result="dR" />
        <feDisplacementMap in="frost" in2="map" scale={scale * 1.14} xChannelSelector="R" yChannelSelector="G" result="dG" />
        <feDisplacementMap in="frost" in2="map" scale={scale * 1.28} xChannelSelector="R" yChannelSelector="G" result="dB" />
        <feColorMatrix in="dR" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r" />
        <feColorMatrix in="dG" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="gg" />
        <feColorMatrix in="dB" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b" />
        <feBlend in="r" in2="gg" mode="screen" result="rg" />
        <feBlend in="rg" in2="b" mode="screen" result="rgb" />
        <feColorMatrix in="rgb" type="saturate" values="1.35" />
      </filter>
    </svg>
  );

  /* Randband als Maske: aussen voll, nach innen auslaufend. */
  const ring = 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)';
  return (
    <div ref={box} aria-hidden="true" className={`lg ${className}`}
      data-lg-mode={mode}
      style={{ position: 'absolute', inset: 0, borderRadius: br, overflow: 'hidden',
        pointerEvents: 'none', isolation: 'isolate', ...style }}>
      {filter}
      {mode === 'backdrop' && g && (
        <div className="lg-refract" style={{ position: 'absolute', inset: 0, borderRadius: br,
          WebkitBackdropFilter: `url(#${id})`, backdropFilter: `url(#${id})` }} />
      )}
      {mode === 'clone' && (
        <div className="lg-frost" style={{ position: 'absolute', inset: 0, borderRadius: br,
          WebkitBackdropFilter: `blur(${frost}px) saturate(135%)`, backdropFilter: `blur(${frost}px) saturate(135%)` }} />
      )}
      {mode === 'clone' && g?.bd && (
        <div className="lg-refract" style={{ position: 'absolute', inset: 0, borderRadius: br,
          overflow: 'hidden', filter: `url(#${id})`,
          padding: Math.min(bezel + 4, g.w / 2, g.h / 2), boxSizing: 'border-box',
          WebkitMask: ring, WebkitMaskComposite: 'xor', mask: ring, maskComposite: 'exclude' }}>
          <div ref={cl} style={{ position: 'absolute', left: g.bd.x, top: g.bd.y, width: g.bd.w, height: g.bd.h }} />
        </div>
      )}
      <div className="lg-skin" style={{ position: 'absolute', inset: 0, borderRadius: br }} />
    </div>
  );
}
