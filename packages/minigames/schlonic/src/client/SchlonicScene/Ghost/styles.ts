// Scene art, licensed by DESIGN.md §2.11: the zone's own near-black, as the edge under the
// ghost's name so it reads over the bay and the sky alike.
const sceneTagEdge = "[stroke:#0d1f14]";

// The ghost's name, in world units over its head: small, bold, and edged. `paint-order` puts
// the edge under the fill.
export const tag = `fill-current text-[4.2px] font-black uppercase tracking-[0.08em] [paint-order:stroke] ${sceneTagEdge} [stroke-width:1.1px] [stroke-linejoin:round]`;
