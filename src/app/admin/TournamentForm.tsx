'use client'
import { useActionState, useState, type CSSProperties } from 'react'
import { PRESETS } from '@/lib/games'
import { GAMES, GLYPHS, STATUSES, type Game, type Glyph } from '@/lib/schemas'
import { Button } from '@/components/Button'
import { Field, Select, TextArea } from '@/components/Field'
import { GlyphIcon } from '@/components/GlyphIcon'
import { SceneStage } from '@/components/scene/SceneTarget'
import { saveTournamentAction, type FormState } from './actions'

export type TournamentValues = {
  game: Game; gameName: string; title: string; mode: string; glyph: Glyph; hue: number
  startsAt: string; regClosesAt: string; teamSize: number; maxSlots: number; rules: string; prize: string; status: string
}
const GAME_LABEL: Record<Game, string> = { bgmi: 'BGMI', freefire: 'Free Fire MAX', valorant: 'Valorant', codm: 'COD Mobile', custom: 'Another game' }
const STATUS_HINT = 'Draft is hidden. Open is listed and accepts registrations. Closed and Completed are hidden from the home page.'

export function TournamentForm({ id, initial, locked }: { id: string | null; initial: TournamentValues; locked: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTournamentAction.bind(null, id), null)
  const kept = state && !state.ok ? state.values : undefined
  // fields a preset rewrites are controlled; everything else is plain defaultValue
  const [game, setGame] = useState<Game>(initial.game)
  const [gameName, setGameName] = useState(initial.gameName)
  const [glyph, setGlyph] = useState<Glyph>(initial.glyph)
  const [hue, setHue] = useState(initial.hue)
  const [teamSize, setTeamSize] = useState(initial.teamSize)
  const v = (k: keyof TournamentValues) => kept?.[k] ?? String(initial[k])

  function pickGame(g: Game) {
    const p = PRESETS[g]
    setGame(g); setGameName(p.gameName); setGlyph(p.glyph); setHue(p.hue)
    if (!locked) setTeamSize(p.teamSize)
  }

  return (
    <form action={action} className="hue flex flex-col gap-6" style={{ '--hue': hue } as CSSProperties}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Game" name="game" value={game} onChange={e => pickGame(e.target.value as Game)} hint="Picking a game fills in its name, mark, colour and team size.">
          {GAMES.map(g => <option key={g} value={g}>{GAME_LABEL[g]}</option>)}
        </Select>
        <Field label="Game name shown to players" name="gameName" required maxLength={40} value={gameName} onChange={e => setGameName(e.target.value)} />
      </div>
      <Field label="Title" name="title" required minLength={3} maxLength={80} defaultValue={v('title')} placeholder="Friday Night Scrims" />
      <Field label="Mode" name="mode" maxLength={80} defaultValue={v('mode')} placeholder="Squad TPP, Erangel" hint="Optional. Map, perspective, bracket style." />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Starts (IST)" name="startsAt" type="datetime-local" required defaultValue={v('startsAt')} />
        <Field label="Registration closes (IST)" name="regClosesAt" type="datetime-local" defaultValue={v('regClosesAt')} hint="Leave empty to close at start time." />
        <Field label="Players per team" name="teamSize" type="number" required min={1} max={10} value={teamSize} readOnly={locked} onChange={e => setTeamSize(+e.target.value)}
          hint={locked ? 'Locked: teams have already registered with this size.' : '1 is solo, 2 duo, 4 squad, 5 for 5v5.'} />
        <Field label="Slots" name="maxSlots" type="number" required min={1} max={1000} defaultValue={v('maxSlots')} hint="How many teams (or solo players) can join. Cannot go below slots already taken." />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text">Mark and colour</legend>
        <div className="grid items-center gap-5 sm:grid-cols-[1fr_12rem]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {GLYPHS.map(g => (
                <label key={g} className="grid h-14 w-14 cursor-pointer place-items-center rounded-2xl text-muted ring-1 ring-inset ring-line transition-colors duration-300 has-checked:bg-accent/15 has-checked:text-accent has-checked:ring-accent has-focus-visible:outline-2 has-focus-visible:outline-volt">
                  <input type="radio" name="glyph" value={g} checked={glyph === g} onChange={() => setGlyph(g)} className="sr-only" />
                  <GlyphIcon glyph={g} size={28} /><span className="sr-only">{g}</span>
                </label>
              ))}
            </div>
            <label className="flex items-center gap-4 text-sm text-muted">
              Colour
              <input type="range" name="hue" min={0} max={360} value={hue} onChange={e => setHue(+e.target.value)} className="h-11 flex-1 accent-(--accent)" />
              <span aria-hidden className="h-8 w-8 rounded-full bg-accent ring-1 ring-inset ring-white/20" />
            </label>
          </div>
          {/* live 3D preview: the swarm takes the chosen mark and colour */}
          <SceneStage shape={glyph} hue={hue} className="h-44" />
        </div>
      </fieldset>

      <TextArea label="Rules" name="rules" maxLength={5000} defaultValue={v('rules')} hint="Plain text. Line breaks are kept." />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prize" name="prize" maxLength={120} defaultValue={v('prize')} hint="Optional. Entry is always free." />
        <Select label="Status" name="status" defaultValue={v('status')} hint={STATUS_HINT}>
          {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? 'Saving' : id ? 'Save changes' : 'Add game'}</Button>
        <p aria-live="polite" className={state?.ok ? 'text-volt' : 'text-danger'}>{state?.ok ? state.message : state?.error}</p>
      </div>
    </form>
  )
}
