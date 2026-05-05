/**
 * Seed Norwegian bydel polygons from public sources (Kartverket /
 * per-city open-data portals).
 *
 * Runs at deploy time via `bun run prisma db seed` — invoked by the
 * homelab finnbydel-build.service after `prisma db push` succeeds.
 * Idempotent: upserts on (cityId, name); existing rows updated with
 * fresh polygons on every deploy.
 *
 * ── Data sources ────────────────────────────────────────────────
 * Bydel polygon data is published per-city, not as a unified
 * Kartverket dataset. Operator fills in CITY_SOURCES below with the
 * actual download URLs from each city's open-data portal or
 * kartkatalog.geonorge.no:
 *
 *   - Oslo:       https://geo.dataforumoslo.no  or  oslo.kommune.no
 *                  (search "bydel" in the catalog)
 *   - Bergen:     bergen.kommune.no/api-og-data
 *                  (Kartverk search: "bydeler bergen")
 *   - Trondheim:  trondheim.kommune.no/open-data
 *   - Stavanger:  stavanger.kommune.no/data
 *
 * Each source must serve **GeoJSON in WGS84 (EPSG:4326) or
 * ETRS89 (EPSG:4258)** — the two are coordinate-equivalent at
 * personal-project precision. If only ETRS89/UTM33 is available
 * (EPSG:25833), reproject before importing (use proj4 or save the
 * file as GeoJSON via QGIS / ogr2ogr).
 *
 * ── Attribution (Kartverket CC BY 4.0) ──────────────────────────
 * Display "©Kartverket" with link to https://kartverket.no in the
 * frontend. Component: src/components/Attribution.tsx.
 */

import { PrismaClient } from "@prisma/client";
import bbox from "@turf/bbox";

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
  // Property name on each feature that holds the bydel's display name.
  // Varies between municipalities — Oslo uses "bydelnavn", others may
  // use "navn", "BYDELNAVN", etc. Inspect the first feature manually.
  nameProperty: string;
};

const CITY_SOURCES: CitySource[] = [
  // ── Oslo ─────────────────────────────────────────────────────
  // Source: geodata.bymoslo.no (Oslo kommune's ArcGIS server).
  // MapServer/15 = current Bydelsgrense (15 boroughs).
  // ────────────────────────────────────────────────────────────
  // Note: layer 33 ("Ny bydelsgrense - Bydelsreformen 2026") is
  // also published — switch to layer 33 if/when the reform takes
  // effect and you want the new boundaries.
  {
    city: "Oslo",
    url: "https://geodata.bymoslo.no/arcgis/rest/services/geodata/Basisdata/MapServer/15/query?where=1%3D1&outFields=*&f=geojson&outSR=4326",
    nameProperty: "bydelsnavn",
  },

  // ── Bergen ───────────────────────────────────────────────────
  // Source: kart.bergen.kommune.no/arcgis (Bergen kommune's ArcGIS
  // server). MapServer/1 = Bydeler (8 boroughs).
  {
    city: "Bergen",
    url: "https://kart.bergen.kommune.no/arcgis/rest/services/Basis_kartdata/Bydeler/MapServer/1/query?where=1%3D1&outFields=*&f=geojson&outSR=4326",
    nameProperty: "BYDEL",
  },

  // ── Trondheim ────────────────────────────────────────────────
  // TODO(operator): no public ArcGIS endpoint surfaced during
  // the 2026-05-06 search session. Trondheim's open-data portal
  // (opendata.trondheim.kommune.no) is Episerver-fronted with
  // no obvious GeoJSON path. Candidates to try:
  //   * kart2.trondheim.kommune.no/arcgis/rest/services (probed,
  //     services index returned 404; specific service paths
  //     might still work — try kommunekart, basisdata, …)
  //   * geonorge "Trondheim kommune" organization filter:
  //     kartkatalog.geonorge.no/api/search?orgKommunenr=5001
  //   * Trondheim's 4 administrative bydeler are: Midtbyen,
  //     Østbyen, Lerkendal, Heimdal — small enough to hand-encode
  //     polygons from a Wikipedia/lokalhistoriewiki source as a
  //     last resort.
  // {
  //   city: "Trondheim",
  //   url: "https://...",
  //   nameProperty: "BYDEL",
  // },

  // ── Stavanger ────────────────────────────────────────────────
  // TODO(operator): the only public source surfaced is opencom.no's
  // "Bydeler Stavanger" dataset, but it's published as LineStrings
  // (boundary lines), not closed polygons — useless for PIP without
  // polygonisation. Candidates to try:
  //   * kart.stavanger.kommune.no (didn't probe — try
  //     /arcgis/rest/services?f=pjson)
  //   * geonorge "Stavanger kommune" organization filter
  //   * Polygonise the LineString dataset from opencom.no using
  //     turf-line-to-polygon or a manual GIS step
  // {
  //   city: "Stavanger",
  //   url: "https://...",
  //   nameProperty: "navn",
  // },
];

// User-Agent that identifies this client per Kartverket good-citizen
// practice (not strictly required by the ToS, but they've asked for
// reasonable identification when scraping in volume).
const USER_AGENT = "finnbydel-seed/0.1 (+https://finnbydel.nori.lan)";

async function fetchGeoJson(url: string): Promise<FeatureCollection> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json,application/json" },
  });
  if (!response.ok) {
    throw new Error(`fetch ${url} → ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<FeatureCollection>;
}

async function loadCity(prisma: PrismaClient, source: CitySource): Promise<void> {
  console.log(`[seed] ${source.city}: fetching ${source.url}`);
  const fc = await fetchGeoJson(source.url);

  const cityRow = await prisma.city.upsert({
    where: { name: source.city },
    create: { name: source.city },
    update: {},
  });

  let count = 0;
  for (const feature of fc.features) {
    const name = String(feature.properties[source.nameProperty] ?? "").trim();
    if (!name) {
      console.warn(`[seed] ${source.city}: feature missing "${source.nameProperty}" — skipping`);
      continue;
    }

    const [minLon, minLat, maxLon, maxLat] = bbox(feature) as [number, number, number, number];

    await prisma.bydel.upsert({
      where: { cityId_name: { cityId: cityRow.id, name } },
      create: {
        name,
        cityId: cityRow.id,
        geometryJson: JSON.stringify(feature.geometry),
        minLon,
        minLat,
        maxLon,
        maxLat,
      },
      update: {
        geometryJson: JSON.stringify(feature.geometry),
        minLon,
        minLat,
        maxLon,
        maxLat,
      },
    });
    count += 1;
  }

  console.log(`[seed] ${source.city}: ${count} bydeler upserted`);
}

// Always seed all 4 supported city rows even if the corresponding
// polygon source isn't wired yet. Lets the frontend's per-city page
// route (`/Trondheim`, `/Stavanger`) build successfully — the bydel
// lookup just returns `no_polygon_match` for cities without
// polygons until their source is added.
const ALL_SUPPORTED_CITIES = ["Oslo", "Bergen", "Trondheim", "Stavanger"];

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    // Seed City rows for all 4 supported cities first.
    for (const name of ALL_SUPPORTED_CITIES) {
      await prisma.city.upsert({
        where: { name },
        create: { name },
        update: {},
      });
    }

    if (CITY_SOURCES.length === 0) {
      console.log("[seed] CITY_SOURCES empty — only base City rows seeded, no polygons. Edit prisma/seed.ts to add data sources.");
      return;
    }
    for (const source of CITY_SOURCES) {
      try {
        await loadCity(prisma, source);
      } catch (err) {
        // Don't abort the whole seed because one city's URL is dead;
        // log and continue so other cities still get loaded.
        console.error(`[seed] ${source.city}: ${(err as Error).message}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
