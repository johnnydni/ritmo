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

   Aussehen: heller Dokumentstil wie die RITMO-Angebote — weisser
   Grund, schwarzes Kopfband, Orange als einzige Akzentfarbe. Die
   Glasoptik der App waere auf Papier eine Tonerwueste.

   Schriften: Centauri fuer Ressorts und Tabellenkoepfe (die Marke),
   Inter fuer alles andere. Die Regeln aus CLAUDE.md gelten hier
   genauso — Centauri nie fuer Zahlen (die 0 ist ein leeres Rechteck)
   und nie fuer Spielernamen (Akzentbuchstaben fehlen der Schrift).

   Inter wird eingebettet statt die eingebaute Helvetica zu nehmen,
   weil die 14 PDF-Standardschriften nur WinAnsi koennen: aus
   „Wisniewska" mit s-acute wurde dort ein „Wi[niewska". Den Namen
   eines Siegers auf seiner Urkunde zu verstuemmeln geht nicht. Die
   beiden Schnitte kommen aus tools/make-pdf-fonts.py, zusammen 51 kB.

   Faellt das Nachladen einer Schrift oder der Wortmarke aus, entsteht
   das PDF trotzdem — dann eben in Helvetica und ohne Logo.
═══════════════════════════════════════════════════════════════ */
import { calcLeaderboard, FORMATS, roundMeanBonus } from './tournament.js';
import { getAssetBase } from './utils.js';
import centauriUrl from './fonts/centauri.ttf';
import interRegularUrl from './fonts/pdf/inter-regular.ttf';
import interBoldUrl from './fonts/pdf/inter-bold.ttf';

/* ── Papier & Raster (mm) ─────────────────────────────────────── */
const PW=210, PH=297, M=15, CW=PW-2*M;
const FOOT=16;                 // Reserve unten fuer die Fusszeile

/* ── Farben ───────────────────────────────────────────────────── */
const NIGHT=[11,11,14], INK=[17,17,20], MUTED=[110,110,118], FAINT=[154,154,162];
const LINE=[228,228,232], ZEBRA=[247,247,249], WHITE=[255,255,255];
const O=[255,122,26], OSOFT=[255,241,230];
const GOLD=[200,168,120], SILVER=[168,168,176], BRONZE=[176,130,86], BLUE=[10,132,255];
const MEDALS=[GOLD,SILVER,BRONZE];

const DE=(ts,opt)=>new Date(ts).toLocaleDateString('de-DE',opt);

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
  const [centauri,regular,bold,markB64]=await Promise.all([
    asBase64(centauriUrl),
    asBase64(interRegularUrl),
    asBase64(interBoldUrl),
    asBase64(`${getAssetBase()}assets/ritmowide.png`),
  ]);

  const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
  const reg=(b64,file,family,style)=>{
    if(!b64) return false;
    try{ doc.addFileToVFS(file,b64); doc.addFont(file,family,style); return true; }
    catch(e){ return false; }
  };
  const DISPLAY=reg(centauri,'Centauri.ttf','Centauri','normal')?'Centauri':'helvetica';
  /* Beide Schnitte muessen da sein — mit nur einem waere jeder fette
     Text still wieder Helvetica und damit wieder ohne Latin-Extended. */
  const okReg=reg(regular,'Inter.ttf','Inter','normal');
  const okBold=reg(bold,'Inter-Bold.ttf','Inter','bold');
  const BODY=(okReg&&okBold)?'Inter':'helvetica';
  const mark=markB64?`data:image/png;base64,${markB64}`:null;

  /* ── Schreibhelfer ─────────────────────────────────────────── */
  const font=(f,st='normal')=>doc.setFont(f,st);
  const col=c=>doc.setTextColor(c[0],c[1],c[2]);
  const fill=c=>doc.setFillColor(c[0],c[1],c[2]);
  const draw=c=>doc.setDrawColor(c[0],c[1],c[2]);
  const size=n=>doc.setFontSize(n);
  const put=(s,x,y,o)=>doc.text(String(s),x,y,o);
  /* Ressort-Zeile: Centauri, weit gesperrt, immer Versalien. */
  const kicker=(s,x,y,c=O,fs=8.5,sp=1.9)=>{
    font(DISPLAY); size(fs); col(c);
    put(s.toUpperCase(),x,y,{charSpace:sp});
    return doc.getTextWidth(s.toUpperCase())+sp*s.length;
  };
  /* Rechtsbuendig MIT Sperrung. jsPDF berechnet die Breite fuer
     align:'right' OHNE charSpace — gesperrter Text laeuft damit ueber
     den Anker hinaus, im ersten Entwurf schob sich so „PUNKTE" ueber
     die Pausenspalte. Deshalb den Anker selbst ausrechnen. */
  const putRS=(s,x,y,sp)=>{
    const w=doc.getTextWidth(s)+sp*Math.max(0,s.length-1);
    put(s,x-w,y,{charSpace:sp});
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
  const hair=(y,x0=M,x1=PW-M,c=LINE)=>{ draw(c); doc.setLineWidth(.2); doc.line(x0,y,x1,y); };

  let y=0;
  const newPage=()=>{ doc.addPage(); y=M+6; };
  const need=h=>{ if(y+h>PH-FOOT) newPage(); };

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
  const unit=n=>wins?(n===1?'Sieg':'Siege'):'Punkte';
  const fmt=FORMATS[tourney.format]?.name||'Turnier';
  const played=R.reduce((a,r)=>a+(r.courts||[]).filter(c=>c.done).length,0);

  /* ══ KOPFBAND ══════════════════════════════════════════════ */
  /* Erst den Namen umbrechen, dann das Band darum legen: bei einem
     zweizeiligen Turniernamen stand die Metazeile sonst mitten im
     Namen, weil die Bandhoehe fest war. */
  const title=tourney.name||'RITMO Turnier';
  font(BODY,'bold');
  let nameSize=23;
  let lines=doc.setFontSize(nameSize).splitTextToSize(title,CW);
  if(lines.length>2){
    nameSize=17;
    lines=doc.setFontSize(nameSize).splitTextToSize(title,CW).slice(0,2);
  }
  const lineH=nameSize*.42;
  const metaY=45+(lines.length-1)*lineH+11;
  const HEAD=metaY+7;

  fill(NIGHT); doc.rect(0,0,PW,HEAD,'F');
  if(mark){ try{ doc.addImage(mark,'PNG',M,11,34,34*426/869); }catch(e){} }
  else { font(BODY,'bold'); size(15); col(WHITE); put('RITMO',M,21); }

  font(BODY,'normal'); size(8); col([150,150,158]);
  put(DE(tourney.createdAt||Date.now(),{day:'2-digit',month:'long',year:'numeric'}),PW-M,17,{align:'right'});

  kicker('Endstand',M,36,O);
  font(BODY,'bold'); size(nameSize); col(WHITE);
  lines.forEach((l,i)=>put(l,M,45+i*lineH));

  font(BODY,'normal'); size(9); col([160,160,168]);
  const meta=[fmt,`${P.length} Spieler`,`${R.length} ${R.length===1?'Runde':'Runden'}`,
    `${played} ${played===1?'Match':'Matches'}`].join('   ·   ');
  put(meta,M,metaY);

  /* ══ GRATULATION ═══════════════════════════════════════════ */
  y=HEAD+11;
  if(win){
    const H=40;
    fill(OSOFT); draw(O); doc.setLineWidth(.4);
    doc.roundedRect(M,y,CW,H,3,3,'FD');

    /* Medaille: goldener Ring mit der Eins. Ein gezeichnetes Band
       hatte ich versucht — die zwei Dreiecke standen als Hoerner
       ueber dem Ring, ohne dass man sie als Band gelesen haette. */
    const cx=M+21, cy=y+H/2;
    fill(GOLD); doc.circle(cx,cy,9.4,'F');
    fill(OSOFT); doc.circle(cx,cy,7.2,'F');
    font(BODY,'bold'); size(16); col(GOLD);
    put('1',cx,cy+2.9,{align:'center'});

    const tx=M+38, tw=CW-38-8;
    kicker('Gratulation',tx,y+11,O,8);
    font(BODY,'bold'); size(19); col(INK);
    put(fit(win.name,tw),tx,y+22.5);
    font(BODY,'bold'); size(11.5); col(O);
    put(`${score(win)} ${unit(score(win))}`,tx,y+30);
    font(BODY,'normal'); size(8.5); col(MUTED);
    put([`${win.played} ${win.played===1?'Spiel':'Spiele'}`,
         `${win.wins} ${win.wins===1?'Sieg':'Siege'}`,
         `${win.losses} ${win.losses===1?'Niederlage':'Niederlagen'}`,
         `${win.sitOut} ${win.sitOut===1?'Pause':'Pausen'}`].join('   ·   '),tx,y+35.5);
    y+=H+7;
  }

  /* ══ PODEST 2 + 3 ══════════════════════════════════════════ */
  const podium=lb.slice(1,3);
  if(podium.length){
    const gap=6, w=(CW-gap*(podium.length-1))/podium.length, H=21;
    podium.forEach((p,i)=>{
      const x=M+i*(w+gap);
      fill(WHITE); draw(LINE); doc.setLineWidth(.3);
      doc.roundedRect(x,y,w,H,2.5,2.5,'FD');
      fill(MEDALS[i+1]); doc.circle(x+10,y+H/2,5.4,'F');
      font(BODY,'bold'); size(9.5); col(WHITE);
      put(String(i+2),x+10,y+H/2+1.6,{align:'center'});
      font(BODY,'bold'); size(11); col(INK);
      put(fit(p.name,w-26),x+19,y+H/2-.5);
      font(BODY,'normal'); size(8.5); col(MUTED);
      put(`${score(p)} ${unit(score(p))}`,x+19,y+H/2+5);
    });
    y+=H+9;
  }

  /* ══ ENDSTAND-TABELLE ══════════════════════════════════════ */
  /* Spalten. charSpace rechnet in der Dokumenteinheit, also in
     MILLIMETERN — mit den 1,1 mm eines ersten Entwurfs schob sich
     der Kopf ineinander („PLASTZELER"). Im Kopf daher 0,45 mm, und
     die Zahlenspalten stehen rechtsbuendig auf festen Achsen. */
  const C={dot:M+4, rank:M+7.6, name:M+15,
    sp:PW-M-66, s:PW-M-50, n:PW-M-34, p:PW-M-18, pts:PW-M};
  const NUMW=C.sp-8-C.name;   // Platz fuer den Namen
  const tableHead=()=>{
    fill(NIGHT); doc.rect(M,y,CW,8,'F');
    font(DISPLAY); size(6.8); col(WHITE);
    put('SPIELER',C.name,y+5.3,{charSpace:.45});
    [['SP',C.sp],['S',C.s],['N',C.n],['P',C.p],
     [wins?'SIEGE':'PKT',C.pts]].forEach(([h,x])=>putRS(h,x,y+5.3,.45));
    y+=8;
  };
  need(30);
  kicker('Tabelle',M,y,O); y+=5;
  tableHead();
  lb.forEach((p,i)=>{
    const H=8.4;
    if(y+H>PH-FOOT){ newPage(); kicker('Tabelle (Fortsetzung)',M,y,O); y+=5; tableHead(); }
    fill(i===0?OSOFT:(i%2?ZEBRA:WHITE)); doc.rect(M,y,CW,H,'F');
    if(i<3){ fill(MEDALS[i]); doc.circle(C.dot,y+H/2,2.4,'F'); }
    font(BODY,'bold'); size(8.5); col(i<3?INK:MUTED);
    put(String(i+1),C.rank,y+H/2+1.1);
    font(BODY,i===0?'bold':'normal'); size(9.5); col(INK);
    put(fit(p.name,NUMW),C.name,y+H/2+1.2);
    font(BODY,'normal'); size(8.5); col(MUTED);
    [[C.sp,p.played],[C.s,p.wins],[C.n,p.losses],[C.p,p.sitOut]].forEach(([x,v])=>
      put(String(v),x,y+H/2+1.1,{align:'right'}));
    font(BODY,'bold'); size(10.5); col(i===0?O:INK);
    put(String(score(p)),C.pts,y+H/2+1.3,{align:'right'});
    y+=H;
  });
  hair(y); y+=4.5;
  font(BODY,'normal'); size(7.5); col(FAINT);
  const bonusSum=lb.reduce((a,p)=>a+(wins?p.bonusWins:p.bonusPts),0);
  put('SP Spiele   ·   S Siege   ·   N Niederlagen   ·   P Pausen'
    +(bonusSum?`   ·   ${wins?'Siege':'Punkte'} inklusive Pausen-Ausgleich`:''),M,y);
  y+=13;

  /* ══ RUNDENVERLAUF ═════════════════════════════════════════ */
  if(R.length){
    need(34);
    kicker('Rundenverlauf',M,y,O); y+=3;
    hair(y); y+=7;

    const MID=M+CW*.5;
    R.forEach((r,ri)=>{
      const courts=r.courts||[];
      const sit=(r.sitOut||[]).length;
      /* Kopf + erste Courtzeile gehoeren zusammen — eine Runden-
         ueberschrift allein am Seitenfuss waere eine Waise. */
      need(7+6.6+(sit?6:0));
      font(BODY,'bold'); size(10); col(INK);
      put(`Runde ${ri+1}`,M,y);
      const offen=courts.length-courts.filter(c=>c.done).length;
      if(offen){
        font(BODY,'normal'); size(7.5); col(FAINT);
        put(`${offen} ${offen===1?'Match':'Matches'} ohne Ergebnis`,PW-M,y,{align:'right'});
      }
      y+=2.4; hair(y); y+=5.2;

      courts.forEach((c,ci)=>{
        need(6.6);
        const cn=(tourney.courtNames?.[ci]||'').trim()||`Court ${ci+1}`;
        font(BODY,'normal'); size(7.5); col(FAINT);
        put(fit(cn,20)+(c.single?' · 1v1':''),M,y+.2);
        const a1=c.done&&c.s1>c.s2, a2=c.done&&c.s2>c.s1;
        font(BODY,a1?'bold':'normal'); size(9); col(a1?INK:MUTED);
        put(fit(team(c.t1),MID-M-24-14),MID-14,y,{align:'right'});
        font(BODY,'bold'); size(9.5); col(c.done?O:FAINT);
        put(c.done?`${c.s1??0} : ${c.s2??0}`:'– : –',MID,y,{align:'center'});
        font(BODY,a2?'bold':'normal'); size(9); col(a2?INK:MUTED);
        put(fit(team(c.t2),PW-M-MID-14),MID+14,y);
        y+=6.6;
      });

      if(sit){
        need(6);
        /* Der ausgewiesene Bonus muss zur eingestellten Regel passen:
           'fixed' gibt einen festen Wert je Pause, 'mean' den
           aufgerundeten Rundenmittelwert (nur in der Punktewertung —
           im Siegemodus ist der Ausgleich kein Rundenwert, sondern
           +1 Sieg fuer die untere Tabellenhaelfte). 'none' gibt nichts. */
        const bonus=tourney.pauseMode==='fixed'
          ?(Math.max(0,Math.round(Number(tourney.pausePts)||0))||null)
          :tourney.pauseMode==='none'?null
          :(wins?null:roundMeanBonus(r));
        font(BODY,'normal'); size(7.5); col(MUTED);
        const txt=`Pause: ${(r.sitOut||[]).map(nameOf).join(', ')}`;
        put(fit(txt,CW-26),M,y+.4);
        if(bonus){ col(BLUE); font(BODY,'bold');
          put(`+${bonus}`,PW-M,y+.4,{align:'right'}); }
        y+=6;
      }
      y+=4.5;
    });
  }

  /* ══ FUSSZEILEN — erst jetzt, die Seitenzahl braucht das Ende ══ */
  const N=doc.getNumberOfPages();
  for(let i=1;i<=N;i++){
    doc.setPage(i);
    hair(PH-11.5);
    font(BODY,'normal'); size(7.5); col(FAINT);
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
