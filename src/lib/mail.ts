import { createTransport } from 'nodemailer'

// One connection string instead of five env vars: smtp://user:pass@host:587, or smtps:// for implicit TLS on 465.
// Built once per process so warm lambdas and the dev server reuse the connection pool.
const transport = process.env.SMTP_URL ? createTransport(process.env.SMTP_URL) : null

export async function sendMail(to: string, subject: string, text: string) {
  if (!transport) {
    if (process.env.NODE_ENV === 'production') throw new Error('Missing env var SMTP_URL')
    console.log(`[dev mail] to ${to}: ${subject}\n${text}`)
    return
  }
  if (!process.env.EMAIL_FROM) throw new Error('Missing env var EMAIL_FROM')
  await transport.sendMail({ from: process.env.EMAIL_FROM, to, subject, text })
}
