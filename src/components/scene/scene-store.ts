import type { Glyph } from '@/lib/schemas'

export type Shape = 'trophy' | 'field' | 'slots' | 'check' | Glyph
export type Target = { shape: Shape; hue: number | null; slots?: { taken: number; max: number }; burst?: boolean }

// Module-level store: the swarm is imperative and lives outside React, so React state would only get in the way.
let base: Target = { shape: 'field', hue: null }
let override: { t: Target; owner: object } | null = null
const subs = new Set<(t: Target) => void>()
const emit = () => subs.forEach(f => f(getTarget()))

export const getTarget = () => override?.t ?? base

/** The page's resting target. Clears any hover/in-view override left by the previous page. */
export const setBase = (t: Target) => { base = t; override = null; emit() }

/** Temporary target (hover, section in view). Only the owner that set it can clear it. */
export const setOverride = (t: Target | null, owner: object) => {
  if (t) override = { t, owner }
  else if (override?.owner === owner) override = null
  else return
  emit()
}

export const subscribe = (f: (t: Target) => void) => { subs.add(f); return () => { subs.delete(f) } }
