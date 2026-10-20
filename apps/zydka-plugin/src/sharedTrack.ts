/**
 * Pure helpers for shared track links (#track-<id>) and share texts.
 * No DOM access here so the behaviour can be covered by node:test.
 */

const TRACK_HASH_PREFIX = 'track-';

type TrackId = string | number | null | undefined;

function normalizeTrackId(id: TrackId): string {
  return id === null || id === undefined ? '' : String(id).trim();
}

/** Hash fragment (without '#') pointing at a track, or '' when the id is empty. */
export function getTrackHash(id: TrackId): string {
  const trackId = normalizeTrackId(id);
  return trackId ? TRACK_HASH_PREFIX + encodeURIComponent(trackId) : '';
}

/** Track id read from a location hash ('#track-90' → '90'), or null. */
export function parseTrackHash(hash: string | null | undefined): string | null {
  const fragment = (hash ?? '').replace(/^#/, '');

  if (!fragment.startsWith(TRACK_HASH_PREFIX)) return null;

  let trackId: string;

  try {
    trackId = decodeURIComponent(fragment.slice(TRACK_HASH_PREFIX.length));
  } catch {
    return null;
  }

  trackId = trackId.trim();
  return trackId || null;
}

/** Index of the track with this id ('90' matches the numeric id 90), or -1. */
export function findTrackIndex(queue: ReadonlyArray<{ id: TrackId }>, trackId: string | null): number {
  if (!trackId) return -1;
  return queue.findIndex((track) => normalizeTrackId(track.id) === trackId);
}

/** "Artist – Title", or just the title when the artist is unknown. */
export function getShareText(title: string | null | undefined, artist: string | null | undefined): string {
  const trackTitle = (title ?? '').trim();
  const trackArtist = (artist ?? '').trim();

  if (trackTitle && trackArtist) return `${trackArtist} – ${trackTitle}`;
  return trackTitle || trackArtist;
}
