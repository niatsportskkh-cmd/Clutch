// Sample tournaments for a fresh database.  npm run seed  |  npm run seed -- --reset
import { client } from '../src/lib/db.ts'
import { saveTournament, tournaments, registrations } from '../src/lib/tournaments.ts'
import { PRESETS } from '../src/lib/games.ts'
import { utcToIstInput } from '../src/lib/time.ts'

if (process.argv.includes('--reset')) {
  await tournaments().deleteMany({})
  await registrations().deleteMany({})
}
if (await tournaments().countDocuments()) {
  console.log('tournaments exist, skipping (use --reset)')
  await client.close()
  process.exit(0)
}

const at = (days: number, hourIst: number) =>
  `${utcToIstInput(new Date(Date.now() + days * 864e5)).slice(0, 10)}T${String(hourIst).padStart(2, '0')}:00`

const RULES = [
  'Join the room 15 minutes before start.',
  'No emulators, no hacks, no teaming.',
  'Screenshots of results may be requested.',
  'Admin decisions are final.',
].join('\n')

const seeds = [
  { game: 'bgmi',     title: 'Friday Night Scrims', mode: 'Squad TPP, Erangel',      days: 2, hour: 21, maxSlots: 25, prize: 'Bragging rights' },
  { game: 'freefire', title: 'Booyah Cup',          mode: 'Squad, Bermuda',          days: 3, hour: 20, maxSlots: 12, prize: '' },
  { game: 'valorant', title: 'Spike Rush Showdown', mode: '5v5, single elimination', days: 5, hour: 19, maxSlots: 16, prize: '' },
  { game: 'codm',     title: 'Sunday Solo Royale',  mode: 'Solo BR, Isolated',       days: 7, hour: 18, maxSlots: 50, prize: '', teamSize: 1 },
] as const

for (const s of seeds) {
  const p = PRESETS[s.game]
  const r = await saveTournament(null, {
    game: s.game, gameName: p.gameName, title: s.title, mode: s.mode, glyph: p.glyph, hue: p.hue,
    startsAt: at(s.days, s.hour), regClosesAt: '', teamSize: 'teamSize' in s ? s.teamSize : p.teamSize,
    maxSlots: s.maxSlots, rules: RULES, prize: s.prize, status: 'open',
  })
  console.log(r.ok ? `seeded ${r.slug}` : r.error)
}
await client.close()
