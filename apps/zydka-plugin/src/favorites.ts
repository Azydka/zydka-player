/**
 * Pure helpers for local favorites (one browser, no account, no server).
 * localStorage access stays in the UI so this file can be covered by node:test.
 */

export const FAVORITES_STORAGE_KEY = 'zydka-player:favorites:v1';

type FavoriteTrack = { id?: string | number | null; audioUrl?: string | null } | null | undefined;

/** "id:<id>", else "url:<audioUrl>", else null. Never the title: titles are not unique. */
export function getFavoriteKey(track: FavoriteTrack): string | null {
  const id = track?.id === null || track?.id === undefined ? '' : String(track.id).trim();
  if (id) return `id:${id}`;

  const audioUrl = (track?.audioUrl ?? '').trim();
  return audioUrl ? `url:${audioUrl}` : null;
}

/** Stored value → set of keys. Anything unreadable gives an empty set. */
export function parseFavorites(raw: string | null | undefined): Set<string> {
  if (!raw) return new Set();

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Set();
  }

  if (!Array.isArray(parsed)) return new Set();
  return new Set(parsed.filter((value): value is string => typeof value === 'string' && value !== ''));
}

export function serializeFavorites(favorites: ReadonlySet<string>): string {
  return JSON.stringify(Array.from(favorites));
}

/** New set with the key added, or removed if it was already there. */
export function toggleFavorite(favorites: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(favorites);

  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }

  return next;
}
