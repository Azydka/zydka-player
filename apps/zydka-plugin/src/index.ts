/**
 * Zydka Player — Bootstrap WordPress
 *
 * Point d'entrée TypeScript du plugin.
 * Ce fichier sera compilé et bundlé vers assets/js/zydka-player.js.
 *
 * Prochaine étape : intégrer @zydka/wordpress-bridge pour piloter
 * le lecteur audio depuis le shortcode [zydka_player].
 */

function bootstrap(): void {
  const root = document.getElementById('zydka-player-root');

  if (!root) return;

  // TODO: initialiser @zydka/wordpress-bridge ici
  // import { WordPressBridge } from '@zydka/wordpress-bridge';
  // new WordPressBridge(root).mount();

  console.log('[Zydka Player] Root element found — player bootstrap ready.');
}

document.addEventListener('DOMContentLoaded', bootstrap);
