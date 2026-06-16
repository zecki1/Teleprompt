"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Briefcase, Key, Sparkles, ArrowRight, Hourglass } from "lucide-react";

export function WelcomeModal() {
  const { user, setupInitialWorkspace, joinWorkspaceByToken } = useAuth();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<"choose" | "create" | "join">("choose");
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [loading, setLoading] = useState(false);

  const isNewUser = user && (!user.workspaces || user.workspaces.length === 0);

  if (!isNewUser) return null;

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      toast.error("Digite um nome para o workspace.");
      return;
    }
    setLoading(true);
    try {
      await setupInitialWorkspace(workspaceName.trim());
      setOpen(false);
    } catch {
      // toast já exibido em setupInitialWorkspace
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWorkspace = async () => {
    if (!inviteToken.trim()) {
      toast.error("Digite a chave ou link de convite.");
      return;
    }
    setLoading(true);
    try {
      const result = await joinWorkspaceByToken(inviteToken.trim());
      if (result.success) {
        setOpen(false);
      }
    } catch {
      toast.error("Erro ao entrar no workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg rounded-2xl" showCloseButton={false}>
        {step === "choose" && (
          <>
            <DialogHeader className="text-center pt-4">
              <div className="mx-auto w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7 text-blue-500" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Bem-vindo ao Teleprompt!
              </DialogTitle>
              <DialogDescription className="text-sm mt-2 leading-relaxed">
                O Teleprompt ajuda você a criar, gerenciar e exportar roteiros para
                gravação de vídeos e podcasts em equipe.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 text-center">
                Para começar, escolha uma opção:
              </p>

              <Button
                variant="outline"
                className="w-full h-auto py-5 px-4 rounded-xl justify-start gap-4 border-2 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
                onClick={() => setStep("create")}
              >
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Criar um Workspace</p>
                  <p className="text-xs text-zinc-500">
                    Crie seu próprio workspace e convide sua equipe
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto text-zinc-400 shrink-0" />
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-5 px-4 rounded-xl justify-start gap-4 border-2 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
                onClick={() => setStep("join")}
              >
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Usar uma Chave de Convite</p>
                  <p className="text-xs text-zinc-500">
                    Entre em um workspace existente com uma chave ou link
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto text-zinc-400 shrink-0" />
              </Button>
            </div>

            <DialogFooter className="flex-col gap-2 text-center">
              <p className="text-[10px] text-zinc-400 text-center">
                Você pode alterar ou criar novos workspaces depois nas configurações.
              </p>
            </DialogFooter>
          </>
        )}

        {step === "create" && (
          <>
            <DialogHeader className="pt-4">
              <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-500" />
                Criar Workspace
              </DialogTitle>
              <DialogDescription>
                Dê um nome para seu workspace. Você poderá convitar sua equipe depois.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Label htmlFor="ws-name">Nome do Workspace</Label>
              <Input
                id="ws-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Ex: Minha Equipe"
                disabled={loading}
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep("choose")} disabled={loading}>
                Voltar
              </Button>
              <Button onClick={handleCreateWorkspace} disabled={loading}>
                {loading ? (
                  <><Hourglass className="mr-2 h-4 w-4 animate-spin" style={{ animationDuration: "2s" }} /> Criando...</>
                ) : (
                  "Criar Workspace"
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "join" && (
          <>
            <DialogHeader className="pt-4">
              <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-500" />
                Entrar no Workspace
              </DialogTitle>
              <DialogDescription>
                Cole a chave de convite ou o link compartilhado pelo administrador.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Label htmlFor="invite-token">Chave ou Link de Convite</Label>
              <Input
                id="invite-token"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder="Cole a chave aqui..."
                disabled={loading}
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep("choose")} disabled={loading}>
                Voltar
              </Button>
              <Button onClick={handleJoinWorkspace} disabled={loading}>
                {loading ? (
                  <><Hourglass className="mr-2 h-4 w-4 animate-spin" style={{ animationDuration: "2s" }} /> Entrando...</>
                ) : (
                  "Entrar no Workspace"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
