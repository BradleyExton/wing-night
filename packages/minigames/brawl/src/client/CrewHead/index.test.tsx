import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { resolveHenFigure } from "../resolveHenFigure/index.js";
import { CrewHead, resolveInitials } from "./index.js";

const figure = (avatarSrc: string | null, name = "Steve B") =>
  resolveHenFigure({
    figure: { playerId: "p1", name, avatarSrc, teamId: "team-alpha", genre: null, outfit: null },
    activeTurnTeamId: "team-alpha",
    serverOrigin: "http://server.test"
  });

test("does take two initials at most from a name", () => {
  assert.equal(resolveInitials("Steve B"), "SB");
  assert.equal(resolveInitials("  alex "), "A");
  assert.equal(resolveInitials("Mary Jo Kopechne"), "MJ");
});

test("does draw a player's own generated head, addressed against the server", () => {
  const html = renderToStaticMarkup(<CrewHead figure={figure("avatars/steve.png")} />);

  assert.match(html, /data-brawl-head="photo"/);
  assert.match(html, /src="http:\/\/server\.test\/content-assets\/avatars\/steve\.png"/);
  assert.match(html, /alt="Steve B&#x27;s head"/);
});

test("does fall back to initials in the team's colour, and to the house hen for nobody", () => {
  assert.match(renderToStaticMarkup(<CrewHead figure={figure(null)} />), /data-brawl-head="initials"[^>]*>.*SB/s);
  assert.match(
    renderToStaticMarkup(<CrewHead figure={resolveHenFigure({ figure: null, activeTurnTeamId: "team-alpha", serverOrigin: null })} />),
    /data-brawl-head="hen"/
  );
});
