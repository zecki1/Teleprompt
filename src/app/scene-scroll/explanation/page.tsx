"use client";

import Link from "next/link";
import { MoveLeft, Sparkles, Filter, Scissors } from "lucide-react";
import { Text } from "@/components/providers/preferences-provider";

export default function ExplanationPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-300 p-8 md:p-24 font-sans selection:bg-purple-500/30">
      <div className="max-w-4xl mx-auto space-y-16">
        <Link 
          href="/scene-scroll" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
        >
          <MoveLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <Text pt="Voltar para a Demo" en="Back to Demo" es="Volver a la Demo" />
        </Link>

        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 px-4 py-1.5 rounded-full text-purple-400 text-xs font-bold uppercase tracking-widest border border-purple-400/20">
            <Sparkles size={14} /> <Text pt="Explicação Técnica" en="Technical Explanation" es="Explicación Técnica" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-none">
            SVG <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-purple-400 to-pink-500 font-serif italic">Swirl Reveal</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            <Text 
              pt="Uma jornada pela combinação de filtros de turbulência, gradientes radiais e máscaras de recorte sincronizadas via ScrollTrigger." 
              en="A journey through the combination of turbulence filters, radial gradients, and clipping masks synced via ScrollTrigger." 
              es="Un viaje a través de la combinación de filtros de turbulencia, gradientes radiales y máscaras de recorte sincronizadas a través de ScrollTrigger." 
            />
          </p>
        </header>

        <div className="grid gap-12">
          {/* Seção 1: Filtros */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Filter size={24} /></div>
              <h2 className="text-3xl font-bold"><Text pt="1. Turbulência e Deslocamento" en="1. Turbulence & Displacement" es="1. Turbulencia y Desplazamiento" /></h2>
            </div>
            <p>
              <Text 
                pt="O fundo 'místico' é criado usando filtros SVG nativos. <feTurbulence> gera um ruído pseudo-aleatório que é então usado por <feDisplacementMap> para distorcer a geometria original dos círculos." 
                en="The 'mystical' background is created using native SVG filters. <feTurbulence> generates pseudo-random noise which is then used by <feDisplacementMap> to distort the original geometry of the circles." 
                es="El fondo 'místico' se crea utilizando filtros SVG nativos. <feTurbulence> genera un ruido pseudoaleatorio que luego utiliza <feDisplacementMap> para distorsionar la geometría original de los círculos." 
              />
            </p>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
              <h3 className="text-sm font-mono text-green-400 mb-4 tracking-tighter">// Definições de Filtro SVG</h3>
              <pre className="text-xs md:text-sm overflow-x-auto text-slate-400 font-mono leading-relaxed">
{`<filter id="swirl">
  <feTurbulence 
    type="turbulence" 
    baseFrequency="0.012 0.018" 
    numOctaves="2" 
    seed="8" 
  />
  <feDisplacementMap 
    scale="120" 
    xChannelSelector="R" 
  />
</filter>`}
              </pre>
            </div>
          </section>

          {/* Seção 2: Mascaramento */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Scissors size={24} /></div>
              <h2 className="text-3xl font-bold"><Text pt="2. Recorte por SVG (Clip-Path)" en="2. SVG Clipping (Clip-Path)" es="2. Recorte SVG (Clip-Path)" /></h2>
            </div>
            <p>
              <Text 
                pt="Diferente de opacidade simples, o clip-path define qual área do elemento deve ser visível. Neste caso, usamos um path complexo (logo) que escala até cobrir toda a viewport." 
                en="Unlike simple opacity, clip-path defines which area of the element should be visible. In this case, we use a complex path (logo) that scales until it covers the entire viewport." 
                es="A diferencia de la opacidad simple, clip-path define qué área del elemento debe ser visible. En este caso, usamos una ruta compleja (logotipo) que escala hasta cubrir todo el viewport." 
              />
            </p>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
              <h3 className="text-sm font-mono text-purple-400 mb-4 tracking-tighter">// Integração React & CSS</h3>
              <pre className="text-xs md:text-sm overflow-x-auto text-slate-400 font-mono leading-relaxed">
{`<div 
  className="hero-container" 
  style={{ clipPath: "url(#clip-path1)" }} 
/>`}
              </pre>
            </div>
          </section>

          {/* Seção 3: GSAP */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400"><Sparkles size={24} /></div>
              <h2 className="text-3xl font-bold"><Text pt="3. O Maestro ScrollTrigger" en="3. The ScrollTrigger Maestro" es="3. El Maestro ScrollTrigger" /></h2>
            </div>
            <p>
              <Text 
                pt="O GSAP orquestra a escala do path SVG e a opacidade dos elementos conforme o usuário rola a página. O uso de 'pin: true' mantém a seção fixa enquanto a animação ocorre." 
                en="GSAP orchestrates the scaling of the SVG path and the opacity of elements as the user scrolls. The use of 'pin: true' keeps the section fixed while the animation occurs." 
                es="GSAP orquestra la escala de la ruta SVG y la opacidad de los elementos a medida que el usuario se desplaza. El uso de 'pin: true' mantiene la sección fija mientras ocurre la animación." 
              />
            </p>
          </section>
        </div>

        <footer className="pt-12 border-t border-white/5 flex justify-between items-center text-slate-500 text-sm">
          <p>Criado com Antigravity AI</p>
          <p>© 2026 Scene Scroll Demo</p>
        </footer>
      </div>
    </main>
  );
}
