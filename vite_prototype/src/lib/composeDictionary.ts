import { oslo, bergen, trondheim, stavanger } from "../data/rawPostnrData.ts";

export function composeDictionaryFromTSV(text: string) {
  return text.replace(/\t/g, ":").replace(/\n/g, ",").replace(/  /g, "");

  let jsonObject = '{"';
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\t" || text[i] === "  ") {
      jsonObject += '":"';
      continue;
    }
    if (text[i] === "\n") {
      jsonObject += '","';
      continue;
    }
    if (text[i] === " ") {
      continue;
    }
    jsonObject += text[i];
  }
  jsonObject += '"}';
  return jsonObject;
}

console.log(composeDictionaryFromTSV(oslo));
// console.log(composeDictionaryFromTSV(bergen));
// console.log(composeDictionaryFromTSV(trondheim));
// console.log(composeDictionaryFromTSV(stavanger));

