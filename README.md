# Clutch

Free-entry esports registration. Players sign up, pick a game, enter their roster and claim a slot. The room ID and password show up on the site for registered players only. An admin adds games and runs them from `/admin`. A three.js particle swarm sits behind every page and takes the shape of whatever you are looking at.

Next.js 16 (App Router), Tailwind 4, plain three.js, MongoDB, better-auth, Resend.

## Run it locally

```bash
podman run -d --name clutch-mongo -p 27017:27017 docker.io/library/mongo:8   # first time
podman start clutch-mongo                                                     # after a reboot
cp .env.example .env.local      # then fill BETTER_AUTH_SECRET:  openssl rand -base64 32
npm install
npm run seed                    # four sample games   (npm run seed -- --reset wipes games and registrations)
npm run dev                     # http://localhost:3000
npm test                        # slot-claim race, edit rules, IST time, CSV, redirect guard
```

Use `127.0.0.1` in `MONGODB_URI`, not `localhost`. On Fedora `localhost` is IPv6 and rootless podman resets those connections.

With `RESEND_API_KEY` empty, emails (password reset, email verification) are printed to the dev server's terminal instead of being sent. Copy the link from there.

## Becoming admin

1. Put your email in `ADMIN_EMAILS` (comma separated) and restart.
2. Sign up with that email, open `/admin`, press **Send verification link**, open the link.

Admin needs a listed **and verified** email. Players are never asked to verify, so without this rule anyone could register your address first and get the panel. Everyone else sees a 404 at `/admin`.

## Going live (Vercel + MongoDB Atlas)

| Variable | Value |
|---|---|
| `MONGODB_URI` | Atlas connection string ending in `/clutch`. In Atlas, Network Access must allow `0.0.0.0/0` (Vercel has no fixed IPs) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | The production URL, no trailing slash |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend only delivers to other people from a **domain you have verified** with them. Until then, reset mails reach only your own Resend address |
| `ADMIN_EMAILS` | Your email(s) |

Indexes are created on first use. Run `npm run seed` against Atlas once if you want the sample games.

## Where things are

- `src/lib/tournaments.ts` holds every rule: the atomic slot claim, cancel, edit guards. No Next imports, so `node --test` runs it directly.
- `src/components/scene/` is the swarm. `<SceneStage />` is an empty box the swarm flies into, so CSS decides where the 3D sits at each breakpoint. `<SceneTarget />` sets a page's shape and colour.
- `src/lib/games.ts` has the game presets and the mark paths. The same path draws the DOM icon and the particle shape.
- `scripts/shots.mjs` takes headless Chrome screenshots: `node scripts/shots.mjs /@home --only phone`.

## Known ceilings in v1

- Slot counts refresh by polling every 20 s, not push.
- No waitlist: a full game shows Full.
- The slot claim uses no transaction. A server crash between taking the slot and saving the registration leaks one slot; **Recount slots** on the game's admin page repairs it.
- No payments, brackets, results or image uploads.
