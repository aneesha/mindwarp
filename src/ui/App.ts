import '../styles/main.css';
import '../styles/editor.css';
import type { MindMap } from '../core/MindMap';
import { EventBus } from '../core/EventBus';
import { CommandManager } from '../core/CommandManager';
import { CanvasRenderer } from '../canvas/CanvasRenderer';
import { LayoutManager } from '../layout/LayoutManager';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { renderMarkdown } from '../editor/MarkdownRenderer';
import { Toolbar } from './Toolbar';
import { ContextMenu } from './ContextMenu';
import type { ContextMenuItem } from './ContextMenu';
import { ThemeManager } from './ThemeManager';
import { Modal } from './Modal';
import { MindMap as MindMapClass } from '../core/MindMap';
import { createRootNode, createNode } from '../core/NodeFactory';
import { ChatPanel } from './ChatPanel';
import { AddNodeCommand } from '../core/commands/AddNodeCommand';
import { DeleteNodeCommand } from '../core/commands/DeleteNodeCommand';

export class App {
  private container: HTMLElement;
  private toolbarContainer!: HTMLElement;
  private canvasContainer!: HTMLElement;
  private chatContainer!: HTMLElement;
  private eventBus: EventBus;
  private mindmap: MindMap;
  private commandManager: CommandManager;
  private layoutManager: LayoutManager;
  private canvasRenderer!: CanvasRenderer;
  private markdownEditor!: MarkdownEditor;
  private toolbar!: Toolbar;
  private contextMenu: ContextMenu;
  private themeManager: ThemeManager;
  private chatPanel!: ChatPanel;

  // Hooks for export (set by external modules)
  onExportPng?: () => void;
  onExportDocx?: () => void;
  onExportPptx?: () => void;
  onSave?: () => void;
  onLoad?: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.eventBus = new EventBus();
    this.contextMenu = new ContextMenu();
    this.themeManager = new ThemeManager();

    // Create initial mindmap
    const root = createRootNode('Central Idea');
    this.mindmap = new MindMapClass('My Mindmap', root);
    this.commandManager = new CommandManager(this.eventBus);
    this.layoutManager = new LayoutManager(this.mindmap, this.eventBus);

    this.createLayout();
    this.setupComponents();
    this.setupKeyboardShortcuts();

    // Initial layout and render
    this.layoutManager.applyLayout();
    setTimeout(() => this.canvasRenderer.zoomToFit(), 100);
  }

  private createLayout(): void {
    this.toolbarContainer = document.createElement('div');
    this.toolbarContainer.className = 'mw-toolbar-container';

    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'mw-canvas-container';

    this.chatContainer = document.createElement('div');
    this.chatContainer.className = 'mw-chat-container';

    this.container.appendChild(this.toolbarContainer);
    this.container.appendChild(this.canvasContainer);
    this.container.appendChild(this.chatContainer);
  }

  private setupComponents(): void {
    // Markdown editor
    this.markdownEditor = new MarkdownEditor(this.mindmap, this.commandManager);
    this.markdownEditor.onBotMention = (nodeId, prompt) => {
      this.chatPanel?.sendBotMention(nodeId, prompt);
    };

    // Canvas renderer with markdown rendering
    this.canvasRenderer = new CanvasRenderer(
      this.canvasContainer,
      this.mindmap,
      this.eventBus,
      this.commandManager,
      this.layoutManager,
      renderMarkdown
    );

    // Wire up double-click to open editor
    this.canvasRenderer.onNodeDoubleClick = (nodeId) => {
      const nodeEl = this.canvasContainer.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
      if (nodeEl) this.markdownEditor.open(nodeId, nodeEl);
    };

    // Wire up context menu
    this.canvasRenderer.onNodeContextMenu = (nodeId, e) => {
      this.showNodeContextMenu(nodeId, e.clientX, e.clientY);
    };

    // Toolbar
    this.toolbar = new Toolbar(
      this.toolbarContainer,
      this.eventBus,
      this.commandManager,
      this.layoutManager,
      this.themeManager,
      {
        onNew: () => this.newMindmap(),
        onSave: () => this.onSave?.(),
        onLoad: () => this.onLoad?.(),
        onExportPng: () => this.onExportPng?.(),
        onExportDocx: () => this.onExportDocx?.(),
        onExportPptx: () => this.onExportPptx?.(),
        onZoomToFit: () => this.canvasRenderer.zoomToFit(),
        onLoadAI: () => this.chatPanel.loadModel(),
      }
    );

    // Chat panel
    this.chatPanel = new ChatPanel(
      this.chatContainer,
      this.eventBus,
      this.mindmap,
      this.commandManager,
      this.layoutManager
    );
  }

  private showNodeContextMenu(nodeId: string, x: number, y: number): void {
    const node = this.mindmap.findNodeById(nodeId);
    if (!node) return;

    const isRoot = nodeId === this.mindmap.root.id;
    const depth = this.mindmap.root.getPathTo(nodeId)?.length ?? 1;

    const items: ContextMenuItem[] = [
      {
        label: 'Add Child Node',
        action: () => {
          const newNode = createNode('New Node', depth);
          const cmd = new AddNodeCommand(this.mindmap, nodeId, newNode);
          this.commandManager.execute(cmd);
          this.layoutManager.applyLayout();
        },
      },
      {
        label: 'Edit Node',
        action: () => {
          const nodeEl = this.canvasContainer.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
          if (nodeEl) this.markdownEditor.open(nodeId, nodeEl);
        },
      },
      {
        label: 'Delete Node',
        action: () => {
          try {
            const cmd = new DeleteNodeCommand(this.mindmap, nodeId);
            this.commandManager.execute(cmd);
            this.layoutManager.applyLayout();
          } catch { /* can't delete root */ }
        },
        disabled: isRoot,
      },
      { label: '', action: () => {}, separator: true },
      {
        label: node.collapsed ? 'Expand' : 'Collapse',
        action: () => {
          node.collapsed = !node.collapsed;
          this.layoutManager.applyLayout();
        },
        disabled: node.children.length === 0,
      },
    ];

    this.contextMenu.show(x, y, items);
  }

  private async newMindmap(): Promise<void> {
    const confirmed = await Modal.confirm(
      'New Mindmap',
      'Create a new mindmap? Unsaved changes will be lost.'
    );
    if (!confirmed) return;

    const title = await Modal.prompt('Mindmap Title', 'My New Mindmap');
    if (!title) return;

    this.loadMindmap(new MindMapClass(title, createRootNode(title)));
  }

  loadMindmap(mindmap: MindMap): void {
    this.mindmap = mindmap;
    this.commandManager.clear();

    // Rebuild components with new mindmap
    this.canvasContainer.innerHTML = '';
    this.markdownEditor = new MarkdownEditor(this.mindmap, this.commandManager);
    this.markdownEditor.onBotMention = (nodeId, prompt) => {
      this.chatPanel?.sendBotMention(nodeId, prompt);
    };

    this.layoutManager = new LayoutManager(this.mindmap, this.eventBus);
    this.canvasRenderer = new CanvasRenderer(
      this.canvasContainer,
      this.mindmap,
      this.eventBus,
      this.commandManager,
      this.layoutManager,
      renderMarkdown
    );

    this.canvasRenderer.onNodeDoubleClick = (nodeId) => {
      const nodeEl = this.canvasContainer.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
      if (nodeEl) this.markdownEditor.open(nodeId, nodeEl);
    };
    this.canvasRenderer.onNodeContextMenu = (nodeId, e) => {
      this.showNodeContextMenu(nodeId, e.clientX, e.clientY);
    };

    this.layoutManager.applyLayout();
    setTimeout(() => this.canvasRenderer.zoomToFit(), 100);

    this.eventBus.emit('mindmap:loaded');
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Don't intercept when editing text
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.commandManager.undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'Z' && e.shiftKey))) {
        e.preventDefault();
        this.commandManager.redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.onSave?.();
      } else if (e.key === 'Delete' || (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey)) {
        const selected = this.canvasRenderer.getSelection().primary;
        if (selected && selected !== this.mindmap.root.id) {
          e.preventDefault();
          try {
            const cmd = new DeleteNodeCommand(this.mindmap, selected);
            this.commandManager.execute(cmd);
            this.canvasRenderer.getSelection().deselectAll();
            this.layoutManager.applyLayout();
          } catch { /* can't delete root */ }
        }
      } else if (e.key === 'Tab') {
        const selected = this.canvasRenderer.getSelection().primary;
        if (selected) {
          e.preventDefault();
          const depth = this.mindmap.root.getPathTo(selected)?.length ?? 1;
          const newNode = createNode('New Node', depth);
          const cmd = new AddNodeCommand(this.mindmap, selected, newNode);
          this.commandManager.execute(cmd);
          this.layoutManager.applyLayout();
        }
      } else if (e.key === 'Enter') {
        const selected = this.canvasRenderer.getSelection().primary;
        if (selected) {
          e.preventDefault();
          const nodeEl = this.canvasContainer.querySelector(`[data-node-id="${selected}"]`) as HTMLElement;
          if (nodeEl) this.markdownEditor.open(selected, nodeEl);
        }
      } else if (e.key === ' ') {
        const selected = this.canvasRenderer.getSelection().primary;
        if (selected) {
          e.preventDefault();
          const node = this.mindmap.findNodeById(selected);
          if (node && node.children.length > 0) {
            node.collapsed = !node.collapsed;
            this.layoutManager.applyLayout();
          }
        }
      } else if (e.key === 'Escape') {
        if (this.markdownEditor.isOpen) {
          this.markdownEditor.close(false);
        } else {
          this.canvasRenderer.getSelection().deselectAll();
        }
        this.contextMenu.close();
      }
    });
  }

  getMindmap(): MindMap {
    return this.mindmap;
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getCommandManager(): CommandManager {
    return this.commandManager;
  }

  getCanvasRenderer(): CanvasRenderer {
    return this.canvasRenderer;
  }

  getChatContainer(): HTMLElement {
    return this.chatContainer;
  }

  getToolbar(): Toolbar {
    return this.toolbar;
  }
}
