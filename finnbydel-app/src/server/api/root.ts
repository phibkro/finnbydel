import { addressRouter } from "./routers/address";
import { bydelRouter } from "./routers/bydel";
import { cityRouter } from "./routers/city";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * Primary tRPC router.
 *
 *   address.search   — autocomplete suggestions (Geonorge proxy);
 *                      drives the address input on the form.
 *   bydel.byAddress  — given a finalised address + city, return its
 *                      bydel via PIP against seeded polygons.
 *   city.*           — list/lookup the 4 supported cities.
 *
 * Old bulk-Address-table architecture is gone — both `address.search`
 * and `bydel.byAddress` are on-demand against Geonorge's APIs, no
 * local mirror.
 */
export const appRouter = createTRPCRouter({
  address: addressRouter,
  bydel: bydelRouter,
  city: cityRouter,
});

export type AppRouter = typeof appRouter;
