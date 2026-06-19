"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Montserrat, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "800", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function Visualizar() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [dados, setDados] = useState<any>(null);

  useEffect(() => {
    if (id) {
      const fetchDiario = async () => {
        const { data, error } = await supabase
          .from('diarios')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data) setDados(data);
        else if (error) alert("Erro ao carregar relatório: " + error.message);
      };
      fetchDiario();
    }
  }, [id]);

  if (!dados) return <main className="min-h-screen flex items-center justify-center text-white">Carregando relatório...</main>;

  return (
    <main className={`min-h-screen p-4 md:p-8 flex justify-center text-slate-200 ${inter.className}`}>
      <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden my-4">
        
        {/* Cabeçalho */}
        <div className="p-8 text-center border-b border-slate-700/50 bg-slate-800/30">
          <h1 className={`${montserrat.className} text-3xl font-black text-white uppercase tracking-tight`}>
            Relatório de Obra
          </h1>
          <p className="text-blue-400 font-bold tracking-[0.2em] uppercase text-sm mt-2">Visualização de Registro</p>
        </div>

        <div className="p-6 md:p-10 space-y-10">
          
          {/* Identificação */}
          <section>
            <h2 className={`${montserrat.className} text-xl font-extrabold text-slate-100 uppercase mb-6`}>1. Identificação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Obra / Cliente</label>
                <p className="text-white font-bold">{dados.obra}</p>
              </div>
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade</label>
                <p className="text-white font-bold">{dados.cidade}</p>
              </div>
            </div>
          </section>

          {/* Produção */}
          <section>
            <h2 className={`${montserrat.className} text-xl font-extrabold text-slate-100 uppercase mb-6 pt-6 border-t border-slate-700/50`}>2. Produção</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: "Equipe", value: dados.equipe },
                 { label: "M³ Montado", value: dados.m3_montado },
                 { label: "Encunhamento", value: dados.encunhamento_pilares ? "SIM" : "NÃO" },
                 { label: "Clima", value: dados.clima }
               ].map((item, i) => (
                 <div key={i} className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{item.label}</label>
                    <p className="text-white font-bold">{item.value || "-"}</p>
                 </div>
               ))}
            </div>
          </section>

          {/* Observações */}
          <section>
             <h2 className={`${montserrat.className} text-xl font-extrabold text-slate-100 uppercase mb-4 pt-6 border-t border-slate-700/50`}>Observações</h2>
             <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-300">
               {dados.observacoes || "Nenhuma observação registrada."}
             </div>
          </section>

          {/* Botão de Voltar */}
          <button 
            onClick={() => window.history.back()}
            className="w-full mt-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
          >
            VOLTAR
          </button>
        </div>
      </div>
    </main>
  );
}