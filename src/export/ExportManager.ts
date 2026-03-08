import type { MindMap } from '../core/MindMap';
import { ImageExporter } from './ImageExporter';
import { DocxExporter } from './DocxExporter';
import { PptxExporter } from './PptxExporter';

export class ExportManager {
  private imageExporter = new ImageExporter();
  private docxExporter = new DocxExporter();
  private pptxExporter = new PptxExporter();

  async exportPng(canvasElement: HTMLElement, filename?: string): Promise<void> {
    await this.imageExporter.export(canvasElement, filename);
  }

  async exportDocx(mindmap: MindMap): Promise<void> {
    await this.docxExporter.export(mindmap);
  }

  async exportPptx(mindmap: MindMap): Promise<void> {
    await this.pptxExporter.export(mindmap);
  }
}
