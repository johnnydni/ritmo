import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  // Worktrees liegen unter .claude/worktrees/<name>/ und haben ihr eigenes
  // node_modules. Das Parent-Repo daneben hat auch eines. Ohne dedupe
  // greift Vite je nach Resolve-Pfad mal die eine und mal die andere
  // React-Kopie ab → "Invalid hook call" + Blackscreen. dedupe zwingt
  // ALLE Imports von 'react' und 'react-dom' auf dasselbe Modul-Objekt.
  resolve: { dedupe: ["react", "react-dom"] },
  plugins: [
    react(),
    {
      name: "inject-base",
      transformIndexHtml(html) {
        return html.replace(
          "<!-- __BASE_INJECTION__ -->",
          `<script>window.__BASE__="${base}";</script>`
        );
      },
    },
  ],
  build: { outDir: "dist", assetsDir: "assets" },
});
