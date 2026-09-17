import { requireAdmin } from '@/lib/admin'
import { toCsv } from '@/lib/csv'
import { formatIst } from '@/lib/time'
import { getById, listRegistrations } from '@/lib/tournaments'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const t = await getById((await params).id)
  if (!t) return new Response('Not found', { status: 404 })
  const regs = await listRegistrations(t._id)
  const head = ['#', 'Code', 'Team', 'Captain', 'Phone', 'Email', 'Registered',
    ...Array.from({ length: t.teamSize }, (_, i) => [`Player ${i + 1}`, `In-game ID ${i + 1}`]).flat()]
  const rows = regs.map((r, i) => [i + 1, r.code, r.teamName ?? '', r.players[0].name, r.phone, r.email, formatIst(r.createdAt),
    ...r.players.flatMap(p => [p.name, p.inGameId])])
  // BOM so Excel reads UTF-8 names correctly
  return new Response('﻿' + toCsv([head, ...rows]), {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${t.slug}.csv"`, 'cache-control': 'no-store' },
  })
}
