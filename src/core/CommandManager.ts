import type { ICommand } from '../types';
import { COMMAND_HISTORY_LIMIT } from '../constants';
import { EventBus } from './EventBus';

export class CommandManager {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private eventBus: EventBus;
  private maxHistory: number;

  constructor(eventBus: EventBus, maxHistory: number = COMMAND_HISTORY_LIMIT) {
    this.eventBus = eventBus;
    this.maxHistory = maxHistory;
  }

  execute(command: ICommand): void {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.eventBus.emit('command:executed', { command: command.description });
    this.eventBus.emit('mindmap:changed');
  }

  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;
    command.undo();
    this.redoStack.push(command);
    this.eventBus.emit('command:undone', { command: command.description });
    this.eventBus.emit('mindmap:changed');
    return true;
  }

  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    command.execute();
    this.undoStack.push(command);
    this.eventBus.emit('command:redone', { command: command.description });
    this.eventBus.emit('mindmap:changed');
    return true;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoDescription(): string | null {
    const last = this.undoStack[this.undoStack.length - 1];
    return last?.description ?? null;
  }

  get redoDescription(): string | null {
    const last = this.redoStack[this.redoStack.length - 1];
    return last?.description ?? null;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
