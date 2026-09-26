import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DiningService } from '../../core/services/dining.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { DiningTable, TableStatus, TableReservation, TableHistoryItem } from '../../core/models';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { DiningLayoutService } from '../../core/services/dining-layout.service';
import { DEFAULT_ACTION_BUTTON_CSS } from '../../shared/styles/default-action-buttons.styles';
import { DINING_LAYOUT_CSS } from '../../shared/styles/dining-layout.styles';

/** Six ticks of fifteen minutes — the ninety-minute turn the floor is run to. */
const DwellRail = {
  TICKS: 6,
  MINUTES_PER_TICK: 15,
} as const;

import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import { ActionLoadingDirective } from '../../shared/directives/action-loading.directive';
@Component({
  selector: 'app-dining',
  standalone: true,
  imports: [PageLoaderComponent, CommonModule, FormsModule, AppCurrencyPipe, CustomDropdownComponent, ActionLoadingDirective],
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
        <span>Floor Operations</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Dining &amp; Seating Map</span>
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
            (click)="openReservationsDrawer()"
            class="action-btn btn-outline-purple relative"
            title="Advance table reservations"
          >
            <span class="material-symbols-outlined">event_seat</span>
            <span>Reservations</span>
            <span *ngIf="confirmedReservationsCount > 0" class="header-badge-count">{{ confirmedReservationsCount }}</span>
          </button>

          <button
            type="button"
            (click)="loadTables(); loadReservations();"
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

        <div class="kpi-card card-accent-indigo">
          <div class="kpi-header-row">
            <span class="kpi-title">Reserved</span>
            <span class="kpi-icon-bubble bg-indigo-tint">
              <span class="material-symbols-outlined">event_seat</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ countStatus('RESERVED') }}</span>
            <span class="kpi-pill pill-reserved">Booked</span>
          </div>
        </div>

        <div class="kpi-card card-accent-teal">
          <div class="kpi-header-row">
            <span class="kpi-title">Cleaning</span>
            <span class="kpi-icon-bubble bg-teal-tint">
              <span class="material-symbols-outlined">cleaning_services</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ countStatus('CLEANING') }}</span>
            <span class="kpi-pill pill-cleaning">Bussing</span>
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
      <div class="floor-panel dining-stage" [ngClass]="diningLayout.rootClass()" [ngStyle]="diningLayout.pageCssVars()">
        <div class="floor-panel-head">
          <div class="flex-align-center gap-2">
            <span class="material-symbols-outlined icon-purple">map</span>
            <div>
              <h3 class="floor-panel-title">
                {{ selectedSection || 'Entire Floor' }} · {{ diningLayout.effectiveDesign().name }}
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
            <span class="legend-item"><i class="legend-dot dot-reserved"></i>Reserved</span>
            <span class="legend-item"><i class="legend-dot dot-cleaning"></i>Cleaning</span>
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

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- DESIGN 1: CHECKERED FLOOR PLAN (Reference 1)                    -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="chk-floor-canvas" *ngIf="filteredTables.length > 0 && diningLayout.effectiveKey() === 'checkered'">
          <span class="chk-plant" style="top: 15px; left: 20px;"></span>
          <span class="chk-plant" style="top: 15px; right: 25px;"></span>
          <span class="chk-plant" style="top: 50%; left: 45%;"></span>

          <article
            *ngFor="let table of filteredTables; trackBy: trackByTableId"
            class="chk-table-card"
            [ngClass]="{
              'chk-table-banquet': table.capacity >= 6,
              'chk-table-square': table.capacity === 4 || table.capacity === 5,
              'chk-table-round': table.capacity <= 3
            }"
            role="button"
            tabindex="0"
            [attr.aria-label]="tileAction(table) + ' — ' + table.table_number + ', ' + table.name"
            (click)="onTileClick(table, $event)"
          >
            <!-- Banquet Table (>= 6 seats) -->
            <ng-container *ngIf="table.capacity >= 6">
              <div class="chk-chair-seat chk-chair-top" style="left: 30px;"></div>
              <div class="chk-chair-seat chk-chair-top" style="left: 80px;"></div>
              <div class="chk-chair-seat chk-chair-top" style="left: 130px;"></div>
              <div class="chk-chair-seat chk-chair-top" style="left: 180px;"></div>
              <div class="chk-chair-seat chk-chair-bottom" style="left: 30px;"></div>
              <div class="chk-chair-seat chk-chair-bottom" style="left: 80px;"></div>
              <div class="chk-chair-seat chk-chair-bottom" style="left: 130px;"></div>
              <div class="chk-chair-seat chk-chair-bottom" style="left: 180px;"></div>
              <div class="chk-chair-seat chk-chair-left" style="top: calc(50% - 11px);"></div>
              <div class="chk-chair-seat chk-chair-right" style="top: calc(50% - 11px);"></div>

              <div class="chk-cloth-diamond"></div>

              <div class="chk-guest-label">
                {{ table.customer_name || table.name || 'Table' }}
                <span class="chk-guest-time">
                  {{ seatedClock(table) || (table.capacity + ' seats') }}
                  <span *ngIf="table.status === 'OCCUPIED'" class="timer-pill ml-1" [ngClass]="'timer-' + turnoverTier(table)">
                    ⏱️{{ tableElapsedMinutes(table) }}m
                  </span>
                  <span *ngIf="table.status === 'CLEANING'" class="timer-pill timer-warn ml-1">
                    🧹{{ tableCleaningMinutes(table) }}m
                  </span>
                  <span *ngIf="table.status === 'RESERVED'" class="timer-pill timer-safe ml-1">
                    📅Res
                  </span>
                </span>
              </div>

              <div
                class="chk-status-badge"
                [class.is-free]="table.status === 'AVAILABLE'"
                [class.is-busy]="table.status === 'OCCUPIED'"
                [class.is-reserved]="table.status === 'RESERVED'"
                [class.is-cleaning]="table.status === 'CLEANING'"
                [class.is-blocked]="table.status === 'UNAVAILABLE'"
              >
                {{ table.table_number }}
              </div>
            </ng-container>

            <!-- Square Table (4-5 seats) -->
            <ng-container *ngIf="table.capacity === 4 || table.capacity === 5">
              <div class="chk-chair-seat chk-chair-top" style="left: calc(50% - 11px);"></div>
              <div class="chk-chair-seat chk-chair-bottom" style="left: calc(50% - 11px);"></div>
              <div class="chk-chair-seat chk-chair-left" style="top: calc(50% - 11px);"></div>
              <div class="chk-chair-seat chk-chair-right" style="top: calc(50% - 11px);"></div>
              <div
                class="chk-bottom-accent"
                [class.accent-yellow]="sectionIndex(table.section) % 3 === 0"
                [class.accent-teal]="sectionIndex(table.section) % 3 === 1"
                [class.accent-orange]="sectionIndex(table.section) % 3 === 2"
              ></div>
              <div class="chk-coaster">
                <span class="chk-coaster-code">{{ table.table_number }}</span>
                <span class="text-[9px] block font-bold leading-none" *ngIf="table.status === 'OCCUPIED'">⏱️{{ tableElapsedMinutes(table) }}m</span>
                <span class="text-[9px] block font-bold text-cyan-700 leading-none" *ngIf="table.status === 'CLEANING'">🧹Clean</span>
                <span class="text-[9px] block font-bold text-indigo-700 leading-none" *ngIf="table.status === 'RESERVED'">📅Res</span>
              </div>
            </ng-container>

            <!-- Round Table (<= 3 seats) -->
            <ng-container *ngIf="table.capacity <= 3">
              <div class="chk-chair-seat chk-chair-top" style="left: calc(50% - 11px);"></div>
              <div class="chk-chair-seat chk-chair-left" style="top: calc(50% - 11px);"></div>
              <div class="chk-chair-seat chk-chair-right" style="top: calc(50% - 11px);"></div>
              <div
                class="chk-booth-arc"
                [class.arc-orange]="sectionIndex(table.section) % 2 === 0"
                [class.arc-teal]="sectionIndex(table.section) % 2 === 1"
              ></div>
              <div class="chk-coaster">
                <span class="chk-coaster-code">{{ table.table_number }}</span>
                <span class="text-[9px] block font-bold leading-none" *ngIf="table.status === 'OCCUPIED'">⏱️{{ tableElapsedMinutes(table) }}m</span>
                <span class="text-[9px] block font-bold text-cyan-700 leading-none" *ngIf="table.status === 'CLEANING'">🧹Clean</span>
                <span class="text-[9px] block font-bold text-indigo-700 leading-none" *ngIf="table.status === 'RESERVED'">📅Res</span>
              </div>
            </ng-container>
          </article>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- DESIGN 2: TABLE VIEW / SOFT NEUMORPHIC (Reference 2)            -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="neu-floor-canvas" *ngIf="filteredTables.length > 0 && diningLayout.effectiveKey() === 'neumorphic'">
          <article
            *ngFor="let table of filteredTables; trackBy: trackByTableId"
            class="neu-table-card"
            [ngClass]="{
              'neu-table-8seat': table.capacity >= 8,
              'neu-table-6seat': table.capacity === 6 || table.capacity === 7,
              'neu-table-4seat': table.capacity === 4 || table.capacity === 5,
              'neu-table-2seat': table.capacity <= 3,
              'is-busy': table.status === 'OCCUPIED'
            }"
            role="button"
            tabindex="0"
            [attr.aria-label]="tileAction(table) + ' — ' + table.table_number + ', ' + table.name"
            (click)="onTileClick(table, $event)"
          >
            <!-- Top Pill Seats -->
            <span class="neu-pill-seat neu-pill-top" style="left: 20px;" *ngIf="table.capacity >= 4"></span>
            <span class="neu-pill-seat neu-pill-top" style="left: calc(50% - 16px);"></span>
            <span class="neu-pill-seat neu-pill-top" style="right: 20px;" *ngIf="table.capacity >= 4"></span>

            <!-- Bottom Pill Seats -->
            <span class="neu-pill-seat neu-pill-bottom" style="left: 20px;" *ngIf="table.capacity >= 4"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="left: calc(50% - 16px);"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="right: 20px;" *ngIf="table.capacity >= 4"></span>

            <!-- Side Pill Seats -->
            <span class="neu-pill-seat neu-pill-left" *ngIf="table.capacity >= 6"></span>
            <span class="neu-pill-seat neu-pill-right" *ngIf="table.capacity >= 6"></span>

            <!-- Center Badge -->
            <div
              class="neu-code-badge"
              [class.badge-red]="table.status === 'OCCUPIED'"
              [class.badge-indigo]="table.status === 'RESERVED'"
              [class.badge-teal]="table.status === 'CLEANING'"
              [class.badge-blue]="table.status === 'AVAILABLE' && sectionIndex(table.section) % 2 === 0"
              [class.badge-dark]="table.status === 'AVAILABLE' && sectionIndex(table.section) % 2 !== 0"
            >
              <span>{{ table.table_number }}</span>
              <span class="neu-bill-sub" *ngIf="table.status === 'OCCUPIED' && table.order_current_total">
                {{ table.order_current_total | appCurrency:'1.0-0' }} · ⏱️{{ tableElapsedMinutes(table) }}m
              </span>
              <span class="neu-bill-sub" *ngIf="table.status === 'OCCUPIED' && !table.order_current_total">
                ⏱️{{ tableElapsedMinutes(table) }}m
              </span>
              <span class="neu-bill-sub" *ngIf="table.status === 'RESERVED'">
                📅 Reserved
              </span>
              <span class="neu-bill-sub" *ngIf="table.status === 'CLEANING'">
                🧹 Cleaning
              </span>
              <span class="neu-bill-sub" *ngIf="table.status === 'AVAILABLE'">
                {{ table.capacity }} seats
              </span>
            </div>
          </article>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- DESIGN 3: ILLUSTRATED CAPACITY FLOOR (Reference 3)              -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="ill-floor-canvas" *ngIf="filteredTables.length > 0 && diningLayout.effectiveKey() === 'illustrated'">
          <article
            *ngFor="let table of filteredTables; trackBy: trackByTableId"
            class="ill-table-card"
            [ngClass]="[
              sectionIndex(table.section) % 3 === 0 ? 'ill-theme-mint' : sectionIndex(table.section) % 3 === 1 ? 'ill-theme-pink' : 'ill-theme-lavender',
              table.capacity >= 6 ? 'ill-table-lg' : table.capacity >= 4 ? 'ill-table-md' : 'ill-table-sm'
            ]"
            role="button"
            tabindex="0"
            [attr.aria-label]="tileAction(table) + ' — ' + table.table_number + ', ' + table.name"
            (click)="onTileClick(table, $event)"
          >
            <!-- Top illustrated chairs (filled when occupied, outline when free) -->
            <div class="ill-chair-icon ill-chair-top" [class.is-occupied]="table.status === 'OCCUPIED'" style="left: 20px;" *ngIf="table.capacity >= 4">
              <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
            </div>
            <div class="ill-chair-icon ill-chair-top" [class.is-occupied]="table.status === 'OCCUPIED'" style="left: calc(50% - 10px);">
              <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
            </div>
            <div class="ill-chair-icon ill-chair-top" [class.is-occupied]="table.status === 'OCCUPIED'" style="right: 20px;" *ngIf="table.capacity >= 4">
              <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
            </div>

            <!-- Bottom illustrated chairs -->
            <div class="ill-chair-icon ill-chair-bottom" [class.is-occupied]="table.status === 'OCCUPIED'" style="left: 20px;" *ngIf="table.capacity >= 4">
              <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
            </div>
            <div class="ill-chair-icon ill-chair-bottom" [class.is-occupied]="table.status === 'OCCUPIED'" style="left: calc(50% - 10px);">
              <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
            </div>
            <div class="ill-chair-icon ill-chair-bottom" [class.is-occupied]="table.status === 'OCCUPIED'" style="right: 20px;" *ngIf="table.capacity >= 4">
              <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
            </div>

            <!-- End chairs -->
            <div class="ill-chair-icon ill-chair-left" [class.is-occupied]="table.status === 'OCCUPIED'" style="top: calc(50% - 9px);">
              <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
            </div>
            <div class="ill-chair-icon ill-chair-right" [class.is-occupied]="table.status === 'OCCUPIED'" style="top: calc(50% - 9px);">
              <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
            </div>

            <div class="ill-table-title">{{ table.table_number }} · {{ table.name }}</div>
            <div class="ill-table-capacity">
              <span>👥</span>
              <span>{{ table.status === 'OCCUPIED' ? (table.active_guest_count || table.capacity) + '/' + table.capacity : table.capacity }}</span>
              <span *ngIf="table.status === 'OCCUPIED'" class="timer-pill ml-1" [ngClass]="'timer-' + turnoverTier(table)">
                ⏱️{{ tableElapsedMinutes(table) }}m
              </span>
              <span *ngIf="table.status === 'CLEANING'" class="timer-pill timer-warn ml-1">
                🧹{{ tableCleaningMinutes(table) }}m
              </span>
              <span *ngIf="table.status === 'RESERVED'" class="timer-pill timer-safe ml-1">
                📅Res
              </span>
            </div>
          </article>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- DESIGN 4: LIST VIEW                                             -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="list-table-container" *ngIf="filteredTables.length > 0 && diningLayout.effectiveKey() === 'list'">
          <table class="list-table-grid">
            <thead>
              <tr>
                <th>Table Code</th>
                <th>Name</th>
                <th>Section</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Dwell Time</th>
                <th>Running Check</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let table of filteredTables; trackBy: trackByTableId"
                (click)="onTileClick(table, $event)"
              >
                <td><span class="list-code-badge">{{ table.table_number }}</span></td>
                <td><b>{{ table.name }}</b></td>
                <td><span class="list-section-chip">{{ table.section }}</span></td>
                <td>{{ table.capacity }} Seats</td>
                <td>
                  <span
                    class="list-status-pill"
                    [class.is-free]="table.status === 'AVAILABLE'"
                    [class.is-busy]="table.status === 'OCCUPIED'"
                    [class.is-reserved]="table.status === 'RESERVED'"
                    [class.is-cleaning]="table.status === 'CLEANING'"
                    [class.is-blocked]="table.status === 'UNAVAILABLE'"
                  >
                    ● {{ statusLabel(table.status) }}
                  </span>
                </td>
                <td>
                  <div *ngIf="table.status === 'OCCUPIED'" class="flex items-center gap-1.5">
                    <span class="timer-pill" [ngClass]="'timer-' + turnoverTier(table)">⏱️ {{ tableElapsedMinutes(table) }}m</span>
                    <span class="text-xs text-slate-500">({{ table.active_guest_count || table.capacity }} guests)</span>
                  </div>
                  <div *ngIf="table.status === 'CLEANING'">
                    <span class="timer-pill timer-warn">🧹 Cleaning ({{ tableCleaningMinutes(table) }}m)</span>
                  </div>
                  <div *ngIf="table.status === 'RESERVED'" class="text-xs text-indigo-700 font-semibold">
                    📅 {{ table.reservation_customer || 'Booked' }}
                  </div>
                  <span *ngIf="table.status === 'AVAILABLE' || table.status === 'UNAVAILABLE'" class="text-slate-400">—</span>
                </td>
                <td>
                  <span *ngIf="table.status === 'OCCUPIED' && table.order_current_total" class="font-bold font-mono">
                    {{ table.order_current_total | appCurrency:'1.2-2' }}
                  </span>
                  <span *ngIf="table.status !== 'OCCUPIED'" class="text-slate-400">—</span>
                </td>
                <td style="text-align: right;">
                  <!-- The two actions need their own gap: the cell only
                       right-aligns them, it does not space them. -->
                  <div class="dv-actions">
                    <button
                      type="button"
                      class="dv-btn is-primary"
                      (click)="onTileClick(table, $event); $event.stopPropagation();"
                    >
                      {{ tileAction(table) }}
                    </button>
                    <button
                      type="button"
                      class="dv-btn is-icon"
                      (click)="openHistory(table, $event)"
                      title="View Dining History"
                    >
                      <span class="material-symbols-outlined">history</span>
                    </button>
                    <button
                      type="button"
                      class="dv-btn is-icon"
                      (click)="editTable(table, $event); $event.stopPropagation();"
                      title="Edit Table"
                    >
                      <span class="material-symbols-outlined">settings</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- DESIGN 5: CARD LIST VIEW                                        -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="cardlist-container" *ngIf="filteredTables.length > 0 && diningLayout.effectiveKey() === 'cardlist'">
          <article
            *ngFor="let table of filteredTables; trackBy: trackByTableId"
            class="cardlist-row-card"
            role="button"
            tabindex="0"
            (click)="onTileClick(table, $event)"
          >
            <div class="cardlist-left-col">
              <span
                class="cardlist-badge"
                [class.is-free]="table.status === 'AVAILABLE'"
                [class.is-busy]="table.status === 'OCCUPIED'"
                [class.is-reserved]="table.status === 'RESERVED'"
                [class.is-cleaning]="table.status === 'CLEANING'"
                [class.is-blocked]="table.status === 'UNAVAILABLE'"
              >
                {{ table.table_number }}
              </span>
              <div>
                <span class="cardlist-section">{{ table.section }}</span>
                <div class="cardlist-seats">👥 {{ table.status === 'OCCUPIED' ? (table.active_guest_count || table.capacity) + '/' + table.capacity : table.capacity }} Seats</div>
              </div>
            </div>

            <div class="cardlist-mid-col">
              <div class="cardlist-title-row">
                <span class="cardlist-name">{{ table.name }}</span>
                <span
                  class="list-status-pill"
                  [class.is-free]="table.status === 'AVAILABLE'"
                  [class.is-busy]="table.status === 'OCCUPIED'"
                  [class.is-reserved]="table.status === 'RESERVED'"
                  [class.is-cleaning]="table.status === 'CLEANING'"
                  [class.is-blocked]="table.status === 'UNAVAILABLE'"
                >
                  ● {{ statusLabel(table.status) }}
                </span>
              </div>

              <div class="cardlist-dwell-bar" *ngIf="table.status === 'OCCUPIED'">
                <i
                  *ngFor="let lit of dwellTicks(table); trackBy: trackByIndex"
                  [class.on]="lit"
                ></i>
              </div>
              <div class="flex items-center gap-2 mt-0.5" *ngIf="table.status === 'OCCUPIED'">
                <span class="timer-pill" [ngClass]="'timer-' + turnoverTier(table)">
                  ⏱️ {{ tableElapsedMinutes(table) }}m seated
                </span>
                <span class="text-xs text-slate-600">
                  {{ table.customer_name ? 'Party: ' + table.customer_name : 'Party of ' + (table.active_guest_count || table.capacity) }}
                </span>
              </div>
              <div class="flex items-center gap-2 mt-0.5" *ngIf="table.status === 'CLEANING'">
                <span class="timer-pill timer-warn">🧹 Bussing ({{ tableCleaningMinutes(table) }}m)</span>
                <span class="text-xs text-cyan-700 font-semibold cursor-pointer underline" (click)="finishCleaning(table.id); $event.stopPropagation()">Mark Clean ✓</span>
              </div>
              <div class="flex items-center gap-2 mt-0.5" *ngIf="table.status === 'RESERVED'">
                <span class="timer-pill timer-safe">📅 Reserved</span>
                <span class="text-xs text-indigo-800 font-semibold">
                  {{ table.reservation_customer || 'Guest' }} · {{ table.reservation_guests || table.capacity }} guests
                </span>
              </div>
              <span class="text-xs text-slate-500" *ngIf="table.status === 'AVAILABLE'">
                Laid and ready · Seats up to {{ table.capacity }}
              </span>
              <span class="text-xs text-slate-500" *ngIf="table.status === 'UNAVAILABLE'">
                Out of service
              </span>
            </div>

            <div class="cardlist-right-col">
              <div *ngIf="table.status === 'OCCUPIED'">
                <div class="cardlist-bill-amount">{{ table.order_current_total | appCurrency:'1.2-2' }}</div>
                <span class="text-xs text-slate-400" *ngIf="table.order_number">{{ table.order_number }}</span>
              </div>
              <button
                type="button"
                class="dv-btn is-primary"
                (click)="onTileClick(table, $event); $event.stopPropagation();"
              >
                {{ tileAction(table) }}
              </button>
              <button
                type="button"
                class="dv-btn is-icon"
                (click)="openHistory(table, $event)"
                title="View Table Dining History"
              >
                <span class="material-symbols-outlined">history</span>
              </button>
              <button
                type="button"
                class="dv-btn is-icon"
                (click)="editTable(table, $event); $event.stopPropagation();"
                title="Edit Table"
              >
                <span class="material-symbols-outlined">settings</span>
              </button>
            </div>
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
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1 block">
                Section / Dining Area
              </label>
              <app-custom-dropdown
                [options]="sectionOptions"
                [(ngModel)]="tableForm.section"
                name="section"
                placeholder="Select Section"
                minWidth="100%"
              ></app-custom-dropdown>
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

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 6. TABLE RESERVATIONS DRAWER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="drawer-backdrop" *ngIf="showReservationDrawer" (click)="showReservationDrawer = false">
        <div class="drawer-panel" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <div class="flex items-center gap-3">
              <span class="drawer-icon-bubble bg-purple-tint">
                <span class="material-symbols-outlined text-purple-700 text-xl">event_seat</span>
              </span>
              <div>
                <h3 class="drawer-title">Table Reservations</h3>
                <p class="drawer-subtitle">{{ reservations.length }} total bookings · {{ confirmedReservationsCount }} confirmed</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" (click)="openNewReservationModal()" class="action-btn btn-gradient-purple btn-sm">
                <span class="material-symbols-outlined text-base">add</span>
                <span>New Booking</span>
              </button>
              <button type="button" (click)="showReservationDrawer = false" class="modal-close-btn" title="Close">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div class="drawer-body">
            <div *ngIf="reservations.length === 0" class="empty-state-box p-8 text-center">
              <span class="material-symbols-outlined text-4xl text-purple-300">calendar_today</span>
              <div class="font-bold text-sm text-[#2E1065] mt-2">No Reservations Found</div>
              <p class="text-xs text-slate-500 mt-1">Book tables ahead for VIP guests, family dinners, and large parties.</p>
              <button type="button" (click)="openNewReservationModal()" class="action-btn btn-gradient-purple btn-sm mt-3 inline-flex">
                <span class="material-symbols-outlined text-base">add</span>
                <span>Create Reservation</span>
              </button>
            </div>

            <div *ngFor="let res of reservations" class="reservation-card" [class.is-seated]="res.status === 'SEATED'">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="res-code-badge">{{ res.reservation_code }}</span>
                    <span class="font-bold text-sm text-[#2E1065]">{{ res.customer_name }}</span>
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5">📞 {{ res.customer_phone }}</div>
                </div>
                <span class="status-chip" [ngClass]="{
                  'chip-confirmed': res.status === 'CONFIRMED',
                  'chip-seated': res.status === 'SEATED',
                  'chip-cancelled': res.status === 'CANCELLED'
                }">
                  ● {{ res.status }}
                </span>
              </div>

              <div class="reservation-meta-row mt-2.5">
                <span class="meta-tag">📅 {{ res.reservation_time | date:'medium' }}</span>
                <span class="meta-tag">👥 {{ res.guest_count }} Guests</span>
                <span class="meta-tag" *ngIf="res.table_number">🪑 Table {{ res.table_number }} ({{ res.table_section }})</span>
                <span class="meta-tag" *ngIf="!res.table_number">📍 Prefers: {{ res.preferred_section || 'Any Section' }}</span>
              </div>

              <div *ngIf="res.special_requests" class="text-xs text-slate-600 bg-purple-50/70 p-2 rounded-lg mt-2 border border-purple-100">
                💬 <i>"{{ res.special_requests }}"</i>
              </div>

              <div class="reservation-actions-row mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between" *ngIf="res.status === 'CONFIRMED'">
                <button
                  type="button"
                  (click)="seatReservation(res)"
                  class="action-btn btn-gradient-purple btn-sm"
                >
                  <span class="material-symbols-outlined text-base">how_to_reg</span>
                  <span>Seat Guests</span>
                </button>
                <button
                  type="button"
                  (click)="cancelReservation(res.id)"
                  class="action-btn btn-outline-danger btn-sm"
                >
                  Cancel Booking
                </button>
              </div>

              <div class="mt-2 text-xs text-emerald-700 font-medium" *ngIf="res.status === 'SEATED'">
                ✓ Seated at Table {{ res.table_number || 'Floor' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 7. TABLE DINING HISTORY MODAL                                   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showHistoryModal">
        <div class="modal-content p-6 md:p-7 w-full max-w-2xl shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl text-purple-700">history</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">
                  Dining History · Table {{ selectedHistoryTable?.table_number }}
                </h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">
                  {{ selectedHistoryTable?.name }} ({{ selectedHistoryTable?.section }}) · {{ selectedHistoryTable?.capacity }} Seats
                </p>
              </div>
            </div>
            <button type="button" (click)="showHistoryModal = false" class="modal-close-btn" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- History Quick KPIs -->
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
              <div class="text-xs text-purple-700 font-semibold">Total Sessions</div>
              <div class="text-lg font-black text-[#2E1065] font-mono">{{ tableHistory.length }}</div>
            </div>
            <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <div class="text-xs text-emerald-700 font-semibold">Total Revenue</div>
              <div class="text-lg font-black text-emerald-800 font-mono">{{ tableHistoryTotalRevenue | appCurrency:'1.0-0' }}</div>
            </div>
            <div class="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
              <div class="text-xs text-blue-700 font-semibold">Avg Turn Time</div>
              <div class="text-lg font-black text-blue-800 font-mono">{{ tableHistoryAvgDuration }} mins</div>
            </div>
          </div>

          <!-- History Table -->
          <div class="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
            <div *ngIf="tableHistory.length === 0" class="p-8 text-center text-xs text-slate-500">
              No completed dining sessions recorded on this table yet.
            </div>
            <table *ngIf="tableHistory.length > 0" class="w-full text-left text-xs border-collapse">
              <thead class="bg-purple-50/70 border-b border-purple-100 text-[#4B5563] font-bold sticky top-0">
                <tr>
                  <th class="p-2.5">Order #</th>
                  <th class="p-2.5">Date & Time</th>
                  <th class="p-2.5">Guests</th>
                  <th class="p-2.5">Turn Time</th>
                  <th class="p-2.5">Bill Total</th>
                  <th class="p-2.5">Server</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let h of tableHistory" class="hover:bg-purple-50/40">
                  <td class="p-2.5 font-bold font-mono text-purple-900">{{ h.order_number }}</td>
                  <td class="p-2.5 text-slate-600">{{ h.order_date | date:'short' }}</td>
                  <td class="p-2.5 font-semibold">👥 {{ h.guest_count || '—' }}</td>
                  <td class="p-2.5">
                    <span class="timer-pill timer-safe">⏱️ {{ h.duration_minutes }}m</span>
                  </td>
                  <td class="p-2.5 font-bold font-mono text-slate-900">{{ h.total_amount | appCurrency:'1.2-2' }}</td>
                  <td class="p-2.5 text-slate-600">{{ h.waiter_name || 'Staff' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end pt-4 mt-4 border-t border-[#E9D5FF]">
            <button type="button" (click)="showHistoryModal = false" class="action-btn btn-outline-purple">
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 8. SEAT GUESTS MODAL                                            -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showSeatModal">
        <div class="modal-content p-6 md:p-7 w-full max-w-md shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl text-purple-700">person_add</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">
                  Seat Table {{ tableToSeat?.table_number }}
                </h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">
                  {{ tableToSeat?.name }} · Capacity: {{ tableToSeat?.capacity }} seats
                </p>
              </div>
            </div>
            <button type="button" (click)="showSeatModal = false" class="modal-close-btn" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <!-- Guest Count Counter -->
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider block mb-1">
                Party Guest Count / Covers
              </label>
              <div class="flex items-center gap-3">
                <div class="guest-stepper">
                  <button
                    type="button"
                    class="guest-stepper-btn"
                    title="One fewer cover"
                    aria-label="Decrease guest count"
                    [disabled]="seatForm.guestCount <= 1"
                    (click)="seatForm.guestCount = (seatForm.guestCount > 1 ? seatForm.guestCount - 1 : 1)"
                  >
                    <span class="material-symbols-outlined">remove</span>
                  </button>
                  <input
                    type="number"
                    min="1"
                    [(ngModel)]="seatForm.guestCount"
                    class="guest-stepper-input font-mono"
                    aria-label="Party guest count"
                  />
                  <button
                    type="button"
                    class="guest-stepper-btn"
                    title="One more cover"
                    aria-label="Increase guest count"
                    (click)="seatForm.guestCount = seatForm.guestCount + 1"
                  >
                    <span class="material-symbols-outlined">add</span>
                  </button>
                </div>
                <span class="guest-capacity-hint">
                  Table capacity is
                  <strong>{{ tableToSeat?.capacity }}</strong>
                </span>
              </div>
              <p *ngIf="seatForm.guestCount > (tableToSeat?.capacity || 0)" class="text-xs text-amber-600 mt-1 font-semibold">
                ⚠️ Guest count exceeds table seating capacity.
              </p>
            </div>

            <!-- Customer Details (optional) -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider block mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  [(ngModel)]="seatForm.customerName"
                  placeholder="e.g. John Doe"
                  class="form-control text-xs w-full"
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider block mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  [(ngModel)]="seatForm.customerPhone"
                  placeholder="Phone number"
                  class="form-control text-xs w-full"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-4 border-t border-[#E9D5FF]">
              <button type="button" (click)="showSeatModal = false" class="action-btn btn-outline-purple">
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmSeatTable(false)"
                class="action-btn btn-outline-purple"
                title="Mark table occupied without jumping straight to POS"
              >
                Seat Only
              </button>
              <button
                type="button"
                (click)="confirmSeatTable(true)"
                class="action-btn btn-gradient-purple"
              >
                Seat & Start Order →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 9. MANAGE OCCUPIED TABLE MODAL                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showManageModal">
        <div class="modal-content p-6 md:p-7 w-full max-w-md shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl text-amber-700">restaurant</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">
                  Manage Table {{ selectedManageTable?.table_number }}
                </h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">
                  {{ selectedManageTable?.name }} · {{ selectedManageTable?.section }}
                </p>
              </div>
            </div>
            <button type="button" (click)="showManageModal = false" class="modal-close-btn" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="space-y-3.5">
            <!-- Active Dine-in Live Timer KPI -->
            <div class="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
              <div>
                <div class="text-xs text-purple-700 font-semibold">Active Dine-in Turn Time</div>
                <div class="text-base font-black text-[#2E1065] mt-0.5 flex items-center gap-1.5">
                  <span class="timer-pill" [ngClass]="'timer-' + turnoverTier(selectedManageTable)">
                    ⏱️ {{ tableElapsedMinutes(selectedManageTable) }} mins
                  </span>
                  <span class="text-xs font-normal text-slate-500">
                    ({{ turnoverTier(selectedManageTable) === 'over' ? 'Turnover Overdue' : turnoverTier(selectedManageTable) === 'warn' ? 'Approaching Turn Limit' : 'In Progress' }})
                  </span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-slate-500">Active Guests</div>
                <div class="text-base font-bold text-slate-800">
                  👥 {{ selectedManageTable?.active_guest_count || selectedManageTable?.capacity }}
                </div>
              </div>
            </div>

            <!-- Current Order & Running Bill -->
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div class="text-xs text-slate-500 font-medium">Active Order</div>
                <div class="font-bold text-sm font-mono text-purple-900">
                  {{ selectedManageTable?.order_number || 'Manual Dine-In Party' }}
                </div>
                <div class="text-xs text-slate-500" *ngIf="selectedManageTable?.customer_name">
                  Guest: {{ selectedManageTable?.customer_name }}
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-slate-500">Running Total</div>
                <div class="text-lg font-black font-mono text-slate-900">
                  {{ selectedManageTable?.order_current_total | appCurrency:'1.2-2' }}
                </div>
              </div>
            </div>

            <!-- Action Buttons Grid -->
            <div class="space-y-2 pt-2">
              <button
                type="button"
                (click)="startOrderForTable(selectedManageTable!); showManageModal = false;"
                class="w-full action-btn btn-gradient-purple justify-center"
              >
                <span class="material-symbols-outlined">point_of_sale</span>
                <span>Open in POS Register →</span>
              </button>

              <button
                type="button"
                (click)="cleanTable(selectedManageTable!.id)"
                class="w-full action-btn btn-outline-purple justify-center text-cyan-700"
              >
                <span class="material-symbols-outlined">cleaning_services</span>
                <span>Guests Finished · Send to Cleaning / Bussing</span>
              </button>

              <button
                type="button"
                (click)="openHistory(selectedManageTable!); showManageModal = false;"
                class="w-full action-btn btn-outline-purple justify-center"
              >
                <span class="material-symbols-outlined">history</span>
                <span>View Past Orders on this Table</span>
              </button>

              <button
                type="button"
                (click)="openTableOptions(selectedManageTable!); showManageModal = false;"
                class="w-full action-btn btn-outline-danger justify-center"
              >
                <span class="material-symbols-outlined">check_circle</span>
                <span>Release Table to Available</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 10. NEW RESERVATION MODAL                                       -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop modal-over-drawer" *ngIf="showNewReservationModal">
        <div class="modal-content p-6 md:p-7 w-full max-w-lg shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl text-purple-700">event_seat</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">Create Table Reservation</h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">Advance booking for upcoming dining guests</p>
              </div>
            </div>
            <button type="button" (click)="showNewReservationModal = false" class="modal-close-btn" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveReservation()" class="space-y-3.5">
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  [(ngModel)]="reservationForm.customer_name"
                  name="r_cust_name"
                  placeholder="e.g. Mohammed Farooq"
                  class="form-control text-sm w-full"
                  required
                />
              </div>

              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  [(ngModel)]="reservationForm.customer_phone"
                  name="r_cust_phone"
                  placeholder="e.g. +91 99887 76655"
                  class="form-control text-sm w-full"
                  required
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider block mb-1">
                  Reservation Date & Time *
                </label>
                <input
                  type="datetime-local"
                  [(ngModel)]="reservationForm.reservation_time"
                  name="r_res_time"
                  class="form-control text-sm w-full"
                  required
                />
              </div>

              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider block mb-1">
                  Party Size (Covers) *
                </label>
                <input
                  type="number"
                  min="1"
                  [(ngModel)]="reservationForm.guest_count"
                  name="r_guest_count"
                  class="form-control font-mono text-sm w-full"
                  required
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider block mb-1">
                  Assign Table (Optional)
                </label>
                <select class="form-control text-sm w-full" [(ngModel)]="reservationForm.table_id" name="r_table_id">
                  <option [ngValue]="null">-- Assign on Arrival / Any Table --</option>
                  <option *ngFor="let t of tables" [ngValue]="t.id">
                    {{ t.table_number }} - {{ t.name }} ({{ t.capacity }} seats, {{ t.section }})
                  </option>
                </select>
              </div>

              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider block mb-1">
                  Preferred Section
                </label>
                <input
                  type="text"
                  [(ngModel)]="reservationForm.preferred_section"
                  name="r_pref_section"
                  placeholder="e.g. VIP Majlis"
                  list="diningSectionOptions"
                  class="form-control text-sm w-full"
                />
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider block mb-1">
                Special Requests / Dietary Notes
              </label>
              <textarea
                [(ngModel)]="reservationForm.special_requests"
                name="r_special_reqs"
                rows="2"
                placeholder="e.g. Birthday celebration, High chair requested, Window view"
                class="form-control text-sm w-full"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-4 border-t border-[#E9D5FF]">
              <button type="button" (click)="showNewReservationModal = false" class="action-btn btn-outline-purple">
                Cancel
              </button>
              <button type="submit" class="action-btn btn-gradient-purple">
                Confirm Reservation ✓
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    DINING_LAYOUT_CSS,
    DEFAULT_ACTION_BUTTON_CSS,
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

      /* ─── Guest count stepper (Seat Guests modal) ───
         The -/+ pair used to be styled with Tailwind purple utilities this
         project does not ship, so both rendered as bare grey squares. Rebuilt
         as one pill whose tint is mixed off the live primary, so it follows
         whatever theme is active instead of staying violet. */
      .guest-stepper {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem;
        border-radius: 9999px;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: color-mix(in srgb, var(--primary, #7E22CE) 5%, #FFFFFF);
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
      }

      .guest-stepper-btn {
        width: 2.5rem;
        height: 2.5rem;
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 9999px;
        cursor: pointer;
        color: #FFFFFF;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #9333EA) 100%);
        box-shadow: 0 6px 14px -7px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
        transition:
          transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 0.18s ease,
          filter 0.18s ease;
      }

      .guest-stepper-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: brightness(1.07);
        box-shadow: 0 10px 20px -8px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.45));
      }

      .guest-stepper-btn:active:not(:disabled) {
        transform: translateY(0) scale(0.93);
        box-shadow: 0 3px 8px -5px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.4));
      }

      .guest-stepper-btn:focus-visible {
        outline: 2px solid var(--primary, #7E22CE);
        outline-offset: 2px;
      }

      /* At one cover there is nothing left to take away. */
      .guest-stepper-btn:disabled {
        cursor: not-allowed;
        color: var(--text-dim, #9CA3AF);
        background: color-mix(in srgb, var(--primary, #7E22CE) 8%, #FFFFFF);
        box-shadow: none;
      }

      .guest-stepper-btn .material-symbols-outlined {
        font-size: 20px;
        font-weight: 600;
        line-height: 1;
      }

      .guest-stepper-input {
        width: 5rem;
        height: 2.5rem;
        border: none;
        background: transparent;
        text-align: center;
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
      }

      .guest-stepper-input:focus {
        outline: none;
      }

      /* The -/+ pair is the control; the native spinners only crowd it. */
      .guest-stepper-input::-webkit-outer-spin-button,
      .guest-stepper-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .guest-stepper-input {
        -moz-appearance: textfield;
        appearance: textfield;
      }

      .guest-capacity-hint {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted, #6B7280);
      }

      .guest-capacity-hint strong {
        font-weight: 800;
        color: var(--primary, #7E22CE);
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
          linear-gradient(
            160deg,
            color-mix(in srgb, var(--primary, #7E22CE) 8%, var(--card-bg, #ffffff)) 0%,
            color-mix(in srgb, var(--primary, #7E22CE) 3%, var(--card-bg, #ffffff)) 42%,
            color-mix(in srgb, var(--primary, #7E22CE) 6%, var(--card-bg, #ffffff)) 74%,
            color-mix(in srgb, var(--primary, #7E22CE) 7%, var(--card-bg, #ffffff)) 100%
          );
        border: 1.5px solid var(--card-border, rgba(126, 34, 206, 0.2));
        border-radius: 22px;
        padding: 1.25rem 1.35rem 1.6rem;
        box-shadow: 0 10px 34px -10px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 1.15rem;
      }

      /* Ambient colour pools - subtle background glow */
      .floor-panel::before {
        content: '';
        position: absolute;
        inset: -30%;
        z-index: -1;
        background:
          radial-gradient(26% 30% at 12% 16%, var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.2)) 0%, transparent 72%),
          radial-gradient(24% 28% at 38% 8%, rgba(29, 78, 216, 0.15) 0%, transparent 72%),
          radial-gradient(26% 30% at 64% 20%, rgba(14, 116, 144, 0.16) 0%, transparent 72%),
          radial-gradient(24% 28% at 90% 12%, rgba(134, 25, 143, 0.14) 0%, transparent 72%),
          radial-gradient(28% 32% at 22% 74%, rgba(4, 120, 87, 0.14) 0%, transparent 72%),
          radial-gradient(26% 30% at 54% 88%, rgba(190, 24, 93, 0.14) 0%, transparent 72%),
          radial-gradient(26% 30% at 86% 76%, rgba(180, 83, 9, 0.12) 0%, transparent 72%);
        opacity: 0.35;
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
        border-bottom: 1px solid var(--card-border, rgba(255, 255, 255, 0.1));
        box-shadow: 0 1px 0 var(--card-border, rgba(255, 255, 255, 0.04));
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
        background: color-mix(in srgb, var(--card-bg, #ffffff) 85%, transparent);
        border: 1px solid var(--card-border, rgba(255, 255, 255, 0.12));
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--text-main, #6B7280);
        padding: 0 0.25rem;
      }

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 9999px;
        display: inline-block;
      }

      .dot-free { background: var(--success, #16A34A); box-shadow: 0 0 8px rgba(var(--success-rgb, 22, 163, 74), 0.7); }
      .dot-busy { background: var(--warning, #EA580C); box-shadow: 0 0 8px rgba(var(--warning-rgb, 234, 88, 12), 0.7); }
      .dot-reserved { background: #6366F1; box-shadow: 0 0 8px rgba(99, 102, 241, 0.7); }
      .dot-cleaning { background: #06B6D4; box-shadow: 0 0 8px rgba(6, 182, 212, 0.7); }
      .dot-blocked { background: var(--danger, #DC2626); box-shadow: 0 0 8px rgba(var(--danger-rgb, 220, 38, 38), 0.7); }

      .floor-empty {
        padding: 2.5rem 1rem;
        border-radius: 18px;
        background: color-mix(in srgb, var(--card-bg, #ffffff) 90%, transparent);
        border: 1px solid var(--card-border, rgba(255, 255, 255, 0.12));
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
      }

      .floor-grid {
        display: grid;
        /* auto-fill keeps the tiles a readable width instead of stretching a
           short row of tables across the whole screen. */
        grid-template-columns: repeat(auto-fill, minmax(264px, 1fr));
        gap: 1.1rem;
      }

      @media (max-width: 600px) {
        .floor-grid {
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
      }

      /* ─── Section identity ───
         Eight jewel hues, assigned to a section by name hash, so any section the
         kitchen invents still gets a stable colour. The hue only ever tints the
         glass and the section chip - it never carries status, which stays
         green / amber / red, and never replaces the purple action accent. */
      .zone-0 { --zone: var(--primary, #7E22CE); --zone-wash: rgba(var(--primary-rgb, 126, 34, 206), 0.16); }
      .zone-1 { --zone: #0E7490; --zone-wash: rgba(14, 116, 144, 0.16); }
      .zone-2 { --zone: #4338CA; --zone-wash: rgba(67, 56, 202, 0.16); }
      .zone-3 { --zone: #BE185D; --zone-wash: rgba(190, 24, 93, 0.15); }
      .zone-4 { --zone: #047857; --zone-wash: rgba(4, 120, 87, 0.15); }
      .zone-5 { --zone: var(--warning, #B45309); --zone-wash: rgba(180, 83, 9, 0.15); }
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
          radial-gradient(85% 58% at 6% -6%, rgba(255, 255, 255, 0.25) 0%, transparent 62%),
          radial-gradient(118% 88% at 100% 0%, var(--status-wash, transparent) 0%, transparent 58%),
          linear-gradient(
            152deg,
            var(--zone-wash, rgba(var(--primary-rgb, 126, 34, 206), 0.14)) 0%,
            color-mix(in srgb, var(--card-bg, #ffffff) 85%, transparent) 46%,
            color-mix(in srgb, var(--card-bg, #ffffff) 65%, transparent) 100%
          );
        backdrop-filter: blur(26px) saturate(190%) brightness(1.04);
        -webkit-backdrop-filter: blur(26px) saturate(190%) brightness(1.04);
        border: 1px solid var(--card-border, rgba(255, 255, 255, 0.25));
        /* Bevelled edge: light catches the top and left, the bottom edge sits
           in its own shadow, which is what gives the pane thickness. */
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.95),
          inset 1px 0 0 rgba(255, 255, 255, 0.55),
          inset -1px 0 0 rgba(255, 255, 255, 0.25),
          inset 0 -1px 0 rgba(0, 0, 0, 0.07),
          0 2px 6px -2px rgba(0, 0, 0, 0.12),
          0 16px 36px -18px var(--tile-shadow, rgba(0, 0, 0, 0.35));
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
          inset 0 -1px 0 rgba(0, 0, 0, 0.07),
          0 4px 10px -4px rgba(0, 0, 0, 0.14),
          0 26px 50px -20px var(--tile-shadow, rgba(0, 0, 0, 0.45));
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
        --tile-shadow: rgba(var(--success-rgb, 22, 163, 74), 0.35);
        --status-wash: rgba(var(--success-rgb, 22, 163, 74), 0.16);
      }

      .table-tile.is-busy {
        --tile-accent: #EA580C;
        --tile-shadow: rgba(var(--warning-rgb, 234, 88, 12), 0.38);
        --status-wash: rgba(var(--warning-rgb, 234, 88, 12), 0.18);
      }

      .table-tile.is-reserved {
        --tile-accent: #6366F1;
        --tile-shadow: rgba(99, 102, 241, 0.38);
        --status-wash: rgba(99, 102, 241, 0.18);
      }

      .table-tile.is-cleaning {
        --tile-accent: #06B6D4;
        --tile-shadow: rgba(6, 182, 212, 0.38);
        --status-wash: rgba(6, 182, 212, 0.18);
      }

      .table-tile.is-blocked {
        --tile-accent: #DC2626;
        --tile-shadow: rgba(var(--danger-rgb, 220, 38, 38), 0.3);
        --status-wash: rgba(var(--danger-rgb, 220, 38, 38), 0.12);
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

      .status-free { color: var(--success, #15803D); }
      .status-busy { color: #C2410C; }
      .status-reserved { color: #4F46E5; }
      .status-cleaning { color: #0891B2; }
      .status-blocked { color: var(--danger, #B91C1C); }

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
        background: rgba(0, 0, 0, 0.09);
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
        background: rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.7);
      }

      .dwell-ticks i.on {
        background: var(--tile-accent, #EA580C);
        border-color: var(--tile-accent, #EA580C);
        box-shadow: 0 0 7px rgba(var(--warning-rgb, 234, 88, 12), 0.45);
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
          inset 0 -1px 0 rgba(0, 0, 0, 0.05);
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
        border-left: 1px solid rgba(0, 0, 0, 0.07);
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
        color: var(--danger, #B91C1C);
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
        background: var(--danger-light, #FEE2E2);
        border-color: var(--danger, #DC2626);
      }

      .font-mono {
        font-family: 'JetBrains Mono', monospace;
      }

      /* Header count badge */
      .header-badge-count {
        position: absolute;
        top: -6px;
        right: -6px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: 9999px;
        background: var(--danger, #DC2626);
        color: #ffffff;
        font-size: 10px;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(var(--danger-rgb, 220, 38, 38), 0.4);
      }

      /* KPI Tints */
      .bg-indigo-tint {
        background: #EEF2FF;
        color: #4F46E5;
      }
      .bg-teal-tint {
        background: #ECFEFF;
        color: #0891B2;
      }

      /* Modals opened from inside a drawer.
         New Booking / Create Reservation is reached only through the
         reservations drawer's own buttons, and .modal-backdrop's z-index of
         1000 puts it behind the drawer that opened it. It goes above the
         drawer, and below the shared confirmation dialog (100000) so a
         confirm raised from the form still lands on top. */
      .modal-over-drawer {
        z-index: 10000;
      }

      /* Sliding Drawers */
      .drawer-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9998;
        background: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: flex-end;
      }

      .drawer-panel {
        width: 100%;
        max-width: 440px;
        height: 100%;
        background: #ffffff;
        box-shadow: -10px 0 30px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        animation: drawerSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes drawerSlideIn {
        from { transform: translateX(100%); }
        to   { transform: translateX(0); }
      }

      .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.15rem 1.35rem;
        background: var(--bg-app, #FAF5FF);
        border-bottom: 1.5px solid var(--card-border, #E9D5FF);
      }

      .drawer-title {
        font-family: 'Outfit', sans-serif;
        font-size: 1.05rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
        margin: 0;
      }

      .drawer-subtitle {
        font-size: 0.72rem;
        color: var(--text-muted, #6B7280);
        margin: 0.15rem 0 0;
      }

      .drawer-icon-bubble {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .drawer-body {
        flex: 1;
        /* A flex item is floored at its content height unless told otherwise,
           which would make this pane grow instead of scroll. */
        min-height: 0;
        overflow-y: auto;
        padding: 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }

      .btn-sm {
        padding: 0.35rem 0.75rem;
        font-size: 0.75rem;
      }

      /* Reservation Cards */
      .reservation-card {
        background: #ffffff;
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: 14px;
        padding: 0.85rem 1rem;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        transition: all 0.2s ease;
      }

      .reservation-card:hover {
        border-color: #C084FC;
        box-shadow: 0 6px 16px rgba(var(--primary-rgb, 126, 34, 206), 0.08);
      }

      .reservation-card.is-seated {
        opacity: 0.65;
        background: #F9FAFB;
      }

      .res-code-badge {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        font-weight: 900;
        color: #4F46E5;
        background: #EEF2FF;
        border: 1.5px solid #C7D2FE;
        border-radius: 8px;
        padding: 0.15rem 0.45rem;
      }

      .status-chip {
        font-size: 0.65rem;
        font-weight: 800;
        padding: 0.2rem 0.55rem;
        border-radius: 9999px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .chip-confirmed { background: #EEF2FF; color: #4F46E5; }
      .chip-seated { background: #ECFDF5; color: #059669; }
      .chip-cancelled { background: #FEF2F2; color: var(--danger, #DC2626); }

      .reservation-meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }

      .meta-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.7rem;
        color: var(--text-muted, #4B5563);
        background: #F3F4F6;
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        font-weight: 500;
      }
    `,
  ],
})
export class DiningComponent implements OnInit, OnDestroy {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  public diningLayout = inject(DiningLayoutService);
  private diningService = inject(DiningService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  public tables: DiningTable[] = [];
  public filteredTables: DiningTable[] = [];
  public sections: string[] = [];
  public selectedSection: string | null = null;

  public reservations: TableReservation[] = [];
  public tableHistory: TableHistoryItem[] = [];
  public selectedHistoryTable: DiningTable | null = null;
  public selectedManageTable: DiningTable | null = null;
  public tableToSeat: DiningTable | null = null;

  public showTableModal = false;
  public editingTableId: number | null = null;
  public showReservationDrawer = false;
  public showHistoryModal = false;
  public showSeatModal = false;
  public showManageModal = false;
  public showNewReservationModal = false;

  public seatForm = {
    guestCount: 2,
    customerName: '',
    customerPhone: '',
  };

  public reservationForm: any = {
    customer_name: '',
    customer_phone: '',
    guest_count: 4,
    reservation_time: '',
    table_id: null as number | null,
    preferred_section: '',
    special_requests: '',
  };

  private nowMs = Date.now();
  private clockTimer: ReturnType<typeof setInterval> | null = null;

  /** Fixed floor plan areas — a table always belongs to one of these six. */
  public sectionOptions: DropdownOption[] = [
    { value: 'Main AC Hall', label: 'Main AC Hall', icon: 'ac_unit', description: 'Air conditioned main dining hall' },
    { value: 'Majlis Carpet Floor', label: 'Majlis Carpet Floor', icon: 'weekend', description: 'Traditional floor seating majlis' },
    { value: 'Family Enclosure', label: 'Family Enclosure', icon: 'family_restroom', description: 'Curtained family cabins' },
    { value: 'Outdoor Terrace', label: 'Outdoor Terrace', icon: 'deck', description: 'Open air terrace seating' },
    { value: 'Rooftop Garden', label: 'Rooftop Garden', icon: 'yard', description: 'Rooftop garden dining' },
    { value: 'VIP Private Cabin', label: 'VIP Private Cabin', icon: 'diamond', description: 'Private cabins for VIP guests' },
  ];

  public tableStatusOptions: DropdownOption[] = [
    { value: 'AVAILABLE', label: 'AVAILABLE', icon: 'check_circle', description: 'Table ready for incoming guests' },
    { value: 'OCCUPIED', label: 'OCCUPIED', icon: 'restaurant', description: 'Guests dining currently' },
    { value: 'RESERVED', label: 'RESERVED', icon: 'event_seat', description: 'Reserved for upcoming booking' },
    { value: 'CLEANING', label: 'CLEANING', icon: 'cleaning_services', description: 'Bussing & sanitizing' },
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
    this.loadReservations();
    this.clockTimer = setInterval(() => {
      this.nowMs = Date.now();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  public get confirmedReservationsCount(): number {
    return this.reservations.filter((r) => r.status === 'CONFIRMED').length;
  }

  public get availableTables(): DiningTable[] {
    return this.tables.filter((t) => t.status === 'AVAILABLE');
  }

  public get tableHistoryTotalRevenue(): number {
    return this.tableHistory.reduce((sum, h) => sum + (Number(h.total_amount) || 0), 0);
  }

  public get tableHistoryAvgDuration(): number {
    if (!this.tableHistory.length) return 0;
    const total = this.tableHistory.reduce((sum, h) => sum + (Number(h.duration_minutes) || 0), 0);
    return Math.round(total / this.tableHistory.length);
  }

  public get totalSeats(): number {
    return this.tables.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);
  }

  public get seatsOccupied(): number {
    return this.tables
      .filter((t) => t.status === 'OCCUPIED')
      .reduce((sum, t) => sum + (Number(t.active_guest_count || t.capacity) || 0), 0);
  }

  public get occupancyRate(): number {
    const seatable = this.tables.filter((t) => t.status !== 'UNAVAILABLE').length;
    if (!seatable) return 0;
    return Math.round((this.countStatus('OCCUPIED') / seatable) * 100);
  }

  public countStatus(status: TableStatus): number {
    return this.tables.filter((t) => t.status === status).length;
  }

  public sectionCount(section: string): number {
    return this.tables.filter((t) => t.section === section).length;
  }

  public trackByTableId(_index: number, table: DiningTable): number {
    return table.id;
  }

  public trackByIndex(index: number): number {
    return index;
  }

  public tileClasses(table: DiningTable): string[] {
    const status =
      table.status === 'AVAILABLE'
        ? 'is-free'
        : table.status === 'OCCUPIED'
          ? 'is-busy'
          : table.status === 'RESERVED'
            ? 'is-reserved'
            : table.status === 'CLEANING'
              ? 'is-cleaning'
              : 'is-blocked';
    return [status, 'zone-' + this.sectionIndex(table.section)];
  }

  public statusClass(status: TableStatus): string {
    switch (status) {
      case 'AVAILABLE': return 'status-free';
      case 'OCCUPIED': return 'status-busy';
      case 'RESERVED': return 'status-reserved';
      case 'CLEANING': return 'status-cleaning';
      case 'UNAVAILABLE': return 'status-blocked';
      default: return 'status-free';
    }
  }

  public statusLabel(status: TableStatus): string {
    switch (status) {
      case 'AVAILABLE': return 'Free';
      case 'OCCUPIED': return 'Occupied';
      case 'RESERVED': return 'Reserved';
      case 'CLEANING': return 'Cleaning';
      case 'UNAVAILABLE': return 'Out of service';
      default: return status;
    }
  }

  public sectionIndex(section: string): number {
    const name = (section || '').trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return hash % 8;
  }

  public tileAction(table: DiningTable): string {
    switch (table.status) {
      case 'AVAILABLE': return 'Seat Guests';
      case 'OCCUPIED': return 'Manage';
      case 'RESERVED': return 'Seat Booking';
      case 'CLEANING': return 'Finish Cleaning';
      case 'UNAVAILABLE': return 'Restore';
      default: return 'Manage';
    }
  }

  public tileActionIcon(table: DiningTable): string {
    switch (table.status) {
      case 'AVAILABLE': return 'person_add';
      case 'OCCUPIED': return 'restaurant_menu';
      case 'RESERVED': return 'event_seat';
      case 'CLEANING': return 'cleaning_services';
      case 'UNAVAILABLE': return 'build';
      default: return 'bolt';
    }
  }

  public tableElapsedMinutes(table?: DiningTable | null): number {
    if (!table) return 0;
    if (table.elapsed_minutes !== undefined && table.elapsed_minutes !== null) {
      return table.elapsed_minutes;
    }
    const started = this.startedAt(table);
    if (!started) return 0;
    return Math.max(0, Math.floor((this.nowMs - started) / 60000));
  }

  public tableCleaningMinutes(table?: DiningTable | null): number {
    if (!table) return 0;
    if (table.cleaning_minutes !== undefined && table.cleaning_minutes !== null) {
      return table.cleaning_minutes;
    }
    if (!table.cleaning_started_at) return 0;
    const started = new Date(table.cleaning_started_at).getTime();
    if (isNaN(started)) return 0;
    return Math.max(0, Math.floor((this.nowMs - started) / 60000));
  }

  public turnoverTier(table?: DiningTable | null): 'safe' | 'warn' | 'over' {
    const mins = this.tableElapsedMinutes(table);
    if (mins > 75) return 'over';
    if (mins >= 45) return 'warn';
    return 'safe';
  }

  public onTileClick(table: DiningTable, event: Event): void {
    if (event instanceof KeyboardEvent) event.preventDefault();

    if (table.status === 'AVAILABLE') {
      this.openSeatModal(table);
    } else if (table.status === 'OCCUPIED') {
      this.openManageModal(table);
    } else if (table.status === 'RESERVED') {
      this.promptSeatReservation(table);
    } else if (table.status === 'CLEANING') {
      this.finishCleaning(table.id);
    } else {
      this.editTable(table, event);
    }
  }

  public minutesSeated(table: DiningTable): number | null {
    const started = this.startedAt(table);
    if (started === null) return null;
    return Math.max(0, Math.floor((this.nowMs - started) / 60000));
  }

  public dwellText(table: DiningTable): string {
    const mins = this.minutesSeated(table);
    if (mins === null) return '';
    return mins >= 60
      ? `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`
      : `${mins}m`;
  }

  public seatedClock(table: DiningTable): string {
    const started = this.startedAt(table);
    if (started === null) return '';
    const d = new Date(started);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  public dwellTicks(table: DiningTable): boolean[] {
    const mins = this.minutesSeated(table);
    const lit = mins === null ? 0 : Math.min(DwellRail.TICKS, Math.max(1, Math.ceil(mins / DwellRail.MINUTES_PER_TICK)));
    return Array.from({ length: DwellRail.TICKS }, (_, i) => i < lit);
  }

  public isOverTurn(table: DiningTable): boolean {
    const mins = this.minutesSeated(table);
    return mins !== null && mins > DwellRail.TICKS * DwellRail.MINUTES_PER_TICK;
  }

  public perSeat(table: DiningTable): number {
    const capacity = Number(table.capacity) || 0;
    const total = Number(table.order_current_total) || 0;
    return capacity > 0 ? total / capacity : total;
  }

  private startedAt(table: DiningTable): number | null {
    const time = table.seated_at || table.order_start_time;
    if (!time) return null;
    const raw = String(time).trim().replace(' ', 'T');
    const ms = new Date(raw).getTime();
    return Number.isFinite(ms) ? ms : null;
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

  loadReservations(): void {
    this.diningService.getReservations().subscribe({
      next: (res) => {
        if (res.success) this.reservations = res.data;
      },
      error: () => {},
    });
  }

  extractSections(): void {
    const secSet = new Set<string>();
    for (const t of this.tables) {
      if (t.section) secSet.add(t.section);
    }
    this.sections = Array.from(secSet);
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

  openSeatModal(table: DiningTable): void {
    this.tableToSeat = table;
    this.seatForm = {
      guestCount: Math.min(table.capacity, 2),
      customerName: '',
      customerPhone: '',
    };
    this.showSeatModal = true;
  }

  confirmSeatTable(startPosOrder: boolean = true): void {
    if (!this.tableToSeat) return;
    const table = this.tableToSeat;
    const count = Number(this.seatForm.guestCount) || table.capacity;

    this.diningService.seatGuests(table.id, count).subscribe({
      next: () => {
        this.notify.success(`Table ${table.table_number} seated with ${count} guests`);
        this.showSeatModal = false;
        this.loadTables();
        if (startPosOrder) {
          this.startOrderForTable(table, count);
        }
      },
      error: () => {},
    });
  }

  openManageModal(table: DiningTable): void {
    this.selectedManageTable = table;
    this.showManageModal = true;
  }

  cleanTable(tableId: number): void {
    this.diningService.cleanTable(tableId).subscribe({
      next: () => {
        this.notify.info('Table marked for cleaning');
        this.showManageModal = false;
        this.loadTables();
      },
      error: () => {},
    });
  }

  finishCleaning(tableId: number): void {
    this.diningService.finishCleaning(tableId).subscribe({
      next: () => {
        this.notify.success('Table is clean and ready for guests!');
        this.loadTables();
      },
      error: () => {},
    });
  }

  promptSeatReservation(table: DiningTable): void {
    if (table.reservation_id) {
      this.notify.confirm({
        title: `Seat Reservation on ${table.table_number}`,
        message: `Seat ${table.reservation_customer || 'the reserved party'} (${table.reservation_guests || table.capacity} guests)?`,
        confirmText: 'Seat Guests & Start Order',
        onConfirm: () => {
          this.diningService.seatReservation(table.reservation_id!, table.id).subscribe({
            next: () => {
              this.notify.success(`Reservation seated at Table ${table.table_number}`);
              this.loadTables();
              this.loadReservations();
              this.startOrderForTable(table, table.reservation_guests || table.capacity);
            },
            error: () => {},
          });
        },
      });
    } else {
      this.openSeatModal(table);
    }
  }

  openHistory(table: DiningTable, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedHistoryTable = table;
    this.diningService.getTableHistory(table.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.tableHistory = res.data;
          this.showHistoryModal = true;
        }
      },
      error: () => {},
    });
  }

  openReservationsDrawer(): void {
    this.loadReservations();
    this.showReservationDrawer = true;
  }

  openNewReservationModal(): void {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    d.setMinutes(0);
    const timeStr = d.toISOString().slice(0, 16);

    this.reservationForm = {
      customer_name: '',
      customer_phone: '',
      guest_count: 4,
      reservation_time: timeStr,
      table_id: null,
      preferred_section: this.selectedSection || '',
      special_requests: '',
    };
    this.showNewReservationModal = true;
  }

  saveReservation(): void {
    if (!this.reservationForm.customer_name || !this.reservationForm.customer_phone || !this.reservationForm.reservation_time) {
      this.notify.error('Please enter customer name, phone number, and reservation time');
      return;
    }
    this.diningService.createReservation(this.reservationForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success(`Reservation ${res.data.reservation_code} confirmed!`);
          this.showNewReservationModal = false;
          this.loadReservations();
          this.loadTables();
        }
      },
      error: () => {},
    });
  }

  seatReservation(reservation: TableReservation): void {
    let targetTableId = reservation.table_id;
    if (!targetTableId) {
      const match = this.tables.find((t) => t.status === 'AVAILABLE' && t.capacity >= reservation.guest_count);
      if (!match) {
        this.notify.error('No available table found with sufficient capacity. Please free a table first.');
        return;
      }
      targetTableId = match.id;
    }

    this.diningService.seatReservation(reservation.id, targetTableId).subscribe({
      next: () => {
        this.notify.success(`Reservation ${reservation.reservation_code} seated!`);
        this.loadReservations();
        this.loadTables();
      },
      error: () => {},
    });
  }

  cancelReservation(reservationId: number): void {
    this.notify.confirm({
      title: 'Cancel Reservation',
      message: 'Are you sure you want to cancel this booking?',
      confirmText: 'Cancel Booking',
      isDestructive: true,
      onConfirm: () => {
        this.diningService.cancelReservation(reservationId).subscribe({
          next: () => {
            this.notify.info('Reservation cancelled');
            this.loadReservations();
            this.loadTables();
          },
          error: () => {},
        });
      },
    });
  }

  startOrderForTable(table: DiningTable, guestCount?: number): void {
    this.cartService.orderType.set('DINING');
    this.cartService.selectedTable.set({
      ...table,
      active_guest_count: guestCount || table.active_guest_count || table.capacity,
    });
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
      section: this.normalizeSection(this.selectedSection),
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
      section: this.normalizeSection(table.section),
      capacity: table.capacity,
      status: table.status,
    };
    this.showTableModal = true;
  }

  /** Legacy/free-text sections are snapped to the fixed list so the dropdown never opens blank. */
  private normalizeSection(section: string | null | undefined): string {
    const match = this.sectionOptions.find((o) => o.value === section);
    return match ? String(match.value) : String(this.sectionOptions[0].value);
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
        error: () => {},
      });
    } else {
      this.diningService.createTable(this.tableForm).subscribe({
        next: () => {
          this.notify.success('Table created successfully');
          this.showTableModal = false;
          this.loadTables();
        },
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
          error: () => {},
        });
      },
    });
  }
}

