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
    handler: ((details?: MediaSessionActionDetailsLike) => void) | null,
  ) => void;
  setPositionState?: (state?: {
    duration: number;
    playbackRate: number;
    position: number;
  }) => void;
}

// seekforward / seekbackward are deliberately NOT registered: on iOS they replace the
// previous / next track buttons of the lock screen with ±10 s buttons.
type MediaSessionAction = 'play' | 'pause' | 'previoustrack' | 'nexttrack' | 'seekto';

interface MediaSessionActionDetailsLike {
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
  let hasPublishedPosition = false;

  // Published on every call, including while the page is hidden / the screen is locked:
  // that is exactly when the lock screen reads it.
  const refreshPosition = (): void => {
    lastPositionUpdate = Date.now();
    setPlaybackState(mediaSession, options.isPlaying());

    if (typeof mediaSession.setPositionState !== 'function') {
      return;
    }

    const positionState = getValidPositionState(options);

    if (!positionState) {
      // Duration unknown (next track loading): clear the previous track's position once
      // instead of leaving a stale progress bar on the lock screen.
      if (hasPublishedPosition) {
        hasPublishedPosition = false;
        safeRun(() => mediaSession.setPositionState?.());
      }

      return;
    }

    hasPublishedPosition = true;
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

    refreshPosition();
  };

  const setHandler = (
    action: MediaSessionAction,
    handler: (details: MediaSessionActionDetailsLike) => void,
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

  setHandler('play', () => options.play());
  setHandler('pause', () => options.pause());
  setHandler('previoustrack', () => options.previous());
  setHandler('nexttrack', () => options.next());
  // Lock screen / notification scrubber: same seek path as the on-page timeline.
  setHandler('seekto', (details) => {
    const seekTime = details.seekTime;

    if (typeof seekTime === 'number' && Number.isFinite(seekTime)) {
      options.seek(seekTime);
    }
  });

  return {
    refreshMetadata,
    refreshPosition,
    refreshPositionThrottled,
  };
}
