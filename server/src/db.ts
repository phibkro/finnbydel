import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema.ts";

// Workers D1 binding — the `DB` interface lives on `env` per
// the wrangler.toml [[d1_databases]] entry. Drizzle wraps it.
//
// Per-request construction (no module-level state) because
// Workers re-instantiates the module per request anyway and
// `env` only exists inside the fetch handler.
export function getDb(d1: D1Database) {
	return drizzle(d1, { schema });
}

export { schema };
