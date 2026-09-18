import type { CSSProperties } from 'react'
import Image from 'next/image'
import { getUser } from '@/lib/auth'
import { ART } from '@/lib/game-art'
import { GAME, GAMES } from '@/lib/games'
import { Button } from '@/components/Button'
import { GameChapter } from '@/components/GameChapter'
import { SceneStage, SceneTarget } from '@/components/scene/SceneTarget'

const STEPS = [
  ['Make an account', 'Your college ID and your NIAT registered number. Both have to match the student list.'],
  ['Pick a contest on the Games page', 'The captain types each player’s college ID. Names and numbers come from the student list.'],
  ['Get the room ID here', 'Before the match starts, the room ID and password appear on your contest page.'],
]

// The five chapters vary their composition so the page never runs three identical splits in a row.
const LAYOUTS = { freefire: 'right', bgmi: 'left', codm: 'band', valorant: 'right', matiks: 'left' } as const

/** An introduction to the five games. No contests here: those, and registering, live on the Games page. */
export default async function Home() {
  const user = await getUser()
  return (
    <div className="flex flex-col">
      <SceneTarget shape="trophy" hue={null} />

      <section className="relative flex flex-col justify-between gap-12 lg:min-h-[calc(100dvh-8rem)]">
        <SceneStage className="pointer-events-none absolute top-0 right-0 hidden h-[58%] w-[42%] lg:block" />
        <div className="rise flex max-w-3xl flex-col items-start gap-6">
          <h1 style={{ '--i': 0 } as CSSProperties} className="display text-[clamp(3.2rem,10vw,6.6rem)]">Five games. One campus arena.</h1>
          <p style={{ '--i': 1 } as CSSProperties} className="max-w-[44ch] text-lg leading-relaxed text-muted">
            Free inter-college contests in Free Fire MAX, BGMI, COD Mobile, Valorant and Matiks. Find yours on the Games page.
          </p>
          <div style={{ '--i': 2 } as CSSProperties} className="flex flex-wrap gap-3">
            <Button href="/games">Browse contests</Button>
            {user ? <Button href="/me" variant="secondary">My games</Button> : <Button href="/signup" variant="secondary">Sign up</Button>}
          </div>
        </div>

        {/* The lineup: one character per game, each a link down to its chapter. The page's one big entrance. */}
        <div className="relative">
          <div aria-hidden className="absolute inset-x-[8%] bottom-4 h-28 bg-[radial-gradient(closest-side,rgb(255_26_26/0.32),transparent)]" />
          <ul className="lineup relative grid grid-cols-5 items-end">
            {GAMES.map((g, i) => (
              <li key={g} style={{ '--i': i } as CSSProperties} className="sm:-mx-2">
                <a href={`#${g}`} className="group flex flex-col items-center gap-3">
                  <span className="relative block h-44 w-full transition-transform duration-700 ease-spring group-hover:-translate-y-2 sm:h-72 lg:h-[23rem]">
                    {ART[g].cutout ? (
                      <Image src={ART[g].hero} alt="" fill sizes="(min-width: 1320px) 280px, 22vw" className="object-contain object-bottom" />
                    ) : (
                      <span className="absolute bottom-[6%] left-1/2 block aspect-[9/19.5] h-[78%] -translate-x-1/2 rotate-[6deg] overflow-clip rounded-[1.1rem] ring-4 ring-black sm:rounded-[1.6rem] sm:ring-[6px]">
                        <Image src={ART[g].hero} alt="" fill sizes="(min-width: 1024px) 180px, 18vw" className="object-cover object-top" />
                      </span>
                    )}
                  </span>
                  <span className="text-center text-xs font-semibold text-muted transition-colors duration-300 group-hover:text-text sm:text-sm">{GAME[g].name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {GAMES.map(g => <GameChapter key={g} game={g} layout={LAYOUTS[g]} />)}

      <section className="pt-16">
        <h2 className="display text-3xl sm:text-4xl">How it works</h2>
        <ol className="mt-8 flex flex-col gap-8">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-5">
              <span className="display num w-12 shrink-0 text-5xl text-accent">{i + 1}</span>
              <div>
                <h3 className="text-xl font-semibold text-text">{title}</h3>
                <p className="mt-1 max-w-[52ch] text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
