import { useState, useMemo } from "react";
import type { FormEvent } from "react";
import fuzzysort from "fuzzysort";
import { api } from "~/utils/api";

import {
  ComboBox,
  Input,
  Item,
  Label,
  ListBox,
  Popover,
} from "react-aria-components";

interface FormProps {
  label?: string;
  className: string;
  cityId: number;
  items: {
    id: number;
    streetName: string;
    houseNumber: number;
    districtName: string;
    cityId: number;
  }[];
}
/* TODO: See if Form needs refactoring/decoupling as its quite messy */
export default function Form({ label, cityId, items, className }: FormProps) {
  // Autocomplete filtering logic
  const [currentInput, setCurrentInput] = useState("");
  const scoredItems = useMemo(
    () =>
      fuzzysort.go(
        currentInput,
        items.map((item) => {
          // Merge streetname and housenumber for filtering
          return [item.streetName, item.houseNumber].join(" ");
        }),
        {
          all: false,
          limit: 10,
          threshold: -10000,
        }
      ),
    [currentInput, items]
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
      // Only send request if there is a response
      if (scoredItems && scoredItems[0]?.score !== 0) {
        console.log(scoredItems);
        throw new Error("Invalid address");
      }
      await addressQuery.refetch();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <form onSubmit={(e) => void handleSubmit(e)} className={className}>
        <ComboBox
          // Omitting items makes autocomplete turn on and off while typing
          items={scoredItems}
          inputValue={currentInput}
          onInputChange={setCurrentInput}
          isRequired
          autoFocus
          className="flex flex-col gap-2"
          allowsCustomValue={true}
        >
          <Label>{label}</Label>
          <Input
            className="border-2 border-purple-dark p-1.5 px-4 text-purple-dark hover:border-blue-dark focus-visible:border-4 focus-visible:border-blue-dark focus-visible:p-1 focus-visible:px-3.5  focus-visible:outline-none"
            placeholder="Søk etter addresse"
            autoComplete="street-address"
          />
          {addressQuery.data && (
            <p className="text-4xl">{addressQuery.data.districtName}</p>
          )}
          {addressQuery.error && (
            <p className="text-4xl">{addressQuery.error.message}</p>
          )}
          {addressQuery.isInitialLoading && (
            <p className="text-4xl">Loading...</p>
          )}
          <Popover>
            <ListBox
              // Reiterate the items definition to appease the typescript gods
              items={scoredItems}
            >
              {(result) => (
                <Item
                  key={result.target}
                  className={({ isFocused, isSelected }) =>
                    `${isFocused ? "focused" : "bg-red-500 px-4"} ${
                      isSelected ? "selected" : "bg-green-500"
                    }`
                  }
                >
                  {result.target}
                </Item>
              )}
            </ListBox>
          </Popover>
        </ComboBox>
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
