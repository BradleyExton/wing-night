import { CONTESTANT_CONTROLLERS, type ContestantTurn } from "@wingnight/shared";

import { resolveLegHandset } from "../../../../utils/resolveContestantHandset";
import { ContestantPhoneMonitor } from "../../ContestantPhoneMonitor";
import { HostMiniRail } from "../../HostMiniRail";
import { MinigameSurface } from "../../MinigameSurface";
import { useMinigameHostContext } from "../../useMinigameHostContext";
import { TakeoverTimerChip } from "./TakeoverTimerChip";
import * as styles from "./styles";

// A contestant's phone is the leg's one log writer while it holds it — and while it has dropped
// it, until the host takes it back. Either way the tablet must not mount the game's runner, which
// could act and so settle the run: it watches instead.
const isPhoneLeg = (turn: ContestantTurn | null): turn is ContestantTurn => {
  return turn !== null && (turn.controller === CONTESTANT_CONTROLLERS.PHONE || turn.droppedPlayerId !== null);
};

// The shell stops rendering the control deck at MINIGAME_PLAY. It does not
// stop rendering the room's context (docs/takeover-layout-api.md §1): the
// rail that says which round, which sauce and whose turn it is, and the play
// clock, are the shell's to own on every phase, this one included.
//
// It hands both down rather than drawing them itself, because where they land
// is the layout's decision and the layout is the game's: a `<TakeoverStage>`
// gives them a row of their own above the body, a `<TakeoverCanvas>` floats
// them over it. Neither is something this component can choose from out here.
export const MinigamePlayTakeover = (): JSX.Element => {
  const {
    roomState,
    teamNameByTeamId,
    minigameType,
    minigameHostView,
    activeTeamName,
    canDispatchMinigameAction,
    handleDispatchMinigameAction
  } = useMinigameHostContext("minigame_play");
  const contestantTurn = roomState?.contestantTurn ?? null;

  return (
    <div className={styles.container}>
      {isPhoneLeg(contestantTurn) ? (
        <ContestantPhoneMonitor turn={contestantTurn} activeTeamName={activeTeamName} />
      ) : (
        <MinigameSurface
          phase="play"
          minigameType={minigameType}
          minigameHostView={minigameHostView}
          activeTeamName={activeTeamName}
          teamNameByTeamId={teamNameByTeamId}
          rail={<HostMiniRail />}
          clock={<TakeoverTimerChip />}
          canDispatchAction={canDispatchMinigameAction}
          onDispatchAction={handleDispatchMinigameAction}
          handset={resolveLegHandset(contestantTurn)}
        />
      )}
    </div>
  );
};
