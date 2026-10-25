import { Character, resolveCharacterGrooveClassName, resolvePlayerAppearance } from "@wingnight/cast";
import type { Outfit, TeamTheme } from "@wingnight/shared";
import { resolveGuestAvatarRoute, type PortalTeamMember } from "@wingnight/shared/guestPortal";

import { wardrobeTeamCopy } from "./copy";
import * as styles from "./styles";

type WardrobeTeamProps = {
  members: ReadonlyArray<PortalTeamMember>;
  theme: TeamTheme;
  // The guest's own line in the parade, dressed as the page has them now (a tap in flight
  // included), not as GET teams last read them.
  me: { guestId: string; displayName: string; headSrc: string | null; outfit: Outfit };
};

const resolveMemberHeadSrc = (member: PortalTeamMember): string | null =>
  member.headHash === null ? null : `${resolveGuestAvatarRoute(member.guestId)}?v=${member.headHash}`;

// The foot of the wardrobe (research §2.5): everyone who has picked the team, dancing in the
// parade to a steady beat, dressed as they are right now. It is the social proof and the fun
// part, and it lets a team coordinate. The page's beat (PortalWardrobe's) flips `data-beat` on
// the page as the TV's does on its root, and every bird's own groove lands it.
export const WardrobeTeam = ({ members, theme, me }: WardrobeTeamProps): JSX.Element => {
  const line = members.some((member) => member.guestId === me.guestId)
    ? members
    : [...members, { guestId: me.guestId, displayName: me.displayName, headHash: null }];

  return (
    <div className={styles.parade} data-testid="wardrobe-team">
      {line.map((member) => {
        const isMe = member.guestId === me.guestId;
        const outfit = isMe ? me.outfit : member.outfit;
        const headSrc = isMe ? me.headSrc : resolveMemberHeadSrc(member);
        const appearance = resolvePlayerAppearance(
          headSrc === null ? { name: member.displayName, outfit } : { name: member.displayName, avatarSrc: headSrc, outfit }
        );

        return (
          <figure
            key={member.guestId}
            className={`${styles.member} ${resolveCharacterGrooveClassName(member.displayName)}`}
            data-testid="wardrobe-teammate"
            data-guest-name={member.displayName}
          >
            <span className={styles.bird} role="img" aria-label={wardrobeTeamCopy.birdLabel(member.displayName, isMe)}>
              <Character
                appearance={appearance}
                apparel={theme.apparel}
                silhouette={theme.silhouette}
                dance={theme.dance}
                fillClassName={theme.colorVariant.characterFillClassName}
                pose="dance"
                showpieces
              />
            </span>
            <figcaption className={styles.name}>{isMe ? wardrobeTeamCopy.you : member.displayName}</figcaption>
          </figure>
        );
      })}
    </div>
  );
};
