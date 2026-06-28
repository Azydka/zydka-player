import { WordPressBridge } from '@zydka/wordpress-bridge';
import { getEmbeddedCoverUrl, revokeEmbeddedCoverCache } from './metadataCover';
import { setupMediaSession, type MediaSessionController } from './mediaSession';

interface ZydkaTrackInput {
  id: string | number;
  src?: string;
  audioUrl?: string;
  type?: string;
  track_type?: string;
  trackType?: string;
  title?: string;
  artist?: string;
  cover?: string;
  cover512?: string;
  cover1024?: string;
  album?: string;
  bpm?: string | number;
  mood?: string;
  style?: string;
  key?: string;
  product_id?: string | number;
  productId?: string | number;
  category?: string;
  license_type?: string;
  licenseType?: string;
  price?: string | number;
  currency?: string;
  buy_url?: string;
  buy_label?: string;
  buyUrl?: string;
  buyLabel?: string;
  download_url?: string;
  downloadUrl?: string;
  duration?: number;
}

interface ZydkaTrack {
  id: string | number;
  audioUrl: string;
  type?: string;
  trackType?: string;
  title?: string;
  artist?: string;
  cover?: string;
  cover512?: string;
  cover1024?: string;
  album?: string;
  bpm?: string | number;
  mood?: string;
  style?: string;
  key?: string;
  productId?: string | number;
  category?: string;
  licenseType?: string;
  price?: string | number;
  currency?: string;
  buyUrl?: string;
  buyLabel?: string;
  downloadUrl?: string;
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
  next: () => boolean;
  previous: () => boolean;
  setVolume: (value: number) => number;
  getVolume: () => number;
  mute: () => void;
  unmute: () => void;
  isMuted: () => boolean;
  state: () => ZydkaPlayerState;
}

type RepeatMode = 'off' | 'queue' | 'one';
type ZydkaAnalyticsEventType =
  | 'play_started'
  | 'play_30s_checkpoint'
  | 'play_completed'
  | 'play_stopped'
  | 'license_cta_clicked'
  | 'download_cta_clicked';

interface ZydkaAnalyticsPayload {
  event_type: ZydkaAnalyticsEventType;
  track_id: string;
  track_title: string;
  track_type: string;
  artist: string;
  album: string;
  bpm: string | number;
  mood: string;
  style: string;
  key: string;
  product_id: string;
  category: string;
  license_type: string;
  price: string;
  currency: string;
  context: string;
  source: string;
  player_mode: 'zydka-player';
  player_instance: string;
  playlist_id: string;
  session_token: string;
  playhead_seconds: number;
  duration_seconds: number;
  page_url: string;
  referrer: string;
  referrer_category: string;
  metadata_version: '1.1';
  player_version: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface ZydkaAnalyticsOptions {
  root: HTMLElement;
  eventType: ZydkaAnalyticsEventType;
  track: ZydkaTrack | null | undefined;
  playheadSeconds?: number;
  durationSeconds?: number;
  extra?: Record<string, string | number | boolean | null | undefined>;
}

const fallbackTrack: ZydkaTrackInput = {
  id: 'demo-track',
  title: 'Demo Track',
  artist: 'Atelier Zydka',
  src: 'https://www.louis94.com/wp-content/uploads/2026/06/04.-New-York-Shit-feat.-Swizz-Beatz.mp3',
};

const zydkaPlayerVersion = '0.6.3';
const zydkaAnalyticsMetadataVersion = '1.1';
const zydkaAnalyticsDataLayerEvent = 'zydka_player_event';
const zydkaAnalyticsSessionStorageKey = 'zydkaPlayerAnalyticsSessionToken';

declare global {
  interface Window {
    ZydkaPlayer: ZydkaPlayerAPI | undefined;
    dataLayer?: unknown[];
    zydkaPlayerAnalyticsEndpoint?: string;
    zydkaPlayerAnalytics?: {
      endpoint?: string;
    };
  }
}

function normalizeTrack(track: ZydkaTrackInput): ZydkaTrack | null {
  const audioUrl = track.audioUrl ?? track.src;
  const downloadUrl = normalizeOptionalHttpUrl(track.downloadUrl ?? track.download_url);

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
    type: track.type,
    trackType: track.trackType ?? track.track_type ?? track.type,
    title: track.title,
    artist: track.artist,
    cover: track.cover,
    cover512: track.cover512,
    cover1024: track.cover1024,
    album: track.album,
    bpm: track.bpm,
    mood: track.mood,
    style: track.style,
    key: track.key,
    productId: track.productId ?? track.product_id,
    category: track.category,
    licenseType: track.licenseType ?? track.license_type,
    price: track.price,
    currency: track.currency,
    buyUrl: track.buyUrl ?? track.buy_url,
    buyLabel: track.buyLabel ?? track.buy_label,
    ...(downloadUrl ? { downloadUrl } : {}),
    duration: track.duration,
  };
}

function normalizeOptionalHttpUrl(value: string | null | undefined): string | undefined {
  const trimmedValue = typeof value === 'string' ? value.trim() : '';

  if (!trimmedValue) return undefined;

  try {
    const parsedUrl = new URL(trimmedValue, window.location.href);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:' ? trimmedValue : undefined;
  } catch (_error) {
    return undefined;
  }
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
    cover512: root.dataset.cover512 ?? root.dataset['cover-512'],
    cover1024: root.dataset.cover1024 ?? root.dataset['cover-1024'],
    album: root.dataset.album,
    bpm: root.dataset.bpm,
    mood: root.dataset.mood,
    style: root.dataset.style,
    type: root.dataset.type,
    trackType: root.dataset.trackType,
    key: root.dataset.key,
    productId: root.dataset.productId,
    category: root.dataset.category,
    licenseType: root.dataset.licenseType,
    price: root.dataset.price,
    currency: root.dataset.currency,
    buyUrl: root.dataset.buyUrl,
    buyLabel: root.dataset.buyLabel,
    downloadUrl: root.dataset.downloadUrl,
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

function readManagerQueueFromRoot(root: HTMLElement): ZydkaTrackInput[] | null {
  if (!root.matches('#zydka-player-root[data-source="manager-playlist"]')) {
    return null;
  }

  if (!root.dataset.tracks) {
    console.error('[Zydka Player] Manager playlist is missing data-tracks.');
    return null;
  }

  try {
    const parsedTracks = JSON.parse(root.dataset.tracks) as unknown;

    if (!Array.isArray(parsedTracks) || parsedTracks.length === 0) {
      console.error('[Zydka Player] Manager playlist data-tracks must be a non-empty array.');
      return null;
    }

    const playableTracks = parsedTracks.filter((track): track is ZydkaTrackInput => {
      if (!track || typeof track !== 'object') return false;

      const candidate = track as Partial<ZydkaTrackInput>;
      return Boolean(candidate.audioUrl || candidate.src);
    });

    if (playableTracks.length === 0) {
      console.error('[Zydka Player] Manager playlist does not contain any playable tracks.');
      return null;
    }

    return playableTracks;
  } catch (error) {
    console.error('[Zydka Player] Cannot parse manager playlist tracks.', error);
    return null;
  }
}

function getAnalyticsString(value: string | number | undefined | null): string {
  return value === undefined || value === null ? '' : String(value);
}

function getAnalyticsNumber(value: number | undefined | null): number {
  return Number.isFinite(value) && value !== null && value !== undefined ? Math.max(0, value) : 0;
}

function getZydkaAnalyticsSessionToken(): string {
  try {
    const storedToken = window.sessionStorage.getItem(zydkaAnalyticsSessionStorageKey);

    if (storedToken) return storedToken;

    const generatedToken =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.sessionStorage.setItem(zydkaAnalyticsSessionStorageKey, generatedToken);
    return generatedToken;
  } catch (_error) {
    return 'anonymous-session-token';
  }
}

function getReferrerCategory(): string {
  try {
    if (!document.referrer) return '';

    const referrerUrl = new URL(document.referrer);
    return referrerUrl.hostname === window.location.hostname ? 'internal' : 'external';
  } catch (_error) {
    return '';
  }
}

function getAnalyticsEndpoint(): string {
  return window.zydkaPlayerAnalyticsEndpoint?.trim() || window.zydkaPlayerAnalytics?.endpoint?.trim() || '';
}

function getTrackSignature(track: ZydkaTrack | null | undefined): string {
  if (!track) return '';

  return `${getAnalyticsString(track.id)}::${track.audioUrl}`;
}

function getPlayerInstance(root: HTMLElement): string {
  const context = root.dataset.source || 'shortcode';
  const playlistId = root.dataset.playlistId;

  return playlistId ? `${context}-${playlistId}` : `${context}-${root.dataset.trackId || 'single'}`;
}

function buildZydkaAnalyticsPayload(options: ZydkaAnalyticsOptions): ZydkaAnalyticsPayload {
  const { root, eventType, track, playheadSeconds = 0, durationSeconds = 0, extra = {} } = options;
  const context = root.dataset.source || 'shortcode';
  const playlistId = root.dataset.playlistId || '';

  return {
    event_type: eventType,
    track_id: getAnalyticsString(track?.id ?? root.dataset.trackId),
    track_title: getAnalyticsString(track?.title ?? root.dataset.title),
    track_type: getAnalyticsString(track?.trackType ?? track?.type ?? root.dataset.trackType ?? root.dataset.type),
    artist: getAnalyticsString(track?.artist ?? root.dataset.artist),
    album: getAnalyticsString(track?.album ?? root.dataset.album),
    bpm: track?.bpm ?? root.dataset.bpm ?? '',
    mood: getAnalyticsString(track?.mood ?? root.dataset.mood),
    style: getAnalyticsString(track?.style ?? root.dataset.style),
    key: getAnalyticsString(track?.key ?? root.dataset.key),
    product_id: getAnalyticsString(track?.productId ?? root.dataset.productId),
    category: getAnalyticsString(track?.category ?? root.dataset.category),
    license_type: getAnalyticsString(track?.licenseType ?? root.dataset.licenseType),
    price: getAnalyticsString(track?.price ?? root.dataset.price),
    currency: getAnalyticsString(track?.currency ?? root.dataset.currency ?? 'EUR') || 'EUR',
    context,
    source: window.location.hostname || 'louis94.com',
    player_mode: 'zydka-player',
    player_instance: getPlayerInstance(root),
    playlist_id: playlistId,
    session_token: getZydkaAnalyticsSessionToken(),
    playhead_seconds: Math.round(getAnalyticsNumber(playheadSeconds)),
    duration_seconds: Math.round(getAnalyticsNumber(durationSeconds)),
    page_url: window.location.href,
    referrer: document.referrer || '',
    referrer_category: getReferrerCategory(),
    metadata_version: zydkaAnalyticsMetadataVersion,
    player_version: zydkaPlayerVersion,
    ...extra,
  };
}

function emitZydkaAnalyticsEvent(options: ZydkaAnalyticsOptions): void {
  const payload = buildZydkaAnalyticsPayload(options);

  try {
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: zydkaAnalyticsDataLayerEvent,
        zydka: payload,
      });
    }
  } catch (_error) {
    // Analytics must never block the player.
  }

  try {
    const endpoint = getAnalyticsEndpoint();

    if (!endpoint) return;

    const body = JSON.stringify(payload);

    if (typeof navigator.sendBeacon === 'function') {
      const sent = navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));

      if (sent) {
        return;
      }
    }

    if (typeof fetch !== 'function') {
      return;
    }

    void fetch(endpoint, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    }).catch(() => undefined);
  } catch (_error) {
    // Silent failure.
  }
}

function renderText(value: string | number | undefined): string {
  return String(value ?? '');
}

function getCoverLabel(track: ZydkaTrackInput | ZydkaTrack | null | undefined): string {
  const label = track?.title || track?.artist || 'Z';
  return String(label).trim().charAt(0).toUpperCase() || 'Z';
}

function hasExplicitCover(track: ZydkaTrack | null | undefined): boolean {
  return getCoverCandidates(track).length > 0;
}

function getBuyLabel(track: ZydkaTrack | null | undefined): string {
  return track?.buyLabel?.trim() || 'Voir le projet';
}

function getCoverCandidates(track: ZydkaTrack | null | undefined): string[] {
  if (!track) return [];

  const seenUrls = new Set<string>();
  return [track.cover, track.cover512, track.cover1024].reduce<string[]>((urls, value) => {
    const coverUrl = value?.trim();

    if (coverUrl && !seenUrls.has(coverUrl)) {
      seenUrls.add(coverUrl);
      urls.push(coverUrl);
    }

    return urls;
  }, []);
}

function getTrackMetadataItems(track: ZydkaTrack | null | undefined): string[] {
  const bpmValue = typeof track?.bpm === 'number' ? String(track.bpm) : track?.bpm?.trim();
  const moodValue = track?.mood?.trim();
  const styleValue = track?.style?.trim();
  const metadataItems: string[] = [];

  if (bpmValue) {
    metadataItems.push(`${bpmValue} BPM`);
  }

  if (moodValue) {
    metadataItems.push(moodValue);
  }

  if (styleValue) {
    metadataItems.push(styleValue);
  }

  return metadataItems;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatDurationTime(seconds: number): string {
  return Number.isFinite(seconds) && seconds > 0 ? formatTime(seconds) : '--:--';
}

type ControlIconName = 'shuffle' | 'previous' | 'play' | 'pause' | 'next' | 'repeat' | 'volume' | 'muted' | 'favorite' | 'share';

const favoritesStorageKey = 'zydkaPlayerFavorites';

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
  favorite: `
    <svg class="zydka-player-control-icon zydka-player-control-icon--favorite" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 18.5s-6.75-4.25-6.75-8.55A3.7 3.7 0 0 1 12 7.8a3.7 3.7 0 0 1 6.75 2.15C18.75 14.25 12 18.5 12 18.5Z" />
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

  const trackDetails = document.createElement('p');
  trackDetails.className = 'zydka-player-track-details';
  trackDetails.hidden = true;

  const buyLink = document.createElement('a');
  buyLink.className = 'zydka-player-buy-link';
  buyLink.target = '_blank';
  buyLink.rel = 'noopener noreferrer';
  buyLink.dataset.zydkaAnalytics = 'license_cta';
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

  textBlock.append(eyebrow, title, artist, trackDetails, buyLink);
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
  setIconButton(previousButton, 'Previous', 'previous');

  const toggleButton = document.createElement('button');
  toggleButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-toggle-button';
  toggleButton.type = 'button';
  setIconButton(toggleButton, 'Play', 'play');

  const nextButton = document.createElement('button');
  nextButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-nav-button';
  nextButton.type = 'button';
  setIconButton(nextButton, 'Next', 'next');

  const repeatButton = document.createElement('button');
  repeatButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-mode-button zydka-player-repeat-button';
  repeatButton.type = 'button';
  repeatButton.setAttribute('aria-pressed', 'false');
  setIconButton(repeatButton, 'Activer la répétition', 'repeat');

  const queueButton = document.createElement('button');
  queueButton.className = 'zydka-player-button zydka-player-queue-button';
  queueButton.type = 'button';
  queueButton.textContent = 'A suivre';
  queueButton.setAttribute('aria-expanded', 'false');
  queueButton.hidden = true;

  actions.append(shuffleButton, previousButton, toggleButton, nextButton, repeatButton, queueButton);

  const timeline = document.createElement('div');
  timeline.className = 'zydka-player-timeline';

  const currentTime = document.createElement('span');
  currentTime.className = 'zydka-player-time';
  currentTime.textContent = '0:00';

  const progress = document.createElement('input');
  progress.className = 'zydka-player-progress';
  progress.type = 'range';
  progress.min = '0';
  progress.max = '0';
  progress.step = '0.01';
  progress.value = '0';
  progress.setAttribute('aria-label', 'Progression du morceau');
  progress.setAttribute('aria-valuetext', '0:00 / --:--');
  progress.disabled = true;

  const duration = document.createElement('span');
  duration.className = 'zydka-player-time';
  duration.textContent = '--:--';

  timeline.append(currentTime, progress, duration);

  const volumeControl = document.createElement('div');
  volumeControl.className = 'zydka-player-volume';

  const muteButton = document.createElement('button');
  muteButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-mute-button';
  muteButton.type = 'button';
  setIconButton(muteButton, 'Mute', 'volume');

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

  const downloadLink = document.createElement('a');
  downloadLink.className = 'zydka-player-button zydka-player-download-link';
  downloadLink.target = '_blank';
  downloadLink.rel = 'noopener noreferrer';
  downloadLink.textContent = 'Télécharger';
  downloadLink.dataset.zydkaAnalytics = 'download_cta';
  downloadLink.hidden = true;

  const favoriteButton = document.createElement('button');
  favoriteButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-mode-button zydka-player-favorite-button';
  favoriteButton.type = 'button';
  favoriteButton.setAttribute('aria-pressed', 'false');
  setIconButton(favoriteButton, 'Ajouter aux favoris', 'favorite');

  const shareButton = document.createElement('button');
  shareButton.className = 'zydka-player-button zydka-player-icon-button zydka-player-mode-button zydka-player-share-button';
  shareButton.type = 'button';
  setIconButton(shareButton, 'Partager le morceau', 'share');

  const shareFeedback = document.createElement('span');
  shareFeedback.className = 'zydka-player-share-feedback';
  shareFeedback.setAttribute('aria-live', 'polite');
  shareFeedback.hidden = true;

  shareControl.append(downloadLink, favoriteButton, shareButton, shareFeedback);

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
  queuePanelTitle.textContent = 'A suivre';

  const queueSubtitle = document.createElement('p');
  queueSubtitle.className = 'zydka-player-queue__subtitle';
  queueSubtitle.textContent = "File d'ecoute";

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

  footer.append(status, error);
  card.append(header, actions, timeline, volumeControl, shareControl, footer);
  root.append(card, queueOverlay);

  const failedCoverUrls = new Set<string>();
  const embeddedCoverUrls = new Map<string, string>();
  const requestedEmbeddedCoverUrls = new Set<string>();

  let refreshState = (): void => undefined;
  let renderedQueueSignature = '';
  let hasMultipleQueuedTracks = false;
  let isQueueOpen = false;
  let repeatMode: RepeatMode = 'off';
  let shuffleEnabled = false;
  let shuffleHistory: number[] = [];
  let handledEndedSignature = '';
  let shareFeedbackTimer: number | undefined;
  let favoriteKeys = new Set<string>();
  let analyticsTrackState: {
    signature: string;
    track: ZydkaTrack;
    hasStarted: boolean;
    hasSentCheckpoint: boolean;
    hasCompleted: boolean;
    hasStopped: boolean;
    wasPlaying: boolean;
    lastPosition: number;
    lastDuration: number;
    listenedSeconds: number;
    lastPlaybackPosition: number;
    lastPlaybackClock: number;
  } | null = null;
  let mediaSession: MediaSessionController | null = null;
  let isUserSeeking = false;
  let pendingSeekSeconds: number | null = null;
  let shouldResumeAfterSeek = false;
  let seekReleaseTimer: number | undefined;

  const readFavoriteKeys = (): Set<string> => {
    try {
      const storedFavorites = window.localStorage.getItem(favoritesStorageKey);
      const parsedFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];

      if (Array.isArray(parsedFavorites)) {
        return new Set(parsedFavorites.filter((value): value is string => typeof value === 'string'));
      }
    } catch (_error) {
      return new Set<string>();
    }

    return new Set<string>();
  };

  const saveFavoriteKeys = (): void => {
    try {
      window.localStorage.setItem(favoritesStorageKey, JSON.stringify(Array.from(favoriteKeys)));
    } catch (_error) {
      // localStorage can be unavailable in private contexts; keep the player usable.
    }
  };

  const getFavoriteKey = (track: ZydkaTrack | null | undefined): string | null => {
    if (!track) return null;

    const id = String(track.id ?? '').trim();
    if (id) return `id:${id}`;

    const audioUrl = track.audioUrl.trim();
    if (audioUrl) return `url:${audioUrl}`;

    const title = track.title?.trim();
    return title ? `title:${title}` : null;
  };

  const isFavoriteTrack = (track: ZydkaTrack | null | undefined): boolean => {
    const favoriteKey = getFavoriteKey(track);
    return favoriteKey ? favoriteKeys.has(favoriteKey) : false;
  };

  const toggleFavoriteTrack = (track: ZydkaTrack | null | undefined): boolean => {
    const favoriteKey = getFavoriteKey(track);
    if (!favoriteKey) return false;

    if (favoriteKeys.has(favoriteKey)) {
      favoriteKeys.delete(favoriteKey);
    } else {
      favoriteKeys.add(favoriteKey);
    }

    saveFavoriteKeys();
    return favoriteKeys.has(favoriteKey);
  };

  const emitPlaybackAnalyticsEvent = (
    eventType: ZydkaAnalyticsEventType,
    track: ZydkaTrack | null | undefined,
    playheadSeconds: number,
    durationSeconds: number,
    extra: Record<string, string | number | boolean | null | undefined> = {},
  ): void => {
    emitZydkaAnalyticsEvent({
      root,
      eventType,
      track,
      playheadSeconds,
      durationSeconds,
      extra,
    });
  };

  const emitTrackedStop = (
    reason: string,
    extra: Record<string, string | number | boolean | null | undefined> = {},
  ): void => {
    if (
      !analyticsTrackState ||
      !analyticsTrackState.hasStarted ||
      analyticsTrackState.hasCompleted ||
      analyticsTrackState.hasStopped
    ) {
      return;
    }

    analyticsTrackState.hasStopped = true;
    emitPlaybackAnalyticsEvent(
      'play_stopped',
      analyticsTrackState.track,
      analyticsTrackState.lastPosition,
      analyticsTrackState.lastDuration,
      { stop_reason: reason, ...extra },
    );
  };

  const processPlaybackAnalytics = (
    state: ZydkaPlayerState,
    currentTrack: ZydkaTrack | null | undefined,
    position: number,
    trackDuration: number,
  ): void => {
    const signature = getTrackSignature(currentTrack);

    if (analyticsTrackState && signature !== analyticsTrackState.signature) {
      emitTrackedStop('track_changed', {
        next_track_id: getAnalyticsString(currentTrack?.id),
      });
      analyticsTrackState = null;
    }

    if (!currentTrack || !signature) return;

    if (!analyticsTrackState) {
      analyticsTrackState = {
        signature,
        track: currentTrack,
        hasStarted: false,
        hasSentCheckpoint: false,
        hasCompleted: false,
        hasStopped: false,
        wasPlaying: false,
        lastPosition: 0,
        lastDuration: 0,
        listenedSeconds: 0,
        lastPlaybackPosition: 0,
        lastPlaybackClock: 0,
      };
    } else {
      analyticsTrackState.track = currentTrack;
    }

    analyticsTrackState.lastPosition = position;
    analyticsTrackState.lastDuration = trackDuration;

    const now = Date.now();
    const isActivelyPlaying = state.status === 'playing' && state.isPlaying;

    if (isActivelyPlaying) {
      if (analyticsTrackState.lastPlaybackClock > 0) {
        const elapsedSeconds = Math.max(0, (now - analyticsTrackState.lastPlaybackClock) / 1000);
        const positionDelta = position - analyticsTrackState.lastPlaybackPosition;
        const maxContinuousDelta = elapsedSeconds + 1.5;

        if (positionDelta > 0 && positionDelta <= maxContinuousDelta) {
          analyticsTrackState.listenedSeconds += positionDelta;
        }
      }

      analyticsTrackState.lastPlaybackClock = now;
      analyticsTrackState.lastPlaybackPosition = position;
    } else {
      analyticsTrackState.lastPlaybackClock = 0;
      analyticsTrackState.lastPlaybackPosition = position;
    }

    if (state.status === 'playing' && state.isPlaying && !analyticsTrackState.hasStarted) {
      analyticsTrackState.hasStarted = true;
      emitPlaybackAnalyticsEvent('play_started', currentTrack, position, trackDuration);
    }

    if (analyticsTrackState.hasStarted && trackDuration > 0) {
      const checkpointSeconds = trackDuration < 60 ? trackDuration * 0.5 : 30;

      if (!analyticsTrackState.hasSentCheckpoint && analyticsTrackState.listenedSeconds >= checkpointSeconds) {
        analyticsTrackState.hasSentCheckpoint = true;
        emitPlaybackAnalyticsEvent('play_30s_checkpoint', currentTrack, position, trackDuration, {
          checkpoint_seconds: Math.round(checkpointSeconds),
        });
      }

      if (
        !analyticsTrackState.hasCompleted &&
        (state.status === 'ended' || analyticsTrackState.listenedSeconds >= trackDuration * 0.9)
      ) {
        analyticsTrackState.hasCompleted = true;
        emitPlaybackAnalyticsEvent('play_completed', currentTrack, position, trackDuration);
      }
    } else if (analyticsTrackState.hasStarted && state.status === 'ended' && !analyticsTrackState.hasCompleted) {
      analyticsTrackState.hasCompleted = true;
      emitPlaybackAnalyticsEvent('play_completed', currentTrack, position, trackDuration);
    }

    if (
      analyticsTrackState.hasStarted &&
      analyticsTrackState.wasPlaying &&
      !state.isPlaying &&
      state.status !== 'ended'
    ) {
      emitTrackedStop(state.status || 'stopped');
    }

    analyticsTrackState.wasPlaying = state.isPlaying;
  };

  const getDisplayCoverUrl = (track: ZydkaTrack | null | undefined): string | null => {
    if (!track) return null;

    const explicitCover = getCoverCandidates(track).find((coverUrl) => !failedCoverUrls.has(coverUrl));

    if (explicitCover) return explicitCover;
    if (hasExplicitCover(track)) return null;

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

  const playCurrentTrack = (): void => {
    const state = window.ZydkaPlayer?.state();

    if (state?.currentTrack) {
      window.ZydkaPlayer?.resume();
      return;
    }

    const currentIndex = window.ZydkaPlayer?.getCurrentIndex() ?? 0;
    window.ZydkaPlayer?.playAt(Math.max(0, currentIndex));
  };

  const getRandomQueueIndex = (queueLength: number, currentIndex: number): number => {
    if (queueLength <= 0) return -1;
    if (queueLength === 1) return 0;

    let nextIndex = Math.floor(Math.random() * queueLength);

    if (nextIndex === currentIndex) {
      nextIndex = (nextIndex + 1 + Math.floor(Math.random() * (queueLength - 1))) % queueLength;
    }

    return nextIndex;
  };

  const playAtIndex = (index: number, options: { resetShuffleHistory?: boolean } = {}): boolean => {
    const didPlay = window.ZydkaPlayer?.playAt(index) ?? false;

    if (didPlay && options.resetShuffleHistory !== false) {
      shuffleHistory = [];
    }

    return didPlay;
  };

  const playNextTrack = (): boolean => {
    const state = window.ZydkaPlayer?.state();
    const queue = window.ZydkaPlayer?.getQueue() ?? state?.queue ?? [];
    const currentIndex = window.ZydkaPlayer?.getCurrentIndex() ?? state?.currentIndex ?? -1;

    if (queue.length === 0) return false;

    if (shuffleEnabled) {
      const nextIndex = getRandomQueueIndex(queue.length, currentIndex);

      if (nextIndex < 0) return false;
      if (currentIndex >= 0 && queue.length > 1) {
        shuffleHistory.push(currentIndex);
      }

      return playAtIndex(nextIndex, { resetShuffleHistory: false });
    }

    if (currentIndex < queue.length - 1) {
      return window.ZydkaPlayer?.next() ?? false;
    }

    if (repeatMode === 'queue') {
      return playAtIndex(0);
    }

    return false;
  };

  const playPreviousTrack = (): boolean => {
    if (shuffleEnabled && shuffleHistory.length > 0) {
      const previousIndex = shuffleHistory.pop();

      if (typeof previousIndex === 'number') {
        return playAtIndex(previousIndex, { resetShuffleHistory: false });
      }
    }

    return window.ZydkaPlayer?.previous() ?? false;
  };

  const getRepeatLabel = (): string => {
    if (repeatMode === 'queue') return 'Répéter la file';
    if (repeatMode === 'one') return 'Répéter le morceau';
    return 'Activer la répétition';
  };

  const cycleRepeatMode = (): void => {
    repeatMode = repeatMode === 'off' ? 'queue' : repeatMode === 'queue' ? 'one' : 'off';
  };

  const getShareUrl = (track: ZydkaTrack | null | undefined): string => {
    const url = new URL(window.location.href);

    if (track?.id !== undefined && track.id !== null && String(track.id).trim()) {
      url.hash = `track-${encodeURIComponent(String(track.id).trim())}`;
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
    const artist = renderText(track?.artist || '').trim();
    const text = artist ? `${artist} - ${title}` : 'Écouter sur Louis94';
    const url = getShareUrl(track);
    const shareData = { title, text, url };

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

  const handleEndedPlayback = (state: ZydkaPlayerState, queue: ZydkaTrack[], currentIndex: number): void => {
    if (state.status !== 'ended' || repeatMode === 'off') {
      if (state.status !== 'ended') {
        handledEndedSignature = '';
      }

      return;
    }

    const endedSignature = `${currentIndex}:${state.currentTrack?.id ?? ''}:${Math.round(state.duration)}`;

    if (endedSignature === handledEndedSignature) return;

    handledEndedSignature = endedSignature;

    if (repeatMode === 'one') {
      playAtIndex(Math.max(0, currentIndex), { resetShuffleHistory: false });
      return;
    }

    if (queue.length === 0) return;

    if (shuffleEnabled) {
      const nextIndex = getRandomQueueIndex(queue.length, currentIndex);
      if (nextIndex >= 0) {
        playAtIndex(nextIndex, { resetShuffleHistory: false });
      }

      return;
    }

    if (currentIndex < queue.length - 1) {
      playAtIndex(Math.max(0, currentIndex + 1), { resetShuffleHistory: false });
    } else {
      playAtIndex(0, { resetShuffleHistory: false });
    }
  };

  mediaSession = setupMediaSession({
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
      const displayTitle = renderText(track.title || 'Track ' + String(index + 1));

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
        window.ZydkaPlayer?.playAt(index);
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
    const hasKnownDuration = Number.isFinite(trackDuration) && trackDuration > 0;
    const audioDisplayPosition = Math.max(
      0,
      hasKnownDuration
        ? Math.min(trackDuration, Number.isFinite(position) ? position : 0)
        : Number.isFinite(position) ? position : 0,
    );
    const displayPosition = pendingSeekSeconds !== null && hasKnownDuration
      ? Math.min(trackDuration, Math.max(0, pendingSeekSeconds))
      : audioDisplayPosition;
    const progressPercent = hasKnownDuration ? Math.min(100, (displayPosition / trackDuration) * 100) : 0;
    const displayIndex = queue.length > 0 ? Math.max(0, currentIndex) + 1 : 0;
    const volume = window.ZydkaPlayer?.getVolume() ?? state.volume;
    const muted = window.ZydkaPlayer?.isMuted() ?? state.muted;
    const hasQueue = queue.length > 1;
    const canGoNext = queue.length > 0 && (shuffleEnabled || currentIndex < queue.length - 1 || repeatMode === 'queue');

    if (hasQueue !== hasMultipleQueuedTracks) {
      hasMultipleQueuedTracks = hasQueue;
      queueButton.hidden = !hasQueue;
      setQueueOpen(isQueueOpen && hasQueue, { focusClose: false, restoreFocus: false });
    }

    root.classList.toggle('zydka-player-root--has-queue', hasQueue);
    actions.classList.toggle('zydka-player-actions--has-queue', hasQueue);
    queueButton.textContent = hasQueue ? `A suivre (${queue.length})` : 'A suivre';
    card.className = `zydka-player-card zydka-player-state-${state.status}`;
    title.textContent = renderText(displayTrack?.title ?? fallbackDisplayTrack.title);
    artist.textContent = renderText(displayTrack?.artist ?? fallbackDisplayTrack.artist);
    const metadataItems = getTrackMetadataItems(displayTrack);

    trackDetails.textContent = metadataItems.join(' · ');
    trackDetails.hidden = metadataItems.length === 0;

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

    const downloadUrl = displayTrack?.downloadUrl?.trim();

    if (downloadUrl) {
      downloadLink.href = downloadUrl;
      downloadLink.setAttribute('aria-label', `Télécharger ${renderText(displayTrack?.title || 'la track')}`);
      downloadLink.hidden = false;
    } else {
      downloadLink.removeAttribute('href');
      downloadLink.removeAttribute('aria-label');
      downloadLink.hidden = true;
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
    const favoriteActive = isFavoriteTrack(displayTrack);
    favoriteButton.classList.toggle('zydka-player-mode-button--active', favoriteActive);
    favoriteButton.classList.toggle('zydka-player-favorite-button--active', favoriteActive);
    favoriteButton.setAttribute('aria-pressed', String(favoriteActive));
    setIconButton(favoriteButton, favoriteActive ? 'Retirer des favoris' : 'Ajouter aux favoris', 'favorite');
    setIconButton(shareButton, `Partager ${renderText(displayTrack?.title || 'le morceau')}`, 'share');
    previousButton.disabled = shuffleEnabled ? shuffleHistory.length === 0 && currentIndex <= 0 : currentIndex <= 0;
    nextButton.disabled = !canGoNext;
    toggleButton.classList.toggle('zydka-player-toggle-button--playing', state.isPlaying);
    setIconButton(toggleButton, state.isPlaying ? 'Pause' : 'Play', state.isPlaying ? 'pause' : 'play');
    statusValue.textContent = state.status;
    currentTime.textContent = formatTime(displayPosition);
    duration.textContent = formatDurationTime(trackDuration);
    progress.max = hasKnownDuration ? String(trackDuration) : '0';
    progress.value = String(displayPosition);
    progress.disabled = !hasKnownDuration;
    progress.style.setProperty('--zydka-progress-percent', `${progressPercent}%`);
    progress.classList.toggle('zydka-player-progress--disabled', !hasKnownDuration);
    progress.setAttribute(
      'aria-valuetext',
      `${formatTime(displayPosition)} / ${formatDurationTime(trackDuration)}`,
    );
    volumeSlider.value = String(volume);
    volumeValue.textContent = `${Math.round(volume * 100)}%`;
    volumeControl.classList.toggle('zydka-player-volume--muted', muted);
    muteButton.classList.toggle('zydka-player-mute-button--muted', muted);
    setIconButton(muteButton, muted ? 'Unmute' : 'Mute', muted ? 'muted' : 'volume');
    const queueSignature = getQueueSignature(queue, currentIndex);

    if (queueSignature !== renderedQueueSignature) {
      renderQueueItems(queue, currentIndex);
      renderedQueueSignature = queueSignature;
    }

    error.textContent = state.error ?? '';
    error.hidden = !state.error;
    mediaSession?.refreshMetadata();

    if (!isUserSeeking) {
      if (state.isPlaying) {
        mediaSession?.refreshPositionThrottled();
      } else {
        mediaSession?.refreshPosition();
      }
    }

    processPlaybackAnalytics(state, state.currentTrack, audioDisplayPosition, trackDuration);
    handleEndedPlayback(state, queue, currentIndex);
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
    refreshState();
  });

  repeatButton.addEventListener('click', () => {
    cycleRepeatMode();
    refreshState();
  });

  shareButton.addEventListener('click', () => {
    void shareCurrentTrack();
  });

  favoriteButton.addEventListener('click', () => {
    const state = window.ZydkaPlayer?.state();
    const queue = window.ZydkaPlayer?.getQueue() ?? state?.queue ?? [];
    const currentIndex = window.ZydkaPlayer?.getCurrentIndex() ?? state?.currentIndex ?? -1;
    const displayTrack = state?.currentTrack ?? queue[currentIndex] ?? normalizeTrack(fallbackDisplayTrack);

    toggleFavoriteTrack(displayTrack);
    refreshState();
  });

  root.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(
            '[data-zydka-analytics="license_cta"], [data-zydka-analytics="download_cta"], .zydka-player-download-link, .zydka-player-buy-link',
          )
        : null;

      if (!target) return;

      const analyticsType = target.dataset.zydkaAnalytics || (
        target.classList.contains('zydka-player-download-link') ? 'download_cta' : 'license_cta'
      );
      const state = window.ZydkaPlayer?.state();
      const queue = window.ZydkaPlayer?.getQueue() ?? state?.queue ?? [];
      const currentIndex = window.ZydkaPlayer?.getCurrentIndex() ?? state?.currentIndex ?? -1;
      const displayTrack = state?.currentTrack ?? queue[currentIndex] ?? normalizeTrack(fallbackDisplayTrack);
      const ctaUrl = target instanceof HTMLAnchorElement ? target.href : '';

      emitZydkaAnalyticsEvent({
        root,
        eventType: analyticsType === 'download_cta' ? 'download_cta_clicked' : 'license_cta_clicked',
        track: displayTrack,
        playheadSeconds: window.ZydkaPlayer?.getCurrentTime() ?? 0,
        durationSeconds: window.ZydkaPlayer?.getDuration() ?? 0,
        extra: {
          cta_label: target.textContent?.trim() || target.getAttribute('aria-label') || '',
          cta_url: ctaUrl,
        },
      });
    },
    { capture: true },
  );

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

  function getSeekDuration(): number {
    const trackDuration = window.ZydkaPlayer?.getDuration() ?? 0;
    return Number.isFinite(trackDuration) && trackDuration > 0 ? trackDuration : 0;
  }

  function clampSeekSeconds(seconds: number): number | null {
    const trackDuration = getSeekDuration();

    if (trackDuration <= 0 || !Number.isFinite(seconds)) return null;

    return Math.min(trackDuration, Math.max(0, seconds));
  }

  function setPendingSeek(seconds: number | null): void {
    pendingSeekSeconds = seconds;
    refreshState();
  }

  function clearSeekReleaseTimer(): void {
    if (seekReleaseTimer !== undefined) {
      window.clearTimeout(seekReleaseTimer);
      seekReleaseTimer = undefined;
    }
  }

  function resumePlaybackAfterSeek(): void {
    window.setTimeout(() => {
      const state = window.ZydkaPlayer?.state();

      if (!state?.currentTrack || state.isPlaying || state.status === 'ended' || state.status === 'error') {
        return;
      }

      window.ZydkaPlayer?.resume();
      refreshState();
      mediaSession?.refreshPosition();
    }, 0);
  }

  function commitSeek(seconds: number): void {
    const clampedSeconds = clampSeekSeconds(seconds);

    if (clampedSeconds === null) return;

    const wasPlayingBeforeSeek = shouldResumeAfterSeek || (window.ZydkaPlayer?.state().isPlaying ?? false);

    clearSeekReleaseTimer();

    isUserSeeking = false;
    progress.classList.remove('zydka-player-progress--dragging');
    pendingSeekSeconds = clampedSeconds;
    window.ZydkaPlayer?.seek(clampedSeconds);
    refreshState();
    mediaSession?.refreshPosition();

    if (wasPlayingBeforeSeek) {
      resumePlaybackAfterSeek();
    }

    seekReleaseTimer = window.setTimeout(() => {
      seekReleaseTimer = undefined;

      if (isUserSeeking) return;

      pendingSeekSeconds = null;
      refreshState();
      mediaSession?.refreshPosition();
    }, 200);
  }

  function seekToTime(seconds: number): void {
    shouldResumeAfterSeek = window.ZydkaPlayer?.state().isPlaying ?? false;
    commitSeek(seconds);
    shouldResumeAfterSeek = false;
  }

  function getProgressSeekSeconds(): number | null {
    return clampSeekSeconds(Number(progress.value));
  }

  function beginUserSeek(): void {
    if (getSeekDuration() <= 0) return;

    if (!isUserSeeking) {
      clearSeekReleaseTimer();
      isUserSeeking = true;
      shouldResumeAfterSeek = window.ZydkaPlayer?.state().isPlaying ?? false;
      progress.classList.add('zydka-player-progress--dragging');
    }
  }

  function previewProgressSeek(): void {
    const seconds = getProgressSeekSeconds();

    if (seconds === null) return;

    beginUserSeek();
    setPendingSeek(seconds);
  }

  function finishProgressSeek(): void {
    if (!isUserSeeking) return;

    const seconds = pendingSeekSeconds ?? getProgressSeekSeconds();

    if (seconds !== null) {
      commitSeek(seconds);
    }

    shouldResumeAfterSeek = false;
  }

  function finishProgressSeekSoon(): void {
    window.setTimeout(finishProgressSeek, 0);
  }

  function cancelPendingSeek(): void {
    clearSeekReleaseTimer();
    isUserSeeking = false;
    shouldResumeAfterSeek = false;
    progress.classList.remove('zydka-player-progress--dragging');
    setPendingSeek(null);
    mediaSession?.refreshPosition();
  }

  progress.addEventListener('pointerdown', beginUserSeek);
  progress.addEventListener('touchstart', beginUserSeek, { passive: true });
  progress.addEventListener('mousedown', beginUserSeek);
  progress.addEventListener('input', previewProgressSeek);
  progress.addEventListener('change', finishProgressSeek);
  progress.addEventListener('pointerup', finishProgressSeekSoon);
  progress.addEventListener('touchend', finishProgressSeekSoon);
  progress.addEventListener('mouseup', finishProgressSeekSoon);
  progress.addEventListener('pointercancel', cancelPendingSeek);
  progress.addEventListener('touchcancel', cancelPendingSeek);

  progress.addEventListener('keydown', (event) => {
    const trackDuration = getSeekDuration();

    if (trackDuration <= 0) return;

    const currentPosition = window.ZydkaPlayer?.getCurrentTime() ?? 0;
    const keyboardStep = event.shiftKey ? 15 : 5;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      seekToTime(currentPosition - keyboardStep);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      seekToTime(currentPosition + keyboardStep);
    } else if (event.key === 'Home') {
      event.preventDefault();
      seekToTime(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      seekToTime(trackDuration);
    }
  });

  favoriteKeys = readFavoriteKeys();
  refreshState();
  window.setInterval(refreshState, 250);
  window.addEventListener('pagehide', () => emitTrackedStop('pagehide'));
}

function bootstrap(): void {
  const root = document.getElementById('zydka-player-root');
  // Ne rien faire si le shortcode [zydka_player] n'est pas present dans la page.
  if (!root) return;

  const shortcodeTrack = readTrackFromRoot(root);
  const managerQueue = readManagerQueueFromRoot(root);

  if (root.dataset.source === 'manager-playlist' && !managerQueue) {
    return;
  }

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

  const shortcodeQueue = managerQueue ?? readQueueFromRoot(root, shortcodeTrack);

  window.ZydkaPlayer.setQueue(shortcodeQueue);
  renderTestPlayer(root, shortcodeQueue[0] ?? shortcodeTrack);

  console.log('[Zydka Player] Bridge initialized - window.ZydkaPlayer ready.');
}

document.addEventListener('DOMContentLoaded', bootstrap);
window.addEventListener('beforeunload', revokeEmbeddedCoverCache, { once: true });
