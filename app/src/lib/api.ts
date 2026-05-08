// Tiny typed client for the Hono backend at PUBLIC_API_URL.
// Each function calls one route + returns the parsed JSON; on
// non-2xx, throws an Error with the server-supplied message.

export type Suggestion = {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  lat: number;
  lon: number;
};

export type LookupResult = {
  bydel: string | null;
  reason: "found" | "no_polygon_match" | "address_not_found";
  coords?: { lat: number; lon: number };
  resolved?: string | null;
};

export type City = { id: number; name: string };

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) ?? "http://localhost:4001";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  cities: () => call<City[]>("/api/cities"),
  searchAddresses: (city: string, query: string) =>
    call<Suggestion[]>(
      `/api/cities/${encodeURIComponent(city)}/addresses?q=${encodeURIComponent(query)}`,
    ),
  lookupByCoords: (city: string, lat: number, lon: number) =>
    call<LookupResult>(`/api/cities/${encodeURIComponent(city)}/lookup`, {
      method: "POST",
      body: JSON.stringify({ lat, lon }),
    }),
};
