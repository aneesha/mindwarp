import type { MindMapNodeData, NodeStyle } from '../types';
import { DEFAULT_NODE_STYLE, ROOT_NODE_STYLE, DEPTH_COLORS } from '../constants';
import { MindMapNode } from './MindMapNode';

let idCounter = 0;

function generateId(): string {
  idCounter++;
  return `node_${Date.now()}_${idCounter}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}

function getStyleForDepth(depth: number): NodeStyle {
  if (depth === 0) return { ...ROOT_NODE_STYLE };
  const colorIndex = Math.min(depth, DEPTH_COLORS.length - 1);
  return {
    ...DEFAULT_NODE_STYLE,
    borderColor: DEPTH_COLORS[colorIndex],
  };
}

export function createNode(content: string, depth: number = 1): MindMapNode {
  const now = Date.now();
  const data: MindMapNodeData = {
    id: generateId(),
    content,
    children: [],
    position: { x: 0, y: 0 },
    style: getStyleForDepth(depth),
    collapsed: false,
    createdAt: now,
    updatedAt: now,
  };
  return new MindMapNode(data);
}

export function createRootNode(content: string): MindMapNode {
  return createNode(content, 0);
}

export function createMindMapFromTitle(title: string): { root: MindMapNode } {
  const root = createRootNode(title);
  return { root };
}
