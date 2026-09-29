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
