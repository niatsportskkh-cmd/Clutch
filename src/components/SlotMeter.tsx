/** Slots as pips that mirror the particle ring: filled = taken. Past 32 slots pips stop being countable, so it becomes a bar. */
export function SlotMeter({ taken, max, className = '' }: { taken: number; max: number; className?: string }) {
  const left = Math.max(0, max - taken)
  return (
    <div className={className}>
      <div role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={taken} aria-label={`${taken} of ${max} slots taken`}>
        {max <= 32 ? (
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: max }, (_, i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-[3px] transition-colors duration-700 ${i < taken ? 'bg-accent' : 'ring-1 ring-inset ring-accent/40'}`} />
            ))}
          </div>
        ) : (
          <div className="h-2.5 rounded-full ring-1 ring-inset ring-accent/40">
            <div className="h-full rounded-full bg-accent transition-[width] duration-700 ease-spring" style={{ width: `${(taken / max) * 100}%` }} />
          </div>
        )}
      </div>
      <p className="num mt-2 flex items-baseline justify-between text-sm">
        <span className="text-muted">{taken} of {max} taken</span>
        <span className="font-semibold text-text">{left === 0 ? 'Full' : `${left} left`}</span>
      </p>
    </div>
  )
}
