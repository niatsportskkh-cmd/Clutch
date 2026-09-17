/** Runs once per server instance, before any request is served. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { ensureAdmin } = await import('./lib/bootstrap-admin.ts')
  await ensureAdmin() // never throws: it logs and lets the next request retry
}
