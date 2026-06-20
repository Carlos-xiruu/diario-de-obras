import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // O Service Worker só ativa na Vercel para não atrapalhar  testes locais
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Se você tinha outras configurações aqui antes, pode mantê-las.
};

export default withPWA(nextConfig);