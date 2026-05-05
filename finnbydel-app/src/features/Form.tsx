/**
 * Form — address autocomplete + bydel lookup for one city.
 *
 * Flow:
 *   1. User types an address.
 *   2. Debounced query (250ms) calls `address.search` → list of
 *      Geonorge suggestions filtered to the chosen city.
 *   3. On selection, store the suggestion (with its lat/lon) and
 *      call `bydel.byCoords` to look up the matching bydel polygon.
 *      Skipping `bydel.byAddress` saves a redundant Geonorge call
 *      since the suggestion already carries coords.
 *   4. Display result.
 */

import { useEffect, useState } from "react";
import {
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";

import { api } from "~/utils/api";

type SupportedCity = "Oslo" | "Bergen" | "Trondheim" | "Stavanger";

interface FormProps {
  cityName: SupportedCity;
  className?: string;
}

export default function Form({ cityName, className }: FormProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");
  const [selected, setSelected] = useState<{
    adressetekst: string;
    lat: number;
    lon: number;
  } | null>(null);

  // Debounce input → query (250ms).
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedInput(inputValue), 250);
    return () => clearTimeout(handle);
  }, [inputValue]);

  const suggestionsQuery = api.address.search.useQuery(
    { city: cityName, query: debouncedInput },
    {
      enabled: debouncedInput.trim().length >= 2,
      keepPreviousData: true, // smoother UX while typing
      staleTime: 60_000, // dedupe same prefix within 1min
      retry: false,
    },
  );

  const bydelQuery = api.bydel.byCoords.useQuery(
    selected ? { city: cityName, lat: selected.lat, lon: selected.lon } : { city: cityName, lat: 0, lon: 0 },
    {
      enabled: selected !== null,
      retry: false,
    },
  );

  const items = suggestionsQuery.data ?? [];

  return (
    <div className={className}>
      <ComboBox
        inputValue={inputValue}
        onInputChange={(v) => {
          setInputValue(v);
          // Typing again clears the previous selection.
          if (selected !== null) setSelected(null);
        }}
        onSelectionChange={(key) => {
          if (key === null) return;
          const match = items.find((it) => it.adressetekst === key);
          if (match) {
            setSelected({
              adressetekst: match.adressetekst,
              lat: match.lat,
              lon: match.lon,
            });
            setInputValue(match.adressetekst);
          }
        }}
        items={items.map((it) => ({ ...it, id: it.adressetekst }))}
        allowsCustomValue
        autoFocus
        className="flex flex-col gap-2"
      >
        <Label>Skriv inn adressen:</Label>
        <Input
          className="border-2 border-purple-dark p-1.5 px-4 text-purple-dark hover:border-blue-dark focus-visible:border-4 focus-visible:border-blue-dark focus-visible:p-1 focus-visible:px-3.5 focus-visible:outline-none"
          placeholder="Søk etter adresse"
          autoComplete="street-address"
        />
        <Popover>
          <ListBox className="max-h-72 overflow-auto rounded border-2 border-purple-dark bg-white shadow-lg dark:bg-gray-dark">
            {(item) => (
              <ListBoxItem
                id={item.adressetekst}
                textValue={item.adressetekst}
                className={({ isFocused, isSelected }) =>
                  `cursor-pointer px-4 py-1.5 ${isFocused ? "bg-blue-light dark:bg-gray-darkdark" : ""} ${isSelected ? "font-bold" : ""}`
                }
              >
                <div>{item.adressetekst}</div>
                <div className="text-sm opacity-70">
                  {item.postnummer} {item.poststed}
                </div>
              </ListBoxItem>
            )}
          </ListBox>
        </Popover>
      </ComboBox>

      {/* Result panel */}
      <div className="mt-4">
        {selected && bydelQuery.isLoading && <p className="text-2xl">Slår opp bydel…</p>}
        {selected && bydelQuery.data?.bydel && (
          <p className="text-3xl">
            <span className="opacity-70">{selected.adressetekst} ligger i </span>
            <strong>{bydelQuery.data.bydel}</strong>
          </p>
        )}
        {selected && bydelQuery.data && bydelQuery.data.bydel === null && (
          <p className="text-2xl opacity-70">
            {bydelQuery.data.reason === "no_polygon_match"
              ? `Fant ingen bydel for denne adressen i ${cityName}. Bydelsdata for ${cityName} er kanskje ikke ferdig konfigurert ennå.`
              : "Ukjent feil ved oppslag."}
          </p>
        )}
        {bydelQuery.error && <p className="text-2xl">Feil: {bydelQuery.error.message}</p>}
      </div>
    </div>
  );
}
