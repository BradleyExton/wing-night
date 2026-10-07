import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ContestantMinigameHostView } from "@wingnight/shared";

import type { ContestantLegController } from "../../../utils/contestantLeg";
import { useContestantHostView } from "./index";

const VIEW = { minigame: "FAPPY" } as unknown as ContestantMinigameHostView;

const holding = (view: ContestantMinigameHostView | null): ContestantLegController => ({
  getHostView: () => view,
  subscribe: () => () => undefined,
  dispatch: () => undefined,
  forgetHostView: () => undefined,
  dispose: () => undefined
});

const Probe = ({
  controller,
  isHoldingLeg
}: {
  controller: ContestantLegController | null;
  isHoldingLeg: boolean;
}): JSX.Element => {
  const view = useContestantHostView(controller, isHoldingLeg);

  return <span data-view={view?.minigame ?? "none"} />;
};

test("does hand the phone its leg's view when the phone holds the leg", () => {
  assert.match(renderToStaticMarkup(<Probe controller={holding(VIEW)} isHoldingLeg />), /data-view="FAPPY"/);
});

test("does hand back no view when the leg is not this phone's, whatever it last held", () => {
  assert.match(renderToStaticMarkup(<Probe controller={holding(VIEW)} isHoldingLeg={false} />), /data-view="none"/);
  assert.match(renderToStaticMarkup(<Probe controller={null} isHoldingLeg />), /data-view="none"/);
});
