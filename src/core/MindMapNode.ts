import type { MindMapNodeData, Position, NodeStyle } from '../types';

export class MindMapNode {
  readonly id: string;
  content: string;
  children: MindMapNode[];
  position: Position;
  style: NodeStyle;
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;

  constructor(data: MindMapNodeData) {
    this.id = data.id;
    this.content = data.content;
    this.position = { ...data.position };
    this.style = { ...data.style };
    this.collapsed = data.collapsed;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.children = data.children.map((child) => new MindMapNode(child));
  }

  addChild(node: MindMapNode, index?: number): void {
    if (index !== undefined && index >= 0 && index <= this.children.length) {
      this.children.splice(index, 0, node);
    } else {
      this.children.push(node);
    }
    this.updatedAt = Date.now();
  }

  removeChild(id: string): MindMapNode | null {
    const index = this.children.findIndex((c) => c.id === id);
    if (index === -1) return null;
    const [removed] = this.children.splice(index, 1);
    this.updatedAt = Date.now();
    return removed;
  }

  findById(id: string): MindMapNode | null {
    if (this.id === id) return this;
    for (const child of this.children) {
      const found = child.findById(id);
      if (found) return found;
    }
    return null;
  }

  findParentOf(id: string): MindMapNode | null {
    for (const child of this.children) {
      if (child.id === id) return this;
      const found = child.findParentOf(id);
      if (found) return found;
    }
    return null;
  }

  flatten(): MindMapNode[] {
    const result: MindMapNode[] = [this];
    for (const child of this.children) {
      result.push(...child.flatten());
    }
    return result;
  }

  getDepth(root: MindMapNode): number {
    const path = root.getPathTo(this.id);
    return path ? path.length - 1 : 0;
  }

  getPathTo(id: string): MindMapNode[] | null {
    if (this.id === id) return [this];
    for (const child of this.children) {
      const path = child.getPathTo(id);
      if (path) return [this, ...path];
    }
    return null;
  }

  getChildIndex(id: string): number {
    return this.children.findIndex((c) => c.id === id);
  }

  get visibleChildren(): MindMapNode[] {
    return this.collapsed ? [] : this.children;
  }

  get subtreeSize(): number {
    return 1 + this.children.reduce((sum, child) => sum + child.subtreeSize, 0);
  }

  toData(): MindMapNodeData {
    return {
      id: this.id,
      content: this.content,
      children: this.children.map((c) => c.toData()),
      position: { ...this.position },
      style: { ...this.style },
      collapsed: this.collapsed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromData(data: MindMapNodeData): MindMapNode {
    return new MindMapNode(data);
  }
}
