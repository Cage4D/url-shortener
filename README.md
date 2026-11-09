# Shortcut

A single-page URL shortener. Paste a long link, get a short one, copy it. No accounts.

Built with Next.js (App Router), TypeScript, PostgreSQL + Prisma, Zod and Vitest.

## Setup

You need Node.js 20.19+ (22 or 24 recommended) and PostgreSQL 14+.

1. Install dependencies. This also generates the Prisma client.

   ```bash
   npm install
   ```

2. Copy the example env file and fill it in.

   ```bash
   cp .env.example .env
   ```

   | Variable | What it is |
   |---|---|
   | `DATABASE_URL` | Postgres connection string, e.g. `postgresql://user:password@host:5432/shortcut` |
   | `NEXT_PUBLIC_SHORT_DOMAIN` | Domain shown in short links, without scheme. `localhost:3000` in dev. |
   | `NEXT_PUBLIC_SOURCE_URL` | Link for the "Source" button in the header. |

3. Create the database if it doesn't exist, then apply the migrations.

   ```bash
   createdb -h <host> -U <user> shortcut
   npm run db:deploy
   ```

   Use `npm run db:migrate` instead when you're changing `prisma/schema.prisma`; it creates a new
   migration from your changes.

4. Start the dev server and open http://localhost:3000.

   ```bash
   npm run dev
   ```

### Postgres on Windows, app in WSL

From inside WSL, Windows is reachable at the `default via` address of `ip route show`:

```bash
ip route show | awk '/default/ {print $3}'
```

Use that IP as the host in `DATABASE_URL`. Postgres on Windows has to accept the connection:
set `listen_addresses = '*'` in `postgresql.conf`, add a line for the WSL subnet to `pg_hba.conf`
(for example `host all all 172.16.0.0/12 scram-sha-256`), restart the service, and allow port
5432 through Windows Firewall. The WSL IP can change after a reboot.

## Deploying to Vercel

The app is set up for Vercel with a Neon Postgres database from the Vercel Marketplace.

1. Import the repository as a Vercel project.
2. Add a Neon database (Storage → Neon) and connect it to the project. This sets
   `DATABASE_URL` (pooled, used by the app) and `DATABASE_URL_UNPOOLED` (direct, used for
   migrations).
3. Set `NEXT_PUBLIC_SHORT_DOMAIN` to the production domain (e.g. `your-app.vercel.app`) and
   `NEXT_PUBLIC_SOURCE_URL` to the repository link.
4. Deploy. The `vercel-build` script runs `prisma migrate deploy` before `next build`, so
   pending migrations are applied on every deploy.

Preview deployments share the production database unless you enable Neon branching for them.
The rate limit is counted per serverless instance, so it's looser on Vercel than on one server.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates route types, then runs `tsc` |
| `npm test` | Unit tests (Vitest) |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply pending migrations (CI, production) |
| `npm run vercel-build` | Migrations, then the production build (used by Vercel) |

## How it works

- **Creating links:** `POST /api/links` with `{ url, alias? }`. The URL and alias rules live in
  `lib/links/rules.ts` and are shared by the form and the API, so both give the same messages.
  The API is the final word.
- **Short codes** are 7 characters from an alphabet without look-alikes (`0 O 1 l I`), made with
  `crypto.randomInt`. The unique index on `slug_key` (the lower-cased slug) is the real
  guarantee: on a collision we retry, up to five times.
- **Redirects** are handled in `proxy.ts`. A known slug gets a `302` and its click count goes up
  (`HEAD` requests aren't counted). Anything else falls through to the app's 404 page.
- **Rate limit:** 20 links per minute per IP, counted in memory. It resets when the server
  restarts and isn't shared between instances.
- **Recent links** are kept in `localStorage` under `shortcut:recent` (the newest five).

### API

```
POST /api/links   { "url": "example.com/page", "alias": "my-link" }

201  { "slug", "shortUrl", "longUrl", "createdAt" }
400  { "error": { "field": "url" | "alias", "message" } }
409  alias taken, same shape with field "alias"
429  too many requests (Retry-After header)
```

`message` is written for people and can be shown as is.

## Project layout

```
app/                 pages, API route, 404, fonts, global styles
components/          stage, hero carve, card, background, header/footer
lib/links/           validation rules, messages, slug generator, create logic
lib/contours.ts      topographic background generator
lib/hero.ts          hero and carve geometry
prisma/              schema and migrations
proxy.ts             short-link redirects
```
