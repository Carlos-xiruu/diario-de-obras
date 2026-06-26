"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Montserrat, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "800", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function EditarDiario() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  // Estados do formulário
  const [obra, setObra] = useState("");
  const [cidade, setCidade] = useState("");
  const [dataRegistro, setDataRegistro] = useState("");
  const [clima, setClima] = useState("");
  const [encunhamento, setEncunhamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [equipe, setEquipe] = useState<string[]>([]);
  const [nomeAtual, setNomeAtual] = useState("");
  const [horasTrabalhadas, setHorasTrabalhadas] = useState("");
  const [eixosMontados, setEixosMontados] = useState("");
  const [munkHrs, setMunkHrs] = useState("");
  const [guindasteHrs, setGuindasteHrs] = useState("");
  const [m3Montado, setM3Montado] = useState("");
  const [qtdBisnagasPu, setQtdBisnagasPu] = useState("");

  // Carregar os dados antigos do banco ao abrir a tela
  useEffect(() => {
    if (!id) return;

    async function carregarDados() {
      try {
        const { data, error } = await supabase
          .from('diarios')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setObra(data.obra || "");
          setCidade(data.cidade || "");
          setDataRegistro(data.data_registro || "");
          setClima(data.clima || "");
          setEncunhamento(data.encunhamento_pilares ? "sim" : "nao");
          setObservacoes(data.observacoes || "");
          setEquipe(data.equipe ? data.equipe.split(", ").filter(Boolean) : []);
          setHorasTrabalhadas(String(data.horas_trabalhadas || ""));
          setEixosMontados(data.eixos_montados || "");
          setMunkHrs(String(data.munk_hrs || ""));
          setGuindasteHrs(String(data.guindaste_hrs || ""));
          setM3Montado(String(data.m3_montado || ""));
          setQtdBisnagasPu(String(data.qtd_bisnagas_pu || ""));
        }
      } catch (err) {
        alert("Erro ao carregar dados do diário: " + (err as Error).message);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [id]);

  const adicionarMontador = () => {
    if (nomeAtual.trim() !== "") {
      setEquipe([...equipe, nomeAtual.trim()]);
      setNomeAtual("");
    }
  };

  const removerMontador = (index: number) => {
    setEquipe(equipe.filter((_, i) => i !== index));
  };

  const salvarAlteracoes = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    const limparNumero = (val: string) => {
      if (!val) return 0;
      return Number(val.replace(',', '.')) || 0;
    };

    const payload = { 
      obra, 
      cidade, 
      data_registro: dataRegistro,
      clima, 
      equipe: equipe.join(", "),
      munk_hrs: limparNumero(munkHrs),
      guindaste_hrs: limparNumero(guindasteHrs), 
      horas_trabalhadas: limparNumero(horasTrabalhadas), 
      m3_montado: limparNumero(m3Montado), 
      qtd_bisnagas_pu: limparNumero(qtdBisnagasPu), 
      eixos_montados: eixosMontados, 
      encunhamento_pilares: encunhamento === 'sim',
      observacoes 
    };

    try {
      // Usamos .update() em vez de .insert() filtrando pelo ID do diário atual
      const { error } = await supabase
        .from('diarios')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      alert("Diário atualizado com sucesso!");
      router.push(`/visualizar/${id}`); // Volta para a tela do PDF atualizada
      router.refresh();
    } catch (error) {
      alert("Erro ao atualizar: " + (error as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center font-bold">A carregar dados do formulário... ⏳</div>;
  }

  return (
    <main className={`relative min-h-screen p-4 md:p-8 flex justify-center text-slate-200 ${inter.className}`}>
      <div className="fixed inset-0 z-0 bg-[#020617] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(29,78,216,0.15),transparent_40%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl my-4 overflow-hidden">
        
        <div className="p-8 text-center border-b border-slate-700/50 relative bg-slate-800/30">
          <button type="button" onClick={() => router.back()} className="absolute top-6 left-6 text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 font-bold">
            &larr; Cancelar
          </button>
          <h1 className={`${montserrat.className} text-2xl md:text-3xl font-black tracking-tight text-white uppercase mt-4`}>
            Editar Diário de Obra
          </h1>
        </div>

        <form onSubmit={salvarAlteracoes} className="p-6 md:p-10 space-y-10">
          
          <section>
            <h2 className={`${montserrat.className} text-xl font-extrabold text-slate-100 mb-6 uppercase`}>1. Identificação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-300 mb-2">Obra / Cliente</label>
                <input required type="text" value={obra} onChange={(e) => setObra(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Cidade</label>
                <input required type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Data do Registro</label>
                <input required type="date" value={dataRegistro} onChange={(e) => setDataRegistro(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none" />
              </div>
            </div>
          </section>

          <section>
            <h2 className={`${montserrat.className} text-xl font-extrabold text-slate-100 mb-6 uppercase pt-6 border-t border-slate-700/50`}>2. Produção e Maquinário</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-300 mb-2">Equipe Presente</label>
                <div className="flex gap-2">
                  <input type="text" value={nomeAtual} onChange={(e) => setNomeAtual(e.target.value)} placeholder="Adicionar montador..." className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none" />
                  <button type="button" onClick={adicionarMontador} className="bg-blue-600 text-white px-6 font-bold rounded-xl">+</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {equipe.map((nome, i) => (
                    <span key={i} className="bg-slate-800 border border-slate-600 text-blue-400 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      {nome}
                      <button type="button" onClick={() => removerMontador(i)} className="text-red-400 core-link">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Horas Trabalhadas</label>
                <input type="text" value={horasTrabalhadas} onChange={(e) => setHorasTrabalhadas(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Eixos Montados</label>
                <input type="text" value={eixosMontados} onChange={(e) => setEixosMontados(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Munck / Hrs</label>
                <input type="text" value={munkHrs} onChange={(e) => setMunkHrs(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Guindaste / Hrs</label>
                <input type="text" value={guindasteHrs} onChange={(e) => setGuindasteHrs(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">M³ Montado</label>
                <input type="text" value={m3Montado} onChange={(e) => setM3Montado(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Bisnagas PU</label>
                <input type="text" value={qtdBisnagasPu} onChange={(e) => setQtdBisnagasPu(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none" />
              </div>
            </div>
          </section>

          <section>
            <h2 className={`${montserrat.className} text-xl font-extrabold text-slate-100 mb-6 pt-6 border-t border-slate-700/50 uppercase`}>3. Observações</h2>
            <textarea rows={4} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none resize-none"></textarea>
          </section>

          <div className="pt-8 border-t border-slate-700/50 mt-8">
            <button type="submit" disabled={enviando} className={`${montserrat.className} w-full font-black tracking-widest rounded-xl text-lg uppercase px-5 py-5 text-center bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg`}>
              {enviando ? "A salvar alterações..." : "Salvar Alterações"}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}