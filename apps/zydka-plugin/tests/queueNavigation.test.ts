import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cycleRepeatMode,
  getNextTrack,
  getPreviousIndex,
  type QueueNavigationState,
} from '../src/queueNavigation.ts';

const state = (overrides: Partial<QueueNavigationState> = {}): QueueNavigationState => ({
  queueLength: 3,
  currentIndex: 0,
  repeatMode: 'off',
  shuffle: false,
  shufflePlayed: [],
  ...overrides,
});

const nextIndex = (...args: Parameters<typeof getNextTrack>): number | null =>
  getNextTrack(...args)?.index ?? null;

describe('getNextTrack — repeat off', () => {
  it('plays the next track when a track ends', () => {
    assert.equal(nextIndex(state({ currentIndex: 0 }), 'ended'), 1);
    assert.equal(nextIndex(state({ currentIndex: 1 }), 'ended'), 2);
  });

  it('stops after the last track', () => {
    assert.equal(getNextTrack(state({ currentIndex: 2 }), 'ended'), null);
    assert.equal(getNextTrack(state({ currentIndex: 2 }), 'user'), null);
  });

  it('starts at the first track when nothing was selected yet', () => {
    assert.equal(nextIndex(state({ currentIndex: -1 }), 'user'), 0);
  });
});

describe('getNextTrack — repeat queue', () => {
  it('goes back to the first track after the last one', () => {
    assert.equal(nextIndex(state({ currentIndex: 2, repeatMode: 'queue' }), 'ended'), 0);
    assert.equal(nextIndex(state({ currentIndex: 2, repeatMode: 'queue' }), 'user'), 0);
  });

  it('loops a single-track queue', () => {
    assert.equal(nextIndex(state({ queueLength: 1, repeatMode: 'queue' }), 'ended'), 0);
  });
});

describe('getNextTrack — repeat one', () => {
  it('replays the same track when it ends', () => {
    assert.equal(nextIndex(state({ currentIndex: 1, repeatMode: 'one' }), 'ended'), 1);
    assert.equal(nextIndex(state({ currentIndex: 2, repeatMode: 'one', shuffle: true }), 'ended'), 2);
  });

  it('lets Next move on like repeat off', () => {
    assert.equal(nextIndex(state({ currentIndex: 1, repeatMode: 'one' }), 'user'), 2);
    assert.equal(getNextTrack(state({ currentIndex: 2, repeatMode: 'one' }), 'user'), null);
  });
});

describe('getNextTrack — shuffle', () => {
  it('only picks tracks not played yet in the cycle', () => {
    const current = state({ queueLength: 4, currentIndex: 0, shuffle: true, shufflePlayed: [0, 2] });

    for (const value of [0, 0.49, 0.5, 0.99]) {
      const index = nextIndex(current, 'ended', () => value);
      assert.ok(index === 1 || index === 3, `unexpected ${index}`);
    }
  });

  it('stops once every track was played (repeat off)', () => {
    const allPlayed = state({ currentIndex: 1, shuffle: true, shufflePlayed: [0, 1, 2] });

    assert.equal(getNextTrack(allPlayed, 'ended'), null);
    assert.equal(getNextTrack(allPlayed, 'user'), null);
  });

  it('starts a new cycle once every track was played (repeat queue)', () => {
    const next = getNextTrack(
      state({ currentIndex: 1, repeatMode: 'queue', shuffle: true, shufflePlayed: [0, 1, 2] }),
      'ended',
      () => 0.99,
    );

    assert.deepEqual(next, { index: 2, startsNewShuffleCycle: true });
  });

  it('never replays the current track while others are available', () => {
    const current = state({ queueLength: 2, currentIndex: 1, repeatMode: 'queue', shuffle: true, shufflePlayed: [0, 1] });

    assert.equal(nextIndex(current, 'ended', () => 0), 0);
    assert.equal(nextIndex(current, 'ended', () => 0.99), 0);
  });

  it('handles a single-track queue', () => {
    assert.equal(getNextTrack(state({ queueLength: 1, shuffle: true, shufflePlayed: [0] }), 'ended'), null);
    assert.deepEqual(
      getNextTrack(state({ queueLength: 1, repeatMode: 'queue', shuffle: true, shufflePlayed: [0] }), 'ended'),
      { index: 0, startsNewShuffleCycle: true },
    );
  });
});

describe('getNextTrack — empty queue', () => {
  it('never returns a track', () => {
    for (const repeatMode of ['off', 'queue', 'one'] as const) {
      assert.equal(getNextTrack(state({ queueLength: 0, currentIndex: -1, repeatMode }), 'ended'), null);
      assert.equal(getNextTrack(state({ queueLength: 0, currentIndex: -1, repeatMode, shuffle: true }), 'user'), null);
    }
  });
});

describe('getPreviousIndex', () => {
  it('goes to the track before, not before the first one', () => {
    assert.equal(getPreviousIndex(state({ currentIndex: 2 }), []), 1);
    assert.equal(getPreviousIndex(state({ currentIndex: 0 }), []), null);
    assert.equal(getPreviousIndex(state({ queueLength: 0, currentIndex: -1 }), []), null);
  });

  it('follows the shuffle history first', () => {
    assert.equal(getPreviousIndex(state({ currentIndex: 0, shuffle: true }), [2, 1]), 1);
    assert.equal(getPreviousIndex(state({ currentIndex: 2, shuffle: true }), []), 1);
    assert.equal(getPreviousIndex(state({ currentIndex: 2, shuffle: false }), [0]), 1);
  });
});

describe('cycleRepeatMode', () => {
  it('cycles off → queue → one → off', () => {
    assert.equal(cycleRepeatMode('off'), 'queue');
    assert.equal(cycleRepeatMode('queue'), 'one');
    assert.equal(cycleRepeatMode('one'), 'off');
  });
});
