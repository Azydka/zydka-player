interface MediaSessionTrack {
  title?: string;
  artist?: string;
  album?: string;
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

function createArtwork(src: string | null): MediaImageLike[] | undefined {
  if (!src?.trim()) return undefined;

  const artwork: MediaImageLike = {
    src: src.trim(),
    sizes: '512x512',
  };
  const type = getArtworkType(artwork.src);

  if (type) {
    artwork.type = type;
  }

  return [artwork];
}

function getValidPositionState(options: MediaSessionOptions): {
  duration: number;
  playbackRate: number;
  position: number;
} | null {
  const duration = options.getDuration();

  if (!Number.isFinite(duration) || duration <= 0) {
    return null;
  }

  const currentTime = options.getCurrentTime();
  const position = Number.isFinite(currentTime)
    ? Math.min(duration, Math.max(0, currentTime))
    : 0;

  return {
    duration,
    playbackRate: 1,
    position,
  };
}

function setPlaybackState(mediaSession: MediaSessionLike, isPlaying: boolean): void {
  safeRun(() => {
    mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  });
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
    setPlaybackState(mediaSession, options.isPlaying());

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

    const artwork = createArtwork(options.getArtwork(track));
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
  ): void => {
    safeRun(() => {
      mediaSession.setActionHandler?.(action, (details) => {
        safeRun(() => handler(details ?? {}));
        window.setTimeout(() => {
          refreshMetadata();
          refreshPosition();
        }, 0);
      });
    });
  };

  const seekTo = (seconds: number): void => {
    const duration = options.getDuration();

    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(seconds)) {
      return;
    }

    options.seek(Math.min(duration, Math.max(0, seconds)));
  };

  const seekBy = (offset: number): void => {
    const currentTime = options.getCurrentTime();
    seekTo((Number.isFinite(currentTime) ? currentTime : 0) + offset);
  };

  setHandler('play', () => options.play());
  setHandler('pause', () => options.pause());
  setHandler('previoustrack', () => options.previous());
  setHandler('nexttrack', () => options.next());
  setHandler('seekbackward', (details) => seekBy(-(details.seekOffset ?? 10)));
  setHandler('seekforward', (details) => seekBy(details.seekOffset ?? 10));
  setHandler('seekto', (details) => {
    if (typeof details.seekTime === 'number') {
      seekTo(details.seekTime);
    }
  });

  return {
    refreshMetadata,
    refreshPosition,
    refreshPositionThrottled,
  };
}
