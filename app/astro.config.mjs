import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// `site` is the canonical public URL and drives @astrojs/sitemap and
// og:url in Base.astro.
export default defineConfig({
  site: "https://finnbydel.phibkro.org",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
