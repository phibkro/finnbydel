<!-- generated-by: foundry@v1 -->

# AGENTS.md — project contract

Generated boilerplate from `homelab/foundry/profile-v1` (single source:
homelab/docs/PROJECTS.md, "Project conventions contract"). Hand edits here are
flagged as drift by `conventions-check`; record real divergences in
`.conventions-exceptions` instead.

## Contract

- **Mission state:** `STATE.md` is the single mission-state file. It declares a
  lifecycle — `idea | spec | spec-frozen | build | park | archive` — plus
  Now / Next / Blocked. Agents read it first; keep it current.
- **Agent doc:** this file is THE agent doc. Where a harness wants CLAUDE.md,
  it is a symlink to AGENTS.md. Never a second prose copy.
- **Specs:** design work lives in `docs/specs/`. Lifecycle ≥ spec requires
  that directory to exist.
- **Lifecycle gates:** idea → spec → spec-frozen → build → park → archive, one
  executable gate per transition (defined in the conventions contract).
  spec-frozen additionally requires `Frozen: yes` in STATE.md.
- **Checks:** `just check` is the repository's declared verification gate.
  `just conventions-check` detects convention drift. The project-specific section
  names the exact tools. Both gates must pass before merge.

## PROJECT-SPECIFIC (replace this section)

- Runtime and package manager: Bun root orchestration, Astro frontend in `app/`, Hono/Drizzle API in `server/`, and Alchemy v2 deployment at the root.
- Verification: `just check` builds the app and type-checks the API and deployment program. Each of the three committed lock files remains authoritative for its package root.
- Data: `finnbydel-db` is the retained production D1 database. Do not replace, delete, or copy it into the homelab.
- Public contract: `finnbydel.phibkro.org` calls the read-oriented API at `finnbydel-api.phibkro.org`. The homelab does not build, route, or serve either Worker.
- Deployment: CI deploys stage `production` (`bun run deploy --yes`) after every merge to `main` once the checks pass, while the repository variable `DEPLOYMENTS` is `enabled` (environment `production`, secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`). It deploys only main's head and only when the account's Alchemy state store answers at the installed Alchemy's version, which narrows (not closes) the window in which `--yes` would let Alchemy bootstrap or upgrade the store; Alchemy bumps go to every repository together, by hand (Renovate does not merge them). A change to `alchemy.run.ts`, `server/migrations` or the Alchemy version since the last successful CI deploy stops the deploy until someone reads `bun run plan` and runs the workflow by hand with `infrastructure_reviewed`; migrations then apply to the retained `finnbydel-db`. A local `bun run deploy` still needs operator approval; inspect `bun run plan` first.
