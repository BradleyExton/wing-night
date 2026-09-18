import { useEffect, useRef, useState, type ReactNode } from "react";

import * as styles from "./styles";

type SandboxDeviceFrameProps = {
  // The frame's own classes carry its aspect ratio, which must match
  // deviceWidth:deviceHeight for the scaled device to fill it edge to edge.
  frameClassName: string;
  deviceWidth: number;
  deviceHeight: number;
  children: ReactNode;
};

// A preview stands in for a real screen, so the surface inside is laid out at
// that screen's CSS-pixel size and scaled to whatever width the card has. Every
// game then renders against the same canvas, and `h-full` means the same thing
// here as it does on the device.
export const SandboxDeviceFrame = ({
  frameClassName,
  deviceWidth,
  deviceHeight,
  children
}: SandboxDeviceFrameProps): JSX.Element => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;

    if (frame === null) {
      return;
    }

    const fit = (): void => {
      setScale(frame.clientWidth / deviceWidth);
    };

    fit();

    const observer = new ResizeObserver(fit);

    observer.observe(frame);

    return (): void => {
      observer.disconnect();
    };
  }, [deviceWidth]);

  return (
    <div ref={frameRef} className={frameClassName}>
      <div
        className={styles.device}
        ref={styles.applyDeviceGeometry({ width: deviceWidth, height: deviceHeight, scale })}
      >
        {children}
      </div>
    </div>
  );
};
