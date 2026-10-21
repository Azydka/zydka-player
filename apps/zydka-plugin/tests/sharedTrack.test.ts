import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findTrackIndex, getShareText, getTrackHash, parseTrackHash } from '../src/sharedTrack.ts';

describe('getTrackHash / parseTrackHash', () => {
  it('round-trips numeric and text ids', () => {
    assert.equal(getTrackHash(90), 'track-90');
    assert.equal(parseTrackHash('#track-90'), '90');
    assert.equal(parseTrackHash(`#${getTrackHash("life's a bitch")}`), "life's a bitch");
    assert.equal(parseTrackHash(`#${getTrackHash('é/ü #1')}`), 'é/ü #1');
  });

  it('accepts a hash with or without the leading #', () => {
    assert.equal(parseTrackHash('track-new-york'), 'new-york');
  });

  it('ignores empty ids and unrelated hashes', () => {
    assert.equal(getTrackHash(''), '');
    assert.equal(getTrackHash('  '), '');
    assert.equal(getTrackHash(null), '');
    assert.equal(parseTrackHash(''), null);
    assert.equal(parseTrackHash('#'), null);
    assert.equal(parseTrackHash('#track-'), null);
    assert.equal(parseTrackHash('#track-%20'), null);
    assert.equal(parseTrackHash('#comments'), null);
    assert.equal(parseTrackHash(undefined), null);
  });

  it('ignores malformed percent-encoding', () => {
    assert.equal(parseTrackHash('#track-%E0%A4%A'), null);
  });
});

describe('findTrackIndex', () => {
  const queue = [{ id: 90 }, { id: 'new-york' }, { id: 92 }];

  it('matches numeric ids given as text', () => {
    assert.equal(findTrackIndex(queue, '92'), 2);
    assert.equal(findTrackIndex(queue, 'new-york'), 1);
  });

  it('returns -1 for unknown or missing ids', () => {
    assert.equal(findTrackIndex(queue, '404'), -1);
    assert.equal(findTrackIndex(queue, null), -1);
    assert.equal(findTrackIndex([], '90'), -1);
  });
});

describe('getShareText', () => {
  it('joins artist and title', () => {
    assert.equal(getShareText('Get Em Up', 'Anderson Paak'), 'Anderson Paak – Get Em Up');
  });

  it('falls back to whatever is known', () => {
    assert.equal(getShareText('Get Em Up', ''), 'Get Em Up');
    assert.equal(getShareText(' ', 'Anderson Paak'), 'Anderson Paak');
    assert.equal(getShareText(undefined, undefined), '');
  });
});
