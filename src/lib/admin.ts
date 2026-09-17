import { notFound } from 'next/navigation'
import { getUser } from './auth.ts'

type Who = { email: string; emailVerified: boolean } | null

const listed = (email: string) =>
  (process.env.ADMIN_EMAILS ?? '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean).includes(email.toLowerCase())

/** Listed AND verified: without verification anyone could sign up with the owner's address first. */
export const isAdmin = (u: Who) => !!u && u.emailVerified && listed(u.email)
export const isUnverifiedAdmin = (u: Who) => !!u && !u.emailVerified && listed(u.email)

export async function requireAdmin() {
  const user = await getUser()
  if (!isAdmin(user)) notFound() // 404, not 403: do not reveal that /admin exists
  return user!
}
