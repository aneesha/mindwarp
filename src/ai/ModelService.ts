import type { EventBus } from '../core/EventBus';
import type { AIWorkerResponse, ChatMessage } from '../types';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'generating' | 'error';

export class ModelService {
  private worker: Worker | null = null;
  private eventBus: EventBus;
  private _status: ModelStatus = 'idle';
  private resolveLoad: (() => void) | null = null;
  private rejectLoad: ((err: Error) => void) | null = null;
  private generateResolve: ((text: string) => void) | null = null;
  private generatedText = '';

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  get status(): ModelStatus {
    return this._status;
  }

  get isReady(): boolean {
    return this._status === 'ready';
  }

  get isGenerating(): boolean {
    return this._status === 'generating';
  }

  async loadModel(): Promise<void> {
    if (this._status === 'loading' || this._status === 'ready') return;

    this._status = 'loading';
    this.eventBus.emit('ai:loading');

    return new Promise<void>((resolve, reject) => {
      this.resolveLoad = resolve;
      this.rejectLoad = reject;

      this.worker = new Worker(
        new URL('./ai.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (e: MessageEvent<AIWorkerResponse>) => {
        this.handleWorkerMessage(e.data);
      };

      this.worker.onerror = (err) => {
        this._status = 'error';
        this.eventBus.emit('ai:error', { message: err.message });
        reject(new Error(err.message));
      };

      this.worker.postMessage({ type: 'load' });
    });
  }

  private handleWorkerMessage(msg: AIWorkerResponse): void {
    switch (msg.type) {
      case 'status':
        if (msg.payload === 'ready') {
          this._status = 'ready';
          this.eventBus.emit('ai:ready');
          this.resolveLoad?.();
          this.resolveLoad = null;
          this.rejectLoad = null;
        } else {
          this.eventBus.emit('ai:loading', { message: msg.payload });
        }
        break;

      case 'token':
        this.generatedText += msg.payload;
        this.eventBus.emit('ai:token', { token: msg.payload });
        break;

      case 'complete':
        this._status = 'ready';
        this.eventBus.emit('ai:complete', { text: this.generatedText });
        this.generateResolve?.(this.generatedText);
        this.generateResolve = null;
        this.generatedText = '';
        break;

      case 'error':
        if (this._status === 'loading') {
          this._status = 'error';
          this.rejectLoad?.(new Error(msg.payload));
          this.resolveLoad = null;
          this.rejectLoad = null;
        } else {
          this._status = 'ready';
          this.generateResolve?.('');
          this.generateResolve = null;
        }
        this.eventBus.emit('ai:error', { message: msg.payload });
        break;
    }
  }

  async generate(messages: ChatMessage[]): Promise<string> {
    if (!this.worker || this._status !== 'ready') {
      throw new Error('Model not ready');
    }

    this._status = 'generating';
    this.generatedText = '';
    this.eventBus.emit('ai:generating');

    return new Promise<string>((resolve) => {
      this.generateResolve = resolve;

      const formattedMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      this.worker!.postMessage({
        type: 'generate',
        payload: { messages: formattedMessages, maxTokens: 512 },
      });
    });
  }

  abort(): void {
    if (this.worker && this._status === 'generating') {
      this.worker.terminate();
      this.worker = null;
      this._status = 'idle';
      this.generateResolve?.('');
      this.generateResolve = null;
      this.generatedText = '';
    }
  }

  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this._status = 'idle';
  }
}
