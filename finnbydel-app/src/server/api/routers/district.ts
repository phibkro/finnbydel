import { addressSchema } from "~/server/zodSchemas";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const districtRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.district.findMany();
  }),
  byAddress: publicProcedure.input(addressSchema).query(({ ctx, input }) => {
    return ctx.prisma.district.findFirst({
      where: {
        cityId: input.cityId,
        addresses: {
          some: {
            streetName: input.streetName,
            houseNumber: input.houseNumber,
          },
        },
      },
    });
  }),
});
