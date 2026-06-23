import { WordPressBridge } from '@zydka/wordpress-bridge';

interface ZydkaTrackInput {
  id: string | number;
  src?: string;
  audioUrl?: string;
  title?: string;
  artist?: string;
  duration?: number;
}

interface ZydkaTrack {
  id: string | number;
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
  play: (track: ZydkaTrackInput) => void;
  pause: () => void;
  state: () => ZydkaPlayerState;
}

const testTrack: ZydkaTrackInput = {
  id: 'demo-track',
  title: 'Demo Track',
  artist: 'Atelier Zydka',
  src: 'https://www.louis94.com/wp-content/uploads/2026/06/04.-New-York-Shit-feat.-Swizz-Beatz.mp3',
};

declare global {
  interface Window {
    ZydkaPlayer: ZydkaPlayerAPI | undefined;
  }
}

function normalizeTrack(track: ZydkaTrackInput): ZydkaTrack | null {
  const audioUrl = track.audioUrl ?? track.src;

  if (!audioUrl) {
    console.error(
      '[Zydka Player] Cannot play track: provide an audio URL with "audioUrl" or "src".',
      track,
    );
    return null;
  }

  return {
    id: track.id,
    audioUrl,
    title: track.title,
    artist: track.artist,
    duration: track.duration,
  };
}

function renderTestPlayer(root: HTMLElement): void {
  root.innerHTML = `
    <div class="zydka-player-card">
      <p class="zydka-player-eyebrow">Zydka Player</p>
      <h2 class="zydka-player-title">${testTrack.title}</h2>
      <p class="zydka-player-artist">${testTrack.artist}</p>
      <div class="zydka-player-actions">
        <button class="zydka-player-button" type="button" data-zydka-action="play">Play</button>
        <button class="zydka-player-button zydka-player-button-secondary" type="button" data-zydka-action="pause">Pause</button>
      </div>
      <p class="zydka-player-status">Status: <span data-zydka-status>idle</span></p>
      <p class="zydka-player-error" data-zydka-error hidden></p>
    </div>
  `;

  const statusElement = root.querySelector<HTMLElement>('[data-zydka-status]');
  const errorElement = root.querySelector<HTMLElement>('[data-zydka-error]');
  const playButton = root.querySelector<HTMLButtonElement>('[data-zydka-action="play"]');
  const pauseButton = root.querySelector<HTMLButtonElement>('[data-zydka-action="pause"]');

  const refreshState = (): void => {
    const state = window.ZydkaPlayer?.state();

    if (!state) return;

    if (statusElement) {
      statusElement.textContent = state.status;
    }

    if (errorElement) {
      errorElement.textContent = state.error ?? '';
      errorElement.hidden = !state.error;
    }
  };

  playButton?.addEventListener('click', () => {
    window.ZydkaPlayer?.play(testTrack);
    refreshState();
  });

  pauseButton?.addEventListener('click', () => {
    window.ZydkaPlayer?.pause();
    refreshState();
  });

  refreshState();
  window.setInterval(refreshState, 500);
}

function bootstrap(): void {
  const root = document.getElementById('zydka-player-root');
  // Ne rien faire si le shortcode [zydka_player] n'est pas present dans la page.
  if (!root) return;

  window.ZydkaPlayer = {
    play: (track: ZydkaTrackInput) => {
      const normalizedTrack = normalizeTrack(track);

      if (!normalizedTrack) return;

      WordPressBridge.play(normalizedTrack);
    },
    pause: () => WordPressBridge.pause(),
    state: () => {
      const { currentTrack, status, isPlaying, error } = WordPressBridge.state();
      return { currentTrack, status, isPlaying, error };
    },
  };

  renderTestPlayer(root);

  console.log('[Zydka Player] Bridge initialized - window.ZydkaPlayer ready.');
}

document.addEventListener('DOMContentLoaded', bootstrap);
