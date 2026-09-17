import { z } from 'zod'

export const GAMES = ['bgmi', 'freefire', 'valorant', 'codm', 'custom'] as const
export const GLYPHS = ['drop', 'flame', 'spike', 'rank', 'crest'] as const
export const STATUSES = ['draft', 'open', 'closed', 'completed'] as const
export type Game = (typeof GAMES)[number]
export type Glyph = (typeof GLYPHS)[number]
export type Status = (typeof STATUSES)[number]

const text = (max: number) => z.string().trim().max(max)
const istLocal = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Pick a date and time')

export const tournamentInput = z.object({
  game: z.enum(GAMES),
  gameName: text(40).min(1, 'Game name is required'),
  title: text(80).min(3, 'Title is too short'),
  mode: text(80),
  glyph: z.enum(GLYPHS),
  hue: z.coerce.number().int().min(0).max(360),
  startsAt: istLocal,
  regClosesAt: istLocal.or(z.literal('')),
  teamSize: z.coerce.number().int().min(1).max(10),
  maxSlots: z.coerce.number().int().min(1).max(1000),
  rules: text(5000),
  prize: text(120),
  status: z.enum(STATUSES),
})
export type TournamentInput = z.infer<typeof tournamentInput>

export const registrationInput = z.object({
  teamName: text(40),
  players: z.array(z.object({
    name: text(40).min(2, 'Player name is too short'),
    inGameId: text(40).min(2, 'In-game ID is too short'),
  })).min(1).max(10),
})
export type RegistrationInput = z.infer<typeof registrationInput>

export const roomInput = z.object({ id: text(40).min(1, 'Room ID is required'), password: text(40), note: text(200) })
export type RoomInput = z.infer<typeof roomInput>

// collected, never verified (no OTP): shape check only
export const phoneSchema = z.string()
  .transform(s => s.replace(/[\s+\-()]/g, ''))
  .pipe(z.string().regex(/^\d{10,13}$/, 'Enter a valid phone number'))
