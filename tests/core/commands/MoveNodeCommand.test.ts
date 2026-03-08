import { describe, it, expect, beforeEach } from 'vitest';
import { MoveNodeCommand } from '../../../src/core/commands/MoveNodeCommand';
import { MindMap } from '../../../src/core/MindMap';
import { createNode, createRootNode, resetIdCounter } from '../../../src/core/NodeFactory';

describe('MoveNodeCommand', () => {
  let mindmap: MindMap;
  let childAId: string;
  let childBId: string;
  let grandchildId: string;

  beforeEach(() => {
    resetIdCounter();
    const root = createRootNode('Root');
    const childA = createNode('Child A');
    const childB = createNode('Child B');
    const grandchild = createNode('Grandchild');
    childAId = childA.id;
    childBId = childB.id;
    grandchildId = grandchild.id;
    childA.addChild(grandchild);
    root.addChild(childA);
    root.addChild(childB);
    mindmap = new MindMap('Test', root);
  });

  it('should move node to new parent', () => {
    const cmd = new MoveNodeCommand(mindmap, grandchildId, childBId);
    cmd.execute();
    expect(mindmap.findNodeById(childAId)!.children).toHaveLength(0);
    expect(mindmap.findNodeById(childBId)!.children).toHaveLength(1);
    expect(mindmap.findNodeById(childBId)!.children[0].content).toBe('Grandchild');
  });

  it('should restore node on undo', () => {
    const cmd = new MoveNodeCommand(mindmap, grandchildId, childBId);
    cmd.execute();
    cmd.undo();
    expect(mindmap.findNodeById(childAId)!.children).toHaveLength(1);
    expect(mindmap.findNodeById(childBId)!.children).toHaveLength(0);
  });

  it('should move between siblings', () => {
    const cmd = new MoveNodeCommand(mindmap, childAId, childBId);
    cmd.execute();
    expect(mindmap.root.children).toHaveLength(1);
    expect(mindmap.root.children[0].id).toBe(childBId);
    expect(mindmap.findNodeById(childBId)!.children[0].id).toBe(childAId);
  });

  it('should throw when trying to move root', () => {
    expect(
      () => new MoveNodeCommand(mindmap, mindmap.root.id, childAId)
    ).toThrow('Cannot move root node');
  });

  it('should throw when node not found', () => {
    expect(
      () => new MoveNodeCommand(mindmap, 'nonexistent', childBId)
    ).toThrow('not found');
  });
});
