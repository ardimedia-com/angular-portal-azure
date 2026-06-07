import { Component, inject, signal, ElementRef, afterNextRender, effect, Injector, DestroyRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PortalService } from '../../services/portal.service';
import { getUserDisplayName } from '../../models/user-account.model';
import { AvatarMenuItem } from '../../models/avatar-menu.model';
import { LANGUAGE_PRESETS, LanguagePreset } from '../../models/portal-labels.model';

/**
 * Root portal shell component.
 * Ported from the fxs-portal structure in home.html (v0.2.346).
 *
 * Provides the top bar (with portal title, settings gear, and avatar menu),
 * and the main content area. Child components (panorama, blade-host,
 * notification-panel) are projected via content projection.
 *
 * Usage:
 * ```html
 * <apa-portal-layout>
 *   <apa-panorama />
 *   <apa-blade-host />
 * </apa-portal-layout>
 * ```
 */
@Component({
  selector: 'apa-portal-layout',
  standalone: true,
  template: `
    <div class="fxs-portal fxs-theme-blue">
      <!-- Top bar -->
      <header class="fxs-topbar" role="banner">
        <div style="padding-left:25px;">
          <a href="#" class="fxs-topbar-home fxs-has-hover" (click)="onHomeClick($event)">
            {{ portal.panorama().title }}
          </a>
        </div>
        <div style="display:flex; align-items:center; gap:12px; padding-right:10px;">
          <!-- Settings gear -->
          <div class="apa-settings-container" style="position:relative;">
            <button class="apa-settings-trigger fxs-has-hover"
                    (click)="portal.toggleSettings()"
                    [attr.aria-label]="portal.labels().settings"
                    [attr.title]="portal.labels().settings"
                    [attr.aria-expanded]="portal.isSettingsOpen()"
                    aria-haspopup="true">
              <i class="ti ti-settings" aria-hidden="true"></i>
            </button>
            @if (portal.isSettingsOpen()) {
              <div class="apa-settings-dropdown" role="menu">
                <!-- Appearance -->
                <div class="apa-settings-section-header">{{ portal.labels().appearance }}</div>
                <button class="apa-settings-item" role="menuitem" (click)="toggleDarkMode()">
                  <i [class]="isDark() ? 'ti ti-sun' : 'ti ti-moon'" aria-hidden="true"></i>
                  <span>{{ isDark() ? portal.labels().lightMode : portal.labels().darkMode }}</span>
                </button>
                <!-- Language -->
                <div class="apa-settings-section-header">{{ portal.labels().language }}</div>
                @for (lang of availableLanguages; track lang.code) {
                  <button class="apa-settings-item" role="menuitem"
                          [class.apa-settings-item-active]="lang.code === portal.currentLanguage()"
                          (click)="switchLanguage(lang.code)">
                    <span>{{ lang.displayName }}</span>
                    @if (lang.code === portal.currentLanguage()) {
                      <i class="ti ti-check" aria-hidden="true"></i>
                    }
                  </button>
                }
              </div>
            }
          </div>
          <!-- Avatar menu -->
          <div class="fxs-avatarmenu-tenant-container" style="position:relative;">
            <a class="apa-avatar-trigger fxs-has-hover"
               role="button"
               tabindex="0"
               [attr.aria-expanded]="portal.avatarMenu().isOpen"
               aria-haspopup="true"
               (click)="portal.toggleAvatarMenu()"
               (keydown.enter)="portal.toggleAvatarMenu()"
               (keydown.space)="portal.toggleAvatarMenu()">
              <span class="apa-avatar-initials" aria-hidden="true">{{ initials() }}</span>
              <span class="apa-avatar-info">
                <span class="apa-avatar-name">{{ displayName() }}</span>
                <span class="apa-avatar-email">{{ portal.avatarMenu().userAccount.userName }}</span>
              </span>
              <i class="ti" [class.ti-chevron-down]="!portal.avatarMenu().isOpen"
                            [class.ti-chevron-up]="portal.avatarMenu().isOpen"
                            aria-hidden="true"></i>
            </a>
            @if (portal.avatarMenu().isOpen && portal.avatarMenu().items.length > 0) {
              <div class="apa-avatar-dropdown" role="menu">
                @for (item of portal.avatarMenu().items; track item.label) {
                  <a class="apa-avatar-dropdown-item" role="menuitem" [href]="item.href"
                     (click)="onAvatarItemClick(item, $event)">
                    @if (item.icon) {
                      <i [class]="item.icon" aria-hidden="true"></i>
                    }
                    <span>{{ item.label }}</span>
                  </a>
                }
              </div>
            }
          </div>
        </div>
      </header>
      <!-- Main content area -->
      <main class="fxs-portal-content fxs-panorama"
            [style.margin-right.px]="notificationMargin()">
        <ng-content />
      </main>
      <!-- Footer -->
      <div class="fxs-portal-footer"></div>
    </div>
  `,
})
export class PortalLayoutComponent {
  protected readonly portal = inject(PortalService);
  private static readonly STORAGE_KEY = 'apa-dark-mode';
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isDark = signal(false);

  /** Available languages from the preset registry */
  protected readonly availableLanguages: { code: string; displayName: string }[] =
    Array.from(LANGUAGE_PRESETS.values()).map((p) => ({ code: p.code, displayName: p.displayName }));

  /**
   * Handle an avatar dropdown item click. If the item defines an action (e.g. open a blade), run it
   * and suppress the default link navigation; otherwise let the href navigate normally.
   */
  protected onAvatarItemClick(item: AvatarMenuItem, event: Event): void {
    this.portal.closeAvatarMenu();
    if (item.action) {
      event.preventDefault();
      item.action();
    }
  }

  constructor() {
    const stored = localStorage.getItem(PortalLayoutComponent.STORAGE_KEY);
    const dark = stored === 'true';
    this.applyTheme(dark);

    // Scroll to the last blade whenever the blade stack changes
    const injector = this.injector;
    effect(() => {
      const blades = this.portal.blades();
      if (blades.length === 0) return;
      afterNextRender(() => {
        this.scrollToLastBlade();
      }, { injector });
    });

    // Click-outside handler for dropdowns
    afterNextRender(() => {
      const handler = (event: Event) => {
        const target = event.target as Node;
        const settingsEl = this.elementRef.nativeElement.querySelector('.apa-settings-container');
        const avatarEl = this.elementRef.nativeElement.querySelector('.fxs-avatarmenu-tenant-container');
        if (settingsEl && !settingsEl.contains(target)) {
          this.portal.closeSettings();
        }
        if (avatarEl && !avatarEl.contains(target)) {
          this.portal.closeAvatarMenu();
        }
      };
      this.document.addEventListener('click', handler);

      // Escape key closes open dropdowns
      const keyHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          if (this.portal.isSettingsOpen()) {
            this.portal.closeSettings();
            event.preventDefault();
          }
          if (this.portal.avatarMenu().isOpen) {
            this.portal.closeAvatarMenu();
            event.preventDefault();
          }
        }
      };
      this.document.addEventListener('keydown', keyHandler);

      this.destroyRef.onDestroy(() => {
        this.document.removeEventListener('click', handler);
        this.document.removeEventListener('keydown', keyHandler);
      });
    }, { injector: this.injector });
  }

  protected toggleDarkMode(): void {
    const dark = !this.isDark();
    localStorage.setItem(PortalLayoutComponent.STORAGE_KEY, String(dark));
    this.applyTheme(dark);
  }

  protected switchLanguage(code: string): void {
    this.portal.setLanguage(code);
  }

  private applyTheme(dark: boolean): void {
    this.isDark.set(dark);
    this.document.documentElement.classList.toggle('apa-dark', dark);
    this.document.documentElement.classList.toggle('apa-light', !dark);
  }

  protected displayName(): string {
    const account = this.portal.avatarMenu().userAccount;
    return getUserDisplayName(account);
  }

  protected initials(): string {
    const a = this.portal.avatarMenu().userAccount;
    const f = (a.firstName || '')[0] || '';
    const l = (a.lastName || '')[0] || '';
    return (f + l).toUpperCase() || '?';
  }

  protected notificationMargin(): number {
    const notif = this.portal.notification();
    return notif.isVisible ? notif.width : 0;
  }

  protected onHomeClick(event: Event): void {
    event.preventDefault();
    this.portal.clearBlades();
  }

  private scrollToLastBlade(): void {
    const scrollContainer = this.elementRef.nativeElement.querySelector('.fxs-portal-content');
    if (!scrollContainer) return;

    const bladeElements = scrollContainer.querySelectorAll('.azureportalblade');
    if (bladeElements.length === 0) return;

    const lastBlade = bladeElements[bladeElements.length - 1] as HTMLElement;
    const scrollRect = scrollContainer.getBoundingClientRect();
    const bladeRect = lastBlade.getBoundingClientRect();

    // Blade is already fully visible — no scroll needed
    if (bladeRect.left >= scrollRect.left && bladeRect.right <= scrollRect.right) {
      return;
    }

    const currentScroll = scrollContainer.scrollLeft;
    const viewportWidth = scrollContainer.clientWidth;

    let targetScroll: number;

    if (bladeElements.length >= 2) {
      // Use the previous blade's right edge (= where the new blade starts)
      const prevBlade = bladeElements[bladeElements.length - 2] as HTMLElement;
      const prevRect = prevBlade.getBoundingClientRect();
      // Distance from viewport's left edge to the previous blade's right edge
      const delta = prevRect.right - scrollRect.left;
      targetScroll = currentScroll + delta;
    } else {
      // First blade — scroll to show it
      targetScroll = currentScroll + (bladeRect.left - scrollRect.left);
    }

    // Cap scroll movement to at most one viewport width
    targetScroll = Math.min(targetScroll, currentScroll + viewportWidth);

    scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
  }
}
