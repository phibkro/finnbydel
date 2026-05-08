import Head from "next/head";
import React from "react";

import { KartverketAttribution } from "~/components/Attribution";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const title = "finnbydel — Finn bydelen din";
  const description =
    "Slå opp hvilken bydel en adresse tilhører i Oslo og Bergen. Bygget med kartdata fra Kartverket og Geonorge.";
  const url = "https://finnbydel.phibkro.org/";
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="sitemap" href="/sitemap.xml" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Philip Bjørknes Krogh" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="nb_NO" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-purple-dark dark:bg-black-kinda dark:text-white">
        <h1 className="text-5xl">Finn bydelen din</h1>
        <p className="text-center text-3xl">
          Usikker på hvilken bydel du bor i? Lurer du på hvilken bydel en
          adresse tilhører? Søk på adresser her.
        </p>
        <div className="flex flex-col items-center gap-2 bg-gray-light pb-5 dark:bg-gray-dark">
          <h2 className="bg-blue-light p-2 text-3xl dark:bg-gray-darkdark">
            Hvilken by ligger adressen i?
          </h2>
          {children}
        </div>
        <footer className="mt-auto pb-4 pt-8 text-center">
          <KartverketAttribution />
        </footer>
      </main>
    </>
  );
}
