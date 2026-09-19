import { Suspense, lazy } from "react";
import type { MinigameType } from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import type { DisplayReportHandlers } from "../../utils/displayReports";
import type { ClientRoute } from "../../utils/resolveClientRoute";
import * as styles from "./styles";

// Every route's content is loaded on demand, without exception — that single
// rule is what keeps the tablet from downloading the TV's board, the TV from
// downloading the host's panel and the config wizard, and the throwaway labs
// out of both. A route is fixed for the lifetime of the page (App reads
// `window.location.pathname` once; there is no client-side router), so exactly
// one of these loaders ever runs, once, during the first mount.
const HostControlPanel = lazy(() =>
  import("../HostControlPanel").then((module) => ({
    default: module.HostControlPanel
  }))
);

const AdminConfigWizard = lazy(() =>
  import("../AdminConfigWizard").then((module) => ({
    default: module.AdminConfigWizard
  }))
);

const DisplayBoard = lazy(() =>
  import("../DisplayBoard").then((module) => ({
    default: module.DisplayBoard
  }))
);

const RootRouteLanding = lazy(() =>
  import("../RootRouteLanding").then((module) => ({
    default: module.RootRouteLanding
  }))
);

const RouteNotFound = lazy(() =>
  import("../RouteNotFound").then((module) => ({
    default: module.RouteNotFound
  }))
);

const DevRouteIndex = lazy(() =>
  import("../DevRouteIndex").then((module) => ({
    default: module.DevRouteIndex
  }))
);

const MinigameDevSandbox = lazy(() =>
  import("../MinigameDevSandbox").then((module) => ({
    default: module.MinigameDevSandbox
  }))
);

const AnamorphLab = lazy(() =>
  import("../AnamorphLab").then((module) => ({
    default: module.AnamorphLab
  }))
);

const ContraptionLab = lazy(() =>
  import("../ContraptionLab").then((module) => ({
    default: module.ContraptionLab
  }))
);

const ContraptionUiLab = lazy(() =>
  import("../ContraptionUiLab").then((module) => ({
    default: module.ContraptionUiLab
  }))
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
  roomSocket: Socket<InboundSocketEvents, OutboundSocketEvents> | null;
  displayReports: DisplayReportHandlers | null;
};

const resolveRouteElement = ({
  route,
  devMinigameType,
  devLabName,
  roomSocket,
  displayReports
}: RouteContentProps): JSX.Element => {
  if (route === "HOST") {
    return <HostControlPanel />;
  }

  // The wizard talks to the server directly over `config:*` rather than through
  // room state, so it takes the socket instead of reading a context.
  if (route === "ADMIN") {
    return <AdminConfigWizard socket={roomSocket} />;
  }

  if (route === "DISPLAY") {
    // The board takes the reporter as a prop rather than reading a context,
    // because it is the only thing the display ever sends and a context for one
    // callback is more machinery than the callback.
    return <DisplayBoard onMusicTrackEnded={displayReports?.onMusicTrackEnded} />;
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
// happens at boot or never. Boundaries inside a route (the dev sandbox stage,
// the GEO maps) own their own Suspense and their own fallbacks.
export const RouteContent = (props: RouteContentProps): JSX.Element => {
  return (
    <Suspense fallback={<div className={styles.routeFallback} aria-hidden />}>
      {resolveRouteElement(props)}
    </Suspense>
  );
};
