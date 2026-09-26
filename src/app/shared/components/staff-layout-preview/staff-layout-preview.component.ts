import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffDesignKey } from '../../../core/services/staff-layout.service';
import { STAFF_LAYOUT_CSS } from '../../styles/staff-layout.styles';
import { ActionLoadingDirective } from '../../directives/action-loading.directive';

export interface PreviewStaffItem {
  id: number;
  name: string;
  username: string;
  role: string;
  clearance: string;
  empId: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  initials: string;
  lastLogin: string;
  roleIcon: string;
  permissionsGranted: number;
  permissionsTotal: number;
  progressPercent: number;
}

@Component({
  selector: 'app-staff-layout-preview',
  standalone: true,
  imports: [CommonModule, ActionLoadingDirective],
  template: `
    <div
      class="staff-stage"
      [ngClass]="'staff-layout-' + layoutKey"
      [ngStyle]="cssVars"
      aria-label="Live Staff Layout Preview"
    >
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 1: EXECUTIVE SECURITY ID BADGE (LANYARD ACCESS PASS)     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'idcard'" class="staff-id-grid">
        <div *ngFor="let u of sampleStaff" class="staff-id-card">
          <!-- Physical Lanyard Header -->
          <div class="staff-id-top-strap">
            <div class="staff-id-punch-slot"></div>
            <span class="staff-id-strap-label">SECURE ACCESS CREDENTIAL</span>
          </div>
          <div class="staff-id-hologram-strip"></div>

          <div class="staff-id-card-content">
            <div class="staff-id-avatar-circle">
              <div class="staff-id-avatar-img-box">
                <span>{{ u.initials }}</span>
              </div>
              <span
                class="staff-id-active-pulse"
                [class.is-inactive]="u.status !== 'ACTIVE'"
                [style.backgroundColor]="u.status === 'ACTIVE' ? 'var(--staff-status-active-color, #10B981)' : '#EF4444'"
              ></span>
            </div>

            <h4 class="staff-id-title-name">{{ u.name }}</h4>
            <div class="staff-id-handle-tag">&#64;{{ u.username }}</div>

            <div class="staff-id-clearance-badge">
              <span class="material-symbols-outlined" style="font-size: 14px;">verified_user</span>
              <span>{{ u.clearance }}</span>
            </div>

            <div class="staff-id-contact-chips">
              <div class="staff-id-chip-row">
                <span class="material-symbols-outlined" style="font-size: 13px; color: var(--staff-accent-color, #4F46E5);">mail</span>
                <span class="truncate">{{ u.email }}</span>
              </div>
              <div class="staff-id-chip-row font-mono">
                <span class="material-symbols-outlined" style="font-size: 13px; color: var(--staff-accent-color, #4F46E5);">call</span>
                <span>{{ u.phone }}</span>
              </div>
            </div>
          </div>

          <!-- Barcode Graphic Footer -->
          <div class="staff-id-barcode-footer">
            <div class="staff-id-barcode-art">
              <span class="staff-id-barcode-bar w-thick"></span>
              <span class="staff-id-barcode-bar"></span>
              <span class="staff-id-barcode-bar w-mid"></span>
              <span class="staff-id-barcode-bar"></span>
              <span class="staff-id-barcode-bar w-thick"></span>
              <span class="staff-id-barcode-bar w-mid"></span>
              <span class="staff-id-barcode-bar"></span>
              <span class="staff-id-barcode-bar w-thick"></span>
              <span class="staff-id-barcode-bar"></span>
            </div>
            <span class="staff-id-barcode-label">{{ u.empId }}</span>
            <div class="staff-id-card-actions">
              <button type="button" class="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-indigo-600">
                <span class="material-symbols-outlined" style="font-size: 15px;">edit</span>
              </button>
              <button type="button" class="w-6 h-6 rounded flex items-center justify-center text-rose-400 hover:text-rose-600">
                <span class="material-symbols-outlined" style="font-size: 15px;">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 2: OBSIDIAN DARK MATRIX (FUTURISTIC CYBERPUNK HUD)      -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'darkneon'" class="staff-dark-grid">
        <div *ngFor="let u of sampleStaff" class="staff-dark-card">
          <div class="staff-dark-hud-bar">
            <span>TERMINAL // 0x0{{ u.id }}</span>
            <div class="flex items-center gap-1.5">
              <span class="staff-dark-radar-dot" [class.is-off]="u.status !== 'ACTIVE'"></span>
              <span>{{ u.status === 'ACTIVE' ? 'LIVE' : 'OFFLINE' }}</span>
            </div>
          </div>

          <div class="staff-dark-center">
            <div class="staff-dark-avatar">{{ u.initials }}</div>
            <div>
              <h4 class="staff-dark-name">{{ u.name }}</h4>
              <div class="staff-dark-sub">&#64;{{ u.username }}</div>
              <span class="staff-dark-role-pill">[ {{ u.role | uppercase }} ]</span>
            </div>
          </div>

          <div class="staff-dark-console-box">
            <div class="flex items-center justify-between">
              <span>AUTH_TIER:</span>
              <span class="text-cyan-400 font-bold">{{ u.clearance }}</span>
            </div>
            <div class="flex items-center justify-between truncate">
              <span>CONTACT:</span>
              <span class="text-slate-300 truncate">{{ u.email }}</span>
            </div>
          </div>

          <div class="staff-dark-footer">
            <span class="text-[10px] font-mono text-slate-400">PING: {{ u.lastLogin }}</span>
            <div class="flex items-center gap-1.5">
              <button type="button" class="staff-dark-btn-glow">
                <span class="material-symbols-outlined" style="font-size: 13px;">tune</span>
                <span>CONFIG</span>
              </button>
              <button type="button" class="staff-dark-btn-danger">
                <span class="material-symbols-outlined" style="font-size: 13px;">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 3: HORIZONTAL ROSTER STREAM (WIDE BANNER STRIPS)        -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'roster'" class="staff-roster-list">
        <div *ngFor="let u of sampleStaff" class="staff-roster-strip">
          <div class="staff-roster-left">
            <div class="staff-roster-avatar">{{ u.initials }}</div>
            <div class="staff-roster-meta">
              <h4 class="staff-roster-name">{{ u.name }}</h4>
              <span class="staff-roster-sub">&#64;{{ u.username }} · {{ u.role }}</span>
            </div>
          </div>

          <!-- Permissions Coverage Progress Gauge -->
          <div class="staff-roster-gauge-col">
            <div class="staff-roster-gauge-head">
              <span>Permissions Coverage</span>
              <span class="text-teal-700 font-bold">{{ u.permissionsGranted }} / {{ u.permissionsTotal }}</span>
            </div>
            <div class="staff-roster-gauge-bar">
              <div class="staff-roster-gauge-fill" [style.width.%]="u.progressPercent"></div>
            </div>
          </div>

          <div class="staff-roster-contacts hidden md:flex">
            <span class="font-medium text-slate-700">{{ u.email }}</span>
            <span class="font-mono text-[11px] text-slate-400">{{ u.phone }}</span>
          </div>

          <div class="staff-roster-actions">
            <button type="button" class="staff-roster-pill-btn">
              <span class="material-symbols-outlined" style="font-size: 14px;">edit</span>
              <span>Edit Staff</span>
            </button>
            <button type="button" class="staff-roster-pill-btn is-delete">
              <span class="material-symbols-outlined" style="font-size: 14px;">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 4: ENTERPRISE SAAS POWER TABLE (ZEBRA SPREADSHEET)      -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'list'" class="staff-power-table-card">
        <table class="staff-power-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">
                <input type="checkbox" class="rounded border-slate-300" checked disabled />
              </th>
              <th style="width: 28%;">Staff Member</th>
              <th style="width: 20%;">Role Assignment</th>
              <th style="width: 24%;">Contact Information</th>
              <th style="width: 14%;">Status</th>
              <th style="width: 14%; text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of sampleStaff">
              <td style="text-align: center;">
                <input type="checkbox" class="rounded border-slate-300" disabled />
              </td>
              <td>
                <div class="staff-power-user">
                  <div class="staff-power-avatar">{{ u.initials }}</div>
                  <div>
                    <div class="font-bold text-slate-900">{{ u.name }}</div>
                    <div class="text-xs text-slate-400 font-mono">&#64;{{ u.username }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="staff-power-badge">
                  <span class="material-symbols-outlined" style="font-size: 13px;">{{ u.roleIcon }}</span>
                  {{ u.role }}
                </span>
              </td>
              <td>
                <div class="flex flex-col text-xs">
                  <span class="font-medium text-slate-800">{{ u.email }}</span>
                  <span class="text-slate-400 font-mono">{{ u.phone }}</span>
                </div>
              </td>
              <td>
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  [ngClass]="u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    [style.backgroundColor]="u.status === 'ACTIVE' ? 'var(--staff-status-active-color, #16A34A)' : '#64748B'"
                  ></span>
                  {{ u.status }}
                </span>
              </td>
              <td style="text-align: center;">
                <div class="flex items-center justify-center gap-1">
                  <button type="button" class="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:text-blue-700">
                    <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                  </button>
                  <button type="button" class="w-7 h-7 rounded flex items-center justify-center text-rose-500 hover:text-rose-700">
                    <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 5: MODERN BENTO METRIC PROFILE (APPLE / VERCEL BENTO)   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'bento'" class="staff-bento-grid">
        <div *ngFor="let u of sampleStaff" class="staff-bento-card">
          <div class="staff-bento-hero">
            <span class="staff-bento-status-pill" [class.is-off]="u.status !== 'ACTIVE'">
              {{ u.status }}
            </span>
          </div>

          <div class="staff-bento-body">
            <div class="staff-bento-avatar-bubble">{{ u.initials }}</div>
            <h4 class="staff-bento-name">{{ u.name }}</h4>
            <div class="staff-bento-handle">&#64;{{ u.username }}</div>
            <span class="staff-bento-role-chip">{{ u.role }}</span>

            <!-- Two Inner Bento Stat Tiles -->
            <div class="staff-bento-stat-boxes">
              <div class="staff-bento-tile">
                <span class="staff-bento-tile-lbl">Access Tier</span>
                <span class="staff-bento-tile-val">{{ u.clearance.split('·')[0].trim() }}</span>
              </div>
              <div class="staff-bento-tile">
                <span class="staff-bento-tile-lbl">Permissions</span>
                <span class="staff-bento-tile-val">{{ u.permissionsGranted }} Active</span>
              </div>
            </div>

            <div class="staff-bento-contacts">
              <div class="flex items-center gap-1.5 truncate">
                <span class="material-symbols-outlined text-[13px] text-purple-600">mail</span>
                <span class="truncate">{{ u.email }}</span>
              </div>
              <div class="flex items-center gap-1.5 truncate font-mono text-[11px]">
                <span class="material-symbols-outlined text-[13px] text-purple-600">call</span>
                <span>{{ u.phone }}</span>
              </div>
            </div>
          </div>

          <div class="staff-bento-footer">
            <span class="text-[11px] text-slate-500">
              Active: <strong>{{ u.lastLogin }}</strong>
            </span>
            <div class="flex items-center gap-1">
              <button type="button" class="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 hover:bg-purple-100">
                <span class="material-symbols-outlined" style="font-size: 15px;">edit</span>
              </button>
              <button type="button" class="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 hover:bg-rose-100">
                <span class="material-symbols-outlined" style="font-size: 15px;">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 6: FROSTED GLASS AURORA                                 -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'glassmorphism'" class="staff-glass-grid">
        <div *ngFor="let u of sampleStaff" class="staff-glass-card">
          <div class="staff-glass-avatar">{{ u.initials }}</div>
          <h4 class="staff-glass-name">{{ u.name }}</h4>
          <div class="staff-glass-handle">&#64;{{ u.username }}</div>
          <div class="staff-glass-role">
            <span class="staff-glass-status" style="color: #34D399; background-color: #34D399;"></span>
            <span class="material-symbols-outlined" style="font-size: 13px;">{{ u.roleIcon }}</span>
            <span>{{ u.role }}</span>
          </div>
          <div class="staff-glass-info">
            <div class="flex items-center gap-1.5 truncate"><span class="material-symbols-outlined" style="font-size: 13px;">mail</span><span>{{ u.email }}</span></div>
            <div class="flex items-center gap-1.5"><span class="material-symbols-outlined" style="font-size: 13px;">call</span><span>{{ u.phone }}</span></div>
          </div>
          <div class="staff-glass-actions">
            <button type="button" class="staff-glass-btn"><span class="material-symbols-outlined" style="font-size: 14px;">edit</span><span>Edit</span></button>
            <button type="button" class="staff-glass-btn is-delete"><span class="material-symbols-outlined" style="font-size: 14px;">delete</span></button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 7: NEO-BRUTALISM POP                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'retrobrutalist'" class="staff-brutal-grid">
        <div *ngFor="let u of sampleStaff" class="staff-brutal-card">
          <div class="staff-brutal-header">
            <span class="staff-brutal-header-label">STAFF // {{ u.role | uppercase }}</span>
            <span class="staff-brutal-status-tag" [class.is-off]="u.status !== 'ACTIVE'">{{ u.status === 'ACTIVE' ? 'ONLINE' : 'OFFLINE' }}</span>
          </div>
          <div class="staff-brutal-body">
            <div class="staff-brutal-avatar">{{ u.initials }}</div>
            <div class="staff-brutal-meta">
              <h4 class="staff-brutal-name">{{ u.name }}</h4>
              <div class="staff-brutal-handle">&#64;{{ u.username }}</div>
              <span class="staff-brutal-role-sticker">{{ u.role }}</span>
            </div>
          </div>
          <div class="staff-brutal-contact">
            <span>{{ u.email }}</span><span class="font-mono">{{ u.phone }}</span>
          </div>
          <div class="staff-brutal-footer">
            <span class="text-[10px] font-mono font-bold">PERMS: {{ u.permissionsGranted }}/{{ u.permissionsTotal }}</span>
            <div class="flex items-center gap-2">
              <button type="button" class="staff-brutal-btn"><span class="material-symbols-outlined" style="font-size: 13px;">edit</span><span>EDIT</span></button>
              <button type="button" class="staff-brutal-btn is-delete"><span class="material-symbols-outlined" style="font-size: 13px;">delete</span></button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 8: FLAT METRO GRID                                      -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'metro'" class="staff-metro-grid">
        <div *ngFor="let u of sampleStaff" class="staff-metro-tile">
          <span class="staff-metro-watermark">{{ u.role }}</span>
          <span class="staff-metro-status" [style.backgroundColor]="u.status === 'ACTIVE' ? '#34D399' : '#EF4444'"></span>
          <div class="staff-metro-content">
            <div class="staff-metro-avatar">{{ u.initials }}</div>
            <h4 class="staff-metro-name">{{ u.name }}</h4>
            <div class="staff-metro-sub">&#64;{{ u.username }} · {{ u.email }}</div>
            <span class="staff-metro-role-tag"><span class="material-symbols-outlined" style="font-size: 12px;">{{ u.roleIcon }}</span> {{ u.role }}</span>
            <div class="staff-metro-actions">
              <button type="button" class="staff-metro-btn"><span class="material-symbols-outlined" style="font-size: 16px;">edit</span></button>
              <button type="button" class="staff-metro-btn"><span class="material-symbols-outlined" style="font-size: 16px;">delete</span></button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 9: VERTICAL ACTIVITY TIMELINE                           -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'timeline'" class="staff-timeline-feed">
        <div *ngFor="let u of sampleStaff" class="staff-timeline-item">
          <div class="staff-timeline-node" [class.is-active]="u.status === 'ACTIVE'"></div>
          <div class="staff-timeline-card">
            <div class="staff-timeline-avatar">{{ u.initials }}</div>
            <div class="staff-timeline-meta">
              <h4 class="staff-timeline-name">{{ u.name }}</h4>
              <div class="staff-timeline-handle">&#64;{{ u.username }}</div>
              <div class="staff-timeline-tags">
                <span class="staff-timeline-role"><span class="material-symbols-outlined" style="font-size: 11px;">{{ u.roleIcon }}</span> {{ u.role }}</span>
                <span class="staff-timeline-time"><span class="material-symbols-outlined" style="font-size: 11px;">schedule</span> {{ u.lastLogin }}</span>
              </div>
              <div class="staff-timeline-contact"><span>{{ u.email }}</span><span class="font-mono text-xs">{{ u.phone }}</span></div>
            </div>
            <div class="staff-timeline-actions">
              <button type="button" class="staff-timeline-btn"><span class="material-symbols-outlined" style="font-size: 16px;">edit</span></button>
              <button type="button" class="staff-timeline-btn is-delete"><span class="material-symbols-outlined" style="font-size: 16px;">delete</span></button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 10: FLOATING CAPSULE CHIPS                              -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'compactpill'" class="staff-pill-grid">
        <div *ngFor="let u of sampleStaff" class="staff-pill-chip">
          <div class="staff-pill-avatar">
            <span class="staff-pill-halo is-active"></span>
            {{ u.initials }}
          </div>
          <div class="staff-pill-meta">
            <span class="staff-pill-name">{{ u.name }}</span>
            <span class="staff-pill-handle">&#64;{{ u.username }}</span>
          </div>
          <span class="staff-pill-role"><span class="material-symbols-outlined" style="font-size: 12px;">{{ u.roleIcon }}</span> {{ u.role }}</span>
          <div class="staff-pill-contact"><span>{{ u.email }}</span><span class="font-mono text-xs">{{ u.phone }}</span></div>
          <div class="staff-pill-actions">
            <button type="button" class="staff-pill-btn"><span class="material-symbols-outlined" style="font-size: 16px;">edit</span></button>
            <button type="button" class="staff-pill-btn is-delete"><span class="material-symbols-outlined" style="font-size: 16px;">delete</span></button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 11: SCI-FI RADIAL HUD                                   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'radialhud'" class="staff-hud-grid">
        <div *ngFor="let u of sampleStaff" class="staff-hud-card">
          <div class="staff-hud-coords"><span>UNIT-{{ u.id }}</span><span>{{ u.status === 'ACTIVE' ? '◉ ONLINE' : '○ OFFLINE' }}</span></div>
          <div class="staff-hud-ring-wrap" [style.--perm-pct]="u.progressPercent">
            <div class="staff-hud-perm-ring"></div>
            <div class="staff-hud-avatar">{{ u.initials }}</div>
          </div>
          <h4 class="staff-hud-name">{{ u.name }}</h4>
          <div class="staff-hud-handle">&#64;{{ u.username }}</div>
          <span class="staff-hud-role"><span class="material-symbols-outlined" style="font-size: 12px;">{{ u.roleIcon }}</span> {{ u.role }}</span>
          <div class="staff-hud-telemetry">
            <div class="staff-hud-stat"><span class="staff-hud-stat-label">Perms</span><span class="staff-hud-stat-value">{{ u.permissionsGranted }}/{{ u.permissionsTotal }}</span></div>
            <div class="staff-hud-stat"><span class="staff-hud-stat-label">Access</span><span class="staff-hud-stat-value">{{ u.clearance.split('·')[0].trim() }}</span></div>
          </div>
          <div class="staff-hud-contact"><span>{{ u.email }}</span><span>{{ u.phone }}</span></div>
          <div class="staff-hud-actions">
            <button type="button" class="staff-hud-btn"><span class="material-symbols-outlined" style="font-size: 14px;">edit</span><span>MODIFY</span></button>
            <button type="button" class="staff-hud-btn is-delete"><span class="material-symbols-outlined" style="font-size: 14px;">delete</span></button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [STAFF_LAYOUT_CSS],
})
export class StaffLayoutPreviewComponent {
  @Input() layoutKey: StaffDesignKey = 'idcard';
  @Input() cssVars: Record<string, string> = {};

  public readonly sampleStaff: PreviewStaffItem[] = [
    {
      id: 1,
      name: 'Sarah Jenkins',
      username: 'sarah.mgr',
      role: 'Store Manager',
      clearance: 'LEVEL 4 · ADMIN',
      empId: 'EMP-0042',
      email: 'sarah.j@pos-store.com',
      phone: '+91 98765 43210',
      status: 'ACTIVE',
      initials: 'SJ',
      lastLogin: '18/09/2026 11:42',
      roleIcon: 'manage_accounts',
      permissionsGranted: 24,
      permissionsTotal: 24,
      progressPercent: 100,
    },
    {
      id: 2,
      name: 'Alex Rodriguez',
      username: 'alex.chef',
      role: 'Head Chef',
      clearance: 'LEVEL 3 · KITCHEN',
      empId: 'EMP-0089',
      email: 'alex.r@pos-store.com',
      phone: '+91 98112 34567',
      status: 'ACTIVE',
      initials: 'AR',
      lastLogin: '18/09/2026 10:15',
      roleIcon: 'skillet',
      permissionsGranted: 16,
      permissionsTotal: 24,
      progressPercent: 66,
    },
    {
      id: 3,
      name: 'Emily Chen',
      username: 'emily.cash',
      role: 'Lead Cashier',
      clearance: 'LEVEL 2 · POS',
      empId: 'EMP-0114',
      email: 'emily.c@pos-store.com',
      phone: '+91 99220 11223',
      status: 'ACTIVE',
      initials: 'EC',
      lastLogin: '17/09/2026 21:30',
      roleIcon: 'point_of_sale',
      permissionsGranted: 10,
      permissionsTotal: 24,
      progressPercent: 42,
    },
    {
      id: 4,
      name: 'Marcus Vance',
      username: 'marcus.stock',
      role: 'Inventory Lead',
      clearance: 'LEVEL 2 · STOCK',
      empId: 'EMP-0205',
      email: 'marcus.v@pos-store.com',
      phone: '+91 97334 55667',
      status: 'INACTIVE',
      initials: 'MV',
      lastLogin: '12/09/2026 18:04',
      roleIcon: 'inventory',
      permissionsGranted: 12,
      permissionsTotal: 24,
      progressPercent: 50,
    },
  ];
}
