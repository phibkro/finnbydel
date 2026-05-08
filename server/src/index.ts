import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

import { getDb, schema } from "./db.ts";
import { cityEnum } from "./lib/cities.ts";
import { searchAddresses } from "./lib/geonorge.ts";
import { lookupBydel } from "./lib/lookup.ts";

const { bydeler, cities: citiesTbl } = schema;

interface Env {
	DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// Public — fronted by Cloudflare. CORS required: frontend ships
// from finnbydel.phibkro.org, calls this from a *.workers.dev URL
// (or finnbydel-api.phibkro.org once the custom domain is wired).
// API is read-only + scoped to public open data — no credentials,
// no per-user state — so wildcard CORS is fine.
app.use(
	"*",
	cors({
		origin: "*",
		allowMethods: ["GET", "POST"],
		allowHeaders: ["Content-Type"],
		maxAge: 600,
	}),
);

app.get("/", (c) => c.json({ ok: true, service: "finnbydel-server" }));

// ── /api/cities — cities with at least one seeded polygon
// ("supported" = "has data"). Adding polygons for a new city
// auto-enables it across the UI on the next deploy.
app.get("/api/cities", async (c) => {
	const db = getDb(c.env.DB);
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

// ── /api/cities/:city/bydeler — list bydeler in a city.
app.get("/api/cities/:city/bydeler", async (c) => {
	const cityParse = cityEnum.safeParse(c.req.param("city"));
	if (!cityParse.success) return c.json({ error: "unsupported city" }, 400);

	const db = getDb(c.env.DB);
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

// ── /api/cities/:city/addresses?q=… — Geonorge autocomplete proxy.
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

	const db = getDb(c.env.DB);
	const result = await lookupBydel(db, cityParse.data, lat, lon);
	return c.json({ ...result, coords: { lat, lon }, resolved });
});

// Workers entry point. Hono's `app` object is callable as
// `{ fetch: app.fetch }` directly.
export default app;
