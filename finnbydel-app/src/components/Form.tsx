import { useState, useMemo } from "react";
import type { FormEvent } from "react";
import fuzzysort from "fuzzysort";
import { api } from "~/utils/api";

import MyComboBox, { StyledItem } from "./MyComboBox";

interface FormProps {
  label?: string;
  cityId: number;
  arrayData: string[] | Fuzzysort.Prepared[];
}
/* TODO: See if Form needs refactoring/decoupling as its quite messy */
export default function Form({ label, cityId, arrayData }: FormProps) {
  // Autocomplete filtering logic
  const [currentInput, setCurrentInput] = useState("");
  const filteredItems = useMemo(
    () =>
      fuzzysort.go(currentInput, arrayData, {
        all: false,
        limit: 10,
        threshold: -10000,
      }),
    [currentInput, arrayData]
  );
  // Form logic
  const addressQuery = api.address.byAddress.useQuery(
    {
      cityId: Number(cityId),
      houseNumber: parseHouseNumber(currentInput),
      streetName: parseStreetName(currentInput),
    },
    {
      enabled: false, // Disable initial query execution
      retry: false, // Disable automatic retry
    }
  );
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Enable the query to execute on form submission
    try {
      if (filteredItems && filteredItems[0]?.score !== 0) {
        throw new Error("Invalid address");
      }
      await addressQuery.refetch();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-2 text-xl"
      >
        <MyComboBox
          items={filteredItems}
          inputValue={currentInput}
          onInputChange={setCurrentInput}
          label={label}
          isRequired
          autoFocus
          className="flex flex-col"
        >
          {(result) => (
            <StyledItem key={result.target}>{result.target}</StyledItem>
          )}
        </MyComboBox>
        {addressQuery.data && (
          <p className="text-4xl">{addressQuery.data.districtName}</p>
        )}
        {addressQuery.error && (
          <p className="text-4xl">{addressQuery.error.message}</p>
        )}
        {addressQuery.isInitialLoading && (
          <p className="text-4xl">Loading...</p>
        )}
      </form>
    </>
  );
}

function parseHouseNumber(addressQuery: string): number {
  const infoArray = addressQuery.trim().split(" ");
  if (infoArray.length >= 2) {
    const houseNumber = Number(infoArray[infoArray.length - 1]);
    if (!isNaN(houseNumber)) {
      return houseNumber;
    }
  }
  return 1;
}

function parseStreetName(addressQuery: string): string {
  const infoArray = addressQuery.trim().split(" ");
  if (infoArray.length >= 2) {
    return infoArray.slice(0, -1).join(" ");
  }
  return addressQuery;
}
