import './styles/main.css';
import { MindMap } from './core/MindMap';
import { EventBus } from './core/EventBus';
import { CommandManager } from './core/CommandManager';
import { CanvasRenderer } from './canvas/CanvasRenderer';
import { LayoutManager } from './layout/LayoutManager';
import { DeleteNodeCommand } from './core/commands/DeleteNodeCommand';
import { createRootNode, createNode } from './core/NodeFactory';

function bootstrap(): void {
  const appEl = document.getElementById('app');
  if (!appEl) throw new Error('#app element not found');

  // Create app layout
  const toolbarContainer = document.createElement('div');
  toolbarContainer.className = 'mw-toolbar-container';
  toolbarContainer.id = 'toolbar';

  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'mw-canvas-container';
  canvasContainer.id = 'canvas';

  const chatContainer = document.createElement('div');
  chatContainer.className = 'mw-chat-container';
  chatContainer.id = 'chat';

  appEl.appendChild(toolbarContainer);
  appEl.appendChild(canvasContainer);
  appEl.appendChild(chatContainer);

  // Core setup
  const eventBus = new EventBus();
  const root = createRootNode('Central Idea');
  const child1 = createNode('Branch 1', 1);
  const child2 = createNode('Branch 2', 1);
  const child3 = createNode('Branch 3', 1);
  const grandchild1 = createNode('Sub-topic 1.1', 2);
  const grandchild2 = createNode('Sub-topic 1.2', 2);
  const grandchild3 = createNode('Sub-topic 2.1', 2);

  child1.addChild(grandchild1);
  child1.addChild(grandchild2);
  child2.addChild(grandchild3);
  root.addChild(child1);
  root.addChild(child2);
  root.addChild(child3);

  const mindmap = new MindMap('My Mindmap', root);
  const commandManager = new CommandManager(eventBus);
  const layoutManager = new LayoutManager(mindmap, eventBus);

  // Apply initial layout
  layoutManager.applyLayout();

  // Create canvas renderer
  const canvasRenderer = new CanvasRenderer(
    canvasContainer,
    mindmap,
    eventBus,
    commandManager,
    layoutManager
  );

  // Center the view after initial render
  setTimeout(() => {
    canvasRenderer.zoomToFit();
  }, 100);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      commandManager.undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      commandManager.redo();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      const selected = canvasRenderer.getSelection().primary;
      if (selected && selected !== mindmap.root.id) {
        e.preventDefault();
        const cmd = new DeleteNodeCommand(mindmap, selected);
        commandManager.execute(cmd);
        canvasRenderer.getSelection().deselectAll();
        layoutManager.applyLayout();
      }
    }
  });
}

bootstrap();
