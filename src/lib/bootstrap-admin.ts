import { auth, asBootstrap } from './auth.ts'
import { db } from './db.ts'

/**
 * The break-glass admin. With ADMIN_EMAIL and ADMIN_PASSWORD set, that account exists on a completely
 * empty database, so there is a way into /admin before any college or student has been loaded.
 * It is not a student: it has no college, so it can run the panel but cannot register for a contest.
 */
async function run() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  // Said out loud: silence here is indistinguishable from the code never having run.
  if (!email || !password) return console.log('[clutch] ADMIN_EMAIL/ADMIN_PASSWORD not set, no break-glass admin')

  const existing = await db.collection('user').findOne({ email })
  if (existing) {
    // Never touches the password: once the account is real, the env var stops being the source of truth.
    if (existing.role !== 'admin') {
      await db.collection('user').updateOne({ _id: existing._id }, { $set: { role: 'admin' } })
      console.log(`[clutch] ${email} promoted to admin from ADMIN_EMAIL`)
    }
    return
  }

  if (password.length < 12) console.warn('[clutch] ADMIN_PASSWORD is short; this account can reach every team and every student record')
  // Placeholders: better-auth requires both fields, and they are cleared immediately below.
  await asBootstrap(() => auth.api.signUpEmail({ body: { name: 'Admin', email, password, phone: '0000000000', collegeId: 'ENVADMIN' } }))
  await db.collection('user').updateOne({ email }, { $set: { role: 'admin' }, $unset: { collegeId: '', branch: '' } })
  console.log(`[clutch] created admin ${email} from ADMIN_EMAIL`)
}

let inflight: Promise<void> | null = null

/**
 * Runs at most once per server instance, from instrumentation at boot AND from the login page.
 * Serverless is the reason for the second caller: a platform that does not run the startup hook the
 * way a long-lived server does would otherwise leave no way in at all. A failure clears the latch so
 * the next request retries, rather than one unreachable database meaning no admin until a redeploy.
 */
export function ensureAdmin() {
  return (inflight ??= run().catch(e => {
    inflight = null
    console.error('[clutch] admin bootstrap failed:', e instanceof Error ? e.message : e)
  }))
}
