import { getSupabaseClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type DashboardMetricas = {
  obras: number; previstas: number; montadas: number; pendentes: number; volumePrevisto: number; volumeMontado: number; volumeRestante: number; munck: number; guindaste: number; horas: number
  porDia: { data: string; volume: number }[]; porObra: { obra: string; volume: number; munck: number; guindaste: number }[]
}

export async function carregarMetricasDashboard(): Promise<DashboardMetricas> {
  const supabase = getSupabaseClient()
  const [{ data: obras, error: obrasError }, { data: pecas, error: pecasError }, { data: diarios, error: diariosError }] = await Promise.all([
    supabase.from('obras').select('id, nome_obra'),
    supabase.from('obra_pecas').select('quantidade_prevista, quantidade_montada, quantidade_pendente, volume_unitario_m3'),
    supabase.from('diarios').select('obra, data_registro, m3_montado, volume_estruturado_m3, montagem_status, munk_hrs, guindaste_hrs, horas_trabalhadas'),
  ])
  if (obrasError || pecasError || diariosError) throw obrasError ?? pecasError ?? diariosError
  const total = (rows: typeof pecas, field: 'quantidade_prevista' | 'quantidade_montada' | 'quantidade_pendente') => (rows ?? []).reduce((sum, row) => sum + Number(row[field]), 0)
  const previstas = total(pecas, 'quantidade_prevista'); const montadas = total(pecas, 'quantidade_montada'); const pendentes = total(pecas, 'quantidade_pendente')
  const volumePrevisto = (pecas ?? []).reduce((sum, row) => sum + Number(row.quantidade_prevista) * Number(row.volume_unitario_m3), 0)
  const volumeMontado = (pecas ?? []).reduce((sum, row) => sum + Number(row.quantidade_montada) * Number(row.volume_unitario_m3), 0)
  const diarioPorObra = new Map<string, { obra: string; volume: number; munck: number; guindaste: number }>(); const porDia = new Map<string, number>()
  for (const diario of diarios ?? []) {
    const volume = diario.montagem_status === 'confirmado' ? Number(diario.volume_estruturado_m3) : diario.montagem_status === 'legado' ? Number(diario.m3_montado) : 0
    const key = diario.obra ?? 'Sem obra'; const atual = diarioPorObra.get(key) ?? { obra: key, volume: 0, munck: 0, guindaste: 0 }
    atual.volume += volume; atual.munck += Number(diario.munk_hrs) || 0; atual.guindaste += Number(diario.guindaste_hrs) || 0; diarioPorObra.set(key, atual)
    if (diario.data_registro) porDia.set(diario.data_registro, (porDia.get(diario.data_registro) ?? 0) + volume)
  }
  return { obras: obras?.length ?? 0, previstas, montadas, pendentes, volumePrevisto, volumeMontado, volumeRestante: volumePrevisto - volumeMontado, munck: (diarios ?? []).reduce((s, d) => s + (Number(d.munk_hrs) || 0), 0), guindaste: (diarios ?? []).reduce((s, d) => s + (Number(d.guindaste_hrs) || 0), 0), horas: (diarios ?? []).reduce((s, d) => s + (Number(d.horas_trabalhadas) || 0), 0), porDia: [...porDia].map(([data, volume]) => ({ data, volume })).sort((a, b) => a.data.localeCompare(b.data)), porObra: [...diarioPorObra.values()] }
}

export async function carregarMetricasObra(obraId: string, client?: SupabaseClient) {
  const supabase = client ?? getSupabaseClient()
  const [{ data: obra, error: obraError }, { data: pecas, error: pecasError }, { data: diarios, error: diariosError }, { data: itens, error: itensError }] = await Promise.all([
    supabase.from('obras').select('id, nome_obra, cidade').eq('id', obraId).single(),
    supabase.from('obra_pecas').select('tipo, quantidade_prevista, quantidade_montada, quantidade_pendente, volume_unitario_m3, obra_localizacoes(nome)').eq('obra_id', obraId).eq('ativo', true),
    supabase.from('diarios').select('id, data_registro, montagem_status, volume_estruturado_m3, m3_montado, munk_hrs, guindaste_hrs, horas_trabalhadas, observacoes').eq('obra_id', obraId).order('data_registro', { ascending: false }),
    supabase.from('diario_itens_montagem').select('diario_id, quantidade, tipo_snapshot, localizacao_snapshot, volume_total_m3, aplicado, diarios!inner(data_registro, montagem_status)').eq('obra_id', obraId).eq('aplicado', true),
  ])
  if (obraError || pecasError || diariosError || itensError) throw obraError ?? pecasError ?? diariosError ?? itensError
  const sum = (field: 'quantidade_prevista' | 'quantidade_montada' | 'quantidade_pendente') => (pecas ?? []).reduce((total, peca) => total + Number(peca[field]), 0)
  const porDia = new Map<string, number>(); const porPavimento = new Map<string, number>(); const porTipo = new Map<string, number>()
  for (const diario of diarios ?? []) if (diario.data_registro) {
    const volume = diario.montagem_status === 'confirmado' ? Number(diario.volume_estruturado_m3) : diario.montagem_status === 'legado' ? Number(diario.m3_montado) : 0
    porDia.set(diario.data_registro, (porDia.get(diario.data_registro) ?? 0) + volume)
  }
  for (const peca of pecas ?? []) {
    const volume = Number(peca.quantidade_montada) * Number(peca.volume_unitario_m3); const localizacao = (peca.obra_localizacoes as { nome: string }[])[0]?.nome ?? 'Sem pavimento'
    porPavimento.set(localizacao, (porPavimento.get(localizacao) ?? 0) + volume); porTipo.set(peca.tipo, (porTipo.get(peca.tipo) ?? 0) + volume)
  }
  const previstas = sum('quantidade_prevista'); const montadas = sum('quantidade_montada'); const volumePrevisto = (pecas ?? []).reduce((total, peca) => total + Number(peca.quantidade_prevista) * Number(peca.volume_unitario_m3), 0); const volumeMontado = (pecas ?? []).reduce((total, peca) => total + Number(peca.quantidade_montada) * Number(peca.volume_unitario_m3), 0)
  const montagens = (itens ?? []).map((item) => {
    const diario = Array.isArray(item.diarios) ? item.diarios[0] : item.diarios
    return { diarioId: item.diario_id, data: diario?.data_registro ?? null, tipo: item.tipo_snapshot, pavimento: item.localizacao_snapshot, quantidade: Number(item.quantidade), volume: Number(item.volume_total_m3) }
  })
  return { obra, diarios: diarios ?? [], montagens, previstas, montadas, pendentes: sum('quantidade_pendente'), volumePrevisto, volumeMontado, porDia: [...porDia].map(([data, volume]) => ({ data, volume })).sort((a, b) => a.data.localeCompare(b.data)), porPavimento: [...porPavimento].map(([nome, volume]) => ({ nome, volume })), porTipo: [...porTipo].map(([nome, volume]) => ({ nome, volume })), horas: (diarios ?? []).reduce((total, diario) => ({ munck: total.munck + (Number(diario.munk_hrs) || 0), guindaste: total.guindaste + (Number(diario.guindaste_hrs) || 0), trabalho: total.trabalho + (Number(diario.horas_trabalhadas) || 0) }), { munck: 0, guindaste: 0, trabalho: 0 }) }
}
