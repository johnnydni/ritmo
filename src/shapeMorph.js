/* ═══════════════════════════════════════════════════════════════
   SHAPE MORPH — eine Form fliesst in eine andere.

   Kein Ueberblenden zweier Bilder, sondern eine Kontur, die sich
   verformt: jede Form wird zu einem Distanzfeld (je Pixel: wie weit
   ist der naechste Rand, innen negativ), und zwischen zwei Feldern
   laesst sich stufenlos mischen. Die Nullinie des Mischfelds IST die
   Zwischenform. Daraus folgt das Verhalten, um das es geht:

   - Was nur in der Zielform existiert, WAECHST aus der Startform
     heraus — von der naechstgelegenen Stelle aus, weil dort das
     Startfeld am kleinsten ist. Die Speedlines schiessen aus dem
     Stamm, der Ball loest sich vom Bein.
   - Loecher, die in der Startform Aussenraum waren und in der
     Zielform Loecher bleiben (der Lochkranz im Schlaegerkopf liegt im
     Innenraum des R-Bogens), werden nicht gestanzt, sondern bleiben
     beim Zuwachsen des Bogens einfach UEBRIG.

   Gebraucht vom Splash (das R des Schriftzugs wird zur Marke).
   Pure JS — kein DOM, kein React; die Bilddaten liefert der Aufrufer.
═══════════════════════════════════════════════════════════════ */

const INF=1e20;

/* Exakte euklidische Distanztransformation nach Felzenszwalb &
   Huttenlocher: zwei 1-D-Durchlaeufe (Spalten, dann Zeilen) ueber die
   untere Huelle von Parabeln. Linear in der Pixelzahl — die beiden
   Felder des Splash (~40 k und ~67 k Pixel) stehen in wenigen ms. */
function edt1(f,n,d,v,z){
  let k=0; v[0]=0; z[0]=-INF; z[1]=INF;
  for(let q=1;q<n;q++){
    let s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);
    while(s<=z[k]){ k--; s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]); }
    k++; v[k]=q; z[k]=s; z[k+1]=INF;
  }
  k=0;
  for(let q=0;q<n;q++){
    while(z[k+1]<q) k++;
    d[q]=(q-v[k])*(q-v[k])+f[v[k]];
  }
}
function edt2(g,w,h){
  const n=Math.max(w,h);
  const f=new Float64Array(n), d=new Float64Array(n),
        v=new Int32Array(n), z=new Float64Array(n+1);
  for(let x=0;x<w;x++){
    for(let y=0;y<h;y++) f[y]=g[y*w+x];
    edt1(f,h,d,v,z);
    for(let y=0;y<h;y++) g[y*w+x]=d[y];
  }
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++) f[x]=g[y*w+x];
    edt1(f,w,d,v,z);
    for(let x=0;x<w;x++) g[y*w+x]=d[x];
  }
}

/* Vorzeichenbehaftetes Distanzfeld aus einem Alphakanal (0..255).
   Negativ = innen, Einheit = Quellpixel.

   Die Transformation selbst kennt nur innen/aussen und laege damit bis
   zu einem halben Pixel daneben — genug, dass die Kante beim Wechsel
   vom Bild aufs Feld sichtbar zuckt. Deshalb werden die Randpixel aus
   ihrer TEILDECKUNG nachgestellt: ein Pixel mit 30 % Alpha liegt 0,2 px
   ausserhalb der Kante. So steht die Kontur auf Subpixel genau dort,
   wo das PNG sie gezeichnet hat. */
export function sdfFromAlpha(alpha,w,h){
  const n=w*h, out=new Float64Array(n), inn=new Float64Array(n);
  for(let i=0;i<n;i++){
    const on=alpha[i]>127;
    out[i]=on?0:INF; inn[i]=on?INF:0;
  }
  edt2(out,w,h); edt2(inn,w,h);
  const d=new Float32Array(n);
  for(let i=0;i<n;i++){
    let v=alpha[i]>127?-(Math.sqrt(inn[i])-0.5):(Math.sqrt(out[i])-0.5);
    const a=alpha[i]/255;
    if(a>0&&a<1&&v>-1.5&&v<1.5) v=0.5-a;
    d[i]=v;
  }
  return {w,h,d};
}

/* Bilinear abgetastet. Ausserhalb des Rasters: Randwert plus Abstand
   zum Raster — so bleibt das Feld auch dort stetig und steigend, wo
   die andere Form hinreicht. Die Raster sind so gepolstert, dass ihr
   Rand immer Aussenraum ist; ein negativer Randwert kommt nicht vor. */
export function sampleSdf(f,x,y){
  const w=f.w,h=f.h,D=f.d;
  const cx=x<0?0:x>w-1?w-1:x, cy=y<0?0:y>h-1?h-1:y;
  const x0=cx|0, y0=cy|0;
  const x1=x0<w-1?x0+1:x0, y1=y0<h-1?y0+1:y0;
  const fx=cx-x0, fy=cy-y0;
  const r0=y0*w, r1=y1*w;
  const a=D[r0+x0]+(D[r0+x1]-D[r0+x0])*fx;
  const b=D[r1+x0]+(D[r1+x1]-D[r1+x0])*fx;
  let v=a+(b-a)*fy;
  if(cx!==x||cy!==y) v+=Math.hypot(x-cx,y-cy);
  return v;
}

/* Ein Bild des Morphs in einen RGBA-Puffer zeichnen (weiss, Alpha aus
   dem Feld).

   A, B: {f, ax, ay, hs} — Feld, Ausrichtungspunkt darin (Raster-
   koordinaten) und die Hoehe, an der beide Formen gleichgesetzt
   werden (Versalhoehe des R bzw. Hoehe des R-Koerpers im Logo).
   fr: {cx, cy, h} — wohin der Ausrichtungspunkt auf der Zeichenflaeche
   kommt und wie hoch der Koerper dort ist (CSS px). e: Mischung 0..1.

   DIE GEMEINSAME POSE. Ein reines Mischen der Felder reisst ab, wo
   sich die Formen nicht ueberdecken: das R des Schriftzugs steht
   senkrecht, das Logo-R lehnt sich nach rechts. Zwischen den beiden
   Staemmen sind beide Felder positiv — und ihr Mittel auch; der Stamm
   verschwindet mitten im Morph. Deshalb stehen beide Formen in jedem
   Moment in DERSELBEN Pose: Neigung `lean`·e und Breite
   1+(narrow−1)·e. A startet in seiner eigenen Pose und wird geneigt
   und gestaucht, B startet aufgerichtet und verbreitert und laeuft in
   seine eigene. So liegen die Staemme die ganze Zeit aufeinander.

   Drei Zugaben, alle nur in der Mitte des Wegs (4e(1−e)) — Start- und
   Endbild bleiben exakt die Bilder, gegen die getauscht wird:

   - `fuse` zieht das Mischfeld zur weichen VEREINIGUNG beider Formen.
     Wo die Staemme trotz Pose nicht ganz aufeinanderliegen, haelt das
     die Form zusammen — sie schmilzt ineinander, statt zu zerfallen.
   - `swell` blaeht die Zwischenform leicht auf (Anteil der Hoehe).
   - `ripple` legt eine langsame Welle darueber (Anteil der Hoehe).

   Ohne die drei ist der Morph geometrisch richtig, aber trocken:
   Mischfelder laufen linear, und das sieht nach Rechnung aus statt
   nach etwas, das fliesst. */
export function drawMorph(buf,W,H,dpr,A,B,fr,e,opts={}){
  const lean=opts.lean||0, narrow=opts.narrow||1, t=opts.t||0;
  const bump=4*e*(1-e), h=fr.h;
  const sig=lean*e, kap=1+(narrow-1)*e, ik=1/kap;
  const fuse=(opts.fuse||0)*bump, sw=(opts.swell||0)*bump*h, rp=(opts.ripple||0)*bump*h;
  const kU=0.12*h;                                   // Weichheit der Vereinigung
  const sA=h/A.hs, sB=h/B.hs, ih=1/h, idpr=1/dpr, wf=6.3/h;
  let o=0;
  for(let j=0;j<H;j++){
    const Y=(j+0.5)*idpr, q=(Y-fr.cy)*ih;
    const ya=A.ay+A.hs*q, yb=B.ay+B.hs*q;
    for(let i=0;i<W;i++){
      const X=(i+0.5)*idpr;
      const p=((X-fr.cx)*ih+sig*q)*ik;              // zurueck in die Pose des R
      const dA=sampleSdf(A.f,A.ax+A.hs*p,ya)*sA;
      const dB=sampleSdf(B.f,B.ax+B.hs*(narrow*p-lean*q),yb)*sB;
      let d=dA+(dB-dA)*e;
      if(fuse){
        const k=kU-Math.abs(dA-dB), u=(dA<dB?dA:dB)-(k>0?k*k/(4*kU):0);
        d+=(u-d)*fuse;
      }
      d-=sw;
      if(rp) d+=rp*0.5*(Math.sin(X*wf+Y*wf*0.6+t*6.1)+Math.sin(Y*wf*0.85-X*wf*0.45-t*4.7));
      let a=0.5-d*dpr;
      a=a<0?0:a>1?1:a;
      buf[o]=255; buf[o+1]=255; buf[o+2]=255; buf[o+3]=a*255;
      o+=4;
    }
  }
}
