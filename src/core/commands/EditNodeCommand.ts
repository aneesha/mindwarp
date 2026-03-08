import type { ICommand } from '../../types';
import { MindMap } from '../MindMap';

export class EditNodeCommand implements ICommand {
  readonly description: string;
  private mindmap: MindMap;
  private nodeId: string;
  private oldContent: string;
  private newContent: string;

  constructor(mindmap: MindMap, nodeId: string, newContent: string) {
    const node = mindmap.findNodeById(nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    this.mindmap = mindmap;
    this.nodeId = nodeId;
    this.oldContent = node.content;
    this.newContent = newContent;
    this.description = `Edit node "${node.content.slice(0, 20)}" → "${newContent.slice(0, 20)}"`;
  }

  execute(): void {
    const node = this.mindmap.findNodeById(this.nodeId);
    if (!node) throw new Error(`Node ${this.nodeId} not found`);
    node.content = this.newContent;
    node.updatedAt = Date.now();
  }

  undo(): void {
    const node = this.mindmap.findNodeById(this.nodeId);
    if (!node) throw new Error(`Node ${this.nodeId} not found`);
    node.content = this.oldContent;
    node.updatedAt = Date.now();
  }
}
