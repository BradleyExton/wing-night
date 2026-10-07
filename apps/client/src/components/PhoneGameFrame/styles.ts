// The whole screen, and nothing in it scrolls, zooms or selects: a tap on the street is a jump,
// and a double tap must not zoom the page out from under the bird.
export const viewport =
  "fixed inset-0 overflow-hidden bg-bg [touch-action:none] select-none [-webkit-touch-callout:none] [-webkit-user-select:none] overscroll-none";

export const canvas = "absolute left-0 top-0 origin-top-left overflow-hidden";

type CanvasGeometry = {
  width: number;
  height: number;
  scale: number;
};

// The canvas size follows the phone, so neither it nor the scale can be a static utility class.
// Applied through a ref so the declaration lives here, not as an inline style prop.
export const applyCanvasGeometry =
  ({ width, height, scale }: CanvasGeometry) =>
  (element: HTMLDivElement | null): void => {
    if (element === null) {
      return;
    }

    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.transform = `scale(${scale})`;
  };

// A runner wants the street left to right, so a phone held upright gets asked to turn instead
// of a street squeezed into a letterbox. Above anything a game or its shell lays over the canvas.
export const rotate =
  "fixed inset-0 z-40 hidden flex-col items-center justify-center gap-2 bg-bg px-8 text-center portrait:flex";

export const rotateTitle = "m-0 text-2xl font-black uppercase leading-tight text-text";

export const rotateBody = "m-0 font-voice text-lg italic text-mutedWarm";

// A phone with rotation lock on never turns, so without this the card is a dead end.
export const rotateLockHint = "m-0 mt-4 text-sm text-mutedWarm/80";
