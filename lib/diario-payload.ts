import type { DiarioFormValues, DiarioInput } from '@/lib/types'

export function parseDecimal(value: string): number {
  const normalized = value.trim().replace(',', '.')
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

export function buildDiarioPayload(values: DiarioFormValues): DiarioInput {
  return {
    obra_id: values.obraId,
    obra: values.obra.trim(),
    cidade: values.cidade.trim(),
    data_registro: values.dataRegistro,
    clima: values.clima,
    equipe: values.equipe.join(', '),
    munk_hrs: parseDecimal(values.munkHrs),
    guindaste_hrs: parseDecimal(values.guindasteHrs),
    horas_trabalhadas: parseDecimal(values.horasTrabalhadas),
    m3_montado: parseDecimal(values.m3Montado),
    qtd_bisnagas_pu: parseDecimal(values.qtdBisnagasPu),
    eixos_montados: values.eixosMontados,
    encunhamento_pilares: values.encunhamento === 'sim',
    observacoes: values.observacoes,
  }
}
