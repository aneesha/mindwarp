import { describe, it, expect, beforeEach } from 'vitest';
import { MindMapNode } from '../../src/core/MindMapNode';
import type { MindMapNodeData } from '../../src/types';
import { DEFAULT_NODE_STYLE, ROOT_NODE_STYLE } from '../../src/constants';

function makeNodeData(id: string, content: string, children: MindMapNodeData[] = []): MindMapNodeData {
  return {
    id,
    content,
    children,
    position: { x: 0, y: 0 },
    style: { ...DEFAULT_NODE_STYLE },
    collapsed: false,
    createdAt: 1000,
    updatedAt: 1000,
  };
}

describe('MindMapNode', () => {
  let root: MindMapNode;

  beforeEach(() => {
    root = new MindMapNode(
      makeNodeData('root', 'Root', [
        makeNodeData('a', 'Child A', [
          makeNodeData('a1', 'Grandchild A1'),
          makeNodeData('a2', 'Grandchild A2'),
        ]),
        makeNodeData('b', 'Child B'),
      ])
    );
  });

  describe('constructor', () => {
    it('should create a node with correct properties', () => {
      const node = new MindMapNode(makeNodeData('test', 'Test Node'));
      expect(node.id).toBe('test');
      expect(node.content).toBe('Test Node');
      expect(node.children).toHaveLength(0);
      expect(node.collapsed).toBe(false);
    });

    it('should recursively create children', () => {
      expect(root.children).toHaveLength(2);
      expect(root.children[0].children).toHaveLength(2);
      expect(root.children[0].children[0].id).toBe('a1');
    });
  });

  describe('addChild', () => {
    it('should append child to end', () => {
      const newNode = new MindMapNode(makeNodeData('c', 'Child C'));
      root.addChild(newNode);
      expect(root.children).toHaveLength(3);
      expect(root.children[2].id).toBe('c');
    });

    it('should insert child at index', () => {
      const newNode = new MindMapNode(makeNodeData('c', 'Child C'));
      root.addChild(newNode, 1);
      expect(root.children).toHaveLength(3);
      expect(root.children[1].id).toBe('c');
    });

    it('should update timestamp', () => {
      const before = root.updatedAt;
      const newNode = new MindMapNode(makeNodeData('c', 'Child C'));
      root.addChild(newNode);
      expect(root.updatedAt).toBeGreaterThanOrEqual(before);
    });
  });

  describe('removeChild', () => {
    it('should remove and return child', () => {
      const removed = root.removeChild('b');
      expect(removed).not.toBeNull();
      expect(removed!.id).toBe('b');
      expect(root.children).toHaveLength(1);
    });

    it('should return null for non-existent child', () => {
      const removed = root.removeChild('nonexistent');
      expect(removed).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find self', () => {
      expect(root.findById('root')).toBe(root);
    });

    it('should find direct child', () => {
      const found = root.findById('a');
      expect(found).not.toBeNull();
      expect(found!.content).toBe('Child A');
    });

    it('should find deeply nested node', () => {
      const found = root.findById('a2');
      expect(found).not.toBeNull();
      expect(found!.content).toBe('Grandchild A2');
    });

    it('should return null for non-existent id', () => {
      expect(root.findById('zzz')).toBeNull();
    });
  });

  describe('findParentOf', () => {
    it('should find parent of direct child', () => {
      const parent = root.findParentOf('a');
      expect(parent).toBe(root);
    });

    it('should find parent of nested child', () => {
      const parent = root.findParentOf('a1');
      expect(parent).not.toBeNull();
      expect(parent!.id).toBe('a');
    });

    it('should return null for root', () => {
      expect(root.findParentOf('root')).toBeNull();
    });

    it('should return null for non-existent id', () => {
      expect(root.findParentOf('zzz')).toBeNull();
    });
  });

  describe('flatten', () => {
    it('should return all nodes in pre-order', () => {
      const flat = root.flatten();
      expect(flat.map((n) => n.id)).toEqual(['root', 'a', 'a1', 'a2', 'b']);
    });

    it('should return single node for leaf', () => {
      const leaf = root.findById('a1')!;
      expect(leaf.flatten()).toHaveLength(1);
    });
  });

  describe('getDepth', () => {
    it('should return 0 for root', () => {
      expect(root.getDepth(root)).toBe(0);
    });

    it('should return correct depth for nested nodes', () => {
      const childA = root.findById('a')!;
      expect(childA.getDepth(root)).toBe(1);
      const grandchild = root.findById('a1')!;
      expect(grandchild.getDepth(root)).toBe(2);
    });
  });

  describe('getPathTo', () => {
    it('should return path from root to target', () => {
      const path = root.getPathTo('a2');
      expect(path).not.toBeNull();
      expect(path!.map((n) => n.id)).toEqual(['root', 'a', 'a2']);
    });

    it('should return self for own id', () => {
      const path = root.getPathTo('root');
      expect(path).toHaveLength(1);
    });

    it('should return null for non-existent id', () => {
      expect(root.getPathTo('zzz')).toBeNull();
    });
  });

  describe('getChildIndex', () => {
    it('should return correct index', () => {
      expect(root.getChildIndex('a')).toBe(0);
      expect(root.getChildIndex('b')).toBe(1);
    });

    it('should return -1 for non-child', () => {
      expect(root.getChildIndex('a1')).toBe(-1);
    });
  });

  describe('visibleChildren', () => {
    it('should return all children when not collapsed', () => {
      expect(root.visibleChildren).toHaveLength(2);
    });

    it('should return empty array when collapsed', () => {
      root.collapsed = true;
      expect(root.visibleChildren).toHaveLength(0);
    });
  });

  describe('subtreeSize', () => {
    it('should count all nodes in subtree', () => {
      expect(root.subtreeSize).toBe(5);
    });

    it('should return 1 for leaf', () => {
      const leaf = root.findById('b')!;
      expect(leaf.subtreeSize).toBe(1);
    });
  });

  describe('serialization', () => {
    it('should roundtrip through toData/fromData', () => {
      const data = root.toData();
      const restored = MindMapNode.fromData(data);
      expect(restored.id).toBe('root');
      expect(restored.children).toHaveLength(2);
      expect(restored.children[0].children).toHaveLength(2);
      expect(restored.findById('a2')!.content).toBe('Grandchild A2');
    });

    it('should produce independent copies', () => {
      const data = root.toData();
      data.content = 'Modified';
      expect(root.content).toBe('Root');
    });
  });
});
