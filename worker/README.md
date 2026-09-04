# Pickup scheduler Worker

This Worker is the private service behind the Backyard pickup-scheduler widget. The static Astro site never contains the shared passphrase, session secret, names, availability, comments, or activity records.

## What it provides

- Passphrase + name login with a signed `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- Seven-day scheduling data beginning on the current New York day, at 30-minute resolution from 12:00 through 20:00.
- Per-slot ball availability, confirmed activity cards with separate RSVP totals (going / bringing a ball), participant lookup, and comments that expire after 7 days.
- A scheduled weather refresh at five minutes past each hour. It stores Central Park's hourly temperature and weather code in D1.

## Local setup

1. Install the Worker dependencies: `pnpm install` from this directory.
2. Copy `.dev.vars.example` to `.dev.vars` and replace both secrets. Keep `.dev.vars` private.
3. Apply the local schema: `pnpm db:local`.
4. Start the Worker: `pnpm dev`.

The Worker starts on `http://localhost:8787` by default. Use `http://localhost:8787/cdn-cgi/local/scheduled` to invoke its hourly weather refresh locally.

## Deploy once

1. Run `pnpm wrangler d1 create pickup-scheduler` and replace the placeholder `database_id` in `wrangler.jsonc` with the returned ID.
2. Set production values with:
   - `pnpm wrangler secret put SCHEDULER_PASSWORD`
   - `pnpm wrangler secret put SESSION_SECRET`
   - `pnpm wrangler secret put ALLOWED_ORIGIN`
3. Apply migrations: `pnpm db:remote`.
4. Deploy: `pnpm deploy`.
5. Attach the Worker to an API hostname such as `schedule-api.your-domain.example`, then set that origin in the Astro component.

## Astro connection

Set `PUBLIC_PICKUP_API_BASE` to the Worker origin when building the Astro site, for example
`https://schedule-api.your-domain.example`. In local development the scheduler defaults to
`http://localhost:8787`. The browser reads public weather from `/api/pickup/v1/schedule`, then
uses authenticated endpoints for availability, participant lookup, activities, RSVPs, and
comments. It never calls Open-Meteo directly.

Before the service is shared widely, add a Cloudflare dashboard rate-limiting rule for `POST /api/pickup/v1/login` so automated passphrase guessing is stopped at the edge without locking out ordinary people.
