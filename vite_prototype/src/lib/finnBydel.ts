import { bydelData, postnrBydelDictionary } from "../data/data";

export function finnBydelMedPostnr(postnr: string) {
  if (Object.keys(postnrBydelDictionary).includes(postnr)) {
    console.log("is valid postnr");
    if (postnrBydelDictionary[postnr].length > 2) {
      console.log("is in trondheim or stavanger");
      return postnrBydelDictionary[postnr];
    }
    console.log("is in oslo or bergen");
    const bydelnr = postnrBydelDictionary[postnr];
    if (postnr[0] === "5") {
      return bydelData.Bergen[Number(bydelnr) - 1];
    }
    return bydelData.Oslo[Number(bydelnr) - 1];
  }
  // NB! postnr not validated, could be user error
  return "uoppgitt";
}
