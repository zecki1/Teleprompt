import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '@core/services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" *ngIf="loadingService.isVisible()">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>{{ loadingService.message() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; justify-content: center;
      align-items: center; z-index: 9999;
    }
    .loading-spinner { text-align: center; }
    .spinner {
      width: 40px; height: 40px; border: 4px solid #333;
      border-top-color: #e94560; border-radius: 50%;
      animation: spin 1s linear infinite; margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { color: #ccc; }
  `]
})
export class LoadingComponent {
  loadingService = inject(LoadingService);
}
