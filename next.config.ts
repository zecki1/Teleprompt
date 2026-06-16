import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // Ignora erros de TypeScript durante o build
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  
  /* opções de configuração aqui */
  images: {
   remotePatterns: [
      { protocol: "https", hostname: "www.rockstargames.com" },
      { protocol: "https", hostname: "preview.redd.it" },
      { protocol: "https", hostname: "www.gtavice.net" },
      { protocol: "https", hostname: "www.igrandtheftauto.com" },
      { protocol: "https", hostname: "static.wikia.nocookie.net" },
      { protocol: "https", hostname: "www.topgear.com" },
      { protocol: "https", hostname: "cdn.mos.cms.futurecdn.net" },
      { protocol: "https", hostname: "images.purexbox.com" },
      { protocol: "https", hostname: "rockstarintel.com" },
      { protocol: "https", hostname: "sm.ign.com" },
      { protocol: "https", hostname: "i.redd.it" },
      { protocol: "https", hostname: "peach.blender.org" },
      { protocol: "https", hostname: "mango.blender.org" },
      { protocol: "https", hostname: "agent327.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  reactCompiler: true,
  
  async headers() {
    return [
      {
        source: "/dictionaries/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebase.googleapis.com wss://firestore.googleapis.com https://*.firebasestorage.app https://*.firebasestorage.googleapis.com",
              "frame-src 'none'",
              "media-src 'self' https: blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;



