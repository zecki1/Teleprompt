import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({ selector: '[appAutoFocus]', standalone: true })
export class AutoFocusDirective {
  @Input() appAutoFocus = true;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    if (this.appAutoFocus) {
      this.el.nativeElement.focus();
    }
  }
}
