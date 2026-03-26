"use client";

import { useState } from "react";
import { Scene, parseScript } from "@/lib/parser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Save, Settings2, Link as Share } from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function EditorPage() {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("Novo Documento");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleParse = () => {
    const parsed = parseScript(text);
    setScenes(parsed);
  };

  const handleSave = async () => {
    if (scenes.length === 0) {
      alert("Por favor, parse primeiro o roteiro para gerar as cenas.");
      return;
    }

    setIsSaving(true);
    try {
      // Create a main script document
      const scriptRef = await addDoc(collection(db, "scripts"), {
        title,
        createdAt: new Date().toISOString(),
        isPublic: false,
      });

      // Save the version
      const versionRef = doc(collection(db, "scripts", scriptRef.id, "versions"));
      await setDoc(versionRef, {
        content: text,
        scenes,
        createdAt: new Date().toISOString(),
      });

      alert("Script salvo com sucesso!");
      router.push(`/dashboard`);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar o script.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="text-3xl font-bold bg-transparent px-4 focus-visible:ring-0 max-w-full border" 
          />
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleParse}>
              <Settings2 className="w-4 h-4 mr-2" />
              Parse Roteiro
            </Button>
            <Button onClick={handleSave} disabled={isSaving || scenes.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
        
        <Label className="text-muted-foreground">Cole seu roteiro do Word no formato "Cena [X]... Locução... Tempo..."</Label>
        
        <Textarea 
          placeholder={`Cena 1\n\nDescrição\nO apresentador gesticula...\n\nTexto em tela\nPROMOÇÃO IMPERDÍVEL\n\nLocução | Legenda\nBem vindos a nossa mais nova promoção de verão!\n\nPronúncia\nBem vin-dus`} 
          className="flex-1 min-h-[50vh] resize-none p-6 text-lg rounded-xl shadow-sm bg-card border"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {/* Sidebar for Preview */}
      <div className="w-full md:w-[400px] border-l bg-muted/20 flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b bg-background">
          <h2 className="font-semibold text-lg flex items-center">
            <Play className="w-4 h-4 mr-2" /> Cenas ({scenes.length})
          </h2>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pb-12">
            {scenes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-10">
                Nenhuma cena reconhecida. Clique em "Parse Roteiro".
              </p>
            ) : (
              scenes.map((scene, i) => (
                <Card key={scene.id} className="shadow-sm">
                  <CardHeader className="py-3 bg-muted/50">
                    <CardTitle className="text-sm flex justify-between">
                      <span>Cena {scene.sceneNumber}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-3 text-sm space-y-3">
                    {scene.description && (
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded border-l-2 border-l-blue-500">
                        <span className="font-semibold block text-blue-600 dark:text-blue-400">Descrição:</span> {scene.description}
                      </p>
                    )}
                    {scene.onScreenText && (
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded border-l-2 border-l-green-500">
                        <span className="font-semibold block text-green-600 dark:text-green-400">Texto em Tela:</span> {scene.onScreenText}
                      </p>
                    )}
                    {scene.spokenText && (
                      <div className="text-sm font-medium">
                        <span className="block text-xs text-muted-foreground mb-1">Locução | Legenda:</span>
                        "{scene.spokenText}"
                      </div>
                    )}
                    {scene.pronunciation && (
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <span className="font-semibold text-orange-500 block">Pronúncia:</span> {scene.pronunciation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
