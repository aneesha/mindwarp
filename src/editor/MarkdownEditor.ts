import type { MindMap } from '../core/MindMap';
import type { CommandManager } from '../core/CommandManager';
import { EditNodeCommand } from '../core/commands/EditNodeCommand';

export class MarkdownEditor {
  private activeNodeId: string | null = null;
  private activeElement: HTMLElement | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private toolbar: HTMLElement | null = null;
  private originalContent: string = '';
  private mindmap: MindMap;
  private commandManager: CommandManager;
  onBotMention?: (nodeId: string, prompt: string) => void;

  constructor(mindmap: MindMap, commandManager: CommandManager) {
    this.mindmap = mindmap;
    this.commandManager = commandManager;
  }

  open(nodeId: string, nodeElement: HTMLElement): void {
    if (this.activeNodeId) this.close(true);

    const node = this.mindmap.findNodeById(nodeId);
    if (!node) return;

    this.activeNodeId = nodeId;
    this.activeElement = nodeElement;
    this.originalContent = node.content;

    const contentDiv = nodeElement.querySelector('.mw-node-content') as HTMLElement;
    if (!contentDiv) return;

    // Create toolbar
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'mw-editor-toolbar';

    const buttons = [
      { label: 'B', title: 'Bold (Ctrl+B)', action: () => this.wrapSelection('**', '**') },
      { label: 'I', title: 'Italic (Ctrl+I)', action: () => this.wrapSelection('*', '*') },
      { label: '<>', title: 'Code', action: () => this.wrapSelection('`', '`') },
      { label: 'H', title: 'Heading', action: () => this.insertAtLineStart('## ') },
      { label: '[]', title: 'Link (Ctrl+K)', action: () => this.insertLink() },
      { label: '-', title: 'List item', action: () => this.insertAtLineStart('- ') },
    ];

    for (const btn of buttons) {
      const button = document.createElement('button');
      button.className = 'mw-editor-btn';
      button.textContent = btn.label;
      button.title = btn.title;
      button.addEventListener('mousedown', (e) => {
        e.preventDefault();
        btn.action();
      });
      this.toolbar.appendChild(button);
    }

    // Create textarea
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'mw-editor-textarea';
    this.textarea.value = node.content;
    this.textarea.placeholder = 'Enter content... Use @bot to ask AI';

    this.textarea.addEventListener('keydown', this.onKeyDown);

    // Replace content with editor
    contentDiv.innerHTML = '';
    contentDiv.appendChild(this.toolbar);
    contentDiv.appendChild(this.textarea);

    // Focus and select
    this.textarea.focus();
    this.textarea.setSelectionRange(this.textarea.value.length, this.textarea.value.length);

    // Auto-resize
    this.autoResize();
    this.textarea.addEventListener('input', () => this.autoResize());
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close(false);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.close(true);
    } else if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.wrapSelection('**', '**');
    } else if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.wrapSelection('*', '*');
    } else if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.insertLink();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.insertAtCursor('  ');
    }
  };

  private wrapSelection(before: string, after: string): void {
    if (!this.textarea) return;
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const text = this.textarea.value;
    const selected = text.substring(start, end);

    if (selected) {
      this.textarea.value = text.substring(0, start) + before + selected + after + text.substring(end);
      this.textarea.selectionStart = start + before.length;
      this.textarea.selectionEnd = end + before.length;
    } else {
      this.textarea.value = text.substring(0, start) + before + after + text.substring(end);
      this.textarea.selectionStart = this.textarea.selectionEnd = start + before.length;
    }
    this.textarea.focus();
  }

  private insertAtLineStart(prefix: string): void {
    if (!this.textarea) return;
    const start = this.textarea.selectionStart;
    const text = this.textarea.value;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    this.textarea.value = text.substring(0, lineStart) + prefix + text.substring(lineStart);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + prefix.length;
    this.textarea.focus();
  }

  private insertAtCursor(text: string): void {
    if (!this.textarea) return;
    const start = this.textarea.selectionStart;
    const value = this.textarea.value;
    this.textarea.value = value.substring(0, start) + text + value.substring(start);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
    this.textarea.focus();
  }

  private insertLink(): void {
    if (!this.textarea) return;
    this.wrapSelection('[', '](url)');
  }

  private autoResize(): void {
    if (!this.textarea) return;
    this.textarea.style.height = 'auto';
    this.textarea.style.height = `${Math.max(60, this.textarea.scrollHeight)}px`;
  }

  close(save: boolean): void {
    if (!this.activeNodeId || !this.textarea || !this.activeElement) return;

    const newContent = this.textarea.value;
    const nodeId = this.activeNodeId;

    // Check for @bot mention
    if (save && this.onBotMention) {
      const match = newContent.match(/@bot\s+([\s\S]+)$/i);
      if (match) {
        // Save without @bot, trigger bot
        const contentWithoutBot = newContent.slice(0, newContent.search(/@bot/i)).trim();
        if (contentWithoutBot !== this.originalContent) {
          const cmd = new EditNodeCommand(this.mindmap, nodeId, contentWithoutBot);
          this.commandManager.execute(cmd);
        }
        this.cleanup();
        this.onBotMention(nodeId, match[1].trim());
        return;
      }
    }

    if (save && newContent !== this.originalContent) {
      const cmd = new EditNodeCommand(this.mindmap, nodeId, newContent);
      this.commandManager.execute(cmd);
    }

    this.cleanup();
  }

  private cleanup(): void {
    this.activeNodeId = null;
    this.activeElement = null;
    this.textarea = null;
    this.toolbar = null;
    this.originalContent = '';
    // Re-render will be triggered by mindmap:changed event
  }

  get isOpen(): boolean {
    return this.activeNodeId !== null;
  }

  get editingNodeId(): string | null {
    return this.activeNodeId;
  }
}
