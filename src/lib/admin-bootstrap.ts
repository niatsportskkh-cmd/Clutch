import { auth, asBootstrap } from './auth.ts'
import { db } from './db.ts'
import { collegeIdSchema, phoneSchema } from './schemas.ts'

/**
 * The first admin, created from the environment when the server starts.
 *
 * On a fresh deployment the database is empty, and an empty database has an empty student list —
 * which is the gate every sign-up has to pass. So without this there is no way in at all: no account
 * can be created, so no account can be promoted. These variables are the whole sign-up form, and the
 * account they make skips the roster check and gets the admin role.
 *
 * It is not a student: no roster row is written, so nobody can put this account on a team.
 */
export async function createEnvAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  // Said out loud, because silence here is indistinguishable from the code never having run.
  if (!email || !password) return console.log('[clutch] ADMIN_EMAIL/ADMIN_PASSWORD not set, no admin created')

  const existing = await db.collection('user').findOne({ email })
  if (existing) {
    // The password is never rewritten: once the account is real, the environment stops being the source of truth.
    if (existing.role !== 'admin') {
      await db.collection('user').updateOne({ _id: existing._id }, { $set: { role: 'admin' } })
      console.log(`[clutch] ${email} promoted to admin`)
    }
    return console.log(`[clutch] admin ${email} already exists`)
  }

  // better-auth requires both fields and validates them the same way the sign-up form does, so a
  // malformed one has to fail here with a message rather than as an opaque sign-up error.
  const phone = phoneSchema.safeParse(process.env.ADMIN_PHONE || '0000000000')
  if (!phone.success) return console.error('[clutch] ADMIN_PHONE is not a valid mobile number, no admin created')
  const collegeId = collegeIdSchema.safeParse(process.env.ADMIN_COLLEGE_ID || 'ADMIN')
  if (!collegeId.success) return console.error('[clutch] ADMIN_COLLEGE_ID is not a valid college ID, no admin created')
  if (password.length < 12) console.warn('[clutch] ADMIN_PASSWORD is short; this account can read every student record')

  await asBootstrap(() => auth.api.signUpEmail({
    body: { name: process.env.ADMIN_NAME?.trim() || 'Admin', email, password, phone: phone.data, collegeId: collegeId.data },
  }))
  // No branch: it is copied from a roster row, and this account deliberately has none.
  await db.collection('user').updateOne({ email }, { $set: { role: 'admin' }, $unset: { branch: '' } })
  console.log(`[clutch] created admin ${email}`)
}
