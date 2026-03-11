## Cursor Cloud specific instructions

This is a **Next.js 15** analytics dashboard ("Cursor Dashboard" / "Pulse") deployed on **Cloudflare Workers** via OpenNext.js. It tracks team Cursor AI usage with leaderboards, achievements, and an AI chat assistant.

### Tech stack

- **Runtime**: Next.js 15.5 + React 19, Turbopack dev server
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM, emulated locally by Wrangler/Miniflare
- **Cache**: Cloudflare KV (emulated locally)
- **Auth**: Better Auth with Google OAuth (`@shiwaforce.com` domain)
- **AI Chat**: Vercel AI SDK + OpenAI (`gpt-4o`)
- **Package manager**: npm (lockfile: `package-lock.json`)

### Running locally

Standard commands from `package.json`:

- `npm run dev` — starts dev server on http://localhost:3000 (Turbopack)
- `npm run lint` — ESLint
- `npm run build` — production build
- `npm run db:migrate:local` — apply D1 migrations to local emulated database
- `npm run db:studio` — Drizzle Studio for DB inspection

### Environment variables

Secrets live in `.dev.vars` (Wrangler convention, not `.env`). Required keys: `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CRON_SECRET`, `CURSOR_ADMIN_API_KEY`. Optional: `OPENAI_API_KEY` (for chat feature).

### Populating the local database

The local D1 database starts empty. To populate it with real team data, trigger the cron sync endpoint after the dev server is running:

```
curl "http://localhost:3000/api/cron/sync" -H "Authorization: Bearer $CRON_SECRET"
```

This fetches usage data from the Cursor Admin API and computes achievements. It takes ~7 seconds and returns a JSON response with the number of processed records.

### Gotchas

- The local D1 database is created automatically by Wrangler under `.wrangler/` when you run `npm run dev`. You must run `npm run db:migrate:local` at least once before the app can query any tables.
- `initOpenNextCloudflareForDev()` in `next.config.ts` initializes local Cloudflare bindings (D1, KV) automatically during `npm run dev`. No separate wrangler process is needed.
- The app renders all pages without real API credentials; pages show "No data available" empty states. Authentication and data sync require valid secrets.
- Database schema is in `src/db/schema.ts` and `src/db/auth-schema.ts`. Migrations are in `src/db/migrations/`.
- When killing the dev server, you may need to kill the underlying `next-server` child process separately (check with `netstat -tlnp | grep 3000`) since the parent npm process may exit before the child.
