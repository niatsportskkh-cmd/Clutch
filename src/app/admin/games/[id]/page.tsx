import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { formatIst, utcToIstInput } from '@/lib/time'
import { getById, listRegistrations } from '@/lib/tournaments'
import { Button } from '@/components/Button'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Panel } from '@/components/Panel'
import { deleteTournamentAction, recountAction, removeRegistrationAction } from '../../actions'
import { TournamentForm } from '../../TournamentForm'
import { RoomForm } from './RoomForm'

export default async function ManageGame({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const t = await getById(id)
  if (!t) notFound()
  const regs = await listRegistrations(t._id)

  return (
    <div className="hue mx-auto flex w-full max-w-3xl flex-col gap-10" style={{ '--hue': t.hue } as CSSProperties}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button href="/admin" variant="ghost" className="px-3">All games</Button>
        <Button href={`/games/${t.slug}`} variant="secondary">View public page</Button>
      </div>
      <div>
        <p className="font-semibold text-accent">{t.gameName}</p>
        <h1 className="display mt-1 text-3xl sm:text-5xl">{t.title}</h1>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="display text-2xl">Room details</h2>
        <p className="max-w-[60ch] text-muted">
          {t.room ? `Published ${formatIst(t.room.publishedAt)}. ` : 'Not published yet. '}
          Only players with a confirmed registration for this game can see these, on the game page and in My games.
        </p>
        <Panel inner="p-5 sm:p-7"><RoomForm id={id} room={t.room && { id: t.room.id, password: t.room.password, note: t.room.note }} /></Panel>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="display text-2xl">Registrations <span className="num text-muted">{regs.length} / {t.maxSlots}</span></h2>
          <div className="flex gap-2">
            <form action={recountAction}>
              <input type="hidden" name="id" value={id} />
              <Button variant="ghost" className="px-4" title="Sets the slot counter to the real number of confirmed registrations">Recount slots</Button>
            </form>
            {/* a plain anchor: route handlers that send a file must not go through the client router */}
            <a href={`/admin/games/${id}/export`} className="inline-flex min-h-11 items-center rounded-full bg-white/[0.06] px-5 text-[0.95rem] font-semibold text-text ring-1 ring-inset ring-white/15 transition-colors duration-300 hover:bg-white/[0.12]">Export CSV</a>
          </div>
        </div>
        {regs.length === 0 && <p className="text-muted">Nobody has registered yet.</p>}
        <ol className="flex flex-col gap-3">
          {regs.map((r, i) => (
            <li key={r._id.toHexString()}>
              <Panel inner="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-text"><span className="num mr-2 text-muted">{i + 1}.</span>{r.teamName ?? r.players[0].name}</p>
                    <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted">
                      <a className="underline underline-offset-4 hover:text-text" href={`https://wa.me/${r.phone.length === 10 ? `91${r.phone}` : r.phone}`} target="_blank" rel="noreferrer">WhatsApp {r.phone}</a>
                      <a className="underline underline-offset-4 hover:text-text" href={`mailto:${r.email}`}>{r.email}</a>
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-mono font-semibold text-accent">{r.code}</p>
                    <p className="text-muted">{formatIst(r.createdAt)}</p>
                  </div>
                </div>
                <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  {r.players.map((p, j) => (
                    <li key={j} className="flex justify-between gap-3"><span className="text-text">{p.name}</span><span className="font-mono text-muted">{p.inGameId}</span></li>
                  ))}
                </ul>
                <form action={removeRegistrationAction} className="self-start">
                  <input type="hidden" name="id" value={r._id.toHexString()} />
                  <ConfirmButton variant="danger" className="min-h-10 px-4 text-sm" message={`Remove ${r.teamName ?? r.players[0].name}? Their slot goes back to the pool.`}>Remove</ConfirmButton>
                </form>
              </Panel>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="display text-2xl">Game settings</h2>
        <Panel inner="p-5 sm:p-7">
          <TournamentForm id={id} locked={t.slotsTaken > 0} initial={{
            game: t.game, gameName: t.gameName, title: t.title, mode: t.mode, glyph: t.glyph, hue: t.hue,
            startsAt: utcToIstInput(t.startsAt), regClosesAt: t.regClosesAt.getTime() === t.startsAt.getTime() ? '' : utcToIstInput(t.regClosesAt),
            teamSize: t.teamSize, maxSlots: t.maxSlots, rules: t.rules, prize: t.prize, status: t.status,
          }} />
        </Panel>
      </section>

      {t.slotsTaken === 0 && (
        <form action={deleteTournamentAction} className="self-start">
          <input type="hidden" name="id" value={id} />
          <ConfirmButton variant="danger" message={`Delete ${t.title} for good?`}>Delete this game</ConfirmButton>
        </form>
      )}
    </div>
  )
}
