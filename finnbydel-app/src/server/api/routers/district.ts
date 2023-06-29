import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const districtRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.district.findMany();
  }),
});
