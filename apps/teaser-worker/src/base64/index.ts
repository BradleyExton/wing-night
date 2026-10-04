// Bytes to standard base64, for the ONE place the Worker encodes an image: Brad picking the style
// reference, once, on a head of a few hundred kilobytes. Every guest's request avoids encoding
// altogether. `Uint8Array.prototype.toBase64` (native, a fraction of a millisecond a megabyte) is
// in current V8 — workerd and Node 25 both — and the btoa fallback is only for a runtime without it.
type MaybeNativeBase64 = Uint8Array & { toBase64?: () => string };

const CHUNK_SIZE = 0x8000;

export const encodeBase64 = (bytes: Uint8Array): string => {
  const native = (bytes as MaybeNativeBase64).toBase64;

  if (typeof native === "function") {
    return native.call(bytes);
  }

  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK_SIZE));
  }

  return btoa(binary);
};
