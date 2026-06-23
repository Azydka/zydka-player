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
  position: number;
  duration: number;
  error: string | null;
}

interface ZydkaPlayerAPI {
  play: (track: ZydkaTrackInput) => void;
  pause: () => void;
  seek: (seconds: number) => number;
  getCurrentTime: () => number;
  getDuration: () => number;
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

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
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

  const timeline = document.createElement('div');
  timeline.className = 'zydka-player-timeline';

  const currentTime = document.createElement('span');
  currentTime.className = 'zydka-player-time';
  currentTime.textContent = '0:00';

  const progress = document.createElement('button');
  progress.className = 'zydka-player-progress';
  progress.type = 'button';
  progress.setAttribute('aria-label', 'Seek');
  progress.setAttribute('aria-valuemin', '0');
  progress.setAttribute('aria-valuemax', '100');
  progress.setAttribute('aria-valuenow', '0');
  progress.setAttribute('role', 'slider');

  const progressFill = document.createElement('span');
  progressFill.className = 'zydka-player-progress-fill';
  progress.append(progressFill);

  const duration = document.createElement('span');
  duration.className = 'zydka-player-time';
  duration.textContent = '0:00';

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
  timeline.append(currentTime, progress, duration);
  card.append(eyebrow, title, artist, actions, timeline, status, error);
  root.append(card);

  const refreshState = (): void => {
    const state = window.ZydkaPlayer?.state();

    if (!state) return;

    const position = window.ZydkaPlayer?.getCurrentTime() ?? state.position;
    const trackDuration = window.ZydkaPlayer?.getDuration() ?? state.duration;
    const progressPercent = trackDuration > 0 ? Math.min(100, (position / trackDuration) * 100) : 0;

    statusValue.textContent = state.status;
    currentTime.textContent = formatTime(position);
    duration.textContent = formatTime(trackDuration);
    progressFill.style.width = `${progressPercent}%`;
    progress.setAttribute('aria-valuenow', String(Math.round(progressPercent)));
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

  progress.addEventListener('click', (event) => {
    const trackDuration = window.ZydkaPlayer?.getDuration() ?? 0;

    if (trackDuration <= 0) return;

    const rect = progress.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));

    window.ZydkaPlayer?.seek(trackDuration * ratio);
    refreshState();
  });

  refreshState();
  window.setInterval(refreshState, 250);
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
    seek: (seconds: number) => WordPressBridge.seek(seconds),
    getCurrentTime: () => WordPressBridge.getCurrentTime(),
    getDuration: () => WordPressBridge.getDuration(),
    state: () => {
      const { currentTrack, status, isPlaying, position, duration, error } = WordPressBridge.state();
      return { currentTrack, status, isPlaying, position, duration, error };
    },
  };

  renderTestPlayer(root, shortcodeTrack);

  console.log('[Zydka Player] Bridge initialized - window.ZydkaPlayer ready.');
}

document.addEventListener('DOMContentLoaded', bootstrap);
