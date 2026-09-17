/**
 * Runs once per server instance, before it accepts a request. Every cold start retries, so a database
 * that was briefly unreachable does not mean no admin until the next deploy.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { createEnvAdmin } = await import('./lib/admin-bootstrap.ts')
  await createEnvAdmin().catch(e => console.error('[clutch] admin bootstrap failed:', e instanceof Error ? e.message : e))
}
