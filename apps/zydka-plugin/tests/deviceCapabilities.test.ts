import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canControlMediaVolume } from '../src/deviceCapabilities.ts';
import { cycleRepeatMode, getRepeatFeedback } from '../src/queueNavigation.ts';

describe('canControlMediaVolume', () => {
  it('is true when the written volume is kept (desktop, Android)', () => {
    assert.equal(canControlMediaVolume(() => ({ volume: 1 })), true);
  });

  it('is false when the volume stays at 1 (iPhone, iPad)', () => {
    const iosLike = {
      get volume() {
        return 1;
      },
      set volume(_value: number) {
        // WebKit on iOS ignores the write.
      },
    };

    assert.equal(canControlMediaVolume(() => iosLike), false);
  });

  it('keeps the slider when the probe cannot be created', () => {
    assert.equal(canControlMediaVolume(() => null), true);
    assert.equal(canControlMediaVolume(() => undefined), true);
  });

  it('keeps the slider when the probe throws', () => {
    assert.equal(
      canControlMediaVolume(() => {
        throw new Error('no audio');
      }),
      true,
    );

    const throwingSetter = {
      get volume() {
        return 1;
      },
      set volume(_value: number) {
        throw new Error('read-only');
      },
    };

    assert.equal(canControlMediaVolume(() => throwingSetter), true);
  });

  it('is true without a DOM (default probe)', () => {
    assert.equal(canControlMediaVolume(), true);
  });
});

describe('getRepeatFeedback', () => {
  it('names the mode reached by each press', () => {
    const first = cycleRepeatMode('off');
    const second = cycleRepeatMode(first);
    const third = cycleRepeatMode(second);

    assert.equal(getRepeatFeedback(first), 'Répétition : toute la playlist');
    assert.equal(getRepeatFeedback(second), 'Répétition : ce morceau');
    assert.equal(getRepeatFeedback(third), 'Répétition désactivée');
  });
});
