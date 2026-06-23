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

const fallbackTrack: ZydkaTrackInput = {
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

function readTrackFromRoot(root: HTMLElement): ZydkaTrackInput {
  return {
    id: root.dataset.trackId || fallbackTrack.id,
    title: root.dataset.title || fallbackTrack.title,
    artist: root.dataset.artist || fallbackTrack.artist,
    src: root.dataset.src || fallbackTrack.src,
  };
}

function renderText(value: string | number | undefined): string {
  return String(value ?? '');
}

function renderTestPlayer(root: HTMLElement, track: ZydkaTrackInput): void {
  root.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'zydka-player-card';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'zydka-player-eyebrow';
  eyebrow.textContent = 'Zydka Player';

  const title = document.createElement('h2');
  title.className = 'zydka-player-title';
  title.textContent = renderText(track.title);

  const artist = document.createElement('p');
  artist.className = 'zydka-player-artist';
  artist.textContent = renderText(track.artist);

  const actions = document.createElement('div');
  actions.className = 'zydka-player-actions';

  const playButton = document.createElement('button');
  playButton.className = 'zydka-player-button';
  playButton.type = 'button';
  playButton.textContent = 'Play';

  const pauseButton = document.createElement('button');
  pauseButton.className = 'zydka-player-button zydka-player-button-secondary';
  pauseButton.type = 'button';
  pauseButton.textContent = 'Pause';

  const status = document.createElement('p');
  status.className = 'zydka-player-status';
  status.append('Status: ');

  const statusValue = document.createElement('span');
  statusValue.textContent = 'idle';
  status.append(statusValue);

  const error = document.createElement('p');
  error.className = 'zydka-player-error';
  error.hidden = true;

  actions.append(playButton, pauseButton);
  card.append(eyebrow, title, artist, actions, status, error);
  root.append(card);

  const refreshState = (): void => {
    const state = window.ZydkaPlayer?.state();

    if (!state) return;

    statusValue.textContent = state.status;
    error.textContent = state.error ?? '';
    error.hidden = !state.error;
  };

  playButton.addEventListener('click', () => {
    window.ZydkaPlayer?.play(track);
    refreshState();
  });

  pauseButton.addEventListener('click', () => {
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

  const shortcodeTrack = readTrackFromRoot(root);

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

  renderTestPlayer(root, shortcodeTrack);

  console.log('[Zydka Player] Bridge initialized - window.ZydkaPlayer ready.');
}

document.addEventListener('DOMContentLoaded', bootstrap);
