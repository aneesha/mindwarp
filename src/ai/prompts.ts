import type { MindMap } from '../core/MindMap';
import type { MindMapNode } from '../core/MindMapNode';

export function serializeMindMapForContext(mindmap: MindMap): string {
  const lines: string[] = [`## Mindmap: "${mindmap.title}"`];
  serializeNode(mindmap.root, lines, 0);
  return lines.join('\n');
}

function serializeNode(node: MindMapNode, lines: string[], depth: number): void {
  const indent = '  '.repeat(depth);
  const contentPreview = node.content.replace(/\n/g, ' ').slice(0, 100);
  lines.push(`${indent}- [id:${node.id}] ${contentPreview}`);

  for (const child of node.children) {
    serializeNode(child, lines, depth + 1);
  }
}

export function buildSystemPrompt(mindmapContext: string): string {
  return `You are MindWarp AI, a helpful assistant integrated into a mind mapping tool.
You can see the user's mindmap and help them brainstorm, organize, and expand their ideas.

Current mindmap structure:
${mindmapContext}

When the user asks you to modify the mindmap, respond with structured commands:
<<ADD parent_id="NODE_ID" content="New node content">>
<<EDIT node_id="NODE_ID" content="Updated content">>
<<DELETE node_id="NODE_ID">>

You may include multiple commands in one response. You may also include plain text explanation alongside commands.
Keep responses concise and helpful. Focus on the user's request.`;
}

export function expandNodePrompt(nodeContent: string): string {
  return `Generate 3-5 sub-topics for the following mind map node. Return them as ADD commands.
Node content: "${nodeContent}"`;
}

export function refineContentPrompt(nodeContent: string): string {
  return `Improve and expand the following mind map node content. Return as an EDIT command.
Node content: "${nodeContent}"`;
}

export function summarizeBranchPrompt(branchText: string): string {
  return `Summarize the following mind map branch into a brief overview:
${branchText}`;
}
