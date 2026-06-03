/**
 * Seed Norwegian bydel polygons from public sources (Kartverket /
 * per-city open-data portals).
 *
 * Workers + D1 model: this script runs *locally* via `bun run
 * src/seed.ts`, fetches all GeoJSON, and emits a `seed.sql` file
 * with INSERT-OR-REPLACE statements. The operator then applies it
 * to the remote D1 database with:
 *
 *   wrangler d1 execute finnbydel-db --remote --file=seed.sql
 *
 * Idempotent — re-running regenerates the SQL with the latest
 * polygons; the INSERT OR REPLACE syntax updates rows in place
 * via the (cityId, name) unique index.
 *
 * ── Attribution (Kartverket CC BY 4.0) ──────────────────────────
 * Display "©Kartverket" with link to https://kartverket.no in the
 * frontend. Component: app/src/components/Attribution.astro.
 */

import { writeFileSync } from "node:fs";

import bbox from "@turf/bbox";
import simplify from "@turf/simplify";

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
];

const USER_AGENT = "finnbydel-seed/0.3 (+https://finnbydel.phibkro.org)";
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

// Escape single quotes by doubling — SQLite's standard string
// literal escape.
function sql(s: string): string {
	return `'${s.replace(/'/g, "''")}'`;
}

const lines: string[] = [
	"-- finnbydel polygon seed — generated from open ArcGIS sources",
	"-- by src/seed.ts. INSERT OR REPLACE is idempotent against the",
	"-- (City.name) and (Bydel.cityId, Bydel.name) unique indexes.",
	"",
];

for (const name of ALL_SUPPORTED_CITIES) {
	lines.push(`INSERT OR IGNORE INTO "City" ("name") VALUES (${sql(name)});`);
}
lines.push("");

for (const source of CITY_SOURCES) {
	console.log(`[seed] ${source.city}: fetching ${source.url}`);
	let fc: FeatureCollection;
	try {
		fc = await fetchGeoJson(source.url);
	} catch (err) {
		console.error(`[seed] ${source.city}: ${(err as Error).message}`);
		continue;
	}

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

		// Simplify polygons + round coordinates. Some raw bydel
		// polygons are >100 KB JSON-stringified, over D1's per-
		// statement size limit (SQLITE_TOOBIG). Douglas-Peucker
		// simplification at 0.0002 degrees (~22 m tolerance) +
		// rounding to 4 decimals (~11 m grid) keeps borough
		// boundaries visually accurate while shrinking the JSON
		// 5–10×. PIP results are unaffected at the relevant
		// "which neighborhood is this address in" precision.
		const simplified = simplify(feature, { tolerance: 0.0002, highQuality: false });
		const round = (n: number) => Math.round(n * 1e4) / 1e4;
		const roundCoords = (
			coords: GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][],
		): unknown => {
			if (typeof coords[0] === "number") {
				return (coords as unknown as GeoJSON.Position).map(round);
			}
			return (coords as unknown[]).map((c) => roundCoords(c as GeoJSON.Position[]));
		};
		const rounded = {
			...simplified.geometry,
			coordinates: roundCoords(simplified.geometry.coordinates),
		};
		const geometryJson = JSON.stringify(rounded);

		lines.push(
			`INSERT OR REPLACE INTO "Bydel" ("name", "cityId", "geometryJson", "minLon", "minLat", "maxLon", "maxLat") VALUES (${sql(name)}, (SELECT id FROM "City" WHERE name = ${sql(source.city)}), ${sql(geometryJson)}, ${minLon}, ${minLat}, ${maxLon}, ${maxLat});`,
		);
		count += 1;
	}
	console.log(`[seed] ${source.city}: ${count} bydeler`);
	lines.push("");
}

writeFileSync("seed.sql", lines.join("\n") + "\n");
console.log(`[seed] wrote seed.sql (${lines.length} lines)`);
console.log(
	"[seed] apply with: wrangler d1 execute finnbydel-db --remote --file=seed.sql",
);
