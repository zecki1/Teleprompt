import { Directive, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({ selector: '[appDebounceClick]', standalone: true })
export class DebounceClickDirective {
  @Output() debounceClick = new EventEmitter<void>();
  private timeout: ReturnType<typeof setTimeout> | null = null;

  @HostListener('click')
  onClick(): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.debounceClick.emit(), 300);
  }
}
