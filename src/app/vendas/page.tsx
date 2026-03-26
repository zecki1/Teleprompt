"use client";

import React from "react";
import Image from "next/image";
import { 
  Play, ArrowRight, ArrowUpRight, Instagram, 
  Twitter, Youtube, TrendingUp, Clock 
} from "lucide-react";

// Componentes do seu Package
import { Text } from "@/components/providers/preferences-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function AppleStyleHome() {
  return (
    <div className="flex flex-col w-full bg-background gap-4 pb-10">

      {/* =========================================
          SEÇÃO 1: HERO CINEMÁTICO (ESTILO APPLE)
          Fundo escuro/vídeo, texto centralizado
      ========================================= */}
      <section className="relative w-full h-[85vh] overflow-hidden flex items-center justify-center bg-black text-white">
        {/* Background Image/Video Placeholder */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero Background" 
            fill
            className="object-cover opacity-60 hover:scale-105 transition-transform duration-[2s]"
            priority
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center space-y-6 max-w-4xl px-4 mt-20" data-aos="fade-up">
          <Badge variant="outline" className="text-white border-white/30 backdrop-blur-md px-4 py-1.5 uppercase tracking-widest text-xs">
            <Text pt="Nova Coleção 2026" en="New Collection 2026" es="Nueva Colección 2026" />
          </Badge>
          
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-tight">
            <Text pt="Capture o Inimaginável" en="Capture the Unimaginable" es="Captura lo Inimaginable" />
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 font-light max-w-2xl mx-auto">
            <Text 
              pt="A fusão perfeita entre design minimalista e potência bruta." 
              en="The perfect fusion of minimalist design and raw power."
              es="La fusión perfecta entre diseño minimalista y potencia bruta."
            />
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button size="lg" className="rounded-full px-8 h-14 text-lg bg-white text-black hover:bg-gray-200 border-none">
              <Text pt="Comprar Agora" en="Shop Now" es="Comprar Ahora" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg bg-transparent text-white border-white hover:bg-white/10">
              <Text pt="Assistir o Filme" en="Watch the Film" es="Ver la Película" /> <Play className="ml-2 h-4 w-4 fill-current" />
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================
          SEÇÃO 2: GRADE BENTO (DESTAQUES)
          Layout em grade assimétrica
      ========================================= */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 tracking-tight" data-aos="fade-right">
          <Text pt="Destaques do Mês" en="Monthly Highlights" es="Destacados del Mes" />
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[400px]">
          
          {/* Item Grande (2 colunas) */}
          <div className="group relative col-span-1 md:col-span-2 rounded-3xl overflow-hidden bg-muted cursor-pointer" data-aos="fade-up">
            <Image 
              src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2000" 
              alt="Vision Pro Max"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors p-8 flex flex-col justify-end text-white">
              <h3 className="text-3xl font-bold mb-2">Vision Pro Max</h3>
              <p className="text-gray-200">
                <Text pt="Realidade Aumentada. Redefinida." en="Augmented Reality. Redefined." es="Realidad Aumentada. Redefinida." />
              </p>
              <Button variant="link" className="text-white w-fit p-0 mt-4 hover:no-underline group-hover:translate-x-2 transition-transform">
                <Text pt="Saiba mais" en="Learn more" es="Saber más" /> <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Item Pequeno (1 coluna) */}
          <div className="group relative rounded-3xl overflow-hidden bg-white border cursor-pointer" data-aos="fade-up" data-aos-delay="100">
             <div className="absolute top-8 left-0 right-0 text-center z-10">
                <h3 className="text-2xl font-bold text-black">Titanium Watch</h3>
                <p className="text-muted-foreground">
                  <Text pt="Ultra resistente." en="Ultra resistant." es="Ultra resistente." />
                </p>
             </div>
             <Image 
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000" 
              alt="Titanium Watch"
              width={500}
              height={500}
              className="object-contain w-full h-full pt-12 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

           {/* Item Pequeno (1 coluna) - Escuro */}
           <div className="group relative rounded-3xl overflow-hidden bg-[#1a1a1a] text-white cursor-pointer" data-aos="fade-up" data-aos-delay="200">
            <div className="p-8 h-full flex flex-col justify-between">
              <div>
                <Badge className="bg-orange-500 hover:bg-orange-600 border-none text-white mb-4">
                  <Text pt="PROMOÇÃO" en="SALE" es="OFERTA" />
                </Badge>
                <h3 className="text-2xl font-bold">Audio Series</h3>
              </div>
              <Image 
                src="https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1000" 
                alt="Audio Series"
                width={300}
                height={300}
                className="w-48 mx-auto drop-shadow-2xl transition-transform duration-500 group-hover:-translate-y-4 group-hover:rotate-6"
              />
              <div className="flex justify-between items-end">
                <span className="text-2xl font-bold">$199</span>
                <Button size="icon" className="rounded-full bg-white text-black hover:bg-gray-200">
                  <ArrowUpRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Item Grande (2 colunas) - Invertido */}
          <div className="group relative col-span-1 md:col-span-2 rounded-3xl overflow-hidden bg-gray-100 dark:bg-zinc-900 cursor-pointer" data-aos="fade-up" data-aos-delay="300">
             <div className="absolute inset-0 flex flex-col md:flex-row items-center p-8 md:p-12 gap-8">
                <div className="flex-1 space-y-4 z-10">
                   <h3 className="text-3xl md:text-4xl font-bold text-foreground">Workspace Studio</h3>
                   <p className="text-muted-foreground text-lg">
                     <Text 
                        pt="Transforme seu escritório com nossa linha de periféricos minimalistas." 
                        en="Transform your office with our minimalist peripherals line."
                        es="Transforma tu oficina con nuestra línea de periféricos minimalistas."
                     />
                   </p>
                   <Button className="rounded-full">
                     <Text pt="Ver Coleção" en="View Collection" es="Ver Colección" />
                   </Button>
                </div>
                <div className="flex-1 w-full h-full relative">
                    <Image 
                      src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1000" 
                      alt="Workspace Studio"
                      fill
                      className="object-cover rounded-2xl shadow-xl transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* =========================================
          SEÇÃO 3: REELS / STORIES (VÍDEO VERTICAL)
          Formato TikTok/Instagram
      ========================================= */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8" data-aos="fade-left">
            <div className="p-2 bg-pink-500 rounded-full text-white"><Instagram size={20} /></div>
            <h2 className="text-2xl font-bold">
              <Text pt="Histórias & Reels" en="Stories & Reels" es="Historias & Reels" />
            </h2>
          </div>

          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <CarouselItem key={index} className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/5">
                  <div className="group relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer" data-aos="zoom-in" data-aos-delay={index * 100}>
                    <Image 
                      src={`https://images.unsplash.com/photo-${index % 2 === 0 ? '1611162617474-5b21e879e113' : '1534528741775-53994a69daeb'}?w=400&h=800&fit=crop`} 
                      alt="Reel content"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6 border border-white">
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${index}`} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">user_creator</span>
                      </div>
                      <p className="text-sm line-clamp-2">
                        <Text 
                          pt="Review rápido do novo setup! 🔥 #tech #setup" 
                          en="Quick review of the new setup! 🔥 #tech #setup"
                          es="¡Reseña rápida de la nueva configuración! 🔥 #tech #setup"
                        />
                      </p>
                    </div>
                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                       <Play className="fill-white text-white h-12 w-12" />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </div>
      </section>

      {/* =========================================
          SEÇÃO 4: BLOG EDITORIAL
          Design limpo e focado em conteúdo
      ========================================= */}
      <section className="container mx-auto px-4 py-20">
         <div className="text-center max-w-2xl mx-auto mb-16" data-aos="fade-up">
            <h2 className="text-4xl font-bold mb-4">The Journal</h2>
            <p className="text-muted-foreground text-lg">
               <Text 
                 pt="Histórias sobre design, tecnologia e o futuro." 
                 en="Stories about design, technology and the future."
                 es="Historias sobre diseño, tecnología y el futuro."
               />
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
            
            {/* Artigo 1 */}
            <article className="group cursor-pointer" data-aos="fade-up">
               <div className="overflow-hidden rounded-2xl mb-4 aspect-video bg-muted">
                  <Image 
                    src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000" 
                    alt="Article image"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary tracking-wider uppercase">
                     <TrendingUp className="h-3 w-3" /> Tech Trends
                  </div>
                  <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                     <Text pt="O futuro do trabalho remoto" en="The future of remote work" es="El futuro del trabajo remoto" />
                  </h3>
                  <p className="text-muted-foreground line-clamp-2">
                    <Text 
                      pt="Como as novas tecnologias de VR estão mudando a forma como interagimos em escritórios virtuais." 
                      en="How new VR technologies are changing the way we interact in virtual offices."
                      es="Cómo las nuevas tecnologías de VR están cambiando la forma en que interactuamos en oficinas virtuales."
                    />
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                     <Clock className="h-3 w-3" /> <Text pt="5 min de leitura" en="5 min read" es="5 min de lectura" />
                  </div>
               </div>
            </article>

            {/* Artigo 2 */}
            <article className="group cursor-pointer" data-aos="fade-up" data-aos-delay="100">
               <div className="overflow-hidden rounded-2xl mb-4 aspect-video bg-muted">
                  <Image 
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000" 
                    alt="Article image"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary tracking-wider uppercase">
                     <Badge variant="secondary" className="rounded-sm px-1">
                        <Text pt="Análise" en="Review" es="Reseña" />
                     </Badge>
                  </div>
                  <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                     <Text pt="Cibersegurança em 2026" en="Cybersecurity in 2026" es="Ciberseguridad en 2026" />
                  </h3>
                  <p className="text-muted-foreground line-clamp-2">
                    <Text 
                      pt="Protegendo seus dados em um mundo pós-quântico. O que você precisa saber agora." 
                      en="Protecting your data in a post-quantum world. What you need to know now."
                      es="Protegiendo sus datos en un mundo poscuántico. Lo que necesita saber ahora."
                    />
                  </p>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                     <Clock className="h-3 w-3" /> <Text pt="8 min de leitura" en="8 min read" es="8 min de lectura" />
                  </div>
               </div>
            </article>

         </div>
      </section>

      {/* =========================================
          SEÇÃO 5: SEGUIR NAS REDES SOCIAIS
          Visual simples com ícones
      ========================================= */}
      <section className="py-20 border-t bg-black text-white text-center">
         <div className="container mx-auto px-4 space-y-8" data-aos="zoom-in">
            <h2 className="text-3xl font-bold">
               <Text pt="Junte-se à Comunidade" en="Join the Community" es="Únete a la Comunidad" />
            </h2>
            <div className="flex justify-center gap-8">
               <a href="#" className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors hover:scale-110 duration-300">
                  <Instagram className="h-8 w-8" />
               </a>
               <a href="#" className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors hover:scale-110 duration-300">
                  <Twitter className="h-8 w-8" />
               </a>
               <a href="#" className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors hover:scale-110 duration-300">
                  <Youtube className="h-8 w-8" />
               </a>
            </div>
            <p className="text-white/50 text-sm">#SuperTemplate2026</p>
         </div>
      </section>

    </div>
  );
}