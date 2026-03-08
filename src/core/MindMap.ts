import type { MindMapData, MindMapMetadata } from '../types';
import { MindMapNode } from './MindMapNode';
import { MINDWARP_FILE_VERSION } from '../constants';

export class MindMap {
  title: string;
  root: MindMapNode;
  metadata: MindMapMetadata;

  constructor(title: string, root: MindMapNode, metadata?: Partial<MindMapMetadata>) {
    this.title = title;
    this.root = root;
    this.metadata = {
      createdAt: metadata?.createdAt ?? Date.now(),
      updatedAt: metadata?.updatedAt ?? Date.now(),
      author: metadata?.author ?? '',
      description: metadata?.description ?? '',
    };
  }

  findNodeById(id: string): MindMapNode | null {
    return this.root.findById(id);
  }

  findParentOf(id: string): MindMapNode | null {
    return this.root.findParentOf(id);
  }

  getAllNodes(): MindMapNode[] {
    return this.root.flatten();
  }

  get nodeCount(): number {
    return this.root.subtreeSize;
  }

  serialize(): MindMapData {
    return {
      version: MINDWARP_FILE_VERSION,
      title: this.title,
      root: this.root.toData(),
      metadata: { ...this.metadata },
    };
  }

  static deserialize(data: MindMapData): MindMap {
    const root = MindMapNode.fromData(data.root);
    return new MindMap(data.title, root, data.metadata);
  }
}
