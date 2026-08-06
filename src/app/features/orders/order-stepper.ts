import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { OrderStatus } from '../../core/orders/orders-api.service';

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
    <ol class="stepper" dir="rtl">
      @for (step of steps; track step; let i = $index) {
        <li [class.done]="i <= activeIndex()" [class.current]="i === activeIndex()">
          <span class="dot"></span>
          <span class="label">{{ labels[step] }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    .stepper {
      list-style: none;
      margin: 0;
      padding: 0.5rem 0 0.25rem;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.25rem;
      position: relative;
    }
    .stepper::before {
      content: '';
      position: absolute;
      top: 1.05rem;
      inset-inline: 12%;
      height: 2px;
      background: #e2e8f0;
    }
    li {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 0.35rem;
      text-align: center;
    }
    .dot {
      width: 0.85rem;
      height: 0.85rem;
      border-radius: 50%;
      background: #cbd5e1;
      border: 2px solid #fff;
      box-shadow: 0 0 0 2px #e2e8f0;
      z-index: 1;
    }
    .label {
      font-size: 0.68rem;
      color: #94a3b8;
      font-weight: 600;
    }
    li.done .dot {
      background: #10b880;
      box-shadow: 0 0 0 2px #a7f3d4;
    }
    li.done .label {
      color: #0b7a55;
    }
    li.current .dot {
      transform: scale(1.25);
      box-shadow: 0 0 0 4px rgba(16, 184, 128, 0.25);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStepper {
  readonly status = input.required<OrderStatus>();
  protected readonly steps = STEPS;
  protected readonly labels = LABELS;

  protected activeIndex(): number {
    if (this.status() === 'RETURNED') return STEPS.length - 1;
    const idx = STEPS.indexOf(this.status());
    return idx < 0 ? 0 : idx;
  }
}
