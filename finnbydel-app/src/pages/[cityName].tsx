import { createServerSideHelpers } from "@trpc/react-query/server";
import type {
  InferGetStaticPropsType,
  GetStaticPaths,
  GetStaticPropsContext,
} from "next";
import { prisma } from "~/server/db";
import { appRouter } from "~/server/api/root";
import SuperJSON from "superjson";

import Form from "~/components/Form";
import { api } from "~/utils/api";

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

  await helpers.city.byName.prefetch({
    cityName: name,
  });
  await helpers.address.byCityName.prefetch({
    query: { cityName: name },
    options: {
      take: 100000,
    },
  });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      name,
    },
    revalidate: 1,
  };
}

export default function CityPage(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { name } = props;
  const cityQuery = api.city.byName.useQuery({ cityName: name });

  if (cityQuery.status !== "success") {
    // won't happen since we're using `fallback: "blocking"`
    return <>Loading...</>;
  }
  const { data: cityQueryData } = cityQuery;

  const addressQuery = api.address.byCityName.useQuery({
    query: { cityName: name },
    options: {
      take: 100000,
    },
  });
  if (addressQuery.status !== "success") {
    // won't happen since we're using `fallback: "blocking"`
    return <>Loading...</>;
  }
  const { data: addressQueryData } = addressQuery;

  const arrayData = addressQueryData.map(
    (result) => result.streetName + " " + result.houseNumber.toString()
  );
  return (
    <>
      <h2>{name}</h2>
      <p>{cityQueryData.id}</p>
      <p>{cityQueryData.name}</p>
      <Form
        cityId={cityQueryData?.id}
        label={"Skriv inn addressen:"}
        arrayData={arrayData}
      ></Form>
    </>
  );
}
