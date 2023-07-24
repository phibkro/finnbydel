import { api } from "~/utils/api";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form/dist/types";

import { Input, Label } from "react-aria-components";

type FormValues = {
  cityId: number;
  addressQuery: string;
};

interface FormProps {
  cityId: number;
}
export default function Form({ cityId }: FormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  const addressQuery = api.address.byAddress.useQuery(
    {
      cityId: Number(cityId),
      houseNumber: parseHouseNumber(watch("addressQuery", "1")),
      streetName: parseStreetName(watch("addressQuery", "default query")),
    },
    {
      enabled: false, // Disable initial query execution
      retry: false, // Disable automatic retry
    }
  );

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
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="flex flex-col gap-2 text-xl"
      >
        <Label>Skriv inn adressen:</Label>
        <Input
          {...register("addressQuery", { required: true, min: 3, max: 255 })}
          aria-invalid={errors.addressQuery ? "true" : "false"}
          className="p-2 text-black"
        />
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
