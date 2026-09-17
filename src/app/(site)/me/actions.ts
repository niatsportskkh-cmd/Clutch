'use server'
import { ObjectId } from 'mongodb'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth'
import { cancelRegistration } from '@/lib/tournaments'

export async function cancelAction(form: FormData) {
  const user = await getUser()
  const id = String(form.get('id') ?? '')
  if (!user || !ObjectId.isValid(id)) return
  await cancelRegistration(new ObjectId(id), user.id) // ownership and the deadline are enforced inside
  revalidatePath('/', 'layout')
}
