import { Injectable, inject } from '@angular/core';
import { PortalService } from './portal.service';
import { BladeDefinition, createBlade, AddBladeEventArgs } from '../models/blade.model';
import { BladeRegistry } from './blade-registry.service';
import { DEFAULT_LABELS } from '../models/portal-labels.model';

/**
 * Blade stack management service.
 * Replaces v0.2.346's AreaBlades class.
 *
 * Manages the blade stack: adding, removing, cascade-closing,
 * and panorama visibility toggling.
 *
 * When a BladeRegistry is available, metadata (title, width) from the
 * registry is used as defaults — explicit arguments take precedence.
 */
@Injectable({ providedIn: 'root' })
export class BladeService {
  private readonly portal = inject(PortalService);
  private readonly registry = inject(BladeRegistry);

  /**
   * Unsaved-changes guard registry: blade path -> predicate returning true when the blade has
   * unsaved edits. Populated by apa-blade-detail (from the projected NgForm). Consulted before a
   * blade is closed/replaced or the page is left, so the user can confirm discarding changes.
   * Message can be localised via PortalLabels.unsavedChangesConfirm; the navigation flow is
   * synchronous, so a synchronous window.confirm is used.
   */
  private readonly dirtyChecks = new Map<string, () => boolean>();

  /** Optional override for the confirmation message (defaults to the de-CH label). */
  unsavedChangesMessage = DEFAULT_LABELS.unsavedChangesConfirm;

  constructor() {
    // Native browser guard when the whole page/tab is closed or reloaded with unsaved edits.
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', (e: BeforeUnloadEvent) => {
        if (this.anyDirty()) {
          e.preventDefault();
          e.returnValue = '';
        }
      });
    }
  }

  /** Register a blade's unsaved-changes predicate (called by apa-blade-detail). */
  registerDirtyCheck(path: string, isDirty: () => boolean): void {
    this.dirtyChecks.set(path.toLowerCase(), isDirty);
  }

  /** Remove a blade's unsaved-changes predicate (called when the detail is destroyed). */
  unregisterDirtyCheck(path: string): void {
    this.dirtyChecks.delete(path.toLowerCase());
  }

  private isPathDirty(path: string): boolean {
    const check = this.dirtyChecks.get(path.toLowerCase());
    try {
      return check ? check() === true : false;
    } catch {
      return false;
    }
  }

  private anyDirty(): boolean {
    for (const path of this.dirtyChecks.keys()) {
      if (this.isPathDirty(path)) return true;
    }
    return false;
  }

  /**
   * Returns true if it's OK to proceed with removing the given blade paths: none of them is dirty,
   * or the user confirmed discarding the changes. Shows one confirmation regardless of how many
   * dirty blades are affected.
   */
  private mayDiscard(removedPaths: string[]): boolean {
    const anyDirty = removedPaths.some((p) => this.isPathDirty(p));
    if (!anyDirty) return true;
    return typeof window === 'undefined' ? true : window.confirm(this.unsavedChangesMessage);
  }

  /** Drop dirty-check entries for paths that are no longer open. */
  private pruneDirtyChecks(): void {
    const open = new Set(this.portal.blades().map((b) => b.path));
    for (const path of [...this.dirtyChecks.keys()]) {
      if (!open.has(path)) this.dirtyChecks.delete(path);
    }
  }

  /**
   * Set the first blade (e.g., when opening a top-level item from a tile).
   * Clears all existing blades, hides panorama, and adds the new blade.
   *
   * Ported from AreaBlades.setFirstBlade() in v0.2.346.
   */
  setFirstBlade(path: string, title: string = '', width?: number): BladeDefinition {
    const existing = this.portal.blades();
    if (existing.length > 0 && !this.mayDiscard(existing.map((b) => b.path))) {
      return existing[0];
    }
    this.dirtyChecks.clear();
    this.portal.blades.set([]);
    const entry = this.registry.getEntry(path);
    const blade = createBlade(
      path.toLowerCase(),
      title || entry?.title || path,
      width ?? entry?.width ?? 315,
    );
    this.portal.blades.set([blade]);
    return blade;
  }

  /**
   * Add a blade to the stack. If senderPath is provided, all blades
   * after the sender are removed first (cascade close).
   *
   * Ported from AreaBlades.addBlade() in v0.2.346.
   */
  addBlade(path: string, senderPath: string = '', title: string = '', width?: number, params?: Record<string, string>): BladeDefinition | undefined {
    if (!path) return undefined;

    const normalizedPath = path.toLowerCase();

    // Cascade close first: remove blades after the sender
    // This ensures a blade at the same path gets recreated with new params
    if (senderPath) {
      if (!this.clearChild(senderPath)) return undefined;
    }

    // Check if blade already exists (after cascade close)
    const existing = this.portal.blades().find((b) => b.path === normalizedPath);
    if (existing) {
      return existing;
    }

    const entry = this.registry.getEntry(normalizedPath);
    const blade = createBlade(
      normalizedPath,
      title || entry?.title || normalizedPath,
      width ?? entry?.width ?? 315,
      params,
    );
    this.portal.blades.update((b) => [...b, blade]);
    return blade;
  }

  /**
   * Open a blade from a navigation event (e.g., tile click, nav item click).
   * Wraps addBlade with AddBladeEventArgs for compatibility.
   */
  openBlade(args: AddBladeEventArgs, title: string = '', width?: number): BladeDefinition | undefined {
    return this.addBlade(args.path, args.pathSender, title, width);
  }

  /**
   * Clear all blades. Shows panorama if appropriate.
   * Ported from AreaBlades.clearAll() in v0.2.346.
   */
  clearAll(): void {
    if (!this.mayDiscard(this.portal.blades().map((b) => b.path))) return;
    this.portal.blades.set([]);
    this.dirtyChecks.clear();
  }

  /**
   * Remove a specific blade and all blades to its right.
   * This is what happens when a blade is closed.
   *
   * Ported from AreaBlades.clearPath() in v0.2.346.
   */
  clearPath(path: string): boolean {
    const normalizedPath = path.toLowerCase();
    const blades = this.portal.blades();
    const index = blades.findIndex((b) => b.path === normalizedPath);

    if (index >= 0) {
      if (!this.mayDiscard(blades.slice(index).map((b) => b.path))) return false;
      this.portal.blades.set(blades.slice(0, index));
      this.pruneDirtyChecks();
    } else {
      // Check notification area
      const notif = this.portal.notification();
      if (notif.path === normalizedPath) {
        this.portal.hideNotification();
      }
    }
    return true;
  }

  /**
   * Remove all blades AFTER a given path (keeps the blade itself).
   * Used for cascade close when a blade opens a child.
   *
   * Ported from AreaBlades.clearChild() in v0.2.346.
   */
  clearChild(path: string): boolean {
    if (!path) return true;

    const normalizedPath = path.toLowerCase();
    const blades = this.portal.blades();
    const index = blades.findIndex((b) => b.path === normalizedPath);

    if (index >= 0) {
      if (!this.mayDiscard(blades.slice(index + 1).map((b) => b.path))) return false;
      this.portal.blades.set(blades.slice(0, index + 1));
      this.pruneDirtyChecks();
    }
    return true;
  }

  /**
   * Remove blades at and beyond a specific 1-based level.
   * Ported from AreaBlades.clearLevel() in v0.2.346.
   */
  clearLevel(level: number): void {
    const adjustedLevel = level <= 0 ? 1 : level;
    const blades = this.portal.blades();
    if (adjustedLevel <= blades.length) {
      if (!this.mayDiscard(blades.slice(adjustedLevel - 1).map((b) => b.path))) return;
      this.portal.blades.set(blades.slice(0, adjustedLevel - 1));
      this.pruneDirtyChecks();
    }
  }

  /**
   * Remove only the last (rightmost) blade.
   * Ported from AreaBlades.clearLastLevel() in v0.2.346.
   */
  clearLastLevel(): void {
    const blades = this.portal.blades();
    if (blades.length > 0) {
      if (!this.mayDiscard([blades[blades.length - 1].path])) return;
      this.portal.blades.set(blades.slice(0, -1));
      this.pruneDirtyChecks();
    }
  }

  /**
   * Close a specific blade by its definition reference.
   * Removes the blade and all blades to its right.
   */
  closeBlade(blade: BladeDefinition): void {
    this.clearPath(blade.path);
  }

  /**
   * Get a blade by path, if it exists in the stack.
   */
  getBlade(path: string): BladeDefinition | undefined {
    return this.portal.blades().find((b) => b.path === path.toLowerCase());
  }

  /**
   * Check if a blade with the given path is currently open.
   */
  isBladeOpen(path: string): boolean {
    return this.portal.blades().some((b) => b.path === path.toLowerCase());
  }

  /**
   * Get URL-persisted parameters for a blade by path.
   * Returns empty object if blade not found or has no params.
   */
  getBladeParams(path: string): Record<string, string> {
    return this.getBlade(path)?.params ?? {};
  }
}
