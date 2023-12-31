import { addressRouter } from "./routers/address";
import { createTRPCRouter } from "~/server/api/trpc";
import { cityRouter } from "./routers/city";
import { districtRouter } from "./routers/district";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  address: addressRouter,
  city: cityRouter,
  district: districtRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
