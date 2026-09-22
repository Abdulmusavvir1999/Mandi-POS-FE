/**
 * The five Products & Menu Catalog page designs, as one stylesheet shared by
 * the catalog page and the Settings preview.
 *
 * Both must look identical, so they read the same rules rather than keeping a
 * copy each. It is a plain exported const, which Angular resolves statically,
 * so it can be listed in a component's `styles` and stays view-encapsulated
 * per component.
 *
 * The RESET block below returns the card markup to a known-empty slate and
 * each design builds up from there, so a design is never at the mercy of which
 * properties some other rule happened to set. Accents live in `--dl-accent`,
 * clear of the POS card designs' `--card-accent`, so the two settings can
 * never fight over one variable even if they ever share a page.
 *
 * One card DOM serves four of the designs, re-purposed with `order`, `display`
 * and `grid-area`:
 *
 *   .dish-deco-a / -b   decorative layers (sheen, halo, hatch)
 *   .dish-flag          the NEW ribbon (unused: no dish record says "new")
 *   .dish-floating-avatar > .dish-photo | .food-emoji
 *   .dish-body          title, price, desc, specs, footer, cta
 *   .catalog-card-actions   view / edit / delete, revealed on hover
 *
 * Menu Table is the exception: on the catalog page it keeps the existing
 * `.saas-data-table`, which already carries selection, SKU, status, the stock
 * bar and the row actions — so that design recolours the real table rather
 * than replacing it with a thinner one. The row rules further down drive the
 * Settings preview, which has no such table to show.
 */
export const DISH_LAYOUT_CSS = `
    /* ═══════════════════════════════════════════════════════════════════ */
    /* DISH PAGE DESIGN — five layouts                                     */
    /* ═══════════════════════════════════════════════════════════════════ */

    /* ─── Accent rotation, four-up ─────────────────────────────────────── */
    [class*='dish-layout-'] .dish-hero-card:nth-child(4n + 1) { --dl-accent: var(--dl-accent1); }
    [class*='dish-layout-'] .dish-hero-card:nth-child(4n + 2) { --dl-accent: var(--dl-accent2); }
    [class*='dish-layout-'] .dish-hero-card:nth-child(4n + 3) { --dl-accent: var(--dl-accent3); }
    [class*='dish-layout-'] .dish-hero-card:nth-child(4n + 4) { --dl-accent: var(--dl-accent4); }

    /* ─── The stage the catalog listing sits on ────────────────────────── */
    [class*='dish-layout-'] .catalog-stage {
      padding: 1.25rem;
      background: var(--dl-bg-app);
    }

    /* Columns come from Settings. Gated to desktop, and marked important so it
       beats the POS's own narrow-screen ladder (3 / 2 / 1, all !important) at
       a higher specificity rather than by luck of ordering. */
    @media (min-width: 1024px) {
      [class*='dish-layout-'] .dishes-cards-grid {
        grid-template-columns: repeat(var(--dl-columns, 4), minmax(0, 1fr)) !important;
      }
    }

    /* The table header strip: off unless the table design asks for it. */
    [class*='dish-layout-'] .dish-table-head { display: none; }

    /* ═══ RESET ═══════════════════════════════════════════════════════════
       Everything POS_DESIGN_CSS sets, returned to a neutral state. Each
       design below then opts back in to exactly what it needs. */

    [class*='dish-layout-'] .dish-hero-card {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      min-height: 0;
      margin: 0;
      padding: 0;
      overflow: hidden;
      isolation: isolate;
      color: inherit;
      background: var(--dl-card-bg);
      border: 1px solid var(--dl-card-border);
      border-radius: 14px;
      filter: none;
      text-shadow: none;
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
      box-shadow: 0 10px 26px -18px rgba(15, 23, 42, 0.35);
      cursor: pointer;
      transition:
        transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    [class*='dish-layout-'] .dish-hero-card::before,
    [class*='dish-layout-'] .dish-hero-card::after {
      content: none;
      display: none;
    }

    [class*='dish-layout-'] .dish-hero-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px -18px var(--dl-highlight);
    }

    [class*='dish-layout-'] .dish-deco {
      display: none;
      position: absolute;
      pointer-events: none;
      z-index: 0;
    }

    [class*='dish-layout-'] .dish-flag { display: none; }

    [class*='dish-layout-'] .dish-floating-avatar {
      position: relative;
      z-index: 1;
      top: auto;
      right: auto;
      bottom: auto;
      left: auto;
      transform: none;
      width: 100%;
      height: 9.5rem;
      margin: 0;
      padding: 0;
      border: none;
      border-radius: 0;
      background: none;
      box-shadow: none;
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;
    }

    [class*='dish-layout-'] .dish-photo {
      position: relative;
      z-index: 2;
      width: auto;
      height: auto;
      max-width: 78%;
      max-height: 88%;
      object-fit: contain;
      transform: none;
      filter: drop-shadow(0 14px 20px rgba(15, 23, 42, 0.28));
      -webkit-user-drag: none;
      user-select: none;
    }

    /* Also the stand-in icon for a dish with no photo, which is why it takes
       the title colour rather than inheriting whatever the card sets. */
    [class*='dish-layout-'] .food-emoji {
      position: relative;
      z-index: 2;
      color: var(--dl-title-color);
      font-size: 3.2rem;
      line-height: 1;
      opacity: 0.9;
    }

    [class*='dish-layout-'] .dish-body {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      flex: 1;
      align-items: flex-start;
      text-align: left;
      gap: 0.3rem;
      margin: 0;
      padding: 0.85rem 1rem 1rem;
      background: none;
      border: none;
      border-radius: 0;
    }

    [class*='dish-layout-'] .dish-body::after { content: none; display: none; }

    [class*='dish-layout-'] .dish-title {
      order: 1;
      position: static;
      width: auto;
      margin: 0;
      padding: 0;
      background: none;
      color: var(--dl-title-color);
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 800;
      line-height: 1.3;
      letter-spacing: normal;
      text-transform: none;
      text-align: left;
    }

    [class*='dish-layout-'] .dish-price-tag {
      order: 2;
      position: static;
      top: auto;
      right: auto;
      align-self: flex-start;
      margin: 0;
      padding: 0;
      border: none;
      border-radius: 0;
      background: none;
      color: var(--dl-price-color);
      font-family: inherit;
      font-size: 1.0625rem;
      font-weight: 900;
      line-height: 1.3;
      box-shadow: none;
    }

    [class*='dish-layout-'] .dish-desc {
      order: 3;
      margin: 0;
      max-width: none;
      color: var(--dl-body-color);
      font-size: 0.6875rem;
      line-height: 1.5;
      text-align: left;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    [class*='dish-layout-'] .dish-specs {
      order: 4;
      display: none;
      grid-area: auto;
      flex-direction: column;
      gap: 0.3rem;
      width: 100%;
    }

    [class*='dish-layout-'] .spec-row { display: block; grid-area: auto; }

    [class*='dish-layout-'] .spec-label {
      display: block;
      font-size: 0.5625rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--dl-accent);
    }

    [class*='dish-layout-'] .spec-value {
      display: block;
      font-size: 0.625rem;
      line-height: 1.4;
      color: var(--dl-body-color);
    }

    [class*='dish-layout-'] .dish-card-footer {
      order: 5;
      display: none;
      grid-area: auto;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      width: 100%;
      margin-top: 0.45rem;
      color: var(--dl-body-color);
      font-size: 0.625rem;
      font-weight: 700;
    }

    [class*='dish-layout-'] .star-rating { display: inline-flex; align-items: center; gap: 0.2rem; }
    [class*='dish-layout-'] .star-icon { color: var(--dl-accent); font-size: 0.8125rem; }
    [class*='dish-layout-'] .sales-count-badge { display: inline-block; }

    /* The CTA is decorative: the whole card is the click target already, so it
       must never swallow the pointer. */
    [class*='dish-layout-'] .dish-cta {
      order: 6;
      grid-area: auto;
      pointer-events: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: auto;
      margin-top: auto;
      padding: 0.5rem 1.1rem;
      border: none;
      border-radius: 999px;
      background: var(--dl-button-bg);
      color: var(--dl-button-color);
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.07em;
      white-space: nowrap;
      box-shadow: none;
    }

    /* Row actions, floated over the card. Hidden until the pointer is on the
       card so they do not compete with the dish itself, but always present in
       the DOM so keyboard focus can still reach them. */
    [class*='dish-layout-'] .catalog-card-actions {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 6;
      display: flex;
      gap: 0.3rem;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    [class*='dish-layout-'] .dish-hero-card:hover .catalog-card-actions,
    [class*='dish-layout-'] .catalog-card-actions:focus-within { opacity: 1; }

    [class*='dish-layout-'] .catalog-card-actions button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      padding: 0;
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 8px;
      background: #FFFFFF;
      color: var(--text-muted, #334155);
      cursor: pointer;
      box-shadow: 0 2px 6px -2px rgba(15, 23, 42, 0.35);
    }

    [class*='dish-layout-'] .catalog-card-actions button:hover { color: var(--text-main, #0F172A); }
    [class*='dish-layout-'] .catalog-card-actions button.is-danger:hover { color: var(--danger, #DC2626); }
    [class*='dish-layout-'] .catalog-card-actions .material-symbols-outlined { font-size: 16px; }

    /* Empty state, in the palette of whichever design is on. */
    [class*='dish-layout-'] .catalog-empty-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      padding: 3rem 1rem;
      border: 1px dashed var(--dl-card-border);
      border-radius: 14px;
      color: var(--dl-body-color);
      text-align: center;
    }

    [class*='dish-layout-'] .catalog-empty-box .empty-icon {
      font-size: 2.75rem;
      color: var(--dl-accent1);
    }

    [class*='dish-layout-'] .catalog-empty-box .empty-title {
      color: var(--dl-title-color);
      font-size: 0.9375rem;
      font-weight: 800;
    }

    [class*='dish-layout-'] .catalog-empty-box .empty-desc {
      margin: 0;
      max-width: 42ch;
      font-size: 0.75rem;
      line-height: 1.6;
    }

    /* Out of stock. Part of the reset rather than a trailing block, so a
       design that wants the badge elsewhere — the table puts it in the stock
       cell — can override it at the same specificity further down. */
    /* The badge is the whole treatment. This is the catalog, not the till:
       a sold-out dish is still a record you open, edit and restock, so it is
       never dimmed, greyed or made to look unclickable. */
    [class*='dish-layout-'] .dish-hero-card.is-out-of-stock {
      opacity: 1;
      filter: none;
      cursor: pointer;
    }

    [class*='dish-layout-'] .out-of-stock-badge {
      position: absolute;
      top: 0.7rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 5;
      padding: 0.16rem 0.6rem;
      border-radius: 999px;
      background: var(--danger, #DC2626);
      color: #FFFFFF;
      font-size: 0.5625rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    /* ═══ 1. BENTO SHOWCASE ═══════════════════════════════════════════════
       Colour-filled tiles on a dark page. The first dish is featured across
       two columns with its photo beside the copy; the rest stack photo over
       copy. Name, blurb and a white pill sit at the bottom of every tile. */

    .dish-layout-showcase .dishes-cards-grid { gap: 1.1rem; }

    .dish-layout-showcase .dish-hero-card {
      border: none;
      border-radius: 18px;
      background: var(--dl-accent);
      box-shadow: 0 14px 30px -18px rgba(0, 0, 0, 0.7);
    }

    .dish-layout-showcase .dish-hero-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 24px 46px -18px var(--dl-highlight);
    }

    /* Light from the top-right, shade at the bottom — what keeps a flat fill
       from reading as a plain rectangle. */
    .dish-layout-showcase .dish-deco-a {
      display: block;
      inset: 0;
      background:
        radial-gradient(120% 90% at 78% 6%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) 62%),
        linear-gradient(200deg, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.22));
    }

    .dish-layout-showcase .dish-floating-avatar { height: 7.6rem; padding-top: 0.5rem; }

    .dish-layout-showcase .dish-photo {
      max-width: 74%;
      max-height: 100%;
      filter: drop-shadow(0 16px 22px rgba(0, 0, 0, 0.45));
    }

    .dish-layout-showcase .food-emoji { font-size: 3.6rem; }

    .dish-layout-showcase .dish-body {
      justify-content: flex-end;
      gap: 0.35rem;
      padding: 0.35rem 1.05rem 1.05rem;
    }

    .dish-layout-showcase .dish-title {
      font-size: 1.0625rem;
      font-weight: 900;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }

    .dish-layout-showcase .dish-desc {
      -webkit-line-clamp: 3;
      max-width: 32ch;
      opacity: 0.82;
    }

    /* Price rides above the name, on a smoked chip. */
    .dish-layout-showcase .dish-price-tag {
      order: 0;
      padding: 0.18rem 0.6rem;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.3);
      background: color-mix(in srgb, var(--dl-price-bg) 55%, transparent);
      font-size: 0.8125rem;
      font-weight: 800;
    }

    /* Status and cost. A catalog card that does not say whether a dish is
       live is missing the one fact the page exists to show. */
    .dish-layout-showcase .dish-card-footer {
      display: flex;
      margin-top: 0.55rem;
      opacity: 0.95;
    }

    .dish-layout-showcase .dish-cta {
      margin-top: 0.55rem;
      padding: 0.48rem 1.15rem;
      box-shadow: 0 6px 14px -6px rgba(0, 0, 0, 0.55);
    }

    /* The featured tile. Only on a desktop grid — below that every tile is
       the same size, or a double-wide tile would eat the whole row. */
    @media (min-width: 1024px) {
      .dish-layout-showcase .dishes-cards-grid > .dish-hero-card:first-child {
        grid-column: span 2;
        flex-direction: row-reverse;
        align-items: stretch;
      }

      .dish-layout-showcase .dishes-cards-grid > .dish-hero-card:first-child .dish-floating-avatar {
        width: 54%;
        height: auto;
        padding: 0.75rem;
      }

      .dish-layout-showcase .dishes-cards-grid > .dish-hero-card:first-child .dish-photo {
        max-width: 100%;
        max-height: 92%;
      }

      .dish-layout-showcase .dishes-cards-grid > .dish-hero-card:first-child .food-emoji {
        font-size: 5rem;
      }

      .dish-layout-showcase .dishes-cards-grid > .dish-hero-card:first-child .dish-body {
        width: 46%;
        justify-content: center;
        padding: 1.3rem 1.4rem;
      }

      .dish-layout-showcase .dishes-cards-grid > .dish-hero-card:first-child .dish-title {
        font-size: 1.375rem;
      }

      .dish-layout-showcase .dishes-cards-grid > .dish-hero-card:first-child .dish-desc {
        -webkit-line-clamp: 4;
      }
    }

    /* ═══ 2. MENU TABLE ═══════════════════════════════════════════════════
       One dish per line. The card becomes a six-column grid row and the body
       and spec list collapse with display:contents, so their children become
       cells of that row rather than a box inside it. */

    .dish-layout-table {
      --dl-table-cols: 3.6rem minmax(0, 1fr) 9rem 5.5rem 7rem 6.5rem;
    }

    /* ─── On the catalog page: the real table, recoloured ─────────────── */

    .dish-layout-table .table-responsive-wrapper { background: var(--dl-card-bg); }

    .dish-layout-table .saas-data-table thead th {
      background: var(--dl-head-bg);
      color: var(--dl-head-color);
      border-bottom-color: var(--dl-head-bg);
    }

    .dish-layout-table .saas-data-table tbody tr { background: var(--dl-card-bg); }
    .dish-layout-table .saas-data-table tbody tr:nth-child(even) { background: var(--dl-row-alt-bg); }

    .dish-layout-table .saas-data-table tbody tr:hover {
      background: var(--dl-row-alt-bg);
      background: color-mix(in srgb, var(--dl-highlight) 8%, var(--dl-card-bg));
    }

    .dish-layout-table .saas-data-table tbody td { border-bottom-color: var(--dl-card-border); }

    /* ─── In the Settings preview: a stand-in built from the card DOM ─── */

    .dish-layout-table .dish-table-head {
      display: grid;
      grid-template-columns: var(--dl-table-cols);
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 1rem;
      border-radius: 12px 12px 0 0;
      background: var(--dl-head-bg);
      color: var(--dl-head-color);
      font-size: 0.625rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }

    .dish-layout-table .dish-table-head .th-num { text-align: right; }

    /* A stack of rows, not a grid of cards. */
    .dish-layout-table .dishes-cards-grid {
      display: block;
      gap: 0;
      background: var(--dl-card-bg);
      border: 1px solid var(--dl-card-border);
      border-top: none;
      border-radius: 0 0 12px 12px;
      overflow: hidden;
    }

    .dish-layout-table .dish-hero-card {
      display: grid;
      grid-template-columns: var(--dl-table-cols);
      grid-template-areas:
        'thumb name  cat stock price add'
        'thumb desc  cat stock price add';
      align-items: center;
      gap: 0 0.75rem;
      min-height: 3.6rem;
      padding: 0.5rem 1rem;
      border: none;
      border-bottom: 1px solid var(--dl-card-border);
      border-radius: 0;
      background: var(--dl-card-bg);
      box-shadow: none;
      overflow: visible;
    }

    .dish-layout-table .dish-hero-card:nth-child(even) { background: var(--dl-row-alt-bg); }
    .dish-layout-table .dish-hero-card:last-child { border-bottom: none; }

    .dish-layout-table .dish-hero-card:hover {
      transform: none;
      background: var(--dl-row-alt-bg);
      background: color-mix(in srgb, var(--dl-highlight) 8%, var(--dl-card-bg));
      box-shadow: inset 3px 0 0 var(--dl-highlight);
    }

    .dish-layout-table .dish-floating-avatar {
      grid-area: thumb;
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 9px;
      overflow: hidden;
      background: rgba(15, 23, 42, 0.06);
      background: color-mix(in srgb, var(--dl-accent) 14%, transparent);
    }

    .dish-layout-table .dish-photo { max-width: 90%; max-height: 90%; filter: none; }
    .dish-layout-table .food-emoji { font-size: 1.25rem; }

    /* The body and the spec list stop being boxes so their children land
       directly in the row's own grid. */
    .dish-layout-table .dish-body { display: contents; }
    .dish-layout-table .dish-specs { display: contents; }

    .dish-layout-table .dish-title {
      grid-area: name;
      align-self: end;
      font-size: 0.8125rem;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dish-layout-table .dish-desc {
      grid-area: desc;
      align-self: start;
      -webkit-line-clamp: 1;
      font-size: 0.625rem;
    }

    .dish-layout-table .spec-row:nth-child(1) { grid-area: cat; align-self: center; }
    .dish-layout-table .spec-row:nth-child(2) { grid-area: stock; align-self: center; }
    .dish-layout-table .spec-row:nth-child(3) { display: none; }

    /* A sold-out line shows the badge in place of the count: "0" and
       "OUT OF STOCK" in one cell would either overlap or say the same thing
       twice. */
    .dish-layout-table .dish-hero-card.is-out-of-stock .spec-row:nth-child(2) { display: none; }

    .dish-layout-table .spec-label { display: none; }

    .dish-layout-table .spec-value {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--dl-title-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dish-layout-table .spec-row:nth-child(1) .spec-value::before {
      content: '';
      display: inline-block;
      width: 0.45rem;
      height: 0.45rem;
      margin-right: 0.4rem;
      border-radius: 999px;
      background: var(--dl-accent);
      vertical-align: middle;
    }

    /* align-self is reset to flex-start for the flex layouts, which reads as
       "start" in a grid and would hang the price off the top of the line. */
    .dish-layout-table .dish-price-tag {
      grid-area: price;
      align-self: center;
      justify-self: end;
      text-align: right;
      font-size: 1rem;
      font-weight: 800;
    }

    .dish-layout-table .dish-cta {
      grid-area: add;
      justify-self: end;
      margin-top: 0;
      padding: 0.4rem 0.95rem;
      border-radius: 8px;
    }

    /* The badge shares the stock cell, pinned to the top of it, so the two
       stack instead of overlapping. */
    .dish-layout-table .out-of-stock-badge {
      position: static;
      grid-area: stock;
      align-self: center;
      justify-self: start;
      transform: none;
      padding: 0.1rem 0.4rem;
      font-size: 0.5rem;
    }

    /* ═══ 3. LIQUID GLASS ═════════════════════════════════════════════════
       Frosted cards over a colour-washed page. The blur needs something
       behind it, which is what the three accent pools on .pos-main-content
       are for; a flat background would make the card look merely tinted. */

    .dish-layout-glass .pos-main-content {
      background:
        radial-gradient(60% 55% at 12% 6%, color-mix(in srgb, var(--dl-accent1) 45%, transparent), transparent 70%),
        radial-gradient(52% 48% at 88% 16%, color-mix(in srgb, var(--dl-accent3) 40%, transparent), transparent 70%),
        radial-gradient(62% 60% at 70% 94%, color-mix(in srgb, var(--dl-accent2) 34%, transparent), transparent 72%),
        var(--dl-bg-app);
      background-attachment: local;
    }

    .dish-layout-glass .dish-hero-card {
      border-radius: 22px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border: 1px solid color-mix(in srgb, var(--dl-card-border) 38%, transparent);
      background: var(--dl-card-bg);
      background: color-mix(in srgb, var(--dl-card-bg) 42%, transparent);
      -webkit-backdrop-filter: blur(18px) saturate(150%);
      backdrop-filter: blur(18px) saturate(150%);
      box-shadow:
        0 18px 40px -22px rgba(0, 0, 0, 0.85),
        inset 0 1px 0 rgba(255, 255, 255, 0.22);
    }

    .dish-layout-glass .dish-hero-card:hover {
      transform: translateY(-5px);
      box-shadow:
        0 26px 50px -20px var(--dl-highlight),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    /* Specular highlight across the upper half. */
    .dish-layout-glass .dish-deco-a {
      display: block;
      inset: 0 0 auto 0;
      height: 58%;
      background: linear-gradient(170deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0) 72%);
    }

    /* Accent pooling behind the dish, read through the frost. */
    .dish-layout-glass .dish-deco-b {
      display: block;
      left: 50%;
      top: 4.6rem;
      transform: translate(-50%, -50%);
      width: 8.5rem;
      height: 8.5rem;
      border-radius: 999px;
      background: var(--dl-accent);
      filter: blur(34px);
      opacity: 0.55;
    }

    .dish-layout-glass .dish-floating-avatar { height: 9.4rem; }
    .dish-layout-glass .dish-body { gap: 0.35rem; padding: 0.25rem 1.05rem 1.05rem; }

    .dish-layout-glass .dish-price-tag {
      order: 0;
      padding: 0.22rem 0.7rem;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.28);
      background: var(--dl-price-bg);
      background: color-mix(in srgb, var(--dl-price-bg) 72%, transparent);
      font-size: 0.8125rem;
      font-weight: 800;
    }

    /* The footer takes up the slack so the rating strip and the button line up
       across a row whatever the description length. */
    .dish-layout-glass .dish-card-footer { display: flex; margin-top: auto; }

    .dish-layout-glass .dish-cta {
      width: 100%;
      margin-top: 0.65rem;
      background: var(--dl-button-bg);
      background: color-mix(in srgb, var(--dl-button-bg) 90%, transparent);
      box-shadow: 0 8px 18px -10px rgba(0, 0, 0, 0.7);
    }

    /* ═══ 4. NEO BRUTALIST ════════════════════════════════════════════════
       Hard outlines and an offset block shadow. Hover moves the card into
       its own shadow rather than lifting it, so it reads as a press. */

    .dish-layout-brutal .dish-hero-card {
      border: 3px solid var(--dl-card-border);
      border-radius: 6px;
      background: var(--dl-card-bg);
      box-shadow: 6px 6px 0 var(--dl-card-border);
    }

    .dish-layout-brutal .dish-hero-card:hover {
      transform: translate(4px, 4px);
      box-shadow: 2px 2px 0 var(--dl-card-border);
    }

    .dish-layout-brutal .dish-floating-avatar {
      height: 9rem;
      background: var(--dl-accent);
      border-bottom: 3px solid var(--dl-card-border);
    }

    /* Hatching over the colour panel only. */
    .dish-layout-brutal .dish-deco-a {
      display: block;
      inset: 0 0 auto 0;
      height: 9rem;
      background-image: repeating-linear-gradient(
        45deg,
        rgba(0, 0, 0, 0.08) 0 6px,
        rgba(0, 0, 0, 0) 6px 12px
      );
    }

    .dish-layout-brutal .dish-photo { max-width: 74%; max-height: 84%; filter: none; }

    .dish-layout-brutal .dish-body { gap: 0.4rem; padding: 0.8rem 0.85rem 0.85rem; }

    /* The outlined tag the style calls for, carrying the dish's category. The
       NEW ribbon stays hidden: nothing in a dish record says it is new, so
       stamping every card with it would be stating something untrue. */
    .dish-layout-brutal .dish-specs { order: -1; display: block; width: auto; }
    .dish-layout-brutal .spec-row { display: none; }

    .dish-layout-brutal .spec-row:nth-child(1) {
      display: inline-flex;
      padding: 0.08rem 0.4rem;
      border: 2px solid var(--dl-card-border);
    }

    .dish-layout-brutal .spec-label { display: none; }

    .dish-layout-brutal .spec-value {
      color: var(--dl-title-color);
      font-size: 0.5625rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .dish-layout-brutal .dish-title {
      font-size: 1rem;
      font-weight: 900;
      text-transform: uppercase;
      line-height: 1.1;
      letter-spacing: -0.01em;
    }

    .dish-layout-brutal .dish-price-tag {
      order: 0;
      padding: 0.16rem 0.55rem;
      border: 2px solid var(--dl-card-border);
      border-radius: 0;
      background: var(--dl-price-bg);
      font-size: 0.8125rem;
      font-weight: 900;
    }

    .dish-layout-brutal .dish-desc { font-weight: 500; }

    .dish-layout-brutal .dish-card-footer { display: flex; margin-top: 0.5rem; }

    /* margin-top stays auto, from the reset, so the button sits on the bottom
       edge of every card however long the description ran. */
    .dish-layout-brutal .dish-cta {
      width: 100%;
      border: 2px solid var(--dl-card-border);
      border-radius: 0;
      box-shadow: 3px 3px 0 var(--dl-card-border);
      font-weight: 900;
      text-transform: uppercase;
    }

    /* ═══ 5. EDITORIAL MINIMAL ════════════════════════════════════════════
       No boxes. A hairline rule opens each dish, the category sits above the
       name as a letterspaced kicker, the price is set large and light, and
       the action is an underlined word rather than a button. */

    .dish-layout-editorial .dishes-cards-grid { gap: 2rem 1.75rem; }

    .dish-layout-editorial .dish-hero-card {
      border: none;
      border-top: 1px solid var(--dl-card-border);
      border-radius: 0;
      background: none;
      box-shadow: none;
      padding-top: 0.9rem;
      overflow: visible;
    }

    .dish-layout-editorial .dish-hero-card:hover {
      transform: none;
      box-shadow: none;
    }

    .dish-layout-editorial .dish-hero-card:hover .dish-photo { transform: scale(1.05); }

    .dish-layout-editorial .dish-floating-avatar {
      height: 10.5rem;
      background: var(--dl-card-bg);
      overflow: hidden;
    }

    .dish-layout-editorial .dish-photo {
      max-width: 82%;
      max-height: 92%;
      filter: none;
      transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .dish-layout-editorial .dish-body { gap: 0.4rem; padding: 0.9rem 0.1rem 0; }

    /* The kicker: the category row only, as small caps. */
    .dish-layout-editorial .dish-specs { order: 0; display: block; }
    .dish-layout-editorial .spec-row { display: none; }
    .dish-layout-editorial .spec-row:nth-child(1) { display: block; }
    .dish-layout-editorial .spec-label { display: none; }

    .dish-layout-editorial .spec-value {
      font-size: 0.5625rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--dl-accent);
    }

    .dish-layout-editorial .dish-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 1.1875rem;
      font-weight: 600;
      line-height: 1.22;
      letter-spacing: -0.01em;
    }

    .dish-layout-editorial .dish-desc { font-size: 0.75rem; line-height: 1.6; }

    /* The price takes up the slack, so prices and the action link sit on one
       line across a row whatever the description length. */
    .dish-layout-editorial .dish-price-tag {
      order: 4;
      margin-top: auto;
      padding-top: 0.3rem;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 1.5rem;
      font-weight: 400;
      letter-spacing: -0.02em;
    }

    .dish-layout-editorial .dish-card-footer {
      order: 5;
      display: flex;
      margin-top: 0.5rem;
    }

    .dish-layout-editorial .dish-cta {
      order: 6;
      margin-top: 0.55rem;
      padding: 0 0 0.15rem;
      border-radius: 0;
      border-bottom: 1.5px solid var(--dl-highlight);
      background: none;
      color: var(--dl-button-color);
      font-size: 0.625rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    @media (prefers-reduced-motion: reduce) {
      [class*='dish-layout-'] .dish-hero-card { transition-duration: 0.01ms; }
      [class*='dish-layout-'] .dish-hero-card:hover { transform: none; }
      .dish-layout-editorial .dish-hero-card:hover .dish-photo { transform: none; }
    }
`;
