// The frame keeps its own aspect ratio (the caller's class), so it reserves
// exactly the scaled device's footprint; the device itself is laid out at its
// real CSS-pixel size and shrunk to fit with a transform, so what you see is
// the surface at the size the real device would render it, not a reflow.
export const device = "absolute left-0 top-0 origin-top-left overflow-hidden";

type DeviceGeometry = {
  width: number;
  height: number;
  scale: number;
};

// The device size is data (which screen this frame stands in for) and the scale
// tracks the frame's measured width, so neither can be a static utility class.
// Applied through a ref so the declaration lives here, not as an inline style prop.
export const applyDeviceGeometry =
  ({ width, height, scale }: DeviceGeometry) =>
  (element: HTMLDivElement | null): void => {
    if (element === null) {
      return;
    }

    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.transform = `scale(${scale})`;
  };
