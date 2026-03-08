import { EventBus } from '../core/EventBus';

export class SelectionManager {
  private selectedIds = new Set<string>();
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  select(nodeId: string, multiSelect: boolean = false): void {
    if (!multiSelect) {
      for (const id of this.selectedIds) {
        if (id !== nodeId) {
          this.eventBus.emit('node:deselected', { nodeId: id });
        }
      }
      this.selectedIds.clear();
    }

    if (this.selectedIds.has(nodeId) && multiSelect) {
      this.selectedIds.delete(nodeId);
      this.eventBus.emit('node:deselected', { nodeId });
    } else {
      this.selectedIds.add(nodeId);
      this.eventBus.emit('node:selected', { nodeId });
    }
  }

  deselect(nodeId: string): void {
    if (this.selectedIds.delete(nodeId)) {
      this.eventBus.emit('node:deselected', { nodeId });
    }
  }

  deselectAll(): void {
    for (const id of this.selectedIds) {
      this.eventBus.emit('node:deselected', { nodeId: id });
    }
    this.selectedIds.clear();
  }

  isSelected(nodeId: string): boolean {
    return this.selectedIds.has(nodeId);
  }

  get selected(): string[] {
    return [...this.selectedIds];
  }

  get count(): number {
    return this.selectedIds.size;
  }

  get primary(): string | null {
    return this.selectedIds.size > 0 ? [...this.selectedIds][0] : null;
  }
}
