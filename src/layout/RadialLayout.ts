import type { ILayoutStrategy, MindMapNodeData, Position } from '../types';

export class RadialLayout implements ILayoutStrategy {
  readonly name = 'radial';

  calculate(root: MindMapNodeData): Map<string, Position> {
    const positions = new Map<string, Position>();
    positions.set(root.id, { x: 0, y: 0 });

    const visibleChildren = root.collapsed ? [] : root.children;
    if (visibleChildren.length === 0) return positions;

    const subtreeSizes = new Map<string, number>();
    for (const child of visibleChildren) {
      subtreeSizes.set(child.id, this.getSubtreeSize(child));
    }

    const totalSize = [...subtreeSizes.values()].reduce((a, b) => a + b, 0);
    let currentAngle = -Math.PI / 2;

    for (const child of visibleChildren) {
      const size = subtreeSizes.get(child.id) || 1;
      const angleSpan = (size / totalSize) * 2 * Math.PI;
      const midAngle = currentAngle + angleSpan / 2;

      this.positionSubtree(child, midAngle, 200, angleSpan, positions);
      currentAngle += angleSpan;
    }

    return positions;
  }

  private positionSubtree(
    node: MindMapNodeData,
    angle: number,
    radius: number,
    angleSpan: number,
    positions: Map<string, Position>
  ): void {
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    positions.set(node.id, { x, y });

    const visibleChildren = node.collapsed ? [] : node.children;
    if (visibleChildren.length === 0) return;

    const subtreeSizes = new Map<string, number>();
    for (const child of visibleChildren) {
      subtreeSizes.set(child.id, this.getSubtreeSize(child));
    }

    const totalSize = [...subtreeSizes.values()].reduce((a, b) => a + b, 0);
    let currentAngle = angle - angleSpan / 2;
    const nextRadius = radius + 160;

    for (const child of visibleChildren) {
      const size = subtreeSizes.get(child.id) || 1;
      const childSpan = (size / totalSize) * angleSpan;
      const midAngle = currentAngle + childSpan / 2;

      this.positionSubtree(child, midAngle, nextRadius, childSpan, positions);
      currentAngle += childSpan;
    }
  }

  private getSubtreeSize(node: MindMapNodeData): number {
    if (node.collapsed || node.children.length === 0) return 1;
    return 1 + node.children.reduce((sum, child) => sum + this.getSubtreeSize(child), 0);
  }
}
