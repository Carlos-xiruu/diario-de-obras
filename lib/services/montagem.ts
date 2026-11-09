import { getSupabaseClient } from '@/lib/supabase'

export type MontagemSelecionada = { obra_peca_id: string; quantidade: number }

export async function aplicarMontagemDiario(diarioId: string, itens: MontagemSelecionada[], acao: 'rascunho' | 'confirmar' | 'editar' | 'cancelar', chaveIdempotencia: string, motivo?: string) {
  const { data, error } = await getSupabaseClient().rpc('aplicar_montagem_diario', {
    p_diario_id: diarioId,
    p_itens: itens,
    p_acao: acao,
    p_chave_idempotencia: chaveIdempotencia,
    p_motivo: motivo ?? null,
  })
  if (error) throw error
  return data
}

export async function listarItensMontagemDiario(diarioId: string) {
  const { data, error } = await getSupabaseClient()
    .from('diario_itens_montagem')
    .select('obra_peca_id, quantidade, codigo_snapshot, tipo_snapshot, localizacao_snapshot, volume_unitario_m3_snapshot, volume_total_m3, aplicado')
    .eq('diario_id', diarioId)
    .order('codigo_snapshot')
  if (error) throw error
  return data ?? []
}
