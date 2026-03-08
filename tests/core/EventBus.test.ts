import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should call listener when event is emitted', () => {
    const callback = vi.fn();
    bus.on('node:added', callback);
    bus.emit('node:added', { id: '1' });
    expect(callback).toHaveBeenCalledWith({ id: '1' });
  });

  it('should support multiple listeners for the same event', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    bus.on('node:added', cb1);
    bus.on('node:added', cb2);
    bus.emit('node:added', 'test');
    expect(cb1).toHaveBeenCalledWith('test');
    expect(cb2).toHaveBeenCalledWith('test');
  });

  it('should not call listeners for different events', () => {
    const callback = vi.fn();
    bus.on('node:added', callback);
    bus.emit('node:deleted', { id: '1' });
    expect(callback).not.toHaveBeenCalled();
  });

  it('should remove listener with off', () => {
    const callback = vi.fn();
    bus.on('node:added', callback);
    bus.off('node:added', callback);
    bus.emit('node:added', 'test');
    expect(callback).not.toHaveBeenCalled();
  });

  it('should support once listeners', () => {
    const callback = vi.fn();
    bus.once('node:added', callback);
    bus.emit('node:added', 'first');
    bus.emit('node:added', 'second');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');
  });

  it('should emit without payload', () => {
    const callback = vi.fn();
    bus.on('mindmap:cleared', callback);
    bus.emit('mindmap:cleared');
    expect(callback).toHaveBeenCalledWith(undefined);
  });

  it('should remove all listeners for a specific event', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    bus.on('node:added', cb1);
    bus.on('node:added', cb2);
    bus.removeAllListeners('node:added');
    bus.emit('node:added', 'test');
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });

  it('should remove all listeners when called without event', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    bus.on('node:added', cb1);
    bus.on('node:deleted', cb2);
    bus.removeAllListeners();
    bus.emit('node:added', 'test');
    bus.emit('node:deleted', 'test');
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });

  it('should return correct listener count', () => {
    expect(bus.listenerCount('node:added')).toBe(0);
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    bus.on('node:added', cb1);
    expect(bus.listenerCount('node:added')).toBe(1);
    bus.on('node:added', cb2);
    expect(bus.listenerCount('node:added')).toBe(2);
    bus.off('node:added', cb1);
    expect(bus.listenerCount('node:added')).toBe(1);
  });
});
