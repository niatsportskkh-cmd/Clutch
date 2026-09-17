import Link from 'next/link'
import { getUser } from '@/lib/auth'
import { isAdmin } from '@/lib/users'
import { SignOutButton } from './SignOutButton'

const item = 'whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors duration-300 hover:bg-white/[0.07] hover:text-text'

/** A floating pill, detached from the top edge. One row at every width: no hamburger needed for four links. */
export async function Nav() {
  const user = await getUser()
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3 sm:pt-5">
      <nav aria-label="Main" className="pointer-events-auto flex h-14 w-full max-w-3xl items-center gap-1 rounded-full bg-ink/85 pr-2 pl-5 ring-1 ring-white/10 backdrop-blur-xl">
        <Link href="/" className="display mr-auto text-xl text-text">Clutch</Link>
        <Link href="/#games" className={`${item} max-sm:hidden`}>Games</Link>
        {user ? (
          <>
            <Link href="/me" className={item}>My games</Link>
            {isAdmin(user) && <Link href="/admin" className={item}>Admin</Link>}
            <SignOutButton className={`${item} max-sm:hidden`} />
          </>
        ) : (
          <>
            <Link href="/login" className={item}>Log in</Link>
            <Link href="/signup" className="whitespace-nowrap rounded-full bg-volt px-4 py-2 text-sm font-semibold text-ink transition-transform duration-500 ease-spring active:scale-[0.97]">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  )
}
