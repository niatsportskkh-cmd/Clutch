import Link from 'next/link'
import { getUser } from '@/lib/auth'
import { listOpen, toView } from '@/lib/tournaments'
import { AutoRefresh } from '@/components/AutoRefresh'
import { Button } from '@/components/Button'
import { Countdown } from '@/components/Countdown'
import { GameList } from '@/components/GameList'
import { SceneStage, SceneTarget } from '@/components/scene/SceneTarget'

export const dynamic = 'force-dynamic'

const STEPS = [
  ['Make an account', 'Name, email and a WhatsApp number. It takes a minute.'],
  ['Pick a game and add your roster', 'Solo or squad. The captain enters every player and their in-game ID.'],
  ['Get the room ID here', 'Before the match starts, the room ID and password appear on your game page.'],
]

export default async function Home() {
  const [user, open] = await Promise.all([getUser(), listOpen()])
  const games = open.map(t => toView(t))
  const next = games[0]
  const slotsLeft = games.reduce((n, g) => n + Math.max(0, g.maxSlots - g.slotsTaken), 0)

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <SceneTarget shape="trophy" hue={null} />
      <AutoRefresh />

      <div className="min-w-0">
        <section className="flex flex-col lg:min-h-[calc(100dvh-13rem)] lg:justify-center">
          <SceneStage className="h-[36dvh] min-h-60 lg:hidden" />
          <div className="rise flex flex-col items-start gap-6">
            {next && (
              <Link href={`/games/${next.slug}`} style={{ '--i': 0 } as React.CSSProperties} className="rounded-full bg-white/[0.06] px-4 py-2 text-sm text-muted ring-1 ring-inset ring-white/10 transition-colors duration-300 hover:text-text">
                Next up: <span className="font-semibold text-text">{next.title}</span> in <Countdown to={next.startsAt} className="font-semibold text-volt" />
              </Link>
            )}
            <h1 style={{ '--i': 1 } as React.CSSProperties} className="display text-[clamp(2.9rem,10.5vw,5.1rem)]">Claim your slot</h1>
            <p style={{ '--i': 2 } as React.CSSProperties} className="max-w-[46ch] text-lg leading-relaxed text-muted">
              Free-entry esports matches. Pick a game, add your roster, and get the room ID here before kick-off.
            </p>
            <div style={{ '--i': 3 } as React.CSSProperties} className="flex flex-wrap gap-3">
              <Button href="#games">See open games</Button>
              {user ? <Button href="/me" variant="secondary">My games</Button> : <Button href="/signup" variant="secondary">Sign up</Button>}
            </div>
          </div>
        </section>

        <section id="games" className="scroll-mt-28 pt-20 lg:pt-10">
          <h2 className="display text-3xl sm:text-4xl">Open for registration</h2>
          {games.length ? (
            <>
              <p className="num mt-3 mb-6 text-muted">
                {games.length} {games.length === 1 ? 'game' : 'games'} open, {slotsLeft} slots left. Entry is free for all of them.
              </p>
              <GameList games={games} />
            </>
          ) : (
            <p className="mt-4 max-w-[48ch] text-lg text-muted">No games are open right now. New matches show up here as soon as they are announced.</p>
          )}
        </section>

        <section className="pt-24">
          <h2 className="display text-3xl sm:text-4xl">How it works</h2>
          <ol className="mt-8 flex flex-col gap-8">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="flex gap-5">
                <span className="display num w-12 shrink-0 text-5xl text-volt">{i + 1}</span>
                <div>
                  <h3 className="text-xl font-semibold text-text">{title}</h3>
                  <p className="mt-1 max-w-[52ch] text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <SceneStage className="sticky top-28 h-[calc(100dvh-10rem)] max-lg:hidden" />
    </div>
  )
}
