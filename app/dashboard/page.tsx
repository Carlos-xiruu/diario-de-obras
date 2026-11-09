"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { getErrorMessage } from '@/lib/errors';
import { carregarMetricasDashboard, type DashboardMetricas } from '@/lib/services/dashboard';

interface ResumoObra {
  obra: string
  m3_total: number
  horas_munck: number
  horas_guindaste: number
}

export default function Dashboard() {
  const [dadosGrafico, setDadosGrafico] = useState<ResumoObra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [metricas, setMetricas] = useState<DashboardMetricas | null>(null);

  useEffect(() => {
    async function buscarDados() {
      try {
        const resumo = await carregarMetricasDashboard();
        setMetricas(resumo);
        setDadosGrafico(resumo.porObra.map((item) => ({ obra: item.obra, m3_total: item.volume, horas_munck: item.munck, horas_guindaste: item.guindaste })));
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setErro(getErrorMessage(error, 'Não foi possível carregar os indicadores.'));
      } finally {
        setCarregando(false);
      }
    }

    buscarDados();
  }, []);

  if (carregando) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-bold text-xl">Calculando produtividade... ⏳</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-200">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Dashboard de Gestão</h1>
            <p className="text-blue-400 font-bold uppercase tracking-widest text-sm mt-1">Produtividade em Tempo Real</p>
          </div>
          <Link href="/" className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl text-sm font-bold transition">
            Voltar ao Início
          </Link>
        </div>

        {erro ? (
          <div role="alert" className="text-center py-20 bg-red-950/40 border border-red-500/50 rounded-xl text-red-300">
            <p>{erro}</p>
          </div>
        ) : dadosGrafico.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-700 rounded-xl">
            <p>Não há dados suficientes para gerar os gráficos.</p>
          </div>
        ) : (
          <><section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">{[['Obras', metricas?.obras], ['Peças montadas', `${metricas?.montadas}/${metricas?.previstas}`], ['Volume montado', `${metricas?.volumeMontado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m³`], ['Saldo', `${metricas?.pendentes} peças`], ['Munck', `${metricas?.munck} h`], ['Guindaste', `${metricas?.guindaste} h`], ['Horas trabalhadas', `${metricas?.horas} h`], ['Execução', `${metricas?.previstas ? ((metricas.montadas / metricas.previstas) * 100).toFixed(1) : 0}%`]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-700 bg-slate-900 p-4"><p className="text-xs uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div>)}</section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Gráfico 1: Volume Montado (m³) */}
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-center">Volume Total Montado (m³) por Obra</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="obra" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="m3_total" name="m³ Montado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Horas de Equipamento */}
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-center">Consumo de Equipamentos (Horas)</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="obra" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                    <Legend />
                    <Line type="monotone" dataKey="horas_munck" name="Hrs Munck" stroke="#f59e0b" strokeWidth={3} />
                    <Line type="monotone" dataKey="horas_guindaste" name="Hrs Guindaste" stroke="#ef4444" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div></>
        )}
      </div>
    </main>
  );
}
