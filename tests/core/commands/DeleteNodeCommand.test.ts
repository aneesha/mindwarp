import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteNodeCommand } from '../../../src/core/commands/DeleteNodeCommand';
import { MindMap } from '../../../src/core/MindMap';
import { createNode, createRootNode, resetIdCounter } from '../../../src/core/NodeFactory';

describe('DeleteNodeCommand', () => {
  let mindmap: MindMap;
  let childId: string;

  beforeEach(() => {
    resetIdCounter();
    const root = createRootNode('Root');
    const child = createNode('Child');
    childId = child.id;
    root.addChild(child);
    const grandchild = createNode('Grandchild');
    child.addChild(grandchild);
    mindmap = new MindMap('Test', root);
  });

  it('should remove the node on execute', () => {
    const cmd = new DeleteNodeCommand(mindmap, childId);
    cmd.execute();
    expect(mindmap.root.children).toHaveLength(0);
  });

  it('should restore the node with children on undo', () => {
    const cmd = new DeleteNodeCommand(mindmap, childId);
    cmd.execute();
    cmd.undo();
    expect(mindmap.root.children).toHaveLength(1);
    expect(mindmap.root.children[0].content).toBe('Child');
    expect(mindmap.root.children[0].children).toHaveLength(1);
    expect(mindmap.root.children[0].children[0].content).toBe('Grandchild');
  });

  it('should restore at the correct index', () => {
    const child2 = createNode('Child 2');
    mindmap.root.addChild(child2);
    const cmd = new DeleteNodeCommand(mindmap, childId);
    cmd.execute();
    cmd.undo();
    expect(mindmap.root.children[0].content).toBe('Child');
    expect(mindmap.root.children[1].content).toBe('Child 2');
  });

  it('should throw when trying to delete root', () => {
    expect(() => new DeleteNodeCommand(mindmap, mindmap.root.id)).toThrow('Cannot delete root node');
  });

  it('should throw when node not found', () => {
    expect(() => new DeleteNodeCommand(mindmap, 'nonexistent')).toThrow('not found');
  });
});
