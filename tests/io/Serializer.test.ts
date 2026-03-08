import { describe, it, expect, beforeEach } from 'vitest';
import { validateMindMapData, migrateData } from '../../src/io/Serializer';
import { MindMap } from '../../src/core/MindMap';
import { createRootNode, createNode, resetIdCounter } from '../../src/core/NodeFactory';

describe('Serializer', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('validateMindMapData', () => {
    it('should validate correct mindmap data', () => {
      const root = createRootNode('Test');
      const child = createNode('Child');
      root.addChild(child);
      const mindmap = new MindMap('Test Map', root);
      const data = mindmap.serialize();
      expect(validateMindMapData(data)).toBe(true);
    });

    it('should reject null', () => {
      expect(validateMindMapData(null)).toBe(false);
    });

    it('should reject empty object', () => {
      expect(validateMindMapData({})).toBe(false);
    });

    it('should reject missing version', () => {
      expect(validateMindMapData({
        title: 'Test',
        root: { id: 'r', content: 'R', children: [], position: { x: 0, y: 0 }, style: {} },
        metadata: {},
      })).toBe(false);
    });

    it('should reject missing root', () => {
      expect(validateMindMapData({
        version: '1.0.0',
        title: 'Test',
        metadata: {},
      })).toBe(false);
    });

    it('should reject invalid children', () => {
      expect(validateMindMapData({
        version: '1.0.0',
        title: 'Test',
        root: { id: 'r', content: 'R', children: ['bad'], position: { x: 0, y: 0 }, style: {} },
        metadata: {},
      })).toBe(false);
    });
  });

  describe('migrateData', () => {
    it('should add version if missing', () => {
      const data = { title: 'Test', root: {}, metadata: {} } as any;
      const result = migrateData(data);
      expect(result.version).toBeDefined();
    });

    it('should keep existing version', () => {
      const root = createRootNode('Test');
      const mindmap = new MindMap('Test', root);
      const data = mindmap.serialize();
      const result = migrateData(data);
      expect(result.version).toBe(data.version);
    });
  });

  describe('roundtrip', () => {
    it('should serialize and deserialize correctly', () => {
      const root = createRootNode('Project');
      const child1 = createNode('Branch 1');
      const child2 = createNode('Branch 2');
      const grandchild = createNode('Sub-topic');
      child1.addChild(grandchild);
      root.addChild(child1);
      root.addChild(child2);

      const mindmap = new MindMap('My Project', root, { author: 'Tester' });
      const data = mindmap.serialize();
      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);

      expect(validateMindMapData(parsed)).toBe(true);
      const restored = MindMap.deserialize(parsed);
      expect(restored.title).toBe('My Project');
      expect(restored.root.children).toHaveLength(2);
      expect(restored.root.children[0].children[0].content).toBe('Sub-topic');
      expect(restored.metadata.author).toBe('Tester');
    });
  });
});
