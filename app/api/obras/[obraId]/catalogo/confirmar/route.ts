import { NextResponse } from 'next/server'
import { parseBaseMontagem } from '@/lib/importacao-aedifica.mjs'
import { requireCatalogAdmin } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: Request, context: { params: Promise<{ obraId: string }> }) {
  const { obraId } = await context.params
  const { supabase, error } = await requireCatalogAdmin()
  if (error) return NextResponse.json({ error }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('arquivo')
  const expectedHash = formData.get('hash')
  if (!(file instanceof File) || typeof expectedHash !== 'string') {
    return NextResponse.json({ error: 'A confirmação exige a mesma planilha validada na prévia.' }, { status: 400 })
  }
  if (!file.name.toLowerCase().endsWith('.xlsx') || file.size === 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Envie uma planilha .xlsx de até 10 MB.' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const digest = await crypto.subtle.digest('SHA-256', buffer)
    const hash = Buffer.from(digest).toString('hex')
    if (hash !== expectedHash) return NextResponse.json({ error: 'O arquivo mudou desde a prévia. Valide novamente.' }, { status: 409 })

    const preview = await parseBaseMontagem(buffer)
    if (preview.errors.length > 0) return NextResponse.json({ error: 'A planilha possui linhas inválidas.', preview }, { status: 422 })

    const { data, error: rpcError } = await supabase.rpc('confirmar_importacao_catalogo', {
      p_obra_id: obraId,
      p_nome_arquivo: file.name,
      p_hash_arquivo: hash,
      p_tamanho_bytes: file.size,
      p_itens: preview.items.map(({ localizacao, tipo, codigo, quantidade_prevista, volume_unitario_m3 }) => ({ localizacao, tipo, codigo, quantidade_prevista, volume_unitario_m3 })),
    })
    if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 422 })
    return NextResponse.json({ result: data, preview })
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : 'Não foi possível importar a planilha.'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
