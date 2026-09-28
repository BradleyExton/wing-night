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

test("schlonic sandbox lays out one zone for both screens and starts the run on the first tap", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto(devSandboxPath("schlonic"));

  await expect(page.getByRole("heading", { name: "Minigame Dev Sandbox" })).toBeVisible();

  // Both previews draw the same zone from the live fixture: fourteen chunks, a pit cutting the
  // ground a third of the way in, all four pieces of hard kit somewhere along it, and the
  // finale's springboard and hole before the post.
  await expect(page.locator("[data-schlonic-scene]")).toHaveCount(2);
  await expect(page.locator("[data-schlonic-ground-run]")).toHaveCount(6);
  await expect(page.locator("[data-schlonic-spike]")).toHaveCount(2);
  await expect(page.locator("[data-schlonic-badnik]")).toHaveCount(2);
  await expect(page.locator("[data-schlonic-spring]")).toHaveCount(4);
  // The high line is drawn bigger, because it is worth more.
  await expect(page.locator('[data-schlonic-wing-worth="2"]').first()).toBeAttached();
  await expect(page.locator("[data-schlonic-goal]")).toHaveCount(2);
  await expect(page.getByText("Run 1 of 2")).toBeVisible();
  await expect(page.getByText("Alex is on the line — tap to go")).toBeVisible();
  // The wall carries the zone as a line over the arena: the kit, the hole and the post, with
  // the runner's pin on the start line.
  const track = page.locator("[data-schlonic-track]");

  await expect(track).toHaveCount(1);
  await expect(track.locator("[data-schlonic-track-hazard]")).toHaveCount(4);
  await expect(track.locator("[data-schlonic-track-pit]")).toHaveCount(2);
  await expect(track.locator("[data-schlonic-track-post]")).toHaveCount(1);
  await expect(track).toHaveAttribute("data-schlonic-track-percent", "0");
  await expect(page.locator("[data-schlonic-wings]").first()).toHaveText(/0 \/ 52/);
  await expect(page.locator("[data-schlonic-in-hand]").first()).toHaveText("0");

  // One tap takes the run off the line; the display mirrors it.
  await page.locator("[data-schlonic-arena]").click();

  await expect(page.getByText("Alex is running!")).toBeVisible();

  expect(socketRequests).toHaveLength(0);
});

// The wings are the score and the health at once, so the only honest check is to run the zone.
// Reads the runner's own numbers off the scene each frame — where it is, whether its feet are
// down, what it is holding — and jumps when a hole or a hazard is close ahead, holding the tap
// longer for a hole. Resolves once the run has ended.
type ZoneRun = {
  jumps: number;
  endedAtX: number;
  frames: number;
  mostWingsHeld: number;
  /** The most the chrome's own tally showed: the number the room is watching, off the loop. */
  mostTallyShown: number;
  wasAirborne: boolean;
};

const runUntilHandoff = (page: Page): Promise<ZoneRun> => {
  return page.evaluate(() => {
    return new Promise<ZoneRun>((resolve) => {
      const scene = document.querySelector('[data-schlonic-scene="host-schlonic"]');
      const arena = document.querySelector("[data-schlonic-arena]");
      const runner = scene?.querySelector("[data-schlonic-runner]");
      const tally = document.querySelector("[data-schlonic-in-hand]");

      if (!scene || !arena || !runner || !tally) {
        resolve({
          jumps: -1,
          endedAtX: -1,
          frames: 0,
          mostWingsHeld: 0,
          mostTallyShown: 0,
          wasAirborne: false
        });
        return;
      }

      const bboxCentre = (element: Element): number => {
        const box = (element as SVGGraphicsElement).getBBox();

        return box.x + box.width / 2;
      };
      const hazards = [
        ...scene.querySelectorAll("[data-schlonic-spike], [data-schlonic-badnik]")
      ].map(bboxCentre);
      const runs = [...scene.querySelectorAll("[data-schlonic-ground-run]")]
        .map((element) => {
          const box = (element as SVGGraphicsElement).getBBox();

          return { from: box.x, to: box.x + box.width };
        })
        .sort((left, right) => left.from - right.from);
      const lips = runs.slice(0, -1).map((solid) => solid.to);
      const send = (type: "pointerdown" | "pointerup"): void => {
        arena.dispatchEvent(
          new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true })
        );
      };

      const startedAt = performance.now();
      let jumps = 0;
      let frames = 0;
      let mostWingsHeld = 0;
      let mostTallyShown = 0;
      let wasAirborne = false;
      let isDown = false;
      let releaseAt = 0;
      let hasStarted = false;

      const loop = (): void => {
        const now = performance.now();
        const x = Number(runner.getAttribute("data-schlonic-x") ?? 0);
        const isGrounded = runner.getAttribute("data-schlonic-grounded") === "true";

        frames += 1;
        wasAirborne = wasAirborne || !isGrounded;
        mostWingsHeld = Math.max(
          mostWingsHeld,
          Number(runner.getAttribute("data-schlonic-held-wings") ?? 0)
        );
        mostTallyShown = Math.max(mostTallyShown, Number(tally.textContent ?? 0));

        if (document.querySelector("[data-schlonic-handoff]") || now - startedAt > 45_000) {
          if (isDown) {
            send("pointerup");
          }

          resolve({ jumps, endedAtX: x, frames, mostWingsHeld, mostTallyShown, wasAirborne });
          return;
        }

        if (!hasStarted) {
          hasStarted = true;
          send("pointerdown");
          isDown = true;
          releaseAt = now + 60;
          requestAnimationFrame(loop);
          return;
        }

        if (isDown && now > releaseAt) {
          send("pointerup");
          isDown = false;
          requestAnimationFrame(loop);
          return;
        }

        // Jump as late as the lip allows: an early jump comes down in the hole. A press while
        // already airborne is ignored by the sim, so only try it with both feet down.
        const pitAhead = lips.some((lip) => lip > x + 6 && lip < x + 18);
        const hazardAhead = hazards.some((hazard) => hazard > x + 5 && hazard < x + 18);

        if (!isDown && isGrounded && (pitAhead || hazardAhead)) {
          send("pointerdown");
          isDown = true;
          jumps += 1;
          releaseAt = now + (pitAhead ? 300 : 120);
        }

        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    });
  });
};

test("running the zone collects wings, clears the hole, and hands the tablet on with a tally", async ({
  page
}) => {
  await page.goto(devSandboxPath("schlonic"));
  await expect(page.locator("[data-schlonic-scene]")).toHaveCount(2);

  const { jumps, endedAtX, frames, mostWingsHeld, mostTallyShown, wasAirborne } =
    await runUntilHandoff(page);

  // A throttled tab would step the sim in giant hops and make everything below meaningless.
  expect(frames).toBeGreaterThan(200);
  expect(jumps).toBeGreaterThan(0);
  expect(wasAirborne).toBe(true);
  // Wings are picked up by running through them, and the zone starts with a line of them.
  expect(mostWingsHeld).toBeGreaterThan(4);
  // And the chrome's tally moved with them: the health bar is a live number, not the banked one.
  expect(mostTallyShown).toBeGreaterThan(4);
  // The pit sits a third of the way in; getting past it is what the jumps were for.
  expect(endedAtX).toBeGreaterThan(400);

  // The strip's pin followed the run down the zone: past the hole, a third of the way in.
  const trackPercent = Number(
    await page.locator("[data-schlonic-track]").getAttribute("data-schlonic-track-percent")
  );

  expect(trackPercent).toBeGreaterThan(30);

  // The tablet says who to hand it to; the TV says who is up.
  const hostCallout = page.locator('[data-schlonic-handoff="host"]');

  await expect(hostCallout).toContainText("Hand it to");
  await expect(hostCallout).toContainText("Caitlin");
  // The wall says how the run ended and who is next on ONE card, not two stacked over each other.
  const displayPlaque = page.locator("[data-schlonic-outcome]");

  await expect(displayPlaque).toHaveCount(1);
  await expect(displayPlaque.locator('[data-schlonic-handoff="display"]')).toContainText(
    "You're up — grab the tablet"
  );


  // The server refereed the run from the log and put what it brought home on the board.
  await expect(page.locator("[data-schlonic-history='0']")).not.toContainText("—");
  // A run that went wrong holds for its punchline before the tablet moves on.
  await expect(page.getByText("Run 2 of 2")).toBeVisible({ timeout: 8000 });

  // A run that made the post is the round's best, and the next team races it: hand the sandbox
  // to another team and the ghost is in both zones, on the strip, and on the marquee as the
  // number to beat. A run that went down the hole is nobody's ghost.
  const didClear = (await displayPlaque.getAttribute("data-schlonic-outcome")) === "cleared";

  await page.getByLabel("Whose turn").selectOption({ index: 1 });

  if (didClear) {
    await expect(page.locator("[data-schlonic-ghost]")).toHaveCount(2);
    await expect(page.locator("[data-schlonic-track-ghost]")).toHaveCount(1);
    await expect(page.locator("[data-schlonic-best]").first()).toContainText("To beat · Alex");
  } else {
    await expect(page.locator("[data-schlonic-ghost]")).toHaveCount(0);
  }
});

test("a run that goes down the hole comes up in the bay, loses its wings to a gull, and only then gets its card", async ({
  page
}) => {
  await page.goto(devSandboxPath("schlonic"));
  await expect(page.locator("[data-schlonic-scene]")).toHaveCount(2);

  // One tap off the line and never another: the fixture's first hole takes a walker, and the
  // walker has picked up the floor line on the way to it.
  const seen = await page.evaluate(() => {
    return new Promise<{ joke: string | null; cardAtJoke: number; gull: boolean; cardAfterMs: number }>(
      (resolve) => {
        const arena = document.querySelector("[data-schlonic-arena]");
        const send = (type: "pointerdown" | "pointerup"): void => {
          arena?.dispatchEvent(
            new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true })
          );
        };
        let jokeAt = 0;
        let joke: string | null = null;
        let cardAtJoke = -1;
        let gull = false;
        const startedAt = performance.now();

        send("pointerdown");
        setTimeout(() => {
          send("pointerup");
        }, 40);

        const loop = (): void => {
          const now = performance.now();
          const tv = document.querySelector('[data-schlonic-scene="display-schlonic"]');
          const card = document.querySelectorAll("[data-schlonic-outcome]").length;

          if (jokeAt === 0 && tv?.hasAttribute("data-schlonic-punchline")) {
            jokeAt = now;
            joke = tv.getAttribute("data-schlonic-punchline");
            cardAtJoke = card;
          }

          if (jokeAt > 0 && Number(tv?.querySelector("[data-schlonic-gull]")?.getAttribute("opacity")) > 0) {
            gull = true;
          }

          if ((jokeAt > 0 && card > 0) || now - startedAt > 20_000) {
            resolve({ joke, cardAtJoke, gull, cardAfterMs: jokeAt > 0 ? now - jokeAt : -1 });
            return;
          }

          requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
      }
    );
  });

  expect(seen.joke).toBe("fell");
  // The picture tells the joke first: no card over it, a gull comes for the handful, and the
  // card follows once the gull has gone.
  expect(seen.cardAtJoke).toBe(0);
  expect(seen.gull).toBe(true);
  expect(seen.cardAfterMs).toBeGreaterThan(1500);
  await expect(page.locator('[data-schlonic-outcome="fell"]')).toContainText("Down a hole!");
});

test("the runner curls into a ball the moment it leaves the ground, and unrolls when it lands", async ({
  page
}) => {
  await page.goto(devSandboxPath("schlonic"));
  await expect(page.locator("[data-schlonic-scene]")).toHaveCount(2);

  const angles = await page.evaluate(() => {
    return new Promise<number[]>((resolve) => {
      const scene = document.querySelector('[data-schlonic-scene="host-schlonic"]');
      const arena = document.querySelector("[data-schlonic-arena]");
      const runner = scene?.querySelector("[data-schlonic-runner]");

      if (!scene || !arena || !runner) {
        resolve([]);
        return;
      }

      const readAngle = (): number => {
        const transform = runner.getAttribute("transform") ?? "";

        return Number(transform.match(/rotate\(([-\d.]+)/)?.[1] ?? 0);
      };
      const send = (type: "pointerdown" | "pointerup"): void => {
        arena.dispatchEvent(
          new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true })
        );
      };
      const sampled: number[] = [];
      const startedAt = performance.now();

      // Hold the very first tap out: a full jump, which is a full curl.
      send("pointerdown");
      setTimeout(() => {
        send("pointerup");
      }, 300);

      const loop = (): void => {
        sampled.push(readAngle());

        if (performance.now() - startedAt > 1200) {
          resolve(sampled);
          return;
        }

        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    });
  });

  expect(angles.length).toBeGreaterThan(30);
  // Rolling is the ball's whole tell: on its feet the body only leans with the ground, so an
  // angle well past any slope means it tucked and turned.
  expect(Math.max(...angles.map((angle) => Math.abs(angle)))).toBeGreaterThan(90);
});

test("skipping banks nothing, finishing scores the turn, and reset puts the team back on the line", async ({
  page
}) => {
  await page.goto(devSandboxPath("schlonic"));

  await page.getByRole("button", { name: "Skip run" }).click();

  await expect(page.getByText("Run 2 of 2")).toBeVisible();
  // A skipped run is not a wipeout: the wall announces who is next and nothing about how it went.
  const skippedPlaque = page.locator('[data-schlonic-outcome="skipped"]');

  await expect(skippedPlaque).toContainText("Caitlin");
  await expect(skippedPlaque).not.toContainText("Wiped out");
  await expect(page.getByText("Caitlin is on the line — tap to go")).toBeVisible();

  await page.getByRole("button", { name: "Skip run" }).click();

  await expect(page.locator("[data-schlonic-finish='finished']")).toBeVisible();
  await expect(page.locator("[data-schlonic-result='finished']")).toBeVisible({ timeout: 6000 });
  await expect(page.getByText("0 of 52 wings")).toBeVisible();

  await page.getByRole("button", { name: "Reset turn" }).click();

  await expect(page.getByText("Run 1 of 2")).toBeVisible();
  await expect(page.locator("[data-schlonic-wings]").first()).toHaveText(/0 \/ 52/);
});
