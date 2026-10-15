import { Suspense, lazy } from "react";
import type { MinigameType } from "@wingnight/shared";

import type { createRoomSocket } from "../../socket/createRoomSocket";
import type { ContestantLegController } from "../../utils/contestantLeg";
import type { DisplayReportHandlers } from "../../utils/displayReports";
import type { PhoneAnswerCardController } from "../../utils/phoneAnswerCard";
import type { PlayerSeatController } from "../../utils/playerSeat";
import type { ClientRoute } from "../../utils/resolveClientRoute";
import type { SpectatorBetSlipController } from "../../utils/spectatorBetSlip";
import * as styles from "./styles";

// Every route's content is loaded on demand, without exception — that single
// rule is what keeps the TV from downloading the host's deck and the config
// wizard, the tablet from downloading the TV's board, a guest's phone from
// downloading either, and the dev sandbox and the throwaway labs out of all of
// them. A route is fixed for the lifetime of the page (App reads
// `window.location.pathname` once; there is no client-side router), so exactly
// one of these loaders ever runs, once, during the first mount.
const HostControlPanel = lazy(() =>
  import("../HostControlPanel").then((module) => ({ default: module.HostControlPanel }))
);

const AdminConfigWizard = lazy(() =>
  import("../AdminConfigWizard").then((module) => ({ default: module.AdminConfigWizard }))
);

const QuickPlayLauncher = lazy(() =>
  import("../QuickPlayLauncher").then((module) => ({ default: module.QuickPlayLauncher }))
);

const DisplayBoard = lazy(() =>
  import("../DisplayBoard").then((module) => ({ default: module.DisplayBoard }))
);

const PlayerPhone = lazy(() =>
  import("../PlayerPhone").then((module) => ({ default: module.PlayerPhone }))
);

const RootRouteLanding = lazy(() =>
  import("../RootRouteLanding").then((module) => ({ default: module.RootRouteLanding }))
);

const RouteNotFound = lazy(() =>
  import("../RouteNotFound").then((module) => ({ default: module.RouteNotFound }))
);

const DevRouteIndex = lazy(() =>
  import("../DevRouteIndex").then((module) => ({ default: module.DevRouteIndex }))
);

const MinigameDevSandbox = lazy(() =>
  import("../MinigameDevSandbox").then((module) => ({ default: module.MinigameDevSandbox }))
);

const AnamorphLab = lazy(() =>
  import("../AnamorphLab").then((module) => ({ default: module.AnamorphLab }))
);

const ContraptionLab = lazy(() =>
  import("../ContraptionLab").then((module) => ({ default: module.ContraptionLab }))
);

const ContraptionUiLab = lazy(() =>
  import("../ContraptionUiLab").then((module) => ({ default: module.ContraptionUiLab }))
);

// Throwaway — deleted along with the lab when the ANAMORPH minigame ships
// (BACKLOG.md § Minigames).
const ANAMORPH_LAB_NAME = "anamorph";

// Throwaway — deleted along with the lab when the CONTRAPTION minigame ships.
const CONTRAPTION_LAB_NAME = "contraption";

// Throwaway — deleted along with the prototype when CONTRAPTION ships.
const CONTRAPTION_UI_LAB_NAME = "contraption-ui";

type RouteContentProps = {
  route: ClientRoute;
  devMinigameType: MinigameType | null;
  devLabName: string | null;
  roomSocket: ReturnType<typeof createRoomSocket> | null;
  displayReports: DisplayReportHandlers | null;
  playerSeat: PlayerSeatController | null;
  contestantLeg: ContestantLegController | null;
  betSlip: SpectatorBetSlipController | null;
  answerCard: PhoneAnswerCardController | null;
};

const resolveRouteElement = ({
  route,
  devMinigameType,
  devLabName,
  roomSocket,
  displayReports,
  playerSeat,
  contestantLeg,
  betSlip,
  answerCard
}: RouteContentProps): JSX.Element => {
  if (route === "HOST") {
    return <HostControlPanel />;
  }

  // The wizard talks to the server directly over `config:*` rather than through
  // room state, so it takes the socket instead of reading a context.
  if (route === "ADMIN") {
    return <AdminConfigWizard socket={roomSocket} />;
  }

  // The launcher is a host surface on another path: same room state, same
  // request handlers, one extra event.
  if (route === "QUICKPLAY") {
    return <QuickPlayLauncher />;
  }

  if (route === "DISPLAY") {
    // The board takes the reporter as a prop rather than reading a context,
    // because it is the only thing the display ever sends and a context for one
    // callback is more machinery than the callback.
    return <DisplayBoard onMusicTrackEnded={displayReports?.onMusicTrackEnded} />;
  }

  // A guest's phone. Its seat (which face is this phone's) is its own, held
  // beside room state rather than in it, so it rides in as a prop — and so
  // does its leg of an arcade relay, whose host view only this phone is sent,
  // its own side bet, whose pick only this phone is told, and its own answer
  // card while its team plays a game the phones answer.
  if (route === "PLAY") {
    return (
      <PlayerPhone seat={playerSeat} contestantLeg={contestantLeg} betSlip={betSlip} answerCard={answerCard} />
    );
  }

  if (route === "ROOT") {
    return <RootRouteLanding />;
  }

  if (route === "DEV_INDEX") {
    return <DevRouteIndex />;
  }

  if (route === "DEV_MINIGAME" && devMinigameType !== null) {
    return <MinigameDevSandbox minigameType={devMinigameType} />;
  }

  if (route === "DEV_LAB" && devLabName === ANAMORPH_LAB_NAME) {
    return <AnamorphLab />;
  }

  if (route === "DEV_LAB" && devLabName === CONTRAPTION_LAB_NAME) {
    return <ContraptionLab />;
  }

  if (route === "DEV_LAB" && devLabName === CONTRAPTION_UI_LAB_NAME) {
    return <ContraptionUiLab />;
  }

  return <RouteNotFound />;
};

// One boundary around the whole route, deliberately: it is the only place a
// route's chunk can suspend, and it resolves once, on the first mount, before a
// room-state snapshot has even arrived. Nothing below it loads on a phase
// change, so the fallback cannot return mid-party — the TV's blank instant
// happens at boot or never.
export const RouteContent = (props: RouteContentProps): JSX.Element => {
  return (
    <Suspense fallback={<div className={styles.routeFallback} aria-hidden />}>
      {resolveRouteElement(props)}
    </Suspense>
  );
};
