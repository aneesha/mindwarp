import { describe, it, expect, beforeEach } from 'vitest';
import { AddNodeCommand } from '../../../src/core/commands/AddNodeCommand';
import { MindMap } from '../../../src/core/MindMap';
import { MindMapNode } from '../../../src/core/MindMapNode';
import { createNode, createRootNode, resetIdCounter } from '../../../src/core/NodeFactory';

describe('AddNodeCommand', () => {
  let mindmap: MindMap;

  beforeEach(() => {
    resetIdCounter();
    const root = createRootNode('Root');
    mindmap = new MindMap('Test', root);
  });

  it('should add a child node on execute', () => {
    const child = createNode('Child');
    const cmd = new AddNodeCommand(mindmap, mindmap.root.id, child);
    cmd.execute();
    expect(mindmap.root.children).toHaveLength(1);
    expect(mindmap.root.children[0].content).toBe('Child');
  });

  it('should remove the child on undo', () => {
    const child = createNode('Child');
    const cmd = new AddNodeCommand(mindmap, mindmap.root.id, child);
    cmd.execute();
    cmd.undo();
    expect(mindmap.root.children).toHaveLength(0);
  });

  it('should add at a specific index', () => {
    const child1 = createNode('First');
    const child2 = createNode('Second');
    const cmd1 = new AddNodeCommand(mindmap, mindmap.root.id, child1);
    cmd1.execute();
    const cmd2 = new AddNodeCommand(mindmap, mindmap.root.id, child2, 0);
    cmd2.execute();
    expect(mindmap.root.children[0].content).toBe('Second');
    expect(mindmap.root.children[1].content).toBe('First');
  });

  it('should throw when parent not found', () => {
    const child = createNode('Child');
    const cmd = new AddNodeCommand(mindmap, 'nonexistent', child);
    expect(() => cmd.execute()).toThrow('Parent node nonexistent not found');
  });

  it('should have a descriptive description', () => {
    const child = createNode('My new node');
    const cmd = new AddNodeCommand(mindmap, mindmap.root.id, child);
    expect(cmd.description).toContain('My new node');
  });
});
