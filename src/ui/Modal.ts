export interface ModalOptions {
  title: string;
  content: string | HTMLElement;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export class Modal {
  private overlay: HTMLElement;
  private dialog: HTMLElement;

  constructor(options: ModalOptions) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'mw-modal-overlay';
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.dialog = document.createElement('div');
    this.dialog.className = 'mw-modal';

    const header = document.createElement('div');
    header.className = 'mw-modal-header';
    header.textContent = options.title;
    this.dialog.appendChild(header);

    const body = document.createElement('div');
    body.className = 'mw-modal-body';
    if (typeof options.content === 'string') {
      body.innerHTML = options.content;
    } else {
      body.appendChild(options.content);
    }
    this.dialog.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'mw-modal-footer';

    if (options.showCancel !== false) {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'mw-toolbar-btn';
      cancelBtn.textContent = options.cancelLabel || 'Cancel';
      cancelBtn.addEventListener('click', () => {
        options.onCancel?.();
        this.close();
      });
      footer.appendChild(cancelBtn);
    }

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'mw-toolbar-btn mw-btn-primary';
    confirmBtn.textContent = options.confirmLabel || 'OK';
    confirmBtn.addEventListener('click', () => {
      options.onConfirm?.();
      this.close();
    });
    footer.appendChild(confirmBtn);

    this.dialog.appendChild(footer);
    this.overlay.appendChild(this.dialog);
  }

  open(): void {
    document.body.appendChild(this.overlay);
    requestAnimationFrame(() => {
      this.overlay.classList.add('mw-visible');
    });
  }

  close(): void {
    this.overlay.classList.remove('mw-visible');
    setTimeout(() => this.overlay.remove(), 150);
  }

  static confirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new Modal({
        title,
        content: `<p>${message}</p>`,
        confirmLabel: 'Confirm',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
      modal.open();
    });
  }

  static prompt(title: string, defaultValue = ''): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'mw-modal-input';
      input.value = defaultValue;
      input.placeholder = 'Enter text...';

      const container = document.createElement('div');
      container.appendChild(input);

      const modal = new Modal({
        title,
        content: container,
        confirmLabel: 'OK',
        onConfirm: () => resolve(input.value),
        onCancel: () => resolve(null),
      });
      modal.open();
      setTimeout(() => {
        input.focus();
        input.select();
      }, 100);
    });
  }
}
