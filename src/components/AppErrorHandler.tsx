"use client";

import { useEffect } from "react";
import { initGlobalErrorCapture } from "@/lib/debug-log";
import { ErrorReportButton } from "@/components/tp/ErrorReporter";

/**
 * Inicializa a captura global de erros de runtime e monta o botão flutuante
 * de relatório de erro (print da tela + últimos logs).
 */
export function AppErrorHandler() {
  useEffect(() => {
    initGlobalErrorCapture();
  }, []);

  return <ErrorReportButton />;
}
