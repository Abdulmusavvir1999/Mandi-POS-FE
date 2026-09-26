import { Injectable, signal } from '@angular/core';

/**
 * Registry of HTTP requests currently in flight.
 *
 * The button loading directive uses this to work out when the work a click
 * started has finished. Every request is registered on send and removed in a
 * `finalize`, so it comes off the list on success, on an API error, on a
 * network failure and on cancellation alike — which is what stops a button
 * loader from sticking.
 */
@Injectable({ providedIn: 'root' })
export class HttpActivityService {
  private nextId = 0;
  private readonly inFlight = new Set<number>();

  /** Bumped on every begin/end so watchers can re-check cheaply. */
  readonly version = signal(0);

  begin(): number {
    const id = ++this.nextId;
    this.inFlight.add(id);
    this.version.update((v) => v + 1);
    return id;
  }

  end(id: number): void {
    if (this.inFlight.delete(id)) {
      this.version.update((v) => v + 1);
    }
  }

  /** Ids in flight right now — used to tell "already running" from "just started". */
  snapshot(): Set<number> {
    return new Set(this.inFlight);
  }

  /** How many requests are running; the global loader watches this. */
  count(): number {
    return this.inFlight.size;
  }

  /** True while any of `ids` is still running. */
  anyPending(ids: Iterable<number>): boolean {
    for (const id of ids) {
      if (this.inFlight.has(id)) return true;
    }
    return false;
  }

  /** Ids that started after `before` was taken. */
  startedSince(before: Set<number>): Set<number> {
    const fresh = new Set<number>();
    for (const id of this.inFlight) {
      if (!before.has(id)) fresh.add(id);
    }
    return fresh;
  }
}
