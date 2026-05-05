/**
 * address router — autocomplete suggestions backed by Geonorge's
 * fuzzy address search.
 *
 * Proxies `https://ws.geonorge.no/adresser/v1/sok` server-side
 * rather than letting the browser hit Geonorge directly. Trade-off:
 *   * Extra hop (~30-50ms latency on cache miss).
 *   * Single User-Agent identifying this homelab as the client
 *     (Kartverket good-citizen practice).
 *   * Centralised place to add an LRU cache later — popular query
 *     prefixes ("Karl Joh…") get hot in the cache, drop the latency.
 *   * Frontend stays decoupled from Geonorge's API shape — only
 *     sees the simplified `Suggestion` type below.
 *
 * Address data: ©Kartverket (CC BY 4.0).
 */

import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const SUPPORTED_CITIES = ["Oslo", "Bergen", "Trondheim", "Stavanger"] as const;
const cityEnum = z.enum(SUPPORTED_CITIES);

const USER_AGENT = "finnbydel/0.1 (+https://finnbydel.nori.lan)";

type GeonorgeAddress = {
  adressetekst: string;
  kommunenavn: string;
  postnummer: string;
  poststed: string;
  representasjonspunkt: { lat: number; lon: number };
};

type GeonorgeResponse = {
  metadata: { totaltAntallTreff: number };
  adresser: GeonorgeAddress[];
};

export type Suggestion = {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  lat: number;
  lon: number;
};

export const addressRouter = createTRPCRouter({
  /**
   * Live-search addresses scoped to a single city. Designed to be
   * called per-keystroke from a debounced input (~200-300ms). Returns
   * up to 10 suggestions; empty array if no matches or query too
   * short.
   *
   * Empty/too-short queries return `[]` without hitting Geonorge —
   * cheap pre-filter that keeps the API politely-quiet during early
   * typing.
   */
  search: publicProcedure
    .input(
      z.object({
        city: cityEnum,
        query: z.string().max(200),
      }),
    )
    .query(async ({ input }): Promise<Suggestion[]> => {
      const trimmed = input.query.trim();
      if (trimmed.length < 2) return [];

      const url = new URL("https://ws.geonorge.no/adresser/v1/sok");
      url.searchParams.set("sok", `${trimmed} ${input.city}`);
      url.searchParams.set("treffPerSide", "10");

      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Geonorge ${response.status}`);
      }

      const json = (await response.json()) as GeonorgeResponse;
      const upperCity = input.city.toUpperCase();

      // Geonorge's search is fuzzy + city-tolerant — it can return
      // matches in neighbouring kommuner if they sound similar.
      // Filter post-hoc to keep suggestions strictly in the chosen
      // city.
      return json.adresser
        .filter((a) => a.kommunenavn === upperCity)
        .map(
          (a): Suggestion => ({
            adressetekst: a.adressetekst,
            postnummer: a.postnummer,
            poststed: a.poststed,
            lat: a.representasjonspunkt.lat,
            lon: a.representasjonspunkt.lon,
          }),
        );
    }),
});
