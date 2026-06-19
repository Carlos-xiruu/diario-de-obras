export const dynamic = 'force-dynamic';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function Historico() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: registros, error } = await supabase.from('diarios').select('*');

  return (
    <main className="p-8 bg-slate-950 min-h-screen text-slate-200">
      <h1 className="text-3xl font-black mb-8">HISTÓRICO DE DIÁRIOS</h1>
      
      <div className="grid gap-4">
        {registros?.map((item) => (
          <div key={item.id} className="bg-slate-900 p-6 rounded-xl border border-slate-700 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{item.obra || "Obra sem nome"}</h3>
              <p className="text-sm text-slate-400">Data: {item.data_registro} | Equipe: {item.equipe}</p>
            </div>
            <Link 
              href={`/visualizar/${item.id}`}
              className="bg-blue-600 px-4 py-2 rounded-lg text-white font-bold hover:bg-blue-500 transition-all"
            >
              Ver Diário
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}