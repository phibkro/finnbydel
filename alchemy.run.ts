import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
const state =
  process.env.ALCHEMY_STAGE === "development"
    ? Alchemy.localState()
    : Cloudflare.state();


export default Alchemy.Stack(
  "finnbydel",
  {
    providers: Cloudflare.providers(),
    state,
  },
  Effect.gen(function* () {
    const database = yield* Cloudflare.D1.Database("Database", {
      name: "finnbydel-db",
      migrations: "./server/migrations",
    }).pipe(
      Alchemy.RemovalPolicy.retain(),
      Alchemy.AdoptPolicy.adopt(true),
    );

    const api = yield* Cloudflare.Worker("Api", {
      name: "finnbydel-server",
      main: "./server/src/index.ts",
      env: { DB: database },
      workersDev: false,
      dev: {
        port: 4001,
        strictPort: true,
      },
      domain: "finnbydel-api.phibkro.org",
      compatibility: {
        date: "2026-05-01",
        flags: ["nodejs_compat"],
      },
      observability: {
        enabled: true,
      },
    }).pipe(Alchemy.AdoptPolicy.adopt(true));

    const site = yield* Cloudflare.Website.StaticSite("Site", {
      name: "finnbydel-app",
      cwd: "app",
      command: "bun run build",
      outdir: "dist",
      env: {
        PUBLIC_API_URL: "https://finnbydel-api.phibkro.org",
      },
      domain: "finnbydel.phibkro.org",
      workersDev: false,
      assets: {
        notFoundHandling: "404-page",
      },
      dev: {
        command: "bun run dev",
        env: {
          NODE_ENV: "development",
          PUBLIC_API_URL: "http://localhost:4001",
        },
        url: "http://localhost:4321",
      },
    });

    return { api, database, site };
  }),
);

export const meta = {
  Database: {
    commands: {
      seed: "cd server && bun run seed",
    },
    persistence: "Cloudflare D1 with point-in-time recovery",
  },
  Api: {
    commands: {
      typecheck: "bun run server:typecheck",
    },
    runtime: "Cloudflare Worker with Hono and Drizzle",
    trust: {
      input: "untrusted-public",
      validate: "Zod schemas and route parameters",
    },
  },
  Site: {
    commands: {
      build: "bun run app:build",
      dev: "bun run dev",
    },
    runtime: "Cloudflare Worker static assets",
    trust: {
      input: "client",
    },
  },
} as const;
