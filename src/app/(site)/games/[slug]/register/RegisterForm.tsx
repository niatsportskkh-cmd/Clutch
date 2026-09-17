'use client'
import { useActionState, type CSSProperties } from 'react'
import { Button } from '@/components/Button'
import { Field } from '@/components/Field'
import { registerAction, type RegisterState } from './actions'

type Props = { slug: string; teamSize: number; captain: string; idHint: string }

export function RegisterForm({ slug, teamSize, captain, idHint }: Props) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerAction.bind(null, slug), null)
  const kept = state && !state.ok ? state : null

  return (
    <form action={action} className="flex flex-col gap-8">
      {teamSize > 1 && (
        <Field label="Team name" name="teamName" required maxLength={40} autoComplete="off" defaultValue={kept?.teamName} placeholder="What should we call your team?" />
      )}
      <fieldset className="stagger flex flex-col gap-6">
        <legend className="sr-only">Players</legend>
        {Array.from({ length: teamSize }, (_, i) => (
          <div key={i} style={{ '--i': i } as CSSProperties}>
            <p className="mb-3 font-semibold text-text">
              {teamSize === 1 ? 'Player' : i === 0 ? 'Captain' : `Player ${i + 1}`}
              {i === 0 && teamSize > 1 && <span className="ml-2 text-sm font-normal text-muted">That is you</span>}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" name="playerName" required minLength={2} maxLength={40} autoComplete={i === 0 ? 'name' : 'off'} defaultValue={kept?.names[i] ?? (i === 0 ? captain : '')} />
              <Field label="In-game ID" name="playerId" required minLength={2} maxLength={40} autoComplete="off" autoCapitalize="off" spellCheck={false} defaultValue={kept?.ids[i]} placeholder={idHint} />
            </div>
          </div>
        ))}
      </fieldset>
      <div className="flex flex-col gap-3">
        <p aria-live="polite" className={`min-h-6 text-danger ${kept ? '' : 'invisible'}`}>{kept?.error}</p>
        <Button type="submit" disabled={pending} className="self-start px-8">{pending ? 'Claiming your slot' : 'Claim my slot'}</Button>
      </div>
    </form>
  )
}
