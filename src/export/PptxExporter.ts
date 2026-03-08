import PptxGenJS from 'pptxgenjs';
import type { MindMap } from '../core/MindMap';
import type { MindMapNode } from '../core/MindMapNode';

export class PptxExporter {
  async export(mindmap: MindMap): Promise<void> {
    const pptx = new PptxGenJS();
    pptx.title = mindmap.title;
    pptx.author = mindmap.metadata.author || 'MindWarp';

    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(mindmap.root.content, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 2,
      fontSize: 36,
      bold: true,
      align: 'center',
      color: '1a1a2e',
    });

    if (mindmap.metadata.description) {
      titleSlide.addText(mindmap.metadata.description, {
        x: 0.5,
        y: 3.5,
        w: 9,
        h: 1,
        fontSize: 16,
        align: 'center',
        color: '6c757d',
      });
    }

    // One slide per depth-1 child
    for (const child of mindmap.root.children) {
      this.addBranchSlide(pptx, child);
    }

    const filename = `${mindmap.title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
    await pptx.writeFile({ fileName: filename });
  }

  private addBranchSlide(pptx: PptxGenJS, node: MindMapNode): void {
    const slide = pptx.addSlide();

    // Section title
    slide.addText(node.content, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 1,
      fontSize: 28,
      bold: true,
      color: '1a1a2e',
    });

    // Bullet points from children
    if (node.children.length > 0) {
      const bullets = this.collectBullets(node, 0);
      slide.addText(bullets, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 4.5,
        fontSize: 16,
        color: '333333',
        valign: 'top',
      });
    }
  }

  private collectBullets(
    node: MindMapNode,
    level: number
  ): Array<{ text: string; options: { indentLevel: number; bullet: boolean; fontSize: number } }> {
    const bullets: Array<{
      text: string;
      options: { indentLevel: number; bullet: boolean; fontSize: number };
    }> = [];

    for (const child of node.children) {
      bullets.push({
        text: child.content.split('\n')[0],
        options: {
          indentLevel: level,
          bullet: true,
          fontSize: Math.max(12, 16 - level * 2),
        },
      });

      if (child.children.length > 0) {
        bullets.push(...this.collectBullets(child, level + 1));
      }
    }

    return bullets;
  }
}
