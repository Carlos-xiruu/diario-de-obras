import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { Diario } from '@/lib/types'
import type { ItemRelatorio } from '@/lib/services/relatorios'

const A4: [number, number] = [595.28, 841.89]
const margin = 42
const blue = rgb(0.05, 0.23, 0.45)
const slate = rgb(0.2, 0.25, 0.32)
const muted = rgb(0.42, 0.46, 0.52)

const number = (value: number, digits = 2) => value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const date = (value: string | null | undefined) => value ? value.split('-').reverse().join('/') : '-'
const safe = (value: unknown) => String(value ?? '-').replace(/[\r\n]+/g, ' ')

type Writer = { doc: PDFDocument; page: PDFPage; regular: PDFFont; bold: PDFFont; y: number; pageNumber: number }

function writeFooter(writer: Writer) {
  writer.page.drawLine({ start: { x: margin, y: 30 }, end: { x: A4[0] - margin, y: 30 }, color: rgb(0.8, 0.82, 0.85) })
  writer.page.drawText(`Diário de Obras | Página ${writer.pageNumber}`, { x: margin, y: 18, size: 8, font: writer.regular, color: muted })
}

function nextPage(writer: Writer) {
  writeFooter(writer)
  writer.page = writer.doc.addPage(A4)
  writer.pageNumber += 1
  writer.y = A4[1] - margin
}

function ensure(writer: Writer, height: number) { if (writer.y - height < 48) nextPage(writer) }
function text(writer: Writer, value: unknown, x: number, size = 10, font = writer.regular, color = slate) {
  writer.page.drawText(safe(value).slice(0, 180), { x, y: writer.y, size, font, color })
}
function heading(writer: Writer, value: string) { ensure(writer, 28); text(writer, value, margin, 14, writer.bold, blue); writer.y -= 22 }
function line(writer: Writer) { writer.page.drawLine({ start: { x: margin, y: writer.y }, end: { x: A4[0] - margin, y: writer.y }, color: rgb(0.82, 0.84, 0.87) }); writer.y -= 12 }
function row(writer: Writer, values: unknown[], widths: number[], header = false) {
  ensure(writer, 20)
  let x = margin
  values.forEach((value, index) => { text(writer, safe(value).slice(0, Math.max(8, Math.floor(widths[index] / 5))), x + 3, 8.5, header ? writer.bold : writer.regular, header ? blue : slate); x += widths[index] })
  writer.y -= 15
  writer.page.drawLine({ start: { x: margin, y: writer.y + 4 }, end: { x: A4[0] - margin, y: writer.y + 4 }, color: rgb(0.9, 0.91, 0.93) })
}
function documentTitle(writer: Writer, title: string, subtitle: string) {
  text(writer, 'AEDIFICA', margin, 10, writer.bold, blue)
  writer.y -= 22
  text(writer, title, margin, 20, writer.bold, blue)
  writer.y -= 17
  text(writer, subtitle, margin, 10, writer.regular, muted)
  writer.y -= 20
  line(writer)
}
async function createWriter() {
  const doc = await PDFDocument.create(); doc.setTitle('Relatório Diário de Obras'); doc.setAuthor('Aedifica')
  return { doc, page: doc.addPage(A4), regular: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold), y: A4[1] - margin, pageNumber: 1 } as Writer
}
export function reportFilename(prefix: string, name: string, suffix: string) { return `${prefix}-${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/(^-|-$)/g, '').toLowerCase()}-${suffix}.pdf` }

export async function gerarPdfDiario(diario: Diario, itens: ItemRelatorio[]) {
  const writer = await createWriter()
  documentTitle(writer, 'DIÁRIO DE OBRA', `${safe(diario.obra)} | ${safe(diario.cidade)} | ${date(diario.data_registro)}`)
  heading(writer, 'Identificação e equipe')
  row(writer, ['Data', date(diario.data_registro), 'Estado', diario.montagem_status ?? 'legado'], [70, 185, 70, 185])
  row(writer, ['Obra', diario.obra, 'Cidade', diario.cidade], [70, 185, 70, 185])
  row(writer, ['Equipe', diario.equipe, 'Clima', diario.clima], [70, 185, 70, 185])
  writer.y -= 10
  heading(writer, 'Horas e informações adicionais')
  row(writer, ['Munck', `${number(Number(diario.munk_hrs) || 0)} h`, 'Guindaste', `${number(Number(diario.guindaste_hrs) || 0)} h`], [70, 185, 70, 185])
  const volume = diario.montagem_status === 'confirmado' ? Number(diario.volume_estruturado_m3) : diario.montagem_status === 'legado' ? Number(diario.m3_montado) : 0
  row(writer, ['Trabalho', `${number(Number(diario.horas_trabalhadas) || 0)} h`, 'Volume', `${number(volume)} m³`], [70, 185, 70, 185])
  row(writer, ['Eixos', diario.eixos_montados, 'PU', diario.qtd_bisnagas_pu], [70, 185, 70, 185])
  row(writer, ['Encunhamento', diario.encunhamento_pilares ? 'Sim' : 'Não', 'M³ manual', number(Number(diario.m3_montado) || 0)], [100, 155, 100, 155])
  writer.y -= 10
  heading(writer, 'Peças montadas no dia')
  const widths = [94, 80, 70, 45, 75, 80]
  row(writer, ['Pavimento', 'Código', 'Tipo', 'Qtd.', 'Vol. unit.', 'Volume'], widths, true)
  for (const item of itens) row(writer, [item.localizacao_snapshot, item.codigo_snapshot, item.tipo_snapshot, item.quantidade, `${number(Number(item.volume_unitario_m3_snapshot))} m³`, `${number(Number(item.volume_total_m3))} m³`], widths)
  row(writer, ['Total', '', '', itens.reduce((sum, item) => sum + Number(item.quantidade), 0), '', `${number(itens.reduce((sum, item) => sum + Number(item.volume_total_m3), 0))} m³`], widths, true)
  if (!itens.length) { text(writer, 'Diário legado ou sem itens estruturados. O volume manual foi preservado.', margin, 9, writer.regular, muted); writer.y -= 18 }
  writer.y -= 8
  heading(writer, 'Observações')
  const words = safe(diario.observacoes || 'Sem observações.').match(/.{1,82}(?:\s|$)/g) ?? []
  for (const part of words) { ensure(writer, 14); text(writer, part.trim(), margin, 9); writer.y -= 13 }
  writeFooter(writer)
  return Buffer.from(await writer.doc.save())
}

export async function gerarPdfConsolidado(input: { obra: { nome_obra: string; cidade: string }; inicio?: string | null; fim?: string | null; resumo: { diarios: number; volume: number; munck: number; guindaste: number; trabalho: number }; montadas: number; porDia: { data: string; pecas: number; volume: number }[]; porPavimento: { nome: string; volume: number }[]; porTipo: { nome: string; volume: number }[] }) {
  const writer = await createWriter(); const periodo = `${date(input.inicio)} a ${date(input.fim)}`
  documentTitle(writer, 'RELATÓRIO CONSOLIDADO', `${input.obra.nome_obra} | ${input.obra.cidade} | Período: ${periodo}`)
  heading(writer, 'Resumo da obra')
  row(writer, ['Diários', input.resumo.diarios, 'Peças montadas', input.montadas], [120, 135, 120, 135])
  row(writer, ['Volume produzido', `${number(input.resumo.volume)} m³`, 'Horas trabalhadas', `${number(input.resumo.trabalho)} h`], [120, 135, 120, 135])
  row(writer, ['Horas munck', `${number(input.resumo.munck)} h`, 'Horas guindaste', `${number(input.resumo.guindaste)} h`], [120, 135, 120, 135])
  writer.y -= 8; heading(writer, 'Produção e evolução acumulada')
  const widths = [140, 100, 120, 135]; row(writer, ['Data', 'Peças', 'Volume', 'Acumulado'], widths, true)
  let acumulado = 0; for (const item of input.porDia) { acumulado += item.volume; row(writer, [date(item.data), item.pecas, `${number(item.volume)} m³`, `${number(acumulado)} m³`], widths) }
  writer.y -= 8; heading(writer, 'Produção por pavimento')
  row(writer, ['Pavimento', 'Volume'], [300, 195], true); for (const item of input.porPavimento) row(writer, [item.nome, `${number(item.volume)} m³`], [300, 195])
  writer.y -= 8; heading(writer, 'Resumo das montagens por tipo')
  row(writer, ['Tipo', 'Volume'], [300, 195], true); for (const item of input.porTipo) row(writer, [item.nome, `${number(item.volume)} m³`], [300, 195])
  writeFooter(writer); return Buffer.from(await writer.doc.save())
}
