/** Runs once per server instance, before any request is served. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { ensureAdmin } = await import('./lib/bootstrap-admin.ts')
  // Never fatal: a database that is briefly unreachable at boot must not stop the site from starting.
  await ensureAdmin().catch(e => console.error('[clutch] admin bootstrap failed:', e instanceof Error ? e.message : e))
}
