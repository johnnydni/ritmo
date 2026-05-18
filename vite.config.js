import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
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
