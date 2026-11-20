// PROTOTYPE — throwaway. Every word the run-and-gun jump lab shows.
export const runGunLabCopy = {
  yard: {
    title: "Base Borden — does a jump survive the hop? (controls prototype)",
    joinKicker: "Scan to hold a pad",
    joinFallback: "Open /dev/lab/rungun-pad on a phone on this Wi-Fi",
    keyboardHint: "No phone? Arrows or WASD run and duck here, Space jumps.",
    hidePanel: "Hide panel (H)",
    showPanel: "Tuning (H)",
    resetStats: "Reset numbers",
    noHens: "Waiting for a pad",
    alarm: "!",
    lowHint: "JUMP",
    highHint: "DUCK",
    playerTag: (slot: number): string => `P${slot + 1}`,
    hearts: (hearts: number): string => "♥".repeat(Math.max(0, hearts)) || "×",
    dodgeLine: (dodged: number, faced: number): string =>
      faced === 0 ? "no shots yet" : `dodged ${dodged} of ${faced} · ${Math.round((dodged / faced) * 100)}%`,
    hitsLine: (hits: number, turretsOut: number): string => `hit ${hits}× · ${turretsOut} turrets out`,
    roundTrip: (rttMs: number | null): string =>
      rttMs === null ? "round trip —" : `round trip ${Math.round(rttMs)} ms`,
    keyboardPad: "keyboard"
  },
  tuning: {
    heading: "Rules under test",
    shotSpeed: (value: number): string => `Shots fly ${value} units a second (the yard is 160 wide)`,
    telegraph: (value: number): string => `A turret flashes ${value} ms before it fires`,
    rest: (value: number): string => `${value} ms between shots`,
    forgiveness: (value: number): string => `${value} units shaved off her box (she is 10 by 16)`,
    inputDelay: (value: number): string => `Added input lag ${value} ms`,
    stickAim: "The stick points the sauce",
    showBoxes: "Draw the boxes a shot has to touch"
  },
  pad: {
    rotate: "Turn the phone sideways",
    run: "RUN",
    runHint: "thumb anywhere · pull down to duck",
    jump: "JUMP",
    jumpHint: "tap",
    connecting: "Finding the yard…",
    waiting: "Open the yard on the laptop: /dev/lab/rungun-yard",
    playerTag: (slot: number): string => `P${slot + 1}`,
    hearts: (hearts: number): string => "♥".repeat(Math.max(0, hearts)) || "down",
    roundTrip: (rttMs: number | null): string => (rttMs === null ? "— ms" : `${Math.round(rttMs)} ms`)
  },
  online: {
    title: "Base Borden — online jump lab",
    lede: "Two to four phones, anywhere, in one yard. Jump the low shots, duck the high ones.",
    makeRoom: "Make a room",
    shareHint: "Then send the link to whoever you're playing with.",
    rotate: "Turn the phone sideways",
    connecting: "Finding the room…",
    reconnecting: "Lost the room — trying again…",
    full: "The room is full: you're watching.",
    share: "Share link",
    copied: "Link copied",
    shareTitle: "Base Borden jump lab",
    roomTag: (code: string): string => `Room ${code}`,
    playerTag: (slot: number): string => `P${slot + 1}`,
    hearts: (hearts: number): string => "♥".repeat(Math.max(0, hearts)) || "down",
    dodgeLine: (dodged: number, faced: number): string => (faced === 0 ? "no shots yet" : `dodged ${dodged} of ${faced}`),
    inputLine: (ms: number | null): string => (ms === null ? "thumb → picture —" : `thumb → picture ${Math.round(ms)} ms`),
    pingLine: (ms: number | null): string => (ms === null ? "ping —" : `ping ${Math.round(ms)} ms`)
  }
} as const;
