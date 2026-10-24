/**
 * Pure queue navigation rules shared by the buttons, the lock screen and the
 * end of a track. No DOM access here so the behaviour can be covered by node:test.
 */

export type RepeatMode = 'off' | 'queue' | 'one';

/** 'ended': the track finished on its own. 'user': Next button or lock screen. */
export type AdvanceReason = 'ended' | 'user';

export interface QueueNavigationState {
  queueLength: number;
  currentIndex: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  /** Indexes already played in the current shuffle cycle. */
  shufflePlayed: readonly number[];
}

export interface NextTrack {
  index: number;
  /** Every track was played: the caller starts a new shuffle cycle. */
  startsNewShuffleCycle: boolean;
}

export function cycleRepeatMode(mode: RepeatMode): RepeatMode {
  if (mode === 'off') return 'queue';
  if (mode === 'queue') return 'one';
  return 'off';
}

/**
 * Short message shown after a press on the repeat button. On a phone the
 * button's title never shows (no hover), so this is the only text telling
 * the listener which of the three modes is now active.
 */
export function getRepeatFeedback(mode: RepeatMode): string {
  if (mode === 'queue') return 'Répétition : toute la playlist';
  if (mode === 'one') return 'Répétition : ce morceau';
  return 'Répétition désactivée';
}

function pickRandom(candidates: number[], random: () => number): number {
  const position = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[Math.max(0, position)];
}

/**
 * Next track to play, or null when playback should stop (or Next is disabled).
 *
 * - repeat off: next track, stop after the last one;
 * - repeat queue: next track, back to the first after the last one;
 * - repeat one: the same track again, only when it ended on its own;
 * - shuffle: a random track not played yet in this cycle; once every track was
 *   played, stop (repeat off) or start a new cycle (repeat queue).
 */
export function getNextTrack(
  state: QueueNavigationState,
  reason: AdvanceReason,
  random: () => number = Math.random,
): NextTrack | null {
  const { queueLength, currentIndex, repeatMode, shuffle } = state;

  if (queueLength <= 0) return null;

  if (reason === 'ended' && repeatMode === 'one') {
    return { index: Math.max(0, Math.min(currentIndex, queueLength - 1)), startsNewShuffleCycle: false };
  }

  const loops = repeatMode === 'queue';

  if (shuffle) {
    const played = new Set(state.shufflePlayed);
    const all = Array.from({ length: queueLength }, (_, index) => index);
    const unplayed = all.filter((index) => index !== currentIndex && !played.has(index));

    if (unplayed.length > 0) {
      return { index: pickRandom(unplayed, random), startsNewShuffleCycle: false };
    }

    if (!loops) return null;

    const others = all.filter((index) => index !== currentIndex);
    return { index: others.length > 0 ? pickRandom(others, random) : 0, startsNewShuffleCycle: true };
  }

  if (currentIndex < queueLength - 1) {
    return { index: Math.max(0, currentIndex + 1), startsNewShuffleCycle: false };
  }

  return loops ? { index: 0, startsNewShuffleCycle: false } : null;
}

/**
 * Previous track: the last entry of the shuffle history first (the caller pops it),
 * then the track before in the queue.
 */
export function getPreviousIndex(
  state: Pick<QueueNavigationState, 'queueLength' | 'currentIndex' | 'shuffle'>,
  shuffleHistory: readonly number[],
): number | null {
  if (state.queueLength <= 0) return null;

  const lastShuffled = shuffleHistory[shuffleHistory.length - 1];

  if (state.shuffle && lastShuffled !== undefined && lastShuffled >= 0 && lastShuffled < state.queueLength) {
    return lastShuffled;
  }

  return state.currentIndex > 0 ? Math.min(state.currentIndex - 1, state.queueLength - 1) : null;
}
