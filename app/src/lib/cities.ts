// Mirrors server/src/lib/cities.ts — kept independently so the
// frontend bundle doesn't pull a server-only module.

export const SUPPORTED_CITIES = ["Oslo", "Bergen", "Trondheim", "Stavanger"] as const;
export type SupportedCity = (typeof SUPPORTED_CITIES)[number];

export function isSupportedCity(name: string): name is SupportedCity {
  return (SUPPORTED_CITIES as readonly string[]).includes(name);
}
