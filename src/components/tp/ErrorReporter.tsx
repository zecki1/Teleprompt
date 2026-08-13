"use client";

import { useCallback, useState } from "react";
import { domToCanvas } from "modern-screenshot";
import { toast } from "sonner";
import { createErrorReport } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bug, Download, Loader2 } from "lucide-react";
import { getRecentLogs, DebugLogEntry } from "@/lib/debug-log";
import { useAuth } from "@/contexts/AuthContext";

const SCREENSHOT_MAX_LENGTH = 900000;

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const PERMISSION_LABELS: { key: string; label: string }[] = [
  { key: "isSuperAdmin", label: "Super Admin" },
  { key: "canCollaborate", label: "Colaborador" },
  { key: "isEditor", label: "Editor" },
  { key: "isRevisor", label: "Revisor" },
  { key: "canRevert", label: "Reverter" },
  { key: "canAssign", label: "Atribuir" },
  { key: "canViewAdmin", label: "Ver Administração" },
  { key: "canViewReports", label: "Ver Relatórios" },
  { key: "canViewActivityHistory", label: "Ver Histórico" },
  { key: "canViewDebugLogs", label: "Ver Debug Logs" },
  { key: "requiresChecklist", label: "Checklist" },
];

type ReportUser = {
  uid?: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  workspaceId?: string;
  [key: string]: unknown;
};

function activePermissions(user: ReportUser | null): string[] {
  if (!user) return [];
  return PERMISSION_LABELS.filter(({ key }) => user[key] === true).map(({ label }) => label);
}

function compactLog(e: DebugLogEntry) {
  const truncate = (s: unknown, max: number) => {
    if (typeof s !== "string") return s ?? undefined;
    return s.length > max ? s.slice(0, max) + "…" : s;
  };
  return {
    level: e.level,
    context: e.context,
    message: truncate(e.message, 300),
    t: e.t,
    url: e.url,
    page: e.page,
    stack: truncate(e.stack, 500),
    meta: e.meta,
    durationMs: e.durationMs,
  };
}

export async function captureScreenshot(): Promise<HTMLCanvasElement | null> {
  try {
    const canvas = await domToCanvas(document.body, {
      width: window.innerWidth,
      height: window.innerHeight,
      scale: 0.5,
      backgroundColor: "#ffffff",
      timeout: 8000,
    });
    return canvas;
  } catch {
    return null;
  }
}

async function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(resolve, "image/png");
    } catch {
      resolve(null);
    }
  });
}

async function makeScreenshot(canvas: HTMLCanvasElement): Promise<{ dataUrl: string; pngBlob: Blob | null } | null> {
  const encode = (source: HTMLCanvasElement) => async () => {
    for (const quality of [0.7, 0.5, 0.35, 0.2]) {
      const dataUrl = source.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= SCREENSHOT_MAX_LENGTH) {
        const pngBlob = await canvasToPng(source);
        return { dataUrl, pngBlob };
      }
    }
    return null;
  };

  const direct = await encode(canvas)();
  if (direct) return direct;

  const half = document.createElement("canvas");
  half.width = Math.max(1, Math.round(canvas.width / 2));
  half.height = Math.max(1, Math.round(canvas.height / 2));
  const ctx = half.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, half.width, half.height);
    ctx.drawImage(canvas, 0, 0, half.width, half.height);
    const reduced = await encode(half)();
    if (reduced) return reduced;
  }
  return null;
}

function buildScreenVirtualization(): string | null {
  try {
    const parts: string[] = [];

    const pushList = (title: string, items: string[], max = 25) => {
      const clean = [...new Set(items.map((s) => s.trim()).filter((s) => s && s.length <= 120))];
      if (clean.length) {
        parts.push(
          `<div class="virt-block"><h3>${esc(title)}</h3><ul>${clean
            .slice(0, max)
            .map((s) => `<li>${esc(s)}</li>`)
            .join("")}</ul></div>`
        );
      }
    };

    const bodyText = (document.body?.innerText || "").trim();
    if (bodyText) {
      parts.push(
        `<div class="virt-block"><h3>Conteúdo visível</h3><pre>${esc(bodyText.slice(0, 6000))}</pre></div>`
      );
    }

    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4"))
      .map((h) => (h as HTMLElement).innerText.trim())
      .filter(Boolean);
    pushList("Títulos", headings, 15);

    const buttons = Array.from(document.querySelectorAll("button"))
      .map((b) => (b as HTMLElement).innerText.trim())
      .filter(Boolean);
    pushList("Botões", buttons, 30);

    const links = Array.from(document.querySelectorAll("a[href]")).map((a) => {
      const text = (a as HTMLElement).innerText.trim();
      const href = (a as HTMLAnchorElement).getAttribute("href") || "";
      return text ? `${text} → ${href}` : href;
    });
    pushList("Links", links, 20);

    const fields = Array.from(document.querySelectorAll("input, textarea, select")).map((el) => {
      const input = el as HTMLInputElement;
      const label =
        (el.closest("label") as HTMLElement | null)?.innerText?.trim() ||
        input.getAttribute("aria-label") ||
        input.name ||
        input.id ||
        "campo";
      const value = input.type === "password" ? "••••••" : (input.value || "").slice(0, 120);
      return value ? `${label}: ${value}` : label;
    });
    pushList("Campos preenchidos", fields, 20);

    if (!parts.length) return null;
    return parts.join("\n");
  } catch {
    return null;
  }
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadHtml(filename: string, html: string) {
  downloadBlob(filename, new Blob([html], { type: "text/html;charset=utf-8" }));
}

function timestampLabel(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function buildReportHtml({
  description,
  screenshot,
  virtualization,
  logs,
  user,
  url,
  page,
  ua,
  t,
}: {
  description: string;
  screenshot: string | null;
  virtualization: string | null;
  logs: ReturnType<typeof compactLog>[];
  user: ReportUser | null;
  url?: string;
  page?: string;
  ua?: string;
  t: number;
}): string {
  const logRows = logs
    .map((l) => {
      const meta = l.meta ? `<pre class="meta">${esc(JSON.stringify(l.meta, null, 2))}</pre>` : "";
      const stack = l.stack ? `<pre class="stack">${esc(l.stack)}</pre>` : "";
      return `<tr class="level-${esc(l.level)}"><td class="time">${esc(
        l.t ? new Date(l.t).toLocaleString("pt-BR") : ""
      )}</td><td class="ctx">${esc(l.context)}</td><td>${esc(l.message)}${meta}${stack}</td></tr>`;
    })
    .join("\n");

  const permissions = activePermissions(user);
  const permissionsHtml = !user
    ? "-"
    : permissions.length
    ? permissions.map((p) => `<span class="perm">${esc(p)}</span>`).join("")
    : "<span class='muted'>Sem permissões especiais</span>";

  const screenshotBlock = screenshot
    ? `<div class="shot"><img src="${screenshot}" alt="Print da tela" /></div>`
    : virtualization
    ? `<div class="virt">${virtualization}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório de erro — Teleprompt</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; background: #fafafa; color: #18181b; }
  .wrap { max-width: 900px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #71717a; font-size: 13px; margin-bottom: 20px; }
  .card { background: #fff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
  .card h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #71717a; margin: 0 0 10px; }
  .desc { white-space: pre-wrap; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #f0f0f2; vertical-align: top; }
  th { color: #71717a; font-size: 11px; text-transform: uppercase; }
  td.time { white-space: nowrap; color: #71717a; }
  td.ctx { font-weight: 700; white-space: nowrap; }
  pre { margin: 6px 0 0; padding: 8px; background: #f4f4f5; border-radius: 6px; font-size: 11px; overflow-x: auto; }
  pre.stack { background: #fef2f2; color: #b91c1c; }
  pre.meta { background: #eff6ff; color: #1d4ed8; }
  .muted { color: #71717a; font-size: 13px; }
  .kv { display: grid; grid-template-columns: 180px 1fr; gap: 6px 12px; font-size: 13px; }
  .kv b { color: #71717a; font-weight: 600; }
  .perm { display: inline-block; margin: 2px 6px 2px 0; padding: 2px 8px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .shot img { max-width: 100%; border: 1px solid #e4e4e7; border-radius: 8px; }
  .virt-block { margin-bottom: 14px; }
  .virt-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #71717a; margin: 0 0 6px; }
  .virt-block pre { white-space: pre-wrap; word-break: break-word; max-height: 280px; overflow: auto; }
  .virt-block ul { margin: 0; padding-left: 18px; }
  .virt-block li { margin-bottom: 3px; word-break: break-word; }
  .level-error td { background: #fef2f2; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Relatório de erro — Teleprompt</h1>
    <p class="sub">Gerado em ${new Date(t).toLocaleString("pt-BR")}</p>

    <div class="card">
      <h2>Descrição do problema</h2>
      <p class="desc">${esc(description) || "<span class='muted'>Nenhuma descrição fornecida.</span>"}</p>
    </div>

    <div class="card">
      <h2>Contexto</h2>
      <div class="kv">
        <b>Usuário</b><span>${esc(user?.name)}${user?.email ? ` (${esc(user.email)})` : ""}</span>
        <b>Papel</b><span>${esc(user?.role)}</span>
        <b>Permissões</b><span>${permissionsHtml}</span>
        <b>Workspace</b><span>${esc(user?.workspaceId)}</span>
        <b>Página</b><span>${esc(page)}</span>
        <b>URL</b><span>${esc(url)}</span>
        <b>Navegador</b><span>${esc(ua)}</span>
      </div>
    </div>

    ${screenshot || virtualization ? `<div class="card"><h2>Print da tela</h2>${screenshotBlock}</div>` : ""}

    <div class="card">
      <h2>Últimos logs (${logs.length})</h2>
      <table>
        <thead><tr><th>Horário</th><th>Contexto</th><th>Mensagem</th></tr></thead>
        <tbody>
          ${logRows}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}

export function ErrorReportDialog({
  open,
  onOpenChange,
  screenshotCanvas,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenshotCanvas: HTMLCanvasElement | null;
}) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async () => {
    if (sending) return;
    setSending(true);
    try {
      const t = Date.now();
      const label = timestampLabel(new Date(t));

      const screenshot = screenshotCanvas ? await makeScreenshot(screenshotCanvas) : null;
      const screenshotDataUrl = screenshot?.dataUrl ?? null;
      if (screenshot?.pngBlob) {
        downloadBlob(`print-erro-teleprompt-${label}.png`, screenshot.pngBlob);
      }
      const virtualization = screenshotDataUrl ? null : buildScreenVirtualization();

      const logs = getRecentLogs(60).map(compactLog);
      const logsJson = JSON.stringify(getRecentLogs(60));
      const url = typeof window !== "undefined" ? window.location.href : undefined;
      const page = typeof window !== "undefined" ? window.location.pathname : undefined;
      const ua = typeof window !== "undefined" ? window.navigator.userAgent : undefined;

      const reportHtml = buildReportHtml({
        description,
        screenshot: screenshotDataUrl,
        virtualization,
        logs,
        user,
        url,
        page,
        ua,
        t,
      });
      downloadHtml(`relatorio-erro-teleprompt-${label}.html`, reportHtml);

      setDescription("");
      onOpenChange(false);
      toast.success("Arquivos baixados! Envie o print e o relatório por e-mail, Teams ou WhatsApp.");
      try {
        await createErrorReport({
          screenshotUrl: screenshotDataUrl ?? undefined,
          description: description.trim(),
          logsJson,
        });
      } catch {
        // O download já garante o envio manual; o back-end é apenas best-effort.
      }
    } catch {
      toast.error("Não foi possível gerar o relatório. Tente novamente.");
    } finally {
      setSending(false);
    }
  }, [description, sending, user, onOpenChange, screenshotCanvas]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 border-none rounded-2xl p-8 shadow-[0_0_100px_rgba(0,0,0,0.3)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Bug className="w-5 h-5 text-amber-500" /> Reportar problema
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 pt-2 leading-relaxed">
            Descreva o que aconteceu (opcional). Ao baixar, capturamos um print da tela (ou, se não for
            possível, uma descrição estruturada da tela) e os últimos logs do sistema em arquivos para você
            enviar por e-mail, Teams ou WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: Ao clicar em salvar, a tela travou..."
          className="min-h-[120px] text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded p-4"
        />
        <DialogFooter className="sm:justify-between pt-2">
          <span className="text-[10px] text-zinc-400 font-medium self-center">
            Print da tela (PNG, se capturável) + relatório com os últimos 60 logs (HTML) serão baixados.
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-widest px-6 rounded"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              {sending ? "Gerando..." : "Baixar relatório"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ErrorReportButton() {
  const [open, setOpen] = useState(false);
  const [screenshotCanvas, setScreenshotCanvas] = useState<HTMLCanvasElement | null>(null);

  const handleOpen = useCallback(async () => {
    setScreenshotCanvas(await captureScreenshot());
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    if (!next) setScreenshotCanvas(null);
    setOpen(next);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleOpen}
        aria-label="Reportar erro"
        title="Reportar erro"
        className="fixed bottom-5 right-5 z-[200] h-11 w-11 rounded-full shadow-2xl border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 backdrop-blur text-amber-600 hover:text-amber-700 hover:scale-105 transition-all"
      >
        <Bug className="w-5 h-5" />
      </Button>
      <ErrorReportDialog open={open} onOpenChange={handleOpenChange} screenshotCanvas={screenshotCanvas} />
    </>
  );
}
