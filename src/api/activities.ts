"use client";

import { api } from "./client";
import type { ActivityDto } from "./types";

export interface ActivityQuery {
  page?: number;
  pageSize?: number;
}

export function listActivities(params: ActivityQuery = {}): Promise<ActivityDto[]> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const qs = query.toString();
  return api.get<ActivityDto[]>(`/api/v1/activities${qs ? `?${qs}` : ""}`);
}
