# finnbydel

Find which bydel (administrative borough) an address belongs to in
Norwegian cities. Uses [Geonorge](https://geonorge.no) for address
search and per-city open data for bydel polygons.

Live: https://finnbydel.phibkro.org

## Stack

- **Frontend** (`app/`) — Astro static + React islands. Tailwind v4.
  Form uses `react-aria-components` for accessible autocomplete.
- **Backend** (`server/`) — Hono and Drizzle on a Cloudflare Worker.
  The polygon store uses the existing D1 database.
- **Build and deploy** — Alchemy owns both Workers, both domains, and D1.
  The homelab does not build or serve this application.

## Layout

```
finnbydel/
├── app/                     # Astro frontend
│   ├── astro.config.mjs
│   ├── src/
│   │   ├── pages/           # /index, /[city], /404
│   │   ├── layouts/Base.astro
│   │   ├── components/
│   │   │   ├── Form.tsx          # client:load island
│   │   │   └── Attribution.astro
│   │   ├── lib/
│   │   │   ├── api.ts            # typed client for the Hono API
│   │   │   └── cities.ts
│   │   └── styles/globals.css
│   └── public/
├── server/                  # Hono Worker API
│   ├── migrations/          # D1 schema
│   └── src/
│       ├── index.ts         # Hono app and route registration
│       ├── db.ts            # D1 and Drizzle boundary
│       ├── schema.ts        # Drizzle schema
│       └── lib/
│           ├── cities.ts
│           ├── geonorge.ts  # Address search proxy
│           └── lookup.ts    # Bounding-box filter and point-in-polygon
├── alchemy.run.ts           # Cloudflare deployment
├── package.json             # Deployment commands
├── flake.nix                # Development shell
└── diagrams/
```

## API

Backend served at `https://finnbydel-api.phibkro.org` (CORS open;
public, read-only).

| Method | Path                                    | Description |
|---|---|---|
| GET    | `/api/cities`                           | Cities with at least one seeded bydel polygon |
| GET    | `/api/cities/:city/bydeler`             | List bydeler in a given city |
| GET    | `/api/cities/:city/addresses?q=<query>` | Geonorge autocomplete proxy |
| POST   | `/api/cities/:city/lookup`              | `{ lat, lon }` or `{ address }` → bydel polygon match |

## Local dev

```sh
nix develop          # bun + node + tooling

# Install each locked package.
bun install --frozen-lockfile
bun install --cwd app --frozen-lockfile
bun install --cwd server --frozen-lockfile

# Start the complete local Cloudflare stack.
bun run dev

# Run the repository checks.
bun run check

# Create a production plan without applying it.
bun run plan
```

## Production deployment

Production changes require operator approval and a Cloudflare profile with
Worker and D1 access. CI checks the repository but does not deploy it.

The first plan can bootstrap or upgrade the shared `alchemy-state-store` Worker.
That is a provider mutation and is part of the required approval.

```sh
bun install --frozen-lockfile
bun run check
bun run plan
bun run deploy
```

Inspect the plan before deployment. It must adopt and retain `finnbydel-db`.
It must not replace or delete the database.

The Cloudflare cutover completed on September 22, 2026.
The application and API now deploy from this repository.
No homelab runtime or current Pages attachment is part of the release path.

## Rollback

Use a clean worktree at the last known-good revision. Install its lock files,
run its checks, inspect `bun run plan`, and run `bun run deploy` only after
operator approval. Verify both public domains, address search, and a D1-backed
borough lookup.

Do not delete or recreate `finnbydel-db`, and do not use `alchemy destroy` as a
rollback command. The former Pages deployment is cutover history, not the
default rollback target.

## Migration history

Originally a T3 stack (Next.js 13 Pages Router + tRPC + Tailwind v3).
Migrated to Astro + Hono in 2026 to drop the Next.js release-cadence
treadmill and consolidate on a static-frontend + REST-backend shape
that matches the operator's other portfolio apps. tRPC's value-add
was end-to-end type sharing; that's now provided by the typed `api`
client in `app/src/lib/api.ts` plus zod schemas mirrored on both
sides.

Previous data architecture (bulk-mirrored Address table) was already
gone before this migration — the lookup runs on-demand against
Geonorge's open APIs.

## Attribution

Address data + bydel polygons: ©Kartverket / Geonorge — CC BY 4.0.
