/**
 * Five Stock Ledger Page layout designs, shared between StockLayoutPreview and StockComponent.
 *
 * 1. Warehouse Metric Grid (Design 1): Industrial inventory management cards with SKU pill,
 *    health gauge, valuation chip, and action controls.
 * 2. Audited Financial Ledger (Design 2): Corporate accounting table with weighted average costs,
 *    valuation breakdown, health indicators, and ledger triggers.
 * 3. Compact Kanban Stock Tiles (Design 3): High-density operational tiles grouping stock metrics,
 *    threshold pills, and fast adjustment actions.
 * 4. List View (Design 4): Classic comprehensive tabular row layout with live stock balances,
 *    health meters, valuation, and quick actions.
 * 5. Card View (Design 5): Executive inventory cards with prominent health meters, dual valuation
 *    widgets, and instant purchase triggers.
 */
export const STOCK_LAYOUT_CSS = `
  /* ═══════════════════════════════════════════════════════════════════════ */
  /* STOCK LEDGER DESIGN SYSTEM — 5 DISTINCT DESIGNS                        */
  /* ═══════════════════════════════════════════════════════════════════════ */

  .stock-stage {
    background-color: var(--stock-canvas-bg, #F8FAFC);
    border-radius: 16px;
    padding: var(--stock-grid-gap, 18px);
    transition: background-color 0.25s ease, padding 0.25s ease;
    width: 100%;
    box-sizing: border-box;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 1: WAREHOUSE METRIC GRID                                        */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .stock-layout-warehouse .stock-wh-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: var(--stock-grid-gap, 18px);
    padding: 4px;
  }

  .stock-wh-card {
    background: var(--stock-card-bg, #FFFFFF);
    border: 1.5px solid var(--stock-card-border, #CBD5E1);
    border-radius: var(--stock-card-radius, 14px);
    padding: var(--stock-padding, 18px);
    box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.05);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--stock-card-scale, 1));
    position: relative;
    overflow: hidden;
  }
  .stock-wh-card:hover {
    transform: scale(calc(var(--stock-card-scale, 1) * 1.015)) translateY(-2px);
    box-shadow: 0 12px 24px -4px rgba(15, 23, 42, 0.1);
    border-color: var(--stock-accent-color, #2563EB);
  }

  .stock-wh-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .stock-wh-sku {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--stock-accent-color, #2563EB);
    background: rgba(37, 99, 235, 0.08);
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid rgba(37, 99, 235, 0.2);
  }
  .stock-wh-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
  }
  .stock-wh-status-badge.is-healthy {
    background: rgba(var(--success-rgb, 22, 163, 74), 0.12);
    color: var(--stock-healthy-color, #16A34A);
  }
  .stock-wh-status-badge.is-warning {
    background: rgba(217, 119, 6, 0.12);
    color: var(--stock-warning-color, #D97706);
  }
  .stock-wh-status-badge.is-critical {
    background: rgba(var(--danger-rgb, 220, 38, 38), 0.12);
    color: var(--stock-critical-color, #DC2626);
  }

  .stock-wh-body {
    margin-bottom: 14px;
  }
  .stock-wh-title {
    font-size: var(--stock-font-size, 14px);
    font-weight: 700;
    color: var(--stock-text-color, #0F172A);
    margin: 0 0 4px 0;
    line-height: 1.3;
  }
  .stock-wh-sub {
    font-size: 11px;
    color: var(--stock-text-muted, #64748B);
    margin: 0;
  }

  .stock-wh-meter-box {
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 12px;
  }
  .stock-wh-meter-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }
  .stock-wh-qty {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 16px;
    font-weight: 800;
    color: var(--stock-text-color, #0F172A);
  }
  .stock-wh-unit {
    font-size: 11px;
    font-weight: 500;
    color: var(--stock-text-muted, #64748B);
    margin-left: 2px;
  }
  .stock-wh-threshold {
    font-size: 10px;
    color: var(--stock-text-muted, #64748B);
  }
  .stock-wh-bar-bg {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }
  .stock-wh-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  .stock-wh-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 14px;
  }
  .stock-wh-stat-card {
    background: rgba(0, 0, 0, 0.015);
    border: 1px solid var(--stock-card-border, #CBD5E1);
    border-radius: 8px;
    padding: 8px;
  }
  .stock-wh-stat-label {
    font-size: 10px;
    color: var(--stock-text-muted, #64748B);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    display: block;
    margin-bottom: 2px;
  }
  .stock-wh-stat-value {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    font-weight: 700;
    color: var(--stock-text-color, #0F172A);
  }
  .stock-wh-stat-value.is-valuation {
    color: var(--stock-valuation-color, #7E22CE);
  }

  .stock-wh-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    border-top: 1px solid var(--stock-card-border, #E2E8F0);
    padding-top: 10px;
  }
  .stock-wh-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 5px 9px;
    border-radius: 6px;
    border: 1px solid var(--stock-card-border, #CBD5E1);
    background: var(--stock-btn-bg, #F1F5F9);
    color: var(--stock-btn-color, #1E293B);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .stock-wh-btn:hover {
    background: var(--stock-accent-color, #2563EB);
    color: #FFFFFF;
    border-color: var(--stock-accent-color, #2563EB);
  }
  .stock-wh-btn.btn-entry {
    background: rgba(var(--success-rgb, 22, 163, 74), 0.08);
    color: var(--success, #16A34A);
    border-color: rgba(var(--success-rgb, 22, 163, 74), 0.2);
  }
  .stock-wh-btn.btn-entry:hover {
    background: var(--success, #16A34A);
    color: #FFFFFF;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 2: AUDITED FINANCIAL LEDGER                             */
  /* ═══════════════════════════════════════════════════════════════ */
  .stock-layout-financial .stock-fin-table-card {
    background: var(--stock-card-bg, #FFFFFF);
    border: 1px solid var(--stock-card-border, #E2E8F0);
    border-radius: var(--stock-card-radius, 10px);
    overflow-x: auto;
    box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04);
  }

  .stock-fin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--stock-font-size, 13px);
    color: var(--stock-text-color, #1E293B);
    text-align: left;
  }
  .stock-fin-table th {
    background: rgba(15, 118, 110, 0.04);
    color: var(--stock-accent-color, #0F766E);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: var(--stock-padding, 14px) 16px;
    border-bottom: 2px solid var(--stock-card-border, #E2E8F0);
  }
  .stock-fin-table td {
    padding: var(--stock-padding, 14px) 16px;
    border-bottom: 1px solid var(--stock-card-border, #E2E8F0);
    vertical-align: middle;
  }
  .stock-fin-row {
    transition: background-color 0.2s ease;
  }
  .stock-fin-row:hover {
    background: rgba(15, 118, 110, 0.02);
  }

  .stock-fin-sku {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--stock-accent-color, #0F766E);
    background: rgba(15, 118, 110, 0.08);
    padding: 2px 6px;
    border-radius: 4px;
  }
  .stock-fin-name {
    font-weight: 700;
    color: var(--stock-text-color, #1E293B);
    font-size: var(--stock-font-size, 13px);
  }
  .stock-fin-meta {
    font-size: 11px;
    color: var(--stock-text-muted, #64748B);
  }
  .stock-fin-unit-pill {
    font-size: 10px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-weight: 600;
    color: var(--stock-accent-color, #0F766E);
    border: 1px solid rgba(15, 118, 110, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .stock-fin-qty {
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-weight: 700;
    font-size: 13px;
  }
  .stock-fin-health-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
  }
  .stock-fin-health-pill.is-healthy {
    background: rgba(5, 150, 105, 0.1);
    color: var(--stock-healthy-color, #059669);
  }
  .stock-fin-health-pill.is-warning {
    background: rgba(217, 119, 6, 0.1);
    color: var(--stock-warning-color, #D97706);
  }
  .stock-fin-health-pill.is-critical {
    background: rgba(225, 29, 72, 0.1);
    color: var(--stock-critical-color, #E11D48);
  }
  .stock-fin-valuation {
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-weight: 700;
    color: var(--stock-valuation-color, #0369A1);
  }
  .stock-fin-cost {
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 12px;
    color: var(--stock-text-color, #1E293B);
  }

  .stock-fin-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--stock-card-border, #E2E8F0);
    background: var(--stock-btn-bg, #F8FAFC);
    color: var(--stock-btn-color, #0F766E);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .stock-fin-btn:hover {
    background: var(--stock-accent-color, #0F766E);
    color: #FFFFFF;
    border-color: var(--stock-accent-color, #0F766E);
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 3: COMPACT KANBAN STOCK TILES                           */
  /* ═══════════════════════════════════════════════════════════════ */
  .stock-layout-kanban .stock-kan-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--stock-grid-gap, 12px);
    padding: 4px;
  }

  .stock-kan-tile {
    background: var(--stock-card-bg, #FFFFFF);
    border: 1px solid var(--stock-card-border, #E9D5FF);
    border-radius: var(--stock-card-radius, 12px);
    padding: var(--stock-padding, 12px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.2s ease;
    transform: scale(var(--stock-card-scale, 1));
    box-shadow: 0 2px 8px rgba(var(--primary-rgb, 126, 34, 206), 0.04);
  }
  .stock-kan-tile:hover {
    border-color: var(--stock-accent-color, #7E22CE);
    box-shadow: 0 6px 16px rgba(var(--primary-rgb, 126, 34, 206), 0.08);
  }

  .stock-kan-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .stock-kan-sku {
    font-family: ui-monospace, monospace;
    font-size: 10px;
    font-weight: 700;
    color: var(--stock-accent-color, #7E22CE);
    background: rgba(var(--primary-rgb, 126, 34, 206), 0.08);
    padding: 2px 6px;
    border-radius: 4px;
  }
  .stock-kan-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .stock-kan-status-dot.is-healthy {
    background: var(--stock-healthy-color, #10B981);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
  .stock-kan-status-dot.is-warning {
    background: var(--stock-warning-color, #F59E0B);
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
  }
  .stock-kan-status-dot.is-critical {
    background: var(--stock-critical-color, #EF4444);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
  }

  .stock-kan-name {
    font-size: var(--stock-font-size, 12px);
    font-weight: 700;
    color: var(--stock-text-color, #2E1065);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 6px;
  }

  .stock-kan-qty-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .stock-kan-qty {
    font-family: ui-monospace, monospace;
    font-size: 14px;
    font-weight: 800;
    color: var(--stock-text-color, #2E1065);
  }
  .stock-kan-unit {
    font-size: 10px;
    color: var(--stock-text-muted, #7C3AED);
  }
  .stock-kan-val {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--stock-valuation-color, #6D28D9);
  }

  .stock-kan-bar {
    width: 100%;
    height: 4px;
    border-radius: 999px;
    background: rgba(var(--primary-rgb, 126, 34, 206), 0.1);
    overflow: hidden;
    margin-bottom: 8px;
  }
  .stock-kan-bar-fill {
    height: 100%;
    border-radius: 999px;
  }

  .stock-kan-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--stock-card-border, #E9D5FF);
    padding-top: 6px;
  }
  .stock-kan-alert {
    font-size: 9px;
    color: var(--stock-text-muted, #7C3AED);
  }
  .stock-kan-actions {
    display: flex;
    gap: 4px;
  }
  .stock-kan-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid var(--stock-card-border, #E9D5FF);
    background: var(--stock-btn-bg, #EDE9FE);
    color: var(--stock-btn-color, #581C87);
    cursor: pointer;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 4: LIST VIEW                                            */
  /* ═══════════════════════════════════════════════════════════════ */
  .stock-layout-list .stock-list-container {
    display: flex;
    flex-direction: column;
    gap: var(--stock-grid-gap, 10px);
    width: 100%;
  }

  .stock-list-row {
    background: var(--stock-card-bg, #FFFFFF);
    border: 1px solid var(--stock-card-border, #E5E7EB);
    border-radius: var(--stock-card-radius, 8px);
    padding: var(--stock-padding, 14px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    transition: all 0.2s ease;
    transform: scale(var(--stock-card-scale, 1));
  }
  .stock-list-row:hover {
    border-color: var(--stock-accent-color, #4F46E5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }

  .stock-list-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 220px;
  }
  .stock-list-sku {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--stock-accent-color, #4F46E5);
    background: rgba(79, 70, 229, 0.08);
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }
  .stock-list-title {
    font-size: var(--stock-font-size, 13px);
    font-weight: 700;
    color: var(--stock-text-color, #111827);
  }
  .stock-list-sub {
    font-size: 11px;
    color: var(--stock-text-muted, #6B7280);
  }

  .stock-list-unit-badge {
    font-size: 10px;
    font-family: ui-monospace, monospace;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.04);
    color: var(--stock-text-color, #111827);
    text-transform: uppercase;
  }

  .stock-list-qty-box {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 140px;
  }
  .stock-list-qty-num {
    font-family: ui-monospace, monospace;
    font-size: 13px;
    font-weight: 800;
    color: var(--stock-text-color, #111827);
  }
  .stock-list-bar {
    width: 100%;
    height: 5px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }
  .stock-list-bar-fill {
    height: 100%;
    border-radius: 999px;
  }

  .stock-list-val {
    font-family: ui-monospace, monospace;
    font-size: 12px;
    font-weight: 700;
    color: var(--stock-valuation-color, #7C3AED);
    background: rgba(124, 58, 237, 0.06);
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }

  .stock-list-cost {
    font-family: ui-monospace, monospace;
    font-size: 12px;
    color: var(--stock-text-color, #111827);
    white-space: nowrap;
  }

  .stock-list-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .stock-list-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 5px 9px;
    border-radius: 6px;
    border: 1px solid var(--stock-card-border, #E5E7EB);
    background: var(--stock-btn-bg, #F3F4F6);
    color: var(--stock-btn-color, #374151);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .stock-list-btn:hover {
    background: var(--stock-accent-color, #4F46E5);
    color: #FFFFFF;
    border-color: var(--stock-accent-color, #4F46E5);
  }
  .stock-list-btn.btn-entry {
    color: var(--success, #16A34A);
    background: rgba(var(--success-rgb, 22, 163, 74), 0.08);
    border-color: rgba(var(--success-rgb, 22, 163, 74), 0.2);
  }
  .stock-list-btn.btn-entry:hover {
    background: var(--success, #16A34A);
    color: #FFFFFF;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 5: CARD VIEW                                            */
  /* ═══════════════════════════════════════════════════════════════ */
  .stock-layout-card .stock-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: var(--stock-grid-gap, 20px);
    padding: 4px;
  }

  .stock-card-item {
    background: var(--stock-card-bg, #FFFFFF);
    border: 1px solid var(--stock-card-border, #E2E8F0);
    border-radius: var(--stock-card-radius, 16px);
    padding: var(--stock-padding, 18px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--stock-card-scale, 1));
    position: relative;
    overflow: hidden;
  }
  .stock-card-item:hover {
    transform: scale(calc(var(--stock-card-scale, 1) * 1.015)) translateY(-3px);
    box-shadow: 0 14px 28px -4px rgba(15, 23, 42, 0.1);
    border-color: var(--stock-accent-color, #6366F1);
  }

  .stock-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .stock-card-sku-pill {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--stock-accent-color, #6366F1);
    background: rgba(99, 102, 241, 0.08);
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }
  .stock-card-unit-pill {
    font-size: 10px;
    font-family: ui-monospace, monospace;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.05);
    color: var(--stock-text-muted, #64748B);
    text-transform: uppercase;
  }

  .stock-card-name {
    font-size: var(--stock-font-size, 14px);
    font-weight: 700;
    color: var(--stock-text-color, #0F172A);
    margin: 0 0 4px 0;
  }
  .stock-card-sub {
    font-size: 11px;
    color: var(--stock-text-muted, #64748B);
    margin: 0 0 12px 0;
  }

  .stock-card-progress {
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 10px;
    padding: 10px 12px;
    margin-bottom: 14px;
  }
  .stock-card-progress-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .stock-card-big-qty {
    font-family: ui-monospace, monospace;
    font-size: 18px;
    font-weight: 800;
    color: var(--stock-text-color, #0F172A);
  }
  .stock-card-health-label {
    font-size: 11px;
    font-weight: 700;
  }
  .stock-card-bar-bg {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }
  .stock-card-bar-fill {
    height: 100%;
    border-radius: 999px;
  }

  .stock-card-values {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 14px;
  }
  .stock-card-vbox {
    background: rgba(99, 102, 241, 0.03);
    border: 1px solid var(--stock-card-border, #E2E8F0);
    border-radius: 8px;
    padding: 8px;
  }
  .stock-card-vbox-lbl {
    font-size: 10px;
    color: var(--stock-text-muted, #64748B);
    display: block;
    margin-bottom: 2px;
  }
  .stock-card-vbox-val {
    font-family: ui-monospace, monospace;
    font-size: 12px;
    font-weight: 700;
    color: var(--stock-valuation-color, #4F46E5);
  }

  .stock-card-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    border-top: 1px solid var(--stock-card-border, #E2E8F0);
    padding-top: 10px;
  }
  .stock-card-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 6px;
    border: 1px solid var(--stock-card-border, #E2E8F0);
    background: var(--stock-btn-bg, #EEF2FF);
    color: var(--stock-btn-color, #4338CA);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .stock-card-btn:hover {
    background: var(--stock-accent-color, #6366F1);
    color: #FFFFFF;
    border-color: var(--stock-accent-color, #6366F1);
  }
  .stock-card-btn.btn-entry {
    background: rgba(var(--success-rgb, 22, 163, 74), 0.08);
    color: var(--success, #16A34A);
    border-color: rgba(var(--success-rgb, 22, 163, 74), 0.2);
  }
  .stock-card-btn.btn-entry:hover {
    background: var(--success, #16A34A);
    color: #FFFFFF;
  }
`;
