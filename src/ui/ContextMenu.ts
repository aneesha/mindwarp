export interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export class ContextMenu {
  private menu: HTMLElement | null = null;
  private closeHandler: (e: Event) => void;

  constructor() {
    this.closeHandler = () => this.close();
  }

  show(x: number, y: number, items: ContextMenuItem[]): void {
    this.close();

    this.menu = document.createElement('div');
    this.menu.className = 'mw-context-menu';

    for (const item of items) {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'mw-context-separator';
        this.menu.appendChild(sep);
        continue;
      }

      const menuItem = document.createElement('button');
      menuItem.className = 'mw-context-item';
      menuItem.textContent = item.label;
      if (item.disabled) {
        menuItem.classList.add('mw-disabled');
        menuItem.disabled = true;
      }
      menuItem.addEventListener('click', () => {
        item.action();
        this.close();
      });
      this.menu.appendChild(menuItem);
    }

    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;
    document.body.appendChild(this.menu);

    // Adjust position if off-screen
    const rect = this.menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.menu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.menu.style.top = `${y - rect.height}px`;
    }

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', this.closeHandler);
      document.addEventListener('contextmenu', this.closeHandler);
    }, 0);
  }

  close(): void {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
      document.removeEventListener('click', this.closeHandler);
      document.removeEventListener('contextmenu', this.closeHandler);
    }
  }
}
