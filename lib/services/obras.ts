import { getSupabaseClient } from '@/lib/supabase'
import type { Obra } from '@/lib/types'

export async function listarObras(): Promise<Obra[]> {
  const { data, error } = await getSupabaseClient()
    .from('obras')
    .select('id, nome_obra, cidade')
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []) as Obra[]
}

export async function buscarObra(id: string): Promise<Obra> {
  const { data, error } = await getSupabaseClient()
    .from('obras')
    .select('id, nome_obra, cidade')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Obra
}

export async function criarObra(input: Pick<Obra, 'nome_obra' | 'cidade'>): Promise<void> {
  const { error } = await getSupabaseClient().from('obras').insert(input)
  if (error) throw error
}

export async function atualizarObra(id: string, input: Pick<Obra, 'nome_obra' | 'cidade'>): Promise<void> {
  const { error } = await getSupabaseClient().from('obras').update(input).eq('id', id)
  if (error) throw error
}

export async function excluirObra(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('obras').delete().eq('id', id)
  if (error) throw error
}
