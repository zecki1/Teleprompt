import { Component, model } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    @if (open()) {
      <div class="modal-overlay" (click)="overlayClick($event)">
        <div class="modal-card" [style.max-width]="width()">
          <div class="modal-header">
            <h3>{{ title() }}</h3>
            <button type="button" class="icon-btn" aria-label="Fechar" (click)="open.set(false)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.5" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <ng-content />
          </div>
          <div class="modal-footer">
            <ng-content select="[footer]" />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  readonly open = model(false);
  readonly title = model('');
  readonly width = model('27.5rem');

  protected overlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.open.set(false);
    }
  }
}
