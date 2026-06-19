import type { Metadata } from "next";
import "./globals.css"; // <-- É este fio aqui que liga toda a estilização!
import Navbar from "./components/Navbar";

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
export const metadata = {
  title: 'Diário de Obras',
  description: 'Gestão de Montagem de Pré-Moldados',
  openGraph: {
    title: 'Diário de Obras - Registro de Montagem',
    description: 'Clique para visualizar o relatório detalhado.',
    images: [
      {
        url: 'diario-de-obras\capa.PNG', // A imagem que está na sua pasta public
        width: 800,
        height: 600,
      },
    ],
  },
};