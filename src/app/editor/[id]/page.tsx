"use client";

import { useEffect, useState, use, Suspense } from "react";
import { Scene, parseScript } from "@/lib/parser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Save,
  Settings2,
  ImageIcon,
  Trash2,
  Plus,
  ChevronLeft,
  Scissors,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

// Componente Interno que detém a lógica do editor
function EditorContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = !id || id === "new";

  const [text, setText] = useState("");
  const [title, setTitle] = useState("Novo Roteiro");
  const [project, setProject] = useState("Geral");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  // 1. Carregar dados (Firestore para edição, URL para novo)
  useEffect(() => {
    if (isNew) {
      const projectFromUrl = searchParams.get("project");
      if (projectFromUrl) setProject(projectFromUrl);
      setLoading(false);
      return;
    }

    async function loadScript() {
      try {
        const scriptRef = doc(db, "scripts", id);
        const scriptSnap = await getDoc(scriptRef);

        if (scriptSnap.exists()) {
          const data = scriptSnap.data();
          setTitle(data.title || "");
          setProject(data.project || "Geral");

          const vQ = query(
            collection(db, "scripts", id, "versions"),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          const vSnap = await getDocs(vQ);

          if (!vSnap.empty) {
            const vData = vSnap.docs[0].data();
            setText(vData.content || "");
            setScenes(vData.scenes || []);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar roteiro:", e);
      } finally {
        setLoading(false);
      }
    }
    loadScript();
  }, [id, isNew, searchParams]);

  // 2. Lógica de Salvamento
  const handleSave = async () => {
    if (scenes.length === 0) {
      alert("Processe o roteiro (Parse) antes de salvar.");
      return;
    }

    setIsSaving(true);
    try {
      let currentScriptId = id;

      if (isNew) {
        const docRef = await addDoc(collection(db, "scripts"), {
          title,
          project,
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          isPublic: false,
        });
        currentScriptId = docRef.id;
      } else {
        await updateDoc(doc(db, "scripts", currentScriptId), {
          title,
          project,
          updatedAt: serverTimestamp(),
        });
      }

      const versionRef = collection(db, "scripts", currentScriptId as string, "versions");
      await addDoc(versionRef, {
        content: text,
        scenes: scenes,
        createdAt: new Date().toISOString(),
      });

      alert("Roteiro salvo com sucesso!");
      if (isNew) router.push("/dashboard");
    } catch (e) {
      console.error("Erro ao salvar:", e);
      alert("Falha ao salvar roteiro.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleParse = () => {
    const parsed = parseScript(text);
    setScenes(parsed);
  };

  const updateScene = (index: number, data: Partial<Scene>) => {
    const newScenes = [...scenes];
    newScenes[index] = { ...newScenes[index], ...data };
    setScenes(newScenes);
  };

  const splitScene = (index: number) => {
    const s = scenes[index];
    const mid = Math.floor((s.spokenText?.length || 0) / 2);
    const sceneA = { ...s, spokenText: s.spokenText?.substring(0, mid) };
    const sceneB: Scene = { 
      id: crypto.randomUUID(), 
      sceneNumber: `${s.sceneNumber}.1`, 
      spokenText: s.spokenText?.substring(mid) || "", 
      time: "", 
      imageUrl: "", 
      sourceUrl: "" 
    };
    const updated = [...scenes];
    updated.splice(index, 1, sceneA, sceneB);
    setScenes(updated);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center dark:bg-zinc-950 text-blue-500">
      <Loader2 className="animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors text-zinc-900 dark:text-zinc-100">
      
      {/* PAINEL ESQUERDO: TEXTO BRUTO */}
      <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 min-w-0">
        <div className="flex items-center gap-4 mb-2 shrink-0">
          <Button variant="ghost" size="icon" asChild className="shrink-0 dark:text-zinc-400">
            <Link href="/dashboard"><ChevronLeft /></Link>
          </Button>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Título do Roteiro</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="h-9 font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700" 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Projeto</Label>
              <Input 
                value={project} 
                onChange={(e) => setProject(e.target.value)} 
                className="h-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 font-bold text-blue-500" 
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 shrink-0">
          <span className="text-xs text-blue-700 dark:text-blue-300 font-medium italic">Cole o texto do Word e use tags como Cena, img: e url:.</span>
          <Button size="sm" onClick={handleParse} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
            <Settings2 className="w-4 h-4 mr-2" /> Processar Texto
          </Button>
        </div>

        <Textarea 
          placeholder={`Cena 1\n0-20s\nLocução: Seu texto aqui...\nimg: https://url-da-imagem.jpg`} 
          className="flex-1 min-h-[400px] font-mono text-sm p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 leading-relaxed resize-none focus-visible:ring-blue-500 shadow-inner" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
        />
      </div>

      {/* PAINEL DIREITO: BLOCOS ESTRUTURADOS */}
      <div className="w-full md:w-[500px] flex flex-col bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shrink-0 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50 backdrop-blur shrink-0">
          <h2 className="font-bold text-xs flex items-center gap-2 uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            <Play className="w-4 h-4 text-blue-500" /> Blocos ({scenes.length})
          </h2>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || scenes.length === 0} 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
            Salvar
          </Button>
        </div>

        <ScrollArea className="flex-1 h-full w-full [&>div]:!block overflow-x-hidden">
          <div className="p-4 space-y-4 pb-32 flex flex-col w-full min-w-0">
            {scenes.map((scene, index) => (
              <Card key={scene.id} className="group bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-blue-500/50 transition-all w-full min-w-0 overflow-hidden">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2 border-b border-zinc-100 dark:border-zinc-700 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="bg-zinc-800 dark:bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 uppercase">#{scene.sceneNumber}</span>
                    <Input 
                      value={scene.time || ""} 
                      onChange={(e) => updateScene(index, { time: e.target.value })} 
                      placeholder="Tempo" 
                      className="h-6 w-20 text-[10px] bg-transparent border-dashed border-zinc-300 dark:border-zinc-600 p-1" 
                    />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400" onClick={() => splitScene(index)}><Scissors className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-500" onClick={() => setScenes(scenes.filter((_, i) => i !== index))}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>

                <CardContent className="p-3 space-y-3 overflow-hidden">
                  <div className="grid grid-cols-1 gap-2 min-w-0">
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                      <ImageIcon className="w-3 h-3 text-zinc-400 shrink-0" />
                      <Input 
                        value={scene.imageUrl || ""} 
                        onChange={(e) => updateScene(index, { imageUrl: e.target.value })} 
                        placeholder="img: (Link da miniatura)" 
                        className="h-6 text-[10px] border-none bg-transparent focus-visible:ring-0 p-0 min-w-0 flex-1 dark:text-zinc-300" 
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                      <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
                      <Input 
                        value={scene.sourceUrl || ""} 
                        onChange={(e) => updateScene(index, { sourceUrl: e.target.value })} 
                        placeholder="url: (Link de download)" 
                        className="h-6 text-[10px] border-none bg-transparent focus-visible:ring-0 p-0 min-w-0 flex-1 dark:text-zinc-300" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-blue-500">Texto Teleprompter</Label>
                    <Textarea 
                      value={scene.spokenText || ""} 
                      onChange={(e) => updateScene(index, { spokenText: e.target.value })} 
                      className="text-sm font-medium leading-relaxed min-h-[80px] border-none bg-zinc-50/50 dark:bg-zinc-900/50 p-2 resize-none w-full dark:text-zinc-200 shadow-inner" 
                    />
                  </div>

                  {scene.imageUrl && (
                    <div className="relative aspect-video w-full rounded overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-black shrink-0 mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={scene.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-contain" 
                        onError={(e) => (e.currentTarget.src = "https://placehold.co/400x225?text=Link+Invalido")} 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button 
              variant="outline" 
              className="w-full border-dashed border-2 py-8 text-zinc-400 dark:border-zinc-700 hover:text-blue-500 hover:border-blue-500 transition-all bg-transparent shrink-0" 
              onClick={() => setScenes([...scenes, { id: crypto.randomUUID(), sceneNumber: String(scenes.length + 1), spokenText: "" }])}
            >
              <Plus className="w-5 h-5 mr-2" /> Novo Bloco Manual
            </Button>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Wrapper Principal que exporta com Suspense (Obrigatório para useSearchParams)
export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center dark:bg-zinc-950 text-blue-500 font-bold">
        <Loader2 className="animate-spin mr-2" /> Carregando Interface...
      </div>
    }>
      <EditorContent id={id} />
    </Suspense>
  );
}