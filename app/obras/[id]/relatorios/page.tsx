'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'

export default function RelatoriosObraPage() {
  const { id } = useParams<{ id: string }>(); const [inicio, setInicio] = useState(''); const [fim, setFim] = useState(''); const invalido = Boolean(inicio && fim && inicio > fim)
  const query = new URLSearchParams(); if (inicio) query.set('inicio', inicio); if (fim) query.set('fim', fim)
  return <main className="min-h-screen bg-slate-950 p-4 text-slate-200 md:p-8"><div className="mx-auto max-w-2xl space-y-6"><header className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-blue-400">Relatórios</p><h1 className="text-3xl font-black text-white">Consolidado da obra</h1></div><Link href={`/obras/${id}/dashboard`} className="rounded-xl border border-slate-600 px-4 py-3 font-bold">Voltar</Link></header><section className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><h2 className="font-bold text-white">Selecione o período</h2><p className="mt-1 text-sm text-slate-400">Deixe ambos os campos em branco para incluir todo o histórico.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Data inicial<input type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3" /></label><label className="text-sm font-bold">Data final<input type="date" value={fim} onChange={(event) => setFim(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3" /></label></div>{invalido && <p role="alert" className="mt-4 text-sm font-bold text-red-300">A data inicial deve ser anterior ou igual à final.</p>}<a aria-disabled={invalido} href={invalido ? undefined : `/api/obras/${id}/relatorios/consolidado?${query}`} className="mt-6 block rounded-xl bg-blue-600 px-5 py-3 text-center font-bold text-white aria-disabled:pointer-events-none aria-disabled:opacity-50">Baixar PDF consolidado</a></section></div></main>
}
