import { CANVAS } from '../constants';
import { EventBus } from '../core/EventBus';

export class PanZoom {
  private panX = 0;
  private panY = 0;
  private scale = 1;
  private isPanning = false;
  private startX = 0;
  private startY = 0;
  private container: HTMLElement;
  private viewport: HTMLElement;
  private eventBus: EventBus;

  constructor(container: HTMLElement, viewport: HTMLElement, eventBus: EventBus) {
    this.container = container;
    this.viewport = viewport;
    this.eventBus = eventBus;
    this.bindEvents();
    this.applyTransform();
  }

  private bindEvents(): void {
    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerup', this.onPointerUp);
    this.container.addEventListener('pointerleave', this.onPointerUp);
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private onPointerDown = (e: PointerEvent): void => {
    const target = e.target as HTMLElement;
    if (target.closest('.mw-node') || target.closest('.mw-node-btn') || target.closest('.mw-zoom-btn')) return;
    this.isPanning = true;
    this.startX = e.clientX - this.panX;
    this.startY = e.clientY - this.panY;
    this.container.classList.add('mw-panning');
    this.container.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isPanning) return;
    this.panX = e.clientX - this.startX;
    this.panY = e.clientY - this.startY;
    this.applyTransform();
    this.eventBus.emit('canvas:pan', { x: this.panX, y: this.panY });
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (!this.isPanning) return;
    this.isPanning = false;
    this.container.classList.remove('mw-panning');
    this.container.releasePointerCapture(e.pointerId);
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -CANVAS.ZOOM_STEP : CANVAS.ZOOM_STEP;
    const newScale = Math.min(
      CANVAS.MAX_ZOOM,
      Math.max(CANVAS.MIN_ZOOM, this.scale + delta)
    );

    if (newScale === this.scale) return;

    // Zoom toward cursor position
    const factor = newScale / this.scale;
    this.panX = mouseX - (mouseX - this.panX) * factor;
    this.panY = mouseY - (mouseY - this.panY) * factor;
    this.scale = newScale;

    this.applyTransform();
    this.eventBus.emit('canvas:zoom', { zoom: this.scale });
  };

  private applyTransform(): void {
    this.viewport.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
  }

  get currentZoom(): number {
    return this.scale;
  }

  get currentPan(): { x: number; y: number } {
    return { x: this.panX, y: this.panY };
  }

  setZoom(zoom: number): void {
    this.scale = Math.min(CANVAS.MAX_ZOOM, Math.max(CANVAS.MIN_ZOOM, zoom));
    this.applyTransform();
    this.eventBus.emit('canvas:zoom', { zoom: this.scale });
  }

  setPan(x: number, y: number): void {
    this.panX = x;
    this.panY = y;
    this.applyTransform();
    this.eventBus.emit('canvas:pan', { x: this.panX, y: this.panY });
  }

  zoomToFit(nodeBounds: { minX: number; minY: number; maxX: number; maxY: number; }): void {
    const containerRect = this.container.getBoundingClientRect();
    const contentWidth = nodeBounds.maxX - nodeBounds.minX + 100;
    const contentHeight = nodeBounds.maxY - nodeBounds.minY + 100;

    const scaleX = containerRect.width / contentWidth;
    const scaleY = containerRect.height / contentHeight;
    this.scale = Math.min(scaleX, scaleY, 1.5);
    this.scale = Math.max(CANVAS.MIN_ZOOM, Math.min(CANVAS.MAX_ZOOM, this.scale));

    const centerX = (nodeBounds.minX + nodeBounds.maxX) / 2;
    const centerY = (nodeBounds.minY + nodeBounds.maxY) / 2;
    this.panX = containerRect.width / 2 - centerX * this.scale;
    this.panY = containerRect.height / 2 - centerY * this.scale;

    this.applyTransform();
    this.eventBus.emit('canvas:zoom', { zoom: this.scale });
    this.eventBus.emit('canvas:pan', { x: this.panX, y: this.panY });
  }

  centerOn(x: number, y: number): void {
    const rect = this.container.getBoundingClientRect();
    this.panX = rect.width / 2 - x * this.scale;
    this.panY = rect.height / 2 - y * this.scale;
    this.applyTransform();
    this.eventBus.emit('canvas:pan', { x: this.panX, y: this.panY });
  }

  reset(): void {
    this.panX = 0;
    this.panY = 0;
    this.scale = 1;
    this.applyTransform();
  }

  destroy(): void {
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerup', this.onPointerUp);
    this.container.removeEventListener('pointerleave', this.onPointerUp);
    this.container.removeEventListener('wheel', this.onWheel);
  }
}
