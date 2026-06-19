"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Agora, com o createBrowserClient, este comando salvará um Cookie!
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        console.log("Login OK. Redirecionando...");
        // Força o reload para o middleware ler o cookie novo
        window.location.href = '/'; 
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Conta criada! Pode logar agora.");
        setIsLogin(true);
      }
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
      <form onSubmit={handleAuth} className="w-full max-w-sm bg-slate-900/60 p-8 rounded-2xl border border-slate-700">
        <h2 className="text-2xl font-black text-white mb-6 uppercase text-center">
          {isLogin ? "Acesso Restrito" : "Criar Conta"}
        </h2>
        
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
          {loading ? "PROCESSANDO..." : (isLogin ? "ENTRAR" : "CADASTRAR")}
        </button>

        <button 
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-slate-400 hover:text-white text-sm transition-colors"
        >
          {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Fazer Login"}
        </button>
      </form>
    </main>
  );
}