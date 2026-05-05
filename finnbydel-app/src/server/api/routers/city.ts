import { z } from "zod";
import { cityIdSchema, varCharSchema } from "~/server/zodSchemas";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const cityRouter = createTRPCRouter({
  // Only return cities that have at least one bydel polygon seeded
  // — "supported" = "has data". Adding a polygon source for a new
  // city in prisma/seed.ts auto-enables it across the UI on the
  // next deploy with no further code change.
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.city.findMany({
      where: { bydeler: { some: {} } },
    });
  }),
  byId: publicProcedure
    .input(
      z.object({
        cityId: cityIdSchema,
      })
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.city.findFirstOrThrow({
        where: {
          id: input.cityId,
        },
      });
    }),
  byName: publicProcedure
    .input(
      z.object({
        cityName: varCharSchema,
      })
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.city.findFirstOrThrow({
        where: {
          name: input.cityName,
        },
      });
    }),
});
