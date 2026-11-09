
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function getSupabaseClient(): SupabaseClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('A configuração pública do Supabase não está disponível.')
  }

  client = createBrowserClient(url, anonKey)
  return client
}

// Keep existing client-side call sites working while avoiding a build-time client
// construction when deployment environment variables are not present locally.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    return Reflect.get(getSupabaseClient(), property, receiver)
  },
})
