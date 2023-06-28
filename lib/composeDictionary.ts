export function composeDictionaryFromTSV(tsv: string) {
  return tsv.replace(/\t/g, ":").replace(/\n/g, ",").replace(/  /g, "");
}

/* export function composeDictionaryFromMulticolumnTSV(tsv: string) {
  return tsv.replace(/\t(?=\S+(?:\r))/g, ":").replace(/\n/g, ",");
} */

export function composeDictionaryFromMulticolumnTSV(
  tsv: string,
  whenToSplitColumn: number
) {
  let newText = '{"';
  let count = 0;
  for (let i = 0; i < tsv.length; i++) {
    switch (tsv[i]) {
      case "\t":
        count++;
        if (count === whenToSplitColumn) {
          count = 0;
          newText += '":`';
        } else {
          newText += ",";
        }
        break;
      case " ":
        break;
      case "\n":
        newText += '`,"';
        break;
      default:
        newText += tsv[i];
        break;
    }
  }
  return newText + "`}";
}
