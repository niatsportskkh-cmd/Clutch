import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { ObjectId } from 'mongodb'
import { client, db } from '../src/lib/db.ts'
import { claimSlot, cancelRegistration, saveTournament, tournaments, registrations } from '../src/lib/tournaments.ts'

const user = (i: number) => ({ id: `u${i}`, email: `u${i}@t.dev`, phone: '9999999999' })
const roster = (n: number) => ({
  teamName: n > 1 ? 'Team' : '',
  players: Array.from({ length: n }, (_, i) => ({ name: `Player ${i}`, inGameId: `id${i}` })),
})
async function make(over: Record<string, unknown> = {}) {
  const _id = new ObjectId()
  await tournaments().insertOne({
    _id, slug: _id.toHexString(), game: 'bgmi', gameName: 'BGMI', title: 'T', mode: '', glyph: 'drop', hue: 80,
    startsAt: new Date(Date.now() + 864e5), regClosesAt: new Date(Date.now() + 864e5),
    teamSize: 1, maxSlots: 3, slotsTaken: 0, rules: '', prize: '', status: 'open', room: null,
    createdAt: new Date(), updatedAt: new Date(), ...over,
  } as never)
  return _id
}
const taken = async (id: ObjectId) => (await tournaments().findOne({ _id: id }))!.slotsTaken

before(async () => { assert.match(db.databaseName, /test/); await db.dropDatabase() })
after(() => client.close())

test('10 concurrent claims on 3 slots: exactly 3 win', async () => {
  const id = await make()
  const results = await Promise.all(Array.from({ length: 10 }, (_, i) => claimSlot(id, user(i), roster(1))))
  assert.equal(results.filter(r => r.ok).length, 3)
  assert.ok(results.filter(r => !r.ok).every(r => !r.ok && r.error === 'closed_or_full'))
  assert.equal(await taken(id), 3)
  assert.equal(await registrations().countDocuments({ tournamentId: id, status: 'confirmed' }), 3)
})

test('same user twice: second fails and leaks no slot', async () => {
  const id = await make()
  assert.equal((await claimSlot(id, user(1), roster(1))).ok, true)
  const again = await claimSlot(id, user(1), roster(1))
  assert.deepEqual(again, { ok: false, error: 'already_registered' })
  assert.equal(await taken(id), 1)
})

test('cancel frees the slot and allows re-register', async () => {
  const id = await make({ maxSlots: 1 })
  await claimSlot(id, user(1), roster(1))
  const reg = (await registrations().findOne({ tournamentId: id, userId: 'u1' }))!
  assert.equal(await cancelRegistration(reg._id, 'u2'), false) // not the owner
  assert.equal(await cancelRegistration(reg._id, 'u1'), true)
  assert.equal(await cancelRegistration(reg._id, 'u1'), false) // already cancelled
  assert.equal(await taken(id), 0)
  assert.equal((await claimSlot(id, user(1), roster(1))).ok, true)
})

test('closed, past-deadline and wrong roster reject without taking a slot', async () => {
  const closed = await make({ status: 'closed' })
  assert.deepEqual(await claimSlot(closed, user(1), roster(1)), { ok: false, error: 'closed_or_full' })
  const late = await make({ regClosesAt: new Date(Date.now() - 1000) })
  assert.deepEqual(await claimSlot(late, user(1), roster(1)), { ok: false, error: 'closed_or_full' })
  const squad = await make({ teamSize: 4 })
  assert.deepEqual(await claimSlot(squad, user(1), roster(3)), { ok: false, error: 'invalid_roster' })
  assert.deepEqual(await claimSlot(squad, user(1), { ...roster(4), teamName: '' }), { ok: false, error: 'invalid_roster' })
  assert.equal(await taken(squad), 0)
})

test('saveTournament edit rules', async () => {
  const base = {
    game: 'bgmi', gameName: 'BGMI', title: 'Friday Scrims', mode: '', glyph: 'drop', hue: 80,
    startsAt: '2030-01-01T20:00', regClosesAt: '', teamSize: 1, maxSlots: 2, rules: '', prize: '', status: 'open',
  } as const
  const made = await saveTournament(null, base)
  assert.ok(made.ok)
  if (!made.ok) return
  assert.match(made.slug, /^friday-scrims-[a-z0-9]{4}$/)
  await claimSlot(made.id, user(1), roster(1))
  await claimSlot(made.id, user(2), roster(1))
  assert.equal((await saveTournament(made.id, { ...base, maxSlots: 1 })).ok, false) // below taken
  assert.equal((await saveTournament(made.id, { ...base, teamSize: 4 })).ok, false) // roster locked
  assert.equal((await saveTournament(made.id, { ...base, maxSlots: 5 })).ok, true)
})
