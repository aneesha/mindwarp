import type { ILayoutStrategy } from '../types';
import type { MindMap } from '../core/MindMap';
import type { EventBus } from '../core/EventBus';
import { TreeRightLayout } from './TreeRightLayout';
import type { LayoutName } from './LayoutStrategy';

export class LayoutManager {
  private strategy: ILayoutStrategy;
  private strategies: Map<string, ILayoutStrategy>;
  private mindmap: MindMap;
  private eventBus: EventBus;

  constructor(mindmap: MindMap, eventBus: EventBus) {
    this.mindmap = mindmap;
    this.eventBus = eventBus;
    this.strategies = new Map();

    const treeRight = new TreeRightLayout();
    this.strategies.set(treeRight.name, treeRight);
    this.strategy = treeRight;
  }

  registerStrategy(strategy: ILayoutStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  setStrategy(name: LayoutName): void {
    const strategy = this.strategies.get(name);
    if (!strategy) throw new Error(`Unknown layout: ${name}`);
    this.strategy = strategy;
  }

  get currentStrategyName(): string {
    return this.strategy.name;
  }

  get availableLayouts(): string[] {
    return [...this.strategies.keys()];
  }

  applyLayout(): void {
    const positions = this.strategy.calculate(this.mindmap.root.toData());

    for (const [id, position] of positions) {
      const node = this.mindmap.findNodeById(id);
      if (node) {
        node.position.x = position.x;
        node.position.y = position.y;
      }
    }

    this.eventBus.emit('layout:changed');
  }
}
