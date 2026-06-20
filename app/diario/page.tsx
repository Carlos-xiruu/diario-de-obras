"use client";

import { useState, useEffect } from "react";
import { Montserrat, Inter } from "next/font/google";
import imageCompression from 'browser-image-compression';
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "800", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function NovoDiario() {
  const [enviando, setEnviando] = useState(false);
  const [clima, setClima] = useState("");
  const [encunhamento, setEncunhamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  
  // Agora controlamos um array (lista) de fotos
  const [fotos, setFotos] = useState<string[]>([]);
  const [comprimindo, setComprimindo] = useState(false);

  const [equipe, setEquipe] = useState<string[]>([]);
  const [nomeAtual, setNomeAtual] = useState("");

  const [obra, setObra] = useState("");
  const [cidade, setCidade] = useState("");

  // Guardamos o ID do diário após salvar para o link de compartilhamento
  const [idSalvo, setIdSalvo] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("obra")) setObra(params.get("obra") || "");
    if (params.get("cidade")) setCidade(params.get("cidade") || "");
  }, []);

  const adicionarMontador = () => {
    if (nomeAtual.trim() !== "") {
      setEquipe([...equipe, nomeAtual.trim()]);
      setNomeAtual("");
    }
  };

  const removerMontador = (index: number) => {
    setEquipe(equipe.filter((_, i) => i !== index));
  };

  // Lógica aprimorada para processar múltiplas fotos
  const processarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setComprimindo(true);
    try {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1280, useWebWorker: true };
      const novasFotosUrls: string[] = [];

      for (const file of files) {
        const compressedFile = await imageCompression(file, options);
        novasFotosUrls.push(URL.createObjectURL(compressedFile));
      }

      setFotos((prev) => [...prev, ...novasFotosUrls]);
    } catch (error) {
      alert("Erro ao processar as imagens.");
      console.error(error);
    } finally {
      setComprimindo(false);
    }
  };

  const removerFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const exportarPDF = () => window.print();

  const compartilharDiario = async () => {
    if (navigator.share) {
      try {
        const urlCompartilhar = idSalvo
          ? `${window.location.origin}/visualizar/${idSalvo}`
          : window.location.href;

        await navigator.share({
          title: `Diário de Obras - ${obra || 'Montagem'}`,
          text: idSalvo ? 'Segue o link do diário preenchido.' : 'Acompanhe nosso diário de obras.',
          url: urlCompartilhar,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado', error);
      }
    } else {
      alert("Seu navegador não suporta o botão de compartilhar nativo. Use o Exportar PDF.");
    }
  };

  const salvarDiario = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const { data, error } = await supabase
        .from('diarios')
        .insert([{ 
          obra, 
          cidade, 
          data_registro: new Date().toISOString().split('T')[0],
          clima, 
          equipe: equipe.join(", "),
          munk_hrs: 0,
          guindaste_hrs: 0, 
          horas_trabalhadas: 0, 
          m3_montado: 0, 
          qtd_bisnagas_pu: 0, 
          eixos_montados: "", 
          encunhamento_pilares: encunhamento === 'sim',
          observacoes 
        }])
        .select(); // Exige que o Supabase devolva a linha criada

      if (error) throw error;
      
      if (data && data.length > 0) {
        setIdSalvo(data[0].id); // Salva o ID para o compartilhamento funcionar
      }

      alert("Diário gravado com sucesso!");
    } catch (error) {
      alert("Erro ao salvar: " + (error as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className={`relative min-h-screen p-4 md:p-8 flex justify-center text-slate-200 print:bg-white print:text-black print:p-0 ${inter.className}`}>
      
      <div className="fixed inset-0 z-0 bg-[#020617] pointer-events-none print:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(29,78,216,0.15),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(100,116,139,0.1),transparent_40%)]"></div>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'linear-gradient(to bottom, black, transparent 85%)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 85%)' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden my-4 transition-all duration-500 print:shadow-none print:border-none print:bg-white print:text-black print:my-0">
        
        <div className="p-8 text-center border-b border-slate-700/50 relative overflow-hidden bg-slate-800/30 print:bg-transparent print:border-black print:border-b-2 print:p-4 print:pb-6">
          <Link href="/" className="absolute top-6 left-6 text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 font-bold print:hidden">
            <span className="text-xl leading-none">&larr;</span> Voltar
          </Link>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-700 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] print:hidden"></div>
          <h1 className={`${montserrat.className} text-3xl md:text-4xl font-black tracking-tight text-white print:text-black mt-4 uppercase`}>
            Diário de Obra - Montagem
          </h1>
          <p className={`${montserrat.className} text-blue-400 print:text-gray-500 text-sm mt-3 font-bold tracking-[0.2em] uppercase`}>
            Relatório de Produção Diária
          </p>
        </div>

        <form onSubmit={salvarDiario} className="p-6 md:p-10 space-y-10 print:p-4 print:space-y-6">
          
          <section>
            <div className="flex items-center gap-3 mb-6 print:mb-4">
              <span className={`${montserrat.className} w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-400 flex items-center justify-center text-sm font-black print:hidden`}>1</span>
              <h2 className={`${montserrat.className} text-xl font-extrabold tracking-tight text-slate-100 print:text-black uppercase`}>Identificação</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-x-8 print:gap-y-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-2">Obra / Cliente</label>
                <input required type="text" value={obra} onChange={(e) => setObra(e.target.value)} placeholder="Nome do canteiro" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none placeholder-slate-600 print:bg-transparent print:border-0 print:border-b print:border-gray-300 print:rounded-none print:px-0 print:py-2 print:text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-2">Cidade</label>
                <input required type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Localização" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none placeholder-slate-600 print:bg-transparent print:border-0 print:border-b print:border-gray-300 print:rounded-none print:px-0 print:py-2 print:text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-2">Data do Registro</label>
                <input required type="date" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none print:bg-transparent print:border-0 print:border-b print:border-gray-300 print:rounded-none print:px-0 print:py-2 print:text-black" />
              </div>
            </div>

            <div className="mt-6 print:mt-4 print:hidden">
              <label className="block text-sm font-bold text-slate-300 mb-3">Condição Climática</label>
              <div className="grid grid-cols-3 gap-3">
                {[{ id: "Sol", icon: "☀️", label: "SOL" }, { id: "Nublado", icon: "☁️", label: "NUBLADO" }, { id: "Chuva", icon: "🌧️", label: "CHUVA" }].map((item) => (
                  <button key={item.id} type="button" onClick={() => setClima(item.id)} className={`py-4 px-2 rounded-xl border flex flex-col items-center gap-2 ${clima === item.id ? "border-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "border-slate-700/50 bg-slate-800/40 text-slate-400"}`}>
                    <span className="text-2xl">{item.icon}</span>
                    <span className={`${montserrat.className} text-xs font-bold`}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="hidden print:block mt-4 border-b border-gray-300 pb-2">
              <p className="font-bold text-gray-600">Clima no dia: <span className="font-normal text-black ml-2 uppercase">{clima || "Não informado"}</span></p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6 pt-6 border-t border-slate-700/50 print:border-black print:pt-6 print:mb-4">
              <span className={`${montserrat.className} w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-400 flex items-center justify-center text-sm font-black print:hidden`}>2</span>
              <h2 className={`${montserrat.className} text-xl font-extrabold tracking-tight text-slate-100 print:text-black uppercase`}>Produção e Maquinário</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-x-8 print:gap-y-4 mb-6">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-2">Equipe Presente</label>
                
                <div className="flex gap-2 print:hidden">
                  <input type="text" value={nomeAtual} onChange={(e) => setNomeAtual(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarMontador(); } }} placeholder="Digite o nome e aperte Enter ou +" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 placeholder-slate-600" />
                  <button type="button" onClick={adicionarMontador} className="bg-blue-600 text-white px-6 font-bold rounded-xl hover:bg-blue-500 transition-colors">+</button>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 print:hidden">
                  {equipe.map((nome, i) => (
                    <span key={i} className="bg-slate-800 border border-slate-600 text-blue-400 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      {nome}
                      <button type="button" onClick={() => removerMontador(i)} className="text-red-400 hover:text-red-300 ml-1">✕</button>
                    </span>
                  ))}
                  {equipe.length === 0 && <span className="text-slate-500 text-sm italic">Nenhum montador adicionado.</span>}
                </div>

                <div className="hidden print:block border-b border-gray-300 pb-2 mt-1">
                  <span className="text-black">{equipe.length > 0 ? equipe.join(", ") : "Não informado"}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-2">Horas Trabalhadas</label>
                <input type="number" step="0.5" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none print:bg-transparent print:border-0 print:border-b print:border-gray-300 print:rounded-none print:px-0 print:py-2 print:text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-2">Eixos Montados</label>
                <input type="text" placeholder="Ex: Eixo A ao G" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none print:bg-transparent print:border-0 print:border-b print:border-gray-300 print:rounded-none print:px-0 print:py-2 print:text-black" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-8">
              <div>
                <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-2">Munck / Hrs</label>
                <input type="number" step="0.5" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none print:bg-transparent print:border-0 print:border-b print:border-gray-300 print:rounded-none print:px-0 print:py-2 print:text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-2">Guindaste / Hrs</label>
                <input type="number" step="0.5" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none print:bg-transparent print:border-0 print:border-b print:border-gray-300 print:rounded-none print:px-0 print:py-2 print:text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-2">M³ Montado no dia</label>
                <input type="number" step="0.01" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none print:bg-transparent print:border-0 print:border-b print:border-gray-300 print:rounded-none print:px-0 print:py-2 print:text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-2">Quantidade Bisnagas</label>
                <input type="number" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none print:bg-transparent print:border-0 print:border-b print:border-gray-300 print:rounded-none print:px-0 print:py-2 print:text-black" />
              </div>
            </div>
          </section>

          <section className="print:pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/40 border border-slate-700/50 p-6 rounded-xl print:bg-transparent print:border-none print:p-0 print:gap-8">
              <div>
                <label className="block text-sm font-bold text-yellow-400 print:text-gray-600 mb-2 uppercase">Total Acumulado (m³)</label>
                <input type="number" step="0.01" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none print:bg-transparent print:border-0 print:border-b print:border-gray-300 print:rounded-none print:px-0 print:py-2 print:text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-yellow-400 print:text-gray-600 mb-2 uppercase">Quantidade Total (PU)</label>
                <input type="number" className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none print:bg-transparent print:border-0 print:border-b print:border-gray-300 print:rounded-none print:px-0 print:py-2 print:text-black" />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6 pt-6 border-t border-slate-700/50 print:border-black print:pt-6 print:mb-4">
              <span className={`${montserrat.className} w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-400 flex items-center justify-center text-sm font-black print:hidden`}>3</span>
              <h2 className={`${montserrat.className} text-xl font-extrabold tracking-tight text-slate-100 print:text-black uppercase`}>Validação e Informações</h2>
            </div>
            
            <div className="mb-6 print:hidden">
              <label className="block text-sm font-bold text-slate-300 mb-3">Concretagem / Encunhamento dos Pilares</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setEncunhamento("sim")} className={`py-4 rounded-xl border transition-all duration-300 flex items-center justify-center gap-3 ${encunhamento === "sim" ? "border-green-400 bg-green-500/10 text-green-400" : "border-slate-700/50 bg-slate-800/40 text-slate-400"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${encunhamento === "sim" ? "border-green-400" : "border-slate-500"}`}>
                    {encunhamento === "sim" && <div className="w-2 h-2 rounded-full bg-green-400"></div>}
                  </div>
                  <span className={`${montserrat.className} font-bold`}>SIM</span>
                </button>
                <button type="button" onClick={() => setEncunhamento("nao")} className={`py-4 rounded-xl border transition-all duration-300 flex items-center justify-center gap-3 ${encunhamento === "nao" ? "border-red-400 bg-red-500/10 text-red-400" : "border-slate-700/50 bg-slate-800/40 text-slate-400"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${encunhamento === "nao" ? "border-red-400" : "border-slate-500"}`}>
                    {encunhamento === "nao" && <div className="w-2 h-2 rounded-full bg-red-400"></div>}
                  </div>
                  <span className={`${montserrat.className} font-bold`}>NÃO</span>
                </button>
              </div>
            </div>

            <div className="hidden print:block mb-4 border-b border-gray-300 pb-2">
              <p className="font-bold text-gray-600">Concretagem / Encunhamento: <span className="font-normal text-black ml-2 uppercase">{encunhamento || "Não informado"}</span></p>
            </div>

            <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-5 mb-6 text-red-300 text-xs font-bold leading-relaxed print:bg-transparent print:border-none print:text-gray-500 print:p-0 print:mb-6">
              <ul className="list-disc pl-4 space-y-2">
                <li>PROGRAMAÇÃO DE AGREGADO DEVE SER COMUNICADO 1 DIA DE ANTECEDÊNCIA.</li>
                <li>PROGRAMAÇÃO DE EQUIPAMENTO DO CLIENTE: COMUNICAR COM 01 DIA DE ANTECEDÊNCIA.</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-2">Informações Adicionais / Observação</label>
              <textarea 
                rows={4} 
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 outline-none resize-none print:hidden" 
                placeholder="Relate eventos importantes, atrasos..."
              ></textarea>
              <div className="hidden print:block w-full text-black whitespace-pre-wrap min-h-[80px] border-b border-gray-300 pb-2">
                {observacoes || "Nenhuma observação registrada."}
              </div>
            </div>

            {/* Gerenciamento do Grid Dinâmico das Fotos */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-300 print:text-gray-600 mb-3">Registro Fotográfico</label>
              
              <div className="print:hidden">
                {/* Removido o capture para permitir Câmera E Galeria. Adicionado o multiple. */}
                <input type="file" id="cameraInput" accept="image/*" multiple onChange={processarFoto} className="hidden" />
                <label htmlFor="cameraInput" className="w-full bg-slate-800/40 border border-dashed border-slate-600 text-slate-400 hover:text-blue-400 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer">
                  {comprimindo ? <span>Processando imagens... ⏳</span> : <><span className="text-3xl mb-2">📸</span><span className={`${montserrat.className} font-bold text-sm tracking-widest text-center`}>ADICIONAR FOTOS<br/><span className="text-xs font-normal">Câmera ou Galeria</span></span></>}
                </label>
              </div>

              {fotos.length > 0 && (
                <div className={`mt-4 grid gap-4 print:gap-2 ${
                  fotos.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : 
                  fotos.length === 2 ? 'grid-cols-2' : 
                  'grid-cols-3'
                }`}>
                  {fotos.map((url, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border border-slate-700/50 print:border-none print:rounded-none bg-slate-900 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Evidência ${i + 1}`} className="w-full h-auto object-cover print:max-h-[250px] print:object-contain" />
                      <button type="button" onClick={() => removerFoto(i)} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-lg print:hidden transition-colors">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="pt-8 space-y-4 print:hidden border-t border-slate-700/50 mt-8">
            <button type="submit" disabled={enviando} className={`${montserrat.className} w-full font-black tracking-widest rounded-xl text-lg uppercase px-5 py-5 text-center transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]`}>
              {enviando ? "Processando..." : "Salvar no Banco de Dados"}
            </button>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={exportarPDF} className={`${montserrat.className} w-full font-bold tracking-widest rounded-xl text-sm uppercase px-5 py-4 border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors`}>
                📄 Salvar PDF
              </button>
              <button type="button" onClick={compartilharDiario} className={`${montserrat.className} w-full font-bold tracking-widest rounded-xl text-sm uppercase px-5 py-4 border border-green-600/50 text-green-400 hover:bg-green-900/20 transition-colors`}>
                🔗 Compartilhar Link
              </button>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
}