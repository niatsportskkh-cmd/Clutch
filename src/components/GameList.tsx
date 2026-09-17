'use client'
import { useEffect, useRef, useState } from 'react'
import type { GameView } from '@/lib/tournaments'
import { GameCard } from './GameCard'
import { SceneStage } from './scene/SceneTarget'

/**
 * Desktop: a fixture list beside the sticky stage; hovering a row retargets the swarm.
 * Phones: a swipe carousel under its own stage, like a character select. The card you stop on becomes the swarm.
 */
export function GameList({ games }: { games: GameView[] }) {
  const scroller = useRef<HTMLUListElement>(null)
  const [focused, setFocused] = useState(0)

  useEffect(() => {
    const items = [...(scroller.current?.children ?? [])]
    const io = new IntersectionObserver(
      entries => { for (const e of entries) if (e.isIntersecting) setFocused(items.indexOf(e.target)) },
      { threshold: 0.6 },
    )
    items.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [games.length])

  const current = games[Math.min(focused, games.length - 1)]
  return (
    <>
      <SceneStage shape={current.glyph} hue={current.hue} className="h-[30dvh] min-h-52 lg:hidden" />
      <ul ref={scroller} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-col lg:gap-4 lg:overflow-visible lg:px-0">
        {games.map(g => (
          <li key={g.slug} className="row-in w-[84vw] max-w-sm shrink-0 snap-center lg:w-auto lg:max-w-none">
            <GameCard game={g} />
          </li>
        ))}
      </ul>
    </>
  )
}
