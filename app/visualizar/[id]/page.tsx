export const dynamic = 'force-dynamic';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function VisualizarDiario({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  // Busca o item pelo ID
  const { data: item, error } = await supabase
    .from('diarios')
    .select('*')
    .eq('id', params.id)
    .single();

  // Mostra o erro real na tela para podermos corrigir
  if (error) {
    return (
      <main className="p-8 text-red-500">
        <h1 className="text-xl font-bold">Erro ao buscar diário</h1>
        <p><strong>ID buscado:</strong> {params.id}</p>
        <p><strong>Mensagem do banco:</strong> {error.message}</p>
        <p><strong>Detalhes:</strong> {error.details}</p>
      </main>
    );
  }

  return (
    <main className="p-8 bg-white text-slate-900 min-h-screen">
       {/* O restante do seu código de renderização continua aqui... */}
       <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black mb-6 uppercase border-b-2 border-slate-900 pb-4">
          Diário de Obra - {item.obra || "Sem nome"}
        </h1>
        {/* ... */}
      </div>
    </main>
  );
}