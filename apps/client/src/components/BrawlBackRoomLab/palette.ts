// PROTOTYPE — throwaway. Flat colours for a canvas: nothing here is the game's art.
export const backRoomInk = {
  void: "#050508",
  text: "#f4f4f5",
  muted: "#a1a1aa",
  shadow: "rgba(0, 0, 0, 0.5)",
  seam: "rgba(251, 191, 36, 0.5)",
  hen: "#f97316",
  henDown: "#71717a",
  beak: "#fbbf24",
  sleeper: "#22d3ee",
  gold: "#fbbf24",
  heat: "#ef4444",
  bill: "#22c55e",
  billGone: "#3f3f46",
  hazard: "#a3e635",
  hazardFelt: "#334155",
  cab: "#fbbf24",
  veil: "rgba(5, 5, 8, 0.78)",
  plate: "rgba(5, 5, 8, 0.6)"
} as const;

/** One a slot, the way the street rings its hens. */
export const backRoomSlotColours = ["#22d3ee", "#a3e635", "#f472b6", "#fde047", "#c4b5fd"] as const;

export const backRoomGoonColours = {
  goose: "#9ca3af",
  gull: "#e5e7eb",
  raccoon: "#78716c",
  swan: "#f8fafc",
  helmet: "#60a5fa",
  boss: "#52525b"
} as const;

/** The rooms, left to right: where each starts and ends on the block, its wall and its floor. */
export const backRoomRooms = [
  { key: "lot", from: 0, to: 60, wall: "#0c1024", floor: "#26262b" },
  { key: "floor", from: 60, to: 192, wall: "#15101c", floor: "#2a1736" },
  { key: "backRoom", from: 192, to: 384, wall: "#1d0f1c", floor: "#3a1428" },
  { key: "rearDoor", from: 384, to: 576, wall: "#14161a", floor: "#2b2f36" },
  { key: "patio", from: 576, to: 680, wall: "#0c1024", floor: "#3a3632" },
  { key: "rearLot", from: 680, to: 768, wall: "#0c1024", floor: "#26262b" }
] as const;
