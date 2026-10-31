/* ═══════════════════════════════════════════════════════════════
   TURNIER-PDF — Endstand, Sieger und kompletter Rundenverlauf als
   A4-Dokument, das man in die Gruppe schicken kann.

   Warum eine echte Datei und nicht window.print(): das Ergebnis soll
   ohne Umweg ueber den Druckdialog in WhatsApp landen. jsPDF liefert
   einen Blob, den navigator.share als Anhang mitnimmt; am Desktop
   faellt es auf einen Download zurueck.

   jsPDF wird NACHGELADEN (dynamic import) — das Bundle ist ~330 kB
   und hat im Startpfad der App nichts verloren. Gleiches Muster wie
   tesseract.js beim Screenshot-Import.

   Aussehen: wie der Endstand in der App. Dunkle Seiten, der
   Schriftzug oben, „Sieger" als Ressort und darunter der Name als
   Schlagzeile in der kursiven Antiqua, ein Satz zum Ausgang, drei
   Zahlen in Glaskacheln, dann die Tabelle in der Zeile der App
   (Platz duenn, Name mit „S · N · P",
   Wertung duenn und gross) und der Rundenverlauf. Das PDF wird
   geteilt, nicht gedruckt — der dunkle Grund ist gewollt.

   Schriften wie in der App:
   - Space Grotesk (300/400/700) fuer alles, eingebettet aus
     tools/make-pdf-fonts.py. Die 14 PDF-Standardschriften koennen nur
     WinAnsi: aus „Wisniewska" mit s-acute wurde dort ein „Wi[niewska".
   - Centauri fuer Ressorts — nie fuer Zahlen, nie fuer Namen.
   - Times (die eingebaute) fuer Ueberschriften. Sie kann nur WinAnsi,
     deshalb laeuft ein NAME nur dann in Times, wenn jedes Zeichen
     darin vorkommt (serifOk) — sonst in Space Grotesk fett. Den
     Namen eines Siegers zu verstuemmeln geht nicht.

   Faellt das Nachladen einer Schrift oder der Wortmarke aus, entsteht
   das PDF trotzdem — dann eben in Helvetica und ohne Logo.
═══════════════════════════════════════════════════════════════ */
import { calcLeaderboard, FORMATS, roundMeanBonus, winLine } from './tournament.js';
import { getAssetBase } from './utils.js';
import centauriUrl from './fonts/centauri.ttf';
import sgLightUrl from './fonts/pdf/sg-light.ttf';
import sgRegularUrl from './fonts/pdf/sg-regular.ttf';
import sgBoldUrl from './fonts/pdf/sg-bold.ttf';

/* ── Papier & Raster (mm) ─────────────────────────────────────── */
const PW=210, PH=297, M=16, CW=PW-2*M;
const FOOT=16;                 // Reserve unten fuer die Fusszeile

/* ── Farben: die App auf dunklem Grund ────────────────────────── */
const BG=[8,8,10], T1=[255,255,255], T2=[196,196,202], T3=[128,128,136], T4=[84,84,90];
const GLASSF=[21,21,25], GLASSL=[62,62,68], SEP=[40,40,45], ORB=[28,28,32];
const O=[255,122,26], BLUE=[64,156,255];
const MEDALS=[[212,175,55],[192,192,200],[196,132,80]];

const DE=(ts,opt)=>new Date(ts).toLocaleDateString('de-DE',opt);
/* Kann Times (WinAnsi) diesen Text setzen? */
const serifOk=s=>/^[\x20-\x7E\xA0-\xFF–—‘-„…]*$/.test(String(s||''));

/* Laedt eine Datei als Base64. Gibt null zurueck statt zu werfen —
   Schrift und Logo sind Kuer, das Dokument ist Pflicht. */
async function asBase64(url){
  try{
    const r=await fetch(url);
    if(!r.ok) return null;
    const buf=new Uint8Array(await r.arrayBuffer());
    let s='';
    for(let i=0;i<buf.length;i+=0x8000) s+=String.fromCharCode.apply(null,buf.subarray(i,i+0x8000));
    return btoa(s);
  }catch(e){ return null; }
}

export async function buildTourneyPdf(tourney){
  const { jsPDF }=await import('jspdf');
  const [centauri,light,regular,bold,markB64]=await Promise.all([
    asBase64(centauriUrl),
    asBase64(sgLightUrl),
    asBase64(sgRegularUrl),
    asBase64(sgBoldUrl),
    asBase64(`${getAssetBase()}assets/ritmo-lettering.png`),
  ]);

  const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
  const reg=(b64,file,family,style)=>{
    if(!b64) return false;
    try{ doc.addFileToVFS(file,b64); doc.addFont(file,family,style); return true; }
    catch(e){ return false; }
  };
  const DISPLAY=reg(centauri,'Centauri.ttf','Centauri','normal')?'Centauri':'helvetica';
  /* Regular und Bold muessen beide da sein — mit nur einem waere jeder
     fette Text still wieder Helvetica und damit ohne Latin-Extended. */
  const okReg=reg(regular,'SG.ttf','SG','normal');
  const okBold=reg(bold,'SG-Bold.ttf','SG','bold');
  const BODY=(okReg&&okBold)?'SG':'helvetica';
  const THIN=(BODY==='SG'&&reg(light,'SG-Light.ttf','SGLight','normal'))?'SGLight':BODY;
  const mark=markB64?`data:image/png;base64,${markB64}`:null;

  /* ── Schreibhelfer ─────────────────────────────────────────── */
  const font=(f,st='normal')=>doc.setFont(f,st);
  const col=c=>doc.setTextColor(c[0],c[1],c[2]);
  const fill=c=>doc.setFillColor(c[0],c[1],c[2]);
  const draw=c=>doc.setDrawColor(c[0],c[1],c[2]);
  const size=n=>doc.setFontSize(n);
  const put=(s,x,y,o)=>doc.text(String(s),x,y,o);
  /* Ueberschrift: kursive Antiqua, wenn der Text es zulaesst. */
  const serif=(s,st='bolditalic')=>font(serifOk(s)?'times':BODY,serifOk(s)?st:'bold');
  /* Ressort-Zeile: Centauri, weit gesperrt, immer Versalien. */
  const kicker=(s,x,y,c=O,fs=8.5,sp=.9)=>{
    font(DISPLAY); size(fs); col(c);
    put(s.toUpperCase(),x,y,{charSpace:sp});
  };
  /* Kuerzt auf die verfuegbare Breite statt in die Nachbarspalte zu laufen. */
  const fit=(s,w)=>{
    s=String(s??'');
    if(doc.getTextWidth(s)<=w) return s;
    let lo=0,hi=s.length;
    while(lo<hi){ const mid=(lo+hi+1)>>1;
      if(doc.getTextWidth(s.slice(0,mid)+'…')<=w) lo=mid; else hi=mid-1; }
    return s.slice(0,lo)+'…';
  };
  const hair=(y,x0=M,x1=PW-M,c=SEP,w=.25)=>{ draw(c); doc.setLineWidth(w); doc.line(x0,y,x1,y); };
  /* Glasflaeche: dunkler Grund, Haarlinie, runde Ecken. */
  const glass=(x,y,w,h,r=4)=>{ fill(GLASSF); draw(GLASSL); doc.setLineWidth(.25); doc.roundedRect(x,y,w,h,r,r,'FD'); };
  const paint=()=>{ fill(BG); doc.rect(0,0,PW,PH,'F'); };

  let y=0;
  /* SectionRule wie in der App: Antiqua kursiv, Haarlinie darunter. */
  const section=t=>{ serif(t); size(17); col(T1); put(t,M,y); hair(y+3.6); y+=11; };
  const newPage=cont=>{ doc.addPage(); paint(); y=M+8; if(cont) section(cont); };
  const need=(h,cont)=>{ if(y+h>PH-FOOT) newPage(cont); };

  /* ── Daten ─────────────────────────────────────────────────── */
  const P=tourney.players||[], R=tourney.rounds||[];
  const wins=tourney.winMode==='wins';
  const lb=calcLeaderboard(P,R,tourney.winMode,tourney.pauseMode,tourney.pausePts)
    .sort((a,b)=>wins?(b.totalWins-a.totalWins||b.totalPts-a.totalPts)
                    :(b.totalPts-a.totalPts||b.totalWins-a.totalWins));
  const win=lb[0];
  const nameOf=id=>P.find(p=>p.id===id)?.name||'?';
  const team=ids=>(ids||[]).map(nameOf).join(' & ');
  const score=p=>wins?p.totalWins:p.totalPts;
  const fmt=FORMATS[tourney.format]?.name||'Turnier';
  const played=R.reduce((a,r)=>a+(r.courts||[]).filter(c=>c.done).length,0);

  /* ══ KOPF ══════════════════════════════════════════════════ */
  paint();
  if(mark){ try{ doc.addImage(mark,'PNG',M,12,42,42*120/720); }catch(e){} }
  else { font(BODY,'bold'); size(15); col(T1); put('RITMO',M,19); }
  font(BODY,'normal'); size(8.5); col(T3);
  put(DE(tourney.createdAt||Date.now(),{day:'2-digit',month:'long',year:'numeric'}),PW-M,17.5,{align:'right'});

  y=36;
  /* Nur ein Wort: Centauri hat keinen Mittelpunkt, und jsPDF bricht
     an einem fehlenden Glyph den Rest der Zeile ab. */
  kicker('Endstand',M,y,O,8);
  const title=tourney.name||'RITMO Turnier';
  serif(title); size(22);
  const tl=doc.splitTextToSize(title,CW).slice(0,2);
  col(T1); tl.forEach((l,i)=>put(l,M,y+10+i*8.6));
  y+=10+(tl.length-1)*8.6+7;
  font(BODY,'normal'); size(9.5); col(T2);
  put([fmt,`${P.length} Spieler`,`${R.length} ${R.length===1?'Runde':'Runden'}`,
    `${played} ${played===1?'Match':'Matches'}`].join('   |   '),M,y);
  y+=5; draw(O); doc.setLineWidth(.5); doc.line(M,y,M+12,y);

  /* ══ SIEGER — die Schlagzeile ist der Name ═══════════════════ */
  if(win){
    y+=18;
    kicker('Sieger',M,y,O,9);
    const nm=`${win.name}.`;
    serif(nm);
    let fs=win.name.length<=6?64:win.name.length<=9?52:win.name.length<=13?40:32;
    size(fs); while(doc.getTextWidth(nm)>CW&&fs>22){ fs-=2; size(fs); }
    y+=fs*.3528*1.02+2;
    col(T1); put(win.name,M-.6,y);
    col(O); put('.',M-.6+doc.getTextWidth(win.name),y);

    /* Derselbe Spruch wie im Endstand der App. */
    const story=winLine(tourney.id??tourney.name,win.name);
    font(BODY,'normal'); size(11); col(T2);
    const sl=doc.splitTextToSize(story,CW);
    y+=9; sl.forEach((l,i)=>put(l,M,y+i*5.4)); y+=(sl.length-1)*5.4;

    /* Drei Zahlen in Glaskacheln; die der Wertung steht orange. */
    y+=8;
    const tiles=[[win.totalPts,'Punkte'],[win.totalWins,'Siege'],[win.played,'Matches']];
    const g=4, tw=(CW-2*g)/3, th=23;
    tiles.forEach(([v,l],i)=>{
      const x=M+i*(tw+g);
      glass(x,y,tw,th);
      font(THIN); size(28); col(l===(wins?'Siege':'Punkte')?O:T1);
      put(String(v??0),x+5,y+12.5);
      font(BODY,'bold'); size(8.5); col(T2);
      put(l,x+5,y+18.6);
    });
    y+=th+16;
  }

  /* ══ TABELLE — die Zeile der App (LbRow) ═══════════════════ */
  need(40);
  section('Tabelle');
  const RH=13.2;
  lb.forEach((p,i)=>{
    if(y+RH>PH-FOOT) newPage('Tabelle (Fortsetzung)');
    const cy=y+RH/2;
    /* Platz: duenne Ziffer, 1–3 in den Medaillenfarben. */
    font(THIN); size(17); col(i<3?MEDALS[i]:T3);
    put(String(i+1),M+1,cy+2.2);
    /* Name und „4 S · 0 N · 1 P". */
    const nx=M+12;
    font(BODY,'bold'); size(11); col(T1);
    put(fit(p.name,PW-M-nx-34),nx,cy-.6);
    font(BODY,'normal'); size(7.8); col(T3);
    put(`${p.wins} S  ·  ${p.losses} N  ·  ${p.sitOut} P`,nx,cy+4.1);
    /* Wertung: duenn und gross, der Fuehrende orange. */
    font(THIN); size(21); col(i===0?O:T1);
    put(String(score(p)),PW-M,cy+1.6,{align:'right'});
    const bonus=wins?p.bonusWins:p.bonusPts;
    font(BODY,'normal'); size(7); col(bonus?BLUE:T3);
    put(bonus?`inkl. +${bonus} Pause`:(wins?'Siege':'Punkte'),PW-M,cy+5.4,{align:'right'});
    if(i<lb.length-1) hair(y+RH,nx);
    y+=RH;
  });
  y+=6;
  font(BODY,'normal'); size(7.5); col(T4);
  put('S Siege   ·   N Niederlagen   ·   P Pausen',M,y);
  y+=15;

  /* ══ RUNDENVERLAUF ═════════════════════════════════════════ */
  if(R.length){
    need(40);
    section('Rundenverlauf');
    const MID=M+CW*.5;
    R.forEach((r,ri)=>{
      const courts=r.courts||[];
      const sit=(r.sitOut||[]).length;
      /* Kopf + erste Courtzeile gehoeren zusammen — eine Runden-
         ueberschrift allein am Seitenfuss waere eine Waise. */
      need(9+7+(sit?6:0),'Rundenverlauf (Fortsetzung)');
      font('times','bold'); size(13); col(T1);
      put(`Runde ${ri+1}`,M,y);
      const offen=courts.length-courts.filter(c=>c.done).length;
      if(offen){
        font(BODY,'normal'); size(7.5); col(T3);
        put(`${offen} ${offen===1?'Match':'Matches'} ohne Ergebnis`,PW-M,y,{align:'right'});
      }
      y+=2.8; hair(y); y+=6;

      courts.forEach((c,ci)=>{
        need(7,'Rundenverlauf (Fortsetzung)');
        const cn=(tourney.courtNames?.[ci]||'').trim()||`Court ${ci+1}`;
        font(BODY,'normal'); size(7.5); col(T3);
        put(fit(cn,22)+(c.single?' · 1v1':''),M,y+.2);
        const a1=c.done&&c.s1>c.s2, a2=c.done&&c.s2>c.s1;
        font(BODY,a1?'bold':'normal'); size(9.5); col(a1?T1:T2);
        put(fit(team(c.t1),MID-M-26-15),MID-15,y,{align:'right'});
        font(BODY,'bold'); size(10.5); col(c.done?O:T4);
        put(c.done?`${c.s1??0} : ${c.s2??0}`:'– : –',MID,y,{align:'center'});
        font(BODY,a2?'bold':'normal'); size(9.5); col(a2?T1:T2);
        put(fit(team(c.t2),PW-M-MID-15),MID+15,y);
        y+=7;
      });

      if(sit){
        need(6,'Rundenverlauf (Fortsetzung)');
        /* Der ausgewiesene Bonus muss zur eingestellten Regel passen:
           'fixed' gibt einen festen Wert je Pause, 'mean' den
           aufgerundeten Rundenmittelwert (nur in der Punktewertung —
           im Siegemodus ist der Ausgleich kein Rundenwert, sondern
           +1 Sieg fuer die untere Tabellenhaelfte). 'none' gibt nichts. */
        const bonus=tourney.pauseMode==='fixed'
          ?(Math.max(0,Math.round(Number(tourney.pausePts)||0))||null)
          :tourney.pauseMode==='none'?null
          :(wins?null:roundMeanBonus(r));
        font(BODY,'normal'); size(7.8); col(T3);
        put(fit(`Pause: ${(r.sitOut||[]).map(nameOf).join(', ')}`,CW-26),M,y+.4);
        if(bonus){ col(BLUE); font(BODY,'bold');
          put(`+${bonus}`,PW-M,y+.4,{align:'right'}); }
        y+=6;
      }
      y+=6;
    });
  }

  /* ══ FUSSZEILEN — erst jetzt, die Seitenzahl braucht das Ende ══ */
  const N=doc.getNumberOfPages();
  for(let i=1;i<=N;i++){
    doc.setPage(i);
    hair(PH-11.5);
    font(BODY,'normal'); size(7.5); col(T4);
    put(fit(`RITMO   ·   ${tourney.name||'Turnier'}`,CW-40),M,PH-7.5);
    put(`Seite ${i} von ${N}`,PW-M,PH-7.5,{align:'right'});
  }
  return doc;
}

/* Dateiname aus Turniername: nur Zeichen, die jedes Dateisystem und
   jeder Messenger unfallfrei durchreichen. */
function fileName(tourney){
  const base=(tourney.name||'RITMO Turnier')
    .replace(/[äÄ]/g,'ae').replace(/[öÖ]/g,'oe').replace(/[üÜ]/g,'ue').replace(/ß/g,'ss')
    .replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'Turnier';
  return `RITMO-${base}-${DE(tourney.createdAt||Date.now()).replace(/\./g,'-')}.pdf`;
}

/* Erzeugt das PDF und gibt es weiter: per Share-Sheet, wo der Browser
   Dateien teilen kann (iOS/Android), sonst als Download.
   Rueckgabe: 'shared' | 'saved' | 'cancelled'. */
export async function exportTourneyPdf(tourney){
  const doc=await buildTourneyPdf(tourney);
  const blob=doc.output('blob');
  const name=fileName(tourney);
  const file=new File([blob],name,{type:'application/pdf'});
  if(navigator.canShare?.({files:[file]})){
    try{
      await navigator.share({files:[file],title:tourney.name||'RITMO Turnier'});
      return 'shared';
    }catch(e){
      /* AbortError = Nutzer hat das Share-Sheet geschlossen. Alles
         andere (z. B. NotAllowedError) faellt auf den Download. */
      if(e?.name==='AbortError') return 'cancelled';
    }
  }
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
  return 'saved';
}
