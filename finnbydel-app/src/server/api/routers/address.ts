import { z } from "zod";
import { addressSchema, cityIdSchema } from "~/server/zodSchemas";
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
