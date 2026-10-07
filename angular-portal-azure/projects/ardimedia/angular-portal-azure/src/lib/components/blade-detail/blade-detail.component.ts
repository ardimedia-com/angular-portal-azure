import { AfterContentInit, Component, OnDestroy, contentChild, inject, input } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BladeDataDefinition } from '../../models/blade-data.model';
import { BladeCommand, createCommand } from '../../models/blade-command.model';
import { PortalLabels, DEFAULT_LABELS } from '../../models/portal-labels.model';
import { BladeService } from '../../services/blade.service';

/**
 * Detail/edit blade content — renders a form area for editing an item.
 * Ported from BladeDetail<T> (v0.2.346).
 *
 * Provides a content projection area for forms. The blade's commands
 * (save, delete, cancel, new) are managed via the blade definition.
 *
 * This is a thin wrapper that projects content and provides
 * convenience methods for setting up typical detail blade commands.
 *
 * Usage:
 * ```html
 * <apa-blade [blade]="detailBlade">
 *   <apa-blade-detail [blade]="detailBlade">
 *     <form>
 *       <!-- form fields here -->
 *     </form>
 *   </apa-blade-detail>
 * </apa-blade>
 * ```
 */
@Component({
  selector: 'apa-blade-detail',
  standalone: true,
  styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .apa-blade-detail { flex: 1; display: flex; flex-direction: column; min-height: 0; }`],
  template: `
    <div class="apa-blade-detail">
      <ng-content />
    </div>
  `,
})
export class BladeDetailComponent implements AfterContentInit, OnDestroy {
  readonly blade = input.required<BladeDataDefinition<any>>();

  private readonly bladeService = inject(BladeService);

  /** The template-driven form projected into this detail, if any (auto-discovered). */
  private readonly form = contentChild(NgForm, { descendants: true });

  ngAfterContentInit(): void {
    const blade = this.blade();
    const isDirty = (): boolean => this.form()?.dirty ?? false;

    // Expose on the lifecycle (for consumers) and register with the BladeService so navigation
    // away from a dirty blade prompts for confirmation. No per-detail wiring needed — every
    // detail that projects a <form> is guarded automatically.
    blade.lifecycle.isDirty = isDirty;
    this.bladeService.registerDirtyCheck(blade.path, isDirty);

    // Enforce the form's own validators (required, min, max, pattern ...) on save. Without this, executeSaveItem
    // saved invalid data, because no blade wired isFormValid by hand. Invalid controls are marked touched so the
    // form can highlight them. A consumer-supplied predicate wins.
    if (!blade.lifecycle.isFormValid) {
      blade.lifecycle.isFormValid = (): boolean => {
        const form = this.form();
        if (!form || form.valid) {
          return true;
        }
        form.form.markAllAsTouched();
        return false;
      };
    }

    // After a successful save, reset the form to pristine so the guard does not fire on a
    // saved-but-not-yet-navigated blade. Wrap (don't replace) any existing onSavedItem hook.
    const originalOnSaved = blade.lifecycle.onSavedItem;
    blade.lifecycle.onSavedItem = (): void => {
      this.form()?.form.markAsPristine();
      originalOnSaved?.();
    };
  }

  ngOnDestroy(): void {
    this.bladeService.unregisterDirtyCheck(this.blade().path);
  }
}

/**
 * Create standard detail blade commands (new, save, delete, cancel).
 * Convenience function for setting up typical detail/edit blade commands
 * matching the v0.2.346 BladeDetail default commands.
 */
export function createDetailCommands(handlers: {
  onNew?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}, labels: PortalLabels = DEFAULT_LABELS): BladeCommand[] {
  const commands: BladeCommand[] = [];

  if (handlers.onNew) {
    commands.push(createCommand('new', labels.cmdNew, handlers.onNew, 'ti ti-plus'));
  }
  if (handlers.onSave) {
    commands.push(createCommand('save', labels.cmdSave, handlers.onSave, 'ti ti-device-floppy'));
  }
  if (handlers.onDelete) {
    commands.push(createCommand('delete', labels.cmdDelete, handlers.onDelete, 'ti ti-trash'));
  }
  if (handlers.onCancel) {
    commands.push(createCommand('cancel', labels.cmdCancel, handlers.onCancel, 'ti ti-x'));
  }

  return commands;
}
