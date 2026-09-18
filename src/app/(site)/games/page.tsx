import Link from 'next/link'
import { getUser } from '@/lib/auth'
import { openViews } from '@/lib/tournaments'
import { AutoRefresh } from '@/components/AutoRefresh'
import { BackLink } from '@/components/BackLink'
import { Button } from '@/components/Button'
import { GameCard } from '@/components/GameCard'
import { SceneTarget } from '@/components/scene/SceneTarget'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Games', description: 'Every free esports contest open for registration, soonest first.' }

const PER_PAGE = 12

type Search = { game?: string; page?: string }

export default async function GamesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { game = '', page: rawPage = '1' } = await searchParams
  const user = await getUser()
  // ponytail: loads every open contest and pages in memory, because the filter chips need the whole set anyway.
  // Open contests are a few dozen at most; move to skip/limit in listOpen if a college ever runs hundreds at once.
  const all = await openViews(user?.branch ?? null)
  const gameNames = [...new Set(all.map(g => g.gameName))].sort()
  const shown = game ? all.filter(g => g.gameName === game) : all
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE))
  const page = Math.min(pages, Math.max(1, Number(rawPage) || 1))
  const rows = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  // filter and page live in the URL, so a reload or a shared link lands on the same view
  const link = (over: Search) => {
    const p = new URLSearchParams({ ...(game ? { game } : {}), ...over } as Record<string, string>)
    if (p.get('page') === '1') p.delete('page')
    if (!p.get('game')) p.delete('game')
    return `/games${p.size ? `?${p}` : ''}`
  }
  const chip = 'inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold ring-1 ring-inset transition-colors duration-300'

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <SceneTarget shape="field" hue={null} />
      <AutoRefresh />

      <header className="flex flex-col items-start gap-3">
        <BackLink href="/">Home</BackLink>
        <h1 className="display text-4xl sm:text-5xl">Games</h1>
        <p className="num text-muted">
          {all.length === 0
            ? 'Nothing is open right now.'
            : `${all.length} ${all.length === 1 ? 'contest' : 'contests'} open${user?.branch ? ` for ${user.branch}` : ''}, soonest first. Entry is free.`}
        </p>
      </header>

      {/* only worth a row when there is something to choose between */}
      {gameNames.length > 1 && (
        <nav aria-label="Filter by game" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {['', ...gameNames].map(name => {
            const active = name === game
            return (
              <Link key={name || 'all'} href={link({ game: name, page: '1' })} aria-current={active ? 'page' : undefined}
                className={`${chip} ${active ? 'bg-accent text-ink ring-accent' : 'text-muted ring-line hover:text-text'}`}>
                {name || 'All'}
              </Link>
            )
          })}
        </nav>
      )}

      {all.length === 0 ? (
        <p className="max-w-[48ch] text-lg text-muted">
          {user?.branch
            ? `Contests show up here as soon as they are announced for ${user.branch}.`
            : 'New matches show up here as soon as they are announced.'}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-lg text-muted">No open {game} contests. <Link href="/games" className="text-text underline underline-offset-4">See every game</Link>.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map(g => <li key={g.slug} className="row-in"><GameCard game={g} /></li>)}
        </ul>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between gap-4" aria-label="Pages">
          <Button href={link({ page: String(page - 1) })} variant="secondary" disabled={page <= 1} className="px-5">Back</Button>
          <p className="num text-sm text-muted">Page {page} of {pages}</p>
          <Button href={link({ page: String(page + 1) })} variant="secondary" disabled={page >= pages} className="px-5">Next</Button>
        </nav>
      )}
    </div>
  )
}
