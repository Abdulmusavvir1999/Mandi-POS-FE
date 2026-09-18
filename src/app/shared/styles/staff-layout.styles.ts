/**
 * Five Radically Distinct Staff Accounts & Roles Page Layout Designs:
 *
 * 1. Executive Security ID Badge (idcard): Physical corporate lanyard card with top punch-hole,
 *    security header ribbon, holographic clearance badge, photo ring, and barcode EMP-ID chip.
 * 2. Obsidian Dark Matrix (darkneon): Futuristic cyberpunk terminal with deep obsidian canvas,
 *    glassmorphism, glowing neon borders, radar pulse active dot, and terminal HUD metadata.
 * 3. Horizontal Roster Stream (roster): Wide full-width horizontal banner strips with left-to-right flow,
 *    permissions coverage progress gauge, last login activity badge, and contact action pills.
 * 4. Enterprise SaaS Power Table (list): High-density corporate spreadsheet with alternating zebra
 *    stripes, sticky header row, selection checkboxes, and compact inline actions.
 * 5. Modern Bento Metric Profile (bento): Trendy Bento-box profile cards with colorful gradient hero
 *    banner, overlapping circular avatar, two inner metric stat boxes (Access Tier & Permissions), and curvy pill buttons.
 */
export const STAFF_LAYOUT_CSS = `
  /* ═══════════════════════════════════════════════════════════════════════ */
  /* RADICAL DESIGN SYSTEM — 5 DISTINCT VISUAL PARADIGMS                   */
  /* ═══════════════════════════════════════════════════════════════════════ */

  .staff-stage {
    background-color: var(--staff-canvas-bg, #F8FAFC);
    border-radius: 16px;
    padding: var(--staff-grid-gap, 20px);
    transition: background-color 0.25s ease, padding 0.25s ease;
    width: 100%;
    box-sizing: border-box;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 1: EXECUTIVE SECURITY ID BADGE (LANYARD ACCESS PASS)           */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .staff-layout-idcard .staff-id-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: var(--staff-grid-gap, 22px);
    padding: 6px;
  }

  .staff-id-card {
    background: var(--staff-card-bg, #FFFFFF);
    border: 2px solid var(--staff-card-border, #CBD5E1);
    border-radius: var(--staff-card-radius, 20px);
    padding: 0;
    box-shadow: 0 14px 30px -6px rgba(15, 23, 42, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--staff-card-scale, 1));
    position: relative;
    overflow: hidden;
  }
  .staff-id-card:hover {
    transform: scale(calc(var(--staff-card-scale, 1) * 1.02)) translateY(-4px);
    box-shadow: 0 22px 42px -6px rgba(79, 70, 229, 0.18);
    border-color: var(--staff-accent-color, #4F46E5);
  }

  .staff-id-top-strap {
    background: #0F172A;
    padding: 8px 12px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  .staff-id-punch-slot {
    width: 36px;
    height: 7px;
    border-radius: 999px;
    background: #475569;
    border: 1.5px solid #1E293B;
    margin-bottom: 4px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
  }
  .staff-id-strap-label {
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #94A3B8;
  }
  .staff-id-hologram-strip {
    height: 5px;
    width: 100%;
    background: linear-gradient(90deg, #F43F5E, #FB923C, #FBBF24, #34D399, #38BDF8, #818CF8);
  }

  .staff-id-card-content {
    padding: var(--staff-padding, 18px);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1;
  }

  .staff-id-avatar-circle {
    position: relative;
    margin-bottom: 12px;
  }
  .staff-id-avatar-img-box {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #F1F5F9;
    border: 3px solid var(--staff-accent-color, #4F46E5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 24px;
    color: var(--staff-accent-color, #4F46E5);
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.2);
  }
  .staff-id-avatar-img-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .staff-id-active-pulse {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: var(--staff-status-active-color, #10B981);
    border: 2.5px solid #FFFFFF;
  }
  .staff-id-active-pulse.is-inactive {
    background-color: #EF4444;
  }

  .staff-id-title-name {
    font-size: var(--staff-font-size, 16px);
    font-weight: 800;
    color: var(--staff-text-color, #0F172A);
    margin: 0;
    line-height: 1.25;
  }
  .staff-id-handle-tag {
    font-size: 12px;
    color: var(--staff-text-muted, #64748B);
    font-family: monospace;
    margin: 2px 0 8px;
  }

  .staff-id-clearance-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background-color: var(--staff-role-badge-bg, #EEF2FF);
    color: var(--staff-role-badge-color, #4338CA);
    border: 1px solid rgba(79, 70, 229, 0.2);
    margin-bottom: 12px;
  }

  .staff-id-contact-chips {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #F8FAFC;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #E2E8F0;
    font-size: 11px;
    color: var(--staff-text-muted, #64748B);
    margin-bottom: 12px;
    text-align: left;
  }
  .staff-id-chip-row {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Barcode Strip at Bottom of ID */
  .staff-id-barcode-footer {
    width: 100%;
    background: #FAFAFA;
    border-top: 1px solid #E2E8F0;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .staff-id-barcode-art {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 20px;
  }
  .staff-id-barcode-bar {
    background: #0F172A;
    height: 100%;
    width: 2px;
  }
  .staff-id-barcode-bar.w-thick { width: 4px; }
  .staff-id-barcode-bar.w-mid { width: 3px; }
  .staff-id-barcode-label {
    font-family: monospace;
    font-size: 9px;
    font-weight: 800;
    color: #475569;
    letter-spacing: 0.05em;
  }

  .staff-id-card-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 2: OBSIDIAN DARK MATRIX (FUTURISTIC CYBERPUNK HUD)      */
  /* ═══════════════════════════════════════════════════════════════ */
  .staff-layout-darkneon.staff-stage {
    background: #0B0F19 !important;
    border: 1px solid #1F2937;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
  }
  .staff-layout-darkneon .staff-dark-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: var(--staff-grid-gap, 18px);
    padding: 4px;
  }

  .staff-dark-card {
    background: #111827;
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-radius: var(--staff-card-radius, 14px);
    padding: var(--staff-padding, 18px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(6, 182, 212, 0.06);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.25s ease;
    transform: scale(var(--staff-card-scale, 1));
    position: relative;
    overflow: hidden;
  }
  .staff-dark-card:hover {
    border-color: #06B6D4;
    box-shadow: 0 0 25px rgba(6, 182, 212, 0.25), 0 8px 24px rgba(0, 0, 0, 0.6);
    transform: scale(calc(var(--staff-card-scale, 1) * 1.02)) translateY(-2px);
  }

  .staff-dark-hud-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: monospace;
    font-size: 10px;
    color: #06B6D4;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .staff-dark-radar-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10B981;
    box-shadow: 0 0 8px #10B981;
    display: inline-block;
  }
  .staff-dark-radar-dot.is-off {
    background: #EF4444;
    box-shadow: 0 0 8px #EF4444;
  }

  .staff-dark-center {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
  }
  .staff-dark-avatar {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    background: #1E293B;
    border: 1.5px solid #06B6D4;
    box-shadow: 0 0 12px rgba(6, 182, 212, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 18px;
    color: #22D3EE;
    overflow: hidden;
  }
  .staff-dark-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .staff-dark-name {
    font-size: var(--staff-font-size, 15px);
    font-weight: 800;
    color: #F9FAFB;
    margin: 0;
    font-family: inherit;
  }
  .staff-dark-sub {
    font-size: 12px;
    color: #9CA3AF;
    font-family: monospace;
  }
  .staff-dark-role-pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-family: monospace;
    font-weight: 800;
    text-transform: uppercase;
    background: rgba(6, 182, 212, 0.12);
    color: #22D3EE;
    border: 1px solid rgba(6, 182, 212, 0.3);
    margin-top: 4px;
  }

  .staff-dark-console-box {
    background: #0B0F19;
    border: 1px solid #1F2937;
    border-radius: 8px;
    padding: 8px 10px;
    font-family: monospace;
    font-size: 11px;
    color: #9CA3AF;
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .staff-dark-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 10px;
  }
  .staff-dark-btn-glow {
    background: #06B6D4;
    color: #0B0F19;
    border: none;
    border-radius: 6px;
    font-weight: 800;
    font-size: 11px;
    padding: 5px 10px;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .staff-dark-btn-danger {
    background: rgba(239, 68, 68, 0.15);
    color: #F87171;
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: 6px;
    padding: 5px 8px;
    cursor: pointer;
    font-size: 11px;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 3: HORIZONTAL ROSTER STREAM (WIDE BANNER STRIPS)        */
  /* ═══════════════════════════════════════════════════════════════ */
  .staff-layout-roster .staff-roster-list {
    display: flex;
    flex-direction: column;
    gap: var(--staff-grid-gap, 14px);
    width: 100%;
  }

  .staff-roster-strip {
    background: var(--staff-card-bg, #FFFFFF);
    border: 1px solid var(--staff-card-border, #E2E8F0);
    border-radius: var(--staff-card-radius, 16px);
    padding: var(--staff-padding, 16px) 20px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    transition: all 0.22s ease;
    transform: scale(var(--staff-card-scale, 1));
  }
  .staff-roster-strip:hover {
    border-color: var(--staff-accent-color, #0D9488);
    box-shadow: 0 8px 20px -3px rgba(13, 148, 136, 0.12);
    transform: scale(calc(var(--staff-card-scale, 1) * 1.01)) translateY(-2px);
  }

  .staff-roster-left {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 240px;
  }
  .staff-roster-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #F0FDFA;
    border: 2px solid #0D9488;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 18px;
    color: #0F766E;
    flex-shrink: 0;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(13, 148, 136, 0.15);
  }
  .staff-roster-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .staff-roster-meta {
    display: flex;
    flex-direction: column;
  }
  .staff-roster-name {
    font-size: var(--staff-font-size, 15px);
    font-weight: 800;
    color: var(--staff-text-color, #0F172A);
    margin: 0;
  }
  .staff-roster-sub {
    font-size: 12px;
    color: var(--staff-text-muted, #64748B);
    font-family: monospace;
  }

  /* Center Visual Progress Gauge */
  .staff-roster-gauge-col {
    flex: 1;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .staff-roster-gauge-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 700;
    color: #475569;
  }
  .staff-roster-gauge-bar {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: #E2E8F0;
    overflow: hidden;
  }
  .staff-roster-gauge-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #0D9488, #14B8A6);
  }

  .staff-roster-contacts {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: var(--staff-text-muted, #64748B);
  }

  .staff-roster-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .staff-roster-pill-btn {
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    border: 1.5px solid var(--staff-accent-color, #0D9488);
    background: var(--staff-accent-color, #0D9488);
    color: #FFFFFF;
    transition: opacity 0.15s ease;
  }
  .staff-roster-pill-btn:hover { opacity: 0.9; }
  .staff-roster-pill-btn.is-delete {
    background: transparent;
    border-color: #EF4444;
    color: #EF4444;
  }
  .staff-roster-pill-btn.is-delete:hover {
    background: #FEF2F2;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 4: ENTERPRISE SAAS POWER TABLE (ZEBRA SPREADSHEET)      */
  /* ═══════════════════════════════════════════════════════════════ */
  .staff-layout-list .staff-power-table-card {
    background: var(--staff-card-bg, #FFFFFF);
    border: 1px solid var(--staff-card-border, #E5E7EB);
    border-radius: var(--staff-card-radius, 8px);
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  }

  .staff-power-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--staff-font-size, 13px);
    text-align: left;
  }
  .staff-power-table th {
    background: #F1F5F9;
    padding: 10px 14px;
    font-weight: 800;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #475569;
    border-bottom: 2px solid #CBD5E1;
  }
  .staff-power-table td {
    padding: var(--staff-padding, 12px) 14px;
    border-bottom: 1px solid #E5E7EB;
    color: var(--staff-text-color, #111827);
    vertical-align: middle;
  }
  .staff-power-table tbody tr:nth-child(even) {
    background-color: #F8FAFC;
  }
  .staff-power-table tbody tr:hover {
    background-color: #EFF6FF !important;
  }

  .staff-power-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .staff-power-avatar {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: #DBEAFE;
    color: #1E40AF;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .staff-power-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .staff-power-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    background-color: var(--staff-role-badge-bg, #EFF6FF);
    color: var(--staff-role-badge-color, #1D4ED8);
    border: 1px solid rgba(29, 78, 216, 0.15);
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 5: MODERN BENTO METRIC PROFILE (VERCEL / APPLE BENTO)   */
  /* ═══════════════════════════════════════════════════════════════ */
  .staff-layout-bento .staff-bento-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: var(--staff-grid-gap, 20px);
    padding: 4px;
  }

  .staff-bento-card {
    background: var(--staff-card-bg, #FFFFFF);
    border: 1.5px solid var(--staff-card-border, #F3E8FF);
    border-radius: var(--staff-card-radius, 24px);
    overflow: hidden;
    box-shadow: 0 10px 25px -4px rgba(139, 92, 246, 0.08);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.26s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--staff-card-scale, 1));
  }
  .staff-bento-card:hover {
    transform: scale(calc(var(--staff-card-scale, 1) * 1.02)) translateY(-4px);
    box-shadow: 0 20px 40px -4px rgba(139, 92, 246, 0.18);
    border-color: var(--staff-accent-color, #8B5CF6);
  }

  .staff-bento-hero {
    height: 70px;
    background: linear-gradient(135deg, var(--staff-accent-color, #8B5CF6), #EC4899);
    position: relative;
    padding: 10px 14px;
    display: flex;
    justify-content: flex-end;
  }
  .staff-bento-status-pill {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(4px);
    color: #10B981;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 999px;
    height: fit-content;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  .staff-bento-status-pill.is-off {
    color: #EF4444;
  }

  .staff-bento-body {
    padding: var(--staff-padding, 20px);
    padding-top: 0;
    margin-top: -34px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1;
  }
  .staff-bento-avatar-bubble {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: #FFFFFF;
    border: 3.5px solid #FFFFFF;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 22px;
    color: var(--staff-accent-color, #8B5CF6);
    overflow: hidden;
    margin-bottom: 8px;
  }
  .staff-bento-avatar-bubble img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .staff-bento-name {
    font-size: var(--staff-font-size, 16px);
    font-weight: 800;
    color: var(--staff-text-color, #1E1B4B);
    margin: 0;
  }
  .staff-bento-handle {
    font-size: 12px;
    color: var(--staff-text-muted, #6B7280);
    margin-bottom: 6px;
  }
  .staff-bento-role-chip {
    font-size: 11px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--staff-role-badge-bg, #EDE9FE);
    color: var(--staff-role-badge-color, #6D28D9);
    margin-bottom: 14px;
  }

  /* Two Inner Bento Metric Stat Boxes */
  .staff-bento-stat-boxes {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }
  .staff-bento-tile {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 8px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .staff-bento-tile-lbl {
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    color: #64748B;
    letter-spacing: 0.04em;
  }
  .staff-bento-tile-val {
    font-size: 13px;
    font-weight: 800;
    color: #0F172A;
    margin-top: 2px;
  }

  .staff-bento-contacts {
    width: 100%;
    background: #FAF5FF;
    border-radius: 12px;
    padding: 8px 12px;
    font-size: 11px;
    color: var(--staff-text-muted, #6B7280);
    display: flex;
    flex-direction: column;
    gap: 3px;
    text-align: left;
    margin-bottom: 14px;
  }

  .staff-bento-footer {
    padding: 12px var(--staff-padding, 20px);
    background: #FAFAFA;
    border-top: 1px solid #F1F5F9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  /* Responsive Rules */
  @media (max-width: 768px) {
    .staff-roster-strip {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .staff-roster-gauge-col {
      max-width: 100%;
      width: 100%;
    }
    .staff-roster-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
`;
