import type { SupabaseClient } from '@supabase/supabase-js'
import { carregarMetricasObra } from '@/lib/services/dashboard'
import type { Diario } from '@/lib/types'

export type ItemRelatorio = {
  quantidade: number
  codigo_snapshot: string
  tipo_snapshot: string
  localizacao_snapshot: string
  volume_unitario_m3_snapshot: number
  volume_total_m3: number
  aplicado: boolean
}

export async function carregarRelatorioDiario(supabase: SupabaseClient, diarioId: string) {
  const [{ data: diario, error: diarioError }, { data: itens, error: itensError }] = await Promise.all([
    supabase.from('diarios').select('id, obra_id, obra, cidade, data_registro, clima, equipe, munk_hrs, guindaste_hrs, horas_trabalhadas, m3_montado, qtd_bisnagas_pu, eixos_montados, encunhamento_pilares, observacoes, montagem_status, volume_estruturado_m3').eq('id', diarioId).maybeSingle(),
    supabase.from('diario_itens_montagem').select('quantidade, codigo_snapshot, tipo_snapshot, localizacao_snapshot, volume_unitario_m3_snapshot, volume_total_m3, aplicado').eq('diario_id', diarioId).order('codigo_snapshot'),
  ])
  if (diarioError || itensError) throw diarioError ?? itensError
  return { diario: diario as Diario | null, itens: (itens ?? []) as ItemRelatorio[] }
}

export async function carregarRelatorioObra(supabase: SupabaseClient, obraId: string, inicio?: string | null, fim?: string | null) {
  const metricas = await carregarMetricasObra(obraId, supabase)
  let query = supabase.from('diarios').select('id, data_registro, montagem_status, volume_estruturado_m3, m3_montado, munk_hrs, guindaste_hrs, horas_trabalhadas').eq('obra_id', obraId).order('data_registro')
  if (inicio) query = query.gte('data_registro', inicio)
  if (fim) query = query.lte('data_registro', fim)
  const { data: diarios, error } = await query
  if (error) throw error

  const filtrados = diarios ?? []
  const porDia = new Map<string, { data: string; pecas: number; volume: number }>()
  const ids = filtrados.map((diario) => diario.id)
  const { data: itens, error: itensError } = ids.length
    ? await supabase.from('diario_itens_montagem').select('diario_id, quantidade, tipo_snapshot, localizacao_snapshot, volume_total_m3, aplicado').in('diario_id', ids)
    : { data: [], error: null }
  if (itensError) throw itensError
  const estruturados = (itens ?? []).filter((item) => item.aplicado)
  const itensPorDiario = new Map<string, number>()
  const porPavimento = new Map<string, number>()
  const porTipo = new Map<string, number>()
  for (const item of estruturados) {
    porPavimento.set(item.localizacao_snapshot, (porPavimento.get(item.localizacao_snapshot) ?? 0) + Number(item.volume_total_m3))
    porTipo.set(item.tipo_snapshot, (porTipo.get(item.tipo_snapshot) ?? 0) + Number(item.volume_total_m3))
  }
  for (const item of estruturados) itensPorDiario.set(item.diario_id, (itensPorDiario.get(item.diario_id) ?? 0) + Number(item.quantidade))
  for (const diario of filtrados) {
    if (!diario.data_registro) continue
    const volume = diario.montagem_status === 'confirmado' ? Number(diario.volume_estruturado_m3) : diario.montagem_status === 'legado' ? Number(diario.m3_montado) : 0
    const atual = porDia.get(diario.data_registro) ?? { data: diario.data_registro, pecas: 0, volume: 0 }
    atual.pecas += itensPorDiario.get(diario.id) ?? 0
    atual.volume += volume
    porDia.set(diario.data_registro, atual)
  }
  const resumo = filtrados.reduce((total, diario) => ({
    diarios: total.diarios + 1,
    volume: total.volume + (diario.montagem_status === 'confirmado' ? Number(diario.volume_estruturado_m3) : diario.montagem_status === 'legado' ? Number(diario.m3_montado) : 0),
    munck: total.munck + (Number(diario.munk_hrs) || 0), guindaste: total.guindaste + (Number(diario.guindaste_hrs) || 0), trabalho: total.trabalho + (Number(diario.horas_trabalhadas) || 0),
  }), { diarios: 0, volume: 0, munck: 0, guindaste: 0, trabalho: 0 })
  return { metricas, filtrados, estruturados, porDia: [...porDia.values()], porPavimento: [...porPavimento].map(([nome, volume]) => ({ nome, volume })), porTipo: [...porTipo].map(([nome, volume]) => ({ nome, volume })), resumo }
}
