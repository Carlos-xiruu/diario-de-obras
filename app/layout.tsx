import type { Metadata } from "next";
import "./globals.css"; 
import Navbar from "./components/Navbar";

// Exportar os metadados separadamente para o Next.js processar melhor
export const metadata: Metadata = {
  title: 'Diário de Obras',
  description: 'Gestão de Montagem de Pré-Moldados',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Diário de Obras - Registro de Montagem',
    description: 'Clique para visualizar o relatório detalhado.',
    images: [
      {
        url: '/og-image.png', // Caminho correto: a pasta 'public' é a raiz
        width: 800,
        height: 600,
        alt: 'Capa do Diário de Obras',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#020617] text-white min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  );
}