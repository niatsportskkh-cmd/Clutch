// Resend's REST API is a single POST, so plain fetch instead of their SDK.
export async function sendMail(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') throw new Error('Missing env var RESEND_API_KEY')
    console.log(`[dev mail] to ${to}: ${subject}\n${text}`)
    return
  }
  if (!process.env.EMAIL_FROM) throw new Error('Missing env var EMAIL_FROM')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}
