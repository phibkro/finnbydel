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
    revalidate: 1,
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-4  bg-slate-900 text-white">
        <h1 className="text-5xl">Finn bydelen din</h1>
        <p className="text-center text-3xl ">
          Usikker på hvilken bydel du bor i? Lurer du på hvilken bydel en
          adresse tilhører? Søk på adresser her.
        </p>
        <p className="text-3xl">Hvilken by ligger adressen i?</p>
        <ul>
          {cityQuery.data.map((result) => (
            <li key={result.id} className="text-3xl">
              <Link href={result.name}>{result.name}</Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
