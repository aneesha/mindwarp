import type { ICommand } from '../../types';
import { MindMap } from '../MindMap';

export class MoveNodeCommand implements ICommand {
  readonly description: string;
  private mindmap: MindMap;
  private nodeId: string;
  private oldParentId: string;
  private newParentId: string;
  private oldIndex: number;
  private newIndex?: number;

  constructor(
    mindmap: MindMap,
    nodeId: string,
    newParentId: string,
    newIndex?: number
  ) {
    const node = mindmap.findNodeById(nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);
    const oldParent = mindmap.findParentOf(nodeId);
    if (!oldParent) throw new Error(`Cannot move root node`);

    this.mindmap = mindmap;
    this.nodeId = nodeId;
    this.oldParentId = oldParent.id;
    this.newParentId = newParentId;
    this.oldIndex = oldParent.getChildIndex(nodeId);
    this.newIndex = newIndex;
    this.description = `Move node "${node.content.slice(0, 30)}"`;
  }

  execute(): void {
    const oldParent = this.mindmap.findNodeById(this.oldParentId);
    const newParent = this.mindmap.findNodeById(this.newParentId);
    if (!oldParent || !newParent) throw new Error('Parent node not found');

    const node = oldParent.removeChild(this.nodeId);
    if (!node) throw new Error(`Node ${this.nodeId} not found in old parent`);
    newParent.addChild(node, this.newIndex);
  }

  undo(): void {
    const oldParent = this.mindmap.findNodeById(this.oldParentId);
    const newParent = this.mindmap.findNodeById(this.newParentId);
    if (!oldParent || !newParent) throw new Error('Parent node not found');

    const node = newParent.removeChild(this.nodeId);
    if (!node) throw new Error(`Node ${this.nodeId} not found in new parent`);
    oldParent.addChild(node, this.oldIndex);
  }
}
