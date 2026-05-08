import { z } from "zod";

export const SUPPORTED_CITIES = ["Oslo", "Bergen", "Trondheim", "Stavanger"] as const;
export type SupportedCity = (typeof SUPPORTED_CITIES)[number];
export const cityEnum = z.enum(SUPPORTED_CITIES);

export const USER_AGENT = "finnbydel/0.2 (+https://finnbydel.phibkro.org)";
