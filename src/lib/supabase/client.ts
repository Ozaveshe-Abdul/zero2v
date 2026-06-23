import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fallback to placeholder strings during build/prerendering when env variables aren't injected
  return createBrowserClient(
    url || 'https://placeholder-project.supabase.co',
    anonKey || 'placeholder-anon-key'
  )
}
