import React from "react";
import Head from "next/head";
import { api } from "~/utils/api";

import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form/dist/types";

type FormValues = {
  cityId: number;
  addressQuery: string;
};

export default function Home() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  const addressQuery = api.address.byAddress.useQuery(
    {
      cityId: Number(watch("cityId", 1)),
      houseNumber: parseHouseNumber(watch("addressQuery", "1")),
      streetName: parseStreetName(watch("addressQuery", "default query")),
    },
    {
      enabled: false, // Disable initial query execution
      retry: false, // Disable automatic retry
    }
  );

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

  const onSubmit: SubmitHandler<FormValues> = async () => {
    // Enable the query to execute on form submission
    try {
      const result = await addressQuery.refetch();
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Head>
        <title>finnbydel</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4  bg-slate-900 text-white">
        <h1 className="text-5xl">Finn bydelen din</h1>
        <p className="text-3xl">
          Usikker på hvilken bydel du bor i? Lurer du på hvilken bydel en
          adresse tilhører? Søk på adresser her.
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-2 text-xl"
        >
          <label>Hvilken by ligger adressen i?:</label>
          <select {...register("cityId")} className="p-2 text-black">
            <option value="1">Bergen</option>
            <option value="2">Oslo</option>
            <option value="3">Trondheim</option>
            <option value="4">Stavanger</option>
          </select>

          <label>Skriv inn adressen:</label>
          <input
            {...register("addressQuery", { required: true, min: 3, max: 255 })}
            className="p-2 text-black"
          />
        </form>
        {addressQuery.data && <p>{addressQuery.data.districtName}</p>}
        {addressQuery.error && <p>{addressQuery.error.message}</p>}
      </main>
    </>
  );
}
