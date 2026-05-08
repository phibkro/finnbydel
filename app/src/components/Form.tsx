/**
 * Form — address autocomplete + bydel lookup for one city.
 *
 * Flow:
 *   1. User types an address.
 *   2. Debounced fetch (250ms) hits /api/cities/:city/addresses?q=… —
 *      returns Geonorge suggestions filtered to the chosen city.
 *   3. On selection, store the suggestion (with its lat/lon) and
 *      POST /api/cities/:city/lookup { lat, lon } to resolve the
 *      bydel polygon. Skips the redundant geocode call since the
 *      suggestion already carries coords.
 *   4. Display result.
 *
 * React island in an otherwise-static Astro page. State stays
 * client-side (no SSR rehydration of fetched suggestions).
 */

import { useEffect, useState } from "react";
import {
  ComboBox,
  Input,
  ListBoxItem,
  Label,
  ListBox,
  Popover,
} from "react-aria-components";

import { api, type LookupResult, type Suggestion } from "@/lib/api";
import type { SupportedCity } from "@/lib/cities";

type Row = Suggestion & { id: string };

interface FormProps {
  cityName: SupportedCity;
  className?: string;
}

export default function Form({ cityName, className }: FormProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");

  const [suggestions, setSuggestions] = useState<Row[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Debounce input → query (250ms). Drops in-flight requests when
  // input changes — Geonorge is fast enough that we don't bother
  // with AbortController on top.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedInput(inputValue), 250);
    return () => clearTimeout(handle);
  }, [inputValue]);

  useEffect(() => {
    const trimmed = debouncedInput.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    api
      .searchAddresses(cityName, trimmed)
      .then((data) => {
        if (cancelled) return;
        setSuggestions(data.map((s) => ({ ...s, id: s.adressetekst })));
        setSearchError(null);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setSearchError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [cityName, debouncedInput]);

  // Resolve bydel as soon as a suggestion is picked.
  useEffect(() => {
    if (!selected) {
      setLookup(null);
      setLookupError(null);
      return;
    }
    let cancelled = false;
    setLookupLoading(true);
    setLookupError(null);
    api
      .lookupByCoords(cityName, selected.lat, selected.lon)
      .then((data) => {
        if (!cancelled) setLookup(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setLookupError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLookupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cityName, selected]);

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
          const match = suggestions.find((it) => it.adressetekst === key);
          if (match) {
            setSelected(match);
            setInputValue(match.adressetekst);
          }
        }}
        items={suggestions}
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
          <ListBox<Row>
            items={suggestions}
            className="max-h-72 overflow-auto rounded border-2 border-purple-dark bg-white shadow-lg dark:bg-gray-dark"
          >
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

      {searchError && (
        <p className="mt-2 text-sm text-red-600">Søkefeil: {searchError}</p>
      )}

      <div className="mt-4">
        {selected && lookupLoading && (
          <p className="text-2xl">Slår opp bydel…</p>
        )}
        {selected && lookup?.bydel && (
          <p className="text-3xl">
            <span className="opacity-70">{selected.adressetekst} ligger i </span>
            <strong>{lookup.bydel}</strong>
          </p>
        )}
        {selected && lookup && lookup.bydel === null && (
          <p className="text-2xl opacity-70">
            {lookup.reason === "no_polygon_match"
              ? `Fant ingen bydel for denne adressen i ${cityName}. Bydelsdata for ${cityName} er kanskje ikke ferdig konfigurert ennå.`
              : "Adressen ble ikke funnet."}
          </p>
        )}
        {lookupError && (
          <p className="text-2xl">Feil: {lookupError}</p>
        )}
      </div>
    </div>
  );
}
