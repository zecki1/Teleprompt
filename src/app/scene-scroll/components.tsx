"use client";

import { useEffect, useRef, useState, useLayoutEffect, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Terminal, MousePointer2, Share2, Info } from "lucide-react";
import { Text } from "@/components/providers/preferences-provider";

/**
 * COMPONENTE DE CANVAS REUTILIZÁVEL
 */
interface SequenceCanvasProps {
  frameCount: number;
  pathPrefix: string;
  extension: string;
  currentFrame: number;
  className?: string;
  onLoadProgress?: (progress: number) => void;
  onLoaded?: () => void;
}

export const SequenceCanvas = forwardRef<HTMLCanvasElement, SequenceCanvasProps>(
  ({ frameCount, pathPrefix, extension, currentFrame, className, onLoadProgress, onLoaded }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useImperativeHandle(ref, () => canvasRef.current!);

    // Carregamento das imagens começando do índice 0000
    useEffect(() => {
      let loadedCount = 0;
      const imgs: HTMLImageElement[] = [];

      for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        // Formata como 0000, 0001, etc.
        const formattedIndex = i.toString().padStart(4, "0"); 
        img.src = `${pathPrefix}${formattedIndex}${extension}`;
        
        img.onload = () => {
          loadedCount++;
          onLoadProgress?.(Math.round((loadedCount / frameCount) * 100));
          if (loadedCount === frameCount) {
            imagesRef.current = imgs;
            setIsLoaded(true);
            onLoaded?.();
          }
        };
        imgs.push(img);
      }
    }, [frameCount, pathPrefix, extension]);

    // Desenho no Canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || imagesRef.current.length === 0) return;

      // Garante que o frame solicitado não ultrapasse o array disponível
      const frameIndex = Math.min(Math.floor(currentFrame), imagesRef.current.length - 1);
      const img = imagesRef.current[frameIndex];
      
      if (!img) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      
      ctx.drawImage(img, 
        (canvas.width - img.width * ratio) / 2, 
        (canvas.height - img.height * ratio) / 2, 
        img.width * ratio, img.height * ratio
      );
    }, [currentFrame, isLoaded, frameCount]);

    // Resize Handler
    useEffect(() => {
      const handleResize = () => {
        if (canvasRef.current) {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
        }
      };
      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
      <canvas 
        ref={canvasRef} 
        className={cn(
          "w-full h-full pointer-events-none transition-opacity duration-1000", 
          className, 
          isLoaded ? "opacity-100" : "opacity-0"
        )} 
      />
    );
  }
);
SequenceCanvas.displayName = "SequenceCanvas";

/**
 * HERO DE INTRODUÇÃO (SEQUÊNCIA 1 - CLICÁVEL)
 */
export function IntroSequence() {
  const [frame, setFrame] = useState(0);
  const [clicked, setClicked] = useState(false);
  
  useEffect(() => {
    if (clicked) {
      // Loop de animação simples para a Intro
      const interval = setInterval(() => setFrame((prev) => (prev + 1) % 100), 33);
      return () => clearInterval(interval);
    }
  }, [clicked]);

  return (
    <section 
      className="relative w-full h-screen bg-[#020617] overflow-hidden cursor-pointer group"
      onClick={() => setClicked(!clicked)}
    >
      <div className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-1000">
        <SequenceCanvas 
          frameCount={281} 
          pathPrefix="/sequence/img_" 
          extension=".webp" 
          currentFrame={Math.floor(frame * 2.8)} 
          className="object-cover" 
        />
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }} className="space-y-4">
          <h1 className="text-6xl md:text-9xl font-serif text-white drop-shadow-2xl">
            <Text pt="Imagine a Mágica" en="Imagine the Magic" es="Imagina la Magia" />
          </h1>
          <p className="max-w-xl mx-auto text-blue-100/60 text-lg md:text-xl font-light leading-relaxed">
            <Text 
              pt="Clique para iniciar a animação ou role para descobrir o segredo." 
              en="Click to start the animation or scroll to discover the secret." 
              es="Haz clic para iniciar la animación o desplázate para descubrir el secreto." 
            />
          </p>
        </motion.div>
        <AnimatePresence>
          {!clicked && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-20 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white animate-bounce">
                <span className="text-xs font-bold uppercase tracking-tighter"><Text pt="Clique" en="Click" es="Clic" /></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#020617]/40 via-transparent to-[#020617]" />
    </section>
  );
}

/**
 * SEQUÊNCIA DE SCROLL (SEQUÊNCIA 2 - FIXADA/PINNED)
 */
export function ScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameRef = useRef({ current: 0 });

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=400%",
          scrub: 1,
          pin: true,
        },
      });

      // Se você tem de img_0000 até img_1285, o total é 1286 frames.
      // Animamos o valor do objeto de 0 a 1285.
      tl.to(frameRef.current, { 
        current: 1285, 
        ease: "none", 
        onUpdate: () => setCurrentFrame(frameRef.current.current) 
      }, 0);

      tl.fromTo("#disney-mask-logo", { scale: 20 }, { scale: 1, ease: "power2.inOut" }, 0);
      tl.to("#disney-mask-overlay", { opacity: 0, duration: 0.2 }, ">-0.2");
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-[#020617] overflow-hidden">
      <SequenceCanvas 
        frameCount={1286} 
        pathPrefix="/sequence2/img_" 
        extension=".webp" 
        currentFrame={currentFrame} 
        className="object-cover opacity-40" 
      />
      


      <div className="absolute top-1/2 right-12 -translate-y-1/2 z-30 max-w-xs space-y-4 bg-blue-900/20 backdrop-blur-xl p-6 rounded-3xl border border-blue-400/20">
         <h4 className="text-white font-bold text-lg italic"><Text pt="Mágica em Movimento" en="Magic in Motion" es="Magia en Movimiento" /></h4>
         <p className="text-blue-100/60 text-sm"><Text pt="Cada pixel é sincronizado com o seu movimento." en="Every pixel is synced with your movement." es="Cada píxel está sincronizado con tu movimiento." /></p>
      </div>
    </div>
  );
}

/**
 * SEÇÃO DE EXPLICAÇÃO TÉCNICA
 */
export function ExplanationSection() {
  const items = [
    { icon: <MousePointer2 className="text-blue-400" />, title: <Text pt="Interatividade" en="Interactivity" es="Interactividad" />, desc: <Text pt="A sequência do Hero responde a cliques." en="The Hero sequence responds to clicks." es="La secuencia del Hero responde a clics." /> },
    { icon: <Share2 className="text-purple-400" />, title: <Text pt="Performance" en="Performance" es="Rendimiento" />, desc: <Text pt="WebP otimizado para carregamentos rápidos." en="WebP optimized for fast loading." es="WebP optimizado para una carga rápida." /> },
    { icon: <Info className="text-cyan-400" />, title: <Text pt="Sincronização" en="Sync" es="Sincronización" />, desc: <Text pt="GSAP ScrollTrigger interpola frames via scroll." en="GSAP ScrollTrigger interpolates frames via scroll." es="GSAP ScrollTrigger interpola fotogramas mediante desplazamiento." /> }
  ];

  return (
    <section className="relative z-30 bg-[#020617] py-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto space-y-24">
        <motion.div 
          initial={{ opacity: 0, y: 50 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          className="relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-3xl p-8 md:p-16 rounded-[4rem] border border-blue-400/20 overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
          <div className="relative z-10 space-y-12">
            <header className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-blue-600/20 px-4 py-1.5 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-400/20">
                <Wand2 size={14} /> <Text pt="A Tecnologia Mágica" en="The Magic Tech" es="La Tecnología Mágica" />
              </div>
              <h2 className="text-4xl md:text-6xl font-serif text-white">
                <Text pt="Como Funciona a Mágica?" en="How Does the Magic Work?" es="¿Cómo Funciona la Magia?" />
              </h2>
              <p className="text-blue-100/60 text-lg max-w-2xl leading-relaxed">
                <Text 
                  pt="Transformamos vídeos cinematográficos em sequências de imagens comprimidas para controle total da animação." 
                  en="We transform cinematic videos into compressed image sequences for complete animation control." 
                  es="Transformamos videos cinematográficos en secuencias de imágenes comprimidas para un control total de la animación." 
                />
              </p>
            </header>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-blue-200 font-mono text-sm mb-2">
                <Terminal size={18} /><span><Text pt="Script de Conversão (FFMPEG)" en="Conversion Script (FFMPEG)" es="Script de Conversión (FFMPEG)" /></span>
              </div>
              <pre className="bg-black/60 p-6 md:p-8 rounded-2xl border border-white/10 overflow-x-auto text-sm md:text-base font-mono text-blue-300">
                <code>
                  ffmpeg -i video.mp4 -vf "scale=1920:-1" \<br/>
                  -c:v libwebp -quality 80 \<br/>
                  public/sequence/img_%04d.webp;
                </code>
              </pre>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/5 space-y-4 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">{item.icon}</div>
              <h3 className="text-xl font-bold text-white">{item.title}</h3>
              <p className="text-blue-100/40 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}