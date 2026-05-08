/**
 * Seed Norwegian bydel polygons from public sources (Kartverket /
 * per-city open-data portals).
 *
 * Runs at deploy time via `bun run src/seed.ts` — invoked by the
 * homelab finnbydel-build.service after the migrate step succeeds.
 * Idempotent: upserts on (cityId, name); existing rows updated with
 * fresh polygons on every deploy.
 *
 * ── Data sources ────────────────────────────────────────────────
 * Bydel polygon data is published per-city, not as a unified
 * Kartverket dataset. Operator fills in CITY_SOURCES below with
 * the actual download URLs from each city's open-data portal or
 * kartkatalog.geonorge.no.
 *
 * ── Attribution (Kartverket CC BY 4.0) ──────────────────────────
 * Display "©Kartverket" with link to https://kartverket.no in the
 * frontend. Component: app/src/components/Attribution.astro.
 */

import bbox from "@turf/bbox";
import { and, eq } from "drizzle-orm";

import { db, schema } from "./db/index.ts";

const { bydeler, cities } = schema;

type FeatureCollection = {
	type: "FeatureCollection";
	features: Array<{
		type: "Feature";
		properties: Record<string, string | number>;
		geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
	}>;
};

type CitySource = {
	city: string;
	url: string;
	// Property name on each feature that holds the bydel's display
	// name. Varies by municipality — Oslo "bydelsnavn", Bergen
	// "BYDEL", others may use "navn" / "BYDELNAVN" / etc. Inspect
	// the first feature manually.
	nameProperty: string;
};

const CITY_SOURCES: CitySource[] = [
	{
		city: "Oslo",
		url: "https://geodata.bymoslo.no/arcgis/rest/services/geodata/Basisdata/MapServer/15/query?where=1%3D1&outFields=*&f=geojson&outSR=4326",
		nameProperty: "bydelsnavn",
	},
	{
		city: "Bergen",
		url: "https://kart.bergen.kommune.no/arcgis/rest/services/Basis_kartdata/Bydeler/MapServer/1/query?where=1%3D1&outFields=*&f=geojson&outSR=4326",
		nameProperty: "BYDEL",
	},
	// Trondheim + Stavanger TBD — see prisma/seed.ts in git history
	// (pre-Drizzle) for the source-search notes.
];

const USER_AGENT = "finnbydel-seed/0.2 (+https://finnbydel.phibkro.org)";

const ALL_SUPPORTED_CITIES = ["Oslo", "Bergen", "Trondheim", "Stavanger"];

async function fetchGeoJson(url: string): Promise<FeatureCollection> {
	const response = await fetch(url, {
		headers: {
			"User-Agent": USER_AGENT,
			Accept: "application/geo+json,application/json",
		},
	});
	if (!response.ok) {
		throw new Error(
			`fetch ${url} → ${response.status} ${response.statusText}`,
		);
	}
	return response.json() as Promise<FeatureCollection>;
}

// Upsert a city by unique name. SQLite's INSERT ... ON CONFLICT (sql
// terms) maps to drizzle's onConflictDoUpdate.
async function upsertCity(name: string): Promise<{ id: number }> {
	const [row] = await db
		.insert(cities)
		.values({ name })
		.onConflictDoUpdate({
			target: cities.name,
			set: { name },
		})
		.returning({ id: cities.id });
	if (!row) throw new Error(`failed to upsert city ${name}`);
	return row;
}

async function loadCity(source: CitySource): Promise<void> {
	console.log(`[seed] ${source.city}: fetching ${source.url}`);
	const fc = await fetchGeoJson(source.url);

	const cityRow = await upsertCity(source.city);

	let count = 0;
	for (const feature of fc.features) {
		const name = String(feature.properties[source.nameProperty] ?? "").trim();
		if (!name) {
			console.warn(
				`[seed] ${source.city}: feature missing "${source.nameProperty}" — skipping`,
			);
			continue;
		}

		const [minLon, minLat, maxLon, maxLat] = bbox(feature) as [
			number,
			number,
			number,
			number,
		];

		const geometryJson = JSON.stringify(feature.geometry);

		// Drizzle's onConflictDoUpdate matches by the unique index
		// (cityId, name) we created in migrate.ts.
		await db
			.insert(bydeler)
			.values({
				name,
				cityId: cityRow.id,
				geometryJson,
				minLon,
				minLat,
				maxLon,
				maxLat,
			})
			.onConflictDoUpdate({
				target: [bydeler.cityId, bydeler.name],
				set: { geometryJson, minLon, minLat, maxLon, maxLat },
			});
		count += 1;
	}

	console.log(`[seed] ${source.city}: ${count} bydeler upserted`);
}

async function main(): Promise<void> {
	// Always seed the 4 supported city rows even if the corresponding
	// polygon source isn't wired yet — lets the frontend's per-city
	// page route build successfully; the bydel lookup just returns
	// `no_polygon_match` for cities without polygons until their
	// source is added.
	for (const name of ALL_SUPPORTED_CITIES) {
		await upsertCity(name);
	}

	if (CITY_SOURCES.length === 0) {
		console.log(
			"[seed] CITY_SOURCES empty — only base City rows seeded, no polygons.",
		);
		return;
	}
	for (const source of CITY_SOURCES) {
		try {
			await loadCity(source);
		} catch (err) {
			// Don't abort the whole seed because one city's URL is
			// dead; log and continue so other cities still load.
			console.error(`[seed] ${source.city}: ${(err as Error).message}`);
		}
	}
}

await main();
console.log("[seed] complete");
// Avoid unused-binding warning if the env query helper is added later.
void and;
void eq;
