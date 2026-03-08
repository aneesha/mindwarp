import type { MindMap } from '../core/MindMap';
import type { EventBus } from '../core/EventBus';
import type { NodeElement } from './NodeElement';

export class DragDropManager {
  private isDragging = false;
  private dragNodeId: string | null = null;
  private startX = 0;
  private startY = 0;
  private origX = 0;
  private origY = 0;
  private canvas: HTMLElement;
  private mindmap: MindMap;
  private eventBus: EventBus;
  private nodeElements: Map<string, NodeElement>;
  private currentZoom: () => number;

  constructor(
    canvas: HTMLElement,
    mindmap: MindMap,
    eventBus: EventBus,
    nodeElements: Map<string, NodeElement>,
    currentZoom: () => number
  ) {
    this.canvas = canvas;
    this.mindmap = mindmap;
    this.eventBus = eventBus;
    this.nodeElements = nodeElements;
    this.currentZoom = currentZoom;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
  }

  startDrag(nodeId: string, e: PointerEvent): void {
    const node = this.mindmap.findNodeById(nodeId);
    if (!node) return;
    // Don't allow dragging root
    if (node === this.mindmap.root) return;

    this.isDragging = true;
    this.dragNodeId = nodeId;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.origX = node.position.x;
    this.origY = node.position.y;

    const nodeEl = this.nodeElements.get(nodeId);
    if (nodeEl) nodeEl.setDragging(true);
    this.canvas.classList.add('mw-dragging-node');
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging || !this.dragNodeId) return;

    const zoom = this.currentZoom();
    const dx = (e.clientX - this.startX) / zoom;
    const dy = (e.clientY - this.startY) / zoom;

    const node = this.mindmap.findNodeById(this.dragNodeId);
    if (!node) return;

    node.position.x = this.origX + dx;
    node.position.y = this.origY + dy;

    const nodeEl = this.nodeElements.get(this.dragNodeId);
    if (nodeEl) {
      nodeEl.updatePosition(node.position.x, node.position.y);
    }

    this.eventBus.emit('node:moved', { nodeId: this.dragNodeId });
  };

  private onPointerUp = (_e: PointerEvent): void => {
    if (!this.isDragging || !this.dragNodeId) return;

    const nodeEl = this.nodeElements.get(this.dragNodeId);
    if (nodeEl) nodeEl.setDragging(false);
    this.canvas.classList.remove('mw-dragging-node');

    this.isDragging = false;
    this.dragNodeId = null;
  };

  get dragging(): boolean {
    return this.isDragging;
  }

  destroy(): void {
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
  }
}
