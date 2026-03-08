import { describe, it, expect } from 'vitest';
import { TreeRightLayout } from '../../src/layout/TreeRightLayout';
import type { MindMapNodeData } from '../../src/types';
import { DEFAULT_NODE_STYLE, ROOT_NODE_STYLE } from '../../src/constants';

function makeNodeData(id: string, children: MindMapNodeData[] = [], collapsed = false): MindMapNodeData {
  return {
    id,
    content: id,
    children,
    position: { x: 0, y: 0 },
    style: id === 'root' ? { ...ROOT_NODE_STYLE } : { ...DEFAULT_NODE_STYLE },
    collapsed,
    createdAt: 1000,
    updatedAt: 1000,
  };
}

describe('TreeRightLayout', () => {
  const layout = new TreeRightLayout();

  it('should have correct name', () => {
    expect(layout.name).toBe('tree-right');
  });

  it('should position single root node', () => {
    const root = makeNodeData('root');
    const positions = layout.calculate(root);
    expect(positions.has('root')).toBe(true);
    const pos = positions.get('root')!;
    expect(pos.x).toBe(80);
  });

  it('should position children to the right of parent', () => {
    const root = makeNodeData('root', [
      makeNodeData('child1'),
      makeNodeData('child2'),
    ]);
    const positions = layout.calculate(root);
    const rootPos = positions.get('root')!;
    const child1Pos = positions.get('child1')!;
    const child2Pos = positions.get('child2')!;

    expect(child1Pos.x).toBeGreaterThan(rootPos.x);
    expect(child2Pos.x).toBeGreaterThan(rootPos.x);
    expect(child1Pos.x).toBe(child2Pos.x);
  });

  it('should stack children vertically', () => {
    const root = makeNodeData('root', [
      makeNodeData('child1'),
      makeNodeData('child2'),
      makeNodeData('child3'),
    ]);
    const positions = layout.calculate(root);
    const c1 = positions.get('child1')!;
    const c2 = positions.get('child2')!;
    const c3 = positions.get('child3')!;

    expect(c1.y).toBeLessThan(c2.y);
    expect(c2.y).toBeLessThan(c3.y);
  });

  it('should position grandchildren further right', () => {
    const root = makeNodeData('root', [
      makeNodeData('child', [
        makeNodeData('grandchild'),
      ]),
    ]);
    const positions = layout.calculate(root);
    const childPos = positions.get('child')!;
    const grandchildPos = positions.get('grandchild')!;
    expect(grandchildPos.x).toBeGreaterThan(childPos.x);
  });

  it('should not position collapsed children', () => {
    const root = makeNodeData('root', [
      makeNodeData('child', [
        makeNodeData('hidden'),
      ], true),
    ]);
    const positions = layout.calculate(root);
    expect(positions.has('root')).toBe(true);
    expect(positions.has('child')).toBe(true);
    expect(positions.has('hidden')).toBe(false);
  });

  it('should return positions for all visible nodes', () => {
    const root = makeNodeData('root', [
      makeNodeData('a', [makeNodeData('a1'), makeNodeData('a2')]),
      makeNodeData('b'),
    ]);
    const positions = layout.calculate(root);
    expect(positions.size).toBe(5);
  });
});
