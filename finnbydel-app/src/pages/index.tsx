import { createServerSideHelpers } from "@trpc/react-query/server";
import Link from "next/link";
import SuperJSON from "superjson";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { api } from "~/utils/api";

export async function getStaticProps() {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma },
    transformer: SuperJSON,
  });

  // Prefetch on build for SSG
  await helpers.city.all.prefetch();

  return {
    props: {
      trpcState: helpers.dehydrate(),
    },
  };
}

export default function Home() {
  const cityQuery = api.city.all.useQuery(undefined, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  if (!cityQuery.isSuccess) {
    return <>Loading...</>;
  }
  return (
    <>
      <ul>
        {cityQuery.data.map((result) => (
          <li key={result.id} className={`text-3xl`}>
            <Link href={result.name} className="hover:text-blue-dark">
              {result.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
