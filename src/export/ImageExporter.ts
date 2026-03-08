import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';

export class ImageExporter {
  async export(canvasElement: HTMLElement, filename: string = 'mindmap.png'): Promise<void> {
    const viewport = canvasElement.querySelector('.mw-viewport') as HTMLElement;
    if (!viewport) throw new Error('Canvas viewport not found');

    // Temporarily remove transform for clean capture
    const originalTransform = viewport.style.transform;
    viewport.style.transform = 'none';

    try {
      const dataUrl = await toPng(viewport, {
        backgroundColor: '#ffffff',
        quality: 1.0,
        pixelRatio: 2,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      saveAs(blob, filename);
    } finally {
      viewport.style.transform = originalTransform;
    }
  }
}
