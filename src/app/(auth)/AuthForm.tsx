'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { authClient } from '@/lib/auth-client'
import { safeNext } from '@/lib/safe-next'
import { hasAccount } from './actions'
import { Button } from '@/components/Button'
import { Field } from '@/components/Field'
import { Panel } from '@/components/Panel'

type Mode = 'login' | 'signup' | 'forgot' | 'reset'
const COPY: Record<Mode, { title: string; submit: string; busy: string }> = {
  login: { title: 'Log in', submit: 'Log in', busy: 'Logging in' },
  signup: { title: 'Sign up', submit: 'Create account', busy: 'Creating account' },
  forgot: { title: 'Reset password', submit: 'Send reset link', busy: 'Sending' },
  reset: { title: 'New password', submit: 'Save password', busy: 'Saving' },
}

export function AuthForm({ mode, next, token }: { mode: Mode; next?: string; token?: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const dest = safeNext(next)
  const withNext = (path: string) => (next ? `${path}?next=${encodeURIComponent(dest)}` : path)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setError(''); setBusy(true)
    const noAccount = 'No account with this email yet — sign up below.'

    // A reset always reports success, so the only way to tell the user their email is unknown is to look first.
    if (mode === 'forgot' && !(await hasAccount(f.email))) {
      setBusy(false)
      return setError(noAccount)
    }
    const res =
      mode === 'login' ? await authClient.signIn.email({ email: f.email, password: f.password })
      : mode === 'signup' ? await authClient.signUp.email({ name: f.name, email: f.email, phone: f.phone, collegeId: f.collegeId, password: f.password })
      : mode === 'forgot' ? await authClient.requestPasswordReset({ email: f.email, redirectTo: '/reset-password' })
      : await authClient.resetPassword({ newPassword: f.password, token: token ?? '' })
    setBusy(false)
    if (res.error) {
      // One code covers both halves of a failed login; ask which it was only once we know it failed.
      if (mode === 'login' && res.error.code === 'INVALID_EMAIL_OR_PASSWORD')
        return setError((await hasAccount(f.email)) ? 'Wrong password. Try again, or reset it below.' : noAccount)
      return setError(res.error.message ?? 'That did not work. Try again.')
    }
    if (mode === 'forgot') return setNotice(`Reset link sent to ${f.email}. It expires in 1 hour.`)
    if (mode === 'reset') return router.push('/login?reset=1')
    router.push(dest)
    router.refresh() // the nav is a server component: re-render it with the new session
  }

  const c = COPY[mode]
  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="display mb-6 text-4xl sm:text-5xl">{c.title}</h1>
      <Panel inner="p-5 sm:p-7">
        {notice ? (
          <p role="status" className="text-lg text-text">{notice}</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-5">
            {mode === 'signup' && <Field label="Name" name="name" required minLength={2} maxLength={60} autoComplete="name" />}
            {mode !== 'reset' && <Field label="Email" name="email" type="email" required autoComplete="email" inputMode="email" />}
            {mode === 'signup' && (
              <>
                <Field label="College ID number" name="collegeId" required minLength={3} maxLength={24} autoComplete="off" autoCapitalize="characters" spellCheck={false}
                  placeholder="2203A51234" hint="Exactly as the college has it. Your account is only created if it matches the student list." />
                <Field label="WhatsApp number" name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="98765 43210"
                  hint="Has to be the number the college has on file for that ID. No OTP, no verification." />
              </>
            )}
            {mode !== 'forgot' && (
              <Field label={mode === 'reset' ? 'New password' : 'Password'} name="password" type="password" required minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} hint={mode === 'login' ? undefined : 'At least 8 characters.'} />
            )}
            <p aria-live="polite" className={`text-danger ${error ? '' : 'hidden'}`}>{error}</p>
            <Button type="submit" disabled={busy}>{busy ? c.busy : c.submit}</Button>
          </form>
        )}
      </Panel>
      <p className="mt-5 text-muted">
        {mode === 'login' && <>New here? <Link className="font-semibold text-text underline underline-offset-4" href={withNext('/signup')}>Sign up</Link>. Or <Link className="font-semibold text-text underline underline-offset-4" href="/forgot-password">reset your password</Link>.</>}
        {mode === 'signup' && <>Already have an account? <Link className="font-semibold text-text underline underline-offset-4" href={withNext('/login')}>Log in</Link>. Not on the student list yet? Ask the organisers to add you.</>}
        {(mode === 'forgot' || mode === 'reset') && <>Remembered it? <Link className="font-semibold text-text underline underline-offset-4" href="/login">Log in</Link>.</>}
      </p>
    </div>
  )
}
