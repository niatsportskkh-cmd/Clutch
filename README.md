# Clutch

Free-entry inter-college contests. An admin loads the colleges and the student roster; a student signs up only if their college ID and mobile number are both on it. Contests are opened to a set of colleges, and only those students see them. A captain registers a team by typing college IDs — names and numbers come from the roster, and everyone on a team must be from the captain's own college. There is no slot cap: any number of teams may enter. Every teammate sees the team on their own account. Admins run it all from `/admin`. A three.js particle swarm sits behind every page and takes the shape of whatever you are looking at.

Next.js 16 (App Router), Tailwind 4, plain three.js, MongoDB, better-auth, Nodemailer.

## How the pieces fit

```
colleges (branches)   name + location, uploaded once. Everything else points at this.
      ↓
students              collegeId, name, phone, college. The sign-up gate and the player lookup.
      ↓
contests              opened to a set of colleges; only their students see or enter it.
      ↓
teams                 captain + players, all from one college. College and location are derived.
```

Three rules hold the model together, and each has a test:

1. **A person is identified by college ID, never by account.** A teammate who never filled a form still sees the team, because membership is matched on their roster ID.
2. **A team is single-college by construction.** Its college is the captain's roster row, so admin filters by college and location cannot be wrong.
3. **One person, one team per contest.** Enforced by a unique index on `(tournamentId, players.collegeId)`, so two captains racing for the same player cannot both win.

## Run it locally

```bash
podman run -d --name clutch-mongo -p 27017:27017 docker.io/library/mongo:8   # first time
podman start clutch-mongo                                                     # after a reboot
cp .env.example .env.local      # then fill BETTER_AUTH_SECRET:  openssl rand -base64 32
npm install
npm run seed                    # 3 colleges, 48 students, 4 contests   (-- --reset wipes them)
npm run dev                     # http://localhost:3000
npm test                        # team rules, college scoping, role guards, roster import, IST time, CSV, redirect guard
```

Use `127.0.0.1` in `MONGODB_URI`, not `localhost`. On Fedora `localhost` is IPv6 and rootless podman resets those connections.

With `SMTP_URL` empty, emails (password reset) are printed to the dev server's terminal instead of being sent. Copy the link from there.

## The student list

Nobody can sign up unless their **college ID and mobile number are both on one row** of the `students` collection. Admins load it at `/admin/students`, either by importing a CSV whose first row names the columns `collegeId, name, phone, branch` (any order, up to 5000 rows) or by adding people one at a time. Re-importing a corrected sheet updates rows rather than duplicating them, because everything upserts on college ID.

Both sides normalise before they compare: `+91 98765 43210` and `9876543210` are the same number, `2203a51234` and `2203A51234` the same ID. A student's `branch` is copied from their roster row at sign-up and cannot be typed by hand. One college ID gets one account.

If someone's number has changed since the sheet was made, edit their row at `/admin/students` — that is the intended fix, so the mobile match stays meaningful.

## Becoming admin

On a fresh database nobody can sign up, because the student list is empty and the list is the gate. Two ways in:

**From the environment (how a fresh deployment gets its first admin).** Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, optionally `ADMIN_NAME`, `ADMIN_PHONE` and `ADMIN_COLLEGE_ID` — the whole sign-up form. When the server starts, that account is created with the admin role, skipping the student-list check. Then just log in with it.

It gets no college, so it runs `/admin` but can never be registered for a contest or put on a team. Restarting never duplicates it: if the account exists it is left alone, and only promoted if its role was wrong. The password is never rewritten, so changing `ADMIN_PASSWORD` later does not change the account's — and clearing the variables leaves the account working.

**Or promote an existing account.**

1. Sign up normally (needs a roster row to exist).
2. `npm run promote you@example.com` (add `-- --revoke` to take it back).

That is only needed once. After it, `/admin` → **Admins** promotes anyone else who already has an account. The role is a field on the user document, never anything the sign-up form can set, and nobody can change their own role, so the last admin cannot lock themselves out. Everyone else sees a 404 at `/admin`.

## Going live (Vercel + MongoDB Atlas)

| Variable | Value |
|---|---|
| `MONGODB_URI` | Atlas connection string ending in `/clutch`. In Atlas, Network Access must allow `0.0.0.0/0` (Vercel has no fixed IPs) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | The production URL, no trailing slash |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE`, `ADMIN_COLLEGE_ID` | The first way in, created at server start. Use a long password: this account can read every student's phone number and edit every team. Remove the variables once you have promoted a real admin |
| `SMTP_URL`, `EMAIL_FROM` | Any SMTP provider: `smtp://user:pass@host:587`. Gmail needs an app password; a provider sending as your own domain needs that domain's SPF/DKIM set up, or the mail lands in spam |

Indexes are created on first use. Load the colleges and the student roster at `/admin/colleges` and `/admin/students` before anyone can sign up.

**Never seed production.** `npm run seed` writes 3 invented colleges and 48 invented students, and `-- --reset` deletes every contest, team, college and student. It is a local command: it needs `.env.local`, which Vercel does not have. It also refuses to run when `MONGODB_URI` is not a local database unless you add `-- --yes-really`, and it skips entirely if any colleges, students or contests already exist.

## Where things are

- `src/lib/tournaments.ts` holds every contest and team rule: the roster lookup, the single-college check, the one-team-per-person index, captain edits, admin edits. No Next imports, so `node --test` runs it directly.
- `src/lib/students.ts` and `src/lib/branches.ts` are the roster and the college list, both with CSV import. `src/lib/users.ts` has the role.
- `src/components/scene/` is the swarm. `<SceneStage />` is an empty box the swarm flies into, so CSS decides where the 3D sits at each breakpoint. `<SceneTarget />` sets a page's shape and colour.
- `src/lib/games.ts` has the game presets and the mark paths. The same path draws the DOM icon and the particle shape.
- `scripts/shots.mjs` takes headless Chrome screenshots: `node scripts/shots.mjs /@home --only phone`.

## Known ceilings

- Team counts refresh by polling every 20 s, not push.
- A contest another college cannot enter serves the not-found page, but with HTTP 200 rather than 404. The content is hidden; only the status code is a soft 404, and the same is true of `/admin` for non-admins. That is how `notFound()` behaves in a dynamic route here.
- A signed-out visitor sees every open contest on the home page; the college gate applies once they log in. Filter `listOpen()` differently if that should be hidden too.
- Mobile numbers and college IDs are never verified against the student themselves, only against the roster. Someone who knows a classmate's college ID can put them on a team; the teammate sees it in My games and asks the captain to change it.
- No payments, brackets, results or image uploads.
