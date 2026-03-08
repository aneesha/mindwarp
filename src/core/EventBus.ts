import type { MindWarpEvent, EventCallback } from '../types';

export class EventBus {
  private listeners = new Map<MindWarpEvent, Set<EventCallback>>();

  on<T = unknown>(event: MindWarpEvent, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);
  }

  off<T = unknown>(event: MindWarpEvent, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as EventCallback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  once<T = unknown>(event: MindWarpEvent, callback: EventCallback<T>): void {
    const wrapper: EventCallback<T> = (payload) => {
      this.off(event, wrapper);
      callback(payload);
    };
    this.on(event, wrapper);
  }

  emit<T = unknown>(event: MindWarpEvent, payload?: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(payload);
      }
    }
  }

  removeAllListeners(event?: MindWarpEvent): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: MindWarpEvent): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
