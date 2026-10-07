import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { ensureSetupPhase, lockTeamsFromSetup } from "./hostShell";

// The arcade relays played leg by leg on each contestant's own phone (AGENTS.md §3.5), end to end
// across the four surfaces: the tablet sets the round to phones and keeps every hatch, the leg's
// player's phone draws the game and sends its input, every other phone on the team is told where
// to look, and the TV mirrors whoever holds the leg.
//
// As in player-phone-join.spec.ts, the stack runs on loopback, so the TV's `/lan-addresses` is
// answered with 127.0.0.1 and the QR's URL is one these phone contexts can open.

const PHONE_UPRIGHT = { width: 390, height: 844 };
const PHONE_SIDEWAYS = { width: 844, height: 390 };

type Phone = { context: BrowserContext; page: Page; playerId: string };

// Every device a test opens, closed after it whether it passed or not: a tablet left connected
// from one test is a second host in the next, and the two take the host seat off each other.
const openContexts: BrowserContext[] = [];

const openDevice = async (
  browser: Browser,
  options: Parameters<Browser["newContext"]>[0]
): Promise<{ context: BrowserContext; page: Page }> => {
  const context = await browser.newContext(options);

  openContexts.push(context);

  return { context, page: await context.newPage() };
};

test.afterEach(async () => {
  await Promise.all(openContexts.splice(0).map((context) => context.close()));
});

const openRoom = async (browser: Browser): Promise<{ hostPage: Page; displayPage: Page; joinUrl: string }> => {
  const { page: hostPage } = await openDevice(browser, { viewport: { width: 1280, height: 800 } });
  const { page: displayPage } = await openDevice(browser, { viewport: { width: 1920, height: 1080 } });

  await displayPage.route("**/lan-addresses", (route) =>
    route.fulfill({ json: { addresses: ["127.0.0.1"] } })
  );
  // A reset rotates the join token, so the room is settled before the TV reads one.
  await hostPage.goto("/host");
  await ensureSetupPhase(hostPage);
  await displayPage.goto("/display");

  const joinCard = displayPage.locator("[data-player-join-url]");

  await expect(joinCard).toBeVisible();

  return { hostPage, displayPage, joinUrl: (await joinCard.getAttribute("data-player-join-url")) ?? "" };
};

// The briefing's team as the TV draws it, in seating order — the order its legs are flown in.
const readBriefedTeam = async (displayPage: Page): Promise<string[]> => {
  const members = displayPage.locator("[data-team-briefing] [data-lineup-member]");

  await expect(members.first()).toBeVisible();

  return members.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-lineup-member") ?? "")
  );
};

const seatPhone = async (browser: Browser, joinUrl: string, playerId: string): Promise<Phone> => {
  const { context, page } = await openDevice(browser, { viewport: PHONE_UPRIGHT, isMobile: true, hasTouch: true });

  await page.goto(joinUrl);
  await page.locator(`[data-face-player-id='${playerId}']`).click();
  await expect(page.locator(`[data-player-self='${playerId}']`)).toBeAttached();

  return { context, page, playerId };
};

// The phone whose leg it is draws the game; the wrapper only holds fixed layers, so it is
// attached rather than visible.
const contestantGame = (page: Page, legIndex: number) =>
  page.locator(`[data-contestant-game][data-contestant-leg='${legIndex}']`);

// Quick Play one arcade game, with the first team's turn played out on the tablet: a turn locks
// its device mode when its briefing opens, so the host sets phones during the first briefing and
// it lands on the second team's.
const startQuickPlayWithPhonesFromTeamTwo = async (
  hostPage: Page,
  gameName: string,
  skipLabel: string,
  rules: Record<string, string>
): Promise<void> => {
  await hostPage.getByRole("link", { name: "Quick Play a mini-game" }).click();
  await hostPage.getByRole("button", { name: "Everyone" }).click();
  await hostPage.getByRole("button", { name: `Queue ${gameName}` }).click();

  for (const [label, value] of Object.entries(rules)) {
    await hostPage.getByLabel(label).fill(value);
  }

  await hostPage.getByRole("button", { name: "Start Quick Play" }).click();
  await expect(hostPage.getByRole("button", { name: "Start Mini-Game" })).toBeVisible({ timeout: 15_000 });

  await hostPage.getByRole("button", { name: "Round 1 on phones" }).click();
  await expect(hostPage.getByText("This team's turn: on the tablet. Phones from the next team.")).toBeVisible();

  // The first team plays on the tablet: the hatches clear it.
  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();

  const skip = hostPage.getByRole("button", { name: skipLabel, exact: true });

  await expect(skip).toBeEnabled();
  await expect(hostPage.locator("[data-contestant-monitor]")).toHaveCount(0);

  for (let attempt = 0; attempt < 16 && (await skip.isEnabled()); attempt += 1) {
    await skip.click();
    await hostPage.waitForTimeout(500);
  }

  await hostPage.getByRole("button", { name: "Open host controls" }).click();
  await hostPage.getByRole("button", { name: "End Team Turn" }).click();
  await hostPage.getByRole("button", { name: "Prepare Next Team" }).click();
  await expect(hostPage.getByRole("button", { name: "Start Mini-Game" })).toBeVisible({ timeout: 15_000 });
};

// Flies a FAPPY leg from the page it is drawn on (the fappy sandbox spec's autopilot): reads the
// bird and the course off the scene each frame and taps when the bird drops under the middle of
// the next gap. Resolves when `untilSelector` shows up, the arena leaves the page (the leg left
// this device), or the time is spent.
const flyFappy = (page: Page, untilSelector: string): Promise<number> => {
  return page.evaluate((until) => {
    return new Promise<number>((resolve) => {
      const scene = document.querySelector('[data-fappy-scene="host-fappy"]');
      const arena = document.querySelector("[data-fappy-arena]");
      const bird = scene?.querySelector<HTMLElement>("[data-fappy-bird]");
      const gateLayer = scene?.querySelector("[data-fappy-gates]");

      if (!scene || !arena || !bird || !gateLayer) {
        resolve(-1);
        return;
      }

      const gates = [...scene.querySelectorAll("[data-fappy-gate]")].map((gate) => {
        const champ = gate.querySelector("[data-fappy-champ]");
        const eagleBody = gate.querySelector("[data-fappy-eagle] ellipse");

        return {
          x: Number(champ?.getAttribute("data-champ-x") ?? 0),
          champ,
          minHead: Infinity,
          eagle: gate.querySelector("[data-fappy-eagle]"),
          eagleBottom: eagleBody ? Number(eagleBody.getAttribute("cy")) + 4 : null
        };
      });
      const landingX = 150 + (gates.length - 1) * 66 + 10 + 30;
      const tap = (): void => {
        arena.dispatchEvent(
          new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true })
        );
      };
      const read = (): { y: number; vy: number; scrollX: number } => {
        const y = Number(bird.style.transform.match(/calc\(([-\d.]+) \* var/)?.[1] ?? 0) + 7.2;
        const rotation = Number(bird.style.transform.match(/rotate\(([-\d.]+)deg\)/)?.[1] ?? 0);
        const scroll = gateLayer.getAttribute("transform")?.match(/translate\(([-\d.]+)/)?.[1] ?? "0";

        return { y, vy: rotation / 14, scrollX: -Number(scroll) };
      };
      const startedAt = performance.now();
      let lastTap = -Infinity;
      let lastScroll: number | null = null;
      let still = 0;
      let taps = 0;

      const loop = (): void => {
        if (
          document.querySelector(until) !== null ||
          !document.body.contains(arena) ||
          performance.now() - startedAt > 40_000
        ) {
          resolve(taps);
          return;
        }

        for (const gate of gates) {
          gate.minHead = Math.min(gate.minHead, Number(gate.champ?.getAttribute("data-champ-top") ?? 0));
        }

        const { y, vy, scrollX } = read();

        still = scrollX === lastScroll ? still + 1 : 0;
        lastScroll = scrollX;

        if (still > 30) {
          tap();
          taps += 1;
          still = 0;
          lastTap = performance.now();
          requestAnimationFrame(loop);
          return;
        }

        const next = gates.find((gate) => gate.x + 10 - scrollX > 40 - 4.5);
        let target: number;

        if (next === undefined) {
          target = 40 >= landingX - scrollX + 6 ? 72 : 45.5;
        } else {
          const isEagleGone = next.eagle?.getAttribute("opacity") === "0";
          const top = next.eagleBottom !== null && !isEagleGone ? next.eagleBottom : 0;

          target = (top + next.minHead) / 2 + 1;
        }

        if (y > target && vy > -0.5 && performance.now() - lastTap > 60) {
          tap();
          taps += 1;
          lastTap = performance.now();
        }

        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    });
  }, untilSelector);
};

test("does fly a FAPPY relay leg by leg on two phones, hand off between them and finish a taken-back leg on the tablet", async ({
  browser
}) => {
  test.setTimeout(180_000);

  const { hostPage, displayPage, joinUrl } = await openRoom(browser);

  await startQuickPlayWithPhonesFromTeamTwo(hostPage, "Fappy Bird", "Skip leg", {
    "Legs per turn": "2",
    "Gates per leg": "2"
  });

  // A phones turn nobody on the team has joined from is briefed as the tablet's; the moment a
  // teammate's phone is seated the TV sends the team to their phones, and the phones say so too.
  await expect(displayPage.locator("[data-turn-handset='tablet']")).toHaveText("Grab the tablet");

  const [firstPlayerId, secondPlayerId] = await readBriefedTeam(displayPage);
  const first = await seatPhone(browser, joinUrl, firstPlayerId ?? "");
  const second = await seatPhone(browser, joinUrl, secondPlayerId ?? "");

  await expect(displayPage.locator("[data-turn-handset='phone']")).toHaveText("Grab your phones");

  await expect(first.page.locator("[data-contestant-phone='briefing']")).toBeVisible();

  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();

  // Leg 1 is the first phone's: it draws the game; the second phone is told it is next and never
  // shown the game; the tablet watches the TV's picture with its hatches.
  await expect(contestantGame(first.page, 0)).toBeAttached();
  await expect(second.page.locator("[data-contestant-phone='next']")).toBeVisible();
  await expect(second.page.locator("[data-contestant-game]")).toHaveCount(0);
  await expect(hostPage.locator("[data-contestant-monitor='phone']")).toBeVisible();
  await expect(hostPage.locator("[data-contestant-mirror='FAPPY'] [data-fappy-scene='display-fappy']")).toBeVisible();
  await expect(hostPage.locator("[data-fappy-scene='host-fappy']")).toHaveCount(0);
  await expect(hostPage.getByRole("button", { name: "Skip leg", exact: true })).toBeEnabled();

  // The first phone turns sideways and flies its leg; the TV mirrors the flight and calls the
  // handoff to the next phone.
  await first.page.setViewportSize(PHONE_SIDEWAYS);
  await expect(first.page.locator("[data-fappy-arena]")).toBeVisible();
  await expect(first.page.getByRole("button", { name: "Skip leg" })).toHaveCount(0);
  await expect(first.page.getByRole("button", { name: /Reset/ })).toHaveCount(0);

  const firstTaps = await flyFappy(first.page, "[data-never]");

  expect(firstTaps).toBeGreaterThan(0);
  await expect(displayPage.locator('[data-fappy-handoff="display"]')).toContainText("your phone is live");

  // Leg 2 is the second phone's: it opens on the handoff hold over the game, and the first phone
  // goes back to watching.
  await expect(first.page.locator("[data-contestant-phone='watch']")).toBeVisible();
  await expect(contestantGame(second.page, 1)).toBeAttached();
  // Still upright: the rotate card covers the game, and the hold waits for it to be seen.
  await expect(second.page.locator("[data-phone-rotate]")).toBeVisible();
  await second.page.waitForTimeout(2_500);
  await expect(second.page.locator("[data-contestant-handoff]")).toHaveCount(1);
  await second.page.setViewportSize(PHONE_SIDEWAYS);
  await expect(second.page.locator("[data-phone-rotate]")).toBeHidden();
  await expect(second.page.locator("[data-contestant-handoff]")).toBeVisible();
  await expect(second.page.locator("[data-contestant-handoff]")).toHaveCount(0, { timeout: 5_000 });

  // A few seconds into leg 2, the host takes it back: the leg restarts on the tablet, the phone
  // is told the tablet has it, and the tablet flies the rest of the relay.
  const secondFlight = flyFappy(second.page, "[data-never]");

  await second.page.waitForTimeout(1_500);
  await hostPage.getByRole("button", { name: "Take it back" }).click();
  await secondFlight;
  await expect(second.page.locator("[data-contestant-phone='tablet']")).toBeVisible();
  await expect(hostPage.locator("[data-contestant-monitor]")).toHaveCount(0);
  await expect(hostPage.locator("[data-fappy-scene='host-fappy']")).toBeVisible();

  const tabletTaps = await flyFappy(hostPage, "[data-fappy-finish]");

  expect(tabletTaps).toBeGreaterThan(0);
  await expect(hostPage.locator("[data-fappy-finish='finished']")).toBeVisible();
  await expect(displayPage.locator("[data-fappy-result='finished']")).toBeVisible({ timeout: 10_000 });

  // Reset Game restores the pack's night for the specs that follow.
  await ensureSetupPhase(hostPage);
});

test("does run a Dunlop Dash leg end to end on the contestant's phone when SETUP put the round on phones", async ({
  browser
}) => {
  test.setTimeout(120_000);

  const { hostPage, displayPage, joinUrl } = await openRoom(browser);

  // Round 1 of the sample night is Dunlop Dash: set it to phones before the night starts.
  await hostPage.getByRole("button", { name: "Round 1 on phones" }).click();
  await expect(hostPage.locator("[data-device-mode-round='1'][data-device-mode='phones']")).toBeVisible();
  await lockTeamsFromSetup(hostPage);
  await hostPage.getByRole("button", { name: "Start Game" }).click();
  await expect(hostPage.getByRole("button", { name: "Start Eating" })).toBeVisible({ timeout: 15_000 });
  const [firstPlayerId, secondPlayerId] = await readBriefedTeam(displayPage);
  const rider = await seatPhone(browser, joinUrl, firstPlayerId ?? "");
  const nextRider = await seatPhone(browser, joinUrl, secondPlayerId ?? "");

  await expect(displayPage.locator("[data-turn-handset='phone']")).toHaveText("Grab your phones");

  await hostPage.getByRole("button", { name: "Start Eating" }).click();
  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();

  await rider.page.setViewportSize(PHONE_SIDEWAYS);
  await expect(contestantGame(rider.page, 0)).toBeAttached();
  await expect(hostPage.locator("[data-contestant-monitor='phone']")).toBeVisible();
  await expect(nextRider.page.locator("[data-contestant-phone='next']")).toBeVisible();

  // One tap takes the run off the line on the phone; the TV mirrors it.
  await rider.page.locator("[data-schlonic-arena]").click();
  await expect(displayPage.getByText(/is running!/)).toBeVisible();

  // Nobody steers, so the run ends on its own; the server referees the phone's log and the next
  // rider's phone gets the leg, with the TV saying so.
  await expect(contestantGame(nextRider.page, 1)).toBeAttached({ timeout: 60_000 });
  await expect(displayPage.locator('[data-schlonic-handoff="display"]')).toContainText("your phone is live");
  await expect(rider.page.locator("[data-contestant-phone='watch']")).toBeVisible();

  await ensureSetupPhase(hostPage);
});

test("does run a Streets of Barrie block end to end on the contestant's phone", async ({ browser }) => {
  test.setTimeout(150_000);

  const { hostPage, displayPage, joinUrl } = await openRoom(browser);

  await startQuickPlayWithPhonesFromTeamTwo(hostPage, "Streets of Barrie", "Skip block", {
    "Blocks per turn": "2"
  });

  const [firstPlayerId, secondPlayerId] = await readBriefedTeam(displayPage);
  const brawler = await seatPhone(browser, joinUrl, firstPlayerId ?? "");
  const nextBrawler = await seatPhone(browser, joinUrl, secondPlayerId ?? "");

  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();
  await brawler.page.setViewportSize(PHONE_SIDEWAYS);
  await expect(contestantGame(brawler.page, 0)).toBeAttached();
  await expect(brawler.page.locator('[data-brawl-scene="host-brawl"]')).toBeVisible();
  await expect(hostPage.locator("[data-contestant-mirror='BRAWL'] [data-brawl-display-arena]")).toBeVisible();

  // One peck starts the block's clock; a hen nobody steers is carried into the bay, which ends
  // the block on the phone and hands the next one to the next phone.
  await brawler.page.waitForTimeout(2_000);
  await brawler.page.evaluate(() => {
    const zone = document.querySelector("[data-brawl-peck-zone]");
    const rect = zone?.getBoundingClientRect();

    if (!zone || !rect) {
      throw new Error("no peck zone");
    }

    const init = {
      bubbles: true,
      cancelable: true,
      pointerId: 9,
      isPrimary: true,
      pointerType: "touch",
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };

    zone.dispatchEvent(new PointerEvent("pointerdown", init));
    zone.dispatchEvent(new PointerEvent("pointerup", init));
  });

  await expect(contestantGame(nextBrawler.page, 1)).toBeAttached({ timeout: 90_000 });
  await expect(brawler.page.locator("[data-contestant-phone='watch']")).toBeVisible();

  await ensureSetupPhase(hostPage);
});

test("does load a kind, drag the band and launch a Slingshlong shot from a sideways phone", async ({ browser }) => {
  test.setTimeout(150_000);

  const { hostPage, displayPage, joinUrl } = await openRoom(browser);

  await startQuickPlayWithPhonesFromTeamTwo(hostPage, "Slingshlong", "Skip shot", {});

  const [shooterId] = await readBriefedTeam(displayPage);
  const shooter = await seatPhone(browser, joinUrl, shooterId ?? "");

  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();
  await shooter.page.setViewportSize(PHONE_SIDEWAYS);
  await expect(contestantGame(shooter.page, 0)).toBeAttached();

  const arena = shooter.page.locator("[data-joust-aim-arena]");

  await expect(arena).toBeVisible();
  // The loadout is on the phone at phone scale, and a kind loads from it.
  await shooter.page.getByRole("button", { name: /The Log/ }).click();
  await expect(displayPage.getByText(/is up with The Log/)).toBeVisible();

  // Pull the band back from the fork and let go, the way a thumb does.
  const bounds = await arena.boundingBox();

  expect(bounds).not.toBeNull();

  const box = bounds ?? { x: 0, y: 0, width: 0, height: 0 };
  const scale = Math.min(box.width / 160, box.height / 90);
  const forkX = box.x + (box.width - 160 * scale) / 2 + 40 * scale;
  const forkY = box.y + (box.height - 90 * scale) / 2 + 46 * scale;

  await shooter.page.mouse.move(forkX, forkY);
  await shooter.page.mouse.down();
  await shooter.page.mouse.move(forkX - 11 * scale, forkY + 6 * scale, { steps: 8 });
  await shooter.page.mouse.up();

  // The server simulated the shot and the TV replays it; the next shot is the host's to call.
  await expect(displayPage.locator("[data-joust-result]").first()).toBeVisible({ timeout: 10_000 });
  await expect(hostPage.getByRole("button", { name: "Next shot →" })).toBeEnabled();

  await ensureSetupPhase(hostPage);
});

// A Wi-Fi blink on the contestant's phone, not a reload: the same tab and the same React tree
// lose their WebSocket mid-leg and socket.io reconnects on its own, flushing the input it buffered
// meanwhile. The probe wraps the page's WebSocket so the test can cut it and see what was sent.
const SOCKET_PROBE = (): void => {
  const sockets: WebSocket[] = [];
  const sent: [number, string][] = [];
  const NativeWebSocket = window.WebSocket;

  class ProbedWebSocket extends NativeWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
      sockets.push(this);
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      sent.push([performance.now(), String(data)]);
      super.send(data);
    }
  }

  window.WebSocket = ProbedWebSocket as unknown as typeof WebSocket;
  (window as unknown as { __socketProbe: unknown }).__socketProbe = { sockets, sent };
};

type SocketProbe = { sockets: WebSocket[]; sent: [number, string][] };

test("does keep a FAPPY leg flying on the contestant's phone through a one-second network blink", async ({
  browser
}) => {
  test.setTimeout(180_000);

  const { hostPage, displayPage, joinUrl } = await openRoom(browser);

  await startQuickPlayWithPhonesFromTeamTwo(hostPage, "Fappy Bird", "Skip leg", {
    "Legs per turn": "2",
    "Gates per leg": "3"
  });

  const [firstPlayerId, secondPlayerId] = await readBriefedTeam(displayPage);
  const { context: firstContext, page: firstPage } = await openDevice(browser, {
    viewport: PHONE_UPRIGHT,
    isMobile: true,
    hasTouch: true
  });

  await firstContext.addInitScript(SOCKET_PROBE);
  await firstPage.goto(joinUrl);
  await firstPage.locator(`[data-face-player-id='${firstPlayerId ?? ""}']`).click();
  await expect(firstPage.locator(`[data-player-self='${firstPlayerId ?? ""}']`)).toBeAttached();

  const second = await seatPhone(browser, joinUrl, secondPlayerId ?? "");

  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();
  await firstPage.setViewportSize(PHONE_SIDEWAYS);
  await expect(contestantGame(firstPage, 0)).toBeAttached();
  await expect(firstPage.locator("[data-contestant-handoff]")).toHaveCount(0, { timeout: 5_000 });

  // Everything the phone shows from here on: the game, a hold over it, or a card instead of it.
  await firstPage.evaluate(() => {
    const seen: string[] = [];
    const read = (): string =>
      [
        document.querySelector("[data-contestant-game]") === null ? "" : "game",
        document.querySelector("[data-contestant-handoff]") === null ? "" : "hold",
        document.querySelector("[data-contestant-phone]")?.getAttribute("data-contestant-phone") ?? ""
      ].join("|");
    let last = read();

    seen.push(last);
    new MutationObserver(() => {
      const next = read();

      if (next !== last) {
        seen.push(next);
        last = next;
      }
    }).observe(document.body, { subtree: true, childList: true });
    (window as unknown as { __seen: string[] }).__seen = seen;
  });

  const flight = flyFappy(firstPage, "[data-never]");

  await firstPage.waitForTimeout(1_500);

  const cutAt = await firstPage.evaluate(() => {
    const probe = (window as unknown as { __socketProbe: SocketProbe }).__socketProbe;

    probe.sockets.at(-1)?.close();

    return performance.now();
  });

  // The tablet sees the phone go and puts up the prompt; the phone is back on its own about a
  // second later and the leg is its own again — the host never had to touch it.
  await expect(hostPage.locator("[data-contestant-dropped]")).toBeVisible();
  await expect(hostPage.locator("[data-contestant-monitor='phone']")).toBeVisible({ timeout: 10_000 });

  // The phone flies on, and the leg hands off to the next phone as a clean landing: the server
  // took the flaps the phone buffered while it was away and refereed the whole log.
  await expect(contestantGame(second.page, 1)).toBeAttached({ timeout: 45_000 });
  await flight;

  const report = await firstPage.evaluate((cut) => {
    const probe = (window as unknown as { __socketProbe: SocketProbe }).__socketProbe;
    const actions = probe.sent.filter(([, data]) => data.includes("player:minigameAction"));
    // Nothing reaches the wire while the socket is down: socket.io holds it and flushes it in one
    // burst the moment the phone is back, so the buffered flaps are the first burst after the cut.
    const flushedAt = actions.find(([at]) => at > cut)?.[0] ?? null;

    return {
      seen: (window as unknown as { __seen: string[] }).__seen,
      reconnected: probe.sockets.length > 1,
      flushedAfterMs: flushedAt === null ? null : flushedAt - cut,
      flapsInFlush:
        flushedAt === null
          ? 0
          : actions.filter(([at, data]) => at >= flushedAt && at - flushedAt < 30 && data.includes('"flap"')).length,
      endLegs: actions.filter(([, data]) => data.includes('"endLeg"')).length
    };
  }, cutAt);

  expect(report.reconnected).toBe(true);
  // Never a card, never a second hold, never a fresh runner: one game from start to handoff.
  expect(report.seen.slice(0, -1).every((entry) => entry === "game||")).toBe(true);
  // The leg ended once, at its landing — no early end from a runner remounted mid-leg.
  expect(report.endLegs).toBe(1);
  expect(report.flushedAfterMs ?? 0).toBeGreaterThan(300);
  expect(report.flapsInFlush).toBeGreaterThan(0);
  // No crash on the leg the blink fell in.
  await expect(
    displayPage.locator(`[data-fappy-lineup="wall"] [data-fappy-lineup-chip] [data-fappy-crashes]`)
  ).toHaveCount(0);

  await ensureSetupPhase(hostPage);
});
