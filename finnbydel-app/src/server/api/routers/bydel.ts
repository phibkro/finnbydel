/**
 * bydel router — answers "which bydel is this address in?" for the 4
 * supported cities. Two-step lookup:
 *   1. Address-string + city → Geonorge `/adresser/v1/sok` → coords.
 *   2. coords → bbox-prefiltered Bydel candidates → exact JS-side PIP
 *      via @turf/boolean-point-in-polygon → matching bydel.
 *
 * Address data: ©Kartverket (CC BY 4.0). Bydel polygons: per-city
 * municipal open data (see prisma/seed.ts).
 */

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const SUPPORTED_CITIES = ["Oslo", "Bergen", "Trondheim", "Stavanger"] as const;
const cityEnum = z.enum(SUPPORTED_CITIES);

const USER_AGENT = "finnbydel/0.1 (+https://finnbydel.nori.lan)";

type GeonorgeAddress = {
  adressetekst: string;
  kommunenavn: string;
  representasjonspunkt: { lat: number; lon: number };
};

type GeonorgeResponse = {
  metadata: { totaltAntallTreff: number };
  adresser: GeonorgeAddress[];
};

async function geocodeAddress(query: string, city: string): Promise<GeonorgeAddress | null> {
  // Geonorge address search is fuzzy + tolerant of casing. Filtering
  // on `kommunenavn` after the fact keeps us within the picked city
  // (the API itself doesn't reliably scope by city via params).
  const url = new URL("https://ws.geonorge.no/adresser/v1/sok");
  url.searchParams.set("sok", `${query} ${city}`);
  url.searchParams.set("treffPerSide", "5");

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Geonorge ${response.status}`);
  }
  const json = (await response.json()) as GeonorgeResponse;

  const upperCity = city.toUpperCase();
  const inCity = json.adresser.find((a) => a.kommunenavn === upperCity);
  return inCity ?? json.adresser[0] ?? null;
}

export const bydelRouter = createTRPCRouter({
  /**
   * Resolve `{ city, address }` to its bydel.
   * Returns `{ bydel: null, ... }` when:
   *   - Geonorge can't find the address
   *   - the resolved point doesn't fall in any seeded bydel polygon
   *     (operator hasn't seeded that city yet, or the address sits
   *      on a city boundary)
   */
  byAddress: publicProcedure
    .input(
      z.object({
        city: cityEnum,
        address: z.string().min(1).max(200),
      }),
    )
    .query(async ({ ctx, input }) => {
      const hit = await geocodeAddress(input.address, input.city);
      if (!hit) {
        return { bydel: null, resolved: null, reason: "address_not_found" as const };
      }

      const { lat, lon } = hit.representasjonspunkt;

      // Bbox prefilter — at urban scale typically narrows ~10
      // candidates to 0 or 1 in O(rows) using the indexed cityId.
      const candidates = await ctx.prisma.bydel.findMany({
        where: {
          city: { name: input.city },
          minLon: { lte: lon },
          maxLon: { gte: lon },
          minLat: { lte: lat },
          maxLat: { gte: lat },
        },
      });

      const pt = point([lon, lat]);
      const match = candidates.find((b) =>
        booleanPointInPolygon(pt, JSON.parse(b.geometryJson) as GeoJSON.Polygon | GeoJSON.MultiPolygon),
      );

      return {
        bydel: match?.name ?? null,
        resolved: hit.adressetekst,
        coords: { lat, lon },
        reason: match ? ("found" as const) : ("no_polygon_match" as const),
      };
    }),

  /**
   * Same as `byAddress` but for clients that already have the
   * coordinates (e.g. from `address.search` autocomplete output) —
   * skips the address-string-to-coords Geonorge call. Saves ~50ms
   * per submitted lookup.
   */
  byCoords: publicProcedure
    .input(
      z.object({
        city: cityEnum,
        lat: z.number(),
        lon: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const candidates = await ctx.prisma.bydel.findMany({
        where: {
          city: { name: input.city },
          minLon: { lte: input.lon },
          maxLon: { gte: input.lon },
          minLat: { lte: input.lat },
          maxLat: { gte: input.lat },
        },
      });
      const pt = point([input.lon, input.lat]);
      const match = candidates.find((b) =>
        booleanPointInPolygon(pt, JSON.parse(b.geometryJson) as GeoJSON.Polygon | GeoJSON.MultiPolygon),
      );
      return {
        bydel: match?.name ?? null,
        reason: match ? ("found" as const) : ("no_polygon_match" as const),
      };
    }),

  /** Lists bydeler that have been seeded for a given city. */
  listByCity: publicProcedure
    .input(z.object({ city: cityEnum }))
    .query(({ ctx, input }) => {
      return ctx.prisma.bydel.findMany({
        where: { city: { name: input.city } },
        select: { name: true },
        orderBy: { name: "asc" },
      });
    }),
});
