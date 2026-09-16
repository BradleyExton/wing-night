import { useEffect, useState } from "react";

import { resolveServerOrigin } from "../resolveServerOrigin";

// Resolves the asset/socket server origin for render, without ever reading
// `window` at render scope: `resolveServerOrigin` touches `window` and
// `import.meta.env`, neither of which exists under `react-dom/server` or the
// `tsx --test` client harness. Callers get `null` on the first paint and the
// real origin on the effect pass, which is exactly what media surfaces want —
// they set a `src` once it is known.
export const useServerOrigin = (): string | null => {
  const [serverOrigin, setServerOrigin] = useState<string | null>(null);

  useEffect(() => {
    try {
      setServerOrigin(resolveServerOrigin());
    } catch {
      // A missing origin must leave the surface renderable, just media-less.
    }
  }, []);

  return serverOrigin;
};
