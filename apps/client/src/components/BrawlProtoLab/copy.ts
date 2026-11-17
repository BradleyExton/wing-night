// PROTOTYPE — throwaway. Every word the four-at-once BRAWL controls lab shows.
export const brawlProtoLabCopy = {
  street: {
    title: "Streets of Barrie — four at once (controls prototype)",
    joinKicker: "Scan to hold a pad",
    joinFallback: "Open /dev/lab/brawl-pad on a phone on this Wi-Fi",
    keyboardHint: "No phone? Arrows or WASD walk a hen here, Space pecks.",
    hidePanel: "Hide panel (H)",
    showPanel: "Tuning (H)",
    resetStats: "Reset numbers",
    noHens: "Waiting for a pad",
    honk: "!",
    playerTag: (slot: number): string => `P${slot + 1}`,
    hearts: (hearts: number): string => "♥".repeat(Math.max(0, hearts)) || "×",
    statLine: (pecks: number, landed: number, whiffs: number): string =>
      `${landed}/${pecks} pecks landed · ${whiffs} missed on depth`,
    hitsLine: (kos: number, hits: number): string => `${kos} geese down · hit ${hits}×`,
    roundTrip: (rttMs: number | null): string =>
      rttMs === null ? "round trip —" : `round trip ${Math.round(rttMs)} ms`,
    keyboardPad: "keyboard"
  },
  tuning: {
    heading: "Rules under test",
    depthMode: "Up and down",
    depthModeFree: "Free",
    depthModeLanes: "3 lanes",
    depthBand: (value: number): string => `Peck reaches ±${value} in depth (hen is 16 tall)`,
    autoAlign: "Peck slides her onto the goose's line",
    goonLineUp: "Geese line up before they close",
    depthSpeed: (value: number): string => `Depth speed ${Math.round(value * 100)}% of walk`,
    geese: (value: number): string => `${value} geese at once (+1 per extra hen)`,
    inputDelay: (value: number): string => `Added input lag ${value} ms`,
    showReach: "Draw the peck's reach on the ground",
    teamColours: "Every hen in one team colour",
    on: "On",
    off: "Off"
  },
  pad: {
    rotate: "Turn the phone sideways",
    walk: "WALK",
    walkHint: "thumb anywhere, drag any way",
    peck: "PECK",
    peckHint: "tap or hold",
    connecting: "Finding the street…",
    waiting: "Open the street on the laptop: /dev/lab/brawl-street",
    playerTag: (slot: number): string => `P${slot + 1}`,
    hearts: (hearts: number): string => "♥".repeat(Math.max(0, hearts)) || "down",
    roundTrip: (rttMs: number | null): string => (rttMs === null ? "— ms" : `${Math.round(rttMs)} ms`)
  }
} as const;
