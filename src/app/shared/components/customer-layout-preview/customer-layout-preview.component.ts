import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerDesignKey } from '../../../core/services/customer-layout.service';
import { CUSTOMER_LAYOUT_CSS } from '../../styles/customer-layout.styles';

export interface PreviewCustomerItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  tier: string;
  tierColor: string;
  tierBg: string;
  total_visits: number;
  total_spent: number;
  initials: string;
}

@Component({
  selector: 'app-customer-layout-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="customer-stage"
      [ngClass]="'customer-layout-' + layoutKey"
      [ngStyle]="cssVars"
      aria-label="Live Customer Layout Preview"
    >
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 1: EXECUTIVE VIP CARDS                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'vipcard'" class="cust-vip-grid">
        <div *ngFor="let c of sampleCustomers" class="cust-vip-card">
          <div class="cust-vip-header">
            <div class="cust-vip-avatar-wrap">
              <div class="cust-vip-avatar">
                <span>{{ c.initials }}</span>
              </div>
              <span class="cust-vip-online" title="Active Account"></span>
            </div>
            <span class="cust-vip-badge" [style.background]="c.tierBg" [style.color]="c.tierColor">
              <span class="material-symbols-outlined" style="font-size: 13px;">diamond</span>
              {{ c.tier }}
            </span>
          </div>

          <div class="cust-vip-body">
            <h4 class="cust-vip-name">{{ c.name }}</h4>
            <div class="cust-vip-locality">
              <span class="material-symbols-outlined">location_on</span>
              <span>{{ c.address }}</span>
            </div>

            <div class="cust-vip-chips-row">
              <span class="cust-vip-chip">
                <span class="material-symbols-outlined" style="font-size: 13px;">call</span>
                {{ c.phone }}
              </span>
              <span class="cust-vip-chip">
                <span class="material-symbols-outlined" style="font-size: 13px;">mail</span>
                {{ c.email }}
              </span>
            </div>

            <div class="cust-vip-stats-bar">
              <div class="cust-vip-stat-item">
                <span class="cust-vip-stat-label">Visits</span>
                <span class="cust-vip-stat-val">{{ c.total_visits }}</span>
              </div>
              <div class="cust-vip-stat-item" style="text-align: right;">
                <span class="cust-vip-stat-label">Total Spent</span>
                <span class="cust-vip-stat-val is-spend">₹{{ c.total_spent | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <div class="cust-vip-actions">
            <div class="text-[11px] font-mono font-bold text-purple-700">
              ID #CUST-00{{ c.id }}
            </div>
            <div class="cust-vip-btn-group">
              <button type="button" class="cust-act is-vip" title="View Invoices">
                <span class="material-symbols-outlined">receipt_long</span>
              </button>
              <button type="button" class="cust-act is-vip" title="Edit Customer">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button type="button" class="cust-act is-vip is-delete" title="Delete Customer">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 2: MINIMALIST CLEAN TABLE                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'clean'" class="cust-clean-table-wrap">
        <table class="cust-clean-table">
          <thead>
            <tr>
              <th style="width: 50px;">ID</th>
              <th style="width: 30%;">Guest & Locality</th>
              <th style="width: 22%;">Contact Phone</th>
              <th style="width: 14%;">Tier</th>
              <th style="width: 12%;">Visits</th>
              <th style="width: 14%;">Gross Spent</th>
              <th style="width: 80px; text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of sampleCustomers">
              <td>
                <span class="font-mono text-xs text-slate-400">#0{{ c.id }}</span>
              </td>
              <td>
                <div class="cust-clean-name">{{ c.name }}</div>
                <div class="cust-clean-locality">{{ c.address }}</div>
              </td>
              <td>
                <span class="cust-clean-phone">{{ c.phone }}</span>
              </td>
              <td>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" [style.background]="c.tierBg" [style.color]="c.tierColor">
                  {{ c.tier }}
                </span>
              </td>
              <td>
                <span class="font-mono font-bold text-xs">{{ c.total_visits }} visits</span>
              </td>
              <td>
                <span class="cust-clean-spend">₹{{ c.total_spent | number:'1.0-0' }}</span>
              </td>
              <td style="text-align: center;">
                <div class="cust-clean-actions">
                  <button type="button" class="cust-act is-clean" title="View Invoices">
                    <span class="material-symbols-outlined">receipt_long</span>
                  </button>
                  <button type="button" class="cust-act is-clean" title="Edit Customer">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button type="button" class="cust-act is-clean is-delete" title="Delete Customer">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 3: COMPACT CRM TILES                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'compact'" class="cust-compact-grid">
        <div *ngFor="let c of sampleCustomers" class="cust-compact-tile">
          <div class="cust-compact-top">
            <div class="cust-compact-avatar">{{ c.initials }}</div>
            <div class="min-w-0 flex-1">
              <h5 class="cust-compact-title">{{ c.name }}</h5>
              <div class="cust-compact-phone">{{ c.phone }}</div>
            </div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded" [style.background]="c.tierBg" [style.color]="c.tierColor">
              {{ c.tier }}
            </span>
          </div>

          <div class="cust-compact-bottom">
            <span class="text-[11px] text-slate-500">{{ c.total_visits }} visits</span>
            <span class="cust-compact-spent">₹{{ c.total_spent | number:'1.0-0' }}</span>
            <div class="cust-compact-actions">
              <button type="button" class="cust-act is-compact" title="Invoices">
                <span class="material-symbols-outlined">receipt_long</span>
              </button>
              <button type="button" class="cust-act is-compact" title="Edit">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button type="button" class="cust-act is-compact is-delete" title="Delete">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 4: LIST VIEW (ENTERPRISE TABULAR)                       -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'list'" class="cust-list-table-wrap">
        <table class="cust-list-table">
          <thead>
            <tr>
              <th style="width: 36px; text-align: center;">
                <input type="checkbox" checked class="rounded" />
              </th>
              <th style="width: 28%;">Guest & Locality</th>
              <th style="width: 20%;">Email</th>
              <th style="width: 16%;">Phone</th>
              <th style="width: 12%;">Status</th>
              <th style="width: 10%;">Visits</th>
              <th style="width: 14%;">Total Spent</th>
              <th style="width: 80px; text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of sampleCustomers">
              <td style="text-align: center;">
                <input type="checkbox" class="rounded" />
              </td>
              <td>
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                    {{ c.initials }}
                  </div>
                  <div>
                    <div class="font-bold text-xs text-slate-900">{{ c.name }}</div>
                    <div class="text-[11px] text-slate-500">{{ c.address }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="text-xs text-slate-500 font-mono">{{ c.email }}</span>
              </td>
              <td>
                <span class="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {{ c.phone }}
                </span>
              </td>
              <td>
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Active
                </span>
              </td>
              <td>
                <span class="font-mono text-xs font-bold text-slate-700">{{ c.total_visits }}</span>
              </td>
              <td>
                <span class="font-mono text-xs font-black text-green-700">₹{{ c.total_spent | number:'1.0-0' }}</span>
              </td>
              <td style="text-align: center;">
                <div class="cust-list-actions">
                  <button type="button" class="cust-act is-list" title="View Invoices">
                    <span class="material-symbols-outlined">receipt_long</span>
                  </button>
                  <button type="button" class="cust-act is-list" title="Edit Customer">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button type="button" class="cust-act is-list is-delete" title="Delete Customer">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 5: CARD VIEW (GUEST PROFILE CARDS)                      -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'card'" class="cust-card-grid">
        <div *ngFor="let c of sampleCustomers" class="cust-profile-card">
          <div class="cust-profile-cover">
            <div class="cust-profile-avatar-pos">
              <div class="cust-profile-avatar">{{ c.initials }}</div>
            </div>
            <span class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black" [style.background]="c.tierBg" [style.color]="c.tierColor">
              {{ c.tier }}
            </span>
          </div>

          <div class="cust-profile-card-content">
            <h4 class="cust-profile-name">{{ c.name }}</h4>
            <div class="cust-profile-loc">{{ c.address }}</div>

            <div class="cust-profile-stats-row">
              <div>
                <span class="text-[10px] text-slate-400 block font-bold uppercase">Visits</span>
                <span class="font-mono font-bold text-xs">{{ c.total_visits }} visits</span>
              </div>
              <div style="text-align: right;">
                <span class="text-[10px] text-slate-400 block font-bold uppercase">Gross Spent</span>
                <span class="font-mono font-black text-xs text-green-700">₹{{ c.total_spent | number:'1.0-0' }}</span>
              </div>
            </div>

            <div class="text-xs font-mono text-slate-600 truncate mb-1">
              📞 {{ c.phone }}
            </div>
          </div>

          <div class="cust-profile-card-footer">
            <span class="text-[11px] font-mono text-purple-700 font-bold">#CUST-{{ c.id }}</span>
            <div class="cust-card-actions">
              <button type="button" class="cust-act is-card" title="Invoices">
                <span class="material-symbols-outlined">receipt_long</span>
              </button>
              <button type="button" class="cust-act is-card" title="Edit">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button type="button" class="cust-act is-card is-delete" title="Delete">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [CUSTOMER_LAYOUT_CSS],
})
export class CustomerLayoutPreviewComponent {
  @Input() layoutKey: CustomerDesignKey = 'vipcard';
  @Input() cssVars: Record<string, string> = {};

  public readonly sampleCustomers: PreviewCustomerItem[] = [
    {
      id: 1,
      name: 'Sarah Jenkins',
      phone: '+91 98765 43210',
      email: 'sarah.j@example.com',
      address: 'Downtown Residency, Apt 4B',
      tier: 'VIP Gold',
      tierColor: '#B45309',
      tierBg: '#FEF3C7',
      total_visits: 28,
      total_spent: 34500,
      initials: 'SJ',
    },
    {
      id: 2,
      name: 'Rajesh Mehta',
      phone: '+91 98112 34567',
      email: 'rajesh.m@example.com',
      address: 'West Avenue, Villa 12',
      tier: 'VIP Silver',
      tierColor: '#475569',
      tierBg: '#F1F5F9',
      total_visits: 14,
      total_spent: 18250,
      initials: 'RM',
    },
    {
      id: 3,
      name: 'Elena Rostova',
      phone: '+91 99220 11223',
      email: 'elena.r@example.com',
      address: 'Green Valley, Phase 2',
      tier: 'Regular',
      tierColor: '#0F766E',
      tierBg: '#CCFBF1',
      total_visits: 6,
      total_spent: 6400,
      initials: 'ER',
    },
    {
      id: 4,
      name: 'Arjun Patel',
      phone: '+91 97334 55667',
      email: 'arjun.p@example.com',
      address: 'Skyline Towers, Flat 901',
      tier: 'New Guest',
      tierColor: '#6B7280',
      tierBg: '#F3F4F6',
      total_visits: 2,
      total_spent: 1950,
      initials: 'AP',
    },
  ];
}
