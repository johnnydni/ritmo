#!/usr/bin/env python3
"""Home-Screen-Icons aus dem Logo bauen — mit eingebranntem Schwarz.

Warum überhaupt: `public/assets/ritmohigh.png` ist das App-Logo in
Weiß + Gold auf TRANSPARENT. Als Touch-Icon ist das eine Falle — iOS
kennt keine Transparenz für Home-Screen-Icons und legt alles auf
WEISS. Der weiße Schriftzug verschwand dadurch komplett; auf dem
Home-Screen stand eine fast leere weiße Kachel mit etwas Gold.

Also: Logo auf schwarzem Grund zentrieren, Alphakanal wegrechnen
(RGB statt RGBA, damit nichts mehr nachträglich komponiert werden
kann) und in den Größen ausgeben, die iOS und Android erwarten.

    python3 tools/make-icons.py

Erzeugt in public/assets/:
    icon-180.png            apple-touch-icon (iOS Home-Screen)
    icon-192.png            Manifest, purpose "any"
    icon-512.png            Manifest, purpose "any"
    icon-maskable-512.png   Manifest, purpose "maskable"

Der maskable-Zuschnitt ist enger: Android schneidet Icons in eine
frei wählbare Form (Kreis, Squircle, Rundeck). Garantiert sichtbar
ist nur der innere Kreis mit 80 % Durchmesser — das Logo muss also
deutlich kleiner sitzen als beim normalen Icon, sonst kappt die
Maske die Ränder des Schriftzugs.
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'public', 'assets')
SRC = os.path.join(ASSETS, 'ritmohigh.png')
BG = (0, 0, 0)

# Anteil der Kantenlänge, den das Logo einnehmen darf.
#   any      – iOS rundet nur die Ecken, da ist mehr Platz
#   maskable – muss in den 80-%-Sicherheitskreis passen
FIT_ANY = 0.78
FIT_MASKABLE = 0.56


def render(size, fit):
    src = Image.open(SRC).convert('RGBA')
    box = src.split()[-1].getbbox()          # nur die bemalte Fläche
    art = src.crop(box)
    scale = (size * fit) / max(art.size)
    art = art.resize((max(1, round(art.width * scale)),
                      max(1, round(art.height * scale))), Image.LANCZOS)
    # Schwarz als Fläche, nicht als Alpha — RGB ohne Kanal, damit kein
    # Betriebssystem mehr etwas dahinterlegen kann.
    canvas = Image.new('RGB', (size, size), BG)
    canvas.paste(art, ((size - art.width) // 2, (size - art.height) // 2), art)
    return canvas


def main():
    jobs = [
        ('icon-180.png', 180, FIT_ANY),
        ('icon-192.png', 192, FIT_ANY),
        ('icon-512.png', 512, FIT_ANY),
        ('icon-maskable-512.png', 512, FIT_MASKABLE),
    ]
    for name, size, fit in jobs:
        out = os.path.join(ASSETS, name)
        render(size, fit).save(out, 'PNG', optimize=True)
        print(f'{name:24} {size}x{size}  {os.path.getsize(out):>6} B')


if __name__ == '__main__':
    main()
