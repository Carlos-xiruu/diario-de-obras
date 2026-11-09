"use client";
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center p-3 sm:p-4 bg-slate-900 border-b border-slate-700 text-white print:hidden shadow-md">
      {/* Diminuí um pouco a fonte no celular (text-sm) para dar espaço */}
      <Link href="/" className="font-bold tracking-wider uppercase hover:text-blue-400 transition-colors text-sm sm:text-base whitespace-nowrap">
        Diário de Obras
      </Link>
      
      {/* Diminuí o gap no celular (gap-3) para os botões não ficarem espremidos */}
      <div className="flex items-center gap-3 sm:gap-6">
        
        {/* Removido o 'hidden'. Agora ele aparece sempre! */}
        <Link 
          href="/dashboard" 
          className="text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          <span>📊</span>
          <span className="hidden sm:inline">DASHBOARD</span>
          <span className="sm:hidden">DASH</span>
        </Link>

        <button 
          onClick={handleLogout}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs sm:text-sm font-bold transition shadow-lg"
        >
          SAIR
        </button>
      </div>
    </nav>
  );
}
