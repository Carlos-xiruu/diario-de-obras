"use client";

import { useState, useEffect } from "react";
import { Montserrat, Inter } from "next/font/google";
import Link from "next/link";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "800", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type Canteiro = {
  id: string;
  nome: string;
  cidade: string;
};

export default function Home() {
  const [canteiros, setCanteiros] = useState<Canteiro[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaCidade, setNovaCidade] = useState("");

  // Estados para o modo de Edição
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCidade, setEditCidade] = useState("");

  useEffect(() => {
    const salvos = JSON.parse(localStorage.getItem('canteiros_ativos') || '[]');
    setCanteiros(salvos);
  }, []);

  const salvarCanteiros = (novosCanteiros: Canteiro[]) => {
    setCanteiros(novosCanteiros);
    localStorage.setItem('canteiros_ativos', JSON.stringify(novosCanteiros));
  };

  const adicionarCanteiro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !novaCidade) return;
    const novo = { id: Date.now().toString(), nome: novoNome, cidade: novaCidade };
    salvarCanteiros([...canteiros, novo]);
    setNovoNome("");
    setNovaCidade("");
    setMostrarForm(false);
  };

  const excluirCanteiro = (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja remover o canteiro "${nome}" da tela inicial? O histórico de relatórios desta obra não será apagado.`)) {
      salvarCanteiros(canteiros.filter(c => c.id !== id));
    }
  };

  const iniciarEdicao = (canteiro: Canteiro) => {
    setEditandoId(canteiro.id);
    setEditNome(canteiro.nome);
    setEditCidade(canteiro.cidade);
  };

  const salvarEdicao = () => {
    if (!editNome || !editCidade) return;
    const atualizados = canteiros.map(c => 
      c.id === editandoId ? { ...c, nome: editNome, cidade: editCidade } : c
    );
    salvarCanteiros(atualizados);
    setEditandoId(null);
  };

  return (
    <main className={`relative min-h-screen p-4 md:p-8 text-slate-200 ${inter.className} overflow-hidden`}>
      
      {/* Fundo Estilizado (Grid e Brilho) */}
      <div className="fixed inset-0 z-0 bg-[#020617] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(29,78,216,0.1),transparent_40%)]"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto mt-8 md:mt-12">
        
        {/* Cabeçalho */}
        <div className="mb-10 text-center md:text-left">
          <h1 className={`${montserrat.className} text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-none mb-2`}>
            Canteiros<br/>Ativos
          </h1>
          <p className={`${montserrat.className} text-blue-500 font-bold text-xs md:text-sm tracking-widest uppercase`}>
            Selecione a obra para registrar
          </p>
        </div>

        {/* Lista de Canteiros */}
        <div className="space-y-4">
          
          {canteiros.map((canteiro) => (
            <div key={canteiro.id} className="bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 relative group transition-all duration-300 hover:border-slate-700 hover:shadow-[0_0_20px_rgba(30,58,138,0.2)]">
              
              {editandoId === canteiro.id ? (
                // MODO EDIÇÃO DO CANTEIRO
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Nome da Obra</label>
                    <input 
                      type="text" 
                      value={editNome} 
                      onChange={(e) => setEditNome(e.target.value)} 
                      className="w-full bg-slate-950 border border-blue-900/50 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Cidade</label>
                    <input 
                      type="text" 
                      value={editCidade} 
                      onChange={(e) => setEditCidade(e.target.value)} 
                      className="w-full bg-slate-950 border border-blue-900/50 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" 
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={salvarEdicao} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-colors">
                      Salvar
                    </button>
                    <button onClick={() => setEditandoId(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // MODO VISUALIZAÇÃO DO CANTEIRO
                <>
                  {/* Botões de Ação (Aparecem no hover no PC, sempre visíveis no celular) */}
                  <div className="absolute top-5 right-5 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={() => iniciarEdicao(canteiro)} 
                      className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 hover:border-blue-500 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                      title="Editar Obra"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => excluirCanteiro(canteiro.id, canteiro.nome)} 
                      className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 hover:border-red-500 hover:bg-red-900/40 text-slate-300 rounded-lg transition-all"
                      title="Excluir Obra"
                    >
                      🗑️
                    </button>
                  </div>

                  <h2 className={`${montserrat.className} text-xl md:text-2xl font-bold text-white mb-2 pr-20 leading-tight`}>
                    {canteiro.nome}
                  </h2>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                    <span className="text-sm font-medium text-slate-400">{canteiro.cidade}</span>
                  </div>

                  <Link 
                    href={`/diario?obra=${encodeURIComponent(canteiro.nome)}&cidade=${encodeURIComponent(canteiro.cidade)}`}
                    className="block w-full text-center bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-blue-400 hover:text-blue-300 font-bold py-4 rounded-xl transition-all shadow-inner"
                  >
                    ABRIR DIÁRIO
                  </Link>
                </>
              )}
            </div>
          ))}

          {/* Adicionar Novo Canteiro */}
          {mostrarForm ? (
            <form onSubmit={adicionarCanteiro} className="bg-[#0f172a]/90 backdrop-blur-md border border-slate-700 border-dashed rounded-2xl p-6 animate-in fade-in duration-300">
              <div className="space-y-4 mb-4">
                <input autoFocus required type="text" placeholder="Nome da Obra / Cliente" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-blue-500 transition-colors placeholder-slate-600" />
                <input required type="text" placeholder="Cidade - Estado" value={novaCidade} onChange={(e) => setNovaCidade(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-blue-500 transition-colors placeholder-slate-600" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold transition-colors">
                  ADICIONAR
                </button>
                <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-xl font-bold transition-colors">
                  CANCELAR
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setMostrarForm(true)} 
              className="w-full bg-transparent border-2 border-dashed border-slate-800 hover:border-slate-600 text-slate-500 hover:text-slate-300 font-bold py-6 rounded-2xl transition-all flex flex-col items-center justify-center gap-2"
            >
              <span className="text-2xl leading-none">+</span>
              <span className="text-sm tracking-wider uppercase">Novo Canteiro</span>
            </button>
          )}

        </div>

        {/* Botão de Histórico (Rodapé) */}
        <div className="mt-8 pt-8 border-t border-slate-800/50">
          <Link href="/historico" className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 uppercase tracking-widest text-sm">
            Ver Histórico Geral
          </Link>
        </div>

      </div>
    </main>
  );
}