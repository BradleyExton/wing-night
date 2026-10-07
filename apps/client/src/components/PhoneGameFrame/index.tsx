import { useEffect, useState, type ReactNode } from "react";

import { phoneGameFrameCopy } from "./copy";
import * as styles from "./styles";

type PhoneGameFrameProps = {
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

// One arcade game on one phone, turned sideways: the teaser's solo phone (wingnight.tv) and a
// contestant's own phone at the party draw the game's host surface the same way. A runner wants
// the street left to right, so a phone held upright is asked to turn instead of being handed a
// street squeezed into a letterbox — the card covers the game until it does.
export const PhoneGameFrame = ({ children }: PhoneGameFrameProps): JSX.Element => {
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
    <>
      <div className={styles.viewport}>
        {geometry !== null && (
          <div className={styles.canvas} ref={styles.applyCanvasGeometry(geometry)}>
            {children}
          </div>
        )}
      </div>

      <div className={styles.rotate} data-phone-rotate>
        <p className={styles.rotateTitle}>{phoneGameFrameCopy.rotateTitle}</p>
        <p className={styles.rotateBody}>{phoneGameFrameCopy.rotateBody}</p>
        <p className={styles.rotateLockHint}>{phoneGameFrameCopy.rotateLockHint}</p>
      </div>
    </>
  );
};
