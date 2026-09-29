import { useEffect, useState, type ReactNode } from "react";

import * as styles from "./styles";

type TeaserPhoneFrameProps = {
  children: ReactNode;
};

// A host surface is drawn for the party's tablet, 1280×800 points, and a landscape phone has
// half the height. Laid out at the phone's own size the zone's chrome would crowd the street;
// scaled from the tablet's size the street would read but the chrome would be unreadable. So the
// surface is laid out on a canvas the phone's shape and at least this tall, and shrunk to fit —
// every game is judged against the same height it gets on the night, give or take.
export const PHONE_CANVAS_MIN_HEIGHT = 500;

type FrameGeometry = { width: number; height: number; scale: number };

const measure = (): FrameGeometry => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scale = Math.min(1, viewportHeight / PHONE_CANVAS_MIN_HEIGHT);

  return { width: viewportWidth / scale, height: viewportHeight / scale, scale };
};

export const TeaserPhoneFrame = ({ children }: TeaserPhoneFrameProps): JSX.Element => {
  const [geometry, setGeometry] = useState<FrameGeometry | null>(null);

  useEffect(() => {
    const fit = (): void => {
      setGeometry(measure());
    };

    fit();
    window.addEventListener("resize", fit);

    return (): void => {
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div className={styles.viewport}>
      {geometry !== null && (
        <div className={styles.canvas} ref={styles.applyCanvasGeometry(geometry)}>
          {children}
        </div>
      )}
    </div>
  );
};
