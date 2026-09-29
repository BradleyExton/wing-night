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

test("schlonic sandbox lays out one leg for both screens and starts the run on the first tap", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto(devSandboxPath("schlonic"));

  await expect(page.getByRole("heading", { name: "Minigame Dev Sandbox" })).toBeVisible();

  // Both previews draw the same leg from the live fixture — the first of two, fourteen chunks, a
  // trench cutting the ground a third of the way in, three of the crowd (a show-goer, a goose and
  // a tent), two pieces of furniture (a bench and a planter), and the kicker only at the finale,
  // over the trench before the post.
  await expect(page.locator("[data-schlonic-scene]")).toHaveCount(2);
  await expect(page.locator("[data-schlonic-ground-run]")).toHaveCount(6);
  await expect(page.locator("[data-schlonic-hazard]")).toHaveCount(6);
  await expect(page.locator('[data-schlonic-hazard-kind="goose"]')).toHaveCount(2);
  await expect(page.locator("[data-schlonic-kicker]")).toHaveCount(2);
  await expect(page.locator("[data-schlonic-rail]")).toHaveCount(4);
  await expect(page.locator('[data-schlonic-ride-on="bench"]')).toHaveCount(2);
  // The high line is drawn bigger, because it is worth more.
  await expect(page.locator('[data-schlonic-wing-worth="2"]').first()).toBeAttached();
  await expect(page.locator("[data-schlonic-goal]")).toHaveCount(2);
  await expect(page.getByText("Leg 1 of 2")).toBeVisible();
  await expect(page.getByText("Alex is on the line — tap to go")).toBeVisible();
  // The wall carries the WHOLE street as a line over the arena — both legs' kit, rails and
  // trenches, the handoff between them and the post — with the runner's pin on the start line.
  const track = page.locator("[data-schlonic-track]");

  await expect(track).toHaveCount(1);
  await expect(track.locator("[data-schlonic-track-hazard]")).toHaveCount(8);
  await expect(track.locator("[data-schlonic-track-pit]")).toHaveCount(4);
  await expect(track.locator("[data-schlonic-track-rail]")).toHaveCount(3);
  await expect(track.locator("[data-schlonic-track-handoff]")).toHaveCount(1);
  await expect(track.locator("[data-schlonic-track-post]")).toHaveCount(1);
  await expect(track).toHaveAttribute("data-schlonic-track-percent", "0");
  await expect(page.locator("[data-schlonic-wings]").first()).toHaveText(/0 \/ 52/);
  await expect(page.locator("[data-schlonic-in-hand]").first()).toHaveText("0");
  // The runner says what its board is on, every frame, beside whether its feet are down.
  const hostRunner = page.locator('[data-schlonic-scene="host-schlonic"] [data-schlonic-runner]');

  await expect(hostRunner).toHaveAttribute("data-schlonic-grinding", "false");
  await expect(hostRunner).toHaveAttribute("data-schlonic-board-roll", "0");

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
      const hazards = [...scene.querySelectorAll("[data-schlonic-hazard]")].map(bboxCentre);
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

  // The strip's pin followed the run down the street: past the hole, a third of the way down
  // the first leg — a sixth of the way down the two-leg street.
  const trackPercent = Number(
    await page.locator("[data-schlonic-track]").getAttribute("data-schlonic-track-percent")
  );

  expect(trackPercent).toBeGreaterThan(15);
  expect(trackPercent).toBeLessThan(50);

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
  await expect(page.getByText("Leg 2 of 2")).toBeVisible({ timeout: 8000 });

  // Nobody races a teammate: the second leg is a different stretch of street, and the first
  // leg's rider is not its ghost whatever it banked.
  await expect(page.locator("[data-schlonic-ghost]")).toHaveCount(0);

  // A finished turn that banked is the turn to beat, and the next team races it leg for leg:
  // finish the turn, hand the sandbox to another team, and the first leg's rider is the ghost in
  // both zones and on the strip, with what the team banked on the marquee as the number to beat.
  // A turn that went down the hole and banked nothing is nobody's ghost.
  const didClear = (await displayPlaque.getAttribute("data-schlonic-outcome")) === "cleared";

  await page.getByRole("button", { name: "Skip run" }).click();
  await expect(page.locator("[data-schlonic-finish='finished']")).toBeVisible();
  await page.getByLabel("Whose turn").selectOption({ index: 1 });
  await expect(page.getByText("Leg 1 of 2")).toBeVisible();

  if (didClear) {
    await expect(page.locator("[data-schlonic-ghost]")).toHaveCount(2);
    await expect(page.locator("[data-schlonic-track-ghost]")).toHaveCount(1);
    await expect(page.locator("[data-schlonic-best]").first()).toBeVisible();
    await expect(page.locator("[data-schlonic-in-hand]").first()).toHaveText("0");
  } else {
    await expect(page.locator("[data-schlonic-ghost]")).toHaveCount(0);
    await expect(page.locator("[data-schlonic-best]")).toHaveCount(0);
  }
});

test("a run that goes into the roadworks peeks out of the trench, loses its wings to a raccoon, and only then gets its card", async ({
  page
}) => {
  await page.goto(devSandboxPath("schlonic"));
  await expect(page.locator("[data-schlonic-scene]")).toHaveCount(2);

  // One tap off the line and never another: the fixture's first hole takes a walker, and the
  // walker has picked up the floor line on the way to it.
  const seen = await page.evaluate(() => {
    return new Promise<{ joke: string | null; cardAtJoke: number; raccoon: boolean; cardAfterMs: number }>(
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
        let raccoon = false;
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

          if (jokeAt > 0 && Number(tv?.querySelector("[data-schlonic-raccoon]")?.getAttribute("opacity")) > 0) {
            raccoon = true;
          }

          if ((jokeAt > 0 && card > 0) || now - startedAt > 20_000) {
            resolve({ joke, cardAtJoke, raccoon, cardAfterMs: jokeAt > 0 ? now - jokeAt : -1 });
            return;
          }

          requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
      }
    );
  });

  expect(seen.joke).toBe("fell");
  // The picture tells the joke first: no card over it, a raccoon climbs out with the handful,
  // and the card follows once it has run off with it.
  expect(seen.cardAtJoke).toBe(0);
  expect(seen.raccoon).toBe(true);
  expect(seen.cardAfterMs).toBeGreaterThan(1500);
  await expect(page.locator('[data-schlonic-outcome="fell"]')).toContainText("Into the roadworks!");
});

test("the board kickflips under the runner the moment it leaves the ground, and lands wheels down", async ({
  page
}) => {
  await page.goto(devSandboxPath("schlonic"));
  await expect(page.locator("[data-schlonic-scene]")).toHaveCount(2);

  const samples = await page.evaluate(() => {
    return new Promise<{ grounded: boolean; roll: number }[]>((resolve) => {
      const scene = document.querySelector('[data-schlonic-scene="host-schlonic"]');
      const arena = document.querySelector("[data-schlonic-arena]");
      const runner = scene?.querySelector("[data-schlonic-runner]");

      if (!scene || !arena || !runner) {
        resolve([]);
        return;
      }

      const send = (type: "pointerdown" | "pointerup"): void => {
        arena.dispatchEvent(
          new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true })
        );
      };
      const sampled: { grounded: boolean; roll: number }[] = [];
      const startedAt = performance.now();

      // Hold the very first tap out: a full jump, which is a full flip.
      send("pointerdown");
      setTimeout(() => {
        send("pointerup");
      }, 300);

      const loop = (): void => {
        sampled.push({
          grounded: runner.getAttribute("data-schlonic-grounded") === "true",
          roll: Number(runner.getAttribute("data-schlonic-board-roll") ?? 0)
        });

        if (performance.now() - startedAt > 1200) {
          resolve(sampled);
          return;
        }

        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    });
  });

  expect(samples.length).toBeGreaterThan(30);
  // The flip is the ollie's whole tell: in the air the board turns over under the feet, so a
  // roll well past a quarter turn means it flipped; on the ground it is always wheels down.
  const airborne = samples.filter((sample) => !sample.grounded);

  expect(airborne.length).toBeGreaterThan(10);
  expect(Math.max(...airborne.map((sample) => sample.roll))).toBeGreaterThan(90);
  expect(samples.filter((sample) => sample.grounded).every((sample) => sample.roll === 0)).toBe(true);
});

test("skipping banks nothing, finishing scores the turn, and reset puts the team back on the line", async ({
  page
}) => {
  await page.goto(devSandboxPath("schlonic"));

  await page.getByRole("button", { name: "Skip run" }).click();

  await expect(page.getByText("Leg 2 of 2")).toBeVisible();
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

  await expect(page.getByText("Leg 1 of 2")).toBeVisible();
  await expect(page.locator("[data-schlonic-wings]").first()).toHaveText(/0 \/ 52/);
});
