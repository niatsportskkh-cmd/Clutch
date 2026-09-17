import { getUser } from '@/lib/auth'
import { isUnverifiedAdmin, requireAdmin } from '@/lib/admin'
import { SceneTarget } from '@/components/scene/SceneTarget'
import { VerifyNotice } from './VerifyNotice'

export const metadata = { title: 'Admin', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (isUnverifiedAdmin(user)) return <VerifyNotice email={user!.email} />
  await requireAdmin() // everyone else gets a 404: the panel's existence is not advertised
  return <><SceneTarget shape="field" hue={null} />{children}</>
}
