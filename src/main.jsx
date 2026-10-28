import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Basis-Pfad fürs Sub-Path-Deployment (GH Pages): früher als Inline-
// Script in index.html injiziert — das blockiert die CSP (script-src
// 'self'). Im gebündelten Modul ist es CSP-konform und identisch.
window.__BASE__ = import.meta.env.BASE_URL;
// Inter — der freie SF-Pro-Zwilling; selbst gehostet (kein CDN, CSP-fest).
// Gewichte passend zur App-Typo: 400/600/700 Text, 800/900 Display.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
// SF Pro (--font-text) wird bewusst NICHT gebündelt: Apple lizenziert
// die Schrift nur für Apple-Plattformen, wo sie ohnehin installiert
// ist. Auf allen anderen greift die System-Grotesk aus dem Stack.
// Centauri — Display-Schrift für Headlines/Akzente; liegt im Repo, weil
// es sie weder bei Google Fonts noch bei Fontsource gibt. Versalschrift
// mit ergänzten deutschen Zeichen, Details in src/fonts/README.md.
import "./fonts/centauri.css";
// Libre Caslon — nur der Turniername auf der Live-Karte, s. fonts/caslon.css.
import "./fonts/caslon.css";
import App from "./App.jsx";

/* iOS-Homescreen-App: die echte Hoehe selbst setzen.
   Als installierte App (black-translucent) meldet iOS ein Fenster, das
   um ungefaehr die Statusleiste zu kurz ist — der Inhalt beginnt oben
   unter der Statusleiste, endet aber 50–60 pt ueber der Unterkante.
   html, 100 %, 100dvh und position:fixed beziehen sich alle auf dieses
   zu kurze Fenster; darunter blieb nur der schwarze html-Grund stehen.
   screen.* kennt die echte Geraetehoehe. Gesetzt wird nur im
   Standalone-Modus und nur, wenn die Luecke plausibel ist (unter
   140 px) — im Browser-Tab oder bei offener Tastatur bleibt alles,
   wie es ist. */
function fitStandaloneHeight() {
  const standalone = navigator.standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches;
  if (!standalone) return;
  const els = () => [document.documentElement, document.body, document.getElementById("root")];
  const apply = () => {
    const portrait = window.matchMedia?.("(orientation: portrait)").matches;
    const sw = window.screen?.width || 0, sh = window.screen?.height || 0;
    const full = portrait ? Math.max(sw, sh) : Math.min(sw, sh);
    const gap = full - window.innerHeight;
    const h = gap > 0 && gap < 140 ? `${full}px` : "";
    els().forEach((el) => { if (el) el.style.height = h; });
  };
  apply();
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", () => setTimeout(apply, 250));
  // iOS settelt das Fenster beim Start erst nach dem ersten Paint.
  setTimeout(apply, 300); setTimeout(apply, 1200);
}

// Initialize Supabase if env vars are configured
async function bootstrap() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      window.supabase = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      console.log("[RITMO] Supabase initialized");
    } catch (e) {
      console.warn("[RITMO] Supabase init failed:", e);
    }
  } else {
    console.log("[RITMO] No Supabase env vars — using mock auth");
  }

  fitStandaloneHeight();
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();

// Service Worker → vollwertige PWA (offline-fähig, schnellere Starts).
// Nach dem load-Event registriert, damit er den Erst-Start nicht bremst.
// Scope folgt automatisch dem Deploy-Pfad (Root oder /repo/ auf GH Pages).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      // updateViaCache:'none' — sw.js nie aus dem HTTP-Cache: ein neuer
      // Worker (z. B. die Beta-Pause) soll sofort ankommen.
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: "none" })
      .then((reg) => {
        // Eine installierte PWA wird oft nur aus dem Hintergrund
        // zurueckgeholt, ohne Navigation — dann fragt der Browser nie
        // nach einem neuen Worker. Beim Zurueckkommen selbst nachfragen.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update().catch(() => {});
        });
      })
      .catch((e) => console.warn("[RITMO] SW-Registrierung fehlgeschlagen:", e));
  });
}
