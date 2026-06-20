"use client";
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    // Adicionamos sticky, top-0 e z-50 para fixar no topo e ficar na frente de qualquer fundo!
    <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-slate-900 border-b border-slate-700 text-white print:hidden shadow-md">
      <Link href="/" className="font-bold tracking-wider uppercase hover:text-blue-400 transition-colors">
        Diário de Obras
      </Link>
      
      <div className="flex items-center gap-6">
        <Link 
          href="/dashboard" 
          className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors hidden sm:block"
        >
          📊 DASHBOARD
        </Link>

        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition shadow-lg"
        >
          SAIR
        </button>
      </div>
    </nav>
  );
}