import type { RelayedPadState } from "../../link";
import type { StickDir } from "../../yardSim";

// PROTOTYPE — throwaway. A pad made of the laptop's own keys, so the yard can be run with no
// phone in reach: arrows or WASD, Space to jump. It speaks the pads' own message, so everything
// downstream (the added-lag knob included) treats it as one more pad.
export const KEYBOARD_PAD_ID = "keyboard";

const STICK_KEYS: Record<string, { x: number; y: number }> = {
  arrowleft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
  arrowright: { x: 1, y: 0 },
  d: { x: 1, y: 0 },
  arrowup: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  arrowdown: { x: 0, y: 1 },
  s: { x: 0, y: 1 }
};

// Indexed [y + 1][x + 1]: the eight directions clockwise from right, 0 at rest.
const DIR_BY_AXES: readonly (readonly StickDir[])[] = [
  [6, 7, 8],
  [5, 0, 1],
  [4, 3, 2]
];

const JUMP_KEY = " ";
const PANEL_KEY = "h";

type KeyboardPadOptions = {
  onState: (state: RelayedPadState) => void;
  onTogglePanel: () => void;
};

export const wireKeyboardPad = ({ onState, onTogglePanel }: KeyboardPadOptions): (() => void) => {
  const keys = new Set<string>();
  let seq = 0;
  let jumps = 0;

  const send = (): void => {
    let x = 0;
    let y = 0;

    for (const key of keys) {
      x += STICK_KEYS[key]?.x ?? 0;
      y += STICK_KEYS[key]?.y ?? 0;
    }

    seq += 1;
    onState({
      padId: KEYBOARD_PAD_ID,
      seq,
      dir: DIR_BY_AXES[Math.sign(y) + 1]?.[Math.sign(x) + 1] ?? 0,
      jumpSeq: jumps,
      sentAt: performance.now(),
      rttMs: null
    });
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    if (event.repeat) {
      return;
    }

    if (key === PANEL_KEY) {
      onTogglePanel();

      return;
    }

    if (key !== JUMP_KEY && STICK_KEYS[key] === undefined) {
      return;
    }

    // Arrows would otherwise nudge a focused slider, and Space would click a focused button.
    event.preventDefault();

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    keys.add(key);

    if (key === JUMP_KEY) {
      jumps += 1;
    }

    send();
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (keys.delete(event.key.toLowerCase())) {
      send();
    }
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return (): void => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
};
