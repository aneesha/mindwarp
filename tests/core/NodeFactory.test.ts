import { describe, it, expect, beforeEach } from 'vitest';
import { createNode, createRootNode, createMindMapFromTitle, resetIdCounter } from '../../src/core/NodeFactory';
import { ROOT_NODE_STYLE, DEFAULT_NODE_STYLE, DEPTH_COLORS } from '../../src/constants';

describe('NodeFactory', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('createNode', () => {
    it('should create a node with content', () => {
      const node = createNode('Test Node');
      expect(node.content).toBe('Test Node');
      expect(node.children).toHaveLength(0);
      expect(node.collapsed).toBe(false);
    });

    it('should generate unique ids', () => {
      const node1 = createNode('Node 1');
      const node2 = createNode('Node 2');
      expect(node1.id).not.toBe(node2.id);
    });

    it('should set default style based on depth', () => {
      const node = createNode('Test', 1);
      expect(node.style.borderColor).toBe(DEPTH_COLORS[1]);
      expect(node.style.backgroundColor).toBe(DEFAULT_NODE_STYLE.backgroundColor);
    });

    it('should set timestamps', () => {
      const before = Date.now();
      const node = createNode('Test');
      expect(node.createdAt).toBeGreaterThanOrEqual(before);
      expect(node.updatedAt).toBeGreaterThanOrEqual(before);
    });
  });

  describe('createRootNode', () => {
    it('should create a root node with root styling', () => {
      const node = createRootNode('Root Topic');
      expect(node.content).toBe('Root Topic');
      expect(node.style.backgroundColor).toBe(ROOT_NODE_STYLE.backgroundColor);
      expect(node.style.textColor).toBe(ROOT_NODE_STYLE.textColor);
    });
  });

  describe('createMindMapFromTitle', () => {
    it('should create a root node from title', () => {
      const { root } = createMindMapFromTitle('My Mindmap');
      expect(root.content).toBe('My Mindmap');
      expect(root.children).toHaveLength(0);
    });
  });
});
