import type { Game, Glyph } from './schemas.ts'

export const PRESETS: Record<Game, { gameName: string; glyph: Glyph; hue: number; teamSize: number; idHint: string }> = {
  bgmi:     { gameName: 'BGMI',          glyph: 'drop',  hue: 80,  teamSize: 4, idHint: 'Character ID, e.g. 5123456789' },
  freefire: { gameName: 'Free Fire MAX', glyph: 'flame', hue: 45,  teamSize: 4, idHint: 'Player UID, e.g. 1234567890' },
  valorant: { gameName: 'Valorant',      glyph: 'spike', hue: 15,  teamSize: 5, idHint: 'Riot ID, e.g. Name#TAG' },
  codm:     { gameName: 'COD Mobile',    glyph: 'rank',  hue: 210, teamSize: 5, idHint: 'Player UID' },
  custom:   { gameName: '',              glyph: 'crest', hue: 300, teamSize: 1, idHint: 'In-game ID' },
}

// Abstract marks, not game logos. One source for the DOM icon and the particle shape.
// 100x100 viewBox, fill-rule evenodd. `stroke` means the path is drawn as a line of that width.
export const GLYPH_PATHS: Record<Glyph | 'check', { d: string; stroke?: number }> = {
  drop:  { d: 'M50 6C30 6 16 21 16 40c0 24 34 54 34 54s34-30 34-54C84 21 70 6 50 6Zm0 20a14 14 0 1 1 0 28 14 14 0 0 1 0-28Z' },
  flame: { d: 'M52 4c4 18-6 26-14 36-7 9-14 18-14 30a26 26 0 0 0 52 0c0-10-4-17-9-24-2 6-5 10-10 12 3-18-1-38-5-54ZM50 62c-6 7-10 12-10 19a10 10 0 0 0 20 0c0-7-4-12-10-19Z' },
  spike: { d: 'M8 30h20l22 40 22-40h20L50 96ZM50 4l11 15-11 15-11-15Z' },
  rank:  { d: 'M14 18l36 22 36-22v16L50 56 14 34ZM14 46l36 22 36-22v16L50 84 14 62Z' },
  crest: { d: 'M50 6l38 22v44L50 94 12 72V28ZM50 26 30 38v24l20 12 20-12V38Z' },
  check: { d: 'M20 54l20 20 42-46', stroke: 12 },
}

export const teamLabel = (n: number) => (n === 1 ? 'Solo' : n === 2 ? 'Duo' : n === 4 ? 'Squad of 4' : `Team of ${n}`)
