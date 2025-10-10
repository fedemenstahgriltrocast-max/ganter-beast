import { initializeApp } from './bootstrap.js';

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initializeApp({ window, document });
}

export { initializeApp };
