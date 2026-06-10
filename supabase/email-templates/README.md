# RITMO Padel — Supabase E-Mail-Templates

RITMO-gebrandete HTML-Templates für alle Supabase-Auth- und Security-Mails.
Stil: **Bauhaus / dark** — tiefes Schwarz (`#0A0A0A`), Card `#141414`, riesige
italic-Hero-Headline, Akzent-Orange `#FF7A1A`, Bauhaus-Farbbalken oben/unten,
deutsche Copy. Jede Datei ist **self-contained** (table-based Layout, alle Stile
inline, Outlook-Button via VML) und für Gmail, Apple Mail, iOS Mail und Outlook
gebaut.

## Verwendung

Supabase Dashboard → **Authentication → Email Templates**. Pro Template das
`Body`-Feld im **Source-Modus** öffnen und den Inhalt der passenden Datei
**komplett hineinkopieren**. Den passenden Betreff im `Subject`-Feld setzen
(Vorschläge unten — stehen auch oben in jeder Datei im Kommentar-Header).

> Tipp: Lokale Vorschau — Datei einfach im Browser öffnen. Die `{{ … }}`-
> Platzhalter bleiben als Text stehen, das Layout ist 1:1 wie beim Versand.

## Mapping Datei → Dashboard

### Auth-Mails (`Authentication → Email Templates`)

| Dashboard-Template | Datei | Betreff-Vorschlag |
|---|---|---|
| Confirm signup | [`confirm-signup.html`](confirm-signup.html) | Bestätige deine E-Mail · RITMO |
| Invite user | [`invite.html`](invite.html) | Du bist eingeladen · RITMO |
| Magic Link / OTP | [`magic-link.html`](magic-link.html) | Dein Login-Link · RITMO |
| Change Email Address | [`change-email.html`](change-email.html) | Bestätige deine neue E-Mail · RITMO |
| Reset Password | [`reset-password.html`](reset-password.html) | Passwort zurücksetzen · RITMO |
| Reauthentication | [`reauthentication.html`](reauthentication.html) | Dein Bestätigungscode · RITMO |

### Security-Benachrichtigungen (`Authentication → Email Templates → Security`)

| Dashboard-Template | Datei | Betreff-Vorschlag |
|---|---|---|
| Password changed | [`security-password-changed.html`](security-password-changed.html) | Sicherheitshinweis: Passwort geändert · RITMO |
| Email address changed | [`security-email-changed.html`](security-email-changed.html) | Sicherheitshinweis: E-Mail geändert · RITMO |
| Phone number changed | [`security-phone-changed.html`](security-phone-changed.html) | Sicherheitshinweis: Telefonnummer geändert · RITMO |
| Sign-in method linked | [`security-signin-linked.html`](security-signin-linked.html) | Sicherheitshinweis: Anmeldemethode hinzugefügt · RITMO |
| Sign-in method removed | [`security-signin-removed.html`](security-signin-removed.html) | Sicherheitshinweis: Anmeldemethode entfernt · RITMO |
| MFA method added | [`security-mfa-added.html`](security-mfa-added.html) | Sicherheitshinweis: 2FA hinzugefügt · RITMO |
| MFA method removed | [`security-mfa-removed.html`](security-mfa-removed.html) | Sicherheitshinweis: 2FA entfernt · RITMO |

## Template-Variablen (Go-Templating)

Supabase ersetzt diese Platzhalter beim Versand:

| Variable | Bedeutung | verwendet in |
|---|---|---|
| `{{ .ConfirmationURL }}` | Action-Link (Button + Fallback) | confirm-signup, invite, magic-link, change-email, reset-password |
| `{{ .Token }}` | 6-stelliger OTP-Code | magic-link, reset-password, reauthentication |
| `{{ .Email }}` | aktuelle E-Mail des Users | alle (Info-Box) |
| `{{ .NewEmail }}` | neue E-Mail (nur E-Mail-Wechsel) | change-email |
| `{{ .SiteURL }}` | App-/Site-URL → „Konto sichern" | alle Security-Mails |

> Die **Security-Templates** sind rein informativ (kein Action-Link/OTP). Sie
> nutzen `{{ .Email }}` zur Personalisierung und `{{ .SiteURL }}` für den
> „Konto sichern"-Link. Befüllt Supabase eine Variable in einem Security-
> Template nicht, rendert sie leer — das Layout bleibt intakt.

## Design-System

- **Hintergrund** `#0A0A0A` · **Card** `#141414` · **Code-/Box-Flächen** `#0A0A0A`
  mit Hairline `#2A2A2A`.
- **Akzent / CTA** `#FF7A1A` (schwarze Schrift auf Button). **Warnung** `#E84545`.
- **Hero-Headline**: italic, `font-weight:900`, ~56 px (mobil 44 px), letzte
  Zeile in Orange.
- **Bauhaus-Farbbalken** oben (Gelb/Blau/Rot + Lücke) und unten (5-farbig) als
  wiederkehrendes Marken-Motiv.
- **Buttons** bulletproof: VML-`roundrect` für Outlook + `<a>`-Fallback für alle
  anderen Clients.
- **Text-Wordmark** „RITMO ●" statt externem Bild → rendert auch bei blockierten
  Bildern zuverlässig.
- Hidden **Preheader**, `format-detection`-Meta (keine Auto-Links für Mail/Tel),
  `color-scheme: dark light` (kein Auto-Invert), responsiv ab 620 px.
- Jede Datei trägt oben einen **Kommentar-Header** mit „Wo einfügen", Betreff
  und den genutzten Platzhaltern.
