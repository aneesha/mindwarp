# MindWarp

A fully in-browser mindmapping canvas with an integrated small language model (Qwen 3.5 0.8B) running via WebGPU. No backend required -- everything runs client-side.

## Features

- **Interactive Mind Map Canvas** -- Pan, zoom, drag nodes, create branches with keyboard shortcuts
- **Markdown Editing** -- Write rich content in nodes with syntax highlighting, code blocks, and cross-links
- **In-Browser AI** -- Qwen 3.5 0.8B runs in a Web Worker via WebGPU (WASM fallback)
- **AI Chat Panel** -- Chat about your mindmap, ask the AI to add/edit/delete nodes
- **@bot Mentions** -- Type `@bot` in any node to trigger AI completion inline
- **Multiple Layouts** -- Tree Right and Radial layout algorithms
- **Export** -- PNG image, Word document (DOCX), PowerPoint (PPTX)
- **Save/Load** -- Persist mindmaps as `.mindwarp.json` files
- **Dark Mode** -- Toggle between light and dark themes
- **Undo/Redo** -- Full command history with batch undo for AI operations

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Tab | Add child to selected node |
| Enter | Edit selected node |
| Delete | Delete selected node |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+S | Save mindmap |
| Space | Toggle collapse |
| Escape | Close editor / deselect |

### AI Integration

1. Click **Load AI** in the toolbar to download the model (~850MB, cached after first load)
2. Expand the chat panel at the bottom
3. Ask the AI about your mindmap or request changes
4. The AI can add, edit, and delete nodes using structured commands

### @bot Mentions

In any node editor, type `@bot <your prompt>` and press Ctrl+Enter. The AI will process your request and modify the node content.

### Export

Use the **Export** dropdown in the toolbar:
- **PNG** -- Captures the canvas as an image
- **Word** -- Generates a DOCX with tree depth mapped to heading levels
- **PowerPoint** -- Creates a PPTX with title slide and content slides per branch

## Architecture

### Design Patterns

- **Observer** -- EventBus for decoupled cross-module communication
- **Command** -- Undo/redo with CommandManager (Add, Delete, Edit, Move, Batch)
- **Strategy** -- Pluggable layout algorithms (TreeRight, Radial)
- **Factory** -- NodeFactory for consistent node creation
- **Mediator** -- AIMediatorService bridges AI output to mindmap commands

### Module Structure

```
src/
  core/       -- EventBus, MindMap, MindMapNode, NodeFactory, CommandManager
  canvas/     -- CanvasRenderer, PanZoom, ConnectionRenderer, NodeElement
  editor/     -- MarkdownEditor, MarkdownRenderer
  ai/         -- Web Worker, ModelService, ChatService, AIMediatorService
  layout/     -- TreeRightLayout, RadialLayout, LayoutManager
  export/     -- DocxExporter, PptxExporter, ImageExporter
  io/         -- FileManager, Serializer
  ui/         -- App, Toolbar, ChatPanel, ContextMenu, Modal, ThemeManager
```

## Development

```bash
npm run dev          # Start dev server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run build:lib    # Build library to dist/
npm run build:docs   # Build GitHub Pages site to docs/
npm run build        # Build both
```

## Tech Stack

- **TypeScript** with strict mode
- **Vite** for dev server and builds
- **Vitest** for testing
- **marked** + **highlight.js** for markdown rendering
- **@huggingface/transformers** for the AI model
- **docx** / **pptxgenjs** for document export
- **html-to-image** / **file-saver** for image export and file saving

## License

MIT
