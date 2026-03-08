import { describe, it, expect, beforeEach } from 'vitest';
import { EditNodeCommand } from '../../../src/core/commands/EditNodeCommand';
import { MindMap } from '../../../src/core/MindMap';
import { createRootNode, resetIdCounter } from '../../../src/core/NodeFactory';

describe('EditNodeCommand', () => {
  let mindmap: MindMap;

  beforeEach(() => {
    resetIdCounter();
    const root = createRootNode('Original Content');
    mindmap = new MindMap('Test', root);
  });

  it('should change content on execute', () => {
    const cmd = new EditNodeCommand(mindmap, mindmap.root.id, 'New Content');
    cmd.execute();
    expect(mindmap.root.content).toBe('New Content');
  });

  it('should restore original content on undo', () => {
    const cmd = new EditNodeCommand(mindmap, mindmap.root.id, 'New Content');
    cmd.execute();
    cmd.undo();
    expect(mindmap.root.content).toBe('Original Content');
  });

  it('should update timestamp on execute', () => {
    const before = mindmap.root.updatedAt;
    const cmd = new EditNodeCommand(mindmap, mindmap.root.id, 'New Content');
    cmd.execute();
    expect(mindmap.root.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('should throw when node not found', () => {
    expect(() => new EditNodeCommand(mindmap, 'nonexistent', 'text')).toThrow('not found');
  });

  it('should have a descriptive description', () => {
    const cmd = new EditNodeCommand(mindmap, mindmap.root.id, 'New Content');
    expect(cmd.description).toContain('Original Content');
    expect(cmd.description).toContain('New Content');
  });
});
