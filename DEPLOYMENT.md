# Vercel deployment (Neon PostgreSQL)

This project deploys from Vercel with `npm run vercel-build`. That command runs
`prisma migrate deploy` before the Next.js production build. It is safe to run
again: Prisma records applied migrations in `_prisma_migrations` and only runs
pending migrations.

## Required Vercel environment variables

Set these in **Project → Settings → Environment Variables** for **Production**.
Add the same database and JWT values to Preview only if preview deployments need
to be functional; use a separate preview database when possible.

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string for the application runtime, including `?sslmode=require`. |
| `DIRECT_URL` | Neon **direct/unpooled** connection string, including `?sslmode=require`; used only by Prisma migrations. |
| `JWT_SECRET` | A unique, cryptographically random secret of at least 32 bytes. Generate one with `openssl rand -base64 48`. |
| `BLOB_READ_WRITE_TOKEN` | Read/write token from the Vercel Blob store used for optional challan-photo uploads. |

`NODE_ENV`, `VERCEL`, deployment URLs, and Vercel system variables are supplied
by Vercel; do not create them manually. No `NEXT_PUBLIC_*` variables are used.

## First production deployment

1. Create a Neon project and database in the region closest to Vercel's
   production region. In Neon’s **Connect** screen, copy both connection
   strings: pooled for `DATABASE_URL`, direct for `DIRECT_URL`.
2. Create a Blob store in Vercel: **Storage → Create → Blob**. Connect it to
   this project; Vercel adds `BLOB_READ_WRITE_TOKEN` automatically. If it does
   not, copy the token shown by the store into the environment-variable screen.
3. Push this directory to a GitHub, GitLab, or Bitbucket repository. Do not
   commit `.env` or any connection string/token.
4. In Vercel, select **Add New → Project**, import the repository, and keep the
   detected framework as **Next.js**. The committed `vercel.json` sets the build
   command to `npm run vercel-build`; no Build Command override is needed.
5. Before clicking Deploy, add the four Production variables above. In Vercel's
   build log, confirm the line `Applying migration` (or `No pending migrations`)
   from `prisma migrate deploy`. This is the first production migration.
6. Open the completed deployment. Seed the initial administrator once from a
   machine that can connect to the production database:

   ```powershell
   $env:DIRECT_URL = "<your Neon direct URL>"
   $env:DATABASE_URL = "<your Neon pooled URL>"
   $env:ADMIN_USERNAME = "<initial admin username>"
   $env:ADMIN_PASSWORD = "<unique long password>"
   npm run db:seed
   ```

   The seed is idempotent and creates the initial administrator. `ADMIN_USERNAME`
   and `ADMIN_PASSWORD` are only needed for this one-off command; do not add
   them to Vercel's project environment variables.
7. Sign in as the administrator, create an active inspector in **Inspectors**,
   then use that inspector account for the smoke test below.

## Supabase alternative

Use the equivalent Supabase connection strings instead: a serverless/pooler
connection for `DATABASE_URL` and the direct database connection for
`DIRECT_URL`. Both must be reachable from Vercel and use TLS. The rest of the
steps are unchanged.

## Production smoke test

1. At `https://<your-production-domain>/login`, sign in as the seeded admin and
   verify the dashboard opens. Create a dedicated, active inspector test user.
2. Log out, sign in as that inspector, and submit one challan with a unique test
   citizen name (for example `Vercel Smoke Test 2026-09-15`). Confirm a
   server-assigned `SPA-…` notice number is returned.
3. Log out and sign in as the admin. Open **Challans** and search for that
   unique citizen name; confirm exactly that test challan appears.
4. Open **Analytics** and confirm the total challan count and the selected
   violation category increase to include the test challan. Analytics polls
   automatically; wait up to 30 seconds or refresh once.
