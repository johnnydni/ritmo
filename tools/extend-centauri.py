#!/usr/bin/env python3
"""Centauri für deutsche Screens ergänzen.

Die Original-Datei (Centauri Regular, 87 Glyphen) deckt nur ASCII ab —
Umlaute, ß, Gedankenstriche, Auslassungspunkte und das Plus fehlen. In
einer komplett deutschsprachigen App fällt damit fast jede Headline auf
die Ersatzschrift zurück, mitten im Wort.

Dieses Skript leitet daraus eine erweiterte Fassung ab. Alle Zeichen
entstehen AUS den vorhandenen Glyphen (Punkt, Bindestrich, S, Anfüh-
rungszeichen) bzw. aus Rechtecken in exakt der Strichstärke der Schrift
— es wird nichts freihändig nachgezeichnet:

  Ä Ö Ü ä ö ü  Grundbuchstabe + zwei Punkt-Glyphen als Trema
  ß            zwei S (die korrekte Versalform, die Schrift ist unicase)
  – —          Bindestrich-Balken in En-/Em-Länge
  …            drei Punkt-Glyphen
  + ×          Balken in Strichstärke (× = zwei gedrehte Balken)
  „            Anführungszeichen auf Grundlinie gesetzt
  " '          auf die typografischen Zeichen der Schrift gemappt

Aufruf:  python3 tools/extend-centauri.py <Original.ttf> <Ziel.ttf>
Danach:  woff2 erzeugen (fontTools: font.flavor='woff2') und nach
         public/fonts/ legen.
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent
from fontTools.pens.ttGlyphPen import TTGlyphPen

LSB = 150      # linke Seitenbreite aller Glyphen
BAR = 238      # Strichstärke (= Punktgröße = Bindestrich-Höhe)
BAR_Y0, BAR_Y1 = 596, 834   # Bindestrich-Balken
CAP = 1431     # Versalhöhe
DOT_Y = 1550   # Unterkante Trema-Punkte (Oberkante 1788 = Zitat-Höhe)


def composite(glyf, hmtx, name, parts, advance):
    """Zusammengesetztes Glyph aus (Basisglyph, dx, dy[, transform])."""
    g = Glyph()
    g.numberOfContours = -1
    g.components = []
    for p in parts:
        base, dx, dy = p[0], p[1], p[2]
        c = GlyphComponent()
        c.glyphName = base
        c.x, c.y = int(dx), int(dy)
        c.flags = 0x04  # ROUND_XY_TO_GRID
        if len(p) > 3:
            c.transform = p[3]
        g.components.append(c)
    glyf[name] = g
    hmtx[name] = (int(advance), LSB)


def rects(glyf, hmtx, name, boxes, advance):
    """Glyph aus Rechtecken (x0, y0, x1, y1)."""
    pen = TTGlyphPen(None)
    for x0, y0, x1, y1 in boxes:
        pen.moveTo((x0, y0)); pen.lineTo((x1, y0))
        pen.lineTo((x1, y1)); pen.lineTo((x0, y1)); pen.closePath()
    glyf[name] = pen.glyph()
    hmtx[name] = (int(advance), LSB)


def main(src, dst):
    f = TTFont(src)
    glyf, hmtx = f['glyf'], f['hmtx']
    order = list(f.getGlyphOrder())
    cmap_add = {}

    def register(name):
        if name not in order:
            order.append(name)

    # ── Trema: zwei Punkte mittig über dem Grundbuchstaben ──────────
    umlauts = [('Adieresis', 'A', 0x00C4), ('Odieresis', 'O', 0x00D6),
               ('Udieresis', 'U', 0x00DC), ('adieresis', 'a', 0x00E4),
               ('odieresis', 'o', 0x00F6), ('udieresis', 'u', 0x00FC)]
    for name, base, cp in umlauts:
        bb = glyf[base]
        centre = (bb.xMin + bb.xMax) / 2
        gap = BAR                      # Abstand zwischen den Punkten
        left = centre - (2 * BAR + gap) / 2
        composite(glyf, hmtx, name,
                  [(base, 0, 0),
                   ('period', left - LSB, DOT_Y),
                   ('period', left + BAR + gap - LSB, DOT_Y)],
                  hmtx[base][0])
        register(name); cmap_add[cp] = name

    # ── ß: die Schrift ist unicase, also die Versalform SS ──────────
    s_adv = hmtx['S'][0]
    composite(glyf, hmtx, 'germandbls',
              [('S', 0, 0), ('S', s_adv, 0)], s_adv * 2)
    register('germandbls'); cmap_add[0x00DF] = 'germandbls'

    # ── Gedankenstriche: Balken in Bindestrich-Stärke ───────────────
    hy = glyf['hyphen']
    rects(glyf, hmtx, 'endash',
          [(LSB, BAR_Y0, hy.xMax, BAR_Y1)], hmtx['hyphen'][0])
    register('endash'); cmap_add[0x2013] = 'endash'
    em_end = LSB + int((hy.xMax - LSB) * 1.5)
    rects(glyf, hmtx, 'emdash',
          [(LSB, BAR_Y0, em_end, BAR_Y1)], em_end + LSB)
    register('emdash'); cmap_add[0x2014] = 'emdash'

    # ── Auslassungspunkte: drei Punkte im Bindestrich-Raster ────────
    step = 715
    composite(glyf, hmtx, 'ellipsis',
              [('period', 0, 0), ('period', step, 0), ('period', 2 * step, 0)],
              2 * step + BAR + 2 * LSB)
    register('ellipsis'); cmap_add[0x2026] = 'ellipsis'

    # ── Plus / Mal: Balken in Strichstärke ──────────────────────────
    cx, cy, arm = 984, 715, 500
    rects(glyf, hmtx, 'plus',
          [(cx - arm, cy - BAR // 2, cx + arm, cy + BAR // 2),
           (cx - BAR // 2, cy - arm, cx + BAR // 2, cy + arm)], 1969)
    register('plus'); cmap_add[0x002B] = 'plus'
    # × = zwei um ±45° gedrehte Balken, Eckpunkte direkt gerechnet
    d, h, r = int(arm * 0.95), BAR / 2, 0.7071
    pen = TTGlyphPen(None)
    for sign in (1, -1):
        pts = [(-d, -h), (d, -h), (d, h), (-d, h)]
        rot = [(cx + x * r - sign * y * r, cy + sign * x * r + y * r)
               for x, y in pts]
        pen.moveTo(rot[0])
        for q in rot[1:]:
            pen.lineTo(q)
        pen.closePath()
    glyf['multiply'] = pen.glyph()
    hmtx['multiply'] = (1969, LSB)
    register('multiply'); cmap_add[0x00D7] = 'multiply'

    # ── Deutsches öffnendes Anführungszeichen auf Grundlinie ────────
    q = glyf['quotedblright']
    composite(glyf, hmtx, 'quotedblbase',
              [('quotedblright', 0, -(q.yMin))], hmtx['quotedblright'][0])
    register('quotedblbase'); cmap_add[0x201E] = 'quotedblbase'

    # ── Gerade Anführungszeichen auf die typografischen mappen ──────
    cmap_add[0x0022] = 'quotedblright'
    cmap_add[0x0027] = 'quoteright'

    f.setGlyphOrder(order)
    for table in f['cmap'].tables:
        if table.isUnicode():
            table.cmap.update(cmap_add)

    # Version kennzeichnen, damit die abgeleitete Fassung erkennbar ist.
    for rec in f['name'].names:
        if rec.nameID == 5:
            rec.string = 'Version 1.00; RITMO de-Erweiterung'

    f.save(dst)
    print(f'{dst}: +{len(cmap_add)} Zeichen, {len(order)} Glyphen')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
