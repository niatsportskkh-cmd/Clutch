import { ObjectId } from 'mongodb'
import { randomInt } from 'node:crypto'
import { db, ensureIndexes } from './db.ts'
import { formatIst, istToUtc } from './time.ts'
import type { Game, Glyph, Status, TournamentInput, RegistrationInput, RoomInput } from './schemas.ts'

export type Player = { name: string; inGameId: string }
export type Room = { id: string; password: string; note: string; publishedAt: Date }
export type Tournament = {
  _id: ObjectId; slug: string; game: Game; gameName: string; title: string; mode: string; glyph: Glyph; hue: number
  startsAt: Date; regClosesAt: Date; teamSize: number; maxSlots: number; slotsTaken: number
  rules: string; prize: string; status: Status; room: Room | null; createdAt: Date; updatedAt: Date
}
export type Registration = {
  _id: ObjectId; tournamentId: ObjectId; userId: string; code: string; teamName: string | null
  players: Player[]; phone: string; email: string; status: 'confirmed' | 'cancelled'; createdAt: Date
}
export type SessionUser = { id: string; email: string; phone: string }
export type ClaimError = 'not_found' | 'invalid_roster' | 'closed_or_full' | 'already_registered'
export type ClaimResult = { ok: true; code: string } | { ok: false; error: ClaimError }

export const tournaments = () => db.collection<Tournament>('tournaments')
export const registrations = () => db.collection<Registration>('registrations')

export const isRegOpen = (t: Pick<Tournament, 'status' | 'regClosesAt' | 'slotsTaken' | 'maxSlots'>, now = new Date()) =>
  t.status === 'open' && now < t.regClosesAt && t.slotsTaken < t.maxSlots

/** Plain, serialisable shape for client components: never hand a Mongo document across the server/client boundary. */
export const toView = (t: Tournament, now = new Date()) => ({
  slug: t.slug, gameName: t.gameName, title: t.title, mode: t.mode, glyph: t.glyph, hue: t.hue,
  startsAt: t.startsAt.toISOString(), startsLabel: formatIst(t.startsAt),
  teamSize: t.teamSize, maxSlots: t.maxSlots, slotsTaken: t.slotsTaken, open: isRegOpen(t, now),
})
export type GameView = ReturnType<typeof toView>

export const listOpen = () =>
  tournaments().find({ status: 'open', startsAt: { $gt: new Date() } }).sort({ startsAt: 1 }).toArray()
export const listAll = () => tournaments().find().sort({ startsAt: -1 }).toArray()
export const getBySlug = (slug: string) => tournaments().findOne({ slug })
export const getById = async (id: string) => (ObjectId.isValid(id) ? tournaments().findOne({ _id: new ObjectId(id) }) : null)
export const myRegistration = (tournamentId: ObjectId, userId: string) =>
  registrations().findOne({ tournamentId, userId, status: 'confirmed' })
export const listRegistrations = (tournamentId: ObjectId) =>
  registrations().find({ tournamentId, status: 'confirmed' }).sort({ createdAt: 1 }).toArray()

export async function listMine(userId: string) {
  const regs = await registrations().find({ userId, status: 'confirmed' }).sort({ createdAt: -1 }).toArray()
  const ts = await tournaments().find({ _id: { $in: regs.map(r => r.tournamentId) } }).toArray()
  const byId = new Map(ts.map(t => [t._id.toHexString(), t]))
  return regs.flatMap(reg => {
    const t = byId.get(reg.tournamentId.toHexString())
    return t ? [{ reg, t }] : []
  })
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O/1/I/L
const newCode = () => 'CL-' + Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('')

export async function claimSlot(tournamentId: ObjectId, user: SessionUser, input: RegistrationInput): Promise<ClaimResult> {
  await ensureIndexes() // the unique index is what makes "already registered" race-safe
  const t = await tournaments().findOne({ _id: tournamentId })
  if (!t) return { ok: false, error: 'not_found' }
  if (input.players.length !== t.teamSize || (t.teamSize > 1 && !input.teamName)) return { ok: false, error: 'invalid_roster' }

  const now = new Date()
  const claimed = await tournaments().findOneAndUpdate(
    { _id: tournamentId, status: 'open', regClosesAt: { $gt: now }, $expr: { $lt: ['$slotsTaken', '$maxSlots'] } },
    { $inc: { slotsTaken: 1 } },
  )
  if (!claimed) return { ok: false, error: 'closed_or_full' }

  const code = newCode()
  try {
    await registrations().insertOne({
      _id: new ObjectId(), tournamentId, userId: user.id, code,
      teamName: t.teamSize > 1 ? input.teamName : null, players: input.players,
      phone: user.phone, email: user.email, status: 'confirmed', createdAt: now,
    })
    return { ok: true, code }
  } catch (e) {
    // ponytail: no transaction. A crash between the $inc above and this release leaks one slot;
    // the admin "Recount slots" button repairs it. Use a transaction if that ever bites.
    await tournaments().updateOne({ _id: tournamentId }, { $inc: { slotsTaken: -1 } })
    if ((e as { code?: number }).code === 11000) return { ok: false, error: 'already_registered' }
    throw e
  }
}

/** userId = the owner cancelling (deadline enforced); null = admin removal (no deadline). */
export async function cancelRegistration(registrationId: ObjectId, userId: string | null) {
  const filter = { _id: registrationId, status: 'confirmed' as const, ...(userId ? { userId } : {}) }
  if (userId) {
    const reg = await registrations().findOne(filter)
    const t = reg && (await tournaments().findOne({ _id: reg.tournamentId }))
    if (!t || new Date() >= t.regClosesAt) return false
  }
  const flipped = await registrations().findOneAndUpdate(filter, { $set: { status: 'cancelled' } })
  if (!flipped) return false
  await tournaments().updateOne({ _id: flipped.tournamentId }, { $inc: { slotsTaken: -1 } })
  return true
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'game'
const SUFFIX_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'
const suffix = () => Array.from({ length: 4 }, () => SUFFIX_CHARS[randomInt(SUFFIX_CHARS.length)]).join('')

export async function saveTournament(id: ObjectId | null, input: TournamentInput) {
  await ensureIndexes()
  const { startsAt, regClosesAt, ...rest } = input
  const starts = istToUtc(startsAt)
  const closes = regClosesAt ? istToUtc(regClosesAt) : starts
  if (closes > starts) return { ok: false as const, error: 'Registration must close before the game starts' }
  const fields = { ...rest, startsAt: starts, regClosesAt: closes, updatedAt: new Date() }

  if (!id) {
    const _id = new ObjectId()
    const slug = `${slugify(input.title)}-${suffix()}`
    await tournaments().insertOne({ _id, slug, ...fields, slotsTaken: 0, room: null, createdAt: new Date() })
    return { ok: true as const, id: _id, slug }
  }
  // both edit rules are enforced in the filter so they hold under concurrent registrations
  const updated = await tournaments().findOneAndUpdate(
    { _id: id, slotsTaken: { $lte: input.maxSlots }, $or: [{ teamSize: input.teamSize }, { slotsTaken: 0 }] },
    { $set: fields },
    { returnDocument: 'after' },
  )
  if (!updated) {
    return { ok: false as const, error: 'Slots cannot go below registrations already taken, and team size is locked once anyone has registered' }
  }
  return { ok: true as const, id, slug: updated.slug }
}

export async function deleteTournament(id: ObjectId) {
  const { deletedCount } = await tournaments().deleteOne({ _id: id, slotsTaken: 0 })
  if (deletedCount) await registrations().deleteMany({ tournamentId: id })
  return deletedCount === 1
}

export const setStatus = (id: ObjectId, status: Status) =>
  tournaments().updateOne({ _id: id }, { $set: { status, updatedAt: new Date() } })

export const setRoom = (id: ObjectId, room: RoomInput | null) =>
  tournaments().updateOne(
    { _id: id },
    { $set: { room: room && { ...room, publishedAt: new Date() }, updatedAt: new Date() } },
  )

export async function recountSlots(id: ObjectId) {
  // ponytail: racy against a claim that is between its $inc and its insert; admin-triggered only, never automatic
  const n = await registrations().countDocuments({ tournamentId: id, status: 'confirmed' })
  await tournaments().updateOne({ _id: id }, { $set: { slotsTaken: n } })
}
