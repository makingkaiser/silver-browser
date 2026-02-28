import { createRoot } from 'react-dom/client';
import '@src/index.css';
import SidePanel from '@src/SidePanel';

function applyDarkMode() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  document.documentElement.classList.toggle('dark', mq.matches);
  mq.addEventListener('change', e => {
    document.documentElement.classList.toggle('dark', e.matches);
  });
}

function init() {
  applyDarkMode();
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);
  root.render(<SidePanel />);
}

init();
