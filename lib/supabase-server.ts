import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('A configuração pública do Supabase não está disponível.')

  const cookieStore = await cookies()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // Route handlers for this flow do not refresh the session.
      },
    },
  })
}

export async function requireCatalogAdmin() {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { supabase, error: 'Autenticação necessária.' }

  const { data: acesso, error } = await supabase
    .from('acessos_usuario')
    .select('papel, ativo')
    .maybeSingle()

  if (error || !acesso?.ativo || acesso.papel !== 'administrador') {
    return { supabase, error: 'Apenas administradores autorizados podem importar catálogos.' }
  }
  return { supabase, error: null }
}

export async function requireAuthorizedUser() {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { supabase, error: 'Autenticação necessária.' }

  const { data: acesso, error } = await supabase
    .from('acessos_usuario')
    .select('ativo')
    .maybeSingle()

  if (error || !acesso?.ativo) return { supabase, error: 'Usuário sem autorização para acessar relatórios.' }
  return { supabase, error: null }
}
