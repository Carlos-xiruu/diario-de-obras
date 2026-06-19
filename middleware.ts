import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Atualiza os cookies na requisição e na resposta para garantir consistência
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Logs para debug na Vercel
  console.log("Middleware - Usuário encontrado:", !!user);

  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  // Se NÃO está logado e NÃO está na página de login, redireciona para login
  if (!user && !isLoginPage) {
    console.log("Middleware - Bloqueado: Não logado, indo para login");
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Se ESTÁ logado e está na página de login, redireciona para home
  if (user && isLoginPage) {
    console.log("Middleware - Bloqueado: Já logado, indo para home");
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}