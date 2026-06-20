export const dynamic = 'force-dynamic';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function Historico() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // Buscamos os diários do banco, ordenados da data mais recente para a mais antiga
  const { data: registros, error } = await supabase
    .from('diarios')
    .select('*')
    .order('data_registro', { ascending: false });

  return (
    <main className="min-h-screen bg-[#020617] p-4 md:p-8 text-slate-200 font-sans">
      <div className="max-w-4xl mx-auto mt-4">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Histórico de Diários
            </h1>
            <p className="text-blue-400 text-sm font-bold tracking-widest uppercase mt-1">
              Documentos Salvos
            </p>
          </div>
          <Link 
            href="/" 
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-6 py-3 rounded-xl text-sm font-bold transition-colors w-full md:w-auto text-center"
          >
            &larr; Voltar ao Início
          </Link>
        </div>

        {/* Tratamento de Erro ou Lista Vazia */}
        {error ? (
          <div className="bg-red-950/40 border border-red-500/50 p-6 rounded-xl text-red-400 font-bold text-center">
            Erro ao carregar histórico: {error.message}
          </div>
        ) : !registros || registros.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-dashed border-slate-700 rounded-2xl">
            <p className="text-slate-400 font-bold text-lg mb-2">Nenhum diário registrado ainda.</p>
            <p className="text-slate-500 text-sm">Os diários salvos aparecerão nesta lista.</p>
          </div>
        ) : (
          
          /* Lista de Diários */
          <div className="grid gap-4">
            {registros.map((diario) => (
              <div 
                key={diario.id} 
                className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/50 transition-all shadow-lg"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white uppercase mb-2">
                    {diario.obra || "Obra sem nome"}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:flex md:gap-6 gap-2 text-sm text-slate-400 font-medium">
                    <span className="flex items-center gap-2">
                      <span className="text-blue-400">📅</span> 
                      {diario.data_registro ? diario.data_registro.split('-').reverse().join('/') : "Data não informada"}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-blue-400">📍</span> 
                      {diario.cidade || "Cidade não informada"}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-blue-400">🌤️</span> 
                      {diario.clima || "N/A"}
                    </span>
                  </div>
                </div>
                
                <Link 
                  href={`/visualizar/${diario.id}`}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl text-center transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] whitespace-nowrap"
                >
                  Abrir Relatório
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}