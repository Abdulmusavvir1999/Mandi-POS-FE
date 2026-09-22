/**
 * Five Dining floor layout designs, shared between DiningLayoutPreview and DiningComponent.
 *
 * 1. Checkered Floor Plan (Reference 1): Top-down architectural layout with checkered
 *    picnic diamond runners, curved booth runners, wooden chairs, coasters, and floor plants.
 * 2. Table View / Soft Neumorphic (Reference 2): Minimalist soft elevated tables with
 *    surrounding capsule/pill chair pads and central rounded-square badges (A1, A2, A3...).
 * 3. Illustrated Capacity Floor (Reference 3): Color-coded pastel table blocks (mint,
 *    blush pink, lavender) with illustrated perimeter chairs (filled when occupied, hollow
 *    when free) and guest capacity counts.
 * 4. List View: Executive tabular layout with live status pills, dwell timers, and bill totals.
 * 5. Card List View: Executive horizontal card layout with 6-tick dwell rails and action bars.
 */
export const DINING_LAYOUT_CSS = `
  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DINING FLOOR DESIGN SYSTEM — 5 DISTINCT DESIGNS                       */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /* ─── Base Stage & Canvas ────────────────────────────────────────────── */
  .dining-stage {
    background-color: var(--dining-canvas-bg, #F9F9FB);
    border-radius: 16px;
    padding: var(--dining-grid-gap, 24px);
    transition: background-color 0.25s ease, padding 0.25s ease;
    position: relative;
    width: 100%;
    min-height: 480px;
    box-sizing: border-box;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 1: CHECKERED FLOOR PLAN (Exact Recreation of Reference 1)        */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .dining-layout-checkered .chk-floor-canvas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--dining-grid-gap, 28px);
    align-items: center;
    justify-items: center;
    position: relative;
    padding: 10px;
  }

  /* Floor Plants scattered in the room */
  .chk-plant {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: radial-gradient(circle, #4ADE80 20%, var(--success, #15803D) 80%);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.4);
    position: absolute;
    pointer-events: none;
    z-index: 1;
  }
  .chk-plant::before {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background: radial-gradient(circle, #86EFAC 10%, #166534 85%);
  }

  /* Base Checkered Table Card */
  .chk-table-card {
    position: relative;
    background: var(--dining-table-bg, #FCE9DF);
    border: 1px solid var(--dining-table-border, #ECCDC0);
    border-radius: var(--dining-table-radius, 16px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transform: scale(var(--dining-table-scale, 1));
    transform-origin: center center;
    box-sizing: border-box;
  }
  .chk-table-card:hover {
    transform: scale(calc(var(--dining-table-scale, 1) * 1.03));
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  /* Banquet Table (Long 8-10 Seater) */
  .chk-table-banquet {
    width: 270px;
    height: 140px;
    padding: 12px;
  }
  .chk-table-banquet-vertical {
    width: 140px;
    height: 270px;
    padding: 12px;
  }

  /* Checkered Diamond Tablecloth Runner */
  .chk-cloth-diamond {
    position: absolute;
    width: 110px;
    height: 110px;
    transform: rotate(45deg);
    background: repeating-conic-gradient(var(--dining-accent-color, #E23B3B) 0% 25%, #FFFFFF 0% 50%) 50% / 18px 18px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    z-index: 2;
    pointer-events: none;
  }

  /* Banquet Waiter/Guest name & Time */
  .chk-guest-label {
    position: absolute;
    top: 10px;
    left: 12px;
    font-size: 11px;
    font-weight: 700;
    color: var(--dining-textColor, #334155);
    line-height: 1.2;
    z-index: 3;
    pointer-events: none;
  }
  .chk-guest-time {
    display: block;
    font-size: 10px;
    font-weight: 500;
    color: var(--dining-text-muted, #64748B);
  }

  /* Banquet Bottom/Corner Status Badge */
  .chk-status-badge {
    position: absolute;
    bottom: 10px;
    right: 12px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 800;
    color: #FFFFFF;
    background: var(--dining-color-occupied, #F97316);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    z-index: 3;
  }
  .chk-status-badge.is-free {
    background: var(--dining-color-free, #10B981);
  }
  .chk-status-badge.is-blocked {
    background: var(--dining-color-blocked, #EF4444);
  }

  /* Square Table (4 Seater) */
  .chk-table-square {
    width: 130px;
    height: 130px;
    border-radius: 14px;
  }

  /* Square Bottom Stripe / Accent bar */
  .chk-bottom-accent {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 16px;
    border-bottom-left-radius: 13px;
    border-bottom-right-radius: 13px;
    background: #3B82F6;
    opacity: 0.9;
  }
  .chk-bottom-accent.accent-yellow { background: #EAB308; }
  .chk-bottom-accent.accent-teal { background: #0D9488; }
  .chk-bottom-accent.accent-orange { background: #F97316; }

  /* Round Table (2-4 Seater) */
  .chk-table-round {
    width: 130px;
    height: 130px;
    border-radius: 50%;
  }

  /* Round Table Curved Booth / Arc Accent */
  .chk-booth-arc {
    position: absolute;
    bottom: 6px;
    left: 10px;
    right: 10px;
    height: 38px;
    border-bottom-left-radius: 65px;
    border-bottom-right-radius: 65px;
    border-bottom: 9px solid #EAB308;
    pointer-events: none;
  }
  .chk-booth-arc.arc-orange { border-bottom-color: #F97316; }
  .chk-booth-arc.arc-teal { border-bottom-color: #0D9488; }

  /* Center Napkin / Table Coaster */
  .chk-coaster {
    width: 44px;
    height: 44px;
    background: #F8A5A5;
    border: 1px dashed rgba(239, 68, 68, 0.4);
    box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.6), 0 2px 5px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 3;
    pointer-events: none;
    border-radius: 4px;
  }
  .chk-coaster-code {
    font-size: 11px;
    font-weight: 800;
    color: var(--text-main, #1E293B);
  }

  /* Wooden Chairs around perimeter */
  .chk-chair-seat {
    position: absolute;
    width: var(--dining-chair-size, 22px);
    height: 14px;
    background: var(--dining-chair-color, #C49B7A);
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
    pointer-events: none;
  }
  .chk-chair-seat::after {
    content: '';
    position: absolute;
    top: -4px;
    left: 2px;
    right: 2px;
    height: 4px;
    background: #A77C57;
    border-radius: 2px;
  }
  /* Chair positioning */
  .chk-chair-top { top: -16px; }
  .chk-chair-bottom { bottom: -16px; }
  .chk-chair-bottom::after { top: auto; bottom: -4px; }
  .chk-chair-left { left: -16px; width: 14px; height: var(--dining-chair-size, 22px); }
  .chk-chair-left::after { top: 2px; bottom: 2px; left: -4px; right: auto; width: 4px; height: auto; }
  .chk-chair-right { right: -16px; width: 14px; height: var(--dining-chair-size, 22px); }
  .chk-chair-right::after { top: 2px; bottom: 2px; right: -4px; left: auto; width: 4px; height: auto; }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 2: TABLE VIEW / SOFT NEUMORPHIC (Exact Recreation of Ref 2)     */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .dining-layout-neumorphic .neu-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  .dining-layout-neumorphic .neu-page-title {
    font-size: 20px;
    font-weight: 800;
    color: var(--text-main, #0F172A);
    letter-spacing: -0.02em;
    margin: 0;
  }

  .dining-layout-neumorphic .neu-floor-canvas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--dining-grid-gap, 24px);
    align-items: center;
    justify-items: center;
    padding: 10px;
  }

  .neu-table-card {
    position: relative;
    background: var(--dining-table-bg, #FFFFFF);
    border: 1px solid var(--dining-table-border, rgba(0, 0, 0, 0.04));
    border-radius: var(--dining-table-radius, 22px);
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.04),
      0 4px 10px -2px rgba(0, 0, 0, 0.02);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(var(--dining-table-scale, 1));
    transform-origin: center center;
    box-sizing: border-box;
  }
  .neu-table-card:hover {
    transform: scale(calc(var(--dining-table-scale, 1) * 1.03)) translateY(-2px);
    box-shadow:
      0 16px 32px -6px rgba(0, 0, 0, 0.07),
      0 6px 14px -3px rgba(0, 0, 0, 0.03);
    z-index: 10;
  }

  .neu-table-2seat { width: 120px; height: 110px; }
  .neu-table-4seat { width: 150px; height: 115px; }
  .neu-table-6seat { width: 220px; height: 120px; }
  .neu-table-8seat { width: 270px; height: 125px; }

  /* Surrounding Pill Seats */
  .neu-pill-seat {
    position: absolute;
    background: var(--dining-chair-color, #F1F5F9);
    border-radius: 9999px;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.02);
    pointer-events: none;
    transition: background-color 0.2s ease;
  }
  .neu-table-card.is-busy .neu-pill-seat {
    background: var(--dining-chair-occupied, #E2E8F0);
  }

  .neu-pill-top {
    top: -14px;
    width: 32px;
    height: 9px;
  }
  .neu-pill-bottom {
    bottom: -14px;
    width: 32px;
    height: 9px;
  }
  .neu-pill-left {
    left: -14px;
    width: 9px;
    height: 32px;
  }
  .neu-pill-right {
    right: -14px;
    width: 9px;
    height: 32px;
  }

  /* Center Rounded-Square Table Badge */
  .neu-code-badge {
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-muted, #475569);
    background: var(--bg-app, #F8FAFC);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    transition: all 0.2s ease;
  }
  .neu-code-badge.badge-red {
    background: var(--danger-light, #FEE2E2);
    color: var(--danger, #DC2626);
  }
  .neu-code-badge.badge-blue {
    background: #EFF6FF;
    color: #2563EB;
  }
  .neu-code-badge.badge-dark {
    background: var(--text-main, #1E293B);
    color: #FFFFFF;
  }

  .neu-bill-sub {
    font-size: 10px;
    font-weight: 600;
    opacity: 0.9;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 3: ILLUSTRATED CAPACITY FLOOR (Exact Recreation of Ref 3)       */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .dining-layout-illustrated .ill-floor-canvas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: var(--dining-grid-gap, 32px);
    align-items: center;
    justify-items: center;
    padding: 12px;
  }

  .ill-table-card {
    position: relative;
    border-radius: var(--dining-table-radius, 16px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--dining-padding, 14px);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--dining-table-scale, 1));
    transform-origin: center center;
    box-sizing: border-box;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  }
  .ill-table-card:hover {
    transform: scale(calc(var(--dining-table-scale, 1) * 1.04));
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
    z-index: 10;
  }

  /* Color Themes (Mint, Soft Coral/Pink, Soft Lavender) */
  .ill-theme-mint {
    background: #B2E8DC;
    color: #0F594D;
  }
  .ill-theme-pink {
    background: #FFDFD8;
    color: #D84C1C;
  }
  .ill-theme-lavender {
    background: #E8EEFF;
    color: #4338CA;
  }

  .ill-table-sm { width: 125px; height: 110px; }
  .ill-table-md { width: 145px; height: 120px; }
  .ill-table-lg { width: 220px; height: 120px; }

  .ill-table-title {
    font-size: 13px;
    font-weight: 800;
    margin-bottom: 3px;
    letter-spacing: -0.01em;
  }
  .ill-table-capacity {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 700;
    opacity: 0.95;
  }

  /* Perimeter Illustrated Chairs */
  .ill-chair-icon {
    position: absolute;
    width: var(--dining-chair-size, 20px);
    height: 18px;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ill-chair-top { top: -20px; }
  .ill-chair-bottom { bottom: -20px; }
  .ill-chair-left { left: -20px; transform: rotate(-90deg); }
  .ill-chair-right { right: -20px; transform: rotate(90deg); }

  /* SVG / Vector Chair Styling */
  .ill-chair-svg {
    width: 100%;
    height: 100%;
  }
  .ill-chair-svg path {
    fill: none;
    stroke: var(--dining-chair-color, #A0AAB0);
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  /* When chair is occupied: rich solid fill matching table accent */
  .ill-chair-icon.is-occupied .ill-chair-svg path {
    fill: var(--dining-chair-occupied, #0F594D);
    stroke: var(--dining-chair-occupied, #0F594D);
  }
  .ill-theme-pink .ill-chair-icon.is-occupied .ill-chair-svg path {
    fill: #D84C1C;
    stroke: #D84C1C;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 4: LIST VIEW (High-Density Tabular Layout)                     */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .dining-layout-list .list-table-container {
    width: 100%;
    overflow-x: auto;
    background: var(--dining-table-bg, #FFFFFF);
    border: 1px solid var(--dining-table-border, #E2E8F0);
    border-radius: var(--dining-table-radius, 12px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }

  .list-table-grid {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: var(--dining-font-size, 14px);
  }

  .list-table-grid thead th {
    background: var(--bg-app, #F8FAFC);
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted, #64748B);
    border-bottom: 1px solid var(--card-border, #E2E8F0);
    white-space: nowrap;
  }

  .list-table-grid tbody tr {
    border-bottom: 1px solid var(--card-border, #F1F5F9);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .list-table-grid tbody tr:hover {
    background-color: var(--bg-app, #F8FAFC);
  }

  .list-table-grid td {
    padding: var(--dining-padding, 12px) 16px;
    color: var(--dining-textColor, #1E293B);
    vertical-align: middle;
  }

  .list-code-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 800;
    font-family: monospace;
    font-size: 13px;
    color: var(--text-main, #0F172A);
    background: var(--card-hover, #F1F5F9);
    padding: 4px 8px;
    border-radius: 6px;
  }

  .list-section-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    background: #EDE9FE;
    color: #6D28D9;
  }

  .list-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
  }
  .list-status-pill.is-free {
    background: var(--success-light, #DCFCE7);
    color: var(--dining-color-free, #16A34A);
  }
  .list-status-pill.is-busy {
    background: #FFEDD5;
    color: var(--dining-color-occupied, #EA580C);
  }
  .list-status-pill.is-blocked {
    background: var(--danger-light, #FEE2E2);
    color: var(--dining-color-blocked, #DC2626);
  }

  .list-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    background: var(--dining-button-bg, #7E22CE);
    color: var(--dining-button-color, #FFFFFF);
    border: none;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.1s ease;
  }
  .list-action-btn:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 5: CARD LIST VIEW (Executive Structured Cards)                 */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .dining-layout-cardlist .cardlist-container {
    display: flex;
    flex-direction: column;
    gap: var(--dining-grid-gap, 16px);
  }

  .cardlist-row-card {
    background: var(--dining-table-bg, #FFFFFF);
    border: 1px solid var(--dining-table-border, #E2E8F0);
    border-radius: var(--dining-table-radius, 16px);
    padding: var(--dining-padding, 18px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    transform: scale(var(--dining-table-scale, 1));
  }
  .cardlist-row-card:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    transform: scale(calc(var(--dining-table-scale, 1) * 1.01)) translateY(-2px);
    border-color: var(--text-dim, #CBD5E1);
  }

  .cardlist-left-col {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 140px;
  }
  .cardlist-badge {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 800;
    font-family: monospace;
    color: #FFFFFF;
    background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #9333EA) 100%);
    box-shadow: 0 4px 10px rgba(var(--primary-rgb, 126, 34, 206), 0.25);
  }
  .cardlist-badge.is-free {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
  }
  .cardlist-badge.is-blocked {
    background: linear-gradient(135deg, var(--danger, #EF4444) 0%, var(--danger, #DC2626) 100%);
    box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
  }

  .cardlist-mid-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cardlist-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .cardlist-name {
    font-size: 15px;
    font-weight: 800;
    color: var(--dining-textColor, #0F172A);
  }
  .cardlist-section {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--card-hover, #F1F5F9);
    color: var(--text-muted, #475569);
  }
  .cardlist-seats {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted, #64748B);
  }

  /* 6-Tick Dwell Progress Bar */
  .cardlist-dwell-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    max-width: 220px;
    margin-top: 2px;
  }
  .cardlist-dwell-bar i {
    flex: 1;
    height: 5px;
    background: var(--card-border, #E2E8F0);
    border-radius: 2px;
  }
  .cardlist-dwell-bar i.on {
    background: var(--dining-color-occupied, #F97316);
  }

  .cardlist-right-col {
    display: flex;
    align-items: center;
    gap: 16px;
    text-align: right;
  }
  .cardlist-bill-amount {
    font-size: 17px;
    font-weight: 900;
    font-family: monospace;
    color: var(--text-main, #0F172A);
  }

  /* Status Badges & Extensions */
  .cardlist-badge.is-reserved, .chk-status-badge.is-reserved, .badge-indigo {
    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%) !important;
    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25) !important;
  }
  .cardlist-badge.is-cleaning, .chk-status-badge.is-cleaning, .badge-teal {
    background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%) !important;
    box-shadow: 0 4px 10px rgba(6, 182, 212, 0.25) !important;
  }
  .pill-reserved {
    background: #EEF2FF;
    color: #4F46E5;
  }
  .pill-cleaning {
    background: #ECFEFF;
    color: #0891B2;
  }
  .pill-waitlist {
    background: var(--bg-app, #FAF5FF);
    color: var(--primary, #7E22CE);
    border: 1px solid var(--card-border, #E9D5FF);
  }
  .timer-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 9999px;
  }
  .timer-safe { background: #ECFDF5; color: #059669; }
  .timer-warn { background: #FFFBEB; color: var(--warning, #D97706); }
  .timer-over { background: #FEF2F2; color: var(--danger, #DC2626); animation: timer-pulse 1.5s infinite; }
  @keyframes timer-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .chk-table-banquet { width: 100%; max-width: 260px; }
    .cardlist-row-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .cardlist-right-col {
      width: 100%;
      justify-content: space-between;
    }
  }
`;

