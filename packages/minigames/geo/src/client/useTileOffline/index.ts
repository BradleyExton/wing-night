import { useMemo, useState } from "react";
import type { LeafletEventHandlerFnMap } from "leaflet";

// Whether the chart has a route to the tile server right now: a tile that failed says no, a tile
// that loaded says yes again. Not a latch — a party Wi-Fi that drops and comes back clears the note
// the moment the next tile lands. Spread `tileEventHandlers` onto the chart's `<TileLayer>`.
export const useTileOffline = (): { isOffline: boolean; tileEventHandlers: LeafletEventHandlerFnMap } => {
  const [isOffline, setIsOffline] = useState(false);
  const tileEventHandlers = useMemo<LeafletEventHandlerFnMap>(
    () => ({
      tileerror: (): void => {
        setIsOffline(true);
      },
      tileload: (): void => {
        setIsOffline(false);
      }
    }),
    []
  );

  return { isOffline, tileEventHandlers };
};
