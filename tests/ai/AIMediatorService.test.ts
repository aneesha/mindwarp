import { describe, it, expect, beforeEach } from 'vitest';
import { AIMediatorService } from '../../src/ai/AIMediatorService';
import { MindMap } from '../../src/core/MindMap';
import { CommandManager } from '../../src/core/CommandManager';
import { EventBus } from '../../src/core/EventBus';
import { createRootNode, createNode, resetIdCounter } from '../../src/core/NodeFactory';

describe('AIMediatorService', () => {
  let mindmap: MindMap;
  let commandManager: CommandManager;
  let mediator: AIMediatorService;

  beforeEach(() => {
    resetIdCounter();
    const root = createRootNode('Root');
    const child = createNode('Child A');
    root.addChild(child);
    mindmap = new MindMap('Test', root);
    commandManager = new CommandManager(new EventBus());
    mediator = new AIMediatorService(mindmap, commandManager);
  });

  describe('parseCommands', () => {
    it('should parse ADD commands', () => {
      const text = '<<ADD parent_id="node_1" content="New topic">>';
      const cmds = mediator.parseCommands(text);
      expect(cmds).toHaveLength(1);
      expect(cmds[0].action).toBe('add');
      expect(cmds[0].parentNodeId).toBe('node_1');
      expect(cmds[0].content).toBe('New topic');
    });

    it('should parse EDIT commands', () => {
      const text = '<<EDIT node_id="node_1" content="Updated content">>';
      const cmds = mediator.parseCommands(text);
      expect(cmds).toHaveLength(1);
      expect(cmds[0].action).toBe('edit');
      expect(cmds[0].targetNodeId).toBe('node_1');
    });

    it('should parse DELETE commands', () => {
      const text = '<<DELETE node_id="node_1">>';
      const cmds = mediator.parseCommands(text);
      expect(cmds).toHaveLength(1);
      expect(cmds[0].action).toBe('delete');
    });

    it('should parse multiple commands', () => {
      const text = `
        Here are some changes:
        <<ADD parent_id="root" content="Topic 1">>
        <<ADD parent_id="root" content="Topic 2">>
        <<EDIT node_id="child1" content="Updated">>
      `;
      const cmds = mediator.parseCommands(text);
      expect(cmds).toHaveLength(3);
    });

    it('should return empty array for no commands', () => {
      const text = 'Just a regular response without commands.';
      const cmds = mediator.parseCommands(text);
      expect(cmds).toHaveLength(0);
    });
  });

  describe('extractPlainText', () => {
    it('should remove command markers', () => {
      const text = 'Hello! <<ADD parent_id="x" content="y">> Done.';
      const plain = mediator.extractPlainText(text);
      expect(plain).toBe('Hello!  Done.');
    });

    it('should return full text if no commands', () => {
      const text = 'Just plain text.';
      expect(mediator.extractPlainText(text)).toBe('Just plain text.');
    });
  });

  describe('applyCommands', () => {
    it('should apply ADD commands', () => {
      const rootId = mindmap.root.id;
      const cmds = mediator.parseCommands(`<<ADD parent_id="${rootId}" content="New child">>`);
      const result = mediator.applyCommands(cmds);
      expect(result.applied).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mindmap.root.children).toHaveLength(2);
    });

    it('should report errors for invalid node IDs', () => {
      const cmds = mediator.parseCommands('<<ADD parent_id="nonexistent" content="Fail">>');
      const result = mediator.applyCommands(cmds);
      expect(result.applied).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should batch commands as single undo', () => {
      const rootId = mindmap.root.id;
      const text = `<<ADD parent_id="${rootId}" content="A">> <<ADD parent_id="${rootId}" content="B">>`;
      const cmds = mediator.parseCommands(text);
      mediator.applyCommands(cmds);
      expect(mindmap.root.children).toHaveLength(3);
      commandManager.undo();
      expect(mindmap.root.children).toHaveLength(1);
    });
  });

  describe('processResponse', () => {
    it('should return plain text for no-command response', () => {
      const result = mediator.processResponse('Just chatting.');
      expect(result.plainText).toBe('Just chatting.');
      expect(result.commandCount).toBe(0);
    });

    it('should apply commands and return plain text', () => {
      const rootId = mindmap.root.id;
      const response = `Sure, I'll add a node. <<ADD parent_id="${rootId}" content="Added by AI">> Done!`;
      const result = mediator.processResponse(response);
      expect(result.commandCount).toBe(1);
      expect(mindmap.root.children).toHaveLength(2);
    });
  });
});
