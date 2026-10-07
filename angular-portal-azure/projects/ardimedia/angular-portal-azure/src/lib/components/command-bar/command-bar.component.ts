import { Component, input, signal } from '@angular/core';
import { BladeCommand } from '../../models/blade-command.model';

/**
 * Command bar for a blade.
 * Ported from the fxs-commandBar section in blade.html (v0.2.346).
 *
 * Replaces the 18 individual command buttons with a dynamic BladeCommand[] array.
 *
 * Usage:
 * ```html
 * <apa-command-bar [commands]="blade.commands" />
 * ```
 */
@Component({
  selector: 'apa-command-bar',
  standalone: true,
  styles: [`:host { display: block; }`],
  template: `
    <nav class="fxs-commandBar" role="toolbar" aria-label="Commands">
      <ul class="fxs-commandBar-itemList" role="list">
        @for (cmd of visibleCommands(); track cmd.key) {
          <li role="listitem">
            <a class="fxs-commandBar-item"
               role="button"
               [tabindex]="cmd.enabled && !isRunning(cmd) ? 0 : -1"
               [class.apa-disable-click]="!cmd.enabled || isRunning(cmd)"
               [attr.aria-disabled]="!cmd.enabled || isRunning(cmd)"
               [attr.aria-label]="cmd.label"
               (click)="onCommand(cmd)"
               (keydown.enter)="onCommand(cmd)"
               (keydown.space)="onCommand(cmd)">
              <span class="fxs-commandBar-item-text">{{ cmd.label }}</span>
              @if (cmd.icon) {
                <span class="fxs-commandBar-item-icon apa-commandbar-icon" aria-hidden="true">
                  <span [class]="cmd.icon"></span>
                </span>
              }
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class CommandBarComponent {
  readonly commands = input<BladeCommand[]>([]);

  visibleCommands(): BladeCommand[] {
    return this.commands().filter((c) => c.visible);
  }

  /** Keys of commands whose async action is still running; a second click on them is ignored. */
  private readonly running = signal<ReadonlySet<string>>(new Set());

  isRunning(cmd: BladeCommand): boolean {
    return this.running().has(cmd.key);
  }

  onCommand(cmd: BladeCommand): void {
    if (!cmd.enabled || !cmd.action || this.isRunning(cmd)) {
      return;
    }
    const result = cmd.action();
    if (result instanceof Promise) {
      // Double-click guard: an async command (save, order, create ...) runs at most once at a time.
      this.running.update((keys) => new Set(keys).add(cmd.key));
      result
        .catch((err) => console.error(`[CommandBar] Command "${cmd.key}" failed:`, err))
        .finally(() => this.running.update((keys) => {
          const next = new Set(keys);
          next.delete(cmd.key);
          return next;
        }));
    }
  }
}
