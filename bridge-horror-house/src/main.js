import { Game } from './Game.js';

function boot() {
  const loading = document.getElementById('loading');
  try {
    window.__game = new Game();
    // scene is ready behind the title; hide the loading veil
    loading.style.display = 'none';
  } catch (err) {
    loading.textContent = 'Failed to summon the dark: ' + err.message;
    console.error(err);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
