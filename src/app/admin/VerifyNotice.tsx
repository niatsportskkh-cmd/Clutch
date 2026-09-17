'use client'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/Button'

export function VerifyNotice({ email }: { email: string }) {
  const [sent, setSent] = useState(false)
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-start gap-5">
      <h1 className="display text-4xl sm:text-5xl">Verify your email</h1>
      <p className="text-lg text-muted">
        {email} is on the admin list, but admin access stays locked until the address is verified. Otherwise anyone could sign up with your email first and get the panel.
      </p>
      <Button disabled={sent} onClick={async () => { await authClient.sendVerificationEmail({ email, callbackURL: '/admin' }); setSent(true) }}>
        {sent ? 'Link sent, check your inbox' : 'Send verification link'}
      </Button>
    </div>
  )
}
