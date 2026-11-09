"use client";

import Link from 'next/link'
import { useEffect, useEffectEvent, useState } from 'react'
import { useParams } from 'next/navigation'
import { getErrorMessage } from '@/lib/errors'
import { canManageObras } from '@/lib/permissions'
import { buscarAcessoAtual } from '@/lib/services/acessos'
import { listarImportacoesDaObra, listarPecasDaObra } from '@/lib/services/catalogo'
import { buscarObra } from '@/lib/services/obras'
import type { CatalogoImportacao, CatalogoPeca, Obra, PapelUsuario } from '@/lib/types'

const PAGE_SIZE = 25

type Preview = {
  totals: { grupos: number; quantidade_prevista: number; volume_previsto_m3: number }
  locations: string[]
  types: string[]
  errors: { line: number; message: string }[]
}

export default function PecasDaObraPage() {
  const params = useParams<{ id: string }>()
  const obraId = params.id
  const [obra, setObra] = useState<Obra | null>(null)
  const [pecas, setPecas] = useState<CatalogoPeca[]>([])
  const [importacoes, setImportacoes] = useState<CatalogoImportacao[]>([])
  const [papel, setPapel] = useState<PapelUsuario | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [hash, setHash] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [busca, setBusca] = useState('')
  const [pavimento, setPavimento] = useState('')
  const [tipo, setTipo] = useState('')
  const [situacao, setSituacao] = useState('')
  const [pagina, setPagina] = useState(1)

  const carregar = async () => {
    try {
      setErro(null)
      const [obraAtual, acesso, pecasAtuais, importacoesAtuais] = await Promise.all([
        buscarObra(obraId), buscarAcessoAtual(), listarPecasDaObra(obraId), listarImportacoesDaObra(obraId),
      ])
      setObra(obraAtual)
      setPapel(acesso?.ativo ? acesso.papel : null)
      setPecas(pecasAtuais)
      setImportacoes(importacoesAtuais)
    } catch (error) {
      setErro(getErrorMessage(error, 'Não foi possível carregar o catálogo desta obra.'))
    }
  }
  const carregarAoAbrir = useEffectEvent(() => { void carregar() })

  useEffect(() => {
    const timer = window.setTimeout(() => { carregarAoAbrir() }, 0)
    return () => window.clearTimeout(timer)
  }, [obraId])

  const enviarParaPrevia = async () => {
    if (!arquivo) return
    setProcessando(true)
    setErro(null)
    try {
      const formData = new FormData()
      formData.set('arquivo', arquivo)
      const response = await fetch(`/api/obras/${obraId}/catalogo/preview`, { method: 'POST', body: formData })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error)
      setPreview(payload.preview)
      setHash(payload.hash)
    } catch (error) {
      setPreview(null)
      setHash(null)
      setErro(getErrorMessage(error, 'Não foi possível validar a planilha.'))
    } finally {
      setProcessando(false)
    }
  }

  const confirmarImportacao = async () => {
    if (!arquivo || !hash || !preview || preview.errors.length > 0) return
    setProcessando(true)
    setErro(null)
    try {
      const formData = new FormData()
      formData.set('arquivo', arquivo)
      formData.set('hash', hash)
      const response = await fetch(`/api/obras/${obraId}/catalogo/confirmar`, { method: 'POST', body: formData })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error)
      setPreview(null)
      setHash(null)
      setArquivo(null)
      await carregar()
    } catch (error) {
      setErro(getErrorMessage(error, 'Não foi possível confirmar a importação.'))
    } finally {
      setProcessando(false)
    }
  }

  const pavimentos = [...new Set(pecas.map((peca) => peca.obra_localizacoes[0]?.nome).filter(Boolean) as string[])].sort()
  const tipos = [...new Set(pecas.map((peca) => peca.tipo))].sort()
  const filtradas = pecas.filter((peca) => (
    (!busca || peca.codigo.toLowerCase().includes(busca.toLowerCase()))
    && (!pavimento || peca.obra_localizacoes[0]?.nome === pavimento)
    && (!tipo || peca.tipo === tipo)
    && (!situacao || (situacao === 'disponiveis' && Number(peca.quantidade_montada) === 0) || (situacao === 'parciais' && Number(peca.quantidade_montada) > 0 && Number(peca.quantidade_pendente) > 0) || (situacao === 'concluidas' && Number(peca.quantidade_pendente) === 0))
  ))
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const itensPagina = filtradas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)
  const resumo = pecas.reduce((total, peca) => ({ quantidade: total.quantidade + Number(peca.quantidade_prevista), volume: total.volume + Number(peca.volume_total_previsto_m3) }), { quantidade: 0, volume: 0 })

  return <main className="min-h-screen bg-[#020617] p-4 md:p-8 text-slate-200">
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-bold uppercase tracking-widest text-blue-400">Catálogo de peças</p><h1 className="text-3xl font-black text-white">{obra?.nome_obra ?? 'Carregando obra...'}</h1></div>
        <div className="flex gap-2"><Link href={`/obras/${obraId}/historico-importacao`} className="rounded-xl border border-slate-600 px-4 py-3 text-center font-bold hover:bg-slate-800">Histórico Excel</Link><Link href="/" className="rounded-xl border border-slate-600 px-4 py-3 text-center font-bold hover:bg-slate-800">Voltar às obras</Link></div>
      </div>
      {erro && <p role="alert" className="rounded-xl border border-red-500/50 bg-red-950/40 p-4 font-bold text-red-300">{erro}</p>}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Previstas" value={resumo.quantidade.toLocaleString('pt-BR')} />
        <Metric label="Volume previsto" value={`${resumo.volume.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m³`} />
        <Metric label="Pavimentos" value={pavimentos.length.toString()} />
        <Metric label="Tipos" value={tipos.length.toString()} />
      </section>
      {canManageObras(papel) && <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h2 className="font-bold text-white">Importar planilha de peças</h2>
        <p className="mt-1 text-sm text-slate-400">A importação só será gravada após a confirmação da prévia.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row"><input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { setArquivo(event.target.files?.[0] ?? null); setPreview(null); setHash(null) }} className="block w-full text-sm" /><button type="button" disabled={!arquivo || processando} onClick={enviarParaPrevia} className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">{processando ? 'Validando...' : 'Validar planilha'}</button></div>
        {preview && <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4"><p className="font-bold text-white">Prévia: {preview.totals.grupos} grupos, {preview.totals.quantidade_prevista} unidades, {preview.totals.volume_previsto_m3.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m³</p><p className="mt-1 text-sm text-slate-400">{preview.locations.length} pavimentos e {preview.types.length} tipos identificados.</p>{preview.errors.length > 0 ? <ul className="mt-3 text-sm text-red-300">{preview.errors.slice(0, 8).map((item) => <li key={`${item.line}-${item.message}`}>Linha {item.line}: {item.message}</li>)}</ul> : <button type="button" disabled={processando} onClick={confirmarImportacao} className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-50">Confirmar importação</button>}</div>}
      </section>}
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="grid gap-3 md:grid-cols-4"><input value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(1) }} placeholder="Buscar código" className="rounded-xl border border-slate-600 bg-slate-950 p-3" /><select value={pavimento} onChange={(event) => { setPavimento(event.target.value); setPagina(1) }} className="rounded-xl border border-slate-600 bg-slate-950 p-3"><option value="">Todos os pavimentos</option>{pavimentos.map((item) => <option key={item}>{item}</option>)}</select><select value={tipo} onChange={(event) => { setTipo(event.target.value); setPagina(1) }} className="rounded-xl border border-slate-600 bg-slate-950 p-3"><option value="">Todos os tipos</option>{tipos.map((item) => <option key={item}>{item}</option>)}</select><select value={situacao} onChange={(event) => { setSituacao(event.target.value); setPagina(1) }} className="rounded-xl border border-slate-600 bg-slate-950 p-3"><option value="">Todas</option><option value="disponiveis">Disponíveis</option><option value="parciais">Parciais</option><option value="concluidas">Concluídas</option></select></div>
        <div className="mt-5 grid gap-3 md:hidden">{itensPagina.map((peca) => <PieceCard key={peca.id} peca={peca} />)}</div>
        <div className="mt-5 hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th>Código</th><th>Pavimento</th><th>Tipo</th><th>Prev.</th><th>Unit.</th><th>Total</th><th>Pendente</th></tr></thead><tbody>{itensPagina.map((peca) => <tr key={peca.id} className="border-t border-slate-800"><td className="py-3 font-bold text-white">{peca.codigo}</td><td>{peca.obra_localizacoes[0]?.nome}</td><td>{peca.tipo}</td><td>{peca.quantidade_prevista}</td><td>{Number(peca.volume_unitario_m3).toLocaleString('pt-BR')} m³</td><td>{Number(peca.volume_total_previsto_m3).toLocaleString('pt-BR')} m³</td><td>{peca.quantidade_pendente}</td></tr>)}</tbody></table></div>
        <div className="mt-5 flex items-center justify-between text-sm"><span>{filtradas.length} peças</span><div className="flex gap-2"><button disabled={pagina === 1} onClick={() => setPagina((current) => current - 1)} className="rounded border border-slate-600 px-3 py-2 disabled:opacity-50">Anterior</button><span className="px-2 py-2">{pagina}/{totalPaginas}</span><button disabled={pagina === totalPaginas} onClick={() => setPagina((current) => current + 1)} className="rounded border border-slate-600 px-3 py-2 disabled:opacity-50">Próxima</button></div></div>
      </section>
      {importacoes.length > 0 && <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><h2 className="font-bold text-white">Histórico de importações</h2>{importacoes.map((item) => <p key={item.id} className="mt-2 text-sm text-slate-400">Revisão {item.revisao}: {item.nome_arquivo} ({item.status})</p>)}</section>}
    </div>
  </main>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-700 bg-slate-900 p-4"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div> }
function PieceCard({ peca }: { peca: CatalogoPeca }) { const montado = Number(peca.quantidade_montada); const previsto = Number(peca.quantidade_prevista); const percentual = previsto ? (montado / previsto) * 100 : 0; const status = montado === 0 ? 'Disponível' : montado === previsto ? 'Concluída' : 'Parcial'; return <article className="rounded-xl border border-slate-700 p-4"><div className="flex justify-between"><strong className="text-white">{peca.codigo}</strong><span>{status}</span></div><p className="mt-1 text-sm text-slate-400">{peca.obra_localizacoes[0]?.nome} · {peca.tipo}</p><p className="mt-2 text-sm">Prev.: {previsto} · Mont.: {montado} · Restante: {peca.quantidade_pendente}</p><p className="text-sm">{Number(peca.volume_unitario_m3).toLocaleString('pt-BR')} m³/un · {(montado * Number(peca.volume_unitario_m3)).toLocaleString('pt-BR')} m³ montados · {percentual.toFixed(0)}%</p></article> }
