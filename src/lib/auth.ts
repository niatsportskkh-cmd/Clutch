import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { nextCookies } from 'better-auth/next-js'
import { APIError } from 'better-auth/api'
import { headers } from 'next/headers'
import { db, ensureIndexes } from './db.ts'
import { sendMail } from './mail.ts'
import { collegeIdSchema, phoneSchema } from './schemas.ts'
import { findStudent } from './students.ts'

export const auth = betterAuth({
  // no `client` option: transactions stay off, so a standalone local Mongo works
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: ({ user, url }) =>
      sendMail(user.email, 'Reset your Clutch password', `Reset your password with this link. It expires in 1 hour.\n\n${url}`),
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
        // The gate: an account exists only for someone already on the student roster, matched on
        // BOTH mobile and college ID. Runs inside better-auth so every sign-up route goes through it,
        // not just our form.
        before: async user => {
          const raw = user as { phone?: unknown; collegeId?: unknown }
          const phone = phoneSchema.safeParse(raw.phone)
          if (!phone.success) throw new APIError('BAD_REQUEST', { message: 'Enter a valid mobile number' })
          const collegeId = collegeIdSchema.safeParse(raw.collegeId)
          if (!collegeId.success) throw new APIError('BAD_REQUEST', { message: 'Enter a valid college ID' })

          await ensureIndexes() // the unique index below is the race backstop for the check after it
          const student = await findStudent(collegeId.data, phone.data)
          if (!student) {
            throw new APIError('BAD_REQUEST', {
              message: 'That college ID and mobile number are not on the student list together. Check both, or ask the organisers to add you.',
            })
          }
          if (await db.collection('user').findOne({ collegeId: collegeId.data })) {
            throw new APIError('BAD_REQUEST', { message: 'An account already exists for this college ID. Log in instead, or reset the password.' })
          }
          return { data: { ...user, phone: phone.data, collegeId: collegeId.data, branch: student.branch } }
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
