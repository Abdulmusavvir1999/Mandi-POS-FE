/**
 * Row actions for the default page views.
 *
 * These are the buttons an operator sees whenever a page's customization
 * switch is off — Categories, Customers and Stock in Card View, Dining in List
 * and Card List View, Staff & Roles in List View. Before this they were five
 * different treatments, two of them loose utility classes with no surface and a
 * 28px hit area, so the default state looked less finished than any of the
 * designs it stands in for.
 *
 * One shell, six tokens. Each page maps the tokens to its own palette at the
 * bottom of this file, so a recoloured page recolours its buttons with it and
 * the shape stays identical across all five.
 *
 * Sizes are set for a till: 34px targets, never below 34px wide, and hover is
 * decoration only — every state is legible without it, for touch.
 */
export const DEFAULT_ACTION_BUTTON_CSS = `
  .dv-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .dv-btn {
    /* Fallbacks keep the button presentable even outside a mapped page. */
    --dv-accent: #7E22CE;
    --dv-on-accent: #FFFFFF;
    --dv-surface: #FFFFFF;
    --dv-border: #E2E8F0;
    --dv-text: #1E293B;
    --dv-muted: #64748B;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 34px;
    min-width: 34px;
    padding: 0 12px;
    box-sizing: border-box;
    border-radius: 10px;
    border: 1px solid var(--dv-border);
    background: var(--dv-surface);
    color: var(--dv-muted);
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.01em;
    white-space: nowrap;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    transition:
      transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.18s ease,
      background-color 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;
  }

  .dv-btn .material-symbols-outlined {
    font-size: 16px;
    line-height: 1;
  }

  /* Icon-only: square, so a lone glyph is not stranded in a wide pill. */
  .dv-btn.is-icon {
    width: 34px;
    padding: 0;
  }

  .dv-btn:hover {
    border-color: color-mix(in srgb, var(--dv-accent) 45%, var(--dv-border));
    background: color-mix(in srgb, var(--dv-accent) 8%, var(--dv-surface));
    color: var(--dv-accent);
    transform: translateY(-1px);
    box-shadow: 0 6px 14px -6px color-mix(in srgb, var(--dv-accent) 55%, transparent);
  }

  .dv-btn:active {
    transform: translateY(0) scale(0.97);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  }

  .dv-btn:focus-visible {
    outline: 2px solid var(--dv-accent);
    outline-offset: 2px;
  }

  .dv-btn:disabled,
  .dv-btn[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* The one action the row is really for — filled, so it reads first. */
  .dv-btn.is-primary {
    border-color: transparent;
    background: var(--dv-accent);
    color: var(--dv-on-accent);
    box-shadow: 0 2px 8px -3px color-mix(in srgb, var(--dv-accent) 70%, transparent);
  }

  .dv-btn.is-primary:hover {
    background: color-mix(in srgb, var(--dv-accent) 88%, #000000);
    border-color: transparent;
    color: var(--dv-on-accent);
    box-shadow: 0 8px 18px -6px color-mix(in srgb, var(--dv-accent) 70%, transparent);
  }

  /* Stock-in and other additive actions, which are not the page's accent. */
  .dv-btn.is-success {
    border-color: color-mix(in srgb, var(--success, #16A34A) 24%, transparent);
    background: color-mix(in srgb, var(--success, #16A34A) 9%, var(--dv-surface));
    color: var(--success, #15803D);
  }

  .dv-btn.is-success:hover {
    border-color: transparent;
    background: var(--success, #16A34A);
    color: #FFFFFF;
    box-shadow: 0 8px 18px -6px rgba(var(--success-rgb, 22, 163, 74), 0.55);
  }

  /* Destructive: neutral at rest so it is never the loudest thing on a card,
     unmistakable the moment it is pointed at. */
  .dv-btn.is-danger:hover {
    border-color: #FCA5A5;
    background: #FEF2F2;
    color: var(--danger, #DC2626);
    box-shadow: 0 6px 14px -6px rgba(var(--danger-rgb, 220, 38, 38), 0.45);
  }

  .dv-btn.is-danger:focus-visible {
    outline-color: var(--danger, #DC2626);
  }

  @media (prefers-reduced-motion: reduce) {
    .dv-btn {
      transition-duration: 0.01ms;
    }

    .dv-btn:hover,
    .dv-btn:active {
      transform: none;
    }
  }

  /* ─── Per-page token mapping ──────────────────────────────────────────
     Scoped to each default view's own container, so no themed design that
     shares a page picks these up. */

  .cat-card-grid .dv-btn {
    --dv-accent: var(--cat-button-bg, #7E22CE);
    --dv-on-accent: var(--cat-button-color, #FFFFFF);
    --dv-surface: var(--cat-card-bg, #FFFFFF);
    --dv-border: var(--cat-card-border, #E2E8F0);
    --dv-text: var(--cat-text-color, #1E293B);
    --dv-muted: var(--cat-text-muted, #64748B);
  }

  .cust-card-grid .dv-btn {
    --dv-accent: var(--cust-button-bg, #7E22CE);
    --dv-on-accent: var(--cust-button-color, #FFFFFF);
    --dv-surface: var(--cust-card-bg, #FFFFFF);
    --dv-border: var(--cust-card-border, #E9D5FF);
    --dv-text: var(--cust-text-color, #2E1065);
    --dv-muted: var(--cust-text-muted, #64748B);
  }

  .stock-card-grid .dv-btn {
    --dv-accent: var(--stock-accent-color, #6366F1);
    --dv-on-accent: #FFFFFF;
    --dv-surface: var(--stock-card-bg, #FFFFFF);
    --dv-border: var(--stock-card-border, #E2E8F0);
    --dv-text: var(--stock-text-color, #1E293B);
    --dv-muted: var(--stock-text-muted, #64748B);
  }

  .cardlist-container .dv-btn,
  .list-table-container .dv-btn {
    --dv-accent: var(--dining-accent-color, #7E22CE);
    --dv-on-accent: var(--dining-button-color, #FFFFFF);
    --dv-surface: var(--dining-table-bg, #FFFFFF);
    --dv-border: var(--dining-table-border, #E2E8F0);
    --dv-text: var(--dining-text-color, #1E293B);
    --dv-muted: var(--dining-text-muted, #64748B);
  }

  .staff-power-table-card .dv-btn {
    --dv-accent: var(--staff-accent-color, #7E22CE);
    --dv-on-accent: var(--staff-btn-color, #FFFFFF);
    --dv-surface: var(--staff-card-bg, #FFFFFF);
    --dv-border: var(--staff-card-border, #E2E8F0);
    --dv-text: var(--staff-text-color, #1E293B);
    --dv-muted: var(--staff-text-muted, #64748B);
  }
`;
