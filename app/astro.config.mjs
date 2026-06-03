import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

// `site` is the canonical public URL — drives @astrojs/sitemap and
// og:url in Base.astro. Tailnet shadow at finnbydel.nori.lan still
// works for direct/dev access.
export default defineConfig({
  site: "https://finnbydel.phibkro.org",
  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare(),
});