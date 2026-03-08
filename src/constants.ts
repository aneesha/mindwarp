import type { NodeStyle } from './types';

export const DEFAULT_NODE_STYLE: NodeStyle = {
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  borderColor: '#4a90d9',
  fontSize: 14,
  width: 200,
  shape: 'rounded',
};

export const ROOT_NODE_STYLE: NodeStyle = {
  backgroundColor: '#4a90d9',
  textColor: '#ffffff',
  borderColor: '#3a7bc8',
  fontSize: 18,
  width: 240,
  shape: 'rounded',
};

export const DEPTH_COLORS = [
  '#4a90d9', // depth 0 - blue
  '#50b86c', // depth 1 - green
  '#e6a23c', // depth 2 - orange
  '#e25858', // depth 3 - red
  '#9b59b6', // depth 4 - purple
  '#1abc9c', // depth 5 - teal
];

export const LAYOUT = {
  HORIZONTAL_GAP: 60,
  VERTICAL_GAP: 20,
  NODE_MIN_HEIGHT: 40,
  NODE_PADDING: 12,
};

export const CANVAS = {
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 3.0,
  ZOOM_STEP: 0.1,
};

export const COMMAND_HISTORY_LIMIT = 50;

export const MINDWARP_FILE_VERSION = '1.0.0';

export const AI = {
  MODEL_ID: 'onnx-community/Qwen3.5-0.8B-ONNX',
  MAX_NEW_TOKENS: 512,
  MAX_CONTEXT_MESSAGES: 5,
  TEMPERATURE: 0.7,
  TOP_P: 0.9,
};
