import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../services/api.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private apiService: ApiService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status >= 500) {
          this.reportError(error);
        }
        return throwError(() => error);
      })
    );
  }

  private reportError(error: HttpErrorResponse): void {
    const logs = this.getRecentLogs();
    this.apiService.createErrorReport(
      undefined,
      `HTTP ${error.status}: ${error.message}`,
      JSON.stringify(logs)
    ).subscribe({
      error: () => console.error('Failed to report error to server')
    });
  }

  private getRecentLogs(): string[] {
    const logs: string[] = [];
    if (typeof window !== 'undefined' && (window as any).__TELEPROMPT_LOGS__) {
      logs.push(...(window as any).__TELEPROMPT_LOGS__.slice(-20));
    }
    return logs;
  }
}
