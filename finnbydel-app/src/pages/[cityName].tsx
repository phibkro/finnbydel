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

// Generate paths by fetching city names from db
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
  // Have to manually fetch city ids since we use city names for the paths
  const { id } = await prisma.city.findFirstOrThrow({
    where: { name: name },
    select: { id: true },
  });

  // Prefetch on build for SSG
  await helpers.city.all.prefetch();
  await helpers.address.byCityId.prefetch({
    query: { cityId: id },
    options: {
      take: 100000,
    },
  });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      cityName: name,
      cityId: id,
    },
  };
}

export default function CityPage(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { cityId } = props;
  const cityQuery = api.city.all.useQuery(undefined, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const addressQuery = api.address.byCityId.useQuery(
    {
      query: { cityId: cityId },
      options: {
        take: 100000,
      },
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
    }
  );
  if (!cityQuery.isSuccess || !addressQuery.isSuccess) {
    return <>Loading...</>;
  }

  const addressNames = addressQuery.data.map(
    (result) => result.streetName + " " + result.houseNumber.toString()
  );
  return (
    <>
      <ul>
        {cityQuery.data.map((result) => (
          <li
            key={result.id}
            className={`${
              result.id === cityId ? "text-pink-600" : ""
            } text-3xl`}
          >
            <Link href={result.name} className="hover:text-blue-dark">
              {result.name}
            </Link>
          </li>
        ))}
      </ul>
      <hr className="w-full border-2" />
      <Form
        cityId={cityId}
        label={"Skriv inn addressen:"}
        addressNames={addressNames}
        className={"flex flex-col items-center gap-3 text-xl"}
      ></Form>
    </>
  );
}
