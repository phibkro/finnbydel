import { Database } from "bun:sqlite";

// Idempotent schema migration. Same shape as drinks/server: the
// data layer is small and stable enough that we ship CREATE TABLE
// statements directly via bun:sqlite rather than carrying drizzle-
// kit + better-sqlite3. Mirrors what `prisma db push` produced
// against the original schema.prisma.

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const path = url.replace(/^file:/, "");

const sqlite = new Database(path);
sqlite.run("PRAGMA journal_mode = WAL;");
sqlite.run("PRAGMA foreign_keys = ON;");

sqlite.run(`
  CREATE TABLE IF NOT EXISTS "City" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
  );
`);
sqlite.run(`
  CREATE UNIQUE INDEX IF NOT EXISTS "City_name_key" ON "City" ("name");
`);

sqlite.run(`
  CREATE TABLE IF NOT EXISTS "Bydel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "cityId" INTEGER NOT NULL,
    "geometryJson" TEXT NOT NULL,
    "minLon" REAL NOT NULL,
    "minLat" REAL NOT NULL,
    "maxLon" REAL NOT NULL,
    "maxLat" REAL NOT NULL,
    FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );
`);
sqlite.run(`
  CREATE UNIQUE INDEX IF NOT EXISTS "Bydel_cityId_name_key" ON "Bydel" ("cityId", "name");
`);
sqlite.run(`
  CREATE INDEX IF NOT EXISTS "Bydel_cityId_idx" ON "Bydel" ("cityId");
`);

sqlite.close();
console.log(`migrated ${path}`);
