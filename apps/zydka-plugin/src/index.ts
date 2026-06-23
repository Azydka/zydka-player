import { WordPressBridge } from '@zydka/wordpress-bridge';
import { getEmbeddedCoverUrl, revokeEmbeddedCoverCache } from './metadataCover';

interface ZydkaTrackInput {
  id: string | number;
  src?: string;
  audioUrl?: string;
  title?: string;
  artist?: string;
  cover?: string;
  buy_url?: string;
  buy_label?: string;
  buyUrl?: string;
  buyLabel?: string;
  duration?: number;
}

interface ZydkaTrack {
  id: string | number;
  audioUrl: string;
  title?: string;
  artist?: string;
  cover?: string;
  buyUrl?: string;
  buyLabel?: string;
  duration?: number;
}

interface ZydkaPlayerState {
  currentTrack: ZydkaTrack | null;
  currentIndex: number;
  queue: ZydkaTrack[];
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  error: string | null;
}

interface ZydkaPlayerAPI {
  play: (track: ZydkaTrackInput) => void;
  pause: () => void;
  seek: (seconds: number) => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  setQueue: (tracks: ZydkaTrackInput[]) => void;
  getQueue: () => ZydkaTrack[];
  getCurrentIndex: () => number;
  playAt: (index: number) => boolean;
  next: () => boolean;
  previous: () => boolean;
  setVolume: (value: number) => number;
  getVolume: () => number;
  mute: () => void;
  unmute: () => void;
  isMuted: () => boolean;
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
    cover: track.cover,
    buyUrl: track.buyUrl ?? track.buy_url,
    buyLabel: track.buyLabel ?? track.buy_label,
    duration: track.duration,
  };
}

function normalizeQueue(tracks: ZydkaTrackInput[]): ZydkaTrack[] {
  return tracks.reduce<ZydkaTrack[]>((queue, track) => {
    const normalizedTrack = normalizeTrack(track);

    if (normalizedTrack) {
      queue.push(normalizedTrack);
    }

    return queue;
  }, []);
}

function readTrackFromRoot(root: HTMLElement): ZydkaTrackInput {
  return {
    id: root.dataset.trackId || fallbackTrack.id,
    title: root.dataset.title || fallbackTrack.title,
    artist: root.dataset.artist || fallbackTrack.artist,
    src: root.dataset.src || fallbackTrack.src,
    cover: root.dataset.cover || fallbackTrack.cover,
    buyUrl: root.dataset.buyUrl,
    buyLabel: root.dataset.buyLabel,
  };
}

function readQueueFromRoot(root: HTMLElement, fallbackSingleTrack: ZydkaTrackInput): ZydkaTrackInput[] {
  if (!root.dataset.tracks) {
    return [fallbackSingleTrack];
  }

  try {
    const parsedTracks = JSON.parse(root.dataset.tracks) as ZydkaTrackInput[];

    if (Array.isArray(parsedTracks) && parsedTracks.length > 0) {
      return parsedTracks;
    }
  } catch (error) {
    console.error('[Zydka Player] Cannot parse playlist tracks.', error);
  }

  return [fallbackSingleTrack];
}

function renderText(value: string | number | undefined): string {
  return String(value ?? '');
}

function getCoverLabel(track: ZydkaTrackInput | ZydkaTrack | null | undefined): string {
  const label = track?.title || track?.artist || 'Z';
  return String(label).trim().charAt(0).toUpperCase() || 'Z';
}

function hasExplicitCover(track: ZydkaTrack | null | undefined): boolean {
  return Boolean(track?.cover?.trim());
}

function getBuyLabel(track: ZydkaTrack | null | undefined): string {
  return track?.buyLabel?.trim() || 'Voir le projet';
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function renderTestPlayer(root: HTMLElement, fallbackDisplayTrack: ZydkaTrackInput): void {
  root.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'zydka-player-card zydka-player-state-idle';

  const header = document.createElement('div');
  header.className = 'zydka-player-header';

  const textBlock = document.createElement('div');
  textBlock.className = 'zydka-player-track-meta';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'zydka-player-eyebrow';
  eyebrow.textContent = 'Zydka Player';

  const title = document.createElement('h2');
  title.className = 'zydka-player-title';
  title.textContent = renderText(fallbackDisplayTrack.title);

  const artist = document.createElement('p');
  artist.className = 'zydka-player-artist';
  artist.textContent = renderText(fallbackDisplayTrack.artist);

  const buyLink = document.createElement('a');
  buyLink.className = 'zydka-player-buy-link';
  buyLink.target = '_blank';
  buyLink.rel = 'noopener noreferrer';
  buyLink.hidden = true;

  const cover = document.createElement('div');
  cover.className = 'zydka-player-cover';

  const coverImage = document.createElement('img');
  coverImage.className = 'zydka-player-cover-image';
  coverImage.alt = '';
  coverImage.hidden = true;

  const coverFallback = document.createElement('span');
  coverFallback.className = 'zydka-player-cover-fallback';
  coverFallback.textContent = getCoverLabel(fallbackDisplayTrack);

  cover.append(coverImage, coverFallback);

  const headerAside = document.createElement('div');
  headerAside.className = 'zydka-player-header-aside';

  const trackCounter = document.createElement('p');
  trackCounter.className = 'zydka-player-counter';
  trackCounter.textContent = 'Track 1 / 1';

  headerAside.append(cover, trackCounter);

  const status = document.createElement('p');
  status.className = 'zydka-player-status';
  status.append('Status: ');

  const statusValue = document.createElement('span');
  statusValue.textContent = 'idle';
  status.append(statusValue);

  textBlock.append(eyebrow, title, artist, buyLink);
  header.append(textBlock, headerAside);

  const actions = document.createElement('div');
  actions.className = 'zydka-player-actions';

  const previousButton = document.createElement('button');
  previousButton.className = 'zydka-player-button zydka-player-nav-button';
  previousButton.type = 'button';
  previousButton.textContent = 'Previous';

  const toggleButton = document.createElement('button');
  toggleButton.className = 'zydka-player-button zydka-player-toggle-button';
  toggleButton.type = 'button';
  toggleButton.textContent = 'Play';
  toggleButton.setAttribute('aria-label', 'Play');

  const nextButton = document.createElement('button');
  nextButton.className = 'zydka-player-button zydka-player-nav-button';
  nextButton.type = 'button';
  nextButton.textContent = 'Next';

  const queueButton = document.createElement('button');
  queueButton.className = 'zydka-player-button zydka-player-queue-button';
  queueButton.type = 'button';
  queueButton.textContent = 'Queue';
  queueButton.setAttribute('aria-expanded', 'false');

  actions.append(previousButton, toggleButton, nextButton, queueButton);

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

  timeline.append(currentTime, progress, duration);

  const volumeControl = document.createElement('div');
  volumeControl.className = 'zydka-player-volume';

  const muteButton = document.createElement('button');
  muteButton.className = 'zydka-player-button zydka-player-mute-button';
  muteButton.type = 'button';
  muteButton.textContent = 'Mute';
  muteButton.setAttribute('aria-label', 'Mute');

  const volumeLabel = document.createElement('label');
  volumeLabel.className = 'zydka-player-volume-label';
  volumeLabel.textContent = 'Volume';

  const volumeSlider = document.createElement('input');
  volumeSlider.className = 'zydka-player-volume-slider';
  volumeSlider.type = 'range';
  volumeSlider.min = '0';
  volumeSlider.max = '1';
  volumeSlider.step = '0.01';
  volumeSlider.value = '1';
  volumeSlider.setAttribute('aria-label', 'Volume');

  const volumeValue = document.createElement('span');
  volumeValue.className = 'zydka-player-volume-value';
  volumeValue.textContent = '100%';

  volumeControl.append(muteButton, volumeLabel, volumeSlider, volumeValue);

  const queuePanel = document.createElement('div');
  queuePanel.className = 'zydka-player-queue-panel';
  queuePanel.hidden = true;
  queuePanel.setAttribute('aria-hidden', 'true');

  const queuePanelHeader = document.createElement('div');
  queuePanelHeader.className = 'zydka-player-queue-header';

  const queuePanelTitle = document.createElement('h3');
  queuePanelTitle.className = 'zydka-player-queue-title';
  queuePanelTitle.textContent = 'Playlist';

  const closeQueueButton = document.createElement('button');
  closeQueueButton.className = 'zydka-player-queue-close';
  closeQueueButton.type = 'button';
  closeQueueButton.textContent = 'Close';
  closeQueueButton.setAttribute('aria-label', 'Close playlist');

  queuePanelHeader.append(queuePanelTitle, closeQueueButton);

  const queueList = document.createElement('div');
  queueList.className = 'zydka-player-queue-list';
  queueList.setAttribute('role', 'list');

  queuePanel.append(queuePanelHeader, queueList);

  const footer = document.createElement('div');
  footer.className = 'zydka-player-footer';

  const error = document.createElement('p');
  error.className = 'zydka-player-error';
  error.hidden = true;

  footer.append(status, error);
  card.append(header, actions, timeline, volumeControl, footer, queuePanel);
  root.append(card);

  const failedCoverUrls = new Set<string>();
  const embeddedCoverUrls = new Map<string, string>();
  const requestedEmbeddedCoverUrls = new Set<string>();

  let refreshState = (): void => undefined;

  const getDisplayCoverUrl = (track: ZydkaTrack | null | undefined): string | null => {
    if (!track) return null;
    if (hasExplicitCover(track)) return track.cover ?? null;
    return embeddedCoverUrls.get(track.audioUrl) ?? null;
  };

  const requestEmbeddedCover = (track: ZydkaTrack | null | undefined): void => {
    if (!track || hasExplicitCover(track) || requestedEmbeddedCoverUrls.has(track.audioUrl)) {
      return;
    }

    requestedEmbeddedCoverUrls.add(track.audioUrl);

    void getEmbeddedCoverUrl(track.audioUrl).then((coverUrl) => {
      if (!coverUrl) return;

      embeddedCoverUrls.set(track.audioUrl, coverUrl);
      refreshState();
    });
  };

  const setQueuePanelOpen = (isOpen: boolean): void => {
    queuePanel.hidden = !isOpen;
    queuePanel.classList.toggle('is-open', isOpen);
    queuePanel.setAttribute('aria-hidden', String(!isOpen));
    queueButton.setAttribute('aria-expanded', String(isOpen));
  };

  const renderQueueItems = (queue: ZydkaTrack[], currentIndex: number): void => {
    queueList.innerHTML = '';

    if (queue.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'zydka-player-queue-empty';
      empty.textContent = 'No tracks in queue.';
      queueList.append(empty);
      return;
    }

    queue.forEach((track, index) => {
      const item = document.createElement('button');
      const isActive = index === currentIndex;

      item.className = isActive
        ? 'zydka-player-queue-item is-active'
        : 'zydka-player-queue-item';
      item.type = 'button';
      item.setAttribute('role', 'listitem');
      item.setAttribute('aria-current', isActive ? 'true' : 'false');

      const thumb = document.createElement('span');
      thumb.className = 'zydka-player-queue-thumb';

      const thumbImage = document.createElement('img');
      thumbImage.className = 'zydka-player-queue-thumb-image';
      thumbImage.alt = '';
      thumbImage.hidden = true;

      const thumbFallback = document.createElement('span');
      thumbFallback.className = 'zydka-player-queue-thumb-fallback';
      thumbFallback.textContent = getCoverLabel(track);
      if (queuePanel.classList.contains('is-open')) {
        requestEmbeddedCover(track);
      }

      const thumbCoverUrl = getDisplayCoverUrl(track);

      if (thumbCoverUrl && !failedCoverUrls.has(thumbCoverUrl)) {
        thumbImage.src = thumbCoverUrl;
        thumbImage.dataset.coverSrc = thumbCoverUrl;
        thumbImage.hidden = false;
        thumbFallback.hidden = true;
      }

      thumbImage.addEventListener('error', () => {
        const failedCover = thumbImage.dataset.coverSrc;

        if (failedCover) {
          failedCoverUrls.add(failedCover);
        }

        thumbImage.removeAttribute('src');
        thumbImage.hidden = true;
        thumbFallback.hidden = false;
      });

      thumb.append(thumbImage, thumbFallback);

      const number = document.createElement('span');
      number.className = 'zydka-player-queue-number';
      number.textContent = String(index + 1).padStart(2, '0');

      const meta = document.createElement('span');
      meta.className = 'zydka-player-queue-meta';

      const itemTitle = document.createElement('span');
      itemTitle.className = 'zydka-player-queue-track-title';
      itemTitle.textContent = renderText(track.title || 'Track ' + String(index + 1));

      const itemArtist = document.createElement('span');
      itemArtist.className = 'zydka-player-queue-track-artist';
      itemArtist.textContent = renderText(track.artist || '');

      meta.append(itemTitle, itemArtist);
      item.append(thumb, number, meta);

      item.addEventListener('click', () => {
        window.ZydkaPlayer?.playAt(index);
        refreshState();
      });

      queueList.append(item);
    });
  };

  refreshState = (): void => {
    const state = window.ZydkaPlayer?.state();

    if (!state) return;

    const queue = window.ZydkaPlayer?.getQueue() ?? state.queue;
    const currentIndex = window.ZydkaPlayer?.getCurrentIndex() ?? state.currentIndex;
    const displayTrack = state.currentTrack ?? queue[currentIndex] ?? normalizeTrack(fallbackDisplayTrack);
    const position = window.ZydkaPlayer?.getCurrentTime() ?? state.position;
    const trackDuration = window.ZydkaPlayer?.getDuration() ?? state.duration;
    const progressPercent = trackDuration > 0 ? Math.min(100, (position / trackDuration) * 100) : 0;
    const displayIndex = queue.length > 0 ? Math.max(0, currentIndex) + 1 : 0;
    const volume = window.ZydkaPlayer?.getVolume() ?? state.volume;
    const muted = window.ZydkaPlayer?.isMuted() ?? state.muted;

    card.className = `zydka-player-card zydka-player-state-${state.status}`;
    title.textContent = renderText(displayTrack?.title ?? fallbackDisplayTrack.title);
    artist.textContent = renderText(displayTrack?.artist ?? fallbackDisplayTrack.artist);
    const buyUrl = displayTrack?.buyUrl?.trim();

    if (buyUrl) {
      buyLink.href = buyUrl;
      buyLink.textContent = getBuyLabel(displayTrack);
      buyLink.hidden = false;
    } else {
      buyLink.removeAttribute('href');
      buyLink.textContent = '';
      buyLink.hidden = true;
    }

    coverFallback.textContent = getCoverLabel(displayTrack ?? fallbackDisplayTrack);
    requestEmbeddedCover(displayTrack);

    const displayCoverUrl = getDisplayCoverUrl(displayTrack);

    if (displayCoverUrl && !failedCoverUrls.has(displayCoverUrl)) {
      coverImage.src = displayCoverUrl;
      coverImage.dataset.coverSrc = displayCoverUrl;
      coverImage.hidden = false;
      coverFallback.hidden = true;
    } else {
      coverImage.removeAttribute('src');
      coverImage.hidden = true;
      coverFallback.hidden = false;
    }

    trackCounter.textContent = `Track ${displayIndex} / ${queue.length}`;
    previousButton.disabled = currentIndex <= 0;
    nextButton.disabled = currentIndex >= queue.length - 1;
    toggleButton.textContent = state.isPlaying ? 'Pause' : 'Play';
    toggleButton.setAttribute('aria-label', state.isPlaying ? 'Pause' : 'Play');
    statusValue.textContent = state.status;
    currentTime.textContent = formatTime(position);
    duration.textContent = formatTime(trackDuration);
    progressFill.style.width = `${progressPercent}%`;
    progress.setAttribute('aria-valuenow', String(Math.round(progressPercent)));
    volumeSlider.value = String(volume);
    volumeValue.textContent = `${Math.round(volume * 100)}%`;
    muteButton.textContent = muted ? 'Unmute' : 'Mute';
    muteButton.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    renderQueueItems(queue, currentIndex);
    error.textContent = state.error ?? '';
    error.hidden = !state.error;
  };

  coverImage.addEventListener('error', () => {
    const failedCover = coverImage.dataset.coverSrc;

    if (failedCover) {
      failedCoverUrls.add(failedCover);
    }

    coverImage.removeAttribute('src');
    coverImage.hidden = true;
    coverFallback.hidden = false;
  });

  previousButton.addEventListener('click', () => {
    window.ZydkaPlayer?.previous();
    refreshState();
  });

  toggleButton.addEventListener('click', () => {
    const state = window.ZydkaPlayer?.state();

    if (state?.isPlaying) {
      window.ZydkaPlayer?.pause();
    } else {
      const currentIndex = window.ZydkaPlayer?.getCurrentIndex() ?? 0;
      window.ZydkaPlayer?.playAt(Math.max(0, currentIndex));
    }

    refreshState();
  });

  nextButton.addEventListener('click', () => {
    window.ZydkaPlayer?.next();
    refreshState();
  });

  queueButton.addEventListener('click', () => {
    setQueuePanelOpen(!queuePanel.classList.contains('is-open'));
    refreshState();
  });

  closeQueueButton.addEventListener('click', () => {
    setQueuePanelOpen(false);
  });

  muteButton.addEventListener('click', () => {
    if (window.ZydkaPlayer?.isMuted()) {
      window.ZydkaPlayer.unmute();
    } else {
      window.ZydkaPlayer?.mute();
    }

    refreshState();
  });

  volumeSlider.addEventListener('input', () => {
    const nextVolume = Number(volumeSlider.value);

    window.ZydkaPlayer?.setVolume(nextVolume);

    if (nextVolume > 0 && window.ZydkaPlayer?.isMuted()) {
      window.ZydkaPlayer.unmute();
    }

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

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setQueuePanelOpen(false);
    }
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
    setQueue: (tracks: ZydkaTrackInput[]) => WordPressBridge.setQueue(normalizeQueue(tracks)),
    getQueue: () => WordPressBridge.getQueue(),
    getCurrentIndex: () => WordPressBridge.getCurrentIndex(),
    playAt: (index: number) => WordPressBridge.playAt(index),
    next: () => WordPressBridge.next(),
    previous: () => WordPressBridge.previous(),
    setVolume: (value: number) => WordPressBridge.setVolume(value),
    getVolume: () => WordPressBridge.getVolume(),
    mute: () => WordPressBridge.mute(),
    unmute: () => WordPressBridge.unmute(),
    isMuted: () => WordPressBridge.isMuted(),
    state: () => {
      const { currentTrack, currentIndex, queue, status, isPlaying, position, duration, volume, muted, error } = WordPressBridge.state();
      return { currentTrack, currentIndex, queue, status, isPlaying, position, duration, volume, muted, error };
    },
  };

  const shortcodeQueue = readQueueFromRoot(root, shortcodeTrack);

  window.ZydkaPlayer.setQueue(shortcodeQueue);
  renderTestPlayer(root, shortcodeQueue[0] ?? shortcodeTrack);

  console.log('[Zydka Player] Bridge initialized - window.ZydkaPlayer ready.');
}

document.addEventListener('DOMContentLoaded', bootstrap);
window.addEventListener('beforeunload', revokeEmbeddedCoverCache, { once: true });
