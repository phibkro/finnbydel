import { finnBydel } from "./lib/finnBydel.js";

const app = document.querySelector('#app');

/* console.log("Testing finnBydel()");

console.log("Testing with 0015 as postnummer");
console.log(finnBydel("0015"));
console.log("Solution: Sentrum");

console.log("Testing with 0581 as postnummer");
console.log(finnBydel("0581"));
console.log("Solution: Bjerke");

console.log("Testing with 7030 as postnummer");
console.log(finnBydel("7030"));
console.log("Solution: Midtbyen");

console.log("Testing with 5134 as postnummer");
console.log(finnBydel("5134"));
console.log("Solution: Åsane"); */

const buttonEl = document.querySelector("#submit_button");
// console.log(buttonEl);
buttonEl.addEventListener("click", handleSubmit);

function handleSubmit() {
  console.log("submit");
  const userInputEl = document.querySelector("#postnr");
  const pEl = document.querySelector("#result");
  const inputValue = userInputEl.value;
  console.log(inputValue);
  if (isNaN(inputValue)) {
    console.error("Only use numbers");
    pEl.textContent = "Only use numbers";
  }
  pEl.textContent = finnBydel(inputValue);
}