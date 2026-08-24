import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ellipsis', standalone: true })
export class EllipsisPipe implements PipeTransform {
  transform(value: string, maxLength: number = 100): string {
    if (!value) return '';
    return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
  }
}
