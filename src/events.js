/* ═══════════════════════════════════════════════════════════════
   EVENTS — die Termine auf der Startseite.

   Ein Eintrag je Event, von Hand gepflegt (bis es einen Kalender in
   Supabase gibt). Gezeigt werden nur KOMMENDE Events: ein Event faellt
   von der Startseite, sobald sein Ende vorbei ist. Neue Termine also
   einfach anhaengen — Reihenfolge egal, sortiert wird beim Lesen.

   date   'JJJJ-MM-TT'
   from   'HH:MM'  Beginn (Ortszeit)
   to     'HH:MM'  Ende
   format, mode    erste Angaben der Unterzeile ("Americano | Mixed")
   venue  Ort, steht als letzte Angabe der Unterzeile
   maps   Suchbegriff fuer die Route (Google Maps); ohne → venue
═══════════════════════════════════════════════════════════════ */

export const EVENTS=[
  {id:'2026-08-24-padelhaus',date:'2026-08-24',from:'18:00',to:'20:00',
    format:'Americano',mode:'Mixed',venue:'Padel Haus Großmehring',
    maps:'Padel Haus Großmehring'},
];

const MONTHS=['Januar','Februar','März','April','Mai','Juni','Juli',
  'August','September','Oktober','November','Dezember'];

// Ortszeit: new Date(j,m,t,h,min) — nicht new Date('JJJJ-MM-TT'), das
// waere UTC und verschoebe den Tag je nach Zeitzone.
const at=(date,hm)=>{
  const[y,m,d]=date.split('-').map(Number);
  const[h,mi]=(hm||'00:00').split(':').map(Number);
  return new Date(y,m-1,d,h,mi);
};

export const eventStart=ev=>at(ev.date,ev.from);
export const eventEnd=ev=>at(ev.date,ev.to||ev.from);

/* Kommende Events, das naechste zuerst. */
export function upcomingEvents(now=new Date(),list=EVENTS){
  return list.filter(ev=>eventEnd(ev)>=now)
    .sort((a,b)=>eventStart(a)-eventStart(b));
}

/* Die Teile, die die Karte zeigt: "24.8", "August 2026",
   "Americano | Mixed | Padel Haus Großmehring". */
export function eventLabel(ev){
  const s=eventStart(ev);
  return{
    day:`${s.getDate()}.${s.getMonth()+1}`,
    month:`${MONTHS[s.getMonth()]} ${s.getFullYear()}`,
    line:[ev.format,ev.mode,ev.venue].filter(Boolean).join(' | '),
  };
}

export const eventMapsUrl=ev=>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.maps||ev.venue||'')}`;

/* Kalendereintrag (.ics). Ohne Zeitzone geschrieben ("floating"):
   der Kalender legt den Termin auf dieselbe Uhrzeit vor Ort, und das
   ist bei einem Event im Club genau gemeint. */
export function eventIcs(ev){
  const f=d=>`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`+
    `T${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}00`;
  const esc=s=>String(s||'').replace(/[\\;,]/g,m=>'\\'+m).replace(/\n/g,'\\n');
  const{line}=eventLabel(ev);
  return[
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RITMO//Events//DE',
    'BEGIN:VEVENT',
    `UID:${ev.id}@ritmo`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(eventStart(ev))}`,
    `DTEND:${f(eventEnd(ev))}`,
    `SUMMARY:${esc(`RITMO ${ev.format||'Event'}`)}`,
    `DESCRIPTION:${esc(line)}`,
    `LOCATION:${esc(ev.venue)}`,
    'END:VEVENT','END:VCALENDAR',
  ].join('\r\n');
}
