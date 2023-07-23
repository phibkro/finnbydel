import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { promises as fs } from "fs";

const privateFolderPath = path.join(process.cwd(), "private");
const fileName = "adresses.json";
const filePath = path.join(privateFolderPath, fileName);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      //Read the json data file data.json
      const fileContent = await fs.readFile(filePath, "utf8");
      //Return the content of the data file in json format
      res.status(200).json({ data: fileContent });
    } catch (error) {
      res.status(404).json({ error: fileName + " not found" });
    }
  } else if (req.method === "POST") {
    const { data } = req.body;
    try {
      const promise = fs.writeFile(filePath, data, "utf-8");
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to write file" });
    }
  }
}
