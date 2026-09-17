import { db } from './db.ts'
import type { Role } from './schemas.ts'

export type Account = { _id: unknown; name: string; email: string; phone: string; role?: Role; roleSetAt?: Date }

const users = () => db.collection<Account>('user')

/** The role lives on the user document. Promote the first admin with `npm run promote <email>`; admins promote the rest. */
export const isAdmin = (u: { role?: string | null } | null | undefined) => u?.role === 'admin'

export const listByRole = (role: Role) => users().find({ role }).sort({ email: 1 }).toArray()

/**
 * actorId is the admin making the change. Nobody may edit their own role: it keeps the last admin
 * from demoting themselves into a panel only a database client can reopen.
 */
export async function setRole(email: string, role: Role, actorId: string) {
  const target = await users().findOne({ email: email.trim().toLowerCase() })
  if (!target) return { ok: false as const, error: 'not_found' as const }
  if (String(target._id) === actorId) return { ok: false as const, error: 'self' as const }
  await users().updateOne({ _id: target._id } as never, { $set: { role, roleSetBy: actorId, roleSetAt: new Date() } })
  return { ok: true as const, email: target.email, name: target.name }
}
