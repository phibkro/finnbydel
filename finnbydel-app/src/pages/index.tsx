import Link from "next/link";

export default function Home() {
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
      </main>
    </>
  );
}
