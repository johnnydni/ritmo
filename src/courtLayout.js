/* ═══════════════════════════════════════════════════════════════
   COURT-LAYOUT — wo die Plaetze tatsaechlich liegen

   Ein Turnier kennt seine Courts bisher nur als Liste: Court 1, 2, 3.
   Auf der Anlage liegen sie aber irgendwo — nebeneinander, in zwei
   Reihen, einer quer. Wer als Spieler "Court 3" hoert, weiss damit
   noch nicht, wo er hinlaufen soll, und wer als Host ein Ergebnis
   eintraegt, sucht die Karte zum Platz.

   Deshalb bekommt jedes Turnier eine Anordnung: fuer jeden Court ein
   Rasterfeld und eine Ausrichtung.

     layout[i] = {x, y, vert}

   Das Raster ist bewusst grob (CL_COLS x CL_ROWS) und kennt keine
   Groessen — es ist eine Skizze der Anlage, kein Bauplan. Genau so
   zeichnet man es auch auf eine Serviette.

   Alle Funktionen hier sind rein und geben neue Arrays zurueck; die
   Zeichnung selbst (CourtMap) steht in App.jsx.
═══════════════════════════════════════════════════════════════ */

export const CL_COLS=4;            // Rasterbreite
export const CL_ROWS=5;            // 4 x 5 = 20 = maxCourts

const inGrid=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)
  &&x>=0&&x<CL_COLS&&y>=0&&y<CL_ROWS;
const key=(x,y)=>y*CL_COLS+x;

/* Standard: eine Reihe, nach CL_COLS umgebrochen. Entspricht der
   bisherigen Liste — ein Turnier ohne gespeicherte Anordnung sieht
   also aus wie das, was der Host schon kennt. */
export function defaultLayout(n){
  return Array.from({length:Math.max(0,n)},(_,i)=>({
    x:i%CL_COLS, y:Math.floor(i/CL_COLS), vert:false}));
}

/* Bringt eine gespeicherte (oder halb gespeicherte) Anordnung auf
   genau n Felder: ungueltige und doppelt belegte Positionen fallen
   raus, der Rest wird in freie Felder nachgerueckt. Damit ueberlebt
   das Layout jede Aenderung der Court-Zahl und jeden alten Datensatz. */
export function normLayout(layout,n){
  const out=new Array(Math.max(0,n)).fill(null);
  const used=new Set();
  (Array.isArray(layout)?layout:[]).slice(0,n).forEach((p,i)=>{
    if(!p||!inGrid(p.x,p.y)||used.has(key(p.x,p.y))) return;
    used.add(key(p.x,p.y));
    out[i]={x:p.x,y:p.y,vert:!!p.vert};
  });
  let scan=0;
  for(let i=0;i<out.length;i++){
    if(out[i]) continue;
    while(scan<CL_COLS*CL_ROWS&&used.has(scan)) scan++;
    const s=Math.min(scan,CL_COLS*CL_ROWS-1);
    used.add(s);
    out[i]={x:s%CL_COLS,y:Math.floor(s/CL_COLS),vert:false};
  }
  return out;
}

/* Belegtes Rechteck — wie viele Spalten und Zeilen die Karte braucht.
   Mindestens 1x1, damit ein leeres Turnier nichts zerlegt. */
export function layoutBounds(layout){
  let cols=1,rows=1;
  (layout||[]).forEach(p=>{
    if(!p) return;
    cols=Math.max(cols,p.x+1);
    rows=Math.max(rows,p.y+1);
  });
  return {cols:Math.min(cols,CL_COLS),rows:Math.min(rows,CL_ROWS)};
}

/* Court i auf ein Feld setzen. Ist das Feld belegt, tauschen die
   beiden Plaetze — ein Zug ohne Ergebnis waere aus Nutzersicht ein
   kaputter Knopf, und Tauschen ist fast immer das Gemeinte. */
export function moveTo(layout,i,x,y){
  if(!inGrid(x,y)||!layout?.[i]) return layout;
  const out=layout.map(p=>({...p}));
  const j=out.findIndex((p,k)=>k!==i&&p.x===x&&p.y===y);
  if(j>=0){ out[j].x=out[i].x; out[j].y=out[i].y; }
  out[i].x=x; out[i].y=y;
  return out;
}

/* Laengs <-> quer. Die Ausrichtung sagt nichts ueber das Spiel, nur
   darueber, wie der Platz auf der Anlage liegt. */
export function rotateCourt(layout,i){
  if(!layout?.[i]) return layout;
  return layout.map((p,k)=>k===i?{...p,vert:!p.vert}:{...p});
}

/* Alles nach oben links schieben — nach dem Loeschen von Courts oder
   einem Zug bleiben sonst leere Spalten am Rand stehen. */
export function compactLayout(layout){
  const l=layout||[];
  if(!l.length) return l;
  const minX=Math.min(...l.map(p=>p.x)), minY=Math.min(...l.map(p=>p.y));
  if(!minX&&!minY) return l;
  return l.map(p=>({...p,x:p.x-minX,y:p.y-minY}));
}
