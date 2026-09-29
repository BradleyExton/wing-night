import { useEffect, useMemo, useRef, useState } from "react";
import { wakeAudio } from "@wingnight/audio";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { TeaserRoster } from "../../utils/parseTeaserRoster";
import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { useServerOrigin } from "../../utils/useServerOrigin";
import { TEASER_ROUTES } from "../TeaserApp/teaserRoutes";
import { teaserSoloGameCopy } from "./copy";
import { TeaserPhoneFrame } from "./TeaserPhoneFrame";
import { TeaserSoloFinish } from "./TeaserSoloFinish";
import { TeaserTeamPicker } from "./TeaserTeamPicker";
import { TEASER_POINTS_MAX, type TeaserGame } from "./teaserGames";
import { useTeaserGameMemory } from "./useTeaserGameMemory";
import * as styles from "./styles";

type TeaserSoloGameProps = {
  game: TeaserGame;
  roster: TeaserRoster;
};

// One minigame on a phone, alone: the same pure runtime the party server drives, reduced in the
// page the way the dev sandbox does it, with the tablet's own surface as the screen — each game
// the teaser offers draws its whole scene there, not just a button, so the phone needs no TV.
// `solo` tells the surface it is the room: its own speaker, with no host controls. What the host
// would do instead — pick the team, read out the result, run it again — is this shell.
export const TeaserSoloGame = ({ game, roster }: TeaserSoloGameProps): JSX.Element => {
  const { HostSurface, runtimePlugin, rules } = game;
  const serverOrigin = useServerOrigin();
  const memory = useTeaserGameMemory(game.slug);
  const teamThemeByTeamId = useMemo(() => resolveTeamThemeById(roster.teams), [roster.teams]);
  const teamNameByTeamId = useMemo(
    () => new Map(roster.teams.map((team) => [team.id, team.name])),
    [roster.teams]
  );
  const [teamId, setTeamId] = useState<string | null>(null);
  const [runtimeState, setRuntimeState] = useState<SerializableValue | null>(null);
  // The phone's best when the turn began, so the end card can tell a new best from an old one.
  const startingBestRef = useRef<number | null>(null);
  const [best, setBest] = useState<number | null>(null);

  // Always from a tap (the team picked, a rematch), which is the one moment a phone lets a page
  // start its audio: the game's first sound lands long after the gesture that could unlock it.
  const startTurn = (nextTeamId: string): void => {
    const record = memory.load();

    wakeAudio();
    startingBestRef.current = record.best;
    setBest(record.best);
    setTeamId(nextTeamId);
    setRuntimeState(
      runtimePlugin.initialize({
        teamIds: roster.teams.map((team) => team.id),
        players: roster.players,
        teams: roster.teams,
        activeRoundTeamId: nextTeamId,
        pointsMax: TEASER_POINTS_MAX,
        pendingPointsByTeamId: {},
        rules,
        content: null,
        roundMemory: record.roundMemory
      })
    );
  };

  const selectorInput = runtimeState === null ? null : { state: runtimeState, rules, content: null };
  const hostView = selectorInput === null ? null : runtimePlugin.selectHostView(selectorInput);
  const outcome = hostView === null ? null : game.resolveOutcome(hostView);
  const isOver = outcome !== null;
  const result = outcome?.result ?? null;

  // Once per finished turn — the state stops changing when the turn is over, so it is the key: fold
  // the result into the phone's best and keep what the round remembers.
  const savedStateRef = useRef<SerializableValue | null>(null);

  useEffect(() => {
    if (!isOver || runtimeState === null || savedStateRef.current === runtimeState) {
      return;
    }

    savedStateRef.current = runtimeState;

    const record = memory.load();
    const nextBest =
      result === null || (record.best !== null && !game.beats(result, record.best)) ? record.best : result;
    const roundMemory =
      runtimePlugin.selectRoundMemory?.({ state: runtimeState, rules, content: null }) ?? null;

    memory.save({ best: nextBest, roundMemory });
    setBest(nextBest);
  }, [isOver, runtimeState, result, memory, game, runtimePlugin, rules]);

  const handleDispatchAction = (actionType: string, actionPayload: SerializableValue): void => {
    setRuntimeState((previousState) =>
      previousState === null
        ? previousState
        : runtimePlugin.reduceAction({
            state: previousState,
            // The page is its own server, so it stamps receipt the way the real one does.
            envelope: { actionType, actionPayload, receivedAtMs: Date.now() },
            pointsMax: TEASER_POINTS_MAX,
            rules,
            content: null
          }).state
    );
  };

  const isNewBest =
    result !== null &&
    (startingBestRef.current === null || game.beats(result, startingBestRef.current));

  return (
    <>
      <TeaserPhoneFrame>
        {runtimeState !== null && (
          <HostSurface
            phase="play"
            minigameType={game.minigameType}
            minigameHostView={hostView}
            activeTeamName={teamId === null ? null : (teamNameByTeamId.get(teamId) ?? null)}
            teamNameByTeamId={teamNameByTeamId}
            rail={
              <a className={styles.rail} href={TEASER_ROUTES.home}>
                <span className={styles.railBack} aria-hidden />
                <span className={styles.railBrand}>{teaserSoloGameCopy.backLabel}</span>
                <span className={styles.railTitle}>{game.title}</span>
              </a>
            }
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
          kicker={game.title}
          title={teaserSoloGameCopy.pickerTitle}
          body={game.pickerBody}
          players={roster.players}
          teams={roster.teams}
          teamThemeByTeamId={teamThemeByTeamId}
          serverOrigin={serverOrigin}
          onPick={startTurn}
        />
      )}

      {outcome !== null && teamId !== null && (
        <TeaserSoloFinish
          kicker={outcome.kicker}
          headline={outcome.headline}
          bestLabel={best === null ? null : teaserSoloGameCopy.finishBest(game.formatResult(best))}
          newBestLabel={isNewBest ? teaserSoloGameCopy.finishNewBest : null}
          runAgainLabel={teaserSoloGameCopy.runAgainLabel}
          switchTeamLabel={teaserSoloGameCopy.switchTeamLabel}
          homeLabel={teaserSoloGameCopy.homeLabel}
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
        <p className={styles.rotateTitle}>{teaserSoloGameCopy.rotateTitle}</p>
        <p className={styles.rotateBody}>{teaserSoloGameCopy.rotateBody}</p>
      </div>
    </>
  );
};
