import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setupMediaSession } from '../src/mediaSession.ts';

type Handler = ((details?: { seekTime?: number; fastSeek?: boolean }) => void) | null;
type PositionState = { duration: number; playbackRate: number; position: number } | undefined;

interface FakeMediaSession {
  metadata: unknown;
  playbackState?: string;
  handlers: Map<string, Handler>;
  positionCalls: PositionState[];
  setActionHandler: (action: string, handler: Handler) => void;
  setPositionState: (state?: PositionState) => void;
}

let session: FakeMediaSession;

function installFakeBrowser(): void {
  session = {
    metadata: null,
    handlers: new Map(),
    positionCalls: [],
    setActionHandler(action, handler) {
      this.handlers.set(action, handler);
    },
    setPositionState(state) {
      if (state && (!Number.isFinite(state.position) || state.position > state.duration)) {
        throw new TypeError('invalid position state'); // real browsers throw on bad values
      }
      this.positionCalls.push(state);
    },
  };

  const g = globalThis as Record<string, unknown>;
  g.window = globalThis;
  g.MediaMetadata = class {
    init: unknown;
    constructor(init: unknown) {
      this.init = init;
    }
  };
  Object.defineProperty(globalThis.navigator, 'mediaSession', {
    value: session,
    configurable: true,
  });
}

function createPlayer(overrides: Partial<{ time: number; duration: number; playing: boolean }> = {}) {
  const player = { time: 30, duration: 120, playing: true, seeks: [] as number[], calls: [] as string[], ...overrides };
  const controller = setupMediaSession({
    getCurrentTrack: () => ({ title: 'Titre', artist: 'Louis94', album: '' }),
    getArtwork: () => 'https://www.louis94.com/cover.jpg',
    play: () => player.calls.push('play'),
    pause: () => player.calls.push('pause'),
    previous: () => player.calls.push('previous'),
    next: () => player.calls.push('next'),
    seek: (seconds) => {
      player.seeks.push(seconds);
      player.time = seconds;
    },
    getCurrentTime: () => player.time,
    getDuration: () => player.duration,
    isPlaying: () => player.playing,
  });

  return { player, controller };
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 5));

describe('setupMediaSession — lock screen actions', () => {
  beforeEach(installFakeBrowser);

  it('registers play, pause, previous, next and seekto', () => {
    createPlayer();
    for (const action of ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto']) {
      assert.equal(typeof session.handlers.get(action), 'function', action);
    }
  });

  it('does NOT register seekforward / seekbackward (keeps previous/next on iOS)', () => {
    createPlayer();
    assert.equal(session.handlers.has('seekforward'), false);
    assert.equal(session.handlers.has('seekbackward'), false);
  });

  it('routes previous/next/play/pause to the player', () => {
    const { player } = createPlayer();
    session.handlers.get('previoustrack')?.();
    session.handlers.get('nexttrack')?.();
    session.handlers.get('pause')?.();
    session.handlers.get('play')?.();
    assert.deepEqual(player.calls, ['previous', 'next', 'pause', 'play']);
  });

  it('seekto calls the shared seek path and republishes the new position', async () => {
    const { player } = createPlayer();
    session.handlers.get('seekto')?.({ seekTime: 75 });
    assert.deepEqual(player.seeks, [75]);

    await tick();
    const last = session.positionCalls.at(-1);
    assert.equal(last?.position, 75);
    assert.equal(last?.duration, 120);
  });

  it('seekto ignores missing or invalid seekTime', () => {
    const { player } = createPlayer();
    session.handlers.get('seekto')?.({});
    session.handlers.get('seekto')?.({ seekTime: NaN });
    session.handlers.get('seekto')?.();
    assert.deepEqual(player.seeks, []);
  });

  it('a throwing player action never breaks the media session', () => {
    installFakeBrowser();
    setupMediaSession({
      getCurrentTrack: () => null,
      getArtwork: () => null,
      play: () => {
        throw new Error('boom');
      },
      pause: () => undefined,
      previous: () => undefined,
      next: () => undefined,
      seek: () => undefined,
      getCurrentTime: () => 0,
      getDuration: () => 0,
      isPlaying: () => false,
    });
    assert.doesNotThrow(() => session.handlers.get('play')?.());
  });
});

describe('setupMediaSession — position state', () => {
  beforeEach(installFakeBrowser);

  it('publishes a valid, clamped position', () => {
    const { player, controller } = createPlayer({ time: 500 });
    controller.refreshPosition();
    assert.deepEqual(session.positionCalls.at(-1), { duration: 120, playbackRate: 1, position: 120 });

    player.time = NaN;
    controller.refreshPosition();
    assert.equal(session.positionCalls.at(-1)?.position, 0);
  });

  it('keeps publishing while the page is hidden (screen locked)', () => {
    const g = globalThis as Record<string, unknown>;
    g.document = { visibilityState: 'hidden' };
    try {
      const { controller } = createPlayer();
      controller.refreshPosition();
      assert.equal(session.positionCalls.length, 1);
      assert.equal(session.playbackState, 'playing');
    } finally {
      delete g.document;
    }
  });

  it('clears the previous track position once while the next track duration is unknown', () => {
    const { player, controller } = createPlayer();
    controller.refreshPosition();
    player.duration = 0;
    controller.refreshPosition();
    controller.refreshPosition();
    assert.deepEqual(session.positionCalls, [{ duration: 120, playbackRate: 1, position: 30 }, undefined]);
  });

  it('throttles position updates during playback', () => {
    const { controller } = createPlayer();
    controller.refreshPositionThrottled();
    controller.refreshPositionThrottled();
    assert.equal(session.positionCalls.length, 1);
  });

  it('reflects pause in playbackState', () => {
    const { player, controller } = createPlayer();
    player.playing = false;
    controller.refreshPosition();
    assert.equal(session.playbackState, 'paused');
  });
});
