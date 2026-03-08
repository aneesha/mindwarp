import { describe, it, expect } from 'vitest';
import { RadialLayout } from '../../src/layout/RadialLayout';
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

describe('RadialLayout', () => {
  const layout = new RadialLayout();

  it('should have correct name', () => {
    expect(layout.name).toBe('radial');
  });

  it('should position root at origin', () => {
    const root = makeNodeData('root', [makeNodeData('a')]);
    const positions = layout.calculate(root);
    expect(positions.get('root')).toEqual({ x: 0, y: 0 });
  });

  it('should position children around the root', () => {
    const root = makeNodeData('root', [
      makeNodeData('a'),
      makeNodeData('b'),
      makeNodeData('c'),
    ]);
    const positions = layout.calculate(root);
    expect(positions.size).toBe(4);

    // All children should be at the same radius from center
    const distances = ['a', 'b', 'c'].map((id) => {
      const pos = positions.get(id)!;
      return Math.sqrt(pos.x ** 2 + pos.y ** 2);
    });
    expect(distances[0]).toBeCloseTo(distances[1], 0);
    expect(distances[1]).toBeCloseTo(distances[2], 0);
  });

  it('should position grandchildren further from center', () => {
    const root = makeNodeData('root', [
      makeNodeData('a', [makeNodeData('a1')]),
    ]);
    const positions = layout.calculate(root);
    const aPos = positions.get('a')!;
    const a1Pos = positions.get('a1')!;
    const aDist = Math.sqrt(aPos.x ** 2 + aPos.y ** 2);
    const a1Dist = Math.sqrt(a1Pos.x ** 2 + a1Pos.y ** 2);
    expect(a1Dist).toBeGreaterThan(aDist);
  });

  it('should not position collapsed children', () => {
    const root = makeNodeData('root', [
      makeNodeData('a', [makeNodeData('hidden')], true),
    ]);
    const positions = layout.calculate(root);
    expect(positions.has('hidden')).toBe(false);
  });

  it('should handle single child', () => {
    const root = makeNodeData('root', [makeNodeData('only')]);
    const positions = layout.calculate(root);
    expect(positions.size).toBe(2);
  });
});
