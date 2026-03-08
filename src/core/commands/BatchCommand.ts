import type { ICommand } from '../../types';

export class BatchCommand implements ICommand {
  readonly description: string;
  private commands: ICommand[];

  constructor(commands: ICommand[], description?: string) {
    this.commands = commands;
    this.description = description ?? `Batch: ${commands.length} operations`;
  }

  execute(): void {
    for (const command of this.commands) {
      command.execute();
    }
  }

  undo(): void {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  get size(): number {
    return this.commands.length;
  }
}
