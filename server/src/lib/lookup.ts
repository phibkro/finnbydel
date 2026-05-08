import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { and, eq, gte, lte } from "drizzle-orm";

import { db, schema } from "../db/index.ts";

const { bydeler, cities } = schema;

// Bbox prefilter narrows ~10 candidates to ~1 (urban scale) using
// the indexed (cityId, lat, lon) columns. Then exact PIP runs in
// JS against the polygon GeoJSON. Returns the matching bydel name
// or null if the point sits outside every seeded polygon for that
// city.
export async function lookupBydel(
	cityName: string,
	lat: number,
	lon: number,
): Promise<{ bydel: string | null; reason: "found" | "no_polygon_match" }> {
	// Resolve the city id first — keeps the bbox query single-table
	// + indexed on cityId. (Drizzle joins work too; a 2-step lookup
	// reads more naturally and the cardinality is negligible.)
	const city = (
		await db
			.select({ id: cities.id })
			.from(cities)
			.where(eq(cities.name, cityName))
			.limit(1)
	)[0];
	if (!city) return { bydel: null, reason: "no_polygon_match" };

	const candidates = await db
		.select({
			name: bydeler.name,
			geometryJson: bydeler.geometryJson,
		})
		.from(bydeler)
		.where(
			and(
				eq(bydeler.cityId, city.id),
				lte(bydeler.minLon, lon),
				gte(bydeler.maxLon, lon),
				lte(bydeler.minLat, lat),
				gte(bydeler.maxLat, lat),
			),
		);

	const pt = point([lon, lat]);
	const match = candidates.find((b) =>
		booleanPointInPolygon(
			pt,
			JSON.parse(b.geometryJson) as GeoJSON.Polygon | GeoJSON.MultiPolygon,
		),
	);

	return {
		bydel: match?.name ?? null,
		reason: match ? "found" : "no_polygon_match",
	};
}
