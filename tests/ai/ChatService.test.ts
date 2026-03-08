import { describe, it, expect, beforeEach } from 'vitest';
import { ChatService } from '../../src/ai/ChatService';
import { MindMap } from '../../src/core/MindMap';
import { createRootNode, resetIdCounter } from '../../src/core/NodeFactory';

describe('ChatService', () => {
  let chatService: ChatService;
  let mindmap: MindMap;

  beforeEach(() => {
    resetIdCounter();
    const root = createRootNode('Test Topic');
    mindmap = new MindMap('Test', root);
    chatService = new ChatService(mindmap);
  });

  it('should add user messages', () => {
    const msg = chatService.addUserMessage('Hello');
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('Hello');
    expect(chatService.getHistory()).toHaveLength(1);
  });

  it('should add assistant messages', () => {
    const msg = chatService.addAssistantMessage('Hi there');
    expect(msg.role).toBe('assistant');
    expect(msg.content).toBe('Hi there');
  });

  it('should build context with system prompt', () => {
    chatService.addUserMessage('Help me brainstorm');
    const context = chatService.buildContext();
    expect(context[0].role).toBe('system');
    expect(context[0].content).toContain('Test Topic');
    expect(context).toHaveLength(2); // system + user message
  });

  it('should limit history in context', () => {
    for (let i = 0; i < 20; i++) {
      chatService.addUserMessage(`Message ${i}`);
      chatService.addAssistantMessage(`Reply ${i}`);
    }
    const context = chatService.buildContext();
    // Should have system + limited history
    expect(context.length).toBeLessThan(22);
  });

  it('should clear history', () => {
    chatService.addUserMessage('Hello');
    chatService.addAssistantMessage('Hi');
    chatService.clearHistory();
    expect(chatService.getHistory()).toHaveLength(0);
  });
});
