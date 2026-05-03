const previewCache = new Map();

const hashText = (text) => {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const writeString = (view, offset, text) => {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
};

const toBase64 = (bytes) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

// Commercial tracks cannot be bundled in this lab project, and the royalty-free
// URLs are reused. This synthesizes a unique short preview for every song so
// clicking different songs always produces different audio.
export const createSongPreviewUrl = (song) => {
  const cacheKey = String(song.id || `${song.title}-${song.artist}`);
  if (previewCache.has(cacheKey)) return previewCache.get(cacheKey);

  const seed = hashText(`${song.title}-${song.artist}-${song.album}-${cacheKey}`);
  const sampleRate = 22050;
  const seconds = 14;
  const totalSamples = sampleRate * seconds;
  const headerBytes = 44;
  const dataBytes = totalSamples * 2;
  const buffer = new ArrayBuffer(headerBytes + dataBytes);
  const view = new DataView(buffer);
  const scale = [0, 2, 4, 7, 9, 12, 14, 16];
  const baseFrequency = 174 + (seed % 5) * 21;
  const beatEvery = 0.36 + ((seed >>> 4) % 5) * 0.035;

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  for (let index = 0; index < totalSamples; index += 1) {
    const time = index / sampleRate;
    const noteIndex = Math.floor(time / beatEvery);
    const semitone = scale[(noteIndex + (seed % scale.length)) % scale.length] + 12 * ((seed >>> (noteIndex % 8)) & 1);
    const frequency = baseFrequency * 2 ** (semitone / 12);
    const beatPhase = (time % beatEvery) / beatEvery;
    const envelope = Math.max(0.1, 1 - beatPhase) * Math.min(1, beatPhase * 10);
    const melody = Math.sin(2 * Math.PI * frequency * time);
    const harmony = Math.sin(2 * Math.PI * frequency * 1.5 * time) * 0.28;
    const pulse = Math.sin(2 * Math.PI * (2 + (seed % 3)) * time) * 0.08;
    const sample = Math.max(-1, Math.min(1, (melody + harmony + pulse) * envelope * 0.32));
    view.setInt16(headerBytes + index * 2, sample * 32767, true);
  }

  const url = `data:audio/wav;base64,${toBase64(new Uint8Array(buffer))}`;
  previewCache.set(cacheKey, url);
  return url;
};
