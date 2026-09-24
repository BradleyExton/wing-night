import { expect, test, type Page } from "@playwright/test";
import { devSandboxPath } from "./sandbox";

const collectSocketRequests = (page: Page): string[] => {
  const socketRequests: string[] = [];

  page.on("request", (request) => {
    if (request.url().includes("/socket.io")) {
      socketRequests.push(request.url());
    }
  });

  return socketRequests;
};

test("fappy sandbox starts the clock on the first tap and sends a crashed bird back to its perch", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto(devSandboxPath("fappy"));

  await expect(page.getByRole("heading", { name: "Minigame Dev Sandbox" })).toBeVisible();

  // Both previews draw the same course from the live fixture: two legs of three gates,
  // every gate a champ from the floor.
  await expect(page.locator("[data-fappy-scene]")).toHaveCount(2);
  await expect(page.locator("[data-fappy-gate]")).toHaveCount(6);
  await expect(page.locator("[data-fappy-champ]")).toHaveCount(6);
  await expect(page.getByText("Leg 1 of 2")).toHaveCount(2);
  await expect(page.getByText("Alex is up — tap to take off")).toBeVisible();

  // The relay's running order, as faces, on both screens: Alex is flying it
  // and Caitlin's chip carries the NEXT tag. The fixture roster has no
  // avatars, so a chip wears the player's initials rather than a head.
  const hostLineup = page.locator('[data-fappy-lineup="tablet"]');
  const wallLineup = page.locator('[data-fappy-lineup="wall"]');

  await expect(page.locator("[data-fappy-lineup]")).toHaveCount(2);
  await expect(hostLineup.locator("[data-fappy-lineup-chip]")).toHaveCount(2);
  await expect(hostLineup.locator('[data-fappy-lineup-player="Alex"]')).toHaveAttribute(
    "data-fappy-lineup-state",
    "flying"
  );
  await expect(wallLineup.locator('[data-fappy-lineup-player="Caitlin"]')).toHaveAttribute(
    "data-fappy-lineup-state",
    "next"
  );
  await expect(hostLineup.getByText("Next", { exact: true })).toBeVisible();

  // The on-deck line names the player after the one up next — and says
  // nothing when there is nobody after. The sandbox fixture is a two-leg
  // relay (see the dev manifest), so Caitlin is the last player and no screen
  // may promise a third. The line's positive case is covered by the surfaces'
  // own unit tests, which can build a three-leg view.
  await expect(page.locator("[data-fappy-on-deck]")).toHaveCount(0);
  await expect(page.getByText("Then ", { exact: false })).toHaveCount(0);

  // The whole tablet says whose turn it is while the corridor is still dead,
  // and it can never eat the flap that starts the leg.
  const poster = page.locator('[data-fappy-leg-poster="start"]');

  await expect(poster).toContainText("Alex");
  await expect(poster).toContainText("Tap to fly");
  await expect(poster).toHaveCSS("pointer-events", "none");

  // Caitlin stands ~365 world units down a 160-unit viewport, so a bubble on
  // the bezel stands in for her until her bird scrolls into view.
  await expect(page.locator("[data-fappy-waiter-peek]").first()).toContainText("waiting at the cliff");
  await expect(page.locator("[data-fappy-waiter-peek]").first()).toHaveCSS("opacity", "1");
  // Caitlin waits on the landing cliff of leg 1, on both screens; every bird
  // carries its wing on its own layer so the loop can beat it.
  await expect(page.locator("[data-fappy-waiting-bird]")).toHaveCount(2);
  await expect(page.locator("[data-fappy-bird] [data-character-wing]")).toHaveCount(2);
  await expect(page.locator("[data-fappy-puff]")).toHaveCount(2);
  await expect(page.locator("[data-fappy-clock]").first()).toHaveText(/0:00\.0/);

  // The pace strip is up before anything moves: a bar with par on it, the
  // team's own bird on the start line and the par-pace ghost beside it.
  const paceTrack = page.locator("[data-fappy-pace-track]");

  await expect(paceTrack).toHaveCount(1);
  await expect(paceTrack.locator("[data-fappy-pace-par]")).toHaveCount(1);
  await expect(paceTrack.locator("[data-fappy-pace-bird]")).toHaveCount(1);
  await expect(paceTrack.locator("[data-fappy-pace-ghost]")).toHaveCount(1);
  await expect(paceTrack).toHaveAttribute("data-fappy-pace-past-par", "false");
  // The window's far end is the limit; par is the tick, unlabelled, because the
  // marquee right above already prints it under the points.
  await expect(paceTrack.getByText("1:00")).toBeVisible();

  // No clock yet, so nothing is being spent and neither screen prices it.
  await expect(page.locator("[data-fappy-live-points]")).toHaveCount(0);

  // One tap launches the leg and starts the relay clock; the display mirrors it.
  await page.locator("[data-fappy-arena]").click();

  await expect(page.getByText("Alex is flying — land next to Caitlin")).toBeVisible();
  await expect(page.locator("[data-fappy-clock]").first()).not.toHaveText(/0:00\.0/);

  // And now both screens say what the clock is spending: the round's whole 15
  // while par holds, with par under it. The sandbox fixture banks Team Beta 9
  // points, so both screens also carry the time that would top them — the
  // tablet by name, the wall without one (its renderer props have no team-name
  // lookup).
  await expect(page.locator('[data-fappy-live-points="15"]')).toHaveCount(2);
  await expect(page.getByText("par 0:20")).toHaveCount(2);
  await expect(page.getByText("Beat 0:36 to top Team Beta")).toBeVisible();
  await expect(page.locator("[data-fappy-time-to-beat]")).toHaveText("Beat 0:36 to take the lead");

  // Nobody flaps again, so the bird comes down: the local sim reports the end,
  // the real reducer re-runs the log, and the same player is back on the
  // start line with a crash on the board and the clock still running.
  // The crash count rides Alex's chip. Both screens carry the strip now, so
  // the assertion names the tablet's rather than matching two elements.
  await expect(hostLineup.locator("[data-fappy-crashes='1']")).toBeVisible({ timeout: 8000 });
  await expect(page.getByText("Alex is back on the perch — go again")).toBeVisible();
  await expect(page.getByText("Back on the start cliff. Tap to go again.")).toBeVisible();
  await expect(page.getByText("Leg 1 of 2")).toHaveCount(2);
  // The poster comes back for the second attempt with the other instruction.
  await expect(page.locator('[data-fappy-leg-poster="respawn"]')).toContainText("Tap to go again");

  expect(socketRequests).toHaveLength(0);
});

test("skipping hands the tablet on to the last leg's finish flag, finishing scores by time, and reset restores a fresh relay", async ({
  page
}) => {
  await page.goto(devSandboxPath("fappy"));

  await page.getByRole("button", { name: "Skip leg" }).click();

  await expect(page.getByText("Leg 2 of 2")).toHaveCount(2);
  // The last leg has nobody to hand to: a finish flag stands where the waiter did.
  await expect(page.locator("[data-fappy-waiting-bird]")).toHaveCount(0);
  await expect(page.locator("[data-fappy-finish-flag]")).toHaveCount(2);
  await expect(page.getByText("Caitlin is up — tap to take off")).toBeVisible();

  await page.getByRole("button", { name: "Skip leg" }).click();

  await expect(page.locator("[data-fappy-finish='finished']")).toBeVisible();
  await expect(page.locator("[data-fappy-result='finished']")).toBeVisible();
  await expect(page.getByText("Relay over", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Reset", exact: true }).click();

  await expect(page.getByText("Leg 1 of 2")).toHaveCount(2);
  await expect(page.locator("[data-fappy-clock]").first()).toHaveText(/0:00\.0/);
});

// Flies the host's leg from the page itself: reads the bird and the course
// off the scene each frame and taps when the bird drops under the middle of
// the next gap. Crashes respawn on the perch and it goes again, so a janky
// frame costs a crash, never the test. Resolves once the handoff callout is
// up or the time is spent.
const flyUntilHandoff = (page: Page): Promise<number> => {
  return page.evaluate(() => {
    return new Promise<number>((resolve) => {
      const scene = document.querySelector('[data-fappy-scene="host-fappy"]');
      const arena = document.querySelector("[data-fappy-arena]");
      const bird = scene?.querySelector<HTMLElement>("[data-fappy-bird]");
      const gateLayer = scene?.querySelector("[data-fappy-gates]");

      if (!scene || !arena || !bird || !gateLayer) {
        resolve(-1);
        return;
      }

      // A champ writes where its head is each frame: the loop reads that, never the drawing.
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
        if (document.querySelector("[data-fappy-handoff]") || performance.now() - startedAt > 40_000) {
          resolve(taps);
          return;
        }

        for (const gate of gates) {
          gate.minHead = Math.min(gate.minHead, Number(gate.champ?.getAttribute("data-champ-top") ?? 0));
        }

        const { y, vy, scrollX } = read();

        still = scrollX === lastScroll ? still + 1 : 0;
        lastScroll = scrollX;

        // Standing still on a perch (the start, or after a crash): take off.
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
          const isOverPlateau = 40 >= landingX - scrollX + 6;

          target = isOverPlateau ? 72 : 45.5;
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
  });
};

test("landing next to the waiting bird holds the corridor, tells the room whose tablet it is, then wipes to the next leg", async ({
  page
}) => {
  await page.goto(devSandboxPath("fappy"));
  await expect(page.locator("[data-fappy-scene]")).toHaveCount(2);

  const taps = await flyUntilHandoff(page);

  expect(taps).toBeGreaterThan(0);

  // Both screens drop the callout over the landing: the tablet says who to
  // hand it to, the TV says who is up.
  const hostCallout = page.locator('[data-fappy-handoff="host"]');

  await expect(hostCallout).toContainText("Hand it to");
  await expect(hostCallout).toContainText("Caitlin");
  await expect(page.getByText("Alex landed — pass the tablet to Caitlin. The clock is running.")).toBeVisible();

  const displayCallout = page.locator('[data-fappy-handoff="display"]');

  await expect(displayCallout).toContainText("Caitlin");
  await expect(displayCallout).toContainText("You're up — grab the tablet");
  await expect(page.getByText("Alex is through — Caitlin, grab the tablet")).toBeVisible();

  // Caitlin is the last leg of this two-leg fixture, so neither callout adds
  // an on-deck line; the tablet's strip has ticked Alex off and moved the
  // NEXT tag on, while the wall's is still lit on the leg it is showing.
  await expect(page.locator("[data-fappy-on-deck]")).toHaveCount(0);
  await expect(
    page.locator('[data-fappy-lineup="tablet"] [data-fappy-lineup-player="Alex"]')
  ).toHaveAttribute("data-fappy-lineup-state", "cleared");
  await expect(
    page.locator('[data-fappy-lineup="tablet"] [data-fappy-lineup-player="Caitlin"]')
  ).toHaveAttribute("data-fappy-lineup-state", "flying");

  // The corridors are still leg 1's while the beat plays — the landed bird
  // and the waiter both on the plateau — even though the relay has moved on
  // (the tablet's deck is already on leg 2; the TV's marquee is not).
  await expect(page.locator("[data-fappy-waiting-bird]")).toHaveCount(2);
  await expect(page.getByText("Leg 1 of 2")).toHaveCount(1);
  await expect(page.getByText("Leg 2 of 2")).toHaveCount(1);

  // Then the wipe: leg 2 on both screens, Caitlin on the start cliff, the
  // finish flag where the waiter stood.
  await expect(page.locator("[data-fappy-handoff]")).toHaveCount(0, { timeout: 5000 });
  await expect(page.getByText("Leg 2 of 2")).toHaveCount(2);
  await expect(page.locator("[data-fappy-finish-flag]")).toHaveCount(2);
  await expect(page.getByText("Caitlin is up — tap to take off")).toBeVisible();
  await expect(page.locator("[data-fappy-clock]").first()).not.toHaveText(/0:00\.0/);
});
