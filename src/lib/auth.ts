import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { nextCookies } from 'better-auth/next-js'
import { APIError } from 'better-auth/api'
import { headers } from 'next/headers'
import { db } from './db.ts'
import { signupGate } from './users.ts'

export const auth = betterAuth({
  // no `client` option: transactions stay off, so a standalone local Mongo works
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // No sendResetPassword: reset is off until it returns another way. Without it better-auth refuses its own
    // reset endpoint, so no route on this site can send mail.
  },
  // No emailVerification block: admin access is a role on the user document, so a verified
  // address gates nothing and the extra mail only trained people to ignore it.
  user: {
    additionalFields: {
      phone: { type: 'string', required: true },
      collegeId: { type: 'string', required: true },
      // Copied off the roster row, never typed: a student cannot put themselves in another branch.
      branch: { type: 'string', required: false, input: false },
      // `input: false` is the whole guard here: without it a sign-up POST could carry role: 'admin'.
      role: { type: 'string', required: false, defaultValue: 'user', input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // The gate lives in users.ts (see signupGate): the first account ever becomes the admin, and every
        // one after it must match the student roster. Running inside better-auth means every sign-up
        // route goes through it, not just our form.
        before: async user => {
          const gate = await signupGate(user as { phone?: unknown; collegeId?: unknown })
          if (!gate.ok) throw new APIError('BAD_REQUEST', { message: gate.message })
          return { data: { ...user, ...gate.fields } }
        },
      },
    },
  },
  plugins: [nextCookies()], // keep last
})

export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}
