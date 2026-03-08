import type { ICommand, MindMapNodeData } from '../../types';
import { MindMapNode } from '../MindMapNode';
import { MindMap } from '../MindMap';

export class AddNodeCommand implements ICommand {
  readonly description: string;
  private mindmap: MindMap;
  private parentId: string;
  private nodeData: MindMapNodeData;
  private index?: number;

  constructor(mindmap: MindMap, parentId: string, node: MindMapNode, index?: number) {
    this.mindmap = mindmap;
    this.parentId = parentId;
    this.nodeData = node.toData();
    this.index = index;
    this.description = `Add node "${node.content.slice(0, 30)}"`;
  }

  execute(): void {
    const parent = this.mindmap.findNodeById(this.parentId);
    if (!parent) throw new Error(`Parent node ${this.parentId} not found`);
    const node = MindMapNode.fromData(this.nodeData);
    parent.addChild(node, this.index);
  }

  undo(): void {
    const parent = this.mindmap.findNodeById(this.parentId);
    if (!parent) throw new Error(`Parent node ${this.parentId} not found`);
    parent.removeChild(this.nodeData.id);
  }
}
