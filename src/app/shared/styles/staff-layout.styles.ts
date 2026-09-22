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
    background: var(--text-main, #0F172A);
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
    background: var(--text-muted, #475569);
    border: 1.5px solid var(--text-main, #1E293B);
    margin-bottom: 4px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
  }
  .staff-id-strap-label {
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim, #94A3B8);
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
    background: var(--card-hover, #F1F5F9);
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
    background-color: var(--danger, #EF4444);
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
    background: var(--bg-app, #F8FAFC);
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--card-border, #E2E8F0);
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
    border-top: 1px solid var(--card-border, #E2E8F0);
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
    background: var(--text-main, #0F172A);
    height: 100%;
    width: 2px;
  }
  .staff-id-barcode-bar.w-thick { width: 4px; }
  .staff-id-barcode-bar.w-mid { width: 3px; }
  .staff-id-barcode-label {
    font-family: monospace;
    font-size: 9px;
    font-weight: 800;
    color: var(--text-muted, #475569);
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
    border: 1px solid var(--text-main, #1F2937);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
  }
  .staff-layout-darkneon .staff-dark-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: var(--staff-grid-gap, 18px);
    padding: 4px;
  }

  .staff-dark-card {
    background: var(--text-main, #111827);
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
    background: var(--danger, #EF4444);
    box-shadow: 0 0 8px var(--danger, #EF4444);
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
    background: var(--text-main, #1E293B);
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
    color: var(--text-dim, #9CA3AF);
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
    border: 1px solid var(--text-main, #1F2937);
    border-radius: 8px;
    padding: 8px 10px;
    font-family: monospace;
    font-size: 11px;
    color: var(--text-dim, #9CA3AF);
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
    color: var(--text-muted, #475569);
  }
  .staff-roster-gauge-bar {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: var(--card-border, #E2E8F0);
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
    border-color: var(--danger, #EF4444);
    color: var(--danger, #EF4444);
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
    background: var(--card-hover, #F1F5F9);
    padding: 10px 14px;
    font-weight: 800;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted, #475569);
    border-bottom: 2px solid var(--card-border, #CBD5E1);
  }
  .staff-power-table td {
    padding: var(--staff-padding, 12px) 14px;
    border-bottom: 1px solid #E5E7EB;
    color: var(--staff-text-color, #111827);
    vertical-align: middle;
  }
  .staff-power-table tbody tr:nth-child(even) {
    background-color: var(--bg-app, #F8FAFC);
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
    color: var(--danger, #EF4444);
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
    background: var(--bg-app, #F8FAFC);
    border: 1px solid var(--card-border, #E2E8F0);
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
    color: var(--text-muted, #64748B);
    letter-spacing: 0.04em;
  }
  .staff-bento-tile-val {
    font-size: 13px;
    font-weight: 800;
    color: var(--text-main, #0F172A);
    margin-top: 2px;
  }

  .staff-bento-contacts {
    width: 100%;
    background: var(--bg-app, #FAF5FF);
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
    border-top: 1px solid var(--card-border, #F1F5F9);
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

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 6: FROSTED GLASS AURORA (GLASSMORPHISM)                        */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .staff-layout-glassmorphism .staff-stage,
  .staff-layout-glassmorphism.staff-stage {
    background: linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%);
    position: relative;
    overflow: hidden;
  }
  .staff-layout-glassmorphism .staff-glass-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--staff-grid-gap, 22px);
    padding: 6px;
    position: relative;
    z-index: 1;
  }
  .staff-glass-card {
    background: var(--staff-card-bg, rgba(255, 255, 255, 0.12));
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--staff-card-border, rgba(255, 255, 255, 0.22));
    border-radius: var(--staff-card-radius, 24px);
    padding: var(--staff-padding, 22px);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--staff-card-scale, 1));
    position: relative;
    overflow: hidden;
  }
  .staff-glass-card::before {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, transparent 70%);
    filter: blur(20px);
  }
  .staff-glass-card:hover {
    transform: scale(calc(var(--staff-card-scale, 1) * 1.03)) translateY(-4px);
    box-shadow: 0 20px 50px -10px rgba(167, 139, 250, 0.3);
    border-color: rgba(167, 139, 250, 0.4);
  }
  .staff-glass-avatar {
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(167,139,250,0.3), rgba(244,63,94,0.2));
    border: 2px solid rgba(255,255,255,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 900; color: var(--bg-app, #F8FAFC);
    margin-bottom: 12px;
    box-shadow: 0 0 20px rgba(167, 139, 250, 0.2);
    overflow: hidden;
  }
  .staff-glass-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .staff-glass-name { font-size: 17px; font-weight: 800; color: var(--staff-text-color, #F8FAFC); margin-bottom: 2px; }
  .staff-glass-handle { font-size: 12px; color: var(--staff-text-muted, #CBD5E1); margin-bottom: 8px; }
  .staff-glass-role {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 12px; border-radius: 999px;
    background: var(--staff-role-badge-bg, rgba(167, 139, 250, 0.2));
    color: var(--staff-role-badge-color, #C4B5FD);
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    border: 1px solid rgba(167, 139, 250, 0.2);
    margin-bottom: 14px;
  }
  .staff-glass-status {
    width: 8px; height: 8px; border-radius: 50%;
    box-shadow: 0 0 6px currentColor;
  }
  .staff-glass-info {
    width: 100%; display: flex; flex-direction: column; gap: 4px;
    font-size: 11px; color: var(--staff-text-muted, #CBD5E1);
    margin-bottom: 14px; text-align: left;
    background: rgba(255,255,255,0.05); border-radius: 12px; padding: 8px 12px;
  }
  .staff-glass-actions {
    display: flex; gap: 6px; width: 100%;
  }
  .staff-glass-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
    padding: 7px 0; border-radius: 999px;
    background: var(--staff-btn-bg, rgba(167, 139, 250, 0.3));
    color: var(--staff-btn-color, #F8FAFC);
    font-size: 11px; font-weight: 700; cursor: pointer;
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.2s ease;
  }
  .staff-glass-btn:hover { background: rgba(167, 139, 250, 0.5); }
  .staff-glass-btn.is-delete { background: rgba(239, 68, 68, 0.2); color: #FCA5A5; border-color: rgba(239,68,68,0.15); }
  .staff-glass-btn.is-delete:hover { background: rgba(239, 68, 68, 0.4); }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 7: NEO-BRUTALISM POP                                           */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .staff-layout-retrobrutalist .staff-brutal-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: var(--staff-grid-gap, 20px);
    padding: 6px;
  }
  .staff-brutal-card {
    background: var(--staff-card-bg, #FFFFFF);
    border: 3px solid var(--staff-card-border, #000000);
    border-radius: 0;
    padding: 0;
    box-shadow: 6px 6px 0px #000000;
    display: flex; flex-direction: column;
    transform: scale(var(--staff-card-scale, 1));
    transition: all 0.15s ease;
    overflow: hidden;
  }
  .staff-brutal-card:hover {
    transform: scale(var(--staff-card-scale, 1)) translate(-2px, -2px);
    box-shadow: 8px 8px 0px #000000;
  }
  .staff-brutal-card:active {
    transform: scale(var(--staff-card-scale, 1)) translate(3px, 3px);
    box-shadow: 2px 2px 0px #000000;
  }
  .staff-brutal-header {
    background: var(--staff-accent-color, #F43F5E);
    padding: 10px var(--staff-padding, 18px);
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 3px solid #000;
  }
  .staff-brutal-header-label {
    font-size: 10px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.1em; color: #FFFFFF;
  }
  .staff-brutal-status-tag {
    padding: 2px 8px; background: #FACC15; color: #000; font-size: 9px;
    font-weight: 900; text-transform: uppercase; border: 2px solid #000;
  }
  .staff-brutal-status-tag.is-off { background: var(--danger, #EF4444); color: #FFF; }
  .staff-brutal-body {
    padding: var(--staff-padding, 18px);
    display: flex; gap: 14px; align-items: flex-start;
  }
  .staff-brutal-avatar {
    width: 56px; height: 56px; border: 3px solid #000;
    background: #A5F3FC; color: #000;
    font-size: 20px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
  }
  .staff-brutal-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .staff-brutal-meta { flex: 1; min-width: 0; }
  .staff-brutal-name { font-size: 18px; font-weight: 900; color: var(--staff-text-color, #000); line-height: 1.2; }
  .staff-brutal-handle { font-size: 12px; font-weight: 700; color: var(--staff-text-muted, #374151); }
  .staff-brutal-role-sticker {
    display: inline-block; margin-top: 6px;
    padding: 3px 10px; background: var(--staff-role-badge-bg, #A5F3FC);
    color: var(--staff-role-badge-color, #000); font-size: 11px; font-weight: 900;
    text-transform: uppercase; border: 2px solid #000;
    transform: rotate(-1deg);
  }
  .staff-brutal-contact {
    padding: 10px var(--staff-padding, 18px);
    border-top: 2px dashed #000;
    font-size: 11px; color: var(--staff-text-muted, #374151);
    display: flex; flex-direction: column; gap: 2px;
  }
  .staff-brutal-footer {
    padding: 10px var(--staff-padding, 18px);
    border-top: 3px solid #000;
    display: flex; align-items: center; justify-content: space-between;
    background: #FEFCE8;
  }
  .staff-brutal-btn {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 5px 12px; border: 2px solid #000;
    background: var(--staff-btn-bg, #FACC15); color: var(--staff-btn-color, #000);
    font-size: 11px; font-weight: 900; text-transform: uppercase;
    cursor: pointer; transition: all 0.1s ease;
  }
  .staff-brutal-btn:hover { transform: translate(-1px, -1px); box-shadow: 2px 2px 0px #000; }
  .staff-brutal-btn:active { transform: translate(1px, 1px); box-shadow: none; }
  .staff-brutal-btn.is-delete { background: #FCA5A5; }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 8: FLAT METRO GRID                                             */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .staff-layout-metro .staff-metro-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--staff-grid-gap, 4px);
    padding: 0;
  }
  .staff-metro-tile {
    background: var(--staff-card-bg, #2563EB);
    border-radius: 0;
    padding: var(--staff-padding, 20px);
    display: flex; flex-direction: column;
    justify-content: flex-end; min-height: 200px;
    position: relative; overflow: hidden;
    cursor: pointer;
    transform: scale(var(--staff-card-scale, 1));
    transition: all 0.2s ease;
  }
  .staff-metro-tile:nth-child(5n+1) { background: #2563EB; }
  .staff-metro-tile:nth-child(5n+2) { background: var(--danger, #DC2626); }
  .staff-metro-tile:nth-child(5n+3) { background: #059669; }
  .staff-metro-tile:nth-child(5n+4) { background: var(--warning, #D97706); }
  .staff-metro-tile:nth-child(5n+5) { background: #7C3AED; }
  .staff-metro-tile:hover { filter: brightness(1.1); transform: scale(calc(var(--staff-card-scale, 1) * 1.02)); }
  .staff-metro-watermark {
    position: absolute; top: -10px; right: -5px;
    font-size: 80px; font-weight: 900; color: rgba(0,0,0,0.12);
    line-height: 1; pointer-events: none;
    text-transform: uppercase;
  }
  .staff-metro-content { position: relative; z-index: 1; }
  .staff-metro-avatar {
    width: 42px; height: 42px;
    background: rgba(0,0,0,0.2); color: #FFF;
    font-size: 16px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 10px; overflow: hidden;
  }
  .staff-metro-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .staff-metro-name { font-size: 20px; font-weight: 800; color: #FFFFFF; line-height: 1.2; }
  .staff-metro-sub { font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 6px; }
  .staff-metro-role-tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; background: rgba(0,0,0,0.25);
    color: #FFF; font-size: 10px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .staff-metro-actions {
    display: flex; gap: 4px; margin-top: 10px;
  }
  .staff-metro-btn {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px;
    background: rgba(0,0,0,0.3); color: #FFF;
    cursor: pointer; transition: background 0.15s;
  }
  .staff-metro-btn:hover { background: rgba(0,0,0,0.5); }
  .staff-metro-check {
    position: absolute; top: 10px; left: 10px; z-index: 2;
  }
  .staff-metro-status {
    position: absolute; top: 10px; right: 10px;
    width: 10px; height: 10px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.5);
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 9: VERTICAL ACTIVITY TIMELINE                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .staff-layout-timeline .staff-timeline-feed {
    position: relative;
    padding: 10px 10px 10px 50px;
  }
  .staff-layout-timeline .staff-timeline-feed::before {
    content: '';
    position: absolute;
    top: 0; bottom: 0; left: 38px;
    width: 3px;
    background: linear-gradient(180deg, var(--staff-accent-color, #7C3AED), rgba(124,58,237,0.1));
    border-radius: 4px;
  }
  .staff-timeline-item {
    position: relative;
    margin-bottom: 24px;
  }
  .staff-timeline-node {
    position: absolute;
    left: -22px; top: 18px;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--staff-accent-color, #7C3AED);
    border: 3px solid var(--staff-canvas-bg, #F8FAFC);
    box-shadow: 0 0 0 3px var(--staff-accent-color, #7C3AED);
    z-index: 2;
  }
  @keyframes timeline-pulse {
    0%, 100% { box-shadow: 0 0 0 3px var(--staff-accent-color, #7C3AED); }
    50% { box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.2); }
  }
  .staff-timeline-node.is-active {
    animation: timeline-pulse 2s infinite;
  }
  .staff-timeline-card {
    background: var(--staff-card-bg, #FFFFFF);
    border: 1px solid var(--staff-card-border, #E2E8F0);
    border-radius: var(--staff-card-radius, 16px);
    padding: var(--staff-padding, 18px);
    box-shadow: 0 4px 16px -4px rgba(0,0,0,0.06);
    display: flex; gap: 14px; align-items: flex-start;
    transition: all 0.25s ease;
    transform: scale(var(--staff-card-scale, 1));
    position: relative;
  }
  .staff-timeline-card::before {
    content: '';
    position: absolute;
    left: -8px; top: 18px;
    width: 12px; height: 12px;
    background: var(--staff-card-bg, #FFFFFF);
    border-left: 1px solid var(--staff-card-border, #E2E8F0);
    border-bottom: 1px solid var(--staff-card-border, #E2E8F0);
    transform: rotate(45deg);
  }
  .staff-timeline-card:hover {
    box-shadow: 0 10px 30px -6px rgba(124, 58, 237, 0.15);
    border-color: var(--staff-accent-color, #7C3AED);
  }
  .staff-timeline-avatar {
    width: 48px; height: 48px; border-radius: 12px;
    background: var(--staff-role-badge-bg, #EDE9FE);
    color: var(--staff-accent-color, #7C3AED);
    font-size: 17px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
  }
  .staff-timeline-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
  .staff-timeline-meta { flex: 1; min-width: 0; }
  .staff-timeline-name { font-size: 16px; font-weight: 800; color: var(--staff-text-color, #0F172A); }
  .staff-timeline-handle { font-size: 12px; color: var(--staff-text-muted, #64748B); }
  .staff-timeline-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
  .staff-timeline-role {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 8px; border-radius: 6px;
    background: var(--staff-role-badge-bg, #EDE9FE);
    color: var(--staff-role-badge-color, #6D28D9);
    font-size: 10px; font-weight: 700; text-transform: uppercase;
  }
  .staff-timeline-time {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 8px; border-radius: 6px;
    background: var(--card-hover, #F1F5F9); color: var(--text-muted, #475569);
    font-size: 10px; font-weight: 600; font-family: monospace;
  }
  .staff-timeline-contact {
    margin-top: 8px; font-size: 11px; color: var(--staff-text-muted, #64748B);
    display: flex; flex-direction: column; gap: 2px;
  }
  .staff-timeline-actions {
    display: flex; flex-direction: column; gap: 4px;
    flex-shrink: 0;
  }
  .staff-timeline-btn {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--staff-role-badge-bg, #EDE9FE);
    color: var(--staff-accent-color, #7C3AED);
    cursor: pointer; transition: all 0.15s;
  }
  .staff-timeline-btn:hover { background: var(--staff-accent-color, #7C3AED); color: #FFF; }
  .staff-timeline-btn.is-delete { color: var(--danger, #EF4444); background: #FEF2F2; }
  .staff-timeline-btn.is-delete:hover { background: var(--danger, #EF4444); color: #FFF; }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 10: FLOATING CAPSULE CHIPS                                     */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .staff-layout-compactpill .staff-pill-grid {
    display: flex; flex-direction: column;
    gap: var(--staff-grid-gap, 12px);
    padding: 6px;
  }
  .staff-pill-chip {
    background: var(--staff-card-bg, #FFFFFF);
    border: 1.5px solid var(--staff-card-border, #E2E8F0);
    border-radius: 999px;
    padding: 8px 8px 8px 8px;
    display: flex; align-items: center; gap: 12px;
    box-shadow: 0 2px 12px -2px rgba(0,0,0,0.06);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--staff-card-scale, 1));
  }
  .staff-pill-chip:hover {
    box-shadow: 0 8px 24px -4px rgba(249, 115, 22, 0.15);
    transform: scale(calc(var(--staff-card-scale, 1) * 1.01)) translateX(4px);
    border-color: var(--staff-accent-color, #F97316);
  }
  .staff-pill-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: var(--staff-role-badge-bg, #FFF7ED);
    color: var(--staff-accent-color, #F97316);
    font-size: 15px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
    position: relative;
  }
  .staff-pill-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .staff-pill-halo {
    position: absolute; inset: -3px; border-radius: 50%;
    border: 2px solid transparent;
  }
  .staff-pill-halo.is-active {
    border-color: var(--staff-status-active-color, #10B981);
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
  }
  .staff-pill-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .staff-pill-name { font-size: 14px; font-weight: 700; color: var(--staff-text-color, #0F172A); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .staff-pill-handle { font-size: 11px; color: var(--staff-text-muted, #64748B); }
  .staff-pill-role {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 3px 10px; border-radius: 999px;
    background: var(--staff-role-badge-bg, #FFF7ED);
    color: var(--staff-role-badge-color, #C2410C);
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    flex-shrink: 0;
  }
  .staff-pill-contact {
    display: flex; flex-direction: column; gap: 1px;
    font-size: 11px; color: var(--staff-text-muted, #64748B);
    flex-shrink: 0;
    max-width: 200px;
  }
  .staff-pill-actions {
    display: flex; gap: 4px; flex-shrink: 0; padding-right: 8px;
  }
  .staff-pill-btn {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--staff-role-badge-bg, #FFF7ED);
    color: var(--staff-accent-color, #F97316);
    cursor: pointer; transition: all 0.15s;
  }
  .staff-pill-btn:hover { background: var(--staff-accent-color, #F97316); color: #FFF; }
  .staff-pill-btn.is-delete { color: var(--danger, #EF4444); background: #FEF2F2; }
  .staff-pill-btn.is-delete:hover { background: var(--danger, #EF4444); color: #FFF; }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 11: SCI-FI RADIAL HUD                                         */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .staff-layout-radialhud .staff-hud-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--staff-grid-gap, 24px);
    padding: 6px;
  }
  .staff-hud-card {
    background: var(--staff-card-bg, rgba(15, 23, 42, 0.85));
    border: 1px solid var(--staff-card-border, rgba(52, 211, 153, 0.35));
    border-radius: var(--staff-card-radius, 20px);
    padding: var(--staff-padding, 20px);
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
    position: relative; overflow: hidden;
    transition: all 0.3s ease;
    transform: scale(var(--staff-card-scale, 1));
  }
  .staff-hud-card::before {
    content: '';
    position: absolute; inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: conic-gradient(from 0deg, transparent, var(--staff-accent-color, #34D399), transparent, transparent);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: hud-orbit 6s linear infinite;
    pointer-events: none;
  }
  @keyframes hud-orbit {
    0% { background: conic-gradient(from 0deg, transparent, var(--staff-accent-color, #34D399), transparent, transparent); }
    100% { background: conic-gradient(from 360deg, transparent, var(--staff-accent-color, #34D399), transparent, transparent); }
  }
  .staff-hud-card:hover {
    border-color: var(--staff-accent-color, #34D399);
    box-shadow: 0 0 30px rgba(52, 211, 153, 0.15), inset 0 0 30px rgba(52, 211, 153, 0.03);
  }
  .staff-hud-coords {
    width: 100%; display: flex; justify-content: space-between;
    font-size: 9px; font-weight: 700; font-family: monospace;
    color: var(--staff-accent-color, #34D399);
    text-transform: uppercase; letter-spacing: 0.1em;
    margin-bottom: 12px; opacity: 0.6;
  }
  .staff-hud-ring-wrap {
    position: relative;
    width: 80px; height: 80px;
    margin-bottom: 14px;
  }
  .staff-hud-perm-ring {
    position: absolute; inset: 0;
    border-radius: 50%;
    background: conic-gradient(
      var(--staff-accent-color, #34D399) calc(var(--perm-pct, 50) * 1%),
      rgba(148, 163, 184, 0.15) 0
    );
    -webkit-mask: radial-gradient(circle, transparent 55%, #000 56%);
    mask: radial-gradient(circle, transparent 55%, #000 56%);
  }
  .staff-hud-avatar {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 50px; height: 50px; border-radius: 50%;
    background: rgba(52, 211, 153, 0.1);
    border: 2px solid var(--staff-accent-color, #34D399);
    color: var(--staff-accent-color, #34D399);
    font-size: 18px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .staff-hud-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .staff-hud-name { font-size: 16px; font-weight: 800; color: var(--staff-text-color, #E2E8F0); margin-bottom: 2px; }
  .staff-hud-handle { font-size: 11px; color: var(--staff-text-muted, #94A3B8); font-family: monospace; margin-bottom: 8px; }
  .staff-hud-role {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 12px; border-radius: 6px;
    background: var(--staff-role-badge-bg, rgba(52, 211, 153, 0.15));
    color: var(--staff-role-badge-color, #6EE7B7);
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; margin-bottom: 12px;
    border: 1px solid rgba(52, 211, 153, 0.2);
  }
  .staff-hud-telemetry {
    width: 100%; display: grid; grid-template-columns: 1fr 1fr;
    gap: 6px; margin-bottom: 14px;
  }
  .staff-hud-stat {
    background: rgba(52, 211, 153, 0.06);
    border: 1px solid rgba(52, 211, 153, 0.12);
    border-radius: 8px; padding: 6px 8px;
    display: flex; flex-direction: column; align-items: center;
  }
  .staff-hud-stat-label { font-size: 8px; font-weight: 700; text-transform: uppercase; color: var(--staff-text-muted, #94A3B8); letter-spacing: 0.06em; }
  .staff-hud-stat-value { font-size: 14px; font-weight: 800; color: var(--staff-accent-color, #34D399); font-family: monospace; }
  .staff-hud-contact {
    width: 100%; font-size: 11px; color: var(--staff-text-muted, #94A3B8);
    display: flex; flex-direction: column; gap: 2px;
    text-align: left; margin-bottom: 14px;
    font-family: monospace;
  }
  .staff-hud-actions { display: flex; gap: 6px; width: 100%; }
  .staff-hud-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 3px;
    padding: 7px 0; border-radius: 8px;
    background: var(--staff-btn-bg, rgba(52, 211, 153, 0.25));
    color: var(--staff-btn-color, #34D399);
    font-size: 11px; font-weight: 700; cursor: pointer;
    border: 1px solid rgba(52, 211, 153, 0.15);
    text-transform: uppercase; letter-spacing: 0.04em;
    transition: all 0.2s;
  }
  .staff-hud-btn:hover { background: rgba(52, 211, 153, 0.35); }
  .staff-hud-btn.is-delete { color: #F87171; background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.15); }
  .staff-hud-btn.is-delete:hover { background: rgba(239,68,68,0.3); }

  /* Responsive for new designs */
  @media (max-width: 768px) {
    .staff-pill-chip { flex-wrap: wrap; border-radius: 20px; }
    .staff-pill-contact { display: none; }
    .staff-timeline-feed { padding-left: 36px; }
    .staff-layout-timeline .staff-timeline-feed::before { left: 24px; }
    .staff-timeline-node { left: -19px; }
  }
`;
