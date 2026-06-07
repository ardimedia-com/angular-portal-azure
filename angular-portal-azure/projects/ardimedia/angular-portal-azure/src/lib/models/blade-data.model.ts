import { signal } from '@angular/core';
import { BladeDefinition, nextBladeUid } from './blade.model';
import { StatusBarState, statusBarInfo, statusBarError, statusBarSuccess, clearStatusBar } from './status-bar.model';
import { PortalLabels, DEFAULT_LABELS } from './portal-labels.model';

/**
 * Exception model for API error responses.
 * Ported from Exception / ExceptionDotNet in v0.2.346.
 */
export interface ApiException {
  message: string;
  status?: number;
  statusText?: string;
  data?: Array<{ key: number; value: string }>;
  validationResults?: Array<{ errorMessage: string; memberNames: string[] }>;
}

/**
 * Lifecycle hooks for CRUD operations on a blade.
 * Ported from BladeData<T> template method pattern in v0.2.346.
 *
 * Each operation follows the pattern: onBefore → execute → onSuccess | onError
 */
export interface BladeDataLifecycle<T> {
  // Load single item
  onLoadItem?: () => void;
  onLoadedItem?: () => void;
  onLoadItemError?: (ex: ApiException) => void;

  // Load multiple items
  onLoadItems?: () => void;
  onLoadedItems?: () => void;
  onLoadItemsError?: (ex: ApiException) => void;

  // Save item
  onSaveItem?: () => void;
  onSavedItem?: () => void;
  onSaveItemError?: (ex: ApiException) => void;

  // Delete item
  onDeleteItem?: () => void;
  onDeletedItem?: () => boolean; // return false to prevent blade close
  onDeleteItemError?: (ex: ApiException) => void;

  // New item
  onNewItem?: () => void;
  onNewedItem?: () => void;
  onNewItemError?: (ex: ApiException) => void;

  // Execute generic action
  onExecute?: () => void;
  onExecuted?: () => void;
  onExecuteError?: (ex: ApiException) => void;

  // Form validation
  isFormValid?: () => boolean;

  // Unsaved-changes guard. Return true if the blade has unsaved edits; the BladeService then
  // asks for confirmation before this blade is closed/replaced or the page is left.
  // apa-blade-detail wires this automatically from the projected <form> (NgForm.dirty).
  isDirty?: () => boolean;
}

/**
 * Extended blade definition for data-driven blades with CRUD operations.
 * Ported from BladeData<T> in v0.2.346.
 */
export interface BladeDataDefinition<T> extends BladeDefinition {
  /** Current item being edited/viewed */
  item: T;
  /** List of items (for grid/list blades) */
  items: T[];
  /** Whether data is currently being loaded */
  loading: boolean;
  /** Lifecycle hooks for CRUD operations */
  lifecycle: BladeDataLifecycle<T>;
}

/** Creates a data blade definition with sensible defaults.
 *  statusBar, title, item, items use getter/setter pairs backed by signals for zoneless change detection.
 *  Note: cannot use ...createBlade() spread here — spread copies getter values, not getter/setter pairs. */
export function createDataBlade<T>(
  path: string,
  title: string,
  width: number = 315,
  params: Record<string, string> = {},
  uid?: number,
): BladeDataDefinition<T> {
  const _statusBar = signal<StatusBarState>(clearStatusBar());
  const _title = signal(title);
  const _item = signal<T>({} as T);
  const _items = signal<T[]>([]);
  const _loading = signal(false);
  return {
    uid: uid ?? nextBladeUid(),
    path: path.toLowerCase(),
    get title(): string { return _title(); },
    set title(value: string) { _title.set(value); },
    subtitle: '',
    width,
    isInnerHtml: true,
    commands: [],
    get statusBar(): StatusBarState { return _statusBar(); },
    set statusBar(value: StatusBarState) { _statusBar.set(value); },
    get item(): T { return _item(); },
    set item(value: T) { _item.set(value); },
    get items(): T[] { return _items(); },
    set items(value: T[]) { _items.set(value); },
    get loading(): boolean { return _loading(); },
    set loading(value: boolean) { _loading.set(value); },
    lifecycle: {},
    params,
  };
}

/**
 * Execute a load-item operation with lifecycle hooks and status bar updates.
 * Replaces the BladeData.loadItem() template method from v0.2.346.
 */
export async function executeLoadItem<T>(
  blade: BladeDataDefinition<T>,
  loadFn: () => Promise<T>,
  labels: PortalLabels = DEFAULT_LABELS,
): Promise<T | void> {
  blade.lifecycle.onLoadItem?.();
  blade.statusBar = statusBarInfo(labels.loading);
  try {
    const result = await loadFn();
    blade.item = result;
    blade.statusBar = clearStatusBar();
    blade.lifecycle.onLoadedItem?.();
    return result;
  } catch (ex) {
    blade.statusBar = statusBarError((ex as ApiException).message || labels.loadError);
    blade.lifecycle.onLoadItemError?.(ex as ApiException);
  }
}

/**
 * Execute a load-items operation with lifecycle hooks and status bar updates.
 */
export async function executeLoadItems<T>(
  blade: BladeDataDefinition<T>,
  loadFn: () => Promise<T[]>,
  labels: PortalLabels = DEFAULT_LABELS,
): Promise<T[] | void> {
  blade.lifecycle.onLoadItems?.();
  blade.loading = true;
  blade.statusBar = statusBarInfo(labels.loading);
  try {
    const result = await loadFn();
    blade.items = result;
    blade.statusBar = clearStatusBar();
    blade.lifecycle.onLoadedItems?.();
    return result;
  } catch (ex) {
    blade.statusBar = statusBarError((ex as ApiException).message || labels.loadError);
    blade.lifecycle.onLoadItemsError?.(ex as ApiException);
  } finally {
    blade.loading = false;
  }
}

/**
 * Execute a save-item operation with lifecycle hooks and status bar updates.
 */
export async function executeSaveItem<T>(
  blade: BladeDataDefinition<T>,
  saveFn: () => Promise<T>,
  labels: PortalLabels = DEFAULT_LABELS,
): Promise<T | void> {
  if (blade.lifecycle.isFormValid && !blade.lifecycle.isFormValid()) {
    return;
  }
  blade.lifecycle.onSaveItem?.();
  blade.statusBar = statusBarInfo(labels.saving);
  try {
    const result = await saveFn();
    blade.item = result;
    blade.statusBar = statusBarSuccess(labels.saved);
    blade.lifecycle.onSavedItem?.();
    return result;
  } catch (ex) {
    blade.statusBar = statusBarError((ex as ApiException).message || labels.saveError);
    blade.lifecycle.onSaveItemError?.(ex as ApiException);
  }
}

/**
 * Execute a delete-item operation with lifecycle hooks and status bar updates.
 * Returns true if the blade should be closed after deletion.
 */
export async function executeDeleteItem<T>(
  blade: BladeDataDefinition<T>,
  deleteFn: () => Promise<void>,
  labels: PortalLabels = DEFAULT_LABELS,
): Promise<boolean> {
  blade.lifecycle.onDeleteItem?.();
  blade.statusBar = statusBarInfo(labels.deleting);
  try {
    await deleteFn();
    blade.statusBar = statusBarSuccess(labels.deleted);
    const shouldClose = blade.lifecycle.onDeletedItem?.() ?? true;
    return shouldClose;
  } catch (ex) {
    blade.statusBar = statusBarError((ex as ApiException).message || labels.deleteError);
    blade.lifecycle.onDeleteItemError?.(ex as ApiException);
    return false;
  }
}
