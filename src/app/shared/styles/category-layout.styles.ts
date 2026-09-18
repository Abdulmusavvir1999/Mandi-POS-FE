/**
 * Five Category Page layout designs, shared between CategoryLayoutPreview and CategoriesComponent.
 *
 * 1. Bento Showcase (Design 1): Hero visual bento showcase with large cards, image avatars,
 *    dish counters, priority chips, and action buttons.
 * 2. Minimalist Clean Table (Design 2): Modern corporate data grid with clean borders, status tags,
 *    and inline dish statistics.
 * 3. Compact Badge Tiles (Design 3): High-density masonry tile grid with category icon badges,
 *    status chips, and quick management tags.
 * 4. List View (Design 4): Classic comprehensive tabular row layout with priority sequencing,
 *    linked dishes count, status switch, and action buttons.
 * 5. Card View (Design 5): Multi-column executive cards with image banners, descriptions,
 *    linked dish progress meters, and action footers.
 */
export const CATEGORY_LAYOUT_CSS = `
  /* ═══════════════════════════════════════════════════════════════════════ */
  /* CATEGORY CATALOG DESIGN SYSTEM — 5 DISTINCT DESIGNS                   */
  /* ═══════════════════════════════════════════════════════════════════════ */

  .category-stage {
    background-color: var(--cat-canvas-bg, #F9F9FB);
    border-radius: 16px;
    padding: var(--cat-grid-gap, 20px);
    transition: background-color 0.25s ease, padding 0.25s ease;
    width: 100%;
    box-sizing: border-box;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 1: BENTO SHOWCASE                                              */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .category-layout-showcase .cat-bento-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--cat-grid-gap, 20px);
    padding: 6px;
  }

  .cat-bento-card {
    background: var(--cat-card-bg, #FFFFFF);
    border: 1.5px solid var(--cat-card-border, #E9D5FF);
    border-radius: var(--cat-card-radius, 18px);
    padding: var(--cat-padding, 18px);
    box-shadow: 0 10px 25px -5px rgba(126, 34, 206, 0.05), 0 4px 10px -2px rgba(0, 0, 0, 0.02);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--cat-card-scale, 1));
    position: relative;
    overflow: hidden;
  }
  .cat-bento-card:hover {
    transform: scale(calc(var(--cat-card-scale, 1) * 1.02)) translateY(-2px);
    box-shadow: 0 16px 32px -4px rgba(126, 34, 206, 0.12);
    border-color: var(--cat-accent-color, #7E22CE);
  }

  .cat-bento-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  .cat-bento-avatar {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(126, 34, 206, 0.12), rgba(168, 85, 247, 0.18));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    color: var(--cat-accent-color, #7E22CE);
    overflow: hidden;
    flex-shrink: 0;
  }
  .cat-bento-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cat-bento-body {
    flex: 1;
    margin-bottom: 14px;
  }
  .cat-bento-title {
    font-size: var(--cat-font-size, 15px);
    font-weight: 800;
    color: var(--cat-text-color, #1E1B4B);
    margin: 0 0 4px;
  }
  .cat-bento-desc {
    font-size: 12px;
    color: var(--cat-text-muted, #6B7280);
    line-height: 1.45;
    margin: 0;
  }

  .cat-bento-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid var(--cat-card-border, #F1F5F9);
  }
  .cat-dish-counter-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    background: rgba(126, 34, 206, 0.08);
    color: var(--cat-accent-color, #7E22CE);
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 2: MINIMALIST CLEAN TABLE                              */
  /* ═══════════════════════════════════════════════════════════════ */
  .category-layout-clean .cat-clean-container {
    width: 100%;
    overflow-x: auto;
    background: var(--cat-card-bg, #FFFFFF);
    border: 1px solid var(--cat-card-border, #E5E7EB);
    border-radius: var(--cat-card-radius, 12px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  }

  .cat-clean-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: var(--cat-font-size, 14px);
  }
  .cat-clean-table thead th {
    background: #F9FAFB;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #4B5563;
    border-bottom: 1px solid #E5E7EB;
  }
  .cat-clean-table tbody tr {
    border-bottom: 1px solid #F3F4F6;
    transition: background-color 0.15s ease;
  }
  .cat-clean-table tbody tr:hover {
    background-color: #F8FAFC;
  }
  .cat-clean-table td {
    padding: var(--cat-padding, 14px) 16px;
    color: var(--cat-text-color, #0F172A);
    vertical-align: middle;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 3: COMPACT BADGE TILES                                 */
  /* ═══════════════════════════════════════════════════════════════ */
  .category-layout-compact .cat-compact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--cat-grid-gap, 14px);
  }

  .cat-compact-tile {
    background: var(--cat-card-bg, #FFFFFF);
    border: 1px solid var(--cat-card-border, #CBD5E1);
    border-radius: var(--cat-card-radius, 14px);
    padding: var(--cat-padding, 12px);
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .cat-compact-tile:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
    border-color: var(--cat-accent-color, #0D9488);
  }
  .cat-compact-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(13, 148, 136, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cat-accent-color, #0D9488);
    font-size: 20px;
    flex-shrink: 0;
  }
  .cat-compact-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 4: LIST VIEW (Classic Tabular)                         */
  /* ═══════════════════════════════════════════════════════════════ */
  .category-layout-list .cat-list-container {
    width: 100%;
    overflow-x: auto;
    background: var(--cat-card-bg, #FFFFFF);
    border: 1px solid var(--cat-card-border, #E2E8F0);
    border-radius: var(--cat-card-radius, 10px);
  }
  .cat-list-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: var(--cat-font-size, 14px);
  }
  .cat-list-table thead th {
    background: #F8FAFC;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748B;
    border-bottom: 1px solid #E2E8F0;
  }
  .cat-list-table tbody tr {
    border-bottom: 1px solid #F1F5F9;
    transition: background-color 0.15s ease;
  }
  .cat-list-table tbody tr:hover {
    background-color: #FAF5FF;
  }
  .cat-list-table td {
    padding: var(--cat-padding, 12px) 16px;
    color: var(--cat-text-color, #1E293B);
    vertical-align: middle;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 5: CARD VIEW                                           */
  /* ═══════════════════════════════════════════════════════════════ */
  .category-layout-card .cat-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--cat-grid-gap, 20px);
  }

  .cat-card-item {
    background: var(--cat-card-bg, #FFFFFF);
    border: 1px solid var(--cat-card-border, #E2E8F0);
    border-radius: var(--cat-card-radius, 16px);
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    transition: all 0.25s ease;
    transform: scale(var(--cat-card-scale, 1));
  }
  .cat-card-item:hover {
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
    transform: scale(calc(var(--cat-card-scale, 1) * 1.02)) translateY(-3px);
  }

  .cat-card-banner {
    height: 100px;
    background: linear-gradient(135deg, #7E22CE 0%, #C084FC 100%);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cat-card-banner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cat-card-icon-floater {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #FFFFFF;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: var(--cat-accent-color, #7E22CE);
    position: absolute;
    bottom: -16px;
    left: 18px;
  }

  .cat-card-content {
    padding: var(--cat-padding, 16px);
    padding-top: 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cat-card-name {
    font-size: 15px;
    font-weight: 800;
    color: var(--cat-text-color, #0F172A);
    margin: 0 0 6px;
  }
  .cat-card-brief {
    font-size: 12px;
    color: var(--cat-text-muted, #64748B);
    line-height: 1.4;
    margin: 0 0 12px;
  }

  /* Shared Action & Status Elements */
  .cat-status-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
  }
  .cat-status-chip.is-active {
    background: #DCFCE7;
    color: var(--cat-status-active, #16A34A);
  }
  .cat-status-chip.is-draft {
    background: #FFEDD5;
    color: var(--cat-status-draft, #EA580C);
  }

  .cat-action-btn {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    background: var(--cat-button-bg, #7E22CE);
    color: var(--cat-button-color, #FFFFFF);
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: opacity 0.2s ease;
  }
  .cat-action-btn:hover {
    opacity: 0.92;
  }
`;
