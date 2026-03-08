/**
 * AI Chat Example
 *
 * Demonstrates the AI integration with the mindmap.
 * Click "Load AI" in the toolbar to download the Qwen 3.5 0.8B model.
 * Then use the chat panel at the bottom to interact with the AI.
 *
 * The AI can:
 * - Answer questions about your mindmap
 * - Add, edit, or delete nodes via structured commands
 * - Be triggered from within a node using @bot
 *
 * Example prompts:
 * - "Add 3 sub-topics to the root node"
 * - "Summarize my mindmap"
 * - "What topics am I missing?"
 *
 * In a node editor, type "@bot expand this topic" to trigger AI completion.
 */
import { App } from '../../src/ui/App';

const app = new App(document.getElementById('app')!);
console.log('AI Chat example loaded. Click "Load AI" in toolbar to start.');
