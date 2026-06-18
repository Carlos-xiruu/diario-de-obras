"use client";

import { useState } from "react";
import { Montserrat, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "800", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function NovaObra() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [salvando, setSalvando] = useState(false);

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    const { error } = await supabase
      .from('obras')
      .insert([{ nome_obra: nome, cidade: cidade }]);

    setSalvando(false);

    if (error) {
      alert("Erro ao cadastrar obra: " + error.message);
    } else {
      alert("Obra cadastrada com sucesso!");
      router.push("/"); // Manda de volta para a tela inicial
      router.refresh(); // Atualiza a lista de obras
    }
  };

  return (
    <main className={`relative min-h-screen p-4 md:p-8 flex justify-center items-center text-slate-200 ${inter.className}`}>
      
      {/* Background Neon */}
      <div className="fixed inset-0 z-0 bg-[#020617] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(29,78,216,0.15),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(100,116,139,0.1),transparent_40%)]"></div>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'linear-gradient(to bottom, black, transparent 85%)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 85%)' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
        
        <div className="p-8 text-center border-b border-slate-700/50 relative overflow-hidden bg-slate-800/30">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-700 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
          <h1 className={`${montserrat.className} text-2xl md:text-3xl font-black tracking-tight text-white mt-2 uppercase`}>
            Novo Canteiro
          </h1>
          <p className={`${montserrat.className} text-blue-400 text-xs mt-3 font-bold tracking-[0.2em] uppercase`}>
            Abertura de Obra
          </p>
        </div>

        <form onSubmit={cadastrar} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Nome da Obra / Cliente</label>
            <input 
              required 
              type="text" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Galpão Logístico Lote 02" 
              className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] placeholder-slate-600" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Cidade e Estado</label>
            <input 
              required 
              type="text" 
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: Jaraguá do Sul, SC" 
              className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] placeholder-slate-600" 
            />
          </div>

          <div className="pt-4 space-y-3">
            <button 
              type="submit" 
              disabled={salvando}
              className={`${montserrat.className} w-full font-black tracking-widest rounded-xl text-lg uppercase px-5 py-4 text-center transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_32px_rgba(59,130,246,0.7)] hover:-translate-y-1`}
            >
              {salvando ? "Salvando..." : "Cadastrar Obra"}
            </button>
            
            <Link href="/" className={`${montserrat.className} block w-full text-center font-bold tracking-widest rounded-xl text-sm uppercase px-5 py-4 border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors`}>
              Voltar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}