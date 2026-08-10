"use client";

import { useEffect, useState } from "react";
import { Hourglass, WifiOff, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ErrorReportDialog, captureScreenshot } from "@/components/tp/ErrorReporter";

interface LoadingScreenProps {
  fullScreen?: boolean;
  className?: string;
  /** Percentual (0–100). Quando informado, exibe barra de progresso + %. */
  progress?: number;
  /** Tempo máximo em ms antes de exibir o fallback de erro (anti-loop). */
  timeoutMs?: number;
  /** Desativa o fallback de timeout (usar em cargas que podem ser longas de propósito). */
  disableTimeout?: boolean;
}

export function LoadingScreen({
  fullScreen = true,
  className,
  progress,
  timeoutMs = 25000,
  disableTimeout = false,
}: LoadingScreenProps) {
  const [timedOut, setTimedOut] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [screenshotCanvas, setScreenshotCanvas] = useState<HTMLCanvasElement | null>(null);

  const openReport = async () => {
    setScreenshotCanvas(await captureScreenshot());
    setReportOpen(true);
  };

  const closeReport = (next: boolean) => {
    if (!next) setScreenshotCanvas(null);
    setReportOpen(next);
  };

  useEffect(() => {
    if (disableTimeout || timedOut) return;
    const timer = setTimeout(() => setTimedOut(true), timeoutMs);
    const offlineListener = () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setTimedOut(true);
      }
    };
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setTimedOut(true);
    } else {
      window.addEventListener("offline", offlineListener);
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener("offline", offlineListener);
    };
  }, [disableTimeout, timeoutMs, timedOut]);

  if (timedOut) {
    return (
      <div
        className={cn(
          "flex items-center justify-center",
          fullScreen ? "fixed inset-0 z-50 bg-zinc-950" : "w-full py-20",
          className
        )}
      >
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" />
            <div className="relative p-4 rounded-full bg-red-500/5 border border-red-500/20">
              <WifiOff className="h-10 w-10 text-red-500" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-200 mb-2">Não foi possível concluir o carregamento</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              A página está demorando mais que o esperado ou você está sem conexão com o banco
              de dados. Verifique sua internet e tente novamente.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => window.location.reload()}
              className="bg-zinc-800 hover:bg-zinc-700 text-white rounded px-6 h-12 font-black text-xs uppercase tracking-widest gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Recarregar página
            </Button>
            <Button
              variant="outline"
              onClick={openReport}
              className="rounded px-6 h-12 font-black text-xs uppercase tracking-widest gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Reportar erro
            </Button>
          </div>
        </div>
        <ErrorReportDialog open={reportOpen} onOpenChange={closeReport} screenshotCanvas={screenshotCanvas} />
      </div>
    );
  }

  const hasProgress = typeof progress === "number" && progress >= 0 && progress <= 100;

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "fixed inset-0 z-50 bg-zinc-950" : "w-full py-20",
        className
      )}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
          <div className="relative p-4 rounded-full bg-blue-500/5 border border-blue-500/20">
            <Hourglass className="h-10 w-10 text-blue-500 animate-spin" style={{ animationDuration: "2s" }} />
          </div>
        </div>
        <p className="text-sm font-medium text-zinc-400 tracking-widest animate-pulse">
          Carregando...
        </p>
        {hasProgress && (
          <div className="w-64 flex flex-col items-center gap-2">
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-black text-blue-400 tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingScreen;
