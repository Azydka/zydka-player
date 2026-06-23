const ID3_HEADER_BYTES = 10;
const MAX_ID3_TAG_BYTES = 4 * 1024 * 1024;

const embeddedCoverCache = new Map<string, Promise<string | null>>();
const blobCoverUrls = new Set<string>();

interface EmbeddedCover {
  mimeType: string;
  data: Uint8Array;
}

function isDevHost(): boolean {
  return (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  );
}

function warnMetadataCover(message: string, error?: unknown): void {
  if (!isDevHost()) return;
  console.warn(`[Zydka Player] ${message}`, error ?? '');
}

function readSynchsafeInteger(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 21) |
    (bytes[offset + 1] << 14) |
    (bytes[offset + 2] << 7) |
    bytes[offset + 3]
  );
}

function readUint24(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 16) | (bytes[offset + 1] << 8) | bytes[offset + 2];
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  let value = '';

  for (let index = offset; index < offset + length; index += 1) {
    value += String.fromCharCode(bytes[index]);
  }

  return value;
}

function findTerminator(bytes: Uint8Array, offset: number, encoding: number): number {
  if (encoding === 1 || encoding === 2) {
    for (let index = offset; index < bytes.length - 1; index += 2) {
      if (bytes[index] === 0 && bytes[index + 1] === 0) {
        return index + 2;
      }
    }

    return -1;
  }

  for (let index = offset; index < bytes.length; index += 1) {
    if (bytes[index] === 0) {
      return index + 1;
    }
  }

  return -1;
}

async function fetchByteRange(src: string, start: number, end: number): Promise<Uint8Array> {
  const response = await fetch(src, {
    headers: {
      Range: `bytes=${start}-${end}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Audio metadata fetch failed with ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

function parseApicFrame(frameData: Uint8Array): EmbeddedCover | null {
  if (frameData.length < 5) return null;

  const textEncoding = frameData[0];
  const mimeTerminator = frameData.indexOf(0, 1);

  if (mimeTerminator < 0 || mimeTerminator + 2 >= frameData.length) {
    return null;
  }

  const mimeType = readAscii(frameData, 1, mimeTerminator - 1).toLowerCase();
  const descriptionStart = mimeTerminator + 2;
  const imageStart = findTerminator(frameData, descriptionStart, textEncoding);

  if (imageStart < 0 || imageStart >= frameData.length) {
    return null;
  }

  return {
    mimeType: mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
    data: frameData.slice(imageStart),
  };
}

function parsePicFrame(frameData: Uint8Array): EmbeddedCover | null {
  if (frameData.length < 6) return null;

  const textEncoding = frameData[0];
  const imageFormat = readAscii(frameData, 1, 3).toLowerCase();
  const descriptionStart = 5;
  const imageStart = findTerminator(frameData, descriptionStart, textEncoding);

  if (imageStart < 0 || imageStart >= frameData.length) {
    return null;
  }

  return {
    mimeType: imageFormat === 'png' ? 'image/png' : 'image/jpeg',
    data: frameData.slice(imageStart),
  };
}

function getId3FrameSize(bytes: Uint8Array, offset: number, version: number): number {
  return version === 4 ? readSynchsafeInteger(bytes, offset) : readUint32(bytes, offset);
}

function parseId3Cover(bytes: Uint8Array): EmbeddedCover | null {
  if (bytes.length < ID3_HEADER_BYTES || readAscii(bytes, 0, 3) !== 'ID3') {
    return null;
  }

  const version = bytes[3];
  const flags = bytes[5];
  const tagSize = readSynchsafeInteger(bytes, 6);
  const tagEnd = Math.min(bytes.length, ID3_HEADER_BYTES + tagSize);
  let offset = ID3_HEADER_BYTES;

  if (flags & 0x40) {
    if (version === 3 && offset + 4 <= tagEnd) {
      offset += 4 + readUint32(bytes, offset);
    } else if (version === 4 && offset + 4 <= tagEnd) {
      offset += readSynchsafeInteger(bytes, offset);
    }
  }

  if (version === 2) {
    while (offset + 6 <= tagEnd) {
      const frameId = readAscii(bytes, offset, 3);
      const frameSize = readUint24(bytes, offset + 3);

      if (!frameId.trim() || frameSize <= 0 || offset + 6 + frameSize > tagEnd) {
        break;
      }

      if (frameId === 'PIC') {
        return parsePicFrame(bytes.slice(offset + 6, offset + 6 + frameSize));
      }

      offset += 6 + frameSize;
    }

    return null;
  }

  if (version !== 3 && version !== 4) {
    return null;
  }

  while (offset + 10 <= tagEnd) {
    const frameId = readAscii(bytes, offset, 4);
    const frameSize = getId3FrameSize(bytes, offset + 4, version);

    if (!frameId.trim() || frameSize <= 0 || offset + 10 + frameSize > tagEnd) {
      break;
    }

    if (frameId === 'APIC') {
      return parseApicFrame(bytes.slice(offset + 10, offset + 10 + frameSize));
    }

    offset += 10 + frameSize;
  }

  return null;
}

async function extractMp3CoverUrl(src: string): Promise<string | null> {
  const header = await fetchByteRange(src, 0, ID3_HEADER_BYTES - 1);

  if (header.length < ID3_HEADER_BYTES || readAscii(header, 0, 3) !== 'ID3') {
    return null;
  }

  const tagSize = readSynchsafeInteger(header, 6);
  const totalTagBytes = ID3_HEADER_BYTES + tagSize;

  if (tagSize <= 0 || totalTagBytes > MAX_ID3_TAG_BYTES) {
    warnMetadataCover('Embedded cover skipped: ID3 tag is empty or too large.');
    return null;
  }

  const tagBytes = await fetchByteRange(src, 0, totalTagBytes - 1);
  const cover = parseId3Cover(tagBytes);

  if (!cover || cover.data.length === 0) {
    return null;
  }

  const imageBuffer = new ArrayBuffer(cover.data.byteLength);
  new Uint8Array(imageBuffer).set(cover.data);

  const blobUrl = URL.createObjectURL(new Blob([imageBuffer], { type: cover.mimeType }));
  blobCoverUrls.add(blobUrl);

  return blobUrl;
}

export function getEmbeddedCoverUrl(src: string): Promise<string | null> {
  const normalizedSrc = src.trim();

  if (!normalizedSrc || typeof fetch !== 'function' || typeof URL === 'undefined') {
    return Promise.resolve(null);
  }

  const cachedCover = embeddedCoverCache.get(normalizedSrc);

  if (cachedCover) {
    return cachedCover;
  }

  const coverPromise = extractMp3CoverUrl(normalizedSrc).catch((error: unknown) => {
    warnMetadataCover('Embedded cover extraction failed; using fallback.', error);
    return null;
  });

  embeddedCoverCache.set(normalizedSrc, coverPromise);

  return coverPromise;
}

export function revokeEmbeddedCoverCache(): void {
  blobCoverUrls.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
  blobCoverUrls.clear();
  embeddedCoverCache.clear();
}