// components/Navbar.tsx
"use client"; // Obrigatório para usar 'onClick'
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    // 1. Faz o logout no Supabase
    await supabase.auth.signOut();
    
    // 2. Redireciona para a tela de login
    router.push('/login');
    
    // 3. Força o refresh para limpar o estado da sessão
    router.refresh();
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-700 text-white">
      <div className="font-bold tracking-wider">DIÁRIO DE OBRAS</div>
      <button 
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition"
      >
        SAIR
      </button>
    </nav>
  );
}