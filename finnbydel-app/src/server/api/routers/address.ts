import { z } from "zod";
import { addressSchema, intSchema, varCharSchema } from "~/server/zodSchemas";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const addressRouter = createTRPCRouter({
  byAddress: publicProcedure.input(addressSchema).query(({ ctx, input }) => {
    return ctx.prisma.address.findFirstOrThrow({
      where: {
        cityId: input.cityId,
        streetName: input.streetName,
        houseNumber: input.houseNumber,
      },
    });
  }),
  byCityName: publicProcedure
    .input(
      z.object({
        query: z.object({ cityName: varCharSchema }),
        options: z.object({ take: intSchema.max(100000) }),
      })
    )
    .query(({ ctx, input }) => {
      const id = getIdbyName(input.query.cityName);
      return ctx.prisma.address.findMany({
        where: {
          cityId: id,
        },
        take: input.options.take,
        orderBy: {
          streetName: "desc",
        },
      });
    }),
  /* byStreetName: publicProcedure
    .input(addressSchema.omit({ houseNumber: true }))
    .query(({ ctx, input }) => {
      return ctx.prisma.address.findMany({
        where: {
          cityId: input.cityId,
          streetName: input.streetName,
        },
        distinct: ["districtName"],
        select: {
          city: { select: { name: true } },
          districtName: true,
        },
      });
    }), */
});

function getIdbyName(name: string) {
  // Janky solution
  const names = ["empty", "Bergen", "Oslo", "Trondheim", "Stavanger"];
  return names.findIndex((e) => e === name);
}
