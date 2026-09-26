import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiningDesignKey } from '../../../core/services/dining-layout.service';
import { DINING_LAYOUT_CSS } from '../../styles/dining-layout.styles';
import { ActionLoadingDirective } from '../../directives/action-loading.directive';

@Component({
  selector: 'app-dining-layout-preview',
  standalone: true,
  imports: [CommonModule, ActionLoadingDirective],
  template: `
    <div
      class="dining-stage"
      [ngClass]="'dining-layout-' + layoutKey"
      [ngStyle]="cssVars"
      aria-label="Live Dining Floor Preview"
    >
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 1: CHECKERED FLOOR PLAN PREVIEW                          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'checkered'" class="chk-floor-canvas">
        <!-- Floor Plants -->
        <span class="chk-plant" style="top: 15px; left: 20px;"></span>
        <span class="chk-plant" style="top: 15px; right: 25px;"></span>
        <span class="chk-plant" style="top: 50%; left: 42%;"></span>
        <span class="chk-plant" style="top: 50%; right: 42%;"></span>

        <!-- 1. Round Table (T-03) with Yellow Booth Arc -->
        <div class="chk-table-card chk-table-round">
          <div class="chk-chair-seat chk-chair-top" style="left: calc(50% - 11px);"></div>
          <div class="chk-chair-seat chk-chair-left" style="top: calc(50% - 11px);"></div>
          <div class="chk-chair-seat chk-chair-right" style="top: calc(50% - 11px);"></div>
          <div class="chk-booth-arc" style="border-bottom-color: #F59E0B;"></div>
          <div class="chk-coaster">
            <span class="chk-coaster-code">T-03</span>
          </div>
        </div>

        <!-- 2. Square Table (T-07) with Blue Bottom Stripe -->
        <div class="chk-table-card chk-table-square">
          <div class="chk-chair-seat chk-chair-top" style="left: calc(50% - 11px);"></div>
          <div class="chk-chair-seat chk-chair-bottom" style="left: calc(50% - 11px);"></div>
          <div class="chk-chair-seat chk-chair-left" style="top: calc(50% - 11px);"></div>
          <div class="chk-chair-seat chk-chair-right" style="top: calc(50% - 11px);"></div>
          <div class="chk-bottom-accent" style="background: #3B82F6;"></div>
          <div class="chk-coaster">
            <span class="chk-coaster-code">T-07</span>
          </div>
        </div>

        <!-- 3. Banquet Table 1 (Albert) with Diamond Checkered Cloth -->
        <div class="chk-table-card chk-table-banquet">
          <!-- Top Chairs -->
          <div class="chk-chair-seat chk-chair-top" style="left: 30px;"></div>
          <div class="chk-chair-seat chk-chair-top" style="left: 80px;"></div>
          <div class="chk-chair-seat chk-chair-top" style="left: 130px;"></div>
          <div class="chk-chair-seat chk-chair-top" style="left: 180px;"></div>
          <!-- Bottom Chairs -->
          <div class="chk-chair-seat chk-chair-bottom" style="left: 30px;"></div>
          <div class="chk-chair-seat chk-chair-bottom" style="left: 80px;"></div>
          <div class="chk-chair-seat chk-chair-bottom" style="left: 130px;"></div>
          <div class="chk-chair-seat chk-chair-bottom" style="left: 180px;"></div>
          <!-- End Chairs -->
          <div class="chk-chair-seat chk-chair-left" style="top: calc(50% - 11px);"></div>
          <div class="chk-chair-seat chk-chair-right" style="top: calc(50% - 11px);"></div>

          <div class="chk-cloth-diamond"></div>
          <div class="chk-guest-label">
            Albert
            <span class="chk-guest-time">08.15</span>
          </div>
          <div class="chk-status-badge is-busy">T-01</div>
        </div>

        <!-- 4. Round Table (T-05) with Orange Booth Arc -->
        <div class="chk-table-card chk-table-round">
          <div class="chk-chair-seat chk-chair-top" style="left: calc(50% - 11px);"></div>
          <div class="chk-chair-seat chk-chair-left" style="top: calc(50% - 11px);"></div>
          <div class="chk-chair-seat chk-chair-right" style="top: calc(50% - 11px);"></div>
          <div class="chk-booth-arc arc-orange"></div>
          <div class="chk-coaster">
            <span class="chk-coaster-code">T-05</span>
          </div>
        </div>

        <!-- 5. Banquet Table 2 (Cristy) -->
        <div class="chk-table-card chk-table-banquet">
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
            Cristy
            <span class="chk-guest-time">08.15</span>
          </div>
          <div class="chk-status-badge is-free">T-02</div>
        </div>

        <!-- 6. Square Table (T-04) with Teal Stripe -->
        <div class="chk-table-card chk-table-square">
          <div class="chk-chair-seat chk-chair-top" style="left: calc(50% - 11px);"></div>
          <div class="chk-chair-seat chk-chair-bottom" style="left: calc(50% - 11px);"></div>
          <div class="chk-chair-seat chk-chair-left" style="top: calc(50% - 11px);"></div>
          <div class="chk-chair-seat chk-chair-right" style="top: calc(50% - 11px);"></div>
          <div class="chk-bottom-accent accent-teal"></div>
          <div class="chk-coaster">
            <span class="chk-coaster-code">T-04</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 2: TABLE VIEW / SOFT NEUMORPHIC PREVIEW                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'neumorphic'">
        <div class="neu-header-row">
          <h2 class="neu-page-title">Table View</h2>
          <span class="text-xs font-semibold text-slate-400">Main AC Hall · 12 Tables</span>
        </div>

        <div class="neu-floor-canvas">
          <!-- A1 (Dark Badge) -->
          <div class="neu-table-card neu-table-4seat">
            <span class="neu-pill-seat neu-pill-top" style="left: 25px;"></span>
            <span class="neu-pill-seat neu-pill-top" style="right: 25px;"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="left: 25px;"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="right: 25px;"></span>
            <div class="neu-code-badge badge-dark">
              <span>A1</span>
            </div>
          </div>

          <!-- A2 (Coral/Red Badge) -->
          <div class="neu-table-card neu-table-2seat is-busy">
            <span class="neu-pill-seat neu-pill-top" style="left: calc(50% - 16px);"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="left: calc(50% - 16px);"></span>
            <div class="neu-code-badge badge-red">
              <span>A2</span>
              <span class="neu-bill-sub">₹450</span>
            </div>
          </div>

          <!-- A3 (Blue Badge, 6-Seater) -->
          <div class="neu-table-card neu-table-6seat">
            <span class="neu-pill-seat neu-pill-top" style="left: 20px;"></span>
            <span class="neu-pill-seat neu-pill-top" style="left: calc(50% - 16px);"></span>
            <span class="neu-pill-seat neu-pill-top" style="right: 20px;"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="left: 20px;"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="left: calc(50% - 16px);"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="right: 20px;"></span>
            <div class="neu-code-badge badge-blue">
              <span>A3</span>
            </div>
          </div>

          <!-- A4 (Blue Badge, 6-Seater) -->
          <div class="neu-table-card neu-table-6seat">
            <span class="neu-pill-seat neu-pill-top" style="left: 20px;"></span>
            <span class="neu-pill-seat neu-pill-top" style="left: calc(50% - 16px);"></span>
            <span class="neu-pill-seat neu-pill-top" style="right: 20px;"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="left: 20px;"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="left: calc(50% - 16px);"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="right: 20px;"></span>
            <div class="neu-code-badge badge-blue">
              <span>A4</span>
            </div>
          </div>

          <!-- A6 (Blue 4-Seater) -->
          <div class="neu-table-card neu-table-4seat">
            <span class="neu-pill-seat neu-pill-top" style="left: 25px;"></span>
            <span class="neu-pill-seat neu-pill-top" style="right: 25px;"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="left: 25px;"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="right: 25px;"></span>
            <div class="neu-code-badge badge-blue">
              <span>A6</span>
            </div>
          </div>

          <!-- A8 (Dark 2-Seater) -->
          <div class="neu-table-card neu-table-2seat">
            <span class="neu-pill-seat neu-pill-top" style="left: calc(50% - 16px);"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="left: calc(50% - 16px);"></span>
            <div class="neu-code-badge badge-dark">
              <span>A8</span>
            </div>
          </div>

          <!-- A9 (Dark 6-Seater) -->
          <div class="neu-table-card neu-table-6seat">
            <span class="neu-pill-seat neu-pill-top" style="left: 20px;"></span>
            <span class="neu-pill-seat neu-pill-top" style="left: calc(50% - 16px);"></span>
            <span class="neu-pill-seat neu-pill-top" style="right: 20px;"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="left: 20px;"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="left: calc(50% - 16px);"></span>
            <span class="neu-pill-seat neu-pill-bottom" style="right: 20px;"></span>
            <div class="neu-code-badge badge-dark">
              <span>A9</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 3: ILLUSTRATED CAPACITY FLOOR PREVIEW                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'illustrated'" class="ill-floor-canvas">
        <!-- Table #1 (Mint, 6 Seats) -->
        <div class="ill-table-card ill-theme-mint ill-table-lg">
          <!-- Top 4 Chairs (3 occupied teal, 1 free outline) -->
          <div class="ill-chair-icon ill-chair-top is-occupied" style="left: 25px;">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-top is-occupied" style="left: 70px;">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-top is-occupied" style="left: 115px;">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-top" style="left: 160px;">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <!-- Bottom 4 Chairs -->
          <div class="ill-chair-icon ill-chair-bottom is-occupied" style="left: 25px;">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-bottom is-occupied" style="left: 70px;">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-bottom is-occupied" style="left: 115px;">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-bottom" style="left: 160px;">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <!-- Left/Right Ends -->
          <div class="ill-chair-icon ill-chair-left" style="top: calc(50% - 9px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-right" style="top: calc(50% - 9px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>

          <div class="ill-table-title">Table #1</div>
          <div class="ill-table-capacity">
            <span>👥</span>
            <span>6</span>
          </div>
        </div>

        <!-- Table #2 (Pink, 2 Seats) -->
        <div class="ill-table-card ill-theme-pink ill-table-md">
          <div class="ill-chair-icon ill-chair-top" style="left: calc(50% - 10px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-bottom" style="left: calc(50% - 10px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-left is-occupied" style="top: calc(50% - 9px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-right is-occupied" style="top: calc(50% - 9px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>

          <div class="ill-table-title">Table #2</div>
          <div class="ill-table-capacity">
            <span>👥</span>
            <span>2</span>
          </div>
        </div>

        <!-- Table #3 (Mint, 2 Seats) -->
        <div class="ill-table-card ill-theme-mint ill-table-md">
          <div class="ill-chair-icon ill-chair-top" style="left: calc(50% - 10px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-bottom" style="left: calc(50% - 10px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-left is-occupied" style="top: calc(50% - 9px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-right is-occupied" style="top: calc(50% - 9px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>

          <div class="ill-table-title">Table #3</div>
          <div class="ill-table-capacity">
            <span>👥</span>
            <span>2</span>
          </div>
        </div>

        <!-- Table #5 (Lavender, 0 Seats / Empty) -->
        <div class="ill-table-card ill-theme-lavender ill-table-sm">
          <div class="ill-chair-icon ill-chair-top" style="left: calc(50% - 10px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-bottom" style="left: calc(50% - 10px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-left" style="top: calc(50% - 9px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>
          <div class="ill-chair-icon ill-chair-right" style="top: calc(50% - 9px);">
            <svg class="ill-chair-svg" viewBox="0 0 24 24"><path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M8 12h8" /></svg>
          </div>

          <div class="ill-table-title">Table #5</div>
          <div class="ill-table-capacity">
            <span>👥</span>
            <span>0</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 4: LIST VIEW PREVIEW                                     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'list'" class="list-table-container">
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
            <tr>
              <td><span class="list-code-badge">T-01</span></td>
              <td><b>Banquet Royal</b></td>
              <td><span class="list-section-chip">Main AC Hall</span></td>
              <td>8 Covers</td>
              <td><span class="list-status-pill is-busy">● Occupied</span></td>
              <td>42m on table (19:15)</td>
              <td><b>₹1,450.00</b></td>
              <td style="text-align: right;">
                <button type="button" class="list-action-btn">Manage</button>
              </td>
            </tr>
            <tr>
              <td><span class="list-code-badge">T-02</span></td>
              <td><b>Window Corner</b></td>
              <td><span class="list-section-chip">Terrace Patio</span></td>
              <td>4 Covers</td>
              <td><span class="list-status-pill is-free">● Available</span></td>
              <td>—</td>
              <td>—</td>
              <td style="text-align: right;">
                <button type="button" class="list-action-btn">Start Order</button>
              </td>
            </tr>
            <tr>
              <td><span class="list-code-badge">T-03</span></td>
              <td><b>Center Booth</b></td>
              <td><span class="list-section-chip">Main AC Hall</span></td>
              <td>4 Covers</td>
              <td><span class="list-status-pill is-busy">● Occupied</span></td>
              <td>1h 05m on table</td>
              <td><b>₹890.00</b></td>
              <td style="text-align: right;">
                <button type="button" class="list-action-btn">Manage</button>
              </td>
            </tr>
            <tr>
              <td><span class="list-code-badge">T-04</span></td>
              <td><b>Patio Bistro</b></td>
              <td><span class="list-section-chip">Garden Zone</span></td>
              <td>2 Covers</td>
              <td><span class="list-status-pill is-blocked">● Out of Service</span></td>
              <td>Maintenance</td>
              <td>—</td>
              <td style="text-align: right;">
                <button type="button" class="list-action-btn" style="background: #64748B;">Service</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 5: CARD LIST VIEW PREVIEW                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'cardlist'" class="cardlist-container">
        <!-- Card 1 -->
        <div class="cardlist-row-card">
          <div class="cardlist-left-col">
            <span class="cardlist-badge">T-01</span>
            <div>
              <span class="cardlist-section">Main AC Hall</span>
              <div class="cardlist-seats">👥 8 Seats</div>
            </div>
          </div>
          <div class="cardlist-mid-col">
            <div class="cardlist-title-row">
              <span class="cardlist-name">Banquet Royal</span>
              <span class="list-status-pill is-busy">● Occupied</span>
            </div>
            <div class="cardlist-dwell-bar">
              <i class="on"></i>
              <i class="on"></i>
              <i class="on"></i>
              <i></i>
              <i></i>
              <i></i>
            </div>
            <span class="text-xs text-slate-500">45m on table · Guest: Dr. Sharma</span>
          </div>
          <div class="cardlist-right-col">
            <div>
              <div class="cardlist-bill-amount">₹1,450.00</div>
              <span class="text-xs text-slate-400">Order #ORD-1082</span>
            </div>
            <button type="button" class="list-action-btn">Manage Table</button>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="cardlist-row-card">
          <div class="cardlist-left-col">
            <span class="cardlist-badge is-free">T-02</span>
            <div>
              <span class="cardlist-section">Terrace Patio</span>
              <div class="cardlist-seats">👥 4 Seats</div>
            </div>
          </div>
          <div class="cardlist-mid-col">
            <div class="cardlist-title-row">
              <span class="cardlist-name">Window Corner</span>
              <span class="list-status-pill is-free">● Ready</span>
            </div>
            <span class="text-xs text-slate-500">Laid and ready for next party</span>
          </div>
          <div class="cardlist-right-col">
            <div class="text-xs text-emerald-600 font-semibold">Available Now</div>
            <button type="button" class="list-action-btn" style="background: #10B981;">Start Order</button>
          </div>
        </div>

        <!-- Card 3 -->
        <div class="cardlist-row-card">
          <div class="cardlist-left-col">
            <span class="cardlist-badge is-blocked">T-04</span>
            <div>
              <span class="cardlist-section">Garden Zone</span>
              <div class="cardlist-seats">👥 2 Seats</div>
            </div>
          </div>
          <div class="cardlist-mid-col">
            <div class="cardlist-title-row">
              <span class="cardlist-name">Patio Bistro</span>
              <span class="list-status-pill is-blocked">● Blocked</span>
            </div>
            <span class="text-xs text-slate-500">Scheduled maintenance</span>
          </div>
          <div class="cardlist-right-col">
            <button type="button" class="list-action-btn" style="background: #64748B;">Return to Service</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [DINING_LAYOUT_CSS],
})
export class DiningLayoutPreviewComponent {
  @Input() layoutKey: DiningDesignKey = 'checkered';
  @Input() cssVars: Record<string, string> = {};
}
