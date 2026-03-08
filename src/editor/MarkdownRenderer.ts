import { Marked } from 'marked';
import hljs from 'highlight.js';

const marked = new Marked({
  breaks: true,
  gfm: true,
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlighted = hljs.highlight(text, { language }).value;
      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
    },
    link({ href, title, text }: { href: string; title?: string | null; text: string }) {
      const crossLinkMatch = href.match(/^node:(.+)$/);
      if (crossLinkMatch) {
        const nodeId = crossLinkMatch[1];
        return `<a class="mw-cross-link" data-target="${nodeId}" title="${title || ''}">${text}</a>`;
      }
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

export function renderMarkdown(content: string): string {
  if (!content.trim()) return '<p class="mw-placeholder">Double-click to edit</p>';
  try {
    const html = marked.parse(content) as string;
    return html;
  } catch {
    return `<p>${escapeHtml(content)}</p>`;
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function extractBotMention(content: string): { prompt: string; beforeBot: string } | null {
  const match = content.match(/@bot\s+([\s\S]+)$/i);
  if (!match) return null;
  const botIndex = content.search(/@bot/i);
  return {
    prompt: match[1].trim(),
    beforeBot: content.slice(0, botIndex).trim(),
  };
}
