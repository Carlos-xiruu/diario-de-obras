import { getSupabaseClient } from '@/lib/supabase'
import type { CatalogoImportacao, CatalogoPeca } from '@/lib/types'

export async function listarPecasDaObra(obraId: string): Promise<CatalogoPeca[]> {
  const { data, error } = await getSupabaseClient()
    .from('obra_pecas')
    .select('id, codigo, tipo, quantidade_prevista, quantidade_montada, quantidade_pendente, volume_unitario_m3, volume_total_previsto_m3, ativo, obra_localizacoes(nome)')
    .eq('obra_id', obraId)
    .eq('ativo', true)
    .order('codigo')

  if (error) throw error
  return (data ?? []) as CatalogoPeca[]
}

export async function listarImportacoesDaObra(obraId: string): Promise<CatalogoImportacao[]> {
  const { data, error } = await getSupabaseClient()
    .from('catalogo_importacoes')
    .select('id, revisao, nome_arquivo, status, resumo, criado_em')
    .eq('obra_id', obraId)
    .order('revisao', { ascending: false })

  if (error) throw error
  return (data ?? []) as CatalogoImportacao[]
}
