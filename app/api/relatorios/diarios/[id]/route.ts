import { NextResponse } from 'next/server'
import { gerarPdfDiario, reportFilename } from '@/lib/pdf/relatorios'
import { carregarRelatorioDiario } from '@/lib/services/relatorios'
import { requireAuthorizedUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAuthorizedUser()
  if (error) return NextResponse.json({ error }, { status: 403 })
  const { id } = await context.params
  try {
    const { diario, itens } = await carregarRelatorioDiario(supabase, id)
    if (!diario) return NextResponse.json({ error: 'Diário não encontrado.' }, { status: 404 })
    const pdf = await gerarPdfDiario(diario, itens)
    return new NextResponse(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${reportFilename('diario', diario.obra ?? 'obra', diario.data_registro ?? id)}"`, 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Não foi possível gerar o PDF do diário.' }, { status: 500 })
  }
}
