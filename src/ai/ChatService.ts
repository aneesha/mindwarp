import type { ChatMessage } from '../types';
import type { MindMap } from '../core/MindMap';
import { AI } from '../constants';
import { serializeMindMapForContext, buildSystemPrompt } from './prompts';

let messageIdCounter = 0;

function createMessageId(): string {
  messageIdCounter++;
  return `msg_${Date.now()}_${messageIdCounter}`;
}

export class ChatService {
  private history: ChatMessage[] = [];
  private mindmap: MindMap;

  constructor(mindmap: MindMap) {
    this.mindmap = mindmap;
  }

  addUserMessage(content: string): ChatMessage {
    const msg: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    this.history.push(msg);
    return msg;
  }

  addAssistantMessage(content: string): ChatMessage {
    const msg: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    this.history.push(msg);
    return msg;
  }

  buildContext(): ChatMessage[] {
    const mindmapContext = serializeMindMapForContext(this.mindmap);
    const systemPrompt = buildSystemPrompt(mindmapContext);

    const messages: ChatMessage[] = [
      {
        id: 'system',
        role: 'system',
        content: systemPrompt,
        timestamp: Date.now(),
      },
    ];

    // Add recent history (limited)
    const recentHistory = this.history.slice(-AI.MAX_CONTEXT_MESSAGES * 2);
    messages.push(...recentHistory);

    return messages;
  }

  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  setMindmap(mindmap: MindMap): void {
    this.mindmap = mindmap;
  }
}
