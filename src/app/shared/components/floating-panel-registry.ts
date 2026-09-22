/**
 * Tracks the one floating filter panel that is currently open.
 *
 * The dropdown and date-picker triggers both stop their click from
 * propagating, so a click on one trigger never reaches the `document`
 * listener that would have closed the other. Without a shared registry,
 * tapping a second filter simply left two fixed-position panels stacked on
 * top of each other — which on a touchscreen, where there is no stray click
 * to dismiss them, meant the older panel covered the list the newer one was
 * meant to filter.
 *
 * Both components register here on open and deregister on close or destroy.
 */
export interface ClosableFloatingPanel {
  close(): void;
}

let current: ClosableFloatingPanel | null = null;

/** Closes whichever panel is open and records `panel` as the new one. */
export function openFloatingPanel(panel: ClosableFloatingPanel): void {
  if (current && current !== panel) current.close();
  current = panel;
}

/** Forgets `panel` if it is the one on record. Safe to call unconditionally. */
export function releaseFloatingPanel(panel: ClosableFloatingPanel): void {
  if (current === panel) current = null;
}
