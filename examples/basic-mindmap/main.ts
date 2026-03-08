/**
 * Basic MindWarp Example
 *
 * Demonstrates programmatic creation of a mindmap with the core API.
 */
import { App } from '../../src/ui/App';

const app = new App(document.getElementById('app')!);

// The App creates a default mindmap with "Central Idea" as root.
// You can access the mindmap programmatically:
const mindmap = app.getMindmap();
console.log('Mindmap title:', mindmap.title);
console.log('Node count:', mindmap.nodeCount);

// Keyboard shortcuts:
// Tab: Add child to selected node
// Enter: Edit selected node
// Delete: Delete selected node
// Ctrl+Z: Undo
// Ctrl+Y: Redo
// Ctrl+S: Save
// Space: Toggle collapse
// Double-click: Edit node
// Right-click: Context menu
