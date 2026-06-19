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

  const { data: item, error } = await supabase
    .from('diarios')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !item) return <main className="p-8 text-red-500">Diário não encontrado ou erro ao carregar.</main>;

  return (
    <main className="p-8 bg-white text-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Botão para impressão - não aparece no papel */}
        <button 
          onClick={() => window.print()}
          className="no-print bg-blue-600 text-white px-6 py-3 rounded-lg font-bold mb-8 hover:bg-blue-700 transition-colors"
        >
          Salvar como PDF / Imprimir
        </button>

        <h1 className="text-3xl font-black mb-6 uppercase border-b-2 border-slate-900 pb-4">
          Diário de Obra - {item.obra || "Sem nome"}
        </h1>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <p><strong>Cidade:</strong> {item.cidade}</p>
          <p><strong>Data:</strong> {item.data_registro}</p>
          <p><strong>Equipe:</strong> {item.equipe}</p>
          <p><strong>Clima:</strong> {item.clima}</p>
        </div>

        <div className="space-y-3 border-t border-slate-300 pt-6">
          <h2 className="font-bold text-lg mb-4">Detalhes da Montagem</h2>
          <div className="grid grid-cols-2 gap-4">
            <p><strong>Horas Munk:</strong> {item.munk_hrs}</p>
            <p><strong>Horas Guindaste:</strong> {item.guindaste_hrs}</p>
            <p><strong>Horas Trabalhadas:</strong> {item.horas_trabalhadas}</p>
            <p><strong>M3 Montado:</strong> {item.m3_montado}</p>
            <p><strong>Qtd Bisnagas PU:</strong> {item.qtd_bisnagas_pu}</p>
            <p><strong>Eixos Montados:</strong> {item.eixos_montados}</p>
            <p><strong>Encunhamento Pilares:</strong> {item.encunhamento_pilares ? "Sim" : "Não"}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-300 pt-6">
          <h2 className="font-bold text-lg mb-2">Observações</h2>
          <p className="bg-slate-50 p-4 rounded border border-slate-200 whitespace-pre-line">{item.observacoes || "Sem observações."}</p>
          
          <h2 className="font-bold text-lg mt-6 mb-2">Informações Adicionais</h2>
          <p className="bg-slate-50 p-4 rounded border border-slate-200 whitespace-pre-line">{item.informacoes_adicionais || "Nenhuma informação adicional."}</p>
        </div>
      </div>
    </main>
  );
}