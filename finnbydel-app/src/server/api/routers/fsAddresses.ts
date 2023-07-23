import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

import path from "path";
import { promises as fs } from "fs";

const privateFolderPath = path.join(process.cwd(), "private");
const fileName = "adresses.json";
const filePath = path.join(privateFolderPath, fileName);

export const fsAdressesRouter = createTRPCRouter({
  read: publicProcedure.query(async ({ ctx }) => {
    try {
      const fileContent = await fs.readFile(filePath, "utf8");
      return fileContent;
    } catch (error) {
      throw new TRPCError({
        cause: error,
      });
      console.error(error);
    }
    return null;
  }),
  write: publicProcedure
    .input(z.object({ load: z.string() }))
    .query(({ ctx, input }) => {
      return null;
    }),
});
