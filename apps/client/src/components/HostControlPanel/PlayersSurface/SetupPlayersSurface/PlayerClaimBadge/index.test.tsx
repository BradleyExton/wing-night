import assert from "node:assert/strict";
import test from "node:test";
import type { Team } from "@wingnight/shared";
import { renderToStaticMarkup } from "react-dom/server";

import { resolveTeamThemeById } from "../../../../../utils/resolveTeamTheme";
import { SetupPlayersSurface } from "../index";
import { PlayerClaimBadge } from "./index";

test("does say a phone is in when the claim's socket is live", () => {
  const html = renderToStaticMarkup(
    <PlayerClaimBadge playerName="Rob" isConnected releaseDisabled={false} onRelease={(): void => undefined} />
  );

  assert.match(html, /data-player-claim="connected"/);
  assert.match(html, /Phone in/);
  assert.match(html, /aria-label="Free Rob&#x27;s face from their phone"/);
});

test("does say the phone is asleep and disable release when the host cannot act", () => {
  const html = renderToStaticMarkup(
    <PlayerClaimBadge playerName="Rob" isConnected={false} releaseDisabled onRelease={(): void => undefined} />
  );

  assert.match(html, /data-player-claim="asleep"/);
  assert.match(html, /Asleep/);
  assert.match(html, /disabled=""/);
});

test("does badge only the players whose faces a phone has claimed", () => {
  const teams: Team[] = [];
  const html = renderToStaticMarkup(
    <SetupPlayersSurface
      mode="setup"
      players={[
        { id: "player-1", name: "Alex" },
        { id: "player-2", name: "Morgan" },
        { id: "player-3", name: "Sam" }
      ]}
      teams={teams}
      assignedTeamByPlayerId={new Map()}
      teamThemeByTeamId={resolveTeamThemeById(teams)}
      assignmentDisabled={false}
      addPlayerDisabled={false}
      claimedPlayerIds={["player-2", "player-3"]}
      connectedPlayerIds={["player-2"]}
      onAssignPlayer={(): void => undefined}
      onAddPlayer={(): void => undefined}
      onReleasePlayerClaim={(): void => undefined}
    />
  );

  assert.equal(html.match(/data-player-claim="connected"/g)?.length, 1);
  assert.equal(html.match(/data-player-claim="asleep"/g)?.length, 1);
  assert.doesNotMatch(html, /Free Alex/);
});
