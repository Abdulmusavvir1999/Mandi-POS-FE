import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DiningService, ReservationList, ReservationRow } from '../../../core/services/dining.service';
import { CartService } from '../../../core/services/cart.service';
import { CustomerService } from '../../../core/services/customer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Customer, DiningTable, Product, ProductVariant } from '../../../core/models';
import { ProductService } from '../../../core/services/product.service';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { maxUnits, snapshotBalances, stockLimitMessage, stockUseOf, stockUsed, StockUse } from '../../../core/utils/stock-limit.util';
import { CheckoutService } from '../../../core/services/checkout.service';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';
import { CustomDropdownComponent, DropdownOption } from '../../../shared/components/custom-dropdown/custom-dropdown.component';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';
import { DEFAULT_ACTION_BUTTON_CSS } from '../../../shared/styles/default-action-buttons.styles';

type Range = 'today' | 'tomorrow' | 'week' | 'upcoming' | 'past' | 'date';
/** A dish line in the booking form (ids only - names and prices come from the menu). */
interface BookingDish {
  productId: number;
  variantId: number | null;
  quantity: number;
  notes: string;
  /** When it was last added from the search / Add portion - newest shows first. */
  seq?: number;
}

type StatusFilter = '' | 'CONFIRMED' | 'SEATED' | 'PICKED_UP' | 'EXPIRED' | 'CANCELLED' | 'NO_SHOW';

interface DayGroup {
  key: string;
  date: Date | null;
  rows: ReservationRow[];
  covers: number;
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageLoaderComponent, CustomDropdownComponent, DatePickerComponent, AppCurrencyPipe],
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

          <!-- Bulk cancel: tick confirmed bookings, then cancel them together -->
          <div class="rv-bulk-bar" *ngIf="confirmedRows.length > 0" [class.has-selection]="selected.size > 0">
            <label class="rv-check-all">
              <input
                type="checkbox"
                [checked]="allSelected"
                [indeterminate]="selected.size > 0 && !allSelected"
                (change)="toggleSelectAll()"
              />
              <span>{{ selected.size ? selected.size + ' selected' : 'Select all confirmed (' + confirmedRows.length + ')' }}</span>
            </label>
            <ng-container *ngIf="selected.size > 0">
              <button type="button" class="rv-bulk-link" (click)="clearSelection()">Clear</button>
              <button type="button" class="action-btn btn-sm rv-bulk-cancel" [disabled]="saving" (click)="bulkCancel()">
                <span class="material-symbols-outlined">event_busy</span>
                <span>Cancel {{ selected.size }} {{ selected.size === 1 ? 'booking' : 'bookings' }}</span>
              </button>
            </ng-container>
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
                [class.is-selected]="selected.has(r.id)"
              >
                <label class="rv-check" *ngIf="r.status === 'CONFIRMED'; else noCheck" [title]="'Select ' + r.reservation_code">
                  <input type="checkbox" [checked]="selected.has(r.id)" (change)="toggleSelect(r.id)" />
                </label>
                <ng-template #noCheck><span class="rv-check"></span></ng-template>
                <div class="rv-time">
                  <strong>{{ asDate(r.reservation_time) | date: 'h:mm' }}</strong>
                  <small>{{ asDate(r.reservation_time) | date: 'a' }}</small>
                </div>

                <div class="rv-main">
                  <div class="rv-name-row">
                    <span class="rv-name">{{ r.customer_name }}</span>
                    <span class="rv-code">{{ r.reservation_code }}</span>
                    <span class="rv-type" [class.is-pickup]="r.booking_type === 'PICKUP'">
                      {{ r.booking_type === 'PICKUP' ? 'Pickup' : 'Table' }}
                    </span>
                    <span class="rv-pill" [ngClass]="'st-' + r.status.toLowerCase()">{{ statusLabel(r.status) }}</span>
                    <span class="rv-pill st-late" *ngIf="isLate(r)">Late {{ duration(-minutesUntil(r)) }}</span>
                    <span class="rv-pill st-soon" *ngIf="isSoon(r)">In {{ duration(minutesUntil(r)) }}</span>
                  </div>
                  <div class="rv-meta">
                    <span><span class="material-symbols-outlined">call</span>{{ r.customer_phone }}</span>
                    <span *ngIf="r.booking_type === 'PICKUP'" class="rv-muted">
                      <span class="material-symbols-outlined">storefront</span>Collect at the counter
                    </span>
                    <ng-container *ngIf="r.booking_type !== 'PICKUP'">
                    <span><span class="material-symbols-outlined">group</span>{{ r.guest_count }} guests</span>
                    <span *ngIf="r.table_number" class="rv-table">
                      <span class="material-symbols-outlined">table_restaurant</span>{{ r.table_number }}
                      <ng-container *ngIf="r.table_section"> · {{ r.table_section }}</ng-container>
                    </span>
                    <span *ngIf="!r.table_number" class="rv-muted">
                      <span class="material-symbols-outlined">location_on</span>{{ r.preferred_section || 'Any section' }} · table on arrival
                    </span>
                    </ng-container>
                  </div>
                  <button type="button" class="rv-dish-summary" *ngIf="r.items?.length" (click)="openDishes(r)" title="See the booked dishes">
                    <span class="material-symbols-outlined">restaurant_menu</span>
                    <span>{{ dishLinesLabel(r) }}</span>
                    <strong>{{ r.items_total || 0 | appCurrency:'1.0-2' }}</strong>
                    <span class="material-symbols-outlined rv-dish-summary-go">chevron_right</span>
                  </button>
                  <p
                    class="rv-valid"
                    *ngIf="r.status === 'CONFIRMED' && r.expires_at"
                    [class.is-soon]="expirySeconds(r) > 0 && expirySeconds(r) <= 3600"
                    [class.is-urgent]="expirySeconds(r) > 0 && expirySeconds(r) <= 900"
                    [class.is-gone]="expirySeconds(r) <= 0"
                  >
                    <span class="material-symbols-outlined">timer</span>
                    <ng-container *ngIf="expirySeconds(r) > 0; else expiredNow">
                      Expires in <strong class="rv-countdown">{{ countdown(expirySeconds(r)) }}</strong>
                    </ng-container>
                    <ng-template #expiredNow><strong>Expired</strong> - updating…</ng-template>
                    <span class="rv-valid-till">· till {{ asDate(r.expires_at) | date: 'h:mm a, d MMM' }}</span>
                  </p>
                  <p class="rv-note" *ngIf="r.special_requests">
                    <span class="material-symbols-outlined">sticky_note_2</span>{{ r.special_requests }}
                  </p>
                </div>

                <div class="rv-actions" *ngIf="r.status === 'CONFIRMED'">
                  <button
                    type="button"
                    *ngIf="r.booking_type === 'PICKUP' && r.items?.length"
                    class="action-btn btn-gradient-purple btn-sm"
                    (click)="collectAndBill(r)"
                    title="Open the POS with the booked dishes as a Takeaway order; paying marks it picked up"
                  >
                    <span class="material-symbols-outlined">point_of_sale</span>
                    <span>Collect &amp; bill →</span>
                  </button>
                  <button
                    type="button"
                    *ngIf="r.booking_type === 'PICKUP' && !r.items?.length"
                    class="action-btn btn-gradient-purple btn-sm"
                    (click)="markPickedUp(r)"
                  >
                    <span class="material-symbols-outlined">shopping_bag</span>
                    <span>Picked up</span>
                  </button>
                  <ng-container *ngIf="r.booking_type !== 'PICKUP'">
                    <ng-container *ngTemplateOutlet="seatBtn"></ng-container>
                    <button
                      type="button"
                      class="action-btn btn-outline-purple btn-sm"
                      (click)="switchType(r)"
                      title="The customer will collect instead - change this to a pickup booking"
                    >
                      <span class="material-symbols-outlined">shopping_bag</span>
                      <span>Switch to pickup</span>
                    </button>
                  </ng-container>
                  <button
                    type="button"
                    *ngIf="r.booking_type === 'PICKUP'"
                    class="action-btn btn-outline-purple btn-sm"
                    (click)="openConvert(r)"
                    title="The customer wants to dine in instead - change this to a table booking"
                  >
                    <span class="material-symbols-outlined">restaurant</span>
                    <span>Dine in instead</span>
                  </button>
                  <ng-template #seatBtn>
                    <button type="button" class="action-btn btn-gradient-purple btn-sm" (click)="openSeat(r)">
                      <span class="material-symbols-outlined">how_to_reg</span>
                      <span>Seat</span>
                    </button>
                  </ng-template>
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
                <div class="rv-actions rv-done" *ngIf="r.status === 'SEATED' || r.status === 'PICKED_UP'">
                  <span class="material-symbols-outlined">check_circle</span>{{ statusLabel(r.status) }}
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
            <span class="rv-modal-icon">
              <span class="material-symbols-outlined">{{ form.bookingType === 'PICKUP' ? 'shopping_bag' : 'event_seat' }}</span>
            </span>
            <div>
              <h3>{{ form.bookingType === 'PICKUP' ? 'New Pickup Booking' : 'New Reservation' }}</h3>
              <p>{{ form.bookingType === 'PICKUP' ? 'Book a time for the customer to come and collect' : 'Hold a table for guests arriving later' }}</p>
            </div>
            <button type="button" class="modal-close-btn" (click)="showBooking = false" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveBooking()" class="rv-form">
            <!-- Booking type: dine at a table, or book a time to collect -->
            <div class="rv-type-toggle" role="radiogroup" aria-label="Booking type">
              <button
                type="button"
                role="radio"
                [attr.aria-checked]="form.bookingType === 'TABLE'"
                [class.is-active]="form.bookingType === 'TABLE'"
                (click)="setBookingType('TABLE')"
              >
                <span class="material-symbols-outlined">table_restaurant</span>
                <span><strong>Table</strong><small>Guests come to dine</small></span>
              </button>
              <button
                type="button"
                role="radio"
                [attr.aria-checked]="form.bookingType === 'PICKUP'"
                [class.is-active]="form.bookingType === 'PICKUP'"
                (click)="setBookingType('PICKUP')"
              >
                <span class="material-symbols-outlined">shopping_bag</span>
                <span><strong>Pickup</strong><small>Book a time and collect</small></span>
              </button>
            </div>

            <div class="rv-grid">
              <!-- Phone first: the customer's unique key. A saved customer's name is fetched. -->
              <div class="rv-field">
                <label>Phone *</label>
                <div class="rv-phone">
                  <input
                    type="tel"
                    class="form-control"
                    name="b_phone"
                    inputmode="tel"
                    maxlength="20"
                    autocomplete="off"
                    placeholder="Phone number"
                    [class.is-invalid]="!!phoneError"
                    [ngModel]="form.customerPhone"
                    (ngModelChange)="onBookingPhone($event)"
                    (focus)="phoneSuggestOpen = phoneSuggestions.length > 0"
                    (blur)="closePhoneSuggestSoon()"
                  />
                  <span class="rv-phone-state" [ngClass]="'is-' + phoneLookup">
                    <ng-container [ngSwitch]="phoneLookup">
                      <ng-container *ngSwitchCase="'checking'">Checking…</ng-container>
                      <ng-container *ngSwitchCase="'found'"><span class="material-symbols-outlined">how_to_reg</span>Customer</ng-container>
                      <ng-container *ngSwitchCase="'new'"><span class="material-symbols-outlined">person_add</span>New</ng-container>
                    </ng-container>
                  </span>
                </div>
                <div class="rv-lookup-menu rv-phone-menu" *ngIf="phoneSuggestOpen && phoneSuggestions.length">
                  <button
                    type="button"
                    *ngFor="let c of phoneSuggestions"
                    class="rv-lookup-item"
                    (mousedown)="pickPhoneSuggestion(c); $event.preventDefault()"
                  >
                    <span class="rv-avatar">{{ (c.name || '?').charAt(0).toUpperCase() }}</span>
                    <span><strong>{{ c.name }}</strong><small [innerHTML]="markDigits(c.phone)"></small></span>
                  </button>
                </div>
                <small class="rv-hint" *ngIf="phoneError">{{ phoneError }}</small>
              </div>
              <div class="rv-field">
                <label>Customer name *</label>
                <div class="rv-lookup" [class.is-locked]="phoneLookup === 'found'">
                  <span class="material-symbols-outlined">{{ phoneLookup === 'found' ? 'lock' : bookingCustomer ? 'how_to_reg' : 'search' }}</span>
                  <input
                    type="text"
                    class="form-control"
                    name="b_name"
                    autocomplete="off"
                    [placeholder]="phoneLookup === 'found' ? '' : 'Search or type a new name'"
                    [readonly]="phoneLookup === 'found'"
                    [class.is-linked]="bookingCustomer"
                    [ngModel]="form.customerName"
                    (ngModelChange)="onBookingName($event)"
                    (blur)="closeLookupSoon()"
                  />
                </div>
                <small class="rv-hint rv-hint-ok" *ngIf="phoneLookup === 'found'">Saved customer - name taken from Customers</small>
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
                <label>{{ form.bookingType === 'PICKUP' ? 'Pickup time *' : 'Date & time *' }}</label>
                <input type="datetime-local" class="form-control" name="b_time" [(ngModel)]="form.reservationTime" [min]="minDateTime" />
              </div>
              <div class="rv-field" *ngIf="form.bookingType === 'TABLE'">
                <label>Assign table</label>
                <app-custom-dropdown
                  [options]="tableOptions"
                  [(ngModel)]="form.tableId"
                  (ngModelChange)="onTableChange()"
                  name="b_table"
                  placeholder="Assign on arrival"
                  minWidth="100%"
                ></app-custom-dropdown>
                <small class="rv-hint" *ngIf="!bookableTables.length">No free tables right now. Assign on arrival.</small>
                <small class="rv-hint rv-hint-warn" *ngIf="selectedTableTooSmall as tbl">
                  {{ tbl.table_number }} seats {{ tbl.capacity }} - the party of {{ form.guestCount }} is larger.
                </small>
              </div>

              <div class="rv-field" *ngIf="form.bookingType === 'TABLE'">
                <label>Party size *</label>
                <div class="rv-stepper">
                  <button type="button" (click)="setGuestCount(form.guestCount - 1)" [disabled]="form.guestCount <= 1">
                    <span class="material-symbols-outlined">remove</span>
                  </button>
                  <input type="number" min="1" name="b_guests" [(ngModel)]="form.guestCount" (ngModelChange)="setGuestCount($event)" />
                  <button type="button" (click)="setGuestCount(form.guestCount + 1)">
                    <span class="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>

              <div class="rv-field">
                <label>Booking valid *</label>
                <div class="rv-stepper rv-stepper-unit">
                  <button type="button" (click)="setValidHours(form.validHours - 1)" [disabled]="form.validHours <= 1">
                    <span class="material-symbols-outlined">remove</span>
                  </button>
                  <input type="number" min="1" max="720" name="b_valid" [(ngModel)]="form.validHours" (ngModelChange)="setValidHours($event)" />
                  <span class="rv-unit">hrs</span>
                  <button type="button" (click)="setValidHours(form.validHours + 1)" [disabled]="form.validHours >= 720">
                    <span class="material-symbols-outlined">add</span>
                  </button>
                </div>
                <small class="rv-hint rv-hint-muted" *ngIf="bookingExpiresAt as exp">
                  Expires {{ exp | date: 'h:mm a, d MMM' }} if not {{ form.bookingType === 'PICKUP' ? 'picked up' : 'seated' }}
                </small>
              </div>

              <!-- Dishes: optional. Nothing is taken from stock until the order is paid on arrival. -->
              <div class="rv-field rv-span">
                <label>Dishes</label>
                <div class="rv-type-toggle rv-dish-toggle" role="radiogroup" aria-label="Dishes">
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="form.dishMode === 'NONE'"
                    [class.is-active]="form.dishMode === 'NONE'"
                    (click)="setDishMode('NONE')"
                  >
                    <span class="material-symbols-outlined">event_available</span>
                    <span><strong>Book without dishes</strong><small>Order when they arrive</small></span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="form.dishMode === 'DISHES'"
                    [class.is-active]="form.dishMode === 'DISHES'"
                    (click)="setDishMode('DISHES')"
                  >
                    <span class="material-symbols-outlined">restaurant_menu</span>
                    <span><strong>Add dishes now</strong><small>Optional pre-order</small></span>
                  </button>
                </div>

                <div class="rv-dishes" *ngIf="form.dishMode === 'DISHES'">
                  <app-custom-dropdown
                    [options]="dishOptions"
                    [(ngModel)]="pickDish"
                    (ngModelChange)="addDish($event)"
                    name="b_pick"
                    [searchable]="true"
                    [placeholder]="menuLoading ? 'Loading menu…' : 'Search and add a dish…'"
                    minWidth="100%"
                  ></app-custom-dropdown>

                  <!-- A dish with several portions: pick which one to add. Each portion is its own line. -->
                  <div class="rv-portion-pick" *ngIf="portionPickId !== null && productFor(portionPickId) as pp">
                    <div class="rv-portion-pick-head">
                      <span>Add <strong>{{ pp.name }}</strong> - choose a portion</span>
                      <button type="button" class="rv-portion-done" (click)="portionPickId = null">Done</button>
                    </div>
                    <div class="rv-portions">
                      <button
                        type="button"
                        *ngFor="let v of variantsOf(pp.id)"
                        class="rv-portion rv-portion-add"
                        [class.is-active]="qtyOf(pp.id, v.id) > 0"
                        [disabled]="canAddCount(pp.id, v.id) === 0"
                        (click)="addPortion(pp.id, v.id)"
                        [title]="canAddCount(pp.id, v.id) === 0 ? 'No stock left for this portion' : 'Add one ' + v.name"
                      >
                        <span class="material-symbols-outlined">add</span>
                        <span>{{ v.name }}</span>
                        <small>{{ v.selling_price | appCurrency:'1.0-0' }}</small>
                        <em *ngIf="qtyOf(pp.id, v.id) > 0">{{ qtyOf(pp.id, v.id) }} added</em>
                        <em class="is-out" *ngIf="canAddCount(pp.id, v.id) === 0">Out of stock</em>
                      </button>
                    </div>
                  </div>

                  <div class="rv-dish-card" *ngFor="let g of dishGroups; trackBy: trackDishGroup" [class.has-warn]="groupHasWarn(g)">
                    <!-- The dish -->
                    <div class="rv-dish-top">
                      <span class="rv-dish-icon"><span class="material-symbols-outlined">restaurant</span></span>
                      <div class="rv-dish-title">
                        <strong [title]="productFor(g.productId)?.name || ''">{{ productFor(g.productId)?.name || 'Dish' }}</strong>
                        <small>{{ g.count }} {{ g.count === 1 ? 'item' : 'items' }}<ng-container *ngIf="g.lines.length > 1"> · {{ g.lines.length }} portions</ng-container></small>
                      </div>
                      <span class="rv-dish-amt">{{ g.total | appCurrency:'1.0-2' }}</span>
                      <button type="button" class="rv-dish-remove" (click)="removeDishGroup(g.productId)" title="Remove this dish" aria-label="Remove this dish">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>

                    <!-- One row per portion booked -->
                    <div class="rv-portion-rows">
                      <div class="rv-portion-row" *ngFor="let l of g.lines; trackBy: trackDishLine" [class.is-over]="!!stockNote(l.index)">
                        <div class="rv-portion-name">
                          <span [title]="portionName(l.dish)">{{ portionName(l.dish) }}</span>
                          <small>{{ dishUnitPrice(l.dish) | appCurrency:'1.0-2' }} each</small>
                        </div>
                        <div class="rv-qty" role="group" [attr.aria-label]="'Quantity of ' + portionName(l.dish)">
                          <button type="button" (click)="setDishQty(l.dish, l.dish.quantity - 1)" [disabled]="l.dish.quantity <= 1" aria-label="One less">
                            <span class="material-symbols-outlined">remove</span>
                          </button>
                          <input type="number" min="1" max="999" [name]="'b_qty' + l.index" [(ngModel)]="l.dish.quantity" (ngModelChange)="setDishQty(l.dish, $event)" aria-label="Quantity" />
                          <button type="button" (click)="setDishQty(l.dish, l.dish.quantity + 1)" [disabled]="atLimit(l.index)" aria-label="One more">
                            <span class="material-symbols-outlined">add</span>
                          </button>
                        </div>
                        <span class="rv-portion-amt">{{ dishLineTotal(l.dish) | appCurrency:'1.0-2' }}</span>
                        <button type="button" class="rv-dish-remove" (click)="removeDish(l.index)" [title]="'Remove ' + portionName(l.dish)" aria-label="Remove portion">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                        <p class="rv-dish-warn" *ngIf="stockNote(l.index) as note">
                          <span class="material-symbols-outlined">warning</span>{{ note }}
                        </p>
                      </div>
                    </div>

                    <!-- Portions of this dish not on the booking yet -->
                    <div class="rv-portion-more" *ngIf="missingPortions(g.productId).length">
                      <span>Add portion</span>
                      <button
                        type="button"
                        *ngFor="let v of missingPortions(g.productId)"
                        class="rv-portion rv-portion-add"
                        [disabled]="canAddCount(g.productId, v.id) === 0"
                        (click)="addPortion(g.productId, v.id)"
                        [title]="canAddCount(g.productId, v.id) === 0 ? 'No stock left for this portion' : 'Add ' + v.name"
                      >
                        <span class="material-symbols-outlined">add</span>
                        <span>{{ v.name }}</span>
                        <small>{{ v.selling_price | appCurrency:'1.0-0' }}</small>
                      </button>
                    </div>
                  </div>

                  <p class="rv-dish-empty" *ngIf="!form.dishes.length">
                    No dishes yet - search above to add them, or switch to <strong>Book without dishes</strong>.
                  </p>
                  <!-- Live: each stock item, what every line takes from it, what is left -->
                  <div class="rv-stock-use" *ngIf="stockBreakdown.length">
                    <div class="rv-stock-use-head">
                      <span class="material-symbols-outlined">inventory_2</span>
                      <strong>Stock used by these dishes</strong>
                      <small>live</small>
                    </div>
                    <div class="rv-stock-item" *ngFor="let s of stockBreakdown" [class.is-over]="s.left < 0">
                      <div class="rv-stock-row rv-stock-total">
                        <span>{{ s.name }}</span>
                        <span>{{ s.total | number: '1.0-3' }} {{ s.unit }} <em>in stock</em></span>
                      </div>
                      <div class="rv-stock-row rv-stock-minus" *ngFor="let u of s.uses">
                        <span>− {{ u.label }}</span>
                        <span>{{ u.amount | number: '1.0-3' }} {{ s.unit }}</span>
                      </div>
                      <div class="rv-stock-row rv-stock-left">
                        <span>= Left</span>
                        <span>{{ s.left | number: '1.0-3' }} {{ s.unit }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="rv-dish-total" *ngIf="form.dishes.length">
                    <div>
                      <strong class="rv-dish-total-count">{{ dishCount }} {{ dishCount === 1 ? 'item' : 'items' }}</strong>
                      <small><span class="material-symbols-outlined">info</span>Stock is taken when the order is paid on arrival</small>
                    </div>
                    <div class="rv-dish-total-amt">
                      <small>Total</small>
                      <strong>{{ dishesTotal | appCurrency:'1.0-2' }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rv-field rv-span">
                <label>Special requests</label>
                <textarea
                  class="form-control"
                  rows="2"
                  name="b_notes"
                  [(ngModel)]="form.specialRequests"
                  [placeholder]="form.bookingType === 'PICKUP' ? 'What to prepare, packing notes…' : 'Birthday, high chair, window seat…'"
                ></textarea>
              </div>
            </div>

            <div class="rv-modal-foot">
              <button type="button" class="action-btn btn-outline-purple" (click)="showBooking = false">Cancel</button>
              <button type="submit" class="action-btn btn-gradient-purple" [disabled]="saving || dishOverLimit" [title]="dishOverLimit ? 'Reduce the dishes marked in amber - stock cannot make them' : ''">
                <span class="material-symbols-outlined">check</span>
                <span>Confirm Booking</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══ Booked dishes ═══ -->
      <div class="modal-backdrop" *ngIf="viewingDishes as vd" (click)="viewingDishes = null">
        <div class="modal-content rv-modal rv-modal-sm" (click)="$event.stopPropagation()">
          <div class="rv-modal-head">
            <span class="rv-modal-icon"><span class="material-symbols-outlined">restaurant_menu</span></span>
            <div>
              <h3>Booked dishes</h3>
              <p>{{ vd.customer_name }} · {{ vd.reservation_code }} · {{ vd.booking_type === 'PICKUP' ? 'Pickup' : 'Table' }} · {{ asDate(vd.reservation_time) | date: 'h:mm a, d MMM' }}</p>
            </div>
            <button type="button" class="modal-close-btn" (click)="viewingDishes = null" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="rv-bd-list">
            <div class="rv-bd-group" *ngFor="let g of bookedGroups(vd)">
              <div class="rv-bd-head">
                <span class="rv-dish-icon"><span class="material-symbols-outlined">restaurant</span></span>
                <strong>{{ g.name }}</strong>
                <span class="rv-bd-head-amt">{{ g.total | appCurrency:'1.0-2' }}</span>
              </div>
              <div class="rv-bd-row" *ngFor="let it of g.items">
                <span class="rv-bd-qty">{{ it.quantity }}×</span>
                <span class="rv-bd-name">
                  {{ it.variant_name || 'Regular' }}
                  <small>{{ it.unit_price | appCurrency:'1.0-2' }} each</small>
                  <em *ngIf="it.notes">{{ it.notes }}</em>
                </span>
                <span class="rv-bd-amt">{{ it.quantity * it.unit_price | appCurrency:'1.0-2' }}</span>
              </div>
            </div>
          </div>

          <div class="rv-dish-total">
            <div>
              <strong class="rv-dish-total-count">{{ bookedCount(vd) }} {{ bookedCount(vd) === 1 ? 'item' : 'items' }}</strong>
              <small><span class="material-symbols-outlined">info</span>Prices as booked · stock is taken when paid</small>
            </div>
            <div class="rv-dish-total-amt">
              <small>Total</small>
              <strong>{{ vd.items_total || 0 | appCurrency:'1.0-2' }}</strong>
            </div>
          </div>

          <div class="rv-modal-foot">
            <button type="button" class="action-btn btn-outline-purple" (click)="viewingDishes = null">Close</button>
          </div>
        </div>
      </div>

      <!-- ═══ Pickup -> dine in ═══ -->
      <div class="modal-backdrop" *ngIf="converting">
        <div class="modal-content rv-modal rv-modal-sm">
          <div class="rv-modal-head">
            <span class="rv-modal-icon"><span class="material-symbols-outlined">restaurant</span></span>
            <div>
              <h3>Dine in instead</h3>
              <p>{{ converting.customer_name }} · {{ asDate(converting.reservation_time) | date: 'h:mm a' }} · {{ converting.reservation_code }}</p>
            </div>
            <button type="button" class="modal-close-btn" (click)="converting = null" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="rv-convert-flow">
            <span class="rv-type is-pickup">Pickup</span>
            <span class="material-symbols-outlined rv-convert-arrow">arrow_forward</span>
            <span class="rv-type">Table</span>
            <small>Same booking, code and time - now for dining in.</small>
          </div>

          <div class="rv-grid">
            <div class="rv-field">
              <label>Party size *</label>
              <div class="rv-stepper">
                <button type="button" (click)="setConvertGuests(convertGuests - 1)" [disabled]="convertGuests <= 1">
                  <span class="material-symbols-outlined">remove</span>
                </button>
                <input type="number" min="1" name="c_guests" [(ngModel)]="convertGuests" (ngModelChange)="setConvertGuests($event)" />
                <button type="button" (click)="setConvertGuests(convertGuests + 1)">
                  <span class="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
            <div class="rv-field">
              <label>Assign table</label>
              <app-custom-dropdown
                [options]="tableOptions"
                [(ngModel)]="convertTableId"
                (ngModelChange)="onConvertTableChange()"
                name="c_table"
                placeholder="Assign on arrival"
                minWidth="100%"
              ></app-custom-dropdown>
              <small class="rv-hint rv-hint-warn" *ngIf="convertTableTooSmall as tbl">
                {{ tbl.table_number }} seats {{ tbl.capacity }} - the party of {{ convertGuests }} is larger.
              </small>
            </div>
          </div>

          <div class="rv-modal-foot">
            <button type="button" class="action-btn btn-outline-purple" (click)="converting = null">Cancel</button>
            <button type="button" class="action-btn btn-outline-purple" [disabled]="saving" (click)="saveConvert(false)">
              Save as table booking
            </button>
            <button type="button" class="action-btn btn-gradient-purple" [disabled]="saving" (click)="saveConvert(true)">
              Seat now →
            </button>
          </div>
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

          <p class="rv-seat-dishes" *ngIf="seating.items?.length">
            <span class="material-symbols-outlined">restaurant_menu</span>
            {{ seating.items!.length }} booked {{ seating.items!.length === 1 ? 'dish' : 'dishes' }} will be added when you
            <strong>Seat &amp; Start Order</strong> - stock is taken when the bill is paid.
          </p>
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
      .rv-status-tab.st-picked_up { --tone: #10B981; }
      .rv-status-tab.st-expired { --tone: #F97316; }
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
        display: grid; grid-template-columns: 20px 72px minmax(0, 1fr) auto; align-items: center; gap: 16px;
        padding: 14px 16px; border-radius: 14px;
        border: 1px solid var(--card-border, #E9D5FF);
        border-left: 4px solid var(--tone);
        background: color-mix(in srgb, var(--tone) 4%, var(--card-bg, #FFFFFF));
        transition: transform 0.15s, box-shadow 0.15s;
      }
      .rv-row + .rv-row { margin-top: 8px; }
      .rv-row:hover { transform: translateY(-1px); box-shadow: 0 10px 22px -16px rgba(0, 0, 0, 0.6); }
      .rv-row.st-seated { --tone: #10B981; }
      .rv-row.st-picked_up { --tone: #10B981; }
      .rv-row.st-cancelled, .rv-row.st-no_show { --tone: #9CA3AF; opacity: 0.7; }
      .rv-row.st-expired { --tone: #F97316; opacity: 0.75; }
      .rv-row.is-late { --tone: var(--danger, #EF4444); }
      .rv-row.is-selected { box-shadow: 0 0 0 2px var(--danger, #EF4444); }

      /* Bulk cancel */
      .rv-check { display: flex; align-items: center; justify-content: center; width: 20px; }
      .rv-check input, .rv-check-all input { width: 17px; height: 17px; accent-color: var(--primary, #7E22CE); cursor: pointer; }
      .rv-bulk-bar {
        display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        margin: 10px 0 4px; padding: 8px 12px; border-radius: 12px;
        border: 1px dashed var(--card-border, #E9D5FF);
      }
      .rv-bulk-bar.has-selection {
        border-style: solid;
        border-color: color-mix(in srgb, var(--danger, #EF4444) 45%, var(--card-border, #E9D5FF));
        background: color-mix(in srgb, var(--danger, #EF4444) 6%, transparent);
      }
      .rv-check-all { display: inline-flex; align-items: center; gap: 8px; margin: 0 !important; font-size: 12px; font-weight: 700; color: var(--text-main, #2E1065); cursor: pointer; text-transform: none; letter-spacing: 0; }
      .rv-bulk-link { border: none; background: none; padding: 0; font: inherit; font-size: 12px; font-weight: 700; color: var(--text-muted, #6B7280); cursor: pointer; text-decoration: underline; }
      .rv-bulk-cancel { margin-left: auto; background: var(--danger, #EF4444) !important; color: #FFFFFF !important; border-color: var(--danger, #EF4444) !important; }

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
      .rv-pill.st-picked_up { --tone: #10B981; }
      .rv-pill.st-expired { --tone: #F97316; }
      .rv-valid { display: flex; align-items: center; gap: 4px; margin: 4px 0 0; font-size: 11px; color: var(--text-muted, #6B7280); }
      .rv-valid .material-symbols-outlined { font-size: 14px; }
      .rv-countdown { font-variant-numeric: tabular-nums; color: var(--text-main, #2E1065); }
      .rv-valid-till { opacity: 0.8; }
      .rv-valid.is-soon, .rv-valid.is-soon .rv-countdown { color: #F59E0B; }
      .rv-valid.is-urgent, .rv-valid.is-urgent .rv-countdown { color: var(--danger, #EF4444); }
      .rv-valid.is-urgent .material-symbols-outlined { animation: rv-pulse 1.2s infinite; }
      .rv-valid.is-gone { color: var(--danger, #EF4444); }
      .rv-stepper-unit .rv-unit { align-self: center; padding-right: 4px; font-size: 12px; font-weight: 800; color: var(--text-muted, #6B7280); }
      .rv-hint-muted { color: var(--text-muted, #6B7280) !important; font-weight: 600; }

      /* Booking type chip in the list */
      .rv-type {
        display: inline-flex; align-items: center; gap: 3px;
        padding: 1px 8px; border-radius: 999px;
        font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em;
        color: var(--primary, #7E22CE);
        background: color-mix(in srgb, var(--primary, #7E22CE) 14%, transparent);
      }
      .rv-type .material-symbols-outlined { font-size: 13px; }
      .rv-type.is-pickup { color: #F59E0B; background: color-mix(in srgb, #F59E0B 16%, transparent); }

      /* Phone first */
      .rv-phone { position: relative; display: flex; align-items: center; }
      .rv-phone-menu small b { color: var(--primary, #7E22CE); font-weight: 900; }
      .rv-phone input { padding-right: 104px !important; }
      .rv-phone input.is-invalid { border-color: var(--danger, #EF4444) !important; }
      .rv-phone-state { position: absolute; right: 10px; display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 800; pointer-events: none; }
      .rv-phone-state .material-symbols-outlined { font-size: 15px; }
      .rv-phone-state.is-checking { color: var(--text-muted, #6B7280); }
      .rv-phone-state.is-found { color: #10B981; }
      .rv-phone-state.is-new { color: var(--primary, #7E22CE); }
      .rv-lookup.is-locked input { cursor: not-allowed; opacity: 0.9; }
      .rv-lookup.is-locked > .material-symbols-outlined { color: #10B981; }
      .rv-hint-ok { color: #10B981 !important; }

      /* Booked dishes */
      .rv-dish-toggle { margin-bottom: 0.6rem; }
      .rv-dishes { display: flex; flex-direction: column; gap: 8px; }
      .rv-dish-card {
        display: flex; flex-direction: column; gap: 10px;
        padding: 10px 12px; border-radius: 14px;
        border: 1px solid var(--card-border, #E9D5FF); background: var(--card-bg, #FFFFFF);
        transition: border-color 0.15s ease;
      }
      .rv-dish-card:hover { border-color: color-mix(in srgb, var(--primary, #7E22CE) 45%, var(--card-border, #E9D5FF)); }
      .rv-dish-card.has-warn { border-color: color-mix(in srgb, #F59E0B 55%, var(--card-border, #E9D5FF)); }

      .rv-dish-top { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto 28px; align-items: center; gap: 10px; }
      .rv-dish-icon {
        width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center;
        color: var(--primary, #7E22CE); background: color-mix(in srgb, var(--primary, #7E22CE) 14%, transparent);
      }
      .rv-dish-icon .material-symbols-outlined { font-size: 18px; }
      .rv-dish-title { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
      .rv-dish-title strong { font-size: 13.5px; font-weight: 800; color: var(--text-main, #2E1065); overflow-wrap: anywhere; }
      .rv-dish-title small { font-size: 11px; color: var(--text-muted, #6B7280); }
      .rv-dish-amt { font-size: 14px; font-weight: 900; font-variant-numeric: tabular-nums; color: var(--text-main, #2E1065); white-space: nowrap; }
      .rv-dish-remove {
        width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;
        border: none; background: transparent; color: var(--text-muted, #6B7280); cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
      }
      .rv-dish-remove:hover { color: var(--danger, #EF4444); background: color-mix(in srgb, var(--danger, #EF4444) 12%, transparent); }
      .rv-dish-remove .material-symbols-outlined { font-size: 17px; }

      .rv-dish-bottom { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding-left: 44px; }
      .rv-portions { display: inline-flex; flex-wrap: wrap; gap: 6px; }
      .rv-portion {
        display: inline-flex; align-items: baseline; gap: 5px; padding: 4px 10px; border-radius: 999px;
        border: 1px solid var(--card-border, #E9D5FF); background: var(--bg-app, #FAF5FF);
        font-family: inherit; font-size: 12px; font-weight: 700; color: var(--text-muted, #6B7280); cursor: pointer;
        transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
      }
      .rv-portion small { font-size: 11px; font-weight: 600; opacity: 0.8; }
      .rv-portion:hover { border-color: color-mix(in srgb, var(--primary, #7E22CE) 50%, var(--card-border, #E9D5FF)); }
      .rv-portion.is-active {
        color: #FFFFFF; border-color: var(--primary, #7E22CE);
        background: linear-gradient(135deg, var(--primary, #7E22CE), var(--primary-hover, #9333EA));
      }
      .rv-portion-single { font-size: 12px; font-weight: 700; color: var(--text-muted, #6B7280); }

      /* One card per dish, one row per portion */
      .rv-portion-rows { display: flex; flex-direction: column; margin-left: 44px; border-radius: 12px; overflow: hidden; border: 1px solid var(--card-border, #E9D5FF); }
      .rv-portion-row {
        display: grid; grid-template-columns: minmax(0, 1fr) auto 80px 28px; align-items: center; gap: 10px;
        padding: 8px 10px; background: var(--bg-app, #FAF5FF);
      }
      .rv-portion-row + .rv-portion-row { border-top: 1px solid var(--card-border, #E9D5FF); }
      .rv-portion-row.is-over { background: color-mix(in srgb, #F59E0B 10%, var(--bg-app, #FAF5FF)); }
      .rv-portion-row .rv-dish-warn { grid-column: 1 / -1; padding-left: 0; }
      .rv-portion-name { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; }
      .rv-portion-name span { font-size: 12.5px; font-weight: 700; color: var(--text-main, #2E1065); overflow-wrap: anywhere; }
      .rv-portion-name small { font-size: 11px; color: var(--text-muted, #6B7280); }
      .rv-portion-amt { text-align: right; font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--text-main, #2E1065); }
      .rv-portion-more { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-left: 44px; }
      .rv-portion-more > span { font-size: 11px; font-weight: 700; color: var(--text-muted, #6B7280); }
      @media (max-width: 560px) {
        .rv-portion-rows, .rv-portion-more { margin-left: 0; }
        .rv-portion-row { grid-template-columns: minmax(0, 1fr) auto; }
        .rv-portion-amt { text-align: left; }
      }

      /* Live stock breakdown */
      .rv-stock-use {
        display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border-radius: 14px;
        border: 1px solid var(--card-border, #E9D5FF); background: var(--bg-app, #FAF5FF);
      }
      .rv-stock-use-head { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-main, #2E1065); }
      .rv-stock-use-head .material-symbols-outlined { font-size: 16px; color: var(--primary, #7E22CE); }
      .rv-stock-use-head small {
        margin-left: auto; padding: 0 7px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase;
        color: #10B981; background: color-mix(in srgb, #10B981 16%, transparent);
      }
      .rv-stock-item { display: flex; flex-direction: column; gap: 2px; padding-top: 6px; border-top: 1px dashed var(--card-border, #E9D5FF); }
      .rv-stock-row { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; font-variant-numeric: tabular-nums; }
      .rv-stock-total { font-weight: 800; color: var(--text-main, #2E1065); }
      .rv-stock-total em { font-style: normal; font-weight: 600; color: var(--text-muted, #6B7280); }
      .rv-stock-minus { padding-left: 12px; color: var(--text-muted, #6B7280); }
      .rv-stock-left { padding-left: 12px; font-weight: 800; color: #10B981; border-top: 1px solid var(--card-border, #E9D5FF); padding-top: 2px; margin-top: 2px; }
      .rv-stock-item.is-over .rv-stock-left { color: var(--danger, #EF4444); }
      .rv-portion-add:disabled { opacity: 0.45; cursor: not-allowed; }
      .rv-portion-add em.is-out { background: color-mix(in srgb, var(--danger, #EF4444) 22%, transparent); color: var(--danger, #EF4444); }

      /* Portion chooser under the dish search */
      .rv-portion-pick {
        display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border-radius: 14px;
        border: 1px dashed color-mix(in srgb, var(--primary, #7E22CE) 55%, var(--card-border, #E9D5FF));
        background: color-mix(in srgb, var(--primary, #7E22CE) 7%, transparent);
      }
      .rv-portion-pick-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; color: var(--text-muted, #6B7280); }
      .rv-portion-pick-head strong { color: var(--text-main, #2E1065); }
      .rv-portion-done {
        padding: 3px 12px; border-radius: 999px; border: 1px solid var(--primary, #7E22CE);
        background: transparent; color: var(--primary, #7E22CE); font: inherit; font-size: 12px; font-weight: 800; cursor: pointer;
      }
      .rv-portion-done:hover { background: color-mix(in srgb, var(--primary, #7E22CE) 14%, transparent); }
      .rv-portion-add { align-items: center; padding: 5px 11px; }
      .rv-portion-add .material-symbols-outlined { font-size: 14px; }
      .rv-portion-add em { font-style: normal; font-size: 10px; font-weight: 800; padding: 0 6px; border-radius: 999px; background: rgba(255, 255, 255, 0.22); }

      /* Compact quantity counter */
      .rv-qty {
        display: inline-flex; align-items: center; height: 32px; border-radius: 999px; overflow: hidden;
        border: 1px solid var(--card-border, #E9D5FF); background: var(--bg-app, #FAF5FF);
      }
      .rv-qty button {
        width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;
        border: none; background: transparent; color: var(--primary, #7E22CE); cursor: pointer;
      }
      .rv-qty button:hover:not(:disabled) { background: color-mix(in srgb, var(--primary, #7E22CE) 14%, transparent); }
      .rv-qty button:disabled { opacity: 0.35; cursor: not-allowed; }
      .rv-qty button .material-symbols-outlined { font-size: 16px; }
      .rv-qty input {
        width: 38px; height: 32px; border: none; outline: none; background: transparent; text-align: center;
        font: inherit; font-size: 13px; font-weight: 800; color: var(--text-main, #2E1065); -moz-appearance: textfield;
      }
      .rv-qty input::-webkit-outer-spin-button, .rv-qty input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

      .rv-dish-warn {
        display: flex; align-items: center; gap: 5px; margin: 0; padding-left: 44px;
        font-size: 11px; font-weight: 700; color: #F59E0B;
      }
      .rv-dish-warn .material-symbols-outlined { font-size: 14px; }
      .rv-dish-empty { margin: 0; font-size: 12px; color: var(--text-muted, #6B7280); }
      .rv-dish-total {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 10px 12px; border-radius: 14px;
        border: 1px solid color-mix(in srgb, var(--primary, #7E22CE) 30%, transparent);
        background: color-mix(in srgb, var(--primary, #7E22CE) 9%, transparent);
      }
      .rv-dish-total > div:first-child { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .rv-dish-total-count { font-size: 13px; font-weight: 800; color: var(--text-main, #2E1065); }
      .rv-dish-total small { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted, #6B7280); }
      .rv-dish-total small .material-symbols-outlined { font-size: 13px; }
      .rv-dish-total-amt { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.1; }
      .rv-dish-total-amt strong { font-size: 18px; font-weight: 900; color: var(--primary, #7E22CE); }
      .rv-dish-summary {
        display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; padding: 4px 6px 4px 10px; border-radius: 999px;
        border: 1px solid var(--card-border, #E9D5FF); background: var(--bg-app, #FAF5FF);
        font-family: inherit; font-size: 12px; font-weight: 700; color: var(--text-main, #2E1065); cursor: pointer;
        transition: border-color 0.15s ease, background-color 0.15s ease;
      }
      .rv-dish-summary > .material-symbols-outlined { font-size: 16px; color: var(--primary, #7E22CE); }
      .rv-dish-summary strong { font-weight: 900; }
      .rv-dish-summary-go { opacity: 0.7; }
      .rv-dish-summary:hover { border-color: var(--primary, #7E22CE); background: color-mix(in srgb, var(--primary, #7E22CE) 10%, var(--bg-app, #FAF5FF)); }

      .rv-bd-list { display: flex; flex-direction: column; gap: 10px; max-height: min(55vh, 460px); overflow-y: auto; margin-bottom: 12px; }
      .rv-bd-group { border: 1px solid var(--card-border, #E9D5FF); border-radius: 14px; overflow: hidden; }
      .rv-bd-head { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 8px 12px; background: var(--card-bg, #FFFFFF); }
      .rv-bd-head strong { font-size: 13.5px; color: var(--text-main, #2E1065); overflow-wrap: anywhere; }
      .rv-bd-head-amt { font-weight: 900; font-variant-numeric: tabular-nums; color: var(--text-main, #2E1065); }
      .rv-bd-row {
        display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; align-items: center; gap: 10px;
        padding: 7px 12px; background: var(--bg-app, #FAF5FF); border-top: 1px solid var(--card-border, #E9D5FF);
      }
      .rv-bd-qty { font-weight: 900; color: var(--primary, #7E22CE); font-variant-numeric: tabular-nums; }
      .rv-bd-name { display: flex; flex-direction: column; min-width: 0; font-size: 12.5px; font-weight: 700; color: var(--text-main, #2E1065); overflow-wrap: anywhere; line-height: 1.3; }
      .rv-bd-name small { font-size: 11px; font-weight: 500; color: var(--text-muted, #6B7280); }
      .rv-bd-name em { font-size: 11px; font-weight: 600; font-style: normal; color: #F59E0B; }
      .rv-bd-amt { font-weight: 800; font-variant-numeric: tabular-nums; color: var(--text-main, #2E1065); font-size: 13px; }

      .rv-dish-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-top: 5px; font-size: 11px; color: var(--text-muted, #6B7280); }
      .rv-dish-chips > .material-symbols-outlined { font-size: 15px; }
      .rv-dish-chip { padding: 1px 7px; border-radius: 999px; background: var(--bg-app, #FAF5FF); border: 1px solid var(--card-border, #E9D5FF); color: var(--text-main, #2E1065); font-weight: 600; }
      .rv-dish-chips strong { margin-left: 2px; color: var(--text-main, #2E1065); }
      .rv-seat-dishes { display: flex; align-items: flex-start; gap: 6px; margin: 0 0 12px; padding: 8px 10px; border-radius: 10px; font-size: 12px;
        color: var(--text-main, #2E1065); background: color-mix(in srgb, var(--primary, #7E22CE) 8%, transparent); }
      .rv-seat-dishes .material-symbols-outlined { font-size: 16px; color: var(--primary, #7E22CE); }
      @media (max-width: 560px) { .rv-dish-bottom, .rv-dish-warn { padding-left: 0; } }

      /* Pickup -> dine in dialog */
      .rv-convert-flow {
        display: flex; flex-wrap: wrap; align-items: center; gap: 0.45rem;
        margin-bottom: 1rem; padding: 0.65rem 0.8rem; border-radius: 12px;
        background: var(--bg-app, #FAF5FF); border: 1px dashed var(--card-border, #E9D5FF);
      }
      .rv-convert-flow small { flex-basis: 100%; font-size: 0.72rem; color: var(--text-muted, #6B7280); }
      .rv-convert-arrow { font-size: 18px; color: var(--text-muted, #6B7280); }

      /* Table / Pickup toggle at the top of the booking form */
      .rv-type-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 1rem; }
      .rv-type-toggle button {
        display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 0.85rem;
        border-radius: 14px; border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--bg-app, #FAF5FF); color: var(--text-muted, #6B7280);
        font-family: inherit; text-align: left; cursor: pointer;
        transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;
      }
      .rv-type-toggle button > .material-symbols-outlined { font-size: 22px; }
      .rv-type-toggle button span:last-child { display: flex; flex-direction: column; line-height: 1.25; }
      .rv-type-toggle strong { font-size: 0.85rem; font-weight: 800; color: var(--text-main, #2E1065); }
      .rv-type-toggle small { font-size: 0.7rem; }
      .rv-type-toggle button:hover { border-color: color-mix(in srgb, var(--primary, #7E22CE) 50%, var(--card-border, #E9D5FF)); }
      .rv-type-toggle button.is-active {
        border-color: var(--primary, #7E22CE);
        background: color-mix(in srgb, var(--primary, #7E22CE) 12%, var(--card-bg, #ffffff));
        color: var(--primary, #7E22CE);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary, #7E22CE) 14%, transparent);
      }
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
        .rv-row { grid-template-columns: 20px 60px minmax(0, 1fr); }
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
  private productService = inject(ProductService);
  private checkoutService = inject(CheckoutService);

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
    { key: 'PICKED_UP', label: 'Picked up' },
    { key: 'EXPIRED', label: 'Expired' },
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
    // Every second: the expiry countdowns show seconds.
    this.clock = setInterval(() => this.tick(), 1000);
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
            this.pruneSelection();
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
      if (r.booking_type !== 'PICKUP' && (r.status === 'CONFIRMED' || r.status === 'SEATED')) g.covers += Number(r.guest_count) || 0;
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
      case 'PICKED_UP': return c.picked_up || 0;
      case 'EXPIRED': return c.expired || 0;
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
  /** One clock tick: move time on, and reload once when an open booking runs out. */
  private tick(): void {
    this.nowMs = Date.now();
    if (this.expiryReloadPending || this.isLoading) return;
    const due = (this.data?.rows || []).filter((r) => r.status === 'CONFIRMED' && r.seconds_to_expiry !== undefined && this.expirySeconds(r) <= 0 && !this.expiryReloaded.has(r.id));
    if (due.length) {
      // Once per booking, so a server that does not expire it cannot loop the page.
      for (const r of due) this.expiryReloaded.add(r.id);
      // The server expires it (and frees its table) on the next load.
      this.expiryReloadPending = true;
      setTimeout(() => {
        this.expiryReloadPending = false;
        this.load();
        this.loadTables();
      }, 1500);
    }
  }
  private expiryReloadPending = false;
  private expiryReloaded = new Set<number>();

  /** Seconds until this booking expires, counted down from the server's figure. */
  expirySeconds(r: ReservationRow): number {
    const base = Number(r.seconds_to_expiry);
    if (!Number.isFinite(base)) return Infinity;
    return base - Math.floor((this.nowMs - this.loadedAtMs) / 1000);
  }

  /** 1d 3h 20m · 23h 42m 10s · 9m 05s · 42s */
  countdown(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
    if (h > 0) return h + 'h ' + pad(m) + 'm ' + pad(sec) + 's';
    if (m > 0) return m + 'm ' + pad(sec) + 's';
    return sec + 's';
  }

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
      case 'PICKED_UP': return 'Picked up';
      case 'EXPIRED': return 'Expired';
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

  /** Picking a table fills Party size with its seats; the guest can still change it. */
  onTableChange(): void {
    const table = this.tables.find((t) => t.id === this.form.tableId);
    if (table && Number(table.capacity) > 0) {
      this.form.guestCount = Number(table.capacity);
    }
  }

  /** Party size, never below 1. A larger party than the table seats is allowed; the form warns. */
  setGuestCount(value: number | string): void {
    this.form.guestCount = Math.max(1, Math.floor(Number(value) || 1));
  }

  /** The chosen table, when it seats fewer than the party - shown as a warning, not blocked. */
  get selectedTableTooSmall(): DiningTable | null {
    const table = this.tables.find((t) => t.id === this.form.tableId);
    return table && Number(table.capacity) < Number(this.form.guestCount) ? table : null;
  }


  /**
   * Every free table, smallest
   * first. Not narrowed by party size: picking a table sets the party size.
   */
  get bookableTables(): DiningTable[] {
    return this.tables
      .filter((t) => t.status === 'AVAILABLE')
      .sort((a, b) => Number(a.capacity) - Number(b.capacity));
  }

  openBooking(): void {
    this.form = this.blankForm();
    this.bookingCustomer = null;
    this.phoneLookup = 'idle';
    this.lookupResults = [];
    this.lookupOpen = false;
    this.minDateTime = this.localDateTime(new Date());
    this.loadTables();
    this.loadMenu();
    this.portionPickId = null;
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
    this.phoneLookup = c.phone ? 'found' : 'idle';
  }

  // ─── Phone suggestions ───
  public phoneSuggestions: { id: number; name: string; phone: string }[] = [];
  public phoneSuggestOpen = false;
  private phoneSuggestTimer: ReturnType<typeof setTimeout> | null = null;
  private phoneSuggestSeq = 0;

  /** From 3 digits: saved customers whose number contains them. */
  private suggestPhones(value: string): void {
    if (this.phoneSuggestTimer) clearTimeout(this.phoneSuggestTimer);
    const digits = (value || '').replace(/\D/g, '');
    if (digits.length < 3) {
      this.phoneSuggestions = [];
      this.phoneSuggestOpen = false;
      return;
    }
    const seq = ++this.phoneSuggestSeq;
    this.phoneSuggestTimer = setTimeout(() => {
      this.customerService.suggestPhone(digits).subscribe({
        next: (res) => {
          if (seq !== this.phoneSuggestSeq || !res.success) return;
          // An exact match is already filled in; no need to suggest it.
          this.phoneSuggestions = (res.data.customers || []).filter((c) => (c.phone || '').replace(/\D/g, '') !== digits);
          this.phoneSuggestOpen = this.phoneSuggestions.length > 0;
        },
        error: () => {},
      });
    }, 200);
  }

  pickPhoneSuggestion(c: { id: number; name: string; phone: string }): void {
    this.phoneSuggestOpen = false;
    this.phoneSuggestions = [];
    this.phoneLookup = 'found';
    this.bookingCustomer = c as any;
    this.form.customerPhone = c.phone;
    this.form.customerName = c.name;
  }

  closePhoneSuggestSoon(): void {
    setTimeout(() => (this.phoneSuggestOpen = false), 150);
  }

  /** The phone with the typed digits highlighted. */
  markDigits(phone: string): string {
    const typed = (this.form.customerPhone || '').replace(/\D/g, '');
    const safe = String(phone || '').replace(/[<>&]/g, '');
    if (!typed) return safe;
    // Walk the stored number, marking the run of digits that matches.
    const digitsOnly = safe.replace(/\D/g, '');
    const at = digitsOnly.indexOf(typed);
    if (at < 0) return safe;
    let out = '', seen = 0;
    for (const ch of safe) {
      const isDigit = /\d/.test(ch);
      const inRun = isDigit && seen >= at && seen < at + typed.length;
      out += inRun ? '<b>' + ch + '</b>' : ch;
      if (isDigit) seen++;
    }
    return out.replace(/<\/b><b>/g, '');
  }

  // ─── Phone first (no customer is saved from a booking) ───
  public phoneLookup: 'idle' | 'checking' | 'found' | 'new' = 'idle';
  private phoneTimer: ReturnType<typeof setTimeout> | null = null;
  private phoneSeq = 0;

  get phoneError(): string | null {
    const raw = (this.form.customerPhone || '').trim();
    if (!raw) return null;
    const d = raw.replace(/\D/g, '');
    return d.length < 7 || d.length > 15 ? 'Enter a valid phone number (7 to 15 digits)' : null;
  }

  /**
   * Phone typed: once valid, check Customers. A saved customer's name is
   * filled in and locked; a new number lets the name be typed. Nothing is
   * saved here - the POS offers Save Customer when they buy.
   */
  onBookingPhone(value: string): void {
    this.form.customerPhone = value;
    this.suggestPhones(value);
    if (this.phoneTimer) clearTimeout(this.phoneTimer);
    if (this.phoneLookup === 'found') {
      // Leaving a matched number: its name was filled in for it.
      this.form.customerName = '';
      this.bookingCustomer = null;
    }
    const digits = (value || '').replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      this.phoneLookup = 'idle';
      return;
    }
    this.phoneLookup = 'checking';
    const seq = ++this.phoneSeq;
    this.phoneTimer = setTimeout(() => {
      this.customerService.lookupPhone(value).subscribe({
        next: (res) => {
          if (seq !== this.phoneSeq || !res.success) return;
          if (res.data.found && res.data.customer) {
            this.form.customerName = res.data.customer.name;
            this.bookingCustomer = res.data.customer as any;
            this.phoneLookup = 'found';
            this.lookupOpen = false;
          } else {
            this.phoneLookup = 'new';
          }
        },
        error: () => {
          if (seq === this.phoneSeq) this.phoneLookup = 'new';
        },
      });
    }, 300);
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
    if (this.phoneError) {
      this.notify.error(this.phoneError);
      return;
    }
    const isPickup = f.bookingType === 'PICKUP';
    if (!isPickup && !(Number(f.guestCount) >= 1)) {
      this.notify.error('Party size must be at least 1');
      return;
    }
    this.saving = true;
    this.diningService
      .createReservationPost({
        bookingType: f.bookingType,
        validHours: f.validHours,
        items:
          f.dishMode === 'DISHES'
            ? f.dishes.map((d) => ({ productId: d.productId, variantId: d.variantId, quantity: d.quantity, notes: d.notes || undefined }))
            : [],
        customerName: f.customerName.trim(),
        customerPhone: f.customerPhone.trim(),
        reservationTime: f.reservationTime,
        guestCount: isPickup ? 1 : Number(f.guestCount),
        tableId: isPickup ? null : f.tableId,
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
          const table = { ...res.data, active_guest_count: r.guest_count };
          this.withMenu(() => {
            this.cartService.clearCart();
            this.cartService.orderType.set('DINING');
            this.cartService.selectedTable.set(table);
            this.cartService.prefillCustomer.set({ name: r.customer_name, phone: r.customer_phone });
            const added = this.fillCartWithBooking(r);
            if (added) this.notify.info(added + ' booked ' + (added === 1 ? 'dish' : 'dishes') + ' added - send to the kitchen when ready');
            this.router.navigate(['/pos'], { state: { keepCart: true } });
          });
          return;
        }
        this.load();
        this.loadTables();
      },
      error: () => (this.saving = false),
    });
  }

  // ─── Booked dishes dialog ───
  public viewingDishes: ReservationRow | null = null;

  openDishes(r: ReservationRow): void {
    this.viewingDishes = r;
  }

  /** "3 dishes · 5 items" - the summary on a booking row. */
  dishLinesLabel(r: ReservationRow): string {
    const dishes = new Set((r.items || []).map((i) => i.product_id)).size;
    const count = this.bookedCount(r);
    return dishes + (dishes === 1 ? ' dish' : ' dishes') + ' · ' + count + (count === 1 ? ' item' : ' items');
  }

  bookedCount(r: ReservationRow): number {
    return (r.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  }

  /** A booking's dishes grouped by dish, portions under each, as booked. */
  bookedGroups(r: ReservationRow): { name: string; total: number; items: NonNullable<ReservationRow['items']> }[] {
    const map = new Map<number, { name: string; total: number; items: NonNullable<ReservationRow['items']> }>();
    for (const it of r.items || []) {
      let g = map.get(it.product_id);
      if (!g) {
        g = { name: it.product_name, total: 0, items: [] };
        map.set(it.product_id, g);
      }
      g.items.push(it);
      g.total += (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
    }
    return [...map.values()];
  }

  // ─── Pickup -> dine in ───
  public converting: ReservationRow | null = null;
  public convertGuests = 2;
  public convertTableId: number | null = null;

  openConvert(r: ReservationRow): void {
    this.converting = r;
    this.convertGuests = 2;
    this.convertTableId = null;
    this.loadTables();
  }

  /** Picking a table fills the party size with its seats, as in New Reservation. */
  onConvertTableChange(): void {
    const table = this.tables.find((t) => t.id === this.convertTableId);
    if (table && Number(table.capacity) > 0) this.convertGuests = Number(table.capacity);
  }

  setConvertGuests(value: number | string): void {
    this.convertGuests = Math.max(1, Math.floor(Number(value) || 1));
  }

  get convertTableTooSmall(): DiningTable | null {
    const table = this.tables.find((t) => t.id === this.convertTableId);
    return table && Number(table.capacity) < Number(this.convertGuests) ? table : null;
  }

  /**
   * Turn the pickup into a table booking. "Seat now" then opens the usual
   * Seat dialog on the converted booking, with its table picked, for guests
   * who are already here.
   */
  saveConvert(seatNow: boolean): void {
    const r = this.converting;
    if (!r) return;
    this.saving = true;
    this.diningService.convertPickupToTable(r.id, this.convertGuests, this.convertTableId).subscribe({
      next: (res) => {
        this.saving = false;
        if (!res.success) return;
        this.converting = null;
        this.notify.success(r.customer_name + ' - changed to dine-in');
        this.load();
        this.loadTables();
        if (seatNow && res.data) this.openSeat(res.data);
      },
      error: () => (this.saving = false),
    });
  }

  // ─── Booked dishes (optional) ───
  public menu: Product[] = [];
  public menuLoading = false;
  public pickDish: number | null = null;
  private dishOptionsKey = -1;
  private dishOptionsCache: DropdownOption[] = [];

  private loadMenu(done?: () => void): void {
    if (this.menu.length) { done?.(); return; }
    this.menuLoading = true;
    this.productService.getProducts(1, 500, undefined, undefined, 'ACTIVE').subscribe({
      next: (res) => {
        this.menuLoading = false;
        this.menu = res.success ? (res.data || []).filter((p) => p.status === 'ACTIVE' && p.is_available !== false) : [];
        done?.();
      },
      error: () => {
        this.menuLoading = false;
        done?.();
      },
    });
  }

  /** Run once the menu is loaded - the cart needs the full dish to add it. */
  private withMenu(fn: () => void): void {
    this.loadMenu(fn);
  }

  get dishOptions(): DropdownOption[] {
    if (this.dishOptionsKey !== this.menu.length) {
      this.dishOptionsKey = this.menu.length;
      this.dishOptionsCache = this.menu.map((p) => ({
        value: p.id,
        label: p.name,
        icon: 'restaurant',
        description: (p.category_name || 'Dish') + ' · from ' + (Number(p.selling_price) || 0),
      }));
    }
    return this.dishOptionsCache;
  }

  productFor(id: number): Product | undefined {
    return this.menu.find((p) => p.id === id);
  }

  variantsOf(id: number): ProductVariant[] {
    return (this.productFor(id)?.variants || []).filter((v) => v.status !== 'INACTIVE');
  }

  private defaultVariant(id: number): ProductVariant | null {
    const list = this.variantsOf(id);
    return list.find((v) => Number(v.is_default) === 1) || list[0] || null;
  }

  setDishMode(mode: 'NONE' | 'DISHES'): void {
    this.form.dishMode = mode;
    if (mode === 'DISHES') this.loadMenu();
    this.scheduleDishCheck();
  }

  // ─── Live stock (same rule as the till: stock-limit.util + /checkout/stock-check) ───
  /** Fresh balances from the live check; they win over the menu's loaded snapshot. */
  private freshBalances = new Map<number, number>();
  private dishCheckTimer: ReturnType<typeof setTimeout> | null = null;

  /** Ask the server for current balances of the stock these dishes use (debounced). */
  private scheduleDishCheck(): void {
    if (this.dishCheckTimer) clearTimeout(this.dishCheckTimer);
    const lines = this.form.dishMode === 'DISHES' ? this.form.dishes : [];
    if (!lines.length) return;
    this.dishCheckTimer = setTimeout(() => {
      this.checkoutService
        .stockCheck(lines.map((d) => ({ productId: d.productId, variantId: d.variantId, quantity: d.quantity })))
        .subscribe({
          next: (res) => {
            if (!res.success) return;
            for (const s of res.data.stocks) this.freshBalances.set(Number(s.stock_id), Number(s.available) || 0);
          },
          error: () => {},
        });
    }, 300);
  }

  private balances(): Map<number, number> {
    const map = snapshotBalances(this.menu);
    for (const [id, qty] of this.freshBalances) map.set(id, qty);
    return map;
  }

  private useOf(productId: number, variantId: number | null): StockUse[] | null {
    const product = this.productFor(productId);
    const variant = this.variantsOf(productId).find((v) => v.id === variantId) || null;
    return stockUseOf(product, variant);
  }

  /** Most this line can be, after every other line has its share of the same stock. Null = no limit. */
  lineMax(index: number): number | null {
    const d = this.form.dishes[index];
    if (!d) return null;
    const others = this.form.dishes.filter((_, i) => i !== index);
    const used = stockUsed(others.map((o) => ({ use: this.useOf(o.productId, o.variantId), quantity: o.quantity })));
    return maxUnits(this.useOf(d.productId, d.variantId), this.balances(), used);
  }

  atLimit(index: number): boolean {
    const max = this.lineMax(index);
    return max !== null && this.form.dishes[index].quantity >= max;
  }

  /** How many more of this dish + portion fit right now (null = no limit). */
  canAddCount(productId: number, variantId: number | null): number | null {
    const used = stockUsed(this.form.dishes.map((o) => ({ use: this.useOf(o.productId, o.variantId), quantity: o.quantity })));
    return maxUnits(this.useOf(productId, variantId), this.balances(), used);
  }

  get dishOverLimit(): boolean {
    if (this.form.dishMode !== 'DISHES') return false;
    return this.form.dishes.some((d, i) => {
      const max = this.lineMax(i);
      return max !== null && d.quantity > max;
    });
  }

  private dishLabel(d: BookingDish): string {
    const v = this.variantsOf(d.productId).find((x) => x.id === d.variantId);
    const name = this.productFor(d.productId)?.name || 'Dish';
    return v && this.variantsOf(d.productId).length > 1 ? name + ' (' + v.name + ')' : name;
  }

  /**
   * Each stock item these dishes draw on: what is in stock, what every line
   * takes from it, and what is left - e.g. Chicken 72 − Full × 1 (4) −
   * Half × 2 (4) = 64. Recomputed on every change.
   */
  get stockBreakdown(): { name: string; unit: string; total: number; uses: { label: string; amount: number }[]; left: number }[] {
    if (this.form.dishMode !== 'DISHES' || !this.form.dishes.length) return [];
    const balances = this.balances();
    const byStock = new Map<number, { name: string; unit: string; total: number; uses: { label: string; amount: number }[]; left: number }>();
    for (const d of this.form.dishes) {
      const use = this.useOf(d.productId, d.variantId);
      if (!use) continue;
      const product = this.productFor(d.productId);
      const variant = this.variantsOf(d.productId).find((x) => x.id === d.variantId) || null;
      for (const u of use) {
        let row = byStock.get(u.stockId);
        if (!row) {
          const info = variant?.stocks?.find((s) => Number(s.stock_id) === u.stockId);
          const total = balances.get(u.stockId) ?? 0;
          row = {
            name: info?.stock_name || (product?.stock_id === u.stockId ? product?.name || 'Stock' : 'Stock #' + u.stockId),
            unit: info?.unit_type || product?.linked_unit_type || '',
            total,
            uses: [],
            left: total,
          };
          byStock.set(u.stockId, row);
        }
        const amount = u.perUnit * d.quantity;
        row.uses.push({ label: (variant && this.variantsOf(d.productId).length > 1 ? variant.name : product?.name || 'Dish') + ' × ' + d.quantity, amount });
        row.left -= amount;
      }
    }
    return [...byStock.values()];
  }

  /** The dish whose portion chooser is open, or null. */
  public portionPickId: number | null = null;

  /**
   * Picking a dish from the search. One portion: add it straight away (again
   * = one more). Several: open the portion chooser, so Full and Half can be
   * added as separate lines instead of silently bumping the default one.
   */
  addDish(productId: number | null): void {
    if (!productId) return;
    // Clear the search so the same dish can be picked again.
    setTimeout(() => (this.pickDish = null));
    if (this.variantsOf(productId).length > 1) {
      this.portionPickId = productId;
      return;
    }
    this.portionPickId = null;
    this.addPortion(productId, this.defaultVariant(productId)?.id ?? null);
  }

  /** One more of this dish + portion: its own line, created on first add. */
  addPortion(productId: number, variantId: number | null): void {
    const room = this.canAddCount(productId, variantId);
    if (room !== null && room < 1) {
      const probe: BookingDish = { productId, variantId, quantity: 1, notes: '' };
      this.notify.warning(stockLimitMessage(this.dishLabel(probe), this.qtyOf(productId, variantId)));
      return;
    }
    const line = this.form.dishes.find((d) => d.productId === productId && d.variantId === variantId);
    const seq = ++this.dishSeq;
    if (line) {
      line.quantity = Math.min(999, line.quantity + 1);
      line.seq = seq;
    } else {
      this.form.dishes.push({ productId, variantId, quantity: 1, notes: '', seq });
    }
    this.scheduleDishCheck();
  }

  /**
   * The booked dishes, one group per dish in the order first added, each with
   * its portion lines. Lines stay the unit that is saved and priced; this is
   * only how they are shown.
   */
  /** Order of adding, so the latest dish shows at the top. */
  private dishSeq = 0;

  get dishGroups(): { productId: number; lines: { dish: BookingDish; index: number }[]; total: number; count: number }[] {
    const groups = new Map<number, { productId: number; lines: { dish: BookingDish; index: number }[]; total: number; count: number }>();
    this.form.dishes.forEach((dish, index) => {
      let g = groups.get(dish.productId);
      if (!g) {
        g = { productId: dish.productId, lines: [], total: 0, count: 0 };
        groups.set(dish.productId, g);
      }
      g.lines.push({ dish, index });
      g.total += this.dishLineTotal(dish);
      g.count += dish.quantity;
    });
    // Newest first: the dish (and portion) added last sits at the top. Changing
    // a quantity does not reorder, so rows do not jump while you tap + / -.
    const latest = (g: { lines: { dish: BookingDish }[] }) => Math.max(...g.lines.map((l) => l.dish.seq ?? 0));
    for (const g of groups.values()) g.lines.sort((a, b) => (b.dish.seq ?? 0) - (a.dish.seq ?? 0));
    return [...groups.values()].sort((a, b) => latest(b) - latest(a));
  }

  trackDishGroup(_: number, g: { productId: number }): number {
    return g.productId;
  }

  trackDishLine(_: number, l: { dish: BookingDish }): string {
    return l.dish.productId + ':' + (l.dish.variantId ?? 'base');
  }

  groupHasWarn(g: { lines: { index: number }[] }): boolean {
    return g.lines.some((l) => !!this.stockNote(l.index));
  }

  /** The portion's name, or the dish name when it has only one portion. */
  portionName(d: BookingDish): string {
    const v = this.variantsOf(d.productId).find((x) => x.id === d.variantId);
    return v?.name || 'Regular';
  }

  /** Portions of a dish not on the booking yet - offered inside its card. */
  missingPortions(productId: number): ProductVariant[] {
    const list = this.variantsOf(productId);
    if (list.length < 2) return [];
    return list.filter((v) => !this.form.dishes.some((d) => d.productId === productId && d.variantId === v.id));
  }

  removeDishGroup(productId: number): void {
    this.form.dishes = this.form.dishes.filter((d) => d.productId !== productId);
    if (this.portionPickId === productId) this.portionPickId = null;
    this.scheduleDishCheck();
  }

  /** How many of this dish + portion are on the booking - shown on the chooser. */
  qtyOf(productId: number, variantId: number | null): number {
    return this.form.dishes.find((d) => d.productId === productId && d.variantId === variantId)?.quantity || 0;
  }

  /**
   * Change a line's portion. If that portion already has its own line, the
   * two merge, so the list never shows the same dish + portion twice.
   */
  setLinePortion(d: BookingDish, variantId: number): void {
    if (d.variantId === variantId) return;
    const other = this.form.dishes.find((x) => x !== d && x.productId === d.productId && x.variantId === variantId);
    if (other) {
      other.quantity = Math.min(999, other.quantity + d.quantity);
      this.form.dishes.splice(this.form.dishes.indexOf(d), 1);
      this.scheduleDishCheck();
      return;
    }
    d.variantId = variantId;
    this.scheduleDishCheck();
  }

  removeDish(index: number): void {
    this.form.dishes.splice(index, 1);
    this.scheduleDishCheck();
  }

  /** Quantity 1-999, and never above what stock can make with the other lines. */
  setDishQty(d: BookingDish, value: number | string): void {
    let qty = Math.min(999, Math.max(1, Math.floor(Number(value) || 1)));
    const max = this.lineMax(this.form.dishes.indexOf(d));
    if (max !== null && qty > max) {
      this.notify.warning(stockLimitMessage(this.dishLabel(d), max));
      qty = Math.max(1, max);
    }
    d.quantity = qty;
    this.scheduleDishCheck();
  }

  private dishPrice(d: BookingDish): number {
    const v = this.variantsOf(d.productId).find((x) => x.id === d.variantId);
    return Number(v ? v.selling_price : this.productFor(d.productId)?.selling_price) || 0;
  }

  dishUnitPrice(d: BookingDish): number {
    return this.dishPrice(d);
  }

  dishLineTotal(d: BookingDish): number {
    return this.dishPrice(d) * d.quantity;
  }

  get dishesTotal(): number {
    return this.form.dishes.reduce((s, d) => s + this.dishLineTotal(d), 0);
  }

  get dishCount(): number {
    return this.form.dishes.reduce((s, d) => s + d.quantity, 0);
  }

  /**
   * Over the limit: current stock cannot make this line once the other lines
   * have their share. Booking is blocked until it is reduced (the server
   * refuses it too). Nothing is held - the POS checks again when paid.
   */
  stockNote(index: number): string | null {
    const d = this.form.dishes[index];
    const max = this.lineMax(index);
    if (!d || max === null || d.quantity <= max) return null;
    return max <= 0 ? 'Out of stock now - remove this line' : 'Only ' + max + ' can be made with the other dishes - reduce to ' + max;
  }

  /** Put a booking's dishes in the cart; returns how many lines went in. */
  private fillCartWithBooking(r: ReservationRow): number {
    let added = 0;
    const missing: string[] = [];
    for (const it of r.items || []) {
      const product = this.productFor(it.product_id);
      if (!product) { missing.push(it.product_name); continue; }
      const variant = (product.variants || []).find((v) => v.id === it.variant_id) || null;
      if (this.cartService.addItem(product, variant, it.quantity, it.notes || undefined)) added++;
      else missing.push(it.product_name);
    }
    if (missing.length) this.notify.warning('Not available any more, left out: ' + missing.join(', '));
    return added;
  }

  /**
   * A pickup booked with dishes: open the POS with them as a Takeaway order.
   * Paying the bill takes the stock and marks the pickup as picked up.
   */
  collectAndBill(r: ReservationRow): void {
    this.withMenu(() => {
      this.cartService.clearCart();
      this.cartService.orderType.set('TAKEAWAY');
      const added = this.fillCartWithBooking(r);
      if (!added) {
        this.notify.error('None of the booked dishes can be sold right now - add them on the POS instead');
        return;
      }
      this.cartService.bookingRef.set({ reservationId: r.id, code: r.reservation_code, customerName: r.customer_name });
      this.cartService.prefillCustomer.set({ name: r.customer_name, phone: r.customer_phone });
      this.cartService.orderNotes.set('Pickup booking ' + r.reservation_code + ' - ' + r.customer_name);
      this.notify.info('Pay the bill to mark ' + r.reservation_code + ' as picked up');
      this.router.navigate(['/pos'], { state: { keepCart: true } });
    });
  }

  /** Booking validity in whole hours, 1-720 (30 days). */
  setValidHours(value: number | string): void {
    this.form.validHours = Math.min(720, Math.max(1, Math.floor(Number(value) || 24)));
  }

  /** When the booking being made would expire: its time plus the valid hours. */
  get bookingExpiresAt(): Date | null {
    const t = this.form.reservationTime ? new Date(this.form.reservationTime) : null;
    if (!t || isNaN(t.getTime())) return null;
    return new Date(t.getTime() + (Number(this.form.validHours) || 24) * 3600 * 1000);
  }

  /** Switch the form between a table booking and a pickup; a pickup holds no table. */
  setBookingType(type: 'TABLE' | 'PICKUP'): void {
    this.form.bookingType = type;
    if (type === 'PICKUP') this.form.tableId = null;
  }

  /**
   * Switch a confirmed booking's type from its badge. Pickup -> table opens
   * the dine-in dialog (party size, optional table, seat now); table ->
   * pickup confirms and releases any table it was holding.
   */
  switchType(r: ReservationRow): void {
    if (r.booking_type === 'PICKUP') {
      this.openConvert(r);
      return;
    }
    const held = r.table_number ? ' Table ' + r.table_number + ' held for it will be released.' : '';
    this.notify.confirm({
      title: 'Change to pickup',
      message: r.customer_name + ' will collect instead of dining in - same code, time and dishes.' + held,
      confirmText: 'Change to Pickup',
      onConfirm: () => {
        this.diningService.convertTableToPickup(r.id).subscribe({
          next: () => {
            this.notify.success(r.customer_name + ' - changed to pickup');
            this.load();
            this.loadTables();
          },
          error: () => {},
        });
      },
    });
  }

  /** The customer collected a pickup booking. */
  markPickedUp(r: ReservationRow): void {
    this.diningService.markReservationPickedUp(r.id).subscribe({
      next: () => {
        this.notify.success(r.customer_name + ' - pickup collected');
        this.load();
      },
      error: () => {},
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

  // ─── Bulk cancel ───
  public selected = new Set<number>();

  /** Confirmed bookings on screen - the only ones that can be ticked. */
  get confirmedRows(): ReservationRow[] {
    return (this.data?.rows || []).filter((r) => r.status === 'CONFIRMED');
  }

  get allSelected(): boolean {
    const rows = this.confirmedRows;
    return rows.length > 0 && rows.every((r) => this.selected.has(r.id));
  }

  toggleSelect(id: number): void {
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
  }

  toggleSelectAll(): void {
    if (this.allSelected) this.selected.clear();
    else for (const r of this.confirmedRows) this.selected.add(r.id);
  }

  clearSelection(): void {
    this.selected.clear();
  }

  /** Keep only ticks on confirmed bookings still on screen, e.g. after a filter change. */
  private pruneSelection(): void {
    const visible = new Set(this.confirmedRows.map((r) => r.id));
    for (const id of [...this.selected]) if (!visible.has(id)) this.selected.delete(id);
  }

  bulkCancel(): void {
    const ids = [...this.selected];
    if (!ids.length) return;
    const held = this.confirmedRows.filter((r) => this.selected.has(r.id) && r.table_id).length;
    this.notify.confirm({
      title: 'Cancel ' + ids.length + (ids.length === 1 ? ' booking' : ' bookings'),
      message:
        'Cancel the ' + ids.length + ' selected ' + (ids.length === 1 ? 'booking' : 'bookings') + '?' +
        (held ? ' ' + held + (held === 1 ? ' table' : ' tables') + ' held for them will be released.' : '') +
        ' This cannot be undone.',
      confirmText: 'Cancel ' + ids.length,
      isDestructive: true,
      onConfirm: () => {
        this.saving = true;
        this.diningService.cancelReservationsBulk(ids).subscribe({
          next: (res) => {
            this.saving = false;
            if (!res.success) return;
            const { cancelled, skipped } = res.data;
            if (skipped.length) {
              this.notify.warning(cancelled + ' cancelled; ' + skipped.length + ' skipped (no longer confirmed): ' + skipped.join(', '));
            } else {
              this.notify.info(cancelled + (cancelled === 1 ? ' booking' : ' bookings') + ' cancelled');
            }
            this.selected.clear();
            this.load();
            this.loadTables();
          },
          error: () => (this.saving = false),
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
      bookingType: 'TABLE' as 'TABLE' | 'PICKUP',
      validHours: 24,
      dishMode: 'NONE' as 'NONE' | 'DISHES',
      dishes: [] as BookingDish[],
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
