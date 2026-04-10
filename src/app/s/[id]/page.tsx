"use client";

import React, { useEffect, useState, use } from "react";
import Image from "next/image";
import { Scene } from "@/lib/parser";
import { doc, getDoc, collection, query, orderBy, limit, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Lock, 
  Play, 
  ImageIcon, 
  ExternalLink, 
  Type, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ChevronLeft,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { createRecordingTask } from "@/lib/zecki";
import { toast } from "sonner";

interface ScriptData {
  id: string;
  title: string;
  project?: string;
  projectId?: string;
  status: string;
  isPublic: boolean;
  lockedForEditing: boolean;
  createdAt?: string;
  validatedAt?: string;
  workspaceId?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-zinc-500" },
  em_revisao: { label: "Em Revisão", color: "bg-yellow-500" },
  revisao_realizada: { label: "Revisão Realizada", color: "bg-orange-500" },
  aguardando_gravacao: { label: "Aguardando Gravação", color: "bg-green-500" },
  gravado: { label: "Gravado", color: "bg-blue-500" },
  rejeitado: { label: "Rejeitado", color: "bg-red-500" },
};

function formatEditorMarkers(spokenText: string | null | undefined): React.ReactNode {
  if (!spokenText) return null;
  const regex = /(\[(?:let|img)\d+\]|\[\d+\])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(spokenText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(spokenText.slice(lastIndex, match.index));
    }
    const isImg = match[0].startsWith('[img');
    const colorClass = isImg ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400';
    parts.push(
      <span key={`marker-${match.index}`} className={`${colorClass} font-black`}>
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < spokenText.length) {
    parts.push(spokenText.slice(lastIndex));
  }
  return parts.length > 0 ? parts : spokenText;
}

export default function PublicScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user, hasPermission } = useAuth();
  
  const [script, setScript] = useState<ScriptData | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const canValidate = hasPermission(["validador"]);

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
        
        if (!data.isPublic && !user) {
          setError("Este roteiro não está disponível para acesso público. Faça login para visualizar.");
          setLoading(false);
          return;
        }

        setScript({ ...data, id: resolvedParams.id });

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
        console.error(e);
        setError("Erro ao carregar roteiro");
      } finally {
        setLoading(false);
      }
    }

    loadScript();
  }, [resolvedParams.id, user]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!script) return;
    setIsUpdating(true);
    try {
      const scriptRef = doc(db, "scripts", script.id);
      await updateDoc(scriptRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        validatedBy: user?.uid,
        validatedAt: new Date().toISOString()
      });
      
      setScript({ ...script, status: newStatus });

      if (newStatus === "aguardando_gravacao" && script.projectId) {
        await createRecordingTask(
          script.projectId, 
          script.title, 
          script.id, 
          user?.uid || "system",
          script.workspaceId || user?.workspaceId || "senai"
        );
      }

      toast.success(`Roteiro movido para: ${statusConfig[newStatus]?.label}`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <Lock className="w-16 h-16 mx-auto text-zinc-400 mb-6" />
            <h2 className="text-2xl font-black mb-4">Acesso Restrito</h2>
            <p className="text-zinc-500 mb-8">{error}</p>
            <Button asChild className="w-full">
              <Link href="/login">Fazer Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pb-20">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 truncate">
            {user && (
              <Button variant="ghost" size="icon" asChild className="shrink-0 h-8 w-8">
                <Link href="/dashboard"><ChevronLeft size={16} /></Link>
              </Button>
            )}
            <div className="truncate">
              <h1 className="text-lg font-black truncate">{script?.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="text-[9px] uppercase tracking-tighter bg-blue-500/10 text-blue-500 border-blue-500/20">
                  {script?.project || "Geral"}
                </Badge>
                <Badge className={`text-[9px] uppercase tracking-tighter ${statusConfig[script?.status || ""]?.color} text-white border-none`}>
                  {statusConfig[script?.status || ""]?.label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!user && (
              <Button variant="outline" size="sm" asChild className="h-8 text-[10px] font-black uppercase">
                <Link href="/login">ENTRAR</Link>
              </Button>
            )}
            <Button size="sm" asChild className="h-8 bg-blue-600 text-white font-black text-[10px] tracking-widest px-4 rounded-lg">
              <Link href={`/tp/${resolvedParams.id}`} target="_blank">
                <Play className="w-3.5 h-3.5 mr-2" /> TELEPROMPTER
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {canValidate && script?.status === "em_revisao" && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4 sticky top-16 z-40 backdrop-blur-md">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="text-xs font-black text-yellow-600 uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} /> AGUARDANDO SUA VALIDAÇÃO
            </span>
            <div className="flex items-center gap-2">
              <Button onClick={() => handleUpdateStatus("aguardando_gravacao")} disabled={isUpdating} className="bg-green-600 text-white h-8 text-[10px]">
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />} APROVAR
              </Button>
              <Button variant="outline" onClick={() => handleUpdateStatus("rejeitado")} disabled={isUpdating} className="text-red-500 h-8 text-[10px]">
                <XCircle size={14} className="mr-2" /> REJEITAR
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="grid gap-8">
          {scenes.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <FileText size={64} className="mx-auto mb-4" />
              <p className="font-bold">Nenhuma cena processada.</p>
            </div>
          ) : (
            scenes.map((scene) => (
              <Card key={scene.id} className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden rounded-2xl">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="bg-zinc-800 dark:bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase">
                      CENA {scene.sceneNumber}
                    </span>
                    {scene.time && <Badge className="text-[10px]">{scene.time}</Badge>}
                  </div>
                  {scene.sourceUrl && (
                    <Button variant="ghost" size="sm" asChild className="h-7 text-[10px] text-blue-500 uppercase font-black">
                      <a href={scene.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={12} className="mr-1.5" /> FONTE
                      </a>
                    </Button>
                  )}
                </div>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Locução</h3>
                    <div className="text-lg md:text-xl font-medium leading-relaxed">
                      {formatEditorMarkers(scene.spokenText)}
                    </div>
                  </div>
                  {scene.lettering && (
                    <div className="pt-4 border-t border-zinc-100">
                      <h3 className="text-[10px] font-black text-amber-600 uppercase mb-3 flex items-center gap-2"><Type size={14} /> Lettering</h3>
                      <div className="flex flex-col gap-1.5">
                        {scene.lettering.split("\n").filter(l => l.trim()).map((line, i) => (
                          <div key={i} className="bg-amber-100/30 text-amber-800 p-3 rounded-xl border border-amber-200 text-sm font-bold">
                            <span className="opacity-40 mr-2 text-xs">{i+1}</span>{line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {scene.imageUrl && (
                    <div className="pt-4 border-t border-zinc-100">
                      <h3 className="text-[10px] font-black text-purple-500 uppercase mb-3 flex items-center gap-2"><ImageIcon size={14} /> Imagem</h3>
                      <div className="rounded-2xl overflow-hidden bg-black aspect-video max-w-lg mx-auto border">
                        <Image 
                          src={scene.imageUrl} 
                          alt="Cena" 
                          fill 
                          className="object-contain" 
                          unoptimized={scene.imageUrl.startsWith('http')}
                        />
                      </div>
                    </div>
                  )}
                  {scene.observation && (
                    <div className="pt-4 border-t border-zinc-100 italic text-sm text-zinc-500 bg-zinc-50/50 p-3 rounded-lg">
                      {scene.observation}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
