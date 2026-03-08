import '../styles/chat.css';
import type { EventBus } from '../core/EventBus';
import type { MindMap } from '../core/MindMap';
import type { CommandManager } from '../core/CommandManager';
import type { LayoutManager } from '../layout/LayoutManager';
import { ModelService } from '../ai/ModelService';
import { ChatService } from '../ai/ChatService';
import { AIMediatorService } from '../ai/AIMediatorService';

export class ChatPanel {
  private container: HTMLElement;
  private messagesDiv!: HTMLElement;
  private input!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private isCollapsed = true;
  private eventBus: EventBus;
  private modelService: ModelService;
  private chatService: ChatService;
  private mediator: AIMediatorService;
  private layoutManager: LayoutManager;
  private currentAssistantBubble: HTMLElement | null = null;

  constructor(
    container: HTMLElement,
    eventBus: EventBus,
    mindmap: MindMap,
    commandManager: CommandManager,
    layoutManager: LayoutManager
  ) {
    this.container = container;
    this.eventBus = eventBus;
    this.layoutManager = layoutManager;
    this.modelService = new ModelService(eventBus);
    this.chatService = new ChatService(mindmap);
    this.mediator = new AIMediatorService(mindmap, commandManager);
    this.render();
    this.bindEvents();
  }

  private render(): void {
    const chat = document.createElement('div');
    chat.className = 'mw-chat mw-collapsed';

    // Header
    const header = document.createElement('div');
    header.className = 'mw-chat-header';
    header.addEventListener('click', () => this.toggle());

    const title = document.createElement('span');
    title.className = 'mw-chat-title';
    title.textContent = 'AI Chat';

    const toggle = document.createElement('span');
    toggle.className = 'mw-chat-toggle';
    toggle.textContent = 'Click to expand';

    header.appendChild(title);
    header.appendChild(toggle);
    chat.appendChild(header);

    // Messages area
    this.messagesDiv = document.createElement('div');
    this.messagesDiv.className = 'mw-chat-messages';

    const empty = document.createElement('div');
    empty.className = 'mw-chat-empty';
    empty.textContent = 'Chat with AI about your mindmap. Load the AI model first.';
    this.messagesDiv.appendChild(empty);

    chat.appendChild(this.messagesDiv);

    // Input area
    const inputArea = document.createElement('div');
    inputArea.className = 'mw-chat-input-area';

    this.input = document.createElement('textarea');
    this.input.className = 'mw-chat-input';
    this.input.placeholder = 'Ask AI about your mindmap...';
    this.input.rows = 1;
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.send();
      }
    });
    this.input.addEventListener('input', () => {
      this.input.style.height = 'auto';
      this.input.style.height = `${Math.min(100, this.input.scrollHeight)}px`;
    });

    this.sendBtn = document.createElement('button');
    this.sendBtn.className = 'mw-chat-send';
    this.sendBtn.textContent = 'Send';
    this.sendBtn.addEventListener('click', () => this.send());

    inputArea.appendChild(this.input);
    inputArea.appendChild(this.sendBtn);
    chat.appendChild(inputArea);

    this.container.appendChild(chat);
  }

  private bindEvents(): void {
    this.eventBus.on('ai:token', (payload: unknown) => {
      const { token } = payload as { token: string };
      if (this.currentAssistantBubble) {
        this.currentAssistantBubble.textContent += token;
        this.scrollToBottom();
      }
    });

    this.eventBus.on('ai:complete', (payload: unknown) => {
      const { text } = payload as { text: string };
      if (this.currentAssistantBubble) {
        // Process AI response for commands
        const result = this.mediator.processResponse(text);
        this.currentAssistantBubble.textContent = result.plainText || text;

        if (result.commandCount > 0) {
          this.addSystemMessage(`Applied ${result.commandCount} mindmap changes.`);
          this.layoutManager.applyLayout();
        }
        if (result.errors.length > 0) {
          this.addSystemMessage(`Errors: ${result.errors.join(', ')}`);
        }

        this.chatService.addAssistantMessage(text);
      }
      this.currentAssistantBubble = null;
      this.sendBtn.disabled = false;
      this.sendBtn.textContent = 'Send';
    });

    this.eventBus.on('ai:error', (payload: unknown) => {
      const { message } = payload as { message: string };
      this.addSystemMessage(`Error: ${message}`);
      this.currentAssistantBubble = null;
      this.sendBtn.disabled = false;
      this.sendBtn.textContent = 'Send';
    });
  }

  private async send(): Promise<void> {
    const text = this.input.value.trim();
    if (!text) return;

    if (!this.modelService.isReady) {
      this.addSystemMessage('AI model is not loaded. Click "Load AI" in the toolbar first.');
      return;
    }

    // Clear empty state
    const empty = this.messagesDiv.querySelector('.mw-chat-empty');
    if (empty) empty.remove();

    // Add user message
    this.addMessageBubble(text, 'user');
    this.chatService.addUserMessage(text);
    this.input.value = '';
    this.input.style.height = 'auto';

    // Prepare assistant bubble for streaming
    this.currentAssistantBubble = this.addMessageBubble('', 'assistant');
    this.sendBtn.disabled = true;
    this.sendBtn.textContent = 'Thinking...';

    // Build context and send
    const context = this.chatService.buildContext();
    try {
      await this.modelService.generate(context);
    } catch {
      // Handled by error event
    }
  }

  private addMessageBubble(content: string, role: 'user' | 'assistant'): HTMLElement {
    const bubble = document.createElement('div');
    bubble.className = `mw-chat-message mw-${role}`;
    bubble.textContent = content;
    this.messagesDiv.appendChild(bubble);
    this.scrollToBottom();
    return bubble;
  }

  private addSystemMessage(content: string): void {
    const msg = document.createElement('div');
    msg.className = 'mw-chat-message mw-system-msg';
    msg.textContent = content;
    this.messagesDiv.appendChild(msg);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }

  toggle(): void {
    this.isCollapsed = !this.isCollapsed;
    const chatEl = this.container.querySelector('.mw-chat');
    if (chatEl) {
      chatEl.classList.toggle('mw-collapsed', this.isCollapsed);
      const toggle = chatEl.querySelector('.mw-chat-toggle');
      if (toggle) toggle.textContent = this.isCollapsed ? 'Click to expand' : 'Click to collapse';
    }
    if (!this.isCollapsed) {
      setTimeout(() => this.input.focus(), 200);
    }
  }

  async loadModel(): Promise<void> {
    try {
      this.addSystemMessage('Loading AI model... This may take a moment on first use.');
      if (this.isCollapsed) this.toggle();
      await this.modelService.loadModel();
      this.addSystemMessage('AI model loaded and ready!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.addSystemMessage(`Failed to load model: ${message}`);
    }
  }

  sendBotMention(nodeId: string, prompt: string): void {
    if (!this.modelService.isReady) {
      this.addSystemMessage('AI model not loaded. Load it first.');
      return;
    }
    if (this.isCollapsed) this.toggle();
    this.input.value = `[Re: node ${nodeId}] ${prompt}`;
    this.send();
  }

  getModelService(): ModelService {
    return this.modelService;
  }

  updateMindmap(mindmap: MindMap): void {
    this.chatService.setMindmap(mindmap);
    this.mediator.setMindmap(mindmap);
  }
}
