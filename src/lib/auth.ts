import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { nextCookies } from 'better-auth/next-js'
import { APIError } from 'better-auth/api'
import { headers } from 'next/headers'
import { Resend } from 'resend'
import { db } from './db.ts'
import { phoneSchema } from './schemas.ts'

async function sendMail(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') throw new Error('Missing env var RESEND_API_KEY')
    console.log(`[dev mail] to ${to}: ${subject}\n${text}`)
    return
  }
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.EMAIL_FROM!, to, subject, text,
  })
  if (error) throw new Error(`Resend: ${error.message}`)
}

export const auth = betterAuth({
  // no `client` option: transactions stay off, so a standalone local Mongo works
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: ({ user, url }) =>
      sendMail(user.email, 'Reset your Clutch password', `Reset your password with this link. It expires in 1 hour.\n\n${url}`),
  },
  emailVerification: {
    sendOnSignUp: true, // players may ignore it; only admin access requires a verified email
    autoSignInAfterVerification: true,
    sendVerificationEmail: ({ user, url }) =>
      sendMail(user.email, 'Verify your Clutch email', `Confirm this is your email address:\n\n${url}`),
  },
  user: { additionalFields: { phone: { type: 'string', required: true } } },
  databaseHooks: {
    user: {
      create: {
        before: async user => {
          const phone = phoneSchema.safeParse((user as { phone?: unknown }).phone)
          if (!phone.success) throw new APIError('BAD_REQUEST', { message: 'Enter a valid phone number' })
          return { data: { ...user, phone: phone.data } }
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
