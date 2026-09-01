import type { NextConfig } from "next";
import path from "path";
import { NormalModuleReplacementPlugin } from "webpack";

const nodeEmptyModule = path.join(process.cwd(), "src/lib/node-empty.js");

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // Ignora erros de TypeScript durante o build
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  
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

  turbopack: {},

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new NormalModuleReplacementPlugin(/^node:fs$/, nodeEmptyModule),
        new NormalModuleReplacementPlugin(/^node:https$/, nodeEmptyModule)
      );
    }
    return config;
  },

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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vlibras.gov.br https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' http://localhost:5026 http://localhost:5000 ws://localhost:5026 ws://localhost:5000 wss://teleprompt-api.invalid https://teleprompt-api.invalid https://api.teleprompt.zecki1.com.br wss://api.teleprompt.zecki1.com.br https://vlibras.gov.br https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
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

// build-touch

