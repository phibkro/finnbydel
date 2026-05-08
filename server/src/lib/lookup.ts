import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { and, eq, gte, lte } from "drizzle-orm";

import { schema } from "../db.ts";

const { bydeler, cities } = schema;

type Db = ReturnType<typeof import("../db.ts").getDb>;

// Bbox prefilter narrows ~10 candidates to ~1 (urban scale) using
// the indexed (cityId, lat, lon) columns. Then exact PIP runs in
// JS against the polygon GeoJSON. Returns the matching bydel name
// or null if the point sits outside every seeded polygon for that
// city. `db` is passed in (Workers re-binds D1 per request).
export async function lookupBydel(
	db: Db,
	cityName: string,
	lat: number,
	lon: number,
): Promise<{ bydel: string | null; reason: "found" | "no_polygon_match" }> {
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
