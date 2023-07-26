import path from "path";
import { promises as fs } from "fs";

import Form from "~/components/Form";

interface StavangerProps {
  arrayData: string[];
}
export default function Stavanger({ arrayData }: StavangerProps) {
  return (
    <>
      <h2>Stavanger</h2>
      <Form
        cityId={4}
        label={"Skriv inn addressen:"}
        arrayData={arrayData}
      ></Form>
    </>
  );
}
export async function getStaticProps() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "Stavanger_Adressenavn.tsv"
    );
    const fileData = await fs.readFile(filePath, "utf-8");
    const arrayData = fileData.trim().split("\r\n");
    return { props: { arrayData } };
  } catch (error) {
    console.error(error);
  }
}
