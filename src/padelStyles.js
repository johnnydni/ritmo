/* ═══════════════════════════════════════════════════════════════
   PADEL SPIELSTILE — Data tables for the seven RITMO playstyle
   archetypes plus the matchmaking quiz that maps answers to a
   style key.

   Pure content; visuals are rendered separately in App.jsx
   (StyleVisual / StyleHeroCard) using STYLE_IMAGES.
═══════════════════════════════════════════════════════════════ */

export const PADEL_STYLES={
  chico:{
    name:'Chico / Chica', subtitle:'Der Allrounder',
    tagline:'Kann alles. Macht wenig falsch.',
    desc:'Vielseitig, anpassungsfähig und konstant — Chico / Chica passt sich schnell an Gegner, Partner und Match-Dynamik an. Kein extremes Risiko, aber fast immer die richtige Lösung. Dieser Typ liest das Match in Echtzeit und wechselt zwischen Offensive und Defensive je nach Situation.',
    kernwerte:['Balance','Anpassung','Konstanz'],
    strengths:[
      'Stabilität in jedem Match-Szenario',
      'Minimiert eigene Fehler über lange Sätze',
      'Liest Gegner und Partner intuitiv',
      'Wechselt situativ zwischen Modi',
    ],
    shots:['Kontrollierte Volleys','Bandeja','Lob','Chiquita','Returns'],
    weaknesses:['Zu vorsichtig','Kein Killerinstinkt','Kann passiv wirken'],
    partners:[
      {id:'toro',why:'Du gleichst Toros Risiko aus und stabilisierst das Match.'},
      {id:'fantasma',why:'Du verankerst Fantasmas Chaos mit Konstanz.'},
    ],
    persona:'Hinter Chico / Chica steckt meist der Teamplayer der Gruppe: ruhig, lösungsorientiert, eher Beobachter als Lautsprecher. Diese Spieler:innen wollen das Match erst verstehen, bevor sie es dominieren — sie sammeln Informationen, passen sich an und werden im Verlauf eines Satzes spürbar stärker. Partner lieben sie, weil sie Fehler verzeihen und Lücken füllen.',
    watchout:'Deine Ausgewogenheit kann zur Komfortzone werden: Wer immer die sichere Lösung wählt, lässt Big Points liegen. Achte darauf, in entscheidenden Momenten bewusst Initiative zu übernehmen — sonst diktieren andere die Schlüsselpunkte und du verwaltest nur das Match, statt es zu gewinnen.',
    counter:'Gegen Chico / Chica gewinnst du nicht über Geduld — die haben sie selbst. Zwing sie früh in extreme Situationen: hohes Tempo auf den Körper, klare Seitenwechsel, Druck auf den Big Points. Wer ihnen Zeit gibt, spielt am Ende gegen eine immer besser werdende Version des Gegners.',
    accent:'#C9943A', card:'#2E1E08', text:'#FFF3D9', symbol:'○',
  },
  toro:{
    name:'Toro', subtitle:'Der Aggressor',
    tagline:'Druck ist meine Defensive.',
    desc:'Toro lebt von Intensität und Netzkontrolle. Er sucht Punkte zu diktieren, forciert Fehler und macht das Match körperlich und mental anstrengend für den Gegner. Wenn Toro im Flow ist, fühlt sich der Court enger an — jeder Ball muss schneller, besser, riskanter gespielt werden.',
    kernwerte:['Power','Dominanz','Entschlossenheit'],
    strengths:[
      'Forciert Punktende durch Netzpräsenz',
      'Erzeugt physischen und mentalen Druck',
      'Belohnt aggressive Risikobereitschaft',
      'Dominiert kurze Punkte',
    ],
    shots:['Smash / Remate','Víbora','Aggressive Volley','Bajada','Netzangriff'],
    weaknesses:['Überhastung','Hohes Fehlerrisiko','Berechenbar'],
    partners:[
      {id:'muro',why:'Muro liefert die Defensive, die deine Aggression absichert.'},
      {id:'chico',why:'Chico balanciert deine Spitzen und macht weniger Fehler.'},
    ],
    persona:'Toros sind die Energiequelle auf dem Court: kompetitiv, laut, präsent. Sie brauchen das Gefühl, das Match zu führen — und bringen dafür eine Intensität mit, die Partner tragen und Gegner brechen kann. Hinter der Aggression steckt oft ein feines Gespür für Momentum: Toro riecht, wann ein Match kippt, und geht genau dann auf den Punkt.',
    watchout:'Dein größter Gegner bist du selbst: Überhastung in engen Phasen, Frust nach zwei Fehlern in Folge, Risiko aus Prinzip statt aus Situation. Plane bewusst Reset-Punkte ein — ein hoher, ruhiger Lob ist keine Schwäche, sondern die Vorbereitung für deinen nächsten Angriff.',
    counter:'Nimm Toro das Netz und das Tempo: tiefe Lobs, Bälle auf die Füße, keine Höhe zum Smashen. Lass ihn drei, vier Schläge mehr spielen, als er will — Toros schlagen sich an einer geduldigen Wand oft selbst. Und bleib ruhig: Jede sichtbare Emotion füttert seine Dominanz.',
    accent:'#C0392B', card:'#2A0808', text:'#FFE0DC', symbol:'▲',
  },
  individuoso:{
    name:'Individuoso', subtitle:'Der Stratege',
    tagline:'Ich gewinne den Punkt vor dem Schlag.',
    desc:'Individuoso denkt mehrere Schläge voraus, analysiert Räume und Rhythmen, kontrolliert Tempo und zwingt Gegner in unangenehme Entscheidungen. Schach auf Glas. Dieser Typ baut Punkte über mehrere Schläge auf — der entscheidende Ball ist oft die Folge von zwei Schlägen davor.',
    kernwerte:['Strategie','Antizipation','Präzision'],
    strengths:[
      'Liest Spielmuster zwei bis drei Schläge voraus',
      'Findet Lücken in Gegner-Aufstellungen',
      'Setzt Tempo und Rhythmus gezielt ein',
      'Verwandelt Information in Punkte',
    ],
    shots:['Winkelvolleys','Tempowechsel','Präzisions-Lobs','Chiquita','Platzierungs-Bandeja'],
    weaknesses:['Overthinken','Zu wenig Direktheit','Risiko von Passivität'],
    partners:[
      {id:'motor',why:'Motor exekutiert deine Pläne mit Tempo und Reichweite.'},
      {id:'toro',why:'Toro setzt deine taktischen Lücken in Punkte um.'},
    ],
    persona:'Individuosos sind die Schachspieler: analytisch, strukturiert, oft die, die nach dem Match noch einzelne Punkte rekonstruieren. Sie lieben Muster — im Spiel wie im Kopf — und schlagen zu, wenn der Plan aufgeht. Emotionen zeigen sie selten, lesen sie beim Gegner aber präzise. Ihr bester Schlag ist die Entscheidung zwei Bälle vorher.',
    watchout:'Overthinking ist deine Falle: Wenn der Plan nicht greift, brauchst du einen Plan B statt einer Analyse-Schleife mitten im Punkt. Und manchmal ist der einfache, direkte Ball die beste Strategie — nicht jeder Punkt braucht drei Ebenen und eine Pointe.',
    counter:'Brich den Rhythmus, bevor er entsteht: Tempo-Wechsel, ungewöhnliche Positionen, bewusst „unlogische" Bälle. Individuoso lebt von Mustern — gib ihm keine. Kontrolliertes Chaos ist gegen diesen Typ keine Schwäche, sondern die wirksamste Taktik.',
    accent:'#2471A3', card:'#071828', text:'#D0E8FF', symbol:'■',
  },
  muro:{
    name:'Muro', subtitle:'Die Wand',
    tagline:'Du machst den Fehler.',
    desc:'Muro gewinnt durch Geduld, Defensive und mentale Stärke. Er bringt jeden Ball zurück und zwingt Gegner dazu, selbst Fehler zu machen. Jeder Punkt fühlt sich länger an. Gegen Muro reichen normale Schläge nicht — du musst aktiv riskieren um zu gewinnen, und das ist genau die Falle.',
    kernwerte:['Geduld','Widerstandskraft','Kontrolle'],
    strengths:[
      'Bringt fast jeden Ball ins Spiel zurück',
      'Frustriert Gegner mental über lange Rallyes',
      'Verwandelt Defensive in Court-Kontrolle',
      'Verlängert jeden Punkt um zwei Schläge',
    ],
    shots:['Defensiv-Lob','Tiefe Returns','Glas-Defense','Hohe Bandeja','Crosscourt'],
    weaknesses:['Wenig Initiative','Gefahr passiv zu werden','Reaktiv'],
    partners:[
      {id:'toro',why:'Toro liefert die Offensive, die du absicherst.'},
      {id:'fantasma',why:'Fantasma erzeugt Überraschung, du bringst den Rest zurück.'},
    ],
    persona:'Muros sind die Ruhepole: geduldig, mental stabil, oft die fairsten Spieler:innen auf der Anlage. Sie definieren Erfolg über Kontrolle statt über Highlights und feiern innerlich jeden Gegnerfehler wie einen eigenen Winner. Aus der Ruhe bringen kann sie wenig — und genau das macht sie über drei Sätze so unangenehm.',
    watchout:'Pass auf, dass aus Geduld keine Passivität wird: Wer nur zurückbringt, gibt dem Gegner unendlich viele Versuche. Such dir in jedem Punkt einen Moment, in dem DU aktiv wirst — die überraschende Initiative der „Wand" ist doppelt so gefährlich wie jede erwartete.',
    counter:'Gegen Muro gewinnt nicht der schönere Ball, sondern der klügere Aufbau: Spiel kurz-lang, hol ihn ans Netz (dort ist die Wand am dünnsten) und bleib mental ruhig. Muro gewinnt den Punkt nicht — er wartet auf deinen Fehler. Gib ihm keinen, dann wackelt die Wand.',
    accent:'#1E8449', card:'#071A0E', text:'#C8F0D8', symbol:'⬡',
  },
  fantasma:{
    name:'Fantasma', subtitle:'Der Kreative',
    tagline:'Du weißt nie, was kommt.',
    desc:'Fantasma ist unvorhersehbar, intuitiv und liebt Überraschung. Mit ungewöhnlichen Winkeln, Rhythmusbrüchen und mutigen Ideen erzeugt er Chaos und Unsicherheit. Gegen Fantasma ist Lesen schwerer als Rennen — du weißt nie, ob jetzt der Chiquita oder der Smash kommt.',
    kernwerte:['Kreativität','Überraschung','Freiheit'],
    strengths:[
      'Bricht systematische Gegner-Strategien auf',
      'Erzeugt unlesbare, unkonventionelle Spielzüge',
      'Findet Winkel die Gegner nicht erwarten',
      'Mentaler Game-Changer in engen Sätzen',
    ],
    shots:['Trickshots','Chiquita','Spin-Lobs','Überraschungs-Lob','Unkonventionelle Volleys'],
    weaknesses:['Inkonsistenz','Hohes Risiko','Unnötig verspielt'],
    partners:[
      {id:'muro',why:'Muro fängt deine kreativen Risiken sicher auf.'},
      {id:'chico',why:'Chico bringt Konstanz in dein verspieltes Repertoire.'},
    ],
    persona:'Fantasmas sind die Künstler: intuitiv, verspielt, allergisch gegen Routine. Sie spielen Padel, weil es schön sein kann — der unmögliche Winkel zählt für sie doppelt. Diese Spieler:innen spüren Momente, statt sie zu planen, und drehen Matches mit Ideen, die niemand trainiert hat. Mit Fantasma wird kein Match langweilig, versprochen.',
    watchout:'Dein Risiko: Kreativität als Selbstzweck. Der Trickshot beim Satzball ist Instagram, nicht Matchgewinn. Definiere dir Zonen — in engen Phasen die einfache Lösung, deine Magie hebst du für Momente auf, in denen sie das Match dreht, statt es zu verschenken.',
    counter:'Gegen Fantasma hilft Struktur: Erwarte das Unerwartete, statt es lesen zu wollen. Steh einen halben Schritt zentraler, spiel konsequent auf den Partner und bleib emotionslos bei seinen Highlights — Fantasma lebt vom Publikum. Ohne Bühne wird der Geist erstaunlich normal.',
    accent:'#7D3C98', card:'#180828', text:'#EDD8FF', symbol:'●',
  },
  motor:{
    name:'Motor', subtitle:'Der Dauerläufer',
    tagline:'Ich krieg noch einen Ball.',
    desc:'Motor gewinnt durch Bewegung, Reichweite und nie endende Energie. Er deckt enorme Flächen ab und bleibt auch in langen Rallyes gefährlich. Wer ihn schlagen will, muss einen Extra-Ball spielen. Motor zermürbt Gegner allein durch seine Präsenz auf jedem Quadratmeter des Courts.',
    kernwerte:['Ausdauer','Geschwindigkeit','Kampfgeist'],
    strengths:[
      'Deckt enorme Court-Fläche ab',
      'Erreicht "unmögliche" Bälle und verlängert Punkte',
      'Bleibt fit und scharf über lange Matches',
      'Erzwingt Extra-Schläge beim Gegner',
    ],
    shots:['Recovery Lob','Laufvolleys','Defensive Counter','Tiefe Returns','Sprint-Retrievals'],
    weaknesses:['Wenig natürliche Power','Kann sich überarbeiten','Risiko von ineffizientem Energieeinsatz'],
    partners:[
      {id:'individuoso',why:'Individuoso lenkt deine Energie taktisch klug.'},
      {id:'muro',why:'Muro hält den Court, während du jagst.'},
    ],
    persona:'Motors sind die Kämpfer: ehrgeizig, fit, mental unermüdlich. Aufgeben existiert in ihrem Vokabular nicht — der „verlorene" Ball ist für sie eine Einladung. Oft sind es die Spieler:innen, die als erste auf der Anlage stehen und als letzte gehen. Ihr Spiel ist ein Versprechen an den Partner: Ich bin da, immer.',
    watchout:'Deine Energie ist endlich, auch wenn es sich nicht so anfühlt: Wer jeden Ball mit hundert Prozent jagt, hat im dritten Satz nichts mehr übrig. Lern, Punkte zu lesen — manche Bälle darf man ziehen lassen, damit die Beine die wirklich wichtigen gewinnen.',
    counter:'Lauf Motor nicht hinterher — lass IHN laufen, aber klug: kurze Winkel statt langer Diagonalen leeren seinen Akku schneller als deinen. Und beende Punkte am Netz konsequent beim ersten Versuch: Gegen Motor ist der zweite Matchball immer schwerer als der erste.',
    accent:'#27AE60', card:'#071A10', text:'#C8FFE0', symbol:'▶▶',
  },
  hysterica:{
    name:'Hysterica', subtitle:'Pure Emotion',
    tagline:'Erst der Puls, dann der Punkt.',
    desc:'Hysterica spielt mit offenem Herzen und maximaler Energie: jeder Punkt ein Statement, jedes Momentum eine Welle, die ein ganzes Match tragen kann. Läuft es, spielt Hysterica wie entfesselt und reißt Partner und Publikum mit — kippt die Stimmung, wackelt kurz alles. Padel als Achterbahn, und alle fahren mit.',
    kernwerte:['Emotion','Momentum','Energie'],
    strengths:[
      'Reitet Momentum-Wellen wie kein anderer Typ',
      'Steckt Partner mit Energie und Kampfgeist an',
      'Spielt Big Points mit vollem Herzen statt Angst',
      'Macht enge Matches zum Heimspiel — die Stimmung gehört ihr',
    ],
    shots:['Momentum-Smash','Blitz-Netzangriff','Power-Víbora','Risiko-Return','Konter aus dem Chaos'],
    weaknesses:['Stimmungsabhängig','Frust-Spiralen','Fokusverlust'],
    partners:[
      {id:'muro',why:'Muro bleibt ruhig, wenn deine Welle bricht — und hält das Match.'},
      {id:'individuoso',why:'Individuoso gibt deiner Energie Struktur und klare Ziele.'},
    ],
    persona:'Hystericas sind der Herzschlag der Anlage: laut, ehrlich, mitreißend. Sie spielen Padel, weil es sich anfühlen soll — jeder Winner wird gefeiert, jeder Fehler tut kurz richtig weh. Diese Spieler:innen können ein totes Match mit purer Energie zurück ins Leben schreien und sind der Grund, warum Zuschauer stehen bleiben. Mit Hysterica ist Padel nie nur Sport — es ist ein Ereignis.',
    watchout:'Deine Emotion ist Waffe UND Risiko: Dieselbe Welle, die dich trägt, kann dich begraben. Zwei Fehler in Folge sind kein Drama — sie sind zwei Punkte. Bau dir ein Reset-Ritual (Atemzug, Schlägerblick, kurzer Spruch), damit aus einem schlechten Moment keine schlechte Viertelstunde wird.',
    counter:'Nimm Hysterica die Bühne: keine Reaktion auf Winner, keine Diskussionen, keine Emotion. Spiel unspektakulär und konstant — lange, ereignislose Punkte sind Gift für diesen Typ. Und wenn die Frust-Spirale beginnt: genau dann seriell auf sie spielen, nicht weg von ihr.',
    accent:'#D81E5B', card:'#2A0614', text:'#FFDCEA', symbol:'♥',
  },
};

/* ═══════════════════════════════════════════════════════════════
   STYLE_GUIDE — die Spielstile als Nachschlagewerk (Journey →
   Spielstile). Drei Fragen je Typ, eine je Reiter:
     typ   — wer ist das, wie spielt er?
     mit   — wie spiele ich MIT ihm (als Partner)?
     gegen — wie spiele ich GEGEN ihn?
   Jede Antwort: eine Ansage (lead), zwei Saetze (text), drei Punkte.

   Fachlich angelehnt an Rollen, die es im Padel wirklich gibt:
   Allrounder (jugador completo), Abschluss-Spieler links (pegador),
   Aufbauspieler rechts (constructor), Verteidiger (defensor),
   Kreativspieler, Laeufer/Konterspieler und der Momentum-Spieler.
   Wer hier ergaenzt, bleibt bei Dingen, die auf dem Court stimmen:
   Lob holt das Netz zurueck, Bandeja haelt es, Chiquita auf die
   Fuesse nimmt dem Gegner den Smash, durch die Mitte gibt es weniger
   Winkel, langsame tiefe Baelle springen kaum von der Wand ab.

   `scales` (0–100) und `pos` (Spektrum der Uebersicht: x = Abwehr →
   Angriff, y = Kopf → Bauch) sind redaktionell gesetzt — eine
   Charakterisierung, keine Messung. `side` nennt die Seite fuer
   Rechtshaender.
═══════════════════════════════════════════════════════════════ */
export const STYLE_ORDER=['chico','toro','individuoso','muro','fantasma','motor','hysterica'];
export const STYLE_SCALES=[['Abwehr','Angriff'],['Sicherheit','Risiko'],['Kopf','Bauch'],['Lange Punkte','Kurze Punkte']];
export const STYLE_GUIDE={
  chico:{
    pos:[50,46], scales:[50,30,45,45], side:'Beide Seiten, meist rechts',
    typ:{lead:'Spielt, was der Punkt verlangt.',
      text:'Chico / Chica hat keinen Lieblingsschlag, sondern eine Lieblingsentscheidung: die richtige. Bandeja statt Smash, wenn der Lob tief kommt. Chiquita statt Lob, wenn das Netz offen ist.',
      strengths:['Kaum unerzwungene Fehler','Spielt rechts wie links','Stellt sich auf Partner und Gegner ein'],
      weaknesses:['Kein Schlag, der Punkte allein beendet','Überlässt Big Points gern dem Partner','Wird unter Dauerdruck passiv'],
      shots:['Bandeja','Lob','Chiquita','Volley cross','Tiefer Return']},
    mit:{lead:'Gib ihm die Rolle, die fehlt.',
      text:'Chico füllt Lücken. Neben einem Angreifer baut er auf, neben einem Verteidiger macht er Druck. Sag ihm, was du brauchst.',
      tips:[['Klärt die Mitte','Allrounder sind höflich. Legt vor dem Match fest, wer den Ball zwischen euch nimmt.'],
        ['Lass ihn aufbauen','Von rechts bereitet er vor, du schließt links ab.'],
        ['Fordere seinen Abschluss','Erinnere ihn bei 40:40 daran, selbst zu gehen.']],
      partners:[['toro','Du baust auf, Toro macht den Punkt.'],['fantasma','Du bringst Ruhe in sein Risiko.']]},
    gegen:{lead:'Zwing ihn zur Entscheidung.',
      text:'Mit Zeit findet Chico jede Lösung. Ohne Zeit nimmt er die sichere, und die kannst du lesen.',
      tips:[['Tempo auf den Körper','Schnelle Volleys auf Hüfte und Schulter lassen keine Wahl.'],
        ['Rück bei Big Points auf','Bei 40:40 spielt er auf Nummer sicher. Steh am Netz und nimm den Ball früh.'],
        ['Spiel einen an','Wer drei Bälle in Folge bekommt, kann nichts mehr ausgleichen.']]},
  },
  toro:{
    pos:[86,60], scales:[90,80,65,90], side:'Links',
    typ:{lead:'Sucht das Netz und den schnellen Punkt.',
      text:'Toro wartet nicht. Er rückt auf, nimmt den Ball früh und macht jeden Ballwechsel kürzer, als dem Gegner lieb ist. Sein Spiel steht und fällt mit dem Überkopfball.',
      strengths:['Beendet Punkte über Kopf','Hält das Netz mit Druckvolleys','Dreht ein Match in wenigen Minuten'],
      weaknesses:['Smasht Bälle, die eine Bandeja wären','Verliert das Netz nach dem Fehlschlag','Ungeduldig in langen Ballwechseln'],
      shots:['Smash','Víbora','Bajada','Druckvolley','Return und aufrücken']},
    mit:{lead:'Bau ihm den Ball, den er schlagen will.',
      text:'Toro braucht einen Partner, der vorbereitet: tief und geduldig spielen, bis der kurze Lob kommt. Dann gehört der Ball ihm.',
      tips:[['Du rechts, er links','So liegen die Mitte und die meisten Lobs auf seiner Vorhand.'],
        ['Lob statt Risiko','Steht ihr hinten, hol mit dem Lob das Netz zurück. Durchziehen ist sein Job.'],
        ['Brems ihn nach Fehlern','Zwei Fehler in Folge: Der nächste Überkopfball ist eine Bandeja.']],
      partners:[['muro','Sichert ab, was du riskierst.'],['chico','Bereitet vor und macht weniger Fehler.']]},
    gegen:{lead:'Nimm ihm Netz und Tempo.',
      text:'Toro lebt vom schnellen Punkt. Jeder Schlag mehr, den er spielen muss, arbeitet für dich.',
      tips:[['Tiefe Lobs','Hoch und lang in die Ecke. Von dort wird aus dem Smash eine Bandeja.'],
        ['Bälle auf die Füße','Chiquita und flache Returns: Ohne Höhe gibt es nichts zu smashen.'],
        ['Bleib im Punkt','Bring seinen Smash einmal zurück. Den zweiten schlägt er härter und öfter ins Glas.']]},
  },
  individuoso:{
    pos:[38,12], scales:[40,25,10,30], side:'Rechts',
    typ:{lead:'Baut den Punkt, bevor er ihn gewinnt.',
      text:'Individuoso spielt selten den schnellsten Ball, aber fast immer den unbequemsten: in die Mitte, auf die Füße, in die Ecke hinter dem Glas. Er wechselt Tempo und Höhe, bis eine Lücke aufgeht.',
      strengths:['Platziert, statt zu prügeln','Wechselt Tempo und Höhe gezielt','Findet früh den schwächeren Gegner'],
      weaknesses:['Zögert beim Abschluss','Verliert den Faden, wenn der Plan nicht greift','Wenig Wucht über Kopf'],
      shots:['Platzierte Bandeja','Lob in die Ecke','Chiquita','Volley in die Mitte','Tempowechsel']},
    mit:{lead:'Hör auf seinen Plan.',
      text:'Er sieht, wo der Gegner wackelt, oft schon nach drei Spielen. Nutz das, statt dein eigenes Match zu spielen.',
      tips:[['Redet zwischen den Punkten','Er sagt dir, wen ihr anspielt und warum.'],
        ['Nimm die Abschlüsse','Er bereitet vor. Der kurze Ball danach ist deiner.'],
        ['Bewegt euch zusammen','Sein Aufbau trägt nur, wenn ihr gemeinsam vor und zurück geht.']],
      partners:[['motor','Setzt deine Pläne mit Tempo und Reichweite um.'],['toro','Macht aus deiner Vorarbeit Punkte.']]},
    gegen:{lead:'Gib ihm kein Muster.',
      text:'Individuoso liest dich. Wer immer gleich spielt, hat nach einem Satz keinen freien Ball mehr.',
      tips:[['Wechsle selbst das Tempo','Mal hart, mal langsam, mal hoch. Was er nicht vorhersagen kann, kann er nicht planen.'],
        ['Gib ihm Überkopfbälle','Hohe Lobs zwingen ihn zum Smash, und den mag er nicht.'],
        ['Geh früh ans Netz','Unter Druck bleibt keine Zeit für den dritten Schlag im Voraus.']]},
  },
  muro:{
    pos:[12,36], scales:[10,10,35,5], side:'Rechts',
    typ:{lead:'Bringt jeden Ball zurück. Und den nächsten auch.',
      text:'Muro ist hinten zu Hause. Er lässt den Ball von der Wand kommen, statt ihn zu erzwingen, und antwortet mit dem Lob, bis der Gegner überdreht.',
      strengths:['Liest die Wände und hat dadurch Zeit','Lobs, die den Gegner vom Netz holen','Kaum unerzwungene Fehler'],
      weaknesses:['Rückt nach dem guten Lob zu spät nach','Wenig Druck am Netz','Überlässt dem Gegner die Initiative'],
      shots:['Lob','Verteidigung von der Rückwand','Doppelwand','Hohe Bandeja','Return cross']},
    mit:{lead:'Mach aus seiner Abwehr deinen Angriff.',
      text:'Muro hält euch in jedem Punkt. Gewinnen müsst ihr ihn trotzdem vorn, und dorthin nimmst du ihn mit.',
      tips:[['Geh nach seinem Lob vor','Ein guter Lob ist die Einladung ans Netz. Nimm ihn mit.'],
        ['Nimm die Überkopfbälle','Bandeja und Smash sind deine, die Wand ist seine.'],
        ['Bleib geduldig','Wirf den Punkt nicht mit einem Risikoball weg, den er gerade gerettet hat.']],
      partners:[['toro','Liefert die Offensive, die du absicherst.'],['hysterica','Du bleibst ruhig, wenn ihre Welle bricht.']]},
    gegen:{lead:'Hol ihn nach vorn.',
      text:'Hinten ist die Wand am dicksten, am Netz am dünnsten. Muro gewinnt den Punkt nicht, er wartet auf deinen Fehler.',
      tips:[['Spiel kurz','Stopp und kurze Chiquita zwingen ihn aus seiner Zone.'],
        ['Bandeja statt Smash','Halt das Netz, statt den Punkt zu erzwingen. Geduld schlägt Geduld.'],
        ['Langsam und tief','Bälle ohne Tempo springen kaum von der Wand ab. Damit kann er nichts anfangen.']]},
  },
  fantasma:{
    pos:[60,78], scales:[65,85,80,60], side:'Links',
    typ:{lead:'Spielt den Ball, mit dem keiner rechnet.',
      text:'Der Stopp, wo alle den Lob erwarten. Der Volley ans Gitter, der Schnitt, der an der Wand stirbt. Fantasma gewinnt Punkte, die es eigentlich nicht gibt.',
      strengths:['Winkel und Schnitt, die schwer zu lesen sind','Stoppbälle und Bälle ans Gitter','Bringt eingespielte Paare aus dem Rhythmus'],
      weaknesses:['Schwankt zwischen brillant und fehlerhaft','Wählt den schweren Ball, wo der einfache reicht','Auch für den Partner schwer zu lesen'],
      shots:['Stopp','Winkelvolley','Víbora mit Schnitt','Chiquita','Ball ans Gitter']},
    mit:{lead:'Halt ihm den Rücken frei.',
      text:'Fantasma braucht Freiheit und jemanden, der dahinter aufräumt. Je sicherer du stehst, desto mutiger spielt er.',
      tips:[['Sichere die Mitte','Wenn er den Winkel sucht, bleibt die Mitte offen. Die ist deine.'],
        ['Bleib in Bewegung','Auch sein bester Stopp kommt manchmal zurück.'],
        ['Regeln für enge Punkte','Vereinbart: Bei 40:40 kommt der einfache Ball.']],
      partners:[['muro','Fängt auf, was du riskierst.'],['chico','Bringt Konstanz in dein Spiel.']]},
    gegen:{lead:'Bleib bei deinem Plan.',
      text:'Versuch nicht, ihn zu lesen. Nimm ihm die Winkel und lass ihn die schweren Bälle selbst verschlagen.',
      tips:[['Durch die Mitte','Aus der Mitte gibt es weniger Winkel. Flach und tief zwischen beide.'],
        ['Einen Schritt zentraler','Du gibst die Linie auf und deckst dafür fast alles andere.'],
        ['Spiel den Partner an','Wer keinen Ball bekommt, kann nicht zaubern.']]},
  },
  motor:{
    pos:[26,70], scales:[30,35,65,15], side:'Beide Seiten',
    typ:{lead:'Kein Ball ist verloren.',
      text:'Motor macht den Court groß. Er holt den Smash hinter der Wand, läuft den Stopp ab und steht danach wieder am Netz. Wer ihn schlagen will, muss den Punkt zweimal gewinnen.',
      strengths:['Läuft Lobs und Stopps ab','Holt Smashes zurück, auch von draußen','Im dritten Satz so schnell wie im ersten'],
      weaknesses:['Läuft Bälle, die dem Partner gehören','Macht wenig Punkte aus eigener Kraft','Verlässt seine Position zu früh'],
      shots:['Konter-Lob','Volley aus dem Lauf','Bajada','Tiefer Return','Rettungsball']},
    mit:{lead:'Sag ihm, welche Bälle deine sind.',
      text:'Motor will helfen und läuft deshalb überall hin. Mit klaren Ansagen wird aus seinem Einsatz ein System.',
      tips:[['Klare Kommandos','„Meiner“ und „Deiner“, laut und früh.'],
        ['Rück mit seinen Lobs auf','Er holt den Ball, du holst das Netz.'],
        ['Mach du den Punkt','Er hält euch im Ballwechsel. Der Abschluss ist deine Aufgabe.']],
      partners:[['individuoso','Lenkt deine Energie dorthin, wo sie Punkte bringt.'],['toro','Du holst die Bälle, er beendet sie.']]},
    gegen:{lead:'Mach den Punkt am Netz zu.',
      text:'Gegen Motor ist kein Ball sicher. Halbe Abschlüsse kommen zurück, und dann steht ihr falsch.',
      tips:[['Hinter ihn spielen','Gegen die Laufrichtung. Wer schon unterwegs ist, kommt nicht mehr zurück.'],
        ['Smash nur, wenn er sitzt','Sonst Bandeja. Ein zurückgeholter Smash kostet euch das Netz.'],
        ['Durch die Mitte','Er läuft gern in den Bereich des Partners. Dort entstehen Missverständnisse.']]},
  },
  hysterica:{
    pos:[84,88], scales:[75,75,95,70], side:'Links',
    typ:{lead:'Spielt so gut, wie es sich gerade anfühlt.',
      text:'Läuft es, gewinnt Hysterica vier Punkte am Stück und nimmt Partner und Zuschauer mit. Kippt die Stimmung, wackelt kurz alles. Im Padel entscheiden oft genau diese Serien.',
      strengths:['Reitet Serien wie kein anderer Typ','Reißt den Partner mit','Mutig bei Big Points'],
      weaknesses:['Aus zwei Fehlern werden schnell vier','Hadert sichtbar, und Gegner lesen das','Verliert den Fokus in ruhigen Phasen'],
      shots:['Smash','Druckvolley','Risiko-Return','Víbora','Konter']},
    mit:{lead:'Sei der Ruhepol.',
      text:'Ihre Energie ist eure Waffe. Deine Aufgabe ist, die Welle zu verlängern und die Spirale zu stoppen.',
      tips:[['Kontakt nach jedem Punkt','Schläger abklatschen, ein Wort. Das hält die Welle und bremst das Tief.'],
        ['Nimm nach Fehlern den nächsten Ball','Gib ihr einen Punkt Pause, ohne es anzusagen.'],
        ['Feier mit','Wer ihre Winner mitfeiert, bekommt mehr davon.']],
      partners:[['muro','Bleibt ruhig, wenn deine Welle bricht.'],['individuoso','Gibt deiner Energie eine Richtung.']]},
    gegen:{lead:'Nimm ihr die Bühne.',
      text:'Hysterica braucht Reibung, Tempo und Reaktion. Gib ihr nichts davon.',
      tips:[['Lange, ruhige Punkte','Hoch, tief, ereignislos. Das ist Gift für diesen Typ.'],
        ['Zeig keine Reaktion','Kein Jubel, kein Ärger, keine Diskussion.'],
        ['Im Tief auf sie spielen','Wenn sie hadert, bekommt sie jeden Ball.']]},
  },
};
/* Eine Quelle: Staerken, Schwaechen, Schlaege und Partner der alten
   Felder (Profil, „Alles über <Stil>") kommen aus dem Guide. */
Object.keys(STYLE_GUIDE).forEach(id=>{
  const g=STYLE_GUIDE[id],s=PADEL_STYLES[id];
  s.strengths=g.typ.strengths; s.weaknesses=g.typ.weaknesses; s.shots=g.typ.shots;
  s.partners=g.mit.partners.map(([pid,why])=>({id:pid,why}));
});

export const PADEL_QUIZ=[
  {
    key:'q1',
    label:'Was fühlt sich für dich am besten an?',
    options:[
      {id:'a',label:'Ein solides, fehlerfreies Match'},
      {id:'b',label:'Den Punkt mit Power beenden'},
      {id:'c',label:'Den Gegner taktisch ausspielen'},
      {id:'d',label:'Alles verteidigen, bis der Fehler kommt'},
      {id:'e',label:'Mit etwas Unerwartetem überraschen'},
      {id:'f',label:'Jeden Ball noch erreichen'},
      {id:'g',label:'Auf der Emotionswelle surfen'},
    ],
  },
  {
    key:'q2',
    label:'Deine größte Stärke?',
    options:[
      {id:'a',label:'Vielseitigkeit'},
      {id:'b',label:'Dominanz'},
      {id:'c',label:'Spielintelligenz'},
      {id:'d',label:'Geduld'},
      {id:'e',label:'Kreativität'},
      {id:'f',label:'Ausdauer'},
      {id:'g',label:'Leidenschaft'},
    ],
  },
  {
    key:'q3',
    label:'Wie gewinnst du am liebsten?',
    options:[
      {id:'a',label:'Konstanz'},
      {id:'b',label:'Druck'},
      {id:'c',label:'Strategie'},
      {id:'d',label:'Fehler des Gegners'},
      {id:'e',label:'Überraschung'},
      {id:'f',label:'Längere Rallyes'},
      {id:'g',label:'Momentum'},
    ],
  },
  {
    key:'q4',
    label:'Dein größtes Risiko?',
    options:[
      {id:'a',label:'Zu vorsichtig'},
      {id:'b',label:'Zu aggressiv'},
      {id:'c',label:'Zu kompliziert'},
      {id:'d',label:'Zu passiv'},
      {id:'e',label:'Zu verspielt'},
      {id:'f',label:'Zu laufintensiv'},
      {id:'g',label:'Zu emotional'},
    ],
  },
];

export function computeStyle(qa){
  if(!qa) return null;
  const counts={a:0,b:0,c:0,d:0,e:0,f:0,g:0};
  Object.values(qa).forEach(v=>{if(v&&counts[v]!==undefined) counts[v]++;});
  const max=Math.max(...Object.values(counts));
  if(max===0) return null;
  const winner=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  return {a:'chico',b:'toro',c:'individuoso',d:'muro',e:'fantasma',f:'motor',g:'hysterica'}[winner]||null;
}

/* Primär- UND Sekundär-Stil aus denselben Antworten: nach Häufigkeit
   sortiert (stabil — bei Gleichstand gewinnt die frühere Kategorie,
   identisch zu computeStyle). Sekundär = zweithäufigster Archetyp mit
   mindestens einer Stimme; gibt es nur einen, bleibt secondary null. */
export function computeStyles(qa){
  if(!qa) return {primary:null,secondary:null};
  const counts={a:0,b:0,c:0,d:0,e:0,f:0,g:0};
  Object.values(qa).forEach(v=>{if(v&&counts[v]!==undefined) counts[v]++;});
  const MAP={a:'chico',b:'toro',c:'individuoso',d:'muro',e:'fantasma',f:'motor',g:'hysterica'};
  const ranked=Object.entries(counts).filter(([,c])=>c>0).sort((a,b)=>b[1]-a[1]);
  return {
    primary:ranked[0]?MAP[ranked[0][0]]:null,
    secondary:ranked[1]?MAP[ranked[1][0]]:null,
  };
}

/* ═══════════════════════════════════════════════════════════════
   MATCH-TIER — RITMO DNA Rating einer 2-gegen-2-Paarung.

   Rein stilbasiert: Turnier-Spieler tragen einen Spielstil, aber kein
   Level — daher fließt nur die Stil-Chemie ein (Level ist im Turnier
   nicht erfasst). Pro Team ergibt sich ein Chemie-Wert aus den beiden
   Stilen, die Summe beider Teams (0..4) bestimmt das Tier:

     teamChem:
       2 = DUO     — empfohlene Partner (ergänzen sich)
       1 = MIXED   — verschieden, aber keine ausgewiesene Synergie
       0 = MIRROR  — gleicher Stil (Schwächen-Dopplung)

     Summe → Tier:  4→S, 3→A, 2→B, 1→C, 0→X
═══════════════════════════════════════════════════════════════ */

// Empfohlene-Partner-Beziehung (ungerichtet) aus den .partners-Listen.
function arePartners(a,b){
  if(!a||!b||a===b) return false;
  const inA=PADEL_STYLES[a]?.partners?.some(x=>x.id===b);
  const inB=PADEL_STYLES[b]?.partners?.some(x=>x.id===a);
  return !!(inA||inB);
}

// Chemie zweier Teammate-Stile: 2 Duo, 1 Mixed, 0 Mirror.
function teamChem(a,b){
  if(a===b) return 0;          // Mirror
  if(arePartners(a,b)) return 2; // Duo-Synergie
  return 1;                     // Mixed
}

export const MATCH_TIER_META={
  S:{tier:'S', label:'S-Tier', sub:'Elite Synergy',   stars:5, color:'#1A8754'},
  A:{tier:'A', label:'A-Tier', sub:'Starke Chemie',   stars:4, color:'#3498DB'},
  B:{tier:'B', label:'B-Tier', sub:'Solides Match',   stars:3, color:'#F39C12'},
  C:{tier:'C', label:'C-Tier', sub:'Reibungs-Match',  stars:2, color:'#E67E22'},
  X:{tier:'X', label:'X-Tier', sub:'Chaos Mode',      stars:1, color:'#9B59B6'},
};

/* Match-Tier aus den Stilen der vier Spieler (Team 1 vs Team 2).
   t1Styles/t2Styles sind je ein Array aus zwei Stil-Schlüsseln.
   Gibt das Tier-Meta-Objekt zurück — oder null, wenn nicht alle vier
   Stile gesetzt/gültig sind (dann zeigt die UI kein Label). */
export function computeMatchTier(t1Styles, t2Styles){
  const a=t1Styles?.[0], b=t1Styles?.[1], c=t2Styles?.[0], d=t2Styles?.[1];
  if(![a,b,c,d].every(s=>s&&PADEL_STYLES[s])) return null;
  const sum=teamChem(a,b)+teamChem(c,d); // 0..4
  const tier=sum>=4?'S':sum===3?'A':sum===2?'B':sum===1?'C':'X';
  return MATCH_TIER_META[tier];
}

/* ── Per-style image visuals ─────────────────────────────────
   Bilder werden aus /assets im Vite-Projekt geladen.
   Vite injiziert BASE_URL automatisch, sodass GitHub Pages-Pfade
   (/REPO-NAME/assets/...) korrekt aufgelöst werden.
─────────────────────────────────────────────────────────────── */
export const STYLE_IMAGES={
  chico:       'chicochica.jpeg',
  toro:        'toro.jpeg',
  individuoso: 'individuoso.jpeg',
  muro:        'muro.jpeg',
  fantasma:    'fantasma.jpeg',
  motor:       'motor.jpeg',
};
