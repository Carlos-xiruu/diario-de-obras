"use client";
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); // Pega a página atual

  // Se estivermos na tela de login, não renderiza nada
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    // A classe print:hidden aqui garante que toda a barra (e o botão) suma no PDF
    <nav className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-700 text-white print:hidden">
      <div className="font-bold tracking-wider uppercase">Diário de Obras</div>
      <button 
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition"
      >
        SAIR
      </button>
    </nav>
  );
}