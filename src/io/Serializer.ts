import type { MindMapData, MindMapNodeData } from '../types';
import { MINDWARP_FILE_VERSION } from '../constants';

export function validateMindMapData(data: unknown): data is MindMapData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  if (typeof d.version !== 'string') return false;
  if (typeof d.title !== 'string') return false;
  if (!d.root || typeof d.root !== 'object') return false;
  if (!d.metadata || typeof d.metadata !== 'object') return false;

  return validateNodeData(d.root);
}

function validateNodeData(data: unknown): data is MindMapNodeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  if (typeof d.id !== 'string') return false;
  if (typeof d.content !== 'string') return false;
  if (!Array.isArray(d.children)) return false;
  if (!d.position || typeof d.position !== 'object') return false;
  if (!d.style || typeof d.style !== 'object') return false;

  return d.children.every(validateNodeData);
}

export function migrateData(data: MindMapData): MindMapData {
  // Future migrations can be added here based on version
  if (!data.version) {
    data.version = MINDWARP_FILE_VERSION;
  }
  return data;
}
