export const minigameDevSandboxCopy = {
  title: "Minigame Dev Sandbox",
  description:
    "Play a minigame against the real runtime — no full game required.",
  // Which roster, teams and prompt bank the previews are drawn from. Said out
  // loud because a missing content pack and a game with no art look identical.
  contentSourceLabel: {
    pack: "Seeded from the live content pack.",
    fixtureRequested: "Seeded from the bundled fixture, as ?seed=fixture asked.",
    fixtureFallback: "Seeded from the bundled fixture — the content pack is unreachable."
  },
  minigameLabel: "Minigame",
  phaseLabel: "Phase",
  teamLabel: "Whose turn",
  sessionLabel: "Session",
  resetButtonLabel: "Reset",
  // Only for the three games with a room clock: the sandbox's clock is paused
  // at full, so this is the one way to judge the TV's last ten seconds here.
  clockLabel: "Clock",
  rehearseClockButtonLabel: "Run the last ten seconds",
  hostPreviewLabel: "Host Preview",
  hostPreviewMetaLabel: "Tablet · 1280 × 800 landscape",
  displayPreviewLabel: "Display Preview",
  displayPreviewMetaLabel: "TV · 1920 × 1080",
  noRendererLabel: "No renderer bundle is available for this minigame.",
  noRuntimeLabel: "No runtime plugin is available for this minigame.",
  devIndexLinkHref: "/dev",
  devIndexLinkLabel: "All sandboxes",
  introPhaseLabel: "Intro",
  playPhaseLabel: "Play"
} as const;
