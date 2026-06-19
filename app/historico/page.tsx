export const dynamic = 'force-dynamic';
import { supabase } from "@/lib/supabase";

export default async function Historico() {
  // Vamos capturar o erro, se houver
  const { data: registros, error } = await supabase
    .from('diarios')
    .select('*')
    .order('data_registro', { ascending: false });

  if (error) {
    console.error("ERRO DO SUPABASE:", error);
    return <main className="p-8 text-red-500">Erro ao carregar dados: {error.message}</main>;
  }

  return (
    <main className="p-8 bg-slate-950 min-h-screen text-slate-200">
      <h1 className="text-3xl font-black mb-8">HISTÓRICO DE DIÁRIOS</h1>
      
      {/* Debug rápido na tela */}
      <div className="mb-4 text-xs text-slate-500">
        Total de itens encontrados: {registros?.length || 0}
      </div>

      <div className="grid gap-4">
        {registros && registros.length > 0 ? (
          registros.map((item) => (
            <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <h3 className="font-bold">{item.obra || "Sem nome"} - {item.data || "Sem data"}</h3>
              <p className="text-sm text-slate-400">Equipe: {item.equipe?.join(', ') || "Não informada"}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-500">Nenhum registro encontrado no banco de dados.</p>
        )}
      </div>
    </main>
  );
}