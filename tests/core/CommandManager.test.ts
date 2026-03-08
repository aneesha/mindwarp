import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandManager } from '../../src/core/CommandManager';
import { EventBus } from '../../src/core/EventBus';
import type { ICommand } from '../../src/types';

function mockCommand(description = 'test'): ICommand {
  return {
    execute: vi.fn(),
    undo: vi.fn(),
    description,
  };
}

describe('CommandManager', () => {
  let manager: CommandManager;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    manager = new CommandManager(eventBus);
  });

  describe('execute', () => {
    it('should execute the command', () => {
      const cmd = mockCommand();
      manager.execute(cmd);
      expect(cmd.execute).toHaveBeenCalledOnce();
    });

    it('should emit events', () => {
      const executedCb = vi.fn();
      const changedCb = vi.fn();
      eventBus.on('command:executed', executedCb);
      eventBus.on('mindmap:changed', changedCb);
      manager.execute(mockCommand('add node'));
      expect(executedCb).toHaveBeenCalledWith({ command: 'add node' });
      expect(changedCb).toHaveBeenCalled();
    });

    it('should clear redo stack', () => {
      manager.execute(mockCommand());
      manager.undo();
      expect(manager.canRedo).toBe(true);
      manager.execute(mockCommand());
      expect(manager.canRedo).toBe(false);
    });
  });

  describe('undo', () => {
    it('should undo the last command', () => {
      const cmd = mockCommand();
      manager.execute(cmd);
      manager.undo();
      expect(cmd.undo).toHaveBeenCalledOnce();
    });

    it('should return true when undo succeeds', () => {
      manager.execute(mockCommand());
      expect(manager.undo()).toBe(true);
    });

    it('should return false when nothing to undo', () => {
      expect(manager.undo()).toBe(false);
    });

    it('should enable redo after undo', () => {
      manager.execute(mockCommand());
      manager.undo();
      expect(manager.canRedo).toBe(true);
    });

    it('should emit events', () => {
      const undoneCb = vi.fn();
      eventBus.on('command:undone', undoneCb);
      manager.execute(mockCommand('test'));
      manager.undo();
      expect(undoneCb).toHaveBeenCalled();
    });
  });

  describe('redo', () => {
    it('should redo the last undone command', () => {
      const cmd = mockCommand();
      manager.execute(cmd);
      manager.undo();
      manager.redo();
      expect(cmd.execute).toHaveBeenCalledTimes(2);
    });

    it('should return true when redo succeeds', () => {
      manager.execute(mockCommand());
      manager.undo();
      expect(manager.redo()).toBe(true);
    });

    it('should return false when nothing to redo', () => {
      expect(manager.redo()).toBe(false);
    });
  });

  describe('canUndo / canRedo', () => {
    it('should report correct state', () => {
      expect(manager.canUndo).toBe(false);
      expect(manager.canRedo).toBe(false);

      manager.execute(mockCommand());
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(false);

      manager.undo();
      expect(manager.canUndo).toBe(false);
      expect(manager.canRedo).toBe(true);

      manager.redo();
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(false);
    });
  });

  describe('descriptions', () => {
    it('should return undo description', () => {
      expect(manager.undoDescription).toBeNull();
      manager.execute(mockCommand('add node'));
      expect(manager.undoDescription).toBe('add node');
    });

    it('should return redo description', () => {
      expect(manager.redoDescription).toBeNull();
      manager.execute(mockCommand('add node'));
      manager.undo();
      expect(manager.redoDescription).toBe('add node');
    });
  });

  describe('history limit', () => {
    it('should respect max history', () => {
      const smallManager = new CommandManager(eventBus, 3);
      smallManager.execute(mockCommand('1'));
      smallManager.execute(mockCommand('2'));
      smallManager.execute(mockCommand('3'));
      smallManager.execute(mockCommand('4'));
      expect(smallManager.canUndo).toBe(true);
      smallManager.undo(); // undoes 4
      smallManager.undo(); // undoes 3
      smallManager.undo(); // undoes 2
      expect(smallManager.undo()).toBe(false); // 1 was dropped
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      manager.execute(mockCommand());
      manager.execute(mockCommand());
      manager.undo();
      manager.clear();
      expect(manager.canUndo).toBe(false);
      expect(manager.canRedo).toBe(false);
    });
  });
});
