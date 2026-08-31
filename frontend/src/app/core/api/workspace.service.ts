import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL, API_PREFIX } from '../config';
import { DemoDataService } from './demo-data.service';
import type { ApiMessage, WorkspaceDto } from './types';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly demo = inject(DemoDataService);

  private url(path = ''): string {
    return `${this.baseUrl}${API_PREFIX}/workspaces${path}`;
  }

  async mine(): Promise<WorkspaceDto[]> {
    if (this.demo.isDemo) return this.demo.workspaces();
    return firstValueFrom(this.http.get<WorkspaceDto[]>(this.url('/mine')));
  }

  create(name: string): Promise<WorkspaceDto> {
    return firstValueFrom(
      this.http.post<WorkspaceDto>(this.url(), { name }),
    );
  }

  remove(id: string): Promise<ApiMessage | void> {
    return firstValueFrom(this.http.delete<ApiMessage>(this.url(`/${id}`)))
      .catch(() => undefined);
  }
}
