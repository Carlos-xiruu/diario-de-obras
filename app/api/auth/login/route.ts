import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return NextResponse.json({ error: 'Configuração do Supabase indisponível.' }, { status: 500 })

  const { email, password } = await request.json() as { email?: string; password?: string }
  const response = NextResponse.json({ ok: true })
  const supabase = createServerClient(url, anonKey, {
    cookieOptions: { secure: false },
    cookies: {
      getAll: () => [],
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { error } = await supabase.auth.signInWithPassword({ email: email ?? '', password: password ?? '' })
  if (error) return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 })
  return response
}
