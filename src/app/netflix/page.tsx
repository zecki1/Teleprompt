"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Play, Info, Plus, Volume2, VolumeX, ChevronRight, TrendingUp, ChevronDown 
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

// Componentes UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/providers/preferences-provider";

const HERO_MOVIES = [
  {
    id: "shawshank",
    title: "The Shawshank Redemption",
    desc: {
      pt: "Dois homens presos se unem ao longo de vários anos, encontrando consolo e eventual redenção através de atos de decência comum.",
      en: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      es: "Dos hombres encarcelados entablan una amistad a lo largo de varios años, encontrando consuelo y redención final a través de actos de decencia común."
    },
    tags: ["Drama", "Crime", "Classic"],
    match: "99%",
    year: "1994",
    duration: "2h 22m",
    image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070&auto=format&fit=crop",
    youtubeId: "NmzuHjWmXOc"
  },
  {
    id: "godfather",
    title: "The Godfather",
    desc: {
      pt: "O patriarca idoso de uma dinastia do crime organizado transfere o controle de seu império clandestino para seu filho relutante.",
      en: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
      es: "El envejecido patriarca de una dinastía del crimen organizado transfiere el control de su imperio clandestino a su hijo reacio."
    },
    tags: ["Crime", "Drama", "Cult"],
    match: "98%",
    year: "1972",
    duration: "2h 55m",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop",
    youtubeId: "sY1S34973zA"
  },
  {
    id: "dark-knight",
    title: "The Dark Knight",
    desc: {
      pt: "Quando a ameaça conhecida como o Coringa emerge de seu passado misterioso, ele causa estragos e caos no povo de Gotham.",
      en: "When the menace known as the Joker emerges from his mysterious past, he wreaks havoc and chaos on the people of Gotham.",
      es: "Cuando la amenaza conocida como el Joker emerge de su pasado misterioso, causa estragos y caos en la gente de Gotham."
    },
    tags: ["Action", "Crime", "Drama"],
    match: "97%",
    year: "2008",
    duration: "2h 32m",
    image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=2074&auto=format&fit=crop",
    youtubeId: "EXeTwQWrcwY"
  }
];

// --- DADOS DAS LINHAS (CATEGORIAS) ---
const CATEGORIES = [
  { 
    title: { pt: "Top 10 no Mundo", en: "Top 10 Global", es: "Top 10 Global" }, 
    items: [
      { id: 1, title: "Schindler's List", img: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=500&h=280&fit=crop", match: "99%" },
      { id: 2, title: "The Lord of the Rings: Return of the King", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&h=280&fit=crop", match: "98%" },
      { id: 3, title: "Pulp Fiction", img: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&h=280&fit=crop", match: "97%" },
      { id: 4, title: "12 Angry Men", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&h=280&fit=crop", match: "96%" },
      { id: 5, title: "Forrest Gump", img: "https://images.unsplash.com/photo-1444464666168-49d633b867ad?w=500&h=280&fit=crop", match: "95%" },
      { id: 6, title: "Fight Club", img: "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=500&h=280&fit=crop", match: "94%" },
    ]
  },
  { 
    title: { pt: "Filmes Premiados", en: "Award-Winning Movies", es: "Películas Premiadas" }, 
    items: [
      { id: 7, title: "Inception", img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=500&h=280&fit=crop", match: "93%" },
      { id: 8, title: "The Matrix", img: "https://images.unsplash.com/photo-1550439062-609e1531270e?w=500&h=280&fit=crop", match: "92%" },
      { id: 9, title: "Goodfellas", img: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=500&h=280&fit=crop", match: "91%" },
      { id: 10, title: "Seven Samurai", img: "https://images.unsplash.com/photo-1492681290082-e932832941e6?w=500&h=280&fit=crop", match: "90%" },
      { id: 11, title: "Se7en", img: "https://images.unsplash.com/photo-1509343256512-d77a5cb3791b?w=500&h=280&fit=crop", match: "89%" },
      { id: 12, title: "City of God", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&h=280&fit=crop", match: "88%" },
    ]
  },
];

export default function StreamingPage() {
  // Estado do Hero
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  
  // Embla Carousel para o Hero (Sem Autoplay Plugin, faremos manual)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });

  // Autoplay Manual com useEffect
  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = setInterval(() => {
        // Se o vídeo estiver rodando, talvez não queiramos mudar o slide?
        // Por enquanto, vamos deixar rodando igual Netflix (muda o destaque mesmo assim)
        if (emblaApi.canScrollNext()) {
            emblaApi.scrollNext();
        }
    }, 10000); // 10 segundos por slide

    return () => clearInterval(autoplay);
  }, [emblaApi]);

  // Sincronizar slide atual e controlar vídeo
  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCurrentSlide(emblaApi.selectedScrollSnap());
      setShowVideo(false); // Reseta vídeo ao mudar slide
      // Delay para iniciar o vídeo do novo slide
      setTimeout(() => setShowVideo(true), 2500);
    };

    emblaApi.on("select", onSelect);
    
    // Iniciar vídeo inicial
    const initialTimer = setTimeout(() => setShowVideo(true), 1500);

    return () => {
        emblaApi.off("select", onSelect);
        clearTimeout(initialTimer);
    }
  }, [emblaApi]);

  const activeMovie = HERO_MOVIES[currentSlide];

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans overflow-x-hidden selection:bg-red-600 selection:text-white pb-20">
      
      {/* =========================================
          DYNAMIC HERO SECTION
      ========================================= */}
      <section className="relative w-full h-[90vh] md:h-[85vh] overflow-hidden group">
        
        {/* HERO CAROUSEL WRAPPER (Escondido visualmente, controla a lógica) */}
        <div className="absolute inset-0" ref={emblaRef}>
           <div className="flex h-full">
              {HERO_MOVIES.map((movie) => (
                 <div key={movie.id} className="flex-[0_0_100%] h-full relative">
                    {/* O conteúdo visual é renderizado fora do loop para animações suaves, 
                        aqui dentro mantemos apenas a estrutura para o slide funcionar */}
                 </div>
              ))}
           </div>
        </div>

        {/* BACKGROUND LAYER (Visualização do Slide Ativo) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Imagem de Fundo com Crossfade Suave */}
          <div className="relative w-full h-full">
             <Image 
                src={activeMovie.image} 
                alt={activeMovie.title}
                fill
                className={`absolute inset-0 object-cover transition-opacity duration-1000 ${showVideo ? 'opacity-0' : 'opacity-100'}`}
                priority
             />
             
             {/* YouTube Iframe Background */}
             <div className={`absolute inset-0 w-full h-full scale-[1.35] transition-opacity duration-1000 ${showVideo ? 'opacity-100' : 'opacity-0'}`}>
                {showVideo && (
                    <iframe
                        className="w-full h-full aspect-video pointer-events-none"
                        src={`https://www.youtube.com/embed/${activeMovie.youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${activeMovie.youtubeId}&start=10`}
                        title="YouTube video player"
                        allow="autoplay; encrypted-media"
                    ></iframe>
                )}
             </div>
          </div>

          {/* Gradient Overlay (Vignette) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 via-[#141414]/30 to-transparent" />
        </div>

        {/* HERO CONTENT */}
        <div className="relative z-10 flex flex-col justify-end h-full pb-24 md:pb-32 px-4 md:px-16 max-w-3xl pointer-events-none">
          {/* Pointer events auto only on interactive elements */}
          <div className="space-y-6 pointer-events-auto animate-in fade-in slide-in-from-left-8 duration-700 key={currentSlide}"> 
          {/* key={currentSlide} força re-animação quando muda o slide */}
             
             {/* Tags/Logo */}
             <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-red-600 text-red-500 tracking-widest font-bold bg-red-600/10 backdrop-blur-sm">
                  N ORIGINAL
                </Badge>
                {activeMovie.tags.map(tag => (
                   <span key={tag} className="text-sm font-medium text-gray-300 border-l pl-2 border-gray-600 first:border-0 first:pl-0">
                     {tag}
                   </span>
                ))}
             </div>

             {/* Title */}
             <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-none drop-shadow-2xl">
               {activeMovie.title}
             </h1>

             {/* Info Row */}
             <div className="flex items-center gap-4 text-base md:text-lg font-medium">
                <span className="text-green-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> {activeMovie.match} Match
                </span>
                <span className="text-gray-300">{activeMovie.year}</span>
                <Badge className="bg-zinc-700 hover:bg-zinc-600 text-white border-0">{activeMovie.duration}</Badge>
                <Badge variant="outline" className="border-white/40 text-white">HD</Badge>
             </div>

             {/* Description */}
             <p className="text-base md:text-xl text-gray-200 line-clamp-3 md:line-clamp-none max-w-2xl drop-shadow-md">
               <Text pt={activeMovie.desc.pt} en={activeMovie.desc.en} es={activeMovie.desc.es} />
             </p>

             {/* Botões de Ação */}
             <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="h-14 px-8 rounded-md text-lg font-bold bg-white text-black hover:bg-white/80 transition-transform hover:scale-105">
                   <Play className="mr-2 h-6 w-6 fill-black" /> <Text pt="Assistir" en="Play" es="Reproducir" />
                </Button>

                {/* MODAL DETALHES */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="secondary" className="h-14 px-8 rounded-md text-lg font-bold bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-transform hover:scale-105">
                      <Info className="mr-2 h-6 w-6" /> <Text pt="Mais Info" en="More Info" es="Más Info" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl p-0 bg-[#181818] border-none text-white overflow-hidden max-h-[90vh] overflow-y-auto">
                      <div className="relative h-[450px]">
                         <iframe
                            className="w-full h-full pointer-events-none object-cover"
                            src={`https://www.youtube.com/embed/${activeMovie.youtubeId}?autoplay=1&mute=1&controls=0&start=5`}
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
                         <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
                            <div>
                                <h2 className="text-5xl font-black mb-4">{activeMovie.title}</h2>
                                <div className="flex gap-4">
                                  <Button className="bg-white text-black font-bold px-8">
                                    <Play className="mr-2 fill-black" /> <Text pt="Assistir" en="Play" es="Reproducir" />
                                  </Button>
                                  <Button variant="ghost" className="border border-white/20 hover:bg-white/10 rounded-full h-10 w-10 p-0"><Plus /></Button>
                                </div>
                            </div>
                         </div>
                      </div>
                      
                      <div className="p-10 grid md:grid-cols-3 gap-10">
                         <div className="md:col-span-2 space-y-6">
                            <div className="flex gap-4 text-sm text-gray-400">
                               <span className="text-green-400 font-bold">{activeMovie.match} Match</span>
                               <span>{activeMovie.year}</span>
                               <span>{activeMovie.duration}</span>
                            </div>
                            <p className="text-lg leading-relaxed">
                                <Text pt={activeMovie.desc.pt} en={activeMovie.desc.en} es={activeMovie.desc.es} />
                             </p>
                            <Separator className="bg-white/10" />
                            <Tabs defaultValue="related">
                               <TabsList className="bg-transparent border-b border-white/10 w-full justify-start rounded-none p-0 h-auto">
                                  <TabsTrigger value="related" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-t-2 border-red-600 rounded-none px-0 pb-2 mr-6 text-lg uppercase font-bold text-gray-400 data-[state=active]:text-white">
                                     <Text pt="Relacionados" en="Related" es="Relacionados" />
                                  </TabsTrigger>
                                  <TabsTrigger value="details" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-t-2 border-red-600 rounded-none px-0 pb-2 text-lg uppercase font-bold text-gray-400 data-[state=active]:text-white">
                                     <Text pt="Detalhes" en="Details" es="Detalles" />
                                  </TabsTrigger>
                               </TabsList>
                               <TabsContent value="related" className="pt-6">
                                  <div className="grid grid-cols-3 gap-4">
                                     {CATEGORIES[0].items.slice(0, 3).map((relatedItem, i) => (
                                        <div key={i} className="relative aspect-video rounded-md overflow-hidden">
                                           <Image src={relatedItem.img} alt={relatedItem.title} fill className="object-cover" />
                                        </div>
                                     ))}
                                  </div>
                               </TabsContent>
                            </Tabs>
                         </div>
                         <div className="space-y-4 text-sm">
                            <p><span className="text-gray-500"><Text pt="Gêneros" en="Genres" es="Géneros" />:</span> <span className="text-white">Ação, Sci-Fi</span></p>
                            <p><span className="text-gray-500"><Text pt="Elenco" en="Cast" es="Elenco" />:</span> <span className="text-white">Blender Foundation</span></p>
                         </div>
                      </div>
                  </DialogContent>
                </Dialog>
             </div>
          </div>

          {/* Controles do Lado Direito (Mudo/Classificação) */}
          <div className="absolute right-0 bottom-[30%] flex items-center gap-4 pointer-events-auto">
             <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="w-10 h-10 rounded-full border border-white/30 bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/10 transition-colors"
             >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
             </button>
             <div className="h-10 bg-black/20 backdrop-blur-sm border-l-2 border-white pl-4 pr-10 flex items-center text-sm font-bold tracking-widest uppercase">
                16+
             </div>
          </div>
        </div>
      </section>

      {/* =========================================
          FILEIRAS DE CONTEÚDO (Slider Netflix)
          Deslocado para cima (-mt-24)
      ========================================= */}
      <div className="relative z-20 -mt-24 pl-4 md:pl-12 space-y-12 pb-20">
         
         {/* Carrossel de Categorias */}
         {CATEGORIES.map((category, idx) => (
            <div key={idx} className="space-y-4 group/row">
               <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 group cursor-pointer">
                  <Text pt={category.title.pt} en={category.title.en} es={category.title.es} />
                  <span className="text-cyan-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center translate-y-[2px]">
                     <Text pt="Ver tudo" en="See all" es="Ver todo" /> <ChevronRight className="w-4 h-4" />
                  </span>
               </h2>
               
               <ScrollArea className="w-full whitespace-nowrap rounded-md">
                 <div className="flex w-max space-x-4 p-4">
                   {/* Card Item */}
                   {category.items.map((item, i) => (
                     <div key={i} className="relative w-[180px] md:w-[280px] aspect-video rounded-md overflow-hidden bg-zinc-800 transition-all duration-300 hover:scale-110 hover:z-50 hover:shadow-xl cursor-pointer group/card border border-transparent hover:border-zinc-600">
                        {/* Imagem (simulada) */}
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                           <Play className="w-12 h-12 text-white/20 group-hover/card:text-white transition-colors" />
                        </div>
                        <Image 
                          src={item.img} 
                          alt={item.title}
                          fill
                          className="absolute inset-0 object-cover opacity-80 group-hover/card:opacity-100"
                        />
                        
                        {/* Barra de progresso (exemplo) */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                           <div className="h-full bg-red-600 w-[45%]"></div>
                        </div>

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 p-4 text-center">
                            <h3 className="font-bold text-sm whitespace-normal">{item.title}</h3>
                            <div className="flex gap-2">
                               <Badge variant="outline" className="border-white/50 bg-white/10 hover:bg-white text-white hover:text-black transition-colors p-1"><Plus className="w-4 h-4" /></Badge>
                               <Badge variant="secondary" className="bg-white hover:bg-red-600 hover:text-white p-1"><Play className="w-4 h-4 fill-current" /></Badge>
                               <Badge variant="outline" className="border-white/50 bg-white/10 hover:bg-white text-white hover:text-black transition-colors p-1"><ChevronDown className="w-4 h-4" /></Badge>
                            </div>
                            <p className="text-[10px] text-green-400 font-bold">{item.match} Match</p>
                        </div>
                     </div>
                   ))}
                 </div>
                 <ScrollBar orientation="horizontal" className="hidden" />
               </ScrollArea>
            </div>
         ))}
      </div>
    </div>
  );
}