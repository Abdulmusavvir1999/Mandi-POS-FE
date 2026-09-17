import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DraftBillService } from '../../core/services/draft-bill.service';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import { DraftBill, Product } from '../../core/models';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-draft-bills',
  standalone: true,
  imports: [CommonModule, AppCurrencyPipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-[#2E1065]">Draft & Held Bills</h1>
          <p class="text-sm text-[#6B7280]">Manage carts temporarily put on hold by cashiers</p>
        </div>
        <button (click)="loadDrafts()" class="btn btn-secondary btn-sm">
          <span>🔄 Refresh</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div *ngIf="drafts.length === 0" class="col-span-full text-center py-16 text-[#6B7280]">
          <span class="material-symbols-outlined text-4xl mb-2 block">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'receipt_long' }}</span>
          <p class="text-sm">{{ isLoading ? 'Loading draft bills…' : loadError ? loadError : 'No draft bills currently on hold.' }}</p>
        </div>

        <div
          *ngFor="let draft of drafts"
          class="card p-5 rounded-2xl border border-[#E9D5FF] bg-white flex flex-col justify-between shadow-sm"
        >
          <div class="pb-3 border-b border-[#E9D5FF] flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-[#7E22CE] font-mono">{{ draft.draft_number }}</span>
                <span class="badge badge-info text-[9px] py-0 px-1.5">{{ draft.order_type }}</span>
              </div>
              <div class="text-[11px] text-[#6B7280] mt-1">
                Held at {{ draft.created_at | date:'dd/MM/yyyy HH:mm' }} by {{ draft.created_by_name }}
              </div>
            </div>
            <span class="badge badge-warning text-[10px]">On Hold</span>
          </div>

          <div class="py-3 text-xs text-[#2E1065] space-y-1">
            <div *ngIf="draft.customer_name" class="flex items-center gap-1 font-semibold">
              <span class="text-[#6B7280]">👤 Customer:</span>
              <span class="text-[#2E1065]">{{ draft.customer_name }}</span>
            </div>
            <div *ngIf="draft.dining_table_id" class="flex items-center gap-1 font-semibold text-[#7E22CE]">
              <span>🍽 Table:</span>
              <span>{{ draft.table_number }}</span>
            </div>
            <div class="flex items-center justify-between text-[#6B7280] pt-1">
              <span>{{ draft.item_count }} Dish(es)</span>
              <span class="font-mono font-black text-[#2E1065] text-sm">
                {{ draft.subtotal | appCurrency:'1.0-0' }}
              </span>
            </div>
          </div>

          <div class="pt-3 border-t border-[#E9D5FF] flex items-center justify-end gap-2">
            <button (click)="deleteDraft(draft.id)" class="btn btn-ghost btn-sm text-[#DC2626] hover:bg-[#DC2626]/10">
              Delete
            </button>
            <button (click)="resumeDraft(draft.id)" class="btn btn-primary btn-sm px-4">
              Resume to POS ⚡
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DraftBillsComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  private draftService = inject(DraftBillService);
  private cartService = inject(CartService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  public drafts: DraftBill[] = [];
  public products: Product[] = [];

  ngOnInit(): void {
    this.loadDrafts();
    this.productService.getProducts(1, 100).subscribe({
      next: (res) => {
        if (res.success) this.products = res.data;
      },
    });
  }

  loadDrafts(): void {
    this.isLoading = true;
    this.loadError = null;
    this.draftService.getDrafts().subscribe({
      next: (res) => {
          this.isLoading = false;
        if (res.success) this.drafts = res.data;
      },
        error: (err) => {
          this.isLoading = false;
          this.loadError = err?.error?.message || 'Unable to load data from the server.';
        },
      });
  }

  resumeDraft(id: number): void {
    this.draftService.resumeDraft(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.cartService.restoreFromDraft(res.data, this.products);
          this.notify.success(`Draft ${res.data.draft_number} resumed`);
          this.router.navigate(['/pos']);
        }
      },
    });
  }

  deleteDraft(id: number): void {
    this.notify.confirm({
      title: 'Delete Draft Bill',
      message: 'Are you sure you want to delete this held bill?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.draftService.deleteDraft(id).subscribe({
          next: () => {
            this.notify.info('Draft deleted');
            this.loadDrafts();
          },
        });
      },
    });
  }
}
