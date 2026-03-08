import { describe, it, expect } from 'vitest';
import { MindMap } from '../../src/core/MindMap';
import { MindMapNode } from '../../src/core/MindMapNode';
import type { MindMapNodeData } from '../../src/types';
import { DEFAULT_NODE_STYLE, MINDWARP_FILE_VERSION } from '../../src/constants';

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

describe('MindMap', () => {
  it('should create a mindmap with title and root', () => {
    const root = new MindMapNode(makeNodeData('root', 'Root'));
    const map = new MindMap('Test Map', root);
    expect(map.title).toBe('Test Map');
    expect(map.root.id).toBe('root');
  });

  it('should set default metadata', () => {
    const root = new MindMapNode(makeNodeData('root', 'Root'));
    const map = new MindMap('Test Map', root);
    expect(map.metadata.author).toBe('');
    expect(map.metadata.description).toBe('');
    expect(map.metadata.createdAt).toBeGreaterThan(0);
  });

  it('should accept custom metadata', () => {
    const root = new MindMapNode(makeNodeData('root', 'Root'));
    const map = new MindMap('Test Map', root, { author: 'Test Author' });
    expect(map.metadata.author).toBe('Test Author');
  });

  it('should find nodes by id', () => {
    const root = new MindMapNode(
      makeNodeData('root', 'Root', [
        makeNodeData('a', 'Child A'),
      ])
    );
    const map = new MindMap('Test', root);
    expect(map.findNodeById('a')!.content).toBe('Child A');
    expect(map.findNodeById('nonexistent')).toBeNull();
  });

  it('should find parent of node', () => {
    const root = new MindMapNode(
      makeNodeData('root', 'Root', [
        makeNodeData('a', 'Child A'),
      ])
    );
    const map = new MindMap('Test', root);
    expect(map.findParentOf('a')!.id).toBe('root');
  });

  it('should return all nodes', () => {
    const root = new MindMapNode(
      makeNodeData('root', 'Root', [
        makeNodeData('a', 'Child A', [
          makeNodeData('a1', 'Grandchild'),
        ]),
      ])
    );
    const map = new MindMap('Test', root);
    expect(map.getAllNodes()).toHaveLength(3);
  });

  it('should return node count', () => {
    const root = new MindMapNode(
      makeNodeData('root', 'Root', [
        makeNodeData('a', 'A'),
        makeNodeData('b', 'B'),
      ])
    );
    const map = new MindMap('Test', root);
    expect(map.nodeCount).toBe(3);
  });

  describe('serialization', () => {
    it('should serialize to MindMapData', () => {
      const root = new MindMapNode(makeNodeData('root', 'Root'));
      const map = new MindMap('Test', root);
      const data = map.serialize();
      expect(data.version).toBe(MINDWARP_FILE_VERSION);
      expect(data.title).toBe('Test');
      expect(data.root.id).toBe('root');
    });

    it('should roundtrip through serialize/deserialize', () => {
      const root = new MindMapNode(
        makeNodeData('root', 'Root', [
          makeNodeData('a', 'Child A'),
        ])
      );
      const original = new MindMap('Test', root, { author: 'Author' });
      const data = original.serialize();
      const restored = MindMap.deserialize(data);
      expect(restored.title).toBe('Test');
      expect(restored.root.children).toHaveLength(1);
      expect(restored.metadata.author).toBe('Author');
    });
  });
});
