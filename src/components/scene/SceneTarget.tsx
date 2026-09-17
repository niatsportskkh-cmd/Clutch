'use client'
import { useEffect, useMemo, useRef, type FocusEvent, type PointerEvent, type ReactNode } from 'react'
import { addStage, setBase, setOverride, type Shape, type Target } from './scene-store'

type Props = { shape: Shape; hue: number | null; teams?: number; burst?: boolean }
const toTarget = ({ shape, hue, teams, burst }: Props): Target => ({ shape, hue, burst, teams })

/** Declares the page's resting swarm target. Props are primitives so the effect only fires on real changes. */
export function SceneTarget(p: Props) {
  useEffect(() => { setBase(toTarget(p)) }, [p.shape, p.hue, p.teams, p.burst]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

/**
 * An empty box the swarm flies into and scales to fit. Give it a size with CSS.
 * With a shape it also retargets the swarm while it is the most visible stage (e.g. the slot ring).
 */
export function SceneStage({ className, ...p }: Partial<Props> & { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(
    () => addStage(ref.current!, p.shape ? toTarget(p as Props) : null),
    [p.shape, p.hue, p.teams], // eslint-disable-line react-hooks/exhaustive-deps
  )
  return <div ref={ref} aria-hidden className={`stage ${className ?? ''}`} />
}

/** While this block is in the middle of the screen, the swarm shows its target instead of the page's (e.g. the live slot ring). */
export function SceneFocus({ children, className, ...p }: Props & { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const owner = {}
    // active only while the block crosses the middle third of the viewport, so it never fires just because it fits on screen at load
    const io = new IntersectionObserver(([e]) => setOverride(e.isIntersecting ? toTarget(p) : null, owner), { rootMargin: '-35% 0px -35% 0px' })
    io.observe(ref.current!)
    return () => { io.disconnect(); setOverride(null, owner) }
  }, [p.shape, p.hue, p.teams]) // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={ref} className={className}>{children}</div>
}

/**
 * Hover/focus handlers that point the swarm at something. Mouse and keyboard only: a touch also fires
 * pointerenter, and phones already retarget through GameList's stage. Checked per event, not by media
 * query, so touch-screen laptops work with either input.
 */
export function useSceneHover(shape: Shape, hue: number | null) {
  return useMemo(() => {
    const owner = {}
    const on = () => setOverride({ shape, hue }, owner)
    const off = () => setOverride(null, owner)
    return {
      onPointerEnter: (e: PointerEvent) => { if (e.pointerType === 'mouse') on() },
      onPointerLeave: off,
      onFocus: (e: FocusEvent) => { if (e.target.matches(':focus-visible')) on() },
      onBlur: off,
    }
  }, [shape, hue])
}
