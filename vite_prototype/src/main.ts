import { finnBydelMedPostnr } from "./lib/finnBydel.ts";

const app = document.querySelector("#app");

const buttonEl = document.querySelector("#submit_button");
// console.log(buttonEl);
buttonEl?.addEventListener("click", handleSubmit);

function handleSubmit() {
  console.log("submit");
  const userInputEl = <HTMLInputElement>document.querySelector("#postnr");
  const pEl = document.querySelector("#result");
  const inputValue = userInputEl.value;
  console.log(inputValue);
  if (isNaN(inputValue) && pEl) {
    console.error("Only use numbers");
    pEl.textContent = "Only use numbers";
  }
  pEl.textContent = finnBydelMedPostnr(inputValue);
}
