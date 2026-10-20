import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampSeekTime,
  formatDurationTime,
  formatTime,
  getKeyboardSeekTarget,
  getTimelineDisplay,
  needsEmbeddedCover,
  resolveCoverUrl,
} from '../src/timeline.ts';

describe('formatTime / formatDurationTime', () => {
  it('formats minutes and seconds', () => {
    assert.equal(formatTime(0), '0:00');
    assert.equal(formatTime(65.9), '1:05');
    assert.equal(formatTime(NaN), '0:00');
  });

  it('shows --:-- while the duration is unknown (mobile metadata still loading)', () => {
    assert.equal(formatDurationTime(0), '--:--');
    assert.equal(formatDurationTime(NaN), '--:--');
    assert.equal(formatDurationTime(Infinity), '--:--');
    assert.equal(formatDurationTime(185), '3:05');
  });
});

describe('clampSeekTime', () => {
  it('keeps the target inside the track', () => {
    assert.equal(clampSeekTime(-4, 120), 0);
    assert.equal(clampSeekTime(500, 120), 120);
    assert.equal(clampSeekTime(42.5, 120), 42.5);
  });

  it('refuses to seek when the duration or target is unusable', () => {
    assert.equal(clampSeekTime(10, 0), null);
    assert.equal(clampSeekTime(10, NaN), null);
    assert.equal(clampSeekTime(NaN, 120), null);
  });
});

describe('getTimelineDisplay', () => {
  it('reflects the audio position', () => {
    const display = getTimelineDisplay(30, 120);
    assert.equal(display.hasKnownDuration, true);
    assert.equal(display.displayPosition, 30);
    assert.equal(display.percent, 25);
    assert.equal(display.valueText, '0:30 / 2:00');
  });

  it('shows the drag preview instead of the audio position while seeking', () => {
    const display = getTimelineDisplay(30, 120, 90);
    assert.equal(display.displayPosition, 90);
    assert.equal(display.percent, 75);
    assert.equal(display.currentLabel, '1:30');
  });

  it('clamps out-of-range positions and previews', () => {
    assert.equal(getTimelineDisplay(130, 120).percent, 100);
    assert.equal(getTimelineDisplay(-3, 120).displayPosition, 0);
    assert.equal(getTimelineDisplay(10, 120, 999).displayPosition, 120);
  });

  it('is disabled and empty when the duration is unknown', () => {
    const display = getTimelineDisplay(5, 0, 50);
    assert.equal(display.hasKnownDuration, false);
    assert.equal(display.percent, 0);
    assert.equal(display.durationLabel, '--:--');
    assert.equal(display.displayPosition, 5);
  });
});

describe('getKeyboardSeekTarget', () => {
  it('moves by 5 s, or 15 s with Shift', () => {
    assert.equal(getKeyboardSeekTarget('ArrowRight', false, 10, 120), 15);
    assert.equal(getKeyboardSeekTarget('ArrowUp', true, 10, 120), 25);
    assert.equal(getKeyboardSeekTarget('ArrowLeft', false, 10, 120), 5);
    assert.equal(getKeyboardSeekTarget('ArrowDown', true, 10, 120), 0);
  });

  it('supports Home / End and ignores other keys', () => {
    assert.equal(getKeyboardSeekTarget('Home', false, 60, 120), 0);
    assert.equal(getKeyboardSeekTarget('End', false, 60, 120), 120);
    assert.equal(getKeyboardSeekTarget('Enter', false, 60, 120), null);
    assert.equal(getKeyboardSeekTarget('ArrowRight', false, 60, 0), null);
  });
});

describe('resolveCoverUrl / needsEmbeddedCover', () => {
  it('prefers the explicit cover', () => {
    assert.equal(resolveCoverUrl(' https://x/cover.jpg ', 'blob:embedded', new Set()), 'https://x/cover.jpg');
    assert.equal(needsEmbeddedCover('https://x/cover.jpg', new Set()), false);
  });

  it('falls back to the embedded MP3 cover when the explicit cover failed', () => {
    const failed = new Set(['https://x/cover.jpg']);
    assert.equal(resolveCoverUrl('https://x/cover.jpg', 'blob:embedded', failed), 'blob:embedded');
    assert.equal(needsEmbeddedCover('https://x/cover.jpg', failed), true);
  });

  it('uses the embedded cover when no explicit cover is set', () => {
    assert.equal(resolveCoverUrl(undefined, 'blob:embedded', new Set()), 'blob:embedded');
    assert.equal(resolveCoverUrl('   ', 'blob:embedded', new Set()), 'blob:embedded');
  });

  it('never returns a failed URL', () => {
    const failed = new Set(['https://x/cover.jpg', 'blob:embedded']);
    assert.equal(resolveCoverUrl('https://x/cover.jpg', 'blob:embedded', failed), null);
    assert.equal(resolveCoverUrl(undefined, undefined, new Set()), null);
  });
});
