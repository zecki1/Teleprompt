import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL, API_PREFIX } from '../config';
import { DemoDataService } from './demo-data.service';
import type { ActivityDto, ApiMessage, UserDto } from './types';

@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly demo = inject(DemoDataService);

  list(page = 1, pageSize = 100): Promise<ActivityDto[]> {
    if (this.demo.isDemo) return this.demo.activities();
    return firstValueFrom(
      this.http.get<ActivityDto[]>(`${this.baseUrl}${API_PREFIX}/activities`, {
        params: { page, pageSize },
      }),
    );
  }
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly demo = inject(DemoDataService);

  updateMe(input: { displayName?: string; avatarUrl?: string }): Promise<ApiMessage | UserDto> {
    return firstValueFrom(
      this.http.put<ApiMessage>(`${this.baseUrl}${API_PREFIX}/users/me`, input),
    );
  }

  me(): Promise<UserDto> {
    return firstValueFrom(
      this.http.get<UserDto>(`${this.baseUrl}${API_PREFIX}/auth/me`),
    );
  }

  list(): Promise<UserDto[]> {
    if (this.demo.isDemo) return this.demo.users();
    return firstValueFrom(
      this.http.get<UserDto[]>(`${this.baseUrl}${API_PREFIX}/users`),
    );
  }
}
