import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  
};

export default nextConfig;



