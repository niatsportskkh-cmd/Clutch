import { requireAdmin } from '@/lib/admin'
import { listBranches } from '@/lib/branches'
import { PRESETS } from '@/lib/games'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Panel'
import { TournamentForm } from '../../TournamentForm'

export default async function NewGame() {
  await requireAdmin()
  const p = PRESETS.bgmi
  const colleges = (await listBranches()).map(b => ({ name: b.name, location: b.location }))
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Button href="/admin" variant="ghost" className="self-start px-3">All games</Button>
      <h1 className="display text-4xl sm:text-5xl">Add game</h1>
      <Panel inner="p-5 sm:p-7">
        <TournamentForm id={null} locked={false} colleges={colleges} initial={{
          game: 'bgmi', gameName: p.gameName, title: '', mode: '', glyph: p.glyph, hue: p.hue, startsAt: '', regClosesAt: '',
          teamSize: p.teamSize, branches: [], requireInGameId: true, rules: '', prize: '', status: 'open',
        }} />
      </Panel>
    </div>
  )
}
