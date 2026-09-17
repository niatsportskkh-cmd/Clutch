'use server'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth'
import { registrationInput } from '@/lib/schemas'
import { claimSlot, getBySlug, type ClaimError } from '@/lib/tournaments'

// On failure the submitted values come back, because React resets an uncontrolled form after its action runs.
export type RegisterState = { ok: true } | { ok: false; error: string; teamName: string; names: string[]; ids: string[] } | null

const MESSAGES: Record<ClaimError, string> = {
  not_found: 'This game no longer exists.',
  invalid_roster: 'Fill in every player and the team name.',
  closed_or_full: 'Registration just closed, or the last slot was taken a moment ago.',
  already_registered: 'You are already registered for this game.',
}

export async function registerAction(slug: string, _prev: RegisterState, form: FormData): Promise<RegisterState> {
  const teamName = String(form.get('teamName') ?? '')
  const names = form.getAll('playerName').map(String), ids = form.getAll('playerId').map(String)
  const fail = (error: string): RegisterState => ({ ok: false, error, teamName, names, ids })

  const user = await getUser()
  if (!user) return fail('Your session expired. Log in again to register.')
  const parsed = registrationInput.safeParse({ teamName, players: names.map((name, i) => ({ name, inGameId: ids[i] ?? '' })) })
  if (!parsed.success) return fail(parsed.error.issues[0].message)
  const t = await getBySlug(slug)
  if (!t) return fail(MESSAGES.not_found)

  const res = await claimSlot(t._id, { id: user.id, email: user.email, phone: user.phone }, parsed.data)
  if (!res.ok) return fail(MESSAGES[res.error])
  revalidatePath('/', 'layout') // home list, this page (which now renders the confirmation), /me
  return { ok: true }
}
