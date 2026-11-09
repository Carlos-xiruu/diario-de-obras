import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return response

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isPwaAsset = request.nextUrl.pathname === '/manifest.json'
    || request.nextUrl.pathname === '/sw.js'
    || request.nextUrl.pathname.startsWith('/workbox-')
    || request.nextUrl.pathname === '/og-image.png'
    || request.nextUrl.pathname === '/favicon.ico'

  if (!claims && !isLoginPage && !isPwaAsset && request.nextUrl.pathname !== '/api/auth/login' && request.nextUrl.pathname !== '/api/auth/logout') {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    const redirect = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    for (const header of ['cache-control', 'expires', 'pragma']) {
      const value = response.headers.get(header)
      if (value) redirect.headers.set(header, value)
    }
    return redirect
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
