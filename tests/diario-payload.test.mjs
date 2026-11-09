import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

function loadTypeScriptModule(path) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const compiledModule = { exports: {} }
  new Function('exports', 'moduleRef', output)(compiledModule.exports, compiledModule)
  return compiledModule.exports
}

const { buildDiarioPayload, parseDecimal } = loadTypeScriptModule('../lib/diario-payload.ts')
const { diarioUrl } = loadTypeScriptModule('../lib/obras-navigation.ts')
const { canManageObras } = loadTypeScriptModule('../lib/permissions.ts')

test('parseDecimal aceita vírgula e rejeita valores inválidos', () => {
  assert.equal(parseDecimal('1,25'), 1.25)
  assert.equal(parseDecimal(''), 0)
  assert.equal(parseDecimal('invalido'), 0)
})

test('buildDiarioPayload preserva os campos legados e normaliza texto', () => {
  const payload = buildDiarioPayload({
    obraId: '53b0d4c7-2c4c-4a10-a8a2-7b9e2f7b27f9',
    obra: ' Obra A ',
    cidade: ' Cidade ',
    dataRegistro: '2026-11-07',
    clima: 'Sol',
    equipe: ['Ana', 'Bruno'],
    horasTrabalhadas: '8,5',
    eixosMontados: 'A a C',
    munkHrs: '2',
    guindasteHrs: '3,25',
    m3Montado: '10,75',
    qtdBisnagasPu: '4',
    encunhamento: 'sim',
    observacoes: 'Sem ocorrências',
  })

  assert.deepEqual(payload, {
    obra_id: '53b0d4c7-2c4c-4a10-a8a2-7b9e2f7b27f9',
    obra: 'Obra A',
    cidade: 'Cidade',
    data_registro: '2026-11-07',
    clima: 'Sol',
    equipe: 'Ana, Bruno',
    horas_trabalhadas: 8.5,
    eixos_montados: 'A a C',
    munk_hrs: 2,
    guindaste_hrs: 3.25,
    m3_montado: 10.75,
    qtd_bisnagas_pu: 4,
    encunhamento_pilares: true,
    observacoes: 'Sem ocorrências',
  })
})

test('buildDiarioPayload preserva diario legado sem obra_id', () => {
  const payload = buildDiarioPayload({
    obraId: null,
    obra: 'Obra historica', cidade: 'Cidade', dataRegistro: '2026-01-01', clima: '', equipe: [],
    horasTrabalhadas: '', eixosMontados: '', munkHrs: '', guindasteHrs: '', m3Montado: '',
    qtdBisnagasPu: '', encunhamento: 'nao', observacoes: '',
  })

  assert.equal(payload.obra_id, null)
  assert.equal(payload.obra, 'Obra historica')
})

test('navegacao para diario transporta a chave UUID da obra', () => {
  const url = new URL(diarioUrl({
    id: '53b0d4c7-2c4c-4a10-a8a2-7b9e2f7b27f9',
    nome_obra: 'Obra A',
    cidade: 'Jaragua do Sul',
  }), 'https://diario.test')

  assert.equal(url.searchParams.get('obraId'), '53b0d4c7-2c4c-4a10-a8a2-7b9e2f7b27f9')
  assert.equal(url.searchParams.get('obra'), 'Obra A')
})

test('somente administradores recebem permissao de gerenciar obras na interface', () => {
  assert.equal(canManageObras('administrador'), true)
  assert.equal(canManageObras('colaborador'), false)
  assert.equal(canManageObras(null), false)
})
