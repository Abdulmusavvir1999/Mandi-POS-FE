/**
 * The four POS dish-card designs, as one stylesheet shared by two components.
 *
 * The POS grid and the Settings preview must look identical, so they read the
 * same rules rather than keeping a copy each — two copies would drift the first
 * time either was tweaked. It is a plain exported const, which Angular's
 * compiler resolves statically, so it can be listed in a component's `styles`
 * and stays view-encapsulated per component (no global specificity fight with
 * the POS glass defaults).
 *
 * Each design is modelled on its reference artwork: the block shapes, the dot
 * grids, the arches, the glow and the two-column spec panel are all reproduced.
 * Where the artwork carries lorem filler, the card shows the real equivalent
 * (description, category, stock, portions) — a till should not print lorem.
 *
 * The card markup exposes a fixed set of parts and every design re-purposes
 * them with `order` and `display`, so one DOM serves four very different
 * layouts:
 *
 *   .dish-deco-a / -b   decorative layers (blocks, arches, dots, circles)
 *   .dish-flag          the NEW ribbon
 *   .dish-floating-avatar > .dish-photo | .food-emoji
 *   .dish-body          title, price, desc, specs, footer, cta
 */
export const POS_DESIGN_CSS = `
    /* ═══════════════════════════════════════════════════════════════════ */
    /* POS CUSTOMIZE — four dish-card designs                              */
    /* ═══════════════════════════════════════════════════════════════════ */

    /* Cards per row, from Settings. Gated to desktop so the existing
       narrow-screen ladder (3 / 2 / 1, all !important) still wins on a tablet
       or phone — a till set to 6 per row must not force 6 onto a 767px screen. */
    @media (min-width: 1024px) {
      [class*='pos-design-'] .dishes-cards-grid {
        grid-template-columns: repeat(var(--pos-cards-per-row, 4), minmax(0, 1fr));
      }
    }

    /* Sizing comes from the design's own tokens, so each template keeps the
       proportions it was drawn with. */
    [class*='pos-design-'] .dishes-cards-grid { gap: var(--pos-card-gap, 1.25rem); }

    /* Accent rotation, three-up, the way the reference artwork alternates. */
    [class*='pos-design-'] .dish-hero-card:nth-child(3n + 1) { --card-accent: var(--pos-accent1); }
    [class*='pos-design-'] .dish-hero-card:nth-child(3n + 2) { --card-accent: var(--pos-accent2); }
    [class*='pos-design-'] .dish-hero-card:nth-child(3n + 3) { --card-accent: var(--pos-accent3); }

    /* ─── Shared frame ─────────────────────────────────────────────────── */

    [class*='pos-design-'] .pos-main-content { background: var(--pos-bg-app); }

    [class*='pos-design-'] .dish-hero-card {
      position: relative;
      /* Lets a design adapt to its own width rather than the viewport's — at
         6 per row a card is half the width it is at 3, and the two-column
         panel simply does not fit. */
      container-type: inline-size;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
      isolation: isolate;
      background: var(--pos-card-bg);
      border: 1.5px solid var(--pos-card-border);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
      text-shadow: none;
      border-radius: var(--pos-card-radius, 1rem);
      box-shadow: 0 10px 26px -14px rgba(15, 23, 42, 0.3);
      transition:
        transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    [class*='pos-design-'] .dish-hero-card::before,
    [class*='pos-design-'] .dish-hero-card::after { display: none; }

    [class*='pos-design-'] .dish-hero-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px -16px var(--pos-highlight);
    }

    /* Decorative layers. Both are hidden by default; a design turns on what it
       needs. Kept out of the accessibility tree in the markup. */
    [class*='pos-design-'] .dish-deco {
      display: none;
      position: absolute;
      pointer-events: none;
      z-index: 0;
    }

    [class*='pos-design-'] .dish-flag { display: none; }

    /* Media band. The stock card floats a 4rem circle above the panel, which
       leaves an uploaded dish photo postage-stamp sized. Every design gives the
       photo the top of the card, and 'contain' keeps the product whole rather
       than cropping into it. */
    [class*='pos-design-'] .dish-floating-avatar {
      position: relative;
      z-index: 1;
      top: auto;
      left: auto;
      transform: none;
      width: 100%;
      margin: 0;
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

    [class*='pos-design-'] .dish-photo {
      position: relative;
      z-index: 2;
      max-width: 74%;
      max-height: 86%;
      object-fit: contain;
      -webkit-user-drag: none;
      user-select: none;
    }

    [class*='pos-design-'] .food-emoji {
      position: relative;
      z-index: 2;
      font-size: 3.4rem;
      line-height: 1;
    }

    /* Body. Every design re-orders these; none of them shows all of them. */
    [class*='pos-design-'] .dish-body {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      flex: 1;
      align-items: flex-start;
      text-align: left;
      gap: 0.3rem;
      padding: var(--pos-body-padding, 0.9rem);
    }

    [class*='pos-design-'] .dish-title { order: 1; margin: 0; color: var(--pos-title-color); }
    [class*='pos-design-'] .dish-price-tag { order: 2; color: var(--pos-price-color); }
    [class*='pos-design-'] .dish-desc { order: 3; }
    [class*='pos-design-'] .dish-specs { order: 4; display: none; }
    [class*='pos-design-'] .dish-card-footer { order: 5; display: none; }
    [class*='pos-design-'] .dish-cta { order: 6; }

    [class*='pos-design-'] .dish-desc {
      margin: 0;
      font-size: 0.6875rem;
      line-height: 1.5;
      color: var(--pos-body-color);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    [class*='pos-design-'] .dish-specs {
      flex-direction: column;
      gap: 0.3rem;
      width: 100%;
    }

    [class*='pos-design-'] .spec-label {
      display: block;
      font-size: 0.5625rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--card-accent);
    }

    [class*='pos-design-'] .spec-value {
      display: block;
      font-size: 0.625rem;
      line-height: 1.4;
      color: var(--pos-body-color);
    }

    /* The CTA is decorative: the whole card is the click target already, so it
       must never swallow the pointer. */
    [class*='pos-design-'] .dish-cta {
      pointer-events: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--pos-cta-height, 0.5rem) 1.15rem;
      border-radius: 999px;
      background: var(--pos-button-bg);
      color: var(--pos-button-color);
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.07em;
      white-space: nowrap;
    }

    /* Category rail chrome follows the design too. */
    [class*='pos-design-'] .cat-circle-label { color: var(--pos-nav-color); }
    [class*='pos-design-'] .cat-avatar-bubble { background: var(--card-accent, var(--pos-accent1)); }
    [class*='pos-design-'] .cat-circle-card.is-selected .cat-avatar-bubble {
      box-shadow: 0 0 0 3px var(--pos-highlight);
    }

    /* ═══ 1. NEON SPOTLIGHT ═══════════════════════════════════════════════
       Dark card. Radial glow behind the product, wavy accent squiggles and
       grey arcs scattered around it, a small accent price chip top-right, and
       a two-column lower panel: name + description + stars on the left, three
       spec rows on the right behind a vertical accent rule. */

    .pos-design-neon .dish-hero-card {
      border-radius: 16px;
      box-shadow: 0 16px 34px -16px rgba(0, 0, 0, 0.8);
    }

    .pos-design-neon .dish-floating-avatar { height: var(--pos-media-height, 9.5rem); }

    @container (max-width: 310px) {
      .pos-design-neon .dish-floating-avatar { height: calc(var(--pos-media-height, 9.5rem) * 0.78); }
      .pos-design-neon .dish-deco-a {
        top: calc(var(--pos-media-height, 9.5rem) * 0.39);
        width: 7rem;
        height: 7rem;
      }
      .pos-design-neon .dish-deco-b { height: calc(var(--pos-media-height, 9.5rem) * 0.78); }
    }

    /* The glow. */
    .pos-design-neon .dish-deco-a {
      display: block;
      left: 50%;
      top: calc(var(--pos-media-height, 9.5rem) / 2);
      transform: translate(-50%, -50%);
      width: 9rem;
      height: 9rem;
      border-radius: 999px;
      background: var(--card-accent);
      filter: blur(30px);
      opacity: 0.62;
    }

    /* Squiggle + arc confetti, drawn with gradients so no assets are needed. */
    .pos-design-neon .dish-deco-b {
      display: block;
      inset: 0 0 auto 0;
      height: var(--pos-media-height, 9.5rem);
      background-repeat: no-repeat;
      background-image:
        radial-gradient(circle at 50% 50%, transparent 58%, var(--card-accent) 59%, var(--card-accent) 72%, transparent 73%),
        radial-gradient(circle at 50% 50%, transparent 58%, rgba(148, 163, 184, 0.5) 59%, rgba(148, 163, 184, 0.5) 72%, transparent 73%),
        radial-gradient(circle at 50% 50%, transparent 58%, rgba(148, 163, 184, 0.42) 59%, rgba(148, 163, 184, 0.42) 72%, transparent 73%);
      background-size: 15px 15px, 12px 12px, 9px 9px;
      background-position: 12% 16%, 84% 26%, 22% 72%;
      opacity: 0.5;
    }

    /* Static, so the absolutely positioned price chip below resolves against
       the card. */
    .pos-design-neon .dish-body { position: static; }

    /* Price chip, top-right of the card, as in the artwork. */
    .pos-design-neon .dish-price-tag {
      position: absolute;
      top: 0.7rem;
      right: 0.7rem;
      z-index: 3;
      padding: 0.16rem 0.6rem;
      border-radius: 7px;
      background: var(--card-accent);
      color: var(--pos-price-color);
      font-size: 0.75rem;
      font-weight: 800;
    }

    /* Lower panel, lifted a shade off the card and split in two. */
    .pos-design-neon .dish-body {
      display: grid;
      grid-template-columns: 1fr 1px 0.85fr;
      grid-template-areas:
        'name  rule specs'
        'desc  rule specs'
        'stars rule specs'
        'cta   cta  cta';
      column-gap: 0.7rem;
      row-gap: 0.28rem;
      align-items: start;
      margin: 0.4rem;
      padding: 0.85rem 0.9rem 0.9rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.055);
    }

    .pos-design-neon .dish-title {
      grid-area: name;
      font-size: 0.8125rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      line-height: 1.2;
    }

    .pos-design-neon .dish-desc { grid-area: desc; -webkit-line-clamp: 2; }
    .pos-design-neon .dish-card-footer { grid-area: stars; display: flex; margin-top: 0.15rem; }
    .pos-design-neon .dish-specs { grid-area: specs; display: flex; }
    .pos-design-neon .dish-cta { grid-area: cta; width: 100%; margin-top: 0.7rem; background: var(--card-accent); }

    /* The vertical rule between the columns. */
    .pos-design-neon .dish-body::after {
      content: '';
      display: block;
      grid-row: 1 / 4;
      grid-column: 2;
      width: 2px;
      align-self: stretch;
      border-radius: 2px;
      background: var(--card-accent);
    }

    .pos-design-neon .star-icon { color: var(--card-accent); }
    .pos-design-neon .sales-count-badge { display: none; }

    /* Below this the two-column panel cannot hold a label and a value without
       truncating both, so the card falls back to one column. The reference
       layout returns as soon as there is room for it. */
    @container (max-width: 310px) {
      .pos-design-neon .dish-body {
        grid-template-columns: 1fr;
        grid-template-areas:
          'name'
          'desc'
          'stars'
          'cta';
      }

      .pos-design-neon .dish-specs,
      .pos-design-neon .dish-body::after { display: none; }

      .pos-design-neon .dish-title { font-size: 0.75rem; }
      .pos-design-neon .dish-desc { -webkit-line-clamp: 3; }
    }

    /* ═══ 2. DIAGONAL SPLIT ═══════════════════════════════════════════════
       Pale card, a solid accent block filling the right with a steep diagonal
       left edge, a dot grid on the pale side, the price set large on the
       colour, the name in the accent colour, a dark pill button, and a solid
       accent circle hanging off the bottom-left corner. */

    .pos-design-diagonal .dish-hero-card {
      border-radius: 20px;
      background: #F7F8F9;
      padding-bottom: 0.4rem;
    }

    /* The angled block. */
    .pos-design-diagonal .dish-deco-a {
      display: block;
      inset: 0 0 0 0;
      background: var(--card-accent);
      clip-path: polygon(46% 0, 100% 0, 100% 100%, 8% 100%);
    }

    /* Dot grid on the pale side. */
    .pos-design-diagonal .dish-deco-b {
      display: block;
      left: 10%;
      top: 2.6rem;
      width: 42%;
      height: calc(var(--pos-media-height, 10.5rem) * 0.62);
      background-image: radial-gradient(var(--card-accent) 1.7px, transparent 1.8px);
      background-size: 13px 13px;
    }

    .pos-design-diagonal .dish-floating-avatar { height: var(--pos-media-height, 10.5rem); }

    /* Tilted, as the artwork angles every product. */
    .pos-design-diagonal .dish-photo {
      transform: rotate(-11deg);
      filter: drop-shadow(0 16px 20px rgba(15, 23, 42, 0.3));
    }

    .pos-design-diagonal .dish-body { position: static; }

    .pos-design-diagonal .dish-price-tag {
      position: absolute;
      top: 0.85rem;
      right: 1.05rem;
      z-index: 3;
      font-size: 1.5rem;
      font-weight: 900;
      letter-spacing: -0.01em;
    }

    .pos-design-diagonal .dish-body { padding: 0.4rem 1.05rem 1rem; gap: 0.35rem; }

    .pos-design-diagonal .dish-title {
      color: var(--card-accent);
      font-size: 0.9375rem;
      font-weight: 900;
      text-transform: uppercase;
      line-height: 1.15;
      letter-spacing: 0.01em;
    }

    .pos-design-diagonal .dish-desc { -webkit-line-clamp: 2; max-width: 88%; }
    .pos-design-diagonal .dish-cta { margin-top: 0.55rem; }

    /* The circle on the corner. */
    .pos-design-diagonal .dish-hero-card > .dish-flag {
      display: block;
      position: absolute;
      left: -0.6rem;
      bottom: -0.6rem;
      z-index: 2;
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 999px;
      background: var(--card-accent);
      color: transparent;
      font-size: 0;
      overflow: hidden;
    }

    /* ═══ 3. COLOUR ARCH ══════════════════════════════════════════════════
       White card. Accent band across the top with a deeper arch inside it, a
       white NEW flag top-left, the product straddling the band's lower edge,
       the price in an accent pill, then name, description and a BUY NOW pill. */

    .pos-design-arch .dish-hero-card { border-radius: 18px; }

    /* The band. */
    .pos-design-arch .dish-deco-a {
      display: block;
      inset: 0 0 auto 0;
      height: calc(var(--pos-media-height, 11.5rem) * 0.83);
      background: var(--card-accent);
    }

    /* The arch inside it, a shade deeper. */
    .pos-design-arch .dish-deco-b {
      display: block;
      left: 50%;
      top: 1.5rem;
      transform: translateX(-50%);
      width: 64%;
      height: calc(var(--pos-media-height, 11.5rem) * 0.7);
      border-radius: 999px 999px 0 0;
      background: rgba(0, 0, 0, 0.16);
    }

    .pos-design-arch .dish-floating-avatar { height: var(--pos-media-height, 11.5rem); }

    .pos-design-arch .dish-photo {
      filter: drop-shadow(0 14px 22px rgba(15, 23, 42, 0.3));
    }

    .pos-design-arch .dish-flag {
      display: inline-flex;
      position: absolute;
      top: 0.8rem;
      left: 0.8rem;
      z-index: 3;
      padding: 0.16rem 0.55rem;
      border-radius: 6px;
      background: var(--pos-card-bg);
      color: var(--pos-title-color);
      font-size: 0.625rem;
      font-weight: 800;
      box-shadow: 0 2px 6px -2px rgba(15, 23, 42, 0.35);
    }

    .pos-design-arch .dish-body { padding: 0 1.1rem 1.1rem; gap: 0.4rem; }

    /* Price pill sits first and rides up over the band's edge. */
    .pos-design-arch .dish-price-tag {
      order: 0;
      margin-top: -1.4rem;
      padding: 0.42rem 1.15rem;
      border-radius: 999px;
      background: var(--card-accent);
      color: var(--pos-price-color);
      font-size: 1.125rem;
      font-weight: 900;
      box-shadow: 0 8px 18px -8px rgba(15, 23, 42, 0.45);
    }

    .pos-design-arch .dish-title {
      font-size: 0.9375rem;
      font-weight: 700;
      margin-top: 0.25rem;
    }

    .pos-design-arch .dish-cta {
      margin-top: 0.6rem;
      background: var(--card-accent);
      color: var(--pos-button-color);
    }

    /* ═══ 4. HALF COLOUR ══════════════════════════════════════════════════
       White upper half with a pale circle behind the product, the name on a
       white band, then a solid accent lower half carrying the description, a
       large price and a white outline pill, all centred. */

    .pos-design-split .dish-hero-card { border-radius: 12px; }

    /* The pale circle. */
    .pos-design-split .dish-deco-a {
      display: block;
      left: 50%;
      top: calc(var(--pos-media-height, 11rem) / 2);
      transform: translate(-50%, -50%);
      width: 11rem;
      height: 11rem;
      border-radius: 999px;
      background: var(--pos-bg-app);
    }

    .pos-design-split .dish-floating-avatar { height: var(--pos-media-height, 11rem); }

    .pos-design-split .dish-photo {
      filter: drop-shadow(0 16px 22px rgba(15, 23, 42, 0.26));
    }

    /* Lower half. Negative side margins let it meet the card edges while the
       body keeps its own padding. */
    .pos-design-split .dish-body {
      align-items: center;
      text-align: center;
      gap: 0.45rem;
      margin-top: 0.6rem;
      padding: 1rem 1.1rem 1.15rem;
      background: var(--card-accent);
    }

    /* The name band, white, above the colour. */
    .pos-design-split .dish-title {
      order: 0;
      width: calc(100% + 2.2rem);
      margin: -1rem -1.1rem 0.5rem;
      padding: 0.1rem 0 0.85rem;
      background: var(--pos-card-bg);
      color: var(--pos-title-color);
      font-size: 1rem;
      font-weight: 800;
      text-align: center;
    }

    .pos-design-split .dish-desc {
      order: 1;
      color: var(--pos-body-color);
      opacity: 0.92;
      text-align: center;
      -webkit-line-clamp: 3;
    }

    .pos-design-split .dish-price-tag {
      order: 2;
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--pos-price-color);
    }

    .pos-design-split .dish-cta {
      order: 3;
      margin-top: 0.35rem;
      padding: 0.42rem 1.25rem;
      background: var(--pos-button-bg);
      color: var(--pos-button-color);
    }

    /* ─── Out of stock, in every design ───────────────────────────────── */
    [class*='pos-design-'] .dish-hero-card.is-out-of-stock { opacity: 0.55; }

    [class*='pos-design-'] .out-of-stock-badge {
      position: absolute;
      top: 0.7rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 5;
      padding: 0.16rem 0.6rem;
      border-radius: 999px;
      background: #DC2626;
      color: #FFFFFF;
      font-size: 0.5625rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    @media (prefers-reduced-motion: reduce) {
      [class*='pos-design-'] .dish-hero-card { transition-duration: 0.01ms; }
      [class*='pos-design-'] .dish-hero-card:hover { transform: none; }
    }
`;
