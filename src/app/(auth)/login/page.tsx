import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { ensureAdmin } from '@/lib/bootstrap-admin'
import { safeNext } from '@/lib/safe-next'
import { SceneTarget } from '@/components/scene/SceneTarget'
import { AuthForm } from '../AuthForm'

export const metadata = { title: 'Log in' }

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const { next, reset } = await searchParams
  // Belt and braces with instrumentation: whatever the platform does at startup, the page you need
  // the admin on is this one, and this runs at most once per server instance.
  await ensureAdmin()
  if (await getUser()) redirect(safeNext(next))
  return (
    <>
      <SceneTarget shape="field" hue={null} />
      {reset && <p role="status" className="mx-auto mb-6 w-full max-w-md rounded-xl bg-volt/10 px-4 py-3 text-volt ring-1 ring-inset ring-volt/30">Password saved. Log in with the new one.</p>}
      <AuthForm mode="login" next={next} />
    </>
  )
}
