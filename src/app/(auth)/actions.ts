'use server'
import { timingSafeEqual } from 'node:crypto'
import { auth, asBootstrap } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * better-auth answers "wrong password" and "no such email" with one message, and a reset request with
 * a deliberately vague "if that email exists" — both to stop anyone probing which addresses have
 * accounts. We trade that away so a mistyped email is not mistaken for a forgotten password: signing
 * up already answers the same question ("user already exists"), so this leaks nothing new.
 */
export async function hasAccount(email: string) {
  if (typeof email !== 'string' || email.length > 200) return false
  const found = await db.collection('user').findOne({ email: email.trim().toLowerCase() }, { projection: { _id: 1 } })
  return !!found
}

const matches = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y) // compared in constant time: this is a password
}

/**
 * The break-glass admin, made at the moment it is used. If the email AND password submitted to log in
 * or sign up are both exactly ADMIN_EMAIL and ADMIN_PASSWORD, the account is created on the spot with
 * the admin role, skipping the student-roster gate that every other account has to pass. That is the
 * only way into /admin on an empty database, where no college or student exists yet to let anyone in.
 *
 * Returns true when the caller should now sign in normally. Both halves must match, so a wrong
 * password against the admin's address creates nothing and looks like any other failed login.
 */
export async function ensureEnvAdmin(email: string, password: string, details?: { name?: string; phone?: string }) {
  const wantEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const wantPassword = process.env.ADMIN_PASSWORD
  if (!wantEmail || !wantPassword) return false
  if (typeof email !== 'string' || typeof password !== 'string') return false
  if (email.trim().toLowerCase() !== wantEmail || !matches(password, wantPassword)) return false

  const existing = await db.collection('user').findOne({ email: wantEmail })
  if (existing) {
    // The password is never rewritten: once the account is real, the env var stops being the source of truth.
    if (existing.role !== 'admin') await db.collection('user').updateOne({ _id: existing._id }, { $set: { role: 'admin' } })
    return true
  }

  // Placeholders satisfy better-auth's required fields; both are cleared below, because this account
  // is not a student — it runs the panel but must never be addable to a team.
  await asBootstrap(() => auth.api.signUpEmail({
    body: {
      name: details?.name?.trim() || 'Admin',
      email: wantEmail,
      password: wantPassword,
      phone: details?.phone?.trim() || '0000000000',
      collegeId: 'ENVADMIN',
    },
  }))
  await db.collection('user').updateOne({ email: wantEmail }, { $set: { role: 'admin' }, $unset: { collegeId: '', branch: '' } })
  console.log(`[clutch] created admin ${wantEmail} from ADMIN_EMAIL`)
  return true
}
