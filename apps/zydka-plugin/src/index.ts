import { WordPressBridge } from '@zydka/wordpress-bridge';

interface ZydkaTrack {
  id: number;
  audioUrl: string;
  title?: string;
  artist?: string;
  duration?: number;
}

interface ZydkaPlayerState {
  currentTrack: ZydkaTrack | null;
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';
  isPlaying: boolean;
  error: string | null;
}

interface ZydkaPlayerAPI {
  play: (track: ZydkaTrack) => void;
  pause: () => void;
  state: () => ZydkaPlayerState;
}

declare global {
  interface Window {
    ZydkaPlayer: ZydkaPlayerAPI | undefined;
  }
}

function bootstrap(): void {
  const root = document.getElementById('zydka-player-root');

  // Ne rien faire si le shortcode [zydka_player] n'est pas présent dans la page.
  if (!root) return;

  window.ZydkaPlayer = {
    play: (track: ZydkaTrack) => WordPressBridge.play(track),
    pause: () => WordPressBridge.pause(),
    state: () => {
      const { currentTrack, status, isPlaying, error } = WordPressBridge.state();
      return { currentTrack, status, isPlaying, error };
    },
  };

  console.log('[Zydka Player] Bridge initialized — window.ZydkaPlayer ready.');
}

document.addEventListener('DOMContentLoaded', bootstrap);
