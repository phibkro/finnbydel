import path from "path";
import { promises as fs } from "fs";

import Form from "~/components/Form";

interface BergenProps {
  arrayData: string[];
}
export default function Bergen({ arrayData }: BergenProps) {
  return (
    <>
      <h2>Bergen</h2>
      <Form
        cityId={1}
        label={"Skriv inn addressen:"}
        arrayData={arrayData}
      ></Form>
    </>
  );
}
export async function getStaticProps() {
  const filePath = path.join(
    process.cwd(),
    "private",
    "Bergen_Adressenavn.tsv"
  );
  const fileData = await fs.readFile(filePath, "utf-8");
  const arrayData = fileData.trim().split("\r\n");
  return { props: { arrayData } };
}
