import { oslo, bergen } from "./rawBydelnrData.js";
function stringTabStringNewlineToJSON(text) {
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
    jsonObject += text[i];
  }
  jsonObject += '"}';
  return jsonObject;
}
console.log(stringTabStringNewlineToJSON(bergen));
