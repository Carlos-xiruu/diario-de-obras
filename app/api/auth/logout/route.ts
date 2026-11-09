import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return NextResponse.json({ error: 'Configuração do Supabase indisponível.' }, { status: 500 })

  const response = NextResponse.json({ ok: true })
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.headers.get('cookie')?.split(/;\s*/).map((entry) => {
        const [name, ...parts] = entry.split('=')
        return { name, value: parts.join('=') }
      }) ?? [],
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  })
  await supabase.auth.signOut()
  return response
}
