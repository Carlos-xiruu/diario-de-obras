import { getSupabaseClient } from '@/lib/supabase'
import type { Diario, DiarioInput } from '@/lib/types'

const diarioColumns = 'id, obra_id, obra, cidade, data_registro, clima, equipe, munk_hrs, guindaste_hrs, horas_trabalhadas, m3_montado, qtd_bisnagas_pu, eixos_montados, encunhamento_pilares, observacoes, montagem_status, volume_estruturado_m3'

export async function listarDiarios(): Promise<Diario[]> {
  const { data, error } = await getSupabaseClient()
    .from('diarios')
    .select(diarioColumns)
    .order('data_registro', { ascending: false })

  if (error) throw error
  return (data ?? []) as Diario[]
}

export async function buscarDiario(id: string): Promise<Diario> {
  const { data, error } = await getSupabaseClient().from('diarios').select(diarioColumns).eq('id', id).single()
  if (error) throw error
  return data as Diario
}

export async function criarDiario(input: DiarioInput): Promise<Diario> {
  if (!input.obra_id) {
    throw new Error('Selecione uma obra cadastrada antes de criar um diário.')
  }

  const { data, error } = await getSupabaseClient().from('diarios').insert(input).select(diarioColumns).single()
  if (error) throw error
  return data as Diario
}

export async function atualizarDiario(id: string, input: DiarioInput): Promise<void> {
  const { error } = await getSupabaseClient().from('diarios').update(input).eq('id', id)
  if (error) throw error
}
