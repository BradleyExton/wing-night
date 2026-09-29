import { useEffect, useMemo, useRef, useState } from "react";
import { wakeAudio } from "@wingnight/audio";
import type { SerializableValue } from "@wingnight/minigames-core";
import { schlonicRuntimePlugin } from "@wingnight/minigames-schlonic";
import { schlonicRendererBundle } from "@wingnight/minigames-schlonic/client";

import type { TeaserRoster } from "../../utils/parseTeaserRoster";
import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { useServerOrigin } from "../../utils/useServerOrigin";
import { TEASER_ROUTES } from "../TeaserApp/teaserRoutes";
import { teaserDunlopDashCopy } from "./copy";
import { TeaserDashFinish } from "./TeaserDashFinish";
import { TeaserPhoneFrame } from "./TeaserPhoneFrame";
import { TeaserTeamPicker } from "./TeaserTeamPicker";
import { TEASER_DASH_POINTS_MAX, TEASER_DASH_RULES } from "./teaserDashRules";
import { useBestTurnMemory } from "./useBestTurnMemory";
import * as styles from "./styles";

type TeaserDunlopDashProps = {
  roster: TeaserRoster;
};

const { HostSurface } = schlonicRendererBundle;

const readBestWings = (memory: SerializableValue | null): number | null => {
  const bestTurn =
    typeof memory === "object" && memory !== null && !Array.isArray(memory)
      ? memory.bestTurn
      : null;

  return typeof bestTurn === "object" && bestTurn !== null && !Array.isArray(bestTurn)
    ? typeof bestTurn.wings === "number"
      ? bestTurn.wings
      : null
    : null;
};

// Dunlop Dash on a phone, solo: the same pure runtime the party server drives, reduced in the
// page the way the dev sandbox does it, and the tablet's own surface as the screen — its zone is
// the whole street, not a tap pad, so the phone needs no TV. The round's memory (the best turn,
// whose legs ride as ghosts) is kept on the phone, so every run after the first is a race.
export const TeaserDunlopDash = ({ roster }: TeaserDunlopDashProps): JSX.Element => {
  const serverOrigin = useServerOrigin();
  const bestTurnMemory = useBestTurnMemory();
  const teamThemeByTeamId = useMemo(() => resolveTeamThemeById(roster.teams), [roster.teams]);
  const teamNameByTeamId = useMemo(
    () => new Map(roster.teams.map((team) => [team.id, team.name])),
    [roster.teams]
  );
  const [teamId, setTeamId] = useState<string | null>(null);
  const [runtimeState, setRuntimeState] = useState<SerializableValue | null>(null);
  // The best this phone had when the turn began, to tell a new best from an old one at the end.
  const startingBestRef = useRef<number | null>(null);

  // Always from a tap (the team picked, a rematch), which is the one moment a phone lets a page
  // start its audio: the street's first ollie lands long after the gesture that could unlock it.
  const startTurn = (nextTeamId: string): void => {
    const roundMemory = bestTurnMemory.load();

    wakeAudio();

    startingBestRef.current = readBestWings(roundMemory);
    setTeamId(nextTeamId);
    setRuntimeState(
      schlonicRuntimePlugin.initialize({
        teamIds: roster.teams.map((team) => team.id),
        players: roster.players,
        teams: roster.teams,
        activeRoundTeamId: nextTeamId,
        pointsMax: TEASER_DASH_POINTS_MAX,
        pendingPointsByTeamId: {},
        rules: TEASER_DASH_RULES,
        content: null,
        roundMemory
      })
    );
  };

  const selectorInput =
    runtimeState === null ? null : { state: runtimeState, rules: TEASER_DASH_RULES, content: null };
  const hostView = selectorInput === null ? null : schlonicRuntimePlugin.selectHostView(selectorInput);
  const schlonicView = hostView?.minigame === "SCHLONIC" ? hostView : null;
  const isFinished = schlonicView?.phase === "finished";
  const roundMemory =
    selectorInput === null ? null : (schlonicRuntimePlugin.selectRoundMemory?.(selectorInput) ?? null);
  const bestWings = readBestWings(roundMemory);

  useEffect(() => {
    if (isFinished) {
      bestTurnMemory.save(roundMemory);
    }
  }, [isFinished, roundMemory, bestTurnMemory]);

  const handleDispatchAction = (actionType: string, actionPayload: SerializableValue): void => {
    setRuntimeState((previousState) =>
      previousState === null
        ? previousState
        : schlonicRuntimePlugin.reduceAction({
            state: previousState,
            // The page is its own server, so it stamps receipt the way the real one does.
            envelope: { actionType, actionPayload, receivedAtMs: Date.now() },
            pointsMax: TEASER_DASH_POINTS_MAX,
            rules: TEASER_DASH_RULES,
            content: null
          }).state
    );
  };

  const rail = (
    <a className={styles.rail} href={TEASER_ROUTES.home}>
      <span className={styles.railBack} aria-hidden />
      <span className={styles.railBrand}>{teaserDunlopDashCopy.backLabel}</span>
      <span className={styles.railTitle}>{teaserDunlopDashCopy.title}</span>
    </a>
  );

  return (
    <>
      <TeaserPhoneFrame>
        {runtimeState !== null && (
          <HostSurface
            phase="play"
            minigameType="SCHLONIC"
            minigameHostView={hostView}
            activeTeamName={teamId === null ? null : (teamNameByTeamId.get(teamId) ?? null)}
            teamNameByTeamId={teamNameByTeamId}
            rail={rail}
            clock={null}
            canDispatchAction
            onDispatchAction={handleDispatchAction}
            serverOrigin={serverOrigin}
            solo
          />
        )}
      </TeaserPhoneFrame>

      {teamId === null && (
        <TeaserTeamPicker
          kicker={teaserDunlopDashCopy.pickerKicker}
          title={teaserDunlopDashCopy.pickerTitle}
          body={teaserDunlopDashCopy.pickerBody}
          players={roster.players}
          teams={roster.teams}
          teamThemeByTeamId={teamThemeByTeamId}
          serverOrigin={serverOrigin}
          onPick={startTurn}
        />
      )}

      {isFinished && teamId !== null && (
        <TeaserDashFinish
          kicker={teaserDunlopDashCopy.finishKicker}
          wingsLabel={teaserDunlopDashCopy.finishWings(schlonicView.wingsBanked)}
          bestLabel={bestWings === null ? null : teaserDunlopDashCopy.finishBest(bestWings)}
          newBestLabel={
            bestWings !== null &&
            bestWings === schlonicView.wingsBanked &&
            (startingBestRef.current === null || bestWings > startingBestRef.current)
              ? teaserDunlopDashCopy.finishNewBest
              : null
          }
          runAgainLabel={teaserDunlopDashCopy.runAgainLabel}
          switchTeamLabel={teaserDunlopDashCopy.switchTeamLabel}
          homeLabel={teaserDunlopDashCopy.homeLabel}
          homeHref={TEASER_ROUTES.home}
          onRunAgain={(): void => {
            startTurn(teamId);
          }}
          onSwitchTeam={(): void => {
            setTeamId(null);
            setRuntimeState(null);
          }}
        />
      )}

      <div className={styles.rotate}>
        <p className={styles.rotateTitle}>{teaserDunlopDashCopy.rotateTitle}</p>
        <p className={styles.rotateBody}>{teaserDunlopDashCopy.rotateBody}</p>
      </div>
    </>
  );
};
