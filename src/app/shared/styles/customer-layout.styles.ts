/**
 * Five Customer Page layout designs, shared between CustomerLayoutPreview and CustomersComponent.
 *
 * 1. Executive VIP Cards (Design 1): Luxury CRM guest cards with VIP membership badge, glowing avatar ring,
 *    contact triggers, visit frequency, and gross spend progression pill.
 * 2. Minimalist Clean Table (Design 2): Sleek, high-density corporate data ledger with clean borders,
 *    phone badges, visit counters, and rapid inline actions.
 * 3. Compact CRM Tiles (Design 3): Space-optimized grid of touch-friendly customer contact tiles with quick dial,
 *    visit count, and one-tap invoice inspection.
 * 4. List View (Design 4): Full-featured enterprise tabular layout with selection checkboxes, avatar + locality,
 *    phone pill, status badge, and complete action menu.
 * 5. Card View (Design 5): Modern customer cards with gradient cover banner, initials avatar, tier badge,
 *    spending stats, locality, and card footer actions.
 */
export const CUSTOMER_LAYOUT_CSS = `
  /* ═══════════════════════════════════════════════════════════════════════ */
  /* CUSTOMER DIRECTORY DESIGN SYSTEM — 5 DISTINCT DESIGNS                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  .customer-stage {
    background-color: var(--cust-canvas-bg, #FAF5FF);
    border-radius: 16px;
    padding: var(--cust-grid-gap, 20px);
    transition: background-color 0.25s ease, padding 0.25s ease;
    width: 100%;
    box-sizing: border-box;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 1: EXECUTIVE VIP CARDS                                          */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .customer-layout-vipcard .cust-vip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--cust-grid-gap, 20px);
    padding: 4px;
  }

  .cust-vip-card {
    background: var(--cust-card-bg, #FFFFFF);
    border: 1.5px solid var(--cust-card-border, #E9D5FF);
    border-radius: var(--cust-card-radius, 20px);
    padding: var(--cust-padding, 20px);
    box-shadow: 0 10px 25px -5px rgba(var(--primary-rgb, 126, 34, 206), 0.06), 0 4px 10px -2px rgba(0, 0, 0, 0.02);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--cust-card-scale, 1));
    position: relative;
    overflow: hidden;
  }
  .cust-vip-card:hover {
    transform: scale(calc(var(--cust-card-scale, 1) * 1.02)) translateY(-2px);
    box-shadow: 0 18px 36px -4px rgba(var(--primary-rgb, 126, 34, 206), 0.12);
    border-color: var(--cust-accent-color, #7E22CE);
  }

  .cust-vip-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .cust-vip-avatar-wrap {
    position: relative;
  }
  .cust-vip-avatar {
    width: 50px;
    height: 50px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(var(--primary-rgb, 126, 34, 206), 0.12), rgba(168, 85, 247, 0.2));
    border: 2px solid var(--cust-card-border, #E9D5FF);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 16px;
    color: var(--cust-accent-color, #7E22CE);
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(var(--primary-rgb, 126, 34, 206), 0.1);
  }
  .cust-vip-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cust-vip-online {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--success, #16A34A);
    border: 2px solid #FFFFFF;
  }

  .cust-vip-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    background-color: var(--cust-vip-badge-bg, #FEF3C7);
    color: var(--cust-vip-badge-color, #B45309);
    border: 1px solid rgba(180, 83, 9, 0.15);
  }

  .cust-vip-body {
    flex: 1;
    margin-bottom: 14px;
  }
  .cust-vip-name {
    font-size: var(--cust-font-size, 15px);
    font-weight: 800;
    color: var(--cust-text-color, #2E1065);
    margin: 0 0 4px;
    line-height: 1.25;
  }
  .cust-vip-locality {
    font-size: 12px;
    color: var(--cust-text-muted, #6B7280);
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 10px;
  }
  .cust-vip-locality .material-symbols-outlined {
    font-size: 14px;
    color: var(--cust-accent-color, #7E22CE);
  }

  .cust-vip-chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }
  .cust-vip-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(var(--primary-rgb, 126, 34, 206), 0.05);
    border: 1px solid var(--cust-card-border, #E9D5FF);
    border-radius: 8px;
    padding: 3px 8px;
    font-size: 11px;
    font-family: monospace;
    font-weight: 600;
    color: var(--cust-text-color, #2E1065);
  }

  .cust-vip-stats-bar {
    background: var(--bg-app, #FAF5FF);
    border: 1px solid var(--cust-card-border, #E9D5FF);
    border-radius: 12px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .cust-vip-stat-item {
    display: flex;
    flex-direction: column;
  }
  .cust-vip-stat-label {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 700;
    color: var(--cust-text-muted, #6B7280);
    letter-spacing: 0.03em;
  }
  .cust-vip-stat-val {
    font-size: 13px;
    font-weight: 900;
    font-family: monospace;
    color: var(--cust-text-color, #2E1065);
  }
  .cust-vip-stat-val.is-spend {
    color: var(--cust-spend-color, #16A34A);
  }

  .cust-vip-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid rgba(233, 213, 255, 0.6);
  }
  /* The row actions for every design now live together at the foot of this
     file, so the five treatments can be compared side by side. */

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 2: MINIMALIST CLEAN TABLE                                */
  /* ═══════════════════════════════════════════════════════════════ */
  .customer-layout-clean .cust-clean-table-wrap {
    background: var(--cust-card-bg, #FFFFFF);
    border: 1px solid var(--cust-card-border, #E5E7EB);
    border-radius: var(--cust-card-radius, 10px);
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transform: scale(var(--cust-card-scale, 1));
    transform-origin: top left;
  }

  .cust-clean-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--cust-font-size, 14px);
  }
  .cust-clean-table thead {
    background: var(--bg-app, #F8FAFC);
    border-bottom: 1.5px solid var(--cust-card-border, #E5E7EB);
  }
  .cust-clean-table th {
    padding: 12px 14px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--cust-text-muted, #64748B);
    text-align: left;
  }
  .cust-clean-table td {
    padding: var(--cust-padding, 12px) 14px;
    border-bottom: 1px solid var(--cust-card-border, #E5E7EB);
    color: var(--cust-text-color, #0F172A);
    vertical-align: middle;
  }
  .cust-clean-table tr:hover td {
    background-color: var(--bg-app, #F8FAFC);
  }
  .cust-clean-name {
    font-weight: 700;
    color: var(--cust-text-color, #0F172A);
  }
  .cust-clean-locality {
    font-size: 11px;
    color: var(--cust-text-muted, #64748B);
  }
  .cust-clean-phone {
    font-family: monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--cust-accent-color, #2563EB);
    background: #EFF6FF;
    padding: 2px 6px;
    border-radius: 6px;
    border: 1px solid rgba(37, 99, 235, 0.15);
  }
  .cust-clean-spend {
    font-family: monospace;
    font-weight: 800;
    color: var(--cust-spend-color, #059669);
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 3: COMPACT CRM TILES                                    */
  /* ═══════════════════════════════════════════════════════════════ */
  .customer-layout-compact .cust-compact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--cust-grid-gap, 12px);
    padding: 2px;
  }

  .cust-compact-tile {
    background: var(--cust-card-bg, #FFFFFF);
    border: 1.5px solid var(--cust-card-border, #CBD5E1);
    border-radius: var(--cust-card-radius, 14px);
    padding: var(--cust-padding, 12px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.2s ease;
    transform: scale(var(--cust-card-scale, 1));
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  }
  .cust-compact-tile:hover {
    border-color: var(--cust-accent-color, #0D9488);
    transform: scale(calc(var(--cust-card-scale, 1) * 1.02)) translateY(-1px);
    box-shadow: 0 8px 16px -2px rgba(13, 148, 136, 0.12);
  }

  .cust-compact-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .cust-compact-avatar {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(13, 148, 136, 0.1);
    border: 1px solid var(--cust-card-border, #CBD5E1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 13px;
    color: var(--cust-accent-color, #0D9488);
    flex-shrink: 0;
  }
  .cust-compact-title {
    font-size: var(--cust-font-size, 13px);
    font-weight: 800;
    color: var(--cust-text-color, #0F172A);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cust-compact-phone {
    font-size: 11px;
    font-family: monospace;
    color: var(--cust-text-muted, #64748B);
  }

  .cust-compact-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px dashed var(--cust-card-border, #CBD5E1);
  }
  .cust-compact-spent {
    font-size: 12px;
    font-weight: 900;
    font-family: monospace;
    color: var(--cust-spend-color, #0D9488);
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 4: LIST VIEW (ENTERPRISE TABULAR)                       */
  /* ═══════════════════════════════════════════════════════════════ */
  .customer-layout-list .cust-list-table-wrap {
    background: var(--cust-card-bg, #FFFFFF);
    border: 1px solid var(--cust-card-border, #E2E8F0);
    border-radius: var(--cust-card-radius, 12px);
    overflow-x: auto;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transform: scale(var(--cust-card-scale, 1));
    transform-origin: top left;
  }

  .cust-list-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--cust-font-size, 14px);
  }
  .cust-list-table thead {
    background: var(--bg-app, #F8FAFC);
    border-bottom: 2px solid var(--cust-card-border, #E2E8F0);
  }
  .cust-list-table th {
    padding: 12px 14px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--cust-text-muted, #64748B);
    text-align: left;
    white-space: nowrap;
  }
  .cust-list-table td {
    padding: var(--cust-padding, 14px) 14px;
    border-bottom: 1px solid var(--cust-card-border, #E2E8F0);
    color: var(--cust-text-color, #1E293B);
    vertical-align: middle;
  }
  .cust-list-table tr:hover td {
    background-color: var(--bg-app, #F8FAFC);
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 5: CARD VIEW (GUEST PROFILE CARDS)                      */
  /* ═══════════════════════════════════════════════════════════════ */
  .customer-layout-card .cust-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--cust-grid-gap, 18px);
    padding: 4px;
  }

  .cust-profile-card {
    background: var(--cust-card-bg, #FFFFFF);
    border: 1.5px solid var(--cust-card-border, #E2E8F0);
    border-radius: var(--cust-card-radius, 18px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.25s ease;
    transform: scale(var(--cust-card-scale, 1));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  }
  .cust-profile-card:hover {
    transform: scale(calc(var(--cust-card-scale, 1) * 1.02)) translateY(-2px);
    box-shadow: 0 16px 28px -4px rgba(var(--primary-rgb, 126, 34, 206), 0.1);
    border-color: var(--cust-accent-color, #7E22CE);
  }

  .cust-profile-cover {
    height: 48px;
    background: linear-gradient(135deg, rgba(var(--primary-rgb, 126, 34, 206), 0.15), rgba(192, 132, 252, 0.25));
    position: relative;
  }
  .cust-profile-avatar-pos {
    position: absolute;
    bottom: -22px;
    left: 18px;
  }
  .cust-profile-avatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--card-bg, #FFFFFF);
    border: 2px solid var(--cust-accent-color, #7E22CE);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 14px;
    color: var(--cust-accent-color, #7E22CE);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  .cust-profile-card-content {
    padding: var(--cust-padding, 16px);
    padding-top: 28px;
    flex: 1;
  }
  .cust-profile-name {
    font-size: var(--cust-font-size, 15px);
    font-weight: 800;
    color: var(--cust-text-color, #0F172A);
    margin: 0 0 2px;
  }
  .cust-profile-loc {
    font-size: 11px;
    color: var(--cust-text-muted, #64748B);
    margin-bottom: 12px;
  }
  .cust-profile-stats-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-app, #F8FAFC);
    padding: 8px 12px;
    border-radius: 10px;
    margin-bottom: 12px;
    border: 1px solid var(--cust-card-border, #E2E8F0);
  }
  .cust-profile-card-footer {
    padding: 10px 16px;
    background: var(--bg-app, #FAF5FF);
    border-top: 1px solid var(--cust-card-border, #E2E8F0);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* ROW ACTIONS — a different button character per design           */
  /* ═══════════════════════════════════════════════════════════════ */
  /* Geometry and transitions only — all character lives per design. */
  .cust-act {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: background 0.18s ease, color 0.18s ease,
      border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  }
  .cust-act .material-symbols-outlined {
    font-size: 17px;
    line-height: 1;
  }
  .cust-act:focus-visible {
    outline: 2px solid var(--cust-button-bg, #7E22CE);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    .cust-act {
      transition-duration: 0.01ms;
    }
    .cust-act:hover {
      transform: none;
    }
  }

  /* DESIGN 1 — Executive VIP: a pill that lifts off the card. */
  .cust-vip-btn-group {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .cust-act.is-vip {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: var(--card-bg, #FFFFFF);
    color: var(--cust-text-color, #2E1065);
    border: 1px solid var(--cust-card-border, #E9D5FF);
    box-shadow: 0 1px 2px rgba(var(--text-main-rgb, 46, 16, 101), 0.08);
  }
  .cust-act.is-vip:hover {
    background: var(--cust-button-bg, #7E22CE);
    color: var(--cust-button-color, #FFFFFF);
    border-color: transparent;
    transform: translateY(-2px);
    box-shadow: 0 6px 14px
      color-mix(in srgb, var(--cust-button-bg, #7E22CE) 38%, transparent);
  }
  .cust-act.is-vip.is-delete:hover {
    background: var(--danger, #DC2626);
    box-shadow: 0 6px 14px rgba(var(--danger-rgb, 220, 38, 38), 0.35);
  }

  /* DESIGN 2 — Minimalist Clean: no box at all, just an underline. */
  .cust-clean-actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .cust-act.is-clean {
    position: relative;
    width: 30px;
    height: 30px;
    color: var(--cust-text-muted, #64748B);
  }
  .cust-act.is-clean::after {
    content: '';
    position: absolute;
    left: 50%;
    right: 50%;
    bottom: 2px;
    height: 2px;
    border-radius: 2px;
    background: var(--cust-button-bg, #7E22CE);
    transition: left 0.18s ease, right 0.18s ease;
  }
  .cust-act.is-clean:hover {
    color: var(--cust-button-bg, #7E22CE);
  }
  .cust-act.is-clean:hover::after {
    left: 5px;
    right: 5px;
  }
  .cust-act.is-clean.is-delete::after {
    background: var(--danger, #DC2626);
  }
  .cust-act.is-clean.is-delete:hover {
    color: var(--danger, #DC2626);
  }

  /* DESIGN 3 — Compact CRM: dense tinted tiles that press inward. */
  .cust-compact-actions {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .cust-act.is-compact {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: color-mix(in srgb, var(--cust-button-bg, #7E22CE) 15%, var(--card-bg, #FFFFFF));
    color: var(--cust-button-bg, #7E22CE);
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--cust-button-bg, #7E22CE) 18%, transparent);
  }
  .cust-act.is-compact .material-symbols-outlined {
    font-size: 15px;
  }
  .cust-act.is-compact:hover {
    background: var(--cust-button-bg, #7E22CE);
    color: var(--cust-button-color, #FFFFFF);
    transform: translateY(1px);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  .cust-act.is-compact.is-delete {
    background: rgba(var(--danger-rgb, 220, 38, 38), 0.1);
    color: var(--danger, #DC2626);
    box-shadow: inset 0 0 0 1px rgba(var(--danger-rgb, 220, 38, 38), 0.2);
  }
  .cust-act.is-compact.is-delete:hover {
    background: var(--danger, #DC2626);
    color: #FFFFFF;
  }

  /* DESIGN 4 — List View: the three actions read as one segmented bar. */
  .cust-list-actions {
    display: inline-flex;
    align-items: center;
    overflow: hidden;
    border: 1px solid var(--cust-card-border, #E2E8F0);
    border-radius: 8px;
    background: var(--card-bg, #FFFFFF);
  }
  .cust-act.is-list {
    width: 34px;
    height: 28px;
    color: var(--cust-text-muted, #64748B);
    border-right: 1px solid var(--cust-card-border, #E2E8F0);
  }
  .cust-act.is-list:last-child {
    border-right: 0;
  }
  .cust-act.is-list .material-symbols-outlined {
    font-size: 16px;
  }
  .cust-act.is-list:hover {
    background: color-mix(in srgb, var(--cust-button-bg, #7E22CE) 12%, var(--card-bg, #FFFFFF));
    color: var(--cust-button-bg, #7E22CE);
  }
  .cust-act.is-list.is-delete:hover {
    background: rgba(var(--danger-rgb, 220, 38, 38), 0.1);
    color: var(--danger, #DC2626);
  }

  /* DESIGN 5 — Card View: circles floating above the card footer. */
  .cust-card-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .cust-act.is-card {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--card-bg, #FFFFFF);
    color: var(--cust-text-muted, #64748B);
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.14);
  }
  .cust-act.is-card .material-symbols-outlined {
    font-size: 16px;
  }
  .cust-act.is-card:hover {
    transform: scale(1.14);
    background: var(--cust-button-bg, #7E22CE);
    color: var(--cust-button-color, #FFFFFF);
    box-shadow: 0 6px 16px
      color-mix(in srgb, var(--cust-button-bg, #7E22CE) 42%, transparent);
  }
  .cust-act.is-card.is-delete:hover {
    background: var(--danger, #DC2626);
    box-shadow: 0 6px 16px rgba(var(--danger-rgb, 220, 38, 38), 0.4);
  }

  /* ── TOUCH SIZING ─────────────────────────────────────────────────────
     The customer name in each layout is a shortcut into the 360 profile,
     but it is a heading or a div rather than a button, so the 44px floor
     in section 109 of styles.css does not reach it.

     The same drawer is always reachable from the labelled button in the
     row actions, so nothing here is the only route to an action — this
     just stops the name from being a sliver of a target sitting directly
     above the row below it. */
  @media (any-pointer: coarse) {
    .cust-vip-name,
    .cust-clean-name,
    .cust-compact-title,
    .cust-profile-name {
      display: inline-flex;
      align-items: center;
      min-height: 40px;
    }
  }
`;
