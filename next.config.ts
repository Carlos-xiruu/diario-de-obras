import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // O Service Worker só ativa na Vercel para não atrapalhar seus testes locais
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Essa linha abaixo silencia o erro e diz pro Next.js 16 ficar tranquilo
  turbopack: {}, 
};

export default withPWA(nextConfig);