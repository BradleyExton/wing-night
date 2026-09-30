import { useEffect, useState } from "react";

// Whether a media query matches, kept current as the window changes. `false`
// on the first paint and wherever there is no window (`react-dom/server`, the
// test harness), so a surface that keys off it renders its narrow form first
// and grows on the effect pass.
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    const sync = (): void => {
      setMatches(list.matches);
    };

    sync();
    list.addEventListener("change", sync);

    return (): void => {
      list.removeEventListener("change", sync);
    };
  }, [query]);

  return matches;
};
