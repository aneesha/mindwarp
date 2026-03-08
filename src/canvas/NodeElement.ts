import type { MindMapNode } from '../core/MindMapNode';

export interface NodeElementCallbacks {
  onSelect: (nodeId: string, multiSelect: boolean) => void;
  onDoubleClick: (nodeId: string) => void;
  onAddChild: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  onDragStart: (nodeId: string, e: PointerEvent) => void;
  onContextMenu: (nodeId: string, e: MouseEvent) => void;
}

export class NodeElement {
  readonly element: HTMLElement;
  readonly nodeId: string;
  private callbacks: NodeElementCallbacks;
  private isRoot: boolean;

  constructor(
    node: MindMapNode,
    rootId: string,
    callbacks: NodeElementCallbacks,
    renderContent: (content: string) => string
  ) {
    this.nodeId = node.id;
    this.callbacks = callbacks;
    this.isRoot = node.id === rootId;
    this.element = this.createElement(node, renderContent);
    this.bindEvents();
  }

  private createElement(
    node: MindMapNode,
    renderContent: (content: string) => string
  ): HTMLElement {
    const el = document.createElement('div');
    el.className = `mw-node${this.isRoot ? ' mw-root' : ''}`;
    el.dataset.nodeId = node.id;
    el.style.transform = `translate(${node.position.x}px, ${node.position.y}px)`;
    el.style.borderColor = node.style.borderColor;
    el.style.backgroundColor = node.style.backgroundColor;
    el.style.color = node.style.textColor;
    el.style.fontSize = `${node.style.fontSize}px`;
    el.style.maxWidth = `${node.style.width}px`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'mw-node-content';
    contentDiv.innerHTML = renderContent(node.content);
    el.appendChild(contentDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'mw-node-actions';

    const addBtn = document.createElement('button');
    addBtn.className = 'mw-node-btn mw-btn-add-child';
    addBtn.title = 'Add child node';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onAddChild(node.id);
    });
    actionsDiv.appendChild(addBtn);

    if (node.children.length > 0) {
      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'mw-node-btn mw-btn-collapse';
      collapseBtn.title = node.collapsed ? 'Expand' : 'Collapse';
      collapseBtn.textContent = node.collapsed ? '+' : '-';
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onToggleCollapse(node.id);
      });
      actionsDiv.appendChild(collapseBtn);
    }

    if (!this.isRoot) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'mw-node-btn mw-btn-delete';
      deleteBtn.title = 'Delete node';
      deleteBtn.textContent = 'x';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onDelete(node.id);
      });
      actionsDiv.appendChild(deleteBtn);
    }

    el.appendChild(actionsDiv);

    if (node.collapsed && node.children.length > 0) {
      const badge = document.createElement('div');
      badge.className = 'mw-collapse-badge';
      badge.textContent = String(node.subtreeSize - 1);
      badge.title = `${node.subtreeSize - 1} hidden nodes`;
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onToggleCollapse(node.id);
      });
      el.appendChild(badge);
    }

    return el;
  }

  private bindEvents(): void {
    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onSelect(this.nodeId, e.shiftKey || e.metaKey);
    });

    this.element.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.callbacks.onDoubleClick(this.nodeId);
    });

    this.element.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.mw-node-btn, .mw-collapse-badge')) return;
      this.callbacks.onDragStart(this.nodeId, e);
    });

    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.callbacks.onContextMenu(this.nodeId, e);
    });
  }

  updatePosition(x: number, y: number): void {
    this.element.style.transform = `translate(${x}px, ${y}px)`;
  }

  setSelected(selected: boolean): void {
    this.element.classList.toggle('mw-selected', selected);
  }

  setDragging(dragging: boolean): void {
    this.element.classList.toggle('mw-dragging', dragging);
  }

  destroy(): void {
    this.element.remove();
  }
}
