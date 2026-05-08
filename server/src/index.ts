import "./sentry.ts"; // must run before any other code so it can patch globals

import { serve } from "@hono/node-server";
import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

import { db, schema } from "./db/index.ts";
import { cityEnum } from "./lib/cities.ts";
import { searchAddresses } from "./lib/geonorge.ts";
import { lookupBydel } from "./lib/lookup.ts";

const { bydeler, cities: citiesTbl } = schema;

const app = new Hono();

// Public — fronted by Cloudflare. CORS is required because the
// frontend ships from finnbydel.phibkro.org and calls this from
// finnbydel-api.phibkro.org. Allow any origin: the API is read-only
// + scoped to public open data, no credentials, no per-user state.
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Content-Type"],
    maxAge: 600,
  }),
);

// ── /api/cities — list cities that have at least one seeded polygon
// ("supported" = "has data"). Adding polygon data for a new city
// in prisma/seed.ts auto-enables it across the UI on the next
// deploy with no further code change.
app.get("/api/cities", async (c) => {
  // Cities with at least one bydel polygon — `inArray` against a
  // subquery that selects distinct cityIds from Bydel. SQLite's
  // query planner picks the cityId index for the inner select.
  const cityIdsWithBydeler = db
    .selectDistinct({ id: bydeler.cityId })
    .from(bydeler);
  const result = await db
    .select({ id: citiesTbl.id, name: citiesTbl.name })
    .from(citiesTbl)
    .where(inArray(citiesTbl.id, cityIdsWithBydeler))
    .orderBy(citiesTbl.name);
  return c.json(result);
});

// ── /api/cities/:city/bydeler — list bydeler in a city. Used by
// future UI surfaces (none on the form today; reserved for a
// per-city overview page).
app.get("/api/cities/:city/bydeler", async (c) => {
  const cityParse = cityEnum.safeParse(c.req.param("city"));
  if (!cityParse.success) return c.json({ error: "unsupported city" }, 400);

  // Resolve city id first then filter bydeler — single index hit
  // each, cleaner than the join on this 2-table cardinality.
  const city = (
    await db
      .select({ id: citiesTbl.id })
      .from(citiesTbl)
      .where(eq(citiesTbl.name, cityParse.data))
      .limit(1)
  )[0];
  if (!city) return c.json([]);

  const result = await db
    .select({ id: bydeler.id, name: bydeler.name })
    .from(bydeler)
    .where(eq(bydeler.cityId, city.id))
    .orderBy(bydeler.name);
  return c.json(result);
});

// ── /api/cities/:city/addresses?q=… — autocomplete proxy to
// Geonorge. Server-side rather than direct browser hit so we send
// a single User-Agent and have a place to add LRU caching later.
const addressQuery = z.object({
  q: z.string().max(200),
});

app.get("/api/cities/:city/addresses", async (c) => {
  const cityParse = cityEnum.safeParse(c.req.param("city"));
  if (!cityParse.success) return c.json({ error: "unsupported city" }, 400);

  const queryParse = addressQuery.safeParse({ q: c.req.query("q") ?? "" });
  if (!queryParse.success) {
    return c.json({ error: queryParse.error.issues[0]?.message }, 400);
  }

  const trimmed = queryParse.data.q.trim();
  if (trimmed.length < 2) return c.json([]);

  const hits = await searchAddresses(trimmed, cityParse.data);
  return c.json(
    hits.map((a) => ({
      adressetekst: a.adressetekst,
      postnummer: a.postnummer,
      poststed: a.poststed,
      lat: a.representasjonspunkt.lat,
      lon: a.representasjonspunkt.lon,
    })),
  );
});

// ── /api/cities/:city/lookup — { lat, lon } | { address } → bydel.
// The form usually sends coords (already known from the autocomplete
// suggestion), but submitting just the address string still works
// — we run an extra Geonorge call to geocode it.
const lookupBody = z.union([
  z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  z.object({
    address: z.string().min(1).max(200),
  }),
]);

app.post("/api/cities/:city/lookup", async (c) => {
  const cityParse = cityEnum.safeParse(c.req.param("city"));
  if (!cityParse.success) return c.json({ error: "unsupported city" }, 400);

  const body = await c.req.json().catch(() => null);
  const bodyParse = lookupBody.safeParse(body);
  if (!bodyParse.success) {
    return c.json({ error: bodyParse.error.issues[0]?.message }, 400);
  }

  let lat: number;
  let lon: number;
  let resolved: string | null = null;

  if ("lat" in bodyParse.data) {
    ({ lat, lon } = bodyParse.data);
  } else {
    const hits = await searchAddresses(bodyParse.data.address, cityParse.data, 5);
    const hit = hits[0];
    if (!hit) {
      return c.json({ bydel: null, reason: "address_not_found" as const });
    }
    ({ lat, lon } = hit.representasjonspunkt);
    resolved = hit.adressetekst;
  }

  const result = await lookupBydel(cityParse.data, lat, lon);
  return c.json({ ...result, coords: { lat, lon }, resolved });
});

// Health endpoint for Gatus + cloudflared default monitor.
app.get("/", (c) => c.json({ ok: true, service: "finnbydel-server" }));

const port = Number(process.env.PORT ?? 4001);
const host = process.env.HOST ?? "127.0.0.1";

serve({ fetch: app.fetch, hostname: host, port }, (info) => {
  console.log(`🏘️  finnbydel-server listening on http://${info.address}:${info.port}`);
});
