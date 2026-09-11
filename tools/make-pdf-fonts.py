#!/usr/bin/env python3
"""Erzeugt die beiden Inter-Schnitte, die der Turnier-PDF-Export einbettet.

Warum ueberhaupt eine eigene Datei, wo die App Inter doch schon laedt:
@fontsource liefert nur woff2/woff, jsPDF braucht aber TTF. Und die
14 Standardschriften eines PDF (Helvetica & Co.) koennen nur WinAnsi —
damit wird aus „Wisniewska" mit s-acute ein „Wi[niewska". Auf einer
Urkunde den Namen des Siegers zu verstuemmeln ist keine Option.

Der Umfang ist deshalb Latin-1 plus Latin Extended-A: das deckt jede
Sprache ab, aus der in einem DACH-Padelclub Namen auftauchen (pl, cz,
hu, tr, hr, ro, skandinavisch). Alles andere fliegt raus, damit die
Dateien klein bleiben — rund 25 kB je Schnitt statt 150 kB.

    python3 tools/make-pdf-fonts.py

Schreibt src/fonts/pdf/inter-regular.ttf und inter-bold.ttf.
Braucht: pip install fonttools brotli
"""
import os
import sys
from fontTools.ttLib import TTFont
from fontTools.merge import Merger
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'node_modules', '@fontsource', 'inter', 'files')
DST = os.path.join(ROOT, 'src', 'fonts', 'pdf')

# latin + latin-ext zusammen; einzeln fehlen die osteuropaeischen Zeichen.
SUBSETS = ('latin', 'latin-ext')
WEIGHTS = ((400, 'inter-regular'), (700, 'inter-bold'))

UNICODES = ','.join([
    'U+0020-007E',   # ASCII
    'U+00A0-017F',   # Latin-1 Supplement + Latin Extended-A
    'U+2010-2015',   # Binde- und Gedankenstriche
    'U+2018-201E',   # typografische Anfuehrungszeichen
    'U+2026',        # Auslassungspunkte
    'U+00B7',        # Mittelpunkt (Trennzeichen in den Metazeilen)
    'U+20AC',        # Euro
    'U+2192',        # Pfeil
])


def build(weight, name):
    tmp = []
    for sub in SUBSETS:
        src = os.path.join(SRC, f'inter-{sub}-{weight}-normal.woff2')
        if not os.path.exists(src):
            sys.exit(f'fehlt: {src}\nVorher `npm install` laufen lassen.')
        f = TTFont(src)
        f.flavor = None                      # woff2 -> ttf
        p = os.path.join(DST, f'_tmp-{sub}-{weight}.ttf')
        f.save(p)
        tmp.append(p)

    merged = os.path.join(DST, f'_tmp-merged-{weight}.ttf')
    Merger().merge(tmp).save(merged)

    out = os.path.join(DST, name + '.ttf')
    subset.main([
        merged, f'--unicodes={UNICODES}',
        '--layout-features=',                # kein Kerning/Ligaturen: jsPDF
        '--drop-tables+=GSUB,GPOS,GDEF,DSIG,FFTM',   # wertet sie nicht aus
        '--no-hinting', '--desubroutinize',
        f'--output-file={out}',
    ])
    for p in tmp + [merged]:
        os.remove(p)

    cmap = TTFont(out).getBestCmap()
    print(f'{name}.ttf  {os.path.getsize(out)//1024} kB  {len(cmap)} Glyphen')
    return cmap


if __name__ == '__main__':
    os.makedirs(DST, exist_ok=True)
    cmaps = [build(w, n) for w, n in WEIGHTS]
    # Gegenprobe: genau die Zeichen, an denen die Standardschriften
    # scheitern, muessen jetzt da sein.
    probe = 'äöüßÄÖÜ śłżćź čřž őűúó çğıış æøå éèêë ñ · – … €'
    for c in probe:
        if c != ' ' and any(ord(c) not in cm for cm in cmaps):
            sys.exit(f'FEHLT nach dem Subsetting: {c!r}')
    print('Probe bestanden:', probe)
