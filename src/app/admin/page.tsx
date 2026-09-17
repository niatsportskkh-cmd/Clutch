import type { CSSProperties } from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { formatIst } from '@/lib/time'
import { listAll } from '@/lib/tournaments'
import { Button } from '@/components/Button'
import { GlyphIcon } from '@/components/GlyphIcon'
import { Panel } from '@/components/Panel'
import { setStatusAction } from './actions'

const STATUS_STYLE = { draft: 'text-muted', open: 'text-volt', closed: 'text-danger', completed: 'text-muted' }

export default async function AdminHome() {
  await requireAdmin()
  const all = await listAll()
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-4xl sm:text-5xl">Games</h1>
        <Button href="/admin/games/new">Add game</Button>
      </header>
      {all.length === 0 && <p className="text-lg text-muted">No games yet. Add the first one and it shows up on the home page as soon as its status is Open.</p>}
      <ul className="flex flex-col gap-3">
        {all.map(t => (
          <li key={t.slug} className="hue" style={{ '--hue': t.hue } as CSSProperties}>
            <Panel inner="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 sm:p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent ring-1 ring-inset ring-accent/25"><GlyphIcon glyph={t.glyph} size={22} /></span>
              <div className="min-w-0 flex-1 basis-56">
                <p className="text-sm font-semibold text-accent">{t.gameName}</p>
                <Link href={`/admin/games/${t._id.toHexString()}`} className="display block truncate text-xl hover:underline hover:underline-offset-4">{t.title}</Link>
                <p className="text-sm text-muted">{formatIst(t.startsAt)}</p>
              </div>
              <p className="num text-right"><span className="text-lg font-semibold text-text">{t.slotsTaken} / {t.maxSlots}</span><br /><span className="text-sm text-muted">slots taken</span></p>
              <p className={`w-24 text-sm font-semibold capitalize ${STATUS_STYLE[t.status]}`}>{t.status}</p>
              <div className="flex gap-2">
                {(t.status === 'open' || t.status === 'closed' || t.status === 'draft') && (
                  <form action={setStatusAction}>
                    <input type="hidden" name="id" value={t._id.toHexString()} />
                    <input type="hidden" name="status" value={t.status === 'open' ? 'closed' : 'open'} />
                    <Button variant="secondary" className="px-4">{t.status === 'open' ? 'Close' : 'Open'}</Button>
                  </form>
                )}
                <Button href={`/admin/games/${t._id.toHexString()}`} variant="secondary" className="px-4">Manage</Button>
              </div>
            </Panel>
          </li>
        ))}
      </ul>
    </div>
  )
}
