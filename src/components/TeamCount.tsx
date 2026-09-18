/** No cap on teams, so there is nothing to be a fraction of: the count itself is the news, with a live dot while entries are open. */
export function TeamCount({ teams, open, className = '' }: { teams: number; open: boolean; className?: string }) {
  return (
    <p className={`num flex items-baseline gap-2 ${className}`}>
      <span className="text-2xl font-semibold text-text">{teams}</span>
      <span className="text-sm text-muted">{teams === 1 ? 'team in' : 'teams in'}</span>
      {open && (
        <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Open
        </span>
      )}
    </p>
  )
}
