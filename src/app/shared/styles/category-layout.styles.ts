/**
 * Five Category Page layout designs, shared between CategoryLayoutPreview and CategoriesComponent.
 *
 * 1. Bento Showcase (Design 1): Hero visual bento showcase with large cards, image avatars,
 *    dish counters, priority chips, and action buttons.
 * 2. Minimalist Clean Table (Design 2): Modern corporate data grid with clean borders, status tags,
 *    and inline dish statistics.
 * 3. Compact Badge Tiles (Design 3): High-density masonry tile grid with category icon badges,
 *    status chips, and quick management tags.
 * 4. List View (Design 4): Classic comprehensive row layout with priority sequencing,
 *    linked dishes count, status switch, and action buttons.
 * 5. Card View (Design 5): Multi-column executive cards with image banners, descriptions,
 *    linked dish progress meters, and action footers.
 *
 * ── Conventions both consumers rely on ────────────────────────────────────
 * Media wells (.cat-*-icon / -thumb / -avatar) are fixed squares that centre a
 * Material glyph and let an <img> fill them edge to edge, so a category with a
 * photo and one without occupy identical space.
 *
 * Action buttons: the FIRST button in an actions group is the primary action
 * and is filled with --cat-button-bg; any following button is a ghost. That
 * ordering holds in both the live page (Edit then Delete) and the preview.
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
  /* SHARED PRIMITIVES                                                      */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /* Media well — one rule drives every design's icon/photo slot. */
  .cat-bento-icon,
  .cat-clean-thumb,
  .cat-compact-icon,
  .cat-list-thumb,
  .cat-card-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    box-sizing: border-box;
    background: color-mix(in srgb, var(--cat-accent-color, #7E22CE) 12%, transparent);
    color: var(--cat-accent-color, #7E22CE);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease;
  }

  .cat-bento-icon img,
  .cat-clean-thumb img,
  .cat-compact-icon img,
  .cat-list-thumb img,
  .cat-card-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Action buttons — shared shell, per-design sizing below. */
  .cat-bento-btn,
  .cat-clean-btn,
  .cat-compact-btn,
  .cat-list-btn,
  .cat-card-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 32px;
    min-width: 32px;
    padding: 0 10px;
    border-radius: 9px;
    border: 1px solid transparent;
    background: var(--cat-button-bg, #7E22CE);
    color: var(--cat-button-color, #FFFFFF);
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    box-sizing: border-box;
    box-shadow: 0 2px 6px -2px rgba(15, 23, 42, 0.28);
    transition:
      transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.18s ease,
      background-color 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;
  }

  .cat-bento-btn:hover,
  .cat-clean-btn:hover,
  .cat-compact-btn:hover,
  .cat-list-btn:hover,
  .cat-card-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px -4px rgba(15, 23, 42, 0.32);
  }

  .cat-bento-btn:active,
  .cat-clean-btn:active,
  .cat-compact-btn:active,
  .cat-list-btn:active,
  .cat-card-btn:active {
    transform: translateY(0) scale(0.97);
  }

  .cat-bento-btn:focus-visible,
  .cat-clean-btn:focus-visible,
  .cat-compact-btn:focus-visible,
  .cat-list-btn:focus-visible,
  .cat-card-btn:focus-visible {
    outline: 2px solid var(--cat-accent-color, #7E22CE);
    outline-offset: 2px;
  }

  /* Every button after the first is a secondary/ghost action (Delete, Tune). */
  .cat-bento-actions .cat-bento-btn:not(:first-child),
  .cat-compact-actions .cat-compact-btn:not(:first-child),
  .cat-list-actions .cat-list-btn:not(:first-child),
  .cat-card-actions .cat-card-btn:not(:first-child),
  .cat-clean-btn:not(:first-child) {
    width: 32px;
    padding: 0;
    background: transparent;
    border-color: var(--cat-card-border, #E2E8F0);
    color: var(--cat-text-muted, #64748B);
    box-shadow: none;
  }

  .cat-bento-actions .cat-bento-btn:not(:first-child):hover,
  .cat-compact-actions .cat-compact-btn:not(:first-child):hover,
  .cat-list-actions .cat-list-btn:not(:first-child):hover,
  .cat-card-actions .cat-card-btn:not(:first-child):hover,
  .cat-clean-btn:not(:first-child):hover {
    background: #FEF2F2;
    border-color: #FCA5A5;
    color: #DC2626;
    box-shadow: 0 4px 10px -4px rgba(220, 38, 38, 0.4);
  }

  /* Status pills */
  .cat-bento-status,
  .cat-compact-status,
  .cat-clean-badge,
  .cat-list-status,
  .cat-card-badge-top {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 9px;
    border-radius: 9999px;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.02em;
    line-height: 1;
    white-space: nowrap;
    background: color-mix(in srgb, var(--cat-status-active, #16A34A) 14%, transparent);
    color: var(--cat-status-active, #16A34A);
  }

  .cat-bento-status.is-draft,
  .cat-compact-status.is-draft,
  .cat-clean-badge.is-draft,
  .cat-list-status.is-draft,
  .cat-card-badge-top.is-draft {
    background: color-mix(in srgb, var(--cat-status-draft, #EA580C) 16%, transparent);
    color: var(--cat-status-draft, #EA580C);
  }

  /* Dish-count metrics */
  .cat-bento-dish-pill,
  .cat-compact-count,
  .cat-clean-metric,
  .cat-list-count {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1;
    color: var(--cat-accent-color, #7E22CE);
    white-space: nowrap;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* DESIGN 1: BENTO SHOWCASE                                              */
  /* ═══════════════════════════════════════════════════════════════════════ */
  .category-layout-showcase .cat-bento-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: var(--cat-grid-gap, 20px);
    padding: 4px;
  }

  .cat-bento-card {
    background: var(--cat-card-bg, #FFFFFF);
    border: 1.5px solid var(--cat-card-border, #E9D5FF);
    border-radius: var(--cat-card-radius, 18px);
    padding: var(--cat-padding, 18px);
    box-shadow: 0 10px 25px -12px rgba(126, 34, 206, 0.22);
    display: flex;
    flex-direction: column;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--cat-card-scale, 1));
    position: relative;
  }
  .cat-bento-card:hover {
    transform: scale(calc(var(--cat-card-scale, 1) * 1.02)) translateY(-3px);
    box-shadow: 0 18px 34px -14px rgba(126, 34, 206, 0.34);
    border-color: var(--cat-accent-color, #7E22CE);
  }
  .cat-bento-card:hover .cat-bento-icon {
    transform: scale(1.06) rotate(-3deg);
  }

  .cat-bento-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .cat-bento-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
  }
  .cat-bento-icon .material-symbols-outlined {
    font-size: 26px !important;
  }

  .cat-bento-badges {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .cat-bento-dish-pill {
    padding: 4px 9px;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--cat-accent-color, #7E22CE) 10%, transparent);
  }
  .cat-bento-dish-pill .material-symbols-outlined {
    font-size: 13px !important;
  }

  .cat-bento-body {
    flex: 1;
    margin-bottom: 14px;
  }
  .cat-bento-title {
    font-size: var(--cat-font-size, 15px);
    font-weight: 800;
    color: var(--cat-text-color, #1E1B4B);
    margin: 0 0 5px;
    line-height: 1.3;
  }
  .cat-bento-desc {
    font-size: 12px;
    color: var(--cat-text-muted, #6B7280);
    line-height: 1.5;
    margin: 0;
  }

  .cat-bento-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--cat-card-border, #F1F5F9);
  }
  .cat-bento-order {
    font-size: 11px;
    font-weight: 700;
    color: var(--cat-text-muted, #94A3B8);
    letter-spacing: 0.02em;
  }
  .cat-bento-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .cat-bento-btn .material-symbols-outlined {
    font-size: 15px !important;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 2: MINIMALIST CLEAN TABLE                              */
  /* ═══════════════════════════════════════════════════════════════ */
  .category-layout-clean .cat-clean-table-card {
    width: 100%;
    overflow-x: auto;
    background: var(--cat-card-bg, #FFFFFF);
    border: 1px solid var(--cat-card-border, #E5E7EB);
    border-radius: var(--cat-card-radius, 12px);
    box-shadow: 0 6px 18px -12px rgba(15, 23, 42, 0.25);
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
    font-size: 10.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748B;
    border-bottom: 1px solid #E5E7EB;
    white-space: nowrap;
  }
  .cat-clean-row {
    border-bottom: 1px solid #F3F4F6;
    transition: background-color 0.15s ease;
  }
  .cat-clean-row:last-child {
    border-bottom: none;
  }
  .cat-clean-row:hover {
    background-color: color-mix(in srgb, var(--cat-accent-color, #7E22CE) 5%, transparent);
  }
  .cat-clean-table td {
    padding: var(--cat-padding, 14px) 16px;
    color: var(--cat-text-color, #0F172A);
    vertical-align: middle;
  }

  /* The name cell: fixed square thumb beside a two-line identity block.
     The thumb must never stretch to the column width. */
  .cat-clean-name-cell {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
  }
  .cat-clean-thumb {
    width: 38px;
    height: 38px;
    border-radius: 10px;
  }
  .cat-clean-thumb .material-symbols-outlined {
    font-size: 20px !important;
  }
  .cat-clean-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--cat-text-color, #0F172A);
    line-height: 1.3;
  }
  .cat-clean-id {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--cat-text-muted, #94A3B8);
    letter-spacing: 0.02em;
  }
  .cat-clean-desc {
    font-size: 12px;
    color: var(--cat-text-muted, #64748B);
    line-height: 1.5;
    display: block;
  }
  .cat-clean-metric .material-symbols-outlined {
    font-size: 14px !important;
  }
  .cat-clean-btn .material-symbols-outlined {
    font-size: 16px !important;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 3: COMPACT BADGE TILES                                 */
  /* ═══════════════════════════════════════════════════════════════ */
  .category-layout-compact .cat-compact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(212px, 1fr));
    gap: var(--cat-grid-gap, 14px);
  }

  .cat-compact-tile {
    background: var(--cat-card-bg, #FFFFFF);
    border: 1px solid var(--cat-card-border, #CBD5E1);
    border-radius: var(--cat-card-radius, 14px);
    padding: var(--cat-padding, 12px);
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 2px 8px -4px rgba(15, 23, 42, 0.18);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--cat-card-scale, 1));
  }
  .cat-compact-tile:hover {
    box-shadow: 0 10px 20px -10px rgba(15, 23, 42, 0.3);
    transform: scale(calc(var(--cat-card-scale, 1) * 1.02)) translateY(-2px);
    border-color: var(--cat-accent-color, #0D9488);
  }

  .cat-compact-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .cat-compact-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
  }
  .cat-compact-icon .material-symbols-outlined {
    font-size: 20px !important;
  }

  .cat-compact-name {
    font-size: var(--cat-font-size, 13px);
    font-weight: 800;
    color: var(--cat-text-color, #0F172A);
    line-height: 1.35;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .cat-compact-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 9px;
    border-top: 1px solid var(--cat-card-border, #F1F5F9);
  }
  .cat-compact-count .material-symbols-outlined {
    font-size: 13px !important;
  }
  .cat-compact-actions {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .cat-compact-btn {
    height: 28px;
    min-width: 28px;
    padding: 0 8px;
    border-radius: 8px;
  }
  .cat-compact-actions .cat-compact-btn:not(:first-child) {
    width: 28px;
  }
  .cat-compact-btn .material-symbols-outlined {
    font-size: 14px !important;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 4: LIST VIEW                                           */
  /* ═══════════════════════════════════════════════════════════════ */
  .category-layout-list .cat-list-container {
    width: 100%;
    background: var(--cat-card-bg, #FFFFFF);
    border: 1px solid var(--cat-card-border, #E2E8F0);
    border-radius: var(--cat-card-radius, 10px);
    overflow: hidden;
    box-shadow: 0 6px 18px -12px rgba(15, 23, 42, 0.22);
  }

  /* Flex, not grid: the live page renders a leading checkbox that the
     preview omits, so the row must tolerate a differing child count. */
  .cat-list-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: var(--cat-padding, 12px) 16px;
    transition: background-color 0.15s ease;
  }
  .cat-list-row + .cat-list-row {
    border-top: 1px solid #F1F5F9;
  }
  .cat-list-row:hover {
    background-color: color-mix(in srgb, var(--cat-accent-color, #7E22CE) 5%, transparent);
  }

  .cat-list-seq {
    width: 26px;
    flex-shrink: 0;
    text-align: center;
    font-size: 11px;
    font-weight: 800;
    color: var(--cat-text-muted, #94A3B8);
  }

  .cat-list-thumb {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }
  .cat-list-thumb .material-symbols-outlined {
    font-size: 22px !important;
  }

  .cat-list-info {
    flex: 1;
    min-width: 0;
  }
  .cat-list-name {
    font-size: var(--cat-font-size, 13.5px);
    font-weight: 700;
    color: var(--cat-text-color, #1E293B);
    line-height: 1.3;
  }
  .cat-list-desc {
    font-size: 11.5px;
    color: var(--cat-text-muted, #64748B);
    line-height: 1.45;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cat-list-count {
    width: 132px;
    flex-shrink: 0;
  }
  .cat-list-count .material-symbols-outlined {
    font-size: 15px !important;
  }

  /* The status pill sits in an unclassed wrapper div in both templates. */
  .cat-list-row > div:not([class]) {
    width: 84px;
    flex-shrink: 0;
  }

  .cat-list-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    flex-shrink: 0;
  }
  .cat-list-btn {
    width: 32px;
    padding: 0;
  }
  .cat-list-btn .material-symbols-outlined {
    font-size: 16px !important;
  }

  @media (max-width: 900px) {
    .cat-list-row {
      flex-wrap: wrap;
    }
    .cat-list-info {
      flex-basis: 100%;
      order: 5;
    }
    .cat-list-desc {
      white-space: normal;
    }
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* DESIGN 5: CARD VIEW                                           */
  /* ═══════════════════════════════════════════════════════════════ */
  .category-layout-card .cat-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
    gap: var(--cat-grid-gap, 20px);
  }

  .cat-card-item {
    background: var(--cat-card-bg, #FFFFFF);
    border: 1px solid var(--cat-card-border, #E2E8F0);
    border-radius: var(--cat-card-radius, 16px);
    overflow: hidden;
    box-shadow: 0 8px 20px -12px rgba(15, 23, 42, 0.28);
    display: flex;
    flex-direction: column;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(var(--cat-card-scale, 1));
  }
  .cat-card-item:hover {
    box-shadow: 0 18px 34px -14px rgba(15, 23, 42, 0.32);
    transform: scale(calc(var(--cat-card-scale, 1) * 1.02)) translateY(-3px);
    border-color: var(--cat-accent-color, #7E22CE);
  }

  .cat-card-banner {
    height: 84px;
    background: linear-gradient(
      135deg,
      var(--cat-accent-color, #7E22CE) 0%,
      color-mix(in srgb, var(--cat-accent-color, #7E22CE) 55%, #FFFFFF) 100%
    );
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 10px 12px;
    box-sizing: border-box;
  }
  .cat-card-badge-top {
    background: rgba(255, 255, 255, 0.92);
    color: var(--cat-status-active, #16A34A);
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
  }
  .cat-card-badge-top.is-draft {
    background: rgba(255, 255, 255, 0.92);
    color: var(--cat-status-draft, #EA580C);
  }

  /* Floating avatar straddling the banner edge. */
  .cat-card-avatar {
    position: absolute;
    bottom: -26px;
    right: 16px;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: var(--cat-card-bg, #FFFFFF);
    border: 3px solid var(--cat-card-bg, #FFFFFF);
    box-shadow: 0 6px 16px -6px rgba(15, 23, 42, 0.45);
  }
  .cat-card-avatar .material-symbols-outlined {
    font-size: 28px !important;
  }
  .cat-card-item:hover .cat-card-avatar {
    transform: scale(1.06);
  }

  .cat-card-content {
    padding: var(--cat-padding, 16px);
    padding-top: 14px;
    padding-right: 82px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .cat-card-title {
    font-size: var(--cat-font-size, 15px);
    font-weight: 800;
    color: var(--cat-text-color, #0F172A);
    margin: 0 0 5px;
    line-height: 1.3;
  }
  .cat-card-desc {
    font-size: 12px;
    color: var(--cat-text-muted, #64748B);
    line-height: 1.5;
    margin: 0 0 14px;
    flex: 1;
  }

  .cat-card-progress {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cat-card-progress-bar {
    height: 6px;
    width: 100%;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--cat-text-muted, #94A3B8) 20%, transparent);
    overflow: hidden;
  }
  .cat-card-progress-fill {
    height: 100%;
    border-radius: 9999px;
    background: var(--cat-accent-color, #7E22CE);
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .cat-card-progress-text {
    font-size: 10.5px;
    font-weight: 700;
    color: var(--cat-text-muted, #64748B);
    letter-spacing: 0.02em;
  }

  .cat-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 11px var(--cat-padding, 16px);
    border-top: 1px solid var(--cat-card-border, #F1F5F9);
    background: color-mix(in srgb, var(--cat-accent-color, #7E22CE) 4%, transparent);
  }
  .cat-card-seq-pill {
    font-size: 10.5px;
    font-weight: 800;
    color: var(--cat-text-muted, #64748B);
    letter-spacing: 0.02em;
  }
  .cat-card-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .cat-card-btn .material-symbols-outlined {
    font-size: 14px !important;
  }

  /* Padding only clears the avatar while it is actually beside the text. */
  @media (max-width: 420px) {
    .cat-card-content {
      padding-right: var(--cat-padding, 16px);
      padding-top: 34px;
    }
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* LEGACY ALIASES                                                */
  /* Kept so any older markup still renders sanely.                */
  /* ═══════════════════════════════════════════════════════════════ */
  .cat-status-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 9px;
    border-radius: 9999px;
    font-size: 10.5px;
    font-weight: 800;
  }
  .cat-status-chip.is-active {
    background: color-mix(in srgb, var(--cat-status-active, #16A34A) 14%, transparent);
    color: var(--cat-status-active, #16A34A);
  }
  .cat-status-chip.is-draft {
    background: color-mix(in srgb, var(--cat-status-draft, #EA580C) 16%, transparent);
    color: var(--cat-status-draft, #EA580C);
  }

  @media (prefers-reduced-motion: reduce) {
    .category-stage *,
    .category-stage *::before {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
