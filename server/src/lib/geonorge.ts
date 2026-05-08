import { USER_AGENT } from "./cities.ts";

export type GeonorgeAddress = {
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

// Live-search Geonorge for addresses matching `query` in `city`.
// Geonorge's search is fuzzy and city-tolerant; the caller must
// post-filter by `kommunenavn` to keep matches scoped to the picked
// city. `limit` caps `treffPerSide` (Geonorge max 50).
export async function searchAddresses(
  query: string,
  city: string,
  limit = 10,
): Promise<GeonorgeAddress[]> {
  const url = new URL("https://ws.geonorge.no/adresser/v1/sok");
  url.searchParams.set("sok", `${query} ${city}`);
  url.searchParams.set("treffPerSide", String(limit));

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Geonorge ${response.status}`);
  }
  const json = (await response.json()) as GeonorgeResponse;

  const upperCity = city.toUpperCase();
  return json.adresser.filter((a) => a.kommunenavn === upperCity);
}
