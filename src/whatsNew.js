/* ── Was ist neu ───────────────────────────────────────────────────
   Der Update-Newsletter: beim ersten Start nach einem Update laeuft
   er EINMAL durch, danach nie wieder. Eine Ausgabe = ein Eintrag in
   RELEASES; die id ist der Merker.

   Regeln fuer den Inhalt (sie stehen hier, weil sie sonst beim
   naechsten Update vergessen werden):

   - Ein Bild, ein Gedanke. Was man nicht zeigen kann, gehoert nicht
     in den Newsletter.
   - Titel: hoechstens vier Woerter. Text: ein Satz, hoechstens zwei
     Zeilen auf 390 px.
   - Aus der Sicht des Nutzers, nicht der App: "Lege deine Runde an",
     nicht "neue Persistenzschicht fuer Schnellstarts".
   - Keine Versionsnummern, keine Dateinamen, keine Schalter, die es
     im Bild nicht gibt.
   - `spots` markieren die Stelle im Bild, um die es geht: x/y in
     PROZENT des Bildes, `label` ein bis zwei Woerter. Mehr als zwei
     Marken pro Bild liest niemand.

   Bilder liegen unter public/assets/whatsnew/ und sind Ausschnitte
   der echten App, keine Montagen. */
export const RELEASES=[
  {
    id:'2026-09-schnellstarts',
    kicker:'Neu in RITMO',
    title:'Zwei Dinge, die Zeit sparen',
    slides:[
      {
        img:'whatsnew/qs-home.jpg', ratio:'366 / 248',
        title:'Deine Runde, ein Tipp',
        text:'Leg deine festen Formate als Karte an: Dienstagsrunde, Feierabend, Firmenturnier.',
        spots:[
          {x:51.4,y:27.8,label:'Ändern',side:'left'},
          /* Die Marke sitzt auf dem "+", nicht auf der Beschriftung:
             sonst deckt das Schildchen genau das Wort zu, um das es
             geht. */
          {x:79.2,y:36,label:'Neu'},
        ],
      },
      {
        img:'whatsnew/qs-sheet.jpg', ratio:'390 / 452',
        title:'Einmal einstellen',
        text:'Format, Spieler, Courts, Zeit und Wertung — beim Start steht alles schon da.',
      },
      {
        img:'whatsnew/court-setup.jpg', ratio:'324 / 271',
        title:'Plätze wie auf der Anlage',
        text:'Schieb die Courts dorthin, wo sie bei euch wirklich stehen.',
        /* Auf der Kachel, nicht auf ihrer Beschriftung. */
        spots:[{x:37.9,y:44,label:'Verschieben'}],
      },
      {
        img:'whatsnew/court-play.jpg', ratio:'362 / 259',
        title:'Ein Platz, ein Blick',
        text:'Im Turnier siehst du jeden Platz mit Stand. Tipp einen an — der Rest tritt zurück.',
        spots:[{x:27.5,y:37,label:'Filtern'}],
      },
    ],
  },
];

/* Die neueste Ausgabe, die dieses Geraet noch nicht gesehen hat.
   Unbekannte/kaputte Merker sind egal: was nicht in der Liste steht,
   zaehlt einfach nicht. */
export function unseenRelease(seen){
  const done=Array.isArray(seen)?seen:[];
  for(let i=RELEASES.length-1;i>=0;i--){
    const r=RELEASES[i];
    if(r&&r.id&&!done.includes(r.id)&&(r.slides||[]).length) return r;
  }
  return null;
}
