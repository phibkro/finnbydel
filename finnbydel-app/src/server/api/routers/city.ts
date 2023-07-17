import { z } from "zod";
import { intSchema } from "~/server/zodSchemas";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const cityRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.city.findMany();
  }),
  byId: publicProcedure
    .input(
      z.object({
        cityId: intSchema,
      })
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.city.findFirst({
        where: {
          id: input.cityId,
        },
      });
    }),
});
