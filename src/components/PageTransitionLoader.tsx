import { Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  fullScreen?: boolean;
  className?: string;
}

export function LoadingScreen({ fullScreen = true, className }: LoadingScreenProps) {
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
      </div>
    </div>
  );
}

export default LoadingScreen;
