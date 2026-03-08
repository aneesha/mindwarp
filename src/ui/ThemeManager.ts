export type Theme = 'light' | 'dark';

export class ThemeManager {
  private current: Theme = 'light';

  constructor() {
    const saved = localStorage.getItem('mw-theme') as Theme | null;
    if (saved) {
      this.setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setTheme('dark');
    }
  }

  setTheme(theme: Theme): void {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mw-theme', theme);
  }

  toggle(): void {
    this.setTheme(this.current === 'light' ? 'dark' : 'light');
  }

  get theme(): Theme {
    return this.current;
  }
}
