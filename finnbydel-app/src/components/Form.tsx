import { useState, useMemo } from "react";
import fuzzysort from "fuzzysort";
import { api } from "~/utils/api";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form/dist/types";

import MyComboBox, { MyItem } from "./MyComboBox";

type FormValues = {
  cityId: number;
  addressQuery: string;
};

interface FormProps {
  label?: string;
  cityId: number;
  arrayData: string[] | Fuzzysort.Prepared[];
}
/* TODO: See if Form needs refactoring/decoupling as its quite messy */
export default function Form({ label, cityId, arrayData }: FormProps) {
  // Autocomplete filtering logic
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
  // Form logic
  const { handleSubmit } = useForm<FormValues>();
  const addressQuery = api.address.byAddress.useQuery(
    {
      cityId: Number(cityId),
      houseNumber: parseHouseNumber(filtervalue),
      streetName: parseStreetName(filtervalue),
    },
    {
      enabled: false, // Disable initial query execution
      retry: false, // Disable automatic retry
    }
  );
  const onSubmit: SubmitHandler<FormValues> = async () => {
    // Enable the query to execute on form submission
    try {
      if (filteredItems[0]?.score !== 0) {
        throw new Error("Invalid address");
      }
      const result = await addressQuery.refetch();
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="flex flex-col gap-2 text-xl"
      >
        <MyComboBox
          /* TODO: Fix typescript error */
          items={filteredItems}
          inputValue={filtervalue}
          onInputChange={setFilterValue}
          label={label}
        >
          {(result) => <MyItem key={result.target}>{result.target}</MyItem>}
        </MyComboBox>
      </form>
      {addressQuery.data && (
        <p className="text-4xl">{addressQuery.data.districtName}</p>
      )}
      {addressQuery.error && (
        <p className="text-4xl">{addressQuery.error.message}</p>
      )}
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
