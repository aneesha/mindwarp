/**
 * Export Demo
 *
 * Demonstrates the export capabilities of MindWarp.
 *
 * Use the Export dropdown in the toolbar to:
 * - Export as PNG image
 * - Export as Word document (.docx)
 * - Export as PowerPoint presentation (.pptx)
 *
 * Use Save/Load to persist mindmaps as .mindwarp.json files.
 *
 * The DOCX export maps tree depth to heading levels:
 * - Root -> Title
 * - Depth 1 -> Heading 1
 * - Depth 2 -> Heading 2
 * - etc.
 *
 * The PPTX export creates:
 * - Title slide from root node
 * - One content slide per depth-1 branch with bullet points
 */
import { App } from '../../src/ui/App';

const app = new App(document.getElementById('app')!);
console.log('Export demo loaded. Use the Export dropdown in the toolbar.');
