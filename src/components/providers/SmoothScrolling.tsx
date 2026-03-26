"use client";

import { useLayoutEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

// 1. REGISTRA O PLUGIN GLOBALMENTE
gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrolling({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    // 2. INICIA O LENIS
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // 3. O PULO DO GATO: Conectar Lenis ao ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Adiciona o Lenis ao ticker do GSAP (loop de animação)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // Desativa o lag smoothing para evitar "pulos" visuais
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  return <>{children}</>;
}