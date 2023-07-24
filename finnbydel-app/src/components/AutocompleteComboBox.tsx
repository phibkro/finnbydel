import { useMemo, useState } from "react";
import fuzzysort from "fuzzysort";

import MyComboBox, { MyItem } from "~/components/MyComboBox";

interface AutocompleteComboBox {
  arrayData: string[] | Fuzzysort.Prepared[];
}
export default function AutocompleteComboBox({
  arrayData,
}: AutocompleteComboBox) {
  const [filtervalue, setFilterValue] = useState("");
  const filteredItems = useMemo(
    () =>
      fuzzysort.go(filtervalue, arrayData, {
        all: false,
        limit: 10,
        threshold: -10000,
      }),
    [filtervalue, arrayData]
  );
  return (
    <>
      <MyComboBox
        items={filteredItems}
        inputValue={filtervalue}
        onInputChange={setFilterValue}
      >
        {(result) => <MyItem key={result.target}>{result.target}</MyItem>}
      </MyComboBox>
    </>
  );
}
