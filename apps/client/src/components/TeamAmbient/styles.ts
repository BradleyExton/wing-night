import type { TextureId } from "@wingnight/shared";

export const layer = "team-ambient pointer-events-none absolute inset-0 z-[1] overflow-hidden";

export const half = "opacity-50";

export const textures: Record<TextureId, string> = {
  lightning: "team-ambient-lightning",
  confetti: "team-ambient-confetti",
  woodgrain: "team-ambient-woodgrain",
  lightdots: "team-ambient-lightdots",
  torn: "team-ambient-torn",
  spray: "team-ambient-spray",
  grid: "team-ambient-grid"
};
