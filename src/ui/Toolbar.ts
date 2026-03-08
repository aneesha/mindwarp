import '../styles/toolbar.css';
import type { EventBus } from '../core/EventBus';
import type { CommandManager } from '../core/CommandManager';
import type { LayoutManager } from '../layout/LayoutManager';
import type { ThemeManager } from './ThemeManager';

export interface ToolbarCallbacks {
  onNew: () => void;
  onSave: () => void;
  onLoad: () => void;
  onExportPng: () => void;
  onExportDocx: () => void;
  onExportPptx: () => void;
  onZoomToFit: () => void;
  onLoadAI: () => void;
}

export class Toolbar {
  private container: HTMLElement;
  private eventBus: EventBus;
  private commandManager: CommandManager;
  private layoutManager: LayoutManager;
  private themeManager: ThemeManager;
  private callbacks: ToolbarCallbacks;
  private undoBtn!: HTMLButtonElement;
  private redoBtn!: HTMLButtonElement;
  private aiDot!: HTMLElement;
  private aiLabel!: HTMLElement;

  constructor(
    container: HTMLElement,
    eventBus: EventBus,
    commandManager: CommandManager,
    layoutManager: LayoutManager,
    themeManager: ThemeManager,
    callbacks: ToolbarCallbacks
  ) {
    this.container = container;
    this.eventBus = eventBus;
    this.commandManager = commandManager;
    this.layoutManager = layoutManager;
    this.themeManager = themeManager;
    this.callbacks = callbacks;
    this.render();
    this.bindEvents();
  }

  private render(): void {
    const toolbar = document.createElement('div');
    toolbar.className = 'mw-toolbar';

    // Brand
    const brand = document.createElement('span');
    brand.className = 'mw-toolbar-brand';
    brand.textContent = 'MindWarp';
    toolbar.appendChild(brand);

    toolbar.appendChild(this.createDivider());

    // File actions
    toolbar.appendChild(this.createButton('New', 'New mindmap', () => this.callbacks.onNew()));
    toolbar.appendChild(this.createButton('Save', 'Save (Ctrl+S)', () => this.callbacks.onSave()));
    toolbar.appendChild(this.createButton('Load', 'Load file', () => this.callbacks.onLoad()));

    toolbar.appendChild(this.createDivider());

    // Undo/Redo
    this.undoBtn = this.createButton('Undo', 'Undo (Ctrl+Z)', () => this.commandManager.undo()) as HTMLButtonElement;
    this.redoBtn = this.createButton('Redo', 'Redo (Ctrl+Y)', () => this.commandManager.redo()) as HTMLButtonElement;
    toolbar.appendChild(this.undoBtn);
    toolbar.appendChild(this.redoBtn);

    toolbar.appendChild(this.createDivider());

    // Layout dropdown
    const layoutDropdown = this.createDropdown('Layout', [
      { label: 'Tree Right', action: () => { this.layoutManager.setStrategy('tree-right'); this.layoutManager.applyLayout(); } },
      { label: 'Radial', action: () => { this.layoutManager.setStrategy('radial'); this.layoutManager.applyLayout(); } },
    ]);
    toolbar.appendChild(layoutDropdown);

    // Export dropdown
    const exportDropdown = this.createDropdown('Export', [
      { label: 'PNG Image', action: () => this.callbacks.onExportPng() },
      { label: 'Word Document', action: () => this.callbacks.onExportDocx() },
      { label: 'PowerPoint', action: () => this.callbacks.onExportPptx() },
    ]);
    toolbar.appendChild(exportDropdown);

    toolbar.appendChild(this.createButton('Fit', 'Zoom to fit', () => this.callbacks.onZoomToFit()));

    toolbar.appendChild(this.createDivider());

    // Theme toggle
    toolbar.appendChild(this.createButton(
      this.themeManager.theme === 'dark' ? 'Light' : 'Dark',
      'Toggle theme',
      () => {
        this.themeManager.toggle();
        // Update button text
        const btn = toolbar.querySelector('[title="Toggle theme"]') as HTMLElement;
        if (btn) btn.textContent = this.themeManager.theme === 'dark' ? 'Light' : 'Dark';
      }
    ));

    // Spacer
    const spacer = document.createElement('div');
    spacer.className = 'mw-toolbar-spacer';
    toolbar.appendChild(spacer);

    // AI Status
    const aiStatus = document.createElement('button');
    aiStatus.className = 'mw-toolbar-btn mw-ai-status';
    aiStatus.title = 'Click to load AI model';
    aiStatus.addEventListener('click', () => this.callbacks.onLoadAI());

    this.aiDot = document.createElement('span');
    this.aiDot.className = 'mw-ai-dot';

    this.aiLabel = document.createElement('span');
    this.aiLabel.textContent = 'Load AI';

    aiStatus.appendChild(this.aiDot);
    aiStatus.appendChild(this.aiLabel);
    toolbar.appendChild(aiStatus);

    this.container.appendChild(toolbar);
    this.updateUndoRedoState();
  }

  private createButton(label: string, title: string, action: () => void): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'mw-toolbar-btn';
    btn.textContent = label;
    btn.title = title;
    btn.addEventListener('click', action);
    return btn;
  }

  private createDivider(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'mw-toolbar-divider';
    return div;
  }

  private createDropdown(label: string, items: { label: string; action: () => void }[]): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'mw-dropdown';

    const btn = document.createElement('button');
    btn.className = 'mw-toolbar-btn';
    btn.textContent = label;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('mw-open');
      const closeHandler = () => {
        dropdown.classList.remove('mw-open');
        document.removeEventListener('click', closeHandler);
      };
      if (dropdown.classList.contains('mw-open')) {
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
      }
    });
    dropdown.appendChild(btn);

    const menu = document.createElement('div');
    menu.className = 'mw-dropdown-menu';
    for (const item of items) {
      const menuItem = document.createElement('button');
      menuItem.className = 'mw-dropdown-item';
      menuItem.textContent = item.label;
      menuItem.addEventListener('click', () => {
        item.action();
        dropdown.classList.remove('mw-open');
      });
      menu.appendChild(menuItem);
    }
    dropdown.appendChild(menu);

    return dropdown;
  }

  private bindEvents(): void {
    this.eventBus.on('command:executed', () => this.updateUndoRedoState());
    this.eventBus.on('command:undone', () => this.updateUndoRedoState());
    this.eventBus.on('command:redone', () => this.updateUndoRedoState());
    this.eventBus.on('ai:loading', () => this.updateAIStatus('loading'));
    this.eventBus.on('ai:ready', () => this.updateAIStatus('ready'));
    this.eventBus.on('ai:generating', () => this.updateAIStatus('generating'));
    this.eventBus.on('ai:complete', () => this.updateAIStatus('ready'));
    this.eventBus.on('ai:error', () => this.updateAIStatus('error'));
  }

  private updateUndoRedoState(): void {
    this.undoBtn.classList.toggle('mw-disabled', !this.commandManager.canUndo);
    this.redoBtn.classList.toggle('mw-disabled', !this.commandManager.canRedo);
    this.undoBtn.title = this.commandManager.undoDescription
      ? `Undo: ${this.commandManager.undoDescription}`
      : 'Nothing to undo';
    this.redoBtn.title = this.commandManager.redoDescription
      ? `Redo: ${this.commandManager.redoDescription}`
      : 'Nothing to redo';
  }

  updateAIStatus(status: string): void {
    this.aiDot.className = 'mw-ai-dot';
    switch (status) {
      case 'loading':
        this.aiDot.classList.add('mw-loading');
        this.aiLabel.textContent = 'Loading...';
        break;
      case 'ready':
        this.aiDot.classList.add('mw-ready');
        this.aiLabel.textContent = 'AI Ready';
        break;
      case 'generating':
        this.aiDot.classList.add('mw-generating');
        this.aiLabel.textContent = 'Thinking...';
        break;
      case 'error':
        this.aiLabel.textContent = 'AI Error';
        break;
      default:
        this.aiLabel.textContent = 'Load AI';
    }
  }
}
