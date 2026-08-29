"use client";

import { Eye, RotateCcw, UserCog, Wrench } from "lucide-react";
import { useAuth, type DemoView } from "@/contexts/AuthContext";
import { isDemoWorkspaceName } from "@/services/demo";
import { cn } from "@/lib/utils";

/**
 * Alterna a visualização da aplicação entre "Admin" e "Técnico" (demo),
 * para quem quiser ver as duas telas como se fosse uma demonstração.
 * Só afeta a UI — as permissões reais do usuário no backend não mudam.
 * Só é exibido em workspaces de demonstração (ou em sessão demo aberta).
 */
export function RolePreviewSwitcher() {
  const { user, currentWorkspace, demoView, setDemoView } = useAuth();

  const isDemoContext =
    demoView !== null ||
    !user?.workspaceId ||
    isDemoWorkspaceName(currentWorkspace?.name);
  if (!isDemoContext) return null;

  const options: { value: Exclude<DemoView, null>; label: string; Icon: typeof UserCog }[] = [
    { value: "admin", label: "Admin", Icon: UserCog },
    { value: "tecnico", label: "Técnico", Icon: Wrench },
  ];

  return (
    <div className="px-2 py-1.5 border-t border-zinc-800 mt-1.5 pt-2">
      <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mb-1.5 flex items-center gap-1.5">
        <Eye className="h-3 w-3" /> Ver como (demo)
      </p>
      <div className="flex items-center gap-1 rounded-lg bg-zinc-900/60 border border-zinc-800 p-1">
        {options.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setDemoView(demoView === value ? null : value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] transition-colors",
              demoView === value
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDemoView(null)}
          title="Visão real da sua conta"
          className="flex items-center justify-center rounded-md p-1.5 text-[11px] text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
      {demoView && (
        <p className="mt-1.5 text-[10px] text-cyan-400/80 leading-snug">
          Visualização demo — nada é alterado de verdade na sua conta.
        </p>
      )}
    </div>
  );
}