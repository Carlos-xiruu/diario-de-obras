"use client";
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Erro: " + error.message);
    else {
      router.push('/'); // Redireciona para o início
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-slate-900/60 p-8 rounded-2xl border border-slate-700">
        <h2 className="text-2xl font-black text-white mb-6 uppercase text-center">Acesso Restrito</h2>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className="w-full mb-4 p-4 bg-slate-950 border border-slate-700 rounded-xl text-white" />
        <input type="password" placeholder="Senha" onChange={(e) => setPassword(e.target.value)} className="w-full mb-6 p-4 bg-slate-950 border border-slate-700 rounded-xl text-white" />
        <button type="submit" className="w-full p-4 bg-blue-600 font-bold rounded-xl text-white hover:bg-blue-500 transition-colors">ENTRAR</button>
      </form>
    </main>
  );
}