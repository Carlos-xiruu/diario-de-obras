'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useState } from 'react'
import { useParams } from 'next/navigation'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { carregarMetricasObra } from '@/lib/services/dashboard'

const inPeriod = (date: string | null, inicio: string, fim: string) => Boolean(date) && (!inicio || date! >= inicio) && (!fim || date! <= fim)

export default function DashboardObraPage() {
  const [dados, setDados] = useState<Awaited<ReturnType<typeof carregarMetricasObra>> | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [pavimento, setPavimento] = useState('')
  const [tipo, setTipo] = useState('')
  const { id } = useParams<{ id: string }>()
  const carregar = useEffectEvent(async () => { try { setErro(null); setDados(await carregarMetricasObra(id)) } catch (error) { setErro(error instanceof Error ? error.message : 'Não foi possível carregar os indicadores.') } })

  useEffect(() => { if (!id) return; const timer = window.setTimeout(() => void carregar(), 0); const onFocus = () => void carregar(); window.addEventListener('focus', onFocus); return () => { window.clearTimeout(timer); window.removeEventListener('focus', onFocus) } }, [id])
  if (erro) return <main className="min-h-screen bg-slate-950 p-6 text-red-300" role="alert">{erro}</main>
  if (!dados) return <main className="min-h-screen bg-slate-950 p-6 text-slate-300">Carregando indicadores da obra...</main>

  const montagens = dados.montagens.filter((item) => inPeriod(item.data, inicio, fim) && (!pavimento || item.pavimento === pavimento) && (!tipo || item.tipo === tipo))
  const diarioIds = new Set(montagens.map((item) => item.diarioId))
  const diarios = dados.diarios.filter((diario) => inPeriod(diario.data_registro, inicio, fim) && (!pavimento && !tipo || diario.montagem_status !== 'confirmado' || diarioIds.has(diario.id)))
  const porDia = new Map<string, number>()
  for (const diario of diarios) {
    if (!diario.data_registro) continue
    const volume = diario.montagem_status === 'legado' && !pavimento && !tipo ? Number(diario.m3_montado) : diario.montagem_status === 'confirmado' ? montagens.filter((item) => item.diarioId === diario.id).reduce((total, item) => total + item.volume, 0) : 0
    porDia.set(diario.data_registro, (porDia.get(diario.data_registro) ?? 0) + volume)
  }
  const evolucao = [...porDia].map(([data, volume]) => ({ data, volume })).sort((a, b) => a.data.localeCompare(b.data)).reduce<{ data: string; volume: number; acumulado: number }[]>((items, item) => [...items, { ...item, acumulado: (items.at(-1)?.acumulado ?? 0) + item.volume }], [])
  const agrupar = (key: 'pavimento' | 'tipo') => [...montagens.reduce((map, item) => map.set(item[key], (map.get(item[key]) ?? 0) + item.volume), new Map<string, number>())].map(([nome, volume]) => ({ nome, volume }))
  const volume = evolucao.reduce((total, item) => total + item.volume, 0)
  const pecas = montagens.reduce((total, item) => total + item.quantidade, 0)
  const pavimentos = [...new Set(dados.montagens.map((item) => item.pavimento))].sort()
  const tipos = [...new Set(dados.montagens.map((item) => item.tipo))].sort()

  return <main className="min-h-screen bg-slate-950 p-4 text-slate-200 md:p-8"><div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-widest text-blue-400">Dashboard da obra</p><h1 className="text-3xl font-black text-white">{dados.obra.nome_obra}</h1><p className="text-slate-400">{dados.obra.cidade}</p></div><div className="flex flex-wrap gap-2"><Link href={`/obras/${id}/pecas`} className="rounded-xl border border-slate-600 px-4 py-3 font-bold">Peças</Link><Link href={`/obras/${id}/relatorios`} className="rounded-xl border border-slate-600 px-4 py-3 font-bold">Relatórios</Link><Link href={`/diario?obraId=${id}&obra=${encodeURIComponent(dados.obra.nome_obra)}&cidade=${encodeURIComponent(dados.obra.cidade)}`} className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white">Novo diário</Link></div></header><section className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-4"><Filter label="De" value={inicio} onChange={setInicio} type="date" /><Filter label="Até" value={fim} onChange={setFim} type="date" /><SelectFilter label="Pavimento" value={pavimento} onChange={setPavimento} values={pavimentos} /><SelectFilter label="Tipo" value={tipo} onChange={setTipo} values={tipos} /></section><p className="text-xs text-slate-400">Volumes legados são incluídos somente no filtro de período, pois não têm pavimento ou tipo estruturado.</p><section className="grid grid-cols-2 gap-3 md:grid-cols-4">{[['Peças no filtro', pecas], ['Volume no filtro', `${volume.toFixed(2)} m³`], ['Diários', diarios.length], ['Saldo atual', `${dados.pendentes} peças`], ['Previstas', dados.previstas], ['Montadas atuais', dados.montadas], ['Munck', `${dados.horas.munck} h`], ['Guindaste', `${dados.horas.guindaste} h`]].map(([label, value]) => <article key={String(label)} className="rounded-xl border border-slate-700 bg-slate-900 p-4"><p className="text-xs uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></article>)}</section><div className="grid gap-6 lg:grid-cols-2"><Chart title="Evolução acumulada" data={evolucao} dataKey="acumulado" /><Chart title="Volume por pavimento" data={agrupar('pavimento')} dataKey="volume" label="nome" bar /><Chart title="Volume por tipo" data={agrupar('tipo')} dataKey="volume" label="nome" bar /><Chart title="Produção por dia" data={evolucao} dataKey="volume" bar /></div></div></main>
}

function Filter({ label, value, onChange, type }: { label: string; value: string; onChange: (value: string) => void; type: string }) { return <label className="text-sm font-bold">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3" /></label> }
function SelectFilter({ label, value, onChange, values }: { label: string; value: string; onChange: (value: string) => void; values: string[] }) { return <label className="text-sm font-bold">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3"><option value="">Todos</option>{values.map((item) => <option key={item} value={item}>{item}</option>)}</select></label> }
function Chart({ title, data, dataKey, label = 'data', bar = false }: { title: string; data: { [key: string]: string | number }[]; dataKey: string; label?: string; bar?: boolean }) { return <section className="h-80 rounded-xl border border-slate-700 bg-slate-900 p-5"><h2 className="mb-4 font-bold text-white">{title}</h2><ResponsiveContainer width="100%" height="90%">{bar ? <BarChart data={data}><CartesianGrid stroke="#334155" /><XAxis dataKey={label} /><YAxis /><Tooltip /><Bar dataKey={dataKey} fill="#2563eb" /></BarChart> : <LineChart data={data}><CartesianGrid stroke="#334155" /><XAxis dataKey={label} /><YAxis /><Tooltip /><Line type="monotone" dataKey={dataKey} stroke="#22c55e" strokeWidth={3} /></LineChart>}</ResponsiveContainer></section> }
