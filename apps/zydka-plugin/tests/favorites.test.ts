import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getFavoriteKey, parseFavorites, serializeFavorites, toggleFavorite } from '../src/favorites.ts';

describe('getFavoriteKey', () => {
  it('uses the track id first', () => {
    assert.equal(getFavoriteKey({ id: 90, audioUrl: 'https://example.test/a.mp3' }), 'id:90');
    assert.equal(getFavoriteKey({ id: ' new-york ', audioUrl: '' }), 'id:new-york');
  });

  it('falls back to the audio URL when the id is empty', () => {
    assert.equal(getFavoriteKey({ id: '', audioUrl: 'https://example.test/a.mp3' }), 'url:https://example.test/a.mp3');
    assert.equal(getFavoriteKey({ id: null, audioUrl: ' https://example.test/b.mp3 ' }), 'url:https://example.test/b.mp3');
  });

  it('gives no key without an id or an audio URL', () => {
    assert.equal(getFavoriteKey({ id: '  ', audioUrl: '' }), null);
    assert.equal(getFavoriteKey(null), null);
    assert.equal(getFavoriteKey(undefined), null);
  });
});

describe('parseFavorites', () => {
  it('reads a stored array of keys', () => {
    assert.deepEqual([...parseFavorites('["id:90","url:https://example.test/a.mp3"]')], [
      'id:90',
      'url:https://example.test/a.mp3',
    ]);
  });

  it('starts empty on missing or invalid JSON', () => {
    assert.equal(parseFavorites(null).size, 0);
    assert.equal(parseFavorites('').size, 0);
    assert.equal(parseFavorites('{not json').size, 0);
  });

  it('starts empty when the JSON is not an array', () => {
    assert.equal(parseFavorites('{"id:90":true}').size, 0);
    assert.equal(parseFavorites('"id:90"').size, 0);
    assert.equal(parseFavorites('null').size, 0);
  });

  it('drops values that are not non-empty strings', () => {
    assert.deepEqual([...parseFavorites('["id:90",90,null,{},"",["id:91"],"id:92"]')], ['id:90', 'id:92']);
  });
});

describe('toggleFavorite', () => {
  it('adds a missing key', () => {
    const favorites = toggleFavorite(new Set(), 'id:90');
    assert.deepEqual([...favorites], ['id:90']);
  });

  it('removes a key already saved', () => {
    const favorites = toggleFavorite(new Set(['id:90', 'id:91']), 'id:90');
    assert.deepEqual([...favorites], ['id:91']);
  });

  it('never stores a key twice', () => {
    const favorites = toggleFavorite(parseFavorites('["id:90","id:90"]'), 'id:91');
    assert.equal(serializeFavorites(favorites), '["id:90","id:91"]');
  });
});
