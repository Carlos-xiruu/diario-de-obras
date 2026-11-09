import ExcelJS from 'exceljs'

const REQUIRED_HEADERS = {
  selecao: 'SELECAO DA PECA',
  pavimento: 'PAVIMENTO',
  tipo: 'TIPO',
  codigo: 'CODIGO',
  quantidade: 'QTD PREVISTA',
  volumeUnitario: 'VOL UNIT M3',
}

function normalizeHeader(value) {
  return String(value ?? '')
    .replace(/³/g, '3')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .toUpperCase()
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function parseDecimal(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const text = normalizeText(value)
  if (!text) return null

  const normalized = text.includes(',')
    ? text.replace(/\./g, '').replace(',', '.')
    : text
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function findHeader(rows) {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 30); rowIndex += 1) {
    const row = rows[rowIndex] ?? []
    const columns = new Map(row.map((value, index) => [normalizeHeader(value), index]))
    if (Object.values(REQUIRED_HEADERS).every((header) => columns.has(header))) {
      return { rowIndex, columns }
    }
  }
  return null
}

function cellValue(cell) {
  if (cell && typeof cell.value === 'object' && cell.value !== null && 'result' in cell.value) return cell.value.result
  return cell?.value ?? null
}

export async function parseBaseMontagem(buffer) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer, { ignoreNodes: ['dataValidations', 'drawing', 'extLst'] })
  const sheet = workbook.getWorksheet('Base Montagem')
  if (!sheet) throw new Error('A aba operacional "Base Montagem" não foi encontrada.')

  const rows = []
  sheet.eachRow({ includeEmpty: true }, (row) => {
    rows.push(Array.from({ length: row.cellCount }, (_value, index) => cellValue(row.getCell(index + 1))))
  })
  const header = findHeader(rows)
  if (!header) throw new Error('As colunas obrigatórias da aba "Base Montagem" não foram encontradas.')

  const items = []
  const errors = []
  const warnings = []
  const keys = new Set()

  for (let index = header.rowIndex + 1; index < rows.length; index += 1) {
    const row = rows[index] ?? []
    const localizacao = normalizeText(row[header.columns.get(REQUIRED_HEADERS.pavimento)])
    const tipo = normalizeText(row[header.columns.get(REQUIRED_HEADERS.tipo)])
    const codigo = normalizeText(row[header.columns.get(REQUIRED_HEADERS.codigo)]).toUpperCase()
    const quantidade = parseDecimal(row[header.columns.get(REQUIRED_HEADERS.quantidade)])
    const volumeUnitario = parseDecimal(row[header.columns.get(REQUIRED_HEADERS.volumeUnitario)])
    const hasData = localizacao || tipo || codigo || quantidade !== null || volumeUnitario !== null

    if (!hasData) continue
    const line = index + 1
    if (!localizacao || !tipo || !codigo || quantidade === null || volumeUnitario === null) {
      errors.push({ line, message: 'Pavimento, tipo, código, quantidade e volume unitário são obrigatórios.' })
      continue
    }
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      errors.push({ line, message: 'A quantidade prevista deve ser um inteiro não negativo.' })
      continue
    }
    if (volumeUnitario < 0) {
      errors.push({ line, message: 'O volume unitário deve ser não negativo.' })
      continue
    }

    const key = `${localizacao.toLocaleLowerCase('pt-BR')}|${tipo.toLocaleLowerCase('pt-BR')}|${codigo.toLocaleLowerCase('pt-BR')}`
    if (keys.has(key)) {
      errors.push({ line, message: 'Peça duplicada para o mesmo pavimento e tipo.' })
      continue
    }
    keys.add(key)

    const volumePrevisto = quantidade * volumeUnitario
    items.push({ line, localizacao, tipo, codigo, quantidade_prevista: quantidade, volume_unitario_m3: volumeUnitario, volume_total_previsto_m3: volumePrevisto })
  }

  if (items.length === 0 && errors.length === 0) {
    errors.push({ line: header.rowIndex + 1, message: 'Nenhuma peça operacional foi identificada.' })
  }

  const totals = items.reduce((total, item) => ({
    grupos: total.grupos + 1,
    quantidade_prevista: total.quantidade_prevista + item.quantidade_prevista,
    volume_previsto_m3: total.volume_previsto_m3 + item.volume_total_previsto_m3,
  }), { grupos: 0, quantidade_prevista: 0, volume_previsto_m3: 0 })

  return {
    template: 'aedifica-base-montagem',
    sheetName: 'Base Montagem',
    headersAtRow: header.rowIndex + 1,
    items,
    errors,
    warnings,
    totals: { ...totals, volume_previsto_m3: Number(totals.volume_previsto_m3.toFixed(4)) },
    locations: [...new Set(items.map((item) => item.localizacao))].sort(),
    types: [...new Set(items.map((item) => item.tipo))].sort(),
  }
}

export async function parseDiarioMontagem(buffer) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer, { ignoreNodes: ['dataValidations', 'drawing', 'extLst'] })
  const sheet = workbook.getWorksheet('Diario de Montagem')
  if (!sheet) throw new Error('A aba histórica "Diario de Montagem" não foi encontrada.')
  const rows = []
  sheet.eachRow({ includeEmpty: true }, (row) => rows.push(Array.from({ length: row.cellCount }, (_value, index) => cellValue(row.getCell(index + 1)))))
  const aliases = { data: ['DATA'], pavimento: ['PAVIMENTO', 'LOCALIZACAO'], tipo: ['TIPO'], codigo: ['CODIGO', 'COD DA PECA', 'PECA'], quantidade: ['QTD', 'QUANTIDADE'], volume: ['VOLUME', 'M3', 'M3 MONTADO'] }
  let header = null
  for (let index = 0; index < Math.min(rows.length, 30); index += 1) {
    const columns = new Map(rows[index].map((value, column) => [normalizeHeader(value), column]))
    const find = (names) => names.map((name) => columns.get(name)).find((column) => column !== undefined)
    const data = find(aliases.data); const pavimento = find(aliases.pavimento); const codigo = find(aliases.codigo); const quantidade = find(aliases.quantidade)
    if (data !== undefined && pavimento !== undefined && codigo !== undefined && quantidade !== undefined) { header = { index, data, pavimento, codigo, quantidade, tipo: find(aliases.tipo), volume: find(aliases.volume) }; break }
  }
  if (!header) throw new Error('As colunas de data, pavimento, código e quantidade da aba histórica não foram encontradas.')
  const items = []; const errors = []; const duplicates = new Set()
  for (let index = header.index + 1; index < rows.length; index += 1) {
    const row = rows[index]; const line = index + 1
    const rawDate = row[header.data]; const dateValue = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : normalizeText(rawDate)
    const pavimento = normalizeText(row[header.pavimento]); const codigo = normalizeText(row[header.codigo]).toUpperCase(); const tipo = header.tipo === undefined ? '' : normalizeText(row[header.tipo]); const quantidade = parseDecimal(row[header.quantidade]); const volume = header.volume === undefined ? null : parseDecimal(row[header.volume])
    if (!dateValue && !pavimento && !codigo && quantidade === null) continue
    if (!dateValue || !pavimento || !codigo || quantidade === null || !Number.isInteger(quantidade) || quantidade <= 0) { errors.push({ line, message: 'Data, pavimento, código e quantidade inteira positiva são obrigatórios.' }); continue }
    const key = `${dateValue}|${pavimento.toLowerCase()}|${codigo.toLowerCase()}|${tipo.toLowerCase()}`
    if (duplicates.has(key)) { errors.push({ line, message: 'Registro duplicado na planilha histórica.' }); continue }
    duplicates.add(key); items.push({ line, data: dateValue, pavimento, codigo, tipo, quantidade, volume_m3: volume })
  }
  return { template: 'aedifica-diario-montagem', sheetName: 'Diario de Montagem', headersAtRow: header.index + 1, items, errors, totals: { registros: items.length, quantidade: items.reduce((total, item) => total + item.quantidade, 0), volume_m3: items.reduce((total, item) => total + (item.volume_m3 ?? 0), 0) } }
}
