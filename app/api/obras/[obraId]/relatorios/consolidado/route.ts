import { NextResponse } from 'next/server'
import { gerarPdfConsolidado, reportFilename } from '@/lib/pdf/relatorios'
import { carregarRelatorioObra } from '@/lib/services/relatorios'
import { requireAuthorizedUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function validDate(value: string | null) { return !value || /^\d{4}-\d{2}-\d{2}$/.test(value) }

export async function GET(request: Request, context: { params: Promise<{ obraId: string }> }) {
  const { supabase, error } = await requireAuthorizedUser()
  if (error) return NextResponse.json({ error }, { status: 403 })
  const { obraId } = await context.params
  const url = new URL(request.url); const inicio = url.searchParams.get('inicio'); const fim = url.searchParams.get('fim')
  if (!validDate(inicio) || !validDate(fim) || (inicio && fim && inicio > fim)) return NextResponse.json({ error: 'Período inválido.' }, { status: 400 })
  try {
    const dados = await carregarRelatorioObra(supabase, obraId, inicio, fim)
    if (!dados.metricas.obra) return NextResponse.json({ error: 'Obra não encontrada.' }, { status: 404 })
    const pdf = await gerarPdfConsolidado({ obra: dados.metricas.obra, inicio, fim, resumo: dados.resumo, montadas: dados.estruturados.reduce((total, item) => total + Number(item.quantidade), 0), porDia: dados.porDia, porPavimento: dados.porPavimento, porTipo: dados.porTipo })
    const suffix = inicio && fim ? `${inicio}-${fim}` : 'periodo-completo'
    return new NextResponse(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${reportFilename('relatorio-obra', dados.metricas.obra.nome_obra, suffix)}"`, 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Não foi possível gerar o relatório consolidado.' }, { status: 500 })
  }
}
