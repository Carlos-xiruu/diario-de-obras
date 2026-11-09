export interface Obra {
  id: string
  nome_obra: string
  cidade: string
}

export type PapelUsuario = 'administrador' | 'colaborador'

export interface AcessoUsuario {
  user_id: string
  papel: PapelUsuario
  ativo: boolean
}

export interface Diario {
  id: string
  obra_id: string | null
  obra: string | null
  cidade: string | null
  data_registro: string | null
  clima: string | null
  equipe: string | null
  munk_hrs: number | null
  guindaste_hrs: number | null
  horas_trabalhadas: number | null
  m3_montado: number | null
  qtd_bisnagas_pu: number | null
  eixos_montados: string | null
  encunhamento_pilares: boolean | null
  observacoes: string | null
  montagem_status?: 'rascunho' | 'confirmado' | 'cancelado' | 'legado'
  volume_estruturado_m3?: number
}

export interface DiarioInput {
  obra_id: string | null
  obra: string
  cidade: string
  data_registro: string
  clima: string
  equipe: string
  munk_hrs: number
  guindaste_hrs: number
  horas_trabalhadas: number
  m3_montado: number
  qtd_bisnagas_pu: number
  eixos_montados: string
  encunhamento_pilares: boolean
  observacoes: string
}

export interface DiarioFormValues {
  obraId: string | null
  obra: string
  cidade: string
  dataRegistro: string
  clima: string
  equipe: string[]
  horasTrabalhadas: string
  eixosMontados: string
  munkHrs: string
  guindasteHrs: string
  m3Montado: string
  qtdBisnagasPu: string
  encunhamento: string
  observacoes: string
}

export interface CatalogoPeca {
  id: string
  codigo: string
  tipo: string
  quantidade_prevista: number
  quantidade_montada: number
  quantidade_pendente: number
  volume_unitario_m3: number
  volume_total_previsto_m3: number
  ativo: boolean
  obra_localizacoes: { nome: string }[]
}

export interface CatalogoImportacao {
  id: string
  revisao: number
  nome_arquivo: string
  status: 'aplicada' | 'substituida'
  resumo: { grupos?: number; quantidade_prevista?: number; volume_previsto_m3?: number }
  criado_em: string
}
