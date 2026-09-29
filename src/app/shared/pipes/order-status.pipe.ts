import { Pipe, PipeTransform } from '@angular/core';

/**
 * The one wording for an order's status across the app.
 *
 * Orders have two working stages: Processing (sent to the kitchen, not yet
 * billed) and Completed. PENDING is no longer produced - there is no separate
 * "new" stage - so an old PENDING order reads as Processing too.
 * Anything else (a timeline step such as "KOT 2") is passed through as is.
 */
export function orderStatusLabel(status?: string | null): string {
  switch ((status || '').toUpperCase()) {
    case 'PENDING':
    case 'IN_PROGRESS':
      return 'Processing';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case '':
      return '—';
    default:
      return String(status);
  }
}

@Pipe({ name: 'orderStatus', standalone: true })
export class OrderStatusPipe implements PipeTransform {
  transform(status?: string | null): string {
    return orderStatusLabel(status);
  }
}
