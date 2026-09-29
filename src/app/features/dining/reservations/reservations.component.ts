import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DiningService, ReservationList, ReservationRow } from '../../../core/services/dining.service';
import { CartService } from '../../../core/services/cart.service';
import { CustomerService } from '../../../core/services/customer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Customer, DiningTable } from '../../../core/models';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';
import { CustomDropdownComponent, DropdownOption } from '../../../shared/components/custom-dropdown/custom-dropdown.component';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';
import { DEFAULT_ACTION_BUTTON_CSS } from '../../../shared/styles/default-action-buttons.styles';

type Range = 'today' | 'tomorrow' | 'week' | 'upcoming' | 'past' | 'date';
type StatusFilter = '' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW';

interface DayGroup {
  key: string;
  date: Date | null;
  rows: ReservationRow[];
  covers: number;
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageLoaderComponent, CustomDropdownComponent, DatePickerComponent],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading && !data"
        [error]="loadError"
        message="Loading reservations…"
        subMessage="Fetching bookings and table availability."
        icon="event_seat"
        (retry)="load()"
      ></app-page-loader>

      <div class="breadcrumbs-row">
        <span>Floor Operations</span>
        <span class="breadcrumb-separator">›</span>
        <a routerLink="/dining" class="breadcrumb-link">Dining &amp; Seating Map</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Reservations</span>
      </div>

      <ng-container *ngIf="data">
        <!-- Header -->
        <div class="module-header-card">
          <div class="header-left">
            <button type="button" class="rv-back" (click)="goBack()" title="Back to Dining" aria-label="Back to Dining">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <div class="header-icon-box">
              <span class="material-symbols-outlined">event_seat</span>
            </div>
            <div>
              <div class="header-title-flex">
                <h1 class="page-title">Table Reservations</h1>
              </div>
              <div class="header-meta-row">
                <span class="meta-item">
                  <span class="material-symbols-outlined meta-icon">today</span>
                  <span>Today: <strong>{{ data.today.bookings }}</strong> bookings</span>
                </span>
                <span class="meta-dot">•</span>
                <span class="meta-item">
                  <span class="material-symbols-outlined meta-icon">groups</span>
                  <span><strong>{{ data.today.covers }}</strong> covers expected</span>
                </span>
              </div>
            </div>
          </div>
          <div class="header-action-buttons">
            <button type="button" class="action-btn btn-outline-purple" (click)="load()" [disabled]="isLoading" title="Reload">
              <span class="material-symbols-outlined" [class.rv-spin]="isLoading">refresh</span>
              <span>Refresh</span>
            </button>
            <button type="button" class="action-btn btn-gradient-purple" (click)="openBooking()">
              <span class="material-symbols-outlined">add</span>
              <span>New Booking</span>
            </button>
          </div>
        </div>

        <!-- KPIs (always today, independent of the filters below) -->
        <div class="rv-kpis">
          <div class="rv-kpi">
            <span class="rv-kpi-icon tone-primary"><span class="material-symbols-outlined">event_available</span></span>
            <div>
              <span class="rv-kpi-label">Today's Bookings</span>
              <strong class="rv-kpi-value">{{ data.today.bookings }}</strong>
              <span class="rv-kpi-sub">{{ data.today.seated }} already seated</span>
            </div>
          </div>
          <div class="rv-kpi">
            <span class="rv-kpi-icon tone-info"><span class="material-symbols-outlined">groups</span></span>
            <div>
              <span class="rv-kpi-label">Covers Today</span>
              <strong class="rv-kpi-value">{{ data.today.covers }}</strong>
              <span class="rv-kpi-sub">Confirmed + seated guests</span>
            </div>
          </div>
          <div class="rv-kpi">
            <span class="rv-kpi-icon tone-warn"><span class="material-symbols-outlined">hourglass_top</span></span>
            <div>
              <span class="rv-kpi-label">Awaiting Arrival</span>
              <strong class="rv-kpi-value">{{ data.today.pending }}</strong>
              <span class="rv-kpi-sub">Confirmed for today</span>
            </div>
          </div>
          <div class="rv-kpi" [class.is-alert]="lateCount > 0">
            <span class="rv-kpi-icon tone-danger"><span class="material-symbols-outlined">alarm</span></span>
            <div>
              <span class="rv-kpi-label">Running Late</span>
              <strong class="rv-kpi-value">{{ lateCount }}</strong>
              <span class="rv-kpi-sub">Past booking time, not seated</span>
            </div>
          </div>
        </div>

        <!-- Filters + list -->
        <div class="rv-panel">
          <div class="rv-toolbar">
            <div class="rv-chips" aria-label="Date range">
              <button
                type="button"
                *ngFor="let r of ranges"
                class="rv-chip"
                [class.is-active]="range === r.key"
                (click)="setRange(r.key)"
              >{{ r.label }}</button>
            </div>
            <app-date-picker
              *ngIf="range === 'date'"
              class="rv-date"
              [(ngModel)]="pickedDate"
              (valueChange)="setRange('date')"
              [clearable]="false"
              label="Reservation date"
              placeholder="Pick a date"
              minWidth="170px"
            ></app-date-picker>
            <div class="rv-search">
              <span class="material-symbols-outlined">search</span>
              <input
                type="text"
                class="form-control"
                placeholder="Name, phone or booking code"
                [ngModel]="search"
                (ngModelChange)="onSearch($event)"
              />
            </div>
          </div>

          <div class="rv-status-row">
            <button
              type="button"
              *ngFor="let s of statuses"
              class="rv-status-tab"
              [class.is-active]="status === s.key"
              [ngClass]="'st-' + (s.key || 'all').toLowerCase()"
              (click)="setStatus(s.key)"
            >
              <span>{{ s.label }}</span>
              <em>{{ statusCount(s.key) }}</em>
            </button>
          </div>

          <div class="rv-list" [class.is-busy]="isLoading">
            <section class="rv-day" *ngFor="let g of groups; trackBy: trackByKey">
              <header class="rv-day-head">
                <strong>{{ dayTitle(g.date) }}</strong>
                <span>{{ g.date | date: 'EEEE, d MMM yyyy' }}</span>
                <em>{{ g.rows.length }} {{ g.rows.length === 1 ? 'booking' : 'bookings' }} · {{ g.covers }} covers</em>
              </header>

              <article
                *ngFor="let r of g.rows; trackBy: trackById"
                class="rv-row"
                [ngClass]="'st-' + r.status.toLowerCase()"
                [class.is-late]="isLate(r)"
              >
                <div class="rv-time">
                  <strong>{{ asDate(r.reservation_time) | date: 'h:mm' }}</strong>
                  <small>{{ asDate(r.reservation_time) | date: 'a' }}</small>
                </div>

                <div class="rv-main">
                  <div class="rv-name-row">
                    <span class="rv-name">{{ r.customer_name }}</span>
                    <span class="rv-code">{{ r.reservation_code }}</span>
                    <span class="rv-pill" [ngClass]="'st-' + r.status.toLowerCase()">{{ statusLabel(r.status) }}</span>
                    <span class="rv-pill st-late" *ngIf="isLate(r)">Late {{ duration(-minutesUntil(r)) }}</span>
                    <span class="rv-pill st-soon" *ngIf="isSoon(r)">In {{ duration(minutesUntil(r)) }}</span>
                  </div>
                  <div class="rv-meta">
                    <span><span class="material-symbols-outlined">call</span>{{ r.customer_phone }}</span>
                    <span><span class="material-symbols-outlined">group</span>{{ r.guest_count }} guests</span>
                    <span *ngIf="r.table_number" class="rv-table">
                      <span class="material-symbols-outlined">table_restaurant</span>{{ r.table_number }}
                      <ng-container *ngIf="r.table_section"> · {{ r.table_section }}</ng-container>
                    </span>
                    <span *ngIf="!r.table_number" class="rv-muted">
                      <span class="material-symbols-outlined">location_on</span>{{ r.preferred_section || 'Any section' }} · table on arrival
                    </span>
                  </div>
                  <p class="rv-note" *ngIf="r.special_requests">
                    <span class="material-symbols-outlined">sticky_note_2</span>{{ r.special_requests }}
                  </p>
                </div>

                <div class="rv-actions" *ngIf="r.status === 'CONFIRMED'">
                  <button type="button" class="action-btn btn-gradient-purple btn-sm" (click)="openSeat(r)">
                    <span class="material-symbols-outlined">how_to_reg</span>
                    <span>Seat</span>
                  </button>
                  <button
                    type="button"
                    class="rv-icon-btn"
                    *ngIf="isPast(r)"
                    (click)="markNoShow(r)"
                    title="Guest did not arrive"
                  >
                    <span class="material-symbols-outlined">person_off</span>
                  </button>
                  <button type="button" class="rv-icon-btn is-danger" (click)="cancel(r)" title="Cancel booking">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div class="rv-actions rv-done" *ngIf="r.status === 'SEATED'">
                  <span class="material-symbols-outlined">check_circle</span>Seated
                </div>
              </article>
            </section>

            <div class="rv-empty" *ngIf="!groups.length && !isLoading">
              <span class="material-symbols-outlined">calendar_today</span>
              <strong>{{ search || status ? 'No bookings match these filters' : 'No reservations ' + rangeEmptyText() }}</strong>
              <p>Book tables ahead for family dinners, VIP guests and large parties.</p>
              <button type="button" class="action-btn btn-gradient-purple" (click)="openBooking()">
                <span class="material-symbols-outlined">add</span>
                <span>Create Reservation</span>
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ═══ New booking ═══ -->
      <div class="modal-backdrop" *ngIf="showBooking">
        <div class="modal-content rv-modal">
          <div class="rv-modal-head">
            <span class="rv-modal-icon"><span class="material-symbols-outlined">event_seat</span></span>
            <div>
              <h3>New Reservation</h3>
              <p>Hold a table for guests arriving later</p>
            </div>
            <button type="button" class="modal-close-btn" (click)="showBooking = false" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveBooking()" class="rv-form">
            <div class="rv-grid">
              <div class="rv-field">
                <label>Customer name *</label>
                <div class="rv-lookup">
                  <span class="material-symbols-outlined">{{ bookingCustomer ? 'how_to_reg' : 'search' }}</span>
                  <input
                    type="text"
                    class="form-control"
                    name="b_name"
                    autocomplete="off"
                    placeholder="Search or type a new name"
                    [class.is-linked]="bookingCustomer"
                    [ngModel]="form.customerName"
                    (ngModelChange)="onBookingName($event)"
                    (blur)="closeLookupSoon()"
                  />
                </div>
                <div class="rv-lookup-menu" *ngIf="lookupOpen">
                  <button
                    type="button"
                    *ngFor="let c of lookupResults"
                    class="rv-lookup-item"
                    (mousedown)="pickCustomer(c); $event.preventDefault()"
                  >
                    <span class="rv-avatar">{{ (c.name || '?').charAt(0).toUpperCase() }}</span>
                    <span><strong>{{ c.name }}</strong><small>{{ c.phone || 'No phone' }}</small></span>
                  </button>
                </div>
              </div>
              <div class="rv-field">
                <label>Phone *</label>
                <input type="tel" class="form-control" name="b_phone" [(ngModel)]="form.customerPhone" placeholder="Phone number" />
              </div>

              <div class="rv-field">
                <label>Date &amp; time *</label>
                <input type="datetime-local" class="form-control" name="b_time" [(ngModel)]="form.reservationTime" [min]="minDateTime" />
              </div>
              <div class="rv-field">
                <label>Party size *</label>
                <div class="rv-stepper">
                  <button type="button" (click)="form.guestCount = form.guestCount > 1 ? form.guestCount - 1 : 1" [disabled]="form.guestCount <= 1">
                    <span class="material-symbols-outlined">remove</span>
                  </button>
                  <input type="number" min="1" name="b_guests" [(ngModel)]="form.guestCount" />
                  <button type="button" (click)="form.guestCount = form.guestCount + 1">
                    <span class="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>

              <div class="rv-field">
                <label>Assign table</label>
                <app-custom-dropdown
                  [options]="tableOptions"
                  [(ngModel)]="form.tableId"
                  name="b_table"
                  placeholder="Assign on arrival"
                  minWidth="100%"
                ></app-custom-dropdown>
                <small class="rv-hint" *ngIf="!bookableTables.length">No free table seats {{ form.guestCount }}. Assign on arrival.</small>
              </div>
              <div class="rv-field">
                <label>Preferred section</label>
                <app-custom-dropdown
                  [options]="sectionOptions"
                  [(ngModel)]="form.preferredSection"
                  (ngModelChange)="onSectionChange()"
                  name="b_section"
                  placeholder="Any section"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>

              <div class="rv-field rv-span">
                <label>Special requests</label>
                <textarea
                  class="form-control"
                  rows="2"
                  name="b_notes"
                  [(ngModel)]="form.specialRequests"
                  placeholder="Birthday, high chair, window seat…"
                ></textarea>
              </div>
            </div>

            <div class="rv-modal-foot">
              <button type="button" class="action-btn btn-outline-purple" (click)="showBooking = false">Cancel</button>
              <button type="submit" class="action-btn btn-gradient-purple" [disabled]="saving">
                <span class="material-symbols-outlined">check</span>
                <span>Confirm Booking</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══ Seat a booking ═══ -->
      <div class="modal-backdrop" *ngIf="seating">
        <div class="modal-content rv-modal rv-modal-sm">
          <div class="rv-modal-head">
            <span class="rv-modal-icon"><span class="material-symbols-outlined">how_to_reg</span></span>
            <div>
              <h3>Seat {{ seating.customer_name }}</h3>
              <p>{{ seating.guest_count }} guests · {{ asDate(seating.reservation_time) | date: 'h:mm a' }} · {{ seating.reservation_code }}</p>
            </div>
            <button type="button" class="modal-close-btn" (click)="seating = null" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <p class="rv-seat-label">Choose a table</p>
          <div class="rv-seat-grid">
            <button
              type="button"
              *ngFor="let t of seatOptions"
              class="rv-seat-opt"
              [class.is-picked]="seatTableId === t.id"
              [class.is-small]="t.capacity < seating.guest_count"
              (click)="seatTableId = t.id"
            >
              <strong>{{ t.table_number }}</strong>
              <small>{{ t.capacity }} seats · {{ t.section }}</small>
              <em *ngIf="t.id === seating.table_id">Held for this booking</em>
              <em *ngIf="t.id !== seating.table_id && t.capacity < seating.guest_count" class="is-warn">Too small</em>
            </button>
          </div>
          <div class="rv-empty rv-empty-sm" *ngIf="!seatOptions.length">
            <strong>No free tables right now</strong>
            <p>Release or clean a table on the floor map first.</p>
          </div>

          <div class="rv-modal-foot">
            <button type="button" class="action-btn btn-outline-purple" (click)="seating = null">Cancel</button>
            <button type="button" class="action-btn btn-outline-purple" [disabled]="!seatTableId || saving" (click)="confirmSeat(false)">Seat Only</button>
            <button type="button" class="action-btn btn-gradient-purple" [disabled]="!seatTableId || saving" (click)="confirmSeat(true)">
              Seat &amp; Start Order →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    DEFAULT_ACTION_BUTTON_CSS,
    `
      .rv-back {
        width: 40px; height: 40px; flex: 0 0 auto;
        display: inline-flex; align-items: center; justify-content: center;
        border-radius: 12px; border: 1px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #FFFFFF); color: var(--text-main, #2E1065);
        cursor: pointer; transition: background 0.15s, transform 0.15s;
      }
      .rv-back:hover { background: color-mix(in srgb, var(--primary, #7E22CE) 12%, var(--card-bg, #FFFFFF)); transform: translateX(-2px); }
      .rv-spin { animation: rv-spin 0.9s linear infinite; }
      @keyframes rv-spin { to { transform: rotate(360deg); } }

      /* KPIs */
      .rv-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 16px 0; }
      .rv-kpi {
        display: flex; align-items: center; gap: 14px; padding: 16px 18px;
        border-radius: 16px; border: 1px solid var(--card-border, #E9D5FF); background: var(--card-bg, #FFFFFF);
      }
      .rv-kpi.is-alert { border-color: color-mix(in srgb, var(--danger, #EF4444) 45%, var(--card-border, #E9D5FF)); }
      .rv-kpi > div { display: flex; flex-direction: column; min-width: 0; }
      .rv-kpi-icon {
        --tone: var(--primary, #7E22CE);
        width: 44px; height: 44px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
        border-radius: 12px; color: var(--tone); background: color-mix(in srgb, var(--tone) 15%, transparent);
      }
      .rv-kpi-icon.tone-info { --tone: #3B82F6; }
      .rv-kpi-icon.tone-warn { --tone: #F59E0B; }
      .rv-kpi-icon.tone-danger { --tone: var(--danger, #EF4444); }
      .rv-kpi-label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted, #6B7280); }
      .rv-kpi-value { font-size: 1.45rem; font-weight: 900; line-height: 1.2; color: var(--text-main, #2E1065); }
      .rv-kpi-sub { font-size: 11px; color: var(--text-muted, #6B7280); }

      /* Panel */
      .rv-panel { border-radius: 16px; border: 1px solid var(--card-border, #E9D5FF); background: var(--card-bg, #FFFFFF); overflow: hidden; }
      .rv-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 14px 16px; }
      .rv-chips {
        display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 4px; border-radius: 12px;
        background: color-mix(in srgb, var(--primary, #7E22CE) 6%, var(--card-bg, #FFFFFF));
        border: 1px solid var(--card-border, #E9D5FF);
      }
      .rv-chip {
        padding: 6px 12px; border: none; border-radius: 9px; background: transparent;
        color: var(--text-muted, #6B7280); font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap;
      }
      .rv-chip:hover { color: var(--text-main, #2E1065); }
      .rv-chip.is-active {
        color: #FFFFFF;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #9333EA) 100%);
        box-shadow: 0 4px 10px -4px var(--primary, #7E22CE);
      }
      .rv-date { width: 160px; min-height: 38px; padding: 0.4rem 0.7rem; }
      .rv-search { position: relative; margin-left: auto; }
      .rv-search .material-symbols-outlined {
        position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
        font-size: 18px; color: var(--text-muted, #6B7280); pointer-events: none;
      }
      .rv-search .form-control { width: 260px; min-height: 38px; padding-left: 34px; font-size: 12.5px; }

      .rv-status-row {
        display: flex; gap: 2px; padding: 0 16px; overflow-x: auto;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }
      .rv-status-tab {
        --tone: var(--primary, #7E22CE);
        display: inline-flex; align-items: center; gap: 7px; padding: 10px 12px;
        border: none; border-bottom: 2px solid transparent; background: transparent;
        color: var(--text-muted, #6B7280); font-size: 12.5px; font-weight: 700; cursor: pointer; white-space: nowrap;
      }
      .rv-status-tab em {
        font-style: normal; min-width: 20px; padding: 1px 7px; border-radius: 9999px; font-size: 11px;
        background: color-mix(in srgb, var(--tone) 14%, transparent); color: var(--tone);
      }
      .rv-status-tab.st-confirmed { --tone: #3B82F6; }
      .rv-status-tab.st-seated { --tone: #10B981; }
      .rv-status-tab.st-cancelled { --tone: var(--danger, #EF4444); }
      .rv-status-tab.st-no_show { --tone: #9CA3AF; }
      .rv-status-tab:hover { color: var(--text-main, #2E1065); }
      .rv-status-tab.is-active { color: var(--text-main, #2E1065); border-bottom-color: var(--tone); }

      /* List */
      .rv-list { padding: 6px 16px 16px; transition: opacity 0.15s; }
      .rv-list.is-busy { opacity: 0.55; }
      .rv-day + .rv-day { margin-top: 10px; }
      .rv-day-head {
        display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
        padding: 14px 2px 8px; position: sticky; top: 0; z-index: 1; background: var(--card-bg, #FFFFFF);
      }
      .rv-day-head strong { font-size: 14px; font-weight: 900; color: var(--text-main, #2E1065); }
      .rv-day-head span { font-size: 12px; color: var(--text-muted, #6B7280); }
      .rv-day-head em { margin-left: auto; font-style: normal; font-size: 11.5px; font-weight: 700; color: var(--text-muted, #6B7280); }

      .rv-row {
        --tone: #3B82F6;
        display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: 16px;
        padding: 14px 16px; border-radius: 14px;
        border: 1px solid var(--card-border, #E9D5FF);
        border-left: 4px solid var(--tone);
        background: color-mix(in srgb, var(--tone) 4%, var(--card-bg, #FFFFFF));
        transition: transform 0.15s, box-shadow 0.15s;
      }
      .rv-row + .rv-row { margin-top: 8px; }
      .rv-row:hover { transform: translateY(-1px); box-shadow: 0 10px 22px -16px rgba(0, 0, 0, 0.6); }
      .rv-row.st-seated { --tone: #10B981; }
      .rv-row.st-cancelled, .rv-row.st-no_show { --tone: #9CA3AF; opacity: 0.7; }
      .rv-row.is-late { --tone: var(--danger, #EF4444); }

      .rv-time { display: flex; flex-direction: column; align-items: center; line-height: 1; }
      .rv-time strong { font-size: 1.35rem; font-weight: 900; color: var(--tone); font-variant-numeric: tabular-nums; }
      .rv-time small { margin-top: 3px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.08em; color: var(--text-muted, #6B7280); }

      .rv-main { min-width: 0; }
      .rv-name-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
      .rv-name { font-size: 14.5px; font-weight: 800; color: var(--text-main, #2E1065); }
      .rv-code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10.5px; font-weight: 700;
        padding: 2px 7px; border-radius: 6px; color: var(--text-muted, #6B7280);
        background: color-mix(in srgb, var(--text-muted, #6B7280) 14%, transparent);
      }
      .rv-pill {
        --tone: #3B82F6;
        padding: 2px 9px; border-radius: 9999px; font-size: 10.5px; font-weight: 800;
        color: var(--tone); background: color-mix(in srgb, var(--tone) 15%, transparent);
      }
      .rv-pill.st-seated { --tone: #10B981; }
      .rv-pill.st-cancelled { --tone: var(--danger, #EF4444); }
      .rv-pill.st-no_show { --tone: #9CA3AF; }
      .rv-pill.st-late { --tone: var(--danger, #EF4444); animation: rv-pulse 1.6s infinite; }
      .rv-pill.st-soon { --tone: #F59E0B; }
      @keyframes rv-pulse { 50% { opacity: 0.55; } }

      .rv-meta { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 6px; font-size: 12px; color: var(--text-muted, #6B7280); }
      .rv-meta > span { display: inline-flex; align-items: center; gap: 4px; }
      .rv-meta .material-symbols-outlined { font-size: 15px; }
      .rv-meta .rv-table { color: var(--text-main, #2E1065); font-weight: 700; }
      .rv-note {
        display: flex; align-items: flex-start; gap: 6px; margin: 8px 0 0; padding: 6px 10px; border-radius: 9px;
        font-size: 12px; color: var(--text-main, #2E1065);
        background: color-mix(in srgb, #F59E0B 10%, transparent);
      }
      .rv-note .material-symbols-outlined { font-size: 15px; color: #F59E0B; }

      .rv-actions { display: flex; align-items: center; gap: 6px; }
      .rv-icon-btn {
        width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;
        border-radius: 10px; border: 1px solid var(--card-border, #E9D5FF); background: var(--card-bg, #FFFFFF);
        color: var(--text-muted, #6B7280); cursor: pointer;
      }
      .rv-icon-btn:hover { color: var(--text-main, #2E1065); background: color-mix(in srgb, var(--primary, #7E22CE) 10%, var(--card-bg, #FFFFFF)); }
      .rv-icon-btn.is-danger:hover { color: var(--danger, #EF4444); border-color: color-mix(in srgb, var(--danger, #EF4444) 45%, transparent); }
      .rv-icon-btn .material-symbols-outlined { font-size: 18px; }
      .rv-done { gap: 4px; font-size: 12px; font-weight: 800; color: #10B981; }
      .rv-done .material-symbols-outlined { font-size: 18px; }

      .rv-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 56px 20px; text-align: center; color: var(--text-muted, #6B7280); }
      .rv-empty > .material-symbols-outlined {
        font-size: 30px; width: 64px; height: 64px; display: inline-flex; align-items: center; justify-content: center;
        border-radius: 50%; margin-bottom: 6px; color: var(--primary, #7E22CE);
        background: color-mix(in srgb, var(--primary, #7E22CE) 12%, transparent);
      }
      .rv-empty strong { font-size: 15px; color: var(--text-main, #2E1065); }
      .rv-empty p { margin: 0 0 8px; font-size: 12.5px; max-width: 360px; }
      .rv-empty-sm { padding: 20px; }

      /* Modals */
      .rv-modal { max-width: 620px; }
      .rv-modal-sm { max-width: 540px; }
      .rv-modal-head {
        display: flex; align-items: center; gap: 12px; padding-bottom: 16px; margin-bottom: 18px;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }
      .rv-modal-head > div { flex: 1; min-width: 0; }
      .rv-modal-head h3 { margin: 0; font-size: 1.15rem; font-weight: 900; color: var(--text-main, #2E1065); }
      .rv-modal-head p { margin: 2px 0 0; font-size: 12px; color: var(--text-muted, #6B7280); }
      .rv-modal-icon {
        width: 44px; height: 44px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
        border-radius: 12px; color: #FFFFFF;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #9333EA) 100%);
      }
      .rv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .rv-span { grid-column: 1 / -1; }
      .rv-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
      .rv-field > label { font-size: 11px; font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-muted, #6B7280); }
      .rv-hint { font-size: 11px; color: #F59E0B; font-weight: 600; }

      .rv-lookup { position: relative; }
      .rv-lookup > .material-symbols-outlined {
        position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
        font-size: 17px; color: var(--text-muted, #6B7280); pointer-events: none;
      }
      .rv-lookup .form-control { padding-left: 34px; }
      .rv-lookup .form-control.is-linked { border-color: color-mix(in srgb, #10B981 55%, var(--card-border, #E9D5FF)); }
      .rv-lookup-menu {
        max-height: 190px; overflow-y: auto; padding: 4px; border-radius: 12px;
        border: 1px solid var(--card-border, #E9D5FF); background: var(--card-bg, #FFFFFF);
        box-shadow: 0 12px 28px -12px rgba(0, 0, 0, 0.45);
      }
      .rv-lookup-item {
        width: 100%; display: flex; align-items: center; gap: 10px; padding: 6px 8px; border: none; border-radius: 9px;
        background: transparent; color: inherit; text-align: left; cursor: pointer;
      }
      .rv-lookup-item:hover { background: color-mix(in srgb, var(--primary, #7E22CE) 14%, transparent); }
      .rv-lookup-item > span:last-child { display: flex; flex-direction: column; min-width: 0; }
      .rv-lookup-item strong { font-size: 12.5px; color: var(--text-main, #2E1065); }
      .rv-lookup-item small { font-size: 11px; color: var(--text-muted, #6B7280); }
      .rv-avatar {
        width: 30px; height: 30px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
        border-radius: 50%; font-size: 12px; font-weight: 800; color: #FFFFFF;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #9333EA) 100%);
      }

      .rv-stepper {
        display: flex; align-items: center; gap: 6px; padding: 3px; border-radius: 9999px;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: color-mix(in srgb, var(--primary, #7E22CE) 6%, var(--card-bg, #FFFFFF));
      }
      .rv-stepper button {
        width: 34px; height: 34px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
        border: none; border-radius: 50%; cursor: pointer; color: #FFFFFF;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #9333EA) 100%);
      }
      .rv-stepper button:disabled { cursor: not-allowed; opacity: 0.4; }
      .rv-stepper input {
        flex: 1; min-width: 0; border: none; background: transparent; text-align: center;
        font-size: 1.05rem; font-weight: 800; color: var(--text-main, #2E1065); outline: none;
        -moz-appearance: textfield; appearance: textfield;
      }
      .rv-stepper input::-webkit-outer-spin-button, .rv-stepper input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

      .rv-modal-foot {
        display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px;
        border-top: 1px solid var(--card-border, #E9D5FF);
      }

      .rv-seat-label { margin: 0 0 10px; font-size: 11px; font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-muted, #6B7280); }
      .rv-seat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; max-height: 300px; overflow-y: auto; }
      .rv-seat-opt {
        display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px 12px;
        border-radius: 12px; border: 1.5px solid var(--card-border, #E9D5FF); background: var(--card-bg, #FFFFFF);
        color: inherit; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s;
      }
      .rv-seat-opt strong { font-size: 13.5px; font-weight: 800; color: var(--text-main, #2E1065); }
      .rv-seat-opt small { font-size: 11px; color: var(--text-muted, #6B7280); }
      .rv-seat-opt em { font-style: normal; font-size: 10.5px; font-weight: 700; color: #10B981; }
      .rv-seat-opt em.is-warn { color: #F59E0B; }
      .rv-seat-opt:hover { border-color: color-mix(in srgb, var(--primary, #7E22CE) 50%, var(--card-border, #E9D5FF)); }
      .rv-seat-opt.is-picked {
        border-color: var(--primary, #7E22CE);
        background: color-mix(in srgb, var(--primary, #7E22CE) 12%, var(--card-bg, #FFFFFF));
      }

      @media (max-width: 1100px) { .rv-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 720px) {
        .rv-kpis, .rv-grid { grid-template-columns: 1fr; }
        .rv-search { margin-left: 0; width: 100%; }
        .rv-search .form-control { width: 100%; }
        .rv-row { grid-template-columns: 60px minmax(0, 1fr); }
        .rv-actions { grid-column: 1 / -1; justify-content: flex-end; }
      }
    `,
  ],
})
export class ReservationsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private diningService = inject(DiningService);
  private cartService = inject(CartService);
  private customerService = inject(CustomerService);
  private notify = inject(NotificationService);

  public readonly ranges: { key: Range; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'week', label: 'Next 7 days' },
    { key: 'upcoming', label: 'All upcoming' },
    { key: 'past', label: 'Past 30 days' },
    { key: 'date', label: 'Pick date' },
  ];

  public readonly statuses: { key: StatusFilter; label: string }[] = [
    { key: '', label: 'All' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'SEATED', label: 'Seated' },
    { key: 'NO_SHOW', label: 'No-show' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  private readonly defaultSections = [
    'Main AC Hall', 'Majlis Carpet Floor', 'Family Enclosure',
    'Outdoor Terrace', 'Rooftop Garden', 'VIP Private Cabin',
  ];

  public data: ReservationList | null = null;
  public groups: DayGroup[] = [];
  public tables: DiningTable[] = [];
  public isLoading = false;
  public loadError: string | null = null;
  public saving = false;

  public range: Range = 'today';
  public pickedDate = this.ymd(new Date());
  public status: StatusFilter = '';
  public search = '';

  // Booking form
  public showBooking = false;
  public form = this.blankForm();
  public bookingCustomer: Customer | null = null;
  public lookupResults: Customer[] = [];
  public lookupOpen = false;
  public minDateTime = '';

  // Seat dialog
  public seating: ReservationRow | null = null;
  public seatTableId: number | null = null;

  private nowMs = Date.now();
  private loadedAtMs = Date.now();
  private clock: ReturnType<typeof setInterval> | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private lookupTimer: ReturnType<typeof setTimeout> | null = null;
  private requestSeq = 0;
  private lookupSeq = 0;

  ngOnInit(): void {
    this.load();
    this.loadTables();
    this.clock = setInterval(() => (this.nowMs = Date.now()), 30000);
  }

  ngOnDestroy(): void {
    if (this.clock) clearInterval(this.clock);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (this.lookupTimer) clearTimeout(this.lookupTimer);
  }

  // ─── Loading ───
  load(): void {
    const { from, to } = this.rangeDates();
    const seq = ++this.requestSeq;
    this.isLoading = true;
    this.loadError = null;
    this.diningService
      .listReservations({ from, to, status: this.status || undefined, search: this.search.trim() || undefined })
      .subscribe({
        next: (res) => {
          if (seq !== this.requestSeq) return;
          this.isLoading = false;
          if (res.success) {
            this.data = res.data;
            this.loadedAtMs = this.nowMs = Date.now();
            this.groups = this.buildGroups(res.data.rows);
          }
        },
        error: (err) => {
          if (seq !== this.requestSeq) return;
          this.isLoading = false;
          if (!this.data) this.loadError = err?.error?.message || 'Unable to load reservations.';
        },
      });
  }

  private loadTables(): void {
    this.diningService.getTables().subscribe({
      next: (res) => {
        if (res.success) this.tables = res.data || [];
      },
      error: () => {},
    });
  }

  private buildGroups(rows: ReservationRow[]): DayGroup[] {
    const map = new Map<string, DayGroup>();
    for (const r of rows) {
      const key = String(r.reservation_time || '').slice(0, 10);
      let g = map.get(key);
      if (!g) {
        g = { key, date: this.asDate(key + ' 00:00:00'), rows: [], covers: 0 };
        map.set(key, g);
      }
      g.rows.push(r);
      if (r.status === 'CONFIRMED' || r.status === 'SEATED') g.covers += Number(r.guest_count) || 0;
    }
    const list = Array.from(map.values());
    // Past range reads newest first; everything else is a forward-looking schedule.
    return this.range === 'past' ? list.reverse() : list;
  }

  // ─── Filters ───
  setRange(r: Range): void {
    this.range = r;
    this.load();
  }

  setStatus(s: StatusFilter): void {
    this.status = s;
    this.load();
  }

  onSearch(value: string): void {
    this.search = value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 300);
  }

  statusCount(s: StatusFilter): number {
    const c = this.data?.counts;
    if (!c) return 0;
    switch (s) {
      case 'CONFIRMED': return c.confirmed;
      case 'SEATED': return c.seated;
      case 'CANCELLED': return c.cancelled;
      case 'NO_SHOW': return c.no_show;
      default: return c.total;
    }
  }

  private rangeDates(): { from?: string; to?: string } {
    const today = new Date();
    const shift = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return this.ymd(d);
    };
    switch (this.range) {
      case 'today': return { from: shift(0), to: shift(0) };
      case 'tomorrow': return { from: shift(1), to: shift(1) };
      case 'week': return { from: shift(0), to: shift(6) };
      case 'past': return { from: shift(-30), to: shift(-1) };
      case 'date': return { from: this.pickedDate, to: this.pickedDate };
      default: return {};
    }
  }

  rangeEmptyText(): string {
    switch (this.range) {
      case 'today': return 'for today';
      case 'tomorrow': return 'for tomorrow';
      case 'week': return 'in the next 7 days';
      case 'past': return 'in the past 30 days';
      case 'date': return 'on this date';
      default: return 'coming up';
    }
  }

  // ─── Time helpers ───
  // Server works out minutes_until on its own clock; count on from load time
  // so "Late" and "In 20m" stay right without trusting the browser timezone.
  minutesUntil(r: ReservationRow): number {
    const base = Number(r.minutes_until);
    if (!Number.isFinite(base)) return 0;
    return base - Math.floor((this.nowMs - this.loadedAtMs) / 60000);
  }

  isLate(r: ReservationRow): boolean {
    return r.status === 'CONFIRMED' && this.minutesUntil(r) < 0;
  }

  isSoon(r: ReservationRow): boolean {
    const m = this.minutesUntil(r);
    return r.status === 'CONFIRMED' && m >= 0 && m <= 60;
  }

  isPast(r: ReservationRow): boolean {
    return this.minutesUntil(r) < 0;
  }

  get lateCount(): number {
    return (this.data?.rows || []).filter((r) => this.isLate(r)).length;
  }

  dayTitle(d: Date | null): string {
    if (!d) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  duration(mins: number): string {
    const total = Math.max(0, Math.floor(mins || 0));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (!h) return m + 'm';
    return m ? h + 'h ' + m + 'm' : h + 'h';
  }

  statusLabel(s: string): string {
    switch (s) {
      case 'CONFIRMED': return 'Confirmed';
      case 'SEATED': return 'Seated';
      case 'CANCELLED': return 'Cancelled';
      case 'NO_SHOW': return 'No-show';
      default: return s;
    }
  }

  // "2026-09-29 19:30:00" is local DB time; parse it as local, not UTC.
  asDate(value?: string | null): Date | null {
    if (!value) return null;
    const d = new Date(String(value).trim().replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }

  trackByKey(_i: number, g: DayGroup): string {
    return g.key;
  }

  trackById(_i: number, r: ReservationRow): number {
    return r.id;
  }

  goBack(): void {
    this.router.navigate(['/dining']);
  }

  // ─── Booking form ───
  get sections(): string[] {
    const set = new Set<string>(this.defaultSections);
    this.tables.forEach((t) => t.section && set.add(t.section));
    return Array.from(set);
  }

  /*
   * Dropdown option lists are cached and rebuilt only when what they depend
   * on changes: a getter returning a fresh array each check would make the
   * dropdown re-render on every change detection.
   */
  private tableOptionsKey = "";
  private tableOptionsCache: DropdownOption[] = [];
  private sectionOptionsKey = "";
  private sectionOptionsCache: DropdownOption[] = [];

  get tableOptions(): DropdownOption[] {
    const list = this.bookableTables;
    const key = list.map((t) => t.id).join(",");
    if (key !== this.tableOptionsKey || !this.tableOptionsCache.length) {
      this.tableOptionsKey = key;
      this.tableOptionsCache = [
        { value: null, label: "Assign on arrival", icon: "schedule", description: "Pick a table when the guests come in" },
        ...list.map((t) => ({
          value: t.id,
          label: t.table_number,
          icon: "table_restaurant",
          description: t.capacity + " seats · " + (t.section || "No section"),
        })),
      ];
    }
    return this.tableOptionsCache;
  }

  get sectionOptions(): DropdownOption[] {
    const list = this.sections;
    const key = list.join("|");
    if (key !== this.sectionOptionsKey) {
      this.sectionOptionsKey = key;
      this.sectionOptionsCache = [
        { value: "", label: "Any section", icon: "select_all", description: "No preference" },
        ...list.map((s) => ({ value: s, label: s, icon: "location_on" })),
      ];
    }
    return this.sectionOptionsCache;
  }

  /** A table picked for another section no longer fits the preference. */
  onSectionChange(): void {
    if (this.form.tableId && !this.bookableTables.some((t) => t.id === this.form.tableId)) {
      this.form.tableId = null;
    }
  }

  get bookableTables(): DiningTable[] {
    const need = Number(this.form.guestCount) || 1;
    return this.tables
      .filter((t) => t.status === 'AVAILABLE' && Number(t.capacity) >= need)
      .filter((t) => !this.form.preferredSection || t.section === this.form.preferredSection)
      .sort((a, b) => Number(a.capacity) - Number(b.capacity));
  }

  openBooking(): void {
    this.form = this.blankForm();
    this.bookingCustomer = null;
    this.lookupResults = [];
    this.lookupOpen = false;
    this.minDateTime = this.localDateTime(new Date());
    this.loadTables();
    this.showBooking = true;
  }

  onBookingName(value: string): void {
    this.form.customerName = value;
    if (this.bookingCustomer) {
      this.bookingCustomer = null;
      this.form.customerPhone = '';
    }
    if (this.lookupTimer) clearTimeout(this.lookupTimer);
    const term = (value || '').trim();
    if (term.length < 2) {
      this.lookupResults = [];
      this.lookupOpen = false;
      return;
    }
    this.lookupTimer = setTimeout(() => {
      const seq = ++this.lookupSeq;
      this.customerService.getCustomers(1, 6, term).subscribe({
        next: (res) => {
          if (seq !== this.lookupSeq || this.bookingCustomer) return;
          this.lookupResults = res.success ? res.data || [] : [];
          this.lookupOpen = this.lookupResults.length > 0;
        },
        error: () => {},
      });
    }, 250);
  }

  pickCustomer(c: Customer): void {
    this.bookingCustomer = c;
    this.form.customerName = c.name;
    this.form.customerPhone = c.phone || '';
    this.lookupOpen = false;
  }

  closeLookupSoon(): void {
    setTimeout(() => (this.lookupOpen = false), 120);
  }

  saveBooking(): void {
    const f = this.form;
    if (!f.customerName.trim() || !f.customerPhone.trim() || !f.reservationTime) {
      this.notify.error('Please enter customer name, phone number and reservation time');
      return;
    }
    if (!(Number(f.guestCount) >= 1)) {
      this.notify.error('Party size must be at least 1');
      return;
    }
    this.saving = true;
    this.diningService
      .createReservationPost({
        customerName: f.customerName.trim(),
        customerPhone: f.customerPhone.trim(),
        reservationTime: f.reservationTime,
        guestCount: Number(f.guestCount),
        tableId: f.tableId,
        preferredSection: f.preferredSection || undefined,
        specialRequests: f.specialRequests.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.notify.success('Reservation ' + res.data.reservation_code + ' confirmed');
            this.showBooking = false;
            this.load();
            this.loadTables();
          }
        },
        error: () => (this.saving = false),
      });
  }

  // ─── Seat / no-show / cancel ───
  get seatOptions(): DiningTable[] {
    const r = this.seating;
    if (!r) return [];
    const need = Number(r.guest_count) || 1;
    return this.tables
      .filter((t) => t.status === 'AVAILABLE' || (t.status === 'RESERVED' && Number(t.reservation_id) === Number(r.id)))
      .sort((a, b) => {
        // Held table first, then the ones that fit, smallest fitting first.
        if (a.id === r.table_id) return -1;
        if (b.id === r.table_id) return 1;
        const fitA = Number(a.capacity) >= need ? 0 : 1;
        const fitB = Number(b.capacity) >= need ? 0 : 1;
        return fitA - fitB || Number(a.capacity) - Number(b.capacity);
      });
  }

  openSeat(r: ReservationRow): void {
    this.seating = r;
    this.seatTableId = null;
    this.diningService.getTables().subscribe({
      next: (res) => {
        if (!res.success) return;
        this.tables = res.data || [];
        const first = this.seatOptions[0];
        if (first && (first.id === r.table_id || Number(first.capacity) >= Number(r.guest_count))) {
          this.seatTableId = first.id;
        }
      },
      error: () => {},
    });
  }

  confirmSeat(startOrder: boolean): void {
    const r = this.seating;
    if (!r || !this.seatTableId) return;
    this.saving = true;
    this.diningService.seatReservationPost(r.id, this.seatTableId).subscribe({
      next: (res) => {
        this.saving = false;
        if (!res.success) return;
        this.notify.success(r.customer_name + ' seated at ' + (res.data?.table_number || 'table'));
        this.seating = null;
        if (startOrder && res.data) {
          this.cartService.orderType.set('DINING');
          this.cartService.selectedTable.set({ ...res.data, active_guest_count: r.guest_count });
          this.router.navigate(['/pos'], { state: { keepCart: true } });
          return;
        }
        this.load();
        this.loadTables();
      },
      error: () => (this.saving = false),
    });
  }

  markNoShow(r: ReservationRow): void {
    this.notify.confirm({
      title: 'Mark as no-show',
      message: r.customer_name + ' did not arrive? Any table held for this booking will be released.',
      confirmText: 'Mark No-show',
      isDestructive: true,
      onConfirm: () => {
        this.diningService.markReservationNoShow(r.id).subscribe({
          next: () => {
            this.notify.info('Marked as no-show');
            this.load();
            this.loadTables();
          },
          error: () => {},
        });
      },
    });
  }

  cancel(r: ReservationRow): void {
    this.notify.confirm({
      title: 'Cancel reservation',
      message: 'Cancel the booking for ' + r.customer_name + '? Any table held for it will be released.',
      confirmText: 'Cancel Booking',
      isDestructive: true,
      onConfirm: () => {
        this.diningService.cancelReservationPost(r.id).subscribe({
          next: () => {
            this.notify.info('Reservation cancelled');
            this.load();
            this.loadTables();
          },
          error: () => {},
        });
      },
    });
  }

  // ─── Utils ───
  private blankForm() {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return {
      customerName: '',
      customerPhone: '',
      reservationTime: this.localDateTime(d),
      guestCount: 2,
      tableId: null as number | null,
      preferredSection: '',
      specialRequests: '',
    };
  }

  // Local "YYYY-MM-DDTHH:mm" for datetime-local. toISOString() is UTC and put
  // the old form's default 5h30m in the past.
  private localDateTime(d: Date): string {
    return this.ymd(d) + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  private ymd(d: Date): string {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
