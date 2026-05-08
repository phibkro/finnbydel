import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

import * as schema from "./schema.ts";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const path = url.replace(/^file:/, "");

const sqlite = new Database(path);
sqlite.run("PRAGMA journal_mode = WAL;");
sqlite.run("PRAGMA foreign_keys = ON;");

export const db = drizzle({ client: sqlite, schema });
export { schema };
