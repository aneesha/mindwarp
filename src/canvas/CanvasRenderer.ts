import '../styles/canvas.css';
import type { MindMap } from '../core/MindMap';
import type { EventBus } from '../core/EventBus';
import type { CommandManager } from '../core/CommandManager';
import type { LayoutManager } from '../layout/LayoutManager';
import { PanZoom } from './PanZoom';
import { ConnectionRenderer } from './ConnectionRenderer';
import { NodeElement } from './NodeElement';
import type { NodeElementCallbacks } from './NodeElement';
import { SelectionManager } from './SelectionManager';
import { DragDropManager } from './DragDropManager';
import { AddNodeCommand } from '../core/commands/AddNodeCommand';
import { DeleteNodeCommand } from '../core/commands/DeleteNodeCommand';
import { createNode } from '../core/NodeFactory';

export class CanvasRenderer {
  private container: HTMLElement;
  private canvas!: HTMLElement;
  private svgLayer!: SVGSVGElement;
  private viewport!: HTMLElement;
  private nodesLayer!: HTMLElement;
  private mindmap: MindMap;
  private eventBus: EventBus;
  private commandManager: CommandManager;
  private layoutManager: LayoutManager;
  private panZoom!: PanZoom;
  private connectionRenderer!: ConnectionRenderer;
  private selectionManager: SelectionManager;
  private dragDropManager!: DragDropManager;
  private nodeElements = new Map<string, NodeElement>();
  private renderContentFn: (content: string) => string;

  // Callbacks for external modules (editor, context menu)
  onNodeDoubleClick?: (nodeId: string) => void;
  onNodeContextMenu?: (nodeId: string, e: MouseEvent) => void;

  constructor(
    container: HTMLElement,
    mindmap: MindMap,
    eventBus: EventBus,
    commandManager: CommandManager,
    layoutManager: LayoutManager,
    renderContentFn: (content: string) => string = (c) => `<p>${c}</p>`
  ) {
    this.container = container;
    this.mindmap = mindmap;
    this.eventBus = eventBus;
    this.commandManager = commandManager;
    this.layoutManager = layoutManager;
    this.selectionManager = new SelectionManager(eventBus);
    this.renderContentFn = renderContentFn;

    this.createDOM();
    this.panZoom = new PanZoom(this.canvas, this.viewport, eventBus);
    this.connectionRenderer = new ConnectionRenderer(this.svgLayer);
    this.dragDropManager = new DragDropManager(
      this.canvas,
      mindmap,
      eventBus,
      this.nodeElements,
      () => this.panZoom.currentZoom
    );

    this.bindEvents();
    this.render();
  }

  private createDOM(): void {
    this.canvas = document.createElement('div');
    this.canvas.className = 'mw-canvas';

    this.svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgLayer.classList.add('mw-connections-layer');
    this.canvas.appendChild(this.svgLayer);

    this.viewport = document.createElement('div');
    this.viewport.className = 'mw-viewport';

    this.nodesLayer = document.createElement('div');
    this.nodesLayer.className = 'mw-nodes-layer';
    this.viewport.appendChild(this.nodesLayer);

    this.canvas.appendChild(this.viewport);

    // Zoom controls
    const zoomControls = document.createElement('div');
    zoomControls.className = 'mw-zoom-controls';

    const zoomIn = document.createElement('button');
    zoomIn.className = 'mw-zoom-btn';
    zoomIn.textContent = '+';
    zoomIn.title = 'Zoom in';
    zoomIn.addEventListener('click', () => this.panZoom.setZoom(this.panZoom.currentZoom + 0.1));

    const zoomLabel = document.createElement('div');
    zoomLabel.className = 'mw-zoom-level';
    zoomLabel.textContent = '100%';

    const zoomOut = document.createElement('button');
    zoomOut.className = 'mw-zoom-btn';
    zoomOut.textContent = '-';
    zoomOut.title = 'Zoom out';
    zoomOut.addEventListener('click', () => this.panZoom.setZoom(this.panZoom.currentZoom - 0.1));

    const zoomFit = document.createElement('button');
    zoomFit.className = 'mw-zoom-btn';
    zoomFit.textContent = '[ ]';
    zoomFit.title = 'Zoom to fit';
    zoomFit.addEventListener('click', () => this.zoomToFit());

    zoomControls.appendChild(zoomIn);
    zoomControls.appendChild(zoomLabel);
    zoomControls.appendChild(zoomOut);
    zoomControls.appendChild(zoomFit);
    this.canvas.appendChild(zoomControls);

    this.eventBus.on('canvas:zoom', (payload: unknown) => {
      const { zoom } = payload as { zoom: number };
      zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    });

    // Deselect on canvas click
    this.canvas.addEventListener('click', (e) => {
      if (e.target === this.canvas || e.target === this.viewport || e.target === this.nodesLayer) {
        this.selectionManager.deselectAll();
        this.updateSelectionVisuals();
      }
    });

    this.container.appendChild(this.canvas);
  }

  private bindEvents(): void {
    this.eventBus.on('mindmap:changed', () => this.render());
    this.eventBus.on('layout:changed', () => this.render());
    this.eventBus.on('node:moved', () => this.renderConnections());
    this.eventBus.on('node:selected', () => this.updateSelectionVisuals());
    this.eventBus.on('node:deselected', () => this.updateSelectionVisuals());
  }

  private getNodeCallbacks(): NodeElementCallbacks {
    return {
      onSelect: (nodeId, multiSelect) => {
        this.selectionManager.select(nodeId, multiSelect);
        this.updateSelectionVisuals();
      },
      onDoubleClick: (nodeId) => {
        this.onNodeDoubleClick?.(nodeId);
      },
      onAddChild: (nodeId) => {
        const depth = this.mindmap.root.getPathTo(nodeId)?.length ?? 1;
        const newNode = createNode('New Node', depth);
        const cmd = new AddNodeCommand(this.mindmap, nodeId, newNode);
        this.commandManager.execute(cmd);
        this.layoutManager.applyLayout();
      },
      onDelete: (nodeId) => {
        try {
          const cmd = new DeleteNodeCommand(this.mindmap, nodeId);
          this.commandManager.execute(cmd);
          this.selectionManager.deselect(nodeId);
          this.layoutManager.applyLayout();
        } catch {
          // Can't delete root
        }
      },
      onToggleCollapse: (nodeId) => {
        const node = this.mindmap.findNodeById(nodeId);
        if (node) {
          node.collapsed = !node.collapsed;
          this.layoutManager.applyLayout();
        }
      },
      onDragStart: (nodeId, e) => {
        if (!this.dragDropManager.dragging) {
          this.selectionManager.select(nodeId, false);
          this.updateSelectionVisuals();
          this.dragDropManager.startDrag(nodeId, e);
        }
      },
      onContextMenu: (nodeId, e) => {
        this.selectionManager.select(nodeId, false);
        this.updateSelectionVisuals();
        this.onNodeContextMenu?.(nodeId, e);
      },
    };
  }

  render(): void {
    this.clearNodes();

    const callbacks = this.getNodeCallbacks();
    const allNodes = this.mindmap.root.flatten().filter((node) => {
      // Only show nodes that are in visible paths (no collapsed ancestors)
      const path = this.mindmap.root.getPathTo(node.id);
      if (!path) return false;
      for (let i = 0; i < path.length - 1; i++) {
        if (path[i].collapsed) return false;
      }
      return true;
    });

    for (const node of allNodes) {
      const nodeEl = new NodeElement(
        node,
        this.mindmap.root.id,
        callbacks,
        this.renderContentFn
      );
      this.nodeElements.set(node.id, nodeEl);
      this.nodesLayer.appendChild(nodeEl.element);
    }

    this.renderConnections();
  }

  private renderConnections(): void {
    const htmlElements = new Map<string, HTMLElement>();
    for (const [id, nodeEl] of this.nodeElements) {
      htmlElements.set(id, nodeEl.element);
    }
    this.connectionRenderer.render(this.mindmap.root, htmlElements);
  }

  private clearNodes(): void {
    for (const nodeEl of this.nodeElements.values()) {
      nodeEl.destroy();
    }
    this.nodeElements.clear();
    this.connectionRenderer.clear();
  }

  private updateSelectionVisuals(): void {
    for (const [id, nodeEl] of this.nodeElements) {
      nodeEl.setSelected(this.selectionManager.isSelected(id));
    }
  }

  zoomToFit(): void {
    const nodes = this.mindmap.getAllNodes();
    if (nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of nodes) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.style.width);
      maxY = Math.max(maxY, node.position.y + 60);
    }

    this.panZoom.zoomToFit({ minX, minY, maxX, maxY });
  }

  getSelection(): SelectionManager {
    return this.selectionManager;
  }

  getPanZoom(): PanZoom {
    return this.panZoom;
  }

  setRenderContentFn(fn: (content: string) => string): void {
    this.renderContentFn = fn;
  }

  destroy(): void {
    this.clearNodes();
    this.panZoom.destroy();
    this.connectionRenderer.destroy();
    this.dragDropManager.destroy();
    this.canvas.remove();
  }
}
