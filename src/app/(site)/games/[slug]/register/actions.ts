'use server'
import { ObjectId } from 'mongodb'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth'
import { teamInput } from '@/lib/schemas'
import { registerTeam, editTeam, getBySlug, type TeamError } from '@/lib/tournaments'

// On failure the submitted values come back, because React resets an uncontrolled form after its action runs.
export type RegisterState = { ok: true } | { ok: false; error: string; teamName: string; collegeIds: string[]; inGameIds: string[] } | null

/** Every message names the player or the college at fault: "invalid roster" is a dead end for a captain. */
function message(e: TeamError): string {
  switch (e.code) {
    case 'not_found': return 'This contest no longer exists.'
    case 'closed': return 'Registration just closed for this contest.'
    case 'no_college': return 'Your account has no college on it. Ask the organisers to check the student list.'
    case 'not_your_college': return `This contest is not open to ${e.branch}.`
    case 'bad_roster': return e.message
    case 'unknown_player': return `${e.collegeId} is not on the student list. Check the number, or ask the organisers to add them.`
    case 'wrong_college': return `${e.name} (${e.collegeId}) is from ${e.branch}. Every player has to be from your own college.`
    case 'duplicate_player': return `${e.collegeId} is in the team twice.`
    case 'already_registered': return `${e.name} (${e.collegeId}) is already playing this contest for ${e.teamName}.`
  }
}

/** teamId set = the captain editing an existing team; null = a new registration. Both run the same checks. */
export async function registerAction(slug: string, teamId: string | null, _prev: RegisterState, form: FormData): Promise<RegisterState> {
  const teamName = String(form.get('teamName') ?? '')
  const collegeIds = form.getAll('collegeId').map(String)
  const inGameIds = form.getAll('inGameId').map(String)
  const fail = (error: string): RegisterState => ({ ok: false, error, teamName, collegeIds, inGameIds })

  const user = await getUser()
  if (!user) return fail('Your session expired. Log in again to register.')
  const parsed = teamInput.safeParse({ teamName, players: collegeIds.map((collegeId, i) => ({ collegeId, inGameId: inGameIds[i] ?? '' })) })
  if (!parsed.success) return fail(parsed.error.issues[0].message)
  const t = await getBySlug(slug)
  if (!t) return fail('This contest no longer exists.')

  const captain = { id: user.id, name: user.name, email: user.email, phone: user.phone, collegeId: user.collegeId, branch: user.branch }
  const res = teamId && ObjectId.isValid(teamId)
    ? await editTeam(new ObjectId(teamId), captain, parsed.data)
    : await registerTeam(t._id, captain, parsed.data)
  if (!res.ok) return fail(message(res.error))
  revalidatePath('/', 'layout') // home list, this page (which now renders the confirmation), /me
  return { ok: true }
}
