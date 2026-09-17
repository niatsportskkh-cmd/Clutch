import type { CSSProperties } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { formatIst } from '@/lib/time'
import { listMine } from '@/lib/tournaments'
import { AutoRefresh } from '@/components/AutoRefresh'
import { Button } from '@/components/Button'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Countdown } from '@/components/Countdown'
import { GlyphIcon } from '@/components/GlyphIcon'
import { Panel } from '@/components/Panel'
import { RoomPanel } from '@/components/RoomPanel'
import { SignOutButton } from '@/components/SignOutButton'
import { SceneTarget } from '@/components/scene/SceneTarget'
import { cancelAction } from './actions'

export const metadata = { title: 'My games' }

export default async function MePage() {
  const user = await getUser()
  if (!user) redirect('/login?next=/me')
  const mine = await listMine(user.id)
  const now = new Date()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <SceneTarget shape="field" hue={null} />
      <AutoRefresh seconds={30} />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl sm:text-5xl">My games</h1>
          <p className="mt-2 text-muted">Signed in as {user.email}</p>
        </div>
        {/* the nav drops Sign out on phones to stay on one row, so it lives here instead */}
        <SignOutButton className="inline-flex h-11 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold text-muted ring-1 ring-inset ring-white/15 transition-colors duration-300 hover:text-text sm:hidden" />
      </header>

      {mine.length === 0 && (
        <Panel inner="flex flex-col items-start gap-4 p-6">
          <p className="text-lg text-text">You have not registered for anything yet.</p>
          <Button href="/#games">See open games</Button>
        </Panel>
      )}

      {mine.map(({ reg, t }) => (
        <article key={reg._id.toHexString()} className="hue flex flex-col gap-3" style={{ '--hue': t.hue } as CSSProperties}>
          <Panel inner="flex flex-col gap-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-accent"><GlyphIcon glyph={t.glyph} size={18} /> {t.gameName}</p>
                <h2 className="display mt-1.5 text-2xl"><Link href={`/games/${t.slug}`} className="hover:underline hover:underline-offset-4">{t.title}</Link></h2>
                <p className="mt-2 font-medium text-text">{formatIst(t.startsAt)}</p>
                {t.startsAt > now && <p className="text-sm text-muted">Starts in <Countdown to={t.startsAt.toISOString()} className="font-semibold text-text" /></p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm text-muted">Code</p>
                <p className="font-mono text-lg font-semibold text-accent">{reg.code}</p>
              </div>
            </div>
            <div>
              {reg.teamName && <p className="mb-2 font-semibold text-text">{reg.teamName}</p>}
              <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {reg.players.map((p, i) => (
                  <li key={i} className="flex justify-between gap-3 border-b border-line/60 py-1.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                    <span className="text-text">{p.name}</span><span className="font-mono text-muted">{p.inGameId}</span>
                  </li>
                ))}
              </ul>
            </div>
            {now < t.regClosesAt && (
              <form action={cancelAction} className="self-start">
                <input type="hidden" name="id" value={reg._id.toHexString()} />
                <ConfirmButton variant="danger" message={`Cancel your registration for ${t.title}? Your slot goes back to the pool.`}>Cancel registration</ConfirmButton>
              </form>
            )}
          </Panel>
          <RoomPanel room={t.room} />
        </article>
      ))}
    </div>
  )
}
