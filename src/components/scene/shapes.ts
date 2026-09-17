import { GLYPH_PATHS } from '@/lib/games'
import type { Target } from './scene-store'

// Every generator returns count*3 floats in roughly a [-1.6, 1.6] box, with points in RANDOM order:
// the swarm halves its draw range on slow devices, and a prefix must stay a uniform subsample.

const TAU = Math.PI * 2
const rand = Math.random
const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(TAU * rand())

export function field(count: number) {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const x = gauss(), y = gauss(), z = gauss()
    const k = Math.cbrt(rand()) / (Math.hypot(x, y, z) || 1)
    out[i * 3] = x * k * 3.2; out[i * 3 + 1] = y * k * 1.9; out[i * 3 + 2] = z * k * 1.2
  }
  return out
}

// lathe profile [y, radius]: base, stem, knot, bowl, rim
const PROFILE = [[-1.5, 0.75], [-1.35, 0.75], [-1.3, 0.3], [-0.6, 0.14], [-0.45, 0.3], [-0.3, 0.14], [-0.1, 0.35], [0.4, 0.95], [1.3, 1.15], [1.38, 1.05]]

function trophy(count: number) {
  const out = new Float32Array(count * 3)
  const cum: number[] = []
  let total = 0
  for (let s = 0; s < PROFILE.length - 1; s++) {
    const [y0, r0] = PROFILE[s], [y1, r1] = PROFILE[s + 1]
    total += Math.hypot(y1 - y0, r1 - r0) * (r0 + r1) // area of a cone frustum is proportional to this
    cum.push(total)
  }
  for (let i = 0; i < count; i++) {
    const pick = rand()
    let x: number, y: number, z: number
    if (pick < 0.14) { // two handles: tilted half-ellipses meeting the bowl
      const side = rand() < 0.5 ? -1 : 1, a = -1.97 + rand() * 3.54
      x = side * (0.95 + Math.cos(a) * 0.55) + gauss() * 0.035
      y = 0.72 + Math.sin(a) * 0.5 + gauss() * 0.035
      z = gauss() * 0.04
    } else if (pick < 0.2) { // sparse surface inside the rim
      const r = Math.sqrt(rand()) * 1.12, a = rand() * TAU
      x = Math.cos(a) * r; y = 1.3; z = Math.sin(a) * r
    } else {
      const w = rand() * total
      let s = 0
      while (cum[s] < w) s++
      const t = rand(), a = rand() * TAU
      const r = PROFILE[s][1] + (PROFILE[s + 1][1] - PROFILE[s][1]) * t
      x = Math.cos(a) * r; y = PROFILE[s][0] + (PROFILE[s + 1][0] - PROFILE[s][0]) * t; z = Math.sin(a) * r
    }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z
  }
  return out
}

/** Rasterise a 100x100 SVG path and scatter points over its filled pixels. */
function fromPath({ d, stroke }: { d: string; stroke?: number }, count: number, depth = 0.22) {
  const N = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = N
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  if (!ctx) return field(count)
  ctx.scale(N / 100, N / 100)
  const path = new Path2D(d)
  if (stroke) {
    ctx.lineWidth = stroke; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff'
    ctx.stroke(path)
  } else {
    ctx.fillStyle = '#fff'
    ctx.fill(path, 'evenodd')
  }
  const alpha = ctx.getImageData(0, 0, N, N).data
  const filled: number[] = []
  let x0 = N, x1 = 0, y0 = N, y1 = 0
  for (let p = 0; p < N * N; p++) {
    if (alpha[p * 4 + 3] <= 128) continue
    filled.push(p)
    const x = p % N, y = (p / N) | 0
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
  }
  if (!filled.length) return field(count)

  // fit the drawn bounds to a 3-unit box so every glyph has the same visual weight
  const k = 3 / Math.max(x1 - x0 + 1, y1 - y0 + 1), cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const p = filled[(rand() * filled.length) | 0]
    out[i * 3] = ((p % N) + rand() - cx) * k
    out[i * 3 + 1] = -(((p / N) | 0) + rand() - cy) * k
    out[i * 3 + 2] = (rand() - 0.5) * depth
  }
  return out
}

/** The live slot ring: taken slots are dense blobs, free slots are faint hollow circles. */
function slots(taken: number, max: number, count: number) {
  const out = new Float32Array(count * 3)
  const R = 1.35
  if (max <= 64) {
    const s = Math.min(0.12, (TAU * R / max) * 0.22)
    const W = Math.min(5, Math.max(2, max / 5)) // few big slots need less packing or the blobs burn out to white
    const weightTaken = W * taken, totalW = weightTaken + (max - taken)
    for (let i = 0; i < count; i++) {
      const w = rand() * totalW
      const isTaken = w < weightTaken
      const slot = isTaken ? (w / W) | 0 : taken + ((w - weightTaken) | 0)
      const a = Math.PI / 2 - (slot / max) * TAU // start at 12 o'clock, clockwise
      let dx: number, dy: number
      if (isTaken) { dx = gauss() * s; dy = gauss() * s }
      else { const b = rand() * TAU; dx = Math.cos(b) * s * 1.5 + gauss() * 0.006; dy = Math.sin(b) * s * 1.5 + gauss() * 0.006 }
      out[i * 3] = Math.cos(a) * R + dx; out[i * 3 + 1] = Math.sin(a) * R + dy; out[i * 3 + 2] = gauss() * (isTaken ? s : 0.01)
    }
  } else { // too many to read individually: a gauge arc
    const frac = taken / max
    for (let i = 0; i < count; i++) {
      const inTaken = rand() < (frac > 0 ? 0.8 : 0)
      const u = inTaken ? rand() * frac : frac + rand() * (1 - frac)
      const a = Math.PI / 2 - u * TAU, r = R + gauss() * (inTaken ? 0.09 : 0.02)
      out[i * 3] = Math.cos(a) * r; out[i * 3 + 1] = Math.sin(a) * r; out[i * 3 + 2] = gauss() * (inTaken ? 0.06 : 0.01)
    }
  }
  return out
}

const cache = new Map<string, Float32Array>()

export function shapeFor(t: Target, count: number) {
  const key = `${count}:${t.shape}:${t.shape === 'slots' ? `${t.slots?.taken}/${t.slots?.max}` : ''}`
  let pts = cache.get(key)
  if (!pts) {
    if (t.shape === 'trophy') pts = trophy(count)
    else if (t.shape === 'field') pts = field(count)
    else if (t.shape === 'slots') pts = slots(t.slots?.taken ?? 0, Math.max(1, t.slots?.max ?? 1), count)
    else pts = fromPath(GLYPH_PATHS[t.shape], count)
    if (cache.size > 40) cache.clear() // slot counts change over a long session; never grow without bound
    cache.set(key, pts)
  }
  return pts
}
