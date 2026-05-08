import { sql } from "drizzle-orm";
import {
	index,
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Schema mirrors the live SQLite at /var/lib/finnbydel/db.sqlite
// originally created by `prisma db push`. PascalCase table names
// from Prisma's default mapping preserved verbatim so the existing
// data stays valid against this schema (the migrate.ts CREATE
// TABLE IF NOT EXISTS is a no-op on existing deploys).

export const cities = sqliteTable("City", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
});

export const bydeler = sqliteTable(
	"Bydel",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		name: text("name").notNull(),
		cityId: integer("cityId")
			.notNull()
			.references(() => cities.id),
		geometryJson: text("geometryJson").notNull(),
		minLon: real("minLon").notNull(),
		minLat: real("minLat").notNull(),
		maxLon: real("maxLon").notNull(),
		maxLat: real("maxLat").notNull(),
	},
	(t) => [
		uniqueIndex("Bydel_cityId_name_key").on(t.cityId, t.name),
		index("Bydel_cityId_idx").on(t.cityId),
	],
);

export { sql };
