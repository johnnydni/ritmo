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

:root[data-theme="funky"] {
  --bg: #1A0918;
  --card: #2A1530;
  --card2: #3D1F45;
  --border: rgba(255,229,45,0.20);
  --sep: rgba(255,229,45,0.10);
  --t1: #FFF4D9;
  --t2: rgba(255,244,217,0.78);
  --t3: rgba(255,244,217,0.52);
  --t4: rgba(255,244,217,0.28);
  --o: #FFE52D;
  --oSoft: rgba(255,229,45,0.16);
  --oGlow: rgba(255,229,45,0.55);
  --oFlash: rgba(255,229,45,0.16);
  --g: #00C896;
  --r: #FF6B4A;
  --blue: #FF3D5A;
  --blueSoft: rgba(255,61,90,0.18);
  --blueGlow: rgba(255,61,90,0.55);
  --gold: #FFE52D;
  --headerGrad: linear-gradient(90deg, #FFE52D 0%, #FF3D5A 100%);
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
.fu{animation:fadeUp .4s ease both;}
.fi{animation:fadeIn .25s ease both;}
.si{animation:scaleIn .2s ease both;}
.flash{animation:flashOrange .42s ease;}
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
