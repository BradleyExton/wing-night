import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolvePlayerAppearance, type CharacterAppearance, type CharacterMove } from "@wingnight/cast";
import type { GenreKey, Outfit, OutfitItem, OutfitSlot, OutfitStyle, TeamTheme } from "@wingnight/shared";
import {
  PORTAL_API_ROUTES,
  resolveThemeTeam,
  type PortalMe,
  type PortalTeam
} from "@wingnight/shared/guestPortal";

import { useBeatClock } from "../DisplayBoard/useBeatClock";
import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { usePortalMe } from "../../utils/usePortalMe";
import { usePortalTeams } from "../../utils/usePortalTeams";
import { PortalShell } from "../PortalShell";
import * as shellStyles from "../PortalShell/styles";
import { TEASER_ROUTES } from "../TeaserApp/teaserRoutes";
import { OUTFIT_SLOT_NAMES, portalWardrobeCopy } from "./copy";
import { useOutfitSave } from "./useOutfitSave";
import { WardrobeRail } from "./WardrobeRail";
import { WardrobeStage } from "./WardrobeStage";
import { WardrobeTeam } from "./WardrobeTeam";
import { wardrobeTeamCopy } from "./WardrobeTeam/copy";
import {
  dressOutfitSlot,
  resolveDressMeOutfit,
  resolveGenreOutfit,
  resolveOutfitLooks,
  resolveOutfitSummary,
  resolveWornLookId,
  resolveWornLookOutfit,
  restyleOutfitSlot
} from "./wardrobeState";
import * as styles from "./styles";

const BACK_LINKS = [{ label: portalWardrobeCopy.backLink, href: TEASER_ROUTES.me }];

// No music on the page: the beat clock keeps its own steady 120.
const NO_MUSIC = { current: null };

// /me/wardrobe: the bird's wardrobe for the guest's team (docs/research/bird-wardrobe.md §2.5),
// a page of its own so the phone's back button leaves it. It opens on the team the guest is on;
// with none (or one the roster renamed) there is no rail to show, and it says so. Without a
// session it sends them to sign in, like /me.
export const PortalWardrobe = (): JSX.Element => {
  const { state, update, signOut } = usePortalMe();
  const teams = usePortalTeams(state.kind === "ready");
  const me = state.kind === "ready" ? state.me : null;

  useEffect(() => {
    if (state.kind === "signedOut") {
      window.location.replace(TEASER_ROUTES.signIn);
    }
  }, [state.kind]);

  const themeById = useMemo(
    () =>
      teams.state.kind === "ready"
        ? resolveTeamThemeById(teams.state.teams.teams.map(resolveThemeTeam))
        : new Map<string, TeamTheme>(),
    [teams.state]
  );
  const team =
    teams.state.kind === "ready" ? teams.state.teams.teams.find((entry) => entry.name === me?.team?.teamName) : undefined;
  const theme = team === undefined ? undefined : themeById.get(team.id);

  // A guest with a pick waits for the list that says which team it is; one without needs no list.
  if (me === null || (teams.state.kind !== "ready" && me.team !== null)) {
    const hasFailed = state.kind === "failed" || teams.state.kind === "failed";

    return (
      <PortalShell
        eyebrow={portalWardrobeCopy.eyebrow}
        title={hasFailed ? portalWardrobeCopy.failedTitle : portalWardrobeCopy.loadingTitle}
        links={BACK_LINKS}
      >
        {hasFailed && <p className={shellStyles.voice}>{portalWardrobeCopy.failedBody}</p>}
      </PortalShell>
    );
  }

  if (team === undefined || theme === undefined || me.team === null) {
    return (
      <PortalShell
        eyebrow={portalWardrobeCopy.eyebrow}
        title={portalWardrobeCopy.noTeamTitle}
        links={BACK_LINKS}
        onSignOut={(): void => void signOut()}
      >
        <div className={styles.notice}>
          <p className={shellStyles.voice}>{portalWardrobeCopy.noTeamBody}</p>
          <a className={shellStyles.buttonPrimary} href={TEASER_ROUTES.me}>
            {portalWardrobeCopy.noTeamLink}
          </a>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      eyebrow={team.name}
      title={portalWardrobeCopy.title}
      links={BACK_LINKS}
      onSignOut={(): void => void signOut()}
    >
      <WardrobeEditor
        key={theme.genre}
        me={me}
        team={team}
        theme={theme}
        genre={theme.genre}
        update={update}
      />
    </PortalShell>
  );
};

type WardrobeEditorProps = {
  me: PortalMe;
  team: PortalTeam;
  theme: TeamTheme;
  genre: GenreKey;
  update: (next: (me: PortalMe) => PortalMe) => void;
};

// The wardrobe itself, for one genre: keyed on it, so a genre never inherits another's taps. It
// keeps the page's one beat, flipping `data-beat` on its root as the TV does on its own: the team
// at the foot dances to it, a Move tapped on the stage starts on it, and the Move tiles loop on it.
const WardrobeEditor = ({ me, team, theme, genre, update }: WardrobeEditorProps): JSX.Element => {
  const beatRootRef = useRef<HTMLDivElement | null>(null);
  useBeatClock({ mediaRef: NO_MUSIC, audioUnlocked: false, rootRef: beatRootRef });
  const stored = useMemo(() => resolveGenreOutfit(me.team?.outfitsByGenre, genre), [me.team, genre]);
  const save = useOutfitSave({ genre, stored, update });
  const outfit = save.shown;
  // What the last tap did, said once ("Flying V."); cleared, the line says what the bird has on.
  const [said, setSaid] = useState<string | null>(null);
  const headSrc = me.avatar.headHash === null ? null : `${PORTAL_API_ROUTES.myAvatar}?v=${me.avatar.headHash}`;
  const looks = resolveOutfitLooks(genre);
  const wornLookId = resolveWornLookId(genre, outfit);
  const summary = resolveOutfitSummary(outfit);

  const dressBird = useCallback(
    (worn: Outfit): CharacterAppearance =>
      resolvePlayerAppearance(
        headSrc === null ? { name: me.displayName, outfit: worn } : { name: me.displayName, avatarSrc: headSrc, outfit: worn }
      ),
    [headSrc, me.displayName]
  );

  const dress = (next: Outfit, line: string | null): void => {
    setSaid(line);
    save.dress(next);
  };

  const handleDress = (slot: OutfitSlot, item: OutfitItem | null): void => {
    dress(
      dressOutfitSlot(outfit, slot, item?.id ?? null),
      item === null ? portalWardrobeCopy.slotOff(OUTFIT_SLOT_NAMES[slot]) : portalWardrobeCopy.item(item.name)
    );
  };

  const handleRestyle = (slot: OutfitSlot, style: OutfitStyle): void => {
    dress(restyleOutfitSlot(outfit, slot, style), null);
  };

  const statusText =
    save.status.kind === "failed"
      ? (portalWardrobeCopy.failures[save.status.error] ?? portalWardrobeCopy.failed)
      : (said ?? summary);

  return (
    <div className={styles.cards} ref={beatRootRef}>
      <section className={shellStyles.card} aria-label={portalWardrobeCopy.title}>
        <WardrobeStage
          appearance={dressBird(outfit)}
          theme={theme}
          move={outfit.move?.item as CharacterMove | undefined}
          label={summary}
          beatRootRef={beatRootRef}
        />
        <p
          className={`${save.status.kind === "failed" ? shellStyles.statusError : shellStyles.voice} ${styles.statusLine}`}
          role="status"
          data-testid="wardrobe-status"
          data-save-state={save.status.kind}
        >
          {statusText}
        </p>
        <div className={styles.looks} data-scrolls="x">
          <button
            type="button"
            className={styles.dressMe}
            aria-label={portalWardrobeCopy.dressMeLabel}
            onClick={(): void => dress(resolveDressMeOutfit(genre, Math.random), null)}
            data-testid="wardrobe-dress-me"
          >
            {portalWardrobeCopy.dressMe}
          </button>
          {looks.map((look) => (
            <button
              key={look.id}
              type="button"
              className={look.id === wornLookId ? styles.lookOn : styles.look}
              aria-pressed={look.id === wornLookId}
              onClick={(): void => dress(resolveWornLookOutfit(genre, look), portalWardrobeCopy.look(look.name))}
              data-testid="wardrobe-look"
              data-look={look.id}
            >
              {look.name}
            </button>
          ))}
        </div>
      </section>
      <section className={styles.railCard} aria-label={portalWardrobeCopy.railLabel}>
        <WardrobeRail
          genre={genre}
          theme={theme}
          outfit={outfit}
          dressBird={dressBird}
          onDress={handleDress}
          onRestyle={handleRestyle}
          beatRootRef={beatRootRef}
        />
      </section>
      <section className={shellStyles.card} aria-labelledby="wardrobe-team-title">
        <p id="wardrobe-team-title" className={shellStyles.eyebrow}>
          {wardrobeTeamCopy.eyebrow}
        </p>
        <WardrobeTeam
          members={team.members}
          theme={theme}
          me={{ guestId: me.guestId, displayName: me.displayName, headSrc, outfit }}
        />
        <p className={styles.fine}>
          {team.members.length <= 1 ? `${wardrobeTeamCopy.alone} ` : ""}
          {wardrobeTeamCopy.fine}
        </p>
      </section>
    </div>
  );
};
