'use client'
import type { CSSProperties } from 'react'
import type { GameView } from '@/lib/tournaments'
import { teamLabel } from '@/lib/games'
import { Button } from './Button'
import { GlyphIcon } from './GlyphIcon'
import { Panel } from './Panel'
import { TeamCount } from './TeamCount'
import { useSceneHover } from './scene/SceneTarget'

/** A fixture row on desktop, a swipe card on phones. Hovering or focusing it points the swarm at this game. */
export function GameCard({ game }: { game: GameView }) {
  const hover = useSceneHover(game.glyph, game.hue)
  return (
    <article className="hue h-full" style={{ '--hue': game.hue } as CSSProperties} {...hover}>
      <Panel className="h-full transition-transform duration-500 ease-spring active:scale-[0.985] lg:active:scale-100" inner="flex h-full flex-col gap-5 p-5 lg:flex-row lg:items-center lg:gap-6 lg:p-6">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent/12 text-accent ring-1 ring-inset ring-accent/25">
            <GlyphIcon glyph={game.glyph} size={30} />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-accent">
              {game.gameName}
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold">Free</span>
            </p>
            <h3 className="display mt-1.5 text-[1.35rem] text-text lg:text-2xl">{game.title}</h3>
            <p className="mt-2 text-[0.95rem] font-medium text-text">{game.startsLabel}</p>
            <p className="text-sm text-muted">{teamLabel(game.teamSize)}{game.mode && `, ${game.mode}`}</p>
            {game.locations.length > 0 && <p className="mt-0.5 text-sm text-muted">{game.locations.join(' · ')}</p>}
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-4 lg:mt-0 lg:w-60 lg:shrink-0">
          <TeamCount teams={game.teams} open={game.open} />
          <div className="flex gap-2">
            <Button href={`/games/${game.slug}/register`} disabled={!game.open} className="flex-1 px-4">
              {game.open ? 'Register' : 'Closed'}
            </Button>
            <Button href={`/games/${game.slug}`} variant="secondary" className="px-4">Details</Button>
          </div>
        </div>
      </Panel>
    </article>
  )
}
