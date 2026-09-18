import { SceneTarget } from '@/components/scene/SceneTarget'
import { AuthForm } from '../AuthForm'
import { BackLink } from '@/components/BackLink'

export const metadata = { title: 'Reset password' }

export default function Page() {
  return <><SceneTarget shape="field" hue={null} /><div className="mx-auto w-full max-w-md"><BackLink href="/login">Log in</BackLink></div><AuthForm mode="forgot" /></>
}
