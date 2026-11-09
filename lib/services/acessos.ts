import { getSupabaseClient } from '@/lib/supabase'
import type { AcessoUsuario } from '@/lib/types'

export async function buscarAcessoAtual(): Promise<AcessoUsuario | null> {
  const { data, error } = await getSupabaseClient()
    .from('acessos_usuario')
    .select('user_id, papel, ativo')
    .maybeSingle()

  if (error) throw error
  return data as AcessoUsuario | null
}
