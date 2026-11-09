"use client";
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      window.location.href = '/';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Não foi possível entrar.';
      setErro(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
      <form onSubmit={handleAuth} className="w-full max-w-sm bg-slate-900/60 p-8 rounded-2xl border border-slate-700">
        <h2 className="text-2xl font-black text-white mb-6 uppercase text-center">
          Acesso Restrito
        </h2>
        {erro && <p role="alert" className="mb-4 rounded-xl border border-red-500/50 bg-red-950/40 p-3 text-sm text-red-200">{erro}</p>}
        
        <input 
          required 
          type="email" 
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
          className="w-full mb-4 p-4 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none" 
        />
        
        <input 
          required 
          type="password" 
          placeholder="Senha" 
          onChange={(e) => setPassword(e.target.value)} 
          className="w-full mb-6 p-4 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none" 
        />
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full p-4 bg-blue-600 font-bold rounded-xl text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {loading ? "PROCESSANDO..." : "ENTRAR"}
        </button>
      </form>
    </main>
  );
}
