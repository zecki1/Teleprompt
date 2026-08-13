"use client";

import { api } from "./client";
import type { ReportsSummary } from "./types";

export function getReports(workspaceId?: string): Promise<ReportsSummary> {
  const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  return api.get<ReportsSummary>(`/api/v1/reports${query}`);
}
