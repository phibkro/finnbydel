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
- Deployment: CI deploys stage `production` (`bun run deploy`) after every merge to `main` once the checks pass, when the repository variable `DEPLOYMENTS` is `enabled` (secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, environment `production`). A local `bun run deploy` still needs operator approval; inspect `bun run plan` first. A merged migration in `server/migrations` is applied to the retained `finnbydel-db` on that deploy.
