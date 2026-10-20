/**
 * Pure timeline / cover helpers used by the player UI and the Media Session.
 * No DOM access here so the behaviour can be covered by node:test.
 */

export interface TimelineDisplay {
  hasKnownDuration: boolean;
  displayPosition: number;
  percent: number;
  currentLabel: string;
  durationLabel: string;
  valueText: string;
}

export const KEYBOARD_SEEK_STEP_SECONDS = 5;
export const KEYBOARD_SEEK_LARGE_STEP_SECONDS = 15;

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function isKnownDuration(duration: number): boolean {
  return Number.isFinite(duration) && duration > 0;
}

export function formatDurationTime(duration: number): string {
  return isKnownDuration(duration) ? formatTime(duration) : '--:--';
}

/** Clamp a seek target into [0, duration]. Returns null when seeking is impossible. */
export function clampSeekTime(seconds: number, duration: number): number | null {
  if (!isKnownDuration(duration) || !Number.isFinite(seconds)) return null;

  return Math.min(duration, Math.max(0, seconds));
}

/**
 * What the timeline should show. While the user drags the slider (pendingSeek),
 * the preview position wins over the audio position so the thumb does not jump back.
 */
export function getTimelineDisplay(
  position: number,
  duration: number,
  pendingSeek: number | null = null,
): TimelineDisplay {
  const hasKnownDuration = isKnownDuration(duration);
  const safePosition = Number.isFinite(position) ? Math.max(0, position) : 0;
  const audioPosition = hasKnownDuration ? Math.min(duration, safePosition) : safePosition;
  const pending = pendingSeek === null ? null : clampSeekTime(pendingSeek, duration);
  const displayPosition = pending ?? audioPosition;
  const percent = hasKnownDuration ? Math.min(100, (displayPosition / duration) * 100) : 0;
  const currentLabel = formatTime(displayPosition);
  const durationLabel = formatDurationTime(duration);

  return {
    hasKnownDuration,
    displayPosition,
    percent,
    currentLabel,
    durationLabel,
    valueText: `${currentLabel} / ${durationLabel}`,
  };
}

/** Keyboard seeking on the timeline: 5 s per arrow (15 s with Shift), Home / End. */
export function getKeyboardSeekTarget(
  key: string,
  shiftKey: boolean,
  position: number,
  duration: number,
): number | null {
  if (!isKnownDuration(duration)) return null;

  const step = shiftKey ? KEYBOARD_SEEK_LARGE_STEP_SECONDS : KEYBOARD_SEEK_STEP_SECONDS;
  const current = Number.isFinite(position) ? position : 0;

  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return clampSeekTime(current - step, duration);
    case 'ArrowRight':
    case 'ArrowUp':
      return clampSeekTime(current + step, duration);
    case 'Home':
      return 0;
    case 'End':
      return duration;
    default:
      return null;
  }
}

/**
 * Cover shown in the player and on the lock screen: the explicit cover unless it failed
 * to load, then the cover embedded in the MP3, otherwise none (letter fallback).
 */
export function resolveCoverUrl(
  explicitCover: string | undefined,
  embeddedCover: string | undefined,
  failedUrls: ReadonlySet<string>,
): string | null {
  const explicitUrl = explicitCover?.trim();

  if (explicitUrl && !failedUrls.has(explicitUrl)) return explicitUrl;

  const embeddedUrl = embeddedCover?.trim();

  if (embeddedUrl && !failedUrls.has(embeddedUrl)) return embeddedUrl;

  return null;
}

/** The embedded cover is only worth extracting when no usable explicit cover exists. */
export function needsEmbeddedCover(explicitCover: string | undefined, failedUrls: ReadonlySet<string>): boolean {
  const explicitUrl = explicitCover?.trim();

  return !explicitUrl || failedUrls.has(explicitUrl);
}
