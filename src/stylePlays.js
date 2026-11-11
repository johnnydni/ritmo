/* ═══════════════════════════════════════════════════════════════
   SPIELZUG-SIMULATOR — die Daten (Journey → Spielstile → Simulator).

   Jeder Spielstil bringt EINEN Spielzug mit: seinen typischen Punkt.
   Aus einer Paarung (zwei Typen unten, zwei oben) werden daraus bis zu
   vier Szenen — je vorkommendem Typ eine. Nichts davon ist gerechnet
   oder simuliert: es sind feste Choreografien, redaktionell gesetzt.

   Koordinaten in Metern, geschrieben aus Sicht des Helden: x 0..10
   von links nach rechts, z = Abstand zum Netz (Held bei z > 0, Gegner
   bei z < 0, Rueckwaende bei ±10). Spielt der Held oben, dreht
   `scenesFor` die Szene um 180 Grad.

   Vier Rollen, in dieser Reihenfolge in `p`:
     H  der Held (der Typ, dem der Spielzug gehoert)
     P  sein Partner
     G  der Gegner, um den es geht (Ziel bzw. der, der kontern kann)
     g  der andere Gegner
   Die Gegner werden je Szene so gestellt, wie der Spielzug sie
   braucht: steht drueben ein Typ aus `counter.by`, ist er G, und die
   Szene endet mit `counter.steps` statt mit dem Punkt.

   Ein Schritt: {c: Satz, p: Positionen am ENDE des Schritts,
   b: Wegpunkte des Balls [x, hoehe, z, bogen], zone: [x, z, w, t]}.
   `bogen` ist die Scheitelhoehe ueber der geraden Verbindung.
═══════════════════════════════════════════════════════════════ */
import { PADEL_STYLES, STYLE_ORDER, STYLE_GUIDE } from './padelStyles.js';

const first=id=>PADEL_STYLES[id].name.split(' / ')[0];

export const STYLE_PLAYS={
  toro:{
    title:'Smash por tres',sub:'{H} beendet den Punkt von oben',
    start:{p:[[2.8,3],[7.2,3],[2.8,-8],[7.2,-8]],b:[2.8,1,-8]},
    steps:[
      {c:'{G} lobbt, aber zu kurz.',p:[[3.2,4.2],[7.2,3.4],[2.8,-8],[7.2,-8]],b:[[3.2,2.7,3.8,4]]},
      {c:'{H} geht voll drauf: Smash.',p:[[3.2,3.6],[7.2,3],[3.4,-8.4],[7.2,-8]],
        b:[[6,0,-6.2,0],[7.4,2.3,-10,.3]],zone:[4.6,-7.6,3,2.8],d:1.5},
      {c:'Über die Seitenwand. Por tres.',p:[[3.2,3],[7.2,3],[5,-7.6],[8.4,-6.6]],b:[[11.8,.8,-4.2,2.5]]},
    ],
    counter:{by:['muro','motor'],sub:'{G} bringt den Smash zurück',from:2,steps:[
      {c:'{G} liest ihn und lässt die Wand arbeiten.',p:[[3.2,3],[7.2,3],[6.2,-6.2],[8,-7.6]],b:[[6.5,1,-6.6,1.1]]},
      {c:'Lob zurück. Der Punkt beginnt von vorn.',p:[[3.6,7.2],[7,7.2],[5.4,-5],[7.6,-5]],b:[[4.8,0,8.4,5.2]],zone:[3.4,7,3,3]},
    ]},
  },
  muro:{
    title:'Der Lob',sub:'{H} holt die Gegner vom Netz',
    start:{p:[[2.8,8],[7.2,8],[2.8,-2.8],[7.2,-2.8]],b:[2.8,1.2,-2.8]},
    steps:[
      {c:'{G} volliert tief in die Ecke.',p:[[2.3,8.6],[7.2,8],[2.8,-2.6],[7.2,-2.8]],
        b:[[1.8,0,7.6,.9],[1.6,.8,10,.3],[2.2,.9,8.7,.3]]},
      {c:'{H} wartet auf die Wand und lobbt.',p:[[2.4,8.2],[7.2,7.6],[2.5,-7.4],[7,-5.4]],
        b:[[2,0,-8.3,5.4],[1.9,1.4,-10,.6]],zone:[0,-10,5,3.2],d:3},
      {c:'{G} muss vom Netz weg.',p:[[2.8,3.2],[7.2,3.2],[2.3,-8.4],[7,-7]],b:[[2.4,1.3,-8.4,.5]]},
      {c:'Jetzt stehen {H} und {P} vorn.',p:[[3.4,2.6],[7.2,2.8],[2.4,-8.2],[7,-7.4]],b:[[3.6,1.4,2.4,2.2]]},
    ],
    counter:{by:['toro','hysterica'],sub:'{G} lässt den Lob nicht durch',from:1,steps:[
      {c:'{H} wartet auf die Wand und lobbt.',p:[[2.4,8.2],[7.2,7.6],[2.8,-4.6],[7,-3.4]],b:[[2.8,2.7,-4.6,4.2]],d:2.6},
      {c:'{G} nimmt ihn aus der Luft: Bandeja.',p:[[3,8.4],[7.4,8],[2.8,-3.4],[7.2,-2.8]],
        b:[[7.8,0,7.4,.6],[8.2,.9,10,.3]],zone:[6,6.6,4,3.4]},
      {c:'Das Netz bleibt drüben. Der Lob muss tiefer.',p:[[3,8.4],[7.9,8.8],[2.8,-2.8],[7.2,-2.8]],b:[[7.9,.9,8.9,.3]]},
    ]},
  },
  chico:{
    title:'Die Chiquita',sub:'{H} spielt sich ohne Risiko ans Netz',
    start:{p:[[2.8,7.5],[7.2,7.5],[2.8,-2.5],[7.2,-2.5]],b:[2.8,1,7.5]},
    steps:[
      {c:'{H} nimmt das Tempo raus: Chiquita.',p:[[3,6],[7.2,6.4],[3,-2.3],[7.2,-2.5]],
        b:[[3.4,.3,-2.1,1.4]],zone:[2,-3.6,3,2.6],d:2.4},
      {c:'{G} muss den Ball von unten heben.',p:[[3.6,3.2],[7.2,3],[3.2,-2.4],[7.2,-2.6]],b:[[4.4,1.5,3,1.5]]},
      {c:'{H} ist schon da. Volley in die Lücke.',p:[[4,2.8],[7.2,2.8],[3.6,-3.6],[6.6,-3.6]],
        b:[[5,0,-6.4,.3],[5,.8,-9.6,.5]],zone:[4,-7.6,2,3]},
    ],
    counter:{by:['fantasma'],sub:'{G} macht aus der Chiquita einen Stopp',from:1,steps:[
      {c:'{G} hebt nicht. Kurz cross, hinters Netz.',p:[[4.2,4.4],[7.6,4.2],[3.2,-2.2],[7.2,-2.6]],
        b:[[8.5,0,1.5,.9],[9.4,.3,2.5,.4]],zone:[7,.4,3,2.6]},
      {c:'Wer vorrückt, muss mit {G} rechnen.',p:[[4.6,3.6],[8.6,2.6],[3.2,-2.4],[7.2,-2.6]],b:[[9.8,0,3.2,.15]]},
    ]},
  },
  individuoso:{
    title:'Der Aufbau',sub:'{H} gewinnt den Punkt in drei Schlägen',
    start:{p:[[7.2,7.8],[2.8,7.8],[7.2,-2.6],[2.8,-2.6]],b:[7.2,1,7.8]},
    steps:[
      {c:'Erst hoch: {H} lobbt über {G}.',p:[[7,3.4],[2.8,3.4],[7.4,-7.6],[3,-5]],
        b:[[7.6,0,-8.1,5.2],[7.6,1.2,-9.7,.6]],zone:[5.4,-10,4.6,3],d:3},
      {c:'{G} bringt ihn nur halbhoch zurück.',p:[[6.6,3],[2.8,3],[7.4,-8],[3,-5.6]],b:[[6.5,1.6,2.8,2]]},
      {c:'Dann in die Mitte, zwischen beide.',p:[[6.4,2.8],[3,2.8],[6.2,-7],[4,-5.8]],
        b:[[5,0,-5.6,.4],[5,.7,-8.6,.5]],zone:[4,-7.4,2,3.4]},
      {c:'Wer nimmt ihn? Keiner. Punkt ohne Risiko.',p:[[6.4,2.8],[3,2.8],[5.8,-7.6],[4.3,-6.4]],b:[[5,0,-9.8,.2]],d:1.6},
    ],
    counter:{by:['chico'],sub:'{G} spricht sich ab und bleibt im Punkt',from:3,steps:[
      {c:'{G} ruft „meiner“ und lobbt zurück.',p:[[6.2,6.6],[3.2,6.6],[5.2,-8.2],[3.6,-6]],b:[[5.2,0,7.8,5]],zone:[3.8,6.4,3,3]},
    ]},
  },
  fantasma:{
    title:'Die Finte',sub:'{H} spielt den Ball, mit dem keiner rechnet',
    start:{p:[[2.8,2.8],[7.2,2.8],[7.2,-8],[2.8,-8]],b:[7.2,1,-8]},
    steps:[
      {c:'{G} spielt flach auf {H}.',p:[[3,2.6],[7.2,2.8],[7.2,-8],[2.8,-8]],b:[[3,1.3,2.5,1.1]]},
      {c:'Alle rechnen mit dem harten Volley.',p:[[3,2.4],[7.2,2.8],[7.2,-8.7],[2.8,-8.7]],b:[[3,1.35,2.3,.05]],d:1.3},
      {c:'{H} legt ihn kurz cross hinters Netz.',p:[[3.2,2.4],[7.2,2.6],[7.6,-5.6],[3,-8]],
        b:[[8.1,0,-1.6,1],[9.2,0,-2.6,.35]],zone:[6.6,-3.4,3.4,2.8],d:2.4},
      {c:'Zu spät. Der Ball stirbt am Gitter.',p:[[3.2,2.4],[7.2,2.6],[8.2,-4],[3,-7.6]],b:[[9.8,0,-3.2,.1]],d:1.6},
    ],
    counter:{by:['motor'],sub:'{G} riecht die Finte und läuft sie ab',from:3,steps:[
      {c:'{G} ist schon unterwegs und kommt dran.',p:[[3.2,2.6],[7.2,2.6],[8.8,-2.6],[3.4,-6]],b:[[9,.5,-2.6,.2]],d:1.4},
      {c:'Gegen einen Läufer braucht die Finte ein Ziel.',p:[[3.6,5.6],[6.8,6.4],[8,-2.6],[3.4,-4.6]],b:[[5,0,6.6,3.6]],zone:[3.6,5.2,3,3]},
    ]},
  },
  motor:{
    title:'Der Konter',sub:'{H} macht aus Abwehr Angriff',
    start:{p:[[2.8,7.5],[7.2,7.5],[2.8,-3],[7.2,-3]],b:[2.8,2.7,-3]},
    steps:[
      {c:'{G} schmettert in die Ecke.',p:[[2.4,7],[7.2,7.5],[2.8,-2.8],[7.2,-3]],
        b:[[1.7,0,6.4,0],[1.3,1.9,10,.3],[1.8,2.2,6.6,.7]],d:2},
      {c:'{H} ist schon unterwegs.',p:[[1.9,5.4],[6.6,6.8],[2.6,-2.8],[7.2,-3]],b:[[1.9,1.5,5.2,.3]],d:1.4},
      {c:'Konter aus dem Lauf, die Linie entlang.',p:[[2.2,4],[6.6,5],[1.9,-3.1],[6.8,-3.2]],
        b:[[.9,0,-7,.8],[.8,.6,-9.7,.4]],zone:[0,-9.4,2,5]},
      {c:'Aus Abwehr wird Angriff, in einem Schlag.',p:[[2.6,3],[6.8,3.2],[1.9,-3.6],[6.6,-3.6]],b:[[.9,0,-9.9,.15]],d:1.6},
    ],
    counter:{by:['muro'],sub:'{G} steht schon da, wo der Konter hin soll',from:2,steps:[
      {c:'Konter aus dem Lauf, die Linie entlang.',p:[[2.2,4.6],[6.6,5.4],[1.4,-3],[6.8,-3.2]],b:[[1.3,1.1,-2.9,.7]],d:1.4},
      {c:'{G} steht richtig und blockt. Es geht weiter.',p:[[3,6],[6.8,6.4],[1.6,-2.8],[6.8,-3]],b:[[6,0,5,1],[6.6,.7,7.6,.5]],zone:[4.6,3.8,3,2.6]},
    ]},
  },
  hysterica:{
    title:'Der Lauf',sub:'{H} nimmt den Schwung mit in den nächsten Ball',
    start:{p:[[2.8,6.5],[7.2,7],[7.2,-7.5],[2.8,-7.5]],b:[7.2,1,-7.5]},
    steps:[
      {c:'Punkt gemacht. Jetzt gibt es kein Halten.',p:[[3.4,4.2],[7.2,5.4],[7.2,-7.5],[2.8,-7.5]],b:[[3.4,1.4,4,1.7]]},
      {c:'{H} nimmt ihn früh, noch im Vorlaufen.',p:[[3.4,2.8],[7,3.2],[6.8,-7.4],[2.8,-7.5]],
        b:[[6.4,0,-6,.4],[6.6,.9,-8.5,.5]],zone:[5.2,-7.4,2.6,2.8]},
      {c:'{G} bekommt ihn nur noch hoch.',p:[[3.8,2.6],[7,3],[6.6,-8.4],[3,-7]],b:[[4,2.6,2.4,2.6]]},
      {c:'Zweiter Ball, gleicher Mut. Punkt.',p:[[4,2.4],[7,3],[6.2,-8],[3,-7]],
        b:[[2,0,-5,0],[1,1.5,-10,.3]],zone:[.8,-6.4,2.6,2.8],d:1.5},
    ],
    counter:{by:['individuoso','muro'],sub:'{G} nimmt dem Lauf das Tempo',from:2,steps:[
      {c:'{G} nimmt das Tempo raus: hoher Lob.',p:[[3.6,7.6],[6.8,7.6],[6.6,-8.2],[3,-6.6]],b:[[3.2,0,8.5,5.6]],zone:[1.8,7,3,3],d:3},
      {c:'Ohne Tempo kein Lauf. Der Schwung ist weg.',p:[[3.2,8.6],[6.8,7.8],[6.4,-4.4],[3.2,-4.4]],b:[[3.1,1,9.4,.5]],d:1.6},
    ]},
  },
};

/* Die Szenen einer Paarung. bottom/top: je zwei Stil-ids. Jede Szene
   traegt die vier Rollen schon als Platz im Feld (`seat`: 0/1 = unten
   links/rechts, 2/3 = oben), fertige Saetze und Koordinaten im Feld —
   die Engine muss nichts mehr wissen. */
export function scenesFor(bottom,top){
  const seen=new Set(),out=[];
  [[bottom,top,0],[top,bottom,1]].forEach(([mine,theirs,team])=>mine.forEach((hero,i)=>{
    const play=STYLE_PLAYS[hero];
    if(!play||seen.has(hero)) return;
    seen.add(hero);
    const ci=play.counter?theirs.findIndex(id=>play.counter.by.includes(id)):-1;
    const gi=ci<0?0:ci, cn=ci>=0;
    const ids=[hero,mine[1-i],theirs[gi],theirs[1-gi]];
    const seat=[team*2+i,team*2+1-i,(1-team)*2+gi,(1-team)*2+1-gi];
    const txt=s=>s.replace(/\{([HPGg])\}/g,(_,k)=>first(ids['HPGg'.indexOf(k)]));
    const fl=team===1;
    const xz=([x,z])=>fl?[10-x,-z]:[x,z];
    const steps=(cn?[...play.steps.slice(0,play.counter.from),...play.counter.steps]:play.steps).map(s=>({
      c:txt(s.c),d:s.d||2.2,p:s.p.map(xz),
      b:s.b.map(([x,y,z,h])=>{const[a,b]=xz([x,z]);return[a,y,b,h];}),
      zone:s.zone?(fl?[10-s.zone[0]-s.zone[2],-s.zone[1]-s.zone[3],s.zone[2],s.zone[3]]:s.zone):null,
    }));
    const[bx,bz]=xz([play.start.b[0],play.start.b[2]]);
    out.push({id:hero+(cn?'-k':''),hero,team,counter:cn,title:play.title,
      sub:txt(cn?play.counter.sub:play.sub),seat,
      start:{p:play.start.p.map(xz),b:[bx,play.start.b[1],bz]},steps});
  }));
  return out;
}

/* Startaufstellung: der eigene Typ mit seinem ersten Wunschpartner
   unten, drueben zwei, die nicht schon unten stehen. */
export function defaultTeams(my){
  const a=PADEL_STYLES[my]?my:'toro';
  const b=STYLE_GUIDE[a]?.mit?.partners?.[0]?.[0]||STYLE_ORDER.find(id=>id!==a);
  const rest=['muro','motor','fantasma','toro','chico'].filter(id=>id!==a&&id!==b);
  return{bottom:[a,b],top:rest.slice(0,2)};
}
