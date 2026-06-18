import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Montserrat, Inter } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "800", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: obras } = await supabase.from('obras').select('*');

  return (
    <main className={`relative min-h-screen p-4 md:p-8 flex flex-col items-center text-slate-200 ${inter.className}`}>
      
      {/* O Fundo "Ambient Grid" */}
      <div className="fixed inset-0 z-0 bg-[#020617] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(29,78,216,0.15),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(100,116,139,0.1),transparent_40%)]"></div>
        <div className="absolute inset-0 opacity-30" style={{ 
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px)', 
          backgroundSize: '40px 40px', 
          maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 85%)'
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mt-10 md:mt-20">
        <h1 className={`${montserrat.className} text-4xl md:text-5xl font-black text-white mb-2 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]`}>
          CANTEIROS ATIVOS
        </h1>
        <p className="text-blue-400 mb-10 font-bold tracking-widest uppercase text-sm">Selecione a obra para registrar</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loop das obras cadastradas no Banco */}
          {obras?.map((obra) => (
            <div key={obra.id} className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] flex flex-col justify-between group">
              <div>
                <h2 className={`${montserrat.className} text-2xl font-bold text-slate-100 mb-2 group-hover:text-blue-400 transition-colors`}>
                  {obra.nome_obra}
                </h2>
                <p className="text-slate-400 text-sm flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                  {obra.cidade}
                </p>
              </div>
              <div className="mt-8">
               <Link 
                  href={`/diario?obra=${encodeURIComponent(obra.nome_obra)}&cidade=${encodeURIComponent(obra.cidade)}`} 
                  className={`${montserrat.className} inline-block w-full text-center bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold tracking-widest py-4 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]`}
                >
                  ABRIR DIÁRIO
                </Link>
              </div>
            </div>
          ))}
          
          {/* Botão Fixo de Nova Obra */}
          <Link href="/nova-obra" className="bg-slate-900/30 backdrop-blur-xl border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500/50 transition-all duration-300 min-h-[200px] cursor-pointer">
            <span className="text-4xl mb-2 font-light">+</span>
            <span className={`${montserrat.className} font-bold tracking-widest text-sm`}>CADASTRAR OBRA</span>
          </Link>
          {/* Botão de Histórico */}
          <Link href="/historico" className={`${montserrat.className} flex items-center justify-center gap-2 w-full text-center bg-slate-800/50 border border-slate-700 text-slate-300 font-bold tracking-widest py-4 rounded-xl hover:bg-slate-700 transition-all duration-300`}>
            <i className="fa-solid fa-clock-rotate-left"></i>
            HISTÓRICO DE OBRAS
          </Link>
        </div>
      </div>
    </main>
  );
}