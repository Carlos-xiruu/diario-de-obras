import type { Metadata } from "next";
import "./globals.css"; // <-- É este fio aqui que liga toda a estilização!

export const metadata: Metadata = {
  title: "Diário de Obras",
  description: "Gestão de Montagem de Pré-Moldados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-gray-100 text-gray-900">
        {children}
      </body>
    </html>
  );
}