# finnbydel

Find which bydel (administrative borough) an address belongs to in
Norwegian cities. Uses [Geonorge](https://geonorge.no) for address
search and per-city open data for bydel polygons.

Live: https://finnbydel.phibkro.org

## Stack

- **Frontend** (`app/`) — Astro static + React islands. Tailwind v4.
  Form uses `react-aria-components` for accessible autocomplete.
- **Backend** (`server/`) — Hono on Bun. Prisma over SQLite for the
  polygon store. zod for input validation. `@turf` for point-in-
  polygon geometry.
- **Build / deploy** — managed by the operator's homelab flake at
  [phibkro/homelab](https://github.com/phibkro/homelab) — see
  `modules/server/finnbydel.nix`.

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
├── server/                  # Hono + Prisma + zod
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts          # bydel polygons from city open data
│   └── src/
│       ├── index.ts         # Hono app + route registration
│       ├── prisma.ts
│       └── lib/
│           ├── cities.ts
│           ├── geonorge.ts  # address search proxy
│           └── lookup.ts    # bbox prefilter + JS PIP
├── flake.nix                # devshell (bun + node + claude-code)
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

# Server
cd server
cp .env.example .env
bun install
bunx prisma generate
bun run migrate      # applies schema, creates dev.db
bun run seed         # populates bydel polygons (from open data)
bun run dev          # → http://127.0.0.1:4001

# App (separate terminal)
cd app
cp .env.example .env  # PUBLIC_API_URL=http://localhost:4001
bun install
bun run dev          # → http://localhost:4321
```

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
