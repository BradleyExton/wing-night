// PROTOTYPE — throwaway (docs/minigames/ideas/brawl-back-room-finale.md §7).
export const brawlBackRoomLabCopy = {
  title: "Streets of Barrie — the back room",
  description:
    "A throwaway prototype of the finale idea: block three of the real crew sim, with one sleeping body added. Get him out the back before his wallet is empty. Flat shapes on purpose — the question is whether it is fun, not how it looks.",
  stageLabel: "The block",
  controlsLabel: "What to try",
  howLabel: "How to play",
  how: [
    "Player 1: W A S D to walk, Space to peck. On a phone or tablet: left thumb anywhere on the left half walks, right half pecks.",
    "Player 2 (when two people play): arrow keys to walk, Enter to peck.",
    "Carry: stand still beside him for a second and a half and he is on your back. You walk slower. A peck puts him down; so does being hit.",
    "Herd: he is never lifted. Peck him and he slides the way you are facing.",
    "Once you have moved him, one of the staff comes for him and drags him back until somebody pecks it.",
    "The camera will not go on without him. He has to cross the dashed line into the cab."
  ],
  notes:
    "Everyone who is not a person is one of the sim's own brawler bots: they fight and revive, and they never touch him. The staff's drag-back is faked on top of the sim here, so a goon that has hold of him does not honk.",
  restart: "Start again",
  rules: {
    modeLabel: "Moving him",
    modeHint: "The one question the idea file could not answer on paper.",
    mode: { carry: "Carry", herd: "Herd" },
    dragLabel: "The staff put him back",
    drag: { on: "On", off: "Off" },
    clockLabel: "The clock",
    clockHint: "Every other block is 90 seconds. A scripted crew takes about 45 here.",
    clock: { short: "90 s", long: "120 s" },
    chargeLabel: "A bill a song",
    chargeHint: "Off: the wallet only empties at the bell.",
    charge: { on: "On", off: "Off" },
    crewLabel: "Hens on the street",
    humansLabel: "Of which people",
    humansHint: "The rest are bots."
  },
  rooms: {
    lot: "THE LOT",
    floor: "THE FLOOR",
    backRoom: "THE BACK ROOM",
    rearDoor: "THE REAR DOOR",
    patio: "THE PATIO",
    rearLot: "THE REAR LOT"
  },
  scene: {
    sign: "CROSSOVER'S",
    stage: "stage",
    couch: "couch",
    hazard: "POOL TABLES",
    door: "EXIT",
    cab: "CAB",
    bouncer: "BOUNCER",
    onHim: "ON HIM",
    asleep: "z z z",
    player: "P",
    bot: "BOT",
    down: "DOWN"
  },
  hud: {
    wallet: "HIS WALLET",
    wave: "WAVE",
    of: "of",
    clear: "ROOM CLEAR",
    go: "GO ▶",
    getHim: "◀ HE IS STILL BACK THERE",
    charged: "ANOTHER SONG  −$20",
    dropped: "DROPPED",
    gotHim: "GOT HIM",
    start: "Press a key or touch the street to start",
    carryLine: "Stand over him to lift him · a peck puts him down",
    herdLine: "Peck him toward the door"
  },
  end: {
    out: "OUT THE BACK",
    broke: "HIS MONEY IS GONE",
    wipe: "THROWN OUT",
    time: "Time",
    bills: "Bills left",
    worth: "Worth banked",
    lifts: "lifted him",
    drops: "dropped him",
    carried: "carried him",
    units: "units",
    again: "Start again to have another go"
  }
} as const;
