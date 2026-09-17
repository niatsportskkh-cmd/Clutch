import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { teamLabel } from '@/lib/games'
import { formatIst } from '@/lib/time'
import { getBySlug, isRegOpen, myRegistration } from '@/lib/tournaments'
import { AutoRefresh } from '@/components/AutoRefresh'
import { Button } from '@/components/Button'
import { Countdown } from '@/components/Countdown'
import { GlyphIcon } from '@/components/GlyphIcon'
import { RoomPanel } from '@/components/RoomPanel'
import { SlotMeter } from '@/components/SlotMeter'
import { SceneFocus, SceneStage, SceneTarget } from '@/components/scene/SceneTarget'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getBySlug((await params).slug)
  return t ? { title: `${t.title}, ${t.gameName}`, description: `Free ${t.gameName} match on ${formatIst(t.startsAt)}. ${t.maxSlots - t.slotsTaken} slots left.` } : {}
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params
  const [t, user] = await Promise.all([getBySlug(slug), getUser()])
  if (!t || (t.status === 'draft' && !isAdmin(user))) notFound()
  const reg = user ? await myRegistration(t._id, user.id) : null
  const open = isRegOpen(t)
  const full = t.slotsTaken >= t.maxSlots

  const facts = [
    ['Starts', formatIst(t.startsAt)],
    ['Format', teamLabel(t.teamSize)],
    ...(t.mode ? [['Mode', t.mode]] : []),
    ['Entry', 'Free'],
    ...(t.prize ? [['Prize', t.prize]] : []),
  ]

  return (
    <div className="hue lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12" style={{ '--hue': t.hue } as CSSProperties}>
      <SceneTarget shape={t.glyph} hue={t.hue} />
      <AutoRefresh />

      <div className="flex min-w-0 flex-col gap-10">
        <header className="rise flex flex-col items-start gap-5">
          <SceneStage className="h-[30dvh] min-h-52 w-full lg:hidden" />
          <p style={{ '--i': 0 } as CSSProperties} className="flex items-center gap-2.5 font-semibold text-accent">
            <GlyphIcon glyph={t.glyph} size={22} /> {t.gameName}
          </p>
          <h1 style={{ '--i': 1 } as CSSProperties} className="display text-[clamp(2.4rem,8.5vw,4.5rem)]">{t.title}</h1>
          <p style={{ '--i': 2 } as CSSProperties} className="text-lg text-muted">
            {t.startsAt > new Date() ? <>Starts in <Countdown to={t.startsAt.toISOString()} className="font-semibold text-text" /></> : 'This match has started.'}
          </p>
          <div style={{ '--i': 3 } as CSSProperties} className="flex flex-wrap items-center gap-3">
            {reg ? (
              <>
                <span className="inline-flex min-h-11 items-center rounded-full bg-accent/15 px-5 font-semibold text-accent ring-1 ring-inset ring-accent/40">You&apos;re in</span>
                <span className="font-mono text-lg text-text">{reg.code}</span>
              </>
            ) : (
              <Button href={`/games/${t.slug}/register`} disabled={!open}>{open ? 'Register free' : full ? 'Full' : 'Registration closed'}</Button>
            )}
            <Button href="/#games" variant="ghost">All games</Button>
          </div>
        </header>

        {reg && <RoomPanel room={t.room} />}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-0.5 text-lg font-semibold text-text">{value}</dd>
            </div>
          ))}
        </dl>

        <SceneFocus shape="slots" hue={t.hue} taken={t.slotsTaken} max={t.maxSlots} className="flex flex-col gap-5">
          <h2 className="display text-2xl sm:text-3xl">Slots</h2>
          <SceneStage className="h-[30dvh] min-h-52 lg:hidden" />
          <SlotMeter taken={t.slotsTaken} max={t.maxSlots} className="max-w-md" />
          <p className="max-w-[52ch] text-muted">
            {t.teamSize > 1 ? `One slot is one team of ${t.teamSize}.` : 'One slot is one player.'} Registration closes {formatIst(t.regClosesAt)}, or when the last slot goes.
          </p>
        </SceneFocus>

        {t.rules && (
          <section>
            <h2 className="display text-2xl sm:text-3xl">Rules</h2>
            <p className="mt-4 max-w-[62ch] whitespace-pre-line leading-relaxed text-muted">{t.rules}</p>
          </section>
        )}
      </div>

      <SceneStage className="sticky top-28 h-[calc(100dvh-10rem)] max-lg:hidden" />
    </div>
  )
}
