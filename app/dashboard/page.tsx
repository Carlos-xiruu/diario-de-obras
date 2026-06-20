"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export default function Dashboard() {
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscarDados() {
      try {
        const { data, error } = await supabase.from('diarios').select('*');
        if (error) throw error;

        // Lógica para agrupar e somar os dados por Obra
        const resumoPorObra: Record<string, any> = {};

        data?.forEach((diario) => {
          const nomeObra = diario.obra || "Não identificada";
          
          if (!resumoPorObra[nomeObra]) {
            resumoPorObra[nomeObra] = {
              obra: nomeObra,
              m3_total: 0,
              horas_munck: 0,
              horas_guindaste: 0
            };
          }

          resumoPorObra[nomeObra].m3_total += Number(diario.m3_montado) || 0;
          resumoPorObra[nomeObra].horas_munck += Number(diario.munk_hrs) || 0;
          resumoPorObra[nomeObra].horas_guindaste += Number(diario.guindaste_hrs) || 0;
        });

        // Transforma o objeto em um array para o Recharts ler
        setDadosGrafico(Object.values(resumoPorObra));
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
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

        {dadosGrafico.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-700 rounded-xl">
            <p>Não há dados suficientes para gerar os gráficos.</p>
          </div>
        ) : (
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

          </div>
        )}
      </div>
    </main>
  );
}