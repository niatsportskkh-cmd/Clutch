'use client'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { setBase, setOverride, type Shape, type Target } from './scene-store'

type Props = { shape: Shape; hue: number | null; taken?: number; max?: number; burst?: boolean }
const toTarget = ({ shape, hue, taken, max, burst }: Props): Target =>
  ({ shape, hue, burst, slots: max ? { taken: taken ?? 0, max } : undefined })

/** Declares the page's resting swarm target. Props are primitives so the effect only fires on real changes. */
export function SceneTarget(p: Props) {
  useEffect(() => { setBase(toTarget(p)) }, [p.shape, p.hue, p.taken, p.max, p.burst]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

/** Overrides the swarm target while this section is at least half in view. */
export function SceneZone({ children, className, ...p }: Props & { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const owner = {}
    const io = new IntersectionObserver(([e]) => setOverride(e.isIntersecting ? toTarget(p) : null, owner), { threshold: 0.5 })
    io.observe(ref.current!)
    return () => { io.disconnect(); setOverride(null, owner) }
  }, [p.shape, p.hue, p.taken, p.max]) // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={ref} className={className}>{children}</div>
}

/** Hover/focus handlers that point the swarm at something. Pointer-hover devices only; touch uses GameList's observer. */
export function useSceneHover(shape: Shape, hue: number | null) {
  return useMemo(() => {
    const owner = {}
    const on = () => { if (matchMedia('(hover: hover)').matches) setOverride({ shape, hue }, owner) }
    const off = () => setOverride(null, owner)
    return { onPointerEnter: on, onPointerLeave: off, onFocus: on, onBlur: off }
  }, [shape, hue])
}
