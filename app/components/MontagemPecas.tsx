'use client'

import { useEffect, useState } from 'react'
import { listarPecasDaObra } from '@/lib/services/catalogo'
import type { CatalogoPeca } from '@/lib/types'
import type { MontagemSelecionada } from '@/lib/services/montagem'

export function MontagemPecas({ obraId, value, onChange }: { obraId: string | null; value: MontagemSelecionada[]; onChange: (items: MontagemSelecionada[]) => void }) {
  const [pecas, setPecas] = useState<CatalogoPeca[]>([])
  const [busca, setBusca] = useState('')
  const [pavimento, setPavimento] = useState('')

  useEffect(() => {
    if (!obraId) return
    void listarPecasDaObra(obraId).then(setPecas).catch(() => setPecas([]))
  }, [obraId])
  const selecionada = (id: string) => value.find((item) => item.obra_peca_id === id)?.quantidade ?? 0
  const mudar = (peca: CatalogoPeca, quantidade: number) => {
    // The currently selected amount belongs to this diary and is available
    // again while editing a confirmed record.
    const limite = Number(peca.quantidade_pendente) + selecionada(peca.id)
    const proxima = Math.max(0, Math.min(limite, quantidade))
    onChange(proxima === 0 ? value.filter((item) => item.obra_peca_id !== peca.id) : [...value.filter((item) => item.obra_peca_id !== peca.id), { obra_peca_id: peca.id, quantidade: proxima }])
  }
  const filtradas = pecas.filter((peca) => (Number(peca.quantidade_pendente) > 0 || selecionada(peca.id) > 0) && (!busca || peca.codigo.toLowerCase().includes(busca.toLowerCase())) && (!pavimento || peca.obra_localizacoes[0]?.nome === pavimento))
  const volume = value.reduce((total, item) => total + item.quantidade * Number(pecas.find((peca) => peca.id === item.obra_peca_id)?.volume_unitario_m3 ?? 0), 0)
  const pavimentos = [...new Set(pecas.map((peca) => peca.obra_localizacoes[0]?.nome).filter(Boolean))]
  if (!obraId) return <section className="rounded-xl border border-slate-700 p-4 text-sm text-slate-400">Selecione uma obra cadastrada para lançar peças.</section>
  return <section className="space-y-3 rounded-xl border border-emerald-700/50 bg-emerald-950/20 p-4 print:hidden"><div><h2 className="font-black text-emerald-300">PEÇAS MONTADAS NO DIA</h2><p className="text-xs text-slate-400">A confirmação exige conexão e debita o saldo no servidor.</p></div><div className="grid gap-2 sm:grid-cols-2"><input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar código" className="rounded-lg border border-slate-600 bg-slate-950 p-3" /><select value={pavimento} onChange={(event) => setPavimento(event.target.value)} className="rounded-lg border border-slate-600 bg-slate-950 p-3"><option value="">Todos os pavimentos</option>{pavimentos.map((item) => <option key={item}>{item}</option>)}</select></div><div className="max-h-80 space-y-2 overflow-y-auto">{filtradas.map((peca) => <article key={peca.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 p-3"><div><b>{peca.codigo}</b><p className="text-xs text-slate-400">{peca.obra_localizacoes[0]?.nome} · {peca.tipo} · {peca.quantidade_pendente} disponíveis</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => mudar(peca, selecionada(peca.id) - 1)} className="rounded bg-slate-700 px-3 py-2">-</button><span className="min-w-6 text-center font-bold">{selecionada(peca.id)}</span><button type="button" onClick={() => mudar(peca, selecionada(peca.id) + 1)} className="rounded bg-emerald-700 px-3 py-2">+</button></div></article>)}</div><p className="sticky bottom-0 rounded-lg bg-emerald-900 p-3 font-bold">{value.reduce((sum, item) => sum + item.quantidade, 0)} un. selecionadas · {volume.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m³</p></section>
}
