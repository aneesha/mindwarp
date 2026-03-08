import { describe, it, expect, beforeEach } from 'vitest';
import { serializeMindMapForContext, buildSystemPrompt } from '../../src/ai/prompts';
import { MindMap } from '../../src/core/MindMap';
import { createRootNode, createNode, resetIdCounter } from '../../src/core/NodeFactory';

describe('prompts', () => {
  let mindmap: MindMap;

  beforeEach(() => {
    resetIdCounter();
    const root = createRootNode('Project Planning');
    const timeline = createNode('Timeline');
    const resources = createNode('Resources');
    root.addChild(timeline);
    root.addChild(resources);
    const q1 = createNode('Q1 Goals');
    timeline.addChild(q1);
    mindmap = new MindMap('Project', root);
  });

  describe('serializeMindMapForContext', () => {
    it('should produce a readable tree structure', () => {
      const result = serializeMindMapForContext(mindmap);
      expect(result).toContain('Project');
      expect(result).toContain('Project Planning');
      expect(result).toContain('Timeline');
      expect(result).toContain('Resources');
      expect(result).toContain('Q1 Goals');
    });

    it('should include node IDs', () => {
      const result = serializeMindMapForContext(mindmap);
      expect(result).toContain('[id:');
    });

    it('should use indentation for depth', () => {
      const result = serializeMindMapForContext(mindmap);
      const lines = result.split('\n');
      const timelineLine = lines.find((l) => l.includes('Timeline'));
      const q1Line = lines.find((l) => l.includes('Q1 Goals'));
      expect(timelineLine).toBeDefined();
      expect(q1Line).toBeDefined();
      // Q1 Goals should be more indented than Timeline
      const timelineIndent = timelineLine!.search(/\S/);
      const q1Indent = q1Line!.search(/\S/);
      expect(q1Indent).toBeGreaterThan(timelineIndent);
    });
  });

  describe('buildSystemPrompt', () => {
    it('should include mindmap context', () => {
      const context = serializeMindMapForContext(mindmap);
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('Project Planning');
      expect(prompt).toContain('<<ADD');
      expect(prompt).toContain('<<EDIT');
      expect(prompt).toContain('<<DELETE');
    });
  });
});
