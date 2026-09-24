import {
  Phase,
  QUICK_PLAY_MIN_TEAMS,
  resolveQuickPlayStartIssues,
  type MinigameType
} from "@wingnight/shared";
import { useMemo, useState } from "react";

import { useHostHandlers } from "../../context/HostHandlersContext";
import { useHostRoomState } from "../../context/RoomStateContext";
import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { ContentFatalState } from "../ContentFatalState";
import { quickPlayLauncherCopy } from "./copy";
import { GameQueue } from "./GameQueue";
import { InProgressNotice } from "./InProgressNotice";
import {
  clearPresent,
  createQuickPlayDraft,
  cyclePlayerSeat,
  moveGame,
  resolveQuickPlayGames,
  resolveQuickPlayTeams,
  setEveryonePresent,
  setGameRule,
  setGameTimer,
  setTeamCount,
  shuffleSeats,
  toggleGame,
  togglePlayer
} from "./quickPlayDraft";
import { RosterPicker } from "./RosterPicker";
import { StartBar } from "./StartBar";
import { TeamDealer } from "./TeamDealer";
import { useQuickPlayHandoff } from "./useQuickPlayHandoff";
import * as styles from "./styles";

// The host tablet's front door for a night that is only the games. Reads the
// pack's roster and teams off room state, holds the host's draft locally, and
// sends one `quickplay:start`; the host shell takes over from there.
export const QuickPlayLauncher = (): JSX.Element => {
  const roomState = useHostRoomState();
  const handlers = useHostHandlers();
  const [draft, setDraft] = useState(createQuickPlayDraft);
  const isHandingOff = useQuickPlayHandoff(roomState, quickPlayLauncherCopy.hostLinkHref);
  const players = useMemo(() => roomState?.players ?? [], [roomState]);
  const presetTeams = useMemo(() => roomState?.teams ?? [], [roomState]);
  const gameConfig = roomState?.gameConfig ?? null;
  const teamThemeByTeamId = useMemo(() => resolveTeamThemeById(presetTeams), [presetTeams]);
  const rosterPlayerIds = useMemo(() => players.map((player) => player.id), [players]);
  const games = resolveQuickPlayGames(draft);
  const teams = resolveQuickPlayTeams(draft, presetTeams);
  const issues = resolveQuickPlayStartIssues({ games, teams });
  const canStart = issues.length === 0 && handlers.onStartQuickPlay !== undefined;

  const header = (
    <div className={styles.headerRow}>
      <div>
        <div className={styles.brandRow}>
          <img
            className={styles.brandMark}
            src={quickPlayLauncherCopy.brandMarkPath}
            alt={quickPlayLauncherCopy.brandMarkAlt}
          />
          <span className={styles.brandLabel}>{quickPlayLauncherCopy.brandLabel}</span>
        </div>
        <p className={styles.eyebrow}>{quickPlayLauncherCopy.eyebrow}</p>
        <h1 className={styles.headline}>{quickPlayLauncherCopy.title}</h1>
        <p className={styles.meta}>{quickPlayLauncherCopy.description}</p>
      </div>
      <nav className={styles.navLinks}>
        <a className={styles.navLink} href={quickPlayLauncherCopy.hostLinkHref}>
          {quickPlayLauncherCopy.hostLinkLabel}
        </a>
        <a className={styles.navLink} href={quickPlayLauncherCopy.homeLinkHref}>
          {quickPlayLauncherCopy.homeLinkLabel}
        </a>
      </nav>
    </div>
  );

  if (roomState?.fatalError) {
    return <ContentFatalState fatalError={roomState.fatalError} />;
  }

  const renderBody = (): JSX.Element => {
    if (roomState === null) {
      return <p className={styles.status}>{quickPlayLauncherCopy.loadingLabel}</p>;
    }

    if (isHandingOff) {
      return <p className={styles.status}>{quickPlayLauncherCopy.handoffLabel}</p>;
    }

    if (roomState.phase !== Phase.SETUP) {
      return <InProgressNotice onResetGame={handlers.onResetGame} />;
    }

    if (presetTeams.length < QUICK_PLAY_MIN_TEAMS) {
      return (
        <section className={styles.notice}>
          <h2 className={styles.noticeTitle}>{quickPlayLauncherCopy.noPresetTeamsTitle}</h2>
          <p>{quickPlayLauncherCopy.noPresetTeamsDescription}</p>
        </section>
      );
    }

    return (
      <>
        <div className={styles.sections}>
          <RosterPicker
            players={players}
            presetTeams={presetTeams}
            teamThemeByTeamId={teamThemeByTeamId}
            draft={draft}
            onTogglePlayer={(playerId): void => {
              setDraft((previous) => togglePlayer(previous, playerId, rosterPlayerIds));
            }}
            onEveryone={(): void => {
              setDraft((previous) => setEveryonePresent(previous, rosterPlayerIds));
            }}
            onClear={(): void => {
              setDraft(clearPresent);
            }}
          />
          <TeamDealer
            players={players}
            presetTeams={presetTeams}
            teamThemeByTeamId={teamThemeByTeamId}
            draft={draft}
            minTeamCount={QUICK_PLAY_MIN_TEAMS}
            maxTeamCount={presetTeams.length}
            onSetTeamCount={(teamCount): void => {
              setDraft((previous) => setTeamCount(previous, teamCount));
            }}
            onShuffle={(): void => {
              setDraft((previous) => shuffleSeats(previous));
            }}
            onCyclePlayerSeat={(playerId): void => {
              setDraft((previous) => cyclePlayerSeat(previous, playerId));
            }}
          />
          <div className={styles.sectionWide}>
            <GameQueue
              gameConfig={gameConfig}
              draft={draft}
              onToggleGame={(minigame: MinigameType): void => {
                setDraft((previous) => toggleGame(previous, minigame, gameConfig));
              }}
              onMoveGame={(minigame, direction): void => {
                setDraft((previous) => moveGame(previous, minigame, direction));
              }}
              onSetRule={(minigame, ruleKey, value): void => {
                setDraft((previous) => setGameRule(previous, minigame, ruleKey, value));
              }}
              onSetTimer={(minigame, timerSeconds): void => {
                setDraft((previous) => setGameTimer(previous, minigame, timerSeconds));
              }}
            />
          </div>
        </div>
        <StartBar
          issues={issues}
          gameCount={games.length}
          teamCount={teams.length}
          playerCount={draft.presentPlayerIds.length}
          canStart={canStart}
          onStart={(): void => {
            handlers.onStartQuickPlay?.(games, teams);
          }}
        />
      </>
    );
  };

  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        {header}
        {renderBody()}
      </div>
    </main>
  );
};
