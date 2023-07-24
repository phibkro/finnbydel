import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

import path from "path";
import { promises as fs } from "fs";

const privateDirPath = path.join(process.cwd(), "private");

export const fsRouter = createTRPCRouter({
  bergen: readFileProcedure("Bergen_Adressenavn.tsv"),
  oslo: readFileProcedure("Oslo_Adressenavn.tsv"),
  trondheim: readFileProcedure("Trondheim_Adressenavn.tsv"),
  stavanger: readFileProcedure("Stavanger_Adressenavn.tsv"),
});

function readFileProcedure(fileName: string) {
  const filePath = path.join(privateDirPath, fileName);
  return publicProcedure.query(async () => {
    try {
      const fileData = await fs.readFile(filePath, "utf-8");
      const arrayData = fileData.trim().split("\r\n");
      return arrayData;
    } catch (error) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: fileName + " not found",
        cause: error,
      });
    }
  });
}
