import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IngestionService {
  constructor(private http: HttpClient) {}
  ingest(source: string, items: any[]) {
    return this.http.post(`${environment.integrationHubUrl || 'http://localhost:5000'}/sync`, { source, items });
  }
  ingestBackend(payload: any) {
    return this.http.post(`${environment.apiUrl || 'http://localhost:4000'}/api/ingestion`, payload);
  }
}