-- finnbydel D1 schema. Mirrors the original Prisma init verbatim
-- (City + Bydel with composite uniqueness on (cityId, name)). The
-- table names stay PascalCase to match what the Drizzle schema in
-- src/db.ts already declares.

CREATE TABLE IF NOT EXISTS "City" (
  "id"   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT    NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "City_name_key" ON "City" ("name");

CREATE TABLE IF NOT EXISTS "Bydel" (
  "id"           INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name"         TEXT    NOT NULL,
  "cityId"       INTEGER NOT NULL,
  "geometryJson" TEXT    NOT NULL,
  "minLon"       REAL    NOT NULL,
  "minLat"       REAL    NOT NULL,
  "maxLon"       REAL    NOT NULL,
  "maxLat"       REAL    NOT NULL,
  FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Bydel_cityId_name_key" ON "Bydel" ("cityId", "name");
CREATE INDEX        IF NOT EXISTS "Bydel_cityId_idx"      ON "Bydel" ("cityId");
