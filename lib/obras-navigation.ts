import type { Obra } from '@/lib/types'

export function diarioUrl(obra: Obra): string {
  const query = new URLSearchParams({
    obraId: obra.id,
    obra: obra.nome_obra,
    cidade: obra.cidade,
  })

  return `/diario?${query.toString()}`
}
