"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { setupDemo, getDemoStatus, DEMO_EMAIL, DEMO_PASSWORD } from "@/services/demo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/PageTransitionLoader";
import { Sparkles, Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function DemoSetupPanel() {
  const { user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin === true || user?.role === "SuperAdmin";

  const [checking, setChecking] = useState(true);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState<"email" | "password" | null>(null);

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      const status = await getDemoStatus();
      setReady(status.ready);
      setWorkspaceId(status.workspaceId);
    } catch {
      setReady(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSetup = async () => {
    if (running) return;
    setRunning(true);
    try {
      const result = await setupDemo();
      setReady(true);
      setWorkspaceId(result.workspaceId);
      toast.success(
        result.created
          ? "Ambiente de demonstração criado com sucesso!"
          : "Ambiente de demonstração já estava pronto; conferido."
      );
    } catch (e) {
      console.error(e);
      toast.error("Falha ao preparar o ambiente de demonstração.");
    } finally {
      setRunning(false);
    }
  };

  const copy = async (value: string, key: "email" | "password") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      toast.success("Copiado!");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  if (!isSuperAdmin) return null;

  if (checking) {
    return (
      <div className="py-16">
        <LoadingScreen fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-2xl">
            <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Modo Demonstração</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Cria um workspace de demonstração único, uma conta compartilhável (email/senha) e um
              roteiro de exemplo com o tour guiado do app. Ideal para apresentar o produto.
            </p>
          </div>
        </div>
        <Badge className={ready ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-400 border-none"}>
          {ready ? "Pronto" : "Não configurado"}
        </Badge>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">Conta de demonstração (compartilhável)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Quem entrar com estas credenciais verá o workspace demo com o projeto e o roteiro de exemplo.
            </p>
          </div>
          <Button
            onClick={handleSetup}
            disabled={running}
            className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] px-6"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {ready ? "Reconfigurar / Conferir" : "Preparar ambiente demo"}
          </Button>
        </div>

        {ready && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Email</p>
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-sm">{DEMO_EMAIL}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copy(DEMO_EMAIL, "email")}
                  title="Copiar email"
                >
                  {copied === "email" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Senha</p>
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-sm">{DEMO_PASSWORD}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copy(DEMO_PASSWORD, "password")}
                  title="Copiar senha"
                >
                  {copied === "password" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {ready && workspaceId && (
          <div className="mt-4">
            <a
              href={`/login?workspaceId=${workspaceId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir tela de login do workspace demo
            </a>
          </div>
        )}

        <div className="mt-6 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 p-4 text-xs text-blue-700 dark:text-blue-300">
          <p className="font-bold mb-1">Como funciona</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>A conta demo é criada pelo SDK do cliente em um app secundário do Firebase, sem deslogar você e sem chaves de Admin SDK.</li>
            <li>O setup é idempotente: rodar de novo apenas confere e completa o que faltar.</li>
            <li>Quem entrar verá o tour guiado automaticamente e poderá navegar no roteiro de exemplo.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
