# RITMO Padel — Supabase E-Mail-Templates

RITMO-gebrandete HTML-Templates (dark + Orange `#FF7A1A`, deutsche Copy) für alle
Supabase-Auth- und Security-Mails. Jede Datei ist **self-contained** (Inline-Styles,
table-based Layout) und für Gmail, Apple Mail, iOS Mail und Outlook gebaut.

## Verwendung

Supabase Dashboard → **Authentication → Emails**. Pro Template das `Source`/HTML-Feld
öffnen und den Inhalt der passenden Datei **komplett hineinkopieren**.

> Hinweis: Supabase nimmt nur den **HTML-Body** — der `<!DOCTYPE>`/`<html>`-Wrapper
> ist trotzdem in Ordnung (wird mitversendet) und sorgt für korrektes Rendering in
> allen Clients. Einfach die ganze Datei einfügen.

## Mapping Datei → Dashboard

### Auth-Mails (`Authentication → Emails`)

| Dashboard-Template | Datei |
|---|---|
| Invite user | [`invite.html`](invite.html) |
| Magic link / OTP | [`magic-link.html`](magic-link.html) |
| Change email address | [`change-email.html`](change-email.html) |
| Reset password | [`reset-password.html`](reset-password.html) |
| Reauthentication | [`reauthentication.html`](reauthentication.html) |

> **Confirm signup** war im Screenshot nicht dabei — falls dieses Template aktiv ist,
> kann `invite.html` als Vorlage übernommen werden (gleiche Variablen).

### Security-Benachrichtigungen (`Authentication → Emails → Security`)

| Dashboard-Template | Datei |
|---|---|
| Password changed | [`security-password-changed.html`](security-password-changed.html) |
| Email address changed | [`security-email-changed.html`](security-email-changed.html) |
| Phone number changed | [`security-phone-changed.html`](security-phone-changed.html) |
| Sign-in method linked | [`security-signin-linked.html`](security-signin-linked.html) |
| Sign-in method removed | [`security-signin-removed.html`](security-signin-removed.html) |
| MFA method added | [`security-mfa-added.html`](security-mfa-added.html) |
| MFA method removed | [`security-mfa-removed.html`](security-mfa-removed.html) |

## Template-Variablen (Go-Templating)

Supabase ersetzt diese Platzhalter beim Versand:

| Variable | Bedeutung | verwendet in |
|---|---|---|
| `{{ .ConfirmationURL }}` | Action-Link (Button-Ziel) | invite, magic-link, change-email, reset-password |
| `{{ .Token }}` | 6-stelliger OTP-Code | magic-link, reset-password, reauthentication |
| `{{ .Email }}` | aktuelle E-Mail des Users | invite, magic-link, reset-password, change-email, alle Security |
| `{{ .NewEmail }}` | neue E-Mail (nur E-Mail-Wechsel) | change-email |
| `{{ .SiteURL }}` | App-/Site-URL → „Konto sichern" | alle Security-Mails |
| `{{ .TokenHash }}` | gehashter Token (für eigene Links) | — (optional) |
| `{{ .RedirectTo }}` | Redirect-Ziel | — (optional) |

> Die **Security-Templates** sind rein informativ (kein Action-Link/OTP). Sie nutzen
> `{{ .Email }}` zur Personalisierung und `{{ .SiteURL }}` für den „Konto sichern"-Link.
> Sollte Supabase eine dieser Variablen in einem Security-Template nicht befüllen,
> rendert sie leer — Layout bleibt intakt.

## Betreffzeilen (Vorschlag)

Im Dashboard separat im `Subject`-Feld setzen:

| Template | Betreff |
|---|---|
| Invite user | Du wurdest zu RITMO Padel eingeladen |
| Magic link / OTP | Dein Anmelde-Link für RITMO |
| Change email | Bestätige deine neue E-Mail-Adresse |
| Reset password | Setze dein RITMO-Passwort zurück |
| Reauthentication | Dein RITMO-Bestätigungscode |
| Password changed | Sicherheitshinweis: Passwort geändert |
| Email address changed | Sicherheitshinweis: E-Mail-Adresse geändert |
| Phone number changed | Sicherheitshinweis: Telefonnummer geändert |
| Sign-in method linked | Sicherheitshinweis: Anmeldemethode hinzugefügt |
| Sign-in method removed | Sicherheitshinweis: Anmeldemethode entfernt |
| MFA method added | Sicherheitshinweis: 2FA-Methode hinzugefügt |
| MFA method removed | Sicherheitshinweis: 2FA-Methode entfernt |

## Design

- **Farben** spiegeln das App-Theme (`src/theme.js`): `--bg #0B0B0E`, `--card #17171C`,
  Border `#26262E`, Akzent/CTA `--o #FF7A1A`, Warnung `--r #E84545`.
- **Wordmark** als Text gerendert (kein externes Bild) → rendert in jedem Client
  zuverlässig, auch wenn Bilder blockiert sind.
- **Buttons** sind „bulletproof" (Tabellen-Zelle mit `bgcolor` + `mso-padding-alt`),
  damit sie auch in Outlook korrekt aussehen.
- Vorschau lokal: Datei einfach im Browser öffnen — die `{{ … }}`-Platzhalter bleiben
  als Text stehen, das Layout ist 1:1 wie beim Versand.
