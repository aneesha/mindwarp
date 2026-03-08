// ---- Geometry ----

export interface Position {
  x: number;
  y: number;
}

// ---- Node Data ----

export interface NodeStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  fontSize: number;
  width: number;
  shape: 'rectangle' | 'rounded' | 'pill' | 'diamond';
}

export interface MindMapNodeData {
  id: string;
  content: string;
  children: MindMapNodeData[];
  position: Position;
  style: NodeStyle;
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
}

// ---- MindMap Container ----

export interface MindMapMetadata {
  createdAt: number;
  updatedAt: number;
  author: string;
  description: string;
}

export interface MindMapData {
  version: string;
  title: string;
  root: MindMapNodeData;
  metadata: MindMapMetadata;
}

// ---- Events ----

export type MindWarpEvent =
  | 'node:added'
  | 'node:deleted'
  | 'node:edited'
  | 'node:moved'
  | 'node:selected'
  | 'node:deselected'
  | 'node:collapsed'
  | 'node:expanded'
  | 'mindmap:loaded'
  | 'mindmap:saved'
  | 'mindmap:cleared'
  | 'mindmap:changed'
  | 'ai:loading'
  | 'ai:ready'
  | 'ai:generating'
  | 'ai:complete'
  | 'ai:error'
  | 'ai:token'
  | 'layout:changed'
  | 'canvas:zoom'
  | 'canvas:pan'
  | 'command:executed'
  | 'command:undone'
  | 'command:redone';

// ---- Commands ----

export interface ICommand {
  execute(): void;
  undo(): void;
  readonly description: string;
}

// ---- Layout ----

export interface ILayoutStrategy {
  readonly name: string;
  calculate(root: MindMapNodeData, nodeWidths?: Map<string, number>, nodeHeights?: Map<string, number>): Map<string, Position>;
}

// ---- AI ----

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AIWorkerMessage {
  type: 'load' | 'generate' | 'abort';
  payload?: unknown;
}

export interface AIWorkerResponse {
  type: 'status' | 'token' | 'complete' | 'error';
  payload: string;
}

export interface AICommand {
  action: 'add' | 'edit' | 'delete' | 'refine';
  targetNodeId?: string;
  parentNodeId?: string;
  content?: string;
}

// ---- Export ----

export type ExportFormat = 'png' | 'docx' | 'pptx' | 'json';

export interface IExporter {
  readonly format: ExportFormat;
  export(mindmap: MindMapData): Promise<Blob>;
}

// ---- Event Callback ----

export type EventCallback<T = unknown> = (payload: T) => void;
