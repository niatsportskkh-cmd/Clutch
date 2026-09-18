import { Button } from '@/components/Button'
import { SceneTarget } from '@/components/scene/SceneTarget'
import { AuthForm } from '../AuthForm'
import { BackLink } from '@/components/BackLink'

export const metadata = { title: 'New password' }

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams
  if (!token || error) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-start gap-5">
        <SceneTarget shape="field" hue={null} />
        <BackLink href="/login">Log in</BackLink>
        <h1 className="display text-4xl sm:text-5xl">Link expired</h1>
        <p className="text-lg text-muted">Reset links work once and expire after 1 hour. Request a fresh one.</p>
        <Button href="/forgot-password">Send a new link</Button>
      </div>
    )
  }
  return <><SceneTarget shape="field" hue={null} /><div className="mx-auto w-full max-w-md"><BackLink href="/login">Log in</BackLink></div><AuthForm mode="reset" token={token} /></>
}
