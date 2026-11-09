import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ExcelJS from 'exceljs'
import { parseBaseMontagem } from '../lib/importacao-aedifica.mjs'

async function aedificaWorkbookBuffer() {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Base Montagem')
  sheet.addRow([])
  sheet.addRow([])
  sheet.addRow([])
  sheet.addRow([])
  sheet.addRow([])
  sheet.addRow([])
  sheet.addRow(['SELEÇÃO DA PEÇA', 'PAVIMENTO', 'TIPO', 'CÓDIGO', 'QTD PREVISTA', 'VOL. UNIT. (m³)', 'VOL. PREV. (m³)'])
  sheet.addRow(['Pilares | LP003', 'Pilares', 'LP', 'LP003', 316, 0.85, 268.6])
  sheet.addRow(['Nível +694,50 | LP003', 'Nível +694,50', 'LP', 'LP003', 24, 0.84, 20.16])
  for (let index = 0; index < 282; index += 1) {
    const code = `VR${String(index + 1).padStart(3, '0')}`
    sheet.addRow([`Cobertura | ${code}`, 'Cobertura +698,00', 'VR', code, 2, 0.84, 1.68])
  }
  return workbook.xlsx.writeBuffer()
}

test('importa 284 grupos operacionais com totais recalculados', async () => {
  const result = await parseBaseMontagem(await aedificaWorkbookBuffer())

  assert.equal(result.errors.length, 0)
  assert.equal(result.items.length, 284)
  assert.equal(result.totals.quantidade_prevista, 904)
  assert.equal(result.totals.volume_previsto_m3, 762.52)
  assert.equal(result.items.filter((item) => item.codigo === 'LP003').length, 2)
  assert.equal(result.items.some((item) => item.codigo === 'LP003' && item.localizacao.includes('Pilares')), true)
  assert.equal(result.items.some((item) => item.codigo === 'LP003' && item.localizacao.includes('694')), true)
})

test('rejeita arquivo XLSX corrompido', async () => {
  await assert.rejects(() => parseBaseMontagem(Buffer.from('arquivo corrompido')))
})

test('importa a planilha original Aedifica com os totais homologados', async () => {
  const fixture = new URL('../fixtures/referencias/Aedifica CT2574 - Controle Diario Montagem.xlsx', import.meta.url)
  const result = await parseBaseMontagem(readFileSync(fixture))

  assert.equal(result.errors.length, 0)
  assert.equal(result.items.length, 284)
  assert.equal(result.totals.quantidade_prevista, 904)
  assert.equal(result.totals.volume_previsto_m3, 762.52)
  assert.deepEqual(result.items.filter((item) => item.codigo === 'LP003').map((item) => item.localizacao), ['Nível +694,50', 'Cobertura +698,00'])
})

test('mantem fora da base os tres excedentes sem pavimento confirmado', async () => {
  const fixture = new URL('../fixtures/referencias/Aedifica CT2574 - Controle Diario Montagem.xlsx', import.meta.url)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(readFileSync(fixture))
  const diferencas = workbook.getWorksheet('Diferencas')
  const result = await parseBaseMontagem(readFileSync(fixture))

  assert.ok(diferencas)
  assert.deepEqual([8, 9, 10].map((line) => ({
    codigo: diferencas.getCell(`B${line}`).value,
    excesso: diferencas.getCell(`C${line}`).value,
    observacao: diferencas.getCell(`H${line}`).value,
  })), [
    { codigo: 'LP003', excesso: 1, observacao: 'Sem pavimento confirmado' },
    { codigo: 'LP019', excesso: 1, observacao: 'Sem pavimento confirmado' },
    { codigo: 'LP040', excesso: 1, observacao: 'Sem pavimento confirmado' },
  ])
  assert.equal(diferencas.getCell('C12').value.result, 3)
  assert.equal(diferencas.getCell('G12').value.result, 2.27)
  assert.equal(result.items.filter((item) => item.codigo === 'LP003').reduce((total, item) => total + item.quantidade_prevista, 0), 94)
  assert.equal(result.items.filter((item) => item.codigo === 'LP019').reduce((total, item) => total + item.quantidade_prevista, 0), 8)
  assert.equal(result.items.filter((item) => item.codigo === 'LP040').reduce((total, item) => total + item.quantidade_prevista, 0), 137)
})
