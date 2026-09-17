import type { CSSProperties } from 'react'
import { notFound, redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { PRESETS, teamLabel } from '@/lib/games'
import { formatIst } from '@/lib/time'
import { getBySlug, isRegOpen, myRegistration } from '@/lib/tournaments'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Panel'
import { SceneStage, SceneTarget } from '@/components/scene/SceneTarget'
import { RegisterForm } from './RegisterForm'

export const metadata = { title: 'Register' }

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = await getBySlug(slug)
  if (!t || t.status === 'draft') notFound()
  const user = await getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/games/${slug}/register`)}`)
  const reg = await myRegistration(t._id, user.id)
  if (!reg && !isRegOpen(t)) redirect(`/games/${slug}`)

  return (
    <div className="hue lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12" style={{ '--hue': t.hue } as CSSProperties}>
      {reg
        ? <SceneTarget shape="check" hue={t.hue} burst />
        : <SceneTarget shape="slots" hue={t.hue} taken={t.slotsTaken} max={t.maxSlots} />}

      <div className="min-w-0">
        <SceneStage className="h-[28dvh] min-h-48 lg:hidden" />
        {reg ? (
          <div className="rise flex flex-col items-start gap-6">
            <h1 style={{ '--i': 0 } as CSSProperties} className="display text-[clamp(2.6rem,9vw,4.75rem)]">You&apos;re in</h1>
            <p style={{ '--i': 1 } as CSSProperties} className="max-w-[50ch] text-lg text-muted">
              {reg.teamName ? <><span className="font-semibold text-text">{reg.teamName}</span> has a slot in </> : 'You have a slot in '}
              <span className="font-semibold text-text">{t.title}</span>, {formatIst(t.startsAt)}.
            </p>
            <Panel style={{ '--i': 2 } as CSSProperties} inner="px-6 py-5">
              <p className="text-sm text-muted">Registration code</p>
              <p className="font-mono text-3xl font-semibold text-accent">{reg.code}</p>
            </Panel>
            <p style={{ '--i': 3 } as CSSProperties} className="max-w-[50ch] text-muted">
              The room ID and password will show on the game page and in My games before the match. Nothing is sent by message, so check back here.
            </p>
            <div style={{ '--i': 4 } as CSSProperties} className="flex flex-wrap gap-3">
              <Button href="/me">My games</Button>
              <Button href={`/games/${slug}`} variant="secondary">Game page</Button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-semibold text-accent">{t.gameName}, {teamLabel(t.teamSize).toLowerCase()}</p>
            <h1 className="display mt-2 text-[clamp(2rem,6.5vw,3.25rem)]">{t.title}</h1>
            <p className="mt-4 mb-10 max-w-[54ch] text-lg text-muted">
              {formatIst(t.startsAt)}. {t.maxSlots - t.slotsTaken} of {t.maxSlots} slots left.
              {t.teamSize > 1 && ' As captain you enter the whole roster, so have every in-game ID ready.'}
            </p>
            <RegisterForm slug={slug} teamSize={t.teamSize} captain={user.name} idHint={PRESETS[t.game].idHint} />
          </>
        )}
      </div>

      <SceneStage className="sticky top-28 h-[calc(100dvh-10rem)] max-lg:hidden" />
    </div>
  )
}
