# Deploy Finnbydel at the Cloudflare edge

Frozen: yes
Status: deployed and accepted on 2026-09-22. The homelab runtime retired after production acceptance.

Revision: 2026-09-22. The existing D1 database is retained if its deployment
declaration is removed. Local development uses only local Worker and D1
instances. Production Workers expose only their custom domains.


## Goal

Serve the Finnbydel application and API from Cloudflare without a home-server dependency.
Keep the public data in the existing D1 database.

## Contract

- `finnbydel.phibkro.org` serves the Astro site as Worker static assets.
- `finnbydel-api.phibkro.org` serves the Hono API from a Worker.
- The API uses the existing `finnbydel-db` D1 database.
- The browser sends API requests only to `finnbydel-api.phibkro.org`.
- The API remains public and read-only for its stored data.
- Alchemy owns the Worker, asset, domain, and D1 deployment resources.
- Local commands use the `development` stage. Plan and deploy commands use the `production` stage.
- Removing or renaming the deployment declaration must not delete `finnbydel-db`.
- The application and API Workers disable their `workers.dev` routes.
- `bun run dev` connects the local application to the local API Worker.
- The repository owns its source, build, release, and rollback procedures.
- The homelab removes its Finnbydel runtime only after production acceptance.

## Constraints

- Do not copy D1 data into the homelab.
- Do not create a local MicroVM.
- Do not change the public routes or API shapes.
- Do not deploy from CI in this change.
- Do not replace Astro, Hono, Drizzle, or D1.

## Acceptance

1. Install dependencies from the committed lock files.
2. Run the Astro build and Worker type check.
3. Run the existing repository checks.
4. With operator approval, bootstrap or upgrade the Alchemy state store if required, then inspect the plan without deploying service resources.
5. Make sure that the plan adopts and retains `finnbydel-db`.
6. Make sure that local development uses the local API and D1 database.
7. Make sure that the Worker resources disable their `workers.dev` routes.
8. Make sure that the site uses the production API domain.
9. Transfer the application hostname from Pages to the Worker in a controlled cutover.
10. Make sure that address search and borough lookup work in production.
11. Make sure that the API reads the existing D1 data.
12. Make sure that rollback can restore the previous Cloudflare deployment.

Steps 4 and 9 through 12 require operator-approved provider changes.
