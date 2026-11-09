"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/errors';
import { buscarDiario } from '@/lib/services/diarios';
import { listarItensMontagemDiario } from '@/lib/services/montagem';
import type { Diario } from '@/lib/types';

export default function VisualizarDiario() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [item, setItem] = useState<Diario | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [itens, setItens] = useState<Awaited<ReturnType<typeof listarItensMontagemDiario>>>([]);

  useEffect(() => {
    if (!id) return;

    async function carregarDiario() {
      try {
        const [diario, itensMontagem] = await Promise.all([buscarDiario(id), listarItensMontagemDiario(id)]);
        setItem(diario);
        setItens(itensMontagem);
      } catch (error) {
        setErro(getErrorMessage(error, 'Não foi possível carregar o diário.'));
      } finally {
        setCarregando(false);
      }
    }

    carregarDiario();
  }, [id]);

  if (carregando) {
    return <main className="p-8 text-center text-slate-500 font-bold min-h-screen bg-white">A carregar relatório...</main>;
  }

  if (erro || !item) {
    return (
      <main className="p-8 text-red-500 min-h-screen bg-white">
        <h1 className="text-xl font-bold">Erro ao carregar diário</h1>
        <p>{erro || "Diário não encontrado no banco de dados."}</p>
        <button onClick={() => router.back()} className="mt-4 bg-slate-800 text-white px-4 py-2 rounded">Voltar</button>
      </main>
    );
  }

  return (
    <main className="p-8 bg-white text-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto">
        
        {/* Barra de Ações que fica invisível no PDF */}
        <div className="print:hidden flex flex-wrap gap-3 mb-8">
          <button 
            onClick={() => router.back()}
            className="bg-slate-200 text-slate-700 px-5 py-3 rounded-lg font-bold hover:bg-slate-300 transition-colors"
          >
            &larr; Voltar
          </button>

          <a
            href={`/api/relatorios/diarios/${id}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
          >
            Baixar PDF
          </a>

          {/* NOVO: Botão para ir para a página de edição */}
          <Link 
            href={`/editar/${id}`}
            className="bg-amber-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-amber-600 transition-colors text-center shadow-md"
          >
            ✏️ Editar Dados
          </Link>
        </div>

        <h1 className="text-3xl font-black mb-6 uppercase border-b-2 border-slate-900 pb-4">
          Diário de Obra - {item.obra || "Sem nome"}
        </h1>
        <p className={`mb-6 inline-block rounded-full px-4 py-2 text-sm font-black uppercase ${item.montagem_status === 'confirmado' ? 'bg-emerald-100 text-emerald-800' : item.montagem_status === 'cancelado' ? 'bg-red-100 text-red-800' : item.montagem_status === 'legado' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'}`}>Estado: {item.montagem_status ?? 'legado'}</p>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <p><strong>Cidade:</strong> {item.cidade}</p>
          <p><strong>Data:</strong> {item.data_registro ? item.data_registro.split('-').reverse().join('/') : ""}</p>
          <p><strong>Equipe:</strong> {item.equipe}</p>
          <p><strong>Clima:</strong> {item.clima}</p>
        </div>

        <div className="space-y-3 border-t border-slate-300 pt-6">
          <h2 className="font-bold text-lg mb-4">Detalhes da Montagem</h2>
          <div className="grid grid-cols-2 gap-4">
            <p><strong>Horas Munck:</strong> {item.munk_hrs}</p>
            <p><strong>Horas Guindaste:</strong> {item.guindaste_hrs}</p>
            <p><strong>Horas Trabalhadas:</strong> {item.horas_trabalhadas}</p>
            <p><strong>M³ manual:</strong> {item.m3_montado}</p>
            <p><strong>M³ estruturado:</strong> {item.volume_estruturado_m3 ?? 0}</p>
            <p><strong>Qtd Bisnagas PU:</strong> {item.qtd_bisnagas_pu}</p>
            <p><strong>Eixos Montados:</strong> {item.eixos_montados}</p>
            <p><strong>Encunhamento Pilares:</strong> {item.encunhamento_pilares ? "Sim" : "Não"}</p>
          </div>
        </div>

        {itens.length > 0 && <section className="mt-8 border-t border-slate-300 pt-6"><h2 className="mb-3 text-lg font-bold">Peças montadas no dia</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">Pavimento</th><th>Código</th><th>Tipo</th><th>Qtd.</th><th>Vol. unit.</th><th>Total</th></tr></thead><tbody>{itens.map((peca) => <tr key={peca.obra_peca_id} className="border-b"><td className="py-2">{peca.localizacao_snapshot}</td><td className="font-bold">{peca.codigo_snapshot}</td><td>{peca.tipo_snapshot}</td><td>{peca.quantidade}</td><td>{Number(peca.volume_unitario_m3_snapshot).toLocaleString('pt-BR')} m³</td><td>{Number(peca.volume_total_m3).toLocaleString('pt-BR')} m³</td></tr>)}</tbody><tfoot><tr className="font-bold"><td colSpan={3}>Total</td><td>{itens.reduce((total, peca) => total + peca.quantidade, 0)}</td><td /><td>{itens.reduce((total, peca) => total + Number(peca.volume_total_m3), 0).toLocaleString('pt-BR')} m³</td></tr></tfoot></table></div>{item.montagem_status === 'cancelado' && <p className="mt-3 text-sm text-red-700">Montagem cancelada: os itens são exibidos como histórico e o saldo foi devolvido.</p>}</section>}

        <div className="mt-8 border-t border-slate-300 pt-6">
          <h2 className="font-bold text-lg mb-2">Observações</h2>
          <p className="bg-slate-50 p-4 rounded border border-slate-200 whitespace-pre-line">{item.observacoes || "Sem observações."}</p>
        </div>
      </div>
    </main>
  );
}
