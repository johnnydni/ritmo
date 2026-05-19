import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

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

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
