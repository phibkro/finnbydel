import { composeDictionaryFromMulticolumnTSV } from "./composeDictionary";

const destination = "../data/adresseBydel.ts";
const text = await Deno.readTextFile("../data/postnr_adresse_bydel.tsv");
await Deno.writeTextFile(
  destination,
  "export const adresseBydel = " + composeDictionaryFromMulticolumnTSV(text, 3)
);
console.log(`File written to ${destination}`);
