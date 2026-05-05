/**
 * Kartverket attribution per CC BY 4.0 terms — drop into the app
 * footer. Address data and bydel polygons originate from Kartverket /
 * Geonorge or per-city open-data portals (see prisma/seed.ts for
 * specifics); the umbrella attribution below covers the address-side
 * service we hit on every lookup.
 */
export function KartverketAttribution() {
  return (
    <p className="text-sm text-muted-foreground">
      Adresse- og bydelsdata:{" "}
      <a
        href="https://kartverket.no/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        ©Kartverket
      </a>
      {" / "}
      <a
        href="https://kartverket.no/api-and-data/terms-of-use"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        CC BY 4.0
      </a>
    </p>
  );
}
