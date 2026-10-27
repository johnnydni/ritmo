# Spielstil-Bilder

Lege hier die 6 Spielstil-Fotos ab. Die App lädt sie automatisch aus `/assets/`.

## Erwartete Dateien (exakte Namen!)

| Datei                 | Spielstil               |
|-----------------------|-------------------------|
| `chicochica.jpeg`     | Chico / Chica (Allrounder) |
| `toro.jpeg`           | Toro (Aggressor)        |
| `individuoso.jpeg`    | Individuoso (Strategisch) |
| `muro.jpeg`           | Muro (Wand)             |
| `fantasma.jpeg`       | Fantasma (Kreativ)      |
| `motor.jpeg`          | Motor (Ausdauer)        |

## Empfehlungen

- **Format:** JPEG (kleinere Dateigröße als PNG)
- **Seitenverhältnis:** 7:5 (z.B. 1400×1000 px) — wird auf 7:5 zugeschnitten via `object-fit: cover`
- **Dateigröße:** unter 300 KB pro Bild für schnelles Laden
- **Optional:** Bilder mit `https://tinyjpg.com/` oder ähnlichen Tools komprimieren

## Wenn Bilder fehlen

Fehlt ein Bild oder schlägt das Laden fehl, zeigt die App automatisch einen
farbigen Fallback-Block mit dem Namen des Spielstils.

# Home-Screen-Icons

`icon-180.png`, `icon-192.png`, `icon-512.png` und `icon-maskable-512.png`
werden **generiert** — nicht von Hand bearbeiten, sondern neu bauen:

```bash
python3 tools/make-icons.py
```

Quelle ist `ritmohigh.png` (Logo weiß + gold auf transparent). Die
Icons tragen Schwarz als Fläche und **keinen Alphakanal**: iOS kennt
für Home-Screen-Icons keine Transparenz und legt alles auf Weiß —
der weiße Schriftzug verschwand dadurch komplett.

`icon-maskable-512.png` sitzt enger, weil Android das Icon in eine
frei wählbare Form schneidet und nur der innere 80-%-Kreis garantiert
sichtbar ist.
