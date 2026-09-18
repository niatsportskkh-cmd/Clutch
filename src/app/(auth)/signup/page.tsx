import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { safeNext } from '@/lib/safe-next'
import { SceneTarget } from '@/components/scene/SceneTarget'
import { AuthForm } from '../AuthForm'
import { BackLink } from '@/components/BackLink'

export const metadata = { title: 'Sign up' }

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const { next, reset } = await searchParams
  if (await getUser()) redirect(safeNext(next))
  return (
    <>
      <SceneTarget shape="field" hue={null} />
      <div className="mx-auto w-full max-w-md"><BackLink href="/">Home</BackLink></div>
      {reset && <p role="status" className="mx-auto mb-6 w-full max-w-md rounded-xl bg-white/5 px-4 py-3 text-text ring-1 ring-inset ring-white/20">Password saved. Log in with the new one.</p>}
      <AuthForm mode="signup" next={next} />
    </>
  )
}
