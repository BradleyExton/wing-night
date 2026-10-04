// The Gemini request for a head, built as a stream: the shared template's text segments with the
// stored photo's base64 (and the style reference's, when there is one) poured in between, straight
// from R2. The images are never read into the Worker as a whole, let alone parsed or re-encoded —
// they are base64 text in R2 already, and base64 needs no escaping inside a JSON string.
import { buildHeadRequestTemplate } from "@wingnight/avatar-head";

import type { HeadPaintRequest } from "../headPainter/index.ts";

// A picture stored as its base64 text: the R2 object's stream and size.
export type StoredBase64Image = {
  mimeType: string;
  body: ReadableStream<Uint8Array>;
  byteLength: number;
};

type BodyPart = Uint8Array | ReadableStream<Uint8Array>;

// The parts end to end, each stream read only once the part before it is done.
export const concatenateParts = (parts: readonly BodyPart[]): ReadableStream<Uint8Array> => {
  let index = 0;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  return new ReadableStream<Uint8Array>({
    pull: async (controller) => {
      while (index < parts.length) {
        const part = parts[index];

        if (part instanceof Uint8Array) {
          index += 1;
          controller.enqueue(part);
          return;
        }

        reader ??= part.getReader();

        const { done, value } = await reader.read();

        if (!done) {
          controller.enqueue(value);
          return;
        }

        reader = null;
        index += 1;
      }

      controller.close();
    },
    cancel: async (reason) => {
      const unread = parts.slice(reader === null ? index : index + 1);

      await reader?.cancel(reason);

      for (const part of unread) {
        if (!(part instanceof Uint8Array)) {
          await part.cancel(reason);
        }
      }
    }
  });
};

export const composeHeadRequestBody = ({
  photo,
  styleReference
}: {
  photo: StoredBase64Image;
  styleReference: StoredBase64Image | null;
}): HeadPaintRequest => {
  const encoder = new TextEncoder();
  const segments = buildHeadRequestTemplate({
    photoMimeType: photo.mimeType,
    styleReferenceMimeType: styleReference?.mimeType ?? null
  }).map((segment) => encoder.encode(segment));
  const images = styleReference === null ? [photo] : [photo, styleReference];
  const parts: BodyPart[] = [];
  let byteLength = 0;

  for (const [index, segment] of segments.entries()) {
    parts.push(segment);
    byteLength += segment.byteLength;

    const image = images[index];

    if (image !== undefined) {
      parts.push(image.body);
      byteLength += image.byteLength;
    }
  }

  return { body: concatenateParts(parts), byteLength };
};
