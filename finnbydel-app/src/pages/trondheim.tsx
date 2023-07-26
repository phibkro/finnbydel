import path from "path";
import { promises as fs } from "fs";

import Form from "~/components/Form";

interface TrondheimProps {
  arrayData: string[];
}
export default function Trondheim({ arrayData }: TrondheimProps) {
  return (
    <>
      <h2>Trondheim</h2>
      <Form
        cityId={3}
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
      "Trondheim_Adressenavn.tsv"
    );
    const fileData = await fs.readFile(filePath, "utf-8");
    const arrayData = fileData.trim().split("\r\n");
    return { props: { arrayData } };
  } catch (error) {
    console.error(error);
  }
}
