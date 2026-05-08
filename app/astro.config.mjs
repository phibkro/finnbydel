import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sentry from "@sentry/astro";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// SENTRY_DSN drives both build-time bundle injection and runtime
// init. Unset → @sentry/astro no-ops. Setting the env variable is
// the single switch that activates error reporting.
const sentryDsn = process.env.SENTRY_DSN ?? "";

// `site` is the canonical public URL — drives @astrojs/sitemap and
// og:url in Base.astro. Tailnet shadow at finnbydel.nori.lan still
// works for direct/dev access.
export default defineConfig({
  site: "https://finnbydel.phibkro.org",
  integrations: [
    react(),
    sitemap(),
    sentry({
      dsn: sentryDsn,
      sourceMapsUploadOptions: { telemetry: false },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
