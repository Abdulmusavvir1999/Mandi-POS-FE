import { Injectable, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { SettingsService } from './settings.service';

const FAVICON_TYPES: Record<string, string> = {
  ico: 'image/x-icon',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

const extensionOf = (href: string) => (href.split('?')[0].split('.').pop() || '').toLowerCase();

/**
 * Applies the branding configured in Settings -> Store & Tax Engine to the page
 * shell: the window/tab title and the favicon. Both live outside the Angular
 * component tree, so they are written straight onto the document whenever the
 * settings signals change - including right after the Store tab is saved.
 *
 * The values shipped in index.html are the fallback, so an unconfigured install
 * looks exactly as it does today.
 */
@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly doc = inject(DOCUMENT);
  private readonly titleService = inject(Title);
  private readonly settings = inject(SettingsService);

  private readonly defaultTitle = this.titleService.getTitle();
  private readonly defaultFavicon = this.faviconLink().getAttribute('href') || 'favicon.ico';

  constructor() {
    effect(() => {
      this.titleService.setTitle(this.settings.appTitle() || this.defaultTitle);

      const href = this.settings.faviconUrl() || this.defaultFavicon;
      const link = this.faviconLink();
      link.setAttribute('href', href);
      // index.html declares image/x-icon; leaving that on an uploaded .png is
      // a lie some browsers act on, so the type follows the actual extension.
      link.setAttribute('type', FAVICON_TYPES[extensionOf(href)] || 'image/x-icon');
    });
  }

  /** The `<link rel="icon">` from index.html, created on the fly if it was removed. */
  private faviconLink(): HTMLLinkElement {
    const existing = this.doc.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (existing) return existing;

    const link = this.doc.createElement('link');
    link.rel = 'icon';
    this.doc.head.appendChild(link);
    return link;
  }
}
