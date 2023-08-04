import { createServerSideHelpers } from "@trpc/react-query/server";
import type {
  InferGetStaticPropsType,
  GetStaticPaths,
  GetStaticPropsContext,
} from "next";
import { prisma } from "~/server/db";
import { appRouter } from "~/server/api/root";
import SuperJSON from "superjson";

import { api } from "~/utils/api";
import Form from "~/components/Form";
import Link from "next/link";

export const getStaticPaths: GetStaticPaths = async () => {
  const cities = await prisma.city.findMany({
    select: { name: true },
  });

  return {
    paths: cities.map((city) => ({
      params: {
        cityName: city.name,
      },
    })),
    fallback: false,
  };
};

export async function getStaticProps(
  context: GetStaticPropsContext<{ cityName: string }>
) {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma },
    transformer: SuperJSON,
  });
  const name = context.params?.cityName as string;

  await helpers.city.all.prefetch();
  await helpers.address.byCityName.prefetch({
    query: { cityName: name },
    options: {
      take: 100000,
    },
  });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      cityName: name,
    },
    revalidate: 1,
  };
}

export default function CityPage(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { cityName } = props;
  /* const cityQuery = api.city.byName.useQuery(
    { cityName: name },
    { refetchOnMount: false, refetchOnWindowFocus: false }
  ); */
  const cityQuery = api.city.all.useQuery(undefined, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (cityQuery.status !== "success") {
    return <>Loading...</>;
  }
  const { data: cityQueryData } = cityQuery;

  const addressQuery = api.address.byCityName.useQuery(
    {
      query: { cityName: cityName },
      options: {
        take: 100000,
      },
    },
    { refetchOnMount: false, refetchOnWindowFocus: false }
  );
  if (addressQuery.status !== "success") {
    return <>Loading...</>;
  }
  const { data: addressQueryData } = addressQuery;

  const arrayData = addressQueryData.map(
    (result) => result.streetName + " " + result.houseNumber.toString()
  );
  const cities = ["Bergen", "Oslo", "Trondheim", "Stavanger"];
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4  bg-slate-900 text-white">
        <h1 className="text-5xl">Finn bydelen din</h1>
        <p className="text-center text-3xl ">
          Usikker på hvilken bydel du bor i? Lurer du på hvilken bydel en
          adresse tilhører? Søk på adresser her.
        </p>
        <p className="text-3xl">Hvilken by ligger adressen i?</p>
        <ul>
          {cities.map((name, id) => (
            <li key={id} className="text-3xl">
              <Link href={name}>{name}</Link>
            </li>
          ))}
        </ul>
        <Form
          cityId={
            cityQueryData.findIndex((element) => element.name === cityName) + 1
          }
          label={"Skriv inn addressen:"}
          arrayData={arrayData}
        ></Form>
      </main>
    </>
  );
}
