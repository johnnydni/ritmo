/* ═══════════════════════════════════════════════════════════════
   RECHTLICHES — Impressum, Datenschutz, Nutzungsbedingungen.

   Reine Inhaltsdaten, kein React. Der Screen in App.jsx rendert nur.

   ⚠️  VOR DEM LAUNCH AUSFÜLLEN: In OPERATOR stehen Platzhalter in
   eckigen Klammern — Name und Anschrift. Ohne diese Angaben ist das
   Impressum nach § 5 DDG unvollständig (abmahnfähig).

   Der Abschnitt „Empfänger" nennt bewusst keine einzelnen Dienste
   mehr. Art. 13 Abs. 1 lit. e DSGVO verlangt Empfänger ODER Kategorien
   von Empfängern — wer wieder konkret werden will, trägt Hosting,
   Datenbank und QR-Dienst dort wieder ein. Alles Übrige ist an dem
   ausgerichtet, was die App tatsächlich tut; ändert sich die
   Datenverarbeitung, gehört die Änderung auch hierhin.

   Kein Rechtsrat: Die Texte sind eine sorgfältige, auf diese App
   zugeschnittene Vorlage. Eine anwaltliche Prüfung ersetzen sie nicht,
   insbesondere sobald Zahlungen, Werbung oder Tracking dazukommen.
═══════════════════════════════════════════════════════════════ */

export const STAND = 'August 2026';

/* ── Betreiberangaben (§ 5 DDG) ────────────────────────────────── */
export const OPERATOR = {
  name:        '[Vor- und Nachname bzw. Firma]',
  legalForm:   '',                                   // z. B. 'GmbH', leer lassen bei Einzelperson
  street:      '[Straße und Hausnummer]',
  city:        '[PLZ und Ort]',
  country:     'Deutschland',
  email:       'hallo@ritmopadel.de',
  phone:       '',                                   // optional, aber schnelle Kontaktaufnahme muss möglich sein
  represented: '',                                   // bei Gesellschaften: vertretungsberechtigte Person
  register:    '',                                   // z. B. 'Amtsgericht München, HRB 123456'
  vatId:       '',                                   // USt-IdNr. nach § 27a UStG, falls vorhanden
};

const A = OPERATOR;
const anschrift = [
  [A.name, A.legalForm].filter(Boolean).join(' '),
  A.street, A.city, A.country,
].filter(Boolean);

/* ── Abschnitte ────────────────────────────────────────────────────
   Blocktypen: {h} Zwischenüberschrift, {p} Absatz, {ul} Liste,
   {kv} Schlüssel-Wert-Zeilen. */
export const LEGAL_SECTIONS = [

  /* ═══ IMPRESSUM ═══════════════════════════════════════════════ */
  {
    id: 'impressum',
    title: 'Impressum',
    sub: 'Angaben gemäß § 5 DDG',
    blocks: [
      { h: 'Anbieter' },
      { ul: anschrift },
      { h: 'Kontakt' },
      { kv: [
        ['E-Mail', A.email],
        ...(A.phone ? [['Telefon', A.phone]] : []),
      ] },
      ...(A.represented ? [{ h: 'Vertreten durch' }, { p: A.represented }] : []),
      ...(A.register ? [{ h: 'Registereintrag' }, { p: A.register }] : []),
      ...(A.vatId ? [{ h: 'Umsatzsteuer-ID' }, { p: `USt-IdNr. nach § 27a UStG: ${A.vatId}` }] : []),
      { h: 'Verantwortlich für den Inhalt' },
      { p: `${A.name}, Anschrift wie oben.` },
      { h: 'Streitbeilegung' },
      { p: 'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: ec.europa.eu/consumers/odr. Unsere E-Mail-Adresse findest du oben.' },
      { p: 'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).' },
    ],
  },

  /* ═══ DATENSCHUTZ ═════════════════════════════════════════════ */
  {
    id: 'datenschutz',
    title: 'Datenschutzerklärung',
    sub: 'Information nach Art. 13, 14 DSGVO',
    blocks: [
      { h: 'Kurz gesagt' },
      { p: 'RITMO ist eine Padel-App zum Zählen von Spielen und Organisieren von Turnieren. Wir verarbeiten so wenig Daten wie möglich: Ein großer Teil bleibt ausschließlich auf deinem Gerät. Wir setzen keine Analyse- oder Tracking-Werkzeuge ein, zeigen keine Werbung, verkaufen keine Daten und binden auch keine Schriften oder Karten von fremden Servern ein.' },

      { h: 'Verantwortlicher' },
      { ul: anschrift },
      { kv: [['E-Mail', A.email]] },
      { p: 'Eine Datenschutzbeauftragte oder einen Datenschutzbeauftragten haben wir nicht bestellt; die Voraussetzungen des § 38 BDSG liegen nicht vor.' },

      { h: 'Daten auf deinem Gerät' },
      { p: 'Spielstände, laufende Turniere, Einstellungen und dein zuletzt verwendetes Profil speichern wir im lokalen Speicher deines Browsers (localStorage, Schlüssel mit dem Präfix „ritmo_"). Diese Daten verlassen dein Gerät nicht und sind für uns nicht einsehbar. Der Zugriff ist technisch erforderlich, damit die App funktioniert — nach § 25 Abs. 2 Nr. 2 TDDDG ist dafür keine Einwilligung nötig. Wir verwenden keine Cookies zu Analyse- oder Werbezwecken.' },
      { p: 'Auch die Texterkennung beim Übernehmen von Spielernamen aus Screenshots läuft vollständig auf deinem Gerät. Die Bilder werden nicht hochgeladen. Hochgeladene Bilder werden vor dem Speichern lokal neu berechnet, wodurch enthaltene Zusatzinformationen wie GPS-Koordinaten entfernt werden.' },

      { h: 'Konto und Anmeldung' },
      { p: 'Für ein Konto verarbeiten wir deine E-Mail-Adresse und ein Passwort, das ausschließlich als kryptografischer Hash gespeichert wird, dazu Zeitpunkt der Registrierung und der letzten Anmeldung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Nutzungsvertrags).' },

      { h: 'Profil- und Spieldaten' },
      { p: 'Wenn du angemeldet bist, speichern wir die Angaben, die du selbst machst, sowie die Ergebnisse deiner Spiele auf unserem Server:' },
      { ul: [
        'Profil: Anzeigename, Spielniveau, Schlaghand, bevorzugte Court-Seite, Kurzbeschreibung, Spielstil, optionales Profilbild',
        'Spiele und Turniere: Ergebnisse, Punkte, Datum, beteiligte Spielernamen',
        'Soziales: wem du folgst und wer dir folgt, Club-Mitgliedschaften und Nachrichten in Club-Chats',
        'Sichtbarkeitseinstellungen deines Profils',
      ] },
      { p: 'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Der Zugriff ist serverseitig auf dein Konto beschränkt (Row Level Security); andere Nutzerinnen und Nutzer sehen nur, was du über die Sichtbarkeitseinstellungen freigibst.' },

      { h: 'Online-Turniere mit PIN' },
      { p: 'Wenn du ein Turnier online teilst, legen wir eine Turnier-Session an: Turniername, Spielernamen, Paarungen und Ergebnisse. Wer die PIN oder den QR-Code kennt, kann diese Session aufrufen — sie ist bewusst nicht durch ein Konto geschützt, damit Mitspielende ohne Registrierung beitreten können. Nutze deshalb Vor- oder Spitznamen und keine sensiblen Angaben. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, bei Namen mitspielender Personen zusätzlich unser berechtigtes Interesse an der Turnierdurchführung nach Art. 6 Abs. 1 lit. f DSGVO.' },

      { h: 'Empfänger' },
      { p: 'Wir geben Daten nur weiter, soweit es für den Betrieb nötig ist. Mit Dienstleistern, die für uns Daten verarbeiten, bestehen Verträge zur Auftragsverarbeitung nach Art. 28 DSGVO.' },
      { p: 'Eine Weitergabe zu Werbezwecken findet nicht statt.' },

      { h: 'Speicherdauer' },
      { p: 'Konto-, Profil- und Spieldaten speichern wir, solange dein Konto besteht. Löschst du dein Konto, werden diese Daten gelöscht; gesetzliche Aufbewahrungspflichten bleiben unberührt. Turnier-Sessions löschen wir, wenn sie nicht mehr benötigt werden. Lokale Daten auf deinem Gerät kannst du jederzeit selbst löschen, indem du die Daten der Website im Browser entfernst.' },

      { h: 'Deine Rechte' },
      { ul: [
        'Auskunft über die zu deiner Person gespeicherten Daten (Art. 15 DSGVO)',
        'Berichtigung unrichtiger Daten (Art. 16 DSGVO)',
        'Löschung (Art. 17 DSGVO)',
        'Einschränkung der Verarbeitung (Art. 18 DSGVO)',
        'Datenübertragbarkeit in einem gängigen Format (Art. 20 DSGVO)',
        'Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO)',
      ] },
      { p: 'Zwei dieser Rechte kannst du direkt in der App ausüben: Unter Einstellungen → Privatsphäre lädst du eine vollständige Kopie deiner Daten herunter und löschst dort auch dein Konto samt Daten. Für alles Weitere genügt eine formlose Nachricht an die oben genannte E-Mail-Adresse.' },
      { p: 'Außerdem steht dir ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu (Art. 77 DSGVO), etwa bei der Behörde deines Wohnsitzes.' },

      { h: 'Sicherheit' },
      { p: 'Die Übertragung erfolgt ausschließlich verschlüsselt über HTTPS. Passwörter werden nur als Hash gespeichert. Der Zugriff auf Konto-, Profil- und Spieldaten ist serverseitig auf das jeweilige Konto beschränkt. Hochgeladene Bilder prüfen wir vor der Verarbeitung auf ihren tatsächlichen Dateityp.' },

      { h: 'Mindestalter' },
      { p: 'Die App richtet sich an Personen ab 16 Jahren. Jüngere dürfen ein Konto nur mit Einwilligung der Sorgeberechtigten anlegen (Art. 8 DSGVO).' },

      { h: 'Änderungen' },
      { p: `Wir passen diese Erklärung an, wenn sich die App oder die Rechtslage ändert. Es gilt jeweils die hier abrufbare Fassung. Stand: ${STAND}.` },
    ],
  },

  /* ═══ NUTZUNGSBEDINGUNGEN ═════════════════════════════════════ */
  {
    id: 'nutzung',
    title: 'Nutzungsbedingungen',
    sub: 'Rahmen für die Nutzung der App',
    blocks: [
      { h: 'Leistung' },
      { p: 'RITMO stellt Werkzeuge bereit, um Padel-Spiele zu zählen, Turniere zu organisieren und Ergebnisse festzuhalten. Die Nutzung ist derzeit kostenlos. Ein Anspruch auf ständige Verfügbarkeit besteht nicht; die App befindet sich in aktiver Entwicklung, einzelne Funktionen können sich ändern oder entfallen.' },

      { h: 'Konto' },
      { p: 'Für einen Teil der Funktionen ist ein Konto nötig. Deine Zugangsdaten sind vertraulich zu behandeln. Bei Verdacht auf unbefugte Nutzung ändere bitte umgehend dein Passwort und informiere uns.' },

      { h: 'Verhalten' },
      { ul: [
        'Keine rechtswidrigen, beleidigenden oder die Rechte Dritter verletzenden Inhalte — das gilt auch für Namen, Kurzbeschreibungen, Turniernamen und Chat-Nachrichten.',
        'Keine Bilder hochladen, an denen du keine Rechte hast.',
        'Namen anderer Personen nur eintragen, wenn diese damit einverstanden sind.',
        'Keine Versuche, die App, ihre Server oder andere Konten zu stören oder unbefugt darauf zuzugreifen.',
      ] },

      { h: 'Inhalte' },
      { p: 'Die Rechte an den von dir eingestellten Inhalten bleiben bei dir. Du räumst uns das einfache Recht ein, sie im für den Betrieb der App erforderlichen Umfang zu speichern und anzuzeigen. Rechtswidrige Inhalte dürfen wir entfernen.' },

      { h: 'Beendigung' },
      { p: 'Du kannst dein Konto jederzeit unter Einstellungen → Privatsphäre löschen. Wir dürfen Konten sperren oder löschen, wenn erheblich gegen diese Bedingungen verstoßen wird.' },

      { h: 'Anwendbares Recht' },
      { p: 'Es gilt deutsches Recht. Zwingende Verbraucherschutzvorschriften des Staates, in dem du deinen gewöhnlichen Aufenthalt hast, bleiben unberührt.' },
    ],
  },

  /* ═══ HAFTUNG ═════════════════════════════════════════════════ */
  {
    id: 'haftung',
    title: 'Haftung und Urheberrecht',
    sub: 'Inhalte, Links, Nutzungsrechte',
    blocks: [
      { h: 'Haftung für Inhalte' },
      { p: 'Als Diensteanbieter sind wir für eigene Inhalte nach § 7 Abs. 1 DDG verantwortlich. Nach §§ 8 bis 10 DDG sind wir nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen. Sobald uns eine konkrete Rechtsverletzung bekannt wird, entfernen wir die betreffenden Inhalte umgehend.' },

      { h: 'Haftung für Links' },
      { p: 'Unser Angebot enthält vereinzelt Links zu externen Websites. Auf deren Inhalte haben wir keinen Einfluss; für sie ist stets der jeweilige Anbieter verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.' },

      { h: 'Haftungsumfang' },
      { p: 'Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit. Bei einfacher Fahrlässigkeit haften wir nur für die Verletzung wesentlicher Vertragspflichten und der Höhe nach begrenzt auf den vorhersehbaren, vertragstypischen Schaden. Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.' },
      { p: 'Ergebnisse, Tabellen und Statistiken werden automatisch berechnet. Für ihre Richtigkeit übernehmen wir keine Gewähr — für die sportliche Wertung eines Turniers ist die Turnierleitung verantwortlich.' },

      { h: 'Urheberrecht' },
      { p: 'Die von uns erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung und Verbreitung außerhalb der Grenzen des Urheberrechts bedürfen unserer schriftlichen Zustimmung.' },
    ],
  },

  /* ═══ LIZENZEN ════════════════════════════════════════════════ */
  {
    id: 'lizenzen',
    title: 'Verwendete Software',
    sub: 'Open-Source-Lizenzen',
    blocks: [
      { p: 'RITMO nutzt freie Software von Dritten. Wir danken den Projekten und geben die Lizenzhinweise weiter:' },
      { kv: [
        ['React', 'MIT-Lizenz'],
        ['Supabase JavaScript SDK', 'MIT-Lizenz'],
        ['Tesseract.js', 'Apache-Lizenz 2.0 — Texterkennung auf dem Gerät'],
        ['qr-scanner', 'MIT-Lizenz'],
        ['Inter', 'SIL Open Font License 1.1'],
        ['Tinos', 'SIL Open Font License 1.1'],
      ] },
      { p: 'Die vollständigen Lizenztexte liegen den jeweiligen Paketen bei. Marken- und Produktnamen Dritter sind Eigentum der jeweiligen Inhaber.' },
    ],
  },
];
