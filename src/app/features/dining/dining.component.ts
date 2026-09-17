import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DiningService } from '../../core/services/dining.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { DiningTable, TableStatus } from '../../core/models';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';

/** Six ticks of fifteen minutes — the ninety-minute turn the floor is run to. */
const DwellRail = {
  TICKS: 6,
  MINUTES_PER_TICK: 15,
} as const;

import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
@Component({
  selector: 'app-dining',
  standalone: true,
  imports: [PageLoaderComponent, CommonModule, FormsModule, AppCurrencyPipe, CustomDropdownComponent],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading dining floor…"
        subMessage="Fetching table layout and status from the server."
        icon="table_restaurant"
        (retry)="loadTables()"
      ></app-page-loader>
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Floor Operations</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Dining & Seating Map</span>
      </div>

      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">table_restaurant</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Dining & Floor Seating Map</h1>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">deck</span>
                <span>Sections: <strong>{{ sections.length }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">table_bar</span>
                <span>Tables: <strong>{{ tables.length }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">groups</span>
                <span>Covers: <strong>{{ totalSeats }}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadTables()"
            [disabled]="isLoading"
            class="action-btn btn-outline-purple"
            title="Refresh the floor map from the server"
          >
            <span class="material-symbols-outlined" [class.spin-icon]="isLoading">refresh</span>
            <span>Refresh</span>
          </button>

          <button type="button" (click)="openAddTableModal()" class="action-btn btn-gradient-purple">
            <span class="material-symbols-outlined">add_circle</span>
            <span>Add Table</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. LIVE OCCUPANCY KPI STRIP                                     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Tables</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">table_bar</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ tables.length }}</span>
            <span class="kpi-pill pill-purple">{{ sections.length }} Sections</span>
          </div>
        </div>

        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Free Now</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">event_available</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ countStatus('AVAILABLE') }}</span>
            <span class="kpi-pill pill-live">● Live</span>
          </div>
        </div>

        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Occupied</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">restaurant</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ countStatus('OCCUPIED') }}</span>
            <span class="kpi-pill pill-amber">Dining</span>
          </div>
        </div>

        <div class="kpi-card card-accent-rose">
          <div class="kpi-header-row">
            <span class="kpi-title">Out of Service</span>
            <span class="kpi-icon-bubble bg-rose-tint">
              <span class="material-symbols-outlined">block</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ countStatus('UNAVAILABLE') }}</span>
            <span class="kpi-pill pill-rose">Blocked</span>
          </div>
        </div>

        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Seating Capacity</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">groups</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ totalSeats }}</span>
            <span class="kpi-pill pill-blue">{{ seatsOccupied }} Seated</span>
          </div>
        </div>

        <!-- Occupancy is the number a floor manager actually watches, so it -->
        <!-- gets a bar rather than another bare figure.                     -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Floor Occupancy</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">donut_large</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ occupancyRate }}%</span>
          </div>
          <div class="occupancy-track">
            <div class="occupancy-fill" [style.width.%]="occupancyRate"></div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. SECTION FILTER TABS                                          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="module-tabs-bar">
        <button
          type="button"
          (click)="selectSection(null)"
          class="module-tab-btn"
          [class.is-active]="selectedSection === null"
        >
          <span class="material-symbols-outlined">grid_view</span>
          <span>All Sections</span>
          <span class="tab-count-badge">{{ tables.length }}</span>
        </button>

        <button
          type="button"
          *ngFor="let sec of sections"
          (click)="selectSection(sec)"
          class="module-tab-btn"
          [class.is-active]="selectedSection === sec"
        >
          <span class="material-symbols-outlined">deck</span>
          <span>{{ sec }}</span>
          <span class="tab-count-badge">{{ sectionCount(sec) }}</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. VISUAL FLOOR MAP                                             -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="floor-panel">
        <div class="floor-panel-head">
          <div class="flex-align-center gap-2">
            <span class="material-symbols-outlined icon-purple">map</span>
            <div>
              <h3 class="floor-panel-title">
                {{ selectedSection || 'Entire Floor' }}
              </h3>
              <p class="floor-panel-sub">
                {{ filteredTables.length }} table{{ filteredTables.length === 1 ? '' : 's' }} shown · click a free table to start its order
              </p>
            </div>
          </div>

          <!-- Colour key, so the accent on each tile is readable at a glance. -->
          <div class="status-legend">
            <span class="legend-item"><i class="legend-dot dot-free"></i>Free</span>
            <span class="legend-item"><i class="legend-dot dot-busy"></i>Occupied</span>
            <span class="legend-item"><i class="legend-dot dot-blocked"></i>Out of service</span>
          </div>
        </div>

        <!-- Empty / loading / error -->
        <div *ngIf="filteredTables.length === 0" class="empty-state-box floor-empty">
          <span class="material-symbols-outlined empty-icon">
            {{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'table_restaurant' }}
          </span>
          <div class="empty-title">
            {{ isLoading ? 'Loading the floor map…' : loadError ? 'Floor map unavailable' : 'No tables here yet' }}
          </div>
          <p class="empty-desc">
            {{ isLoading
              ? 'Fetching live table occupancy from the POS server.'
              : loadError
                ? loadError
                : selectedSection
                  ? 'No tables belong to this section. Pick another section, or add one here.'
                  : 'Add your first dining table to start seating guests.' }}
          </p>
          <button
            *ngIf="!isLoading && !loadError"
            type="button"
            (click)="openAddTableModal()"
            class="action-btn btn-gradient-purple mt-2"
          >
            <span class="material-symbols-outlined">add_circle</span>
            <span>Add Table</span>
          </button>
          <button
            *ngIf="loadError"
            type="button"
            (click)="loadTables()"
            class="action-btn btn-outline-purple mt-2"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Try Again</span>
          </button>
        </div>

        <div class="floor-grid" *ngIf="filteredTables.length > 0">
          <!-- The whole tile is the tap target - a waiter mid-service should not -->
          <!-- have to hit a small button. Only the gear opts out of that.        -->
          <article
            *ngFor="let table of filteredTables; trackBy: trackByTableId"
            class="table-tile"
            [ngClass]="tileClasses(table)"
            role="button"
            tabindex="0"
            [attr.aria-label]="tileAction(table) + ' — ' + table.table_number + ', ' + table.name"
            (click)="onTileClick(table, $event)"
            (keydown.enter)="onTileClick(table, $event)"
            (keydown.space)="onTileClick(table, $event)"
          >
            <!-- Section owns the top line: colour groups the floor before you -->
            <!-- read a single label. Status keeps its own green/amber/red.     -->
            <header class="tile-head">
              <span class="zone-chip" [title]="table.section">
                <i class="zone-dot"></i>{{ table.section }}
              </span>
              <span class="tile-status" [ngClass]="statusClass(table.status)">
                <i class="status-dot"></i>{{ statusLabel(table.status) }}
              </span>
            </header>

            <!-- Identity + capacity -->
            <div class="tile-id">
              <div class="id-text">
                <span class="tile-number">{{ table.table_number }}</span>
                <span class="tile-name" [title]="table.name">{{ table.name }}</span>
              </div>
              <div class="tile-seats">
                <b>{{ table.capacity }}</b>
                <span>Seats</span>
              </div>
            </div>

            <div class="tile-rule"></div>

            <!-- Seated: the running check is the headline, dwell time under it -->
            <ng-container *ngIf="table.status === 'OCCUPIED'">
              <div class="bill-hero">
                <span class="bill-total">{{ table.order_current_total | appCurrency:'1.2-2' }}</span>
                <span class="bill-ref" *ngIf="table.order_number">{{ table.order_number }}</span>
              </div>

              <!-- Dwell rail: each tick is 15 minutes of a 90-minute turn, so a -->
              <!-- table running long reads from across the room.                -->
              <div class="dwell" *ngIf="minutesSeated(table) !== null">
                <div class="dwell-ticks">
                  <i
                    *ngFor="let lit of dwellTicks(table); trackBy: trackByIndex"
                    [class.on]="lit"
                  ></i>
                </div>
                <div class="dwell-legend">
                  <span>{{ dwellText(table) }} on table</span>
                  <span [class.is-over]="isOverTurn(table)">{{ isOverTurn(table) ? 'Over turn' : 'Seated ' + seatedClock(table) }}</span>
                </div>
              </div>

              <div class="tile-cells">
                <div>
                  <span>On table</span>
                  <b>{{ dwellText(table) || '—' }}</b>
                </div>
                <div>
                  <span>Per seat</span>
                  <b>{{ perSeat(table) | appCurrency:'1.0-0' }}</b>
                </div>
                <div *ngIf="table.customer_name">
                  <span>Guest</span>
                  <b class="plain" [title]="table.customer_name">{{ table.customer_name }}</b>
                </div>
              </div>
            </ng-container>

            <!-- Free -->
            <p *ngIf="table.status === 'AVAILABLE'" class="tile-note">
              Laid and ready · seats up to <b>{{ table.capacity }}</b>
            </p>

            <!-- Out of service -->
            <p *ngIf="table.status === 'UNAVAILABLE'" class="tile-note is-blocked-note">
              <span class="material-symbols-outlined">build</span>
              <span>Blocked — not seatable until it is returned to service.</span>
            </p>

            <!-- Actions -->
            <footer class="tile-actions">
              <span class="tile-go">
                <span class="material-symbols-outlined">{{ tileActionIcon(table) }}</span>
                <span>{{ tileAction(table) }}</span>
                <span class="material-symbols-outlined go-arrow">arrow_forward</span>
              </span>

              <button
                type="button"
                (click)="editTable(table, $event)"
                class="tile-icon-btn"
                title="Edit table"
                aria-label="Edit table"
              >
                <span class="material-symbols-outlined">settings</span>
              </button>
            </footer>
          </article>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. ADD / EDIT TABLE MODAL                                       -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showTableModal">
        <div class="modal-content p-7 md:p-8 w-full max-w-lg shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3.5">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl">{{ editingTableId ? 'edit_square' : 'add_circle' }}</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">
                  {{ editingTableId ? 'Edit Dining Table' : 'Add Dining Table' }}
                </h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">Configure floor layout, seating capacity, and table code</p>
              </div>
            </div>
            <button
              type="button"
              (click)="showTableModal = false"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveTable()" class="space-y-3.5">
            <div class="grid grid-cols-2 gap-3.5 items-start">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                  Table Number / Code
                </label>
                <input
                  title="Table Number / Code"
                  type="text"
                  [(ngModel)]="tableForm.tableNumber"
                  name="tableNumber"
                  class="form-control font-mono text-sm w-full"
                  placeholder="e.g. T-07"
                  required
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                  Display Name
                </label>
                <input
                  title="Display Name"
                  type="text"
                  [(ngModel)]="tableForm.name"
                  name="name"
                  class="form-control text-sm w-full"
                  placeholder="e.g. VIP Majlis 1"
                  required
                />
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Section / Dining Area
              </label>
              <input
                title="Section / Dining Area"
                type="text"
                [(ngModel)]="tableForm.section"
                name="section"
                class="form-control text-sm w-full"
                placeholder="e.g. Main Hall, VIP Section, Outdoor Terrace"
                list="diningSectionOptions"
                required
              />
              <datalist id="diningSectionOptions">
                <option *ngFor="let sec of sections" [value]="sec"></option>
              </datalist>
            </div>

            <div class="grid grid-cols-2 gap-3.5 items-start">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                  Seating Capacity
                </label>
                <input
                  title="Seating Capacity"
                  type="number"
                  min="1"
                  [(ngModel)]="tableForm.capacity"
                  name="capacity"
                  class="form-control font-mono text-sm w-full"
                  placeholder="4"
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1 block">
                  Status
                </label>
                <app-custom-dropdown
                  [options]="tableStatusOptions"
                  [(ngModel)]="tableForm.status"
                  name="status"
                  placeholder="Select Status"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-[#E9D5FF]">
              <button
                *ngIf="editingTableId"
                type="button"
                (click)="deleteTable(editingTableId)"
                class="action-btn btn-outline-danger mr-auto"
              >
                <span class="material-symbols-outlined text-[16px]">delete</span>
                <span>Delete Table</span>
              </button>
              <button
                type="button"
                (click)="showTableModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="action-btn btn-gradient-purple"
              >
                {{ editingTableId ? 'Save Changes ✓' : 'Add Dining Table ✓' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .icon-purple {
        color: var(--primary, #7E22CE);
      }

      .flex-align-center {
        display: flex;
        align-items: center;
      }

      .gap-2 {
        gap: 0.5rem;
      }

      .mt-2 {
        margin-top: 0.5rem;
      }

      .mr-auto {
        margin-right: auto;
      }

      .spin-icon {
        animation: spin 0.9s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* ─── Occupancy meter on the KPI strip ─── */
      .occupancy-track {
        height: 6px;
        border-radius: 9999px;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        overflow: hidden;
      }

      .occupancy-fill {
        height: 100%;
        border-radius: 9999px;
        background: linear-gradient(90deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #9333EA) 100%);
        transition: width 0.45s cubic-bezier(0.16, 1, 0.3, 1);
      }

      /* ═══════════════════════════════════════════════════════════
         GLASS FLOOR MAP
         The tiles are real frosted glass (backdrop-filter), which only
         reads as glass when there is something behind it - so the panel
         carries a drifting ambient wash for them to refract.
         ═══════════════════════════════════════════════════════════ */
      .floor-panel {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        background:
          linear-gradient(160deg, #F3E9FF 0%, #FBF7FF 42%, #EEF2FF 74%, #F6EEFF 100%);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: 22px;
        padding: 1.25rem 1.35rem 1.6rem;
        box-shadow: 0 10px 34px -10px rgba(46, 16, 101, 0.16);
        display: flex;
        flex-direction: column;
        gap: 1.15rem;
      }

      /* Ambient colour pools - the only thing the tiles have to blur. */
      .floor-panel::before {
        content: '';
        position: absolute;
        inset: -30%;
        z-index: -1;
        background:
          radial-gradient(26% 30% at 12% 16%, var(--primary-glow, rgba(126, 34, 206, 0.35)) 0%, transparent 72%),
          radial-gradient(24% 28% at 38% 8%, rgba(29, 78, 216, 0.3) 0%, transparent 72%),
          radial-gradient(26% 30% at 64% 20%, rgba(14, 116, 144, 0.32) 0%, transparent 72%),
          radial-gradient(24% 28% at 90% 12%, rgba(134, 25, 143, 0.28) 0%, transparent 72%),
          radial-gradient(28% 32% at 22% 74%, rgba(4, 120, 87, 0.26) 0%, transparent 72%),
          radial-gradient(26% 30% at 54% 88%, rgba(190, 24, 93, 0.26) 0%, transparent 72%),
          radial-gradient(26% 30% at 86% 76%, rgba(180, 83, 9, 0.24) 0%, transparent 72%);
        opacity: 0.85;
        animation: floorDrift 26s ease-in-out infinite alternate;
        pointer-events: none;
      }

      @keyframes floorDrift {
        from { transform: translate3d(-2%, -1%, 0) scale(1); }
        to   { transform: translate3d(3%, 2%, 0) scale(1.08); }
      }

      @media (prefers-reduced-motion: reduce) {
        .floor-panel::before { animation: none; }
      }

      .floor-panel-head {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding-bottom: 0.9rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.7);
        box-shadow: 0 1px 0 var(--card-border, #F3E8FF);
      }

      @media (min-width: 768px) {
        .floor-panel-head {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
      }

      .floor-panel-title {
        font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
        font-size: 1rem;
        font-weight: 900;
        color: var(--text-main, #2E1065);
        margin: 0;
      }

      .floor-panel-sub {
        font-size: 0.72rem;
        color: var(--text-muted, #6B7280);
        font-weight: 500;
        margin: 0.15rem 0 0;
      }

      .status-legend {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.35rem 0.6rem;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--text-muted, #6B7280);
        padding: 0 0.25rem;
      }

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 9999px;
        display: inline-block;
      }

      .dot-free { background: #16A34A; box-shadow: 0 0 8px rgba(22, 163, 74, 0.7); }
      .dot-busy { background: #EA580C; box-shadow: 0 0 8px rgba(234, 88, 12, 0.7); }
      .dot-blocked { background: #DC2626; box-shadow: 0 0 8px rgba(220, 38, 38, 0.7); }

      .floor-empty {
        padding: 2.5rem 1rem;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }

      .floor-grid {
        display: grid;
        /* auto-fill keeps the tiles a readable width instead of stretching a
           short row of tables across the whole screen. */
        grid-template-columns: repeat(auto-fill, minmax(264px, 1fr));
        gap: 1.1rem;
      }

      /* ─── Section identity ───
         Eight jewel hues, assigned to a section by name hash, so any section the
         kitchen invents still gets a stable colour. The hue only ever tints the
         glass and the section chip - it never carries status, which stays
         green / amber / red, and never replaces the purple action accent. */
      .zone-0 { --zone: #7E22CE; --zone-wash: rgba(126, 34, 206, 0.16); }
      .zone-1 { --zone: #0E7490; --zone-wash: rgba(14, 116, 144, 0.16); }
      .zone-2 { --zone: #4338CA; --zone-wash: rgba(67, 56, 202, 0.16); }
      .zone-3 { --zone: #BE185D; --zone-wash: rgba(190, 24, 93, 0.15); }
      .zone-4 { --zone: #047857; --zone-wash: rgba(4, 120, 87, 0.15); }
      .zone-5 { --zone: #B45309; --zone-wash: rgba(180, 83, 9, 0.15); }
      .zone-6 { --zone: #1D4ED8; --zone-wash: rgba(29, 78, 216, 0.15); }
      .zone-7 { --zone: #86198F; --zone-wash: rgba(134, 25, 143, 0.15); }

      /* ─── The glass tile itself ─── */
      .table-tile {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        padding: 0.95rem 1.05rem 0.85rem;
        border-radius: 20px;
        /* Three layers of one pane: a caustic catching light at the top-left,
           the status tint entering from the top-right, and the section colour
           running down through the glass. */
        background:
          radial-gradient(85% 58% at 6% -6%, rgba(255, 255, 255, 0.8) 0%, transparent 62%),
          radial-gradient(118% 88% at 100% 0%, var(--status-wash, transparent) 0%, transparent 58%),
          linear-gradient(
            152deg,
            var(--zone-wash, rgba(126, 34, 206, 0.14)) 0%,
            rgba(255, 255, 255, 0.5) 46%,
            rgba(255, 255, 255, 0.32) 100%
          );
        backdrop-filter: blur(26px) saturate(190%) brightness(1.04);
        -webkit-backdrop-filter: blur(26px) saturate(190%) brightness(1.04);
        border: 1px solid rgba(255, 255, 255, 0.7);
        /* Bevelled edge: light catches the top and left, the bottom edge sits
           in its own shadow, which is what gives the pane thickness. */
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.95),
          inset 1px 0 0 rgba(255, 255, 255, 0.55),
          inset -1px 0 0 rgba(255, 255, 255, 0.25),
          inset 0 -1px 0 rgba(46, 16, 101, 0.07),
          0 2px 6px -2px rgba(46, 16, 101, 0.12),
          0 16px 36px -18px var(--tile-shadow, rgba(46, 16, 101, 0.35));
        cursor: pointer;
        transition:
          transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .table-tile:focus-visible {
        outline: 2px solid var(--zone, var(--primary, #7E22CE));
        outline-offset: 3px;
      }

      /* Specular sweep across the top - the highlight that sells the glass. */
      .table-tile::after {
        content: '';
        position: absolute;
        top: -55%;
        left: -25%;
        width: 150%;
        height: 100%;
        z-index: -1;
        background: linear-gradient(
          115deg,
          rgba(255, 255, 255, 0) 35%,
          rgba(255, 255, 255, 0.6) 50%,
          rgba(255, 255, 255, 0) 65%
        );
        transform: rotate(-8deg);
        opacity: 0.7;
        pointer-events: none;
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
      }

      /* Status rail: a glowing edge inside the glass rather than a flat border. */
      .table-tile::before {
        content: '';
        position: absolute;
        top: 14px;
        bottom: 14px;
        left: 0;
        width: 3px;
        border-radius: 0 3px 3px 0;
        background: var(--tile-accent, var(--primary, #7E22CE));
        box-shadow: 0 0 14px 1px var(--tile-accent, var(--primary, #7E22CE));
        pointer-events: none;
      }

      /* Lifting the pane deepens its shadow and drags the highlight across it.
         The tint layers are left alone so the glass does not flash white. */
      .table-tile:hover {
        transform: translateY(-5px);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 1),
          inset 1px 0 0 rgba(255, 255, 255, 0.7),
          inset -1px 0 0 rgba(255, 255, 255, 0.3),
          inset 0 -1px 0 rgba(46, 16, 101, 0.07),
          0 4px 10px -4px rgba(46, 16, 101, 0.14),
          0 26px 50px -20px var(--tile-shadow, rgba(46, 16, 101, 0.45));
      }

      .table-tile:hover::after {
        transform: rotate(-8deg) translateX(18%);
        opacity: 0.95;
      }

      .table-tile:active {
        transform: translateY(-1px);
      }

      /* Each status tints its own pane of glass - the wash layers over the
         section hue rather than replacing it. */
      .table-tile.is-free {
        --tile-accent: #16A34A;
        --tile-shadow: rgba(22, 163, 74, 0.35);
        --status-wash: rgba(22, 163, 74, 0.16);
      }

      .table-tile.is-busy {
        --tile-accent: #EA580C;
        --tile-shadow: rgba(234, 88, 12, 0.38);
        --status-wash: rgba(234, 88, 12, 0.18);
      }

      .table-tile.is-blocked {
        --tile-accent: #DC2626;
        --tile-shadow: rgba(220, 38, 38, 0.3);
        --status-wash: rgba(220, 38, 38, 0.12);
        filter: saturate(0.6);
      }

      .table-tile.is-blocked .tile-number,
      .table-tile.is-blocked .tile-name {
        color: var(--text-muted, #6B7280);
      }

      .tile-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .zone-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        min-width: 0;
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: var(--zone, var(--primary, #7E22CE));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .zone-dot {
        width: 8px;
        height: 8px;
        flex-shrink: 0;
        border-radius: 9999px;
        background: var(--zone, var(--primary, #7E22CE));
        box-shadow: 0 0 7px var(--zone, var(--primary, #7E22CE));
      }

      /* Table code and capacity share the hero line. */
      .tile-id {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 0.65rem;
      }

      .id-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .tile-number {
        font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
        font-size: 1.85rem;
        font-weight: 900;
        letter-spacing: -0.035em;
        color: var(--text-main, #2E1065);
        line-height: 1;
      }

      .tile-name {
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--text-muted, #6B7280);
        margin-top: 0.22rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .tile-seats {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        flex-shrink: 0;
        line-height: 1.1;
      }

      .tile-seats b {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
        font-variant-numeric: tabular-nums;
      }

      .tile-seats span {
        font-size: 0.56rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-dim, #9CA3AF);
      }

      .tile-status {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.2rem 0.55rem;
        border-radius: 9999px;
        font-size: 0.625rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        white-space: nowrap;
        flex-shrink: 0;
        background: rgba(255, 255, 255, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .tile-status .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 9999px;
        background: currentColor;
        box-shadow: 0 0 7px currentColor;
      }

      .status-free { color: #15803D; }
      .status-busy { color: #C2410C; }
      .status-blocked { color: #B91C1C; }

      /* A seated table is the one staff need to spot across the room. */
      .status-busy .status-dot {
        animation: statusPulse 1.6s ease-in-out infinite;
      }

      @keyframes statusPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.3; transform: scale(0.82); }
      }

      @media (prefers-reduced-motion: reduce) {
        .status-busy .status-dot { animation: none; }
      }

      /* Hairline etched into glass: a dark line with a light one under it. */
      .tile-rule {
        height: 1px;
        background: rgba(46, 16, 101, 0.09);
        box-shadow: 0 1px 0 rgba(255, 255, 255, 0.85);
      }

      /* ─── Seated: the running check is the headline ─── */
      .bill-hero {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.6rem;
      }

      .bill-total {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.45rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1;
        color: var(--text-main, #2E1065);
        font-variant-numeric: tabular-nums;
      }

      .bill-ref {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.62rem;
        font-weight: 700;
        color: #9A3412;
        padding: 0.18rem 0.45rem;
        border-radius: 7px;
        background: rgba(255, 237, 213, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.8);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 48%;
      }

      /* ─── Dwell rail: one tick per 15 minutes of a 90-minute turn ─── */
      .dwell {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .dwell-ticks {
        display: flex;
        gap: 3px;
      }

      .dwell-ticks i {
        flex: 1;
        height: 5px;
        border-radius: 3px;
        background: rgba(46, 16, 101, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.7);
      }

      .dwell-ticks i.on {
        background: var(--tile-accent, #EA580C);
        border-color: var(--tile-accent, #EA580C);
        box-shadow: 0 0 7px rgba(234, 88, 12, 0.45);
      }

      .dwell-legend {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        font-size: 0.64rem;
        font-weight: 700;
        color: var(--text-muted, #6B7280);
      }

      .dwell-legend .is-over {
        color: var(--danger, #DC2626);
      }

      /* ─── Three figures, recessed into the glass ─── */
      /* A second, shallower pane inside the first - the depth cue that keeps a
         glass card from reading as one flat sheet. */
      .tile-cells {
        display: flex;
        border-radius: 12px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.42);
        border: 1px solid rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(8px) saturate(140%);
        -webkit-backdrop-filter: blur(8px) saturate(140%);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.9),
          inset 0 -1px 0 rgba(46, 16, 101, 0.05);
      }

      .tile-cells > div {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.12rem;
        padding: 0.4rem 0.5rem;
      }

      .tile-cells > div + div {
        border-left: 1px solid rgba(46, 16, 101, 0.07);
      }

      .tile-cells span {
        font-size: 0.55rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-dim, #9CA3AF);
      }

      .tile-cells b {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.74rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .tile-cells b.plain {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.7rem;
      }

      /* ─── One-line note for free and blocked tables ─── */
      .tile-note {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin: 0;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--text-muted, #6B7280);
      }

      .tile-note b {
        font-weight: 800;
        color: var(--text-main, #2E1065);
      }

      .tile-note .material-symbols-outlined {
        font-size: 16px;
        flex-shrink: 0;
      }

      .is-blocked-note {
        color: #B91C1C;
        align-items: flex-start;
        line-height: 1.35;
      }

      /* The action reads as a label, not a button, because the whole tile is
         the button - a second target inside it would only compete. */
      .tile-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-top: auto;
        padding-top: 0.15rem;
      }

      .tile-go {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-width: 0;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.74rem;
        font-weight: 800;
        white-space: nowrap;
        color: var(--primary, #7E22CE);
      }

      .tile-go .material-symbols-outlined {
        font-size: 17px;
      }

      .tile-go .go-arrow {
        font-size: 16px;
        transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .table-tile:hover .go-arrow {
        transform: translateX(3px);
      }

      .is-busy .tile-go {
        color: #C2410C;
      }

      .is-blocked .tile-go {
        color: var(--text-muted, #6B7280);
      }

      .tile-icon-btn {
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: var(--text-muted, #6B7280);
        cursor: pointer;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .tile-icon-btn .material-symbols-outlined {
        font-size: 18px;
      }

      .tile-icon-btn:hover {
        color: var(--primary, #7E22CE);
        border-color: var(--primary, #7E22CE);
        background: rgba(255, 255, 255, 0.85);
        transform: translateY(-1px);
      }

      /* A browser without backdrop-filter would show near-transparent tiles,
         so there it falls back to the solid card surface. */
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .table-tile,
        .table-tile.is-free,
        .table-tile.is-busy,
        .table-tile.is-blocked,
        .floor-empty,
        .status-legend,
        .tile-status,
        .tile-cells,
        .tile-icon-btn {
          background: var(--card-bg, #ffffff);
          border-color: var(--card-border, #E9D5FF);
        }
      }

      .two-input-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .btn-outline-danger {
        background: var(--card-bg, #ffffff);
        border-color: #FCA5A5;
        color: var(--danger, #DC2626);
      }

      .btn-outline-danger:hover {
        background: #FEE2E2;
        border-color: var(--danger, #DC2626);
      }

      .font-mono {
        font-family: 'JetBrains Mono', monospace;
      }
    `,
  ],
})
export class DiningComponent implements OnInit, OnDestroy {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  private diningService = inject(DiningService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  public tables: DiningTable[] = [];
  public filteredTables: DiningTable[] = [];
  public sections: string[] = [];
  public selectedSection: string | null = null;

  /**
   * One clock for the whole grid, nudged every half minute. Calling Date.now()
   * straight from the template would give two change-detection passes different
   * answers across a minute boundary.
   */
  private nowMs = Date.now();
  private clockTimer: ReturnType<typeof setInterval> | null = null;

  public showTableModal = false;
  public editingTableId: number | null = null;
  public tableStatusOptions: DropdownOption[] = [
    { value: 'AVAILABLE', label: 'AVAILABLE', icon: 'check_circle', description: 'Table ready for incoming guests' },
    { value: 'OCCUPIED', label: 'OCCUPIED', icon: 'restaurant', description: 'Guests dining currently' },
    { value: 'UNAVAILABLE', label: 'UNAVAILABLE', icon: 'block', description: 'Table out of service' },
  ];

  public tableForm: any = {
    tableNumber: '',
    name: '',
    section: 'Main AC Hall',
    capacity: 4,
    status: 'AVAILABLE',
  };

  ngOnInit(): void {
    this.loadTables();
    this.clockTimer = setInterval(() => {
      this.nowMs = Date.now();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  /** Tables in a given status, for the occupancy strip. */
  public countStatus(status: TableStatus): number {
    return this.tables.filter((t) => t.status === status).length;
  }

  /** Tables in a section, shown as the count badge on its filter tab. */
  public sectionCount(section: string): number {
    return this.tables.filter((t) => t.section === section).length;
  }

  public trackByTableId(_index: number, table: DiningTable): number {
    return table.id;
  }

  public trackByIndex(index: number): number {
    return index;
  }

  /* ─────────── Tile appearance ─────────── */

  /** Status class on the tile, plus the section's colour class. */
  public tileClasses(table: DiningTable): string[] {
    const status =
      table.status === 'AVAILABLE' ? 'is-free' : table.status === 'OCCUPIED' ? 'is-busy' : 'is-blocked';
    return [status, 'zone-' + this.sectionIndex(table.section)];
  }

  public statusClass(status: TableStatus): string {
    return status === 'AVAILABLE' ? 'status-free' : status === 'OCCUPIED' ? 'status-busy' : 'status-blocked';
  }

  public statusLabel(status: TableStatus): string {
    return status === 'AVAILABLE' ? 'Free' : status === 'OCCUPIED' ? 'Occupied' : 'Out of service';
  }

  /**
   * A section gets its colour from a hash of its name, so a section added later
   * still lands on a stable hue without anyone maintaining a colour map.
   */
  public sectionIndex(section: string): number {
    const name = (section || '').trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return hash % 8;
  }

  /* ─────────── Whole-tile action ─────────── */

  public tileAction(table: DiningTable): string {
    return table.status === 'AVAILABLE'
      ? 'Start Order'
      : table.status === 'OCCUPIED'
        ? 'Manage Table'
        : 'Return to Service';
  }

  public tileActionIcon(table: DiningTable): string {
    return table.status === 'AVAILABLE'
      ? 'bolt'
      : table.status === 'OCCUPIED'
        ? 'restaurant_menu'
        : 'build';
  }

  public onTileClick(table: DiningTable, event: Event): void {
    // Space scrolls the page by default once a non-button acts as a button.
    if (event instanceof KeyboardEvent) event.preventDefault();

    if (table.status === 'AVAILABLE') {
      this.startOrderForTable(table);
    } else if (table.status === 'OCCUPIED') {
      this.openTableOptions(table);
    } else {
      this.editTable(table, event);
    }
  }

  /* ─────────── Dwell time ─────────── */

  /** Minutes since the order on this table was opened, or null if unknown. */
  public minutesSeated(table: DiningTable): number | null {
    const started = this.startedAt(table);
    if (started === null) return null;
    return Math.max(0, Math.floor((this.nowMs - started) / 60000));
  }

  /** "1h 12m" / "47m" — blank when the backend sent no start time. */
  public dwellText(table: DiningTable): string {
    const mins = this.minutesSeated(table);
    if (mins === null) return '';
    return mins >= 60
      ? `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`
      : `${mins}m`;
  }

  /** Clock time the party was seated, e.g. "19:42". */
  public seatedClock(table: DiningTable): string {
    const started = this.startedAt(table);
    if (started === null) return '';
    const d = new Date(started);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Six ticks, one per quarter hour of a ninety-minute turn. A table past its
   * turn shows a full rail, which is the point — it should look full.
   */
  public dwellTicks(table: DiningTable): boolean[] {
    const mins = this.minutesSeated(table);
    const lit = mins === null ? 0 : Math.min(DwellRail.TICKS, Math.max(1, Math.ceil(mins / DwellRail.MINUTES_PER_TICK)));
    return Array.from({ length: DwellRail.TICKS }, (_, i) => i < lit);
  }

  public isOverTurn(table: DiningTable): boolean {
    const mins = this.minutesSeated(table);
    return mins !== null && mins > DwellRail.TICKS * DwellRail.MINUTES_PER_TICK;
  }

  /** Spend per seat. Covers are not tracked, so capacity is the honest divisor. */
  public perSeat(table: DiningTable): number {
    const capacity = Number(table.capacity) || 0;
    const total = Number(table.order_current_total) || 0;
    return capacity > 0 ? total / capacity : total;
  }

  /** Order start time in ms, tolerant of the "YYYY-MM-DD HH:mm:ss" SQL form. */
  private startedAt(table: DiningTable): number | null {
    if (!table.order_start_time) return null;
    const raw = String(table.order_start_time).trim().replace(' ', 'T');
    const ms = new Date(raw).getTime();
    return Number.isFinite(ms) ? ms : null;
  }

  public get totalSeats(): number {
    return this.tables.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);
  }

  /** Seats on tables that are currently serving guests. */
  public get seatsOccupied(): number {
    return this.tables
      .filter((t) => t.status === 'OCCUPIED')
      .reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);
  }

  /**
   * Share of the seatable floor that is in use. Out-of-service tables are left
   * out of the denominator - a blocked table is not capacity anyone can sell.
   */
  public get occupancyRate(): number {
    const seatable = this.tables.filter((t) => t.status !== 'UNAVAILABLE').length;
    if (!seatable) return 0;
    return Math.round((this.countStatus('OCCUPIED') / seatable) * 100);
  }

  public selectSection(section: string | null): void {
    this.selectedSection = section;
    this.filterTables();
  }

  loadTables(): void {
    this.isLoading = true;
    this.loadError = null;
    this.diningService.getTables().subscribe({
      next: (res) => {
          this.isLoading = false;
        if (res.success) {
          this.tables = res.data;
          this.extractSections();
          this.filterTables();
        }
      },
        error: (err) => {
          this.isLoading = false;
          this.loadError = err?.error?.message || 'Unable to load data from the server.';
        },
      });
  }

  extractSections(): void {
    const secSet = new Set<string>();
    for (const t of this.tables) {
      if (t.section) secSet.add(t.section);
    }
    this.sections = Array.from(secSet);
    // A section can disappear when its last table is deleted or moved.
    if (this.selectedSection && !this.sections.includes(this.selectedSection)) {
      this.selectedSection = null;
    }
  }

  filterTables(): void {
    if (!this.selectedSection) {
      this.filteredTables = this.tables;
    } else {
      this.filteredTables = this.tables.filter((t) => t.section === this.selectedSection);
    }
  }

  startOrderForTable(table: DiningTable): void {
    this.cartService.orderType.set('DINING');
    this.cartService.selectedTable.set(table);
    this.router.navigate(['/pos']);
  }

  openTableOptions(table: DiningTable): void {
    this.notify.confirm({
      title: `Release ${table.table_number}`,
      message: `Table is currently OCCUPIED with ${table.order_number || 'an active order'}. Do you want to release it to AVAILABLE?`,
      confirmText: 'Release Table',
      onConfirm: () => {
        this.diningService.setStatus(table.id, 'AVAILABLE', null).subscribe({
          next: () => {
            this.notify.success(`Table ${table.table_number} is now AVAILABLE`);
            this.loadTables();
          },
          // Reported by the global error interceptor; present so a failure
          // cannot escape as an unhandled rejection.
          error: () => {},
        });
      },
    });
  }

  openAddTableModal(): void {
    this.editingTableId = null;
    this.tableForm = {
      tableNumber: '',
      name: '',
      section: this.selectedSection || 'Main AC Hall',
      capacity: 4,
      status: 'AVAILABLE',
    };
    this.showTableModal = true;
  }

  editTable(table: DiningTable, event: Event): void {
    event.stopPropagation();
    this.editingTableId = table.id;
    this.tableForm = {
      tableNumber: table.table_number,
      name: table.name,
      section: table.section,
      capacity: table.capacity,
      status: table.status,
    };
    this.showTableModal = true;
  }

  saveTable(): void {
    if (!this.tableForm.tableNumber || !this.tableForm.name) {
      this.notify.error('Please enter table number and name');
      return;
    }

    if (this.editingTableId) {
      this.diningService.updateTable(this.editingTableId, this.tableForm).subscribe({
        next: () => {
          this.notify.success('Table updated successfully');
          this.showTableModal = false;
          this.loadTables();
        },
        // Reported by the global error interceptor; present so a failure
        // cannot escape as an unhandled rejection.
        error: () => {},
      });
    } else {
      this.diningService.createTable(this.tableForm).subscribe({
        next: () => {
          this.notify.success('Table created successfully');
          this.showTableModal = false;
          this.loadTables();
        },
        // Reported by the global error interceptor; present so a failure
        // cannot escape as an unhandled rejection.
        error: () => {},
      });
    }
  }

  deleteTable(id: number): void {
    this.notify.confirm({
      title: 'Delete Table',
      message: 'Are you sure you want to permanently delete this table?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.diningService.deleteTable(id).subscribe({
          next: () => {
            this.notify.info('Table deleted');
            this.showTableModal = false;
            this.loadTables();
          },
          // Reported by the global error interceptor; present so a failure
          // cannot escape as an unhandled rejection.
          error: () => {},
        });
      },
    });
  }
}
