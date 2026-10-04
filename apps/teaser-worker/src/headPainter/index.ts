// Paints a guest's avatar head from their photo (milestone 2). `GEMINI_TRANSPORT` picks: "fake"
// in local dev and tests, which hands back a fixed picture and costs nothing; "gemini" will be
// the real model, which arrives with the avatar flow — until then it, and any unknown value,
// fails closed rather than pretending to paint.
export type HeadPhoto = {
  bytes: Uint8Array;
  mimeType: string;
};

export type HeadPainter = {
  paintHead(photo: HeadPhoto): Promise<HeadPhoto>;
};

export const GEMINI_TRANSPORTS = ["gemini", "fake"] as const;

// A 1×1 transparent PNG.
const FAKE_HEAD_PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="),
  (character) => character.charCodeAt(0)
);

export const createFakeHeadPainter = (): HeadPainter => ({
  paintHead: async () => ({ bytes: FAKE_HEAD_PNG, mimeType: "image/png" })
});

const createUnavailableHeadPainter = (reason: string): HeadPainter => ({
  paintHead: async () => {
    throw new Error(reason);
  }
});

export const resolveHeadPainter = (transport: string | undefined): HeadPainter => {
  switch (transport) {
    case "fake":
      return createFakeHeadPainter();
    case "gemini":
      return createUnavailableHeadPainter("The Gemini head painter is not wired yet (milestone 2).");
    default:
      return createUnavailableHeadPainter(
        `GEMINI_TRANSPORT ${JSON.stringify(transport)} is not one of ${GEMINI_TRANSPORTS.join(", ")}.`
      );
  }
};
