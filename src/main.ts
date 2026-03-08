import { App } from './ui/App';

const appEl = document.getElementById('app');
if (!appEl) throw new Error('#app element not found');

const app = new App(appEl);

// Expose for debugging
(window as unknown as Record<string, unknown>).mindwarp = app;
