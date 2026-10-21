import { WordPressBridge } from '@zydka/wordpress-bridge';
import { getEmbeddedCoverUrl, revokeEmbeddedCoverCache } from './metadataCover';
import { setupMediaSession } from './mediaSession';
import { findTrackIndex, getShareText, getTrackHash, parseTrackHash } from './sharedTrack';
import {
  cycleRepeatMode,
  getNextTrack,
  getPreviousIndex,
  type AdvanceReason,
  type QueueNavigationState,
  type RepeatMode,
} from './queueNavigation';
import {
  clampSeekTime,
  formatTime,
  getKeyboardSeekTarget,
  getTimelineDisplay,
  isKnownDuration,
  needsEmbeddedCover,
  resolveCoverUrl,
} from './timeline';

interface ZydkaTrackInput {
  id: string | number;
  src?: string;
  audioUrl?: string;
  title?: string;
  artist?: string;
  cover?: string;
  album?: string;
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
  album?: string;
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
  resume: () => void;
  setQueue: (tracks: ZydkaTrackInput[]) => void;
  getQueue: () => ZydkaTrack[];
  getCurrentIndex: () => number;
  playAt: (index: number) => boolean;
  select: (index: number) => boolean;
  next: () => boolean;
  previous: () => boolean;
  setVolume: (value: number) => number;
  getVolume: () => number;
  mute: () => void;
  unmute: () => void;
  isMuted: () => boolean;
  onEnded: (listener: () => void) => () => void;
  state: () => ZydkaPlayerState;
}

const UNAVAILABLE_TRACK_MESSAGE = 'Ce morceau est indisponible pour le moment.';

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
    album: track.album,
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
    id: root.dataset.trackId || 'track-1',
    title: root.dataset.title,
    artist: root.dataset.artist,
    src: root.dataset.src,
    cover: root.dataset.cover,
    album: root.dataset.album,
    buyUrl: root.dataset.buyUrl,
    buyLabel: root.dataset.buyLabel,
  };
}

function readQueueFromRoot(root: HTMLElement, fallbackSingleTrack: ZydkaTrackInput): ZydkaTrackInput[] {
  const singleTrackQueue = fallbackSingleTrack.src ? [fallbackSingleTrack] : [];

  if (!root.dataset.tracks) {
    return singleTrackQueue;
  }

  try {
    const parsedTracks = JSON.parse(root.dataset.tracks) as ZydkaTrackInput[];

    if (Array.isArray(parsedTracks) && parsedTracks.length > 0) {
      return parsedTracks;
    }
  } catch (error) {
    console.error('[Zydka Player] Cannot parse playlist tracks.', error);
  }

  return singleTrackQueue;
}

function renderText(value: string | number | undefined): string {
  return String(value ?? '');
}

function getCoverLabel(track: ZydkaTrackInput | ZydkaTrack | null | undefined): string {
  const label = track?.title || track?.artist || 'Z';
  return String(label).trim().charAt(0).toUpperCase() || 'Z';
}

function getBuyLabel(track: ZydkaTrack | null | undefined): string {
  return track?.buyLabel?.trim() || 'Voir le projet';
}

type ControlIconName = 'shuffle' | 'previous' | 'play' | 'pause' | 'next' | 'repeat' | 'volume' | 'muted' | 'share';

const controlIcons: Record<ControlIconName, string> = {
  shuffle: `
    <svg class="zydka-player-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4.75 7.5h2.2c2.05 0 3.25 1.05 4.45 3.2l1.2 2.15c1.2 2.1 2.4 3.15 4.45 3.15h2.2" />
      <path d="M16.75 13.6 19.25 16l-2.5 2.4" />
      <path d="M4.75 16h2.2c1.25 0 2.16-.38 2.95-1.22" />
      <path d="M13.8 8.66c.86-.8 1.82-1.16 3.25-1.16h2.2" />
      <path d="M16.75 5.1 19.25 7.5l-2.5 2.4" />
    </svg>
  `,
  previous: `
    <svg class="zydka-player-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7.25 6.75v10.5" />
      <path d="M17.5 7.25 9.25 12l8.25 4.75V7.25Z" />
    </svg>
  `,
  play: `
    <svg class="zydka-player-control-icon zydka-player-control-icon--play" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 6.85 17.15 12 9 17.15V6.85Z" />
    </svg>
  `,
  pause: `
    <svg class="zydka-player-control-icon zydka-player-control-icon--pause" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8.35 6.75h2.7v10.5h-2.7z" />
      <path d="M12.95 6.75h2.7v10.5h-2.7z" />
    </svg>
  `,
  next: `
    <svg class="zydka-player-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M16.75 6.75v10.5" />
      <path d="M6.5 7.25 14.75 12 6.5 16.75V7.25Z" />
    </svg>
  `,
  repeat: `
    <svg class="zydka-player-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M17.75 7.25H8.25a3.5 3.5 0 0 0-3.5 3.5v.75" />
      <path d="M15.75 5.25 17.75 7.25l-2 2" />
      <path d="M6.25 16.75h9.5a3.5 3.5 0 0 0 3.5-3.5v-.75" />
      <path d="M8.25 18.75 6.25 16.75l2-2" />
    </svg>
  `,
  volume: `
    <svg class="zydka-player-control-icon zydka-player-control-icon--volume" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4.75 9.25h3.1l4.4-3.25v12l-4.4-3.25h-3.1v-5.5Z" />
      <path d="M15.45 8.55a4.85 4.85 0 0 1 0 6.9" />
      <path d="M17.65 6.35a7.95 7.95 0 0 1 0 11.3" />
    </svg>
  `,
  muted: `
    <svg class="zydka-player-control-icon zydka-player-control-icon--volume" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4.75 9.25h3.1l4.4-3.25v12l-4.4-3.25h-3.1v-5.5Z" />
      <path d="m16 9 4 6" />
      <path d="m20 9-4 6" />
    </svg>
  `,
  share: `
    <svg class="zydka-player-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8.75 12.7 15.25 16" />
      <path d="M15.25 8 8.75 11.3" />
      <path d="M6.5 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
      <path d="M17.5 9.75a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
      <path d="M17.5 18.75a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
    </svg>
  `,
};

function setIconButton(button: HTMLButtonElement, label: string, icon: ControlIconName): void {
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);

  if (button.dataset.icon === icon) return;

  button.dataset.icon = icon;
  button.innerHTML = controlIcons[icon];
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
  trackCounter.textContent = '1 / 1';

  headerAside.append(cover, trackCounter);

  textBlock.append(eyebrow, title, artist, buyLink);
  header.append(textBlock, headerAside);

  const actions = document.createElement('div');
  actions.className = 'zydka-player-actions';

  const shuffleButton = document.createElement('button');
  shuffleButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-mode-button zydka-player-shuffle-button';
  shuffleButton.type = 'button';
  shuffleButton.setAttribute('aria-pressed', 'false');
  setIconButton(shuffleButton, 'Activer la lecture aléatoire', 'shuffle');

  const previousButton = document.createElement('button');
  previousButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-nav-button';
  previousButton.type = 'button';
  setIconButton(previousButton, 'Morceau précédent', 'previous');

  const toggleButton = document.createElement('button');
  toggleButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-toggle-button';
  toggleButton.type = 'button';
  setIconButton(toggleButton, 'Lecture', 'play');

  const nextButton = document.createElement('button');
  nextButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-nav-button';
  nextButton.type = 'button';
  setIconButton(nextButton, 'Morceau suivant', 'next');

  const repeatButton = document.createElement('button');
  repeatButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-mode-button zydka-player-repeat-button';
  repeatButton.type = 'button';
  repeatButton.setAttribute('aria-pressed', 'false');
  setIconButton(repeatButton, 'Activer la répétition', 'repeat');

  const queueButton = document.createElement('button');
  queueButton.className = 'zydka-player-button zydka-player-queue-button';
  queueButton.type = 'button';
  queueButton.textContent = 'À suivre';
  queueButton.setAttribute('aria-expanded', 'false');
  queueButton.hidden = true;

  actions.append(shuffleButton, previousButton, toggleButton, nextButton, repeatButton, queueButton);

  const timeline = document.createElement('div');
  timeline.className = 'zydka-player-timeline';

  const currentTime = document.createElement('span');
  currentTime.className = 'zydka-player-time';
  currentTime.textContent = '0:00';

  // Native range input: tap AND drag work with a finger, keyboard and screen readers.
  const progress = document.createElement('input');
  progress.className = 'zydka-player-progress';
  progress.type = 'range';
  progress.min = '0';
  progress.max = '0';
  progress.step = 'any';
  progress.value = '0';
  progress.disabled = true;
  progress.setAttribute('aria-label', 'Position dans le morceau');
  progress.setAttribute('aria-valuetext', '0:00 / --:--');

  const duration = document.createElement('span');
  duration.className = 'zydka-player-time';
  duration.textContent = '--:--';

  timeline.append(currentTime, progress, duration);

  const volumeControl = document.createElement('div');
  volumeControl.className = 'zydka-player-volume';

  const muteButton = document.createElement('button');
  muteButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-mute-button';
  muteButton.type = 'button';
  setIconButton(muteButton, 'Couper le son', 'volume');

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

  volumeControl.append(muteButton, volumeSlider, volumeValue);

  const shareControl = document.createElement('div');
  shareControl.className = 'zydka-player-share';

  const shareButton = document.createElement('button');
  shareButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-mode-button zydka-player-share-button';
  shareButton.type = 'button';
  setIconButton(shareButton, 'Partager le morceau', 'share');

  const shareFeedback = document.createElement('span');
  shareFeedback.className = 'zydka-player-share-feedback';
  shareFeedback.setAttribute('aria-live', 'polite');
  shareFeedback.hidden = true;

  shareControl.append(shareButton, shareFeedback);

  const queueOverlay = document.createElement('div');
  queueOverlay.className = 'zydka-player-queue-overlay';
  queueOverlay.hidden = true;
  queueOverlay.setAttribute('aria-hidden', 'true');

  const queuePanel = document.createElement('section');
  queuePanel.className = 'zydka-player-queue';
  queuePanel.setAttribute('role', 'dialog');
  queuePanel.setAttribute('aria-modal', 'false');
  queuePanel.setAttribute('aria-labelledby', 'zydka-player-queue-title');

  const queueHeader = document.createElement('div');
  queueHeader.className = 'zydka-player-queue__header';

  const queueHeading = document.createElement('div');
  queueHeading.className = 'zydka-player-queue__heading';

  const queuePanelTitle = document.createElement('h3');
  queuePanelTitle.className = 'zydka-player-queue__title';
  queuePanelTitle.id = 'zydka-player-queue-title';
  queuePanelTitle.textContent = 'À suivre';

  const queueSubtitle = document.createElement('p');
  queueSubtitle.className = 'zydka-player-queue__subtitle';
  queueSubtitle.textContent = "File d'écoute";

  const closeQueueButton = document.createElement('button');
  closeQueueButton.className = 'zydka-player-queue__close';
  closeQueueButton.type = 'button';
  closeQueueButton.textContent = 'Fermer';
  closeQueueButton.setAttribute('aria-label', "Fermer la file d'attente");

  queueHeading.append(queuePanelTitle, queueSubtitle);
  queueHeader.append(queueHeading, closeQueueButton);

  const queueList = document.createElement('ol');
  queueList.className = 'zydka-player-queue__list';

  queuePanel.append(queueHeader, queueList);
  queueOverlay.append(queuePanel);

  const footer = document.createElement('div');
  footer.className = 'zydka-player-footer';

  const error = document.createElement('p');
  error.className = 'zydka-player-error';
  error.hidden = true;

  footer.hidden = true;
  footer.append(error);
  card.append(header, actions, timeline, volumeControl, shareControl, footer);
  root.append(card, queueOverlay);

  const failedCoverUrls = new Set<string>();
  const embeddedCoverUrls = new Map<string, string>();
  const requestedEmbeddedCoverUrls = new Set<string>();

  let refreshState = (): void => undefined;
  let renderedQueueSignature = '';
  let loggedError = '';
  let hasMultipleQueuedTracks = false;
  let isQueueOpen = false;
  let repeatMode: RepeatMode = 'off';
  let shuffleEnabled = false;
  let shuffleHistory: number[] = [];
  let shufflePlayed: number[] = [];
  let shareFeedbackTimer: number | undefined;
  let isUserSeeking = false;
  let pendingSeekSeconds: number | null = null;
  let seekReleaseTimer: number | undefined;

  // Explicit cover first; if it fails to load, fall back to the cover embedded in the MP3
  // so the player and the lock screen never point at a broken image.
  const getDisplayCoverUrl = (track: ZydkaTrack | null | undefined): string | null => {
    if (!track) return null;
    return resolveCoverUrl(track.cover, embeddedCoverUrls.get(track.audioUrl), failedCoverUrls);
  };

  const requestEmbeddedCover = (track: ZydkaTrack | null | undefined): void => {
    if (
      !track ||
      !needsEmbeddedCover(track.cover, failedCoverUrls) ||
      requestedEmbeddedCoverUrls.has(track.audioUrl)
    ) {
      return;
    }

    requestedEmbeddedCoverUrls.add(track.audioUrl);

    void getEmbeddedCoverUrl(track.audioUrl).then((coverUrl) => {
      if (!coverUrl) return;

      embeddedCoverUrls.set(track.audioUrl, coverUrl);
      refreshState();
    });
  };

  const playCurrentTrack = (): void => {
    const state = window.ZydkaPlayer?.state();

    if (state?.currentTrack) {
      window.ZydkaPlayer?.resume();
      return;
    }

    const currentIndex = window.ZydkaPlayer?.getCurrentIndex() ?? 0;
    playAtIndex(Math.max(0, currentIndex), { resetShuffleHistory: false });
  };

  const getNavigationState = (): QueueNavigationState => ({
    queueLength: window.ZydkaPlayer?.getQueue().length ?? 0,
    currentIndex: window.ZydkaPlayer?.getCurrentIndex() ?? -1,
    repeatMode,
    shuffle: shuffleEnabled,
    shufflePlayed,
  });

  // Every track start goes through here so the shuffle cycle knows what was played.
  const playAtIndex = (index: number, options: { resetShuffleHistory?: boolean } = {}): boolean => {
    const didPlay = window.ZydkaPlayer?.playAt(index) ?? false;

    if (!didPlay) return false;

    if (options.resetShuffleHistory !== false) {
      shuffleHistory = [];
    }

    if (!shufflePlayed.includes(index)) {
      shufflePlayed = [...shufflePlayed, index];
    }

    return true;
  };

  const playNextTrack = (reason: AdvanceReason = 'user'): boolean => {
    const navigation = getNavigationState();
    const nextTrack = getNextTrack(navigation, reason);

    if (!nextTrack) return false;

    if (shuffleEnabled && navigation.currentIndex >= 0 && nextTrack.index !== navigation.currentIndex) {
      shuffleHistory.push(navigation.currentIndex);
    }

    if (nextTrack.startsNewShuffleCycle) {
      shufflePlayed = [];
    }

    return playAtIndex(nextTrack.index, { resetShuffleHistory: false });
  };

  const playPreviousTrack = (): boolean => {
    const previousIndex = getPreviousIndex(getNavigationState(), shuffleHistory);

    if (previousIndex === null) return false;

    if (shuffleEnabled && shuffleHistory[shuffleHistory.length - 1] === previousIndex) {
      shuffleHistory.pop();
    }

    return playAtIndex(previousIndex, { resetShuffleHistory: false });
  };

  const getRepeatLabel = (): string => {
    if (repeatMode === 'queue') return 'Répéter la file';
    if (repeatMode === 'one') return 'Répéter le morceau';
    return 'Activer la répétition';
  };

  const getShareUrl = (track: ZydkaTrack | null | undefined): string => {
    const url = new URL(window.location.href);
    const hash = getTrackHash(track?.id);

    if (hash) {
      url.hash = hash;
    }

    return url.toString();
  };

  const showShareFeedback = (message: string): void => {
    shareFeedback.textContent = message;
    shareFeedback.hidden = false;

    if (shareFeedbackTimer) {
      window.clearTimeout(shareFeedbackTimer);
    }

    shareFeedbackTimer = window.setTimeout(() => {
      shareFeedback.hidden = true;
      shareFeedback.textContent = '';
      shareFeedbackTimer = undefined;
    }, 2200);
  };

  const shareCurrentTrack = async (): Promise<void> => {
    const state = window.ZydkaPlayer?.state();
    const queue = window.ZydkaPlayer?.getQueue() ?? state?.queue ?? [];
    const currentIndex = window.ZydkaPlayer?.getCurrentIndex() ?? state?.currentIndex ?? -1;
    const track = state?.currentTrack ?? queue[currentIndex] ?? normalizeTrack(fallbackDisplayTrack);
    const title = renderText(track?.title || 'Zydka Player');
    const text = getShareText(track?.title, track?.artist);
    const url = getShareUrl(track);
    const shareData = text ? { title, text, url } : { title, url };

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(shareData);
        showShareFeedback('Partagé');
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(url);
        showShareFeedback('Lien copié');
        return;
      }
    } catch (_error) {
      showShareFeedback('Impossible de copier');
      return;
    }

    showShareFeedback('Impossible de copier');
  };

  const getSeekDuration = (): number => window.ZydkaPlayer?.getDuration() ?? 0;

  const clearSeekReleaseTimer = (): void => {
    if (seekReleaseTimer !== undefined) {
      window.clearTimeout(seekReleaseTimer);
      seekReleaseTimer = undefined;
    }
  };

  // Single seek path for the timeline (tap, drag, keyboard) and the lock screen (seekto).
  // Seeking once on release avoids the pause/play cycle Howler does on every seek in
  // HTML5 mode, which made dragging choppy on mobile.
  const commitSeek = (seconds: number): void => {
    const target = clampSeekTime(seconds, getSeekDuration());

    isUserSeeking = false;
    progress.classList.remove('zydka-player-progress--dragging');
    clearSeekReleaseTimer();

    if (target === null) {
      pendingSeekSeconds = null;
      refreshState();
      return;
    }

    // Keep showing the target briefly so the thumb does not flash back to the old position.
    pendingSeekSeconds = target;
    window.ZydkaPlayer?.seek(target);
    refreshState();
    mediaSession.refreshPosition();

    seekReleaseTimer = window.setTimeout(() => {
      seekReleaseTimer = undefined;

      if (isUserSeeking) return;

      pendingSeekSeconds = null;
      refreshState();
    }, 300);
  };

  const mediaSession = setupMediaSession({
    getCurrentTrack: () => window.ZydkaPlayer?.state().currentTrack ?? null,
    getArtwork: (track) => getDisplayCoverUrl(track as ZydkaTrack),
    play: playCurrentTrack,
    pause: () => window.ZydkaPlayer?.pause(),
    previous: () => {
      playPreviousTrack();
    },
    next: () => {
      playNextTrack();
    },
    seek: (seconds) => {
      commitSeek(seconds);
    },
    getCurrentTime: () => window.ZydkaPlayer?.getCurrentTime() ?? 0,
    getDuration: () => window.ZydkaPlayer?.getDuration() ?? 0,
    isPlaying: () => window.ZydkaPlayer?.state().isPlaying ?? false,
  });

  // Chain tracks from the audio "end" event rather than the UI refresh timer, which
  // browsers throttle while the phone is locked or the tab is hidden.
  window.ZydkaPlayer?.onEnded(() => {
    playNextTrack('ended');
    refreshState();
  });

  type QueueOpenOptions = {
    focusClose?: boolean;
    restoreFocus?: boolean;
  };

  const inlineQueueQuery = window.matchMedia('(min-width: 900px)');
  const isInlineQueueView = (): boolean => inlineQueueQuery.matches;
  const isMobileQueueView = (): boolean =>
    !isInlineQueueView();

  const setQueueOpen = (shouldOpen: boolean, options: QueueOpenOptions = {}): void => {
    const isInlineQueue = isInlineQueueView();
    const nextOpen = shouldOpen && hasMultipleQueuedTracks && !isInlineQueue;
    const nextVisible = hasMultipleQueuedTracks && (isInlineQueue || nextOpen);

    isQueueOpen = nextOpen;
    queueOverlay.hidden = !nextVisible;
    queueOverlay.classList.toggle('zydka-player-queue-overlay--open', nextVisible);
    queueOverlay.classList.toggle('zydka-player-queue-overlay--inline', isInlineQueue && nextVisible);
    queuePanel.classList.toggle('zydka-player-queue--open', nextVisible);
    queuePanel.setAttribute('role', isInlineQueue ? 'region' : 'dialog');
    if (isInlineQueue) {
      queuePanel.removeAttribute('aria-modal');
    } else {
      queuePanel.setAttribute('aria-modal', 'false');
    }
    queueOverlay.setAttribute('aria-hidden', String(!nextVisible));
    queueButton.setAttribute('aria-expanded', String(nextOpen));
    closeQueueButton.hidden = isInlineQueue;

    if (nextOpen && options.focusClose !== false) {
      closeQueueButton.focus();
    } else if (
      !nextVisible &&
      options.restoreFocus !== false &&
      document.activeElement &&
      queueOverlay.contains(document.activeElement)
    ) {
      queueButton.focus();
    }
  };

  const renderQueueItems = (queue: ZydkaTrack[], currentIndex: number): void => {
    queueList.innerHTML = '';

    if (queue.length <= 1) {
      setQueueOpen(false);
      return;
    }

    queue.forEach((track, index) => {
      const listItem = document.createElement('li');
      const item = document.createElement('button');
      const isActive = index === currentIndex;
      const displayTitle = renderText(track.title || 'Morceau ' + String(index + 1));

      item.className = isActive
        ? 'zydka-player-queue__item zydka-player-queue__item--active'
        : 'zydka-player-queue__item';
      item.type = 'button';
      item.setAttribute('aria-label', `Lire ${displayTitle}`);

      if (isActive) {
        item.setAttribute('aria-current', 'true');
      }

      const thumb = document.createElement('span');
      thumb.className = 'zydka-player-queue__cover';

      const thumbImage = document.createElement('img');
      thumbImage.className = 'zydka-player-queue__cover-image';
      thumbImage.alt = '';
      thumbImage.hidden = true;

      const thumbFallback = document.createElement('span');
      thumbFallback.className = 'zydka-player-queue__cover-fallback';
      thumbFallback.textContent = getCoverLabel(track);
      requestEmbeddedCover(track);

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
        refreshState();
      });

      thumb.append(thumbImage, thumbFallback);

      const meta = document.createElement('span');
      meta.className = 'zydka-player-queue__meta';

      const itemTitle = document.createElement('span');
      itemTitle.className = 'zydka-player-queue__track-title';
      itemTitle.textContent = displayTitle;

      const itemArtist = document.createElement('span');
      itemArtist.className = 'zydka-player-queue__track-artist';
      itemArtist.textContent = renderText(track.artist || '');
      itemArtist.hidden = !track.artist;

      const itemState = document.createElement('span');
      itemState.className = 'zydka-player-queue__state';
      itemState.textContent = isActive ? 'En cours' : '';
      itemState.hidden = !isActive;

      const itemDuration = document.createElement('span');
      itemDuration.className = 'zydka-player-queue__duration';
      itemDuration.textContent = track.duration ? formatTime(track.duration) : '';
      itemDuration.hidden = !track.duration;

      meta.append(itemTitle, itemArtist, itemState);
      item.append(thumb, meta, itemDuration);

      item.addEventListener('click', () => {
        playAtIndex(index, { resetShuffleHistory: false });
        refreshState();

        if (isMobileQueueView()) {
          setQueueOpen(false);
        }
      });

      listItem.append(item);
      queueList.append(listItem);
    });
  };

  const getQueueSignature = (queue: ZydkaTrack[], currentIndex: number): string =>
    JSON.stringify({
      currentIndex,
      tracks: queue.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        cover: getDisplayCoverUrl(track),
      })),
    });

  refreshState = (): void => {
    const state = window.ZydkaPlayer?.state();

    if (!state) return;

    const queue = window.ZydkaPlayer?.getQueue() ?? state.queue;
    const currentIndex = window.ZydkaPlayer?.getCurrentIndex() ?? state.currentIndex;
    const displayTrack = state.currentTrack ?? queue[currentIndex] ?? normalizeTrack(fallbackDisplayTrack);
    const position = window.ZydkaPlayer?.getCurrentTime() ?? state.position;
    const trackDuration = window.ZydkaPlayer?.getDuration() ?? state.duration;
    const timelineDisplay = getTimelineDisplay(position, trackDuration, pendingSeekSeconds);
    const displayIndex = queue.length > 0 ? Math.max(0, currentIndex) + 1 : 0;
    const volume = window.ZydkaPlayer?.getVolume() ?? state.volume;
    const muted = window.ZydkaPlayer?.isMuted() ?? state.muted;
    const hasQueue = queue.length > 1;
    const navigation = getNavigationState();
    // Only whether a next track exists matters here, so the random pick is fixed.
    const canGoNext = getNextTrack(navigation, 'user', () => 0) !== null;

    if (hasQueue !== hasMultipleQueuedTracks) {
      hasMultipleQueuedTracks = hasQueue;
      queueButton.hidden = !hasQueue;
      setQueueOpen(isQueueOpen && hasQueue, { focusClose: false, restoreFocus: false });
    }

    root.classList.toggle('zydka-player-root--has-queue', hasQueue);
    actions.classList.toggle('zydka-player-actions--has-queue', hasQueue);
    queueButton.textContent = hasQueue ? `À suivre (${queue.length})` : 'À suivre';
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

    trackCounter.textContent = `${displayIndex} / ${queue.length}`;
    trackCounter.setAttribute('aria-label', `Morceau ${displayIndex} sur ${queue.length}`);
    shuffleButton.classList.toggle('zydka-player-mode-button--active', shuffleEnabled);
    shuffleButton.setAttribute('aria-pressed', String(shuffleEnabled));
    setIconButton(
      shuffleButton,
      shuffleEnabled ? 'Désactiver la lecture aléatoire' : 'Activer la lecture aléatoire',
      'shuffle',
    );
    repeatButton.classList.toggle('zydka-player-mode-button--active', repeatMode !== 'off');
    repeatButton.classList.toggle('zydka-player-repeat-button--one', repeatMode === 'one');
    repeatButton.dataset.repeatMode = repeatMode;
    repeatButton.setAttribute('aria-pressed', String(repeatMode !== 'off'));
    setIconButton(repeatButton, getRepeatLabel(), 'repeat');
    setIconButton(shareButton, `Partager ${renderText(displayTrack?.title || 'le morceau')}`, 'share');
    previousButton.disabled = getPreviousIndex(navigation, shuffleHistory) === null;
    nextButton.disabled = !canGoNext;
    toggleButton.classList.toggle('zydka-player-toggle-button--playing', state.isPlaying);
    setIconButton(toggleButton, state.isPlaying ? 'Pause' : 'Lecture', state.isPlaying ? 'pause' : 'play');
    currentTime.textContent = timelineDisplay.currentLabel;
    duration.textContent = timelineDisplay.durationLabel;
    progress.disabled = !timelineDisplay.hasKnownDuration;
    progress.max = timelineDisplay.hasKnownDuration ? String(trackDuration) : '0';

    // Never overwrite the thumb under the user's finger.
    if (!isUserSeeking) {
      progress.value = String(timelineDisplay.displayPosition);
    }

    progress.style.setProperty('--zydka-progress-percent', `${timelineDisplay.percent}%`);
    progress.setAttribute('aria-valuetext', timelineDisplay.valueText);
    volumeSlider.value = String(volume);
    volumeValue.textContent = `${Math.round(volume * 100)}%`;
    volumeControl.classList.toggle('zydka-player-volume--muted', muted);
    muteButton.classList.toggle('zydka-player-mute-button--muted', muted);
    setIconButton(muteButton, muted ? 'Rétablir le son' : 'Couper le son', muted ? 'muted' : 'volume');
    const queueSignature = getQueueSignature(queue, currentIndex);

    if (queueSignature !== renderedQueueSignature) {
      renderQueueItems(queue, currentIndex);
      renderedQueueSignature = queueSignature;
    }

    // Visitors get a plain message; the technical cause stays in the console.
    if (state.error && state.error !== loggedError) {
      console.error('[Zydka Player]', state.error);
    }

    loggedError = state.error ?? '';
    error.textContent = state.error ? UNAVAILABLE_TRACK_MESSAGE : '';
    error.hidden = !state.error;
    footer.hidden = !state.error;
    mediaSession.refreshMetadata();

    if (!isUserSeeking) {
      if (state.isPlaying) {
        mediaSession.refreshPositionThrottled();
      } else {
        mediaSession.refreshPosition();
      }
    }
  };

  coverImage.addEventListener('error', () => {
    const failedCover = coverImage.dataset.coverSrc;

    if (failedCover) {
      failedCoverUrls.add(failedCover);
    }

    coverImage.removeAttribute('src');
    coverImage.hidden = true;
    coverFallback.hidden = false;
    refreshState();
  });

  previousButton.addEventListener('click', () => {
    playPreviousTrack();
    refreshState();
  });

  toggleButton.addEventListener('click', () => {
    const state = window.ZydkaPlayer?.state();

    if (state?.isPlaying) {
      window.ZydkaPlayer?.pause();
    } else {
      playCurrentTrack();
    }

    refreshState();
  });

  nextButton.addEventListener('click', () => {
    playNextTrack();
    refreshState();
  });

  shuffleButton.addEventListener('click', () => {
    shuffleEnabled = !shuffleEnabled;
    shuffleHistory = [];

    const currentIndex = window.ZydkaPlayer?.getCurrentIndex() ?? -1;
    shufflePlayed = currentIndex >= 0 ? [currentIndex] : [];
    refreshState();
  });

  repeatButton.addEventListener('click', () => {
    repeatMode = cycleRepeatMode(repeatMode);
    refreshState();
  });

  shareButton.addEventListener('click', () => {
    void shareCurrentTrack();
  });

  queueButton.addEventListener('click', () => {
    setQueueOpen(!isQueueOpen);
  });

  closeQueueButton.addEventListener('click', () => {
    setQueueOpen(false);
  });

  queueOverlay.addEventListener('click', (event) => {
    if (event.target === queueOverlay) {
      setQueueOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isQueueOpen) {
      setQueueOpen(false);
    }
  });

  const handleQueueViewportChange = (): void => {
    setQueueOpen(isQueueOpen, { focusClose: false, restoreFocus: false });
  };

  if (typeof inlineQueueQuery.addEventListener === 'function') {
    inlineQueueQuery.addEventListener('change', handleQueueViewportChange);
  } else {
    inlineQueueQuery.addListener(handleQueueViewportChange);
  }

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

  // Timeline: preview while dragging ('input'), seek once on release ('change').
  progress.addEventListener('input', () => {
    if (!isKnownDuration(getSeekDuration())) return;

    clearSeekReleaseTimer();
    isUserSeeking = true;
    progress.classList.add('zydka-player-progress--dragging');
    pendingSeekSeconds = clampSeekTime(Number(progress.value), getSeekDuration());
    refreshState();
  });

  progress.addEventListener('change', () => {
    const value = Number(progress.value);

    // Already committed by the pointerup/touchend fallback for this same gesture.
    if (!isUserSeeking && pendingSeekSeconds !== null && Math.abs(pendingSeekSeconds - value) < 0.05) {
      return;
    }

    commitSeek(value);
  });

  // Fallback if a mobile browser ends the gesture without firing 'change'.
  const finishSeekGesture = (): void => {
    window.setTimeout(() => {
      if (isUserSeeking) {
        commitSeek(Number(progress.value));
      }
    }, 0);
  };

  progress.addEventListener('pointerup', finishSeekGesture);
  progress.addEventListener('touchend', finishSeekGesture);

  // Gesture taken over by the browser (e.g. page scroll): drop the preview.
  const cancelSeekGesture = (): void => {
    if (!isUserSeeking) return;

    isUserSeeking = false;
    pendingSeekSeconds = null;
    progress.classList.remove('zydka-player-progress--dragging');
    refreshState();
  };

  progress.addEventListener('pointercancel', cancelSeekGesture);
  progress.addEventListener('touchcancel', cancelSeekGesture);

  // A native range moves by its 'step' on arrow keys; use musical steps instead.
  progress.addEventListener('keydown', (event) => {
    const target = getKeyboardSeekTarget(
      event.key,
      event.shiftKey,
      window.ZydkaPlayer?.getCurrentTime() ?? 0,
      getSeekDuration(),
    );

    if (target === null) return;

    event.preventDefault();
    commitSeek(target);
  });

  // Timers are throttled while the page is hidden: resync immediately when the user
  // locks the phone (lock screen position) and when they come back to the page.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshState();
    }

    mediaSession.refreshMetadata();
    mediaSession.refreshPosition();
  });

  let sharedHighlightTimer: number | undefined;

  // Shared links (#track-<id>) select the track without starting it: browsers block
  // autoplay, so the visitor gets the player in view with the track ready to play.
  const openSharedTrack = (): void => {
    const queue = window.ZydkaPlayer?.getQueue() ?? [];
    const index = findTrackIndex(queue, parseTrackHash(window.location.hash));

    if (index < 0) return;

    if (window.ZydkaPlayer?.getCurrentIndex() !== index) {
      shuffleHistory = [];
      shufflePlayed = [];
      window.ZydkaPlayer?.select(index);
      refreshState();
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    root.classList.add('zydka-player-root--shared');
    window.clearTimeout(sharedHighlightTimer);
    sharedHighlightTimer = window.setTimeout(() => {
      root.classList.remove('zydka-player-root--shared');
    }, 2400);
  };

  window.addEventListener('hashchange', openSharedTrack);

  refreshState();
  openSharedTrack();
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
    resume: () => WordPressBridge.resume(),
    setQueue: (tracks: ZydkaTrackInput[]) => WordPressBridge.setQueue(normalizeQueue(tracks)),
    getQueue: () => WordPressBridge.getQueue(),
    getCurrentIndex: () => WordPressBridge.getCurrentIndex(),
    playAt: (index: number) => WordPressBridge.playAt(index),
    select: (index: number) => WordPressBridge.select(index),
    next: () => WordPressBridge.next(),
    previous: () => WordPressBridge.previous(),
    setVolume: (value: number) => WordPressBridge.setVolume(value),
    getVolume: () => WordPressBridge.getVolume(),
    mute: () => WordPressBridge.mute(),
    unmute: () => WordPressBridge.unmute(),
    isMuted: () => WordPressBridge.isMuted(),
    onEnded: (listener: () => void) => WordPressBridge.onEnded(listener),
    state: () => {
      const { currentTrack, currentIndex, queue, status, isPlaying, position, duration, volume, muted, error } = WordPressBridge.state();
      return { currentTrack, currentIndex, queue, status, isPlaying, position, duration, volume, muted, error };
    },
  };

  const shortcodeQueue = readQueueFromRoot(root, shortcodeTrack);

  window.ZydkaPlayer.setQueue(shortcodeQueue);

  const firstTrack = window.ZydkaPlayer.getQueue()[0];

  // Nothing playable: keep whatever the page rendered (e.g. the Player Manager fallback).
  if (!firstTrack) {
    console.warn('[Zydka Player] No playable track: give each track an audio URL ("src").');
    return;
  }

  renderTestPlayer(root, firstTrack);

  console.log('[Zydka Player] Bridge initialized - window.ZydkaPlayer ready.');
}

document.addEventListener('DOMContentLoaded', bootstrap);
window.addEventListener('beforeunload', revokeEmbeddedCoverCache, { once: true });
