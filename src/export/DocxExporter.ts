import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
} from 'docx';
import { saveAs } from 'file-saver';
import type { MindMap } from '../core/MindMap';
import type { MindMapNode } from '../core/MindMapNode';

const HEADING_MAP: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  0: HeadingLevel.TITLE,
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
};

export class DocxExporter {
  async export(mindmap: MindMap): Promise<void> {
    const paragraphs: Paragraph[] = [];
    this.buildParagraphs(mindmap.root, 0, paragraphs);

    const doc = new Document({
      title: mindmap.title,
      description: mindmap.metadata.description,
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${mindmap.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
  }

  private buildParagraphs(node: MindMapNode, depth: number, paragraphs: Paragraph[]): void {
    const heading = HEADING_MAP[Math.min(depth, 5)] || HeadingLevel.HEADING_5;

    if (depth <= 5) {
      paragraphs.push(
        new Paragraph({
          heading,
          children: [new TextRun({ text: node.content.split('\n')[0] })],
        })
      );

      // Add body text if content has multiple lines
      const lines = node.content.split('\n').slice(1);
      if (lines.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: lines.join('\n') })],
          })
        );
      }
    } else {
      // Deep nodes become bullet points
      paragraphs.push(
        new Paragraph({
          bullet: { level: Math.min(depth - 6, 4) },
          children: [new TextRun({ text: node.content })],
        })
      );
    }

    for (const child of node.children) {
      this.buildParagraphs(child, depth + 1, paragraphs);
    }
  }
}
