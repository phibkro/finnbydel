import path from "path";
import { promises as fs } from "fs";

import Form from "~/components/Form";

interface OsloProps {
  arrayData: string[];
}
export default function Oslo({ arrayData }: OsloProps) {
  return (
    <>
      <h2>Oslo</h2>
      <Form
        cityId={2}
        label={"Skriv inn addressen:"}
        arrayData={arrayData}
      ></Form>
    </>
  );
}
export async function getStaticProps() {
  const filePath = path.join(process.cwd(), "public", "Oslo_Adressenavn.tsv");
  const fileData = await fs.readFile(filePath, "utf-8");
  const arrayData = fileData.trim().split("\r\n");
  return { props: { arrayData } };
}
