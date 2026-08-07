import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { OrderStatus } from '../../core/orders/orders-api.service';

/** Flow after PREPARING was removed: received → shipped → delivered. */
const STEPS: OrderStatus[] = ['RECEIVED', 'SHIPPED', 'DELIVERED'];

const LABELS: Record<string, string> = {
  RECEIVED: 'مستلم',
  SHIPPED: 'شحن',
  DELIVERED: 'تسليم',
  RETURNED: 'مرتجع',
};

@Component({
  selector: 'app-order-stepper',
  template: `
    <ol
      class="stepper"
      dir="rtl"
      [style.--step-count]="steps.length"
      [attr.aria-label]="'حالة الطلب: ' + (labels[status()] || status())"
    >
      @for (step of steps; track step; let i = $index) {
        <li
          [class.done]="i <= activeIndex()"
          [class.current]="i === activeIndex()"
        >
          <span class="dot" aria-hidden="true"></span>
          <span class="label">{{ labels[step] }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    .stepper {
      --step-count: 3;
      list-style: none;
      margin: 0;
      padding: 0.5rem 0 0.25rem;
      display: grid;
      grid-template-columns: repeat(var(--step-count), minmax(0, 1fr));
      gap: 0.25rem;
      position: relative;
      isolation: isolate;
    }
    /* Track centered on first/last dots: half of one column on each side. */
    .stepper::before {
      content: '';
      position: absolute;
      top: 1.05rem;
      inset-inline: calc(100% / (var(--step-count) * 2));
      height: 2px;
      background: var(--border, #e2e8f0);
      z-index: 0;
    }
    li {
      position: relative;
      z-index: 1;
      display: grid;
      justify-items: center;
      gap: 0.35rem;
      text-align: center;
    }
    .dot {
      width: 0.85rem;
      height: 0.85rem;
      border-radius: 50%;
      background: var(--ink-soft, #cbd5e1);
      border: 2px solid var(--surface, #fff);
      box-shadow: 0 0 0 2px var(--border, #e2e8f0);
    }
    .label {
      font-size: 0.68rem;
      color: var(--ink-soft, #94a3b8);
      font-weight: 600;
    }
    li.done .dot {
      background: var(--accent, #10b880);
      box-shadow: 0 0 0 2px
        color-mix(in srgb, var(--accent, #10b880) 35%, transparent);
    }
    li.done .label {
      color: var(--chip-ok-ink, #0b7a55);
    }
    li.current .dot {
      transform: scale(1.25);
      box-shadow: 0 0 0 4px
        color-mix(in srgb, var(--accent, #10b880) 28%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStepper {
  readonly status = input.required<OrderStatus>();
  protected readonly steps = STEPS;
  protected readonly labels = LABELS;

  protected readonly activeIndex = computed(() => {
    const status = this.status();
    if (status === 'RETURNED') return STEPS.length - 1;
    // Legacy PREPARING (if any client still sends it) maps to RECEIVED.
    if ((status as string) === 'PREPARING') return 0;
    const idx = STEPS.indexOf(status);
    return idx < 0 ? 0 : idx;
  });
}
