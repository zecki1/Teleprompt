"use client";

import { useEffect, useState, use } from "react";
import { Scene } from "@/lib/parser";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Lock, Play, ImageIcon, ExternalLink, Type } from "lucide-react";
import Link from "next/link";

interface ScriptData {
  id: string;
  title: string;
  project?: string;
  status: string;
  isPublic: boolean;
  lockedForEditing: boolean;
  createdAt?: string;
  validatedAt?: string;
}

function formatEditorLettering(spokenText: string | null | undefined): React.ReactNode {
  if (!spokenText) return null;
  
  const regex = /(\[(?:let|img)\d+\]|\[\d+\])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(spokenText)) !== null) {
    parts.push(spokenText.slice(lastIndex, match.index));
    
    const isImg = match[0].startsWith('[img');
    const colorClass = isImg ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400';
    
    parts.push(
      <span key={`marker-${match.index}`} className={`${colorClass} font-black`}>
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  
  parts.push(spokenText.slice(lastIndex));
  
  return parts.length > 0 ? parts : spokenText;
}

export default function PublicScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [script, setScript] = useState<ScriptData | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadScript() {
      try {
        const scriptRef = doc(db, "scripts", resolvedParams.id);
        const scriptSnap = await getDoc(scriptRef);

        if (!scriptSnap.exists()) {
          setError("Roteiro não encontrado");
          setLoading(false);
          return;
        }

        const data = scriptSnap.data() as ScriptData;
        
        if (!data.isPublic) {
          setError("Este roteiro não está disponível para acesso público");
          setLoading(false);
          return;
        }

        setScript({ ...data });

        const vQ = query(
          collection(db, "scripts", resolvedParams.id, "versions"),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const vSnap = await getDocs(vQ);

        if (!vSnap.empty) {
          const vData = vSnap.docs[0].data();
          setScenes(vData.scenes || []);
        }
      } catch (e) {
        console.error("Erro ao carregar roteiro:", e);
        setError("Erro ao carregar roteiro");
      } finally {
        setLoading(false);
      }
    }

    loadScript();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Card className="w-full max-w-md m-4">
          <CardContent className="pt-6 text-center">
            <Lock className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-zinc-500">{error}</p>
            <Link href="/" className="inline-block mt-4 text-blue-500 hover:underline">
              Voltar para home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-black">{script?.title}</h1>
          <Badge variant="outline" className="gap-1">
            <Eye className="w-3 h-3" />
            Público
          </Badge>
        </div>
        {script?.project && (
          <p className="text-zinc-500 text-sm">Projeto: {script.project}</p>
        )}
      </div>

      {script?.lockedForEditing && (
        <Card className="mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <CardContent className="py-3 flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Este roteiro está bloqueado para edição. Apenas visualização.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {scenes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-zinc-500">
              Nenhuma cena encontrada neste roteiro.
            </CardContent>
          </Card>
        ) : (
          scenes.map((scene, index) => (
            <Card key={scene.id} className="overflow-hidden">
              <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-zinc-800 text-white text-xs px-2 py-1 rounded-full">
                      CENA {scene.sceneNumber}
                    </span>
                    {scene.time && (
                      <span className="text-zinc-500 text-sm font-normal">
                        ({scene.time})
                      </span>
                    )}
                  </CardTitle>
                  {scene.sourceUrl && (
                    <a
                      href={scene.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm flex items-center gap-1"
                    >
                      Ver fonte
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {scene.spokenText && (
                  <div>
                    <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2">
                      Teleprompter
                    </h3>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg text-base leading-relaxed whitespace-pre-wrap">
                      {formatEditorLettering(scene.spokenText)}
                    </div>
                  </div>
                )}

                {scene.lettering && (
                  <div>
                    <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Type className="w-3 h-3" />
                      Lettering
                    </h3>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm leading-relaxed">
                      <pre className="whitespace-pre-wrap font-medium">
                        {scene.lettering}
                      </pre>
                    </div>
                  </div>
                )}

                {(scene.imageUrl || (scene.images && scene.images.length > 0)) && (
                  <div>
                    <h3 className="text-xs font-black text-purple-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      Imagens
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {scene.imageUrl && (
                        <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                          <img
                            src={scene.imageUrl}
                            alt="Preview"
                            className="w-full h-auto"
                            onError={(e) =>
                              (e.currentTarget.src =
                                "https://placehold.co/400x225?text=Link+Invalido")
                            }
                          />
                        </div>
                      )}
                      {(scene.images || [])
                        .filter((img) => img && img.trim() !== "")
                        .map((img, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"
                          >
                            <img
                              src={img}
                              alt={`Preview ${idx + 2}`}
                              className="w-full h-auto"
                              onError={(e) =>
                                (e.currentTarget.src =
                                  "https://placehold.co/400x225?text=Link+Invalido")
                              }
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {scene.observation && (
                  <div>
                    <h3 className="text-xs font-black text-purple-500 uppercase tracking-widest mb-2">
                      Observação
                    </h3>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg text-sm leading-relaxed">
                      {scene.observation}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 pt-6 border-t text-center">
        <Link
          href={`/tp/${resolvedParams.id}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          <Play className="w-4 h-4" />
          Abrir no Teleprompter
        </Link>
      </div>
    </div>
  );
}
