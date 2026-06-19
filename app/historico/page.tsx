export const dynamic = 'force-dynamic';
import { supabase } from "@/lib/supabase";

export default async function Historico() {
  const { data: registros } = await supabase.from('diarios').select('*').order('created_at', { ascending: false });

  return (
    <main className="p-8 bg-slate-950 min-h-screen text-slate-200">
      <h1 className="text-3xl font-black mb-8">HISTÓRICO DE DIÁRIOS</h1>
      <div className="grid gap-4">
        {registros?.map((item) => (
          <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <h3 className="font-bold">{item.obra} - {item.data}</h3>
            <p className="text-sm text-slate-400">Equipe: {item.equipe?.join(', ')}</p>
          </div>
        ))}
      </div>
    </main>
  );
}