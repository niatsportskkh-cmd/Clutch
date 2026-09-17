import { SceneTarget } from '@/components/scene/SceneTarget'
import { AuthForm } from '../AuthForm'

export const metadata = { title: 'Reset password' }

export default function Page() {
  return <><SceneTarget shape="field" hue={null} /><AuthForm mode="forgot" /></>
}
