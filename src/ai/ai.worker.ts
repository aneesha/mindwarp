/// <reference lib="webworker" />

import type { AIWorkerMessage, AIWorkerResponse } from '../types';

const MODEL_ID = 'onnx-community/Qwen3.5-0.8B-ONNX';

let pipeline: any = null;

function postMsg(msg: AIWorkerResponse): void {
  self.postMessage(msg);
}

async function loadModel(): Promise<void> {
  try {
    postMsg({ type: 'status', payload: 'Importing transformers...' });
    const { pipeline: createPipeline, env } = await import('@huggingface/transformers');

    // Check for WebGPU support
    const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
    const device = hasWebGPU ? 'webgpu' : 'wasm';

    postMsg({ type: 'status', payload: `Loading model (${device})...` });

    // Disable local model check
    env.allowLocalModels = false;

    pipeline = await createPipeline('text-generation', MODEL_ID, {
      dtype: 'q4',
      device,
      progress_callback: (progress: { status: string; progress?: number }) => {
        if (progress.progress !== undefined) {
          postMsg({
            type: 'status',
            payload: `Downloading: ${Math.round(progress.progress)}%`,
          });
        }
      },
    });

    postMsg({ type: 'status', payload: 'ready' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    postMsg({ type: 'error', payload: `Failed to load model: ${message}` });
  }
}

async function generate(payload: {
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
}): Promise<void> {
  if (!pipeline) {
    postMsg({ type: 'error', payload: 'Model not loaded' });
    return;
  }

  try {
    const result = await pipeline(payload.messages, {
      max_new_tokens: payload.maxTokens || 512,
      do_sample: true,
      temperature: 0.7,
      top_p: 0.9,
      return_full_text: false,
    });

    if (result && result[0] && result[0].generated_text) {
      const text = typeof result[0].generated_text === 'string'
        ? result[0].generated_text
        : result[0].generated_text[result[0].generated_text.length - 1]?.content || '';
      postMsg({ type: 'token', payload: text });
    }

    postMsg({ type: 'complete', payload: '' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    postMsg({ type: 'error', payload: `Generation failed: ${message}` });
  }
}

self.onmessage = async (e: MessageEvent<AIWorkerMessage>) => {
  switch (e.data.type) {
    case 'load':
      await loadModel();
      break;
    case 'generate':
      await generate(e.data.payload as any);
      break;
    case 'abort':
      // Abort is handled by terminating and recreating worker
      break;
  }
};
