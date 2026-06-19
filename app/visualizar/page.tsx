"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Montserrat, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "800", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Componente Interno que usa o useSearchParams
function VisualizarContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [dados, setDados] = useState<any>(null);

  useEffect(() => {
    if (id) {
      const fetchDiario = async () => {
        const { data } = await supabase
          .from('diarios')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data) setDados(data);
      };
      fetchDiario();
    }
  }, [id]);

  if (!dados) return <div className="p-8 text-center text-white">Carregando relatório...</div>;

  return (
    <main className={`min-h-screen p-4 md:p-8 flex justify-center text-slate-200 ${inter.className}`}>
      <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden my-4">
        <div className="p-8 text-center border-b border-slate-700/50 bg-slate-800/30">
          <h1 className={`${montserrat.className} text-3xl font-black text-white uppercase tracking-tight`}>
            Relatório de Obra
          </h1>
        </div>
        <div className="p-6 md:p-10 space-y-10">
           {/* ... (Mantenha o mesmo JSX que eu te enviei anteriormente aqui dentro) ... */}
           {/* (O restante do layout igual ao que você já tinha) */}
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

// O componente principal que exportamos (com o Suspense)
export default function Visualizar() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Carregando...</div>}>
      <VisualizarContent />
    </Suspense>
  );
}