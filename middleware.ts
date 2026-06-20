import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // --- CONFIGURAÇÃO DE EXCEÇÕES PÚBLICAS ---
  const isVisualizarPage = pathname.startsWith('/visualizar');
  const isLoginPage = pathname === '/login';
  
  // Nova regra: Libera os arquivos vitais que o celular precisa ler para poder instalar o PWA
  const isPWAAssets = pathname === '/manifest.json' || 
                      pathname === '/sw.js' || 
                      pathname.startsWith('/workbox-') ||
                      pathname === '/og-image.png' ||
                      pathname === '/favicon.ico';

  if (!user && !isVisualizarPage && !isLoginPage && !isPWAAssets) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};