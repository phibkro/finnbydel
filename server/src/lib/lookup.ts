import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

import { prisma } from "../prisma.ts";

// Bbox prefilter narrows ~10 candidates to ~1 (urban scale) using
// the indexed (cityId, lat, lon) columns. Then exact PIP runs in JS
// against the polygon GeoJSON. Returns the matching bydel name or
// null if the point sits outside every seeded polygon for that city.
export async function lookupBydel(
  cityName: string,
  lat: number,
  lon: number,
): Promise<{ bydel: string | null; reason: "found" | "no_polygon_match" }> {
  const candidates = await prisma.bydel.findMany({
    where: {
      city: { name: cityName },
      minLon: { lte: lon },
      maxLon: { gte: lon },
      minLat: { lte: lat },
      maxLat: { gte: lat },
    },
  });

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
