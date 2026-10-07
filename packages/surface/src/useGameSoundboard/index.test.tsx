import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SilentSurface } from "../SilentSurface/index.js";
import type { SfxTakeUrls } from "../useSfxTakes/index.js";
import { createGameSoundboardSlot, useGameSoundboard, type GameSoundboardFactory } from "./index.js";

type Cue = "flap" | "crash";

// A factory that remembers every board it made and every cue each one played.
const createFakeFactory = (): {
  createBoard: GameSoundboardFactory<Cue>;
  boards: { takes: SfxTakeUrls | null; played: [Cue, number | undefined][] }[];
} => {
  const boards: { takes: SfxTakeUrls | null; played: [Cue, number | undefined][] }[] = [];

  return {
    boards,
    createBoard: (options) => {
      const board = { takes: options?.takes ?? null, played: [] as [Cue, number | undefined][] };

      boards.push(board);

      return {
        play: (cue, intensity): void => {
          board.played.push([cue, intensity]);
        }
      };
    }
  };
};

// Plays its cues during render: a static render runs no effects, so this is
// the hook's first render exactly, before any take listing could land.
const Probe = ({
  createBoard,
  cues,
  isSpeaker
}: {
  createBoard: GameSoundboardFactory<Cue>;
  cues: readonly Cue[];
  isSpeaker?: boolean;
}): null => {
  const play = useGameSoundboard({ createBoard, takesUrl: null, isSpeaker });

  for (const cue of cues) {
    play(cue);
  }

  return null;
};

test("does play nothing and build no board when the surface is not the speaker", () => {
  const factory = createFakeFactory();

  renderToStaticMarkup(<Probe createBoard={factory.createBoard} cues={["flap", "crash"]} isSpeaker={false} />);

  assert.equal(factory.boards.length, 0);
});

test("does build no board when the surface is only looked at", () => {
  const factory = createFakeFactory();

  renderToStaticMarkup(<Probe createBoard={factory.createBoard} cues={[]} />);

  assert.equal(factory.boards.length, 0);
});

test("does build the board once on the first cue when later cues follow", () => {
  const factory = createFakeFactory();

  renderToStaticMarkup(<Probe createBoard={factory.createBoard} cues={["flap", "crash", "flap"]} />);

  assert.equal(factory.boards.length, 1);
  assert.deepEqual(factory.boards[0]?.played, [
    ["flap", undefined],
    ["crash", undefined],
    ["flap", undefined]
  ]);
});

test("does pass the intensity through when a cue carries one", () => {
  const factory = createFakeFactory();
  const slot = createGameSoundboardSlot(factory.createBoard);

  slot.play("crash", 0.4);

  assert.deepEqual(factory.boards[0]?.played, [["crash", 0.4]]);
});

test("does rebuild the board with the takes when they arrive", () => {
  const factory = createFakeFactory();
  const slot = createGameSoundboardSlot(factory.createBoard);
  const takes = { crash: ["http://tv:3000/content-assets/sfx/fappy/crash-1.mp3"] };

  slot.play("flap");
  slot.setTakes(takes);
  slot.play("crash");

  assert.equal(factory.boards.length, 2);
  assert.equal(factory.boards[0]?.takes, null);
  assert.equal(factory.boards[1]?.takes, takes);
  assert.deepEqual(factory.boards[1]?.played, [["crash", undefined]]);
});

test("does leave the board to the first cue when the listing has no takes", () => {
  const factory = createFakeFactory();
  const slot = createGameSoundboardSlot(factory.createBoard);

  slot.setTakes({});

  assert.equal(factory.boards.length, 0);

  slot.play("flap");

  assert.equal(factory.boards.length, 1);
  assert.equal(factory.boards[0]?.takes, null);
});

test("does play nothing and build no board when the surface is a silent mirror of the TV", () => {
  const factory = createFakeFactory();

  renderToStaticMarkup(
    <SilentSurface>
      <Probe createBoard={factory.createBoard} cues={["flap", "crash"]} />
    </SilentSurface>
  );

  assert.equal(factory.boards.length, 0);
});
