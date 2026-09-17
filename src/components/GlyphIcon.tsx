import { GLYPH_PATHS } from '@/lib/games'
import type { Glyph } from '@/lib/schemas'

/** The same path data the particle swarm is sampled from, so the icon and the 3D shape always match. */
export function GlyphIcon({ glyph, size = 40, className = '' }: { glyph: Glyph; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className={className}>
      <path d={GLYPH_PATHS[glyph].d} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}
