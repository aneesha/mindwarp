import type { MindMapNode } from '../core/MindMapNode';

export class ConnectionRenderer {
  private svgLayer: SVGSVGElement;
  private paths = new Map<string, SVGPathElement>();

  constructor(svgLayer: SVGSVGElement) {
    this.svgLayer = svgLayer;
  }

  render(root: MindMapNode, nodeElements: Map<string, HTMLElement>): void {
    this.clear();
    this.renderConnections(root, nodeElements);
  }

  private renderConnections(node: MindMapNode, nodeElements: Map<string, HTMLElement>): void {
    for (const child of node.visibleChildren) {
      this.drawConnection(node, child, nodeElements);
      this.renderConnections(child, nodeElements);
    }
  }

  private drawConnection(parent: MindMapNode, child: MindMapNode, nodeElements: Map<string, HTMLElement>): void {
    const parentEl = nodeElements.get(parent.id);
    const childEl = nodeElements.get(child.id);
    if (!parentEl || !childEl) return;

    const parentPos = parent.position;
    const childPos = child.position;
    const parentWidth = parentEl.offsetWidth || parent.style.width;
    const parentHeight = parentEl.offsetHeight || 40;
    const childHeight = childEl.offsetHeight || 40;

    const x1 = parentPos.x + parentWidth;
    const y1 = parentPos.y + parentHeight / 2;
    const x2 = childPos.x;
    const y2 = childPos.y + childHeight / 2;

    const cpOffset = Math.abs(x2 - x1) * 0.4;
    const d = `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'mw-connection');
    path.style.stroke = parent.style.borderColor;

    const key = `${parent.id}-${child.id}`;
    this.paths.set(key, path);
    this.svgLayer.appendChild(path);
  }

  clear(): void {
    for (const path of this.paths.values()) {
      path.remove();
    }
    this.paths.clear();
  }

  destroy(): void {
    this.clear();
  }
}
