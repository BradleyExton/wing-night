// The portal API's paths. A module of its own, importing nothing, because `pnpm pack:pull`
// (tools/pull-guests) runs under plain `node` with type stripping, which resolves no `.js` alias:
// it imports this file and ../export directly, and the rest of guestPortal re-exports them.
//
// The avatar routes, in the order a guest's phone calls them (avatar/index.ts has the types):
//
//   POST photo     body: the downscaled photo as a data URL, sent as text
//                  (`data:image/jpeg;base64,…`, readAvatarPhotoUpload). Replaces any earlier one.
//                  → 200 PortalAvatarStatus · 400 not a photo upload (or no Content-Length)
//                    · 413 too big · 429 tries_exhausted (a photo nobody can paint is not kept)
//   POST generate  no body. Spends a try, then paints from the stored photo (and the style
//                  reference, once Brad has picked one) and streams Gemini's generateContent JSON
//                  back untouched, headers AVATAR_TRIES_LEFT_HEADER and AVATAR_ATTEMPT_ID_HEADER.
//                  The browser parses it with @wingnight/avatar-head's extractGeneratedImage,
//                  which throws with the model's own words when it painted nothing, and keys it
//                  with keyAndCropHead.
//                  → 200 the JSON · 409 no_photo · 429 tries_exhausted · 502 painter_failed
//                  The try that spends the last of a guest's tries also deletes the photo once
//                  Gemini has answered: nothing can paint it again.
//   POST accept?attemptId=<the generate's attempt id>
//                  body: the finished keyed PNG, `Content-Type: image/png` (readAvatarHeadPng).
//                  Stores it as the guest's head and DELETES the photo. A try is kept once.
//                  → 200 PortalAvatarStatus · 404 no such painted try, or one already kept
//                    · 400/413/415 a bad PNG
//   DELETE photo   the guest takes their photo back unpainted → 200 PortalAvatarStatus
//   GET  (myAvatar) the guest's own head as image/png → 404 until there is one
//
// Brad reads any guest's head at resolveAdminGuestAvatarRoute; picks the style reference with
// POST adminStyleReference { guestId } → 200 AdminStyleReference · 404 that guest has no head
// (a reference goes stale, and is dropped, when its guest keeps a different head); and gives a
// guest their tries back, clearing any photo, with POST resolveAdminGuestAvatarResetRoute
// → 200 AdminAvatarReset · 404 no such guest.
//
// The team pick (../teamPick has the types; docs/guest-portal-team-pick-plan.md the rules):
//
//   GET  teams          any session → 200 PortalTeamList: the roster's teams in seating order,
//                       who picked each, the shared seat cap and whether picks are closed
//   PUT  myTeam         body { teamName } (isTeamPickRequest) → 200 PortalTeamPicked
//                       · 400 bad_request (a name the roster does not have) · 409 team_full
//                       · 409 picks_closed. Tapping a tile is the save: no confirm.
//   PUT  myOutfit       body { genre, outfit } (isOutfitRequest; at most OUTFIT_REQUEST_MAX_BYTES)
//                       → 200 PortalOutfitSaved: replaces that genre's outfit, every other
//                       genre's kept; `{}` strips the bird bare there and is kept as such, so
//                       the pull undresses the pack too · 400 bad_request · 400 outfit_invalid
//                       (parseOutfit refused it) · 409 no_team (no seated team, or not one of
//                       that genre) · 413 too_large. Every tap in the wardrobe is a save. Picks
//                       closing does not close the wardrobe (research §2.4).
//   GET  resolveGuestAvatarRoute(guestId)  another guest's kept head as image/png, for the heads
//                       on a team tile → 404 until there is one (the same bytes the TV shows)
//   GET  adminTeams     → 200 AdminTeamBoard: the list plus the unseated
//   POST resolveAdminGuestTeamRoute(guestId)  body { teamName | null } (isAdminTeamSeatRequest):
//                       reseat or unseat, the cap and the switch both ignored → 200 AdminTeamBoard
//                       · 400 a name the roster does not have · 404 no such guest
//   PUT  adminPicks     body { closed } (isAdminPicksRequest) → 200 AdminPicksState
//
// GET adminExport is what the pack pull copies into the night pack (../export has the shape).
export const PORTAL_API_ROUTES = {
  me: "/api/me",
  myTeam: "/api/me/team",
  myOutfit: "/api/me/outfit",
  myAvatar: "/api/me/avatar",
  myAvatarPhoto: "/api/me/avatar/photo",
  myAvatarGenerate: "/api/me/avatar/generate",
  myAvatarAccept: "/api/me/avatar/accept",
  // Only the per-guest head hangs off it (resolveGuestAvatarRoute); there is no list.
  guests: "/api/guests",
  teams: "/api/teams",
  emailLink: "/api/auth/email-link",
  signOut: "/api/auth/sign-out",
  adminGuests: "/api/admin/guests",
  adminInviteAll: "/api/admin/invites",
  adminTeams: "/api/admin/teams",
  adminPicks: "/api/admin/picks",
  adminStyleReference: "/api/admin/style-reference",
  adminExport: "/api/admin/export"
} as const;

export const resolveGuestAvatarRoute = (guestId: string): string =>
  `${PORTAL_API_ROUTES.guests}/${encodeURIComponent(guestId)}/avatar`;

export const resolveAdminGuestRoute = (guestId: string): string =>
  `${PORTAL_API_ROUTES.adminGuests}/${encodeURIComponent(guestId)}`;

export const resolveAdminGuestTeamRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/team`;

export const resolveAdminGuestInviteRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/invite`;

export const resolveAdminGuestLinkRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/link`;

export const resolveAdminGuestSignOutRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/sign-out`;

export const resolveAdminGuestAvatarRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/avatar`;

export const resolveAdminGuestAvatarResetRoute = (guestId: string): string =>
  `${resolveAdminGuestAvatarRoute(guestId)}/reset`;
