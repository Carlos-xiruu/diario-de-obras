export const dynamic = 'force-dynamic';
import { supabase } from "@/lib/supabase";

export default async function Historico() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const { data: registros, error } = await supabase
    .from('diarios')
    .select('*');

  return (
    <main className="p-8 bg-slate-950 min-h-screen text-slate-200">
      <h1 className="text-3xl font-black mb-8">HISTÓRICO DE DIÁRIOS</h1>
      
      {/* DEBUG: Isso vai mostrar se você está conectado no banco certo */}
      <div className="bg-slate-900 p-4 border border-blue-500 rounded-lg mb-6">
        <p className="text-xs text-blue-400 font-mono">Conectado em: {supabaseUrl}</p>
        <p className="text-sm">Total de registros encontrados: {registros ? registros.length : "Erro ao carregar"}</p>
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
          <p className="text-slate-500">A tabela está vazia neste banco de dados.</p>
        )}
      </div>
    </main>
  );
}