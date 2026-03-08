import type { ICommand, MindMapNodeData } from '../../types';
import { MindMapNode } from '../MindMapNode';
import { MindMap } from '../MindMap';

export class DeleteNodeCommand implements ICommand {
  readonly description: string;
  private mindmap: MindMap;
  private nodeData: MindMapNodeData;
  private parentId: string;
  private index: number;

  constructor(mindmap: MindMap, nodeId: string) {
    const node = mindmap.findNodeById(nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);
    const parent = mindmap.findParentOf(nodeId);
    if (!parent) throw new Error(`Cannot delete root node`);

    this.mindmap = mindmap;
    this.nodeData = node.toData();
    this.parentId = parent.id;
    this.index = parent.getChildIndex(nodeId);
    this.description = `Delete node "${node.content.slice(0, 30)}"`;
  }

  execute(): void {
    const parent = this.mindmap.findNodeById(this.parentId);
    if (!parent) throw new Error(`Parent node ${this.parentId} not found`);
    parent.removeChild(this.nodeData.id);
  }

  undo(): void {
    const parent = this.mindmap.findNodeById(this.parentId);
    if (!parent) throw new Error(`Parent node ${this.parentId} not found`);
    const node = MindMapNode.fromData(this.nodeData);
    parent.addChild(node, this.index);
  }
}
