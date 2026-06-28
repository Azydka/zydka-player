interface MediaSessionTrack {
  title?: string;
  artist?: string;
  album?: string;
  cover?: string;
  cover512?: string;
  cover1024?: string;
}

interface MediaImageLike {
  src: string;
  sizes?: string;
  type?: string;
}

interface MediaMetadataInitLike {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: MediaImageLike[];
}

interface MediaMetadataConstructorLike {
  new (metadata: MediaMetadataInitLike): unknown;
}

interface MediaSessionLike {
  metadata: unknown;
  playbackState?: 'none' | 'paused' | 'playing';
  setActionHandler?: (
    action: MediaSessionAction,
    handler: ((details?: MediaSessionActionDetails) => void) | null,
  ) => void;
  setPositionState?: (state: {
    duration: number;
    playbackRate: number;
    position: number;
  }) => void;
}

type MediaSessionAction =
  | 'play'
  | 'pause'
  | 'previoustrack'
  | 'nexttrack'
  | 'seekbackward'
  | 'seekforward'
  | 'seekto';

interface MediaSessionActionDetails {
  seekOffset?: number;
  seekTime?: number;
  fastSeek?: boolean;
}

interface MediaSessionOptions {
  getCurrentTrack: () => MediaSessionTrack | null;
  getArtwork: (track: MediaSessionTrack) => string | null;
  play: () => void;
  pause: () => void;
  previous: () => void;
  next: () => void;
  seek: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
}

export interface MediaSessionController {
  refreshMetadata: () => void;
  refreshPosition: () => void;
  refreshPositionThrottled: () => void;
}

const noopController: MediaSessionController = {
  refreshMetadata: () => undefined,
  refreshPosition: () => undefined,
  refreshPositionThrottled: () => undefined,
};

const POSITION_UPDATE_INTERVAL_MS = 1000;

function getMediaSession(): MediaSessionLike | null {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return null;
  }

  return (navigator as Navigator & { mediaSession?: MediaSessionLike }).mediaSession ?? null;
}

function getMediaMetadataConstructor(): MediaMetadataConstructorLike | null {
  if (typeof window === 'undefined' || !('MediaMetadata' in window)) {
    return null;
  }

  return (window as Window & { MediaMetadata?: MediaMetadataConstructorLike }).MediaMetadata ?? null;
}

function safeRun(callback: () => void): void {
  try {
    callback();
  } catch {
    // Media Session support is intentionally progressive.
  }
}

function cleanText(value: string | undefined, fallback: string): string {
  const normalizedValue = value?.trim();
  return normalizedValue || fallback;
}

function getArtworkType(src: string): string | undefined {
  const normalizedSrc = src.split('?')[0]?.toLowerCase() ?? '';

  if (normalizedSrc.startsWith('blob:')) return undefined;
  if (normalizedSrc.endsWith('.png')) return 'image/png';
  if (normalizedSrc.endsWith('.webp')) return 'image/webp';
  if (normalizedSrc.endsWith('.jpg') || normalizedSrc.endsWith('.jpeg')) return 'image/jpeg';

  return undefined;
}

function createArtworkItem(src: string | undefined, sizes: string): MediaImageLike | null {
  const normalizedSrc = src?.trim();

  if (!normalizedSrc) return null;

  const artwork: MediaImageLike = {
    src: normalizedSrc,
    sizes,
  };
  const type = getArtworkType(artwork.src);

  if (type) {
    artwork.type = type;
  }

  return artwork;
}

function createArtwork(track: MediaSessionTrack, fallbackSrc: string | null): MediaImageLike[] | undefined {
  const artworkItems = [
    createArtworkItem(track.cover512, '512x512'),
    createArtworkItem(track.cover1024, '1024x1024'),
    !track.cover512?.trim() && !track.cover1024?.trim()
      ? createArtworkItem(track.cover, '512x512')
      : null,
    !track.cover?.trim() && !track.cover512?.trim() && !track.cover1024?.trim()
      ? createArtworkItem(fallbackSrc ?? undefined, '512x512')
      : null,
  ];

  const seenSources = new Set<string>();
  const artwork = artworkItems.reduce<MediaImageLike[]>((items, item) => {
    if (!item || seenSources.has(item.src)) {
      return items;
    }

    seenSources.add(item.src);
    items.push(item);
    return items;
  }, []);

  return artwork.length > 0 ? artwork : undefined;
}

function getValidPositionState(options: MediaSessionOptions): {
  duration: number;
  playbackRate: number;
  position: number;
} | null {
  const duration = options.getDuration();
  const playbackRate = 1;

  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(playbackRate) || playbackRate <= 0) {
    return null;
  }

  const currentTime = options.getCurrentTime();
  const position = Number.isFinite(currentTime)
    ? Math.min(duration, Math.max(0, currentTime))
    : 0;

  if (!Number.isFinite(position)) {
    return null;
  }

  return {
    duration,
    playbackRate,
    position,
  };
}

function setPlaybackState(mediaSession: MediaSessionLike, isPlaying: boolean): void {
  safeRun(() => {
    mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  });
}

function canPublishPositionState(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}

export function setupMediaSession(options: MediaSessionOptions): MediaSessionController {
  const mediaSession = getMediaSession();

  if (!mediaSession) {
    return noopController;
  }

  const mediaMetadata = getMediaMetadataConstructor();
  let metadataSignature = '';
  let lastPositionUpdate = 0;

  const refreshPosition = (): void => {
    lastPositionUpdate = Date.now();
    setPlaybackState(mediaSession, options.isPlaying());

    if (!canPublishPositionState()) {
      return;
    }

    const positionState = getValidPositionState(options);

    if (!positionState || typeof mediaSession.setPositionState !== 'function') {
      return;
    }

    safeRun(() => mediaSession.setPositionState?.(positionState));
  };

  const refreshMetadata = (): void => {
    if (!mediaMetadata) return;

    const track = options.getCurrentTrack();
    if (!track) return;

    const artwork = createArtwork(track, options.getArtwork(track));
    const metadata: MediaMetadataInitLike = {
      title: cleanText(track.title, 'Zydka Player'),
      artist: cleanText(track.artist, 'Louis94'),
      album: cleanText(track.album, 'Louis94'),
    };

    if (artwork) {
      metadata.artwork = artwork;
    }

    const signature = JSON.stringify(metadata);

    if (signature === metadataSignature) {
      return;
    }

    metadataSignature = signature;
    safeRun(() => {
      mediaSession.metadata = new mediaMetadata(metadata);
    });
  };

  const refreshPositionThrottled = (): void => {
    const now = Date.now();

    if (now - lastPositionUpdate < POSITION_UPDATE_INTERVAL_MS) {
      return;
    }

    lastPositionUpdate = now;
    refreshPosition();
  };

  const setHandler = (
    action: MediaSessionAction,
    handler: (details: MediaSessionActionDetails) => void,
    handlerOptions: { refreshPositionAfterAction?: boolean } = {},
  ): void => {
    const shouldRefreshPosition = handlerOptions.refreshPositionAfterAction ?? true;

    safeRun(() => {
      mediaSession.setActionHandler?.(action, (details) => {
        safeRun(() => handler(details ?? {}));
        window.setTimeout(() => {
          refreshMetadata();
          if (shouldRefreshPosition) {
            refreshPosition();
          } else {
            setPlaybackState(mediaSession, options.isPlaying());
          }
        }, 0);
      });
    });
  };

  setHandler('play', () => options.play());
  setHandler('pause', () => options.pause());
  setHandler('previoustrack', () => options.previous());
  setHandler('nexttrack', () => options.next());
  setHandler('seekbackward', () => undefined, { refreshPositionAfterAction: false });
  setHandler('seekforward', () => undefined, { refreshPositionAfterAction: false });
  setHandler('seekto', () => undefined, { refreshPositionAfterAction: false });

  return {
    refreshMetadata,
    refreshPosition,
    refreshPositionThrottled,
  };
}
