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
    box-shadow: 0 10px 25px -5px rgba(126, 34, 206, 0.06), 0 4px 10px -2px rgba(0, 0, 0, 0.02);
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
    box-shadow: 0 18px 36px -4px rgba(126, 34, 206, 0.12);
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
    background: linear-gradient(135deg, rgba(126, 34, 206, 0.12), rgba(168, 85, 247, 0.2));
    border: 2px solid var(--cust-card-border, #E9D5FF);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 16px;
    color: var(--cust-accent-color, #7E22CE);
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(126, 34, 206, 0.1);
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
    background: #16A34A;
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
    background: rgba(126, 34, 206, 0.05);
    border: 1px solid var(--cust-card-border, #E9D5FF);
    border-radius: 8px;
    padding: 3px 8px;
    font-size: 11px;
    font-family: monospace;
    font-weight: 600;
    color: var(--cust-text-color, #2E1065);
  }

  .cust-vip-stats-bar {
    background: #FAF5FF;
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
  .cust-vip-btn-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .cust-vip-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--cust-card-border, #E9D5FF);
    background: #FFFFFF;
    color: var(--cust-text-color, #2E1065);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .cust-vip-btn:hover {
    background: var(--cust-button-bg, #7E22CE);
    color: var(--cust-button-color, #FFFFFF);
    border-color: var(--cust-button-bg, #7E22CE);
  }
  .cust-vip-btn.is-delete:hover {
    background: #DC2626;
    color: #FFFFFF;
    border-color: #DC2626;
  }

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
    background: #F8FAFC;
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
    background-color: #F8FAFC;
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
    background: #F8FAFC;
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
    background-color: #F8FAFC;
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
    box-shadow: 0 16px 28px -4px rgba(126, 34, 206, 0.1);
    border-color: var(--cust-accent-color, #7E22CE);
  }

  .cust-profile-cover {
    height: 48px;
    background: linear-gradient(135deg, rgba(126, 34, 206, 0.15), rgba(192, 132, 252, 0.25));
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
    background: #FFFFFF;
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
    background: #F8FAFC;
    padding: 8px 12px;
    border-radius: 10px;
    margin-bottom: 12px;
    border: 1px solid var(--cust-card-border, #E2E8F0);
  }
  .cust-profile-card-footer {
    padding: 10px 16px;
    background: #FAF5FF;
    border-top: 1px solid var(--cust-card-border, #E2E8F0);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;
