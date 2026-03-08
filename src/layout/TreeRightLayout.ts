import type { ILayoutStrategy, MindMapNodeData, Position } from '../types';
import { LAYOUT } from '../constants';

export class TreeRightLayout implements ILayoutStrategy {
  readonly name = 'tree-right';

  calculate(root: MindMapNodeData): Map<string, Position> {
    const positions = new Map<string, Position>();
    const subtreeHeights = new Map<string, number>();

    this.calculateSubtreeHeights(root, subtreeHeights);
    this.positionNode(root, 80, 0, subtreeHeights, positions);

    // Center vertically: shift all positions so root is near center
    const allPositions = [...positions.values()];
    if (allPositions.length > 0) {
      const minY = Math.min(...allPositions.map((p) => p.y));
      const maxY = Math.max(...allPositions.map((p) => p.y));
      const totalHeight = maxY - minY;
      const offsetY = -totalHeight / 2;
      for (const [id, pos] of positions) {
        positions.set(id, { x: pos.x, y: pos.y + offsetY });
      }
    }

    return positions;
  }

  private calculateSubtreeHeights(
    node: MindMapNodeData,
    heights: Map<string, number>
  ): number {
    const visibleChildren = node.collapsed ? [] : node.children;

    if (visibleChildren.length === 0) {
      const h = LAYOUT.NODE_MIN_HEIGHT;
      heights.set(node.id, h);
      return h;
    }

    let totalHeight = 0;
    for (const child of visibleChildren) {
      totalHeight += this.calculateSubtreeHeights(child, heights);
    }
    totalHeight += (visibleChildren.length - 1) * LAYOUT.VERTICAL_GAP;

    heights.set(node.id, totalHeight);
    return totalHeight;
  }

  private positionNode(
    node: MindMapNodeData,
    x: number,
    yStart: number,
    heights: Map<string, number>,
    positions: Map<string, Position>
  ): void {
    const subtreeHeight = heights.get(node.id) || LAYOUT.NODE_MIN_HEIGHT;
    const nodeY = yStart + subtreeHeight / 2 - LAYOUT.NODE_MIN_HEIGHT / 2;

    positions.set(node.id, { x, y: nodeY });

    const visibleChildren = node.collapsed ? [] : node.children;
    if (visibleChildren.length === 0) return;

    const childX = x + node.style.width + LAYOUT.HORIZONTAL_GAP;
    let currentY = yStart;

    for (const child of visibleChildren) {
      const childHeight = heights.get(child.id) || LAYOUT.NODE_MIN_HEIGHT;
      this.positionNode(child, childX, currentY, heights, positions);
      currentY += childHeight + LAYOUT.VERTICAL_GAP;
    }
  }
}
