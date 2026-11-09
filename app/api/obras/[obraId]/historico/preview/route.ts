import { NextResponse } from 'next/server'
import { parseDiarioMontagem } from '@/lib/importacao-aedifica.mjs'
import { requireCatalogAdmin } from '@/lib/supabase-server'

export const runtime = 'nodejs'
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: Request, context: { params: Promise<{ obraId: string }> }) {
  const { supabase, error } = await requireCatalogAdmin()
  if (error) return NextResponse.json({ error }, { status: 403 })
  const { obraId } = await context.params; const formData = await request.formData(); const file = formData.get('arquivo')
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.xlsx') || file.size === 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Envie uma planilha .xlsx de até 10 MB.' }, { status: 400 })
  try {
    const preview = await parseDiarioMontagem(Buffer.from(await file.arrayBuffer()))
    const [{ data: pecas, error: pecasError }, { data: diarios, error: diariosError }] = await Promise.all([
      supabase.from('obra_pecas').select('codigo, tipo, obra_localizacoes(nome)').eq('obra_id', obraId).eq('ativo', true),
      supabase.from('diarios').select('data_registro, montagem_status').eq('obra_id', obraId),
    ])
    if (pecasError || diariosError) throw pecasError ?? diariosError
    const catalogo = new Map((pecas ?? []).map((peca) => [`${peca.obra_localizacoes?.[0]?.nome?.trim().toLowerCase()}|${peca.codigo.trim().toLowerCase()}|${peca.tipo.trim().toLowerCase()}`, peca]))
    const datasExistentes = new Set((diarios ?? []).map((diario) => diario.data_registro).filter(Boolean))
    const reconciliacao = preview.items.map((item) => {
      const exato = catalogo.get(`${item.pavimento.toLowerCase()}|${item.codigo.toLowerCase()}|${item.tipo.toLowerCase()}`)
      const porCodigoPavimento = [...catalogo.keys()].filter((key) => key.startsWith(`${item.pavimento.toLowerCase()}|${item.codigo.toLowerCase()}|`))
      const status = exato ? (datasExistentes.has(item.data) ? 'conflito_diario' : 'conciliado') : porCodigoPavimento.length === 1 && !item.tipo ? (datasExistentes.has(item.data) ? 'conflito_diario' : 'conciliado') : porCodigoPavimento.length > 1 ? 'ambiguo' : 'sem_catalogo'
      return { line: item.line, codigo: item.codigo, pavimento: item.pavimento, tipo: item.tipo, quantidade: item.quantidade, data: item.data, status }
    })
    const resumo = reconciliacao.reduce<Record<string, number>>((total, item) => ({ ...total, [item.status]: (total[item.status] ?? 0) + 1 }), { conciliado: 0, conflito_diario: 0, ambiguo: 0, sem_catalogo: 0 })
    return NextResponse.json({ preview, reconciliacao, resumo, confirmationEnabled: false, notice: 'A confirmação automática está bloqueada: o histórico deve ser conciliado manualmente para não alterar os 74 diários legados nem consumir saldo duas vezes.' })
  } catch (parseError) { return NextResponse.json({ error: parseError instanceof Error ? parseError.message : 'Não foi possível interpretar a planilha.' }, { status: 422 }) }
}
