export const GAMES = ['freefire', 'bgmi', 'codm', 'valorant', 'matiks'] as const
export type Game = (typeof GAMES)[number]

/**
 * The five games, and the only place their rules live. Team size belongs to the game, not the contest:
 * saveTournament copies it from here, so no form can put five players in a BGMI squad.
 * No imports at all: node --test loads this file, and so does the swarm's lazy bundle. The art is in game-art.ts.
 */
export const GAME: Record<Game, { name: string; teamSize: number; idHint: string; platform: 'Mobile' | 'PC'; blurb: string }> = {
  freefire: { name: 'Free Fire MAX', teamSize: 4, idHint: 'Player UID, e.g. 1234567890', platform: 'Mobile', blurb: 'Ten-minute battle royale. Fifty players land, and one squad is left standing.' },
  bgmi:     { name: 'BGMI',          teamSize: 4, idHint: 'Character ID, e.g. 5123456789', platform: 'Mobile', blurb: 'A hundred players drop onto one island. The last squad alive takes it.' },
  codm:     { name: 'COD Mobile',    teamSize: 5, idHint: 'Player UID, e.g. 6749128374650192837', platform: 'Mobile', blurb: 'Five on five on classic Call of Duty maps, settled round by round.' },
  valorant: { name: 'Valorant',      teamSize: 5, idHint: 'Riot ID, e.g. Name#TAG', platform: 'PC', blurb: 'Tactical five on five. Plant the Spike or stop it, one round at a time.' },
  matiks:   { name: 'Matiks',        teamSize: 1, idHint: 'Matiks username', platform: 'Mobile', blurb: 'Head to head mental maths. Out-calculate the player across from you.' },
}

/** Contests saved before the five (a "Code Sprint") are still in the database. Players never see them. */
export const isGame = (g: string): g is Game => Object.hasOwn(GAME, g)

export const teamLabel = (n: number) => (n === 1 ? 'Solo' : n === 2 ? 'Duo' : n === 4 ? 'Squad of 4' : `Team of ${n}`)
