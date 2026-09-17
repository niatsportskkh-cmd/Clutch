'use server'
import { ObjectId } from 'mongodb'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { tournamentInput, roomInput, STATUSES } from '@/lib/schemas'
import { saveTournament, deleteTournament, setStatus, setRoom, recountSlots, cancelRegistration } from '@/lib/tournaments'

// Every export re-checks admin itself. The layout guard only protects rendering; actions are separate POST endpoints.
export type FormState = { ok: false; error: string; values?: Record<string, string> } | { ok: true; message: string } | null
const oid = (v: FormDataEntryValue | string | null) => (ObjectId.isValid(String(v)) ? new ObjectId(String(v)) : null)
const fresh = () => revalidatePath('/', 'layout')

export async function saveTournamentAction(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin()
  const values = Object.fromEntries([...form].map(([k, v]) => [k, String(v)]))
  const parsed = tournamentInput.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message, values }
  const _id = id ? oid(id) : null
  if (id && !_id) return { ok: false, error: 'Bad id', values } // never fall through to "create" on a mangled id
  const res = await saveTournament(_id, parsed.data)
  if (!res.ok) return { ...res, values }
  fresh()
  if (!id) redirect(`/admin/games/${res.id.toHexString()}`)
  return { ok: true, message: 'Saved.' }
}

export async function setStatusAction(form: FormData) {
  await requireAdmin()
  const id = oid(form.get('id')), status = STATUSES.find(s => s === form.get('status'))
  if (id && status) { await setStatus(id, status); fresh() }
}

export async function publishRoomAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin()
  const _id = oid(id)
  if (!_id) return { ok: false, error: 'Bad id' }
  if (form.get('intent') === 'unpublish') { await setRoom(_id, null); fresh(); return { ok: true, message: 'Room details hidden from players.' } }
  const parsed = roomInput.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  await setRoom(_id, parsed.data)
  fresh()
  return { ok: true, message: 'Published. Registered players can see it now.' }
}

export async function removeRegistrationAction(form: FormData) {
  await requireAdmin()
  const id = oid(form.get('id'))
  if (id) { await cancelRegistration(id, null); fresh() }
}

export async function recountAction(form: FormData) {
  await requireAdmin()
  const id = oid(form.get('id'))
  if (id) { await recountSlots(id); fresh() }
}

export async function deleteTournamentAction(form: FormData) {
  await requireAdmin()
  const id = oid(form.get('id'))
  if (id && (await deleteTournament(id))) { fresh(); redirect('/admin') }
}
