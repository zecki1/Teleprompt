"use client";

import { api } from "./client";
import type { DebugLogDto, ErrorReportDto } from "./types";

export interface WriteLogRequest {
  level: string;
  source: string;
  message: string;
  metadataJson?: string;
}

export interface CreateErrorReportRequest {
  screenshotUrl?: string;
  description?: string;
  logsJson?: string;
}

export function listDebugLogs(limit = 100): Promise<DebugLogDto[]> {
  return api.get<DebugLogDto[]>(`/api/v1/admin/debug-logs?limit=${limit}`);
}

export function writeDebugLog(input: WriteLogRequest): Promise<void> {
  return api.post<void>("/api/v1/admin/debug-logs", input);
}

export function listErrorReports(): Promise<ErrorReportDto[]> {
  return api.get<ErrorReportDto[]>("/api/v1/admin/error-reports");
}

export function createErrorReport(input: CreateErrorReportRequest): Promise<ErrorReportDto> {
  return api.post<ErrorReportDto>("/api/v1/admin/error-reports", input);
}

export function deleteErrorReport(id: string): Promise<void> {
  return api.del<void>(`/api/v1/admin/error-reports/${id}`);
}
