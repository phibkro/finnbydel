import { createServerSideHelpers } from "@trpc/react-query/server";
import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from "next";
import Link from "next/link";
import SuperJSON from "superjson";

import Form from "~/features/Form";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { api } from "~/utils/api";

const SUPPORTED_CITIES = ["Oslo", "Bergen", "Trondheim", "Stavanger"] as const;
type SupportedCity = (typeof SUPPORTED_CITIES)[number];

function isSupportedCity(name: string): name is SupportedCity {
  return (SUPPORTED_CITIES as readonly string[]).includes(name);
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Build pages for every supported city. seed.ts ensures the
  // matching City rows always exist; data hydration via tRPC is
  // pure-server — no per-city prefetch of an Address table since
  // address data comes from Geonorge on demand.
  return {
    paths: SUPPORTED_CITIES.map((cityName) => ({ params: { cityName } })),
    fallback: false,
  };
};

export async function getStaticProps(
  context: GetStaticPropsContext<{ cityName: string }>,
) {
  const cityName = context.params?.cityName ?? "";
  if (!isSupportedCity(cityName)) {
    return { notFound: true };
  }

  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma },
    transformer: SuperJSON,
  });

  await helpers.city.all.prefetch();

  return {
    props: {
      trpcState: helpers.dehydrate(),
      cityName,
    },
  };
}

export default function CityPage(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { cityName } = props;
  const cityQuery = api.city.all.useQuery(undefined, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (!cityQuery.isSuccess) {
    return <>Loading…</>;
  }

  return (
    <>
      <ul className="flex gap-4">
        {cityQuery.data.map((city) => (
          <li
            key={city.id}
            className={`text-3xl ${city.name === cityName ? "text-pink-600" : ""}`}
          >
            <Link href={`/${city.name}`} className="hover:text-blue-dark">
              {city.name}
            </Link>
          </li>
        ))}
      </ul>
      <hr className="w-full border-2" />
      <Form
        cityName={cityName}
        className="flex w-96 max-w-full flex-col items-stretch gap-3 text-xl"
      />
    </>
  );
}
