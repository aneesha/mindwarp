import type { AICommand, ICommand } from '../types';
import type { MindMap } from '../core/MindMap';
import type { CommandManager } from '../core/CommandManager';
import { AddNodeCommand } from '../core/commands/AddNodeCommand';
import { EditNodeCommand } from '../core/commands/EditNodeCommand';
import { DeleteNodeCommand } from '../core/commands/DeleteNodeCommand';
import { BatchCommand } from '../core/commands/BatchCommand';
import { createNode } from '../core/NodeFactory';

const ADD_PATTERN = /<<ADD\s+parent_id\s*=\s*"?([^"\s>]+)"?\s+content\s*=\s*"([^"]+)"\s*>>/gi;
const EDIT_PATTERN = /<<EDIT\s+node_id\s*=\s*"?([^"\s>]+)"?\s+content\s*=\s*"([^"]+)"\s*>>/gi;
const DELETE_PATTERN = /<<DELETE\s+node_id\s*=\s*"?([^"\s>]+)"?\s*>>/gi;

export class AIMediatorService {
  private mindmap: MindMap;
  private commandManager: CommandManager;

  constructor(mindmap: MindMap, commandManager: CommandManager) {
    this.mindmap = mindmap;
    this.commandManager = commandManager;
  }

  parseCommands(responseText: string): AICommand[] {
    const commands: AICommand[] = [];

    let match: RegExpExecArray | null;

    ADD_PATTERN.lastIndex = 0;
    while ((match = ADD_PATTERN.exec(responseText)) !== null) {
      commands.push({
        action: 'add',
        parentNodeId: match[1],
        content: match[2],
      });
    }

    EDIT_PATTERN.lastIndex = 0;
    while ((match = EDIT_PATTERN.exec(responseText)) !== null) {
      commands.push({
        action: 'edit',
        targetNodeId: match[1],
        content: match[2],
      });
    }

    DELETE_PATTERN.lastIndex = 0;
    while ((match = DELETE_PATTERN.exec(responseText)) !== null) {
      commands.push({
        action: 'delete',
        targetNodeId: match[1],
      });
    }

    return commands;
  }

  extractPlainText(responseText: string): string {
    return responseText
      .replace(/<<ADD[^>]*>>/gi, '')
      .replace(/<<EDIT[^>]*>>/gi, '')
      .replace(/<<DELETE[^>]*>>/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  applyCommands(aiCommands: AICommand[]): { applied: number; errors: string[] } {
    const commands: ICommand[] = [];
    const errors: string[] = [];

    for (const aiCmd of aiCommands) {
      try {
        const cmd = this.createCommand(aiCmd);
        if (cmd) commands.push(cmd);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${aiCmd.action}: ${message}`);
      }
    }

    if (commands.length > 0) {
      const batch = new BatchCommand(commands, `AI: ${commands.length} operations`);
      this.commandManager.execute(batch);
    }

    return { applied: commands.length, errors };
  }

  private createCommand(aiCmd: AICommand): ICommand | null {
    switch (aiCmd.action) {
      case 'add': {
        if (!aiCmd.parentNodeId || !aiCmd.content) return null;
        const parent = this.mindmap.findNodeById(aiCmd.parentNodeId);
        if (!parent) throw new Error(`Parent node ${aiCmd.parentNodeId} not found`);
        const depth = this.mindmap.root.getPathTo(aiCmd.parentNodeId)?.length ?? 1;
        const newNode = createNode(aiCmd.content, depth);
        return new AddNodeCommand(this.mindmap, aiCmd.parentNodeId, newNode);
      }
      case 'edit': {
        if (!aiCmd.targetNodeId || !aiCmd.content) return null;
        const node = this.mindmap.findNodeById(aiCmd.targetNodeId);
        if (!node) throw new Error(`Node ${aiCmd.targetNodeId} not found`);
        return new EditNodeCommand(this.mindmap, aiCmd.targetNodeId, aiCmd.content);
      }
      case 'delete': {
        if (!aiCmd.targetNodeId) return null;
        const nodeToDelete = this.mindmap.findNodeById(aiCmd.targetNodeId);
        if (!nodeToDelete) throw new Error(`Node ${aiCmd.targetNodeId} not found`);
        return new DeleteNodeCommand(this.mindmap, aiCmd.targetNodeId);
      }
      default:
        return null;
    }
  }

  processResponse(responseText: string): {
    plainText: string;
    commandCount: number;
    errors: string[];
  } {
    const aiCommands = this.parseCommands(responseText);
    const plainText = this.extractPlainText(responseText);

    if (aiCommands.length === 0) {
      return { plainText: responseText, commandCount: 0, errors: [] };
    }

    const { applied, errors } = this.applyCommands(aiCommands);
    return { plainText, commandCount: applied, errors };
  }

  setMindmap(mindmap: MindMap): void {
    this.mindmap = mindmap;
  }
}
