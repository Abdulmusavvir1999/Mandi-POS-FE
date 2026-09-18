/**
 * Eleven Sidebar Rail templates, shared between SidebarLayoutPreviewComponent
 * and the live SidebarComponent.
 *
 *  1. default        — the shipped POS rail, polished
 *  2. classic        — traditional dense ERP dock
 *  3. minimal        — airy modern SaaS rail
 *  4. compact        — narrow high-density module rail
 *  5. floating       — detached elevated rounded panel
 *  6. iconfocus      — large glyph tiles lead every row
 *  7. elegant        — premium typography + gradient sweep
 *  8. dashboardpro   — search, shortcuts, collapsible groups
 *  9. glass          — translucent blurred surface
 * 10. smart          — adaptive rail with remembered state
 * 11. collapsiblepro — collapse-gesture choreography
 *
 * Every template reuses the SAME markup, menu items, routes and permissions.
 * Colors come from ThemeService (--sidebar-bg / --sidebar-text /
 * --sidebar-active-accent / --sidebar-surface / --sidebar-border) so switching
 * template never overrides branding. Geometry and motion come from
 * SidebarLayoutService tokens (--sb-*).
 */
export const SIDEBAR_LAYOUT_CSS = `
  /* ════════════════════════════════════════════════════════════════════ */
  /* SHARED TOKEN FALLBACKS                                               */
  /* ════════════════════════════════════════════════════════════════════ */
  .sidebar-container {
    --sb-width: 240px;
    --sb-collapsed-width: 68px;
    --sb-item-h: 40px;
    --sb-item-radius: 8px;
    --sb-item-gap: 2px;
    --sb-section-gap: 16px;
    --sb-nav-pad: 8px;
    --sb-font: 13px;
    --sb-icon: 20px;
    --sb-shadow-a: 0.18;
    --sb-hover-shift: 0px;
    --sb-anim: 160ms;
    --sb-panel-radius: 0px;
    --sb-panel-inset: 0px;

    /* Motion curves shared by every template */
    --sb-ease: cubic-bezier(0.22, 1, 0.36, 1);
    --sb-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /* BASE RAIL — structure every template starts from                     */
  /* ════════════════════════════════════════════════════════════════════ */
  .sidebar-container {
    display: flex;
    flex-direction: column;
    width: var(--sb-width);
    min-width: var(--sb-width);
    max-width: var(--sb-width);
    height: 100%;
    background-color: var(--sidebar-bg, #2E1065);
    border-right: 1px solid var(--sidebar-border, #581C87);
    box-sizing: border-box;
    transition:
      width var(--sb-anim) var(--sb-ease),
      min-width var(--sb-anim) var(--sb-ease),
      max-width var(--sb-anim) var(--sb-ease),
      background-color var(--sb-anim) ease,
      box-shadow var(--sb-anim) ease,
      transform 240ms var(--sb-ease);
    position: relative;
    z-index: 30;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .sidebar-container.is-collapsed {
    width: var(--sb-collapsed-width);
    min-width: var(--sb-collapsed-width);
    max-width: var(--sb-collapsed-width);
  }

  /* ── 1. BRAND HEADER ─────────────────────────────────────────────── */
  .brand-header {
    height: 64px;
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-bottom: 1px solid color-mix(in srgb, var(--sidebar-border, #581C87) 70%, #FFFFFF 30%);
    box-sizing: border-box;
    gap: 8px;
  }

  .brand-content {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }

  .is-collapsed .brand-header {
    justify-content: center;
    padding: 0 8px;
  }

  .is-collapsed .brand-content {
    justify-content: center;
    flex: none;
  }

  .brand-logo-container {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background-color: var(--sidebar-surface, #3B0764);
    border: 1px solid var(--sidebar-border, #581C87);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sidebar-active-accent, #C084FC);
    flex-shrink: 0;
    overflow: hidden;
    transition:
      background-color var(--sb-anim) ease,
      border-color var(--sb-anim) ease,
      transform var(--sb-anim) var(--sb-spring),
      box-shadow var(--sb-anim) ease;
  }

  .brand-content:hover .brand-logo-container {
    transform: scale(1.06);
  }

  .brand-logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 7px;
  }

  .brand-logo-icon {
    color: var(--sidebar-active-accent, #C084FC);
  }

  .brand-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .brand-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--sidebar-text, #FAF5FF);
    letter-spacing: 0.02em;
    line-height: 1.2;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .brand-subtitle {
    font-size: 11px;
    font-weight: 400;
    color: var(--sidebar-text-muted, #D8B4FE);
    line-height: 1.2;
    margin-top: 2px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .collapse-toggle-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--sidebar-text-muted, #D8B4FE);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      background-color var(--sb-anim) ease,
      color var(--sb-anim) ease,
      border-color var(--sb-anim) ease,
      transform var(--sb-anim) var(--sb-spring);
    flex-shrink: 0;
    padding: 0;
  }

  .collapse-toggle-btn:hover {
    background-color: var(--sidebar-surface, #3B0764);
    color: var(--sidebar-text, #FAF5FF);
    border-color: var(--sidebar-border, #581C87);
  }

  .collapse-toggle-btn:active {
    transform: scale(0.9);
  }

  .mobile-close-btn {
    display: none;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: var(--sidebar-surface, #3B0764);
    border: 1px solid var(--sidebar-border, #581C87);
    color: var(--sidebar-text, #FAF5FF);
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
  }
  .mobile-close-btn:hover {
    background: rgba(220, 38, 38, 0.2);
    color: #F87171;
    border-color: #F87171;
  }

  /* ── 1b. QUICK ACTION STRIP (capability: quickActions) ───────────── */
  .sb-quick-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px 2px;
  }

  .sb-quick-btn {
    position: relative;
    flex: 1;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--sidebar-surface, #3B0764) 80%, transparent);
    border: 1px solid var(--sidebar-border, #581C87);
    color: var(--sidebar-text-muted, #D8B4FE);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    overflow: visible;
    transition:
      background-color var(--sb-anim) ease,
      color var(--sb-anim) ease,
      border-color var(--sb-anim) ease,
      transform var(--sb-anim) var(--sb-spring);
  }

  .sb-quick-btn:hover {
    color: var(--sidebar-text, #FAF5FF);
    border-color: var(--sidebar-active-accent, #C084FC);
    transform: translateY(-1px);
  }

  .sb-quick-btn .material-symbols-outlined {
    font-size: 17px !important;
  }

  .sb-quick-dot {
    position: absolute;
    top: 5px;
    right: 8px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--sidebar-active-accent, #C084FC);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 70%, transparent);
    animation: sbPulseDot 2.2s ease-out infinite;
  }

  /* ── 1c. MENU SEARCH (capability: hasSearch) ─────────────────────── */
  .sb-search-wrap {
    padding: 10px 12px 4px;
  }

  .sb-search-field {
    position: relative;
    display: block;
  }

  .sb-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--sidebar-text-muted, #D8B4FE);
    pointer-events: none;
    font-size: 17px !important;
    opacity: 0.8;
    transition: color var(--sb-anim) ease;
  }

  .sb-search-input {
    width: 100%;
    height: 36px;
    box-sizing: border-box;
    padding: 0 30px 0 34px;
    border-radius: 9px;
    background: color-mix(in srgb, var(--sidebar-surface, #3B0764) 75%, transparent);
    border: 1px solid var(--sidebar-border, #581C87);
    color: var(--sidebar-text, #FAF5FF);
    font-size: 12.5px;
    font-family: inherit;
    outline: none;
    transition:
      border-color var(--sb-anim) ease,
      background-color var(--sb-anim) ease,
      box-shadow var(--sb-anim) ease;
  }

  .sb-search-input::placeholder {
    color: var(--sidebar-text-muted, #D8B4FE);
    opacity: 0.65;
  }

  .sb-search-input:focus {
    border-color: var(--sidebar-active-accent, #C084FC);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 22%, transparent);
  }

  .sb-search-wrap:focus-within .sb-search-icon {
    color: var(--sidebar-active-accent, #C084FC);
  }

  .sb-search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--sidebar-text-muted, #D8B4FE);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: color var(--sb-anim) ease, background-color var(--sb-anim) ease;
  }
  .sb-search-clear:hover {
    color: var(--sidebar-text, #FAF5FF);
    background: var(--sidebar-surface, #3B0764);
  }
  .sb-search-clear .material-symbols-outlined {
    font-size: 15px !important;
  }

  .sb-empty-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 26px 12px;
    color: var(--sidebar-text-muted, #D8B4FE);
    font-size: 12px;
    text-align: center;
    animation: sbFadeIn 220ms var(--sb-ease) both;
  }
  .sb-empty-results .material-symbols-outlined {
    font-size: 26px !important;
    opacity: 0.55;
  }

  /* ── 2. NAVIGATION SCROLL AREA ───────────────────────────────────── */
  .sidebar-nav-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px var(--sb-nav-pad);
    scrollbar-width: thin;
    scrollbar-color: var(--sidebar-surface, #3B0764) transparent;
    transition: padding var(--sb-anim) var(--sb-ease);
  }

  .sidebar-nav-scroll::-webkit-scrollbar {
    width: 4px;
  }
  .sidebar-nav-scroll::-webkit-scrollbar-thumb {
    background: var(--sidebar-surface, #3B0764);
    border-radius: 4px;
  }

  .nav-groups-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--sb-section-gap);
    transition: gap var(--sb-anim) var(--sb-ease);
  }

  .nav-section {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .section-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 8px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--sidebar-section-label, #C084FC);
    padding: 4px 10px;
    margin-bottom: 2px;
    background: transparent;
    border: none;
    font-family: inherit;
    text-align: left;
    box-sizing: border-box;
  }

  button.section-label {
    cursor: pointer;
    border-radius: 6px;
    transition: background-color var(--sb-anim) ease, color var(--sb-anim) ease;
  }
  button.section-label:hover {
    background: color-mix(in srgb, var(--sidebar-surface, #3B0764) 70%, transparent);
    color: var(--sidebar-text, #FAF5FF);
  }

  .section-chevron {
    font-size: 16px !important;
    transition: transform var(--sb-anim) var(--sb-ease);
    opacity: 0.75;
  }
  .section-label.is-folded .section-chevron {
    transform: rotate(-90deg);
  }

  .section-divider-collapsed {
    height: 1px;
    background-color: var(--sidebar-border, #581C87);
    margin: 6px 4px;
  }

  .section-items {
    display: flex;
    flex-direction: column;
    gap: var(--sb-item-gap);
    transition: gap var(--sb-anim) var(--sb-ease);
  }

  .section-items.is-folded {
    display: none;
  }

  /* ── MENU ITEM ───────────────────────────────────────────────────── */
  .menu-item {
    position: relative;
    display: flex;
    align-items: center;
    height: var(--sb-item-h);
    padding: 0 10px;
    border-radius: var(--sb-item-radius);
    color: var(--sidebar-text-muted, #D8B4FE);
    text-decoration: none;
    font-size: var(--sb-font);
    font-weight: 500;
    gap: 10px;
    box-sizing: border-box;
    isolation: isolate;
    transition:
      background-color var(--sb-anim) ease,
      color var(--sb-anim) ease,
      transform var(--sb-anim) var(--sb-ease),
      box-shadow var(--sb-anim) ease,
      border-color var(--sb-anim) ease,
      padding var(--sb-anim) var(--sb-ease);
  }

  .menu-item:hover {
    background-color: var(--sidebar-surface, #3B0764);
    color: var(--sidebar-text, #FAF5FF);
    transform: translateX(var(--sb-hover-shift));
  }

  .menu-item:active {
    transform: translateX(var(--sb-hover-shift)) scale(0.985);
  }

  .menu-item:focus-visible {
    outline: 2px solid var(--sidebar-active-accent, #C084FC);
    outline-offset: 2px;
  }

  .is-collapsed .menu-item {
    justify-content: center;
    padding: 0;
    transform: none;
  }
  .is-collapsed .menu-item:hover {
    transform: none;
  }

  /* Active left indicator bar */
  .active-indicator {
    position: absolute;
    left: 0;
    top: 50%;
    height: 0;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background-color: var(--sidebar-active-accent, #C084FC);
    opacity: 0;
    transform: translateY(-50%);
    transition:
      height var(--sb-anim) var(--sb-ease),
      opacity var(--sb-anim) ease;
    pointer-events: none;
  }

  .menu-item.is-active .active-indicator {
    height: calc(100% - 12px);
    opacity: 1;
  }

  .menu-item.is-active {
    background-color: var(--sidebar-surface, #3B0764);
    color: var(--sidebar-text, #FAF5FF);
    font-weight: 600;
  }

  .menu-item.is-active .item-icon-wrapper {
    color: var(--sidebar-active-accent, #C084FC);
  }

  .item-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--sb-icon);
    height: var(--sb-icon);
    flex-shrink: 0;
    color: inherit;
    transition:
      transform var(--sb-anim) var(--sb-spring),
      color var(--sb-anim) ease,
      background-color var(--sb-anim) ease,
      box-shadow var(--sb-anim) ease,
      border-radius var(--sb-anim) ease;
  }

  .sidebar-container .item-icon-wrapper .material-symbols-outlined {
    font-size: var(--sb-icon) !important;
    line-height: 1;
  }

  .menu-item:hover .item-icon-wrapper {
    transform: scale(1.12);
  }

  .item-label {
    flex: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    transition: letter-spacing var(--sb-anim) ease, transform var(--sb-anim) var(--sb-ease);
  }

  .item-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    background-color: var(--sidebar-surface, #3B0764);
    border: 1px solid var(--sidebar-border, #581C87);
    color: var(--sidebar-active-accent, #C084FC);
    transition: all var(--sb-anim) ease;
  }

  .menu-item:hover .item-badge {
    border-color: var(--sidebar-active-accent, #C084FC);
  }

  /* Special accent for the POS billing entry */
  .pos-special-item {
    color: #FBCFE8;
  }
  .pos-special-item .item-icon-wrapper {
    color: #F472B6;
  }
  .pos-special-item.is-active {
    background: linear-gradient(90deg, rgba(244, 114, 182, 0.2), transparent);
    color: #FFFFFF;
  }
  .pos-special-item.is-active .active-indicator {
    background-color: #F472B6;
  }

  /* Rail tooltip.
     It lives directly under .sidebar-container, NOT inside a menu row: the nav
     area is an overflow:auto scroll container, so anything rendered inside a
     row is clipped at the rail's edge. A single rail-level node positioned
     from the hovered row's offset escapes that clip. */
  .rail-tooltip {
    position: absolute;
    left: calc(100% + 10px);
    background-color: var(--sidebar-surface, #3B0764);
    color: var(--sidebar-text, #FAF5FF);
    border: 1px solid var(--sidebar-border, #581C87);
    padding: 5px 9px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    z-index: 60;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    animation: sbTooltipIn 160ms var(--sb-ease) both;
  }

  /* ── 3. FOOTER ───────────────────────────────────────────────────── */
  .sidebar-footer {
    min-height: 56px;
    padding: 8px 10px;
    border-top: 1px solid color-mix(in srgb, var(--sidebar-border, #581C87) 70%, #FFFFFF 30%);
    box-sizing: border-box;
    display: flex;
    align-items: center;
  }

  .user-profile-card {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 8px;
    min-width: 0;
    text-decoration: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;
    transition: background var(--sb-anim) ease, transform var(--sb-anim) var(--sb-ease);
  }
  .user-profile-card:hover {
    background: color-mix(in srgb, var(--sidebar-surface, #3B0764) 85%, #FFFFFF 15%);
  }

  .user-avatar-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--sidebar-surface, #3B0764);
    border: 1px solid var(--sidebar-border, #581C87);
    color: var(--sidebar-active-accent, #C084FC);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    transition: transform var(--sb-anim) var(--sb-spring), box-shadow var(--sb-anim) ease;
  }

  .user-profile-card:hover .user-avatar {
    transform: scale(1.07);
  }

  .online-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--success, #16A34A);
    border: 1.5px solid var(--sidebar-bg, #2E1065);
  }

  .user-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    overflow: hidden;
  }

  .user-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--sidebar-text, #FAF5FF);
    line-height: 1.2;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .user-role {
    font-size: 10px;
    color: var(--sidebar-text-muted, #D8B4FE);
    line-height: 1.2;
    margin-top: 1px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .logout-button {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--sidebar-text-muted, #D8B4FE);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color var(--sb-anim) ease, color var(--sb-anim) ease, transform var(--sb-anim) var(--sb-spring);
    flex-shrink: 0;
    padding: 0;
  }

  .logout-button:hover {
    background-color: rgba(220, 38, 38, 0.15);
    color: #F87171;
    transform: translateX(2px);
  }

  .collapsed-logout-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .collapsed-logout-btn {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--sidebar-text-muted, #D8B4FE);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: background-color var(--sb-anim) ease, color var(--sb-anim) ease;
  }
  .collapsed-logout-btn:hover {
    background-color: rgba(220, 38, 38, 0.15);
    color: #F87171;
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /* KEYFRAMES                                                            */
  /* ════════════════════════════════════════════════════════════════════ */
  @keyframes sbFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes sbItemIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes sbTooltipIn {
    from { opacity: 0; transform: translateY(-50%) translateX(-6px); }
    to { opacity: 1; transform: translateY(-50%) translateX(0); }
  }

  @keyframes sbPulseDot {
    0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 60%, transparent); }
    70%  { box-shadow: 0 0 0 6px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }

  @keyframes sbGlow {
    0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 30%, transparent); }
    50%      { box-shadow: 0 0 14px 1px color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 32%, transparent); }
  }

  @keyframes sbBounceIcon {
    0%   { transform: translateY(0) scale(1); }
    40%  { transform: translateY(-3px) scale(1.14); }
    70%  { transform: translateY(1px) scale(1.04); }
    100% { transform: translateY(0) scale(1.1); }
  }

  @keyframes sbLabelIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @keyframes sbBarGrow {
    from { transform: translateY(-50%) scaleY(0); }
    to   { transform: translateY(-50%) scaleY(1); }
  }

  /* Staggered reveal for the first rows of every group.
     fill-mode is 'backwards' (not 'both') on purpose: a forwards fill would
     keep applying the final keyframe's transform and win over the :hover
     transform, killing every hover-travel effect below. */
  .menu-item {
    animation: sbItemIn 320ms var(--sb-ease) backwards;
  }
  .section-items .menu-item:nth-child(1) { animation-delay: 20ms; }
  .section-items .menu-item:nth-child(2) { animation-delay: 45ms; }
  .section-items .menu-item:nth-child(3) { animation-delay: 70ms; }
  .section-items .menu-item:nth-child(4) { animation-delay: 95ms; }
  .section-items .menu-item:nth-child(5) { animation-delay: 120ms; }
  .section-items .menu-item:nth-child(6) { animation-delay: 145ms; }

    /* ════════════════════════════════════════════════════════════════════ */
  /* TEMPLATE 2 — CLASSIC · traditional dense ERP dock                    */
  /* ════════════════════════════════════════════════════════════════════ */
  .sidebar-container.tpl-classic {
    box-shadow: 1px 0 0 color-mix(in srgb, var(--sidebar-border, #581C87) 85%, #FFFFFF 15%),
                3px 0 14px rgba(0, 0, 0, var(--sb-shadow-a));
  }

  .tpl-classic .sidebar-nav-scroll {
    padding: 8px 0;
  }

  .tpl-classic .nav-section {
    padding-bottom: 8px;
    border-bottom: 1px solid color-mix(in srgb, var(--sidebar-border, #581C87) 55%, transparent);
  }
  .tpl-classic .nav-section:last-child {
    border-bottom: none;
  }

  .tpl-classic .section-label {
    padding: 6px 14px;
    font-size: 10px;
    opacity: 0.9;
  }

  .tpl-classic .menu-item {
    border-radius: 0;
    padding: 0 14px;
    border-left: 4px solid transparent;
    gap: 12px;
  }

  .tpl-classic .menu-item:hover {
    border-left-color: color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 50%, transparent);
    box-shadow: inset 0 0 0 100vmax rgba(255, 255, 255, 0.035);
  }

  .tpl-classic .menu-item:hover .item-label {
    transform: translateX(3px);
  }

  .tpl-classic .menu-item:hover .item-icon-wrapper {
    transform: scale(1.08);
  }

  .tpl-classic .menu-item.is-active {
    border-left-color: var(--sidebar-active-accent, #C084FC);
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 22%, transparent),
      transparent 80%
    );
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06),
                inset 0 -1px 0 rgba(0, 0, 0, 0.22);
  }

  .tpl-classic .active-indicator {
    display: none;
  }

  .tpl-classic .is-collapsed .menu-item,
  .tpl-classic.is-collapsed .menu-item {
    padding: 0;
    border-left-width: 3px;
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /* TEMPLATE 3 — MODERN MINIMAL · airy SaaS rail                         */
  /* ════════════════════════════════════════════════════════════════════ */
  .sidebar-container.tpl-minimal {
    border-right-color: color-mix(in srgb, var(--sidebar-border, #581C87) 40%, transparent);
    box-shadow: none;
  }

  .tpl-minimal .brand-header {
    border-bottom-color: color-mix(in srgb, var(--sidebar-border, #581C87) 35%, transparent);
  }

  .tpl-minimal .sidebar-footer {
    border-top-color: color-mix(in srgb, var(--sidebar-border, #581C87) 35%, transparent);
  }

  .tpl-minimal .section-label {
    font-size: 9.5px;
    letter-spacing: 0.14em;
    opacity: 0.7;
    padding-bottom: 6px;
  }

  .tpl-minimal .menu-item {
    font-weight: 500;
  }

  .tpl-minimal .menu-item:hover {
    background-color: color-mix(in srgb, var(--sidebar-text, #FAF5FF) 7%, transparent);
    color: var(--sidebar-text, #FAF5FF);
  }

  .tpl-minimal .menu-item:hover .item-icon-wrapper {
    transform: scale(1.1);
    color: var(--sidebar-active-accent, #C084FC);
  }

  .tpl-minimal .menu-item.is-active {
    background-color: color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 14%, transparent);
    color: var(--sidebar-text, #FAF5FF);
    box-shadow: none;
  }

  /* Minimal swaps the left bar for a trailing accent dot */
  .tpl-minimal .active-indicator {
    left: auto;
    right: 12px;
    top: 50%;
    width: 6px;
    height: 0;
    border-radius: 50%;
    transform: translateY(-50%);
  }
  .tpl-minimal .menu-item.is-active .active-indicator {
    height: 6px;
    animation: sbFadeIn 240ms ease both;
  }
  .tpl-minimal.is-collapsed .active-indicator,
  .tpl-minimal .is-collapsed .active-indicator {
    display: none;
  }

  .tpl-minimal .item-badge {
    background: transparent;
    border-color: color-mix(in srgb, var(--sidebar-border, #581C87) 70%, transparent);
  }

                      /* Compact truncates labels, so its tooltip stays on even when expanded —
     see SidebarComponent.showsTooltips(). */

  /* ════════════════════════════════════════════════════════════════════ */
  /* TEMPLATE 5 — FLOATING · detached elevated panel                      */
  /* ════════════════════════════════════════════════════════════════════ */
  .sidebar-container.tpl-floating {
    margin: var(--sb-panel-inset);
    height: calc(100% - (var(--sb-panel-inset) * 2));
    border-radius: var(--sb-panel-radius);
    border: 1px solid color-mix(in srgb, var(--sidebar-border, #581C87) 80%, #FFFFFF 20%);
    box-shadow:
      0 18px 42px -12px rgba(0, 0, 0, calc(var(--sb-shadow-a) * 1.1)),
      0 6px 16px -6px rgba(0, 0, 0, calc(var(--sb-shadow-a) * 0.7)),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    /* No overflow:hidden — the rail tooltip sits outside the panel's edge.
       The panel's own background is still clipped by its border-radius. */
  }

  .tpl-floating .brand-header {
    border-bottom-color: color-mix(in srgb, var(--sidebar-border, #581C87) 50%, transparent);
  }

  .tpl-floating .menu-item {
    border: 1px solid transparent;
  }

  .tpl-floating .menu-item:hover {
    transform: translateY(-2px);
    background-color: color-mix(in srgb, var(--sidebar-surface, #3B0764) 92%, #FFFFFF 8%);
    border-color: color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 28%, transparent);
    box-shadow: 0 8px 18px -6px rgba(0, 0, 0, 0.45);
  }

  .tpl-floating .menu-item:active {
    transform: translateY(0) scale(0.99);
  }

  .tpl-floating .menu-item.is-active {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 32%, var(--sidebar-surface, #3B0764)),
      var(--sidebar-surface, #3B0764)
    );
    border-color: color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 45%, transparent);
    box-shadow:
      0 10px 22px -8px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .tpl-floating .active-indicator {
    left: 6px;
    border-radius: 3px;
  }

  .tpl-floating .sidebar-footer {
    border-top-color: color-mix(in srgb, var(--sidebar-border, #581C87) 50%, transparent);
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /* TEMPLATE 6 — ICON FOCUS · glyph tiles lead every row                 */
  /* ════════════════════════════════════════════════════════════════════ */
  .sidebar-container.tpl-iconfocus {
    box-shadow: 3px 0 16px rgba(0, 0, 0, var(--sb-shadow-a));
  }

  .tpl-iconfocus .menu-item {
    gap: 12px;
    padding: 0 10px;
    font-size: calc(var(--sb-font) - 1px);
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .tpl-iconfocus .item-icon-wrapper {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: color-mix(in srgb, var(--sidebar-surface, #3B0764) 85%, transparent);
    border: 1px solid color-mix(in srgb, var(--sidebar-border, #581C87) 75%, transparent);
    color: var(--sidebar-active-accent, #C084FC);
  }

  .tpl-iconfocus .menu-item:hover .item-icon-wrapper {
    transform: scale(1.08) rotate(-6deg);
    background: color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 22%, transparent);
    border-color: color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 55%, transparent);
  }

  .tpl-iconfocus .menu-item.is-active {
    background: color-mix(in srgb, var(--sidebar-surface, #3B0764) 92%, #FFFFFF 8%);
  }

  .tpl-iconfocus .menu-item.is-active .item-icon-wrapper {
    background: var(--sidebar-active-accent, #C084FC);
    border-color: var(--sidebar-active-accent, #C084FC);
    color: var(--sidebar-bg, #2E1065);
    animation: sbGlow 2.6s ease-in-out infinite;
  }

  .tpl-iconfocus .active-indicator {
    display: none;
  }

  .tpl-iconfocus .item-label {
    line-height: 1.15;
  }

  .tpl-iconfocus .section-label {
    font-size: 9.5px;
    opacity: 0.75;
  }

                                  /* ════════════════════════════════════════════════════════════════════ */
  /* TEMPLATE 9 — GLASS · translucent blurred surface                     */
  /* ════════════════════════════════════════════════════════════════════ */
  .sidebar-container.tpl-glass {
    margin: var(--sb-panel-inset);
    height: calc(100% - (var(--sb-panel-inset) * 2));
    border-radius: var(--sb-panel-radius);
    background-color: color-mix(in srgb, var(--sidebar-bg, #2E1065) 62%, transparent);
    background-image: linear-gradient(
      160deg,
      rgba(255, 255, 255, 0.10),
      rgba(255, 255, 255, 0.02) 42%,
      transparent
    );
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow:
      0 16px 40px -14px rgba(0, 0, 0, calc(var(--sb-shadow-a) * 1.2)),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  .tpl-glass .brand-header,
  .tpl-glass .sidebar-footer {
    border-color: rgba(255, 255, 255, 0.10);
  }

  .tpl-glass .brand-logo-container {
    background: rgba(255, 255, 255, 0.10);
    border-color: rgba(255, 255, 255, 0.18);
  }

  .tpl-glass .menu-item {
    border: 1px solid transparent;
    backdrop-filter: blur(0px);
  }

  .tpl-glass .menu-item:hover {
    background: rgba(255, 255, 255, 0.10);
    border-color: rgba(255, 255, 255, 0.20);
    box-shadow:
      0 6px 18px -8px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
  }

  .tpl-glass .menu-item.is-active {
    background: color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 26%, rgba(255, 255, 255, 0.06));
    border-color: color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 50%, transparent);
    box-shadow:
      inset 0 0 18px -4px color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 55%, transparent),
      0 8px 20px -10px rgba(0, 0, 0, 0.55);
  }

  .tpl-glass .active-indicator {
    left: 5px;
    border-radius: 3px;
  }

  .tpl-glass .item-badge {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.18);
  }

  .tpl-glass .user-avatar,
  .tpl-glass .sb-search-input,
  .tpl-glass .sb-quick-btn {
    background: rgba(255, 255, 255, 0.10);
    border-color: rgba(255, 255, 255, 0.18);
  }

  .tpl-glass .rail-tooltip {
    background: color-mix(in srgb, var(--sidebar-bg, #2E1065) 70%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-color: rgba(255, 255, 255, 0.18);
  }

                        /* ════════════════════════════════════════════════════════════════════ */
  /* REDUCED MOTION                                                       */
  /* ════════════════════════════════════════════════════════════════════ */
  @media (prefers-reduced-motion: reduce) {
    .sidebar-container,
    .sidebar-container * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /* MOBILE / TABLET OVERLAY DRAWER (< 1024px) — live rail only           */
  /* Scoped with :host(app-sidebar) so the settings preview is unaffected */
  /* ════════════════════════════════════════════════════════════════════ */
  @media (max-width: 1023px) {
    :host(app-sidebar) {
      display: none;
    }

    :host(app-sidebar.is-mobile-active) {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 1000;
    }

    :host(app-sidebar) .sidebar-container {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      margin: 0;
      height: 100%;
      border-radius: 0;
      width: 280px !important;
      min-width: 280px !important;
      max-width: 85vw !important;
      z-index: 1001;
      box-shadow: 12px 0 32px rgba(15, 23, 42, 0.55);
      transform: translateX(-100%);
      transition: transform 0.28s var(--sb-ease);
    }

    :host(app-sidebar.is-mobile-active) .sidebar-container {
      transform: translateX(0);
    }

    .mobile-sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 1000;
      animation: sbFadeIn 0.2s ease-out;
    }

    :host(app-sidebar) .mobile-close-btn {
      display: flex;
    }

    :host(app-sidebar) .collapse-toggle-btn {
      display: none;
    }
  }
`;
