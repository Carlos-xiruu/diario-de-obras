import { NextResponse } from 'next/server'
import { parseBaseMontagem } from '@/lib/importacao-aedifica.mjs'
import { requireCatalogAdmin } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: Request, context: { params: Promise<{ obraId: string }> }) {
  const { obraId } = await context.params
  const { supabase, error } = await requireCatalogAdmin()
  if (error) return NextResponse.json({ error }, { status: 403 })

  const { data: obra } = await supabase.from('obras').select('id').eq('id', obraId).maybeSingle()
  if (!obra) return NextResponse.json({ error: 'Obra não encontrada.' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('arquivo')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Selecione uma planilha .xlsx.' }, { status: 400 })
  if (!file.name.toLowerCase().endsWith('.xlsx') || file.size === 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Envie uma planilha .xlsx de até 10 MB.' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const preview = await parseBaseMontagem(buffer)
    const digest = await crypto.subtle.digest('SHA-256', buffer)
    const hash = Buffer.from(digest).toString('hex')
    return NextResponse.json({ hash, fileName: file.name, fileSize: file.size, preview })
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : 'Não foi possível interpretar a planilha.'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
