export const dynamic = 'force-dynamic';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function Historico() {
  const cookieStore = await cookies();

  // 1. Criar o cliente de servidor que lê os cookies
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

  // 2. Buscar os dados
  const { data: registros, error } = await supabase
    .from('diarios')
    .select('*');

  if (error) {
    return <main className="p-8 text-red-500">Erro: {error.message}</main>;
  }

  return (
    <main className="p-8 bg-slate-950 min-h-screen text-slate-200">
      <h1 className="text-3xl font-black mb-8">HISTÓRICO DE DIÁRIOS</h1>
      
      <div className="grid gap-4">
        {registros && registros.length > 0 ? (
          registros.map((item) => (
            <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              {/* Ajustado para usar os nomes reais do banco: data_registro e equipe */}
              <h3 className="font-bold">Obra ID: {item.obra_id || "Sem Obra"} - {item.data_registro || "Sem data"}</h3>
              <p className="text-sm text-slate-400">Equipe: {item.equipe || "Não informada"}</p>
              <p className="text-sm text-slate-400">Clima: {item.clima || "Não informado"}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-500">Nenhum registro encontrado.</p>
        )}
      </div>
    </main>
  );
}